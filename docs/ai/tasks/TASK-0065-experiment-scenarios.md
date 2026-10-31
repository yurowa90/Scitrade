# TASK-0065 경로 2 품목안 실험 시나리오: (나) 화장품 1품목, (다) 화장품 + 조미김 (승인, 개정 3a)

- **지위: 승인(허브, 2026-10-17, 개정 3a). 이 지시서를 담은 개발 브랜치 커밋이 BASE다.** 세션 A 초안 3(2026-10-17, 초안 1·2는 2026-10-16·17) 위에 허브 좁힌 검증(처리표 끝 ‘허브 좁힌 검증 처리표(개정 3a)’)을 반영했다. 사전 확인은 `PRECHECK-0065-HUB-2026-10-17.md`, 결정은 H18(H18-5 정정 포함)이다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0064 병합(개발 브랜치 `d749e9b`, 기록 `e318728`). **`BASE`는 작업 트리를 만든 커밋(이 지시서의 승인본을 담은 개발 브랜치 커밋)이다.** 작업 시작 때 `git rev-parse HEAD`를 결과 보고에 적고 그 값을 BASE로 쓴다(TASK-0064와 같은 규칙).
- 코드 자리는 줄 번호가 아니라 함수·상수 이름으로 가리킨다.
- 기준 문서: **판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`(승인 `9ce98fe`) 1.1·3.3·5.2·6.2**, **설계 `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 6절(시작 프로필, 동결)**, **허브 결정 H18**(`HUB-DECISIONS-2026-10-16.md` 끝, H18-5 정정 포함). 판정표와 설계 6절은 동결돼 있으므로 고치지 않는다. 이 지시서와 다르면 판정표·설계 6절이 우선이고(H18은 H18-5 정정을 담아 이 지시서와 같다), 다르게 해야 할 이유가 생기면 멈추고 보고한다.
- 목적: 판정표의 품목 변형 (나)·(다)를 잴 자료를 만든다. 이 작업은 **측정하지 않는다.**
- 이 작업의 병합 커밋은 판정표 ‘측정 전 고정 기록’에 들어간다. 허브는 병합 뒤 `data/market_rules.json`·`data/goods.json`의 sha256과 위험 프로필 대조(판정표 고정 기록의 대조 규칙, H15 F8) 결과를 적는다.

### 공유 프로필에 김 행을 더하는 것과 설계 6절 동결(H18-1, 세션 A 근거)

- **동결 범위 안의 일이다(v2가 아니다).** 설계 6절은 김 행을 ‘TASK-0065가 더할 값(이 문서로 미리 고정, 동결 범위)’으로 이미 적었다(DESIGN.md 345행: 조미김 품목 행 기준 세율 CN·VN 500, `p_claim_bp` 500, 등급 LOW. 표의 김 판매처 둘 등급 C). 또 ‘`tariff.base`는 모든 변형의 품목을 담는다. … 0062는 의류·화장품 행만 넣고 TASK-0065가 김 행을 같은 값으로 더한다’(363행)고 적었다. 그러니 데이터 프로필에 김 행을 더하는 것은 동결된 설계를 이행하는 것이고, 동결 자료를 바꾸는 것이 아니다. 판정표 고정 기록의 대조 기대값도 ‘설계 6절 + 그 행들’이다(아래 3절).
- **런타임 충돌은 설계가 다루지 않은 구현 결과다.** 설계 6절은 프로필 하나를 모든 변형이 공유한다고 정했지만, 김이 없는 시나리오에서 관세 공지 문장이 품목 이름을 찾다가 예외를 내는 경로(`tariffSchedule` → `goodOf`)는 다루지 않았다(허브 사전 확인 P1 실측: R2 시드 2001~2020에서 (가)·(나) 15/20 예외).
- **H18-1의 고침(설정 만들 때 그 설정의 품목 행만 남김)은 6절의 예외 규칙과 맞는다.** 6절은 ‘프로필에 없는 (도착국, 품목)·품목·거래처가 실행 중에 나오면 예외’(363행, H14-10)라고 정했다. 거르기는 `config.goods`에 없는 품목의 행만 뺀다. 시나리오에 있는 품목의 행이 프로필에 없으면 지금처럼 예외가 난다. 그래서 예외 규칙은 그대로 살고, 김이 없는 시나리오가 김 행 때문에 멈추는 일만 없어진다.
- **옛 측정값은 바뀌지 않는다.** 거르기 뒤 (가) 프로필의 `tariff.base`·`claims.byGood`은 김 행을 더하기 전과 같다(배열 순서 포함). `collections.byCounterparty`와 `market.counterparties`에는 새 거래처 행이 더해지지만 (가)에는 그 거래처의 견적이 없어 (가)의 상태 전문은 같다(R2 상태 `cmp` 0, ‘지켜야 할 것’). 같은 나라 행은 같은 걸음을 받고 김 행의 기준 세율(500)이 화장품과 같으므로, (다)에서도 무의미 사건 판정과 사건 일정은 (가)·(나)와 같다(공통 난수). (가) 쪽은 시험 ‘(가) 설정 동일’로, (다)의 사건 일정이 같다는 것은 시험 ‘김 없는 시나리오 구동’의 tariffEvents 단언으로 보인다.

## 원칙

