// 게임 상태와 시나리오 설정의 자료형. UI는 이 상태를 읽기만 하고 경제 값을 따로 소유하지 않는다.

import type { Ledger } from './ledger';
import type { Currency } from './money';
import type { RngState } from './rng';

export const ENGINE_VERSION = '0.2.0';
/**
 * 엔진이 아는 경제 규칙 판본. 판본은 시나리오가 정하고(data/scenarios.json의 engine_rules) 저장 파일에 남는다.
 * 규칙이 바뀌면 새 판본을 더하고, 다른 판본의 저장은 조용히 이어 쓰지 않는다.
 */
export const SUPPORTED_RULES_VERSIONS = ['M1-rules-1', 'M2a-rules-1'] as const;
export type RulesVersion = (typeof SUPPORTED_RULES_VERSIONS)[number];

// ── 정적 시나리오 설정 (data/*.json에서 만들어지며 상태에 저장하지 않는다) ──

export interface CityDef {
  id: string;
  nameKo: string;
  countryCode: string;
  mapX: number;
  mapY: number;
}

export interface GoodDef {
  id: string;
  nameKo: string;
  quantityUnit: string;
  massKgPerUnit: number;
  volumeM3PerUnit: number;
  hsCode: string | null;
}

export interface RouteDef {
  id: string;
  fromCityId: string;
  toCityId: string;
  transitDays: number;
  departureIntervalDays: number;
  firstDepartureDay: number;
  capacityKg: number;
  capacityM3: number;
  /** 예약 1건당 선지급 운임 (최소 단위). */
  bookingFeeMinor: number;
  currency: Currency;
}

export interface OfferDef {
  id: string;
  /** supplier: 공급자 매입 견적, customer: 고객 판매 견적, forwarding: 고객 화물의 운송 주선 의뢰. */
  kind: 'supplier' | 'customer' | 'forwarding';
  counterpartyId: string;
  /** 공급자·고객이 있는 항구. 운송 주선은 화물을 넘겨받는 항구. */
  cityId: string;
  goodId: string;
  quantity: number;
  /** 상품 견적의 단가 (최소 단위). 운송 주선 견적은 0. */
  unitPriceMinor: number;
  /** 운송 주선 서비스 대금 (최소 단위, 건당). 상품 견적은 0. */
  serviceFeeMinor: number;
  /** 고객 화물의 신고가액. 회사 자산·매출이 아니며 화면 설명에만 쓴다. */
  declaredCargoValueMinor: number | null;
  currency: Currency;
  validUntilDay: number;
  /** 운송 주선의 도착항. 상품 견적은 null. */
  destinationCityId: string | null;
  /** 고객 견적·운송 주선의 납기와 결제일. 공급자 견적은 null. */
  deliveryDeadlineDay: number | null;
  paymentDueDay: number | null;
  originCountryCode: string | null;
}

export interface EmployeeDef {
  id: string;
  nameKo: string;
  role: string;
  homeCityId: string;
  workUnitsPerDay: number;
  salaryPerDayMinor: number;
  salaryCurrency: Currency;
  growth: {
    baseStats: Record<string, number>;
    primaryStat: string;
    secondaryStat: string;
    startXp: number;
  } | null;
  /** 캐릭터 카드 표시용. M1에서는 능력·속성을 계산에 쓰지 않는다. */
  character: {
    attribute: string | null;
    creatureKind: string | null;
    visualMotif: string | null;
    assetStatus: string;
  };
}

/** 시나리오에 미리 정해진 항만 작업 제한. 하나의 사건 인스턴스를 해당 항만의 모든 화물이 공유한다. */
export interface PortRestrictionDef {
  eventInstanceId: string;
  templateId: string;
  cityId: string;
  announceDay: number;
  /** 하역 불가 기간 [startDay, endDay] (양 끝 포함). */
  startDay: number;
  endDay: number;
  forecastKo: string;
}

