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
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
