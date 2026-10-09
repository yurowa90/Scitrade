// 상태에서 계산하는 보고 값. 별도의 현금·이익을 저장하지 않는다.

import { dutyEstimate, listSailings, offerOf, routeBetween, routeOf } from './catalog';
import { contractAmount, summarize, type BookSummary } from './ledger';
import { cashReservations, spaceShortfall } from './reservations';
import type { Currency } from './money';
import type { Contract, ContractKind, GameState, ScenarioConfig } from './types';

export interface ContractReport {
  contract: Contract;
  /** 직접 무역: 상품 매출. 운송 주선: 서비스 매출. 한 계약에는 한 종류만 있다. */
  netRevenue: number;
  /** 직접 무역: 매출원가(매입+운임+관세). 운송 주선: 주선 원가(외부 운임). */
  directCost: number;
  cancellationExpense: number;
  contribution: number;
}

export function contractReport(s: GameState, contract: Contract): ContractReport {
  const c = contract.currency;
  const amount = (a: Parameters<typeof contractAmount>[3]) => contractAmount(s.ledger, c, contract.id, a);
  const netRevenue = amount('REVENUE') + amount('FORWARDING_REVENUE');
  const directCost = amount('COST_OF_GOODS_SOLD') + amount('FORWARDING_COST');
  const cancellationExpense = amount('CANCELLATION_EXPENSE');
  return {
    contract,
    netRevenue,
    directCost,
    cancellationExpense,
    contribution: netRevenue - directCost - cancellationExpense,
  };
}

export interface CompanyReport {
  trade: BookSummary;
  /** 원화 비용: 급여·영입 계약금·trainingExpense(훈련비)를 따로 집계한다. */
  payroll: BookSummary;
  contracts: ContractReport[];
  /** 회사 소유 재고 수량 (인도 전). 고객 화물은 포함하지 않는다. */
  inventoryUnits: number;
  /** 운송 주선으로 맡고 있는 고객 화물 수량 (회사 자산 아님). */
  customerCargoUnits: number;
}

export function companyReport(s: GameState, config: ScenarioConfig): CompanyReport {
  const held = (owner: 'COMPANY' | 'CUSTOMER') =>
    s.cargoLots
      .filter((l) => l.owner === owner && l.status !== 'DELIVERED' && l.status !== 'RETURNED_TO_OWNER')
      .reduce((a, l) => a + l.quantity, 0);
  return {
    trade: summarize(s.ledger, config.tradeCurrency),
    payroll: summarize(s.ledger, config.payrollCurrency),
    contracts: s.contracts.map((c) => contractReport(s, c)),
    inventoryUnits: held('COMPANY'),
    customerCargoUnits: held('CUSTOMER'),
  };
}

/** 견적 수락 전 비교용 예상치. 지연·취소가 없다는 가정의 계산이며 결과를 보장하지 않는다. */
export interface QuotePreview {
  kind: 'DIRECT_TRADE' | 'FORWARDING';
  routeId: string;
  purchase: number;
  freight: number;
  duty: number;
  /** 직접 무역: 판매대금. 운송 주선: 서비스 대금. */
  sale: number;
  contributionBeforePayroll: number;
  /** 수락하려면 필요한 돈 (M2a 자금 예약 규칙의 기준). */
  cashNeed: number;
  departureDay: number | null;
  arrivalDay: number | null;
  deliveryDeadlineDay: number;
  /** 다음 출항편으로 보내면 납기를 넘기는가. */
  lateOnNextSailing: boolean;
  /** 계약서의 대금일. */
  paymentDueDay: number;
  /** 다음 출항편으로 보낼 때 실제로 받는 날. 인도 전에는 받지 않으므로 계약상 대금일보다 늦을 수 있다. */
  receiptDay: number;
  schedule: { day: number; labelKo: string; amount: number }[];
}

