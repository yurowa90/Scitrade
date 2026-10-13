// TASK-0033 M2 화면 실측. 인수: 프로필 목록, 빌드(c33), 상태 목록(1,8,15)
const L = require('./blib');
const MEASURE_M2 = `window.measureM2 = async function (targetDay) {
  const pause = () => new Promise(resolve => setTimeout(resolve, 550));
  const pick = async (selector, value) => { const el = document.querySelector(selector); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); await pause(); };
  const oldConfirm = window.confirm; window.confirm = () => true;
  try { await pick('[data-action="scenario"]', 'SCENARIO_M2_OPERATIONS'); } finally { window.confirm = oldConfirm; }
  for (let day = 1; day < targetDay; day++) {
    if (targetDay === 15 && day === 14) { document.querySelector('[data-action="exchange"]').click(); await pause(); }
    document.querySelector('[data-action="end-day"]').click(); await pause();
  }
  if (targetDay === 15) await pick('[data-action="offer-quantity"][data-key="MKT-D015-COS-BUY+MKT-D015-COS-SELL"]', '100');
};`;
const REGION = `(el) => { if (!el || el === document.body) return 'body';
  if (el.closest('.skip-links')) return 'skip'; if (el.closest('.masthead')) return 'head'; if (el.closest('.statusbar')) return 'bar'; if (el.closest('.flash-toast')) return 'toast';
  if (el.closest('.exchange')) return 'exchange'; if (el.closest('.market-table')) return 'market'; if (el.closest('.offer-board')) return 'offers';
  const p = el.closest('main > *'); if (!p) return 'other'; if (p.classList.contains('maincol')) return el.closest('.panel.trade') ? 'trade' : 'local';
  for (const k of ['trade', 'crew', 'resources', 'queue', 'world', 'report', 'log']) if (p.classList.contains(k)) return k; return p.className; }`;
