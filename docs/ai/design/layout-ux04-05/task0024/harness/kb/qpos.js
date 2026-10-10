// ‘오늘 할 일’ 위치·패널 순서(보이는/화면 코드)·하루 진행 단추에서 오늘 할 일까지 Tab 수.
// 상태: day1(1일 맨 위), acc(의류 수락 뒤 앱이 둔 자리), t1(화장품 수락→준비 배정→2일 편 예약, S1c T1), day2(의류 수락 → 하루 진행).
// 사용: node qpos.js <prof> <dists>
const M = require('./m'); const L = M.L; const K = require('./kbcore');
const prof = process.argv[2] || 't1000';
const dists = (process.argv[3] || 'head,o1').split(',');
const sleep = L.sleep;
const PANELS = ['culture', 'trade', 'crew', 'resources', 'queue', 'world', 'report', 'log'];
const where = (page) => page.evaluate((PANELS) => {
  const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast');
  const bottom = Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity);
  const q = document.getElementById('queue-h').getBoundingClientRect(); const item = document.querySelector('.queue .pending li')?.getBoundingClientRect();
  const kids = [...document.querySelectorAll('main > *, main .maincol > *')].filter((e) => !e.classList.contains('maincol'));
  const key = (e) => PANELS.find((c) => e.classList.contains(c)) || e.className;
  const vis = kids.map((e) => [key(e), Math.round(e.getBoundingClientRect().top + scrollY), Math.round(e.getBoundingClientRect().left)]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
  const dom = kids.map(key);
  return { sy: Math.round(scrollY), bar: +bar.toFixed(1), bandBottom: +bottom.toFixed(1), ih: innerHeight, docH: document.documentElement.scrollHeight,
    queuePageY: Math.round(q.top + scrollY), queueTop: +q.top.toFixed(1), queueBelowBand: +(q.top - bottom).toFixed(1), queueFull: q.top >= bar - 0.5 && q.bottom <= bottom + 0.5,
    itemFull: item ? item.top >= bar - 0.5 && item.bottom <= bottom + 0.5 : null, tradePageY: Math.round(document.getElementById('trade-h').getBoundingClientRect().top + scrollY),
    vis: vis.join('>'), dom: dom.join('>') };
}, PANELS);
// 하루 진행 단추에서 Tab을 눌러 오늘 할 일 칸 첫 정지점까지 몇 번인가(한 바퀴 안).
async function tabsToQueue(page) {
  await page.focus('[data-action="end-day"]'); await sleep(80);
  for (let n = 1; n <= 250; n++) {
    await page.keyboard.press('Tab'); await sleep(40);
    const f = await K.fo(page);
    if (f.r === 'queue') return { n, to: f.act || f.id };
    if (f.r === 'body' || f.r === 'skip' || f.r === 'head') return { n: -1, to: f.r };
  }
  return { n: -1 };
}
(async () => {
  for (const dist of dists) {
    const out = { prof, dist };
    { const { page, ctx, errors } = await L.open(prof, dist); await K.setup(page);
      out.day1 = await where(page); out.day1.tabs = await tabsToQueue(page);
      await page.evaluate(() => scrollTo(0, 0)); await sleep(100);
      await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]'); await sleep(300);
      out.acc = await where(page); out.err1 = errors.slice(); await ctx.close(); }
    { const { page, ctx, errors } = await L.open(prof, dist); await K.setup(page);
      await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_02"]'); await sleep(150);
      await M.tap(page, prof, '[data-action="assign"][data-task="TASK001"][data-emp="EMP01"]'); await sleep(150);
      await M.tap(page, prof, '[data-action="book"][data-contract="CT001"][data-sailing="ROUTE02-D002"]:not([disabled])'); await sleep(200);
      out.t1 = await where(page); out.t1.tabs = await tabsToQueue(page); out.err2 = errors.slice(); await ctx.close(); }
    { const { page, ctx, errors } = await L.open(prof, dist); await K.setup(page);
      await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]'); await M.endDay(page, prof); await sleep(600);
      out.day2 = await where(page); out.day2.tabs = await tabsToQueue(page); out.err3 = errors.slice(); await ctx.close(); }
    console.log(JSON.stringify(out));
  }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
