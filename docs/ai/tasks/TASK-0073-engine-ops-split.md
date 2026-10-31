# TASK-0073 첫 화면 묶음에서 운영 엔진 떼기(동작 불변 분리)

- **지위: 승인(허브, 2026-10-30, 개정 1).** 세션 A 초안(21daa02)에 허브 검토 두 가지를 반영했다. 3.2에 작업자 스레드 등록을 넣었고, 6절에서 디스크가 모자랄 때 지우는 대신 멈추게 했다. 실행은 TASK-0072 병합 뒤에 한다.
- 근거
  - 범위 문서 `docs/ai/design/path11-engine-seam-2026-10/SCOPE.md` 2절·3절의 ①
  - 허브 검토(2026-10-30): ①을 먼저 한다. 첫 일은 조사다. 완료 조건은 다섯 가지다. 후보 B·C는 선택이다. iPad 실기기는 범위 밖이다.
  - STATUS 841: 엔진 지시서마다 첫 화면이 약 1.3 KB씩 는다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **성격: 동작 불변 정리다.** 게임 규칙, 값, 문구, 저장 형식, 화면 HTML은 바이트로 그대로여야 한다. 첫 화면 gzip만 줄어야 한다.
- 범위 밖
  - 새 규칙, 읽기 함수(SCOPE 1절, 지시서 ②), rules-4
  - 자료 값, 측정(판정표 시드 1061~1300으로 새로 돌리는 것)
  - iPad Safari 실기기 확인(병합 뒤 알파 점검표로 넘긴다)
  - 서비스 워커
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 둘이다.
  1. 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다.
  2. 9절 3의 판본 2 SHA256SUMS 재현은 판본 2 측정 시드 1061~1100의 R1·R2를 다시 돌린다. sha256만 비교하고 표 내용은 읽지 않는다.

## 0. 먼저 읽을 것

1. SCOPE.md 2.1~2.5. 특히 2.3의 정적 import 지도와 2.5의 위험을 읽는다.
2. 엔진 쪽 정적 import. 줄 번호는 초안 시점 `141fd2a`의 값이다.
   - `engine.ts:1-3`: `risk` 11개, `market` 4개, `operations` 6개를 가져온다.
   - `reports.ts:1-3`, `invariants.ts:1-3`(`operations-invariants` 포함), `reservations.ts:1-3`, `previews.ts:1`, `progress.ts:1`
   - 고리 import가 있다. `operations` ↔ `reservations`, `readers`·`previews` → `engine`이다.
3. 화면 쪽 정적 import(`grep -n "from '\.\./engine/\(operations\|market\|risk\|readers\)'" src/ui/*.ts`)
   - 첫 화면에 남는 파일: `main.ts:21-25`(`offerDef`·`openTradePairs`·`exchangePreview`·`quotePreview`·`paymentDefaultStatus`), `recruitment.ts:19`(`hiringOutlook`), `reports.ts:1`(`warehouseSummary`), `schedule.ts:2`(`lateDeliveryReduction`)
   - 이미 지연 청크인 `ops-screens.ts`가 다시 내보내는 파일: `market.ts`·`money-alerts.ts`·`warehouse.ts`
4. 지연 불러오기
   - `ui/lazy.ts`: 첫 시도와 재시도 한 번, 그 뒤 `ScreenLoadExhaustedError`
   - `main.ts:45-68`의 `ensureOpsScreens`
   - 진입점 `main.ts:1550`(시나리오 고르기), `:1601-1608`(`loadText`), `:1504-1512`(브라우저 저장 불러오기)
   - 한가할 때 미리 받기 `:1622-1626`
