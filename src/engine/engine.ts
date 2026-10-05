// 하루 단위 경제 엔진 (M1 거래 한 건 + M2a 복수 계약·운송 주선·자원 예약).
// openDay: 당일 사건을 한 번 적용·공개하고 입력을 기다린다.
// commitDay: 명령 검증·실행부터 운송·인도·결제·마감까지 고정 순서로 처리한다.
// 두 함수 모두 입력 상태를 바꾸지 않고 새 상태를 돌려준다. 현재 시각·네트워크·Math.random을 쓰지 않는다.

import {
  cargoSpace,
  cityName,
  dutyEstimate,
  findSailing,
  goodOf,
  listSailings,
  offerOf,
  routeBetween,
  routeOf,
  unitKo,
  type Sailing,
} from './catalog';
import { balance, emptyLedger, post, type LedgerLine } from './ledger';
import { formatMoney, type Currency } from './money';
import { fundsPosition, runningTaskOf, spaceShortfall, type CashReservation } from './reservations';
import { createRng } from './rng';
import {
  ENGINE_VERSION,
  type Booking,
  type Command,
  type CommandResult,
  type CommitPlan,
  type Contract,
  type GameState,
  type Notice,
  type OfferDef,
  type ScenarioConfig,
  type Shipment,
  type Task,
} from './types';
import { isEmployed, isAvailableFromToday } from './employees';
import { checkInvariants } from './invariants';
import { awardTaskCompletion } from './growth';
import { taskSubjectKo } from './tasks';

export { cargoSpace, cityName, findSailing, listSailings, type Sailing } from './catalog';

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
      rulesVersion: config.rules.rulesVersion,
      dataVersion: config.dataVersion,
      scenarioId: config.id,
    },
    day: 1,
    phase: 'PENDING_OPEN',
    rng: createRng(config.seed),
    ledger,
    offers: config.offers.map((o) => ({ id: o.id, status: 'OPEN' as const })),
    contracts: [],
    cargoLots: [],
    bookings: [],
    shipments: [],
    tasks: [],
    employees: config.employees.map((e) => ({
      id: e.id,
      xp: e.growth?.startXp ?? 0,
      locationCityId: e.homeCityId,
      employmentStatus: config.recruitment?.candidateEmployeeIds.includes(e.id) ? 'candidate' as const : 'employed' as const,
      availableFromDay: 1,
    })),
    recruitment: {
      candidates: (config.recruitment?.candidateEmployeeIds ?? []).map((employeeId) => ({
        employeeId, stage: 'UNDISCOVERED', discoveredDay: null, questTaskId: null,
        interviewReadyDay: null, hiredDay: null,
      })),
      scoutedVenueIds: [],
    },
    invoices: [],
    obligations: [],
    notices: [],
    delayDecisions: [],
    appliedEventIds: {},
    xpAwards: {},
    xpAwardAmounts: {},
    processedCommands: {},
    closedDays: [],
    log: [],
  };
}

/** 예약한 출항편들이 차지한 무게·부피 합계 (취소된 예약 제외). */
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
    case 'START_TRAINING':
      rejection = startTraining(s, config, cmd.employeeId);
      break;
    case 'ACCEPT_TRADE':
      rejection = withPlan(s, config, cmd.plan, (t) => acceptTrade(t, config, cmd.buyOfferId, cmd.sellOfferId));
      break;
    case 'ACCEPT_FORWARDING':
      rejection = withPlan(s, config, cmd.plan, (t) => acceptForwarding(t, config, cmd.offerId));
      break;
    case 'SCOUT_SITE':
      rejection = scoutSite(s, config, cmd.venueId, cmd.employeeId);
      break;
    case 'START_RECRUIT_QUEST':
      rejection = startRecruitQuest(s, config, cmd.candidateId, cmd.employeeId);
      break;
    case 'HIRE_CANDIDATE':
      rejection = hireCandidate(s, config, cmd.candidateId);
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

/**
 * REF-02 일괄 확정: 수락 → 준비 배정 → 운송편 예약을 사본에서 차례로 시험하고, 모두 성공할 때만 반영한다.
 * 일부만 성공한 상태(수락했지만 배를 못 잡은 계약 등)를 남기지 않는다. 계획이 없으면 수락만 한다.
 */
function withPlan(
  s: GameState,
  config: ScenarioConfig,
  plan: CommitPlan | undefined,
  accept: (target: GameState) => string | null,
): string | null {
  if (!plan || (!plan.employeeId && !plan.sailingId)) return accept(s);
  const trial = clone(s);
  const rejected = accept(trial);
  if (rejected) return rejected;
  const contract = trial.contracts[trial.contracts.length - 1]!;
  if (plan.employeeId) {
    const r = assignTask(trial, config, contract.prepTaskId, plan.employeeId);
    if (r) return `일괄 확정을 철회했습니다 — 준비 배정 불가: ${r}`;
  }
  if (plan.sailingId) {
    const r = bookSailing(trial, config, contract.id, plan.sailingId);
    if (r) return `일괄 확정을 철회했습니다 — 운송편 예약 불가: ${r}`;
  }
  Object.assign(s, trial);
  return null;
}

