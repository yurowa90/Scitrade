// UX-23·K1: 부산 현지 패널을 연 채 하루 진행할 때 읽던 칸이 움직이는 거리.
// 읽는 자리에 두는 마지막 120px은 실제 굴림 동작(마우스 휠 / 터치 끌기)으로 그 칸 위에서 한다.
// 사례:
//  RQ  2일, CA01·귀솔을 넣고 오른쪽 ‘오늘 할 일’ 제목을 막대+40에 두고 읽음(오른쪽 칸 위에서 굴림)
//  RQB RQ와 같되 CA02를 골라 미리 보기를 띄운 상태(accept20 r1 B)
//  RR  ‘자원 예약’ 제목을 막대+40(오른쪽 칸 위에서 굴림)
//  MQ  대조: 셋째 견적 제목을 막대+40(주 열 위에서 굴림) — 주 열은 그대로여야 함
//  K1  4일, 계약 하나, CA01·귀솔을 넣고 CA02·물보리 미리 보기를 띄운 채 ② 제목을 막대+10, 그 아래 계약을 읽음(주 열 위에서 굴림)
// 사용: node ec.js <prof> <dists> <cases>
const M = require('./slib'); const L = M.L;
const prof = process.argv[2] || 'l1366';
const dists = (process.argv[3] || 'base,A,B,C').split(',');
const cases = (process.argv[4] || 'RQ,RQB,RR,MQ,K1').split(',');
const touch = M.touchOf(prof);
const GESTURE = 120;

