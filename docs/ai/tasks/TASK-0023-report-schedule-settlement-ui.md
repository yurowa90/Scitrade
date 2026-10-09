# TASK-0023 경영 보고·일정·병목·결산 화면과 동료 필터

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: TASK-0016(읽기 함수, `d107406`)과 TASK-0018(키보드·입력 안전, `18e2b3a`)이 개발 브랜치에 반영됐다. 통합 기록은 `a13caa4`다. 개발 브랜치 `a13caa4` 위에 만든 `codex/TASK-0023`에서 작업한다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only a13caa4 HEAD`를 실행해 결과 보고에 적는다.
  - 작업 브랜치는 이 지시서를 올린 개발 브랜치 커밋에서 시작한다. 그 커밋이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 `git diff a13caa4` 결과에 나와도 이 작업의 변경으로 치지 않는다. 그 밖의 파일이 다르면 결과 보고에 적는다.
  - 모든 diff·검사 명령의 기준 커밋은 `a13caa4`다. 아래 줄 번호도 `a13caa4` 기준이다.
- 결정 근거:
  - `docs/DESIGN_v0.4.md`
    - 46·61·432행: 90일 캠페인과 결산.
    - 63행: 본사 보고는 KRW, 국제 거래는 USD.
    - 111행: 경영 보고 항목(현금·이익·재고·외상 대금·미지급금·정시 인도율).
    - 116행: 계약 카드에서 비용과 지연의 원인을 펼쳐 본다.
    - 476·497행: 기록 지표와 납기 경계(마감일 도착은 정시).
    - 694행: 주요 고객이 없어도 90일에 정상 결산한다.
  - `docs/UI_SPEC.md`
    - 11행: 상단의 임박 지급. 이번에는 막대에 넣지 않는다(아래 ‘범위’).
    - 15행: 하단 영역은 바뀐 것만 강조한다.
    - 28행: UI_REPORT(현금·영업손익·채권·재고·납기·업무 부하, 원인 펼치기, 해당 계약 이동).
    - 62행: UI_ROSTER의 속성·직무 필터.
  - `docs/CLASSIC_GAME_INSIGHTS.md` 38~40행(CL-01 거래 흑자와 자금 부족 구분, CL-02 일정 연결, CL-03 업무량 대 처리량).
  - `docs/DECISIONS.md`
    - 54행: USD와 KRW 장부는 합산하지 않는다.
    - 57행: 못 낸 필수 지급은 미지급금으로 남는다. 경영 실패 판정은 없다.
    - 152행: 자금 예약은 확정된 지출만 묶는다. 급여는 예약하지 않는다.
    - 400행: 미발견 후보는 어디에도 드러나지 않는다.
    - 734·940행: 계수기·채울 표 같은 수집 유도 장치를 두지 않는다.
    - 928행: 열고 닫기에도 500ms 두 번 누름 막기를 건다.
    - 1033행 ‘병렬 세션 1차 결과’: 보고·일정·결산 화면은 2차(W2-0d)로 넘겼다. 키보드 시험은 실제 Chromium 순서와 같아야 한다.
  - `docs/ai/design/DECISION-PACKET-2026-10.md`
    - D01(송금·환전, 결정 대기): USD·KRW를 환산하거나 더하지 않는다.
    - D04(지급 불이행 유예, 결정 대기): 실패 판정을 넣지 않는다.
    - D12(도감 실루엣, 결정 대기): 실루엣·미발견 칸은 넣지 않는다. 속성·직무 필터는 이 결정과 무관하다(D12 ‘풀리는 항목’).
  - `docs/ai/design/layout-ux04-05/README.md`: 배치안 A·B·C는 사용자 선택 대기다. 이 작업은 어느 안도 구현하지 않는다.
  - `docs/ai/tasks/results/TASK-0015.md` 185행: 회사 보고의 ‘맡은 고객 화물 320개’ 단위 섞임을 이 작업에서 고친다.
  - `docs/ai/tasks/results/TASK-0016.md` 84~90행 ‘화면 연결 안내’.
  - 2026-10-09 남은 일 점검 계획의 W2-0d(B37·B38·B36의 9b·B48 필터). Claude의 작업 계획이며 저장소에 없다. 찾지 않아도 된다.

## 목표

TASK-0016이 만든 읽기 함수로 화면을 만든다. 엔진은 고치지 않는다.

1. **경영 보고 보강 (B37: TE-10, UX-15·17·39, PPL-33):** USD 미지급금, 정시 인도율, 앞으로 낼 돈(통화별), 업무 부하, 막힌 곳(돈·시간·사람·선복), 원인에서 계약으로 가는 링크, 거래 이익과 원화 자금의 차이.
2. **품목별 화물 (TASK-0015 후속):** ‘고객 화물 320개’처럼 개와 상자를 한 단위로 세지 않는다. 회사 재고도 같다.
3. **90일 결산 (B36의 9b):** 캠페인이 끝나면 통화별 결산을 보인다. 끝난 뒤 ‘91일’로 보이는 표시를 고친다.
4. **일정 (B38: UX-16):** ‘오늘 할 일’ 칸에서 준비·출항·도착·인도·납기·수금·지급·훈련·현지 활동 완료일을 한 일정으로 잇는다. 하루가 지나 새로 생기거나 날짜가 바뀐 일정에는 글자 표시를 붙인다.
5. **동료 필터 (B48 중 UX-34):** 동료 카드와 운영표에 직무·속성 필터를 더한다.
6. **측정 시나리오:** Claude가 Chromium으로 잴 시나리오 JSON 4개.

**바꾸지 않는 것:**
- 엔진·경제 규칙·장부·저장 형식·자료(`src/engine/**`, `src/content/**`, `data/**`).
- 위쪽 고정 막대(`topbar()` 272~304행). 막대 높이(마우스 72px·터치 79px)와 배치안 A의 막대 단추가 결정 대기다.
- 격자 영역 문자열과 패널 순서(`style.css` 86~115행, `main.ts` 777~789행).
- 하루 진행 뒤 읽던 자리 규칙(`endDay()` 192~233행). 예외는 3절의 ‘캠페인 종료’ 분기 하나다.
- Tab·Shift+Tab 처리(`main.ts` 91~103행), `focusWithoutScroll`(73~85행), 건너뛰기 두 단추.
- 통화 합산·환산, 경영 실패 판정, 점수·등급, 도감 실루엣.

## 먼저 읽을 파일

- 화면 (`src/ui/main.ts`)
  - 42행: `view`는 대기 명령을 반영한 사본이고 보고·현금은 확정 상태(`state`)를 쓴다.
  - `qtyKo` 144~147행, `queue()` 155~180행, `endDay()` 182~235행(224행 상태 교체, 227~230행 알림, 232~233행 읽던 자리 복원).
  - `topbar()` 272~304행. **읽기만 한다.**
  - `contractPanel` 459~534행(525행 계약 제목 `contract-h-…`), `progressBox` 539~546행.
  - `tradePanel` 590~603행(진행 중 계약만 `contractPanel`로 그린다).
  - `resourcePanel` 605~642행. **바꾸지 않는다.**
  - `reportPanel` 644~678행(649~659행 ‘현금과 이익이 다른 이유’, 654·657·667·669행 단위 섞임, 664행 제목).
  - `crewPanel` 680~699행(689행 상태 필터 줄).
  - `queuePanel` 742~752행(746행 제목, 750행 성장 알림).
  - `render()` 764~841행(777~789행 화면 HTML, 831~840행 초점 복원).
  - 클릭 처리 907~1038행(건너뛰기 914~920행, 성장 상세 948~952행, 상태 필터 995~997행, 저장 알림 1011행).
  - change 처리 1050~1075행, `loadText` 1077~1089행(1086행 불러오기 알림).
- 화면 도우미
  - `src/ui/reports.ts` 전체(`krwReportRows`, 원화 보고 문구).
  - `src/ui/recruitment.ts`: `CrewFilter` 51행, `crewEntries` 54~65행(미발견 후보 제외), `crewRow` 143~147행, `crewEntryCard` 150~154행.
  - `src/ui/card.ts`: `ATTRIBUTE` 13~20행, `ROLE_KO` 22행, `roleBadge` 31행, `attributeChip` 37행, `taskName` 76행.
  - `src/ui/session.ts`: `initialUiState` 8~19행.
  - `src/ui/growth.ts` 33~35행 `payrollRunwayKo`. **읽고 import만 한다.**
  - `src/ui/main-testkit.ts` 전체.
- 엔진 (**읽고 import만 한다**)
  - `src/engine/reports.ts`: `contractReport` 19행, `companyReport` 45~57행(46~49행 화물 수량 기준), `tradePairs` 164행, `onTimeDeliveryRate` 193~209행, `upcomingPayments` 231~289행, `campaignSummary` 325~356행.
  - `src/engine/capacity.ts`: `workloadSummary` 49~94행.
  - `src/engine/progress.ts`: `BlockerCode` 21~30행, `contractProgress` 44행 이후(99행 준비 완료일 공식).
  - `src/engine/reservations.ts`: `cashReservations` 21행, `fundsPosition` 54~68행.
  - `src/engine/previews.ts`: `payrollRunwayDay` 40~53행.
  - `src/engine/catalog.ts`: `goodOf` 8행, `routeOf` 18행, `listSailings` 36행, `cityName` 79행, `unitKo` 84행.
  - `src/engine/tasks.ts`: `taskSubjectKo` 4행, `isDayBasedTask` 20행. `src/engine/employees.ts`: `isAvailableFromToday` 8행.
  - `src/engine/engine.ts`: `commitDay` 796~838행(814행 업무 진행 → 출항 → 도착 → 인도 → 821행 수금 → 급여, 836행 `ENDED`), `progressTasks` 840~845행, `processDepartures` 892행, `processArrivals` 952행, `processDeliveries` 993행(1044행 `dueDay = max(paymentDueDay, 인도일)`).
  - `src/engine/testkit.ts`: `runDays` 13행, `acceptAllFeasible` 50행, `runToCampaignEnd` 76행.
- 시험
  - `src/ui/main.test.ts`: 71·368·919행(오늘 할 일 칸을 `split('</section>')`로 자른다), 78행(‘금액은 확정 기준’ 2개), 228행(초기화), 296~344행(이스케이프), 818~856행(격자·막대 규칙), 1013~1026행(P0-CITY-01 머리 비교), 1200행 이후(TASK-0018 키보드 시험).
  - `src/ui/trade-reports.test.ts`, `src/ui/recruitment.test.ts` 91~100행.
  - `src/engine/reports-read.test.ts`, `src/engine/campaign-end.test.ts`(읽기 함수를 시험하는 방식).
- 측정 도구: `tools/browser/README.md`, `tools/browser/lib.mjs` 47~93행(시나리오 형식), `tools/browser/lib.test.mjs` 8행, `tools/browser/scenarios/*.json`.
- 위 ‘결정 근거’의 문서 줄.

## 범위

**포함 (이 순서로 한다)**
1. 경영 보고 보강(구현 지시 1).
2. 품목별 화물(구현 지시 2).
3. 90일 결산과 종료 표시(구현 지시 3).
4. 일정(구현 지시 4).
5. 동료 직무·속성 필터(구현 지시 5).
6. 측정 시나리오 4개(구현 지시 6).

**제외**
- 위쪽 막대의 임박 지급(UI_SPEC 11행)과 회사 이름. 막대 높이 기준과 배치안 A가 결정 대기다. 임박 지급은 경영 보고와 일정에 둔다.
- 배치안 A·B·C(‘오늘 할 일 N건’ 막대 단추, ‘마지막 조작 열’ 읽던 자리, 오른쪽 칸 순서 바꾸기, 오른쪽 창). 한 열 배치의 순서도 바꾸지 않는다.
- 통화 합산·환산·송금(D01), 경영 실패 판정(D04), 결산 점수·등급.
- 도감 실루엣·미발견 칸·‘미발견 후보 n명’ 문구 변경·직접 경험 표시(D12). 희귀도·서식지·보전 정보.
- 견적의 ‘수락 뒤 사용 가능 자금’, 면담 변경, 지도, 문화 화면(`culture.ts`).
- 청크 분할(W2-0e, `vite.config.ts`).
- 브라우저 측정. Sol 샌드박스에서는 Chromium이 죽는다(`docs/ai/tasks/results/TASK-0012.md` 99~102행). 시나리오는 `--dry-run`만 한다. Claude가 잰다.

**시간이 모자라면 뺄 수 있음** (1번부터 뺀다)
1. 측정 시나리오 4개와 `lib.test.mjs` 한 줄(구현 지시 6). Claude가 직접 쓴다.
2. 일정의 ‘새 일정·날짜 바뀜’ 표시(4-5절). 이때 `schedulePrev`도 만들지 않는다.
3. 동료 필터 전체(구현 지시 5).
4. 결산의 ‘받지 못한 대금·남은 미지급’ 목록(3-2절의 마지막 두 줄). 통화별 표·계약 현황·정시 인도율은 빼지 않는다.
- 뺀 항목은 결과 보고 ‘완료 조건 대조’에 ‘미충족(시간)’으로 적는다.
- 그 밖의 것은 빼지 않는다: 구현 지시 0~3, 4의 일정 기본(4-1~4-4), 아래 나머지 시험, 변형 시험.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/reports.ts`, `src/ui/style.css`
- 새 파일 `src/ui/schedule.ts`
- `src/ui/recruitment.ts`: `crewEntries`의 선택 인수와 필터 선택지 함수만 더한다. 다른 함수의 출력은 바꾸지 않는다.
- `src/ui/session.ts`: `initialUiState`에 필드 4개만 더한다.
- `src/ui/card.ts`: 이름 함수 두 개(`roleKo`, `attributeKo`)를 **export로 더하기만** 한다. 기존 함수의 출력은 그대로다(`crew-card.test.ts` 인라인 스냅숏이 그대로 통과).
- `src/ui/main-testkit.ts`: 필요하면 도우미를 **더하기만** 한다. 기존 흉내의 동작은 바꾸지 않는다.
- 시험: `src/ui/main.test.ts`, `src/ui/trade-reports.test.ts`, `src/ui/recruitment.test.ts`(모두 더하기만), 새 파일 `src/ui/schedule.test.ts`.
- 새 측정 시나리오 4개: `tools/browser/scenarios/report-contract-link.json`, `schedule-toggle.json`, `crew-facet.json`, `campaign-end.json`.
- `tools/browser/lib.test.mjs`: 8행 `names` 배열에 위 4개 이름을 더하는 한 줄만.
- `docs/ai/tasks/results/TASK-0023.md` (결과 보고)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/engine/**`, `src/content/**`. 읽고 import만 한다.
  - `src/ui/culture.ts`, `growth.ts`, `crew-status.ts`, `focus.ts`, `trade.ts`, `html.ts`, `assets.ts`, `map.ts`, `projection*`, `pixel*`, `sprite*`.
  - 위 목록에 없는 시험 파일(`culture.test.ts`, `growth.test.ts`, `crew-card.test.ts`, `session.test.ts`, `map-integration.test.ts` 등).
  - `vite.config.ts`(W2-0e), `index.html`, `package.json`, `package-lock.json`. 새 npm 의존성을 넣지 않는다.
  - `tools/browser/lib.mjs`, `measure.mjs`, `profiles.json`, `README.md`, 기존 시나리오 4개.
- 동시에 W2-0a(인수 명세·검사기 정리, TASK-0022 예정)가 돌 수 있다. 그 파일을 건드리지 않는다: `tests/**`, `tools/validate_data.py`, `tools/test_validate_data.py`, `data/sources.json`.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `data/**`, `tests/acceptance_cases.json`
  - `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `docs/ai/design/**`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `references/**`

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다.
- 화면은 엔진 상태를 읽기만 한다. 현금·재고·예약을 화면에 따로 두지 않는다. 읽기 함수가 모자라도 엔진을 고치지 않는다. 화면에서 조합하고, 엔진 결함으로 보이면 ‘범위 밖 발견’에 적는다.
- 돈은 통화별로만 다룬다. 같은 통화끼리만 더한다. USD와 KRW를 더하거나 환산하지 않는다. 1,300원 같은 환율을 계산에 쓰지 않는다.
- 기존 시험의 단언을 바꾸지 않는다. Claude 시제품에서는 고칠 단언이 없었다(아래 ‘바꿔도 되는 기존 단언’). 기존 시험이 실패하면 설계가 어긋난 것이다. 원인을 찾고, 못 찾으면 보고한다.
- 새로 쓰는 시험 줄에 도시·견적·노선·사건·직원·계약·업무 ID와 도시 이름을 쓰지 않는다.
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `HAIPHONG`, `SHANGHAI`, `OFFER_*`, `ROUTE01`, `EVI_*`, `EMP01`, `CT001`, `TASK001`, ‘평택’, ‘부산’, ‘하이퐁’, ‘상하이’.
  - 값은 `config`와 상태에서 꺼낸다. 예: `config.offers.filter((o) => o.kind === 'forwarding')`, `tradePairs(config)`, `config.employees[0]!.id`, `state.contracts[0]!.id`, 렌더된 단추의 `dataset.contract`.
  - 시나리오 ID 상수와 기존 도우미(`readySave` 등)는 써도 된다. 이 지시서가 정한 합성 ID(`SYNTH-WAIT`)도 쓴다.
- 금액·날짜·건수를 고정값으로 단언하지 않는다. 엔진 함수(`companyReport`, `campaignSummary`, `upcomingPayments`, `workloadSummary`, `contractProgress`)·장부·설정에서 계산한 값과 비교한다. 예외는 순수 서식 함수(`rateKo`)의 입력·출력 표다.
- 문장은 전체를 단언한다. ‘정시’ 같은 부분 문자열만 보는 단언으로 끝내지 않는다. 기대 문장은 위 함수 값으로 만든다.
- 키보드·초점 시험은 실제 Chromium 순서를 따른다: Tab keydown → (화면 이동) → focusin → Enter keydown → click. 순서를 바꿔 흉내 내지 않는다(TASK-0018 검수 기록).
- 플레이어가 읽는 글에 실제 회사 이름을 넣지 않는다. 도시 이름은 `cityName(config, id)`로만 만든다.
- 학생 화면에 개발 단계 부호를 쓰지 않는다: `M2a`, `M2b`, `M3`, `LEGACY_FIXED`, `규칙 M1`, `DESIGN` 등(TASK-0018 시험 12).
- 사용자에게 보이는 글과 코드 주석은 한국어로, 짧은 문장으로 쓴다.
- 네트워크 조사는 하지 않는다. `chainportal.co.kr`에는 접속하지 않는다. robots.txt를 지킨다.
- 시험 환경을 피하려고 `?.` 선택 호출을 새로 넣지 않는다. 시험 틀을 넓힌다(TASK-0014 검수 기록).
- **시험 제목과 인수 명세:** 병렬 TASK-0022가 인수 명세 사례를 시험 파일·제목에 연결한다. 자료 검사기는 연결한 제목이 그 파일에 그대로 있는지, 사례 ID가 든 제목이 연결된 파일에만 있는지 본다. 그래서:
  - 사례 ID(`P0-…`, `P1-…`, `P2-…`, `CHAR-ACC-…`)가 든 기존 `describe`·`it`·`test` 제목은 바꾸거나 지우거나 다른 파일로 옮기지 않는다. `main.test.ts`의 `P0-CITY-01 …` 제목 두 개가 여기에 든다.
  - 새 시험 제목에는 사례 ID를 넣지 않는다. 어떤 사례와 관계있는지는 시험 안 주석이나 결과 보고에 적는다.
  - 변형 시험 중에 제목을 바꿨다면 끝나고 되돌렸는지 확인한다.

## 구현 지시

### 0. 공통 규칙

**기준 상태**
- 경영 보고와 결산은 확정 상태 `state`를 읽는다(42행 주석, `reportPanel` 645행과 같음).
- 일정은 대기 명령을 반영한 `view`를 읽는다. 오늘 할 일 칸에 붙기 때문이다.
- 동료 필터는 지금처럼 `view`를 읽는다(`crewPanel` 681행).

**계약 링크** (main.ts 도우미 `contractLink(id)`)
- 계약 제목 `contract-h-${id}`는 `view`에서 진행 중(`ACTIVE`·`IN_PROGRESS`)인 계약에만 있다(`tradePanel` 591·599행). 그런 계약만 단추로 만든다. 나머지는 `esc(id)` 글자만 쓴다.
- 단추: `<button class="link" data-action="goto-contract" data-contract="${esc(id)}" aria-label="${esc(id)} 계약으로 가기">${esc(id)}</button>`
- 누르면(click 처리에 `case 'goto-contract'`):
  1. `` document.getElementById(`contract-h-${d.contract}`) ``가 없으면 아무것도 하지 않는다.
  2. 있으면 `scrollIntoView({ block: 'start' })` → `focus({ preventScroll: true })`.
  3. `ignoreClicksUntil = Date.now() + 500`. 터치에서 화면이 구른 뒤 같은 손가락이 계약 칸 단추를 누르지 않게 한다(DECISIONS 928행 규칙).
  4. 다시 그리지 않는다. 알림·알림 영역에 쓰지 않는다.

**HTML 구조**
- 오늘 할 일 칸과 경영 보고 칸 안에 `<section>`을 새로 넣지 않는다. 기존 시험이 `split('</section>')[0]`로 칸을 자른다(main.test.ts 71·368·919행). `<div>`·`<h3>`·`<h4>`를 쓴다.
- 새 단추·선택에 양수 `tabindex`를 쓰지 않는다. 화면 코드 순서가 곧 Tab 순서다.
- ‘금액은 확정 기준’ 문구를 새로 쓰지 않는다(main.test.ts 78행이 2개를 센다).
- 모든 글(직원·도시·상품 이름, 계약 ID, 엔진 문장)을 `esc()`로 넣는다(main.test.ts 296행 시험).
- 새 CSS는 규칙을 더하기만 한다. 기존 규칙 문자열을 바꾸지 않는다(main.test.ts 818~856행, 1252~1261행, 1065행, `crew-card.test.ts` 35·36행). 뿌리 `table.money td`에 `nowrap`을 걸지 않는다(830행).

### 1. 경영 보고 보강 (`reportPanel`, `src/ui/reports.ts`)

경영 보고 칸 안의 순서는 이렇다(화면 코드 순서 = 보이는 순서).

```
<section class="panel report" aria-labelledby="report-h">
  <h2 id="report-h">경영 보고 <small>하루 진행으로 확정된 상태 · 오늘 할 일은 하루 진행 뒤 반영</small></h2>
  [3절 결산 — 끝났을 때만]
  <div class="books"> USD 표(1-1 미지급금 행 추가) · KRW 표(그대로) </div>
  <div class="report-ops"> <h3>운영 지표</h3> 1-2 · 1-3 · 1-4 · 1-5 </div>
  <div class="why"> 1-6 현금과 이익이 다른 이유 </div>
</section>
```

- 캠페인이 끝났으면(`state.phase === 'ENDED'`) 1-4 업무 부하와 1-5 막힌 곳은 그리지 않는다. 더 진행할 날이 없어 ‘사람을 더 뽑아도…’ 같은 문장이 맞지 않는다. 1-2·1-3은 그린다.

`src/ui/reports.ts`에 순수 함수를 더한다. 상태·설정을 바꾸지 않고, `main.ts`를 import하지 않는다. HTML 조립과 계약 링크는 `main.ts`가 한다.

#### 1-1. USD 미지급금 행

- USD 표의 ‘자산 합계’ 행 바로 뒤에 `row('미지급금', usd(t.accountsPayable))`를 넣는다. 값은 양수로 쓴다(KRW 표 ‘미지급 급여’와 같은 방식, `reports.ts` 12행).
- KRW 표는 바꾸지 않는다.

#### 1-2. 정시 인도율

- `export function rateKo(basisPoints: number): string`
  - 정수 부분과 소수 둘째 자리까지 쓴다. 소수가 0이면 쓰지 않는다. 반올림하지 않는다.
  - 예: 10000 → `100%`, 6666 → `66.66%`, 5050 → `50.50%`, 1 → `0.01%`, 0 → `0%`.
- `const r = onTimeDeliveryRate(state)`로 문장을 만든다.
  - 인도 0건: `정시 인도율: 아직 인도한 계약이 없습니다.`
  - 그 밖: `정시 인도율 ${rateKo(r.rateBasisPoints)} — 인도 ${r.delivered}건 중 납기 안 ${r.onTime}건`
  - `r.late > 0`이면 다음 줄: `납기를 넘겨 인도한 계약: ` + 계약 링크를 `, `로 잇는다.
    - 대상은 `state.contracts` 가운데 취소가 아니고 `deliveredDay !== null && deliveredDay > deliveryDeadlineDay`인 계약이다. 엔진 함수와 같은 기준이다(engine/reports.ts 198~205행).
  - `r.pastDeadlineUndelivered > 0`이면 다음 줄: `납기가 지났는데 아직 인도하지 못한 계약: ${링크들} (인도하면 정시 인도율에 들어갑니다)`
    - 대상은 취소가 아니고 `deliveredDay === null && deliveryDeadlineDay < state.day`인 계약이다.
- 이 문장 만드는 함수는 3절 결산에서도 그대로 쓴다.

#### 1-3. 앞으로 낼 돈 (통화별)

- `const from = state.day`, `const to = Math.min(config.campaignDays, state.day + 6)`. `const rows = upcomingPayments(state, config, to)`.
- `export function upcomingSummary(rows: UpcomingPayment[], config: ScenarioConfig)`
  - 반환: `{ currencies: Currency[]; lines: { kind: UpcomingPaymentKind; labelKo: string; amounts: (number | null)[] }[]; undated: number }`
  - `currencies`: `config.tradeCurrency`, `config.payrollCurrency`, 그다음 `rows`에 나오는 다른 통화를 알파벳 순으로. 중복 없이.
  - `lines`: 늘 아래 4줄, 이 순서. `amounts[i]`는 그 종류·`currencies[i]` 행의 `amountMinor` 합. 행이 없으면 `null`.

    | kind | labelKo |
    |---|---|
    | OVERDUE | `밀린 지급 (현금이 들어오면 먼저 갚음)` |
    | WAGE | `급여 (하루 진행 때 자동)` |
    | FREIGHT | `운임 (운송편을 예약할 때)` |
    | DUTY | `관세 (도착할 때 자동)` |
  - `undated`: `day === null`인 행 수.
  - 서로 다른 통화의 값을 더하는 합계 줄·열은 만들지 않는다.
- HTML:
  - `<table class="money due-table"><caption>앞으로 낼 돈 (${from}~${to}일)</caption>`. `from === to`(90일)이면 `(${from}일)`.
  - 머리 줄: `항목` + 통화마다 `<th scope="col">${통화}</th>`.
  - 칸: `amounts[i] === null`이면 `—`, 아니면 `formatMoney(통화, 값)`.
  - 표 뒤: `<p class="muted small">통화가 달라 USD와 KRW를 더하지 않습니다.</p>`
  - `undated > 0`이면: `<p class="muted small">실을 편이 없어 날짜를 정하지 못한 지급이 ${undated}건 있습니다.</p>`
- 표 뒤 목록 `<ul class="due-list">`: `rows` 가운데 WAGE가 아닌 행을 쓴다. 없으면 목록을 만들지 않는다.
  - OVERDUE는 행마다 쓰지 않고 **통화마다 한 줄로 묶어** 맨 앞에 둔다(통화 순서는 `currencies`). `n` = 그 통화 OVERDUE 행 수, `첫날` = 가장 이른 `day`, `합` = `amountMinor` 합.
    `<li><span>${첫날}일부터</span>밀린 지급 ${n}건 (현금이 들어오면 먼저 갚음) <b>${formatMoney(통화, −합)}</b></li>`
    - 이유: 원화는 기본 진행에서 63일부터 매일 직원마다 미지급이 한 건씩 생긴다(DECISION-PACKET D01 ‘62일’). Claude가 `a13caa4`에서 1일 직접 무역 하나만 수락하고 90일을 열었더니 남은 미지급이 53건이었다. 행마다 쓰면 목록이 수십 줄이 된다.
  - 그 뒤 FREIGHT·DUTY 행을 함수 순서대로 쓴다.
  - FREIGHT: `` <li><span>${day === null ? '날짜 미정' : `${day}일까지`}</span>${contractLink(id)} 운송편 예약 때 운임 선지급 <b>…</b></li> ``
  - DUTY: `` <li><span>${day === null ? '날짜 미정' : `${day}일`}</span>${contractLink(id)} 도착 때 수입 관세 <b>…</b></li> ``
- 캠페인이 끝났으면(`state.phase === 'ENDED'`): 함수가 OVERDUE 행만 돌려준다. 캡션을 `남은 미지급 (캠페인 종료)`로 쓰고 OVERDUE 줄만 둔다. 목록은 위의 통화별 묶음 줄만 남는다. 미지급이 없으면 표 대신 `<p>캠페인이 끝나 앞으로 낼 돈은 없습니다.</p>`.

#### 1-4. 업무 부하

- `export function workloadLinesKo(summary: WorkloadSummary, config: ScenarioConfig): string[]` (이스케이프 전 글).
  - `byCity` 행마다(u = `unassignedWorkUnits`, r = `runningWorkUnits`, staff, dayTask, idle):
    `` ${cityName(config, cityId)}: 남은 업무 ${u + r}pt(배정 전 ${u}pt · 진행 중 ${r}pt), 하루 처리 ${staff − dayTask}pt${dayTask ? `(훈련·현지 활동 중 ${dayTask}pt 빼고)` : ''} → ${끝}. 지금 바로 맡길 수 있는 처리량 하루 ${idle}pt. ``
    - `끝`: `daysToClear === 0` → `남은 업무 없음`, `null` → `지금 이 업무를 처리할 사람이 없음`, 그 밖 → `약 ${daysToClear}일`.
  - `startingLater` 행마다: `${직원 이름}: ${availableFromDay}일부터 근무(하루 ${workUnitsPerDay}pt).`
  - 둘 다 없으면 `['직원과 남은 업무가 없습니다.']`.
- HTML: `<h4>업무 부하</h4><ul class="workload">${줄마다 <li>${esc(줄)}</li>}</ul><p class="muted small">한 사람은 한 번에 업무 하나만 맡아 실제로는 더 걸릴 수 있습니다. 처리량은 고정값이며 레벨·능력은 쓰지 않습니다.</p>`
- `workloadSummary(state, config)`를 쓴다.

#### 1-5. 막힌 곳 (돈·시간·사람·선복)

- `export type BottleneckKind = '돈' | '시간' | '사람' | '선복'`
- `export const BOTTLENECK_OF: Record<BlockerCode, BottleneckKind | null>` — `Record`로 써서 새 코드가 생기면 `tsc`가 잡게 한다.

  | 코드 | 분류 | 이유 |
  |---|---|---|
  | `TASK_UNASSIGNED` | 사람 | 준비 담당이 없다 |
  | `TASK_WILL_MISS_SAILING` | 사람 | 처리량이 출항에 못 미친다 |
  | `NO_BOOKING` | 선복 | 운송편 공간을 아직 잡지 않았다 |
  | `NO_SAILING_LEFT` | 선복 | 실을 공간이 남은 편이 없다 |
  | `NEXT_SAILING_LATE` | 시간 | 다음 편으로도 납기를 넘긴다 |
  | `BOOKED_SAILING_LATE` | 시간 | 예약한 편이 납기를 넘긴다 |
  | `WAITING_PORT_RESTRICTION` | 시간 | 항만 하역 중단으로 기다린다 |
  | `DUTY_UNPAID` | 돈 | 관세를 못 내 반출하지 못한다 |
  | `AWAITING_PAYMENT` | null | 기다리면 되는 상태(severity info) |
- `export function bottlenecks(s: GameState, config: ScenarioConfig): { kind: BottleneckKind; items: { contractId: string | null; textKo: string }[] }[]`
  - 늘 4묶음, 순서는 돈 → 시간 → 사람 → 선복.
  - `s.contracts`마다 `contractProgress(s, config, c).blockers`에서 `severity !== 'info'`이고 분류가 null이 아닌 것을 `{ contractId: c.id, textKo: messageKo }`로 넣는다. 계약 순서, 막힘 순서 그대로.
  - 돈 묶음 앞에 계약 없는 줄을 넣는다(`contractId: null`).
    - 통화마다(`config.tradeCurrency`, `config.payrollCurrency` 순, 같은 통화면 한 번) `fundsPosition(s, config, 통화).unpaidObligations > 0`이면: `미지급 ${formatMoney(통화, 합)}이 있습니다. 현금이 들어오면 먼저 갚습니다.`
    - `config.rules.fundsCheck === 'COMMITTED_OUTLAYS'`이고 거래 통화의 `available < 0`이면: `사용 가능 자금이 ${formatMoney(거래 통화, available)}입니다. 체결한 계약의 운임·관세 예약이 현금보다 많습니다.`
- HTML: `<h4>막힌 곳</h4><ul class="bottleneck">` 묶음마다
  - 0건: `<li><b>${kind}</b> 없음</li>`
  - 그 밖: `<li><b>${kind}</b> ${n}건<ul>${항목마다 <li>${contractId ? contractLink(contractId) + ' ' : ''}${esc(textKo)}</li>}</ul></li>`
  - 돈·시간·선복 건수 합 n > 0이면 목록 뒤에: `<p class="muted small">사람을 더 뽑아도 돈·시간·선복 쪽 막힘 ${n}건은 풀리지 않습니다.</p>` (CL-03)
- 판단을 지시하는 문장(‘고용하세요’ 등)은 넣지 않는다.

#### 1-6. 현금과 이익이 다른 이유

- `why` 배열을 HTML 조각 배열로 바꾼다. 글은 조각마다 `esc()`하고, 계약 ID 자리에만 `contractLink`를 넣는다.
- 매출채권 줄(652행): 문장은 그대로 두고, `i.contractId`만 `contractLink(i.contractId)`로 바꾼다.
- 재고 줄·고객 화물 줄: 2절.
- 새 줄(UX-15, CL-01). `t = r.trade`, `p = r.payroll`, `runway = payrollRunwayKo(payrollRunwayDay(state, config), state.day, config.campaignDays)`.
  - `t.profit > 0`이면: `거래 손익 ${usd(t.profit)}는 달러 장부의 이익입니다. 급여 같은 원화 비용은 원화 현금 ${krw(p.cash)}에서만 나갑니다(원화 급여 지급 가능일: ${runway}). 이번 판에는 달러를 원화로 바꾸는 기능이 없습니다.`
    - 캠페인이 끝났으면 괄호 `(원화 급여 지급 가능일: …)`를 쓰지 않는다. 끝난 상태(91일)에서는 `payrollRunwayDay`가 반복 없이 null을 돌려 미지급이 있어도 ‘90일(캠페인 끝)까지’로 나온다(`previews.ts` 43행).
  - 아니고 `p.accountsPayable > 0`이면: `원화 미지급 급여 ${krw(p.accountsPayable)}가 있습니다. 달러 현금 ${usd(t.cash)}로는 원화 급여를 낼 수 없습니다. 이번 판에는 달러를 원화로 바꾸는 기능이 없습니다.`
  - 이 줄은 기존 줄들 뒤, ‘지금은 현금과 장부가…’ 대체 문장(659행) 앞에서 `why`에 넣는다. 대체 문장 규칙(`!why.length`)은 그대로다.

### 2. 품목별 화물 (TASK-0015 후속)

`src/ui/reports.ts`에 더한다.

```ts
/** main.ts 144~147행을 옮긴다. 출력 글자는 같다. */
export function qtyKo(config: ScenarioConfig, goodId: string, quantity: number): string;
/** companyReport(engine/reports.ts 46~49행)와 같은 기준: owner 일치, status가 DELIVERED·RETURNED_TO_OWNER가 아님.
 *  config.goods 순서. 수량 0인 상품은 뺀다. */
