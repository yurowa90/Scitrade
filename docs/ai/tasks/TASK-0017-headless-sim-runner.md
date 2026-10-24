# TASK-0017 화면 없는 비교 실행기: 고정 시드·명령 정책·지표·비교 (엔진 도구, 화면 없음)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 평택 본사 전환(TASK-0015)이 개발 브랜치에 `548c53c`로 반영됐다. 개발 브랜치 `4a90d77` 위에 만든 `codex/TASK-0017`에서 작업한다.
  - `src/engine/`·`src/content/`·`tests/`·`package.json`·`package-lock.json`·`vite.config.ts`·`tsconfig.json`은 평택 구현 스냅숏 `4de152a`와 `4a90d77`가 같다. 아래 줄 번호와 Claude 확인값은 `4de152a` 사본에서 냈지만 그대로 맞다. 모든 diff·검사 명령의 기준 커밋은 `4a90d77`다.
  - TASK-0016(결산·보고 읽기 함수)은 별도 작업 트리에서 이미 구현됐고 검수 중이다. 이 작업 트리에는 없다. 고치는 파일은 겹치지 않는다.
  - 작업 브랜치는 이 지시서를 올린 개발 브랜치 커밋에서 시작한다. 그 커밋이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 `git diff 4a90d77` 결과에 나와도 이 작업의 변경으로 치지 않는다.
- 결정 근거:
  - `docs/DESIGN_v0.4.md`
    - 319~320행: 엔진 → ‘화면 없는 비교 실행’ → ‘경제·게임성 지표’.
    - 468~473행: 비교 전략(저비용 집중·납기 우선·공급자 분산·자산 적게), 같은 난수 조건과 명령 정책으로 변경 전후 실행, 모듈별 난수 흐름 분리, 처음 20개 고정 시드.
    - 476행: 기록 지표(기말 순자산, 현금 부족·실패 비율, 계약 기여이익, 정시 인도율, 재고 회전, 직원 대기 작업, 시설 유휴·초과, 공급자 집중도).
  - `docs/ai/tasks/results/TASK-0010.md` 154·161행: 변경 전후 엔진을 1,500게임 나란히 돌렸지만 비교 시험을 저장소에 남기지 않았다. 무작위 명령은 대부분 거절됐다. 그래서 거절되지 않는 명령 정책이 필요하다.
  - 개발 브랜치 `docs/DECISIONS.md` ‘평택 노선 재설계 승인’ 1항(999행): 본사 전환 뒤에도 금액·날짜 기대값은 그대로여야 한다. 이 도구의 첫 쓰임은 그 독립 확인이다.
    - 이 작업 트리의 `docs/DECISIONS.md`에 그 절이 있다.
  - `docs/DECISIONS.md` 57행: 지급 불이행 유예기간이 정해지지 않았다. 그래서 경영 실패 판정은 없다.
  - 같은 개발 브랜치 DECISIONS ‘병렬 세션 운영 (2026-10-09)’ 절(1018행): 1차 세션 S3 = 이 작업(B20 = TE-23·TPD-08). 병합 순서와 통합 검증(20시드 비교)도 그 절에 있다.

## 목표

엔진을 화면 없이 반복 실행하는 도구를 저장소에 둔다.

- 고정 시드 20개 × 시나리오 4개 × 명령 정책 5개를 돌려 지표를 JSON으로 낸다.
- 두 JSON을 비교해 엔진을 바꾸기 전과 뒤의 지표 차이를 찾는다.
- 같은 입력을 두 번 돌리면 JSON이 바이트까지 같다.
- 정책과 지표는 도시·견적·노선·사건·직원 ID를 모른다. 그래서 ID 이름만 바뀐 엔진·자료(예: 본사 전환)에서도 그대로 비교할 수 있다.
- 엔진 동작·상태·장부·저장·자료는 바꾸지 않는다. 엔진 파일은 import만 한다.

## Claude가 미리 확인한 사실

`4de152a` 사본에서 확인했다. 시제품 코드는 저장소에 넣지 않았다.

1. **엔진은 지금 난수를 뽑지 않는다.**
   - `drawUniform`(`src/engine/rng.ts` 33행)을 부르는 곳은 `src` 안에서 시험뿐이다.
   - `createGame`(`engine.ts` 53행)은 `config.seed`로 `state.rng`를 만들기만 한다.
   - 그래서 시드만 바꾸면 결정적 정책의 20회 결과는 모두 같다. 시드는 엔진(`config.seed`)과 ‘무작위 탐색’ 정책의 난수 흐름에 함께 넣는다(구현 지시 3).
2. **TypeScript 실행 도구가 없다.**
   - `node_modules`에 `tsx`·`vite-node`·`@types/node`가 없다.
   - `src/content/scenario.ts`는 JSON을 속성 없이 import한다. 그래서 Node가 바로 읽지 못한다.
   - Vite 8.3.2의 `runnerImport`는 된다. `.mjs` 진입점에서 `.ts`를 불러 0.5~0.8초 걸렸다. `{ configFile: false }`로도 되고, 다른 작업 폴더에서 실행해도 된다.
3. **타입 검사 범위:** `tsconfig.json`의 `include`는 `src`와 `vite.config.ts`다. `@types/node`가 없어서 `.ts`에서 `process`·`node:fs`를 쓰면 `tsc`가 실패한다. `.mjs`는 검사 대상이 아니다. `?raw` import는 된다(`src/vite-env.d.ts`의 `vite/client`).
4. **부산판과 엔진이 같다.**
   - `102a23f`(부산판)와 `4de152a` 사이에 시험이 아닌 엔진 파일은 `save.ts`만 바뀌었다.
   - `engine.ts`, `reports.ts`, `catalog.ts`, `ledger.ts`, `rng.ts`, `reservations.ts`, `previews.ts`, `employees.ts`, `money.ts`, `types.ts`, `testkit.ts`, `src/content/scenario.ts`, `vite.config.ts`, `package.json`은 같다.
   - 그래서 `src/engine/sim/` 폴더만 `102a23f` 사본에 복사해도 돈다. Claude 시제품으로 해 보니 두 판의 지표가 같았다.
5. **속도:** 시제품(정책 3개)으로 4시나리오 × 20시드 = 240회가 약 15초 걸렸다. 지난 날 후보를 거르지 않으면 45초 걸렸다.
   - 정책 5개를 이 지시서 정의대로 넣은 두 번째 시제품은 400회가 약 25초였다. 거절·중복은 0건이었다.
   - 그 가운데 `IDLE` 80회만 약 4초였다(1회 약 50ms). 시간 대부분은 엔진의 하루 마감(`openDay`·`commitDay`)이다. 정책의 `planCommands` 호출은 400회 전체에서 약 1,700번뿐이다.
   - 모든 견적의 `validUntilDay`가 3이다. 그래서 수락은 1~3일에만 일어나고, 4일 뒤는 유지 작업만 한다.
6. **참고값(시험에 쓰지 않는다):**
   - M2, 아무것도 안 함: 원화 순자산 −4,400,000원. 63일부터 28일 동안 현금 부족이다. `payrollRunwayDay`는 62다(`previews.test.ts` 246~248행).
   - M1 정상, 기여이익 우선: 계약 1건, 기여이익 150.00 USD, 정시.
   - M1 지연 사례, 같은 정책: 기여이익 100.00 USD, 늦은 인도 1건.
   - M2, 같은 정책: 계약 3건 모두 정시, 기여이익 합계 500.00 USD.
   - 두 번째 시제품에서 본 것:
     - `ON_TIME_FIRST`는 네 시나리오 모두 `MAX_CONTRIBUTION`과 지표가 같았다. 지금 자료에서는 고르는 순서가 같다.
     - M2 `ASSET_LIGHT`: 운송 주선 2건, 기여이익 280.00 USD.
     - 결정적 정책은 `ASSIGN_TASK`·`BOOK_SAILING` 적용이 0건이다. 수락을 plan으로 하므로 배정·예약이 수락 명령 안에서 끝난다.
     - M2 `SEEDED_RANDOM` 20시드는 서로 다른 지표가 17가지였다. 취소 명령도 적용됐다.
