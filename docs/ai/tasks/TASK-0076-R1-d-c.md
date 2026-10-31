# TASK-0076-R1 첫 화면 분할 구현: D(지연 전용 함수 이동) + C(운영 자료 지연)

- **지위: 승인(허브, 2026-10-31, 개정 1).** 허브 사전 검수 10건(`PRECHECK-0076-R1-HUB-2026-10-31.md`) 반영 확인. 허브 재확인: src/ui 비시험 파일의 값 동적 import는 main.ts:47·48, culture.ts:67 셋뿐이다(나머지는 타입 위치). 관문은 다시 옮기지 않는다.
- 근거
  - 허브 결정 H39-1~H39-4(`HUB-DECISIONS-2026-10-16.md:1090-1109`)
  - 1회차 결과 `docs/ai/tasks/results/TASK-0076.md`: 후보별 탐침, C·D 경계, 진행 중 경로 표, 부록 1~4
  - `docs/ai/tasks/TASK-0076-first-screen-split.md` 3절(D·C 규칙)
  - `docs/ai/tasks/TASK-0073-engine-ops-split.md` 3.1~3.5(등록 장치와 시험의 본보기, 허브 개정 1)
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **목표(H39-2)**: R1 뒤 첫 화면 여유 **≥ 7,900 B**. 최종 판정 허용 오차는 ±64 B다. 한도가 140,000 B이므로 첫 화면 gzip ≤ 132,100 B(+64)다.
  - 1회차 탐침: D −820 B, D+C −2,690 B(첫 화면 132,034 B)
- **성격: 동작 불변 정리다.** 게임 결과, 문구, 저장 형식, 화면 HTML(BASE_HTML 세 sha)은 바이트로 그대로다. 바뀌는 것은 **운영 시나리오 진입·운영 저장 불러오기에 자료 관문이 하나 더 생기는 것**뿐이다.
  - 허용하는 동작 변화 하나(C5): 열 수 없는 **옛 판본 운영 저장**(형식 6 등)도 이제 운영 묶음을 먼저 받는다. 관문이 성공하면 같은 옛 형식 거절 문구가 나오고, 관문이 실패하면 경고만 나온다(상태 보존). 4-6 (마)가 둘 다 단언한다.
- **관문은 다시 옮기지 않는다(C7).** 5-5 예산에 못 미치면 마무리하지 않고 멈춰 보고한다. 허브는 이 지시서에 대해 관문(여유 ≥ 7,900 B, ±64 B)을 측정 뒤 다시 낮추지 않는다.
- 범위 밖: 후보 A′·B, 새 기능, TASK-0077(select에 새 시나리오), 측정
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 둘이다.
  1. 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다.
  2. 판본 2 SHA256SUMS 재현은 판본 2 측정 시드 1061~1100의 R1·R2를 다시 돌린다.

## 0. 먼저 읽을 것

1. 1회차 결과의 ‘C의 구체적 경계’, ‘D의 자동 탐색과 이동’, ‘진행 중 처음 필요한 경로와 동작 위험’, 부록 4(반복 실행 스크립트)
2. `src/content/scenario.ts`
   - `:2` `market_rules.json` import(이 파일에서만 쓴다)
   - `:53` `TITLES`(M1 세 레코드의 제목 대체값)
   - `:138` `resolveScenarioRecord`
   - `:389` `titleKo: s.title_ko ?? TITLES[id] ?? id`
   - `:489-492` `toOperations`의 `marketRules`
   - `:546`·`:565`·`:570` `loadRiskProfile`·`riskProfiles`·`loadCreditProfile`
3. `src/ui/main.ts`
   - `:43` `SCENARIO_TITLES`: 첫 화면에서 모든 시나리오에 `loadScenario`를 부른다.
   - `:411` select
   - `:1550` 운영 판별(`loadScenario(id).operations`)
   - `:1600-1615` `loadText`
   - `:1504-1512` 브라우저 저장
   - `:1622-1626` 한가할 때 미리 받기
