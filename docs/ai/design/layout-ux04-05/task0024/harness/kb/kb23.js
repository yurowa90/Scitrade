// TASK-0023 새 조작 키보드 측정. 인수: prof [dists]
// (1) day2: 수락 → 하루 진행(2일) 뒤 맨 위부터 Tab 한 바퀴. 거꾸로 튐·가림, 새 조작(crew-role·crew-attr·schedule-toggle·goto-contract)이 정지점에 있는지.
// (2) 필터 선택: Tab으로 닿기(앞 정지점에서 Tab), ArrowDown·Space→ArrowDown→Enter로 값 바뀜, 다시 그린 뒤 초점·스크롤.
// (3) 일정 단추: 앞 정지점에서 Tab, Enter로 펼침, 600ms 뒤 Space로 접힘, Enter 두 번(150ms) → 펼친 채.
// (4) 계약 링크: 앞 정지점에서 Tab, Enter → 초점=계약 제목, 제목 위치(막대 아래), 150ms 안 Tab+Enter 무시, 600ms 뒤 받음.
//     Space로도 동작. 마우스/터치 누름 → 150ms 뒤 같은 좌표 누름 무시.
const M = require('./m'); const L = M.L; const K = require('./kbcore');
const prof = process.argv[2] || 'l1366';
const dists = (process.argv[3] || 's23,dev').split(',');
const touch = M.touchOf(prof);
const sleep = L.sleep;

const TABBABLE = 'button:not([disabled]), select:not([disabled]), input:not([disabled]), summary, [tabindex="0"], a[href]';
// 대상 바로 앞 Tab 정지점(문서 순서)에 스크롤 없이 초점을 둔다. 대상은 화면 가운데에 둔다.
async function focusBefore(page, sel) {
  return page.evaluate(([sel, TABBABLE]) => {
    const t = document.querySelector(sel); if (!t) return { err: 'no target' };
    t.scrollIntoView({ block: 'center' });
    const all = [...document.querySelectorAll(TABBABLE)].filter((e) => e.getClientRects().length && e.tabIndex >= 0 && !e.closest('details:not([open]) > :not(summary)') && !e.closest('[hidden]'));
    const i = all.indexOf(t); if (i < 1) return { err: 'idx ' + i };
    const p = all[i - 1]; p.focus({ preventScroll: true });
    return { prev: p.dataset.action || p.id || p.tagName, sy: Math.round(scrollY) };
  }, [sel, TABBABLE]);
}
const act = (page) => page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast'); const band = Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity);
  return { id: a.id, act: a.dataset?.action || '', tag: a.tagName.toLowerCase(), val: a.value ?? null, exp: a.getAttribute('aria-expanded'), top: Math.round(r.top * 10) / 10, fromBar: Math.round((r.top - bar) * 10) / 10, vis: r.top >= bar - 0.5 && r.bottom <= band + 0.5, sy: Math.round(scrollY * 10) / 10 }; });
const appHash = (page) => page.evaluate(() => { const s = document.getElementById('app').innerHTML; let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; });
async function press(page, x, y) { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); }

