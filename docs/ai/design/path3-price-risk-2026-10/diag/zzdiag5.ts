import { loadScenario, riskProfiles } from './src/content/scenario';
import { withRiskLevel, referenceRate } from './src/engine/risk';
export function run(args: { seeds: number[]; scen: string }) {
  const cfg = withRiskLevel(loadScenario(args.scen as any), 'R3', riskProfiles()[0]!);
  const out: Record<string, number[]> = {};
  for (const seed of args.seeds) out[seed] = Array.from({ length: 91 }, (_, d) => referenceRate(cfg, seed, d));
  return { out, fx: cfg.operations!.risk!.profile.fx };
}
