// 최소 화면: 견적판·계약(UI_TRADE), 자원 예약, 세계지도(UI_WORLD), 경영 보고(UI_REPORT), 동료 카드.
// 화면은 엔진 상태를 읽고 명령을 대기열에 넣을 뿐, 현금·재고·예약을 따로 들고 있지 않다.

import './style.css';
import { applyPixelScale } from './pixel';
import { esc } from './html';
import { CULTURE_KO, cultureAnchorBlocks, culturePanel, cultureResultTasks, cultureTab, cultureToastText } from './culture';
import { employedDefs } from '../engine/employees';
import { SCENARIO_IDS, assumptionNotes, loadScenario, type ScenarioId } from '../content/scenario';
import { cargoSpace, goodOf, offerOf, routeBetween, unitKo } from '../engine/catalog';
import { cityName, createGame, listSailings, openDay, planCommands, planState } from '../engine/engine';
import { formatMoney } from '../engine/money';
import { companyReport, contractReport, forwardingPreview, tradePairs, tradePreview, type QuotePreview } from '../engine/reports';
import { cashReservations, fmtKg, fmtM3, fundsPosition, runningTaskOf, sailingLoad } from '../engine/reservations';
import { serializeSave } from '../engine/save';
import { contractProgress, portWaitStatus } from '../engine/progress';
import type { Command, CommandResult, CommitPlan, Contract, EmployeeDef, GameState, ScenarioConfig } from '../engine/types';
import { taskName } from './card';
import { batchUnlocked, crewEntryCard, crewRow, crewEntries, recruitmentPanel, taskSchedule, venueTitle } from './recruitment';
import { initialUiState, loadSaveText, advanceDay } from './session';
import { cancellationPreviewKo } from './trade';
import { krwReportRows, krwReportNoteKo } from './reports';
import { crewNoteKo, crewStatusKo } from './crew-status';
import { taskSubjectKo } from '../engine/tasks';
import { employeeDetail, growthMessages, growthStatus } from './growth';
import { FOCUS_FALLBACK_SELECTORS, focusFallbackIds } from './focus';
import { MAP_ATTRIBUTION, mapLegend, renderWorldMap, MapMeasurementMemory, mapPresentation, readMapScroll, mapScrollPosition, mapRedrawDecision, type MapMode } from './map';

const SAVE_KEY = 'scitrade-save';
/** M1 시제품이 쓰던 저장 칸. 불러오기만 하며, 저장 형식 판본 1은 엔진이 명시적으로 이관한다. */
const LEGACY_SAVE_KEY = 'scitrade-m1-save';
const SCENARIO_TITLES = Object.fromEntries(SCENARIO_IDS.map((id) => [id, loadScenario(id).titleKo])) as Record<ScenarioId, string>;

let config: ScenarioConfig;
let state: GameState;
/** 대기 명령을 반영한 ‘오늘 실행 예정’ 사본. 거래·예약 화면 표시에만 쓰고 보고·현금은 확정 상태(state)를 쓴다. */
let view: GameState;
let ui = initialUiState();
let mapMode: MapMode = 'route';
const mapMeasurements = new MapMeasurementMemory();
const MAP_BASE_OUTSIDE_SVG = false;
let mapScrollRatio: number | undefined;
let resetMapScroll = true;
let commandSeq = 0;
let ignoreClicksUntil = 0;
let activation: { element: HTMLElement; pointer: boolean } | null = null;
let statusbarObserver: ResizeObserver | undefined;
const actionSizes = new Map<string, { height: number; width: number }>();
/** 누른 버튼이 칸 안에서 있던 높이. 예정 표시를 그 자리에 둔다. */
const actionOffsets = new Map<string, number>();

/** 다시 그려도 배정·예약 자리가 줄어들어 다음 버튼이 움직이지 않게 한다. */
function queuedStatus(slot: string, text: string): string {
  const offset = actionOffsets.get(slot);
  return `<div class="sailings queued-slot" style="min-height:${actionSizes.get(slot)?.height ?? 0}px;width:${actionSizes.get(slot)?.width ?? 0}px;max-width:100%${offset === undefined ? '' : `;justify-content:flex-start;padding-top:${Math.round(offset)}px`}"><span class="pill" id="status-${esc(slot)}" tabindex="-1">${text}</span></div>`;
}

function measureStatusbar() {
  statusbarObserver?.disconnect();
  const bar = app.querySelector<HTMLElement>('.statusbar')!;
  const update = () => document.documentElement.style.setProperty('--topbar-h', `${bar.getBoundingClientRect().height}px`);
  update();
  statusbarObserver = new ResizeObserver(update);
  statusbarObserver.observe(bar);
}

function focusWithoutScroll(target: HTMLElement | undefined | null) {
  if (!target) return;
  const bar = app.querySelector<HTMLElement>('.statusbar')!;
  const rect = target.getBoundingClientRect();
  const center = (rect.top + rect.bottom) / 2;
  // 화면 밖 제목 대신 항상 보이는 하루 진행으로 옮긴다. 화면 위치는 유지한다.
  const bandBottom = Math.min(window.innerHeight, app.querySelector<HTMLElement>('.flash-toast')?.getBoundingClientRect().top ?? Infinity);
  if (!target.closest('.statusbar') && (center < bar.getBoundingClientRect().bottom || center > bandBottom)) {
    const nextDay = app.querySelector<HTMLButtonElement>('[data-action="end-day"]')!;
    target = nextDay.disabled ? document.getElementById('status-h')! : nextDay;
  }
  target.focus({ preventScroll: true });
}

const app = document.querySelector<HTMLDivElement>('#app')!;

function startScenario(id: ScenarioId) {
  config = loadScenario(id);
  state = openDay(createGame(config), config).state;
  resetUi();
}

function resetUi() {
  ui = initialUiState();
  resetMapScroll = true;
  mapScrollRatio = undefined;
  mapMeasurements.clear();
  actionSizes.clear();
  actionOffsets.clear();
}

function newId(type: string): string {
  commandSeq += 1;
  return `UI-${state.day}-${type}-${Date.now().toString(36)}-${commandSeq}`;
}

const usd = (minor: number) => formatMoney(config.tradeCurrency, minor);
const krw = (minor: number) => formatMoney(config.payrollCurrency, minor);
const committedRule = () => config.rules.fundsCheck === 'COMMITTED_OUTLAYS';

const PARTY_KO: Record<string, string> = {
  SUPPLIER_DEMO: '의류 공급자',
  CUSTOMER_DEMO: '요코하마 의류 고객',
  SUPPLIER_DEMO_COSMETICS: '화장품 공급자',
  CUSTOMER_DEMO_SHANGHAI: '상하이 화장품 고객',
  SHIPPER_DEMO_FURNITURE: '가구 화주',
  SHIPPER_DEMO_SOLAR: '태양광 모듈 화주',
};
const partyKo = (id: string | null) => (id ? (PARTY_KO[id] ?? id) : '-');
const qtyKo = (goodId: string, quantity: number) => {
  const g = goodOf(config, goodId);
  return `${g.nameKo} ${quantity.toLocaleString('ko-KR')}${unitKo(g)}`;
};
const employeeName = (id: string | null) => config.employees.find((e) => e.id === id)?.nameKo ?? '미배정';

/** 대기열 뒤에 후보 명령을 붙였을 때의 검증 결과. 상태는 바꾸지 않는다. */
function tryCommand(cmd: Command): CommandResult {
  return planCommands(state, config, [...ui.pending, cmd]).at(-1)!;
}

function queue(cmd: Command) {
  const previousContracts = new Set(view.contracts.map((c) => c.id));
  for (const slot of app.querySelectorAll<HTMLElement>('[data-action-slot]')) {
    const rect = slot.getBoundingClientRect();
    actionSizes.set(slot.dataset.actionSlot!, { height: rect.height, width: rect.width });
  }
  const slotEl = activation?.element.closest<HTMLElement>('[data-action-slot]');
  const anchor = slotEl ? { slot: slotEl.dataset.actionSlot!, top: slotEl.getBoundingClientRect().top } : null;
  if (anchor && activation) actionOffsets.set(anchor.slot, Math.max(0, activation.element.getBoundingClientRect().top - anchor.top));
  const result = tryCommand(cmd);
  if (result.status !== 'APPLIED') {
    ui.flash = { kind: 'warn', text: result.reasonKo };
  } else {
    ui.pending.push(cmd);
    ui.flash = { kind: 'info', text: '오늘 할 일에 넣었습니다. ‘하루 진행’을 누르면 실행됩니다. 그 전에는 시간이 흐르지 않습니다.' };
  }
  const accepted = result.status === 'APPLIED' && (cmd.type === 'ACCEPT_TRADE' || cmd.type === 'ACCEPT_FORWARDING');
  render(accepted, accepted ? null : anchor);
  if (accepted) {
    const contract = view.contracts.find((c) => !previousContracts.has(c.id));
    const heading = contract && document.getElementById(`contract-h-${contract.id}`);
    heading?.scrollIntoView({ block: 'start' });
    heading?.focus({ preventScroll: true });
  }
  ignoreClicksUntil = Date.now() + 500;
}