function offerOpen(s: GameState, offer: OfferDef): string | null {
  const st = s.offers.find((o) => o.id === offer.id);
  if (!st || st.status !== 'OPEN') return `견적 ${offer.id}은(는) 더 이상 유효하지 않습니다.`;
  if (offer.validUntilDay < s.day) return `견적 ${offer.id}의 유효기간(${offer.validUntilDay}일)이 지났습니다.`;
  return null;
}

/** COMMITTED_OUTLAYS 규칙의 자금 부족 설명. 충분하면 null. */
function fundsShortfall(
  s: GameState,
  config: ScenarioConfig,
  currency: Currency,
  needMinor: number,
  breakdownKo: string,
  exclude?: (r: CashReservation) => boolean,
): string | null {
  const f = fundsPosition(s, config, currency, exclude);
  if (f.available >= needMinor) return null;
  const parts = [`현금 ${formatMoney(currency, f.cash)}`];
  if (f.reserved) parts.push(`다른 계약 예약 ${formatMoney(currency, f.reserved)}`);
  if (f.unpaidObligations) parts.push(`미지급 ${formatMoney(currency, f.unpaidObligations)}`);
  return `사용 가능 자금이 부족합니다. 필요 ${formatMoney(currency, needMinor)}(${breakdownKo}), 사용 가능 ${formatMoney(currency, f.available)} = ${parts.join(' − ')}. 체결한 계약의 남은 운임·관세는 미리 묶어 둡니다.`;
}

function nextContractIds(s: GameState) {
  const n = s.contracts.length + 1;
  return { contractId: `CT${pad(n)}`, lotId: `LOT${pad(n)}`, taskId: `TASK${pad(n)}` };
}

function acceptTrade(s: GameState, config: ScenarioConfig, buyOfferId: string, sellOfferId: string): string | null {
  const buy = offerOf(config, buyOfferId);
  const sell = offerOf(config, sellOfferId);
  if (!buy || !sell || buy.kind !== 'supplier' || sell.kind !== 'customer') return '이 시나리오에 없는 견적입니다.';
  for (const offer of [buy, sell]) {
    const closed = offerOpen(s, offer);
    if (closed) return closed;
  }
  if (buy.goodId !== sell.goodId || buy.quantity !== sell.quantity) return '같은 상품·같은 수량의 매입·판매만 묶을 수 있습니다 (분할 거래는 이후 단계).';
  if (buy.currency !== sell.currency) return '매입과 판매의 통화가 다릅니다.';
  const route = routeBetween(config, buy.cityId, sell.cityId);
  if (!route) return '두 항구를 잇는 노선이 없습니다.';

  const purchase = buy.unitPriceMinor * buy.quantity;
  if (config.rules.fundsCheck === 'IMMEDIATE_CASH') {
    const cash = balance(s.ledger, buy.currency, 'CASH');
    if (cash < purchase) {
      return `매입 자금이 부족합니다. 필요 ${formatMoney(buy.currency, purchase)}, 사용 가능 ${formatMoney(buy.currency, cash)}.`;
    }
  } else {
    const duty = dutyEstimate(config, purchase);
    const short = fundsShortfall(
      s,
      config,
      buy.currency,
      purchase + route.bookingFeeMinor + duty,
      `매입 ${formatMoney(buy.currency, purchase)} + 운임 ${formatMoney(buy.currency, route.bookingFeeMinor)} + 관세 ${formatMoney(buy.currency, duty)}`,
    );
    if (short) return short;
  }

  const good = goodOf(config, buy.goodId);
  const { contractId, lotId, taskId } = nextContractIds(s);
  const contract: Contract = {
    id: contractId,
    kind: 'DIRECT_TRADE',
    status: 'ACTIVE',
    buyOfferId: buy.id,
    sellOfferId: sell.id,
    serviceOfferId: null,
    supplierId: buy.counterpartyId,
    customerId: sell.counterpartyId,
    goodId: buy.goodId,
    quantity: buy.quantity,
    purchaseAmountMinor: purchase,
    saleAmountMinor: sell.unitPriceMinor * sell.quantity,
    currency: buy.currency,
    originCityId: buy.cityId,
    destinationCityId: sell.cityId,
    deliveryDeadlineDay: config.terms.deliveryDeadlineDay ?? sell.deliveryDeadlineDay ?? config.campaignDays,
    paymentDueDay: config.terms.paymentDueDay ?? sell.paymentDueDay ?? config.campaignDays,
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
    ownerPartyId: null,
    goodId: buy.goodId,
    quantity: buy.quantity,
    originCountryCode: buy.originCountryCode ?? config.cities.find((c) => c.id === buy.cityId)?.countryCode ?? 'UNKNOWN',
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
    subjectId: null,
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
    reason: `${good.nameKo} ${buy.quantity}${unitKo(good)} 매입 (현금 → 재고)`,
    lines: [
      { account: 'INVENTORY', amount: purchase },
      { account: 'CASH', amount: -purchase },
    ],
  });
  for (const st of s.offers) if (st.id === buy.id || st.id === sell.id) st.status = 'ACCEPTED';
  log(s, `계약 ${contractId} 체결: ${good.nameKo} ${buy.quantity}${unitKo(good)} 매입 ${formatMoney(buy.currency, purchase)} 현금 지급, 판매 ${formatMoney(sell.currency, contract.saleAmountMinor)} (납기 ${contract.deliveryDeadlineDay}일)`);
  return null;
}

