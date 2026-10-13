# TASK-0033 M2a-5 화면 1: 규칙 2 시나리오 열기·시세표·견적 카드·환전·위쪽 막대·일정

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: TASK-0031(+R1)·TASK-0032(+R1)·TASK-0035 병합 뒤 개발 브랜치 `<BASE>`(이 지시서를 올린 커밋). 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0033-m2a5-trade-screens.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다. 아래 줄 번호는 개발 브랜치 `8fdc7ad` 기준이다. 다르면 코드가 사실이다.
- 결정 근거: `docs/ai/design/M2A5-SPEC.md` 16절(화면 요구) 1·2·4·5·9·10, 13.1(늦은 인도 감액), 14.2~14.4·14.7·14.8(읽기 함수). `docs/DECISIONS.md`의 M2a-5 결정(D01 가 환전, D02 ①~⑤, D04 가 실패, Q10 감액, Q12 가 병목 표, Q13·Q13-2 경제). UI_SPEC 50행(색만으로 상태를 구분하지 않는다).
- 화면 2(창고·병목 표·고용 면담·경고·실패·결산)는 TASK-0034다. 두 작업은 `main.ts`를 함께 고치므로 차례로 돈다.

## 지금 상태(세션 A 확인, `8fdc7ad` 기준)

- 시나리오 고르기(`src/ui/main.ts:9·38·356`)는 `SCENARIO_IDS`만 쓴다. 그래서 규칙 2 시나리오 `SCENARIO_M2_OPERATIONS`가 없다. `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`는 `src/content/scenario.ts:43-45`에 있다.
- 견적판 `offerBoard`(`main.ts:509`)는 `tradePairs(config)`(512행)와 `config.offers`(536행)만 읽는다. 규칙 2의 생성 견적(`state.operations.offers`, `offerDef`, `openTradePairs`)은 나오지 않는다.
- 지급 문장이 `FREIGHT`가 아니면 모두 관세로 적는다.
  - `src/ui/schedule.ts:85`: `'운송편 예약 마감 · 운임 선지급' : '수입 관세'`.
  - `src/ui/main.ts:738`(묶인 돈 목록), `main.ts:780-781`(날짜 있는 지급 목록)도 같은 이항 분기다.
- 지급 종류 이름표 `src/ui/reports.ts:67-70`(`labels`)에 `RENT`·`SPACE_FEE`가 없다. 엔진 `UpcomingPaymentKind`(`src/engine/reports.ts:213`)에는 둘이 있고, 정렬 순서(293행)는 OVERDUE·RENT·SPACE_FEE·WAGE·FREIGHT·DUTY다.
- 경영 보고 문장 ‘이번 판에는 달러를 원화로 바꾸는 기능이 없습니다’(`main.ts:834·835`)는 규칙 2에서 거짓이다. 원화 보고 주석 ‘가상 환율 1,300원/달러는 보고에 쓰지 않습니다’(`reports.ts:22·23·28`)도 규칙 2에 맞지 않는다.
- 엔진 읽기 함수는 모두 있다.
  - `marketTable`(`src/engine/market.ts:94`), `quotePreview`(`src/engine/readers.ts:31`, `OperationsQuotePreview`, `arrivalDay` 포함).
  - `exchangePreview`(`readers.ts:94`), `paymentDefaultStatus`(`src/engine/operations.ts:228`), `payrollRunwayDay`(`src/engine/previews.ts:41`).
  - `upcomingPayments`(`src/engine/reports.ts`, RENT·SPACE_FEE 행과 `labelKo` 포함).
- 첫 화면 크기 한도: `tools/bundle-size.mjs:6`, gzip 140,000 B. 허브 측정으로 여유는 약 19.7 KB다.

## 범위

### 1. 규칙 2 시나리오 열기

- 시나리오 고르기에 규칙 2 시나리오를 더한다. 이름은 자료의 `titleKo`를 쓴다. 규칙 1 시나리오의 순서와 이름은 그대로 둔다.
- 규칙 1 시나리오를 고르면 화면 문자열이 지금과 같아야 한다. 규칙 2 전용 칸은 `config.operations`가 있을 때만 그린다.

### 2. 시세표(명세 16-1)

- `marketTable` 6행: 도시·상품·매수/매도, 기준가(USD/단위), 지수(‘지수는 돈이 아닙니다’ 주석), 관측일과 ‘N일 전 관측’, 다음 관측일, ‘이번 묶음 견적 있음’ 표시.
- 마지막 공개 뒤(공개 마지막 날 다음)에는 다음 관측일 대신 ‘새 관측 없음’.

