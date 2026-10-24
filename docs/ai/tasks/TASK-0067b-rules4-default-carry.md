# TASK-0067b 경로 3 v2 엔진 ②: 대손·회수·지연 이자·`WRITTEN_OFF`·위험 분해, `withRiskLevelV2`의 R4

- 지위: **승인(허브, 2026-10-24, 개정 1 c6280f4).** 초안(`c433544`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0067b-HUB-2026-10-24.md`(확인 19, 기각 0)에서 수정 E1~E13을 받았다. 처리는 끝의 ‘개정 1 처리표’에 있다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0067a(+R1)가 병합됐다(개발 브랜치 `dbe49c4`, 기록 `5e4ecd9`). `creditTermCheck`·`creditTermOptions`·`loadCreditProfile`·`withRiskLevelV2`(R0P~R3)·`RISK_PROFILE_V2`가 있다.
  - **`BASE`는 작업 트리를 만든 커밋이다.** `dbe49c4` 다음, 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- **기준 문서와 우선 규칙**(H26-2)
  - 기준: `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인) 4·5.1·5.2·7.1절, 판정표 v2 5.2, 허브 결정 H24-3·H26, `docs/ai/tasks/results/PRECHECK-0067-HUB-2026-10-24.md`의 D3·D4·D7~D11·D15·D21.
  - **이 지시서가 정한 함수 경계·자료 이름·흐름 정의는 이 지시서를 따른다. 그 밖은 기준 문서를 따른다.** 다르게 해야 할 다른 이유가 생기면 멈추고 보고한다.
  - 승인된 설계와 다른 점(E2):

    | 설계 | 이 지시서 | 근거 |
    |---|---|---|
    | `default` 성분 = −대손액, 확정일 환율(H26-4, DESIGN-v2:199) | `default = usdToKrwMinor(R, r_T) − usdToKrwMinor(U, r_T)`(받지 못한 금액 U를 회수 R로 바꾼 차이). `−usdToKrwMinor(U − R, r_T)`와 1원 단위로 다를 수 있다 | 단계 흐름의 차이로 성분을 정의해야 `residual = 0`이 된다(6절) |
- 범위 밖: 실행기·정책·판정 도구(0068), 화면(경로 11), 측정.
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 1절 1의 비위험 회귀 확인(`run.mjs run` 기본 시드)뿐이다(바이트 비교).

## 0. 0067a에서 얻은 교훈(허브 전달)

1. **자료를 바꾸면 출력 메타데이터도 바뀐다.** `data/market_rules.json`을 바꾸면 d03 출력의 `meta.risk.marketRulesSha256`가 바뀐다. 이 지시서는 자료 값을 바꾸지 않는다(4절의 검증기 추가만). 그래도 자료 파일이 바뀌면 0067a 4.4의 비교 방법(그 키를 지우고 비교, 값은 따로 확인)을 쓴다.
2. **반올림 시험은 나머지가 생기는 값을 쓴다.** 하루 이자가 정수로 떨어지는 고정물은 ‘날마다 반올림’ 같은 결함을 못 잡는다. 7절의 손 계산 값은 모두 나머지가 생기게 골랐다.

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **rules-1·2·3은 바이트로 같다.** 작업 전과 끝에 셋이 모두 같아야 한다. 어긋나면 골든을 다시 쓰지 말고(`--write` 금지) 멈춰 보고한다.
   - `node tools/check_rules2_golden.mjs` → 0
   - `node tools/check_rules3_golden.mjs` → 0(로더 지문 경고로 1이 나도 실패)
   - 비위험 회귀(E13): 작업 전 `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-run-before.json`, 작업 끝 `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-run-after.json`, 그 뒤 `cmp /tmp/TASK-0067b-run-before.json /tmp/TASK-0067b-run-after.json`이 같다
2. **기존 시험 파일은 고치지 않는다.** 0067a의 `src/engine/m2a5-risk-credit-v2.test.ts`도 고치지 않는다. 새 시험은 새 파일 `src/engine/m2a5-risk-default-v2.test.ts`에 둔다.
   - `src/engine/m2a5-risk-fx.test.ts`의 318행 시험과 342행 단언은 바꾸지 않는다(`operations.ts:266`은 rules-3 골든 도달 0).
