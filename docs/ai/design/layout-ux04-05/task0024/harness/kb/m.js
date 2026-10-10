// 공용: 계측 설치, 탭(터치 프로필은 터치), 스크린숏.
const L = require('./blib');
const touchOf = (prof) => !!L.PROF[prof].o.hasTouch;
async function tap(page, prof, sel) { return L.tap(page, sel, { touch: touchOf(prof) }); }
async function endDay(page, prof) { return tap(page, prof, '[data-action="end-day"]'); }
async function instrument(page) {
  await page.evaluate(() => {
    window.__log = { scrollBy: [], scrollTo: [], siv: 0, sivIds: [] };
    if (!window.__wrapped) {
      window.__wrapped = true;
      const sb = window.scrollBy.bind(window); window.scrollBy = (...a) => { window.__log.scrollBy.push(a.map((v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v)); return sb(...a); };
      const st = window.scrollTo.bind(window); window.scrollTo = (...a) => { window.__log.scrollTo.push(a); return st(...a); };
      const o = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (...a) { window.__log.siv++; window.__log.sivIds.push(this.id || this.tagName); return o.apply(this, a); };
    }
  });
}
async function log(page) { return page.evaluate(() => window.__log); }
async function shot(page, name) { await page.screenshot({ path: `${L.S}/accept28/t24/h/shots/${name}.png` }); }
async function scrollTopTo(page, id, offsetFromBar) {
  await page.evaluate(([id, off]) => { const bar = document.querySelector('.statusbar').getBoundingClientRect().bottom; window.scrollBy(0, document.getElementById(id).getBoundingClientRect().top - (bar + off)); }, [id, offsetFromBar]);
  await L.sleep(200);
}
async function ctx(page) {
  return page.evaluate(() => ({ y: Math.round(scrollY), bar: Math.round(document.querySelector('.statusbar').getBoundingClientRect().bottom), ih: innerHeight,
    toastTop: (() => { const t = document.querySelector('.flash-toast'); return t ? Math.round(t.getBoundingClientRect().top) : null; })(),
    focus: document.activeElement?.dataset?.action || document.activeElement?.id || document.activeElement?.tagName,
    day: document.querySelector('.statusbar .date b')?.textContent }));
}
module.exports = { L, touchOf, tap, endDay, instrument, log, shot, scrollTopTo, ctx };
