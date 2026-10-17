const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
const DIST = process.argv[2] || 'v58';
async function open(prof, vp) { const r = vp ? await L.newPage(prof, { viewport: vp }) : await L.newPage(prof); await r.page.goto(`http://127.0.0.1:4390/${DIST}/index.html`); await r.page.waitForSelector('[data-action="end-day"]'); await r.page.evaluate(() => document.fonts.ready); await r.page.evaluate(eval(M)); return r; }
(async () => {
  // 1) 키보드로 수량 바꾸기: 초점 유지
  for (const prof of ['l1366', 'ipadminiL']) { const r = await open(prof); const pg = r.page; await pg.evaluate(() => window.measureM2(8)); await L.sleep(400);
    const sel = 'select[data-action="offer-quantity"][data-key^="MKT-D008-COS"]'; await pg.focus(sel); const seq = [];
    for (const k of ['ArrowDown', 'ArrowUp']) { await pg.keyboard.press(k); await L.sleep(300); seq.push(await pg.evaluate((s) => { const e = document.querySelector(s); return { v: e.value, focused: document.activeElement === e, fv: e.matches(':focus-visible'), live: document.getElementById('live-status').textContent.slice(0, 40), inView: e.getBoundingClientRect().bottom <= innerHeight }; }, sel)); }
    console.log(JSON.stringify({ part: 'qtykey', prof, seq, errors: r.errors.length })); await r.ctx.close(); }
  // 2) 시세표: 넘치는 폭(390·1000 한 열)에서 넘긴 뒤 재그리기·폭 전환
  for (const [label, prof, from, to] of [['p390-rerender', 'p390', 390, 390], ['p390-to-844', 'p390', 390, 844], ['1000to1024', 'l1366', 1000, 1024], ['1024to1000', 'l1366', 1024, 1000]]) {
    const r = await open(prof, { width: from, height: prof === 'p390' ? 844 : 700 }); const pg = r.page; await pg.evaluate(() => window.measureM2(1)); await L.sleep(400);
    const before = await pg.evaluate(() => { const m = document.getElementById('market-scroll'); m.scrollIntoView({ block: 'center' }); m.focus({ preventScroll: true }); m.scrollLeft = 150; return { sl: m.scrollLeft, max: m.scrollWidth - m.clientWidth }; });
    // 재그리기 유발: 환전 방향 바꾸기 → 다시 시세표에 초점
    await pg.evaluate(() => { const d = document.querySelector('[data-action="exchange-direction"]'); d.value = 'KRW_TO_USD'; d.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(600);
    const rerender = await pg.evaluate(() => { const m = document.getElementById('market-scroll'); return { sl: m.scrollLeft, active: document.activeElement?.id || document.activeElement?.dataset.action || document.activeElement?.tagName }; });
    await pg.evaluate(() => document.getElementById('market-scroll').focus({ preventScroll: true }));
    if (to !== from) { await pg.setViewportSize({ width: to, height: prof === 'p390' ? 844 : 700 }); await L.sleep(800); }
    const after = await pg.evaluate(() => { const m = document.getElementById('market-scroll'); const r = m.getBoundingClientRect(); return { sl: m.scrollLeft, max: m.scrollWidth - m.clientWidth, active: document.activeElement?.id || document.activeElement?.tagName, inView: r.bottom > 0 && r.top < innerHeight }; });
    console.log(JSON.stringify({ part: 'mkt', label, before, rerender, after, errors: r.errors.length })); await r.ctx.close(); }
  // 3) 마지막 날 투자 단추
  { const r = await open('l1366'); const pg = r.page; await pg.evaluate(() => window.measureM2(30)); await L.sleep(400);
    console.log(JSON.stringify({ part: 'day30', ...(await pg.evaluate(() => ({ day: document.querySelector('.operations-statusbar')?.textContent.replace(/\s+/g, ' ').slice(0, 30), expand: !!document.querySelector('[data-action="expand-warehouse"]'), space: document.querySelectorAll('[data-action="sign-space-contract"]').length, inv: document.querySelector('#investment-details')?.textContent.replace(/\s+/g, ' ').slice(0, 300) }))) })); await r.ctx.close(); }
  await L.done(); process.exit(0); })();