3. **저장 형식 6을 유지한다.** 새 열거 값(`WRITTEN_OFF`, `RECEIVABLE_CARRY`, `BAD_DEBT`)은 rules-4 저장에만 나타난다. rules-1~3 저장 바이트가 바뀌면(근거 2) 멈추고 보고한다.
   - 근거 3(E7): BASE(0067a) 빌드의 `deserializeSave`가 `WRITTEN_OFF`·`BAD_DEBT`·`RECEIVABLE_CARRY`가 든 rules-4 저장을 거절함을 일회 실행으로 확인한다. 거절은 `checkSaveShape`의 ‘저장 필드 모양’ 오류로 난다. 새 값이 없는 rules-4 저장을 BASE가 읽는 것은 측정 전용 판본이라 허용한다. 거절되지 않으면 멈추고 보고한다.
4. **rules-3 출력 객체의 키를 늘리지 않는다.** 0062a·0062b 탐침이 `contractReport`·`contractRiskReport`·`campaignSummary`·`receivableSchedule`·`BookSummary`를 해시한다. 새 키는 rules-4에서만 둔다(6절).
5. **첫 화면 gzip을 작업 전후로 적는다**(허브 요청). `npm run --silent build && node tools/check_bundle_size.mjs dist`의 첫 화면 gzip 바이트를 BASE와 끝에서 각각 적는다. 한도를 넘으면 멈추고 보고한다(0067a 병합본 131,180 B, 여유 약 8.8 KB).
6. 미래 누설 금지: 대손 여부·확률은 플레이어 읽기 함수(미리보기·조건 선택지)에 나오지 않는다. 대손은 **확정일**에야 원장·로그·상태에 나타난다.
7. 커밋·푸시·브랜치 전환은 하지 않는다.

## 2. 층과 변환

- `withRiskLevelV2`의 `level`에 `'R4'`를 더한다. 층은 R3 층 + `'DEFAULT'`, `'CARRY'`다.
- R0P~R3의 동작·원장·상태는 0067a와 같다. 다만 rules-4에서는 `contractRiskReport.components`에 `default`·`carry`(값 0)가 추가된다(E3). 시험 1이 이것을 확인한다.

## 3. 대손(DESIGN-v2 5.1·5.2, H24-3)

### 3.1 추첨

- 순수 함수 `defaultFor(config, seed, sellOfferId, customerId, termId): boolean`(`risk.ts`).
  - `DEFAULT` 층이 없으면 `false`.
  - 등급 = `config.operations.risk.profile.collections.byCounterparty`의 거래처 등급. 확률 = `divHalfAway(pDefaultBp[등급] × factorPct[termId], 100)`(`credit.pDefaultBpByGrade`, `credit.terms`).
  - 대손 = `uniformInt(seed, 'COLLECT:' + sellOfferId + ':default', 0, 9999) < 확률`. 기존 흐름(`:mode`, `:days`)의 추첨값은 바뀌지 않는다.
- `processCollections`(engine.ts:1141 부근)에서 직접 무역 청구서마다 `collectionPlan`보다 **먼저** 부른다. 대손이 아니면 지금 경로 그대로다.
- 대손이면 그 청구서는 확정일 전까지 아무것도 받지 않는다. 상태는 결제일 뒤 `OVERDUE`다(지금 규칙과 같다). 결제일 로그 ‘결제일에 대금이 들어오지 않음’은 지금처럼 남는다.

### 3.2 확정 규칙(하나, H24-3)

