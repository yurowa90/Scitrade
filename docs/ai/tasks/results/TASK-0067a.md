# TASK-0067a 결과
- 모델: gpt-6-astra (high)
- BASE: `f18978f37ceab59daef31f32c065b7c785d9bf87`

## 바꾼 파일
| 파일·줄 | 변경 |
|---|---|
| `src/engine/types.ts:14` | rules-4·CreditProfile·외상 계약/명령 선택 칸·미사용 위험 층 이름 |
| `src/engine/risk.ts:188` | 위험 술어와 withRiskLevelV2 |
| `src/engine/engine.ts:295` | 공통 외상 판정, 인수 검증·계약 기록, 통화 술어 |
| `src/engine/operations.ts:152` | 환전·필요액 술어 네 곳 |
| `src/engine/operations-invariants.ts:75` | 혼합 통화·환전 불변식 술어 두 곳 |
| `src/engine/invariants.ts:41` | 이전 판본 키 금지·rules-4 조건과 금액/날짜 일치 |
| `src/engine/reports.ts:104` | 미리보기 위험 술어 |
| `src/engine/readers.ts:262` | 공개 선택지 읽기 함수 |
| `src/engine/save-shape.ts:102` | 형식 6 계약 선택 칸 |
| `src/content/scenario.ts:566` | 외상 로더만 추가 |
| `src/engine/sim/d03.ts:49` | 49~50행 DEFAULT ID 선택만 변경 |
| `src/engine/m2a5-risk-credit-v2.test.ts:38` | 새 시험 25개 |
| `data/market_rules.json:1271` | 배열 끝 V2 항목 추가 |
| `schemas/market_rules.schema.json:733` | 선택 외상 칸 스키마 |
| `tools/validate_data.py:895` | 외상 자료 묶음·등급·비대칭·한도 검증 |
| `tools/test_validate_data.py:1118` | 거부 사례 13개와 DEFAULT의 p_default 단독 추가 사례(기존 시험 삭제 0) |
| `MANIFEST.json:7` | build_package.py --manifest-only 생성 |
| `docs/ai/tasks/results/TASK-0067a.md:1` | 결과 보고 |

## 설계 판단 (지시서에 없던 결정과 이유)
- `withRiskLevelV2`는 기존 `withRiskLevel`의 구조 복제·품목 필터·원화 변환을 재사용한다. R0P는 R1 변환 뒤 층만 비운다. rules-3 함수 자체는 바이트 그대로이며, 이 방식으로 변환 중복을 피한다.
- `creditTermCheck`는 허용된 파일인 engine.ts에 두었다. 읽기 함수와 인수가 같은 판정을 쓰고, 공개 결과는 읽기 함수에서 필요한 여덟 칸만 고른다.
- 수량이 아직 검증되지 않은 호출에서도 기존 수량 거절 경로를 유지한다. 안전한 정수인 유효 판매액은 divHalfAway로 반올림한다. 잘못된 수량 때문에 이 함수가 먼저 정수 예외를 내지 않도록 계산을 분기했다.
- 한도 검사에서 매입가·기본 로트가 없는 잘못된 품목 자료는 예외 대신 FAIL로 보고한다. 기존 test_trade_prerequisites 거부 고정물로 확인했다.
- 옛 빌드 검증은 독립 로컬 복제 저장소에 BASE 워크트리를 만들었다. 현재 작업 트리의 공통 Git 디렉터리는 쓰기 허용 밖이고 WORKFLOW도 공유 Git 변경을 금지하므로, 별도 .git 안에서 요청된 worktree 검증을 수행했다. 커밋·푸시·현재 브랜치 전환은 없다. 최초 하드링크 복제는 교차 파일시스템 오류로 실패했고 --no-hardlinks로 복제했다.

## 실행한 검증과 결과 (명령별 통과/실패, 테스트 개수)
### 작업 전 기준

```text
Node 22.22.0, ICU 77.1
rules-2: 105회, 워커 4개, 131.340초
rules-1: 400회, 워커 4개, 28.506초
엔진 골든 일치: rules-2 105회, rules-1 400회
Node 22.22.0, ICU 77.1
rules-3: 108회, 워커 4개, 160.046초
rules-3 골든 일치: 108회
```