4. `src/ui/session.ts:27-39`(`loadSaveText`, `LOADABLE_SCENARIO_IDS` 엿보기)
5. `vite.config.ts:80`: `data` 그룹 정규식. `market_rules.json`도 지금은 이 그룹에 든다.
6. 노드 진입점(작업자 스레드 포함)
   - `src/engine/sim/run.mjs` → `cli.ts`(작업자는 `runnerImport`로 다시 평가한다)
   - `tools/check_rules2_golden.mjs`·`check_rules3_golden.mjs` → `rules2_golden_entry.ts`·`rules3_golden_entry.ts`(작업자 포함)
   - vitest: `vite.config.ts` `test`(지금 `setupFiles` 없음)
   - `src/engine/m2a5-testkit.ts`, `src/ui/main-testkit.ts`

## 1. D: 지연 전용 함수 이동

### 1.1 대상(1회차 표)

| 함수 | 원래 | 새 파일 | 보조 |
|---|---|---|---|
| `creditTermOptions` | `src/engine/readers.ts:262` | `src/engine/readers-lazy.ts` | 없음 |
| `receivableSchedule` | `src/engine/reports.ts:410` | `src/engine/reports-lazy.ts` | `reports.ts`의 `compareText`(:326)에 `export`만 더함 |
| `marketTable` | `src/engine/market.ts:95` | `src/engine/market-lazy.ts` | `market.ts`의 `halfUp`(:7)에 `export`만 더함 |
| `culturePreview` | `src/engine/previews.ts:57` | `src/engine/previews-lazy.ts` | 없음 |

### 1.2 규칙

- 함수 몸은 옮기기만 한다. AST 원문 범위가 이동 전후 같음을 결과 보고에 적는다(1회차 방식).
- 원래 파일에서 **재수출하지 않는다.**
- 보조 함수는 복제하지 않고 `export`만 더한다.
- 1회차의 탐지 스크립트(부록 4)를 작업 뒤 트리에 다시 돌린다. ‘index 청크에서 지연 청크만 쓰는 export’가 0개(또는 새로 생긴 것과 그 이유)임을 적는다.

### 1.3 import를 바꾸는 곳(이름 기준 grep, 개정 시점 전부)

```
grep -rn "\bcreditTermOptions\b\|\breceivableSchedule\b\|\bmarketTable\b\|\bculturePreview\b" src tools --include=*.ts --include=*.mjs | grep "import\|export {"
```

- 제품: `src/ui/market.ts:5`, `src/ui/culture-panel.ts:8`, `src/engine/path11-readers.ts:4-5`
- sim: `src/engine/sim/operations-policy.ts:7`
- 도구: `tools/rules2_golden_entry.ts:10`(H39-4), `tools/rules3_golden_entry.ts:10, 14`
- 시험(import 줄만)
  - `src/ui/culture.test.ts:6`
  - `src/ui/m2a5-trade-ui.test.ts:6`
  - `src/engine/m2a5-risk-credit-v2.test.ts:7`
  - `src/engine/m2a5-risk-default-v2.test.ts:12`
  - `src/engine/m2a5-risk-credit.test.ts:9`
  - `src/engine/m2a-culture.test.ts:13`
  - `src/engine/path11-readers.test.ts:10-11`
  - `src/engine/m2a5-market.test.ts:3`
  - `src/engine/m2a5-risk-fx.test.ts:6`
- 한 줄에 다른 기호가 함께 있으면 그 기호는 원래 경로에 남기고 줄을 나눈다. 단언은 바꾸지 않는다.

## 2. C: 운영 자료 지연

### 2.1 장치(1회차 C-2 탐침 구조를 제품으로)

- **첫 화면 쪽은 최소로, 검사는 지연 쪽에(C7).** 1회차 C 탐침의 등록부는 두 줄이었다. 남는 여유가 약 130 B뿐이므로 첫 화면에 들어가는 코드와 문자열을 최소로 한다.
  - **`src/content/ops-data.ts`(첫 화면)**: 다음 넷만 둔다.
    - `export const OPS_DATA_MISSING`: 짧은 한국어 문구 상수 하나(예: `'운영 자료 없음'`). 이 문구가 미등록 오류의 유일한 표지다.
    - `opsData()`: 미등록이면 `throw new Error(OPS_DATA_MISSING)`. 오류 클래스는 새로 만들지 않는다.
    - `setOpsData(value)`: 값을 넣기만 한다. 검사는 하지 않는다.
    - 시험 전용 `resetOpsDataForTest()`: 제품에서 부르지 않으므로 빌드에서 빠진다(4-8 원천 검사).
  - **대체값이 없다.** 미등록일 때 빈 자료나 기본값으로 빠지지 않는다.
  - **재등록 검사는 지연 쪽에 둔다.** 아래 진입 모듈이 이미 다른 값이 들어 있으면 예외를 내고, 같은 값이면 아무것도 하지 않는다. 진입 모듈은 자기 정적 import 값만 넣으므로, 다른 값은 시험에서만 생긴다.
  - 미등록 판정은 **문구 비교**로 한다: `error instanceof Error && error.message === OPS_DATA_MISSING`. 모듈 인스턴스가 달라도(C3, `vi.resetModules`) 같은 결과가 나온다.