function endDay() {
  if (state.phase !== 'AWAITING_INPUT') return;
  const committed = advanceDay(state, config, ui.pending);
  if ('errorKo' in committed) {
    ui.flash = { kind: 'warn', text: committed.errorKo! };
    render();
    ignoreClicksUntil = Date.now() + 500;
    return;
  }
  const rejected = committed.results.filter((r) => r.status === 'REJECTED');
  const barBottom = app.querySelector<HTMLElement>('.statusbar')?.getBoundingClientRect().bottom ?? 0;
  const bandBottom = Math.min(window.innerHeight, app.querySelector<HTMLElement>('.flash-toast')?.getBoundingClientRect().top ?? Infinity);
  // 계약은 3판 기준 그대로다: 막대 아래에 걸친 첫 카드의 제목은 막대 위에 있어도 기준이 된다.
  const card = Array.from(app.querySelectorAll<HTMLElement>('.contract')).find((e) => { const r = e.getBoundingClientRect(); return r.bottom > barBottom && r.top < window.innerHeight; });
  const heads: HTMLElement[] = [];
  const cardHead = card?.querySelector<HTMLElement>('h3[id]');
  if (cardHead) heads.push(cardHead);
  if (ui.cultureOpen) {
    const inBand = (r: DOMRect | undefined) => r !== undefined && r.bottom > barBottom && r.top < bandBottom;
    // 계약 카드가 없으면 견적판을 읽는 중이다. 위 패널 높이가 바뀌어도 거래 칸을 제자리에 둔다.
    const tradeHead = document.getElementById('trade-h');
    if (!cardHead && tradeHead && inBand(app.querySelector<HTMLElement>('.trade')?.getBoundingClientRect())) heads.push(tradeHead);
    // 결과 카드·직원 줄·기록장 보고서는 블록이 띠에 걸치면 기준이 된다. 네 칸을 읽는 중에 위에 새 결과가 생겨도 자리를 지킨다.
    for (const [blockId, headId] of cultureAnchorBlocks(state, config, ui)) {
      const head = document.getElementById(headId);
      if (head && inBand(document.getElementById(blockId)?.getBoundingClientRect())) heads.push(head);
    }
    for (const id of ['culture-h', 'culture-book-h']) {
      const head = document.getElementById(id);
      const top = head?.getBoundingClientRect().top;
      if (head && top !== undefined && top >= barBottom && top < bandBottom) heads.push(head);
    }
  }
  const reading = heads.map((head) => ({ id: head.id, top: head.getBoundingClientRect().top })).sort((a, b) => a.top - b.top);
  ui.growthNotices = growthMessages(state, committed.state, config);
  ui.growthNoticesDay = state.day;
  ui.growthNoticesFresh = true;
  state = committed.state;
  ui.pending = [];
  ui.cultureEmployeeId = null;
  ui.flash = cultureToastText(state, config, rejected) ?? (rejected.length
    ? { kind: 'warn', text: `실행하지 못한 명령: ${rejected.map((r) => r.reasonKo).join(' / ')}` }
    : null);
  ui.cultureResultFresh = ui.flash?.action === 'culture-result';
  render();
  const remaining = reading.map((head) => ({ ...head, element: document.getElementById(head.id) })).find((head) => head.element);
  if (remaining) { const dy = remaining.element!.getBoundingClientRect().top - remaining.top; if (Math.abs(dy) >= 1) window.scrollBy(0, dy); }
  ignoreClicksUntil = Date.now() + 500;
}

// ── 화면 조각 ──

function stageOf(c: Contract): number {
  const lot = view.cargoLots.find((l) => l.id === c.cargoLotId);
  if (c.status === 'COMPLETED') return 8;
  if (c.deliveredDay !== null) return 7;
  switch (lot?.status) {
    case 'ARRIVED_RELEASING':
      return 6;
    case 'IN_TRANSIT':
      return 5;
    case 'AWAITING_DEPARTURE':
      return 4;
    default:
      return c.ownerEmployeeId ? 3 : 2;
  }
}

const STAGES = {
  DIRECT_TRADE: ['견적', '체결·매입', '준비 배정', '수출 준비', '출발 대기', '운송', '도착·통관', '인도·채권', '수금·종결'],
  FORWARDING: ['의뢰', '체결·화물 인수', '준비 배정', '선적 서류', '출발 대기', '운송', '도착·반출', '인도·채권', '수금·종결'],
};

function pipeline(c: Contract): string {
  if (c.status === 'CANCELLED') {
    return c.kind === 'FORWARDING'
      ? `<p class="pill warn">계약 취소됨 (${c.cancelledDay}일) — 고객 화물은 화주에게 돌려줌</p>`
      : `<p class="pill warn">계약 취소됨 (${c.cancelledDay}일) — 상품은 회사 재고로 ${esc(cityName(config, c.originCityId))}에 남음</p>`;
  }
  const current = stageOf(c);
  return `<ol class="pipeline">${STAGES[c.kind].map(
    (label, i) => `<li class="${i < current ? 'done' : i === current ? 'now' : ''}" ${i === current ? 'aria-current="step"' : ''}>${label}</li>`,
  ).join('')}</ol>`;
}

function topbar(): string {
  const r = companyReport(state, config);
  const f = fundsPosition(state, config, config.tradeCurrency);
  const nextReceipt = [...state.invoices].filter((i) => i.status !== 'PAID').sort((a, b) => a.dueDay - b.dueDay)[0];
  const phaseText =
    state.phase === 'AWAITING_INPUT' ? '의사결정 중 · 시간 정지' : state.phase === 'ENDED' ? '캠페인 종료' : '다음 날 준비';
  return `
  <header class="topbar">
  <div class="masthead">
    <div class="brand"><span class="logo">Scitrade</span><span class="sub">${esc(config.stage)} 시제품 · 규칙 ${esc(config.rules.rulesVersion)} · DESIGN 가상값</span></div>
    <label class="scenario">시나리오
      <select data-action="scenario">
        ${SCENARIO_IDS.map((id) => `<option value="${id}" ${id === config.id ? 'selected' : ''}>${esc(SCENARIO_TITLES[id])}</option>`).join('')}
      </select>
    </label>
    <div class="actions">
      <button data-action="save">저장</button>
      <button data-action="load">불러오기</button>
      <button data-action="export">내보내기</button>
      <label class="file-btn">가져오기<input type="file" accept="application/json" data-action="import" hidden /></label>
      <button data-action="restart">처음부터</button>
    </div>
  </div>
  <div class="statusbar" id="status-h" tabindex="-1" aria-label="오늘 상태">
    <div class="day"><div class="date"><b>${Math.min(state.day, config.campaignDays)}일</b> / ${config.campaignDays}</div><span>${phaseText}</span></div>
    <div class="stat"><span>거래 현금 (USD)</span><b>${usd(r.trade.cash)}</b></div>
    ${committedRule() ? `<div class="stat"><span>사용 가능 (예약 제외)</span><b class="${f.available < 0 ? 'neg' : ''}">${usd(f.available)}</b></div>` : ''}
    <div class="stat"><span>운영 현금 (KRW)</span><b>${krw(r.payroll.cash)}</b></div>
    <div class="stat"><span>다음 수금</span><b>${nextReceipt ? `${nextReceipt.dueDay}일 ${usd(nextReceipt.amountMinor)}` : '없음'}</b></div>
    <div class="day-action"><small class="amount-basis">금액은 확정 기준</small><button class="primary" data-action="end-day" ${state.phase !== 'AWAITING_INPUT' ? 'disabled' : ''}>하루 진행 ▶</button></div>
  </div>
  </header>`;
}

function worldMap(): string {
  const moving = view.shipments.filter((x) => x.arrivalDay === null);
  const waiting = moving.filter((x) => portWaitStatus(view, config, x) === 'WAITING_RESTRICTION');
  const status = moving.length
    ? `운항 중 화물 ${moving.length}건${waiting.length ? ` · 대기 ${waiting.length}건 (하역 재개를 기다림)` : ''}`
    : '운항 중인 화물 없음';
  const routeText = config.routes
    .map((r) => `${r.id} ${cityName(config, r.fromCityId)}→${cityName(config, r.toCityId)} ${r.transitDays}일·${r.departureIntervalDays}일마다·운임 ${usd(r.bookingFeeMinor)}`)
    .join(' / ');
  return `
  <section class="panel world" aria-labelledby="world-h">
    <div class="world-head">
      <h2 id="world-h">세계지도 <small>${status}</small></h2>
      <div class="seg" role="group" aria-label="지도 범위">
        <button data-action="map-mode" data-mode="route" aria-pressed="${mapMode === 'route'}">이번 항로</button>
        <button data-action="map-mode" data-mode="world" aria-pressed="${mapMode === 'world'}">전 세계</button>
      </div>
    </div>
    <div data-map-frame ${mapPresentation(config, mapMode).attributes} class="map-frame ${mapPresentation(config, mapMode).world ? 'is-world' : ''}">${renderWorldMap(view, config, mapMode, { ...mapMeasurements.get(mapMode), baseOutsideSvg: MAP_BASE_OUTSIDE_SVG })}</div>
    ${mapPresentation(config, mapMode).hint}
    ${mapLegend()}
    <p class="muted small">${esc(routeText)}. 항로선은 표시용이며 실제 항로 자료가 아닙니다. 세계 거점은 물동량·금융센터·해운 도시 순위로 골랐고, 2장(세계 확장)에서 열립니다. 거점에 마우스를 올리면 선정 근거가 보입니다. ${MAP_ATTRIBUTION}.</p>
  </section>`;
}

