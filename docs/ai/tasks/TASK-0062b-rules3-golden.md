# TASK-0062b 엔진 골든: 위험 규칙(rules-3) 실행 결과·마지막 상태·읽기 탐침을 해시로 고정 (엔진 변경 없음)

- 지위: **초안(세션 A, 2026-10-24). 허브 사전 확인 전이다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- 선행: 개발 브랜치 머리. 이 지시서를 넣은 커밋의 부모를 `<BASE>`로 쓴다.
  - 구하는 법: `git log -1 --format=%P -- docs/ai/tasks/TASK-0062b-rules3-golden.md`
  - 결과가 비었거나 해시가 둘 이상이면 작업하지 말고 멈춰 보고한다. 결과는 `git rev-parse HEAD^`와 같아야 한다.
  - 결과 보고의 `- 모델:` 줄 바로 아래에 `- BASE: <해시>`를 적는다.
- 근거
  - 경로 3 판본 2 승인(H25), 설계 `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md` 3절 1·2(‘rules-1·2·3의 동작·출력·저장은 바이트로 같다’, ‘rules-3 골든을 먼저 둔다’)
  - 같은 꼴의 앞선 도구: TASK-0062a(`tools/check_rules2_golden.mjs`, 결과 `docs/ai/tasks/results/TASK-0062a.md`)
  - 세션 A의 시제품 실측(2026-10-24, 아래 ‘시제품 측정값’)
- 순서: TASK-0062b → TASK-0067(rules-4 엔진) → TASK-0068(실행기 v2). 허브가 이 결과를 병합한 커밋이 TASK-0067의 기준이 된다.

## 왜 필요한가

- TASK-0067은 위험 분기를 `'M2a-rules-3'` 문자열에서 술어 `isRiskRules(v)`로 바꾼다. 대상은 `risk.ts`, `reports.ts`, `engine.ts`, `operations.ts`, `operations-invariants.ts`, `types.ts`다(DESIGN-v2 3절 3).
  - 또 계약·청구서·원장 모양, 수금 경로, 매출채권 불변식, `contractRiskReport`, 저장 모양을 넓힌다.
- 이때 rules-3의 동작·출력·저장은 바뀌면 안 된다. 그러나 지금 이것을 지키는 장치가 없다.
  - TASK-0062a 골든은 rules-1·rules-2만 덮는다.
  - 판본 1 측정(경로 5)의 결과 파일은 측정 기록이고, 비교 도구가 아니다.
- 그래서 rules-3 실행의 결과, 마지막 상태, 읽기 탐침, 저장 왕복을 해시로 고정한다. 0062a와 같은 꼴이다.

## 원칙

- 엔진·자료·스키마·화면(`src/**`, `data/**`, `schemas/**`)은 고치지 않는다.
  - 바꾸는 것은 새 도구, 새 시험, 골든 파일, 그리고 `tools/ai/review_checks.sh` 한 곳뿐이다.
  - 변형 시험 때 임시로 고친 것은 반드시 되돌린다.
- **0062a 파일은 고치지 않는다**: `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tests/golden/rules1-run.tsv`, `tests/golden/rules2-d03.tsv`.
  - 새 도구는 0062a 라이브러리의 순수 함수 가운데 **`hash`와 `withoutMeta`만** import해서 쓴다. 나머지(키, 정렬, 해석, 직렬화, 집합 검사, 워커 분할)는 키에 위험 단계가 들어가므로 새 라이브러리에 둔다.
- 골든 파일은 이 작업 트리, 곧 `<BASE>`의 코드와 자료로 만든다.
- **시드는 2001 이상만 쓴다**(허브 요청). 판본 1·2의 측정 시드(1001~1180)는 쓰지 않는다.
- 검사기는 비교 모드에서 저장소 안에 파일을 쓰지 않는다. 임시 파일은 `os.tmpdir()` 아래에만 쓴다.
- 탐침은 실행을 바꾸지 않는다. 탐침이 있든 없든 `runHash`·`stateHash`는 같아야 한다.
- 커밋·푸시·브랜치 전환은 하지 않는다(공통 규칙).

## 구현 지시

### 1. 파일 구성