- **자료 진입 모듈** `src/content/ops-data-entry.ts`(지연): `market_rules.json`을 정적 import한다. 평가될 때 재등록 검사를 한 뒤 `setOpsData`를 부른다.
- `scenario.ts`
  - `market_rules.json`의 정적 import를 지우고, `:489-492`·`:546`·`:565`·`:570`은 `opsData()`를 읽는다.
  - 운영이 없는 시나리오의 `loadScenario`는 `opsData()`를 부르지 않는다. 그래서 등록 없이도 그대로 동작한다.
- **가벼운 판별 둘**(자료 없이, `scenarios.json`과 `TITLES`만 읽음)
  - `scenarioTitle(id)`: `title_ko ?? TITLES[id] ?? id`. `loadScenario(id).titleKo`와 같은 순서다(1회차 ‘현재 코드와 지시서의 차이’).
  - `isOperationsScenario(id)`: 상속을 푼 레코드에 `operations`가 있으면 참이다.
- `vite.config.ts:80`: `data` 그룹 정규식이 `market_rules.json`도 제외하게 한다. 1회차에 따르면 그룹에 남기면 첫 화면 data에 자료가 남는다.
- **화면 관문**
  - `ui/ops-screens.ts`가 `ops-data-entry`를 import한다. 운영 화면과 운영 자료가 같은 약속 하나(`ensureOpsScreens`)로 오며, 첫 시도·재시도 한 번·`ScreenLoadExhaustedError` 규칙을 그대로 쓴다.
  - `main.ts:43`: `SCENARIO_TITLES`는 `scenarioTitle`을 쓴다.
  - `main.ts:1550`: 판별은 `isOperationsScenario(id)`를 쓰고, 운영이면 `ensureOpsScreens()`를 기다린 뒤 `startScenario`를 부른다.
  - `main.ts:1600-1615` `loadText`
    1. JSON 엿보기로 `scenarioId`를 읽는다. JSON 오류와 알 수 없는 시나리오는 지금 문구로 끝낸다.
    2. `isOperationsScenario(scenarioId)`면 `ensureOpsScreens()`를 기다린다. **`LOADABLE_SCENARIO_IDS`의 `SCENARIO_M2_OPS_CREDIT`도 여기에 든다.**
    3. 그다음 `loadSaveText`를 부른다.
    4. 관문이 실패하면 `screenLoadWarning(error, fromSave)`로 끝내고 상태·오늘 할 일·select를 보존한다.
  - `session.ts`의 `loadSaveText`: `catch`가 미등록 오류(문구 비교)를 `errorKo`로 바꾸지 않고 다시 던진다. 관문이 지켜지면 닿지 않는 길이므로, 닿으면 ‘깨진 저장’으로 숨지 않고 결함으로 드러나게 한다.
- **노드 진입점 등록**(작업자 스레드 포함, TASK-0073 허브 개정 1의 교훈)
  - 다음 모듈이 `ops-data-entry`를 import한다. 등록은 **모듈 평가 때** 일어나야 한다. 그래야 작업자가 진입 모듈을 다시 평가할 때도 등록된다.
    - `src/engine/sim/cli.ts`
    - `tools/rules2_golden_entry.ts`, `tools/rules3_golden_entry.ts`
    - `src/engine/m2a5-testkit.ts`
    - vitest 준비 파일(`vite.config.ts` `test.setupFiles`에 새 파일 하나)
  - **vitest 준비 파일이 덮는 범위(C3·C9)**: 시험 파일이 정적으로 import한 모듈 인스턴스만 덮는다.
    - `startUi`(`main-testkit.ts:10`)는 `vi.resetModules()`를 부른다. vitest 5.0.3은 이때 준비 파일이 평가한 모듈까지 다시 평가되게 한다.
    - 그래서 `startUi` 뒤의 화면 쪽 `scenario`·`ops-data`는 **새 인스턴스이고 미등록**으로 시작한다. 등록되는 길은 `ops-screens` → `ops-data-entry`뿐이다.
    - 이것이 화면 관문 시험의 전제다.
  - 그 밖에 운영 시나리오를 노드에서 여는 진입점이 grep(2.3)에서 나오면 같은 방식으로 더하고 결과 보고에 적는다.

