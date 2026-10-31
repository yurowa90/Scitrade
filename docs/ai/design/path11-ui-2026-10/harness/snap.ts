// 경로 11 모형용 숫자: 한 판을 돌려 30일·끝 시점의 원화 환산 손익계산서와 재무상태표를 만든다. 판정·측정이 아니다.
import { loadScenario } from '/home/user/Scitrade/src/content/scenario';
import { simConfigV2 } from '/home/user/Scitrade/src/engine/sim/risk-metrics';
import { simulate } from '/home/user/Scitrade/src/engine/sim/sim';
import { policyById } from '/home/user/Scitrade/src/engine/sim/policies';
import { referenceRate } from '/home/user/Scitrade/src/engine/risk';
import { balance } from '/home/user/Scitrade/src/engine/ledger';
const K = (cents: number, rate: number) => Math.round(cents * rate / 100);
function statements(state: any, config: any, seed: number, uptoDay: number) {
  const rate = (d: number) => referenceRate(config, seed, d);
  const sum: Record<string, number> = {};
  for (const e of state.ledger.entries) { if (e.day > uptoDay) continue;
    for (const l of e.lines) { const v = e.currency === 'KRW' ? l.amount : K(l.amount, rate(e.day)); sum[l.account] = (sum[l.account] ?? 0) + v; } }
  const g = (a: string) => sum[a] ?? 0; const endRate = rate(uptoDay);
  const bal = (c: string, a: string) => balance({ entries: state.ledger.entries.filter((e: any) => e.day <= uptoDay) } as any, c as any, a as any);
  const bs = (a: string) => bal('KRW', a) + K(bal('USD', a), endRate);
  const is = {
    매출액: -(g('REVENUE')), 매출에누리: g('SALES_ALLOWANCE'), 주선수익: -g('FORWARDING_REVENUE'),
    매출원가: g('COST_OF_GOODS_SOLD'), 주선원가: g('FORWARDING_COST'),
    급여: g('WAGE_EXPENSE') + g('RECRUITMENT_EXPENSE') + g('TRAINING_EXPENSE') + g('CULTURE_EXPENSE'),
    임차료: g('RENT_EXPENSE') + g('FACILITY_SETUP_EXPENSE') + g('SPACE_CONTRACT_EXPENSE'), 대손상각비: g('BAD_DEBT'), 취소비용: g('CANCELLATION_EXPENSE'),
    환전차감: g('FX_SPREAD_EXPENSE'), 지연이자: g('RECEIVABLE_CARRY'),
  } as Record<string, number>;
  const opening = bal('KRW', 'OPENING_EQUITY') + K(bal('USD', 'OPENING_EQUITY'), rate(1));
  const assets = { 현금: bs('CASH'), 매출채권: bs('ACCOUNTS_RECEIVABLE'), 재고: bs('INVENTORY'), 선급운임: bs('PREPAID_FREIGHT') + bs('FORWARDING_WIP') };
  const ap = bs('ACCOUNTS_PAYABLE');
  const net = Object.values(assets).reduce((a, b) => a + b, 0) - ap;
  const opLines = is.매출액 - is.매출에누리 + is.주선수익 - is.매출원가 - is.주선원가 - is.급여 - is.임차료 - is.대손상각비 - is.취소비용;
  const fxResidual = (net - opening) - (opLines - is.환전차감 - is.지연이자);
  return { day: uptoDay, rate: endRate, startRate: rate(1), is, opLines, fxResidual, profit: net - opening, opening, assets, ap, net,
    usdCash: bal('USD', 'CASH'), krwCash: bal('KRW', 'CASH'), usdAR: bal('USD', 'ACCOUNTS_RECEIVABLE') };
}
export function run(seed: number, pol: string, days: string) {
  const config = simConfigV2(loadScenario('SCENARIO_M2_OPS_COS_LAVER' as any), 'R4', 'RISK_PROFILE_V2');
  const cfg = { ...config, seed };
  const { state } = simulate(config, policyById(pol)!, seed, undefined, 'R4');
  const dt = state.contracts.filter((c: any) => c.kind === 'DIRECT_TRADE');
  const out: any = { policy: pol, seed, directTrades: dt.map((c: any) => ({ id: c.id, day: c.acceptedDay ?? c.createdDay ?? null, term: c.creditTermId, cust: c.customerId, sale: c.saleAmountMinor, status: c.status })) };
  out.snaps = days.split(',').map(Number).map((d) => statements(state, cfg, seed, d));
  return out;
}
