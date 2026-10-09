# TASK-0012 M2a-4 문화 활동 화면: 부산 현지 패널·미리 보기·결과 카드·기록장 (C+A 혼합안)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `xhigh`
- 선행 작업: 개발 브랜치(TASK-0011 문화 엔진 `b45e7e2`, TASK-0014 터치 대응, 3판 가로 기기 배치 `a8ffa35` 반영).
- 결정 근거:
  - `docs/DECISIONS.md` ‘M2a-4 도시 방문·문화 활동’(사용자 결정 4개와 화면 기본값)과 ‘TASK-0012 문화 활동 화면 — C+A 혼합안’(사용자 결정 2개, Claude 기본값).
  - `docs/ai/design/TASK-0012-scene-brief.md`(핵심 60초, 학습 증거 4문장, 기준 C1~C8, 의무 항목, 변경 기록).
  - `docs/ai/design/TASK-0012-scene-compare.md`(시안 채점과 사용자 선택). 시안 파일은 `docs/ai/design/TASK-0012-mockups/`에 있다. **시안은 모양과 흐름을 참고하는 데만 쓴다.** 시안 안의 숫자·가짜 상태·엔진 흉내 코드는 옮겨 쓰지 않는다.
  - Claude 사전 조사 4갈래와 지시서 비판 검토(5관점 + 반박 검증). 필요한 사실은 이 지시서에 옮겨 적었다.

## 목표

M2 시나리오에서 플레이어가 다음 순서로 한 바퀴를 돌 수 있게 한다.
1. ‘부산 현지’를 연다.
2. 활동과 직원을 골라 미리 보기를 읽는다.
3. 오늘 할 일에 넣는다.
4. 하루를 진행한다.
5. 결과 카드와 기록장을 읽는다.

한 바퀴가 끝나면 학습자가 다음 네 문장을 말할 수 있어야 한다(기준서 2절).
1. **관찰 ≠ 일반화:** “윤서 한 사람이 작은 묶음을 원한다고 했을 뿐이다.”
2. **아직 모르는 것:** “더 알려면 묶음 크기·수량, 그런 규격을 공급하는 곳을 확인해야 한다.”
3. **기회비용:** “이 활동은 그 직원의 하루 업무와 원화 20,000원을 쓴다.”
4. **바뀌지 않는 것:** “가격·하루 처리량·거래 신뢰는 바뀌지 않는다.”

**바꾸지 않는 것:**
- 엔진 동작, 경제 규칙, 저장 형식. 엔진 파일 변경은 S-12의 상수 하나뿐이다.
- 3판 배치에서 고정한 것:
  - `src/ui/style.css`의 `grid-template-areas` 세 벌(기본, `.layout.map-wide`, 1000px 이하)과 그 시험 문자열.
  - 공용 `h2`·`h2 small` 규칙(style.css 38~40행), `#trade-h`의 여백, `.trade { grid-area: trade }`.
  - 허용하는 CSS 격자 변경은 S-1의 `grid-template-rows` 한 줄뿐이다.
- TASK-0014 규칙: 누른 자리 예정 표시(F1), 초점이 화면 밖으로 가지 않기, 하루 진행 뒤 읽던 자리 유지(F3), 500ms 두 번 누름 막기, 알림이 포인터를 가로채지 않기(이번에 더하는 ‘결과 보기’ 단추만 예외).
- `src/ui/focus.ts`의 `FOCUS_FALLBACK_SELECTORS`와 `focusFallbackIds`(기존 시험이 정확한 값으로 고정했다). 문화 화면의 초점은 main.ts에서 직접 준다.
- M1 화면 동작과 HTML. M1에서는 HTML 문자열이 지금과 글자까지 같아야 한다.
- 이미 있는 문화 분기 문구:
  - `crewStatusKo`의 ‘◇ 현지 활동 중’, `taskName`, `taskSchedule`. TASK-0011 시험(`m2a-culture.test.ts`)이 쓴다.
  - `commandLabel`의 문화 줄. 시험은 쓰지 않지만 문구를 유지한다.
- 사용성 시험 빌드(3판, 배포본). 이 작업은 개발 브랜치에만 들어간다.

## 먼저 읽을 파일

- **엔진 읽기 함수**
  - `src/engine/previews.ts`
    - 53~91행 `culturePreview(state, config, activityId, employeeId)`. 반환 필드는 `allowed`, `reasonKo`, `cost`, `durationDays`, `busyFromDay`, `busyUntilDay`, `availableBeforeMinor`, `availableAfterMinor`, `payrollRunwayBefore`, `payrollRunwayAfter`, `waitingTasks`, `otherFreeLocalEmployeeIds`, `newRecords`, `unchangedKo`.
    - 34~51행 `payrollRunwayDay`. 오늘 급여도 다 못 내면 `state.day − 1`을 돌려준다.
  - `src/engine/culture.ts` 61~76행 `cultureBook(state, config)`.
    - `reports[]`: `reportKo.findingKo/scopeKo/notClaimedKo/openQuestionKo`, `sourceContactIds`, `status: 'UNVERIFIED'`, `reporterEmployeeId`, `taskId`, `day`, `activityId`.
    - `employees[].experiences[]`: 날짜는 `verifiedDay`.
    - `relations[].events[]`: `day`, `activityId`, `taskId`. 같은 쌍에 사건이 여러 개일 수 있다.
  - `src/engine/types.ts`: 285~300행 `Task`(`assignedEmployeeId`, `startedDay`, `completedDay`, `subjectId`), 318~388행 문화 타입, 495행 `START_CULTURE_ACTIVITY`.
  - `src/engine/engine.ts`: 472~558행 거절 문장, 796~838행 `commitDay`, 840~851행 `progressTasks`. 1일 활동은 그날 마감 안에서 끝나고, `completedDay`는 마감한 날이다. 마감 뒤 `state.day`는 하루 늘어난다.
  - `src/engine/tasks.ts` `taskSubjectKo`, `src/ui/card.ts` 76행 `taskName`, `src/engine/catalog.ts` 79행 `cityName`.
- **화면**
  - `src/ui/main.ts`:
    - `queuedStatus`(52~55), `focusWithoutScroll`(66~79), `tryCommand`·`queue`(122~151), `endDay`(153~179).
    - `tradePanel`(534~546), `queuePanel`(685~695, 690행 알림 사본).
    - `render`(707~777): 720~731행 HTML 조립과 알림, 768~776행 초점 복원의 slot 대응.
    - 클릭 처리(787~875): `select-card` 뒤 `showGrowthControl`(779~783)이 선례다. ‘내보내기’(864~872)는 다시 그리지 않고 알림도 바꾸지 않는다.
  - `src/ui/growth.ts`: 훈련 블록 문구, 47행 `runway()`, 103~105행 성장 알림의 `role="status"`.
  - `src/ui/recruitment.ts`: 3행 자료 import, 16행 `venueTitle`, 주입받는 `status` 함수, M1에서 `''`를 돌려주는 방식.
  - `src/ui/session.ts` 8~16행 `initialUiState`, `src/ui/reports.ts`.
  - `src/ui/style.css`: 38~40행 공용 h2, 86~114행 격자, 438~461행 터치 44px와 알림(`pointer-events: none`).
  - `src/ui/main-testkit.ts`(가짜 DOM, 아래 ‘하네스 주의’), `src/ui/main.test.ts`, `src/ui/growth.test.ts`, `src/ui/recruitment.test.ts`, `src/ui/trade-reports.test.ts`.
- **자료:** `data/venues.json`(장소 5곳), `data/culture_activities.json`, `data/contacts.json`, `tests/acceptance_cases.json` 139~210행(P0-CITY-01).

## 화면 명세

### S-0 공통 규칙

1. **새 파일 `src/ui/culture.ts`** 한 곳에 화면 문구 상수(`CULTURE_KO` 객체)와 HTML 함수를 둔다.
   - 머리 주석은 기존 모듈처럼 쓴다: ‘판정·수치·문장은 엔진 읽기 함수와 자료에서 받고, 화면은 문구와 HTML만 만든다’.
   - 하루 진행 알림 문장도 culture.ts의 순수 함수(예 `cultureToastText`)가 만든다.
2. **상위 함수:** 패널 HTML은 culture.ts의 상위 함수 하나(예 `culturePanel(state, view, pending, config, ui, status)`)가 만든다.
   - 확정 `state`와 대기 목록 `pending`을 받아, 미리 보기를 `view`로 부를지 ‘그 쌍만 뺀 계획 상태’로 부를지를 이 함수 안에서 정한다(S-5).
   - culture.test는 이 상위 함수를 부른다.
