# TASK-0062 직접 무역 위험 ①: 원화 매입·달러 판매와 참고 환율 경로 (초안, 개정 3)

- **지위: 초안(세션 A, 2026-10-14, 개정 1·2·3 2026-10-16). 허브 승인과 `<BASE>` 치환 전에는 실행하지 않는다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: **TASK-0062a(rules-2 골든) 병합**, 허브 승인 커밋(판정표·설계·이 지시서), 설계 2절 2 표와 TASK-0062a 범위 표의 대조(세션 A). `<BASE>`는 이 셋을 모두 담은 개발 브랜치 커밋이다(허브가 치환할 때 적는다, 검토 n16). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 2·3·6·7·8·9절. **먼저 읽는다.** 이 지시서와 설계가 다르면 이 지시서가 우선이다.
- 판정 기준: `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`. 이 작업은 측정하지 않는다. 측정은 경로 5다.
- 목적: 직접 무역 계약이 수락 뒤 환율 때문에 원화 기준으로 손실이 날 수 있게 한다. 학습목표 O1(환율 판단)의 엔진 바탕이다.
- 줄 번호는 개발 브랜치 `8918e37` 기준이다. 함수 이름으로 찾고, 달라진 줄을 결과 보고에 적는다.

## 원칙

- 새 규칙 판본 `M2a-rules-3`에서만 켠다. rules-1·rules-2의 동작·출력·저장은 바이트로 같다.
- 상태에 새 칸을 두지 않는다. 환율은 `(seed, 흐름 이름, 주차)`의 순수 함수다. **상태 칸을 꼭 더해야 하면 더하지 말고 멈춰 보고한다**(설계 8절).
- 두 통화를 더한 값을 원장·저장·결산(`contractReport` 포함)·실패 기록에 만들지 않는다. 허용 자리는 허브 결정 H6의 닫힌 목록뿐이다. 이 지시서에서 만드는 것은 ① 미리보기의 `referenceEstimate`(H0)와 ③ `contractRiskReport`의 원화 환산(H6의 조건: 저장 안 함, 평가일 규칙, 미래 누설 없음, R0은 1,300 고정)이다. 두 칸의 주석에 ‘추정, 환율이 바뀌면 달라짐’(H6-3)을 밝힌다.
- **새 인수는 모두 선택 인수다**(허브 결정 H13). 인수가 없으면 rules-2 동작 그대로다. rules-3에서 꼭 필요한 인수가 없으면 예외를 낸다.
- 화면(`src/ui/**`)은 고치지 않는다. 새 규칙 시나리오는 이번에 화면에 나오지 않는다.

## 구현 지시

### 1. 규칙 판본과 자료

- `SUPPORTED_RULES_VERSIONS`(`src/engine/types.ts:14`)와 타입에 `M2a-rules-3`을 더한다. 시나리오 로더의 rules-3 분기(`scenario.ts:264·268-270`)와 `operations.risk` 읽기는 **이번에 넣지 않는다**. rules-3 시나리오 레코드를 넣는 TASK-0065에서 스키마와 함께 넣는다.
- `data/market_rules.json`에 `risk_profiles` 배열과 시작 프로필 하나를 더한다. **값은 설계 6절의 시작 프로필 그대로다**(김 행은 TASK-0065가 더한다). 이번에 엔진이 읽는 것은 `fx`뿐이다. 나머지 묶음은 자료 꼴과 검사만 넣는다.
- 프로필 읽기 함수 `loadRiskProfile(id)`와 `riskProfiles()`를 `src/content/scenario.ts`에 둔다(자료를 읽는 곳이 이 파일이기 때문이다). 엔진 타입(`RiskProfile`)으로 바꿔 돌려준다.
- 스키마(`schemas/` 해당 파일)와 `tools/validate_data.py`에 설계 6절의 검사를 넣는다.
  - 반례 시험은 기존 `MarketRulesTest`와 같은 방식으로 만든다. 자료 사본에서 값을 바꾸고 `check_market_rules`만 부른 뒤, 그 검사의 문장 자체를 단언한다(스키마 `shape`는 부르지 않는다). 반례: 등급 확률 합 ≠ 10000, 손상 두 층 가중치 합 ≠ 10000, 최소 > 최대, 품목 자료에 없는 품목, 시장 자료에 없는 거래처, `start_krw_per_usd` ≠ `fx_krw_per_usd`, 그리고 반대 방향 셋(운영 rule_set의 판매 거래처가 `by_counterparty`에 없음, `trade.goods` 품목이 `claims.by_good`에 없음, (판매 도시 나라, 품목)이 `tariff.base`에 없음. 설계 6절, 허브 결정 H14-10).
  - 프로필의 `basis`·`status` 표지(설계 6절)를 그대로 옮긴다.

### 2. 참고 환율 경로와 환전

- 새 파일 `src/engine/risk.ts`에 `drawAt(seed, stream, index)`와 `referenceRate(config, seed, day): number`(원/달러, 정수)를 둔다. 설계 3.2의 식 그대로다.
  - 주차는 시세 공개일 기준이다(`publish.first_day`, `interval_days`). 공개일 사이에는 값이 같다. 마지막 공개일 뒤는 마지막 값.
  - `drawUniform`을 커서 상태 없이 부르는 순수 함수다(흐름 `FX-REF`, 번호 = 주차). **`state.rng`의 커서를 바꾸지 않는다.**
  - 위험 설정에 `FX` 층이 없으면 프로필의 `start_krw_per_usd`를 돌려준다. 위험 설정 자체가 없으면(rules-2) `config.operations.fx.baseKrwPerUsd`를 돌려준다(허브 결정 H6-4).
- **환산 도우미 둘과 반올림 하나**(설계 3.3, 허브 결정 H14-2)를 `risk.ts`에서 내보낸다. 이 지시서의 모든 원↔달러 환산(`dutyFor` 과세가격, `referenceEstimate`, `contractRiskReport`)이 이 둘만 쓴다.
  - `divHalfAway(n, d) = sign(n) × ⌊(2|n| + d) ÷ (2d)⌋`(d > 0 정수, 0.5는 0에서 먼 쪽. `applyBasisPoints`와 같은 규칙)
  - `krwToUsdMinor(krw, rate) = divHalfAway(krw × 100, rate)`, `usdToKrwMinor(cents, rate) = divHalfAway(cents × rate, 100)`
- `exchangeAmounts(config, direction, usd, seed?, day?)`(`operations.ts:150`): 선택 인수 시드·날짜. 호출처 `operations.ts:168`은 `s.rng.seed`, `s.day`를, `readers.ts:97`(`exchangePreview`)은 오늘을 넘긴다. rules-3이면 기준 환율 자리에 그날 참고 환율을 쓰고, 차감은 지금 규칙 그대로다. 인수가 없으면 지금 식이다. 로그 문장의 ‘게임용 고정 환율’은 rules-3에서 ‘오늘 참고 환율’로 쓴다. rules-2 문장은 그대로다.
- 고정 환율로 묶음 금액을 세는 함수들(설계 3.2): `usdLotKrw(config, s?: GameState)`(`operations.ts:225-226`), `paymentDefaultStatus`의 `lotsToSurvive`·`lotsToClearAll`·`krwToUsdRequiredMinor`(`:238-253`), `wageUsdLotsPerWeek`(`readers.ts:202`). 모두 맨 끝 선택 인수로 상태를 받는다. 없으면 지금 고정 환율 식(rules-2 바이트 그대로)이고, rules-3에서 없으면 예외다. 실행기 호출(`sim/operations-policy.ts:73`)은 이번에 고치지 않는다(경로 5).

### 3. 원화 매입과 혼합 통화 계약

설계 3.3 그대로다. 요점만 적는다.

