// 경우 2(F1): 패널을 연 채 견적판을 읽는 중(계약 카드 없음) 하루 진행. 좌표 누르기.
// 변형: v3(패널 없음) / closed(fixed2 닫힘) / queue(CA01·귀솔 넣음) / select(직원만 고름, 넣지 않음)
// 위치: OFF=숫자(막대 아래 px) 또는 'mid'(띠 가운데) 또는 'low'(띠 아래 끝−60)
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
const OFF = process.argv[3] || '40';
const SEL = '.offer-board > :nth-child(2)';
async function run(dist, mode) {
  const { page, errors } = await L.open(prof, dist);
  await M.endDay(page, prof);
  if (mode === 'queue' || mode === 'select') {
    await M.tap(page, prof, '#local-tab');
    await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA01"]');
    await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
    if (mode === 'queue') await M.tap(page, prof, '[data-action="culture-queue"]');
  }
  await L.sleep(150);
  await page.evaluate(([sel, off]) => { const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast'); const band = Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity);
    const y = off === 'mid' ? (bar + band) / 2 : off === 'low' ? band - 60 : bar + Number(off); scrollBy(0, document.querySelector(sel).getBoundingClientRect().top - y); }, [SEL, OFF]);
  await L.sleep(200);
  const probe = () => page.evaluate((sel) => {
    const t = (q) => { const e = document.querySelector(q); return e ? Math.round(e.getBoundingClientRect().top * 10) / 10 : null; };
    const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const ts = document.querySelector('.flash-toast'); const band = Math.min(innerHeight, ts ? ts.getBoundingClientRect().top : Infinity);
    const cardVis = [...document.querySelectorAll('.contract')].some((c) => { const r = c.getBoundingClientRect(); return r.bottom > bar && r.top < innerHeight; });
    const blk = (id) => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), r.bottom > bar && r.top < band]; };
    const tr = document.querySelector('.trade').getBoundingClientRect();
    return { read: t(sel), tradeH: t('#trade-h'), boardH: t('.offer-board > :first-child'), cultureH: t('#culture-h'), empH: t('#culture-emp-h'), bookH: t('#culture-book-h'), crewH: t('#crew-h'), cardVis, empBlk: blk('culture-employees'), trade: [Math.round(tr.top), Math.round(tr.bottom)], bar: Math.round(bar * 10) / 10, band: Math.round(band * 10) / 10, readText: document.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim().slice(0, 20) };
  }, SEL);
  await M.instrument(page);
  const c0 = await M.ctx(page); const before = await probe();
  await M.endDay(page, prof); await L.sleep(350);
  const c1 = await M.ctx(page); const after = await probe(); const lg = await M.log(page);
  const btn = await page.evaluate(() => { const b = document.querySelector('.flash-toast button'); return b ? Math.round(b.getBoundingClientRect().height) : null; });
  if (prof === 'cb1366t' || prof === 't1000') await M.shot(page, `f1-${mode}-${OFF}-${prof}-${dist}-after`);
  const d = (k) => before[k] !== null && after[k] !== null ? Math.round((after[k] - before[k]) * 10) / 10 : null;
  console.log(JSON.stringify({ case: 'F1', mode, off: OFF, prof, dist, d: d('read'), dTradeH: d('tradeH'), dCrewH: d('crewH'), dEmpH: d('empH'), sameText: before.readText === after.readText, scrollBy: lg.scrollBy, siv: lg.siv, focus: c1.focus, btn, y0: c0.y, y1: c1.y, day: `${c0.day}->${c1.day}`, before, after, errors }));
  await page.context().close();
}
(async () => {
  for (const dist of (process.env.DISTS || 's23,dev').split(',')) { await run(dist, 'closed'); await run(dist, 'queue'); await run(dist, 'select'); }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