- 확정일 = `inv.dueDay + lateMaxDays`. `inv.dueDay`는 실효 결제일(`max(contract.paymentDueDay, 인도일)`, engine.ts의 청구서 생성)이고, 비BASE 계약의 `paymentDueDay`에는 이미 기간이 들어 있다.
- **확정일 ≤ campaignDays일 때만 그날 확정한다.** 넘으면 확정하지 않는다. `≤ campaignDays`는 엔진의 날 진행이 campaignDays에서 끝나므로 저절로 성립한다. 이것을 지키는 자리는 7절 11의 불변식이다(E4). 그 청구서는 캠페인 끝까지 `OVERDUE`로 남아 결산 매출채권에 들어간다. BASE를 포함한 모든 계약에 같은 규칙이다. `min(…, 90)` 같은 처리는 없다.
- 같은 날 순서(고정): ① 회수 → ② 이자 → ③ 대손 → ④ 상태
  1. 회수액 `R = applyBasisPoints(남은 금액, recoveryBp)`. 분개 `RECEIPT-RCPT-{inv}-R`: 차변 `CASH` R, 대변 `ACCOUNTS_RECEIVABLE` −R, `contractId`. `receiptIds`에 `RCPT-{inv}-R`. R = 0이면 분개하지 않는다.
  2. 이자 분개(4절). 층 검사는 `carryAccrued` 한 자리에만 있다(E5). 층이 없으면 그 값이 0이라 분개하지 않는다.
  3. `BADDEBT-{inv}`: 차변 `BAD_DEBT` (남은 금액 − R), 대변 `ACCOUNTS_RECEIVABLE` −(남은 금액 − R). `CASH` 줄 없음. `contractId`.
  4. 청구서 `status = 'WRITTEN_OFF'`, 계약 `status = 'COMPLETED'`, `completedDay = s.day`.
  - 로그 한 줄: `{계약} 대금 회수 불능 확정: {회수액} 회수, {손실} 대손 처리`(`formatMoney`).
- ‘남은 금액’은 확정 직전 `inv.amountMinor − receivedForInvoice(s, inv.id)`다. 대손 청구서는 그 전에 받은 것이 없으므로 보통 `inv.amountMinor`다.

## 4. 지연 이자(DESIGN-v2 4절, H26-3 (a), D7·D9)

- 순수 함수 `carryAccrued(s, config, invoiceId, day): number`(`risk.ts`). **엔진 분개·불변식·위험 보고가 이 함수 하나만 쓴다.**
  - 반환값은 반올림 전의 합 `A = Σ_{d = dueDay+1 .. day−1} remaining_close(d) × carryBpPerDay`(단위: 센트 × bp).
  - `remaining_close(d) = inv.amountMinor − (그 청구서 수금 분개 가운데 entry.day ≤ d인 것의 CASH 합)`. 수금 분개는 `RECEIPT-RCPT-{inv}` 접두(`receivedForInvoice`와 같은 규칙)다.
  - `WRITTEN_OFF` 청구서는 `BADDEBT-{inv}` 분개일과 그 뒤의 `remaining_close`를 0으로 본다. 대손은 현금이 아니라서 수금 합으로는 남은 금액이 0이 되지 않기 때문이다. 그래서 확정 뒤에는 쌓이지 않는다.
  - **분개일 `day` 당일은 넣지 않는다**(D7).
  - `CARRY` 층 검사는 이 함수 한 자리에만 둔다(E5). 그래서 확정일 당일의 회수·대손과 무관하고, 수금일 당일의 수금 전후 해석 문제도 없다. 수금일 당일 마감의 남은 금액은 다음 분개의 첫날로 들어간다.
  - `CARRY` 층이 없거나 직접 무역 청구서가 아니면 0.
- 분개 금액 = `divHalfAway(carryAccrued(…, t), 10000) − (그 청구서의 이미 적은 CARRY 합)`. 0이면 분개하지 않는다.
- 분개 시점: 그 청구서의 **각 수금일**(지연 전액, 부분 수금의 둘째 수금)과 **대손 확정일**. 수금 분개 **뒤**에 적는다(확정일은 3.2 순서).
  - **마지막 수금일의 이자는 청구서가 `PAID`로 바뀐 뒤에도 적는다**(D9). 상태 검사로 건너뛰지 않는다. 그 뒤 날짜에는 쌓지 않는다.
  - `WRITTEN_OFF` 뒤에는 쌓지 않는다.
- 분개 `CARRY-{inv}-{n}`: 차변 `RECEIVABLE_CARRY` 금액, 대변 `CASH` −금액, `contractId`. n은 그 청구서의 CARRY 순번(1부터).
- 원장: `Account`·`ACCOUNT_KIND`에 `RECEIVABLE_CARRY: 'expense'`, `BAD_DEBT: 'expense'`. `summarize`의 `profit` 식에서 두 계정을 뺀다. `BookSummary`에 새 필수 칸을 두지 않는다.
- `contractReport`의 `contribution`에서 계약에 귀속된 두 계정 금액을 뺀다. 반환 객체에 새 키를 두지 않는다.

