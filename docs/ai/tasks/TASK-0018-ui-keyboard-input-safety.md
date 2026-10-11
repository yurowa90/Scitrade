# TASK-0018 화면 키보드·입력 안전·알림·문구

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 평택 본사 전환(TASK-0015)이 개발 브랜치에 `548c53c`로 반영됐다. 개발 브랜치 `4a90d77` 위에 만든 `codex/TASK-0018`에서 작업한다. 시작할 때 `git rev-parse --short HEAD`를 실행해 결과 보고에 적는다.
  - 평택 구현 스냅숏 `4de152a`와 `4a90d77`의 화면 코드 차이는 `src/ui/map.ts` 한 줄(홍콩 이름표 위치)뿐이다. 아래 줄 번호와 Claude 확인값은 `4de152a` 사본에서 냈지만 이 작업의 파일에서는 그대로 맞다. 모든 diff·검사 명령의 기준 커밋은 `4a90d77`다.
  - 작업 브랜치는 이 지시서를 올린 개발 브랜치 커밋에서 시작한다. 그 커밋이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 `git diff 4a90d77` 결과에 나와도 이 작업의 변경으로 치지 않는다.
- 결정 근거:
  - `docs/DECISIONS.md`
    - 850행: P14-03. 키보드 Shift+Tab으로 ‘하루 진행’에 가면 화면이 −261~−503px 튄다. CSS 두 가지는 실패했다.
    - 854행: ‘빼기’에는 두 번 누름 막기가 없다.
    - 893~896행: 가로 기기 결정에서 미룬 것. Tab 순서(화면 코드 순서가 지도 → 동료 → 거래), 떠나기 전 확인, `overscroll-behavior-x`.
    - 616·634행: 알림의 `role="status"`는 첫 그리기에만 붙인다. 화면 전체를 다시 그리므로 상태 영역도 매번 새로 생긴다. 실제 듣기 확인은 하지 않았다.
    - 928행: 패널 열고 닫기에도 500ms 두 번 누름 막기를 건다(선례).
    - 941행: 개발 단계 부호(P1·P2)는 학생에게 뜻이 없다. ‘이번 판에 없습니다’로 쓴다.
    - 991행: 미지급이면 급여 지급 가능일을 ‘없음’으로 쓰고 ‘평소대로 지급’ 문장을 뺀다(문화 화면 규칙).
  - `docs/UI_SPEC.md` 51행(키보드 탐색·명확한 포커스), 62행(UI_ROSTER).
  - `docs/ART_DIRECTION.md` 27행: 움직임 줄이기에서는 같은 정보를 글자로 보인다.
  - `docs/RESEARCH_APPLICATION.md` 25행(REF-04), 84행(DK-20·22: 확정 전 고용 뒤 잔액과 운영 가능일).
  - `docs/USABILITY_TEST_M2A.md` 172·175행: 자동 저장이 없고, 떠나기 전에 묻지 않는다.
  - `docs/ai/CLASSIC_GAME_HANDOFF.md` 56행: 새 빌드는 대상 커밋을 다시 적는다.
  - 2026-10-09 남은 일 점검 계획의 1차 세션 S4: B56 → B55·B57 → B58 → B59 → B54 → B25 순서.

## 목표

결정이 필요 없는 화면 결함을 한 세션에서 고친다. 화면 시험 파일(`main.test.ts`)을 이 세션만 고치게 하려고 묶었다.

1. **입력 안전 (B56):** ‘빼기’·열고 닫기 두 번 누름 막기, 떠나기 전 확인, 가로 쓸기 뒤로 가기 막기.
2. **키보드 (B55·B57):** 화면 코드 순서를 보이는 순서로, 건너뛰기, Shift+Tab 튐, ‘가져오기’ 키보드 접근, ‘결과 보기’까지 Tab 한 번.
3. **알림·의미 (B58):** 한 번만 만드는 알림 영역, 동료 카드·운영표의 선택 상태, 고정 막대 이름.
4. **문구 (B59):** 훈련의 급여 지급 가능일 규칙을 문화 화면과 같게, 학생 화면의 개발 단계 부호 제거.
5. **면담 (B54):** 고용 뒤 원화 사용 가능액과 급여 지급 가능일.
6. **빌드 표시 (B25):** 화면에 빌드 해시. 시간이 모자라면 이 항목만 빼고 보고한다.

**바꾸지 않는 것:**
- 엔진, 경제 규칙, 장부, 저장 형식, 자료(`data/**`).
- 화면 배치. 세 열(1001px 이상)과 한 열(1000px 이하)의 격자 영역 문자열은 그대로 둔다.
- 플레이어가 읽는 판단 문구. 예외는 ‘구현 지시 4’가 정한 문장뿐이다.
- M1 화면 동작.

## 먼저 읽을 파일

줄 번호는 `4de152a` 기준이다.

- `src/ui/main.ts`
  - `focusWithoutScroll` 67~79행, `queue()` 127~152행, `endDay()` 154~207행.
  - `topbar()` 244~276행. 머리 문구 253행, 가져오기 263행, 고정 막대 267행, 하루 진행 273행.
  - `quoteBlock` 307~334행(329행 ‘개발용 가상값(DESIGN)’).
  - `delayPanel` 540~560행(555·556행 ‘M3 사건 시스템’).
  - `resourcePanel` 577~614행(608행 ‘규칙 M2a’·‘규칙 M1’).
  - `crewPanel` 652~671행, `queuePanel` 714~724행(722행 성장 알림), `logPanel` 726~734행(732행 가정 목록).
  - `render()` 736~808행. 화면 HTML 749~760행, 알림 760행, 첫 그리기 표시 769~771행, 초점 복원 798~807행.
  - 클릭 처리 874~985행. 기록장 901~903행, 성장 상세 906~908행, 면담 913~915행, 빼기 932~935행, 처음부터 952~955행, 저장 956~963행, 불러오기 964~973행, 내보내기 974~982행.
  - keydown 987~995행, change 997~1022행, `loadText` 1024~1035행.
- `src/ui/growth.ts`: `trainingBlock` 32~62행(47행 지급 가능일 함수, 52행 ‘평소대로 지급’, 55행 지급 가능일 줄), `growthStatus` 103~105행.
- `src/ui/culture.ts` 62~66행(`runway`·`runwayEnd`·`runwayUnpaid`·`runwayDay`·`wages`·`unpaid` 문구), 189~206행(지급 가능일 규칙). **읽기만 한다.**
- `src/ui/crew-status.ts`: `crewNoteKo` 12~28행(26행 LEGACY_FIXED 문장).
- `src/ui/card.ts`: `crewCard` 43~73행(53·54행 article 속성).
- `src/ui/recruitment.ts`: `interviewPreview` 65~76행, `interviewBlock` 78~92행(82~87행 dl), `recruitmentPanel` 94~122행, `candidateCard` 125~128행, `crewRow` 129~133행.
- `src/ui/session.ts`(`initialUiState` 8~19행), `src/ui/focus.ts`.
- `src/ui/style.css`: 24·25행(스크롤 여백·overscroll), 42~57행(단추·초점), 66~71행(고정 막대), 86~115행(격자), 185~225행(선택 카드·움직임 줄이기), 346~356행(운영표), 440~452행(터치·아래쪽 알림), 510·511행(알림 단추).
- `src/engine/previews.ts`: `payrollRunwayDay` 40~53행(오늘 급여도 못 내면 `day − 1`, 끝까지 되면 null). **읽기만 한다.**
- `src/engine/engine.ts`: `planState` 170~178행, `hireCandidate` 644~665행(계약금을 바로 내고 다음 날부터 근무). **읽기만 한다.**
- 시험 틀: `src/ui/main-testkit.ts` 전체, `src/ui/map-integration.test.ts` 8~45행(자체 `document` 흉내).
- 기존 시험: `src/ui/main.test.ts`(특히 196·365·375·382·532~566·581~597·623·794~831·854~901·986~998행), `src/ui/growth.test.ts` 44~57·102행, `src/ui/recruitment.test.ts` 14~25·111~119·325~337행, `src/ui/crew-card.test.ts` 전체, `src/ui/trade-reports.test.ts` 22~31행, `src/ui/culture.test.ts` 37~40행.
- 위 ‘결정 근거’의 문서 줄.

## 범위

