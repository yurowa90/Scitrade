# TASK-0062a 엔진 골든: 운영 시나리오(rules-2)와 규칙 1의 실행 결과·마지막 상태·읽기 탐침을 해시로 고정 (엔진 변경 없음)

- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- 선행: 개발 브랜치 머리. 이 지시서를 넣은 커밋의 부모를 `<BASE>`로 쓴다.
  - 구하는 법: `git log -1 --format=%P -- docs/ai/tasks/TASK-0062a-rules2-golden.md`
  - 결과가 비었거나 해시가 둘 이상이면 작업하지 말고 멈춰 보고한다. 결과는 `git rev-parse HEAD^`와 같아야 한다.
  - 결과 보고의 `- 모델:` 줄 바로 아래에 `- BASE: <해시>`를 적는다.
- 근거
  - 허브 결정 H4·H9·H14-10: `docs/ai/design/path3-price-risk-2026-10/HUB-DECISIONS-2026-10-16.md`
  - 재검토 원자료 R12~R14·m13~m15(`REREVIEW-HUB-2026-10-16.md`), n13·n14·n16·n31·n36(`REREVIEW2-HUB-2026-10-16.md`)
  - 이 지시서 초안을 허브 시제품으로 실측한 검토(2026-10-16). 아래 ‘허브 사본 측정값’이 그 결과다.
- 순서
  - TASK-0062~0064(직접 무역 위험, rules-3)보다 먼저 한다.
  - 허브가 이 결과를 검수해 병합한 커밋이 TASK-0062의 기준 커밋이 된다.

## 왜 필요한가

- 400회 `cmp`(`run.mjs run`)는 규칙 1 시나리오의 `run`만 비교한다.
  - 운영 시나리오(rules-2, `OPERATIONS_SCENARIO_IDS`)가 바이트 그대로인지는 지키는 장치가 없다.
  - 규칙 1에서도 로그·분개 ID·화물 상태처럼 `run`에 들어가지 않는 것은 지키지 못한다.
- TASK-0062~0064는 rules-1·rules-2와 함께 쓰는 엔진 코드를 고친다.
  - 대상: 미리보기, 자금 검사, 실패 기록, 회복 묶음 계산, 관세, 수금, 취소.
  - 이때 rules-1·rules-2의 동작·출력·저장은 바뀌면 안 된다.
- `runs`만 해시하면 실패 기록 내용, 분개 ID, 로그 문장이 바뀌어도 잡지 못한다(재검토 R13). 그래서 마지막 상태도 해시한다.
- 아래 셋은 어떤 정책도 지나가지 않거나 상태에 남지 않는다(허브 시제품 실측). 그래서 탐침으로 따로 해시한다.
  - 출항 전 취소
  - 원화→달러 환전
  - 읽기 함수 출력

## 원칙

- 엔진·자료·스키마·화면(`src/**`, `data/**`, `schemas/**`)은 고치지 않는다.
  - 바꾸는 것은 새 도구, 새 시험, 골든 파일, 그리고 `tools/ai/review_checks.sh` 한 곳뿐이다.
  - 변형 시험 때 임시로 고친 것은 반드시 되돌린다.
- 골든 파일은 이 작업 트리, 곧 `<BASE>`의 코드로 만든다.
- 검사기는 비교 모드에서 저장소 안에 파일을 쓰지 않는다. 임시 파일은 `os.tmpdir()` 아래에만 쓴다.
- 탐침은 실행을 바꾸지 않는다. 탐침이 있든 없든 `runHash`·`stateHash`는 같아야 한다.
- 커밋·푸시·브랜치 전환은 하지 않는다(공통 규칙).

## 구현 지시

### 1. 파일 구성

| 파일 | 내용 |
|---|---|
| `tools/rules2_golden_lib.mjs` | 순수 함수만 둔다. vite를 부르지 않는다. TSV 해석·직렬화, 형식 검사, 실행 집합 대조, 해시(sha256), 워커 분할 |
| `tools/rules2_golden_entry.ts` | 기존 엔진 함수의 값만 `export { … } from`으로 다시 내보낸다. 타입은 `export type`으로만 내보낸다. 이 파일은 tsc·vitest 범위 밖이다 |
| `tools/check_rules2_golden.mjs` | 명령 진입점이자 워커 진입점 |

`tools/check_rules2_golden.mjs`의 실행 본체 규칙:
- 실행 본체는 `isMainThread && import.meta.main`(직접 실행)이거나 `!isMainThread`(워커)일 때만 돈다.
- `runnerImport`는 `run.mjs:9`와 똑같이 `{ configFile: false, logLevel: 'error' }`로 부른다.

