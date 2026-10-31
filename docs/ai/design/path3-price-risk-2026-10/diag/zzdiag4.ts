import { loadScenario, riskProfiles } from './src/content/scenario';
import { withRiskLevel } from './src/engine/risk';
import { simulate } from './src/engine/sim/sim';
import { policyById } from './src/engine/sim/policies';
import { contractRiskReport } from './src/engine/reports';
export function run(args: { seeds: number[]; scen: string; level: string }) {
  const out: any[] = [];
  const base = loadScenario(args.scen as any), cfg0 = withRiskLevel(base, args.level as any, riskProfiles()[0]!);
  for (const seed of args.seeds) {
    const config = { ...cfg0, seed };
    const { state } = simulate(config, policyById('MAX_CONTRIBUTION')!, seed, undefined, args.level as any);
    for (const c of state.contracts.filter((c) => c.kind === 'DIRECT_TRADE')) {
      const r = contractRiskReport(state, config, c.id);
      const inv = state.invoices.find((i) => i.contractId === c.id);
      out.push({ seed, good: c.goodId, cust: c.customerId, qty: c.quantity, sale: c.saleAmountMinor, buy: c.purchaseAmountMinor, buyCur: (c as any).purchaseCurrency ?? null,
        due: c.paymentDueDay, acc: c.acceptedDay, del: c.deliveredDay, done: (c as any).completedDay ?? null, invDue: inv?.dueDay ?? null, invStatus: inv?.status ?? null,
        realized: r.realized, comp: r.components });
    }
  }
  return out;
}
