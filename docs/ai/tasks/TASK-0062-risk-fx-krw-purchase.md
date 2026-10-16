# TASK-0062 직접 무역 위험 ①: rules-2 골든, 원화 매입·달러 판매, 참고 환율 경로 (초안, 개정 1)

- **지위: 초안(세션 A, 2026-10-14, 개정 1 2026-10-16). 허브 승인과 `<BASE>` 치환 전에는 실행하지 않는다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: 허브 승인 커밋(판정표·설계·이 지시서, 이하 `<BASE>`). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 2·3·6·7·8·9절. **먼저 읽는다.** 이 지시서와 설계가 다르면 이 지시서가 우선이다.
- 판정 기준: `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`. 이 작업은 측정하지 않는다. 측정은 경로 5다.
- 목적: 직접 무역 계약이 수락 뒤 환율 때문에 원화 기준으로 손실이 날 수 있게 한다. 학습목표 O1(환율 판단)의 엔진 바탕이다.
- 줄 번호는 개발 브랜치 `16e090c` 기준이다. 함수 이름으로 찾고, 달라진 줄을 결과 보고에 적는다.

## 원칙

- 새 규칙 판본 `M2a-rules-3`에서만 켠다. rules-1·rules-2의 동작·출력·저장은 바이트로 같다.
- 상태에 새 칸을 두지 않는다. 환율은 `(seed, 흐름 이름, 주차)`의 순수 함수다. **상태 칸을 꼭 더해야 하면 더하지 말고 멈춰 보고한다**(설계 8절).
- 두 통화를 더한 값을 원장·저장·결산(`contractReport` 포함)·실패 기록에 만들지 않는다. 미리보기의 `referenceEstimate`와 `contractRiskReport`의 원화 환산은 허브 결정 H0의 참고 환산 예외다(저장하지 않음). 칸 주석에 ‘참고 환율 환산, 추정’임을 밝힌다.
- 화면(`src/ui/**`)은 고치지 않는다. 새 규칙 시나리오는 이번에 화면에 나오지 않는다.

## 0단계: rules-2 골든 (엔진을 고치기 전에, 허브 결정 H4)

1. `<BASE>`에서 운영 시나리오 기준 회사 출력을 만든다:
   `node src/engine/sim/run.mjs d03 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK --seeds 20 --workers 4 --out <저장소 밖 경로>/rules2-d03.json`
2. 출력의 `runs` 배열을 정렬된 키로 직렬화한 sha256을 `tests/golden/rules2-d03.sha256`에 둔다(`meta`는 판본 표시 때문에 빼고 해시한다). 해시를 만드는 스크립트는 새 `tools/check_rules2_golden.mjs`다. `--write`로 만들고, 인수 없이 부르면 다시 돌려 비교해 다르면 종료 코드 1이다.
3. `tools/ai/review_checks.sh`에 `run node tools/check_rules2_golden.mjs` 한 줄을 더한다(위치: `check_bundle_size` 뒤). 걸린 시간을 결과 보고에 적는다.
4. **이 단계를 엔진 변경보다 먼저 커밋하고, 그 커밋에서 `review_checks.sh --check <BASE>`가 통과해야 한다.** 통과하지 않으면 멈추고 보고한다.
5. 400회 `run` 비교(rules-1)는 따로다. 작업 전 `<BASE>`에서 `node src/engine/sim/run.mjs run --out <저장소 밖>/run-before.json`을 저장하고, 작업 뒤 같은 명령의 출력과 `cmp` 0을 확인한다. 둘 다 결과 보고에 sha256을 적는다.

## 구현 지시

### 1. 규칙 판본과 자료