function preview(
  config: ScenarioConfig,
  kind: 'DIRECT_TRADE' | 'FORWARDING',
  fromCityId: string,
  toCityId: string,
  bookingDay: number,
  money: { purchase: number; sale: number },
  deadline: number,
  paymentDueDay: number,
): QuotePreview | null {
  const route = routeBetween(config, fromCityId, toCityId);
  if (!route) return null;
  const sailing = listSailings(config, route.id, bookingDay + 1)[0];
  const freight = route.bookingFeeMinor;
  const duty = kind === 'DIRECT_TRADE' ? dutyEstimate(config, money.purchase) : 0;
  const arrival = sailing ? sailing.scheduledArrivalDay : null;
  const release = arrival === null ? null : arrival + config.terms.customsDays;
  const late = release !== null && release > deadline;
  const sale = money.sale - (late ? config.terms.lateDeliveryPriceReductionMinor : 0);
  const due = release === null ? paymentDueDay : Math.max(paymentDueDay, release);
  const schedule: QuotePreview['schedule'] = [];
  if (money.purchase) schedule.push({ day: bookingDay, labelKo: '매입 대금 지급', amount: -money.purchase });
  schedule.push({ day: bookingDay, labelKo: '운임 선지급', amount: -freight });
  if (arrival !== null) {
    schedule.push(duty
      ? { day: arrival, labelKo: '도착·관세 지급', amount: -duty }
      : { day: arrival, labelKo: '도착 (고객 화물: 관세는 수입자 부담)', amount: 0 });
  }
  if (release !== null) schedule.push({ day: release, labelKo: kind === 'FORWARDING' ? '인도: 주선 매출·채권 인식 (현금 변화 없음)' : '인도: 매출·채권 인식 (현금 변화 없음)', amount: 0 });
  schedule.push({ day: due, labelKo: '외상대금 수금', amount: sale });
  return {
    kind,
    routeId: route.id,
    purchase: money.purchase,
    freight,
    duty,
    sale,
    contributionBeforePayroll: sale - money.purchase - freight - duty,
    cashNeed: money.purchase + freight + duty,
    departureDay: sailing?.departureDay ?? null,
    arrivalDay: arrival,
    deliveryDeadlineDay: deadline,
    lateOnNextSailing: late,
    paymentDueDay,
    receiptDay: due,
    schedule,
  };
}

export function tradePreview(config: ScenarioConfig, buyOfferId: string, sellOfferId: string, bookingDay: number): QuotePreview | null {
  const buy = offerOf(config, buyOfferId);
  const sell = offerOf(config, sellOfferId);
  if (!buy || !sell) return null;
  return preview(
    config,
    'DIRECT_TRADE',
    buy.cityId,
    sell.cityId,
    bookingDay,
    { purchase: buy.unitPriceMinor * buy.quantity, sale: sell.unitPriceMinor * sell.quantity },
    config.terms.deliveryDeadlineDay ?? sell.deliveryDeadlineDay ?? config.campaignDays,
    config.terms.paymentDueDay ?? sell.paymentDueDay ?? config.campaignDays,
  );
}

export function forwardingPreview(config: ScenarioConfig, offerId: string, bookingDay: number): QuotePreview | null {
  const offer = offerOf(config, offerId);
  if (!offer?.destinationCityId) return null;
  return preview(
    config,
    'FORWARDING',
    offer.cityId,
    offer.destinationCityId,
    bookingDay,
    { purchase: 0, sale: offer.serviceFeeMinor },
    offer.deliveryDeadlineDay ?? config.campaignDays,
    offer.paymentDueDay ?? config.campaignDays,
  );
}

/** 시나리오에서 묶을 수 있는 직접 무역 쌍 (같은 상품·같은 수량, 노선 있음). */
export function tradePairs(config: ScenarioConfig): { buyOfferId: string; sellOfferId: string }[] {
  const pairs: { buyOfferId: string; sellOfferId: string }[] = [];
  for (const buy of config.offers.filter((o) => o.kind === 'supplier')) {
    for (const sell of config.offers.filter((o) => o.kind === 'customer')) {
      if (buy.goodId === sell.goodId && buy.quantity === sell.quantity && routeBetween(config, buy.cityId, sell.cityId)) {
        pairs.push({ buyOfferId: buy.id, sellOfferId: sell.id });
      }
    }
  }
  return pairs;
}

export interface DeliveryFilter {
  currency?: Currency;
  kind?: ContractKind;
  /** 고객 또는 공급자 ID와 일치하는 계약. */
  partyId?: string;
}

export interface OnTimeDelivery {
  delivered: number;
  onTime: number;
  late: number;
  /** 정시 건수 × 10000 ÷ 인도 건수의 내림. 인도 실적이 없으면 null. */
  rateBasisPoints: number | null;
  /** 분모에서 제외하는 납기 경과 미인도 계약. */
  pastDeadlineUndelivered: number;
}

