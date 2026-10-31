import { tradeFundsCheck } from './engine';
import { offerDef, openTradePairs } from './market';
import { MINOR_PER_MAJOR } from './money';
import type { GameState, ScenarioConfig, UnaffordableRecord } from './types';

/** 오늘 공개한 짝의 최소 수량만 검사한다. 입력 상태와 추첨 커서는 바꾸지 않는다. */
export function unaffordableRecords(s: GameState, config: ScenarioConfig): UnaffordableRecord[] {
  if (s.meta.rulesVersion !== 'M2a-rules-4') return [];
  const currencies = Object.keys(MINOR_PER_MAJOR);
  return openTradePairs(s, config).flatMap(({ buyOfferId, sellOfferId }) => {
    const buy = offerDef(s, config, buyOfferId)!, sell = offerDef(s, config, sellOfferId)!;
    if (buy.publishDay !== s.day) return [];
    const quantity = buy.quantityStep;
    const shortfalls = tradeFundsCheck(s, config, buy, sell, quantity).needs
      .filter((n) => n.availableMinor < n.needMinor)
      .map(({ currency, needMinor, availableMinor }) => ({ currency, needMinor, availableMinor }))
      .sort((a, b) => currencies.indexOf(a.currency) - currencies.indexOf(b.currency));
    return shortfalls.length ? [{ day: s.day, buyOfferId, sellOfferId, quantity, shortfalls }] : [];
  }).sort((a, b) => a.buyOfferId < b.buyOfferId ? -1 : a.buyOfferId > b.buyOfferId ? 1
    : a.sellOfferId < b.sellOfferId ? -1 : a.sellOfferId > b.sellOfferId ? 1 : 0);
}
