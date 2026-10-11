// R-bugs Playwright 공용. accept16/place-out/plib.js를 참고하되 이 폴더에만 쓴다.
const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const S = '/tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad';
const OUT = path.join(S, 'accept28/t24/h');
const FONTS = path.join(OUT, 'fonts');
fs.mkdirSync(FONTS, { recursive: true });
const CACHES = [path.join(S, 'accept24/remeas2/fonts'), path.join(S, 'accept24/kbreg/fonts'), path.join(S, 'accept23/kbd18/fonts'), path.join(S, 'accept23/code18/fonts'), path.join(S, 'accept24/meas/fonts'), path.join(S, 'accept21/r3/fonts'), path.join(S, 'accept20/anchor/fonts'), path.join(S, 'accept20/refute-anchor-F2-R/fonts'), path.join(S, 'accept20/refute-code-R2-1/fonts'), path.join(S, 'accept20/adv/probes/fonts'), path.join(S, 'accept18/b1/fonts'), path.join(S, 'accept18/code/probes/fonts'), path.join(S, 'accept18/critic/fonts'), path.join(S, 'accept17/bugs/fonts'), path.join(S, 'accept16/place-out/fonts'), path.join(S, 'accept14/layout/fonts'), path.join(S, 'accept14/critic/fonts'), FONTS];
const nb = ({ defaultBrowserType, ...o }) => o;
const lap = (w, h) => ({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
const ipadL = nb(devices['iPad (gen 7) landscape']);
const PROF = {
  l1366: { label: '1366×657 마우스', o: lap(1366, 657) },
  cb1366t: { label: '1366×657 터치', o: { ...lap(1366, 657), hasTouch: true } },
  ipadAirL: { label: '1180×820 터치', o: { ...ipadL, viewport: { width: 1180, height: 820 }, screen: { width: 1180, height: 820 } } },
  ipadminiL: { label: '1024×768 터치', o: nb(devices['iPad Mini landscape']) },
  ipadmini6L: { label: '1133×744 터치', o: { ...ipadL, viewport: { width: 1133, height: 744 }, screen: { width: 1133, height: 744 } } },
  l1920: { label: '1920×969 마우스', o: lap(1920, 969) },
  t1000: { label: '1000×700 한 열 터치', o: { ...ipadL, viewport: { width: 1000, height: 700 }, screen: { width: 1000, height: 700 } } },
};
async function routeFonts(ctx) {
  await ctx.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, async (route) => {
    const url = route.request().url();
    const ua = route.request().headers()['user-agent'] || 'Mozilla/5.0';
    const css = url.includes('googleapis');
    const key = crypto.createHash('sha1').update(url + (css ? ua : '')).digest('hex');
    let file = CACHES.map((d) => path.join(d, key)).find((f) => fs.existsSync(f));
    try {
      if (!file) { file = path.join(FONTS, key); fs.writeFileSync(file, execFileSync('curl', ['-sS', '--fail', '--max-time', '30', '-A', ua, url], { maxBuffer: 32 << 20 })); }
      await route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { 'content-type': css ? 'text/css; charset=utf-8' : 'font/woff2', 'access-control-allow-origin': '*' } });
    } catch (e) { await route.abort(); }
  });
}
const DISTS = { head: path.join(S, 'accept28/t24/dist-base'), o3b: path.join(S, 'accept28/t24/dist-proto') };
async function routeDist(ctx) {
  await ctx.route(/^http:\/\/127\.0\.0\.1:4390\/.*/, async (route) => {
    const u = new URL(route.request().url()); const [, v, ...rest] = u.pathname.split('/');
    const f = path.join(DISTS[v] || '/nonexistent', rest.join('/') || 'index.html');
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    const ext = path.extname(f);
    const ct = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
    await route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': ct } });
  });
}
let browser;
async function launch() { browser = browser || (await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })); return browser; }
async function newPage(profKey, extra = {}) {
  const b = await launch();
  const ctx = await b.newContext({ ...PROF[profKey].o, locale: 'ko-KR', ...extra });
  await routeFonts(ctx); await routeDist(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => d.accept().catch(() => {}));
  return { ctx, page, errors };
}
async function open(profKey, dist = 'fixed2', extra = {}) {
  const r = await newPage(profKey, extra);
  await r.page.goto(`http://127.0.0.1:4390/${dist}/index.html`);
  await r.page.waitForSelector('[data-action="end-day"]');
  await r.page.evaluate(() => document.fonts.ready);
  await sleep(300);
  return r;
}
async function done() { if (browser) await browser.close(); browser = null; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 500ms 막기를 넘긴 뒤 누른다.
// 좌표로 누른다(Playwright의 자동 스크롤을 피한다). 누를 점이 다른 요소에 가려 있으면 가운데로 옮긴 뒤 누른다.
async function tap(page, sel, { touch = false, scrollIfNeeded = true } = {}) {
  await sleep(560);
  const el = await page.$(sel);
  if (!el) throw new Error('없음: ' + sel);
  const point = () => el.evaluate((e) => { const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 20);
    const h = document.elementFromPoint(x, y); return { x, y, ok: !!h && (h === e || e.contains(h)) }; });
  let p = await point();
  if (!p.ok) {
    if (!scrollIfNeeded) throw new Error('가려짐: ' + sel);
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await sleep(100);
    p = await point();
    if (!p.ok) throw new Error('가려짐(옮긴 뒤): ' + sel);
  }
  if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
  await sleep(80);
}
async function endDay(page) { await tap(page, '[data-action="end-day"]'); }
module.exports = { S, OUT, PROF, DISTS, newPage, open, done, sleep, tap, endDay };
