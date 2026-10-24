import base from './vite.config.ts';
import { readFileSync } from 'node:fs';
const targets = (process.env.STUB ?? '').split(',').filter(Boolean);
const stubPlugin = {
  name: 'stub', enforce: 'pre' as const,
  load(id: string) {
    const hit = targets.find((t) => id.endsWith(t));
    if (!hit) return null;
    const src = readFileSync(id, 'utf8');
    const names = [...src.matchAll(/export (?:async )?(?:function|const|let|class) ([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    return names.map((n) => `export const ${n} = (() => { const f = () => ''; return new Proxy(f, { get: () => f }); })();`).join('\n') || 'export {}';
  },
};
export default async (env: unknown) => { const c = await (base as (e: unknown) => Promise<Record<string, unknown>>)(env); return { ...c, plugins: [stubPlugin, ...(c.plugins as unknown[])] }; };