export interface ScenarioTerms {
  /** 수출 준비 업무량. 데이터에 없는 M1 엔진 보완값이며 DESIGN이다. */
  prepWorkUnits: number;
  /** 운송 주선 준비(화물 인수·선적 서류) 업무량. M2a DESIGN. */
  forwardingPrepWorkUnits: number;
  dutyRateBasisPoints: number;
  dutyBasis: 'supplier_goods_invoice_only_fictional';
  customsDays: number;
  /** 시나리오가 직접 정한 납기·결제일 (M1). null이면 고객 견적의 값을 쓴다. */
  deliveryDeadlineDay: number | null;
  paymentDueDay: number | null;
  /** 출항 전 예약 취소 시 운임 환급액과 취소비 (최소 단위). */
  preDepartureFreightRefundMinor: number;
  preDepartureCancellationFeeMinor: number;
  /** 고객 계약 취소 보상 (이 fixture에서는 0). */
  customerCancellationCompensationMinor: number;
  /** 납기 경과 인도 시 사전 계약 조건에 따른 판매대금 감액 (최소 단위, 1회). */
  lateDeliveryPriceReductionMinor: number;
}

/** 시나리오별 경제 규칙. M1 검산 규칙을 바꾸지 않고 M2 규칙을 별도로 켠다. */
export interface ScenarioRules {
  rulesVersion: RulesVersion;
  /**
   * IMMEDIATE_CASH (M1): 지금 현금만 확인한다.
   * COMMITTED_OUTLAYS (M2a): 체결한 계약이 앞으로 낼 운임·관세를 예약하고, 현금에서 예약과 미지급을 뺀 돈으로 새 지출을 판단한다.
   */
  fundsCheck: 'IMMEDIATE_CASH' | 'COMMITTED_OUTLAYS';
  forwardingEnabled: boolean;
}

export interface ScenarioConfig {
  id: string;
  titleKo: string;
  stage: string;
  baseScenarioId: string | null;
  rules: ScenarioRules;
  seed: number;
  campaignDays: number;
  homeCityId: string;
  tradeCurrency: Currency;
  payrollCurrency: Currency;
  startingCash: Partial<Record<Currency, number>>;
  cities: CityDef[];
  goods: GoodDef[];
  routes: RouteDef[];
  offers: OfferDef[];
  /** 시작 직원과 영입 후보의 정의. 고용 여부는 GameState.employees만 판단한다. */
  employees: EmployeeDef[];
  recruitment: RecruitmentDef | null;
  growth: {
    taskCompletionXp: number;
    ordinaryTraining: { durationDays: number; feeMinor: number; currency: Currency; xpOnCompletion: number };
  } | null;
  terms: ScenarioTerms;
  portRestrictions: PortRestrictionDef[];
  /** 시나리오 문서에 적힌 기대 일정 (검산용). */
  expectedTimeline: {
    bookingDay: number | null;
    departureDay: number | null;
    arrivalDay: number | null;
  };
  dataVersion: string;
  dataBasis: 'DESIGN';
}

// ── 동적 게임 상태 ──

export type DayPhase = 'PENDING_OPEN' | 'AWAITING_INPUT' | 'ENDED';

export type ContractStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CargoStatus =
  | 'PREPARING'
  | 'AWAITING_DEPARTURE'
  | 'IN_TRANSIT'
  | 'ARRIVED_RELEASING'
  | 'DELIVERED'
  | 'HELD_UNALLOCATED'
  | 'RETURNED_TO_OWNER';
export type ContractKind = 'DIRECT_TRADE' | 'FORWARDING';
export type InvoiceStatus = 'OUTSTANDING' | 'OVERDUE' | 'PAID';
export type TaskStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'ABORTED';
export type BookingStatus = 'BOOKED' | 'DEPARTED' | 'CANCELLED';

export interface OfferState {
  id: string;
  status: 'OPEN' | 'ACCEPTED' | 'EXPIRED';
}

