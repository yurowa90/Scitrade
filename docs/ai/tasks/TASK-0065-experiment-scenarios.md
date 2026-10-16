# TASK-0065 경로 2 품목안 실험 시나리오: (나) 화장품 1품목, (다) 화장품 + 조미김 (초안 1)

- **지위: 초안 1(세션 A, 2026-10-16). 초안 0의 허브 확인 네 건은 허브가 답했다(아래 ‘허브 확인’). 허브 사전 확인(TASK-0064 병합 뒤)과 `<BASE>` 치환 전에는 실행하지 않는다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0064 병합(위험 프로필의 다섯 묶음과 검사기가 있어야 한다). `<BASE>`는 허브가 치환할 때 적는다.
- 기준 문서: **판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`(승인 `9ce98fe`) 1.1·3.3·5.2·6.2**와 **설계 `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 6절(시작 프로필, 동결)**. 둘은 동결돼 있으므로 고치지 않는다. 이 지시서와 다르면 둘이 우선이고, 다르게 해야 할 이유가 생기면 멈추고 보고한다.
- 목적: 판정표의 품목 변형 (나)·(다)를 잴 자료를 만든다. 이 작업은 **측정하지 않는다.**
- 이 작업의 병합 커밋은 판정표 ‘측정 전 고정 기록’에 들어간다. 허브는 병합 뒤 `data/market_rules.json`의 sha256과 위험 프로필 대조(판정표 고정 기록의 대조 규칙, H15 F8) 결과를 적는다.

## 원칙

- **새 자료만 더한다.** 옛 시나리오·옛 rule_set(`M2A5_PYEONGTAEK`)·옛 견적·옛 거래처는 한 글자도 바꾸지 않는다. TASK-0062a 골든(rules-2 105회, 규칙 1 400회)은 바이트 그대로여야 한다.
- **측정 금지(판정표 0절 1, H14-8).** 새 시나리오로 `d03`·`runSuite`·`run.mjs`를 실행하지 않는다. 허용하는 것은 생성기 견적 수 확인과 단위 시험뿐이다.
- **시험 시드.** rules-3 시나리오나 위험 층을 쓰는 시험·확인 실행은 시드 2001 이상만 쓴다. 기준 시드(1001~1020)·표본 밖·v2 시드는 측정에서만 쓴다. 이 작업의 새 시나리오는 R0(rules-2)이지만 측정 대상이므로, 새 시나리오를 쓰는 시험도 같은 규칙을 따른다.
- **실명 기업·브랜드를 쓰지 않는다.** 품목·거래처 이름은 일반명이다(‘하이퐁 김 고객’ 등).
- 엔진 동작은 바꾸지 않는다. 고치는 엔진 코드는 시나리오 로더의 목록과 타입뿐이다.
- 시험에 자료 ID·조정 상수를 쓰지 않는다(TASK-0027 R1). 새 시나리오 ID는 `EXPERIMENT_SCENARIO_IDS`에서, 품목·거래처는 시나리오 설정에서 읽는다.

## 구현 지시

### 1. 품목(`data/goods.json`)

- 새 품목 `SEASONED_LAVER`(이름 ‘조미김’) 하나를 더한다. 마른김은 더하지 않는다(판정표 1.1·3.3: (다)는 조미김 한 형태, G=2).
  - `quantity_unit` `case`, `mass_kg_per_unit` 3, `volume_m3_per_unit` 0.02, `storage_class` `dry`, `quality_model_status`는 화장품과 같은 값.
  - **HS 상태.** 세션 C가 한국 10자리 `2008.99-5010`을 관세청 원자료로 확인했다(`docs/ai/design/research/ROUTE-4A-10B1-SOURCES.md`). 그러나 `data/sources.json`에 그 원자료 항목이 없고 HS 판본이 적혀 있지 않다. 검사기의 `VERIFIED` 조건(코드·판본·출처 셋 모두)을 채울 수 없으므로 **`hs_mapping_status` `NOT_VERIFIED`, `hs_code`·`hs_edition` null**로 둔다. 확인 상태를 올리는 일은 경로 7에서 한다(결과 보고 ‘범위 밖 발견’에 적는다).
  - 한 줄 이유(지시서와 결과 보고에 같이 적는다): ‘HSK 2008.99-5010은 세션 C 확인(`ROUTE-4A-10B1-SOURCES`), 검사기 출처 조건 때문에 NOT_VERIFIED.’ `VERIFIED`로 올리는 일은 경로 7(품목 지식 카드)에서 세션 C와 함께 한다.
  - `source_refs`는 기존 설계 출처 ID를 쓴다(새 출처를 만들지 않는다).
