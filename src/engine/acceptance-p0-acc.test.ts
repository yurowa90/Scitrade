// tests/acceptance_cases.json의 통화 없는 회계 사례(P0-ACC-01, P0-ACC-02)를 장부·수금 규칙에 연결한다.
// 각 사례는 새 상태에서 시작하며 이전 사례 상태를 이어받지 않는다.

import { describe, expect, it } from 'vitest';
import acceptance from '../../tests/acceptance_cases.json';
import { loadM1Scenario } from '../content/m1';
import { applyReceipt, createGame } from './engine';
import { emptyLedger, post, summarize, type Ledger } from './ledger';
import { deserializeSave, serializeSave } from './save';
import type { GameState } from './types';

type Case = { id: string; expected_numeric: Record<string, number> };
const cases = (acceptance as unknown as { cases: Case[] }).cases;
const spec = (id: string) => cases.find((c) => c.id === id)!.expected_numeric;

function xxx(ledger: Ledger, id: string, lines: [Parameters<typeof post>[1]['lines'][number]['account'], number][]) {
  post(ledger, { id, day: 1, currency: 'XXX', reason: id, lines: lines.map(([account, amount]) => ({ account, amount })) });
}

describe('P0-ACC-01 외상 판매의 현금·채권·이익 분리', () => {
  it('매입·운송·관세는 매출원가 68을 한 번만 구성한다', () => {
    const e = spec('P0-ACC-01');
    const l = emptyLedger();
    xxx(l, 'open', [['CASH', 100], ['OPENING_EQUITY', -100]]);
    xxx(l, 'purchase', [['INVENTORY', 60], ['CASH', -60]]);
    xxx(l, 'freight', [['INVENTORY', 5], ['CASH', -5]]);
    xxx(l, 'duty', [['INVENTORY', 3], ['CASH', -3]]);
    xxx(l, 'sale', [['ACCOUNTS_RECEIVABLE', 90], ['REVENUE', -90]]);
    xxx(l, 'cogs', [['COST_OF_GOODS_SOLD', 68], ['INVENTORY', -68]]);
    xxx(l, 'wage', [['WAGE_EXPENSE', 4], ['CASH', -4]]);
    const b = summarize(l, 'XXX');
    expect(b.cash).toBe(e.company_cash);
    expect(b.accountsReceivable).toBe(e.accounts_receivable);
    expect(b.inventory).toBe(e.inventory_carrying_amount);
    expect(b.revenue).toBe(e.revenue);
    expect(b.costOfGoodsSold).toBe(e.cost_of_goods_sold);
    expect(b.wageExpense).toBe(e.wage_expense);
    expect(b.profit).toBe(e.profit);
    expect(b.totalAssets).toBe(e.total_assets);
  });
});

describe('P0-ACC-02 외상대금 수금과 중복 수금 방지', () => {
  function fixtureState(): GameState {
    const s = createGame(loadM1Scenario('SCENARIO_M1_ONE_TRADE'));
    s.ledger = emptyLedger();
    xxx(s.ledger, 'open', [['CASH', 100], ['OPENING_EQUITY', -100]]);
    xxx(s.ledger, 'net-before', [['CASH', -72], ['ACCOUNTS_RECEIVABLE', 90], ['REVENUE', -90], ['COST_OF_GOODS_SOLD', 68], ['WAGE_EXPENSE', 4]]);
    s.invoices.push({ id: 'INV_A', contractId: 'CT_A', currency: 'XXX', amountMinor: 90, issuedDay: 1, dueDay: 1, status: 'OUTSTANDING', receiptIds: [] });
    return s;
  }

  it('같은 수금 ID를 재전송하고 저장·불러오기 후 다시 보내도 한 번만 반영한다', () => {
    const e = spec('P0-ACC-02');
    const s = fixtureState();
    const before = summarize(s.ledger, 'XXX');
    expect([before.cash, before.accountsReceivable, before.profit]).toEqual([28, 90, 18]);

    expect(applyReceipt(s, 'RECEIPT_A', 'INV_A')).toBe(true);
    expect(applyReceipt(s, 'RECEIPT_A', 'INV_A')).toBe(false);
    const reloaded = deserializeSave(serializeSave(s), { dataVersion: s.meta.dataVersion });
    expect(applyReceipt(reloaded, 'RECEIPT_A', 'INV_A')).toBe(false);

    const b = summarize(reloaded.ledger, 'XXX');
    expect(b.cash).toBe(e.company_cash);
    expect(b.accountsReceivable).toBe(e.accounts_receivable);
    expect(b.revenue).toBe(e.revenue);
    expect(b.profit).toBe(e.profit);
    expect(b.totalAssets).toBe(e.total_assets);
    expect(reloaded.invoices[0]!.receiptIds).toHaveLength(e.receipt_applied_count!);
  });
});
