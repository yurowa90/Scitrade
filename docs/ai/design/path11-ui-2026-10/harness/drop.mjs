// 소스맵으로 후보 원본 파일의 생성 코드를 빼고 남은 청크를 gzip해서, 뺄 수 있는 양(근사)을 잰다.
// 사용: node drop.mjs <js> <정규식>
import fs from 'node:fs'; import zlib from 'node:zlib';
const [file, pat] = process.argv.slice(2); const re = new RegExp(pat);
const js = fs.readFileSync(file, 'utf8'); const map = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; const dec = {}; [...B64].forEach((c, i) => dec[c] = i);
const vlq = (s) => { const o = []; let v = 0, sh = 0; for (const c of s) { const d = dec[c]; v += (d & 31) << sh; if (d & 32) sh += 5; else { o.push(v & 1 ? -(v >> 1) : v >> 1); v = 0; sh = 0; } } return o; };
const lines = js.split('\n'); let src = 0; const keep = [], drop = [];
map.mappings.split(';').forEach((ln, li) => { const line = lines[li] ?? ''; let col = 0; const pts = [];
  for (const s of (ln ? ln.split(',').map(vlq) : [])) { col += s[0]; if (s.length > 1) src += s[1]; pts.push([col, s.length > 1 ? src : -1]); }
  if (!pts.length || pts[0][0] > 0) keep.push(line.slice(0, pts.length ? pts[0][0] : line.length));
  pts.forEach(([c, s], i) => { const e = i + 1 < pts.length ? pts[i + 1][0] : line.length; (s >= 0 && re.test(map.sources[s]) ? drop : keep).push(line.slice(c, e)); });
  keep.push('\n'); });
const g = (t) => zlib.gzipSync(t, { level: 9 }).length;
const full = g(js), rest = g(keep.join('')), part = g(drop.join(''));
console.log(`원본 ${Buffer.byteLength(drop.join(''))} B · 따로 gzip ${part} B · 청크 gzip ${full} → ${rest} (절감 ${full - rest} B)`);
