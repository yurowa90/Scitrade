// CPU 4배 느리게: 첫 렌더(‘하루 진행’ 단추가 생길 때)까지 시간, 번갈아 각 15회
const L = require('./blib');
(async () => { const res = { b59basex: [], b59r1x: [] }; const N = +(process.argv[2] || 15);
  for (let i = 0; i < N; i++) for (const d of (i % 2 ? ['b59r1x', 'b59basex'] : ['b59basex', 'b59r1x'])) {
    const r = await L.newPage('l1366'); const cdp = await r.ctx.newCDPSession(r.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await r.page.addInitScript(() => { new MutationObserver((_, o) => { if (document.querySelector('[data-action="end-day"]')) { window.__fr = performance.now(); o.disconnect(); } }).observe(document, { childList: true, subtree: true }); });
    await r.page.goto(`http://127.0.0.1:4390/${d}/index.html`); await r.page.waitForSelector('[data-action="end-day"]');
    const t = await r.page.evaluate(() => ({ fr: window.__fr, dcl: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd, js: performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.js')).map((e) => e.name.split('/').pop().split('-')[0]) }));
    res[d].push(t); await r.ctx.close(); }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[s.length >> 1]); };
  for (const d of Object.keys(res)) console.log(JSON.stringify({ dist: d, n: res[d].length, firstRenderMedian: med(res[d].map((x) => x.fr)), min: Math.round(Math.min(...res[d].map((x) => x.fr))), max: Math.round(Math.max(...res[d].map((x) => x.fr))), dclMedian: med(res[d].map((x) => x.dcl)), jsAtLoad: res[d][0].js }));
  await L.done(); process.exit(0); })();
