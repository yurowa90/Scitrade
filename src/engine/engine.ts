// M1 하루 단위 경제 엔진.
// openDay: 당일 사건을 한 번 적용·공개하고 입력을 기다린다.
// commitDay: 명령 검증·실행부터 운송·인도·결제·마감까지 고정 순서로 처리한다.
// 두 함수 모두 입력 상태를 바꾸지 않고 새 상태를 돌려준다. 현재 시각·네트워크·Math.random을 쓰지 않는다.

import { balance, emptyLedger, post, type LedgerLine } from './ledger';
import { applyBasisPoints, formatMoney, type Currency } from './money';
import { createRng } from './rng';
import {
  ENGINE_VERSION,
  RULES_VERSION,
  type Booking,
  type Command,
  type CommandResult,
  type Contract,
  type GameState,
  type Notice,
  type ScenarioConfig,
  type Shipment,
} from './types';
import { checkInvariants } from './invariants';

export class EngineError extends Error {}

const clone = <T>(value: T): T => structuredClone(value);
const pad = (n: number, width = 3) => String(n).padStart(width, '0');

// ── 생성 ──

export function createGame(config: ScenarioConfig): GameState {
  const ledger = emptyLedger();
  for (const [currency, minor] of Object.entries(config.startingCash) as [Currency, number][]) {
    if (!minor) continue;
    post(ledger, {
      id: `OPENING-${currency}`,
      day: 0,
      currency,
      lines: [
        { account: 'CASH', amount: minor },
        { account: 'OPENING_EQUITY', amount: -minor },
      ],
      reason: '시작 자금',
    });
  }
  return {
    meta: {
      engineVersion: ENGINE_VERSION,
      rulesVersion: RULES_VERSION,
      dataVersion: config.dataVersion,
      scenarioId: config.id,
    },
    day: 1,
    phase: 'PENDING_OPEN',
    rng: createRng(config.seed),
    ledger,
    offers: [config.buyOffer, config.sellOffer].map((o) => ({ id: o.id, status: 'OPEN' as const })),
    contracts: [],
    cargoLots: [],
    bookings: [],
    shipments: [],
    tasks: [],
    employees: config.employees.map((e) => ({
      id: e.id,
      locationCityId: e.homeCityId,
      employmentStatus: 'employed' as const,
    })),
    invoices: [],
    obligations: [],
    notices: [],
    delayDecisions: [],
    appliedEventIds: {},
    processedCommands: {},
    closedDays: [],
    log: [],
  };
}

// ── 운항표 ──

export interface Sailing {
  id: string;
  routeId: string;
  departureDay: number;
  scheduledArrivalDay: number;
}

export function listSailings(config: ScenarioConfig, fromDay = 1, toDay = config.campaignDays): Sailing[] {
  const r = config.route;
  const sailings: Sailing[] = [];
  for (let d = r.firstDepartureDay; d <= toDay; d += r.departureIntervalDays) {
    if (d < fromDay) continue;
    sailings.push({
      id: `${r.id}-D${pad(d)}`,
      routeId: r.id,
      departureDay: d,
      scheduledArrivalDay: d + r.transitDays,
    });
  }
  return sailings;
}

export function cargoSpace(config: ScenarioConfig, quantity: number) {
  return {
    massGrams: Math.round(quantity * config.good.massKgPerUnit * 1000),
    volumeLiters: Math.round(quantity * config.good.volumeM3PerUnit * 1000),
  };
}

export function bookedSpace(state: GameState, sailingId: string) {
  let massGrams = 0;
  let volumeLiters = 0;
  for (const b of state.bookings) {
    if (b.sailingId !== sailingId || b.status === 'CANCELLED') continue;
    massGrams += b.massGrams;
    volumeLiters += b.volumeLiters;
  }
  return { massGrams, volumeLiters };
}

// ── 일자 시작 ──