function acceptForwarding(s: GameState, config: ScenarioConfig, offerId: string): string | null {
  if (!config.rules.forwardingEnabled) return '이 시나리오에서는 운송 주선을 받지 않습니다 (M2 기능).';
  const offer = offerOf(config, offerId);
  if (!offer || offer.kind !== 'forwarding' || !offer.destinationCityId) return '이 시나리오에 없는 운송 주선 의뢰입니다.';
  const closed = offerOpen(s, offer);
  if (closed) return closed;
  const route = routeBetween(config, offer.cityId, offer.destinationCityId);
  if (!route) return '두 항구를 잇는 노선이 없습니다.';
  if (route.currency !== offer.currency) return '서비스 대금과 운임의 통화가 다릅니다.';
  if (config.rules.fundsCheck === 'COMMITTED_OUTLAYS') {
    const short = fundsShortfall(s, config, offer.currency, route.bookingFeeMinor, `운임 ${formatMoney(offer.currency, route.bookingFeeMinor)}`);
    if (short) return short;
  }

  const good = goodOf(config, offer.goodId);
  const { contractId, lotId, taskId } = nextContractIds(s);
  s.contracts.push({
    id: contractId,
    kind: 'FORWARDING',
    status: 'ACTIVE',
    buyOfferId: null,
    sellOfferId: null,
    serviceOfferId: offer.id,
    supplierId: null,
    customerId: offer.counterpartyId,
    goodId: offer.goodId,
    quantity: offer.quantity,
    purchaseAmountMinor: 0,
    saleAmountMinor: offer.serviceFeeMinor,
    currency: offer.currency,
    originCityId: offer.cityId,
    destinationCityId: offer.destinationCityId,
    deliveryDeadlineDay: offer.deliveryDeadlineDay ?? config.campaignDays,
    paymentDueDay: offer.paymentDueDay ?? config.campaignDays,
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
  });
  // 고객 소유 화물: 회사 재고 장부에 올리지 않는다 (장부가액 0).
  s.cargoLots.push({
    id: lotId,
    owner: 'CUSTOMER',
    ownerPartyId: offer.counterpartyId,
    goodId: offer.goodId,
    quantity: offer.quantity,
    originCountryCode: offer.originCountryCode ?? config.cities.find((c) => c.id === offer.cityId)?.countryCode ?? 'UNKNOWN',
    carryingAmountMinor: 0,
    currency: offer.currency,
    locationCityId: offer.cityId,
    status: 'PREPARING',
    contractId,
    shipmentId: null,
  });
  s.tasks.push({
    id: taskId,
    kind: 'FORWARDING_PREP',
    contractId,
    subjectId: null,
    cityId: offer.cityId,
    requiredWorkUnits: config.terms.forwardingPrepWorkUnits,
    progressWorkUnits: 0,
    status: 'QUEUED',
    assignedEmployeeId: null,
    startedDay: null,
    completedDay: null,
  });
  for (const st of s.offers) if (st.id === offer.id) st.status = 'ACCEPTED';
  log(s, `계약 ${contractId} 체결 (운송 주선): ${offer.counterpartyId}의 ${good.nameKo} ${offer.quantity}${unitKo(good)}을(를) ${cityName(config, offer.cityId)} → ${cityName(config, offer.destinationCityId)} 운송. 서비스 대금 ${formatMoney(offer.currency, offer.serviceFeeMinor)} (납기 ${offer.deliveryDeadlineDay}일). 고객 화물이므로 매입·재고가 없습니다`);
  return null;
}

function taskLabel(kind: Task['kind']): string {
  return { EXPORT_PREP: '수출 준비', FORWARDING_PREP: '운송 주선 준비(화물 인수·선적 서류)',
    SCOUT: '현장 조사', RECRUIT_QUEST: '영입 의뢰', TRAINING: '일반 훈련' }[kind];
}

function employeeUnavailable(s: GameState, config: ScenarioConfig, employeeId: string, cityId: string): string | null {
  const emp = s.employees.find((e) => e.id === employeeId);
  const def = config.employees.find((e) => e.id === employeeId);
  if (!emp || !def || !isEmployed(s, employeeId)) return '고용 중인 직원이 아닙니다.';
  if (!isAvailableFromToday(s, employeeId)) return `${def.nameKo}은(는) ${emp.availableFromDay}일부터 업무를 맡을 수 있습니다.`;
  if (emp.locationCityId !== cityId) {
    return `${def.nameKo}은(는) ${cityName(config, emp.locationCityId)}에 있습니다. 이 업무는 ${cityName(config, cityId)} 현지 인력이 필요합니다.`;
  }
  const busy = runningTaskOf(s, employeeId);
  if (busy) return `${def.nameKo}은(는) 다른 업무(${[taskSubjectKo(config, busy), taskLabel(busy.kind)].filter(Boolean).join(' ')})를 진행 중입니다. 한 사람은 한 번에 업무 하나만 맡습니다.`;
  return null;
}

