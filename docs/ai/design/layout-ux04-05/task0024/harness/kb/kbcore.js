// TASK-0018 키보드 측정. 인수: prof [dists]
// (a) Tab 순서: first(1일 처음) / accepted(의류 견적 수락 뒤) — 맨 위·초점 없음에서 Tab, 정지점마다 영역·페이지 좌표·보임.
// (b) Shift+Tab 튐: far(스크롤 1500 + main 첫 정지점 preventScroll 초점 → Shift+Tab) / walk(동료 칸 첫 정지점에서 Shift+Tab을 하루 진행까지 반복)
//     first·accepted·toast(문화 결과 알림이 있는 2일) 세 상태.
// (c) 문화 활동을 넣고 하루 진행(Enter) 뒤 하루 진행 단추에서 결과 보기까지 Tab 수, 그때 스크롤 변화, Enter 뒤 초점.
const M = require('./m'); const L = M.L;
const INFO = () => {
  const region = (el) => {
    if (!el || el === document.body) return 'body';
    if (el.closest('.skip-links')) return 'skip';
    if (el.closest('.masthead')) return 'head';
    if (el.closest('.statusbar')) return 'bar';
    if (el.closest('.flash-toast')) return 'toast';
    const p = el.closest('main > *');
    if (!p) return 'other';
    if (p.classList.contains('maincol')) return el.closest('.panel.trade') ? 'trade' : 'culture';
    for (const k of ['trade', 'crew', 'resources', 'queue', 'world', 'report', 'log']) if (p.classList.contains(k)) return k;
    return p.className;
  };
  window.__region = region;
  window.__fo = () => {
    const a = document.activeElement;
    if (!a || a === document.body) return { r: 'body' };
    const rc = a.getBoundingClientRect();
    const bar = document.querySelector('.statusbar').getBoundingClientRect();
    const t = document.querySelector('.flash-toast');
    const reg = region(a);
    const fixed = ['skip', 'bar', 'toast'].includes(reg);
    const bandTop = bar.bottom, bandBot = t && !t.contains(a) ? Math.min(innerHeight, t.getBoundingClientRect().top) : innerHeight;
    const vis = fixed ? rc.top >= -0.5 && rc.bottom <= innerHeight + 0.5 && rc.width > 2 : reg === 'head' ? rc.top >= -0.5 && rc.bottom <= bar.top + 0.5 : rc.top >= bandTop - 0.5 && rc.bottom <= bandBot + 0.5;
    const label = (a.getAttribute('aria-label') || a.textContent || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 22);
    return { r: reg, tag: a.tagName.toLowerCase(), act: a.dataset?.action || '', id: a.id || '', label, x: Math.round(rc.left), y: Math.round(rc.top), py: Math.round(rc.top + scrollY), h: Math.round(rc.height), w: Math.round(rc.width), sy: Math.round(scrollY), vis };
  };
  window.__regions = () => {
    const out = {};
    for (const el of document.querySelectorAll('main > *, main .maincol > *')) {
      const r = el.getBoundingClientRect(); const k = region(el.querySelector('h2, h3, button') || el) ;
      const key = el.classList.contains('maincol') ? 'maincol' : (['trade', 'crew', 'resources', 'queue', 'world', 'report', 'log', 'culture'].find((c) => el.classList.contains(c)) || el.className);
      out[key] = [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)];
    }
    return out;
  };
};

async function setup(page) { await page.evaluate(INFO); }
const fo = (page) => page.evaluate(() => window.__fo());

async function tabCycle(page, max = 160) {
  await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur(); });
  await L.sleep(200);
  // 순차 초점 시작점을 머리 빈 곳으로 맞춘다(클릭).
  const pt = await page.evaluate(() => { const m = document.querySelector('.masthead').getBoundingClientRect(); for (let x = m.right - 4; x > m.left; x -= 7) for (const y of [m.top + 3, m.bottom - 3]) { const e = document.elementFromPoint(x, y); if (e && !e.closest('button, select, label, input, a, summary')) return { x, y, tag: e.className }; } return null; });
  if (pt) { await page.mouse.click(pt.x, pt.y); await L.sleep(100); }
  const stops = [];
  let first = null;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab'); await L.sleep(60);
    const f = await fo(page);
    const key = `${f.tag}|${f.act}|${f.id}|${f.label}|${f.x}|${f.py}`;
    if (first === null) first = key; else if (key === first) break;
    if (f.r === 'body') break;
    stops.push(f);
  }
  return stops;
}