- **매입 통화 유도.** `rowCurrency(config, side)`(`risk.ts`)로 유도한다. 시세 행 타입(`types.ts:535`)과 `MarketBatch.rows`(`types.ts:560`)에 통화 칸을 두지 않는다. 생성기(`market.ts`)는 rules-3 원화 매입이면 매입 견적의 통화를 KRW, 단가를 원 단위로 만든다. `marketTable`(`market.ts:100`)은 매입 행 통화를 KRW로 낸다.
- **수락**(`acceptTrade`, `engine.ts:308`): 매입·판매 통화가 달라도 rules-3이면 받는다. 계약 `currency`는 판매 통화다. 매입 통화는 견적에서 읽는다. 계약·화물·청구서에 칸을 더하지 않는다.
- **자금 검사**: 매입은 KRW 가용, 운임·관세 예상은 USD 가용으로 따로 본다. 부족한 통화마다 거절 문장을 따로 낸다.
- **분기 조건**: 아래 운임·관세·매출원가·실패 기록의 분기는 모두 ‘매입 통화 ≠ 판매 통화’다.
- **운임·관세**: 혼합 통화 계약이면 화물 장부가에 더하지 않고, 같은 계약 ID의 USD 재고 분개로만 쌓는다.
- **관세: 한 함수 `dutyFor`**(설계 3.3의 서명과 호출처 표 그대로, 허브 결정 H13):
  - 서명: `dutyFor(config, seed, goodId, destinationCityId, tariffDay, knownThroughDay, purchaseMinor, purchaseCurrency, valueFxDay)`.
  - 여섯 호출처(`reports.ts:99` 미리보기, `engine.ts:319` 수락 자금 검사, `reservations.ts:33` 자금 예약, `engine.ts:1019` 도착 처리, `operations.ts:273` 실패 기록, `contractRiskReport`)가 모두 이 함수를 부르고, 넘기는 값은 설계 3.3의 표대로다(허브 결정 H14-6). **자금 예약의 `valueFxDay`는 `c.acceptedDay`다.** 자금 예약의 `tariffDay` 규칙, 편이 없을 때의 규칙(`tariffDay = knownThroughDay`), 실패 기록의 편(`listSailings(config, route, 수락일 + 1)[0]`)도 설계 3.3 그대로다.
  - 매입 통화가 KRW이면 과세가격(USD 센트) = `krwToUsdMinor(원화 매입액, valueFxDay 참고 환율)`, 관세 = 과세가격 × 세율(개정 3에서 ×100 누락을 고침). 이번에는 세율이 시나리오 고정 세율이고 `goodId`·도착지·`tariffDay`·`knownThroughDay`는 쓰지 않는다(0063이 몸통만 바꾼다). 매입이 USD이면 지금 `dutyEstimate` 그대로다.
- **인도 때 매출원가**: 혼합 통화 계약이면 `COGS-{계약}-KRW`와 `COGS-{계약}-USD` 두 분개를 낸다. rules-2 분개 ID·금액은 그대로다.
- **출항 전 취소·편 놓침**: 지금 규칙의 금액을 통화별로 나눠 적용한다(매입 원화는 돌려받지 못함, 운임 환급·취소비는 USD).
- **지급 불이행 실패 기록**(허브 결정 H13, 검토 R18 가):
  - `operations.ts:272-274`의 USD 약정액은 혼합 통화 계약이면 USD 몫만이다(예약 운임 + `dutyFor` 관세, 위 표의 실패 기록 값). 원화 매입액을 더하지 않는다.
  - `operations.ts:284-285`의 원화 선택 지출 접두어에 `PURCHASE-`를 더하고, **`PURCHASE-` 분개만** 창을 `oldest.incurredDay − failureAgeDays ≤ e.day ≤ 실패일`로 넓힌다. 다른 접두어의 창은 그대로다.
  - 원화 매입 약정을 따로 저장하지 않는다(H0의 ‘통화별로 나눠 저장’은 이 범위에서 ‘더하지 않는다’로 지킨다. 새 칸이 필요한 기록은 형식 7 묶음에서 한다).
  - 두 곳 모두 rules-2 값은 바이트로 같다.
- **계약 보고서**(허브 결정 H13, 검토 R17): 서명을 `contractReport(s, contract, currency = contract.currency)`로 고정한다. 장부는 넘긴 통화로 읽고 기존 칸(`contribution` 등)은 그 통화 몫이라고 주석에 적는다. `campaignSummary`의 통화별 계약 기여는 그 통화에 분개가 있는 계약을 모두 센다. rules-2 출력은 바이트로 같다. 실행기 지표(`src/engine/sim/**`)는 이번에 고치지 않는다.

### 4. 견적 미리보기와 계약 손익 읽기 함수

- **미리보기**(설계 3.4, 허브 결정 H0):
  - `preview`(`reports.ts:85`) 맨 끝에 선택 인수 `opts?: { goodId?: string; purchaseCurrency?: Currency }`. 인수가 없으면 rules-2 결과가 바이트로 같다. rules-3에서 `purchaseCurrency`가 없으면 `rowCurrency(config, 'BUY')`로 정한다. `tradePreview`·`quotePreview`는 둘을 넘긴다.
  - 참고 환율의 시드: `preview`는 `config.seed`, `quotePreview`·`contractRiskReport`는 `s.rng.seed`. 같다는 전제를 주석에 적고 시험에서 단언한다.
  - 기존 칸은 통화별 그대로다: `purchase`는 원, `freight`·`duty`·`sale`은 USD. rules-3의 `cashNeed`는 USD 부분만, `contributionBeforePayroll`은 USD 줄만의 합이다. 여기서 나오는 `contributionPerPrepPtMinor`(`readers.ts:89`)도 같은 뜻이다. 세 칸 모두 주석에 ‘원화 매입 제외, 판단 값 아님’을 적는다.
  - rules-3에서만 새 칸: `cashNeedByCurrency`, `referenceEstimate { rateKrwPerUsd, saleKrw, pnlKrw }`, `schedule`의 **모든 줄**에 `currency`. rules-2에서는 이 칸들을 출력하지 않는다.
  - **`referenceEstimate`의 식**(허브 결정 H14-3. 설계 3.4 그대로):
    - `rateKrwPerUsd = referenceRate(config, config.seed, bookingDay)`
    - `saleKrw = usdToKrwMinor(p.sale, rate)`. `p.sale`은 미리보기의 sale(다음 첫 편 늦은 감액 뒤)이다.
    - 매입 KRW: `pnlKrw = saleKrw − p.purchase(원) − usdToKrwMinor(p.freight + p.duty, rate)`. 매입 USD: `pnlKrw = saleKrw − usdToKrwMinor(p.purchase + p.freight + p.duty, rate)`.
  - **rules-3 직접 무역 `preview`에 `opts.goodId`가 없으면 예외**를 낸다(H14-6). `purchaseCurrency`만 대체 규칙이 있다.
- **`contractRiskReport(state, config, contractId)`**(설계 3.4의 정의와 표, 허브 결정 H6):
  - **위치는 `reports.ts`다.** 환율은 `risk.ts`에서 import한 `referenceRate`로만 부른다(같은 모듈 안에서 환율을 계산하지 않는다. 누설 시험이 `vi.mock('./risk')`로 바꾼다, 허브 결정 H14-5).
  - 직접 무역과 주선 계약 모두 받는다. **rules-2 상태도 받는다.** 위험 설정이 없으면 환율은 `config.operations.fx.baseKrwPerUsd` 고정이고 `components.fx = 0`, `residual = 0`이다.
  - **평가일**(H14-5): 끝난 상태에서는 실패로 끝났으면 `operations.failure.day`, 그 밖이면 `config.campaignDays`. 끝나지 않은 상태에서는 `s.day`. 실패 뒤의 `s.day`(실패일 + 1)는 쓰지 않는다. 평가일보다 뒤의 날짜의 환율과 아직 공지되지 않은 사건은 쓰지 않는다.
  - 열린 계약: `realized = 현금 줄 + 남은 흐름 × 평가일 참고 환율`. 남은 흐름은 받을 채권 잔액, 운송 중·출항 전 판매, 아직 내지 않은 운임, **도착 전 계약의** 관세 예상(설계 3.3 표 `contractRiskReport` 행), 미지급 잔액이다. 도착 뒤 미지급 관세는 미지급 잔액으로만 센다. `open: true`와 `openFixedRateKrw`(남은 흐름만 `baseKrwPerUsd`로 평가한 계약 전체 마진)를 함께 낸다. 열린 = 남은 흐름이 하나라도 있는 계약(상태와 무관)이다.
  - 0단계 기대(직접 무역)는 수락일 미리보기의 `referenceEstimate.pnlKrw`와 같다. 1단계는 날짜만 옮기고 관세 금액은 0단계 그대로다.
  - 이번에 채우는 단계: 0(기대)·1 `schedule`·2 `fx`·5 `late`·7 `cancel`·10 `residual`. 9 `open_valuation`은 **구성상 0**이고 `open` 표지만 남긴다(설계 3.4). 3 `tariff`·4 `surcharge`·6 `claim`·8 `collection`은 0이다.
  - 항등식: `realized − expected = 모든 칸의 합`, `residual = 0`. 원 단위 정수. 환산은 `usdToKrwMinor` 하나로 한다. `residual`이나 `open_valuation`을 ‘realized − 앞 단계 합’으로 메우지 않는다.
- 실행기 정책은 이번에 고치지 않는다(경로 5 변형 지시서).

### 5. 측정용 설정 변환

- `withRiskLevel(config, level, profile)`을 **새 `src/engine/risk.ts`에** 둔다(위치 고정). 이번에는 `R0`(그대로)과 `R1`(rules-3 + 원화 매입 + `FX`)만 만든다.
  - 시세 행의 매입 기준가: USD 기준가 × `start_krw_per_usd`를 원 단위 half-up으로 바꾼다.
  - **정적 매입 견적**(`config.offers`의 `supplier` 견적)도 같은 식으로 KRW로 바꾼다.
- 실험 시나리오 ID를 자료에 더하지 않는다.

### 6. 저장·불변식

