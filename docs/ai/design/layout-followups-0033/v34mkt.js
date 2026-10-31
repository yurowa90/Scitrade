// 시세표 칸: 넘침 폭, 열별 보임(잘린 열), 1행 높이. 인수: 빌드
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
(async () => { for (const prof of ['l1366', 'ipadAirL', 'ipadminiL', 'ipadmini6L', 't1000', 't768', 'p390']) {
  const { page, ctx, errors } = await L.open(prof, process.argv[2]); await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(8)); await L.sleep(500);
  const r = await page.evaluate(() => { const box = document.querySelector('.market-table .table-scroll'); const br = box.getBoundingClientRect(); const t = box.querySelector('table');
    const ths = [...t.querySelectorAll('thead th')]; const cut = ths.filter((th) => th.getBoundingClientRect().right > br.right + 0.5).map((th) => th.textContent.trim().slice(0, 6));
    const rows = [...t.querySelectorAll('tbody tr')].map((tr) => Math.round(tr.getBoundingClientRect().height));
    return { cw: box.clientWidth, sw: box.scrollWidth, tableW: Math.round(t.getBoundingClientRect().width), cut, rowH: [Math.min(...rows), Math.max(...rows)], tableH: Math.round(t.getBoundingClientRect().height), ofx: document.documentElement.scrollWidth - innerWidth }; });
  console.log(prof, JSON.stringify(r), 'err', errors.length); await ctx.close(); } process.exit(0); })();