- `SUPPORTED_RULES_VERSIONS`와 타입에 `M2a-rules-3`을 더한다. 시나리오 로더의 rules-3 분기(`scenario.ts:264·268-270`)와 `operations.risk` 읽기는 **이번에 넣지 않는다**. rules-3 시나리오 레코드를 넣는 TASK-0065에서 스키마와 함께 넣는다(검토 38번). 이번에는 타입만 둔다.
- `data/market_rules.json`에 `risk_profiles` 배열과 프로필 하나를 더한다(설계 6절의 꼴). 이번에 엔진이 읽는 것은 `fx`뿐이다. 나머지 묶음은 자료 꼴과 검사만 넣는다.
- 스키마(`schemas/` 해당 파일)와 `tools/validate_data.py`에 설계 6절의 검사를 넣는다.
  - 반례 시험은 기존 `MarketRulesTest`와 같은 방식으로 만든다. 자료 사본에서 값을 바꾸고 `check_market_rules`만 부른 뒤, 그 검사의 문장 자체를 단언한다(스키마 `shape`는 부르지 않는다). 반례: 등급 확률 합 ≠ 10000, 손상 두 층 가중치 합 ≠ 10000, 최소 > 최대, 품목 자료에 없는 품목, 시장 자료에 없는 거래처, `start_krw_per_usd` ≠ `fx_krw_per_usd`.

### 2. 참고 환율 경로와 환전

- 새 파일 `src/engine/risk.ts`에 `drawAt(seed, stream, index)`와 `referenceRate(config, seed, day): number`(원/달러, 정수)를 둔다. 설계 3.2의 식 그대로다.
  - 주차는 시세 공개일 기준이다(`publish.first_day`, `interval_days`). 공개일 사이에는 값이 같다. 마지막 공개일 뒤는 마지막 값.
  - `drawUniform`을 커서 상태 없이 부르는 순수 함수다(흐름 `FX-REF`, 번호 = 주차). **`state.rng`의 커서를 바꾸지 않는다.**
  - 위험 설정에 `FX` 층이 없으면 `start_krw_per_usd`를 늘 돌려준다.
- `exchangeAmounts`(`operations.ts:150`)에 `(seed, day)` 인수를 더한다. 호출처 `operations.ts:168`은 `s.rng.seed`, `s.day`를, `readers.ts:97`(`exchangePreview`)은 오늘을 넘긴다. rules-3이면 기준 환율 자리에 그날 참고 환율을 쓰고, 차감은 지금 규칙 그대로다. rules-2는 인수를 쓰지 않는다. 로그 문장의 ‘게임용 고정 환율’은 rules-3에서 ‘오늘 참고 환율’로 쓴다.
- 고정 환율로 묶음 금액을 세는 함수들도 rules-3에서는 그날 환전 환율을 쓴다(설계 3.2, 검토 32번): `usdLotKrw`(`operations.ts:225-226`), `paymentDefaultStatus`의 `lotsToSurvive`·`lotsToClearAll`·`krwToUsdRequiredMinor`(`:238-253`), `wageUsdLotsPerWeek`(`readers.ts:202`). 상태(seed, day)를 받게 하고, rules-2 분기는 바이트 그대로다.

### 3. 원화 매입과 혼합 통화 계약

설계 3.3 그대로다. 요점만 적는다.

- **매입 통화 유도.** `rowCurrency(config, side)`(`risk.ts`)로 유도한다. 시세 행 타입(`types.ts:535`)과 `MarketBatch.rows`(`types.ts:560`)에 통화 칸을 두지 않는다. 생성기(`market.ts`)는 rules-3 원화 매입이면 매입 견적의 통화를 KRW, 단가를 원 단위로 만든다. `marketTable`(`market.ts:100`)은 매입 행 통화를 KRW로 낸다.
- **수락**(`acceptTrade`, `engine.ts:308`): 매입·판매 통화가 달라도 rules-3이면 받는다. 계약 `currency`는 판매 통화다. 매입 통화는 견적에서 읽는다. 계약·화물·청구서에 칸을 더하지 않는다. `scenario.ts:268-270`의 단일 통화 거부는 rules-3 레코드가 생기는 TASK-0065에서 고친다. 이번에는 `withRiskLevel`이 로더를 거치지 않고 설정을 만든다.
- **자금 검사**: 매입은 KRW 가용, 운임·관세 예상은 USD 가용으로 따로 본다. 부족한 통화마다 거절 문장을 따로 낸다.
- **분기 조건**: 아래 운임·관세·매출원가·실패 기록의 분기는 모두 ‘매입 통화 ≠ 판매 통화’다.
- **운임·관세**: 혼합 통화 계약이면 화물 장부가에 더하지 않고, 같은 계약 ID의 USD 재고 분개로만 쌓는다.
- **관세 과세가격**: `dutyFor(config, seed, goodId, destinationCityId, day, purchaseMinor, purchaseCurrency, rateDay)`를 새로 두고 다섯 호출처(`catalog.ts:75`, `engine.ts:319·1019`, `reports.ts:99`, `reservations.ts:33`, `operations.ts:273`)가 모두 이 함수를 부르게 한다.
  - 매입 통화가 KRW이면 과세가격(USD 센트) = 원화 매입액 ÷ `rateDay` 참고 환율(half-up), 관세 = 과세가격 × 그날 세율이다. 이번에는 세율이 시나리오 고정 세율이고 `goodId`·도착지는 쓰지 않는다(0063이 몸통만 바꾼다).
  - `rateDay`: 미리보기·수락 자금 검사·자금 예약은 오늘, 계약(도착 처리·실패 기록)은 `acceptedDay`.
  - 매입이 USD이면 지금 `dutyEstimate` 그대로다.