5. **`loadText`의 순서(이 지시서에서 고쳐야 하는 곳).**
   - `main.ts:1602` `loadSaveText(text)`가 `:1607` `ensureOpsScreens()`보다 **먼저** 돈다.
   - `loadSaveText`(`ui/session.ts:27-39`) 안의 `deserializeSave` → `checkInvariants` → `operationsProblems`와 `openDay`는 운영 저장에서 운영 함수를 부른다.
   - 그리고 `session.ts:37`의 `catch`가 모든 예외를 `errorKo`로 바꾼다.
   - 그래서 분리 뒤 이 순서를 그대로 두면 문제가 생긴다. 미리 받기가 끝나기 전에 운영 저장을 불러오면 미등록 예외가 ‘불러오기 실패’ 문구로 바뀌어 **저장이 깨진 것처럼 보인다.** 미리 받기 시점에 따라 나타났다 사라지는 결함이다.
6. 기존 시험
   - `ui/code-split.test.ts`: `BASE_HTML` sha256 세 개, 지연 실패·재시도·모듈 맵 기억 시험 `:197-480`
   - `tools/check_bundle_size.mjs`·`tools/bundle-size.mjs`: 첫 화면과 나중에 받는 청크를 가른다.
7. 비번들 진입점: `src/engine/sim/run.mjs` → `cli.ts`, `tools/rules2_golden_entry.ts`·`rules3_golden_entry.ts`, `src/engine/testkit.ts`, vitest(`vite.config.ts`의 `test`).

## 1. 지켜야 할 것

1. **함수 몸은 옮기기만 한다.** 운영 함수의 식, 분기, 문자열은 바꾸지 않는다. 호출 경로(직접 import → 등록 표)만 바꾼다.
   - 함수를 다른 파일로 옮기면 결과 보고에 ‘옮김’ 표를 붙인다. 표에는 원래 파일, 새 파일, 함수 이름, 몸 diff 0 확인을 적는다.
2. **화면 HTML은 바이트로 그대로다.** `code-split.test.ts`의 `BASE_HTML` 세 sha256과 기존 화면 시험은 고치지 않고 통과해야 한다.
3. **기존 시험 파일의 단언은 고치지 않는다.**
   - 시험이 운영 모듈을 직접 import하는 것은 그대로 둔다.
   - 등록이 필요해서 고쳐야 하는 시험 파일이 있으면, 바꿀 수 있는 것은 import나 준비 줄뿐이다. 그 목록과 이유를 결과 보고에 적는다.
4. **저장 형식, 자료, `MANIFEST.json` 밖의 생성 파일은 바뀌지 않는다.** 후보 C를 하면 4절의 조건을 따른다.
5. **조용히 다른 값을 내는 경로가 없어야 한다.** 등록되지 않은 운영 함수를 부르면 반드시 예외가 난다(3.1). 기본값으로 빠지는 대체 구현을 두지 않는다.

## 2. 단계 1: 조사와 멈춤 관문

구현 전에 다음 둘을 결과 보고 ‘조사’ 절에 적는다. 이 단계에서는 저장소 파일을 고치지 않는다(사본 트리만 쓴다).

### 2.1 기호 분류표

- 대상: 첫 화면에 남는 파일이 후보 모듈(`risk`·`market`·`operations`·`operations-invariants`·`readers`)에서 가져오는 기호 전부다. 남는 파일은 엔진 핵심과 0절 3의 화면 파일이다.
- 기호마다 다음 셋 중 하나로 분류한다.
  - **핵심**: 운영이 없는 시나리오(기본 `SCENARIO_M2_MULTI_TRADE`와 rules-1 시나리오)의 경로에서도 불린다. 핵심 쪽에 남긴다. 예상 후보는 `offerDef`·`divHalfAway`·`rowCurrency`·`isRiskRules`다.
  - **운영 전용**: `config.operations`(또는 `isRiskRules`) 가드 안에서만 불린다. 등록 표로 옮긴다.
  - **화면 운영 전용**: 운영 시나리오 화면에서만 불린다. `ops-screens` 쪽으로 옮긴다.