3. **표시 조건:** `config.culture !== null`일 때만 그린다. M1에서는 다음이 하나도 없다: 탭, 패널, 감싸는 칸, 원화 행, 알림 단추.
4. **엔진 문장은 그대로 보인다.** `reasonKo`, 4줄 기록, `unchangedKo`, 자료의 이름·제목·정보 범위 문장을 화면에서 고치거나 다시 만들지 않는다. 엔진의 괄호형 조사(‘은(는)’)도 그대로 둔다.
5. **조사 규칙**
   - 화면이 만드는 문장에서는 이름·제목 변수 바로 뒤에 은/는/이/가/을/를/와/과/으로/로를 붙이지 않는다.
   - 대신 ‘이름: …’, ‘·’ 나열, ‘— 이름’ 형식을 쓴다. 바뀌지 않는 ‘의’·‘에’는 써도 된다(‘귀솔의 직접 경험 기록’).
   - 도시 이름은 `cityName(config, config.homeCityId)`로 넣는다(‘부산 현지’, ‘부산 기록장’, ‘부산 현지 닫기’).
6. **화면 상태(`ui`)**
   - `initialUiState`에 더해서, 처음부터·불러오기·가져오기·시나리오 변경 때 저절로 지워지게 한다. 새 엔진 상태를 만들지 않는다.
   - 다음 필드를 둔다(이름은 바꿔도 된다):
     - `cultureOpen`, `cultureActivityId`, `cultureEmployeeId`, `cultureBookOpen`.
     - `cultureSeenDay`, `cultureShowFromDay`(S-7).
     - `cultureTabTop`(S-1).
     - `cultureResultFresh`(S-7), 그리고 `flash`의 선택 필드 `action`.
   - 다시 그릴 때 닫히는 `<details>`는 상호작용 영역에 쓰지 않는다. 펼침은 `aria-expanded` 버튼으로 한다.
7. **확정 상태와 계획 상태:** 미리 보기·예정 표시·직원 목록은 계획 상태(`view`)로 그리고, 결과 카드·기록장은 확정 `state`로 그린다.
8. **움직임 없음:** 애니메이션·전환 효과·지연 채우기를 넣지 않는다.
9. **색만으로 구분하지 않는다:** 경고·상태·표시는 글자를 함께 쓴다(‘⚠’, ‘현지 활동 예정’, ‘넓혀 읽지 않기’, ‘바뀌지 않는 것’).
10. **내부 ID:** `CA01`, `EMP01`, `VEN_`, `NPC_`, 업무 ID는 보이는 글자와 `aria-label` 값에 나오지 않는다.
    - `id`·`aria-labelledby`·`aria-controls`·`data-*` 값에는 들어가도 된다.
    - 계약 번호(`CT002`)는 지금처럼 보여도 된다.
11. **글자·터치:** 새 CSS는 `.75rem`(12px) 이상만 쓴다. 누를 수 있는 것은 진짜 `<button>`이고, `any-pointer: coarse`에서 44px 이상이다.
12. **수집 유도 금지(C5):** 다음을 만들지 않는다.
    - ‘빈 쪽’, ‘채움’, ‘채우려면’, ‘n쪽’.
    - 남은 활동 수, 완료 체크(‘✓ 다녀옴’), ‘다녀온 직원’ 표시.
    - 진행 막대, 점수, 해제 후보 단추.
13. **500ms 막기:** 다음 단추 뒤에도 `ignoreClicksUntil`을 건다: 탭, 패널의 ‘닫기’, 활동 고르기, 직원 고르기, ‘결과 보기’. 화면 높이가 크게 바뀌거나 새 단추가 손가락 밑에 나타나기 때문이다.

### S-1 진입 탭과 패널 자리 (측정으로 정한 배치)

Claude는 3판 실제 배치에서 6개 후보를 7개 기기 프로필로 쟀다. 그 가운데 이 자리만 세 조건을 모두 만족했다.
- 닫힌 상태에서 아무것도 밀지 않는다(모든 제목 Δ0px).
- 진입점이 첫 화면에 있다.
- 결과 네 줄이 한 화면에 들어온다.

오른쪽 300px 칸에서 펼치면 결과 네 줄이 475px가 되어 실패한다.

1. **탭**
   - `tradePanel()`의 `<h2 id="trade-h">` **바로 다음 형제**로 둔다. h2 안에 넣지 않는다(거래 칸의 접근 이름이 바뀌지 않게).
   - 마크업: `<button id="local-tab" class="local-tab" data-action="culture-tab" aria-expanded="…">`.
   - `aria-controls="local-body"`는 패널이 열려 있을 때만 단다.
   - CSS: `.trade { position: relative }`, `.local-tab { position: absolute; top: .55rem; right: .9rem; line-height: 1.2; padding: .25rem .7rem; min-height: 44px }`. 둘째 줄은 `.75rem`.
   - 글자는 두 줄이다. 첫 줄은 ‘부산 현지’다. 둘째 줄은 다음 우선순위로 하나만 쓴다.
     1. 패널이 열려 있으면 ‘닫기’.
     2. 닫혀 있고 아직 안 본 결과(S-7)가 있으면 ‘새 기록 있음’(숫자 없음).
     3. 그 밖에는 ‘장소 5곳’.
   - 접근 이름은 보이는 글자를 포함한다.
   - **겹침의 정의:**
     - 탭 상자와 거래 제목·견적판 제목·첫 견적 글자 줄(Range client rects)의 겹침은 0이다.
     - 탭 아래 끝과 견적판 제목·첫 계약 제목·지연 알림 상자 위 끝 사이는 4px 이상이다.
     - h2는 칸 폭 전체를 차지하는 flex 상자다. 그래서 상자끼리의 겹침은 따지지 않는다. 이를 없애려고 공용 h2 규칙을 바꾸지 않는다.
2. **패널 자리**
   - `config.culture`가 있을 때만 `${tradePanel()}` 자리를 `<div class="maincol">패널 + 거래</div>`로 감싼다.
     - CSS: `.maincol { grid-area: trade; display: flex; flex-direction: column; gap: 1rem; min-width: 0 }`.
     - `.trade { grid-area: trade }`는 그대로 둔다. 감싸는 칸 안에서는 효과가 없고, M1은 이 규칙으로 배치된다.
   - 닫혀 있으면 감싸는 칸 안에는 거래만 있다. 3판과 위치가 0px 같아야 한다.
   - 열려 있으면 패널 `<section class="panel local" id="local" aria-labelledby="local-h">`이 감싸는 칸의 맨 위, 거래 위에 생긴다. 1000px 이하 한 열에서도 같다.
   - 오른쪽 300px 칸(동료·자원 예약·오늘 할 일)에는 문화 패널 내용을 넣지 않는다.
   - **격자 줄 높이(허용된 유일한 격자 변경)**
     - 추가할 규칙: `.layout { grid-template-rows: auto auto 1fr; }`, 그리고 1000px 이하 미디어 안에 `.layout, .layout.map-wide { grid-template-rows: none; }`.
     - 이유: 지금은 줄 높이가 암묵적 `auto`다. 패널을 열어 주 열이 오른쪽 칸보다 길어지면 남는 높이가 세 줄에 나뉜다. 그래서 ‘자원 예약’이 최대 320px, ‘오늘 할 일’이 최대 639px 밀리고 칸 사이에 틈이 생긴다(측정).
     - 이 규칙을 넣으면 열린 상태의 밀림이 0이고, 1일·2일 닫힌 상태와 전 세계 지도 배치도 3판과 같다(측정).
3. **열기(탭)**
   - 순서:
     1. 탭의 화면 위치(`getBoundingClientRect().top`)를 `ui.cultureTabTop`에 기억한다.
     2. S-7의 ‘본 결과’ 규칙대로 `cultureShowFromDay`와 `cultureSeenDay`를 갱신한다.
     3. `ui.cultureOpen = true` → `render(true)`.
     4. `#local-h`(`tabindex="-1"`)를 `scrollIntoView({ block: 'start' })`로 고정 막대 바로 아래에 오게 한다(`scroll-padding-top` 이용).
     5. 초점을 둔다(`focus({ preventScroll: true })`).
   - 상태(게임)는 바뀌지 않는다(P0-CITY-01).