function assignTask(s: GameState, config: ScenarioConfig, taskId: string, employeeId: string): string | null {
  const task = s.tasks.find((t) => t.id === taskId);
  if (!task) return '업무를 찾을 수 없습니다.';
  return assignTaskObject(s, config, task, employeeId);
}

/** 배정 검사를 마친 뒤에만 업무·계약·로그를 갱신한다. */
function assignTaskObject(s: GameState, config: ScenarioConfig, task: Task, employeeId: string): string | null {
  if (task.status !== 'QUEUED') return '이미 배정했거나 종료된 업무입니다.';
  const rejection = employeeUnavailable(s, config, employeeId, task.cityId);
  if (rejection) return rejection;
  task.status = 'RUNNING';
  task.assignedEmployeeId = employeeId;
  task.startedDay = s.day;
  if (task.contractId !== null) {
    const contract = contractOf(s, task.contractId);
    contract.ownerEmployeeId = employeeId;
    if (contract.status === 'ACTIVE') contract.status = 'IN_PROGRESS';
  }
  const def = config.employees.find((e) => e.id === employeeId)!;
  const label = [taskSubjectKo(config, task), taskLabel(task.kind)].filter(Boolean).join(' ');
  if (task.kind === 'TRAINING') {
    const fee = config.growth!.ordinaryTraining;
    log(s, `${def.nameKo} ${label} 시작 (${task.requiredWorkUnits}일, 훈련비 ${formatMoney(fee.currency, fee.feeMinor)})`);
  } else {
    log(s, `${def.nameKo}에게 ${label} 업무 배정 (${task.requiredWorkUnits} 업무 포인트)`);
  }
  return null;
}

function startTraining(s: GameState, config: ScenarioConfig, employeeId: string): string | null {
  if (!config.growth) return '이 시나리오에서는 일반 훈련을 할 수 없습니다.';
  const emp = s.employees.find((e) => e.id === employeeId);
  const cityId = emp?.locationCityId ?? config.homeCityId;
  const unavailable = employeeUnavailable(s, config, employeeId, cityId);
  if (unavailable) return unavailable;
  if (cityId !== config.homeCityId) return `일반 훈련은 ${cityName(config, config.homeCityId)}에서만 할 수 있습니다.`;
  const def = config.employees.find((e) => e.id === employeeId)!;
  if (!def.growth) return '성장 정보가 없는 직원입니다.';
  const training = config.growth.ordinaryTraining;
  const taskId = `TRAINING-${employeeId}-D${s.day}`;
  if (s.tasks.some((t) => t.id === taskId)) return '이미 생성된 업무 ID입니다.';
  const funds = fundsPosition(s, config, training.currency);
  const available = funds.cash - funds.unpaidObligations;
  if (available < training.feeMinor) return `훈련비 자금이 부족합니다. 필요 ${formatMoney(training.currency, training.feeMinor)}, 사용 가능 ${formatMoney(training.currency, available)}.`;
  const task: Task = {
    id: taskId, kind: 'TRAINING', contractId: null, subjectId: employeeId, cityId,
    requiredWorkUnits: training.durationDays, progressWorkUnits: 0, status: 'QUEUED',
    assignedEmployeeId: null, startedDay: null, completedDay: null,
  };
  const rejection = assignTaskObject(s, config, task, employeeId);
  if (rejection) return rejection;
  s.tasks.push(task);
  postOrThrow(s, {
    id: `TRAINING-FEE-${taskId}`, currency: training.currency, reason: `${def.nameKo} 일반 훈련비`,
    lines: [{ account: 'TRAINING_EXPENSE', amount: training.feeMinor }, { account: 'CASH', amount: -training.feeMinor }],
  });
  return null;
}

function recruitmentUnavailable(s: GameState, config: ScenarioConfig): string | null {
  if (!config.recruitment) return '이 시나리오에서는 동료 영입을 할 수 없습니다.';
  if (s.recruitment.candidates.length === 0) return '이 저장에는 영입 후보 정보가 없습니다.';
  return null;
}

/** 계약 업무 ID와 별도 접두사를 써 기존 계약의 순번을 유지한다. */
function startRecruitmentTask(s: GameState, config: ScenarioConfig, task: Task, employeeId: string): string | null {
  if (s.tasks.some((existing) => existing.id === task.id)) return '이미 생성된 업무 ID입니다.';
  const rejection = assignTaskObject(s, config, task, employeeId);
  if (rejection) return rejection;
  s.tasks.push(task);
  return null;
}

