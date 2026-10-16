// 위험 값은 설정·시드·날짜로만 계산한다. 상태의 난수 커서를 소비하지 않는다.
import { dutyEstimate } from './catalog';
import type { Currency } from './money';
import { drawUniform } from './rng';
import type { MarketSide, RiskProfile, ScenarioConfig } from './types';

export function drawAt(seed: number, stream: string, index: number): number {
  return drawUniform({ seed, cursors: { [stream]: index } }, stream).value;
}

/** 정수 나눗셈, 정확히 절반이면 0에서 먼 쪽으로 반올림한다. */
export function divHalfAway(n: number, d: number): number {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d <= 0) throw new Error('환산에는 정수와 양수 분모가 필요합니다');
  return Math.sign(n) * Math.floor((2 * Math.abs(n) + d) / (2 * d));
}
export const krwToUsdMinor = (krw: number, rate: number): number => divHalfAway(krw * 100, rate);
export const usdToKrwMinor = (cents: number, rate: number): number => divHalfAway(cents * rate, 100);

export function referenceRate(config: ScenarioConfig, seed: number, day: number): number {
  const o = config.operations;
  if (!o) throw new Error('참고 환율은 운영 설정이 필요합니다');
  if (!o.risk) return o.fx.baseKrwPerUsd;
  const fx = o.risk.profile.fx;
  let rate = fx.startKrwPerUsd;
  if (!o.risk.layers.includes('FX')) return rate;
  const p = o.market.publish;
  const week = Math.max(0, Math.floor((Math.min(day, p.lastDay) - p.firstDay) / p.intervalDays));
  for (let k = 1; k <= week; k++) {
    const step = Math.floor(drawAt(seed, 'FX-REF', k) * (2 * fx.stepBp + 1)) - fx.stepBp;
    rate = Math.max(fx.minKrwPerUsd, Math.min(fx.maxKrwPerUsd, divHalfAway(rate * (10000 + step), 10000)));
  }
  return rate;
}

export function rowCurrency(config: ScenarioConfig, side: MarketSide): Currency {
  return config.rules.rulesVersion === 'M2a-rules-3' && config.operations?.risk && side === 'BUY' ? 'KRW' : 'USD';
}

/** 관세 적용일·공지 기준일은 다음 위험 층에서도 같은 호출 계약을 사용한다. */
export function dutyFor(config: ScenarioConfig, seed: number, _goodId: string, _destinationCityId: string,
  _tariffDay: number, _knownThroughDay: number, purchaseMinor: number, purchaseCurrency: Currency, valueFxDay: number): number {
  return dutyEstimate(config, purchaseCurrency === 'KRW'
    ? krwToUsdMinor(purchaseMinor, referenceRate(config, seed, valueFxDay)) : purchaseMinor);
}

/** 측정용 설정 변환. 원화 매입 단가를 만드는 자리는 이 함수 하나다. */
export function withRiskLevel(config: ScenarioConfig, level: 'R0' | 'R1', profile: RiskProfile): ScenarioConfig {
  if (level === 'R0') return config;
  if (!config.operations) throw new Error('위험 단계는 운영 설정이 필요합니다');
  const c = structuredClone(config);
  c.rules.rulesVersion = 'M2a-rules-3';
  c.operations!.risk = { profile: structuredClone(profile), layers: ['FX'] };
  for (const row of c.operations!.market.rows) {
    if (row.side === 'BUY') row.basePriceMinor = usdToKrwMinor(row.basePriceMinor, profile.fx.startKrwPerUsd);
  }
  for (const offer of c.offers) {
    if (offer.kind !== 'supplier') continue;
    offer.unitPriceMinor = usdToKrwMinor(offer.unitPriceMinor, profile.fx.startKrwPerUsd);
    offer.currency = 'KRW';
  }
  return c;
}