export function heldCargoByGood(s: GameState, config: ScenarioConfig, owner: 'COMPANY' | 'CUSTOMER'): { goodId: string; quantity: number }[];
/** qtyKo를 ' · '로 잇는다. 빈 목록은 '없음'. */
export function cargoListKo(config: ScenarioConfig, items: { goodId: string; quantity: number }[]): string;
```

- `main.ts`의 `qtyKo`는 `qtyKo(config, …)`를 부르는 한 줄로 바꾼다. 다른 화면 글자는 그대로다.
- 바꾸는 네 곳(`company = cargoListKo(config, heldCargoByGood(state, config, 'COMPANY'))`, `customer`도 같은 방식):
  - 654행: `재고 ${company}(${usd(t.inventory)})는 현금이 이미 나갔지만 팔기 전까지 비용이 아닙니다.`
  - 657행: `맡은 고객 화물 ${customer}는 고객 자산이라 위 표 어디에도 없습니다. 우리 몫은 서비스 대금뿐입니다.`
  - 667행: 행 이름 `재고 (${company})`.
  - 669행: `맡은 고객 화물 ${customer} — 회사 자산이 아니라 표에 넣지 않습니다.`
  - 모두 `esc()`로 넣는다.
- `companyReport`와 엔진 시험의 합계 값(`m2a-multi.test.ts` 106·108행)은 그대로다. 합계 숫자는 화면에서 쓰지 않는다.
- **Claude 확인:** `a13caa4`에서 1일에 운송 주선 견적 둘을 수락하고 하루 진행하면 보고에 ‘맡은 고객 화물 320개’가 두 곳 보인다(가구는 개, 자동차 부품은 상자).

### 3. 90일 결산과 종료 표시 (B36의 9b)

#### 3-1. 언제 보이나

- `state.phase === 'ENDED'`일 때만 경영 보고 맨 앞(제목 바로 뒤)에 보인다. 진행 중에는 보이지 않는다.
- 저장을 불러와 끝난 상태가 되어도 보인다.

#### 3-2. 내용 (`const sum = campaignSummary(state, config)`)

```
<div class="settlement">
  <h3 id="settlement-h" tabindex="-1">${sum.campaignDays}일 결산</h3>
  <p>통화마다 따로 결산합니다. USD와 KRW는 더하지 않습니다.</p>
  <div class="books"> 통화마다 표 한 개 </div>
  <p>계약 ${total}건 — 수금 완료 ${completed}건 · 인도 뒤 수금 대기 ${awaitingPayment}건 · 진행 중 ${inProgress}건 · 취소 ${cancelled}건</p>
  <p>(1-2의 정시 인도율 문장)</p>
  <p>받지 못한 대금: …</p>
  <p>남은 미지급 …</p> (통화별 줄 + 닫힌 목록, 아래)