**포함 (이 순서로 한다)**
1. B56: UX-06(두 번 누름), UX-07(떠나기 전 확인, `overscroll-behavior-x`).
2. B55·B57: UX-02(화면 코드 순서, 건너뛰기), UX-03(Shift+Tab 튐), UX-08(가져오기), UX-40(결과 보기).
3. B58: UX-09(알림 영역), UX-10(카드·운영표 선택 상태, 고정 막대 이름).
4. B59: UX-13(훈련 지급 가능일), UX-19(개발 단계 부호).
5. B54: 면담의 고용 뒤 원화 사용 가능액·급여 지급 가능일(원화만).
6. B25: 빌드 해시 표시(`vite.config.ts`의 `define`).

**제외**
- 배치 변경(B53). 한 열 배치의 격자 순서도 바꾸지 않는다.
- Esc 닫기·공통 단축키(B60), 지도 클릭 상세·이름표(B61), 글꼴 내장과 `index.html`(B26).
- 경영 보고·일정·병목·결산 화면(B37·B38·B36). 동료 도감 필터(B48).
- 견적의 ‘수락 뒤 사용 가능 자금(USD)’. USD·KRW를 합친 운영 가능일(B34 사용자 결정 대기).
- 자동 저장, iOS Safari의 `pagehide` 저장.
- 카드의 ‘강화 +0’(M2b에서 정한다).
- 엔진·자료·지도 코드가 만드는 문장(아래 ‘범위 밖 발견’ 후보).
- 브라우저 측정. Sol 샌드박스에서는 Chromium이 뜨지 않는다(`docs/ai/tasks/results/TASK-0012.md` 99~102행). Claude가 잰다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/style.css`, `src/ui/main.test.ts`, `src/ui/main-testkit.ts`
- `src/ui/growth.ts`, `src/ui/growth.test.ts`, `src/ui/crew-status.ts`, `src/ui/card.ts`, `src/ui/crew-card.test.ts`
- `src/ui/recruitment.ts`, `src/ui/recruitment.test.ts`, `src/ui/focus.ts`, `src/ui/session.ts`, `src/ui/session.test.ts`
- `vite.config.ts`
- `src/ui/map-integration.test.ts`: `start()` 안의 전역 흉내(`vi.stubGlobal('window', …)` 한 줄 추가, `vi.stubGlobal('document', …)` 한 줄 수정)만. 단언은 고치지 않는다.
- `src/ui/trade-reports.test.ts`: 24행의 M1 각주 문자열 한 줄만.
- `docs/ai/tasks/results/TASK-0018.md` (결과 보고)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

새 파일은 결과 보고 말고 만들지 않는다. 새 시험은 위의 기존 시험 파일에 더한다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/engine/**`, `src/content/**`. 읽고 import만 한다.
  - `src/ui/culture.ts`, `src/ui/culture.test.ts`, `src/ui/map.ts`, `src/ui/projection*`, `src/ui/pixel*`, `src/ui/sprite*`, `src/ui/reports.ts`, `src/ui/trade.ts`, `src/ui/html.ts`, `src/ui/assets.ts`.
  - `index.html`, `package.json`, `package-lock.json`. 새 npm 의존성을 넣지 않는다.
  - `tools/**`, `scripts/**`, `schemas/**`, `public/**`.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `data/**`, `tests/acceptance_cases.json`
  - `tools/validate_data.py`, `tools/test_validate_data.py`
  - `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`
- 다른 세션이 동시에 작업한다. 이 파일들을 건드리지 않는다.
  - TASK-0016: `src/engine/reports.ts`, `src/engine/testkit.ts`, `src/engine/acceptance-p0-acc.test.ts`, 새 `src/engine/capacity.ts`와 새 엔진 시험.
  - TASK-0017: `src/engine/sim/**`, `package.json`.
  - TASK-0019: `tools/ai/review_checks.sh`, `tools/build_package.py`, `.gitignore`, `tools/deploy/**`, `tools/browser/**`, `tools/check_fact_mixing.py`, `tools/test_check_fact_mixing.py`.
  - TASK-0020·0021: 결과 파일만 쓴다.

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다.
- 화면은 엔진 상태를 읽기만 한다. 미리 보기는 `planState` 사본으로 계산한다. 화면에 현금·재고를 따로 두지 않는다.
- 기존 시험의 단언은 아래 ‘바꿔도 되는 기존 단언’ 목록만 바꾼다. 다른 기존 시험이 실패하면 기대값을 고치지 말고 원인을 찾는다. 못 찾으면 보고한다.
- 새로 쓰는 시험 줄에 도시 이름·도시 ID·견적 ID·노선 ID·사건 ID를 쓰지 않는다.
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `SHANGHAI`, `HAIPHONG`, `YOKOHAMA`, `SINGAPORE`, `JAKARTA`, `HONG_KONG`, `OFFER_*`, `ROUTE01`, `EVI_*`, ‘평택’, ‘부산’, ‘상하이’, ‘하이퐁’, ‘요코하마’.
  - 견적은 `ui.click({ action: 'accept' })`처럼 속성 일부로 첫 단추를 고른다. 값이 필요하면 `config`와 상태에서 꺼낸다.
  - 기존 도우미(`readySave`, `ready`, `scout`, `quest`, `hired`, `check`)는 그대로 써도 된다.
  - 시나리오 ID 상수(`SCENARIO_M1_ONE_TRADE`, `SCENARIO_M1_DELAY_ACCEPTED`, `SCENARIO_M2_MULTI_TRADE`)는 써도 된다.
- 플레이어가 읽는 글에 실제 회사 이름을 넣지 않는다.
- 사용자에게 보이는 글과 코드 주석은 한국어로 쓴다.
- 네트워크 조사는 하지 않는다. `chainportal.co.kr`에는 접속하지 않는다. robots.txt를 지킨다.
- 시험 환경을 피하려고 `?.` 선택 호출을 새로 넣지 않는다. 시험 틀을 넓힌다(TASK-0014 검수 기록).

## 구현 지시

### 0. 시험 틀을 먼저 넓힌다

main.ts는 모듈을 읽는 순간 아래 2·3절의 전역 호출(`document.addEventListener`, `document.body.insertAdjacentHTML`, `document.getElementById('live-status')`, `window.addEventListener`)을 한다. 지금 두 시험 틀은 이것을 흉내 내지 않는다.
- **Claude 확인:** `4de152a` 사본에서 main.ts만 바꾸자 `map-integration.test.ts` 7개가 모두 실패했다. 아래 흉내를 더하자 통과했다.

**`src/ui/main-testkit.ts` (`startUi`)**
- `window` 흉내: 기존 `innerHeight: 800`, `scrollBy`는 그대로 둔다. 다음을 더한다.
  - `scrollX: 0`, `scrollY: 0`.
  - `scrollTo`: `vi.fn`. 부르면 `scrollX`·`scrollY`를 그 값으로 바꾼다.
  - `addEventListener`: 이름별로 콜백을 기록한다.
  - `requestAnimationFrame`: 콜백을 `setTimeout(() => cb(0), 16)`으로 부른다. 가짜 타이머로 진행한다.
- `document` 흉내에 더한다.
  - `addEventListener`: 이름별로 콜백을 기록한다.
  - `body.insertAdjacentHTML`: `vi.fn`.
  - `getElementById('live-status')`: 알림 영역 흉내를 돌려준다. `textContent`에 값을 쓸 때마다 `announcements` 배열에 쌓는다. 읽으면 마지막 값을 돌려준다.
  - `createElement`는 그대로 둔다. `main.test.ts` 998행이 호출 수 11을 센다.
- 요소 흉내의 `closest(selector)`: 쉼표로 나눈 선택자 가운데
  - `.statusbar`가 있고 요소가 `data-action="end-day"`면 그 요소를 돌려준다.
  - `.flash-toast`와 `culture-result`, `.skip-links`와 `skip-to`도 같다.
  - 나머지 분기와 `closestSelectors` 기록은 그대로다.
- 돌려주는 객체에 더한다: `win`, `announcements`, `fireDoc(name, ev)`, `fireWindow(name, ev)`, `keydown(target, key)`(기록된 app keydown 콜백에 `{ key, target, preventDefault: vi.fn() }`를 넘긴다).
- 기존 멤버와 동작은 바꾸지 않는다.