- `node src/engine/sim/run.mjs run --out /tmp/TASK-0067a-run-before.json`: 종료 0, 400회, 26.89초.
- `node src/engine/sim/run.mjs d03 --risk R1 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0067a-d03-before.json`:  종료 0, 시드 2001~2003·351회·워커 3개(요청 4, 시드 수로 제한), 386.84초. 변경 전 모듈과 자료를 읽은 실행이다. 기준 골든 두 개와 비위험 실행 완료 뒤 구현을 적용했고, 당시 d03만 계속 실행 중이었다.
- 기본 병렬 실행이 오래 걸려 읽기 전용 단일 워커 진단도 실행했다. rules-3 108회 일치(183.888초). d03 단일 워커 결과는 별도 파일이며 지정 비교에는 사용하지 않았다.
### 작업 후 기준·일반 검증
| 명령 | 결과 |
|---|---|
| `python3 tools/build_package.py --manifest-only` | 통과. 보고서 추가 뒤 다시 생성 |
| `python3 tools/validate_data.py` | 통과, 자료 25개 |
| `npm run typecheck` | 통과 |
| `npx vitest run` | 56개 파일, 1,535개 통과·기존 todo 1개(총 1,536개) |
| `npm run build` | 통과. 검수 스크립트는 `--silent`로 같은 명령 실행 |
| `node tools/check_bundle_size.mjs dist` | 통과. 첫 화면 gzip 131,192 / 140,000 B |
| `node tools/check_rules2_golden.mjs` | 통과. rules-2 105회·rules-1 400회 |
| `node tools/check_rules3_golden.mjs` | 통과. rules-3 108회·로더 지문 경고 없음 |
| `node --test tools/check_rules2_golden.test.mjs` | 통과, 테스트 파일 1 |
| `node --test tools/check_rules3_golden.test.mjs` | 통과, 테스트 파일 1 |
| `python3 tools/art/test_pixel_tools.py` | 21개 통과 |
| `python3 -m unittest discover -s scripts -p test_*.py` | 21개 통과 |
| `PYTHONDONTWRITEBYTECODE=1 python3 tools/test_validate_data.py` | 139개 통과 |
| `python3 tools/check_fact_mixing.py` | 통과 |
| `python3 tools/test_check_fact_mixing.py` | 26개 통과 |
| `node --test tools/browser/lib.test.mjs` | 통과, 테스트 파일 1 |
| `node --test tools/check_bundle_size.test.mjs` | 통과, 테스트 파일 1 |
| `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check f18978f37ceab59daef31f32c065b7c785d9bf87` | **검사 18종, 실패 0종 (모드: 확인)**, 검사 전후 트리 동일 |

작업 후 골든 출력:
```text
Node 22.22.0, ICU 77.1
rules-2: 105회, 워커 4개, 90.989초
rules-1: 400회, 워커 4개, 14.035초
엔진 골든 일치: rules-2 105회, rules-1 400회
  통과
Node 22.22.0, ICU 77.1
rules-3: 108회, 워커 4개, 56.602초
rules-3 골든 일치: 108회
  통과
```

비위험·d03 비교:
```text
node src/engine/sim/run.mjs run --out /tmp/TASK-0067a-run-after.json
실행 400회 · 22.24초
cmp /tmp/TASK-0067a-run-before.json /tmp/TASK-0067a-run-after.json
출력 없음, 종료 0
node src/engine/sim/run.mjs d03 --risk R1 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0067a-d03-after.json
실행 351회 · 331.53초 · 워커 3개
meta.risk.marketRulesSha256만 삭제하고 JSON 키 정렬 뒤:
cmp /tmp/TASK-0067a-d03-before-normalized.json /tmp/TASK-0067a-d03-after-normalized.json
출력 없음, 종료 0
```
두 JSON의 `meta.risk.marketRulesSha256`는 아래 계산 출력의 BASE/변경 SHA-256과 각각 일치함을 별도 단언했다. 변경 전 병렬·단일 워커 d03 JSON도 일치한다. 한 실행의 비용 때문에 추가한 단일 워커 확인은 351회·646.55초로 끝났다.

최종 보고서 작성 뒤 MANIFEST를 다시 생성하고 `build_package.py --check`, `validate_data.py`, `git diff --check`를 다시 확인했다. 코드 변경 없이 보고서·생성 해시만 갱신했다.
### 새 시험 출력

```text
RUN  v5.0.3 /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/wt-TASK-0067a


 Test Files  1 passed (1)
      Tests  25 passed (25)
   Start at  03:39:34
   Duration  1.78s (transform 80%, tests 10%, import 10%)
```