### 2.2 바꾸지 않는 것

- `scenarios.json` 등 다른 자료는 늦추지 않는다(1회차 경계).
- `ALL_SCENARIO_IDS`, `LOADABLE_SCENARIO_IDS`, select의 option 목록과 순서, 제목 문구
- 저장 형식, 저장 바이트

### 2.3 영향 범위(grep 전문을 결과 보고에 붙이고 줄마다 판단)

```
grep -rn "market_rules.json\|loadRiskProfile\|loadCreditProfile\|riskProfiles\b" src tools --include=*.ts --include=*.mjs
grep -rln "loadScenario" src tools --include=*.ts --include=*.mjs | grep -v "\.test\."
grep -rn "import.meta.glob\|subtle.digest\|createHash\|readdirSync" src tools --include=*.test.ts --include=*.test.mjs
grep -rn "ops-screens\|lazyScreen\|ensureOpsScreens" src --include=*.ts
```

- `import('../content/scenario')`·`import('../content/ops-data')`를 쓰는 시험도 grep해 적는다. `startUi` 뒤 새 `scenario`로 관문 없이 운영 시나리오를 읽는 시험이 없어야 한다(C3).
- 1회차 부록 1에서 C·D 열이 ‘고칠’인 줄(`main.ts:1550`·`:1607`, `scenario.ts:2`, D의 import 여덟 줄)은 모두 2·3절 허용 파일에 들어 있다.
- `path11-readers.test.ts`의 4.1-10 (나)(빌드 청크 문자열)는 표지 문자열이 `ops-screens-*.js`에 있다고 단언한다.
  - C·D 뒤 청크 배치가 바뀌어 표지가 다른 **지연** 청크로 가면, 단언을 ‘`dist.lazy`에 속하고 첫 화면 청크에 없음’으로만 넓힌다.
  - 첫 화면 제외 단언은 약하게 하지 않는다.
  - 이 경우가 생기면 결과 보고에 적는다.

## 3. 고칠 수 있는 파일

| 파일 | 허용 범위 |
|---|---|
| 새 `src/engine/readers-lazy.ts`·`reports-lazy.ts`·`market-lazy.ts`·`previews-lazy.ts` | 1.1 함수 이동 |
| `src/engine/readers.ts`·`reports.ts`·`market.ts`·`previews.ts` | 대상 함수 삭제, `compareText`·`halfUp`에 `export` |
| 1.3의 제품·sim·도구·시험 줄 | import 경로만 |
| 새 `src/content/ops-data.ts`·`ops-data-entry.ts` | 2.1 |
| `src/content/scenario.ts` | `market_rules.json` import 제거, `opsData()` 읽기, `scenarioTitle`·`isOperationsScenario` |
| `src/ui/main.ts` | `:9` import 줄(`scenarioTitle`·`isOperationsScenario` 추가, C1), `:43`, `:1550`, `loadText`만 |
| `src/ui/session.ts` | `OPS_DATA_MISSING` import 한 줄과 `catch`의 다시 던지기만 |
| `src/ui/ops-screens.ts` | `ops-data-entry` import 한 줄 |
| `vite.config.ts` | `data` 정규식, `test.setupFiles` |
| 새 vitest 준비 파일 | `ops-data-entry` import |
| `src/engine/sim/cli.ts`, `tools/rules2_golden_entry.ts`, `tools/rules3_golden_entry.ts`, `src/engine/m2a5-testkit.ts` | `ops-data-entry` import |
| `src/engine/path11-readers.test.ts` | 2.3의 조건부 완화만 |
| `src/engine/m2a5-risk-credit.test.ts` | `:461` 조건에 `'./readers-lazy.ts'`·`'./reports-lazy.ts'`를 더하는 것만(C2·C4). 단언 내용은 그대로 |
| 새 시험 파일 | 4절 |
| `docs/ai/tasks/results/TASK-0076.md`(R1 절), `MANIFEST.json` | 결과, 생성 명령 |

그 밖의 파일은 고치지 않는다. 필요하면 멈추고 보고한다.