| 파일 | 내용 |
|---|---|
| `tools/rules3_golden_lib.mjs` | 순수 함수만 둔다. vite를 부르지 않는다. 키·정렬·TSV 해석·직렬화·형식 검사·실행 집합(`executionSet`)·집합 대조·워커 분할. `hash`·`withoutMeta`는 `./rules2_golden_lib.mjs`에서 import한다 |
| `tools/rules3_golden_entry.ts` | 기존 엔진 함수의 값만 `export { … } from`으로 다시 내보낸다. 타입은 `export type`으로만. tsc·vitest 범위 밖이다 |
| `tools/check_rules3_golden.mjs` | 명령 진입점이자 워커 진입점. 실행 본체 규칙은 0062a 1절과 같다(`isMainThread && import.meta.main` 또는 `!isMainThread`, `runnerImport`는 `{ configFile: false, logLevel: 'error' }`) |
| `tools/check_rules3_golden.test.mjs` | `node --test` 시험(6절) |
| `tests/golden/rules3-risk.tsv` | 골든 파일 |

### 2. 골든 묶음 하나(90회)

**설정**(실행마다)
- `config = withRiskLevel(withLateMode(loadScenario(scenarioId), 'base'), level, loadRiskProfile('RISK_PROFILE_DEFAULT'))`
  - `runD03`(`src/engine/sim/d03.ts:66-67`)과 같은 변환이다. 다른 점은 프로필을 `riskProfiles()[0]`이 아니라 **ID로 고르는 것**이다. TASK-0067이 `data/market_rules.json`에 `RISK_PROFILE_V2`를 더해도 대상이 바뀌지 않게 하려는 것이다.
- 실행: `simulate(config, policyById(policyId), seed, observe, level)`. 다섯째 인수 `level`은 `runD03`과 같다.

**실행 집합**

| 부분 | 시나리오 | 위험 단계 | 정책 | 시드 | 회수 |
|---|---|---|---|---|---:|
| 전체 위험 | (가)(나)(다) 셋 | R3 | `IDLE`, `NO_FX`, `MAX_CONTRIBUTION`, `LATE_OK`, `MARGIN_BUFFER`, `MAX_CONTRIBUTION~fx:react` | 2001~2003 | 54 |
| 층 경계 | (가)(나)(다) 셋 | R1, R2 | `NO_FX`, `MAX_CONTRIBUTION` | 2001~2003 | 36 |

- 시나리오 ID: `SCENARIO_M2_OPERATIONS`(가), `SCENARIO_M2_OPS_COSMETICS`(나), `SCENARIO_M2_OPS_COS_LAVER`(다).
- 정책 이름은 모두 `d03PolicyIds('base')` 또는 `ACCEPTANCE_IDS`에서 `policyById`가 찾는 이름이어야 한다. 하나라도 `policyById`가 `undefined`를 내면 종료 코드 2다.

**고른 근거**(결과 보고에 그대로 옮기지 않아도 된다)
- **시나리오 셋 모두.** 판본 1 측정이 세 변형 모두를 rules-3로 돌렸고, TASK-0067의 술어화는 세 변형에 다 닿는다. 품목·거래처 조합이 달라 위험 성분 경로가 다르다(시제품: (다)만 조미김 관세·클레임 행이 있다).
- **R3 × 6정책.** R3는 위험 층 다섯(`FX`·`TARIFF`·`SURCHARGE`·`CLAIM`·`COLLECTION`)을 모두 켠다.
  - 정책 넷은 0062a와 같다: `IDLE`(거래 없음, 실패 경로), `NO_FX`(환전 없음, 실패 경로), `MAX_CONTRIBUTION`(기준 회사), `LATE_OK`(늦은 수락).
  - `MARGIN_BUFFER`는 rules-3 전용 정책 분기다(`operations-policy.ts:142`, TASK-0066).
  - `MAX_CONTRIBUTION~fx:react`는 환율 반응 경로다.
  - `FOCUS`는 뺀다. `MAX_CONTRIBUTION`에 품목 걸러 내기만 더한 분기다(`operations-policy.ts:143`).
