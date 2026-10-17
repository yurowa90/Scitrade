// 평택판(5d59ff3 배포본 사본) 기기 점검 측정. 인수: 프로필 목록
const L = require('./blib');
const r1 = (v) => Math.round(v * 10) / 10;
const BADGE = () => {
  const f = document.getElementById('nl-badge-frame'); if (!f) return null;
  const fr = f.getBoundingClientRect(); const m = /M\s*([\d.]+)\s+([\d.]+)\s*H\s*([\d.]+)\s*V\s*([\d.]+)/.exec(f.style.clipPath || '');
  if (!m) return { hidden: true, clip: f.style.clipPath, display: getComputedStyle(f).display };
  const [x1, y1, x2, y2] = m.slice(1).map(Number);
  return { left: fr.left + x1, top: fr.top + y1, right: fr.left + x2, bottom: fr.top + y2 };
};
const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
async function badgeInfo(page) {
  return page.evaluate(`(${BADGE})()`);
}
async function under(page, b) {
  // 배지 아래(배지 iframe 빼고) 보이는 앱 요소
  return page.evaluate((b) => {
    const f = document.getElementById('nl-badge-frame'); const out = new Set();
    for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.2, 0.8]) {
      const x = b.left + (b.right - b.left) * fx, y = b.top + (b.bottom - b.top) * fy;
      const el = document.elementsFromPoint(x, y).find((e) => e !== f && e !== document.documentElement && e !== document.body && !e.matches('main, .layout, #app'));
      if (el) { const t = (el.closest('button, a, input, select, h2, h3, h4, li, p, td, th, article') || el); out.add((t.tagName.toLowerCase() + ':' + (t.dataset?.action || '') + ':' + (t.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 18))); }
    }
    return [...out];
  }, b);
}
const REGION = `(el) => {
  if (!el || el === document.body) return 'body';
  if (el.closest('.skip-links')) return 'skip'; if (el.closest('.masthead')) return 'head'; if (el.closest('.statusbar')) return 'bar'; if (el.closest('.flash-toast')) return 'toast';
  const p = el.closest('main > *'); if (!p) return 'other';
  if (p.classList.contains('maincol')) return el.closest('.panel.trade') ? 'trade' : 'culture';
  for (const k of ['trade', 'crew', 'resources', 'queue', 'world', 'report', 'log']) if (p.classList.contains(k)) return k;
  return p.className; }`;