- **새 자료만 더한다.** 옛 시나리오·옛 rule_set(`M2A5_PYEONGTAEK`)·옛 견적·옛 거래처는 한 글자도 바꾸지 않는다. TASK-0062a 골든(rules-2 105회, 규칙 1 400회)은 바이트 그대로여야 한다.
- **배열 끝에 더한다.** `goods.items`, `market_rules.rule_sets`, `market_rules.counterparties`, `market_offers.items`, `scenarios.items`, 위험 프로필의 `tariff.base`·`claims.by_good`·`collections.by_counterparty` 모두 끝에 더한다. 기존 시험이 `rule_sets[0]`·`counterparties[0]` 같은 앞자리를 읽는다(사전 확인 ambiguity 권고).
- **측정 금지(판정표 0절 1, H14-8).** 새 시나리오로 `d03`·`runSuite`·`run.mjs`를 실행하지 않는다. 허용하는 것은 생성기 견적 수 확인과 단위 시험뿐이다.
- **시험 시드.** 이 작업의 시험은 시드 2001~2020만 쓴다(H17-8 범위 안). 기준 시드(1001~1020)·표본 밖·v2 시드는 측정에서만 쓴다.
- **실명 기업·브랜드를 쓰지 않는다.** 품목·거래처 이름은 일반명이다(‘하이퐁 김 고객’ 등).
- **엔진 동작은 바꾸지 않는다.** 고치는 엔진 코드는 둘뿐이다: 시나리오 로더의 실험 목록·타입(5절), `src/engine/risk.ts` `withRiskLevel` 몸통의 프로필 행 거르기(3절, H18-1). `tariffEvents`·`knownRate`·`tariffSchedule`·`dutyFor`·`claimFor`·`collectionPlan`은 고치지 않는다.
- 시험에 자료 ID·조정 상수를 쓰지 않는다(TASK-0027 R1). 새 시나리오 ID는 `EXPERIMENT_SCENARIO_IDS`에서, 품목·거래처는 시나리오 설정에서 읽는다. FOCUS 품목의 기준값은 시험 ‘품목’이 정한 방식으로 읽는다(H18-3).

## 구현 지시

### 1. 품목(`data/goods.json`)

- 새 품목 `SEASONED_LAVER`(이름 ‘조미김’) 하나를 `items` 끝에 더한다. 마른김은 더하지 않는다(판정표 1.1·3.3: (다)는 조미김 한 형태, G=2).
  - `quantity_unit` `case`, `mass_kg_per_unit` 3, `volume_m3_per_unit` 0.01, `storage_class` `dry`, `quality_model_status`는 화장품과 같은 값.
  - **1묶음의 무게·부피·금액을 화장품 1묶음과 같게 둔다(H18-2).** 화장품 1묶음은 50상자 × 6 kg = 300 kg, 50 × 0.02 m³ = 1 m³, 2,000 USD다. 조미김 1묶음은 100상자 × 3 kg = 300 kg, 100 × 0.01 m³ = 1 m³, 2,000 USD다. 이 부피는 **측정 통제값이고 현실값이 아니다**(실제 조미김은 부피가 큰 품목). 부피가 큰 품목의 학습 장면은 경로 7 품목 지식 카드에서 다룬다. 경로 5 측정이 끝나기 전에는 이 값을 바꾸지 않는다(바꿀 때는 새 ID 또는 측정 뒤).
  - **HS 상태.** 세션 C가 한국 10자리 `2008.99-5010`을 관세청 원자료로 확인했다(`docs/ai/design/research/ROUTE-4A-10B1-SOURCES.md`). 그러나 `data/sources.json`에 그 원자료 항목이 없고 HS 판본이 적혀 있지 않다. 검사기의 `VERIFIED` 조건(코드·판본·출처 셋 모두)을 채울 수 없으므로 **`hs_mapping_status` `NOT_VERIFIED`, `hs_code`·`hs_edition` null**로 둔다.
  - 한 줄 이유(지시서와 결과 보고에 같이 적는다): ‘HSK 2008.99-5010은 세션 C 확인(`ROUTE-4A-10B1-SOURCES`), 검사기 출처 조건 때문에 NOT_VERIFIED.’ `VERIFIED`로 올리는 일은 경로 7에서 세션 C와 함께 한다.
- **가상값·기준일 표지(기존 방식, 사전 확인 P9·P10).** 새 칸이나 새 출처를 만들지 않는다. 표지는 지금 자료와 같은 방식으로 단다: 파일의 `data_basis` `DESIGN`과 `numeric_values_status` 문장, 항목의 `source_refs`가 가리키는 설계 출처(기준일 = 그 출처의 `checked_on`). 새 항목의 `source_refs`는 **이어받거나 복사하는 옛 짝 항목·상속 원본과 같은 ID**다: `OFFER_SELL_02_NEW`와 두 시나리오는 `DESIGN-V04`(짝 `OFFER_SELL_02`·`SCENARIO_M2_OPERATIONS`가 V04), 짝이 없는 새 품목 `SEASONED_LAVER`는 `DESIGN-V03`(같은 파일 옛 항목), 새 rule_set·거래처는 `DESIGN-V04`. 결과 보고에 항목마다 쓴 출처 ID와 그 기준일을 적는다.

### 2. 새 rule_set 둘과 거래처(`data/market_rules.json`)

`M2A5_PYEONGTAEK`를 복사해 만든다. **`rule_sets` 배열 끝에 더한다.** 아래에 적은 것 말고는 모든 값이 `M2A5_PYEONGTAEK`와 같다(`publish`, `rng`, `index`의 `goods` 밖 모든 칸, `regional_pct`, `counterparty_pct`, `forwarding` 전체, `drop_if_beyond_campaign`, `trade`의 `buy_city_id`·`sell_city_ids`·`max_lots_choices`·`sell_deadline_offset_days`·`payment_offset_days`). 이 같음은 검사기 ‘복사 동일성’이 잠근다(6절).

| 칸 | `M2A5_PYEONGTAEK_COS`((나)) | `M2A5_PYEONGTAEK_COS_LAVER`((다)) |
|---|---|---|
| `index.goods` | `[COSMETICS]` | `[COSMETICS, SEASONED_LAVER]` |
| `trade.goods` | 화장품 한 줄 | 화장품, 조미김 두 줄(이 순서) |
| `rows` | 화장품 BUY·SELL 셋(값은 옛 rule_set과 같음) | 화장품 셋 + 조미김 셋 |

