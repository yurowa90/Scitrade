# TASK-0033 M2a-5 화면 1: 규칙 2 시나리오 열기·시세표·견적 카드·환전·위쪽 막대·지급 표시

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: TASK-0031(+R1)·TASK-0032(+R1)·TASK-0035 병합 뒤 개발 브랜치 `8fdc7ad`(이 지시서를 올린 커밋). 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0033-m2a5-trade-screens.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다. 아래 줄 번호는 개발 브랜치 `8fdc7ad` 기준이다. 다르면 코드가 사실이다.
- 결정 근거: `docs/ai/design/M2A5-SPEC.md` 16절(화면 요구) 1·2·4·5·9·10, 13.1(늦은 인도 감액), 14.2~14.8(읽기 함수). `docs/DECISIONS.md`의 M2a-5 결정(D01 가 환전, D02 ①~⑤, D04 가 실패, Q10 감액, Q12 가 병목 표, Q13·Q13-2·Q14 경제). `docs/UI_SPEC.md` 50행(색만으로 상태를 구분하지 않는다).
- 화면 2(창고·병목 표·고용 면담·경고·실패·결산)는 TASK-0034다. 두 작업은 `main.ts`를 함께 고치므로 차례로 돈다.

## 지금 상태(세션 A 확인, `8fdc7ad` 기준)

- **시나리오:** 시나리오 고르기(`src/ui/main.ts:9·38·356`)와 `startScenario(id: ScenarioId)`(132행)는 `SCENARIO_IDS`만 쓴다. 저장 불러오기(`src/ui/session.ts:27`)도 `SCENARIO_IDS` 밖이면 ‘이 시제품의 시나리오 저장이 아닙니다’로 거절한다. 그래서 규칙 2 저장은 다시 불러올 수 없다. `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`는 `src/content/scenario.ts:43-45`에 있다.
- **견적판:** `offerBoard`(`main.ts:509`)는 `tradePairs(config)`(512행)와 `config.offers`(536행)만 읽는다. 규칙 2의 생성 견적(`state.operations.offers`, `offerDef`, `openTradePairs`)은 나오지 않는다.
  - 수락 명령은 두 길로 만든다: `case 'accept'`(1289행)는 `data-buy`/`data-sell`로 새로 만들고, `accept-plan`(1334행 근처)은 `offerCommands[key]`를 쓴다.
  - 대기열 문구 `commandLabel`(904행 근처)은 `offerOf(config)`와 견적 기본 수량을 쓴다.
  - 생성 견적의 거래처 ID(예: 의류 판매 고객·전자제품 화주)는 `PARTY_KO`(162행)에 없다.
- **지급 표시:**
  - `src/ui/schedule.ts:85`는 `FREIGHT`가 아니면 모두 ‘수입 관세’로 적는다.
  - `main.ts:778-781` 지급 목록은 `FREIGHT`·`DUTY`가 아닌 행을 **아예 거른다**(RENT·SPACE_FEE가 빠진다).
  - 지급 종류 이름표 `src/ui/reports.ts:67-70`(`labels`)에 RENT·SPACE_FEE가 없다. `lines`(81행 근처)는 `labels` 전체를 돈다.
  - 자금 표(`main.ts:734` 근처 ‘체결 계약의 남은 지출 예약’)에는 선복 요금 예약(`fundsPosition(...).reservedCommitments`)이 섞여 있는데 따로 보이지 않는다.
- **보고 문장:** ‘이번 판에는 달러를 원화로 바꾸는 기능이 없습니다’(`main.ts:834·835`)와 원화 보고 주석 ‘가상 환율 1,300원/달러는 보고에 쓰지 않습니다’(`reports.ts:22·23·28`)는 규칙 2에서 거짓이다.
- **엔진 읽기 함수는 모두 있다:**
  - `marketTable`(`src/engine/market.ts:94-106`): 행마다 `nextObservationDay`가 있고, 마지막 공개일(78일) 당일부터 null이다.
  - `quotePreview`(`src/engine/readers.ts:21-31`): `OperationsQuotePreview`이고, `arrivalDay`·`deliveryDeadlineDay`를 `QuotePreview`에서 물려받는다.
  - `exchangePreview`(`readers.ts:94-104`): `warningKo`·`runwayBefore`·`runwayAfter`가 있고, 환율 값은 주지 않는다.
  - `paymentDefaultStatus`(`src/engine/operations.ts:228`): `level`은 NONE·WARNING·DANGER·FAILED이고, NONE일 때 남은 날은 null이다.
  - `payrollRunwayDay`(`src/engine/previews.ts:41`), `upcomingPayments`(`src/engine/reports.ts`, RENT·SPACE_FEE 행과 `labelKo`).
- **첫 화면 크기:** 한도는 gzip 140,000 B(`tools/bundle-size.mjs:6`)다. 지금 120,334 B로 여유는 약 19.7 KB다.