- **인도 때 매출원가**: 혼합 통화 계약이면 `COGS-{계약}-KRW`와 `COGS-{계약}-USD` 두 분개를 낸다. rules-2 분개 ID·금액은 그대로다.
- **출항 전 취소·편 놓침**: 지금 규칙의 금액을 통화별로 나눠 적용한다(매입 원화는 돌려받지 못함, 운임 환급·취소비는 USD).
- **지급 불이행 실패 기록**(검토 31·37번):
  - `operations.ts:272-274`의 USD 약정액은 혼합 통화 계약이면 USD 몫만이다(예약 운임 + `dutyFor` 관세, 수락 자금 검사의 USD 필요 금액과 같은 함수). 원화 매입액을 더하지 않는다.
  - `operations.ts:284-285`의 원화 선택 지출 접두어에 `PURCHASE-`를 더한다.
  - 원화 매입 약정을 따로 기록하려면 새 상태 칸이 필요하다. 필요해지면 멈추고 보고한다.
  - 두 곳 모두 rules-2 값은 바이트로 같다.
- **계약 보고서**(`contractReport`, `reports.ts:21-33`): 혼합 통화 계약은 통화별로 낸다. 실행기 지표(`src/engine/sim/**`)는 이번에 고치지 않는다.

### 4. 견적 미리보기와 계약 손익 읽기 함수

- **미리보기**(설계 3.4, 허브 결정 H0):
  - `preview`(`reports.ts:85`) 맨 끝에 선택 인수 `opts?: { goodId?: string; purchaseCurrency?: Currency }`. 인수가 없으면 rules-2 결과가 바이트로 같다. `tradePreview`·`quotePreview`는 둘을 넘긴다.
  - 참고 환율의 시드: `preview`는 `config.seed`, `quotePreview`·`contractRiskReport`는 `s.rng.seed`. 같다는 전제를 주석에 적고 시험에서 단언한다.
  - 기존 칸은 통화별 그대로다: `purchase`는 원, `freight`·`duty`·`sale`은 USD. rules-3의 `cashNeed`는 USD 부분만, `contributionBeforePayroll`은 USD 줄만의 합이다. 둘 다 주석에 뜻을 적는다.
  - rules-3에서만 새 칸: `cashNeedByCurrency`, `referenceEstimate { rateKrwPerUsd, saleKrw, pnlKrw }`, `schedule[].currency`. rules-2에서는 이 칸들을 출력하지 않는다.
- **`contractRiskReport(state, config, contractId)`**(설계 3.4 표):
  - 직접 무역과 주선 계약 모두 받는다.
  - 이번에 채우는 단계: 0(기대)·1 `schedule`·2 `fx`·5 `late`·7 `cancel`·9 `open_valuation`·10 `residual`. 3 `tariff`·4 `surcharge`·6 `claim`·8 `collection`은 0이다.
  - 항등식: `realized − expected = 모든 칸의 합`, `residual = 0`. 원 단위 정수. 환산 반올림은 한 함수에서만 한다.
  - 열린 계약은 `open: true`, 남은 흐름을 캠페인 마지막 날 참고 환율로 평가하고, 고정 환율 평가값 `openFixedRateKrw`를 함께 낸다.
- 실행기 정책은 이번에 고치지 않는다(경로 5 변형 지시서).

### 5. 측정용 설정 변환