- 개발 중 첫 새 시험 실행은 환전 단위·명령 ID·시장 공개 날짜 고정물 오류로 실패했다. 새 시험 고정물을 실제 자료에 맞춰 수정했다. 타입 검사의 새 시험 Invoice 칸·원문 타입 좁히기도 고쳤다. 기존 시험 기대값은 변경하지 않았다.
- 최초 Python 시험은 MANIFEST 갱신 전 해시 불일치 4건과 신규 한도 계산의 잘못된 품목 KeyError 1건이었다. 해시 생성·검사기 방어를 수정한 뒤 139개 모두 통과했다.
### 변형 시험
변형 실행 시 새 시험은 24개였다. 이후 실제 M1 시나리오(운영 설정 null) 거절 시험을 하나 추가하여 최종 25개다. 각 변형은 파일 바이트 백업 후 실행하고 finally에서 복원했으며 복원 해시도 확인했다.
| 번호 | 실행·관측 | 판정 |
|---|---|
| 1 | new 종료 1 (Tests  4 failed | 20 passed (24)); golden 종료 2 | 종료 코드 불일치: 예상 1, 실제 2; 결함 탐지는 성공 |
| 2 | new 종료 1 (Tests  1 failed | 23 passed (24)); golden 종료 0 | 기대 일치 |
| 3 | new 종료 1 (Tests  1 failed | 23 passed (24)); old 종료 1 (Tests  1 failed | 35 skipped (36)) | 기대 일치 |
| 4 | new 종료 1 (Tests  1 failed | 23 passed (24)) | 기대 일치 |
| 5 | new 종료 1 (Tests  1 failed | 23 passed (24)) | 기대 일치 |
| 6 | new 종료 1 (Tests  3 failed | 21 passed (24)) | 기대 일치 |
| 7 | new 종료 1 (Tests  1 failed | 23 passed (24)) | 기대 일치 |
| 8 | new 종료 1 (Tests  1 failed | 23 passed (24)) | 기대 일치 |
| 9 | validator 종료 1 | 기대 일치 |
| 10 | validator 종료 1 | 기대 일치 |
| 11 | validator 종료 1 | 기대 일치 |
| 12 | runner 종료 1 (Tests  1 failed | 29 passed (30)) | 기대 일치 |
| 13 | new 종료 1 (Tests  1 failed | 23 passed (24)) | 기대 일치 |
| 14 | new 종료 1 (Tests  1 failed | 23 passed (24)) | 기대 일치 |

**변형 1의 미충족:** 도구는 바이트 비교 전에 rules-3 경로의 미리보기/탐침에서 아래 오류로 종료 2를 낸다. 승인 지시서는 종료 1을 요구한다. 이 동작을 바꾸려면 수정 금지인 골든 도구 또는 지정 술어 경계 밖의 동작을 바꿔야 하므로 수정하지 않았다.

```text
Node 22.22.0, ICU 77.1
[SCENARIO_M2_OPERATIONS/MAX_CONTRIBUTION/2002/1] Cannot read properties of undefined (reading 'rateKrwPerUsd')
```

변형 9~11 출력(해시 불일치 외 FAIL은 각각 지정 문장뿐):

```text
FAIL risk_profiles: RISK_PROFILE_V2: 비대칭 제약: D15 A·B 유리/C 불리 조건 위반
FAIL risk_profiles: RISK_PROFILE_V2: 비대칭 제약: D30 A·B 유리/C 불리 조건 위반
FAIL hash mismatch tools/validate_data.py
3 errors; 34021 checks
FAIL risk_profiles: RISK_PROFILE_V2: 한도 단위: 손잡이 최대 1로트 판매액 407160 미만
FAIL hash mismatch tools/validate_data.py
2 errors; 34021 checks
FAIL risk_profiles: RISK_PROFILE_V2: credit_limits: limit_minor = credit_limit_unit_minor × lots 불일치
FAIL hash mismatch data/market_rules.json
2 errors; 34021 checks
```

변형 12는 기존 risk-runner.test.ts:552의 profileId 비교에서 RISK_PROFILE_DEFAULT와 RISK_PROFILE_V2가 달라 실패했다. 기존 30개 중 이 1개만 실패했다.
변형 실행기 집계가 처음에는 `FAIL:` 접두사를 가정해 9~11을 잘못 분류했다. 실제 출력은 `FAIL `이므로 원본 로그를 다시 읽어 위 문장·종료 코드로 판정했다. 엔진·검사기 동작이나 테스트 기대값은 바꾸지 않았다.
### 옛 빌드의 rules-4 저장 거절

```text
git clone --local --no-hardlinks --no-checkout /home/user/Scitrade /tmp/TASK-0067a-base-repo-copy
git -C /tmp/TASK-0067a-base-repo-copy worktree add --detach /tmp/TASK-0067a-base-wt f18978f37ceab59daef31f32c065b7c785d9bf87
node /tmp/TASK-0067a-verify.mjs <현재 작업 경로>
```