function reporter(role: string): EmployeeDef | undefined {
  return employedDefs(view, config).find((e) => e.role === role) ?? employedDefs(view, config)[0];
}

function quoteBlock(q: QuotePreview, rows: string, cmd: Command, extra: string[], validUntil: number, key: string, originCityId: string): string {
  const check = tryCommand(cmd);
  const sailing = q.departureDay !== null
    ? `다음 출항 ${q.departureDay}일 → ${q.arrivalDay}일 도착 예정 (납기 ${q.deliveryDeadlineDay}일)${q.lateOnNextSailing ? ' ⚠ 납기 초과 — 감액 반영' : ''}`
    : '남은 출항편 없음';
  // 견적의 대금일은 계약 조건이다. 인도가 늦으면 실제로 받는 날도 늦어진다.
  const receipt = q.departureDay !== null
    ? `<li>대금은 ${q.receiptDay}일에 받을 예정${q.receiptDay > q.paymentDueDay ? ` (인도가 계약상 대금일 ${q.paymentDueDay}일보다 늦기 때문)` : ''}</li>`
    : '';
  const need = committedRule()
    ? `수락하려면 사용 가능 자금 ${usd(q.cashNeed)}가 필요합니다 (매입·운임·관세를 미리 묶음).`
    : `수락하면 매입 대금 ${usd(q.purchase)}를 지금 현금으로 냅니다.`;
  const actionAttr = cmd.type === 'ACCEPT_TRADE'
    ? `data-action="accept" data-buy="${esc(cmd.buyOfferId)}" data-sell="${esc(cmd.sellOfferId)}"`
    : cmd.type === 'ACCEPT_FORWARDING' ? `data-action="accept-fwd" data-offer="${esc(cmd.offerId)}"` : '';
  return `
    <table class="money">${rows}<tr class="total"><th>예상 기여이익 (급여 전)</th><td>${usd(q.contributionBeforePayroll)}</td></tr></table>
    <ul class="quote-facts"><li>${sailing}</li>${receipt}<li>${need}</li>${extra.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <details><summary>현금 일정 미리 보기 — 이익과 현금은 다른 날 움직입니다</summary>
      <ul class="schedule">${q.schedule.map((x) => `<li><span>${x.day}일</span>${esc(x.labelKo)}<b>${x.amount === 0 ? '현금 변화 없음' : (x.amount > 0 ? '+' : '−') + usd(Math.abs(x.amount))}</b></li>`).join('')}</ul>
      <p class="muted">지연·취소가 없다는 가정의 계산이며 결과를 보장하지 않습니다.</p>
    </details>
    <p class="muted small">견적 유효: ${validUntil}일까지 · 모든 수치는 개발용 가상값(DESIGN)</p>
    <div class="accept-row">
      <button ${actionAttr} ${check.status !== 'APPLIED' ? 'disabled' : ''}>견적만 수락</button>${check.status !== 'APPLIED' ? `<p class="reason">${esc(check.reasonKo)}</p>` : ''}
    </div>
    ${check.status === 'APPLIED' ? planner(cmd, q, key, originCityId) : ''}`;
}

/** 직원이 지금(대기 명령 반영) 다른 업무 중인지. 카드·운영표·계획 선택이 같은 판단을 쓴다 (REF-01). */
const busyTask = (employeeId: string) => runningTaskOf(view, employeeId);

/** REF-02 한 번에 확정: 준비 담당과 운송편을 함께 골라 하나의 명령으로 넣는다. 하나라도 안 되면 수락까지 철회된다. */
function planner(cmd: Command, q: QuotePreview, key: string, originCityId: string): string {
  if (!batchUnlocked(view)) return '<p class="muted small">첫 계약을 단계별로 마치면 한 번에 확정을 쓸 수 있습니다</p>';
  if (cmd.type !== 'ACCEPT_TRADE' && cmd.type !== 'ACCEPT_FORWARDING') return '';
  const sailings = listSailings(config, q.routeId, view.day + 1).slice(0, 3);
  const local = employedDefs(view, config).filter((e) => view.employees.find((x) => x.id === e.id)?.locationCityId === originCityId);
  const defaults: CommitPlan = {
    employeeId: local.find((e) => !busyTask(e.id))?.id,
    sailingId: (sailings.find((s) => s.scheduledArrivalDay + config.terms.customsDays <= q.deliveryDeadlineDay) ?? sailings[0])?.id,
  };
  const plan = ui.touchedPlans.has(key) ? (ui.plans[key] ?? defaults) : defaults;
  ui.plans[key] = plan;
  const planned: Command = { ...cmd, id: newId('PLAN'), plan };
  const check = tryCommand(planned);
  const empOptions = local
    .map((e) => {
      const t = busyTask(e.id);
      return `<option value="${esc(e.id)}" ${plan.employeeId === e.id ? 'selected' : ''} ${t ? 'disabled' : ''}>${esc(e.nameKo)} · 하루 ${e.workUnitsPerDay}pt${t ? ` (${esc(crewStatusKo(t))} · ${esc(taskSchedule(t, config))})` : ''}</option>`;
    })
    .join('');
  const sailOptions = sailings
    .map((s) => {
      const late = s.scheduledArrivalDay + config.terms.customsDays > q.deliveryDeadlineDay;
      return `<option value="${esc(s.id)}" ${plan.sailingId === s.id ? 'selected' : ''}>${s.departureDay}일 출항 → ${s.scheduledArrivalDay}일 도착${late ? ' (납기 초과)' : ''}</option>`;
    })
    .join('');
  return `
    <div class="planner" role="group" aria-label="한 번에 확정">
      <label>준비 담당 <select data-action="plan-emp" data-key="${esc(key)}"><option value="">나중에 배정</option>${empOptions}</select></label>
      <label>운송편 <select data-action="plan-sailing" data-key="${esc(key)}"><option value="">나중에 예약</option>${sailOptions}</select></label>
      <button class="primary" data-action="accept-plan" data-key="${esc(key)}" ${check.status !== 'APPLIED' ? 'disabled' : ''}>수락·배정·예약 한 번에</button>
      <p class="muted small">셋 중 하나라도 실행할 수 없으면 수락까지 모두 취소하고 아무것도 바꾸지 않습니다.</p>
      ${check.status !== 'APPLIED' ? `<p class="reason">${esc(check.reasonKo)}</p>` : ''}
    </div>`;
}

/** 화면의 견적 카드가 만든 기본 수락 명령 (키로 다시 찾는다). */
const offerCommands: Record<string, Command> = {};

