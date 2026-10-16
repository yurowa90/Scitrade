const L = require('./blib');
(async () => { const r = await L.newPage('ipadminiL'); const pg = r.page;
  await pg.goto('http://127.0.0.1:4390/s61/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await L.sleep(700);
  await L.tap(pg, '[data-action="situation"]', { touch: true }); await pg.waitForSelector('#situation-h'); await L.sleep(300);
  await L.tap(pg, '.situation [data-situation="free"]', { touch: true }); await L.sleep(300);
  const pt = await pg.evaluate(() => { const r = [...document.querySelectorAll('.situation-port[opacity="1"]')].map((c) => c.getBoundingClientRect()).find((r) => r.width && r.left > 40 && r.top > 120 && r.right < innerWidth - 300); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  // 손가락 오차: 점 중심에서 6px 떨어져 누르면?
  await pg.touchscreen.tap(pt.x + 6, pt.y); await L.sleep(300); const off = await pg.evaluate(() => document.querySelector('.situation-selection')?.textContent.replace(/\s+/g, ' ').slice(0, 60));
  await pg.touchscreen.tap(pt.x, pt.y); await L.sleep(300); const on = await pg.evaluate(() => ({ sel: document.querySelector('.situation-selection')?.textContent.replace(/\s+/g, ' ').slice(0, 60), active: document.activeElement.tagName }));
  await pg.keyboard.press('Escape'); await L.sleep(300); const esc = await pg.evaluate(() => !!document.querySelector('.situation'));
  await pg.keyboard.press('Tab'); await L.sleep(100); const tab = await pg.evaluate(() => document.activeElement?.dataset.situation || document.activeElement?.id || document.activeElement?.tagName);
  console.log(JSON.stringify({ off6px: off, on, stillOpenAfterEscape: esc, firstTab: tab, errors: r.errors })); await L.done(); process.exit(0); })();
