// 규칙 2 화면의 읽기 모델. 명령과 준비 예측은 사본에서 실행한다.
import { cargoSpace, listSailings, routeBetween } from './catalog';
import { workloadSummary } from './capacity';
import { isAvailableFromToday } from './employees';
import { planState } from './engine';
import { offerDef, prepWorkUnitsFor } from './market';
import { formatMoney } from './money';
import { allocateHandling, dailyKrwDue, exchangeAmounts, handlingCapacityPt, isHomePrep, lateDeliveryReduction, projectPrepCompletion,
  rentDueMinor, rentEntryId, spaceCovered, storageCapacityLiters, storageUsedLiters, usdLotKrw } from './operations';
import { payrollRunwayDay } from './previews';
import { preview, type QuotePreview } from './reports';
import { fundsPosition, runningTaskOf, sailingLoad, spaceShortfall } from './reservations';
import type { EngineCommand, ExchangeDirection, GameState, OfferDef, ScenarioConfig } from './types';

function previewId(s: GameState): string {
  let id = 'OPERATIONS-PREVIEW';
  while (s.processedCommands[id]) id += '-';
  return id;
}
export type QuoteOfferIds = { buyOfferId: string; sellOfferId: string } | { offerId: string };
export interface OperationsQuotePreview extends QuotePreview {
  allowed: boolean; reasonKo: string | null;
  quantity: number; maxQuantity: number; quantityStep: number; prepWorkUnits: number;
  volumeLiters: number; massGrams: number; storageAfterLiters: number; storageCapacityLiters: number;
  counterpartySpreadPct: { buy: number | null; sell: number | null };
  serviceClass: OfferDef['serviceClass']; titleKo: string | null;
  contributionPerPrepPtMinor: number; lateDeliveryReductionMinor: number;
  affectedContracts: { contractId: string; readyBefore: number | null; readyAfter: number | null; missesSailing: boolean }[];
}

