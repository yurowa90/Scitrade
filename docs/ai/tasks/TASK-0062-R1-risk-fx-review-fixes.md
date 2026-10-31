# TASK-0062-R1 직접 무역 위험 ① 검수 고침

- **지위: 승인(허브, 2026-10-16). 실행할 수 있다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0062 스냅숏 `7410957`(브랜치 `codex/TASK-0062`). 이 지시서는 그 브랜치에 커밋되어 있고, 작업 트리도 그 브랜치다.
- **`BASE`는 작업 트리를 만든 커밋(이 지시서를 담은 커밋)이다.** 작업 시작 때 `git rev-parse HEAD`를 결과 보고에 적고 그 값을 BASE로 쓴다.
- 먼저 읽는다: TASK-0062 지시서(`TASK-0062-risk-fx-krw-purchase.md`, 개정 3e)와 그 결과 보고(`results/TASK-0062.md`), 설계 `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 3.2·3.4(개정 3f).
- 근거: 허브 심층 검수(사양·rules-2 불변·시험 판별력·자료·수치, 다섯 관점. 중대 결함마다 반박 검증 2회)와 세션 A 설계자 검수. 세션 A 검수는 결함 0건이었다. 허브 검수는 실제 코드 결함 1건과 시험 판별력 결함 6건을 확인했다.
  - rules-1·rules-2 불변은 다시 확인됐다. rules-2 160회, rules-1 160회, 옛 저장 두 개를 BASE와 나란히 비교했고 차이는 0이다.
  - 자료는 설계 6절과 같았다(키 순서 포함).
- **TASK-0062 지시서의 원칙·지켜야 할 것·손대지 않을 파일이 그대로 적용된다.** 아래 항목만 고친다. 이미 통과한 동작은 바꾸지 않는다.

## 1. 코드 결함(중대)

### R1-1. 편 놓침 뒤 재예약 전 계약의 `residual`

- **현상.** 출항 전에 편을 놓치면 다음이 일어난다: `releaseBooking`, 예약 `CANCELLED`, `contract.bookingId = null`. 아직 다시 예약하지 않은 열린 계약(취소 아님, 화물 출항 전)을 평가하면 `residual = −usdToKrwMinor(p.freight, r_eval)`이 된다.
  - `realized`의 남은 흐름에는 다시 낼 운임이 들어 있다(`reports.ts` `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay))`). 이 줄은 맞다(설계 3.4 ‘아직 내지 않은 운임’, `cashReservations`도 이 운임을 묶는다).
  - 그런데 1·2단계는 운임 줄을 첫 `FREIGHT-PREPAY-` 날로 옮기고, 7단계는 원장 `CASH` 줄만 더한다. 그래서 이 운임이 어느 단계에도 들어가지 않는다.
  - R0(rules-2 상태)과 R1 모두 같다. 허브 실측에서 rules-2는 보고서 45,559건 중 160건, 혼합 탐색은 34,128건 중 2,400건이 이 상태였다. 다른 상태의 `residual`은 모두 0이었다.
- **고침.** 7단계 `cancelFlows`를 만든 뒤 다음 줄을 더한다. 같은 금액·같은 날짜(평가일)의 줄이므로 환산 꼴도 `realized`와 같다.
  `if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));`
  - `firstPrepayment` 조건: 운임을 한 번도 내지 않은 계약은 2단계 운임 줄이 이미 평가일 줄이므로 바꾸지 않는다.
  - 재예약하면 `booking`이 생겨 이 줄이 빠지고, 두 번째 `FREIGHT-PREPAY-`가 7단계에 들어간다(지금 동작).
  - 설계 3.4 표 7단계(개정 3f)의 문장과 같다.
- **시험 ‘편 놓침 뒤 재예약 전’**(R0·R1 각각):
  - 구성: 준비가 끝나지 않게(직원 배정 없이) 첫 편을 예약해 수락하고 출항일을 넘긴다.
  - 전제를 먼저 단언한다:
    - 첫 예약 `status === 'CANCELLED'`, `contract.bookingId === null`, 그 계약의 화물 없음
    - `cashReservations`에 그 계약의 운임 예약이 있음
  - R1은 평가일 환율이 첫 선지급일 환율과 다른 상태를 고른다(평가일·시드 탐색, 찾았는지 단언). 그래야 날짜 오류를 가릴 수 있다.
  - 단언:
    - 시험이 원장 현금 줄과 남은 흐름으로 다시 계산한 `realized`가 보고서 값과 같다(4절 환산 꼴).
    - `residual === 0`, `open === true`.
    - R0에서는 `cancel === −usdToKrwMinor(취소비, baseKrwPerUsd)`다. 취소비는 설정에서 읽는다.

## 2. 시험 판별력(중대)

허브가 독립 사본에서 아래 변형을 넣어 전체 시험(1,389개)을 돌렸고, 모두 통과해 살아남았다. 각 항목의 시험을 고쳐 그 변형을 잡게 한다.

### R1-2. 참고 환율 흐름: 관찰형 유일성과 경로 오라클

- **살아남은 변형.** `risk.ts`의 `drawAt(seed, 'FX-REF', k)`를 `drawAt(seed, 'FX-REF', 1)`로 바꿈(매주 같은 걸음, 곧 시드마다 한 방향 추세). 걸음 범위를 `(2 * stepBp)`로 바꿈([−s, s−1]로 치우침). 지금 ‘흐름 유일성’은 시험이 만든 목록만 보고, `drawAt`과 `drawUniform`이 같은지(정의상 같음)만 본다.
- **흐름 번호 규칙(허브 결정, 설계 3.2 개정 3f).** 지금 코드 그대로다: 첫 공개 주(1주차)는 `start_krw_per_usd`이고, k번째 걸음(1주차 → k+1주차)의 번호가 k다(k = 1, 2, …). 코드는 바꾸지 않는다.
- **관찰형 ‘흐름 유일성’.**
  - 파일 머리에 통과형 감싸기를 더한다: `vi.mock('./rng', async (importOriginal) => { const m = await importOriginal<typeof import('./rng')>(); return { ...m, drawUniform: vi.fn(m.drawUniform) }; })`.
  - `vi.mocked(drawUniform).mockClear()` 뒤 `referenceRate(cfg, seed, publish.lastDay)`를 한 번 부른다.
  - 기록된 호출의 `(stream, rng.cursors[stream])` 쌍을 모아 세 가지를 단언한다.
    - 개수 = `floor((lastDay − firstDay) / intervalDays)`
    - 겹침 없음
    - 번호가 정확히 1..개수
  - 지금의 자기 생성 목록 비교는 지운다.
- **경로 오라클(‘환율 순수성’ 안이나 따로).** 시드 1~200, 1~`campaignDays`의 모든 날에 대해 시험 안에서 값을 따로 만든다.
  - `drawUniform({ seed, cursors: { 'FX-REF': k } }, 'FX-REF').value`
  - `step = floor(u × (2·stepBp + 1)) − stepBp`
  - `rate_k = clamp(halfAway(rate_{k−1} × (10000 + step), 10000), min, max)`. `halfAway`는 시험 안에서 정수식 `sign(n) × floor((2|n| + d) / (2d))`로 쓰고 `risk.ts`의 `divHalfAway`를 쓰지 않는다.
  - 이 값이 `referenceRate(cfg, seed, day)`와 정확히 같음을 단언한다.
  - 덧붙여 한 시드 안에서 걸음이 모두 같지는 않음을 단언한다.

### R1-3. 혼합 계약의 USD 매출원가와 계약 보고서

- **살아남은 변형.**
  - N5a: 혼합 계약 `COGS-{계약}-USD` 금액에 화물 장부가(원)를 씀
  - N5b: USD 매출원가에서 관세를 뺌
  - 시험·매일 마감 불변식·불러오기 검사가 모두 통과한다. 이유는 둘이다.
    - 시험의 기대 USD 몫이 `contractReport`와 같은 원장 집계식이다.
    - `invariants.ts`의 혼합 계약 보정(`lotTotal += contractAmount(…, 'INVENTORY')`)이 비교 양쪽에 같은 값을 더하는 항등식이다.
- **시험.** 기대값을 원장 집계가 아니라 계약 값으로 계산한다.
  - USD 몫 = `(c.saleAmountMinor − c.priceReductionMinor) − 그 예약의 prepaidFreightMinor − shipment.dutyMinor`
  - `COGS-{계약}-USD` 분개 금액 = 선급 운임 + 관세
  - `COGS-{계약}-KRW` = 원화 매입액
  - 인도 뒤 `contractAmount(s.ledger, 'USD', c.id, 'INVENTORY') === 0`
- **불변식.** `invariants.ts`에 검사 하나를 더한다: 인도된(`deliveredDay !== null`) 혼합 통화 계약의 USD 재고 분개 잔액은 0이고, 인도 전에는 0 이상이다.
  - 문장 예: `혼합 계약 {id}의 USD 재고 잔액({n})이 맞지 않습니다`.
  - rules-2 계약은 혼합 통화가 아니므로 이 검사에 걸리지 않는다. 골든이 같아야 한다.
  - 지금의 보정식은 그대로 둔다(재고 장부 = 화물 장부가 + 혼합 계약 USD 재고).
- 변형 N5a·N5b가 시험이나 불변식에서 잡혀야 한다.

### R1-4. 참고 추정과 0단계 기대: 환율이 바뀐 날

- **살아남은 변형.** N4: `preview`의 `referenceEstimate` 환율을 고정 `baseKrwPerUsd`로 바꿈. 지금 단언은 모두 1주차 날(1·2일)에 있다. 그날 참고 환율이 시작값 1,300 = 기준 환율이라 구별하지 못한다.
- **시험.**
  - 참고 환율이 `start_krw_per_usd`와 다른 날을 찾아(찾았는지 단언), 그날 `preview(…, { goodId })`의 `referenceEstimate`가 4절 식과 같음을 단언한다. 식은 시험 안에서 다시 계산한다.
  - `expected === 수락일 미리보기의 referenceEstimate.pnlKrw` 단언도 환율이 시작값과 다른 날 수락한 계약에서 한다.
  - 늦은 편 후보 조건에 `referenceRate(오늘) !== start`를 더한다.

### R1-5. 자금 검사의 기준액

- **살아남은 변형.** N7: 혼합 계약 USD 자금 검사에서 관세를 뺌. N7b: 원화 자금 검사의 매입액을 절반으로. 지금 시험은 거절 문장에 ‘원’·‘USD’가 있는지만 본다.
- **시험.**
  - 거절 문장에 `필요 ${formatMoney('KRW', cashNeedByCurrency의 KRW)}`와 `필요 ${formatMoney('USD', cashNeedByCurrency의 USD)}`가 들어 있음을 단언한다(`engine.ts` `fundsShortfall` 문장).
  - 통화마다 경계 시험을 하나씩 둔다. 가용액이 기준 − 1이면 거절, 기준이면 수락이다.
  - 가용액은 환전 명령, 또는 짝 `ACCOUNTS_PAYABLE` 분개를 붙인 의무 주입으로 맞춘다.

### R1-6. 검사기: `base_scenario_id` 상속과 rules-3 판본

- **살아남은 변형.**
  - A: `validate_data.py`에서 `resolve_scenario(…)`를 `tables['scenarios'][sid]`로 바꿈
  - U: 판본 조건 `('M2a-rules-2', 'M2a-rules-3')`를 `('M2a-rules-2',)`로 바꿈
  - 지금 시험 `test_risk_all_profiles_and_inherited_rule`은 이름과 달리 상속을 시험하지 않는다. 지금 자료의 운영 시나리오는 `engine_rules`·`operations`를 직접 갖는다.
- **반례(`tools/test_validate_data.py`, `check_market_rules`만 부르고 문장 단언).**
  - ① 상속 경로를 만든다.
    - rule_set 사본 `VARIANT_X`: 운영 rule_set을 복사하고, 판매 거래처 하나를 프로필 `by_counterparty`에 없는 거래처로 바꾼다.
    - 자식 시나리오 `{ base_scenario_id: 'SCENARIO_M2_OPERATIONS' }`: `engine_rules` 없이 `operations.market_rules_ref`만 `#VARIANT_X`로 덮는다.
    - `운영 판매 거래처 누락` 문장을 단언한다.
  - ② ①의 자식 시나리오에 `engine_rules.rules_version: 'M2a-rules-3'`을 넣은 경우에도 같은 문장이 나온다.
