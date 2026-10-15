const L = require('./blib');
(async () => { const res = [];
  for (const [prof, touch] of [['ipadminiL', true], ['l1366', false]]) { const r = await L.newPage(prof, touch ? {} : { viewport: { width: 1366, height: 768 } }); const pg = r.page;
  await pg.goto(`http://127.0.0.1:4390/${process.argv[2] || 's61r2'}/index.html`); await pg.waitForSelector('[data-action="end-day"]'); await L.sleep(700);
  await L.tap(pg, '[data-action="situation"]', { touch }); await pg.waitForSelector('#situation-h'); await L.sleep(300);
  const before = await pg.evaluate(() => document.activeElement?.id);
  // 지도 칸 안에서 어떤 점·표시와도 40px 넘게 떨어진 곳(바다)
  const spot = await pg.evaluate(() => { const st = document.querySelector('.situation-stage').getBoundingClientRect(); const pts = [...document.querySelectorAll('.situation [data-port], .situation [data-mark-dot], .situation [data-mark]')].map((e) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
    for (let y = st.top + 40; y < st.bottom - 40; y += 20) for (let x = st.left + 40; x < st.right - 40; x += 20) if (pts.every(([a, b]) => Math.hypot(a - x, b - y) > 40)) return { x, y }; return null; });
  if (touch) await pg.touchscreen.tap(spot.x, spot.y); else await pg.mouse.click(spot.x, spot.y); await L.sleep(300);
  const after = await pg.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  await pg.keyboard.press('Escape'); await L.sleep(300); const open = !!(await pg.$('.situation'));
  res.push({ prof, before, spot, focusAfterSeaTap: after, stillOpenAfterEscape: open }); await r.ctx.close(); }
  console.log(JSON.stringify(res)); await L.done(); process.exit(0); })();
