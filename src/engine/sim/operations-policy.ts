import { listSailings, routeBetween } from '../catalog';
import { isAvailableFromToday } from '../employees';
import { planState } from '../engine';
import { offerDef, openTradePairs, prepWorkUnitsFor } from '../market';
import { dailyKrwDue, handlingOrder, lateDeliveryReduction, projectPrepCompletion, rentDueMinor, usdLotKrw } from '../operations';
import { preview } from '../reports';
import { fundsPosition, runningTaskOf, spaceShortfall } from '../reservations';
import { drawUniform, type RngState } from '../rng';
import type { EngineCommand, GameState, ScenarioConfig } from '../types';
import { candidateFor, type Variant } from './variants';
import type { PolicyDecision } from './policies';

export const rejectionCounts = () => ({ funds: 0, storage: 0, handling: 0, sailing: 0, staff: 0, onTime: 0 });
export function decideOperations(id: string, v: Variant, state: GameState, config: ScenarioConfig, initialRng: RngState): PolicyDecision {
  const commands: EngineCommand[] = [], rejections = rejectionCounts();
  let current = state, rng = initialRng;
  if (v.acceptance === 'IDLE') return { commands, rng, rejections };
  const nextId = () => `SIM-${id}-D${state.day}-${commands.length + 1}`;
  const trial = (cmd: EngineCommand) => planState(current, config, [cmd]);
  const add = (cmd: EngineCommand) => {
    const p = trial(cmd);
    if (p.results[0]!.status !== 'APPLIED') return false;
    commands.push(cmd); current = p.state; return true;
  };
  const recruiter = config.employees.filter((e) => !config.recruitment?.candidateEmployeeIds.includes(e.id)).at(-1);
  const hires = v.hires.map((h) => ({ ...h, candidate: candidateFor(config, h.pt) })).filter((h) => h.candidate);
  const blocks = () => recruiter ? hires.flatMap((h) => {
    const c = current.recruitment.candidates.find((c) => c.employeeId === h.candidate!.id)!;
    if (c.hiredDay !== null && c.hiredDay < state.day) return [];
    const firstHireAttempt = Math.max(h.day, (c.interviewReadyDay ?? h.day - 1) + 1);
    if (c.hiredDay === null && c.interviewReadyDay !== null && state.day > firstHireAttempt + 6) return [];
    // 미래는 예정일을 쓰고, 지연되면 아침마다 연장한다. 고용 당일도 비워 둔다.
    return [{ employeeId: recruiter.id, fromDay: h.day - 3, toDay: c.hiredDay ?? Math.max(h.day, state.day) }];
  }) : [];
  const available = () => config.employees.filter((e) => isAvailableFromToday(current, e.id)
    && current.employees.find((x) => x.id === e.id)?.locationCityId === config.homeCityId && !runningTaskOf(current, e.id)
    && !blocks().some((b) => b.employeeId === e.id && b.fromDay <= state.day && state.day <= b.toDay));
  const projectionSafe = (s: GameState) => {
    const blocked = blocks();
    return projectPrepCompletion(s, config, { assignQueued: true, blocked }).every((p) => {
      const b = s.bookings.find((b) => b.contractId === p.contractId && b.status === 'BOOKED');
      const task = s.tasks.find((t) => t.id === p.taskId)!;
      return (!b || (p.readyDay !== null && p.readyDay <= b.departureDay))
        && !blocked.some((w) => w.employeeId === task.assignedEmployeeId && state.day < w.fromDay && (p.readyDay ?? Infinity) >= w.fromDay);
    });
  };
  for (const d of state.delayDecisions) if (d.choice === null) add({ id: nextId(), type: 'RESPOND_TO_DELAY', noticeId: d.noticeId, shipmentId: d.shipmentId, choice: 'KEEP_SHIPMENT_BOOKING' });
  const ops = config.operations!;
  const expandDay = v.investment === 'SE22' ? 22 : 7;
  const wantsExpand = ['E', 'SE', 'SE22'].includes(v.investment) && state.day >= expandDay && !current.operations!.expansions.length;
  const hireToday = hires.filter((h) => {
    const c = current.recruitment.candidates.find((c) => c.employeeId === h.candidate!.id)!;
    return c.stage === 'INTERVIEW_READY' && state.day >= Math.max(h.day, c.interviewReadyDay! + 1)
      && state.day <= Math.max(h.day, c.interviewReadyDay! + 1) + 6;
  });
  if (v.acceptance !== 'NO_FX' && (!v.react || fundsPosition(current, config, 'KRW').unpaidObligations > 0)) {
    const end = Math.min(config.campaignDays, state.day + (v.react ? 0 : 6));
    let expense = 0;
    for (let day = state.day; day <= end; day++) {
      expense += dailyKrwDue(current, config, day);
      if (wantsExpand && day >= state.day + ops.facility.expansion.effectiveAfterDays && rentDueMinor(current, config, day)) expense += ops.facility.expansion.rentIncreaseMinor;
    }
    expense += (wantsExpand ? ops.facility.expansion.setupFeeMinor : 0)
      + hireToday.reduce((sum, h) => sum + h.candidate!.salaryPerDayMinor * (config.recruitment!.signingFeeWageDays + end - state.day), 0);
    const lots = Math.min(Math.ceil(Math.max(0, expense - fundsPosition(current, config, 'KRW').available) / usdLotKrw(config)),
      Math.max(0, Math.floor(fundsPosition(current, config, 'USD').available / ops.fx.lotUsdMinor)));
    if (lots) add({ id: nextId(), type: 'EXCHANGE_CURRENCY', direction: 'USD_TO_KRW', usdAmountMinor: lots * ops.fx.lotUsdMinor });
  }
  if (wantsExpand) add({ id: nextId(), type: 'EXPAND_WAREHOUSE' });
  if (['S', 'SE', 'SE22'].includes(v.investment) && state.day >= (v.investment === 'SE22' ? 22 : 1)) {
    for (const routeId of ops.spaceContract.routeIds) if (!current.operations!.spaceContracts.some((c) => c.routeId === routeId)) add({ id: nextId(), type: 'SIGN_SPACE_CONTRACT', routeId });
  }
  for (const h of hires) {
    const c = current.recruitment.candidates.find((c) => c.employeeId === h.candidate!.id)!;
    if (c.stage === 'HIRED' || !recruiter) continue;
    if (c.stage === 'UNDISCOVERED' && state.day >= (v.early ? 3 : h.day - 3)) {
      const site = config.recruitment!.scoutSites.find((s) => s.candidateEmployeeIds.includes(c.employeeId))!;
      add({ id: nextId(), type: 'SCOUT_SITE', venueId: site.venueId, employeeId: recruiter.id });
    } else if (c.stage === 'DISCOVERED' && state.day >= h.day - 2) add({ id: nextId(), type: 'START_RECRUIT_QUEST', candidateId: c.employeeId, employeeId: recruiter.id });
    else if (hireToday.some((x) => x.candidate!.id === c.employeeId)) add({ id: nextId(), type: 'HIRE_CANDIDATE', candidateId: c.employeeId });
  }
  const late = v.acceptance === 'LATE_OK' || v.acceptance === 'SEEDED_RANDOM';
  for (const c of current.contracts.filter((c) => ['ACTIVE', 'IN_PROGRESS'].includes(c.status) && !current.shipments.some((s) => s.contractId === c.id))) {
    if (current.bookings.some((b) => b.contractId === c.id && b.status === 'BOOKED')) continue;
    const route = routeBetween(config, c.originCityId, c.destinationCityId);
    const preparation = projectPrepCompletion(current, config, { assignQueued: true, blocked: blocks() }).find((p) => p.contractId === c.id);
    if (preparation?.readyDay === null) continue;
    const ready = preparation?.readyDay;
    const sailings = route ? listSailings(config, route.id, Math.max(state.day + 1, ready ?? state.day + 1)) : [];
    sailings.sort((a, b) => Number(a.scheduledArrivalDay + config.terms.customsDays > c.deliveryDeadlineDay) - Number(b.scheduledArrivalDay + config.terms.customsDays > c.deliveryDeadlineDay));
    for (const s of sailings) {
      if (!late && s.scheduledArrivalDay + config.terms.customsDays > c.deliveryDeadlineDay) continue;
      if (add({ id: nextId(), type: 'BOOK_SAILING', contractId: c.id, sailingId: s.id })) break;
    }
  }
  for (const t of handlingOrder(current, current.tasks.filter((t) => t.status === 'QUEUED' && t.contractId !== null))) {
    for (const e of available()) {
      const cmd: EngineCommand = { id: nextId(), type: 'ASSIGN_TASK', taskId: t.id, employeeId: e.id };
      const p = trial(cmd);
      if (p.results[0]!.status === 'APPLIED' && projectionSafe(p.state)) { commands.push(cmd); current = p.state; break; }
    }
  }
  type Acceptance = Extract<EngineCommand, { type: 'ACCEPT_TRADE' | 'ACCEPT_FORWARDING' }>;
  const candidates: { command: Acceptance; offerId: string; sale: number; contribution: number; deadline: number; routeId: string; quantity: number }[] = [];
  if (v.acceptance !== 'ASSET_LIGHT') for (const pair of openTradePairs(current, config)) {
    const buy = offerDef(current, config, pair.buyOfferId)!, sell = offerDef(current, config, pair.sellOfferId)!;
    for (let q = Math.min(buy.maxQuantity, sell.maxQuantity); q >= buy.quantityStep; q -= buy.quantityStep) {
      const p = preview(config, 'DIRECT_TRADE', buy.cityId, sell.cityId, state.day, { purchase: buy.unitPriceMinor * q, sale: sell.unitPriceMinor * q }, sell.deliveryDeadlineDay!, sell.paymentDueDay!);
      if (p) candidates.push({ command: { id: '', type: 'ACCEPT_TRADE', ...pair, quantity: q }, offerId: buy.id, quantity: q, sale: sell.unitPriceMinor * q,
        contribution: sell.unitPriceMinor * q - p.purchase - p.freight - p.duty, deadline: p.deliveryDeadlineDay, routeId: p.routeId });
    }
  }
  for (const o of current.offers.filter((o) => o.status === 'OPEN').map((o) => offerDef(current, config, o.id)!)) {
    if (o.kind !== 'forwarding' || o.validUntilDay < state.day) continue;
    const p = preview(config, 'FORWARDING', o.cityId, o.destinationCityId!, state.day, { purchase: 0, sale: o.serviceFeeMinor }, o.deliveryDeadlineDay!, o.paymentDueDay!);
    if (p) candidates.push({ command: { id: '', type: 'ACCEPT_FORWARDING', offerId: o.id }, offerId: o.id, quantity: o.quantity, sale: o.serviceFeeMinor,
      contribution: o.serviceFeeMinor - p.freight, deadline: p.deliveryDeadlineDay, routeId: p.routeId });
  }
  candidates.sort((a, b) => (v.acceptance === 'ON_TIME_FIRST' ? a.deadline - b.deadline : 0) || (a.offerId === b.offerId ? b.quantity - a.quantity : b.contribution - a.contribution));
  for (const c of candidates) {
    if (c.contribution <= 0 || !current.offers.some((o) => o.id === c.offerId && o.status === 'OPEN')) continue;
    if (v.acceptance === 'SEEDED_RANDOM') { const d = drawUniform(rng, 'sim.policy.SEEDED_RANDOM'); rng = d.rng; if (d.value >= 0.5) continue; }
    const offer = offerDef(current, config, c.offerId)!;
    const prep = prepWorkUnitsFor(config, offer, c.quantity);
    let reason: keyof typeof rejections = 'onTime', accepted = false;
    for (const s of listSailings(config, c.routeId, state.day + 1)) {
      const daysLate = s.scheduledArrivalDay + config.terms.customsDays - c.deadline;
      if (!late && daysLate > 0) continue;
      if (c.contribution - lateDeliveryReduction(config, c.sale, daysLate) <= 0) continue;
      if (spaceShortfall(current, config, s, offer.goodId, c.quantity)) { reason = 'sailing'; continue; }
      const employees = available();
      for (const employee of employees.length ? employees : [undefined]) {
        const cmd: Acceptance = { ...c.command, id: nextId(), plan: { ...(employee ? { employeeId: employee.id } : {}), sailingId: s.id } };
        const p = trial(cmd), result = p.results[0]!;
        if (result.status !== 'APPLIED') { reason = result.reasonKo.includes('보관') ? 'storage' : result.reasonKo.includes('직원') ? 'staff' : 'funds'; continue; }
        if (prep > 0 && !projectionSafe(p.state)) { reason = 'handling'; continue; }
        commands.push(cmd); current = p.state; accepted = true; break;
      }
      if (accepted) break;
    }
    if (!accepted) rejections[reason]++;
  }
  return { commands, rng, rejections };
}
