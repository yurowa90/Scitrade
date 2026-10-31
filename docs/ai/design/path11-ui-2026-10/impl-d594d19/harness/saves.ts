// TASK-0077 병합 전 실측용 저장 문자열: OPS_CREDIT·TERM_GREEDY, H2001(8·22·31일 아침), H2005(36일 아침).
import '/home/user/Scitrade/src/content/ops-data-entry';
import { loadScenario } from '/home/user/Scitrade/src/content/scenario';
import { simulate } from '/home/user/Scitrade/src/engine/sim/sim';
import { policyById } from '/home/user/Scitrade/src/engine/sim/policies';
import { serializeSave } from '/home/user/Scitrade/src/engine/save';
export function run(seed: number, pol: string, days: string) {
  const config = loadScenario('SCENARIO_M2_OPS_CREDIT' as any), want = new Set(days.split(',').map(Number)), out: Record<string, string> = {};
  simulate({ ...config, seed } as any, policyById(pol)!, seed, (s) => { if (want.has(s.day)) out[s.day] = serializeSave(structuredClone(s)); });
  return out;
}