function scoutSite(s: GameState, config: ScenarioConfig, venueId: string, employeeId: string): string | null {
  const unavailable = recruitmentUnavailable(s, config);
  if (unavailable) return unavailable;
  const def = config.recruitment!;
  const site = def.scoutSites.find((x) => x.venueId === venueId);
  if (!site) return '조사할 수 있는 장소가 아닙니다.';
  if (s.recruitment.scoutedVenueIds.includes(venueId)
    || s.tasks.some((t) => t.kind === 'SCOUT' && t.subjectId === venueId && t.status === 'RUNNING')) {
    return '이미 조사했거나 조사 중인 장소입니다.';
  }
  if (!s.recruitment.candidates.some((c) => site.candidateEmployeeIds.includes(c.employeeId) && c.stage === 'UNDISCOVERED')) {
    return '이 장소에는 아직 발견하지 않은 후보가 없습니다.';
  }
  return startRecruitmentTask(s, config, {
    id: `SCOUT-${venueId}`, kind: 'SCOUT', contractId: null, subjectId: venueId, cityId: site.cityId,
    requiredWorkUnits: def.scoutWorkUnits, progressWorkUnits: 0, status: 'QUEUED',
    assignedEmployeeId: null, startedDay: null, completedDay: null,
  }, employeeId);
}

function startRecruitQuest(s: GameState, config: ScenarioConfig, candidateId: string, employeeId: string): string | null {
  const unavailable = recruitmentUnavailable(s, config);
  if (unavailable) return unavailable;
  const def = config.recruitment!;
  const candidate = s.recruitment.candidates.find((c) => c.employeeId === candidateId);
  const site = def.scoutSites.find((x) => x.candidateEmployeeIds.includes(candidateId));
  if (!candidate || !site) return '영입 후보를 찾을 수 없습니다.';
  if (candidate.stage !== 'DISCOVERED') return '발견한 후보에게만 영입 의뢰를 시작할 수 있습니다.';
  const taskId = `RECRUIT-${candidateId}`;
  const rejection = startRecruitmentTask(s, config, {
    id: taskId, kind: 'RECRUIT_QUEST', contractId: null, subjectId: candidateId, cityId: site.cityId,
    requiredWorkUnits: def.questWorkUnits, progressWorkUnits: 0, status: 'QUEUED',
    assignedEmployeeId: null, startedDay: null, completedDay: null,
  }, employeeId);
  if (rejection) return rejection;
  candidate.stage = 'QUEST_RUNNING';
  candidate.questTaskId = taskId;
  return null;
}

function hireCandidate(s: GameState, config: ScenarioConfig, candidateId: string): string | null {
  const unavailable = recruitmentUnavailable(s, config);
  if (unavailable) return unavailable;
  const candidate = s.recruitment.candidates.find((c) => c.employeeId === candidateId);
  const emp = s.employees.find((e) => e.id === candidateId);
  const def = config.employees.find((e) => e.id === candidateId);
  if (!candidate || !emp || !def) return '영입 후보를 찾을 수 없습니다.';
  if (candidate.stage !== 'INTERVIEW_READY' || isEmployed(s, candidateId)) return '면담 가능한 후보만 고용할 수 있습니다.';
  const fee = config.recruitment!.signingFeeWageDays * def.salaryPerDayMinor;
  const funds = fundsPosition(s, config, def.salaryCurrency);
  const available = funds.cash - funds.unpaidObligations;
  if (available < fee) return `영입 계약금 자금이 부족합니다. 필요 ${formatMoney(def.salaryCurrency, fee)}, 사용 가능 ${formatMoney(def.salaryCurrency, available)}.`;
  if (fee > 0) postOrThrow(s, {
    id: `SIGNING-${candidateId}`, currency: def.salaryCurrency, reason: `${def.nameKo} 영입 계약금`,
    lines: [{ account: 'RECRUITMENT_EXPENSE', amount: fee }, { account: 'CASH', amount: -fee }],
  });
  emp.employmentStatus = 'employed';
  emp.availableFromDay = s.day + 1;
  candidate.stage = 'HIRED';
  candidate.hiredDay = s.day;
  log(s, `${def.nameKo} 고용 확정: 계약금 ${formatMoney(def.salaryCurrency, fee)}, ${emp.availableFromDay}일부터 근무·급여 시작`);
  return null;
}

