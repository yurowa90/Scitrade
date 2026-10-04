// 상태에서 계산하는 보고 값. 별도의 현금·이익을 저장하지 않는다.

import { contractAmount, summarize, type BookSummary } from './ledger';
import { applyBasisPoints } from './money';
import type { Contract, GameState, ScenarioConfig } from './types';

export interface ContractReport {
  contract: Contract;
  netRevenue: number;
  directCost: number;
  cancellationExpense: number;
  contribution: number;
}

export function contractReport(s: GameState, contract: Contract): ContractReport {
  const c = contract.currency;
  const netRevenue = contractAmount(s.ledger, c, contract.id, 'REVENUE');
  const directCost = contractAmount(s.ledger, c, contract.id, 'COST_OF_GOODS_SOLD');
  const cancellationExpense = contractAmount(s.ledger, c, contract.id, 'CANCELLATION_EXPENSE');
  return {
    contract,
    netRevenue,
    directCost,
    cancellationExpense,
    contribution: netRevenue - directCost - cancellationExpense,
  };
}

export interface CompanyReport {
  trade: BookSummary;
  payroll: BookSummary;
  contracts: ContractReport[];
  inventoryUnits: number;
}

export function companyReport(s: GameState, config: ScenarioConfig): CompanyReport {
  return {
    trade: summarize(s.ledger, config.tradeCurrency),
    payroll: summarize(s.ledger, config.payrollCurrency),
    contracts: s.contracts.map((c) => contractReport(s, c)),
    inventoryUnits: s.cargoLots.filter((l) => l.status !== 'DELIVERED').reduce((a, l) => a + l.quantity, 0),
  };
}

/** 견적 수락 전 비교용 예상치. 지연·취소가 없다는 가정의 계산이며 결과를 보장하지 않는다. */
export interface QuotePreview {
  purchase: number;
  freight: number;
  duty: number;
  sale: number;
  contributionBeforePayroll: number;
  peakCashNeed: number;
  schedule: { day: number; labelKo: string; amount: number }[];
}

export function quotePreview(config: ScenarioConfig, bookingDay: number, departureDay: number): QuotePreview {
  const purchase = config.buyOffer.unitPriceMinor * config.buyOffer.quantity;
  const sale = config.sellOffer.unitPriceMinor * config.sellOffer.quantity;
  const freight = config.route.bookingFeeMinor;
  const duty = applyBasisPoints(purchase, config.terms.dutyRateBasisPoints);
  const arrival = departureDay + config.route.transitDays;
  const release = arrival + config.terms.customsDays;
  const due = Math.max(config.terms.paymentDueDay, release);
  return {
    purchase,
    freight,
    duty,
    sale,
    contributionBeforePayroll: sale - purchase - freight - duty,
    peakCashNeed: purchase + freight + duty,
    schedule: [
      { day: bookingDay, labelKo: '매입 대금 지급', amount: -purchase },
      { day: bookingDay, labelKo: '운임 선지급', amount: -freight },
      { day: arrival, labelKo: '도착·관세 지급', amount: -duty },
      { day: release, labelKo: '인도: 매출·채권 인식 (현금 변화 없음)', amount: 0 },
      { day: due, labelKo: '외상대금 수금', amount: sale },
    ],
  };
}
