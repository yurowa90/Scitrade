// 자유 탐색 시작 영역: 이름표가 지도 칸 밖으로 나가는 양을 여백별로 잰다(viewBox만 바꿈).
const L = require('./blib');
async function prep(prof, vp) { const r = await L.newPage(prof, vp ? { viewport: vp } : {}); const pg = r.page;
  await pg.goto('http://127.0.0.1:4390/sdev/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => { const s = document.querySelector('select[data-action="scenario"]'); s.value = 'SCENARIO_M1_DELAY_ACCEPTED'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await L.sleep(800);
  await L.tap(pg, '[data-action="accept"]:not([disabled])'); for (let d = 1; d < 8; d++) { for (const a of ['book', 'assign']) { const sel = `[data-action="${a}"]:not([disabled])`; if (await pg.$(sel)) await L.tap(pg, sel).catch(() => {}); } await L.endDay(pg); await L.sleep(250); }
  await L.sleep(700); await pg.evaluate(() => document.querySelector('[data-action="situation"]').click()); await pg.waitForSelector('#situation-h'); await L.sleep(300);
  await pg.evaluate(() => document.querySelector('[data-situation="free"]').click()); await L.sleep(300); return r; }
(async () => { const out = [];
  for (const [label, prof, vp] of [['1024터치', 'ipadminiL', null], ['1366', 'l1366', { width: 1366, height: 768 }], ['1180터치', 'ipadAirL', null]]) { const r = await prep(prof, vp); const pg = r.page;
    const base = await pg.evaluate(() => document.querySelector('.situation svg').getAttribute('viewBox'));
    for (const pad of [0.15, 0.2, 0.25, 'label']) {
      const m = await pg.evaluate(([pad, base]) => { const svg = document.querySelector('.situation svg'); const [x, y, w, h] = base.split(' ').map(Number);
        const cx = x + w / 2, cy = y + h / 2, rw = w / 1.3, rh = h / 1.3; // 15% 여백을 걷어낸 경유점 상자
        const st = svg.getBoundingClientRect();
        const ribbons = () => [...svg.querySelectorAll('.port.active, .port.planned')].map((g) => ({ t: g.textContent.trim().slice(0, 6), g: g.classList.contains('active'), r: g.getBoundingClientRect() }));
        if (pad === 'label') { // 이름표까지 담는 상자: 지금 화면의 이름표 사각형을 지도 단위로 바꿔 합친다
          const ctm = svg.getScreenCTM().inverse(); const pts = ribbons().filter((b) => b.t && b.g).flatMap((b) => [[b.r.left, b.r.top], [b.r.right, b.r.bottom]]).map(([a, c]) => { const p = new DOMPoint(a, c).matrixTransform(ctm); return [p.x, p.y]; });
          const xs = [cx - rw / 2, cx + rw / 2, ...pts.map((p) => p[0])], ys = [cy - rh / 2, cy + rh / 2, ...pts.map((p) => p[1])];
          const l = Math.max(0, Math.min(...xs) - 12), t = Math.max(0, Math.min(...ys) - 12); svg.setAttribute('viewBox', `${l} ${t} ${Math.min(1092 - l, Math.max(...xs) - l + 24)} ${Math.min(1230 - t, Math.max(...ys) - t + 24)}`);
        } else { const nw = rw * (1 + 2 * pad), nh = rh * (1 + 2 * pad); svg.setAttribute('viewBox', `${Math.max(0, cx - nw / 2)} ${Math.max(0, cy - nh / 2)} ${nw} ${nh}`); }
        const vbNow = svg.getAttribute('viewBox'); const box = svg.getBoundingClientRect(); const ctm2 = svg.getScreenCTM(); const vb = svg.viewBox.baseVal;
        // 실제로 그려지는 지도 영역(meet): 
        const s = Math.min(box.width / vb.width, box.height / vb.height); const mw = vb.width * s, mh = vb.height * s; const ml = box.left + (box.width - mw) / 2, mt = box.top + (box.height - mh) / 2;
        const sr = document.querySelector('.situation-stage').getBoundingClientRect(); const ov = getComputedStyle(svg).overflow; const clip = ribbons().filter((b) => b.t).map((b) => ({ t: b.t, active: b.g, out: Math.round(Math.max(0, sr.left - b.r.left, b.r.right - sr.right, sr.top - b.r.top, b.r.bottom - sr.bottom)) })).filter((c) => c.out > 0);
        const label = [...svg.querySelectorAll('text')].map((t) => t.getBoundingClientRect().height).filter(Boolean).sort((a, b) => a - b);
        return { overflow: ov, vb: vbNow.split(' ').map((v) => Math.round(+v)).join(' '), scale: Math.round(s * 100) / 100, mapUse: Math.round(mw / box.width * 100) + '%', clipped: clip, textMed: Math.round(label[label.length >> 1]) }; }, [pad, base]);
      out.push({ label, pad, ...m }); }
    await r.ctx.close(); }
  for (const o of out) console.log(JSON.stringify(o)); await L.done(); process.exit(0); })();