export function openDay(state: GameState, config: ScenarioConfig): { state: GameState; announcements: Notice[] } {
  // 이미 열린 날을 다시 열면 사건을 재적용하지 않는다.
  if (state.phase !== 'PENDING_OPEN') return { state, announcements: [] };
  const s = clone(state);
  const announcements: Notice[] = [];
  for (const r of config.portRestrictions) {
    if (r.announceDay !== s.day || s.appliedEventIds[r.eventInstanceId]) continue;
    const affected = s.shipments.filter(
      (sh) => sh.arrivalDay === null && contractOf(s, sh.contractId).destinationCityId === r.cityId,
    );
    const notice: Notice = {
      id: `NOTICE-${r.eventInstanceId}`,
      day: s.day,
      kind: 'PORT_RESTRICTION',
      eventInstanceId: r.eventInstanceId,
      titleKo: `${cityName(config, r.cityId)}항 하역 중단 예보`,
      bodyKo: `${r.forecastKo}. 이 기간에는 입항 선박이 하역하지 못하고 대기합니다. 지연은 실제로 기다린 날만큼 누적되며 미리 더하지 않습니다.`,
      affectedShipmentIds: affected.map((sh) => sh.id),
      evidenceKo: '시나리오에 고정된 가상 항만 공지(DESIGN). 실제 기상 자료가 아니며, M1에서는 예보와 실제 제한이 같습니다.',
    };
    s.notices.push(notice);
    for (const sh of affected) {
      s.delayDecisions.push({ noticeId: notice.id, shipmentId: sh.id, choice: null, decidedDay: null });
    }
    s.appliedEventIds[r.eventInstanceId] = true;
    announcements.push(notice);
    log(s, `항만 공지: ${notice.titleKo} (영향 화물 ${affected.length}건)`);
  }
  s.phase = 'AWAITING_INPUT';
  return { state: s, announcements };
}

// ── 명령 ──

/** 상태를 바꾸지 않고 같은 날 대기 중인 명령들을 누적 검증한다. */
export function planCommands(state: GameState, config: ScenarioConfig, commands: Command[]): CommandResult[] {
  return planState(state, config, commands).results;
}

/**
 * 대기 명령을 실행했다고 가정한 사본 상태. 화면이 ‘오늘 실행 예정’인 계약·예약을 보여 줄 때 쓴다.
 * 날짜·운송·결제는 진행하지 않으며 원래 상태는 바뀌지 않는다.
 */
export function planState(
  state: GameState,
  config: ScenarioConfig,
  commands: Command[],
): { state: GameState; results: CommandResult[] } {
  const s = clone(state);
  const results = commands.map((cmd) => applyCommand(s, config, cmd));
  return { state: s, results };
}

function applyCommand(s: GameState, config: ScenarioConfig, cmd: Command): CommandResult {
  if (s.processedCommands[cmd.id]) {
    return { commandId: cmd.id, status: 'DUPLICATE', reasonKo: '이미 처리한 명령 ID입니다. 다시 실행하지 않습니다.' };
  }
  let rejection: string | null;
  switch (cmd.type) {
    case 'ACCEPT_TRADE':
      rejection = acceptTrade(s, config, cmd.buyOfferId, cmd.sellOfferId);
      break;
    case 'ASSIGN_TASK':
      rejection = assignTask(s, config, cmd.taskId, cmd.employeeId);
      break;
    case 'BOOK_SAILING':
      rejection = bookSailing(s, config, cmd.contractId, cmd.sailingId);
      break;
    case 'CANCEL_CONTRACT':
      rejection = cancelContract(s, config, cmd.contractId);
      break;
    case 'RESPOND_TO_DELAY':
      rejection = respondToDelay(s, cmd.noticeId, cmd.shipmentId);
      break;
  }
  const status = rejection === null ? 'APPLIED' : 'REJECTED';
  const reasonKo = rejection ?? '처리됨';
  s.processedCommands[cmd.id] = { day: s.day, type: cmd.type, status, reasonKo };
  return { commandId: cmd.id, status, reasonKo };
}