export interface Contract {
  id: string;
  kind: ContractKind;
  status: ContractStatus;
  /** 직접 무역의 매입·판매 견적. 운송 주선은 null. */
  buyOfferId: string | null;
  sellOfferId: string | null;
  /** 운송 주선 의뢰 견적. 직접 무역은 null. */
  serviceOfferId: string | null;
  supplierId: string | null;
  /** 판매 고객 또는 운송 주선 화주. */
  customerId: string;
  goodId: string;
  quantity: number;
  /** 회사가 산 상품의 매입대금. 운송 주선은 0. */
  purchaseAmountMinor: number;
  /** 고객에게 청구할 계약 금액: 직접 무역은 상품 판매대금, 운송 주선은 서비스 대금. */
  saleAmountMinor: number;
  currency: Currency;
  originCityId: string;
  destinationCityId: string;
  deliveryDeadlineDay: number;
  paymentDueDay: number;
  acceptedDay: number;
  ownerEmployeeId: string | null;
  cargoLotId: string;
  prepTaskId: string;
  bookingId: string | null;
  invoiceId: string | null;
  deliveredDay: number | null;
  lateDays: number;
  priceReductionMinor: number;
  cancelledDay: number | null;
  completedDay: number | null;
}

export interface CargoLot {
  id: string;
  /** COMPANY: 회사 소유 재고. CUSTOMER: 운송 주선으로 맡은 고객 화물(회사 자산 아님). */
  owner: 'COMPANY' | 'CUSTOMER';
  /** CUSTOMER 화물의 소유자(화주). 회사 재고는 null. */
  ownerPartyId: string | null;
  goodId: string;
  quantity: number;
  /** 원산지 국가 코드 (출발항과 구분). */
  originCountryCode: string;
  /** 회사 재고: 매입가 + 출발 시 운임 + 수입 관세로 누적되는 장부가액. 고객 화물은 항상 0. */
  carryingAmountMinor: number;
  currency: Currency;
  locationCityId: string | null;
  status: CargoStatus;
  contractId: string | null;
  shipmentId: string | null;
}

export interface Booking {
  id: string;
  contractId: string;
  routeId: string;
  sailingId: string;
  departureDay: number;
  /** 용량 비교는 정수 단위(g, L)로 한다. 원 단위 kg·m³는 상품 정의에서 환산한다. */
  massGrams: number;
  volumeLiters: number;
  prepaidFreightMinor: number;
  status: BookingStatus;
}

export interface Shipment {
  id: string;
  bookingId: string;
  contractId: string;
  cargoLotId: string;
  departureDay: number;
  scheduledArrivalDay: number;
  arrivalDay: number | null;
  releaseDay: number | null;
  observedWaitDays: number;
  /** 지연을 일으킨 사건 인스턴스 ID. 같은 사건을 두 번 반영하지 않기 위해 남긴다. */
  delayEventIds: string[];
  dutyMinor: number | null;
  dutyPaid: boolean;
}

export interface Task {
  id: string;
  /** 계약 준비·현장 조사·영입 의뢰·훈련이 같은 직원 시간 예약을 쓴다. */
  kind: 'EXPORT_PREP' | 'FORWARDING_PREP' | 'SCOUT' | 'RECRUIT_QUEST' | 'TRAINING';
  contractId: string | null;
  /** 조사 장소 ID·의뢰 후보 ID·훈련 직원 ID. 계약 준비는 null. */
  subjectId: string | null;
  cityId: string;
  /** TRAINING은 업무 포인트 대신 일수를 담고 하루에 1씩 진행한다. */
  requiredWorkUnits: number;
  progressWorkUnits: number;
  status: TaskStatus;
  assignedEmployeeId: string | null;
  startedDay: number | null;
  completedDay: number | null;
}

export interface EmployeeState {
  id: string;
  xp: number;
  locationCityId: string;
  employmentStatus: 'employed' | 'candidate';
  availableFromDay: number;
}

export interface RecruitmentDef {
  candidateEmployeeIds: string[];
  scoutWorkUnits: number;
  questWorkUnits: number;
  signingFeeWageDays: number;
  scoutSites: { venueId: string; titleKo: string; cityId: string; candidateEmployeeIds: string[] }[];
}