패키지 설치 없이 이미 있는 node_modules를 사용했다. 검증 뒤 독립 저장소·워크트리·준비용 archive 사본은 삭제했고, 스크립트와 로그만 /tmp에 남겼다. V2 R0P·시드 2001에서 D30 직접 무역 계약을 실제 인수하여 저장했다. BASE SUPPORTED_RULES_VERSIONS에 rules-4가 없음을 먼저 단언하고, expected.rulesVersion을 생략한 옛 deserializeSave 호출도 거절되는 것을 확인했다. 따라서 기대 판본 불일치가 아니라 known=false 경로다.

```text
BASE known=false; 다른 경제 규칙 판본(M2a-rules-4)의 저장입니다. 규칙 판본 사이의 자동 이관은 없습니다.
형식 6; creditTermId=D30; 새 빌드 왕복 바이트 같음=true
```

새 빌드의 다른 기대 판본 거절은 25개 새 시험 중 저장 시험이 `이 시나리오의 규칙은 M2a-rules-3이며` 문장을 단언한다.

## 완료 조건 대조 (지시서의 조건마다 충족/미충족과 근거)
| 조건 | 충족 여부·근거 |
|---|---|
| 1. 골든 3판·비위험·d03·해시 | 충족. 전후 골든 종료 0, 비위험 cmp 0, 해시 필드만 제외한 d03 cmp 0, 각각 실제 자료 해시 일치 |
| 2. 기존 시험 파일 불변 | 충족. 지정 name-status 출력 없음, Python 시험 추가 26·삭제 0, 최종 ??는 새 시험과 결과 보고뿐 |
| 3. 새 시험·변형 14개·옛 저장 거절 | **문자 그대로는 미충족 1건.** 새 시험 25개·옛 빌드 거절 통과. 변형 14개 결함 탐지 성공, 13개는 모든 기대와 일치. 변형 1의 골든 종료 코드는 예상 1 대신 2 |
| 4. MANIFEST·자료 검사 | 충족. 생성 및 자료 검사 통과 |
| 5. review_checks | 충족. 검사 18종, 실패 0종 (모드: 확인) |
| 6. 결과 보고 | 충족. 이 파일 |

기존 시험 보존 명령 출력:
```text
git diff --name-status f18978f37ceab59daef31f32c065b7c785d9bf87 -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden
(출력 없음)
git diff --numstat f18978f37ceab59daef31f32c065b7c785d9bf87 -- tools/test_validate_data.py
26      0       tools/test_validate_data.py
```
최종 추적되지 않은 파일은 아래 둘이다. 변형 흔적은 없고 지정된 구현 변경만 남는다.
```text
?? docs/ai/tasks/results/TASK-0067a.md
?? src/engine/m2a5-risk-credit-v2.test.ts
```

## 술어와 보존 범위
9곳 모두 isRiskRules 호출로 교체했다. risk.ts의 withRiskLevel rules-3 대입과 layers.includes 10곳(risk 7·reports 1·engine 2)은 행 내용 비교로 불변을 확인했다. withRiskLevel·loadRiskProfile 함수 본문도 BASE와 바이트 비교해 동일하다. DEFAULT 원문 항목도 그대로다.
작업 전 `grep -n "M2a-rules-3\|layers.includes" src/engine/*.ts`:

```text
src/engine/engine.ts:309:  if (buy.currency !== sell.currency && config.rules.rulesVersion !== 'M2a-rules-3') return '매입과 판매의 통화가 다릅니다.';
src/engine/engine.ts:995:      const surcharge = config.operations?.risk?.layers.includes('SURCHARGE')
src/engine/engine.ts:1146:    if (contract.kind !== 'DIRECT_TRADE' || !config.operations?.risk?.layers.includes('COLLECTION')) {
src/engine/m2a5-risk-cost.test.ts:59:  if (!cfg.operations?.risk?.layers.includes('TARIFF')) return [];
src/engine/m2a5-risk-cost.test.ts:78:  if (!cfg.operations?.risk?.layers.includes('SURCHARGE')) return 0;
src/engine/m2a5-risk-cost.test.ts:86:  if (!cfg.operations!.risk!.layers.includes('FX')) return r;
src/engine/m2a5-risk-cost.test.ts:96:  const rate = cfg.operations?.risk?.layers.includes('TARIFF')
src/engine/m2a5-risk-credit.test.ts:47:  if (!cfg.operations?.risk?.layers.includes('TARIFF')) return [];
src/engine/m2a5-risk-credit.test.ts:66:  if (!cfg.operations?.risk?.layers.includes('SURCHARGE')) return 0;
src/engine/m2a5-risk-credit.test.ts:74:  if (!cfg.operations!.risk!.layers.includes('FX')) return r;
src/engine/m2a5-risk-credit.test.ts:84:  const rate = cfg.operations?.risk?.layers.includes('TARIFF')
src/engine/m2a5-risk-credit.test.ts:133:  if (!cfg.operations!.risk!.layers.includes('CLAIM')) return null;
src/engine/m2a5-risk-credit.test.ts:141:  if (!cfg.operations!.risk!.layers.includes('COLLECTION')) return { mode: 'ON_TIME', days: 0 };
src/engine/operations-invariants.ts:79:      && !(config.rules.rulesVersion === 'M2a-rules-3' && buy.currency === 'KRW' && sell.currency === 'USD' && contract.currency === 'USD')) {
src/engine/operations-invariants.ts:87:    if (usd.length !== 1 || krw.length !== 1 || transfer(usd) * (config.rules.rulesVersion === 'M2a-rules-3' ? referenceRate(config, s.rng.seed, fx.day) : c.fx.baseKrwPerUsd) / MINOR_PER_MAJOR.USD !== -transfer(krw)) problems.push('환전 분개 짝 또는 통화 간 이체가 다릅니다');
src/engine/operations.ts:154:  if (config.rules.rulesVersion === 'M2a-rules-3') {
src/engine/operations.ts:183:      const reason = `환전: ${from} → ${to}(${config.rules.rulesVersion === 'M2a-rules-3' ? '오늘 참고 환율' : '게임용 고정 환율'} ${formatMoney('KRW', rate)}, 차감 ${formatMoney('KRW', spread)})`;
src/engine/operations.ts:235:  if (config.rules.rulesVersion === 'M2a-rules-3') {
src/engine/operations.ts:266:      krwToUsdRequiredMinor: usdOldest && fx ? Math.ceil(usdShort / fx.lotUsdMinor) * fx.lotUsdMinor * (config.rules.rulesVersion === 'M2a-rules-3' ? exchangeAmounts(config, 'KRW_TO_USD', fx.lotUsdMinor, s.rng.seed, s.day).rate : fx.sellKrwPerUsd) / MINOR_PER_MAJOR.USD : null,
src/engine/reports.ts:104:  const risk = config.rules.rulesVersion === 'M2a-rules-3';
src/engine/reports.ts:139:    ...(risk && kind === 'DIRECT_TRADE' && config.operations?.risk?.layers.includes('SURCHARGE')
src/engine/risk.ts:25:  if (!o.risk.layers.includes('FX')) return rate;
src/engine/risk.ts:36:  return config.rules.rulesVersion === 'M2a-rules-3' && config.operations?.risk && side === 'BUY' ? 'KRW' : 'USD';
src/engine/risk.ts:59:  if (!risk?.layers.includes('TARIFF')) return [];
src/engine/risk.ts:84:  if (!risk?.layers.includes('TARIFF')) return [];
src/engine/risk.ts:111:  if (!risk?.layers.includes('SURCHARGE')) return 0;
src/engine/risk.ts:123:  if (!risk?.layers.includes('TARIFF')) return dutyEstimate(config, taxable);
src/engine/risk.ts:133:  if (!risk?.layers.includes('CLAIM')) return null;
src/engine/risk.ts:146:  if (!risk?.layers.includes('COLLECTION')) return { mode: 'ON_TIME', days: 0 };
src/engine/risk.ts:169:  c.rules.rulesVersion = 'M2a-rules-3';
src/engine/types.ts:14:export const SUPPORTED_RULES_VERSIONS = ['M1-rules-1', 'M2a-rules-1', 'M2a-rules-2', 'M2a-rules-3'] as const;
```

작업 후 같은 명령(새 시험 파일의 해당 문자열도 포함):