**`src/ui/map-integration.test.ts` (`start()` 안 두 줄만)**
- `vi.stubGlobal('document', …)` 앞에 `vi.stubGlobal('window', { innerHeight: 800, scrollX: 0, scrollY: 0, scrollBy: () => undefined, scrollTo: () => undefined, addEventListener: () => undefined, requestAnimationFrame: () => 0 })`를 더한다.
- `document` 흉내에 `addEventListener: () => undefined`, `body: { insertAdjacentHTML: () => undefined }`를 더한다. `getElementById`는 `'live-status'`에 `{ textContent: '' }`를, 나머지에 `null`을 돌려준다.

### 1. 입력 안전 (B56: UX-06·07)

**a) ‘빼기’ 두 번 누름 (932~935행)**
- 명령 ID(`data-command`)로 대기 명령을 찾아 뺀다. 없으면 아무것도 빼지 않는다.
- 다시 그린 뒤 `ignoreClicksUntil = Date.now() + 500`을 건다.
- 지금은 두 번째 누름이 같은 자리로 올라온 다음 명령의 ‘빼기’를 눌러 명령 두 개가 빠진다.

**b) 열고 닫기 두 번 누름**
- 성장 상세(`detail`, 906~908행), 면담(`interview`, 913~915행), 기록장(`culture-book`, 901~903행)도 다시 그린 뒤 같은 500ms를 건다.
- 카드 선택·필터·지도 범위는 같은 값을 다시 넣을 뿐이라 걸지 않는다.

**c) 떠나기 전 확인**
- `session.ts`에 순수 함수를 더한다.
  ```ts
  /** 대기 명령이 있거나, 마지막 시작·불러오기·저장·내보내기 뒤에 상태가 바뀌었으면 true. */
  export function hasUnsavedWork(pending: Command[], state: GameState, savedState: GameState | null): boolean;
  ```
  - 판정은 `pending.length > 0 || state !== savedState`다(객체 동일성).
- `main.ts`에 모듈 변수 `savedState`를 둔다. 다음 순간에 `savedState = state`로 맞춘다.
  - `startScenario` 끝(처음부터·시나리오 바꾸기·첫 시작).
  - `loadText` 성공(불러오기·가져오기).
  - 저장 성공(`localStorage.setItem`이 예외 없이 끝난 뒤).
  - 내보내기.
- `window.addEventListener('beforeunload', …)`
  - `hasUnsavedWork`가 false면 아무것도 하지 않는다.
  - true면 `ev.preventDefault()`와 `ev.returnValue = ''`.
- 계획서 문구는 ‘대기 명령이 있을 때만’이었다. 이 지시서는 UX-07 요구(‘저장하지 않은 진행’)와 사용성 시험 문서 172·175행에 맞춰 저장하지 않은 진행도 포함한다.

**d) 가로 쓸기 뒤로 가기**
- `style.css` 25행을 `html, body { overscroll-behavior-y: none; overscroll-behavior-x: none; }`로 바꾼다. 기존 시험이 찾는 `overscroll-behavior-y: none` 문자열은 남는다.

### 2. 키보드 (B55·B57: UX-02·03·08·40)

**a) 화면 코드 순서 (`render()` 749~760행)**
- `#app` 안의 순서를 다음으로 바꾼다.
  1. 건너뛰기 `<nav class="skip-links">`(아래 b).
  2. `${topbar()}`.
  3. 아래쪽 알림(`.flash-toast`). `</header>` 바로 뒤, `<main>` 앞이다(아래 e).
  4. `<main class="layout …">` 안: 거래(문화가 있으면 `<div class="maincol">` 전체) → 동료(`crewPanel`) → 자원 예약 → 오늘 할 일 → 지도 → 경영 보고 → 기록.
- 이 순서는 세 열 배치(1001px 이상, ‘전 세계’ 지도 배치 포함)에서 보이는 순서와 같다. 위 왼쪽 거래 → 오른쪽 동료·자원·오늘 할 일 → 아래 줄 지도·보고·기록.
- 격자 영역 문자열(`style.css` 86~115행)은 바꾸지 않는다. CSS `order`나 `reading-flow`를 쓰지 않는다.
- 한 열 배치(1000px 이하)는 보이는 순서가 거래 → 오늘 할 일 → 동료 → 자원 → 보고 → 지도 → 기록이라 Tab 순서와 두 군데 다르다. TASK-0014가 정한 한 열 순서를 지키려고 그대로 둔다. 결과 보고의 Tab 순서 표에 차이를 적는다.

**b) 건너뛰기**
- 마크업:
  ```html
  <nav class="skip-links" aria-label="바로 가기"><button data-action="skip-to" data-target="trade-h">거래로 바로 가기</button><button data-action="skip-to" data-target="queue-h">오늘 할 일로 바로 가기</button></nav>
  ```
- 클릭 처리에 `case 'skip-to'`를 더한다.
  - 대상은 `trade-h`·`queue-h` 두 개만 받는다. 다른 값이면 아무것도 하지 않는다.
  - `scrollIntoView({ block: 'start' })` 뒤 `focus({ preventScroll: true })`. 수락 뒤 계약 제목과 같은 방식이다(144~150행).
- CSS:
  - 초점이 없을 때는 아래 `.visually-hidden`과 같은 규칙으로 숨긴다. `min-height: 0`도 둔다(터치 44px 규칙보다 앞서게).
  - 초점을 받으면 `position: fixed; top: .5rem; left: .5rem; z-index: 30`으로 보인다. 글자 12px 이상.

**c) Shift+Tab 튐 (UX-03, P14-03)**
- 추정 원인(측정으로 확인하지 않았다): 고정 막대·아래쪽 알림 안의 요소가 Tab으로 초점을 받으면, Chromium이 스크롤 여백(`scroll-padding-top/bottom`) 안에 가려졌다고 보고 화면을 움직인다. 이 요소들은 늘 화면 안에 있으므로 Tab 초점 때의 스크롤은 되돌려도 된다. CSS 두 가지는 실패했다(DECISIONS 850행). CSS로 다시 시도하지 않는다.
- `focus.ts`에 상수를 더한다: `export const FIXED_REGION_SELECTOR = '.statusbar, .skip-links, .flash-toast';`. 기존 `FOCUS_FALLBACK_SELECTORS`는 바꾸지 않는다(`growth.test.ts` 111~112행).
- `main.ts`:
  - `document.addEventListener('keydown', …, true)`: `ev.key === 'Tab'`이면 `lastTabAt = Date.now()`.
  - `document.addEventListener('focusin', …)`:
    - `Date.now() - lastTabAt > 100`이면 아무것도 하지 않는다. 포인터·코드 초점은 건드리지 않는다.
    - 대상이 `closest(FIXED_REGION_SELECTOR)` 안이 아니면 아무것도 하지 않는다.
    - 그 밖에는 `window.scrollX`·`scrollY`를 기억한다. `window.requestAnimationFrame`에서 값이 바뀌었으면 `window.scrollTo(x, y)`로 되돌린다.
  - 기존 app의 keydown(987~995행)과 별개다. app에 같은 이름의 리스너를 두 번 붙이지 않는다(시험 틀이 이름별로 하나만 기록한다).
- 기존 초점 복원(`preventScroll`, `focusWithoutScroll`)은 바꾸지 않는다.

**d) 가져오기 (UX-08, 263행)**
- `<input type="file">`의 `hidden`을 지우고 `class="visually-hidden"`을 단다. `label.file-btn` 구조와 change 처리는 그대로다.
- CSS:
  ```css
  .visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0; }
  .file-btn:has(> input:focus-visible) { outline: 3px solid var(--sky-deep); outline-offset: 2px; }
  ```
  - `display: none`·`visibility: hidden`·`tabindex="-1"`을 쓰지 않는다.

**e) 결과 보기까지 Tab 한 번 (UX-40)**
- 알림(`.flash-toast`)을 `</header>` 바로 뒤에 둔다(위 a의 3). 화면 위치는 CSS(`position: fixed`)라 그대로다.
- 그러면 하루 진행 뒤 초점이 ‘하루 진행’ 단추에 있을 때 Tab 한 번으로 ‘결과 보기’에 닿는다.
- 알림을 `<header>` 안에 넣지 않는다. `main.test.ts` 986~998행이 머리 HTML이 바뀌지 않는지 비교한다.
- 하루 진행 뒤 초점 위치(‘하루 진행’ 단추)는 바꾸지 않는다.

