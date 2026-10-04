// M1 최소 화면: 견적·계약(UI_TRADE), 간단한 지도(UI_WORLD), 경영 보고(UI_REPORT), 직원 카드.
// 화면은 엔진 상태를 읽고 명령을 대기열에 넣을 뿐, 현금·재고를 따로 들고 있지 않다.

import './style.css';
import { M1_SCENARIO_IDS, loadM1Scenario, m1AssumptionNotes, type M1ScenarioId } from '../content/m1';
import { bookedSpace, cargoSpace, cityName, commitDay, createGame, listSailings, openDay, planCommands, planState } from '../engine/engine';
import { formatMoney } from '../engine/money';
import { companyReport, quotePreview } from '../engine/reports';
import { SaveError, deserializeSave, serializeSave } from '../engine/save';
import type { Command, CommandResult, Contract, GameState, ScenarioConfig } from '../engine/types';
import { crewCard } from './card';
import { MAP_ATTRIBUTION, renderWorldMap, type MapMode } from './map';

const SAVE_KEY = 'scitrade-m1-save';

let config: ScenarioConfig;
let state: GameState;
/** 대기 명령을 반영한 ‘오늘 실행 예정’ 사본. 거래 화면 표시에만 쓰고 보고·현금은 확정 상태(state)를 쓴다. */
let view: GameState;
let pending: Command[] = [];
let flash: { kind: 'info' | 'warn'; text: string } | null = null;
let cardSelected = false;
let mapMode: MapMode = 'route';
let commandSeq = 0;

const app = document.querySelector<HTMLDivElement>('#app')!;

function startScenario(id: M1ScenarioId) {
  config = loadM1Scenario(id);
  state = openDay(createGame(config), config).state;
  pending = [];
  flash = null;
}

function newId(type: string): string {
  commandSeq += 1;
  return `UI-${state.day}-${type}-${Date.now().toString(36)}-${commandSeq}`;
}

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const usd = (minor: number) => formatMoney(config.tradeCurrency, minor);
const krw = (minor: number) => formatMoney(config.payrollCurrency, minor);

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

const STAGES = ['견적', '체결·매입', '준비 배정', '수출 준비', '출발 대기', '운송', '도착·통관', '인도·채권', '수금·종결'];

function pipeline(c: Contract): string {
  if (c.status === 'CANCELLED') {
    return `<p class="pill warn">계약 취소됨 (${c.cancelledDay}일) — 상품은 회사 재고로 ${cityName(config, c.originCityId)}에 남음</p>`;
  }
  const current = stageOf(c);
  return `<ol class="pipeline">${STAGES.map(
    (label, i) => `<li class="${i < current ? 'done' : i === current ? 'now' : ''}" ${i === current ? 'aria-current="step"' : ''}>${label}</li>`,
  ).join('')}</ol>`;
}

function topbar(): string {
  const r = companyReport(state, config);
  const nextReceipt = state.invoices.find((i) => i.status !== 'PAID');
  const phaseText =
    state.phase === 'AWAITING_INPUT' ? '의사결정 중 · 시간 정지' : state.phase === 'ENDED' ? '캠페인 종료' : '다음 날 준비';
  return `
  <header class="topbar">
    <div class="brand"><span class="logo">Scitrade</span><span class="sub">M1 시제품 · DESIGN 가상값</span></div>
    <label class="scenario">시나리오
      <select data-action="scenario">
        ${M1_SCENARIO_IDS.map((id) => `<option value="${id}" ${id === config.id ? 'selected' : ''}>${loadM1Scenario(id).titleKo}</option>`).join('')}
      </select>
    </label>
    <div class="day"><b>${Math.min(state.day, config.campaignDays)}일</b> / ${config.campaignDays}<span>${phaseText}</span></div>
    <div class="stat"><span>거래 현금 (USD)</span><b>${usd(r.trade.cash)}</b></div>
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
  const sh = state.shipments.find((x) => x.arrivalDay === null);
  const status = sh
    ? state.day >= sh.scheduledArrivalDay
      ? `${sh.id} 대기 중 — 하역 재개를 기다림`
      : `${sh.id} 항해 중 · ${sh.scheduledArrivalDay}일 도착 예정`
    : '운항 중인 화물 없음';
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
    <p class="muted small">${config.route.id} · 운항 ${config.route.transitDays}일 · ${config.route.departureIntervalDays}일마다 출항 · 예약당 운임 ${usd(config.route.bookingFeeMinor)}. 항로선은 표시용이며 실제 항로 자료가 아닙니다. ${MAP_ATTRIBUTION}.</p>
  </section>`;
}

