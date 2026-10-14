// TASK-0061 상황실 지도 실측. node m61.js <part> [dist]
const L = require('./blib');
const DIST = process.argv[3] || 's61';
const part = process.argv[2];
async function prepare(prof, extra = {}) {
  const r = await L.newPage(prof, extra); const pg = r.page;
  await pg.goto(`http://127.0.0.1:4390/${DIST}/index.html`); await pg.waitForSelector('[data-action="end-day"]'); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => { const s = document.querySelector('select[data-action="scenario"]'); s.value = 'SCENARIO_M1_DELAY_ACCEPTED'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(800);
  await L.tap(pg, '[data-action="accept"]:not([disabled])');
  for (let d = 1; d < 8; d++) { for (const a of ['book', 'assign']) { const sel = `[data-action="${a}"]:not([disabled])`; if (await pg.$(sel)) await L.tap(pg, sel).catch(() => {}); } await L.endDay(pg); await L.sleep(250); }
  return r;
}
async function openSR(pg, touch) {
  await pg.evaluate(() => document.querySelector('[data-action="situation"]').scrollIntoView({ block: 'center' })); await L.sleep(150);
  await L.tap(pg, '[data-action="situation"]', { touch }); await pg.waitForSelector('.situation #situation-h'); await L.sleep(400);
}
const rect = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; };
const LAYOUT = `(() => { const R = ${rect}; const q = (s) => document.querySelector(s); const aside = q('.situation aside'); const ctrl = q('.situation-controls'); const ref = q('.situation-reference');
  const toggles = [...document.querySelectorAll('.situation-toggle')].map((t) => ({ t: t.textContent.trim().slice(0, 14), ...R(t), inView: t.getBoundingClientRect().bottom <= innerHeight && t.getBoundingClientRect().top >= 0 }));
  const brief = q('.situation-brief'); const p = q('.situation-brief p');
  const cards = [...document.querySelectorAll('.situation-country-card')].map((c) => ({ h: c.querySelector('h3').textContent, ...R(c), dd: [...c.querySelectorAll('dd')].map((d) => ({ t: d.textContent, lines: Math.round(d.getBoundingClientRect().height / parseFloat(getComputedStyle(d).lineHeight)) })) }));
  const stage = q('.situation-stage'); const st = stage ? R(stage) : null;
  const cardOverStage = st ? cards.filter((c) => c.x < st.r && c.r > st.x && c.y < st.b && c.b > st.y).length : null;
  return { vw: innerWidth, vh: innerHeight, ofx: document.documentElement.scrollWidth - innerWidth, rootScroll: q('.situation').scrollHeight - q('.situation').clientHeight, header: R(q('.situation header')), stage: st, aside: aside ? R(aside) : null,
    controls: ctrl ? { ...R(ctrl) } : null, brief: brief ? { ...R(brief), pScroll: p ? p.scrollHeight - p.clientHeight : null, text: p?.textContent.length } : null, toggles,
    refScroll: ref ? { sh: ref.scrollHeight, ch: ref.clientHeight } : null, cards, cardOverStage, briefButtons: [...document.querySelectorAll('.situation-brief button')].map((b) => ({ t: b.textContent, ...R(b) })) }; })()`;
const PORTS = `(() => { const cs = [...document.querySelectorAll('.situation-port')]; const vis = cs.filter((c) => !c.closest('[hidden]')); const sizes = vis.map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
  const inStage = sizes.filter((r) => r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight);
  const w = inStage.map((r) => r.width).sort((a, b) => a - b); return { total: cs.length, prominent: cs.filter((c) => c.getAttribute('opacity') === '1').length, onScreen: inStage.length, cssDiameter: w.length ? [Math.round(w[0] * 10) / 10, Math.round(w[w.length >> 1] * 10) / 10] : null, focusable: cs.filter((c) => c.tabIndex >= 0).length }; })()`;
