# TASK-0025 이번 항로 지도 폭 맞춤과 경로 지도 이름표 하한

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `eeb4f03`(글꼴 내장 D16 `7c4dd59`·`be4501e`·`eeb4f03`, 그 앞 `e4f7dfa` 자동 검사 D21) 위에 이 지시서를 올린 커밋이 `<BASE>`다. `<BASE>`에서 만든 `codex/TASK-0025`에서 작업한다.
  - `<BASE>`는 Claude가 지시서를 올릴 때 해시로 바꾼다. 자리표시가 그대로 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0025-route-map-fit.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - 지시서를 올린 커밋(`<BASE>`와 그 뒤의 다른 지시서 커밋)이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 diff에 나와도 이 작업의 변경으로 치지 않는다. 그 밖의 파일이 다르면 결과 보고에 적는다.
  - 모든 diff·검사 명령의 기준 커밋은 `<BASE>`다. 아래 줄 번호는 `e4f7dfa` 기준이다.
  - `e4f7dfa`→`eeb4f03`(글꼴 내장)에서 이 작업이 읽거나 고치는 파일 가운데 바뀐 것은 `tools/browser/lib.mjs` 177행 뒤(글꼴 판정, 4줄 늘어남)와 `tools/browser/README.md` 13·17행뿐이다. 그래서 `lib.mjs` 215·224~230·227행은 `<BASE>`에서 219·228~234·231행이다. 이 작업이 고치는 47·169행과 그 밖의 줄 번호는 같다(critic 확인).
- 병렬 작업 (같은 때 돈다. 그 파일을 건드리지 않는다)
  - TASK-0024(Sol, 배치 공통+A·Esc): `src/ui/main.ts`, `src/ui/style.css`, `src/ui/growth.ts`, `src/ui/main-testkit.ts`, `src/ui/main.test.ts`, 새 배치 측정 시나리오.
    - 새 시나리오를 `lib.test.mjs` 8행 `names`에 더하면 이 작업과 같은 줄이 겹친다. Sol은 끝에 `'route-map-fit'` 하나만 더한다. 겹침은 Claude가 합칠 때 둘 다 남겨 푼다.
  - TASK-0026(Sol, 청크 분할): `vite.config.ts`, `tools/ai/review_checks.sh`(검사 한 줄 더함), 새 `tools/bundle-size.mjs`·`tools/check_bundle_size.mjs`·`tools/check_bundle_size.test.mjs`.
    - `<BASE>`에 TASK-0026이 이미 들어 있으면 검사 묶음이 한 종 많고(수정 12종·확인 13종) 청크 크기가 다르다. 결과 보고에 그대로 적는다.
  - 글꼴 내장(D16)은 `eeb4f03`에 반영됐다(`index.html`, `public/fonts/`, `tools/fonts/`, `lib.mjs`·`README.md`의 글꼴 판정). 이 작업은 `lib.mjs`의 글꼴 판정 줄(`runProfile`)을 건드리지 않는다.
  - `src/ui/map.ts`는 이 작업만 고친다. 이 작업은 `vite.config.ts`를 고치지 않는다.
- 결정 근거:
  - `docs/DECISIONS.md`
    - 1014행: 알려진 문제. 평택→하이퐁 노선이 17.7°N까지 내려가 `availableWidth × dpr` 546~784 화면에서 지도가 1배로 작아지고 양옆에 빈 띠가 생긴다(이름표 6.6px). Claude 시안·측정 뒤 Sol이 고친다.
    - 545~547행: 지도 픽셀 상한 3 CSS px(R2). 대가로 아주 넓은 틀에서는 바다색 여백이 생긴다. 이 작업은 상한을 바꾸지 않는다.
    - 577행: 휴대폰에서 지도 이름표가 작다(경로 약 10px).
    - 1063행: 새 문장마다 반례 상태를 적고, 측정 시나리오는 지시서 작성 때 dry-run과 단계 시간을 확인한다.
    - 1087행 D14: 지도 상세(거점 버튼)는 이 수정 뒤 별도 작업이다.
    - 1098행: 3차 실행 순서의 ‘지도 축소 수정(TASK-0025)’.
  - `docs/art/PIXEL_SPEC.md` 125~135행 ‘화면 배율’: 129행 16:10 틀, 130행 남는 폭, 133행 이름표·휘장 비례와 946 상한. 반영 때 Claude가 고친다.
  - `docs/ai/WORKFLOW.md` 119~121행: 실제 배율로 잰다(배율 흉내 금지).
  - Claude 사전 작업(2026-10-10, 저장소 밖 작업 폴더라 찾지 않아도 된다). 결과는 아래 ‘사전 측정’에 옮겨 적었다.
    - 시안 넷을 Chromium 실제 배율로 쟀다: P1 여백 축소, P2 빈 띠가 생길 때 한 배율 위, P2b 5:4 고정, P3(P2 + 경로 지도 이름표 하한 11px).
    - 비판 검토가 P3의 문제 둘을 찾았다.
      1. 빈 띠가 몇 px뿐이어도 배율을 올려 지도가 크게 길어진다. 예: 1470×830@2(틀 559.78, 띠 13.78) 341→367.5, 줌 80%(689.61@0.8, 띠 7.11) 426.25→612.5, 2048×1050@1.25(875.06, 띠 1.47) 545.6→588.
      2. P3는 하한을 `mapLabelScale`에 걸어 나침반·휘장·배·폭풍·선 굵기까지 키웠다.
  - **Claude 결정(이 지시서):** P3에 16 CSS px 문턱을 단 ‘P3T’ 규칙, 이름표 하한 적용 범위는 ‘가’(이름표 글자와 리본 상자만).

## 목표

1. **빈 띠 규칙(P3T):** 경로 지도에서 16:10으로 고른 정수 배율 n이 양옆 빈 띠를 합 16 CSS px 이상 남기고 n이 상한 아래면, n+1을 시험한다. n+1에서는 세로를 항로에 필요한 높이(항로 상자 + 위아래 12 논리 px)로 늘린다. 세로는 지도 높이와 가로 폭을 넘지 않는다(정사각형까지). 안 되면 지금 계획 그대로다.
2. **이름표 하한(가):** 경로 지도의 거점 이름표 글자와 리본 상자만 화면 11 CSS px(글자 15 기준) 아래로 줄이지 않는다. 휘장·빛·나침반·배·폭풍·관문·항로선·경위선·경위도 글자는 지금 배율 그대로다. 세계지도는 바꾸지 않는다.
3. **측정 도구:** `tools/browser/lib.mjs`에 측정 종류 둘(`width`, `left-from-parent`)을 더한다. 빈 띠를 바로 잰다.
4. **측정 시나리오:** `tools/browser/scenarios/route-map-fit.json` 하나. 7개 프로필의 지도 폭·왼쪽 빈 띠·높이·가로 넘침.

**바꾸지 않는 것:**
- 세계지도 계획(`planMapViewport` 25~29행)과 세계지도 이름표.
- 16:10 기본 규칙과 n 계산(36~37행), 위아래·양옆 12 논리 px 여백(33·34행의 `+ 24`), 3 CSS px 상한(24행).
- 이름표 상한 946(`LABEL_CAP_FRAME_WIDTH`, 162행)과 `mapLabelScale`(169~171행).
- 측정 전 기본값 620 CSS px·dpr 1(`MapMeasurementMemory.get`, 148행). 이 값으로 나오는 계획은 바뀐다(구현 지시 3).
- 다시 그리기 키 형식(`mapViewportKey`, 198~201행), `main.ts`·`pixel.ts`의 측정·다시 그리기 연결.
- 학생이 읽는 지도 글: `aria-label`(361행), 범례(383~392행), 안내 문장(`mapPresentation` 158행), `<title>` 글. 새 문장을 쓰지 않는다.

## 사전 측정 (Claude)

- 기준: `e4f7dfa` 사본과 이 설계의 시제품 사본. 빌드 표시는 둘 다 `dev`로 맞췄다(DECISIONS 1065행 측정 비교 규칙).
- Chromium 141.0.7390.37, 실제 배율(`--force-device-scale-factor`, viewport null). 비판 검토의 휴대폰·MacBook 값은 배율 흉내(`deviceScaleFactor`)로 쟀다. 그 값은 크기 비교용이다.
- 사전 작업(accept26)은 `bacedfa`에서 쟀다. `git diff bacedfa e4f7dfa -- src tools index.html`는 비어 있다(Claude 확인). 그래서 그 값은 `e4f7dfa`에도 맞다.
- 글꼴 내장 뒤(`eeb4f03`, 글꼴은 빌드 폴더에서 `fonts.local`로 받음) 두 빌드로 `route-map-fit`을 다시 쟀다. 7개 프로필의 값 10개가 아래 표와 모두 같았다(critic 재측정). `src/`는 `e4f7dfa`와 같다.

| 화면(틀 폭@dpr) | 지금 `e4f7dfa` | 이 작업 뒤 | 근거 |
|---|---|---|---|
| 1024×768 터치(315.51@2) | 1배 273×170.5, 양옆 띠 42.5 | 2배 315×245, 띠 0.5 | 실측(route-map-fit) |
| 1133×744 터치(374.97@2) | 1배 273×170.5, 띠 102 | 2배 374×245, 띠 1.0 | 실측(route-map-fit) |
| 1180×820 터치(400.6@2) | 2배 400×250 | 그대로 | 실측(route-map-fit) |
| 1366×657 마우스·터치(503.06@1) | 1배 503×314 | 그대로 | 실측(route-map-fit) |
| 1920×969(805.25@1) | 2배 804×502 | 그대로 | 실측(route-map-fit) |
| 1000×700 한 열(920.61@2) | 4배 920×576 | 그대로 | 실측(route-map-fit) |
| 1512×860@2(582.7) | 2배 546×341, 띠 36.7 | 3배 582×367.5, 띠 0.7 | 실측(배율 흉내) |
| 1080×810@2(346.06) | 1배 273×170.5 | 2배 346×245 | 비판 검토 실측(P3T) |
| 375×667@2(314.22) | 1배 273×170.5 | 2배 314×245 | 실측(배율 흉내) |
| 1536×864@1.25(595.78) | 1배 436.8×272.8, 띠 159 | 2배 595.2×392 | 사전 작업 실측(P3, 같은 계획, 배율 흉내) |
| 1280×720@1.5(456.16) | 1배 364×227.33, 띠 92 | 2배 456×326.67 | 사전 작업 실측(P3, 같은 계획, 배율 흉내) |
| 2560×1271@1(1154.33) | 2배 1092×682, 띠 62.3 | 3배 1152×735 | 비판 검토 실측(P3T) |
| 1470×830@2(559.78) | 2배 546×341, 띠 13.78 | 그대로(문턱 아래) | 실측(배율 흉내) |
| 줌 80%(689.61@0.8) | 1배 682.5×426.25, 띠 7.11 | 그대로(문턱 아래) | 비판 검토 실측(P3T, 배율 흉내) |
| 2048×1050@1.25(875.06) | 2배 873.6×545.6, 띠 1.47 | 그대로 | 비판 검토 실측(P3T, 배율 흉내) |
| 측정 전 기본값(620@1) | 1배 546×341 | 2배 620×490 | 계산(시험이 고정) |
| 320×568@2(259.22) | 1배 259×162 | 그대로(이름표만 바뀜) | 실측(배율 흉내) |

**이름표 화면 크기(글자 15 리본):** 315.51@2 6.6→11, 374.97@2 6.6→11, 400.6@2 9.68→11, 314.22@2 6.6→11, 259.22@2 6.27→11, 503.06@1 12.17 그대로. 미리 보기 거점 리본(글자 12.5)은 하한에서 9.17이다. 경위도 글자는 그대로다(315.51@2 6.1, 259.22@2 5.01). Chromium으로 315.51@2·314.22@2·259.22@2를 쟀다.