function acceptTrade(s: GameState, config: ScenarioConfig, buyOfferId: string, sellOfferId: string): string | null {
  const buy = config.buyOffer;
  const sell = config.sellOffer;
  if (buyOfferId !== buy.id || sellOfferId !== sell.id) return '이 시나리오에 없는 견적입니다.';
  for (const offer of [buy, sell]) {
    const st = s.offers.find((o) => o.id === offer.id);
    if (!st || st.status !== 'OPEN') return `견적 ${offer.id}은(는) 더 이상 유효하지 않습니다.`;
    if (offer.validUntilDay < s.day) return `견적 ${offer.id}의 유효기간(${offer.validUntilDay}일)이 지났습니다.`;
  }
  if (buy.goodId !== sell.goodId || buy.quantity !== sell.quantity) return 'M1은 같은 상품·같은 수량의 매입·판매만 묶을 수 있습니다.';
  if (buy.currency !== sell.currency) return '매입과 판매의 통화가 다릅니다.';
  const route = config.route;
  if (route.fromCityId !== buy.cityId || route.toCityId !== sell.cityId) return '두 항구를 잇는 노선이 없습니다.';

  const purchase = buy.unitPriceMinor * buy.quantity;
  const cash = balance(s.ledger, buy.currency, 'CASH');
  if (cash < purchase) {
    return `매입 자금이 부족합니다. 필요 ${formatMoney(buy.currency, purchase)}, 사용 가능 ${formatMoney(buy.currency, cash)}.`;
  }

  const n = s.contracts.length + 1;
  const contractId = `CT${pad(n)}`;
  const lotId = `LOT${pad(n)}`;
  const taskId = `TASK${pad(n)}`;
  const contract: Contract = {
    id: contractId,
    kind: 'DIRECT_TRADE',
    status: 'ACTIVE',
    buyOfferId: buy.id,
    sellOfferId: sell.id,
    supplierId: buy.counterpartyId,
    customerId: sell.counterpartyId,
    goodId: buy.goodId,
    quantity: buy.quantity,
    purchaseAmountMinor: purchase,
    saleAmountMinor: sell.unitPriceMinor * sell.quantity,
    currency: buy.currency,
    originCityId: buy.cityId,
    destinationCityId: sell.cityId,
    deliveryDeadlineDay: config.terms.deliveryDeadlineDay,
    paymentDueDay: config.terms.paymentDueDay,
    acceptedDay: s.day,
    ownerEmployeeId: null,
    cargoLotId: lotId,
    prepTaskId: taskId,
    bookingId: null,
    invoiceId: null,
    deliveredDay: null,
    lateDays: 0,
    priceReductionMinor: 0,
    cancelledDay: null,
    completedDay: null,
  };
  s.contracts.push(contract);
  s.cargoLots.push({
    id: lotId,
    owner: 'COMPANY',
    goodId: buy.goodId,
    quantity: buy.quantity,
    originCountryCode: config.cities.find((c) => c.id === buy.cityId)?.countryCode ?? 'UNKNOWN',
    carryingAmountMinor: purchase,
    currency: buy.currency,
    locationCityId: buy.cityId,
    status: 'PREPARING',
    contractId,
    shipmentId: null,
  });
  s.tasks.push({
    id: taskId,
    kind: 'EXPORT_PREP',
    contractId,
    cityId: buy.cityId,
    requiredWorkUnits: config.terms.prepWorkUnits,
    progressWorkUnits: 0,
    status: 'QUEUED',
    assignedEmployeeId: null,
    startedDay: null,
    completedDay: null,
  });
  postOrThrow(s, {
    id: `PURCHASE-${contractId}`,
    currency: buy.currency,
    contractId,
    reason: `${config.good.nameKo} ${buy.quantity}${unitKo(config)} 매입 (현금 → 재고)`,
    lines: [
      { account: 'INVENTORY', amount: purchase },
      { account: 'CASH', amount: -purchase },
    ],
  });
  for (const st of s.offers) if (st.id === buy.id || st.id === sell.id) st.status = 'ACCEPTED';
  log(s, `계약 ${contractId} 체결: ${config.good.nameKo} ${buy.quantity}${unitKo(config)} 매입 ${formatMoney(buy.currency, purchase)} 현금 지급, 판매 ${formatMoney(sell.currency, contract.saleAmountMinor)} (납기 ${contract.deliveryDeadlineDay}일)`);
  return null;
}

function assignTask(s: GameState, config: ScenarioConfig, taskId: string, employeeId: string): string | null {
  const task = s.tasks.find((t) => t.id === taskId);
  if (!task) return '업무를 찾을 수 없습니다.';
  if (task.status !== 'QUEUED') return '이미 배정했거나 종료된 업무입니다.';
  const emp = s.employees.find((e) => e.id === employeeId);
  const def = config.employees.find((e) => e.id === employeeId);
  if (!emp || !def || emp.employmentStatus !== 'employed') return '고용 중인 직원이 아닙니다.';
  if (emp.locationCityId !== task.cityId) {
    return `${def.nameKo}은(는) ${cityName(config, emp.locationCityId)}에 있습니다. 이 업무는 ${cityName(config, task.cityId)} 현지 인력이 필요합니다.`;
  }
  if (s.tasks.some((t) => t.status === 'RUNNING' && t.assignedEmployeeId === employeeId)) {
    return `${def.nameKo}은(는) 다른 업무를 진행 중입니다.`;
  }
  task.status = 'RUNNING';
  task.assignedEmployeeId = employeeId;
  task.startedDay = s.day;
  const contract = contractOf(s, task.contractId);
  contract.ownerEmployeeId = employeeId;
  if (contract.status === 'ACTIVE') contract.status = 'IN_PROGRESS';
  log(s, `${def.nameKo}에게 ${contract.id} 수출 준비 업무 배정 (${task.requiredWorkUnits} 업무 포인트)`);
  return null;
}