- **R1·R2 × 2정책.** 층 켜기·끄기 분기(`layers.includes(...)`)를 지킨다. TASK-0067 술어화에서 가장 깨지기 쉬운 자리다. 위험 성분이 생기는 `MAX_CONTRIBUTION`과, 실패하는 `NO_FX`를 둔다.
- **R0는 넣지 않는다.** R0는 rules-2 그대로이고(`withRiskLevel`이 설정을 바꾸지 않는다) 0062a가 덮는다.
- **시드 2001~2003.** 시제품에서 세 시드만으로 R3 위험 성분이 시나리오마다 모두 0이 아니었다(아래 표). 실행 시간도 0062a(rules-2 105회)와 비슷하다.

### 3. 해시

- 해시 정의는 0062a 3절과 같다. 모든 해시는 JSON 문자열 UTF-8 바이트의 sha256, 소문자 16진 64자다.
  - `runHash` = sha256(`JSON.stringify(run)`)
  - `stateHash` = sha256(`JSON.stringify(rest)`), `const { meta, ...rest } = state`. 키를 다시 정렬하지 않는다. 로그도 넣는다.
- `probeHash`: `observe(opened)`에서 만든다. 설정은 `cfg = { ...config, seed }`다. 탐침은 `planState`와 읽기 함수만 부르고 `opened`를 바꾸지 않는다.
  - **`opened.day % 7 === 0`인 날**: 0062a 3절의 탐침 1~3을 그대로 한다(취소 `planState`, 원화→달러 `planState`, 읽기 함수 8종). 그다음 아래 rules-3 읽기를 더한다.
    1. 모든 직접 무역 계약의 `contractRiskReport(opened, cfg, c.id)`
    2. `tariffSchedule(opened, cfg)`
    3. `receivableSchedule(opened, cfg)`
    4. `referenceRate(cfg, seed, opened.day)`
  - **`opened.day % 7 === 1`인 날**(공시일): `openTradePairs(opened, cfg)`의 모든 짝마다 `quotePreview(opened, cfg, pair)`의 결과를 넣는다.
    - rules-3의 견적 미리보기 분기(`reports.ts:104`)를 지키기 위해서다. 0062a는 비싸서 뺐지만 rules-3 시제품에서는 한 번에 약 2.5밀리초였다.
    - `day % 7 === 0`에는 열린 짝이 없다(공시 유효 3일). 그래서 날을 따로 둔다.
  - 함수마다 서명은 지금 코드를 그대로 따르고, 결과 보고에 실제로 부른 꼴을 적는다.
- **저장 왕복**: 0062a 3절과 같다(`serializeSave` → `deserializeSave(text, { config, dataVersion: config.dataVersion, rulesVersion: config.rules.rulesVersion })` → `serializeSave`, 바이트 같음). 다르거나 예외면 그 줄과 이유를 출력하고 종료 코드 1이다.
- **프로필 지문**: 시작할 때 `profileHash = sha256(JSON.stringify(loadRiskProfile('RISK_PROFILE_DEFAULT')))`를 구한다.
  - 골든 파일 둘째 줄에 적힌 값과 다르면 시뮬레이션 전에 종료 코드 2를 낸다. 메시지: `위험 프로필 RISK_PROFILE_DEFAULT 자료가 골든과 다릅니다`.
  - 엔진 회귀와 자료 변경을 가려 보이게 하려는 장치다. TASK-0067은 이 프로필을 바꾸지 않는다.
- **ICU 확인**: 0062a와 같다(`(1234567.5).toLocaleString('ko-KR') === '1,234,567.5'`, 아니면 종료 2. 표준 오류에 Node·ICU 판본).

### 4. 골든 파일 형식

- 첫째 줄: `# scitrade engine golden v1 (rules-3)`
- 둘째 줄: `# profileHash=<64자> ; 실행·meta 제외 마지막 상태·주간 탐침·공시일 견적 JSON sha256; node tools/check_rules3_golden.mjs --write`
  - 해석기는 이 줄에서 `profileHash=` 뒤 64자를 읽는다. 형식이 어긋나면 종료 코드 2다.
- 셋째 줄(머리 줄): `scenarioId<TAB>riskLevel<TAB>policyId<TAB>seed<TAB>runHash<TAB>stateHash<TAB>probeHash`
- 자료 줄: 0062a 4절과 같은 규칙이다(탭, 10진 시드, `^[0-9a-f]{64}$`, LF, 마지막 LF). `riskLevel`은 `R1`·`R2`·`R3` 가운데 하나다.
- 줄 순서는 `JSON.stringify([scenarioId, riskLevel, policyId, seed])` 문자열의 비교 순서다.
- 같은 키가 두 번 나오거나, 자료 줄이 0개이거나, 형식을 어기면 종료 코드 2다.