async function tabOrder(page) {
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  const seq = []; let first = null;
  for (let i = 0; i < 300; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(`(() => { const a = document.activeElement; if (!a || a === document.body) return null; if (!a.dataset.tk) a.dataset.tk = String(Math.random()); return [a.dataset.tk, (${REGION})(a), Math.round(scrollY)]; })()`);
    if (!s) continue; if (s[0] === first) break; if (!first) first = s[0];
    seq.push([s[1], s[2]]);
  }
  const runs = []; for (const [r, y] of seq) { if (!runs.length || runs[runs.length - 1][0] !== r) runs.push([r, 1, y, y]); else { runs[runs.length - 1][1]++; runs[runs.length - 1][3] = y; } }
  let jump = 0; for (let i = 1; i < seq.length; i++) jump += Math.abs(seq[i][1] - seq[i - 1][1]);
  return { stops: seq.length, runs: runs.map(([r, n, y0, y1]) => `${r}×${n}@${y0}${y1 !== y0 ? '-' + y1 : ''}`), scrollTravel: jump };
}
async function layout(page) {
  return page.evaluate(() => {
    const top = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width) }; };
    const bar = document.querySelector('.statusbar').getBoundingClientRect();
    return { inner: [innerWidth, innerHeight], trade: top('.panel.trade'), tradeH: top('#trade-h'), board: top('.board-title'), crew: top('.panel.crew'), crewH: top('#crew-h'), queue: top('.panel.queue'), world: top('.panel.world'),
      oneCol: (() => { const a = document.querySelector('.panel.trade').getBoundingClientRect(), b = document.querySelector('.panel.crew').getBoundingClientRect(); return Math.abs(a.left - b.left) < 2; })(),
      bar: { top: Math.round(bar.top * 10) / 10, h: Math.round(bar.height * 10) / 10, bottom: Math.round(bar.bottom * 10) / 10, pos: getComputedStyle(document.querySelector('.statusbar')).position },
      overscroll: [getComputedStyle(document.documentElement).overscrollBehaviorY, getComputedStyle(document.body).overscrollBehaviorY], ofx: document.documentElement.scrollWidth - innerWidth };
  });
}
async function leaveDialog(ctx, prep) {
  const page = await ctx.newPage(); await page.goto('http://127.0.0.1:4390/pt/index.html'); await page.waitForSelector('[data-action="end-day"]'); await L.sleep(400);
  await prep(page);
  let got = null; page.on('dialog', (d) => { if (d.type() === 'beforeunload') got = d.type(); d.accept().catch(() => {}); });
  await page.close({ runBeforeUnload: true }); await L.sleep(600);
  return got;
}
(async () => {
  const out = [];
  for (const prof of (process.argv[2] || 'l1366').split(',')) {
    const touch = !!L.PROF[prof].o.hasTouch;
    const { page, ctx, errors } = await L.open(prof, 'pt');
    await L.sleep(1500);
    const o = { prof };
    o.layout = await layout(page);
    o.badge = await badgeInfo(page);
    if (o.badge && !o.badge.hidden) {
      o.badgeSize = [r1(o.badge.right - o.badge.left), r1(o.badge.bottom - o.badge.top)];
      o.badgeFromBottom = r1(o.layout.inner[1] - o.badge.bottom); o.badgeFromRight = r1(o.layout.inner[0] - o.badge.right);
      o.underTop = await under(page, o.badge);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await L.sleep(300);
      o.underBottom = await under(page, o.badge);
      await page.evaluate(() => scrollTo(0, 0)); await L.sleep(200);
    }
    // ⑤ 화장품 수락
    const sel = await page.evaluate(() => { const b = document.querySelector('[data-action="accept"][data-buy="OFFER_BUY_02"]'); if (!b) return null; b.dataset.ptCos = '1'; return b.textContent.trim(); });
    o.cosBtn = sel;
    await L.tap(page, '[data-pt-cos="1"]', { touch }); await L.sleep(500);
    o.afterAccept = await page.evaluate(() => { const q = document.getElementById('queue-h').getBoundingClientRect(); const t = document.querySelector('.flash-toast'); const tr = t && t.getBoundingClientRect();
      return { scrollY: Math.round(scrollY), queueTopVsFold: Math.round(q.top - innerHeight), queueVisible: q.top < innerHeight && q.bottom > 0, toast: tr ? { left: Math.round(tr.left), top: Math.round(tr.top), right: Math.round(tr.right), bottom: Math.round(tr.bottom) } : null }; });
    const b2 = await badgeInfo(page);
    if (o.afterAccept.toast && b2 && !b2.hidden) { const t = o.afterAccept.toast; const a = inter(b2, t); o.badgeOverToast = { px2: Math.round(a), ofToast: r1(100 * a / ((t.right - t.left) * (t.bottom - t.top))) + '%', ofBadge: r1(100 * a / ((b2.right - b2.left) * (b2.bottom - b2.top))) + '%' }; }
    // T5: 동료 카드 누르기(1일, 수락 뒤)
    await page.evaluate(() => { const c = document.querySelector('article[data-action="select-card"]'); c.dataset.ptCard = '1'; c.scrollIntoView({ block: 'center' }); }); await L.sleep(300);
    const before = await page.evaluate(() => ({ y: scrollY, top: document.querySelector('[data-pt-card]').getBoundingClientRect().top }));
    await L.tap(page, '[data-pt-card="1"]', { touch, scrollIfNeeded: false }); await L.sleep(700);
    o.t5 = await page.evaluate((b) => { const c = document.querySelector('article[data-action="select-card"][aria-pressed="true"], article.selected') || document.querySelector('[data-pt-card]'); const r = c ? c.getBoundingClientRect() : null; const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom;
      const a = document.activeElement; return { scrollDelta: Math.round(scrollY - b.y), cardTopBefore: Math.round(b.top), cardTopAfter: r ? Math.round(r.top) : null, cardVisible: r ? r.bottom > bar && r.top < innerHeight : null, focus: (a?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20) }; }, before);
    // 배지 숨기기
    try {
      const fl = page.frameLocator('#nl-badge-frame');
      await fl.locator('#nl-badge').click({ timeout: 3000 }); await L.sleep(500);
      o.badgeOpen = await badgeInfo(page);
      await fl.locator('#nl-hide').click({ timeout: 3000 }); await L.sleep(500);
      o.badgeAfterHide = await badgeInfo(page);
      o.store = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('nl-hud')).map((k) => k + '=' + localStorage.getItem(k)));
      await page.reload(); await page.waitForSelector('[data-action="end-day"]'); await L.sleep(1500);
      o.badgeAfterReload = await badgeInfo(page);
    } catch (e) { o.hideError = String(e).slice(0, 200); }
    o.errors = errors.length;
    // Tab 순서(새 문맥, 1일 첫 화면)
    { const t = await L.open(prof, 'pt'); await L.sleep(1200); o.tab = await tabOrder(t.page); await t.ctx.close(); }
    // ③ 떠날 때 확인 창
    o.leave = {
      fresh: await leaveDialog(ctx, async () => {}),
      pending: await leaveDialog(ctx, async (p) => { await p.evaluate(() => { const b = [...document.querySelectorAll('[data-action="accept"]')][0]; b.dataset.x = '1'; }); await L.tap(p, '[data-x="1"]', { touch }); }),
      afterDay: await leaveDialog(ctx, async (p) => { await L.tap(p, '[data-action="accept"]', { touch }); await L.tap(p, '[data-action="end-day"]', { touch }); }),
      afterSave: await leaveDialog(ctx, async (p) => { await L.tap(p, '[data-action="accept"]', { touch }); await L.tap(p, '[data-action="end-day"]', { touch }); await L.tap(p, '[data-action="save"]', { touch }); }),
    };
    await ctx.close();
    console.log(JSON.stringify(o)); out.push(o);
  }
  await L.done(); process.exit(0);
})();