function offerBoard(): string {
  const isOpen = (id: string) => view.offers.find((o) => o.id === id)?.status === 'OPEN';
  const cards: string[] = [];
  for (const pair of tradePairs(config)) {
    if (!isOpen(pair.buyOfferId) || !isOpen(pair.sellOfferId)) continue;
    const buy = offerOf(config, pair.buyOfferId)!;
    const sell = offerOf(config, pair.sellOfferId)!;
    const q = tradePreview(config, buy.id, sell.id, view.day)!;
    const by = reporter('sales');
    const g = goodOf(config, buy.goodId);
    const deadline = config.terms.deliveryDeadlineDay ?? sell.deliveryDeadlineDay;
    const due = config.terms.paymentDueDay ?? sell.paymentDueDay;
    const rows = `
      <tr><th>매입 (${buy.quantity}${esc(unitKo(g))} × ${usd(buy.unitPriceMinor)})</th><td>−${usd(q.purchase)}</td></tr>
      <tr><th>운임 (선지급)</th><td>−${usd(q.freight)}</td></tr>
      <tr><th>관세 (가상 세율 ${config.terms.dutyRateBasisPoints / 100}% · 상품 송장 기준)</th><td>−${usd(q.duty)}</td></tr>
      <tr><th>판매 (${sell.quantity}${esc(unitKo(g))} × ${usd(sell.unitPriceMinor)})${q.lateOnNextSailing ? ' − 지연 감액' : ''}</th><td>+${usd(q.sale)}</td></tr>`;
    const cmd: Command = { id: newId('ACCEPT'), type: 'ACCEPT_TRADE', buyOfferId: buy.id, sellOfferId: sell.id };
    offerCommands[`${buy.id}+${sell.id}`] = cmd;
    const space = cargoSpace(config, buy.goodId, buy.quantity);
    cards.push(`
    <article class="offer">
      <h3><span class="kind kind-trade">직접 무역</span> ${esc(qtyKo(buy.goodId, buy.quantity))} · ${esc(cityName(config, buy.cityId))} → ${esc(cityName(config, sell.cityId))}</h3>
      <p class="report-line">📋 <b>${esc(by?.nameKo ?? '직원')}의 보고</b> — “${esc(cityName(config, buy.cityId))} 공급자가 ${esc(g.nameKo)} ${buy.quantity}${esc(unitKo(g))}을(를) 내놨고, ${esc(cityName(config, sell.cityId))} 고객이 같은 수량을 원합니다. 납기 ${deadline}일, 계약상 대금일은 ${due}일입니다.”</p>
      ${quoteBlock(q, rows, cmd, [`화물 공간 ${fmtKg(space.massGrams)} · ${fmtM3(space.volumeLiters)}`], Math.min(buy.validUntilDay, sell.validUntilDay), `${buy.id}+${sell.id}`, buy.cityId)}
    </article>`);
  }
  for (const offer of config.offers.filter((o) => o.kind === 'forwarding')) {
    if (!isOpen(offer.id) || !offer.destinationCityId) continue;
    const q = forwardingPreview(config, offer.id, view.day)!;
    const by = reporter('operations');
    const space = cargoSpace(config, offer.goodId, offer.quantity);
    const route = routeBetween(config, offer.cityId, offer.destinationCityId);
    const rows = `
      <tr><th>서비스 대금 (건당)${q.lateOnNextSailing ? ' − 지연 감액' : ''}</th><td>+${usd(q.sale)}</td></tr>
      <tr><th>운임 (외부 운송사에 선지급)</th><td>−${usd(q.freight)}</td></tr>
      <tr><th>관세</th><td>수입자 부담 (회사 0)</td></tr>`;
    const cmd: Command = { id: newId('FWD'), type: 'ACCEPT_FORWARDING', offerId: offer.id };
    offerCommands[offer.id] = cmd;
    cards.push(`
    <article class="offer forwarding">
      <h3><span class="kind kind-fwd">운송 주선</span> 고객 화물 ${esc(qtyKo(offer.goodId, offer.quantity))} · ${esc(cityName(config, offer.cityId))} → ${esc(cityName(config, offer.destinationCityId))}</h3>
      <p class="report-line">📋 <b>${esc(by?.nameKo ?? '직원')}의 보고</b> — “${esc(partyKo(offer.counterpartyId))}가 ${esc(qtyKo(offer.goodId, offer.quantity))}을(를) ${esc(cityName(config, offer.destinationCityId))}까지 보내 달라고 합니다. 화물은 고객 것이고, 우리는 운송을 주선해 서비스 대금을 받습니다. 납기 ${offer.deliveryDeadlineDay}일, 계약상 대금일은 ${offer.paymentDueDay}일입니다.”</p>
      ${quoteBlock(q, rows, cmd, [
        `화물 공간 ${fmtKg(space.massGrams)} · ${fmtM3(space.volumeLiters)}${route ? ` (편당 한도 ${route.capacityKg.toLocaleString('ko-KR')}kg · ${route.capacityM3}m³)` : ''}`,
        offer.declaredCargoValueMinor ? `신고가액 ${usd(offer.declaredCargoValueMinor)}는 고객 자산입니다. 회사 재고·매출에 들어가지 않습니다.` : '',
      ].filter(Boolean), offer.validUntilDay, offer.id, offer.cityId)}
    </article>`);
  }
  if (!cards.length) return '';
  return `<div class="offer-board"><h3 class="board-title">견적판 <small>${cards.length}건 · 무엇을 맡을지 고르세요</small></h3>${cards.join('')}</div>`;
}