**반례와 대가 (사실만 적는다):**
- 빈 띠가 다 없어지지는 않는다. 상한 아래에서도 16 CSS px 미만은 남는다(559.78@2에서 13.78). 상한 배율이면 더 남는다(1400@1.25에서 89.6, DECISIONS 547행의 대가).
- 한 배율 올린 계획은 세로를 늘린다. 1024×768은 170.5→245(+74.5), 1512×860@2는 +26.5, 2560@1은 +53이다. 지도 아래 칸이 그만큼 내려간다. 기존 시나리오 8개의 값은 ±0.1px 안에서 같았다(아래 ‘사전 측정 — 기존 시나리오’).
- 한 배율 올린 계획은 보기 영역을 항로 둘레로 좁힌다. 1장 예정 거점 하나(동북쪽)가 보기 영역 밖으로 나간다(보이는 거점 6→5). 1920×969·1000×700에서는 지금도 5곳이다.
- 하한 때문에 리본이 커져 자리가 모자라면 1장 예정 거점 리본이 빠진다. 이번 시나리오 거점(`active`) 리본은 빠지지 않는다(시험 10·12).
  - 빠지는 곳: 경로 지도, M2·M1, 폭 240~2000 CSS px(1 간격) × dpr 0.8·1·1.25·1.333·1.5·1.75·2·2.25·2.5·2.625·2.75·3·3.5·4 가운데 항로가 들어가는 점(폭 × dpr ≥ 392) 전수.
    - dpr 2·4는 폭 240~268, dpr 1.75·3.5는 271~302, dpr 2.25는 240~242에서 동북쪽 예정 거점 리본 하나. dpr 4는 같은 폭의 dpr 2와 보기 영역·이름표 배율이 같다(critic 전수 재확인).
    - dpr 2.5·2.625·2.75는 240~265·240~254·240~245에서 다른 예정 거점 리본 하나.
    - 그 밖의 폭·dpr에서는 0곳이다. `e4f7dfa`에서는 모든 점에서 0곳이다.
  - 320 CSS px 휴대폰(259.22@2)이 여기에 든다.
- 그린 항로선은 항로 상자보다 조금 바깥으로 휜다(Catmull-Rom). 늘린 세로의 아래 여백은 상자 기준 12 논리 px이지만 곡선 기준 10.56(Chromium `getBBox`), 조절점 기준 9.05다. 같은 여백은 지금도 16:10 폭이 392 논리 px일 때 생긴다(예: 784@0.5).
- 항만 사건 표시(폭풍)는 `SCENARIO_M1_DELAY_ACCEPTED`에만 있다(도착 항구, 7~8일). 경로 지도 전수(위와 같은 폭·dpr)에서 폭풍 원과 보기 영역 가장자리의 최소 여백은 6.21 논리 px다. `e4f7dfa`와 같고, 잘리는 계획은 0이다(Claude 계산).

### 사전 측정 — 기존 시나리오

- `smoke`·`day-anchor`·`culture-result-flow3`·`local-tab-position`·`report-contract-link`·`schedule-toggle`·`crew-facet`(7개 프로필), `campaign-end`(3개 프로필)를 두 빌드로 쟀다.
- 모두 기대 통과. 값 118개 가운데 다른 값은 1개다: `campaign-end` 1000×700 `settlement_from_bar` −0.1 → 0.

## 먼저 읽을 파일

- 지도 (`src/ui/map.ts`) — 이 작업이 고치는 파일
  - 17행 `MapViewport`.
  - `planMapViewport` 19~44행: 24행 상한 `cap`, 25~29행 세계지도, 30~34행 항로 상자와 필요 크기, 35~36행 `minimumL`, 37행 n, 38·39행 논리 폭·높이, 40~43행 가운데 맞춤.
  - `MapMeasurementMemory` 143~152행(148행 기본값).
  - 161~176행: `LABEL_CAP_FRAME_WIDTH`, `mapLabelScale`, `labelCapCssWidth`.
  - 191~215행: `mapRedrawDecision`, `mapViewportKey`, `worldMapViewport`.
  - `renderWorldMap` 217~380행: 227행 계획, 230행 `k`, 239·244행 경위도 글자, 252·255행 휘장·관문 자리 상자, 257행 보기 여백, 258~274행 `labelFor`(259·260행 리본 크기, 261행 간격, 262~269행 자리 후보), 277행 글자 크기, 285행 빛, 286행 휘장, 287·288행 리본, 292~301행 관문, 320행 배, 333행 폭풍, 346행 항로선, 351·352·372행 나침반, 366행 경위선.
- 연결 (읽기만 한다)
  - `src/ui/main.ts`: 49행 측정 기억, 120~127행 `resetUi`(124행 기억 지우기), 340행 지도 틀, 905~930행 측정·다시 그리기(917행 `applyPixelScale` 콜백).
  - `src/ui/pixel.ts`: 32~35행 다음 프레임 예약, 37~44행 틀 안쪽 폭, 46~52행 지도 다시 재기, 81~95행 감시 연결.
  - `src/ui/style.css` 232~240행: 지도 틀(테두리 3px, 안쪽 여백 없음, `overflow-x: auto`, 239행 가운데 맞춤).
- 시험
  - `src/ui/pixel.test.ts` 197~250행(보기 영역), 252~317행(재그리기 계약; 254~270행 기본값, 292~305행 렌더 배율), 320~398행(넓은 틀·이름표 상한; 352~363행 같은 키 같은 크기).
  - `src/ui/map-integration.test.ts` 8~42행 `start()`(32행 `click`, 39행 `changeScenario`, 40행 `measure`), 45~63행.
  - `src/engine/testkit.ts`: `runDays` 13행, `acceptAllFeasible` 50행.
- 측정 도구
  - `tools/browser/lib.mjs`: 47행 측정 종류, 48~87행 검증(68~73행 측정, 71행 선택자 또는 ref), 120~137행 `tap`(121행 560ms, 136행 80ms), 158~174행 측정(165행 요소 찾기, 167~171행 종류, 173행 0.1 반올림), 215행 확인 창 수락, 224~230행 단계당 15초 제한(`<BASE>`에서는 219행, 228~234행), 177행 뒤 `runProfile`의 글꼴 판정(읽기만).
  - `tools/browser/lib.test.mjs`: 8행 `names`, 16행 프로필 배율 1·2만, 69~90행 금지 문자열, 99~124행 dry-run.
  - `tools/browser/measure.mjs` 35~38행 dry-run, `tools/browser/profiles.json`(7개, 배율 1·2), `tools/browser/README.md` 15행.
- 위 ‘결정 근거’의 문서 줄.

## 범위

**포함 (이 순서로 한다)**
1. 빈 띠 규칙(구현 지시 1).
2. 이름표 하한(구현 지시 2).
3. 측정 전 기본값 확인(구현 지시 3, 코드 변경 없음).
4. 측정 종류 둘(구현 지시 4).
5. 측정 시나리오(구현 지시 5).
6. 시험과 결과 보고.

**제외**
- 세계지도, 지도 상세·거점 버튼(D14), 이름표 배치 순서·자리 후보, 경위도·관문 글자 크기.
- 3 CSS px 상한, 16:10 기본 규칙, 12 논리 px 여백, 946 상한, 측정 전 기본값 바꾸기.
- `main.ts`·`pixel.ts`·`style.css`의 지도 연결과 틀 모양.
- 문서: `docs/DECISIONS.md`, `docs/STATUS.md`, `docs/art/PIXEL_SPEC.md` 125~135행, `tools/browser/README.md` 15행(측정 종류 목록). 반영 때 Claude가 고친다.
- 브라우저 측정. Sol 샌드박스에서는 Chromium이 죽는다(`docs/ai/tasks/results/TASK-0012.md` 99~102행). 시나리오는 `--dry-run`만 한다. Claude가 잰다.

**시간이 모자라면 뺄 수 있음:** 없다. 이 작업은 작다. 모두 한다.

## 고칠 수 있는 파일