function offerPanel(): string {
  const offerOpen = view.offers.every((o) => o.status === 'OPEN');
  if (!offerOpen) return '';
  const firstSailing = listSailings(config, view.day + 1)[0];
  const q = quotePreview(config, view.day, firstSailing?.departureDay ?? view.day + 1);
  const accept: Command = { id: newId('ACCEPT'), type: 'ACCEPT_TRADE', buyOfferId: config.buyOffer.id, sellOfferId: config.sellOffer.id };
  const queued = pending.some((p) => p.type === 'ACCEPT_TRADE');
  const check = queued ? null : tryCommand(accept);
  const reporter = config.employees[0];
  return `
  <div class="offer">
    <p class="report-line">📋 <b>${reporter?.nameKo ?? '직원'}의 보고</b> — “${cityName(config, config.buyOffer.cityId)} 공급자가 ${config.good.nameKo} ${config.buyOffer.quantity}개를 내놨고, ${cityName(config, config.sellOffer.cityId)} 고객이 같은 수량을 원합니다. 납기 ${config.terms.deliveryDeadlineDay}일, 대금은 ${config.terms.paymentDueDay}일에 받습니다.”</p>
    <table class="money">
      <tr><th>매입 (${config.buyOffer.quantity}개 × ${usd(config.buyOffer.unitPriceMinor)})</th><td>−${usd(q.purchase)}</td></tr>
      <tr><th>운임 (선지급)</th><td>−${usd(q.freight)}</td></tr>
      <tr><th>관세 (가상 세율 ${config.terms.dutyRateBasisPoints / 100}% · 상품 송장 기준)</th><td>−${usd(q.duty)}</td></tr>
      <tr><th>판매 (${config.sellOffer.quantity}개 × ${usd(config.sellOffer.unitPriceMinor)})</th><td>+${usd(q.sale)}</td></tr>
      <tr class="total"><th>예상 기여이익 (급여 전)</th><td>${usd(q.contributionBeforePayroll)}</td></tr>
    </table>
    <details><summary>현금 일정 미리 보기 — 이익과 현금은 다른 날 움직입니다</summary>
      <ul class="schedule">${q.schedule.map((x) => `<li><span>${x.day}일</span>${x.labelKo}<b>${x.amount === 0 ? '현금 변화 없음' : (x.amount > 0 ? '+' : '−') + usd(Math.abs(x.amount))}</b></li>`).join('')}</ul>
      <p class="muted">가장 많이 묶이는 돈: ${usd(q.peakCashNeed)}. 지연·취소가 없다는 가정의 계산이며 결과를 보장하지 않습니다.</p>
    </details>
    <p class="muted">견적 유효: ${config.buyOffer.validUntilDay}일까지 · 모든 수치는 개발용 가상값(DESIGN)</p>
    ${queued ? '<p class="pill">오늘 할 일에 들어 있음</p>' : `<button class="primary" data-action="accept" ${check?.status !== 'APPLIED' ? 'disabled' : ''}>견적 수락</button>${check?.status !== 'APPLIED' ? `<p class="reason">${esc(check?.reasonKo ?? '')}</p>` : ''}`}
  </div>`;
}