- **화장품 줄**: `good_id` `COSMETICS`, `id_tag` `COS`, `base_lot` 50, `buy_counterparty_id` `SUPPLIER_DEMO_COSMETICS`(옛 공급자 그대로). 판매 거래처는 새 ID다: 하이퐁 `CUSTOMER_HAI_COSMETICS_NEW`, 상해 `CUSTOMER_SHA_COSMETICS_NEW`(설계 6절 표, H14-9). 판매 거래처 말고는 화장품 `trade.goods` 줄과 화장품 `rows` 셋이 옛 rule_set과 같다. 두 rule_set 모두에 `COSMETICS`가 반드시 있다(판정표 6.2 `FOCUS`, H14-1).
- **조미김 줄**: `good_id` `SEASONED_LAVER`, `id_tag` `LAV`, `base_lot` 100, `buy_counterparty_id` `SUPPLIER_DEMO_LAVER`(새 공급자), 판매 거래처 하이퐁 `CUSTOMER_HAI_LAVER`, 상해 `CUSTOMER_SHA_LAVER`.
- **기준가(USD, 시작 판매 마진 k = 0)**

  | 행 | 화장품 | 조미김 |
  |---|---:|---:|
  | 평택 BUY | 40.00 | 20.00 |
  | 하이퐁 SELL | 51.70 | 25.60 |
  | 상해 SELL | 53.00 | 26.60 |

  - 화장품은 옛 rule_set 값 그대로다.
  - 조미김은 1묶음(100개) 금액을 화장품 1묶음(50개)과 같은 2,000 USD로 맞췄다. 무게·부피도 1묶음 기준으로 같다(1절). 판매가는 ‘김은 상해 중심’을 하이퐁 쪽 기준가를 낮게 두는 것으로만 표현한다(판정표 1.1).
  - 1묶음 순마진(운임 200·180, 관세 5% 가정, 판매가 대비): 조미김 하이퐁 260 USD(10.2%)·상해 380 USD(14.3%), 화장품 285 USD(11.0%)·370 USD(14.0%). **이 값은 판정표 5.2의 m₀이 아니다.** m₀ = SELL₀ ÷ BUY − 1은 조미김 하이퐁 28.0%·상해 33.0%, 화장품 29.25%·32.5%다(사전 확인 P14).
  - 가격은 병합 커밋에서 고정되고 해시로 잠긴다(판정표 5.2 판매 마진 행, H10-5).
- **거래처(`counterparties`) 끝에 다섯을 더한다**: `CUSTOMER_HAI_COSMETICS_NEW`(하이퐁 화장품 신규 고객), `CUSTOMER_SHA_COSMETICS_NEW`(상하이 화장품 신규 고객), `CUSTOMER_HAI_LAVER`(하이퐁 김 고객), `CUSTOMER_SHA_LAVER`(상하이 김 고객), `SUPPLIER_DEMO_LAVER`(김 공급자). 괄호 안 문장이 `name_ko` 그대로다(기존 자료처럼 ‘상하이’로 적는다). 새 시나리오의 `title_ko`·`scope_note`는 base 시나리오 문장 꼴을 따르고 결과 보고에 적는다.

### 3. 위험 프로필에 더할 값과 설정 단계 거르기

- **자료(설계 6절 ‘TASK-0065가 더할 값’ 그대로, 각 배열 끝).**
  - `tariff.base`: `SEASONED_LAVER`의 CN·VN 행, `rate_bp` 500.
  - `claims.by_good`: `SEASONED_LAVER`, 등급 LOW, `p_claim_bp` 500.
  - `collections.by_counterparty`: 화장품 새 판매처 둘은 B, 김 판매처 둘은 C.
  - 다른 값은 바꾸지 않는다. 설계 6절 JSON에 이 행들을 더한 것이 대조의 기대 프로필이다(판정표 고정 기록의 대조 규칙). 배열 안 순서는 대조에서 보지 않는다.
- **`withRiskLevel` 거르기(H18-1, `src/engine/risk.ts`에서 고칠 수 있는 곳은 이 함수 몸통뿐).** 설정에 담을 프로필을 만들 때, 프로필의 복사본에서 `tariff.base`와 `claims.byGood`을 그 설정의 `config.goods`에 있는 품목(`goodId`) 행만 남긴다. 남긴 행의 순서는 원래 순서다. `collections`와 나머지 칸은 거르지 않는다. 원화 매입 변환 등 함수의 다른 동작은 그대로다. `R0`(위험 설정 없음)은 지금처럼 설정을 그대로 돌려준다.
  - 런타임 함수는 바꾸지 않는다. 그래서 시나리오에 있는 품목의 행이 프로필에 없으면 지금처럼 예외가 난다(H14-10).
  - 결과: (가)의 R1~R3 설정의 `tariff.base`·`claims.byGood`은 김 행을 더하기 전과 같다(시험 ‘(가) 설정 동일’은 공유 프로필 설정과 ‘김 tariff·claims 행만 뺀 사본’ 설정을 비교한다). 새 거래처 행은 (가) 설정에도 실린다.
- **TASK-0063·0064 시험 두 곳을 함께 고친다(세션 A 시제품 실측, H18-5).** 아래 두 시험은 공유 프로필(`riskProfiles()[0]`)의 행을 직접 돌며 거른 설정에 김 품목으로 순수 함수를 부르므로, 거르기 뒤 맞는 구현에서 예외로 실패한다(세션 A 실측: 김 행·거르기를 넣은 사본에서 이 두 시험만 실패, 아래처럼 고치면 전체 1,465개 통과). 아래에 적은 자리만 그 설정에 실린 행으로 바꾼다. 단언·기대값 식·그 밖의 줄은 바꾸지 않는다.
  - `src/engine/m2a5-risk-cost.test.ts` ‘사건 범위: 다른 기준 세율, 실제 경계 자르기, 품목 순서 보존’: `cfg` 정의 바로 다음 줄에 `const used = rows.filter((r) => cfg.goods.some((g) => g.id === r.goodId));` 한 줄을 더하고, ① `for (const row of rows)`(dutyFor 루프), ② `rows.map(…fromBp)`, ③ `rows.map(…toBp)` 세 곳의 `rows`를 `used`로 바꾼다(사본의 세율을 바꾸는 앞쪽 두 줄은 그대로. ②③을 두면 거른 설정의 rates에 김이 없어 `.fromBp`에서 TypeError, 허브 실측).
  - `src/engine/m2a5-risk-credit.test.ts` ‘일정 오라클(클레임·수금): 모든 품목·거래처·키, R2 표 미참조’: `for (const row of profile.claims.byGood)`를 `for (const row of cfg.operations!.risk!.profile.claims.byGood)`로 바꾼다.
  - 다른 0062·0063·0064 시험은 고치지 않는다. 그 밖에 실패하는 시험이 나오면 고치지 말고 멈추고 보고한다.