- **가상값·기준일 표지(기존 방식, 허브 조건).** 새 칸이나 새 출처를 만들지 않는다. 표지는 지금 자료와 같은 방식으로 단다: 파일의 `data_basis` `DESIGN`과 `numeric_values_status` 문장(‘합성 개발용 값’), 항목의 `source_refs`가 가리키는 설계 출처(기준일 = 그 출처의 `checked_on`). 새 항목은 같은 파일의 옛 항목이 쓰는 설계 출처 ID를 쓴다(`goods`·`market_offers`는 `DESIGN-V03`, `market_rules`는 `DESIGN-V04`). 결과 보고에 항목마다 쓴 출처 ID와 그 기준일을 적는다.

### 2. 새 rule_set 둘(`data/market_rules.json`)

`M2A5_PYEONGTAEK`를 복사해 만든다. **`rule_sets` 배열 끝에 더한다**(기존 검사기 시험 고정 자료가 `rule_sets[0]`을 옛 rule_set으로 읽는다. 0062 사전 확인 P3과 같은 꼴). 아래에 적은 것 말고는 모든 값이 `M2A5_PYEONGTAEK`와 같다(`publish`, `regional_pct`, `counterparty_pct`, `forwarding` 전체, `drop_if_beyond_campaign`, `trade`의 `buy_city_id`·`sell_city_ids`·`max_lots_choices`·`sell_deadline_offset_days`·`payment_offset_days`).

| 칸 | `M2A5_PYEONGTAEK_COS`((나)) | `M2A5_PYEONGTAEK_COS_LAVER`((다)) |
|---|---|---|
| `index.goods` | `[COSMETICS]` | `[COSMETICS, SEASONED_LAVER]` |
| `trade.goods` | 화장품 한 줄 | 화장품, 조미김 두 줄(이 순서) |
| `rows` | 화장품 BUY·SELL 셋(값은 옛 rule_set과 같음) | 화장품 셋 + 조미김 셋 |

- **화장품 줄**: `good_id` `COSMETICS`, `id_tag` `COS`, `base_lot` 50, `buy_counterparty_id` `SUPPLIER_DEMO_COSMETICS`(옛 공급자 그대로). 판매 거래처는 새 ID다: 하이퐁 `CUSTOMER_HAI_COSMETICS_NEW`, 상해 `CUSTOMER_SHA_COSMETICS_NEW`(설계 6절 표, H14-9). 두 rule_set 모두에 `COSMETICS`가 반드시 있다(판정표 6.2 `FOCUS`, H14-1).
- **조미김 줄**: `good_id` `SEASONED_LAVER`, `id_tag` `LAV`, `base_lot` 100, `buy_counterparty_id` `SUPPLIER_DEMO_LAVER`(새 공급자), 판매 거래처 하이퐁 `CUSTOMER_HAI_LAVER`, 상해 `CUSTOMER_SHA_LAVER`.
- **기준가(USD, 시작 판매 마진 k = 0)**

  | 행 | 화장품 | 조미김 |
  |---|---:|---:|
  | 평택 BUY | 40.00 | 20.00 |
  | 하이퐁 SELL | 51.70 | 25.60 |
  | 상해 SELL | 53.00 | 26.60 |

  - 화장품은 옛 rule_set 값 그대로다.
  - 조미김은 1묶음(100개) 금액을 화장품 1묶음(50개)과 같은 2,000 USD로 맞췄다. 그래서 운임·관세의 비중이 두 품목에서 같다. 판매가는 ‘김은 상해 중심’을 하이퐁 쪽 기준가를 낮게 두는 것으로만 표현한다(판정표 1.1). 1묶음 기준 마진은 하이퐁 260 USD(10.2%), 상해 380 USD(14.3%)로, 화장품의 11.0%·14.0%와 비슷한 띠다(운임 200·180, 관세 5% 가정, 판정표 5.2 판매 마진 손잡이의 m₀).
  - **이 숫자는 허브가 승인 때 바꿀 수 있다.** 병합 커밋에서 고정되고 해시로 잠긴다(판정표 5.2 판매 마진 행, H10-5).