## 5. `WRITTEN_OFF` 경로(D10)

- `InvoiceStatus`에 `'WRITTEN_OFF'`(save-shape 열거 포함).
- 아래 자리에서 `WRITTEN_OFF`를 `PAID`처럼 ‘끝난 청구서’로 다룬다. 결과 보고에 자리별 전후 줄을 적는다.
  - 수금: `processCollections`(engine.ts:1201), `applyPartialReceipt`(:1227), `applyReceipt`(:1253)
  - `operations.ts`의 다음 수금 예정일(:254)과 그날 수금 금액 합(:265)
  - `reports.ts`의 `campaignSummary.openInvoices`(:400)와 `receivableSchedule`(:411)
  - `progress.ts:60`(미수 안내). 대손 청구서는 이 분기에 도달하지 않지만 일관성 때문에 고친다(E9).
  - `progress.ts:48`: 대손으로 `COMPLETED`가 된 계약에 ‘수금 완료’ 대신 `{completedDay}일 대금 회수 불능 · 대손 종결`
  - `invariants.ts:113-117`의 ‘매출채권 = 미수 청구서 남은 금액 합’에서 뺀다
- 고치지 않는 자리(E8): `operations-invariants.ts:17`은 `PAID` 전용 금액 검사라 그대로 둔다. `WRITTEN_OFF`의 금액 검사는 7절 11의 새 불변식이 맡는다. `save-shape.ts:32`, `types.ts:203`, `engine.ts:1238·1269`도 고칠 대상이 아니다.
- `grep -rn "'PAID'" src/engine`으로 위 목록 밖의 자리를 찾아 같은 원칙으로 고치고 모두 적는다.
- **화면(`src/ui`)은 고치지 않는다**(D11). `grep -rn "'PAID'" src/ui` 결과(지금 `main.ts:402·698·905`, `schedule.ts:73`)를 결과 보고 ‘범위 밖’에 적는다. 경로 11 지시서로 넘긴다.
- 노출액(0067a `creditTermCheck`)은 청구서 `OUTSTANDING`·`OVERDUE`만 세므로 `WRITTEN_OFF`가 저절로 빠진다. 시험 4가 이것을 단언한다(H26-1에서 옮겨 온 단언).

## 6. 위험 분해 `contractRiskReport`(D3, H26-4)

rules-4에서만 아래를 적용한다. rules-3의 흐름·키·순서는 그대로다.

- **실현값 쪽**
  - `WRITTEN_OFF` 청구서의 남은 흐름(`remaining`의 outstanding)은 **0**이다(대손은 현금이 아니다).
  - 아직 적지 않은 이자: `divHalfAway(carryAccrued(s, cfg, inv, min(evaluationDay, lastClosedDay) + 1), 10000) − 적은 CARRY 합`을 `flow(−그 값, evaluationDay, cost = true)`로 `remaining`에 더한다(0이면 넣지 않는다). `lastClosedDay`는 `max(s.closedDays)`다(없으면 0). `+ 1`인 까닭: 4절의 합은 분개일 당일을 빼므로, 마감한 날까지 넣으려면 다음 날을 준다(E6). 마감하지 않은 날의 남은 금액은 아직 정해지지 않았으므로 넣지 않는다.
  - `CARRY-` 분개는 이미 `cashFlows`에 `cost = true`(분개일)로 들어간다(`RECEIPT-` 접두가 아니므로). `RECEIPT-RCPT-{inv}-R`은 `cost = false`(확정일)로 들어간다.