</div>
```

- 표: `sum.byCurrency` 순서. `<table class="money"><caption>결산 · ${currency}</caption>`. 캡션을 기존 ‘거래 장부 · USD’·‘운영 장부 · KRW’와 다르게 쓴다(기존 시험이 그 캡션으로 표를 찾는다).
- 행(`export function settlementRows(st: CurrencyStanding, config: ScenarioConfig): [string, number, boolean][]`, 셋째 값은 ‘합계 줄’ 여부). 이 순서:

  | 행 | 값 | 보일 때 |
  |---|---|---|
  | 현금 | `cash` | 늘 |
  | 재고 | `inventory` | 거래 통화이거나 0이 아님 |
  | 선급운임 | `prepaidFreight` | 같음 |
  | 주선 진행원가 | `forwardingWip` | 같음 |
  | 매출채권 | `accountsReceivable` | 같음 |
  | 자산 합계 (합계 줄) | `totalAssets` | 늘 |
  | 미지급금 | `accountsPayable` | 늘 |
  | 순자산 (자산 − 미지급금) (합계 줄) | `netAssets` | 늘 |
  | 시작 자본 | `openingEquity` | 늘 |
  | 손익 | `profit` | 늘 |
  | 계약 기여이익 합계 | `contractContribution` | 거래 통화이거나 0이 아님 |
  - 값은 `formatMoney(st.currency, 값)`.
- 받지 못한 대금: `sum.openInvoices`를 `${contractLink(contractId)} ${dueDay}일 ${formatMoney(통화, 금액)}`로 `, ` 이음. 없으면 `없음`.
- 남은 미지급: 없으면 `<p>남은 미지급: 없음</p>`. 있으면 통화마다(`sum.byCurrency` 순서) 한 줄로 묶는다. 수십 건이 될 수 있다(1-3의 ‘이유’).
  - `<p>남은 미지급 ${통화}: ${formatMoney(통화, 합)} — ${n}건, ${첫 발생일}~${마지막 발생일}일 발생</p>` (발생일이 하루뿐이면 `${첫 발생일}일 발생`)
  - 그 뒤 `<details class="muted small"><summary>남은 미지급 목록 (${전체 건수}건)</summary><ul>${항목마다 <li>${incurredDay}일 ${esc(reasonKo)} ${formatMoney(통화, 금액)}</li>}</ul></details>`. 닫혀 있다.
- 점수·등급·실패 판정·통화 합계 줄은 없다.

#### 3-3. 끝난 뒤 다른 표시

- `queuePanel`(742~752행), 끝났을 때:
  - 제목 작은 글: `${config.campaignDays}일 · 캠페인 종료`. 지금은 `91일 · 하루 진행 때 이 순서로 실행`이 나온다(Claude 확인).
  - 대기 목록 자리: `<p class="muted">캠페인이 끝났습니다. 결산은 경영 보고에 있습니다.</p><button class="link" data-action="skip-to" data-target="settlement-h">결산 보기</button>`
  - 일정(4절)은 그리지 않는다. 성장 알림(750행)은 그대로다.
- 건너뛰기 처리(914~920행): 허용 대상에 `settlement-h`를 더한다. 맨 위 건너뛰기 두 단추는 그대로다.
  - 주의: `main-testkit.ts`의 흉내(75행)는 `data-action="skip-to"`인 요소를 모두 `.skip-links` 안으로 본다. ‘결산 보기’ 단추로 focusin·Shift+Tab 시험을 쓰지 않는다. 실제 화면에서 이 단추는 `.skip-links` 밖이다.
- 저장 알림(1011행)과 불러오기 알림(1086행)의 날짜는 `Math.min(state.day, config.campaignDays)`로 쓴다. 내보내기 파일 이름(1030행)은 그대로다.
- 그 밖에 끝난 화면에 `${config.campaignDays + 1}일`이 나오는 곳이 있으면 같은 방식으로 고친다. 엔진 기록 문장이면 고치지 않고 ‘범위 밖 발견’에 적는다.

#### 3-4. 하루 진행으로 끝났을 때 (`endDay`)

- 하루 진행으로 `state.phase`가 `ENDED`가 되면:
  1. 알림: `ui.flash = { kind: rejected.length ? 'warn' : 'info', text }`. `text`는 (거절이 있으면 기존 `실행하지 못한 명령: …` 문장 + 공백) + `${config.campaignDays}일 캠페인이 끝났습니다. 경영 보고의 ${config.campaignDays}일 결산에서 통화별 결과를 확인하세요.` 문화 결과 알림보다 앞선다. `ui.cultureResultFresh = false`.
  2. `render()` 뒤 `document.getElementById('settlement-h')!`에 `scrollIntoView({ block: 'start' })` → `focus({ preventScroll: true })`.
  3. `ignoreClicksUntil = Date.now() + 500`. 읽던 자리 복원(232~233행)은 하지 않고 끝낸다.
- 끝나지 않은 날의 흐름(192~233행)의 기존 줄은 바꾸지 않는다. 더하는 것은 이 절의 끝난 날 분기와 4-5절의 `schedulePrev` 한 줄뿐이다. 분기는 230행 뒤, 231행 `render()` 앞에 넣는다. 분기 안에서 알림을 바꾸고(1) 그린 뒤 결산으로 옮기고(2) 500ms 막기를 걸고(3) `return`한다. 그래서 232~233행(읽던 자리 복원)은 끝난 날에 돌지 않는다.
- **Claude 확인:** 시제품에서 90일 저장을 가져와 하루 진행하면 `scrollIds`가 `['settlement-h']`, 초점이 `settlement-h`, `scrollBy` 0회, 화면의 ‘91일’ 0건이었다.

### 4. 일정 (새 `src/ui/schedule.ts`)

#### 4-1. 함수

```ts
export type ScheduleKind = 'TASK_DONE' | 'DEPARTURE' | 'ARRIVAL' | 'DELIVERY' | 'DEADLINE' | 'RECEIPT' | 'PAYMENT';