- `withRiskLevel(config, level, profile)`을 **새 `src/engine/risk.ts`에** 둔다(위치 고정). 이번에는 `R0`(그대로)과 `R1`(rules-3 + 원화 매입 + `FX`)만 만든다.
  - 시세 행의 매입 기준가: USD 기준가 × `start_krw_per_usd`를 원 단위 half-up으로 바꾼다.
  - **정적 매입 견적**(`config.offers`의 `supplier` 견적)도 같은 식으로 KRW로 바꾼다(검토 35번).
- 실험 시나리오 ID를 자료에 더하지 않는다.

### 6. 저장·불변식

- 저장 형식은 6 그대로다. `save-shape.ts`는 열거 값 추가만 한다(필요할 때).
- `operations-invariants.ts`:
  - 혼합 통화 계약은 매입 견적 KRW·판매 견적 USD·계약 통화 USD여야 한다. 다른 짝이면 불러오기를 거부한다(기존 `SaveError` 경로).
  - 환전 이체 검사(`:64`)는 rules-3이면 각 환전 기록 날짜의 `referenceRate`로 기준 원화액을 다시 계산해 검사한다. rules-2 식(`baseKrwPerUsd`)은 바이트 그대로다. **검사를 지우거나 느슨하게 하지 않는다.** 이 검사는 불러오기(`save.ts:135`)와 매일 마감(`engine.ts:872`)에서 모두 돈다.
- `invariants.ts`: 통화별 재고 장부 = 화물 장부가 합(`:62-67`)을 혼합 통화 계약의 USD 재고 분개 잔액까지 더해 맞춘다. rules-2 상태에서는 지금 식과 같은 값이다.
- `withRiskLevel`로 만든 상태의 저장은 시나리오 ID로 다시 열면 rules-2 설정으로 읽힌다(설계 8절 한계). 저장 왕복 시험은 설정을 직접 넘긴다. 이 한계를 고치려고 저장 형식이나 meta 칸을 바꾸지 않는다.

## 시험(새 파일 `src/engine/m2a5-risk-fx.test.ts`)

- 시험은 옛 운영 시나리오에 `withRiskLevel(…, 'R1', 자료의 첫 프로필)`을 걸어 만든다. **시험에 자료 ID·조정 상수를 쓰지 않는다**(TASK-0027 R1). 값이 필요하면 프로필에서 읽는다.
- 특정 사건(환율이 바뀐 날, 늦은 편 계약 등)이 필요하면 시드를 찾는다. 탐색은 시드 200개 안으로 제한하고, **찾았는지를 먼저 단언**한다.
- 직접 무역을 받으려면 원화가 있어야 한다. 시험 구동기가 명령(환전 → 수락)을 직접 넣는다. 실행기 정책은 쓰지 않는다.
- 옛 값 불변은 시험 안에서 `<BASE>`와 견줄 수 없다. 0단계 rules-2 골든, 400회 `run` 비교(rules-1), 기존 P0-M2A5 골든값 시험이 맡는다.