export function quotePreview(s: GameState, config: ScenarioConfig, offerIds: QuoteOfferIds, quantity?: number): OperationsQuotePreview {
  const trade = 'buyOfferId' in offerIds;
  const buy = offerDef(s, config, trade ? offerIds.buyOfferId : offerIds.offerId);
  const sell = trade ? offerDef(s, config, offerIds.sellOfferId) : buy;
  const q = trade ? quantity ?? buy?.quantity ?? 0 : buy?.quantity ?? 0;
  const command: EngineCommand = trade
    ? { id: previewId(s), type: 'ACCEPT_TRADE', ...offerIds, quantity }
    : { id: previewId(s), type: 'ACCEPT_FORWARDING', ...offerIds };
  const accepted = planState(s, config, [command]);
  const result = accepted.results[0]!, allowed = result.status === 'APPLIED';
  const deadline = (trade ? config.terms.deliveryDeadlineDay : null) ?? sell?.deliveryDeadlineDay ?? config.campaignDays;
  const due = (trade ? config.terms.paymentDueDay : null) ?? sell?.paymentDueDay ?? config.campaignDays;
  const grossSale = trade ? (sell?.unitPriceMinor ?? 0) * q : buy?.serviceFeeMinor ?? 0;
  const route = buy && sell && routeBetween(config, buy.cityId, trade ? sell.cityId : sell.destinationCityId!);
  const base = buy && sell && preview(config, trade ? 'DIRECT_TRADE' : 'FORWARDING', buy.cityId,
    trade ? sell.cityId : sell.destinationCityId!, s.day,
    { purchase: trade ? buy.unitPriceMinor * q : 0, sale: grossSale }, deadline, due);
  // 알 수 없는 견적도 명령의 거절 문장을 반환한다. 계산할 수 없는 수치는 0·일정은 null이다.
  const quote: QuotePreview = base || { kind: trade ? 'DIRECT_TRADE' : 'FORWARDING', routeId: route?.id ?? '',
    purchase: 0, freight: 0, duty: 0, sale: 0, contributionBeforePayroll: 0, cashNeed: 0,
    departureDay: null, arrivalDay: null, deliveryDeadlineDay: deadline, lateOnNextSailing: false,
    paymentDueDay: due, receiptDay: due, schedule: [] };
  const prep = buy ? prepWorkUnitsFor(config, buy, q) : 0;
  const space = buy ? cargoSpace(config, buy.goodId, q) : { volumeLiters: 0, massGrams: 0 };
  const spread = (o: OfferDef | undefined, side: 'BUY' | 'SELL') => trade && o
    ? s.operations?.batches.find((b) => b.publishDay === o.publishDay)?.counterpartyPct
      ?.find((p) => p.goodId === o.goodId && p.side === side)?.pct ?? null : null;
  const affectedContracts: OperationsQuotePreview['affectedContracts'] = [];
  if (allowed) {
    const employee = config.employees.find((e) => isAvailableFromToday(s, e.id)
      && s.employees.find((x) => x.id === e.id)?.locationCityId === config.homeCityId && !runningTaskOf(s, e.id));
    const plan = { employeeId: employee?.id };
    let planned = planState(s, config, [{ ...command, plan }]).state;
    // 정시 인도·준비 완료·남은 선복을 모두 만족하는 첫 편을 예약한다.
    for (const sailing of route ? listSailings(config, route.id, s.day + 1) : []) {
      if (sailing.scheduledArrivalDay + config.terms.customsDays > deadline) break;
      if (spaceShortfall(s, config, sailing, buy!.goodId, q)) continue;
      const trial = planState(s, config, [{ ...command, plan: { ...plan, sailingId: sailing.id } }]);
      if (trial.results[0]!.status !== 'APPLIED') continue;
      const newContract = trial.state.contracts.at(-1)!;
      const ready = projectPrepCompletion(trial.state, config, { assignQueued: true }).find((p) => p.contractId === newContract.id)?.readyDay;
      if (ready !== null && ready !== undefined && ready <= sailing.departureDay) { planned = trial.state; break; }
    }
    const before = projectPrepCompletion(s, config, { assignQueued: true });
    const after = projectPrepCompletion(planned, config, { assignQueued: true });
    for (const p of before) {
      const readyAfter = after.find((a) => a.taskId === p.taskId)!.readyDay;
      if ((readyAfter ?? Infinity) <= (p.readyDay ?? Infinity)) continue;
      const booking = s.bookings.find((b) => b.contractId === p.contractId && b.status === 'BOOKED');
      affectedContracts.push({ contractId: p.contractId, readyBefore: p.readyDay, readyAfter,
        missesSailing: readyAfter === null || (!!booking && booking.departureDay < readyAfter) });
    }
  }
  return { ...quote, allowed, reasonKo: allowed ? null : result.reasonKo, quantity: q,
    maxQuantity: Math.min(buy?.maxQuantity ?? 0, sell?.maxQuantity ?? 0), quantityStep: buy?.quantityStep ?? 0,
    prepWorkUnits: prep, ...space, storageAfterLiters: storageUsedLiters(s, config) + space.volumeLiters,
    storageCapacityLiters: storageCapacityLiters(s, config), counterpartySpreadPct: { buy: spread(buy, 'BUY'), sell: spread(sell, 'SELL') },
    serviceClass: buy?.serviceClass ?? null, titleKo: buy?.titleKo ?? null,
    contributionPerPrepPtMinor: prep > 0 ? Math.floor(quote.contributionBeforePayroll / prep) : 0,
    lateDeliveryReductionMinor: lateDeliveryReduction(config, grossSale, quote.arrivalDay === null ? 0 : quote.arrivalDay + config.terms.customsDays - deadline),
    affectedContracts };
}

