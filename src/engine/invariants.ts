// 매일 마감 전에 검사하는 불변 조건. 실패는 게임 규칙 위반이 아니라 엔진 결함이다.

import { findSailing, routeOf } from './catalog';
import { isEmployed } from './employees';
import { balance } from './ledger';
import type { Currency } from './money';
import { sailingLoad } from './reservations';
import type { GameState, ScenarioConfig } from './types';

export class InvariantError extends Error {}

export function checkInvariants(s: GameState, config: ScenarioConfig): void {
  const problems: string[] = [];
  const currencies = new Set<Currency>(s.ledger.entries.map((e) => e.currency));
  const kindOf = (contractId: string) => s.contracts.find((c) => c.id === contractId)?.kind;

  for (const entry of s.ledger.entries) {
    const sum = entry.lines.reduce((acc, l) => acc + l.amount, 0);
    if (sum !== 0) problems.push(`분개 ${entry.id} 불균형 (${sum})`);
  }

  for (const c of currencies) {
    const cash = balance(s.ledger, c, 'CASH');
    if (cash < 0) problems.push(`${c} 현금이 음수입니다 (${cash})`);

    // 회사 재고 장부는 회사 소유 화물만 담는다. 고객 화물은 장부가액이 없다.
    const inventory = balance(s.ledger, c, 'INVENTORY');
    const lotTotal = s.cargoLots
      .filter((l) => l.owner === 'COMPANY' && l.currency === c && l.status !== 'DELIVERED')
      .reduce((acc, l) => acc + l.carryingAmountMinor, 0);
    if (inventory !== lotTotal) problems.push(`${c} 재고 장부(${inventory})와 회사 화물 장부가액 합계(${lotTotal})가 다릅니다`);

    const prepaid = balance(s.ledger, c, 'PREPAID_FREIGHT');
    const bookedPrepaid = s.bookings
      .filter((b) => b.status === 'BOOKED' && routeOf(config, b.routeId).currency === c)
      .reduce((acc, b) => acc + b.prepaidFreightMinor, 0);
    if (prepaid !== bookedPrepaid) problems.push(`${c} 선급운임(${prepaid})과 출항 전 예약 합계(${bookedPrepaid})가 다릅니다`);

    // 주선 진행원가 = 출항했지만 아직 인도하지 않은 운송 주선 화물의 운임.
    const wip = balance(s.ledger, c, 'FORWARDING_WIP');
    const inFlight = s.bookings
      .filter((b) => b.status === 'DEPARTED' && routeOf(config, b.routeId).currency === c && kindOf(b.contractId) === 'FORWARDING')
      .filter((b) => s.contracts.find((x) => x.id === b.contractId)?.deliveredDay === null)
      .reduce((acc, b) => acc + b.prepaidFreightMinor, 0);
    if (wip !== inFlight) problems.push(`${c} 주선 진행원가(${wip})와 운송 중인 고객 화물 운임 합계(${inFlight})가 다릅니다`);

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
    if (lot.owner === 'CUSTOMER' && lot.carryingAmountMinor !== 0) problems.push(`${lot.id} 고객 화물에 회사 장부가액이 있습니다`);
  }
  const departed = new Set<string>();
  const sailings = new Set<string>();
  for (const b of s.bookings) {
    if (b.status !== 'CANCELLED') sailings.add(b.sailingId);
    if (b.status !== 'DEPARTED') continue;
    if (departed.has(b.contractId)) problems.push(`${b.contractId}이(가) 두 번 출항했습니다`);
    departed.add(b.contractId);
  }
  for (const id of sailings) {
    const sailing = findSailing(config, id);
    if (!sailing) {
      problems.push(`${id}: 운항표에 없는 출항편 예약`);
      continue;
    }
    const load = sailingLoad(s, config, sailing);
    if (load.massGrams > load.capacityGrams || load.volumeLiters > load.capacityLiters) {
      problems.push(`${id}: 예약 화물이 선복 한도를 넘었습니다`);
    }
  }
  for (const emp of s.employees) {
    const running = s.tasks.filter((t) => t.status === 'RUNNING' && t.assignedEmployeeId === emp.id);
    if (running.length && (!isEmployed(s, emp.id) || emp.availableFromDay > s.day)) {
      problems.push(`${emp.id}: 근무 가능한 고용 직원이 아닌데 진행 중 업무가 있습니다`);
    }
    const wages = s.ledger.entries.filter((e) => /^WAGE-D\d+-/.test(e.id) && e.id.endsWith(`-${emp.id}`));
    if (!isEmployed(s, emp.id) && wages.length) problems.push(`${emp.id}: 미고용 직원의 급여 기록`);
    if (wages.some((e) => e.day < emp.availableFromDay)) problems.push(`${emp.id}: 근무 시작일 이전 급여 기록`);
    if (running.length > 1) {
      problems.push(`${emp.id}에게 진행 중 업무가 ${running.length}건입니다`);
    }
  }

  for (const candidate of s.recruitment.candidates) {
    if (candidate.stage === 'HIRED' && !isEmployed(s, candidate.employeeId)) {
      problems.push(`${candidate.employeeId}: 고용 확정 후보의 고용 상태 불일치`);
    }
    const signings = s.ledger.entries.filter((e) => e.id === `SIGNING-${candidate.employeeId}`);
    if (signings.length > 1) problems.push(`${candidate.employeeId}: 계약금 중복 기록`);
  }

  if (problems.length > 0) {
    throw new InvariantError(`${s.day}일 마감 검사 실패:\n- ${problems.join('\n- ')}`);
  }
}
