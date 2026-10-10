// 경우 1: f3e 시나리오. 의류 거래 수락 → 3일 → 계약 제목을 막대 30px 위에 둔 채 본문을 읽음 → 3일 마감(견적판이 줄어듦).
// 변형: closed(패널 닫힘) / open(패널을 위에 열어 둠) / openRes(패널 열고 CA01 넣어 둠: 마감 때 위에 결과 카드도 생김)
const M = require('./m'); const L = M.L;
const prof = process.argv[2] || 'l1366';
const OFF = Number(process.argv[3] || -30);
async function run(dist, variant) {
  const { page, errors } = await L.open(prof, dist);
  await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
  await M.endDay(page, prof); await M.endDay(page, prof);
  const cid = await page.evaluate(() => document.querySelector('[id^="contract-h-"]').id);
  if (variant !== 'closed') {
    await M.tap(page, prof, '#local-tab');
    if (variant === 'openRes') {
      await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA01"]');
      await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
      await M.tap(page, prof, '[data-action="culture-queue"]');
    }
  }
  await M.scrollTopTo(page, cid, OFF);
  const SEL = 'p, li, table, h4, dt, dd, tr';
  const midIdx = await page.evaluate(([id, SEL]) => { const c = document.getElementById(id).closest('.contract'); const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const mid = (bar + innerHeight) / 2;
    let best = -1, bd = 1e9; c.querySelectorAll(SEL).forEach((e, i) => { const d = Math.abs(e.getBoundingClientRect().top - mid); if (d < bd) { bd = d; best = i; } }); return best; }, [cid, SEL]);
  const probe = () => page.evaluate(([id, SEL, midIdx]) => {
    const h = document.getElementById(id); const c = h.closest('.contract'); const p = c.querySelectorAll('p, li, table')[3] || c;
    const m = c.querySelectorAll(SEL)[midIdx];
    const cands = ['culture-h', 'culture-emp-h', 'culture-pv-h', 'culture-book-h'].map((x) => { const e = document.getElementById(x); return e ? `${x}@${Math.round(e.getBoundingClientRect().top)}` : null; }).filter(Boolean);
    const res = [...document.querySelectorAll('[id^="culture-result-h-"]')].map((e) => `${e.id.replace('culture-result-h-', '')}@${Math.round(e.getBoundingClientRect().top)}`);
    return { mid: m ? Math.round(m.getBoundingClientRect().top * 10) / 10 : null, midTag: m ? m.tagName + ':' + m.textContent.trim().slice(0, 18) : null, head: Math.round(h.getBoundingClientRect().top * 10) / 10, probe: Math.round(p.getBoundingClientRect().top * 10) / 10, probeTag: p.tagName + ':' + p.textContent.trim().slice(0, 18), cands, res };
  }, [cid, SEL, midIdx]);
  await M.instrument(page);
  const c0 = await M.ctx(page); const before = await probe();
  if (prof === 'l1366' || prof === 't1000') await M.shot(page, `c1-${variant}${OFF === -30 ? '' : OFF}-${prof}-${dist}-before`);
  await M.endDay(page, prof); await L.sleep(350);
  const c1 = await M.ctx(page); const after = await probe(); const lg = await M.log(page);
  await M.shot(page, `c1-${variant}${OFF === -30 ? '' : OFF}-${prof}-${dist}-after`);
  const r = { case: 1, variant, off: OFF, prof, dist, d: Math.round((after.probe - before.probe) * 10) / 10, dMid: Math.round((after.mid - before.mid) * 10) / 10, midSame: before.midTag === after.midTag, dHead: Math.round((after.head - before.head) * 10) / 10, y0: c0.y, y1: c1.y, day: `${c0.day}->${c1.day}`, bar: c0.bar, toast0: c0.toastTop, toast1: c1.toastTop, focus: c1.focus, before, after, scrollBy: lg.scrollBy, siv: lg.siv, errors };
  console.log(JSON.stringify(r));
  await page.context().close();
}
(async () => {
  for (const dist of (process.env.DISTS_CLOSED || 's23,dev').split(',')) await run(dist, 'closed');
  for (const dist of (process.env.DISTS_OPEN ?? 's23,dev').split(',').filter(Boolean)) { await run(dist, 'open'); await run(dist, 'openRes'); }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