### 3. 알림·의미 (B58: UX-09·10)

**a) 한 번만 만드는 알림 영역**
- 모듈을 읽을 때 한 번 만든다.
  ```ts
  document.body.insertAdjacentHTML('beforeend', '<div id="live-status" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>');
  const liveStatus = document.getElementById('live-status')!;
  ```
  - `#app` 밖이라 다시 그려도 사라지지 않는다.
  - `document.createElement`를 쓰지 않는다(`main.test.ts` 998행의 호출 수).
  - `index.html`은 고치지 않는다.
- `session.ts`에 순수 함수 둘을 더한다.
  ```ts
  type Flash = NonNullable<ReturnType<typeof initialUiState>['flash']>;
  /** 이번 그리기에서 알릴 글. 없으면 null. */
  export function nextAnnouncement(input: {
    flash: Flash | null; announcedFlash: Flash | null;
    growthFresh: boolean; growthNotices: string[]; growthDay: number | null;
  }): string | null;
  /** 같은 글을 다시 알릴 때도 내용이 바뀌게 끝에 줄바꿈 없는 공백(U+00A0)을 붙였다 뗀다. */
  export function liveRegionText(current: string, next: string): string;
  ```
  - `nextAnnouncement` 규칙:
    1. `flash`가 있고 `flash !== announcedFlash`(새 객체)면 `flash.text`를 넣는다.
    2. `growthFresh`이고 `growthNotices`가 있고 `growthDay !== null`이고 `flash?.action !== 'culture-result'`면 `${growthDay}일 하루 진행 — 경험치·레벨 변화: ${growthNotices.join(', ')}`을 넣는다. 문화 결과가 있는 날 성장 알림을 읽지 않는 기존 규칙(722행)과 같다.
    3. 넣은 글을 공백 하나로 잇는다. 없으면 null.
  - `liveRegionText`: `current === next`면 `next + '\u00a0'`, 아니면 `next`.
- `render()`에서 첫 그리기 표시를 끄기 전(769~771행 앞)에 계산한다.
  - 결과가 있으면 `liveStatus.textContent = liveRegionText(liveStatus.textContent ?? '', 결과)`.
  - 그 뒤 `announcedFlash = ui.flash`. `announcedFlash`는 main.ts 모듈 변수다.
- 다시 그리는 요소의 `role="status"`를 모두 지운다.
  - 아래쪽 알림(760행): role 분기를 지운다.
  - `growthStatus`(growth.ts 103~105행): `announce` 인수와 role을 지운다. 호출(722행)도 맞춘다.
  - 그러면 `#app` HTML에 `role="status"`와 `aria-live`가 하나도 없다.
- `initialUiState`의 필드는 지우거나 이름을 바꾸지 않는다. `cultureResultFresh`가 쓰이지 않게 되어도 남긴다(`culture.test.ts` 38~39행이 확인한다). 새 화면 상태는 main.ts 모듈 변수로 둔다.
- 오늘 할 일 칸의 같은 문구(719행)는 그대로 둔다(TASK-0014 결정).

**b) 동료 카드의 의미와 선택 상태 (card.ts 53·54행, recruitment.ts 127행)**
- 직원 카드와 후보 카드 article에 `role="button" aria-pressed="${selected}"`를 단다.
  - 속성 순서: `class` → `data-action` → `data-emp` → `tabindex="0"` → `role` → `aria-pressed` → `aria-label`. `main.test.ts` 109행 정규식이 `<article class="card …"`로 시작하는 것을 찾는다.
  - 문화 화면의 직원 고르기 단추도 `aria-pressed`를 쓴다(같은 방식).
- 선택된 카드에는 글자 표시 `<span class="card-picked">✓ 선택됨</span>`을 둔다. 직원 카드는 `.card-top` 안 이름 뒤, 후보 카드는 제목(h3) 뒤다. 색과 움직임 없이도 선택을 알 수 있게 한다(ART_DIRECTION 27행).
- 카드를 다시 눌러도 선택이 풀리지 않는 동작은 그대로다(TASK-0014).

**c) 운영표 행 (recruitment.ts 132행)**
- `tr`에서 `tabindex="0"`과 `aria-selected`를 지운다. 일반 표의 `aria-selected`는 지원되지 않는다.
- `tr`의 `class`·`data-action="select-card"`·`data-emp`는 남긴다(포인터로 행 어디를 눌러도 고른다).
- 이름 칸(`th scope="row"`)의 `<span class="nm">이름</span>`을 단추로 감싼다.
  ```html
  <button class="roster-pick" data-action="select-card" data-emp="…" aria-pressed="true|false"><span class="nm">이름</span></button>
  ```
  - 선택된 행에는 단추 뒤에 `<small class="picked">✓ 선택됨</small>`을 둔다.
  - CSS: `.roster-pick`은 테두리·배경·안쪽 여백 없이 글자처럼 보인다. 왼쪽 정렬, 글꼴·색 상속. 터치 44px 규칙은 그대로 받는다.
- 화면의 keydown 처리(987~995행)는 단추가 아닌 대상(카드 article)에만 적용한다. 조건에 `!(el instanceof HTMLButtonElement)`를 더한다. 단추는 기본 동작(클릭)으로 처리된다.

**d) 고정 막대 이름 (267행)**
- `<div class="statusbar" id="status-h" tabindex="-1" role="region" aria-label="오늘 상태">`. 앞부분(`<div class="statusbar"`)과 기존 속성 순서는 그대로 두고 `role`만 더한다.

### 4. 문구 (B59: UX-13·19)

**a) 훈련의 급여 지급 가능일 (growth.ts)**
- 공통 함수를 `growth.ts`에서 내보낸다. 문화 화면(`culture.ts` 63·64·191·192행)과 같은 글자다. `culture.ts`는 고치지 않는다.
  ```ts
  /** null이면 캠페인 끝까지, 오늘보다 앞이면 ‘없음’. */
  export function payrollRunwayKo(day: number | null, today: number, campaignDays: number): string;
  // null → `${campaignDays}일(캠페인 끝)까지`, day < today → '없음', 그 밖 → `${day}일까지`
  ```
- `trainingBlock`:
  - 47행의 지역 함수를 `payrollRunwayKo`로 바꾼다. 55행 문장 틀(‘원화 급여 지급 가능일: 지금 … → 훈련하면 …’)은 그대로다.
  - `before = payrollRunwayDay(state, config)`, `after = payrollRunwayDay(state, config, fee)`.
  - `already = before !== null && before < state.day`.
  - `unpaid = training ? already : (after !== null && after < state.day)`. `training`은 진행 중·대기 중 훈련이다(36행).
  - `unpaid`면 52행 ‘급여는 훈련비와 별도로 평소대로 지급합니다.’를 넣지 않는다.
  - `unpaid`면 55행 줄 바로 뒤에 `<p class="reason">⚠ ${already ? '지금도' : '이 훈련비를 내면'} 오늘(${state.day}일) 급여 일부가 미지급으로 남습니다.</p>`를 넣는다.
  - 지금은 1일에 미지급이면 ‘0일까지’로 보이고, ‘평소대로 지급’ 문장이 늘 보인다.

**b) 개발 단계 부호 (UX-19)** — 아래 문장만 바꾼다.
- `main.ts` 253행: `${config.stage} 시제품 · 규칙 ${rulesVersion} · DESIGN 가상값` → `시제품 · 모든 숫자는 가상값 · 빌드 ${BUILD_ID}`. B25를 빼면 `· 빌드 …`도 뺀다.
- `main.ts` 329행: `· 모든 수치는 개발용 가상값(DESIGN)` → `· 모든 수치는 가상값`.
- `main.ts` 555·556행의 작은 글자: ‘… M3 사건 시스템에서 구현합니다’ → ‘대체 노선 선택은 이번 판에 없습니다’, ‘계약 변경 협상은 이번 판에 없습니다’.
- `main.ts` 608행: 앞의 ‘규칙 M2a: ’·‘규칙 M1: ’만 지운다. 뒤 문장은 그대로다.
- `main.ts` 732행: 가정 목록에서 `/^규칙 [^:]+: /`로 시작하는 줄(규칙 판본 줄, `src/content/scenario.ts` 429행이 만든다)을 화면에 넣지 않는다. 같은 규칙은 자원 예약 칸 608행에 있다. `scenario.ts`는 고치지 않는다.
- `crew-status.ts` 26행: `처리량은 고정값(${daily})만 씁니다. 능력·속성·레벨·시너지는 이 시나리오에서 쓰지 않습니다.`
- 남기는 것: ‘가상값’ 표시, ‘2장(세계 확장)’(게임 안의 장 이름), 카드의 ‘강화 +0’.