async function run(dist) {
  const out = { prof, dist };
  // (1) day2 Tab 한 바퀴
  {
    const { page, errors, ctx } = await L.open(prof, dist); await K.setup(page);
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    await M.endDay(page, prof); await sleep(600);
    const regions = await page.evaluate(() => window.__regions());
    const stops = await K.tabCycle(page, 220);
    const j = K.judge(stops, regions, prof === 't1000');
    out.day2 = { n: stops.length, seq: j.seq, back: j.back, hidden: j.hidden,
      newStops: stops.map((s, i) => ({ i: i + 1, ...s })).filter((s) => ['crew-role', 'crew-attr', 'schedule-toggle', 'goto-contract'].includes(s.act)).map((s) => `${s.i}:${s.r}:${s.act}${s.vis ? '' : '(가림)'}@${s.x},${s.py}`),
      links: await page.evaluate(() => [...document.querySelectorAll('[data-action="goto-contract"]')].map((b) => `${b.closest('.panel')?.classList[1]}:${b.dataset.contract}`)) };
    out.day2.stops = stops; out.day2.regions = regions; out.firstStops = stops.slice(0, 40).map((s) => `${s.r}:${s.act || s.id || s.label.slice(0, 10)}@${s.x},${s.py}${s.vis ? '' : '(가림)'}`);
    out.errors1 = errors.slice();
    await ctx.close();
  }
  if (!['s23', 's23fix', 's23fixh'].includes(dist)) { console.log(JSON.stringify(out)); return; }
  // (2) 필터 선택 (1일)
  {
    const { page, errors, ctx } = await L.open(prof, dist); await K.setup(page);
    const opts = await page.evaluate(() => ['crew-role', 'crew-attr'].map((id) => { const s = document.getElementById(id); return s ? [...s.options].map((o) => o.value || '전체') : null; }));
    const res = { opts };
    const cards = () => page.evaluate(() => document.querySelectorAll('.crew-cards article.card').length + '/' + document.querySelectorAll('table.roster tbody tr').length);
    for (const id of ['crew-role', 'crew-attr']) {
      if (!(await page.$('#' + id))) { res[id] = 'absent'; continue; }
      const r = {};
      r.prev = await focusBefore(page, '#' + id); await sleep(100);
      const y0 = await page.evaluate(() => scrollY);
      await page.keyboard.press('Tab'); await sleep(150);
      const a = await act(page); r.tab = `${a.id} vis=${a.vis} dy=${Math.round(a.sy - y0)}`;
      if (a.id !== id) { res[id] = r; continue; }
      const c0 = await cards();
      const y1 = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowDown'); await sleep(300);
      const b = await act(page); r.arrow = `${b.id} val=${b.val} cards ${c0}->${await cards()} dy=${Math.round(b.sy - y1)} vis=${b.vis}`;
      // 되돌리기: ArrowUp
      await page.keyboard.press('ArrowUp'); await sleep(300);
      const c = await act(page); r.arrowUp = `${c.id} val=${c.val} cards=${await cards()}`;
      // Space로 펼친 뒤 ArrowDown, Enter
      await page.keyboard.press(' '); await sleep(300);
      await page.keyboard.press('ArrowDown'); await sleep(150);
      await page.keyboard.press('Enter'); await sleep(400);
      const d = await act(page); r.spaceDownEnter = `${d.id} val=${d.val} cards=${await cards()} vis=${d.vis}`;
      // Enter만
      await page.keyboard.press('Escape'); await sleep(100);
      res[id] = r;
    }
    // 둘 다 고른 뒤 0명 문구, 그다음 Tab이 어디로 가는지
    res.after = await page.evaluate(() => ({ role: document.getElementById('crew-role')?.value, attr: document.getElementById('crew-attr')?.value, empty: !!document.querySelector('.panel.crew .crew-cards p.muted') }));
    res.errors = errors.slice();
    out.facets = res;
    await ctx.close();
  }
  // (3) 일정 단추 (수락 뒤 1일)
  {
    const { page, errors, ctx } = await L.open(prof, dist); await K.setup(page);
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]'); await sleep(600);
    const r = {};
    r.prev = await focusBefore(page, '#schedule-toggle'); await sleep(100);
    let y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Tab'); await sleep(150);
    let a = await act(page); r.tab = `${a.id} vis=${a.vis} dy=${Math.round(a.sy - y0)} exp=${a.exp}`;
    if (a.id === 'schedule-toggle') {
      const t0 = a.top; y0 = await page.evaluate(() => scrollY);
      await page.keyboard.press('Enter'); await sleep(250);
      a = await act(page); r.enter = `${a.id} exp=${a.exp} dTop=${Math.round((a.top - t0) * 10) / 10} dy=${Math.round(a.sy - y0)} vis=${a.vis} links=${await page.evaluate(() => document.querySelectorAll('#schedule-body [data-action="goto-contract"]').length)}`;
      // 펼친 일정 안 링크까지 Tab
      await sleep(400);
      await page.keyboard.press('Tab'); await sleep(150);
      const b = await act(page); r.nextTab = `${b.act || b.id} vis=${b.vis}`;
      await page.keyboard.press('Shift+Tab'); await sleep(150);
      await sleep(600);
      a = await act(page); y0 = a.sy;
      await page.keyboard.press(' '); await sleep(250);
      a = await act(page); r.space = `${a.id} exp=${a.exp} dy=${Math.round(a.sy - y0)}`;
      await sleep(600);
      await page.keyboard.press('Enter'); await sleep(150); await page.keyboard.press('Enter'); await sleep(250);
      a = await act(page); r.enterTwice150 = `${a.id} exp=${a.exp}`;
      await sleep(600);
      await page.keyboard.press('Enter'); await sleep(250);
      a = await act(page); r.enterAfter600 = `${a.id} exp=${a.exp}`;
    }
    r.errors = errors.slice();
    out.schedule = r;
    await ctx.close();
  }
  // (4) 계약 링크 (수락 → 2일)
  for (const key of ['Enter', ' ']) {
    const { page, errors, ctx } = await L.open(prof, dist); await K.setup(page);
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    await M.endDay(page, prof); await sleep(600);
    const r = {};
    const sel = '.report [data-action="goto-contract"]';
    r.prev = await focusBefore(page, sel); await sleep(100);
    let y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Tab'); await sleep(150);
    let a = await act(page); r.tab = `${a.act} vis=${a.vis} dy=${Math.round(a.sy - y0)}`;
    if (a.act === 'goto-contract') {
      const h0 = await appHash(page);
      await page.keyboard.press(key); await sleep(200);
      a = await act(page); r.key = `${a.id} fromBar=${a.fromBar} vis=${a.vis} sameHTML=${h0 === (await appHash(page))}`;
      // 150ms 안 Tab → Enter: 무시되어야 함
      const h1 = await appHash(page);
      await page.keyboard.press('Tab'); await sleep(30);
      const b = await act(page);
      await page.keyboard.press('Enter'); await sleep(250);
      const c = await act(page); r.quickTabEnter = `${b.act || b.id} -> ignored=${h1 === (await appHash(page))} focus=${c.act || c.id}`;
      // 600ms 뒤 같은 단추 Enter: 받아야 함(조작에 따라 HTML이 바뀜)
      await sleep(650);
      if (b.act) { await page.evaluate(([act]) => { [...document.querySelectorAll(`[data-action="${act}"]`)].find((e) => e.getClientRects().length)?.focus({ preventScroll: true }); }, [b.act]); }
      const h2 = await appHash(page);
      await page.keyboard.press('Enter'); await sleep(300);
      r.laterEnter = `${b.act} changed=${h2 !== (await appHash(page))}`;
    }
    r.errors = errors.slice();
    out['link' + (key === ' ' ? 'Space' : 'Enter')] = r;
    await ctx.close();
  }
  // (5) 계약 링크 마우스/터치 → 150ms 뒤 같은 자리 누름 무시
  {
    const { page, errors, ctx } = await L.open(prof, dist);
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    await M.endDay(page, prof); await sleep(600);
    const sel = '.report [data-action="goto-contract"]';
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await sleep(600);
    const p = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    await press(page, p.x, p.y); await sleep(150);
    const a = await act(page);
    const under = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const d = e?.closest('[data-action]'); return d ? d.dataset.action : (e?.tagName || null); }, [p.x, p.y]);
    const h1 = await appHash(page);
    await press(page, p.x, p.y); await sleep(250);
    const r = { first: `${a.id} fromBar=${a.fromBar}`, under, secondIgnored: h1 === (await appHash(page)) };
    // 600ms 뒤 그 자리 단추가 data-action이면 받는지
    await sleep(600);
    const h2 = await appHash(page);
    if (under && !['H3', 'P', 'DIV', 'LI', 'SPAN', 'TD', 'TH', 'TABLE', 'B', 'SMALL', 'H4', 'SECTION', 'ARTICLE', 'UL', 'OL', 'DL', 'DT', 'DD'].includes(under)) { await press(page, p.x, p.y); await sleep(300); r.laterAccepted = h2 !== (await appHash(page)); }
    // 다른 data-action 단추를 계약 칸에서 골라 150ms 안에 누름(좌표 다르게)
    r.errors = errors.slice();
    out.linkPointer = r;
    await ctx.close();
  }
  {
    // 계약 칸 안 첫 data-action 단추(배정·예약 등)를 링크 뒤 150ms에 누름 → 무시, 650ms 뒤 → 받음
    const { page, errors, ctx } = await L.open(prof, dist);
    await M.tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    await M.endDay(page, prof); await sleep(600);
    const sel = '.report [data-action="goto-contract"]';
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await sleep(600);
    const p = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    await press(page, p.x, p.y); await sleep(120);
    const q = await page.evaluate(() => { const c = document.activeElement.closest('.contract'); const b = c && [...c.querySelectorAll('button[data-action]:not([disabled])')].find((e) => { if (['cancel', 'goto-contract'].includes(e.dataset.action)) return false; const r = e.getBoundingClientRect(); return r.top > document.querySelector('.statusbar').getBoundingClientRect().bottom && r.bottom < innerHeight; });
      if (!b) return null; const r = b.getBoundingClientRect(); return { act: b.dataset.action, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const r = { target: q && q.act };
    if (q) {
      const h1 = await appHash(page);
      await press(page, q.x, q.y); await sleep(250);
      r.within500Ignored = h1 === (await appHash(page));
      await sleep(600);
      const h2 = await appHash(page);
      await press(page, q.x, q.y); await sleep(300);
      r.after600Accepted = h2 !== (await appHash(page));
    }
    r.errors = errors.slice();
    out.linkGuard = r;
    await ctx.close();
  }
  console.log(JSON.stringify(out));
}
(async () => { for (const d of dists) await run(d); await L.done(); })().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