async function gesture(page, overSel) {
  // 굴림 동작을 할 화면 위 점: 그 칸의 가운데 x, 띠 가운데 y
  // 그 칸에서 띠 안에 보이는 부분의 가운데(칸이 짧으면 칸 위)
  const pt = await page.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; const t = document.querySelector('.flash-toast'); const bottom = Math.min(innerHeight, t ? t.getBoundingClientRect().top : Infinity);
    const top = Math.max(bar, r.top), bot = Math.min(bottom, r.bottom); return { x: Math.round(r.left + r.width / 2), y: Math.round(bot > top ? (top + bot) / 2 : (bar + bottom) / 2), inside: bot > top }; }, overSel);
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture', { x: pt.x, y: pt.y, yDistance: -GESTURE, xDistance: 0, gestureSourceType: 'touch', speed: 800, preventFling: true });
    await cdp.detach();
  } else {
    await page.mouse.move(pt.x, pt.y);
    await page.mouse.wheel(0, GESTURE);
  }
  await L.sleep(450);
  return pt;
}
// 읽는 요소를 막대 아래 off+GESTURE에 둔 뒤, 그 칸 위에서 GESTURE만큼 굴려 막대 아래 off에 오게 한다.
async function readAt(page, sel, off, overSel) {
  await M.place(page, sel, off + GESTURE);
  const pt = await gesture(page, overSel);
  // 문서 끝·창 끝에 막혀 정확히 못 왔으면 마지막에 프로그램으로 맞춘다(굴림 동작은 이미 그 칸에서 했다).
  const now = await page.evaluate(([sel, off]) => document.querySelector(sel).getBoundingClientRect().top - (document.querySelector('.statusbar').getBoundingClientRect().bottom + off), [sel, off]);
  pt.corr = Math.round(now);
  if (Math.abs(now) > 3) await M.place(page, sel, off);
  return pt;
}
const snap = (page) => page.evaluate(() => {
  const t = (s) => { const e = typeof s === 'string' ? document.querySelector(s) : s; return e ? +e.getBoundingClientRect().top.toFixed(1) : null; };
  const h3 = [...document.querySelectorAll('.trade .offer h3')];
  const c = document.querySelector('.contract h3[id]');
  return { sy: Math.round(scrollY), queueH: t('#queue-h'), resH: t('#res-h'), crewH: t('#crew-h'), tradeH: t('#trade-h'), localH: t('#local-h'), cultureH: t('#culture-h'), empH: t('#culture-emp-h'),
    q3: h3[2] ? t(h3[2]) : null, q3txt: h3[2]?.textContent.replace(/\s+/g, ' ').slice(0, 16), contractId: c?.id ?? null, contractH: c ? t(c) : null,
    paneTop: (() => { const p = document.querySelector('.sidecol'); return p && getComputedStyle(p).overflowY === 'auto' ? p.scrollTop : null; })(),
    focus: document.activeElement?.dataset?.action || document.activeElement?.id || document.activeElement?.tagName, day: document.querySelector('.statusbar .date b')?.textContent };
});
const CASES = {
  RQ: { setup: async (p) => { await day2Culture(p); }, read: '#queue-h', off: 40, over: '.queue' },
  RQB: { setup: async (p) => { await day2Culture(p); await M.click(p, '[data-action="culture-act"][data-activity="CA02"]'); }, read: '#queue-h', off: 40, over: '.queue' },
  RR: { setup: async (p) => { await day2Culture(p); }, read: '#res-h', off: 40, over: '.resources' },
  MQ: { setup: async (p) => { await day2Culture(p); await p.evaluate(() => { const h = document.querySelectorAll('.trade .offer h3')[2]; h.id = 'probe-q3'; }); }, read: '#probe-q3', off: 40, over: '.trade' },
  K1: { setup: async (p) => {
    await M.click(p, '[data-action="accept"][data-buy="OFFER_BUY_01"]');
    for (let d = 0; d < 3; d++) await M.click(p, '[data-action="end-day"]');
    await M.click(p, '#local-tab');
    await M.click(p, '[data-action="culture-act"][data-activity="CA01"]'); await M.click(p, '[data-action="culture-emp"][data-emp="EMP01"]'); await M.click(p, '[data-action="culture-queue"]');
    await M.click(p, '[data-action="culture-act"][data-activity="CA02"]'); await M.click(p, '[data-action="culture-emp"][data-emp="EMP02"]');
  }, read: '#culture-emp-h', off: 10, over: '.contract' },
};
async function day2Culture(p) {
  await M.click(p, '[data-action="end-day"]');
  await M.click(p, '#local-tab');
  await M.click(p, '[data-action="culture-act"][data-activity="CA01"]');
  await M.click(p, '[data-action="culture-emp"][data-emp="EMP01"]');
  await M.click(p, '[data-action="culture-queue"]');
}
(async () => {
  for (const cs of cases) {
    const c = CASES[cs]; const row = {};
    for (const dist of dists) {
      const { page, errors } = await L.open(prof, dist);
      try {
        await M.fast(page);
        await c.setup(page); await L.sleep(200);
        const pt = await readAt(page, c.read, c.off, c.over);
        const b = await snap(page); const bandB = await M.band(page);
        await page.evaluate(() => { window.__sb = []; const o = window.scrollBy.bind(window); window.scrollBy = (x, y) => { window.__sb.push(typeof x === 'object' ? x.top : y); return o(x, y); }; });
        await M.tap(page, prof, '[data-action="end-day"]', { scrollIfNeeded: false }); await L.sleep(350);
        const a = await snap(page);
        const d = (k) => (a[k] == null || b[k] == null ? null : +(a[k] - b[k]).toFixed(1));
        row[dist] = { day: `${b.day}->${a.day}`, band: [bandB.bar, bandB.bottom], pt, readBefore: b[{ '#queue-h': 'queueH', '#res-h': 'resH', '#probe-q3': 'q3', '#culture-emp-h': 'empH' }[c.read]],
          dQueue: d('queueH'), dRes: d('resH'), dCrew: d('crewH'), dTrade: d('tradeH'), dQ3: d('q3'), dContract: b.contractId && b.contractId === a.contractId ? d('contractH') : null, dEmp: d('empH'), dCultureH: d('cultureH'), dLocal: d('localH'), dPane: d('paneTop'), dSy: d('sy'),
          sb: await page.evaluate(() => window.__sb.map((v) => +(+v).toFixed(1))), focus: a.focus, err: errors.length ? errors : undefined };
      } catch (e) { row[dist] = { error: String(e).slice(0, 200) }; }
      await page.context().close();
    }
    console.log(JSON.stringify({ prof, case: cs, ...row }));
  }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
