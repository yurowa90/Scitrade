// 경우 3(F2): 기록장을 펼친 채 CA01 회사 보고서의 네 칸을 읽는 중 하루 진행. 좌표 누르기.
// KIND: new(새 보고서 CA02·물보리가 기록장 맨 위에 끼어듦 + 결과 카드) / repeat(CA01·물보리 반복: 결과 카드만, 보고서 그대로)
// POS: f1(첫 칸을 막대+30) / f3mid(셋째 칸을 띠 가운데) / headIn(기록장 제목을 막대+20) / repHeadIn(보고서 제목을 막대+10)
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
const KIND = process.argv[3] || 'new';
const POS = process.argv[4] || 'f1';
async function run(dist) {
  const { page, errors } = await L.open(prof, dist);
  await M.tap(page, prof, '#local-tab');
  await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA01"]');
  await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
  await M.tap(page, prof, '[data-action="culture-queue"]');
  await M.endDay(page, prof); // 2일: 1일 결과 카드, 기록장에 CA01 보고서
  await M.tap(page, prof, '[data-action="culture-book"]');
  const act = KIND === 'new' ? 'CA02' : 'CA01';
  const isSel = async () => page.evaluate((a) => document.querySelector(`[data-action="culture-act"][data-activity="${a}"]`)?.getAttribute('aria-pressed') === 'true' && !!document.querySelector('[data-action="culture-emp"][data-emp="EMP02"]'), act);
  if (!(await isSel())) await M.tap(page, prof, `[data-action="culture-act"][data-activity="${act}"]`);
  if (!(await isSel())) await M.tap(page, prof, `[data-action="culture-act"][data-activity="${act}"]`);
  await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP02"]');
  await M.tap(page, prof, '[data-action="culture-queue"]');
  await L.sleep(150);
  const rid = await page.evaluate(() => [...document.querySelectorAll('[id^="culture-report-h-"]')].map((h) => h.id));
  const hid = rid.find((id) => id.includes('CA01')) || rid[0];
  const blkSel = `[aria-labelledby="${hid}"]`;
  const fsel = (n) => `${blkSel} .rec4 > li:nth-child(${n})`;
  await page.evaluate(([pos, rep, f1, f3]) => {
    const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast'); const band = Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity);
    const top = (q) => document.querySelector(q).getBoundingClientRect().top;
    const dy = pos === 'f1' ? top(f1) - (bar + 30) : pos === 'f3mid' ? top(f3) - (bar + band) / 2 : pos === 'headIn' ? top('#culture-book-h') - (bar + 20) : top(`#${rep}`) - (bar + 10);
    scrollBy(0, dy);
  }, [POS, hid, fsel(1), fsel(3)]);
  await L.sleep(200);
  const probe = () => page.evaluate(([rep, blkSel, fs]) => {
    const t = (q) => { const e = document.querySelector(q); return e ? Math.round(e.getBoundingClientRect().top * 10) / 10 : null; };
    const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const ts = document.querySelector('.flash-toast'); const band = Math.min(innerHeight, ts ? ts.getBoundingClientRect().top : Infinity);
    const b = document.querySelector(blkSel)?.getBoundingClientRect();
    return { f: fs.map(t), repH: t(`#${rep}`), bookH: t('#culture-book-h'), cultureH: t('#culture-h'), empH: t('#culture-emp-h'), repBlk: b ? [Math.round(b.top), Math.round(b.bottom)] : null,
      reports: [...document.querySelectorAll('[id^="culture-report-h-"]')].map((r) => r.id.replace('culture-report-h-CULTURE-', '')), results: [...document.querySelectorAll('[id^="culture-result-h-"]')].map((r) => r.id.replace('culture-result-h-CULTURE-', '')), bar: Math.round(bar * 10) / 10, band: Math.round(band * 10) / 10 };
  }, [hid, blkSel, [1, 2, 3, 4].map(fsel)]);
  await M.instrument(page);
  const c0 = await M.ctx(page); const before = await probe();
  await M.endDay(page, prof); await L.sleep(350);
  const c1 = await M.ctx(page); const after = await probe(); const lg = await M.log(page);
  const btn = await page.evaluate(() => { const b = document.querySelector('.flash-toast button'); return b ? Math.round(b.getBoundingClientRect().height) : null; });
  if (prof === 'cb1366t' || prof === 'l1920') await M.shot(page, `f2-${KIND}-${POS}-${prof}-${dist}-after`);
  const dF = after.f.map((v, i) => (v !== null && before.f[i] !== null ? Math.round((v - before.f[i]) * 10) / 10 : null));
  const d = (k) => before[k] !== null && after[k] !== null ? Math.round((after[k] - before[k]) * 10) / 10 : null;
  console.log(JSON.stringify({ case: 'F2', kind: KIND, pos: POS, prof, dist, rep: hid, dF, dRepH: d('repH'), dBookH: d('bookH'), scrollBy: lg.scrollBy, siv: lg.siv, focus: c1.focus, btn, day: `${c0.day}->${c1.day}`, before, after, errors }));
  await page.context().close();
}
(async () => { for (const dist of (process.env.DISTS || 's23,dev').split(',')) await run(dist); await L.done(); })().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
