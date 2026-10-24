import { loadScenario, riskProfiles } from './src/content/scenario';
import { withRiskLevel, krwToUsdMinor } from './src/engine/risk';
import { simulate } from './src/engine/sim/sim';
import { policyById } from './src/engine/sim/policies';
import { contractRiskReport } from './src/engine/reports';
export function run(args: { seeds: number[]; scen: string }) {
  const out: any[] = [];
  const base = loadScenario(args.scen as any), cfg0 = withRiskLevel(base, 'R1', riskProfiles()[0]!);
  for (const seed of args.seeds) {
    const config = { ...cfg0, seed };
    const { state } = simulate(config, policyById('MAX_CONTRIBUTION')!, seed, undefined, 'R1');
    for (const c of state.contracts.filter((c) => c.kind === 'DIRECT_TRADE')) {
      const r = contractRiskReport(state, config, c.id);
      const inv = state.invoices.find((i) => i.contractId === c.id);
      out.push({ seed, good: c.goodId, saleUsd: c.saleAmountMinor, realizedKrw: r.realized, fx: r.components.fx, due: c.paymentDueDay, accepted: c.acceptedDay, invDue: inv?.dueDay });
    }
  }
  return out;
}