export function exchangePreview(s: GameState, config: ScenarioConfig, direction: ExchangeDirection, usdAmountMinor: number) {
  const { state: after, results } = planState(s, config, [{ id: previewId(s), type: 'EXCHANGE_CURRENCY', direction, usdAmountMinor }]);
  const allowed = results[0]!.status === 'APPLIED';
  const { krw: krwMinor, spread: spreadKrwMinor } = exchangeAmounts(config, direction, usdAmountMinor);
  const krwAvailableAfter = fundsPosition(after, config, 'KRW').available, today = dailyKrwDue(s, config, s.day);
  return { allowed, reasonKo: allowed ? null : results[0]!.reasonKo, krwMinor, spreadKrwMinor,
    usdAvailableBefore: fundsPosition(s, config, 'USD').available, usdAvailableAfter: fundsPosition(after, config, 'USD').available,
    krwAvailableBefore: fundsPosition(s, config, 'KRW').available, krwAvailableAfter,
    runwayBefore: payrollRunwayDay(s, config), runwayAfter: payrollRunwayDay(after, config),
    warningKo: allowed && direction === 'KRW_TO_USD' && krwAvailableAfter < today
      ? `환전 뒤 원화 ${formatMoney('KRW', krwAvailableAfter)}으로는 오늘 급여·임차료 ${formatMoney('KRW', today)}을 다 낼 수 없습니다.` : null };
}

