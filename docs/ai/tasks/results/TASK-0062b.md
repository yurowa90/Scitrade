# TASK-0062b 결과
- 모델: GPT-6 (Codex; 실행 환경에서 세부 모델 ID 확인 불가)
- BASE: 3bcf48c50cac48a7acd03b1133bb307259c93643

## 바꾼 파일

- `tools/rules3_golden_lib.mjs` (1~44행): 위험 단계 포함 키·108회 집합·TSV·지문 형식·집합 검사·워커 분할. 0062a에서는 순수 함수 `hash`, `withoutMeta`만 가져온다.
- `tools/rules3_golden_entry.ts` (1~16행): 기존 엔진 값의 직접 재내보내기.
- `tools/check_rules3_golden.mjs` (1~184행): 비교·기록·덤프·워커·저장 왕복·프로필 원문/로더 구별·탐침.
- `tools/check_rules3_golden.test.mjs` (1~110행): node 시험.
- `tests/golden/rules3-risk.tsv` (1~111행): 골든 108줄.
- `tools/ai/review_checks.sh` (51~52행): 0062a 두 명령 바로 뒤에 새 비교·시험 두 줄 등록.
- `docs/ai/tasks/results/TASK-0062b.md`: 이 보고서.
- `MANIFEST.json`: `build_package.py --manifest-only`로 생성.

## 설계 판단 (지시서에 없던 결정과 이유)

- `execute(e, row, probes = true, quoteProbes = true)`를 내보내 시험과 일회용 범위 측정이 실제 검사기와 같은 경로를 사용한다. `probes=false`는 시험용 전체 탐침 해제이며 CLI에는 노출하지 않는다.
- 임시 덤프는 가장 가까운 기존 부모의 realpath까지 확인한다. 저장소 안으로 향하는 심볼릭 링크도 거부한다.
- 실행 집합은 자료의 시나리오 목록 확장과 무관하도록 지정된 세 ID·정책·2001~2003을 고정한다. 시작 시 모든 정책의 존재를 검사한다.
- 탐침은 값마다 `JSON.stringify`한 UTF-8 바이트를 호출 순서대로 하나의 SHA-256에 넣는다(0062a 방식). JSON 키를 정렬하거나 줄바꿈·구분자를 더하지 않는다.

### 골든 정의와 실제 호출

R3는 세 시나리오 × 6정책 × 3시드 = 54회, R0·R1·R2는 각각 세 시나리오 × 2정책 × 3시드 = 18회다. 모든 실행은 `withRiskLevel(withLateMode(loadScenario(row.scenarioId), 'base'), row.riskLevel, loadRiskProfile('RISK_PROFILE_DEFAULT'))`로 설정을 만들고 `simulate(config, policyById(row.policyId), row.seed, observe, row.riskLevel)`을 호출한다. R0도 다섯째 인수를 생략하지 않는다.

시나리오는 `SCENARIO_M2_OPERATIONS`·`SCENARIO_M2_OPS_COSMETICS`·`SCENARIO_M2_OPS_COS_LAVER`다. R3 정책은 `IDLE`·`NO_FX`·`MAX_CONTRIBUTION`·`LATE_OK`·`MARGIN_BUFFER`·`MAX_CONTRIBUTION~fx:react`이고 R0·R1·R2 정책은 `NO_FX`·`MAX_CONTRIBUTION`이다. 모든 시드는 2001·2002·2003이다.

`runHash = hash(run)`, `stateHash = hash(withoutMeta(state))`. 상태 로그를 포함하며 meta만 뺀다. 프로필 지문은 JSON 원문 항목과 `loadRiskProfile('RISK_PROFILE_DEFAULT')`를 각각 해시한다.

탐침의 `cfg = { ...config, seed: row.seed }`이며 실제 호출은 다음과 같다.

