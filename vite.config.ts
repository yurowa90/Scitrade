import { defineConfig } from 'vitest/config';

type ExecSync = (command: string, options?: { encoding?: string; stdio?: unknown }) => string;

/** 화면에 보일 빌드 표시. git이 없으면 'dev'. 추적 파일이 바뀌었으면 '+수정'. */
async function buildId(): Promise<string> {
  try {
    const { execSync } = (await import('node:child_process' as string)) as { execSync: ExecSync };
    const run = (command: string) => execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const hash = run('git rev-parse --short=7 HEAD');
    const dirty = run('git status --porcelain --untracked-files=no') !== '';
    return /^[0-9a-f]{7,}$/.test(hash) ? `${hash}${dirty ? '+수정' : ''}` : 'dev';
  } catch {
    return 'dev';
  }
}

export default defineConfig(async () => ({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(await buildId()) },
  build: {
    rolldownOptions: {
      output: {
        // data/*.json을 코드와 다른 청크(data)로 나눈다. 목적은 청크마다 크기 한도(500,000 B)를 관리하는 것이다.
        // 두 청크 모두 첫 화면에서 받는다(코드는 script, data는 modulepreload). 첫 화면에 받는 양은 나누기 전과 거의 같다.
        // 코드만 바꿔도 import 순서가 바뀌어 자료 모듈의 순서가 달라지면 data 청크 이름이 바뀐다. 캐시 이득은 약속하지 않는다.
        // PACKAGE_STATUS.json·src/assets/manifest.json은 data 폴더 밖이라 코드 청크에 남는다.
        codeSplitting: { groups: [{ name: 'data', test: /[\\/]data[\\/][^\\/]+\.json$/ }] },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
