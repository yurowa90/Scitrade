// 상태에서 계산하는 보고 값. 별도의 현금·이익을 저장하지 않는다.

import { dutyEstimate, listSailings, offerOf, routeBetween } from './catalog';
import { contractAmount, summarize, type BookSummary } from './ledger';
import type { Contract, GameState, ScenarioConfig } from './types';

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