- 기존 시험 이름이 하는 일과 맞지 않으면, 이름을 고치거나 위 반례를 그 시험 안에 넣는다(기존 단언은 지우지 않는다).

### R1-7. 프로필 로더 변환

- **살아남은 변형.** `src/content/scenario.ts` `loadRiskProfile`에서 다음을 바꿔도 25개 시험이 모두 통과했다(8종 모두).
  - `stepBp: p.fx.step_bp * 2`
  - min −100, max +100
  - `startKrwPerUsd + 10`
  - 이유: 유일한 단언 `loadRiskProfile(id) toEqual riskProfiles()[0]`이 자기 참조다.
- **시험.** `data/market_rules.json` 원자료를 시험에서 따로 읽는다(JSON import 또는 파일 읽기). 다섯 묶음의 **모든 칸**을 명시한 대응표(snake → camel)로 원자료와 변환 결과를 견준다(`fx`, `tariff.base[]`·`max_changes`·`lag_days`·`step_bp`·`min_bp`·`max_bp`, `surcharge`, `claims.by_good[]`·`minor`·`major`, `collections.by_counterparty[]`·`grades[]`·`partial_bp`·`late_min_days`·`late_max_days`, 표지).

## 3. 경미 고침

- **R1-8 환산 도우미 반올림(변형 19, N11·N12).**
  - 0.5 나머지가 생기는 상수를 더한다: `usdToKrwMinor(1, 50) === 1`, `usdToKrwMinor(−1, 50) === −1`, `krwToUsdMinor(−13, 2600) === −1`, `krwToUsdMinor(13, 2600) === 1`.
  - 시험 ‘관세 과세가격 ①’의 기대값은 도우미가 아니라 시험 안의 정수식으로 계산한다. 그래야 변형 19를 ①도 잡는다(TASK-0062 변형표가 적은 짝).