7. **기준 수치:** `4de152a`에서 vitest 27개 파일·803개 통과, 파이썬 시험 21·21·20개 통과(개발 브랜치에서 검사기 시험 1개 추가).
   - 지도 생성 시험 3개는 원본 폴더(`SCITRADE_MAP_SOURCES`, 없으면 저장소 옆 `map/`)가 없을 때 건너뛴다. 작업 폴더 위치에 따라 건너뛴 수는 0개 또는 3개다. 시험 수 21은 같다.

## 먼저 읽을 파일

- 엔진 (줄 번호는 `4de152a` 기준이다):
  - `src/engine/engine.ts`
    - `createGame` 53행, `openDay` 127행, `planCommands` 162행, `planState` 170행.
    - `withPlan` 230행: 수락·배정·예약을 한 번에 확정한다(REF-02).
    - `employeeUnavailable` 472행: 근무일·위치·진행 중 업무 검사.
    - `bookSailing` 667행, `cancelContract` 745행.
    - `commitDay` 796행. 하루 처리 순서는 811~836행이다. `ENDED` 전환은 836행이다.
    - `progressTasks` 840행, `processDepartures` 892행, `processArrivals` 952행, `processDeliveries` 993행, `payOrAccrue` 1099행, `settleObligations` 1137행, `processPayroll` 1159행.
  - `src/engine/reports.ts`: `contractReport` 17행, `tradePreview` 130행, `forwardingPreview` 146행, `tradePairs` 162행.
  - `src/engine/ledger.ts`: `BookSummary` 125행, `summarize` 149행.
  - `src/engine/catalog.ts`: `routeBetween` 25행, `listSailings` 36행.
  - `src/engine/employees.ts`: `isAvailableFromToday` 8행.
  - `src/engine/previews.ts`: `payrollRunwayDay` 40행.
  - `src/engine/rng.ts`: `createRng` 9행, `drawUniform` 33행.
  - `src/engine/money.ts`: `formatMoney` 43행.
  - `src/engine/types.ts`: `ENGINE_VERSION` 9행, `ScenarioConfig` 142행(`seed` 148행), `Contract` 201행, `Task` 285행, `GameState` 450행, `Command` 494행, `CommandResult` 507행.
  - `src/engine/testkit.ts`: `runDays` 9행. 이 작업은 하루마다 정책이 명령을 정하므로 같은 모양의 고리를 sim 안에 따로 둔다.
- 시나리오: `src/content/scenario.ts`의 `M1_SCENARIO_IDS` 34행, `M2_SCENARIO_IDS` 39행, `SCENARIO_IDS` 40행, `loadScenario` 247행, `seed`·`campaignDays` 377~378행.
- 지도 도시 목록: `src/content/map.ts`의 `loadMapCities` 71행(시험 8에서만 쓴다).
- 시험 방식 참고: `src/engine/save-integrity.test.ts` 1~25행, `src/engine/previews.test.ts` 214~271행.
  - 이 두 파일은 `EMP01`·`OFFER_BUY_01` 같은 ID를 직접 쓴다. 파일 구성과 vitest 사용법만 참고한다. ID를 쓰는 방식은 따르지 않는다.
- `package.json`, `tsconfig.json`, `vite.config.ts`, `src/vite-env.d.ts`.
- 위 ‘결정 근거’의 문서 줄.

## 범위

**포함**
1. 새 폴더 `src/engine/sim/`: 실행 고리, 명령 정책 5개, 지표, 비교, 명령줄 진입점.
2. `package.json`의 `scripts.sim` 한 줄.
3. 시험 `src/engine/sim/sim.test.ts`.
4. `102a23f`(부산판) 사본에서 같은 도구를 돌려 비교한 결과를 보고한다. 고치지 않고 보고만 한다.

**제외**
- 엔진 동작·상태·장부·저장 형식·자료 변경. 엔진 파일은 import만 한다.
- 시설 지표(유휴·초과). 창고가 생긴 뒤(M2a-5) 더한다.
- 재고 회전, 공급자 집중도, ‘공급자 분산’ 정책(DESIGN 470행). 지금 시나리오는 공급자·재고가 너무 적어 뜻이 없다. M2a-5 뒤에 더한다.
- 경영 실패 비율. 지급 불이행 규칙이 미정이다(DECISIONS 57행, B35).
- 영입·훈련·현지 활동 명령을 내는 정책. 이번 정책은 거래·운송 주선·배정·예약·지연 대응·취소만 다룬다.
- 기준 출력 JSON을 저장소에 넣는 것. 출력은 저장소 밖(`/tmp`)에 둔다.
- TASK-0016의 새 함수(`onTimeDeliveryRate`, `campaignSummary`, `workloadSummary`, `acceptAllFeasible` 등). 아직 이 기준에 없다. 쓰지 않는다. 겹치는 계산은 sim 안에 두고, 병합 때 Claude가 하나로 합친다.
- 화면, CI, 문서 갱신.

## 고칠 수 있는 파일

- 새 폴더 `src/engine/sim/`의 새 파일. 이 목록 밖의 파일을 이 폴더에 만들지 않는다.
  - `sim.ts`: 시드 목록, 실행 고리, 묶음 실행, 직렬화.
  - `policies.ts`: 명령 정책.
  - `metrics.ts`: 지표 수집.
  - `compare.ts`: 두 출력 비교, 요약 표.
  - `cli.ts`: 명령줄 처리. 입출력은 인수로 받는다(Node API 없음).
  - `run.mjs`: Node 진입점. Vite `runnerImport`로 `cli.ts`를 부른다.
  - `sim.test.ts`: 시험.
- `package.json`: `scripts`에 `"sim": "node src/engine/sim/run.mjs",` **한 줄만 더한다.** `"test"` 줄과 `"validate:data"` 줄 사이에 넣는다. 다른 줄은 바꾸지 않는다.
- `docs/ai/tasks/results/TASK-0017.md` (결과 보고)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - 기존 `src/engine/*.ts` 전부. 읽고 import만 한다.
  - `src/engine/testkit.ts`, `src/engine/reports.ts`. TASK-0016이 더한다. import만 한다.
  - TASK-0016이 만들 파일: `src/engine/capacity.ts`, `campaign-end.test.ts`, `reports-read.test.ts`, `acceptance-p0-time.test.ts`. 같은 이름의 파일을 만들지 않는다.
  - 기존 시험 파일 전부.
  - `src/ui/**`, `src/content/**`, `index.html`, `vite.config.ts`, `tsconfig.json`, `package-lock.json`, `.gitignore`.
  - `tools/**`. `tools/ai/review_checks.sh`와 `tools/build_package.py`는 다른 작업(TASK-0019)이 고친다.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `data/**`, `tests/acceptance_cases.json`
  - `tools/validate_data.py`, `tools/test_validate_data.py`
  - `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`
- 새 npm 의존성을 넣지 않는다. `npm install`을 하지 않는다. `package-lock.json`은 바뀌지 않아야 한다.

## 지켜야 할 것

- **ID를 모르는 코드.** `src/engine/sim/`의 모든 파일(시험 포함)에 도시 이름·도시 ID·견적 ID·노선 ID·사건 ID·직원 ID·화주 ID를 쓰지 않는다. **주석에도 쓰지 않는다.**
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `HAIPHONG`, `SHANGHAI`, `YOKOHAMA`, `OFFER_*`, `ROUTE01`, `EVI_*`, `EMP01`, `SHIPPER_*`, ‘평택’, ‘부산’, ‘하이퐁’, ‘상하이’.
  - 본사 전환을 말할 때는 ‘본사 전환 전후’라고 쓴다.
  - 값은 `config`와 상태에서 찾는다: `config.offers`, `tradePairs`, `routeBetween`, `listSailings`, `s.employees`, `s.tasks`, `s.contracts`.
  - 엔진이 만드는 ID(`CT001`, `TASK001` 같은 것)도 문자열로 쓰지 않는다. 상태에서 읽는다.
  - 시나리오 ID는 `SCENARIO_IDS`·`M1_SCENARIO_IDS`·`M2_SCENARIO_IDS` 상수에서 꺼낸다. 문자열로 다시 쓰지 않는다.