| 시험 | 확인할 것 |
|---|---|
| 새 흐름 없음 | rules-2 운영 시나리오를 시드 하나로 90일 돌린 `state.rng.cursors`에 새 흐름 이름이 없다 |
| 흐름 유일성 | 위험 순수 함수가 쓰는 (흐름 이름, 번호) 쌍이 서로 겹치지 않는다 |
| 환율 순수성 | 같은 (seed, day)는 같은 값. 공개일 사이 같은 값. 값이 늘 [min, max] 안. 이웃 주의 변화율이 `step_bp` 안. 시드 두 개가 어느 주에서 다르다(찾아서 확인) |
| 환율 상태 무관 | `referenceRate`를 여러 번 불러도 `state`가 같다. 저장·불러오기 뒤 같은 날 값이 같다 |
| 환전 | rules-3 환전의 원화 금액 = USD × (그날 참고 환율 ∓ 차감). 참고 환율이 1주차와 다른 주에 환전한 뒤 그날 마감 통과, 저장·불러오기 왕복(설정을 직접 넘김) 통과 |
| 묶음 계산 | 참고 환율이 시작값보다 낮은 날을 찾아, 그날 `lotsToSurvive` × 그날 묶음 원화 ≥ 생존에 필요한 원화 − 원화 현금 |
| 원화 매입 계약 | R1에서 직접 무역을 받으면 매입 분개는 KRW, 운임 분개는 USD, 인도 때 COGS가 통화별 두 분개. 통화별 원장 합이 0. 미리보기 `schedule`의 매입 줄은 `currency: 'KRW'`의 원 단위 |
| 정적 매입 견적 | R1 설정 안의 모든 `supplier` 견적이 KRW다 |
| 시세표·행 | R1 상태의 `marketTable`에서 매입 행 통화가 KRW, 판매 행이 USD. R1 상태 `batches[].rows`의 키 집합이 rules-2와 같다 |
| 자금 검사 | KRW가 모자라면 KRW 문장으로, USD가 모자라면 USD 문장으로 거절. `cashNeedByCurrency`가 두 기준과 같다 |
| 취소 | 혼합 통화 계약 출항 전 취소의 통화별 금액 |
| 관세 과세가격 | 다섯 호출처가 모두 `dutyFor`를 부르고, 같은 (매입액, 환율 기준일) 입력이면 같은 값을 낸다. 도착 분개(`DUTY-…`)의 관세 = 원화 매입액 ÷ **수락일** 참고 환율 × 세율(센트). 수락일과 도착일 사이에 환율이 바뀐 계약을 찾아, 도착 관세가 수락일 기준값과 같고 도착일 환율로 계산한 값과는 다름을 확인 |
| 실패 기록 | 혼합 계약을 수락한 날 원화 급여 미지급이 생겨 실패하는 시드를 찾아, 실패 기록의 계약 USD 약정액이 USD 몫과 같다. 실패 전 14일 안의 원화 매입이 원화 선택 지출에 들어간다 |
| 손익 읽기 | 끝난 계약마다 `residual = 0`(직접 무역·주선 모두). 환율이 수락일과 청구 결제일 사이에 바뀐 계약을 찾아 `components.fx ≠ 0`이고 부호가 환율 방향과 맞다(원화 강세면 음수). 늦은 편 계약의 `schedule`·`late`, 출항 전 취소 계약의 `cancel`, 캠페인 끝에 열린 계약의 `open_valuation`·`open: true` |
| 시드 일치 | rules-3 미리보기의 `config.seed`와 상태의 `s.rng.seed`가 같다 |
| 결정성 | 같은 시드·같은 명령 두 번이면 같은 상태 JSON |
| 저장 | R1 진행 상태 저장·불러오기 왕복이 같다(설정을 직접 넘김). 옛 저장 시험은 그대로 통과 |
| 불변식 | 혼합 통화 짝을 바꾼 저장 사본, 환전 원화액을 바꾼 저장 사본을 거부 |

## 변형 시험

결과 보고에 각 변형과 잡은 시험을 표로 적는다. **결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 적어 보고한다.**

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | rules-3 환전이 참고 환율 대신 고정 기준 환율(`fx.baseKrwPerUsd`)을 씀 | 환전 |
| 2 | rules-2 환전 로그 문장에도 ‘오늘 참고 환율’ 문구를 씀 | 기존 `m2a5-money.test.ts`의 문장 단언 |
| 3 | `referenceRate`가 `state.rng` 커서를 씀 | 환율 상태 무관, 새 흐름 없음 |
| 4 | 손익 읽기가 수금 줄도 수락일 환율로 바꿈 | 손익 읽기(fx ≠ 0) |
| 5 | 매출원가를 한 통화 분개 하나로 냄 | 원화 매입 계약 |
| 6 | 자금 검사를 한 통화로 합침 | 자금 검사 |
| 7 | 공개일이 아닌 날에도 환율이 바뀜 | 환율 순수성 |
| 8 | 과세가격에 도착일 환율을 씀 | 관세 과세가격 |
| 9 | 미리보기·자금 예약이 도착 예정일 참고 환율을 씀(미래 누설) | 관세 과세가격 |
| 10 | USD 약정에 원화 매입을 더함 | 실패 기록 |
| 11 | 환전 불변식이 rules-3에서도 `baseKrwPerUsd`를 씀 | 환전(마감·왕복) |
| 12 | `usdLotKrw`가 rules-3에서도 고정 환율을 씀 | 묶음 계산 |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `market.ts`, `operations.ts`, `readers.ts`, `reports.ts`, `catalog.ts`, `reservations.ts`, `types.ts`, `invariants.ts`, `operations-invariants.ts`, `save-shape.ts`(열거 값 추가만), 새 `src/engine/risk.ts`
- `src/content/scenario.ts`(`SUPPORTED_RULES_VERSIONS`·타입만)
- `data/market_rules.json`(`risk_profiles` 추가만), 해당 스키마, `tools/validate_data.py`(위험 프로필 검사만)와 그 시험
- 0단계: 새 `tools/check_rules2_golden.mjs`, 새 `tests/golden/rules2-d03.sha256`, `tools/ai/review_checks.sh`(한 줄 추가만)
- 새 `src/engine/m2a5-risk-fx.test.ts`
- `docs/ai/tasks/results/TASK-0062.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/ui/**`, `src/engine/sim/**`, `data/scenarios.json`, `data/goods.json`, 다른 `data/**`, `vite.config.ts`, `package*.json`, `index.html`
- 기존 시험의 단언