### 2. 골든 묶음 두 개

**rules-2 묶음** — 파일 `tests/golden/rules2-d03.tsv`, 105회
- 정책 `IDLE`, `NO_FX`, `MAX_CONTRIBUTION`, `LATE_OK` × 시드 `SIM_SEEDS` 20개(1001~1020)
- 대표 변형 5개 × 시드 1001~1005:
  - `MAX_CONTRIBUTION~fx:react`
  - `MAX_CONTRIBUTION~inv:SE~hire:2pt@30`
  - `LATE_OK~inv:SE~hire:3pt@30`
  - `MAX_CONTRIBUTION~inv:SE~hire:2pt@22+3pt@36`
  - `MAX_CONTRIBUTION~inv:SE~hire:2pt@30~scout:early`
- 시나리오: `OPERATIONS_SCENARIO_IDS` 전부
- 설정·실행은 `runD03`(`src/engine/sim/d03.ts`)과 똑같이 한다.
  - 설정: `withLateMode(loadScenario(id), 'base')`
  - 정책: `policyById(policyId)`
  - 실행: `simulate(config, policy, seed, observe)`
- 변형 이름은 모두 `d03PolicyIds('base')` 안에 있어야 한다. 하나라도 없으면 종료 코드 2를 낸다.

**규칙 1 묶음** — 파일 `tests/golden/rules1-run.tsv`, 400회
- `SCENARIO_IDS` × `SIM_POLICIES` × `SIM_SEEDS`. `run.mjs run`의 기본 400회와 같다.
- 설정은 `loadScenario(id)`이고 `withLateMode`는 쓰지 않는다. `sim.ts`의 `runSuite`와 같다.
- 탐침 칸은 두지 않는다(아래 형식 참고).

### 3. 해시

- 모든 해시는 JSON 문자열을 UTF-8 바이트로 바꾼 것의 sha256이고, 소문자 16진 64자로 적는다.
- `runHash` = sha256(`JSON.stringify(run)`)
- `stateHash` = sha256(`JSON.stringify(rest)`). 여기서 `const { meta, ...rest } = state`다.
  - 키를 다시 정렬하지 않는다. 저장(`src/engine/save.ts`의 `JSON.stringify`)과 같은 삽입 순서 직렬화다.
  - 로그(`log`)도 넣는다.
- `probeHash`(rules-2 묶음만): `simulate`의 넷째 인수 `observe(opened)`에서 만든다.
  - `opened.day % 7 === 0`인 날만 아래 값을 차례로 한 sha256에 넣는다. 설정은 `cfg = { ...config, seed }`다.
  - 탐침은 `planState`와 읽기 함수만 부른다. `opened`를 바꾸지 않는다.
  1. ACTIVE·IN_PROGRESS 계약마다 `planState(opened, cfg, [{ id: 'GOLDEN-CANCEL', type: 'CANCEL_CONTRACT', contractId }])`를 부른다. 그 `results`와, `meta`를 뺀 `state`를 넣는다.
  2. `planState(opened, cfg, [{ id: 'GOLDEN-K2U', type: 'EXCHANGE_CURRENCY', direction: 'KRW_TO_USD', usdAmountMinor: cfg.operations.fx.lotUsdMinor }])`의 `results`와, `meta`를 뺀 `state`를 넣는다.
  3. 다음 읽기 함수의 결과를 넣는다. 인수는 모두 기본값이다.
     - `paymentDefaultStatus(opened, cfg)`
     - `fundsPosition`(USD, KRW 각각)
     - `cashReservations(opened, cfg)`
     - `upcomingPayments`
     - `campaignSummary(opened, cfg)`
     - `marketTable(opened, cfg)`
     - 모든 계약의 `contractReport(opened, c)`
     - `exchangePreview(opened, cfg, d, cfg.operations.fx.lotUsdMinor)`(두 방향 모두)
   - `quotePreview`는 비싸서 넣지 않는다.
   - 함수마다 서명은 지금 코드를 그대로 따르고, 결과 보고에 실제로 부른 꼴을 적는다.
- **저장 왕복**(두 묶음 모두): 실행마다 마지막 상태로 다음을 확인한다.
  1. `serializeSave(state)`로 저장한다.
  2. `deserializeSave(text, { config, dataVersion: config.dataVersion, rulesVersion: config.rules.rulesVersion })`로 불러온다. 화면(`src/ui/session.ts:35`)과 같은 인수다.
  3. 다시 `serializeSave`한다. 처음과 바이트가 같아야 한다.
  - 다르거나 불러오기가 예외를 내면 그 줄과 이유를 출력하고 종료 코드 1을 낸다.