export interface ScheduleItem {
  /** 하루 전후 비교용. 아래 표. */
  key: string;
  kind: ScheduleKind;
  /** 지난 날짜(밀린 지급·지난 납기)는 오늘보다 작다. 정할 수 없으면 null. */
  day: number | null;
  contractId: string | null;
  /** 계약 ID를 뺀 글. 화면이 앞에 계약 ID(또는 링크)를 붙인다. */
  textKo: string;
  /** 지금 처리량·운항표로 계산한 날이면 true. 계약·운항표·장부로 정해진 날이면 false. */
  estimate: boolean;
  /** 들어오는 돈은 양수, 나가는 돈은 음수. 한 항목은 한 통화다. */
  money: { currency: Currency; amountMinor: number } | null;
}

/** to = min(campaignDays, day + 6). upcomingPayments 기본 창과 같다. */
export function scheduleWindow(s: GameState, config: ScenarioConfig): { from: number; to: number };
/** day가 null이거나, 오늘보다 앞이거나(밀린 지급·지난 납기), s.day ≤ day ≤ throughDay인 항목.
 *  throughDay 기본값은 scheduleWindow(s, config).to. */
export function scheduleItems(s: GameState, config: ScenarioConfig, throughDay?: number): ScheduleItem[];
/** scheduleItems(s, config, config.campaignDays)의 key → day. */
export function scheduleKeys(s: GameState, config: ScenarioConfig): Record<string, number | null>;
export function scheduleBlock(s: GameState, config: ScenarioConfig, opts: {
  open: boolean; prev: Record<string, number | null> | null; link: (contractId: string) => string;
}): string;
```

- 순수 함수다. 입력을 바꾸지 않는다. `Date`·`Math.random`을 쓰지 않는다. `engine.ts`의 `commitDay`·`planState`를 부르지 않는다.
- `s.phase === 'ENDED'`이면 `scheduleItems`는 밀린 지급(OVERDUE) 항목만 돌려준다.
- 정렬: (1) 지난 날짜 묶음(안에서도 날짜순), (2) 오늘부터 날짜순, (3) 날짜 미정 묶음. 같은 날·같은 묶음 안에서는 `kind` 순서(위 타입 순서), 그다음 `key` 문자열 순(로케일 비교 쓰지 않음).

#### 4-2. 항목 규칙

진행 중 계약 = `status`가 `ACTIVE`·`IN_PROGRESS`. 계약 도착 예정일 A와 인도 예정일 D는 아래 ARRIVAL·DELIVERY 규칙으로 정한다.

| kind | 대상 | day | textKo | estimate | money | key |
|---|---|---|---|---|---|---|
| TASK_DONE | `RUNNING`이고 담당이 있고 `isAvailableFromToday`인 업무 | `s.day + ceil((required − progress) ÷ 하루량) − 1`. 하루량은 일수 업무(`isDayBasedTask`) 1, 그 밖은 담당의 `workUnitsPerDay` | 준비 업무(`contractId` 있음): `${taskName(kind)} 완료 — ${담당 이름}`. 훈련: `일반 훈련 완료 — ${이름}`. 조사·의뢰·현지 활동: `${taskSubjectKo} ${taskName(kind)} 완료 — ${이름}` | true | null | `TASK:${task.id}` |
| DEPARTURE | `BOOKED`이고 `departureDay ≥ s.day`인 예약 | `departureDay` | `출항 — ${출발 도시} → ${도착 도시}` (`routeOf`·`cityName`) | false | null | `DEP:${booking.id}` |
| ARRIVAL | 진행 중·미인도 계약 가운데 A가 있는 것. 떠난 화물(`arrivalDay === null`)이면 A = `max(scheduledArrivalDay, s.day)`. 떠나기 전 `BOOKED` 예약이면 A = `departureDay + transitDays`. 이미 도착한 화물·예약 없는 계약은 A가 없어 항목을 만들지 않는다 | A | `customsDays === 0`이면 `도착·인도 — ${도착 도시}`, 아니면 `도착 — ${도착 도시}` | true | null | `ARR:${계약}` |
| DELIVERY | `config.terms.customsDays > 0`일 때만. 도착한 화물은 `dutyPaid`이면 `max(releaseDay, s.day)`, 아니면 null. 도착 전은 A + customsDays. A도 없고 도착도 안 했으면 항목을 만들지 않는다 | D | `인도` | true | null | `DLV:${계약}` |
| DEADLINE | 진행 중·미인도 계약 | `deliveryDeadlineDay` | 오늘보다 앞이면 `납기 지남 (${deliveryDeadlineDay}일)`, 아니면 `납기` | false | null | `DUE:${계약}` |
| RECEIPT | (가) 미수 청구서(`status !== 'PAID'`): `dueDay`, 금액 +`amountMinor`, estimate false. (나) 진행 중·미인도 계약이고 D가 있음: `max(paymentDueDay, D)`, 금액 +(`saleAmountMinor` − (D > 납기이면 `lateDeliveryPriceReductionMinor`, 아니면 0)), estimate true | | `수금` | | 계약 통화 | `RCV:${계약}` |
| PAYMENT | `upcomingPayments(s, config, throughDay)`의 행 | 행의 `day` | 아래 | false | −`amountMinor`, 행 통화 | 아래 |

- 인도 예정일 D: 도착한 화물이면 `dutyPaid ? max(releaseDay, s.day) : null`. 도착 전이면 A + `customsDays`. A가 없으면 null. 엔진은 인도한 날 바로 청구하고 `dueDay = max(paymentDueDay, 인도일)`로 둔다(engine.ts 1044행).
  - `max(…, s.day)`인 이유: 밀린 관세는 인도 처리(819행) 뒤의 밀린 지급(822행, 1151~1154행)에서 `dutyPaid`가 된다. 그 화물은 다음 날 인도되므로 `releaseDay`가 오늘보다 앞일 수 있다.
- PAYMENT의 글과 key:
  - WAGE: 통화마다 가장 이른 행을 `${labelKo} (매일)`로 넣는다. 그 뒤 날은 금액이나 `employeeIds`가 그 통화의 앞날 행과 다를 때만 `${labelKo}로 바뀜`으로 넣는다. key는 `PAY:WAGE:${통화}:${amountMinor}:${employeeIds.length}`.
  - FREIGHT: `운송편 예약 마감 · 운임 선지급`. key `PAY:FREIGHT:${sourceId}`.
  - DUTY: `수입 관세`. key `PAY:DUTY:${sourceId}`.
  - OVERDUE: 행마다 넣지 않고 **통화마다 항목 하나**로 묶는다(1-3과 같은 이유). day = 가장 이른 `day`, money = −(그 통화 `amountMinor` 합), 글 `밀린 지급 ${n}건 (${day}일부터, 현금이 들어오면 먼저 갚음)`. key `PAY:OVERDUE:${통화}`.
  - FREIGHT·DUTY는 `contractId`를 채운다.
- **Claude 확인:** `a13caa4` 사본에서 M2 설정을 복사해 훈련 일수를 3으로 바꾸고, 1일 `acceptAllFeasible` 명령을 `planState`로 반영한 사본에 위 규칙을 적용했다. 업무 완료·출항·도착·수금 예정일이 90일까지 엔진을 돌린 실제 값과 모두 같았다. 3일 훈련의 완료 예정일도 시작 날·이튿날 모두 엔진과 같았다.

#### 4-3. 화면 (`scheduleBlock`)

```
<div class="schedule-block">
  <button class="link" id="schedule-toggle" data-action="schedule-toggle" aria-expanded="${open}" aria-controls="schedule-body">앞으로 ${to − from + 1}일 일정 (${n}건)</button>
  [open일 때]
  <div id="schedule-body">
    <ol class="schedule-days">
      [<li><b>지난 날짜</b><ul>…</ul></li>]
      <li><b>${d}일${d === s.day ? ' (오늘)' : ''}</b><ul>…</ul></li>   ← 항목이 있는 날만
      [<li><b>날짜 미정</b><ul>…</ul></li>]
    </ol>
    [<p class="muted small">그 뒤 일정 ${k}건 — 가장 가까운 날은 ${min}일입니다.</p>]
    <p class="muted small">‘예상’은 지금 처리량과 운항표로 계산한 날입니다. 사건이 생기면 바뀔 수 있습니다.</p>
  </div>
