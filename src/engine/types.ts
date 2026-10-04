// 게임 상태와 시나리오 설정의 자료형. UI는 이 상태를 읽기만 하고 경제 값을 따로 소유하지 않는다.

import type { Ledger } from './ledger';
import type { Currency } from './money';
import type { RngState } from './rng';

export const ENGINE_VERSION = '0.1.0';
/** 경제 규칙 판본. 규칙이 바뀌면 올리고, 다른 판본의 저장은 조용히 이어 쓰지 않는다. */
export const RULES_VERSION = 'M1-rules-1';

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
  kind: 'supplier' | 'customer';
  counterpartyId: string;
  cityId: string;
  goodId: string;
  quantity: number;
  unitPriceMinor: number;
  currency: Currency;
  validUntilDay: number;
}

export interface EmployeeDef {
  id: string;
  nameKo: string;
  role: string;
  homeCityId: string;
  workUnitsPerDay: number;
  salaryPerDayMinor: number;
  salaryCurrency: Currency;
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
  dutyRateBasisPoints: number;
  dutyBasis: 'supplier_goods_invoice_only_fictional';
  customsDays: number;
  deliveryDeadlineDay: number;
  paymentDueDay: number;
  /** 출항 전 예약 취소 시 운임 환급액과 취소비 (최소 단위). */
  preDepartureFreightRefundMinor: number;
  preDepartureCancellationFeeMinor: number;
  /** 고객 계약 취소 보상 (이 fixture에서는 0). */
  customerCancellationCompensationMinor: number;
  /** 납기 경과 인도 시 사전 계약 조건에 따른 판매대금 감액 (최소 단위, 1회). */
  lateDeliveryPriceReductionMinor: number;
}

export interface ScenarioConfig {
  id: string;
  titleKo: string;
  stage: string;
  baseScenarioId: string | null;
  seed: number;
  campaignDays: number;
  homeCityId: string;
  tradeCurrency: Currency;
  payrollCurrency: Currency;
  startingCash: Partial<Record<Currency, number>>;
  cities: CityDef[];
  good: GoodDef;
  route: RouteDef;
  buyOffer: OfferDef;
  sellOffer: OfferDef;
  employees: EmployeeDef[];
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
  | 'HELD_UNALLOCATED';
export type InvoiceStatus = 'OUTSTANDING' | 'OVERDUE' | 'PAID';
export type TaskStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'ABORTED';
export type BookingStatus = 'BOOKED' | 'DEPARTED' | 'CANCELLED';

export interface OfferState {
  id: string;
  status: 'OPEN' | 'ACCEPTED' | 'EXPIRED';
}

export interface Contract {
  id: string;
  kind: 'DIRECT_TRADE';
  status: ContractStatus;
  buyOfferId: string;
  sellOfferId: string;
  supplierId: string;
  customerId: string;
  goodId: string;
  quantity: number;
  purchaseAmountMinor: number;
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
  /** 회사 소유 재고. 고객 위탁 화물은 M2 운송 주선에서 별도 소유자로 추가한다. */
  owner: 'COMPANY';
  goodId: string;
  quantity: number;
  /** 원산지 국가 코드 (출발항과 구분). */
  originCountryCode: string;
  /** 매입가 + 출발 시 운임 + 수입 관세로 누적되는 장부가액. */
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
  kind: 'EXPORT_PREP';
  contractId: string;
  cityId: string;
  requiredWorkUnits: number;
  progressWorkUnits: number;
  status: TaskStatus;
  assignedEmployeeId: string | null;
  startedDay: number | null;
  completedDay: number | null;
}

export interface EmployeeState {
  id: string;
  locationCityId: string;
  employmentStatus: 'employed';
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
  invoices: Invoice[];
  obligations: Obligation[];
  notices: Notice[];
  delayDecisions: DelayDecision[];
  appliedEventIds: Record<string, true>;
  processedCommands: Record<string, CommandRecord>;
  closedDays: number[];
  log: LogEntry[];
}

// ── 명령 ──

export type Command =
  | { id: string; type: 'ACCEPT_TRADE'; buyOfferId: string; sellOfferId: string }
  | { id: string; type: 'ASSIGN_TASK'; taskId: string; employeeId: string }
  | { id: string; type: 'BOOK_SAILING'; contractId: string; sailingId: string }
  | { id: string; type: 'CANCEL_CONTRACT'; contractId: string }
  | { id: string; type: 'RESPOND_TO_DELAY'; noticeId: string; shipmentId: string; choice: 'KEEP_SHIPMENT_BOOKING' };

export interface CommandResult {
  commandId: string;
  status: 'APPLIED' | 'REJECTED' | 'DUPLICATE';
  reasonKo: string;
}