async function tabOrder(page) {
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  const seq = []; let first = null;
  for (let i = 0; i < 300; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(`(() => { const a = document.activeElement; if (!a || a === document.body) return null; if (!a.dataset.tk) a.dataset.tk = String(Math.random());
      const bar = document.querySelector('.statusbar').getBoundingClientRect(); const r = a.getBoundingClientRect(); const reg = (${REGION})(a);
      const vis = ['skip','bar','toast'].includes(reg) ? r.top >= -0.5 && r.bottom <= innerHeight + 0.5 : reg === 'head' ? r.top >= -0.5 : r.top >= bar.bottom - 0.5 && r.bottom <= innerHeight + 0.5;
      const lab = (a.dataset.action || a.tagName.toLowerCase()) + (a.tagName === 'SUMMARY' ? ':' + a.textContent.trim().slice(0, 8) : '');
      return [a.dataset.tk, reg, lab, Math.round(scrollY), vis, a.tagName === 'IFRAME']; })()`);
    if (!s) continue; if (s[0] === first) break; if (!first) first = s[0];
    seq.push(s.slice(1));
  }
  const runs = []; for (const [r] of seq) { if (!runs.length || runs[runs.length - 1][0] !== r) runs.push([r, 1]); else runs[runs.length - 1][1]++; }
  let back = 0; for (let i = 1; i < seq.length; i++) if (seq[i][2] < seq[i - 1][2] - 1 && !['skip', 'head', 'bar'].includes(seq[i][0])) back++;
  return { stops: seq.length, hidden: seq.filter((s) => !s[3]).length, hiddenList: seq.filter((s) => !s[3]).map((s) => s[0] + ':' + s[1]).join(' '), back, runs: runs.map(([r, n]) => `${r}×${n}`).join(' '), order: seq.map((s) => s[0] + ':' + s[1]).join(' ') };
}
async function boxes(page) {
  return page.evaluate(() => {
    const R = (e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top + scrollY), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; };
    const ov = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return Math.max(0, Math.min(x.right, y.right) - Math.max(x.left, y.left)) * Math.max(0, Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top)); };
    const out = { ofx: document.documentElement.scrollWidth - innerWidth };
    const ex = document.querySelector('.exchange');
    if (ex) {
      const ctl = [...ex.querySelectorAll('select, input, button')];
      out.exchange = { box: R(ex), controls: ctl.map((c) => (c.dataset.action || c.tagName) + ' ' + R(c).w + '×' + R(c).h), overlaps: 0, outside: 0, overflow: ex.scrollWidth - ex.clientWidth };
      for (let i = 0; i < ctl.length; i++) for (let j = i + 1; j < ctl.length; j++) if (ov(ctl[i], ctl[j]) > 1) out.exchange.overlaps++;
      const er = ex.getBoundingClientRect(); for (const c of ex.querySelectorAll('*')) { const r = c.getBoundingClientRect(); if (r.width && (r.right > er.right + 0.5 || r.left < er.left - 0.5)) out.exchange.outside++; }
    }
    const mt = document.querySelector('.market-table .table-scroll');
    if (mt) out.market = { box: R(mt), client: mt.clientWidth, scroll: mt.scrollWidth, scrolls: mt.scrollWidth > mt.clientWidth, tabbable: mt.tabIndex >= 0, label: mt.getAttribute('aria-label') || mt.getAttribute('role') || '' };
    const qs = [...document.querySelectorAll('[data-action="offer-quantity"]')];
    out.qty = qs.map((q) => ({ key: q.dataset.key?.slice(4, 16), opts: q.options.length, v: q.value, size: R(q).w + '×' + R(q).h, disabled: q.disabled }));
    // 견적 카드 안 경고·감액 문장: 줄 수와 카드 밖 넘침
    const warn = [];
    for (const card of document.querySelectorAll('.offer-board .offer')) {
      const cr = card.getBoundingClientRect();
      for (const p of card.querySelectorAll('p, li, .reason, small, span')) {
        const t = p.textContent.trim(); if (!/캠페인|감액|늦|자금|부족|출항을 놓/.test(t) || p.children.length > 3) continue;
        const lh = parseFloat(getComputedStyle(p).lineHeight) || parseFloat(getComputedStyle(p).fontSize) * 1.5; const r = p.getBoundingClientRect();
        warn.push({ text: t.replace(/\s+/g, ' ').slice(0, 40), lines: Math.round(r.height / lh), out: r.right > cr.right + 0.5 || p.scrollWidth > p.clientWidth + 1 });
      }
    }
    out.warn = warn;
    const accepts = [...document.querySelectorAll('[data-action="accept"]')]; out.acceptDisabled = accepts.filter((b) => b.disabled).length + '/' + accepts.length;
    const bar = document.querySelector('.statusbar'); const br = bar.getBoundingClientRect();
    out.bar = { top: Math.round(br.top * 10) / 10, h: Math.round(br.height * 10) / 10, bottom: Math.round(br.bottom * 10) / 10, text: bar.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) };
    // 칸끼리 겹침(주요 패널)
    const panels = [...document.querySelectorAll('main > *, .maincol > *')]; let pov = 0; for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) if (!panels[i].contains(panels[j]) && !panels[j].contains(panels[i]) && ov(panels[i], panels[j]) > 4) pov++;
    out.panelOverlaps = pov;
    return out;
  });
}
(async () => {
  const profs = (process.argv[2] || 'l1366').split(','); const dist = process.argv[3] || 'c33'; const days = (process.argv[4] || '1,8,15').split(',').map(Number);
  for (const prof of profs) for (const day of days) {
    const { page, ctx, errors } = await L.open(prof, dist);
    await page.evaluate(MEASURE_M2);
    if (day === 0) { /* 규칙 1 기본 */ } else await page.evaluate((d) => window.measureM2(d), day);
    await page.evaluate(() => document.fonts.ready); await L.sleep(700);
    const o = { prof, dist, day, box: await boxes(page) };
    o.tab = await tabOrder(page);
    o.errors = errors;
    console.log(JSON.stringify(o));
    await ctx.close();
  }
  await L.done(); process.exit(0);
})();
