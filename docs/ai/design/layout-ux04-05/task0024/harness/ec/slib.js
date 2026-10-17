// S1c 배치 시안 측정 공용. blib.js(accept21/r3에서 복사)를 감싼다.
const L = require('./blib');
const path = require('path');
const touchOf = (prof) => !!L.PROF[prof].o.hasTouch;
const tap = (page, prof, sel, o = {}) => L.tap(page, sel, { touch: touchOf(prof), ...o });
// 준비 단계용: 좌표 없이 바로 누른다. 500ms 막기를 피하려고 Date.now를 앞당긴다.
const fast = (page) => page.evaluate(() => { if (window.__fast) return; window.__fast = true; let off = 0; const n = Date.now.bind(Date); Date.now = () => n() + (off += 1000); });
const click = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) throw new Error('없음 ' + sel); if (e.disabled) throw new Error('꺼짐 ' + sel); e.click(); }, sel);
const has = (page, sel) => page.evaluate((sel) => !!document.querySelector(sel), sel);
const shot = (page, name) => page.screenshot({ path: path.join(L.OUT, 'shots', `${name}.png`) });
// 띠: 고정 막대 아래 ~ 아래쪽 알림 위(없으면 화면 끝)
const band = (page) => page.evaluate(() => {
  const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast');
  return { bar: +bar.toFixed(1), bottom: +Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity).toFixed(1), ih: innerHeight, iw: innerWidth, sy: Math.round(scrollY), docH: document.documentElement.scrollHeight };
});
const rectOf = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), h: +r.height.toFixed(1) }; }, sel);
// 가로 넘침: 문서 폭이 화면보다 넓거나, 화면 밖으로 나간 요소 수
const overflow = (page) => page.evaluate(() => {
  const iw = document.documentElement.clientWidth; const out = [];
  for (const e of document.querySelectorAll('#app *')) {
    if (e.closest('.map-frame')) continue; const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.right > iw + 1 || r.left < -1) out.push((e.id || e.className || e.tagName).toString().slice(0, 40));
  }
  // 칸 안 넘침(오른쪽 칸 300px 등): 자식이 패널보다 넓은 경우
  const inner = [];
  for (const p of document.querySelectorAll('.panel')) { const pr = p.getBoundingClientRect(); for (const e of p.querySelectorAll('*')) { if (e.closest('.map-frame') || e.closest('table.roster')) continue; const r = e.getBoundingClientRect(); if (r.width && r.right > pr.right + 1) { inner.push(`${p.className.split(' ')[1]}:${(e.id || e.className || e.tagName).toString().slice(0, 30)}`); break; } } }
  return { docW: document.documentElement.scrollWidth, iw, out: out.slice(0, 8), outN: out.length, inner };
});
// 화면 코드 순서(한 열 읽기 순서): 패널 머리 제목의 문서 위치 순
const order = (page) => page.evaluate(() => {
  const ids = ['local-h', 'trade-h', 'queue-h', 'crew-h', 'res-h', 'report-h', 'world-h', 'log-h', 'detail-h', 'crewsheet-h'];
  const y = scrollY;
  return ids.map((id) => { const e = document.getElementById(id); return e ? [id, Math.round(e.getBoundingClientRect().top + y), Math.round(e.getBoundingClientRect().left)] : null; }).filter(Boolean).sort((a, b) => a[1] - b[1] || a[2] - b[2]);
});
// T1: 화장품 수락 → 준비 배정 → 2일 편 예약 (좌표 누르기)
async function t1(page, prof) {
  await tap(page, prof, '[data-action="accept"][data-buy="OFFER_BUY_02"]');
  await L.sleep(150);
  await tap(page, prof, '[data-action="assign"][data-task="TASK001"][data-emp="EMP01"]');
  await L.sleep(150);
  await tap(page, prof, '[data-action="book"][data-contract="CT001"][data-sailing="ROUTE02-D002"]:not([disabled])');
  await L.sleep(200);
}
// ‘오늘 할 일’ 위치: 띠 기준. below>0이면 띠 아래쪽 밖으로 그만큼, above>0이면 막대 위로 그만큼.
async function queueWhere(page) {
  const b = await band(page); const q = await rectOf(page, '#queue-h'); const qp = await rectOf(page, '.queue');
  const chip = await rectOf(page, '#queue-chip');
  const visible = q && q.top >= b.bar - 0.5 && q.bottom <= b.bottom + 0.5;
  const firstItem = await rectOf(page, '.queue .pending li');
  const itemVisible = firstItem ? firstItem.top >= b.bar - 0.5 && firstItem.bottom <= b.bottom + 0.5 : null;
  return { band: b, queueH: q, visible, below: q ? +(q.top - b.bottom).toFixed(1) : null, aboveBar: q ? +(b.bar - q.bottom).toFixed(1) : null, firstItemVisible: itemVisible, chip: chip ? { visible: chip.top >= 0 && chip.bottom <= b.ih } : null, panelH: qp?.h };
}
// sel을 막대 아래 off px에 둔다. 오른쪽 창(시안 C) 안이면 창을 굴린다.
const place = async (page, sel, off) => { const r = await page.evaluate(([sel, off]) => {
  const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const e = document.querySelector(sel);
  const pane = e.closest('.sidecol'); const isPane = !!pane && getComputedStyle(pane).overflowY === 'auto';
  const dy = e.getBoundingClientRect().top - (bar + off);
  if (isPane) pane.scrollTop += dy; else scrollBy(0, dy);
  return isPane; }, [sel, off]); await L.sleep(200); return r; };
// 요소가 실제로 보이는 범위: 띠(막대~알림)와, 창 안이면 창의 상자를 함께 잘라 본다.
const seen = (page, sel) => page.evaluate((sel) => {
  const e = document.querySelector(sel); if (!e) return null;
  const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast');
  let top = bar, bottom = Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity);
  const pane = e.closest('.sidecol'); if (pane && getComputedStyle(pane).overflowY === 'auto') { const b = pane.getBoundingClientRect(); top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom); }
  const r = e.getBoundingClientRect();
  return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), h: +r.height.toFixed(1), w: +r.width.toFixed(1), full: r.top >= top - 0.5 && r.bottom <= bottom + 0.5, visPx: +Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, top)).toFixed(1), below: +(r.bottom - bottom).toFixed(1), vtop: +top.toFixed(1), vbottom: +bottom.toFixed(1) };
}, sel);
module.exports = { place, seen,  L, touchOf, tap, fast, click, has, shot, band, rectOf, overflow, order, t1, queueWhere };