- `src/ui/map.ts`: 구현 지시 1·2의 줄만.
- 새 파일 `src/ui/map-fit.test.ts`.
- `src/ui/map-integration.test.ts`: 시험 하나를 더하기만 한다(132행 시험 앞).
- `tools/browser/lib.mjs`: 47행 목록과 측정 두 종류만. 글꼴 판정(`runProfile`) 줄은 그대로 둔다.
- `tools/browser/lib.test.mjs`: 8행 `names` 한 줄과 새 `test` 하나.
- 새 파일 `tools/browser/scenarios/route-map-fit.json`.
- `docs/ai/tasks/results/TASK-0025.md` (결과 보고).
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - TASK-0024 파일: `src/ui/main.ts`, `src/ui/style.css`, `src/ui/growth.ts`, `src/ui/main-testkit.ts`, `src/ui/main.test.ts`.
  - 글꼴 내장 파일: `index.html`, `public/**`, `tools/fonts/**`.
  - TASK-0026 파일: `vite.config.ts`, `tools/ai/**`, `tools/bundle-size.mjs`, `tools/check_bundle_size*.mjs`.
  - `package.json`, `package-lock.json`. 새 npm 의존성을 넣지 않는다.
  - `src/ui/pixel.ts`, `projection.ts`, `assets.ts`, 그 밖의 `src/ui/*.ts`.
  - `src/ui/pixel.test.ts`: Claude 시제품에서 고칠 단언이 없었다. 새 시험은 `map-fit.test.ts`에 둔다.
  - `src/engine/**`, `src/content/**`, `data/**`, `tests/**`, `schemas/**`, `scripts/**`.
  - `tools/browser/measure.mjs`, `profiles.json`, `README.md`, 기존 시나리오 8개.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/art/**`
  - `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `docs/ai/design/**`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `references/**`

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다.
- 정수 배율 원칙을 지킨다. 바탕의 논리 픽셀 하나는 정수 개의 기기 픽셀이다. n은 3 CSS px 상한(`cap`)을 넘지 않는다.
- 아래 구현 지시의 식을 그대로 쓴다. 특히 빈 띠는 `availableWidth - n * mapLW / dpr`로 계산한다. `cssWidth = n * logicalW / dpr`(43행)과 같은 순서의 부동소수 계산이라 시험의 `w - plan.cssWidth`와 같은 값이 된다. 기기 폭을 내림해 계산하지 않는다. 내림하면 소수 dpr(0.67·0.8·0.9·1.1·1.333)의 경계 폭 7곳에서 띠가 16 이상인데 올리지 않는다(변형 MB, 시험 5).
- 학생이 읽는 글을 새로 쓰거나 바꾸지 않는다. 바꿨다면 설계가 어긋난 것이다. 결과 보고 ‘화면 문구’ 절에 ‘없음’과 확인 명령 출력을 적는다(완료 조건 3).
- 기존 시험의 단언을 바꾸지 않는다(아래 ‘바꿔도 되는 기존 단언’). 기존 시험이 실패하면 원인을 찾고, 못 찾으면 보고한다.
- 새로 쓰는 시험 줄에 도시·견적·노선·사건·직원·계약·업무 ID와 도시 이름을 쓰지 않는다.
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `HAIPHONG`, `SHANGHAI`, `YOKOHAMA`, `OFFER_*`, `ROUTE01`, `EVI_*`, `EMP01`, `CT001`, `TASK001`, ‘평택’, ‘부산’, ‘하이퐁’, ‘상하이’, ‘요코하마’.
  - 값은 설정과 렌더 HTML에서 꺼낸다. 예: `cfg.routes[0]!.toCityId`, `<g class="port active">`의 상태 이름.
  - 시나리오 ID 상수(`'SCENARIO_M2_MULTI_TRADE'`, `SCENARIO_IDS`), 지도 자산 ID(`'MAP_EAST_ASIA'`), 이 지시서의 합성 ID(`SYNTH-WAIT`)는 써도 된다.
- 계획 값은 객체 전체를 `toEqual`로 단언한다. 일부 칸만 보는 단언으로 끝내지 않는다. 부동소수 값은 아래 표의 글자 그대로 쓴다(JS가 출력한 가장 짧은 표기다).
- 시험 환경을 피하려고 `?.` 선택 호출을 새로 넣지 않는다.
- **시험 제목과 인수 명세:** 사례 ID(`P0-…`, `P1-…`, `P2-…`, `CHAR-ACC-…`)가 든 기존 제목은 바꾸지 않는다. 새 시험 제목에 사례 ID를 넣지 않는다.
- 코드 주석은 한국어로, 짧은 문장으로 쓴다.
- 네트워크 조사는 하지 않는다.

## 구현 지시

### 1. 빈 띠 규칙 (`planMapViewport` 경로 지도, 30~43행)

- 17행 `MapViewport` 바로 뒤(19행 주석 앞)에 상수를 더한다.

  ```ts
  /** 경로 지도에서 받아들이는 양옆 빈 띠 합의 상한(CSS px). 이 이상이면 한 배율 위를 시험한다. */
  export const BLANK_BAND_LIMIT_CSS = 16;
  ```

- 37~39행을 아래로 바꾼다. 30~36행과 40~43행은 그대로다.

  ```ts
    const mapLW = Math.floor(map.w / unitsPerPixel), mapLH = Math.floor(map.h / unitsPerPixel);
    let n = Math.min(cap, Math.max(1, Math.floor(availableWidth * dpr / minimumL)));
    // 16:10 배율 n에서 양옆 빈 띠 합이 16 CSS px 이상이면 한 배율 위를 시험한다.
    // 그 배율에서 폭은 들어가고 세로만 모자라면 세로를 항로에 필요한 만큼만 늘린다(정사각형까지).
    let tallH = 0;
    if (n < cap && availableWidth - n * mapLW / dpr >= BLANK_BAND_LIMIT_CSS) {
      const nextW = Math.floor(availableWidth * dpr / (n + 1));
      if (nextW >= requiredW && requiredH <= Math.min(mapLH, nextW)) { n += 1; tallH = requiredH; }
    }
    const logicalW = Math.min(mapLW, Math.max(1, Math.floor(availableWidth * dpr / n)));
    const logicalH = Math.min(mapLH, Math.max(1, Math.round(logicalW * 10 / 16), tallH));
  ```

- 뜻:
  - `availableWidth - n * mapLW / dpr`는 (기기 폭 − n × 지도 그림 논리 폭) ÷ dpr, 곧 양옆 빈 띠 합(CSS px)이다. 지도 그림을 다 쓰지 않으면(`floor(기기 폭 ÷ n) < mapLW`) 음수라 올리지 않는다.
  - 올린 뒤 16:10 높이 `round(nextW × 10/16)`는 늘 `requiredH`보다 작다. 크거나 같으면 16:10 계산이 이미 n+1을 골랐다. 그래서 늘린 세로는 정확히 `requiredH`다(시험 5가 전수로 확인).
  - 올리지 못하는 경우: 다음 배율 폭이 항로 폭보다 좁다(`nextW < requiredW`), 세로가 가로보다 길어진다(`requiredH > nextW`), 세로가 지도보다 길다(`requiredH > mapLH`), 이미 상한이다(`n === cap`). 이때 16:10 계획 그대로이고 빈 띠가 남는다.
- 실제 시나리오 항로 상자는 모든 시나리오가 같다: 논리 px로 왼쪽 98·위 79·오른쪽 328·아래 300, `requiredW` 254, `requiredH` 245, `minimumL` 392(시험 1).

### 2. 이름표 하한 (가: 이름표 글자와 리본 상자만)

- `mapLabelScale`(169~171행) 바로 뒤에 더한다. `mapLabelScale`은 바꾸지 않는다(`pixel.test.ts` 292~363행이 그 식을 쓴다).

  ```ts
  /** 경로 지도 거점 이름표(글자 15)의 최소 화면 크기(CSS px). */
  export const LABEL_FLOOR_PX = 11;

  /** 거점 이름표 글자와 리본 상자의 배율. 경로 지도에서만 LABEL_FLOOR_PX 아래로 줄이지 않는다. 그 밖의 표시는 mapLabelScale을 쓴다. */
  export function mapRibbonScale(plan: MapViewport, world: boolean, capCssWidth = plan.cssWidth): number {
    const k = mapLabelScale(plan, world, capCssWidth);
    return world ? k : Math.max(k, LABEL_FLOOR_PX / 15 * plan.vb.w / plan.cssWidth);
  }
  ```

- `renderWorldMap` 230행을 세 줄로 바꾼다.

  ```ts
    const cap = labelCapCssWidth(config, mode, options.dpr ?? 1);
    const k = mapLabelScale(plan, world, cap);
    const kr = mapRibbonScale(plan, world, cap);
  ```

- `kr`은 아래 네 곳에만 쓴다. 그 밖의 `k`는 모두 그대로다.

  | 행 | 지금 | 바꾼 뒤 |
  |---|---|---|
  | 259 | `const w = (text.length * size + 22 * (size / 15)) * k;` | `… * kr;` |
  | 260 | `const h = (size + 9) * k;` | `const h = (size + 9) * kr;` |
  | 287 | 리본 `rect`의 `rx="${5 * k}"` | `rx="${5 * kr}"` |
  | 288 | 리본 `text`의 `font-size="${size * k}"` | `font-size="${size * kr}"` |

- `k` 그대로인 곳(바꾸지 않는다): 239·244행 경위도 글자와 위치, 252행 휘장 자리 상자, 255행 관문 자리 상자, 257행 보기 여백, 261행 간격 `13 * k`, 262~269행의 `4 * k`, 285행 빛, 286행 휘장, 294·299행 관문 글자(세계지도만), 298행 관문 표시, 320행 배, 333행 폭풍, 346행 항로선 굵기·점선, 351·352행 나침반 자리, 366행 경위선, 372행 나침반 크기.
  - 이유: 하한은 읽는 글자를 위한 것이다. 휘장·나침반이 커지면 작은 틀에서 지도를 더 가린다(비판 검토 2번).
  - 간격·띄움을 `k`로 두는 이유: 리본은 휘장 옆에 붙는다. 휘장 크기는 `k`다(시험 8의 리본 자리 확인).
- 세계지도에서는 `kr === k`라 결과가 지금과 같다.

### 3. 측정 전 기본값 (코드 변경 없음)

- `MapMeasurementMemory.get`의 기본값 620·1(148행)은 바꾸지 않는다. 이 값의 경로 지도 계획은 바뀐다.
  - `e4f7dfa`: `{ vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 }`.
  - 이 작업 뒤: `{ vb: { x: 116, y: 134, w: 620, h: 490 }, n: 2, cssWidth: 620, cssHeight: 490 }`(띠 74 ≥ 16).
- 첫 그리기와 기억을 지운 뒤(불러오기·가져오기·처음부터·시나리오 바꾸기)는 이 계획으로 그린다. 다음 애니메이션 프레임에 틀을 재고(`pixel.ts` 32~35·46~52행), 키가 다르면 지도만 다시 그린다(`main.ts` 917~925행).
- 다시 잰 뒤 계획이 맞는지는 시나리오의 ‘처음부터’ 단계 높이 기대(`map_h_restart`, 구현 지시 5)와 `map-integration` 시험(시험 13)이 본다. 띠 기대만으로는 못 잡는다(구현 지시 5의 반례).

### 4. 측정 종류 둘 (`tools/browser/lib.mjs`)

- 47행 목록 끝에 `'width'`, `'left-from-parent'`를 더한다.

  ```js
  const WHATS = ['top', 'height', 'top-from-bar', 'moved', 'scroll-y-change', 'overflow-x', 'bar-bottom', 'width', 'left-from-parent'];
  ```

- 169행(`height`) 뒤에 더한다. 다른 줄은 그대로다.

  ```js
        if (s.what === 'width') return r.width;
        if (s.what === 'left-from-parent') {
          // 부모 내용 상자(테두리·안쪽 여백 안쪽) 왼쪽 끝에서 요소 왼쪽 끝까지. 가운데 맞춘 지도의 왼쪽 빈 띠다.
          const p = el.parentElement;
          if (!p) throw new Error('부모 요소가 없습니다');
          return r.left - (p.getBoundingClientRect().left + p.clientLeft + parseFloat(getComputedStyle(p).paddingLeft || '0'));
        }
  ```

- 검증은 바꾸지 않는다. 71행이 두 종류에도 선택자 또는 ref를 요구한다. 값은 173행대로 0.1 단위로 반올림된다.
- 지도 틀의 왼쪽 테두리는 3px다(`style.css` 234행). `clientLeft`를 빼먹으면 모든 프로필에서 띠가 3.0~3.3으로 나온다(Claude 확인, 변형 L3).

### 5. 측정 시나리오 (`tools/browser/scenarios/route-map-fit.json`)

아래 JSON을 그대로 쓴다.

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "route-map-fit",
  "title_ko": "이번 항로 지도의 폭 맞춤과 빈 띠",
  "source_ko": "TASK-0025 구현 지시 5",
  "profiles": "all",
  "steps": [
    { "do": "wait", "ms": 400 },
    { "do": "measure", "name": "frame_w", "what": "width", "selector": "[data-map-frame]" },
    { "do": "measure", "name": "map_w", "what": "width", "selector": "[data-map-frame] > svg" },
    { "do": "measure", "name": "map_left_band", "what": "left-from-parent", "selector": "[data-map-frame] > svg" },
    { "do": "measure", "name": "map_h", "what": "height", "selector": "[data-map-frame] > svg" },
    { "do": "measure", "name": "overflow_x", "what": "overflow-x" },
    { "do": "end-day", "times": 1 },
    { "do": "wait", "ms": 400 },
    { "do": "measure", "name": "map_left_band_day2", "what": "left-from-parent", "selector": "[data-map-frame] > svg" },
    { "do": "measure", "name": "map_h_day2", "what": "height", "selector": "[data-map-frame] > svg" },
    { "do": "tap", "selector": "[data-action=\"restart\"]" },
    { "do": "wait", "ms": 400 },
    { "do": "measure", "name": "map_left_band_restart", "what": "left-from-parent", "selector": "[data-map-frame] > svg" },
    { "do": "measure", "name": "map_h_restart", "what": "height", "selector": "[data-map-frame] > svg" },
    { "do": "measure", "name": "overflow_x_restart", "what": "overflow-x" }
  ],
  "expect": [
    { "value": "map_left_band", "min": 0, "max": 1.5, "profiles": "all", "source_ko": "TASK-0025 구현 지시 5(지도 그림을 다 쓰지 않은 폭의 왼쪽 띠는 논리 픽셀 하나 미만)" },
    { "value": "map_left_band_day2", "min": 0, "max": 1.5, "profiles": "all", "source_ko": "TASK-0025 구현 지시 5(하루 진행 뒤 다시 그리기)" },
    { "value": "map_left_band_restart", "min": 0, "max": 1.5, "profiles": "all", "source_ko": "TASK-0025 구현 지시 5(측정 전 기본 계획 뒤 다시 잼)" },
    { "value": "overflow_x", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0025 구현 지시 5(가로 넘침 0)" },
    { "value": "overflow_x_restart", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0025 구현 지시 5(가로 넘침 0)" },
    { "value": "map_w", "min": 503, "max": 503, "profiles": ["l1366", "cb1366t"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_h", "min": 314, "max": 314, "profiles": ["l1366", "cb1366t"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_w", "min": 400, "max": 400, "profiles": ["ipadAirL"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_h", "min": 250, "max": 250, "profiles": ["ipadAirL"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_w", "min": 315, "max": 315, "profiles": ["ipadminiL"], "source_ko": "TASK-0025 측정표(HEAD 배치, 273 → 315)" },
    { "value": "map_w", "min": 374, "max": 374, "profiles": ["ipadmini6L"], "source_ko": "TASK-0025 측정표(HEAD 배치, 273 → 374)" },
    { "value": "map_h", "min": 245, "max": 245, "profiles": ["ipadminiL", "ipadmini6L"], "source_ko": "TASK-0025 측정표(HEAD 배치, 170.5 → 245)" },
    { "value": "map_w", "min": 804, "max": 804, "profiles": ["l1920"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_h", "min": 502, "max": 502, "profiles": ["l1920"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_w", "min": 920, "max": 920, "profiles": ["t1000"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_h", "min": 576, "max": 576, "profiles": ["t1000"], "source_ko": "TASK-0025 측정표(HEAD 배치, 그대로)" },
    { "value": "map_h_day2", "min": 314, "max": 314, "profiles": ["l1366", "cb1366t"], "source_ko": "TASK-0025 구현 지시 5(하루 진행 뒤 다시 그린 높이)" },
    { "value": "map_h_day2", "min": 250, "max": 250, "profiles": ["ipadAirL"], "source_ko": "TASK-0025 구현 지시 5(하루 진행 뒤 다시 그린 높이)" },
    { "value": "map_h_day2", "min": 245, "max": 245, "profiles": ["ipadminiL", "ipadmini6L"], "source_ko": "TASK-0025 구현 지시 5(하루 진행 뒤 다시 그린 높이)" },
    { "value": "map_h_day2", "min": 502, "max": 502, "profiles": ["l1920"], "source_ko": "TASK-0025 구현 지시 5(하루 진행 뒤 다시 그린 높이)" },
    { "value": "map_h_day2", "min": 576, "max": 576, "profiles": ["t1000"], "source_ko": "TASK-0025 구현 지시 5(하루 진행 뒤 다시 그린 높이)" },
    { "value": "map_h_restart", "min": 314, "max": 314, "profiles": ["l1366", "cb1366t"], "source_ko": "TASK-0025 구현 지시 5(처음부터 뒤 다시 잰 높이. 기본 계획 490이 남으면 실패)" },
    { "value": "map_h_restart", "min": 250, "max": 250, "profiles": ["ipadAirL"], "source_ko": "TASK-0025 구현 지시 5(처음부터 뒤 다시 잰 높이. 기본 계획 490이 남으면 실패)" },
    { "value": "map_h_restart", "min": 245, "max": 245, "profiles": ["ipadminiL", "ipadmini6L"], "source_ko": "TASK-0025 구현 지시 5(처음부터 뒤 다시 잰 높이. 기본 계획 490이 남으면 실패)" },
    { "value": "map_h_restart", "min": 502, "max": 502, "profiles": ["l1920"], "source_ko": "TASK-0025 구현 지시 5(처음부터 뒤 다시 잰 높이. 기본 계획 490이 남으면 실패)" },
    { "value": "map_h_restart", "min": 576, "max": 576, "profiles": ["t1000"], "source_ko": "TASK-0025 구현 지시 5(처음부터 뒤 다시 잰 높이. 기본 계획 490이 남으면 실패)" }
  ]
}
```

