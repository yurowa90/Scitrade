import { offerDef } from '../market';
import { contractRiskReport, preview } from '../reports';
import { krwToUsdMinor, referenceRate } from '../risk';
import type { GameState, ScenarioConfig } from '../types';
import type { SimMetrics } from './metrics';

export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
export interface RiskMeta { level: RiskLevel; profileId: string; tuningRound: number; marketRulesSha256: string }
export interface RiskContract {
  contractId: string;
  kind: GameState['contracts'][number]['kind'];
  sellOfferId: string | null;
  goodId: string;
  status: GameState['contracts'][number]['status'];
  class: '열린' | '완료' | '취소';
  onTime: boolean;
  realized: number;
  openFixedRateKrw: number;
  components: ReturnType<typeof contractRiskReport>['components'];
  evaluationDay: number;
}
export interface RiskMetrics {
  analysisValueMinor?: number;
  contracts: RiskContract[];
  directAccepted: number;
  referenceRateBounds: boolean;
}

/** 정책이 끝난 뒤에만 읽는다. 계약 손익은 엔진 보고서의 값을 그대로 옮긴다. */
export function riskMetrics(state: GameState, config: ScenarioConfig, metrics: SimMetrics, level: RiskLevel): RiskMetrics {
  const cfg = { ...config, seed: state.rng.seed };
  const contracts = state.contracts.map((c): RiskContract => {
    const r = contractRiskReport(state, cfg, c.id);
    const purchaseCurrency = c.buyOfferId ? offerDef(state, cfg, c.buyOfferId)!.currency : c.currency;
    const p = preview(cfg, c.kind, c.originCityId, c.destinationCityId, c.acceptedDay,
      { purchase: c.purchaseAmountMinor, sale: c.saleAmountMinor }, c.deliveryDeadlineDay, c.paymentDueDay,
      { goodId: c.goodId, purchaseCurrency });
    const shipment = state.shipments.find((s) => s.contractId === c.id);
    if (!r.open && c.status !== 'COMPLETED' && c.status !== 'CANCELLED') throw new Error(`계약 분류 불가: ${c.id}`);
    return { contractId: c.id, kind: c.kind, sellOfferId: c.sellOfferId, goodId: c.goodId, status: c.status,
      class: r.open ? '열린' : c.status === 'COMPLETED' ? '완료' : '취소',
      onTime: p?.lateOnNextSailing === false && shipment?.arrivalDay != null
        && shipment.arrivalDay + cfg.terms.customsDays <= c.deliveryDeadlineDay,
      realized: r.realized, openFixedRateKrw: r.openFixedRateKrw, components: r.components, evaluationDay: r.evaluationDay };
  });
  const ops = cfg.operations!, fx = ops.risk?.profile.fx;
  const end = state.operations?.failure?.day ?? cfg.campaignDays;
  let referenceRateBounds = false;
  if (fx) for (let day = ops.market.publish.firstDay; day <= Math.min(end, ops.market.publish.lastDay); day += ops.market.publish.intervalDays) {
    const rate = referenceRate(cfg, state.rng.seed, day);
    if (rate === fx.minKrwPerUsd || rate === fx.maxKrwPerUsd) referenceRateBounds = true;
  }
  return { ...(level === 'R0' ? {} : { analysisValueMinor: metrics.currencies.USD!.netAssets
    + krwToUsdMinor(metrics.currencies.KRW!.netAssets, ops.fx.baseKrwPerUsd) }), contracts,
    directAccepted: contracts.filter((c) => c.kind === 'DIRECT_TRADE').length, referenceRateBounds };
}
