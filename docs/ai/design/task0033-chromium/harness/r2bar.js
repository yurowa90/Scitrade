// R2 막대: 폭 × 입력 종류 × 규칙(1/2) × 날짜. 한 줄 여부·넘침·겹침·하루 진행 위치·높이.
const L = require('./blib'); const fs = require('fs');
const src = fs.readFileSync('m33.js', 'utf8'); const M = src.slice(src.indexOf('`window.measureM2'), src.indexOf('};`;') + 3);
const BAR = () => {
  const bar = document.querySelector('.statusbar'); const br = bar.getBoundingClientRect();
  const kids = [...bar.children].filter((c) => getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0);
  const rs = kids.map((c) => c.getBoundingClientRect());
  const oneLine = Math.max(...rs.map((r) => r.top)) < Math.min(...rs.map((r) => r.bottom));
  let ov = 0; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], b = rs[j]; if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) ov++; }
  const out = rs.filter((r) => r.right > br.right + 0.5 || r.left < br.left - 0.5).length;
  // 칸 안 글이 잘리는지(가로 넘침)
  const clipped = kids.filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.className.split(' ')[0] || c.tagName);
  const ed = bar.querySelector('[data-action="end-day"]'); const er = ed.getBoundingClientRect();
  const lastIsDay = kids[kids.length - 1].contains(ed);
  const stats = [...bar.querySelectorAll('.stat')].map((s) => ({ t: s.textContent.replace(/\s+/g, ' ').trim().slice(0, 18), w: Math.round(s.getBoundingClientRect().width), title: !!s.title, desc: !!s.getAttribute('aria-describedby') }));
  return { h: Math.round(br.height * 10) / 10, top: Math.round(br.top * 10) / 10, oneLine, kids: kids.length, overlaps: ov, outside: out, barOverflow: bar.scrollWidth - bar.clientWidth, clipped, ofx: document.documentElement.scrollWidth - innerWidth,
    endDay: { x: Math.round(er.left), yInBar: Math.round(er.top - br.top), right: Math.round(br.right - er.right), last: lastIsDay }, stats };
};
(async () => {
  const cases = [];
  const widths = (process.argv[2] || '1024,1100,1133,1180,1220,1260,1366,1920').split(',').map(Number);
  for (const touch of [false, true]) for (const w of widths) for (const sc of [['m1', 0], ['m2', 1], ['m2', 8], ['m2', 15]]) cases.push({ touch, w, h: 700, sc: sc[0], day: sc[1] });
  for (const prof of ['t768', 'p390']) for (const sc of [['m1', 0], ['m2', 1], ['m2', 8], ['m2', 15]]) cases.push({ prof, sc: sc[0], day: sc[1] });
  for (const c of cases) {
    const r = c.prof ? await L.newPage(c.prof) : await L.newPage(c.touch ? 'cb1366t' : 'l1366', { viewport: { width: c.w, height: c.h } });
    await r.page.goto(`http://127.0.0.1:4390/${process.argv[3] || 'r33'}/index.html`); await r.page.waitForSelector('[data-action="end-day"]'); await r.page.evaluate(() => document.fonts.ready);
    if (c.sc === 'm2') { await r.page.evaluate(eval(M)); await r.page.evaluate((d) => window.measureM2(d), c.day); }
    await L.sleep(500);
    const v = await r.page.evaluate(`(${BAR})()`);
    console.log(JSON.stringify({ ...c, ...v, errors: r.errors.length }));
    await r.ctx.close();
  }
  await L.done(); process.exit(0);
})();