- 프로필은 `"all"`(7개)이다. 모두 정수 배율이다(`lib.test.mjs` 16행이 배율 1·2만 허용). 소수 배율(1.25·1.5·0.8 등)은 단위 시험이 지킨다(시험 2·3·5).
- `frame_w`는 기대 없이 기록만 한다. 틀 테두리 상자 폭이다. 틀 안쪽 폭 = `frame_w − 6`이다(테두리 3px 둘, 안쪽 여백 없음).
- 띠 기대 0~1.5의 뜻: 지도 그림을 다 쓰지 않으면 빈 띠 합은 논리 픽셀 하나(n/dpr CSS px) 미만이다. 왼쪽 띠는 그 절반이라 n/(2·dpr) ≤ 1.5다. HEAD 배치의 7개 프로필이 모두 여기에 든다. 규칙 자체의 상한(합 16 미만)보다 좁게 잡아 측정 실수(변형 L3)까지 잡는다.
- `map_w`·`map_h`·`map_h_day2`·`map_h_restart` 기대는 `e4f7dfa` 배치 기준이다(`eeb4f03`에서도 같다). TASK-0024가 먼저 반영돼 틀 폭이 바뀌면 이 기대가 깨질 수 있다. Sol은 위 값 그대로 쓴다. 합칠 때 Claude가 `frame_w`로 계획을 다시 계산해 고친다.
- ‘처음부터’ 단계는 확인 창을 띄운다. 측정 도구가 수락한다(`lib.mjs` 215행, `<BASE>` 219행). 측정 기억이 지워져 측정 전 기본 계획(620×490)으로 그린 뒤 다시 잰다.
- 하루 뒤·처음부터 뒤에도 높이(`map_h_day2`·`map_h_restart`)를 프로필마다 기대한다. 띠 기대만으로는 다시 재기가 빠진 것을 못 잡기 때문이다.
  - 반례(critic 측정, 처음부터만 쟀다): 처음부터 뒤 다시 그리기를 막은 빌드에서 지도가 620×490 그대로 남았다. 지도가 틀보다 넓어 틀 안에서 스크롤된다. 그래서 `map_left_band_restart`는 0, `overflow_x_restart`도 0이라 띠·넘침 기대는 통과했다. `map_h_restart`는 490이라 높이 기대만 실패했다(l1366·ipadminiL).
  - 하루 뒤 높이도 같은 이유로 둔다. 그 반례 빌드는 재지 않았다.
- 선택자는 화면 속성만 쓴다. 도시·견적·직원 ID가 없다(`lib.test.mjs` 69~90행이 검사).
- **Claude 확인(dry-run과 단계 시간):**
  - 시제품 `lib.mjs`로 `node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/route-map-fit.json --dry-run` → 종료 코드 0, `{"dry_run":true,"scenario":"route-map-fit","profiles":["l1366","cb1366t","ipadAirL","ipadminiL","ipadmini6L","l1920","t1000"],"steps":15}`.
  - `e4f7dfa`의 `lib.mjs`로 같은 명령 → 종료 코드 2, ‘2·3·4·9·13단계 measure: 모르는 측정’. 그래서 구현 지시 4가 먼저다.
  - 실제 실행 7개 프로필: 빌드마다 35~38초. 가장 긴 단계는 `tap`·`end-day` 한 번(대기 560ms + 80ms)과 `wait` 400ms다. 단계당 15초 제한(`lib.mjs` 227행, `<BASE>` 231행)보다 훨씬 짧다.

### 6. 결과 보고

아래 ‘결과 보고’ 형식으로 `docs/ai/tasks/results/TASK-0025.md`를 쓴다.

## 바꿔도 되는 기존 단언

없다.

- **Claude 확인:** `e4f7dfa` 사본에 구현 지시 1·2·4를 넣고 기존 시험을 돌렸다. `tsc` 통과, 32개 파일·973개 통과(할 일 1)로 모두 그대로였다. `lib.test.mjs` 10개도 그대로 통과했다(8행 `names`를 바꾸기 전).
- `map-integration.test.ts` 45~80행의 측정 폭 543·dpr 1.25는 이제 한 배율 위 계획(2배 542.4×392, vb 86·134·678·490)을 탄다. 기대를 `worldMapViewport`로 계산하므로 단언은 그대로 통과한다. `pixel.test.ts`의 543·1.25 시험(241~248·306~316행)도 같다.
- 기존 시험 파일에서 지울 수 있는 줄은 `lib.test.mjs` 8행(`names`) 하나뿐이다. 그 밖에는 더하기만 한다.

## 테스트

새 시험 파일은 `src/ui/map-fit.test.ts` 하나다. vitest 파일 수는 32 → 33개다. 시험 수는 973 → 1000개다(새 파일 26개 + `map-integration` 1개). Claude 시제품 코드는 ‘부록 A’에 있다. 값과 제목은 부록과 같아야 한다. 코드는 그대로 써도 된다.

### `map-fit.test.ts`

도우미(부록 A):
- `routeFit(config)`: 동아시아 지도 자산·항로 경유점·`project`로 계획 함수와 같은 항로 상자를 따로 계산한다.
- `portsOf(html)`: 렌더 HTML을 `<g class="port `로 잘라 거점마다 상태·휘장 위치·리본 여부를 돌려준다.
- `M2 = loadScenario('SCENARIO_M2_MULTI_TRADE')`, `M1 = loadScenario('SCENARIO_M1_ONE_TRADE')`.

`describe('이번 항로 지도 폭 맞춤')`

1. **`모든 시나리오의 항로 상자와 필요 크기`:** `BLANK_BAND_LIMIT_CSS`가 16. `SCENARIO_IDS` 모두 `routeFit` = `{ left: 98, top: 79, right: 328, bottom: 300, requiredW: 254, requiredH: 245, minimumL: 392 }`.
2. **`빈 띠가 16 CSS px 이상인 폭 %s·dpr %s는 한 배율 위에서 세로를 항로 높이까지 늘린다`** (`it.each`, M2·M1 모두 `toEqual`)

   | 폭 | dpr | 기대 계획 | `e4f7dfa` 계획(참고) |
   |---|---|---|---|
   | 582.7 | 2 | `{ vb: { x: 38, y: 134, w: 776, h: 490 }, n: 3, cssWidth: 582, cssHeight: 367.5 }` | 2배 546×341 |
   | 346.06 | 2 | `{ vb: { x: 80, y: 134, w: 692, h: 490 }, n: 2, cssWidth: 346, cssHeight: 245 }` | 1배 273×170.5 |
   | 314.22 | 2 | `{ vb: { x: 112, y: 134, w: 628, h: 490 }, n: 2, cssWidth: 314, cssHeight: 245 }` | 1배 273×170.5 |
   | 315.51 | 2 | `{ vb: { x: 110, y: 134, w: 630, h: 490 }, n: 2, cssWidth: 315, cssHeight: 245 }` | 1배 273×170.5 |
   | 374.97 | 2 | `{ vb: { x: 52, y: 134, w: 748, h: 490 }, n: 2, cssWidth: 374, cssHeight: 245 }` | 1배 273×170.5 |
   | 595.78 | 1.25 | `{ vb: { x: 54, y: 134, w: 744, h: 490 }, n: 2, cssWidth: 595.2, cssHeight: 392 }` | 1배 436.8×272.8 |
   | 456.16 | 1.5 | `{ vb: { x: 84, y: 134, w: 684, h: 490 }, n: 2, cssWidth: 456, cssHeight: 326.6666666666667 }` | 1배 364×227.33 |

3. **`빈 띠가 16 CSS px 미만이거나 상한 배율인 폭 %s·dpr %s는 16:10 계획 그대로다`** (`it.each`, M2·M1 모두. 값은 `e4f7dfa`와 같다)

   | 폭 | dpr | 기대 계획 | 그대로인 이유 |
   |---|---|---|---|
   | 559.78 | 2 | `{ vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 2, cssWidth: 546, cssHeight: 341 }` | 띠 13.78 |
   | 875.06 | 1.25 | `{ vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 2, cssWidth: 873.6, cssHeight: 545.6 }` | 띠 1.46 |
   | 689.61 | 0.8 | `{ vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 1, cssWidth: 682.5, cssHeight: 426.25 }` | 띠 7.11 |
   | 503.06 | 1 | `{ vb: { x: 0, y: 64, w: 1006, h: 628 }, n: 1, cssWidth: 503, cssHeight: 314 }` | 그림을 다 쓰지 않음 |
   | 400.6 | 2 | `{ vb: { x: 26, y: 128, w: 800, h: 500 }, n: 2, cssWidth: 400, cssHeight: 250 }` | 그림을 다 쓰지 않음 |
   | 805.25 | 1 | `{ vb: { x: 24, y: 128, w: 804, h: 502 }, n: 2, cssWidth: 804, cssHeight: 502 }` | 그림을 다 쓰지 않음 |
   | 920.61 | 2 | `{ vb: { x: 0, y: 90, w: 920, h: 576 }, n: 4, cssWidth: 920, cssHeight: 576 }` | 그림을 다 쓰지 않음 |
   | 1400 | 1.25 | `{ vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 3, cssWidth: 1310.4, cssHeight: 818.4 }` | 상한 3배, 띠 89.6이 남음 |