export function onTimeDeliveryRate(s: GameState, filter: DeliveryFilter = {}): OnTimeDelivery {
  let onTime = 0;
  let late = 0;
  let pastDeadlineUndelivered = 0;
  for (const c of s.contracts) {
    if (c.status === 'CANCELLED'
      || (filter.currency !== undefined && c.currency !== filter.currency)
      || (filter.kind !== undefined && c.kind !== filter.kind)
      || (filter.partyId !== undefined && c.customerId !== filter.partyId && c.supplierId !== filter.partyId)) continue;
    if (c.deliveredDay === null) {
      if (c.deliveryDeadlineDay < s.day) pastDeadlineUndelivered++;
    } else if (c.deliveredDay <= c.deliveryDeadlineDay) onTime++;
    else late++;
  }
  const delivered = onTime + late;
  return { delivered, onTime, late, rateBasisPoints: delivered ? Math.floor(onTime * 10000 / delivered) : null, pastDeadlineUndelivered };
}

export type UpcomingPaymentKind = 'OVERDUE' | 'WAGE' | 'FREIGHT' | 'DUTY';

export interface UpcomingPayment {
  kind: UpcomingPaymentKind;
  currency: Currency;
  amountMinor: number;
  /** 발생일·급여일·예약 마감일·도착 예정일. 미정이면 null. */
  day: number | null;
  trigger: 'AUTO' | 'ON_BOOKING' | 'OVERDUE';
  contractId: string | null;
  employeeIds: string[];
  /** (kind, sourceId)로 행을 식별한다. 급여는 날짜와 통화를 함께 쓴다. */
  sourceId: string;
  labelKo: string;
}

/**
 * 표시용 지급 일정. 급여를 계약 자금 예약에 추가하지 않는다.
 * `throughDay`는 캠페인 마지막 날(`config.campaignDays`)로 잘린다. 엔진은 그 뒤 날을 처리하지 않는다.
 */
export function upcomingPayments(
  s: GameState,
  config: ScenarioConfig,
  throughDay: number = Math.min(config.campaignDays, s.day + 6),
): UpcomingPayment[] {
  const overdue: UpcomingPayment[] = s.obligations.filter((o) => o.paidDay === null).map((o) => ({
    kind: 'OVERDUE', currency: o.currency, amountMinor: o.amountMinor, day: o.incurredDay,
    trigger: 'OVERDUE', contractId: null, employeeIds: [], sourceId: o.id, labelKo: `미지급: ${o.reasonKo}`,
  }));
  overdue.sort((a, b) => a.day! - b.day! || compareText(a.sourceId, b.sourceId));
  if (s.phase === 'ENDED') return overdue;

  const last = Math.min(throughDay, config.campaignDays);
  const rows: UpcomingPayment[] = [];
  for (let day = s.day; day <= last; day++) {
    const wages = new Map<Currency, UpcomingPayment>();
    for (const emp of s.employees) {
      if (emp.employmentStatus !== 'employed' || emp.availableFromDay > day) continue;
      const def = config.employees.find((e) => e.id === emp.id);
      if (!def || def.salaryPerDayMinor <= 0) continue;
      let row = wages.get(def.salaryCurrency);
      if (!row) {
        row = { kind: 'WAGE', currency: def.salaryCurrency, amountMinor: 0, day, trigger: 'AUTO',
          contractId: null, employeeIds: [], sourceId: `WAGE-D${String(day).padStart(3, '0')}-${def.salaryCurrency}`, labelKo: '' };
        wages.set(def.salaryCurrency, row);
      }
      row.amountMinor += def.salaryPerDayMinor;
      row.employeeIds.push(emp.id);
    }
    for (const row of wages.values()) {
      row.labelKo = `${row.employeeIds.length}명 급여`;
      rows.push(row);
    }
  }
  for (const reservation of cashReservations(s, config)) {
    const c = s.contracts.find((c) => c.id === reservation.contractId)!;
    let day: number | null = null;
    if (reservation.kind === 'FREIGHT') {
      const route = routeBetween(config, c.originCityId, c.destinationCityId);
      const sailing = route && listSailings(config, route.id, s.day + 1)
        .find((sailing) => spaceShortfall(s, config, sailing, c.goodId, c.quantity) === null);
      if (sailing) day = sailing.departureDay - 1;
    } else {
      const shipment = s.shipments.find((sh) => sh.contractId === c.id);
      const booking = s.bookings.find((b) => b.id === c.bookingId && b.status !== 'CANCELLED');
      if (shipment) day = Math.max(shipment.scheduledArrivalDay, s.day);
      else if (booking) day = booking.departureDay + routeOf(config, booking.routeId).transitDays;
    }
    if (day !== null && day > last) continue;
    rows.push({ ...reservation, day, trigger: reservation.kind === 'FREIGHT' ? 'ON_BOOKING' : 'AUTO',
      employeeIds: [], sourceId: c.id,
      labelKo: reservation.kind === 'FREIGHT' ? `${c.id} 운임 (예약 때 선지급)` : `${c.id} 수입 관세 (도착 때)`,
    });
  }
  const order = { OVERDUE: 0, WAGE: 1, FREIGHT: 2, DUTY: 3 };
  rows.sort((a, b) => (a.day === null ? Infinity : a.day) - (b.day === null ? Infinity : b.day)
    || order[a.kind] - order[b.kind] || compareText(a.currency, b.currency) || compareText(a.sourceId, b.sourceId));
  return [...overdue, ...rows];
}

