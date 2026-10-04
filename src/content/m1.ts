// data/*.json의 DESIGN fixture를 M1 엔진 설정으로 변환한다.
// USD 표시 금액은 여기서 한 번만 cents로 바꾼다. 계약 조건·지연 사건도 data/scenarios.json에서 읽는다.

import gameConfig from '../../data/game_config.json';
import scenarios from '../../data/scenarios.json';
import marketOffers from '../../data/market_offers.json';
import goods from '../../data/goods.json';
import routes from '../../data/routes.json';
import employees from '../../data/employees.json';
import characters from '../../data/characters.json';
import world from '../../data/world.json';
import packageStatus from '../../PACKAGE_STATUS.json';

import { rateToBasisPoints, toMinor, type Currency } from '../engine/money';
import type {
  CityDef,
  EmployeeDef,
  OfferDef,
  PortRestrictionDef,
  ScenarioConfig,
} from '../engine/types';

export const M1_SCENARIO_IDS = [
  'SCENARIO_M1_ONE_TRADE',
  'SCENARIO_M1_CANCEL_PREDEPARTURE',
  'SCENARIO_M1_DELAY_ACCEPTED',
] as const;
export type M1ScenarioId = (typeof M1_SCENARIO_IDS)[number];

const TITLES: Record<M1ScenarioId, string> = {
  SCENARIO_M1_ONE_TRADE: '거래 한 건 — 정상',
  SCENARIO_M1_CANCEL_PREDEPARTURE: '거래 한 건 — 출항 전 취소 사례',
  SCENARIO_M1_DELAY_ACCEPTED: '거래 한 건 — 항만 지연 사례',
};

type AnyRecord = Record<string, unknown>;
type MoneyRaw = { currency: Currency; amount: number };

/** data/scenarios.json의 contract_terms (DESIGN, 2026-10-04 사용자 검토). */
interface ContractTermsRaw {
  prep_work_units: number;
  booking_cutoff_days_before_departure: number;
  pre_departure_cancellation: {
    freight_refund: MoneyRaw;
    cancellation_fee: MoneyRaw;
    customer_compensation: MoneyRaw;
    supplier_return: boolean;
    applies_to_missed_sailing: boolean;
  };
  late_delivery: { price_reduction: MoneyRaw; basis: string };
  payment_due_rule: string;
  notes_ko?: string[];
}

/** data/scenarios.json의 port_restriction (지연 사례 전용). */
interface PortRestrictionRaw {
  event_template_id: string;
  event_instance_id: string;
  city_id: string;
  announce_day: number;
  restriction_start_day: number;
  restriction_end_day: number;
  notes_ko?: string;
}

function asItems(doc: unknown): AnyRecord[] {
  return ((doc as { items: AnyRecord[] }).items ?? []) as AnyRecord[];
}

function findById(doc: unknown, id: string): AnyRecord {
  const found = asItems(doc).find((item) => item.id === id);
  if (!found) throw new Error(`데이터에서 ${id}를 찾지 못했습니다.`);
  return found;
}

function num(record: AnyRecord, key: string): number {
  const value = record[key];
  if (typeof value !== 'number') throw new Error(`${String(record.id)}.${key}: 숫자가 아닙니다.`);
  return value;
}

function str(record: AnyRecord, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`${String(record.id)}.${key}: 문자열이 아닙니다.`);
  return value;
}

function moneyField(record: AnyRecord, key: string): { currency: Currency; minor: number } {
  const value = record[key] as { currency: Currency; amount: number } | undefined;
  if (!value) throw new Error(`${String(record.id)}.${key}: 금액이 없습니다.`);
  return { currency: value.currency, minor: toMinor(value.currency, value.amount) };
}

/** variant는 기본 시나리오를 읽은 뒤 자기 값으로 덮는다. 배열은 합치지 않고 교체한다. */
function resolveScenarioRecord(id: string): AnyRecord {
  const record = findById(scenarios, id);
  const baseId = record.base_scenario_id as string | undefined;
  if (!baseId) return { ...record };
  return { ...resolveScenarioRecord(baseId), ...record };
}

function toOffer(id: string): OfferDef {
  const o = findById(marketOffers, id);
  const price = moneyField(o, 'unit_price');
  return {
    id,
    kind: str(o, 'kind') as OfferDef['kind'],
    counterpartyId: str(o, 'counterparty_id'),
    cityId: str(o, 'city_id'),
    goodId: str(o, 'good_id'),
    quantity: num(o, 'quantity'),
    unitPriceMinor: price.minor,
    currency: price.currency,
    validUntilDay: num(o, 'valid_until_day'),
  };
}