const VIS3 = ['skip', 'head', 'bar', 'toast', 'culture', 'trade', 'crew', 'resources', 'queue', 'world', 'report', 'log'];
function judge(stops, regions, oneCol) {
  // 보이는 영역 순서: 세 열은 지시서 순서, 한 열은 영역 위쪽 좌표 순서.
  let order = VIS3;
  if (oneCol) {
    const main = Object.entries(regions).filter(([k]) => k !== 'maincol').sort((a, b) => a[1][1] - b[1][1]).map(([k]) => k);
    order = ['skip', 'head', 'bar', 'toast', ...main];
  }
  const rank = (r) => { const i = order.indexOf(r); return i < 0 ? 99 : i; };
  const back = [];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i];
    if (rank(b.r) < rank(a.r)) back.push({ i: i + 1, from: `${a.r}:${a.act || a.id || a.label}`, to: `${b.r}:${b.act || b.id || b.label}`, kind: 'region' });
    else if (a.r === b.r && !['skip', 'head', 'bar', 'toast'].includes(a.r) && b.py < a.py - 20 && b.x <= a.x + 5) back.push({ i: i + 1, from: `${a.r}:${a.act || a.id || a.label}@${a.x},${a.py}`, to: `${b.r}:${b.act || b.id || b.label}@${b.x},${b.py}`, kind: 'upInRegion', dy: b.py - a.py });
  }
  const seq = []; for (const s of stops) if (seq.at(-1) !== s.r) seq.push(s.r);
  return { order, seq, back, hidden: stops.filter((s) => !s.vis).map((s, i) => `${s.r}:${s.act || s.id || s.label}`) };
}

const TABBABLE = 'button:not([disabled]), select:not([disabled]), input:not([disabled]), summary, [tabindex="0"], a[href]';
async function focusFirstIn(page, sel, scroll) {
  return page.evaluate(([sel, TABBABLE, scroll]) => {
    const els = [...document.querySelectorAll(sel)].flatMap((root) => [...root.querySelectorAll(TABBABLE)]).filter((e) => e.getClientRects().length && !e.closest('details:not([open]) > :not(summary)') && e.tabIndex >= 0);
    const e = els[0]; if (!e) return null;
    e.focus(scroll ? undefined : { preventScroll: true });
    return { act: e.dataset.action || '', id: e.id, label: (e.textContent || '').trim().slice(0, 16) };
  }, [sel, TABBABLE, scroll]);
}

async function shiftFar(page) {
  await page.evaluate(() => { scrollTo({ top: Math.min(1500, document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }); }); await L.sleep(150);
  const start = await focusFirstIn(page, 'main', false); await L.sleep(100);
  const res = [];
  for (let k = 0; k < 3; k++) {
    const y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Shift+Tab'); await L.sleep(300);
    const f = await fo(page);
    res.push({ dy: Math.round(f.sy - y0), y0: Math.round(y0), to: `${f.r}:${f.act || f.id || f.label}`, vis: f.vis });
    if (f.act === 'end-day') break;
  }
  return { start, res };
}

async function shiftWalk(page) {
  const start = await focusFirstIn(page, 'main .panel.crew', true); await L.sleep(200);
  let n = 0; const path = []; let last = null; const hidden = [];
  for (; n < 90; n++) {
    const y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Shift+Tab'); await L.sleep(120);
    const f = await fo(page);
    const step = { dy: Math.round(f.sy - y0), y0: Math.round(y0), to: `${f.r}:${f.act || f.id || f.label}`, vis: f.vis };
    if (!f.vis) hidden.push(step.to);
    path.push(step); last = step;
    if (f.act === 'end-day' || f.r === 'body' || f.r === 'head' || f.r === 'skip') break;
  }
  const fixedSteps = path.filter((p) => /^(bar|toast|skip):/.test(p.to));
  return { start, presses: n + 1, last, fixedSteps, hidden: hidden.slice(0, 8), hiddenN: hidden.length };
}

module.exports = { INFO, setup, fo, tabCycle, judge, focusFirstIn, shiftFar, shiftWalk, VIS3, TABBABLE };