function bookSailing(s: GameState, config: ScenarioConfig, contractId: string, sailingId: string): string | null {
  const contract = s.contracts.find((c) => c.id === contractId);
  if (!contract) return '계약을 찾을 수 없습니다.';
  if (contract.status !== 'ACTIVE' && contract.status !== 'IN_PROGRESS') return '진행 중인 계약이 아닙니다.';
  const existing = contract.bookingId ? s.bookings.find((b) => b.id === contract.bookingId) : undefined;
  if (existing && existing.status !== 'CANCELLED') return '이미 운송편을 예약했습니다.';
  const sailing = listSailings(config).find((x) => x.id === sailingId);
  if (!sailing) return '운항표에 없는 출항편입니다.';
  if (config.route.fromCityId !== contract.originCityId || config.route.toCityId !== contract.destinationCityId) {
    return '계약 구간과 노선이 다릅니다.';
  }
  if (sailing.departureDay <= s.day) return `예약 마감이 지났습니다. 출항(${sailing.departureDay}일) 전날까지 예약해야 합니다.`;
  const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
  if (!lot || lot.locationCityId !== config.route.fromCityId) return '출발항에 실을 화물이 없습니다.';

  const space = cargoSpace(config, lot.quantity);
  const used = bookedSpace(s, sailing.id);
  const capG = Math.round(config.route.capacityKg * 1000);
  const capL = Math.round(config.route.capacityM3 * 1000);
  if (used.massGrams + space.massGrams > capG || used.volumeLiters + space.volumeLiters > capL) {
    return '이 출항편의 남은 화물 공간이 부족합니다.';
  }
  const fee = config.route.bookingFeeMinor;
  const cash = balance(s.ledger, config.route.currency, 'CASH');
  if (cash < fee) return `운임 선지급 자금이 부족합니다. 필요 ${formatMoney(config.route.currency, fee)}, 사용 가능 ${formatMoney(config.route.currency, cash)}.`;

  const booking: Booking = {
    id: `BK${pad(s.bookings.length + 1)}`,
    contractId,
    routeId: config.route.id,
    sailingId: sailing.id,
    departureDay: sailing.departureDay,
    massGrams: space.massGrams,
    volumeLiters: space.volumeLiters,
    prepaidFreightMinor: fee,
    status: 'BOOKED',
  };
  s.bookings.push(booking);
  contract.bookingId = booking.id;
  postOrThrow(s, {
    id: `FREIGHT-PREPAY-${booking.id}`,
    currency: config.route.currency,
    contractId,
    reason: `${sailing.id} 화물 공간 예약, 운임 선지급 (현금 → 선급운임)`,
    lines: [
      { account: 'PREPAID_FREIGHT', amount: fee },
      { account: 'CASH', amount: -fee },
    ],
  });
  log(s, `${contract.id} 운송편 예약: ${sailing.departureDay}일 출항 ${sailing.id}, 운임 ${formatMoney(config.route.currency, fee)} 선지급`);
  return null;
}

/** 출항 전 예약 해제. 운임 환급과 취소비를 계약 조건대로 정산한다. */
function releaseBooking(s: GameState, config: ScenarioConfig, booking: Booking, why: string) {
  const refund = config.terms.preDepartureFreightRefundMinor;
  const fee = config.terms.preDepartureCancellationFeeMinor;
  if (refund + fee !== booking.prepaidFreightMinor) {
    throw new EngineError(`${booking.id}: 환급(${refund})+취소비(${fee})가 선급운임(${booking.prepaidFreightMinor})과 다릅니다.`);
  }
  const lines: LedgerLine[] = [{ account: 'PREPAID_FREIGHT', amount: -booking.prepaidFreightMinor }];
  if (refund > 0) lines.push({ account: 'CASH', amount: refund });
  if (fee > 0) lines.push({ account: 'CANCELLATION_EXPENSE', amount: fee });
  postOrThrow(s, {
    id: `FREIGHT-RELEASE-${booking.id}`,
    currency: config.route.currency,
    contractId: booking.contractId,
    reason: `${why}: 운임 ${formatMoney(config.route.currency, refund)} 환급, 취소비 ${formatMoney(config.route.currency, fee)}`,
    lines,
  });
  booking.status = 'CANCELLED';
}