### 5. 면담의 고용 뒤 원화 (B54, recruitment.ts `interviewBlock`)

- `interviewBlock`의 `s`는 화면의 `view`(대기 명령 반영)다. 고용 미리 보기는 그 사본에 고용 명령 하나를 더해 계산한다.
  - `planState(s, config, [{ id, type: 'HIRE_CANDIDATE', candidateId: e.id }])`. `planState`는 `../engine/engine`에서 import한다.
  - `id`는 `PREVIEW-HIRE-AFTER-${e.id}`에서 시작해 `s.processedCommands`에 있으면 `-`를 붙인다(`trainingPreview`와 같은 방식, previews.ts 17·18행).
- 기존 dl(82~87행)은 그대로 둔다. `recruitment.test.ts` 332~335행이 dl 전체를 `toEqual`로 비교한다. 새 줄은 `</dl>` 바로 뒤에 둔다.
- 경우별 표시:
  - **고용 가능(`check.status === 'APPLIED'`)이고 대기 중이 아님:**
    - `<p class="hire-after">고용하면 원화 사용 가능액: 지금 ${won(지금)} → 고용 뒤 ${won(뒤)}</p>`. 값은 `fundsPosition(…, 'KRW').available`을 사본 전후에 부른 것이다.
    - `<p class="hire-after">원화 급여 지급 가능일: 지금 ${payrollRunwayKo(전, s.day, config.campaignDays)} → 고용하면 ${payrollRunwayKo(후, s.day, config.campaignDays)}</p>`. 전·후는 `payrollRunwayDay`를 `s`와 사본에 부른 값이다.
  - **고용이 대기 중(`queuedHire`가 있음):** `<p class="hire-after">원화 급여 지급 가능일: ${payrollRunwayKo(payrollRunwayDay(s, config), s.day, config.campaignDays)} (오늘 할 일의 고용 반영)</p>`.
  - 이 줄들에는 `class="reason"`을 쓰지 않는다(`recruitment.test.ts` 331행이 고용 가능 화면에 `class="reason"`이 없음을 단언한다).
  - **고용할 수 없음:** 새 줄을 넣지 않는다. 기존 거절 이유가 있다.
- **Claude 확인값:** `4de152a` 사본, M2 기본 설정의 `ready()` 상태(4일, 현돌 면담 가능). 고용 명령은 APPLIED였다. 원화 사용 가능액 9,520,000원 → 8,970,000원, 지급 가능일 62일 → 36일. 시험은 이 숫자를 직접 쓰지 않고 같은 함수로 계산해 비교한다.

### 6. 빌드 표시 (B25, vite.config.ts·main.ts)

- 이 저장소에는 `@types/node`가 없다. `vite.config.ts`에서 `node:child_process`를 정적으로 import하면 `tsc`가 실패한다. 아래처럼 동적 import를 쓴다.
- **Claude 확인:** 사본에서 아래 설정으로 `tsc --noEmit`, vitest(정의값 읽기), `vite build`(해시 치환, 추적 파일을 고치면 ‘+수정’)가 모두 동작했다.
  ```ts
  import { defineConfig } from 'vitest/config';

  type ExecSync = (command: string, options?: { encoding?: string; stdio?: unknown }) => string;

  /** 화면에 보일 빌드 표시. git이 없으면 'dev'. 추적 파일이 바뀌었으면 '+수정'. */
  async function buildId(): Promise<string> {
    try {
      const { execSync } = (await import('node:child_process' as string)) as { execSync: ExecSync };
      const run = (command: string) => execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const hash = run('git rev-parse --short=7 HEAD');
      const dirty = run('git status --porcelain --untracked-files=no') !== '';
      return /^[0-9a-f]{7,}$/.test(hash) ? `${hash}${dirty ? '+수정' : ''}` : 'dev';
    } catch {
      return 'dev';
    }
  }

  export default defineConfig(async () => ({
    base: './',
    define: { __BUILD_ID__: JSON.stringify(await buildId()) },
    test: {
      include: ['src/**/*.test.ts'],
    },
  }));
  ```
- `main.ts` 위쪽:
  ```ts
  declare const __BUILD_ID__: string | undefined;
  const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';
  ```
- 표시 위치는 위 4b의 머리 문구다. 고정 막대에는 넣지 않는다.
- 날짜·시각은 넣지 않는다. 같은 커밋이면 같은 빌드가 나와야 한다. 배포용 `version.txt`는 S5(TASK-0019)가 만든다.
- 청크 크기 경고(503kB)는 이번 범위가 아니다(W2-0e).

## 바꿔도 되는 기존 단언 (이 목록뿐)

- **Claude 확인:** `4de152a` 사본에 위 설계(0~6)를 시제품으로 넣고 기존 시험을 돌렸다. `tsc`와 `vite build`는 통과했고, 정확히 아래 13개 시험(10개 행)이 실패했다. 이 밖의 기존 시험이 실패하면 설계가 어긋난 것이다. 같은 시제품에서 ‘개발 단계 부호 0건’ 시험(아래 12번)도 통과했다.
- 고칠 때 단언을 약하게 만들지 않는다.
  - ‘`role="status"`가 있다’ → ‘그 순간 알림 영역(`announcements`)의 마지막 글이 그 문장을 담는다’.
  - ‘`role` 없음’ 단언은 그대로 두고, 그 동작으로 알림 영역에 새로 쓴 글에 성장 문장(‘경험치’)이 없다는 단언을 더한다.
    - 새 알림을 만들지 않는 동작(카드 선택·상세·필터·빼기·기록장·지도 범위) 뒤에는 `announcements.length`가 그대로인지도 본다.
    - 새 알림을 만드는 동작(넣기·수락·저장·불러오기·하루 진행 실패) 뒤에는 그 알림 글이 한 번 쓰이는 것이 맞다. 이때 `announcements.length` 불변을 단언하지 않는다.
  - 문장 문자열은 새 문장으로 바꾼다.

| 파일:행 | 지금 | 바꿀 것 |
|---|---|---|
| `crew-card.test.ts` 10~30 | 인라인 스냅숏의 article 줄 | `tabindex="0"` 뒤에 ` role="button" aria-pressed="false"`만 더한다. 나머지 HTML은 같아야 한다 |
| `main.test.ts` 196 | `<div class="flash-toast flash info" role="status">오늘 할 일에 넣었습니다.` | role 없는 같은 문자열 + 알림 영역 마지막 글에 같은 문장 |
| `main.test.ts` 365·375 | 성장 알림 블록에 `role="status"` | 알림 영역 마지막 글에 그날 성장 문장(‘+60 경험치’) |
| `main.test.ts` 382 | 같음 | 같음. 389행 ‘다시 읽지 않는다’ 뒤에는 ‘예외 뒤 알림 영역에 새로 쓴 글은 실패 알림(‘하루 진행에 실패했습니다’) 하나이고 ‘경험치’가 없다’를 더한다. 실패 알림은 새 알림이라 한 번 읽는 것이 맞다 |
| `main.test.ts` 532~535·554·557·559·564 | `status()` 정규식이 `role="status"` 블록을 찾는다 | `status()`를 `growthNotice(html)?.[2]`로 바꾼다. ‘role 있음’(533~535·554)은 알림 영역 마지막 글 확인으로 바꾼다. `status()` undefined는 이렇게 바꾼다: 저장(557)·불러오기(559) 뒤에는 저장·불러오기 알림이 새로 하나 쓰이고 그 글에 ‘경험치’가 없다. 다음 날(564) 뒤에는 알림 영역에 새 글이 없다(`announcements.length` 불변). 성장 블록 단언(558·560·565)은 그대로 |
| `main.test.ts` 588 | LEGACY_FIXED가 든 M1 각주 | `처리량은 고정값(하루 2pt)만 씁니다. 능력·속성·레벨·시너지는 이 시나리오에서 쓰지 않습니다. 일급 80,000원.` |
| `main.test.ts` 623 | role이 든 알림 전체 문자열 | role 없는 같은 문자열 + 알림 영역 마지막 글 |
| `main.test.ts` 892 | 문화 결과 알림에 `role="status"` | 알림 영역 마지막 글이 문화 결과 문장을 담고, 성장 문장(‘경험치’)은 담지 않는다. 893행은 그대로 |
| `main.test.ts` 901 | `not.toContain('role="status"')` | 그대로 둔다. 기록장 클릭 뒤 `announcements.length` 불변을 더한다 |
| `growth.test.ts` 102 | `growthStatus(…)`에 `role="status"` | `not.toContain('role=')`. ‘+60 경험치’ 1회 단언은 그대로 |
| `trade-reports.test.ts` 24 | LEGACY_FIXED가 든 M1 각주 | 위 588행과 같은 새 문장 |

