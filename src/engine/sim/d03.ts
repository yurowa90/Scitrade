import { loadScenario, OPERATIONS_SCENARIO_IDS } from '../../content/scenario';
import { ENGINE_VERSION } from '../types';
import { policyById } from './policies';
import { simulate, SIM_FORMAT, SIM_SEEDS, type SimOutput, type SimRun } from './sim';
import { d03PolicyIds, parseVariant, variantName, withLateMode, type Investment, type LateMode } from './variants';

export function median(values: readonly number[]): number {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b), i = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[i]! : (sorted[i - 1]! + sorted[i]!) / 2;
}
export const usdAssets = (r: SimRun) => r.metrics.currencies.USD!.netAssets;
const unpaid = (r: SimRun) => r.metrics.operations!.unpaidAtEnd.find((x) => x.currency === 'KRW')?.amountMinor ?? 0;
const healthy = (r: SimRun) => r.metrics.operations!.outcome !== 'FAILED' && unpaid(r) === 0;
export interface Cell { median: number; gains: number; failures: number; n: number; arrow: string }
export function cell(runs: SimRun[], baselines: SimRun[]): Cell {
  const pairs = runs.map((r) => ({ r, b: baselines.find((b) => b.seed === r.seed && b.scenarioId === r.scenarioId) }));
  if (pairs.some((p) => !p.b)) return { median: NaN, gains: 0, failures: 0, n: 0, arrow: '' };
  const diffs = pairs.map(({ r, b }) => usdAssets(r) - usdAssets(b!)), n = diffs.length;
  const m = median(diffs), gains = pairs.filter(({ r, b }) => usdAssets(r) > usdAssets(b!) && healthy(r)).length;
  const failures = runs.filter((r) => r.metrics.operations!.outcome === 'FAILED').length;
  return { median: m, gains, failures, n, arrow: n < 10 ? '' : m >= 30000 && gains >= 0.75 * n && failures <= Math.floor(0.05 * n) ? '↑' : m <= -30000 && gains <= 0.25 * n ? '↓' : '' };
}
export function predictJ6(rows: { extraJobsPerWeek: number; usableAfter: number }[]) {
  const value = median(rows.map((r) => r.extraJobsPerWeek));
  return { value, arrow: Number.isNaN(value) ? '' : value >= 0.5 ? '↑' : '↓' };
}
export function baselineId(id: string): string {
  const v = parseVariant(id)!;
  return variantName(v.early ? { ...v, early: false } : v.hires.length ? { ...v, hires: [] } : { ...v, investment: 'none' });
}
export function runD03(options: { seeds?: readonly number[]; policyIds?: readonly string[]; late?: LateMode } = {}): SimOutput {
  const seeds = [...(options.seeds ?? SIM_SEEDS)], policyIds = [...(options.policyIds ?? d03PolicyIds(options.late))];
  if (!seeds.length || new Set(seeds).size !== seeds.length || new Set(policyIds).size !== policyIds.length) throw new Error('빈 시드 또는 중복 실행 키입니다.');
  const runs: SimRun[] = [];
  const configs = OPERATIONS_SCENARIO_IDS.map((id) => withLateMode(loadScenario(id), options.late ?? 'base'));
  for (const config of configs) for (const id of policyIds) {
    const policy = policyById(id);
    if (!policy) throw new Error(`알 수 없는 정책: ${id}`);
    for (const seed of seeds) runs.push(simulate(config, policy, seed).run);
  }
  return ordered({ meta: { tool: 'scitrade-sim', format: SIM_FORMAT, engineVersion: ENGINE_VERSION, dataVersion: configs[0]!.dataVersion,
    scenarioIds: [...OPERATIONS_SCENARIO_IDS], policyIds, seeds, lateMode: options.late ?? 'base' }, runs });
}
function key(r: SimRun) { return JSON.stringify([r.scenarioId, r.policyId, r.seed]); }
function ordered(out: SimOutput): SimOutput {
  out.runs.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  out.meta.policyIds.sort(); out.meta.scenarioIds.sort(); out.meta.seeds.sort((a, b) => a - b); return out;
}
export function mergeD03(outputs: SimOutput[], late: LateMode): SimOutput {
  if (!outputs.length) throw new Error('합칠 실행이 없습니다.');
  const seen = new Set<string>(), first = outputs[0]!;
  for (const o of outputs) {
    if (o.meta.lateMode !== late || o.meta.engineVersion !== first.meta.engineVersion || o.meta.dataVersion !== first.meta.dataVersion || o.meta.format !== SIM_FORMAT) throw new Error('감액·엔진·자료·형식 판본이 다른 실행입니다.');
    for (const r of o.runs) { const k = key(r); if (seen.has(k)) throw new Error(`중복 실행 키: ${k}`); seen.add(k); }
  }
  const runs = outputs.flatMap((o) => o.runs);
  return ordered({ meta: { ...first.meta, scenarioIds: [...new Set(runs.map((r) => r.scenarioId))], policyIds: [...new Set(runs.map((r) => r.policyId))], seeds: [...new Set(runs.map((r) => r.seed))] }, runs });
}
const dollars = (minor: number, sign = false) => Number.isNaN(minor) ? '미측정' : `${sign && minor >= 0 ? '+' : ''}${Math.round(minor / 100).toLocaleString('en-US')}`;
const display = (c: Cell) => c.n ? `${dollars(c.median, true)} (${c.gains})${c.arrow ? ` ${c.arrow}` : ''}` : '미측정';
export function d03Tables(output: SimOutput): string {
  const mode = output.meta.lateMode ?? 'base';
  const lines = [`# D03 엔진 재측정 (${mode})`, '', `시드 ${output.meta.seeds.join(', ')} · 실행 ${output.runs.length}회. 금액은 USD 정수 표시, 원화는 별도다.`,
    '같은 시드의 USD 순자산 차이 중앙값 (이득 시드 수)이다. 두 정책 중앙값끼리 뺀 값은 아니다. 이득은 순자산 증가·실패 없음·끝 원화 미지급 0이다.',
    '①은 보통·고용·투자 없음 대비, ②는 같은 수락의 투자 없음 대비, ③·④는 같은 수락·투자의 고용 없음 대비다. 조사 선행은 같은 고용·투자의 조사 선행 없는 실행 대비다.',
    'S=1일 선복, E=7일 확장, SE=둘 다, SE22=22일 둘 다. ↑는 중앙 ≥ +300 USD·이득 ≥ 0.75N·실패 ≤ floor(0.05N), ↓는 중앙 ≤ −300 USD·이득 ≤ 0.25N이다. N<10이면 화살표를 쓰지 않는다.', ''];
  for (const scenarioId of output.meta.scenarioIds) {
    const runs = output.runs.filter((r) => r.scenarioId === scenarioId), ids = [...new Set(runs.map((r) => r.policyId))];
    const get = (id: string) => runs.filter((r) => r.policyId === id);
    const stats = (id: string, base = baselineId(id)) => cell(get(id), get(base));
    const baseline = get('MAX_CONTRIBUTION'), n = baseline.length;
    lines.push(`## ${scenarioId}`, '', '## ① 기준 표', '', '| 정책 | 기준 대비 USD | USD 순자산 중앙 | 실패 | 끝 KRW 현금 중앙 | 끝 KRW 미지급 중앙 |', '|---|---:|---:|---:|---:|---:|');
    for (const id of ['IDLE', 'NO_FX', 'MAX_CONTRIBUTION', 'LATE_OK', 'MAX_CONTRIBUTION~fx:react'].filter((id) => ids.includes(id))) {
      const rs = get(id); lines.push(`| ${id} | ${display(stats(id, 'MAX_CONTRIBUTION'))} | ${dollars(median(rs.map(usdAssets)))} | ${rs.filter((r) => r.metrics.operations!.outcome === 'FAILED').length}/${rs.length} | ${median(rs.map((r) => r.metrics.currencies.KRW!.cash)).toLocaleString('en-US')} | ${median(rs.map(unpaid)).toLocaleString('en-US')} |`);
    }
    if (mode === 'base') {
      lines.push('', '## ② 투자만', '', '| 정책 | 투자 없음 대비 USD |', '|---|---:|');
      for (const id of ids.filter((id) => { const v = parseVariant(id)!; return v.investment !== 'none' && !v.hires.length; })) lines.push(`| ${id} | ${display(stats(id))} |`);
    }
    const hires = ids.filter((id) => { const v = parseVariant(id)!; return v.hires.length === 1 && !v.early; });
    for (const [acceptance, title] of [['MAX_CONTRIBUTION', '③ 고용 표(보통)'], ['LATE_OK', '④ 고용 표(적극)']]) {
      const investments = mode === 'base' ? ['none', 'S', 'E', 'SE', 'SE22'] : ['none', 'S', 'E', 'SE'];
      lines.push('', `## ${title}`, '', `| 고용 | ${investments.join(' | ')} |`, `|---|${investments.map(() => '---:|').join('')}`);
      for (const pt of [2, 3]) for (const day of mode === 'base' ? [8, 29, 30, 31, 50] : [8, 30, 50]) {
        lines.push(`| ${pt}pt ${day}일 | ${investments.map((investment) => display(stats(variantName({ acceptance: acceptance!, investment: investment as Investment, hires: [{ pt, day }], react: false, early: false })))).join(' | ')} |`);
      }
    }
    const coreHires = hires.filter((id) => { const v = parseVariant(id)!; return [8, 30, 50].includes(v.hires[0]!.day) && v.investment !== 'SE22'; });
    const clear = hires.filter((id) => stats(id).arrow);
    const j6 = clear.map((id) => {
      const v = parseVariant(id)!, h = v.hires[0]!, rs = get(id), bs = get(baselineId(id));
      const measurements = bs.flatMap((r) => r.metrics.operations!.bottlenecks.filter((b) => b.day === h.day && b.pt === h.pt));
      const prediction = predictJ6(measurements), actual = stats(id).arrow;
      const highSeeds = rs.filter((r) => {
        const actual = r.metrics.operations!.actualHires[0]?.actualDay;
        const ds = r.metrics.operations!.utilization.filter((d) => actual !== null && actual !== undefined && d.day >= actual);
        return ds.length && ds.filter((d) => d.handlingUsedPt / d.handlingCapacityPt >= 0.9 || d.storageUsedLiters / d.storageCapacityLiters >= 0.9).length >= ds.length / 2;
      }).length;
      const waiting = median(rs.map((r) => r.metrics.operations!.warehouseWaitingTaskDays));
      return { id, prediction, actual, matched: prediction.arrow === actual, highSeeds, waiting, n: measurements.length };
    });
    const eligible = ids.filter((id) => { const v = parseVariant(id)!; return !['IDLE', 'NO_FX'].includes(v.acceptance) && !v.react && v.hires.length < 2; });
    const complete = eligible.filter((id) => get(id).length === n);
    const near = new Map(complete.map((id) => [id, 0])), wins = new Map(complete.map((id) => [id, 0]));
    for (const seed of output.meta.seeds) {
      const rs = complete.flatMap(get).filter((r) => r.seed === seed), best = Math.max(...rs.map(usdAssets));
      for (const r of rs) if (best - usdAssets(r) <= 30000) near.set(r.policyId, near.get(r.policyId)! + 1);
      const winner = rs.find((r) => usdAssets(r) === best); if (winner) wins.set(winner.policyId, wins.get(winner.policyId)! + 1);
    }
    const strongest = [...near].sort((a, b) => b[1] - a[1])[0];
    const shares = baseline.map((r) => {
      const b = r.metrics.operations!.currencies.USD!.business, total = b.directTrade + b.handlingForwarding + b.standardForwarding;
      return { direct: total ? b.directTrade * 100 / total : 0, handling: total ? b.handlingForwarding * 100 / total : 0, standard: total ? b.standardForwarding * 100 / total : 0 };
    });
    lines.push('', '## ⑤ J1~J7 판정과 근거 수', '', '| 판정 | 결과 | 근거 |', '|---|---|---|');
    const judge = (id: string, pass: boolean | null, evidence: string) => lines.push(`| ${id} | ${pass === null ? mode !== 'base' && ['J2b', 'J3', 'J5'].includes(id) ? '해당 없음' : '미측정' : pass ? '통과' : '실패'} | ${evidence} |`);
    judge('J1', n ? baseline.every(healthy) : null, `기준 ${n}시드, 실패 ${baseline.filter((r) => r.metrics.operations!.outcome === 'FAILED').length}, 끝 원화 미지급 ${baseline.filter((r) => unpaid(r) > 0).length}`);
    const groups = ['MAX_CONTRIBUTION', 'LATE_OK'].map((p) => { const cs = coreHires.filter((id) => parseVariant(id)!.acceptance === p).map((id) => stats(id)); return { p, count: cs.length, up: cs.filter((c) => c.arrow === '↑').length, down: cs.filter((c) => c.arrow === '↓').length }; });
    judge('J2', groups.every((g) => g.count === 24) && n >= 10 ? groups.every((g) => g.up > 0 && g.down > 0) : null, groups.map((g) => `${g.p}: ${g.count}칸 ↑${g.up} ↓${g.down}`).join('; '));
    const middle = coreHires.filter((id) => parseVariant(id)!.hires[0]!.day === 30 && stats(id).arrow);
    const stable = middle.filter((id) => { const v = parseVariant(id)!, c = stats(id); return [29, 31].every((day) => {
      const x = stats(variantName({ ...v, hires: [{ ...v.hires[0]!, day }] })); return x.n > 0 && (!x.arrow || x.arrow === c.arrow) && Math.sign(x.median) === Math.sign(c.median);
    }); }).length;
    judge('J2b', mode !== 'base' || n < 10 ? null : stable === middle.length, mode !== 'base' ? '줄인 묶음에 29·31일 고용이 없음' : `${stable}/${middle.length}칸, 인접 29·31일 부호·반대 판정 확인`);
    judge('J3', mode !== 'base' || !strongest || n < 10 ? null : strongest[1] < 0.85 * n, `후보 ${complete.length}정책, 가장 강한 ${strongest?.[0] ?? '없음'}: ${strongest?.[1] ?? 0}/${n}시드 (1위와 300 USD 안)`);
    const nofx = get('NO_FX'), nofxFailed = nofx.filter((r) => r.metrics.operations!.outcome === 'FAILED').length;
    const shape = baseline.every((r) => { const o = r.metrics.operations!; return o.maxBatchOffers <= 10 && o.forwardingPrepMin >= 2 && o.forwardingPrepMax <= 12 && r.metrics.currencies.KRW!.cash >= 0; });
    const net = median(baseline.map(usdAssets));
    judge('J4', n && nofx.length ? shape && nofxFailed >= 0.75 * nofx.length && net >= 1060000 && net <= 1910000 : null, `기준 ${n}시드, 최대 묶음 ${Math.max(0, ...baseline.map((r) => r.metrics.operations!.maxBatchOffers))}견적, 준비 ${Math.min(...baseline.map((r) => r.metrics.operations!.forwardingPrepMin))}~${Math.max(0, ...baseline.map((r) => r.metrics.operations!.forwardingPrepMax))}pt; NO_FX 실패 ${nofxFailed}/${nofx.length}; USD 중앙 ${dollars(net)}`);
    const double = ids.find((id) => parseVariant(id)!.hires.length === 2), doubleCell = double ? stats(double) : null;
    judge('J5', mode !== 'base' || !doubleCell?.n ? null : doubleCell.gains <= 0.15 * doubleCell.n, mode !== 'base' ? '줄인 묶음에 두 명 고용 진단이 없음' : `두 명 고용 이득 ${doubleCell?.gains ?? 0}/${doubleCell?.n ?? 0}시드`);
    const matches = j6.filter((c) => c.matched).length;
    const j6Groups = ['MAX_CONTRIBUTION', 'LATE_OK'].map((p) => {
      const cs = j6.filter((c) => parseVariant(c.id)!.acceptance === p);
      return `${p} ${cs.filter((c) => c.matched).length}/${cs.length}칸`;
    }).join('; ');
    judge('J6', j6.length ? matches / j6.length >= 0.8 : null, `${matches}/${j6.length}칸 (${j6.length ? (matches * 100 / j6.length).toFixed(1) : '미측정'}%), ${j6.reduce((s, c) => s + c.n, 0)}시드 관측; ${j6Groups}`);
    const direct = median(shares.map((s) => s.direct));
    judge('J7', n ? direct >= 25 : null, `${n}시드, 직접 무역 ${direct.toFixed(2)}%, 작업 포함 ${median(shares.map((s) => s.handling)).toFixed(2)}%, 일반 ${median(shares.map((s) => s.standard)).toFixed(2)}% (각 시드 비중의 중앙)`);
    lines.push('', '### J6 칸별 병목 예측', '', '| 정책 | 추가 업무/주 중앙 | 예측 | 실측 | 일치 | 예측 시드 수 | 불일치: 이용률 높은 시드 | 불일치: 창고 대기 업무-일 중앙 |', '|---|---:|---|---|---|---:|---:|---:|');
    for (const c of j6) lines.push(`| ${c.id} | ${c.prediction.value} | ${c.prediction.arrow} | ${c.actual} | ${c.matched ? '일치' : '불일치'} | ${c.n} | ${c.matched ? '—' : c.highSeeds} | ${c.matched ? '—' : c.waiting} |`);
    lines.push('', '보관 예측은 정상 상태의 리틀의 법칙 추정이다. 도착 집중·높은 이용률의 대기는 놓칠 수 있다. 이용률 높은 시드는 실제 고용일 이후 마감의 절반 이상에서 보관 또는 처리 이용률이 90% 이상인 경우다.');
    if (mode === 'base') {
      lines.push('', '## ⑥ 시드별 1위 정책 분포와 가장 강한 정책', '', '| 1위 정책 (동점은 정책 이름 순) | 시드 수 |', '|---|---:|');
      for (const [id, count] of wins) if (count) lines.push(`| ${id} | ${count} |`);
      lines.push('', `가장 강한 정책: ${strongest?.[0] ?? '미측정'} (${strongest?.[1] ?? 0}/${n}시드에서 1위와 300 USD 안). 실패 실행도 순자산 그대로 포함한다.`, '', '## ⑦ 사업별 기여이익 비중', '', '| 사업 | USD 기여이익 중앙 | 시드별 비중 중앙 |', '|---|---:|---:|');
      for (const [field, share, label] of [['directTrade', 'direct', '직접 무역'], ['handlingForwarding', 'handling', '작업 포함 주선'], ['standardForwarding', 'standard', '일반 주선']] as const) lines.push(`| ${label} | ${dollars(median(baseline.map((r) => r.metrics.operations!.currencies.USD!.business[field])))} | ${median(shares.map((s) => s[share])).toFixed(2)}% |`);
      lines.push('', '## ⑧ 계획 고용일과 실제 고용일이 다른 실행 수', '', '| 정책 | 다른 실행 / 고용 실행 | 실제 고용일 (null=미고용) |', '|---|---:|---|');
      for (const id of ids.filter((id) => parseVariant(id)!.hires.length)) { const rs = get(id); lines.push(`| ${id} | ${rs.filter((r) => r.metrics.operations!.actualHires.some((h) => h.actualDay !== h.plannedDay)).length}/${rs.length} | ${[...new Set(rs.map((r) => r.metrics.operations!.actualHires.map((h) => h.actualDay ?? 'null').join('+')))].join(', ')} |`); }
      lines.push('', '### 진단·조사 선행 비교', '', '| 정책 | 대응 기준 대비 USD |', '|---|---:|');
      for (const id of ids.filter((id) => { const v = parseVariant(id)!; return v.early || v.hires.length > 1; })) lines.push(`| ${id} | ${display(stats(id))} |`);
    }
  }
  return lines.join('\n') + '\n';
}