function cancelContract(s: GameState, config: ScenarioConfig, contractId: string): string | null {
  const contract = s.contracts.find((c) => c.id === contractId);
  if (!contract) return '계약을 찾을 수 없습니다.';
  if (contract.status !== 'ACTIVE' && contract.status !== 'IN_PROGRESS') return '취소할 수 있는 상태가 아닙니다.';
  const booking = contract.bookingId ? s.bookings.find((b) => b.id === contract.bookingId) : undefined;
  if (booking?.status === 'DEPARTED') return '이미 출항한 화물은 M1에서 취소할 수 없습니다. 인도 후 정산만 가능합니다.';

  if (booking && booking.status === 'BOOKED') releaseBooking(s, config, booking, `${contract.id} 출항 전 취소`);
  const compensation = config.terms.customerCancellationCompensationMinor;
  if (compensation > 0) {
    payOrAccrue(s, contract.currency, compensation, `CANCEL-COMP-${contract.id}`, '고객 취소 보상', contract.id, 'CANCELLATION_EXPENSE');
  }
  const task = s.tasks.find((t) => t.id === contract.prepTaskId);
  if (task && (task.status === 'QUEUED' || task.status === 'RUNNING')) task.status = 'ABORTED';
  const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
  if (lot) {
    // 공급자 반품 없음: 회사 소유 재고로 출발항에 남는다.
    lot.status = 'HELD_UNALLOCATED';
    lot.contractId = null;
  }
  contract.status = 'CANCELLED';
  contract.cancelledDay = s.day;
  log(s, `${contract.id} 출항 전 취소. 상품 ${contract.quantity}${unitKo(config)}은(는) 반품 없이 회사 재고로 ${cityName(config, contract.originCityId)}에 남음`);
  return null;
}

function respondToDelay(s: GameState, noticeId: string, shipmentId: string): string | null {
  const decision = s.delayDecisions.find((d) => d.noticeId === noticeId && d.shipmentId === shipmentId);
  if (!decision) return '대응할 지연 공지가 없습니다.';
  if (decision.choice !== null) return '이미 대응을 결정했습니다.';
  decision.choice = 'KEEP_SHIPMENT_BOOKING';
  decision.decidedDay = s.day;
  log(s, `${shipmentId}: 현재 예약으로 대기하기로 결정`);
  return null;
}

// ── 하루 마감 ──

export interface CommitResult {
  state: GameState;
  results: CommandResult[];
  /** 이미 마감한 날을 다시 마감하려 한 경우 true. 상태는 그대로다. */
  alreadyClosed: boolean;
}

export function commitDay(
  state: GameState,
  config: ScenarioConfig,
  commands: Command[],
  closingDay: number = state.day,
): CommitResult {
  if (state.closedDays.includes(closingDay) || closingDay !== state.day) {
    return { state, results: [], alreadyClosed: true };
  }
  if (state.phase !== 'AWAITING_INPUT') {
    throw new EngineError(`${state.day}일은 아직 열리지 않았습니다. openDay를 먼저 호출하세요.`);
  }
  const s = clone(state);
  const day = s.day;

  // 2~3. 명령 검증·실행 (앞 명령의 예약·지출을 반영해 순서대로 검증)
  const results = commands.map((cmd) => applyCommand(s, config, cmd));
  // 3. 직원 업무 진행 (M1: LEGACY_FIXED 처리량)
  progressTasks(s, config);
  // 4. 출항·이동·도착·통관
  processDepartures(s, config);
  processArrivals(s, config);
  // 5. 인도·납기 판정
  processDeliveries(s, config);
  // 6. 수금 → 밀린 지급 → 급여
  processCollections(s, config);
  settleObligations(s);
  processPayroll(s, config);
  // 7. 다음 날 견적 갱신 (M1: 유효기간 만료만)
  for (const st of s.offers) {
    const def = st.id === config.buyOffer.id ? config.buyOffer : config.sellOffer;
    if (st.status === 'OPEN' && def.validUntilDay < day + 1) {
      st.status = 'EXPIRED';
      log(s, `견적 ${st.id} 유효기간 만료`);
    }
  }
  // 8. 불변 조건 검사·마감
  checkInvariants(s, config);
  s.closedDays.push(day);
  s.day = day + 1;
  s.phase = s.day > config.campaignDays ? 'ENDED' : 'PENDING_OPEN';
  return { state: s, results, alreadyClosed: false };
}