4. **`측정 전 기본값(620 CSS px·dpr 1)의 계획`:** `new MapMeasurementMemory().get('route')` = `{ availableWidth: 620, dpr: 1 }`. 그 경로 계획 = `{ vb: { x: 116, y: 134, w: 620, h: 490 }, n: 2, cssWidth: 620, cssHeight: 490 }`. 세계 계획 = `{ vb: { x: 0, y: 0, w: 3600, h: 1220 }, n: 1, cssWidth: 720, cssHeight: 244 }`(그대로).
5. **`전수 검사: 상한 아래 빈 띠 합은 16 CSS px 미만이고, 세로는 한 배율 올릴 때만 항로 높이까지 는다`** (제한 시간 60초)
   - M2·M1 × dpr `[0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.333, 1.5, 1.75, 2, 2.25, 2.5, 2.625, 2.75, 3, 3.5, 4]` × 폭 150~2000(0.5 간격).
   - 모든 점: `n ≤ cap`, `cssWidth ≤ 폭`. `n < cap`이면 `폭 − cssWidth < 16`.
   - `n16 = min(cap, max(1, floor(폭 × dpr ÷ 392)))`, `h16 = min(615, max(1, round(L × 10/16)))`(L = vb.w/2).
     - 세로가 `h16`이면 `n === n16`.
     - 아니면 `[H, n, h16 < 245, H ≤ L, 폭 − n16 × 546 ÷ dpr ≥ 16]` = `[245, n16 + 1, true, true, true]`.
   - `[점 수, 늘린 계획 수]` = `[140638, 12756]`. 시험 시간은 시제품에서 약 3초다.
6. **`합성 항로: 다음 배율의 폭이 항로보다 좁거나 세로가 정사각형을 넘으면 띠가 남아도 그대로다`** (`planMapViewport` 직접, 지도 `{ w: 1092, h: 1230 }`, 단위 2, 폭 600·dpr 1, 둘 다 띠 54가 남는다)
   - 항로 `{ x: 300, y: 400, w: 600, h: 80 }`(필요 폭 324 > 다음 폭 300) → `{ vb: { x: 0, y: 98, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 }`.
   - 항로 `{ x: 300, y: 300, w: 50, h: 600 }`(필요 높이 324 > 다음 폭 300) → `{ vb: { x: 0, y: 258, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 }`.
7. **`합성 항로: 빈 띠 16 CSS px에서 올리고 15.5 CSS px에서는 올리지 않는다`** (같은 지도, 항로 `{ x: 300, y: 300, w: 200, h: 420 }`, 필요 124×234, `minimumL` 374)
   - 폭 562·dpr 1(띠 16.0) → `{ vb: { x: 118, y: 276, w: 562, h: 468 }, n: 2, cssWidth: 562, cssHeight: 468 }`.
   - 폭 561.5·dpr 1(띠 15.5) → `{ vb: { x: 0, y: 168, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 }`.

`describe('경로 지도 이름표 하한')`

8. **`이름표 글자와 리본 상자만 11 CSS px 하한을 쓰고 휘장·나침반·배·사건·선은 그대로다`** (폭 315.51·dpr 2)
   - 상태: M2 복사본에 합성 항만 사건 `{ eventInstanceId: 'SYNTH-WAIT', templateId: 'SYNTH', cityId: cfg.routes[0]!.toCityId, announceDay: 1, startDay: 1, endDay: 1, forecastKo: '시험용 가상 공지' }`를 넣는다. 1일에 `acceptAllFeasible`로 수락하고 `runDays(…, 2, …)`로 2일까지 마감한다(배가 항로 위). `appliedEventIds`에 `'SYNTH-WAIT': true`를 더한다.
   - `LABEL_FLOOR_PX`가 11. `[15·k·css, 15·kr·css]` = `[15 * 315 / 620, 11]`(css = cssWidth ÷ vb.w).
   - HTML에 다음 글이 모두 있다: `font-size="${15*kr}"`, `font-size="${12.5*kr}"`, `rx="${5*kr}"`, `height="${24*kr}"`, `scale(${k})"><circle r="10" class="port-badge"`, `scale(${k*0.78})"><circle r="10" class="port-badge"`, `r="${15*k}" class="port-glow"`, `<circle r="${34*k}" class="compass-ring"/>`, `scale(${k*0.9})"><title>`(배), `scale(${k*0.8})">`(폭풍), `stroke-width="${7*k}"`, `stroke-width="${2.6*k}"`, `<g class="graticule" stroke-width="${0.8*k}">`, `font-size="${12*k}"`.
   - `font-size="${15*k}"`는 없다. 계획 n은 2.
   - 리본 자리: 리본이 있는 거점마다 리본 `rect`의 (x, y)가 `labelFor`의 여덟 자리 후보 중 하나와 1e-6 안에서 같다. 후보는 간격 `13*k`, 띄움 `4*k`, 리본 폭·높이는 `rect` 값으로 계산한다. 리본은 하나 이상이다.
9. **`하한보다 큰 이름표와 세계지도는 바꾸지 않는다`:** 920.61·dpr 2 경로 지도에서 `kr === k`. 930·dpr 1.5 세계지도에서 `kr === k`이고 HTML에 `font-size="${15*k}"`가 있다.
10. **`320 CSS px 휴대폰(폭 259.22·dpr 2)에서는 1장 예정 거점 이름표 하나가 빠지고 이번 시나리오 거점 이름표는 남는다`:** 보기 영역 안 거점의 `상태:리본` 목록(HTML 순서).
    - M2: `['active:이름표', 'active:이름표', 'active:이름표', 'planned:이름표', 'planned:없음', 'preview:이름표']`.
    - M1: `['active:이름표', 'active:이름표', 'planned:이름표', 'planned:이름표', 'planned:없음', 'preview:이름표']`.
    - `e4f7dfa`에서는 둘 다 ‘없음’이 없다(Claude 확인, 시험할 수 없어 표로만 적는다).
11. **`%s에서 같은 다시 그리기 키는 같은 이름표 글자 크기를 뜻한다`** (`it.each(['route', 'world'])`)
    - dpr `[1, 1.25, 1.5, 2, 3]` × 폭 240~1800(7 간격), M2.
    - `mapRedrawDecision`의 키 = `mapViewportKey(plan, dpr)`. 같은 키이면 `mapRibbonScale × cssWidth ÷ vb.w`가 10자리까지 같다.
    - 경로 지도는 `15 × 그 값 ≥ 11 − 1e-9`.
12. **`전수 검사: 이번 시나리오 거점 이름표는 빠지지 않고, 그린 항로선은 보기 영역 안쪽에 있다`** (제한 시간 60초)
    - M2·M1 × dpr `[1, 1.25, 1.5, 2, 2.5, 3]` × 폭 240~1600(2 간격). 폭 × dpr < 392(항로가 안 들어감)는 건너뛴다. 같은 키는 한 번만 그린다.
    - 보기 영역 안 `active` 거점은 모두 리본이 있다.
    - `route-line` 경로 `d`의 점(시작점·조절점·끝점)으로 만든 상자의 네 변 여백(논리 px)의 최솟값, 그 값에서 `route-under` 굵기의 절반(논리 px = 굵기 ÷ 4)을 뺀 값을 구한다. 베지어 곡선은 조절점 상자 안에 있다.
    - `[그린 키 수, round(최소 여백×100)/100, round(밑선 뺀 최소×100)/100]` = `[6422, 9.05, 6.83]`. 시험 시간은 시제품에서 약 2초다.

### `map-integration.test.ts` (132행 시험 앞에 하나 더하기)

13. **`빈 띠가 넓던 폭(315.51·dpr 2)을 재면 한 배율 위 계획으로 다시 그리고, 시나리오를 바꾸면 측정 전 기본 계획으로 돌아간다`**
    - `start()` 직후 `app.innerHTML`에 `width="620" height="490"`과 `data-map-viewport="2:620:490:116:134"`가 있다.
    - `ui.measure(315.51, 2)` 뒤 `frame().innerHTML`에 `width="315" height="245"`와 `data-map-viewport="2:630:490:110:134"`가 있고, `frame().dataset.viewportKey`가 `'2:630:490:110:134:2'`다.
    - `ui.click({action:'map-mode',mode:'route'})`로 다시 그리면 `app.innerHTML`에 `width="315" height="245"`가 있고 `dataset.measured`가 `'true'`다.
    - `ui.changeScenario()` 뒤 `app.innerHTML`에 `width="620" height="490"`이 있고 `dataset.measured`가 없다.
    - 직원 ID(`EMP01`)를 쓰는 기존 도우미 호출(`select-card`)을 새 시험에 쓰지 않는다. 다시 그리기는 지도 범위 단추로 한다.

### `tools/browser/lib.test.mjs`

14. 8행 `names` 끝에 `'route-map-fit'`를 더한다. 그래서 ‘묶음 시나리오 검증’(26~28행), ‘금지 이름·ID’(69~90행), ‘명령줄 dry-run’(99~124행)이 새 시나리오도 본다.
15. 새 시험 **`요소 폭과 부모 안 왼쪽 위치 측정`**(‘정적 경로의 상위 이동을 막는다’ 앞, 부록 B)
    - `smoke` 머리에 `expect: []`. 단계 `width`·`left-from-parent`(선택자), `remember` + `width`(ref)와 기대 `{ value: 'band', min: 0, max: 1.5 }` → `validateScenario` 결과 `[]`.
    - 두 종류 각각 선택자·ref 없이 → 결과가 정확히 `['1단계 measure: 선택자 또는 ref가 필요합니다']`.
    - node 시험 수는 10 → 11개다.

## 측정 시나리오 (Claude가 잰다)

- Codex는 dry-run만 한다(구현 지시 5). Claude가 아래를 잰다.
- 명령(두 빌드에 같은 명령, 빌드 표시를 같게):

  ```
  node tools/browser/measure.mjs --dist <빌드> --scenario tools/browser/scenarios/route-map-fit.json --offline-fonts --out <저장소 밖>/route-map-fit-<빌드>.json
  ```

  - `eeb4f03` 뒤 빌드는 글꼴을 빌드 폴더에서 받는다(`fonts.local`). 글꼴 캐시가 필요 없다. 글꼴 내장 전 빌드(`e4f7dfa` 등)와 비교할 때만 `--font-cache <저장소 밖 캐시>`를 붙인다(`tools/browser/README.md` 13행).

- **Claude 사전 측정(시제품, `e4f7dfa` 배치):**

  | 프로필 | frame_w | map_w | map_left_band | map_h | overflow_x | 하루 뒤·처음부터 뒤 | `e4f7dfa` |
  |---|---|---|---|---|---|---|---|
  | l1366 | 509.1 | 503 | 0 | 314 | 0 | 같음 | 같음 |
  | cb1366t | 509.1 | 503 | 0 | 314 | 0 | 같음 | 같음 |
  | ipadAirL | 406.6 | 400 | 0.3 | 250 | 0 | 같음 | 같음 |
  | ipadminiL | 321.5 | 315 | 0.3 | 245 | 0 | 같음 | 273, 21.3, 170.5 (기대 실패) |
  | ipadmini6L | 381 | 374 | 0.5 | 245 | 0 | 같음 | 273, 51, 170.5 (기대 실패) |
  | l1920 | 811.3 | 804 | 0.6 | 502 | 0 | 같음 | 같음 |
  | t1000 | 926.6 | 920 | 0.3 | 576 | 0 | 같음 | 같음 |

  - 시제품 `ok: true`. `e4f7dfa` 빌드는 ipadminiL·ipadmini6L에서 띠 6건(2개 프로필 × 3번)과 폭·높이 8건(`map_w`·`map_h`·`map_h_day2`·`map_h_restart` × 2)이 실패한다. 시나리오가 고치기 전 상태를 잡는다.
  - `eeb4f03` 기반 두 빌드로 다시 재도 표와 같다. 실패도 같은 14건이다(critic).
  - 교차 확인: `map_left_band` = (`frame_w` − 6 − `map_w`) ÷ 2 ± 0.1. 7개 프로필 모두 맞았다.
