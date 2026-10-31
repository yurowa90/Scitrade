# TASK-0059 첫 화면 코드 분할: 규칙 2 화면과 문화 패널 지연 불러오기

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: TASK-0058 병합 기록 커밋(허브가 병합 뒤 알려 준다, 이하 `bd10189`). 기준 비교(`review_checks.sh`)는 `bd10189`로 한다.
  - `bd10189`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0059-code-split.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - TASK-0058이 `main.ts`·`ui/market.ts`를 고친다. 그래서 아래 위치는 **함수 이름으로 찾고**, 실제 줄을 결과 보고에 적는다.
- 근거: `docs/ai/design/code-split-0059/README.md`(세션 B 실측, `f38f9cf`). 먼저 읽는다. 시제품 diff(`proto-f38f9cf.diff`)는 크기 측정용이라 그대로 쓰지 않는다(형이 `any`이고, 불러오는 시점·실패 처리가 없다).
- 목적: 첫 화면에서 받아 해석하는 JS를 줄여, 앞으로 넣을 화면(M5 그림·이야기, 성장 보드, 정책 그물)이 들어갈 여유를 만든다. 지금 첫 화면 gzip은 132,034 B이고 한도는 140,000 B다(허브, TASK-0057 병합 뒤).
- 원칙:
  - 엔진·자료·저장 형식·게임 규칙은 바꾸지 않는다.
  - 화면에 그려지는 HTML은 규칙 1·규칙 2 모두 지금과 바이트로 같다. 지연 모듈을 불러온 뒤 기준.
  - `render()`는 동기로 둔다. 지연 모듈은 **상태를 바꾸기 전에** 기다린다(‘불러오는 중’ 칸을 그리지 않는다).

## 구현 지시

### 1. 규칙 2 화면 묶음 `src/ui/ops-screens.ts`(새 파일)

- 새 파일은 `ui/market.ts`·`ui/warehouse.ts`·`ui/money-alerts.ts`에서 `main.ts`가 쓰는 함수를 다시 내보낸다. 세 모듈은 그대로 두고, 이 파일만 진입점으로 쓴다.
- 두 함수는 첫 화면에 필요하므로 새 작은 모듈(예: `src/ui/ops-labels.ts`)로 옮긴다. 원래 모듈은 그것을 다시 내보낸다.
  - `constraintLabel`(`ui/recruitment.ts`가 정적으로 부름)과 그 이름표 표.
  - `main.ts`가 규칙 1에서도 부르는 함수가 있으면 같이 옮긴다. `f38f9cf` 기준 후보는 `counterpartyNameKo`(`partyKo`)와 `routeLabel`(`commandLabel`)이다. `bd10189`에서 다시 확인한다.
- `main.ts`는 세 모듈을 정적으로 부르지 않는다. 다음 꼴로 쓴다.
  - `let opsScreens: typeof import('./ops-screens') | null = null`
  - `ensureOpsScreens(): Promise<void>` — 한 번만 `import()`하고, 같은 약속(promise)을 재사용한다.
  - 규칙 2 화면 함수는 `opsScreens!.marketBlock(...)`처럼 부른다. 규칙 2 상태에서 `opsScreens`가 없으면 그리지 말고 예외를 던진다. 개발 중에 진입점 누락을 바로 드러내기 위해서다.
- **진입점(상태를 바꾸기 전에 `await ensureOpsScreens()`):**
  - 시나리오 고르기(`change`의 `scenario`, `startScenario` 호출 전). 규칙 2 시나리오일 때만 기다린다.
  - 불러오기(`load`)와 파일 가져오기. `loadText`가 저장 문자열을 해석한 뒤 상태를 바꾸기 전에, 저장의 시나리오가 규칙 2일 때 기다린다.
  - ‘처음부터’(지금 시나리오가 규칙 2이면 이미 불러온 상태다. 확인만 한다).
  - 첫 실행 시나리오가 규칙 2인 경로가 생기면 그 앞에서도 기다린다(`f38f9cf` 기준 첫 실행은 규칙 1).

### 2. 문화 패널 묶음 `src/ui/culture-panel.ts`(새 파일)