function progressTasks(s: GameState, config: ScenarioConfig) {
  for (const task of s.tasks) {
    if (task.status !== 'RUNNING' || !task.assignedEmployeeId) continue;
    const def = config.employees.find((e) => e.id === task.assignedEmployeeId);
    if (!def) continue;
    task.progressWorkUnits = Math.min(task.requiredWorkUnits, task.progressWorkUnits + def.workUnitsPerDay);
    if (task.progressWorkUnits >= task.requiredWorkUnits) {
      task.status = 'DONE';
      task.completedDay = s.day;
      const lot = s.cargoLots.find((l) => l.contractId === task.contractId);
      if (lot && lot.status === 'PREPARING') lot.status = 'AWAITING_DEPARTURE';
      log(s, `${def.nameKo}: ${task.contractId} 수출 준비 완료 → 출발 대기`);
    }
  }
}

function processDepartures(s: GameState, config: ScenarioConfig) {
  for (const booking of s.bookings) {
    if (booking.status !== 'BOOKED' || booking.departureDay !== s.day) continue;
    const contract = contractOf(s, booking.contractId);
    const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
    if (!lot || lot.status !== 'AWAITING_DEPARTURE' || lot.locationCityId !== config.route.fromCityId) {
      releaseBooking(s, config, booking, `${contract.id} 준비 미완료로 출항 불참`);
      contract.bookingId = null;
      log(s, `${contract.id}: 수출 준비가 끝나지 않아 ${booking.sailingId}에 싣지 못함. 다음 출항편을 다시 예약해야 합니다.`);
      continue;
    }
    const shipment: Shipment = {
      id: `SH${pad(s.shipments.length + 1)}`,
      bookingId: booking.id,
      contractId: contract.id,
      cargoLotId: lot.id,
      departureDay: s.day,
      scheduledArrivalDay: s.day + config.route.transitDays,
      arrivalDay: null,
      releaseDay: null,
      observedWaitDays: 0,
      delayEventIds: [],
      dutyMinor: null,
      dutyPaid: false,
    };
    s.shipments.push(shipment);
    booking.status = 'DEPARTED';
    lot.status = 'IN_TRANSIT';
    lot.locationCityId = null;
    lot.shipmentId = shipment.id;
    lot.carryingAmountMinor += booking.prepaidFreightMinor;
    postOrThrow(s, {
      id: `FREIGHT-CAPITALIZE-${booking.id}`,
      currency: config.route.currency,
      contractId: contract.id,
      reason: `${booking.sailingId} 출항: 선급운임을 상품 원가에 포함 (선급운임 → 재고)`,
      lines: [
        { account: 'INVENTORY', amount: booking.prepaidFreightMinor },
        { account: 'PREPAID_FREIGHT', amount: -booking.prepaidFreightMinor },
      ],
    });
    log(s, `${shipment.id} 출항: ${cityName(config, config.route.fromCityId)} → ${cityName(config, config.route.toCityId)}, 도착 예정 ${shipment.scheduledArrivalDay}일`);
  }
}

function processArrivals(s: GameState, config: ScenarioConfig) {
  for (const sh of s.shipments) {
    if (sh.arrivalDay !== null || sh.scheduledArrivalDay > s.day) continue;
    const contract = contractOf(s, sh.contractId);
    const restriction = config.portRestrictions.find(
      (r) => r.cityId === contract.destinationCityId && r.startDay <= s.day && s.day <= r.endDay,
    );
    if (restriction) {
      // 사건 인스턴스는 하나. 매일 실제로 기다린 날만 누적하고 총 지연일을 미리 더하지 않는다.
      sh.observedWaitDays += 1;
      if (!sh.delayEventIds.includes(restriction.eventInstanceId)) sh.delayEventIds.push(restriction.eventInstanceId);
      log(s, `${sh.id}: ${cityName(config, contract.destinationCityId)}항 하역 중단으로 대기 (${sh.observedWaitDays}일째)`);
      continue;
    }
    sh.arrivalDay = s.day;
    sh.releaseDay = s.day + config.terms.customsDays;
    const lot = s.cargoLots.find((l) => l.id === sh.cargoLotId)!;
    lot.status = 'ARRIVED_RELEASING';
    lot.locationCityId = contract.destinationCityId;
    // 통관: 가상 과세 규칙 — 공급자 상품 송장 금액만 과세가격으로 본다.
    const duty = applyBasisPoints(contract.purchaseAmountMinor, config.terms.dutyRateBasisPoints);
    sh.dutyMinor = duty;
    if (duty === 0) {
      sh.dutyPaid = true;
    } else {
      const paid = payOrAccrue(s, contract.currency, duty, `DUTY-${sh.id}`, `${sh.id} 수입 관세 (가상 세율)`, contract.id, 'INVENTORY');
      sh.dutyPaid = paid;
      lot.carryingAmountMinor += duty;
    }
    log(s, `${sh.id} 도착: ${cityName(config, contract.destinationCityId)}${sh.observedWaitDays > 0 ? ` (대기 ${sh.observedWaitDays}일)` : ''}. 관세 ${formatMoney(contract.currency, duty)}${sh.dutyPaid ? ' 지급' : ' 미지급 — 납부 전 반출 불가'}`);
  }
}