```text
src/engine/engine.ts:1054:      const surcharge = config.operations?.risk?.layers.includes('SURCHARGE')
src/engine/engine.ts:1205:    if (contract.kind !== 'DIRECT_TRADE' || !config.operations?.risk?.layers.includes('COLLECTION')) {
src/engine/m2a5-risk-cost.test.ts:59:  if (!cfg.operations?.risk?.layers.includes('TARIFF')) return [];
src/engine/m2a5-risk-cost.test.ts:78:  if (!cfg.operations?.risk?.layers.includes('SURCHARGE')) return 0;
src/engine/m2a5-risk-cost.test.ts:86:  if (!cfg.operations!.risk!.layers.includes('FX')) return r;
src/engine/m2a5-risk-cost.test.ts:96:  const rate = cfg.operations?.risk?.layers.includes('TARIFF')
src/engine/m2a5-risk-credit-v2.test.ts:53:    expect(isRiskRules('M2a-rules-3')).toBe(true); expect(isRiskRules('M2a-rules-4')).toBe(true);
src/engine/m2a5-risk-credit-v2.test.ts:103:  it.each(['M1-rules-1', 'M2a-rules-1', 'M2a-rules-2', 'M2a-rules-3'] as const)('%s는 BASE도 외상 지정 거절·키 없음', (version) => {
src/engine/m2a5-risk-credit-v2.test.ts:104:    const c = version === 'M2a-rules-3' ? withRiskLevel(base(), 'R1', loadRiskProfile('RISK_PROFILE_DEFAULT')) : base();
src/engine/m2a5-risk-credit-v2.test.ts:197:    expect(() => deserializeSave(text, { config: c3, dataVersion: c3.dataVersion, rulesVersion: 'M2a-rules-3' })).toThrow('이 시나리오의 규칙은 M2a-rules-3이며');
src/engine/m2a5-risk-credit.test.ts:47:  if (!cfg.operations?.risk?.layers.includes('TARIFF')) return [];
src/engine/m2a5-risk-credit.test.ts:66:  if (!cfg.operations?.risk?.layers.includes('SURCHARGE')) return 0;
src/engine/m2a5-risk-credit.test.ts:74:  if (!cfg.operations!.risk!.layers.includes('FX')) return r;
src/engine/m2a5-risk-credit.test.ts:84:  const rate = cfg.operations?.risk?.layers.includes('TARIFF')
src/engine/m2a5-risk-credit.test.ts:133:  if (!cfg.operations!.risk!.layers.includes('CLAIM')) return null;
src/engine/m2a5-risk-credit.test.ts:141:  if (!cfg.operations!.risk!.layers.includes('COLLECTION')) return { mode: 'ON_TIME', days: 0 };
src/engine/reports.ts:139:    ...(risk && kind === 'DIRECT_TRADE' && config.operations?.risk?.layers.includes('SURCHARGE')
src/engine/risk.ts:25:  if (!o.risk.layers.includes('FX')) return rate;
src/engine/risk.ts:59:  if (!risk?.layers.includes('TARIFF')) return [];
src/engine/risk.ts:84:  if (!risk?.layers.includes('TARIFF')) return [];
src/engine/risk.ts:111:  if (!risk?.layers.includes('SURCHARGE')) return 0;
src/engine/risk.ts:123:  if (!risk?.layers.includes('TARIFF')) return dutyEstimate(config, taxable);
src/engine/risk.ts:133:  if (!risk?.layers.includes('CLAIM')) return null;
src/engine/risk.ts:146:  if (!risk?.layers.includes('COLLECTION')) return { mode: 'ON_TIME', days: 0 };
src/engine/risk.ts:169:  c.rules.rulesVersion = 'M2a-rules-3';
src/engine/risk.ts:188:export const isRiskRules = (v: string): boolean => v === 'M2a-rules-3' || v === 'M2a-rules-4';
src/engine/types.ts:14:export const SUPPORTED_RULES_VERSIONS = ['M1-rules-1', 'M2a-rules-1', 'M2a-rules-2', 'M2a-rules-3', 'M2a-rules-4'] as const;
```

## V2 자료 전체