## 범위

### 0. 공통 규칙

- 미리보기 함수(`quotePreview`·`exchangePreview`·`marketTable`·`paymentDefaultStatus`)는 화면이 쓰는 `view`(대기 명령을 반영한 계획 상태, `main.ts:1064` 근처)로 부른다. 시험도 같은 `view`로 비교한다. 그래야 대기 중인 환전·수락이 두 번 계산되거나 빠지지 않는다.
- 규칙 2 전용 칸과 문장은 `config.operations`가 있을 때만 그린다.

### 1. 규칙 2 시나리오 열기

- 시나리오 고르기에 `OPERATIONS_SCENARIO_IDS`를 더한다. 이름은 자료의 `titleKo`다. `main.ts:38`의 `Record<ScenarioId>`, 132행 `startScenario`, 관련 타입을 `ALL_SCENARIO_IDS`의 타입으로 넓힌다. 규칙 1 시나리오의 순서와 이름은 그대로 둔다.
- `session.ts:27`의 저장 시나리오 검사를 `ALL_SCENARIO_IDS`로 넓힌다. 규칙 2 저장 → 불러오기(브라우저 저장소와 파일 가져오기 둘 다)를 시험한다.
- 규칙 2 시나리오를 고르면 다른 화면(지도·명부·캐릭터 투영)이 깨지지 않는지 결과 보고에 적는다. 깨지는 곳이 있으면 고치지 말고 ‘질문’에 적는다.

### 2. 시세표(명세 16-1, `marketTable`)

- 6행: 도시·상품·매수/매도, 기준가(USD/단위), 지수(‘지수는 돈이 아닙니다’ 주석), 관측일과 ‘{ageDays}일 전 관측’, 다음 관측일, ‘이번 묶음 견적 있음’.
- `nextObservationDay === null`이면 다음 관측일 대신 ‘새 관측 없음’(엔진 값을 따른다. 명세의 ‘79일 뒤’보다 이 값이 우선이다). 반례는 71일이다.

### 3. 견적판과 견적 카드(명세 16-2)

- 견적판은 열린 견적을 `offerDef(state, config, id)`로 읽는다. 직접 무역 쌍은 규칙 2에서 `openTradePairs`를, 규칙 1에서 `tradePairs(config)`를 쓴다. 대기열 문구 `commandLabel`도 `offerDef`로 읽는다.
- **수량 고르기(직접 무역만):** 주선 견적은 `quantity = maxQuantity = quantityStep`이고 `ACCEPT_FORWARDING`에는 수량이 없다. 그래서 직접 무역 카드에만 둔다.
  - `quantityStep` 단위로 `quantity`~`maxQuantity` 사이를 고른다.
  - 고른 수량은 UI 상태에 둔다. `session.ts`의 `initialUiState`에 새 칸을 만들고, 키는 `buyOfferId+sellOfferId`로 한다. 시나리오를 바꾸거나, 날이 넘어가거나, 견적이 닫히면 지운다. 기본값은 가장 작은 수량이다.
  - 고른 수량마다 `quotePreview(view, config, ids, quantity)`의 값을 보인다. 매입·판매·운임·관세·기여이익·필요 자금·준비 pt·부피·‘보관 후 사용량/한도’다.
  - 수락 명령의 두 길(`case 'accept'`와 `accept-plan`) 모두에 고른 `quantity`를 넣는다. `commandLabel`에도 고른 수량을 보인다.
  - `allowed: false`면 `reasonKo`를 보이고 수락 단추를 막는다.
- **작업 포함 주선 견적**(`serviceClass === 'HANDLING'`): 제목 `titleKo`, ‘준비 {prepWorkUnits}pt — 직원 시간이 많이 듭니다’, ‘준비 1pt당 기여이익 {contributionPerPrepPtMinor} USD’.
- **늦은 인도 감액:** `lateDeliveryReductionMinor > 0`이면 ‘납기 {n}일 늦으면 하루 50 USD씩, 최대 계약 금액까지 감액됩니다 — 이 계획으로는 {금액}’.
  - `n = arrivalDay + 통관 일수 − deliveryDeadlineDay`다. 통관 일수는 엔진이 늦은 날을 셀 때 쓰는 값을 읽는다. 위치를 찾아 결과 보고에 적는다.
  - 50 USD와 상한은 `config.terms`에서 읽는다.
  - 반례는 같은 견적의 ‘늦지 않는 날’ 상태(감액 0)다. `arrivalDay`는 다음 출항편 기준이라 수량과 무관하다.
