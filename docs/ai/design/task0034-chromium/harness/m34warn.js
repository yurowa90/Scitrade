// 지급 경고 상태 만들기 탐색: 규칙 2에서 KRW→USD 환전을 최대로 넣고 하루 진행을 반복
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
(async () => { const { page, ctx, errors } = await L.open('l1366', 'c34'); await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(1)); await L.sleep(400);
  const bar = () => page.evaluate(() => document.querySelector('.statusbar').textContent.replace(/\s+/g, ' ').slice(0, 260));
  for (let d = 0; d < 6; d++) {
    const r = await page.evaluate(async () => { const p = () => new Promise((r) => setTimeout(r, 550)); const dir = document.querySelector('[data-action="exchange-direction"]'); dir.value = 'KRW_TO_USD'; dir.dispatchEvent(new Event('change', { bubbles: true })); await p();
      const a = document.querySelector('select[data-action="exchange-amount"]'); if (a) { a.value = a.options[a.options.length - 1].value; a.dispatchEvent(new Event('change', { bubbles: true })); await p(); }
      const b = document.querySelector('[data-action="exchange"]'); const reason = [...document.querySelectorAll('.exchange .reason')].map((x) => x.textContent.slice(0, 50)); b.click(); await p();
      return { lots: a ? a.value : 'span', reason }; });
    console.log('day', d + 1, JSON.stringify(r), await bar());
    await page.evaluate(async () => { document.querySelector('[data-action="end-day"]').click(); await new Promise((r) => setTimeout(r, 650)); });
  }
  console.log('final', await bar(), 'errors', errors.length); await ctx.close(); process.exit(0); })();