| 시점 | 호출 |
|---|---|
| day % 7 = 0 | 활성·진행 계약마다 `planState(opened, cfg, [{ id: 'GOLDEN-CANCEL', type: 'CANCEL_CONTRACT', contractId: c.id }])` |
| 같은 날 | `planState(opened, cfg, [{ id: 'GOLDEN-K2U', type: 'EXCHANGE_CURRENCY', direction: 'KRW_TO_USD', usdAmountMinor: cfg.operations.fx.lotUsdMinor }])` |
| 같은 날 | `paymentDefaultStatus(opened, cfg)`; USD·KRW 각각 `fundsPosition(opened, cfg, currency)`; `cashReservations(opened, cfg)`; `upcomingPayments(opened, cfg)`; `campaignSummary(opened, cfg)`; `marketTable(opened, cfg)`; 모든 계약의 `contractReport(opened, c)`; 양방향 `exchangePreview(opened, cfg, direction, cfg.operations.fx.lotUsdMinor)` |
| 같은 날 | 직접 무역 계약마다 `contractRiskReport(opened, cfg, c.id)`; `tariffSchedule(opened, cfg)`; `receivableSchedule(opened, cfg)`; `referenceRate(cfg, row.seed, opened.day)` |
| day % 7 = 1 | `openTradePairs(opened, cfg)` 순서대로 `quotePreview(opened, cfg, pair)` |
| 같은 날 | OPEN·주선·유효기간 안인 제안을 `offerDef(opened, cfg, id)`로 골라 ID 순서대로 `quotePreview(opened, cfg, { offerId })` |

계획 탐침은 `result.results`와 meta 제외 `result.state`를 넣고, 읽기 함수는 반환값을 넣는다. 원래 열린 상태에 계획 결과를 대입하지 않는다.

저장 왕복은 `serializeSave(state)` → `deserializeSave(text, { config, dataVersion: config.dataVersion, rulesVersion: config.rules.rulesVersion })` → `serializeSave(loaded)`의 문자열 동등성을 확인한다.

## 실행한 검증과 결과

- 작업 전: `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check 3bcf48c50cac48a7acd03b1133bb307259c93643`: 종료 0, **검사 16종, 실패 0종 (모드: 확인)**. 작업 트리 변화 없음 통과. Vitest 55파일, 1,510 통과·TODO 1.
- Node 22.22.0, ICU 77.1. 한국어 숫자 형식 확인 통과.
- 시제품 세 줄의 runHash·stateHash 여섯 값 모두 지시서와 일치했다. `git diff --stat 16dda93 <BASE> -- src data`도 빈 출력이다.

| 실행 | 결과 | 시간 |
|---|---|---:|
| `node tools/check_rules3_golden.mjs --write` | 종료 0, 108회 기록, 기본 워커 4개 | 55.431초 |
| `node tools/check_rules3_golden.mjs --workers 1` | 종료 0, 108회 일치 | 175.588초 |
| `node tools/check_rules3_golden.mjs --workers 4` | 종료 0, 108회 일치 | 54.058초 |
| `node --test tools/check_rules3_golden.test.mjs` | 종료 0, 파일 1개로 요약 | 41.479초 |
| `node tools/check_rules3_golden.test.mjs` | 종료 0, 개별 20개 통과 | 42.792초 |

개별 시험은 모두 30초 미만이다(최대 5.509초). 워커 1·4 비교는 서로 겹치지 않게 순서대로 측정했다.

- `python3 tools/build_package.py --manifest-only`: 786 source files, 통과. 새 파일 수용.
- `python3 tools/validate_data.py`: 25 data documents, 33,495 checks, 통과.
- 임시 계수기의 첫 수집은 검사기 워커 진입점과 충돌하여 결과 객체 수집에 실패했다. 측정 스크립트를 독립 node 프로세스 네 개로 바꾼 뒤 세 해시 108줄 일치와 범위 집계를 확인했다. 계수기는 저장소에 남기지 않는다.
- 변형 10개는 모두 기대를 충족했다.
- 작업 후 `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check 3bcf48c50cac48a7acd03b1133bb307259c93643`: 종료 0, **검사 18종, 실패 0종 (모드: 확인)**. N=16에서 정확히 두 종 추가했고 작업 트리 변화 없음 검사도 통과했다.
- 그 안에서 `npm run --silent typecheck` 통과, `npx vitest run` 55파일·1,510개 통과·기존 TODO 1(83.69초), `npm run --silent build`와 번들 크기 검사 통과. 복원된 트리에서 기존 골든 505회·새 골든 108회도 일치했다.
- Python 시험: 그림 21개, 지도 21개, 자료 검사기 138개, 사실 섞임 회귀 26개 통과. 브라우저 도구·번들 도구의 node 시험도 통과했다.
- `git diff --check` 및 새 mjs 세 파일의 `node --check` 통과.
- 최종 검수 출력을 붙인 뒤 `--manifest-only`·`validate_data`·`build_package.py --check`를 다시 실행해 통과했다(786파일, 33,495검사). 이 결과 문구 반영 뒤에도 같은 명령으로 다시 갱신·확인했다.