## 4. 새 시험(2001 이상 시드)

1. **D 이동 확인**
   - 1.2의 탐지 스크립트 결과를 시험이나 일회 확인으로 남긴다.
   - **탐지 결과는 허용 목록 `{ setOpsData }`와 정확히 같아야 한다(C8).** 등록 함수는 성격상 지연 쪽(`ops-data-entry`)에서만 부르기 때문이다. 다른 이름이 나오면 실패다.
   - TASK-0075 4.1-10 (가) 방식의 `main.ts` 정적 닫힘에 새 `*-lazy.ts` 넷과 `ops-data-entry.ts`가 없음을 단언한다.
   - 음성 대조: 메모리 사본에서 `readers.ts`에 `export { creditTermOptions } from './readers-lazy'`를 넣으면 거부해야 한다.
   - `m2a5-risk-cost.test.ts:941`, `m2a5-risk-fx.test.ts:636`, `save-v7.test.ts:187`의 glob이 새 `*-lazy.ts` 파일을 덮는지 결과 보고에 적는다(C4).
2. **가벼운 판별의 같음**(자료 등록 상태에서)
   - `LOADABLE_SCENARIO_IDS`와 `EXPERIMENT_SCENARIO_IDS`의 모든 ID에 대해 다음을 단언한다.
     - `scenarioTitle(id) === loadScenario(id).titleKo`
     - `isOperationsScenario(id) === (loadScenario(id).operations !== null)`
   - M1 세 시나리오(`TITLES` 대체)를 포함한다.
3. **미등록 예외**(엔진 시험, 정적 인스턴스. `resetOpsDataForTest` 뒤, `afterEach`에서 이전 값으로 `setOpsData`를 되돌린다)
   - 운영 시나리오 `loadScenario`, `loadRiskProfile`, `loadCreditProfile`, `riskProfiles`가 `OPS_DATA_MISSING` 문구의 오류를 낸다.
   - 진입 모듈의 재등록 검사: 다른 값을 넣으려 하면 예외, 같은 값이면 무시
   - 운영 저장의 `loadSaveText`는 `errorKo`가 아니라 예외를 다시 던진다.
   - 기본 시나리오와 M1의 `loadScenario`는 등록 없이 성공한다.
4. **기본 새 게임은 자료 청크 없이**(`code-split.test.ts` 방식)
   - **화면 시험 4~6의 공통 규칙(C3·C9)**: 등록 상태는 `startUi` 뒤 `await import('../content/ops-data')`로 받은 **새 인스턴스**에서 읽는다. 오류 판정은 문구(`OPS_DATA_MISSING`)로 한다. 정적 import한 `ops-data`를 화면 시험에서 쓰지 않고, `resetOpsDataForTest`도 화면 시험에서는 쓰지 않는다.
   - `startUi` 첫 렌더가 성공한다.
   - 한가할 때 미리 받기 전까지 운영 묶음 호출 수가 0이다.
   - 기본 시나리오로 3일 진행해도 예외가 없다.
   - 첫 렌더 HTML은 BASE_HTML `first`와 같다.
   - 새 인스턴스의 `opsData()`가 미등록 오류를 낸다.
5. **운영 진입 실패와 재시도**(`lazy` 모의, 0073 3.5-3 계열)
   - (가) 시나리오 select로 운영 시나리오를 고르는데 운영 묶음 첫 시도가 실패한다 → 경고, 상태·오늘 할 일·select 보존, 새 인스턴스의 `opsData()`가 여전히 미등록 오류. 다음 시도에서 성공하면 진입하고, 그때는 등록되어 있다.
   - (나) 두 번 실패 → 새로 고침 안내(`ScreenLoadExhaustedError`), 상태 보존, 새 인스턴스의 `opsData()`가 여전히 미등록 오류(C10)