결과 보고에 이 표를 ‘바꾼 기존 단언’으로 옮기고, 행마다 옛 단언과 새 단언을 붙인다.

## 테스트

새 시험은 기존 파일에 더한다. vitest 파일 수는 27개 그대로다.

### `main.test.ts` — 새 `describe('TASK-0018 키보드·입력 안전·알림·문구', …)`

1. **빼기 두 번:** 견적 두 개를 넣는다(`accept`, `accept-fwd`). 501ms 뒤 `clickNow({action:'unqueue',index:'0'},1)`를 두 번 하면 대기 명령이 하나만 빠진다. 500ms 뒤 한 번 더 누르면 또 빠진다.
2. **열고 닫기 두 번 (`it.each(['detail','interview','culture-book'])`):** 500ms 안에 두 번 누르면 `aria-expanded="true"`로 남는다. 500ms 뒤 누르면 닫힌다. 면담은 기존 `readySave()`로 면담 가능 상태를 만든다. 성장 상세는 첫 카드를 고른 뒤, 기록장은 문화 탭을 연 뒤 누른다.
3. **떠나기 전 확인 (`fireWindow('beforeunload', ev)`):**
   - 시작 직후: `preventDefault`를 부르지 않는다.
   - 대기 명령이 있으면 부르고, `ev.returnValue`가 `''`다. 빼면 다시 부르지 않는다.
   - 하루 진행 뒤(대기 없음): 부른다.
   - 저장 성공 뒤(`localStorage` 흉내): 부르지 않는다. 하루 진행 뒤 저장이 예외를 던지면(`setItem`이 throw) 그대로 부른다.
   - 불러오기·가져오기·처음부터 뒤: 부르지 않는다.
4. **CSS 규칙:** `overscroll-behavior-x: none`, `.visually-hidden` 규칙(`clip-path: inset(50%)`, `display: none` 없음), `.file-btn:has(> input:focus-visible)`, `.skip-links` 숨김·초점 규칙.
5. **화면 코드 순서:** M2 1일, ‘전 세계’ 지도로 바꾼 뒤, M1에서 각각 확인한다.
   - 순서: `class="skip-links"` < `<div class="masthead">` < `<div class="statusbar"` < `</header>` < `<main` < 거래(`<div class="maincol">` 또는 `<section class="panel trade"`) < `<aside class="panel crew"` < `<section class="panel resources"` < `<section class="panel queue"` < `<section class="panel world"` < `<section class="panel report"` < `<section class="panel log"`.
   - 알림이 있으면 `class="flash-toast` 위치가 `</header>` 뒤, `<main` 앞이다.
   - 격자 영역 CSS 문자열은 바뀌지 않았다(794행 시험이 그대로 통과).
6. **건너뛰기:** 두 단추가 `#app`의 첫 `data-action` 둘이다. 누르면 `scrollIds`·`focusIds`가 `['trade-h']`·`['queue-h']`이고 `focus`는 `{preventScroll:true}`다.
7. **Shift+Tab 튐 (`fireDoc`):**
   - 기본: `win.scrollY = 1200` → keydown Tab(`shiftKey: true`) → ‘하루 진행’ 단추에 focusin → `win.scrollY = 800`(브라우저 튐 흉내) → 16ms 진행 → `scrollTo(0, 1200)` 한 번.
   - 튀지 않으면(값 그대로) `scrollTo`를 부르지 않는다.
   - Tab 없이 focusin(포인터·코드 초점): 부르지 않는다.
   - Tab 뒤 고정 영역 밖 요소(첫 `accept` 단추)에 focusin: 부르지 않는다.
   - Tab 뒤 200ms 지나 focusin: 부르지 않는다.
   - 결과 보기 단추(`culture-result`)도 기본과 같이 되돌린다.
8. **가져오기:** `<input type="file" … data-action="import">`에 `hidden`·`tabindex="-1"`이 없고 `class="visually-hidden"`이 있다. 같은 `label.file-btn` 안에 ‘가져오기’ 글자가 있다. 기존 `importText` 시험은 그대로 통과한다.
9. **결과 보기 Tab 한 번:** 문화 활동을 넣고 하루 진행한 뒤, HTML에서 `data-action="end-day"` 다음에 처음 나오는 `data-action`이 `culture-result`다.
10. **알림 영역:**
    - `doc.body.insertAdjacentHTML`은 시작 뒤 한 번만 불린다. 여러 번 다시 그린 뒤에도 한 번이다.
    - `#app` HTML에 `role="status"`·`aria-live`가 0건이다(M2 1일, 수락 뒤, 하루 진행 뒤, 문화 결과 뒤).
    - 수락하면 알림 영역에 한 번 쓴다. 지도 범위·필터·카드 선택으로 다시 그리면 더 쓰지 않는다.
    - 같은 문장의 새 알림(두 번째 수락)은 다시 쓴다. 글은 앞 글과 다르고, 앞뒤 공백을 지우면 같다.
    - 성장 알림이 있는 하루 진행 뒤 한 번 쓴다. 하루 진행 예외 뒤에는 실패 알림만 한 번 쓰고 성장 문장은 다시 쓰지 않는다(기존 377~389행 흐름).
    - 저장·불러오기 뒤에는 그 알림만 쓰고, 화면에 남은 성장 블록의 글은 다시 쓰지 않는다.
11. **카드·운영표·막대:**
    - 카드를 고르면 그 카드 article만 `aria-pressed="true"`와 ‘✓ 선택됨’을 가진다. 다른 카드는 `aria-pressed="false"`다.
    - 운영표 `tr`에 `tabindex`·`aria-selected`가 없다. 행마다 `class="roster-pick"` 단추가 하나 있고, 고른 행만 `aria-pressed="true"`와 ‘✓ 선택됨’이 있다.
    - 고정 막대에 `role="region" aria-label="오늘 상태"`가 있다.
    - `ui.keydown(카드 article, 'Enter')`는 그 카드를 고른다. 단추(`HTMLButtonElement` 흉내) 대상 keydown은 상태를 바꾸지 않는다.
12. **개발 단계 부호 0건:** 아래 화면의 `#app` HTML 전체에 `M2a`, `M2b`, `LEGACY_FIXED`, `규칙 M1`, `규칙 M2`, `rules-1`, `M3 사건`, `DESIGN 가상값`, `개발용 가상값`이 없다.
    - M2 1일. M2에서 문화 탭을 열고 첫 카드와 성장 상세를 연 화면.
    - M1 1일.
    - `SCENARIO_M1_DELAY_ACCEPTED`에서 `accept` → `assign` → `book`(속성 일부로 첫 단추) 뒤, `data-action="keep"`이 나올 때까지 하루 진행(최대 10일). `keep`이 나왔는지도 단언한다.
    - ‘가상값’ 글자는 M2 1일 화면에 남아 있다.
    - 이 목록 밖의 부호(지도 이름표의 ‘1장 M3 단계’, 엔진 공지 근거의 ‘(DESIGN)’)는 손대지 않는 파일에서 온다. 단언하지 않고 ‘범위 밖 발견’에 적는다.
13. **빌드 표시:** 머리 문구가 `/시제품 · 모든 숫자는 가상값 · 빌드 (dev|[0-9a-f]{7}(\+수정)?)/`와 맞는다. 고정 막대 HTML에는 ‘빌드’가 없다.
    - 6절(B25)을 뺐으면 이 시험 대신 머리 문구가 `시제품 · 모든 숫자는 가상값`으로 끝나는지만 본다.