### 골든 파일 첫 세 줄

```text
# scitrade engine golden v1 (rules-3)
# profileRaw=f7a3df15eacf73b63a2b322f382e61dbbcac4ad920f22f73d4744e2d18b6da70 profileLoaded=bd7f3103a986a65eba6f19f676db5bda9ad569ac63d005ecd67d38882af6e56c ; 실행·meta 제외 마지막 상태·주간 탐침·공시일 견적 JSON sha256; node tools/check_rules3_golden.mjs --write
scenarioId	riskLevel	policyId	seed	runHash	stateHash	probeHash
```


### 변형 시험 10개

1~5b는 단계별 임시 부분 골든 네 개로 108회 전체를 비교했다. 아래 요약은 네 출력의 합계다. 원본 바이트를 임시 경로에 보관하고 각 변형 후 finally에서 복원했다. 변형 중 `--write`는 실행하지 않았다.

| 번호 | 변형 | 종료 | 실제 요약 | 판정 |
|---|---|---:|---|---|
| 1 | FX 보폭의 두 stepBp − 1 | 1 | `다른 줄 21개 (runHash 18, stateHash 18, probeHash 21)` | 기대 충족 |
| 2 | R2에서 SURCHARGE 제외 | 1 | `다른 줄 18개 (runHash 14, stateHash 14, probeHash 18)` | 기대 충족 |
| 3 | collectionPlan 지연 일수 + 1 | 1 | `다른 줄 38개 (runHash 38, stateHash 38, probeHash 38)` | 기대 충족 |
| 4 | contractRiskReport components.fx + 1 | 1 | `다른 줄 99개 (runHash 99, stateHash 0, probeHash 99)` | 기대 충족 |
| 5a | preview referenceEstimate.saleKrw + 1 | 1 | `다른 줄 90개 (runHash 0, stateHash 0, probeHash 90)` | 기대 충족 |
| 5b | preview 주선 referenceEstimate.pnlKrw + 1 | 1 | `다른 줄 90개 (runHash 0, stateHash 0, probeHash 90)` | 기대 충족 |
| 6 | 원문 DEFAULT.fx.step_bp + 1 | 2 | `위험 프로필 RISK_PROFILE_DEFAULT 원문 자료가 골든과 다릅니다` | 기대 충족 |
| 7 | deserializeSave의 rules-3 반환 직전 state.log 삭제 | 1 | `["SCENARIO_M2_OPERATIONS","R1","NO_FX",2001] 저장 왕복 실패: 저장 바이트가 달라졌습니다` | 기대 충족 |
| 8 | 기본 골든 첫 자료 줄 삭제 | 2 | `골든 실행 집합 불일치` | 기대 충족 |
| 9 | 5a·3 각각의 변형 상태에서 0062a 검사 | 둘 다 0 | `엔진 골든 일치: rules-2 105회, rules-1 400회` | 기대 충족 |

단계별 수치는 `(다른 줄, runHash, stateHash, probeHash)`다.

| 변형 | R0 | R1 | R2 | R3 |
|---|---|---|---|---|
| 1 | (0, 0, 0, 0) | (3, 3, 3, 3) | (3, 3, 3, 3) | (15, 12, 12, 15) |
| 2 | (0, 0, 0, 0) | (0, 0, 0, 0) | (18, 14, 14, 18) | (0, 0, 0, 0) |
| 3 | (0, 0, 0, 0) | (0, 0, 0, 0) | (0, 0, 0, 0) | (38, 38, 38, 38) |
| 4 | (18, 18, 0, 18) | (18, 18, 0, 18) | (18, 18, 0, 18) | (45, 45, 0, 45) |
| 5a | (0, 0, 0, 0) | (18, 0, 0, 18) | (18, 0, 0, 18) | (54, 0, 0, 54) |
| 5b | (0, 0, 0, 0) | (18, 0, 0, 18) | (18, 0, 0, 18) | (54, 0, 0, 54) |