- **거래처(`counterparties`)에 다섯을 더한다**: `CUSTOMER_HAI_COSMETICS_NEW`(하이퐁 화장품 신규 고객), `CUSTOMER_SHA_COSMETICS_NEW`(상해 화장품 신규 고객), `CUSTOMER_HAI_LAVER`(하이퐁 김 고객), `CUSTOMER_SHA_LAVER`(상해 김 고객), `SUPPLIER_DEMO_LAVER`(김 공급자).

### 3. 위험 프로필에 더할 값(설계 6절 ‘TASK-0065가 더할 값’ 그대로)

- `tariff.base`: `SEASONED_LAVER`의 CN·VN 행, `rate_bp` 500.
- `claims.by_good`: `SEASONED_LAVER`, 등급 LOW, `p_claim_bp` 500.
- `collections.by_counterparty`: 화장품 새 판매처 둘은 B, 김 판매처 둘은 C.
- 다른 값은 바꾸지 않는다. 설계 6절 JSON에 이 행들을 더한 것이 대조의 기대 프로필이다(판정표 고정 기록의 대조 규칙). 배열 안 순서는 대조에서 보지 않는다.

### 4. 정적 견적과 시나리오(`data/market_offers.json`, `data/scenarios.json`)

- **정적 매입·판매 견적(1~3일).** 옛 운영 시나리오는 의류·화장품 정적 견적 쌍을 이어받는다. 새 시나리오는 **화장품 쌍 하나만** 쓴다. (나)·(다)의 1~3일이 같아야 D(품목 폭 비교)가 묶음 견적의 차이만 보기 때문이다.
  - 새 견적 `OFFER_SELL_02_NEW`: `OFFER_SELL_02`와 모든 값이 같고 `counterparty_id`만 `CUSTOMER_SHA_COSMETICS_NEW`다.
  - 매입은 옛 `OFFER_BUY_02`를 그대로 쓴다. 주선 정적 견적 `OFFER_FWD_01`·`OFFER_FWD_02`도 그대로 쓴다.
- **시나리오 둘**

  | 칸 | `SCENARIO_M2_OPS_COSMETICS`((나)) | `SCENARIO_M2_OPS_COS_LAVER`((다)) |
  |---|---|---|
  | `base_scenario_id` | `SCENARIO_M2_OPERATIONS` | `SCENARIO_M2_OPERATIONS` |
  | `offer_ids` | `OFFER_BUY_02`, `OFFER_SELL_02_NEW`, `OFFER_FWD_01`, `OFFER_FWD_02` | 같음 |
  | `operations` | `SCENARIO_M2_OPERATIONS`의 `operations` 전체를 복사하고 `market_rules_ref`만 `market_rules.json#M2A5_PYEONGTAEK_COS`로 | 같게, `…#M2A5_PYEONGTAEK_COS_LAVER` |
  | `title_ko`·`scope_note` | ‘실험: 화장품 1품목’ 등 실험임을 밝힌 문장 | ‘실험: 화장품 + 조미김’ |

  - 상속은 맨 위 칸을 통째로 덮는다(`resolveScenarioRecord`). 그래서 `operations`는 전체를 복사해야 한다. 복사한 값이 `market_rules_ref` 말고 옛 값과 같은지 시험으로 확인한다.
  - `rules_version`은 상속한 `M2a-rules-2` 그대로다. R1~R3은 실행기가 `withRiskLevel`로 만든다(판정표 1.2). rules-3 시나리오 레코드(로더 분기·`operations.risk` 스키마)는 이번에 넣지 않는다. 학생에게 낼 때(경로 11 이후) 따로 한다.

### 5. 실험 목록(`src/content/scenario.ts`)

- `EXPERIMENT_SCENARIO_IDS = ['SCENARIO_M2_OPS_COSMETICS', 'SCENARIO_M2_OPS_COS_LAVER'] as const`를 둔다(H2).
- `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`·`SCENARIO_IDS`에는 넣지 않는다. 그래서 학생의 시나리오 고르기(`main.ts:409`)와 D03 기본 목록에 나타나지 않는다.
- `loadScenario`가 실험 ID도 받도록 타입만 넓힌다. 읽는 방식은 바꾸지 않는다.

### 6. 검사기(`tools/validate_data.py`)