function contractPanel(c: Contract): string {
  const lot = view.cargoLots.find((l) => l.id === c.cargoLotId);
  const task = view.tasks.find((t) => t.id === c.prepTaskId);
  const booking = c.bookingId ? view.bookings.find((b) => b.id === c.bookingId) : undefined;
  const shipment = view.shipments.find((s) => s.contractId === c.id);
  const entries = view.ledger.entries.filter((e) => e.contractId === c.id);
  const actions: string[] = [];
  const active = c.status === 'ACTIVE' || c.status === 'IN_PROGRESS';
  const route = routeBetween(config, c.originCityId, c.destinationCityId);
  const forwarding = c.kind === 'FORWARDING';

  const queuedAssignment = task && ui.pending.some((p) => p.type === 'ASSIGN_TASK' && p.taskId === task.id);
  if (active && task && (task.status === 'QUEUED' || queuedAssignment)) {
    const queued = queuedAssignment;
    if (queued) {
      actions.push(queuedStatus(`assign-${task.id}`, '준비 업무 배정 예정'));
    } else {
      const buttons = employedDefs(view, config).map((emp) => {
        const check = tryCommand({ id: newId('ASSIGN'), type: 'ASSIGN_TASK', taskId: task.id, employeeId: emp.id });
        return `<button data-action="assign" data-task="${esc(task.id)}" data-emp="${esc(emp.id)}" ${check.status !== 'APPLIED' ? `disabled title="${esc(check.reasonKo)}"` : ''}>${esc(emp.nameKo)}에게<small>${check.status === 'APPLIED' ? `하루 ${emp.workUnitsPerDay}pt` : esc(busyTask(emp.id) ? `${crewStatusKo(busyTask(emp.id))} — ${taskSchedule(busyTask(emp.id)!, config)}` : check.reasonKo)}</small></button>`;
      });
      actions.push(`<div class="sailings" data-action-slot="assign-${esc(task.id)}"><span>${forwarding ? '운송 주선 준비(화물 인수·선적 서류)' : '수출 준비'} ${task.requiredWorkUnits}pt 맡기기</span><div class="row">${buttons.join('')}</div></div>`);
    }
  }
  const queuedBooking = ui.pending.some((p) => p.type === 'BOOK_SAILING' && p.contractId === c.id);
  if (active && route && (((!booking || booking.status === 'CANCELLED') && !shipment) || queuedBooking)) {
    const queued = queuedBooking;
    if (queued) {
      actions.push(queuedStatus(`book-${c.id}`, '운송편 예약 예정'));
    } else {
      const options = listSailings(config, route.id, view.day + 1).slice(0, 3).map((s) => {
        const load = sailingLoad(view, config, s);
        const need = cargoSpace(config, c.goodId, c.quantity);
        const cmd: Command = { id: newId('BOOK'), type: 'BOOK_SAILING', contractId: c.id, sailingId: s.id };
        const check = tryCommand(cmd);
        const late = s.scheduledArrivalDay + config.terms.customsDays > c.deliveryDeadlineDay;
        return `<button data-action="book" data-sailing="${esc(s.id)}" data-contract="${esc(c.id)}" ${check.status !== 'APPLIED' ? `disabled title="${esc(check.reasonKo)}"` : ''}>
          ${s.departureDay}일 출항 → ${s.scheduledArrivalDay}일 도착 예정${late ? ' ⚠ 납기 초과' : ''}<small>남은 ${fmtM3(load.capacityLiters - load.volumeLiters)} · ${fmtKg(load.capacityGrams - load.massGrams)} / 이 화물 ${fmtM3(need.volumeLiters)} · ${fmtKg(need.massGrams)}${check.status !== 'APPLIED' ? ` — ${esc(check.reasonKo)}` : ''}</small></button>${check.status !== 'APPLIED' ? `<p class="reason">${esc(check.reasonKo)}</p>` : ''}`;
      });
      actions.push(`<div class="sailings" data-action-slot="book-${esc(c.id)}"><span>운송편 예약 (${esc(route.id)}, 운임 ${usd(route.bookingFeeMinor)} 선지급)</span>${options.join('')}</div>`);
    }
  }
  if (active && booking?.status !== 'DEPARTED' && !shipment) {
    const queued = ui.pending.some((p) => p.type === 'CANCEL_CONTRACT' && p.contractId === c.id);
    if (!queued) {
      const t = config.terms;
      actions.push(`<button class="danger" data-action="cancel" data-contract="${esc(c.id)}">출항 전 취소</button>
        <p class="muted small">취소하면: ${esc(cancellationPreviewKo(view, config, c.id))}고객 보상 ${usd(t.customerCancellationCompensationMinor)}, ${forwarding ? '고객 화물은 화주에게 돌려줍니다.' : '공급자 반품 없음 → 산 상품은 재고로 남습니다.'}</p>`);
    } else actions.push('<span class="pill warn">출항 전 취소 예정</span>');
  }

  const cargo = !lot
    ? '-'
    : lot.owner === 'CUSTOMER'
      ? `${qtyKo(lot.goodId, lot.quantity)} · ${cityName(config, lot.locationCityId)} · 고객 화물(${partyKo(lot.ownerPartyId)}) — 회사 장부가액 없음`
      : `${qtyKo(lot.goodId, lot.quantity)} · ${cityName(config, lot.locationCityId)} · 장부가액 ${usd(lot.status === 'DELIVERED' ? 0 : lot.carryingAmountMinor)}`;
  const facts = [
    ['종류', forwarding ? `운송 주선 — ${partyKo(c.customerId)}의 화물` : `직접 무역 — ${partyKo(c.supplierId)} → ${partyKo(c.customerId)}`],
    ['담당', c.ownerEmployeeId ? employeeName(c.ownerEmployeeId) : '미배정'],
    ['화물', cargo],
    ['운송', shipment ? `${shipment.id} · ${shipment.departureDay}일 출항 · 도착 ${shipment.arrivalDay !== null ? `${shipment.arrivalDay}일` : `${shipment.scheduledArrivalDay}일 예정`}${shipment.observedWaitDays ? ` (항만 대기 ${shipment.observedWaitDays}일)` : ''}` : booking?.status === 'BOOKED' ? `${booking.sailingId} 예약됨` : '미예약'],
    ['납기', `${c.deliveryDeadlineDay}일 ${c.deliveredDay !== null ? (c.lateDays > 0 ? `→ ${c.deliveredDay}일 인도 (${c.lateDays}일 지연, 감액 ${usd(c.priceReductionMinor)})` : `→ ${c.deliveredDay}일 인도 (납기 내)`) : ''}`],
    [forwarding ? '서비스 대금' : '판매대금', c.status === 'CANCELLED' ? '청구 없음 (계약 취소)' : c.invoiceId ? (() => { const inv = view.invoices.find((i) => i.id === c.invoiceId)!; return `${usd(inv.amountMinor)} · ${inv.dueDay}일 결제 · ${inv.status === 'PAID' ? '수금 완료' : '미수'}`; })() : `${usd(c.saleAmountMinor)} (인도 후 청구)`],
  ];
  return `
  <div class="contract ${forwarding ? 'forwarding' : ''}">
    <h3 id="contract-h-${esc(c.id)}" tabindex="-1"><span class="kind ${forwarding ? 'kind-fwd' : 'kind-trade'}">${forwarding ? '운송 주선' : '직접 무역'}</span> ${esc(c.id)} · ${esc(qtyKo(c.goodId, c.quantity))} ${esc(cityName(config, c.originCityId))} → ${esc(cityName(config, c.destinationCityId))}${state.contracts.some((x) => x.id === c.id) ? '' : ' <span class="pill">오늘 실행 예정</span>'}</h3>
    ${pipeline(c)}
    ${progressBox(c)}
    <dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k ?? '')}</dt><dd>${esc(v ?? '')}</dd>`).join('')}</dl>
    <div class="actions-row">${actions.join('')}</div>
    <details><summary>이 계약의 돈 흐름 (${entries.length}건)</summary>
      <ul class="entries">${entries.map((e) => `<li><span>${e.day}일</span>${esc(e.reason)}<b>${e.lines.map((l) => `${esc(accountKo(l.account))} ${l.amount > 0 ? '+' : '−'}${usd(Math.abs(l.amount))}`).join(' · ')}</b></li>`).join('')}</ul>
    </details>
  </div>`;
}

const SEVERITY_KO = { info: '참고', warn: '조치 필요', risk: '위험' } as const;

/** REF-10: 다음 단계와 막힌 이유. 직원 처리량·운항표·사건과 같은 근거로 계산한다. */
function progressBox(c: Contract): string {
  const p = contractProgress(view, config, c);
  return `
    <div class="progress-box">
      <p><b>다음</b> ${esc(p.nextKo)}</p>
      ${p.blockers.length ? `<ul class="blockers">${p.blockers.map((b) => `<li class="sev-${b.severity}"><span class="sev-label">${SEVERITY_KO[b.severity]}</span>${esc(b.messageKo)}</li>`).join('')}</ul>` : '<p class="muted small">막힌 곳 없음</p>'}
    </div>`;
}

function closedContracts(): string {
  const closed = view.contracts.filter((c) => c.status === 'COMPLETED' || c.status === 'CANCELLED');
  if (!closed.length) return '';
  return `
  <details class="closed"><summary>종결된 계약 ${closed.length}건</summary>
    <ul class="entries">${closed.map((c) => {
      const r = contractReport(view, c);
      return `<li><span>${esc(c.id)}</span>${c.kind === 'FORWARDING' ? '운송 주선' : '직접 무역'} · ${esc(qtyKo(c.goodId, c.quantity))} ${esc(cityName(config, c.originCityId))} → ${esc(cityName(config, c.destinationCityId))} · ${c.status === 'CANCELLED' ? '취소' : `${c.completedDay}일 수금`}<b>기여이익 ${r.contribution < 0 ? '−' : ''}${usd(Math.abs(r.contribution))}</b></li>`;
    }).join('')}</ul>
  </details>`;
}

function accountKo(a: string): string {
  return ({
    CASH: '현금', INVENTORY: '재고', PREPAID_FREIGHT: '선급운임', FORWARDING_WIP: '주선 진행원가', ACCOUNTS_RECEIVABLE: '매출채권', ACCOUNTS_PAYABLE: '미지급금',
    REVENUE: '매출', COST_OF_GOODS_SOLD: '매출원가', FORWARDING_REVENUE: '주선 매출', FORWARDING_COST: '주선 원가',
    CANCELLATION_EXPENSE: '취소비', WAGE_EXPENSE: '급여', OPENING_EQUITY: '자본',
  } as Record<string, string>)[a] ?? a;
}

function delayPanel(): string {
  const open = state.delayDecisions.filter((d) => d.choice === null);
  const notices = state.notices;
  if (!notices.length) return '';
  return notices.map((n) => {
    const decision = open.find((d) => d.noticeId === n.id);
    const queued = decision && ui.pending.some((p) => p.type === 'RESPOND_TO_DELAY' && p.noticeId === n.id);
    return `
    <div class="notice">
      <h3>⚠ ${esc(n.titleKo)} <small>${n.day}일 공지</small></h3>
      <p>${esc(n.bodyKo)}</p>
      <p class="muted small">근거: ${esc(n.evidenceKo)}</p>
      ${decision ? (queued ? '<span class="pill">현재 예약으로 대기 — 결정 예정</span>' : `
      <div class="choices">
        <button data-action="keep" data-notice="${esc(n.id)}" data-shipment="${esc(decision.shipmentId)}">현재 예약으로 대기<small>예약은 유지, 하역 재개까지 일정이 밀림. 납기를 넘기면 계약 조건대로 ${usd(config.terms.lateDeliveryPriceReductionMinor)} 감액</small></button>
        <button disabled>대체편 예약<small>대체 노선 선택은 M3 사건 시스템에서 구현합니다</small></button>
        <button disabled>고객과 납기 협상<small>계약 변경 협상은 M3 사건 시스템에서 구현합니다</small></button>
      </div>`) : '<p class="pill">대응 결정 완료: 현재 예약으로 대기</p>'}
    </div>`;
  }).join('');
}

function tradePanel(): string {
  const active = view.contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS');
  const anyExpired = view.offers.some((o) => o.status === 'EXPIRED');
  return `
  <section class="panel trade" aria-labelledby="trade-h">
    <h2 id="trade-h" tabindex="-1">거래·계약 <small>진행 중 ${active.length}건</small></h2>${config.culture ? `
    ${cultureTab(state, config, ui)}` : ''}
    ${delayPanel()}
    ${offerBoard()}
    ${active.map(contractPanel).join('')}
    ${closedContracts()}
    ${!view.contracts.length && anyExpired ? '<p class="muted">견적이 만료되었습니다. ‘처음부터’로 다시 시작할 수 있습니다.</p>' : ''}
  </section>`;
}

function resourcePanel(): string {
  const f = fundsPosition(view, config, config.tradeCurrency);
  const reservations = cashReservations(view, config);
  const bar = (used: number, cap: number) => {
    const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
    return `<span class="bar ${pct >= 100 ? 'full' : pct >= 80 ? 'high' : ''}" role="img" aria-label="${pct}% 사용"><span style="width:${pct}%"></span></span>`;
  };
  const crew = employedDefs(view, config).map((e) => {
    const t = runningTaskOf(view, e.id);
    return `<li><b>${esc(e.nameKo)}</b> ${t ? `${esc(crewStatusKo(t))} — ${esc(taskSchedule(t, config))}` : '<span class="ok">대기 — 배정 가능</span>'}<small>${esc(cityName(config, view.employees.find((x) => x.id === e.id)?.locationCityId ?? null))} · 하루 ${e.workUnitsPerDay}pt</small></li>`;
  });
  const sailings = config.routes.flatMap((r) => listSailings(config, r.id, view.day).slice(0, 2)).sort((a, b) => a.departureDay - b.departureDay || a.id.localeCompare(b.id));
  const space = sailings.map((s) => {
    const load = sailingLoad(view, config, s);
    const on = view.bookings.filter((b) => b.sailingId === s.id && b.status !== 'CANCELLED').map((b) => b.contractId);
    return `<li><b>${esc(s.id)}</b> ${s.departureDay}일 출항 ${esc(cityName(config, config.routes.find((r) => r.id === s.routeId)?.fromCityId ?? null))}→${esc(cityName(config, config.routes.find((r) => r.id === s.routeId)?.toCityId ?? null))}
      <div class="meter">부피 ${bar(load.volumeLiters, load.capacityLiters)} ${fmtM3(load.volumeLiters)} / ${fmtM3(load.capacityLiters)}</div>
      <div class="meter">무게 ${bar(load.massGrams, load.capacityGrams)} ${fmtKg(load.massGrams)} / ${fmtKg(load.capacityGrams)}</div>
      <small>${on.length ? `실을 계약: ${esc(on.join(', '))}` : '예약 없음'}</small></li>`;
  });
  return `
  <section class="panel resources" aria-labelledby="res-h">
    <h2 id="res-h">자원 예약 <small>오늘 할 일까지 반영 · 같은 돈·사람·공간을 두 번 쓰지 않습니다</small></h2>
    <h3>자금 (USD)</h3>
    <table class="money">
      <tr><th>현금 (오늘 할 일 실행 뒤)</th><td>${usd(f.cash)}</td></tr>
      <tr><th>체결 계약의 남은 지출 예약</th><td>−${usd(f.reserved)}</td></tr>
      ${f.unpaidObligations ? `<tr><th>미지급</th><td>−${usd(f.unpaidObligations)}</td></tr>` : ''}
      <tr class="total"><th>사용 가능 (오늘 할 일 실행 뒤)</th><td class="${f.available < 0 ? 'neg' : ''}">${usd(f.available)}</td></tr>
    </table>
    ${reservations.length ? `<ul class="reserve-list">${reservations.map((r) => `<li>${esc(r.contractId)} ${r.kind === 'FREIGHT' ? '운임 (예약 전)' : '관세 (도착 때)'} <b>${usd(r.amountMinor)}</b></li>`).join('')}</ul>` : '<p class="muted small">묶인 돈이 없습니다.</p>'}
    <p class="muted small">${committedRule() ? '규칙 M2a: 새 계약·운임은 사용 가능 자금으로만 판단합니다.' : '규칙 M1: 새 계약은 지금 현금만 확인합니다. 예약은 참고 표시입니다.'}</p>
    <h3>직원 시간</h3>
    <ul class="crew-time">${crew.join('')}</ul>
    <h3>선복 (다가오는 출항편)</h3>
    <ul class="space-list">${space.join('') || '<li class="muted">남은 출항편이 없습니다.</li>'}</ul>
  </section>`;
}

function reportPanel(): string {
  const r = companyReport(state, config);
  const t = r.trade;
  const f = fundsPosition(state, config, config.tradeCurrency);
  const fwdOn = config.rules.forwardingEnabled;
  const why: string[] = [];
  if (t.accountsReceivable > 0) {
    const open = state.invoices.filter((i) => i.status !== 'PAID').sort((a, b) => a.dueDay - b.dueDay);
    why.push(`매출 ${usd(t.accountsReceivable)}는 이미 이익에 들어갔지만 현금은 나중에 들어옵니다 (매출채권: ${open.map((i) => `${i.contractId} ${i.dueDay}일 ${usd(i.amountMinor)}`).join(', ')}).`);
  }
  if (t.inventory > 0) why.push(`재고 ${r.inventoryUnits}개(${usd(t.inventory)})는 현금이 이미 나갔지만 팔기 전까지 비용이 아닙니다.`);
  if (t.prepaidFreight > 0) why.push(`선급운임 ${usd(t.prepaidFreight)}는 출항하면 상품 원가(직접 무역) 또는 주선 진행원가(운송 주선)가 됩니다.`);
  if (t.forwardingWip > 0) why.push(`주선 진행원가 ${usd(t.forwardingWip)}는 고객 화물을 실은 운임입니다. 인도해 서비스 매출을 올리는 날 비용이 됩니다.`);
  if (r.customerCargoUnits > 0) why.push(`맡은 고객 화물 ${r.customerCargoUnits}개는 고객 자산이라 위 표 어디에도 없습니다. 우리 몫은 서비스 대금뿐입니다.`);
  if (committedRule() && f.reserved > 0) why.push(`사용 가능 자금(${usd(f.available)})은 현금보다 ${usd(f.reserved + f.unpaidObligations)} 적습니다. 체결한 계약이 낼 운임·관세를 미리 묶어 두었기 때문입니다.`);
  if (!why.length) why.push('지금은 현금과 장부가 같은 이야기를 하고 있습니다. 거래를 진행하며 차이가 생기는 순간을 확인해 보세요.');
  const neg = (minor: number, fmt: (m: number) => string) => (minor === 0 ? fmt(0) : '−' + fmt(minor));
  const row = (k: string, v: string, cls = '') => `<tr class="${esc(cls)}"><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  return `
  <section class="panel report" aria-labelledby="report-h">
    <h2 id="report-h">경영 보고</h2>
    <div class="books">
      <table class="money"><caption>거래 장부 · USD</caption>
        ${row('현금', usd(t.cash))}${row(`재고 (${r.inventoryUnits}개)`, usd(t.inventory))}${row('선급운임', usd(t.prepaidFreight))}${fwdOn ? row('주선 진행원가', usd(t.forwardingWip)) : ''}${row('매출채권', usd(t.accountsReceivable))}${row('자산 합계', usd(t.totalAssets), 'total')}
        ${row('상품 매출', usd(t.revenue))}${row('매출원가', neg(t.costOfGoodsSold, usd))}${fwdOn ? row('주선 매출', usd(t.forwardingRevenue)) + row('주선 원가', neg(t.forwardingCost, usd)) : ''}${row('취소비', neg(t.cancellationExpense, usd))}${row('거래 손익', usd(t.profit), 'total')}
        ${fwdOn ? `<tr><td colspan="2" class="muted small">맡은 고객 화물 ${r.customerCargoUnits}개 — 회사 자산이 아니라 표에 넣지 않습니다.</td></tr>` : ''}
      </table>
      <table class="money"><caption>운영 장부 · KRW</caption>
        ${krwReportRows(r, config)}
        <tr><td colspan="2" class="muted small">${esc(krwReportNoteKo(config))}</td></tr>
      </table>
    </div>
    <div class="why"><h3>현금과 이익이 다른 이유</h3><ul>${why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
  </section>`;
}

