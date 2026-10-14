const L = require('./blib');
(async () => { for (const [prof, vp] of [['ipadminiL', null], ['l1366', { width: 1366, height: 768 }]]) {
  const r = await L.newPage(prof, vp ? { viewport: vp } : {}); const pg = r.page;
  await pg.goto('http://127.0.0.1:4390/s61/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => { const s = document.querySelector('select[data-action="scenario"]'); s.value = 'SCENARIO_M1_DELAY_ACCEPTED'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(800);
  await L.tap(pg, '[data-action="accept"]:not([disabled])'); for (let d = 1; d < 8; d++) { for (const a of ['book', 'assign']) { const sel = `[data-action="${a}"]:not([disabled])`; if (await pg.$(sel)) await L.tap(pg, sel).catch(() => {}); } await L.endDay(pg); await L.sleep(250); }
  await L.sleep(600); await pg.evaluate(() => document.querySelector('[data-action="situation"]').click()); await pg.waitForSelector('#situation-h'); await L.sleep(300);
  const m = async () => pg.evaluate(() => { const svg = document.querySelector('.situation svg'); const vb = svg.viewBox.baseVal; const r = svg.getBoundingClientRect(); const s = Math.min(r.width / vb.width, r.height / vb.height);
    const texts = [...svg.querySelectorAll('text')].filter((t) => !t.closest('[hidden]')).map((t) => ({ t: t.textContent.trim().slice(0, 6), px: Math.round(t.getBoundingClientRect().height * 10) / 10 })).filter((x) => x.px > 0);
    const hs = texts.map((x) => x.px).sort((a, b) => a - b);
    return { vb: [Math.round(vb.width), Math.round(vb.height)], stage: [Math.round(r.width), Math.round(r.height)], scale: Math.round(s * 100) / 100, mapCss: [Math.round(vb.width * s), Math.round(vb.height * s)], textH: { min: hs[0], med: hs[hs.length >> 1], n: hs.length }, smallest: texts.sort((a, b) => a.px - b.px).slice(0, 4) }; });
  const brief = await m(); await pg.evaluate(() => document.querySelector('[data-situation="free"]').click()); await L.sleep(300); const free = await m();
  console.log(JSON.stringify({ prof, brief, free })); await r.ctx.close(); } await L.done(); process.exit(0); })();
