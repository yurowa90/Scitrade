// 인수 명세의 명령·수치를 시험들이 공유한다. 엔진 입력과 기대 결과는 자료에서 읽는다.
import acceptance from '../../tests/acceptance_cases.json';
import { loadScenario, OPERATIONS_SCENARIO_IDS } from '../content/scenario';
import { createGame, openDay, planState } from './engine';
import { runDays, type DayScript } from './testkit';
import type { BookSummary } from './ledger';
import type { Currency } from './money';
import type { EngineCommand, GameState, ScenarioConfig } from './types';

export interface OperationCase {
  id: string; actions: { day: number; commands: EngineCommand[]; variant: string }[];
  expected_numeric: Record<string, any>; test_fixture: Record<string, any>;
}
export const caseOf = (id: string) => (acceptance.cases as unknown as OperationCase[]).find((c) => c.id === id)!;
export const config = loadScenario(OPERATIONS_SCENARIO_IDS[0]);
export const fresh = (cfg = config) => openDay(createGame(cfg), cfg).state;
export const scriptOf = (c: OperationCase, variant = 'A'): DayScript => Object.fromEntries(c.actions.filter((a) => a.variant === variant).map((a) => [a.day, a.commands]));
export const atDay = (day: number, cfg = config, script: DayScript = {}) => openDay(runDays(createGame(cfg), cfg, day - 1, script).state, cfg).state;
export const resume = (state: GameState, day: number, script: DayScript = {}, cfg = config) => runDays(state, cfg, day, script).state;
export const planned = (c: OperationCase, cfg = config) => {
  const last = c.actions.filter((a) => a.variant === 'A').at(-1)!;
  return planState(atDay(last.day, cfg, scriptOf(c)), cfg, last.commands);
};
export const applied = (commands: EngineCommand[]) => commands.map((c) => ({ commandId: c.id, status: 'APPLIED', reasonKo: '처리됨' }));
export function book(currency: Currency, changes: Partial<BookSummary> = {}, cfg: ScenarioConfig = config): BookSummary {
  const opening = cfg.startingCash[currency] ?? 0;
  return { currency, cash: opening, inventory: 0, prepaidFreight: 0, forwardingWip: 0, accountsReceivable: 0,
    accountsPayable: 0, totalAssets: opening, revenue: 0, costOfGoodsSold: 0, forwardingRevenue: 0, forwardingCost: 0,
    cancellationExpense: 0, wageExpense: 0, recruitmentExpense: 0, trainingExpense: 0, cultureExpense: 0,
    rentExpense: 0, facilitySetupExpense: 0, spaceContractExpense: 0, fxSpreadExpense: 0, currencyTransferNet: 0,
    profit: 0, openingEquity: opening, ...changes };
}