4. **닫기**
   - 닫는 곳은 세 곳이다:
     - 탭.
     - 패널 머리의 ‘닫기’(`data-action="culture-close" data-where="head"`).
     - 패널 맨 끝의 ‘부산 현지 닫기’(`data-action="culture-close" data-where="end"`).
   - 순서:
     1. `ui.cultureOpen = false` → `render(true)`.
     2. `ui.cultureTabTop`이 있으면, 탭이 그 화면 위치에 오도록 `window.scrollBy`한다. 없으면 탭이 고정 막대 아래·알림 위에 온전히 보이게 최소 거리만 `window.scrollBy`한다.
     3. 초점을 `document.getElementById('local-tab')`에 둔다(`preventScroll`).
     4. `ui.cultureTabTop = null`.
5. **패널은 플레이어가 닫을 때까지 열린 채로 있다.** 하루 진행 때 저절로 닫거나 열지 않는다(읽던 자리 유지).
   - 알려진 대가 1: 열린 채 며칠 진행하면 거래가 패널 높이만큼 밀린다.
   - 알려진 대가 2: 탭과 열린 패널의 단추가 견적보다 앞이라, 키보드로 견적까지 가는 길이 길어진다(P14-03과 같은 종류).
   - 두 가지 모두 사용성 시험에서 관찰한다.

### S-2 패널 몸통의 순서, 머리, 장소 5곳

패널 안 순서(`id="local-body"`):
1. (있을 때만) 아직 안 본 결과 카드(S-8). 최신 날부터 그린다.
2. 머리 문장: ‘열어 보기만 하면 시간·돈이 들지 않습니다. 날짜는 위쪽 ‘하루 진행 ▶’으로만 넘어갑니다.’
3. 장소 5곳 목록.
4. 문화 활동 절(S-3~S-6).
5. 부산 기록장(S-9).
6. 맨 끝 ‘부산 현지 닫기’ 단추.

패널 머리는 `<h2 id="local-h" tabindex="-1">부산 현지</h2>`와 ‘닫기’ 단추다.

**장소 5곳 목록:**
- 단추가 없는 정적 목록(`<dl>`)이다.
- 순서와 제목은 `data/venues.json` 그대로이고, 제목은 자료에서 읽는다(`venueTitle` 선례).
- 자료의 `revisit_reason_ko`는 아직 없는 기능을 말하므로 쓰지 않는다.
- 한 줄 안내는 아래 화면 상수다. ‘영입 조사 장소’는 그 장소가 `config.recruitment?.scoutSites`에 있다는 뜻이다.

| 장소 | 영입 조사 장소일 때 | 아닐 때 |
|---|---|---|
| 무역회관 | ‘견적·계약은 ‘거래·계약’ 칸, 동료 현장 조사는 ‘동료’ 칸에서 합니다.’ | ‘견적·계약은 ‘거래·계약’ 칸의 견적판에서 합니다.’ |
| 항만 물류단지 | ‘운송편 예약은 각 계약 카드, 동료 현장 조사는 ‘동료’ 칸에서 합니다.’ | ‘운송편 예약은 각 계약 카드에서 합니다.’ |
| 비즈니스 라운지 | ‘동료 현장 조사는 ‘동료’ 칸에서 합니다.’ | ‘이번 판에서는 여기서 할 일이 없습니다.’ |
| 문화생활·현지 탐방 | ‘직원 1명을 보내 만난 사람의 말과 그 말이 닿는 범위를 네 칸으로 기록합니다. 아래에서 고릅니다.’ | 같음 |
| 금융센터 | ‘주식 거래와 상장(회사 주식을 시장에 내놓기)은 이번 판에 없습니다. 현금은 위쪽 막대와 ‘경영 보고’에서 봅니다.’ | 같음 |

### S-3 문화 활동 절: 4칸 틀과 활동 고르기

- 절 제목은 `<h3 id="culture-h" tabindex="-1">`로, 글자는 ‘문화생활·현지 탐방’(자료 제목)이다.
- **4칸 틀(선행 조직자):** 절 맨 위, 활동 고르기 전에 둔다. ‘현지 활동 기록은 네 칸으로 남습니다.’ 아래에 순서 목록 네 줄을 둔다. 빈 칸 표시는 붙이지 않는다.
  1. ‘알게 된 점 — 누가 무엇을 말했나’
  2. ‘범위 — 몇 명·어디·언제 확인했나’
  3. ‘이 기록이 말하지 않는 것 — 넓혀 읽으면 안 되는 것’
  4. ‘아직 모르는 것 — 다음에 확인할 것’
- **‘① 활동 고르기’:** 활동 3종을 `role="group" aria-label="현지 활동 고르기"` 안의 단추로 둔다(`data-action="culture-act" data-activity`, `aria-pressed`). 단추 안 글자:
  - 활동 제목(자료).
  - ‘{비용} · 기간 {기간}일 · 만나는 사람: {인물 전체 이름 ‘·’ 나열}’. 예: ‘20,000원 · 기간 1일 · 만나는 사람: 시장 상인 윤서’.
  - ‘기록 주제: {topic.titleKo}’.
  - (그 활동이 대기 목록에 있을 때만) ‘오늘 할 일에 넣음 — {직원}’.
- **고르기 동작**
  - 같은 활동을 다시 눌러도 선택이 유지된다(토글이 아니다).
  - 다른 활동을 누르면 고른 직원을 지운다. 그러면 미리 보기도 사라진다.
  - 고르기는 게임 상태를 바꾸지 않는다.

### S-4 직원 고르기와 미리 보기 드러내기

- 활동을 고른 뒤에만 보인다. 머리 줄은 `<h4 id="culture-emp-h" tabindex="-1">② 갈 직원 고르기</h4>`와 작은 글 ‘{도시}에 있고 오늘 쉬는 직원만 고를 수 있습니다’다.
- **직원 목록:** 고용 중이고, `view`에서 그 활동 도시에 있는 직원.
  - 단추 마크업: `id="culture-emp-{직원 ID}"`, `data-action="culture-emp" data-activity data-emp`, `aria-pressed`. 글자는 이름과 기존 상태 글(`crewStatusKo`)이다.
  - **누를 수 있음:** `isAvailableFromToday(view, id) && !runningTaskOf(view, id)`. 예외로, 그 직원의 진행 업무가 **이 활동의 대기 명령**이면 누를 수 있다(넣은 뒤 다시 보기).
  - **누를 수 없음(`disabled`):** 바쁜 직원은 `${crewStatusKo(…)} — ${taskSchedule(…)}`, 근무 시작 전 직원은 ‘{N}일부터 근무’.
  - 이미 그 활동을 한 직원도 쉬고 있으면 누를 수 있다. 미리 보기가 엔진 거절 문장(‘…이미 이 활동에 참여했습니다. 다시 해도 새로 생기는 기록이 없습니다.’)을 보여 준다. 화면이 자격을 따로 판정하지 않는다.
  - 같은 직원을 다시 눌러도 선택이 유지된다.
- **DOM 순서:** 직원 목록 → 미리 보기(안에 Tab 대상 없음) → 넣기 칸.
- **고르는 순간 미리 보기 드러내기(시안 B)**
  - 순서는 `select-card`의 `showGrowthControl`과 같다:
    1. `render(true)`.
    2. 최소 스크롤 한 번(`window.scrollBy`).
    3. `document.getElementById('culture-emp-{직원 ID}')`에 `focus({ preventScroll: true })`.
  - 이 경로에서는 `focusWithoutScroll`을 거치지 않는다. 알림 아래에서 누른 단추의 초점이 ‘하루 진행 ▶’으로 옮겨지면 안 된다.
  - **띠:** 위쪽 경계는 고정 막대 아래쪽 경계다. 아래쪽 경계는 `innerHeight − max(알림 높이, 72px)`다.
    - 알림 높이는 `.flash-toast`의 `getBoundingClientRect()`로 구한다. CSS 변수나 `getComputedStyle`은 쓰지 않는다.
    - 72px는 넣은 직후 뜨는 알림 자리다. 비우지 않으면 넣은 뒤 예정 표시가 28~68%만 보였다(측정).
  - **맞출 범위:** `#culture-emp-h` 위쪽부터 넣기 칸(`#culture-slot`) 아래쪽까지가 띠 안에 들어오도록 최소 거리만 스크롤한다.
  - **상한:** 누른 직원 단추의 위쪽이 고정 막대 아래 8px보다 위로 올라가게 스크롤하지 않는다. 넘칠 때는 이 상한이 이긴다. 그러면 넣기 칸이 띠 밖에 남고 측정 4가 실패하므로, 그대로 보고한다.

### S-5 미리 보기 (`id="culture-preview"`, 줄 순서 고정)

- **부르는 법:** S-0.2의 상위 함수 안에서 `culturePreview(view, config, activityId, employeeId)`를 부른다.
  - 그 쌍이 이미 대기 목록에 있으면, 그 명령만 뺀 대기 목록으로 만든 `planState(state, config, pending − 그 명령).state`로 부른다.
  - `view`로 그대로 부르면 자기 자신 때문에 ‘다른 업무를 진행 중’으로 거절된다.