- 기존 위험 프로필 양방향 검사(설계 6절)가 새 rule_set에도 돈다. 운영 rule_set의 정의는 ‘`rules_version`이 M2a-rules-2 이상인 시나리오가 `operations.market_rules_ref`로 쓰는 rule_set’이고, 새 시나리오는 실험 목록에 있어도 `scenarios.json`에 있으므로 대상이다.
- 새 검사 셋을 더한다.
  - 실험 시나리오의 `operations`는 `market_rules_ref`만 빼고 base 시나리오와 같다.
  - 새 rule_set의 `trade.goods` 품목은 모두 `index.goods`와 `rows`(BUY 하나, 판매 도시마다 SELL 하나)에 있다.
  - 직접 무역 판매 거래처 ID는 rule_set 사이에 겹치지 않는다(옛 거래처를 새 rule_set이 다시 쓰면 실패. H14-9의 ‘새 거래처 ID’).

## 시험(새 파일 `src/engine/m2a5-experiments.test.ts`)

| 시험 | 확인할 것 |
|---|---|
| 목록 | `EXPERIMENT_SCENARIO_IDS`의 두 ID가 `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`에 없고, `loadScenario`로 읽힌다 |
| 상속 | 두 시나리오의 설정이 base 운영 시나리오와 `operations.marketRules`(rule_set)·정적 견적 말고는 같다 |
| 품목 | (나)의 직접 무역 품목 집합 = {`COSMETICS`}, (다) = {`COSMETICS`, 조미김}. 두 집합 모두 `COSMETICS`를 담는다 |
| 견적 수(J4a) | 생성기로 캠페인의 모든 공개일 묶음을 만들어(시드 2001~2020, `simulate` 없이), 묶음당 견적 수의 최댓값이 (나) 2G+6 = 8, (다) 10 이하다. G는 rule_set의 `trade.goods` 길이에서 읽는다 |
| 거래처 | 새 판매 거래처가 위험 프로필 등급표에 있고, 그 등급이 (나)·(다) 화장품은 같은 등급, (다) 김은 다른 등급이다(값은 프로필에서 읽음) |
| 위험 변환 | `withRiskLevel(새 시나리오, R1~R3, riskProfiles()[0])`이 예외 없이 설정을 만든다(프로필 누락 예외가 나지 않는다) |
| 1일 시작 | 시드 2001로 `createGame` 뒤 1일을 열고 마감할 수 있다. 정적 견적이 화장품 쌍과 주선 둘이다 |

- 시험은 엔진 공개 함수(`createGame`·`openDay`·`commitDay`, 생성기·읽기 함수)만 쓴다. `src/engine/sim/**`의 `simulate`·`runSuite`·`runD03`는 부르지 않는다(판정표 0절 1 잠금, 0062 사전 확인 P22·Q12와 같은 규칙).

- 검사기 반례 시험(`tools/test_validate_data.py`): 새 검사 셋마다 반례 하나(operations 다른 값, rows 빠짐, 거래처 재사용).

## 변형 시험

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 실험 ID를 `OPERATIONS_SCENARIO_IDS`에도 넣음 | 목록 |
| 2 | (나) rule_set에서 화장품을 빼고 의류로 바꿈 | 품목 |
| 3 | 새 시나리오의 `operations`에서 창고 값 하나를 바꿈 | 상속, 검사기 |
| 4 | 김 판매처에 옛 거래처 ID를 씀 | 검사기(거래처 재사용) |
| 5 | (다)의 `forwarding.draws`를 늘림 | 견적 수(J4a) |
| 6 | 위험 프로필에서 김 클레임 행을 뺌 | 위험 변환 |

## 고칠 수 있는 파일