- 분류의 근거는 가드 줄 번호다. 근거를 대지 못하면 ‘핵심’으로 둔다.
- 분류가 맞는지는 3.5의 미등록 시험이 동적으로 확인한다.

### 2.2 절감 상한 탐침

1. 사본 트리에서 `vite.config.ts`의 `codeSplitting`을 다음과 같이 바꾼다. 이 묶음은 여전히 정적으로 import되므로 첫 화면 청크로 잡힌다.
   - `includeDependenciesRecursively: false`를 넣는다. 빼면 후보 모듈이 가져오는 `catalog`·`ledger`·자료까지 딸려 들어가 상한이 부풀려진다. 세션 A 시운전에서 39,891 B가 나왔다.
   - `groups` 맨 앞에 `{ name: 'ops-probe', test: /[\\/]src[\\/]engine[\\/](risk|market|operations|operations-invariants|readers)\.ts$/ }`를 더한다.
2. `npx vite build` 뒤 `node tools/check_bundle_size.mjs dist`로 `ops-probe` 청크의 gzip을 읽는다. 이 값이 후보 A의 절감 **상한**이다.
   - 세션 A 시운전(`141fd2a`, 사본 트리, 빌드 표시 dev)에서 `ops-probe`는 gzip 14,577 B였다. 같은 트리에서 탐침 없이 빌드한 첫 화면은 132,589 B였다.
   - 따로 떼면 압축 사전을 공유하지 못하므로, 실제 절감은 이 값보다 조금 작다. 세션 B의 상한은 13,214 B였다.
3. 2.1의 ‘핵심’ 기호를 남기면 상한에서 얼마가 빠질지 어림한다. 어림 방법은 고른다. 예: 핵심 기호를 별도 파일로 옮긴 두 번째 탐침.
4. **멈춤 관문**: 어림한 절감이 **5,000 B보다 작으면** 구현하지 않고 멈춘다. 2.1·2.2를 보고한다.
   - 문턱 5,000 B는 SCOPE 2.4의 경로 11 엔진 추가 추정 상한(4 KB)에 여유를 더한 값이다.
   - 탐침에 쓴 사본 트리와 빌드 폴더는 지운다.

## 3. 단계 2: 구현(후보 A)

### 3.1 등록 표

- 핵심 쪽에 작은 모듈 하나를 둔다. 이름 예: `src/engine/ops-registry.ts`.
  - `registerOperations(table)`: 운영 전용 기호의 표를 받는다.
    - 같은 표를 다시 등록하면 아무 일도 하지 않는다.
    - 다른 표를 등록하면 예외를 낸다.
  - `ops()`: 등록된 표를 돌려준다. 등록 전이면 `OperationsNotRegisteredError`를 던진다.
    - 메시지는 한국어로, 어느 진입점이 등록을 빠뜨렸는지 알 수 있게 쓴다.
  - 시험 전용 초기화 함수 하나를 둔다. 제품 코드에서는 부르지 않는다. 원천 검사로 이를 고정한다.
- 표의 형은 운영 모듈의 실제 함수 형에서 끌어낸다(`typeof import(...)` 등). 손으로 다시 쓰지 않는다.
- 핵심 파일(`engine`·`reports`·`invariants`·`reservations`·`previews`·`progress`)은 운영 전용 기호를 `ops().이름(...)`으로 부른다. 그 모듈들에서 운영 모듈을 가져오는 import는 `import type`만 남긴다.

### 3.2 운영 진입 모듈

- 이름 예: `src/engine/ops-entry.ts`. 운영 모듈을 정적으로 가져와 표를 만들고 `registerOperations`를 부른다.
- 이 모듈을 가져오는 곳은 다섯이다.
  1. 화면의 운영 지연 불러오기. **`ops-screens`와 같은 약속 하나**로 묶는다.
     - 예: `ops-screens.ts`가 `ops-entry`를 import하거나, `lazyScreen` loader가 둘을 `Promise.all`로 받는다.
     - 첫 시도·재시도 한 번·`ScreenLoadExhaustedError` 규칙은 그대로 둔다.
  2. `src/engine/sim/cli.ts`
  3. `tools/rules2_golden_entry.ts`·`rules3_golden_entry.ts`
  4. vitest 준비 파일(`vite.config.ts`의 `test.setupFiles`)
  5. 그 밖에 결과 보고에 이유를 적은 곳