function processDeliveries(s: GameState, config: ScenarioConfig) {
  for (const sh of s.shipments) {
    if (sh.arrivalDay === null || sh.releaseDay === null || sh.releaseDay > s.day || !sh.dutyPaid) continue;
    const lot = s.cargoLots.find((l) => l.id === sh.cargoLotId)!;
    if (lot.status !== 'ARRIVED_RELEASING') continue;
    const contract = contractOf(s, sh.contractId);
    const lateDays = Math.max(0, s.day - contract.deliveryDeadlineDay);
    const reduction = lateDays > 0 ? config.terms.lateDeliveryPriceReductionMinor : 0;
    const netSale = contract.saleAmountMinor - reduction;
    contract.deliveredDay = s.day;
    contract.lateDays = lateDays;
    contract.priceReductionMinor = reduction;

    postOrThrow(s, {
      id: `SALE-${contract.id}`,
      currency: contract.currency,
      contractId: contract.id,
      reason: reduction > 0
        ? `인도 완료(납기 ${lateDays}일 경과). 계약 조건에 따른 감액 ${formatMoney(contract.currency, reduction)} 후 외상 매출 (매출 → 매출채권)`
        : '인도 완료. 외상 매출 (매출 → 매출채권)',
      lines: [
        { account: 'ACCOUNTS_RECEIVABLE', amount: netSale },
        { account: 'REVENUE', amount: -netSale },
      ],
    });
    postOrThrow(s, {
      id: `COGS-${contract.id}`,
      currency: contract.currency,
      contractId: contract.id,
      reason: '인도한 상품의 장부가액(매입+운임+관세)을 매출원가로 대체 (재고 → 매출원가)',
      lines: [
        { account: 'COST_OF_GOODS_SOLD', amount: lot.carryingAmountMinor },
        { account: 'INVENTORY', amount: -lot.carryingAmountMinor },
      ],
    });
    lot.status = 'DELIVERED';
    const invoiceId = `INV-${contract.id}`;
    s.invoices.push({
      id: invoiceId,
      contractId: contract.id,
      currency: contract.currency,
      amountMinor: netSale,
      issuedDay: s.day,
      dueDay: Math.max(contract.paymentDueDay, s.day),
      status: 'OUTSTANDING',
      receiptIds: [],
    });
    contract.invoiceId = invoiceId;
    log(s, `${contract.id} 인도 완료${lateDays > 0 ? ` (납기 ${lateDays}일 경과, 감액 ${formatMoney(contract.currency, reduction)})` : ' (납기 내)'}. 매출 ${formatMoney(contract.currency, netSale)}은 채권으로 남고 현금은 ${Math.max(contract.paymentDueDay, s.day)}일 수금 예정`);
  }
}

function processCollections(s: GameState, config: ScenarioConfig) {
  for (const inv of s.invoices) {
    if (inv.status === 'PAID' || inv.dueDay > s.day) continue;
    // M1 고객은 결제일에 전액 지급한다. 연체·대손은 M2 이후.
    applyReceipt(s, `RCPT-${inv.id}`, inv.id);
  }
  void config;
}

/**
 * 수금 적용. 같은 수금 ID는 한 번만 반영한다 (재전송·저장 후 재전송 포함).
 * 반환값: 실제로 반영했으면 true.
 */
export function applyReceipt(s: GameState, receiptId: string, invoiceId: string): boolean {
  const inv = s.invoices.find((i) => i.id === invoiceId);
  if (!inv || inv.status === 'PAID' || inv.receiptIds.includes(receiptId)) return false;
  const posted = post(s.ledger, {
    id: `RECEIPT-${receiptId}`,
    day: s.day,
    currency: inv.currency,
    contractId: inv.contractId,
    reason: '외상대금 수금 (매출채권 → 현금). 매출·이익은 인도 때 이미 인식',
    lines: [
      { account: 'CASH', amount: inv.amountMinor },
      { account: 'ACCOUNTS_RECEIVABLE', amount: -inv.amountMinor },
    ],
  });
  if (!posted) return false;
  inv.receiptIds.push(receiptId);
  inv.status = 'PAID';
  const contract = s.contracts.find((c) => c.id === inv.contractId);
  if (contract) {
    contract.status = 'COMPLETED';
    contract.completedDay = s.day;
  }
  log(s, `${inv.contractId} 대금 ${formatMoney(inv.currency, inv.amountMinor)} 수금. 계약 종결`);
  return true;
}

