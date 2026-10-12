# TASK-0033 M2a-5 화면 1: 규칙 2 시나리오 열기·시세표·견적 카드·환전·위쪽 막대·일정 — 초안

> **초안이다. 실행하지 않는다.** 세션 B의 TASK-0035(`main.ts`·`style.css`)가 병합된 뒤, 세션 A가 그 개발 브랜치 기준으로 줄 번호를 채우고 적대 검토를 거쳐 확정본으로 만든다(SESSION_TREE ‘줄 번호’ 규칙).

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: TASK-0031(+R1)·TASK-0032·TASK-0035 병합 뒤 개발 브랜치 `<BASE>`.
- 결정 근거: `docs/ai/design/M2A5-SPEC.md` 16절(화면 요구) 1·2·4·5·9·10, 13.1(늦은 인도 감액), 14.2~14.4·14.7·14.8(읽기 함수). `docs/DECISIONS.md`의 M2a-5 결정(D01 가 환전, D02 ①~⑤, D04 가 실패, Q10 감액, Q12 가 병목 표, Q13·Q13-2 경제). UI_SPEC 50행(색만으로 상태를 구분하지 않는다).
- 화면 2(창고·병목 표·고용 면담·경고·실패·결산)는 TASK-0034다. 두 작업은 `main.ts`를 함께 고치므로 차례로 돈다.

## 지금 상태(세션 A 확인, `bb9b535` 기준)

- 시나리오 고르기(`main.ts` `SCENARIO_IDS`)에 규칙 2 시나리오 `SCENARIO_M2_OPERATIONS`가 없다. `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`는 `src/content/scenario.ts`에 있다.
- 견적판(`offerBoard`)은 `config.offers`와 `tradePairs(config)`만 읽는다. 규칙 2의 생성 견적(`state.operations.offers`, `offerDef`, `openTradePairs`)은 화면에 나오지 않는다.
- 일정(`schedule.ts`의 지급 행)은 `FREIGHT`가 아닌 행을 모두 ‘수입 관세’로 적는다. 그래서 `RENT`·`SPACE_FEE`가 관세로 잘못 보인다.
- 경영 보고 문장 ‘이번 판에는 달러를 원화로 바꾸는 기능이 없습니다’는 규칙 2에서 거짓이다.
- 엔진 읽기 함수는 모두 있다: `marketTable`, `quotePreview`(`OperationsQuotePreview`), `exchangePreview`, `paymentDefaultStatus`, `payrollRunwayDay`, `upcomingPayments`(RENT·SPACE_FEE 행 포함).

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
- **캠페인 뒤 도착 경고(TASK-0030 검수 2절):** 예상 도착일이 `campaignDays`보다 뒤면 ‘{campaignDays}일 캠페인 안에 인도되지 않습니다. 결산에 미인도로 남습니다.’ 예상 도착일은 수락하면 잡힐 출항편의 도착 예정일이다. 읽기 함수에 이 값이 없으면 `quotePreview`가 고른 출항편으로 계산하는 화면 도우미를 만들고, 계산식을 결과 보고에 적는다(엔진은 고치지 않는다).

### 4. 환전 칸(명세 16-4, D01 가)

- 방향(USD→KRW / KRW→USD), 금액(100 USD 단계), ‘게임용 고정 환율 1,287원(받을 때) · 1,313원(살 때)’(값은 `config.operations.fx`), 받는/내는 금액, 차감, 쓸 수 있는 USD = 현금 − 예약(계약·선복 요금) − 미지급, 급여 가능일 전/후, ‘자동 환전은 없습니다’, `warningKo`.
- 값은 모두 `exchangePreview`에서 읽는다. 화면에서 다시 계산하지 않는다.
- 명령 `EXCHANGE_CURRENCY`를 대기열에 넣는다. 거절되면 엔진 문장을 그대로 보인다.

### 5. 위쪽 막대(명세 16-5)

- 원화 급여 가능일(임차료 포함, `payrollRunwayDay`).
- 지급 불이행 단계(`paymentDefaultStatus`): ‘정상 / 경고 / 위험’과 실패까지 남은 날. 단계는 글자로도 쓴다(색만으로 구분하지 않는다).
- 실패일이 캠페인 뒤면 TASK-0027 R1 문장(‘{campaignDays}일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다’)과 같은 뜻으로 쓴다.

### 6. 일정(명세 16-9)

- `schedule.ts` 지급 행: `RENT` → ‘창고 임차료’, `SPACE_FEE` → ‘선복 계약 요금 · {노선}’, `FREIGHT` → 지금 문장, `DUTY` → ‘수입 관세’. 종류를 모두 이름으로 나누고, 모르는 종류가 오면 시험이 실패하게 한다(지금처럼 기본값으로 관세를 쓰지 않는다).
- `main.ts`의 같은 분기(지급 표)도 같이 고친다.

### 7. 보고 문장(명세 16-10 일부)

- 규칙 2에서 ‘이번 판에는 달러를 원화로 바꾸는 기능이 없습니다’를 ‘환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다. 자동 환전은 없습니다.’로 바꾼다. 규칙 1 문장은 그대로 둔다.
- 원화 보고 주석(`reports.ts`의 ‘가상 환율 1,300원/달러는 보고에 쓰지 않습니다’)은 규칙 2에서 ‘환전 명령으로 실제 바꾼 금액만 기록합니다. 통화는 합치지 않습니다.’로 바꾼다.

## 고칠 수 있는 파일(확정본에서 줄 번호와 함께 다시 정한다)

- `src/ui/main.ts`, `src/ui/schedule.ts`, `src/ui/reports.ts`, `src/ui/trade.ts`, 새 `src/ui/market.ts`(시세표·견적 카드·환전 칸 도우미), `src/ui/style.css`.
- 새 시험 `src/ui/m2a5-trade-ui.test.ts`, 기존 UI 시험의 기대 문자열 줄(규칙 2에 해당하는 것만).
- `docs/ai/tasks/results/TASK-0033.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`(시나리오 이름 읽기만), `data/**`, `schemas/**`, `tools/**`.

## 시험(요지, 확정본에서 사례별로 적는다)

- 문장마다 ‘나와야 하는 상태’와 ‘나오면 안 되는 반례’를 하나씩 둔다. 문장은 `toBe` 전체, 반례는 `not.toContain`으로 확인한다.
  - 예: 감액 문장은 늦지 않는 수량에서는 없다. 캠페인 뒤 도착 경고는 도착이 캠페인 안이면 없다. ‘새 관측 없음’은 마지막 공개 전에는 없다.
- 규칙 1 시나리오 화면이 TASK-0035 병합 머리와 바이트로 같다(대표 상태 3개의 렌더 문자열 비교).
- 수량을 바꾸면 수락 명령의 `quantity`가 바뀌고, 엔진 `quotePreview`와 같은 값이 보인다.
- 키보드: 수량 고르기·환전 금액·방향이 Tab 순서 안에 있고 Esc로 닫힌다(TASK-0024 규칙).
- 일정: RENT·SPACE_FEE 행이 관세로 나오지 않는다(반례), 모르는 종류는 예외.

## 확정 전 세션 A 확인 항목

- TASK-0035 병합 뒤 `main.ts`·`style.css` 줄 번호.
- 캠페인 뒤 도착일을 엔진 읽기 함수가 주는지(없으면 화면 도우미 식을 확정본에 적는다).
- TASK-0032로 판매가·물량 배수가 바뀐 뒤의 시험 기대값.