- 1: R0 18줄 세 해시 불변. 2: R0·R1·R3 불변. 3: R0·R1·R2 불변.
- 4: 108줄의 stateHash 모두 불변. R0 18줄에서도 runHash·probeHash 변화를 검출했다.
- 5a·5b: 모든 runHash·stateHash 불변. 공시일 탐침을 끈 R3 두 표본의 A/B `.hashes.json`을 바이트 비교해 두 변형 모두 세 해시 전부 같음을 확인했다. 이 모드의 비교 종료 0/1은 판정에 쓰지 않았다.
- 6·8: 실행 횟수·워커 줄 없이 종료 2. 7: 마지막 상태의 log 누락으로 저장 왕복 실패(종료 1). 저장 예외·입력 오류는 해시 차이 요약을 만들지 않는다.
- 9: 5a·3의 변형을 유지한 상태에서 각각 기존 검사기를 실행했다. 위험 분기 변경이 rules-2에 새지 않았으며 새 골든은 같은 상태에서 차이를 검출했다.
- 변형 전부 복원 후 `git diff --stat -- src data schemas`와 `git diff --stat <BASE> -- src data schemas` 모두 빈 출력. 0062a 보호 파일 여섯도 BASE 대비 차이 없음.

## 범위 보고

108회를 같은 `execute`로 다시 돌리며 임시 계수기를 넣었다. 계수기 실행의 세 해시도 골든 108줄과 모두 일치했으며 측정 뒤 원본 바이트로 복원했다. 계수에는 정책·탐침·저장 불변식 검사가 포함된다.

### ① R3 직접 무역 계약의 0이 아닌 위험 성분 수

| 성분 | (가) OPERATIONS | (나) COSMETICS | (다) COS_LAVER | 합 |
|---|---:|---:|---:|---:|
| fx | 151 | 81 | 95 | 327 |
| tariff | 8 | 4 | 7 | 19 |
| surcharge | 39 | 22 | 20 | 81 |
| claim | 6 | 6 | 2 | 14 |
| late | 24 | 11 | 18 | 53 |
| collection | 51 | 28 | 34 | 113 |

각 성분은 세 시나리오 모두 0이 아니다.

### ② 명령 종류

| EngineCommand | APPLIED 합계 |
|---|---:|
| START_CULTURE_ACTIVITY | 0 |
| START_TRAINING | 0 |
| SCOUT_SITE | 0 |
| START_RECRUIT_QUEST | 0 |
| HIRE_CANDIDATE | 0 |
| ACCEPT_TRADE | 801 |
| ACCEPT_FORWARDING | 2040 |
| ASSIGN_TASK | 1413 |
| BOOK_SAILING | 0 |
| CANCEL_CONTRACT | 0 |
| RESPOND_TO_DELAY | 0 |
| EXCHANGE_CURRENCY | 4237 |
| EXPAND_WAREHOUSE | 0 |
| SIGN_SPACE_CONTRACT | 0 |

탐침의 APPLIED는 정책 명령 수에 합치지 않았다.

### ③ 명령이 아닌 경로

| 경로 | 합계 |
|---|---:|
| USD_TO_KRW 횟수 | 4237 |
| USD_TO_KRW usdMinor | 199530000 |
| USD_TO_KRW krwMinor | 2547539000 |
| KRW_TO_USD 횟수 | 0 |
| KRW_TO_USD usdMinor | 0 |
| KRW_TO_USD krwMinor | 0 |
| 취소 계약 | 0 |
| 실패 실행 R0 | 9 |
| 실패 실행 R1 | 9 |
| 실패 실행 R2 | 9 |
| 실패 실행 R3 | 18 |

### ④ 탐침 호출 수