- **밀려나는 계약:** `affectedContracts`에 `missesSailing`인 계약이 있으면 그 계약의 이름(계약 카드 제목과 같은 문구)과 ‘이 견적을 받으면 출항을 놓칩니다’.
- **캠페인 뒤 도착 경고(TASK-0030 검수 2절):** `arrivalDay > config.campaignDays`이면 ‘{campaignDays}일 캠페인 안에 인도되지 않습니다. 결산에 미인도로 남습니다.’
  - `arrivalDay`가 null이고 `allowed`가 true이면 ‘실을 출항편이 아직 정해지지 않았습니다’.
  - 시험 상태는 진행으로 만들지 않는다(아무것도 안 하면 71일께 실패로 끝난다). 열린 견적이 있는 날의 상태 사본에서 `config.campaignDays`만 줄인 사본 설정으로 만든다. 방법을 결과 보고에 적는다.
- **거래처 이름:** 생성 견적의 거래처 ID가 `PARTY_KO`에 없으면 자료의 거래처 이름(있으면)을 쓰고, 없으면 ‘거래처’로 쓴다. 화면에 ID를 그대로 보이지 않는다. 어느 쪽인지 결과 보고에 적는다.

### 4. 환전 칸(명세 16-4, D01 가)

- 다음 값을 `exchangePreview(view, ...)`에서 읽어 보인다: 방향(USD→KRW / KRW→USD), 금액(100 USD 단계), 받는/내는 금액, 차감, 쓸 수 있는 USD, 급여 가능일 전/후, ‘자동 환전은 없습니다’, `warningKo`.
- 환율 문구 ‘게임용 고정 환율 1,287원(받을 때) · 1,313원(살 때)’의 두 값은 `config.operations.fx`에서 읽는다. 화면에서 환율을 곱해 금액을 만들지 않는다.
- 명령 `EXCHANGE_CURRENCY`를 대기열에 넣는다. 거절되면 엔진 문장을 그대로 보인다.
- 환전 칸은 화면 안의 인라인 칸이다(새 층을 만들지 않는다). Esc 규칙은 적용하지 않고 Tab 순서 안에 있는지만 본다.

### 5. 위쪽 막대(명세 16-5)

- 원화 급여 가능일(임차료 포함, `payrollRunwayDay`).
- 지급 불이행 단계(`paymentDefaultStatus`)를 글자로 쓴다. 색만으로 구분하지 않는다.
  - NONE: ‘지급 정상’.
  - WARNING·DANGER: ‘경고’·‘위험’과 실패까지 남은 날. 실패일이 캠페인 뒤면 ‘{campaignDays}일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다’(TASK-0027 R1 문장과 같은 뜻).
  - FAILED: ‘경영 실패’. 자세한 화면은 TASK-0034다.

### 6. 지급 표시(명세 16-9)

- `schedule.ts:85`를 종류별로 나눈다: `RENT` → ‘창고 임차료’, `SPACE_FEE` → 엔진 `labelKo`, `FREIGHT` → 지금 문장, `DUTY` → ‘수입 관세’. 모르는 종류는 `never` 검사로 컴파일이 실패하게 한다.
- `reports.ts:67-70` `labels`: **`config.operations`가 있을 때만** `['RENT', '창고 임차료 (기간마다 자동)']`, `['SPACE_FEE', '선복 계약 요금 (출항마다 자동)']`을 엔진 정렬 순서(OVERDUE·RENT·SPACE_FEE·WAGE·FREIGHT·DUTY)대로 넣는다. 규칙 1 지급 표에 빈 행이 생기면 안 된다.
- `main.ts:778-781` 지급 목록에 RENT·SPACE_FEE 행을 더한다(날짜·`labelKo`·금액). 지금은 이 두 종류를 거른다.
- 자금 표(`main.ts:734` 근처)는 규칙 2에서 ‘체결 계약의 남은 지출 예약’과 ‘선복 계약 요금 예약’(`reservedCommitments`)을 나눠 보인다(`usdFundsParts`처럼).

### 7. 보고 문장(명세 16-10 일부)

- 규칙 2에서 ‘이번 판에는 달러를 원화로 바꾸는 기능이 없습니다’(`main.ts:834·835`)를 ‘환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다. 자동 환전은 없습니다.’로 바꾼다. 규칙 1 문장은 그대로 둔다.
- 원화 보고 주석(`reports.ts:22·23·28`)은 규칙 2에서 ‘환전 명령으로 실제 바꾼 금액만 기록합니다. 통화는 합치지 않습니다.’로 바꾼다.

### 8. 첫 화면 크기와 측정 준비

- 규칙 2 화면 코드가 첫 화면 gzip을 **10 KB 넘게** 늘리면 동적 import로 분리한다. 규칙 2 시나리오를 고를 때만 불러온다.
  - `render()`는 동기이므로, 불러오는 동안 ‘불러오는 중’ 칸을 보이고 불러온 뒤 다시 그린다.
  - 시험은 그 import를 await한 뒤 비교한다.
  - `style.css` 추가분은 분리되지 않는다는 점을 감안한다.