- **정해진 순서만 쓴다.** 후보 순서는 `config` 배열 순서와 상태 배열 순서다. ID 문자열로 정렬하지 않는다.
- **결정성.** `Math.random`, `Date`, `performance`, 네트워크를 정책·지표·직렬화에 쓰지 않는다. 시간 재기는 `cli.ts`가 인수로 받은 `io.now()`만 쓰고, 그 값은 JSON에 넣지 않는다.
- **엔진 난수와 정책 난수를 나눈다.** 정책은 `state.rng`를 읽지도 바꾸지도 않는다. 정책 난수는 sim 고리가 따로 들고 있는 `RngState`다(DESIGN 472행 ‘모듈별 난수 흐름 분리’).
- **돈.** 통화별 최소 단위 정수만 쓴다. USD와 KRW를 더하거나 환산하지 않는다. 가상 환율 1,300원을 쓰지 않는다.
- **비율.** basis point 정수(0~10000), 내림이다. TASK-0016과 같은 규칙이다. 소수 비율을 JSON에 넣지 않는다.
- **입력을 바꾸지 않는다.** 정책·지표 함수는 상태·설정을 바꾸지 않는다. `structuredClone`이나 엔진 함수(`planCommands`)의 사본만 쓴다.
- **`.ts` 파일에 Node API를 쓰지 않는다.** `process`, `node:*`, `Buffer`, `require`가 없어야 한다. 파일 읽기·쓰기·종료 코드는 `run.mjs`만 다룬다.
- **글.** 사용자에게 보이는 글(명령줄 출력, 요약 표)과 주석은 한국어로 쓴다. 실제 회사 이름을 넣지 않는다.
- **네트워크.** 웹에 접속하지 않는다. `chainportal.co.kr`에는 접속하지 않는다. robots.txt를 지킨다.
- **Git.** 커밋·푸시·브랜치 전환을 하지 않는다. `git worktree`·`checkout`·`stash`·`reset`을 쓰지 않는다. 읽기용 `git status`·`git show`·`git diff`·`git archive`만 쓴다.

## 구현 지시

### 1. 진입점 (`run.mjs`, `package.json`)

```js
// 화면 없는 비교 실행기의 Node 진입점. Vite 모듈 실행기로 cli.ts를 불러 실행한다(새 의존성 없음).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const entry = fileURLToPath(new URL('./cli.ts', import.meta.url));
try {
  const { module } = await runnerImport(entry, { configFile: false, logLevel: 'error' });
  process.exitCode = module.simMain(process.argv.slice(2), {
    readText: (path) => readFileSync(path, 'utf8'),
    writeText: (path, text) => writeFileSync(path, text),
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
    now: () => performance.now(),
  });
} catch (error) {
  process.stderr.write(`비교 실행기 오류: ${error?.stack ?? error}\n`);
  process.exitCode = 2;
}
```

- 위 코드를 기본으로 한다. 동작이 같으면 모양은 바꿔도 된다.
- `run.mjs`는 `cli.ts`를 자기 위치 기준으로 찾는다. 그래서 폴더를 다른 저장소 사본에 복사해도 그 사본의 엔진을 쓴다.
- `package.json`: `"sim": "node src/engine/sim/run.mjs",` 한 줄.
- 사용 예:
  - `npm run sim -- run --out /tmp/scitrade-sim-a.json`
  - `npm run sim -- compare /tmp/before.json /tmp/after.json`
  - `npm run sim -- summary /tmp/scitrade-sim-a.json`

### 2. 실행 고리 (`sim.ts`)

```ts
export const SIM_FORMAT = 1;
/** 진단용 고정 시드 20개(DESIGN 473행). 자료의 seed와 무관한 상수다. */
export const SIM_SEEDS: readonly number[] = Array.from({ length: 20 }, (_, i) => 1001 + i);

export interface SimRun {
  scenarioId: string;
  policyId: string;
  seed: number;
  /** 정책이 낸 명령의 엔진 처리 결과 수. */
  commands: {
    applied: number;
    rejected: number;
    duplicate: number;
    /** APPLIED만 센다. 키는 아래 여섯 종류를 이 순서로 모두 넣는다(0 포함):
     *  ACCEPT_FORWARDING, ACCEPT_TRADE, ASSIGN_TASK, BOOK_SAILING, CANCEL_CONTRACT, RESPOND_TO_DELAY */
    appliedByType: Record<string, number>;
  };
  metrics: SimMetrics;
}

export interface SimOutput {
  meta: {
    tool: 'scitrade-sim';
    format: number;          // SIM_FORMAT
    engineVersion: string;   // ENGINE_VERSION
    dataVersion: string;     // 첫 시나리오 config.dataVersion
    scenarioIds: string[];
    policyIds: string[];
    seeds: number[];
  };
  runs: SimRun[];
}

/** 한 시나리오·정책·시드를 캠페인 끝(ENDED)까지 돌린다. */
export function simulate(baseConfig: ScenarioConfig, policy: SimPolicy, seed: number): { state: GameState; run: SimRun };

export function runSuite(options?: {
  scenarioIds?: readonly string[];  // 기본 SCENARIO_IDS 전체(4개)
  policyIds?: readonly string[];    // 기본 SIM_POLICIES 전체(5개)
  seeds?: readonly number[];        // 기본 SIM_SEEDS
}): SimOutput;

/** JSON.stringify(output, null, 2) + '\n'. */
export function serializeSimOutput(output: SimOutput): string;
```

**`simulate` 고리:**
1. `config = { ...baseConfig, seed }`. 엔진 시드도 바꾼다(엔진이 난수를 쓰기 시작하면 바로 반영된다).
2. `let state = createGame(config)`, `let policyRng = createRng(seed)`.
3. `state.phase !== 'ENDED'`인 동안:
   - `opened = openDay(state, config).state`.
   - `{ commands, rng } = policy.decide(opened, config, policyRng)`.
   - `result = commitDay(opened, config, commands)`. `result.alreadyClosed`이면 오류를 던진다.
   - `result.results`의 상태별 수를 센다(APPLIED·REJECTED·DUPLICATE). APPLIED는 명령 종류별로도 센다(명령 ID → 종류는 그날 `commands`에서 찾는다).
   - `collector.observeClosedDay(result.state, config, opened.day)`.
   - `state = result.state`, `policyRng = rng`.
   - 안전장치: 고리가 `config.campaignDays + 1`번을 넘으면 오류를 던진다.
4. 끝나면 `collector.finish(state, config)`로 지표를 만든다.
- 엔진 예외를 삼키지 않는다. 잡으면 메시지 앞에 `[시나리오/정책/시드/날짜]`를 붙여 다시 던진다. 엔진은 고치지 않고 보고한다.

**`runSuite`:**
- 알 수 없는 시나리오·정책 ID는 한국어 오류로 거절한다. 알려진 목록을 메시지에 넣는다.
- 시나리오마다 `loadScenario`를 한 번만 부른다.
- `runs` 순서: 시나리오(인수 순서) → 정책(인수 순서) → 시드(인수 순서).
- 출력 객체는 위 인터페이스의 키 순서대로 만든다. 그래서 `JSON.stringify` 결과가 늘 같다.
- 타이밍·날짜·실행 환경 값을 출력에 넣지 않는다.

### 3. 명령 정책 (`policies.ts`)

```ts
export interface PolicyDecision { commands: Command[]; rng: RngState }

export interface SimPolicy {
  /** 영문 대문자와 밑줄. */
  id: string;
  labelKo: string;
  /** 입력 상태·설정·rng를 바꾸지 않는다. 같은 입력이면 같은 결과다. state.rng를 읽지 않는다. */
  decide(state: GameState, config: ScenarioConfig, rng: RngState): PolicyDecision;
}

/** 순서 고정: IDLE, MAX_CONTRIBUTION, ON_TIME_FIRST, ASSET_LIGHT, SEEDED_RANDOM */
export const SIM_POLICIES: readonly SimPolicy[];
export function policyById(id: string): SimPolicy | undefined;
```

