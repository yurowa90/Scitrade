// data/*.json의 DESIGN fixture를 M1 엔진 설정으로 변환한다.
// USD 표시 금액은 여기서 한 번만 cents로 바꾼다. 데이터에 없는 엔진 보완값은 출처와 함께 이 파일에 모은다.

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

/**
 * 데이터 파일에 구조화 필드가 없어 엔진에서 보완한 값.
 * 금액은 scenarios.json의 actions_ko 문장에서 옮겼으며 모두 DESIGN이다.
 */
export const M1_ENGINE_SUPPLEMENTS = {
  prepWorkUnits: {
    value: 2,
    basis: 'DESIGN',
    noteKo: 'M1 데이터에 수출 준비 업무량이 없어 EMP01의 하루 처리량(2)과 같게 정함. 1일차 배정 시 2일 출항 전에 끝난다.',
  },
  preDepartureFreightRefundUsd: {
    value: 150,
    basis: 'DESIGN',
    noteKo: 'SCENARIO_M1_CANCEL_PREDEPARTURE actions_ko[2] “운임 150 USD 환급, 취소비 50 USD”.',
  },
  preDepartureCancellationFeeUsd: {
    value: 50,
    basis: 'DESIGN',
    noteKo: '같은 문장. 출항 전 예약 취소와 준비 미완료로 출항을 놓친 경우에 같은 조건을 적용한다(엔진 결정).',
  },
  customerCancellationCompensationUsd: {
    value: 0,
    basis: 'DESIGN',
    noteKo: 'SCENARIO_M1_CANCEL_PREDEPARTURE actions_ko[3] “고객 취소 보상 0은 이 fixture의 계약 조건”.',
  },
  lateDeliveryPriceReductionUsd: {
    value: 50,
    basis: 'DESIGN',
    noteKo: 'SCENARIO_M1_DELAY_ACCEPTED actions_ko[1] “사전 계약 조건에 따라 판매대금 50 USD 감액”. 지연 일수와 무관한 1회 감액으로 해석.',
  },
  delayAnnounceDay: {
    value: 5,
    basis: 'DESIGN',
    noteKo: '“one shared port delay instance; add exactly 2 days”를 요코하마 7~8일 하역 중단으로 구현. 공지일 5일은 엔진 결정.',
  },
} as const;

type AnyRecord = Record<string, unknown>;

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

  const S = M1_ENGINE_SUPPLEMENTS;
  const portRestrictions: PortRestrictionDef[] = [];
  if (id === 'SCENARIO_M1_DELAY_ACCEPTED') {
    // 기본 시나리오의 도착 예정일부터 정확히 2일간 목적항 하역 중단 → 첫 하역 가능일에 도착.
    const base = resolveScenarioRecord(str(s, 'base_scenario_id'));
    const baseArrival = num(base, 'arrival_day');
    const delayDays = num(s, 'arrival_day') - baseArrival;
    portRestrictions.push({
      eventInstanceId: 'EVI_M1_EV02_YOKOHAMA',
      templateId: 'EV02',
      cityId: str(routeRaw, 'to_city_id'),
      announceDay: S.delayAnnounceDay.value,
      startDay: baseArrival,
      endDay: baseArrival + delayDays - 1,
      forecastKo: `요코하마항 ${baseArrival}~${baseArrival + delayDays - 1}일 기상 악화로 하역 중단 예보`,
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
      prepWorkUnits: S.prepWorkUnits.value,
      dutyRateBasisPoints: rateToBasisPoints(taxRule.rate),
      dutyBasis: 'supplier_goods_invoice_only_fictional',
      customsDays: num(s, 'customs_days'),
      deliveryDeadlineDay: num(s, 'delivery_deadline_day'),
      paymentDueDay: num(s, 'cash_payment_due_day'),
      preDepartureFreightRefundMinor: toMinor(tradeCurrency, S.preDepartureFreightRefundUsd.value),
      preDepartureCancellationFeeMinor: toMinor(tradeCurrency, S.preDepartureCancellationFeeUsd.value),
      customerCancellationCompensationMinor: toMinor(tradeCurrency, S.customerCancellationCompensationUsd.value),
      lateDeliveryPriceReductionMinor: toMinor(tradeCurrency, S.lateDeliveryPriceReductionUsd.value),
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

/** 시나리오 문서의 거래 장부 기대값 (검산용). 엔진 입력으로 쓰지 않는다. */
export function expectedTradeResult(id: M1ScenarioId): Record<string, number> {
  const s = resolveScenarioRecord(id);
  const value = (s.expected_trade_only_usd ?? s.expected_direct_trade_result) as Record<string, number>;
  return { ...value };
}