- Claude가 검수 때 더 잴 것:
  - 기존 시나리오 8개를 두 빌드로 재서 값이 ±1px 안에서 같다(사전 측정: 118개 중 1개만 −0.1→0).
  - 소수 배율과 휴대폰은 사전 측정표의 방식(배율 흉내는 크기 비교만)으로 315.51@2·259.22@2·582.7@2의 리본 11px, 미리 보기 9.17px, 경위도 글자 그대로를 다시 확인한다.
  - TASK-0024와 합친 뒤 `frame_w`가 바뀌면 `planMapViewport`로 `map_w`·`map_h`·`map_h_day2`·`map_h_restart` 기대를 다시 계산해 고친다.
  - 변형 L4(Claude만, `main.ts`는 TASK-0024 파일): 처음부터 뒤 다시 그리기를 막은 빌드에서 `map_h_restart` 기대가 실패하는지 본다(critic 확인: l1366·ipadminiL에서 490으로 실패).

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 문턱 16은 어디서 왔나 | Claude 결정. 1470×830@2의 13.78px 띠는 남기고(+26.5px 세로를 피함), 1512×860@2의 36.7px 띠는 없앤다. 16은 상수 하나(`BLANK_BAND_LIMIT_CSS`)로 둔다 |
| 띠를 `(floor(기기 폭) − n·mapLW)/dpr`로 계산할까 | 하지 않는다. `availableWidth - n * mapLW / dpr`. 내림하면 426@1.333은 띠 16.40인데 15.75로 계산해 올리지 않는다(변형 MB) |
| n+2까지 시험할까 | 하지 않는다. 한 배율만. 띠가 16 이상일 때 n+1의 다음 폭은 늘 항로 폭 254보다 넓다(n=1: (546+16·dpr)/2 ≥ 273) |
| 세로를 16:10보다 늘린 뒤 가운데를 어디에 | 지금 식(41·42행) 그대로. 늘린 세로가 항로 높이와 같아 위아래 여백이 12 논리 px씩이다 |
| 측정 전 기본값을 546 등으로 바꿔 첫 그림을 1배로 둘까 | 바꾸지 않는다. 기존 시험 3건이 620·1을 단언한다(변형 ML). 다음 프레임에 다시 잰다 |
| 경위도 글자(12)에도 하한을 걸까 | 걸지 않는다(가). ‘이름표’는 거점 리본이다. 경위도는 보조 표시다(변형 MK) |
| 관문 이름표에도 하한을 걸까 | 해당 없음. 관문 글자는 세계지도에만 있다(294행). 세계지도는 `kr === k` |
| 미리 보기 거점 리본(글자 12.5)도 11로 맞출까 | 맞추지 않는다. 같은 `kr`로 비례해 9.17px다. 15 대 12.5 차이로 상태를 구별한다 |
| 리본 간격 13·띄움 4도 `kr`로 | 하지 않는다. 휘장 크기를 따르는 `k`다(변형 MJ) |
| 하한으로 예정 거점 리본이 빠진다 | 받아들인다. 배치 우선순위(이번 시나리오 → 예정 → 미리 보기, 248~251행)는 그대로다. 시험 10·12가 그 사실을 고정한다 |
| 늘린 계획에서 예정 거점 하나가 보기 영역 밖으로 나간다 | 받아들인다. 1920×969·1000×700에서도 지금 그렇다 |
| `mapLabelScale`에 하한을 넣을까(P3 방식) | 넣지 않는다. 휘장·나침반·배·폭풍·선이 커진다(변형 MG) |
| 다시 그리기 키에 하한을 넣을까 | 넣지 않는다. 하한은 보기 영역·배율·dpr로 정해진다(시험 11) |
| 시나리오에 소수 배율 프로필을 더할까 | 더하지 않는다. `profiles.json`은 손대지 않는 파일이고 `lib.test.mjs` 16행이 배율 1·2만 허용한다. 소수 배율은 시험 2·3·5가 지킨다 |
| 측정 종류를 하나(`band`)로 만들까 | 만들지 않는다. `width`·`left-from-parent` 둘. 다른 시나리오에도 쓸 수 있게 일반 이름으로 둔다 |
| `left-from-parent`에서 스크롤을 고려할까 | 하지 않는다. 경로 지도는 틀보다 넓지 않아 틀이 스크롤되지 않는다. 세계지도에 쓰면 값이 스크롤에 따라 바뀐다. 결과 보고에 적지 않아도 된다 |
| `map_w`·`map_h`·`map_h_day2`·`map_h_restart` 기대가 TASK-0024 반영 뒤 깨진다 | Sol은 위 JSON 값 그대로 쓴다. Claude가 합칠 때 고친다 |
| 하루 뒤·처음부터 뒤 높이 기대가 왜 필요한가 | 띠 기대만으로는 다시 재기가 빠진 것을 못 잡는다. 지도가 620×490 그대로 남으면 틀 안에서 스크롤되어 띠가 0이다(구현 지시 5의 반례) |
| 새 시험이 느리다 | 전수 시험 둘에 제한 시간 60초를 단다. 시제품에서 약 3초·2초 |
| `pixel.test.ts`에 시험을 더할까 | 더하지 않는다. 새 시험은 `map-fit.test.ts`에 모은다 |
| 문서(PIXEL_SPEC·DECISIONS·STATUS·README)를 고칠까 | 고치지 않는다. Claude가 반영 때 고친다. 결과 보고 ‘문서 반영 문안’에 PIXEL_SPEC 129·130·133행과 README 15행에 넣을 문장을 짧게 적어도 된다 |
| 목록 밖 기존 시험이 실패한다 | 기대값을 고치지 않는다. 원인을 찾고, 못 찾으면 보고한다 |

## 완료 조건

1. 구현 지시 1~6이 반영되었다.
2. **검증**
   - 시작 전에 `npx vitest run`, `python3 tools/validate_data.py`, `node --test tools/browser/lib.test.mjs`를 한 번 돌려 기준 값을 적는다.
     - Claude 확인값(`eeb4f03`): 32개 파일·973개 통과(할 일 1), 자료 검사 25,803건(`e4f7dfa`는 25,799건), node 시험 10개. 지시서 커밋이 MANIFEST에 파일을 더하면 하나마다 2건씩 많다. 시작 값은 직접 잰 값을 쓴다.
   - 끝내기 전에 결과 보고 파일을 먼저 만든 뒤 아래를 순서대로 실행한다.
     ```
     bash tools/ai/review_checks.sh <BASE>
     bash tools/ai/review_checks.sh --check <BASE>
     ```
     - 수정 모드 11종, 확인 모드 12종이 모두 통과해야 한다(`<BASE>`에 TASK-0026이 있으면 12·13종). critic이 `eeb4f03` 사본에 이 지시서대로 넣어 두 모드 모두 통과를 확인했다.
     - vitest 33개 파일·1000개 통과(할 일 1).
     - 자료 검사 PASS, 시작 값 + 4건(새 시나리오 1개 + 결과 보고 1개가 MANIFEST에 든다. `src/`는 MANIFEST에 없다. critic: `eeb4f03` 사본에서 25,803 → 25,807). 다르면 새로 든 파일 목록을 보고에 적는다.
     - 파이썬 시험: 그림 도구 21개, 지도 21개(3개 건너뜀), 자료 검사기 74개, 사실 섞임 20개 그대로. 사실 섞임 검사 PASS. node 시험 11개 통과.
     - 빌드 JS 청크 크기를 적는다(시제품 529.89 kB, `eeb4f03` 529.65 kB. 빌드 표시 글 길이에 따라 0.01 kB 다를 수 있다). 500kB 경고는 실패가 아니다(청크 분할은 TASK-0026).
   - `node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/route-map-fit.json --dry-run`이 종료 코드 0이고 출력의 `profiles`가 7개, `steps`가 15다.
3. **바꾼 범위 확인** (출력을 결과 보고에 붙인다)
   - `git diff --name-only <BASE>`와 `git status --short --untracked-files=all`의 파일이 모두 ‘고칠 수 있는 파일’ 안에 있다.
   - 다음 출력이 비어 있다:
     ```
     git diff <BASE> -- src/engine src/content data tests schemas scripts vite.config.ts index.html public package.json package-lock.json src/ui/main.ts src/ui/style.css src/ui/growth.ts src/ui/main-testkit.ts src/ui/main.test.ts src/ui/pixel.ts src/ui/pixel.test.ts src/ui/projection.ts src/ui/assets.ts tools/browser/measure.mjs tools/browser/profiles.json tools/browser/README.md tools/fonts tools/ai docs/art
     git diff <BASE> -- tools/browser/scenarios ':!tools/browser/scenarios/route-map-fit.json'
     ```
   - `map.ts`에서 지운 줄은 8줄뿐이다(37·38·39·230·259·260·287·288행):
     ```
     git diff <BASE> -- src/ui/map.ts | grep '^-[^-]'
     ```
   - 기존 시험·도구 파일에서 지운 줄은 2줄뿐이다(`lib.mjs` 47행 `WHATS`, `lib.test.mjs` 8행 `names`):
     ```
     git diff <BASE> -- src/ui/map-integration.test.ts tools/browser/lib.test.mjs tools/browser/lib.mjs | grep '^-[^-]'
     ```
   - 화면 문구: `map.ts`에 더한 줄 가운데 주석이 아닌 줄에 한글이 없다(결과 0):
     ```
     git diff <BASE> -- src/ui/map.ts | grep '^+' | grep -vE '^\+\s*(//|/\*\*|\*)' | LC_ALL=C.utf8 grep -cP '[\x{AC00}-\x{D7A3}]'
     ```
     - 시제품에서 0이었다(한글이 든 더한 줄 5개는 모두 주석).
   - 새 시험 줄·새 시나리오에 금지 문자열이 없다(결과 0건):
     ```
     { git diff <BASE> -- src/ui/map-integration.test.ts tools/browser/lib.test.mjs | grep '^+'; cat src/ui/map-fit.test.ts; } | grep -nE "PYEONGTAEK|BUSAN|SHANGHAI|HAIPHONG|YOKOHAMA|SINGAPORE|JAKARTA|HONG_KONG|OFFER_|EVI_|ROUTE[0-9]|EMP[0-9]|CT[0-9]{3}|TASK[0-9]{3}|VEN_|CA0[0-9]|평택|부산|상하이|하이퐁|요코하마|싱가포르|자카르타|홍콩"
     grep -nE "PYEONGTAEK|BUSAN|OFFER_|EMP[0-9]|CT[0-9]{3}|ROUTE[0-9]|평택|부산|하이퐁|상하이|요코하마|홍콩" tools/browser/scenarios/route-map-fit.json
     ```