- **단계**(collection 다음, `open_valuation` 앞)
  - collection 단계: 지금 식 그대로이되, `WRITTEN_OFF` 청구서는 ‘정상 수금 분개(‑R 제외) + 받지 못한 금액(`inv.amountMinor − 정상 수금 합`)을 확정일·cost = false 흐름 하나’로 둔다. 확정되지 않은 청구서는 지금처럼 평가일의 outstanding이다.
  - **default 단계**: collection 흐름에서 그 ‘받지 못한 금액’ 흐름을 `-R` 회수 흐름(확정일·cost = false)으로 바꾼다. `default = value(이 흐름) − value(collection 흐름)`.
  - **carry 단계**: default 흐름에 `CARRY-` 분개(분개일·cost = true)와 아직 적지 않은 이자(평가일·cost = true)를 더한다. `carry = value(이 흐름) − value(default 흐름)`.
  - 그래서 carry 단계의 흐름 집합 = 실현값의 흐름 집합이고 `residual = 0`이다.
  - **주의(E1)**: `residual`은 ‘실현값 − value(마지막 단계)’이므로 default 단계 뒤에는 받지 못한 금액 U 흐름이 남지 않는다. 그래서 collection 단계의 U 날짜 결함은 `residual`로 잡히지 않는다. 그것은 7절의 `default` 손 계산 값으로 잡는다.
- `components` 키 순서(rules-4): `schedule, fx, tariff, surcharge, late, claim, cancel, collection, default, carry, open_valuation, residual`. rules-3은 지금 그대로다(`default`·`carry` 키 없음).

## 7. 시험(새 파일 `src/engine/m2a5-risk-default-v2.test.ts`)

손 고정물 위주, 시드 2001 이상. ‘BASE와 같음’은 골든 일치로 갈음하거나 BASE에서 잰 리터럴을 박는다.

**손 계산 값**(나머지가 생기게 고름. `carryBpPerDay = 3`, `recoveryBp = 3000`, `partialBp = 5000`, `lateMaxDays = 15`, 청구액 12,345센트, 결제일 10)

| 경우 | 이자 합 A | CARRY | 날마다 반올림했다면 | 그 밖 |
|---|---:|---:|---:|---|
| 지연 전액, 16일 수금 | 11~15일 5일 × 12,345 × 3 = 185,175 | **19** | 20 | 16일 `RECEIPT-RCPT-INV-…` 12,345 뒤 `CARRY-…-1` 19 |
| 부분 수금, 10일 6,173 · 16일 6,172 | 11~15일 5일 × 6,172 × 3 = 92,580 | **9** | 10 | 첫 수금 `applyBasisPoints(12,345, 5000) = 6,173` |
| 대손, 25일 확정 | 11~24일 14일 × 12,345 × 3 = 518,490 | **52** | 56 | R = `applyBasisPoints(12,345, 3000) = 3,704`, BADDEBT 8,641 |

**위험 분해 성분 식**(E2, 확정일 환율 r_T)

| 성분 | 식 | 주석 |
|---|---|---|
| `default` | `usdToKrwMinor(3704, r_T) − usdToKrwMinor(12345, r_T)` | `−usdToKrwMinor(8641, r_T)`가 **아니다**. r_T = 1206 또는 1214처럼 두 식이 1원 갈리는 환율을 고정물로 고른다 |
| `carry` | `value(default 단계 흐름 + CARRY 흐름) − value(default 단계 흐름)` | CARRY는 cost 흐름이라 같은 환율의 원가 흐름과 합친 뒤 한 번 반올림한다(`value`의 규칙) |

1. **변환**: `withRiskLevelV2(..., 'R4')`의 층. R0P~R3의 동작·원장·상태가 0067a와 같고, `contractRiskReport.components`에는 `default`·`carry`가 0으로 있음(E3).
2. **대손 추첨**: `defaultFor`의 결정론, 확률식(`divHalfAway(base × factor, 100)`), `DEFAULT` 층이 없으면 false.
3. **확정**
   - 확정일 ≤ 90: 위 표 대손 행의 분개 **ID 순서 전체**(`RECEIPT-RCPT-{inv}-R`, `CARRY-{inv}-1`, `BADDEBT-{inv}`)와 금액, 상태, 로그(D15).
   - 확정일이 정확히 90이면 확정, **91이면 확정되지 않고** 끝에 `OVERDUE`·매출채권 잔액이 남음(D16 이월). BASE 계약에서도 같은 규칙.