- 저장 형식은 6 그대로다. `save-shape.ts`는 열거 값 추가만 한다(필요할 때).
- `operations-invariants.ts`:
  - 혼합 통화 계약은 매입 견적 KRW·판매 견적 USD·계약 통화 USD여야 한다. 다른 짝이면 불러오기를 거부한다(기존 `SaveError` 경로).
  - 환전 이체 검사(`:64`)는 rules-3이면 각 환전 기록 날짜의 `referenceRate`로 기준 원화액을 다시 계산해 검사한다. rules-2 식(`baseKrwPerUsd`)은 바이트 그대로다. **검사를 지우거나 느슨하게 하지 않는다.** 이 검사는 불러오기(`save.ts:135`)와 매일 마감(`engine.ts:872`)에서 모두 돈다.
- `invariants.ts`: 통화별 재고 장부 = 화물 장부가 합(`:62-67`)을 혼합 통화 계약의 USD 재고 분개 잔액까지 더해 맞춘다. rules-2 상태에서는 지금 식과 같은 값이다.
- `withRiskLevel`로 만든 상태의 저장은 시나리오 ID로 다시 열면 rules-2 설정으로 읽힌다(설계 8절 한계). 저장 왕복 시험은 설정을 직접 넘긴다. 이 한계를 고치려고 저장 형식이나 meta 칸을 바꾸지 않는다.

## 시험(새 파일 `src/engine/m2a5-risk-fx.test.ts`)

- 시험은 옛 운영 시나리오에 `withRiskLevel(…, 'R1', riskProfiles()[0])`을 걸어 만든다. **시험에 자료 ID·조정 상수를 쓰지 않는다**(TASK-0027 R1). 값이 필요하면 프로필에서 읽는다.
- 특정 사건(환율이 바뀐 날, 늦은 편 계약 등)이 필요하면 시드를 찾는다. 탐색은 시드 200개 안으로 제한하고, **찾았는지를 먼저 단언**한다.
- 직접 무역을 받으려면 원화가 있어야 한다. 시험 구동기가 명령(환전 → 수락)을 직접 넣는다. 실행기 정책은 쓰지 않는다.
- 옛 값 불변은 시험 안에서 `<BASE>`와 견줄 수 없다. TASK-0062a 골든(rules-2 105회와 규칙 1 400회, 탐침·저장 왕복 포함)과 기존 P0-M2A5 골든값 시험이 맡는다.

| 시험 | 확인할 것 |
|---|---|
| 새 흐름 없음 | rules-2 운영 시나리오를 시드 하나로 90일 돌린 `state.rng.cursors`에 새 흐름 이름이 없다 |
| 흐름 유일성 | 위험 순수 함수가 쓰는 (흐름 이름, 번호) 쌍이 서로 겹치지 않는다 |
| 환산 도우미 | 산술 상수 단언(자료 값이 아님, H14-2): `krwToUsdMinor(2600000, 1300) = 200000`, `divHalfAway(1, 2) = 1`, `divHalfAway(−1, 2) = −1`, `usdToKrwMinor(−50, 1300) = −650` |
| 환율 순수성 | 같은 (seed, day)는 같은 값. 공개일 사이 같은 값. 값이 늘 [min, max] 안. 이웃 주의 변화율이 `step_bp` 안. 시드 두 개가 어느 주에서 다르다(찾아서 확인) |
| 환율 상태 무관 | `referenceRate`를 여러 번 불러도 `state`가 같다. 저장·불러오기 뒤 같은 날 값이 같다 |
| 환전 | rules-3 환전의 원화 금액 = USD × (그날 참고 환율 ∓ 차감). 참고 환율이 1주차와 다른 주에 환전한 뒤 그날 마감 통과, 저장·불러오기 왕복(설정을 직접 넘김) 통과 |
| 묶음 계산 | 참고 환율이 시작값보다 낮은 날을 찾아, 그날 `lotsToSurvive` × 그날 묶음 원화 ≥ 생존에 필요한 원화 − 원화 현금. rules-3에서 상태 없이 `usdLotKrw(config)`를 부르면 예외 |
| 원화 매입 계약 | R1에서 직접 무역을 받으면 매입 분개는 KRW, 운임 분개는 USD, 인도 때 COGS가 통화별 두 분개. 통화별 원장 합이 0. 미리보기 `schedule`의 모든 줄에 `currency`가 있고 매입 줄은 `'KRW'`의 원 단위 |
| 정적 매입 견적 | R1 설정 안의 모든 `supplier` 견적이 KRW다 |
| 시세표·행 | R1 상태의 `marketTable`에서 매입 행 통화가 KRW, 판매 행이 USD. R1 상태 `batches[].rows`의 키 집합이 rules-2와 같다 |
| 미리보기 기본값 | rules-3에서 `opts = { goodId }`만 넘긴 `preview`의 매입 통화가 KRW로 처리되고, 기존 칸이 통화별 값이다. rules-3 직접 무역 `preview`를 `goodId` 없이 부르면 예외 |
| 참고 추정 | rules-3 미리보기의 `referenceEstimate`가 4절의 식과 같다(`usdToKrwMinor`로 시험 안에서 다시 계산). 늦은 편 후보에서 `saleKrw`가 늦은 감액 뒤 sale의 환산이다 |
| 자금 검사 | KRW가 모자라면 KRW 문장으로, USD가 모자라면 USD 문장으로 거절. `cashNeedByCurrency`가 두 기준과 같다 |
| 취소 | 혼합 통화 계약 출항 전 취소의 통화별 금액 |
| 취소(rules-2) | rules-2 운영 시나리오에서 출항 전 취소의 `FREIGHT-RELEASE` 분개가 선급 운임 − 취소비이고, 취소비가 설정 값과 같다(설정에서 계산, 설계 2절 2) |
| 계약 보고서 통화 | R1 혼합 계약 인도 뒤 `contractReport(s, c, 'KRW').directCost` = KRW 매입액, `contractReport(s, c).contribution` = USD 몫, `campaignSummary`의 KRW `contractContribution` = −Σ KRW 매출원가. rules-2 상태에서는 지금 값과 같다(검토 n25) |
| 관세 과세가격 | 여섯 호출처가 모두 `dutyFor`를 부른다. ① 수락일과 도착일의 환율 주가 다른 계약을 찾아(찾았는지와 두 환율이 다름을 먼저 단언), 도착 분개(`DUTY-…`)의 관세 = `krwToUsdMinor(원화 매입액, 수락일 참고 환율)` × 세율. ② 늦은 편 계약(수락일과 도착일의 환율 주가 다른 계약)을 찾아, **수락일 미리보기 관세 = 수락 뒤 매일의 자금 예약 관세 = 도착 관세**. ③ 늦은 편 미리보기(도착 예정이 다음 환율 주)의 관세 = `krwToUsdMinor(원화 매입, 오늘 참고 환율)` × 세율 |
| 실패 기록 | 혼합 계약을 수락한 날 원화 급여 미지급이 생겨 실패하는 시드를 찾아, 실패 기록의 계약 USD 약정액이 USD 몫과 같다. `oldest.incurredDay − failureAgeDays`부터 실패일까지 받은 원화 매입이 원화 선택 지출에 들어간다 |
| 실패 종료 평가일 | 위 실패 시드의 끝 상태에서 `contractRiskReport`의 평가 환율 = `referenceRate(failure.day)`이고, 열린 계약의 남은 흐름이 이 환율로 평가된다. 실패일 + 1이 공개일인 시드를 찾으면 그 시드로 한다(찾았는지 먼저 단언, H14-5) |
| 손익 읽기 | 끝난 계약마다 `residual = 0`(직접 무역·주선 모두). 환율이 수락일과 청구 결제일 사이에 바뀐 계약을 찾아 `components.fx ≠ 0`이고 부호가 환율 방향과 맞다(원화 강세면 음수). 늦은 편 계약의 `schedule`·`late`, 출항 전 취소 계약의 `cancel` |
| 열린 계약 | 캠페인 끝에 열린 계약을 찾는다. **전제를 먼저 단언한다**: 남은 흐름 ≠ 0, `referenceRate(평가일)` ≠ `baseKrwPerUsd`, `referenceRate(평가일)` ≠ `referenceRate(acceptedDay)`(검토 n3·n42). 그다음 `realized = 현금 줄 + 남은 흐름 × referenceRate(평가일)`, `residual = 0`, `open_valuation = 0`, `open = true`, `openFixedRateKrw` = 같은 식에서 남은 흐름만 × `baseKrwPerUsd`. 도착 전 운송 중 계약의 남은 흐름에 관세 예상이 있고, 도착 뒤 관세 미지급 계약에서는 관세가 미지급 잔액으로만 한 번 들어간다 |
| 미래 누설 없음 | 세 단계로 한다(H14-5, 검토 S3). ① 전제: 상태 t에 청구 결제일(또는 예정 도착일)의 환율 주가 평가일의 주보다 뒤인 열린 계약 줄이 있고, 그 주의 감싼 환율이 원래 값과 다름을 단언한다. ② 같은 상태 t에서 평가일 뒤 주차의 환율만 다른 두 경우의 `contractRiskReport`가 같다. ③ 양성 대조: 그 날짜가 지난 상태 t′에서는 같은 감싸기로 같은 계약의 보고서가 달라진다. 감싸기는 `vi.mock('./risk')`로 모듈 경계에서 한다 |
| R0 | rules-2 운영 시나리오(R0)에서 미지급이 없는 끝난(`COMPLETED`) 직접 무역 계약마다 `realized(원) = contractReport(s, c).contribution(센트) × (baseKrwPerUsd ÷ 100)`(13을 상수로 쓰지 않는다), `components.fx = 0`, `residual = 0` |
| 시드 일치 | rules-3 미리보기의 `config.seed`와 상태의 `s.rng.seed`가 같다 |
| 결정성 | 같은 시드·같은 명령 두 번이면 같은 상태 JSON |
| 저장 | R1 진행 상태 저장·불러오기 왕복이 같다(설정을 직접 넘김). 옛 저장 시험은 그대로 통과 |
| 불변식 | 혼합 통화 짝을 바꾼 저장 사본, 환전 원화액을 바꾼 저장 사본을 거부 |