- **ICU 확인**: 시작할 때 `(1234567.5).toLocaleString('ko-KR') === '1,234,567.5'`인지 본다. 아니면 원인을 적고 종료 코드 2로 끝낸다.
  - 표준 오류에 `process.versions.node`와 `process.versions.icu`를 낸다.

### 4. 골든 파일 형식

**첫 세 줄**
- 첫째 줄: `# scitrade engine golden v1 (<rules-2 | rules-1>)`
- 둘째 줄: `#`로 시작하는 설명 한 줄. 무엇을 해시하는지와 만든 명령을 적는다.
- 셋째 줄(머리 줄)
  - rules-2: `scenarioId<TAB>policyId<TAB>seed<TAB>runHash<TAB>stateHash<TAB>probeHash`
  - rules-1: `scenarioId<TAB>policyId<TAB>seed<TAB>runHash<TAB>stateHash`

**자료 줄**
- 넷째 줄부터 실행마다 한 줄이다.
- 칸은 탭으로 나눈다. seed는 10진 정수, 해시는 `^[0-9a-f]{64}$`다.
- 줄 끝은 LF이고, 마지막 줄 뒤에도 LF를 둔다.
- 줄 순서는 `JSON.stringify([scenarioId, policyId, seed])` 문자열의 비교 순서다(`d03.ts`의 `ordered`와 같은 키).
- 같은 키가 두 번 나오거나, 자료 줄이 0개이거나, 형식을 어기면 종료 코드 2다.

### 5. 모드와 종료 코드

종료 코드: 같음 0, 다름 1, 사용법·입력·실행 오류 2.

- **기본(비교)**
  - 두 골든 파일을 모두 읽는다.
  - 머리 줄·형식·집합 검사를 시뮬레이션 **전에** 한다. 어긋나면 돌리지 않고 바로 2를 낸다.
  - 같은 실행을 다시 돌려 비교한다.
  - 같으면 0을 내고 `엔진 골든 일치: rules-2 N회, rules-1 M회`를 출력한다.
  - 다르면 1을 낸다. 다른 줄을 앞에서 10줄까지 출력하고, 줄마다 어느 해시가 다른지 적는다. 끝에 요약 한 줄 `다른 줄 N개 (runHash a, stateHash b, probeHash c)`를 출력한다.
- **`--write`**
  - 두 골든 파일을 다시 쓴다.
  - `git diff --stat -- src data schemas`가 빈 상태에서만 쓴다.
  - 변형 시험 중에는 쓰지 않는다.
  - 마지막 `--write` 뒤에 4절 확인을 다시 돈다.
- **`--golden PATH`**
  - 그 파일 하나와 비교한다(시험용). 그 파일에 적힌 실행만 돌린다.
  - 실행 집합은 해당 묶음의 부분 집합이어야 한다.
  - 기본 경로(realpath로 같은 파일 포함)를 쓸 때는 실행 집합이 묶음과 **정확히 같아야** 한다. 줄을 지워 검사를 약하게 만드는 것을 막는 장치다.
- **`--dump DIR`**
  - 선택한 실행마다 `DIR/<scenarioId>__<policyId>__<seed>.run.json`과 `.state.json`(`meta` 뺀 것, 같은 직렬화)을 쓴다.
  - DIR이 저장소 루트 안이면 종료 코드 2다.
  - 비교와 함께 쓸 수 있다.
- **`--workers N`**
  - 기본값은 `Math.min(os.availableParallelism(), 8)`이다.
  - 묶음의 실행 키 목록(정렬 순서)을 워커 수로 돌아가며(`i % N`) 나눈다. 결과는 키로 모아 정렬한다.
  - 워커 수가 달라도 결과가 같아야 한다.
- 실행 횟수와 걸린 시간은 표준 오류로 낸다.

### 6. 시험 `tools/check_rules2_golden.test.mjs` (`node --test`)

- 자식 실행은 `check_bundle_size.test.mjs`의 `cliRun`처럼 한다.
  - `spawnSync(process.execPath, …, { stdio: ['ignore', outFd, errFd] })`로 부르고, 출력은 `os.tmpdir()` 아래 임시 파일로 받는다.
  - Codex 샌드박스에서는 파이프가 막힐 수 있기 때문이다.
- 임시 골든은 `os.tmpdir()` 아래에 만든다. 기본 rules-2 골든에서 `IDLE`·1001 줄과 `MAX_CONTRIBUTION`·1001 줄을 뽑는다.