**공통 정의** (`decide`는 `openDay`를 마친 `AWAITING_INPUT` 상태를 받는다):
- **근무 직원:** `state.employees` 순서로, `isAvailableFromToday(state, e.id)`인 직원.
- **다음 출항편:** `listSailings(config, routeId, state.day + 1).slice(0, 3)`. 출항 전날이 예약 마감이므로 오늘 출항편은 넣지 않는다.
- **열린 견적:** `state.offers`의 `status === 'OPEN'`이고 정의의 `validUntilDay >= state.day`. 지난 날 견적은 후보로 만들지 않는다(속도, 사실 5).
- **후보:**
  - 직접 무역: `tradePairs(config)` 순서. 두 견적이 모두 열려 있을 때만. 미리 보기는 `tradePreview(config, buyId, sellId, state.day)`.
  - 운송 주선: `config.rules.forwardingEnabled`일 때만. `config.offers`에서 `kind === 'forwarding'`인 것, 배열 순서. 미리 보기는 `forwardingPreview(config, offerId, state.day)`.
  - 미리 보기가 `null`이면 후보에서 뺀다.
  - 후보 값 = `preview.contributionBeforePayroll`. 납기 = `preview.deliveryDeadlineDay`. 노선 = `preview.routeId`.
  - 동점은 후보를 만든 순서(직접 무역 먼저, 그다음 운송 주선)로 둔다. 안정 정렬을 쓴다.
- **준비 시간 확인 `prepReady`:**
  - 업무량 = 직접 무역이면 `config.terms.prepWorkUnits`, 운송 주선이면 `config.terms.forwardingPrepWorkUnits`.
  - 걸리는 날 = `Math.ceil(업무량 / 직원 정의의 workUnitsPerDay)`. `workUnitsPerDay <= 0`이면 준비할 수 없다.
  - `state.day + 걸리는 날 − 1 <= sailing.departureDay`일 때만 그 편을 고른다. 엔진은 같은 날 업무 진행(`progressTasks`, 814행) 뒤에 출항(`processDepartures`, 816행)을 처리한다.
- **확인 `fits`:** `planCommands(state, config, [...이미 고른 명령, 새 명령])`의 마지막 결과가 `APPLIED`일 때만 새 명령을 넣는다. 엔진과 같은 검사이므로 실제 마감에서 거절이 나오면 안 된다(시험 2).
- **명령 ID:** `SIM-${policy.id}-D${String(day).padStart(3, '0')}-${String(seq).padStart(2, '0')}`. `seq`는 그날 1부터 센다.
  - `seq`는 실제로 넣은 명령에만 쓴다. `fits`로 시험하는 명령은 다음 번호(넣은 명령 수 + 1)를 쓰고, 넣지 않으면 그 번호를 다음 시험에 다시 쓴다. 그래서 시험 명령이 이미 넣은 명령과 ID가 겹쳐 `DUPLICATE`가 되는 일이 없다.
- **수락은 언제나 한 번에 확정(plan)으로 한다:** `{ employeeId, sailingId }`를 함께 넣는다. plan 없는 수락은 내지 않는다.

**공통 유지 작업** (`IDLE` 말고 모든 정책, 이 순서로):
1. **지연 대응:** `state.delayDecisions`에서 `choice === null`인 것마다 `RESPOND_TO_DELAY`(`KEEP_SHIPMENT_BOOKING`). 엔진에 다른 선택지는 없다.
2. **(SEEDED_RANDOM만) 취소:** 아래 정책 5.
3. **배정:** `state.tasks`에서 `status === 'QUEUED'`이고 `contractId !== null`인 업무마다, 근무 직원 순서로 `ASSIGN_TASK`가 `fits`인 첫 직원.
4. **예약:** `state.contracts`에서 상태가 `ACTIVE`·`IN_PROGRESS`이고, 화물이 출항하지 않았고(그 계약의 `shipment` 없음), 살아 있는 예약이 없는(`bookingId === null`이거나 예약이 `CANCELLED`) 계약마다:
   - 노선은 `routeBetween(config, originCityId, destinationCityId)`. 없으면 건너뛴다.
   - 다음 출항편 가운데 `BOOK_SAILING`이 `fits`인 가장 이른 편.
5. 그다음 정책별 수락.

**정책 1. `IDLE` — 아무것도 하지 않음(대조군)**
- 명령을 내지 않는다. `rng`를 그대로 돌려준다.

**정책 2. `MAX_CONTRIBUTION` — 기여이익 우선 (DESIGN ‘저비용 집중’에 대응)**
- 후보 값 `> 0`인 것만, 값 내림차순.
- 후보마다 plan을 찾는다: 다음 출항편(이른 순) → 근무 직원(순서대로)으로 돌며, `prepReady`이고 `fits`인 첫 조합.
- 찾으면 수락 명령을 넣는다. 못 찾으면 건너뛴다.

**정책 3. `ON_TIME_FIRST` — 납기 우선**
- 후보 값 `> 0`인 것만. 납기 오름차순, 그다음 값 내림차순.
- plan 찾기는 정책 2와 같다. 다만 출항편은 `sailing.scheduledArrivalDay + config.terms.customsDays <= 납기`인 편만 쓴다. 엔진의 인도일 계산(`processArrivals`·`processDeliveries`)과 같은 기준이다.
- 맞는 편이 없으면 받지 않는다.

**정책 4. `ASSET_LIGHT` — 자산 적게 (운송 주선만)**
- 운송 주선 후보만 쓴다. 회사 재고를 사지 않는다. 값 `> 0`, 값 내림차순, plan 찾기는 정책 2와 같다.
- 운송 주선이 꺼진 시나리오(M1)에서는 유지 작업만 하고 수락하지 않는다.

**정책 5. `SEEDED_RANDOM` — 무작위 탐색(시드)**
- 받은 `rng`에서 흐름 `sim.policy.SEEDED_RANDOM`으로 `drawUniform`을 부른다. 뽑을 때마다 새 `rng`를 이어 쓰고, 마지막 `rng`를 돌려준다.
- 뽑는 순서를 지킨다(같은 상태면 같은 순서):
  1. 지연 대응: 뽑지 않는다. 공통 유지 작업 1과 똑같이 `RESPOND_TO_DELAY`(`KEEP_SHIPMENT_BOOKING`, ‘현재 예약으로 대기’)를 낸다. 응답하지 않고 넘어가는 뜻이 아니다.
  2. **취소:** `state.contracts` 순서로, 상태가 `ACTIVE`·`IN_PROGRESS`이고 화물이 출항하지 않은 계약마다 하나를 뽑는다. `u < 0.05`이고 `CANCEL_CONTRACT`가 `fits`이면 넣는다.
  3. **배정:** 공통 유지 작업 3과 같은 업무마다 `fits`인 직원 목록을 만든다. 비어 있지 않으면 하나를 뽑아 `Math.floor(u × 목록 길이)`번째를 고른다. 비어 있으면 뽑지 않는다.
  4. **예약:** 공통 유지 작업 4와 같은 계약마다 `fits`인 출항편 목록(다음 출항편 3개 안)을 만든다. 비어 있지 않으면 하나를 뽑아 같은 방법으로 고른다. 비어 있으면 뽑지 않는다.
  5. **수락:** 후보를 만든 순서대로(값으로 정렬하지 않는다, 값이 0 이하여도 후보다) 하나를 뽑는다. `u < 0.5`이면 plan 목록을 만든다.
     - plan 목록 = 다음 출항편(이른 순) × 근무 직원(순서대로) 가운데 `fits`인 조합. `prepReady`는 보지 않는다. 준비가 오래 걸리는 자료에서는 출항 불참과 다시 예약하는 경로가 지나간다. 지금 자료는 준비가 수락한 날 끝나므로(업무량 2, 처리량 2) 이 경로가 거의 나오지 않는다. 그래도 그대로 둔다.
     - 목록이 비어 있지 않으면 하나를 더 뽑아 고른다.