function bookSailing(s: GameState, config: ScenarioConfig, contractId: string, sailingId: string): string | null {
  const contract = s.contracts.find((c) => c.id === contractId);
  if (!contract) return '계약을 찾을 수 없습니다.';
  if (contract.status !== 'ACTIVE' && contract.status !== 'IN_PROGRESS') return '진행 중인 계약이 아닙니다.';
  const existing = contract.bookingId ? s.bookings.find((b) => b.id === contract.bookingId) : undefined;
  if (existing && existing.status !== 'CANCELLED') return '이미 운송편을 예약했습니다.';
  const sailing = findSailing(config, sailingId);
  if (!sailing) return '운항표에 없는 출항편입니다.';
  const route = routeOf(config, sailing.routeId);
  if (route.fromCityId !== contract.originCityId || route.toCityId !== contract.destinationCityId) {
    return '계약 구간과 노선이 다릅니다.';
  }
  if (sailing.departureDay <= s.day) return `예약 마감이 지났습니다. 출항(${sailing.departureDay}일) 전날까지 예약해야 합니다.`;
  const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
  if (!lot || lot.locationCityId !== route.fromCityId) return '출발항에 실을 화물이 없습니다.';

  const short = spaceShortfall(s, config, sailing, lot.goodId, lot.quantity);
  if (short) return `이 출항편의 남은 화물 공간이 부족합니다 (${short}).`;
  const fee = route.bookingFeeMinor;
  if (config.rules.fundsCheck === 'IMMEDIATE_CASH') {
    const cash = balance(s.ledger, route.currency, 'CASH');
    if (cash < fee) return `운임 선지급 자금이 부족합니다. 필요 ${formatMoney(route.currency, fee)}, 사용 가능 ${formatMoney(route.currency, cash)}.`;
  } else {
    // 이 계약의 운임 예약은 지금 쓰려는 바로 그 돈이므로 빼고 계산한다.
    const own = (r: CashReservation) => r.contractId === contract.id && r.kind === 'FREIGHT';
    const shortfall = fundsShortfall(s, config, route.currency, fee, `운임 ${formatMoney(route.currency, fee)}`, own);
    if (shortfall) return `운임 선지급 자금이 부족합니다. ${shortfall}`;
  }

  const space = cargoSpace(config, lot.goodId, lot.quantity);
  const booking: Booking = {
    id: `BK${pad(s.bookings.length + 1)}`,
    contractId,
    routeId: route.id,
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
    currency: route.currency,
    contractId,
    reason: `${sailing.id} 화물 공간 예약, 운임 선지급 (현금 → 선급운임)`,
    lines: [
      { account: 'PREPAID_FREIGHT', amount: fee },
      { account: 'CASH', amount: -fee },
    ],
  });
  log(s, `${contract.id} 운송편 예약: ${sailing.departureDay}일 출항 ${sailing.id}, 운임 ${formatMoney(route.currency, fee)} 선지급`);
  return null;
}

/** 출항 전 예약 해제. 운임 환급과 취소비를 계약 조건대로 정산한다. */
function releaseBooking(s: GameState, config: ScenarioConfig, booking: Booking, why: string) {
  const refund = config.terms.preDepartureFreightRefundMinor;
  const fee = config.terms.preDepartureCancellationFeeMinor;
  if (refund + fee !== booking.prepaidFreightMinor) {
    throw new EngineError(`${booking.id}: 환급(${refund})+취소비(${fee})가 선급운임(${booking.prepaidFreightMinor})과 다릅니다.`);
  }
  const currency = routeOf(config, booking.routeId).currency;
  const lines: LedgerLine[] = [{ account: 'PREPAID_FREIGHT', amount: -booking.prepaidFreightMinor }];
  if (refund > 0) lines.push({ account: 'CASH', amount: refund });
  if (fee > 0) lines.push({ account: 'CANCELLATION_EXPENSE', amount: fee });
  postOrThrow(s, {
    id: `FREIGHT-RELEASE-${booking.id}`,
    currency,
    contractId: booking.contractId,
    reason: `${why}: 운임 ${formatMoney(currency, refund)} 환급, 취소비 ${formatMoney(currency, fee)}`,
    lines,
  });
  booking.status = 'CANCELLED';
}

