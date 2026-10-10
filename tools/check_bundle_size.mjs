#!/usr/bin/env node
// 빌드 크기 한도 검사. 사용: node tools/check_bundle_size.mjs [dist 폴더]
// 종료 코드: 0 통과, 1 한도 초과, 2 사용법 오류 또는 읽을 파일 없음(index.html·참조 파일).
import { collectDist, evaluateBudget, formatReport } from './bundle-size.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => arg.startsWith('-'))) {
  console.error('사용법: node tools/check_bundle_size.mjs [dist 폴더]');
  process.exitCode = 2;
} else {
  const dist = args[0] ?? 'dist';
  const c = collectDist(dist);
  if (c.missing.length) {
    for (const file of c.missing) console.error(`없음: ${file}`);
    console.error(`${dist}에서 읽을 파일이 없습니다. 먼저 빌드하세요`);
    process.exitCode = 2;
  } else {
    const v = evaluateBudget(c);
    console.log(formatReport(c, v).join('\n'));
    process.exitCode = v.ok ? 0 : 1;
  }
}
