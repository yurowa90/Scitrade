import { formatMoney } from '../engine/money';
import { contractProgress, type BlockerCode } from '../engine/progress';
import { fundsPosition } from '../engine/reservations';
import { cityName, goodOf, unitKo } from '../engine/catalog';
import type { WorkloadSummary } from '../engine/capacity';
import type { Currency } from '../engine/money';
import type { CompanyReport, CurrencyStanding, UpcomingPayment, UpcomingPaymentKind } from '../engine/reports';
import type { GameState, ScenarioConfig } from '../engine/types';
import { esc } from './html';

export function krwReportRows(report: CompanyReport, config: ScenarioConfig): string {
  const p = report.payroll;
  const rows: [string, number][] = [
    ['시작 운영 자금', p.openingEquity], ['급여', -p.wageExpense],
    ...(config.recruitment || config.growth ? [['영입 계약금', -p.recruitmentExpense], ['훈련비', -p.trainingExpense]] as [string, number][] : []),
    ...(config.culture ? [['현지 활동비', -p.cultureExpense]] as [string, number][] : []),
    ['운영 손익', p.profit], ['미지급 급여', p.accountsPayable], ['현금', p.cash],
  ];
  return rows.map(([label, amount]) => `<tr><th>${label}</th><td>${esc(formatMoney(config.payrollCurrency, amount))}</td></tr>`).join('');
}

export const KRW_REPORT_NOTE_KO = '급여는 원화로 매일 지급하며 계약금·훈련비는 한 번 내는 원화 비용입니다. USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.';
export const KRW_REPORT_NOTE_CULTURE_KO = '급여는 원화로 매일 지급하며 계약금·훈련비·현지 활동비는 한 번 내는 원화 비용입니다. USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.';

export function krwReportNoteKo(config: ScenarioConfig): string {
  if (config.culture) return KRW_REPORT_NOTE_CULTURE_KO;
  return config.recruitment || config.growth ? KRW_REPORT_NOTE_KO
    : '급여는 원화로 매일 지급합니다. USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.';
}

export function rateKo(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const fraction = basisPoints % 100;
  return `${whole}${fraction ? `.${String(fraction).padStart(2, '0')}` : ''}%`;
}

export function qtyKo(config: ScenarioConfig, goodId: string, quantity: number): string {
  const good = goodOf(config, goodId);
  return `${good.nameKo} ${quantity.toLocaleString('ko-KR')}${unitKo(good)}`;
}

/** 회사 보고와 같은 보유 기준으로 품목별 수량을 읽는다. */
export function heldCargoByGood(s: GameState, config: ScenarioConfig, owner: 'COMPANY' | 'CUSTOMER') {
  return config.goods.flatMap((good) => {
    const quantity = s.cargoLots.filter((lot) => lot.owner === owner && lot.goodId === good.id
      && lot.status !== 'DELIVERED' && lot.status !== 'RETURNED_TO_OWNER').reduce((sum, lot) => sum + lot.quantity, 0);
    return quantity ? [{ goodId: good.id, quantity }] : [];
  });
}

export function cargoListKo(config: ScenarioConfig, items: { goodId: string; quantity: number }[]): string {
  return items.map((item) => qtyKo(config, item.goodId, item.quantity)).join(' · ') || '없음';
}

export function upcomingSummary(rows: UpcomingPayment[], config: ScenarioConfig): {
  currencies: Currency[];
  lines: { kind: UpcomingPaymentKind; labelKo: string; amounts: (number | null)[] }[];
  undated: number;
} {
  const currencies = [...new Set([config.tradeCurrency, config.payrollCurrency, ...rows.map((r) => r.currency).sort()])];
  const labels: [UpcomingPaymentKind, string][] = [
    ['OVERDUE', '밀린 지급 (현금이 들어오면 먼저 갚음)'], ['WAGE', '급여 (하루 진행 때 자동)'],
    ['FREIGHT', '운임 (운송편을 예약할 때)'], ['DUTY', '관세 (도착할 때 자동)'],
  ];
  return { currencies, lines: labels.map(([kind, labelKo]) => ({ kind, labelKo,
    amounts: currencies.map((currency) => {
      const matching = rows.filter((r) => r.kind === kind && r.currency === currency);
      return matching.length ? matching.reduce((sum, r) => sum + r.amountMinor, 0) : null;
    }),
  })), undated: rows.filter((r) => r.day === null).length };
}