- **R1-9 항등식의 독립 확인(N2 + 단계 날짜 오류 결합).** ‘손익 읽기’·‘열린 계약’에서 다음 셋을 단언한다.
  - `시험이 다시 계산한 realized − 시험이 다시 계산한 expected === components의 1~9단계 합`
  - `residual === 0`
  - 이렇게 하면 `residual`을 0으로 고정한 변형과 fx 단계 관세일 오류를 함께 넣어도 잡힌다.
- **R1-10 상태 무관·결정성.**
  - ‘환율 상태 무관’의 읽기 함수 호출을 진행 중인 혼합 계약과 미지급 의무가 있는 R1 도중 상태에서도 한다. 그래야 `cashReservations`의 `dutyFor` 경로와 `paymentDefaultStatus` 회복 계산이 실제로 돈다.
  - ‘결정성’은 같은 구동기를 두 번 돌려 `serializeSave` 문자열이 같음을 단언한다.
- **R1-11 시험 문구 맞춤.**
  - ‘관세 과세가격 ①’은 도착 분개 `DUTY-…`의 금액을 단언한다(지금은 `shipment.dutyMinor`).
  - ‘취소’(R1)는 두 가지를 단언한다: `FREIGHT-RELEASE-` 분개의 통화가 USD이고, 이 계약에 원화 양수 `CASH` 줄이 없다.
  - ‘USD 원인 실패(rules-2)’의 기대 관세는 `dutyEstimate(cfg, c.purchaseAmountMinor)`로 계산한다(지시서 행 문구).