function crewPanel(): string {
  const shown = crewEntries(view, config, ui.crewFilter);
  const filterBtn = (f: typeof ui.crewFilter, label: string) =>
    `<button data-action="crew-filter" data-filter="${f}" aria-pressed="${ui.crewFilter === f}">${label}</button>`;
  // REF-01·05: 카드와 운영표가 같은 직원 상태(view)를 같은 필터로 보여 준다. 행을 고르면 카드도 함께 선택된다.
  const rows = shown.map(({ def, candidate, task }) => crewRow(def, view, config, ui.selectedCard === def.id, candidate, task)).join('');
  return `
  <aside class="panel crew" aria-labelledby="crew-h">
    <h2 id="crew-h" tabindex="-1">동료 <small>${employedDefs(view, config).length}명 고용 중</small></h2>
    <div class="seg crew-filter" role="group" aria-label="동료 보기">${filterBtn('all', '전체')}${filterBtn('free', '대기')}${filterBtn('busy', '업무·교육 중')}${config.recruitment ? filterBtn('candidate', '후보') : ''}</div>
    <div class="crew-cards">${shown.map((entry) => crewEntryCard(entry, view, config, ui.selectedCard === entry.def.id)).join('') || '<p class="muted small">이 조건의 동료가 없습니다.</p>'}</div>
    <table class="roster"><caption>운영표 — 카드와 같은 상태</caption>
      <thead><tr><th scope="col">동료·직무</th><th scope="col">상태·위치</th><th scope="col">처리량·일급</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${ui.selectedCard && employedDefs(view,config).some((e)=>e.id===ui.selectedCard) ? employeeDetail(view,config,config.employees.find((e)=>e.id===ui.selectedCard)!,ui.detailId===ui.selectedCard,ui.pending.some((p)=>p.type==='START_TRAINING' && p.employeeId===ui.selectedCard)) : ''}
    ${recruitmentPanel(view, config, ui.recruitSelections, ui.interviewId, tryCommand, ui.pending, queuedStatus)}
    <p class="muted small">${esc(crewNoteKo(config, view))}</p>
  </aside>`;
}

function planLabel(plan: CommitPlan | undefined): string {
  if (!plan || (!plan.employeeId && !plan.sailingId)) return '';
  const parts = [plan.employeeId ? `준비 ${employeeName(plan.employeeId)}` : '', plan.sailingId ? `${plan.sailingId} 예약` : ''].filter(Boolean);
  return ` + ${parts.join(' + ')} (한 번에 확정)`;
}

function commandLabel(c: Command): string {
  switch (c.type) {
    case 'START_CULTURE_ACTIVITY': {
      const activity = config.culture?.activities.find((a) => a.id === c.activityId);
      return `${activity?.titleKo ?? c.activityId} → ${employeeName(c.employeeId)}${activity ? ` (${formatMoney(activity.currency, activity.costMinor)}·${activity.durationDays}일)` : ''}`;
    }
    case 'START_TRAINING':
      return `${employeeName(c.employeeId)} 일반 훈련`;
    case 'ACCEPT_TRADE': {
      const buy = offerOf(config, c.buyOfferId);
      return `직접 무역 수락·매입 (${buy ? qtyKo(buy.goodId, buy.quantity) : c.buyOfferId})${planLabel(c.plan)}`;
    }
    case 'ACCEPT_FORWARDING': {
      const o = offerOf(config, c.offerId);
      return `운송 주선 수락 (${o ? qtyKo(o.goodId, o.quantity) : c.offerId})${planLabel(c.plan)}`;
    }
    case 'SCOUT_SITE':
      return `${venueTitle(c.venueId)} 현장 조사 → ${employeeName(c.employeeId)}`;
    case 'START_RECRUIT_QUEST':
      return `${employeeName(c.candidateId)} 영입 의뢰 → ${employeeName(c.employeeId)}`;
    case 'HIRE_CANDIDATE':
      return `${employeeName(c.candidateId)} 고용`;
    case 'ASSIGN_TASK': {
      const t = view.tasks.find((x) => x.id === c.taskId);
      return `${t ? `${taskSubjectKo(config, t) ?? ''} ${taskName(t.kind)}` : c.taskId} → ${employeeName(c.employeeId)}`;
    }
    case 'BOOK_SAILING':
      return `${c.contractId} 운송편 예약 (${c.sailingId})`;
    case 'CANCEL_CONTRACT':
      return `${c.contractId} 출항 전 취소`;
    case 'RESPOND_TO_DELAY':
      return '지연 대응: 현재 예약으로 대기';
  }
}