| 단계 | 취소 APPLIED | 원화→달러 APPLIED | contractRiskReport | 무역 quotePreview | 주선 quotePreview |
|---|---:|---:|---:|---:|---:|
| R0 | 378 | 180 | 670 | 339 | 1129 |
| R1 | 290 | 126 | 767 | 248 | 805 |
| R2 | 289 | 126 | 730 | 248 | 805 |
| R3 | 1099 | 427 | 2216 | 941 | 3076 |
| 합 | 2056 | 859 | 4383 | 1776 | 5815 |

### ⑤ 위험 분기 도달표

위치는 BASE의 줄 번호다. 조건식이 실제 평가되어 위험 판본 또는 층 포함 조건이 참인 횟수다. 부정 조기 반환은 그 반대인 위험 경로를 센다. `withRiskLevel`의 판본 대입은 실행 횟수다. 단락 평가 때문에 앞 조건이 거짓이면 뒤 위험 조건을 세지 않는다.

| 위치 | 위험 조건/층 | 횟수 | 0인 경로의 기존 단위 시험 |
|---|---|---:|---|
| `risk.ts:25` | FX | 495207 |  |
| `risk.ts:36` | rules-3 + risk 있음 + BUY | 12697 |  |
| `risk.ts:59` | TARIFF | 62384 |  |
| `risk.ts:84` | TARIFF | 6003 |  |
| `risk.ts:111` | SURCHARGE | 503 |  |
| `risk.ts:123` | TARIFF | 56381 |  |
| `risk.ts:133` | CLAIM | 371 |  |
| `risk.ts:146` | COLLECTION | 1622 |  |
| `risk.ts:169` | rules-3 판본 | 90 |  |
| `reports.ts:104` | rules-3 판본 | 31798 |  |
| `reports.ts:139` | SURCHARGE | 11253 |  |
| `engine.ts:309` | rules-3 판본 | 5015 |  |
| `engine.ts:995` | SURCHARGE | 503 |  |
| `engine.ts:1146` | COLLECTION | 1622 |  |
| `operations.ts:154` | rules-3 판본 | 30589 |  |
| `operations.ts:183` | rules-3 판본 | 10933 |  |
| `operations.ts:235` | rules-3 판본 | 17594 |  |
| `operations.ts:266` | rules-3 판본 | 0 | `src/engine/m2a5-risk-fx.test.ts:318` — `묶음 계산은 상태 날짜의 양방향 환율과 정확히 같다` (342행 USD 회복 필요액 단언) |
| `operations-invariants.ts:79` | rules-3 판본 | 30343 |  |
| `operations-invariants.ts:87` | rules-3 판본 | 168782 |  |
| `types.ts:14` | SUPPORTED_RULES_VERSIONS의 문자열 목록 | 해당 없음 | 실행 분기가 아닌 정적 지원 판본 선언 |

**TASK-0067 인계 조건:** `operations.ts:266` 도달 0을 보완하는 `m2a5-risk-fx.test.ts`의 위 시험과 USD 회복 필요액 기대값은 바꾸지 않는다.

### ⑥ 걸린 시간

검증 결과의 워커별 시간 표를 참조한다.

## 완료 조건 대조

| 완료 조건 | 판정·근거 |
|---|---|
| 1. BASE 대비 src/data/schemas 및 0062a 여섯 파일 불변 | 충족: 임시 변형·계수기 복원 후 diff가 비어 있음 |
| 2. 비교 0·시험·시제품·변형 | 충족: 워커 1/4 각각 108회 일치, 20개 시험, 시제품 여섯 해시 일치, 변형 10개 기대 충족 |
| 3. 검수 등록 및 N+2종 실패 0 | 충족: 두 줄 등록, 작업 전 16종 → 작업 후 18종, 실패 0종·작업 트리 불변 통과 |
| 4. 결과 보고 | 이 파일 |

## 범위 밖 발견

`types.ts:14`는 문자열 분기가 아니라 지원 판본 목록 선언이다. 도달 횟수를 임의로 실행 108회로 세지 않고 표에서 해당 없음으로 표시했다. `node --test`는 기존 0062a와 마찬가지로 파일 단위로 요약하므로 개별 시험 출력도 별도로 수집했다.

## 질문

없음.

## TASK-0067 진단 절차

