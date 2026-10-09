import { formatMoney } from '../engine/money';
import type { CompanyReport } from '../engine/reports';
import type { ScenarioConfig } from '../engine/types';
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