4. **변형 시험.** 아래를 하나씩 넣고 `npx vitest run src/ui/map-fit.test.ts src/ui/pixel.test.ts src/ui/map-integration.test.ts`(L은 `node --test tools/browser/lib.test.mjs`)에서 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다. git으로 되돌리거나 stash하지 않는다. 아래 ‘실패해야 하는 시험’은 Claude 시제품에서 실제로 실패한 목록이다(번호는 위 ‘테스트’ 번호).

   | 변형 | 바꾸는 곳 | 실패해야 하는 시험 |
   |---|---|---|
   | MA 문턱 0(P3) | `>= BLANK_BAND_LIMIT_CSS` → `> 0` | 3(559.78·875.06·689.61), 5, 7, 12 |
   | MB 기기 폭 내림 | 띠 식 → `(Math.floor(availableWidth * dpr) - n * mapLW) / dpr >= …` | 5 |
   | MC 세로 늘림 빠짐 | `logicalH`의 `, tallH` 지움 | 2(7건 모두), 4, 5, 7, 12, 13 |
   | MD 정사각형 제한 빠짐 | `Math.min(mapLH, nextW)` → `mapLH` | 6 |
   | ME 다음 폭 검사 빠짐 | `nextW >= requiredW && ` 지움 | 6 |
   | MF 상한 검사 빠짐 | `n < cap && ` 지움 | 3(1400·1.25), 5, 12, `pixel.test.ts` ‘dpr 1.25에서 가로와 세로 여백이 들어가는…’ |
   | MG 하한을 모든 표시에(P3) | 230행 대체의 `k = mapLabelScale(…)` → `mapRibbonScale(…)` | 8, 12 |
   | MH 하한을 세계지도에도 | `mapRibbonScale`의 `world ? k :` 지움 | 9, `pixel.test.ts` ‘world 렌더는 전달한 폭·dpr과…’ |
   | MI 리본에 하한 없음 | `const kr = k;` | 8, 10 |
   | MJ 리본 간격도 하한 | 261행 `13 * k` → `13 * kr` | 8 |
   | MK 경위도 글자에도 하한 | 239·244행 `12 * k` → `12 * kr` | 8 |
   | ML 측정 전 기본값 546 | 148행 `620` → `546` | 4, 13, `map-integration` ‘첫 측정값으로 그리고…’·‘저장을 불러오면…’, `pixel.test.ts` ‘측정 전만 기본값을 쓰고…’ |
   | MM 문턱 8 | `BLANK_BAND_LIMIT_CSS = 8` | 1, 3(559.78), 5, 7, 12 |
   | MN 리본 글자만 하한(상자는 k) | 259·260행을 `k`로 되돌림 | 8, 10 |
   | L1 `width` 종류 빠짐 | `WHATS`에서 `'width'` 지움 | ‘묶음 시나리오 검증’, ‘요소 폭과 부모 안 왼쪽 위치 측정’, ‘명령줄 dry-run…’ |
   | L2 `left-from-parent` 종류 빠짐 | `WHATS`에서 지움 | L1과 같음 |
   | L3 테두리 빠짐 | `+ p.clientLeft` 지움 | node 시험으로는 못 잡는다. Claude 측정에서 `map_left_band` 3.0~3.3으로 시나리오 기대(0~1.5)가 실패한다. 표에 ‘Claude 측정’이라 적는다 |

   - ML·MF·MH가 기존 시험도 깨는 것은 정상이다. 그 기존 시험이 지금 규칙을 지키고 있다는 뜻이다.
   - Claude도 검수 때 이 표를 다시 돌린다.
5. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0025.md`에 머리말 형식(`CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유. 없으면 ‘없음’.
- **실행한 검증과 결과:** 시작 HEAD 해시와 `git diff --name-only <BASE> HEAD` 출력. 시작 전 기준 값(vitest 파일·시험, 자료 검사 건수, node 시험 수). 명령별 통과·실패와 개수. 빌드 청크 크기. 시나리오 `--dry-run` 출력. 전수 시험 둘의 실행 시간.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **바꾼 기존 단언:** 없어야 한다. 완료 조건 3의 `grep '^-[^-]'` 출력 둘을 붙인다.
- **변형 시험 표**
- **화면 문구:** ‘새로 쓰거나 바꾼 학생 화면 문장 없음’과 완료 조건 3의 한글 검사 출력(0).
- **계획 표:** 시험 2·3·4의 폭·dpr별 n·논리 폭×높이·CSS 크기를 표로 다시 적는다(시험 출력에서 옮긴다).
- **범위 밖 발견:** 고치지 않은 문제. 적어도 다음을 확인해 적는다.
  - 경로 지도에서 배 표시가 늘린 세로의 위아래 여백(12 논리 px)에 걸려 잘리는 날이 있는지. 시험 8의 상태(2일, 배 한 척)에서 본 것만 적는다. 폭풍은 Claude가 계산했다(‘반례와 대가’).
  - 예정 거점 리본이 빠지는 폭 범위(위 ‘반례와 대가’)가 시제품과 같은지. 다르면 폭과 dpr을 적는다.
  - `left-from-parent`를 세계지도 틀에 쓰면 스크롤에 따라 값이 바뀐다는 점.
- **문서 반영 문안(선택):** PIXEL_SPEC 129·130·133행과 `tools/browser/README.md` 15행에 넣을 짧은 문장. Claude가 고른다.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 측정은 하지 않는다. 했다면 실제 배율 방식(WORKFLOW 119~121행)인지 적는다.

## 부록 A. `src/ui/map-fit.test.ts` (Claude 시제품, `e4f7dfa` + 구현 지시 1·2에서 26개 통과)