- 미리 보기는 주 열 전체 폭이다. 두 칸으로 나누지 않는다(두 칸이면 1366×657·1024×768·1133×744·1180×820에서 띠를 넘었다).
- 제목 `<h4 id="culture-pv-h">`. `role="status"`는 쓰지 않는다.

**허용일 때(`p.allowed`)**

| 순서 | 글 | 값 |
|---|---|---|
| 제목 | ‘미리 보기 — {직원} · {활동 제목}’ | |
| 1 (첫 줄) | ‘이 활동에 쓰는 것: 직원 1명의 하루 업무 · 원화 {비용}’. 기간이 2일 이상이면 ‘직원 1명의 {기간}일 업무’ | `p.cost`, `p.durationDays` |
| 2 | ‘{직원}: {시작}일 하루 동안 다른 업무를 맡을 수 없습니다.’ 여러 날이면 ‘{시작}~{끝}일 동안’ | `p.busyFromDay`, `p.busyUntilDay` |
| 3 (있을 때만) | 기다리는 업무마다: ‘⚠ 기다리는 업무: {대상} {업무 이름} {남은}pt{ ({출항}일 출항편 예약됨)} — 아직 아무에게도 배정하지 않았습니다.’ 이어서: ‘오늘 쉬는 다른 {도시} 직원: {이름 ‘·’ 나열}’, 없으면 ‘오늘 쉬는 다른 {도시} 직원: 없음. 이 활동을 하면 오늘 이 업무를 맡을 사람이 없습니다.’ | `p.waitingTasks[].task`. 대상은 `taskSubjectKo`, 업무 이름은 `taskName(kind)`, 남은 pt는 `requiredWorkUnits − progressWorkUnits`. 그 밖에 `.reservedDepartureDay`, `p.otherFreeLocalEmployeeIds`. 업무 이름을 글자로 박아 넣지 않는다 |
| 4 (기간 2일 이상일 때만) | ‘끝나는 날: {끝}일’ | `p.busyUntilDay` |
| 4-RF-1 | `p.busyUntilDay > config.campaignDays`이면 4번 대신 ‘⚠ 캠페인 마지막 날({캠페인 일수}일)까지 끝나지 않습니다. 기록·경험치는 생기지 않고 활동비는 나갑니다.’ 이때 7·8번 줄은 그리지 않는다 | 엔진은 막지 않고 결제한다 |
| 5 | ‘활동에 쓸 수 있는 원화: 지금 {전} → 활동 뒤 {후}’. 이 쌍 말고 다른 대기 명령이 있으면 끝에 ‘ (오늘 할 일 반영)’ | `p.availableBeforeMinor`, `p.availableAfterMinor` |
| 6 | ‘원화 급여 지급 가능일: 지금 {표기(전)} → 활동하면 {표기(후)}’. 이어서 ‘급여는 활동비와 별도로 평소대로 지급합니다.’ 표기 규칙은 표 아래에 있다 | `p.payrollRunwayBefore`, `p.payrollRunwayAfter` |
| 6-경고(의무) | 후 값이 `null`이 아니고 `< state.day`이며 전 값은 그렇지 않으면: ‘⚠ 이 활동비를 내면 오늘({오늘}일) 급여 일부가 미지급으로 남습니다.’ 전 값도 `< state.day`이면: ‘⚠ 지금도 오늘({오늘}일) 급여 일부가 미지급으로 남습니다.’ | |
| 7 (허용이고 RF-1이 아닐 때만, RF-2) | 이름표 ‘새로 생길 기록’ 아래 목록. ① ‘회사 보고서(처음 생김) — {주제 제목}’ 또는 ‘회사 보고서는 이미 있어 새로 생기지 않음’ ② (`actorExperience`이면) ‘{직원}의 직접 경험 기록’ ③ (`relationContactIds`가 있으면) ‘함께한 활동: {직원} — {인물1 전체 이름} · {직원} — {인물2 전체 이름}’(쌍마다) | `p.newRecords` |
| 8 | 같은 목록의 마지막 항목 ‘첫 완료 경험치 +{n}’(0이면 없음). **다른 항목과 같은 글자 크기·굵기·색이다. 칩·테두리·초록·배지 모양을 쓰지 않는다** | `p.newRecords.firstCompletionXp` |
| 9 | 띠 ‘**바뀌지 않는 것** {p.unchangedKo}’. 배경색 띠와 굵은 이름표로 8번보다 눈에 띄게 한다 | `p.unchangedKo` |
| 넣기 칸 | `<div id="culture-slot" data-action-slot="culture-{활동 ID}-{직원 ID}">` 안에 주 단추 ‘오늘 할 일에 넣기’(`data-action="culture-queue" data-activity data-emp`). 아래 작은 글 ‘넣기만 해서는 시간이 흐르지 않습니다. 활동비는 ‘하루 진행’ 때 나갑니다.’ | |

- **6번의 표기 규칙:**
  - `null` → ‘{캠페인 일수}일(캠페인 끝)까지’.
  - `< state.day` → ‘오늘 급여 일부 미지급’.
  - 그 밖 → ‘{n}일까지’.
  - 그래서 ‘0일까지’나 ‘{오늘−1}일까지’는 어디에도 나오지 않는다.

**거절일 때(`!p.allowed`)**
1. 같은 제목.
2. ‘⚠ 시작할 수 없음: {p.reasonKo}’. 엔진 문장 그대로 쓴다.
3. ‘시작할 수 없으므로 새로 생기는 기록이 없습니다.’
4. 9번 ‘바뀌지 않는 것’ 띠.
5. 넣기 칸 안의 꺼진 넣기 단추.
- 1·2·4~8번 줄(비용·업무 공백·원화·급여 비교, 새 기록·경험치)은 그리지 않는다. RF-1 경고도 그리지 않는다. 거절일 때 엔진의 비교값은 ‘조건을 갖췄다면’의 값이라, 이득처럼 읽히면 안 된다.

### S-6 넣기와 누른 자리 예정 표시

- ‘오늘 할 일에 넣기’는 기존 `queue({ id: newId('CULTURE'), type: 'START_CULTURE_ACTIVITY', activityId, employeeId })`를 부른다. 알림 문장, 거절 처리, F1 자리 유지, 500ms 막기는 기존 경로 그대로다.
- 넣은 뒤 같은 칸에 기존 `queuedStatus('culture-{활동}-{직원}', '현지 활동 예정')`을 그린다. id는 `status-culture-{활동}-{직원}`이다. 그 아래에 ‘빼려면 ‘오늘 할 일’에서 ‘빼기’를 누르세요.’를 둔다.
- `render()`의 초점 복원 slot 대응(지금은 assign·book만)에 `culture-queue` → `culture-{data-activity}-{data-emp}`를 더한다. 넣은 뒤 초점은 예정 표시로 간다.
- 칸 안에 ‘빼기’ 단추를 따로 두지 않는다. 빼기는 기존 ‘오늘 할 일’ 목록으로만 한다.

### S-7 하루 진행 뒤: 본 결과, 알림, ‘결과 보기’, 읽던 자리 (사용자 결정: 읽던 자리 유지 + 알림)

**바꾸지 않는 것:** 결과를 저절로 펼치거나, 결과 카드로 스크롤하거나, 초점을 옮기지 않는다. 초점은 ‘하루 진행 ▶’에 남는다.

**‘아직 안 본 결과’ (사용자 결정의 ‘다음에 부산 현지를 열면 새 기록이 맨 위’)**

‘방금 마감한 날’ 하나로만 판정하면, ‘결과 보기’를 누르지 않고 하루를 한 번 더 진행했을 때 결과가 맨 위에서 사라진다. 그래서 아래처럼 정한다. 로그 글자는 해석하지 않는다.
- `ui.cultureSeenDay: number | null`은 패널을 마지막으로 연 순간의 `state.day`다. 처음부터·불러오기·가져오기·시나리오 변경 때 `null`이 된다.
- 아직 안 본 결과는 다음 조건을 모두 만족하는 업무다:
  - 확정 `state`의 `kind === 'CULTURE'`, `status === 'DONE'`.
  - `completedDay >= (ui.cultureSeenDay ?? state.day − 1)`.
  - `null`일 때는 ‘방금 마감한 날’ 규칙과 같다. 불러오기 뒤 더 오래된 안 본 결과는 기록장에만 남는다. 이것은 받아들이는 대가다.
