const L = require('./blib'); const src = require('fs').readFileSync('m61.js', 'utf8');
(async () => { for (const [w, h] of [[342, 192], [256, 192]]) {
  const r = await L.newPage('l1366', { viewport: { width: 1366, height: 768 } }); const pg = r.page;
  await pg.goto('http://127.0.0.1:4390/s61/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => { const s = document.querySelector('select[data-action="scenario"]'); s.value = 'SCENARIO_M1_DELAY_ACCEPTED'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(800);
  await L.tap(pg, '[data-action="accept"]:not([disabled])');
  for (let d = 1; d < 8; d++) { for (const a of ['book', 'assign']) { const sel = `[data-action="${a}"]:not([disabled])`; if (await pg.$(sel)) await L.tap(pg, sel).catch(() => {}); } await L.endDay(pg); await L.sleep(250); }
  await pg.setViewportSize({ width: w, height: h }); await L.sleep(700);
  await pg.focus('[data-action="situation"]'); await pg.keyboard.press('Enter'); await pg.waitForSelector('.situation #situation-h'); await L.sleep(400);
  const lay = await pg.evaluate(() => { const sr = document.querySelector('.situation'); const R = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.y), Math.round(b.height)]; }; return { display: getComputedStyle(sr).display, ofx: sr.scrollWidth - sr.clientWidth, header: R('.situation header'), stage: R('.situation-stage'), close: R('[data-situation="close"]') }; });
  const seq = []; for (let i = 0; i < 14; i++) { await pg.keyboard.press('Tab'); await L.sleep(80); seq.push(await pg.evaluate(() => { const e = document.activeElement; const b = e.getBoundingClientRect(); const sr = document.querySelector('.situation'); return `${e.dataset.situation || e.id || e.tagName}@${Math.round(b.top)}/${innerHeight}(st${Math.round(sr.scrollTop)})`; })); }
  console.log(JSON.stringify({ w, h, ...lay, seq }));
  await pg.screenshot({ path: `${L.S}/s61/zoom-${w}.png` }); await r.ctx.close(); }
  await L.done(); process.exit(0); })();
