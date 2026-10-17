# TASK-0062 직접 무역 위험 ①: 원화 매입·달러 판매와 참고 환율 경로 (승인, 개정 3e)

- **지위: 승인(허브, 2026-10-16). 실행할 수 있다.** 세션 A 초안(2026-10-14, 개정 1·2·3·3c 2026-10-16) 위에, 허브가 Codex 전 사전 확인(시제품으로 수행 가능성·변형 효과를 실측)에서 찾은 고침을 개정 3d로, 그 고침 문구를 다시 읽기 전용으로 검토해 찾은 고침을 개정 3e로 넣었다. 처리표는 맨 끝 ‘허브 사전 확인 처리표(개정 3d)’와 ‘허브 재검토 처리표(개정 3e)’다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행(모두 충족): **TASK-0062a(rules-2 골든) 병합 `c4d6286`**, 판정표 승인 `9ce98fe`, 설계 2절 2 표와 TASK-0062a 범위 표의 대조(세션 A 개정 3b).
- **`BASE`는 작업 트리를 만든 커밋, 곧 이 승인본을 담은 개발 브랜치 커밋이다**(검토 n16). 지시서가 자기 커밋 해시를 적을 수 없으므로, 작업을 시작할 때 `git rev-parse HEAD` 값을 결과 보고에 적고 그 값을 BASE로 쓴다. Codex는 커밋하지 않으므로 작업 뒤에도 HEAD가 BASE다. 기준 비교(`review_checks.sh --check`)와 완료 조건 5는 이 BASE로 한다.
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
- `data/market_rules.json`에 `risk_profiles` 배열과 시작 프로필 하나를 더한다. **값은 설계 6절의 시작 프로필 그대로다**(김 행과 (나)·(다) 새 거래처 넷은 TASK-0065가 더한다, H15 F7). 이번에 엔진이 읽는 것은 `fx`뿐이다. 나머지 묶음은 자료 꼴과 검사만 넣는다.
- 프로필 읽기 함수 `loadRiskProfile(id)`와 `riskProfiles()`를 `src/content/scenario.ts`에 둔다(자료를 읽는 곳이 이 파일이기 때문이다). 엔진 타입(`RiskProfile`)으로 바꿔 돌려준다. `RiskProfile` 타입과 `loadRiskProfile`은 다섯 묶음(`fx`·`tariff`·`surcharge`·`claims`·`collections`)을 모두 변환한다. 이번에 엔진이 읽는 것은 `fx`뿐이다(H15 O14).
- 스키마(`schemas/` 해당 파일)와 `tools/validate_data.py`에 설계 6절의 검사를 넣는다.
  - 반례 시험은 기존 `MarketRulesTest`와 같은 방식으로 만든다. 자료 사본에서 값을 바꾸고 `check_market_rules`만 부른 뒤, 그 검사의 문장 자체를 단언한다(스키마 `shape`는 부르지 않는다). 반례: 등급 확률 합 ≠ 10000, 손상 두 층 가중치 합 ≠ 10000, 최소 > 최대, 품목 자료에 없는 품목, 시장 자료에 없는 거래처, `start_krw_per_usd` ≠ `fx_krw_per_usd`, 그리고 반대 방향 셋(운영 rule_set(`operations.market_rules_ref`의 # 뒤 id, `base_scenario_id` 상속 포함)의 판매 거래처 `trade.goods[].sell_counterparties[].counterparty_id`가 `by_counterparty`에 없음, `trade.goods` 품목이 `claims.by_good`에 없음, (판매 도시 나라, 품목)이 `tariff.base`에 없음. 설계 6절, 허브 결정 H14-10).
  - 프로필의 `basis`·`status` 표지(설계 6절)를 그대로 옮긴다.
  - **검사 범위(허브 사전 확인).** 0~10000 범위는 확률·비율 칸에만 건다: `fx.step_bp`, `tariff.base[].rate_bp`·`tariff.min_bp`·`tariff.max_bp`, `surcharge`의 `*_bp`, `claims.by_good[].p_claim_bp`, `claims.minor`·`claims.major`의 `weight_bp`·`min_bp`·`max_bp`, `collections.grades[]`의 `p_*_bp`, `collections.partial_bp`. `tariff.step_bp`는 부호 있는 정수 짝으로 −10000 ≤ 하한 ≤ 상한 ≤ 10000을 본다(동결 프로필의 `[-200, 800]`가 통과해야 한다). 날 수(`tariff.lag_days`, `collections.late_min_days`·`late_max_days`)와 `tariff.max_changes`는 0 이상 정수이고, 짝은 하한 ≤ 상한이다. `fx`는 `min_krw_per_usd ≤ start_krw_per_usd ≤ max_krw_per_usd`.
  - 반대 방향 검사는 `risk_profiles`의 **모든 프로필**에 건다(지금은 시작 프로필 하나다. 아직 시나리오가 `operations.risk`로 프로필을 고르지 않기 때문이다).
  - 시험 파일은 `tools/test_validate_data.py`다. **기존 `test_goods_counts`의 3품목 경우(count=3)는 고정 자료를 함께 고친다**: 새로 더하는 품목의 `claims.by_good` 1행과 (판매 도시 나라 × 새 품목)의 `tariff.base` 행을 같은 사본의 모든 프로필에 넣는다. 단언(`assertEqual(errors, [])`)은 그대로 둔다. 다른 기존 시험은 고치지 않는다. 반대 방향 검사를 느슨하게 만들어 이 시험을 맞추지 않는다.

### 2. 참고 환율 경로와 환전

- 새 파일 `src/engine/risk.ts`에 `drawAt(seed, stream, index)`와 `referenceRate(config, seed, day): number`(원/달러, 정수)를 둔다. 설계 3.2의 식 그대로다.
  - 주차는 시세 공개일 기준이다(`publish.first_day`, `interval_days`). 공개일 사이에는 값이 같다. 마지막 공개일 뒤는 마지막 값.
  - `drawUniform`을 커서 상태 없이 부르는 순수 함수다(흐름 `FX-REF`, 번호 = 주차). **`state.rng`의 커서를 바꾸지 않는다.**
  - 위험 설정에 `FX` 층이 없으면 프로필의 `start_krw_per_usd`를 돌려준다. 위험 설정 자체가 없으면(rules-2) `config.operations.fx.baseKrwPerUsd`를 돌려준다(허브 결정 H6-4).
  - `config.operations`가 없으면(rules-1) 이 함수를 부르지 않는다. 부르면 예외다. rules-1 경로(`dutyFor`·환전·미리보기)는 `referenceRate`에 닿지 않는다(3절 `dutyFor` 분기).
- **환산 도우미 둘과 반올림 하나**(설계 3.3, 허브 결정 H14-2)를 `risk.ts`에서 내보낸다. 이 지시서의 모든 원↔달러 환산(`dutyFor` 과세가격, `referenceEstimate`, `contractRiskReport`)이 이 둘만 쓴다.
  - `divHalfAway(n, d) = sign(n) × ⌊(2|n| + d) ÷ (2d)⌋`(d > 0 정수, 0.5는 0에서 먼 쪽. `applyBasisPoints`와 같은 규칙)
  - `krwToUsdMinor(krw, rate) = divHalfAway(krw × 100, rate)`, `usdToKrwMinor(cents, rate) = divHalfAway(cents × rate, 100)`
- `exchangeAmounts(config, direction, usd, seed?, day?)`(`operations.ts:150`): 선택 인수 시드·날짜. 호출처 `operations.ts:168`은 `s.rng.seed`, `s.day`를, `readers.ts:97`(`exchangePreview`)은 오늘을 넘긴다. rules-3이면 기준 환율 r = `referenceRate(config, seed, day)`, 차감 = `applyBasisPoints(r, spreadBasisPoints)`(rules-2 설정을 만드는 `scenario.ts:503`과 같은 꼴), USD→KRW 환율 = r − 차감, KRW→USD 환율 = r + 차감이다. 인수가 없으면 지금 식(rules-2 바이트 그대로)이고, rules-3에서 인수 없이 부르면 예외다(설계 3.2, 원칙 4). 로그 문장의 ‘게임용 고정 환율’은 rules-3에서 ‘오늘 참고 환율’로 쓴다. rules-2 문장은 그대로다.
- 고정 환율로 묶음 금액을 세는 함수들(설계 3.2): `usdLotKrw`(`operations.ts:225-226`), `paymentDefaultStatus`의 `lotsToSurvive`·`lotsToClearAll`·`krwToUsdRequiredMinor`(`:238-253`), `weeklyBottleneck`의 `wageUsdLotsPerWeek`(`readers.ts:202`).
  - **새 선택 인수는 `usdLotKrw(config, s?: GameState)`의 `s` 하나다.** 없으면 지금 고정 환율 식(rules-2 바이트 그대로)이고, rules-3에서 없으면 예외다. rules-3 값 = `lotUsdMinor × (그날 USD→KRW 환율) / 100`(위 환전 식).
  - `paymentDefaultStatus(s, config, day)`와 `weeklyBottleneck(s, config, …)`는 이미 상태를 받으므로 **서명을 바꾸지 않고** 안에서 `usdLotKrw(config, s)`를 부른다. 인수 없이 부르는 `processPaymentDefault`(`operations.ts:259`)와 화면(`money-alerts.ts`)이 rules-3에서 예외를 내지 않게 하기 위해서다. `krwToUsdRequiredMinor`는 그날 KRW→USD 환율을 쓴다.
  - **환율 날짜는 `s.day`다**(`paymentDefaultStatus`의 `day` 인수가 아니다).
  - 실행기 호출(`sim/operations-policy.ts:73`)은 이번에 고치지 않는다(경로 5).
- **시드 출처(허브 사전 확인).** 상태를 받는 자리(환전, `usdLotKrw`, 자금 예약 `cashReservations`, 도착 관세, 실패 기록, 불변식, `quotePreview`, `contractRiskReport`)는 모두 `s.rng.seed`를 쓴다. `config.seed`는 상태가 없는 `preview`·`tradePreview`만 쓴다.

### 3. 원화 매입과 혼합 통화 계약

설계 3.3 그대로다. 요점만 적는다.

- **매입 통화 유도.** `rowCurrency(config, side)`(`risk.ts`)로 유도한다. 시세 행 타입(`types.ts:535`)과 `MarketBatch.rows`(`types.ts:560`)에 통화 칸을 두지 않는다. **원화 값은 `withRiskLevel` 한 곳에서만 만든다**(5절: 설정의 시세 행 매입 기준가와 정적 매입 견적). 생성기(`market.ts`)와 `marketTable`(`market.ts:100`)은 값 크기를 바꾸지 않고 통화만 `rowCurrency(config, side)`로 정한다. 그래서 rules-3 원화 매입이면 생성된 매입 견적과 시세표 매입 행이 KRW이고, 단가는 설정 행에서 이미 원 단위다.
- **수락**(`acceptTrade`, `engine.ts:308`): 매입·판매 통화가 달라도 rules-3이면 받는다. 계약 `currency`는 판매 통화다. 매입 통화는 견적에서 읽는다. 계약·화물·청구서에 칸을 더하지 않는다.
- **자금 검사**: 매입은 KRW 가용, 운임·관세 예상은 USD 가용으로 따로 본다. 부족한 통화마다 거절 문장을 따로 낸다.
- **분기 조건**: 아래 운임·관세의 장부 처리(화물 장부가에 더할지, USD 재고 분개로 쌓을지), 매출원가, 실패 기록 약정의 분기는 모두 ‘매입 통화 ≠ 판매 통화’다. 관세 금액 계산(`dutyFor`)의 분기만 ‘매입 통화가 `'KRW'`인가’다(아래).
- **운임·관세**: 혼합 통화 계약이면 화물 장부가에 더하지 않고, 같은 계약 ID의 USD 재고 분개로만 쌓는다.
- **관세: 한 함수 `dutyFor`**(설계 3.3의 서명과 호출처 표 그대로, 허브 결정 H13):
  - 서명: `dutyFor(config, seed, goodId, destinationCityId, tariffDay, knownThroughDay, purchaseMinor, purchaseCurrency, valueFxDay)`.
  - 여섯 호출처(`reports.ts:99` 미리보기, `engine.ts:319` 수락 자금 검사, `reservations.ts:33` 자금 예약, `engine.ts:1019` 도착 처리, `operations.ts:273` 실패 기록, `contractRiskReport`)가 모두 이 함수를 부르고, 넘기는 값은 설계 3.3의 표대로다(허브 결정 H14-6). **자금 예약의 `valueFxDay`는 `c.acceptedDay`다.** 자금 예약의 `tariffDay` 규칙, 편이 없을 때의 규칙(`tariffDay = knownThroughDay`), 실패 기록의 편(`listSailings(config, route, 수락일 + 1)[0]`)도 설계 3.3 그대로다.
  - **분기는 매입 통화가 `'KRW'`인지 하나다.** KRW이면 과세가격(USD 센트) = `krwToUsdMinor(원화 매입액, referenceRate(config, seed, valueFxDay))`, 관세 = `dutyEstimate(config, 과세가격)`(곧 `applyBasisPoints(과세가격, dutyRateBasisPoints)`. 개정 3에서 ×100 누락을 고쳤다). 그 밖(USD, 기존 시험이 쓰는 `'XXX'` 등)은 `referenceRate`를 부르지 않고 `dutyEstimate(config, purchaseMinor)` 그대로다. `=== 'USD'`로 분기하지 않는다(P0-ACC-01이 `'XXX'`로 이 경로를 지난다).
  - 이번에는 세율이 시나리오 고정 세율이고 `goodId`·도착지·`tariffDay`·`knownThroughDay`는 쓰지 않는다(0063이 몸통만 바꾼다). 그래도 여섯 호출처는 설계 3.3 표의 값을 넘긴다(시험 ‘관세 호출 인수’가 확인한다).
  - **위치는 `src/engine/risk.ts`다**(고정). 시험이 `vi.mock('./risk')` 통과형 첩자로 호출 인수를 본다. `risk.ts`는 `catalog.ts`의 `dutyEstimate`를 import한다(`catalog.ts`는 `money`와 타입만 import하므로 순환이 생기지 않는다). `dutyFor` 안의 `referenceRate` 호출은 같은 모듈 안이라 감싸기가 닿지 않는다. 그 환율일은 수락일(평가일 이전)이라 미래 누설 시험과 무관하다.
  - 원천 검사: 작업 뒤 `src/engine/*.ts`(시험 파일 제외)의 `dutyEstimate(` 호출은 모두 `risk.ts`의 `dutyFor` 함수 몸통 안에 있다(두 분기에서 한 번씩 불러도 된다. 개수가 아니라 위치를 본다. 정의 `catalog.ts:75`는 세지 않는다).
- **인도 때 매출원가**: 혼합 통화 계약이면 `COGS-{계약}-KRW`와 `COGS-{계약}-USD` 두 분개를 낸다. rules-2 분개 ID·금액은 그대로다.
- **출항 전 취소·편 놓침**: 지금 규칙의 금액을 통화별로 나눠 적용한다(매입 원화는 돌려받지 못함, 운임 환급·취소비는 USD).
- **지급 불이행 실패 기록**(허브 결정 H13, 검토 R18 가):
  - `operations.ts:272-274`의 USD 약정액은 혼합 통화 계약이면 USD 몫만이다(노선 운임 `routeBetween(…).bookingFeeMinor` + `dutyFor` 관세, 위 표의 실패 기록 값). 원화 매입액을 더하지 않는다. **단일 통화 계약은 지금 식 그대로다**: 직접 무역(rules-2 포함)은 `purchaseAmountMinor + 노선 운임 + 관세`, 주선은 노선 운임(매입 0·관세 0)이다.
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
  - **1단계 `schedule`은 구성상 0이다**(허브 사전 확인). 날짜만 옮기고 평가 환율·금액은 0단계 그대로이므로, 이 단계는 2단계가 쓸 줄의 날짜를 정하는 일만 한다. 0이 아닌 값을 만들려고 옮긴 날의 환율을 1단계에 쓰지 않는다(2단계와 이중으로 센다).
  - **취소·편 놓침(7단계 `cancel`, 설계 3.4 표).** 출항 전 취소(`CANCELLED`): 1·2·5단계는 실제로 일어난 줄(매입 지급, 첫 운임 선지급)만 옮기고 바꾼다. 일어나지 않은 줄(판매, 관세, 내지 않은 운임)은 0단계 원화값 그대로 두었다가 7단계에서 그 값을 뺀다. 7단계에 새로 넣는 줄은 **원장 `CASH` 줄뿐**이고, 각 분개 날의 참고 환율로 바꿔 더한다: `FREIGHT-RELEASE-` 분개의 `CASH` 줄(환급 = 선급 운임 − 취소비, 양수), `CANCEL-COMP-` 분개의 `CASH` 줄(고객 취소 보상, 음수. 미지급이면 그 의무를 갚은 `SETTLE-` 분개의 날. 지금 자료는 보상이 0이라 없다). **`FREIGHT-RELEASE-`의 `CANCELLATION_EXPENSE` 줄(취소비)은 현금 줄이 아니므로 넣지 않는다.** 취소비는 2단계의 선급 운임(−)과 7단계의 환급(+)의 차이로 이미 들어 있다. 편 놓침: 첫 예약의 `FREIGHT-PREPAY-`를 기대 운임 줄로 보고(1·2단계), 7단계에 모든 `FREIGHT-RELEASE-`의 `CASH` 줄(환급)과 첫 예약 뒤의 모든 `FREIGHT-PREPAY-`의 `CASH` 줄(재예약 선지급)을 각 분개 날의 환율로 더한다. `realized`의 ‘취소 환급’도 이 `CASH` 줄로만 읽는다.
  - **환산 꼴은 `realized`와 열린 계약의 남은 흐름에도 같다**: 같은 날 환율의 USD 비용 줄(운임·관세·부대비)은 합친 뒤 한 번 `usdToKrwMinor`로 바꾸고, 판매·수금 줄은 따로 바꾼다(설계 3.4 ‘환산 꼴’). 그래야 항등식이 1원도 어긋나지 않는다.
  - **반환 꼴**: `{ contractId, kind, evaluationDay, expected, realized, open, openFixedRateKrw, components: { schedule, fx, tariff, surcharge, late, claim, cancel, collection, open_valuation, residual } }`. 금액은 모두 원 단위 정수다. 판정표가 이 칸 이름을 그대로 쓴다.
  - 항등식: `residual = realized − expected − (schedule + fx + tariff + surcharge + late + claim + cancel + collection + open_valuation)`으로 계산해 그대로 낸다(설계 3.4 표 10단계 ‘남은 차이’). 시험이 `residual === 0`을 단언한다. `realized`는 단계 값에서 거꾸로 구하지 않는다. 위 ‘열린 계약’ 항목의 정의(현금 줄 + 남은 흐름)와 ‘환산 꼴’ 항목대로 원장에서 따로 계산한다. 원 단위 정수. 환산은 `usdToKrwMinor` 하나로 한다. 1~9단계 칸(특히 `open_valuation`)을 ‘realized − 앞 단계 합’으로 메우지 않는다(개정 3e: 개정 3의 ‘`residual`도 메우지 않는다’는 설계 10단계 정의와 어긋나 고쳤다).
- 실행기 정책은 이번에 고치지 않는다(경로 5 변형 지시서).

### 5. 측정용 설정 변환

- `withRiskLevel(config, level, profile)`을 **새 `src/engine/risk.ts`에** 둔다(위치 고정). 이번에는 `R0`(그대로)과 `R1`(rules-3 + 원화 매입 + `FX`)만 만든다.
  - 시세 행의 매입 기준가(원) = `usdToKrwMinor(USD 기준가(센트), profile.fx.start_krw_per_usd)`. ‘× start’만 하고 ÷100을 빠뜨리지 않는다(값이 100배가 된다).
  - **정적 매입 견적**(`config.offers`의 `supplier` 견적)의 `unitPriceMinor`도 같은 식으로 바꾸고 `currency: 'KRW'`로 둔다.
  - 원화 값은 이 함수 한 곳에서만 만든다(3절 ‘매입 통화 유도’).
  - 설정 칸: `OperationsConfig.risk?: { profile: RiskProfile; layers: RiskLayer[] }`(선택 칸, `RiskLayer = 'FX' | 'TARIFF' | 'SURCHARGE' | 'CLAIM' | 'COLLECTION'`). `withRiskLevel`만 채운다. 선택 칸이므로 `scenario.ts` 로더는 고치지 않는다. R1의 `layers`는 `['FX']`다.
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
- 옛 값 불변은 시험 안에서 BASE와 견줄 수 없다. TASK-0062a 골든(rules-2 105회와 규칙 1 400회, 탐침·저장 왕복 포함)과 기존 P0-M2A5 골든값 시험이 맡는다.
- **rules-3과 `withRiskLevel`(R0 포함) 시험은 엔진 공개 함수만 쓴다**(`createGame`·`openDay`·`planState`·`commitDay` 등과 읽기 함수). `src/engine/sim/**`의 `simulate`·`runSuite`·d03은 부르지 않는다. 판정표 고정 기록 잠금: 고정 기록이 비어 있으면 새 rule_set이나 rules-3을 쓰는 d03·`runSuite`·`run.mjs` 실행(R0 포함)을 하지 않는다. 시험 ‘R0’도 시험 구동기로 끝난 직접 무역 계약을 만든다.
- **`vi.mock('./risk')`는 파일 전체에 끌어올려진다.** 그래서 통과형으로 쓴다: `vi.mock('./risk', async (importOriginal) => { const m = await importOriginal<typeof import('./risk')>(); return { ...m, referenceRate: vi.fn(m.referenceRate), dutyFor: vi.fn(m.dutyFor) }; })`. 기본은 원래 함수에 위임한다. 미래 누설 시험 안에서만 `mockImplementation`으로 바꾸고 시험 끝(`afterEach`)에 원래 위임으로 되돌린다. 양성 대조에 쓸 상태 t′는 바꾸기 전에 만든다.
- 의무·분개를 상태에 직접 넣는 시험은 그날 마감 뒤, 다음 날을 열기 전에 넣는다(`commitDay` 뒤, `openDay` 전. 아래에 날을 따로 적은 시험은 그 날을 따른다). 넣은 의무는 짝 `ACCOUNTS_PAYABLE` 분개와 함께 넣는다.

| 시험 | 확인할 것 |
|---|---|
| 새 흐름 없음 | ① rules-2 운영 시나리오를 시드 하나로 90일 돌린 `state.rng.cursors`에 새 흐름 이름이 없다. ② **R1**: 시험 구동기로 서로 다른 환율 주 둘 이상에서 환전하고, 직접 무역을 수락해 도착·인도까지 진행한 뒤 `state.rng`가 같은 시드의 `createRng(seed)`와 같다(`cursors`가 `{}`). `FX-`로 시작하는 커서 키가 없다(변형 3을 잡는다) |
| 흐름 유일성 | 위험 순수 함수가 쓰는 (흐름 이름, 번호) 쌍이 서로 겹치지 않는다 |
| 환산 도우미 | 산술 상수 단언(자료 값이 아님, H14-2): `krwToUsdMinor(2600000, 1300) = 200000`, `divHalfAway(1, 2) = 1`, `divHalfAway(−1, 2) = −1`, `usdToKrwMinor(−50, 1300) = −650` |
| 환율 순수성 | 같은 (seed, day)는 같은 값. 공개일 사이 같은 값. 값이 늘 [min, max] 안. 이웃 주의 변화가 반올림 여유 안: `|v_k − v_{k−1}| × 10000 ≤ v_{k−1} × step_bp + 5000`(설계 식의 half-up 때문에 0.5원 여유가 있다. 경계 자르기는 변화를 줄이기만 한다). 식(half-up)을 바꿔 시험을 맞추지 않는다. 시드 두 개가 어느 주에서 다르다(찾아서 확인) |
| 환율 상태 무관 | R1 도중 상태에서 `exchangePreview`·`quotePreview`·`cashReservations`·`paymentDefaultStatus`·`preview`와 환전 `planState`를 부르기 전후 원래 상태 JSON이 같다. 같은 날 환전 두 번의 `exchanges[].rateKrwPerUsd`가 서로 같고, 시험이 r = `referenceRate(config, s.rng.seed, s.day)`와 차감 `applyBasisPoints(r, config.operations.fx.spreadBasisPoints)`로 계산한 거래 환율(USD→KRW는 r − 차감, KRW→USD는 r + 차감)과 같다. 설정의 고정 `buyKrwPerUsd`·`sellKrwPerUsd`는 쓰지 않는다. 저장·불러오기 뒤 같은 날 값이 같다 |
| 환전 | rules-3 환전의 원화 금액 = USD × (그날 참고 환율 ∓ 차감). 참고 환율이 1주차와 다른 주에 환전한 뒤 그날 마감 통과, 저장·불러오기 왕복(설정을 직접 넘김) 통과 |
| 묶음 계산 | **같음 단언(허브 사전 확인).** 참고 환율이 시작값과 다르고 `failureAgeDays`보다 뒤인 날 d를 찾는다(찾았는지 단언). 시험 안에서 r = `referenceRate(config, s.rng.seed, s.day)`, 그날 묶음 L = `lotUsdMinor × (r − applyBasisPoints(r, spreadBasisPoints)) / 100`, 고정 묶음 F = `lotUsdMinor × buyKrwPerUsd / 100`을 계산하고 `L ≠ F`를 단언한다. d일 상태에 원화 의무(`incurredDay = d − failureAgeDays`, 짝 분개)를 넣어 x = 생존에 필요한 원화 − 원화 현금 = min(L, F) + 1로 만들고(의무 금액은 그 상태에서 계산), 전제 `ceil(x / L) ≠ ceil(x / F)`를 단언한다. 그다음 `usdLotKrw(config, s) === L`, `lotsToSurvive === ceil(x / L)`, `lotsToClearAll === ceil(max(0, y) / L)`(y = 원화 미지급 합 + `dailyKrwDue(s, config, s.day)` − 원화 현금. y에는 L·F 구별 전제를 두지 않는다). USD가 원인인 상태는 d일 상태의 다른 사본에 USD 의무(짝 분개, 금액 > USD 현금, `incurredDay` ≤ 다른 미지급 의무의 `incurredDay`. 같으면 USD가 먼저다)를 넣어 만든다. `usdShort`(의무 − USD 현금) > 0을 먼저 단언하고, `krwToUsdRequiredMinor === ceil(usdShort / lotUsdMinor) × lotUsdMinor × (r + applyBasisPoints(r, spreadBasisPoints)) / 100`. `weeklyBottleneck(s, config, 후보 ID)`(후보 ID는 설정의 `recruitment.candidateEmployeeIds`에서 읽는다. 후보 없이 부르면 이 칸이 `null`이다)의 `wageUsdLotsPerWeek === ceil(주급 원화 / L)`. rules-3에서 상태 없이 `usdLotKrw(config)`를 부르면 예외 |
| 원화 매입 계약 | R1에서 직접 무역을 받으면 매입 분개는 KRW, 운임 분개는 USD, 인도 때 COGS가 통화별 두 분개. 통화별 원장 합이 0. 미리보기 `schedule`의 모든 줄에 `currency`가 있고 매입 줄은 `'KRW'`의 원 단위 |
| 정적 매입 견적 | R1 설정 안의 모든 `supplier` 견적이 KRW다 |
| 시세표·행 | R1 상태의 `marketTable`에서 매입 행 통화가 KRW, 판매 행이 USD. R1 상태 `batches[].rows`의 키 집합이 rules-2와 같다. **크기**: R1 설정의 시세 행 매입 기준가 = `usdToKrwMinor(R0 값, start_krw_per_usd)`(정확히 같음). 같은 시드 R0·R1의 생성 매입 견적마다 R1 단가 × 100이 R0 단가 × `start_krw_per_usd`의 ±1% 안이다(한 번 더 바꾸거나 바꾸지 않으면 깨진다) |
| 미리보기 기본값 | rules-3에서 `opts = { goodId }`만 넘긴 `preview`의 매입 통화가 KRW로 처리되고, 기존 칸이 통화별 값이다. rules-3 직접 무역 `preview`를 `goodId` 없이 부르면 예외 |
| 참고 추정 | rules-3 미리보기의 `referenceEstimate`가 4절의 식과 같다(`usdToKrwMinor`로 시험 안에서 다시 계산). 늦은 편 후보에서 `saleKrw`가 늦은 감액 뒤 sale의 환산이다 |
| 자금 검사 | KRW가 모자라면 KRW 문장으로, USD가 모자라면 USD 문장으로 거절. `cashNeedByCurrency`가 두 기준과 같다 |
| 취소 | 혼합 통화 계약 출항 전 취소의 통화별 금액 |
| 취소(rules-2) | rules-2 운영 시나리오에서 출항 전 취소의 `FREIGHT-RELEASE` 분개가 선급 운임 − 취소비이고, 취소비가 설정 값과 같다(설정에서 계산, 설계 2절 2) |
| 계약 보고서 통화 | R1 혼합 계약 인도 뒤 `contractReport(s, c, 'KRW').directCost` = KRW 매입액, `contractReport(s, c).contribution` = USD 몫, `campaignSummary`의 KRW `contractContribution` = −Σ KRW 매출원가. rules-2 상태에서는 지금 값과 같다(검토 n25) |
| 관세 과세가격 | ① 수락일과 도착일의 환율 주가 다른 계약을 만든다(예: 공개일 수락, 다음 주 편 예약. 만들었는지와 두 환율이 다름을 먼저 단언). 도착 분개(`DUTY-…`)의 관세 = `dutyEstimate(config, krwToUsdMinor(원화 매입액, 수락일 참고 환율))`. ② ①과 같은 계약에서 `referenceRate(수락일) ≠ referenceRate(도착일)`을 먼저 단언하고, **수락일 미리보기 관세 = 수락 뒤 매일의 자금 예약 관세 = 도착 관세**. ③ 늦은 편 미리보기(도착 예정이 다음 환율 주)에서 `referenceRate(오늘) ≠ referenceRate(도착 예정일)`과, 두 환율로 계산한 관세가 서로 다름을 먼저 단언한다(찾았는지 단언). 그다음 관세 = `dutyEstimate(config, krwToUsdMinor(원화 매입, 오늘 참고 환율))` |
| 관세 호출 인수 | 통과형 `dutyFor` 첩자로 여섯 경로를 하나씩 일으킨다. `vite.config.ts`에 `clearMocks`가 없으므로(손대지 않을 파일) 경로마다 일으키기 직전에 `vi.mocked(dutyFor).mockClear()`를 부른다. 기록된 호출의 인수(`purchaseCurrency`·`valueFxDay`·`tariffDay`·`knownThroughDay`)를 설계 3.3 호출처 표와 견준다. ① 미리보기: `preview(…, { goodId })`를 바로 불러, 기록된 호출이 모두 미리보기 행 값이다. ② 수락 자금 검사: 다른 계약이 없는 상태에서 `plan` 없는 `ACCEPT_TRADE`를 `planState`로 일으켜, 기록된 호출이 모두 그 행 값이다(`plan`을 넣으면 `bookSailing`의 자금 검사가 새 계약의 예약 관세를 같은 값으로 불러 이 행을 가린다). ③ **자금 예약은 `cashReservations(s, config)`를 직접 불러 정확히 단언한다.** 진행 중인 직접 무역 계약이 하나뿐이고 `s.day !== c.acceptedDay`임을 먼저 단언하고, 호출이 정확히 한 번이다. 세 경우를 각각 본다: 예약 없음, `BOOKED`, 운송 중. `BOOKED`는 a일에 수락하고 같은 날 `listSailings(config, 노선 ID, a + 2)[1]`(다음 첫 편이 아닌 편)에 예약한 뒤 d = a + 1일 상태에서 보며, 예약 편 도착 예정일 ≠ `listSailings(config, 노선 ID, d + 1)[0]`의 도착 예정일을 먼저 단언한다. 단언: `valueFxDay === c.acceptedDay`, `knownThroughDay === s.day`, `purchaseCurrency === 'KRW'`, `tariffDay`는 그 경우의 규칙 값(운송 중 `max(예정 도착일, s.day)`, `BOOKED` 그 편의 도착 예정일, 예약 없음 다음 첫 편의 도착 예정일). 수락일·도착일 마감으로 자금 예약을 확인하지 않는다(수락일에는 오늘 = 수락일이고, 도착일에는 도착 처리 호출이 같은 값을 내 이 행을 가린다). ④ 도착 처리: 다른 계약과 명령이 없는 도착일 `commitDay`에서 기록된 호출이 모두 도착 행 값이다. ⑤ 실패 기록: 수락일 ≠ 실패일을 먼저 단언한다. 실패일 `commitDay`의 기록 가운데 `knownThroughDay`가 그 계약의 수락일인 호출이 있고, 그 호출이 실패 기록 행 값이다. ⑥ `contractRiskReport`: 0단계에서 미리보기를 다시 계산하므로 한 경로가 아니다. 도착한 계약은 기록된 호출이 모두 0단계 값(미리보기 행, 날은 수락일)이다. 도착 전 계약은 0단계 값과 도착 전 값(`tariffDay` = 자금 예약 규칙의 날이되 ‘오늘’ 자리에 평가일, `knownThroughDay` = 평가일, `valueFxDay` = 수락일)이 각각 한 번 이상 있고 다른 값은 없다. 0단계를 도착 전 인수로 계산해 호출을 하나로 합치지 않는다. 원천 검사: `src/engine/*.ts`(시험 제외)의 `dutyEstimate(` 호출은 모두 `risk.ts`의 `dutyFor` 몸통 안에 있다(위치를 본다. 정의는 세지 않는다) |
| 실패 기록 | 혼합 계약을 수락한 날 원화 급여 미지급이 생겨 실패하는 시드를 찾아, 실패 기록의 계약 USD 약정액이 USD 몫과 같다. `oldest.incurredDay − failureAgeDays`부터 실패일까지 받은 원화 매입이 원화 선택 지출에 들어간다 |
| USD 원인 실패(rules-2) | rules-2 운영 시나리오에서 시험 구동기가 d일(설정에서 계산)에 **직접 무역 계약 하나와 주선 계약 하나**를 수락한다. d일 마감 뒤·d+1일을 열기 전에 `incurredDay = d`인 USD 의무와 짝 `ACCOUNTS_PAYABLE` 분개를 넣는다. 의무 금액은 실패일까지의 USD 현금 최대치(시작 USD + 그 사이 받을 수 있는 판매액)보다 크게 설정에서 계산한다(의무를 먼저 넣으면 USD 가용이 음수라 계약을 받을 수 없으므로 이 순서를 지킨다). USD가 원인인 지급 불이행 실패까지 실행한다. 실패 기록의 `obligationId`·`currency`(USD)·`amountMinor`가 주입한 의무와 같다. `usdCommitmentsSinceIncurred`에 직접 무역 계약 행이 있음을 먼저 단언하고, **그 행 금액 = `purchaseAmountMinor + routeBetween(…).bookingFeeMinor + dutyFor 관세`**(rules-2는 지금 `operations.ts:273`의 값, 곧 `dutyEstimate`와 같다), 주선 계약 행 = 노선 운임이다. 매입액을 빼는 것은 혼합 통화 계약(시험 ‘실패 기록’)뿐이다. `optionalKrwSpendBeforeFirstUnpaid`에 `PURCHASE-` 행이 없다(설계 2절 2, 개정 3b) |
| 실패 종료 평가일 | 위 ‘실패 기록’ 실패 상태(R1)의 끝 상태에서 `contractRiskReport`의 출력 `evaluationDay === failure.day`이고 `evaluationDay !== s.day`다(H15 O1). 열린 계약이 생기도록 ‘실패 기록’ 구동기는 혼합 계약을 예약하지 않거나(출항 전 계약으로 남는다), 예정 반출일(도착 예정 + 노선의 `customsDays`)이 실패일보다 뒤인 편에 예약한다. 예약은 USD만 쓰므로 원화 미지급 날과 ‘실패 기록’의 단언은 그대로다(미지급이 생긴 뒤 원화 매입 계약을 새로 받으려 하지 않는다. 원화 가용이 음수라 받을 수 없다). **열린 계약이 있음을 먼저 단언한다.** 그 열린 계약의 `realized`는 남은 흐름을 `referenceRate(failure.day)`로 바꾼 값이다(환산 꼴은 4절) |
| 손익 읽기 | 끝난 계약마다 시험 안에서 `realized`를 다시 계산한다: 원장에서 그 계약의 현금 줄(그 계약 ID가 붙은 분개의 `CASH` 줄과, 그 계약 관세 미지급 의무를 갚은 `SETTLE-` 분개)을 읽어 원화 줄은 그대로, USD 줄은 그 분개 날의 `referenceRate`와 4절 ‘환산 꼴’로 바꾼다. 이 값이 보고서의 `realized`와 같고 `residual === 0`이다(직접 무역·주선 모두). 환율이 수락일과 청구 결제일 사이에 바뀐 계약을 찾아 `components.fx ≠ 0`이고 부호가 환율 방향과 맞다(원화 강세면 음수). 늦은 편 계약에서 `schedule === 0`(구성상)이고 `late = usdToKrwMinor(실제 감액 뒤 판매, r₂) − usdToKrwMinor(기대 감액 뒤 판매, r₂)`다(r₂ = 수금 줄의 2단계 환율, 곧 청구 결제일(평가일 상한)의 참고 환율. 판매 줄을 따로 바꾼 뒤 뺀다). 취소는 운임을 예약한 뒤 출항 전 취소한 계약을 쓰고, `FREIGHT-RELEASE-` 분개에 `CANCELLATION_EXPENSE` 줄이 있음을 먼저 단언한다. 그 계약에서 `cancel = usdToKrwMinor(환급, 취소일 참고 환율) − (일어나지 않은 줄의 0단계 원화값, 부호 포함)`(시험 안에서 줄마다 다시 계산하고 취소비를 따로 빼지 않는다), `realized`는 원장 `CASH` 줄만의 환산 합, `residual === 0` |
| 열린 계약 | **구성법(H15 O7, 허브 사전 확인).** 시드를 찾는 대신 시험 구동기로 만든다. (가) 운송 중 계약: 이른 날(예: 1일 정적 견적)에 수락하고 다음 주 편으로 예약한 뒤, 도착 전이고 평가일의 환율 주가 수락일과 다른 **도중 상태**(평가일 = `s.day`)로 시험한다. 끝 상태로 하려면 도착이 `campaignDays` 뒤인 편(설정에서 찾는다)에 예약한다. 수락일을 자료 상수(71~73일 등)로 적지 않고 `publish`·노선 설정에서 계산한다. (나) 도착 뒤 관세 미지급 계약: 수락일 다음 첫 편(정시)에 예약한다. 도착 전날 `openDay` 뒤·`commitDay` 전에 금액 X의 USD 의무(`incurredDay` = 그날)와 짝 `ACCOUNTS_PAYABLE` 분개를 넣는다. C = 그날 USD 현금 + 그날 결제일인 USD 청구서 합(마감에서 수금이 정산보다 먼저 들어온다)일 때 C − 도착 관세 + 1 ≤ X ≤ C로 정한다(가장 쉬운 값은 X = C). 그날 마감의 정산이 의무를 갚고 남은 USD 현금이 도착 관세보다 작아, 다음 날 도착 관세가 미지급이 된다(도착일 마감은 도착 처리가 수금·정산보다 먼저 돈다). 도착일 마감 뒤 `shipment.dutyPaid === false`임을 먼저 단언한다. 평가일은 도착 뒤의 날 가운데 수락일과 환율 주가 다르고 `contract.deliveryDeadlineDay` 이하인 날로 설정에서 찾는다(찾았는지 단언). 그러면 남은 판매의 늦은 감액이 0이라 감액 기준일 해석이 갈리지 않는다. 실패 전 도중 상태로 평가한다. **전제를 먼저 단언한다**: 남은 흐름 ≠ 0, `referenceRate(평가일)` ≠ `baseKrwPerUsd`, `referenceRate(평가일)` ≠ `referenceRate(acceptedDay)`(검토 n3·n42. 이 전제를 만족하는 시드는 시드 200개 안에서 찾고 찾았는지 단언). 그다음 `realized = Σ 현금 줄(환산 꼴대로) + usdToKrwMinor(남은 판매·채권, r_eval) − usdToKrwMinor(남은 운임 + 관세 예상 + 미지급, r_eval)`(r_eval = `referenceRate(평가일)`, 설계 3.4 환산 꼴), `residual = 0`, `open_valuation = 0`, `open = true`, `openFixedRateKrw` = 같은 식에서 남은 흐름만 × `baseKrwPerUsd`. 도착 전 운송 중 계약의 남은 흐름에 관세 예상이 있고, 도착 뒤 관세 미지급 계약에서는 관세가 미지급 잔액으로만 한 번 들어간다 |
| 미래 누설 없음 | 세 단계로 한다(H14-5, 검토 S3). ① 전제: 상태 t에 청구 결제일(또는 예정 도착일)의 환율 주가 평가일의 주보다 뒤인 열린 계약 줄이 있고, 그 주의 감싼 환율이 원래 값과 다름을 단언한다. ② 같은 상태 t에서 평가일 뒤 주차의 환율만 다른 두 경우의 `contractRiskReport`가 같다. ③ 양성 대조: 그 날짜가 지난 상태 t′에서는 같은 감싸기로 같은 계약의 보고서가 달라진다. 감싸기는 `vi.mock('./risk')`로 모듈 경계에서 한다 |
| R0 | rules-2 운영 시나리오(R0)에서 미지급이 없는 끝난(`COMPLETED`) 직접 무역 계약마다 `realized(원) = contractReport(s, c).contribution(센트) × (baseKrwPerUsd ÷ 100)`(13을 상수로 쓰지 않는다), `components.fx = 0`, `residual = 0` |
| 시드 일치 | rules-3 미리보기의 `config.seed`와 상태의 `s.rng.seed`가 같다 |
| 결정성 | 같은 시드·같은 명령 두 번이면 같은 상태 JSON |
| 저장 | R1 진행 상태 저장·불러오기 왕복이 같다(설정을 직접 넘김). 옛 저장 시험은 그대로 통과 |
| 불변식 | 두 사본을 거부하고, **거부 오류에 새 검사의 문장이 들어 있음**을 단언한다(다른 검사가 먼저 거부해도 통과하는 빈 시험을 막는다). (a) R1 환전의 KRW 분개에서 `CURRENCY_TRANSFER`와 `FX_SPREAD_EXPENSE` 줄을 같은 양만큼 반대로 바꿔 분개 균형을 지킨 사본: ‘환전 분개 짝 또는 통화 간 이체가 다릅니다’. (b) 혼합 통화 계약의 `currency`를 `'KRW'`로 바꾼 사본(또는 그 판매 견적의 `currency`를 `'KRW'`로): 혼합 통화 짝 오류 문장 |

- ‘미래 누설 없음’ 시험의 두 경우는 `vi.mock('./risk')`로 `referenceRate`를 감싸 평가일 뒤 주차의 값만 바꾸는 방식으로 만든다(자료 상수를 시험에 쓰지 않는다). `contractRiskReport`가 `reports.ts`에 있고 환율을 `risk.ts`에서 import하기 때문에 이 감싸기가 닿는다.

## 변형 시험

결과 보고에 각 변형과 잡은 시험을 표로 적는다. **결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 적어 보고한다.**

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | rules-3 환전이 참고 환율 대신 고정 기준 환율(`fx.baseKrwPerUsd`)을 씀 | 환전 |
| 2 | rules-2 환전 로그 문장에도 ‘오늘 참고 환율’ 문구를 씀 | 기존 `m2a5-money.test.ts`의 문장 단언 |
| 3 | rules-3 환전(`EXCHANGE_CURRENCY`)·관세 호출처가 `drawUniform(s.rng, 'FX-REF')`로 뽑아 `s.rng`를 되씀(값은 그대로, 커서만 진행. `referenceRate`는 상태를 받지 않으므로 이 꼴로 만든다) | 새 흐름 없음 ② |
| 4 | 손익 읽기가 수금 줄도 수락일 환율로 바꿈 | 손익 읽기(`realized` 재계산·`residual = 0`, fx ≠ 0) |
| 5 | 매출원가를 한 통화 분개 하나로 냄 | 원화 매입 계약 |
| 6 | 자금 검사를 한 통화로 합침 | 자금 검사 |
| 7 | 공개일이 아닌 날에도 환율이 바뀜 | 환율 순수성 |
| 8 | 과세가격에 도착일 환율을 씀 | 관세 과세가격 ①·②(① 전제: 수락일과 도착일의 환율 주가 다른 계약) |
| 9 | 자금 예약이 오늘 또는 도착 예정일 환율을 씀 | 관세 과세가격 ② |
| 10 | USD 약정에 원화 매입을 더함 | 실패 기록 |
| 11 | 환전 불변식이 rules-3에서도 `baseKrwPerUsd`를 씀 | 환전(마감·왕복) |
| 12 | `usdLotKrw`가 rules-3에서도 고정 환율을 씀(상태 인수와 예외는 그대로) | 묶음 계산(같음 단언) |
| 13 | 열린 계약의 남은 흐름을 고정 환율로 평가 | 열린 계약(전제: 평가일 환율 ≠ `baseKrwPerUsd`) |
| 14 | `contractRiskReport`가 평가일 뒤 결제일의 환율을 씀 | 미래 누설 없음 |
| 15 | `PURCHASE-` 창을 넓히지 않음(발생일 전 14일만) | 실패 기록 |
| 16 | 열린 계약의 남은 흐름을 수락일 환율로 평가 | 열린 계약(전제: 평가일 환율 ≠ 수락일 환율, 검토 n3) |
| 17 | `campaignSummary`가 계약 통화로만 거름(지금 `c.currency === currency`) | 계약 보고서 통화(검토 n25) |
| 18 | 실패 종료에서 `s.day`를 평가일로 씀 | 실패 종료 평가일(`evaluationDay !== s.day`, 검토 n1·H15 O1) |
| 19 | 과세가격에서 ×100을 뺌(원 ÷ 환율) | 환산 도우미, 관세 과세가격 ① |
| 20 | 생성기가 매입 단가를 한 번 더 원화로 바꿈(또는 `withRiskLevel`이 ÷100을 빠뜨림) | 시세표·행(크기) |
| 21 | 자금 예약 호출처(`reservations.ts:33`)의 인수를 틀리게 넘긴다. 21a: `valueFxDay`로 `c.acceptedDay` 대신 오늘(`s.day`)을 넘긴다. 21b: `BOOKED` 예약이 있어도 `tariffDay`로 다음 첫 편(`listSailings(…, s.day + 1)[0]`)의 도착 예정일을 넘긴다. 둘을 따로 돌리고 둘 다 잡혀야 21이 잡힌 것이다(변형 수는 21개 그대로) | 관세 호출 인수 ③(21a는 변형 9와 같아 관세 과세가격 ②도 잡는다. 21b는 0062 `dutyFor` 몸통이 `tariffDay`를 쓰지 않으므로 ③만 잡는다) |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `market.ts`, `operations.ts`, `readers.ts`, `reports.ts`, `catalog.ts`, `reservations.ts`, `types.ts`(`SUPPORTED_RULES_VERSIONS`·타입), `invariants.ts`, `operations-invariants.ts`, `save-shape.ts`(열거 값 추가만), 새 `src/engine/risk.ts`
- `src/content/scenario.ts`(`loadRiskProfile`·`riskProfiles`와 타입만)
- `data/market_rules.json`(`risk_profiles` 추가만), 해당 스키마, `tools/validate_data.py`(위험 프로필 검사만)와 `tools/test_validate_data.py`(새 반례와 `test_goods_counts` 3품목 고정 자료만)
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
- 첫 화면 gzip 전후를 적는다. 측정은 BASE와 작업 뒤 각각 `npm run build` 다음 `node tools/check_bundle_size.mjs dist`의 첫 화면 줄이다. 자료 청크의 증가(`risk_profiles`, 허브 시제품 실측 약 +424 B)는 따로 적는다. **코드 증가분(첫 화면 증가 − 자료 몫)이 +2,500 B를 넘으면 멈추고 보고한다.** 지금 첫 화면은 125,035 B, 여유 14,965 B다(허브 실측 2026-10-16).
- `any`를 새로 쓰지 않는다. 돈은 정수 최소 단위다.

## 완료 조건

1. 지시 1~6 반영, 시험 표의 시험 모두 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check BASE`(작업 시작 때 적은 해시) 통과(골든 검사 포함).
3. 변형 21개가 모두 잡힌다(또는 원래 코드와 같은 이유를 적었다).
4. 바꾼 파일이 ‘고칠 수 있는 파일’ 안이다.
5. `git diff --stat BASE -- tests/golden tools/check_rules2_golden.mjs tools/check_rules2_golden.test.mjs tools/rules2_golden_lib.mjs tools/rules2_golden_entry.ts tools/ai/review_checks.sh`가 빈 값이다(검토 n16). 같은 경로에서 `git status --porcelain --untracked-files=all -- …`도 빈 값이다(추적되지 않는 새 파일도 없다).

## 결과 보고에 넣을 것

- 작업 시작 때의 `git rev-parse HEAD`(BASE)
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
| 19 | 반영(개정 3에서 H14-2로 대체: `krwToUsdMinor`·`divHalfAway`. R0 등식은 `contribution(센트) × baseKrwPerUsd ÷ 100`, 대상은 미지급 없는 `COMPLETED`) | 분석값 식(센트 = USD + halfUp(KRW ÷ 13)), `cell()`을 쓰는 판정 목록, J3 후보에서 `MARGIN_BUFFER`·`FOCUS`·`EXPAND` 제외. 판정표 2절·3.2 |
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
| R1 | 반영(H8)(개정 3에서 H14-2로 대체: `krwToUsdMinor`·`divHalfAway`. R0 등식은 `contribution(센트) × baseKrwPerUsd ÷ 100`, 대상은 미지급 없는 `COMPLETED`) | rules-3 결정 기여 식(판매 − 운임 − 관세 − halfUp(매입원 × 100 ÷ 그날 참고 환율))을 정렬·양수 거름·늦은 편 검사에 씀. 판정표 6.1, 0절 2 비교 대상 |
| R2 | 반영(H8) | 추가 환전은 ‘매입 통화 KRW ≠ 판매 통화’인 직접 무역 후보에만, 건너뜀 검사는 :129 뒤. 판정표 6.1 |
| R3 | 반영(H7) | H5-2 괄호는 H7로 정정됨을 판정표 2절과 46건 표 3·26번에 적음. 허브가 이미 결정해 Q-C는 따로 두지 않음 |
| R4 | 반영(H6-4)(개정 3에서 H14-2로 대체: `krwToUsdMinor`·`divHalfAway`. R0 등식은 `contribution(센트) × baseKrwPerUsd ÷ 100`, 대상은 미지급 없는 `COMPLETED`) | `contractRiskReport`는 rules-2 상태도 받고 1,300 고정·`fx` = 0. R0 시험(realized = USD 기여 × 1,300). DESIGN 3.4, 0062 4절·시험 |
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

번호는 `docs/ai/design/path3-price-risk-2026-10/REREVIEW2-HUB-2026-10-16.md`의 번호다(S1~S19, n1~n47). 허브 결정은 `HUB-DECISIONS-2026-10-16.md`의 H14다. 다섯 문서(판정표·설계·TASK-0062~0064)에 같은 표를 붙였다. 46건 표의 6·7·12·36·42·45번도 함께 정정했다(n32·n33). 개정 3c에서 46건 표 19번과 64건 표 R1·R4도 정정했다(H15 F9).

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

### 허브 승인 전 확인 31건 처리표(개정 3c)

번호는 `docs/ai/design/path3-price-risk-2026-10/REREVIEW3-HUB-2026-10-16.md`의 번호다(T1~T7, t1~t24). 허브 결정은 `HUB-DECISIONS-2026-10-16.md`의 H15다. 다섯 문서에 같은 표를 붙였다. 46건 표 19번과 64건 표 R1·R4도 함께 정정했다(F9).

| # | 처리 | 반영한 곳과 이유 |
|---|---|---|
| T1 | 반영(H15 F3) | 판정표 6.2 결정 기여 행 끝을 F3 문장으로: (i)(ii)는 실행기 완료 조건, (iii)은 (가)·R0·R1 측정의 첫 확인, 실패하면 멈춤, 코드가 6.1과 다르면 엔진 결함, 6.1대로이면 실패 보고·v2 |
| T2 | 반영(H15 O1) | `contractRiskReport` 출력 `evaluationDay`(저장 안 함). 0062 시험 ‘실패 종료 평가일’ = `evaluationDay === failure.day`이고 `!== s.day`, ‘찾으면’ 문구 삭제. 설계 3.4 |
| T3 | 반영(H15 F1) | 판정표 5.1 ‘돌릴 손잡이가 없는 어긋남’ 끝에 F1 문장 |
| T4 | 반영(H15 F2) | 판정표 4절에 F2 문장, 5.1 ‘다시 재기’에 ‘(표본 밖은 4절)’ |
| T5 | 반박됨(고치지 않음) | 검증 메모대로 판정표 5.1의 ‘판정과 손잡이가 부딪치면(예: …)’과 5.3 J4d 위 행이 이미 닫고 있음 |
| T6 | 반영(H15 F3) | T1과 같음 |
| T7 | 반영(H15 O2) | `summarize`의 profit에 `SALES_ALLOWANCE`(설계 5.1, 0064 1절), 고칠 수 있는 파일 `ledger.ts` 범위, 0064 시험 ‘클레임’에 마감 순자산 항등식, 변형 12 |
| t1 | 반영(H15 F4) | 판정표 3.2 J3 후보 제외를 `MARGIN_BUFFER`·`FOCUS`로, 1.3 출력 2에 `MAX_CONTRIBUTION`(= `EXPAND`)·`MARGIN_BUFFER`·`FOCUS` |
| t2 | 반영(H15 F9) | 46건 19번, 64건 R1·R4에 정정 표기 |
| t3 | 반영(H15 O3) | 설계 3.4 ‘환산 꼴’: 줄마다 바꾸되 같은 환율의 USD 비용 줄은 합친 뒤 한 번. 0062 ‘열린 계약’, 0064 ‘연체 미수 평가’ 시험 식 |
| t4 | 반영(H15 O4) | `claimFor`·`collectionPlan`은 `risk.ts`, 0064 시험 ‘미래 누설 없음(호출 없음)’, 변형 9의 짝 시험 |
| t5 | 반영(H15 O5) | 0064 ‘연체 미수 평가’ 전제(평가일 환율 ≠ 청구 결제일 환율), 금액 = `outstandingMinor` |
| t6 | 반영(H15 O6) | 0063 누설 시험 (a) 전제를 그 계약의 도착국 변경으로 한정, 두 `dutyFor` 값이 다름을 먼저 단언 |
| t7 | 반영(H15 O7) | 0062 ‘열린 계약’ 시험의 구성법(71~73일 수락, 끝 뒤 도착 편 또는 관세 미지급, 도중 상태 허용) |
| t8 | 반영(H15 O8) | 0063 ‘수락 자금 검사 관세’를 `lag_days`를 늘린 프로필 사본으로 구성, 전제 단언, 변형 12 |
| t9 | 반영(H15 O9) | 0063 ‘실패 기록 약정’을 수락일 뒤 실패일 전 공지 시드로, 비교 대상 `quotePreview`/`preview(…, { goodId })`, 변형 13. 설계 3.3의 ‘세율이 그대로면’ 삭제 |
| t10 | 반영(H15 O10) | 0063 ‘자금 예약 관세’ 전제(N−1·N 운송 중, 예정 도착일 ≥ 시행일 > N−1)와 읽는 시점(마감 전) |
| t11 | 반영(H15 O11) | 설계 3.4 미리보기: rules-3 직접 무역에서 `opts`(또는 `goodId`) 없이 부르면 예외, 실행기 호출은 경로 5 |
| t12 | 반영(H15 F5) | 판정표 5.1 ‘닿지 않는 조건’의 (가) 문장, 5.3 J4d 아래 행(R1~R3만, R0은 실패) |
| t13 | 반영(H15 F7) | 설계 6절 반대 방향 검사의 자료 경로(`sell_counterparties`, `operations.market_rules_ref`), 0062 1절 |
| t14 | 반영(H15 F8) | 판정표 고정 기록 줄에 대조 규칙과 스크립트 커밋·sha256 칸 |
| t15 | 허브 몫 | DECISIONS 잠금 문장 두 곳은 허브가 승인 커밋에서 H14-8 원문으로 맞춘다 |
| t16 | 반영(H15 F6) | 판정표 5.1 같은 폭 규칙 끝에 F6 문장 |
| t17 | 반영(H15 O12) | 3a(0873f93)에서 손대지 않을 파일 일곱·400회 cmp 정리가 들어갔음을 확인. 설계 9절에 덤프 꼴(`<scenarioId>__<policyId>__<seed>.run.json`·`.state.json`)을 더함. 2절 2 표는 3b에서 탐침으로 고침 |
| t18 | 반영(H15 O13) | `claimFor(config, seed, sellOfferId, goodId)`, `collectionPlan(config, seed, sellOfferId, counterpartyId)`, `riskGrades`는 직접 무역만(주선 null), 누락 예외는 직접 무역 한정. 0064 1·2절, 설계 5.1·5.2 |
| t19 | 반영(H15 F5) | t12와 같음 |
| t20 | 반영(H15 O1·O4) | (a)는 T2, (b)는 t4와 같음 |
| t21 | 반영(H15 O3) | t3과 같음 |
| t22 | 반영(H15 F7) | t13과 같음 |
| t23 | 반영(H15 O14) | 0062 1절: `RiskProfile`·`loadRiskProfile`은 다섯 묶음을 모두 변환, 엔진이 읽는 것은 `fx`뿐 |
| t24 | 반영(H15 F9) | 설계 2절 5의 분석값 문장, 66건 표 S17의 ‘5.3 L2 행’은 판정표 5.3 L2 행에 ‘기준 회사의’를 넣어 맞춤 |

- 기각은 T5 한 건이다(허브 검증에서 반박됨). 허브 몫은 t15와 SPEC 10.4·423 문장이다.
- 허브 결정과 다르게 한 것은 없다.

### 허브 사전 확인 처리표(개정 3d)

허브가 Codex 실행 전에 이 지시서를 시제품으로 실측했다(2026-10-16, 사본 세 갈래: 골든 무변화, 시험·변형 수행 가능성, 파일·모호성). 시제품은 지시서 문구대로 공유 코드를 바꾸고 `node tools/check_rules2_golden.mjs`(rules-2 105회, 규칙 1 400회, 저장 왕복)를 돌려 **골든 일치**, `npx vitest run` 1,364개 통과였다(`dutyFor`를 KRW일 때만 환산하는 분기). 구현 지시는 rules-1·rules-2에 무해하다. 아래는 시험·변형·문구를 고친 목록이다.

| # | 심각도(검증) | 찾은 것 | 반영한 곳 |
|---|---|---|---|
| P1 | 차단(확인) | 시험 ‘USD 원인 실패(rules-2)’가 직접 무역 행 금액에서 매입액을 뺐다. 맞는 구현에서 실패하고, 맞추면 골든(계약 약정 225행 중 직접 무역 98행)이 깨진다. 주입 순서도 없었다 | 시험 행(직접 무역 = 매입 + 노선 운임 + 관세, 주선 = 노선 운임, 수락 뒤 주입), 3절 실패 기록(‘노선 운임’, 단일 통화는 지금 식) |
| P2 | 낮춤(부분) | 지위 ‘초안’, `<BASE>` 자리표시자, 자기 해시 문제, 설계 39행의 기준 커밋 | 머리(승인, BASE = 작업 트리 HEAD), 완료 조건 2·5, 설계 머리·2절 2 |
| P3 | 중대(확인) | 반대 방향 검사가 기존 `test_goods_counts`(3품목, COFFEE)를 깨고, 고정 자료 수정 허용이 없었다 | 1절(3품목 고정 자료만 고침, 단언 유지), 고칠 수 있는 파일 |
| P4 | 낮춤(부분) | bp 범위 0~10000을 모든 `*_bp`에 걸면 동결 프로필 `tariff.step_bp [-200, 800]`이 실패 | 1절 검사 범위 |
| P5 | 경미 | 반대 방향 검사의 대상 프로필과 시험 파일 이름 | 1절 |
| P6 | 낮춤(부분) | 환율 순수성 ‘변화율 ≤ step_bp’가 half-up 때문에 시드에 따라 실패(시드 1~200 중 9개, 최대 253.8bp) | 시험 ‘환율 순수성’(+5000 여유), 설계 3.2 |
| P7 | 중대(확인) | 시험 ‘묶음 계산’의 부등식이 변형 12를 잡지 못함(71일 무명령 R1은 맞는 구현·변형 모두 1묶음). 환율 날짜·서명 모호 | 2절(새 선택 인수는 `usdLotKrw`의 `s` 하나, 기존 서명 유지, 환율일 `s.day`), 시험 같음 단언, 변형 12 |
| P8 | 중대(확인) | 변형 3을 짝 시험이 잡지 못함(`referenceRate`는 상태를 받지 않아 두 시험이 늘 참) | 시험 ‘새 흐름 없음’ ②·‘환율 상태 무관’, 변형 3 문구 |
| P9 | 중대(확인) | 시험 ‘열린 계약’의 ‘도착 뒤 관세 미지급’은 명령만으로 못 만들고, 71~73일 수락은 무명령 R1에서 원화가 57일에 바닥나 불가능 | 시험 ‘열린 계약’ 구성법 (가)·(나), 자료 상수 금지 |
| P10 | 낮춤(부분) | 첫 화면 +2,500 B 정지선. 자료 JSON만 +424 B, 여유는 15.2 KB가 아니라 14,965 B | 지켜야 할 것(측정 방법, 자료 몫 따로, 코드만 +2,500 B), 설계 9절 |
| P11 | 낮춤(부분) | 원화 변환 자리가 둘로 읽히고 크기 단언이 없음 | 3·5절(`withRiskLevel` 한 곳, ÷100), 시험 ‘시세표·행’ 크기, 변형 20 |
| P12 | 낮춤(부분) | 취소 계약의 일어나지 않은 판매·관세 줄을 어느 단계가 맡는지 없음(골든 105회에는 취소 0건이라 측정 영향은 작음) | 4절 취소 규칙, 설계 3.4 표 7단계, 시험 ‘손익 읽기’ |
| P13 | 경미 | `schedule`은 구성상 0인데 기대값이 없음 | 4절, 시험 ‘손익 읽기’, 설계 3.4 표 1단계 |
| P14 | 경미 | `dutyFor` 분기를 `=== 'USD'`로 하면 P0-ACC-01(`'XXX'`)이 깨짐. rules-1에서 `referenceRate`를 부르면 400회 골든이 멈춤 | 2절, 3절 분기 |
| P15 | 경미 | 관세 반올림 규칙(‘× 세율’) | 3절, 시험 ‘관세 과세가격’(`dutyEstimate(과세가격)`) |
| P16 | 경미 | `dutyFor` 위치, 여섯 호출처 확인 방법, `vi.mock` 끌어올림 | 3절(위치 `risk.ts`, 원천 검사), 시험 머리(통과형 첩자), 시험 ‘관세 호출 인수’, 변형 21 |
| P17 | 경미 | 시드 출처(상태 자리 `s.rng.seed`) | 2절 |
| P18 | 경미 | 위험 설정 칸 꼴과 반환 칸 이름 | 4·5절 |
| P19 | 경미 | `realized`의 환산 꼴, 열린 계약 기대식 | 4절, 시험 ‘열린 계약’ |
| P20 | 경미 | 불변식 사본이 다른 검사에 먼저 걸리면 빈 시험 | 시험 ‘불변식’(균형 유지 사본, 문장 단언) |
| P21 | 경미 | 완료 조건 5가 추적되지 않는 새 파일을 못 봄 | 완료 조건 5 |
| P22 | 경미 | rules-3 시험이 sim 실행을 부르면 판정표 잠금 위반 | 시험 머리 |
| P23 | 경미 | 실패 종료 상태에 열린 계약이 없을 수 있음 | 시험 ‘실패 종료 평가일’ |
| P24 | 경미 | 관세 ②의 두 환율이 같을 수 있음 | 시험 ‘관세 과세가격’ ② 전제 |
| P25 | 허브 추가 | rules-3 환전 차감의 반올림 꼴이 적혀 있지 않음 | 2절(`applyBasisPoints(r, spreadBasisPoints)`, `scenario.ts:503`과 같은 꼴) |

- 기각 2건. ① 0062를 0062-1·0062-2로 나누기: 통과형 `vi.mock`으로 시험 파일 하나 안에서 해결되고, 정지선·취소 규칙은 위에서 고쳤다. 범위는 그대로 둔다. ② 변형 4를 시험이 놓친다: `residual`을 남은 차이(4절 항등식)로 내고, 시험이 끝난 계약의 `realized`를 원장 현금 줄로 다시 계산하므로 같은 시험이 잡는다(검증에서 반박. 이 전제가 문장으로 빠져 있던 것은 개정 3e에서 4절 항등식과 시험 ‘손익 읽기’에 넣었다).
- 사전 확인 중 하위 에이전트가 저장소 연결 사본에서 `git stash`를 실행한 사고가 있었다. 허브가 해시를 확인하고 지웠으며 작업 트리는 깨끗했다. 이후 사본은 원본과 `.git`을 공유하지 않게 만든다. 원본과 `.git`을 공유하는 작업 트리에서는 읽기 전용 git 명령만 쓴다(WORKFLOW.md).

### 허브 재검토 처리표(개정 3e)

개정 3d의 고침 문구를 읽기 전용 검토 세 갈래(코드 사실, 시험 수행·변형 판별, 내부 일관성·범위)로 다시 보고, 중대 결함마다 반박 검증을 거쳤다(2026-10-16). 차단 결함은 없었다. 코드 사실(줄 번호·칸·계정·불변식 문장·순환 import 없음)과 산술 주장(x = min(L, F) + 1, 반올림 여유 +5000, ±1% 크기 단언)은 맞았고, 동결 범위(판정표, 설계 6절)는 바뀌지 않았다.

| # | 심각도(검증) | 찾은 것 | 반영한 곳 |
|---|---|---|---|
| Q1 | 중대(확인) | 시험 ‘관세 호출 인수’가 `contractRiskReport`를 한 경로로 잘못 묶었고(0단계 미리보기 재계산으로 호출이 둘), 자금 예약을 볼 날·편을 정하지 않아 변형 21이 살아남을 수 있었다(수락일, 다음 첫 편 예약, 도착일 마감의 값 겹침, 첩자 기록 누적) | 시험 ‘관세 호출 인수’ ①~⑥(`mockClear`, `cashReservations` 직접 호출, `BOOKED` 구성), 변형 21a·21b |
| Q2 | 중대(확인) | 취소 7단계 ‘환급·취소비 줄’을 글자대로 읽으면 선급 운임에서 이미 뺀 취소비를 한 번 더 뺀다 | 4절 취소 규칙(`CASH` 줄만), 시험 ‘손익 읽기’ 취소, 설계 3.4 `realized`·7단계 |
| Q3 | 중대(확인) | 4절 ‘`residual`을 앞 단계 합으로 메우지 않는다’가 설계 10단계 ‘남은 차이’와 어긋나, 글자대로면 `residual`이 상수 0이 되어 변형 4를 못 잡는다 | 4절 항등식, 시험 ‘손익 읽기’(`realized` 원장 재계산), 변형 4 짝, 기각 ② 문장 |
| Q4 | 경미 | `exchangeAmounts`의 rules-3 인수 누락 예외가 빠짐 | 2절 |
| Q5 | 경미 | 분기 조건 두 문장(‘매입 ≠ 판매’와 `dutyFor`의 ‘KRW인가’)이 같은 관세 분기에 함께 걸림 | 3절 분기 조건 |
| Q6 | 경미 | 원천 검사 ‘한 곳’이 개수로 읽힘(분기마다 호출이 둘) | 3절, 시험 ‘관세 호출 인수’ |
| Q7 | 경미 | ‘설정의 차감’이 고정 차감 13으로 읽힐 수 있음 | 시험 ‘환율 상태 무관’ |
| Q8 | 경미 | 묶음 계산 후반: `lotsToClearAll`에 전제를 붙이면 맞는 구현이 실패, `usdShort > 0` 전제 없음, 후보 없는 `weeklyBottleneck`은 `null` | 시험 ‘묶음 계산’ |
| Q9 | 경미 | 관세 ③에 두 환율이 다름 전제가 없음 | 시험 ‘관세 과세가격’ ③ |
| Q10 | 경미 | 열린 계약 (나)의 의무 금액 하한과 평가일 | 시험 ‘열린 계약’ (나) |
| Q11 | 경미 | 실패 종료 상태에 열린 계약을 두는 방법이 실행 불가(미지급 뒤에는 원화 매입을 받을 수 없음) | 시험 ‘실패 종료 평가일’ |
| Q12 | 경미 | sim 잠금 문장이 판정표보다 좁음(R0 포함) | 시험 머리 |
| Q13 | 경미 | 늦은 감액 `late`의 환산 꼴 문장(지금 자료에서는 두 식이 같아 반박됐으나 표현을 4절과 맞춤) | 시험 ‘손익 읽기’ |
| Q14 | 경미 | 설계 3.2·3.3의 옛 문장(생성기 원 단위, 예약 운임, 묶음 함수 서명), `IMPLEMENTATION_PLAN`의 ‘기준’, README 상태, 사본 규칙 문장과 WORKFLOW.md 누락 | 설계 3.2·3.3, `docs/IMPLEMENTATION_PLAN.md`, README, DECISIONS, `docs/ai/WORKFLOW.md` |