```json
{
  "id": "RISK_PROFILE_V2",
  "data_basis": "DESIGN",
  "status": "V2_START_2026-10-24",
  "basis": "fictional_game_values_not_calibrated",
  "fx": {
    "start_krw_per_usd": 1300,
    "step_bp": 275,
    "min_krw_per_usd": 1170,
    "max_krw_per_usd": 1430
  },
  "tariff": {
    "base": [
      {
        "country_code": "CN",
        "good_id": "APPAREL",
        "rate_bp": 500
      },
      {
        "country_code": "CN",
        "good_id": "COSMETICS",
        "rate_bp": 500
      },
      {
        "country_code": "VN",
        "good_id": "APPAREL",
        "rate_bp": 500
      },
      {
        "country_code": "VN",
        "good_id": "COSMETICS",
        "rate_bp": 500
      },
      {
        "country_code": "CN",
        "good_id": "SEASONED_LAVER",
        "rate_bp": 500
      },
      {
        "country_code": "VN",
        "good_id": "SEASONED_LAVER",
        "rate_bp": 500
      }
    ],
    "max_changes": 2,
    "lag_days": [
      0,
      3
    ],
    "step_bp": [
      -200,
      800
    ],
    "min_bp": 0,
    "max_bp": 3000,
    "basis": "fictional_uniform_equal_to_rules2_5pct",
    "status": "DESIGN_not_actual_destination_tariff"
  },
  "surcharge": {
    "p_zero_bp": 7000,
    "min_bp": 500,
    "max_bp": 3000
  },
  "claims": {
    "by_good": [
      {
        "good_id": "COSMETICS",
        "grade": "MID",
        "p_claim_bp": 1100
      },
      {
        "good_id": "APPAREL",
        "grade": "LOW",
        "p_claim_bp": 700
      },
      {
        "good_id": "SEASONED_LAVER",
        "grade": "LOW",
        "p_claim_bp": 700
      }
    ],
    "basis": "fictional_damage_grade",
    "minor": {
      "weight_bp": 8000,
      "min_bp": 100,
      "max_bp": 500
    },
    "major": {
      "weight_bp": 2000,
      "min_bp": 1500,
      "max_bp": 3000
    }
  },
  "collections": {
    "by_counterparty": [
      {
        "counterparty_id": "CUSTOMER_DEMO",
        "grade": "A"
      },
      {
        "counterparty_id": "CUSTOMER_SHA_APPAREL",
        "grade": "B"
      },
      {
        "counterparty_id": "CUSTOMER_HAI_COSMETICS",
        "grade": "C"
      },
      {
        "counterparty_id": "CUSTOMER_DEMO_SHANGHAI",
        "grade": "B"
      },
      {
        "counterparty_id": "CUSTOMER_HAI_COSMETICS_NEW",
        "grade": "A"
      },
      {
        "counterparty_id": "CUSTOMER_SHA_COSMETICS_NEW",
        "grade": "B"
      },
      {
        "counterparty_id": "CUSTOMER_HAI_LAVER",
        "grade": "C"
      },
      {
        "counterparty_id": "CUSTOMER_SHA_LAVER",
        "grade": "B"
      }
    ],
    "basis": "fictional_grade",
    "grades": [
      {
        "grade": "A",
        "p_on_time_bp": 8000,
        "p_late_bp": 1500,
        "p_partial_bp": 500,
        "p_default_bp": 200
      },
      {
        "grade": "B",
        "p_on_time_bp": 6500,
        "p_late_bp": 2500,
        "p_partial_bp": 1000,
        "p_default_bp": 500
      },
      {
        "grade": "C",
        "p_on_time_bp": 5000,
        "p_late_bp": 3500,
        "p_partial_bp": 1500,
        "p_default_bp": 1200
      }
    ],
    "partial_bp": 5000,
    "late_min_days": 5,
    "late_max_days": 15,
    "carry_bp_per_day": 3,
    "recovery_bp": 3000
  },
  "credit_terms": [
    {
      "id": "BASE",
      "days": 0,
      "factor_pct": 100,
      "premium_bp": 0
    },
    {
      "id": "D15",
      "days": 15,
      "factor_pct": 150,
      "premium_bp": 300
    },
    {
      "id": "D30",
      "days": 30,
      "factor_pct": 200,
      "premium_bp": 600
    }
  ],
  "credit_limit_unit_minor": 400000,
  "credit_limits": [
    {
      "grade": "A",
      "lots": 3,
      "limit_minor": 1200000
    },
    {
      "grade": "B",
      "lots": 2,
      "limit_minor": 800000
    },
    {
      "grade": "C",
      "lots": 1,
      "limit_minor": 400000
    }
  ]
}
```

## 시나리오별 등급·정확한 비대칭 제약·행별 한도 계산
아래 등급 표에서 (가)=M2A5_PYEONGTAEK, (나)=M2A5_PYEONGTAEK_COS, (다)=M2A5_PYEONGTAEK_COS_LAVER다. (나) 하이퐁 화장품도 V2에서는 A이며 새 시험이 단언한다. 한도 계산은 활성 rule_set 전체 SELL 행을 대상으로 한다. 금액은 센트다.