### 4. 정적 견적과 시나리오(`data/market_offers.json`, `data/scenarios.json`)

- **정적 매입·판매 견적(1~3일).** 옛 운영 시나리오는 의류·화장품 정적 견적 쌍을 이어받는다. 새 시나리오는 **화장품 쌍 하나만** 쓴다. (나)·(다)의 1~3일이 같아야 D(품목 폭 비교)가 묶음 견적의 차이만 보기 때문이다.
  - 새 견적 `OFFER_SELL_02_NEW`(`items` 끝): `OFFER_SELL_02`와 모든 값이 같고 `counterparty_id`만 `CUSTOMER_SHA_COSMETICS_NEW`다(`source_refs` `['DESIGN-V04']`도 같다).
  - 매입은 옛 `OFFER_BUY_02`를 그대로 쓴다. 주선 정적 견적 `OFFER_FWD_01`·`OFFER_FWD_02`도 그대로 쓴다.
- **시나리오 둘**(`items` 끝)

  | 칸 | `SCENARIO_M2_OPS_COSMETICS`((나)) | `SCENARIO_M2_OPS_COS_LAVER`((다)) |
  |---|---|---|
  | `base_scenario_id` | `SCENARIO_M2_OPERATIONS` | `SCENARIO_M2_OPERATIONS` |
  | `stage`·`securities_enabled`·`ipo_enabled`·`source_refs` | `SCENARIO_M2_OPERATIONS` 값 그대로 다시 적는다(`M2`, false, false, `['DESIGN-V04']`). 스키마가 항목마다 요구한다 | 같음 |
  | `offer_ids` | `OFFER_BUY_02`, `OFFER_SELL_02_NEW`, `OFFER_FWD_01`, `OFFER_FWD_02` | 같음 |
  | `operations` | `SCENARIO_M2_OPERATIONS`의 `operations` 전체를 복사하고 `market_rules_ref`만 `market_rules.json#M2A5_PYEONGTAEK_COS`로 | 같게, `…#M2A5_PYEONGTAEK_COS_LAVER` |
  | `title_ko`·`scope_note` | ‘실험: 화장품 1품목’ 등 실험임을 밝힌 문장 | ‘실험: 화장품 + 조미김’ |

  - 상속은 맨 위 칸을 통째로 덮는다(`resolveScenarioRecord`). 그래서 `operations`는 전체를 복사해야 한다.
  - `rules_version`은 상속한 `M2a-rules-2` 그대로다. R1~R3은 실행기가 `withRiskLevel`로 만든다(판정표 1.2). rules-3 시나리오 레코드(로더 분기·`operations.risk` 스키마)는 이번에 넣지 않는다. 학생에게 낼 때(경로 11 이후) 따로 한다.
  - 그래서 검사기의 ‘operations는 M2a-rules-2가 필요하다’ 검사는 이번에 고치지 않는다(새 시나리오도 rules-2다). 나중에 rules-3 운영 시나리오를 자료로 둘 때 함께 고친다(허브 TASK-0062 검수 이월). 결과 보고 ‘범위 밖 발견’에 적는다.

### 5. 실험 목록(`src/content/scenario.ts`)

- `EXPERIMENT_SCENARIO_IDS = ['SCENARIO_M2_OPS_COSMETICS', 'SCENARIO_M2_OPS_COS_LAVER'] as const`를 둔다(H2).
- `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`·`SCENARIO_IDS`에는 넣지 않는다. 그래서 학생의 시나리오 고르기(`src/ui/main.ts`가 `ALL_SCENARIO_IDS`로 만드는 선택 목록)와 D03 기본 목록에 나타나지 않는다.
- `loadScenario`가 실험 ID도 받도록 타입만 넓힌다. 읽는 방식은 바꾸지 않는다.

### 6. 검사기(`tools/validate_data.py`)

- 기존 위험 프로필 양방향 검사(설계 6절)가 새 rule_set에도 돈다. 운영 rule_set의 정의는 ‘`rules_version`이 M2a-rules-2 이상인 시나리오가 `operations.market_rules_ref`로 쓰는 rule_set’이고, 새 시나리오는 `scenarios.json`에 있으므로 대상이다.
- **실험 시나리오 판별(P7).** 검사기에 실험 ID 두 개를 상수로 둔다(`EXPERIMENT_SCENARIO_IDS`, 주석에 ‘`src/content/scenario.ts`의 같은 이름 상수와 같은 값’). 새 rule_set ID 둘도 상수로 둔다. 옛 rule_set은 배열 위치가 아니라 id `M2A5_PYEONGTAEK`로 고른다.
- **새 검사 셋을 더한다.**
  1. **상속 동일(P7).** 실험 시나리오마다, 자기 `operations`에서 `market_rules_ref`를 뺀 값이 상속을 푼 base 시나리오의 `operations`에서 `market_rules_ref`를 뺀 값과 같다.
  2. **판매 거래처 분리(P2).** 새 rule_set의 직접 무역 판매 거래처(`trade.goods[].sell_counterparties[].counterparty_id`. `rows`에는 거래처 칸이 없다, 스키마)는 id `M2A5_PYEONGTAEK` rule_set의 판매 거래처와 겹치지 않는다. 새 rule_set끼리는 함께 써도 된다((나)·(다)가 `CUSTOMER_*_COSMETICS_NEW`를 함께 쓴다).
  3. **복사 동일성(P6).** ① 새 rule_set에서 `id`·`index.goods`·`trade.goods`·`rows`를 뺀 나머지가 옛 rule_set의 같은 값과 깊은 비교로 같다. ② 새 rule_set의 화장품 `trade.goods` 줄과 화장품 `rows`가 `sell_counterparties`의 `counterparty_id`를 빼고 옛 rule_set의 화장품 줄과 같고, 화장품 `rows`는 옛 rule_set의 화장품 행과 그대로 같다. ③ `OFFER_SELL_02_NEW`가 `id`·`counterparty_id`를 빼고 `OFFER_SELL_02`와 같다.
