// 규칙 2 화면은 계획 상태의 읽기 함수가 돌려준 금액과 예측만 표시한다.
import { cityName, goodOf } from '../engine/catalog';
import { marketTable } from '../engine/market';
import { formatMoney } from '../engine/money';
import { paymentDefaultStatus } from '../engine/operations';
import { payrollRunwayDay } from '../engine/previews';
import { exchangePreview, type OperationsQuotePreview } from '../engine/readers';
import { fmtM3 } from '../engine/reservations';
import type { Contract, ExchangeDirection, GameState, ScenarioConfig } from '../engine/types';
import { payrollRunwayKo } from './growth';
import { esc } from './html';
import { qtyKo } from './reports';

export function counterpartyNameKo(config: ScenarioConfig, id: string): string {
  return config.operations?.market.counterparties.find((p) => p.id === id)?.nameKo ?? '거래처';
}

export function marketBlock(view: GameState, config: ScenarioConfig): string {
  return `<section class="market-table" aria-labelledby="market-h"><h3 id="market-h">시세표</h3><p class="muted small">지수는 돈이 아닙니다</p><div class="table-scroll"><table class="money"><thead><tr><th>도시 · 상품 · 매수/매도</th><th>기준가 (USD/단위)</th><th>지수</th><th>관측</th><th>다음 관측</th><th>견적</th></tr></thead><tbody>${marketTable(view, config).map((r) => `<tr><th>${esc(cityName(config, r.cityId))} · ${esc(goodOf(config, r.goodId).nameKo)} · ${r.side === 'BUY' ? '매수' : '매도'}</th><td>${formatMoney(r.currency, r.basePriceMinor)}/단위</td><td>${r.indexPoints}</td><td>${r.observedDay}일 · ${r.ageDays}일 전 관측</td><td>${r.nextObservationDay === null ? '새 관측 없음' : `${r.nextObservationDay}일`}</td><td>${r.hasQuoteInBatch ? '이번 묶음 견적 있음' : '—'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

/** 계약 카드 제목과 같은 종류·번호·화물·항로 문구. */
export function contractTitleKo(c: Contract, config: ScenarioConfig): string {
  return `${c.kind === 'FORWARDING' ? '운송 주선' : '직접 무역'} ${c.id} · ${qtyKo(config, c.goodId, c.quantity)} ${cityName(config, c.originCityId)} → ${cityName(config, c.destinationCityId)}`;
}

export function quantityControl(key: string, q: OperationsQuotePreview, config: ScenarioConfig, goodId: string, minimum: number): string {
  const options: string[] = [];
  for (let n = minimum; n <= q.maxQuantity; n += q.quantityStep) {
    options.push(`<option value="${n}"${n === q.quantity ? ' selected' : ''}>${esc(qtyKo(config, goodId, n))}</option>`);
  }
  return `<label>수량 고르기 <select data-action="offer-quantity" data-key="${esc(key)}">${options.join('')}</select></label>`;
}

export function operationsQuoteFacts(q: OperationsQuotePreview, view: GameState, config: ScenarioConfig): string[] {
  const facts = [`준비 ${q.prepWorkUnits}pt`, `부피 ${fmtM3(q.volumeLiters)}`, `보관 후 사용량/한도 ${fmtM3(q.storageAfterLiters)} / ${fmtM3(q.storageCapacityLiters)}`];
  if (q.serviceClass === 'HANDLING') {
    facts[0] = `준비 ${q.prepWorkUnits}pt — 직원 시간이 많이 듭니다`;
    facts.push(`준비 1pt당 기여이익 ${formatMoney('USD', q.contributionPerPrepPtMinor)}`);
  }
  if (q.lateDeliveryReductionMinor > 0 && q.arrivalDay !== null) {
    const days = q.arrivalDay + config.terms.customsDays - q.deliveryDeadlineDay;
    const cap = config.terms.lateDeliveryCapBasisPoints;
    const limit = cap === 10_000 ? '계약 금액' : `계약 금액의 ${(cap ?? 0) / 100}%`;
    facts.push(`납기 ${days}일 늦으면 하루 ${formatMoney('USD', config.terms.lateDeliveryPriceReductionMinor)}씩, 최대 ${limit}까지 감액됩니다 — 이 계획으로는 ${formatMoney('USD', q.lateDeliveryReductionMinor)}`);
  }
  for (const affected of q.affectedContracts.filter((c) => c.missesSailing)) {
    const contract = view.contracts.find((c) => c.id === affected.contractId)!;
    facts.push(`${contractTitleKo(contract, config)} — 이 견적을 받으면 출항을 놓칩니다`);
  }
  if (q.arrivalDay !== null && q.arrivalDay > config.campaignDays) {
    facts.push(`${config.campaignDays}일 캠페인 안에 인도되지 않습니다. 결산에 미인도로 남습니다.`);
  } else if (q.arrivalDay === null && q.allowed) facts.push('실을 출항편이 아직 정해지지 않았습니다');
  return facts;
}

export function exchangeBlock(view: GameState, config: ScenarioConfig, direction: ExchangeDirection, usdMinor: number): string {
  const q = exchangePreview(view, config, direction, usdMinor), fx = config.operations!.fx;
  const usd = (n: number) => formatMoney('USD', n), krw = (n: number) => formatMoney('KRW', n);
  const runway = (n: number | null) => payrollRunwayKo(n, view.day, config.campaignDays);
  return `<section class="exchange" aria-labelledby="exchange-h"><h3 id="exchange-h">환전</h3><p>게임용 고정 환율 ${fx.buyKrwPerUsd.toLocaleString('ko-KR')}원(받을 때) · ${fx.sellKrwPerUsd.toLocaleString('ko-KR')}원(살 때)</p><label>방향 <select data-action="exchange-direction"><option value="USD_TO_KRW"${direction === 'USD_TO_KRW' ? ' selected' : ''}>USD→KRW</option><option value="KRW_TO_USD"${direction === 'KRW_TO_USD' ? ' selected' : ''}>KRW→USD</option></select></label> <label>금액 (100 USD 단계) <input type="number" data-action="exchange-amount" min="${fx.lotUsdMinor / 100}" step="${fx.lotUsdMinor / 100}" value="${usdMinor / 100}" /></label><dl><dt>내는 금액</dt><dd>${direction === 'USD_TO_KRW' ? usd(usdMinor) : krw(q.krwMinor)}</dd><dt>받는 금액</dt><dd>${direction === 'USD_TO_KRW' ? krw(q.krwMinor) : usd(usdMinor)}</dd><dt>차감</dt><dd>${krw(q.spreadKrwMinor)}</dd><dt>쓸 수 있는 USD (전 → 후)</dt><dd>${usd(q.usdAvailableBefore)} → ${usd(q.usdAvailableAfter)}</dd><dt>원화 급여 가능일 (임차료 포함, 전 → 후)</dt><dd>${runway(q.runwayBefore)} → ${runway(q.runwayAfter)}</dd></dl><p>자동 환전은 없습니다</p>${q.warningKo ? `<p class="reason">${esc(q.warningKo)}</p>` : ''}${q.reasonKo ? `<p class="reason">${esc(q.reasonKo)}</p>` : ''}<button data-action="exchange">환전을 오늘 할 일에 넣기</button></section>`;
}

export function paymentStatusKo(view: GameState, config: ScenarioConfig): string {
  const status = paymentDefaultStatus(view, config);
  if (status.level === 'NONE') return '지급 정상';
  if (status.level === 'FAILED') return '경영 실패';
  const stage = status.level === 'WARNING' ? '경고' : '위험';
  const remaining = Math.max(0, status.failAtCloseOfDay! - view.day);
  return `${stage} · 실패까지 ${remaining}일${status.failAtCloseOfDay! > config.campaignDays ? ` · ${config.campaignDays}일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다` : ''}`;
}

export function operationsTopbar(view: GameState, config: ScenarioConfig): string {
  return `<div class="stat"><span>원화 급여 가능일 (임차료 포함 · 오늘 할 일 반영)</span><b>${payrollRunwayKo(payrollRunwayDay(view, config), view.day, config.campaignDays)}</b></div><div class="stat"><span>지급 상태 (오늘 할 일 반영)</span><b>${esc(paymentStatusKo(view, config))}</b></div>`;
}