function recentBatches(s: GameState) {
  return (s.operations?.batches ?? []).filter((b) => b.k !== 0 && b.publishDay <= s.day)
    .sort((a, b) => a.publishDay - b.publishDay).slice(-4);
}
function batchOffers(s: GameState, publishDay: number) {
  return s.operations!.offers.filter((o) => o.publishDay === publishDay && o.kind !== 'customer');
}
function acceptedPrep(s: GameState, config: ScenarioConfig, publishDay: number, handling: boolean) {
  const ids = new Set(batchOffers(s, publishDay).filter((o) => (o.serviceClass === 'HANDLING') === handling).map((o) => o.id));
  const contracts = new Set(s.contracts.filter((c) => ids.has(c.serviceOfferId ?? c.buyOfferId!)).map((c) => c.id));
  return s.tasks.filter((t) => isHomePrep(t, config) && contracts.has(t.contractId!)).reduce((sum, t) => sum + t.requiredWorkUnits, 0);
}
function candidate(s: GameState, config: ScenarioConfig, id?: string) {
  return config.recruitment?.candidateEmployeeIds.includes(id ?? '') && !s.employees.some((e) => e.id === id && e.employmentStatus === 'employed')
    ? config.employees.find((e) => e.id === id) : undefined;
}
export type BottleneckConstraint = 'DEMAND' | 'STAFF' | 'WAREHOUSE_HANDLING' | 'STORAGE' | 'SAILING';
export interface WeeklyBottleneck {
  unit: 'HANDLING_JOBS_PER_WEEK'; demand: { handlingOffered: number; handlingPt: number; batches: number } | null;
  otherPtPerWeek: number; rows: { constraint: BottleneckConstraint; before: number | null; after: number | null }[];
  binding: { before: BottleneckConstraint[]; after: BottleneckConstraint[] };
  usableBefore: number; usableAfter: number; extraJobsPerWeek: number; remainingHandlingBatches: number;
  contributionPerJobMinor: number; wageKrwPerWeek: number | null; wageUsdLotsPerWeek: number | null;
}
export function weeklyBottleneck(s: GameState, config: ScenarioConfig, candidateId?: string): WeeklyBottleneck {
  const o = config.operations!;
  const templates = o.market.forwarding.templates.filter((t) => t.serviceClass === 'HANDLING');
  const volume = Math.max(...templates.map((t) => cargoSpace(config, t.goodId, t.quantity).volumeLiters));
  const prep = Math.max(...templates.map((t) => t.prepWorkUnits!));
  const batches = recentBatches(s), hire = candidate(s, config, candidateId);
  const offered = batches.reduce((sum, b) => sum + batchOffers(s, b.publishDay).filter((o) => o.serviceClass === 'HANDLING').length, 0);
  const demand = batches.length ? { handlingOffered: offered, handlingPt: offered * prep, batches: batches.length } : null;
  const otherPtPerWeek = batches.length ? Math.floor(batches.reduce((sum, b) => sum + acceptedPrep(s, config, b.publishDay, false), 0) / batches.length) : 0;
  const staff = config.employees.filter((e) => s.employees.some((x) => x.id === e.id && x.employmentStatus === 'employed' && x.locationCityId === config.homeCityId))
    .reduce((sum, e) => sum + e.workUnitsPerDay, 0);
  const routes = config.routes.filter((r) => r.fromCityId === config.homeCityId && templates.some((t) => t.destinationCityId === r.toCityId));
  // 예약은 출항 전날까지다. 노선 간격이 다르면 가장 긴 체류를 기준으로 보관 한도를 추정한다.
  const dwellDays = Math.max(...routes.map((r) => r.departureIntervalDays)) + 1;
  const sailing = routes.reduce((sum, r) => {
    const next = listSailings(config, r.id, s.day + 1)[0];
    if (!next) return sum;
    const load = sailingLoad(s, config, next);
    const mass = Math.max(...templates.filter((t) => t.destinationCityId === r.toCityId).map((t) => cargoSpace(config, t.goodId, t.quantity).massGrams));
    return sum + Math.min(Math.floor(load.capacityLiters / volume), Math.floor(load.capacityGrams / mass));
  }, 0);
  const jobs = (pt: number) => Math.floor(Math.max(0, pt * 7 - otherPtPerWeek) / prep);
  const same = (constraint: BottleneckConstraint, n: number | null) => ({ constraint, before: n, after: n });
  const rows: WeeklyBottleneck['rows'] = [same('DEMAND', demand ? Math.floor(offered / batches.length) : null),
    { constraint: 'STAFF', before: jobs(staff), after: jobs(staff + (hire?.workUnitsPerDay ?? 0)) },
    same('WAREHOUSE_HANDLING', jobs(handlingCapacityPt(s, config))),
    same('STORAGE', Math.floor(storageCapacityLiters(s, config) * 7 / (dwellDays * volume))), same('SAILING', sailing)];
  const usableBefore = Math.min(...rows.flatMap((r) => r.before === null ? [] : [r.before]));
  const usableAfter = Math.min(...rows.flatMap((r) => r.after === null ? [] : [r.after]));
  let remainingHandlingBatches = 0;
  for (let day = o.market.publish.firstDay; day <= o.market.publish.lastDay; day += o.market.publish.intervalDays) {
    if (day > s.day && templates.some((t) => day + t.deadlineOffsetDays <= config.campaignDays && day + t.paymentOffsetDays <= config.campaignDays)) remainingHandlingBatches++;
  }
  const wageKrwPerWeek = hire ? hire.salaryPerDayMinor * 7 : null;
  return { unit: 'HANDLING_JOBS_PER_WEEK', demand, otherPtPerWeek, rows,
    binding: { before: rows.filter((r) => r.before === usableBefore).map((r) => r.constraint), after: rows.filter((r) => r.after === usableAfter).map((r) => r.constraint) },
    usableBefore, usableAfter, extraJobsPerWeek: hire ? usableAfter - usableBefore : 0, remainingHandlingBatches,
    contributionPerJobMinor: Math.min(...templates.map((t) => t.serviceFeeMinor - routeBetween(config, config.homeCityId, t.destinationCityId)!.bookingFeeMinor)),
    wageKrwPerWeek, wageUsdLotsPerWeek: wageKrwPerWeek === null ? null : Math.ceil(wageKrwPerWeek / usdLotKrw(config)) };
}

export function hiringOutlook(s: GameState, config: ScenarioConfig, candidateId: string) {
  const hire = candidate(s, config, candidateId), bottleneck = weeklyBottleneck(s, config, candidateId);
  return { workUnitsPerDay: hire?.workUnitsPerDay ?? 0, wageKrwPerDay: hire?.salaryPerDayMinor ?? 0,
    wageUsdLotsPerWeek: bottleneck.wageUsdLotsPerWeek, bottleneck,
    recentHandlingOfferedPt: bottleneck.demand?.handlingPt ?? 0,
    recentHandlingAcceptedPt: recentBatches(s).reduce((sum, b) => sum + acceptedPrep(s, config, b.publishDay, true), 0) };
}