### 3. 견적판과 견적 카드(명세 16-2)

- 견적판은 열린 견적을 `offerDef(state, config, id)`로 읽는다. 직접 무역 쌍은 규칙 2에서 `openTradePairs`를, 규칙 1에서 `tradePairs(config)`를 쓴다.
- **수량 고르기:** `quantityStep` 단위로 `quantity`~`maxQuantity` 사이를 고른다. 고른 수량마다 `quotePreview(state, config, ids, quantity)`의 값을 보인다. 매입·판매·운임·관세·기여이익·필요 자금·준비 pt·부피·‘보관 후 사용량/한도’다.
  - 수락 명령에 고른 `quantity`를 넣는다. 기본값은 가장 작은 수량이다.
  - `allowed: false`면 `reasonKo`를 보이고 수락 단추를 막는다.
- **작업 포함 주선 견적**(`serviceClass === 'HANDLING'`): 제목 `titleKo`, ‘준비 12pt — 직원 시간이 많이 듭니다’(pt는 `prepWorkUnits`에서), ‘준비 1pt당 기여이익 {contributionPerPrepPtMinor} USD’.
- **늦은 인도 감액:** `lateDeliveryReductionMinor > 0`이면 ‘납기 {n}일 늦으면 하루 50 USD씩, 최대 계약 금액까지 감액됩니다 — 이 계획으로는 {금액}’. 50 USD와 상한은 `config.terms`에서 읽는다.
- **밀려나는 계약:** `affectedContracts`에 `missesSailing`인 계약이 있으면 그 계약 번호와 ‘이 견적을 받으면 출항을 놓칩니다’.
- **캠페인 뒤 도착 경고(TASK-0030 검수 2절):** `quotePreview(...).arrivalDay`가 `config.campaignDays`보다 크면 ‘{campaignDays}일 캠페인 안에 인도되지 않습니다. 결산에 미인도로 남습니다.’를 보인다. `arrivalDay`가 null이면(실을 출항편 없음) 이 경고 대신 `reasonKo`를 따른다.

### 4. 환전 칸(명세 16-4, D01 가)

- 방향(USD→KRW / KRW→USD), 금액(100 USD 단계), ‘게임용 고정 환율 1,287원(받을 때) · 1,313원(살 때)’(값은 `config.operations.fx`), 받는/내는 금액, 차감, 쓸 수 있는 USD = 현금 − 예약(계약·선복 요금) − 미지급, 급여 가능일 전/후, ‘자동 환전은 없습니다’, `warningKo`.
- 값은 모두 `exchangePreview`에서 읽는다. 화면에서 다시 계산하지 않는다.
- 명령 `EXCHANGE_CURRENCY`를 대기열에 넣는다. 거절되면 엔진 문장을 그대로 보인다.

### 5. 위쪽 막대(명세 16-5)

- 원화 급여 가능일(임차료 포함, `payrollRunwayDay`).
- 지급 불이행 단계(`paymentDefaultStatus`): ‘정상 / 경고 / 위험’과 실패까지 남은 날. 단계는 글자로도 쓴다(색만으로 구분하지 않는다).
- 실패일이 캠페인 뒤면 TASK-0027 R1 문장(‘{campaignDays}일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다’)과 같은 뜻으로 쓴다.

### 6. 일정(명세 16-9)

- `schedule.ts:85`의 지급 행 문장을 종류별로 나눈다. `RENT` → ‘창고 임차료’, `SPACE_FEE` → 엔진의 `labelKo`(노선 이름 포함), `FREIGHT` → 지금 문장, `DUTY` → ‘수입 관세’다. 모르는 종류가 오면 `never` 검사로 컴파일이 실패하게 한다. 지금처럼 기본값으로 관세를 쓰지 않는다.
- `reports.ts:67-70` `labels`에 `['RENT', '창고 임차료 (기간마다 자동)']`, `['SPACE_FEE', '선복 계약 요금 (출항마다 자동)']`을 엔진 정렬 순서(OVERDUE·RENT·SPACE_FEE·WAGE·FREIGHT·DUTY)대로 넣는다.
- `main.ts:738`(묶인 돈 목록)과 `main.ts:780-781`(날짜 있는 지급 목록)의 이항 분기도 같은 방식으로 종류별로 나눈다.

### 7. 보고 문장(명세 16-10 일부)

