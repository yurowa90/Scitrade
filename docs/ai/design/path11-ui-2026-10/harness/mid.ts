// TERM_GREEDY 한 판의 견적 공개일 상태: 가용 현금, 열린 견적, 외상 조건별 판매대금·받는 날, 자금 거절 여부.
import { loadScenario } from '/home/user/Scitrade/src/content/scenario';
import { simConfigV2 } from '/home/user/Scitrade/src/engine/sim/risk-metrics';
import { simulate } from '/home/user/Scitrade/src/engine/sim/sim';
import { policyById } from '/home/user/Scitrade/src/engine/sim/policies';
import { creditTermCheck } from '/home/user/Scitrade/src/engine/engine';
import { openTradePairs, offerDef } from '/home/user/Scitrade/src/engine/market';
import { quotePreview } from '/home/user/Scitrade/src/engine/readers';
import { fundsPosition } from '/home/user/Scitrade/src/engine/reservations';
export function run(seed: number, pol: string, days: string) {
  const config = simConfigV2(loadScenario('SCENARIO_M2_OPS_COS_LAVER' as any), 'R4', 'RISK_PROFILE_V2');
  const want = new Set(days.split(',').map(Number)); const out: any[] = [];
  simulate(config, policyById(pol)!, seed, (s, cmds) => {
    if (!want.has(s.day)) return; const cfg = { ...config, seed };
    const rec: any = { day: s.day, cmds: cmds.map((c: any) => c.type + (c.creditTermId ? ':' + c.creditTermId : '')), krw: fundsPosition(s, cfg, 'KRW'), usd: fundsPosition(s, cfg, 'USD'),
      ar: s.invoices.filter((i: any) => i.status === 'OUTSTANDING' || i.status === 'OVERDUE').map((i: any) => ({ due: i.dueDay, amt: i.amountMinor })), pairs: [] };
    for (const p of openTradePairs(s, cfg)) { const buy = offerDef(s, cfg, p.buyOfferId)!, sell = offerDef(s, cfg, p.sellOfferId)!;
      const q = quotePreview(s, cfg, p, buy.quantity);
      rec.pairs.push({ good: buy.goodId, city: sell.cityId, cust: sell.counterpartyId, qty: buy.quantity, purchaseKrw: q.purchase, freight: q.freight, duty: q.duty, sale: q.sale, receipt: q.receiptDay, allowed: q.allowed, why: q.reasonKo,
        terms: ['BASE', 'D15', 'D30'].map((t) => { const c = creditTermCheck(s, cfg, p.buyOfferId, p.sellOfferId, buy.quantity, t as any); return [t, c.allowed, c.saleAmountMinor, c.paymentDueDay, c.grade, c.limitMinor, c.exposureMinor, c.reasonKo]; }) }); }
    out.push(rec);
  }, 'R4');
  return out;
}
