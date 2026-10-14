// TASK-0059 R2 오프라인 흉내. mode: block(처음부터 끊음, 미리 받기도 실패) | hold(미리 받기 응답을 붙잡아 두었다가 끊음)
const L = require('./blib'); const fs = require('fs'); const path = require('path');
const DIST = process.argv[2] || 'b59r2'; const ROOT = `/tmp/claude-0/-home-user-Scitrade/3ec112a5-057f-529d-b1f4-e55e1685814c/scratchpad/b/${DIST}/dist`;
const LAZY = /(ops-screens|culture-panel)-[^/]*\.js$/; const PW = require('/opt/node-tools/node_modules/playwright');
async function page(prof, mode, storage) {
  const st = { mode, held: [], log: [], dialogs: [] };
  const b = await PW.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ ...L.PROF[prof].o, locale: 'ko-KR' });
  await ctx.route(/https:\/\/fonts\./, (r) => r.abort());
  await ctx.route(/^http:\/\/127\.0\.0\.1:4390\/.*/, async (route) => {
    const rel = new URL(route.request().url()).pathname.split('/').slice(2).join('/') || 'index.html'; const f = path.join(ROOT, rel); const short = rel.replace(/^assets\//, '').replace(/-[^-]*\.js$/, '');
    if (LAZY.test(rel)) { st.log.push(`${st.mode}:${short}`); if (st.mode === 'block') return route.abort('internetdisconnected'); if (st.mode === 'hold') { st.held.push(route); return; } }
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    const ct = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream';
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': ct } });
  });
  if (storage) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, storage);
  const pg = await ctx.newPage(); const errors = [];
  pg.on('pageerror', (e) => errors.push(String(e))); pg.on('dialog', (d) => { st.dialogs.push(d.type()); d.accept().catch(() => {}); });
  await pg.goto(`http://127.0.0.1:4390/${DIST}/index.html`); await pg.waitForSelector('[data-action="end-day"]');
  return { b, pg, st, errors };
}
const snap = (pg) => pg.evaluate(() => ({ scen: document.querySelector('select[data-action="scenario"]').value, ops: !!document.querySelector('.operations-statusbar'), day: document.querySelector('.topbar')?.textContent.match(/(\d+)일 \//)?.[1], toast: (document.querySelector('.flash-toast')?.className.replace('flash-toast flash ', '') || '') + ' ' + (document.querySelector('.flash-toast')?.firstChild?.textContent || ''), reloadBtn: !!document.querySelector('.flash-toast [data-action="reload"]'), panel: !!document.querySelector('[data-action="culture-close"]'), pending: document.querySelectorAll('ol.pending li').length, nav: performance.getEntriesByType('navigation')[0].type }));
const selectScen = (pg, id) => pg.evaluate((v) => { const s = document.querySelector('select[data-action="scenario"]'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, id);
const enter = async (pg, kind) => { if (kind === 'ops') await selectScen(pg, 'SCENARIO_M2_OPERATIONS'); else await L.tap(pg, '#local-tab'); await L.sleep(700); };
(async () => {
  const prof = process.argv[3] || 'l1366'; const out = (o) => console.log(JSON.stringify({ prof, ...o }));
  for (const kind of ['ops', 'culture']) for (const mode of ['hold', 'block']) {
    const r = await page(prof, mode); await L.sleep(1200);
    await L.endDay(r.pg); await L.sleep(400); // 저장하지 않은 진행을 만든다
    const steps = [];
    if (mode === 'hold') { if (kind === 'ops') await selectScen(r.pg, 'SCENARIO_M2_OPERATIONS'); else await L.tap(r.pg, '#local-tab'); await L.sleep(200); }
    // hold: 붙잡은 미리 받기 요청을 끊는다(진입이 그 약속을 같이 기다림)
    if (mode === 'hold') { r.st.mode = 'block'; for (const h of r.st.held.splice(0)) await h.abort('internetdisconnected'); await L.sleep(700); steps.push({ at: 'first', ...(await snap(r.pg)) }); }
    else { await enter(r.pg, kind); steps.push({ at: 'first', ...(await snap(r.pg)) }); }
    r.st.mode = 'serve'; // 다시 연결
    await enter(r.pg, kind); steps.push({ at: 'retry', ...(await snap(r.pg)) });
    await enter(r.pg, kind); steps.push({ at: 'third', ...(await snap(r.pg)) });
    const btn = await r.pg.$('.flash-toast [data-action="reload"]');
    if (btn) { await L.tap(r.pg, '.flash-toast [data-action="reload"]'); await r.pg.waitForLoadState('load').catch(() => {}); await r.pg.waitForSelector('[data-action="end-day"]'); await L.sleep(1500);
      steps.push({ at: 'reloaded', ...(await snap(r.pg)) }); await enter(r.pg, kind); steps.push({ at: 'after-reload-enter', ...(await snap(r.pg)) }); }
    out({ kind, mode, steps, dialogs: r.st.dialogs, requests: r.st.log, errors: r.errors }); await r.b.close(); }
  // load 경로: 규칙 2 저장을 만들고, 끊긴 새 페이지에서 불러오기 두 번
  { const r = await page(prof, 'serve'); await L.sleep(1200); await selectScen(r.pg, 'SCENARIO_M2_OPERATIONS'); await L.sleep(700); await L.endDay(r.pg); await L.sleep(400); await L.tap(r.pg, '[data-action="save"]'); await L.sleep(300);
    const saved = await r.pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]))); await r.b.close();
    const q = await page(prof, 'block', saved); await L.sleep(1200); const steps = [];
    for (const at of ['load1', 'load2']) { await L.tap(q.pg, '[data-action="load"]'); await L.sleep(700); steps.push({ at, ...(await snap(q.pg)) }); }
    const after = await q.pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
    out({ kind: 'load', steps, storageUnchanged: JSON.stringify(after) === JSON.stringify(saved), dialogs: q.st.dialogs, requests: q.st.log, errors: q.errors }); await q.b.close(); }
  process.exit(0);
})();
