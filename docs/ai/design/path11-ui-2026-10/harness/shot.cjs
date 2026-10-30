// 경로 11 정적 모형 촬영: 1024×768 터치(2배 → 1배 축소는 python), 1366×768 마우스. 사용: node shot.cjs <out dir>
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const out = process.argv[2];
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const shots = [['ipad-credit', 'credit.html', 1024, true], ['chromebook-credit', 'credit.html', 1366, false],
    ['ipad-settlement', 'settlement.html', 1024, true], ['chromebook-settlement', 'settlement.html', 1366, false], ['ipad-settlement-narrow', 'settlement.html#narrow', 1024, true]];
  for (const [name, url, w, touch] of shots) {
    const ctx = await b.newContext({ viewport: { width: w, height: 768 }, deviceScaleFactor: 1, hasTouch: touch, isMobile: false });
    const p = await ctx.newPage(); await p.goto('http://127.0.0.1:4391/p11/serve/' + url); await p.evaluate(() => document.fonts.ready);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
      over: [...document.querySelectorAll('table, .term-opts, .tl, .facts, .think')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className || e.tagName),
      added: (() => { const a = document.querySelector('fieldset.terms'), z = document.querySelector('.p11-think'); return a && z ? Math.round(z.getBoundingClientRect().bottom - a.getBoundingClientRect().top) : null; })(), card: Math.round(document.querySelector('.offer, .settlement')?.getBoundingClientRect().height ?? 0), minTarget: Math.min(...[...document.querySelectorAll('label.term-opt, button, summary')].map((e) => e.getBoundingClientRect().height)) }));
    console.log(name, JSON.stringify(m));
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: true }); await ctx.close(); }
  await b.close(); })();