</div>
```

- `n`: `scheduleItems(s, config, to)`의 항목 수.
- 항목이 0건이면 목록 대신 `<p class="muted">앞으로 ${to − from + 1}일 동안 정해진 일이 없습니다.</p>`.
- ‘그 뒤 일정’: `scheduleItems(s, config, config.campaignDays)` 가운데 `day > to`인 항목 수 k와 가장 이른 날. k가 0이면 줄을 쓰지 않는다.
- 항목 한 줄: `` <li>${contractId ? link(contractId) + ' ' : ''}${esc(textKo)}${money ? ` <b>${amount > 0 ? '+' : ''}${formatMoney(currency, amount)}</b>` : ''}${estimate ? ' <span class="tag">예상</span>' : ''}${변화 표시}</li> ``
- 색만으로 구분하지 않는다. ‘예상’·‘새 일정’·‘날짜 바뀜’은 글자로 보인다.

#### 4-4. 화면 연결 (`main.ts`, `session.ts`)

- `initialUiState`에 `scheduleOpen: false`, `schedulePrev: null as Record<string, number | null> | null`을 더한다. 시작·불러오기·가져오기·처음부터·시나리오 바꾸기에서 초기화된다(`resetUi` 117~124행).
- `queuePanel`의 성장 알림(750행) 바로 뒤에 `scheduleBlock(view, config, { open: ui.scheduleOpen, prev: ui.schedulePrev, link: contractLink })`를 둔다. 끝났을 때는 두지 않는다(3-3절).
- `case 'schedule-toggle'`: `ui.scheduleOpen = !ui.scheduleOpen; render(); ignoreClicksUntil = Date.now() + 500;` (성장 상세 948~952행과 같은 방식). 알림을 바꾸지 않는다.
- 기본은 접힘이다(아래 ‘예상 질문’).

#### 4-5. 새 일정·날짜 바뀜 (시간이 모자라면 뺄 수 있음 2번)

- `endDay()`에서 하루 진행이 성공한 뒤, 224행에서 `state`를 바꾸기 **전에** `ui.schedulePrev = scheduleKeys(view, config)`를 둔다. `view`는 마지막으로 그린 ‘오늘 실행 예정’ 사본이다. 하루 진행이 실패하면(185~190행) 바꾸지 않는다.
- 표시 규칙(`prev`가 null이면 표시 없음):
  - `!(key in prev)`: ` <span class="tag">새 일정</span>`
  - `key in prev`이고 `prev[key] !== day`이고 key가 `PAY:WAGE:`·`PAY:OVERDUE:`로 시작하지 않음: ` <span class="tag">날짜 바뀜 (원래 ${prev[key] ?? '날짜 미정'}${prev[key] === null ? '' : '일'})</span>`
- 비교 범위가 캠페인 끝까지라서, 창 밖에 있다가 창 안으로 들어온 항목은 ‘새 일정’이 아니다.

### 5. 동료 직무·속성 필터 (B48 중 UX-34)

- `card.ts`에 더한다(export만, 기존 출력 불변):
  - `export function roleKo(role: string): string` — `ROLE_KO[role] ?? role`.
  - `export function attributeKo(attribute: string | null): string` — `ATTRIBUTE`의 `ko`, 없으면 `속성 미정`.
- `recruitment.ts`:
  - `crewEntries(s, config, filter, facets: { role?: string | null; attribute?: string | null } = {})`. 기존 세 인수 호출의 결과는 그대로다. 직무는 `def.role`, 속성은 `def.character.attribute ?? 'none'`과 비교한다. 상태 필터와 함께 걸린다(그리고).
  - `export function crewFacetOptions(s, config): { roles: string[]; attributes: string[] }` — `crewEntries(s, config, 'all')`(고용한 직원 + 발견한 후보)의 값만, `config.employees` 순서, 중복 없이. 미발견 후보의 직무·속성은 선택지에 나오지 않는다(DECISIONS 400행).
- `session.ts`: `crewRole: null as string | null`, `crewAttribute: null as string | null`.
- `crewPanel`(689행 상태 필터 줄 바로 뒤):
  ```
  <div class="crew-facets" role="group" aria-label="직무·속성으로 걸러 보기">
    <label>직무 <select id="crew-role" data-action="crew-role"><option value="">전체</option>…</select></label>
    <label>속성 <select id="crew-attr" data-action="crew-attr"><option value="">전체</option>…</select></label>
  </div>
  ```
  - 선택지 글은 `roleKo`·`attributeKo`. 고른 값에 `selected`.
  - 선택지가 2개 이상인 선택만 그린다. 둘 다 1개 이하면 `div`도 그리지 않는다. 그래서 직원이 한 명인 M1 동료 칸은 지금과 같다.
  - 카드와 운영표는 같은 `shown` 목록을 쓴다(681·685·690행). 필터는 둘 모두에 걸린다(REF-01·05).
- change 처리(1050행 이후): `crew-role`·`crew-attr`이면 값을 `ui.crewRole`·`ui.crewAttribute`에 넣고(빈 값은 null) `render()`. 초점은 기존 초점 복원(831~840행)이 같은 선택으로 돌려준다.
- 결과가 0명이면 기존 문구 `이 조건의 동료가 없습니다.`(690행)가 나온다.
- 실루엣·미발견 칸·계수기·‘미발견 후보 n명’ 문구는 바꾸지 않는다(D12 대기).

### 6. 측정 시나리오 4개 (시간이 모자라면 뺄 수 있음 1번)

`tools/browser/scenarios/`에 새 JSON 4개를 만든다. 형식은 기존 시나리오와 같다(`schema`·`id`·`title_ko`·`source_ko`·`profiles`·`steps`·`expect`). 선택자는 화면 속성과 id만 쓴다. 도시·견적·직원 ID를 쓰지 않는다(`lib.test.mjs` 70~89행 검사).

단계 칸 이름은 `lib.mjs` 61~67행을 따른다: `end-day`는 `times`, `wait`는 `ms`, `scroll-to`는 `offset_from_bar`, `select`는 `value`, `measure`는 `what`과 `selector` 또는 `ref`. `remember`의 대상은 `id`가 있어야 한다(`lib.mjs` 155행). 아래 단계 목록을 그대로 쓴다. 기대 항목에는 기존처럼 `"profiles"`와 `"source_ko"`를 단다.

1. `report-contract-link.json` (`"profiles": "all"`)
   ```
   { "do": "tap", "selector": "[data-action=\"accept\"][data-buy]" },
   { "do": "end-day", "times": 1 },
   { "do": "scroll-to", "selector": ".report [data-action=\"goto-contract\"]", "offset_from_bar": 200 },
   { "do": "tap", "selector": ".report [data-action=\"goto-contract\"]" },
   { "do": "wait", "ms": 350 },
   { "do": "measure", "name": "contract_from_bar", "what": "top-from-bar", "selector": "[id^=\"contract-h-\"]" },
   { "do": "measure", "name": "overflow_x", "what": "overflow-x" }
   ```
   - expect: `contract_from_bar` −2~8, `overflow_x` 0~0.
2. `schedule-toggle.json` (`"profiles": "all"`)
   ```
   { "do": "tap", "selector": "[data-action=\"accept\"][data-buy]" },
   { "do": "end-day", "times": 1 },
   { "do": "scroll-to", "selector": "#schedule-toggle", "offset_from_bar": 150 },
   { "do": "remember", "name": "toggle", "selector": "#schedule-toggle" },
   { "do": "tap", "selector": "#schedule-toggle" },
   { "do": "wait", "ms": 350 },
   { "do": "measure", "name": "toggle_moved", "what": "moved", "ref": "toggle" },
   { "do": "measure", "name": "overflow_x", "what": "overflow-x" }
   ```
   - expect: `toggle_moved` −1~1, `overflow_x` 0~0.
3. `crew-facet.json` (`"profiles": "all"`)
   ```
   { "do": "scroll-top" },
   { "do": "measure", "name": "res_h_top_day1", "what": "top", "selector": "#res-h" },
   { "do": "scroll-to", "selector": "#crew-role", "offset_from_bar": 120 },
   { "do": "remember", "name": "facet", "selector": "#crew-role" },
   { "do": "select", "selector": "#crew-role", "value": "operations" },
   { "do": "wait", "ms": 350 },
   { "do": "measure", "name": "facet_moved", "what": "moved", "ref": "facet" },
   { "do": "measure", "name": "overflow_x", "what": "overflow-x" }
   ```
   - expect: `facet_moved` −1~1, `overflow_x` 0~0. `res_h_top_day1`은 기대 없이 기록만 한다(Claude가 `a13caa4`와 비교).
   - `operations`는 직무 값이다. M2 1일에 고용한 두 직원의 직무가 달라 직무 선택이 그려진다(`data/employees.json`).
4. `campaign-end.json` (`"profiles": ["l1366", "cb1366t", "t1000"]`)
   ```
   { "do": "end-day", "times": 90 },
   { "do": "wait", "ms": 400 },
   { "do": "measure", "name": "settlement_from_bar", "what": "top-from-bar", "selector": "#settlement-h" },
   { "do": "measure", "name": "overflow_x_end", "what": "overflow-x" }
   ```
   - expect: `settlement_from_bar` −2~8, `overflow_x_end` 0~0.
- `source_ko`에는 이 지시서의 절(예: ‘TASK-0023 구현 지시 3-4’)을 적는다.
- `tools/browser/lib.test.mjs` 8행 `names`에 네 이름을 더한다. 그 밖의 줄은 바꾸지 않는다.
- 확인: `npm run build` 뒤 시나리오마다 `node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/<이름>.json --dry-run`이 종료 코드 0이다. 브라우저 실행은 하지 않는다.

## 바꿔도 되는 기존 단언

없다.

- **Claude 확인:** `a13caa4` 사본에 이 설계의 간이 시제품을 넣고 기존 시험을 돌렸다. 넣은 것은 USD 미지급금 행, 품목별 화물 네 곳, 정시 인도·지급 목록·업무 부하의 간단한 줄과 계약 링크, 끝났을 때의 결산 칸·오늘 할 일 제목·결산 이동·불러오기 알림 날짜, 일정 단추(오늘 할 일 칸 성장 알림 뒤), 동료 필터 선택 두 개다. `tsc` 통과, 31개 파일·891개 시험이 모두 그대로 통과했다(할 일 1). 막힌 곳(1-5)과 이유 줄 링크(1-6)는 시제품에 넣지 않았다.
- 기존 시험 파일에서 지울 수 있는 줄은 import 줄뿐이다(새 이름을 import 줄에 더할 때).

## 테스트

새 시험 파일은 `src/ui/schedule.test.ts` 하나다. vitest 파일 수는 31 → 32개다. 나머지는 기존 파일에 더한다.

### `schedule.test.ts`

1. **예정일 = 엔진 실제 값.**
   - `cfg = structuredClone(M2 설정)`, `cfg.growth!.ordinaryTraining.durationDays = 3`.
   - 1일: `cmds = acceptAllFeasible(open, cfg)`, `items = scheduleItems(planState(open, cfg, cmds).state, cfg, cfg.campaignDays)`.
   - `end = runToCampaignEnd(open, cfg, { 1: cmds }).state`에서 실제 값을 찾아 비교한다.
     - TASK_DONE → 그 업무의 `completedDay`.
     - DEPARTURE → 그 예약으로 떠난 화물의 `departureDay`.
     - ARRIVAL → 그 계약 화물의 `arrivalDay`.
     - DEADLINE → 계약의 `deliveryDeadlineDay`.
     - RECEIPT → 계약의 `completedDay`(수금일), 금액 = 그 계약 청구서 `amountMinor`.
   - TASK_DONE·DEPARTURE·ARRIVAL·DEADLINE·RECEIPT·PAYMENT가 하나 이상씩 있었는지도 단언한다.
   - DELIVERY: 같은 설정에서 `cfg.terms.customsDays = 1`로 바꾼 합성 설정을 한 번 더 돌린다. DELIVERY 날이 계약의 `deliveredDay`와 같고, ARRIVAL 글이 `도착 — …`(‘도착·인도’ 아님)이다.
   - 반출일이 지난 화물: 위 합성 설정에서 첫 계약 화물이 도착한 날 A의 다음 날(A+1일)을 연 상태를 `structuredClone`하고 그 화물의 `releaseDay`를 `s.day − 1`로 바꾼다(밀린 관세를 늦게 낸 경우를 흉내 냄). DELIVERY 날이 `s.day`이고 RECEIPT 날이 `max(paymentDueDay, s.day)`다. 이 상태를 `commitDay`로 마감하면 그 계약의 `deliveredDay`도 `s.day`다(엔진에서 `releaseDay`를 읽는 곳은 995행 인도 조건뿐이다, Claude 확인).
   - M2의 `customsDays`는 0이다(Claude 확인). 그래서 DELIVERY는 합성 설정에서만 시험된다.
2. **일수 업무.** 테스트 1의 `cfg`(훈련 3일)로 한다. M2 기본 훈련은 1일이라 2일 상태에 진행 중 훈련이 남지 않는다. 1일에 첫 직원(`cfg.employees[0]!.id`) 훈련만 넣은 사본과, 1일을 마감한 2일 상태에서 TASK_DONE 날이 엔진의 `completedDay`와 같다.
3. **급여 줄 압축.** 합성 상태: 1일 상태를 `structuredClone`하고 후보 한 명(`config.recruitment!.candidateEmployeeIds[0]`)을 `employmentStatus: 'employed'`, `availableFromDay: day + 2`로 바꾼다.
   - WAGE 항목은 정확히 두 개다: 1일 `${labelKo} (매일)`, 3일 `${labelKo}로 바뀜`.
   - 금액은 같은 상태의 `upcomingPayments` 1일·3일 행 금액의 음수다. 2·4~7일 WAGE 항목은 없다.
   - **Claude 확인:** 1·2일 160,000원(2명), 3일부터 270,000원(3명).
4. **지난 날짜·날짜 미정.**
   - 합성 미지급: M2 설정을 복사해 `startingCash.KRW = (1일 근무 직원 일급 합) − 1`. 1일을 마감한 2일 상태에서 OVERDUE 항목의 `day`가 1이고, 정렬 맨 앞이다.
   - 미지급 묶음: 같은 설정으로 2일도 마감한 3일 상태. 원화 미지급이 2건 이상이다(`state.obligations`로 확인). OVERDUE 항목은 통화마다 하나뿐이고, 금액은 −`fundsPosition(s, config, 'KRW').unpaidObligations`, 글은 미지급 건수와 가장 이른 발생일로 만든 `밀린 지급 ${n}건 (${첫날}일부터, 현금이 들어오면 먼저 갚음)`이다.
   - 지난 납기: 납기를 넘기는 편을 예약한 계약(테스트 5의 상태)에서 납기 다음 날 DEADLINE 항목의 글이 `납기 지남 (${deliveryDeadlineDay}일)`이고 맨 앞 묶음이다.
5. **늦은 편과 감액.** `tradePairs(config)[0]` 쌍을 1일에 수락한다. 계획은 첫 직원과 `listSailings(…, 2)`에서 `scheduledArrivalDay + customsDays > 납기`인 첫 편이다. RECEIPT 예상 금액이 엔진 청구서 금액(감액 반영)과 같다.
   - **Claude 확인(`a13caa4`):** 이 수락은 받아들여진다. 납기 8일, 9일 편, 14일 인도·청구·수금(판매대금 1,400.00 USD → 1,350.00 USD). 인도한 날 바로 수금하므로 ‘인도했지만 수금 전’ 상태는 생기지 않는다. 15일부터 이 계약은 `COMPLETED`다.
6. **새 일정·날짜 바뀜.**
   - `prev = {}`이면 모든 항목에 ‘새 일정’이 붙는다. `prev = scheduleKeys(같은 상태)`이면 표시가 0건이다.
   - 합성 항만 대기: 테스트 1의 첫 계약 도착일 A와 도착 도시를 엔진 실행에서 구한다. `cfg.portRestrictions = [{ eventInstanceId: 'SYNTH-WAIT', templateId: 'SYNTH', cityId: 도착 도시, announceDay: 1, startDay: A, endDay: A, forecastKo: '시험용 가상 공지' }]`.
   - A일을 연 상태의 `scheduleKeys`를 `prev`로 두고, A일을 마감해 A+1일을 연 상태의 `scheduleBlock`에 `날짜 바뀜 (원래 ${A}일)`이 그 계약 줄에 있다. WAGE 줄에는 ‘날짜 바뀜’이 없다.
7. **끝난 캠페인.** `runToCampaignEnd` 결과에서 `scheduleItems`는 OVERDUE 항목만, 통화마다 하나씩 돌려준다(기본 진행이면 원화 미지급이 수십 건이어도 항목은 하나).
8. **순수성·통화.** 입력 상태가 바뀌지 않는다(`structuredClone` 비교). 모든 `money`는 한 통화이고, 같은 줄에 두 통화가 없다.
9. **이스케이프.** 직원·도시 이름을 `<img src=x onerror=alert(1)>`로 바꾼 설정에서 `scheduleBlock(…, { open: true, … })` 결과에 그 글이 그대로 없고 `esc()` 글이 있다.

### `trade-reports.test.ts`

1. **품목별 화물.** M2 1일에 운송 주선 견적(`config.offers.filter((o) => o.kind === 'forwarding')`)을 모두 수락하고 1일을 마감한다.
   - `heldCargoByGood(s, config, 'CUSTOMER')`의 수량 합 = `companyReport(s, config).customerCargoUnits`.
   - `cargoListKo` 글 = 설정의 상품 순서로 `${nameKo} ${수량}${unitKo(good)}`을 ` · `로 이은 글.
   - 그 글에 `${합계}개`가 없다.
   - 회사 재고도 같은 방식(직접 무역을 수락하고 출항 전 취소한 상태)으로 `inventoryUnits`와 맞춘다. 빈 목록은 `없음`.
2. **`rateKo` 표:** 10000 → `100%`, 6666 → `66.66%`, 5050 → `50.50%`, 1 → `0.01%`, 0 → `0%`.
3. **`upcomingSummary`:** `acceptAllFeasible` 뒤 2일 상태와 합성 원화 미지급 상태에서, 칸 값 = 같은 종류·통화 행의 `amountMinor` 합(직접 `reduce`). 4줄 순서와 `labelKo`가 표와 같다. 통화 열은 거래 통화·급여 통화 순서다. `undated` = `day === null` 행 수.
4. **`bottlenecks`:** 1일에 첫 직접 무역 쌍을 수락만 하고(배정·예약 없음) 1일을 마감한 2일 상태.
   - 사람·선복·시간 묶음의 글이 `contractProgress`가 돌려준 해당 코드의 `messageKo`와 같다. 분류는 표대로다.
   - **Claude 확인:** 이 상태의 막힘은 `TASK_UNASSIGNED`·`NO_BOOKING`·`NEXT_SAILING_LATE` 세 개다.
   - `AWAITING_PAYMENT`만 있는 상태(인도 뒤 수금 전)에서는 네 묶음이 모두 비어 있다.
   - 합성 원화 미지급 상태에서는 돈 묶음 첫 줄이 `미지급 ${formatMoney(급여 통화, 미지급 합)}이 있습니다. 현금이 들어오면 먼저 갚습니다.`이다.
5. **`workloadLinesKo`:** 테스트 4의 상태에서 줄이 `workloadSummary` 값과 `cityName`으로 만든 글과 같다. `startingLater`가 있는 합성 상태(테스트 3 방식)에서 `…일부터 근무` 줄이 있다.
6. **`settlementRows`:** `runToCampaignEnd` 결과의 `campaignSummary` 통화마다 `순자산` = `시작 자본` + `손익`, `순자산` = `자산 합계` − `미지급금`. 급여 통화 표에는 0인 재고·선급운임·주선 진행원가·매출채권·기여이익 행이 없다.

### `recruitment.test.ts`

- M2 1일: `crewFacetOptions`의 직무·속성 = 고용 직원과 발견 후보 값의 집합(설정 순서). 미발견 후보에만 있는 속성은 없다(그 속성 목록을 설정·상태에서 계산해 하나씩 확인).
- `crewEntries(s, config, 'all', { role })`는 그 직무 항목만 돌려준다. 속성도 같다. 상태 필터와 함께 걸린다.
- 세 인수 호출의 결과는 네 번째 인수 `{}`와 같다.

### `main.test.ts` — 새 `describe('TASK-0023 경영 보고·일정·결산·필터', …)`

1. **보고 머리·미지급금:** 제목 작은 글이 그대로 있다. USD 표에서 ‘자산 합계’ 바로 다음 행이 `미지급금`이고 값이 `formatMoney(거래 통화, companyReport(state).trade.accountsPayable)`다. 화면의 ‘금액은 확정 기준’은 여전히 2개다(수락 뒤).
2. **정시 인도율:** 1일 문장 `정시 인도율: 아직 인도한 계약이 없습니다.` 늦은 인도는 schedule.test 5의 1일 명령으로 만든 저장 두 개를 `importText`로 쓴다(늦은 계약 ID는 상태에서 꺼낸다).
   - 납기 다음 날을 연 저장: `납기가 지났는데 아직 인도하지 못한 계약: ${링크} (인도하면 정시 인도율에 들어갑니다)` 줄이 있고, 링크는 그 계약의 `goto-contract` 단추다.
   - 인도·수금 다음 날을 연 저장(계약 `COMPLETED`): `r = onTimeDeliveryRate(state)`로 만든 `정시 인도율 ${rateKo(r.rateBasisPoints!)} — 인도 ${r.delivered}건 중 납기 안 ${r.onTime}건` 줄과 `납기를 넘겨 인도한 계약: ${계약 ID}` 줄이 있다. 이 ID는 단추가 아니다(종결 계약).
3. **앞으로 낼 돈:** 2일 화면의 표 칸이 `upcomingSummary` 값과 같다. USD 열 칸은 `—` 또는 `USD`로 끝나고, KRW 열 칸은 `—` 또는 `원`으로 끝난다. 끝난 캠페인에서는 캡션이 `남은 미지급 (캠페인 종료)`다.
   - 원화 미지급이 2건 이상인 합성 저장(schedule.test 4의 3일 상태)에서 `due-list`의 밀린 지급 줄은 원화 한 줄이고, 금액은 −`fundsPosition(state, config, 'KRW').unpaidObligations`다.
4. **업무 부하·막힌 곳:** 수락만 하고 하루 진행한 화면에 `workloadLinesKo`의 줄과 `bottlenecks`의 글이 그대로 있고, CL-03 문장의 건수가 돈·시간·선복 건수 합과 같다.
5. **계약 링크:**
   - 링크는 `view`에서 진행 중인 계약에만 있다.
     - 종결 계약: 2번의 수금 뒤 저장에서 늦은 계약 ID 자리에 `data-action="goto-contract"`가 없다(그 계약의 `data-contract` 단추가 0개).
     - 취소 대기: 1일에 첫 직접 무역을 수락만 하고 하루 진행한 2일 화면. 보고에 그 계약의 `goto-contract` 단추가 있다. `ui.click({action:'cancel'})`로 출항 전 취소를 대기열에 넣으면(`view`에서 취소) 보고의 그 계약 ID는 단추가 아니다. 계약 칸 제목도 없으므로 누를 곳이 없어야 한다.
   - 첫 `goto-contract` 단추를 누르기 전에 `scrollIds`·`focusIds`를 비우고 `focus` 흉내를 지운다(수락 때 `queue()`가 계약 제목으로 이미 옮긴다, main.ts 175~178행). 누르면 `scrollIds`·`focusIds`가 `` [`contract-h-${단추의 dataset.contract}`] ``이고 `focus`는 `{ preventScroll: true }`로 한 번 불린다. 알림 영역(`announcements.length`)은 그대로다.
   - 500ms 안에 다른 동작(`clickNow`)을 누르면 무시된다. 501ms 뒤에는 받는다.
   - 실제 Chromium 순서: `fireDoc('keydown', {key:'Tab'})` → `fireDoc('focusin', {target: 링크 단추})` → `fireDoc('keydown', {key:'Enter'})` → `click`(detail 0). `win.scrollTo`가 불리지 않는다.
6. **품목별 화물(화면):** 운송 주선 견적을 모두 수락하고 하루 진행한 보고에 `맡은 고객 화물 ${cargoListKo(…)}`가 두 곳(이유 줄·표 아래 줄) 있고, `맡은 고객 화물 ${합계}개`는 없다.
7. **결산:**
   - 진행 중에는 `id="settlement-h"`가 없다.
   - 끝난 저장(`runToCampaignEnd` + `acceptAllFeasible`)을 가져오면:
     - `<div class="settlement">` 안의 표 수가 `campaignSummary(…).byCurrency.length`이고, 통화마다 `<caption>결산 · ${통화}</caption>` 표가 있다. 표마다 행 이름 목록이 `settlementRows(st, config)`의 이름 목록과 같고(더 있는 행 없음), 행 값은 그 값의 `formatMoney`다. 통화를 섞은 합계 줄이 끼면 이 단언이 깨진다.
     - 계약 현황 문장이 `campaignSummary(…).contracts`로 만든 글과 같다. 남은 미지급 줄이 통화마다 하나이고 금액이 `unpaidObligations`의 그 통화 합이다.
     - 화면에 `${campaignDays + 1}일`이 0건이다. 오늘 할 일 제목 작은 글이 `${campaignDays}일 · 캠페인 종료`이고, 일정 단추가 없고, ‘결산 보기’ 단추가 있다. 불러오기 알림의 날짜가 `${campaignDays}일`이다.
     - 경영 보고 칸에 `<h4>업무 부하</h4>`·`<h4>막힌 곳</h4>`·`지급 가능일`이 없다.
   - 90일 저장을 가져와 하루 진행하면(끝나는 날):
     - 저장: 1일에 첫 직접 무역 쌍(`tradePairs(config)[0]`)을 수락만 하고(배정·예약 없음) 89일까지 마감한 뒤 90일을 연 상태. 그 계약은 90일에도 `ACTIVE`라 계약 칸 제목이 남는다(Claude 확인).
     - 하루 진행 전에 `ui.afterRender`로 그 계약 제목(`contract-h-${id}`)의 위치를 200px 옮긴다. 그래도 `scrollBy`는 불리지 않는다. 읽던 자리 복원(232~233행)이 끝난 날에도 돌면 `scrollBy(0, 200)`이 불린다(Claude가 `a13caa4`에서 확인한 흉내).
     - `scrollIds`가 `['settlement-h']`, `doc.activeElement.id`가 `settlement-h`다.
     - 알림 띠(`flash-toast`) 글이 `${campaignDays}일 캠페인이 끝났습니다. 경영 보고의 ${campaignDays}일 결산에서 통화별 결과를 확인하세요.`다. 알림 영역에는 하루 진행 뒤 정확히 한 번 쓰이고 그 글이 위 문장이다(이 저장에는 성장 알림이 없다).
   - ‘결산 보기’를 누르면 `scrollIds`·`focusIds`가 `['settlement-h']`다.
8. **일정 화면:**
   - 기본은 접힘(`aria-expanded="false"`, `id="schedule-body"` 없음). 누르면 펼침.
   - 기존 ‘열고 닫기 두 번’과 같은 방식: 500ms 안에 두 번 누르면 펼친 채다. 500ms 뒤 누르면 접힌다.
   - 지도 범위·상태 필터로 다시 그려도 펼친 채다. 펼치고 접어도 알림 영역은 그대로다.
   - `it.each(['load','import','restart','scenario'])` 뒤에는 접힘이고 ‘새 일정’ 표시가 없다.
   - 첫 계약을 단계별로(수락·배정·예약) 넣은 1일 화면을 펼치면, 그 담당 이름과 `${taskName} 완료` 글이 든 줄, 계약 링크가 있다.
   - 합성 항만 대기 설정(`startUi(cfg)`)으로 도착일 A의 저장을 가져와 하루 진행한 뒤 펼치면 `날짜 바뀜 (원래 ${A}일)`이 있다.
   - 칸 구조: 일정을 펼친 화면에서 오늘 할 일 칸(`<section class="panel queue"` 뒤부터 `<section class="panel world"` 앞까지)에 `<section`이 0개, `</section>`이 정확히 1개다. 끝난 화면과 2일 화면의 경영 보고 칸(`<section class="panel report"` 뒤부터 `<section class="panel log"` 앞까지)도 같다. 그리고 `split('<section class="panel queue"')[1].split('</section>')[0]`로 자른 칸 안에 일정 단추와 ‘예상’ 안내 문장이 있다.
     - 단추만 찾는 단언은 일정 블록을 `<section>`으로 감싸도 통과한다(단추가 안쪽 `</section>`보다 앞에 있다). 그래서 개수를 센다.
9. **동료 필터:**
   - M2 1일: `crew-facets`가 상태 필터 줄 뒤, 카드 앞에 있다. 선택지 글은 `roleKo`·`attributeKo`다.
   - `ui.change({action:'crew-role'}, 첫 직원의 직무)` 뒤 카드(`article[data-action="select-card"]`)와 운영표 줄의 `data-emp` 목록이 같고, 모두 그 직무다. 속성도 같다.
   - 미발견 후보에만 있는 속성은 선택지에 없다.
   - 필터 바꾸기는 알림 영역에 쓰지 않는다.
   - `it.each(['load','import','restart','scenario'])` 뒤 두 선택이 `전체`이고 목록이 전부다.
   - M1 1일 화면에 `crew-facets`가 없다.
10. **구조·키보드 회귀:**
    - 기존 ‘화면 코드 순서’ 시험(1262행)이 그대로 통과한다. 더해서: `crew-facets`는 `<aside class="panel crew"`와 `<section class="panel resources"` 사이, 일정 단추는 `<section class="panel queue"`와 `<section class="panel world"` 사이, 보고의 `goto-contract`는 `<section class="panel report"`와 `<section class="panel log"` 사이에 있다.
    - `#app` HTML에 양수 `tabindex`(`tabindex="[1-9]`)가 0건이다.
    - 건너뛰기 두 단추가 여전히 첫 정지점이다(1276행 시험 통과).
    - P0-CITY-01 머리 비교(1013행)가 그대로 통과한다. 일정·필터를 조작해도 `<header class="topbar">` HTML이 같다.
