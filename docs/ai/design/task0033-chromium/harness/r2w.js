// 합성: 8일 상태 견적 카드의 사실 목록에 경고 문장 3개를 같은 <li>로 넣고 줄 수·넘침을 잰다.
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
const LINES = ['납기 12일 늦으면 하루 50.00 USD씩, 최대 계약 금액의 20%까지 감액됩니다 — 이 계획으로는 1,250.00 USD', '납기 3일 늦으면 하루 50.00 USD씩 감액됩니다 — 이 계획으로는 150.00 USD', '납기를 넘기면 한 번 50.00 USD 감액됩니다 — 이 계획으로는 50.00 USD'];
(async () => { for (const prof of ['l1366', 'ipadminiL', 't1000', 't768', 'p390']) {
  const { page, ctx, errors } = await L.open(prof, 'r33');
  await page.evaluate(eval(M)); await page.evaluate(() => window.measureM2(8)); await L.sleep(600);
  const r = await page.evaluate((lines) => {
    const out = [];
    for (const card of [...document.querySelectorAll('.offer-board article')].slice(0, 3)) {
      const li0 = [...card.querySelectorAll('li')].find((l) => l.textContent.includes('화물 공간')); if (!li0) continue;
      const cr = card.getBoundingClientRect();
      for (const t of lines) { const li = li0.cloneNode(false); li.textContent = t; li0.parentElement.appendChild(li);
        const cs = getComputedStyle(li); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5; const r = li.getBoundingClientRect();
        out.push({ card: card.querySelector('h3,h4,strong')?.textContent.trim().slice(0, 12), t: t.slice(0, 14), lines: Math.round(r.height / lh), w: Math.round(r.width), out: r.right > cr.right + 0.5 || li.scrollWidth > li.clientWidth + 1 }); }
    }
    return { ofx: document.documentElement.scrollWidth - innerWidth, out };
  }, LINES);
  const agg = {}; for (const x of r.out) { const k = x.t; agg[k] = agg[k] || []; agg[k].push(x.lines + (x.out ? '!' : '')); }
  console.log(prof, 'ofx', r.ofx, JSON.stringify(agg), 'err', errors.length); await ctx.close(); } process.exit(0); })();