14. **M1 보존:** 기존 581행(588행 단언만 바뀜)·777행·1023행·1162행 시험이 그대로 통과한다.
    - 계획서가 든 보존 시험도 그대로 통과한다: 986~999행 P0-CITY-01(머리 HTML 비교·`createElement` 11회), 1138·1139행(결과 보기 뒤 알림 비움·탭 닫기). 557행은 아래 표대로 `status()` 도우미만 바뀐다.

### `growth.test.ts`

- `payrollRunwayKo`: null → `90일(캠페인 끝)까지`(설정의 `campaignDays`로 만든 문자열), 오늘보다 앞 → `없음`, 오늘 이후 → `N일까지`.
- 훈련 뒤에만 미지급: M2 설정을 복사하고 `startingCash.KRW = W + fee − 1`로 둔다.
  - `W`는 1일 근무 직원의 일급 합계(설정에서 계산), `fee`는 `config.growth.ordinaryTraining.feeMinor`다.
  - ‘→ 훈련하면 없음’과 ‘⚠ 이 훈련비를 내면 오늘(1일) 급여 일부가 미지급으로 남습니다.’가 있다.
  - ‘급여는 훈련비와 별도로 평소대로 지급합니다.’가 없다. `/(?<!\d)0일까지/`가 없다.
- 지금도 미지급: `startingCash.KRW = W − 1`. ‘지금 없음’과 ‘⚠ 지금도 오늘(1일) …’이 있고, ‘평소대로 지급’ 문장이 없다.
- 훈련을 넣은 상태(`planState`로 훈련 명령 반영)에서 지금도 미지급이면 ‘지금 없음’만 있고 ‘훈련하면’이 없다. 경고는 ‘지금도’다.
- 기존 시험(44~57행: ‘급여는 훈련비와 별도로’ 포함, ‘지금 3일까지 → 훈련하면 2일까지’)은 그대로 통과한다.

### `recruitment.test.ts`

- 고용 가능: `ready()` 상태에서 `interviewBlock`에 두 `hire-after` 줄이 있다.
  - 원화 사용 가능액의 앞뒤 값은 `fundsPosition(…, 'KRW').available`을 `ready()`와 `planState(ready(), config, [고용]).state`에 부른 값이다. 뒤 값은 앞 값 − 계약금(일급 × `signingFeeWageDays`)과 같다.
  - 지급 가능일 앞뒤는 `payrollRunwayDay`를 같은 두 상태에 부르고 `payrollRunwayKo`로 만든 글자다. 뒤 날짜가 앞 날짜보다 이르다.
  - 입력 상태가 바뀌지 않았다(`structuredClone` 비교).
- 고용 대기: `planState`로 고용을 넣은 상태와 `queuedHire` 문자열을 넘기면 ‘(오늘 할 일의 고용 반영)’ 줄 하나만 있다.
- 고용 불가(원화 부족, 기존 111~119행 방식): `hire-after`가 없다.
- 기존 332~335행 dl `toEqual`은 그대로 통과한다.

### `crew-card.test.ts`

- 고른 직원 카드: `role="button"`, `aria-pressed="true"`, ‘✓ 선택됨’. 고르지 않은 카드에는 ‘✓ 선택됨’이 없다.
- 후보 카드(`candidateCard`)도 같다.
- `crewRow`: `tr`에 `tabindex`·`aria-selected`가 없고, `roster-pick` 단추의 `aria-pressed`가 선택 여부를 따른다. 고른 행에만 ‘✓ 선택됨’이 있다.

### `session.test.ts`

- `nextAnnouncement` 표 시험:
  - 새 알림 → 그 글.
  - 같은 알림 객체 → null.
  - 성장만 → 성장 문장(날짜 포함).
  - 알림과 성장 → 둘을 이은 글.
  - 문화 결과 알림과 성장 → 문화 결과 글만.
  - `growthFresh` false → 성장 없음.
- `liveRegionText`: 다른 글은 그대로, 같은 글이면 `'\u00a0'`를 붙이고, 붙인 글 뒤 같은 글이면 붙이지 않는다.
- `hasUnsavedWork`: 대기 있음 → true, 대기 없고 같은 객체 → false, 다른 객체 → true, `savedState` null → true.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 한 열 배치(1000px 이하)의 Tab 순서가 보이는 순서와 다르다 | 한 열 격자는 그대로 둔다(TASK-0014가 정한 거래 → 오늘 할 일 순서). 건너뛰기 두 개로 거래·오늘 할 일에 바로 간다. 차이를 Tab 순서 표에 적는다. 배치 변경은 B53에서 사용자와 정한다 |
| 카드의 의미는 button인가 option인가 | `role="button"` + `aria-pressed`. 문화 화면의 직원 고르기와 같다. option은 listbox와 화살표 키 이동이 필요해 이번 범위가 아니다 |
| 운영표 행을 grid로 바꿀까 | 바꾸지 않는다. 이름 칸 안의 단추가 키보드 대상이다. `tr`의 `data-action`은 포인터용으로 남긴다 |
| 하루 진행 뒤 초점은 어디에 | 지금처럼 ‘하루 진행’ 단추. 결과 보기는 Tab 한 번 뒤에 있다 |
| 건너뛰기를 `<a href="#…">`로 할까 | 단추로 한다. 주소에 `#`이 붙지 않고, 수락 뒤 제목 이동과 같은 방식이다 |
| 알림 영역을 `index.html`에 둘까 | 두지 않는다(B26이 그 파일을 쓴다). 모듈을 읽을 때 `insertAdjacentHTML`로 한 번 만든다 |
| 같은 글을 다시 알리려면 | `liveRegionText`로 끝 공백(U+00A0)을 붙였다 뗀다. 타이머로 비웠다 쓰지 않는다 |
| 문화 결과와 성장 알림이 같은 날 | 문화 결과만 알린다(지금 규칙). 성장 블록 글자는 오늘 할 일 칸에 그대로 보인다 |
| 저장·불러오기·하루 진행 실패 알림도 알림 영역에 쓰나 | 쓴다. 새 알림 객체는 모두 한 번 읽는다. 화면에 남아 있는 성장 블록은 다시 읽지 않는다 |
| 면담에서 고용 뒤 지급 가능일이 ‘없음’이면 ⚠ 경고도 넣나 | 넣지 않는다. ‘없음’ 글자만 보인다. 경고 문단은 이번 범위가 아니다. 결과 보고 ‘질문’에 적어도 된다 |
| 떠나기 전 확인의 조건 | 대기 명령 또는 마지막 시작·불러오기·저장·내보내기 뒤의 진행. 내보내기도 저장으로 본다 |
| iOS Safari는 `beforeunload` 확인 창을 띄우지 않는다 | 알고 있다. 실기기 확인은 사용자 몫이다. 자동 저장·`pagehide` 저장은 만들지 않는다 |
| 가져오기를 단추+숨은 입력으로 바꿀까 | 바꾸지 않는다. label 구조를 두고 입력만 화면에서 숨긴다(초점은 받는다) |
| Shift+Tab 튐을 CSS로 막을 수 없나 | CSS 두 가지는 이미 실패했다(DECISIONS 850행). JS 복원으로 한다 |
| Tab 기록을 app keydown에 둘까 | `document`의 capture keydown에 둔다. 초점이 `#app` 밖(문서 처음)에서 시작해도 잡는다 |
| `window.requestAnimationFrame`인가 전역인가 | `window.requestAnimationFrame`. 시험 틀이 `window` 흉내에 둔다 |
| 운영표 단추가 터치에서 44px로 커져 표가 길어진다 | 받아들인다. 결과 보고에 적는다. Claude가 잰다 |
| 지급 가능일 함수를 `culture.ts`와 하나로 묶을까 | 묶지 않는다. `culture.ts`는 손대지 않는다. `growth.ts`에 같은 글자의 함수를 두고 보고에 중복을 적는다 |
| `growthStatus`의 `announce` 인수 | 지운다. 화면 요소에는 role을 달지 않는다 |
| `cultureResultFresh`가 쓸모없어진다 | 필드는 남긴다(`culture.test.ts` 38~39행) |
| 가정 목록의 다른 줄에 내부 ID(‘EMP01의 하루 처리량’)가 보인다 | 자료(`data/scenarios.json`) 문장이라 고치지 않는다. ‘범위 밖 발견’에 적는다 |
| 지도 이름표의 ‘1장 M3 단계에서 열림’, 엔진 공지 근거의 ‘(DESIGN)…M1에서는’ | `map.ts`·`engine.ts` 문장이라 고치지 않는다. ‘범위 밖 발견’에 적는다 |
| 견적에도 ‘수락 뒤 사용 가능 자금’을 넣을까 | 넣지 않는다(이번 범위 밖) |
| 면담의 ‘지금’ 값이 오늘 할 일을 반영한다 | 그대로다. 기존 dl의 ‘지금 원화 사용 가능액’과 같은 기준(`view`)이다 |
| git이 없어 빌드 해시를 못 읽는다 | `dev`를 보인다. 실패로 보지 않는다 |
| 시간이 모자란다 | 6번(B25)을 빼고 보고한다. 1~5는 모두 한다 |
| 목록 밖 기존 시험이 실패한다 | 기대값을 고치지 않는다. 원인을 찾고, 못 찾으면 보고한다 |
| 새 시험 수 | 정하지 않는다. 위 목록을 모두 덮으면 된다 |