- **작업자 스레드도 따로 등록해야 한다.** `src/engine/sim/run.mjs`와 `tools/check_rules2_golden.mjs`·`check_rules3_golden.mjs`는 `worker_threads`로 같은 모듈을 다시 불러온다. 작업자마다 모듈 인스턴스가 따로라서, 주 스레드에서 한 등록은 작업자에 닿지 않는다.
  - 등록은 진입 모듈을 평가할 때 일어나게 한다. 주 스레드에서만 도는 함수 안에 두지 않는다.
  - 9절 1·3은 `--workers 4`(골든은 기본 작업자 수)로 돌려서 이를 확인한다. 결과 보고에 작업자 수를 적는다.
- 첫 화면 묶음 안의 파일은 `ops-entry`나 운영 모듈을 정적으로 import하지 않는다. 9절 4의 청크 검사가 이를 고정한다.

### 3.3 화면 쪽 import

- 0절 3의 첫 화면 파일이 쓰는 운영 기호는 2.1 분류를 따른다.
  - 핵심이면 핵심 파일에서 가져온다.
  - 운영 전용이면 `ops()`나 `opsScreens`로 부른다. 이 경우 부르는 곳이 운영 시나리오에서만 닿는지를 결과 보고에 가드 줄로 적는다.
- `ops-screens`가 다시 내보내는 `market.ts`·`money-alerts.ts`·`warehouse.ts`는 이미 지연 청크라서 그대로 둔다.

### 3.4 진입 순서 고침

- **`loadText`**
  - 운영 저장이면 청크를 받은 **뒤에** `loadSaveText`를 부른다.
  - 순서: 저장의 `scenarioId`를 먼저 엿본다(`session.ts:29-34`와 같은 방식). 그 시나리오가 운영이면 `ensureOpsScreens()`를 기다린다. 그다음 `loadSaveText`를 부른다.
  - 청크를 받지 못하면 지금의 `screenLoadWarning(error, fromSave)`로 끝낸다. 상태와 오늘 할 일은 그대로 둔다.
  - JSON 오류와 알 수 없는 시나리오의 문구·순서는 지금과 같아야 한다. 파일 내용을 읽지 않고 거르는 길이 먼저다.
- **시나리오 고르기(`:1550`)**: 이미 청크를 기다린 뒤 `startScenario`를 부른다. 그대로 둔다.
- **`loadSaveText`의 `catch`**: `OperationsNotRegisteredError`는 `errorKo`로 바꾸지 않고 다시 던진다. 위 순서가 지켜지면 닿지 않는 길이다. 닿으면 ‘깨진 저장’으로 숨지 않고 결함으로 드러나게 한다.
- **그 밖에** 운영 시나리오의 상태를 만들거나 읽는 화면 진입점이 있으면 같은 규칙을 따른다. 목록을 결과 보고에 적는다.

### 3.5 새 시험(2001 이상 시드)

1. **미등록 예외**
   - 등록을 초기화한 뒤 세 경우에서 `OperationsNotRegisteredError`가 나는지 본다.
     - 운영 시나리오에서 `createGame` → `openDay` → `commitDay`
     - 운영 상태에 대한 `checkInvariants`
     - 운영 저장의 `deserializeSave`
   - 예외가 `loadSaveText`에서 `errorKo`가 되지 않고 다시 던져지는지도 본다.
