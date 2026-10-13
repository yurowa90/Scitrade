// TASK-0058 Chromium 실측: 운영 지표 높이(접힘/펼침), 환전 단추 기준점, 수량 낭독, 시세표 가로 위치, 위험 단계 막대
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
const rb = fs.readFileSync('r2bar.js', 'utf8'); const BAR = rb.slice(rb.indexOf('const BAR = ') + 12, rb.indexOf('};\n(async') + 1);
const DIST = process.argv[3] || 'v58';
async function open(prof, vp) { const r = vp ? await L.newPage(prof, { viewport: vp }) : await L.newPage(prof);
  await r.page.goto(`http://127.0.0.1:4390/${DIST}/index.html`); await r.page.waitForSelector('[data-action="end-day"]'); await r.page.evaluate(() => document.fonts.ready); await r.page.evaluate(eval(M)); return r; }
const H = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; };
const OPS = `(() => { const H = ${H}; const d = document.querySelector('#investment-details'); return { opsH: H('.report-ops'), whH: H('.warehouse'), invH: H('.investments'), open: d ? d.open : null, summary: d?.querySelector('summary')?.textContent, ofx: document.documentElement.scrollWidth - innerWidth }; })()`;
const P = () => new Promise((r) => setTimeout(r, 560));
async function warnTo(page, level) { // 1일 50묶음, 2일 최대 → 3일 경고, 이후 하루씩 넘겨 위험까지
  for (let d = 0; d < 2; d++) await page.evaluate(async () => { const p = () => new Promise((r) => setTimeout(r, 560)); const dir = document.querySelector('[data-action="exchange-direction"]'); dir.value = 'KRW_TO_USD'; dir.dispatchEvent(new Event('change', { bubbles: true })); await p();
    const a = document.querySelector('select[data-action="exchange-amount"]'); if (a) { a.value = a.options[a.options.length - 1].value; a.dispatchEvent(new Event('change', { bubbles: true })); await p(); }
    document.querySelector('[data-action="exchange"]').click(); await p(); document.querySelector('[data-action="end-day"]').click(); await new Promise((r) => setTimeout(r, 650)); });
  if (level === 'DANGER') for (let i = 0; i < 30; i++) { const t = await page.evaluate(() => document.querySelector('#payment-alert-h')?.textContent || ''); if (/위험/.test(t)) return i; await page.evaluate(async () => { await new Promise((r) => setTimeout(r, 560)); document.querySelector('[data-action="end-day"]').click(); await new Promise((r) => setTimeout(r, 650)); }); }
  return 0; }