### 5. 모드와 종료 코드

0062a 5절과 같다. 다른 점만 적는다.

- 같으면 출력은 `rules-3 골든 일치: N회`다.
- 다르면 요약 줄은 `다른 줄 N개 (runHash a, stateHash b, probeHash c)`다.
- `--write`: `git diff --stat -- src data schemas`가 빈 상태에서만 쓴다.
- `--golden PATH`: 부분 집합 규칙과, 기본 경로(realpath 포함)일 때 ‘집합이 정확히 같아야 함’ 규칙이 0062a와 같다.
- `--dump DIR`: 파일 이름은 `<scenarioId>__<riskLevel>__<policyId>__<seed>.run.json`·`.state.json`이다. 저장소 안이면 종료 2다.
- `--workers N`: 기본 `Math.min(os.availableParallelism(), 8)`. 키 목록을 `i % N`으로 나눈다. 워커 수가 달라도 결과가 같아야 한다.

### 6. 시험 `tools/check_rules3_golden.test.mjs` (`node --test`)

- 자식 실행과 임시 파일 규칙은 0062a 6절과 같다(`spawnSync`, 출력은 `os.tmpdir()` 아래 파일).
- 임시 골든은 기본 골든에서 `SCENARIO_M2_OPS_COS_LAVER`·`R3`·`MAX_CONTRIBUTION`·2001 줄과 `SCENARIO_M2_OPERATIONS`·`R1`·`NO_FX`·2001 줄을 뽑는다.

| 번호 | 조작(`--golden` 임시 파일) | 기대 결과 |
|---|---|---|
| 1 | 그대로 | 0 |
| 2 | `stateHash` 마지막 글자를 다른 16진 글자로(0↔1) | 1, 출력에 그 줄이 나옴 |
| 3 | `runHash` 마지막 글자를 같은 방식으로 | 1 |
| 4 | `probeHash` 마지막 글자를 같은 방식으로 | 1 |
| 5 | 묶음에 없는 줄(예: `R0` 또는 `FOCUS`)을 넣음 | 2 |
| 6 | 같은 줄을 두 번 넣음 | 2 |
| 7 | 해시에 16진 밖 글자를 넣음 | 2 |
| 8 | 머리 줄을 깨뜨림 | 2 |
| 9 | 둘째 줄의 `profileHash` 마지막 글자를 바꿈 | 2, 프로필 메시지 |
| 10 | `--dump`를 저장소 안 경로로 | 2 |
| 11 | `--dump`를 tmpdir로 | 0, 파일 4개(실행 2개 × run·state) |

- 순수 함수 시험(`tools/rules3_golden_lib.mjs`를 직접 import)
  - 기본 경로의 ‘집합이 정확히 같아야 함’: 줄 하나가 빠지면 거부, 묶음 밖 줄이 하나 더 있으면 거부.
  - 워커 분할: 키 목록을 1·4개로 나눴다가 합치면 같다.
  - 키에 위험 단계가 들어간다: 단계만 다른 두 줄은 다른 키다.
- 탐침 불변: 실행 하나를 탐침 있이·없이 돌려 `runHash`·`stateHash`가 같다.
- 시험 하나가 30초를 넘지 않게 한다.

### 7. `tools/ai/review_checks.sh`

- 두 줄을 더한다. 자리는 0062a의 두 줄(`run node tools/check_rules2_golden.mjs`, `run node --test tools/check_rules2_golden.test.mjs`) 바로 뒤다.
  - `run node tools/check_rules3_golden.mjs`
  - `run node --test tools/check_rules3_golden.test.mjs`
- 다른 줄은 바꾸지 않는다.
- **작업 전에** `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`를 한 번 돌려 검사 수 N을 적는다. 작업 뒤에는 N + 2종, 실패 0종이어야 한다.
- `--check` 모드의 ‘작업 트리 변화 없음’ 검사가 그대로 통과해야 한다.

### 8. 골든 만들기와 확인