6. **운영 저장 불러오기 관문**
   - (가) 미리 받기 전에 운영 저장을 파일로 불러온다 → 관문을 기다린 뒤 정상으로 불러온다. `errorKo`가 없다. `loadSaveText` 호출이 관문 성공 뒤에 일어남을 호출 순서로 단언한다.
   - (나) 같은 경우를 브라우저 저장으로 한다. `SAVE_KEY`만 채운 경우와 `LEGACY_SAVE_KEY`만 채운 경우를 따로 본다.
   - (다) **`SCENARIO_M2_OPS_CREDIT` 저장**도 (가)와 같이 관문을 지난다. 이 ID는 `ALL_SCENARIO_IDS` 밖이지만 `LOADABLE`에 있다.
   - (라) 관문이 실패하면 경고를 띄우고 상태를 보존한다. 저장 내용은 읽지 않는다. 새 인스턴스의 `opsData()`가 여전히 미등록 오류다(C10).
   - (마) **옛 판본 운영 저장(C5)**: `code-split.test.ts`의 `opsSaveV6`를 쓴다.
     - 관문 성공 → 운영 묶음 호출 1회 뒤 옛 형식 거절 문구
     - 관문 실패 → 경고만, 상태 보존
7. **노드 진입점**: 골든 둘을 작업자 여러 명(기본값)으로 돌려 종료 0인지 본다. sim `run`과 판본 2 재현도 작업자 여러 명으로 돈다(5절 1~3).
8. **원천 검사**
   - **동적 import 닫힌 목록(C10)**: `src/ui`의 비시험 파일에서 값으로 쓰는 동적 `import()`의 대상이 정확히 `{ './ops-screens', './situation', './culture-panel' }`이다. 타입 위치의 `typeof import(...)`는 제외한다. AST로 센다. 그래서 자료를 다른 약속으로 받는 변형(V10)이 잡힌다.
   - `resetOpsDataForTest`가 `.test.ts`와 준비 파일 밖에서 불리지 않는다.
   - `market_rules.json`을 import하는 비시험 파일이 `ops-data-entry.ts` 하나다.
9. **첫 화면 표지**
   - `market_rules.json`에만 있는 문자열 하나를 고른다. `data`·`src`·다른 자료 전체를 grep해 다른 곳에 없음을 결과 보고에 보인다.
   - 빌드 뒤 그 문자열이 지연 청크에만 있고 첫 화면 청크에는 없음을 단언한다(TASK-0075 4.1-10 (나) 방식, 출력 `/tmp/T76-test-dist`, 끝에 지움).

## 5. 완료 조건

1. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다. 작업자 여러 명으로 돌린다.
2. `node src/engine/sim/run.mjs run`(시드 1001~1020)의 출력이 BASE와 `cmp` 동일해야 한다.
3. 판본 2 SHA256SUMS 다섯 개 재현(TASK-0071 9절 1 명령, 출력 `/tmp/T76-*`, 작업자 여러 명).
4. `npx vitest run` 전체 통과. `code-split.test.ts` `BASE_HTML` 세 sha는 그대로다.
5. **첫 화면 예산**: 깨끗한 트리 빌드 셋을 잰다.
   - (가) BASE
   - (나) D만
   - (다) D+C(작업 뒤)
   - 판정: (다)의 첫 화면 gzip ≤ 132,100 B + 64 B(여유 ≥ 7,900 B − 64 B)
   - **비교 기준(C6)**: D 몫 (나)−(가)는 1회차 D 단독 탐침 **−820 B**와 비교한다. C 몫 (다)−(나)는 1회차 조합 차이 **−1,870 B**(= −2,690 − (−820))와 비교한다. 차이가 ±64 B를 넘으면 원인을 적는다.
   - **탐침에 없던 비용(C7)**: 1회차 C 탐침에 없던 항목(문구 상수, 미등록 검사, 다시 던지기 비교, 재등록 검사)의 몫을 따로 적는다. 방법: (다)와, 같은 트리에서 그 항목들을 1회차의 두 줄 등록부로 되돌린 사본의 차이.
