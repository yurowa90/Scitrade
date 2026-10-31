// Tab/Shift+Tab으로 '하루 진행'에 간 뒤 Enter. 읽던 자리(계약 제목) 보정이 유지되는지 본다.
// MODE: mouse | tabFast (Tab 직후 Enter) | tabSlow (Tab 뒤 300ms) | stabFast (Shift+Tab 직후 Enter) | stabSlow
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
const OFF = Number(process.argv[3] || -30);
async function run(dist, mode) {
  const { page, errors } = await L.open(prof, dist);
  await M.tap(page, prof, '[data-action="accept"]');
  await M.endDay(page, prof); await M.endDay(page, prof);
  const cid = await page.evaluate(() => document.querySelector('[id^="contract-h-"]').id);
  await M.scrollTopTo(page, cid, OFF);
  await L.sleep(600);
  await M.instrument(page);
  const head = () => page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top * 10) / 10, cid);
  const y = () => page.evaluate(() => Math.round(scrollY));
  let before, y0, yTab = null;
  if (mode === 'mouse') {
    before = await head(); y0 = await y();
    await M.endDay(page, prof);
  } else {
    // 앞 요소에 초점(스크롤 없이)
    if (mode.startsWith("tab")) await page.evaluate(() => { const end = document.querySelector("[data-action=\"end-day\"]"); const all = [...document.querySelectorAll("button:not([disabled]), select, summary, input, [tabindex=\"0\"]")].filter((e) => !e.closest("[hidden]")); all[all.indexOf(end) - 1].focus({ preventScroll: true }); });
    else await page.evaluate(() => { const end = document.querySelector('[data-action="end-day"]'); const all = [...document.querySelectorAll('button:not([disabled]), select, summary, input, [tabindex="0"]')].filter((e) => !e.closest('[hidden]')); const i = all.indexOf(end); all[i + 1].focus({ preventScroll: true }); });
    await L.sleep(100);
    before = await head(); y0 = await y();
    await page.keyboard.press(mode.startsWith('tab') ? 'Tab' : 'Shift+Tab');
    if (mode.endsWith('Slow')) await L.sleep(300); if (mode.endsWith('Mid')) await L.sleep(Number(process.env.MID || 60));
    yTab = await y();
    const f = await page.evaluate(() => document.activeElement?.dataset?.action);
    if (f !== 'end-day') throw new Error('초점이 하루 진행이 아님: ' + f);
    await page.keyboard.press('Enter');
  }
  await L.sleep(400);
  const after = await head(); const y1 = await y(); const lg = await M.log(page);
  const day = await page.evaluate(() => document.querySelector('.statusbar .date b')?.textContent);
  console.log(JSON.stringify({ dist, prof, mode, day, headBefore: before, headAfter: after, dHead: Math.round((after - before) * 10) / 10, y0, yTab, y1, scrollBy: lg.scrollBy, scrollTo: lg.scrollTo, errors }));
  await page.context().close();
}
(async () => { for (const dist of (process.env.DISTS || 's23,dev').split(',')) for (const mode of (process.env.MODES || 'mouse,tabFast,tabSlow,stabFast,stabSlow').split(',')) await run(dist, mode); await L.done(); })().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