(async () => {
  const part = process.argv[2];
  if (part === 'ops') for (const [label, prof, vp] of [['mouse1024', 'l1366', { width: 1024, height: 700 }], ['touch1024', 'cb1366t', { width: 1024, height: 700 }], ['mouse1366', 'l1366'], ['touch1366', 'cb1366t'], ['p390', 'p390']]) for (const day of [1, 8, 15, 30]) {
    const r = await open(prof, vp); const pg = r.page; await pg.evaluate((d) => window.measureM2(d), day); await L.sleep(500);
    const base = await pg.evaluate(OPS);
    let opened = null, queued = null;
    if (base.open === false) { await pg.evaluate(() => { document.querySelector('#investment-details summary').click(); }); await L.sleep(200); opened = await pg.evaluate(OPS);
      // 다시 접고, 투자를 대기열에 넣어 자동 펼침을 본다
      await pg.evaluate(() => { document.querySelector('#investment-details').open = false; }); await L.sleep(100);
      const has = await pg.evaluate(() => { const b = document.querySelector('[data-action="expand-warehouse"]') || document.querySelector('[data-action="sign-space-contract"]'); if (!b) return null; b.click(); return b.dataset.action; });
      await L.sleep(700); if (has) queued = { via: has, ...(await pg.evaluate(OPS)) }; }
    console.log(JSON.stringify({ label, day, base, opened, queued, errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'fxbtn') for (const [label, prof, vp] of [['mouse1366', 'l1366'], ['touch1024', 'ipadminiL'], ['mouse1024', 'l1366', { width: 1024, height: 700 }], ['p390', 'p390']]) for (const dir of ['USD_TO_KRW', 'KRW_TO_USD']) {
    const r = await open(prof, vp); const pg = r.page; await pg.evaluate(() => window.measureM2(1)); await L.sleep(400);
    if (dir === 'KRW_TO_USD') { await pg.evaluate(() => { const d = document.querySelector('[data-action="exchange-direction"]'); d.value = 'KRW_TO_USD'; d.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(600); }
    await pg.evaluate(() => { const b = document.querySelector('[data-action="exchange"]'); const r = b.getBoundingClientRect(); scrollBy(0, r.bottom - innerHeight + 2); });
    await L.sleep(200); const pre = await pg.evaluate(() => { const r = document.querySelector('[data-action="exchange"]').getBoundingClientRect(); return { bottom: Math.round(r.bottom), ih: innerHeight }; });
    await L.tap(pg, '[data-action="exchange"]', { touch: prof !== 'l1366', scrollIfNeeded: false }); await L.sleep(500);
    const post = await pg.evaluate(() => { const b = document.querySelector('[data-action="exchange"]'); const r = b.getBoundingClientRect(); const t = document.querySelector('.flash-toast'); const tr = t?.getBoundingClientRect();
      return { btnTop: Math.round(r.top), btnBottom: Math.round(r.bottom), toastTop: tr ? Math.round(tr.top) : null, gap: tr ? Math.round(tr.top - r.bottom) : null, limit: innerHeight - 72, focused: document.activeElement === b, fv: b.matches(':focus-visible'), toastKind: t?.className, toast: t?.textContent.slice(0, 80), queue: document.querySelectorAll('ol.pending li').length, describedby: b.getAttribute('aria-describedby') }; });
    console.log(JSON.stringify({ label, dir, pre, post, errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'qty') for (const [label, prof] of [['mouse1366', 'l1366'], ['touch1024', 'ipadminiL']]) for (const day of [1, 8]) {
    const r = await open(prof); const pg = r.page; await pg.evaluate((d) => window.measureM2(d), day); await L.sleep(400);
    const res = await pg.evaluate(async () => { const out = []; const sels = [...document.querySelectorAll('select[data-action="offer-quantity"]')];
      for (let si = 0; si < sels.length; si++) { let s = document.querySelectorAll('select[data-action="offer-quantity"]')[si]; const key = s.dataset.key; const n = s.options.length; const seq = [];
        const order = [...Array(n).keys()]; order.push(...[...Array(n).keys()].reverse()); 
        for (const i of order) { s = document.querySelector(`select[data-action="offer-quantity"][data-key="${CSS.escape(key)}"]`); const toastBefore = document.querySelector('.flash-toast')?.textContent || '';
          s.value = s.options[i].value; s.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 120));
          s = document.querySelector(`select[data-action="offer-quantity"][data-key="${CSS.escape(key)}"]`); const ids = (s.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
          const btn = s.closest('li,article,section,div')?.querySelector('[data-action="accept"],button[data-action^="accept"]') || null;
          seq.push({ i, v: s.value, live: document.getElementById('live-status').textContent, desc: ids.map((id) => !!document.getElementById(id)), descText: ids.map((id) => document.getElementById(id)?.textContent.slice(0, 40)), toastSame: (document.querySelector('.flash-toast')?.textContent || '') === toastBefore, focus: document.activeElement === s, btnDisabled: btn ? btn.disabled : null, btnDesc: btn ? btn.getAttribute('aria-describedby') : null }); }
        out.push({ key, n, seq }); } return out; });
    console.log(JSON.stringify({ label, day, res, errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'mkt') for (const [label, prof, from, to] of [['1024to900', 'l1366', 1024, 900], ['900to1024', 'l1366', 900, 1024], ['ipadminiL-portrait', 'ipadminiL', 1024, 768]]) {
    const r = await open(prof, { width: from, height: 700 }); const pg = r.page; await pg.evaluate(() => window.measureM2(1)); await L.sleep(400);
    const before = await pg.evaluate(() => { const m = document.getElementById('market-scroll'); m.scrollIntoView({ block: 'center' }); m.focus(); m.scrollLeft = 120; return { sl: m.scrollLeft, max: m.scrollWidth - m.clientWidth, fv: m.matches(':focus-visible'), tabindex: m.getAttribute('tabindex') }; });
    await pg.keyboard.press('ArrowRight'); await L.sleep(200); const afterKey = await pg.evaluate(() => document.getElementById('market-scroll').scrollLeft);
    await pg.setViewportSize({ width: to, height: 700 }); await L.sleep(700);
    const after = await pg.evaluate(() => { const m = document.getElementById('market-scroll'); const r = m.getBoundingClientRect(); return { sl: m.scrollLeft, max: m.scrollWidth - m.clientWidth, focused: document.activeElement === m, active: document.activeElement?.id || document.activeElement?.tagName, inView: r.bottom > 0 && r.top < innerHeight, cols: getComputedStyle(document.querySelector('main, #app > *')).gridTemplateColumns }; });
    console.log(JSON.stringify({ label, before, afterKey, after, errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'danger') for (const touch of [false, true]) for (const w of [1001, 1024, 1366]) {
    const r = await open(touch ? 'cb1366t' : 'l1366', { width: w, height: 700 }); await r.page.evaluate(() => window.measureM2(1)); await L.sleep(300);
    const extra = await warnTo(r.page, 'DANGER'); const v = await r.page.evaluate(`(${BAR})()`);
    const a = await r.page.evaluate(() => ({ day: document.querySelector('.day, [data-day]')?.textContent, alert: document.querySelector('#payment-alert-h')?.textContent, stat: [...document.querySelectorAll('.operations-statusbar > *')].map((e) => e.textContent.replace(/\s+/g, ' ').slice(0, 40)).find((t) => /위험|경고/.test(t)) }));
    console.log(JSON.stringify({ input: touch ? 'touch' : 'mouse', w, extraDays: extra, alert: a.alert, stat: a.stat, h: v.h, oneLine: v.oneLine, barOverflow: v.barOverflow, ofx: v.ofx, overlaps: v.overlaps, clipped: v.clipped, endDay: v.endDay, stats: v.stats.map((s) => s.t + '/' + s.w), errors: r.errors.length })); await r.ctx.close(); }
  if (part === 'a11y1') for (const st of ['normal', 'warn']) { // 환전 경고 문장 aria-describedby
    const r = await open('l1366'); const pg = r.page; await pg.evaluate(() => window.measureM2(1)); await L.sleep(300);
    if (st === 'warn') await warnTo(pg, 'WARNING');
    const out = []; for (const dir of ['USD_TO_KRW', 'KRW_TO_USD']) { await pg.evaluate((d) => { const s = document.querySelector('[data-action="exchange-direction"]'); s.value = d; s.dispatchEvent(new Event('change', { bubbles: true })); }, dir); await L.sleep(600);
      for (const pick of ['first', 'last']) { await pg.evaluate((p) => { const a = document.querySelector('select[data-action="exchange-amount"]'); if (!a) return; a.value = a.options[p === 'first' ? 0 : a.options.length - 1].value; a.dispatchEvent(new Event('change', { bubbles: true })); }, pick); await L.sleep(600);
        out.push(await pg.evaluate(([d, p]) => { const b = document.querySelector('[data-action="exchange"]'); const ids = (b.getAttribute('aria-describedby') || '').split(' ').filter(Boolean); return { dir: d, pick: p, ids, exist: ids.map((i) => !!document.getElementById(i)), texts: ids.map((i) => document.getElementById(i)?.textContent.slice(0, 50)), reasons: document.querySelectorAll('.exchange .reason').length, upcoming: [...document.querySelectorAll('.exchange p')].map((e) => e.textContent).find((t) => /선복 요금/.test(t)) || null, disabled: b.disabled }; }, [dir, pick])); } }
    console.log(JSON.stringify({ st, out, errors: r.errors.length })); await r.ctx.close(); }
  await L.done(); process.exit(0);
})();
