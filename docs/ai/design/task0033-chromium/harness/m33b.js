const L = require('./blib');
const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
(async () => { for (const prof of ['ipadAirL', 't1000', 'cb1366t']) for (const sc of ['m1', 'm2']) {
  const { page, ctx } = await L.open(prof, 'c33');
  if (sc === 'm2') { await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(1)); await L.sleep(600); }
  const r = await page.evaluate(() => { const bar = document.querySelector('.statusbar'); const br = bar.getBoundingClientRect();
    const items = [...bar.children].map((c) => { const r = c.getBoundingClientRect(); return `${c.className || c.tagName}@${Math.round(r.top - br.top)}:${Math.round(r.left)}+${Math.round(r.width)}`; });
    return { h: Math.round(br.height * 10) / 10, items }; });
  console.log(prof, sc, JSON.stringify(r));
  await ctx.close(); } process.exit(0); })();