- 상수는 `policies.ts` 머리에 이름을 붙여 둔다: 취소 확률 0.05, 수락 확률 0.5.

### 4. 지표 (`metrics.ts`)

```ts
export interface CurrencyMetrics {
  cash: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventory: number;
  /** summarize().totalAssets − accountsPayable. TASK-0016 campaignSummary의 netAssets와 같은 정의다. */
  netAssets: number;
  profit: number;
  /** 이 통화 계약들의 contractReport().contribution 합(취소 계약 포함, 급여 전). */
  contractContribution: number;
  contributionDirectTrade: number;
  contributionForwarding: number;
  /** 마감 직후 이 통화의 미지급 의무(paidDay === null)가 하나라도 있던 날 수. */
  shortfallDays: number;
  /** floor(shortfallDays × 10000 ÷ closedDays). closedDays가 0이면 0. */
  shortfallBasisPoints: number;
  firstShortfallDay: number | null;
}

/** TASK-0016 OnTimeDelivery와 같은 모양·정의. 병합 때 그 함수로 바꿀 후보다. */
export interface DeliveryMetrics {
  /** 인도한 계약 수(취소 제외). 분모. */
  delivered: number;
  /** deliveredDay <= deliveryDeadlineDay. 납기 당일 인도는 정시다(DESIGN 497행). */
  onTime: number;
  late: number;
  /** floor(onTime × 10000 ÷ delivered). delivered가 0이면 null. */
  rateBasisPoints: number | null;
  /** 취소되지 않았고 인도하지 않았는데 deliveryDeadlineDay < s.day인 계약 수. 분모에 넣지 않는다. */
  pastDeadlineUndelivered: number;
}

export interface SimMetrics {
  closedDays: number;
  /** 키는 통화 코드. 순서: tradeCurrency, payrollCurrency, 그다음 장부·미지급 의무에 나온 다른 통화를 알파벳 순. */
  currencies: Record<string, CurrencyMetrics>;
  contracts: { total: number; directTrade: number; forwarding: number; delivered: number; completed: number; cancelled: number };
  delivery: DeliveryMetrics;
  staff: {
    /** 마감한 날마다 근무한 고용 직원 수의 합(직원·일). */
    availableEmployeeDays: number;
    /** 그 가운데 그날 일하지 않은 직원·일. ‘직원 대기일’. */
    idleEmployeeDays: number;
    /** 마감 직후 담당 없이 QUEUED인 업무 수의 합(업무·일). DESIGN의 ‘직원 대기 작업’. */
    waitingTaskDays: number;
  };
}

export interface MetricsCollector {
  /** commitDay가 돌려준 상태와 방금 마감한 날을 받는다. */
  observeClosedDay(state: GameState, config: ScenarioConfig, closedDay: number): void;
  finish(state: GameState, config: ScenarioConfig): SimMetrics;
}

export function createMetricsCollector(config: ScenarioConfig): MetricsCollector;
export function deliveryCounts(s: Pick<GameState, 'day' | 'contracts'>): DeliveryMetrics;
```

- **통화 금액:** `summarize(state.ledger, currency)`에서 가져온다. 화면·장부와 같은 값이다.
- **기여이익:** `contractReport(state, contract).contribution`을 계약 통화별로 더한다. 종류(`DIRECT_TRADE`·`FORWARDING`)별로도 나눈다. 급여·영입·훈련·현지 활동비는 들어가지 않는다.
- **현금 부족일:** 매일 마감 직후, 미지급 의무가 남은 통화마다 그날을 센다. 같은 날 같은 통화는 한 번만 센다. 첫날을 기록한다.
  - 마감 전 상태(`openDay` 직후)로 세지 않는다. 그러면 하루 늦게 잡힌다(완료 조건 6의 변형 시험).
- **직원이 ‘일한 날’:** 직원 `e`가 날 `d`에 일했다 = 다음을 모두 만족하는 업무가 있다.
  - `assignedEmployeeId === e.id`, `startedDay !== null`, `startedDay <= d`.
  - `status === 'RUNNING'`이거나, `status === 'DONE'`이고 `completedDay === d`.
- **근무한 직원:** `employmentStatus === 'employed'`이고 `availableFromDay <= d`. `observeClosedDay`에 받은 날 `d`로 판단한다(마감 뒤 `state.day`는 이미 다음 날이다).
- **계약 수:** `total` = 계약 수, `directTrade`·`forwarding` = 종류별 수, `delivered` = `deliveredDay !== null`, `completed` = `status === 'COMPLETED'`, `cancelled` = `status === 'CANCELLED'`.
- 모든 값은 안전한 정수이거나 `null`이다.
- 지표에 ID·도시·무게·부피를 넣지 않는다.
  - 본사 전환에서 한 화물의 무게가 바뀌었다(2,000kg → 2,400kg, 부피는 같음). 무게 지표가 있으면 전환 전후 비교가 깨진다.
  - 선복 이용률은 시설 지표와 함께 나중에 더한다.

### 5. 비교와 요약 (`compare.ts`)

```ts
export interface MetricDiff { run: string; path: string; before: number | string | null; after: number | string | null }

export interface CompareResult {
  /** 실행 집합이 같고 지표·명령 수 차이가 0이면 true. meta 차이는 판정에 넣지 않는다. */
  identical: boolean;
  onlyInBefore: string[];
  onlyInAfter: string[];
  diffs: MetricDiff[];
  metaDiffs: MetricDiff[];
}

/** `${scenarioId}/${policyId}/${seed}` */
export function runKey(run: Pick<SimRun, 'scenarioId' | 'policyId' | 'seed'>): string;
export function compareOutputs(before: SimOutput, after: SimOutput): CompareResult;
export function formatCompare(result: CompareResult, limit?: number): string;  // limit 기본 50
export function summarizeOutput(output: SimOutput): string;
```

- **비교 단위:** 실행을 `runKey`로 맞춘다. `commands`와 `metrics`를 끝까지 펼쳐 경로마다 비교한다. 예: `metrics.currencies.USD.netAssets`, `commands.applied`.
  - 한쪽에만 있는 경로도 차이다. 없는 쪽 값은 `null`로 적는다.
  - `diffs` 순서: `before.runs` 순서 → 경로 사전순.
- **meta:** 경로마다 비교해 `metaDiffs`에만 넣는다. 본사 전환 전후는 `dataVersion`이 다르다. 그래도 `identical`은 지표로만 정한다.
- **`formatCompare` 출력(한국어):**
  - 첫 줄: `비교 결과: 같음 (실행 N회, 지표 차이 0건)` 또는 `비교 결과: 다름 — 지표 차이 n건, 앞에만 있는 실행 a회, 뒤에만 있는 실행 b회`.
  - 다음 줄들: `- {runKey} {path}: {before} → {after}`. `limit`을 넘으면 `… 외 m건`.
  - meta 차이가 있으면 `메타 차이(판정에 넣지 않음): {path} {before} → {after}`.
- **`summarizeOutput`:** 시나리오 × 정책마다 한 행인 마크다운 표.
  - 열: 시나리오 | 정책 | 실행 수 | 서로 다른 결과 수 | 기말 순자산(통화별 최소~최대) | 현금 부족일(통화별 최소~최대) | 계약 기여이익(통화별 최소~최대) | 정시 인도율(최소~최대) | 직원 대기일(최소~최대).
  - ‘서로 다른 결과 수’는 `metrics`를 JSON 문자열로 만들어 센다.
  - ‘직원 대기일’ 열은 `staff.idleEmployeeDays`다.
  - 금액은 `formatMoney`로 쓴다. 비율은 basis point ÷ 100을 소수 한 자리 `%`로 쓴다. 최소와 최대가 같으면 값 하나만 쓴다. 통화 사이는 ` / `로 나눈다.

### 6. 명령줄 (`cli.ts`)

