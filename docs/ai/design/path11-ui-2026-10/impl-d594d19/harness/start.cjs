// 시작 시간: CDP CPU 4배 늦춤, 새 탭에서 탐색 시작부터 #app 첫 자식까지(ms). 빌드마다 15회, 번갈아 잰다.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const res = { base: [], after: [] };
  for (let i = 0; i < 15; i++) for (const k of (i % 2 ? ['after', 'base'] : ['base', 'after'])) {
    const ctx = await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true }); const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.goto(`http://127.0.0.1:4392/${k}/dist/`, { waitUntil: 'commit' });
    await p.waitForFunction(() => document.querySelector('#app')?.firstElementChild, null, { polling: 'raf', timeout: 60000 });
    res[k].push(await p.evaluate(() => Math.round(performance.now()))); await ctx.close(); }
  const med = (a) => [...a].sort((x, y) => x - y)[7]; console.log(JSON.stringify({ base: { med: med(res.base), all: res.base }, after: { med: med(res.after), all: res.after } }));
  await b.close(); })();