function cancelContract(s: GameState, config: ScenarioConfig, contractId: string): string | null {
  const contract = s.contracts.find((c) => c.id === contractId);
  if (!contract) return '계약을 찾을 수 없습니다.';
  if (contract.status !== 'ACTIVE' && contract.status !== 'IN_PROGRESS') return '취소할 수 있는 상태가 아닙니다.';
  const booking = contract.bookingId ? s.bookings.find((b) => b.id === contract.bookingId) : undefined;
  if (booking?.status === 'DEPARTED') return '이미 출항한 화물은 취소할 수 없습니다. 인도 후 정산만 가능합니다 (출항 후 취소는 M3).';

  if (booking && booking.status === 'BOOKED') releaseBooking(s, config, booking, `${contract.id} 출항 전 취소`);
  const compensation = config.terms.customerCancellationCompensationMinor;
  if (compensation > 0) {
    payOrAccrue(s, contract.currency, compensation, `CANCEL-COMP-${contract.id}`, '고객 취소 보상', contract.id, 'CANCELLATION_EXPENSE');
  }
  const task = s.tasks.find((t) => t.id === contract.prepTaskId);
  if (task && (task.status === 'QUEUED' || task.status === 'RUNNING')) task.status = 'ABORTED';
  const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
  const good = goodOf(config, contract.goodId);
  if (lot && lot.owner === 'CUSTOMER') {
    // 고객 화물은 화주에게 돌려준다. 회사 장부에는 원래 없었으므로 재고가 생기지 않는다.
    lot.status = 'RETURNED_TO_OWNER';
  } else if (lot) {
    // 공급자 반품 없음: 회사 소유 재고로 출발항에 남는다.
    lot.status = 'HELD_UNALLOCATED';
    lot.contractId = null;
  }
  contract.status = 'CANCELLED';
  contract.cancelledDay = s.day;
  log(s, contract.kind === 'FORWARDING'
    ? `${contract.id} 출항 전 취소. 고객 화물 ${good.nameKo} ${contract.quantity}${unitKo(good)}은(는) 화주에게 돌려줌`
    : `${contract.id} 출항 전 취소. 상품 ${contract.quantity}${unitKo(good)}은(는) 반품 없이 회사 재고로 ${cityName(config, contract.originCityId)}에 남음`);
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
  // 3. 직원 업무 진행 (LEGACY_FIXED 처리량)
  progressTasks(s, config);
  // 4. 출항·이동·도착·통관
  processDepartures(s, config);
  processArrivals(s, config);
  // 5. 인도·납기 판정
  processDeliveries(s, config);
  // 6. 수금 → 밀린 지급 → 급여
  processCollections(s);
  settleObligations(s);
  processPayroll(s, config);
  // 7. 다음 날 견적 갱신 (M2a: 유효기간 만료만)
  for (const st of s.offers) {
    const def = offerOf(config, st.id);
    if (def && st.status === 'OPEN' && def.validUntilDay < day + 1) {
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
    if (task.status !== 'RUNNING' || !task.assignedEmployeeId || !isAvailableFromToday(s, task.assignedEmployeeId)) continue;
    const def = config.employees.find((e) => e.id === task.assignedEmployeeId);
    if (!def) continue;
    task.progressWorkUnits = Math.min(task.requiredWorkUnits, task.progressWorkUnits + (task.kind === 'TRAINING' ? 1 : def.workUnitsPerDay));
    if (task.progressWorkUnits >= task.requiredWorkUnits) {
      task.status = 'DONE';
      task.completedDay = s.day;
      if (task.kind === 'TRAINING') {
        log(s, `${def.nameKo}: 일반 훈련 완료`);
      } else if (task.kind === 'SCOUT') {
        const site = config.recruitment!.scoutSites.find((x) => x.venueId === task.subjectId)!;
        for (const c of s.recruitment.candidates) {
          if (c.stage !== 'UNDISCOVERED' || !site.candidateEmployeeIds.includes(c.employeeId)) continue;
          c.stage = 'DISCOVERED';
          c.discoveredDay = s.day;
          log(s, `${config.employees.find((e) => e.id === c.employeeId)!.nameKo} 발견: 영입 의뢰 가능`);
        }
        s.recruitment.scoutedVenueIds.push(site.venueId);
        log(s, `${def.nameKo}: ${taskSubjectKo(config, task)} 현장 조사 완료`);
      } else if (task.kind === 'RECRUIT_QUEST') {
        const c = s.recruitment.candidates.find((x) => x.employeeId === task.subjectId)!;
        c.stage = 'INTERVIEW_READY';
        c.interviewReadyDay = s.day;
        log(s, `${def.nameKo}: ${config.employees.find((e) => e.id === c.employeeId)!.nameKo} 영입 의뢰 완료 → 면담 가능`);
      } else {
        const lot = s.cargoLots.find((l) => task.contractId !== null && l.contractId === task.contractId);
        if (lot && lot.status === 'PREPARING') lot.status = 'AWAITING_DEPARTURE';
        log(s, `${def.nameKo}: ${task.contractId} ${taskLabel(task.kind)} 완료 → 출발 대기`);
      }
      awardTaskCompletion(s, config, task);
    }
  }
}

function processDepartures(s: GameState, config: ScenarioConfig) {
  for (const booking of s.bookings) {
    if (booking.status !== 'BOOKED' || booking.departureDay !== s.day) continue;
    const contract = contractOf(s, booking.contractId);
    const route = routeOf(config, booking.routeId);
    const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
    if (!lot || lot.status !== 'AWAITING_DEPARTURE' || lot.locationCityId !== route.fromCityId) {
      releaseBooking(s, config, booking, `${contract.id} 준비 미완료로 출항 불참`);
      contract.bookingId = null;
      log(s, `${contract.id}: 준비가 끝나지 않아 ${booking.sailingId}에 싣지 못함. 다음 출항편을 다시 예약해야 합니다.`);
      continue;
    }
    const shipment: Shipment = {
      id: `SH${pad(s.shipments.length + 1)}`,
      bookingId: booking.id,
      contractId: contract.id,
      cargoLotId: lot.id,
      departureDay: s.day,
      scheduledArrivalDay: s.day + route.transitDays,
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
    if (contract.kind === 'FORWARDING') {
      // 고객 화물의 운임은 회사 재고 원가가 아니다. 서비스를 마칠(인도) 때까지 진행원가로 둔다.
      postOrThrow(s, {
        id: `FREIGHT-WIP-${booking.id}`,
        currency: route.currency,
        contractId: contract.id,
        reason: `${booking.sailingId} 출항: 고객 화물 운임을 주선 진행원가로 (선급운임 → 주선 진행원가)`,
        lines: [
          { account: 'FORWARDING_WIP', amount: booking.prepaidFreightMinor },
          { account: 'PREPAID_FREIGHT', amount: -booking.prepaidFreightMinor },
        ],
      });
    } else {
      lot.carryingAmountMinor += booking.prepaidFreightMinor;
      postOrThrow(s, {
        id: `FREIGHT-CAPITALIZE-${booking.id}`,
        currency: route.currency,
        contractId: contract.id,
        reason: `${booking.sailingId} 출항: 선급운임을 상품 원가에 포함 (선급운임 → 재고)`,
        lines: [
          { account: 'INVENTORY', amount: booking.prepaidFreightMinor },
          { account: 'PREPAID_FREIGHT', amount: -booking.prepaidFreightMinor },
        ],
      });
    }
    log(s, `${shipment.id} 출항: ${cityName(config, route.fromCityId)} → ${cityName(config, route.toCityId)}, 도착 예정 ${shipment.scheduledArrivalDay}일 (${contract.id})`);
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
    const waited = sh.observedWaitDays > 0 ? ` (대기 ${sh.observedWaitDays}일)` : '';
    if (contract.kind === 'FORWARDING') {
      // 고객 화물의 관세는 수입자(고객)가 부담한다는 시나리오 가정. 회사 장부에 관세가 생기지 않는다.
      sh.dutyMinor = 0;
      sh.dutyPaid = true;
      log(s, `${sh.id} 도착: ${cityName(config, contract.destinationCityId)}${waited}. 고객 화물이므로 관세는 수입자 부담`);
      continue;
    }
    // 통관: 가상 과세 규칙 — 공급자 상품 송장 금액만 과세가격으로 본다.
    const duty = dutyEstimate(config, contract.purchaseAmountMinor);
    sh.dutyMinor = duty;
    if (duty === 0) {
      sh.dutyPaid = true;
    } else {
      const paid = payOrAccrue(s, contract.currency, duty, `DUTY-${sh.id}`, `${sh.id} 수입 관세 (가상 세율)`, contract.id, 'INVENTORY');
      sh.dutyPaid = paid;
      lot.carryingAmountMinor += duty;
    }
    log(s, `${sh.id} 도착: ${cityName(config, contract.destinationCityId)}${waited}. 관세 ${formatMoney(contract.currency, duty)}${sh.dutyPaid ? ' 지급' : ' 미지급 — 납부 전 반출 불가'}`);
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
    const forwarding = contract.kind === 'FORWARDING';
    const what = forwarding ? '서비스' : '판매';

    postOrThrow(s, {
      id: `SALE-${contract.id}`,
      currency: contract.currency,
      contractId: contract.id,
      reason: `${forwarding ? '고객 화물 인도 완료' : '인도 완료'}${reduction > 0 ? `(납기 ${lateDays}일 경과). 계약 조건에 따른 ${what}대금 감액 ${formatMoney(contract.currency, reduction)} 후` : '.'} 외상 ${forwarding ? '주선 매출 (주선 매출 → 매출채권)' : '매출 (매출 → 매출채권)'}`,
      lines: [
        { account: 'ACCOUNTS_RECEIVABLE', amount: netSale },
        { account: forwarding ? 'FORWARDING_REVENUE' : 'REVENUE', amount: -netSale },
      ],
    });
    if (forwarding) {
      const booking = s.bookings.find((b) => b.id === sh.bookingId)!;
      postOrThrow(s, {
        id: `FWD-COST-${contract.id}`,
        currency: contract.currency,
        contractId: contract.id,
        reason: '서비스를 마친 운송 주선의 운임을 주선 원가로 (주선 진행원가 → 주선 원가)',
        lines: [
          { account: 'FORWARDING_COST', amount: booking.prepaidFreightMinor },
          { account: 'FORWARDING_WIP', amount: -booking.prepaidFreightMinor },
        ],
      });
    } else {
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
    }
    lot.status = 'DELIVERED';
    const invoiceId = `INV-${contract.id}`;
    const dueDay = Math.max(contract.paymentDueDay, s.day);
    s.invoices.push({
      id: invoiceId,
      contractId: contract.id,
      currency: contract.currency,
      amountMinor: netSale,
      issuedDay: s.day,
      dueDay,
      status: 'OUTSTANDING',
      receiptIds: [],
    });
    contract.invoiceId = invoiceId;
    log(s, `${contract.id} ${forwarding ? '고객 화물 ' : ''}인도 완료${lateDays > 0 ? ` (납기 ${lateDays}일 경과, 감액 ${formatMoney(contract.currency, reduction)})` : ' (납기 내)'}. ${forwarding ? '주선 매출' : '매출'} ${formatMoney(contract.currency, netSale)}은 채권으로 남고 현금은 ${dueDay}일 수금 예정`);
  }
}

function processCollections(s: GameState) {
  for (const inv of s.invoices) {
    if (inv.status === 'PAID' || inv.dueDay > s.day) continue;
    // 고객은 결제일에 전액 지급한다. 연체·대손은 이후 단계.
    applyReceipt(s, `RCPT-${inv.id}`, inv.id);
  }
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
    if (!isAvailableFromToday(s, emp.id)) continue;
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