11. **이스케이프:** 기존 296행 시험과 같은 설정(이름·계약 ID를 위험 글자로)에서 일정 펼침·보고 링크·필터 선택지를 연 화면에 그 글이 그대로 없다. 이 시험은 계약 ID를 상태에서 꺼낸다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 임박 지급을 위쪽 막대에 넣을까(UI_SPEC 11행) | 넣지 않는다. 막대 높이 72/79px 기준과 배치안 A의 막대 단추가 결정 대기다. 경영 보고(1-3)와 일정(4)에 둔다. 막대 후보 문구가 있으면 ‘질문’에 적는다 |
| 보고는 확정 상태, 일정은 오늘 할 일 반영 상태인가 | 그렇다. 보고 제목 작은 글과 일정 위치(오늘 할 일 칸)로 구분한다 |
| 진행 중에도 결산(중간 점검)을 보일까 | 보이지 않는다. 끝났을 때만 |
| USD·KRW 합계나 1,300원 환산을 보일까 | 보이지 않는다(D01 대기, DECISIONS 54행) |
| 결산에 점수·등급·실패 판정을 넣을까 | 넣지 않는다(D04 대기) |
| 정시 인도율 소수 | 엔진의 basis point(내림)를 그대로 `rateKo`로 쓴다. 반올림하지 않는다 |
| 납기 지난 미인도를 인도율에 넣을까 | 넣지 않는다. 엔진 정의대로 따로 적는다 |
| `NO_BOOKING`은 왜 선복인가 | 예약이 선복을 잡는 행동이다. 표대로 한다 |
| 막힌 곳에 해결 지시(‘고용하세요’)를 넣을까 | 넣지 않는다. 사실과 CL-03 문장만 |
| 일정을 처음부터 펼칠까 | 접어 둔다. 오른쪽 칸과 한 열 배치의 높이를 바꾸지 않기 위해서다(배치안 결정 대기). 결과 보고 ‘질문’에 펼침 기본값 의견을 적어도 된다 |
| 일정을 새 패널·새 격자 영역으로 둘까 | 두지 않는다. 격자 문자열은 시험이 고정한다(818행) |
| 일정 창 길이 | 7일(오늘 포함, 캠페인 끝에서 자름). `upcomingPayments` 기본 창과 같다 |
| 견적 만료일도 일정에 넣을까 | 넣지 않는다. 견적판에 있다 |
| 급여를 날마다 보일까 | 첫날과 바뀐 날만. 같은 줄이 7번 나오면 바뀐 것이 묻힌다(UI_SPEC 15행) |
| ‘바뀐 것’을 무엇과 비교하나 | 하루 진행 직전에 보던 ‘오늘 실행 예정’ 사본의 일정(캠페인 끝까지)과 비교한다. 불러오기·처음부터 뒤에는 표시하지 않는다 |
| 필터를 단추로 할까 선택으로 할까 | 선택 두 개. Tab 정지점과 칸 높이를 가장 적게 늘린다 |
| 필터 선택지 | 공개된 동료(고용·발견 후보)의 값만. 미발견 후보의 값은 드러내지 않는다(DECISIONS 400행) |
| 실루엣·미발견 칸·‘미발견 후보 n명’ | 바꾸지 않는다(D12 대기) |
| 필터를 저장 파일에 넣을까 | 넣지 않는다. 화면 상태(`initialUiState`)만 |
| 계약 링크 대상이 종결·취소 계약 | 단추 없이 ID 글자만 |
| 계약으로 간 뒤 초점 | 계약 제목(이미 `tabindex="-1"`). 500ms 두 번 누름 막기 |
| 결산으로 이동하는 때 | 하루 진행으로 끝난 그 한 번. 끝난 저장을 불러올 때는 이동하지 않는다 |
| 끝난 날 문화 결과 알림 | 종료 알림이 앞선다. 문화 결과는 현지 패널 기록장에 남는다 |
| 미지급이 수십 건이다 | 보고 목록·일정은 통화마다 한 줄로 묶는다. 결산은 통화별 줄 + 닫힌 목록. 표(1-3)는 원래 합계다 |
| 끝난 뒤 업무 부하·막힌 곳 | 그리지 않는다. 더 진행할 날이 없다 |
| 같은 계약 ID가 보고에 여러 번 나온다 | 나올 때마다 단추로 둔다. 늘어난 Tab 정지점 수를 결과 보고 ‘Tab 순서 표’에 적는다 |
| M1에도 보고 보강·일정을 그리나 | 그린다. 시나리오로 나누지 않는다. 동료 필터만 선택지가 2개 미만이면 그리지 않는다 |
| ‘결산 보기’ 단추의 action | 기존 `skip-to`를 쓴다(3-3). 시험 흉내의 한계는 3-3의 주의를 따른다 |
| ‘91일’ 표시 | 화면 글자는 `min(day, campaignDays)`. 내보내기 파일 이름은 그대로 |
| `card.ts`를 왜 고치나 | 직무·속성 한국어 이름을 한곳에서 쓰려고 export만 더한다. 출력은 그대로 |
| 읽기 함수가 모자라면 | 엔진을 고치지 않는다. 화면에서 조합한다. 엔진 결함이면 ‘범위 밖 발견’에 적는다 |
| 새 시험 수 | 정하지 않는다. 위 목록을 모두 덮으면 된다 |
| 목록 밖 기존 시험이 실패한다 | 기대값을 고치지 않는다. 원인을 찾고, 못 찾으면 보고한다 |
| 시간이 모자란다 | ‘범위’의 ‘시간이 모자라면 뺄 수 있음’ 순서대로 뺀다 |

