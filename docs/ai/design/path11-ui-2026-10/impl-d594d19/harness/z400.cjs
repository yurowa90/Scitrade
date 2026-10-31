// 400%(256×192) 배치 실측: 누르기 없이 넘침·높이만 잰다. 대화상자는 element.click()으로 연다.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const S = __dirname; const out = process.argv[3]; const URL = `http://127.0.0.1:4392/${process.argv[2]}/dist/`;
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const save of ['save-2001-d8.json', 'save-2001-d22.json', 'save-2001-d31.json', 'save-2005-d36.json']) {
    const ctx = await b.newContext({ viewport: { width: 256, height: 192 }, hasTouch: true, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.on('dialog', (d) => d.accept());
    await p.goto(URL); await p.waitForSelector('#app *'); await p.setInputFiles('input[data-action="import"]', `${S}/${save}`);
    await p.waitForFunction(() => document.querySelector('select[data-action="scenario"]')?.value === 'SCENARIO_M2_OPS_CREDIT'); await p.waitForTimeout(400);
    const m = async () => p.evaluate(() => ({ doc: document.scrollingElement.scrollWidth - innerWidth, els: [...document.querySelectorAll('.p11, .p11 table, article.offer, .panel.report, #p11-dialog, #p11-dialog table')].filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).map((e) => `${e.tagName}.${e.className}:${e.scrollWidth - e.clientWidth}`),
      topbar: Math.round(document.querySelector('.topbar, header')?.getBoundingClientRect().height ?? 0), pos: getComputedStyle(document.querySelector('.topbar, header') ?? document.body).position }));
    const r1 = await m(); await p.evaluate(() => document.querySelector('[data-action="p11-dialog"]')?.click()); await p.waitForTimeout(300);
    const r2 = await m(); const dl = await p.evaluate(() => { const d = document.getElementById('p11-dialog'); return d ? [Math.round(d.getBoundingClientRect().width), Math.round(d.scrollHeight)] : null; });
    fs.appendFileSync(out, JSON.stringify({ save, page: r1, dialog: r2, dl }) + '\n'); await ctx.close(); }
  await b.close(); })();
