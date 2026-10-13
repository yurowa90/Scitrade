// TASK-0034 실측: 운영 지표 높이, 새 표 넘침, 투자 단추 Tab·Enter·빼기, 경고+대기열 막대
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
const rb = fs.readFileSync('r2bar.js', 'utf8'); const BAR = rb.slice(rb.indexOf('const BAR = ') + 12, rb.indexOf('};\n(async') + 1);
const DIST = process.argv[3] || 'c34';
async function open(prof, vp) { const r = vp ? await L.newPage(prof, { viewport: vp }) : await L.newPage(prof);
  await r.page.goto(`http://127.0.0.1:4390/${DIST}/index.html`); await r.page.waitForSelector('[data-action="end-day"]'); await r.page.evaluate(() => document.fonts.ready); await r.page.evaluate(eval(M)); return r; }
const OPS = () => { const o = document.querySelector('.report-ops'); if (!o) return null; const R = (e) => e ? Math.round(e.getBoundingClientRect().height) : null;
  const tbl = (s) => { const t = document.querySelector(s); if (!t) return null; const p = t.parentElement; const cells = [...t.querySelectorAll('th,td')]; return { w: Math.round(t.getBoundingClientRect().width), parentW: p.clientWidth, over: Math.round(t.getBoundingClientRect().right - p.getBoundingClientRect().right), cellOverflow: cells.filter((c) => c.scrollWidth > c.clientWidth + 1).length, h: R(t), rows: t.querySelectorAll('tr').length }; };
  return { opsH: R(o), warehouseH: R(document.querySelector('.warehouse')), investH: R(document.querySelector('.investments')), summary: tbl('.warehouse-summary'), bottleneck: tbl('.weekly-bottleneck'), ofx: document.documentElement.scrollWidth - innerWidth }; };
async function warn(page) { // 1일 KRW→USD 50묶음, 2일 21묶음(최대) → 3일 경고
  for (let d = 0; d < 2; d++) await page.evaluate(async () => { const p = () => new Promise((r) => setTimeout(r, 550)); const dir = document.querySelector('[data-action="exchange-direction"]'); dir.value = 'KRW_TO_USD'; dir.dispatchEvent(new Event('change', { bubbles: true })); await p();
    const a = document.querySelector('select[data-action="exchange-amount"]'); if (a) { a.value = a.options[a.options.length - 1].value; a.dispatchEvent(new Event('change', { bubbles: true })); await p(); }
    document.querySelector('[data-action="exchange"]').click(); await p(); document.querySelector('[data-action="end-day"]').click(); await new Promise((r) => setTimeout(r, 650)); }); }
async function queueUsdToKrw(page) { await page.evaluate(async () => { const p = () => new Promise((r) => setTimeout(r, 550)); const dir = document.querySelector('[data-action="exchange-direction"]'); dir.value = 'USD_TO_KRW'; dir.dispatchEvent(new Event('change', { bubbles: true })); await p(); document.querySelector('[data-action="exchange"]').click(); await p(); }); }
(async () => {
  const part = process.argv[2];
  if (part === 'ops') for (const [label, prof, vp] of [['mouse1024', 'l1366', { width: 1024, height: 700 }], ['touch1024', 'cb1366t', { width: 1024, height: 700 }], ['mouse1366', 'l1366'], ['touch1366', 'cb1366t'], ['ipadminiL', 'ipadminiL'], ['p390', 'p390'], ['t768', 't768']]) for (const day of [1, 8, 15, 30]) {
    const r = await open(prof, vp); await r.page.evaluate((d) => window.measureM2(d), day); await L.sleep(500);
    console.log(JSON.stringify({ label, day, ...(await r.page.evaluate(`(${OPS})()`)), errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'tab') for (const prof of ['l1366', 'ipadminiL', 'p390']) {
    const r = await open(prof); const page = r.page; await page.evaluate(() => window.measureM2(1)); await L.sleep(400);
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    const seq = []; for (let i = 0; i < 120; i++) { await page.keyboard.press('Tab'); const a = await page.evaluate(() => { const e = document.activeElement; return e ? (e.dataset.action || e.tagName.toLowerCase()) + (e.dataset.route ? ':' + e.dataset.route.slice(0, 7) : '') : null; }); seq.push(a); if (a && a.startsWith('expand-warehouse')) break; }
    const iExp = seq.length; const fv = await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { fv: e.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth}`, h: Math.round(r.height), inView: r.top >= 0 && r.bottom <= innerHeight }; });
    const after = []; for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); after.push(await page.evaluate(() => { const e = document.activeElement; return (e.dataset.action || e.tagName.toLowerCase()) + (e.dataset.route ? ':' + e.dataset.route.slice(0, 7) : ''); })); }
    // 창고 확장 단추로 돌아가 Enter
    await page.focus('[data-action="expand-warehouse"]'); await page.keyboard.press('Enter'); await L.sleep(700);
    const enter = await page.evaluate(() => { const e = document.activeElement; return { focus: (e?.dataset.action || e?.id || e?.tagName), expandBtn: !!document.querySelector('[data-action="expand-warehouse"]'), text: document.querySelector('.investments')?.textContent.replace(/\s+/g, ' ').slice(0, 90), queue: document.querySelectorAll('ol.pending li').length, live: document.querySelector('[aria-live]')?.textContent.trim().slice(0, 60) }; });
    // 빼기
    const un = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-action="unqueue"]')].find((x) => /창고/.test(x.getAttribute('aria-label') || '')); return b ? b.getAttribute('aria-label') : null; });
    if (un) { await page.focus(`[data-action="unqueue"][aria-label="${un}"]`); await page.keyboard.press('Enter'); await L.sleep(700); }
    const unq = await page.evaluate(() => { const e = document.activeElement; return { focus: (e?.dataset.action || e?.id || e?.tagName), expandBtn: !!document.querySelector('[data-action="expand-warehouse"]'), queue: document.querySelectorAll('ol.pending li').length }; });
    // Space로 선복 계약
    await page.focus('[data-action="sign-space-contract"]'); await page.keyboard.press('Space'); await L.sleep(700);
    const space = await page.evaluate(() => ({ queue: document.querySelectorAll('ol.pending li').length, focus: document.activeElement?.dataset.action || document.activeElement?.tagName, btns: document.querySelectorAll('[data-action="sign-space-contract"]').length }));
    console.log(JSON.stringify({ prof, tabToExpand: iExp, tail: seq.slice(-6), focusVisible: fv, nextTabs: after, enter, unqueueLabel: un, unq, space, errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'warn') for (const touch of [false, true]) for (const w of [1001, 1024, 1366]) {
    const r = await open(touch ? 'cb1366t' : 'l1366', { width: w, height: 700 }); await r.page.evaluate(() => window.measureM2(1)); await L.sleep(300); await warn(r.page);
    const before = await r.page.evaluate(`(${BAR})()`); await queueUsdToKrw(r.page); await L.sleep(300);
    const v = await r.page.evaluate(`(${BAR})()`); const fc = await r.page.evaluate(() => document.querySelector('.payment-forecast')?.textContent);
    console.log(JSON.stringify({ input: touch ? 'touch' : 'mouse', w, beforeH: before.h, beforeOne: before.oneLine, forecast: fc, h: v.h, oneLine: v.oneLine, barOverflow: v.barOverflow, ofx: v.ofx, overlaps: v.overlaps, clipped: v.clipped, endDay: v.endDay, stats: v.stats.map((s) => s.t + '/' + s.w), errors: r.errors.length })); await r.ctx.close(); }
  await L.done(); process.exit(0);
})();