- ‘미래 누설 없음’ 시험의 두 경우는 `vi.mock('./risk')`로 `referenceRate`를 감싸 평가일 뒤 주차의 값만 바꾸는 방식으로 만든다(자료 상수를 시험에 쓰지 않는다). `contractRiskReport`가 `reports.ts`에 있고 환율을 `risk.ts`에서 import하기 때문에 이 감싸기가 닿는다.

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
| 8 | 과세가격에 도착일 환율을 씀 | 관세 과세가격 ①·②(① 전제: 수락일과 도착일의 환율 주가 다른 계약) |
| 9 | 자금 예약이 오늘 또는 도착 예정일 환율을 씀 | 관세 과세가격 ② |
| 10 | USD 약정에 원화 매입을 더함 | 실패 기록 |
| 11 | 환전 불변식이 rules-3에서도 `baseKrwPerUsd`를 씀 | 환전(마감·왕복) |
| 12 | `usdLotKrw`가 rules-3에서도 고정 환율을 씀 | 묶음 계산 |
| 13 | 열린 계약의 남은 흐름을 고정 환율로 평가 | 열린 계약(전제: 평가일 환율 ≠ `baseKrwPerUsd`) |
| 14 | `contractRiskReport`가 평가일 뒤 결제일의 환율을 씀 | 미래 누설 없음 |
| 15 | `PURCHASE-` 창을 넓히지 않음(발생일 전 14일만) | 실패 기록 |
| 16 | 열린 계약의 남은 흐름을 수락일 환율로 평가 | 열린 계약(전제: 평가일 환율 ≠ 수락일 환율, 검토 n3) |
| 17 | `campaignSummary`가 계약 통화로만 거름(지금 `c.currency === currency`) | 계약 보고서 통화(검토 n25) |
| 18 | 실패 종료에서 `s.day`를 평가일로 씀 | 실패 종료 평가일(검토 n1) |
| 19 | 과세가격에서 ×100을 뺌(원 ÷ 환율) | 환산 도우미, 관세 과세가격 ① |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `market.ts`, `operations.ts`, `readers.ts`, `reports.ts`, `catalog.ts`, `reservations.ts`, `types.ts`(`SUPPORTED_RULES_VERSIONS`·타입), `invariants.ts`, `operations-invariants.ts`, `save-shape.ts`(열거 값 추가만), 새 `src/engine/risk.ts`
- `src/content/scenario.ts`(`loadRiskProfile`·`riskProfiles`와 타입만)
- `data/market_rules.json`(`risk_profiles` 추가만), 해당 스키마, `tools/validate_data.py`(위험 프로필 검사만)와 그 시험
- 새 `src/engine/m2a5-risk-fx.test.ts`
- `docs/ai/tasks/results/TASK-0062.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/ui/**`, `src/engine/sim/**`, `data/scenarios.json`, `data/goods.json`, 다른 `data/**`, `vite.config.ts`, `package*.json`, `index.html`
- **TASK-0062a의 골든 파일·검사기와 `review_checks.sh`**: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`(검토 n16, TASK-0062a 확정본). 골든 검사기의 `--write`(또는 해시를 다시 쓰는 어떤 방식)도 쓰지 않는다.
- 기존 시험의 단언

## 지켜야 할 것

- **골든 진단 절차(허브 통일 문장, TASK-0062a).** 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고, 0이 아니면 고치지 말고 멈춘다. `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다. 이 검사기는 rules-2 105회(실행·상태·탐침 해시)와 규칙 1 400회(실행·상태 해시), 두 묶음의 저장 왕복을 지킨다. 400회 `run`의 `cmp`는 허브가 검수 때 따로 돌린다.
- 작업 뒤 TASK-0062a 골든 검사기가 종료 코드 0이다(`review_checks.sh`가 돌린다). 깨졌으면 파일별 diff를 결과 보고에 적는다.
- P0-M2A5 골든값 불변. 옛 저장 시험 통과.
- 첫 화면 gzip 전후를 적는다. **+2,500 B를 넘으면 멈추고 보고한다.**
- `any`를 새로 쓰지 않는다. 돈은 정수 최소 단위다.

## 완료 조건

1. 지시 1~6 반영, 시험 표의 시험 모두 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과(골든 검사 포함).
3. 변형 19개가 모두 잡힌다(또는 원래 코드와 같은 이유를 적었다).
4. 바꾼 파일이 ‘고칠 수 있는 파일’ 안이다.
5. `git diff --stat <BASE> -- tests/golden tools/check_rules2_golden.mjs tools/check_rules2_golden.test.mjs tools/rules2_golden_lib.mjs tools/rules2_golden_entry.ts tools/ai/review_checks.sh`가 빈 값이다(검토 n16).

## 결과 보고에 넣을 것

- 바꾼 곳(파일·함수)과 이유, rules-2와 rules-3 분기 목록, 새 선택 인수 목록
- 상태 칸을 더하지 않았다는 확인(또는 멈춘 이유)
- 시험 구동기로 만든 R1 계약 몇 건(정시·늦은 편·취소·열린 계약 각 1건 이상)의 `contractRiskReport` 표(기대·실현·칸별 값). **값을 고치지 않고 적기만 한다.** 90일 정책 실행은 경로 5 실행기 지시서에서 한다(지금 기준 정책은 원화 매입용 환전을 하지 않는다)
- 골든 검사기 종료 코드(깨졌으면 `--dump` 파일별 diff), 첫 화면 gzip 전후, 시험 수, 변형 표
- 범위 밖 발견과 질문. 실패 기록 칸 이름 `optionalKrwSpendBeforeFirstUnpaid`와 화면 제목(`src/ui/money-alerts.ts:30`)이 rules-3의 `PURCHASE-` 창과 뜻이 어긋나는 점을 적는다(경로 11, 검토 n28)
## 허브 검토 46건 처리표

번호는 `docs/ai/design/path3-price-risk-2026-10/REVIEW-HUB-2026-10-16.md`의 번호다. 다섯 문서(판정표·설계·TASK-0062~0064)에 같은 표를 붙였다.