```ts
export interface SimIo {
  readText(path: string): string;
  writeText(path: string, text: string): void;
  out(text: string): void;
  err(text: string): void;
  now(): number;
}

/** 종료 코드: 0 성공·같음, 1 비교 결과 다름, 2 사용법·입력 오류. */
export function simMain(argv: readonly string[], io: SimIo): number;
```

- `run [--scenarios A,B] [--policies X,Y] [--seeds N] [--out PATH]`
  - `--seeds N`: `SIM_SEEDS`의 앞 N개. 1~20 정수. 기본 20.
  - `--out`이 없으면 JSON을 `io.out`으로 낸다. 있으면 파일에 쓴다.
  - 끝나면 `io.err`에 `실행 {n}회 · {초}초`를 한 줄 쓴다. JSON에는 넣지 않는다.
- `compare BEFORE AFTER [--limit N]`: 두 파일을 읽어 `formatCompare`를 `io.out`으로 낸다. 같으면 0, 다르면 1.
- `summary FILE`: `summarizeOutput`을 `io.out`으로 낸다.
- `help`·`--help`: 사용법을 `io.out`으로 내고 0.
- 인수가 없거나 틀리면 사용법과 이유를 `io.err`로 내고 2.
  - 알 수 없는 시나리오·정책이면 쓸 수 있는 목록을 함께 낸다.
- 읽은 파일이 이 도구의 출력이 아니면 2와 이유를 낸다. 기준: `meta.tool === 'scitrade-sim'`, `meta.format === SIM_FORMAT`, `runs`가 배열.
- `runSuite`의 오류도 잡아 2와 메시지를 낸다. 엔진 예외는 메시지를 그대로 보인다.

## 테스트

`src/engine/sim/sim.test.ts` 하나에 둔다. vitest의 기본 시간 한도는 5초다. 오래 걸리는 시험은 `it(이름, 함수, 60_000)`처럼 한도를 준다. 이 파일 전체가 이 기계에서 30초 안에 끝나야 한다. 실제 시간을 보고한다.

1. **결정성과 모양**
   - `runSuite({ seeds: SIM_SEEDS.slice(0, 2) })`를 두 번 돌려 `serializeSimOutput` 문자열이 같다.
   - `runs.length`가 `SCENARIO_IDS.length × SIM_POLICIES.length × 2`이고, 순서가 시나리오 → 정책 → 시드다.
   - 출력 안의 모든 숫자가 안전한 정수이고, 숫자가 아닌 값은 문자열·`null`·객체·배열뿐이다.
2. **명령 결과**
   - 1의 모든 실행에서 `commands.rejected === 0`, `commands.duplicate === 0`.
   - `appliedByType`의 키가 정해진 여섯 개·순서이고, 값의 합이 `commands.applied`와 같다.
   - `IDLE`은 `commands.applied === 0`이고 `contracts.total === 0`.
3. **장부 항등식** — 시나리오마다, 정책마다, 시드 `SIM_SEEDS[0]`으로 `simulate`를 돌린다.
   - `state.phase === 'ENDED'`, `metrics.closedDays === config.campaignDays`.
   - 통화마다 `summarize(state.ledger, 통화)`와 비교한다.
     - `cash`·`accountsReceivable`·`accountsPayable`·`inventory`·`profit`이 같다.
     - `netAssets === totalAssets − accountsPayable === openingEquity + profit`.
   - `contracts.total === directTrade + forwarding`.
   - `delivery.delivered === onTime + late`.
   - `staff.idleEmployeeDays <= staff.availableEmployeeDays`.
   - 통화마다 `contractContribution === contributionDirectTrade + contributionForwarding`.
4. **지급 가능일과 현금 부족** — 시나리오마다 `IDLE`로:
   - `runway = payrollRunwayDay(openDay(createGame(config), config).state, config)`.
   - 급여 통화 지표가 다음과 같다.
     - `runway === null`이면 `firstShortfallDay === null`이고 `shortfallDays === 0`.
     - 아니면 `firstShortfallDay === runway + 1`이고 `shortfallDays === config.campaignDays − runway`. 아무것도 하지 않으면 원화 수입이 없어서 한 번 모자라면 끝까지 모자라다.
   - 같은 확인을 **합성 설정**으로도 한다: `startingCash`의 급여 통화 값을 1로 바꾼 설정. 그래서 자료가 바뀌어도 이 시험이 빈 시험이 되지 않는다. 이때 `runway`는 0이고 첫 부족일은 1이어야 한다.
5. **정시 경계** — `deliveryCounts` 단위 시험.
   - 실제 계약 하나를 얻는다: 첫 시나리오부터 차례로 `MAX_CONTRIBUTION`을 돌려, 인도한 계약이 있는 첫 결과의 계약을 쓴다.
   - 그 계약을 복사해 5개를 만든다. 상태는 `{ day: d, contracts }`(`d`는 납기보다 큰 날)로 준다.
     - 납기 당일 인도
     - 납기 다음 날 인도
     - 미인도·진행 중·납기 지남
     - 취소됨
     - 미인도·납기가 `d` 이상
   - 기대값: `delivered 2`, `onTime 1`, `late 1`, `rateBasisPoints 5000`, `pastDeadlineUndelivered 1`.
   - 빈 목록이면 `rateBasisPoints === null`.
6. **정책 난수 분리와 순수성** — 시나리오마다 첫날을 연 상태(`openDay(createGame(config), config).state`)로:
   - 정책마다 `decide`를 두 번 부르면 같은 명령이 나온다. 부른 뒤 입력 상태의 JSON이 그대로다.
   - 입력 상태의 `rng`만 `{ seed: 원래 + 1, cursors: { x: 3 } }`으로 바꿔도 명령이 같다. 정책이 `state.rng`를 읽지 않는다는 뜻이다.
   - `SEEDED_RANDOM`이 아닌 정책은 정책 `rng`를 `createRng(SIM_SEEDS[0])`·`createRng(SIM_SEEDS[1])`로 바꿔도 명령이 같다.
   - 모든 명령 ID가 `SIM-{정책 ID}-D`로 시작하고 서로 다르다.
   - M2(`M2_SCENARIO_IDS[0]`)에서 `SEEDED_RANDOM`을 `SIM_SEEDS` 20개로 돌리면 서로 다른 `metrics`가 2개 이상이다.
7. **ID 이름 바꾸기 불변** — ID가 바뀐 엔진·자료에서도 지표가 같은지 본다(본사 전환 전후 비교의 근거).
   - 시험 안에 `renameIds(config)`를 둔다.
   - 모을 ID: `cities[].id`, `goods[].id`, `routes[].id`, `offers[].id`·`counterpartyId`, `employees[].id`, `portRestrictions[].eventInstanceId`·`templateId`, `recruitment.scoutSites[].venueId`, `culture.activities[].id`·`venueId`·`topic.id`, `culture.contacts[].id`.
   - 모은 ID를 사전순으로 정렬하고, i번째를 `Z` + `(개수 − i)`를 세 자리로 채운 값으로 바꾼다. 순서를 뒤집어서 ID 정렬에 기대는 코드를 잡는다.
   - 바꾸기는 `JSON.parse(JSON.stringify(config), reviver)`로 한다. reviver는 문자열 값이 ID 표에 있으면 바꾼다. 객체 키는 바꾸지 않는다.
   - 바뀐 설정의 JSON에 원래 ID가 `"ID"` 모양으로 남아 있지 않은지 확인한다.
   - 시나리오마다, `IDLE`이 아닌 정책마다 원래 설정과 바뀐 설정으로 `simulate`를 돌려 `run.metrics`와 `run.commands`가 같다. 시드는 결정적 정책이면 `SIM_SEEDS[0]`, `SEEDED_RANDOM`이면 앞 2개.