- 패널을 열 때(탭이든 ‘결과 보기’든) 순서를 지킨다. 순서가 바뀌면 연 순간 카드가 사라진다.
  1. `ui.cultureShowFromDay = ui.cultureSeenDay ?? state.day − 1`을 먼저 둔다.
  2. 그다음 `ui.cultureSeenDay = state.day`로 바꾼다.
- 패널이 열려 있는 동안, 몸통 맨 위에는 `completedDay >= ui.cultureShowFromDay`인 결과 카드를 최신 날부터 그린다. 열린 채 하루를 진행하면 새 결과도 이 조건에 들어온다.
- 탭의 ‘새 기록 있음’은 패널이 닫혀 있고 아직 안 본 결과가 있을 때만 보인다(S-1 우선순위).

**알림**
- 방금 마감한 날(`state.day − 1`)에 끝난 문화 업무가 있으면 `ui.flash`에 `action: 'culture-result'`를 더한다.
- 아래쪽 알림(`.flash-toast`) 오른쪽 끝에 단추 `<button data-action="culture-result">결과 보기</button>`을 그린다.
- ‘오늘 할 일’ 칸의 `<p class="flash">` 사본에는 글만 그대로 둔다. 단추와 `role`은 넣지 않는다.
- 문장은 culture.ts의 순수 함수가 만든다. 종류는 `info`이고, 거절이 있으면 `warn`이다.
  - 1건: ‘{마감한 날}일 현지 활동 기록: {주제 제목} — {직원}’.
  - 2건 이상: ‘{마감한 날}일 현지 활동 기록 {n}건’.
  - 거절된 명령이 같은 날 있으면: 기존 ‘실행하지 못한 명령: …’ 뒤에 ‘ · {마감한 날}일 현지 활동 기록이 있습니다.’를 붙인다.
- CSS: `.flash-toast button { pointer-events: auto; min-height: 44px; }`. 마우스 프로필에서도 44px이다. 알림의 나머지 부분은 지금처럼 포인터를 통과시킨다.
  - 알려진 대가: 알림이 남아 있는 동안에는 단추 자리가 아래 내용의 누름을 받는다. 다음 넣기·빼기·저장·하루 진행이 알림을 바꾸면 단추도 사라진다. 그 뒤에는 탭의 ‘새 기록 있음’과 패널 맨 위가 대신한다.
- **화면 읽기**
  - 단추가 있는 알림에는 하루 진행 직후 첫 그리기에서만 `role="status"`를 붙인다(`ui.cultureResultFresh`, 성장 알림 선례).
  - 같은 날 성장 알림 블록은 `role` 없이 그린다. 그날 알리는 곳은 결과 알림 하나다.
  - 단추가 없는 알림과 문화 결과가 없는 날의 성장 알림은 지금과 글자 하나 다르지 않다.
- **‘결과 보기’를 누르면**
  1. 탭으로 열 때와 같이 ‘본 결과’를 갱신한다(위 순서).
  2. `ui.cultureOpen = true`, `ui.flash = null`, `ui.cultureTabTop = null`.
  3. `render(true)`.
  4. 방금 마감한 날의 첫 결과 카드 제목 `culture-result-h-{업무 ID}`에 `scrollIntoView({ block: 'start' })`를 부르고 초점을 둔다.
  5. 500ms 막기.
  - 하루 진행 뒤 화면을 옮기는 동작은 이것뿐이고, 학생이 스스로 누른 것이다.
- **키보드 경로:** 알림은 DOM 맨 끝이라 멀다. 탭(‘새 기록 있음’)으로 패널을 열면, 결과 카드가 패널 머리 바로 아래에 있다.
- 하루 진행 뒤 고른 직원은 지운다(`ui.cultureEmployeeId = null`). 고른 활동은 남긴다.

**읽던 자리 기준 (기존 F3 넓히기)**
- 지금 기준은 고정 막대 아래에 처음 보이는 `.contract`의 `h3[id]` 하나뿐이다.
- 하루 진행 직전에 고정 막대 아래·알림 위에 보이는 후보를 위에서부터 **모두** 기억한다(id와 화면 위치). 후보는 다음과 같다.
  - `.contract`의 `h3[id]`(기존 방법).
  - 패널이 열려 있으면 `document.getElementById`로 찾은 다음 제목들: 지금 그려진 결과 카드 제목(`culture-result-h-…`), `culture-h`, `culture-emp-h`, `culture-book-h`.
- 다시 그린 뒤 **아직 있는 첫 후보**로 `window.scrollBy(0, dy)`를 한 번 한다. `|dy| < 1`이면 하지 않는다.
- `culture-pv-h`(미리 보기 제목)는 후보가 아니다. 하루 진행 때 고른 직원을 지우므로 사라지기 때문이다.
- 이렇게 하면 패널을 연 채 하루를 진행해 결과 카드가 맨 위에 새로 생겨도, 보던 ‘② 갈 직원 고르기’ 줄이 같은 화면 위치에 남는다.

### S-8 결과 카드 (패널 맨 위)

```html
<article class="cul-result" aria-labelledby="culture-result-h-{업무 ID}">
  <h3 id="culture-result-h-{업무 ID}" tabindex="-1">{주제 제목} <small>{완료일}일 기록 · {활동 제목}</small></h3>
  <p class="rec-meta">기록한 직원 {직원} · 출처 {인물 전체 이름 ‘·’}({n}명) · 다른 출처로 아직 확인하지 않은 기록</p>
  <ol class="rec4">… 네 칸 …</ol>
  <p class="spent"><b>쓴 것</b> {직원}의 하루 업무({시작}일) · 원화 {비용}</p>
  <p class="unchanged"><b>바뀌지 않은 것</b> {CULTURE_UNCHANGED_KO}</p>
</article>
```

- **보고서 찾기:** `cultureBook(state, config).reports`에서 `activityId === task.subjectId`인 것을 쓴다. 주제 제목은 그 활동의 `topic.titleKo`다.
- **출처 줄**
  - `report.sourceContactIds`를 `config.culture.contacts`의 **전체 이름**(`nameKo`, 예 ‘시장 상인 윤서’)으로 ‘·’ 나열하고 인원 수를 붙인다. 짧은 이름을 화면에서 만들지 않는다.
  - ‘다른 출처로 아직 확인하지 않은 기록’은 `status === 'UNVERIFIED'`에 대응하는 화면 문구다. ‘안 읽은 기록’으로 읽히지 않게 ‘다른 출처로’를 붙였다.
- **두 번째 직원:** 같은 활동을 두 번째 직원이 해서 `report.taskId !== task.id`이면, 메타 줄 앞에 다음 문장을 둔다: ‘회사 보고서는 {report.day}일에 이미 있습니다. 네 칸은 그대로입니다. · 이번에 다녀온 직원 {직원}’.
- **네 칸은 같은 무게다.**
  - 같은 요소·같은 클래스·같은 글자 크기와 굵기를 쓴다. 칸마다 이름과 안내 질문(S-3과 같은 글)을 작게 붙인다.
  - 본문은 `reportKo.findingKo / scopeKo / notClaimedKo / openQuestionKo`를 한 글자도 바꾸지 않고 보인다.
  - 말풍선·인용 확대를 쓰지 않는다.
- 3번 칸(말하지 않는 것)에만 테두리와 글자 표시 ‘넓혀 읽지 않기’를 함께 단다. ‘✕’ 기호와 움직임은 쓰지 않는다.
- **‘쓴 것’:** 담당 직원은 `task.assignedEmployeeId`, 날짜는 `task.startedDay`(여러 날이면 ‘{직원}의 {시작}~{완료}일 업무’), 금액은 활동 비용이다.
- ‘바뀌지 않은 것’ 띠는 미리 보기와 같은 모양이다.
- 카드 안에 단추를 두지 않는다. 경험치는 다시 쓰지 않는다(기존 성장 알림에 이미 나온다). 카드는 `role="status"`가 아니다.

### S-9 부산 기록장