4. **노출액과 `WRITTEN_OFF`**: 비BASE 계약의 청구서가 `WRITTEN_OFF`가 되면 `creditTermCheck`의 `exposureMinor`에서 빠짐(H26-1).
5. **지연 이자**: 위 표의 세 경우. 마지막 수금일의 CARRY가 0이 아님(D9). 정시 수금은 0. `CARRY` 층이 없고 지연 수금인 고정물에서 `carryAccrued`가 0이고 `CARRY-` 분개가 없음(E5).
6. **`WRITTEN_OFF` 경로**(D15, E9): 손 고정물 — 가장 오래된 미지급이 USD이고, 더 이른 `dueDay`의 `WRITTEN_OFF` 청구서, 더 늦은 미수 청구서, 그리고 그 미수 청구서와 `dueDay`가 같은 `WRITTEN_OFF` 청구서가 있다. `paymentDefaultStatus(...).recovery.nextReceipt.day`가 미수 청구서의 `dueDay`이고, `nextReceipt.amountMinor`가 미수 청구서 금액뿐이다. 그 밖 5절 목록의 함수가 그 청구서를 건너뜀. 매출채권 불변식 통과. `progress.ts:48` 문구.
7. **대손 아닌 청구서는 R3와 같음**(D21): 같은 손 고정물 상태(rules-4)를 R3 설정과 R4 설정으로 명령 없이 같은 날수만큼 진행했을 때, 대손이 아닌 청구서의 `RECEIPT-` 분개 ID·날짜·금액이 같다. (R4에는 `CARRY-` 분개가 더 있을 수 있다.)
8. **위험 분해**(D3, E1·E2·E6): R4(환율 켬)에서 `WRITTEN_OFF` 계약, 확정되지 않은 대손 계약, 지연 이자 계약마다 `residual === 0`.
   - `WRITTEN_OFF` 고정물 조건: USD 계약, 확정일 ≤ 77, 평가일은 확정일과 다른 공시 주, 시드는 2001 이상에서 그 사이 환율 걸음이 0이 아닌 것. **첫 단언**으로 `referenceRate(확정일) ≠ referenceRate(평가일)`을 확인한다.
   - `default`·`carry`를 위 성분 식으로 `referenceRate`를 써서 따로 계산해 비교한다.
   - 미기재 이자는 진행 중 상태(평가일 = 오늘, 마감 전)와 캠페인 끝 상태를 각각 고정한다.
   - rules-3 `components`의 키 목록이 BASE 리터럴과 같음.
9. **원장·보고**: `profit`에 두 계정 반영. `contractReport`의 키 목록이 BASE 리터럴과 같음. rules-3 `BookSummary` 키 목록이 BASE 리터럴과 같음.
10. **저장**: rules-4 상태(`WRITTEN_OFF` 청구서·두 계정 포함) 저장 왕복 바이트 같음.
11. **불변식**: `WRITTEN_OFF` 청구서는 `-R`(R > 0일 때) 하나와 `BADDEBT` 하나를 갖고 둘의 합 = 확정 직전 남은 금액, 그 뒤 `RECEIPT-`·`CARRY-` 없음. 확정일 > campaignDays인 청구서는 `WRITTEN_OFF`일 수 없음. 그 청구서의 CARRY 합 = `divHalfAway(carryAccrued(마지막 CARRY 분개일), 10000)`. 각 위반 상태를 손으로 만들어 위반 문장을 단언한다.
12. **미래 누설**(E12): 같은 결제일의 대손 청구서와 대손 아닌 지연 청구서를 두고, **확정 전날** 기준으로 다음이 같다.
   - 두 청구서 객체(`id`·금액 제외)
   - 해당 계약 객체(`id`·금액 제외)
   - 해당 계약의 로그 줄(계약 ID를 지운 문구)
   - `contractProgress`와 `paymentDefaultStatus` 출력

## 8. J1 점검(D4, H26-4) — vitest가 아니라 일회 실행

