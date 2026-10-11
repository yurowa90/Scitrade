import { d03Tables, mergeD03, runD03 } from './d03';
import type { LateMode } from './variants';
export { mergeD03, runD03 };
import { compareOutputs, formatCompare, summarizeOutput } from './compare';
import { runSuite, serializeSimOutput, SIM_FORMAT, SIM_SEEDS, type SimOutput } from './sim';

export interface SimIo {
  readText(path: string): string;
  writeText(path: string, text: string): void;
  out(text: string): void;
  err(text: string): void;
  now(): number;
}
const USAGE = `사용법:
  sim run [--scenarios A,B] [--policies X,Y] [--seeds N] [--out PATH]
  sim d03 [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
  sim d03 --tables-from a.json,b.json [--late base|cap30|flat200]
  sim compare BEFORE AFTER [--limit N]
  sim summary FILE
  sim help | --help
시드 수 N은 고정 시드의 앞 1~20개입니다. 비교 표시 한도는 0 이상의 정수입니다.
`;
function integer(value: string, min: number, max: number, label: string): number {
  const n = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${label}: ${min}~${max} 정수여야 합니다.`);
  return n;
}
function readOutput(path: string, io: SimIo): SimOutput {
  let value: unknown;
  try { value = JSON.parse(io.readText(path)); }
  catch (error) { throw new Error(`입력 파일을 읽을 수 없습니다 (${path}): ${error instanceof Error ? error.message : String(error)}`); }
  if (!value || typeof value !== 'object') throw new Error(`비교 실행기 출력이 아닙니다: ${path}`);
  const output = value as SimOutput;
  if (output.meta?.tool !== 'scitrade-sim' || output.meta?.format !== SIM_FORMAT || !Array.isArray(output.runs)) {
    throw new Error(`비교 실행기 출력 형식이 아닙니다: ${path} (도구·형식 판본·실행 목록 확인)`);
  }
  return output;
}

export function d03Options(args: readonly string[]) {
  const options = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]!, value = args[i + 1];
    if (!['--policies', '--seeds', '--seed-from', '--seed-to', '--late', '--workers', '--out', '--tables-from'].includes(key) || !value || value.startsWith('--') || options.has(key)) throw new Error(`잘못된 D03 인수: ${key}`);
    options.set(key, value);
  }
  const count = integer(options.get('--seeds') ?? '20', 1, 20, '시드 수');
  // 분할 범위는 고정 시드 목록의 1부터 시작하는 번호다.
  const from = integer(options.get('--seed-from') ?? '1', 1, count, '시드 시작 번호');
  const to = integer(options.get('--seed-to') ?? String(count), from, count, '시드 끝 번호');
  const late = options.get('--late') ?? 'base';
  if (!['base', 'cap30', 'flat200'].includes(late)) throw new Error(`알 수 없는 감액: ${late}`);
  return { ...(options.has('--policies') ? { policyIds: options.get('--policies')!.split(',') } : {}), seeds: SIM_SEEDS.slice(from - 1, to), late: late as LateMode,
    workers: integer(options.get('--workers') ?? '1', 1, 32, '워커 수'), out: options.get('--out'), tablesFrom: options.get('--tables-from')?.split(',') };
}
export function writeD03(output: SimOutput, io: SimIo, out?: string) {
  if (out) io.writeText(out, serializeSimOutput(output));
  io.out(d03Tables(output));
}

/** 종료 코드: 성공·같음 0, 비교 결과 다름 1, 사용법·입력·실행 오류 2. */
export function simMain(argv: readonly string[], io: SimIo): number {
  try {
    const [action, ...args] = argv;
    if ((action === 'help' || action === '--help') && !args.length) { io.out(USAGE); return 0; }
    if (action === 'd03') {
      const options = d03Options(args), start = io.now();
      const output = options.tablesFrom ? mergeD03(options.tablesFrom.map((path) => readOutput(path, io)), options.late) : runD03(options);
      writeD03(output, io, options.out);
      io.err(`실행 ${output.runs.length}회 · ${((io.now() - start) / 1000).toFixed(2)}초\n`);
      return 0;
    }
    if (action === 'run') {
      const options = new Map<string, string>();
      for (let i = 0; i < args.length; i += 2) {
        const key = args[i]!, value = args[i + 1];
        if (!['--scenarios', '--policies', '--seeds', '--out'].includes(key)) throw new Error(`알 수 없는 인수: ${key}`);
        if (!value || value.startsWith('--')) throw new Error(`인수 값이 필요합니다: ${key}`);
        if (options.has(key)) throw new Error(`중복 인수: ${key}`);
        options.set(key, value);
      }
      const count = integer(options.get('--seeds') ?? String(SIM_SEEDS.length), 1, SIM_SEEDS.length, '시드 수');
      const start = io.now();
      const output = runSuite({
        ...(options.has('--scenarios') ? { scenarioIds: options.get('--scenarios')!.split(',') } : {}),
        ...(options.has('--policies') ? { policyIds: options.get('--policies')!.split(',') } : {}),
        seeds: SIM_SEEDS.slice(0, count),
      });
      const text = serializeSimOutput(output);
      const path = options.get('--out');
      if (path) io.writeText(path, text); else io.out(text);
      io.err(`실행 ${output.runs.length}회 · ${((io.now() - start) / 1000).toFixed(2)}초\n`);
      return 0;
    }
    if (action === 'compare') {
      if (!(args.length === 2 || (args.length === 4 && args[2] === '--limit')) || args.slice(0, 2).some((a) => a.startsWith('--'))) {
        throw new Error('비교할 파일 두 개와 선택적인 --limit 값이 필요합니다.');
      }
      const limit = args.length === 4 ? integer(args[3]!, 0, Number.MAX_SAFE_INTEGER, '표시 한도') : 50;
      const result = compareOutputs(readOutput(args[0]!, io), readOutput(args[1]!, io));
      io.out(formatCompare(result, limit));
      return result.identical ? 0 : 1;
    }
    if (action === 'summary' && args.length === 1 && !args[0]!.startsWith('--')) {
      io.out(summarizeOutput(readOutput(args[0]!, io))); return 0;
    }
    throw new Error(action ? `명령이나 인수를 확인하세요: ${action}` : '명령이 필요합니다.');
  } catch (error) {
    io.err(`비교 실행기 오류: ${error instanceof Error ? error.message : String(error)}\n${USAGE}`);
    return 2;
  }
}
