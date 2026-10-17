const L = require('./blib'); const fs = require('fs');
const M = L.S + '/sm/';
const ports = JSON.parse(fs.readFileSync(M + 'ports-ea.json', 'utf8'));
const night = 'data:image/png;base64,' + fs.readFileSync(M + 'nightlights-ea.png').toString('base64');
const css = fs.readFileSync(M + 'mock/situation.css', 'utf8'); const mock = fs.readFileSync(M + 'mock/mock.js', 'utf8');
const cards = [
  { name: '대한민국', left: 'calc(100% - 182px)', top: '3%', rows: [['1인당 GDP'], ['수출/GDP'], ['컨테이너 물동량'], ['소비자물가']] },
  { name: '중국', left: '2%', top: '3%', rows: [['1인당 GDP'], ['수출/GDP'], ['컨테이너 물동량'], ['소비자물가']] },
  { name: '베트남', left: '2%', top: '40%', rows: [['1인당 GDP'], ['수출/GDP'], ['컨테이너 물동량'], ['소비자물가']] },
];
async function state(pg) {
  await pg.evaluate(() => { const s = document.querySelector('select[data-action="scenario"]'); s.value = 'SCENARIO_M1_DELAY_ACCEPTED'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(800);
  await L.tap(pg, '[data-action="accept"]:not([disabled])');
  for (let d = 1; d < 8; d++) { for (const a of ['book', 'assign']) { const sel = `[data-action="${a}"]:not([disabled])`; if (await pg.$(sel)) await L.tap(pg, sel).catch(() => {}); } await L.endDay(pg); await L.sleep(250); }
}
(async () => {
  const shots = [['ipad-all', 1024, 768, true, 'free'], ['chromebook-all', 1366, 768, false, 'free'], ['ipad-briefing', 1024, 768, true, 'briefing'], ['chromebook-briefing', 1366, 768, false, 'briefing']];
  for (const [name, w, h, touch, preset] of shots) {
    const r = await L.newPage(touch ? 'ipadminiL' : 'l1366', { viewport: { width: w, height: h } }); const pg = r.page;
    await pg.goto('http://127.0.0.1:4390/sm/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await pg.evaluate(() => document.fonts.ready);
    await state(pg);
    const ctx = await pg.evaluate(() => { const t = document.body.innerText; return { day: (t.match(/\d+일 \/ \d+일?/) || [''])[0], delay: (t.match(/[^\n]*지연[^\n]*/) || [''])[0].slice(0, 120), ship: document.querySelector('svg.sea-map')?.getAttribute('aria-label').match(/화물선.*$/)?.[0] }; });
    await pg.evaluate((d) => { window.__SR = d; }, { ports, nightlights: night, css, preset, layers: { cargo: 1, routes: 1, ports: 1, lights: 1, cards: 1 }, cards,
      majorPorts: ['Shanghai', 'Pyeongtaek', 'Busan', 'Haiphong', 'Hong Kong', 'Ningbo', 'Qingdao', 'Kaohsiung', 'Singapore', 'Ho Chi Minh City', 'Tianjin', 'Dalian', 'Manila', 'Yokohama', 'Xiamen'],
      dayText: (ctx.day || '8일') + ' · 시간 정지', briefText: '하이퐁 항만 혼잡으로 CT001 도착이 7일에서 9일로 늦어졌습니다. 배는 하이퐁 앞바다에서 기다립니다.',
      focus: { lon: 106.68, lat: 20.86, country: '베트남' } });
    await pg.addScriptTag({ content: mock }); await L.sleep(500);
    await pg.screenshot({ path: `${M}shot-${name}.png` });
    console.log(name, JSON.stringify(ctx), r.errors.length); await r.ctx.close(); }
  await L.done(); process.exit(0); })();
