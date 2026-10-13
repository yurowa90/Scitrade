const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
(async () => { const rows = [];
  for (const touch of [false, true]) for (const w of [1001, 1100, 1180, 1220, 1260, 1280, 1300, 1366]) {
    const r = await L.newPage(touch ? 'cb1366t' : 'l1366', { viewport: { width: w, height: 700 } });
    await r.page.goto('http://127.0.0.1:4390/c33/index.html'); await r.page.waitForSelector('[data-action="end-day"]'); await r.page.evaluate(() => document.fonts.ready);
    await r.page.evaluate(eval(M)); await r.page.evaluate(() => window.measureM2(1)); await L.sleep(500);
    const h = await r.page.evaluate(() => Math.round(document.querySelector('.statusbar').getBoundingClientRect().height * 10) / 10);
    rows.push(`${touch ? 'touch' : 'mouse'} ${w}: ${h}`); await r.ctx.close(); }
  console.log(rows.join('\n')); process.exit(0); })();
