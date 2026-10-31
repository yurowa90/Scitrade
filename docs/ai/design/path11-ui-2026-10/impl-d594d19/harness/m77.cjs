// TASK-0077-R1 병합 전 실측(세션 B). 사용: node m77.cjs <build 이름(after|base)> <출력 jsonl>
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const S = __dirname, build = process.argv[2], out = process.argv[3];
const URL = `http://127.0.0.1:4392/${build}/dist/`;
const PROFILES = [['ipadminiL', 1024, 768, true], ['ipadAirL', 1180, 820, true], ['m1366', 1366, 768, false], ['z400', 256, 192, true]];
const log = (o) => fs.appendFileSync(out, JSON.stringify(o) + '\n');
async function open(b, w, h, touch, save) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: false, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await p.waitForSelector('#app *'); await p.evaluate(() => document.fonts.ready);
  if (save) { await p.setInputFiles('input[data-action="import"]', `${S}/${save}`); await p.waitForFunction(() => document.querySelector('select[data-action="scenario"]')?.value === 'SCENARIO_M2_OPS_CREDIT', null, { timeout: 15000 }); await p.waitForTimeout(400); }
  return { ctx, p };
}
const overflow = (p) => p.evaluate(() => {
  const doc = document.scrollingElement.scrollWidth - innerWidth;
  const els = [...document.querySelectorAll('.p11, .p11 table, article.offer, .panel.report, #p11-dialog, #p11-dialog table')]
    .filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).map((e) => `${e.tagName}.${e.className}#${e.id}:${e.scrollWidth - e.clientWidth}`);
  return { doc, els };
});
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [id, w, h, touch] of PROFILES) {
    // A. 8일 아침: 외상 카드
    let { ctx, p } = await open(b, w, h, touch, 'save-2001-d8.json');
    const card = await p.evaluate(() => {
      const c = [...document.querySelectorAll('article.offer')].find((a) => a.querySelector('.p11'));
      if (!c) return null; const blk = c.querySelector('.p11');
      const h0 = c.getBoundingClientRect().height; blk.style.display = 'none'; const hNo = c.getBoundingClientRect().height; blk.style.display = '';
      const labels = [...blk.querySelectorAll('.p11-terms label')].map((l) => Math.round(l.getBoundingClientRect().height));
      const sum = blk.querySelector('summary'); const sumH = Math.round(sum.getBoundingClientRect().height);
      blk.querySelector('details').open = true; const hOpen = c.getBoundingClientRect().height; blk.querySelector('details').open = false;
      return { cards: document.querySelectorAll('article.offer .p11').length, cardH: Math.round(h0), addClosed: Math.round(h0 - hNo), addOpen: Math.round(hOpen - hNo), labels, sumH };
    });
    log({ id, state: 'd8', card, ov: await overflow(p) });
    // 초점·낭독: 첫 카드 D15 라디오
    const r = await p.evaluate(() => { const i = document.querySelector('article.offer .p11 input[data-term="D15"]:not([disabled])'); return i ? { key: i.dataset.key } : null; });
    if (r) {
      await p.click(`article.offer .p11 label:has(input[data-term="D15"][data-key="${r.key}"])`); await p.waitForTimeout(250);
      log({ id, state: 'd8-radio', focus: await p.evaluate(() => { const a = document.activeElement; return { tag: a?.tagName, term: a?.dataset?.term, checked: a?.checked }; }),
        live: await p.evaluate(() => document.getElementById('live-status')?.textContent), summary: await p.evaluate((k) => document.querySelector(`[data-p11-summary="${k}"]`)?.textContent, r.key) });
      // toggle: 실제로 summary를 눌러 열고, 수량을 바꿔 다시 그린 뒤 열림 유지 확인
      await p.click(`[data-p11-key="credit-${r.key}"] > summary`); await p.waitForTimeout(150);
      const q = await p.$(`select[data-action="offer-quantity"][data-key="${r.key}"]`);
      let keptAfterQty = null, keptAfterTerm = null;
      if (q) { const vals = await q.evaluate((s) => [...s.options].map((o) => o.value)); if (vals.length > 1) { await q.selectOption(vals[1]); await p.waitForTimeout(250); keptAfterQty = await p.evaluate((k) => document.querySelector(`[data-p11-key="credit-${k}"]`)?.open, r.key); } }
      await p.click(`article.offer .p11 label:has(input[data-term="BASE"][data-key="${r.key}"])`); await p.waitForTimeout(250);
      keptAfterTerm = await p.evaluate((k) => document.querySelector(`[data-p11-key="credit-${k}"]`)?.open, r.key);
      log({ id, state: 'd8-toggle', openAfterClick: await p.evaluate((k) => document.querySelector(`[data-p11-key="credit-${k}"]`)?.open, r.key), keptAfterQty, keptAfterTerm, ov: await overflow(p),
        anim: await p.evaluate(() => document.getAnimations().length) });
    }
    await ctx.close();
    // B. 22일: 막힌 라디오
    ({ ctx, p } = await open(b, w, h, touch, 'save-2001-d22.json'));
    log({ id, state: 'd22', disabled: await p.evaluate(() => [...document.querySelectorAll('.p11 input[disabled]')].map((i) => ({ term: i.dataset.term, reason: document.getElementById(i.getAttribute('aria-describedby'))?.textContent ?? null, visible: !!document.getElementById(i.getAttribute('aria-describedby'))?.getClientRects().length }))), ov: await overflow(p) });
    await ctx.close();
    // C. 31일: 경영 보고 칸, 대화상자
    ({ ctx, p } = await open(b, w, h, touch, 'save-2001-d31.json'));
    const rep = await p.evaluate(() => { const r = document.querySelector('.panel.report'); return { w: Math.round(r.getBoundingClientRect().width), p11h: [...r.querySelectorAll('.p11')].map((e) => Math.round(e.getBoundingClientRect().height)), asof: [...(r.querySelector('select[data-action="p11-asof"]')?.options ?? [])].map((o) => o.value + ':' + o.textContent), btnH: Math.round(r.querySelector('[data-action="p11-dialog"]')?.getBoundingClientRect().height ?? 0), sums: [...r.querySelectorAll('.p11 summary')].map((s) => Math.round(s.getBoundingClientRect().height)) }; });
    log({ id, state: 'd31-report', rep, ov: await overflow(p) });
    await p.click('[data-action="p11-dialog"]'); await p.waitForTimeout(300);
    const dlg = await p.evaluate(() => { const d = document.getElementById('p11-dialog'); return { open: !!d, focus: document.activeElement?.id, inert: [...document.getElementById('app').children].filter((e) => e !== d).map((e) => e.inert), rect: d && [Math.round(d.getBoundingClientRect().width), Math.round(d.getBoundingClientRect().height)] }; });
    log({ id, state: 'd31-dialog', dlg, ov: await overflow(p) });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    log({ id, state: 'd31-escape', open: await p.evaluate(() => !!document.getElementById('p11-dialog')), focus: await p.evaluate(() => document.activeElement?.dataset?.action) });
    await ctx.close();
    // D. 2005 36일: 누설 검사
    ({ ctx, p } = await open(b, w, h, touch, 'save-2005-d36.json'));
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => d.open = true));
    await p.click('[data-action="p11-dialog"]'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => d.open = true));
    const leak = await p.evaluate(() => { const nodes = document.getElementById('app').innerHTML.split(/<[^>]+>/).map((t) => t.trim()).filter(Boolean);
      return { badDebtShown: nodes.filter((t) => /대손/.test(t)).slice(0, 4), pct: nodes.filter((t) => /%/.test(t)).slice(0, 4), both: nodes.filter((t) => /대손/.test(t) && /%/.test(t)), banned: nodes.filter((t) => /확률|기대|시드|모의|K-Sight|연체율|43%/.test(t)),
        allowance: document.querySelector('#p11-dialog [data-p11-account="SALES_ALLOWANCE"]')?.dataset.minor ?? null, badDebt: document.querySelector('#p11-dialog [data-p11-account="BAD_DEBT"]')?.dataset.minor ?? null }; });
    log({ id, state: 'd36-leak', leak, ov: await overflow(p) });
    await ctx.close();
  }
  await b.close();
})();