| 번호 | 조작(`--golden` 임시 파일) | 기대 결과 |
|---|---|---|
| 1 | 그대로 | 0 |
| 2 | `stateHash` 마지막 글자를 다른 16진 글자로(0↔1) | 1, 출력에 그 줄이 나옴 |
| 3 | `runHash` 마지막 글자를 같은 방식으로 | 1 |
| 4 | `probeHash` 마지막 글자를 같은 방식으로 | 1 |
| 5 | 묶음에 없는 정책 줄을 넣음 | 2 |
| 6 | 같은 줄을 두 번 넣음 | 2 |
| 7 | 해시에 16진 밖 글자를 넣음 | 2 |
| 8 | 머리 줄을 깨뜨림 | 2 |
| 9 | `--dump`를 저장소 안 경로로 | 2 |
| 10 | `--dump`를 tmpdir로 | 0, 파일 4개(실행 2개 × run·state) |

- 순수 함수 시험(`tools/rules2_golden_lib.mjs`를 직접 import)
  - 기본 경로의 ‘집합이 정확히 같아야 함’: 줄 하나가 빠지면 거부, 묶음 밖 줄이 하나 더 있으면 거부.
  - 워커 분할: 키 목록을 1·4개로 나눴다가 합치면 같다.
- 탐침 불변: 실행 하나를 탐침 있이·없이 돌려 `runHash`·`stateHash`가 같다.
- 시험 하나가 30초를 넘지 않게 한다. 허브 사본에서 2줄 비교는 약 3초였다.

### 7. `tools/ai/review_checks.sh`

- 두 줄을 더한다. 자리는 크기 검사 `if/else` 블록의 `fi`(:48) 뒤, 빌드 성공 여부와 상관없이 늘 도는 자리다.
  - `run node tools/check_rules2_golden.mjs`
  - `run node --test tools/check_rules2_golden.test.mjs`
- 다른 줄은 바꾸지 않는다. `--check` 모드의 검사 수는 14종에서 16종이 된다.
- `--check` 모드의 ‘작업 트리 변화 없음’ 검사가 그대로 통과해야 한다.

### 8. 골든 만들기와 확인

1. `node tools/check_rules2_golden.mjs --write`
2. 비교 모드를 `--workers 1`과 `--workers 4`로 돌린다. 둘 다 0이어야 한다.
3. **허브 사본 값과 대조**(원래 다섯 칸)
   - `tail -n +4 tests/golden/rules2-d03.tsv | cut -f1-5 | sha256sum`이 `684c9e2b8186617aaf94676372b39fb56b915dbb4c7b4bccc26c34a5f90c43e2`와 같아야 한다.
   - `IDLE`/1001: `runHash` `aa46642bda83f6a9168cae26c63aef2c0a42402c56a92b373c662b90f8a776a5`, `stateHash` `e85167d3ea527b5e33542cacf592e5a571313e1dd27f11811b77441af6a30bac`
   - `MAX_CONTRIBUTION`/1001: `runHash` `c97f3ec501b01fcf8b189fe8c6e69e3a938f5b68a2543f95f86c38fc5a653ed6`
   - 하나라도 다르면 검사기를 값에 맞추지 말고 멈춰 보고한다. 해시 정의가 3절과 다른지부터 확인한다.
4. 결과 보고 초안을 쓴다.
5. `python3 tools/build_package.py --manifest-only`
6. `review_checks --check`
7. 출력을 보고에 붙인다.
8. `--manifest-only`를 다시 하고 `validate_data`를 돌린다.
   - `build_package.py`나 `validate_data.py`가 새 파일을 거부하면 고치지 말고 멈춰 보고한다. 허브 사본에서는 받았다.

## 변형 시험

- 각 변형은 임시로 고치고, 비교 모드를 돌린 뒤 되돌린다.
- 결과는 5절의 요약 줄로 적는다.
- 기대와 다르면 변형이나 검사기를 바꾸지 말고, 측정한 줄 수와 함께 보고한다.
- 금액은 최소 단위다(USD 센트, 원).
- 괄호 안 숫자는 허브 사본 측정값이고, 판정 기준은 ‘기대 결과’ 칸이다.