- **기존 검사의 확인(P8).** 새 rule_set의 `trade.goods`·`index.goods`·`rows` 정합은 기존 `check_market_rules`가 이미 모든 rule_set에 대해 본다. 새 검사를 만들지 않고, 반례(새 rule_set의 rows 하나 빠짐 → 시세표 행 집합 불일치)로 그 검사가 새 rule_set에도 도는 것만 확인한다.
- **고정 수(P4).** `expected_counts`의 `goods` 8→9, `market_offers` 6→7, `scenarios` 8→10만 바꾼다. 다른 고정값은 그대로 두고, 자료에서 읽게 바꾸지 않는다. 결과 보고에 바꾼 줄을 적는다. MANIFEST는 `python3 tools/build_package.py --manifest-only`로 갱신한다.

## 시험(새 파일 `src/engine/m2a5-experiments.test.ts`)

- **공유 계산은 lazy로 둔다(P5, 0064 후속).** 시드 2001~2020 공개일 묶음과 R2·R3 구동 같은 공유 계산은 모듈 최상위에서 즉시 실행하지 않는다. 기억해 두는 함수로 두고 `it` 안에서 부르며, 생성기·`claimFor`·`collectionPlan`·`dutyFor`·엔진 예외도 `it` 안에서 받는다. 0064의 ‘모듈 최상위에서 즉시 만든다’ 규칙은 이 파일에 적용하지 않는다. 시드를 도는 `it`에는 명시 timeout(60000ms 이상)을 준다.
- **묶음 생성 문장(P11, 0064 ‘클레임’ (라)와 같은 꼴).** 시드마다 R3 설정은 `withRiskLevel({ ...실험 설정, seed }, 'R3', riskProfiles()[0])`, R0는 `{ ...실험 설정, seed }`다. `generateBatch(seed, k, 직전 index, cfg)`를 k = 1 … (publish.lastDay − publish.firstDay) ÷ publish.intervalDays로 부르고, index는 `batchZero(cfg).index`에서 시작해 앞 결과의 `batch.index`로 잇는다. 1일 정적 `cfg.offers`는 넣지 않는다.
- 시험은 엔진 공개 함수(`createGame`·`openDay`·`commitDay`, 생성기·읽기 함수, `withRiskLevel`·순수 위험 함수)만 쓴다. `src/engine/sim/**`의 `simulate`·`runSuite`·`runD03`는 부르지 않는다(판정표 0절 1 잠금).

| 시험 | 확인할 것 |
|---|---|
| 목록 | `EXPERIMENT_SCENARIO_IDS`의 두 ID가 `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`에 없고, `loadScenario`로 읽힌다 |
| 상속(P3) | `loadScenario` 결과에서 `id`·`titleKo`·`baseScenarioId`·`offers`·`goods`·`operations.market.index`·`operations.market.rows`·`operations.market.trade`를 뺀 나머지가 `SCENARIO_M2_OPERATIONS` 결과와 `toEqual`이다. `operations`의 나머지 칸 전체와 `operations.market`의 `publish`·`rng`·`regionalPct`·`counterpartyPct`·`forwarding`·`counterparties`는 반드시 비교에 남긴다(변형 3·8이 걸리게) |
| 품목(C1, H18-3) | FOCUS 품목 = 실험 시나리오의 1일 정적 매입 견적(`config.offers`의 `supplier` 견적, base와 같은 화장품 견적)의 `goodId`다. 이 값이 (나)·(다)의 `operations.market.trade.goods`에 있다. (나)의 직접 무역 품목 집합 크기는 1, (다)는 2이고, (다)의 나머지 하나는 base 시나리오의 `operations.market.trade.goods`에 없는 새 품목이다 |
| 견적 수(J4a) | R0 설정, 시드 2001~2020, 위 ‘묶음 생성 문장’대로 모든 공개일 묶음을 만들어 묶음당 견적 수의 최댓값이 (나) 2G+6 = 8, (다) 10 이하다. G는 rule_set의 `trade.goods` 길이에서 읽는다 |
| 거래처(P12) | 새 판매 거래처 넷(두 rule_set의 판매 거래처 가운데 base rule_set에 없는 것)이 모두 프로필 `collections.byCounterparty`에 있다. 화장품 두 판매처 등급이 서로 같고, 김 두 판매처 등급이 서로 같으며, 김 등급 ≠ 화장품 등급이다(값은 프로필에서 읽음). (나)·(다)의 화장품 판매 거래처 집합은 같다 |
| 위험 변환 | R3 설정(시드 2001~2020)마다 ‘묶음 생성 문장’대로 모든 공개일 묶음을 만들고, 그 직접 무역 견적의 품목·판매 거래처마다 `claimFor(cfg, seed, 판매 견적 ID, 품목)`·`collectionPlan(cfg, seed, 판매 견적 ID, 거래처)`·`dutyFor(cfg, seed, 품목, 판매 도시, 공개일, 공개일, 매입 견적 금액, 매입 견적 통화, 공개일)`이 예외 없이 값을 낸다. 조미김 견적과 새 판매 거래처 넷이 각각 한 번 이상 나왔음을 먼저 단언한다. `withRiskLevel`만으로는 누락을 잡지 못하므로 이 호출이 필요하다 |
| 김 없는 시나리오 구동(H18-1) | (가)·(나)·(다) × R2·R3 × 시드 2001~2020마다 `createGame`·`openDay`·`commitDay`를 무명령으로 `phase`가 `ENDED`가 될 때까지 돌려 예외가 없다(무명령이면 원화 고정비로 72일 무렵 경영 실패로 끝난다. 허브 실측 120판 모두 72일. 그래도 거르기 생략 변형은 (가)·(나) 15/20에서 잡힌다). 시드마다 (나)·(다) R2 설정의 `tariffEvents(cfg, seed)`가 (가) R2 설정의 것과 `toEqual`이다. 시나리오마다 `it`을 나누고 각 `it`에 timeout 180000ms 이상을 준다. 먼저 공유 프로필(`riskProfiles()[0]`)의 `tariff.base`에 (가)·(나)의 `config.goods`에 없는 품목의 행이 있음을 단언한다(그래서 이 시험이 거르기를 실제로 잰다). 각 설정의 `operations.risk.profile.tariff.base`·`claims.byGood`의 모든 행 품목이 그 설정의 `config.goods`에 있다 |
| (가) 설정 동일(H18-1) | 공유 프로필 사본에서 (가)의 `config.goods`에 없는 품목의 `tariff.base`·`claims.byGood` 행을 시험 안에서 뺀 프로필을 만든다. (가)(`OPERATIONS_SCENARIO_IDS[0]`)의 R1·R2·R3 설정(시드 2001)을 공유 프로필로 만든 것과 그 사본으로 만든 것이 `toEqual`이다 |
| 1묶음 크기 | (다) 설정에서 `cargoSpace(cfg, 화장품, 화장품 base_lot)`와 `cargoSpace(cfg, 조미김, 조미김 base_lot)`의 무게·부피가 같다(값은 설정과 rule_set에서 읽는다) |
| 1일 시작 | 실험 시나리오마다 시드 2001로 `createGame` 뒤 1일을 열고 마감할 수 있다. 정적 견적이 화장품 쌍 하나와 주선 둘이다 |

