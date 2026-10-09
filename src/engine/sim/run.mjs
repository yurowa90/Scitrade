// 화면 없는 비교 실행기의 Node 진입점. Vite 모듈 실행기로 cli.ts를 불러 실행한다(새 의존성 없음).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const entry = fileURLToPath(new URL('./cli.ts', import.meta.url));
try {
  const { module } = await runnerImport(entry, { configFile: false, logLevel: 'error' });
  process.exitCode = module.simMain(process.argv.slice(2), {
    readText: (path) => readFileSync(path, 'utf8'),
    writeText: (path, text) => writeFileSync(path, text),
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
    now: () => performance.now(),
  });
} catch (error) {
  process.stderr.write(`비교 실행기 오류: ${error?.stack ?? error}\n`);
  process.exitCode = 2;
}