| # | 처리 | 반영한 곳과 이유 |
|---|---|---|
| 1 | 반영(H5-5 a) | 신고일(도착일) 세율 + 시행 지연 [0,3]일(흐름 `…:lag`). 정시 계약 시험·‘정시 노출’ 시험, 진단 T. DESIGN 4.1, 0063 1절, 판정표 3.2 |
| 2 | 반영(H5-1) | 기준 회사 원화 환전 규칙을 의사코드로 고정하고 ‘비교 대상’에 넣음. 판정표 0절 2·6.1 |
| 3 | 반영(H5-2는 H7로 정정) | 대상 계약 집합(완료+열린+취소), 5% ≤ 비율 ≤ 25%, 따로 적을 수. 열린 계약은 평가일 참고 환율로 평가하고 고정 환율은 민감도(H7). 판정표 2절 |
| 4 | 반영(H5-3, 개정 2에서 H10대로 정정) | 손잡이 정의표(자료 경로·1단위·허용 범위), 1회 = 한 손잡이 한 단위(개정 1의 ‘최대 2단위’는 H5-3과 달라 개정 2에서 고침), 순서 화살표·끝 처리·우선순위, J1 실패 시 측정 멈춤과 다시 재기. 판정표 5절 |
| 5 | 반영(H4, 개정 2에서 H9로 대체) | rules-2 골든은 허브의 TASK-0062a로 떼었다(Codex 커밋 금지 때문). 0062~0064는 골든 파일·검사기를 손대지 않고 `--write`를 쓰지 않는다. 400회 `run`은 rules-1 전용. DESIGN 2절 2, 판정표 0절 5 |
| 6 | 반영(H0, 개정 3에서 H6으로 정정) | 합산 범위를 H0대로 좁힘. 미리보기 기존 칸 통화별, 새 칸 `referenceEstimate`만, 분석값은 rules-3 실행기만. `contractRiskReport` 원화 환산은 H6(조건부 예외, 닫힌 목록 ③)으로 닫힘 |
| 7 | 반영(개정 3에서 m18·H14-2로 정정) | 과세가격 = `krwToUsdMinor(원화 매입액, 수락일 참고 환율)`(원 × 100 ÷ 환율, 계약 내내 고정), 관세 = × 도착일 세율. 가정 문장은 m18대로(WTO 관세평가협정 제1·8·9조, 관세법 제18조), CIF는 경로 6. DESIGN 3.3, 0062 3절 |
| 8 | 반영(H0로 대체) | USD 환산 칸을 두지 않음. `schedule[].currency`, `cashNeedByCurrency`를 rules-3에만. 경로 11 화면은 원화 틀 기본·‘참고 환율 환산’ 표지. DESIGN 3.4 |
| 9 | 반영(지렛대 삭제) | 시장 노출 기간 지렛대를 설계에서 뺌(주 단위 걸음 유지). 환전 시점은 ‘예측으로 이길 수 없다’ 명시. 경계 자르기 한계 기록. DESIGN 3.2·3.5 |
| 10 | 반영 | 두 층 손상 분포(작은 1~5% 80%, 큰 15~30% 20%), 하한 < `MARGIN_BUFFER` 10%. 손잡이(큰 손상 가중치), 진단 C, 판매 견적 ID 추첨 키. DESIGN 5.1, 판정표 5절 |
| 11 | 반영(B안) | 클레임은 품목 파손 등급, 수금은 거래처 가상 신용등급에 묶고 미리보기 `riskGrades`로 공개(화면은 경로 11). 국가·도시 단위 등급은 쓰지 않음. DESIGN 5절, 0064 1절 |
| 12 | 반영(개정 3에서 H11로 정정) | 손잡이별 현실 범위(H11: 환율 걸음 150~275 등), 노출 구조 경고, 1,300은 2023년 수준 설계값 명시. 판정표 5.2·5.3, DESIGN 3.2 |
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
| 26 | 반영(H5-2와 달랐으나 H7이 이쪽을 확정) | 열린 계약은 평가일 참고 환율로 평가, 고정 환율 평가는 민감도. 고정 환율 출처 하나(`fx_krw_per_usd`)와 검사기. 판정표 2절, DESIGN 3.4·6절 |
| 27 | 반영(H1) | 세 선택지를 기록하고 이 판본은 ③. 판정표 3.3 |
| 28 | 반영 | `contractRiskReport`가 주선도 받음, J7 옛 정의·새 정의 분리 보고. DESIGN 3.4, 판정표 3.1 |
| 29 | 반영 | 환전 불변식 rules-3 참고 환율, `exchangeAmounts(seed, day)`. 0062 2·6절 |
| 30 | 반영(7과 합침) | 과세가격 수락일 고정이라 시험 문구를 ‘도착 관세 = 수락일 기준값’으로. 미래 누설 변형 추가. 실패 기록은 수락일 환율. 0062 시험·변형 |
| 31 | 반영 | 실패 기록 USD 몫만, `PURCHASE-` 접두어, 시험·변형. 0062 3절 |
| 32 | 반영 | `usdLotKrw`·`lotsToSurvive` 등 그날 환율. 판정표 6.1도 같은 함수. 0062 2절 |
| 33 | 반영 | `withRiskLevel`을 `src/engine/risk.ts`에 고정. DESIGN 7절, 0062 5절 |
| 34 | 반영(=5) | 명령을 지시서 ‘지켜야 할 것’에 명시. 판정표 0절 5 |
| 35 | 반영(가안) | 정적 매입 견적도 KRW로 변환, 분기 조건은 ‘매입 통화 ≠ 판매 통화’, 부대비의 단일 통화 분기. DESIGN 3.3·4.2 |
| 36 | 반영(개정 3에서 H8·H14-3으로 정정) | `preview(…, opts)`, 시드 출처 명시·시험, `dutyFor` 서명 고정. 실행기의 :118·:129 정정은 H8 결정 기여(판정표 6.1, H14-3의 분기)로 대체. DESIGN 1·3.3·3.4, 판정표 6.2 |
| 37 | 반영(=29·31) | 0062 3·6절 |
| 38 | 반영 | rules-3 로더 분기·스키마는 TASK-0065로. 0062는 타입과 검사기 반례(문장 단언)만. 0062 1절 |
| 39 | 반영 | 변형 1을 ‘rules-3이 고정 환율을 씀’으로 교체, rules-2 로그 변형 추가, 원래와 같은 변형은 이유 보고. 0062 변형 표 |
| 40 | 반영 | 0063·0064 옛 값 불변은 저장소 밖 덤프 `cmp` 절차, 시험은 ‘새 층이 꺼진 설정’으로. 0063·0064 지켜야 할 것 |
| 41 | 반영(=46) | 0064 ‘캠페인 끝’ 시험 |
| 42 | 반영(개정 3에서 R25로 정정) | `receivableSchedule`, `openInvoices` 남은 금액, `OVERDUE` 전이, `nextReceipt`는 지금 규칙 유지(`operations.ts`는 0064 범위 밖), `progress.ts`·UI는 범위 밖 발견. 0064 2·3절 |
| 43 | 반영 | 추첨 키 = 판매 견적 ID, 공통 난수 시험·변형, 판정표 2절에 공통 난수 명시 |
| 44 | 반영(=42) | `upcomingPayments`는 손대지 않음 |
| 45 | 반영(개정 3에서 R25로 정정) | `nextReceipt`는 지금 규칙 유지. `operations.ts`는 0064의 고칠 수 있는 파일이 아니다(R25 b) |
| 46 | 반영 | ‘캠페인 끝’ 시험을 엔진 수준 단언으로, 분석값은 경로 5 실행기 시험으로 |

- 기각은 없다. 대체: 3·26번(H5-2 괄호는 H7로 정정), 5번(0단계는 H9의 TASK-0062a로), 개정 3에서 6번(H6), 7번(m18·H14-2), 12번(H11), 36번(H8), 42·45번(R25). 선택지가 있던 항목은 이렇게 골랐다: 9번은 지렛대 삭제, 11번은 B안(보이는 등급), 24·27번은 H1(G=2), 35번은 가안.
- 허브 확인이었던 Q-A·Q-B는 허브 결정 H6·H11로 닫혔다.

### 허브 재검토 64건 처리표(개정 2)

번호는 `docs/ai/design/path3-price-risk-2026-10/REREVIEW-HUB-2026-10-16.md`의 번호다. 다섯 문서(판정표·설계·TASK-0062~0064)에 같은 표를 붙였다. 46건 표의 3·4·5·26번도 함께 정정했다.