- 규칙 2에서 ‘이번 판에는 달러를 원화로 바꾸는 기능이 없습니다’(`main.ts:834·835`)를 ‘환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다. 자동 환전은 없습니다.’로 바꾼다. 규칙 1 문장은 그대로 둔다.
- 원화 보고 주석(`reports.ts:22·23·28`의 ‘가상 환율 1,300원/달러는 보고에 쓰지 않습니다’)은 규칙 2에서 ‘환전 명령으로 실제 바꾼 금액만 기록합니다. 통화는 합치지 않습니다.’로 바꾼다.

### 8. 첫 화면 크기와 측정 준비

- 첫 화면 gzip 여유는 약 19.7 KB다. 규칙 2 화면 코드(새 `src/ui/market.ts` 등)가 첫 화면 gzip을 **10 KB 넘게** 늘리면 동적 import로 분리한다. 규칙 2 시나리오를 고를 때만 불러온다. 이 작업으로 한도를 넘으면 멈추지 말고 `node tools/check_bundle_size.mjs dist` 출력 원문과 증감을 보고한다. 한도·빌드 설정은 바꾸지 않는다.
- 세션 B의 Chromium 측정용으로, 결과 보고에 규칙 2 시나리오의 측정 상태 세 개를 재현 명령과 함께 적는다. 1일(시작), 8일(첫 묶음 공개), 15일(환전·수량 고르기 한 번 뒤)이다. 각 상태에서 보이는 칸 목록과 Tab 순서도 함께 적는다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/schedule.ts`, `src/ui/reports.ts`, `src/ui/trade.ts`, 새 `src/ui/market.ts`(시세표·견적 카드·환전 칸 도우미), `src/ui/style.css`.
- 새 시험 `src/ui/m2a5-trade-ui.test.ts`, 기존 UI 시험의 기대 문자열 줄(규칙 2에 해당하는 것만).
- `docs/ai/tasks/results/TASK-0033.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`(시나리오 이름 읽기만), `data/**`, `schemas/**`, `tools/**`.

## 시험(새 파일 `src/ui/m2a5-trade-ui.test.ts`)

- 문장마다 ‘나와야 하는 상태’와 ‘나오면 안 되는 반례’를 하나씩 둔다. 문장은 `toBe` 전체, 반례는 `not.toContain`으로 확인한다.
  - 예: 감액 문장은 늦지 않는 수량에서는 없다. 캠페인 뒤 도착 경고는 도착이 캠페인 안이면 없다. ‘새 관측 없음’은 마지막 공개 전에는 없다.
- 규칙 1 시나리오 화면이 `<BASE>`와 바이트로 같다. 대표 상태 3개(1일, 첫 계약 수락 뒤, 결산)의 렌더 문자열을 `<BASE>` 사본에서 만든 기대 파일과 비교한다. 기대 파일은 결과 보고에 sha256과 함께 적는다.
- 수량을 바꾸면 수락 명령의 `quantity`가 바뀌고, 엔진 `quotePreview`와 같은 값이 보인다.
- 키보드: 수량 고르기·환전 금액·방향이 Tab 순서 안에 있고 Esc로 닫힌다(TASK-0024 규칙).
- 일정·지급 표: RENT·SPACE_FEE 행이 ‘관세’로 나오지 않는다(반례). 지급 종류 분기는 `never` 검사로 빠짐없이 다룬다.


## 완료 조건

1. 범위 1~8 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0. 크기 검사는 위 8의 규칙대로 보고한다.
3. 기본 비교 실행기 `run` 400회 출력이 `<BASE>`와 바이트로 같다(엔진을 고치지 않았다는 확인).
4. 변형 시험(사본·편집기·되돌림·`cmp`, git으로 되돌리지 않음):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 견적판이 `config.offers`만 읽게 되돌림 | 생성 견적 카드 시험 |
| 2 | 수락 명령에 고른 `quantity`를 넣지 않음 | 수량 고르기 시험 |
| 3 | 캠페인 뒤 도착 경고 조건을 `>=`로 바꿈 | 도착 경고 반례 시험 |
| 4 | `schedule.ts`의 RENT를 관세 문장으로 되돌림 | 일정 반례 시험 |
| 5 | 환전 칸이 `exchangePreview` 대신 화면에서 환율을 곱함 | 환전 값 시험(엔진 값과 비교) |
| 6 | 규칙 1에서도 규칙 2 칸을 그림 | 규칙 1 바이트 비교 |

5. 결과 보고 `docs/ai/tasks/results/TASK-0033.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 크기 증감, 측정 상태 세 개, 변형 표, 범위 밖 발견, 질문을 적는다.
