# TASK-0035 D14 지도 상세 (가′: 고르기 목록 + 지도 누르기는 가까운 후보 + 지도 아래 읽기 전용 상세 칸)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `a21011c`(TASK-0024·0025·0026·0055·0027~0030 반영) 위에 이 지시서를 올린 커밋이 `<BASE>`다. `<BASE>`에서 만든 `codex/TASK-0035`에서 작업한다.
  - `<BASE>`는 허브가 지시서를 올릴 때 해시로 바꾼다. 자리표시가 그대로 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0035-map-detail.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다. 지시서를 올린 커밋이 더한 `docs/ai/tasks/`·`docs/ai/design/map-detail-d14/`·`MANIFEST.json`은 이 작업의 변경으로 치지 않는다.
  - 모든 diff·검사 명령의 기준 커밋은 `<BASE>`다.
  - **줄 번호:** 아래 줄 번호는 `a21011c` 기준이다. `src/ui/`·`src/content/map.ts`·`tools/browser/`는 `a21011c`와 `<BASE>`가 같아야 한다. 다르면 코드가 사실이고, 차이를 결과 보고에 적는다.
- 결정 근거:
  - `docs/ai/design/DECISION-PACKET-2026-10.md` 395~411행 D14(지도 클릭 상세, B61). 사용자는 2026-10-10에 ‘가’를 골랐다(`docs/DECISIONS.md` ‘사용자 결정 일괄 채택’).
  - **2026-10-11 사용자 결정(허브 세션):** D14를 ‘가′: 목록 + 지도 누르기(추천)’로 바꾼다. 근거는 `docs/ai/design/map-detail-d14/README.md`다.
    - 지도 표시는 지름 7.2~21px이다.
    - 표시 사이가 44px보다 가까운 쌍은 ‘이번 항로’에서 2개(30.5·33.1px), ‘전 세계’에서 5~15개다.
    - 파나마 도시와 운하는 1.5~3px 떨어져 있다.
    - 그래서 ‘표시마다 버튼’은 터치 대상 44px와 겹침을 함께 만족하지 못한다.
  - **WCAG 2.2 SC 2.5.8(Target Size Minimum, AA):** 24×24 CSS px를 요구하되, 같은 기능의 다른 컨트롤이 같은 쪽에 있으면 예외다(Equivalent). 이 작업의 고르기 목록이 그 컨트롤이다. 그래서 ‘목록이 보이는 지도의 표시를 빠짐없이 덮는다’를 시험으로 고정한다(시험 1~6·12~14). 완료 조건 3에 ‘목록이 지도 표시 전부를 덮는다(보이는 지도 기준, 빠진 것 0)’을 둔다.
  - **실명 규칙:** 실제 회사·선박 이름은 게임 밖 근거 자료에만 쓴다(`docs/ai/SESSION_TREE.md` ‘조사’).
    - `data/routes.json`의 `schedule_basis.carrier_service_ko`(ROUTE01·02)는 실제 선사·서비스 이름이다.
    - ROUTE02의 `note_ko`에도 실제 선사 이름이 있다.
    - 화면에는 둘 다 쓰지 않는다. 확인 날짜(`checked_on`)와 오차(`tolerance_days`)만 쓴다(시험 4).
  - D13(Esc로 맨 위 칸 닫기, TASK-0024): 지도 상세 칸을 Esc 대상 칸 목록에 더한다.
  - 터치 크기는 `any-pointer: coarse`로만 건다(DECISIONS 1064행). 새로 여닫는 동작에는 500ms 누름 막기를 건다(DECISIONS 928행).
  - TASK-0024 ‘펼침 띠’(`revealBelow`): 펼친 칸은 72px 알림 자리를 비우고 띠 안으로 최소 거리만 굴린다. 지도 상세 칸에도 같은 함수를 쓴다.
- Claude 사전 작업(2026-10-11): `a21011c` 사본에 이 설계 전체를 넣은 시제품을 만들었다. 시험·변형 시험·Chromium 측정을 돌렸다(아래 ‘사전 측정’). 부록 A~D가 그 시제품의 변경이다. 같은 내용의 패치가 `docs/ai/design/map-detail-d14/proto-a21011c.patch`에 있다(참고용, 합치지 말고 아래 구현 지시대로 넣는다).

## 목표

1. **고르기 목록(D14 가′의 접근 경로):**
   - 지도 바로 위에 `<select data-action="map-pick" id="map-pick">`를 둔다.
   - 보이는 지도(이번 항로/전 세계)에 그린 표시(거점·해협·배)를 묶음별로 빠짐없이 한 번씩 담는다.
   - Tab 정지점은 하나다. 터치 프로필에서는 높이 44px다.
2. **지도 누르기:**
   - 이름표(리본·해협 이름)를 누르면 그 표시를 고른다.
   - 그 밖의 곳을 누르면 누른 점에서 22 CSS px 안의 표시를 찾는다.
     - 하나면 그것을 고른다.
     - 둘 이상이면 상세 칸에 후보 단추를 보인다.
     - 없으면 아무것도 하지 않는다.
3. **지도 아래 읽기 전용 상세 칸:**
   - 고른 표시의 이름·묶음과 지금 SVG `<title>`과 같은 자료의 글을 보인다.
   - 이번 시나리오 노선과 그 운항 근거(실명 없이)를 보인다.
   - 고른 표시는 지도에서 고리(`pick-ring`)로 강조한다.
4. **닫기:** 상세 칸의 ‘닫기’ 단추와 Esc로 닫는다. 닫은 뒤에는 목록으로 초점을 돌려준다.
5. **안내 문구:** `main.ts` 394행의 ‘거점에 마우스를 올리면 선정 근거가 보입니다.’를 바꾼다.
6. **측정 도구:** `select` 단계가 `index`로도 고를 수 있게 한다(시나리오에 도시 ID를 쓰지 않기 위해). 측정 시나리오 `map-detail` 하나를 더한다.

**바꾸지 않는 것:**
- 지도 그림·보기 영역·배율·이름표 배치. TASK-0025의 폭 맞춤, 측정 기억(`MapMeasurementMemory`)과 그 시험.
- SVG의 `role="img"`와 `aria-label` 요약, 각 표시의 `<title>`(마우스 사용자를 위해 둔다).
- 지도 범례, 세계지도 가로 스크롤 안내(`mapPresentation`).
- 엔진·자료·저장 형식. `data/**`는 읽기만 한다.
- TASK-0024의 Esc 대상 4칸의 동작, 한 열 화면 코드 순서, 읽던 자리 규칙.

## 사전 측정 (Claude, `a21011c` 사본 시제품)

시제품 빌드와 `a21011c` 빌드는 모두 저장소 밖 사본에서 빌드했다(빌드 표시 `dev`). Chromium 141, 7개 프로필, 글꼴은 로컬.

- **시험:** vitest 41개 파일·1,168개 → 42개 파일·1,191개(할 일 1). 새 시험 23개 모두 통과, 기존 시험 단언 변경 0.
- **크기:** 첫 화면 404,273 B·gzip 118,650 B → 410,414 B·gzip 120,322 B(+6,141 B, gzip +1,672 B). 설계 검토의 추정(gzip 2~4 KB)보다 작다.
- **새 시나리오 `map-detail`:** 시제품에서 7개 프로필 모두 통과. `a21011c` 빌드에서는 1단계(`#map-pick` 없음)에서 실행 오류로 실패한다(시나리오가 이 작업을 가르는지 확인).

| 프로필 | 목록 높이 | 닫기 높이 | 상세 제목 위치 | 막대에서 닫기까지 |
|---|---|---|---|---|
| l1366 | 38.8 | 37.3 | 171.5 | 455.8 |
| cb1366t | 44 | 44 | 157.8 | 442.1 |
| ipadAirL | 44 | 44 | 298.2 | 605 |
| ipadminiL | 44 | 44 | 156.2 | 553 |
| ipadmini6L | 44 | 44 | 154.7 | 529 |
| l1920 | 38.8 | 37.3 | 573.5 | 767.8 |
| t1000 | 44 | 44 | 290.5 | 484.8 |

  - 목록·닫기 높이: 터치 프로필(`any-pointer: coarse`)에서 44px. 마우스 프로필은 브라우저 기본 높이.
  - 상세 제목 위치: 고른 뒤 상세 칸 제목의 위쪽 끝(막대 아래 7px 이상).
  - 막대에서 닫기까지: 막대 아래 끝에서 닫기 단추 아래 끝까지. 시나리오 기대의 위 한계로 쓴다.
- **기존 시나리오 14개:** 시제품 빌드의 값이 TASK-0024 검수 때 잰 값(`a21011c`와 같은 화면)과 **모두 같다**(14개 × 7개 프로필, 바뀐 값 0). 지도 위에 목록 한 줄이 생겨도, 기존 시나리오가 재는 자리(막대·카드·성장 상세·일정·지도 폭 맞춤)는 움직이지 않았다.
- **실제 키·누르기(`d14.js`):** 목록 고르기 → 고리·상세 칸, 이름표 누르기, 휘장 누르기, 파나마 도시·운하 겹친 곳 → 후보 단추 2개 → 고르면 상세 제목에 초점, Esc·닫기 뒤 초점이 목록, 전 세계 목록 27개 = 표시 27개, 쪽 오류 0·가로 넘침 0.

## 먼저 읽을 파일

- `src/ui/map.ts`(416행):
  - 5행 import.
  - 126~140행 `hubStatus`·`hubTitle`. 132~137행 `when`을 함수로 뺀다.
  - 237행 `renderWorldMap` 시그니처(옵션에 `picked`를 더한다).
  - 304~312행 거점 `<g class="port …">`(308행 휘장 원).
  - 315~323행 해협 `<g class="gate …">`(320행 해협 표시).
  - 325~343행 배(325~336행 운항 묶기는 함수 `voyagesOf`로 뺀다. 342행 배 `<g>`).
  - 404행 `mapLegend` 앞에 `MapMark`·`mapMarks`·`nearestMarks`를 둔다.
- `src/content/map.ts`(102행): 69행 `RouteRaw`, 99~102행 `loadRouteWaypoints`(그 뒤에 `loadRouteScheduleCheck`를 더한다).
- `src/ui/main.ts`(1343행):
  - 30행 `./map` import.
  - 70~74행 Esc 칸(`LayerKey`·`LAYER_ORDER`·`layerTouched`·`layerSeq`). 136~146행 `resetUi`.
  - 373~396행 `worldMap()`(391행 지도 틀, 392행 안내, 393행 범례, 394행 안내 문구).
  - 944~956행 `openLayers`. 971~983행 `closeTopLayer`(979행). 985행 `render`. 1041행 측정 뒤 다시 그리기.
  - 1125~1127행 click 처리 머리. 1232~1234행 `map-mode`. 1297~1310행 change 처리(1306행 `crew-role`).
  - 287~296행 `revealBelow`, 958~969행 `markOpened`·`revealOpener`(TASK-0024).
- `src/ui/main-testkit.ts`(174행): 29행 `bounds` 형, 80행 `newFrame`, 139행 `querySelectorAll`, 163행 `clickTarget`.
- `tools/browser/lib.mjs`(250행): 61~66행 단계 검사(65행 `select`의 `value`), 142행 `select` 실행. `tools/browser/lib.test.mjs`(137행): 8행 `names`, 29~47행 잘못된 단계 시험.
- `src/ui/map-integration.test.ts`(지도 연결 시험, 읽기만): `./pixel`을 통째로 흉내 낸다.
- `data/routes.json`(읽기만): `schedule_basis`.
- `docs/ai/design/map-detail-d14/README.md`(설계 검토와 측정).

## 범위

**포함 (이 순서로 한다)**
1. `src/content/map.ts`: `loadRouteScheduleCheck`(구현 지시 1).
2. `src/ui/map.ts`: `voyagesOf`·`hubWhen`, `data-mark`·`data-mark-dot`, `picked` 고리, `MapMark`·`mapMarks`·`nearestMarks`(구현 지시 2).
3. `src/ui/main.ts`: 상태·목록·상세 칸·누르기·Esc·닫기·안내 문구(구현 지시 3).
4. `src/ui/style.css`: 파일 끝에 규칙 블록(구현 지시 4).
5. `src/ui/main-testkit.ts`: 흉내 더하기(구현 지시 5).
6. `tools/browser/lib.mjs`·`lib.test.mjs`: `select`의 `index`(구현 지시 6). 새 시나리오 `map-detail.json`(구현 지시 7).
7. 새 시험 `src/ui/map-detail.test.ts`(부록 D), 결과 보고.

**제외**
- D14 안 나(상세에서 노선 비교표·계약 카드로 이동하는 행동). 다음 판이다.
- 지도 그림·보기 영역·이름표 배치·범례 바꾸기. 휘장 크기 바꾸기.
- 방향키로 지도 표시 사이를 움직이는 그룹(D14 원안 ‘가’). 사용자가 가′로 바꿨다.
- 세계지도 틀의 방향키 가로 스크롤 동작 바꾸기.
- `SCENARIO_M2_OPERATIONS`를 화면 목록에 올리기(세션 A의 M2a-5 화면 작업).
- 브라우저 측정. Sol 샌드박스에서는 Chromium이 죽는다. 시나리오는 `--dry-run`만 한다. Claude가 잰다.

**시간이 모자라면 뺄 수 있음**
1. 측정 시나리오 `map-detail.json`(구현 지시 7). `lib.mjs`·`lib.test.mjs`의 `index`(구현 지시 6)는 빼지 않는다. 뺀 항목은 결과 보고에 ‘미충족(시간)’으로 적는다.