## 지켜야 할 것

- 0단계 rules-2 골든이 작업 뒤에도 같다. 400회 `run` 출력이 `<BASE>`와 `cmp` 0. P0-M2A5 골든값 불변. 옛 저장 시험 통과.
- 첫 화면 gzip 전후를 적는다. **+2,500 B를 넘으면 멈추고 보고한다.**
- `any`를 새로 쓰지 않는다. 돈은 정수 최소 단위다.

## 완료 조건

1. 0단계를 먼저 커밋했고, 그 커밋에서 `review_checks.sh --check <BASE>`가 통과했다.
2. 지시 1~6 반영, 시험 표의 시험 모두 통과.
3. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과.
4. 변형 12개가 모두 잡힌다(또는 원래 코드와 같은 이유를 적었다).
5. 바꾼 파일이 ‘고칠 수 있는 파일’ 안이다.

## 결과 보고에 넣을 것

- 0단계: 골든 해시, 걸린 시간, 0단계 커밋 해시
- 바꾼 곳(파일·함수)과 이유, rules-2와 rules-3 분기 목록
- 상태 칸을 더하지 않았다는 확인(또는 멈춘 이유)
- 시험 구동기로 만든 R1 계약 몇 건(정시·늦은 편·취소·열린 계약 각 1건 이상)의 `contractRiskReport` 표(기대·실현·칸별 값). **값을 고치지 않고 적기만 한다.** 90일 정책 실행은 경로 5 실행기 지시서에서 한다(지금 기준 정책은 원화 매입용 환전을 하지 않는다)
- 400회 `run`과 rules-2 골든의 sha256, 첫 화면 gzip 전후, 시험 수, 변형 표
- 범위 밖 발견과 질문

## 허브 검토 46건 처리표

번호는 `docs/ai/design/path3-price-risk-2026-10/REVIEW-HUB-2026-10-16.md`의 번호다. 다섯 문서(판정표·설계·TASK-0062~0064)에 같은 표를 붙였다.

