// 번들 바이트를 원본 모듈별로 나눈다(source map). 모듈별 조각을 모아 gzip도 따로 잰다(근사).
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const { SourceMapConsumer } = require(process.argv[3] + '/node_modules/source-map-js');
const file = process.argv[2]; const code = fs.readFileSync(file, 'utf8'); const map = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));
const c = new SourceMapConsumer(map); const lines = code.split('\n'); const pieces = {};
const segs = []; c.eachMapping((m) => segs.push(m)); segs.sort((a, b) => a.generatedLine - b.generatedLine || a.generatedColumn - b.generatedColumn);
for (let i = 0; i < segs.length; i++) { const s = segs[i], n = segs[i + 1]; const line = lines[s.generatedLine - 1] || '';
  const end = n && n.generatedLine === s.generatedLine ? n.generatedColumn : line.length; const src = s.source || '(none)';
  (pieces[src] ??= []).push(line.slice(s.generatedColumn, end)); }
const rows = Object.entries(pieces).map(([src, p]) => { const t = p.join(''); return [src.replace(/^.*?(src|data)\//, '$1/'), Buffer.byteLength(t), zlib.gzipSync(t, { level: 9 }).length]; }).sort((a, b) => b[1] - a[1]);
let tot = 0; for (const r of rows) tot += r[1];
console.log('total mapped', tot, 'file', Buffer.byteLength(code));
for (const r of rows.slice(0, +process.argv[4] || 40)) console.log(String(r[1]).padStart(8), String(r[2]).padStart(7), r[0]);
