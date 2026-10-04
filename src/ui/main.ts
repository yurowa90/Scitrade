// 최소 화면: 견적판·계약(UI_TRADE), 자원 예약, 세계지도(UI_WORLD), 경영 보고(UI_REPORT), 동료 카드.
// 화면은 엔진 상태를 읽고 명령을 대기열에 넣을 뿐, 현금·재고·예약을 따로 들고 있지 않다.

import './style.css';
import { SCENARIO_IDS, assumptionNotes, loadScenario, type ScenarioId } from '../content/scenario';
import { cargoSpace, goodOf, offerOf, routeBetween, unitKo } from '../engine/catalog';
import { cityName, commitDay, createGame, listSailings, openDay, planCommands, planState } from '../engine/engine';
import { formatMoney } from '../engine/money';
import { companyReport, contractReport, forwardingPreview, tradePairs, tradePreview, type QuotePreview } from '../engine/reports';
import { cashReservations, fmtKg, fmtM3, fundsPosition, runningTaskOf, sailingLoad } from '../engine/reservations';
import { SaveError, deserializeSave, serializeSave } from '../engine/save';
import type { Command, CommandResult, Contract, EmployeeDef, GameState, ScenarioConfig } from '../engine/types';
import { crewCard } from './card';
import { MAP_ATTRIBUTION, renderWorldMap, type MapMode } from './map';

const SAVE_KEY = 'scitrade-save';
/** M1 시제품이 쓰던 저장 칸. 불러오기만 하며, 저장 형식 판본 1은 엔진이 명시적으로 이관한다. */
const LEGACY_SAVE_KEY = 'scitrade-m1-save';
const SCENARIO_TITLES = Object.fromEntries(SCENARIO_IDS.map((id) => [id, loadScenario(id).titleKo])) as Record<ScenarioId, string>;

let config: ScenarioConfig;
let state: GameState;
/** 대기 명령을 반영한 ‘오늘 실행 예정’ 사본. 거래·예약 화면 표시에만 쓰고 보고·현금은 확정 상태(state)를 쓴다. */
let view: GameState;
let pending: Command[] = [];
let flash: { kind: 'info' | 'warn'; text: string } | null = null;
let selectedCard: string | null = null;
let mapMode: MapMode = 'route';
let commandSeq = 0;

const app = document.querySelector<HTMLDivElement>('#app')!;

function startScenario(id: ScenarioId) {
  config = loadScenario(id);
  state = openDay(createGame(config), config).state;
  pending = [];
  flash = null;
  selectedCard = null;
}

function newId(type: string): string {
  commandSeq += 1;
  return `UI-${state.day}-${type}-${Date.now().toString(36)}-${commandSeq}`;
}

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
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
  return planCommands(state, config, [...pending, cmd]).at(-1)!;
}

function queue(cmd: Command) {
  const result = tryCommand(cmd);
  if (result.status !== 'APPLIED') {
    flash = { kind: 'warn', text: result.reasonKo };
  } else {
    pending.push(cmd);
    flash = { kind: 'info', text: '오늘 할 일에 넣었습니다. ‘하루 진행’을 누르면 실행됩니다. 그 전에는 시간이 흐르지 않습니다.' };
  }
  render();
}