| # | 처리 | 반영한 곳과 이유 |
|---|---|---|
| R1 | 반영(H8) | rules-3 결정 기여 식(판매 − 운임 − 관세 − halfUp(매입원 × 100 ÷ 그날 참고 환율))을 정렬·양수 거름·늦은 편 검사에 씀. 판정표 6.1, 0절 2 비교 대상 |
| R2 | 반영(H8) | 추가 환전은 ‘매입 통화 KRW ≠ 판매 통화’인 직접 무역 후보에만, 건너뜀 검사는 :129 뒤. 판정표 6.1 |
| R3 | 반영(H7) | H5-2 괄호는 H7로 정정됨을 판정표 2절과 46건 표 3·26번에 적음. 허브가 이미 결정해 Q-C는 따로 두지 않음 |
| R4 | 반영(H6-4) | `contractRiskReport`는 rules-2 상태도 받고 1,300 고정·`fx` = 0. R0 시험(realized = USD 기여 × 1,300). DESIGN 3.4, 0062 4절·시험 |
| R5 | 반영(H10-4, a안) | D 손잡이 삭제. D 실패는 손잡이 없이 보고. 판정표 5.1·5.3 |
| R6 | 반영(H10-5) | 판매 마진 손잡이의 자료 경로·식·범위(k ∈ −2~+3)·두 rule_set 같은 k·시작값(TASK-0065 병합값, 고정 기록 줄). 판정표 5.2 |
| R7 | 반영(H10-3) | 어긋남 우선순위, 회마다 전체 재측정, 변형 사이 방향 충돌은 실패. 판정표 5.1 |
| R8 | 반영(H10-7) | 0절 2에 ‘5절 전체’와 동결 문장. 판정표 0절 |
| R9 | 반영(H10-6, a안) | 지연 수금을 L1 < 5% 순서 두 번째에. 노출 경고 문장을 그 자리로 고침. 판정표 5.3 |
| R10 | 반영(H10-8) | 시작 프로필 전체를 숫자로(파손 등급·p_claim, 국가 × 품목 세율, 거래처 등급 배정, 등급 확률). 고정 목록에 ‘5.2에 없는 모든 값’. DESIGN 6절, 판정표 5.2 |
| R11 | 반영(H10-2) | 범위 끝 자르기 규칙과 ‘원소 하나라도 끝이면 전체 끝’. 판정표 5.1 |
| R12 | 반영(H9) | 0단계를 0062에서 지우고 선행을 TASK-0062a로. 골든 파일·검사기를 손대지 않을 파일로, `--write` 금지. 0062 머리·손대지 않을 파일 |
| R13 | 허브 몫(H9) | 해시 범위(run + 마지막 상태, 로그 포함)는 TASK-0062a가 정함. 판정표 0절 5와 DESIGN 2절 2에 그 범위를 적음 |
| R14 | 반영(H9) | 골든 묶음에 대표 변형 5개 × 5시드(TASK-0062a). d03 정책이 안 지나가는 경로의 단위 시험 표(잠정, 0062a 범위 표로 대조). DESIGN 2절 2. ‘바이트 불변’ 문장을 ‘골든 묶음의 실행 결과와 마지막 상태가 같다’로 |
| R15 | 반영(H13) | `dutyFor`에 `knownThroughDay`를 더한 서명과 호출처 표. 0063에 ‘도착 공지 기준일’ 시험. DESIGN 3.3, 0062 3절, 0063 시험 |
| R16 | 반영(H8) | R1과 같은 결정 기여. 검토가 제안한 ‘pnlKrw > 0 거름’ 대신 H8의 USD 센트 식을 쓴다(주선과 한 단위로 정렬되기 때문). 부호 일치 시험은 판정표 6.2 |
| R17 | 반영(H13) | `contractReport(s, contract, currency = contract.currency)`, `campaignSummary`는 그 통화에 분개가 있는 계약을 셈. rules-3 d03 ⑤ J7(옛 정의)·⑦에 진단 표지. DESIGN 3.3, 판정표 3.1 |
| R18 | 반영(H13, 가안) | `PURCHASE-` 분개만 창을 실패일까지 넓힘. 시험 문구를 창에 맞춤. DESIGN 3.3, 0062 3절·시험 |
| R19 | 반영(H6) | 0062 원칙의 단정 문장을 H6의 닫힌 목록과 조건으로 바꿈. 0062 원칙 |
| R20 | 반영(H6-2) | 평가일 = 상태가 마지막으로 마감한 날(도중이면 오늘), 평가일 뒤 날짜의 환율 금지, 화면 허용 목록에 조건부로 더함, ‘미래 누설 없음’ 시험. DESIGN 2절 3·3.4, 0062 시험 |
| R21 | 반영(H6-4) | R0은 `--risk R0` 출력에서만, 1,300 고정. 골든 명령 출력에는 들어가지 않음. 판정표 2절·L0, DESIGN 3.4 |
| R22 | 반영(H7, b안) | 46건 표 3·26번 정정. 허브가 H7로 결정해 Q-D는 따로 두지 않음 |
| R23 | 반영(H8) | R1·R16과 같음 |
| R24 | 반영(H13) | R15와 같음. 실패 기록의 공지 기준일은 수락일로 표에 적음 |
| R25 | 반영(H13, b안) | `nextReceipt`는 지금 규칙 유지. ‘부분’ 시험의 `nextReceipt` 줄, ‘다음 수금’ 시험, 변형 8을 지움. `operations.ts`를 0064 고칠 수 있는 파일에서 뺌. 알려진 한계는 범위 밖 발견으로 보고 |
| R26 | 반영(H9) | R12와 같음 |
| R27 | 반영(H11, a안) | 환율 걸음 150~275, 시작 250, ECB 실측 근거와 ‘게임 가정’ 표지, 진단 B(경계 닿은 판), 교사용 문장. 판정표 5.2, DESIGN 3.2 |
| R28 | 반영(H11) | 클레임 확률 300~1200, 화장품 900·조미김 500, ‘게임 가정’ 표지, 보험·운송인 청구 회수 없음 가정. 판정표 5.2, DESIGN 5.1 |
| R29 | 반영(H12) | 측정 전 예측(L1 하한·L2 R0→R1 실패 가능)과 진단 F(`components.fx < 0` 비율·중앙값). 판정표 3.2 |
| R30 | 반영(H11) | 등급별 지연 범위·시작값·부분 몫, 거래처 배정표, Atradius 참고, 이자·대손 없음 가정. 판정표 5.2, DESIGN 5.2·6절 |
| R31 | 반영(H8) | R1과 같음 |
| m1 | 반영 | 짝 시험의 명령 ID, `planState` 짝, 결과 색인, (편 × 직원) 시도마다 다시, usdCap은 `cashNeedByCurrency` USD. 판정표 6.1 |
| m2 | 반영(H13) | `usdLotKrw(config, s?)` 선택 인수, rules-3에서 없으면 예외, 실행기 호출은 경로 5. 0062 2절, 판정표 6.2 |
| m3 | 반영 | react: 아침은 지금 식, 추가 환전은 하되 창은 ‘오늘’. `NO_FX`는 ACCEPT만. ‘앞 7일 원화’ 정의. 판정표 6.1 |
| m4 | 반영(H6-2) | 평가일 정의(정상 종료·실패 종료·도중). 실패 실행의 열린 계약도 분모에. 판정표 2절, DESIGN 3.4 |
| m5 | 반영 | 열린 계약 정의(채권·운송 중·출항 전·관세 예상·미지급), 출항 전 계약은 예약 편 기준. DESIGN 3.4, 판정표 2절 |
| m6 | 반영 | 열린 계약 `realized = 현금 줄 + 남은 흐름 × 평가일 환율`, `openFixedRateKrw`의 뜻. DESIGN 3.4 |
| m7 | 반영 | ‘열린 계약’ 시험과 변형 13(고정 환율 평가). 0062 시험·변형 |
| m8 | 반영 | 시드별 손실 비율 정의와 0/0 시드는 m에서 뺌. 판정표 2절 |
| m9 | 반영(H11) | 5.2 숫자를 허브 확정값으로 넣고 Q-B를 닫음. 판정표 5.2·8절 |
| m10 | 반영(H10-9) | J1 멈춤 뒤 다시 재기 규칙. 판정표 5.1 |
| m11 | 반영 | L2 행 ‘①·② 둘 다 실패’, 하나만 실패면 손잡이 없이 실패, 방향 ‘올리는 쪽’ 명시. 판정표 5.3 |
| m12 | 반영(H13) | 새 인수는 선택 인수, `contractReport`의 `contribution`은 넘긴 통화 몫. 0062 원칙·3절 |
| m13 | 허브 몫(H9) | 검사기의 실패 경로 시험은 TASK-0062a 범위 |
| m14 | 반영 | 0063·0064에 골든 검사기 종료 코드 0을 따로 확인, 진단용 d03 출력 저장과 `compare`. 0063·0064 지켜야 할 것 |
| m15 | 허브 몫(H9) | `review_checks.sh` 넣을 자리·출력 위치·병렬은 TASK-0062a 범위 |
| m16 | 반영(H13) | 자금 예약의 과세가격 환율일 = 수락일, 시험 ②. DESIGN 3.3 표, 0062 시험 |
| m17 | 반영 | 관세 과세가격 시험 ②③(늦은 편 미리보기, 예약 = 도착). 0062 시험 |
| m18 | 반영(H13) | 과세가격 가정 문장을 협정 제1·8·9조, 관세법 제18조로 고쳐 교사용 자료 목록에. DESIGN 3.3 |
| m19 | 반영(H13) | 경과 규정 생략을 가정으로 적고 v2 후보로. DESIGN 4.1 |
| m20 | 반영(H13) | ‘정시 계약’ = 납기 안 도착 편(`lateOnNextSailing === false`). 0063 시험에 늦은 감액 0 단언. DESIGN 4.1, 판정표 진단 T, 0063 |
| m21 | 반영(H13) | 시행일 순 누적 적용 규칙과 겹침 시험. DESIGN 4.1, 0063 1절·시험 |
| m22 | 반영(H6) | 남은 흐름에 관세 예상(수락일 과세가격 × 평가일까지 공지된 세율). DESIGN 3.4 |
| m23 | 반영 | rules-3에서 `opts` 없으면 `rowCurrency(config, 'BUY')`, ‘미리보기 기본값’ 시험. DESIGN 3.4, 0062 4절·시험 |
| m24 | 반영 | `contributionPerPrepPtMinor`에 같은 주석, 경로 11에서 쓰지 않게. DESIGN 3.4, 0062 4절 |
| m25 | 반영 | rules-3 `schedule`의 모든 줄에 `currency`, 시험. DESIGN 3.4, 0062 |
| m26 | 반영(H13) | m16과 같음 |
| m27 | 반영(H13) | m16·m17과 같음. 변형 9 문구를 새 규칙에 맞춤 |
| m28 | 반영(H13) | m2와 같음 |
| m29 | 반영(H6) | R19와 같음 |
| m30 | 반영 | 원화 매입 약정은 저장하지 않고 ‘더하지 않는다’로 해석함을 0062 3절에 명시. 새 칸이 필요한 기록은 형식 7 묶음 |
| m31 | 반영 | `SUPPORTED_RULES_VERSIONS`는 `types.ts`, 프로필 읽기 `loadRiskProfile`·`riskProfiles`는 `scenario.ts`. 0062 1절·고칠 수 있는 파일 |
| m32 | 반영(H11) | 큰 손상 가중치 1000~2000, 시작 = 상한, 내리는 쪽 전용. 판정표 5.2 |
| m33 | 반영(H10-1) | 1회 = 한 단위. 46건 표 4번 정정 |

