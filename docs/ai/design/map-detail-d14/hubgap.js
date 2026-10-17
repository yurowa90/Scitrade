const L = require('./blib');
(async () => {
  for (const prof of ['l1366','cb1366t','ipadAirL','ipadminiL','ipadmini6L','l1920','t1000']) {
    const { page, ctx } = await L.open(prof, 'i3');
    for (const mode of ['route', 'world']) {
      await page.evaluate((m) => document.querySelector(`[data-action="map-mode"][data-mode="${m}"]`).click(), mode); await L.sleep(700);
      const r = await page.evaluate(() => {
        const pts = [...document.querySelectorAll('.sea-map .port, .sea-map .gate')].map((g) => { const b = (g.querySelector('.port-badge') || g.querySelector('.gate-mark')).getBoundingClientRect(); return { cls: g.getAttribute('class'), name: g.querySelector('title').textContent.split(/[ \n(—]/)[0], x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width }; });
        const fr = document.querySelector('[data-map-frame]').getBoundingClientRect();
        let pairs = [];
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y); pairs.push([d, pts[i].name, pts[j].name]); }
        pairs.sort((a, b) => a[0] - b[0]);
        return { n: pts.length, active: pts.filter(p=>/active|planned/.test(p.cls)).length, badge: Math.round(Math.min(...pts.map(p=>p.w))*10)/10, frameW: Math.round(fr.width), under44: pairs.filter(p => p[0] < 44).length, closest: pairs.slice(0, 3).map(p => `${p[1]}-${p[2]} ${p[0].toFixed(1)}`) };
      });
      console.log(prof, mode, JSON.stringify(r));
    }
    await ctx.close();
  }
  await L.done();
})().catch(async (e) => { console.error(e); await L.done(); process.exit(1); });
