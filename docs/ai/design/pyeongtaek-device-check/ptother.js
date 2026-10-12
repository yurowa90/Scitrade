const L = require('./blib');
(async () => { for (const hide of [false, true]) { const { page, ctx } = await L.open('l1366', 'pt'); await L.sleep(1500);
  if (hide) { await page.evaluate(() => localStorage.setItem('nl-hud:public:v1', 'hidden')); await page.reload(); await page.waitForSelector('[data-action="end-day"]'); await L.sleep(1500); }
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Shift+Tab');
  const a = await page.evaluate(() => { const e = document.activeElement; return e.tagName + '#' + e.id + ' ' + (e.title || e.textContent || '').trim().slice(0, 30); });
  const n = await page.evaluate(() => !!document.getElementById('nl-badge-frame'));
  console.log(hide ? 'hidden' : 'shown', 'last stop:', a, 'frame present:', n); await ctx.close(); }
  process.exit(0); })();