2. **운영 없는 경로는 등록 없이 같다**
   - 등록을 초기화한 채 기본 시나리오와 rules-1 시나리오를 캠페인 끝까지 돈다(`runToCampaignEnd`).
   - 예외 0이어야 한다. 등록한 채 돈 결과와 `serializeSave` 바이트가 같아야 한다.
   - 2.1의 ‘핵심’ 분류가 모자라면 이 시험이 실패한다.
3. **화면 진입 순서**(`code-split.test.ts` 방식, `lazy` 모의)
   - (가) 미리 받기 전에 운영 저장을 불러온다. 청크를 기다린 뒤 정상으로 불러와야 한다. `errorKo` 문구가 나오면 안 된다.
   - (나) 청크 첫 시도 실패 → 경고, 상태·오늘 할 일·select 보존, 등록 표는 빈 채.
   - (다) 다음 진입에서 재시도가 성공한다 → 등록되고 정상 진입.
   - (라) 두 번 실패 → 새로 고침 안내(`ScreenLoadExhaustedError`). 브라우저 저장 불러오기(`fromSave`)와 파일 불러오기 둘 다 본다.
4. **원천 검사**
   - 첫 화면에 남는 파일은 운영 모듈과 `ops-entry`를 값으로 import하지 않는다. `import type`은 된다.
   - 시험 전용 초기화 함수는 `.test.ts`와 준비 파일 밖에서 불리지 않는다.
   - 검사에는 음성 대조를 넣는다. 메모리 사본에서 `main.ts`에 값 import 한 줄을 더하면 거부해야 한다.

## 4. 선택: 후보 B(`save-shape`)·C(운영 자료)

- 하지 않아도 된다. 하나라도 하면 **후보별로 따로** 바이트 동일을 보인다. 후보마다 커밋을 하나씩 나누고, 9절 1~3을 그 커밋 뒤에 다시 돌린다.
- B: `save-shape`를 지연시키면 저장 불러오기는 청크에 기댄다.
  - 3.4와 같은 순서 규칙을 운영 아닌 저장에도 적용해야 하는지 먼저 따진다. 운영 아닌 저장까지 청크에 기대게 되면 하지 않는다.
- C: 운영 시나리오 자료를 지연시키면 `loadScenario(id).operations` 엿보기(`main.ts:1550`, `:1607`)가 자료 없이 판단할 수 있어야 한다.
  - 시나리오 id 목록(`OPERATIONS_SCENARIO_IDS`)으로 판단을 바꾸는 것은 된다. 자료 값과 `MANIFEST.json`의 자료 sha는 바뀌지 않아야 한다.
- 후보마다 첫 화면 gzip 감소를 따로 적는다.

## 5. 변형 시험

변형마다 어느 시험이 왜 실패하는지 한 줄씩 적는다. 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | `loadText`를 옛 순서(`loadSaveText` 먼저)로 되돌린다 | 3.5-3 (가) |
| V2 | `main.ts`에 `import '../engine/ops-entry'` 한 줄 | 9절 4 청크 검사, 3.5-4 |
| V3 | `ops-entry`의 `registerOperations` 호출을 지운다 | 운영 시나리오 시험 전반, 3.5-3 (다) |
| V4 | 운영 지연 불러오기가 `ops-screens`만 받고 `ops-entry`는 받지 않는다 | 3.5-3 (가)·(다) |
| V5 | 핵심 파일의 운영 가드 하나(예: `config.operations` 조건)를 없애 늘 `ops()`를 부른다 | 3.5-2 |
| V6 | `loadSaveText`의 `catch`가 `OperationsNotRegisteredError`도 `errorKo`로 바꾼다 | 3.5-1 |
| V7 | `registerOperations`가 다른 표의 재등록을 조용히 받아들인다 | 3.5-1 또는 등록 표 단위 시험 |

## 6. 큰 출력과 디스크

