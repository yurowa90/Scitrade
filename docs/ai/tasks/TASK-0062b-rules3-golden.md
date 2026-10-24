# TASK-0062b 엔진 골든: 위험 규칙(rules-3)과 위험 단계 실행 결과·마지막 상태·읽기 탐침을 해시로 고정 (엔진 변경 없음)

- 지위: **승인(허브, 2026-10-24, 개정 1 e14abac).** 초안(`a8839fa`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0062b-HUB-2026-10-24.md`(확인 결함 9가지, 주요 3)에서 고칠 곳 12개를 받았다. 처리는 끝의 ‘개정 1 처리표’에 있다.
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
- 이때 rules-3의 동작·출력·저장은 바뀌면 안 된다. 위험 단계 실행 결과(`run.metrics.risk`)도 바뀌면 안 된다. 그러나 지금 이것을 지키는 장치가 없다.
  - TASK-0062a 골든은 rules-1·rules-2만 덮는다. 0062a는 `simulate`에 위험 단계 인수를 주지 않는다(`check_rules2_golden.mjs:37`). 그래서 `run.metrics.risk`(`sim.ts:64`)는 R0 실행에서도 어떤 골든에도 들어가지 않는다.
  - 판본 1 측정(경로 5)의 결과 파일은 측정 기록이고, 비교 도구가 아니다.
- 그래서 위험 단계 실행의 결과, 마지막 상태, 읽기 탐침, 저장 왕복을 해시로 고정한다. 0062a와 같은 꼴이다.

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

### 2. 골든 묶음 하나(108회)

**설정**(실행마다)
- `config = withRiskLevel(withLateMode(loadScenario(scenarioId), 'base'), level, loadRiskProfile('RISK_PROFILE_DEFAULT'))`
  - `runD03`(`src/engine/sim/d03.ts:66-67`)과 같은 변환이다. 다른 점은 프로필을 `riskProfiles()[0]`이 아니라 **ID로 고르는 것**이다. TASK-0067이 `data/market_rules.json`에 `RISK_PROFILE_V2`를 더해도 대상이 바뀌지 않게 하려는 것이다.
  - level이 `R0`이면 `withRiskLevel`이 설정을 그대로 돌려준다(rules-2 설정).
- 실행: `simulate(config, policyById(policyId), seed, observe, level)`. **다섯째 인수 `level`은 R0 줄에서도 `'R0'`로 준다.** 그래야 `run.metrics.risk`가 생긴다(`sim.ts:64`).

**실행 집합**

| 부분 | 시나리오 | 위험 단계 | 정책 | 시드 | 회수 |
|---|---|---|---|---|---:|
| 전체 위험 | (가)(나)(다) 셋 | R3 | `IDLE`, `NO_FX`, `MAX_CONTRIBUTION`, `LATE_OK`, `MARGIN_BUFFER`, `MAX_CONTRIBUTION~fx:react` | 2001~2003 | 54 |
| 층 경계 | (가)(나)(다) 셋 | R1, R2 | `NO_FX`, `MAX_CONTRIBUTION` | 2001~2003 | 36 |
| 위험 지표(R0) | (가)(나)(다) 셋 | R0 | `NO_FX`, `MAX_CONTRIBUTION` | 2001~2003 | 18 |

- 시나리오 ID: `SCENARIO_M2_OPERATIONS`(가), `SCENARIO_M2_OPS_COSMETICS`(나), `SCENARIO_M2_OPS_COS_LAVER`(다).
- 정책 이름이 하나라도 `policyById`에서 `undefined`이면 종료 코드 2다.
- 탐침은 R0 줄에도 똑같이 건다(3절). 시제품에서 R0 18회 모두 오류 없이 돌았고, 탐침이 있어도 해시가 같았다.

**고른 근거**(결과 보고에 그대로 옮기지 않아도 된다)
- **시나리오 셋 모두.** 판본 1 측정이 세 변형 모두를 위험 단계로 돌렸고, TASK-0067의 술어화는 세 변형에 다 닿는다. 품목·거래처 조합이 달라 위험 성분 경로가 다르다.
- **R3 × 6정책.** R3는 위험 층 다섯(`FX`·`TARIFF`·`SURCHARGE`·`CLAIM`·`COLLECTION`)을 모두 켠다.
  - 정책 넷은 0062a와 같다: `IDLE`(거래 없음, 실패 경로), `NO_FX`(환전 없음, 실패 경로), `MAX_CONTRIBUTION`(기준 회사), `LATE_OK`(늦은 수락).
  - `MARGIN_BUFFER`는 위험 단계 전용 정책 분기다(`operations-policy.ts:142`, TASK-0066).
  - `MAX_CONTRIBUTION~fx:react`는 환율 반응 경로다.
  - `FOCUS`는 뺀다. `MAX_CONTRIBUTION`에 품목 걸러 내기만 더한 분기다(`operations-policy.ts:143`).
- **R1·R2 × 2정책.** 층 켜기·끄기 분기(`layers.includes(...)`)를 지킨다. TASK-0067 술어화에서 가장 깨지기 쉬운 자리다. 위험 성분이 생기는 `MAX_CONTRIBUTION`과, 실패하는 `NO_FX`를 둔다.
- **R0 × 2정책.** R0의 마지막 상태는 0062a(rules-2 묶음)가 덮지만, R0의 `run.metrics.risk`는 덮지 않는다. 그 값은 `contractRiskReport`와 `preview`로 만든다(`risk-metrics.ts:33-35`). TASK-0067이 그 둘을 고치므로 R0 18회를 넣는다.
- **시드 2001~2003.** 시제품에서 세 시드만으로 R3 위험 성분이 시나리오마다 모두 0이 아니었다(아래 표). 실행 시간도 0062a(rules-2 105회)와 비슷하다.

### 3. 해시

- 해시 정의는 0062a 3절과 같다. 모든 해시는 JSON 문자열 UTF-8 바이트의 sha256, 소문자 16진 64자다.
  - `runHash` = sha256(`JSON.stringify(run)`)
  - `stateHash` = sha256(`JSON.stringify(rest)`), `const { meta, ...rest } = state`. 키를 다시 정렬하지 않는다. 로그도 넣는다.
- `probeHash`: `observe(opened)`에서 만든다. 설정은 `cfg = { ...config, seed }`다. 탐침은 `planState`와 읽기 함수만 부르고 `opened`를 바꾸지 않는다.
  - **`opened.day % 7 === 0`인 날**: 0062a 3절의 탐침 1~3을 그대로 한다(취소 `planState`, 원화→달러 `planState`, 읽기 함수 8종). 그다음 아래 위험 읽기를 더한다.
    1. 모든 직접 무역 계약의 `contractRiskReport(opened, cfg, c.id)`
    2. `tariffSchedule(opened, cfg)`
    3. `receivableSchedule(opened, cfg)`
    4. `referenceRate(cfg, seed, opened.day)`
  - **`opened.day % 7 === 1`인 날**(공시일). `day % 7 === 0`에는 열린 견적이 없다(공시 유효 3일).
    1. `openTradePairs(opened, cfg)`의 모든 짝마다 `quotePreview(opened, cfg, pair)`의 결과
    2. **열린 주선 제안마다** `quotePreview(opened, cfg, { offerId })`의 결과. 대상은 `opened.offers` 가운데 `status === 'OPEN'`이고, `offerDef(opened, cfg, id)`의 `kind === 'forwarding'`이며, `publishDay ≤ opened.day ≤ validUntilDay`인 것이다. ID 오름차순으로 넣는다.
    - 무역·주선 모두 `quotePreview`(`readers.ts:33`)가 `preview()`(`reports.ts:93`)를 부른다. 위험 단계의 미리보기 칸(`cashNeedByCurrency`, `referenceEstimate`, `surchargeMaxBp`, 일정 행 `currency`)을 지키기 위해서다. 시제품에서 한 번에 약 2.5밀리초였다.
  - 함수마다 서명은 지금 코드를 그대로 따르고, 결과 보고에 실제로 부른 꼴을 적는다.
  - 실행마다 탐침 호출 수를 센다: 취소 APPLIED, 원화→달러 APPLIED, `contractRiskReport` 호출, 무역 `quotePreview` 호출, 주선 `quotePreview` 호출. 범위 보고와 6절 시험이 쓴다.
- **저장 왕복**: 0062a 3절과 같다(`serializeSave` → `deserializeSave(text, { config, dataVersion: config.dataVersion, rulesVersion: config.rules.rulesVersion })` → `serializeSave`, 바이트 같음). 다르거나 예외면 그 줄과 이유를 출력하고 종료 코드 1이다.
- **프로필 지문 둘**(시작할 때 구한다)
  - `profileRaw` = sha256(`JSON.stringify(원문 항목)`). 원문 항목은 `data/market_rules.json`을 `JSON.parse`한 객체의 `risk_profiles` 가운데 `id === 'RISK_PROFILE_DEFAULT'`인 항목이다.
  - `profileLoaded` = sha256(`JSON.stringify(loadRiskProfile('RISK_PROFILE_DEFAULT'))`).
  - `profileRaw`가 골든 둘째 줄의 값과 다르면 **자료 변경**이다. 시뮬레이션 전에 종료 코드 2를 낸다. 메시지: `위험 프로필 RISK_PROFILE_DEFAULT 원문 자료가 골든과 다릅니다`.
  - `profileRaw`는 같고 `profileLoaded`만 다르면 **로더(엔진) 변경**이다. 메시지 `위험 프로필 로더 출력이 골든과 다릅니다(엔진 변경)`를 내고 비교는 계속한다. 끝의 종료 코드는 1이다(해시가 모두 같아도 1).
  - 두 지문은 엔진 회귀와 자료 변경을 가려 보이게 하려는 장치다. TASK-0067은 원문 항목을 바꾸지 않는다. 로더 출력의 모양을 바꾸면 이 검사가 1을 내므로, 그때는 0067 결과 보고에 이유를 적고 허브가 `--write` 여부를 정한다.
- **ICU 확인**: 0062a와 같다(`(1234567.5).toLocaleString('ko-KR') === '1,234,567.5'`, 아니면 종료 2. 표준 오류에 Node·ICU 판본).

### 4. 골든 파일 형식

- 첫째 줄: `# scitrade engine golden v1 (rules-3)`
- 둘째 줄: `# profileRaw=<64자> profileLoaded=<64자> ; 실행·meta 제외 마지막 상태·주간 탐침·공시일 견적 JSON sha256; node tools/check_rules3_golden.mjs --write`
  - 해석기는 이 줄에서 `profileRaw=`·`profileLoaded=` 뒤 64자를 읽는다. 형식이 어긋나면 종료 코드 2다.
- 셋째 줄(머리 줄): `scenarioId<TAB>riskLevel<TAB>policyId<TAB>seed<TAB>runHash<TAB>stateHash<TAB>probeHash`
- 자료 줄: 0062a 4절과 같은 규칙이다(탭, 10진 시드, `^[0-9a-f]{64}$`, LF, 마지막 LF). **`riskLevel`은 `R0`·`R1`·`R2`·`R3` 가운데 하나다.** 그 밖의 값은 형식 오류(종료 2)다.
- 줄 순서는 `JSON.stringify([scenarioId, riskLevel, policyId, seed])` 문자열의 비교 순서다.
- 같은 키가 두 번 나오거나, 자료 줄이 0개이거나, 형식을 어기면 종료 코드 2다.

### 5. 모드와 종료 코드

0062a 5절과 같다. 다른 점만 적는다.

- 같으면 출력은 `rules-3 골든 일치: N회`다.
- 다르면 요약 줄은 `다른 줄 N개 (runHash a, stateHash b, probeHash c)`다.
- 실행 횟수와 걸린 시간은 0062a처럼 표준 오류에 `…회, 워커 …` 꼴로 낸다. 6절 시험이 ‘시뮬레이션 전 거부’를 이 줄이 없는 것으로 확인한다.
- `--write`: `git diff --stat -- src data schemas`가 빈 상태에서만 쓴다.
- `--golden PATH`: 부분 집합 규칙과, 기본 경로(realpath 포함)일 때 ‘집합이 정확히 같아야 함’ 규칙이 0062a와 같다.
- `--dump DIR`: 파일 이름은 `<scenarioId>__<riskLevel>__<policyId>__<seed>.run.json`·`.state.json`이다. 저장소 안이면 종료 2다.
- `--workers N`: 기본 `Math.min(os.availableParallelism(), 8)`. 키 목록을 `i % N`으로 나눈다. 워커 수가 달라도 결과가 같아야 한다.
- `--no-quote-probe`: 공시일 탐침(3절 공시일 1·2)만 끈다. 변형 5의 확인 단계에만 쓴다.
  - `--golden PATH`(기본 경로가 아닌 파일)와 `--dump DIR`을 함께 줄 때만 허용한다. 아니면 종료 2다.
  - 이때 `probeHash`의 정의가 골든과 달라지므로 비교 결과(종료 0·1)는 판정에 쓰지 않는다. 판정은 덤프로 한다.
  - `--dump`는 이 모드에서 실행마다 `<stem>.hashes.json`(`runHash`·`stateHash`·`probeHash`)도 쓴다.

### 6. 시험 `tools/check_rules3_golden.test.mjs` (`node --test`)

- 자식 실행과 임시 파일 규칙은 0062a 6절과 같다(`spawnSync`, 출력은 `os.tmpdir()` 아래 파일).
- 임시 골든은 기본 골든에서 `SCENARIO_M2_OPS_COS_LAVER`·`R3`·`MAX_CONTRIBUTION`·2001 줄과 `SCENARIO_M2_OPERATIONS`·`R0`·`MAX_CONTRIBUTION`·2001 줄을 뽑는다.

| 번호 | 조작(`--golden` 임시 파일) | 기대 결과 |
|---|---|---|
| 1 | 그대로 | 0 |
| 2 | `stateHash` 마지막 글자를 다른 16진 글자로(0↔1) | 1, 출력에 그 줄이 나옴 |
| 3 | `runHash` 마지막 글자를 같은 방식으로 | 1 |
| 4 | `probeHash` 마지막 글자를 같은 방식으로 | 1 |
| 5 | 형식은 맞고 묶음에만 없는 줄 `SCENARIO_M2_OPERATIONS`·`R3`·`FOCUS`·2001(해시는 아무 64자)을 정렬 자리에 넣음 | 2, 표준 오류에 `…회, 워커` 줄이 없음(시뮬레이션 전 거부) |
| 6 | 같은 줄을 두 번 넣음 | 2 |
| 7 | 해시에 16진 밖 글자를 넣음 | 2 |
| 7a | `riskLevel`을 `R4`로 바꿈 | 2(형식 오류) |
| 8 | 머리 줄을 깨뜨림 | 2 |
| 9 | 둘째 줄의 `profileRaw` 마지막 글자를 바꿈 | 2, 원문 자료 메시지, 표준 오류에 `…회, 워커` 줄이 없음 |
| 9a | 둘째 줄의 `profileLoaded` 마지막 글자만 바꿈 | 1, 로더 메시지 |
| 10 | `--dump`를 저장소 안 경로로 | 2 |
| 11 | `--dump`를 tmpdir로 | 0, 파일 4개(실행 2개 × run·state) |
| 12 | 기본 골든 경로에 `--no-quote-probe`, 또는 `--dump` 없이 `--no-quote-probe` | 둘 다 2 |

- 순수 함수 시험(`tools/rules3_golden_lib.mjs`를 직접 import)
  - 기본 경로의 ‘집합이 정확히 같아야 함’: 줄 하나가 빠지면 거부, 묶음 밖 줄이 하나 더 있으면 거부.
  - 워커 분할: 키 목록을 1·4개로 나눴다가 합치면 같다.
  - 키에 위험 단계가 들어간다: 단계만 다른 두 줄은 다른 키다.
  - 실행 집합이 108개이고 R0 18·R1 18·R2 18·R3 54다.
- **탐침 불변과 비어 있지 않음**: `SCENARIO_M2_OPS_COS_LAVER`·`R3`·`MAX_CONTRIBUTION`·2001과 `SCENARIO_M2_OPERATIONS`·`R0`·`MAX_CONTRIBUTION`·2001을 탐침 있이·없이 돌린다.
  - `runHash`·`stateHash`가 같다.
  - 탐침 있는 실행에서 취소 APPLIED > 0, `contractRiskReport` 호출 > 0, 무역 `quotePreview` 호출 > 0, 주선 `quotePreview` 호출 > 0이다.
  - `probeHash`가 빈 입력의 sha256(`e3b0c442…b855`)이 아니다.
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
   | `SCENARIO_M2_OPERATIONS`·R0·`MAX_CONTRIBUTION`·2001 | `043fb48f8f4fb1ecb8baf38534185b417b1f4e9b80a34c9a7dc7112fc4ad35c9` | `a70ce7dcbc0fe54348e469fba3a1ad385502f34596cf00a0e5e7827af65512f0` |

   - 시제품은 `probeHash`를 내지 않았다. 그래서 `probeHash`는 대조하지 않고, 탐침 불변 시험(6절)으로 지킨다.
   - 시제품은 개발 브랜치 `16dda93`과 `src`·`data`가 같은 트리에서 돌렸다. `<BASE>`와 그 사이에 `src`·`data`가 바뀌었으면 값이 다를 수 있다. 그때는 `git diff --stat 16dda93 <BASE> -- src data`를 보고에 붙이고 멈춘다.
4. 결과 보고 초안을 쓴다.
5. `python3 tools/build_package.py --manifest-only`
6. `review_checks --check`
7. 출력을 보고에 붙인다.
8. `--manifest-only`를 다시 하고 `validate_data`를 돌린다. `build_package.py`나 `validate_data.py`가 새 파일을 거부하면 고치지 말고 멈춰 보고한다.

## 시제품 측정값(세션 A, 2026-10-24)

- 작업 트리: 개발 브랜치 `16dda93`과 `src`·`data`가 같은 트리, `data/market_rules.json` sha256 `fb3ee07c…`.
- 108회를 한 작업자로 돌렸다.
  - 탐침 없이 R1~R3 90회: 84.5초.
  - 위험 탐침(취소, `contractRiskReport`, 위험 읽기 3종, 공시일 무역·주선 `quotePreview`)을 켜고 108회: 160.7초. 0062a 읽기 탐침 8종과 원화→달러는 넣지 않은 값이다.
  - 탐침을 켜도 108회 모두 `runHash`·`stateHash`가 탐침 없는 값과 같았다. 오류는 0건이었다.
- 결과: 실패 실행 R3 18/54, R0·R1·R2 각 9/18. 실패 경로가 들어 있다.
- 탐침 호출 합(108회): 취소 APPLIED 2,056, `contractRiskReport` 4,383, 무역 `quotePreview` 1,776, 주선 `quotePreview` 5,815.
- USD 미지급 의무는 108회 모두 0건이었다. 그래서 `operations.ts:266`의 위험 분기에는 골든·탐침이 닿지 않는다(범위 보고 ⑤).
- R3 직접 무역 계약에서 0이 아닌 위험 성분 수(54회 합)

  | 성분 | (가) | (나) | (다) | 합 |
  |---|---:|---:|---:|---:|
  | fx | 151 | 81 | 95 | 327 |
  | tariff | 8 | 4 | 7 | 19 |
  | surcharge | 39 | 22 | 20 | 81 |
  | claim | 6 | 6 | 2 | 14 |
  | late | 24 | 11 | 18 | 53 |
  | collection | 51 | 28 | 34 | 113 |

## 변형 시험

- 각 변형은 임시로 고치고, 비교 모드를 돌린 뒤 되돌린다. 결과는 5절의 요약 줄로 적는다.
- 기대와 다르면 변형이나 검사기를 바꾸지 말고, 측정한 줄 수와 함께 보고한다.
- ‘다른 줄 ≥ k’는 판정 기준이고, 실제 수는 해시 종류별로 적는다.

| 번호 | 변형(임시) | 기대 결과 |
|---|---|---|
| 1 | `src/engine/risk.ts:29`의 두 `fx.stepBp`를 모두 `(fx.stepBp - 1)`로 | R1·R2·R3 줄 가운데 `runHash`가 다른 줄 ≥ 1, `stateHash`가 다른 줄 ≥ 1. **R0 줄 18개는 세 해시 모두 같음**(R0는 FX 층이 없다) |
| 2 | `withRiskLevel`의 R2 층 목록에서 `'SURCHARGE'`를 뺌 | R2 줄 가운데 다른 줄 ≥ 1. **R0·R1·R3 줄은 세 해시 모두 같음** |
| 3 | `collectionPlan`(risk.ts:143)의 지연 일수 계산에 `+ 1` | R3 줄 가운데 `stateHash`가 다른 줄 ≥ 1. **R0·R1·R2 줄은 세 해시 모두 같음** |
| 4 | `contractRiskReport`(reports.ts:420)의 `components.fx`에 `+ 1` | **모든 줄의 `stateHash`는 같음.** R0를 포함한 `runHash`가 다른 줄 ≥ 1(`run.metrics.risk`가 이 함수를 부른다, `sim.ts:64`, `risk-metrics.ts:33`). `probeHash`가 다른 줄 ≥ 1 |
| 5a | `preview()`(reports.ts:93, `quotePreview`가 `readers.ts:48`에서 부름)의 반환 객체 리터럴에서 `referenceEstimate`의 `saleKrw` 칸에만 `+ 1`(`saleKrw: saleKrw + 1`. 지역 변수 `saleKrw`와 `pnlKrw` 계산은 그대로 둔다). 이 칸은 정책·`riskMetrics`·`contractRiskReport`가 읽지 않는다(정책은 `rateKrwPerUsd`만, `contractRiskReport`는 `purchase`·`freight`·`duty`·`sale`·`routeId`만 읽는다) | **모든 줄의 `runHash`·`stateHash`는 같음.** `probeHash`가 다른 줄 ≥ 1. **확인 단계**: 기본 골든에서 R3 줄 둘(`SCENARIO_M2_OPS_COS_LAVER`·`MAX_CONTRIBUTION`·2001, `SCENARIO_M2_OPERATIONS`·`MAX_CONTRIBUTION`·2001)을 뽑은 임시 골든으로, 고치기 전 트리에서 `--no-quote-probe --dump <밖>/A`, 변형 상태에서 `--no-quote-probe --dump <밖>/B`를 돌린다. `A`와 `B`의 `.hashes.json`이 모두 같아야 한다(공시일 탐침을 끄면 차이가 사라짐) |
| 5b | 같은 객체 리터럴에서 `kind === 'FORWARDING'`일 때만 `pnlKrw` 칸에 `+ 1`(`pnlKrw: … + (kind === 'FORWARDING' ? 1 : 0)`) | 5a와 같은 기대와 확인 단계. 주선 공시일 탐침이 이 칸을 지킨다는 것을 보인다. 무역 `quotePreview`만으로는 이 차이가 생기지 않는다 |
| 6 | `data/market_rules.json`의 `RISK_PROFILE_DEFAULT.fx.step_bp`를 바꿈 | 시뮬레이션 전에 종료 2(원문 지문) |
| 7 | `deserializeSave`가 위험 단계 마지막 상태에 있는 칸 하나를 빠뜨리게 함(어느 칸인지 보고에 적음) | 저장 왕복 실패, 종료 1 |
| 8 | 기본 골든 파일에서 줄 하나를 지움 | 종료 2 |
| 9 | 변형 5a 상태와 변형 3 상태에서 각각 0062a 검사(`node tools/check_rules2_golden.mjs`)를 돌림 | **둘 다 0.** 두 함수는 rules-2 실행에서도 불린다: `preview()`는 `operations-policy.ts:30`이 모든 직접 무역 후보마다 부르고, `processCollections`(engine.ts:1141)는 날마다 모든 청구서에 돈다. 그런데 고친 곳은 위험 분기 안(`if (risk)`류, `engine.ts:1146`의 `COLLECTION` 층 검사 뒤)이다. 그래서 0이면 ‘위험 분기 변경이 rules-2에 새지 않는다’를 보인다. 같은 상태에서 0062b는 5a·3의 기대대로 다른 줄이 있어야 한다 |

- 모든 변형을 되돌린 뒤 `git diff --stat -- src data schemas`가 빈 값임을 확인해 보고에 적는다.

## 범위 보고 (결과 보고에 표로)

1. **위험 성분**: 시제품 표와 같은 꼴로, 골든의 R3 직접 무역 계약에서 0이 아닌 성분 수(시나리오 × 성분). 0인 칸이 있으면 그 경로를 지키는 기존 단위 시험 파일과 시험 이름을 적는다.
2. **명령 종류**: 0062a 범위 보고 ①과 같다(`EngineCommand` 전체, APPLIED 합계, 없는 종류는 0).
3. **명령이 아닌 경로**: 환전 방향별 합, 실패 실행 수, 취소 계약 수.
4. **탐침 호출 수**: 3절에서 센 다섯 가지, 단계(R0~R3)별 합.
5. **위험 분기 도달표**: `'M2a-rules-3'` 문자열 분기와 `layers.includes(...)` 층 분기를 모두 나열한다(위치: `risk.ts`, `reports.ts`, `engine.ts`, `operations.ts`, `operations-invariants.ts`, `types.ts`; `grep -n "M2a-rules-3\|layers.includes"`로 찾는다).
   - 분기마다 골든 108회에서 위험 쪽으로 들어간 횟수를 적는다. 임시 계수기로 세고 되돌린다(골든을 만든 뒤, `--write` 없이).
   - 도달이 0인 행에는 그 분기를 지키는 기존 단위 시험 파일·시험 이름을 적는다. 시제품 기준으로 `operations.ts:266`(USD 미지급 때 원화→달러 필요액)은 도달 0이고, 지키는 시험은 `src/engine/m2a5-risk-fx.test.ts:342`다.
   - **이 표의 ‘도달 0 + 지키는 단위 시험’ 행은 TASK-0067 지시서에 ‘이 시험은 바꾸지 않는다’ 조건으로 넘긴다.** 허브가 0067 초안 요청 때 세션 A에 전달한다.
6. **걸린 시간**: 워커 1개와 4개.

## 완료 조건

1. `git diff --stat <BASE> -- src data schemas`가 빈 값이다. 0062a 파일 여섯도 바뀌지 않았다.
2. 다음이 모두 나온다.
   - 비교 모드 0(`--workers 1`, `--workers 4`)
   - 시험 통과
   - 8절의 시제품 값 대조 일치
   - 변형 10개(1~4, 5a, 5b, 6~9)가 기대 결과대로
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
- 범위 보고 표 ①~⑥
- 변형 표와 요약 줄(해시 종류별 다른 줄 수), 시험 출력
- `review_checks`의 작업 전·후 `검사 N종, 실패 M종 (모드: 확인)` 줄
- TASK-0067이 쓸 진단 절차: 작업 전에 `node tools/check_rules3_golden.mjs`가 0인지 확인하고 `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다.
- 범위 밖에서 발견한 것, 질문

## 개정 1 처리표(`PRECHECK-0062b-HUB-2026-10-24.md` 4절)

| 번호 | 처리 |
|---|---|
| 1 | ‘왜 필요한가’와 2절 근거: R0 상태는 0062a가 덮지만 `run.metrics.risk`는 덮지 않음 |
| 2 | 2절: R0 18회, 다섯째 인수 `'R0'`, 108회, R0 줄 탐침 |
| 3 | 4절: `riskLevel` R0~R3, 그 밖은 형식 오류(시험 7a) |
| 4 | 3절: 공시일 주선 `quotePreview` |
| 5 | 3절: 지문 둘(원문·로더), 메시지와 종료 코드 가름(시험 9·9a) |
| 6 | 시험 5: R3·`FOCUS`·2001, 시뮬레이션 전 거부 단언 |
| 7 | 시험 9: 시뮬레이션 전 거부 단언 |
| 8 | 6절 탐침 불변: 호출 수 > 0, 빈 sha256 아님 |
| 9 | 변형 1: 29행 두 곳, 해시 종류별 기대 |
| 10 | 변형 9: 위험 분기 변경(5a·3) 상태에서 0062a, rules-2 호출 근거 |
| 11 | 변형 5a·5b: 읽기 전용 칸(`saleKrw`, 주선 `pnlKrw`), runHash·stateHash 같음·probeHash ≥ 1, `--no-quote-probe` 확인, 위치 표기 고침 |
| 12 | 범위 보고 ⑤ 분기 도달표, `m2a5-risk-fx.test.ts:342`를 0067 조건으로 넘김 |
