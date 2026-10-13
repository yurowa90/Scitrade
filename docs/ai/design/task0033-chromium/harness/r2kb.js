// R2: 시세표 스크롤 칸(이름·focus-visible·키보드 가로 이동), 단일 값 Tab 제외.
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
async function tabList(page) {
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  const seq = []; let first = null;
  for (let i = 0; i < 200; i++) { await page.keyboard.press('Tab');
    const s = await page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; if (!a.dataset.tk) a.dataset.tk = String(Math.random()); return [a.dataset.tk, a.dataset.action || (a.getAttribute('role') === 'region' ? 'region' : a.tagName.toLowerCase())]; });
    if (!s) continue; if (s[0] === first) break; if (!first) first = s[0]; seq.push(s[1]); }
  return seq;
}
(async () => { for (const prof of (process.argv[2] || 'ipadminiL,p390,l1366').split(',')) {
  const o = { prof };
  { const { page, ctx, errors } = await L.open(prof, 'r33'); await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(1)); await L.sleep(500);
    o.d1 = await page.evaluate(() => { const r = document.querySelector('.market-table .table-scroll'); return { role: r.getAttribute('role'), name: r.getAttribute('aria-label'), scrolls: r.scrollWidth > r.clientWidth, sw: r.scrollWidth, cw: r.clientWidth,
      qtySelect: document.querySelectorAll('select[data-action="offer-quantity"]').length, qtySpan: [...document.querySelectorAll('.quantity-value')].map((s) => s.textContent.trim()), exchangeAmount: document.querySelector('[data-action="exchange-amount"]')?.tagName || document.querySelector('.exchange-amount-value')?.textContent }; });
    const seq = await tabList(page); o.d1.stops = seq.length; o.d1.qtyInTab = seq.filter((s) => s === 'offer-quantity').length; o.d1.regionInTab = seq.includes('region');
    if (o.d1.regionInTab) {
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      for (let i = 0; i < 60; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement?.getAttribute('role') === 'region')) break; }
      o.d1.focus = await page.evaluate(() => { const r = document.activeElement; const cs = getComputedStyle(r); return { fv: r.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset, x0: r.scrollLeft }; });
      for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight'); await L.sleep(300);
      o.d1.afterRight = await page.evaluate(() => document.activeElement.scrollLeft);
      await page.keyboard.press('End'); await L.sleep(300);
      o.d1.afterEnd = await page.evaluate(() => ({ x: document.activeElement.scrollLeft, max: document.activeElement.scrollWidth - document.activeElement.clientWidth, y: Math.round(scrollY) }));
      await page.keyboard.press('Home'); await L.sleep(300); o.d1.afterHome = await page.evaluate(() => document.activeElement.scrollLeft);
    }
    // 30묶음 환전을 넣어 USD 0 → 환전 금액이 글이 되는지, 방향 다음 Tab이 환전 단추인지
    await page.selectOption('[data-action="exchange-amount"]', '30'); await L.sleep(600);
    await L.tap(page, '[data-action="exchange"]', { touch: !!L.PROF[prof].o.hasTouch }); await L.sleep(700);
    o.lowUsd = await page.evaluate(() => ({ amount: document.querySelector('[data-action="exchange-amount"]')?.tagName || document.querySelector('.exchange-amount-value')?.textContent.trim(), reason: [...document.querySelectorAll('.exchange .reason')].map((p) => p.textContent.trim().slice(0, 40)), button: !!document.querySelector('.exchange [data-action="exchange"]'), barUsable: document.querySelector('.statusbar').textContent.match(/사용 가능[^U]*USD/)?.[0] }));
    await page.focus('[data-action="exchange-direction"]'); await page.keyboard.press('Tab');
    o.lowUsd.afterDirection = await page.evaluate(() => document.activeElement?.dataset.action || document.activeElement?.tagName);
    o.errors1 = errors.length; await ctx.close(); }
  { const { page, ctx, errors } = await L.open(prof, 'r33'); await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(8)); await L.sleep(500);
    o.d8 = await page.evaluate(() => ({ qtySelect: [...document.querySelectorAll('select[data-action="offer-quantity"]')].map((s) => s.options.length), qtySpan: document.querySelectorAll('.quantity-value').length }));
    const seq = await tabList(page); o.d8.stops = seq.length; o.d8.qtyInTab = seq.filter((s) => s === 'offer-quantity').length; o.errors8 = errors.length; await ctx.close(); }
  { const { page, ctx, errors } = await L.open(prof, 'r33'); await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(15)); await L.sleep(500);
    o.d15 = await page.evaluate(() => ({ qtySelect: [...document.querySelectorAll('select[data-action="offer-quantity"]')].map((s) => s.options.length + ':' + s.value), qtySpan: document.querySelectorAll('.quantity-value').length, accDisabled: [...document.querySelectorAll('[data-action="accept"]')].filter((b) => b.disabled).length }));
    const seq = await tabList(page); o.d15.stops = seq.length; o.d15.qtyInTab = seq.filter((s) => s === 'offer-quantity').length; o.errors15 = errors.length; await ctx.close(); }
  console.log(JSON.stringify(o)); }
  await L.done(); process.exit(0); })();