8. **소스에 고유 ID 없음**
   - `?raw`로 `sim.ts`, `policies.ts`, `metrics.ts`, `compare.ts`, `cli.ts`, `run.mjs`를 읽는다.
   - 금지 목록은 자료에서 만든다(시험에 ID를 쓰지 않는다):
     - 모든 `SCENARIO_IDS` 설정에서 7의 ID와 `cities[].nameKo`.
     - `SCENARIO_IDS`의 값 자체. 시나리오 ID는 상수로만 쓴다.
     - `loadMapCities()`의 `id`·`nameKo`(지도 거점 전체).
   - 영문 ID는 단어 경계로, 한글 이름은 포함 여부로 찾는다. 0건이어야 한다.
   - 다음도 0건이다: `/\b(CT|LOT|TASK|BK|SH)\d{3}\b/`(엔진이 만드는 계약·화물·업무·예약·출항 ID, `engine.ts` 279·698·905행), `Math.random`, `Date.now`, `new Date`.
   - `.ts` 다섯 파일에는 `process.`, `from 'node:`, `require(`도 0건이다.
9. **비교**
   - `out = runSuite({ scenarioIds: [SCENARIO_IDS[0]], seeds: SIM_SEEDS.slice(0, 1) })`.
   - 같은 출력의 복사본과 비교하면 `identical === true`, `diffs`가 비어 있다.
   - 복사본에서 한 실행의 `metrics.currencies[첫 통화].netAssets`에 1을 더하면 `diffs`가 정확히 1건이다. 그 `run`과 `path`가 맞다.
   - 복사본에서 실행 하나를 지우면 `onlyInBefore`에 그 키가 있고 `identical === false`.
   - 복사본의 `meta.dataVersion`만 바꾸면 `identical === true`이고 `metaDiffs`가 1건 이상이다.
   - `formatCompare` 첫 줄이 ‘같음’·‘다름’을 맞게 쓴다.
10. **명령줄** — 메모리 안 가짜 `SimIo`(경로 → 문자열 표)로:
    - `run --scenarios {SCENARIO_IDS[0]} --policies IDLE --seeds 1 --out a.json` → 0. `a.json`을 파싱하면 `runs`가 1개다. `err`에 ‘실행 1회’가 있다.
    - `compare a.json a.json` → 0. 숫자 하나를 바꾼 `b.json`과는 1.
    - `summary a.json` → 0. 출력에 표 머리(`|`)가 있다.
    - `run --seeds 0`, `run --seeds 21`, `run --policies 없는정책` → 2. 마지막 것은 `err`에 정책 목록이 있다.
    - 형식이 다른 JSON으로 `compare` → 2.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 시드를 바꿔도 결정적 정책의 결과가 같다 | 정상이다. 지금 엔진은 난수를 뽑지 않는다(사실 1). 요약 표에서 ‘서로 다른 결과 1’로 보인다. 엔진이 난수를 쓰기 시작하면 저절로 달라진다. |
| 시드를 엔진에도 넣는가 | 넣는다. `{ ...config, seed }`. 정책 난수는 같은 시드로 만든 별도 `RngState`다. |
| 시나리오 목록 | `SCENARIO_IDS` 전체 4개(M2 1개, M1 3개). |
| M1 취소 사례와 정상 사례의 지표가 같다 | 정상이다. Claude 확인으로 두 `loadScenario` 결과는 `id`·`titleKo`·`baseScenarioId`만 다르다. 취소는 플레이어 명령이다. 취소 경로는 `SEEDED_RANDOM`의 취소 명령이 지나간다. |
| ‘직원 대기일’의 정의 | 두 값을 낸다. 일이 없던 직원·일(`idleEmployeeDays`)과 담당 없이 기다린 업무·일(`waitingTaskDays`). 지금 정책은 plan으로 바로 배정하므로 후자는 대개 0이다. |
| 정시 인도의 정의 | `deliveredDay <= deliveryDeadlineDay`. 분모는 인도한 계약. 납기 지난 미인도는 따로 센다. TASK-0016과 같다. |
| 현금 부족일의 기준 시점 | 마감 직후. 그날 남은 미지급 의무가 있으면 부족일이다. |
| 실패 비율 | 넣지 않는다. 지급 불이행 규칙이 미정이다(DECISIONS 57행). |
| 비율을 반올림하는가 | 내림한다. basis point 정수다. |
| 출력에 계약·도시·견적 ID를 넣어도 되는가 | 넣지 않는다. 본사 전환 전후 비교가 깨진다. 실행 키는 시나리오·정책·시드뿐이다. |
| 정책이 낸 명령이 마감에서 거절된다 | 결함이다. `fits`가 엔진과 다르게 판단한 것이다. 시험 2가 실패해야 한다. 원인을 찾아 정책을 고친다. 엔진은 고치지 않는다. |
| 엔진이 예외를 던진다 | 고치지 않는다. 시나리오·정책·시드·날짜와 함께 보고한다. |
| 60초를 넘는다 | 먼저 `IDLE`만 400회 분량으로 돌려 엔진 몫을 잰다(사실 5: 대부분이 엔진 마감이다). 정책 몫이 크면 `planCommands` 호출을 줄인다(지난 날 후보 거르기, 유지 작업 대상이 없으면 건너뛰기). 엔진 몫이 크면 엔진을 고치지 않는다. 두 측정값과 함께 보고한다. |
| vitest 시간 한도 | 무거운 시험에 한도를 준다(60초). 파일 전체 30초를 넘으면 같은 실행 결과를 여러 시험이 함께 쓰게 한다(`beforeAll`에서 한 번 돌림). 시험 1·6·7의 시드 수는 줄이지 않는다. 그래도 넘으면 실제 시간을 보고한다. |
| `ON_TIME_FIRST`와 `MAX_CONTRIBUTION`의 지표가 같다 | 정상이다(사실 6). 지금 자료는 두 정책이 같은 순서로 고른다. 정책을 억지로 다르게 만들지 않는다. |
| 결정적 정책의 `ASSIGN_TASK`·`BOOK_SAILING` 적용이 0건이다 | 정상이다. plan 수락이 배정·예약을 함께 한다. 다시 예약·미배정 업무 배정 경로는 결과 보고 ‘지나간 경로’에 이유를 적는다. |
| 기준을 병합 커밋 `548c53c`로 바꿔야 하는가 | 이미 개발 브랜치 `4a90d77`(평택 병합 포함)을 기준으로 한다. 엔진 코드는 `4de152a`와 같다. |
| TypeScript를 어떻게 실행하는가 | `run.mjs` + Vite `runnerImport`(사실 2). `tsx` 등을 설치하지 않는다. |
| 샌드박스에서 `run.mjs`가 실패한다(vitest는 됨) | 패키지를 설치하거나 다른 실행 방법을 더하지 않는다. `simMain`은 시험 10이 검사한다. 완료 조건 3·4의 명령과 오류 출력을 그대로 보고한다. Claude가 다시 돌린다. |
| `.ts`에서 파일을 읽고 싶다 | 읽지 않는다. `SimIo`로 받는다. 시험은 `?raw`로 소스를 읽는다. |
| TASK-0016 함수를 써도 되는가 | 쓰지 않는다. 아직 이 기준에 없다. 같은 정의를 sim 안에 두고 주석에 ‘TASK-0016 병합 때 합칠 후보’라고 적는다. |
| `testkit.runDays`를 써도 되는가 | 쓰지 않아도 된다. 하루마다 정책을 불러야 하므로 고리를 sim에 둔다. `testkit.ts`는 고치지 않는다. |
| 영입·훈련·현지 활동도 정책에 넣는가 | 넣지 않는다. 다음 단계에서 더한다. 결과 보고 ‘범위 밖 발견’에 필요성만 적는다. |
| 시험 8이 일반 단어와 겹친 ID 때문에 잘못 실패한다 | 그 ID만 금지 목록에서 빼고 이유를 보고한다. 목록 전체를 끄지 않는다. |
| `102a23f` 대조가 환경 문제로 안 된다 | 완료를 막지 않는다. 명령과 오류 출력을 보고한다. Claude가 다시 한다. |
| `102a23f` 대조에서 차이가 나온다 | 고치지 않는다. `formatCompare` 출력 전체와 생각하는 원인을 보고한다. |
| 기존 시험이 실패한다 | 기대값을 고치지 않는다. 이 작업은 기존 파일을 바꾸지 않으므로 원인을 찾아 보고한다. |