/** 필수 지급. 현금이 부족하면 무제한 마이너스 대신 미지급 의무(부채)로 기록한다. */
function payOrAccrue(
  s: GameState,
  currency: Currency,
  amount: number,
  obligationId: string,
  reasonKo: string,
  contractId: string | undefined,
  debitAccount: 'INVENTORY' | 'CANCELLATION_EXPENSE' | 'WAGE_EXPENSE',
): boolean {
  const cash = balance(s.ledger, currency, 'CASH');
  if (cash >= amount) {
    postOrThrow(s, {
      id: obligationId,
      currency,
      contractId,
      reason: reasonKo,
      lines: [
        { account: debitAccount, amount },
        { account: 'CASH', amount: -amount },
      ],
    });
    return true;
  }
  postOrThrow(s, {
    id: obligationId,
    currency,
    contractId,
    reason: `${reasonKo} — 현금 부족으로 미지급`,
    lines: [
      { account: debitAccount, amount },
      { account: 'ACCOUNTS_PAYABLE', amount: -amount },
    ],
  });
  s.obligations.push({ id: obligationId, currency, amountMinor: amount, reasonKo, incurredDay: s.day, paidDay: null });
  log(s, `지급 불가: ${reasonKo} ${formatMoney(currency, amount)} → 미지급 의무로 기록 (지급 불이행 유예기간은 아직 확정되지 않음)`);
  return false;
}

function settleObligations(s: GameState) {
  for (const ob of s.obligations) {
    if (ob.paidDay !== null) continue;
    if (balance(s.ledger, ob.currency, 'CASH') < ob.amountMinor) continue;
    postOrThrow(s, {
      id: `SETTLE-${ob.id}`,
      currency: ob.currency,
      reason: `밀린 지급: ${ob.reasonKo}`,
      lines: [
        { account: 'ACCOUNTS_PAYABLE', amount: ob.amountMinor },
        { account: 'CASH', amount: -ob.amountMinor },
      ],
    });
    ob.paidDay = s.day;
    if (ob.id.startsWith('DUTY-')) {
      const sh = s.shipments.find((x) => `DUTY-${x.id}` === ob.id);
      if (sh) sh.dutyPaid = true;
    }
    log(s, `밀린 지급 완료: ${ob.reasonKo} ${formatMoney(ob.currency, ob.amountMinor)}`);
  }
}

function processPayroll(s: GameState, config: ScenarioConfig) {
  for (const emp of s.employees) {
    if (emp.employmentStatus !== 'employed') continue;
    const def = config.employees.find((e) => e.id === emp.id);
    if (!def || def.salaryPerDayMinor === 0) continue;
    payOrAccrue(s, def.salaryCurrency, def.salaryPerDayMinor, `WAGE-D${pad(s.day)}-${emp.id}`, `${def.nameKo} ${s.day}일 급여`, undefined, 'WAGE_EXPENSE');
  }
}

// ── 공통 도우미 ──

function postOrThrow(
  s: GameState,
  entry: { id: string; currency: Currency; reason: string; lines: LedgerLine[]; contractId?: string | undefined },
) {
  const { contractId, ...rest } = entry;
  const posted = post(s.ledger, { ...rest, day: s.day, ...(contractId ? { contractId } : {}) });
  if (!posted) throw new EngineError(`분개 ${entry.id}가 이미 기록되어 있습니다. 같은 사건을 두 번 처리하려 했습니다.`);
}

function contractOf(s: GameState, id: string): Contract {
  const c = s.contracts.find((x) => x.id === id);
  if (!c) throw new EngineError(`계약 ${id}이(가) 없습니다.`);
  return c;
}

function log(s: GameState, textKo: string) {
  s.log.push({ day: s.day, textKo });
}

export function cityName(config: ScenarioConfig, id: string | null): string {
  if (!id) return '이동 중';
  return config.cities.find((c) => c.id === id)?.nameKo ?? id;
}

function unitKo(config: ScenarioConfig): string {
  return config.good.quantityUnit === 'piece' ? '개' : config.good.quantityUnit;
}