function queuePanel(): string {
  const plan = planCommands(state, config, ui.pending);
  return `
  <section class="panel queue" aria-labelledby="queue-h">
    <h2 id="queue-h" tabindex="-1">오늘 할 일 <small>${state.day}일 · 하루 진행 때 이 순서로 실행</small></h2>
    ${ui.flash ? `<p class="flash ${ui.flash.kind}">${esc(ui.flash.text)}</p>` : ''}
    ${ui.pending.length ? '<p class="muted small amount-basis-note">위쪽 막대의 금액은 확정 기준입니다. 여기 넣은 일은 하루 진행 뒤에 반영됩니다.</p>' : ''}
    ${ui.pending.length ? `<ol class="pending">${ui.pending.map((c, i) => `<li class="${plan[i]?.status === 'APPLIED' ? '' : 'bad'}">${esc(commandLabel(c))}${plan[i]?.status !== 'APPLIED' ? ` — ${esc(plan[i]?.reasonKo ?? '')}` : ''}<button class="link" data-action="unqueue" data-index="${i}" data-command="${esc(c.id)}" aria-label="${esc(commandLabel(c))} 빼기">빼기</button></li>`).join('')}</ol>` : '<p class="muted">대기 중인 명령이 없습니다. 아무것도 하지 않고 하루를 보낼 수도 있습니다.</p>'}
    ${ui.growthNoticesDay === null ? '' : growthStatus(ui.growthNotices, ui.growthNoticesDay, ui.growthNoticesFresh && ui.flash?.action !== 'culture-result')}
  </section>`;
}

function logPanel(): string {
  const items = [...state.log].reverse().slice(0, 40);
  return `
  <section class="panel log" aria-labelledby="log-h">
    <h2 id="log-h">기록</h2>
    <ul>${items.map((l) => `<li><span>${l.day}일</span>${esc(l.textKo)}</li>`).join('') || '<li class="muted">아직 기록이 없습니다.</li>'}</ul>
    <details class="muted small"><summary>이 시제품이 가정한 값</summary><ul>${assumptionNotes(config.id as ScenarioId).map((n) => `<li>${esc(n)}</li>`).join('')}</ul></details>
  </section>`;
}

function render(skipFocus = false, anchor: { slot: string; top: number } | null = null) {
  document.title = `Scitrade — ${config.titleKo}`;
  view = planState(state, config, ui.pending).state;
  const previousMap = app.querySelector<HTMLElement>('.map-frame.is-world');
  if (previousMap) mapScrollRatio = readMapScroll(true, previousMap.dataset.measured === 'true', resetMapScroll,
    previousMap.scrollLeft, previousMap.scrollWidth, previousMap.clientWidth, mapScrollRatio);
  const focused = activation?.element ?? document.activeElement as HTMLElement | null;
  // 태그와 모든 대상 속성을 비교한다. 대기열 순번은 삭제 시 바뀌므로 명령 ID를 쓴다.
  const focusData = focused?.dataset.action ? { ...focused.dataset } : null;
  if (focusData) delete focusData.index;
  const tag = focused?.tagName;
  const blockHeading = focused?.closest(FOCUS_FALLBACK_SELECTORS.join(', '))?.querySelector('h3, h4')?.id
    ?? focused?.closest('.contract, .panel')?.querySelector('h3[id], h2[id]')?.id;
  app.innerHTML = `
    ${topbar()}
    <main class="layout ${mapPresentation(config, mapMode).world ? 'map-wide' : ''}">
      ${worldMap()}
      ${crewPanel()}
      ${config.culture ? `<div class="maincol">${culturePanel(state, view, ui.pending, config, ui, queuedStatus)}${tradePanel()}</div>` : tradePanel()}
      ${resourcePanel()}
      ${queuePanel()}
      ${reportPanel()}
      ${logPanel()}
    </main>
    ${ui.flash ? `<div class="flash-toast flash ${ui.flash.kind}"${ui.flash.action === 'culture-result' ? ui.cultureResultFresh ? ' role="status"' : '' : ' role="status"'}>${esc(ui.flash.text)}${ui.flash.action === 'culture-result' ? `<button data-action="culture-result">${CULTURE_KO.resultButton}</button>` : ''}</div>` : ''}`;
  const toastEl = app.querySelector<HTMLElement>('.flash-toast');
  document.documentElement.style.setProperty('--toast-h', toastEl ? `${Math.ceil(window.innerHeight - toastEl.getBoundingClientRect().top) + 8}px` : '0px');
  measureStatusbar();
  if (anchor) {
    const now = document.getElementById(`status-${anchor.slot}`)?.parentElement ?? app.querySelector<HTMLElement>(`[data-action-slot="${anchor.slot}"]`);
    const dy = now ? now.getBoundingClientRect().top - anchor.top : 0;
    if (dy >= 1) window.scrollBy(0, dy);
  }
  // 다음 하루 진행·초기화까지 글은 남기고, 화면 읽기 알림은 첫 그리기만 한다.
  ui.growthNoticesFresh = false;
  ui.cultureResultFresh = false;
  const frame = app.querySelector<HTMLElement>('[data-map-frame]')!;
  frame.dataset.viewportKey = mapRedrawDecision(config, mapMode, mapMeasurements.get(mapMode)).key;
  const positionMap = () => {
    const center = Number(frame.querySelector<HTMLElement>('[data-map-center]')?.dataset.mapCenter ?? 0.5);
    const left = mapScrollPosition(mapPresentation(config, mapMode).world, mapScrollRatio, center, frame.scrollWidth, frame.clientWidth);
    if (left !== undefined) frame.scrollLeft = left;
  };
  if (mapMeasurements.has(mapMode)) {
    frame.dataset.measured = 'true';
    positionMap();
    resetMapScroll = false;
  }
  applyPixelScale(app, (frame, width, dpr) => {
    const measurement = { availableWidth: width, dpr };
    const decision = mapRedrawDecision(config, mapMode, measurement, frame.dataset.viewportKey);
    mapScrollRatio = readMapScroll(mapPresentation(config, mapMode).world, frame.dataset.measured === 'true', resetMapScroll,
      frame.scrollLeft, frame.scrollWidth, frame.clientWidth, mapScrollRatio);
    mapMeasurements.remember(mapMode, width, dpr);
    if (decision.redraw) {
      frame.innerHTML = renderWorldMap(view, config, mapMode, { ...measurement, baseOutsideSvg: MAP_BASE_OUTSIDE_SVG });
      frame.dataset.viewportKey = decision.key;
    }
    frame.dataset.measured = 'true';
    positionMap();
    resetMapScroll = false;
  });
  if (focusData && !skipFocus) {
    const target = Array.from(app.querySelectorAll<HTMLElement>('[data-action]')).find((el) =>
      el.tagName === tag && Object.entries(focusData).every(([key, value]) => el.dataset[key] === value));
    const slot = focusData.action === 'assign' ? `assign-${focusData.task}` : focusData.action === 'book' ? `book-${focusData.contract}`
      : focusData.action === 'culture-queue' ? `culture-${focusData.activity}-${focusData.emp}` : undefined;
    const ids = [slot ? `status-${slot}` : undefined, ...focusFallbackIds(focusData, blockHeading)];
    const fallback = ids.filter((id): id is string => Boolean(id) && !(activation?.pointer && id === 'queue-h'))
      .map((id) => document.getElementById(id)).find(Boolean);
    focusWithoutScroll(target && !(target instanceof HTMLButtonElement && target.disabled) ? target : fallback);
  }
}

function showGrowthControl() {
  const control = app.querySelector<HTMLElement>('[data-action="detail"]');
  control?.scrollIntoView({ block: 'nearest' });
  control?.focus({ preventScroll: true });
}

/** 본 날을 바꾸기 전에 표시 시작일을 기억해, 여는 순간 결과가 사라지지 않게 한다. */
function markCultureSeen() {
  ui.cultureShowFromDay = ui.cultureSeenDay ?? state.day - 1;
  ui.cultureSeenDay = state.day;
}

function openCulture(result = false) {
  ui.cultureTabTop = result ? null : document.getElementById('local-tab')?.getBoundingClientRect().top ?? null;
  markCultureSeen();
  // ‘결과 보기’는 같은 날 탭으로 먼저 열었어도 방금 마감한 날의 결과를 보여 준다.
  if (result) ui.cultureShowFromDay = Math.min(ui.cultureShowFromDay!, state.day - 1);
  ui.cultureOpen = true;
  if (result) ui.flash = null;
  render(true);
  const task = result ? cultureResultTasks(state, config, state.day - 1).find((t) => t.completedDay === state.day - 1) : null;
  const heading = (task && document.getElementById(`culture-result-h-${task.id}`)) || document.getElementById('local-h');
  heading?.scrollIntoView({ block: 'start' });
  heading?.focus({ preventScroll: true });
  ignoreClicksUntil = Date.now() + 500;
}

