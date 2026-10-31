const { drawUniform } = await import(process.argv[2]);
const seed = 42032026;
for (const k of [1, 2]) {
  let rng = { seed, cursors: {} };
  const vals = [];
  for (let i = 0; i < 22; i++) { const r = drawUniform(rng, 'MARKET-B' + String(k).padStart(2, '0')); vals.push(r.value); rng = r.rng; }
  const ib = (v, lo, hi) => lo + Math.floor(v * (hi - lo + 1));
  const ix = (v, n) => Math.floor(v * n);
  const steps = [ib(vals[0], -3, 3), ib(vals[1], -3, 3)];
  const dest = [ix(vals[2], 2), ix(vals[3], 2)];
  const reg = vals.slice(4, 10).map((v) => ib(v, -4, 4));
  const cp = vals.slice(10, 14).map((v) => ib(v, -3, 3));
  const lots = [ix(vals[14], 3), ix(vals[15], 3)];
  const pool = ['F1','F2','F3','F4','F5','F6','H1','H2','H3','H4','H5','H6'];
  for (let i = 0; i < 6; i++) { const j = i + ix(vals[16 + i], 12 - i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const picked = pool.slice(0, 6).sort((a, b) => ['F1','F2','F3','F4','F5','F6','H1','H2','H3','H4','H5','H6'].indexOf(a) - ['F1','F2','F3','F4','F5','F6','H1','H2','H3','H4','H5','H6'].indexOf(b));
  console.log(k, JSON.stringify({ first: vals.slice(0, 2).map((v) => v.toFixed(6)), steps, dest, reg, cp, lots, picked }));
}