6. `npm run typecheck`, `npm run build`, `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py`, `python3 tools/test_validate_data.py` 통과
7. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`(18종)
8. 디스크
   - 모든 출력은 `/tmp/T76-*` 아래에 둔다.
   - 여유가 2 GB보다 작으면 `/tmp/T76-*`만 지운다. 그래도 모자라면 멈춘다.
   - 끝에 `ls -d /tmp/T76-*`가 비어야 한다.

## 6. 변형 시험

변형마다 어느 시험이 왜 실패하는지 한 줄씩 적는다. 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | `readers.ts`가 `creditTermOptions`를 재수출한다 | 4-1 정적 닫힘·탐지, 5-5 |
| V2 | `rules2_golden_entry.ts:10`을 고치지 않는다(옛 경로 import) | 5-1 |
| V3 | `main.ts:1550`이 `loadScenario(id).operations`로 판별한다 | 4-5 (가) |
| V4 | `loadText`가 관문 전에 `loadSaveText`를 부른다 | 4-6 (가) 호출 순서 |
| V5 | 저장 관문 판별이 `ALL_SCENARIO_IDS`만 본다(`OPS_CREDIT` 누락) | 4-6 (다) |
| V6 | `scenarioTitle`이 `TITLES` 대체를 빼먹는다 | 4-2, 4-4 BASE_HTML |
| V7 | `data` 정규식이 `market_rules.json`을 그대로 묶는다 | 4-9, 5-5 |
| V8 | `rules3_golden_entry.ts`가 `ops-data-entry`를 import하지 않는다 | 5-1(작업자) |
| V9 | `opsData()`가 미등록일 때 빈 자료를 돌려준다 | 4-3, 4-4 새 인스턴스 단언 |
| V10 | `ops-data-entry`를 `ops-screens`와 다른 약속(`import()`)으로 받는다 | 4-8 동적 import 닫힌 목록, 4-5 (나)·4-6 (라)의 새 인스턴스 단언 |
| V11 | `loadSaveText`의 `catch`가 미등록 오류를 `errorKo`로 바꾼다 | 4-3 |
| V12 | 재등록 검사를 첫 화면 `ops-data.ts`로 옮긴다 | 4-1 탐지(허용 목록 불일치), 5-5 탐침에 없던 비용 |
| V13 | 4-1 탐지 허용 목록에 `creditTermOptions`가 다시 나타난다(V1과 함께) | 4-1 |

## 7. 결과 보고

`docs/ai/tasks/results/TASK-0076.md`에 ‘R1’ 절을 더해 다음을 적는다.

- BASE
- 1.2 AST 대조와 탐지 스크립트 결과
- 1.3·2.3 grep 전문과 줄별 판단
- 등록 진입점 목록
- 4-9 표지 문자열과 그 고유성 grep
- 6절 변형 결과
- 5절 각 줄의 명령과 결과, 첫 화면 세 빌드 값

## 8. 멈춤 조건

- 3절 목록 밖 파일을 고쳐야 할 때
- 5-1~5-4가 어긋날 때
- 5-5 예산에 못 미칠 때. 이때 1회차 탐침값과 다른 원인을 적는다.
- 미등록 상태에서 운영 자료 없이 진행되는(대체값으로 조용히 빠지는) 경로가 보일 때
- `isOperationsScenario`·`scenarioTitle`이 어느 ID에서든 `loadScenario`와 다를 때

## 개정 1 처리표

| 지적 | 처리 |
|---|---|
| C1 허용 줄 | 3절: `main.ts:9` import 줄, `session.ts` import 한 줄 |
| C2·C4 원천 검사 조건 | 3절: `m2a5-risk-credit.test.ts:461` 조건에 lazy 파일 둘만 추가. 4-1: risk-cost·risk-fx·save-v7 glob이 새 파일을 덮는지 결과에 기록 |
| C3·C9 `vi.resetModules` | 2.1에 준비 파일이 덮는 범위와 화면 쪽 새 인스턴스 전제를 명시. 4-4~4-6 공통 규칙: 새 인스턴스를 `await import`로 받아 읽기, 문구로 판정, 화면 시험에서 reset 금지. 4-3은 정적 인스턴스 reset과 `afterEach` 복원. 2.3 grep에 `import('../content/scenario'·'ops-data')` |
| C5 옛 판본 운영 저장 | 성격에 허용 동작 변화로 명시. 4-6 (마): 관문 성공·실패 둘 다 단언 |
| C6 비교 기준 | 5-5: D 몫은 −820 B, C 몫은 −1,870 B와 비교 |
| C7 등록 계약 비용 | 2.1: 첫 화면 `ops-data.ts`를 상수·getter·setter·시험 reset 넷으로 최소화. 클래스 없이 짧은 문구 상수, 재등록 검사는 지연 진입 모듈로. 5-5에 ‘탐침에 없던 비용’ 측정. 머리에 ‘관문은 다시 옮기지 않는다’ 명시. V12 |
| C8 탐지 허용 목록 | 4-1: 탐지 결과 = `{ setOpsData }`. V13 |
| C10 V10 잡는 시험 | 4-8 동적 import 닫힌 목록(AST), 4-5 (가)·(나)·4-6 (라)에 새 인스턴스 미등록 단언 |