## 고칠 수 있는 파일

- `src/content/map.ts`: `RouteRaw` 형 한 줄과 새 함수 하나만.
- `src/ui/map.ts`
- `src/ui/main.ts`
- `src/ui/style.css`: 파일 끝에 새 규칙 블록을 더하기만. 기존 규칙 줄은 바꾸거나 지우지 않는다.
- `src/ui/main-testkit.ts`: 흉내와 도우미를 더하기만. 기존 흉내의 동작은 바꾸지 않는다(부록 C).
- 새 파일 `src/ui/map-detail.test.ts`(부록 D).
- `tools/browser/lib.mjs`: 65행(검사 한 줄 → 두 줄)과 142행(실행 한 줄)만.
- `tools/browser/lib.test.mjs`: 8행 `names` 끝에 `'map-detail'`, 41행 뒤에 경우 셋, 43행 뒤에 한 줄.
- 새 측정 시나리오 `tools/browser/scenarios/map-detail.json`.
- `docs/ai/tasks/results/TASK-0035.md`(결과 보고).
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `data/**`(`routes.json`·`world.json` 포함), `src/engine/**`, `src/content/` 가운데 `map.ts` 말고 모두, `schemas/**`, `tests/**`, `scripts/**`.
  - `src/ui/` 가운데 위 목록 말고 모두(`map-integration.test.ts`, `map-fit.test.ts`, `layout.test.ts`, `main.test.ts`, `pixel.ts`, `projection.ts`, `schedule.ts`, `reports.ts` 포함).
    - `schedule.ts` 85행과 `reports.ts` 7·67행은 세션 A의 M2a-5 화면 작업이 고친다.
  - `tools/browser/measure.mjs`, `profiles.json`, `README.md`, 기존 시나리오 14개.
  - 허브만 쓰는 파일(`docs/ai/SESSION_TREE.md` ‘허브만 쓰는 파일’): `CLAUDE.md`, `AGENTS.md`, `.github/**`, `tools/ai/**`, `package.json`, `package-lock.json`, `vite.config.ts`, `PACKAGE_STATUS.json`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/VALIDATION.md`, `docs/ai/WORKFLOW.md`, `docs/ai/SESSION_TREE.md`, `docs/ai/CONTEXT_MAP.md`, `docs/ai/tasks/README.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`.
  - `docs/DESIGN_v0.4.md`, `docs/ai/design/**`, 지난 지시서, `README.md`, `START_HERE.md`, `references/**`.
  - `tsconfig.json`. 새 npm 의존성을 넣지 않는다.

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다.
- **기존 시험의 단언은 하나도 바꾸지 않는다.** 시제품에서 기존 시험 1,168개(41개 파일, 할 일 1)가 고치지 않고 모두 통과했다. 기존 시험이 실패하면 설계가 어긋난 것이다. 원인을 찾고, 못 찾으면 보고한다.
- 시험 환경을 피하려고 `?.` 선택 호출이나 존재 확인을 새로 넣지 않는다. 시험 틀을 넓힌다(TASK-0014 검수 기록).
  - 실제 DOM에서 없을 수 있는 요소(`getElementById('map-detail-h')` 등)를 다루는 `?.`는 괜찮다.
  - 시제품은 시험 틀 지도 틀에 `getBoundingClientRect`를 더해 이 규칙을 지켰다(부록 C).
- 키보드·초점 시험은 실제 Chromium 순서를 따른다. Esc는 document의 keydown 하나로 온다(DECISIONS 1036행).
- **실명:** 화면 글에 `schedule_basis.carrier_service_ko`의 낱말과 `note_ko`를 쓰지 않는다. `loadRouteScheduleCheck`는 선사·서비스 이름과 메모를 내보내지 않는다(시험 4).
- 새로 쓰는 시험 줄과 새 시나리오에 도시·거점·해협·노선·견적·직원·계약 ID와 도시 이름을 쓰지 않는다. 값은 설정·상태·`mapMarks`에서 꺼낸다.
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `SHANGHAI`, `HAIPHONG`, `PANAMA`, `MALACCA`, `ROUTE01`, `EMP01`, `CT001`, ‘평택’, ‘부산’, ‘파나마’.
  - `tools/browser/lib.test.mjs` 82~103행이 시나리오의 금지 이름을 검사한다. 그래서 시나리오는 `select`의 `index`로 고른다.
- 학생이 읽는 새 글은 이 지시서가 정한 것만 쓴다. 목록: 구현 지시 3의 글, 묶음 이름 5개(구현 지시 2), 상세 칸 노선 줄의 괄호 글, 배 이름 꼴. 결과 보고 ‘화면 문구’ 절에 모두 적는다.
- 모든 글을 `esc()`로 넣는다. 양수 `tabindex`를 쓰지 않는다.
- 새 CSS는 파일 끝에 더하기만 한다. 터치 크기는 `@media (any-pointer: coarse)`로만 건다.
- 새로 여닫는 동작(목록 고르기, 후보 고르기, 닫기, 지도 누르기)에는 500ms 누름 막기(`ignoreClicksUntil`)를 건다.
- **크기 한도(TASK-0026):** `npm run build` 뒤 `node tools/check_bundle_size.mjs dist`가 통과해야 한다. 시제품은 첫 화면 404,273 → 410,414 B(+6,141 B), gzip 118,650 → 120,322 B(+1,672 B)였다. gzip 증가가 3,000 B를 넘으면 결과 보고 ‘설계 판단’에 이유를 적는다.
- **캐릭터 자료 칸(TASK-0055):** 이 작업은 캐릭터 자료의 새 칸을 읽지 않는다. 읽게 되면 같은 변경에서 `src/content/character-fields.ts`의 `CHARACTER_FIELDS`에 더해야 한다.
- 코드 주석은 한국어로, 짧은 문장으로 쓴다.
- 새 시험 제목에 사례 ID(`P0-…` 등)를 넣지 않는다. 네트워크 조사는 하지 않는다.

## 구현 지시

코드는 부록 A~C의 시제품 diff와 같게 넣는다. 아래는 각 부분의 규칙과 이유다. 부록 diff와 이 글이 다르면 이 글이 앞선다(차이는 결과 보고에 적는다).

### 1. `src/content/map.ts` — 운항 근거 확인값 (부록 A 첫 묶음)

- 69행 `RouteRaw`에 `schedule_basis?: { status: string; checked_on: string; tolerance_days: number }`를 더한다.
- 파일 끝에 `loadRouteScheduleCheck(routeId)`를 더한다.
  - `status === 'CARRIER_WEEKDAY_SCHEDULE'`일 때만 `{ checkedOn, toleranceDays }`를 돌려주고, 그 밖에는 `null`을 돌려준다.
  - 선사·서비스 이름(`carrier_service_ko`), 메모(`note_ko`), 기항지는 돌려주지 않는다. 형에도 넣지 않는다.

### 2. `src/ui/map.ts` — 표시 열쇠, 고리, 표시 목록, 가까운 후보 (부록 A 둘째 묶음)

- 132~137행의 개방 단계 글을 `hubWhen(status, c)`로 뺀다. `hubTitle`은 그것을 부른다. `<title>` 글자는 바뀌지 않는다.
- 325~336행의 운항 묶기를 `voyagesOf(state, config)`로 뺀다. `renderWorldMap`과 `mapMarks`가 같은 함수를 쓴다.
- `renderWorldMap` 옵션에 `picked?: string | null`을 더한다.
- 열쇠는 `hub:<도시 ID>`, `gate:<해협 ID>`, `ship:<출항편 ID>`다.
  - 거점 `<g class="port …">`·해협 `<g class="gate …">`·배 `<g class="ship …">`에 `data-mark="<열쇠>"`를 단다.
  - 누를 점에 `data-mark-dot`을 단다. 거점은 휘장 원 `.port-badge`, 해협은 `.gate-mark`, 배는 배 `<g>` 자신이다.
  - 표시마다 누를 점은 정확히 하나다(시험 1).
- 고른 표시는 class 끝에 ` picked`를 붙인다.
  - 고리 `<circle class="pick-ring" … stroke-width="${3 * k}"/>`를 하나 그린다.
  - 고리 반지름: 거점 `16 * k * badgeScale`, 해협 `11 * k`, 배 `18 * k`. 배 고리는 배 `<g>` 바로 앞에 둔다.
  - 고르지 않으면 고리가 없다(시험 3).
- `MapMark { key; group; nameKo; lines }`와 `mapMarks(state, config, mode)`.
  - `renderWorldMap`이 그리는 표시와 같은 집합이다(거점은 보기 영역 안, 해협은 보기 영역 안, 배는 항로 꺾은선이 2점 이상).
  - 묶음 이름은 5개다: ‘이번 시나리오 거점’, ‘1장에서 열릴 거점’, ‘세계 확장(2장) 미리 보기’, ‘해협·운하’, ‘운항 중인 배’. 앞의 셋은 범례(`mapLegend`)와 같은 글이다.
  - 거점 `lines`: 역할(`·`로 이음), `basisKo` 줄들, `noteKo`, `hubWhen`, 이 거점이 출발·도착인 이번 시나리오 노선 줄, 운항 중인 배가 있으면 ‘이 거점을 오가는 운항 중인 배 n척’. 빈 글은 뺀다.
  - 노선 줄은 ``${r.id} ${출발 이름}→${도착 이름} ${transitDays}일·${departureIntervalDays}일마다``다. `loadRouteScheduleCheck`가 값을 주면 끝에 ``(선사 요일표로 확인 ${checkedOn}, 오차 ±${toleranceDays}일. 게임은 요일 없이 단순화)``를 붙인다.
  - 해협 `lines`: `connectsKo`, `eventHookKo`, ‘세계 확장(2장)에서 항로 선택·사건과 연결 예정’(지금 `<title>`과 같은 글).
  - 배: `nameKo`는 ``${출발 이름}→${도착 이름} 배``다. `lines`는 ‘출항편 …’, ‘실은 화물 …’, 대기면 ‘하역 중단으로 대기 중’이다.
- `nearestMarks(points, x, y, radius = 22)`: 반지름 안(경계 포함)의 열쇠를 가까운 순서로 돌려준다. 22는 44px 지름의 절반이다.

### 3. `src/ui/main.ts` — 목록·상세 칸·누르기·Esc (부록 B)

- 30행 import에 `type MapMark, mapMarks, nearestMarks`를 더한다.
- 74행 뒤 모듈 변수 둘: `mapPick: string | null = null`(고른 열쇠), `mapNear: string[] = []`(후보 열쇠들). `resetUi` 끝에서 둘 다 비운다.
- Esc 칸: `LayerKey`·`LAYER_ORDER`·`layerTouched`에 `'map'`을 끝에 더한다.
  - `openLayers`: `#map-detail`이 있으면 `{ key: 'map', within: '#map-detail, #map-pick, [data-map-frame]', opener: () => document.getElementById('map-pick') }`를 마지막에 더한다.
  - `closeTopLayer`: `top.key === 'map'`이면 `mapPick = null; mapNear = [];`.
- `worldMap()`:
  - 맨 앞에서 `marks = mapMarks(view, config, mapMode)`와 `picked = marks.find(…)`을 구한다.
  - 배치 순서: 머리 → `mapPicker` → 지도 틀(`renderWorldMap`에 `picked: picked?.key`) → 세계지도 안내(`hint`) → `mapDetail` → 범례 → 안내 문단.
- `mapPicker(marks, picked)`:
  - `<label class="map-pick">지도에서 볼 곳 <select data-action="map-pick" id="map-pick">`로 시작한다.
  - 첫 `<option value="">고르세요</option>`는 고른 것이 없을 때 ` selected`다.
  - 묶음마다 `<optgroup label="묶음">`, 표시마다 `<option value="열쇠">이름</option>`(고른 것은 ` selected`).
  - 보이는 지도의 표시를 빠짐없이 한 번씩 담는다(시험 8·9).
- `mapDetail(marks, picked)`:
  - 후보가 둘 이상이면: `<h3 id="map-detail-h" tabindex="-1">이 근처에 여러 곳이 있습니다</h3>`, 후보마다 `<button data-action="map-near" data-mark="열쇠">이름 <small>묶음</small></button>`(`<div class="map-near">` 안), 닫기 단추.
  - 고른 것이 있으면: `<h3 id="map-detail-h" tabindex="-1">이름 <small>묶음</small></h3>`, `<ul>`에 `lines`를 `<li>`로, `<button data-action="map-close">닫기</button>`.
  - 바깥은 `<div class="map-detail" id="map-detail">`다. 없으면 빈 글.
- 394행 안내 문구: ‘거점에 마우스를 올리면 선정 근거가 보입니다.’ → ‘목록에서 고르거나 지도의 거점·해협·배를 누르면 지도 아래에 자세한 내용이 나옵니다.’ 그 문단의 나머지 글은 그대로다.
- 1041행 측정 뒤 다시 그리기에도 `picked: mapPick`을 넘긴다.
- `pickMapMark(key, focusHead = false)`(render 앞):
  1. `mapPick = key; mapNear = [];`, 열쇠가 있으면 `markOpened('map')`.
  2. `render(focusHead)`.
  3. 세계지도 틀에서 고른 점이 틀 밖이면 틀 가운데로 `scrollLeft`를 옮긴다.
  4. `focusHead`면 `map-detail-h`에 초점(`preventScroll`).
  5. 화면 읽기 알림(`liveRegionText`)에 ‘<상세 제목>: 지도 아래에 자세한 내용’을 넣는다.
  6. `revealBelow(#map-detail, #map-detail-h)`로 상세 칸을 띠 안으로 가져온다.
  7. `ignoreClicksUntil = Date.now() + 500`.
- `tapMap(target, x, y)`:
  1. 누른 곳이 `.ribbon, .gate-label` 안이면 그 `[data-mark]`를 고른다.
  2. 아니면 `[data-map-frame] [data-mark-dot]`의 화면 중심으로 `nearestMarks`를 부른다.
  3. 결과가 하나면 `pickMapMark`. 둘 이상이면 `mapPick = null; mapNear = 후보`, `markOpened('map')`, `render()`, `revealBelow`, 500ms 막기. 없으면 아무것도 하지 않는다.
- click 처리 머리(1126행 뒤): `[data-action]`이 없고 `[data-map-frame]` 안을 눌렀고 500ms 막기가 아니면 `tapMap(ev.target, ev.clientX, ev.clientY)`.
- `map-mode`(1232행):
  - 범위를 바꾼 뒤 새 지도에 `mapPick`이 없으면 `null`로 지운다. `mapNear`는 비운다.
  - 다시 돌아와도 지운 표시가 되살아나지 않는다(시험 13).
- 새 click 동작:
  - `map-near`: `pickMapMark(d.mark ?? null, true)`. 후보 단추가 사라지므로 초점을 상세 제목에 둔다.
  - `map-close`: 둘 다 비우고 `render(true)`, `revealOpener(#map-pick)`, 500ms 막기.
- change 처리: `map-pick`이면 `pickMapMark(el.value || null)`. 목록에 초점이 있으면 기존 초점 복원이 목록을 지킨다.

### 4. `src/ui/style.css` — 파일 끝 (부록 C)

- `.map-pick`(줄 배치), `.pick-ring`(채우지 않고 남색 테두리, 색만이 아니라 고리 모양으로 보인다), `.map-detail`(테두리 칸), `.map-near`(줄바꿈 되는 단추 줄)을 더한다.
- `@media (any-pointer: coarse) { .map-pick select, .map-detail button { min-height: 44px; } }`.

### 5. `src/ui/main-testkit.ts` — 더하기만 (부록 C)

- 29행 `bounds` 형에 `left?`·`right?`·`width?`를 더한다.
- 80행 `newFrame`에 `getBoundingClientRect: () => ({left:0,right:930,top:0,bottom:600,width:930,height:600})`를 더한다.
- 139행 `querySelectorAll` 맨 앞에 `'[data-map-frame] [data-mark-dot]'` 경우를 더한다.
  - 렌더 HTML의 `data-mark`마다 `{ getBoundingClientRect: () => bounds['mark:'+열쇠] ?? 화면 밖, closest: () => ({ dataset: { mark: 열쇠 } }) }`를 돌려준다.
- 163행 뒤 `tapMap(x, y, label?)`:
  - 501ms를 넘긴 뒤 click을 보낸다(`detail: 1`, `clientX`, `clientY`).
  - target은 `closest('[data-action]')`이면 null, `'[data-map-frame]'`이면 `{}`다.
  - `label`을 주면 `'.ribbon, .gate-label'`에 그 열쇠의 `[data-mark]`를 돌려준다.
- 기존 시험은 이 흉내들을 부르지 않으므로 결과가 바뀌지 않는다.

### 6. `tools/browser/lib.mjs`·`lib.test.mjs` — `select`의 `index` (부록 C)

- 65행을 두 줄로 바꾼다.
  - `value`(문자열)와 `index`(0 이상 정수) 가운데 정확히 하나만 있어야 한다. 오류 글은 ‘value와 index 가운데 하나만 씁니다’, ‘index는 0 이상 정수입니다’다.
- 142행: `page.selectOption(s.selector, 'index' in s ? { index: s.index } : s.value)`.
- `lib.test.mjs`:
  - 8행 `names` 끝에 `'map-detail'`을 더한다.
  - 잘못된 단계 시험에 경우 셋을 더한다(값·순번 둘 다 없음, 둘 다 있음, 순번 −1).
  - 올바른 `{ do: 'select', selector: '#x', index: 1 }`이 오류 없음을 단언하는 줄을 더한다.
  - 기존 `select`(`crew-facet`의 `value`)는 그대로 통과해야 한다.

### 7. 측정 시나리오 `tools/browser/scenarios/map-detail.json` (부록 C)

- 단계:
  1. 목록을 막대 아래 120에 두고 목록 높이를 잰다.
  2. `index: 1`(첫 표시)로 고른다.
  3. 상세 제목과 닫기 단추의 막대 아래 위치, 닫기 단추 높이, 가로 넘침을 잰다.
  4. 전 세계로 바꾼다.
  5. `index: 20`으로 고른 뒤 같은 값들을 잰다.
- 기대:
  - 터치 5개 프로필에서 목록·닫기 단추 높이가 44 이상이다.
  - 상세 제목이 막대 아래 7 이상이다.
  - 닫기 단추가 72px 알림 자리 위에 있다. 프로필별 상한은 ‘화면 높이 − 80 − 단추 높이 − 막대 높이 + 1’이고 TASK-0024 `interview-hire`와 같다.
  - 가로 넘침은 0이다.
- `--dry-run`이 종료 코드 0이어야 한다.

## 테스트

새 시험 파일은 `src/ui/map-detail.test.ts` 하나다(부록 D, 23개). vitest는 시작 값보다 파일 1개·시험 23개가 늘어야 한다. 시제품은 41개 파일·1,168개 → 42개 파일·1,191개(할 일 1)였다.

`describe('지도 표시 목록(map.ts)')`
1~6. **(M1 1일·M1 6일 운항 중·M2 1일) × (이번 항로·전 세계): 표시 열쇠는 그린 지도의 `data-mark`와 같은 집합이다.** 열쇠는 겹치지 않고, 표시마다 누를 점이 하나다.
7. **운항 중인 배도 표시 목록에 있다.** 배가 없는 날에는 배 표시가 없다.
8. **고른 표시 하나만 `picked`와 고리를 갖는다.** 고르지 않으면 고리가 없다. 모든 표시, 두 범위에서 확인한다.
9. **상세 글에 실제 선사·서비스 이름과 노선 근거 메모를 쓰지 않는다.** `routes.json`에서 읽은 `carrier_service_ko`의 낱말과 `note_ko` 전체가 모든 상태·범위의 표시 글에 없다.
10. **운항 근거가 있는 이번 시나리오 노선은 확인 날짜와 오차를 거점 상세에 적는다.**
11. **가까운 표시는 반지름 22 안만, 가까운 순서로 돌려준다.** 경계 22는 들고 22.1은 빠진다.

`describe('지도 고르기 화면(main.ts)')`
12~13. **(M1·M2) 목록은 보이는 지도의 표시를 빠짐없이 한 번씩 담고, 처음 값은 ‘고르세요’다.** 두 범위에서 확인한다(WCAG 2.5.8 예외의 근거).
14. **배가 운항 중이면 목록에 배 묶음이 있고 지도 표시와 같다.**
15. **배치 순서와 안내 문구.** 목록 → 지도 틀 → 상세 칸 → 범례 순서다. 안내는 새 문장이고, ‘마우스를 올리면’은 없다.
16. **목록에서 고르면 지도 고리·상세 칸·목록 값이 같은 표시다.** 상세는 그 표시의 글을 모두 보인다. 이번 항로의 모든 표시에서 확인한다.
17. **Esc로 지도 상세를 닫는다.** 목록으로 초점을 돌려주고, 499ms 안의 누름을 막는다. 열린 칸이 없으면 다음 Esc는 `preventDefault`를 하지 않는다.
18. **닫기 단추로 닫아도 목록으로 초점을 돌려준다.**
19. **지도 범위를 바꿔도 고른 표시가 새 지도에 있으면 남고, 없으면 지운다.** 다시 돌아가도 되살아나지 않는다.
20. **처음부터 뒤에는 고른 표시가 없다.**
21. **지도 누르기.** 22px 안의 표시가 하나면 고르고, 여럿이면 후보 단추를 보이고, 없으면 아무것도 하지 않는다. 후보로 고르면 초점이 상세 제목에 간다.
22. **이름표를 누르면 거리와 상관없이 그 표시를 고른다.**
23. **성장 상세를 연 뒤 지도에서 고르면, Esc는 지도 상세부터 닫는다.** 성장 상세는 펼친 채로 남는다.

## 완료 조건

1. 구현 지시 1~7이 반영되었다. 뺀 항목이 있으면 ‘시간이 모자라면 뺄 수 있음’ 순서이고 결과 보고에 ‘미충족(시간)’으로 적었다.
2. **검증**
   - 시작 전에 한 번 돌려 기준 값을 결과 보고에 적는다: `npx vitest run`, `python3 tools/validate_data.py`, `node --test tools/browser/lib.test.mjs`, `node --test tools/check_bundle_size.test.mjs`, `npm run --silent build && node tools/check_bundle_size.mjs dist`.
     - Claude 확인값(`a21011c`): vitest 41개 파일·1,168개 통과(할 일 1), `lib.test.mjs` 11개, 첫 화면 404,273 B·gzip 118,650 B(빌드 표시 `dev`).
   - 끝내기 전에 결과 보고 파일을 먼저 만든 뒤 `bash tools/ai/review_checks.sh <BASE>`와 `bash tools/ai/review_checks.sh --check <BASE>`가 모두 통과한다(수정 모드 13종, 확인 모드 14종).
   - vitest: 시작 값 + 파일 1개 + 시험 23개, 모두 통과. 기존 시험의 단언 변경 0.
   - 자료 검사 PASS. 새로 MANIFEST에 드는 파일은 시나리오 1개와 결과 보고 1개다.
   - `lib.test.mjs`: 시작 값과 같은 수의 시험이 모두 통과한다(시험 안 경우만 늘어남).
   - 크기 한도 통과. 출력 전체와 시작 값 대비 증가를 적는다.
   - `node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/map-detail.json --dry-run`이 종료 코드 0이고, `profiles`가 7개다.
3. **바꾼 범위 확인** (출력을 결과 보고에 붙인다)
   - **목록이 지도 표시 전부를 덮는다(보이는 지도 기준, 빠진 것 0).** 시험 1~6·12~14가 통과하고, 결과 보고에 두 범위·세 상태(M1 1일, M1 6일 운항 중, M2 1일)마다 ‘목록 값 수 = `data-mark` 수’를 적는다. WCAG 2.5.8의 같은 기능 컨트롤(Equivalent) 예외가 이 조건에 기댄다.
   - `git diff --name-only <BASE>`와 `git status --short --untracked-files=all`의 파일이 모두 ‘고칠 수 있는 파일’ 안에 있다.
   - `git diff <BASE> -- data src/engine schemas tests scripts vite.config.ts index.html public package.json package-lock.json tsconfig.json src/ui/map-integration.test.ts src/ui/map-fit.test.ts src/ui/layout.test.ts src/ui/main.test.ts src/ui/pixel.ts src/ui/projection.ts src/ui/schedule.ts src/ui/reports.ts tools/browser/measure.mjs tools/browser/profiles.json tools/browser/README.md tools/ai`가 비어 있다.
   - `git diff <BASE> -- tools/browser/scenarios ':!tools/browser/scenarios/map-detail.json'`가 비어 있다.
   - 지운 줄 확인. 각 출력의 줄 수가 괄호 안과 같다:
     ```
     git diff <BASE> -- src/ui/style.css | grep '^-[^-]'          # 0줄
     git diff <BASE> -- src/content/map.ts | grep '^-[^-]'        # 1줄(69행 RouteRaw)
     git diff <BASE> -- tools/browser/lib.mjs | grep '^-[^-]'     # 2줄(65·142행)
     git diff <BASE> -- tools/browser/lib.test.mjs | grep '^-[^-]' # 1줄(8행)
     git diff <BASE> -- src/ui/main-testkit.ts | grep '^-[^-]'    # 3줄(29·80·139행을 늘려 씀). 옛 동작이 그대로인지 줄마다 적는다
     ```
   - `main.ts`·`map.ts`에서 지운 줄은 결과 보고에 옛 줄 → 새 줄로 모두 적는다. 시제품 기준은 다음과 같다.
     - `main.ts` 7줄: 30·70·71·73·391·394·1041행과 click 머리 1줄. 1127행은 그대로다.
     - `map.ts`: 5·132~137·237·305·308·318·320·325~336·342행.
   - 새 시험 줄·새 시나리오에 금지 문자열이 없다(결과 0건):
     ```
     cat src/ui/map-detail.test.ts tools/browser/scenarios/map-detail.json | grep -nE "PYEONGTAEK|BUSAN|SHANGHAI|HAIPHONG|YOKOHAMA|SINGAPORE|JAKARTA|HONG_KONG|PANAMA|MALACCA|HORMUZ|SUEZ|ROUTE[0-9]|OFFER_|EMP[0-9]|CT[0-9]{3}|VEN_|평택|부산|상하이|하이퐁|파나마|싱가포르"
     ```
   - 실명이 화면 코드에 없다(결과 0건): `grep -rnE "carrier_service|note_ko" src/ui src/content/map.ts`의 `src/ui` 줄과 `loadRouteScheduleCheck` 반환값.
   - 양수 `tabindex`가 새로 생기지 않았다: `git diff <BASE> -- src/ui | grep '^+' | grep -cE 'tabindex="[1-9]'` → 0.
4. **변형 시험.** 아래를 하나씩 넣고 `npx vitest run src/ui/map-detail.test.ts src/ui/layout.test.ts src/ui/main.test.ts src/ui/map-integration.test.ts`에서 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다(git으로 되돌리지 않는다). Claude 시제품에서 20종 모두 잡혔다.

| 번호 | 바꾼 것 | 실패하는 시험(시제품) |
|---|---|---|
| D01 | `mapMarks`에서 해협을 뺌 | 1~6 |
| D02 | 해협 표시의 `data-mark-dot`을 뺌 | 1~6 |
| D03 | 거점 고리를 그리지 않음 | 8 |
| D04 | 노선 줄의 확인 날짜·오차 괄호를 뺌 | 10 |
| D05 | `nearestMarks` 반지름 22 → 30 | 11 |
| D06 | `nearestMarks` 거리순 정렬을 뺌 | 11 |
| D07 | 목록에서 배 묶음을 뺌 | 14 |
| D08 | Esc 대상 칸에 지도 상세를 넣지 않음 | 17·23 |
| D09 | Esc가 고른 표시를 지우지 않음 | 17·23 |
| D10 | 닫기 단추 뒤 목록으로 초점을 돌려주지 않음 | 18 |
| D11 | 범위를 바꿀 때 새 지도에 없는 고른 표시를 남김 | 19 |
| D12 | `resetUi`가 고른 표시를 지우지 않음 | 20 |
| D13 | 이름표 누르기를 무시함 | 22 |
| D14 | 후보 단추로 고른 뒤 상세 제목에 초점을 두지 않음 | 21 |
| D15 | 고를 때 Esc 순번(`markOpened`)을 남기지 않음 | 23 |
| D16 | 안내 문구를 옛 문장으로 되돌림 | 15 |
| D17 | 목록을 지도 틀 뒤로 옮김 | 12~16 등 12개 |
| D18 | Esc 닫기 뒤 500ms 누름 막기를 뺌 | 17, `layout.test.ts`의 Esc 시험 1개 |
| D19 | 후보가 여럿이어도 첫째를 고름 | 21 |
| D20 | 상세 글 첫 줄을 뺌 | 16 |

5. **Claude가 잴 것 (Codex는 하지 않는다).** Chromium 7개 프로필. 두 빌드 모두 저장소 밖 사본에서 빌드해 빌드 표시를 `dev`로 맞춘다.
   - 시나리오 15개: 새 `map-detail`이 이 작업 빌드에서 모든 기대를 통과한다(`<BASE>` 빌드는 목록이 없어 실행 오류). 기존 14개의 값 변화는 ‘사전 측정’ 표와 같다.
   - 실제 키·누르기(Claude 측정기 `d14.js`): 목록 고르기, 이름표 누르기, 휘장 누르기, 파나마처럼 겹친 곳의 후보 단추, Esc·닫기 뒤 초점, 전 세계 목록 고르기 뒤 표시가 틀 안이다. 쪽 오류 0.
   - 키보드: TASK-0024 측정기(`kb`)로 정지점 수가 `<BASE>` + 1(목록)이다. 거꾸로 튀는 Tab은 t1000 0/0/0/0/0, 세 열 0을 유지한다.
6. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0035.md`에 머리말 형식(`CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유.
- **실행한 검증과 결과:** 시작 HEAD와 `git diff --name-only <BASE> HEAD`, 시작 기준 값, 명령별 결과와 개수, `review_checks.sh` 두 모드의 끝줄, 크기 한도 출력 전체와 증가, 시나리오 `--dry-run` 출력.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **기존 줄 변경 목록:** `main.ts`·`map.ts`·`main-testkit.ts`·`lib.mjs`의 지운 줄을 옛 줄 → 새 줄로.
- **변형 시험 표**
- **화면 문구:** 새로 보이는 글 전부(목록 이름표, ‘고르세요’, 묶음 이름 5개, 상세 칸 제목·후보 제목·닫기, 노선 줄 괄호 글, 배 이름 꼴, 안내 문장, 화면 읽기 알림 글).
- **범위 밖 발견:** 고치지 않은 문제. 적어도 다음을 확인해 적는다.
  - 전 세계 목록이 27곳 + 배로 길다. 묶음 이름이 화면 읽기 프로그램에서 읽히는지(`optgroup`).
  - 세계지도 틀의 방향키 가로 스크롤과 목록 초점이 겹치지 않는지(목록에 초점이 있을 때 방향키는 목록 값을 바꾼다).
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 측정은 하지 않는다.

## 예상 질문과 기본값

| 질문 | 기본값 |
|---|---|
| 목록을 브라우저 기본 `<select>`로 할까, 단추 + 목록으로 할까 | 기본 `<select>`. Tab 정지점 하나, iPad·크롬북의 시스템 고르기 화면, 화면 읽기 프로그램의 묶음 읽기를 모두 기본으로 얻는다 |
| 목록 값을 바꾸면 초점을 상세로 옮길까 | 옮기지 않는다. 목록에서 계속 다른 곳을 고를 수 있어야 한다. 상세는 화면 읽기 알림으로 알린다. 후보 단추로 고르면 단추가 사라지므로 그때만 상세 제목으로 옮긴다 |
| 지도 누르기 반지름 | 22 CSS px(44px 지름의 절반). 이름표를 누르면 거리와 상관없이 그 표시 |
| 지도를 누른 곳에 아무것도 없으면 상세를 닫을까 | 닫지 않는다(아무것도 하지 않는다). 지도를 끌어 움직이다가 닫히는 일을 막는다 |
| 배의 화물 ID를 학생에게 보여도 되나 | 지금 SVG `<title>`과 같은 글이다. 바꾸지 않는다(범위 밖) |
| `src/content/map.ts`는 누구 파일인가 | 지도 표시 자료 읽기다. 이 작업은 함수 하나와 형 한 줄만 더한다. 엔진과 자료는 바꾸지 않는다 |

## 부록 A. `src/content/map.ts`·`src/ui/map.ts` 시제품 diff (`a21011c` 기준)

```diff
diff --git a/src/content/map.ts b/src/content/map.ts
index 2e74d75..a8c83cc 100644
--- a/src/content/map.ts
+++ b/src/content/map.ts
@@ -66,7 +66,7 @@ type CityRaw = {
   hub_note_ko?: string;
 };
 type GateRaw = { id: string; name_ko: string; gate_type: SeaGate['gateType']; geo_position: GeoPoint; connects_ko: string; event_hook_ko: string };
-type RouteRaw = { id: string; map_waypoints?: { points: GeoPoint[] } };
+type RouteRaw = { id: string; map_waypoints?: { points: GeoPoint[] }; schedule_basis?: { status: string; checked_on: string; tolerance_days: number } };
 
 export function loadMapCities(): MapCity[] {
   return (world as unknown as { items: CityRaw[] }).items
@@ -100,3 +100,9 @@ export function loadRouteWaypoints(routeId: string): GeoPoint[] {
   const route = (routes as { items: RouteRaw[] }).items.find((r) => r.id === routeId);
   return route?.map_waypoints?.points ?? [];
 }
+
+/** 노선 운항 근거의 확인 날짜와 오차. 선사·서비스 이름과 메모는 내보내지 않는다(실명은 게임 밖 근거 자료에만). */
+export function loadRouteScheduleCheck(routeId: string): { checkedOn: string; toleranceDays: number } | null {
+  const basis = (routes as { items: RouteRaw[] }).items.find((r) => r.id === routeId)?.schedule_basis;
+  return basis?.status === 'CARRIER_WEEKDAY_SCHEDULE' ? { checkedOn: basis.checked_on, toleranceDays: basis.tolerance_days } : null;
+}
diff --git a/src/ui/map.ts b/src/ui/map.ts
index c8d782b..de88dd5 100644
--- a/src/ui/map.ts
+++ b/src/ui/map.ts
@@ -2,7 +2,7 @@
 // ‘이번 항로’는 1장 동아시아 확대 지도, ‘전 세계’는 태평양 중심 세계지도를 쓴다.
 // 지도 위치는 표시용이며 운송시간·거리 계산에 쓰지 않는다.
 