1. `node tools/check_rules3_golden.mjs --write`
2. 비교 모드를 `--workers 1`과 `--workers 4`로 돌린다. 둘 다 0이어야 한다.
3. **시제품 값과 대조.** 하나라도 다르면 검사기를 값에 맞추지 말고 멈춰 보고한다. 해시 정의나 설정 변환이 2·3절과 다른지부터 확인한다.

   | 줄 | `runHash` | `stateHash` |
   |---|---|---|
   | `SCENARIO_M2_OPS_COS_LAVER`·R3·`MAX_CONTRIBUTION`·2001 | `81173244f4ee2a9eb631eb2521ac2154a663bc54833e2ba7e8a33df2409c061f` | `06694626774fcabe21a21a844d00bd82a3ee70e7230d1cc2775f531cabe1137f` |
   | `SCENARIO_M2_OPERATIONS`·R1·`NO_FX`·2001 | `65fc36c6a872143488dfa8f38dae85e648493fb60915097356434d094d64dd9e` | `88a98015ecc1d4b132d71719e1400890235776495114c5a277f9c6b4e9a83151` |

   - 시제품은 `probeHash`를 내지 않았다. 그래서 `probeHash`는 대조하지 않고, 탐침 불변 시험(6절)으로 지킨다.
   - 시제품은 개발 브랜치 `b51ee20`과 `src`·`data`가 같은 트리에서 돌렸다. `<BASE>`와 그 사이에 `src`·`data`가 바뀌었으면 값이 다를 수 있다. 그때는 `git diff --stat b51ee20 <BASE> -- src data`를 보고에 붙이고 멈춘다.
4. 결과 보고 초안을 쓴다.
5. `python3 tools/build_package.py --manifest-only`
6. `review_checks --check`
7. 출력을 보고에 붙인다.
8. `--manifest-only`를 다시 하고 `validate_data`를 돌린다. `build_package.py`나 `validate_data.py`가 새 파일을 거부하면 고치지 말고 멈춰 보고한다.

## 시제품 측정값(세션 A, 2026-10-24)

- 작업 트리: 개발 브랜치 `b51ee20`과 `src`·`data`가 같은 트리, `data/market_rules.json` sha256 `fb3ee07c…`. 탐침 없이 90회를 한 작업자로 돌렸다.
- 걸린 시간: 합계 84.5초(실행만). 0062a의 rules-2 105회(워커 1개 169초, 탐침 포함)보다 짧다.
- 결과: R3 54회 가운데 실패 18회, R1·R2 36회 가운데 실패 18회. 실패 경로가 들어 있다. 취소는 0건이라 탐침이 지킨다(0062a와 같다).
- R3 직접 무역 계약에서 0이 아닌 위험 성분 수(54회 합)

  | 성분 | (가) | (나) | (다) | 합 |
  |---|---:|---:|---:|---:|
  | fx | 151 | 81 | 95 | 327 |
  | tariff | 8 | 4 | 7 | 19 |
  | surcharge | 39 | 22 | 20 | 81 |
  | claim | 6 | 6 | 2 | 14 |
  | late | 24 | 11 | 18 | 53 |
  | collection | 51 | 28 | 34 | 113 |

- 공시일 `quotePreview` 탐침: (다)·R3·`MAX_CONTRIBUTION`·2001에서 12회 26밀리초. 탐침이 있어도 그 실행의 `runHash`가 같았다.

## 변형 시험

- 각 변형은 임시로 고치고, 비교 모드를 돌린 뒤 되돌린다. 결과는 5절의 요약 줄로 적는다.
- 기대와 다르면 변형이나 검사기를 바꾸지 말고, 측정한 줄 수와 함께 보고한다.

