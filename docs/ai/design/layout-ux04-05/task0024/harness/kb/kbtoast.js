// 알림(결과 보기)이 떠 있는 2일: 의류 수락 + CA01·귀솔 → 하루 진행. 맨 위부터 Tab 한 바퀴(가림·거꾸로), 일정 펼친 뒤 한 바퀴(s23).
const M = require('./m'); const L = M.L; const K = require('./kbcore');
const prof = process.argv[2] || 'l1366';
const dists = (process.argv[3] || 's23,devh').split(',');
(async () => {
  for (const dist of dists) {
    const { page, ctx, errors } = await L.open(prof, dist); await K.setup(page);
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    await M.tap(page, prof, '#local-tab');
    await M.tap(page, prof, '[data-action="culture-act"][data-activity="CA01"]');
    await M.tap(page, prof, '[data-action="culture-emp"][data-emp="EMP01"]');
    await M.tap(page, prof, '[data-action="culture-queue"]');
    await M.endDay(page, prof); await L.sleep(600);
    const out = { prof, dist, toast: await page.evaluate(() => !!document.querySelector('.flash-toast')) };
    let regions = await page.evaluate(() => window.__regions());
    let stops = await K.tabCycle(page, 220);
    let j = K.judge(stops, regions, prof === 't1000');
    out.cycle = { stops, regions, n: stops.length, seq: j.seq.join('>'), back: j.back.map((b) => `${b.from}->${b.to}`), hidden: j.hidden };
    if (await page.$('#schedule-toggle')) {
      await page.evaluate(() => document.getElementById('schedule-toggle').click()); await L.sleep(600);
      regions = await page.evaluate(() => window.__regions());
      stops = await K.tabCycle(page, 220);
      j = K.judge(stops, regions, prof === 't1000');
      out.cycleOpen = { n: stops.length, seq: j.seq.join('>'), back: j.back.map((b) => `${b.from}->${b.to}`), hidden: j.hidden, sched: stops.filter((s) => s.r === 'queue').map((s) => `${s.act}${s.vis ? '' : '(가림)'}`) };
    }
    out.errors = errors;
    console.log(JSON.stringify(out));
    await ctx.close();
  }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