function contractPanel(c: Contract): string {
  const lot = view.cargoLots.find((l) => l.id === c.cargoLotId);
  const task = view.tasks.find((t) => t.id === c.prepTaskId);
  const booking = c.bookingId ? view.bookings.find((b) => b.id === c.bookingId) : undefined;
  const shipment = view.shipments.find((s) => s.contractId === c.id);
  const owner = config.employees.find((e) => e.id === c.ownerEmployeeId);
  const entries = view.ledger.entries.filter((e) => e.contractId === c.id);
  const actions: string[] = [];
  const active = c.status === 'ACTIVE' || c.status === 'IN_PROGRESS';

  if (active && task?.status === 'QUEUED') {
    const emp = config.employees[0]!;
    const queued = pending.some((p) => p.type === 'ASSIGN_TASK' && p.taskId === task.id);
    const cmd: Command = { id: newId('ASSIGN'), type: 'ASSIGN_TASK', taskId: task.id, employeeId: emp.id };
    const check = queued ? null : tryCommand(cmd);
    actions.push(queued
      ? '<span class="pill">준비 업무 배정 예정</span>'
      : `<button data-action="assign" data-task="${task.id}" data-emp="${emp.id}" ${check?.status !== 'APPLIED' ? 'disabled' : ''}>${emp.nameKo}에게 수출 준비 맡기기 (${task.requiredWorkUnits}pt)</button>`);
  }
  if (active && (!booking || booking.status === 'CANCELLED') && !shipment) {
    const queued = pending.some((p) => p.type === 'BOOK_SAILING' && p.contractId === c.id);
    if (queued) {
      actions.push('<span class="pill">운송편 예약 예정</span>');
    } else {
      const options = listSailings(config, view.day + 1).slice(0, 3).map((s) => {
        const used = bookedSpace(view, s.id);
        const need = cargoSpace(config, c.quantity);
        const freeKg = config.route.capacityKg - used.massGrams / 1000;
        const cmd: Command = { id: newId('BOOK'), type: 'BOOK_SAILING', contractId: c.id, sailingId: s.id };
        const check = tryCommand(cmd);
        const late = s.scheduledArrivalDay > c.deliveryDeadlineDay;
        return `<button data-action="book" data-sailing="${s.id}" data-contract="${c.id}" ${check.status !== 'APPLIED' ? 'disabled' : ''} title="${esc(check.reasonKo)}">
          ${s.departureDay}일 출항 → ${s.scheduledArrivalDay}일 도착 예정${late ? ' ⚠ 납기 초과' : ''}<small>남은 공간 ${freeKg.toLocaleString('ko-KR')}kg · 이 화물 ${need.massGrams / 1000}kg</small></button>`;
      });
      actions.push(`<div class="sailings"><span>운송편 예약 (운임 ${usd(config.route.bookingFeeMinor)} 선지급)</span>${options.join('')}</div>`);
    }
  }
  if (active && booking?.status !== 'DEPARTED' && !shipment) {
    const queued = pending.some((p) => p.type === 'CANCEL_CONTRACT' && p.contractId === c.id);
    if (!queued) {
      const t = config.terms;
      actions.push(`<button class="danger" data-action="cancel" data-contract="${c.id}">출항 전 취소</button>
        <p class="muted small">취소하면: ${booking?.status === 'BOOKED' ? `운임 ${usd(t.preDepartureFreightRefundMinor)} 환급·취소비 ${usd(t.preDepartureCancellationFeeMinor)}, ` : ''}고객 보상 ${usd(t.customerCancellationCompensationMinor)}, 공급자 반품 없음 → 산 상품은 재고로 남습니다.</p>`);
    } else actions.push('<span class="pill warn">출항 전 취소 예정</span>');
  }

  const facts = [
    ['담당', owner ? `${owner.nameKo} (${owner.id})` : '미배정'],
    ['화물', lot ? `${config.good.nameKo} ${lot.quantity}개 · ${cityName(config, lot.locationCityId)} · 장부가액 ${usd(lot.status === 'DELIVERED' ? 0 : lot.carryingAmountMinor)}` : '-'],
    ['운송', shipment ? `${shipment.id} · ${shipment.departureDay}일 출항 · 도착 ${shipment.arrivalDay ?? `${shipment.scheduledArrivalDay}일 예정`}${shipment.observedWaitDays ? ` (항만 대기 ${shipment.observedWaitDays}일)` : ''}` : booking?.status === 'BOOKED' ? `${booking.sailingId} 예약됨` : '미예약'],
    ['납기', `${c.deliveryDeadlineDay}일 ${c.deliveredDay !== null ? (c.lateDays > 0 ? `→ ${c.deliveredDay}일 인도 (${c.lateDays}일 지연, 감액 ${usd(c.priceReductionMinor)})` : `→ ${c.deliveredDay}일 인도 (납기 내)`) : ''}`],
    ['대금', c.status === 'CANCELLED' ? '청구 없음 (계약 취소)' : c.invoiceId ? (() => { const inv = view.invoices.find((i) => i.id === c.invoiceId)!; return `${usd(inv.amountMinor)} · ${inv.dueDay}일 결제 · ${inv.status === 'PAID' ? '수금 완료' : '미수'}`; })() : `${usd(c.saleAmountMinor)} (인도 후 청구)`],
  ];
  return `
  <div class="contract">
    <h3>${c.id} · ${config.good.nameKo} ${cityName(config, c.originCityId)} → ${cityName(config, c.destinationCityId)}${state.contracts.some((x) => x.id === c.id) ? '' : ' <span class="pill">오늘 실행 예정</span>'}</h3>
    ${pipeline(c)}
    <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    <div class="actions-row">${actions.join('')}</div>
    <details><summary>이 계약의 돈 흐름 (${entries.length}건)</summary>
      <ul class="entries">${entries.map((e) => `<li><span>${e.day}일</span>${esc(e.reason)}<b>${e.lines.map((l) => `${accountKo(l.account)} ${l.amount > 0 ? '+' : '−'}${usd(Math.abs(l.amount))}`).join(' · ')}</b></li>`).join('')}</ul>
    </details>
  </div>`;
}

