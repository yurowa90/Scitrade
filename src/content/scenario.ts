// data/*.json의 DESIGN fixture를 엔진 시나리오 설정으로 변환한다 (M1 거래 한 건, M2a 복수 계약).
// USD 표시 금액은 여기서 한 번만 cents로 바꾼다. 계약 조건·규칙 판본·지연 사건도 data/scenarios.json에서 읽는다.

import gameConfig from '../../data/game_config.json';
import scenarios from '../../data/scenarios.json';
import marketOffers from '../../data/market_offers.json';
import goods from '../../data/goods.json';
import routes from '../../data/routes.json';
import employees from '../../data/employees.json';
import characters from '../../data/characters.json';
import characterRules from '../../data/character_rules.json';
import world from '../../data/world.json';
import cultureActivities from '../../data/culture_activities.json';
import contacts from '../../data/contacts.json';
import venues from '../../data/venues.json';
import packageStatus from '../../PACKAGE_STATUS.json';

import { rateToBasisPoints, toMinor, type Currency } from '../engine/money';
import {
  SUPPORTED_RULES_VERSIONS,
  type CityDef,
  type CultureConfig,
  type EmployeeDef,
  type GoodDef,
  type OfferDef,
  type PortRestrictionDef,
  type RouteDef,
  type RecruitmentDef,
  type RulesVersion,
  type ScenarioConfig,
  type ScenarioRules,
} from '../engine/types';

export const M1_SCENARIO_IDS = [
  'SCENARIO_M1_ONE_TRADE',
  'SCENARIO_M1_CANCEL_PREDEPARTURE',
  'SCENARIO_M1_DELAY_ACCEPTED',
] as const;
export const M2_SCENARIO_IDS = ['SCENARIO_M2_MULTI_TRADE'] as const;
export const SCENARIO_IDS = [...M2_SCENARIO_IDS, ...M1_SCENARIO_IDS] as const;
export type M1ScenarioId = (typeof M1_SCENARIO_IDS)[number];
export type ScenarioId = (typeof SCENARIO_IDS)[number];

const TITLES: Record<M1ScenarioId, string> = {
  SCENARIO_M1_ONE_TRADE: 'M1 거래 한 건 — 정상',
  SCENARIO_M1_CANCEL_PREDEPARTURE: 'M1 거래 한 건 — 출항 전 취소 사례',
  SCENARIO_M1_DELAY_ACCEPTED: 'M1 거래 한 건 — 항만 지연 사례',
};

type AnyRecord = Record<string, unknown>;
type MoneyRaw = { currency: Currency; amount: number };