- 검사기 반례 시험(`tools/test_validate_data.py`, 추가만): 상속 동일(실험 시나리오 `operations`의 창고 값 하나 변경), 판매 거래처 분리(김 상해 판매처를 옛 거래처 ID로), 복사 동일성 ①(`regional_pct` 하나 변경)·③(`OFFER_SELL_02_NEW` 단가 변경), 기존 검사 확인(새 rule_set rows 하나 빠짐), 그리고 옛 자료가 통과함.

## 변형 시험

결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 적는다. 다만 그 전에 시험의 전제가 빠진 것인지 확인하고, 빠졌으면 시험을 고친다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 실험 ID를 `OPERATIONS_SCENARIO_IDS`에도 넣음 | 목록 |
| 2 | (나) rule_set에서 화장품을 빼고 의류로 바꿈 | 품목 |
| 3 | 새 시나리오의 `operations`에서 창고 값 하나를 바꿈 | 상속, 검사기(상속 동일) |
| 4 | 김 상해 판매처를 옛 거래처 ID로 바꿈 | 검사기(판매 거래처 분리) |
| 5 | (다)의 `forwarding.draws`를 늘림 | 견적 수(J4a), 검사기(복사 동일성) |
| 6 | 위험 프로필에서 김 클레임 행을 뺌 | 위험 변환(`claimFor` 예외), 검사기(양방향) |
| 7 | 조미김 `volume_m3_per_unit`을 0.02로 둠 | 1묶음 크기 |
| 8 | 새 rule_set의 `regional_pct` 값 하나를 바꿈 | 검사기(복사 동일성 ①), 상속 |
| 9 | `OFFER_SELL_02_NEW` 단가를 바꿈 | 검사기(복사 동일성 ③) |
| 10 | `withRiskLevel` 거르기를 뺌(공유 프로필 그대로 담음) | 김 없는 시나리오 구동(행 소속 단언 또는 (가)·(나) R2 첫 관세 공지일 예외), (가) 설정 동일 |
| 11 | 김 판매처 등급을 화장품과 같은 B로 둠 | 거래처 |

## 고칠 수 있는 파일

- `data/goods.json`, `data/market_rules.json`, `data/market_offers.json`, `data/scenarios.json`(모두 **추가만**, 배열 끝. 옛 항목은 바꾸지 않는다)
- `src/content/scenario.ts`(실험 목록과 `loadScenario` 타입만)
- `src/engine/risk.ts`(**`withRiskLevel` 몸통만**, 3절 거르기)
- `src/engine/m2a5-risk-cost.test.ts`·`src/engine/m2a5-risk-credit.test.ts`(**3절에 적은 두 시험의 지정한 자리만**)
- `tools/validate_data.py`(6절의 상수·새 검사 셋·고정 수), `tools/test_validate_data.py`(반례 시험 추가만)
- 새 `src/engine/m2a5-experiments.test.ts`
- `docs/ai/tasks/results/TASK-0065.md`, `MANIFEST.json`

## 손대지 않을 파일

- 위 목록 밖의 `src/engine/*.ts`(특히 `risk.ts`의 다른 함수, `engine.ts`, `reports.ts`), 다른 시험 파일, `src/engine/sim/**`, `src/ui/**`, `schemas/**`(새 칸이 필요하면 멈추고 보고), 다른 `data/**`
- 골든 파일·검사기: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`. `--write`를 쓰지 않는다.
- 판정표, 설계 6절

## 지켜야 할 것

- **골든 진단 절차(허브 통일 문장).** 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고, 0이 아니면 고치지 말고 멈춘다. `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다. 이 작업은 새 자료만 더하고 `withRiskLevel`은 rules-2 경로(R0)를 바꾸지 않으므로 골든은 깨지지 않아야 한다. 깨지면 원인을 적고 멈춘다.
- **R2 상태 전문 `cmp` 0(H18-1).** BASE와 작업 뒤에서 (가)의 R2·R3 설정을 시드 2001~2003·고정 명령열(1일 첫 쌍 수락, 매일 필요한 원화만 환전)로 캠페인 끝까지 돌린 `serializeSave(...).state`(meta 제외)가 바이트로 같다. 저장소 밖 일회용 스크립트로 하고 엔진 공개 함수만 쓴다.
- 측정 금지와 시험 시드(원칙).
- **첫 화면 크기**(0062 사전 확인 P10과 같은 방법). BASE와 작업 뒤 각각 깨끗한 트리에서 `npm run build` 다음 `node tools/check_bundle_size.mjs dist`의 첫 화면 줄을 적는다. 자료 몫과 코드 몫을 따로 적고, **코드 몫이 +2,500 B를 넘으면 멈추고 보고한다.** 자료 몫은 크기와 함께 보고만 한다.
- `review_checks` 통과.

