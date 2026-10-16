// R2 추가: 결함 1 재현(지도 누른 뒤 초점·Escape), 누르기 반지름, 근처 목록, '자세히', Shift+Tab, 전체 보기
const L = require('./blib');
async function prep(prof, vp) { const r = await L.newPage(prof, vp ? { viewport: vp } : {}); const pg = r.page;
  await pg.goto('http://127.0.0.1:4390/s61r2/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => { const s = document.querySelector('select[data-action="scenario"]'); s.value = 'SCENARIO_M1_DELAY_ACCEPTED'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(800);
  await L.tap(pg, '[data-action="accept"]:not([disabled])'); for (let d = 1; d < 8; d++) { for (const a of ['book', 'assign']) { const sel = `[data-action="${a}"]:not([disabled])`; if (await pg.$(sel)) await L.tap(pg, sel).catch(() => {}); } await L.endDay(pg); await L.sleep(250); }
  await L.sleep(700); await pg.evaluate(() => document.querySelector('[data-action="situation"]').scrollIntoView({ block: 'center' })); await L.tap(pg, '[data-action="situation"]', { touch: prof !== 'l1366' }); await pg.waitForSelector('#situation-h'); await L.sleep(400); return r; }
const act = (pg) => pg.evaluate(() => { const e = document.activeElement; return e?.id || e?.dataset?.situation || e?.tagName; });
(async () => { const out = (o) => console.log(JSON.stringify(o));
  // A. 결함 1 재현(1024 터치): 자유 탐색 → 또렷한 항만 점 → 초점·Escape·Tab
  { const r = await prep('ipadminiL'); const pg = r.page; await L.tap(pg, '.situation [data-situation="free"]', { touch: true }); await L.sleep(300);
    const dots = await pg.evaluate(() => [...document.querySelectorAll('.situation-port')].filter((c) => !c.closest('[hidden]')).map((c) => { const b = c.getBoundingClientRect(); return { id: c.dataset.port, op: c.getAttribute('opacity'), x: b.left + b.width / 2, y: b.top + b.height / 2 }; }).filter((p) => p.x > 30 && p.y > 90 && p.x < 720 && p.y < 620));
    // 다른 점·거점과 44px 넘게 떨어진 옅은 점을 고른다(반지름 시험용)
    const marks = await pg.evaluate(() => [...document.querySelectorAll('.situation [data-mark-dot], .situation [data-mark]')].map((m) => { const b = m.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }));
    const lone = dots.find((d) => dots.every((o) => o === d || Math.hypot(o.x - d.x, o.y - d.y) > 44) && marks.every((m) => Math.hypot(m.x - d.x, m.y - d.y) > 44));
    const res = {};
    if (lone) { await pg.touchscreen.tap(lone.x + 15, lone.y); await L.sleep(400);
      res.offset15 = await pg.evaluate(() => ({ h: document.getElementById('situation-selection-h')?.textContent, list: document.querySelectorAll('[data-situation="pick"]').length }));
      res.focusAfter = await act(pg);
      await pg.keyboard.press('Escape'); await L.sleep(300); res.closedByEscape = !(await pg.$('.situation')); res.focusAfterEscape = await pg.evaluate(() => document.activeElement?.dataset.action); }
    out({ part: 'defect1', lone, ...res, errors: r.errors }); await r.ctx.close(); }
  // B. 근처 여럿 → 목록, 고른 뒤 초점, Shift+Tab
  { const r = await prep('ipadminiL'); const pg = r.page; await L.tap(pg, '.situation [data-situation="free"]', { touch: true }); await L.sleep(300);
    const pair = await pg.evaluate(() => { const ps = [...document.querySelectorAll('.situation-port')].filter((c) => !c.closest('[hidden]')).map((c) => { const b = c.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }).filter((p) => p.x > 30 && p.y > 90 && p.x < 720);
      for (const a of ps) for (const b of ps) if (a !== b && Math.hypot(a.x - b.x, a.y - b.y) < 16) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; return null; });
    const res = { pair };
    if (pair) { await pg.touchscreen.tap(pair.x, pair.y); await L.sleep(400);
      res.list = await pg.evaluate(() => [...document.querySelectorAll('[data-situation="pick"]')].map((b) => ({ t: b.textContent.slice(0, 20), h: Math.round(b.getBoundingClientRect().height) })));
      res.focus = await act(pg);
      await pg.keyboard.press('Shift+Tab'); await L.sleep(100); res.shiftTabFromSelection = await act(pg);
      await pg.focus('#situation-selection-h'); await pg.keyboard.press('Tab'); await L.sleep(100); res.tabFromSelection = await act(pg);
      if (res.list.length) { await L.tap(pg, '[data-situation="pick"]', { touch: true }); await L.sleep(400); res.afterPick = { focus: await act(pg), h: await pg.evaluate(() => document.getElementById('situation-selection-h')?.textContent) }; } }
    out({ part: 'nearby', ...res, errors: r.errors }); await r.ctx.close(); }
  // C. 1024 '자세히' 펼친 뒤 토글 위치
  { const r = await prep('ipadminiL'); const pg = r.page;
    const lay = () => pg.evaluate(() => ({ brief: Math.round(document.querySelector('.situation-brief').getBoundingClientRect().bottom), toggles: [...document.querySelectorAll('.situation-toggle')].map((t) => Math.round(t.getBoundingClientRect().bottom)), vh: innerHeight, details: document.querySelector('.situation-brief details')?.open, summaryH: Math.round(document.querySelector('.situation-brief summary')?.getBoundingClientRect().height || 0), text: document.querySelector('.situation-brief p')?.textContent.length, controlsScroll: (() => { const c = document.querySelector('.situation-controls'); return c.scrollHeight - c.clientHeight; })(), asideScroll: (() => { const a = document.querySelector('.situation aside'); return a.scrollHeight - a.clientHeight; })() }));
    const before = await lay(); await L.tap(pg, '.situation-brief summary', { touch: true }); await L.sleep(300); const after = await lay();
    out({ part: 'details', before, after, focus: await act(pg), errors: r.errors }); await r.ctx.close(); }
  // D. 전체 보기
  { const r = await prep('l1366', { width: 1366, height: 768 }); const pg = r.page; await pg.evaluate(() => document.querySelector('[data-situation="free"]').click()); await L.sleep(300);
    const vb1 = await pg.evaluate(() => document.querySelector('.situation svg').getAttribute('viewBox')); const all = await pg.$('[data-situation="all"]');
    if (all) { await pg.evaluate(() => document.querySelector('[data-situation="all"]').click()); await L.sleep(300); }
    out({ part: 'fullmap', freeVB: vb1, allButton: !!all, allVB: await pg.evaluate(() => document.querySelector('.situation svg').getAttribute('viewBox')), focus: await act(pg), errors: r.errors }); await r.ctx.close(); }
  await L.done(); process.exit(0); })();