function endDay() {
  if (state.phase !== 'AWAITING_INPUT') return;
  const committed = commitDay(state, config, pending);
  const rejected = committed.results.filter((r) => r.status === 'REJECTED');
  state = committed.state.phase === 'ENDED' ? committed.state : openDay(committed.state, config).state;
  pending = [];
  flash = rejected.length
    ? { kind: 'warn', text: `실행하지 못한 명령: ${rejected.map((r) => r.reasonKo).join(' / ')}` }
    : null;
  render();
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
      : `<p class="pill warn">계약 취소됨 (${c.cancelledDay}일) — 상품은 회사 재고로 ${cityName(config, c.originCityId)}에 남음</p>`;
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
    <div class="brand"><span class="logo">Scitrade</span><span class="sub">${config.stage} 시제품 · 규칙 ${config.rules.rulesVersion} · DESIGN 가상값</span></div>
    <label class="scenario">시나리오
      <select data-action="scenario">
        ${SCENARIO_IDS.map((id) => `<option value="${id}" ${id === config.id ? 'selected' : ''}>${esc(SCENARIO_TITLES[id])}</option>`).join('')}
      </select>
    </label>
    <div class="day"><b>${Math.min(state.day, config.campaignDays)}일</b> / ${config.campaignDays}<span>${phaseText}</span></div>
    <div class="stat"><span>거래 현금 (USD)</span><b>${usd(r.trade.cash)}</b></div>
    ${committedRule() ? `<div class="stat"><span>사용 가능 (예약 제외)</span><b class="${f.available < 0 ? 'neg' : ''}">${usd(f.available)}</b></div>` : ''}
    <div class="stat"><span>운영 현금 (KRW)</span><b>${krw(r.payroll.cash)}</b></div>
    <div class="stat"><span>다음 수금</span><b>${nextReceipt ? `${nextReceipt.dueDay}일 ${usd(nextReceipt.amountMinor)}` : '없음'}</b></div>
    <div class="actions">
      <button class="primary" data-action="end-day" ${state.phase !== 'AWAITING_INPUT' ? 'disabled' : ''}>하루 진행 ▶</button>
      <button data-action="save">저장</button>
      <button data-action="load">불러오기</button>
      <button data-action="export">내보내기</button>
      <label class="file-btn">가져오기<input type="file" accept="application/json" data-action="import" hidden /></label>
      <button data-action="restart">처음부터</button>
    </div>
  </header>`;
}

function worldMap(): string {
  const moving = state.shipments.filter((x) => x.arrivalDay === null);
  const waiting = moving.filter((x) => state.day >= x.scheduledArrivalDay);
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
        <button data-action="map-mode" data-mode="region" aria-pressed="${mapMode === 'region'}">전체 해역</button>
      </div>
    </div>
    <div class="map-frame">${renderWorldMap(state, config, mapMode)}</div>
    <p class="muted small">${routeText}. 항로선은 표시용이며 실제 항로 자료가 아닙니다. ${MAP_ATTRIBUTION}.</p>
  </section>`;
}

function reporter(role: string): EmployeeDef | undefined {
  return config.employees.find((e) => e.role === role) ?? config.employees[0];
}