| # | 처리 | 반영한 곳과 이유 |
|---|---|---|
| 1 | 반영(H5-5 a) | 신고일(도착일) 세율 + 시행 지연 [0,3]일(흐름 `…:lag`). 정시 계약 시험·‘정시 노출’ 시험, 진단 T. DESIGN 4.1, 0063 1절, 판정표 3.2 |
| 2 | 반영(H5-1) | 기준 회사 원화 환전 규칙을 의사코드로 고정하고 ‘비교 대상’에 넣음. 판정표 0절 2·6.1 |
| 3 | 반영(H5-2) | 대상 계약 집합(완료+열린+취소), 5% ≤ 비율 ≤ 25%, 따로 적을 수. 판정표 2절 |
| 4 | 반영(H5-3) | 손잡이 정의표(자료 경로·1단위·허용 범위), 1회 = 손잡이 하나 최대 2단위, 순서 화살표 규칙, ‘근처’ = L1 ≥ 20%, J1 실패 시 측정 멈춤. 판정표 5절 |
| 5 | 반영(H4) | 0062 0단계 rules-2 골든(`check_rules2_golden.mjs`, `review_checks` 한 줄). 400회 `run`은 rules-1 전용으로 명시. DESIGN 2절 2, 0062 0단계 |
| 6 | 반영(H0) | 합산 범위를 H0대로 좁힘. 미리보기 기존 칸 통화별, 새 칸 `referenceEstimate`만, 분석값은 rules-3 실행기만. `contractRiskReport` 원화 환산은 허브 확인 Q-A로 남김 |
| 7 | 반영 | 과세가격 = 원화 매입액 ÷ 수락일 참고 환율(계약 내내 고정), 관세 = × 도착일 세율. 가정 문장(WTO 관세평가협정 제1조, CIF는 경로 6). DESIGN 3.3, 0062 3절 |
| 8 | 반영(H0로 대체) | USD 환산 칸을 두지 않음. `schedule[].currency`, `cashNeedByCurrency`를 rules-3에만. 경로 11 화면은 원화 틀 기본·‘참고 환율 환산’ 표지. DESIGN 3.4 |
| 9 | 반영(지렛대 삭제) | 시장 노출 기간 지렛대를 설계에서 뺌(주 단위 걸음 유지). 환전 시점은 ‘예측으로 이길 수 없다’ 명시. 경계 자르기 한계 기록. DESIGN 3.2·3.5 |
| 10 | 반영 | 두 층 손상 분포(작은 1~5% 80%, 큰 15~30% 20%), 하한 < `MARGIN_BUFFER` 10%. 손잡이(큰 손상 가중치), 진단 C, 판매 견적 ID 추첨 키. DESIGN 5.1, 판정표 5절 |
| 11 | 반영(B안) | 클레임은 품목 파손 등급, 수금은 거래처 가상 신용등급에 묶고 미리보기 `riskGrades`로 공개(화면은 경로 11). 국가·도시 단위 등급은 쓰지 않음. DESIGN 5절, 0064 1절 |
| 12 | 반영 | 손잡이별 현실 상한(환율 걸음 ≤ 300 등), 노출 구조 경고, 1,300은 2023년 수준 설계값 명시. 숫자는 허브 확정(Q-B). 판정표 5.2·5.3, DESIGN 3.2 |
| 13 | 반영 | 사건 = 도착국 단위, 같은 걸음을 모든 품목에, 품목별 자르기, 순서 보존 시험, 무의미 사건 생략, 기준 세율 예시 > 0. DESIGN 4.1, 0063 1절 |
| 14 | 반영 | [수입 07-03-03] 근거를 경로 3에서 빼고 0064는 ‘일부만 준비’로 한정. 결제 방식은 범위 밖(경로 7). DESIGN 머리·3.1, 0064 머리 |
| 15 | 반영 | 매입 통화는 `rowCurrency`로 유도, 행에 칸 없음. `marketTable` 통화. 행 키 집합 시험. DESIGN 3.3, 0062 3절 |
| 16 | 반영(H0) | `cashNeed`는 USD 부분(number 유지), `cashNeedByCurrency`, `schedule` 통화 칸, 환산은 새 칸만. DESIGN 3.4 |
| 17 | 반영 | 단계별 평가일 표, 약정·청구 결제일 용어, `open_valuation` 단계, 미지급은 갚은 날 환율로 `fx` 단계. DESIGN 3.4 |
| 18 | 반영(=3) | 판정표 2절 대상 계약 집합 |
| 19 | 반영 | 분석값 식(센트 = USD + halfUp(KRW ÷ 13)), `cell()`을 쓰는 판정 목록, J3 후보에서 `MARGIN_BUFFER`·`FOCUS`·`EXPAND` 제외. 판정표 2절·3.2 |
| 20 | 반영 | (가)·R0을 새 실행기로 재실행해 표 ①·⑤ 대조, 전체 묶음 정의, 6조건, 비용 재추정. 판정표 1.3 |
| 21 | 반영 | 공유 프로필 하나, 조정 때 (가)·R1~R3도 재실행, `tariff.base`는 모든 품목, 검사기는 품목 자료 기준. 판정표 5.1, DESIGN 6절 |
| 22 | 반영 | L3에 시드 짝 부호 검정(문턱표 미리 계산), L2에 시드 짝 조건, `MARGIN_BUFFER`는 직접 무역만. 0.75배는 ‘설계 판단’으로 근거 문장 고침. 판정표 3.2·6.2 |
| 23 | 반영 | 표본 밖 대상 5조건·묶음, 최종 판정(두 묶음 모두 통과), v2 시드 1061~1080, (가)·R1~R3 표본 밖 J4d 기록만. 판정표 4절 |
| 24 | 반영(H1) | (다) = 화장품+조미김 G=2. 방법 2를 ‘엔진 변경’으로 표시. 판정표 3.3 |
| 25 | 반영(=20) | 새 정책을 전체·줄인 묶음 모든 조건에. L0는 새 정의로 20시드 집계. 판정표 1.3·3.2 |
| 26 | 반영 | 열린 계약은 캠페인 마지막 날 참고 환율로 평가, 고정 환율 평가는 민감도. 고정 환율 출처 하나(`fx_krw_per_usd`)와 검사기. 판정표 2절, DESIGN 3.4·6절 |
| 27 | 반영(H1) | 세 선택지를 기록하고 이 판본은 ③. 판정표 3.3 |
| 28 | 반영 | `contractRiskReport`가 주선도 받음, J7 옛 정의·새 정의 분리 보고. DESIGN 3.4, 판정표 3.1 |
| 29 | 반영 | 환전 불변식 rules-3 참고 환율, `exchangeAmounts(seed, day)`. 0062 2·6절 |
| 30 | 반영(7과 합침) | 과세가격 수락일 고정이라 시험 문구를 ‘도착 관세 = 수락일 기준값’으로. 미래 누설 변형 추가. 실패 기록은 수락일 환율. 0062 시험·변형 |
| 31 | 반영 | 실패 기록 USD 몫만, `PURCHASE-` 접두어, 시험·변형. 0062 3절 |
| 32 | 반영 | `usdLotKrw`·`lotsToSurvive` 등 그날 환율. 판정표 6.1도 같은 함수. 0062 2절 |
| 33 | 반영 | `withRiskLevel`을 `src/engine/risk.ts`에 고정. DESIGN 7절, 0062 5절 |
| 34 | 반영(=5) | 명령을 지시서 ‘지켜야 할 것’에 명시. 판정표 0절 5 |
| 35 | 반영(가안) | 정적 매입 견적도 KRW로 변환, 분기 조건은 ‘매입 통화 ≠ 판매 통화’, 부대비의 단일 통화 분기. DESIGN 3.3·4.2 |
| 36 | 반영 | `preview(…, opts)`, 시드 출처 명시·시험, `dutyFor` 서명 고정, 실행기 호출 정정(`operations-policy.ts:118·129`). DESIGN 1·3.3·3.4, 판정표 6.2 |
| 37 | 반영(=29·31) | 0062 3·6절 |
| 38 | 반영 | rules-3 로더 분기·스키마는 TASK-0065로. 0062는 타입과 검사기 반례(문장 단언)만. 0062 1절 |
| 39 | 반영 | 변형 1을 ‘rules-3이 고정 환율을 씀’으로 교체, rules-2 로그 변형 추가, 원래와 같은 변형은 이유 보고. 0062 변형 표 |
| 40 | 반영 | 0063·0064 옛 값 불변은 저장소 밖 덤프 `cmp` 절차, 시험은 ‘새 층이 꺼진 설정’으로. 0063·0064 지켜야 할 것 |
| 41 | 반영(=46) | 0064 ‘캠페인 끝’ 시험 |
| 42 | 반영 | `receivableSchedule`, `openInvoices` 남은 금액, `OVERDUE` 전이, `nextReceipt`(operations.ts 범위 한정), `progress.ts`·UI는 범위 밖 발견. 0064 2·3절 |
| 43 | 반영 | 추첨 키 = 판매 견적 ID, 공통 난수 시험·변형, 판정표 2절에 공통 난수 명시 |
| 44 | 반영(=42) | `upcomingPayments`는 손대지 않음 |
| 45 | 반영 | `operations.ts`를 `nextReceipt` 계산으로 한정해 허용 |
| 46 | 반영 | ‘캠페인 끝’ 시험을 엔진 수준 단언으로, 분석값은 경로 5 실행기 시험으로 |

- 기각은 없다. 선택지가 있던 항목은 이렇게 골랐다: 9번은 지렛대 삭제, 11번은 B안(보이는 등급), 24·27번은 H1(G=2), 35번은 가안.
- 허브 확인이 남은 것: Q-A(`contractRiskReport` 원화 환산이 H0 예외에 드는가), Q-B(손잡이 허용 범위 숫자).
