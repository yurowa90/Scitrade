// 소스맵으로 생성 코드 바이트를 원본 파일에 나눈다. 사용: node attr.mjs <js> → 파일별 원본·gzip 근사
import fs from 'node:fs'; import zlib from 'node:zlib';
const js = fs.readFileSync(process.argv[2], 'utf8'); const map = JSON.parse(fs.readFileSync(process.argv[2] + '.map', 'utf8'));
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; const dec = {}; [...B64].forEach((c, i) => dec[c] = i);
function vlq(s) { const out = []; let v = 0, sh = 0; for (const c of s) { const d = dec[c]; v += (d & 31) << sh; if (d & 32) sh += 5; else { out.push(v & 1 ? -(v >> 1) : v >> 1); v = 0; sh = 0; } } return out; }
const lines = js.split('\n'); const pieces = {}; let src = 0;
map.mappings.split(';').forEach((ln, li) => { let col = 0; const segs = ln ? ln.split(',').map(vlq) : []; const line = lines[li] ?? '';
  const pts = []; for (const s of segs) { col += s[0]; if (s.length > 1) src += s[1]; pts.push([col, s.length > 1 ? src : -1]); }
  // 원본줄·열 상태 유지 필요 없음(파일만 셈). 단 src는 누적이라 이후 세그먼트에 반영.
  for (let i = 0; i < pts.length; i++) { const [c, s] = pts[i]; const e = i + 1 < pts.length ? pts[i + 1][0] : line.length; const k = s < 0 ? '(없음)' : map.sources[s]; (pieces[k] ??= []).push(line.slice(c, e)); }
  if (pts.length && pts[0][0] > 0) (pieces['(없음)'] ??= []).push(line.slice(0, pts[0][0])); });
// vlq 누적은 src만 쓰고 원본 줄·열 필드는 무시하지만, src 누적이 정확하려면 segment[1]만 더하면 된다.
const rows = Object.entries(pieces).map(([k, a]) => { const t = a.join(''); return [k.replace(/^.*?(src|data|node_modules|PACKAGE)/, '$1'), Buffer.byteLength(t), zlib.gzipSync(t, { level: 9 }).length]; }).sort((a, b) => b[1] - a[1]);
const tot = rows.reduce((s, r) => s + r[1], 0); console.log('합', tot, '파일 크기', Buffer.byteLength(js));
for (const r of rows) console.log(r[1].toString().padStart(8), r[2].toString().padStart(7), r[0]);