function accountKo(a: string): string {
  return ({
    CASH: '현금', INVENTORY: '재고', PREPAID_FREIGHT: '선급운임', ACCOUNTS_RECEIVABLE: '매출채권', ACCOUNTS_PAYABLE: '미지급금',
    REVENUE: '매출', COST_OF_GOODS_SOLD: '매출원가', CANCELLATION_EXPENSE: '취소비', WAGE_EXPENSE: '급여', OPENING_EQUITY: '자본',
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
        <button disabled>대체편 예약<small>M1에는 대체 노선이 없습니다 (M3 예정)</small></button>
        <button disabled>고객과 납기 협상<small>계약 변경 협상은 M3 사건 시스템에서 구현합니다</small></button>
      </div>`) : '<p class="pill">대응 결정 완료: 현재 예약으로 대기</p>'}
    </div>`;
  }).join('');
}

function tradePanel(): string {
  return `
  <section class="panel trade" aria-labelledby="trade-h">
    <h2 id="trade-h">거래·계약</h2>
    ${delayPanel()}
    ${offerPanel()}
    ${view.contracts.map(contractPanel).join('')}
    ${!view.contracts.length && view.offers.some((o) => o.status === 'EXPIRED') ? '<p class="muted">견적이 만료되었습니다. ‘처음부터’로 다시 시작할 수 있습니다.</p>' : ''}
  </section>`;
}

function reportPanel(): string {
  const r = companyReport(state, config);
  const t = r.trade;
  const p = r.payroll;
  const why: string[] = [];
  if (t.accountsReceivable > 0) {
    const inv = state.invoices.find((i) => i.status !== 'PAID');
    why.push(`매출 ${usd(t.accountsReceivable)}은 이미 이익에 들어갔지만 현금은 ${inv?.dueDay ?? '?'}일에 들어옵니다 (매출채권).`);
  }
  if (t.inventory > 0) why.push(`재고 ${r.inventoryUnits}개(${usd(t.inventory)})는 현금이 이미 나갔지만 팔기 전까지 비용이 아닙니다.`);
  if (t.prepaidFreight > 0) why.push(`선급운임 ${usd(t.prepaidFreight)}은 출항하면 상품 원가에 더해집니다.`);
  if (!why.length) why.push('지금은 현금과 장부가 같은 이야기를 하고 있습니다. 거래를 진행하며 차이가 생기는 순간을 확인해 보세요.');
  const neg = (minor: number, fmt: (m: number) => string) => (minor === 0 ? fmt(0) : '−' + fmt(minor));
  const row = (k: string, v: string, cls = '') => `<tr class="${cls}"><th>${k}</th><td>${v}</td></tr>`;
  return `
  <section class="panel report" aria-labelledby="report-h">
    <h2 id="report-h">경영 보고</h2>
    <div class="books">
      <table class="money"><caption>거래 장부 · USD</caption>
        ${row('현금', usd(t.cash))}${row(`재고 (${r.inventoryUnits}개)`, usd(t.inventory))}${row('선급운임', usd(t.prepaidFreight))}${row('매출채권', usd(t.accountsReceivable))}${row('자산 합계', usd(t.totalAssets), 'total')}
        ${row('매출', usd(t.revenue))}${row('매출원가', neg(t.costOfGoodsSold, usd))}${row('취소비', neg(t.cancellationExpense, usd))}${row('거래 손익', usd(t.profit), 'total')}
      </table>
      <table class="money"><caption>운영 장부 · KRW</caption>
        ${row('현금', krw(p.cash))}${row('누적 급여', neg(p.wageExpense, krw))}${row('미지급 급여', krw(p.accountsPayable))}
        <tr><td colspan="2" class="muted small">급여는 원화로 매일 지급하며 USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 M1 보고에 쓰지 않습니다.</td></tr>
      </table>
    </div>
    <div class="why"><h3>현금과 이익이 다른 이유</h3><ul>${why.map((w) => `<li>${w}</li>`).join('')}</ul></div>
  </section>`;
}

function crewPanel(): string {
  return `
  <aside class="panel crew" aria-labelledby="crew-h">
    <h2 id="crew-h">동료</h2>
    ${config.employees.map((e) => crewCard(e, view, cardSelected)).join('')}
    <p class="muted small">M1은 기존 처리량(하루 ${config.employees[0]?.workUnitsPerDay ?? 0}pt)만 씁니다. 능력·속성·레벨·시너지는 M2a/M2b에서 켭니다. 일급 ${krw(config.employees[0]?.salaryPerDayMinor ?? 0)}.</p>
  </aside>`;
}