- **R1-12 검사기 반례 보강.**
  - ① 반대 방향 반례를 ‘표 비우기’에서 ‘한 행만 빼기’로 바꾸거나 더한다. 뺄 행은 셋이다.
    - 운영 rule_set의 마지막 판매 거래처 행
    - 마지막 품목의 `claims.by_good` 행
    - 두 번째 판매 도시 나라 × 마지막 품목의 `tariff.base` 행
  - ② 반례가 없는 검사에 반례를 더한다. 각각 그 문장을 단언한다.
    - `fx.min_krw_per_usd = start + 1`(시작 환율 범위)
    - `fx` min > max
    - 정의되지 않은 등급
    - 프로필 ID 중복
    - `lag_days = [3, 0]`
    - `tariff.min_bp > max_bp`
    - `claims.major.min_bp > max_bp`
  - ③ **고유성 검사를 새로 넣는다**(`validate_data.py`, 문장 예 `…: 중복 행`). 각각 반례를 둔다.
    - `tariff.base`의 (country_code, good_id)
    - `claims.by_good`의 good_id
    - `collections.by_counterparty`의 counterparty_id
    - `collections.grades`의 grade
    - 지금 자료는 통과해야 한다.
- **R1-13 결과 보고 사례.** TASK-0062 결과 보고의 ‘열린 운송 중’ 사례는 ‘늦은 편’과 모든 칸이 같았다. 같은 편(D009)의 관세·수금일과 평가일이 같은 환율 주였기 때문이다(결함 아님).
  - R1 결과 보고에는 남은 흐름의 예정일이 평가일과 다른 환율 주에 걸리는 열린 사례를 쓴다(예: 더 늦은 편). 표를 다시 낸다.
  - 시험에 두 가지를 단언한다: 그 열린 사례의 `realized`가 같은 계약을 끝까지 진행한 뒤의 `realized`와 다르다. 그 전에 두 환율이 다름을 단언한다.

## 변형 시험