- 저장소 밖(`/tmp`) 스크립트로 돌리고 결과를 보고에 붙인다. 저장소에 남기지 않는다.
- 실행 틀(E11): `createRequire('<repo>/package.json').resolve('vite')`로 vite를 불러 `runnerImport('<repo>/src/engine/sim/sim.ts')`(필요한 다른 모듈도 같은 방식)로 엔진을 연다.
- 호출: `simulate(withRiskLevelV2(withLateMode(loadScenario('SCENARIO_M2_OPS_COS_LAVER'), 'base'), 'R4', loadRiskProfile('RISK_PROFILE_V2'), loadCreditProfile('RISK_PROFILE_V2')), policyById('MAX_CONTRIBUTION'), seed)`. 다섯째 인수는 주지 않는다. 시드 2001~2010.
- 성공 기준(시드마다): **예외 없이 끝나고**, `state.operations.outcome !== 'FAILED'`이며, 끝의 원화 미지급 의무(`currency === 'KRW' && paidDay === null`) 합이 0. 예외가 나면 시드와 메시지를 표에 적고 멈춘다(E11).
- 시드별로 대손 건수·금액, CARRY 합, 확정되지 않은 대손 수, 끝 outcome을 표로 적는다.
- **하나라도 어긋나면 고치지 말고 전체를 멈춰 보고한다.** 엔진 결함인지 경제 값 문제인지는 허브가 판단한다. `it.skip`이나 기대값 조정은 금지한다.

## 9. 검증기(세션 A m1)

- `tools/validate_data.py`의 외상 검사(0067a `check_credit_profile`)에 **‘외상 칸이 있으면 `collections.grades`에 A·B·C 행이 각 하나 있다’**를 더한다. 비대칭 계산만 보면 `grades.get(g, 0)`이라 0으로 통과한다(등급 참조 검사가 따로 막는다)(E10).
- 메시지는 `collections.grades: A·B·C 각 한 행 필요`로 고정한다.
- `tools/test_validate_data.py`에 거부 사례를 더한다(더하기만): B 등급 거래처를 A로 바꾼 뒤 B 행만 뺀다. 이 메시지를 단언한다.

## 10. 변형 시험(임시로 고치고 되돌림)

| 번호 | 변형 | 기대 |
|---|---|---|
| 1 | 확정 순서를 대손 → 회수로 | 시험 3 실패(ID 순서) |
| 2 | 이자를 날마다 반올림 | 시험 5 실패(19 대신 20) |
| 3 | `carryAccrued`에 분개일 당일을 넣음 | 시험 5 실패 |
| 4 | 마지막 수금일 CARRY를 `PAID` 상태 검사로 건너뜀 | 시험 5 실패(D9) |
| 5 | `operations.ts`의 다음 수금 예정에서 `WRITTEN_OFF` 건너뜀 상태 조건 전체를 지움 | 시험 6 실패(D15) |
| 6 | 확정 조건 `≤ campaignDays`를 `<`로 | 시험 3 실패(90 경계) |
| 7 | 시험 11의 불변식 ‘확정일 > campaignDays인 청구서는 `WRITTEN_OFF`일 수 없음’을 지움 | 시험 11 실패(손으로 만든 위반 상태, E4) |
| 8 | `defaultFor`의 `DEFAULT` 층 검사를 지움 | 시험 2 실패, rules-4 R3 관련 시험 실패 |
| 9 | `carryAccrued`의 `CARRY` 층 검사를 지움 | 시험 5 실패(E5) |
| 10 | default 단계의 −R 회수 흐름 날짜를 평가일로 둠(cost = false 유지) | 시험 8 실패(`residual ≠ 0`, E1) |
| 11 | 실현값의 `WRITTEN_OFF` outstanding을 0으로 두지 않음 | 시험 8 실패 |
| 12 | `progress.ts:48`의 대손 문구를 지움 | 시험 6 실패 |
| 13 | 검증기 A·B·C 행 필수 검사를 지움 | `test_validate_data.py`의 새 사례 실패 |
| 14 | 대손 추첨 즉시(결제일) 로그에 다른 문구를 남김 | 시험 12 실패(E12) |
| 15 | `operations.ts:265`(그날 수금 금액 합)의 `WRITTEN_OFF` 건너뜀만 되돌림 | 시험 6 실패(`nextReceipt.amountMinor`, E9) |