```text
D15 A/B/C 비용 0.00763, 0.019075, 0.04578 가산 0.03
D30 A/B/C 비용 0.01568, 0.0392, 0.09408 가산 0.06
M2A5_PYEONGTAEK APPAREL HAIPHONG 222156
M2A5_PYEONGTAEK COSMETICS HAIPHONG 383832
M2A5_PYEONGTAEK APPAREL SHANGHAI 213624
M2A5_PYEONGTAEK COSMETICS SHANGHAI 392472
등급 M2A5_PYEONGTAEK APPAREL HAIPHONG CUSTOMER_DEMO A
등급 M2A5_PYEONGTAEK APPAREL SHANGHAI CUSTOMER_SHA_APPAREL B
등급 M2A5_PYEONGTAEK COSMETICS HAIPHONG CUSTOMER_HAI_COSMETICS C
등급 M2A5_PYEONGTAEK COSMETICS SHANGHAI CUSTOMER_DEMO_SHANGHAI B
M2A5_PYEONGTAEK_COS COSMETICS HAIPHONG 383832
M2A5_PYEONGTAEK_COS COSMETICS SHANGHAI 392472
등급 M2A5_PYEONGTAEK_COS COSMETICS HAIPHONG CUSTOMER_HAI_COSMETICS_NEW A
등급 M2A5_PYEONGTAEK_COS COSMETICS SHANGHAI CUSTOMER_SHA_COSMETICS_NEW B
M2A5_PYEONGTAEK_COS_LAVER COSMETICS HAIPHONG 383832
M2A5_PYEONGTAEK_COS_LAVER COSMETICS SHANGHAI 392472
M2A5_PYEONGTAEK_COS_LAVER SEASONED_LAVER HAIPHONG 380592
M2A5_PYEONGTAEK_COS_LAVER SEASONED_LAVER SHANGHAI 393768
등급 M2A5_PYEONGTAEK_COS_LAVER COSMETICS HAIPHONG CUSTOMER_HAI_COSMETICS_NEW A
등급 M2A5_PYEONGTAEK_COS_LAVER COSMETICS SHANGHAI CUSTOMER_SHA_COSMETICS_NEW B
등급 M2A5_PYEONGTAEK_COS_LAVER SEASONED_LAVER HAIPHONG CUSTOMER_HAI_LAVER C
등급 M2A5_PYEONGTAEK_COS_LAVER SEASONED_LAVER SHANGHAI CUSTOMER_SHA_LAVER B
BASE sha256 fb3ee07c6cc7d1ffd1b0a9078a59b9bbc06b16a9d135c90e7cced959360122bd
변경 sha256 e4fa3308878696c08d169e289d3df588e925a77b77d7cfc9c7c17e97906cf4ca
d03 before sha256 fb3ee07c6cc7d1ffd1b0a9078a59b9bbc06b16a9d135c90e7cced959360122bd
```

## 0067b·0068 인계
```ts
creditTermCheck(s: GameState, config: ScenarioConfig, buyOfferId: string, sellOfferId: string,
  quantity: number, termId?: CreditTermId): CreditTermCheck
creditTermOptions(s: GameState, config: ScenarioConfig, buyOfferId: string, sellOfferId: string, quantity?: number)
```
- 반환 모양: Check는 allowed·reasonKo·saleAmountMinor·paymentDueDay·grade·limitMinor·exposureMinor·dateRule·limitBlocked. Options는 BASE/D15/D30 순서로 termId·allowed·reasonKo·saleAmountMinor·paymentDueDay·grade·limitMinor·exposureMinor만 낸다. 확률·조건 계수 없음.

```ts
export interface CreditProfile {
  profileId: string;
  terms: { id: CreditTermId; days: number; factorPct: number; premiumBp: number }[];
  limitUnitMinor: number;
  limits: { grade: string; lots: number; limitMinor: number }[];
  pDefaultBpByGrade: { grade: string; pDefaultBp: number }[];
  carryBpPerDay: number;
  recoveryBp: number;
}
```

- R4 추가 자리: risk.ts withRiskLevelV2의 level 공용체에 R4를 더하고 기존 withRiskLevel에는 R3를 넘긴 뒤 DEFAULT·CARRY 층을 덧붙인다. rules-3 함수와 R0P 변환은 유지한다.
- 향후 RiskContract의 creditTermId·creditEligible·saleAmountMinor 출처는 인수 시 기록한 Contract다. 등급은 config.operations.risk.profile.collections.byCounterparty에서 contract.customerId로 읽는다. Contract에는 별도 등급 복제 칸을 만들지 않았다. 한도는 credit.limits[].limitMinor다.
- factorPct·pDefaultBpByGrade·carryBpPerDay·recoveryBp는 이번에는 로드만 한다. 대손·이자·WRITTEN_OFF·원장·contractRiskReport 성분과 processCollections 동작은 바꾸지 않았다. 0067b가 이 경계에서 붙인다. 정책·실행기의 V2 선택은 0068 몫이다.

## 범위 밖 발견
- 변형 1에서 기존 골든 도구가 예상 종료 1 대신 탐침 오류 종료 2를 내는 차이. 도구·골든·기존 시험은 수정하지 않았다.

## 질문
- 변형 1의 기대를 “종료 1”에서 “결함을 탐지해 비정상 종료(현재 2)”로 정정할지 허브 검토가 필요하다. 구현은 끝냈으며 해당 기준을 임의로 통과 처리하지 않았다.