```ts
import { describe, expect, it } from 'vitest';
import { loadScenario, SCENARIO_IDS } from '../content/scenario';
import { loadRouteWaypoints } from '../content/map';
import { createGame, openDay } from '../engine/engine';
import { acceptAllFeasible, runDays } from '../engine/testkit';
import type { ScenarioConfig } from '../engine/types';
import { mapAsset } from './assets';
import { project } from './projection';
import {
  BLANK_BAND_LIMIT_CSS, LABEL_FLOOR_PX, MapMeasurementMemory, labelCapCssWidth, mapLabelScale, mapRibbonScale,
  mapRedrawDecision, mapViewportKey, planMapViewport, renderWorldMap, worldMapViewport,
} from './map';

// 시험 전용: 계획 함수와 같은 규칙으로 항로 상자·필요 크기를 따로 계산한다.
function routeFit(config: ScenarioConfig) {
  const map = mapAsset('MAP_EAST_ASIA')!;
  const u = map.pixelGrid!.unitsPerPixel;
  const pts = config.routes.flatMap((r) => loadRouteWaypoints(r.id)).map((p) => project(p, map.bounds, map.width, map.height));
  const left = Math.floor(Math.min(...pts.map((p) => p.x)) / u), top = Math.floor(Math.min(...pts.map((p) => p.y)) / u);
  const right = Math.ceil(Math.max(...pts.map((p) => p.x)) / u), bottom = Math.ceil(Math.max(...pts.map((p) => p.y)) / u);
  const requiredW = right - left + 24, requiredH = bottom - top + 24;
  return { left, top, right, bottom, requiredW, requiredH, minimumL: Math.max(requiredW, Math.ceil((requiredH - 0.5) * 16 / 10)) };
}

const M2 = loadScenario('SCENARIO_M2_MULTI_TRADE');
const M1 = loadScenario('SCENARIO_M1_ONE_TRADE');
const SWEEP_DPR = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.333, 1.5, 1.75, 2, 2.25, 2.5, 2.625, 2.75, 3, 3.5, 4];

describe('이번 항로 지도 폭 맞춤', () => {
  it('모든 시나리오의 항로 상자와 필요 크기', () => {
    expect(BLANK_BAND_LIMIT_CSS).toBe(16);
    for (const id of SCENARIO_IDS) {
      expect(routeFit(loadScenario(id))).toEqual({ left: 98, top: 79, right: 328, bottom: 300, requiredW: 254, requiredH: 245, minimumL: 392 });
    }
  });

  it.each([
    [582.7, 2, { vb: { x: 38, y: 134, w: 776, h: 490 }, n: 3, cssWidth: 582, cssHeight: 367.5 }],
    [346.06, 2, { vb: { x: 80, y: 134, w: 692, h: 490 }, n: 2, cssWidth: 346, cssHeight: 245 }],
    [314.22, 2, { vb: { x: 112, y: 134, w: 628, h: 490 }, n: 2, cssWidth: 314, cssHeight: 245 }],
    [315.51, 2, { vb: { x: 110, y: 134, w: 630, h: 490 }, n: 2, cssWidth: 315, cssHeight: 245 }],
    [374.97, 2, { vb: { x: 52, y: 134, w: 748, h: 490 }, n: 2, cssWidth: 374, cssHeight: 245 }],
    [595.78, 1.25, { vb: { x: 54, y: 134, w: 744, h: 490 }, n: 2, cssWidth: 595.2, cssHeight: 392 }],
    [456.16, 1.5, { vb: { x: 84, y: 134, w: 684, h: 490 }, n: 2, cssWidth: 456, cssHeight: 326.6666666666667 }],
  ])('빈 띠가 16 CSS px 이상인 폭 %s·dpr %s는 한 배율 위에서 세로를 항로 높이까지 늘린다', (width, dpr, plan) => {
    for (const config of [M2, M1]) expect(worldMapViewport(config, 'route', { availableWidth: width, dpr })).toEqual(plan);
  });

  it.each([
    [559.78, 2, { vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 2, cssWidth: 546, cssHeight: 341 }],
    [875.06, 1.25, { vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 2, cssWidth: 873.6, cssHeight: 545.6 }],
    [689.61, 0.8, { vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 1, cssWidth: 682.5, cssHeight: 426.25 }],
    [503.06, 1, { vb: { x: 0, y: 64, w: 1006, h: 628 }, n: 1, cssWidth: 503, cssHeight: 314 }],
    [400.6, 2, { vb: { x: 26, y: 128, w: 800, h: 500 }, n: 2, cssWidth: 400, cssHeight: 250 }],
    [805.25, 1, { vb: { x: 24, y: 128, w: 804, h: 502 }, n: 2, cssWidth: 804, cssHeight: 502 }],
    [920.61, 2, { vb: { x: 0, y: 90, w: 920, h: 576 }, n: 4, cssWidth: 920, cssHeight: 576 }],
    [1400, 1.25, { vb: { x: 0, y: 38, w: 1092, h: 682 }, n: 3, cssWidth: 1310.4, cssHeight: 818.4 }],
  ])('빈 띠가 16 CSS px 미만이거나 상한 배율인 폭 %s·dpr %s는 16:10 계획 그대로다', (width, dpr, plan) => {
    for (const config of [M2, M1]) expect(worldMapViewport(config, 'route', { availableWidth: width, dpr })).toEqual(plan);
  });

  it('측정 전 기본값(620 CSS px·dpr 1)의 계획', () => {
    const memory = new MapMeasurementMemory();
    expect(memory.get('route')).toEqual({ availableWidth: 620, dpr: 1 });
    expect(worldMapViewport(M2, 'route', memory.get('route'))).toEqual({ vb: { x: 116, y: 134, w: 620, h: 490 }, n: 2, cssWidth: 620, cssHeight: 490 });
    expect(worldMapViewport(M2, 'world', memory.get('world'))).toEqual({ vb: { x: 0, y: 0, w: 3600, h: 1220 }, n: 1, cssWidth: 720, cssHeight: 244 });
  });

  it('전수 검사: 상한 아래 빈 띠 합은 16 CSS px 미만이고, 세로는 한 배율 올릴 때만 항로 높이까지 는다', () => {
    let tall = 0, total = 0;
    for (const config of [M2, M1]) {
      const fit = routeFit(config);
      for (const dpr of SWEEP_DPR) for (let w = 150; w <= 2000; w += 0.5) {
        total++;
        const plan = worldMapViewport(config, 'route', { availableWidth: w, dpr });
        const cap = Math.max(1, Math.floor(3 * dpr));
        const L = plan.vb.w / 2, H = plan.vb.h / 2;
        const n16 = Math.min(cap, Math.max(1, Math.floor(w * dpr / fit.minimumL)));
        const h16 = Math.min(615, Math.max(1, Math.round(L * 10 / 16)));
        expect(plan.n).toBeLessThanOrEqual(cap);
        expect(plan.cssWidth).toBeLessThanOrEqual(w);
        if (plan.n < cap) expect(w - plan.cssWidth).toBeLessThan(16);
        if (H === h16) expect(plan.n).toBe(n16);
        else {
          tall++;
          expect([H, plan.n, h16 < fit.requiredH, H <= L, w - n16 * 546 / dpr >= 16]).toEqual([fit.requiredH, n16 + 1, true, true, true]);
        }
      }
    }
    expect([total, tall]).toEqual([140638, 12756]);
  }, 60000);

  it('합성 항로: 다음 배율의 폭이 항로보다 좁거나 세로가 정사각형을 넘으면 띠가 남아도 그대로다', () => {
    const map = { w: 1092, h: 1230 };
    // 필요 폭 324: 다음 배율 폭 300에 들어가지 않는다.
    expect(planMapViewport(map, 2, { x: 300, y: 400, w: 600, h: 80 }, 600, 1, 'route'))
      .toEqual({ vb: { x: 0, y: 98, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 });
    // 필요 높이 324 > 다음 배율 폭 300(정사각형 초과).
    expect(planMapViewport(map, 2, { x: 300, y: 300, w: 50, h: 600 }, 600, 1, 'route'))
      .toEqual({ vb: { x: 0, y: 258, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 });
  });

  it('합성 항로: 빈 띠 16 CSS px에서 올리고 15.5 CSS px에서는 올리지 않는다', () => {
    const map = { w: 1092, h: 1230 }, route = { x: 300, y: 300, w: 200, h: 420 };
    expect(planMapViewport(map, 2, route, 562, 1, 'route'))
      .toEqual({ vb: { x: 118, y: 276, w: 562, h: 468 }, n: 2, cssWidth: 562, cssHeight: 468 });
    expect(planMapViewport(map, 2, route, 561.5, 1, 'route'))
      .toEqual({ vb: { x: 0, y: 168, w: 1092, h: 682 }, n: 1, cssWidth: 546, cssHeight: 341 });
  });
});

// 렌더 HTML의 거점마다 상태·휘장 위치·리본 여부.
function portsOf(out: string) {
  return out.split('<g class="port ').slice(1).map((chunk) => {
    const [, x, y] = chunk.match(/translate\(([-\d.]+) ([-\d.]+)\)/)!;
    return { status: chunk.slice(0, chunk.indexOf('"')), x: Number(x), y: Number(y), ribbon: chunk.includes('<g class="ribbon">') };
  });
}
const inBox = (p: { x: number; y: number }, vb: { x: number; y: number; w: number; h: number }) => p.x >= vb.x && p.x <= vb.x + vb.w && p.y >= vb.y && p.y <= vb.y + vb.h;

describe('경로 지도 이름표 하한', () => {
  const html = (config: ScenarioConfig, width: number, dpr: number, state = createGame(config)) => renderWorldMap(state, config, 'route', { availableWidth: width, dpr });
  const scales = (config: ScenarioConfig, width: number, dpr: number, world = false) => {
    const plan = worldMapViewport(config, world ? 'world' : 'route', { availableWidth: width, dpr });
    const cap = labelCapCssWidth(config, world ? 'world' : 'route', dpr);
    return { plan, k: mapLabelScale(plan, world, cap), kr: mapRibbonScale(plan, world, cap), css: plan.cssWidth / plan.vb.w };
  };

  it('이름표 글자와 리본 상자만 11 CSS px 하한을 쓰고 휘장·나침반·배·사건·선은 그대로다', () => {
    expect(LABEL_FLOOR_PX).toBe(11);
    const cfg = structuredClone(M2);
    cfg.portRestrictions = [{ eventInstanceId: 'SYNTH-WAIT', templateId: 'SYNTH', cityId: cfg.routes[0]!.toCityId, announceDay: 1, startDay: 1, endDay: 1, forecastKo: '시험용 가상 공지' }];
    const open = openDay(createGame(cfg), cfg).state;
    const sailing = runDays(open, cfg, 2, { 1: acceptAllFeasible(open, cfg) }).state;
    const state = { ...structuredClone(sailing), appliedEventIds: { ...sailing.appliedEventIds, 'SYNTH-WAIT': true as const } };
    const { plan, k, kr, css } = scales(cfg, 315.51, 2);
    const out = html(cfg, 315.51, 2, state);
    expect([15 * k * css, 15 * kr * css]).toEqual([15 * 315 / 620, 11]);
    for (const part of [`font-size="${15 * kr}"`, `font-size="${12.5 * kr}"`, `rx="${5 * kr}"`, `height="${24 * kr}"`,
      `scale(${k})"><circle r="10" class="port-badge"`, `scale(${k * 0.78})"><circle r="10" class="port-badge"`, `r="${15 * k}" class="port-glow"`,
      `<circle r="${34 * k}" class="compass-ring"/>`, `scale(${k * 0.9})"><title>`, `scale(${k * 0.8})">`,
      `stroke-width="${7 * k}"`, `stroke-width="${2.6 * k}"`, `<g class="graticule" stroke-width="${0.8 * k}">`, `font-size="${12 * k}"`]) expect(out).toContain(part);
    expect(out).not.toContain(`font-size="${15 * k}"`);
    expect(plan.n).toBe(2);
    // 리본 자리: 휘장에서 띄우는 간격 13과 위아래 4는 k를 쓴다(크기만 kr).
    const placed = out.split('<g class="port ').slice(1).filter((c) => c.includes('<g class="ribbon">')).map((chunk) => {
      const t = chunk.match(/translate\(([-\d.]+) ([-\d.]+)\)/)!;
      const r = chunk.match(/<g class="ribbon"><rect x="([-\d.e]+)" y="([-\d.e]+)" width="([\d.e-]+)" height="([\d.e-]+)"/)!;
      const x = Number(t[1]), y = Number(t[2]), bx = Number(r[1]), by = Number(r[2]), bw = Number(r[3]), bh = Number(r[4]);
      const gap = 13 * k, d = 4 * k;
      const spots: [number, number][] = [[x + gap, y - bh - d], [x - gap - bw, y - bh - d], [x + gap, y + d], [x - gap - bw, y + d],
        [x - bw / 2, y - gap - bh], [x - bw / 2, y + gap], [x - bw / 2, y - gap - 2 * bh], [x - bw / 2, y + gap + bh]];
      return spots.some(([sx, sy]) => Math.abs(sx - bx) < 1e-6 && Math.abs(sy - by) < 1e-6);
    });
    expect(placed.length).toBeGreaterThan(0);
    expect(placed.every(Boolean)).toBe(true);
  });

  it('하한보다 큰 이름표와 세계지도는 바꾸지 않는다', () => {
    const big = scales(M2, 920.61, 2);
    expect(big.kr).toBe(big.k);
    const world = scales(M2, 930, 1.5, true);
    expect(world.kr).toBe(world.k);
    expect(renderWorldMap(createGame(M2), M2, 'world', { availableWidth: 930, dpr: 1.5 })).toContain(`font-size="${15 * world.k}"`);
  });

  it('320 CSS px 휴대폰(폭 259.22·dpr 2)에서는 1장 예정 거점 이름표 하나가 빠지고 이번 시나리오 거점 이름표는 남는다', () => {
    const ribbonsInView = (config: ScenarioConfig) => {
      const plan = worldMapViewport(config, 'route', { availableWidth: 259.22, dpr: 2 });
      return portsOf(html(config, 259.22, 2)).filter((p) => inBox(p, plan.vb)).map((p) => `${p.status}:${p.ribbon ? '이름표' : '없음'}`);
    };
    expect(ribbonsInView(M2)).toEqual(['active:이름표', 'active:이름표', 'active:이름표', 'planned:이름표', 'planned:없음', 'preview:이름표']);
    expect(ribbonsInView(M1)).toEqual(['active:이름표', 'active:이름표', 'planned:이름표', 'planned:이름표', 'planned:없음', 'preview:이름표']);
  });

  it.each(['route', 'world'] as const)('%s에서 같은 다시 그리기 키는 같은 이름표 글자 크기를 뜻한다', (mode) => {
    for (const dpr of [1, 1.25, 1.5, 2, 3]) {
      const sizes = new Map<string, number>();
      for (let width = 240; width <= 1800; width += 7) {
        const plan = worldMapViewport(M2, mode, { availableWidth: width, dpr });
        const screen = mapRibbonScale(plan, mode === 'world', labelCapCssWidth(M2, mode, dpr)) * plan.cssWidth / plan.vb.w;
        const { key } = mapRedrawDecision(M2, mode, { availableWidth: width, dpr });
        expect(key).toBe(mapViewportKey(plan, dpr));
        if (sizes.has(key)) expect(screen).toBeCloseTo(sizes.get(key)!, 10);
        sizes.set(key, screen);
        if (mode === 'route') expect(15 * screen).toBeGreaterThanOrEqual(11 - 1e-9);
      }
    }
  });

  it('전수 검사: 이번 시나리오 거점 이름표는 빠지지 않고, 그린 항로선은 보기 영역 안쪽에 있다', () => {
    let keys = 0, minCtrl = Infinity, minAfterUnder = Infinity;
    for (const config of [M2, M1]) {
      const fit = routeFit(config), seen = new Set<string>(), state = createGame(config);
      for (const dpr of [1, 1.25, 1.5, 2, 2.5, 3]) for (let w = 240; w <= 1600; w += 2) {
        if (w * dpr < fit.minimumL) continue;
        const plan = worldMapViewport(config, 'route', { availableWidth: w, dpr });
        const key = mapViewportKey(plan, dpr);
        if (seen.has(key)) continue;
        seen.add(key); keys++;
        const out = html(config, w, dpr, state);
        for (const p of portsOf(out)) if (p.status === 'active' && inBox(p, plan.vb)) expect(p.ribbon).toBe(true);
        const under = Number(out.match(/class="route-under" d="[^"]+" stroke-width="([\d.e-]+)"/)![1]);
        for (const m of out.matchAll(/<path class="route-line" d="([^"]+)"/g)) {
          const nums = m[1]!.replace(/[MC]/g, ' ').trim().split(/\s+/).map(Number);
          const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
          const margin = Math.min(Math.min(...xs) - plan.vb.x, Math.min(...ys) - plan.vb.y, plan.vb.x + plan.vb.w - Math.max(...xs), plan.vb.y + plan.vb.h - Math.max(...ys)) / 2;
          minCtrl = Math.min(minCtrl, margin);
          minAfterUnder = Math.min(minAfterUnder, margin - under / 4);
        }
      }
    }
    // 논리 px: 조절점 상자(곡선을 포함)의 가장 좁은 여백, 거기서 밑선(route-under) 반폭을 뺀 값.
    expect([keys, Math.round(minCtrl * 100) / 100, Math.round(minAfterUnder * 100) / 100]).toEqual([6422, 9.05, 6.83]);
  }, 60000);
});
```

## 부록 B. 더하는 시험 두 개 (Claude 시제품)

`src/ui/map-integration.test.ts` (132행 시험 앞):

```ts
  it('빈 띠가 넓던 폭(315.51·dpr 2)을 재면 한 배율 위 계획으로 다시 그리고, 시나리오를 바꾸면 측정 전 기본 계획으로 돌아간다', async () => {
    const ui = await start();
    const before = ui.app.innerHTML;
    expect(before).toContain('width="620" height="490"');
    expect(before).toContain('data-map-viewport="2:620:490:116:134"');
    ui.measure(315.51, 2);
    expect(ui.frame().innerHTML).toContain('width="315" height="245"');
    expect(ui.frame().innerHTML).toContain('data-map-viewport="2:630:490:110:134"');
    expect(ui.frame().dataset.viewportKey).toBe('2:630:490:110:134:2');
    ui.click({action:'map-mode',mode:'route'});
    expect(ui.app.innerHTML).toContain('width="315" height="245"');
    expect(ui.frame().dataset.measured).toBe('true');
    ui.changeScenario();
    expect(ui.app.innerHTML).toContain('width="620" height="490"');
    expect(ui.frame().dataset.measured).toBeUndefined();
  });
```

`tools/browser/lib.test.mjs` (‘정적 경로의 상위 이동을 막는다’ 앞):

```js
test('요소 폭과 부모 안 왼쪽 위치 측정', () => {
  const base = { ...loadScenario(scenarioFile('smoke')), expect: [] };
  const steps = [
    { do: 'measure', name: 'w', what: 'width', selector: '[data-map-frame] > svg' },
    { do: 'measure', name: 'band', what: 'left-from-parent', selector: '[data-map-frame] > svg' },
    { do: 'remember', name: 'map', selector: '#world-h' },
    { do: 'measure', name: 'w_ref', what: 'width', ref: 'map' },
  ];
  assert.deepEqual(validateScenario({ ...base, steps, expect: [{ value: 'band', min: 0, max: 1.5 }] }), []);
  for (const what of ['width', 'left-from-parent']) {
    assert.deepEqual(validateScenario({ ...base, steps: [{ do: 'measure', name: 'v', what }] }), [`1단계 measure: 선택자 또는 ref가 필요합니다`]);
  }
});
```