-import { HUB_ROLE_KO, loadMapCities, loadRouteWaypoints, loadSeaGates, type MapCity } from '../content/map';
+import { HUB_ROLE_KO, loadMapCities, loadRouteScheduleCheck, loadRouteWaypoints, loadSeaGates, type MapCity } from '../content/map';
 import { routeOf } from '../engine/catalog';
 import { portWaitStatus } from '../engine/progress';
 import type { GameState, ScenarioConfig } from '../engine/types';
@@ -128,13 +128,34 @@ function hubStatus(c: MapCity, routeCities: Set<string>): HubStatus {
   return c.availability.status === 'MAP_PREVIEW' ? 'preview' : 'planned';
 }
 
+type Voyage = { routeId: string; shipmentIds: string[]; departureDay: number; waiting: boolean; arrived: boolean };
+
+/** 선박: 출항 후 인도 전까지 항로 위에 표시. 같은 출항편에 실린 화물은 배 한 척으로 그린다. */
+function voyagesOf(state: GameState, config: ScenarioConfig): Map<string, Voyage> {
+  const voyages = new Map<string, Voyage>();
+  for (const sh of state.shipments) {
+    if (!(sh.arrivalDay === null || (sh.releaseDay !== null && state.day <= sh.releaseDay))) continue;
+    const booking = state.bookings.find((x) => x.id === sh.bookingId);
+    if (!booking) continue;
+    const v = voyages.get(booking.sailingId) ?? { routeId: booking.routeId, shipmentIds: [], departureDay: sh.departureDay, waiting: false, arrived: true };
+    v.shipmentIds.push(sh.id);
+    v.waiting ||= portWaitStatus(state, config, sh) === 'WAITING_RESTRICTION';
+    v.arrived &&= sh.arrivalDay !== null;
+    voyages.set(booking.sailingId, v);
+  }
+  return voyages;
+}
+
+function hubWhen(status: HubStatus, c: MapCity): string {
+  return status === 'active'
+    ? '이번 시나리오 거점'
+    : status === 'planned'
+      ? `1장 ${c.availability.stage} 단계에서 열림`
+      : '세계 확장(2장)에서 열림 — 지금은 지도 미리 보기';
+}
+
 function hubTitle(c: MapCity, status: HubStatus): string {
-  const when =
-    status === 'active'
-      ? '이번 시나리오 거점'
-      : status === 'planned'
-        ? `1장 ${c.availability.stage} 단계에서 열림`
-        : '세계 확장(2장)에서 열림 — 지금은 지도 미리 보기';
+  const when = hubWhen(status, c);
   const roles = c.roles.map((r) => HUB_ROLE_KO[r]).join('·');
   return [`${c.nameKo} — ${roles}`, ...c.basisKo, c.noteKo, when].filter(Boolean).join('\n');
 }