## 완료 조건

1. 구현 지시 0~6이 반영되었다. 6을 뺐으면 이유를 적고, 테스트 13번은 그 절의 대체 확인으로 한다.
2. **검증**
   - 시작 전에 `npx vitest run`을 한 번 돌려 기준 개수를 적는다. Claude 확인값은 `4de152a`에서 27개 파일·803개 통과다.
   - 끝내기 전에 결과 보고 파일을 먼저 만든 뒤 `bash tools/ai/review_checks.sh 4a90d77`를 실행한다. 8종이 모두 통과해야 한다.
     - vitest 파일 수는 27개 그대로다. 시험 개수는 803개보다 늘어난다.
     - 자료 검사는 PASS다. Claude 확인값은 개발 브랜치 `4a90d77`에서 24,721건이다. MANIFEST에 새로 든 파일 하나마다 2건(파일 있음·해시)이 늘어난다. 결과 보고 파일 하나만 새로 생기면 24,675건이다. 이와 다르면 MANIFEST에 든 새 파일 목록을 보고에 적는다.
     - 파이썬 시험은 21개·21개(3개 건너뜀)·20개 그대로다(`4a90d77` 기준, Claude 확인).
     - 시작 전 기준이 위 Claude 확인값과 다르면 시작 전 값을 기준으로 삼고 차이를 보고한다.
3. **바꾼 범위 확인**
   - `git diff --name-only 4a90d77`와 `git status --short`의 새 파일이 ‘고칠 수 있는 파일’ 안에 있다(`MANIFEST.json` 포함).
   - 기존 시험 파일에서 지운 줄은 ‘바꿔도 되는 기존 단언’ 표의 행과 `map-integration.test.ts`의 `document` 흉내 한 줄뿐이다. 다음 출력을 결과 보고에 붙인다.
     ```
     git diff 4a90d77 -- src/ui/*.test.ts | grep '^-[^-]'
     ```
   - `git diff 4a90d77 -- src/ui/map-integration.test.ts`가 `start()` 안의 전역 흉내 두 줄뿐이다.
   - 새로 더한 시험 줄에 금지 문자열이 없다. 결과가 0건이어야 한다.
     ```
     git diff 4a90d77 -- src/ui/*.test.ts | grep '^+' | grep -nE "PYEONGTAEK|BUSAN|SHANGHAI|HAIPHONG|YOKOHAMA|SINGAPORE|JAKARTA|HONG_KONG|OFFER_|EVI_|ROUTE[0-9]|평택|부산|상하이|하이퐁|요코하마|싱가포르|자카르타|홍콩"
     ```
   - `#app` 화면 코드에 `role="status"`가 없다: `grep -n 'role="status"' src/ui/*.ts | grep -v test`의 결과가 알림 영역 한 줄(main.ts)뿐이다.
4. **변형 시험.** 아래를 하나씩 넣고 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다.

   | 변형 | 실패해야 하는 시험 |
   |---|---|
   | ‘빼기’ 뒤 500ms 막기를 지움 | 빼기 두 번 |
   | 성장 상세 뒤 500ms 막기를 지움 | 열고 닫기 두 번(detail) |
   | `hasUnsavedWork`가 늘 true | 떠나기 전 확인(시작 직후·저장 뒤) |
   | 저장 성공 때 `savedState`를 맞추지 않음 | 떠나기 전 확인(저장 뒤) |
   | 지도 패널을 다시 `<main>` 맨 앞으로 | 화면 코드 순서 |
   | 알림을 `</main>` 뒤로 되돌림 | 화면 코드 순서, 결과 보기 Tab 한 번 |
   | 가져오기 입력에 `hidden`을 되살림 | 가져오기 |
   | focusin에서 Tab 시간 조건을 지움 | Shift+Tab(Tab 없이 focusin) |
   | focusin에서 되돌리기를 지움 | Shift+Tab(기본) |
   | `render()`에서 결과가 없어도 그릴 때마다 알림 영역에 씀 | 알림 영역(다시 그리기) |
   | `nextAnnouncement`가 같은 알림 객체에도 글을 돌려줌 | `nextAnnouncement` 표(같은 알림 객체), 알림 영역(다시 그리기) |
   | 아래쪽 알림에 `role="status"`를 되살림 | 알림 영역(`#app` role 0건) |
   | 카드 `aria-pressed`를 늘 false | 카드·운영표 |
   | 훈련 지급 가능일을 옛 함수(`${day}일까지`)로 | 훈련 뒤에만 미지급, 지금도 미지급 |
   | 면담 ‘고용하면’ 값을 사본 대신 `s`로 계산 | 면담 고용 가능 |
   | 가정 목록의 규칙 줄 거르기를 지움 | 개발 단계 부호 0건 |

   - git으로 파일을 되돌리거나 stash하지 않는다.
5. **Claude가 잴 것 (Codex는 하지 않는다).** Chromium 7개 프로필(1366×657 마우스·터치, 1180×820, 1024×768, 1133×744, 1920×969, 1000×700 한 열), 실제 배율(WORKFLOW 119~121행):
   - Tab 순서가 보이는 순서와 같다(세 열 6개 프로필). 1000×700 한 열은 결과 보고 표의 차이와 같은지만 본다.
   - Shift+Tab으로 ‘하루 진행’에 갈 때 화면 이동이 −261~−503px에서 0±8px이 된다.
   - 하루 진행 뒤 ‘결과 보기’까지 Tab 1번.
   - 읽던 자리 값(−36~−883px, −414~−421px)이 나빠지지 않는다. 수락·배정·예약 기준(TASK-0014)이 그대로다.
   - 운영표 단추로 행 높이가 얼마나 바뀌는지, 가로 넘침 0, 글자 12px 이상, 터치 대상 44px.
6. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0018.md`에 머리말 형식으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유.
- **실행한 검증과 결과:** 시작 HEAD 해시(`git rev-parse --short HEAD`). 명령별 통과·실패와 시험 개수. 시작 전 기준 개수(vitest 파일·시험, 자료 검사 건수, 파이썬 시험 셋)도 적는다.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **바꾼 기존 단언:** 위 표의 행마다 옛 단언 → 새 단언. 3번의 `grep '^-[^-]'` 출력.
- **변형 시험 표**
- **Tab 순서 표 (정적):** M2 1일 HTML에서 셈한 Tab 정지점 순서(영역 단위)와, 1000px 이하 한 열에서 보이는 순서와 다른 곳.
- **화면 문구 변경 목록:** 4절에서 바꾼 문장마다 옛 문장 → 새 문장.
- **범위 밖 발견:** 고치지 않은 문제. 적어도 다음을 확인해 적는다.
  - `src/ui/map.ts` 125행 부근 지도 이름표 ‘1장 M3 단계에서 열림’.
  - `src/engine/engine.ts` 145행 부근 공지 근거 ‘(DESIGN)… M1에서는 …’.
  - `data/scenarios.json` 가정 문장의 내부 ID ‘EMP01의 하루 처리량’(M1 가정 목록에 보인다).
  - 지급 가능일 글자 함수가 `growth.ts`와 `culture.ts`에 따로 있다.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 측정은 하지 않는다. 했다면 실제 배율 방식(WORKFLOW 119~121행)인지 적는다.