## 완료 조건

1. 구현 지시 0~6이 반영되었다. 뺀 항목이 있으면 ‘시간이 모자라면 뺄 수 있음’ 순서이고, 결과 보고에 ‘미충족(시간)’으로 적었다.
2. **검증**
   - 시작 전에 `npx vitest run`과 `python3 tools/validate_data.py`를 한 번 돌려 기준 값을 적는다.
     - Claude 확인값(`a13caa4`): 31개 파일·891개 통과(할 일 1), 자료 검사 24,767건. 지시서 커밋이 MANIFEST에 파일을 더하면 하나마다 2건씩 많다(같은 커밋에 TASK-0022 지시서도 들어가면 24,771건일 수 있다). 시작 값은 직접 잰 값을 쓴다.
   - 끝내기 전에 결과 보고 파일을 먼저 만든 뒤 아래를 순서대로 실행한다.
     ```
     bash tools/ai/review_checks.sh a13caa4
     bash tools/ai/review_checks.sh --check a13caa4
     ```
     - 수정 모드 11종, 확인 모드 12종이 모두 통과해야 한다.
     - vitest는 32개 파일이다. 시험 개수는 891개보다 늘어난다.
     - 자료 검사는 PASS다. MANIFEST에 새로 든 파일 하나마다 2건 늘어난다(결과 보고 1개 + 시나리오 4개면 시작 값 + 10건). 다르면 새로 든 파일 목록을 보고에 적는다.
     - 파이썬 시험은 그림 도구 21개, 지도 21개(3개 건너뜀), 자료 검사기 20개, 사실 섞임 20개 그대로다. 사실 섞임 검사 PASS. `node --test tools/browser/lib.test.mjs` 10개 통과.
     - 빌드의 JS 청크 크기를 적는다. 500kB 경고는 실패가 아니다(W2-0e).
   - 시나리오 4개 `--dry-run`이 모두 종료 코드 0이다(구현 지시 6).