1. 작업 전에 `node tools/check_rules3_golden.mjs`가 종료 0인지 확인한다.
2. `node tools/check_rules3_golden.mjs --dump /tmp/rules3-before`로 기준 덤프를 만든다.
3. 변경 뒤 깨지면 `node tools/check_rules3_golden.mjs --dump /tmp/rules3-after`를 실행한다.
4. `diff -ru /tmp/rules3-before /tmp/rules3-after`로 실행별 run·state 차이를 찾는다. 탐침만 다르면 주간 읽기·취소·환전과 공시일 무역·주선 견적을 구분해서 확인한다.
5. 원문 지문 불일치는 자료 변경(종료 2), 로더만 다르면 엔진 변경(비교 계속, 최종 종료 1)이다. 변경 중에는 골든을 다시 쓰지 않는다.

## 새 node 시험 개별 출력

```text
TAP version 13
# Subtest: 부분 집합 두 실행이 일치한다
ok 1 - 부분 집합 두 실행이 일치한다
  ---
  duration_ms: 5508.943843
  type: 'test'
  ...
# Subtest: stateHash 한 글자 변경을 찾는다
ok 2 - stateHash 한 글자 변경을 찾는다
  ---
  duration_ms: 5062.183594
  type: 'test'
  ...
# Subtest: runHash 한 글자 변경을 찾는다
ok 3 - runHash 한 글자 변경을 찾는다
  ---
  duration_ms: 4823.436056
  type: 'test'
  ...
# Subtest: probeHash 한 글자 변경을 찾는다
ok 4 - probeHash 한 글자 변경을 찾는다
  ---
  duration_ms: 4685.323265
  type: 'test'
  ...
# Subtest: 묶음 밖 정책을 실행 전에 거부한다
ok 5 - 묶음 밖 정책을 실행 전에 거부한다
  ---
  duration_ms: 166.22914
  type: 'test'
  ...
# Subtest: 중복 줄을 거부한다
ok 6 - 중복 줄을 거부한다
  ---
  duration_ms: 182.861195
  type: 'test'
  ...
# Subtest: 16진수가 아닌 해시를 거부한다
ok 7 - 16진수가 아닌 해시를 거부한다
  ---
  duration_ms: 207.782653
  type: 'test'
  ...
# Subtest: 깨진 머리 줄을 거부한다
ok 8 - 깨진 머리 줄을 거부한다
  ---
  duration_ms: 144.010292
  type: 'test'
  ...
# Subtest: 저장소 안 dump와 링크를 거부한다
ok 9 - 저장소 안 dump와 링크를 거부한다
  ---
  duration_ms: 349.21699
  type: 'test'
  ...
# Subtest: 임시 경로에 실행·상태 파일 네 개를 쓴다
ok 10 - 임시 경로에 실행·상태 파일 네 개를 쓴다
  ---
  duration_ms: 4684.264845
  type: 'test'
  ...
# Subtest: 기본 집합은 누락·추가를 모두 거부한다
ok 11 - 기본 집합은 누락·추가를 모두 거부한다
  ---
  duration_ms: 1.142195
  type: 'test'
  ...
# Subtest: 워커 1개와 4개 분할은 같은 실행 집합을 보존한다
ok 12 - 워커 1개와 4개 분할은 같은 실행 집합을 보존한다
  ---
  duration_ms: 2.829078
  type: 'test'
  ...
# Subtest: 실행 집합은 위험 단계를 키에 넣고 108회를 고정한다
ok 13 - 실행 집합은 위험 단계를 키에 넣고 108회를 고정한다
  ---
  duration_ms: 0.899795
  type: 'test'
  ...
# Subtest: 탐침 불변·호출: ["SCENARIO_M2_OPERATIONS","R0","MAX_CONTRIBUTION",2001]
ok 14 - 탐침 불변·호출: ["SCENARIO_M2_OPERATIONS","R0","MAX_CONTRIBUTION",2001]
  ---
  duration_ms: 3699.042263
  type: 'test'
  ...
# Subtest: 탐침 불변·호출: ["SCENARIO_M2_OPS_COS_LAVER","R3","MAX_CONTRIBUTION",2001]
ok 15 - 탐침 불변·호출: ["SCENARIO_M2_OPS_COS_LAVER","R3","MAX_CONTRIBUTION",2001]
  ---
  duration_ms: 3827.753493
  type: 'test'
  ...
# Subtest: 형식 검사는 빈 자료·CRLF·끝 LF 누락·정렬 오류를 거부한다
ok 16 - 형식 검사는 빈 자료·CRLF·끝 LF 누락·정렬 오류를 거부한다
  ---
  duration_ms: 0.728255
  type: 'test'
  ...
# Subtest: R4는 형식 오류다
ok 17 - R4는 형식 오류다
  ---
  duration_ms: 193.964443
  type: 'test'
  ...
# Subtest: profileRaw 지문 변경을 구별한다
ok 18 - profileRaw 지문 변경을 구별한다
  ---
  duration_ms: 182.053314
  type: 'test'
  ...
# Subtest: profileLoaded 지문 변경을 구별한다
ok 19 - profileLoaded 지문 변경을 구별한다
  ---
  duration_ms: 5157.953895
  type: 'test'
  ...
# Subtest: 공시일 탐침 생략은 별도 골든과 dump가 필요하다
ok 20 - 공시일 탐침 생략은 별도 골든과 dump가 필요하다
  ---
  duration_ms: 3897.007381
  type: 'test'
  ...
1..20
# tests 20
# suites 0
# pass 20
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 42792.223601
```

