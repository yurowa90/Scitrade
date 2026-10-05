// 저장은 외부 입력이다. 이관한 판본 4의 필수 필드·배열 원소까지 확인한 뒤 엔진에 넘긴다.
import type { GameState } from './types';

type Shape = (value: unknown, path: string) => void;
const scalar = (test: (v: unknown) => boolean): Shape => (v, path) => {
  if (!test(v)) throw new Error(`${path}: 저장 필드 모양이 올바르지 않습니다.`);
};
const str = scalar((v) => typeof v === 'string');
const int = scalar((v) => Number.isSafeInteger(v));
const bool = scalar((v) => typeof v === 'boolean');
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const obj = (fields: Record<string, Shape>): Shape => (v, path) => {
  if (!record(v)) throw new Error(`${path}: 객체가 필요합니다.`);
  for (const [key, shape] of Object.entries(fields)) shape(v[key], `${path}.${key}`);
};
const array = (shape: Shape): Shape => (v, path) => {
  if (!Array.isArray(v)) throw new Error(`${path}: 배열이 필요합니다.`);
  v.forEach((item, i) => shape(item, `${path}[${i}]`));
};
const map = (shape: Shape): Shape => (v, path) => {
  if (!record(v)) throw new Error(`${path}: 기록 객체가 필요합니다.`);
  for (const [key, item] of Object.entries(v)) shape(item, `${path}.${key}`);
};
const oneOf = (...values: unknown[]) => scalar((v) => values.includes(v));
const nullable = (shape: Shape): Shape => (v, path) => { if (v !== null) shape(v, path); };
const optional = (shape: Shape): Shape => (v, path) => { if (v !== undefined) shape(v, path); };
const ns = nullable(str), ni = nullable(int), strings = array(str), currency = oneOf('KRW', 'USD', 'XXX');
const stateShape = obj({
  meta: obj({ engineVersion: str, rulesVersion: str, dataVersion: str, scenarioId: str }),
  day: scalar((v) => Number.isSafeInteger(v) && (v as number) >= 1),
  phase: oneOf('PENDING_OPEN', 'AWAITING_INPUT', 'ENDED'),
  rng: obj({ seed: int, cursors: map(int) }),
  ledger: obj({ entries: array(obj({ id: str, day: int, currency, reason: str, contractId: optional(str),
    lines: array(obj({ amount: int, account: oneOf('CASH', 'INVENTORY', 'PREPAID_FREIGHT', 'FORWARDING_WIP',
      'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'OPENING_EQUITY', 'REVENUE', 'COST_OF_GOODS_SOLD',
      'FORWARDING_REVENUE', 'FORWARDING_COST', 'CANCELLATION_EXPENSE', 'WAGE_EXPENSE', 'RECRUITMENT_EXPENSE', 'TRAINING_EXPENSE') })) })),
    postedIds: map(oneOf(true)) }),
  offers: array(obj({ id: str, status: oneOf('OPEN', 'ACCEPTED', 'EXPIRED') })),
  contracts: array(obj({ id: str, kind: oneOf('DIRECT_TRADE', 'FORWARDING'),
    status: oneOf('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'), buyOfferId: ns, sellOfferId: ns,
    serviceOfferId: ns, supplierId: ns, customerId: str, goodId: str, quantity: int,
    purchaseAmountMinor: int, saleAmountMinor: int, currency, originCityId: str, destinationCityId: str,
    deliveryDeadlineDay: int, paymentDueDay: int, acceptedDay: int, ownerEmployeeId: ns, cargoLotId: str,
    prepTaskId: str, bookingId: ns, invoiceId: ns, deliveredDay: ni, lateDays: int, priceReductionMinor: int,
    cancelledDay: ni, completedDay: ni })),
  cargoLots: array(obj({ id: str, owner: oneOf('COMPANY', 'CUSTOMER'), ownerPartyId: ns, goodId: str,
    quantity: int, originCountryCode: str, carryingAmountMinor: int, currency, locationCityId: ns,
    status: oneOf('PREPARING', 'AWAITING_DEPARTURE', 'IN_TRANSIT', 'ARRIVED_RELEASING', 'DELIVERED', 'HELD_UNALLOCATED', 'RETURNED_TO_OWNER'),
    contractId: ns, shipmentId: ns })),
  bookings: array(obj({ id: str, contractId: str, routeId: str, sailingId: str, departureDay: int,
    massGrams: int, volumeLiters: int, prepaidFreightMinor: int, status: oneOf('BOOKED', 'DEPARTED', 'CANCELLED') })),
  shipments: array(obj({ id: str, bookingId: str, contractId: str, cargoLotId: str, departureDay: int,
    scheduledArrivalDay: int, arrivalDay: ni, releaseDay: ni, observedWaitDays: int, delayEventIds: strings,
    dutyMinor: ni, dutyPaid: bool })),
  tasks: array(obj({ id: str, kind: oneOf('EXPORT_PREP', 'FORWARDING_PREP', 'SCOUT', 'RECRUIT_QUEST', 'TRAINING'),
    contractId: ns, subjectId: ns, cityId: str, requiredWorkUnits: int, progressWorkUnits: int,
    status: oneOf('QUEUED', 'RUNNING', 'DONE', 'ABORTED'), assignedEmployeeId: ns, startedDay: ni, completedDay: ni })),
  employees: array(obj({ id: str, xp: int, locationCityId: str, employmentStatus: oneOf('employed', 'candidate'), availableFromDay: int })),
  recruitment: obj({ candidates: array(obj({ employeeId: str,
    stage: oneOf('UNDISCOVERED', 'DISCOVERED', 'QUEST_RUNNING', 'INTERVIEW_READY', 'HIRED'),
    discoveredDay: ni, questTaskId: ns, interviewReadyDay: ni, hiredDay: ni })), scoutedVenueIds: strings }),
  invoices: array(obj({ id: str, contractId: str, currency, amountMinor: int, issuedDay: int, dueDay: int,
    status: oneOf('OUTSTANDING', 'OVERDUE', 'PAID'), receiptIds: strings })),
  obligations: array(obj({ id: str, currency, amountMinor: int, reasonKo: str, incurredDay: int, paidDay: ni })),
  notices: array(obj({ id: str, day: int, kind: oneOf('PORT_RESTRICTION'), eventInstanceId: str,
    titleKo: str, bodyKo: str, affectedShipmentIds: strings, evidenceKo: str })),
  delayDecisions: array(obj({ noticeId: str, shipmentId: str, choice: oneOf(null, 'KEEP_SHIPMENT_BOOKING'), decidedDay: ni })),
  appliedEventIds: map(oneOf(true)), xpAwards: map(oneOf(true)), xpAwardAmounts: map(int),
  processedCommands: map(obj({ day: int, type: str, status: oneOf('APPLIED', 'REJECTED'), reasonKo: str })),
  closedDays: array(int), log: array(obj({ day: int, textKo: str })),
} satisfies Record<keyof GameState, Shape>);

export function checkSaveShape(value: unknown): asserts value is GameState {
  stateShape(value, 'state');
}