- **옮길 함수:** `ui/culture.ts`에서 패널을 열었을 때만 쓰는 함수를 옮긴다. `f38f9cf` 기준으로 `culturePanel`, `cultureNotebook`, `previewHtml`, `recordCard`, `recordFour`, `cultureResults`, `cultureVenues`다.
- **남길 함수:** 첫 화면·하루 진행에 쓰는 함수는 `ui/culture.ts`에 남긴다. `cultureTab`, `cultureAnchorBlocks`, `cultureResultTasks`, `cultureToastText`와 그 도우미다.
- **문구 상수:** `CULTURE_KO`는 남는 함수가 쓰는 칸과 패널만 쓰는 칸으로 나눈다. 패널 쪽 칸은 `culture-panel.ts`로 옮긴다. 화면 문구는 한 글자도 바뀌면 안 된다.
- **불러오는 방식:** `ensureCulturePanel()`을 지시 1과 같은 꼴로 만든다. `openCulture()`의 첫 줄(상태를 바꾸기 전)에서 기다린다. 탭 단추와 ‘결과 보기’ 단추 두 경로가 모두 여기를 지난다.
- **패널 닫힘:** `culturePanel`은 닫힌 상태에서 `''`를 돌려준다. 그래서 `render()`는 `ui.cultureOpen`일 때만 부른다.
- **기존 동작 유지:** 패널을 연 뒤의 초점·스크롤 동작(D13 맨 위 칸, 읽던 자리)은 지금과 같아야 한다. 기다림이 생겨도 `markOpened`·`render(true)`·`scrollIntoView` 순서는 그대로 둔다.

### 3. 한가할 때 미리 받기와 오프라인

- 첫 `render()`가 끝난 뒤 한가할 때 두 묶음을 미리 받는다(`requestIdleCallback`, 없으면 `setTimeout(…, 1)`). 규칙 1에서도 받는다. 교실에서 첫 화면이 뜬 뒤 연결이 끊겨도 규칙 2와 문화 패널을 쓸 수 있게 하기 위해서다.
- 미리 받기의 실패는 조용히 둔다(콘솔 경고 하나). 진입점에서 다시 시도한다.
- **진입점에서 불러오기에 실패하면:**
  - 상태를 바꾸지 않는다. 시나리오는 그대로, 오늘 할 일도 그대로, 패널은 닫힌 채다.
  - 알림 띠에 `warn`으로 ‘화면 일부를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.’를 보인다.
  - 다음 시도에서 다시 `import()`한다. 실패한 약속은 버린다.
  - 시나리오 고르기가 실패하면 `select` 값을 이전 시나리오로 되돌린다.
- 서비스 워커·캐시 정책은 이번에 넣지 않는다(범위 밖).

### 4. 시험

- **기존 시험:** 단언은 바꾸지 않는다. 규칙 2·문화 패널을 쓰는 시험이 지연 불러오기 때문에 실패하면 고칠 수 있는 곳은 두 가지뿐이다.
  - `main-testkit.ts`에 `await screensReady()`(두 묶음을 미리 불러 둠)를 더해, 해당 시험의 준비 단계에서 부른다.
  - 진입점 핸들러가 비동기가 되어 생긴 대기를 시험 도우미에서 기다린다.
- **새 시험(`src/ui/code-split.test.ts`):**
  1. 첫 렌더(규칙 1 기본 시나리오)는 두 묶음을 불러오기 전에 끝나고, HTML이 지금과 같다. 기준 HTML은 `bd10189` 출력의 고정 값이나 기존 시험의 스냅숏을 쓴다.
  2. 규칙 2 시나리오를 고르면 묶음을 불러온 뒤 시나리오가 바뀐다. 결과 HTML은 정적 import일 때와 같다.
  3. 묶음 불러오기가 실패하면(`import()`를 실패하게 흉내 냄) 시나리오·오늘 할 일·`select` 값이 그대로이고, 경고 알림이 보이고, 다음 시도에서 다시 불러온다.
  4. 규칙 2 저장을 불러오기·가져오기로 열면 묶음을 먼저 불러온다. 실패하면 상태가 바뀌지 않는다.
  5. 문화 탭과 ‘결과 보기’ 두 경로 모두 패널 묶음을 기다린 뒤 열린다. 열린 뒤 초점·`ui.cultureOpen`이 지금과 같다. 실패하면 패널이 닫힌 채다.
  6. `CULTURE_KO`를 나눈 뒤에도 남는 칸과 옮긴 칸을 합치면 지금과 같은 키·값이다.
  7. 불러오는 중에 명령이 또 들어오는 경우. 규칙 2 시나리오 고르기의 `import()`가 끝나기 전에 ‘하루 진행’을 두 번 누르고, 문화 탭도 두 번 누른다.
     - 하루가 한 번도 넘어가지 않거나, 넘어가도 기존 500ms 막기 규칙대로만 넘어간다. 시나리오가 반쯤 바뀐 상태(새 시나리오 이름 + 옛 상태)로 하루가 진행되면 실패다.
     - `import()`는 한 번만 불린다.