- 기각은 없다. 허브 몫으로 넘긴 것 3건(R13, m13, m15: TASK-0062a 범위).
- 검토 제안과 다르게 고른 것: R16·R23·R31은 검토 예시(‘pnlKrw > 0 거름’) 대신 허브 결정 H8의 USD 센트 결정 기여를 썼다. 주선과 같은 단위로 정렬되고 rules-2에서 지금 식과 같아지기 때문이다.

### 허브 2차 재검토 66건 처리표(개정 3)

번호는 `docs/ai/design/path3-price-risk-2026-10/REREVIEW2-HUB-2026-10-16.md`의 번호다(S1~S19, n1~n47). 허브 결정은 `HUB-DECISIONS-2026-10-16.md`의 H14다. 다섯 문서(판정표·설계·TASK-0062~0064)에 같은 표를 붙였다. 46건 표의 6·7·12·36·42·45번도 함께 정정했다(n32·n33).

| # | 처리 | 반영한 곳과 이유 |
|---|---|---|
| S1 | 반영(H14-5) | 설계 3.4 표의 3·4·6·8단계를 단계별로 풀어 적음: 도착 전 관세 = 호출처 표의 도착 전 값, 출항 전 부대비 0, 인도 전 클레임 0, 수금은 원장 `RECEIPT-`로만(`collectionPlan`을 부르지 않음). 0063 시험 ‘미래 누설 없음(관세·부대비)’·변형 8·9, 0064 시험 ‘미래 누설 없음(클레임)’·변형 8·9 |
| S2 | 반영(H14-6) | 설계 3.3 호출처 표에 `contractRiskReport` 행, ‘여섯 곳’. 1단계는 날짜만 옮기고 관세 차이는 모두 3단계가 맡음(‘그때’를 닫음). 0062 3절 |
| S3 | 반영(H14-5) | `contractRiskReport`는 `reports.ts`, 환율은 `risk.ts`에서 import한 `referenceRate`로만. 누설 시험을 전제·대조·양성 대조의 세 단계로, `vi.mock('./risk')`로 모듈 경계에서. 설계 3.4, 0062 4절·시험 표 |
| S4 | 반영(H14-5) | 9단계 `open_valuation`은 구성상 0이고 `open` 표지만. 0064 5절을 ‘평가일까지 들어오지 않은 수금 줄은 8단계에서 평가일 환율’로 고침. 0064 시험 ‘연체 미수 평가’·변형 10 |
| S5 | 반영(H14-1) | `FOCUS` = 모든 변형에서 직접 무역 `good_id = COSMETICS`만. TASK-0065는 (나)·(다) rule_set에 `COSMETICS`를 둔다. 판정표 0절 2·6.2, 설계 6절 |
| S6 | 반영(H14-2) | `krwToUsdMinor`·`usdToKrwMinor`·`divHalfAway`(설계 3.3, 0062 2절). 과세가격 ×100(설계 3.3, 0062 3절·시험 ①③), 산술 상수 시험, R0 등식 = `contribution(센트) × (baseKrwPerUsd ÷ 100)`과 대상(미지급 없는 `COMPLETED`). 0062 변형 19 |
| S7 | 반영(H14-3) | `referenceEstimate` 식 고정(설계 3.4, 0062 4절), 결정 기여의 판매 = 늦은 감액 전, H8 시험 (i) 부호 (ii) 크기 (iii) (가)·R1 ≥ (가)·R0의 50%. 판정표 6.1·6.2 |
| S8 | 반영(H14-4, 검토의 (a)안) | `MARGIN_BUFFER` = `10 × D ≥ 판매(늦은 감액 전)`. rules-2·rules-3 모두 정의된다. 판정표 0절 2·6.2 |
| S9 | 반영(H14-10) | 설계 2절 2 표의 ‘지연 대응’ 행: `RESPOND_TO_DELAY`는 rules-2 자료로 닿지 않음, 지킬 rules-2 경로 없음, 인용은 `src/content/scenario.ts:309-321`·`engine.ts:134-151` |
| S10 | 반영(H14-8) | 고정 기록 줄과 0절 1을 H14-8 문장으로(새 rule_set·rules-3의 d03·`runSuite`·`run.mjs` 실행 금지, R0 포함), TASK-0065는 견적 수·단위 시험만, 동결 = 판정표 + 설계 6절, 고정 기록에 ‘위험 프로필 = 설계 6절’ 칸 추가. `docs/DECISIONS.md:1632` 문구 맞춤은 허브 몫 |
| S11 | 반영(H14-7-1) | 판정표 5.1 ‘돌릴 손잡이가 없는 어긋남’: 그 자리에서 실패 확정, 우선순위에서 건너뜀, 회는 다음 어긋남에, 없으면 조정 끝 |
| S12 | 반영(H14-7-2) | 판정표 5.1 ‘닿지 않는 조건’, 5.3 J7·J4d 행을 (나)·(다)만으로. (가)의 J7·J4d는 손잡이 없이 실패 |
| S13 | 반영(H14-9) | 설계 6절: (나)·(다) 새 거래처 ID 넷(화장품 판매처 두 도시 B, 김 판매처 두 도시 C), (가) 배정 그대로, 개정 2의 사실과 다른 문장 정정. 판정표 1.1. 진단 G는 넣지 않음(검증 메모에서 선택 사항, H14에 없음) |
| S14 | 반영(H14-7-4) | 판정표 4절: 표본 밖 1 뒤 손잡이 조정 없음, 표본 밖 1의 실패 = 최종 실패, 표본 밖 2는 J1 엔진 결함 재측정만 |
| S15 | 반영(H14-6) | 자금 예약 tariffDay 규칙, 수락 자금 검사 = 다음 첫 편(plan 편 무시), 실패 기록 = `listSailings(수락일 + 1)[0]`. 편이 없으면 `tariffDay = knownThroughDay`(아래 ‘허브 결정을 넘어 고른 것’ ①). 0063 시험 넷·변형 10 |
| S16 | S5와 같음 | S5 행 |
| S17 | 반영(H14-10) | 판정표 3.2 L2의 주어 = 기준 회사(`MAX_CONTRIBUTION`), 5.3 L2 행 |
| S18 | S7과 같음 | S7 행 |
| S19 | S12와 같음 | S12 행 |
| n1 | 반영(H14-5) | 평가일 = 실패일(`operations.failure.day`) / `campaignDays` / `s.day`. 0062 시험 ‘실패 종료 평가일’, 변형 18. 식은 검토의 `closedDays.at(-1)` 대신 H14-5 문장을 따랐다 |
| n2 | 반영(H14-2) | S6과 같음. 시험은 13 대신 `baseKrwPerUsd ÷ 100` |
| n3 | 반영 | 0062 ‘열린 계약’ 시험의 전제(남은 흐름 ≠ 0, 평가일 환율 ≠ 1,300·수락일 환율), 변형 16 |
| n4 | 반영(H14-5) | 관세 예상은 도착 전 계약만, 도착 뒤 미지급 관세는 미지급 잔액으로만. 분류는 겹치지 않음(n46). 판정표 2절, 설계 3.4, 0062 4절 |
| n5 | 허브 몫 표시 | 판정표 2절·설계 2절 5에 ‘SPEC 10.4 예외 문장은 허브 몫’ 줄(H14-10 허브 후속) |
| n6 | 반영 | 설계 3.4 표지 문구를 H6-3과 같게, 화면은 rules-3 상태에서만. 46건 6번 정정, 0064 ‘H6 닫힌 목록 밖에서는 더하지 않는다’ |
| n7 | 반영(H14-1) | `EXPAND`의 조건문 삭제, `MAX_CONTRIBUTION` 실행 키를 씀. 판정표 1.3·6.2 |
| n8 | 반영(H14-3) | 결정 기여는 `IDLE`을 뺀 모든 수락 정책(`NO_FX`·d03 변형 포함), 원화 환전 규칙만 `NO_FX`에서 끔. 판정표 6.1 |
| n9 | 반영(H14-2) | 반올림은 `divHalfAway` 하나(0.5는 0에서 먼 쪽). `market.ts:6`의 `halfUp`은 쓰지 않음 |
| n10 | 반영(H14-3) | 판정표 6.1 결정 기여를 매입 견적 통화로 분기, 판매 = `sell.unitPriceMinor × q` |
| n11 | 반영 | 아침 환전 = `operations-policy.ts:64-75` 그대로, `krwShort ≤ 0`이면 ACCEPT만, KRW 가용 = `fundsPosition(…, 'KRW').available`. 판정표 6.1 |
| n12 | 반영 | 설계 2절 2의 취소·USD 미지급 행 정정, 0062 시험 ‘취소(rules-2)’ 추가 |
| n13 | 일부 반영(나머지 허브 몫) | 설계 2절 2: 대조는 TASK-0062a 병합 뒤 세션 A, 그 전에는 0062를 시작하지 않음. 0062a 범위 보고에 세 항목(방향별 환전, USD 미지급 실행 수, `FREIGHT-RELEASE` 실행 수)을 넣자는 제안은 0062a가 허브 문서라 허브에 보냄 |
| n14 | 반영(H14-10) | 골든 진단은 `--dump` 전후 diff(설계 9절, 0062~0064 ‘지켜야 할 것’). ‘골든과 같은 인수의 d03 출력’을 지움 |
| n15 | 반영 | 설계 10절 ‘`review_checks` 두 줄, 검사 16종’ |
| n16 | 반영 | 손대지 않을 골든 경로 셋 + 진입 모듈, 작업 전 종료 코드 0 확인(아니면 멈춤), 완료 조건 `git diff --stat` 빈 값, `<BASE>` = 승인·0062a 병합·대조를 모두 담은 커밋 |
| n17 | 반영(H14-7-3) | 같은 폭 손잡이는 모든 원소가 범위 안에 남는 가장 큰 폭으로 줄임(예시 포함). 의류 `p_claim_bp` 400 → 500(LOW = 500, MID = 900) |
| n18 | 반영(H14-7-5) | 판정표 5.1 ‘엔진 결함의 정의’ |
| n19 | 반영(H14-10) | 프로필 `basis`·`status` 표지(설계 6절), 로그·`tariffSchedule`에 ‘가상 세율’, 0063 ‘사건 범위’ 시험은 세율을 다르게 바꾼 프로필 사본 |
| n20 | 반영(H14-10) | 판정표 3.1에 진단 F·B 행, 3.2에 묶음·대상 |
| n21 | 반영 | 지연 수금 손잡이 ‘올리는 쪽 한 단위 전용’(H14-7-6), 용어를 `p_partial_bp`·`partial_bp`로 나눔, 양방향 검사(H14-10), 마른김 행은 `goods`에 있을 때만 |
| n22 | 반영(H14-6) | S2와 같음. 0063 ‘항등식’에 열린 운송 중 계약 |
| n23 | 반영(H14-2) | S6과 같음 |
| n24 | 반영(H14-6) | rules-3 직접 무역 `preview`는 `goodId`가 없으면 예외(0062 4절·시험), 0063 시험 ‘`goodId` 누락’·변형 11, 판정표 6.2 실행기 시험(정책 관세 = `quotePreview` 관세) |
| n25 | 반영 | 0062 시험 ‘계약 보고서 통화’, 변형 17 |
| n26 | 반영(H14-10) | `SALES_ALLOWANCE` = `income`(매출 차감), rules-3 `contractReport` 순매출에 더함. 0064 1절·시험 ‘클레임 계약 보고서’·변형 11, 판정표 3.1 |
| n27 | 반영(H14-10) | 판정표 6.2 ‘진단 출력’ 행, 설계 10절 실행기 목록 |
| n28 | 반영(창 정의는 허브 몫) | 설계 3.3: SPEC 423의 접두어 목록·창 정의는 허브 몫. 칸 이름·화면 제목 어긋남은 0062 결과 보고 ‘범위 밖 발견’과 경로 11 |
| n29 | 반영(H14-10) | OVERDUE는 날 d의 마감에서 수금 처리 뒤에 평가, D+1에 `OVERDUE`·`overdueDays = 1`. 0064 2절·시험 ‘지연’·‘부분’ |
| n30 | 반영 | `nextReceipt` 한계를 연체(지연·부분) 전체로 넓힘, `money-alerts.ts:19`. 설계 5.2, 0064 3절 |
| n31 | 반영(H14-10) | n14와 같음 |
| n32 | 반영 | 46건 6·7·36·42·45번 정정, 이 표 머리 문장, 46건 표 아래 ‘대체’ 문장 |
| n33 | 반영 | n32에 12번을 더해 정정 |
| n34 | 반영(H14-6) | S15와 같음. 열린 계약의 관세 예상 tariffDay는 자금 예약 규칙의 날 |
| n35 | 반영 | S9와 같음. TASK-0062a 범위 표 대조는 병합 뒤(H14-10) |
| n36 | 반영(H14-10) | n14와 같음(d03 명령 대신 `--dump`) |
| n37 | 반영(H14-10) | n29와 같음 |
| n38 | 반영(H14-10) | n27과 같음 |
| n39 | 반영 | 설계 2절 3: 화면은 `contractRiskReport` 포함, 실행기 정책은 판정표 6.2 목록만 |
| n40 | 반영(H14-10) | 0063·0064 고칠 수 있는 파일에 `tools/test_validate_data.py`(새 반례 시험 추가만) |
| n41 | 반영(H14-10) | 프로필에 없는 품목·거래처·(도착국, 품목)은 실행 중 예외(0063 1절, 0064 1·2절), 검사기 양방향(설계 6절, 0062 1절). 관세의 ‘시나리오 고정 세율 대체’를 지움 |
| n42 | 반영(H14-5) | 0062 변형 8의 전제(수락일·도착일 환율 주가 다른 계약), 변형 13의 전제(평가일 환율 ≠ 1,300) |
| n43 | 반영(H14-5) | S3과 같음 |
| n44 | 반영(H14-2) | S6과 같음. 대상 `COMPLETED` |
| n45 | 반영(H14-6) | 0063 ‘도착 공지 기준일’을 도착일 아침 공지·지연 0으로 |
| n46 | 반영(H14-5) | 판정표 2절 분류: 열린 / 완료(열리지 않은 `COMPLETED`) / 취소(열리지 않은 `CANCELLED`) |
| n47 | 반영 | ‘부분 수금 확률(`p_partial_bp`)’과 ‘첫 수금 비율(`partial_bp`)’, `claims.minor.weight_bp`·`claims.major.weight_bp`. 판정표 5.2, 설계 5.1·5.2, 0064 2절 |