export function warehouseSummary(s: GameState, config: ScenarioConfig) {
  const allocation = allocateHandling(s, config), waits = allocation.allocations.filter((a) => a.gotPt < a.wantPt);
  const projections = projectPrepCompletion(s, config, { assignQueued: true });
  const home = workloadSummary(s, config).byCity.find((c) => c.cityId === config.homeCityId);
  const open = s.offers.filter((o) => o.status === 'OPEN').map((o) => offerDef(s, config, o.id)!)
    .filter((o) => o.kind !== 'customer' && o.publishDay <= s.day && o.validUntilDay >= s.day);
  const expansion = s.operations?.expansions[0];
  let nextDueDay: number | null = null;
  for (let day = s.day; day <= config.campaignDays; day++) {
    if (rentDueMinor(s, config, day) && !s.ledger.postedIds[rentEntryId(day)]) { nextDueDay = day; break; }
  }
  return { storage: { usedLiters: storageUsedLiters(s, config), capacityLiters: storageCapacityLiters(s, config),
    heldUnallocatedLiters: s.cargoLots.filter((l) => l.locationCityId === config.homeCityId && l.status === 'HELD_UNALLOCATED')
      .reduce((sum, l) => sum + cargoSpace(config, l.goodId, l.quantity).volumeLiters, 0) },
    handling: { capacityPtToday: allocation.capacityPt, plannedUsePtToday: allocation.allocations.reduce((sum, a) => sum + a.gotPt, 0),
      waits, waitTaskCount: waits.length, waitPt: waits.reduce((sum, a) => sum + a.wantPt - a.gotPt, 0) },
    prepDaysToClear: projections.some((p) => p.readyDay === null) ? null : projections.length ? Math.max(...projections.map((p) => p.readyDay!)) - s.day + 1 : 0,
    demand: { batchPublishDay: s.operations?.batches.filter((b) => b.publishDay <= s.day).at(-1)?.publishDay ?? null,
      openVolumeLiters: open.reduce((sum, o) => sum + cargoSpace(config, o.goodId, o.quantity).volumeLiters, 0),
      openPrepPt: open.reduce((sum, o) => sum + prepWorkUnitsFor(config, o, o.quantity), 0),
      recent: recentBatches(s).map((b) => { const offers = batchOffers(s, b.publishDay); return { publishDay: b.publishDay,
        offeredPrepPt: offers.reduce((sum, o) => sum + prepWorkUnitsFor(config, o, o.quantity), 0),
        acceptedPrepPt: acceptedPrep(s, config, b.publishDay, false) + acceptedPrep(s, config, b.publishDay, true),
        handlingOffered: offers.filter((o) => o.serviceClass === 'HANDLING').length, handlingAccepted: acceptedPrep(s, config, b.publishDay, true) }; }) },
    staff: { workUnitsPerDay: home?.staffWorkUnitsPerDay ?? 0, idleWorkUnitsToday: home?.idleWorkUnitsPerDay ?? 0 },
    sailings: config.routes.filter((r) => r.fromCityId === config.homeCityId).flatMap((r) => {
      const next = listSailings(config, r.id, s.day + 1)[0];
      if (!next) return [];
      const load = sailingLoad(s, config, next);
      return [{ sailingId: next.id, usedLiters: load.volumeLiters, capacityLiters: load.capacityLiters,
        usedGrams: load.massGrams, capacityGrams: load.capacityGrams, spaceContract: spaceCovered(s, config, next) }];
    }), rent: { amountMinor: nextDueDay === null ? 0 : rentDueMinor(s, config, nextDueDay), nextDueDay },
    expansion: { status: !expansion ? 'NONE' as const : expansion.effectiveDay > s.day ? 'ORDERED' as const : 'ACTIVE' as const,
      effectiveDay: expansion?.effectiveDay ?? null }, spaceContracts: structuredClone(s.operations?.spaceContracts ?? []), bottleneck: weeklyBottleneck(s, config) };
}
