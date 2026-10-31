// 경우 4: 패널 닫힘, 계약이 화면에 없음(맨 위). 스크롤이 전혀 없어야 한다.
// a: 1일 맨 위, 계약 없음 → 1일 마감. (fixed/sol/v3)
// b: 2일 탭으로 열고 CA01·귀솔 넣고 끝 ‘닫기’ → 맨 위로 → 2일 마감(결과 알림). (fixed/sol)
// c: b와 같되 닫은 자리 그대로 마감. (fixed/sol)
// d: 1일 의류 수락(계약이 생김) → 맨 위로 → 1일 마감, 2일 마감, 3일 마감(견적판 줄어듦). (fixed/sol/v3)
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
async function measureEnd(page, label, out, extra = {}) {
  await M.instrument(page);
  const c0 = await M.ctx(page);
  const vis = await page.evaluate(() => { const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; return [...document.querySelectorAll('.contract')].some((c) => { const r = c.getBoundingClientRect(); return r.bottom > bar && r.top < innerHeight; }); });
  const tab0 = await page.evaluate(() => { const e = document.getElementById('local-tab'); return e ? Math.round(e.getBoundingClientRect().top * 10) / 10 : null; });
  await M.endDay(page, prof); await L.sleep(350);
  const c1 = await M.ctx(page); const lg = await M.log(page);
  const tab1 = await page.evaluate(() => { const e = document.getElementById('local-tab'); return e ? Math.round(e.getBoundingClientRect().top * 10) / 10 : null; });
  out.push({ step: label, dY: c1.y - c0.y, y0: c0.y, y1: c1.y, contractVisible: vis, dTab: tab0 !== null && tab1 !== null ? Math.round((tab1 - tab0) * 10) / 10 : null, day: `${c0.day}->${c1.day}`, focus: c1.focus, scrollBy: lg.scrollBy, scrollTo: lg.scrollTo, siv: lg.siv, toast1: c1.toastTop, ...extra });
}
async function run(dist, variant) {
  const { page, errors } = await L.open(prof, dist);
  const out = [];
  if (variant === 'a') { await measureEnd(page, 'd1', out); }
  if (variant === 'b' || variant === 'c') {
    await M.endDay(page, prof);
    await M.tap(page, prof, '#local-tab');
    await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA01"]');
    await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
    await M.tap(page, prof, '[data-action="culture-queue"]');
    await M.tap(page, prof, '[data-action="culture-close"][data-where="end"]');
    await L.sleep(200);
    if (variant === 'b') { await page.evaluate(() => window.scrollTo(0, 0)); await L.sleep(200); }
    await measureEnd(page, 'd2', out);
    await measureEnd(page, 'd3', out);
  }
  if (variant === 'd') {
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    await page.evaluate(() => window.scrollTo(0, 0)); await L.sleep(200);
    await measureEnd(page, 'd1', out); await measureEnd(page, 'd2', out); await measureEnd(page, 'd3', out);
  }
  if (prof === 'l1366' || prof === 't1000') await M.shot(page, `c4${variant}-${prof}-${dist}-after`);
  console.log(JSON.stringify({ case: 4, variant, prof, dist, steps: out, errors }));
  await page.context().close();
}
(async () => {
  for (const dist of (process.env.DISTS_AD || 's23,dev').split(',')) await run(dist, 'a');
  for (const dist of (process.env.DISTS_BC || 's23,dev').split(',')) { await run(dist, 'b'); await run(dist, 'c'); }
  for (const dist of (process.env.DISTS_AD || 's23,dev').split(',')) await run(dist, 'd');
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