export function workloadLinesKo(summary: WorkloadSummary, config: ScenarioConfig): string[] {
  const lines = summary.byCity.map((row) => {
    const { unassignedWorkUnits: u, runningWorkUnits: r, staffWorkUnitsPerDay: staff,
      dayTaskWorkUnitsPerDay: dayTask, idleWorkUnitsPerDay: idle, daysToClear } = row;
    const end = daysToClear === 0 ? '남은 업무 없음' : daysToClear === null ? '지금 이 업무를 처리할 사람이 없음' : `약 ${daysToClear}일`;
    return `${cityName(config, row.cityId)}: 남은 업무 ${u + r}pt(배정 전 ${u}pt · 진행 중 ${r}pt), 하루 처리 ${staff - dayTask}pt${dayTask ? `(훈련·현지 활동 중 ${dayTask}pt 빼고)` : ''} → ${end}. 지금 바로 맡길 수 있는 처리량 하루 ${idle}pt.`;
  });
  for (const row of summary.startingLater) lines.push(`${config.employees.find((e) => e.id === row.employeeId)!.nameKo}: ${row.availableFromDay}일부터 근무(하루 ${row.workUnitsPerDay}pt).`);
  return lines.length ? lines : ['직원과 남은 업무가 없습니다.'];
}

export type BottleneckKind = '돈' | '시간' | '사람' | '선복';
export const BOTTLENECK_OF: Record<BlockerCode, BottleneckKind | null> = {
  TASK_UNASSIGNED: '사람', TASK_WILL_MISS_SAILING: '사람', NO_BOOKING: '선복', NO_SAILING_LEFT: '선복',
  NEXT_SAILING_LATE: '시간', BOOKED_SAILING_LATE: '시간', WAITING_PORT_RESTRICTION: '시간',
  DUTY_UNPAID: '돈', AWAITING_PAYMENT: null,
};

export function bottlenecks(s: GameState, config: ScenarioConfig): {
  kind: BottleneckKind; items: { contractId: string | null; textKo: string }[];
}[] {
  const groups = (['돈', '시간', '사람', '선복'] as const).map((kind) => ({ kind,
    items: [] as { contractId: string | null; textKo: string }[] }));
  for (const currency of new Set([config.tradeCurrency, config.payrollCurrency])) {
    const unpaid = fundsPosition(s, config, currency).unpaidObligations;
    if (unpaid > 0) groups[0]!.items.push({ contractId: null,
      textKo: `미지급 ${formatMoney(currency, unpaid)}이 있습니다. 현금이 들어오면 먼저 갚습니다.` });
  }
  const available = fundsPosition(s, config, config.tradeCurrency).available;
  if (config.rules.fundsCheck === 'COMMITTED_OUTLAYS' && available < 0) groups[0]!.items.push({ contractId: null,
    textKo: `사용 가능 자금이 ${formatMoney(config.tradeCurrency, available)}입니다. 체결한 계약의 운임·관세 예약이 현금보다 많습니다.` });
  for (const c of s.contracts) for (const blocker of contractProgress(s, config, c).blockers) {
    const kind = BOTTLENECK_OF[blocker.code];
    if (blocker.severity !== 'info' && kind !== null) groups.find((g) => g.kind === kind)!.items.push({ contractId: c.id, textKo: blocker.messageKo });
  }
  return groups;
}

export function settlementRows(st: CurrencyStanding, config: ScenarioConfig): [string, number, boolean][] {
  const rows: [string, number, boolean][] = [['현금', st.cash, false]];
  for (const [label, value] of [['재고', st.inventory], ['선급운임', st.prepaidFreight],
    ['주선 진행원가', st.forwardingWip], ['매출채권', st.accountsReceivable]] as [string, number][]) {
    if (st.currency === config.tradeCurrency || value !== 0) rows.push([label, value, false]);
  }
  rows.push(['자산 합계', st.totalAssets, true], ['미지급금', st.accountsPayable, false],
    ['순자산 (자산 − 미지급금)', st.netAssets, true], ['시작 자본', st.openingEquity, false], ['손익', st.profit, false]);
  if (st.currency === config.tradeCurrency || st.contractContribution !== 0) rows.push(['계약 기여이익 합계', st.contractContribution, false]);
  return rows;
}
