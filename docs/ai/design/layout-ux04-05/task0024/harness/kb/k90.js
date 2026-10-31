// 90일 끝 키보드: (0) l1366 s23에서 의류 수락 뒤 89번 하루 진행 → 90일 저장 문자열을 파일로. (1) 프로필마다 저장 불러오기 → 하루 진행 단추에 초점 → Enter.
// 초점·제목 위치·scrollBy·‘91일’·하루 진행 비활성, 그다음 Tab·Shift+Tab, ‘결산 보기’ 단추 Tab 닿기·Enter·Space, 500ms 막기.
const fs = require('fs');
const M = require('./m'); const L = M.L; const K = require('./kbcore');
const profs = (process.argv[2] || 'l1366').split(',');
const dists = (process.argv[3] || 's23').split(',');
const SAVE = `${L.OUT}/out/save-d90.txt`;
const sleep = L.sleep;
const day = (page) => page.evaluate(() => Number(document.querySelector('.statusbar .date b')?.textContent.replace(/\D/g, '')));
async function makeSave() {
  const { page, ctx } = await L.open('l1366', 'head');
  await M.tap(page, 'l1366', '[data-action="accept"][data-buy="OFFER_BUY_01"]');
  for (let i = 0; i < 95 && (await day(page)) < 90; i++) { await sleep(520); await page.evaluate(() => document.querySelector('[data-action="end-day"]').click()); await sleep(30); }
  const d = await day(page);
  await sleep(600);
  await page.evaluate(() => document.querySelector('[data-action="save"]').click()); await sleep(200);
  const text = await page.evaluate(() => localStorage.getItem('scitrade-save'));
  fs.writeFileSync(SAVE, text);
  await ctx.close();
  return d;
}
const act = (page) => page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom;
  return { id: a.id, act: a.dataset?.action || '', reg: window.__region ? window.__region(a) : '', fromBar: Math.round((r.top - bar) * 10) / 10, vis: r.top >= bar - 0.5 && r.bottom <= innerHeight + 0.5, sy: Math.round(scrollY) }; });
const s = (a) => `${a.reg}:${a.act || a.id} fromBar=${a.fromBar} vis=${a.vis}`;
(async () => {
  if (!fs.existsSync(SAVE)) console.error('save day', await makeSave());
  const text = fs.readFileSync(SAVE, 'utf8');
  for (const prof of profs) for (const dist of dists) {
    const { page, ctx, errors } = await L.newPage(prof);
    await ctx.addInitScript((t) => { try { localStorage.setItem('scitrade-save', t); } catch {} }, text);
    await page.goto(`http://127.0.0.1:4390/${dist}/index.html`);
    await page.waitForSelector('[data-action="end-day"]'); await page.evaluate(() => document.fonts.ready); await sleep(300);
    await K.setup(page);
    await M.tap(page, prof, '[data-action="load"]'); await sleep(400);
    const out = { prof, dist, day0: await day(page) };
    await M.instrument(page);
    await sleep(600);
    await page.focus('[data-action="end-day"]'); await sleep(100);
    await page.keyboard.press('Enter'); await sleep(500);
    const lg = await M.log(page);
    out.afterEnd = s(await act(page));
    out.scrollBy = lg.scrollBy; out.siv = lg.sivIds;
    out.ended = await page.evaluate(() => ({ endDisabled: document.querySelector('[data-action="end-day"]').disabled, d91: (document.getElementById('app').textContent.match(/91일/g) || []).length, toast: document.querySelector('.flash-toast')?.textContent.trim().slice(0, 60) ?? null, flash: document.querySelector('.queue .flash')?.textContent.trim().slice(0, 60) ?? null, ovf: Math.max(0, document.documentElement.scrollWidth - innerWidth) }));
    // 결산 제목에서 Tab 5번, 그다음 Shift+Tab 5번
    const tabs = [];
    for (let i = 0; i < 5; i++) { const y0 = await page.evaluate(() => scrollY); await page.keyboard.press('Tab'); await sleep(120); const a = await act(page); tabs.push(`${a.reg}:${a.act || a.id}${a.vis ? '' : '(가림)'} dy${a.sy - Math.round(y0)}`); }
    out.tabFromSettlement = tabs;
    // 맨 위에서 Tab 한 바퀴: 거꾸로 튐·가림
    const regions = await page.evaluate(() => window.__regions());
    const stops = await K.tabCycle(page, 220);
    const j = K.judge(stops, regions, prof === 't1000');
    out.cycle = { stops, regions, n: stops.length, seq: j.seq, back: j.back.map((b) => `${b.from}->${b.to}`), hidden: j.hidden };
    // ‘결산 보기’: 앞 정지점 → Tab → Enter
    const btn = '.queue [data-action="skip-to"][data-target="settlement-h"]';
    out.hasBtn = !!(await page.$(btn));
    for (const key of ['Enter', ' ']) {
      if (!out.hasBtn) break;
      await sleep(600);
      const prev = await page.evaluate(([sel, T]) => { const t = document.querySelector(sel); t.scrollIntoView({ block: 'center' }); const all = [...document.querySelectorAll(T)].filter((e) => e.getClientRects().length && e.tabIndex >= 0); const i = all.indexOf(t); all[i - 1].focus({ preventScroll: true }); return all[i - 1].dataset.action || all[i - 1].id; }, [btn, K.TABBABLE]);
      const y0 = await page.evaluate(() => scrollY);
      await page.keyboard.press('Tab'); await sleep(150);
      const a = await act(page);
      await page.keyboard.press(key); await sleep(300);
      const b = await act(page);
      out['btn' + (key === ' ' ? 'Space' : 'Enter')] = `prev=${prev} tab→${a.act}:${a.vis} dy${a.sy - Math.round(y0)} → ${s(b)}`;
    }
    if (prof === 'l1366' || prof === 't1000' || prof === 'cb1366t') await M.shot(page, `k90-${prof}-${dist}`);
    out.errors = errors;
    console.log(JSON.stringify(out));
    await ctx.close();
  }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