- **머리:** 절 제목 `<h3 id="culture-book-h" tabindex="-1">부산 기록장 <small>회사 보고서·직원의 직접 경험 기록·함께한 활동은 서로 다른 기록입니다.</small></h3>`.
- **단추:** ‘부산 기록장 열기’/‘부산 기록장 닫기’(`data-action="culture-book"`, `aria-expanded`). 처음에는 닫혀 있다. 열고 닫아도 상태가 바뀌지 않는다.
- **내용**(확정 `state`의 `cultureBook(state, config)`):
  - **‘회사 보고서’**
    - 최신이 맨 위다(`day` 내림차순, 같은 날은 배열 역순).
    - 항목은 결과 카드와 같은 부품의 기록장 모드다: 제목, 메타(‘{day}일 · 기록한 직원 {직원} · 출처 … · 다른 출처로 아직 확인하지 않은 기록’), 네 칸(안내 질문과 ‘넓혀 읽지 않기’ 포함).
    - ‘쓴 것’과 ‘바뀌지 않은 것’은 결과 모드에만 둔다.
    - 없으면 ‘회사 보고서가 없습니다. 현지 활동을 마치면 위의 네 칸으로 남습니다.’
  - **‘직원의 직접 경험 기록’** + 작은 글 ‘그 직원이 직접 듣고 본 기록입니다. 능력·처리량을 바꾸지 않습니다.’
    - 항목: ‘{직원} — {활동 제목} ({verifiedDay}일)’.
    - 없으면 ‘직접 경험 기록이 없습니다.’ 경험이 없는 직원을 하나씩 나열하지 않는다.
  - **‘함께한 활동’** + 작은 글 ‘점수가 아니라 누가 누구와 무엇을 함께했는지 적은 기록입니다.’
    - **사건마다 한 줄**, 최신이 위다: ‘{직원} — {인물 전체 이름} · {활동 제목} ({day}일)’.
    - 없으면 ‘함께한 활동이 없습니다.’ 빈 쌍을 나열하지 않는다.
  - **‘만난 사람’**: 사건이 있는 인물만 ‘{전체 이름} — {informationScopeKo}’(자료 문장 그대로).
  - **끝 문장:** ‘거래 신뢰는 계약을 약속대로 지켰는지에서만 나옵니다. 현지 활동은 이것을 바꾸지 않습니다.’
- 숫자·막대·단계·친밀도를 쓰지 않는다.

### S-10 원화 보고서 ‘현지 활동비’ 행

- `src/ui/reports.ts`의 `krwReportRows`에서 `config.culture`가 있으면, ‘훈련비’ 뒤·‘운영 손익’ 앞에 `['현지 활동비', -p.cultureExpense]`를 넣는다.
  - 지금은 이 행이 없어서, CA01 하루 뒤 행의 합(−160,000원)이 운영 손익(−180,000원)과 맞지 않는다.
- **메모:**
  - 새 상수 `KRW_REPORT_NOTE_CULTURE_KO = '급여는 원화로 매일 지급하며 계약금·훈련비·현지 활동비는 한 번 내는 원화 비용입니다. USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.'`를 둔다.
  - `krwReportNoteKo`는 `config.culture`일 때 이 상수를 돌려준다. 기존 `KRW_REPORT_NOTE_KO`는 바꾸지 않는다.
- **바꿔도 되는 기존 기대값(이것뿐이다):**
  - `src/ui/main.test.ts` 164~169행: M2 행 목록과 메모. 시험 이름의 ‘일곱 행’은 ‘여덟 행’으로 바꿔도 된다.
  - `src/ui/trade-reports.test.ts` 32~46행: M2 행·금액·메모.
  - 바꾼 줄은 보고서에 ‘옛 값 → 새 값’으로 적는다.
  - M1 시험(`main.test.ts` 552~567행)은 바뀌지 않아야 한다.

### S-11 M1

- `config.culture === null`이면 S-1~S-10이 하나도 그려지지 않는다. `.maincol` 감싸기도 없다.
- M1 HTML 문자열은 지금과 글자까지 같다. 빈 템플릿 조각 때문에 공백·줄바꿈이 생기지 않게 한다.
- M1 시험과 카드 스냅숏도 그대로 통과해야 한다.

### S-12 엔진 예외 (상수 하나)

- `src/engine/previews.ts`에 `export const CULTURE_UNCHANGED_KO = '가격·하루 처리량·운임·관세·거래 신뢰';`를 둔다. `culturePreview`의 `unchangedKo`가 이 상수를 쓰게 한다.
- 결과 카드는 이 상수를 import한다. 값과 동작은 바뀌지 않는다.
- **그 밖의 엔진 파일은 바꾸지 않는다.**

### S-13 수용 명세 P0-CITY-01 정리

- 시험의 P0-CITY-01 단언 2개가 통과하면, `tests/acceptance_cases.json`의 P0-CITY-01에서 `unexecuted_assertions` 두 항목을 지운다(비면 키도 지운다).
- 대신 `"ui_test_ref": "src/ui/main.test.ts"`와 `"ui_test_note_ko"`를 더한다. 메모에는 두 가지를 적는다: 명세의 ‘5개 도시 진입점’을 ‘부산 현지 장소 5곳’으로 대응한다는 것, 그리고 시험 이름.
- 사례 수 18은 그대로다. P0-CITY-03의 퇴사 미실행 단언은 그대로 둔다.

## 범위

- **포함:**
  - 새 파일: `src/ui/culture.ts`, `src/ui/culture.test.ts`.
  - 고칠 파일: `src/ui/main.ts`, `src/ui/session.ts`, `src/ui/reports.ts`, `src/ui/style.css`.
  - 화면 시험과 하네스: `src/ui/main.test.ts`, `src/ui/main-testkit.ts`, `src/ui/trade-reports.test.ts`(S-10 목록만).
  - 그 밖: `src/engine/previews.ts`의 상수 하나(S-12), `tests/acceptance_cases.json`의 P0-CITY-01(S-13).
- **제외:**
  - 그 밖의 `src/engine/**`, `data/**`, 저장 형식.
  - `src/ui/focus.ts`, 격자 영역 문자열, 공용 h2 규칙.
  - 성장 알림 ‘+10 경험치’ 문구, 동료 필터 이름 ‘업무·교육 중’, `commandLabel`·`crewStatusKo` 문구.
  - 출장·다른 도시·후속 견적(M2a-4b), 관찰 문장(`observationsKo`)을 카드에 넣는 것.
  - 미뤄진 Tab 순서·Shift+Tab 문제(P14-03), ‘빼기’ 두 번 누름 막기.

## 시험

### 하네스 주의 (`src/ui/main-testkit.ts`, 가짜 DOM — 확인한 사실)

**가짜 DOM의 동작**
- `app.querySelector`는 아는 선택자(`.flash-toast`, `.statusbar`, detail·end-day 단추, 지도 틀)만 찾는다. 나머지는 `null`이다.
- `app.querySelectorAll`은 `[data-action-slot]`·`.contract`만 따로 다룬다. **모르는 선택자에는 `data-action` 요소 전부를 돌려준다.** 이 요소들에는 id도 `querySelector`도 없다.
- `document.querySelector`는 무엇을 넣든 `app`을 돌려준다.
- `document.getElementById`는 HTML에 그 id가 있으면 어떤 id든 흉내 객체를 돌려준다. 그 객체의 `focus`·`scrollIntoView`만 `focusIds`·`scrollIds`에 기록된다.
- `window`에는 `innerHeight`와 `scrollBy`만 있다. `scrollTo`·`scrollY`·`getComputedStyle`은 없다.
- `document.createElement`는 없다.

**그래서 지킬 것**
- 새 코드에서 요소를 찾을 때는 `document.getElementById`와 정해진 id를 쓴다.
- 스크롤은 `scrollIntoView`와 `window.scrollBy`만 쓴다.
- 하네스에 다음 대응을 더한다:
  - `closest('[data-action-slot]')`: `culture-queue` → `culture-{activity}-{emp}`.
  - P0-CITY-01 시험용 `createElement` 대역.
- 하네스가 모르는 경로는 조용히 건너뛸 수 있다. 그러므로 시험마다 그 경로를 실제로 지났다는 단언(호출 횟수·id)을 넣는다.

**합성 설정**
- `cfg = structuredClone(config)`로 만들고, 화면 시험은 `startUi(cfg)`로 같은 설정을 쓴다.
- 다른 설정으로 만든 저장을 가져오지 않는다. 기간이 다른 업무는 불러오기 검사에서 `SaveError`가 난다.

### `src/ui/culture.test.ts` (상위 함수·순수 함수 직접 호출)

엔진 상태는 `openDay`·`planState`·`commitDay`·`runDays`로 만든다.

1. **기본 미리 보기:** M2 2일 CA01·귀솔. S-5 표의 줄이 그 순서로 있다.
   - 첫 줄: ‘이 활동에 쓰는 것: 직원 1명의 하루 업무 · 원화 20,000원’.
   - 1일 활동이므로 ‘끝나는 날’ 줄이 없다.
   - 급여 줄은 ‘지금 62일까지 → 활동하면 62일까지’다.
