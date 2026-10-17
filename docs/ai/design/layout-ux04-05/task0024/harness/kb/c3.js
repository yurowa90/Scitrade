// 경우 3: 2일, 패널 열고 CA01·귀솔 넣은 뒤 ‘② 갈 직원 고르기’(culture-emp-h)를 읽는 중 하루 진행 → 위에 결과 카드가 생김.
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
const ACT = process.argv[3] || 'CA01';
const withContract = process.argv[4] === 'contract';
async function run(dist) {
  const { page, errors } = await L.open(prof, dist);
  if (withContract) await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
  await M.endDay(page, prof);
  await M.tap(page, prof, '#local-tab');
  await M.tap(page, prof, `[data-action="culture-act"][data-activity="${ACT}"]`);
  await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
  await M.tap(page, prof, '[data-action="culture-queue"]');
  await L.sleep(200);
  const probe = () => page.evaluate(() => {
    const t = (id) => { const e = document.getElementById(id); return e ? Math.round(e.getBoundingClientRect().top * 10) / 10 : null; };
    const res = [...document.querySelectorAll('[id^="culture-result-h-"]')].map((e) => `${e.id.replace('culture-result-h-CULTURE-', '')}@${Math.round(e.getBoundingClientRect().top)}`);
    const card = document.querySelector('.contract'); const cr = card?.getBoundingClientRect();
    return { empH: t('culture-emp-h'), emp1: t('culture-emp-EMP01'), cultureH: t('culture-h'), pvH: t('culture-pv-h'), bookH: t('culture-book-h'), res, contract: cr ? [Math.round(cr.top), Math.round(cr.bottom)] : null };
  });
  await M.instrument(page);
  const c0 = await M.ctx(page); const before = await probe();
  const inBand = before.empH !== null && before.empH >= c0.bar && before.empH < Math.min(c0.ih, c0.toastTop ?? 1e9);
  if (prof === 'l1366' || prof === 't1000') await M.shot(page, `c3-${ACT}${withContract ? '-contract' : ''}-${prof}-${dist}-before`);
  await M.endDay(page, prof); await L.sleep(350);
  const c1 = await M.ctx(page); const after = await probe(); const lg = await M.log(page);
  const btn = await page.evaluate(() => { const b = document.querySelector('.flash-toast button'); return b ? { h: Math.round(b.getBoundingClientRect().height), text: b.textContent, action: b.dataset.action } : null; });
  await M.shot(page, `c3-${ACT}${withContract ? '-contract' : ''}-${prof}-${dist}-after`);
  console.log(JSON.stringify({ case: 3, act: ACT, withContract, prof, dist, d: Math.round((after.empH - before.empH) * 10) / 10, dEmp1: Math.round((after.emp1 - before.emp1) * 10) / 10, empHInBand: inBand, pvBefore: before.pvH !== null, pvAfter: after.pvH !== null, siv: lg.siv, sivIds: lg.sivIds, focus: c1.focus, btn, y0: c0.y, y1: c1.y, day: `${c0.day}->${c1.day}`, bar: c0.bar, ih: c0.ih, toast0: c0.toastTop, toast1: c1.toastTop, before, after, scrollBy: lg.scrollBy, errors }));
  await page.context().close();
}
(async () => { for (const dist of (process.env.DISTS || 's23,dev').split(',')) await run(dist); await L.done(); })().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