## 완료 조건

1. 지시 1~6 반영, 시험 표의 시험 모두 통과.
2. `npx vitest run`(0062·0063·0064 시험 포함, 3절의 두 시험의 지정한 자리 말고는 고치지 않은 채), `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `python3 tools/test_validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과(골든 검사 포함).
3. 변형 표의 모든 행이 잡힌다(또는 원래 코드와 같은 이유를 적었다).
4. `git diff <BASE> -- data/`가 추가 줄만 담는다(지운 줄·바꾼 줄 0). 결과 보고에 `git diff --stat`과 지운 줄 수 0을 적는다.

## 결과 보고에 넣을 것

- 더한 자료 항목 목록(품목·rule_set·거래처·견적·시나리오·프로필 행)과 항목마다의 `source_refs`·기준일
- 견적 수 시험의 묶음당 최댓값((나)·(다))
- `withRiskLevel` 거르기의 diff, 3절 두 시험 루프의 diff, (가) 설정 동일·R2 상태 `cmp` 결과
- 검사기 고정 수를 바꾼 줄
- **실험 설계 가정(H18-2):** ‘조미김 1묶음의 무게·부피·금액이 화장품 1묶음과 같다(0.01 m³/상자는 측정 통제값, 현실값 아님). 그래서 (다)의 D는 공간 효과를 재지 않는다.’
- 병합 뒤 허브가 고정 기록에 적을 값의 재료: `data/market_rules.json`·`data/goods.json` sha256, 위험 프로필 JSON(설계 6절 + 더한 값)
- 범위 밖 발견: 조미김 HS 상태(`NOT_VERIFIED`인 이유), 학생에게 낼 때 필요한 rules-3 시나리오 레코드와 검사기 ‘operations는 M2a-rules-2 필요’ 이월, claims bp·`partial_bp` 범위 좁히기(경로 5 전 별도 작업, 0065에서 하지 않음), 아래 ‘생성기 난수 순서’ 메모에 대한 관찰
- 질문

## 허브 확인(초안 0, 2026-10-16 허브 답)

- 네 건 모두 받아들여졌다. 조미김 가격은 제안값 그대로이고, 병합과 허브 고정 기록(sha256)으로 동결된다. 허브가 사용자에게 보고하며, 병합 전까지는 바꿀 수 있다. 조건은 둘이다: 품목 자료에 기존 방식의 가상값·기준일 표지를 단다(1절), HS 이유 한 줄을 적는다(1절). 아래는 초안 0의 질문 원문이다.

- **조미김 가격.** 1묶음 100개 × 20 USD, 판매 하이퐁 25.60·상해 26.60으로 제안했다. 화장품과 마진 띠를 맞추고 ‘상해 중심’은 하이퐁을 낮게 두는 것으로만 표현했다. 판정표 5.2의 손잡이는 k(공통 폭)뿐이므로, 이 시작값이 (다)의 J7·D에 주는 효과는 측정 전에 정해진다. 사용자 결정이 필요하면 지금 올려야 한다.
- **조미김 HS 상태.** 검사기 규칙상 `VERIFIED`에는 출처 항목과 HS 판본이 필요하다. 세션 C 자료는 판본을 적지 않았고 `sources.json`에 항목이 없어 `NOT_VERIFIED`로 두었다. 올리려면 세션 C가 출처 항목을 만들어야 한다.
- **정적 견적.** (나)·(다) 모두 화장품 쌍 하나만 쓰게 했다(D가 묶음 견적의 차이만 보게). 옛 (가)는 의류·화장품 쌍 그대로다.
- **R0은 rules-2 레코드.** 실험 시나리오는 rules-2 레코드로 두고 R1~R3은 `withRiskLevel`로 만든다. DESIGN 6절의 ‘rules-3 시나리오 레코드의 로더 분기·스키마는 TASK-0065(또는 그 뒤)’ 가운데 ‘그 뒤’를 골랐다. 측정에는 필요 없고, 학생에게 낼 때 필요하기 때문이다.
- **새 매입 공급자.** 김 공급자 `SUPPLIER_DEMO_LAVER`를 새로 두었다. 화장품 공급자는 옛 ID를 그대로 쓴다(H14-9는 판매 거래처만 정했다).

## 초안 2 변경(2026-10-17, 세션 A)

- **조미김 부피 0.02 → 0.01 m³/상자(1절).** 초안 1은 무게(300 kg)와 금액(2,000 USD)만 화장품 1묶음에 맞추고 부피를 맞추지 않았다. 그래서 (다)의 D에 공간 효과가 섞일 수 있었다. 시험 ‘1묶음 크기’와 변형 7을 더했다(허브 H18-2로 채택).
- **시험 ‘위험 변환’ 보강.** `withRiskLevel`이 프로필 행을 보지 않아 변형 6을 잡지 못하던 것을 `claimFor`·`collectionPlan`·`dutyFor` 호출로 보강했다.
- **선행과 BASE.** TASK-0064 승인 뒤의 규칙으로 맞췄다.

## 허브 사전 확인 처리표(초안 3)

출처: 개발 브랜치 `695b29a`의 `PRECHECK-0065-HUB-2026-10-17.md`(확인 14·다툼 1·기각 6)와 허브 결정 H18.