- 기각은 없다. 허브 몫으로 둔 것: n5(SPEC 10.4), n28의 SPEC 423 창 정의, n13의 0062a 범위 보고 세 항목, S10의 `docs/DECISIONS.md:1632` 문구, 그리고 설계 2절 2 표와 TASK-0062a 범위 표의 대조(0062a 병합 뒤 세션 A, H14-10).
- 원자료의 고칠 방향을 따르지 않은 것: S13의 진단 G(검증 메모가 선택 사항으로 봄, H14에 없음), n1의 `closedDays.at(-1)` 식(H14-5의 `operations.failure.day` 문장을 따름).
- **허브 결정을 넘어 고른 것(허브 확인 바람).** ① 편이 없을 때 `tariffDay = knownThroughDay`를 자금 예약 밖(미리보기·수락 자금 검사·실패 기록)에도 씀(S15 검증 메모 권고). ② 1단계 `schedule`은 날짜만 옮기고 세율 차이는 모두 3단계가 맡음(S2·n22의 ‘그때’를 닫는 가장 단순한 규칙). ③ 관세 표 누락도 예외(H14-10의 ‘프로필에 없는 품목’을 관세에도 적용, n24·n41). ④ 의류 `p_claim_bp` 400 → 500(n17 고칠 방향, 동결 범위인 설계 6절의 값). ⑤ `referenceEstimate`의 USD 매입 방어 분기. ⑥ 새 거래처 ID 네 개의 이름. ⑦ 0062 시험 ‘취소(rules-2)’(n12의 선택안). ⑧ `goodId` 예외를 0062에서 구현하고 0062 ‘미리보기 기본값’ 시험을 `{ goodId }`만 넘기게 바꿈(H14-6을 0062의 `dutyFor` 서명과 함께 둠).
- **개정 3 보충(허브 알림, TASK-0062a 확정본 `7cf3e5e`).** 골든 범위가 H9보다 넓어졌다(rules-2 탐침 해시, 규칙 1 400회, 두 묶음의 저장 왕복). 판정표 0절 5와 설계 2절 2·9절에 범위를 적고, ‘선택 인수 원칙이 탐침으로 시험된다’를 설계 2절 2에 더했다. 0062~0064의 손대지 않을 파일에 골든 파일 일곱(`tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`)을 넣고, 완료 조건의 `git diff --stat` 경로도 맞췄다. 진단 절차는 허브의 통일 문장으로 바꿨다. 400회 `run`의 수작업 `cmp`는 0062~0064에서 지웠다(검사기가 규칙 1 상태까지 지키고, 허브가 검수 때 따로 돌림). 0062에서도 지운 것은 허브 알림(0063·0064)을 같은 이유로 넓힌 것이다.
