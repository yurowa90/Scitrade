// 실패한 import()를 같은 주소로 다시 부르면 Chromium이 다시 요청하는지
const L = require('./blib'); const fs = require('fs'); const path = require('path');
const ROOT = `/tmp/claude-0/-home-user-Scitrade/3ec112a5-057f-529d-b1f4-e55e1685814c/scratchpad/b/b59r1/dist`;
(async () => { const b = await require('/opt/node-tools/node_modules/playwright').chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext(); let block = true; const log = [];
  await ctx.route(/^http:\/\/127\.0\.0\.1:4390\/.*/, async (route) => { const rel = new URL(route.request().url()).pathname.split('/').slice(2).join('/') || 'index.html';
    if (/culture-panel/.test(rel)) { log.push((block ? 'abort ' : 'serve ') + rel); if (block) return route.abort('internetdisconnected'); }
    const f = path.join(ROOT, rel); if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': rel.endsWith('.js') ? 'text/javascript' : 'text/html' } }); });
  await ctx.route(/fonts\./, (r) => r.abort());
  const pg = await ctx.newPage(); await pg.goto('http://127.0.0.1:4390/x/index.html'); await pg.waitForSelector('[data-action="end-day"]'); await L.sleep(1500);
  const name = fs.readdirSync(ROOT + '/assets').find((f) => /^culture-panel.*\.js$/.test(f));
  block = false;
  const r1 = await pg.evaluate((n) => import('./assets/' + n).then(() => 'ok', (e) => 'fail ' + String(e).slice(0, 60)), name);
  const r2 = await pg.evaluate((n) => import('./assets/' + n + '?retry=1').then(() => 'ok', (e) => 'fail ' + String(e).slice(0, 60)), name);
  console.log(JSON.stringify({ chromium: b.version(), sameUrlRetry: r1, queryRetry: r2, log })); await b.close(); })();
