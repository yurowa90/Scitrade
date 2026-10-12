// 브라우저 확대 흉내: CSS 뷰포트 = 물리 창 / 확대, 기기 배율 = 확대. 1280·1366 폭에서 한 열 전환과 막대 높이.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const L = require('./blib');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const rows = [];
  const cases = [];
  for (const [W, H] of [[1280, 690], [1366, 657]]) for (const z of [1, 1.1, 1.25, 1.33, 1.5, 1.75, 2]) cases.push({ W, H, z, vw: Math.floor(W / z), vh: Math.floor(H / z) });
  for (const vw of [999, 1000, 1001, 1002]) cases.push({ W: vw, H: 657, z: 1, vw, vh: 657 });
  for (const c of cases) {
    const ctx = await b.newContext({ viewport: { width: c.vw, height: c.vh }, deviceScaleFactor: c.z, locale: 'ko-KR' });
    // blib의 경로 대행을 쓰기 위해 newPage와 같은 등록
    const { page: p0, ctx: c0 } = { page: null, ctx };
    await ctx.close();
    const r = await L.newPage('l1366', { viewport: { width: c.vw, height: c.vh }, deviceScaleFactor: c.z });
    await r.page.goto('http://127.0.0.1:4390/pt/index.html'); await r.page.waitForSelector('[data-action="end-day"]'); await r.page.evaluate(() => document.fonts.ready); await L.sleep(400);
    const v = await r.page.evaluate(() => { const a = document.querySelector('.panel.trade').getBoundingClientRect(), cr = document.querySelector('.panel.crew').getBoundingClientRect(), bar = document.querySelector('.statusbar').getBoundingClientRect();
      return { oneCol: Math.abs(a.left - cr.left) < 2, mq: matchMedia('(width<=1000px)').matches, barTop: Math.round(bar.top * 10) / 10, barH: Math.round(bar.height * 10) / 10, barBottom: Math.round(bar.bottom * 10) / 10, ofx: document.documentElement.scrollWidth - innerWidth }; });
    rows.push({ ...c, ...v, barHphys: Math.round(v.barH * c.z * 10) / 10, errors: r.errors.length });
    await r.ctx.close();
  }
  console.log(JSON.stringify(rows)); process.exit(0);
})();