| # | 내용 | 처리 | 자리 |
|---|---|---|---|
| P1 | 공유 프로필 김 행 → (가)·(나) R2·R3 openDay 예외 | 반영(H18-1). `withRiskLevel` 거르기, 동결 근거를 머리에. **정정**: H18-1의 ‘0063·0064 시험 고치지 않은 채 통과’는 세션 A 시제품에서 두 시험이 실패해 성립하지 않았다. 두 루프만 설정의 행으로 바꾸게 했다(전체 1,465개 통과, (가) R2·R3 시드 2001~2020 40판 완주 실측) | 머리, 원칙, 3절, 시험 ‘김 없는 시나리오 구동’·‘(가) 설정 동일’, 변형 10, 파일 목록, 지켜야 할 것 |
| P2 | 판매 거래처 분리 문장이 맞는 자료에서 실패 | 반영. 옛 rule_set은 id로, 새 rule_set끼리는 허용 | 6절 2, 변형 4 |
| P3 | ‘상속’ 비교 칸 이름(`marketRules`) 오류 | 반영. 뺄 칸 목록과 남길 칸을 적음 | 시험 ‘상속’ |
| P4 | 검사기 고정 수 | 반영. 8→9, 6→7, 8→10만 | 6절, 파일 목록 |
| P5 | 0064 후속 ‘공유 실행 예외는 it 안’ 누락 | 반영. lazy, 0064 최상위 규칙 미적용, timeout. claims bp·`partial_bp` 좁히기는 범위 밖 | 시험 머리, 결과 보고 |
| P6 | rule_set·정적 견적 복사 판별력 없음 | 반영. 검사기 ‘복사 동일성’ ①~③과 반례 | 2·4·6절, 변형 8·9 |
| P7 | 실험 시나리오 판별 기준 없음 | 반영. 검사기 상수(TS와 같은 값 주석) | 6절 |
| P8 | 새 검사 둘째는 기존 검사와 겹침 | 반영. 새 검사에서 빼고 반례로 확인만 | 6절 |
| P9 | 출처 표지 두 문장 충돌 | 반영. 짝 항목과 같은 ID | 1·4절 |
| P10 | 시나리오 필수 칸 | 반영 | 4절 표 |
| P11 | 묶음 생성·`dutyFor` 인수 미정 | 반영. 0064 (라) 꼴 문장 | 시험 머리, ‘위험 변환’ |
| P12 | ‘거래처’ 시험이 늘 참 | 반영. 등급 같음·다름을 나눠 적음 | 시험 ‘거래처’, 변형 11 |
| P13 | 변형 개수 불일치 | 반영. ‘모든 행’으로 | 완료 조건 3 |
| P14 | 순마진을 m₀이라 부름 | 반영. m₀ 값을 따로 적음 | 2절 |
| C1 | FOCUS 기준값(자기 비교) | 반영(H18-3). 1일 정적 매입 견적의 `goodId` | 시험 ‘품목’ |
| 기각 6 | ambiguity-10·13·14·15·16·17 | 반영하지 않음. 15의 내용은 P5 ‘범위 밖’ 한 줄로 이미 들어감 | — |
| 권고 | 모든 배열 끝에 더함(ambiguity) | 반영 | 원칙 |

## 허브에 남기는 메모(초안 3, 세션 A)

- **생성기 난수 순서와 D의 공통 난수.** 사전 확인 tests 관점 메모대로, `generateBatch`의 난수 소비가 품목 수 G에 따라 밀려 같은 시드에서도 (나)·(다)의 주선 틀 선택이 달라질 수 있다. 그러면 D((나)·(다) 비교)에 품목 폭과 무관한 주선 묶음 차이가 섞인다. 0065는 생성기를 고치지 않으므로 이번 범위가 아니다. 다만 D를 시드 짝 차이로 읽을지, 시드 평균의 차이로만 읽을지는 TASK-0066(실행기)·판정표 해석에서 정해야 한다. 0066 초안 0의 ‘결과 표 ⑨’에 이 주의를 한 줄 더할지 허브가 정해 달라.

### 허브 좁힌 검증 처리표(개정 3a)

초안 3(`ae04db8`)의 고친 문장을 세 렌즈(시제품 실현성·정합·변형 판별력)로 확인하고 major는 반박 검증을 거쳤다. 세션 A의 H18-1 정정(두 시험 고침)은 꼭 필요하고 충분하다고 실측됐다(거르기만: 2개 실패·1,463 통과, 두 시험 고침 뒤 시제품 포함 1,473 통과). 허브는 이 정정을 H18-5로 기록했다.

| # | 발견 | 판정 | 고친 곳 |
|---|---|---|---|
| V1 | 완료 조건의 `python3 -m unittest tools/test_validate_data.py`가 ModuleNotFoundError | 확인(major) | `python3 tools/test_validate_data.py`(review_checks와 같은 꼴) |
| V2 | ‘(가) 설정이 김 행 전과 같다’는 사실이 아님(collections·counterparties 행은 실림) | 확인(반박 검증에서 minor로 낮춤) | 머리·3절 문장을 tariff·claims 한정으로, 상태 전문은 같음 |
| V3 | H18-1과 지시서 3절의 우선순위 | 반박(major 아님). 문구 정리 | H18-5 기록, 기준 문서 줄에 명시 |
| V4 | 0063 시험 고침 자리(루프 하나로는 부족) | 확인(minor) | `used` 정의 한 줄과 세 자리 명시 |
| V5 | `rows`에 없는 `counterparty_id` 칸 | 확인(minor) | 새 검사 2·3② 문장 |
| V6 | 무명령 구동은 72일 실패로 끝남, (다) 사건 일정 단언 없음, timeout | 확인(minor) | ‘김 없는 시나리오 구동’ 문장·tariffEvents 단언·it 분할·180000ms |
| V7 | 변형 10의 잡는 단언 | 확인(minor) | 변형 표 10행 |
| V8 | 거래처 이름 ‘상해’/‘상하이’ | 확인(minor) | `name_ko`는 ‘상하이’ |

- 세션 A ‘허브에 남기는 메모’(생성기 난수 소비가 G에 따라 밀려 D에 품목 폭과 무관한 차이가 섞임): H18-6으로 정했다. 0065 범위 밖이다.