- 모든 회귀 출력, 탐침, 빌드 폴더는 `/tmp/T73-*` 아래에 둔다.
- sha256과 `cmp` 결과를 적은 즉시 지운다.
- 회귀 전 `df -h /tmp`의 여유를 적는다. 허브 실측으로는 승인 시점 여유가 약 2.8 GB다. 2 GB보다 작으면 **이 작업이 만든 `/tmp/T73-*`만 지운다.** 그래도 모자라면 다른 것을 지우지 말고 멈춰 보고한다.
- 작업 끝에 `ls -d /tmp/T73-* 2>/dev/null`이 빈 출력이어야 한다.

## 7. 결과 보고

`docs/ai/tasks/results/TASK-0073.md`에 다음을 적는다.

- BASE
- 조사(2.1 분류표, 2.2 탐침값과 어림)
- 옮김 표(1절 1)
- 등록 진입점 목록(3.2)
- 고친 진입점 목록(3.4)
- 고친 기존 시험 파일과 이유(1절 3)
- 5절 변형 결과
- 9절 각 줄의 명령과 결과
- 첫 화면 gzip 전·후

## 8. 멈춤 조건

- 2.2의 관문에 걸릴 때.
- 구현 뒤 실측 감소(9절 5)가 5,000 B보다 작을 때. 마무리하지 말고 그 시점의 상태로 보고한다.
- 함수 몸, 문구, 화면 HTML, 저장 바이트를 바꿔야만 분리가 될 때.
- 고리 import 때문에 등록 순서가 결과를 바꿀 수 있는 경로가 보일 때. 모듈 평가 순서에 기대는 초기화가 그 예다.
- 9절 1~3이 어긋날 때.

## 9. 완료 조건

1. **골든과 400회**
   - `node tools/check_rules2_golden.mjs`·`node tools/check_rules3_golden.mjs`가 작업 전·후 모두 종료 0이어야 한다. 작업 전에 0이 아니면 고치지 말고 멈춘다.
   - `node src/engine/sim/run.mjs run`(rules-1 400회, 시드 1001~1020)의 출력이 BASE와 `cmp` 동일해야 한다.
2. **화면 바이트**: `npx vitest run` 전체 통과. 기존 시험 수는 그대로이고, 늘어난 것은 3.5의 새 시험뿐이다. `code-split.test.ts`의 `BASE_HTML` 세 sha256도 그대로다.
3. **판본 2 SHA256SUMS 재현**(작업 끝에 한 번)
   - TASK-0071 9절 1과 같은 명령을 쓴다. 출력 이름만 `/tmp/T73-V2-R1.json`·`-R2.json`·`/tmp/T73-V2-TABLES-R1.md`·`-R2.md`·`/tmp/T73-CMP-R1-R2.md`로 바꾼다.
   - 다섯 sha256이 `docs/ai/design/path5-measure-2026-10/v2-round1/SHA256SUMS`의 해당 값과 같아야 한다.
4. **청크 그래프 검사**: 되풀이할 수 있는 명령이나 시험 하나로 다음을 확인한다. 방법은 고른다. 예: 빌드 뒤 `dist`의 청크 import 관계를 읽는 스크립트와 그 시험.
   - 첫 화면 청크(`index.html`의 script와 modulepreload) 안에 운영 모듈과 `ops-entry` 몸이 없다.
   - `ops-entry`는 운영 지연 불러오기가 받는 청크 묶음 안에 있다.
   - V2 변형에서 이 검사가 실패한다.
5. **첫 화면 gzip 실측**
   - BASE와 작업 뒤를 둘 다 `git archive`로 푼 깨끗한 트리(`/tmp/T73-build-before`·`-after`)에서 빌드한다. 각각 `node tools/check_bundle_size.mjs dist`를 돌린다.
   - 첫 화면 gzip 전·후와 감소량을 적는다. 나중에 받는 청크의 크기와 청크별 한도 통과도 적는다.
6. `npm run typecheck`, `npm run build` 통과.
7. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
8. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`.
9. 6절의 디스크 정리 확인.