2. **RF-2:** 거절되는 세 경우에서 확인한다.
   - 경우: 같은 직원 반복, 같은 날 같은 활동의 두 번째 직원(상위 함수에 `pending`을 넘김), 자금 부족.
   - 단언: ‘새로 생길 기록’·경험치·비교 줄이 없다. `reasonKo`가 그대로 있다. ‘바뀌지 않는 것’ 띠가 있다.
3. **RF-1**
   - 설정: `cfg.culture` CA01의 `durationDays = 2`, `cfg.campaignDays = 2`. 1일을 마감하고 2일을 연 상태에서 미리 보기를 만든다.
   - 기본 M2 자금으로 90일에 만들면 자금 부족으로 거절된다. 그 방법은 쓰지 않는다.
   - **먼저** `p.allowed === true`와 `p.busyUntilDay > cfg.campaignDays`를 단언한다. 그다음 RF-1 경고가 있고(문구의 캠페인 일수는 `cfg.campaignDays`), 새 기록·경험치 줄이 없음을 본다.
   - 같은 날 자금이 모자란 설정을 하나 더 만든다. 거절 분기에 RF-1 경고가 없음을 단언한다.
4. **급여 미지급:** `cfg.startingCash.KRW`를 바꾼 1일 상태에서 확인한다.
   - 179,999원: 전 1 → 후 0. ‘⚠ 이 활동비를 내면 오늘(1일) 급여 일부가 미지급으로 남습니다’가 있다.
   - 100,000원: 전 0 → 후 0. ‘⚠ 지금도 오늘(1일) 급여 일부가 미지급으로 남습니다’가 있다.
   - 두 경우 모두 ‘0일까지’가 없다.
5. **기다리는 업무 경고:** 준비 업무를 배정하지 않은 상태에서 경고 문장이 있다.
   - 다른 쉬는 직원이 있을 때와 없을 때 문장이 다르다.
   - 업무 이름은 `taskName`에서 온다.
6. **대기 중인 쌍:** 넣은 뒤 상위 함수가 그린 미리 보기를 본다.
   - ‘다른 업무…를 진행 중’ 거절이 없고, 예정 표시가 있다.
   - 같은 대기 목록에서 다른 직원을 고르면 ‘같은 활동에 오늘 이미’ 거절과 꺼진 넣기 단추가 있다.
7. **결과 카드**
   - 네 칸이 같은 요소·클래스다.
   - 3번 칸 본문은 문자열 리터럴 ‘부산의 다른 상인이나 손님도 작은 포장을 원한다는 뜻이 아닙니다.’와 같다. 나머지 칸은 `config.culture`의 `reportKo`와 같다.
   - ‘넓혀 읽지 않기’는 3번 칸에만 있다.
   - 출처 줄은 ‘출처 시장 상인 윤서(1명) · 다른 출처로 아직 확인하지 않은 기록’이다(CA03은 2명).
   - ‘쓴 것 귀솔의 하루 업무(2일) · 원화 20,000원’과 ‘바뀌지 않은 것’(`CULTURE_UNCHANGED_KO`)이 있다.
   - 카드 안에 `<button`이 없다.
   - 두 번째 직원의 결과에는 ‘회사 보고서는 …일에 이미 있습니다’가 있다.
8. **기록장**
   - 최신이 맨 위다.
   - 함께한 활동은 사건마다 한 줄이다(CA01과 CA03을 모두 하면 귀솔—윤서가 두 줄).
   - 빈 쌍·경험 없는 직원이 나열되지 않는다.
   - ‘만난 사람’에 정보 범위 문장이 그대로 있다. 거래 신뢰 문장이 있다.
9. **장소 목록**
   - 다섯 제목이 자료 순서다.
   - 금융센터 줄에 ‘이번 판에 없습니다’가 있다.
   - 목록 안에 `data-action`이 없다.
   - 영입이 없는 합성 설정에서는 비즈니스 라운지 줄이 ‘이번 판에서는 여기서 할 일이 없습니다.’다.
10. **알림 문장 함수:** 1건, 2건, 거절과 함께 있는 경우의 문장과 종류(info/warn)를 확인한다.
11. **M1·이스케이프·내부 ID**
    - M1이면 모든 문화 함수가 `''`다.
    - 이름에 `<`가 들어간 합성 설정으로 이스케이프를 확인한다.
    - 태그를 지운 보이는 글자와 `aria-label` 값에 내부 ID가 없다.
12. **금지 문구와 조사 규칙**
    - 문화 화면 HTML 전체에 다음이 없다: ‘빈 쪽’, ‘채우’, ‘쪽 남음’, ‘다녀온 직원’, ‘다녀옴’, ‘✓’, ‘✕’, `animation`, `transition`.
    - `src/ui/culture.ts` 원본에서 주석을 지운 뒤, `}` 바로 뒤에 `(은|는|이|가|을|를|와|과|으로|로)`가 오는 템플릿이 없다(정규식 검사).

### `src/ui/main.test.ts` 새 `describe` (실제 `main` 연결)

1. **한 바퀴(a) — 연 채 하루 진행**
   - 2일에 탭 → 패널 열림, `#local-h`로 `scrollIds`와 초점.
   - 활동 → 직원(미리 보기 있음, `culture-emp-…`에 초점, 고르기 뒤 499ms 안의 넣기 누름은 대기 목록을 바꾸지 않음).
   - 넣기(예정 표시 `status-culture-…`에 초점, F1 단언: `afterRender`로 칸 위치를 바꾸면 `scrollBy`가 정확한 값으로 한 번).
   - 넣은 뒤 물보리를 누르면 ‘같은 활동에 오늘 이미’ 거절과 꺼진 넣기 단추. 귀솔을 다시 누르면 ‘진행 중’ 거절 없이 예정 표시.
   - 하루 진행 뒤 단언:
     - 초점은 ‘하루 진행 ▶’이다.
     - `scrollIds`에 `culture-result-h-`가 없다.
     - 알림에 ‘결과 보기’와 `role="status"`가 있고, 다음 그리기에서는 `role`이 없다. 그날 성장 알림 블록에는 `role`이 없다.
     - 탭 둘째 줄은 ‘닫기’다.
     - 결과 카드가 패널 맨 위에 있다.
2. **한 바퀴(b) — 넣은 뒤 탭으로 닫고 하루 진행**
   - 하루 진행 뒤 `window.scrollBy` 호출이 없고, 탭이 ‘새 기록 있음’이다.
   - ‘결과 보기’를 누르면: 패널이 열리고, `culture-result-h-…`로 `scrollIds`·`focusIds`가 남고, 알림이 없다.
3. **안 본 결과 유지**
   - ‘결과 보기’를 누르지 않고 하루를 두 번 진행한다 → 탭이 ‘새 기록 있음’이다.
   - 탭으로 연다 → 2일 결과 카드가 `#local-h` 바로 아래에 있다.
   - 닫았다가 다시 연다 → 카드가 없다.
4. **닫기**
   - 닫는 곳 세 곳(탭, `culture-close` head·end) 모두 초점이 `local-tab`으로 돌아간다.
   - 열기 전 탭 위치(`bounds`)를 정하고 닫은 뒤 `afterRender`로 바꾸면, `scrollBy`가 그 차이로 정확히 한 번 호출된다.
   - 열기·닫기 뒤 500ms 막기가 있다.
5. **읽던 자리**
   - 넣은 직후 상태를 `bounds`로 만든다: `#culture-h`는 막대 위, `#culture-emp-h`와 `#culture-pv-h`는 띠 안.
   - 하루 진행 렌더 뒤 `afterRender`로 `#culture-emp-h`를 결과 카드 높이만큼 내린다.
   - 단언: `scrollBy(0, 그 높이)`가 정확히 한 번이고, `#culture-pv-h`는 사라졌다.
6. **P0-CITY-01 단언 1**
   - 다음 동작 전후에 저장 문자열과 위쪽 막대 HTML이 같다: 열기·닫기, 기록장 열기·닫기, 활동·직원 고르기, 미리 보기, ‘결과 보기’.
   - 저장 문자열은 ‘내보내기’ 경로로 얻는다. 하네스 `document`에 `createElement` 대역을 두고, `Blob`/`URL.createObjectURL`을 가로채 내용을 읽는다. 내보내기는 다시 그리지 않고 알림을 지우지 않는다.
   - ‘저장’ 단추는 결과 알림을 지우므로 쓰지 않는다. `main.ts`에 시험 전용 export를 더하지 않는다.