TASK-0062 결과 보고와 같은 방식이다. 허용 파일에 변형을 하나씩 넣고 지정 시험을 돌린 뒤 원문을 복원한다. 결과 보고에 표로 적는다.

1. **TASK-0062 변형 21개(21a·21b 따로)를 다시 돌려** 모두 잡힘을 확인한다.
2. 아래 새 변형이 모두 잡혀야 한다. 결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 보고한다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| R1 | R1-1의 추가 줄을 뺌 | 편 놓침 뒤 재예약 전 |
| R2a | `drawAt(seed, 'FX-REF', 1)`(번호 고정) | 흐름 유일성(관찰형), 경로 오라클 |
| R2b | 걸음 범위 `(2 * stepBp)` | 경로 오라클 |
| R2c | 환율 반올림을 floor로 | 경로 오라클 |
| R3a | N5a(COGS-USD에 원 장부가) | 원화 매입 계약 또는 불변식 |
| R3b | N5b(USD 매출원가에서 관세 뺌) | 원화 매입 계약 또는 불변식 |
| R4 | N4(`referenceEstimate` 고정 환율) | 참고 추정(바뀐 날) |
| R5a | N7(USD 자금 검사에서 관세 뺌) | 자금 검사 경계 |
| R5b | N7b(원화 자금 검사 매입 절반) | 자금 검사 경계 |
| R6a | 검사기 상속 해석 제거(A) | 검사기 상속 반례 |
| R6b | 검사기 판본 조건에서 rules-3 제거(U) | 검사기 rules-3 반례 |
| R7a | 로더 `stepBp × 2` | 로더 변환 |
| R7b | 로더 `collections` 한 칸 잘못 옮김(예: `partialBp`에 `p_partial_bp`) | 로더 변환 |
| R8a | `usdToKrwMinor`를 `Math.round`로 | 환산 도우미 |
| R8b | `krwToUsdMinor`를 `Math.round`로 | 환산 도우미 |
| R9 | `residual = 0` 고정 + fx 단계 관세일을 수락일로 | 손익 읽기(독립 항등식) |
| R12a | 반대 방향 검사가 첫 판매 거래처만 봄 | 검사기 한 행 빼기 |
| R12b | 고유성 검사 하나 제거 | 검사기 중복 행 반례 |

## 고칠 수 있는 파일

- `src/engine/reports.ts`(R1-1의 한 줄만), `src/engine/invariants.ts`(R1-3 검사만)
- `src/engine/m2a5-risk-fx.test.ts`
- `tools/validate_data.py`(R1-12 ③ 고유성 검사만), `tools/test_validate_data.py`
- 새 `docs/ai/tasks/results/TASK-0062-R1.md`, `MANIFEST.json`

그 밖의 파일은 고치지 않는다. `risk.ts`·`scenario.ts`·자료·스키마·설계·TASK-0062 결과 보고도 고치지 않는다. 고쳐야 할 것 같으면 멈추고 보고한다.

## 지켜야 할 것

- TASK-0062 지시서 ‘지켜야 할 것’ 전부. 골든 진단 절차, 골든 파일·검사기 손대지 않기, `--write` 금지, P0-M2A5 골든값 불변, 옛 저장 시험 통과가 들어 있다.
- rules-3·`withRiskLevel` 시험은 엔진 공개 함수만 쓴다. `src/engine/sim/**`의 실행 함수는 부르지 않는다(판정표 잠금).
- 첫 화면 gzip 전후를 적는다(코드 변경이 작으므로 증가는 수십 B 안쪽이어야 한다. +500 B를 넘으면 멈추고 보고한다).

## 완료 조건

1. R1-1~R1-13 반영. 새 시험과 고친 시험 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `python3 tools/test_validate_data.py`, `bash tools/ai/review_checks.sh --check BASE`(골든 검사 포함) 통과.
3. TASK-0062 변형 21개와 위 새 변형이 모두 잡힌다(또는 원래 코드와 같은 이유를 적었다).
4. 바꾼 파일이 ‘고칠 수 있는 파일’ 안이다.
5. TASK-0062 완료 조건 5와 같은 골든 경로 `git diff --stat BASE -- …`와 `git status --porcelain --untracked-files=all -- …`가 빈 값이다.

## 결과 보고에 넣을 것

- BASE, 바꾼 곳과 이유, 변형 표(TASK-0062 21개 + 새 변형)
- R1-13의 보고 사례 표(값을 고치지 않고 적기만 한다)
- 골든 검사기 종료 코드, 첫 화면 gzip 전후, 시험 수
- 범위 밖 발견과 질문