function toEmployee(id: string): EmployeeDef {
  const e = findById(employees, id);
  const salary = moneyField(e, 'salary_per_day');
  const c = asItems(characters).find((item) => item.id === id) as AnyRecord | undefined;
  const art = (c?.art_direction ?? {}) as AnyRecord;
  return {
    id,
    nameKo: str(e, 'name_ko'),
    role: str(e, 'role'),
    homeCityId: str(e, 'home_city_id'),
    workUnitsPerDay: num(e, 'work_units_per_day'),
    salaryPerDayMinor: salary.minor,
    salaryCurrency: salary.currency,
    character: {
      attribute: (c?.attribute as string | undefined) ?? null,
      creatureKind: (c?.creature_kind as string | undefined) ?? null,
      visualMotif: (c?.visual_motif as string | undefined) ?? null,
      assetStatus: (art.asset_status as string | undefined) ?? 'UNKNOWN',
    },
  };
}

function toCity(id: string): CityDef {
  const c = findById(world, id);
  const pos = c.map_position as { x: number; y: number };
  return {
    id,
    nameKo: str(c, 'name_ko'),
    countryCode: str(c, 'country_code'),
    mapX: pos.x,
    mapY: pos.y,
  };
}

export function loadM1Scenario(id: M1ScenarioId): ScenarioConfig {
  const cfg = (gameConfig as { config: AnyRecord }).config;
  const s = resolveScenarioRecord(id);
  const offerIds = s.offer_ids as string[];
  const buyOffer = toOffer(offerIds.find((o) => findById(marketOffers, o).kind === 'supplier')!);
  const sellOfferRaw = findById(marketOffers, offerIds.find((o) => findById(marketOffers, o).kind === 'customer')!);
  const sellOffer = toOffer(str(sellOfferRaw, 'id'));

  const goodRaw = findById(goods, str(s, 'good_id'));
  const routeRaw = findById(routes, str(s, 'route_id'));
  const bookingFee = moneyField(routeRaw, 'booking_fee');
  const tradeCurrency = str(cfg, 'trade_currency') as Currency;
  if (bookingFee.currency !== tradeCurrency || buyOffer.currency !== tradeCurrency) {
    throw new Error('M1 거래 장부는 단일 거래 통화만 지원합니다.');
  }

  const taxRule = s.tax_rule as { basis: string; rate: number; duty_currency: string };
  if (taxRule.basis !== 'supplier_goods_invoice_only_fictional' || taxRule.duty_currency !== tradeCurrency) {
    throw new Error(`지원하지 않는 과세 규칙: ${taxRule.basis}`);
  }

  const startingCashRaw = cfg.starting_cash as Record<string, number>;
  const startingCash: Partial<Record<Currency, number>> = {};
  for (const [currency, amount] of Object.entries(startingCashRaw)) {
    startingCash[currency as Currency] = toMinor(currency as Currency, amount);
  }

  const terms = s.contract_terms as ContractTermsRaw | undefined;
  if (!terms) throw new Error(`${id}: data/scenarios.json에 contract_terms가 없습니다.`);
  const cancel = terms.pre_departure_cancellation;
  if (terms.booking_cutoff_days_before_departure !== 1) throw new Error('M1 엔진은 출항 전날 예약 마감만 지원합니다.');
  if (cancel.supplier_return || !cancel.applies_to_missed_sailing) {
    throw new Error('M1 엔진은 공급자 반품 없음·출항 불참 동일 정산 조건만 지원합니다.');
  }
  if (terms.late_delivery.basis !== 'flat_once_regardless_of_late_days') {
    throw new Error(`지원하지 않는 지연 감액 규칙: ${terms.late_delivery.basis}`);
  }
  const termMinor = (m: MoneyRaw) => {
    if (m.currency !== tradeCurrency) throw new Error('계약 조건 통화가 거래 통화와 다릅니다.');
    return toMinor(m.currency, m.amount);
  };

  // 지연 사례의 공통 항만 사건 1개. 하역 중단 기간에 실제로 기다린 날만 지연으로 누적한다.
  const portRestrictions: PortRestrictionDef[] = [];
  const pr = s.port_restriction as PortRestrictionRaw | undefined;
  if (pr) {
    portRestrictions.push({
      eventInstanceId: pr.event_instance_id,
      templateId: pr.event_template_id,
      cityId: pr.city_id,
      announceDay: pr.announce_day,
      startDay: pr.restriction_start_day,
      endDay: pr.restriction_end_day,
      forecastKo: `${toCity(pr.city_id).nameKo}항 ${pr.restriction_start_day}~${pr.restriction_end_day}일 기상 악화로 하역 중단 예보`,
    });
  }

  return {
    id,
    titleKo: TITLES[id],
    stage: str(s, 'stage'),
    baseScenarioId: (s.base_scenario_id as string | undefined) ?? null,
    seed: num(cfg, 'seed'),
    campaignDays: num(cfg, 'days'),
    homeCityId: str(cfg, 'home_city_id'),
    tradeCurrency,
    payrollCurrency: str(cfg, 'reporting_currency') as Currency,
    startingCash,
    cities: (s.city_ids as string[]).map(toCity),
    good: {
      id: str(goodRaw, 'id'),
      nameKo: str(goodRaw, 'name_ko'),
      quantityUnit: str(goodRaw, 'quantity_unit'),
      massKgPerUnit: num(goodRaw, 'mass_kg_per_unit'),
      volumeM3PerUnit: num(goodRaw, 'volume_m3_per_unit'),
      hsCode: (goodRaw.hs_code as string | null) ?? null,
    },
    route: {
      id: str(routeRaw, 'id'),
      fromCityId: str(routeRaw, 'from_city_id'),
      toCityId: str(routeRaw, 'to_city_id'),
      transitDays: num(routeRaw, 'transit_days'),
      departureIntervalDays: num(routeRaw, 'departure_interval_days'),
      firstDepartureDay: num(routeRaw, 'first_departure_day'),
      capacityKg: num(routeRaw, 'capacity_kg'),
      capacityM3: num(routeRaw, 'capacity_m3'),
      bookingFeeMinor: bookingFee.minor,
      currency: bookingFee.currency,
    },
    buyOffer,
    sellOffer,
    employees: (s.employee_ids as string[]).map(toEmployee),
    terms: {
      prepWorkUnits: terms.prep_work_units,
      dutyRateBasisPoints: rateToBasisPoints(taxRule.rate),
      dutyBasis: 'supplier_goods_invoice_only_fictional',
      customsDays: num(s, 'customs_days'),
      deliveryDeadlineDay: num(s, 'delivery_deadline_day'),
      paymentDueDay: num(s, 'cash_payment_due_day'),
      preDepartureFreightRefundMinor: termMinor(cancel.freight_refund),
      preDepartureCancellationFeeMinor: termMinor(cancel.cancellation_fee),
      customerCancellationCompensationMinor: termMinor(cancel.customer_compensation),
      lateDeliveryPriceReductionMinor: termMinor(terms.late_delivery.price_reduction),
    },
    portRestrictions,
    expectedTimeline: {
      bookingDay: (s.booking_day as number | undefined) ?? null,
      departureDay: (s.departure_day as number | undefined) ?? null,
      arrivalDay: (s.arrival_day as number | undefined) ?? null,
    },
    dataVersion: (packageStatus as { package_version: string }).package_version,
    dataBasis: 'DESIGN',
  };
}

/** 화면의 ‘이 시제품이 가정한 값’에 보여 줄 데이터 메모 (data/scenarios.json). */
export function m1AssumptionNotes(id: M1ScenarioId): string[] {
  const s = resolveScenarioRecord(id);
  const notes = [...((s.contract_terms as ContractTermsRaw | undefined)?.notes_ko ?? [])];
  const pr = s.port_restriction as PortRestrictionRaw | undefined;
  if (pr?.notes_ko) notes.push(`${pr.notes_ko} (공지 ${pr.announce_day}일, 하역 중단 ${pr.restriction_start_day}~${pr.restriction_end_day}일)`);
  return notes;
}

/** 시나리오 문서의 거래 장부 기대값 (검산용). 엔진 입력으로 쓰지 않는다. */
export function expectedTradeResult(id: M1ScenarioId): Record<string, number> {
  const s = resolveScenarioRecord(id);
  const value = (s.expected_trade_only_usd ?? s.expected_direct_trade_result) as Record<string, number>;
  return { ...value };
}