function quoteBlock(q: QuotePreview, rows: string, cmd: Command, extra: string[], validUntil: number): string {
  const check = tryCommand(cmd);
  const sailing = q.departureDay !== null
    ? `다음 출항 ${q.departureDay}일 → ${q.arrivalDay}일 도착 예정 (납기 ${q.deliveryDeadlineDay}일)${q.lateOnNextSailing ? ' ⚠ 납기 초과 — 감액 반영' : ''}`
    : '남은 출항편 없음';
  const need = committedRule()
    ? `수락하려면 사용 가능 자금 ${usd(q.cashNeed)}이(가) 필요합니다 (매입·운임·관세를 미리 묶음).`
    : `수락하면 매입 대금 ${usd(q.purchase)}을(를) 지금 현금으로 냅니다.`;
  const actionAttr = cmd.type === 'ACCEPT_TRADE'
    ? `data-action="accept" data-buy="${cmd.buyOfferId}" data-sell="${cmd.sellOfferId}"`
    : cmd.type === 'ACCEPT_FORWARDING' ? `data-action="accept-fwd" data-offer="${cmd.offerId}"` : '';
  return `
    <table class="money">${rows}<tr class="total"><th>예상 기여이익 (급여 전)</th><td>${usd(q.contributionBeforePayroll)}</td></tr></table>
    <ul class="quote-facts"><li>${sailing}</li><li>${need}</li>${extra.map((x) => `<li>${x}</li>`).join('')}</ul>
    <details><summary>현금 일정 미리 보기 — 이익과 현금은 다른 날 움직입니다</summary>
      <ul class="schedule">${q.schedule.map((x) => `<li><span>${x.day}일</span>${x.labelKo}<b>${x.amount === 0 ? '현금 변화 없음' : (x.amount > 0 ? '+' : '−') + usd(Math.abs(x.amount))}</b></li>`).join('')}</ul>
      <p class="muted">지연·취소가 없다는 가정의 계산이며 결과를 보장하지 않습니다.</p>
    </details>
    <p class="muted small">견적 유효: ${validUntil}일까지 · 모든 수치는 개발용 가상값(DESIGN)</p>
    <button class="primary" ${actionAttr} ${check.status !== 'APPLIED' ? 'disabled' : ''}>견적 수락</button>${check.status !== 'APPLIED' ? `<p class="reason">${esc(check.reasonKo)}</p>` : ''}`;
}

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
      <tr><th>매입 (${buy.quantity}${unitKo(g)} × ${usd(buy.unitPriceMinor)})</th><td>−${usd(q.purchase)}</td></tr>
      <tr><th>운임 (선지급)</th><td>−${usd(q.freight)}</td></tr>
      <tr><th>관세 (가상 세율 ${config.terms.dutyRateBasisPoints / 100}% · 상품 송장 기준)</th><td>−${usd(q.duty)}</td></tr>
      <tr><th>판매 (${sell.quantity}${unitKo(g)} × ${usd(sell.unitPriceMinor)})${q.lateOnNextSailing ? ' − 지연 감액' : ''}</th><td>+${usd(q.sale)}</td></tr>`;
    const cmd: Command = { id: newId('ACCEPT'), type: 'ACCEPT_TRADE', buyOfferId: buy.id, sellOfferId: sell.id };
    const space = cargoSpace(config, buy.goodId, buy.quantity);
    cards.push(`
    <article class="offer">
      <h3><span class="kind kind-trade">직접 무역</span> ${qtyKo(buy.goodId, buy.quantity)} · ${cityName(config, buy.cityId)} → ${cityName(config, sell.cityId)}</h3>
      <p class="report-line">📋 <b>${by?.nameKo ?? '직원'}의 보고</b> — “${cityName(config, buy.cityId)} 공급자가 ${g.nameKo} ${buy.quantity}${unitKo(g)}을(를) 내놨고, ${cityName(config, sell.cityId)} 고객이 같은 수량을 원합니다. 납기 ${deadline}일, 대금은 ${due}일에 받습니다.”</p>
      ${quoteBlock(q, rows, cmd, [`화물 공간 ${fmtKg(space.massGrams)} · ${fmtM3(space.volumeLiters)}`], Math.min(buy.validUntilDay, sell.validUntilDay))}
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
    cards.push(`
    <article class="offer forwarding">
      <h3><span class="kind kind-fwd">운송 주선</span> 고객 화물 ${qtyKo(offer.goodId, offer.quantity)} · ${cityName(config, offer.cityId)} → ${cityName(config, offer.destinationCityId)}</h3>
      <p class="report-line">📋 <b>${by?.nameKo ?? '직원'}의 보고</b> — “${partyKo(offer.counterpartyId)}가 ${qtyKo(offer.goodId, offer.quantity)}을(를) ${cityName(config, offer.destinationCityId)}까지 보내 달라고 합니다. 화물은 고객 것이고, 우리는 운송을 주선해 서비스 대금을 받습니다. 납기 ${offer.deliveryDeadlineDay}일, 대금은 ${offer.paymentDueDay}일.”</p>
      ${quoteBlock(q, rows, cmd, [
        `화물 공간 ${fmtKg(space.massGrams)} · ${fmtM3(space.volumeLiters)}${route ? ` (편당 한도 ${route.capacityKg.toLocaleString('ko-KR')}kg · ${route.capacityM3}m³)` : ''}`,
        offer.declaredCargoValueMinor ? `신고가액 ${usd(offer.declaredCargoValueMinor)}은 고객 자산입니다. 회사 재고·매출에 들어가지 않습니다.` : '',
      ].filter(Boolean), offer.validUntilDay)}
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

  if (active && task?.status === 'QUEUED') {
    const queued = pending.some((p) => p.type === 'ASSIGN_TASK' && p.taskId === task.id);
    if (queued) {
      actions.push('<span class="pill">준비 업무 배정 예정</span>');
    } else {
      const buttons = config.employees.map((emp) => {
        const check = tryCommand({ id: newId('ASSIGN'), type: 'ASSIGN_TASK', taskId: task.id, employeeId: emp.id });
        return `<button data-action="assign" data-task="${task.id}" data-emp="${emp.id}" ${check.status !== 'APPLIED' ? 'disabled' : ''} title="${esc(check.reasonKo)}">${emp.nameKo}에게<small>${check.status === 'APPLIED' ? `하루 ${emp.workUnitsPerDay}pt` : '다른 업무 중'}</small></button>`;
      });
      actions.push(`<div class="sailings"><span>${forwarding ? '운송 주선 준비(화물 인수·선적 서류)' : '수출 준비'} ${task.requiredWorkUnits}pt 맡기기</span><div class="row">${buttons.join('')}</div></div>`);
    }
  }
  if (active && route && (!booking || booking.status === 'CANCELLED') && !shipment) {
    const queued = pending.some((p) => p.type === 'BOOK_SAILING' && p.contractId === c.id);
    if (queued) {
      actions.push('<span class="pill">운송편 예약 예정</span>');
    } else {
      const options = listSailings(config, route.id, view.day + 1).slice(0, 3).map((s) => {
        const load = sailingLoad(view, config, s);
        const need = cargoSpace(config, c.goodId, c.quantity);
        const cmd: Command = { id: newId('BOOK'), type: 'BOOK_SAILING', contractId: c.id, sailingId: s.id };
        const check = tryCommand(cmd);
        const late = s.scheduledArrivalDay + config.terms.customsDays > c.deliveryDeadlineDay;
        return `<button data-action="book" data-sailing="${s.id}" data-contract="${c.id}" ${check.status !== 'APPLIED' ? 'disabled' : ''} title="${esc(check.reasonKo)}">
          ${s.departureDay}일 출항 → ${s.scheduledArrivalDay}일 도착 예정${late ? ' ⚠ 납기 초과' : ''}<small>남은 ${fmtM3(load.capacityLiters - load.volumeLiters)} · ${fmtKg(load.capacityGrams - load.massGrams)} / 이 화물 ${fmtM3(need.volumeLiters)} · ${fmtKg(need.massGrams)}${check.status !== 'APPLIED' ? ` — ${esc(check.reasonKo)}` : ''}</small></button>`;
      });
      actions.push(`<div class="sailings"><span>운송편 예약 (${route.id}, 운임 ${usd(route.bookingFeeMinor)} 선지급)</span>${options.join('')}</div>`);
    }
  }
  if (active && booking?.status !== 'DEPARTED' && !shipment) {
    const queued = pending.some((p) => p.type === 'CANCEL_CONTRACT' && p.contractId === c.id);
    if (!queued) {
      const t = config.terms;
      actions.push(`<button class="danger" data-action="cancel" data-contract="${c.id}">출항 전 취소</button>
        <p class="muted small">취소하면: ${booking?.status === 'BOOKED' ? `운임 ${usd(t.preDepartureFreightRefundMinor)} 환급·취소비 ${usd(t.preDepartureCancellationFeeMinor)}, ` : ''}고객 보상 ${usd(t.customerCancellationCompensationMinor)}, ${forwarding ? '고객 화물은 화주에게 돌려줍니다.' : '공급자 반품 없음 → 산 상품은 재고로 남습니다.'}</p>`);
    } else actions.push('<span class="pill warn">출항 전 취소 예정</span>');
  }

  const cargo = !lot
    ? '-'
    : lot.owner === 'CUSTOMER'
      ? `${qtyKo(lot.goodId, lot.quantity)} · ${cityName(config, lot.locationCityId)} · 고객 화물(${partyKo(lot.ownerPartyId)}) — 회사 장부가액 없음`
      : `${qtyKo(lot.goodId, lot.quantity)} · ${cityName(config, lot.locationCityId)} · 장부가액 ${usd(lot.status === 'DELIVERED' ? 0 : lot.carryingAmountMinor)}`;
  const facts = [
    ['종류', forwarding ? `운송 주선 — ${partyKo(c.customerId)}의 화물` : `직접 무역 — ${partyKo(c.supplierId)} → ${partyKo(c.customerId)}`],
    ['담당', c.ownerEmployeeId ? `${employeeName(c.ownerEmployeeId)} (${c.ownerEmployeeId})` : '미배정'],
    ['화물', cargo],
    ['운송', shipment ? `${shipment.id} · ${shipment.departureDay}일 출항 · 도착 ${shipment.arrivalDay ?? `${shipment.scheduledArrivalDay}일 예정`}${shipment.observedWaitDays ? ` (항만 대기 ${shipment.observedWaitDays}일)` : ''}` : booking?.status === 'BOOKED' ? `${booking.sailingId} 예약됨` : '미예약'],
    ['납기', `${c.deliveryDeadlineDay}일 ${c.deliveredDay !== null ? (c.lateDays > 0 ? `→ ${c.deliveredDay}일 인도 (${c.lateDays}일 지연, 감액 ${usd(c.priceReductionMinor)})` : `→ ${c.deliveredDay}일 인도 (납기 내)`) : ''}`],
    [forwarding ? '서비스 대금' : '판매대금', c.status === 'CANCELLED' ? '청구 없음 (계약 취소)' : c.invoiceId ? (() => { const inv = view.invoices.find((i) => i.id === c.invoiceId)!; return `${usd(inv.amountMinor)} · ${inv.dueDay}일 결제 · ${inv.status === 'PAID' ? '수금 완료' : '미수'}`; })() : `${usd(c.saleAmountMinor)} (인도 후 청구)`],
  ];
  return `
  <div class="contract ${forwarding ? 'forwarding' : ''}">
    <h3><span class="kind ${forwarding ? 'kind-fwd' : 'kind-trade'}">${forwarding ? '운송 주선' : '직접 무역'}</span> ${c.id} · ${qtyKo(c.goodId, c.quantity)} ${cityName(config, c.originCityId)} → ${cityName(config, c.destinationCityId)}${state.contracts.some((x) => x.id === c.id) ? '' : ' <span class="pill">오늘 실행 예정</span>'}</h3>
    ${pipeline(c)}
    <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    <div class="actions-row">${actions.join('')}</div>
    <details><summary>이 계약의 돈 흐름 (${entries.length}건)</summary>
      <ul class="entries">${entries.map((e) => `<li><span>${e.day}일</span>${esc(e.reason)}<b>${e.lines.map((l) => `${accountKo(l.account)} ${l.amount > 0 ? '+' : '−'}${usd(Math.abs(l.amount))}`).join(' · ')}</b></li>`).join('')}</ul>
    </details>
  </div>`;
}

function closedContracts(): string {
  const closed = view.contracts.filter((c) => c.status === 'COMPLETED' || c.status === 'CANCELLED');
  if (!closed.length) return '';
  return `
  <details class="closed"><summary>종결된 계약 ${closed.length}건</summary>
    <ul class="entries">${closed.map((c) => {
      const r = contractReport(view, c);
      return `<li><span>${c.id}</span>${c.kind === 'FORWARDING' ? '운송 주선' : '직접 무역'} · ${qtyKo(c.goodId, c.quantity)} ${cityName(config, c.originCityId)} → ${cityName(config, c.destinationCityId)} · ${c.status === 'CANCELLED' ? '취소' : `${c.completedDay}일 수금`}<b>기여이익 ${r.contribution < 0 ? '−' : ''}${usd(Math.abs(r.contribution))}</b></li>`;
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
    const queued = decision && pending.some((p) => p.type === 'RESPOND_TO_DELAY' && p.noticeId === n.id);
    return `
    <div class="notice">
      <h3>⚠ ${n.titleKo} <small>${n.day}일 공지</small></h3>
      <p>${n.bodyKo}</p>
      <p class="muted small">근거: ${n.evidenceKo}</p>
      ${decision ? (queued ? '<span class="pill">현재 예약으로 대기 — 결정 예정</span>' : `
      <div class="choices">
        <button data-action="keep" data-notice="${n.id}" data-shipment="${decision.shipmentId}">현재 예약으로 대기<small>예약은 유지, 하역 재개까지 일정이 밀림. 납기를 넘기면 계약 조건대로 ${usd(config.terms.lateDeliveryPriceReductionMinor)} 감액</small></button>
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
    <h2 id="trade-h">거래·계약 <small>진행 중 ${active.length}건</small></h2>
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
  const crew = config.employees.map((e) => {
    const t = runningTaskOf(view, e.id);
    return `<li><b>${e.nameKo}</b> ${t ? `업무 중 — ${t.contractId} ${t.kind === 'EXPORT_PREP' ? '수출 준비' : '주선 준비'} ${t.progressWorkUnits}/${t.requiredWorkUnits}pt` : '<span class="ok">대기 — 배정 가능</span>'}<small>${cityName(config, view.employees.find((x) => x.id === e.id)?.locationCityId ?? null)} · 하루 ${e.workUnitsPerDay}pt</small></li>`;
  });
  const sailings = config.routes.flatMap((r) => listSailings(config, r.id, view.day).slice(0, 2)).sort((a, b) => a.departureDay - b.departureDay || a.id.localeCompare(b.id));
  const space = sailings.map((s) => {
    const load = sailingLoad(view, config, s);
    const on = view.bookings.filter((b) => b.sailingId === s.id && b.status !== 'CANCELLED').map((b) => b.contractId);
    return `<li><b>${s.id}</b> ${s.departureDay}일 출항 ${cityName(config, config.routes.find((r) => r.id === s.routeId)?.fromCityId ?? null)}→${cityName(config, config.routes.find((r) => r.id === s.routeId)?.toCityId ?? null)}
      <div class="meter">부피 ${bar(load.volumeLiters, load.capacityLiters)} ${fmtM3(load.volumeLiters)} / ${fmtM3(load.capacityLiters)}</div>
      <div class="meter">무게 ${bar(load.massGrams, load.capacityGrams)} ${fmtKg(load.massGrams)} / ${fmtKg(load.capacityGrams)}</div>
      <small>${on.length ? `실을 계약: ${on.join(', ')}` : '예약 없음'}</small></li>`;
  });
  return `
  <section class="panel resources" aria-labelledby="res-h">
    <h2 id="res-h">자원 예약 <small>오늘 할 일까지 반영 · 같은 돈·사람·공간을 두 번 쓰지 않습니다</small></h2>
    <h3>자금 (USD)</h3>
    <table class="money">
      <tr><th>현금</th><td>${usd(f.cash)}</td></tr>
      <tr><th>체결 계약의 남은 지출 예약</th><td>−${usd(f.reserved)}</td></tr>
      ${f.unpaidObligations ? `<tr><th>미지급</th><td>−${usd(f.unpaidObligations)}</td></tr>` : ''}
      <tr class="total"><th>사용 가능</th><td class="${f.available < 0 ? 'neg' : ''}">${usd(f.available)}</td></tr>
    </table>
    ${reservations.length ? `<ul class="reserve-list">${reservations.map((r) => `<li>${r.contractId} ${r.kind === 'FREIGHT' ? '운임 (예약 전)' : '관세 (도착 때)'} <b>${usd(r.amountMinor)}</b></li>`).join('')}</ul>` : '<p class="muted small">묶인 돈이 없습니다.</p>'}
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
  const p = r.payroll;
  const f = fundsPosition(state, config, config.tradeCurrency);
  const fwdOn = config.rules.forwardingEnabled;
  const why: string[] = [];
  if (t.accountsReceivable > 0) {
    const open = state.invoices.filter((i) => i.status !== 'PAID').sort((a, b) => a.dueDay - b.dueDay);
    why.push(`매출 ${usd(t.accountsReceivable)}은 이미 이익에 들어갔지만 현금은 나중에 들어옵니다 (매출채권: ${open.map((i) => `${i.contractId} ${i.dueDay}일 ${usd(i.amountMinor)}`).join(', ')}).`);
  }
  if (t.inventory > 0) why.push(`재고 ${r.inventoryUnits}개(${usd(t.inventory)})는 현금이 이미 나갔지만 팔기 전까지 비용이 아닙니다.`);
  if (t.prepaidFreight > 0) why.push(`선급운임 ${usd(t.prepaidFreight)}은 출항하면 상품 원가(직접 무역) 또는 주선 진행원가(운송 주선)가 됩니다.`);
  if (t.forwardingWip > 0) why.push(`주선 진행원가 ${usd(t.forwardingWip)}은 고객 화물을 실은 운임입니다. 인도해 서비스 매출을 올리는 날 비용이 됩니다.`);
  if (r.customerCargoUnits > 0) why.push(`맡은 고객 화물 ${r.customerCargoUnits}개는 고객 자산이라 위 표 어디에도 없습니다. 우리 몫은 서비스 대금뿐입니다.`);
  if (committedRule() && f.reserved > 0) why.push(`사용 가능 자금(${usd(f.available)})은 현금보다 ${usd(f.reserved + f.unpaidObligations)} 적습니다. 체결한 계약이 낼 운임·관세를 미리 묶어 두었기 때문입니다.`);
  if (!why.length) why.push('지금은 현금과 장부가 같은 이야기를 하고 있습니다. 거래를 진행하며 차이가 생기는 순간을 확인해 보세요.');
  const neg = (minor: number, fmt: (m: number) => string) => (minor === 0 ? fmt(0) : '−' + fmt(minor));
  const row = (k: string, v: string, cls = '') => `<tr class="${cls}"><th>${k}</th><td>${v}</td></tr>`;
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
        ${row('현금', krw(p.cash))}${row('누적 급여', neg(p.wageExpense, krw))}${row('미지급 급여', krw(p.accountsPayable))}
        <tr><td colspan="2" class="muted small">급여는 원화로 매일 지급하며 USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.</td></tr>
      </table>
    </div>
    <div class="why"><h3>현금과 이익이 다른 이유</h3><ul>${why.map((w) => `<li>${w}</li>`).join('')}</ul></div>
  </section>`;
}

function crewPanel(): string {
  const e0 = config.employees[0];
  return `
  <aside class="panel crew" aria-labelledby="crew-h">
    <h2 id="crew-h">동료 <small>${config.employees.length}명 고용 중</small></h2>
    <div class="crew-cards">${config.employees.map((e) => crewCard(e, view, selectedCard === e.id)).join('')}</div>
    <p class="muted small">처리량은 고정값(LEGACY_FIXED, 하루 ${e0?.workUnitsPerDay ?? 0}pt)만 씁니다. 능력·속성·레벨·시너지는 이후 M2a 단계(영입·성장)와 M2b에서 켭니다. 일급 ${krw(e0?.salaryPerDayMinor ?? 0)}.</p>
  </aside>`;
}

function commandLabel(c: Command): string {
  switch (c.type) {
    case 'ACCEPT_TRADE': {
      const buy = offerOf(config, c.buyOfferId);
      return `직접 무역 수락·매입 (${buy ? qtyKo(buy.goodId, buy.quantity) : c.buyOfferId})`;
    }
    case 'ACCEPT_FORWARDING': {
      const o = offerOf(config, c.offerId);
      return `운송 주선 수락 (${o ? qtyKo(o.goodId, o.quantity) : c.offerId})`;
    }
    case 'ASSIGN_TASK': {
      const t = view.tasks.find((x) => x.id === c.taskId);
      return `${t ? `${t.contractId} ${t.kind === 'EXPORT_PREP' ? '수출 준비' : '주선 준비'}` : c.taskId} → ${employeeName(c.employeeId)}`;
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
  const plan = planCommands(state, config, pending);
  return `
  <section class="panel queue" aria-labelledby="queue-h">
    <h2 id="queue-h">오늘 할 일 <small>${state.day}일 · 하루 진행 때 이 순서로 실행</small></h2>
    ${flash ? `<p class="flash ${flash.kind}" role="status">${esc(flash.text)}</p>` : ''}
    ${pending.length ? `<ol class="pending">${pending.map((c, i) => `<li class="${plan[i]?.status === 'APPLIED' ? '' : 'bad'}">${esc(commandLabel(c))}${plan[i]?.status !== 'APPLIED' ? ` — ${esc(plan[i]?.reasonKo ?? '')}` : ''}<button class="link" data-action="unqueue" data-index="${i}" aria-label="${esc(commandLabel(c))} 빼기">빼기</button></li>`).join('')}</ol>` : '<p class="muted">대기 중인 명령이 없습니다. 아무것도 하지 않고 하루를 보낼 수도 있습니다.</p>'}
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

function render() {
  view = planState(state, config, pending).state;
  const focused = document.activeElement as HTMLElement | null;
  const focusKey = focused?.dataset?.action ? `[data-action="${focused.dataset.action}"]${focused.dataset.contract ? `[data-contract="${focused.dataset.contract}"]` : ''}` : null;
  app.innerHTML = `
    ${topbar()}
    <main class="layout">
      ${worldMap()}
      ${crewPanel()}
      ${tradePanel()}
      ${resourcePanel()}
      ${queuePanel()}
      ${reportPanel()}
      ${logPanel()}
    </main>`;
  if (focusKey) app.querySelector<HTMLElement>(focusKey)?.focus();
}

// ── 이벤트 ──

app.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  const d = el.dataset;
  switch (d.action) {
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
      pending.splice(Number(d.index), 1);
      flash = null;
      return render();
    case 'map-mode':
      mapMode = d.mode === 'region' ? 'region' : 'route';
      return render();
    case 'select-card':
      selectedCard = selectedCard === d.emp ? null : (d.emp ?? null);
      return render();
    case 'restart':
      startScenario(config.id as ScenarioId);
      return render();
    case 'save':
      try {
        localStorage.setItem(SAVE_KEY, serializeSave(state));
        flash = { kind: 'info', text: `${state.day}일 상태를 이 브라우저에 저장했습니다. 대기 중인 명령은 저장하지 않습니다.` };
      } catch {
        flash = { kind: 'warn', text: '이 브라우저에서는 저장할 수 없습니다. ‘내보내기’로 파일을 받아 두세요.' };
      }
      return render();
    case 'load': {
      let text: string | null = null;
      try {
        text = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY);
      } catch {
        text = null;
      }
      return text ? loadText(text) : ((flash = { kind: 'warn', text: '저장된 상태가 없습니다.' }), render());
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
});

app.addEventListener('keydown', (ev) => {
  const el = ev.target as HTMLElement;
  if (el.dataset.action === 'select-card' && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault();
    selectedCard = selectedCard === el.dataset.emp ? null : (el.dataset.emp ?? null);
    render();
  }
});

app.addEventListener('change', async (ev) => {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  if (el.dataset.action === 'scenario') {
    startScenario(el.value as ScenarioId);
    render();
  } else if (el.dataset.action === 'import' && el instanceof HTMLInputElement && el.files?.[0]) {
    loadText(await el.files[0].text());
  }
});

function loadText(text: string) {
  try {
    const peek = JSON.parse(text) as { scenarioId?: string };
    if (!peek.scenarioId || !(SCENARIO_IDS as readonly string[]).includes(peek.scenarioId)) throw new SaveError('이 시제품의 시나리오 저장이 아닙니다.');
    const cfg = loadScenario(peek.scenarioId as ScenarioId);
    const loaded = deserializeSave(text, { dataVersion: cfg.dataVersion, rulesVersion: cfg.rules.rulesVersion });
    config = cfg;
    state = openDay(loaded, config).state;
    pending = [];
    flash = { kind: 'info', text: `${cfg.titleKo} ${state.day}일 상태를 불러왔습니다. 이미 공개된 사건은 다시 적용하지 않습니다.` };
  } catch (err) {
    flash = { kind: 'warn', text: err instanceof Error ? err.message : '불러오기에 실패했습니다.' };
  }
  render();
}

startScenario('SCENARIO_M2_MULTI_TRADE');
render();
