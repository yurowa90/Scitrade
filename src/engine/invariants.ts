// 매일 마감 전에 검사하는 불변 조건. 실패는 게임 규칙 위반이 아니라 엔진 결함이다.

import { balance } from './ledger';
import type { Currency } from './money';
import type { GameState, ScenarioConfig } from './types';

export class InvariantError extends Error {}

export function checkInvariants(s: GameState, config: ScenarioConfig): void {
  const problems: string[] = [];
  const currencies = new Set<Currency>(s.ledger.entries.map((e) => e.currency));

  for (const entry of s.ledger.entries) {
    const sum = entry.lines.reduce((acc, l) => acc + l.amount, 0);
    if (sum !== 0) problems.push(`분개 ${entry.id} 불균형 (${sum})`);
  }

  for (const c of currencies) {
    const cash = balance(s.ledger, c, 'CASH');
    if (cash < 0) problems.push(`${c} 현금이 음수입니다 (${cash})`);

    const inventory = balance(s.ledger, c, 'INVENTORY');
    const lotTotal = s.cargoLots
      .filter((l) => l.currency === c && l.status !== 'DELIVERED')
      .reduce((acc, l) => acc + l.carryingAmountMinor, 0);
    if (inventory !== lotTotal) problems.push(`${c} 재고 장부(${inventory})와 화물 장부가액 합계(${lotTotal})가 다릅니다`);

    const prepaid = balance(s.ledger, c, 'PREPAID_FREIGHT');
    const bookedPrepaid = s.bookings
      .filter((b) => b.status === 'BOOKED' && config.route.currency === c)
      .reduce((acc, b) => acc + b.prepaidFreightMinor, 0);
    if (prepaid !== bookedPrepaid) problems.push(`${c} 선급운임(${prepaid})과 출항 전 예약 합계(${bookedPrepaid})가 다릅니다`);

    const receivable = balance(s.ledger, c, 'ACCOUNTS_RECEIVABLE');
    const openInvoices = s.invoices
      .filter((i) => i.currency === c && i.status !== 'PAID')
      .reduce((acc, i) => acc + i.amountMinor, 0);
    if (receivable !== openInvoices) problems.push(`${c} 매출채권(${receivable})과 미수 청구서 합계(${openInvoices})가 다릅니다`);

    const payable = balance(s.ledger, c, 'ACCOUNTS_PAYABLE');
    const openObligations = s.obligations
      .filter((o) => o.currency === c && o.paidDay === null)
      .reduce((acc, o) => acc + o.amountMinor, 0);
    if (payable !== openObligations) problems.push(`${c} 미지급금(${payable})과 미지급 의무 합계(${openObligations})가 다릅니다`);
  }

  for (const lot of s.cargoLots) {
    if (!Number.isInteger(lot.quantity) || lot.quantity <= 0) problems.push(`${lot.id} 수량 오류 (${lot.quantity})`);
  }
  const departed = new Set<string>();
  for (const b of s.bookings) {
    if (b.status !== 'DEPARTED') continue;
    if (departed.has(b.contractId)) problems.push(`${b.contractId}이(가) 두 번 출항했습니다`);
    departed.add(b.contractId);
  }

  if (problems.length > 0) {
    throw new InvariantError(`${s.day}일 마감 검사 실패:\n- ${problems.join('\n- ')}`);
  }
}