function closeCulture() {
  ui.cultureOpen = false;
  render(true);
  const tab = document.getElementById('local-tab');
  if (tab) {
    const rect = tab.getBoundingClientRect();
    const top = (app.querySelector<HTMLElement>('.statusbar')?.getBoundingClientRect().bottom ?? 0) + 8;
    const bottom = Math.min(window.innerHeight, app.querySelector<HTMLElement>('.flash-toast')?.getBoundingClientRect().top ?? Infinity) - 8;
    const dy = ui.cultureTabTop !== null ? rect.top - ui.cultureTabTop
      : rect.top < top ? rect.top - top : rect.bottom > bottom ? rect.bottom - bottom : 0;
    if (Math.abs(dy) >= 1) window.scrollBy(0, dy);
    tab.focus({ preventScroll: true });
  }
  ui.cultureTabTop = null;
  ignoreClicksUntil = Date.now() + 500;
}

/** 직원 고르기 뒤 제목부터 넣기 칸까지를 고정 막대와 알림 사이로 최소 거리만 움직인다. */
function showCulturePreview(employeeId: string) {
  const head = document.getElementById('culture-emp-h');
  const slot = document.getElementById('culture-slot');
  const employee = document.getElementById(`culture-emp-${employeeId}`);
  if (head && slot && employee) {
    const top = app.querySelector<HTMLElement>('.statusbar')?.getBoundingClientRect().bottom ?? 0;
    const toastTop = app.querySelector<HTMLElement>('.flash-toast')?.getBoundingClientRect().top ?? Infinity;
    const bottom = Math.min(window.innerHeight - 72, toastTop);
    const headTop = head.getBoundingClientRect().top;
    const slotBottom = slot.getBoundingClientRect().bottom;
    const needed = slotBottom > bottom ? slotBottom - bottom : headTop < top ? headTop - top : 0;
    const dy = Math.min(needed, employee.getBoundingClientRect().top - top - 8);
    if (Math.abs(dy) >= 1) window.scrollBy(0, dy);
  }
  employee?.focus({ preventScroll: true });
}

// ── 이벤트 ──

app.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!el || (el as HTMLButtonElement).disabled || Date.now() < ignoreClicksUntil) return;
  activation = { element: el, pointer: ev.detail > 0 };
  const d = el.dataset;
  try {
    switch (d.action) {
      case 'culture-tab':
        return ui.cultureOpen ? closeCulture() : openCulture();
      case 'culture-close':
        return closeCulture();
      case 'culture-result':
        return openCulture(true);
      case 'culture-act':
        if (ui.cultureActivityId !== d.activity) ui.cultureEmployeeId = null;
        ui.cultureActivityId = d.activity!;
        render();
        ignoreClicksUntil = Date.now() + 500;
        return;
      case 'culture-emp':
        ui.cultureEmployeeId = d.emp!;
        render(true);
        showCulturePreview(d.emp!);
        ignoreClicksUntil = Date.now() + 500;
        return;
      case 'culture-queue':
        return queue({ id: newId('CULTURE'), type: 'START_CULTURE_ACTIVITY', activityId: d.activity!, employeeId: d.emp! });
      case 'culture-book':
        ui.cultureBookOpen = !ui.cultureBookOpen;
        return render();
      case 'train':
        return queue({ id: newId('TRAIN'), type: 'START_TRAINING', employeeId: d.emp! });
      case 'detail':
        ui.detailId = ui.detailId === d.emp ? null : d.emp!;
        return render();
      case 'scout':
        return queue({ id: newId('SCOUT'), type: 'SCOUT_SITE', venueId: d.venue!, employeeId: d.emp! });
      case 'recruit-quest':
        return queue({ id: newId('QUEST'), type: 'START_RECRUIT_QUEST', candidateId: d.candidate!, employeeId: d.emp! });
      case 'interview':
        ui.interviewId = ui.interviewId === d.candidate ? null : d.candidate!;
        return render();
      case 'hire':
        return queue({ id: newId('HIRE'), type: 'HIRE_CANDIDATE', candidateId: d.candidate! });
      case 'end-day':
        return endDay();
      case 'accept':
        return queue({ id: newId('ACCEPT'), type: 'ACCEPT_TRADE', buyOfferId: d.buy!, sellOfferId: d.sell! });
      case 'accept-fwd':
        return queue({ id: newId('FWD'), type: 'ACCEPT_FORWARDING', offerId: d.offer! });
      case 'assign':
        return queue({ id: newId('ASSIGN'), type: 'ASSIGN_TASK', taskId: d.task!, employeeId: d.emp! });
      case 'book':
        return queue({ id: newId('BOOK'), type: 'BOOK_SAILING', contractId: d.contract!, sailingId: d.sailing! });
      case 'cancel':
        return queue({ id: newId('CANCEL'), type: 'CANCEL_CONTRACT', contractId: d.contract! });
      case 'keep':
        return queue({ id: newId('KEEP'), type: 'RESPOND_TO_DELAY', noticeId: d.notice!, shipmentId: d.shipment!, choice: 'KEEP_SHIPMENT_BOOKING' });
      case 'unqueue':
        ui.pending.splice(Number(d.index), 1);
        ui.flash = null;
        return render();
      case 'map-mode':
        mapMode = d.mode === 'world' ? 'world' : 'route';
        return render();
      case 'select-card':
        ui.selectedCard = d.emp ?? null;
        render();
        showGrowthControl();
        return;
      case 'crew-filter':
        ui.crewFilter = d.filter === 'free' || d.filter === 'busy' || d.filter === 'candidate' ? d.filter : 'all';
        return render();
      case 'accept-plan': {
        const base = offerCommands[d.key!];
        if (!base || (base.type !== 'ACCEPT_TRADE' && base.type !== 'ACCEPT_FORWARDING')) return;
        return queue({ ...base, id: newId('PLAN'), plan: { ...ui.plans[d.key!] } });
      }
      case 'restart':
        if (!confirm('처음부터 시작하면 현재 진행과 오늘 할 일이 사라집니다. 다시 시작할까요?')) return;
        startScenario(config.id as ScenarioId);
        return render();
      case 'save':
        try {
          localStorage.setItem(SAVE_KEY, serializeSave(state));
          ui.flash = { kind: 'info', text: `${state.day}일 상태를 이 브라우저에 저장했습니다. 대기 중인 명령은 저장하지 않습니다.` };
        } catch {
          ui.flash = { kind: 'warn', text: '이 브라우저에서는 저장할 수 없습니다. ‘내보내기’로 파일을 받아 두세요.' };
        }
        return render();
      case 'load': {
        let text: string | null = null;
        try {
          text = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY);
        } catch {
          text = null;
        }
        if (text && !confirm('불러오면 현재 진행과 오늘 할 일이 사라집니다. 저장된 상태를 불러올까요?')) return;
        return text ? loadText(text) : ((ui.flash = { kind: 'warn', text: '저장된 상태가 없습니다.' }), render());
      }
      case 'export': {
        const blob = new Blob([serializeSave(state)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `scitrade-${config.id}-day${state.day}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }
    }
  } finally { activation = null; }
});

app.addEventListener('keydown', (ev) => {
  const el = ev.target as HTMLElement;
  if (el.dataset.action === 'select-card' && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault();
    ui.selectedCard = el.dataset.emp ?? null;
    render();
    showGrowthControl();
  }
});

app.addEventListener('change', async (ev) => {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  if (el.dataset.action === 'scenario') {
    if (!confirm('시나리오를 바꾸면 현재 진행과 오늘 할 일이 사라집니다. 바꿀까요?')) {
      el.value = config.id;
      return;
    }
    startScenario(el.value as ScenarioId);
    render();
  } else if (el.dataset.action === 'recruit-emp') {
    ui.recruitSelections[el.dataset.key!] = el.value;
    render();
  } else if (el.dataset.action === 'plan-emp' || el.dataset.action === 'plan-sailing') {
    const key = el.dataset.key!;
    const plan = { ...(ui.plans[key] ?? {}) };
    const value = el.value || undefined;
    if (el.dataset.action === 'plan-emp') plan.employeeId = value;
    else plan.sailingId = value;
    ui.plans[key] = plan;
    ui.touchedPlans.add(key);
    render();
  } else if (el.dataset.action === 'import' && el instanceof HTMLInputElement && el.files?.[0]) {
    if (!confirm('가져오면 현재 진행과 오늘 할 일이 사라집니다. 파일을 불러올까요?')) { el.value = ''; return; }
    loadText(await el.files[0].text());
  }
});

function loadText(text: string) {
  const loaded = loadSaveText(text);
  if ('errorKo' in loaded) {
    ui.flash = { kind: 'warn', text: loaded.errorKo };
  } else {
    config = loaded.config;
    state = loaded.state;
    resetUi();
    ui.flash = { kind: 'info', text: `${config.titleKo} ${state.day}일 상태를 불러왔습니다. 이미 공개된 사건은 다시 적용하지 않습니다.` };
  }
  render();
}

startScenario('SCENARIO_M2_MULTI_TRADE');
render();
