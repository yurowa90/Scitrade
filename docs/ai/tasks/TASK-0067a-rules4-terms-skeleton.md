# TASK-0067a 경로 3 v2 엔진 ①: rules-4 판본·위험 술어·`RISK_PROFILE_V2` 자료·외상 조건 선택(대손·이자 없음)

- 지위: **개정 1(세션 A, 2026-10-24). 허브 사전 확인 전이다.** 초안(`f49ba35`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0067a-HUB-2026-10-24.md`(확인 12, 기각 0)에서 편집 E1~E13을 받았다. 처리는 끝의 ‘개정 1 처리표’에 있다.
  - TASK-0067 초안(`7539e7e`·`f28b15c`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0067-HUB-2026-10-24.md`(확인 23, 중대 5)에서 승인되지 않았다. 허브 결정 H26(개발 브랜치 `576b0d4`)에 따라 0067a(이 지시서)와 0067b(대손·이자, 0067a 병합 뒤)로 나눈다. 이음매는 `processCollections`다.
  - 반영한 검수 항목: D1·D2·D5(a~c)·D6·D12·D13·D14·D16(날짜·한도 경계)·D17·D18·D19·D20·D22, H26-3 (a)(b)(c). 끝의 처리표에 있다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0062b가 병합됐다(개발 브랜치 `644e6a3`, rules-3 골든).
  - **`BASE`는 작업 트리를 만든 커밋이다.** 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고의 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- **기준 문서와 우선 규칙**(H26-2, D5)
  - 기준: `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인, H25) 3·5.3·5.4·6·10절, 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md` 5.2, 허브 결정 H22~H26.
  - **이 지시서가 정한 함수 경계와 자료 이름은 이 지시서를 따른다. 그 밖은 기준 문서를 따른다.** 기준 문서와 다르게 해야 할 다른 이유가 생기면 멈추고 보고한다.
  - 허브가 승인한 설계 이탈:

    | 설계 | 이 지시서 | 근거 |
    |---|---|---|
    | `withRiskLevel`을 넓힌다(DESIGN-v2 3절 3) | 새 함수 `withRiskLevelV2`를 둔다. `withRiskLevel`은 고치지 않는다 | rules-3 골든 보호(H26-2) |
    | 위험 프로필 로더 하나 | `loadRiskProfile`은 그대로, 새 `loadCreditProfile` | 기존 시험 `m2a5-risk-fx.test.ts:131-149`과 `profileLoaded` 지문 보호(H26-2, D2) |
    | 0067 한 지시서(DESIGN-v2 10절) | 0067a·0067b | H26-1 |

- 범위 밖: 대손·회수·지연 이자·`WRITTEN_OFF`·원장 계정·`contractRiskReport` 성분·J1(모두 0067b), 실행기·정책·판정 도구(0068), 화면(경로 11), 측정.
- **시드**: 새 시험과 일회 확인은 2001 이상 시드만 쓴다. 예외는 1절 1의 비위험 회귀 확인(`run.mjs run`, 기본 시드 1001~1020)뿐이다. 이것은 측정이 아니라 바이트 비교다(D20).

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **rules-1·2·3은 바이트로 같다.** 작업 **전**과 **끝**에 아래 셋이 모두 같아야 한다. 하나라도 어긋나면 골든을 다시 쓰지 말고(`--write` 금지) 멈춰 보고한다.
   - `node tools/check_rules2_golden.mjs` → 종료 0
   - `node tools/check_rules3_golden.mjs` → 종료 0. **로더 지문(`profileLoaded`) 경고로 종료 1이 나는 것도 실패다.**
   - 비위험 회귀(D20): 작업 전 `node src/engine/sim/run.mjs run --out /tmp/TASK-0067a-run-before.json`, 끝에 같은 명령으로 `/tmp/TASK-0067a-run-after.json`을 만들고 `cmp`가 같다.
   - 깨지면 0062b 결과 보고의 ‘TASK-0067 진단 절차’(`--dump` before/after diff)로 원인을 찾아 보고한다.
2. **기존 시험 파일은 고치지 않는다.**
   - 특히 `src/engine/m2a5-risk-fx.test.ts`의 318행 시험 `묶음 계산은 상태 날짜의 양방향 환율과 정확히 같다`와 342행 USD 회복 필요액 단언, 131-149행 프로필 비교 시험.
   - 이유: `operations.ts:266`(USD 미지급 때 원화→달러 필요액의 rules-3 분기)은 rules-3 골든 108회에서 도달이 0이다(0062b 범위 보고 ⑤). 이 분기를 술어로 바꿀 때 지키는 것은 이 단위 시험뿐이다.
   - `src/engine/sim/risk-runner.test.ts`도 고치지 않은 채 통과해야 한다(D1).
3. **저장 형식 6을 유지한다**(DESIGN-v2 6.4). 근거 2(rules-1~3 저장 바이트 그대로)나 근거 3(옛 빌드가 rules-4 저장을 거절)이 깨지면 멈추고 보고한다. 형식 번호를 올리지 않는다.
4. **원문 `RISK_PROFILE_DEFAULT` 항목은 바꾸지 않는다.** V2는 `risk_profiles` 배열 **끝**에 붙인다(여러 시험·도구가 `riskProfiles()[0]`을 DEFAULT로 쓴다).
5. **`loadRiskProfile`의 출력 모양은 바꾸지 않는다**(DEFAULT·V2 모두). 새 칸은 `loadCreditProfile`만 읽는다.
6. 미래 누설 금지(DESIGN-v2 3절 5): 대손 확률·조건 계수는 플레이어 읽기 함수에 나오지 않는다.
7. 커밋·푸시·브랜치 전환은 하지 않는다(공통 규칙).

## 2. 규칙 판본과 위험 술어

- `SUPPORTED_RULES_VERSIONS`(`types.ts:14`)에 `'M2a-rules-4'`를 더한다.
- 술어 `isRiskRules(v)`(`v === 'M2a-rules-3' || v === 'M2a-rules-4'`)를 `risk.ts`에 두고 내보낸다.
- 아래 **문자열 분기 9곳**을 술어로 바꾼다(BASE 줄 번호, 0062b 도달표 ⑤와 같다).

  | 위치 | 지금 | 바꾼 뒤 |
  |---|---|---|
  | `risk.ts:36` `rowCurrency` | `=== 'M2a-rules-3'` | `isRiskRules(...)` |
  | `reports.ts:104` `preview` | 같음 | 같음 |
  | `engine.ts:309` `acceptTrade` 통화 검사 | `!== 'M2a-rules-3'` | `!isRiskRules(...)` |
  | `operations.ts:154`, `:183`, `:235`, `:266` | `=== 'M2a-rules-3'` | `isRiskRules(...)` |
  | `operations-invariants.ts:79`, `:87` | 같음 | 같음 |

- 바꾸지 않는 것: `risk.ts:169`(`withRiskLevel`의 rules-3 대입), `layers.includes(...)` **10곳**(`risk.ts:25·59·84·111·123·133·146`, `reports.ts:139`, `engine.ts:995·1146`). 결과 보고에 `grep -n "M2a-rules-3\|layers.includes" src/engine/*.ts` 출력 전후를 붙인다(D14).

## 3. 위험 단계 변환 `withRiskLevelV2`

- 새 함수 `withRiskLevelV2(config, level: 'R0P' | 'R1' | 'R2' | 'R3', profile: RiskProfile, credit: CreditProfile)`를 `risk.ts`에 둔다. `withRiskLevel`(rules-3)은 고치지 않는다.
- `profile.id !== credit.profileId`이면 예외를 낸다(E11).
- 하는 일은 `withRiskLevel`의 R1~R3 변환과 같다(구조 복제, 쓰지 않는 품목 행 걸러 내기, BUY 행·공급 오퍼를 시작 환율 원화로). 다른 점:
  - `rules.rulesVersion = 'M2a-rules-4'`
  - 층: `R0P` `[]`, `R1` `['FX']`, `R2` `['FX', 'TARIFF', 'SURCHARGE']`, `R3` `['FX', 'TARIFF', 'SURCHARGE', 'CLAIM', 'COLLECTION']`
  - `config.operations.risk`에 `credit`(4.3의 `CreditProfile`)을 함께 둔다. 키 이름은 `credit`이다.
- 위험 층 타입에 `'DEFAULT'`·`'CARRY'`를 더한다(이름만. 이 층을 켜는 단계 `R4`와 동작은 0067b가 더한다).
- `R0P`는 위험 층이 없지만 rules-4다. 그래서 원화 매입과 외상 조건 선택이 있고, 환율은 시작 환율로 고정된다(`risk.ts:25`).
- rules-4 설정은 이 함수로만 만든다. 화면·저장 시나리오 자료에서 만들어지지 않는다.

## 4. 자료: `RISK_PROFILE_V2`

### 4.1 원문(`data/market_rules.json`, `risk_profiles` 배열 끝에 항목 하나)

자료 경로는 판정표 v2 5.2와 DESIGN-v2 5.4를 따른다(D5a·D5c).

- `id: "RISK_PROFILE_V2"`. `data_basis`·`basis`는 DEFAULT와 같은 꼴, `status: "V2_START_2026-10-24"`.
- `fx`·`tariff`·`surcharge`·`claims`와 `collections`의 기존 칸(`partial_bp`, `late_min_days`, `late_max_days`, `grades[]`의 세 수금 확률, `basis`)은 **DEFAULT와 같은 값**이다.
- `collections.by_counterparty`: DEFAULT의 행을 모두 옮기되 아래 넷만 v2 등급으로 둔다(DESIGN-v2 5.3).

  | 거래처 | DEFAULT | V2 |
  |---|---|---|
  | `CUSTOMER_HAI_COSMETICS_NEW` | B | **A** |
  | `CUSTOMER_SHA_COSMETICS_NEW` | B | B |
  | `CUSTOMER_HAI_LAVER` | C | C |
  | `CUSTOMER_SHA_LAVER` | C | **B** |

  - 주의(H26-3 (c)): (나) `M2A5_PYEONGTAEK_COS`도 같은 화장품 거래처 ID를 쓴다. 그래서 V2를 (나)에 걸면 하이퐁 화장품이 A가 된다. V2는 `withRiskLevelV2`로만 쓰이고 판정 변형은 (다)뿐이라 동작에는 영향이 없다. 결과 보고에 시나리오별 등급 표를 낸다(9절 시험 1).
- 새 칸
  - `collections.grades[].p_default_bp`: A 200, B 500, C 1200
  - `collections.carry_bp_per_day`: 3
  - `collections.recovery_bp`: 3000
  - `credit_terms`:

    ```json
    [
      { "id": "BASE", "days": 0,  "factor_pct": 100, "premium_bp": 0 },
      { "id": "D15",  "days": 15, "factor_pct": 150, "premium_bp": 300 },
      { "id": "D30",  "days": 30, "factor_pct": 200, "premium_bp": 600 }
    ]
    ```

  - `credit_limit_unit_minor`: 400000
  - `credit_limits`: `[{ "grade": "A", "lots": 3, "limit_minor": 1200000 }, { "grade": "B", "lots": 2, "limit_minor": 800000 }, { "grade": "C", "lots": 1, "limit_minor": 400000 }]`
- 대손·이자·회수 칸은 0067a에서는 읽기만 하고(`loadCreditProfile`), 동작은 0067b가 붙인다.
- `schemas/market_rules.schema.json`: 위험 프로필에 선택 칸 `credit_terms`·`credit_limit_unit_minor`·`credit_limits`, `collections`에 선택 칸 `carry_bp_per_day`·`recovery_bp`, `collections.grades[]`에 선택 칸 `p_default_bp`를 더한다.

### 4.2 `tools/validate_data.py` 검사(이 칸들이 있는 프로필에만)

1. **함께 있음**(E8): `credit_terms`·`credit_limit_unit_minor`·`credit_limits`·`collections.carry_bp_per_day`·`collections.recovery_bp` 다섯은 모두 있거나 모두 없다. 모두 있으면 `collections.grades`의 모든 행에 `p_default_bp`(0~10000 정수)가 있고, 없으면 어느 행에도 없다.
2. `credit_terms`: ID `BASE`·`D15`·`D30` 정확히 셋. `BASE`는 `days 0`·`factor_pct 100`·`premium_bp 0`. 나머지는 `days > 0`, `factor_pct ≥ 100`, `0 ≤ premium_bp ≤ 10000`.
3. **품목마다 등급 둘 이상**: `active_rules`(지금 검사의 방식) 가운데 이 프로필의 등급이 걸리는 rule_set마다, 각 품목의 판매 거래처 등급 집합 크기 ≥ 2. 거래처가 `by_counterparty`에 없으면 오류.
   - 지금 자료로 (가)는 의류 A·B·화장품 C·B, (나)는 화장품 A·B, (다)는 화장품 A·B·조미김 B·C다(V2 기준).
4. **비대칭 제약**(DESIGN-v2 6.3, `fractions.Fraction`으로 정확히): 비BASE 조건마다 ρ = recovery/10000, π = premium/10000, f = factor/100, p_g = p_default/10000일 때
   - `(1−ρ)·p_A·(f(1+π)−1) < π`, `(1−ρ)·p_B·(f(1+π)−1) < π`, `π < (1−ρ)·p_C·(f(1+π)−1)`
   - 시작값 확인: D15 `0.019075 < 0.03 < 0.04578`, D30 `0.0392 < 0.06 < 0.09408`.
5. **한도 단위**(DESIGN-v2 2.1·5.4, H24-2): `credit_limit_unit_minor ≥ 손잡이 최대 1로트 판매액`. 계산은 DESIGN-v2 2.1 산식 그대로다.
   - 대상: `active_rules`의 모든 rule_set의 SELL 행(H26-3 (c)의 넓힌 쪽).
   - 판매 기준가(k = +3) = SELL₀ + 같은 품목 BUY × 0.15, 지수 상한 `index.max_bp`, 지역 상한 `regional_pct[1]`, 거래처 상한 `counterparty_pct[1]`, `base_lot`, 가산 최대 800bp. 단계마다 반올림(`market.ts`의 `halfUp`과 같은 정수식).
   - 상수 `k = +3`과 `가산 최대 800`은 판정표 v2 5.2의 손잡이 범위다. 검사기 주석에 출처를 적는다.
   - 지금 자료로 최댓값은 393,768센트(`M2A5_PYEONGTAEK_COS_LAVER` 조미김·상하이)이고, 다음은 392,472센트(세 rule_set의 화장품·상하이)다(세션 A 계산). 결과 보고에 rule_set·행별 값을 붙인다.
6. `credit_limits`: 등급 A·B·C 각 한 행, `lots ≥ 1`, A ≥ B ≥ C, **`limit_minor = credit_limit_unit_minor × lots`**.
7. `carry_bp_per_day` 0~100, `recovery_bp` 0~10000.

- `tools/test_validate_data.py`에 위 1~7의 거부 사례를 하나씩 더한다(더하기만). 6은 `limit_minor`를 1 바꾼 사례를 포함한다.

### 4.3 엔진 로더

- `loadRiskProfile`(`scenario.ts:542`)은 **고치지 않는다.** V2에 대해서도 지금 모양만 낸다(새 칸을 무시). 그래서 `m2a5-risk-fx.test.ts:131-149`와 0062b `profileLoaded` 지문이 그대로다.
- 새 `loadCreditProfile(id): CreditProfile`(`scenario.ts`). 원문에 4.1의 새 칸이 없으면 예외.

  ```ts
  interface CreditProfile {
    profileId: string;
    terms: { id: 'BASE' | 'D15' | 'D30'; days: number; factorPct: number; premiumBp: number }[];
    limitUnitMinor: number;
    limits: { grade: string; lots: number; limitMinor: number }[];
    pDefaultBpByGrade: { grade: string; pDefaultBp: number }[];
    carryBpPerDay: number;
    recoveryBp: number;
  }
  ```

- `creditTermCheck`의 등급은 `config.operations.risk.profile.collections.byCounterparty`에서 읽는다. 엔진은 `src/content`를 부르지 않는다(E11). 한도는 그 등급의 `credit.limits[].limitMinor`를 쓴다.
- `riskProfiles()`는 고치지 않는다(V2도 돌려준다).

### 4.4 `src/engine/sim/d03.ts` 최소 수정(D1)

- `requestedRisk`(d03.ts:49-50)의 `profiles.length !== 1` 검사를 `RISK_PROFILE_DEFAULT`를 ID로 고르는 것으로 바꾼다. 없으면 같은 문장의 예외를 낸다.
- `meta.profileId`는 그대로 `'RISK_PROFILE_DEFAULT'`다. d03.ts:67(`riskProfiles()[0]`)은 V2가 배열 끝이라 그대로 DEFAULT를 고른다. 이 줄은 고치지 않는다.
- 이 파일에서 다른 줄은 바꾸지 않는다. 전체 프로필 ID 선택은 0068 몫이다.
- d03 출력이 같아야 한다(E1·E2)
  - 명령(작업 전·후): `node src/engine/sim/run.mjs d03 --risk R1 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0067a-d03-{before,after}.json`. `--seed-from`·`--seed-to`는 번호다. 시드 기준값 없이 기본 시드(1001~)로 돌리지 않는다.
  - 비교: 전·후 파일에서 `meta.risk.marketRulesSha256`를 지운 뒤 비교한다(예: `jq -S 'del(.meta.risk.marketRulesSha256)'` 결과를 `cmp`). 이 키는 `data/market_rules.json`의 sha256이라(run.mjs:12·19, d03.ts:52) V2를 붙이면 늘 다르다. 같지 않으면 멈춘다.
  - 이 키의 값은 따로 적는다. 전 값은 BASE 자료의 sha256, 후 값은 V2를 더한 `data/market_rules.json`의 sha256과 같아야 한다.

## 5. 외상 조건 선택

### 5.1 판정 함수 하나(H26-3 (b))

- 순수 함수 `creditTermCheck(s, config, buyOfferId, sellOfferId, quantity, termId)`를 `engine.ts` 또는 새 모듈에 둔다. `acceptTrade`와 `creditTermOptions`가 **이 함수만** 쓴다.
- 호출 순서(E12): `acceptTrade`는 오퍼 확인(`offerDef`·`offerOpen`) 바로 뒤, 수량·자금 검사보다 먼저 `creditTermCheck`를 부르고, 거절이면 그 `reasonKo`를 그대로 돌려준다.
- 돌려주는 값: `{ allowed: boolean; reasonKo: string | null; saleAmountMinor: number; paymentDueDay: number; grade: string; limitMinor: number; exposureMinor: number; dateRule: boolean; limitBlocked: ('D15' | 'D30')[] }`

### 5.2 규칙

- **오퍼 결제일**(D6): 지금 `acceptTrade`의 식 그대로다. `config.terms.paymentDueDay ?? sell.paymentDueDay ?? config.campaignDays`(engine.ts:360-362). 날짜 규칙·불변식·`creditTermCheck`가 모두 이 값을 쓴다.
- 오퍼 판매액: 지금 식 `sell.unitPriceMinor * quantity`(engine.ts:355).
- 규칙 판본이 rules-4가 **아니면**: `creditTermId`가 있으면(값이 `'BASE'`여도) 거절한다. 사유 `외상 조건은 이 규칙에서 쓸 수 없습니다`. rules-1(`M1-rules-1`·`M2a-rules-1`)도 같다(D12). 없으면 지금 동작 그대로다.
- rules-4에서 없으면 `'BASE'`다. 조건 t에 대해
  - 판매액 `halfUp(오퍼 판매액 × (10000 + premium_bp_t), 10000)`(`market.ts`의 `halfUp`과 같은 정수식, BASE는 그대로)
  - 결제일 `오퍼 결제일 + days_t`
  - **날짜 규칙**(t ≠ BASE): `오퍼 결제일 + days_t + late_max_days ≤ campaignDays`. 어기면 거절, 사유 `외상 기간이 캠페인 안에 끝나지 않습니다`.
  - **인수 한도**(t ≠ BASE): `노출액 + 판매액_t ≤ limitMinor(거래처 등급)`. 어기면 거절, 사유 `외상 한도 초과`.
  - **노출액**: 같은 판매 거래처(`customerId`)의 rules-4 직접 무역 계약 가운데 `creditTermId !== 'BASE'`이고, 계약 상태가 `ACTIVE`·`IN_PROGRESS`이며, 청구서가 없거나 상태가 `OUTSTANDING`·`OVERDUE`인 계약의 `saleAmountMinor` 합. (0067b가 `WRITTEN_OFF`를 더해도 이 정의로 빠진다.)
  - `dateRule`: D15·D30 가운데 날짜 규칙을 지키는 것이 하나라도 있으면 참. `limitBlocked`: 날짜상 가능한 조건 가운데 한도에 막히는 조건(고른 조건과 무관).
- 수락된 rules-4 직접 무역 계약에 `creditTermId`(BASE 포함)와 `creditEligible: { dateRule, limitBlocked }`를 적는다. `saleAmountMinor`·`paymentDueDay`는 조건 반영 값이다.
- rules-1~3 계약에는 두 칸이 **키 자체로 없다**(`Object.hasOwn`으로 시험, D19).
- 명령: `ACCEPT_TRADE`에 선택 칸 `creditTermId?: 'BASE' | 'D15' | 'D30'`.
- `quotePreview`·`planState` 미리보기 경로는 바꾸지 않는다(BASE로 미리 본다).

### 5.3 읽기 함수 `creditTermOptions`

- `creditTermOptions(s, config, buyOfferId, sellOfferId, quantity?)`(`readers.ts`). rules-4가 아니면 `[]`. rules-4이면 BASE·D15·D30 순서로 `creditTermCheck` 결과에서 `{ termId, allowed, reasonKo, saleAmountMinor, paymentDueDay, grade, limitMinor, exposureMinor }`만 낸다. 대손 확률·계수는 넣지 않는다.
- 0068 정책(`TERM_GREEDY`·`CREDIT_AWARE`)과 경로 11 화면이 이 함수를 쓴다.

## 6. 불변식과 저장

- 저장 모양(`save-shape.ts`, 계약): `creditTermId: optional(oneOf('BASE','D15','D30'))`, `creditEligible: optional(obj({ dateRule: bool, limitBlocked: array(oneOf('D15','D30')) }))`.
- 불변식
  - rules-1~3 계약에 `creditTermId`·`creditEligible` 키가 있으면 위반.
  - rules-4 직접 무역 계약에는 둘 다 있고, `paymentDueDay = 오퍼 결제일 + days`, `saleAmountMinor = halfUp(오퍼 판매액 × (10000 + premium), 10000)`이다. 오퍼 결제일은 5.2의 식이다.
- 형식 번호는 6이다. 1절 3의 멈춤 조건.

## 7. 시험(새 파일 `src/engine/m2a5-risk-credit-v2.test.ts`)

- 손 고정물 위주, 시드 2001 이상.
- ‘BASE와 같음’은 vitest 안에서 BASE를 구할 수 없으므로, 필요하면 BASE에서 잰 **리터럴**을 박고, 그 밖은 1절 1의 골든 일치로 갈음한다(D18).

1. **변환·술어**
   - `withRiskLevelV2` 네 단계의 층·판본, R0P 원화 매입(`rowCurrency(config, 'BUY') === 'KRW'`)·고정 환율, `credit`이 설정에 들어감.
   - **동치 시험(D13, E11)**: ‘V2 profile + V2 credit의 rules-4 R3’ 설정과 ‘DEFAULT의 rules-3 R3’ 설정을 비교한다. 비교 대상은 등급과 무관한 단위 고정물로 한정한다: `reports.ts:104`의 미리보기, `operations.ts:154`·`:183`의 환전 사유·금액, `:235`, `:266`의 필요액. 같은 상태·같은 입력에서 두 결과가 같다.
   - 시나리오별 V2 등급 표: (가)(나)(다)의 판매 거래처 등급. (나)에서 하이퐁 화장품이 A임을 단언(H26-3 (c)).
2. **로더**: `loadRiskProfile('RISK_PROFILE_DEFAULT')`와 `loadRiskProfile('RISK_PROFILE_V2')`의 키 집합이 같다. `Object.hasOwn(profile, 'credit') === false`, `grades[]`에 `pDefaultBp` 키 없음(D19). `loadCreditProfile('RISK_PROFILE_V2')` 값이 원문과 같고, DEFAULT에는 예외.
3. **조건 선택**
   - rules-1(`M2a-rules-1`, 가능하면 `M1-rules-1`)·rules-2·rules-3에서 `creditTermId` `BASE`·`D15` 모두 거절(D12).
   - rules-4 기본 BASE. 판매액·결제일·`creditEligible`(날짜 불가, 한도 막힘이 섞인 경우).
   - 날짜 경계: `오퍼 결제일 + days + 15`가 정확히 90이면 허용, 91이면 거절.
   - 한도 경계: 노출액 + 판매액이 정확히 한도면 허용, 1센트 넘으면 거절.
4. **노출액**: 취소된 비BASE 계약, 완료된 계약, `PAID` 청구서, BASE 계약이 빠짐. 인도 전 계약이 들어감. 판매액 0으로 완료된 계약이 빠짐. 손으로 만든 고정물(계약은 `IN_PROGRESS`, 청구서는 `PAID`)에서도 빠짐(E13). (`WRITTEN_OFF` 단언은 0067b.)
5. **일치 시험(H26-3 (b))**: 여러 상태에서 `creditTermOptions`의 `allowed`가 거짓이면 같은 조건의 `ACCEPT_TRADE`도 거절되고 사유 문장이 같다. 참이면 수락된 계약의 `saleAmountMinor`·`paymentDueDay`가 읽기 값과 같다.
6. **저장**: rules-4 마지막 상태(새 칸 포함) 저장 왕복 바이트 같음. rules-1~3 계약에 키 없음. 새 빌드에서 rules-4 저장을 rules-3 설정으로 불러오면 **`save.ts:107`의 조건**에서 거절된다(D22, E9).
   - 두 거절은 같은 107행 조건에서 나며, 조건과 문장으로 가른다. 옛 빌드는 `known`이 거짓이라 거절된다. 새 빌드는 `known`이 참이고 기대 판본이 달라 거절되며, 문장에 ‘이 시나리오의 규칙은 M2a-rules-3이며’가 들어간다. 새 빌드 시험은 이 문장을 단언한다.
   - 근거 3(옛 빌드 거절)은 vitest로 증명하지 않는다. 별도로 BASE 워크트리(`git worktree add <밖> <BASE>`)의 `deserializeSave`가 rules-4 저장을 `known`이 거짓인 경로로 거절함을 일회 실행으로 확인해 결과 보고에 문장과 함께 적는다.
7. **미래 누설(차분, D17)**: `p_default_bp`와 `factor_pct`만 다른 두 V2 사본으로 같은 상태를 만들면 `creditTermOptions`와 `quotePreview` 결과가 `toEqual`로 같다.
8. **불변식(E6)**: 아래 상태마다 위반 문장이 나옴을 단언한다.
   - rules-3 계약에 `creditTermId`를 넣은 상태
   - rules-4 계약의 `paymentDueDay`를 +1 한 상태
   - rules-4 계약의 `saleAmountMinor`를 +1 한 상태
   - 그리고 rules-4 R0P·R1에서 환전(`EXCHANGE_CURRENCY`)을 한 뒤 불변식이 깨끗함(`operations-invariants.ts:87`).

## 8. 변형 시험(임시로 고치고 되돌림)

| 번호 | 변형 | 기대 |
|---|---|---|
| 1 | `isRiskRules`가 rules-3에 거짓을 냄 | rules-3 골든 종료 1, 새 시험 일부 실패 |
| 2 | 술어 9곳 가운데 `reports.ts:104`를 문자열 `=== 'M2a-rules-3'`로 되돌림 | 새 시험 1(동치) 실패, rules-3 골든 종료 0(D13) |
| 3 | `loadRiskProfile`이 V2에 `credit: null`을 넣음 | 새 시험 2 실패, `m2a5-risk-fx.test.ts:131-149` 실패 |
| 4 | `loadRiskProfile`이 V2에 `credit: undefined`를 넣음(D19의 2b) | 새 시험 2 실패(`Object.hasOwn`) |
| 5 | 노출액에서 `CANCELLED` 제외(상태 조건 전체)를 지움 | 새 시험 4 실패 |
| 6 | 날짜 규칙의 `≤`를 `<`로 | 새 시험 3 실패(D16) |
| 7 | 한도의 `≤`를 `<`로 | 새 시험 3 실패(D16) |
| 8 | `creditTermOptions`가 `pDefaultBp`를 결과에 넣음 | 새 시험 7 실패(D17) |
| 9 | 검증기 비대칭 제약의 C 쪽 부등호를 뒤집음 | `validate_data`에 비대칭 제약 문장의 FAIL 줄이 나오고, `hash mismatch` 말고 다른 FAIL은 없다(E5, 검증기 파일을 고치면 MANIFEST 해시가 어긋난다) |
| 10 | 검증기 한도 단위 상수 k를 +3에서 +4로 | 한도 단위 문장의 FAIL 줄, `hash mismatch` 말고 다른 FAIL 없음(E5) |
| 11 | 자료의 `credit_limits` B `limit_minor`를 800001로 | `limit_minor` 일치 문장의 FAIL 줄, `hash mismatch` 말고 다른 FAIL 없음(E5) |
| 12 | d03.ts의 DEFAULT 선택을 `riskProfiles().at(-1)`로 | `risk-runner.test.ts` 실패(552행 `profileId`)(E4) |
| 13 | 6절 새 불변식 검사를 지움 | 새 시험 8 실패(E7) |
| 14 | 노출액의 청구서 상태 조건을 지움 | 새 시험 4(`IN_PROGRESS` + `PAID` 고정물) 실패(E13) |

- 모두 되돌린 뒤 1절 1의 세 검사가 같고, `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 9. 완료 조건

1. 1절 1의 세 검사가 작업 전·후 모두 같다(로더 지문 포함). d03 출력이 4.4(E1) 정의로 같고, `marketRulesSha256` 값은 4.4대로다(E3).
2. 기존 시험 파일 변경 없음(E10)
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력이다.
   - `git diff --numstat <BASE> -- tools/test_validate_data.py`의 삭제 수가 0이다.
   - `git status --porcelain --untracked-files=all`의 `??` 줄은 새 시험 파일과 결과 보고뿐이다.
3. 새 시험과 변형 14개가 기대대로다. 근거 3 일회 확인 결과를 적는다.
4. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
5. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `검사 18종, 실패 0종 (모드: 확인)`이다.
6. 결과 보고 `docs/ai/tasks/results/TASK-0067a.md`.

## 10. 고칠 수 있는 파일

- `src/engine/types.ts`, `risk.ts`, `engine.ts`, `operations.ts`, `operations-invariants.ts`, `invariants.ts`, `reports.ts`(104행 술어만), `readers.ts`, `save-shape.ts`, `src/content/scenario.ts`(`loadCreditProfile`만 더함)
- `src/engine/sim/d03.ts`(49-50행의 프로필 선택만)
- 새 파일 `src/engine/m2a5-risk-credit-v2.test.ts`
- `data/market_rules.json`(V2 항목을 배열 끝에 더하기만), `schemas/market_rules.schema.json`
- `tools/validate_data.py`, `tools/test_validate_data.py`(더하기만)
- `MANIFEST.json`(생성만), `docs/ai/tasks/results/TASK-0067a.md`
- 그 밖(특히 `src/ui/**`, 그 밖의 `src/engine/sim/**`, 골든 파일·골든 도구, 기존 시험 파일)은 고치지 않는다. 필요하면 멈추고 보고한다.

## 11. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 1절 1 세 검사와 d03 cmp의 작업 전·후 출력
- 술어 9곳 전후 grep, 바꾸지 않은 `layers.includes` 10곳
- V2 원문 항목 전체, 시나리오별 등급 표, 검사기 4.2의 계산 출력(비대칭 제약 값, rule_set·행별 한도 최댓값)
- 새 시험 출력, 변형 표, 근거 3 일회 확인
- `review_checks` 줄
- 0067b·0068에 넘길 것: `creditTermCheck`·`creditTermOptions` 서명, `CreditProfile` 모양, `withRiskLevelV2`에 `R4`를 더할 자리, `RiskContract`에 넣을 칸(`creditTermId`·`creditEligible`·등급·`saleAmountMinor`)의 출처
- 범위 밖에서 발견한 것, 질문

## 12. 처리표(`PRECHECK-0067-HUB-2026-10-24.md`, H26)

| id | 처리 |
|---|---|
| D1 | 4.4 d03 최소 수정, V2 배열 끝(1절 4), `risk-runner.test.ts` 불변(1절 2), d03 cmp |
| D2 | 4.3 `loadCreditProfile`, `loadRiskProfile` 불변(1절 5) |
| D5 | 머리말 우선 규칙과 이탈 표 |
| D5a | 4.1 `credit_limits[{grade, lots, limit_minor}]`, 4.2-6 일치 검사, 변형 11 |
| D5b | 3절 `withRiskLevelV2`(이탈 표) |
| D5c | 4.1 `collections.carry_bp_per_day`·`credit_terms[].premium_bp` |
| D6 | 5.2 오퍼 결제일 식 |
| D12 | 시험 3 rules-1 |
| D13 | 시험 1 동치, 변형 2 |
| D14 | 2절 ‘10곳’, grep 출력 |
| D16 | 시험 3 경계, 변형 6·7 |
| D17 | 시험 7 차분, 변형 8 |
| D18 | 7절 머리 |
| D19 | 5.2·시험 2 `Object.hasOwn`, 변형 4 |
| D20 | 1절 1 `run.mjs run` cmp, 9절 2 `--name-status`·`--porcelain`, 머리말 시드 예외 |
| D22 | 시험 6 `save.ts:107`, 근거 3 일회 확인 |
| H26-3 (a) | 0067b(`carryAccrued`) |
| H26-3 (b) | 5.1 `creditTermCheck`, 시험 5 |
| H26-3 (c) | 4.1 주의, 시험 1 등급 표, 4.2-5 모든 활성 rule_set |
| D3·D4·D7~D11·D15·D21 | 0067b |

## 개정 1 처리표(`PRECHECK-0067a-HUB-2026-10-24.md` 4절)

| 편집 | 반영 자리 |
|---|---|
| E1 | 4.4 비교(`marketRulesSha256` 지우고 비교, 값 따로 확인) |
| E2 | 4.4 명령(`--seed-base 2001 --seed-from 1 --seed-to 3`), 기본 시드 금지 |
| E3 | 9절 1 |
| E4 | 8절 변형 12 |
| E5 | 8절 변형 9~11 |
| E6 | 7절 시험 8 |
| E7 | 8절 변형 13 |
| E8 | 4.2-1 |
| E9 | 7절 시험 6 |
| E10 | 9절 2 |
| E11 | 3절 ID 짝 검사, 4.3 등급 출처, 7절 시험 1 동치 조합 |
| E12 | 5.1 호출 순서 |
| E13 | 7절 시험 4, 8절 변형 14 |
