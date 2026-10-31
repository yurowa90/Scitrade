// 1024 터치에서 외상 블록(접힘) 높이를 부분별로 나눈다. 스크린샷 두 장(접힘·펼침)을 찍는다.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('dialog', (d) => d.accept());
  await p.goto('http://127.0.0.1:4392/after/dist/'); await p.waitForSelector('#app *'); await p.setInputFiles('input[data-action="import"]', `${__dirname}/save-2001-d8.json`);
  await p.waitForFunction(() => document.querySelector('select[data-action="scenario"]')?.value === 'SCENARIO_M2_OPS_CREDIT'); await p.waitForTimeout(500);
  console.log(JSON.stringify(await p.evaluate(() => { const blk = document.querySelector('article.offer .p11');
    return [...blk.children].map((e) => { const cs = getComputedStyle(e); return [e.tagName + (e.className ? '.' + e.className : ''), Math.round(e.getBoundingClientRect().height), cs.marginTop, cs.marginBottom]; }); })));
  await p.locator('article.offer:has(.p11)').first().screenshot({ path: `${__dirname}/ipad-credit-closed.png` });
  await p.locator('article.offer .p11 details > summary').first().click(); await p.waitForTimeout(300); await p.locator('article.offer:has(.p11)').first().screenshot({ path: `${__dirname}/ipad-credit-open.png` });
  await p.evaluate(() => document.querySelector('[data-action="p11-dialog"]')?.click());
  const ctx2 = await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true }); const q = await ctx2.newPage(); q.on('dialog', (d) => d.accept());
  await q.goto('http://127.0.0.1:4392/after/dist/'); await q.waitForSelector('#app *'); await q.setInputFiles('input[data-action="import"]', `${__dirname}/save-2001-d31.json`);
  await q.waitForFunction(() => document.querySelector('select[data-action="scenario"]')?.value === 'SCENARIO_M2_OPS_CREDIT'); await q.waitForTimeout(500);
  await q.locator('.panel.report').screenshot({ path: `${__dirname}/ipad-report-d31.png` });
  await q.click('[data-action="p11-dialog"]'); await q.waitForTimeout(300); await q.screenshot({ path: `${__dirname}/ipad-dialog-d31.png` });
  await b.close(); })();