## 전체 검수 실제 출력

아래 출력은 이 검수 출력을 보고서에 붙이기 전의 스냅숏이다. BASE 대비 변경 요약의 `docs/ai/tasks/README.md`와 지시서 파일은 작업 시작 전에 있던 지시서 커밋의 변경이며 이번 작업에서 고치지 않았다. 커밋·푸시·브랜치 전환은 하지 않았다.

```text
▶ python3 tools/build_package.py --check
MANIFEST 일치: 786개 파일
  통과
▶ python3 tools/validate_data.py
PASS: 25 data documents; 33495 structural/reference/arithmetic checks
46 acceptance specifications included (38 core + 8 character); linked by file and test name: 33 core and 3 character to engine tests, 3 to screen tests. This validator checks that those files and names exist; it does not run them (npx vitest run).
Unlinked specifications: 5 core, 5 character. Curriculum: 0 P0 item links without a P0 label remain on the pending list (not approved exceptions).
Game fixtures are DESIGN; ECB sample is OBSERVED_AND_DERIVED and import-only.
Economic calibration and playtesting are pending.
  통과
▶ npm run --silent typecheck
  통과
▶ npx vitest run

 RUN  v5.0.3 /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/wt-TASK-0062b


 Test Files  55 passed (55)
      Tests  1510 passed | 1 todo (1511)
   Start at  01:58:44
   Duration  83.69s (tests 93%, import 5%, transform 2%)

  통과
▶ npm run --silent build
vite v8.3.2 building client environment for production...
transforming...
✓ 72 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          0.65 kB │ gzip:  0.39 kB
dist/assets/situation-ozWJx7B5.css       4.55 kB │ gzip:  1.52 kB
dist/assets/index-PyOA8qhK.css          28.94 kB │ gzip:  7.33 kB
dist/assets/culture-panel-DgtWg7QJ.js   14.07 kB │ gzip:  5.50 kB
dist/assets/ops-screens-CYGZzw-f.js     17.21 kB │ gzip:  7.04 kB
dist/assets/situation-9S_kOMGe.js       32.35 kB │ gzip: 11.38 kB
dist/assets/data-DKCewi9e.js           141.53 kB │ gzip: 29.57 kB
dist/assets/index-XzQ-9pzl.js          283.00 kB │ gzip: 94.09 kB

✓ built in 539ms
  통과
▶ node tools/check_bundle_size.mjs dist
JS 청크 5개 (하나에 500,000 B 이하):
  assets/culture-panel-DgtWg7QJ.js 14,070 B, gzip 5,480 B — 나중에 받음
  assets/data-DKCewi9e.js 141,535 B, gzip 29,320 B — 첫 화면
  assets/index-XzQ-9pzl.js 283,001 B, gzip 93,290 B — 첫 화면
  assets/ops-screens-CYGZzw-f.js 17,211 B, gzip 7,005 B — 나중에 받음
  assets/situation-9S_kOMGe.js 32,352 B, gzip 11,271 B — 나중에 받음
첫 화면 JS·CSS 3개: 453,478 B (한도 600,000 B), gzip 129,899 B (한도 140,000 B)
글꼴: 스타일시트 1개 173,953 B + 글꼴 파일 378개 3,995,288 B = 4,169,241 B (한도 5,000,000 B). 첫 화면 합계에 넣지 않는다
판정: 통과
  통과
▶ node tools/check_rules2_golden.mjs
Node 22.22.0, ICU 77.1
rules-2: 105회, 워커 4개, 41.867초
rules-1: 400회, 워커 4개, 7.565초
엔진 골든 일치: rules-2 105회, rules-1 400회
  통과
▶ node --test tools/check_rules2_golden.test.mjs
TAP version 13
# Subtest: tools/check_rules2_golden.test.mjs
ok 1 - tools/check_rules2_golden.test.mjs
  ---
  duration_ms: 19142.307855
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 19149.559892
  통과
▶ node tools/check_rules3_golden.mjs
Node 22.22.0, ICU 77.1
rules-3: 108회, 워커 4개, 53.003초
rules-3 골든 일치: 108회
  통과
▶ node --test tools/check_rules3_golden.test.mjs
TAP version 13
# Subtest: tools/check_rules3_golden.test.mjs
ok 1 - tools/check_rules3_golden.test.mjs
  ---
  duration_ms: 41472.234035
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 41478.818395
  통과
▶ python3 tools/art/test_pixel_tools.py
..................../usr/lib/python3.11/unittest/mock.py:1189: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.
  result = effect(*args, **kwargs)
.
----------------------------------------------------------------------
Ran 21 tests in 2.219s

OK
  통과
▶ python3 -m unittest discover -s scripts -p test_*.py
.....................
----------------------------------------------------------------------
Ran 21 tests in 22.242s

OK
  통과
▶ python3 tools/test_validate_data.py
..........................................................................................................................................
----------------------------------------------------------------------
Ran 138 tests in 6.940s

OK
  통과
▶ python3 tools/check_fact_mixing.py
PASS: 사실 섞임 검사 — 자료 25개, 문장 8880개, 사실 표지 53개, 허용 목록 8건 모두 사용
  통과
▶ python3 tools/test_check_fact_mixing.py
..........................
----------------------------------------------------------------------
Ran 26 tests in 2.123s

OK
  통과
▶ node --test tools/browser/lib.test.mjs
TAP version 13
# Subtest: tools/browser/lib.test.mjs
ok 1 - tools/browser/lib.test.mjs
  ---
  duration_ms: 781.600794
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 789.587579
  통과
▶ node --test tools/check_bundle_size.test.mjs
TAP version 13
# Subtest: tools/check_bundle_size.test.mjs
ok 1 - tools/check_bundle_size.test.mjs
  ---
  duration_ms: 581.59335
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 589.099756
  통과
▶ 작업 트리 변화 없음
  통과
검사 18종, 실패 0종 (모드: 확인)

변경 요약 (기준: 3bcf48c50cac48a7acd03b1133bb307259c93643):
 MANIFEST.json                             | 42 ++++++++++++++++++++++++++-----
 docs/ai/tasks/README.md                   |  1 +
 docs/ai/tasks/TASK-0062b-rules3-golden.md |  2 +-
 tools/ai/review_checks.sh                 |  2 ++
 4 files changed, 40 insertions(+), 7 deletions(-)
?? docs/ai/tasks/results/TASK-0062b.md
?? tests/golden/rules3-risk.tsv
?? tools/check_rules3_golden.mjs
?? tools/check_rules3_golden.test.mjs
?? tools/rules3_golden_entry.ts
?? tools/rules3_golden_lib.mjs
```

## 최종 갱신 결과

```text
python3 tools/build_package.py --manifest-only
Manifest refreshed: 786 source files
python3 tools/validate_data.py
PASS: 25 data documents; 33495 structural/reference/arithmetic checks
python3 tools/build_package.py --check
MANIFEST 일치: 786개 파일
```

보호 파일의 BASE 대비 diff와 `git diff --stat -- src data schemas`는 모두 빈 출력이며, `git diff --check`도 통과했다.
