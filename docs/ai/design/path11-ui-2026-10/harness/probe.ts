import { loadScenario } from '/home/user/Scitrade/src/content/scenario';
import { simConfigV2 } from '/home/user/Scitrade/src/engine/sim/risk-metrics';
import { createGame, openDay, creditTermCheck } from '/home/user/Scitrade/src/engine/engine';
import { openTradePairs, offerDef } from '/home/user/Scitrade/src/engine/market';
import { quotePreview } from '/home/user/Scitrade/src/engine/readers';
import { fundsPosition } from '/home/user/Scitrade/src/engine/reservations';
export function run(seed: number, level: any) {
  const base = loadScenario('SCENARIO_M2_OPS_COS_LAVER' as any);
  const config = simConfigV2(base, level, 'RISK_PROFILE_V2');
  let s = createGame({ ...config, seed } as any, ); s = openDay(s, config).state;
  const out: any = { day: s.day, campaignDays: config.campaignDays, publish: config.operations!.market.publish, payOff: config.operations!.market.trade.paymentOffsetDays,
    funds: { USD: fundsPosition(s, config, 'USD'), KRW: fundsPosition(s, config, 'KRW') }, rulesFunds: config.rules.fundsCheck, pairs: [] };
  for (const p of openTradePairs(s, config)) {
    const buy = offerDef(s, config, p.buyOfferId)!, sell = offerDef(s, config, p.sellOfferId)!;
    const q = quotePreview(s, config, p, buy.quantity);
    const terms = ['BASE', 'D15', 'D30'].map((t) => { const c = creditTermCheck(s, config, p.buyOfferId, p.sellOfferId, buy.quantity, t as any); return { t, ok: c.allowed, why: c.reasonKo, sale: c.saleAmountMinor, due: c.paymentDueDay, grade: c.grade, limit: c.limitMinor }; });
    out.pairs.push({ good: buy.goodId, sellCity: sell.cityId, cp: sell.counterpartyId, qty: buy.quantity, buyCur: buy.currency, sellCur: sell.currency,
      purchase: q.purchase, freight: q.freight, duty: q.duty, sale: q.sale, cashNeed: q.cashNeed, dep: q.departureDay, arr: q.arrivalDay, due: q.paymentDueDay, receipt: q.receiptDay, allowed: q.allowed, why: q.reasonKo, terms });
  }
  return out;
}