/** 실행 환경의 로케일에 영향을 받지 않는 ID·통화 정렬. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface CurrencyStanding {
  currency: Currency;
  cash: number;
  inventory: number;
  prepaidFreight: number;
  forwardingWip: number;
  accountsReceivable: number;
  accountsPayable: number;
  totalAssets: number;
  /** 자산 합계 − 미지급금 = 시작 자본 + 누적 손익. */
  netAssets: number;
  openingEquity: number;
  profit: number;
  /** 취소 계약을 포함한 이 통화 계약의 기여이익 합계. */
  contractContribution: number;
}

export interface CampaignSummary {
  ended: boolean;
  campaignDays: number;
  lastClosedDay: number;
  byCurrency: CurrencyStanding[];
  onTime: OnTimeDelivery;
  contracts: { total: number; completed: number; awaitingPayment: number; inProgress: number; cancelled: number };
  openInvoices: { invoiceId: string; contractId: string; currency: Currency; amountMinor: number; dueDay: number }[];
  unpaidObligations: { obligationId: string; currency: Currency; amountMinor: number; incurredDay: number; reasonKo: string }[];
}

/** 호출한 순간의 장부와 계약을 읽는다. 통화 환산·실패 판정·수금 예측은 하지 않는다. */
export function campaignSummary(s: GameState, config: ScenarioConfig): CampaignSummary {
  const currencies = [...new Set([config.tradeCurrency, config.payrollCurrency,
    ...s.ledger.entries.map((e) => e.currency).sort(compareText)])];
  const byCurrency = currencies.map((currency): CurrencyStanding => {
    const b = summarize(s.ledger, currency);
    return {
      currency, cash: b.cash, inventory: b.inventory, prepaidFreight: b.prepaidFreight, forwardingWip: b.forwardingWip,
      accountsReceivable: b.accountsReceivable, accountsPayable: b.accountsPayable, totalAssets: b.totalAssets,
      netAssets: b.totalAssets - b.accountsPayable, openingEquity: b.openingEquity, profit: b.profit,
      contractContribution: s.contracts.filter((c) => c.currency === currency)
        .reduce((sum, c) => sum + contractReport(s, c).contribution, 0),
    };
  });
  const contracts = { total: s.contracts.length, completed: 0, awaitingPayment: 0, inProgress: 0, cancelled: 0 };
  for (const c of s.contracts) {
    if (c.status === 'COMPLETED') contracts.completed++;
    else if (c.status === 'CANCELLED') contracts.cancelled++;
    else if (c.deliveredDay !== null) contracts.awaitingPayment++;
    else contracts.inProgress++;
  }
  return {
    ended: s.phase === 'ENDED', campaignDays: config.campaignDays,
    lastClosedDay: s.closedDays.reduce((last, day) => Math.max(last, day), 0), byCurrency,
    onTime: onTimeDeliveryRate(s), contracts,
    openInvoices: s.invoices.filter((i) => i.status !== 'PAID').map((i) => ({
      invoiceId: i.id, contractId: i.contractId, currency: i.currency, amountMinor: i.amountMinor, dueDay: i.dueDay,
    })).sort((a, b) => a.dueDay - b.dueDay || compareText(a.invoiceId, b.invoiceId)),
    unpaidObligations: s.obligations.filter((o) => o.paidDay === null).map((o) => ({
      obligationId: o.id, currency: o.currency, amountMinor: o.amountMinor, incurredDay: o.incurredDay, reasonKo: o.reasonKo,
    })).sort((a, b) => a.incurredDay - b.incurredDay || compareText(a.obligationId, b.obligationId)),
  };
}