function queuePanel(): string {
  const plan = planCommands(state, config, pending);
  const label = (c: Command) => ({
    ACCEPT_TRADE: '견적 수락·매입',
    ASSIGN_TASK: '수출 준비 배정',
    BOOK_SAILING: `운송편 예약 (${'sailingId' in c ? c.sailingId : ''})`,
    CANCEL_CONTRACT: '출항 전 취소',
    RESPOND_TO_DELAY: '지연 대응: 현재 예약으로 대기',
  })[c.type];
  return `
  <section class="panel queue" aria-labelledby="queue-h">
    <h2 id="queue-h">오늘 할 일 <small>${state.day}일 · 하루 진행 때 이 순서로 실행</small></h2>
    ${flash ? `<p class="flash ${flash.kind}" role="status">${esc(flash.text)}</p>` : ''}
    ${pending.length ? `<ol class="pending">${pending.map((c, i) => `<li class="${plan[i]?.status === 'APPLIED' ? '' : 'bad'}">${label(c)}${plan[i]?.status !== 'APPLIED' ? ` — ${esc(plan[i]?.reasonKo ?? '')}` : ''}<button class="link" data-action="unqueue" data-index="${i}" aria-label="${label(c)} 빼기">빼기</button></li>`).join('')}</ol>` : '<p class="muted">대기 중인 명령이 없습니다. 아무것도 하지 않고 하루를 보낼 수도 있습니다.</p>'}
  </section>`;
}

function logPanel(): string {
  const items = [...state.log].reverse().slice(0, 40);
  return `
  <section class="panel log" aria-labelledby="log-h">
    <h2 id="log-h">기록</h2>
    <ul>${items.map((l) => `<li><span>${l.day}일</span>${esc(l.textKo)}</li>`).join('') || '<li class="muted">아직 기록이 없습니다.</li>'}</ul>
    <details class="muted small"><summary>이 시제품이 가정한 값</summary><ul>${m1AssumptionNotes(config.id as M1ScenarioId).map((n) => `<li>${esc(n)}</li>`).join('')}</ul></details>
  </section>`;
}

function render() {
  view = planState(state, config, pending).state;
  const focusedAction = (document.activeElement as HTMLElement | null)?.dataset?.action;
  app.innerHTML = `
    ${topbar()}
    <main class="layout">
      ${worldMap()}
      ${crewPanel()}
      ${tradePanel()}
      ${queuePanel()}
      ${reportPanel()}
      ${logPanel()}
    </main>`;
  if (focusedAction) app.querySelector<HTMLElement>(`[data-action="${focusedAction}"]`)?.focus();
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
      return queue({ id: newId('ACCEPT'), type: 'ACCEPT_TRADE', buyOfferId: config.buyOffer.id, sellOfferId: config.sellOffer.id });
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
      cardSelected = !cardSelected;
      return render();
    case 'restart':
      startScenario(config.id as M1ScenarioId);
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
        text = localStorage.getItem(SAVE_KEY);
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
    cardSelected = !cardSelected;
    render();
  }
});

app.addEventListener('change', async (ev) => {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  if (el.dataset.action === 'scenario') {
    startScenario(el.value as M1ScenarioId);
    render();
  } else if (el.dataset.action === 'import' && el instanceof HTMLInputElement && el.files?.[0]) {
    loadText(await el.files[0].text());
  }
});

function loadText(text: string) {
  try {
    const peek = JSON.parse(text) as { scenarioId?: string };
    if (!peek.scenarioId || !(M1_SCENARIO_IDS as readonly string[]).includes(peek.scenarioId)) throw new SaveError('M1 시나리오의 저장이 아닙니다.');
    const cfg = loadM1Scenario(peek.scenarioId as M1ScenarioId);
    const loaded = deserializeSave(text, { dataVersion: cfg.dataVersion });
    config = cfg;
    state = openDay(loaded, config).state;
    pending = [];
    flash = { kind: 'info', text: `${state.day}일 상태를 불러왔습니다. 이미 공개된 사건은 다시 적용하지 않습니다.` };
  } catch (err) {
    flash = { kind: 'warn', text: err instanceof Error ? err.message : '불러오기에 실패했습니다.' };
  }
  render();
}

startScenario('SCENARIO_M1_ONE_TRADE');
render();
