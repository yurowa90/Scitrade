// 3차 수정 확인: 두 결과가 모두 반복일 때 알림 문구·줄 수·단추 높이, 기록장 .book-trust 여백.
// 1일 CA01·귀솔 + CA02·물보리 → 2일 CA01·물보리 + CA02·귀솔(둘 다 반복) → 3일 알림.
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
async function selectAct(page, act, emp) {
  for (let i = 0; i < 2; i++) {
    const ok = await page.evaluate(([a, e]) => document.querySelector(`[data-action="culture-act"][data-activity="${a}"]`)?.getAttribute('aria-pressed') === 'true' && !!document.querySelector(`[data-action="culture-emp"][data-emp="${e}"]`), [act, emp]);
    if (ok) return;
    await M.tap(page, prof, `[data-action="culture-act"][data-activity="${act}"]`);
  }
}
async function queue(page, act, emp) {
  await selectAct(page, act, emp);
  await M.tap(page, prof, `[data-action="culture-emp"][data-emp="${emp}"]`);
  await M.tap(page, prof, '[data-action="culture-queue"]');
}
const toastInfo = (page) => page.evaluate(() => {
  const t = document.querySelector('.flash-toast'); if (!t) return null;
  const tn = [...t.childNodes].filter((n) => n.nodeType === 3);
  const tops = new Set();
  for (const n of tn) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.width > 0) tops.add(Math.round(q.top)); }
  const b = t.querySelector('button'); const tr = t.getBoundingClientRect();
  return { text: tn.map((n) => n.textContent).join('').trim(), lines: tops.size, toastH: Math.round(tr.height * 10) / 10, toastW: Math.round(tr.width), btnH: b ? Math.round(b.getBoundingClientRect().height * 10) / 10 : null, btnText: b?.textContent ?? null, kind: t.className };
});
async function run(dist) {
  const { page, errors } = await L.open(prof, dist);
  await M.tap(page, prof, '#local-tab');
  await queue(page, 'CA01', 'EMP01');
  await queue(page, 'CA02', 'EMP02');
  const pend1 = await page.evaluate(() => document.querySelectorAll('[data-action="culture-cancel"], .culture-slot li, #culture-slot li').length);
  await M.endDay(page, prof); await L.sleep(300);
  const day2 = await toastInfo(page);
  await queue(page, 'CA01', 'EMP02');
  await queue(page, 'CA02', 'EMP01');
  await M.endDay(page, prof); await L.sleep(300);
  const day3 = await toastInfo(page);
  if (prof === 'l1366' || prof === 't1000' || prof === 'ipadminiL') await M.shot(page, `t1-${prof}-${dist}-toast`);
  // 기록장 펼치기 → .book-trust 여백
  await M.tap(page, prof, '[data-action="culture-book"]'); await L.sleep(200);
  const trust = await page.evaluate(() => {
    const e = document.querySelector('.book-trust'); if (!e) return null;
    const cs = getComputedStyle(e); const prev = e.previousElementSibling; const r = e.getBoundingClientRect();
    return { marginTop: cs.marginTop, marginBottom: cs.marginBottom, bg: cs.backgroundColor, fontSize: cs.fontSize, rootFs: getComputedStyle(document.documentElement).fontSize, inLocal: !!e.closest('.local'),
      gapFromPrev: prev ? Math.round((r.top - prev.getBoundingClientRect().bottom) * 10) / 10 : null, prevTag: prev ? prev.tagName + '.' + prev.className : null, prevMb: prev ? getComputedStyle(prev).marginBottom : null };
  });
  const reports = await page.evaluate(() => document.querySelectorAll('article.cul-report').length);
  console.log(JSON.stringify({ case: 'T1', prof, dist, pend1, day2, day3, trust, reports, errors }));
  await page.context().close();
}
(async () => { for (const dist of (process.env.DISTS || 's23,dev').split(',')) await run(dist); await L.done(); })().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