(async () => {
  const out = (o) => console.log(JSON.stringify(o));
  if (part === 'ipad' || part === 'cb') {
    const touch = part === 'ipad'; const prof = touch ? 'ipadminiL' : 'l1366'; const r = await prepare(prof, touch ? {} : { viewport: { width: 1366, height: 768 } }); const pg = r.page;
    await openSR(pg, touch);
    out({ part, step: 'briefing', ...(await pg.evaluate(LAYOUT)), ports: await pg.evaluate(PORTS), errors: r.errors });
    await pg.screenshot({ path: `${L.S}/s61/${touch ? 'ipad' : 'chromebook'}-briefing.png` });
    // 자유 탐색 + 레이어 모두 켬
    await L.tap(pg, '.situation [data-situation="free"]', { touch }); await L.sleep(300);
    if (!(await pg.$eval('#situation-nightlights', (e) => e.checked))) { await L.tap(pg, 'label[for="situation-nightlights"]', { touch }); await L.sleep(500); }
    out({ part, step: 'free-all', ...(await pg.evaluate(LAYOUT)), ports: await pg.evaluate(PORTS), nl: await pg.evaluate(() => { const im = document.querySelector('[data-situation-layer="nightlights"]'); return im ? { href: im.getAttribute('href'), loaded: performance.getEntriesByType('resource').some((e) => e.name.includes('nightlights')) } : null; }),
      overlap: await pg.evaluate(() => { const lab = [...document.querySelectorAll('.situation svg .port text, .situation svg .port-label, .situation svg .port rect')].map((e) => e.getBoundingClientRect()); const badge = [...document.querySelectorAll('.situation-country')].map((e) => ({ t: e.textContent, r: e.getBoundingClientRect() }));
        return badge.map((b) => ({ t: b.t, hits: lab.filter((l) => l.width && b.r.left < l.right && b.r.right > l.left && b.r.top < l.bottom && b.r.bottom > l.top).length, x: Math.round(b.r.x), y: Math.round(b.r.y), inStage: b.r.right <= document.querySelector('.situation-stage').getBoundingClientRect().right })); }) });
    await pg.screenshot({ path: `${L.S}/s61/${touch ? 'ipad' : 'chromebook'}-all.png` });
    // 항만 하나 누르기(또렷한 것 중 화면 가운데에 가까운 것)
    const pt = await pg.evaluate(() => { const cs = [...document.querySelectorAll('.situation-port[opacity="1"]')].map((c) => c.getBoundingClientRect()).filter((r) => r.width && r.left > 40 && r.top > 120 && r.right < innerWidth - 400); const r = cs[0]; return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
    if (pt) { if (touch) await pg.touchscreen.tap(pt.x, pt.y); else await pg.mouse.click(pt.x, pt.y); await L.sleep(400); }
    out({ part, step: 'port-pick', pt, sel: await pg.evaluate(() => { const s = document.querySelector('.situation-selection'); return s ? s.textContent.replace(/\s+/g, ' ').slice(0, 120) : null; }), active: await pg.evaluate(() => document.activeElement?.id || document.activeElement?.tagName) });
    // 표로 보기
    await L.tap(pg, '.situation [data-situation="table"]', { touch }); await L.sleep(400);
    out({ part, step: 'table', focus: await pg.evaluate(() => document.activeElement?.id), rows: await pg.evaluate(() => [...document.querySelectorAll('.situation-tables table')].map((t) => ({ k: t.dataset.table, cap: t.querySelector('caption')?.textContent, rows: t.tBodies[0].rows.length }))), years: await pg.evaluate(() => [...document.querySelectorAll('[data-table="countries"] tbody tr')].map((tr) => tr.cells[2]?.textContent).join(',')), ofx: await pg.evaluate(() => { const t = document.querySelector('.situation-tables'); return t.scrollWidth - t.clientWidth; }) });
    await r.ctx.close();
  }
  if (part === 'zoom') { // 400%: 1366×768 → 341×192 CSS px, 1024×768 → 256×192
    for (const [w, h] of [[342, 192], [256, 192]]) { const r = await prepare('l1366', { viewport: { width: 1366, height: 768 } }); const pg = r.page; await pg.setViewportSize({ width: w, height: h }); await L.sleep(600); await openSR(pg, false);
      const lay = await pg.evaluate(() => { const q = (s) => document.querySelector(s); const sr = q('.situation'); const R = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
        return { display: getComputedStyle(sr).display, ofx: sr.scrollWidth - sr.clientWidth, docOfx: document.documentElement.scrollWidth - innerWidth, srScrollH: sr.scrollHeight, stage: R(q('.situation-stage')), aside: R(q('.situation aside')), header: R(q('.situation header')), close: R(q('[data-situation="close"]')), wide: [...sr.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('svg')).slice(0, 5).map((e) => e.tagName + '.' + (e.className?.baseVal ?? e.className)) }; });
      // 키보드로 닫기·토글·브리핑 닿기
      const seq = []; for (let i = 0; i < 30; i++) { await pg.keyboard.press('Tab'); await L.sleep(60); seq.push(await pg.evaluate(() => { const e = document.activeElement; const b = e.getBoundingClientRect(); return (e.dataset.situation || e.id || e.tagName) + (b.bottom > innerHeight || b.top < 0 ? '(밖)' : ''); })); }
      out({ part: 'zoom', w, h, ...lay, tabs: seq.join(' '), errors: r.errors }); await r.ctx.close(); } }
  if (part === 'a11y') {
    const r = await prepare('l1366', { viewport: { width: 1366, height: 768 } }); const pg = r.page;
    const opener = await pg.evaluate(() => { const b = document.querySelector('[data-action="situation"]'); return { haspopup: b.getAttribute('aria-haspopup'), text: b.textContent }; });
    await L.sleep(700); await pg.focus('[data-action="situation"]'); await pg.keyboard.press('Enter'); await pg.waitForSelector('.situation #situation-h'); await L.sleep(400);
    const dlg = await pg.evaluate(() => { const d = document.querySelector('.situation'); return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), labelled: document.getElementById(d.getAttribute('aria-labelledby'))?.textContent, focus: document.activeElement?.id, appInert: document.querySelector('#app').inert, status: [...d.querySelectorAll('[role=status]')].map((e) => e.id || e.className), live: document.getElementById('situation-live')?.getAttribute('aria-live') }; });
    // Tab 순환
    const seq = []; for (let i = 0; i < 16; i++) { await pg.keyboard.press('Tab'); seq.push(await pg.evaluate(() => document.activeElement?.dataset.situation || document.activeElement?.id || document.activeElement?.tagName)); }
    await pg.focus('#situation-h'); await pg.keyboard.press('Shift+Tab'); const back = await pg.evaluate(() => document.activeElement?.dataset.situation || document.activeElement?.id);
    // 토글 낭독: 살아 있는 영역 노드가 바뀌는지, 문장
    const live = await pg.evaluate(async () => { const log = []; const p = () => new Promise((r) => setTimeout(r, 120));
      for (const id of ['ports', 'nightlights', 'ports']) { const before = document.getElementById('situation-live'); const cb = document.getElementById('situation-' + id); cb.focus(); cb.click(); await p(); const after = document.getElementById('situation-live');
        log.push({ id, text: after.textContent, sameNode: before === after, beforeConnected: before.isConnected, focus: document.activeElement?.id }); } return log; });
    // 브리핑 다음 사건: status 카드도 새 노드인지
    const brief = await pg.evaluate(async () => { const b0 = document.querySelector('.situation-brief'); const n = document.querySelector('[data-situation="next"]'); const dis = n?.disabled; if (n && !dis) n.click(); await new Promise((r) => setTimeout(r, 150)); const b1 = document.querySelector('.situation-brief'); return { nextDisabled: dis, sameNode: b0 === b1, h: b1?.querySelector('h3')?.textContent, focus: document.activeElement?.id }; });
    // 표 caption·연도
    await pg.evaluate(() => document.querySelector('[data-situation="table"]').click()); await L.sleep(300);
    const tbl = await pg.evaluate(() => ({ caps: [...document.querySelectorAll('.situation caption')].map((c) => c.textContent), years: [...new Set([...document.querySelectorAll('[data-table="countries"] tbody tr')].map((tr) => tr.cells[2]?.textContent))] }));
    await pg.keyboard.press('Escape'); await L.sleep(300);
    const after = await pg.evaluate(() => ({ open: !!document.querySelector('.situation'), focus: document.activeElement?.dataset.action, appInert: document.querySelector('#app').inert, endDay: document.querySelector('[data-action="end-day"]').disabled }));
    out({ part: 'a11y', opener, dlg, tabCycle: seq.join(' '), shiftTabFromTitle: back, live, brief, tbl, afterEscape: after, errors: r.errors }); await r.ctx.close(); }
  if (part === 'motion') {
    for (const rm of ['reduce', 'no-preference']) { const r = await prepare('l1366', { viewport: { width: 1366, height: 768 }, reducedMotion: rm }); const pg = r.page; await openSR(pg, false);
      const m = await pg.evaluate(() => { const st = document.querySelector('.situation-stage'); const after = getComputedStyle(st, '::after'); const svg = st.querySelector('svg');
        const anims = document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.effect?.target?.getAttribute?.('class') || a.effect?.target?.tagName) + ':' + (a.animationName || ''));
        const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
        const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 10) / 10; };
        const aside = document.querySelector('.situation aside'); const small = aside.querySelector('.situation-toggle small'); const brief = aside.querySelector('.situation-brief p');
        return { stageClass: st.className, scan: /repeating-linear-gradient/.test(after.backgroundImage), vignette: /radial-gradient/.test(after.backgroundImage), svgMoving: svg.classList.contains('situation-moving'), runningAnims: anims, afterOnStageOnly: getComputedStyle(document.querySelector('.situation aside'), '::after').content,
          contrast: { asideText: ratio(getComputedStyle(aside).color, getComputedStyle(aside).backgroundColor), small: ratio(getComputedStyle(small).color, getComputedStyle(aside).backgroundColor), briefText: brief ? ratio(getComputedStyle(brief).color, getComputedStyle(brief.parentElement).backgroundColor) : null } }; });
      // 브리핑 다음 사건 뒤 이동 클래스
      await pg.evaluate(() => document.querySelector('[data-situation="free"]').click()); await L.sleep(100); await pg.evaluate(() => document.querySelector('[data-situation="briefing"]').click()); await L.sleep(50);
      const moving = await pg.evaluate(() => document.querySelector('.situation svg').classList.contains('situation-moving'));
      out({ part: 'motion', rm, ...m, movingAfterBriefing: moving, errors: r.errors }); await r.ctx.close(); } }
  await L.done(); process.exit(0);
})();