7. **P0-CITY-01 단언 2:** 금융센터 줄에 미구현 표시가 있고, 주식·상장 단추가 없다.
8. **초기화:** 처음부터·불러오기·가져오기·시나리오 변경 뒤 문화 화면 상태가 지워진다(기존 `it.each`에 더한다). 지워지는 상태에는 `cultureSeenDay`·`cultureTabTop`이 포함된다.
9. **M1:** 전체 화면에 ‘부산 현지’, ‘현지 활동비’, `data-action="culture-`, `class="maincol"`이 없다.
10. **원화 보고서:** CA01 하루 뒤의 행 목록·금액을 확인한다. 비용 행의 합이 운영 손익과 같고, `현금 = 시작 운영 자금 + 운영 손익 + 미지급 급여`다.
11. **CSS**
    - 격자 영역 문자열 세 벌이 그대로다(기존 시험 통과).
    - `.layout`의 `grid-template-rows: auto auto 1fr`와 1000px 이하의 `none`.
    - `.flash-toast button`의 `pointer-events: auto`와 `min-height: 44px`.
    - `.trade`의 `position: relative`와 `.local-tab`의 `position: absolute`.

## 브라우저 측정 기준 (Claude가 최종 측정한다)

괄호 안 값은 Claude가 3판 실제 배치에 대역을 넣어 잰 값이다. 각 기준에서는 의도 문장이 우선이고, 수치는 그 의도를 확인하는 방법이다.
- **프로필(모두 판정에 넣는다):**
  - 1024×768·1133×744·1180×820(터치, 2배율).
  - 1366×657(마우스·터치).
  - 1920×969(마우스).
  - 1000×700(한 열, 터치).
- **측정 상태:** 따로 적지 않으면 2일(T1 뒤), CA01·귀솔, 고용 직원 2명, 기다리는 업무 없음.

1. **닫힌 상태(C4)**
   - 의도: 문화 기능이 있어도 첫 화면의 견적과 오른쪽 칸 순서는 3판과 같다.
   - 1일 첫 화면과 2일 맨 위에서, 다음 요소의 y가 3판과 ±1px다(측정 0px): `#trade-h`, 견적판 제목, 첫 견적, `#crew-h`, 자원 예약 제목, `#queue-h`.
   - 고정 막대 높이 변화는 0이다. M1 1일과 전 세계 지도 배치에서도 같다.
   - **열린 상태:** 장소 목록·미리 보기·결과를 연 상태에서 `#crew-h`·자원 예약 제목·`#queue-h`의 y가 닫힌 상태와 같다(격자 줄 규칙의 확인).
2. **진입점**
   - 의도: 거래를 시작하기 전에 ‘부산 현지’가 보이지만 견적을 가리지 않는다.
   - scrollY 0에서 탭 전체가 고정 막대 아래·화면 안에 있다(176~245px).
   - 터치에서 탭은 44px 이상이다.
   - 탭과 제목 글자 줄(Range)의 겹침은 0이고, 탭 아래 끝과 다음 상자 위 끝 사이는 4px 이상이다(S-1.1의 정의. 측정: 겹침 0, 견적판 제목까지 8.7px).
3. **열기·닫기**
   - 의도: 열면 바로 읽을 자리에 패널이 오고, 닫으면 하던 곳으로 돌아간다.
   - 열기 직후 패널 제목은 고정 막대 아래 0~40px다(25px).
   - 닫은 뒤 탭은 열기 직전 화면 위치 ±2px이고, 막대 아래·알림 위에 100% 보인다.
4. **미리 보기(C6, 기준서 변경 기록 참고)**
   - 의도: 고르기 전에 기회비용과 ‘바뀌지 않는 것’을 넣기 단추와 함께 한 번에 읽는다.
   - 직원을 누른 직후 `#culture-emp-h`부터 넣기 칸까지가, 고정 막대 아래와 화면 아래 72px 위 사이에 모두 보인다.
   - 측정한 높이 / 쓸 수 있는 높이(`innerHeight − 막대 − 72`):
     - 1366×657 터치 494/506, 마우스 494/513.
     - 1024×768 580/617, 1133×744 538/593, 1180×820 538/669.
     - 1000×700 494/549, 1920×969 452/825.
   - **가장 작은 여유는 12px다.** 미리 보기에 줄을 더하면 1366×657에서 넘칠 수 있다.
   - 기다리는 업무 줄이 있는 상태는 참고값으로 따로 적는다.
   - 활동 카드부터 미리 보기 끝까지 전체가 한 화면에 들어가는 것은 요구하지 않는다(946~1,118px로 어느 자리에서도 불가능했다).
5. **넣기**
   - 의도: TASK-0014의 누른 자리 기준을 문화 활동에도 그대로 적용한다.
   - 넣은 뒤 예정 표시가 아래로 40px 넘게 밀리지 않고, 고정 막대와 알림 사이에 100% 보인다.
6. **하루 진행**
   - 의도: T2의 반복 ‘하루 진행’을 끊지 않고, 읽던 자리를 지킨다.
   - **패널을 닫고 진행:** scrollY 변화 0px.
   - **패널을 연 채 진행:** 하루 진행 직전 기준 제목(S-7 후보 가운데 남은 첫 제목)의 화면 위치 변화 ±1px. 결과 카드로 스크롤하지 않는다(`scrollIntoView` 0회).
   - 두 경우 모두 초점은 ‘하루 진행 ▶’이고, 알림의 ‘결과 보기’는 44px 이상이다.
7. **결과 보기(C1)**
   - 의도: 한 번 누르면 네 칸을 같은 무게로 한 화면에서 읽는다.
   - 결과 카드 제목은 고정 막대 아래 0~40px다(22~23px).
   - 네 칸 상자와 ‘바뀌지 않은 것’이 모두 막대 아래·알림 위에 있다.
   - 세 흐름 모두 통과해야 한다: 연 채 진행, 닫고 진행, 이틀 진행 뒤 탭으로 열기.
8. **품질(C6)**
   - 첫 화면, 열기, 미리 보기, 하루 진행 뒤, 결과의 다섯 단계에서 확인한다.
   - 가로 넘침 0, 보이는 HTML 글자 12px 이상, `any-pointer: coarse`에서 44px 미만 대상 0.

가능하면 Playwright Chromium으로 직접 재서 보고서에 표로 적는다. 하지 못하면 그렇게 적는다.

## 완료 조건

1. S-0~S-13이 반영되었다.
2. **변형 시험**
   - 진행 방법:
     1. 먼저 올바른 코드에서 아래 시험이 모두 통과하는 것을 확인한다.
     2. 변형을 하나씩 넣어 실패하는 시험을 확인한다.
     3. 보고서에 표로 적는다(변형, 실패한 시험 이름).
     4. 확인한 뒤에는 되돌린다.
   - 변형 목록:
     - RF-2 조건 제거(거절일 때도 새 기록을 그림).
     - RF-1 경고 제거.
     - 거절 분기에 RF-1 경고를 그림.
     - 미리 보기를 `view` 대신 확정 `state`로 부름.
     - 대기 중인 쌍을 그대로 `view`로 부름.
     - 직원 고르기 뒤 500ms 막기 제거.
     - 하루 진행 뒤 결과 카드로 저절로 스크롤. 두 가지로 넣어 본다: `scrollIntoView` 판과 `window.scrollBy` 판.
     - ‘아직 안 본 결과’를 ‘방금 마감한 날’ 규칙으로 되돌림.
     - 읽던 자리 후보에서 `culture-emp-h` 제거.
     - 닫기 뒤 탭 위치 복원 제거.
     - 알림 단추의 `pointer-events: auto` 제거.
     - `grid-template-rows` 줄 제거.
     - ‘현지 활동비’ 행 제거.
     - M1에서 탭을 그림.
     - culture.ts가 `notClaimedKo`를 그릴 때 한 글자를 바꿈.
3. 바꿔도 되는 기존 기대값은 S-10 목록뿐이다. 다음을 지켰다:
   - 그 밖의 판단 문구·경제 기대값·M1 단언을 바꾸지 않았다.
   - `focus.ts`와 그 시험을 바꾸지 않았다.
   - `map-integration.test.ts`·`pixel.test.ts`의 단언을 약화하지 않았다.
4. 다음 검증이 통과한다: 머리말의 검증 다섯 개, `python3 tools/test_validate_data.py`, `python3 tools/art/test_pixel_tools.py`.

## 결과 보고

`docs/ai/tasks/results/TASK-0012.md`에 머리말 형식으로 쓴다. 다음을 꼭 넣는다.
- 바꾼 기존 기대값(옛 값 → 새 값).
- 하네스에 더한 대응.
- 변형 시험 표.
- 지시서와 코드가 달랐던 곳.
- 브라우저 측정을 했으면 수치표.

최종 실제 배율 측정과 C1~C8 재채점은 Claude가 한다.
