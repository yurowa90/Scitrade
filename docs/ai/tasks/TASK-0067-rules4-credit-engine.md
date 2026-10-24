# TASK-0067 경로 3 v2 엔진: rules-4(외상 기간·인수 한도·대손·지연 이자), 위험 술어화, `RISK_PROFILE_V2`

- 지위: **대체됨(H26-1, 2026-10-24).** 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0067-HUB-2026-10-24.md`에서 승인되지 않았고, `TASK-0067a-rules4-terms-skeleton.md`(조건과 골격)와 0067b(대손과 이자, 0067a 병합 뒤 작성)로 나눴다. 이 파일은 기록으로만 둔다. 실행하지 않는다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0062b가 병합됐다(rules-3 골든 `tests/golden/rules3-risk.tsv`, `tools/check_rules3_golden.mjs`).
  - **`BASE`는 작업 트리를 만든 커밋이다.** 이 지시서의 승인본과 0062b 병합을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- 기준 문서(이 지시서와 다르면 기준 문서를 따르고, 다르게 해야 할 이유가 생기면 멈추고 보고한다)
  - **설계 `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인, H25)** 3~7·10절
  - 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md`(승인) 5.2(시작값·고정 목록)
  - 허브 결정 H22~H25(`HUB-DECISIONS-2026-10-16.md`)
  - 0062b 결과 `docs/ai/tasks/results/TASK-0062b.md`(분기 도달표 ⑤, 진단 절차)
- 이번 범위가 아닌 것: 실행기·정책·판정 도구(TASK-0068), 화면(경로 11), 측정. **측정 시드(1001~1180)는 쓰지 않는다.** 시험은 2001 이상 시드만 쓴다.

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **rules-1·2·3은 바이트로 같다.** 작업 전과 끝에 아래가 모두 종료 0이어야 한다. 하나라도 0이 아니면 골든을 다시 쓰지 말고(`--write` 금지) 멈춰 보고한다.
   - `node tools/check_rules2_golden.mjs`(rules-1 400회, rules-2 105회)
   - `node tools/check_rules3_golden.mjs`(rules-3·위험 단계 108회). **로더 지문(`profileLoaded`)이 달라져 종료 1이 나는 것도 실패다.** `loadRiskProfile('RISK_PROFILE_DEFAULT')`의 출력은 키 하나도 늘지 않아야 한다(새 칸은 V2에만, DEFAULT에는 키 자체를 두지 않는다).
   - 규칙 1 시뮬레이터 400회 `cmp`(`run.mjs run` 출력이 BASE 출력과 같음)
   - 깨지면 0062b 결과 보고의 ‘TASK-0067 진단 절차’(`--dump` before/after diff)로 원인을 찾는다.
2. **기존 시험 파일은 고치지 않는다.** 특히 `src/engine/m2a5-risk-fx.test.ts`의 318행 시험 `묶음 계산은 상태 날짜의 양방향 환율과 정확히 같다`와 342행 USD 회복 필요액 단언은 바꾸지 않는다.
   - 이유: `operations.ts:266`(USD 미지급 때 원화→달러 필요액의 rules-3 분기)은 rules-3 골든 108회에서 도달이 0이다(0062b 범위 보고 ⑤). 이 분기를 술어로 바꿀 때 지키는 것은 이 단위 시험뿐이다.
   - 새 시험은 새 파일에 둔다(9절).
3. **저장 형식 6을 유지한다**(DESIGN-v2 6.4). 근거 2(rules-2·3 저장 바이트 그대로) 또는 근거 3(옛 빌드가 rules-4 저장을 `save.ts:106` 규칙 판본 검사에서 거절)이 시험에서 깨지면 멈추고 보고한다. 형식 번호를 올리지 않는다.
4. **원문 자료 `RISK_PROFILE_DEFAULT` 항목은 바꾸지 않는다.** `data/market_rules.json`에는 V2 항목을 더하기만 한다.
5. 미래 누설 금지(DESIGN-v2 3절 5). 대손 여부·확률은 플레이어 읽기 함수(미리보기·조건 선택지)에 나오지 않는다.
6. 커밋·푸시·브랜치 전환은 하지 않는다(공통 규칙).

## 2. 규칙 판본과 위험 술어

- `SUPPORTED_RULES_VERSIONS`(`types.ts:14`)에 `'M2a-rules-4'`를 더한다.
- 술어 `isRiskRules(v)`: `v === 'M2a-rules-3' || v === 'M2a-rules-4'`. 한 곳(`risk.ts` 권장)에 두고 내보낸다.
- 아래 **문자열 분기 9곳**을 술어로 바꾼다. 위치는 BASE 기준이며 0062b 도달표 ⑤와 같다.

  | 위치 | 지금 | 바꾼 뒤 |
  |---|---|---|
  | `risk.ts:36` `rowCurrency` | `=== 'M2a-rules-3'` | `isRiskRules(...)` |
  | `reports.ts:104` `preview` | 같음 | 같음 |
  | `engine.ts:309` `acceptTrade` 통화 검사 | `!== 'M2a-rules-3'` | `!isRiskRules(...)` |
  | `operations.ts:154`, `:183`, `:235`, `:266` | `=== 'M2a-rules-3'` | `isRiskRules(...)` |
  | `operations-invariants.ts:79`, `:87` | 같음 | 같음 |

- `risk.ts:169`(`withRiskLevel`의 판본 대입)은 **바꾸지 않는다**. rules-3 변환은 그대로다.
- `layers.includes(...)` 13곳(`risk.ts:25·59·84·111·123·133·146`, `reports.ts:139`, `engine.ts:995·1146`)은 층 검사이므로 바꾸지 않는다. rules-4도 같은 층 이름을 쓴다.
- 시험(9절): rules-4 R0′ 설정이 고정 시작 환율로 **원화 매입**한다(`rowCurrency(config, 'BUY') === 'KRW'`).

## 3. 위험 단계 변환 `withRiskLevelV2`

- 새 함수 `withRiskLevelV2(config, level: 'R0P' | 'R1' | 'R2' | 'R3' | 'R4', profile)`를 `risk.ts`에 둔다. 기존 `withRiskLevel`은 고치지 않는다.
- 하는 일은 `withRiskLevel`의 R1~R3 변환과 같다(구조 복제, 프로필에서 쓰지 않는 품목 행 걸러 내기, BUY 행·공급 오퍼를 시작 환율 원화로). 다른 점:
  - `rules.rulesVersion = 'M2a-rules-4'`
  - 층: `R0P` `[]`, `R1` `['FX']`, `R2` `+ 'TARIFF', 'SURCHARGE'`, `R3` `+ 'CLAIM', 'COLLECTION'`, `R4` `+ 'DEFAULT', 'CARRY'`
  - 프로필에 `credit`(4절)이 없으면 예외.
- `R0P`는 위험 층이 하나도 없지만 rules-4다. 그래서 원화 매입과 외상 조건 선택은 있고, 환율은 시작 환율로 고정된다(`referenceRate`가 `FX` 층이 없으면 시작 환율을 돌려준다, `risk.ts:25`).
- 층 이름 `'DEFAULT'`·`'CARRY'`를 위험 층 타입에 더한다.
- rules-4 설정은 화면·저장 시나리오 자료에서 만들어지지 않는다. 이 함수로만 만든다(rules-3와 같다).

## 4. 자료: `RISK_PROFILE_V2`와 검사

### 4.1 원문 자료(`data/market_rules.json`의 `risk_profiles`에 항목 하나 추가)

- `id: "RISK_PROFILE_V2"`. `data_basis`·`status`·`basis`는 DEFAULT와 같은 꼴로 적고 `status`는 `"V2_START_2026-10-24"`로 한다.
- `fx`·`tariff`·`surcharge`·`claims`·`collections.partial_bp`·`late_min_days`·`late_max_days`·`collections.grades`의 수금 확률은 **DEFAULT와 같은 값**이다(판본 1 최종 프로필, 판정표 v2 5.1).
- `collections.by_counterparty`: DEFAULT의 행을 모두 옮기되 (다)의 네 판매 거래처만 v2 등급으로 둔다(DESIGN-v2 5.3).

  | 거래처 | v2 등급 |
  |---|---|
  | `CUSTOMER_HAI_COSMETICS_NEW` | A |
  | `CUSTOMER_SHA_COSMETICS_NEW` | B |
  | `CUSTOMER_HAI_LAVER` | C |
  | `CUSTOMER_SHA_LAVER` | B |

- `collections.grades[]`의 각 행에 `p_default_bp`를 더한다: A 200, B 500, C 1200.
- 새 묶음 `credit`(V2에만):

  ```json
  "credit": {
    "recovery_bp": 3000,
    "carry_bp_per_day": 3,
    "terms": [
      { "id": "BASE", "days": 0,  "factor_pct": 100, "premium_bp": 0 },
      { "id": "D15",  "days": 15, "factor_pct": 150, "premium_bp": 300 },
      { "id": "D30",  "days": 30, "factor_pct": 200, "premium_bp": 600 }
    ],
    "limit_unit_minor": 400000,
    "limit_multiples": [ { "grade": "A", "lots": 3 }, { "grade": "B", "lots": 2 }, { "grade": "C", "lots": 1 } ]
  }
  ```

- `schemas/market_rules.schema.json`: 위험 프로필 항목에 선택 칸 `credit`과 `collections.grades[].p_default_bp`(선택)를 더한다. 둘은 함께 있거나 함께 없어야 한다(검사기 4.2에서 확인).

### 4.2 `tools/validate_data.py` 검사(V2 프로필에만, `credit`이 있을 때)

1. 모든 `collections.grades` 행에 `p_default_bp`(0~10000 정수)가 있다. `credit`이 없으면 어느 행에도 없다.
2. `terms`: ID `BASE`·`D15`·`D30` 정확히 셋, `BASE`는 `days 0`·`factor_pct 100`·`premium_bp 0`. 나머지는 `days > 0`, `factor_pct ≥ 100`, `premium_bp ≥ 0`.
3. 품목마다 등급 둘 이상: 위험 단계로 쓰는 rule_set마다(지금 검사의 `active_rules`와 같은 방식으로 `M2A5_PYEONGTAEK_COS_LAVER`를 포함) 각 품목의 판매 거래처 등급 집합 크기 ≥ 2. V2의 `by_counterparty`에 그 거래처가 없으면 오류.
4. **비대칭 제약**(DESIGN-v2 6.3, 정확한 유리수로 계산, Python `fractions.Fraction`): 비BASE 조건마다 ρ = recovery/10000, π = premium/10000, f = factor/100, p_g = p_default/10000일 때
   - `(1−ρ)·p_A·(f(1+π)−1) < π`, `(1−ρ)·p_B·(f(1+π)−1) < π`, `π < (1−ρ)·p_C·(f(1+π)−1)`
   - 시작값 확인: D15 `0.019075 < 0.03 < 0.04578`, D30 `0.0392 < 0.06 < 0.09408`.
5. **한도 단위**(DESIGN-v2 2.1·5.4, H24-2): `limit_unit_minor ≥ 손잡이 최대 1로트 판매액`. 계산은 DESIGN-v2 2.1 산식 그대로다.
   - (다) rule_set의 SELL 행마다: 판매 기준가(k=+3) = SELL₀ + BUY × 0.15(같은 품목 BUY 행), 지수 상한 `index.max_bp`, 지역 상한 `regional_pct[1]`, 거래처 상한 `counterparty_pct[1]`, 기본 로트 `base_lot`, 가산 최대 800bp.
   - 상수 `k = +3`, `가산 최대 800`은 판정표 v2 5.2의 손잡이 범위다. 검사기 주석에 그 출처를 적는다.
   - 지금 값으로 최댓값은 393,768센트(조미김·상하이)이고 L = 400,000이다.
6. `limit_multiples`: 등급 A·B·C 각 하나, `lots ≥ 1`, A ≥ B ≥ C.
7. `carry_bp_per_day` 0~100, `recovery_bp` 0~10000.
- `tools/test_validate_data.py`에 위 7가지의 거부 사례를 하나씩 더한다(기존 시험은 고치지 않고 더하기만).

### 4.3 엔진 로더

- `RiskProfile` 타입에 선택 칸 `credit?: CreditProfile`, `collections.grades[].pDefaultBp?: number`를 더한다.
- `loadRiskProfile`은 원문에 `credit`이 있을 때만 `credit` 키를, `p_default_bp`가 있을 때만 `pDefaultBp` 키를 만든다. **DEFAULT 출력에는 이 키들이 아예 없어야 한다**(값이 `undefined`인 키도 두지 않는다). 0062b의 `profileLoaded` 지문이 이것을 지킨다.

## 5. 외상 조건 선택(`ACCEPT_TRADE`)

- 명령 `ACCEPT_TRADE`에 선택 칸 `creditTermId?: 'BASE' | 'D15' | 'D30'`.
- 규칙 판본이 rules-4가 **아니면**: `creditTermId`가 있으면(값이 `'BASE'`여도) 거절한다. 사유 문장: `외상 조건은 이 규칙에서 쓸 수 없습니다`. 없으면 지금 동작 그대로다.
- rules-4이면 없을 때 `'BASE'`다. 고른 조건 t에 대해(오퍼 결제일 = 판매 오퍼의 `paymentDueDay`):
  - **날짜 규칙**: `t ≠ BASE`이면 `오퍼 결제일 + days_t + late_max_days ≤ campaignDays`. 어기면 거절, 사유 `외상 기간이 캠페인 안에 끝나지 않습니다`.
  - **인수 한도**: `t ≠ BASE`이면 `노출액(거래처) + 새 판매액(가산 포함) ≤ limit_unit_minor × lots(거래처 등급)`. 어기면 거절, 사유 `외상 한도 초과`.
  - **노출액**(DESIGN-v2 5.4): 같은 판매 거래처의 rules-4 계약 가운데 `creditTermId ≠ 'BASE'`, 계약 상태 `ACTIVE`·`IN_PROGRESS`, 청구서가 없거나 `OUTSTANDING`·`OVERDUE`인 계약의 `saleAmountMinor` 합.
  - 판매액: `saleAmountMinor = halfUp(오퍼 판매액 × (10000 + premium_bp_t), 10000)`. 오퍼 판매액은 지금 `acceptTrade`가 계산하는 값이다(수량 × 단가). 반올림은 `market.ts`의 `halfUp`과 같은 정수식이다.
  - 결제일: `paymentDueDay = 오퍼 결제일 + days_t`.
  - 계약에 `creditTermId: t`와 `creditEligible`을 적는다.
    - `creditEligible = { dateRule: boolean, limitBlocked: ('D15'|'D30')[] }`. 수락 시점 값이다.
    - `dateRule`: D15 또는 D30 가운데 날짜 규칙을 지키는 조건이 하나라도 있으면 참.
    - `limitBlocked`: 날짜상 가능한 조건 가운데 한도에 막히는 조건(고른 조건과 무관하게 계산).
  - rules-4의 BASE 계약에도 두 칸을 적는다. rules-1~3 계약에는 두 칸 모두 없다(키 자체가 없다).
- `quotePreview`(`readers.ts:33`)와 `planState` 미리보기 경로는 바꾸지 않는다(BASE로 미리 본다).
- **새 읽기 함수** `creditTermOptions(s, config, buyOfferId, sellOfferId, quantity?)`(`readers.ts`): rules-4에서만 의미가 있고, 아니면 빈 배열이다. 조건마다 `{ termId, allowed, reasonKo | null, saleAmountMinor, paymentDueDay, grade, limitMinor, exposureMinor }`. 대손 확률·계수는 넣지 않는다(미래 누설 금지). TASK-0068 정책과 경로 11 화면이 쓴다.

## 6. 대손·회수·지연 이자

### 6.1 대손 추첨(DESIGN-v2 5.1)

- `processCollections`(engine.ts:1141)에서, 직접 무역 청구서이고 `DEFAULT` 층이 켜져 있으면 `collectionPlan`보다 **먼저** 대손을 뽑는다.
  - `p = divHalfAway(pDefaultBp[등급] × factor_pct[조건], 100)`. 등급은 V2 `byCounterparty`의 거래처 등급, 조건은 계약의 `creditTermId`.
  - 대손 = `uniformInt(seed, 'COLLECT:' + sellOfferId + ':default', 0, 9999) < p`. 이 흐름은 `risk.ts`에 `defaultFor(config, seed, sellOfferId, customerId, termId)` 순수 함수로 둔다. 기존 흐름(`:mode`, `:days`)의 추첨값은 바뀌지 않는다.
  - 대손이 아니면 지금 `collectionPlan` 경로 그대로다.
  - 대손이면 그 청구서는 확정일 전까지 아무것도 받지 않는다. 상태는 결제일 뒤 `OVERDUE`다(지금 규칙과 같다).

### 6.2 확정과 회수(H24-3, 규칙 하나)

- 확정일 = `inv.dueDay + late_max_days`. `inv.dueDay`는 지금 `max(contract.paymentDueDay, 인도일)`이다(engine.ts:1125, 실효 결제일).
- **확정일 ≤ campaignDays일 때만** 그날 확정한다. 넘으면 확정하지 않는다. 그 청구서는 캠페인 끝까지 `OVERDUE`로 남고, 결산 매출채권에 들어간다.
- 확정일의 같은 날 순서(고정): ① 회수 → ② 이자 → ③ 대손 → ④ 상태
  1. 회수액 `R = applyBasisPoints(남은 금액, recovery_bp)`. 분개 `RECEIPT-RCPT-{inv}-R`: 차변 `CASH` R, 대변 `ACCOUNTS_RECEIVABLE` −R. `applyPartialReceipt`와 같은 꼴로 `receiptIds`에 `RCPT-{inv}-R`을 넣는다. R = 0이면 분개를 만들지 않는다.
  2. 이자 분개(6.3), `CARRY` 층이 켜져 있을 때.
  3. `BADDEBT-{inv}`: 차변 `BAD_DEBT` (남은 금액 − R), 대변 `ACCOUNTS_RECEIVABLE` −(남은 금액 − R). `CASH` 줄 없음. `contractId`를 단다.
  4. 청구서 `status = 'WRITTEN_OFF'`, 계약 `status = 'COMPLETED'`, `completedDay = s.day`.
  - 로그 한 줄(고정): `{계약} 대금 회수 불능 확정: {회수액} 회수, {손실} 대손 처리`(금액은 `formatMoney`).

### 6.3 지연 이자(DESIGN-v2 4절)

- `CARRY` 층이 켜진 rules-4에서, 직접 무역 청구서가 결제일을 넘겨 남아 있으면 비용이 쌓인다.
- 상태에 새 칸을 두지 않는다. 원장에서 다시 계산한다.
  - 쌓인 양 `A(t) = Σ_{d = dueDay+1 .. t} remaining_d × carry_bp_per_day`. `remaining_d`는 `inv.amountMinor − (d일까지(포함) 그 청구서 수금 분개의 CASH 합)`이다.
  - 분개할 금액 = `divHalfAway(A(t), 10000) − (그 청구서의 이미 적은 CARRY 합)`. 0이면 분개하지 않는다.
- 분개 시점: 그 청구서의 수금(정시 수금은 결제일이라 0, 지연·부분 수금의 각 수금일)과 대손 확정일. 수금 분개 **뒤**에 적는다(대손은 6.2 순서).
- 분개 `CARRY-{inv}-{n}`: 차변 `RECEIVABLE_CARRY`, 대변 `CASH`, `contractId`를 단다. n은 그 청구서의 CARRY 순번(1부터).
- 대손 확정 뒤에는 쌓지 않는다. `WRITTEN_OFF`와 `PAID` 청구서는 쌓지 않는다.
- 평가일에 남은 청구서의 아직 적지 않은 이자는 `contractRiskReport`가 남은 흐름(음수)으로 센다(분개 없음).

### 6.4 원장

- `Account`·`ACCOUNT_KIND`에 `RECEIVABLE_CARRY: 'expense'`, `BAD_DEBT: 'expense'`를 더한다.
- `summarize`의 `profit` 식(ledger.ts:210)에서 두 계정을 뺀다. `BookSummary`에 필수 칸을 더하지 않는다(rules-1~3 출력 모양이 바뀌면 골든이 깨진다).
- `contractReport`(reports.ts:24)의 `contribution`에서 계약에 귀속된 두 계정의 금액을 뺀다. **반환 객체에 새 키를 더하지 않는다**(0062a·0062b 탐침이 이 객체를 해시한다).

## 7. `WRITTEN_OFF`와 읽기 경로

- `InvoiceStatus`에 `'WRITTEN_OFF'`를 더한다(save-shape의 열거도).
- 아래 자리에서 `WRITTEN_OFF`를 `PAID`처럼 ‘끝난 청구서’로 다룬다(DESIGN-v2 5.2).
  - 수금·입금: `processCollections`(engine.ts:1141), `applyPartialReceipt`(:1170), `applyReceipt`(:1196)
  - `operations.ts:254`(다음 수금 예정), `operations.ts:265`(USD 부족분 계산의 미수 청구서)
  - `progress.ts:60`
  - `invariants.ts:95-99`의 ‘매출채권 = 미수 청구서 남은 금액 합’에서 뺀다.
  - `reports.ts` `upcomingPayments`·`receivableSchedule`에서 빼고, `contractRiskReport`는 7.1대로.
- 위 목록 밖에서도 `status !== 'PAID'`나 `=== 'PAID'`로 미수 여부를 가르는 자리가 있으면 같은 원칙으로 고치고 결과 보고에 모두 적는다(`grep -rn "'PAID'" src/engine`).

### 7.1 `contractRiskReport`

- rules-4에서만 `components`에 `default`(= −대손액, 확정일 환율 원화)와 `carry`(= −이자, 분개일 환율 원화)를 더한다. 항등식 단계는 `collection` 다음 `default`, 그다음 `carry`다.
- **rules-3에서는 `components`의 키와 순서가 지금과 같아야 한다**(키 추가 금지). 0062b가 이 객체를 해시한다.
- `WRITTEN_OFF` 청구서의 남은 흐름은 0이다.

## 8. 불변식과 저장

- 저장 모양(`save-shape.ts`)
  - 계약: `creditTermId: optional(oneOf('BASE','D15','D30'))`, `creditEligible: optional(obj({ dateRule: bool, limitBlocked: array(oneOf('D15','D30')) }))`
  - 청구서 상태 열거에 `WRITTEN_OFF`, 원장 계정 열거에 두 계정(열거는 `ACCOUNT_KIND`에서 온다).
  - rules-1~3 저장에는 두 칸이 없다. 직렬화가 `undefined` 키를 쓰지 않음을 시험한다.
- 불변식(`invariants.ts` 또는 `operations-invariants.ts`)
  - rules-1~3 계약에 `creditTermId`·`creditEligible`가 있으면 위반.
  - rules-4 직접 무역 계약에는 둘 다 있다. `paymentDueDay = 판매 오퍼 결제일 + days`, `saleAmountMinor = halfUp(오퍼 판매액 × (10000 + premium), 10000)`.
  - `WRITTEN_OFF` 청구서: `RECEIPT-RCPT-{inv}-R`(R > 0일 때) 하나와 `BADDEBT-{inv}` 하나. R + 대손액 = 확정 직전 남은 금액. 그 뒤 `RECEIPT-`·`CARRY-` 분개가 없다. 확정일(`dueDay + late_max_days`)이 `campaignDays`를 넘는 청구서는 `WRITTEN_OFF`일 수 없다.
  - `CARRY` 합 = `divHalfAway(A(마지막 분개일), 10000)`.
- 형식 번호는 6 그대로다. 1절 3의 멈춤 조건.

## 9. 시험(새 파일 `src/engine/m2a5-risk-credit-v2.test.ts`)

손 고정물 위주, 시드는 2001 이상만 쓴다.

1. 술어와 변환: `withRiskLevelV2`의 다섯 단계 층, rules-4 판본, R0P 원화 매입·고정 환율, `credit` 없는 프로필 예외. `withRiskLevel`(rules-3)의 출력이 BASE와 같음.
2. 로더: DEFAULT 출력에 `credit`·`pDefaultBp` 키가 없음. V2 출력의 값이 원문과 같음.
3. 조건 선택: rules-2·3에서 `creditTermId`(‘BASE’ 포함) 거절. rules-4 기본 BASE. 날짜 규칙 경계(정확히 90일은 허용, 91일은 거절). 한도 경계(정확히 한도는 허용, 1센트 넘으면 거절). 판매액·결제일·`creditEligible`(날짜 불가, 한도 막힘 섞인 경우).
4. 노출액: 취소된 비BASE 계약, 완료된 계약, `PAID`·`WRITTEN_OFF` 청구서, BASE 계약이 빠짐. 인도 전 계약이 들어감. 판매액 0으로 완료된 계약이 빠짐.
5. 대손 추첨: 같은 시드·견적에서 결정론적. `default` 흐름을 더해도 `:mode`·`:days` 추첨값이 같음. 확률식(`divHalfAway(base × factor, 100)`).
6. 확정: 확정일 ≤ 90이면 같은 날 회수 → 이자 → 대손 → 상태 순서의 분개 ID·금액. 확정일 > 90이면 확정되지 않고 끝에 `OVERDUE`·매출채권 잔액이 남음. BASE 계약에도 같은 규칙.
7. 지연 이자: 지연 수금·부분 수금·대손 각각에서 `CARRY-` 금액이 `divHalfAway(Σ, 10000)` 한 번 반올림과 같음. 결제일 정시 수금은 이자 0. `CARRY` 층이 없으면 0.
8. `WRITTEN_OFF` 경로: 7절 목록의 함수들이 그 청구서를 건너뜀. 매출채권 불변식 통과.
9. 원장·보고: `profit`에 두 계정 반영, `contractReport`의 키 집합이 BASE와 같음, rules-3 `contractRiskReport.components` 키 집합·순서가 BASE와 같음, rules-4에서만 `default`·`carry`.
10. 저장: rules-4 마지막 상태 왕복 바이트 같음(새 칸 포함). rules-3 저장 바이트가 BASE와 같음. rules-4 저장을 rules-3 설정으로 불러오면 판본 검사로 거절(`save.ts:106`).
11. 미래 누설: `creditTermOptions`와 `quotePreview` 결과에 대손 확률·계수·대손 여부가 없음.
12. **J1 점검**(DESIGN-v2 3절 6): (다)·`withRiskLevelV2(..., 'R4', V2)`·`MAX_CONTRIBUTION`·시드 2001~2010에서 경영 실패 0, 끝 원화 미지급 0. 하나라도 어기면 고치지 말고 실패한 시드와 실패 기록을 보고한다(엔진 결함인지 경제 값 문제인지 허브가 판단).

- `tools/test_validate_data.py`에 4.2의 거부 사례(더하기만).

## 10. 변형 시험(임시로 고치고 되돌림)

| 번호 | 변형 | 기대 |
|---|---|---|
| 1 | `isRiskRules`가 rules-3에 거짓을 냄 | rules-3 골든 종료 1, 새 시험 일부 실패 |
| 2 | `loadRiskProfile`이 DEFAULT에도 `credit: undefined`가 아닌 `credit: null`을 넣음 | rules-3 골든이 로더 지문으로 종료 1 |
| 3 | 대손 확정 순서를 대손 → 회수로 바꿈 | 새 시험 6 실패 |
| 4 | 이자를 날마다 반올림 | 새 시험 7 실패 |
| 5 | 노출액에서 `CANCELLED` 제외를 뺌 | 새 시험 4 실패 |
| 6 | `operations.ts:254`의 `WRITTEN_OFF` 건너뜀을 뺌 | 새 시험 8 실패 |
| 7 | 검증기 비대칭 제약의 C 쪽 부등호를 뒤집음 | `validate_data` 실패(지금 자료로) |
| 8 | 검증기 한도 단위 상수 k를 +3에서 +4로 | `validate_data` 실패(L < 최댓값) |

- 모두 되돌린 뒤 1절 1의 세 검사가 0이고 `git diff`에 변형 흔적이 없음을 보인다.

## 11. 완료 조건

1. 1절 1의 세 검사가 작업 전·후 모두 0이다(로더 지문 포함).
2. 1절 2: 기존 시험 파일 변경 없음(`git diff --stat <BASE> -- 'src/**/*.test.ts'`에 새 파일만).
3. 새 시험·변형 시험이 기대대로다. J1 점검 결과를 그대로 적는다.
4. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
5. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `검사 18종, 실패 0종 (모드: 확인)`이다(0062b 뒤 18종).
6. 결과 보고 `docs/ai/tasks/results/TASK-0067.md`.

## 12. 고칠 수 있는 파일

- `src/engine/types.ts`, `risk.ts`, `engine.ts`, `operations.ts`, `operations-invariants.ts`, `invariants.ts`, `reports.ts`, `readers.ts`, `ledger.ts`, `progress.ts`, `save-shape.ts`, `src/content/scenario.ts`(로더)
- 7절 grep으로 찾은 `PAID` 판정 자리가 있는 `src/engine/*.ts`(결과 보고에 목록)
- 새 파일 `src/engine/m2a5-risk-credit-v2.test.ts`
- `data/market_rules.json`(V2 항목 추가만), `schemas/market_rules.schema.json`
- `tools/validate_data.py`, `tools/test_validate_data.py`(더하기만)
- `MANIFEST.json`(생성만), `docs/ai/tasks/results/TASK-0067.md`
- 그 밖(특히 `src/ui/**`, `src/engine/sim/**`, 골든 파일·골든 도구, 기존 시험 파일)은 고치지 않는다. 필요하면 멈추고 보고한다.

## 13. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 1절 1의 세 검사 작업 전·후 출력(로더 지문 줄 포함)
- 술어로 바꾼 9곳과 바꾸지 않은 곳(이유)
- V2 원문 항목 전체, 검사기 4.2의 계산 출력(비대칭 제약 값, 한도 최댓값 393,768)
- 7절 grep 결과와 고친 자리 전체
- 새 시험 출력, 변형 표, J1 점검(시드별 결과)
- `review_checks` 줄
- 0068에 넘길 것: `creditTermOptions` 서명, `RiskContract`에 넣을 칸(`creditTermId`·`creditEligible`·등급·`saleAmountMinor`)의 출처, 진단 U가 쓸 계수(한도로 막힌 수, 확정되지 않은 대손 수)를 읽는 법
- 범위 밖에서 발견한 것, 질문

## 부록. 나누기 안(허브 결정용)

한 번에 돌리기 크다고 보면 아래처럼 둘로 나눈다. 나누면 이 파일을 두 지시서로 옮기고, 각 지시서의 완료 조건에 1절 1(골든 세 검사 0)을 그대로 둔다.

| 지시서 | 이 문서의 절 | 내용 | 완료 때 상태 |
|---|---|---|---|
| **0067a** 자료·조건 선택·저장 | 2, 3, 4, 5, 8(저장 모양과 조건 선택 불변식), 9의 1~4·10·11, 10의 1·2·5·7·8 | 술어 9곳, `withRiskLevelV2`(층 `DEFAULT`·`CARRY`는 이름만 두고 동작 없음), V2 자료·스키마·검증기·로더, `ACCEPT_TRADE.creditTermId`·노출액·한도·`creditEligible`, `creditTermOptions`, 계약 선택 칸 저장 | rules-4 R0P~R3 실행 가능. R4는 R3와 같은 동작 |
| **0067b** 수금·대손·이자·분개 | 6, 7, 8(분개·`WRITTEN_OFF` 불변식), 9의 5~9·12, 10의 3·4·6 | 대손 추첨·확정 규칙·회수·`BADDEBT`·`CARRY`, 원장 두 계정, `WRITTEN_OFF` 전 경로, `contractRiskReport`의 `default`·`carry`, J1 점검 | R4 완성 |

- 권고: **나눈다.**
  - 0067a는 저장·자료 쪽이라 형식 6 멈춤 조건(1절 3)을 먼저 확인할 수 있다. 여기서 멈추면 0067b의 일이 헛되지 않는다.
  - 0067b는 같은 날 분개 순서·반올림·`WRITTEN_OFF` 경로처럼 검수할 것이 많아, 따로 보는 편이 검수 품질이 높다.
  - 골든 세 검사를 지시서마다 돌리므로 회귀 원인이 어느 쪽인지 바로 갈린다.
- 비용: Codex 실행이 두 번, 허브 검수가 두 번이다. 0067b는 0067a 병합 커밋을 BASE로 쓴다.