- 모두 되돌린 뒤 1절 1의 세 검사가 같고 `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 11. 완료 조건

1. 1절 1의 세 검사가 작업 전·후 같다(로더 지문 포함).
2. 기존 시험 파일 변경 없음
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력이다.
   - `git diff --numstat <BASE> -- tools/test_validate_data.py`의 삭제 수가 0이다.
   - `git status --porcelain --untracked-files=all`의 `??` 줄은 새 시험 파일과 결과 보고뿐이다.
3. 새 시험과 변형 15개가 기대대로다. J1 점검(8절) 결과를 그대로 적는다.
4. 첫 화면 gzip 전·후 값(1절 5)이 한도 안이다.
5. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
6. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `검사 18종, 실패 0종 (모드: 확인)`이다.
7. 결과 보고 `docs/ai/tasks/results/TASK-0067b.md`.

## 12. 고칠 수 있는 파일

- `src/engine/types.ts`, `risk.ts`, `engine.ts`, `operations.ts`, `invariants.ts`, `reports.ts`, `ledger.ts`, `progress.ts`, `save-shape.ts`
- 5절 grep으로 찾은 `PAID` 판정 자리가 있는 `src/engine/*.ts`(시험 파일 제외, 보고에 목록)
- 새 파일 `src/engine/m2a5-risk-default-v2.test.ts`
- `tools/validate_data.py`, `tools/test_validate_data.py`(더하기만)
- `MANIFEST.json`(생성만), `docs/ai/tasks/results/TASK-0067b.md`
- 그 밖(`data/**`, `schemas/**`, `src/ui/**`, `src/engine/sim/**`, `src/content/**`, 골든 파일·도구, 기존 시험 파일)은 고치지 않는다. 필요하면 멈추고 보고한다.

## 13. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 1절 1 세 검사와 첫 화면 gzip의 전·후
- 5절 자리별 전후 줄, `src/engine`·`src/ui`의 `PAID` grep 결과
- 7절 손 계산 표와 실제 값, 6절 흐름 정의를 구현한 자리
- 새 시험 출력, 변형 표, J1 점검 표
- `review_checks` 줄
- 0068에 넘길 것: 진단 U가 읽을 값(대손 건수·금액, CARRY 합, 확정되지 않은 대손 수, 한도로 막힌 수)을 상태·원장에서 읽는 법, `RiskContract`에 넣을 `default`·`carry` 성분
- 범위 밖에서 발견한 것, 질문

## 14. 처리표(`PRECHECK-0067-HUB-2026-10-24.md`의 0067b 몫, H26)

| id | 처리 |
|---|---|
| D3 | 6절 흐름 정의, 시험 8, 변형 10·11 |
| D4 | 8절 J1 일회 실행, 멈춤 |
| D7 | 4절 분개일 당일 제외, 손 계산 표 |
| D8 | 7절 손 계산 표(나머지 있는 값), 변형 2 |
| D9 | 4절 마지막 수금일 CARRY, 시험 5, 변형 4 |
| D10 | 5절 목록(reports.ts:400·411, progress.ts:48) |
| D11 | 5절 `src/ui` grep은 보고만 |
| D15 | 시험 3 ID 순서, 시험 6 고정물, 변형 5 |
| D21 | 시험 7(같은 손 고정물, R3 대 R4) |
| H26-1 | 시험 4(`WRITTEN_OFF` 노출액) |
| H26-3 (a) | 4절 `carryAccrued` 하나 |
| H26-4 | 6절, 8절 |
| 세션 A m1 | 9절, 변형 13 |
| 허브 교훈 2가지 | 0절 |
| 허브 요청 gzip | 1절 5, 11절 4 |

## 개정 1 처리표(`PRECHECK-0067b-HUB-2026-10-24.md` 4절)

| 수정 | 반영 자리 |
|---|---|
| E1 | 변형 10, 시험 8 고정물 조건·첫 단언, 6절 주의 |
| E2 | 7절 성분 식 표, 시험 8, 머리 이탈 표 |
| E3 | 2절, 시험 1, 1절 4 ‘6절’ |
| E4 | 변형 7, 3.2 문장 |
| E5 | 3.2 ②, 4절, 변형 9, 시험 5 |
| E6 | 6절 미기재 이자 상한, 시험 8 |
| E7 | 1절 3 근거 3 |
| E8 | 5절 고치지 않는 자리 |
| E9 | 5절 줄 번호·이름·progress.ts:60, 시험 6, 변형 15 |
| E10 | 9절 문장·메시지·거부 사례 |
| E11 | 8절 실행 틀·예외 기준 |
| E12 | 시험 12, 변형 14 |
| E13 | 1절 1 명령 |
