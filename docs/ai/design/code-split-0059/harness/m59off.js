// TASK-0059 오프라인 흉내: 지연 청크(ops-screens·culture-panel) 요청을 막고 푼다.
const L = require('./blib'); const fs = require('fs'); const path = require('path');
const DIST = process.argv[2] || 'b59r1'; const ROOT = `/tmp/claude-0/-home-user-Scitrade/3ec112a5-057f-529d-b1f4-e55e1685814c/scratchpad/b/${DIST}/dist`;
const LAZY = /(ops-screens|culture-panel)-[^/]*\.js$/;
async function page(prof, blockFromStart) {
  const st = { block: blockFromStart, served: [], aborted: [] };
  const b = await (require('/opt/node-tools/node_modules/playwright').chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const ctx = await b.newContext({ ...L.PROF[prof].o, locale: 'ko-KR' });
  await ctx.route(/https:\/\/fonts\./, (r) => r.abort());
  await ctx.route(/^http:\/\/127\.0\.0\.1:4390\/.*/, async (route) => {
    const u = new URL(route.request().url()); const rel = u.pathname.split('/').slice(2).join('/') || 'index.html'; const f = path.join(ROOT, rel);
    if (LAZY.test(rel) && st.block) { st.aborted.push(rel.replace(/-[^-]*\.js$/, '')); return route.abort('internetdisconnected'); }
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    if (LAZY.test(rel)) st.served.push(rel.replace(/-[^-]*\.js$/, ''));
    const ct = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream';
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': ct } });
  });
  const pg = await ctx.newPage(); const errors = []; const warns = [];
  pg.on('pageerror', (e) => errors.push(String(e))); pg.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text().slice(0, 80)); }); pg.on('dialog', (d) => d.accept().catch(() => {}));
  await pg.goto(`http://127.0.0.1:4390/${DIST}/index.html`); await pg.waitForSelector('[data-action="end-day"]');
  return { b, pg, st, errors, warns };
}
const snap = (pg) => pg.evaluate(() => ({ scen: document.querySelector('select[data-action="scenario"]').value, ops: !!document.querySelector('.operations-statusbar'), day: document.querySelector('.topbar')?.textContent.match(/(\d+)일 \//)?.[1], toast: (document.querySelector('.flash-toast')?.className || '') + ' ' + (document.querySelector('.flash-toast')?.textContent || '').slice(0, 60), panel: !!document.getElementById('local-h') && !!document.querySelector('[data-action="culture-close"]'), pending: document.querySelectorAll('ol.pending li').length }));
const selectScen = (pg, id) => pg.evaluate((v) => { const s = document.querySelector('select[data-action="scenario"]'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, id);
(async () => {
  const prof = process.argv[3] || 'l1366'; const out = (o) => console.log(JSON.stringify({ prof, ...o }));
  // A. 미리 받기 뒤 끊기
  { const r = await page(prof, false); await L.sleep(2500); const pre = [...r.st.served]; r.st.block = true;
    await L.tap(r.pg, '#local-tab'); await L.sleep(500); const a1 = await snap(r.pg);
    await L.tap(r.pg, '[data-action="culture-close"][data-where="head"]'); await selectScen(r.pg, 'SCENARIO_M2_OPERATIONS'); await L.sleep(800); const a2 = await snap(r.pg);
    out({ case: 'A-prefetched-then-offline', prefetched: pre, culture: a1, scenario: a2, aborted: r.st.aborted, errors: r.errors, warns: r.warns }); await r.b.close(); }
  // B. 미리 받기 전 끊기 → 실패 → 다시 연결 → 재시도
  { const r = await page(prof, true); await L.sleep(1500); const before = await snap(r.pg);
    await L.tap(r.pg, '#local-tab'); await L.sleep(500); const b1 = await snap(r.pg);
    await L.endDay(r.pg); await L.sleep(400); // 상태가 그대로 진행되는지(하루 진행은 지연 모듈 없이 됨)
    const dayAfter = await snap(r.pg);
    await L.tap(r.pg, '[data-action="queue"], [data-action="accept"]').catch(() => {});
    const beforeScen = await snap(r.pg);
    await selectScen(r.pg, 'SCENARIO_M2_OPERATIONS'); await L.sleep(800); const b2 = await snap(r.pg);
    r.st.block = false; await L.sleep(600);
    await L.tap(r.pg, '#local-tab'); await L.sleep(600); const b3 = await snap(r.pg);
    await L.tap(r.pg, '[data-action="culture-close"][data-where="head"]').catch(() => {});
    await selectScen(r.pg, 'SCENARIO_M2_OPERATIONS'); await L.sleep(900); const b4 = await snap(r.pg);
    out({ case: 'B-offline-before-prefetch', before, cultureFail: b1, dayAfter, beforeScen, scenarioFail: b2, cultureRetry: b3, scenarioRetry: b4, aborted: r.st.aborted, served: r.st.served, errors: r.errors, warns: r.warns }); await r.b.close(); }
  // C. ‘결과 보기’ 실패 뒤 탭으로 재진입: 활동을 넣은 저장을 만들고, 막힌 새 페이지에서 불러온다.
  { const r = await page(prof, false); await L.sleep(1500);
    await L.tap(r.pg, '#local-tab'); await L.tap(r.pg, '[data-action="culture-act"]'); await L.tap(r.pg, '[data-action="culture-emp"]:not([disabled])'); await L.tap(r.pg, '[data-action="culture-queue"]'); await L.tap(r.pg, '[data-action="culture-close"][data-where="head"]');
    await L.endDay(r.pg); await L.sleep(400); await L.tap(r.pg, '[data-action="save"]'); await L.sleep(300);
    const saved = await r.pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]))); await r.b.close();
    const q = await page(prof, true);
    await q.pg.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, saved);
    await L.tap(q.pg, '[data-action="load"]'); await L.sleep(500); const c0 = await snap(q.pg);
    await L.endDay(q.pg); await L.sleep(500); const c1 = await snap(q.pg); const hasResult = await q.pg.$('[data-action="culture-result"]');
    if (hasResult) await L.tap(q.pg, '[data-action="culture-result"]'); await L.sleep(500); const c2 = await snap(q.pg);
    q.st.block = false; await L.tap(q.pg, '#local-tab'); await L.sleep(700); const c3 = await snap(q.pg);
    const res = await q.pg.evaluate(() => { const h = document.querySelector('[id^="culture-result-h-"]'); return h ? h.textContent.slice(0, 40) : null; });
    out({ case: 'C-result-fail-then-tab', loaded: c0, afterEnd: c1, resultButton: !!hasResult, resultFail: c2, tabRetry: c3, resultHeading: res, aborted: q.st.aborted, errors: q.errors, warns: q.warns }); await q.b.close(); }
  process.exit(0);
})();