3. **바꾼 범위 확인** (출력을 결과 보고에 붙인다)
   - `git diff --name-only a13caa4`와 `git status --short --untracked-files=all`의 파일이 모두 ‘고칠 수 있는 파일’ 안에 있다.
   - 다음 출력이 비어 있다:
     ```
     git diff a13caa4 -- src/engine src/content data tests vite.config.ts index.html package.json package-lock.json tools/browser/lib.mjs tools/browser/measure.mjs tools/browser/profiles.json
     git diff a13caa4 -- src/ui/card.ts src/ui/recruitment.ts src/ui/session.ts | grep '^-[^-]' | grep -v '^-import'
     ```
     - 예외: `recruitment.ts`의 `crewEntries` 안 줄(인수 추가·거르기 조건)과 `session.ts`의 `initialUiState` 필드 줄은 바뀌어도 된다. 바뀐 줄은 결과 보고에 옛 줄 → 새 줄로 모두 적는다. `card.ts`에서 지운 줄은 0이어야 한다.
   - 기존 시험 파일에서 지운 줄은 import 줄뿐이다:
     ```
     git diff a13caa4 -- src/ui/*.test.ts tools/browser/lib.test.mjs | grep '^-[^-]'
     ```
     - `lib.test.mjs`는 8행 한 줄이 바뀐다.
   - 새 시험 줄·새 시나리오에 금지 문자열이 없다(결과 0건):
     ```
     git diff a13caa4 -- src/ui/*.test.ts | grep '^+' | grep -nE "PYEONGTAEK|BUSAN|SHANGHAI|HAIPHONG|YOKOHAMA|SINGAPORE|JAKARTA|HONG_KONG|OFFER_|EVI_|ROUTE[0-9]|EMP[0-9]|CT[0-9]{3}|TASK[0-9]{3}|VEN_|CA0[0-9]|평택|부산|상하이|하이퐁|요코하마|싱가포르|자카르타|홍콩"
     cat tools/browser/scenarios/report-contract-link.json tools/browser/scenarios/schedule-toggle.json tools/browser/scenarios/crew-facet.json tools/browser/scenarios/campaign-end.json | grep -nE "PYEONGTAEK|BUSAN|OFFER_|EMP[0-9]|CT[0-9]{3}|ROUTE[0-9]"
     ```
   - 화면 코드에 실제 회사 이름과 환율 계산이 새로 들어오지 않았다(결과 0건):
     ```
     git diff a13caa4 -- src/ui ':!src/ui/*.test.ts' | grep '^+' | grep -niE "SINOKOR|장금|Lloyd|머스크|Maersk|HMM|COSCO|코스코|MSC|에버그린|Evergreen|Hapag|하파그|1300|1,300|fx"
     ```
4. **변형 시험.** 아래를 하나씩 넣고 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다. git으로 되돌리거나 stash하지 않는다.

   | 변형 | 실패해야 하는 시험 |
   |---|---|
   | `heldCargoByGood`가 상품을 가리지 않고 한 줄로 합침 | 품목별 화물(단위·화면) |
   | USD 미지급금 행을 지움 | 보고 머리·미지급금 |
   | `rateKo`가 반올림(6666 → 66.67%) | `rateKo` 표 |
   | `upcomingSummary`가 통화를 가리지 않고 합침 | `upcomingSummary`, 앞으로 낼 돈(화면) |
   | `BOTTLENECK_OF`에서 `NO_BOOKING`을 시간으로 | `bottlenecks` |
   | `bottlenecks`가 info 막힘도 넣음 | `bottlenecks`(수금 대기 상태) |
   | 계약 링크의 500ms 막기를 지움 | 계약 링크 |
   | 종결 계약에도 링크를 만듦 | 정시 인도율(수금 뒤 저장), 계약 링크(종결) |
   | 링크 대상을 `view` 대신 `state`의 진행 중 계약으로 | 계약 링크(취소 대기), 일정 화면(수락 대기 계약 링크) |
   | TASK_DONE 공식에서 `− 1`을 지움 | 예정일 = 엔진, 일수 업무 |
   | ARRIVAL에서 `max(…, s.day)`를 지움 | 새 일정·날짜 바뀜(항만 대기) |
   | DELIVERY에서 `max(releaseDay, s.day)`를 지움 | 예정일 = 엔진(반출일이 지난 화물) |
   | 급여 압축을 지움(날마다 표시) | 급여 줄 압축 |
   | OVERDUE를 행마다 둠(묶지 않음) | 지난 날짜(미지급 묶음), 앞으로 낼 돈(화면 묶음 줄) |
   | ‘날짜 바뀜’에서 `PAY:WAGE:` 제외를 지움 | 새 일정·날짜 바뀜(WAGE 줄) |
   | `schedulePrev`를 상태를 바꾼 뒤 계산 | 일정 화면(날짜 바뀜) |
   | 끝났을 때 결산 제목으로 이동하는 줄을 지움 | 결산(하루 진행으로 끝남) |
   | 끝난 날에도 읽던 자리 복원(232~233행)을 돌림 | 결산(하루 진행으로 끝남, `scrollBy`) |
   | 결산을 진행 중에도 그림 | 결산(진행 중 없음) |
   | 결산에 통화를 섞은 합계 행을 더함 | 결산(표 수·행 이름) |
   | 끝난 뒤에도 업무 부하·막힌 곳을 그림 | 결산(끝난 화면) |
   | 오늘 할 일 제목에 `state.day`를 되살림 | 결산(91일 0건) |
   | 필터 선택지를 `config.employees` 전체에서 만듦 | 동료 필터(미발견), `crewFacetOptions` |
   | 필터를 카드에만 걸고 운영표에는 안 걺 | 동료 필터(카드·운영표 같은 목록) |
   | 선택지가 1개여도 필터를 그림 | 동료 필터(M1) |
   | `scheduleOpen`을 `initialUiState` 밖 모듈 변수로 | 일정 화면(초기화) |
   | 일정 블록을 `<section>`으로 | 일정 화면(칸 구조) |
   - ‘시간이 모자라면 뺄 수 있음’으로 뺀 항목의 변형은 하지 않는다. 표에 ‘뺌’으로 적는다.
   - Claude도 검수 때 이 표를 다시 돌린다.
5. **Claude가 잴 것 (Codex는 하지 않는다).** Chromium 7개 프로필(1366×657 마우스·터치, 1180×820, 1024×768, 1133×744, 1920×969, 1000×700 한 열), 실제 배율(`docs/ai/WORKFLOW.md` 119~121행). `a13caa4` 빌드와 이 작업 빌드를 같은 명령으로 잰다.
   - 기존 시나리오 4종(`smoke`·`day-anchor`·`local-tab-position`·`culture-result-flow3`)이 두 빌드 모두 기대를 통과하고 값이 ±1px 안에서 같다. `smoke`의 `bar_bottom_day1`이 같다(위쪽 막대 불변).
   - 새 시나리오 4종이 기대를 통과한다. `crew-facet`의 `res_h_top_day1`이 `a13caa4`보다 늘어난 양(필터 줄 높이)을 기록한다. 52px 이하여야 한다.
   - 키보드(TASK-0018 검수 측정 방식): 세 열 6개 프로필에서 Tab이 거꾸로 튀는 곳 0, 하루 진행 뒤 ‘결과 보기’까지 Tab 1번, Shift+Tab으로 ‘하루 진행’에 갈 때 0±8px, 새 선택·일정 단추·계약 링크에 Tab으로 닿고 Enter·Space로 동작, 계약 링크 뒤 초점이 계약 제목.
   - 하루 진행 뒤 읽던 자리(TASK-0012 기준 27개 경우)가 `a13caa4`보다 나빠지지 않는다.
   - M1·M2 1→8일(M2는 현지 패널을 연 채)을 마우스·키보드로 번갈아 진행하고, M2 1→90일(`campaign-end`의 3개 프로필)을 진행해 쪽 오류 0, 가로 넘침 0, ‘91일’ 0건.
   - 새 단추·선택이 터치 프로필에서 44px 이상, 가장 작은 글자 12px 이상.
   - 일정을 펼친 채 하루 진행할 때 일정 단추 위치 변화를 기록한다(배치안 결정 대기라 기준 없이 기록만).
6. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0023.md`에 머리말 형식(`CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유.
- **실행한 검증과 결과:** 시작 HEAD 해시와 `git diff --name-only a13caa4 HEAD` 출력. 시작 전 기준 값(vitest 파일·시험, 자료 검사 건수). 명령별 통과·실패와 개수. 빌드 청크 크기. 시나리오 `--dry-run` 결과.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거. 뺀 항목은 ‘미충족(시간)’.
- **바꾼 기존 단언:** 없어야 한다. 3번의 `grep '^-[^-]'` 출력을 붙인다.
- **변형 시험 표**
- **Tab 순서 표 (정적):** M2 1일 HTML에서 셈한 Tab 정지점 순서(영역 단위). TASK-0018 결과 보고의 35개와 비교해 늘어난 곳(필터 선택 2, 일정 단추 1 예상)을 적는다. 수락·하루 진행 뒤 보고에 생기는 계약 링크 수도 적는다.
- **화면 문구 추가 목록:** 새로 보이는 문장을 위치별로 그대로 적는다. 바꾼 문장은 옛 문장 → 새 문장.
- **범위 밖 발견:** 고치지 않은 문제. 적어도 다음을 확인해 적는다.
  - 끝난 화면에 남은 ‘91일’이 엔진 문장에서 오는지.
  - 학생 화면에 내부 ID가 보이는 곳(예: 지도 노선 글의 노선 ID `main.ts` 313행, 선복 목록의 출항편 ID 620행, 운송편 예약 칸의 노선 ID 498행).
  - ‘미발견 후보 n명’ 문구(`recruitment.ts` 135행, D12 덧붙임 대기).
  - 지급 가능일 글자 함수가 `growth.ts`와 `culture.ts`에 따로 있음.
  - 읽기 함수가 모자라 화면에서 조합한 계산(예: TASK_DONE 날짜 공식이 `progress.ts` 99행과 같은 계산을 다시 함).
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’. 적어도 일정 기본 펼침 여부와 위쪽 막대 임박 지급 후보 의견을 적는다.

브라우저 측정은 하지 않는다. 했다면 실제 배율 방식(WORKFLOW 119~121행)인지 적는다.