| 번호 | 변형(임시) | 기대 결과 |
|---|---|---|
| 1 | `src/engine/risk.ts` `referenceRate`의 걸음 식에서 `fx.stepBp`를 `fx.stepBp - 1`로 | 대부분의 줄에서 `runHash`·`stateHash` 다름 |
| 2 | `withRiskLevel`의 R2 층 목록에서 `'SURCHARGE'`를 뺌 | R2 줄만 다름. R1·R3 줄은 같음 |
| 3 | `collectionPlan`(risk.ts:143)의 지연 일수 계산에 `+ 1` | R3 줄만 다름(지연 수금이 있는 줄). R1·R2 줄은 같음 |
| 4 | `contractRiskReport`(reports.ts:420)의 `components` 가운데 한 성분 값에 `+ 1`(어느 성분인지 보고에 적음) | `stateHash`는 같고 `runHash`·`probeHash`가 다른 줄이 있음. 실행 결과의 `metrics.risk`가 이 함수를 부르기 때문이다(`sim.ts:64`, `risk-metrics.ts:33`). 상태는 바뀌지 않는다 |
| 5 | `src/engine/reports.ts:104`의 rules-3 견적 미리보기 분기에서, 미리보기 결과의 숫자 하나에 `+ 1`(어느 칸인지 보고에 적음) | `probeHash`가 다른 줄이 있음. 정책이 미리보기를 쓰면 `runHash`도 다를 수 있다. 무엇이 나오든 줄 수를 적는다 |
| 6 | `data/market_rules.json`의 `RISK_PROFILE_DEFAULT.fx.step_bp`를 바꿈 | 시뮬레이션 전에 종료 2(프로필 지문) |
| 7 | `deserializeSave`가 rules-3 마지막 상태에 있는 칸 하나를 빠뜨리게 함(어느 칸인지 보고에 적음) | 저장 왕복 실패, 종료 1 |
| 8 | 기본 골든 파일에서 줄 하나를 지움 | 종료 2 |
| 9 | 0062a 검사(`node tools/check_rules2_golden.mjs`)를 변형 2 상태에서 돌림 | 0. rules-3 변경이 rules-2 골든에 닿지 않음을 보인다 |

- 모든 변형을 되돌린 뒤 `git diff --stat -- src data schemas`가 빈 값임을 확인해 보고에 적는다.

## 범위 보고 (결과 보고에 표로)

1. **위험 성분**: 시제품 표와 같은 꼴로, 골든 90회의 직접 무역 계약에서 0이 아닌 성분 수(시나리오 × 성분, R3만). 0인 칸이 있으면 그 경로를 지키는 기존 단위 시험 파일과 시험 이름을 적는다.
2. **명령 종류**: 0062a 범위 보고 ①과 같다(`EngineCommand` 전체, APPLIED 합계, 없는 종류는 0).
3. **명령이 아닌 경로**: 환전 방향별 합, 실패 실행 수, 취소 계약 수, 탐침 적용 수(취소, 원화→달러, 견적 미리보기).
4. **걸린 시간**: 워커 1개와 4개.

## 완료 조건

1. `git diff --stat <BASE> -- src data schemas`가 빈 값이다. 0062a 파일 여섯도 바뀌지 않았다.
2. 다음이 모두 나온다.
   - 비교 모드 0(`--workers 1`, `--workers 4`)
   - 시험 통과
   - 8절의 시제품 값 대조 일치
   - 변형 9개가 기대 결과대로
3. **`tools/ai/review_checks.sh`에 두 줄이 등록됐고**, `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`의 결과가 `검사 N+2종, 실패 0종 (모드: 확인)`이다(N은 작업 전 값).
4. 결과 보고 `docs/ai/tasks/results/TASK-0062b.md`를 쓴다.

## 고칠 수 있는 파일

- 새 파일
  - `tools/rules3_golden_lib.mjs`
  - `tools/rules3_golden_entry.ts`
  - `tools/check_rules3_golden.mjs`
  - `tools/check_rules3_golden.test.mjs`
  - `tests/golden/rules3-risk.tsv`
  - `docs/ai/tasks/results/TASK-0062b.md`
- 고침
  - `tools/ai/review_checks.sh`(두 줄)
  - `MANIFEST.json`(생성만)

## 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 골든 묶음 정의, 해시 범위, 탐침에서 실제로 부른 함수 꼴, 골든 파일 첫 세 줄
- Node·ICU 판본, 걸린 시간, 워커 수별 결과 일치
- 시제품 값 대조 결과
- 범위 보고 표
- 변형 표와 요약 줄, 시험 출력
- `review_checks`의 작업 전·후 `검사 N종, 실패 M종 (모드: 확인)` 줄
- TASK-0067이 쓸 진단 절차: 작업 전에 `node tools/check_rules3_golden.mjs`가 0인지 확인하고 `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다.
- 범위 밖에서 발견한 것, 질문