- `data/goods.json`, `data/market_rules.json`, `data/market_offers.json`, `data/scenarios.json`(모두 **추가만**. 옛 항목은 바꾸지 않는다)
- `src/content/scenario.ts`(실험 목록과 `loadScenario` 타입만)
- `tools/validate_data.py`(새 검사 셋), `tools/test_validate_data.py`(반례 시험 추가만)
- 새 `src/engine/m2a5-experiments.test.ts`
- `docs/ai/tasks/results/TASK-0065.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/engine/*.ts`, `src/engine/sim/**`, `src/ui/**`, `schemas/**`(새 칸이 필요하면 멈추고 보고), 다른 `data/**`
- 골든 파일·검사기: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`. `--write`를 쓰지 않는다.
- 판정표, 설계 6절

## 지켜야 할 것

- **골든 진단 절차(허브 통일 문장).** 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고, 0이 아니면 고치지 말고 멈춘다. `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다. 이 작업은 새 자료만 더하므로 골든은 깨지지 않아야 한다. 깨지면 원인(옛 항목을 건드렸는지, 생성기가 자료 전체에 기대는지)을 적고 멈춘다.
- 측정 금지와 시험 시드(원칙).
- **첫 화면 크기**(0062 사전 확인 P10과 같은 방법). BASE와 작업 뒤 각각 `npm run build` 다음 `node tools/check_bundle_size.mjs dist`의 첫 화면 줄을 적는다. 이 작업은 자료만 더하므로 증가분은 자료 청크 몫이다. 자료 몫과 코드 몫을 따로 적고, **코드 몫이 +2,500 B를 넘으면 멈추고 보고한다.** 자료 몫은 크기와 함께 보고만 한다.
- `review_checks` 통과.

## 완료 조건

1. 지시 1~6 반영, 시험 표의 시험 모두 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과(골든 검사 포함).
3. 변형 6개가 모두 잡힌다(또는 원래 코드와 같은 이유를 적었다).
4. `git diff <BASE> -- data/`가 추가 줄만 담는다(지운 줄·바꾼 줄 0). 결과 보고에 `git diff --stat`과 지운 줄 수 0을 적는다.

## 결과 보고에 넣을 것

- 더한 자료 항목 목록(품목·rule_set·거래처·견적·시나리오·프로필 행)
- 견적 수 시험의 묶음당 최댓값((나)·(다))
- 병합 뒤 허브가 고정 기록에 적을 값의 재료: `data/market_rules.json` sha256, 위험 프로필 JSON(설계 6절 + 더한 값)
- 범위 밖 발견: 조미김 HS 상태(`NOT_VERIFIED`인 이유), 학생에게 낼 때 필요한 rules-3 시나리오 레코드
- 질문

## 허브 확인(초안 0, 2026-10-16 허브 답)

- 네 건 모두 받아들여졌다. 조미김 가격은 제안값 그대로이고, 병합과 허브 고정 기록(sha256)으로 동결된다. 허브가 사용자에게 보고하며, 병합 전까지는 바꿀 수 있다. 조건은 둘이다: 품목 자료에 기존 방식의 가상값·기준일 표지를 단다(1절), HS 이유 한 줄을 적는다(1절). 아래는 초안 0의 질문 원문이다.


- **조미김 가격.** 1묶음 100개 × 20 USD, 판매 하이퐁 25.60·상해 26.60으로 제안했다. 화장품과 마진 띠를 맞추고 ‘상해 중심’은 하이퐁을 낮게 두는 것으로만 표현했다. 판정표 5.2의 손잡이는 k(공통 폭)뿐이므로, 이 시작값이 (다)의 J7·D에 주는 효과는 측정 전에 정해진다. 사용자 결정이 필요하면 지금 올려야 한다.
- **조미김 HS 상태.** 검사기 규칙상 `VERIFIED`에는 출처 항목과 HS 판본이 필요하다. 세션 C 자료는 판본을 적지 않았고 `sources.json`에 항목이 없어 `NOT_VERIFIED`로 두었다. 올리려면 세션 C가 출처 항목을 만들어야 한다.
- **정적 견적.** (나)·(다) 모두 화장품 쌍 하나만 쓰게 했다(D가 묶음 견적의 차이만 보게). 옛 (가)는 의류·화장품 쌍 그대로다.
- **R0은 rules-2 레코드.** 실험 시나리오는 rules-2 레코드로 두고 R1~R3은 `withRiskLevel`로 만든다. DESIGN 6절의 ‘rules-3 시나리오 레코드의 로더 분기·스키마는 TASK-0065(또는 그 뒤)’ 가운데 ‘그 뒤’를 골랐다. 측정에는 필요 없고, 학생에게 낼 때 필요하기 때문이다.
- **새 매입 공급자.** 김 공급자 `SUPPLIER_DEMO_LAVER`를 새로 두었다. 화장품 공급자는 옛 ID를 그대로 쓴다(H14-9는 판매 거래처만 정했다).