export interface CandidateState {
  employeeId: string;
  stage: 'UNDISCOVERED' | 'DISCOVERED' | 'QUEST_RUNNING' | 'INTERVIEW_READY' | 'HIRED';
  discoveredDay: number | null;
  questTaskId: string | null;
  interviewReadyDay: number | null;
  hiredDay: number | null;
}

export interface Invoice {
  id: string;
  contractId: string;
  currency: Currency;
  amountMinor: number;
  issuedDay: number;
  dueDay: number;
  status: InvoiceStatus;
  receiptIds: string[];
}

export interface Obligation {
  id: string;
  currency: Currency;
  amountMinor: number;
  reasonKo: string;
  incurredDay: number;
  paidDay: number | null;
}

export interface Notice {
  id: string;
  day: number;
  kind: 'PORT_RESTRICTION';
  eventInstanceId: string;
  titleKo: string;
  bodyKo: string;
  affectedShipmentIds: string[];
  /** 관측·예보·가정 구분. M1의 항만 공지는 시나리오에 고정된 예보이며 실제 제한과 같다. */
  evidenceKo: string;
}

export interface DelayDecision {
  noticeId: string;
  shipmentId: string;
  choice: 'KEEP_SHIPMENT_BOOKING' | null;
  decidedDay: number | null;
}

export interface LogEntry {
  day: number;
  textKo: string;
}

export interface CommandRecord {
  day: number;
  type: string;
  status: 'APPLIED' | 'REJECTED';
  reasonKo: string;
}

export interface GameState {
  meta: {
    engineVersion: string;
    rulesVersion: string;
    dataVersion: string;
    scenarioId: string;
  };
  day: number;
  phase: DayPhase;
  rng: RngState;
  ledger: Ledger;
  offers: OfferState[];
  contracts: Contract[];
  cargoLots: CargoLot[];
  bookings: Booking[];
  shipments: Shipment[];
  tasks: Task[];
  employees: EmployeeState[];
  recruitment: { candidates: CandidateState[]; scoutedVenueIds: string[] };
  invoices: Invoice[];
  obligations: Obligation[];
  notices: Notice[];
  delayDecisions: DelayDecision[];
  appliedEventIds: Record<string, true>;
  xpAwards: Record<string, true>;
  /** 지급 시점의 금액. 경험치 불변 조건은 설정 초깃값과 이 기록을 대조한다. */
  xpAwardAmounts: Record<string, number>;
  processedCommands: Record<string, CommandRecord>;
  closedDays: number[];
  log: LogEntry[];
}

// ── 명령 ──

/**
 * 견적 수락과 함께 확정할 준비 담당·운송편 (REF-02 일괄 확정).
 * 하나라도 실행할 수 없으면 수락까지 모두 철회하고 상태를 바꾸지 않는다.
 */
export interface CommitPlan {
  employeeId?: string;
  sailingId?: string;
}

export type Command =
  | { id: string; type: 'START_TRAINING'; employeeId: string }
  | { id: string; type: 'SCOUT_SITE'; venueId: string; employeeId: string }
  | { id: string; type: 'START_RECRUIT_QUEST'; candidateId: string; employeeId: string }
  | { id: string; type: 'HIRE_CANDIDATE'; candidateId: string }
  | { id: string; type: 'ACCEPT_TRADE'; buyOfferId: string; sellOfferId: string; plan?: CommitPlan }
  | { id: string; type: 'ACCEPT_FORWARDING'; offerId: string; plan?: CommitPlan }
  | { id: string; type: 'ASSIGN_TASK'; taskId: string; employeeId: string }
  | { id: string; type: 'BOOK_SAILING'; contractId: string; sailingId: string }
  | { id: string; type: 'CANCEL_CONTRACT'; contractId: string }
  | { id: string; type: 'RESPOND_TO_DELAY'; noticeId: string; shipmentId: string; choice: 'KEEP_SHIPMENT_BOOKING' };

export interface CommandResult {
  commandId: string;
  status: 'APPLIED' | 'REJECTED' | 'DUPLICATE';
  reasonKo: string;
}
