import { summarize } from '../ledger';
import type { Currency } from '../money';
import { contractReport } from '../reports';
import type { GameState, ScenarioConfig } from '../types';

export interface CurrencyMetrics {
  cash: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventory: number;
  /** 총자산에서 미지급금을 뺀다. TASK-0016 병합 때 합칠 후보. */
  netAssets: number;
  profit: number;
  contractContribution: number;
  contributionDirectTrade: number;
  contributionForwarding: number;
  shortfallDays: number;
  shortfallBasisPoints: number;
  firstShortfallDay: number | null;
}

/** 인도한 계약만 분모에 넣는다. TASK-0016 병합 때 합칠 후보. */
export interface DeliveryMetrics {
  delivered: number;
  onTime: number;
  late: number;
  rateBasisPoints: number | null;
  pastDeadlineUndelivered: number;
}
export interface SimMetrics {
  closedDays: number;
  currencies: Record<string, CurrencyMetrics>;
  contracts: { total: number; directTrade: number; forwarding: number; delivered: number; completed: number; cancelled: number };
  delivery: DeliveryMetrics;
  staff: { availableEmployeeDays: number; idleEmployeeDays: number; waitingTaskDays: number };
}
export interface MetricsCollector {
  observeClosedDay(state: GameState, config: ScenarioConfig, closedDay: number): void;
  finish(state: GameState, config: ScenarioConfig): SimMetrics;
}

export function deliveryCounts(s: Pick<GameState, 'day' | 'contracts'>): DeliveryMetrics {
  let delivered = 0, onTime = 0, pastDeadlineUndelivered = 0;
  for (const c of s.contracts) {
    if (c.status === 'CANCELLED') continue;
    if (c.deliveredDay !== null) {
      delivered++;
      if (c.deliveredDay <= c.deliveryDeadlineDay) onTime++;
    } else if (c.deliveryDeadlineDay < s.day) pastDeadlineUndelivered++;
  }
  return { delivered, onTime, late: delivered - onTime,
    rateBasisPoints: delivered ? Math.floor(onTime * 10000 / delivered) : null, pastDeadlineUndelivered };
}

export function createMetricsCollector(config: ScenarioConfig): MetricsCollector {
  const primaryCurrencies = [...new Set([config.tradeCurrency, config.payrollCurrency])];
  const seenCurrencies = new Set<Currency>(primaryCurrencies);
  const shortfalls = new Map<Currency, { days: number; first: number }>();
  let closedDays = 0;
  const staff = { availableEmployeeDays: 0, idleEmployeeDays: 0, waitingTaskDays: 0 };
  return {
    observeClosedDay(state, _config, closedDay) {
      closedDays++;
      const unpaid = new Set(state.obligations.filter((o) => o.paidDay === null).map((o) => o.currency));
      for (const currency of unpaid) {
        const previous = shortfalls.get(currency);
        shortfalls.set(currency, { days: (previous?.days ?? 0) + 1, first: previous?.first ?? closedDay });
        seenCurrencies.add(currency);
      }
      for (const e of state.employees) {
        if (e.employmentStatus !== 'employed' || e.availableFromDay > closedDay) continue;
        staff.availableEmployeeDays++;
        const worked = state.tasks.some((t) => t.assignedEmployeeId === e.id && t.startedDay !== null && t.startedDay <= closedDay
          && (t.status === 'RUNNING' || (t.status === 'DONE' && t.completedDay === closedDay)));
        if (!worked) staff.idleEmployeeDays++;
      }
      staff.waitingTaskDays += state.tasks.filter((t) => t.status === 'QUEUED' && t.assignedEmployeeId === null).length;
    },
    finish(state) {
      for (const entry of state.ledger.entries) seenCurrencies.add(entry.currency);
      for (const obligation of state.obligations) seenCurrencies.add(obligation.currency);
      const order = [...primaryCurrencies, ...[...seenCurrencies].filter((c) => !primaryCurrencies.includes(c)).sort()];
      const currencies: Record<string, CurrencyMetrics> = {};
      for (const currency of order) {
        const book = summarize(state.ledger, currency);
        let contributionDirectTrade = 0, contributionForwarding = 0;
        for (const contract of state.contracts) {
          if (contract.currency !== currency) continue;
          const contribution = contractReport(state, contract).contribution;
          if (contract.kind === 'DIRECT_TRADE') contributionDirectTrade += contribution;
          else contributionForwarding += contribution;
        }
        const shortage = shortfalls.get(currency);
        const shortfallDays = shortage?.days ?? 0;
        currencies[currency] = {
          cash: book.cash, accountsReceivable: book.accountsReceivable, accountsPayable: book.accountsPayable,
          inventory: book.inventory, netAssets: book.totalAssets - book.accountsPayable, profit: book.profit,
          contractContribution: contributionDirectTrade + contributionForwarding,
          contributionDirectTrade, contributionForwarding, shortfallDays,
          shortfallBasisPoints: closedDays ? Math.floor(shortfallDays * 10000 / closedDays) : 0,
          firstShortfallDay: shortage?.first ?? null,
        };
      }
      const contracts = state.contracts;
      return { closedDays, currencies, contracts: {
        total: contracts.length, directTrade: contracts.filter((c) => c.kind === 'DIRECT_TRADE').length,
        forwarding: contracts.filter((c) => c.kind === 'FORWARDING').length,
        delivered: contracts.filter((c) => c.deliveredDay !== null).length,
        completed: contracts.filter((c) => c.status === 'COMPLETED').length,
        cancelled: contracts.filter((c) => c.status === 'CANCELLED').length,
      }, delivery: deliveryCounts(state), staff: { ...staff } };
    },
  };
}
