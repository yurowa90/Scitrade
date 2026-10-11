// O3b(한 열이면 화면 코드 순서를 바꿔 그림) 회전·창 크기 바뀜 확인: 1180×820 → 1000×700 → 1180×820.
// 초점(동료 필터 단추·일정 단추)이 남는지, 화면 코드 순서, 오류, 다시 그린 횟수(innerHTML 해시 변화).
// 사용: node mq.js <dists>
const M = require('./m'); const L = M.L; const K = require('./kbcore');
const dists = (process.argv[2] || 'head,o3b').split(',');
const sleep = L.sleep;
const state = (page) => page.evaluate(() => {
  const a = document.activeElement; const r = a?.getBoundingClientRect();
  const kids = [...document.querySelectorAll('main > *')].map((e) => ['maincol', 'trade', 'crew', 'resources', 'queue', 'world', 'report', 'log'].find((c) => e.classList.contains(c)));
  return { w: innerWidth, dom: kids.join('>'), focus: a ? (a.dataset?.action || a.id || a.tagName) + (a.dataset?.filter ? ':' + a.dataset.filter : '') : null, focusTop: r ? Math.round(r.top) : null, sy: Math.round(scrollY), cols: getComputedStyle(document.querySelector('main')).gridTemplateColumns.split(' ').length };
});
(async () => {
  for (const dist of dists) {
    const out = { dist };
    const { page, ctx, errors } = await L.open('ipadAirL', dist); await K.setup(page);
    await M.tap(page, 'ipadAirL', '[data-action="accept"][data-buy="OFFER_BUY_01"]'); await M.endDay(page, 'ipadAirL'); await sleep(600);
    for (const sel of ['#schedule-toggle', '.crew [data-action="crew-filter"]']) {
      await page.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); e.focus(); }, sel); await sleep(200);
      const s0 = await state(page);
      await page.setViewportSize({ width: 1000, height: 700 }); await sleep(500);
      const s1 = await state(page);
      // 한 열에서 Tab 한 번·Shift+Tab 한 번(정지점이 이어지는지)
      await page.keyboard.press('Tab'); await sleep(100); const t1 = await K.fo(page); await page.keyboard.press('Shift+Tab'); await sleep(100); const t2 = await K.fo(page);
      await page.setViewportSize({ width: 1180, height: 820 }); await sleep(500);
      const s2 = await state(page);
      out[sel] = { before: s0, oneCol: s1, tab: `${t1.r}:${t1.act || t1.id}`, back: `${t2.r}:${t2.act || t2.id}`, after: s2 };
    }
    out.errors = errors;
    console.log(JSON.stringify(out));
    await ctx.close();
  }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