- **빌드 시험:** `dist/index.html`의 `script`·`modulepreload`에 `ops-screens`·`culture-panel` 청크가 없다. `tools/check_bundle_size.mjs` 출력에서 두 청크가 ‘나중에 받음’이다. 이 확인은 결과 보고에 출력으로 붙인다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/culture.ts`, `src/ui/market.ts`, `src/ui/warehouse.ts`, `src/ui/money-alerts.ts`, `src/ui/recruitment.ts`(import 줄만)
- 새 파일: `src/ui/ops-screens.ts`, `src/ui/ops-labels.ts`(또는 같은 역할의 이름), `src/ui/culture-panel.ts`, `src/ui/lazy.ts`, `src/ui/code-split.test.ts`
- `src/ui/main-testkit.ts`: 도우미 추가만. 기존 흉내의 동작은 바꾸지 않는다.
- 기존 시험 파일: 준비 단계에 `await screensReady()`를 더하는 줄만 바꾼다. 결과 보고에 파일·줄을 모두 적는다.
- `docs/ai/tasks/results/TASK-0059.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`, `data/**`, `schemas/**`, `vite.config.ts`, `package.json`, `package-lock.json`, `index.html`, `public/**`, `tools/**`(측정 도구·크기 검사기 포함), `src/ui/style.css`
- `tools/check_bundle_size.mjs`의 판정 규칙은 바꾸지 않는다.
  - 이미 `index.html`이 부르는 파일만 첫 화면으로 세고, 나중에 받는 청크는 청크 한도로만 잰다(`check_bundle_size.test.mjs`의 ‘나중에 받는 JS’ 시험).
  - 바꿔야 할 이유가 생기면 고치지 말고 결과 보고의 ‘질문’에 적는다.

## 지켜야 할 것

- **결정성:** 기본 비교 실행기 400회 출력이 `bd10189`와 바이트로 같다(`cmp` 0). 엔진을 건드리지 않으므로 같아야 한다. 다르면 멈추고 보고한다.
- **저장 호환:** 저장 형식·키·검증은 그대로다. `bd10189`에서 만든 규칙 1·규칙 2 저장을 이 빌드에서 불러와 같은 상태가 되는지 시험 4로 확인한다.
- **멈춤 기준:** 첫 화면 gzip이 `bd10189`보다 3,000 B 넘게 줄지 않으면 멈추고 보고한다. 원인으로 의심되는 것(정적 import가 남은 경로 등)을 함께 적는다.
- **바이트로 같은 화면:** 규칙 1 화면 HTML은 지연 모듈 없이 그려야 하고, 지금과 바이트로 같다. 규칙 2·문화 패널 HTML도 불러온 뒤 지금과 같다.
- **형 안전:** `any`를 새로 쓰지 않는다. 지연 모듈은 `typeof import('./…')`로 형을 잡는다.
- **지켜야 할 기존 시험(세션 A 의견, 2026-10-13).** 아래는 단언을 바꾸지 않고 통과해야 한다. 이 시험들이 실패하면 고치지 말고 멈춘다.
  - TASK-0033 규칙 1 기준 문자열 세 개(sha256 비교).
  - 기본 비교 실행기 400회 바이트 같음(위 ‘결정성’).
  - TASK-0056 저장 가져오기 거부 화면 시험.
  - TASK-0057 실패 화면의 초점 이동 시험.
  - 결과 보고에 이 시험들의 이름과 통과 출력을 따로 붙인다.

## 완료 조건

1. **크기**
   - 첫 화면 gzip이 **125,500 B 이하**이고 `bd10189`보다 6,500 B 이상 줄었다.
   - `CULTURE_KO`까지 나눴다면 124,500 B 이하를 기대한다. 못 미치면 이유를 적는다.
   - 출력 전체와 `bd10189` 대비 증감, 두 지연 청크 크기를 결과 보고에 적는다. 빌드 표시를 맞춘 사본으로 잰다.
2. **검사:** `npm run typecheck`, `npx vitest run`(시작 값 + 새 시험), `python3 tools/validate_data.py`, `node --test tools/browser/lib.test.mjs`, `node --test tools/check_bundle_size.test.mjs`가 모두 통과한다. `bash tools/ai/review_checks.sh bd10189`와 `--check bd10189`도 통과한다.
3. **결정성:** 400회 `cmp` 0.
4. **바꾼 범위:** `git diff --name-only bd10189`가 ‘고칠 수 있는 파일’ 안에 있다. `git diff bd10189 -- src/engine src/content data schemas vite.config.ts package.json index.html public tools src/ui/style.css`가 비어 있다.
5. **변형 시험:** 아래를 하나씩 넣고 실패하는 시험 이름을 적는다(되돌릴 때 편집기로).
   - 진입점 하나(규칙 2 시나리오 고르기)에서 `await ensureOpsScreens()`를 빼기.
   - 실패한 약속을 버리지 않기(재시도 불가).
   - 실패 때 `select` 값을 되돌리지 않기.
   - `openCulture`의 기다림을 빼기.
   - 규칙 2 시나리오 고르기에서 기다리기 전에 상태를 먼저 바꾸기(시험 7이 잡아야 한다).
   - `CULTURE_KO`에서 옮긴 칸 하나를 빠뜨리기.
   - `ops-labels`로 옮긴 함수를 `ops-screens`에서 다시 정적으로 부르게 해 첫 화면에 묶음이 다시 들어가게 하기. 이것은 빌드 확인이 잡아야 한다.
6. **결과 보고:** 다음 절을 넣는다.
   - 바꾼 파일과 설계 판단
   - 실행한 검증
   - 크기 표
   - 옮긴 함수 목록(`bd10189` 줄 → 새 위치)
   - 진입점 목록
   - 변형 표
   - 세션 B 측정 요청: 아래 ‘세션 B가 잴 것’
   - 범위 밖 발견, 질문

## 덤(선택): `main.ts` 안의 규칙 2 분기

- `main.ts` 안에도 규칙 2에서만 쓰는 분기(경영 보고·창고·환전 칸 조립)가 있다. 이것을 `ops-screens.ts`로 옮겨도 된다.
- 조건은 두 가지다. 위 완료 조건을 먼저 모두 채운 뒤에 하고, 옮기기 전후 첫 화면 gzip을 따로 적는다. 1,000 B 넘게 줄지 않으면 옮기지 않고 되돌린다.
- 옮겼으면 옮긴 줄 목록을 ‘옮긴 함수 목록’에 함께 적는다.

## 앞으로 붙일 화면(M5 그림·이야기)도 같은 방식으로 둔다

- 이번에 만드는 `ensureOpsScreens()`·`ensureCulturePanel()`은 같은 꼴을 따른다. 약속 하나를 공유하고, 실패하면 버리고, 진입점에서 상태를 바꾸기 전에 기다린다.
- 이 꼴을 `src/ui/lazy.ts`의 작은 도우미 하나(`lazyScreen(loader)` → `ensure()`·`get()`)로 묶는다. 두 묶음이 이것을 쓴다.
- M5의 그림·이야기 화면처럼 첫 화면에 안 보이고 무거운 화면은 같은 도우미로 지연 청크 하나씩 둔다. 그때의 지시서는 이 절을 가리킨다.
- 이번 작업은 도우미만 만든다. M5 자리를 미리 만들지 않는다.

## 세션 B가 잴 것 (Codex는 하지 않는다)

- **기존 측정 시나리오 15개:** Chromium 7개 프로필. `bd10189` 빌드 대비 값 차이 0. 문화 패널을 여는 `local-tab-position`·`culture-result-flow3`을 포함한다.
- **규칙 2 상태(1·8·15일):** TASK-0033 측정의 `measureM2`로 막대·시세표·Tab 순서가 `bd10189`와 같다.
- **오프라인 흉내:** 첫 화면을 띄운 뒤 두 가지 경우에 네트워크를 끊는다.
  - 미리 받기가 끝난 뒤에 끊으면 규칙 2 고르기와 문화 패널 열기가 된다.
  - 끝나기 전에 끊으면 경고 알림이 뜨고 상태가 그대로이고, 다시 연결한 뒤 재시도하면 된다.
- **첫 화면 시간(참고):** 4배 느린 CPU 흉내(DevTools CPU throttling 4×)에서 첫 렌더까지의 시간을 `bd10189`와 비교한다. 판정 기준은 아니다.

## 예상 질문과 기본값

| 질문 | 기본값 |
|---|---|
| 지연 모듈을 기다리는 동안 단추를 또 누르면? | 같은 약속을 재사용하므로 한 번만 불러온다. 기다리는 동안의 두 번째 진입은 첫 진입이 끝난 뒤 그 결과로 진행한다. 기존 500ms 누름 막기는 그대로다 |
| 규칙 2에서 `opsScreens`가 없는 채로 `render()`가 불리면? | 진입점이 먼저 기다리므로 일어나면 안 된다. 예외를 던져 시험에서 드러나게 한다 |
| 문화 패널 대신 문화 화면 전체를 나누면 더 줄지 않나? | 탭·알림·읽던 자리 기준은 첫 화면과 하루 진행에 쓰인다. 나누면 첫 화면이 지연 모듈에 의존하게 된다. 이번에는 패널만 나눈다 |
| 자료(`characters`·`scenarios`)나 엔진의 규칙 2 부분도 나누면? | 이번 범위가 아니다. 시나리오 읽기·저장 불러오기가 비동기가 되고 결정성 경로에 걸린다. 따로 설계한다(세션 A·허브) |
| `index.html`에 preload 힌트를 넣으면? | `index.html`은 손대지 않는다. 미리 받기는 지시 3의 한가할 때 `import()`로 한다 |