@@ -234,7 +255,7 @@ export function worldMapViewport(config: ScenarioConfig, mode: MapMode, options:
     routeBox, options.availableWidth, options.dpr, world ? 'world' : 'route');
 }
 
-export function renderWorldMap(state: GameState, config: ScenarioConfig, mode: MapMode, options: { availableWidth?: number; dpr?: number; baseOutsideSvg?: boolean } = {}): string {
+export function renderWorldMap(state: GameState, config: ScenarioConfig, mode: MapMode, options: { availableWidth?: number; dpr?: number; baseOutsideSvg?: boolean; picked?: string | null } = {}): string {
   const map = chooseMap(config, mode);
   if (!map) return '<p class="muted">지도 자산이 없습니다.</p>';
   const world = map === WORLD_MAP;
@@ -302,10 +323,11 @@ export function renderWorldMap(state: GameState, config: ScenarioConfig, mode: M
     const finance = c.roles.includes('FINANCE_CENTER');
     const badgeScale = status === 'preview' ? 0.78 : 1;
     return `
-    <g class="port ${status}">
+    <g class="port ${status}${options.picked === `hub:${c.id}` ? ' picked' : ''}" data-mark="hub:${c.id}">
       <title>${hubTitle(c, status)}</title>
+      ${options.picked === `hub:${c.id}` ? `<circle cx="${p.x}" cy="${p.y}" r="${16 * k * badgeScale}" class="pick-ring" stroke-width="${3 * k}"/>` : ''}
       ${status === 'preview' ? '' : `<circle cx="${p.x}" cy="${p.y}" r="${15 * k}" class="port-glow"/>`}
-      <g transform="translate(${p.x} ${p.y}) scale(${k * badgeScale})"><circle r="10" class="port-badge"/><g class="port-anchor">${c.cargoPort ? ANCHOR : BANK}</g>${finance ? '<circle cx="8" cy="-8" r="4" class="finance-coin"/>' : ''}</g>
+      <g transform="translate(${p.x} ${p.y}) scale(${k * badgeScale})"><circle r="10" class="port-badge" data-mark-dot/><g class="port-anchor">${c.cargoPort ? ANCHOR : BANK}</g>${finance ? '<circle cx="8" cy="-8" r="4" class="finance-coin"/>' : ''}</g>
       ${box ? `<g class="ribbon"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${5 * kr}"/>
       <text x="${box.x + box.w / 2}" y="${box.y + box.h * 0.7}" text-anchor="middle" font-size="${size * kr}">${c.nameKo}</text></g>` : ''}
     </g>`;
@@ -315,31 +337,22 @@ export function renderWorldMap(state: GameState, config: ScenarioConfig, mode: M
     const p = proj(g);
     const box = world ? labelFor(g.nameKo, p.x, p.y, 11, false) : null;
     return `
-    <g class="gate gate-${g.gateType}">
+    <g class="gate gate-${g.gateType}${options.picked === `gate:${g.id}` ? ' picked' : ''}" data-mark="gate:${g.id}">
+      ${options.picked === `gate:${g.id}` ? `<circle cx="${p.x}" cy="${p.y}" r="${11 * k}" class="pick-ring" stroke-width="${3 * k}"/>` : ''}
       <title>${g.nameKo} (${g.connectsKo})\n${g.eventHookKo}\n세계 확장(2장)에서 항로 선택·사건과 연결 예정</title>
-      <rect x="${p.x - 5 * k}" y="${p.y - 5 * k}" width="${10 * k}" height="${10 * k}" transform="rotate(45 ${p.x} ${p.y})" class="gate-mark"/>
+      <rect x="${p.x - 5 * k}" y="${p.y - 5 * k}" width="${10 * k}" height="${10 * k}" transform="rotate(45 ${p.x} ${p.y})" class="gate-mark" data-mark-dot/>
       ${box ? `<text class="gate-label" x="${box.x + box.w / 2}" y="${box.y + box.h * 0.72}" text-anchor="middle" font-size="${11 * k}">${g.nameKo}</text>` : ''}
     </g>`;
   });
 
-  // 선박: 출항 후 인도 전까지 항로 위에 표시. 같은 출항편에 실린 화물은 배 한 척으로 그린다.
-  const voyages = new Map<string, { routeId: string; shipmentIds: string[]; departureDay: number; waiting: boolean; arrived: boolean }>();
-  for (const sh of state.shipments) {
-    if (!(sh.arrivalDay === null || (sh.releaseDay !== null && state.day <= sh.releaseDay))) continue;
-    const booking = state.bookings.find((x) => x.id === sh.bookingId);
-    if (!booking) continue;
-    const v = voyages.get(booking.sailingId) ?? { routeId: booking.routeId, shipmentIds: [], departureDay: sh.departureDay, waiting: false, arrived: true };
-    v.shipmentIds.push(sh.id);
-    v.waiting ||= portWaitStatus(state, config, sh) === 'WAITING_RESTRICTION';
-    v.arrived &&= sh.arrivalDay !== null;
-    voyages.set(booking.sailingId, v);
-  }
+  const voyages = voyagesOf(state, config);
   const ships = [...voyages.entries()].map(([sailingId, v]) => {
     const pts = routeLines.find((l) => l.route.id === v.routeId)?.pts ?? [];
     if (pts.length < 2) return '';
     const t = v.arrived ? 1 : v.waiting ? 0.93 : (state.day - v.departureDay) / routeOf(config, v.routeId).transitDays;
     const pos = pointAlong(pts, t);
-    return `<g class="ship ${v.waiting ? 'waiting' : ''}" transform="translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${pos.angle.toFixed(1)}) scale(${k * 0.9})"><title>${sailingId}: ${v.shipmentIds.join(', ')}${v.waiting ? ' — 하역 중단으로 대기 중' : ''}</title>${SHIP}</g>`;
+    const picked = options.picked === `ship:${sailingId}`;
+    return `${picked ? `<circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${18 * k}" class="pick-ring" stroke-width="${3 * k}"/>` : ''}<g class="ship ${v.waiting ? 'waiting' : ''}${picked ? ' picked' : ''}" data-mark="ship:${sailingId}" data-mark-dot transform="translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${pos.angle.toFixed(1)}) scale(${k * 0.9})"><title>${sailingId}: ${v.shipmentIds.join(', ')}${v.waiting ? ' — 하역 중단으로 대기 중' : ''}</title>${SHIP}</g>`;
   });
 
   // 항만 사건: 공지된 하역 중단.
@@ -401,6 +414,55 @@ export function renderWorldMap(state: GameState, config: ScenarioConfig, mode: M
   </div>`;
 }
 
+/** 지도에 그린 표시 하나(거점·해협·배). 고르기 목록·지도 누르기·상세 칸이 같은 열쇠를 쓴다. */
+export interface MapMark { key: string; group: string; nameKo: string; lines: string[] }
+
+const MARK_GROUP: Record<HubStatus | 'gate' | 'ship', string> = {
+  active: '이번 시나리오 거점', planned: '1장에서 열릴 거점', preview: '세계 확장(2장) 미리 보기', gate: '해협·운하', ship: '운항 중인 배',
+};
+
+/** renderWorldMap이 그리는 표시를 같은 순서·같은 열쇠로 돌려준다. 상세 글은 지금 SVG 제목과 같은 자료에서 만든다. */
+export function mapMarks(state: GameState, config: ScenarioConfig, mode: MapMode): MapMark[] {
+  const map = chooseMap(config, mode);
+  if (!map) return [];
+  const routeCities = new Set(config.routes.flatMap((r) => [r.fromCityId, r.toCityId]));
+  const all = loadMapCities();
+  const nameOf = (id: string) => all.find((c) => c.id === id)?.nameKo ?? id;
+  const voyages = voyagesOf(state, config);
+  const order: Record<HubStatus, number> = { active: 0, planned: 1, preview: 2 };
+  const hubs = all.filter((c) => inBounds(c, map.bounds)).map((c) => ({ c, status: hubStatus(c, routeCities) }))
+    .sort((a, b) => order[a.status] - order[b.status]);
+  const marks: MapMark[] = hubs.map(({ c, status }) => ({
+    key: `hub:${c.id}`, group: MARK_GROUP[status], nameKo: c.nameKo,
+    lines: [
+      c.roles.map((r) => HUB_ROLE_KO[r]).join('·'), ...c.basisKo, c.noteKo, hubWhen(status, c),
+      ...config.routes.filter((r) => r.fromCityId === c.id || r.toCityId === c.id).map((r) => {
+        const check = loadRouteScheduleCheck(r.id);
+        return `${r.id} ${nameOf(r.fromCityId)}→${nameOf(r.toCityId)} ${r.transitDays}일·${r.departureIntervalDays}일마다`
+          + (check ? ` (선사 요일표로 확인 ${check.checkedOn}, 오차 ±${check.toleranceDays}일. 게임은 요일 없이 단순화)` : '');
+      }),
+      ...(() => { const n = [...voyages.values()].filter((v) => { const r = routeOf(config, v.routeId); return !v.arrived && (r.fromCityId === c.id || r.toCityId === c.id); }).length;
+        return n ? [`이 거점을 오가는 운항 중인 배 ${n}척`] : []; })(),
+    ].filter(Boolean),
+  }));
+  for (const g of loadSeaGates().filter((x) => inBounds(x, map.bounds))) {
+    marks.push({ key: `gate:${g.id}`, group: MARK_GROUP.gate, nameKo: g.nameKo, lines: [g.connectsKo, g.eventHookKo, '세계 확장(2장)에서 항로 선택·사건과 연결 예정'] });
+  }
+  for (const [sailingId, v] of voyages) {
+    if ((loadRouteWaypoints(v.routeId)).length < 2) continue;
+    const r = routeOf(config, v.routeId);
+    marks.push({ key: `ship:${sailingId}`, group: MARK_GROUP.ship, nameKo: `${nameOf(r.fromCityId)}→${nameOf(r.toCityId)} 배`,
+      lines: [`출항편 ${sailingId}`, `실은 화물 ${v.shipmentIds.join(', ')}`, ...(v.waiting ? ['하역 중단으로 대기 중'] : [])] });
+  }
+  return marks;
+}
+
+/** 누른 점에서 반지름 안의 표시 열쇠를 가까운 순서로. 지도 누르기는 22 CSS px(44px 지름의 절반)를 쓴다. */
+export function nearestMarks(points: { key: string; x: number; y: number }[], x: number, y: number, radius = 22): string[] {
+  return points.map((p) => ({ key: p.key, d: Math.hypot(p.x - x, p.y - y) }))
+    .filter((p) => p.d <= radius).sort((a, b) => a.d - b.d).map((p) => p.key);
+}
+
 /** 지도 아래 범례. 색·모양만으로 뜻을 전하지 않도록 글자로도 적는다. */
 export function mapLegend(): string {
   return `
```

## 부록 B. `src/ui/main.ts` 시제품 diff

```diff
diff --git a/src/ui/main.ts b/src/ui/main.ts
index c5851fd..85ce85a 100644
--- a/src/ui/main.ts
+++ b/src/ui/main.ts
@@ -27,7 +27,7 @@ import { payrollRunwayDay } from '../engine/previews';
 import { workloadSummary } from '../engine/capacity';
 import { scheduleBlock, scheduleKeys } from './schedule';
 import { FOCUS_FALLBACK_SELECTORS, focusFallbackIds, FIXED_REGION_SELECTOR } from './focus';
-import { MAP_ATTRIBUTION, mapLegend, renderWorldMap, MapMeasurementMemory, mapPresentation, readMapScroll, mapScrollPosition, mapRedrawDecision, type MapMode } from './map';
+import { MAP_ATTRIBUTION, mapLegend, renderWorldMap, MapMeasurementMemory, mapPresentation, readMapScroll, mapScrollPosition, mapRedrawDecision, type MapMode, type MapMark, mapMarks, nearestMarks } from './map';
 
 declare const __BUILD_ID__: string | undefined;
 const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';
@@ -67,11 +67,14 @@ let lastColumn: 'main' | 'side' | null = null;
 /** 동료를 카드로 골랐으면 상세를 그 카드 바로 아래에 둔다. 운영표 줄로 골랐으면 운영표 아래. */
 let detailUnder: 'card' | 'roster' = 'card';
 /** Esc로 닫는 칸. 안쪽 칸이 앞이다(기록장은 현지 패널 안). */
-type LayerKey = 'book' | 'local' | 'interview' | 'detail';
-const LAYER_ORDER: LayerKey[] = ['book', 'local', 'interview', 'detail'];
+type LayerKey = 'book' | 'local' | 'interview' | 'detail' | 'map';
+const LAYER_ORDER: LayerKey[] = ['book', 'local', 'interview', 'detail', 'map'];
 /** 칸마다 마지막으로 열거나 그 안을 누르거나 초점을 둔 순번. */
-const layerTouched: Record<LayerKey, number> = { book: 0, local: 0, interview: 0, detail: 0 };
+const layerTouched: Record<LayerKey, number> = { book: 0, local: 0, interview: 0, detail: 0, map: 0 };
 let layerSeq = 0;
+/** D14 지도 상세: 고른 표시의 열쇠(예: 'hub:…'), 지도를 눌렀을 때 가까운 후보가 여럿이면 그 열쇠들. */
+let mapPick: string | null = null;
+let mapNear: string[] = [];
 
 /** 다시 그려도 배정·예약 자리가 줄어들어 다음 버튼이 움직이지 않게 한다. */
 function queuedStatus(slot: string, text: string): string {
@@ -143,6 +146,8 @@ function resetUi() {
   lastColumn = null;
   detailUnder = 'card';
   for (const key of LAYER_ORDER) layerTouched[key] = 0;
+  mapPick = null;
+  mapNear = [];
 }
 
 function newId(type: string): string {
@@ -370,7 +375,36 @@ function topbar(): string {
   </header>`;
 }
 
+/** D14: 지도 표시 전부를 덮는 고르기 목록. 지도 위 작은 휘장과 같은 일을 하는 44px 대상이다(WCAG 2.5.8 ‘같은 기능의 다른 컨트롤’). */
+function mapPicker(marks: MapMark[], picked: MapMark | undefined): string {
+  const groups = [...new Set(marks.map((m) => m.group))];
+  return `<label class="map-pick">지도에서 볼 곳 <select data-action="map-pick" id="map-pick">
+      <option value=""${picked ? '' : ' selected'}>고르세요</option>
+      ${groups.map((g) => `<optgroup label="${esc(g)}">${marks.filter((m) => m.group === g).map((m) => `<option value="${esc(m.key)}"${picked?.key === m.key ? ' selected' : ''}>${esc(m.nameKo)}</option>`).join('')}</optgroup>`).join('')}
+    </select></label>`;
+}
+
+/** D14: 지도 아래 읽기 전용 상세 칸. 지도를 눌렀는데 가까운 후보가 여럿이면 고를 단추를 보인다. */
+function mapDetail(marks: MapMark[], picked: MapMark | undefined): string {
+  const near = mapNear.map((key) => marks.find((m) => m.key === key)).filter((m): m is MapMark => Boolean(m));
+  if (near.length > 1) {
+    return `<div class="map-detail" id="map-detail">
+      <h3 id="map-detail-h" tabindex="-1">이 근처에 여러 곳이 있습니다</h3>
+      <div class="map-near">${near.map((m) => `<button data-action="map-near" data-mark="${esc(m.key)}">${esc(m.nameKo)} <small>${esc(m.group)}</small></button>`).join('')}</div>
+      <button data-action="map-close">닫기</button>
+    </div>`;
+  }
+  if (!picked) return '';
+  return `<div class="map-detail" id="map-detail">
+      <h3 id="map-detail-h" tabindex="-1">${esc(picked.nameKo)} <small>${esc(picked.group)}</small></h3>
+      <ul>${picked.lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
+      <button data-action="map-close">닫기</button>
+    </div>`;
+}
+
 function worldMap(): string {
+  const marks = mapMarks(view, config, mapMode);
+  const picked = marks.find((m) => m.key === mapPick);
   const moving = view.shipments.filter((x) => x.arrivalDay === null);
   const waiting = moving.filter((x) => portWaitStatus(view, config, x) === 'WAITING_RESTRICTION');
   const status = moving.length
@@ -388,10 +422,12 @@ function worldMap(): string {
         <button data-action="map-mode" data-mode="world" aria-pressed="${mapMode === 'world'}">전 세계</button>
       </div>
     </div>
-    <div data-map-frame ${mapPresentation(config, mapMode).attributes} class="map-frame ${mapPresentation(config, mapMode).world ? 'is-world' : ''}">${renderWorldMap(view, config, mapMode, { ...mapMeasurements.get(mapMode), baseOutsideSvg: MAP_BASE_OUTSIDE_SVG })}</div>
+    ${mapPicker(marks, picked)}
+    <div data-map-frame ${mapPresentation(config, mapMode).attributes} class="map-frame ${mapPresentation(config, mapMode).world ? 'is-world' : ''}">${renderWorldMap(view, config, mapMode, { ...mapMeasurements.get(mapMode), baseOutsideSvg: MAP_BASE_OUTSIDE_SVG, picked: picked?.key })}</div>
     ${mapPresentation(config, mapMode).hint}
+    ${mapDetail(marks, picked)}
     ${mapLegend()}
-    <p class="muted small">${esc(routeText)}. 항로선은 표시용이며 실제 항로 자료가 아닙니다. 세계 거점은 물동량·금융센터·해운 도시 순위로 골랐고, 2장(세계 확장)에서 열립니다. 거점에 마우스를 올리면 선정 근거가 보입니다. ${MAP_ATTRIBUTION}.</p>
+    <p class="muted small">${esc(routeText)}. 항로선은 표시용이며 실제 항로 자료가 아닙니다. 세계 거점은 물동량·금융센터·해운 도시 순위로 골랐고, 2장(세계 확장)에서 열립니다. 목록에서 고르거나 지도의 거점·해협·배를 누르면 지도 아래에 자세한 내용이 나옵니다. ${MAP_ATTRIBUTION}.</p>
   </section>`;
 }
 
@@ -949,6 +985,7 @@ function openLayers(): { key: LayerKey; within: string; opener: () => HTMLElemen
   if (iv && document.getElementById(`interview-${iv}`)) layers.push({ key: 'interview', within: `#interview-${iv}, [data-action="interview"][data-candidate="${iv}"]`, opener: () => app.querySelector<HTMLElement>(`[data-action="interview"][data-candidate="${iv}"]`) });
   const dt = ui.detailId;
   if (dt && dt === ui.selectedCard && document.getElementById(`growth-${dt}`)) layers.push({ key: 'detail', within: `#growth-${dt}, [data-action="detail"][data-emp="${dt}"]`, opener: () => app.querySelector<HTMLElement>(`[data-action="detail"][data-emp="${dt}"]`) });
+  if (document.getElementById('map-detail')) layers.push({ key: 'map', within: '#map-detail, #map-pick, [data-map-frame]', opener: () => document.getElementById('map-pick') });
   return layers;
 }
 /** 누르거나 초점을 둔 곳이 열린 칸 안이면 그 칸을 맨 위로 올린다. */
@@ -977,11 +1014,51 @@ function closeTopLayer(ev: KeyboardEvent) {
   if (top.key === 'book') ui.cultureBookOpen = false;
   if (top.key === 'interview') ui.interviewId = null;
   if (top.key === 'detail') ui.detailId = null;
+  if (top.key === 'map') { mapPick = null; mapNear = []; }
   render(true);
   revealOpener(top.opener() ?? document.getElementById('crew-h'));
   ignoreClicksUntil = Date.now() + 500;
 }
 
+/** D14: 고른 표시를 지도에서 강조하고 지도 아래 상세 칸을 띠 안으로 최소 거리만 가져온다. */
+function pickMapMark(key: string | null, focusHead = false) {
+  mapPick = key;
+  mapNear = [];
+  if (key) markOpened('map');
+  render(focusHead);
+  // 가로로 움직이는 세계지도에서 고른 표시가 틀 밖이면 틀 가운데로 가져온다.
+  const frame = app.querySelector<HTMLElement>('[data-map-frame]')!;
+  const dot = frame.querySelector('.picked [data-mark-dot], [data-mark-dot].picked');
+  if (dot) {
+    const f = frame.getBoundingClientRect(), r = dot.getBoundingClientRect();
+    if (r.left < f.left || r.right > f.right) frame.scrollLeft += (r.left + r.right) / 2 - (f.left + f.right) / 2;
+  }
+  if (focusHead) document.getElementById('map-detail-h')?.focus({ preventScroll: true });
+  liveStatus.textContent = liveRegionText(liveStatus.textContent ?? '', key ? `${document.getElementById('map-detail-h')?.textContent ?? ''}: 지도 아래에 자세한 내용` : '');
+  revealBelow(document.getElementById('map-detail'), document.getElementById('map-detail-h'));
+  ignoreClicksUntil = Date.now() + 500;
+}
+
+/** D14: 지도를 누르면 이름표를 눌렀으면 그 표시, 아니면 누른 점에서 22px 안의 표시를 고른다. 여럿이면 상세 칸에서 고르게 한다. */
+function tapMap(target: Element, x: number, y: number) {
+  const label = target.closest('.ribbon, .gate-label')?.closest<HTMLElement>('[data-mark]');
+  if (label) return pickMapMark(label.dataset.mark!);
+  const points = Array.from(app.querySelectorAll<Element>('[data-map-frame] [data-mark-dot]')).map((dot) => {
+    const r = dot.getBoundingClientRect();
+    return { key: dot.closest<HTMLElement>('[data-mark]')!.dataset.mark!, x: r.left + r.width / 2, y: r.top + r.height / 2 };
+  });
+  const near = nearestMarks(points, x, y);
+  if (near.length === 1) return pickMapMark(near[0]!);
+  if (near.length > 1) {
+    mapPick = null;
+    mapNear = near;
+    markOpened('map');
+    render();
+    revealBelow(document.getElementById('map-detail'), document.getElementById('map-detail-h'));
+    ignoreClicksUntil = Date.now() + 500;
+  }
+}
+
 function render(skipFocus = false, anchor: { slot: string; top: number } | null = null) {
   document.title = `Scitrade — ${config.titleKo}`;
   view = planState(state, config, ui.pending).state;
@@ -1038,7 +1115,7 @@ function render(skipFocus = false, anchor: { slot: string; top: number } | null
       frame.scrollLeft, frame.scrollWidth, frame.clientWidth, mapScrollRatio);
     mapMeasurements.remember(mapMode, width, dpr);
     if (decision.redraw) {
-      frame.innerHTML = renderWorldMap(view, config, mapMode, { ...measurement, baseOutsideSvg: MAP_BASE_OUTSIDE_SVG });
+      frame.innerHTML = renderWorldMap(view, config, mapMode, { ...measurement, baseOutsideSvg: MAP_BASE_OUTSIDE_SVG, picked: mapPick });
       frame.dataset.viewportKey = decision.key;
     }
     frame.dataset.measured = 'true';
@@ -1124,6 +1201,7 @@ function showCulturePreview(employeeId: string) {
 
 app.addEventListener('click', (ev) => {
   const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
+  if (!el && (ev.target as HTMLElement).closest('[data-map-frame]') && Date.now() >= ignoreClicksUntil) return tapMap(ev.target as Element, ev.clientX, ev.clientY);
   if (!el || (el as HTMLButtonElement).disabled || Date.now() < ignoreClicksUntil) return;
   activation = { element: el, pointer: ev.detail > 0 };
   const d = el.dataset;
@@ -1231,7 +1309,18 @@ app.addEventListener('click', (ev) => {
       }
       case 'map-mode':
         mapMode = d.mode === 'world' ? 'world' : 'route';
+        if (!mapMarks(view, config, mapMode).some((m) => m.key === mapPick)) mapPick = null;
+        mapNear = [];
         return render();
+      case 'map-near':
+        return pickMapMark(d.mark ?? null, true);
+      case 'map-close':
+        mapPick = null;
+        mapNear = [];
+        render(true);
+        revealOpener(document.getElementById('map-pick'));
+        ignoreClicksUntil = Date.now() + 500;
+        return;
       case 'select-card':
         detailUnder = el.tagName === 'ARTICLE' ? 'card' : 'roster';
         ui.selectedCard = d.emp ?? null;
@@ -1303,6 +1392,8 @@ app.addEventListener('change', async (ev) => {
     }
     startScenario(el.value as ScenarioId);
     render();
+  } else if (el.dataset.action === 'map-pick') {
+    pickMapMark(el.value || null);
   } else if (el.dataset.action === 'crew-role' || el.dataset.action === 'crew-attr') {
     if (el.dataset.action === 'crew-role') ui.crewRole = el.value || null;
     else ui.crewAttribute = el.value || null;
```

## 부록 C. `style.css`·`main-testkit.ts`·`lib.mjs`·`lib.test.mjs`·`map-detail.json` 시제품 diff

```diff
diff --git a/src/ui/main-testkit.ts b/src/ui/main-testkit.ts
index 9cfdd13..e3fbddd 100644
--- a/src/ui/main-testkit.ts
+++ b/src/ui/main-testkit.ts
@@ -26,7 +26,7 @@ export async function startUi(config?: ScenarioConfig) {
     set textContent(value:string) { announcements.push(value); } };
   let statusbarHeight = 100;
   let resizeStatus: (() => void) | undefined;
-  const bounds: Record<string,{top:number;bottom:number;height:number}> = {};
+  const bounds: Record<string,{top:number;bottom:number;height:number;left?:number;right?:number;width?:number}> = {};
   // 배정·예약 칸의 화면 위치. 다시 그린 뒤 위치는 afterRender에서 바꾼다.
   const slotTops: Record<string,number> = {};
   const slotRect = (slot:string) => { const top=slotTops[slot] ?? 180; return {top,bottom:top+88,height:88,width:260}; };
@@ -77,7 +77,9 @@ export async function startUi(config?: ScenarioConfig) {
   const PANEL_OF: Record<string,string> = { 'select-card':'crew','crew-filter':'crew','crew-role':'crew','crew-attr':'crew','detail':'crew','train':'crew',
     'scout':'crew','recruit-emp':'crew','recruit-quest':'crew','interview':'crew','hire':'crew','unqueue':'queue','schedule-toggle':'queue' };
   const OUTSIDE_LAYOUT = ['scenario','save','load','export','restart','end-day','queue-jump','skip-to','culture-result'];
-  const newFrame = () => ({ dataset:{} as Record<string,string>,innerHTML:'',scrollLeft:0,scrollWidth:2000,clientWidth:930,querySelector:()=>null });
+  const newFrame = () => ({ dataset:{} as Record<string,string>,innerHTML:'',scrollLeft:0,scrollWidth:2000,clientWidth:930,querySelector:()=>null,
+    // D14: 고른 표시를 틀 안으로 옮길 때 틀의 위치를 읽는다.
+    getBoundingClientRect:()=>({left:0,right:930,top:0,bottom:600,width:930,height:600}) });
   let frame = newFrame();
   const elements = () => [...html.matchAll(/<(button|article|tr|select)\b([^>]*\bdata-action="[^"]*"[^>]*)>/g)].map((match) => {
     const attrs = Object.fromEntries([...match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1]!, unescape(m[2]!)]));
@@ -136,7 +138,8 @@ export async function startUi(config?: ScenarioConfig) {
     querySelector:(selector:string)=>/^(\[data-action="[^"]+"\])(\[data-[a-z-]+="[^"]*"\])*$/.test(selector) && selector!=='[data-action="detail"]' && selector!=='[data-action="end-day"]' && selector!=='[data-action="culture-result"]' ? (()=>{const d=Object.fromEntries([...selector.matchAll(/\[data-([a-z-]+)="([^"]*)"\]/g)].map((m)=>[m[1]!.replace(/-([a-z])/g,(_x,c:string)=>c.toUpperCase()),m[2]!]));return elements().find((e)=>Object.entries(d).every(([k,v])=>e.dataset[k]===v)) ?? null;})()
       : /^#growth-[^ ]+ \.training h4$/.test(selector) ? (html.includes(`id="${selector.slice(1).split(' ')[0]}"`) ? {getBoundingClientRect:()=>bounds[`training-h-${selector.slice(8).split(' ')[0]}`] ?? rect()} : null)
       : selector==='.trade' ? (bounds.trade ? {getBoundingClientRect:()=>bounds.trade} : null) : selector==='.flash-toast' ? (html.includes('class="flash-toast') ? {getBoundingClientRect:()=>({top:toastTop,bottom:792,height:792-toastTop})} : null) : selector==='.statusbar' ? {getBoundingClientRect:()=>({top:0,bottom:statusbarHeight,height:statusbarHeight})} : selector === '[data-action="detail"]' && html.includes('data-action="detail"') ? Object.assign(rendered({action:'detail'}),{scrollIntoView:scroll}) : selector === '[data-action="end-day"]' ? rendered({action:'end-day'}) : selector==='[data-map-frame]' || (selector === '.map-frame.is-world' && html.includes('class="map-frame is-world"')) ? frame : null,
-    querySelectorAll:(selector:string)=>selector.startsWith('.crew h2,') ? sideAnchors() : selector==='[data-action-slot]' ? [...html.matchAll(/data-action-slot="([^"]+)"/g)].map((m)=>({dataset:{actionSlot:m[1]},getBoundingClientRect:()=>slotRect(m[1]!)}))
+    querySelectorAll:(selector:string)=>selector==='[data-map-frame] [data-mark-dot]' ? [...html.matchAll(/data-mark="([^"]+)"/g)].map((m)=>({getBoundingClientRect:()=>bounds[`mark:${m[1]}`] ?? {left:-1000,right:-990,top:-1000,bottom:-990,width:10,height:10},closest:()=>({dataset:{mark:m[1]}})}))
+      : selector.startsWith('.crew h2,') ? sideAnchors() : selector==='[data-action-slot]' ? [...html.matchAll(/data-action-slot="([^"]+)"/g)].map((m)=>({dataset:{actionSlot:m[1]},getBoundingClientRect:()=>slotRect(m[1]!)}))
       // 계약 카드 위치는 제목 위치를 따른다.
       : selector==='.contract' ? [...html.matchAll(/id="(contract-h-[^"]+)"/g)].map((m)=>({getBoundingClientRect:()=>{const h=bounds[m[1]!] ?? rect();return {top:h.top-10,bottom:h.top+290,height:300};},querySelector:(q:string)=>q==='h3[id]' ? doc.getElementById(m[1]!) : null}))
       : elements(),
@@ -161,6 +164,8 @@ export async function startUi(config?: ScenarioConfig) {
     clickNow, bounds,
     // 이미 다시 그려져 사라진 단추를 누르는 경우를 흉내 낸다(Claude 검수).
     clickTarget:(target:unknown,detail=0)=>listeners.click!({detail,target}),
+    // D14: 지도 틀 안의 점(x, y)을 누른다. label을 주면 그 표시의 이름표를 누른 것이다.
+    tapMap:(x:number,y:number,label?:string)=>{vi.advanceTimersByTime(501);return listeners.click!({detail:1,clientX:x,clientY:y,target:{closest:(selector:string)=>selector==='[data-action]' ? null : selector==='[data-map-frame]' ? {} : selector==='.ribbon, .gate-label' && label ? {closest:()=>({dataset:{mark:label}})} : null}});},
     resizeStatusbar:(height:number)=>{statusbarHeight=height;resizeStatus!();},
     change:(dataset:Record<string,string>,value:string)=>listeners.change!({target:{...rendered(dataset),value}}),
     importText:async(text:string)=>{const input=new Input(); input.files=[{text:async()=>text}]; await listeners.change!({target:input});},
diff --git a/src/ui/style.css b/src/ui/style.css
index b6920a4..956c85a 100644
--- a/src/ui/style.css
+++ b/src/ui/style.css
@@ -560,3 +560,13 @@ main.layout { padding-bottom: 5.5rem; }
 
 /* 머리 줄: 빌드 표시를 둘째 줄에 둬 표시 글 길이와 무관하게 1001~1100px에서도 저장·불러오기 묶음이 첫 줄에 남는다. */
 .brand .sub { max-width: 9.5rem; }
+
+/* D14 지도 상세(TASK-0035): 고르기 목록, 고른 표시의 고리, 지도 아래 상세 칸. */
+.map-pick { display: flex; align-items: center; gap: .5rem; margin: 0 0 .5rem; font-size: .9rem; }
+.map-pick select { min-width: 0; max-width: 100%; }
+.pick-ring { fill: none; stroke: var(--navy); }
+.map-detail { margin: .6rem 0; padding: .6rem .8rem; border: 2px solid var(--navy); border-radius: 8px; background: #fffdf7; }
+.map-detail h3 { margin: 0 0 .3rem; font-size: 1rem; }
+.map-detail ul { margin: 0 0 .5rem; padding-left: 1.2rem; }
+.map-near { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .5rem; }
+@media (any-pointer: coarse) { .map-pick select, .map-detail button { min-height: 44px; } }
diff --git a/tools/browser/lib.mjs b/tools/browser/lib.mjs
index c97f1c6..65387d6 100644
--- a/tools/browser/lib.mjs
+++ b/tools/browser/lib.mjs
@@ -62,7 +62,8 @@ export function validateScenario(obj) {
     if (['tap', 'select', 'scroll-to', 'remember'].includes(s.do) && (typeof s.selector !== 'string' || !s.selector)) error('선택자가 필요합니다');
     if (s.do === 'tap' && 'index' in s && (!Number.isInteger(s.index) || s.index < 0)) error('index는 0 이상 정수입니다');
     if (s.do === 'end-day' && 'times' in s && (!Number.isInteger(s.times) || s.times < 1)) error('times는 양의 정수입니다');
-    if (s.do === 'select' && typeof s.value !== 'string') error('value가 필요합니다');
+    if (s.do === 'select' && (typeof s.value === 'string') === ('index' in s)) error('value와 index 가운데 하나만 씁니다');
+    if (s.do === 'select' && 'index' in s && (!Number.isInteger(s.index) || s.index < 0)) error('index는 0 이상 정수입니다');
     if (s.do === 'scroll-to' && !Number.isFinite(s.offset_from_bar)) error('막대 기준 위치가 필요합니다');
     if (s.do === 'wait' && (!Number.isFinite(s.ms) || s.ms < 0)) error('대기 시간이 필요합니다');
     if (s.do === 'measure') {
@@ -139,7 +140,7 @@ async function step(page, s, scenario, profile, refs, values) {
   const selector = s.selector || scenario.end_day_selector;
   if (s.do === 'tap') await tap(page, s.selector, s.index ?? 0, profile.touch);
   else if (s.do === 'end-day') for (let i = 0; i < (s.times ?? 1); i++) await tap(page, selector, 0, profile.touch);
-  else if (s.do === 'select') { await page.selectOption(s.selector, s.value); await page.waitForTimeout(300); }
+  else if (s.do === 'select') { await page.selectOption(s.selector, 'index' in s ? { index: s.index } : s.value); await page.waitForTimeout(300); }
   else if (s.do === 'wait') await page.waitForTimeout(s.ms);
   else if (s.do === 'scroll-top') { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100); }
   else if (s.do === 'scroll-to') {
diff --git a/tools/browser/lib.test.mjs b/tools/browser/lib.test.mjs
index 506f008..1ddaea5 100644
--- a/tools/browser/lib.test.mjs
+++ b/tools/browser/lib.test.mjs
@@ -5,7 +5,7 @@ import path from 'node:path';
 import os from 'node:os';
 import { spawnSync } from 'node:child_process';
 import { REPO_ROOT, loadProfiles, selectProfiles, validateScenario, loadScenario, resolveDistPath, contentType, fontCacheKey, checkExpectations, isInside } from './lib.mjs';
-const names = ['smoke', 'day-anchor', 'culture-result-flow3', 'local-tab-position', 'report-contract-link', 'schedule-toggle', 'crew-facet', 'campaign-end', 'route-map-fit', 'queue-chip', 'card-detail', 'card-detail-low', 'interview-hire', 'side-anchor'];
+const names = ['smoke', 'day-anchor', 'culture-result-flow3', 'local-tab-position', 'report-contract-link', 'schedule-toggle', 'crew-facet', 'campaign-end', 'route-map-fit', 'queue-chip', 'card-detail', 'card-detail-low', 'interview-hire', 'side-anchor', 'map-detail'];
 const scenarioFile = name => path.join(REPO_ROOT, 'tools/browser/scenarios', `${name}.json`);
 const profiles = loadProfiles().profiles;
 
@@ -39,8 +39,12 @@ test('잘못된 단계와 기대를 거절한다', () => {
     [{ steps: [{ do: 'measure', name: 'v', what: 'unknown', selector: '#x' }] }, '모르는 측정'],
     [{ profiles: ['unknown'] }, '모르는 프로필'],
     [{ steps: [{ do: 'remember', name: 'v', selector: '#test' }, { do: 'measure', name: 'v', what: 'overflow-x' }] }, 'name이 중복됩니다'],
+    [{ steps: [{ do: 'select', selector: '#x' }] }, 'value와 index 가운데 하나만 씁니다'],
+    [{ steps: [{ do: 'select', selector: '#x', value: 'a', index: 1 }] }, 'value와 index 가운데 하나만 씁니다'],
+    [{ steps: [{ do: 'select', selector: '#x', index: -1 }] }, 'index는 0 이상 정수입니다'],
   ];
   assert.deepEqual(validateScenario({ ...base, expect: [], steps: [{ do: 'measure', name: 'ok1', what: 'overflow-x' }] }), []);
+  assert.deepEqual(validateScenario({ ...base, expect: [], steps: [{ do: 'select', selector: '#x', index: 1 }] }), []);
   for (const [change, message] of cases) {
     const errors = validateScenario({ ...base, expect: [], ...change });
     assert.ok(errors.some(e => e.includes(message)), `${message}: ${JSON.stringify(errors)}`);
diff --git a/tools/browser/scenarios/map-detail.json b/tools/browser/scenarios/map-detail.json
new file mode 100644
index 0000000..57059f7
--- /dev/null
+++ b/tools/browser/scenarios/map-detail.json
@@ -0,0 +1,269 @@
+{
+  "schema": "scitrade-browser-scenario/1",
+  "id": "map-detail",
+  "title_ko": "지도 상세: 고르기 목록과 지도 아래 상세 칸",
+  "source_ko": "TASK-0035(D14 가′)",
+  "profiles": "all",
+  "steps": [
+    {
+      "do": "scroll-to",
+      "selector": "#map-pick",
+      "offset_from_bar": 120
+    },
+    {
+      "do": "measure",
+      "name": "pick_h",
+      "what": "height",
+      "selector": "#map-pick"
+    },
+    {
+      "do": "select",
+      "selector": "#map-pick",
+      "index": 1
+    },
+    {
+      "do": "wait",
+      "ms": 350
+    },
+    {
+      "do": "measure",
+      "name": "detail_head_from_bar",
+      "what": "top-from-bar",
+      "selector": "#map-detail-h"
+    },
+    {
+      "do": "measure",
+      "name": "close_from_bar",
+      "what": "top-from-bar",
+      "selector": "#map-detail [data-action=\"map-close\"]"
+    },
+    {
+      "do": "measure",
+      "name": "close_h",
+      "what": "height",
+      "selector": "#map-detail [data-action=\"map-close\"]"
+    },
+    {
+      "do": "measure",
+      "name": "overflow_x",
+      "what": "overflow-x"
+    },
+    {
+      "do": "tap",
+      "selector": "[data-action=\"map-mode\"][data-mode=\"world\"]"
+    },
+    {
+      "do": "scroll-to",
+      "selector": "#map-pick",
+      "offset_from_bar": 120
+    },
+    {
+      "do": "select",
+      "selector": "#map-pick",
+      "index": 20
+    },
+    {
+      "do": "wait",
+      "ms": 350
+    },
+    {
+      "do": "measure",
+      "name": "world_head_from_bar",
+      "what": "top-from-bar",
+      "selector": "#map-detail-h"
+    },
+    {
+      "do": "measure",
+      "name": "world_close_from_bar",
+      "what": "top-from-bar",
+      "selector": "#map-detail [data-action=\"map-close\"]"
+    },
+    {
+      "do": "measure",
+      "name": "world_overflow_x",
+      "what": "overflow-x"
+    }
+  ],
+  "expect": [
+    {
+      "value": "pick_h",
+      "min": 44,
+      "max": 60,
+      "profiles": [
+        "cb1366t",
+        "ipadAirL",
+        "ipadminiL",
+        "ipadmini6L",
+        "t1000"
+      ],
+      "source_ko": "TASK-0035(터치 프로필 목록 높이 44px 이상)"
+    },
+    {
+      "value": "close_h",
+      "min": 44,
+      "max": 60,
+      "profiles": [
+        "cb1366t",
+        "ipadAirL",
+        "ipadminiL",
+        "ipadmini6L",
+        "t1000"
+      ],
+      "source_ko": "TASK-0035(터치 프로필 닫기 단추 44px 이상)"
+    },
+    {
+      "value": "detail_head_from_bar",
+      "min": 7,
+      "max": 900,
+      "profiles": "all",
+      "source_ko": "TASK-0035(상세 제목이 막대 아래)"
+    },
+    {
+      "value": "world_head_from_bar",
+      "min": 7,
+      "max": 900,
+      "profiles": "all",
+      "source_ko": "TASK-0035(상세 제목이 막대 아래)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 468.4,
+      "profiles": [
+        "l1366"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 455,
+      "profiles": [
+        "cb1366t"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 617.5,
+      "profiles": [
+        "ipadAirL"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 565.5,
+      "profiles": [
+        "ipadminiL"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 541.5,
+      "profiles": [
+        "ipadmini6L"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 780.4,
+      "profiles": [
+        "l1920"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "close_from_bar",
+      "min": 0,
+      "max": 497.5,
+      "profiles": [
+        "t1000"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 468.4,
+      "profiles": [
+        "l1366"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 455,
+      "profiles": [
+        "cb1366t"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 617.5,
+      "profiles": [
+        "ipadAirL"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 565.5,
+      "profiles": [
+        "ipadminiL"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 541.5,
+      "profiles": [
+        "ipadmini6L"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 780.4,
+      "profiles": [
+        "l1920"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "world_close_from_bar",
+      "min": 0,
+      "max": 497.5,
+      "profiles": [
+        "t1000"
+      ],
+      "source_ko": "TASK-0035(닫기 단추가 72px 알림 자리 위)"
+    },
+    {
+      "value": "overflow_x",
+      "min": 0,
+      "max": 0,
+      "profiles": "all",
+      "source_ko": "TASK-0035(가로 넘침 0)"
+    },
+    {
+      "value": "world_overflow_x",
+      "min": 0,
+      "max": 0,
+      "profiles": "all",
+      "source_ko": "TASK-0035(가로 넘침 0)"
+    }
+  ]
+}
```

## 부록 D. `src/ui/map-detail.test.ts` 전체

```ts
// TASK-0035: D14 지도 상세 — 고르기 목록·지도 누르기(가까운 후보)·지도 아래 읽기 전용 상세 칸.
import { afterEach, describe, expect, it, vi } from 'vitest';
import routes from '../../data/routes.json';
import { loadScenario } from '../content/scenario';
import { createGame, openDay } from '../engine/engine';
import { serializeSave } from '../engine/save';
import { runDays, standardDayOneCommands } from '../engine/testkit';
import type { GameState, ScenarioConfig } from '../engine/types';
import { startUi } from './main-testkit';
import { mapMarks, nearestMarks, renderWorldMap, type MapMode } from './map';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
type Ui = Awaited<ReturnType<typeof startUi>>;
const m1 = loadScenario('SCENARIO_M1_ONE_TRADE');
const m2 = loadScenario('SCENARIO_M2_MULTI_TRADE');
const day1 = (config: ScenarioConfig) => openDay(createGame(config), config).state;
/** 1일 기본 명령 뒤 6일: 배가 항로 위에 있다. */
const sailing = (config: ScenarioConfig) => openDay(runDays(createGame(config), config, 6, { 1: standardDayOneCommands(config) }).state, config).state;
const STATES: [string, ScenarioConfig, GameState][] = [['M1 1일', m1, day1(m1)], ['M1 6일 운항 중', m1, sailing(m1)], ['M2 1일', m2, day1(m2)]];
const MODES: MapMode[] = ['route', 'world'];
const keysIn = (html: string) => [...html.matchAll(/data-mark="([^"]+)"/g)].map((m) => m[1]!);
const optionKeys = (html: string) => [...html.match(/<select data-action="map-pick" id="map-pick">[\s\S]*?<\/select>/)![0].matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]!);
const pressEsc = (ui: Ui) => { const ev = { key: 'Escape', preventDefault: vi.fn() }; ui.fireDoc('keydown', ev); return ev; };
const schedule = (routes as unknown as { items: { id: string; schedule_basis?: { carrier_service_ko: string; checked_on: string; tolerance_days: number; note_ko: string } }[] }).items;

describe('지도 표시 목록(map.ts)', () => {
  it.each(STATES.flatMap(([name, config, state]) => MODES.map((mode) => [name, mode, config, state] as const)))('%s %s: 표시 열쇠는 그린 지도의 data-mark와 같은 집합이고 겹치지 않으며 표시마다 누를 점이 하나다', (_name, mode, config, state) => {
    const html = renderWorldMap(state, config, mode);
    const keys = mapMarks(state, config, mode).map((m) => m.key);
    expect([...keysIn(html)].sort()).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(keys.length);
    expect(html.match(/data-mark-dot/g)!.length).toBe(keys.length);
  });

  it('운항 중인 배도 표시 목록에 있다', () => {
    const [, config, state] = STATES[1]!;
    expect(mapMarks(state, config, 'route').filter((m) => m.key.startsWith('ship:')).length).toBeGreaterThan(0);
    expect(mapMarks(day1(m1), m1, 'route').filter((m) => m.key.startsWith('ship:'))).toEqual([]);
  });

  it('고른 표시 하나만 picked 이름과 고리를 갖고, 고르지 않으면 고리가 없다', () => {
    const [, config, state] = STATES[1]!;
    for (const mode of MODES) {
      expect(renderWorldMap(state, config, mode)).not.toContain('pick-ring');
      for (const mark of mapMarks(state, config, mode)) {
        const html = renderWorldMap(state, config, mode, { picked: mark.key });
        expect(html.match(/class="pick-ring"/g)!.length).toBe(1);
        expect([...html.matchAll(/class="[^"]* picked" data-mark="([^"]+)"/g)].map((m) => m[1])).toEqual([mark.key]);
      }
    }
  });

  it('상세 글에 실제 선사·서비스 이름과 노선 근거 메모를 쓰지 않는다', () => {
    const texts = STATES.flatMap(([, config, state]) => MODES.flatMap((mode) => mapMarks(state, config, mode).flatMap((m) => [m.nameKo, m.group, ...m.lines]))).join('\n');
    const bases = schedule.map((r) => r.schedule_basis).filter((b): b is NonNullable<typeof b> => Boolean(b));
    expect(bases.length).toBeGreaterThan(0);
    for (const basis of bases) {
      for (const word of basis.carrier_service_ko.split(/\s+/)) expect(texts).not.toContain(word);
      expect(texts).not.toContain(basis.note_ko);
    }
  });

  it('운항 근거가 있는 이번 시나리오 노선은 확인 날짜와 오차를 거점 상세에 적는다', () => {
    const marks = mapMarks(day1(m2), m2, 'route');
    for (const route of m2.routes) {
      const basis = schedule.find((r) => r.id === route.id)?.schedule_basis;
      if (!basis) continue;
      const line = `(선사 요일표로 확인 ${basis.checked_on}, 오차 ±${basis.tolerance_days}일. 게임은 요일 없이 단순화)`;
      expect(marks.find((m) => m.key === `hub:${route.fromCityId}`)!.lines.some((l) => l.startsWith(`${route.id} `) && l.endsWith(line))).toBe(true);
    }
  });

  it('가까운 표시는 반지름 22 안만, 가까운 순서로 돌려준다', () => {
    const pts = [{ key: 'a', x: 100, y: 100 }, { key: 'b', x: 110, y: 100 }, { key: 'c', x: 122, y: 100 }, { key: 'd', x: 122.1, y: 100 }];
    expect(nearestMarks(pts, 100, 100)).toEqual(['a', 'b', 'c']);
    expect(nearestMarks(pts, 109, 100)).toEqual(['b', 'a', 'c', 'd']);
    expect(nearestMarks(pts, 300, 300)).toEqual([]);
    expect(nearestMarks(pts, 100, 100, 5)).toEqual(['a']);
  });
});

describe('지도 고르기 화면(main.ts)', () => {
  it.each([['M1', m1], ['M2', m2]] as const)('%s: 목록은 보이는 지도의 표시를 빠짐없이 한 번씩 담고 처음 값은 ‘고르세요’다', async (_name, config) => {
    const ui = await startUi(config);
    for (const mode of MODES) {
      ui.click({ action: 'map-mode', mode });
      const options = optionKeys(ui.app.innerHTML);
      expect(options[0]).toBe('');
      expect(options.slice(1).sort()).toEqual(keysIn(ui.app.innerHTML).sort());
      expect(ui.app.innerHTML).toContain('<option value="" selected>고르세요</option>');
      expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    }
  });

  it('배가 운항 중이면 목록에 배 묶음이 있고 지도 표시와 같다', async () => {
    const ui = await startUi(m1);
    await ui.importText(serializeSave(sailing(m1)));
    const options = optionKeys(ui.app.innerHTML).slice(1);
    expect(options.some((k) => k.startsWith('ship:'))).toBe(true);
    expect(options.sort()).toEqual(keysIn(ui.app.innerHTML).sort());
    expect(ui.app.innerHTML).toContain('<optgroup label="운항 중인 배">');
  });

  it('목록 · 지도 틀 · 안내 · 상세 칸 · 범례 순서이고 안내 문구가 바뀌었다', async () => {
    const ui = await startUi(m2);
    const key = mapMarks(day1(m2), m2, 'route')[0]!.key;
    ui.change({ action: 'map-pick' }, key);
    const html = ui.app.innerHTML;
    const at = (s: string) => html.indexOf(s);
    expect(at('id="map-pick"')).toBeGreaterThan(0);
    expect(at('id="map-pick"')).toBeLessThan(at('data-map-frame'));
    expect(at('data-map-frame')).toBeLessThan(at('id="map-detail"'));
    expect(at('id="map-detail"')).toBeLessThan(at('class="map-legend"'));
    expect(html).toContain('목록에서 고르거나 지도의 거점·해협·배를 누르면 지도 아래에 자세한 내용이 나옵니다.');
    expect(html).not.toContain('마우스를 올리면');
  });

  it('목록에서 고르면 지도 고리·상세 칸·목록 값이 같은 표시이고 상세는 그 표시의 글을 모두 보인다', async () => {
    const ui = await startUi(m2);
    for (const mark of mapMarks(day1(m2), m2, 'route')) {
      ui.change({ action: 'map-pick' }, mark.key);
      const html = ui.app.innerHTML;
      expect(html).toContain(`<option value="${mark.key}" selected>`);
      expect(html).toMatch(new RegExp(`class="[^"]* picked" data-mark="${mark.key}"`));
      const detail = html.match(/<div class="map-detail" id="map-detail">[\s\S]*?<\/div>/)![0];
      expect(detail).toContain(`<h3 id="map-detail-h" tabindex="-1">${mark.nameKo} <small>${mark.group}</small></h3>`);
      expect(detail).toContain(`<ul>${mark.lines.map((l) => `<li>${l}</li>`).join('')}</ul>`);
      expect(detail).toContain('<button data-action="map-close">닫기</button>');
    }
  });

  it('Esc로 지도 상세를 닫고 목록으로 초점을 돌려주며 500ms 동안 누름을 막는다', async () => {
    const ui = await startUi(m2);
    ui.change({ action: 'map-pick' }, mapMarks(day1(m2), m2, 'route')[0]!.key);
    vi.advanceTimersByTime(501);
    const ev = pressEsc(ui);
    expect(ev.preventDefault).toHaveBeenCalledOnce();
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    expect(ui.app.innerHTML).toContain('<option value="" selected>고르세요</option>');
    expect(ui.focusIds.at(-1)).toBe('map-pick');
    vi.advanceTimersByTime(499); ui.clickNow({ action: 'map-mode', mode: 'world' });
    expect(ui.app.innerHTML).toContain('data-mode="world" aria-pressed="false"');
    const second = pressEsc(ui);
    expect(second.preventDefault).not.toHaveBeenCalled();
  });

  it('닫기 단추로 닫아도 목록으로 초점을 돌려준다', async () => {
    const ui = await startUi(m2);
    ui.change({ action: 'map-pick' }, mapMarks(day1(m2), m2, 'route')[0]!.key);
    ui.click({ action: 'map-close' });
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    expect(ui.focusIds.at(-1)).toBe('map-pick');
  });

  it('지도 범위를 바꿔도 고른 표시가 새 지도에 있으면 남고, 없으면 지운다', async () => {
    const ui = await startUi(m2);
    const route = mapMarks(day1(m2), m2, 'route').map((m) => m.key);
    const worldOnly = mapMarks(day1(m2), m2, 'world').find((m) => !route.includes(m.key))!.key;
    ui.change({ action: 'map-pick' }, route[0]!);
    ui.click({ action: 'map-mode', mode: 'world' });
    expect(ui.app.innerHTML).toContain(`<option value="${route[0]}" selected>`);
    ui.change({ action: 'map-pick' }, worldOnly);
    ui.click({ action: 'map-mode', mode: 'route' });
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    expect(ui.app.innerHTML).not.toContain('class="pick-ring"');
    // 다시 전 세계로 돌아가도 지운 표시가 되살아나지 않는다.
    ui.click({ action: 'map-mode', mode: 'world' });
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    expect(ui.app.innerHTML).toContain('<option value="" selected>고르세요</option>');
  });

  it('처음부터 뒤에는 고른 표시가 없다', async () => {
    const ui = await startUi(m2);
    ui.change({ action: 'map-pick' }, mapMarks(day1(m2), m2, 'route')[0]!.key);
    ui.click({ action: 'restart' });
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
  });

  it('지도를 누르면 22px 안의 표시가 하나면 고르고, 여럿이면 후보 단추를, 없으면 아무것도 하지 않는다', async () => {
    const ui = await startUi(m2);
    const [a, b] = mapMarks(day1(m2), m2, 'route').map((m) => m.key);
    ui.bounds[`mark:${a}`] = { left: 95, right: 105, top: 95, bottom: 105, width: 10, height: 10 };
    ui.bounds[`mark:${b}`] = { left: 125, right: 135, top: 95, bottom: 105, width: 10, height: 10 };
    ui.tapMap(300, 300);
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    ui.tapMap(100, 112);
    expect(ui.app.innerHTML).toContain(`<option value="${a}" selected>`);
    ui.tapMap(115, 100);
    expect(ui.app.innerHTML).toContain('<h3 id="map-detail-h" tabindex="-1">이 근처에 여러 곳이 있습니다</h3>');
    expect([...ui.app.innerHTML.matchAll(/data-action="map-near" data-mark="([^"]+)"/g)].map((m) => m[1])).toEqual([a, b]);
    expect(ui.app.innerHTML).not.toContain('class="pick-ring"');
    ui.click({ action: 'map-near', mark: b! });
    expect(ui.app.innerHTML).toContain(`<option value="${b}" selected>`);
    expect(ui.focusIds.at(-1)).toBe('map-detail-h');
  });

  it('이름표를 누르면 거리와 상관없이 그 표시를 고른다', async () => {
    const ui = await startUi(m2);
    const key = mapMarks(day1(m2), m2, 'route')[2]!.key;
    ui.tapMap(5000, 5000, key);
    expect(ui.app.innerHTML).toContain(`<option value="${key}" selected>`);
  });

  it('성장 상세를 연 뒤 지도에서 고르면 Esc는 지도 상세부터 닫는다', async () => {
    const ui = await startUi(m2);
    const first = m2.employees[0]!.id;
    ui.click({ action: 'select-card', emp: first });
    ui.click({ action: 'detail', emp: first });
    ui.change({ action: 'map-pick' }, mapMarks(day1(m2), m2, 'route')[0]!.key);
    vi.advanceTimersByTime(501);
    pressEsc(ui);
    expect(ui.app.innerHTML).not.toContain('id="map-detail"');
    expect(ui.app.innerHTML).toMatch(new RegExp(`data-action="detail" data-emp="${first}"[^>]*aria-expanded="true"`));
  });
});
```