- 한도를 넘으면 멈추지 말고 `node tools/check_bundle_size.mjs dist` 출력 원문과 증감을 보고한다. 한도·빌드 설정은 바꾸지 않는다.
- 세션 B의 Chromium 측정용으로, 결과 보고에 규칙 2 측정 상태 세 개를 재현 명령과 함께 적는다. 상태마다 보이는 칸 목록과 Tab 순서도 적는다.
  - 1일: 묶음 0이 공개된 시작 상태.
  - 8일: 두 번째 공개(묶음 1) 뒤.
  - 15일: 환전과 수량 고르기를 한 번씩 한 뒤.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/session.ts`, `src/ui/schedule.ts`, `src/ui/reports.ts`, `src/ui/trade.ts`, 새 `src/ui/market.ts`(시세표·견적 카드·환전 칸 도우미), `src/ui/style.css`, `src/ui/main-testkit.ts`(시험 도우미 추가만).
- 새 시험 `src/ui/m2a5-trade-ui.test.ts`, 기존 UI 시험의 기대 문자열 줄(규칙 2에 해당하는 것과 시나리오 목록만).
- `docs/ai/tasks/results/TASK-0033.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`(시나리오 이름·ID 읽기만), `data/**`, `schemas/**`, `tools/**`.

## 시험(새 파일 `src/ui/m2a5-trade-ui.test.ts`)

- **문장마다 반례:** ‘나와야 하는 상태’와 ‘나오면 안 되는 반례’를 하나씩 둔다. 문장은 `toBe` 전체, 반례는 `not.toContain`으로 확인한다.
  - 감액 문장은 늦지 않는 날에는 없다.
  - 캠페인 뒤 도착 경고는 도착이 캠페인 안이면 없다.
  - ‘새 관측 없음’은 71일에는 없다.
  - RENT·SPACE_FEE 이름표는 규칙 1 지급 표에 없다.
- **규칙 1 화면 불변:** 시나리오 `<select>` 요소를 뺀 렌더 문자열이 `8fdc7ad`와 같아야 한다.
  - 대표 상태 3개: 1일, 첫 계약 수락 뒤, 결산.
  - `main-testkit.startUi`와 `app.innerHTML`을 쓴다. 빌드 표시(`빌드 ${BUILD_ID}`)는 정규화하고, `vi.setSystemTime`으로 시각을 고정한다(대기 명령 ID의 `Date.now()` 때문).
  - 기대 문자열은 `8fdc7ad` 사본에서 같은 도우미로 만들고, 결과 보고에 sha256과 함께 적는다.
- **수량:** 수량을 바꾸면 두 수락 길 모두 명령의 `quantity`가 바뀐다. 보이는 값은 `quotePreview(view, …, quantity)`와 같다. 대기열 문구에도 고른 수량이 보인다.
- **저장:** 규칙 2 저장 → 불러오기가 된다.
- **키보드:** 수량 고르기·환전 금액·방향이 Tab 순서 안에 있다(TASK-0024 규칙).
- **지급 종류:** 분기는 `never` 검사로 빠짐없이 다룬다.

## 완료 조건

1. 범위 0~8 반영.
2. 검사:
   - `npx vitest run` 실패 0.
   - `npm run typecheck`, `python3 tools/validate_data.py` 통과.
   - `bash tools/ai/review_checks.sh --check 8fdc7ad` 실패 0. 크기 검사는 범위 8의 규칙대로 보고한다.
3. 기본 비교 실행기 `run` 400회 출력이 `8fdc7ad`와 바이트로 같다(엔진을 고치지 않았다는 확인).
4. 변형 시험(사본·편집기·되돌림·`cmp`, git으로 되돌리지 않음):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 견적판이 `config.offers`만 읽게 되돌림 | 생성 견적 카드 시험 |
| 2 | `case 'accept'` 길에 고른 `quantity`를 넣지 않음 | 수량 시험 |
| 3 | 캠페인 뒤 도착 경고 조건을 `>=`로 바꿈 | 도착 경고 반례 시험 |
| 4 | `schedule.ts`의 RENT를 관세 문장으로 되돌림 | 지급 반례 시험 |
| 5 | 환전 칸이 `exchangePreview` 대신 화면에서 환율을 곱함 | 환전 값 시험(엔진 값과 비교) |
| 6 | RENT·SPACE_FEE 이름표를 규칙 1에도 넣음 | 규칙 1 화면 불변 |
| 7 | `session.ts` 검사를 `SCENARIO_IDS`로 되돌림 | 규칙 2 저장 시험 |

5. 결과 보고 `docs/ai/tasks/results/TASK-0033.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 크기 증감, 측정 상태 세 개, 변형 표, 범위 밖 발견, 질문을 적는다.