## 완료 조건

1. 구현 지시 1~6과 시험 1~10이 반영되었다.
2. 검증
   - 시작 전에 `npx vitest run`을 한 번 돌려 기준 개수를 적는다. Claude 확인값은 27개 파일·803개 통과다.
   - 끝내기 전에 `bash tools/ai/review_checks.sh 4a90d77`를 실행한다. 8종이 모두 통과해야 한다.
     - vitest는 새 파일 1개를 더해 28개 파일이 되어야 한다.
     - 파이썬 시험 수(21·21·19)는 그대로여야 한다. 지도 생성 시험의 건너뛴 수는 환경에 따라 0개 또는 3개다(사실 7).
     - `npm run build`의 화면 묶음 크기가 바뀌지 않아야 한다. sim은 화면에서 import하지 않는다. 시작 전과 뒤의 JS 크기를 적는다.
3. 전체 실행과 결정성
   ```
   npm run sim -- run --out /tmp/scitrade-sim-a.json
   npm run sim -- run --out /tmp/scitrade-sim-b.json
   cmp /tmp/scitrade-sim-a.json /tmp/scitrade-sim-b.json
   npm run sim -- compare /tmp/scitrade-sim-a.json /tmp/scitrade-sim-b.json
   npm run sim -- summary /tmp/scitrade-sim-a.json
   ```
   - 각 실행이 400회(4시나리오 × 5정책 × 20시드)이고 60초 안에 끝난다. 두 번의 시간을 적는다.
   - `cmp` 출력이 없다(바이트까지 같다). `compare`의 종료 코드가 0이다.
   - 요약 표를 결과 보고에 붙인다. 사실 6의 참고값과 다르면 이유를 적는다.
4. 본사 전환 전후 대조(`102a23f` 부산판)
   ```
   rm -rf /tmp/scitrade-sim-102a23f && mkdir -p /tmp/scitrade-sim-102a23f
   git archive 102a23f | tar -x -C /tmp/scitrade-sim-102a23f
   cp -r src/engine/sim /tmp/scitrade-sim-102a23f/src/engine/sim
   ln -s "$PWD/node_modules" /tmp/scitrade-sim-102a23f/node_modules
   node /tmp/scitrade-sim-102a23f/src/engine/sim/run.mjs run --out /tmp/scitrade-sim-102a23f.json
   npm run sim -- compare /tmp/scitrade-sim-102a23f.json /tmp/scitrade-sim-a.json
   rm -rf /tmp/scitrade-sim-102a23f
   ```
   - 기대: ‘같음’, 메타 차이는 `dataVersion`뿐. 결과를 그대로 붙인다.
   - 두 판 사이에 바뀐 비시험 코드는 `src/engine/save.ts`와 `src/content/map.ts`뿐이다(사실 4). 그래서 sim의 `.ts` 파일(시험 제외)은 이 두 파일을 import하지 않는다. `sim.test.ts`는 `src/content/map.ts`를 써도 된다(이 대조에서는 시험을 돌리지 않는다).
   - 두 번째 시제품으로 두 판을 3시드씩 돌렸을 때 지표가 모두 같았다.
5. 바꾼 범위 확인
   - `git status --short --untracked-files=all`와 `git diff --name-only 4a90d77`가 다음뿐이다: `package.json`, `MANIFEST.json`, `src/engine/sim/` 아래 7개 파일, `docs/ai/tasks/results/TASK-0017.md`.
   - `git diff 4a90d77 -- package.json`이 더한 줄 1개뿐이다. 그 출력을 붙인다.
   - `git diff --quiet 4a90d77 -- package-lock.json index.html vite.config.ts tsconfig.json .gitignore src/ui src/content tools data tests` 종료 코드가 0이다.
   - `git diff --quiet 4a90d77 -- src/engine ':(exclude)src/engine/sim'` 종료 코드가 0이다.
   - 다음 명령의 결과가 0건이다.
     ```
     grep -rnE "PYEONGTAEK|BUSAN|HAIPHONG|SHANGHAI|YOKOHAMA|SINGAPORE|JAKARTA|HONG_KONG|OFFER_|EVI_|ROUTE[0-9]|EMP[0-9]|SHIPPER_|평택|부산|하이퐁|상하이|요코하마|싱가포르|자카르타|홍콩" src/engine/sim/
     ```
6. **변형 시험.** 아래를 하나씩 넣고, 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다. git으로 되돌리거나 stash하지 않는다.

   | 변형 | 실패해야 하는 시험 |
   |---|---|
   | `SEEDED_RANDOM`이 정책 난수 대신 `Math.random()`을 씀 | 1 결정성 (8도 실패) |
   | 정책이 `state.rng`로 뽑음 | 6 정책 난수 분리 |
   | 정책이 견적 ID 끝 글자로 후보를 거름(예: ID가 `_02`로 끝나면 건너뜀) | 7 이름 바꾸기 불변 |
   | 정책이 후보를 견적 ID 사전순으로 정렬 | 7 이름 바꾸기 불변 (안 잡히면 이유를 적는다) |
   | `netAssets`에서 미지급금을 빼지 않음 | 3 장부 항등식 |
   | 현금 부족을 `openDay` 직후 상태로 셈 | 4 지급 가능일 |
   | 정시 판정을 `<`로 바꿈 | 5 정시 경계 |
   | `compare`가 `metrics`의 첫 단계 키만 비교 | 9 비교 |
   | `MAX_CONTRIBUTION`이 수락 명령을 `fits` 확인 없이 냄 | 2 명령 결과 (M2에서 자금이 모자란 후보가 거절된다) |
   | `policies.ts` 주석에 본사 도시 ID를 씀 | 8 소스 검사 |

   - 모두 되돌린 뒤 `npx vitest run src/engine/sim`이 통과하고, 3의 `cmp`를 다시 해 같은지 확인한다.
7. 결과 보고를 아래 형식으로 썼다.

시간이 모자라면 뺄 수 있는 것(앞에서부터 뺀다). 뺀 것은 결과 보고 ‘완료 조건 대조’에 ‘미충족(시간)’으로 적는다. 나머지 조건은 빼지 않는다.
1. 완료 조건 4(부산판 대조). Claude가 검수 때 같은 대조를 한다.
2. 완료 조건 6의 변형 4행(ID 사전순 정렬)·8행(비교 첫 단계 키)·10행(주석에 도시 ID). 나머지 7행은 한다.

검수 때 Claude가 할 일(Codex는 하지 않는다):
- 개발 브랜치 `102a23f`와 평택 병합 커밋 `548c53c`에서 같은 도구를 돌려 지표가 같은지 본다. 평택 ‘숫자 불변’(개발 브랜치 DECISIONS 999행)의 독립 확인이다.
- TASK-0016 병합 뒤 겹치는 계산(정시 인도율·순자산)을 하나로 합친다.

## 결과 보고

`docs/ai/tasks/results/TASK-0017.md`에 머리말 형식으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유. 정책의 동점 처리, `fits` 호출을 줄인 방법을 여기에 적는다.
- **실행한 검증과 결과:** 명령별 통과·실패와 시험 개수. 시작 전 기준 개수, `sim.test.ts` 실행 시간, 전체 실행 시간 2회를 적는다.
- **지나간 경로:** 전체 실행(400회)에서 정책별 `appliedByType` 합계 표. 0인 종류(예: 다시 예약, 미배정 업무 배정)는 그 이유를 한 줄씩 적는다.
- **요약 표:** 완료 조건 3의 `summary` 출력.
- **본사 전환 전후 대조:** 완료 조건 4의 명령과 출력.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **변형 시험 표**
- **사용법:** Claude가 다른 커밋에서 돌릴 때의 명령. 다른 사본에 폴더를 복사해 돌리는 방법을 포함한다.
- **범위 밖 발견:** 고치지 않은 문제. 예: 엔진의 이상한 동작, 정책이 지나가지 못한 경로, 앞으로 더할 지표.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 확인은 필요 없다(화면 변경 없음).