| 번호 | 변형(임시) | 기대 결과 |
|---|---|---|
| 1 | `src/engine/operations.ts` `processPaymentDefault`의 ‘경영 실패:’ 로그 문장 한 글자 | rules-2: `runHash`는 같고 `stateHash`가 다름(40줄, `IDLE`·`NO_FX`). `probeHash`는 무엇이 나오든 적는다 |
| 2 | 같은 함수의 `DefaultEvent.usdAvailableMinor`에 `+ 1` | rules-2: `runHash`는 같고 `stateHash`가 다름(48줄). 탐침 상태에도 사건이 들어가므로 `probeHash`도 다를 수 있다 |
| 3 | `src/engine/sim/operations-policy.ts:129`의 `c.contribution <= 0`을 `<= 10000`으로 | rules-2: `runHash`·`stateHash` 다름(85줄, `IDLE`을 뺀 전부). 수락된 후보의 최소 기여는 4,817이라 1,000 이하 문턱은 아무것도 바꾸지 않는다 |
| 4 | `dailyKrwDue`(operations.ts:219-223) 결과에 `+ 100000` | rules-2: 두 해시 모두 다른 줄이 있음(65줄), `IDLE`·`NO_FX`는 `stateHash`만 다름(40줄). 1원으로는 묶음 올림 경계를 넘지 않는다 |
| 5 | `cancelContract`(engine.ts:766-797)의 취소 로그 문장 한 어미 | rules-2: `runHash`·`stateHash`는 같고 `probeHash`만 다름(약 25줄). rules-1: `stateHash`가 다른 줄이 있고 `runHash`는 같음(약 23줄) |
| 6 | `cancelContract`의 `lot.contractId = null`을 `if (!config.operations)` 안에 넣음 | rules-2: `probeHash`만 다름 |
| 7 | `deserializeSave`가 마지막 상태에 있는 칸 하나를 빠뜨리게 함(어느 칸인지 보고에 적음) | 저장 왕복 실패, 종료 코드 1 |
| 8 | 기본 골든 파일에서 줄 하나를 지움 | 종료 코드 2 |

- 모든 변형을 되돌린 뒤 `git diff --stat -- src data schemas`가 빈 값임을 확인해 보고에 적는다.

## 범위 보고 (결과 보고에 표로)

**① 명령 종류**
- `EngineCommand` 14종 전체를 나열한다(types.ts:506-517 + `OperationsCommand`).
- 종류마다 rules-2 묶음의 APPLIED 합계를 적는다. `appliedByType`에 키가 없는 종류도 0으로 적는다.

**② 명령이 아닌 경로(rules-2 묶음 합계)**
- `metrics.operations.exchanges`의 방향별 `usdMinor`·`krwMinor` 합
- `state.obligations` 가운데 USD 의무 수, 끝의 `unpaidAtEnd` USD 합, `failureObligation.currency === 'USD'`인 실행 수
- 취소 계약 수, `state.delayDecisions` 수
- 실패 실행 수
- 실패 기록에 대해: `optionalKrwSpendBeforeFirstUnpaid` 행 수, `usdCommitmentsSinceIncurred`의 kind별 행 수
- 탐침 적용 수: 취소, 원화→달러

**③ 0인 칸마다**
- rules-2에서 그 경로를 지키는 기존 단위 시험 파일과 시험 이름을 적는다.
- ‘없음’, ‘읽기만’, ‘탐침이 지킴’을 구분한다.

**④ 걸린 시간**
- 두 묶음 각각, 워커 1개와 4개.

## 완료 조건

1. `git diff --stat <BASE> -- src data schemas`가 빈 값이다.
2. 다음이 모두 나온다.
   - 비교 모드 0
   - 시험 통과
   - 8절의 허브 사본 값 대조 일치
   - 변형 8개가 기대 결과대로
3. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`의 결과가 `검사 16종, 실패 0종 (모드: 확인)`이다.
4. 결과 보고 `docs/ai/tasks/results/TASK-0062a.md`를 쓴다.
5. 규칙 1의 400회 `cmp`는 허브가 검수 때 함께 비교한다.

## 고칠 수 있는 파일

- 새 파일
  - `tools/rules2_golden_lib.mjs`
  - `tools/rules2_golden_entry.ts`
  - `tools/check_rules2_golden.mjs`
  - `tools/check_rules2_golden.test.mjs`
  - `tests/golden/rules2-d03.tsv`
  - `tests/golden/rules1-run.tsv`
  - `docs/ai/tasks/results/TASK-0062a.md`
- 고침
  - `tools/ai/review_checks.sh`(두 줄)
  - `MANIFEST.json`(생성만)

## 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 골든 묶음 두 개의 정의, 해시 범위, 탐침에서 실제로 부른 함수 꼴, 골든 파일 첫 세 줄
- Node·ICU 판본, 걸린 시간, 워커 수별 결과 일치
- 허브 사본 값 대조 결과
- 범위 보고 표
- 변형 표와 요약 줄, 시험 출력
- `review_checks`의 `검사 N종, 실패 M종 (모드: 확인)` 줄과 그 아래 변경 요약
- 0062~0064가 쓸 진단 절차: 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고 `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다.
- 범위 밖에서 발견한 것, 질문