/** data/scenarios.json의 contract_terms (DESIGN). */
interface ContractTermsRaw {
  prep_work_units: number;
  forwarding_prep_work_units?: number;
  forwarding_duty_payer?: 'consignee';
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

/** data/scenarios.json의 engine_rules. */
interface EngineRulesRaw {
  rules_version: string;
  funds_check: 'immediate_cash' | 'committed_outlays';
  forwarding_enabled: boolean;
  note_ko?: string;
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

function optNum(record: AnyRecord, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

function str(record: AnyRecord, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`${String(record.id)}.${key}: 문자열이 아닙니다.`);
  return value;
}

function optMoney(record: AnyRecord, key: string): { currency: Currency; minor: number } | null {
  const value = record[key] as MoneyRaw | undefined;
  return value ? { currency: value.currency, minor: toMinor(value.currency, value.amount) } : null;
}

function moneyField(record: AnyRecord, key: string): { currency: Currency; minor: number } {
  const value = optMoney(record, key);
  if (!value) throw new Error(`${String(record.id)}.${key}: 금액이 없습니다.`);
  return value;
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
  const kind = str(o, 'kind') as OfferDef['kind'];
  const price = optMoney(o, 'unit_price');
  const fee = optMoney(o, 'service_fee');
  const declared = optMoney(o, 'declared_cargo_value');
  const priced = kind === 'forwarding' ? fee : price;
  if (!priced) throw new Error(`${id}: ${kind === 'forwarding' ? 'service_fee' : 'unit_price'}가 없습니다.`);
  return {
    id,
    kind,
    counterpartyId: str(o, 'counterparty_id'),
    cityId: str(o, 'city_id'),
    goodId: str(o, 'good_id'),
    quantity: num(o, 'quantity'),
    unitPriceMinor: price?.minor ?? 0,
    serviceFeeMinor: fee?.minor ?? 0,
    declaredCargoValueMinor: declared?.minor ?? null,
    currency: priced.currency,
    validUntilDay: num(o, 'valid_until_day'),
    destinationCityId: (o.destination_city_id as string | undefined) ?? null,
    deliveryDeadlineDay: optNum(o, 'delivery_deadline_day'),
    paymentDueDay: optNum(o, 'payment_due_day'),
    originCountryCode: (o.origin_country_code as string | undefined) ?? null,
  };
}

function toGood(id: string): GoodDef {
  const g = findById(goods, id);
  return {
    id,
    nameKo: str(g, 'name_ko'),
    quantityUnit: str(g, 'quantity_unit'),
    massKgPerUnit: num(g, 'mass_kg_per_unit'),
    volumeM3PerUnit: num(g, 'volume_m3_per_unit'),
    hsCode: (g.hs_code as string | null) ?? null,
  };
}

function toRoute(id: string): RouteDef {
  const r = findById(routes, id);
  const fee = moneyField(r, 'booking_fee');
  return {
    id,
    fromCityId: str(r, 'from_city_id'),
    toCityId: str(r, 'to_city_id'),
    transitDays: num(r, 'transit_days'),
    departureIntervalDays: num(r, 'departure_interval_days'),
    firstDepartureDay: num(r, 'first_departure_day'),
    capacityKg: num(r, 'capacity_kg'),
    capacityM3: num(r, 'capacity_m3'),
    bookingFeeMinor: fee.minor,
    currency: fee.currency,
  };
}

function toEmployee(id: string, growthEnabled: boolean): EmployeeDef {
  const e = findById(employees, id);
  const salary = moneyField(e, 'salary_per_day');
  const c = asItems(characters).find((item) => item.id === id) as AnyRecord | undefined;
  const art = (c?.art_direction ?? {}) as AnyRecord;
  const focus = c?.growth_focus as { primary_stat: string; secondary_stat: string };
  return {
    id,
    nameKo: str(e, 'name_ko'),
    role: str(e, 'role'),
    homeCityId: str(e, 'home_city_id'),
    workUnitsPerDay: num(e, 'work_units_per_day'),
    salaryPerDayMinor: salary.minor,
    salaryCurrency: salary.currency,
    growth: growthEnabled && c ? {
      baseStats: { ...(c.stats as Record<string, number>) },
      primaryStat: focus.primary_stat,
      secondaryStat: focus.secondary_stat,
      startXp: num(c, 'xp_total'),
    } : null,
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

function toRules(id: string, raw: EngineRulesRaw | undefined): ScenarioRules {
  if (!raw) throw new Error(`${id}: data/scenarios.json에 engine_rules가 없습니다.`);
  if (!(SUPPORTED_RULES_VERSIONS as readonly string[]).includes(raw.rules_version)) {
    throw new Error(`${id}: 엔진이 모르는 규칙 판본 ${raw.rules_version}`);
  }
  return {
    rulesVersion: raw.rules_version as RulesVersion,
    fundsCheck: raw.funds_check === 'committed_outlays' ? 'COMMITTED_OUTLAYS' : 'IMMEDIATE_CASH',
    forwardingEnabled: raw.forwarding_enabled,
  };
}

const SUPPORTED_PAYMENT_RULES = ['scenario_due_day_not_earlier_than_delivery_day', 'offer_due_day_not_earlier_than_delivery_day'];

export function loadScenario(id: ScenarioId): ScenarioConfig {
  const cfg = (gameConfig as { config: AnyRecord }).config;
  const s = resolveScenarioRecord(id);
  const tradeCurrency = str(cfg, 'trade_currency') as Currency;
  const rules = toRules(id, s.engine_rules as EngineRulesRaw | undefined);
  const growthEnabled = (s.growth as { enabled?: boolean } | undefined)?.enabled === true;

  const offers = (s.offer_ids as string[]).map(toOffer);
  const routeIds = (s.route_ids as string[] | undefined) ?? [str(s, 'route_id')];
  const routeDefs = routeIds.map(toRoute);
  const goodIds = [...new Set([...(s.good_id ? [str(s, 'good_id')] : []), ...offers.map((o) => o.goodId)])];
  if (offers.some((o) => o.currency !== tradeCurrency) || routeDefs.some((r) => r.currency !== tradeCurrency)) {
    throw new Error('거래 장부는 단일 거래 통화만 지원합니다 (환전·외화 평가는 이후 단계).');
  }
  if (!rules.forwardingEnabled && offers.some((o) => o.kind === 'forwarding')) {
    throw new Error(`${id}: 운송 주선이 꺼진 시나리오에 운송 주선 견적이 있습니다.`);
  }

  const taxRule = s.tax_rule as { basis: string; rate: number; duty_currency: string };
  if (taxRule.basis !== 'supplier_goods_invoice_only_fictional' || taxRule.duty_currency !== tradeCurrency) {
    throw new Error(`지원하지 않는 과세 규칙: ${taxRule.basis}`);
  }

  // 시나리오가 시작 자금을 명시하면 기본 설정보다 우선한다 (configuration_merge_rule.precedence).
  const startingCashRaw = (s.starting_cash ?? cfg.starting_cash) as Record<string, number>;
  const startingCash: Partial<Record<Currency, number>> = {};
  for (const [currency, amount] of Object.entries(startingCashRaw)) {
    startingCash[currency as Currency] = toMinor(currency as Currency, amount);
  }

  const terms = s.contract_terms as ContractTermsRaw | undefined;
  if (!terms) throw new Error(`${id}: data/scenarios.json에 contract_terms가 없습니다.`);
  const cancel = terms.pre_departure_cancellation;
  if (terms.booking_cutoff_days_before_departure !== 1) throw new Error('엔진은 출항 전날 예약 마감만 지원합니다.');
  if (cancel.supplier_return || !cancel.applies_to_missed_sailing) {
    throw new Error('엔진은 공급자 반품 없음·출항 불참 동일 정산 조건만 지원합니다.');
  }
  if (terms.late_delivery.basis !== 'flat_once_regardless_of_late_days') {
    throw new Error(`지원하지 않는 지연 감액 규칙: ${terms.late_delivery.basis}`);
  }
  if (!SUPPORTED_PAYMENT_RULES.includes(terms.payment_due_rule)) throw new Error(`지원하지 않는 결제일 규칙: ${terms.payment_due_rule}`);
  if (rules.forwardingEnabled && (terms.forwarding_prep_work_units === undefined || terms.forwarding_duty_payer !== 'consignee')) {
    throw new Error(`${id}: 운송 주선 준비 업무량과 관세 부담자(consignee)를 정해야 합니다.`);
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

  const rawRecruitment = s.recruitment as {
    candidate_employee_ids: string[]; scout_work_units: number; quest_work_units: number;
    signing_fee_wage_days: number;
    scout_sites: { venue_id: string; city_id: string; candidate_employee_ids: string[] }[];
  } | undefined;
  const recruitment: RecruitmentDef | null = rawRecruitment ? {
    candidateEmployeeIds: rawRecruitment.candidate_employee_ids,
    scoutWorkUnits: rawRecruitment.scout_work_units,
    questWorkUnits: rawRecruitment.quest_work_units,
    signingFeeWageDays: rawRecruitment.signing_fee_wage_days,
    scoutSites: rawRecruitment.scout_sites.map((site) => ({
      venueId: site.venue_id, titleKo: str(findById(venues, site.venue_id), 'title_ko'),
      cityId: site.city_id, candidateEmployeeIds: site.candidate_employee_ids,
    })),
  } : null;

  const rawCulture = s.culture as { activity_ids: string[] } | undefined;
  const culture: CultureConfig | null = rawCulture ? {
    companyId: str(cfg, 'active_company_id'),
    activities: rawCulture.activity_ids.map((activityId) => {
      const a = cultureActivities.items.find((item) => item.id === activityId);
      if (!a || a.stage !== 'P0') throw new Error(`${activityId}: P0 현지 활동이 아닙니다.`);
      if (!(s.city_ids as string[]).includes(a.city_id)) throw new Error(`${activityId}: 시나리오에 없는 도시입니다.`);
      const currency = a.money_cost.currency as Currency;
      if (startingCash[currency] === undefined) throw new Error(`${activityId}: 시작 자금에 활동 통화가 없습니다.`);
      if (currency !== str(cfg, 'reporting_currency')) throw new Error(`${activityId}: 현지 활동비는 급여 통화(KRW)로 내야 합니다.`);
      const known = ['company_id', 'actor_id', 'contact_id', 'activity_id', 'city_id', 'content_revision'];
      for (const [template, required, forbidden] of [
        [a.completion_dedupe_key_template, ['company_id'], ['actor_id', 'contact_id']],
        [a.actor_experience_dedupe_key_template, ['actor_id'], ['contact_id']],
        [a.relationship_dedupe_key_template, ['actor_id', 'contact_id'], []],
      ] as const) {
        const slots = [...template.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]!);
        if (/[{}]/.test(template.replace(/\{[^{}]*\}/g, '')) || slots.some((slot) => !known.includes(slot))
          || required.some((slot) => !slots.includes(slot)) || forbidden.some((slot) => slots.includes(slot))) {
          throw new Error(`${activityId}: 현지 활동 키 템플릿 자리 오류 (${template}).`);
        }
      }
      for (const contactId of a.contact_ids) findById(contacts, contactId);
      const report = 'report_ko' in a ? a.report_ko : null;
      return { id: a.id, titleKo: a.title_ko, cityId: a.city_id, venueId: a.venue_id,
        contactIds: [...a.contact_ids], durationDays: a.duration_days, currency,
        costMinor: toMinor(currency, a.money_cost.amount),
        topic: { id: a.knowledge_topic.id, titleKo: a.knowledge_topic.title_ko, contentRevision: a.knowledge_topic.content_revision },
        observationsKo: [...a.observations_ko],
        reportKo: report ? { findingKo: report.finding_ko, scopeKo: report.scope_ko,
          notClaimedKo: report.not_claimed_ko, openQuestionKo: report.open_question_ko } : null,
        keyTemplates: { companyReport: a.completion_dedupe_key_template,
          actorExperience: a.actor_experience_dedupe_key_template, relationship: a.relationship_dedupe_key_template } };
    }),
    contacts: [],
  } : null;
  if (culture) {
    culture.contacts = [...new Set(culture.activities.flatMap((a) => a.contactIds))].map((contactId) => {
      const c = findById(contacts, contactId);
      return { id: contactId, nameKo: str(c, 'title_ko'), roleKo: str(c, 'role_ko'),
        informationScopeKo: str(c, 'information_scope_ko') };
    });
  }

  return {
    id,
    titleKo: (s.title_ko as string | undefined) ?? TITLES[id as M1ScenarioId] ?? id,
    stage: str(s, 'stage'),
    baseScenarioId: (s.base_scenario_id as string | undefined) ?? null,
    rules,
    seed: num(cfg, 'seed'),
    campaignDays: num(cfg, 'days'),
    homeCityId: str(cfg, 'home_city_id'),
    tradeCurrency,
    payrollCurrency: str(cfg, 'reporting_currency') as Currency,
    startingCash,
    cities: (s.city_ids as string[]).map(toCity),
    goods: goodIds.map(toGood),
    routes: routeDefs,
    offers,
    employees: [...(s.employee_ids as string[]), ...(recruitment?.candidateEmployeeIds ?? [])].map((employeeId) => toEmployee(employeeId, growthEnabled)),
    recruitment,
    culture,
    growth: growthEnabled ? {
      taskCompletionXp: characterRules.task_completion_xp,
      ordinaryTraining: {
        durationDays: characterRules.ordinary_training.duration_days,
        feeMinor: toMinor(characterRules.ordinary_training.fee.currency as Currency, characterRules.ordinary_training.fee.amount),
        currency: characterRules.ordinary_training.fee.currency as Currency,
        xpOnCompletion: characterRules.ordinary_training.xp_on_completion,
      },
    } : null,
    terms: {
      prepWorkUnits: terms.prep_work_units,
      forwardingPrepWorkUnits: terms.forwarding_prep_work_units ?? 0,
      dutyRateBasisPoints: rateToBasisPoints(taxRule.rate),
      dutyBasis: 'supplier_goods_invoice_only_fictional',
      customsDays: num(s, 'customs_days'),
      deliveryDeadlineDay: optNum(s, 'delivery_deadline_day'),
      paymentDueDay: optNum(s, 'cash_payment_due_day'),
      // ROUTE01 검산 예시를 호환용으로 보존한다. 예약 정산에는 사용하지 않는다.
      preDepartureFreightRefundMinor: termMinor(cancel.freight_refund),
      preDepartureCancellationFeeMinor: termMinor(cancel.cancellation_fee),
      customerCancellationCompensationMinor: termMinor(cancel.customer_compensation),
      lateDeliveryPriceReductionMinor: termMinor(terms.late_delivery.price_reduction),
    },
    portRestrictions,
    expectedTimeline: {
      bookingDay: optNum(s, 'booking_day'),
      departureDay: optNum(s, 'departure_day'),
      arrivalDay: optNum(s, 'arrival_day'),
    },
    dataVersion: (packageStatus as { package_version: string }).package_version,
    dataBasis: 'DESIGN',
  };
}

/** 화면의 ‘이 시제품이 가정한 값’에 보여 줄 데이터 메모 (data/scenarios.json). */
export function assumptionNotes(id: ScenarioId): string[] {
  const s = resolveScenarioRecord(id);
  const notes = [...((s.contract_terms as ContractTermsRaw | undefined)?.notes_ko ?? [])];
  const rules = s.engine_rules as EngineRulesRaw | undefined;
  if (rules?.note_ko) notes.unshift(`규칙 ${rules.rules_version}: ${rules.note_ko}`);
  const pr = s.port_restriction as PortRestrictionRaw | undefined;
  if (pr?.notes_ko) notes.push(`${pr.notes_ko} (공지 ${pr.announce_day}일, 하역 중단 ${pr.restriction_start_day}~${pr.restriction_end_day}일)`);
  return notes;
}

/** M1 시나리오 문서의 거래 장부 기대값 (검산용). 엔진 입력으로 쓰지 않는다. */
export function expectedTradeResult(id: M1ScenarioId): Record<string, number> {
  const s = resolveScenarioRecord(id);
  const value = (s.expected_trade_only_usd ?? s.expected_direct_trade_result) as Record<string, number>;
  return { ...value };
}

export interface ExpectedPath {
  id: string;
  title_ko: string;
  trades: [string, string][];
  forwarding_offer_ids: string[];
  sailing_by_offer: Record<string, string>;
  final_day: number;
  [key: string]: unknown;
}

/** M2 시나리오의 경로별 기대값과 거절 사례 (검산용, USD 표시 금액). 엔진 입력으로 쓰지 않는다. */
export function expectedM2(id: (typeof M2_SCENARIO_IDS)[number]): {
  paths: ExpectedPath[];
  rejections: Record<string, Record<string, unknown>>;
} {
  const s = resolveScenarioRecord(id);
  const rejections: Record<string, Record<string, unknown>> = {};
  for (const r of (s.expected_rejections as Record<string, unknown>[] | undefined) ?? []) rejections[String(r.id)] = r;
  return { paths: (s.expected_paths_usd as ExpectedPath[] | undefined) ?? [], rejections };
}
