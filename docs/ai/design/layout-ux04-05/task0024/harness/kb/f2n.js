// 경우 3 보충(F2 자연 흐름): 1일 CA01·귀솔 → 2일, CA02·물보리 넣기 → 기록장 단추를 좌표로 누름(스크롤은 누르기 도우미가 가려졌을 때만) → 그대로 하루 진행.
// 기록장을 연 직후 화면에서 기록장 제목·첫 보고서(CA01) 네 칸이 어디 있는지, 하루 진행 뒤 얼마나 움직이는지 잰다.
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
async function run(dist) {
  const { page, errors } = await L.open(prof, dist);
  await M.tap(page, prof, '#local-tab');
  await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA01"]');
  await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
  await M.tap(page, prof, '[data-action="culture-queue"]');
  await M.endDay(page, prof);
  await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA02"]');
  await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP02"]');
  await M.tap(page, prof, '[data-action="culture-queue"]');
  const y0 = await page.evaluate(() => scrollY);
  await M.tap(page, prof, '[data-action="culture-book"]');
  await L.sleep(200);
  const y1 = await page.evaluate(() => scrollY);
  const hid = await page.evaluate(() => [...document.querySelectorAll('[id^="culture-report-h-"]')].map((h) => h.id).find((id) => id.includes('CA01')));
  const fsel = (n) => `[aria-labelledby="${hid}"] .rec4 > li:nth-child(${n})`;
  const probe = () => page.evaluate(([hid, fs]) => {
    const t = (q) => { const e = document.querySelector(q); return e ? Math.round(e.getBoundingClientRect().top * 10) / 10 : null; };
    const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const ts = document.querySelector('.flash-toast'); const band = Math.min(innerHeight, ts ? ts.getBoundingClientRect().top : Infinity);
    return { f: fs.map(t), repH: t('#' + hid), bookH: t('#culture-book-h'), toggle: t('[data-action="culture-book"]'), bar: Math.round(bar * 10) / 10, band: Math.round(band * 10) / 10 };
  }, [hid, [1, 2, 3, 4].map(fsel)]);
  await M.instrument(page);
  const before = await probe();
  await M.endDay(page, prof); await L.sleep(350);
  const after = await probe(); const lg = await M.log(page);
  const dF = after.f.map((v, i) => (v !== null && before.f[i] !== null ? Math.round((v - before.f[i]) * 10) / 10 : null));
  if (prof === 'cb1366t') await M.shot(page, `f2n-${prof}-${dist}-after`);
  console.log(JSON.stringify({ case: 'F2n', prof, dist, scrollOnToggle: Math.round(y1 - y0), dF, dBookH: Math.round((after.bookH - before.bookH) * 10) / 10, scrollBy: lg.scrollBy, before, errors }));
  await page.context().close();
}
(async () => { for (const dist of (process.env.DISTS || 's23,dev').split(',')) await run(dist); await L.done(); })().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
