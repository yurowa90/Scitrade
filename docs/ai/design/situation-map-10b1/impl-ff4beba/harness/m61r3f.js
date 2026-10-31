// R3: 바다 누름 뒤 초점·루트 테두리·다음 Tab·Escape 복귀, 그리고 같은 곳 두 번
const L = require('./blib');
(async () => { const res = [];
  for (const [prof, touch] of [['ipadminiL', true], ['l1366', false]]) { const r = await L.newPage(prof, touch ? {} : { viewport: { width: 1366, height: 768 } }); const pg = r.page;
  await pg.goto('http://127.0.0.1:4390/s61r3/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await L.sleep(700);
  await L.tap(pg, '[data-action="situation"]', { touch }); await pg.waitForSelector('#situation-h'); await L.sleep(300);
  const spot = await pg.evaluate(() => { const st = document.querySelector('.situation-stage').getBoundingClientRect(); const pts = [...document.querySelectorAll('.situation [data-port], .situation [data-mark-dot], .situation [data-mark]')].map((e) => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
    for (let y = st.top + 40; y < st.bottom - 40; y += 20) for (let x = st.left + 40; x < st.right - 40; x += 20) if (pts.every(([a, b]) => Math.hypot(a - x, b - y) > 40)) return { x, y }; return null; });
  if (touch) await pg.touchscreen.tap(spot.x, spot.y); else await pg.mouse.click(spot.x, spot.y); await L.sleep(300);
  const after = await pg.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { active: a.id || a.className || a.tagName, isRoot: a.classList.contains('situation'), outline: cs.outlineStyle + ' ' + cs.outlineWidth, focusVisible: a.matches(':focus-visible') }; });
  await pg.keyboard.press('Tab'); await L.sleep(100); const nextTab = await pg.evaluate(() => { const e = document.activeElement; return { t: e.dataset.situation || e.id || e.tagName, fv: e.matches(':focus-visible'), outline: getComputedStyle(e).outlineStyle }; });
  // 다시 바다를 누르고 Shift+Tab
  if (touch) await pg.touchscreen.tap(spot.x, spot.y); else await pg.mouse.click(spot.x, spot.y); await L.sleep(200);
  await pg.keyboard.press('Shift+Tab'); await L.sleep(100); const shiftFromRoot = await pg.evaluate(() => document.activeElement.dataset.situation || document.activeElement.id);
  if (touch) await pg.touchscreen.tap(spot.x, spot.y); else await pg.mouse.click(spot.x, spot.y); await L.sleep(200);
  await pg.keyboard.press('Escape'); await L.sleep(300);
  const esc = await pg.evaluate(() => ({ open: !!document.querySelector('.situation'), focus: document.activeElement?.dataset.action, inert: document.querySelector('#app').inert }));
  res.push({ prof, spot, after, nextTab, shiftFromRoot, afterEscape: esc, errors: r.errors }); await r.ctx.close(); }
  console.log(JSON.stringify(res)); await L.done(); process.exit(0); })();
