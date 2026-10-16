# TASK-0062 Codex 결과 허브 심층 검수 원자료 (2026-10-16)

- 대상: `codex/TASK-0062` 스냅숏 `7410957`, BASE `4b3d6a8`.
- 방법: 다섯 관점(사양·rules-2 불변·시험 판별력·자료·수치)의 독립 검토, blocker·major 결함마다 반박 검증 2회. 실행은 모두 `.git`을 공유하지 않는 사본에서 했다.
- 처리: TASK-0062-R1 지시서. 경로는 `<사본>`으로 가렸다.

```text
===== spec
관점: rules-3 의미를 지시서 2~5절, DESIGN 3.2~3.4와 대조했다. 독립 클론(7410957)에서 탐침 시험과 변형을 직접 돌렸고, 클론은 검토 뒤 지웠다. 공유 작업 트리는 읽기만 했다.

[문제 없음으로 확인한 것]
- referenceRate: 공개일 기준 주차, min(day, lastDay), 정수 균등 걸음, divHalfAway 뒤 자르기, FX-REF·drawAt, 상태 커서 없음, FX 층 없음→start, risk 없음→base, rules-1→예외.
- exchangeAmounts·usdLotKrw·krwToUsdRequiredMinor·wageUsdLotsPerWeek: 환율일 s.day, 차감 = applyBasisPoints(r, spread), r∓차감. 환전 불변식은 기록일 referenceRate를 쓰고 엄격 등호를 그대로 둔다.
- dutyFor: 위치 risk.ts, KRW일 때만 환산한다(USD·XXX는 dutyEstimate 그대로). 여섯 호출처의 tariffDay·knownThroughDay·valueFxDay가 DESIGN 3.3 표와 같다. 확인한 행: 미리보기, 수락 자금 검사, 예약(예약 없음·BOOKED·운송 중·편 없음), 도착, 실패 기록 listSailings(acceptedDay+1)[0], contractRiskReport의 0단계와 도착 전.
- acceptTrade의 통화별 자금 검사와 계약 currency = 판매 통화. 혼합 계약만 COGS를 KRW·USD 두 분개로 낸다. FREIGHT-CAPITALIZE·관세는 화물 장부가에 더하지 않고 USD 재고 분개로 쌓는다. 취소·편 놓침은 운임만 USD로 정산하고 원화 화물은 회사 재고로 남는다.
- 실패 기록: 혼합 계약은 USD 몫만 넣는다. PURCHASE- 창만 실패일까지 넓힌다.
- contractReport(currency 기본값)와 campaignSummary(그 통화에 분개가 있는 계약을 모두 셈).
- preview: opts, goodId 누락 예외, purchaseCurrency 대체 규칙, rules-3에서 cashNeed·contributionBeforePayroll은 USD만. cashNeedByCurrency와 모든 일정 줄의 currency는 rules-3에만 나온다. referenceEstimate 식은 H14-3과 같다.
- contractRiskReport: 평가일 규칙, rateAt의 평가일 상한(미래 누설 없음), SETTLE 분개 이중 계산 없음(contractId 없음), 취소 7단계는 CASH 줄만 넣음, 1·9단계는 구성상 0, residual 정의식, openFixedRateKrw.
- withRiskLevel: R0은 같은 객체를 돌려준다. R1은 usdToKrwMinor를 한 번 쓰고, 정적 supplier 견적을 KRW로 바꾸고, layers는 ['FX']다.
- rules-2 경로: 미리보기, 자금 예약, 도착, 실패 기록, 불변식의 값이 같다(USD→dutyEstimate). 두 통화를 더하는 자리는 referenceEstimate와 contractRiskReport뿐이다. 새 상태 칸은 없다.

[무작위 탐침 결과]
R0·R1 각 12시드 90일, 3,984회 평가에서 residual이 0이 아닌 경우는 아래 1번 상태 19건뿐이었다. 정시·늦은 편·취소·운송 중·미예약·재예약 뒤 완료는 모두 0이었다.

[변형 결과]
- FX-REF 같은 번호 반복, 비대칭 걸음, 운송 중 max 제거: 25개 시험이 모두 통과해 잡히지 않는다.
- floor 반올림, contractRiskReport의 tariffDay 변형: 잡힌다.

-- spec#1 major / confirmed→major/confirmed→major
@ src/engine/reports.ts:460, :486-494 (contractRiskReport); 관련 src/engine/engine.ts:946-947, src/engine/reservations.ts:31
P: 편 놓침(준비 미완료로 출항 불참) 뒤 아직 다시 예약하지 않은 열린 계약은 residual이 0이 아니다. 놓친 편의 운임은 releaseBooking으로 돌려받는다. 이 상태에서 다시 내야 할 운임(−p.freight, 평가일 환율)은 realized의 남은 흐름에는 들어간다(:460, `!shipment && !booking`). 그런데 단계 흐름(fxFlows→lateFlows→cancelFlows)에는 이 줄이 없다. 운임 줄은 첫 FREIGHT-PREPAY 날로 옮겨지고, 7단계는 환급 CASH 줄만 더한다. 그래서 residual = −usdToKrwMinor(p.freight, r_eval)이다. DESIGN 3.4의 10단계 ‘늘 0이어야 한다’와 지시서 4절 항등식을 어긴다. R0(rules-2 상태)에서도 같아서, ‘R0: residual = 0’(H6-4)도 깨진다. 판정표 진단 C(components에서 가장 큰 음수 칸)는 residual을 원인 목록에 넣지 않으므로, 캠페인 끝에 재예약하지 못한 계약의 손실 원인이 빠진다.
E: 독립 클론 탐침. R1·R0 모두, 직원 없이 첫 편을 예약해 수락하고 출항 다음 날(day 3)에 평가했다. 결과: {expected:195000, realized:-260000, late:-390000, cancel:195000, residual:-260000}, 시드 1과 42032026이 같다. 무작위 구동기(R0·R1 각 12시드 90일, 3,984회 평가)에서 0이 아닌 residual 19건이 모두 `ACTIVE booking=none ships=false prepays=1` 꼴이었다(예: R1 seed=1 day=17 CT002 res=-231120, R0 seed=9 day=10 CT001 res=-260000). 엔진도 이 상태에서 운임을 다시 낼 돈으로 묶는다(reservations.ts:31 `(!booking || booking.status === 'CANCELLED')` → FREIGHT 예약). 그러므로 realized 쪽 정의는 맞고 분해 쪽이 빠졌다. 기존 시험 ‘편 놓침 뒤 재예약’은 재예약하고 완료한 뒤의 상태만 본다.
FIX: :494 뒤에 `if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));`를 더한다. 아직 내지 않은 재예약 운임을 7단계 ‘재예약 선지급’ 줄로 넣고 평가일 환율로 바꾸는 것이다. 클론에서 이 한 줄로 위 탐침 19건이 모두 0이 되었고(3,984회 BAD 0), 기존 25개 시험도 통과했다. 시험도 하나 더한다: 편 놓침 다음 날, 재예약 전 상태에서 R1·R0 모두 residual === 0, realized === cashValue + 남은 흐름 식. DESIGN 3.4의 7단계 표에 ‘재예약 전이면 남은 운임을 평가일 환율로 넣는다’를 적도록 허브에 알린다.
V1: 주장대로 확인했다. 인용한 줄 번호도 7410957과 모두 맞는다.
- src/engine/reports.ts:460 `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay));`
- :486-494 cancelFlows
- src/engine/engine.ts:946-947 releaseBooking 뒤 `contract.bookingId = null`
- src/engine/reservations.ts:31 FREIGHT 예약

**경로.** 편을 놓치면 releaseBooking이 FREIGHT-RELEASE- 분개를 남긴다. 분개의 CASH 줄은 환급(= 선급 운임 − 취소비)이다. 이어서 bookingId가 null이 된다. 재예약 전에는 realized의 남은 흐름에 −p.freight(평가일 환율)가 들어간다. 단계 흐름에는 이 줄이 없다. 운임 줄은 fxFlows[1]에서 첫 FREIGHT-PREPAY 날로 옮겨진다. 7단계에는 adjustments(RELEASE, 두 번째 이후 PREPAY, CANCEL-COMP)의 CASH 줄만 더해진다.

단계 값은 기대에서 출발해 차례로 더해지므로 합이 value(cancelFlows)로 줄어든다. 그래서 residual = realized − value(cancelFlows) = −usdToKrwMinor(p.freight, r_eval)이다.

**독립 클론(7410957) 탐침.** 직원 없이 첫 편을 예약해 수락하고, 출항 다음 날(day 3)에 평가했다.
- 시드 1과 42032026, R0과 R1 모두 결과가 같았다: `{expected:195000, realized:-260000, late:-390000, cancel:195000, residual:-260000}`.
- 다시 낼 운임 p.freight = 20000센트이고, 평가일 환산은 260000원이다. residual은 정확히 그 음수다.
- cashReservations도 이 상태에서 FREIGHT 20000을 묶는다. 그러므로 realized 쪽 정의(아직 내지 않은 운임)가 맞고, 분해 쪽이 빠졌다.

**무작위 구동기.** R0·R1 × 시드 8개 × 90일, 평가 3,851회를 돌렸다.
- 수정 전: 0이 아닌 residual이 1건이었다. `R0 seed=8 day=24 CT002 ACTIVE booking=none ships=false prepays=1 res=-234000`. 주장한 꼴과 같다.
- 제안한 한 줄을 넣은 뒤: 0건이었다. 탐침 6건도 모두 residual 0, cancel −65000이 되었다. −65000은 환급 195000 − 운임 260000, 곧 취소비의 원화값이라 뜻도 맞다.
- 같은 수정으로 m2a5-risk-fx.test.ts 27개(기존 25개 + 탐침 2개)가 모두 통과했다.

**규정과 어긋나는 곳.**
- DESIGN 3.4 10단계 ‘늘 0이어야 한다’
- 지시서 4절 항등식
- R0 `
VFIX1: **수정.** src/engine/reports.ts:494(미지급 취소 보상 줄) 바로 뒤에 다음 한 줄을 넣는다.
`if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));`

- 뜻: 편 놓침 뒤 재예약 전이면, 아직 내지 않은 재예약 운임을 7단계 줄로 넣는다. 금액과 날은 realized의 남은 흐름 운임 줄과 같다(−p.freight, 평가일 환율).
- 이 꼴이면 USD 비용 줄의 같은 환율 합산이 realized와 똑같이 일어나 반올림도 일치한다.
- `firstPrepayment` 조건 덕분에 운임을 한 번도 내지 않은 계약은 바뀌지 않는다. 그런 계약은 fxFlows[1]이 이미 평가일 운임 줄이다.
- `!cancelled` 조건 덕분에 취소 계약도 바뀌지 않는다.
- 재예약 뒤 또는 출항 뒤에는 booking이나 shipment가 있어 이 줄이 빠진다. 대신 두 번째 PREPAY가 adjustments로 들어간다.
- 두 번 놓친 경우도 RELEASE 둘, PREPAY 둘에 남은 운임 하나로 realized와 맞는다.

**시험 추가.** 기존 ‘편 놓침 뒤 재예약’ 시험 옆에 ‘편 놓침 뒤 재예약 전’ 시험을 R0·R1 둘 다 둔다.
- 상태: 준비 없이 첫 편을 예약해 수락하고 출항 다음 날까지 진행한다.
- 전제: `bookings[0].status === 'CANCELLED'`, `contract.bookingId === null`, shipment 없음, FREIGHT 예약이 cashReservations에 있음.
- 단언: `residual === 0`, `realized === cashValue(s,cfg,c)`에 남은 흐름(판매·운임·관세 예상)을 평가일 환율과 환산 꼴로 더한 값, `open === true`.
- R1에서 시험이 구별력을 가지려면 `referenceRate(평가일) ≠ referenceRate(첫 선지급일)`인 시드나 늦은 편을 고르고, 그 전제를 먼저 단언한다. 탐침에서는 day 3 환율이 1300과 같아 구별이 안 됐다.

**문서.** 허브에 알려 DESIGN 3.4 표 7단계와 TASK-0062 지시서 4절 ‘편 놓침’ 문장에 다음을 더한다: ‘재예약 전이면 아직 내지 않은 운임(남은 흐름의 운임 줄)을 평가일 환율로 넣는다’.
V2: 지적이 그대로 성립한다. 독립 클론(7410957)에서 재현했고 클론은 지웠다.

1. 코드 근거(줄 번호 모두 일치)
- reports.ts:460 `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay));`
  - 편 놓침 뒤에는 engine.ts:946-947에서 `releaseBooking`이 불리고 `contract.bookingId = null`이 된다. 그래서 다시 낼 운임이 realized의 남은 흐름에 들어간다.
  - 설계 3.4 ‘열린 계약’의 ‘아직 내지 않은 운임’과 맞고, reservations.ts:31의 FREIGHT 자금 예약과도 맞다. realized 쪽 정의는 옳다.
- 단계 흐름에는 이 줄이 없다.
  - fxFlows[1]은 첫 FREIGHT-PREPAY 날로 옮겨진다.
  - :486의 cancelFlows는 lateFlows를 그대로 복사한다.
  - :488-494는 FREIGHT-RELEASE, 두 번째 이후 PREPAY, 취소 보상 의무의 CASH 줄만 더한다.
- 그래서 residual = −usdToKrwMinor(p.freight, r_eval)이다.

2. 탐침 결과(시험 파일 안에 임시 it를 넣어 실행)
- 첫 편을 예약해 직원 없이 수락하고 출항 다음 날(day 3)에 평가했다.
  - R1·R0 모두, 시드 1과 42032026 모두 결과가 같다: `{expected:195000, realized:-260000, late:-390000, cancel:195000, residual:-260000}`.
  - 이때 cashReservations는 FREIGHT 20000 USD를 묶고, booking은 CANCELLED, bookingId는 null이다.
- 환율이 바뀐 날의 편 놓침과 두 번 놓친 경우를 따로 돌렸다(시드 1~40 × R1·R0, 평가 160회).
  - 고치기 전: 160회 모두 residual ≠ 0. 예: R1 seed1 day10 rate1282 → −256400, R0 → −260000, R1 seed2 day17 rate1302 → −260400.
  - 고친 뒤: 160회 모두 0.
- 따라서 설계 3.4의 10단계 ‘늘 0이어야 한다’와 H6-4·설계의 ‘R0: residual = 0’이 깨진다.

3. 시험과 측정에 대한 영향
- 기존 시험 ‘편 놓침 뒤 재예약’은 재예약하고 COMPLETED가 된 뒤만 본다. ‘보고 사례’ 시험도 이 상태를 넣지 않아, 누락이 시험에 걸리지 않는다.
- 판정표 146행 진단 C는 residual을 빼고 fx·tariff·surcharge·claim·collection·late·cancel에서 주원인을 고른다. 이 상태에서 cancel은 +195000으로 나온다. 고치면 −65000이 맞다. 그래서 원인 분포가 틀어진다.

4. 심각도 판단: major가 맞다
- 이 상태는 rules-1·rules-2 실행 경로에 닿지 않는다.
  - 
VFIX2: 1. 코드 수정
- src/engine/reports.ts:494 바로 뒤에 한 줄을 더한다.
  `if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));`
  - 아직 내지 않은 재예약 운임을 7단계 cancel에 평가일 환율로 넣는 것이다. 조건은 :460의 남은 운임 조건에 `firstPrepayment`를 더한 것이다.
  - 예약한 적이 없으면 이 조건에서 빠진다. 그 경우 운임 줄은 이미 fxFlows[1]에서 평가일로 남아 있어 따로 넣을 필요가 없다.
  - realized와 같은 금액·날짜·cost 꼴이라 환율별 합산 반올림도 같다.
- 클론에서 이 줄을 넣고 확인했다.
  - 기존 m2a5-risk-fx 시험 25개(주선 매개 사례를 따로 세면 26개)가 모두 통과했다.
  - 위 탐침 166회(day 3 사례 6회, 환율이 바뀐 날·두 번 놓침 사례 160회)가 모두 residual 0이었다.

2. 시험 추가
- 편 놓침 다음 날, 재예약하기 전 상태를 R1·R0 모두 시험한다.
  - booking이 CANCELLED이고 bookingId가 null인지 먼저 단언한다.
  - residual === 0을 단언한다.
  - realized === cashValue(s,cfg,c) + 남은 흐름(판매·운임·관세 예상, r_eval)을 단언한다.
  - cancel === Σ환급 CASH(분개 날 환율) − usdToKrwMinor(p.freight, r_eval)을 단언한다.
- 평가일 환율이 기준 환율(1300)과 다른 시드로 같은 시험을 하나 더 둔다.
- 두 번 놓친 경우(재예약한 편도 놓침)도 하나 넣는다.

3. 문서
- 허브에 알려 설계 3.4 표의 7단계와 지시서 4절 ‘취소·편 놓침’에 한 문장을 더하게 한다: ‘재예약 전이면 아직 내지 않은 운임을 평가일 환율로 넣는다.’

-- spec#2 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-fx.test.ts:144-149 (흐름 유일성), 대상 src/engine/risk.ts:29
P: 지시서 시험 표의 ‘흐름 유일성’ 시험이 스스로를 맞추는 꼴이다. 시험이 `['FX-REF', i+1]` 목록을 직접 만들어 겹치지 않음을 보고, drawAt과 drawUniform이 같음(정의상 같은 식)을 볼 뿐이다. referenceRate가 실제로 쓰는 (흐름, 번호)를 관찰하지 않는다. 다른 시험도 모두 referenceRate 자신과 비교하거나 경계 부등식만 본다. 그래서 걸음 추첨의 핵심 변형이 살아남는다.
E: 클론에서 risk.ts:29만 바꿔 m2a5-risk-fx.test.ts를 돌렸다. (a) `drawAt(seed, 'FX-REF', k)` → `drawAt(seed, 'FX-REF', 1)`(매주 같은 걸음, 곧 시드마다 결정적인 추세): `Tests 25 passed (25)`. (b) `(2 * fx.stepBp + 1)` → `(2 * fx.stepBp)`(걸음 범위가 [−step, step−1]로 한쪽으로 치우침): `Tests 25 passed (25)`. 대조로 floor 반올림 변형은 1개 실패로 잡혔다.
FIX: 시험 안에 독립 오라클을 둔다. 200개 시드와 모든 공개 주에 대해 `drawUniform({seed, cursors:{'FX-REF': n}}, 'FX-REF')`로 걸음을 다시 계산한다. 이어 `divHalfAway(prev*(10000+step),10000)`을 [min,max]로 자른 경로를 만들고 referenceRate와 정확히 같음을 단언한다. 이렇게 하면 같은 번호 반복, 비대칭 범위, 반올림 방식 변형이 모두 잡힌다. 덧붙여 이웃 주 걸음(bp)이 한 시드 안에서 모두 같지는 않음을 단언하면 (a)를 따로 막을 수 있다.
V1: 지적이 그대로 맞다. 반박할 근거를 찾지 못했다.

1) 지시서 근거. 시험 표의 ‘흐름 유일성’ 행은 "위험 순수 함수가 쓰는 (흐름 이름, 번호) 쌍이 서로 겹치지 않는다"를 요구한다(docs/ai/tasks/TASK-0062-risk-fx-krw-purchase.md:135). 설계 3.2는 걸음을 "[-step_bp, +step_bp]의 정수 균등, 흐름 FX-REF, 번호 = 주차"로 정한다(DESIGN.md:88-89).

2) 시험 코드(src/engine/m2a5-risk-fx.test.ts:144-149)는 referenceRate를 한 번도 부르지 않는다.
- 시험이 직접 만든 `['FX-REF', i + 1]` 목록이 서로 다른지만 본다. 이 목록은 늘 서로 다르다.
- 이어 `drawAt(seed, s, i)`와 `drawUniform({seed, cursors:{[s]: i}}, s).value`가 같은지 본다. risk.ts:8에서 drawAt이 바로 그 식으로 정의되어 있어 이것도 늘 참이다.
- 다른 시험도 referenceRate를 자기 자신과 견주거나 경계 부등식(±step_bp+0.5원, [min,max])만 본다. "시드 두 개가 다르다"만 확인한다.

3) 독립 클론(7410957)에서 risk.ts:29만 바꿔 돌렸다.
- 원래 코드: m2a5-risk-fx.test.ts `Tests 25 passed (25)`.
- (a) `drawAt(seed, 'FX-REF', 1)`: 매주 같은 걸음이 나와 시드마다 한 방향 추세가 된다. 이 파일은 `25 passed`, 전체 묶음도 `Test Files 51 passed, Tests 1389 passed | 1 todo`. 이 변형은 바로 (흐름, 번호) 쌍이 겹치는 경우다. ‘흐름 유일성’ 시험이 잡아야 할 대상을 놓친다.
- (b) `(2 * fx.stepBp)`: 걸음 범위가 [−step, step−1]로 치우친다. 이 파일 `25 passed`, 전체 `1389 passed`.
- (d) `'FX-REF', k - 1`: 번호가 하나씩 밀린다. 이 파일 `25 passed`.
- 대조로, 30행 반올림을 floor로 바꾼 변형은 ‘환율 순수성’ 1개 실패로 잡혔다. 지적에 적힌 대조 결과와 같다.

(a)와 (b)는 지시서의 변형 21개 목록에 없다. 그러니 Codex의 변형 보고가 틀린 것은 아니다. 다만 (a)는 FX 경로를 결정적인 추세로 바꾸고 (b)는 치우침을 넣는다. 둘 다 d03 측정(L1·L2, 진단 B·F)에 직접 영향을 주는 값이다. 필수 시험이 내용 없이 통과해 변형이 살아남으므로 major 정의에 맞다. 고정 기록 rules-1·rules-2는 깨지지 않으므로 blocker는 아니다.
VFIX1: m2a5-risk-fx.test.ts:144-149의 시험을 다음 두 부분으로 바꾼다. 클론에서 확인했다: 원래 코드에서는 25개가 모두 통과한다. 변형 (a)·(b)·(d)와 floor 변형에서는 이 시험이 실패한다. floor 변형은 ‘환율 순수성’도 함께 실패한다.

(1) 실제 사용 관찰(지시서 135행의 문자 그대로). 파일 머리에 통과형 mock을 더한다.
`vi.mock('./rng', async (importOriginal) => { const m = await importOriginal<typeof import('./rng')>(); return { ...m, drawUniform: vi.fn(m.drawUniform) }; });`
시험 안에서는 다음 순서로 확인한다.
- `vi.mocked(drawUniform).mockClear(); referenceRate(cfg, cfg.seed, p.lastDay);`를 부른다.
- 호출 기록에서 `[stream, rng.cursors[stream] ?? 0]` 쌍을 모은다.
- 쌍의 수가 공개 주 수 `floor((lastDay − firstDay) / intervalDays)`와 같음을 단언한다.
- `new Set(쌍).size === 쌍.length`를 단언한다.

(2) 독립 오라클(설계 3.2). 시드 1~200과 k = 0..weeks에 대해 다음을 계산한다.
- `u = drawUniform({ seed, cursors: { 'FX-REF': k } }, 'FX-REF').value`. drawAt은 쓰지 않는다.
- `step = floor(u × (2·stepBp + 1)) − stepBp`.
- `rate = clamp(divHalfAway(rate × (10000 + step), 10000), min, max)`.
- `referenceRate(cfg, seed, firstDay + k·intervalDays) === rate`를 정확히 같음으로 단언한다.

덧붙여 서로 다른 걸음이 둘 이상 나온 시드가 있음을 단언한다. 이 단언은 (a)를 따로 막는다. 값은 모두 프로필·publish 설정에서 읽고 자료 ID나 조정 상수는 쓰지 않는다(TASK-0027 R1 준수).
V2: 반박하려 했지만 주장이 그대로 성립한다.

(1) 시험이 아무것도 확인하지 않는다. m2a5-risk-fx.test.ts:144-149는 `['FX-REF', i+1]` 목록을 시험 안에서 직접 만들고, 그 목록이 겹치지 않음을 본다. 이것은 구성상 늘 참이다. 이어 `drawAt(seed, stream, index)`가 `drawUniform({seed, cursors:{[stream]:index}}, stream).value`와 같은지 보는데, risk.ts:7-9의 drawAt 정의가 바로 그 식이므로 이것도 늘 참이다. referenceRate가 실제로 쓰는 (흐름, 번호)는 관찰하지 않는다.
- 지시서 시험 표는 이 시험을 ‘위험 순수 함수가 쓰는 (흐름 이름, 번호) 쌍이 서로 겹치지 않는다’로 정한다(TASK-0062 135행).
- DESIGN.md 60행도 ‘(흐름, 번호) 쌍이 겹치지 않음을 시험한다’를 요구한다.

(2) 독립 클론(7410957)에서 직접 재현했다. 기준 상태는 m2a5-risk-fx.test.ts `Tests 25 passed (25)`다.
- (a) risk.ts:29의 `drawAt(seed, 'FX-REF', k)`를 `drawAt(seed, 'FX-REF', 1)`로 바꿨다. 이것은 모든 주가 같은 (흐름, 번호)를 쓰는, 곧 쌍이 겹치는 변형이다. 그 파일은 `Tests 25 passed (25)`였다. 전체 묶음도 `Test Files 51 passed (51) / Tests 1389 passed | 1 todo`로 아무 시험도 잡지 못했다.
- (b) `(2 * fx.stepBp + 1)`을 `(2 * fx.stepBp)`로 바꿨다. 걸음 범위가 [−s, s−1]이 되어 설계 3.2의 ‘[−step_bp, +step_bp] 정수 균등’에 어긋나는데도 `Tests 25 passed (25)`였다.
- referenceRate·withRiskLevel을 쓰는 시험 파일은 m2a5-risk-fx.test.ts 하나뿐이다(grep 확인). 그래서 다른 시험이나 골든 검사기가 이 변형을 잡을 경로가 없다.
- 환율 순수성 시험이 보는 것은 다음뿐이다: 같은 입력이면 같은 값, 공개일 사이 같은 값, [min, max], |Δ| 경계, 두 시드가 다름. (a)·(b) 모두 이 조건을 만족한다.

(3) 심각도는 major로 맞다. 지시서 시험 표에 있는 필수 시험이 아무것도 확인하지 않아, 바로 그 시험이 막아야 할 변형 (a)가 살아남는다. 변형 21개 목록에는 없는 변형이지만, 시험 표 요구가 지켜지지 않았다. 실제 rules-1·rules-2 경로나 저장에는 영향이 없으므로 blocker는 아니다.

(4) 고침이 실제로 잡는지 클론에서 확인했다. 아래 두 시험을 임시 파일로 넣어 돌렸다.
- 원래 코드: 2개 모두 통과.
- 변형 (a): 관찰 시험과 오라클 시험이 둘 다 실패.
- 변형 (b): 오라클 시험이 실패.
- 참고로 risk.ts 안에서 부르는 drawAt은 같은 모듈 안 호출
VFIX2: m2a5-risk-fx.test.ts의 ‘흐름 유일성’ 시험(144-149행)을, 실제 호출을 관찰하는 시험으로 바꾼다. 경로 오라클도 함께 더한다.

1. 관찰형 흐름 유일성 시험.
- 파일 머리에 통과형 `vi.mock('./rng', async (importOriginal) => { const m = await importOriginal<typeof import('./rng')>(); return { ...m, drawUniform: vi.fn(m.drawUniform) }; })`를 더한다. risk.ts가 './rng'에서 drawUniform을 import하므로 이 감싸기가 실제 호출에 닿는다.
- 시험 본문:
  - `vi.mocked(drawUniform).mockClear()` 뒤에 `referenceRate(cfg, seed, p.lastDay)`를 한 번 부른다.
  - 기록된 호출에서 `[stream, rng.cursors[stream]]` 쌍을 모은다.
  - 단언 ①: 쌍의 개수 = `floor((lastDay − firstDay) / intervalDays)`.
  - 단언 ②: JSON 집합 크기 = 쌍의 개수(겹침 없음).
  - 단언 ③: 번호가 정확히 1..주차다.
- 지금의 자기 생성 목록 비교와 drawAt≡drawUniform 비교는 지운다.

2. 경로 오라클(환율 순수성 시험 안이나 따로).
- 시드 1~200과 모든 공개 주에 대해 시험 안에서 직접 값을 다시 만든다.
  - u = `drawUniform({seed, cursors:{'FX-REF': k}}, 'FX-REF').value`
  - step = `Math.floor(u * (2*stepBp + 1)) − stepBp`
  - rate = `clamp(divHalfAway(prev * (10000 + step), 10000), min, max)`
- 이 값이 `referenceRate(cfg, seed, day)`와 정확히 같음을 단언한다.
- 이 시험은 같은 번호 반복(a), 비대칭 범위(b), 반올림 방식 변형을 모두 잡는다.

3. 결과 보고의 변형 표에 이 두 변형을 짝 시험과 함께 적는다.
- (a) 매주 같은 번호 → 흐름 유일성
- (b) 걸음 범위 [−s, s−1] → 경로 오라클

-- spec#3 minor / not-verified
@ src/engine/risk.ts:27-29 (referenceRate의 주차·흐름 번호)
P: 흐름 번호가 설계 문구와 하나 어긋난다. DESIGN 3.2는 ‘1주차 값 = start_krw_per_usd, k주차 값 = (k−1)주차 × (10000+걸음)/10000, 흐름 FX-REF, 번호 = 주차’다. 코드는 0부터 세는 week(1주차 = 0)를 쓰고, 설계의 k주차(k≥2) 걸음을 번호 k−1로 뽑는다. 값의 분포와 성질(순수성, 경계, 공개일 사이 같음)은 같다. 다만 같은 (seed, day)에서 나오는 환율 경로가 설계 문구대로 만든 구현이나 허브 재현과 다르다. 0063·0064가 ‘(흐름, 번호) = 사건 번호’ 관례를 이어 쓸 때 기준이 흔들린다.
E: risk.ts:27 `const week = Math.max(0, Math.floor((Math.min(day, p.lastDay) - p.firstDay) / p.intervalDays));` 다음 :28-29 `for (let k = 1; k <= week; k++) { const step = Math.floor(drawAt(seed, 'FX-REF', k) * ...`. 1~7일(설계 1주차)은 week 0이고, 8~14일(설계 2주차)의 걸음은 번호 1로 뽑는다. 시험 :146도 같은 관례 `['FX-REF', i + 1]`(1..11)를 그대로 쓴다.
FIX: 둘 중 하나로 맞춘다. (1) 코드를 설계대로 `drawAt(seed, 'FX-REF', k + 1)`(번호 = 설계 주차 2..12)로 바꾸고 시험의 pairs도 고친다. (2) 허브가 DESIGN 3.2 문구를 ‘번호 = 첫 공개 주를 0으로 센 주차(1부터 걸음)’로 고친다. 측정(경로 5) 전, 판정표 고정 기록이 이 경로 값에 묶이기 전에 정한다.

-- spec#4 minor / not-verified
@ src/engine/reservations.ts:35 (자금 예약 tariffDay의 운송 중 분기)
P: 운송 중 분기의 `Math.max(shipment.scheduledArrivalDay, s.day)`(DESIGN 3.3 ‘운송 중이면 max(예정 도착일, 오늘)’)가 시험으로 지켜지지 않는다. 시험 ‘관세 호출 인수 ③’의 운송 중 상태는 출항 다음 날이어서 예정 도착일이 늘 오늘보다 뒤다. 0062 몸통은 tariffDay를 쓰지 않으니 지금 값은 바뀌지 않는다. 하지만 0063이 몸통에서 tariffDay로 세율을 고르기 시작하면, 하역 지연으로 예정 도착일이 지난 화물에서 이 차이가 드러난다.
E: 클론에서 `shipment ? Math.max(shipment.scheduledArrivalDay, s.day)`를 `shipment ? shipment.scheduledArrivalDay`로 바꾼 변형이 `Tests 25 passed (25)`로 살아남았다. 대조로 contractRiskReport의 미예약 tariffDay를 수락일 기준으로 바꾼 변형은 1개 실패로 잡혔다.
FIX: 0063 전에 시험 하나를 더한다. port_restriction을 넣은 설정으로 예정 도착일을 지났는데 dutyMinor가 null인 운송 중 상태를 만든다. 그 상태에서 cashReservations의 dutyFor 호출 tariffDay가 s.day임을 단언한다. 자료(scenarios.json)는 손대지 않고 시험 안에서 설정 사본에 넣는다. 또는 0063 지시서의 시험 표에 이 경우를 명시한다.

===== rules2
요청 렌즈(rules-1·rules-2 불변, 선택 인수 원칙 H13, 골든이 보지 않는 경로)에서는 결함을 찾지 못했다. 렌즈 밖이지만 결함이 하나 나왔다. contractRiskReport가 편 놓침 직후 R0(rules-2) 상태에서 residual ≠ 0을 낸다(major 1건, 아래).

**확인 방법.** BASE 4b3d6a8과 새 7410957을 별도 클론에 두고, 한 node 프로세스에 두 엔진을 함께 올렸다(vite runnerImport). 같은 시나리오를 매일 나란히 돌리며 다음을 문자열 그대로 비교했다: 연 상태, 정책 명령, commitDay 결과, 마감 상태, 그리고 매일의 읽기 함수 출력.

비교한 읽기 함수:
- campaignSummary, companyReport, 계약마다 contractReport(s,c)
- upcomingPayments, cashReservations, commitmentReservations, fundsPosition(USD·KRW), checkInvariants
- tradePreview(정적 쌍 전부), forwardingPreview
- opts 없는 preview(직접 무역·주선)
- paymentDefaultStatus(기본 day와 day+3)
- 상태 없는 usdLotKrw(config)와 usdLotKrw(config,s)
- 시드 없는 exchangeAmounts와 시드 있는 exchangeAmounts
- exchangePreview(1·3·7묶음과 잘못된 금액)
- 환전 planState(분개·로그·operations)
- marketTable, weeklyBottleneck(후보 없음·후보별), hiringOutlook, warehouseSummary
- 열린 매입·판매 쌍마다 quotePreview(기본·최대·잘못된 수량)와 주선 quotePreview
- 진행 중 계약마다 취소 planState
- 저장→불러오기→재직렬화 바이트

**rules-2 범위.** SCENARIO_M2_OPERATIONS, late mode base·cap30·flat200, 정책 IDLE·NO_FX·MAX_CONTRIBUTION·LATE_OK·ON_TIME_FIRST·ASSET_LIGHT·SEEDED_RANDOM·fx:react와 hire·inv·scout 변형 5개, 시드 7·1001·31337·2026·5·1009. 혼란 명령도 넣었다: 실제 계약 취소, 준비가 끝나기 전 첫 편으로 예약을 바꿔 편 놓침 유도, 양방향 환전. 합계 160회, 일치하지 않은 항목 0. 그 안에서 실제로 일어난 사건은 취소 993건, 편 놓침 179건, 지급 불이행 실패 종료 33건이다.

**rules-1 범위.** SCENARIO_IDS 8개 × SIM_POLICIES 5개 × 시드 5개, 혼란 명령 포함 160회(probe 21만여 건), 일치하지 않은 항목 0. 취소 50건이 실제로 일어났다.

**옛 저장.** save-v4-m2와 save-v5-m2를 양쪽에서 불러와 40일 진행했다. 166개 비교 지점이 모두 같았다.

**예외.** rules-1·rules-2에서 옛 서명으로 부르는 경로(UI·sim)에서 새 예외는 나오지 않았다. 확인한 것은 opts 없는 preview, 상태 없는 usdLotKrw, 시드 없는 exchangeAmounts, 통화 인수 없는 contractReport다.

**코드 확인.**
- 로더가 단일 거래 통화를 강제하므로(scenario.ts:269) rules-1·rules-2에는 KRW 매입이 생길 수 없다.
- 생성 견적은 지우지 않으므로 `offerDef(…)!`가 undefined가 될 수 없다.
- 주선 계약은 buyOfferId가 null인 경로를 이미 따로 탄다.
- rules-2에서 계약 ID가 붙은 분개는 모두 계약·노선 통화(USD)다. SETTLE- 분개에는 계약 ID가 없다. 그래서 campaignSummary의 거름 조건을 바꿔도 rules-2 값은 같다.
- 상태 칸은 늘지 않았다.

**변형 재실행.** 변형 2(rules-2 로그 문장)는 m2a5-money 시험 2건이 실제로 잡았다. 변형 17(campaignSummary 계약 통화 거름)은 원화 매입 계약 시험이 잡았다.

**성능.** 같은 실행 6회 기준으로 새 코드가 BASE보다 느려지지 않았다.

**결함(렌즈 밖).** 출항 전 편 놓침 뒤 아직 다시 예약하지 않은 날에는 7단계 `cancel`이 앞으로 낼 재예약 운임을 넣지 않는다. 그래서 residual이 −운임만큼 남는다. 설계 3.4 표의 ‘residual 늘 0’과 지시서의 ‘R0에서 residual = 0’을 어긴다.

두 클론과 출력 파일은 지웠다. rv62 아래에 남은 out·tests-24620·tools는 다른 검토자의 것이다.

-- rules2#1 major / confirmed→major/confirmed→major
@ src/engine/reports.ts:460, 486-497 (contractRiskReport의 남은 흐름과 cancelFlows)
P: 출항 전 편 놓침 뒤 재예약 전 상태(예약이 CANCELLED, 현재 예약 없음, 출항 전, 취소되지 않은 계약)를 평가하면 residual = −(노선 운임 × 평가일 환율 ÷ 100)이 된다. realized에는 460줄에서 앞으로 낼 재예약 운임(−p.freight, 평가일 환율)이 남은 흐름으로 들어간다. 그런데 7단계 cancelFlows는 원장 CASH 줄(FREIGHT-RELEASE- 환급과 이미 낸 재예약 FREIGHT-PREPAY-)만 더하고 이 미래 운임을 넣지 않는다. 그래서 어느 단계에도 배정되지 않은 금액이 residual로 떨어진다. 설계 3.4 표 10단계는 ‘residual 늘 0’이고, 지시서 4절은 ‘위험 설정이 없으면 residual = 0’이다. R0(rules-2 상태)와 R1에서 똑같이 일어난다. 기존 시험 ‘편 놓침 뒤 재예약…’(m2a5-risk-fx.test.ts:554)은 재예약하고 끝난 뒤의 상태만 평가하므로 이 구간을 보지 못한다. 측정(경로 5)에서 막판 편을 놓쳐 다시 예약할 편이 없는 계약은 끝 상태에서도 residual ≠ 0으로 남을 수 있다.
E: [직접 재현] 새 코드, SCENARIO_M2_OPERATIONS 기본 시드. 직원 배정 없이 plan.sailingId만 첫 편(2일 출항)으로 주고 수락한 뒤, 3일 연 상태에서 contractRiskReport를 불렀다.
R0 TRADE: expected 195000, realized -260000, late -390000, cancel 195000, residual -260000
R0 FWD: expected 234000, realized -221000, cancel 195000, residual -260000
R1 TRADE·FWD: 같은 값, residual -260000
노선 운임 20000센트, 환율 1300이므로 −260000 = −20000 × 1300 ÷ 100이다.

[rules-2 대량 확인] 정책 MAX_CONTRIBUTION·LATE_OK·NO_FX·ON_TIME_FIRST·SEEDED_RANDOM × 시드 5·1009·77 × 편 놓침 유도 켬·끔, 매일 모든 계약에 contractRiskReport를 불렀다. 보고서 45,559건 가운데 throws 0, fxNonZero 0, residualNonZero 160. 160건 모두 위 ‘재예약 전’ 조건에 해당했고(조건 밖 0건), 모두 정확히 −노선 운임 × baseKrwPerUsd ÷ 100이었다.
FIX: cancelFlows를 만든 뒤 다음 줄을 더한다: `if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));` 남은 흐름의 운임 줄과 같은 값·같은 날짜를 7단계에 두는 것이다. 내 클론에서 실측한 결과: 위 45,559건이 모두 residual 0이 됐다. 재현 사례의 cancel은 −65000(= 취소비 5000센트 × 13)으로, 편 놓침 비용과 맞는다. m2a5-risk-fx.test.ts 25건도 모두 통과했다. 시험도 하나 더한다: 편 놓침 다음 날, 재예약 전 상태에서 R0·R1 모두 residual === 0이고, cancel이 −취소비 환산값임을 단언한다. 설계 3.4 표 7단계에도 ‘재예약 전 남은 운임은 평가일 환율로 7단계’를 적는다.
V1: 지적이 정확히 성립한다. 반박하려고 코드를 읽고 내 클론(7410957)에서 직접 실행해 확인했다.

[코드 경로] 편을 놓치면 releaseBooking(engine.ts:754-773)이 FREIGHT-RELEASE-BKxx 분개를 남긴다. 이 분개에는 CASH +(선급운임 − 취소비) 줄이 있고, 예약은 booking.status = 'CANCELLED'가 된다. contractRiskReport에서는 다음 일이 겹친다.
- booking(BOOKED만 찾음)과 shipment가 모두 undefined다. 그래서 460줄 `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay))`가 앞으로 낼 재예약 운임을 realized에 넣는다.
- firstPrepayment가 있으므로 fxFlows[1]는 첫 선지급일 환율의 기대 운임이다.
- cancelFlows(486-493줄)는 lateFlows에 원장 CASH 줄만 더한다. 이 시점에는 환급만 있고 재예약 선지급은 아직 없다.
그래서 남은 운임 줄이 어느 단계에도 들어가지 않고 residual로 떨어진다. 재예약을 마치면 FREIGHT-PREPAY-BK2가 adjustments에 들어가 cancel에 잡히므로 residual이 0이 된다. 같은 계약의 분해가 재예약 전과 뒤에 서로 다르게 나온다는 뜻이다.

[직접 재현] SCENARIO_M2_OPERATIONS 기본 시드, 직원 없이 plan.sailingId만 첫 편(2일 출항)으로 주고 수락한 뒤 3일에 평가했다.
- R0·R1, TRADE: realized −260000, cancel 195000, residual −260000. 같은 날 BOOK_SAILING으로 재예약한 뒤에는 realized −260000(같음), cancel −65000, residual 0.
- FWD: residual −260000. 재예약 뒤 0.
지적의 수치와 정확히 같다. −260000 = −20000센트 × 1300 ÷ 100이고, 취소비는 5000센트다.

R1에서 환율이 바뀌는 시드 1~10은 20일까지 재예약하지 않고 평가했다. residual이 −256800, −260400, −259200, −261200, −252800 등으로 나왔다. 모두 정확히 −usdToKrwMinor(20000, referenceRate(평가일))다. 즉 평가일 환율의 남은 운임이 그대로 residual이 된다.

[요구와의 충돌]
- 지시서 4절(92줄): rules-2(R0) 상태에서도 ‘residual = 0’.
- 설계 3.4 표 10단계: ‘늘 0이어야 한다’.
- 설계 7단계는 ‘편 놓침의 … 재예약’을 이 단계 몫으로 둔다.
구현은 이 상태에서 세 가지 모두를 어긴다.

[시험 공백] m2a5-risk-fx.test.ts:554는 재예약해 COMPLETED가 된 뒤에만 평가한다. 열린 계약 시험 (가)·(나)는 예약이 살아 있는 상태만 다룬다. 재예약 전 구간은 어느 시험
VFIX1: 1. src/engine/reports.ts 486줄(cancelFlows 선언) 바로 다음에 한 줄을 더한다.
`if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));`
남은 흐름의 운임 줄(460줄)과 같은 값·같은 날짜를 7단계에 넣는 것이다. firstPrepayment 조건은 꼭 필요하다. 한 번도 예약하지 않은 계약은 fxFlows[1]이 이미 평가일 운임이라, 이 조건이 없으면 두 번 센다. 같은 줄 위에 주석을 단다: ‘편 놓침 뒤 재예약 전: 아직 내지 않은 운임은 평가일 환율로 7단계(재예약 몫)’.

2. 시험을 더한다(m2a5-risk-fx.test.ts, 554줄 시험 옆). R0·R1, 직접 무역과 주선 각각에서 직원 없이 첫 편만 예약하고 수락한 뒤 departureDay + 1까지 진행한다. 다음을 단언한다.
- bookings[0].status === 'CANCELLED'이고 현재 BOOKED 예약과 shipment가 없다.
- 이 재예약 전 상태에서 residual === 0이다.
- cancel === usdToKrwMinor(환급, 해제일 환율) − usdToKrwMinor(운임, 평가일 환율). R0이면 −취소비 × baseKrwPerUsd ÷ 100이다.
- 같은 날 BOOK_SAILING을 한 뒤 평가한 realized·cancel이 재예약 전 값과 같다.
R1은 changedSeed로 평가일 환율이 첫 선지급일 환율과 다른 경우를 넣는다. 수정 전 코드에서 이 시험이 실패하는지(변형 확인) 결과 보고서에 적는다.

3. 설계 3.4 표 7단계 ‘편 놓침’ 문장 끝에 덧붙인다: ‘재예약 전이면 아직 내지 않은 운임을 평가일 환율로 이 단계에 넣는다(남은 흐름과 같은 줄)’. 지시서 4절에도 같은 뜻을 적는다.
V2: 지적이 그대로 맞다. 반박하지 못했다.

[코드 경로] 7410957의 src/engine/reports.ts를 읽었다.
- 편 놓침은 engine.ts:946 processDepartures에서 처리한다. releaseBooking이 FREIGHT-RELEASE-에 CASH 환급 줄을 넣고 booking.status를 'CANCELLED'로 바꾸며, contract.bookingId는 null이 된다.
- 그래서 재예약 전에는 shipment와 booking이 모두 없고, 계약은 ACTIVE이며, firstPrepayment는 있다.
- 이때 460줄 `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay))`가 realized에 앞으로 낼 운임을 넣는다.
- 7단계 cancelFlows는 그 줄을 받지 않는다. 486줄은 [...lateFlows]이고, 487~491줄은 FREIGHT-RELEASE-·CANCEL-COMP-·두 번째 이후 FREIGHT-PREPAY-의 CASH 줄만 더한다.
- fxFlows[1]은 이미 firstPrepayment.day의 기대 운임 줄로 쓰였다. 그래서 이 미래 운임은 어느 단계에도 배정되지 않고 residual로 떨어진다.
- 설계 3.4 표 7단계와 지시서 4절 98줄의 편 놓침 규정은 '환급 CASH 줄과 첫 예약 뒤 재예약 선지급 CASH 줄'만 적었다. 재예약 전 구간은 빠진 명세 구멍이다. 구현은 문구를 따랐지만 10단계 '늘 0'과 4절 92줄 '위험 설정이 없으면 residual = 0'을 어긴다.

[직접 재현] 독립 클론 rules2-v02-17479에서 7410957을 받아 시험 파일을 따로 만들어 돌렸다(지금은 삭제).
- 조건: SCENARIO_M2_OPERATIONS 기본 시드, plan에 sailingId만 주고 수락, 2일 출항편을 놓친 뒤 3일 연 상태.
- R0 TRADE: `{expected:195000, realized:-260000, late:-390000, cancel:195000, residual:-260000}`
- R0 FWD: `{expected:234000, realized:-221000, cancel:195000, residual:-260000}`
- R1 TRADE·FWD: 같은 값이다.
- 같은 상태에서 BOOK_SAILING으로 다시 예약하면 realized는 그대로이고 `cancel:-65000, residual:0`이 된다. realized는 맞고 단계 배정만 빠졌다는 뜻이다.
- 재예약 전 cancel은 +195000(환급만)이라 부호도 틀린다.

[끝 상태] 시드 1·5·77·1009·31337 × R0·R1 × 무역·주선 20개 실행에서, 편을 놓친 뒤 재예약하지 않고 캠페인 끝까지 돌렸다.
- 매일 부른 보고서 가운데 편 놓침 뒤의 날은 모두 residual ≠ 0이었다.
- 끝 상태(evaluationDay = 실패일 또는 campaignDays, 계약 A
VFIX2: src/engine/reports.ts 486줄(cancelFlows 선언) 바로 뒤에 다음 한 줄을 넣는다.
`if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));`

남은 흐름 460줄과 같은 조건·같은 값·같은 날짜다. firstPrepayment가 없을 때는 기대 운임 줄 자체가 이미 평가일에 있어 넣지 않는다.

조건이 서로 어긋나지 않도록 `const pendingFreight = !cancelled && !shipment && !booking;`을 한 번 정의해 460줄과 이 줄에서 같이 쓰기를 권한다.

[내 클론에서 확인한 결과]
- 위 20개 실행의 매일 보고서와 끝 보고서가 모두 residual 0이 됐다.
- 재현 사례의 cancel은 −65000(= −취소비 5000센트 × 13)으로, 재예약한 뒤의 값과 같아졌다.
- R1의 cancel은 usdToKrwMinor(환급, 환급일 환율) − usdToKrwMinor(p.freight, 평가일 환율)이 됐다. 재예약 선지급을 그 날 환율로 7단계에 넣는 설계 규칙과 같은 꼴이다.
- 기존 m2a5-risk-fx.test.ts 25건도 모두 통과했다(49 passed).

[더할 시험] 편 놓침 다음 날, 재예약 전 상태에서 R0와 R1을 모두 평가한다.
- R1은 changedSeed로 평가일 환율이 첫 선지급일 환율과 다른 시드를 쓴다.
- 단언: residual === 0, open === true, realized는 원장 CASH 줄과 남은 흐름의 재계산값과 같음.
- cancel === (FREIGHT-RELEASE- CASH 줄 환산) + (−p.freight의 평가일 환율 환산). 같은 환율의 비용 줄은 합친 뒤 한 번 바꾸는 환산 꼴을 따른다.
- 끝 상태도 하나 넣는다: 재예약 없이 ENDED까지 간 뒤 residual === 0.

[문서] 설계 3.4 표 7단계와 지시서 4절 ‘편 놓침’ 문장에 다음을 더한다. ‘재예약 전(첫 선지급 있음, 예약·선적 없음)에는 남은 운임 −p.freight를 평가일 환율로 7단계에 넣는다’.

===== tests
렌즈: m2a5-risk-fx.test.ts(25개)와 test_validate_data.py 추가분을 지시서 시험 표 전 행·변형 표와 대조했고, 독립 클론(7410957)에서 변형을 다시 적용해 돌렸다. 클론은 끝난 뒤 지웠고 작업 트리는 건드리지 않았다.

[통과한 것]
- 시험은 엔진 공개 함수만 쓴다(sim·simulate·runSuite·d03 import 없음).
- vi.mock('./risk')는 통과형(referenceRate·dutyFor를 vi.fn으로 감쌈)이고, afterEach에서 원래 위임으로 되돌린다.
- '관세 호출 인수'는 여섯 경로마다 바로 앞에서 mockClear를 부른다.
- 다음 전제는 단언이 있다: 시드 찾음, 환율 다름, L≠F, ceil 다름, dutyPaid===false, 열린 계약(open), CANCELLATION_EXPENSE 줄(없으면 `!.amount`에서 실패, 수수료는 설정값 5000과 같음), s.day≠acceptedDay, 계약 1건, 수락일≠실패일.

[필수 변형 재적용 결과] 새 시험 파일 기준으로 모두 잡혔다.
- 3: 환전+도착, 환전만, 도착만 세 가지 모두 '새 흐름 없음'에서 잡힘.
- 4: 5개 시험이 실패.
- 12: '묶음 계산'에서 잡힘.
- 20: 생성기 재환산(20a)·withRiskLevel ÷100 누락(20b) 둘 다 '시세표·행'에서 잡힘.
- 21a: '관세 과세가격'과 '관세 호출 인수'에서 잡힘. 21b: '관세 호출 인수'에서만 잡힘.
- N1(cancel 단계가 CANCELLATION_EXPENSE를 한 번 더 뺌): 취소 R0·R1, 편 놓침, 보고 사례 4개에서 잡힘.

[교차 확인] 변형 1·5·6·7·8·10·11·13~19도 모두 잡혔다. 다만 19는 '환산 도우미' 상수에서만 잡히고, 지시서 표가 함께 적은 '관세 과세가격 ①'에서는 잡히지 않는다.

[살아남은 변형] 아래는 모두 전체 Vitest(1,389 통과·todo 1·실패 0)를 통과했다.
- N2(residual=0 고정)는 단독으로는 동등 변형이다. 그러나 N2와 fx 단계 관세일 오류를 함께 넣으면 살아남는다.
- N3: 환율 번호를 모든 주에 1로 고정.
- N4: referenceEstimate가 고정 환율을 씀.
- N5a·N5b: COGS-USD 금액 오류. 불변식과 불러오기 검사도 통과한다.
- N7·N7b: 자금 검사 기준액 오류.
- N11·N12: 환산 도우미 반올림 방향 변경.
- 파이썬: base_scenario_id 상속 경로를 지운 변형.

[건별 요약] 아래 9건이다(major 5, minor 4). 실제 코드에서 값이 틀린 사례는 찾지 못했다. 예를 들어 정상 COGS-USD는 25,000이고 USD 재고는 0이다. 결함은 위 변형을 시험이 막지 못한다는 점이다.

-- tests#1 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-fx.test.ts:211-215 (원화 매입 계약·계약 보고서 통화), src/engine/invariants.ts:68-73
P: '계약 보고서 통화'의 `contractReport(s,c).contribution = USD 몫` 기대값이 contractReport와 같은 식이다. COGS 두 분개는 ID만 보고 COGS-USD 금액은 보지 않는다. 게다가 invariants.ts의 혼합 계약 보정은 비교 대상의 일부를 그대로 더하는 항등식이다. 그래서 혼합 계약의 USD 재고·매출원가가 망가져도 시험·매일 마감 불변식·불러오기 검사가 모두 통과한다.
E: 시험 214행: `expect(contractReport(s, c).contribution).toBe(contractAmount(s.ledger,'USD',c.id,'REVENUE') - contractAmount(s.ledger,'USD',c.id,'COST_OF_GOODS_SOLD'))`. invariants.ts:71: `lotTotal += contractAmount(s.ledger, c, contract.id, 'INVENTORY')`. 같은 계약의 USD 재고를 장부 잔액과 화물 합계 양쪽에 넣으므로 혼합 계약 몫은 서로 지워진다.

변형 N5a(engine.ts:1080 `const amount = lot.carryingAmountMinor;`) 결과: COGS-CT001-USD = 1,300,000(원 값을 센트로 기록), USD INVENTORY 잔액 −1,275,000, USD contribution −1,160,000(정상 115,000). 그런데 새 파일 25/25, 전체 1,389개가 통과했고 roundtrip(불러오기 불변식)도 통과했다. N5b(USD COGS에서 관세를 뺌)도 전체 통과.
FIX: 시험: 기대 USD 몫을 원장 집계가 아닌 계약 값으로 계산한다. `(c.saleAmountMinor - c.priceReductionMinor) - booking.prepaidFreightMinor - shipment.dutyMinor`. 또 COGS-`${c.id}`-USD 금액 = 선급 운임 + 관세, 인도 뒤 `contractAmount(s.ledger,'USD',c.id,'INVENTORY') === 0`을 단언한다.

불변식(허브 판단, 지시서 6절 문구 그대로 구현된 것이라 지시서 정정이 필요): 혼합 계약의 USD 재고 잔액을 독립 값과 견준다. 인도한 계약은 0, 인도 전이면 자본화한 운임 + 도착 관세.
V1: 반박하려 했지만 지적이 정확히 성립한다. 아래는 7410957을 독립 클론에 체크아웃해 확인한 결과다(클론은 지웠다).

1) 시험 기대값이 구현과 같은 식이다.
- reports.ts:24-36: `contribution = (REVENUE + FORWARDING_REVENUE) − (COST_OF_GOODS_SOLD + FORWARDING_COST) − CANCELLATION_EXPENSE`이고, 값은 모두 `contractAmount(s.ledger, c, id, …)`에서 읽는다.
- 시험 214행 기대값 `contractAmount(USD,REVENUE) − contractAmount(USD,COGS)`는 이 혼합 계약(주선·취소 0)에서 위 식과 같다. 그래서 원장 값이 틀려도 시험은 늘 통과한다.
- 211행은 COGS 분개 ID 목록만 본다. 저장소 전체 시험에서 `COGS-…-USD` 금액을 단언하는 곳은 없다(rg로 확인).

2) 불변식이 항등식이다.
- invariants.ts:68-73은 혼합 계약마다 `lotTotal += contractAmount(s.ledger, USD, id, 'INVENTORY')`를 더한다.
- R1에서는 매입 견적이 모두 KRW다. 그래서 USD INVENTORY 분개는 모두 혼합 계약 ID를 달고, `balance(USD,INVENTORY)`와 `lotTotal`이 같은 합이 되어 검사가 언제나 통과한다.
- 이 검사는 매일 마감(engine.ts:880)과 불러오기(save.ts:135)에서 같은 식으로 돈다. 지시서 6절의 '…USD 재고 분개 잔액까지 더해 맞춘다'를 글자 그대로 구현한 결과다.

3) 실측
- 원래 코드, 시드 1, CT001: COGS-USD = 25,000. 이는 선급 운임 20,000 + 관세 5,000과 같다. 인도 뒤 USD INVENTORY = 0, contribution = 115,000(판매 140,000).
- N5a(engine.ts:1080 `const amount = lot.carryingAmountMinor;`): COGS-USD = 1,300,000, USD INVENTORY = −1,275,000, contribution = −1,160,000. 그런데도 새 파일은 탐침 포함 26/26, 전체는 51개 파일 1,390 통과(1 todo)였다. roundtrip과 매일 마감 불변식도 통과했다.
- N5b(USD 매출원가에서 `sh.dutyMinor`를 뺌): COGS-USD = 20,000, USD INVENTORY = 5,000, contribution = 120,000. 새 파일과 전체 1,389개가 모두 통과했다.
- Codex 보고서의 변형 5('매출원가를 한 통화로')는 ID 단언으로만 잡힌다. 금액을 틀리게 하는 변형은 살아남는다.

4) 등급: major
- 현재 구현 값은 맞으므로 blocker는 아니다(25,000 = 20,000 + 5,000 확인).
- 그러나 지시서가 요구한 시험 '계약 보고서 통화: contrib
VFIX1: 아래 두 가지를 모두 적용하기를 권한다. 각각을 클론에서 검증했다. 원래 코드에서는 전체 1,389개가 통과하고, N5a·N5b는 둘 다 실패한다.

(가) 시험(m2a5-risk-fx.test.ts:214)을 원장 집계가 아닌 계약·예약·선적 값으로 바꾼다.
```ts
const bk = s.bookings.find((b) => b.contractId === c.id && b.status === 'DEPARTED')!, shp = s.shipments.find((x) => x.contractId === c.id)!;
expect(s.ledger.entries.find((e) => e.id === `COGS-${c.id}-USD`)!.lines.find((l) => l.account === 'COST_OF_GOODS_SOLD')!.amount).toBe(bk.prepaidFreightMinor + shp.dutyMinor!);
expect(contractAmount(s.ledger, 'USD', c.id, 'INVENTORY')).toBe(0);
expect(contractReport(s, c).contribution).toBe((c.saleAmountMinor - c.priceReductionMinor) - bk.prepaidFreightMinor - shp.dutyMinor!);
```
이 시험만 넣으면 N5a·N5b 모두 '원화 매입 계약' 시험이 실패한다.

(나) 불변식(invariants.ts:71)은 지시서 6절 정정이 필요한 허브 판단이다. 원장 잔액 대신 상태에서 독립으로 구한 값을 더한다.
```ts
const sh = s.shipments.find((x) => x.contractId === contract.id && x.cargoLotId === contract.cargoLotId);
const lot = s.cargoLots.find((l) => l.id === contract.cargoLotId);
lotTotal += !sh || lot?.status === 'DELIVERED' ? 0
  : (s.bookings.find((b) => b.id === sh.bookingId)?.prepaidFreightMinor ?? 0) + (sh.dutyMinor ?? 0);
```
- 출항 전 0, 출항 뒤 자본화 운임, 도착 뒤 운임 + 관세, 인도 뒤 0이다.
- 관세는 납부했든 미지급이든 도착 때 INVENTORY에 들어가므로 `dutyMinor`를 그대로 쓴다.
- 이 수정만으로도 N5a·N5b가 매일 마감에서 '재고 장부' 오류로 여러 시험을 실패시킨다.
- 원래 코드에서는 열린 계약(관세 미지급)·취소·편 놓침 시험을 포함해 전체가 통과한다.
- rules-2는 이 분기에 들어가지 않으므로 골든에 영향이 없다.
- 지시서 6절 문구는 '혼합 통화 계약의 USD 재고 잔액을 상태 값(출항한 예약의 선급 운임 + 도착 관세, 인도 뒤 0)과 견준다'로 고친다.

변형 표에는 '5b: 혼합 계약 USD 매출원가 금액 오류(장부가 대입·관세 누락)'를 더하고, 잡을 시험을 '원화 매입 계약'과 불변식 마감으로 둔다.
V2: 독립 클론(7410957)에서 직접 확인했고, 지적은 적힌 그대로 성립한다.

1) 시험 214행의 기대값은 자기 충족식이다. 기대식 `contractAmount(USD, REVENUE) - contractAmount(USD, COST_OF_GOODS_SOLD)`는 reports.ts:24-34의 contractReport와 같은 원장 집계식이다. 그래서 USD 매출원가 금액이 틀려도 양쪽이 같이 바뀐다. 210-211행은 COGS 분개의 ID 목록만 보고, 212행은 분개마다 합이 0인지만 본다. COGS-…-USD의 금액은 어디서도 단언하지 않는다.
- 기준 상태의 탐침 값: COGS-CT001-KRW 1,300,000, COGS-CT001-USD 25,000(= 운임 20,000 + 관세 5,000), 인도 뒤 USD 재고 0, contribution 115,000. 지금 코드는 맞다.

2) invariants.ts:68-73은 혼합 계약 몫에 대해 항등식이다. 같은 계약의 USD INVENTORY 잔액(`contractAmount`)을 lotTotal에 더한다. 비교 대상인 `balance(USD, INVENTORY)`에도 그 잔액이 이미 들어 있다. 그래서 혼합 계약의 USD 재고가 어떤 값이어도 서로 지워진다. 비혼합 USD 재고만 실제로 검사된다.

3) 변형 실측:
- N5a(engine.ts:1080을 `const amount = lot.carryingAmountMinor;`로 바꿈): COGS-CT001-USD 1,300,000, 계약 USD 재고와 전체 USD INVENTORY 잔액 −1,275,000, contribution −1,160,000, USD totalAssets −870,000. 그런데 전체 51개 파일, 1,390개 시험(1,389개 + 내 탐침 1개)이 모두 통과했다. finished()의 매일 마감 불변식과 roundtrip의 불러오기 불변식도 통과했다.
- N5b(USD 몫에서 `- sh.dutyMinor`): COGS-USD 20,000, 인도 뒤 USD 재고 5,000이 남고 contribution 120,000. 이 변형도 전체 1,390개가 통과했다.

4) 지시서 6절(119행)이 "혼합 통화 계약의 USD 재고 분개 잔액까지 더해 맞춘다"고 그 항등식을 직접 지시한다. 그래서 불변식 쪽은 Codex의 이탈이 아니라 지시서 결함이다.

5) 등급은 major가 맞다. 지금 엔진 값은 맞으므로 rules-1/2 파손이나 저장 손상은 없어 blocker가 아니다. 다만 '계약 보고서 통화' 행이 요구하는 'contribution = USD 몫' 단언이 사실상 비어 있다. 원장이 망가져도 막는 장치(시험·마감·불러오기)가 하나도 없다. 해당 분기는 혼합 계약 전용이라 rules-2에는 닿지 않는다.

6) 제안한 고침도 클론에서 검증했다.
- 시험만 고친 경우: N5a는 "expected 1300000 to be 25000", N5b는 "expected 20000 to be 25000"로 실
VFIX2: (가) 시험 — src/engine/m2a5-risk-fx.test.ts 214행 '원화 매입 계약'(계약 보고서 통화)을 원장과 독립인 값으로 바꾼다:
```ts
const bk = s.bookings.find((b) => b.contractId === c.id)!, sh = s.shipments.find((x) => x.contractId === c.id)!;
expect(sh.dutyMinor).toBeGreaterThan(0); // 전제: 관세 누락 변형을 구별
expect(s.ledger.entries.find((e) => e.id === `COGS-${c.id}-USD`)!.lines.find((l) => l.account === 'COST_OF_GOODS_SOLD')!.amount).toBe(bk.prepaidFreightMinor + sh.dutyMinor);
expect(contractAmount(s.ledger, 'USD', c.id, 'INVENTORY')).toBe(0);
expect(contractReport(s, c).contribution).toBe(c.saleAmountMinor - c.priceReductionMinor - bk.prepaidFreightMinor - sh.dutyMinor);
```

(나) 불변식 — src/engine/invariants.ts:68-73. 혼합 계약 몫을 더하기 전에 독립 값과 견준다. 지시서 6절 119행의 문구도 이 식으로 정정해야 한다(허브 몫).
```ts
const mixed = contractAmount(s.ledger, c, contract.id, 'INVENTORY');
const expected = contract.deliveredDay !== null ? 0
  : s.bookings.filter((b) => b.contractId === contract.id && b.status === 'DEPARTED').reduce((a, b) => a + b.prepaidFreightMinor, 0)
    + s.shipments.filter((x) => x.contractId === contract.id && x.arrivalDay !== null).reduce((a, x) => a + x.dutyMinor, 0);
if (mixed !== expected) problems.push(`${contract.id} 혼합 통화 USD 재고(${mixed})가 운임·관세 합(${expected})과 다릅니다`);
lotTotal += mixed;
```
이 분기는 혼합 계약(rules-3)에서만 돌아 rules-2 값은 바뀌지 않는다. 클론 검증 결과 원래 코드는 전체 1,390개가 통과하고, N5a·N5b는 각각 9개 시험이 이 문장으로 실패한다.

(다) 변형 표에 N5a(USD 매출원가에 원화 장부가를 씀)와 N5b(USD 매출원가에서 관세를 뺌)를 더하고, 잡아야 할 시험을 '원화 매입 계약/계약 보고서 통화'와 '불변식'으로 적는다. 불변식 시험에는 혼합 계약 USD 재고를 바꾸되 분개 균형을 지킨 사본을 거부하는 단언을 더한다. 이때 '혼합 통화 USD 재고' 문장이 오류에 들어 있는지 단언한다.

-- tests#2 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-fx.test.ts:228-229, 297-300, 319-323 (참고 추정·늦은 편 손익)
P: referenceEstimate와 0단계 기대(`expected === referenceEstimate.pnlKrw`)를 확인하는 단언이 모두 1주차 날(1·2일)에 있다. 그 날 참고 환율은 시작값 = 기준 환율 = 1300이다. 그래서 referenceEstimate가 참고 환율 대신 아무 고정값(1300)을 써도 시험이 통과한다. 이 값은 O1 판단에 쓰는 H0 표시값이고 판정표에도 들어간다.
E: 탐침 출력: `seed 1 accepted 1 rate(accepted) 1300 base 1300 ... candidate 2 rate(cand) 1300`.

변형 N4(reports.ts:129 `const rate = risk ? config.operations!.fx.baseKrwPerUsd : 0;`)가 새 파일 25/25와 전체 1,389개를 통과했다. 늦은 편 후보 조건에는 `referenceRate(day) !== referenceRate(arrivalDay)`만 있고 `≠ start` 조건이 없다.
FIX: 미리보기 날을 환율이 바뀐 주로 옮긴다. 예: changedSeed(laterDay)로 laterDay에서 `preview(..., { goodId })`를 부르고 `referenceRate(cfg, cfg.seed, day) !== profile.fx.startKrwPerUsd`를 먼저 단언한다. 늦은 편 후보에도 `≠ startKrwPerUsd`를 조건으로 더한다. 0단계 기대 등식은 환율이 시작값과 다른 날 수락한 계약에서 확인한다.
V1: 확인됨. 지적 그대로 재현했고, 반박할 근거는 찾지 못했다.

1) 단언이 걸리는 날의 환율은 모두 1300이다. 탐침 출력: `base seed 42032026 day 1 rate 1300 start 1300 baseKrw 1300 publish {firstDay:1,intervalDays:7,...} laterDay 8`, `changed seed 1 accepted day 1 rate(accepted) 1300 buy valid 1 3`, `day 2 rate 1300 late true arr 14 rate(arr) 1282`.
- m2a5-risk-fx.test.ts:228-229는 fresh(cfg)의 1일이다.
- 297-300의 늦은 편 후보는 2일이다. 후보 검색 범위가 정적 매입 견적의 유효 기간인 1~3일(buy.publishDay..validUntilDay)이다. 이 범위는 모두 1주차라서 구조적으로 시작값 아닌 날을 고를 수 없다.
- 319-323의 tradePreview(c.acceptedDay)는 setup()이 1일에 수락한 계약이다.

2) 323의 등식은 자기충족이 아니다. contractRiskReport.expected(reports.ts:471-473)는 referenceEstimate를 읽지 않는다. baseline 흐름을 rateAt(acceptedDay)로 따로 계산한다. 그래서 수락일 환율이 1300이 아니면 실제로 잡히는 단언이다. 다만 지금은 그런 날에서 불리지 않는다.

3) 변형 N4가 살아남는다. 내 클론에서 reports.ts:129를 `const rate = risk ? config.operations!.fx.baseKrwPerUsd : 0;`로 바꾸고 전체를 돌렸다. 결과는 `Test Files 51 passed (51) / Tests 1389 passed | 1 todo`였다.

4) 중요도는 major가 맞다.
- 지시서 시험표의 ‘참고 추정’ 행이 referenceEstimate를 4절 식(rate = referenceRate(config, config.seed, bookingDay))과 대조하라고 요구한다.
- 지시서 4절은 ‘0단계 기대 = 수락일 referenceEstimate.pnlKrw’를 요구한다.
- 판정표 6.1은 결정 기여 D의 `rate = referenceEstimate.rateKrwPerUsd`로 이 값을 측정에 쓴다.
- 그런데 변형이 살아남으므로 ‘필수 시험이 사실상 빈 단언’에 해당한다.
- rules-1과 rules-2에는 영향이 없다(risk=false 경로). 그래서 blocker는 아니다.

5) 고칠 방향을 검증했다. 아래 두 시험은 원본에서 통과하고 N4 변형에서 실패했다.
- (A) 변형 결과: `expected { rateKrwPerUsd: 1300 } to deeply equal { rateKrwPerUsd: 1282 }`.
- (B) 변형 결과: `expected 391615 to be 415003`. 원본에서는 rate 1282
VFIX1: m2a5-risk-fx.test.ts에서 다음을 고친다.

(1) ‘미리보기 기본값·참고 추정’(218-241)에 환율이 바뀐 날의 단언을 더한다. preview는 순수 함수라서 상태 없이 부를 수 있다.
`const cfgL = config(changedSeed(laterDay)); const rL = referenceRate(cfgL, cfgL.seed, laterDay); expect(rL).not.toBe(profile.fx.startKrwPerUsd);`
그다음 정적 매입·판매 견적 금액으로 `preview(cfgL, 'DIRECT_TRADE', buy.cityId, sell.cityId, laterDay, money, deadline, due, { goodId })`를 부른다. 그 결과의 referenceEstimate가 `{ rateKrwPerUsd: rL, saleKrw: usdToKrwMinor(p.sale, rL), pnlKrw: usdToKrwMinor(p.sale, rL) - money.purchase - usdToKrwMinor(p.freight + p.duty, rL) }`와 같은지 toEqual로 단언한다.

(2) ‘관세 과세가격’ 늦은 편 후보(291-300)를 고친다.
- 검색 범위를 정적 견적 유효 기간(1~3일, 모두 시작 주)에서 laterDay 이후 날짜로 넓힌다.
- 조건에 `referenceRate(cfg, cfg.seed, day) !== profile.fx.startKrwPerUsd`를 더한다. 범위를 넓히지 않고 조건만 더하면 후보가 없어 시험이 깨진다.
- 300행의 saleKrw 단언은 그 후보 날에서 한다.

(3) ‘늦은 편 손익’(316-325)의 `report.expected === p.referenceEstimate.pnlKrw` 등식은 환율이 시작값과 다른 날 수락한 계약에서도 확인한다. 예:
- laterDay까지 진행해서 그날 공개된 매입 견적(publishDay === s.day)을 수락한다.
- 먼저 `referenceRate(cfg, s.rng.seed, c.acceptedDay) !== startKrwPerUsd`를 단언한다.
- 그다음 `contractRiskReport(s, cfg, c.id).expected`가 `preview(cfg, c.kind, c.originCityId, c.destinationCityId, c.acceptedDay, {purchase: c.purchaseAmountMinor, sale: c.saleAmountMinor}, c.deliveryDeadlineDay, c.paymentDueDay, { goodId: c.goodId })!.referenceEstimate!.pnlKrw`와 같은지 단언한다.

동적 견적은 config.offers에 없어 tradePreview가 null을 돌려줄 수 있다. 그래서 preview를 직접 부른다.

검증: 이렇게 고친 시험은 원본에서 통과하고 N4 변형(reports.ts:129를 baseKrwPerUsd로 고정)에서 실패한다.
V2: 반박하려 했으나 주장이 그대로 맞다. 다만 제안된 고침 가운데 하나(늦은 편 후보 쪽)는 지금 자료로는 할 수 없다.

1) 세 단언은 모두 환율이 1300인 날에 있다. 독립 클론(7410957)에서 단언 자리에 출력을 넣어 확인했다.
- 출력: `["PROBE default: seed",42032026,"day",1,"rate",1300,"base",1300,"start",1300]`
- 출력: `["PROBE late: seed",1,"accepted",1,"rate(accepted)",1300,"candidate",2,"rate(cand)",1300,"publishDay",1,"valid",3]`
- 출력: `["PROBE late-pnl: seed",1,"accepted",1,"rate(accepted)",1300]`
- `risk.ts:27`에서 week = floor((day − firstDay)/intervalDays)이다. 그래서 1~7일은 week 0이고 환율은 startKrwPerUsd(1300)다. R1의 fx.baseKrwPerUsd도 1300이다.

2) 변형 N4는 살아남는다. `reports.ts:129`를 `const rate = risk ? config.operations!.fx.baseKrwPerUsd : 0;`로 바꿔 돌렸다.
- m2a5-risk-fx.test.ts: 25/25 통과.
- 전체: Test Files 51 passed, Tests 1389 passed | 1 todo.

3) 323행 단언(`report.expected === p.referenceEstimate.pnlKrw`)은 그 자체로 헛돌지 않는다. `contractRiskReport`의 expected는 `value(baseline)`(reports.ts:471-473)이 `rateAt(acceptedDay)`로 따로 계산하고, referenceEstimate를 읽지 않는다. 그런데 비교하는 수락일이 1일이어서 환율 항을 가르지 못한다. 240행 `tradePreview(...)).toEqual(p)`는 양쪽이 같은 함수라 변형도 똑같이 들어간다.

4) 측정에 쓰이는 값이다. 판정표 JUDGMENT_TABLE.md:248이 결정 기여 D에 `rate = referenceEstimate.rateKrwPerUsd`를 쓰고, 이 D를 실행기의 정렬·양수 거름·늦은 편 검사에 쓴다. 그래서 고정 환율 변형이 남으면 경로 3 측정이 조용히 틀어질 수 있다. 지시서 시험표 ‘참고 추정’은 "4절의 식과 같다"를 요구하고, 그 식의 핵심은 `referenceRate(config, config.seed, bookingDay)`다. 그런데 시험은 rate 항을 가르지 못한다. 그래서 major가 맞다.

blocker는 아니다. 구현 자체는 맞고, rules-1·rules-2와 저장은 영향이 없다.

제안 고침의 실현 가능성:
- 정적 매입 견적의 유효 기간은 1~3일이다(publishDay 1, validUntilDay 3). 그래서 291
VFIX2: src/engine/m2a5-risk-fx.test.ts에 바뀐 환율 주에서 확인하는 단언을 더한다. 291~295행 후보 범위에 `≠ start` 조건을 더하는 방식은 쓰지 않는다. 정적 견적 유효 기간이 1~3일이라 후보가 없다.

(가) 218행 시험이나 새 시험에서 다음을 한다.
```ts
const cfg = config(changedSeed(laterDay));
const r = referenceRate(cfg, cfg.seed, laterDay);
expect(r).not.toBe(profile.fx.startKrwPerUsd);
const p = preview(cfg, 'DIRECT_TRADE', buy.cityId, sell.cityId, laterDay, money, sell.deliveryDeadlineDay!, sell.paymentDueDay!, { goodId: buy.goodId })!;
expect(p.lateOnNextSailing).toBe(true); // 늦은 편 후보도 함께 덮는다
expect(p.referenceEstimate).toEqual({ rateKrwPerUsd: r, saleKrw: usdToKrwMinor(p.sale, r),
  pnlKrw: usdToKrwMinor(p.sale, r) - money.purchase - usdToKrwMinor(p.freight + p.duty, r) });
```
buy·sell·money는 fresh(cfg)의 openTradePairs 첫 쌍에서 읽는다. 늦은 편 미리보기는 이 시드에서 laterDay에 이미 늦다(검증에서 도착 14일 > 납기 8일).

(나) 0단계 등식을 환율이 바뀐 수락일에서 확인한다.
```ts
let s = advance(fresh(cfg), cfg, laterDay);
const pair = openTradePairs(s, cfg)[0]!;
// setup처럼 원화를 환전한 뒤 ACCEPT_TRADE를 적용한다
const c = s.contracts.at(-1)!;
expect(referenceRate(cfg, s.rng.seed, c.acceptedDay)).not.toBe(profile.fx.startKrwPerUsd);
const q = preview(cfg, c.kind, c.originCityId, c.destinationCityId, c.acceptedDay,
  { purchase: c.purchaseAmountMinor, sale: c.saleAmountMinor }, c.deliveryDeadlineDay, c.paymentDueDay,
  { goodId: c.goodId, purchaseCurrency: offerDef(s, cfg, c.buyOfferId!)!.currency })!;
expect(contractRiskReport(s, cfg, c.id).expected).toBe(q.referenceEstimate!.pnlKrw);
```
생성 견적은 config.offers에 없어 tradePreview가 null을 내므로 preview를 직접 부른다.

결과 보고서 변형 표에 N4(`reports.ts:129` 고정 기준 환율)와 이를 잡는 시험을 적는다. 검증에서 이 두 단언은 원래 코드에서 통과하고 N4에서 실패했다.

-- tests#3 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-fx.test.ts:144-149 (흐름 유일성), src/engine/risk.ts:29
P: '흐름 유일성' 시험은 쌍 목록 `['FX-REF', i+1]`을 시험 안에서 직접 만들고 Set 크기를 잰다. 결과가 정해져 있는 항등 단언이다. drawAt과 drawUniform을 견주는 부분도 drawAt 구현을 다시 적은 것뿐이다. referenceRate가 주마다 다른 번호를 쓰는지는 어디서도 확인하지 않는다.
E: 변형 N3(risk.ts:29 `drawAt(seed, 'FX-REF', k)` → `drawAt(seed, 'FX-REF', 1)`)은 모든 주가 같은 걸음을 써서 한 방향으로만 움직이는 추세가 된다. 이 변형이 새 파일 25/25와 전체 1,389개를 통과했다. '환율 순수성'의 범위·걸음 상한·시드 차이 단언도 모두 만족한다.
FIX: 설계 3.2의 식으로 경로를 시험 안에서 다시 계산해 공개일마다 견준다: `step_k = floor(drawAt(seed,'FX-REF',k)*(2*stepBp+1)) - stepBp`, `rate_k = clamp(divHalfAway(rate_{k-1}*(10000+step_k), 10000))`, 이 값이 `referenceRate(cfg, seed, firstDay + k*interval)`과 같은지 여러 시드에서 단언한다. 최소한 어떤 시드에서 주별 걸음이 서로 다름을 단언한다.
V1: 반박하려 했지만 지적이 그대로 성립한다.

1. 시험이 항등 단언이다. src/engine/m2a5-risk-fx.test.ts:144-149의 '흐름 유일성'은 `pairs = Array.from(..., (_, i) => ['FX-REF', i + 1])`를 시험 안에서 직접 만든다. 그다음 `new Set(pairs.map(JSON.stringify)).size === pairs.length`를 단언한다. 1..W의 서로 다른 정수이므로 구현과 무관하게 늘 참이다. 이어지는 `drawAt(base.seed, stream, index) === drawUniform({seed, cursors:{[stream]: index}}, stream).value`는 risk.ts:7-9의 drawAt 몸통을 그대로 다시 적은 것이다. 두 단언 모두 referenceRate가 실제로 어떤 (흐름, 번호) 쌍을 쓰는지 관찰하지 않는다.
   - 지시서 시험표의 이 행은 '위험 순수 함수가 **쓰는** (흐름 이름, 번호) 쌍이 서로 겹치지 않는다'이다.
   - 설계 3.2는 '흐름 FX-REF, 번호 = 주차'를, 설계 2절 3은 '(흐름, 번호) 쌍이 겹치지 않음을 시험한다'를 요구한다.
   - 따라서 필수 시험이 공허하다.

2. 변형이 실제로 살아남는다. 독립 클론(7410957)에서 risk.ts:29를 `drawAt(seed, 'FX-REF', 1)`로 바꿨다.
   - `npx vitest run src/engine/m2a5-risk-fx.test.ts`는 'Tests 25 passed (25)'였다.
   - 전체 `npx vitest run`은 'Test Files 51 passed, Tests 1389 passed | 1 todo'였다.
   - 이 변형에서는 모든 주가 같은 걸음을 써서, 시드마다 한 방향으로만 가는 결정적 추세가 된다. 그래도 '환율 순수성'의 범위·걸음 상한·공개일 사이 불변·시드 차이 단언을 모두 만족한다.
   - 다른 시험의 '두 주 환율이 다름' 전제도 걸음이 0이 아니면 그대로 성립한다.
   - Codex 보고서의 변형 표(21개)에는 이 변형이 없다. Codex가 거짓 주장을 한 것은 아니고, 필수 시험이 이 변형을 못 잡는다는 결함이다.

3. 심각도는 major가 맞다.
   - blocker가 아닌 이유: rules-1·rules-2와 저장에는 닿지 않는다(rules-2는 risk가 없어 baseKrwPerUsd를 바로 돌려준다). 현재 구현(k 사용)도 설계와 맞다.
   - major인 이유: 지시서가 요구한 필수 시험이 공허해서, rules-3 측정값(환율 경로가 무작위 걸음이라는 핵심 의미)을 망가뜨리는 변형이 살아남는다. 심각도 기준의 major 정의에 정확히 들어맞는다.

4. 고침안을 확인했다. 클론에 임시 시험 파일을 만들어 고침안 두 갈래를 돌렸다. 둘 다 N3 변형에서 실패하고, 원래 코드에서는 통과했다.
   - (가) 경로 다시 계산은 'expected 1264 to b
VFIX1: src/engine/m2a5-risk-fx.test.ts:144-149의 '흐름 유일성'을, 구현이 실제로 쓰는 쌍을 관찰하는 시험으로 바꾼다. 아래 둘을 함께 넣는다. 둘 다 클론에서 N3을 잡고 원래 코드에서 통과함을 확인했다.

(1) 실제 사용 쌍 기록 — 지시서 행의 글자 그대로의 구현이다.
- 파일 머리에 통과형 목을 더한다: `vi.mock('./rng', async (importOriginal) => { const m = await importOriginal<typeof import('./rng')>(); return { ...m, drawUniform: vi.fn(m.drawUniform) }; })`. risk.ts가 './rng'의 drawUniform을 import하므로 drawAt 안의 호출까지 닿는다. 기본 동작은 원래 함수에 위임하므로 다른 시험에 영향이 없다.
- 시험 안에서 순서대로 한다:
  - `vi.mocked(drawUniform).mockClear()`를 부른다.
  - `referenceRate(cfg, seed, p.lastDay)`를 한 번 부른다.
  - `pairs = mock.calls.map(([st, stream]) => JSON.stringify([stream, st.cursors[stream]]))`로 쌍을 모은다.
- 단언:
  - `pairs.length === W`, 단 `W = floor((lastDay − firstDay) / intervalDays)`.
  - `new Set(pairs).size === pairs.length`.
  - `pairs`가 `[['FX-REF',1], …, ['FX-REF',W]]`와 같다.

(2) 설계 3.2 식으로 경로를 다시 계산해 견준다(여러 시드, 예: 1..50).
- `rate_0 = fx.startKrwPerUsd`.
- 공개일 `firstDay + k*interval ≤ lastDay`인 k마다:
  - `step_k = floor(drawAt(seed,'FX-REF',k) * (2*stepBp+1)) − stepBp`
  - `rate_k = clamp(divHalfAway(rate_{k−1} * (10000+step_k), 10000), min, max)`
  - `referenceRate(cfg, seed, firstDay + k*interval) === rate_k`를 단언한다.
- 덧붙여, 어떤 시드에서 `new Set(step_k).size > 1`임(주별 걸음이 서로 다름)을 단언한다.

기존의 drawAt === drawUniform 재서술 단언은 빼도 된다. 결과 보고의 변형 표에 이 변형('FX-REF 번호를 주차 대신 상수로')을 '흐름 유일성'이 잡는 줄로 더한다.
V2: 반박을 시도했으나 지적은 그대로 성립한다. 심각도는 major로 확정한다.

1) 항등 단언이다. src/engine/m2a5-risk-fx.test.ts:144-149의 '흐름 유일성' 시험은 쌍 목록을 시험 안에서 `Array.from({length: W}, (_, i) => ['FX-REF', i + 1])`로 직접 만든다. 그 Set 크기가 W라는 단언은 구현과 상관없이 늘 참이다. 이어지는 `drawAt(base.seed, stream, index)` = `drawUniform({seed, cursors: {[stream]: index}}, stream).value` 비교도 risk.ts:7-9 drawAt 몸통을 다시 적은 것일 뿐이다. referenceRate가 실제로 어떤 (흐름, 번호) 쌍을 쓰는지는 이 시험이 관찰하지 않는다. 지시서 표의 요구(설계 9절 '(흐름, 번호) 쌍 유일성 시험')는 "위험 순수 함수가 쓰는 쌍이 겹치지 않는다"인데, 이를 확인하지 못한다.

2) 변형 N3가 살아남는다. 따로 만든 클론(7410957)에서 risk.ts:29를 `drawAt(seed, 'FX-REF', 1)`로 바꾸고 돌렸다.
- `npx vitest run src/engine/m2a5-risk-fx.test.ts`: 25 passed (25)
- `npx vitest run`: Test Files 51 passed, Tests 1389 passed | 1 todo

동작은 실제로 바뀐다. 변형하면 모든 주가 1주차 걸음을 되풀이한다.
- 시드 1: 경로 1300,1282,1264,1246,…,1170,1170,1170. 하한까지 한 방향으로만 내려간다.
- 시드 2: 1300,1295,1290,…,1246. 역시 한 방향이다.
원래 걸음 열은 -140,13,-142,-245,… 처럼 주마다 다르다. 그런데 '환율 순수성'의 단언은 변형 경로에서도 모두 맞는다. 범위, |Δ|×10000 ≤ 전주×stepBp+5000, 공개일 사이 같은 값, 시드 차이 단언 모두 그렇다. 다른 시험은 기대값을 referenceRate 자신으로 계산하므로 잡지 못한다. rules-2는 baseKrwPerUsd를 바로 돌려주므로 골든 검사도 잡지 못한다.

3) 심각도 판단. rules-1·rules-2와 저장은 깨지지 않으므로 blocker가 아니다. 그러나 다음 셋 때문에 major 기준에 맞는다.
- rules-3 환율 경로가 무작위 걸음에서 결정적 추세로 바뀐다. 측정(L1/L2, 진단 B 경계 닿음)에 직접 영향을 주는 값이다.
- 지시서가 요구한 시험이 항등 단언이다.
- 그 때문에 변형이 살아남는다.

4) 고침 검증. 고침 두 가지를 클론에서 확인했다. 둘 다 원래 코드에서는 통과하고 N3 변형에서는 실패한다.
- (a) 경로 재계산: 50시드에서 어긋남 492건으로 실패.
- (b) rng 첩자: `expected 1 to be 11`로 실패.
클론은 삭제했다.
VFIX2: '흐름 유일성' 시험(m2a5-risk-fx.test.ts:144-149)을 실제 사용 쌍을 관찰하는 꼴로 바꾸고, '환율 순수성'에 경로 재계산을 더한다.

(a) 흐름 유일성. 시험 파일 머리에 통과형 rng 첩자를 둔다. `vi.mock('./rng', async (importOriginal) => { const m = await importOriginal<typeof import('./rng')>(); return { ...m, drawUniform: vi.fn(m.drawUniform) }; })`. risk.ts가 './rng'에서 drawUniform을 import하므로 이 첩자가 닿는다. 시험 본문은 다음과 같다.
- `vi.mocked(drawUniform).mockClear()` 뒤 `referenceRate(cfg, seed, p.lastDay)`를 부른다.
- `pairs = mock.calls.map(([st, stream]) => JSON.stringify([stream, st.cursors[stream]]))`로 실제 쌍을 모은다.
- W = floor((lastDay − firstDay) / intervalDays)일 때 `pairs.length === W`, `new Set(pairs).size === pairs.length`, `pairs`가 ['FX-REF', 1..W]와 같음을 단언한다.

(b) 환율 순수성. 시드 여러 개(예: 1~50)에서 설계 3.2 식으로 경로를 시험 안에서 다시 계산한다. `step_k = floor(drawAt(seed,'FX-REF',k) × (2·stepBp+1)) − stepBp`, `rate_k = clamp(divHalfAway(rate_{k−1} × (10000+step_k), 10000), min, max)`로 계산하고, 공개일마다 `referenceRate(cfg, seed, firstDay + k·intervalDays) === rate_k`를 단언한다.

결과 보고서 변형 표에 N3(risk.ts:29 번호를 1로 고정)와 그것을 잡는 시험을 더한다.

-- tests#4 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-fx.test.ts:230-239 (자금 검사), src/engine/engine.ts:322-323
P: '자금 검사' 행은 cashNeedByCurrency가 수락 자금 검사의 두 기준과 같아야 한다. 그런데 시험은 이를 미리보기 자기 칸(`p.freight + p.duty`, `money.purchase`)하고만 견준다. 거절 확인도 원화를 거의 다 뺀 상태와 USD를 다 바꾼 극단 상태에서만 하므로 기준액이 고정되지 않는다.
E: 변형 N7(engine.ts:323 USD 검사 `route.bookingFeeMinor + duty` → `route.bookingFeeMinor`, 관세 예약 누락)과 N7b(engine.ts:322 원화 검사 `purchase` → `Math.floor(purchase / 2)`)가 둘 다 새 파일 25/25와 전체 1,389개를 통과했다. 단언은 `reasonKo`에 '원'·'USD'가 들어 있는지만 본다.
FIX: fundsShortfall 문장에는 `필요 ${formatMoney(currency, needMinor)}`가 찍힌다. 그래서 거절 문장에 `필요 ${formatMoney('KRW', cashNeedByCurrency[KRW])}`와 `필요 ${formatMoney('USD', cashNeedByCurrency[USD])}`가 들어 있음을 단언한다. 또는 짝 분개를 붙인 의무를 넣어 가용액을 기준 − 1(거절)과 기준(수락)으로 맞춘 경계 시험을 둔다.
V1: 지적이 그대로 성립한다. 7410957을 별도 클론에 받아 직접 돌려 확인했다.

1) 지시서 요구와 실제 시험이 다르다.
- 지시서 TASK-0062 146행의 '자금 검사' 행은 "`cashNeedByCurrency`가 두 기준과 같다"를 요구한다.
- 실제 시험(m2a5-risk-fx.test.ts 218-240, '미리보기 기본값·참고 추정·자금 검사')은 `expect(p.cashNeedByCurrency).toEqual([{KRW, money.purchase}, {USD, p.freight + p.duty}])`로 미리보기 자기 칸하고만 견준다. 수락 자금 검사(engine.ts:322-323)의 기준액과는 연결되지 않는다.
- 거절 단언은 `reasonKo`에 '원'·'USD'가 들어 있는지만 본다.
- 거절 상태 두 개는 모두 기준에서 멀다. 원화를 뺀 상태는 KRW 가용 21,200원이고 매입은 1,300,000원이다. 달러를 다 바꾼 상태는 USD 가용 0.00 USD다.

2) 관세는 0이 아니어서 N7은 결과가 같은 변형이 아니다.
- R1 첫 쌍의 값: dutyRateBasisPoints 500, 운임 20,000센트, 관세 5,000센트, `cashNeedByCurrency` = [KRW 1,300,000, USD 25,000]. 가용액은 KRW 10,000,000, USD 300,000이다.

3) 변형 결과:
- N7(engine.ts:323 `route.bookingFeeMinor + duty` → `route.bookingFeeMinor`)은 새 파일 25/25와 전체 1,389개(51개 파일)를 모두 통과했다.
- N7b(engine.ts:322 `purchase` → `Math.floor(purchase / 2)`)도 전체 1,389개를 통과했다.
- Codex 보고서 91행은 변형 6(한 통화로 합침)만 이 시험에 대응시킨다. 기준액 변형은 다루지 않는다.

4) 제안한 고침이 두 변형을 실제로 잡는지 확인했다. 두 안을 클론에서 각각 넣어 보았다.
- 문장 단언 안: N7에서 "expected '…필요 200.00 USD(운임 200.00 USD + 관세 50.00 USD)…' to contain '필요 250.00 USD'"로 실패한다. N7b에서 "필요 650,000원(매입 1,300,000원)"이 "필요 1,300,000원"과 달라 실패한다.
- 경계 시험 안(문장 단언을 뺀 상태): N7은 "USD 1: expected 'APPLIED' to be 'REJECTED'", N7b는 "KRW 1: expected 'APPLIED' to be 'REJECTED'"로 실패한다.
- 두 안 모두 변형이 없는 원본에서는 25/25로 통과한다.

심각도: 지시서가 요구한 시험 조건이 빠져 기준액 변형이 살아남는다. 판정 기준의 major에 해당한다. rules-1·rules-2 동작이나 저장은 깨지지 않으므로 blocker는 아니다.
VFIX1: '미리보기 기본값·참고 추정·자금 검사' 시험에 아래 두 가지를 모두 넣는다. 문장 단언은 기준액을, 경계 시험은 비교 자체를 고정한다. 두 안 모두 N7·N7b를 잡는 것을 클론에서 확인했다. 넣는 위치는 기존 `tradePreview` 단언 뒤다. `formatMoney`는 `./money`에서 import한다.

(1) 거절 문장의 필요액을 `cashNeedByCurrency`와 묶는다:
```ts
const need = p.cashNeedByCurrency!;
expect(krw.results[0]!.reasonKo).toContain(`필요 ${formatMoney('KRW', need[0]!.amountMinor)}`);
expect(usd.results[0]!.reasonKo).toContain(`필요 ${formatMoney('USD', need[1]!.amountMinor)}`);
```

(2) 통화마다 가용액을 기준 − 1과 기준에 맞춘 경계 시험. 짝 분개가 붙은 기존 `inject` 도우미를 쓴다:
```ts
for (const { currency, amountMinor } of need) for (const gap of [1, 0]) {
  const t = structuredClone(s);
  inject(t, currency, fundsPosition(t, cfg, currency).available - amountMinor + gap, t.day, `경계-${currency}-${gap}`);
  expect(fundsPosition(t, cfg, currency).available).toBe(amountMinor - gap);
  const r = planState(t, cfg, [{ id: '경계', type: 'ACCEPT_TRADE', ...pair }]).results[0]!;
  expect(r.status, `${currency} ${gap}`).toBe(gap ? 'REJECTED' : 'APPLIED');
}
```

그리고 결과 보고서 변형 표에 N7·N7b 같은 기준액 변형을 '자금 검사' 행으로 추가한다.
V2: 반박을 시도했지만 주장이 그대로 성립한다. 실행은 내 클론(7410957, 작업 후 삭제)에서만 했다.

1) 지시서 시험표 '자금 검사' 행(TASK-0062-risk-fx-krw-purchase.md:146)은 "`cashNeedByCurrency`가 두 기준과 같다"를 요구한다. 그런데 m2a5-risk-fx.test.ts:230은 `expect(p.cashNeedByCurrency).toEqual([{KRW, money.purchase}, {USD, p.freight + p.duty}])`뿐이다. 이는 미리보기가 같은 함수 안에서 계산한 freight·duty와 견주는 자기 참조이고(reports.ts:133-135), 수락 자금 검사(engine.ts:322-323)의 기준액과는 이어지지 않는다. 같은 금액을 단언하는 시험은 저장소 전체에 없다(`cashNeedByCurrency`는 reports.ts와 이 시험 한 줄에만 나온다).

2) 거절 단언은 `reasonKo`에 '원'(:233)이나 'USD'(:238)가 들어 있는지만 본다. 거절 상태도 극단값이다. 콘솔로 찍어 보니 KRW 거절은 사용 가능 21,200원 대 필요 1,300,000원이고, USD 거절은 사용 가능 0.00 USD 대 필요 250.00 USD(운임 200 + 관세 50)였다. 그래서 기준을 절반으로 줄이거나 관세를 빼도 계속 거절된다.

3) 변형 실측 결과:
- N7(engine.ts:323 `route.bookingFeeMinor + duty` → `route.bookingFeeMinor`)에서 전체 vitest가 `Test Files 51 passed, Tests 1389 passed | 1 todo`로 살아남았다.
- N7b(engine.ts:322 `purchase` → `Math.floor(purchase / 2)`)도 전체 `1389 passed | 1 todo`로 살아남았다. 원래 코드의 새 파일 결과는 25/25 통과다.

4) 제안한 고침이 실제로 잡는지도 확인했다. fundsShortfall(engine.ts:277)은 `f.available >= needMinor`로 비교하고, 문장에 같은 `needMinor`를 `필요 ${formatMoney(currency, needMinor)}(`로 찍는다. 따라서 문장 속 '필요' 금액을 단언하면 기준액이 고정된다. 이 단언을 넣으면 원래 코드는 통과한다. N7은 `expected '…필요 200.00 USD(운임 200…' to contain '필요 250.00 USD('`로, N7b는 `expected '…필요 650,000원(매입 1,300…' to contain '필요 1,300,000원('`로 각각 1건 실패해 둘 다 잡힌다.

등급 판단: 구현 코드 자체는 맞다(원래 문장의 필요액 1,300,000원, 250.00 USD는 미리보기 값과 같다). 결함은 필수 시험 행이 요구 단언을 빠뜨려 핵심 rules-3 자금 기준 변형이 살아남는다는 것이다. 지침의 major 정의('req
VFIX2: src/engine/m2a5-risk-fx.test.ts의 '미리보기 기본값·참고 추정·자금 검사' 시험을 고친다.

(a) import를 `import { applyBasisPoints, formatMoney, type Currency } from './money';`로 바꾼다.

(b) :233 KRW 거절 단언 뒤에 다음을 넣는다.
```
expect(p.duty).toBeGreaterThan(0);
expect(krw.results[0]!.reasonKo).toContain(`필요 ${formatMoney('KRW', p.cashNeedByCurrency![0]!.amountMinor)}(`);
```
`p.duty > 0` 전제는 관세가 0인 짝에서 N7이 같은 결과를 내는 변형이 되지 않게 한다.

(c) :238 USD 거절 단언 뒤에 다음을 넣는다.
```
expect(usd.results[0]!.reasonKo).toContain(`필요 ${formatMoney('USD', p.cashNeedByCurrency![1]!.amountMinor)}(`);
```

실측: 원래 코드 통과, N7과 N7b는 각각 1건 실패.

문장 형식에 덜 기대려면 경계 시험을 추가로 둔다. 짝 분개를 붙인 `inject`류 의무로 가용액을 맞춘다. KRW는 `cashNeedByCurrency[0]` − 1이면 REJECTED, 정확히 그 값이면 APPLIED(이때 USD는 충분)인지 본다. USD는 `cashNeedByCurrency[1]`에 대해 같은 방식으로 본다.

결과 보고서 변형 표에 N7·N7b 행을 더해 잡은 시험을 적는다.

-- tests#5 major / partly→minor/partly→minor
@ src/engine/m2a5-risk-fx.test.ts:305,314,324,339,429,468,568,579 (residual === 0 단언), src/engine/reports.ts:497
P: 항등식 `realized = expected + Σ단계`를 확인하는 곳은 보고서가 직접 계산해 내놓는 `components.residual` 칸뿐이다. residual을 0으로 고정하면 fx·expected의 크기 오류를 잡는 장치가 사라진다. fx는 부호만, expected는 1주차 미리보기 값하고만 견준다.
E: N2(reports.ts:497 `components.residual = 0;`) 단독: 0개 실패. 지금 실제 residual이 0이라 동등 변형이다.

FXDUTY(reports.ts:480 `fxFlows[2]!.day = c.acceptedDay;`, fx 단계 관세 환율일 오류) 단독: residual 단언 5곳에서 실패(늦은 편 900, 열린 계약 900, 실패 종료 7331 등).

N2+FXDUTY 함께: 새 파일 25/25와 전체 1,389개 통과.
FIX: 공통 도우미를 둔다. `const sum = Object.entries(r.components).filter(([k]) => k !== 'residual').reduce((n, [, v]) => n + v, 0); expect(r.realized - r.expected - sum).toBe(0); expect(r.components.residual).toBe(r.realized - r.expected - sum);`. realized는 이미 cashValue로 따로 계산되므로 이것만으로 FXDUTY 같은 단계 오류가 잡힌다. 정시 계약 하나에서 fx를 줄별로 직접 계산해 한 번 더 고정하면 더 좋다.
V1: 사실 관계는 독립 사본(7410957)에서 그대로 재현됐다. 다만 심각도는 major가 아니라 minor다.

재현 결과:
(1) FXDUTY 단독(reports.ts:480 `fxFlows[2]!.day = c.acceptedDay;`): 새 파일 25개 중 5개가 실패한다(늦은 편, 열린 계약, 실패 종료, 편 놓침 재예약, 보고 사례). 모두 residual 단언에서 걸린다.
(2) N2(reports.ts:497 `components.residual = 0;`)와 FXDUTY를 함께 넣으면 새 파일 25/25가 통과하고, 전체 `npx vitest run`도 51개 파일, 1389개 통과(todo 1개)로 끝난다.
(3) 실제로 항등식을 확인하는 곳은 보고서가 스스로 계산해 내놓는 `components.residual` 칸뿐이다. fx는 크기를 따로 고정하지 않는다. `손익 읽기`는 0이 아님과 부호만, R0는 0만 본다. expected를 미리보기 값과 견주는 곳은 늦은 편 시험 한 곳이다.
(4) 정시 계약에서 FXDUTY가 안 잡히는 이유를 탐침으로 확인했다. 관세일(7일)의 환율이 1300으로 수락일(1일) 환율과 같아서, 이 계약에서는 변형이 원래 코드와 같은 값을 낸다. 실측: DUTY 7일 1300, RECEIPT 10일 1282, fx −25200.

major로 보지 않는 이유:
- 지시서 4절(TASK-0062 줄 101)이 시험 방식을 `residual = realized − expected − Σ로 계산해 그대로 낸다. 시험이 residual === 0을 단언한다`로 정해 두었다. 지금 시험은 그 요구를 그대로 지킨다.
- 그 위에서 realized는 cashValue로 원장에서 따로 계산하고, late와 cancel은 줄 단위로 정확히 고정한다. 그래서 residual을 정직하게 계산하는 지금 코드에서는 단계 오류 하나(FXDUTY)가 5개 시험에서 잡힌다. 시험이 비어 있지 않다.
- N2 단독은 원래 코드와 결과가 같은 변형이다. 살아남는 것은 두 변형을 겹친 경우뿐이다. 그중 N2는 지시서 줄 101의 명시 문장을 직접 어기는 코드라서 diff 검수에서 바로 보인다.
- 지시서의 필수 변형 21개 중 이 경로로 살아남는 것은 없다(변형 4는 realized 독립 재계산으로 잡힌다. 지시서 기각 ②와 Q3).

따라서 이 지적은 '필수 시험이 비었다'가 아니다. '항등식 확인이 구현이 내놓는 residual 칸을 믿는다'는 견고성 보강 사항이다.
VFIX1: src/engine/m2a5-risk-fx.test.ts에 공통 도우미를 두고 `expect(X.components.residual).toBe(0);` 8곳(305, 314, 324, 339, 429, 468, 568, 579줄. 579줄은 `row`)을 이 호출로 바꾼다.

```ts
function expectIdentity(r: { realized: number; expected: number; components: Record<string, number> }) {
  const sum = Object.entries(r.components).filter(([k]) => k !== 'residual').reduce((n, [, v]) => n + v, 0);
  expect(r.realized - r.expected - sum).toBe(0);
  expect(r.components.residual).toBe(r.realized - r.expected - sum);
}
```

사본에서 검증한 결과: 원래 코드에서는 25/25가 통과하고, N2+FXDUTY에서는 FXDUTY 단독 때와 같은 5개 시험이 실패한다.

fx 크기를 한 번 더 직접 고정하려면 `늦은 편 손익` 시험에서 하는 것이 좋다. 그 시험은 관세일 환율이 수락일 환율과 달라 FXDUTY를 구별할 수 있다. 정시 계약은 관세일 환율이 수락일과 같아 FXDUTY를 구별하지 못하므로 그 용도로는 쓸모가 없다. 고정하는 식은 4절 환산 꼴을 따른다. 같은 환율의 USD 비용(운임, 관세)은 합친 뒤 한 번 usdToKrwMinor로 바꾸고, 판매는 청구 결제일 환율로 따로 바꾼 값에서 0단계 원화값을 뺀다. 같은 시험에 이미 있는 `expected === p.referenceEstimate.pnlKrw` 단언과 함께 두면 expected와 fx가 서로 오류를 상쇄하는 경우도 막힌다.
V2: 발견의 실행 근거는 재현됐다. 다만 심각도가 과장됐고 추론 일부가 틀렸다.

재현 내용(내 클론, 7410957):
- 원본: 새 파일 25/25 통과.
- FXDUTY 단독(reports.ts:480 `fxFlows[2]!.day = c.acceptedDay;`): 5개가 `expected 900 / 7331 to be +0`으로 실패한다(늦은 편, 열린 계약, 실패 종료, 재예약, 보고 사례).
- N2 단독(reports.ts:497 `components.residual = 0;`): 25/25 통과.
- N2와 FXDUTY를 함께 넣어도 25/25 통과.
- `contractRiskReport`를 부르는 시험은 이 파일 하나뿐이다. 그래서 전체 1,389개가 통과한다는 주장도 성립한다.
- 줄 번호(305·314·324·339·429·468·568·579)와 'fx는 부호만(306·309), expected는 323 한 곳'이라는 기술도 맞다.

'major'가 아닌 이유:
(1) 주문서가 이 시험 설계를 그대로 정했다. 4절 101행은 "residual = realized − expected − (…)으로 계산해 그대로 낸다. 시험이 `residual === 0`을 단언한다"이고, 시험표 155행은 realized를 원장에서 따로 다시 계산하라고 한다. Codex 시험은 둘 다 지킨다. cashValue가 독립 재계산이다.
(2) N2는 현재 코드에서 동등 변형이다. 단일 변형 기준으로 살아남는 비동등 변형은 없다. FXDUTY는 단독으로 잡힌다. 살아남는 것은 '497행을 상수로 바꾸고 단계 오류도 함께 넣은' 이중 변형뿐이다. 판정 기준의 'a mutation would survive'에 해당하지 않는다.
(3) 'residual을 0으로 고정하면 expected의 크기 오류를 잡는 장치가 사라진다'는 틀렸다. 단계가 서로 상쇄되는 꼴이다. fx = afterFx − expected, late = afterLate − afterFx, cancel = value(cancelFlows) − afterLate이므로 Σ = value(cancelFlows) − expected가 되고, residual은 realized − value(cancelFlows)다. expected는 식에서 지워진다. 그래서 코드의 residual도, 제안된 시험 쪽 항등식도 expected 오류를 원래 못 잡는다.
   - 확인 1: `const expected = value(baseline) + 1000;`에 N2를 더해도 잡힌다. 다만 잡는 곳은 R0 `fx === 0`과 323행이고, 항등식이 아니다.
   - 확인 2: `const expected = value(baseline, config.operations.fx.baseKrwPerUsd);`는 N2 없이도 25/25 통과한다. 시험 계약이 모두 1주차에 수락돼 환율이 1300(= base)이기 때문이다. 제안 도우미를 넣어도 잡히지 않는다.
(4) 제안된 도우미 `realized − expec
VFIX2: minor 보강 두 가지. 가)가 핵심이고 나)는 선택이다.

가) 실질 보강. src/engine/m2a5-risk-fx.test.ts의 '손익 읽기'(304행 부근, 주선 false)에서 fx를 줄별로 직접 계산해 고정한다.
- 환율:
  - r0 = referenceRate(cfg, seed, c.acceptedDay)
  - rPre = 첫 FREIGHT-PREPAY- 분개일의 환율
  - rDuty = DUTY- 의무 paidDay(없으면 DUTY 분개일)의 환율
  - rDue = invoice.dueDay의 환율
- 같은 환율의 USD 비용(운임·관세)은 합친 뒤 한 번 usdToKrwMinor로 바꾼다. 판매는 따로 바꾼다.
- 단언: `expect(report.components.fx).toBe([usdToKrwMinor(p.sale, rDue) − costKrw(rPre, rDuty)] − [usdToKrwMinor(p.sale, r0) − costKrw(r0, r0)])`
- 첫 공개 주 뒤(laterDay 이후)에 수락한 계약 하나를 더한다. 이 계약에서 `report.expected === preview(cfg, …, c.acceptedDay, …).referenceEstimate.pnlKrw`이고 referenceRate(acceptedDay) ≠ baseKrwPerUsd라는 전제를 먼저 단언한다. 그러면 FXDUTY류 오류가 residual과 상관없이 잡힌다. `expected = value(baseline, baseKrwPerUsd)` 변형도 잡힌다.

나) 선택. 497행만 지키려면 공통 도우미를 579행 보고 사례 반복에 넣는다.
```
function identity(r) {
  const sum = Object.entries(r.components)
    .filter(([k]) => k !== 'residual')
    .reduce((n, [, v]) => n + v, 0);
  expect(r.realized - r.expected - sum).toBe(0);
  expect(r.components.residual).toBe(r.realized - r.expected - sum);
}
```
이 도우미는 N2+FXDUTY를 잡는 것으로 확인했다. 단, expected 오류는 상쇄돼 지워지므로 이것만으로는 expected의 크기를 고정하지 못한다고 결과 보고에 적는다.

-- tests#6 minor / not-verified
@ src/engine/m2a5-risk-fx.test.ts:116-121 (환산 도우미), :281 (관세 과세가격 ①)
P: usdToKrwMinor·krwToUsdMinor의 상수 단언(2600000/1300, −50×1300)은 나머지가 딱 떨어지는 값이다. 그래서 두 도우미의 반올림 방향(H14-2: 0.5는 0에서 먼 쪽)이 고정되지 않는다. 다른 시험은 모두 같은 도우미로 기대값을 계산하므로 이 차이를 잡지 못한다. 같은 이유로 지시서 변형표가 변형 19를 잡는다고 적은 '관세 과세가격 ①'도 실제로는 잡지 못한다. ①의 기대값이 krwToUsdMinor를 그대로 부르기 때문이다. 19를 막는 것은 상수 시험 하나뿐이다.
E: N11(`usdToKrwMinor = Math.round(cents*rate/100)`)과 N12(`krwToUsdMinor = Math.round(krw*100/rate)`)가 둘 다 새 파일과 전체 1,389개를 통과했다. 변형 19를 적용하면 실패는 '환산 도우미' 1개뿐이었다. 기대값은 `expected 2000 to be 200000`.
FIX: 0.5 나머지가 생기는 상수를 더한다: `usdToKrwMinor(-1, 50) === -1`, `usdToKrwMinor(1, 50) === 1`, `krwToUsdMinor(-13, 2600) === -1`. 관세 과세가격 ①의 기대값은 도우미 없이 정수식으로 따로 계산한다. 예: `Math.floor((2*krw*100 + r) / (2*r))`.

-- tests#7 minor / not-verified
@ tools/test_validate_data.py:1156-1162, tools/validate_data.py:921-927
P: `test_risk_all_profiles_and_inherited_rule`는 이름과 달리 base_scenario_id 상속을 시험하지 않는다. 둘째 프로필의 by_counterparty를 비울 뿐이다. 지금 자료의 SCENARIO_M2_OPERATIONS는 rules_version과 market_rules_ref를 직접 적고 있어서 현재 자료로도 상속 경로가 돌지 않는다.
E: validate_data.py:923의 `resolve_scenario(tables['scenarios'], sid)`를 `tables['scenarios'][sid]`로 바꾼 변형에서 `python3 tools/test_validate_data.py MarketRulesTest`가 17개 OK였다. 자료 확인: `SCENARIO_M2_OPERATIONS base= SCENARIO_M2_MULTI_TRADE rv= M2a-rules-2 ref= market_rules.json#M2A5_PYEONGTAEK`.
FIX: 사본 하나를 만든다. 부모 시나리오는 operations·engine_rules를 갖고, 자식은 base_scenario_id만 둔다. 그 상속 rule_set에만 있는 판매 거래처를 by_counterparty에서 빼고, '운영 판매 거래처 누락' 문장이 나오는지 단언한다.

-- tests#8 minor / not-verified
@ src/engine/m2a5-risk-fx.test.ts:152-159 (환율 상태 무관·결정성)
P: '환율 상태 무관'을 확인하는 상태(laterDay, 계약·의무 없음)에서는 cashReservations의 rules-3 관세 경로(dutyFor)와 paymentDefaultStatus의 회복 계산이 돌지 않는다. 그래서 이 두 읽기 함수의 상태 무관은 실제로 확인되지 않는다. '결정성'도 같은 상태에서 환전 명령 하나를 두 번 적용해 toEqual로 견줄 뿐이다. 지시서의 '같은 시드·같은 명령 두 번 → 같은 상태 JSON'보다 약하다.
E: 152행: `const s = advance(fresh(cfg), cfg, laterDay)`. 계약이 없어 156행 `cashReservations(s, cfg)`가 dutyFor를 부르지 않는다. 159행: `expect(exchange(s, cfg)).toEqual(one)`.
FIX: 진행 중인 혼합 계약과 미지급 의무가 있는 R1 도중 상태에서 같은 읽기들을 부르고 JSON이 같은지 본다. 결정성은 같은 구동기(예: finished(cfg) 또는 실패 사례)를 두 번 돌려 `serializeSave` 문자열이 같은지 단언한다.

-- tests#9 minor / not-verified
@ src/engine/m2a5-risk-fx.test.ts:290, 326-341, 455, 484-485
P: 전제와 독립성이 조금씩 비는 곳이 있다.
① 관세 과세가격 ①은 지시서가 말한 도착 분개(`DUTY-…`) 금액이 아니라 `shipments[0].dutyMinor`를 본다.
② 취소 R1은 통화별 금액을 확인해야 하는데, FREIGHT-RELEASE 분개가 USD인지와 원화 환급 줄이 없는지를 단언하지 않는다. 지금은 PURCHASE- 접두어의 양수 CASH만 막는다.
③ 실패 기록 두 시험은 기대 관세를 시험 대상 경로와 같은 dutyFor로 계산한다. rules-2 행은 지시서대로 dutyEstimate와 같은지 따로 확인할 수 있다.
E: 290행 `expect(s.shipments[0]!.dutyMinor).toBe(expected)`. 340행은 `e.id.startsWith('PURCHASE-') && ... l.amount > 0`만 본다. 484행 `dutyFor(cfg, s.rng.seed, ..., 'USD', d)`.
FIX: ① 도착 분개 `DUTY-${shipment.id}`의 금액을 단언한다. ② release.currency === 'USD'와, KRW 분개 가운데 이 계약의 CASH 양수 줄이 없음을 단언한다. ③ rules-2 행은 기대값을 `dutyEstimate(cfg, c.purchaseAmountMinor)`로 계산한다.

===== data
자료·스키마·검사기 렌즈 검수(TASK-0062, 7410957 vs 4b3d6a8). 독립 클론에서 실행했고 작업 뒤 클론은 지웠다. 원 작업 트리는 읽기만 했으며 status는 깨끗하다.

[문제 없음으로 확인한 것]
(1) data/market_rules.json의 risk_profiles[0]을 DESIGN.md 6절의 json 블록과 python으로 대조했다. `rp[0] == frozen`이 True였고, 모든 중첩 객체의 키 순서도 같았다. 값의 타입(int)과 basis·status 표지, 프로필 개수 1도 같다. 판정표 5.2의 허용 범위와 고정값도 모두 맞는다.
(2) 스키마는 0~10000 범위를 지시서 1절이 고른 확률·비율 칸에만 건다. tariff.step_bp는 부호 있는 −10000~10000 짝이고, 날 수와 max_changes는 0 이상, fx는 1 이상이다. additionalProperties:false이고 risk_profiles는 필수다.
(3) validate_data.py에는 지시서가 요구한 검사가 모두 있다: 확률 합, 가중치 합, min≤max, 품목·거래처 존재, start==fx_krw_per_usd, fx 범위(min≤start≤max), 정의된 등급, 그리고 운영 rule_set(상속 해석 포함)에 대한 반대 방향 셋이다. 모든 프로필에 건다.
(4) 새 반례 13종은 모두 assertIn으로 그 검사의 문장을 `risk_profiles: {id}: …` 꼴로 단언하고, check_market_rules만 부른다.
(5) test_goods_counts는 count==3 가지에서 고정 자료만 더했다(삭제 줄 0). 그 줄을 되돌리면 운영 품목 누락과 판매국·품목 누락 3건으로 실패하므로 필요한 보강이다.
(6) scenario.ts는 import type 한 줄과 함수 둘을 덧붙였을 뿐이다. 기존 로더(264줄 rules-2 분기 포함)는 그대로다. loadRiskProfile은 다섯 묶음의 모든 칸을 빠짐없이 옮긴다.
(7) 실행 결과: validate_data.py는 PASS(31,627 checks), test_validate_data.py는 126개 OK, m2a5-risk-fx 25개 통과. MANIFEST 해시는 전부 일치한다.

[문제]
자료 자체에는 결함이 없다. 다만 검사기와 로더를 지키는 시험이 약하다. 반례·변형 시험이 잡지 못하는 변형이 많다(검사기 변형 21종 중 20종, 로더 변형 8종 전부 생존). 그중 둘은 지시서가 명시한 요구사항(상속 포함, 다섯 묶음 변환)을 지키는 시험이 비었거나 자기 참조라 major로 보았다.

참고(결함 아님): 새 스키마가 쓰는 maxItems(522·532행)는 stdlib shape()가 지원하지 않는 유일한 키워드다. 길이 2는 pair()가 이미 강제하므로 지금 생기는 구멍은 없다.

재현 스크립트:
- <사본>
- <사본>
- <사본>
- <사본>

인수는 클론 경로다. MANIFEST 해시 실패를 피하려고 MarketRulesTest만 돌린다.

-- data#1 major / confirmed→major/confirmed→major
@ tools/test_validate_data.py:1156 (test_risk_all_profiles_and_inherited_rule), tools/validate_data.py:921-924
P: 지시서 1절과 설계 6절이 요구한 '`base_scenario_id` 상속 포함' 운영 rule_set 선택을 시험하는 반례가 없다. 시험 이름은 'inherited_rule'이고 결과 보고도 '상속된 운영 rule_set의 역방향 포함 검사'라고 적었지만, 시험 몸통은 두 번째 프로필을 붙여 '모든 프로필'만 본다. 지금 자료의 유일한 rules-2 시나리오 SCENARIO_M2_OPERATIONS는 engine_rules·operations를 직접 가지므로 resolve_scenario는 no-op이다. 'M2a-rules-3' 판본 분기도 시험되지 않는다. TASK-0065의 (나)·(다) 변형은 SCENARIO_M2_OPERATIONS를 상속하고 operations만 덮을 가능성이 크다. 그때 상속 해석이 깨져도 어떤 시험도 실패하지 않는다.
E: 독립 클론 변형 시험(MarketRulesTest만 실행).
- 변형 A: `scenario = resolve_scenario(tables['scenarios'], sid)`를 `scenario = tables['scenarios'][sid]`로 바꿈 → SURVIVED (OK).
- 변형 U: `('M2a-rules-2', 'M2a-rules-3')`를 `('M2a-rules-2',)`로 바꿈 → SURVIVED.
임시 반례: rule_set 사본 VARIANT_X(COSMETICS 상해 판매처를 SHIPPER_DEMO_FURNITURE로 바꿈)를 만들고, engine_rules 없이 operations.market_rules_ref만 '#VARIANT_X'로 덮은 자식 시나리오 {base_scenario_id: SCENARIO_M2_OPERATIONS}를 넣었다.
- 원래 코드: ['risk_profiles: RISK_PROFILE_DEFAULT: collections: 운영 판매 거래처 누락']
- 변형 A: []
즉 검사는 맞게 구현됐지만 이를 지키는 시험이 없다.
FIX: MarketRulesTest에 상속 반례 둘을 더한다.
(a) rule_set 사본(새 id)에서 판매 거래처 하나를 by_counterparty에 없는 시장 거래처로 바꾼다. 그다음 engine_rules 없이 operations만 덮은 자식 시나리오(base_scenario_id = 시나리오 표에서 rules-2인 시나리오를 찾아 씀)를 tables['scenarios']에 넣고 '운영 판매 거래처 누락' 문장을 assertIn한다.
(b) 같은 구성에서 자식이 engine_rules.rules_version='M2a-rules-3'만 가진 경우도 단언한다.
시험 이름은 실제 내용에 맞게 나누거나 고친다.
V1: 주장은 적힌 그대로 성립한다. 반박하려고 독립 클론(7410957)에서 다시 재 보았으나 반박하지 못했다. 그 클론은 지금 지웠다.

1) 시험 몸통이 상속을 보지 않는다. tools/test_validate_data.py:1156 `test_risk_all_profiles_and_inherited_rule`은 프로필 사본에 '_SECOND'를 붙이고 `by_counterparty=[]`로 비운 뒤 '운영 판매 거래처 누락' 하나만 단언한다. `base_scenario_id`나 시나리오 표는 건드리지 않는다. 자료에서 rules-2 시나리오는 SCENARIO_M2_OPERATIONS 하나다. 이 시나리오는 SCENARIO_M2_MULTI_TRADE를 상속하지만 `engine_rules`(M2a-rules-2)와 `operations.market_rules_ref`(#M2A5_PYEONGTAEK)를 직접 가진다. 그래서 validate_data.py:923의 `resolve_scenario`는 이 검사에서 결과를 바꾸지 않는다.

2) 변형이 살아남는다. 전체 126개로 재면 4개가 실패한다. 그러나 그 원인은 'hash mismatch tools/validate_data.py'(ConservationTest 2, DataDrivenMainTest 2)뿐이다. 파일을 고치기만 해도 나는 실패이므로 잡은 것이 아니다. 그래서 `build_package.py --manifest-only`로 MANIFEST를 다시 만든 뒤 쟀다.
- 변형 A(:923 `resolve_scenario(...)` → `tables['scenarios'][sid]`): 126개 OK. `validate_data.py`도 종료 0이다.
- 변형 U(:924 `('M2a-rules-2', 'M2a-rules-3')` → `('M2a-rules-2',)`): 126개 OK. `validate_data.py`도 종료 0이다.

3) 반례는 검사가 맞게 구현됐음을 보여 준다. rule_set 사본 VARIANT_X를 만들고 APPAREL의 첫 판매 거래처를 SHIPPER_DEMO_FURNITURE로 바꿨다. 그다음 자식 `{base_scenario_id: SCENARIO_M2_OPERATIONS, operations: {..., market_rules_ref: '#VARIANT_X'}}`를 넣었다(`engine_rules` 없음).
- 원래 코드: `['risk_profiles: RISK_PROFILE_DEFAULT: collections: 운영 판매 거래처 누락']`
- 변형 A: `[]`
엔진 로더 `resolveScenarioRecord`(src/content/scenario.ts:135-139)도 같은 얕은 덮기를 쓴다. 따라서 검사기의 상속 해석은 엔진과 같다. 빠진 것은 검사가 아니라 이를 지키는 시험이다.

4) 이 상속 범위는 지시서 1절(:29)의 반대 방향 반례 정의, 설계 6절(:358), 허브 결정 H15 F7이 명시해 넣은 것이다. 저장소에는 상속 시
VFIX1: tools/test_validate_data.py의 MarketRulesTest를 고친다.

(가) `test_risk_all_profiles_and_inherited_rule`의 이름을 실제 내용에 맞게 `test_risk_all_profiles`로 바꾼다.

(나) 새 시험 `test_risk_inherited_operating_rule`을 더한다.
- `d, t = self.fixtures()`로 자료를 읽는다.
- `base`는 `validator.resolve_scenario`로 풀었을 때 rules_version이 'M2a-rules-2'인 시나리오 ID로 고른다.
- `src = d['market_rules']['rule_sets']`에서 `t['scenarios'][base]`의 `market_rules_ref` # 뒤 id와 같은 rule_set을 고른다. `new = copy.deepcopy(src)`로 사본을 만들고 `new['id'] = 'VARIANT_INHERIT'`로 바꾼다.
- `new['trade']['goods'][0]['sell_counterparties'][0]['counterparty_id']`를 거래처 이름 목록에는 있고 프로필 `by_counterparty`에는 없는 ID(예: 'SHIPPER_DEMO_FURNITURE')로 바꾼 뒤 `rule_sets`에 append한다.
- `t['scenarios']['CHILD'] = {'id': 'CHILD', 'base_scenario_id': base, 'operations': dict(t['scenarios'][base]['operations'], market_rules_ref='market_rules.json#VARIANT_INHERIT')}`를 넣는다. `engine_rules`는 넣지 않는다.
- `self.assertIn(f"risk_profiles: {p['id']}: collections: 운영 판매 거래처 누락", self.errors(d, t))`로 단언한다. 이 시험이 변형 A를 잡는다.

(다) 같은 구성에 `subTest`로 rules-3 경우를 하나 더 둔다. 자식에 `'engine_rules': {'rules_version': 'M2a-rules-3'}`를 더하고 같은 문장을 assertIn한다. 이 경우가 변형 U를 잡는다. 이때 기존 검사 :910-913이 'CHILD: operations는 M2a-rules-2 필요'도 함께 내므로 assertEqual을 쓰지 말고 assertIn만 쓴다. 이 점과, TASK-0065가 그 검사를 rules-3에 맞게 고칠 때 이 시험도 다시 볼 것을 주석에 적는다.

(라) 결과 보고(docs/ai/tasks/results/TASK-0062.md)의 시험 행을 위 두 시험에 맞게 고치고, 변형 A·U와 이를 잡은 시험을 변형 표 밖의 추가 행으로 적는다. validate_data.py 자체는 고칠 필요가 없다.
V2: 독립 클론(7410957)에서 재현했고 주장은 그대로 성립한다.

1) 시험 몸통 (tools/test_validate_data.py:1156-1162). 프로필 0을 복사해 id에 '_SECOND'를 붙이고 by_counterparty를 비운 뒤 append하는 것이 전부다. 시나리오 표는 건드리지 않는다. 그래서 이 시험이 보는 것은 '모든 프로필'뿐이고, 이름에 들어 있는 'inherited_rule'은 시험되지 않는다.

2) 현재 자료에서는 상속이 no-op이다. scenarios.json의 SCENARIO_M2_OPERATIONS는 base_scenario_id=SCENARIO_M2_MULTI_TRADE를 갖는다. 하지만 engine_rules(M2a-rules-2)와 operations.market_rules_ref(market_rules.json#M2A5_PYEONGTAEK)를 자기 레코드에 직접 둔다. 따라서 validate_data.py:921-927에서 resolve_scenario를 쓰든 tables['scenarios'][sid]를 쓰든 active_rules는 같다.

3) 변형 생존 여부.
- 변형 A(validate_data.py:923의 resolve_scenario를 tables['scenarios'][sid]로 바꿈): MarketRulesTest 17개가 OK다.
- 변형 U(924의 ('M2a-rules-2','M2a-rules-3')를 ('M2a-rules-2',)로 바꿈): 역시 OK다.
- test_validate_data 전체를 돌리면 두 변형 모두 4건이 실패한다. 하지만 넷 모두 'hash mismatch tools/validate_data.py'(ConservationTest 2, DataDrivenMainTest.test_verified_hs·test_vocational)다. 이 파일을 어떻게 고쳐도 나는 실패라서 의미상 잡은 것이 아니다. 원래 코드에서는 126개가 모두 OK다.

4) 임시 반례로 확인한 결과. rule_set 사본 VARIANT_X를 만들고 APPAREL 하이퐁 판매처를 SHIPPER_DEMO_FURNITURE로 바꿨다. 여기에 자식 {base_scenario_id: SCENARIO_M2_OPERATIONS, operations.market_rules_ref: '#VARIANT_X'}를 붙였다.
- 원래 코드: ['risk_profiles: RISK_PROFILE_DEFAULT: collections: 운영 판매 거래처 누락']
- 변형 A: [] (놓침)
- 자식이 engine_rules.rules_version='M2a-rules-3'도 가진 경우, 원래 코드: ['SCENARIO_CHILD_X: operations는 M2a-rules-2 필요', '…운영 판매 거래처 누락']
- 같은 경우 변형 U: '…운영 판매 거래처 누락'이 사라진다.

5) 요구 근거.
- 지시서 1절 29행은 반례 목록의 '반대 방향 셋'에서 운영 rule_set을 '`base_sce
VFIX2: tools/test_validate_data.py MarketRulesTest를 다음처럼 고친다.

(1) 기존 test_risk_all_profiles_and_inherited_rule(1156행)의 이름을 test_risk_all_profiles로 바꾼다. 몸통은 그대로 둔다.

(2) 새 시험 test_risk_inherited_operations_rule을 더한다. 시나리오와 rule_set ID는 박아 넣지 않고 자료에서 찾는다.
```python
def test_risk_inherited_operations_rule(self):
    for version in (None, 'M2a-rules-3'):
        with self.subTest(version=version):
            d, t = self.fixtures()
            base_id = next(sid for sid, s in t['scenarios'].items()
                           if 'operations' in s and validator.resolve_scenario(t['scenarios'], sid)
                           .get('engine_rules', {}).get('rules_version') == 'M2a-rules-2')
            file, rid = t['scenarios'][base_id]['operations']['market_rules_ref'].split('#', 1)
            rule = copy.deepcopy(next(r for r in d['market_rules']['rule_sets'] if r['id'] == rid))
            rule['id'] = rid + '_CHILD'
            d['market_rules']['rule_sets'].append(rule)
            child = {'id': 'SCENARIO_CHILD', 'base_scenario_id': base_id,
                     'operations': {'market_rules_ref': f"{file}#{rule['id']}"}}  # engine_rules 없음 → 상속
            if version:
                child['engine_rules'] = {'rules_version': version}
            t['scenarios']['SCENARIO_CHILD'] = child
            if version is None:
                self.assertEqual(self.errors(d, t), [])  # 대조: 바꾸기 전에는 통과
            covered = {r['counterparty_id'] for p in d['market_rules']['risk_profiles']
                       for r in p['collections']['by_counterparty']}
            party = next(c for c in ('SHIPPER_DEMO_FURNITURE',) if c not in covered)  # 시장 자료에 있으나 by_counterparty에 없는 거래처
            rule['trade']['goods'][0]['sell_counterparties'][0]['counterparty_id'] = party
            pid = d['market_rules']['risk_profiles'][0]['id']
            self.assertIn(f'risk_profiles: {pid}: collections: 운영 판매 거래처 누락', self.errors(d, t))
```
대조 단언(None 경우의 assertEqual)이 있어야 오류가 '바꾼 판매처'에서 나왔음이 보장된다.

rules-3 subTest는 912행 때문에 'operations는 M2a-rules-2 필요'가 함께 나온다. 그래서 assertIn만 쓴다. TASK-0065가 912행을 rules-3까지 허용하도록 고치면 이 subTest에도 대조 단언을 더한다.

(3) 결과 보고의 변형 표에 두 변형을 '잡힘'으로 더한다. 변형 A는 validate_data.py:923의 resolve_scenario 제거, 변형 U는 924의 'M2a-rules-3' 제거다. 전체 파일을 돌렸을 때 나는 hash mismatch 실패는 잡힘으로 세지 않는다고 적는다.

-- data#2 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-fx.test.ts:24,106; src/content/scenario.ts:541-561
P: loadRiskProfile의 snake→camel 변환을 자료와 견주는 시험이 없다. 유일한 단언 `expect(loadRiskProfile(profile.id)).toEqual(profile)`은 자기 참조다: profile = riskProfiles()[0]이고 riskProfiles는 loadRiskProfile을 map한 것이다. Object.keys 검사도 묶음 이름만 본다. 다른 시험은 기대값을 모두 같은 profile 객체에서 계산하므로, 로더가 값을 잘못 옮겨도 서로 맞아떨어진다. 그래서 측정 손잡이인 fx.step_bp(판정표 5.2)나 start·min·max를 잘못 옮겨도 25개 시험이 모두 통과한다. 검사기는 원자료만 보므로 이 경로를 막지 못한다. 0063·0064가 쓸 tariff·claims·collections 변환(H15 O14 '다섯 묶음 모두 변환')도 보호되지 않는다.
E: 독립 클론에서 scenario.ts를 변형하고 `npx vitest run src/engine/m2a5-risk-fx.test.ts`를 돌렸다. 8종 모두 SURVIVED (Tests 25 passed):
- `stepBp: p.fx.step_bp * 2`
- `stepBp: Math.floor(p.fx.step_bp / 2)`
- min −100 / max +100
- `startKrwPerUsd: p.fx.start_krw_per_usd + 10`
- pLateBp↔pPartialBp 교환
- claims minor↔major 교환
- lagDays↔stepBp 교환
- surcharge min↔max 교환
grep 결과 loadRiskProfile과 riskProfiles를 쓰는 시험 파일은 m2a5-risk-fx.test.ts 하나뿐이다.
FIX: m2a5-risk-fx.test.ts에 변환 대조 시험을 더한다. data/market_rules.json을 import해 risk_profiles[i]의 키를 재귀적으로 camelCase로 바꾼 객체가 riskProfiles()[i]와 toEqual인지 본다(자료 상수를 시험에 적지 않는 방식). 그리고 `profile.fx.startKrwPerUsd === loadScenario(운영 ID).operations.fx.baseKrwPerUsd`를 단언해 R0/R1 기준 일치(H6-4)를 엔진 쪽에서도 지킨다.
V1: 반박하려 했으나 주장이 그대로 성립한다. 심각도 major를 유지한다.

[1] 유일한 단언은 자기 참조다
- src/engine/m2a5-risk-fx.test.ts:24 `const profile = riskProfiles()[0]!`
- 106행 `expect(loadRiskProfile(profile.id)).toEqual(profile)`
- scenario.ts:560-561의 riskProfiles는 `marketRules.risk_profiles.map((p) => loadRiskProfile(p.id))`다. 그래서 106행은 같은 함수의 출력을 자기 자신과 비교한다.
- 108행 `Object.keys(profile)` + `arrayContaining`은 묶음 이름 다섯 개만 본다.
- 지시서 124행('시험에 자료 ID·조정 상수를 쓰지 않는다. 값이 필요하면 프로필에서 읽는다') 때문에 나머지 시험은 기대값을 모두 같은 profile 객체에서 계산한다. 로더가 값을 잘못 옮겨도 기대값이 함께 틀어져 서로 맞아떨어진다.

[2] 다른 곳에서도 막히지 않는다
- git grep 결과 loadRiskProfile·riskProfiles를 쓰는 시험 파일은 m2a5-risk-fx.test.ts 하나다.
- tools/validate_data.py:928-990은 원자료(JSON)만 본다. 범위, start_krw_per_usd == fx_krw_per_usd, 양방향 누락을 검사하지만 TS 로더 출력은 보지 않는다.

[3] 독립 클론(7410957)에서 직접 재현했다
- scenario.ts에 변형 8종을 하나씩 넣었다: stepBp ×2, stepBp ÷2, fx min −100·max +100, start +10, pLate↔pPartial 교환, claims minor↔major 교환, tariff lagDays↔stepBp 교환, surcharge min↔max 교환.
- 결과는 모두 `Tests 25 passed (25)`였다.
- stepBp×2와 start+10을 함께 넣고 전체 묶음을 돌려도 `Test Files 51 passed, Tests 1389 passed | 1 todo`였다.
- `tsc --noEmit`도 통과했다. 모든 변형이 타입을 지키므로 타입 검사로도 막히지 않는다.
- 변형하지 않은 원래 로더는 올바르다. snake→camel 재귀 변환 결과와 toStrictEqual이 일치한다. 지금 틀린 값이 있다는 뜻이 아니다. 지켜 주는 시험이 없다는 결함이다.

[4] major로 보는 근거
- fx.step_bp는 판정표 5.2의 측정 손잡이다(시작 250, 범위 150~275). 로더가 이 값을 잘못 옮기면 경로 5 측정값이 달라지는데 어떤 시험에도 걸리지 않는다.
- TASK-0063·0064의 '고칠 수 있는 파일'에 src/content/scenario.ts가 없다. 따라서 0062 로더가 tariff·surcharge·claims·collections의 최종 변환기다(H15 O14
VFIX1: src/engine/m2a5-risk-fx.test.ts의 첫 시험(105행 '프로필 다섯 묶음…')에 아래 두 가지를 더한다. 자료 ID나 조정 상수를 시험에 적지 않으므로 지시서 124행 규칙에 맞는다. 0063·0064는 scenario.ts를 고칠 수 없으므로 0062에서 넣어야 한다.

```ts
import marketRules from '../../data/market_rules.json';
const camel = (v: unknown): unknown => Array.isArray(v) ? v.map(camel)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) =>
      [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), camel(x)])) : v;
// 시험 안:
expect(riskProfiles()).toStrictEqual(camel(marketRules.risk_profiles));
for (const p of riskProfiles()) expect(p.fx.startKrwPerUsd).toBe(base.operations!.fx.baseKrwPerUsd); // H6-4 엔진 쪽
```

독립 클론에서 확인한 결과:
- 원래 코드에서는 통과한다(toStrictEqual 일치, tsc 통과).
- 위 변형 8종은 모두 이 시험에 걸려 실패한다.

자기 참조인 106행 `expect(loadRiskProfile(profile.id)).toEqual(profile)`은 위 대조 단언으로 바꾸거나 함께 둔다. 결과 보고의 변형 표에는 '로더 칸 교환·배율'을 이 시험이 잡는다고 한 줄 더한다.
V2: 반박하려 했지만 지적은 그대로 맞다.

1) 자기 참조 확인
- m2a5-risk-fx.test.ts:24는 `const profile = riskProfiles()[0]!`이다. scenario.ts:560-561의 riskProfiles는 `marketRules.risk_profiles.map((p) => loadRiskProfile(p.id))`다.
- 그래서 :106의 `expect(loadRiskProfile(profile.id)).toEqual(profile)`은 같은 함수의 출력을 자기 자신과 견준다. 로더가 값을 틀리게 옮겨도 양쪽이 똑같이 틀린다.
- :108의 `Object.keys` 단언은 `arrayContaining`으로 다섯 묶음의 이름만 본다.
- 나머지 시험은 기대값을 모두 같은 `profile` 객체에서 계산한다(:125-130의 `fx.stepBp`·min·max, :197의 `startKrwPerUsd`, :442의 `profile.fx.stepBp`). 지시서 '시험'절이 "자료 상수를 쓰지 않고 프로필에서 읽는다"고 정했으므로, 로더 오류는 구조적으로 보이지 않는다.

2) 사용처
- `grep -rn "loadRiskProfile|riskProfiles|risk_profiles"` 결과, 로더를 부르는 곳은 src/engine/m2a5-risk-fx.test.ts 하나뿐이다.
- tools/validate_data.py:928 이하와 tools/test_validate_data.py는 원자료 JSON만 본다. 로더의 변환 경로를 막지 못한다.

3) 독립 클론 재현(7410957, 시험 파일 단독)
지적에 적힌 8종이 모두 살아남았다(SURVIVED, Tests 25 passed):
- stepBp ×2, stepBp ÷2
- min −100 / max +100
- start +10
- pLateBp↔pPartialBp 교환
- claims minor↔major 교환
- lagDays↔stepBp 교환
- surcharge min↔max 교환

추가로 확인한 것:
- start −100도 살아남았다.
- 잡힌 것은 fx min↔max 교환(경계 단언에 걸림)과 stepBp=0뿐이었다.

4) 전체 묶음 재현
- step×2, start+10, claims 교환을 함께 넣고 `npx vitest run`(전체)을 돌렸다. 결과는 Test Files 51 passed, Tests 1389 passed | 1 todo였다.
- `npm run typecheck`도 rc 0이었다.
- 허브의 review_checks(타입 검사·vitest·골든)로는 잡히지 않는다. rules-1·rules-2 골든은 프로필을 쓰지 않는다.

5) 등급: major
- 'R0·R1 설정 변환'이라는 이름의 시험이 자기 참조라 사실상 빈 시험이다.
- 변형된 fx.step_bp(판정표 5.2의 측정 손잡이), start, min, max는 R1 실행 경로에 그대로 들어간다. 그런데도 1,389개 시험이 모두 통과한다. 측정과
VFIX2: src/engine/m2a5-risk-fx.test.ts 첫 시험('프로필 다섯 묶음과 R0·R1 설정 변환·정적 견적')의 :106 자기 참조 단언을 실제 자료 대조로 바꾸거나 그 옆에 더한다. 자료 상수는 시험에 적지 않는다.

```ts
import marketRules from '../../data/market_rules.json';
...
const camel = (v: unknown): unknown => Array.isArray(v) ? v.map(camel) : v && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), camel(x)])) : v;
expect(riskProfiles()).toEqual(marketRules.risk_profiles.map(camel));
for (const id of OPERATIONS_SCENARIO_IDS) expect(profile.fx.startKrwPerUsd).toBe(loadScenario(id).operations!.fx.baseKrwPerUsd);
```

- 첫 단언은 다섯 묶음의 snake→camel 변환 전체를 원자료와 견준다. 필드를 빠뜨리거나, 더하거나, 서로 바꾸면 모두 깨진다.
- 둘째 단언은 R0과 R1의 기준 환율이 같다는 조건(H6-4)을 엔진 쪽에서도 고정한다.

결과 보고서(docs/ai/tasks/results/TASK-0062.md)의 변형 표에 '로더 변환 변형'(stepBp ×2, minor↔major 교환 등)을 한 줄 더해 잡힘을 기록하면, 0063·0064가 이 시험을 기반으로 이어 쓸 수 있다.

-- data#3 minor / not-verified
@ tools/test_validate_data.py:1148-1150 (missing_party / missing_good / missing_tariff)
P: 반대 방향 반례 셋이 표 전체를 비운다(`= []`). 그래서 '모든 원소를 본다'와 '첫 원소만 또는 하나라도 본다'를 구별하지 못한다. 반대 방향 검사의 목적은 TASK-0065가 품목·거래처·(나라,품목) 행을 더할 때 한 행이 빠진 것을 잡는 것이다(H14-10). 그런데 부분 반복 변형이 살아남는다.
E: MarketRulesTest 변형 결과, 모두 SURVIVED:
- B: `rule['trade']['goods'][:1]`
- C: `good['sell_counterparties'][:1]`
- D: `rule['trade']['sell_city_ids'][:1]`
- W: 판매국 대신 any(('CN','VN'))
같은 하네스의 양성 대조(가중치 합 검사 삭제, fx 일치 검사 삭제, 판매국·품목 검사 삭제)는 KILLED였다. 하네스는 정상이다.
FIX: 각 반례를 '한 행만 빼기'로 바꾸거나 그런 경우를 더한다. 운영 rule_set에서 계산해 첫 원소가 아닌 것을 빼면 된다: 마지막 판매 거래처의 by_counterparty 행, 마지막 품목의 by_good 행, 두 번째 판매 도시 나라 × 마지막 품목의 tariff.base 행. 각각 해당 문장을 assertIn한다.

-- data#4 minor / not-verified
@ tools/validate_data.py:931,945,947,974 및 pair 호출(lag_days, tariff min/max, claims tier)
P: 새로 넣은 검사 가운데 스키마가 대신 잡지 못하는 순서·참조 검사 여러 개에 반례가 없어, 지워도 시험이 통과한다. 해당 검사: fx 시작 환율 범위(min≤start≤max, 지시서 1절 '검사 범위'에 명시), fx min≤max, 정의되지 않은 등급, 프로필 ID 중복, lag_days·tariff min/max·claims 층별 min≤max 순서. 'range' 반례(surcharge)가 pair 도우미 자체는 지키지만, 개별 호출을 지우면 잡히지 않는다.
E: MarketRulesTest 변형 결과, 모두 SURVIVED:
- E: fx 시작 범위 check(True)
- F: fx pair 삭제
- G: 등급 정의 검사 삭제
- I: 프로필 ID 중복 검사 삭제
- K: lag_days pair 삭제
- M: tariff min/max pair 삭제
- N: claims tier pair 삭제
임시 확인: fx.min_krw_per_usd=1350이면 원래 코드는 '…fx: 시작 환율 범위 오류'를 낸다. 즉 검사는 동작하지만 시험이 없다.
FIX: test_risk_counterexamples의 cases에 다음을 더한다. 각각 그 문장을 assertIn한다.
- fx.min_krw_per_usd = start+1 → 'fx: 시작 환율 범위 오류'
- fx.min > fx.max
- by_counterparty[0].grade = 'Z' → 'collections: 정의되지 않은 등급'
- 같은 id의 프로필 두 개 → 'risk_profiles: 프로필 ID 중복'
- lag_days = [3, 0]
- tariff.min_bp > max_bp
- claims.major.min_bp > max_bp

-- data#5 minor / not-verified
@ tools/validate_data.py:961-976 (tariff.base / claims.by_good / collections.by_counterparty / collections.grades), schemas/market_rules.schema.json risk_profiles
P: 표 안의 키 중복을 막는 검사가 스키마에도 검사기에도 없다. 같은 (country_code, good_id), good_id, counterparty_id, grade가 서로 다른 값으로 두 번 나와도 통과한다. 0063·0064의 조회는 첫 행만 쓰거나 조용히 한쪽을 고르게 되어, H14-10의 '조용히 대체하지 않는다' 원칙과 어긋난다. TASK-0065가 김 행과 새 거래처 넷을 더할 때 복사 실수가 그대로 들어갈 수 있다.
E: 임시 실행에서 원자료 프로필에 네 행을 더했다:
- tariff.base[0]의 복제(rate_bp 3000)
- by_counterparty {CUSTOMER_DEMO, C}
- by_good {COSMETICS, LOW, 300}
- grades {A, 5000/4000/1000}
check_market_rules와 shape(스키마)를 모두 돌린 결과는 `errors: []`였다.
FIX: check_market_rules의 프로필 고리에 고유성 검사를 더하고 반례를 하나씩 둔다:
- tariff.base의 (country_code, good_id)
- claims.by_good의 good_id
- collections.by_counterparty의 counterparty_id
- collections.grades의 grade
모두 len(list) == len(set)으로 본다.

===== numbers
관점: contractRiskReport 출력의 수치 검산. 별도 복제본(7410957)에서 시험 파일의 구동기를 그대로 써서 시드 1 CT001의 네 상태를 재현했다. 원장 분개와 날짜별 referenceRate(1~7일 1300, 8~14일 1282, 15~21일 1284)를 덤프했고, 이 경로는 drawUniform으로 따로 다시 계산해 일치를 확인했다. 그 값으로 지시서 4절 규칙에 따라 손으로 계산한 결과는 보고서 표의 네 줄 모든 칸과 1원 단위까지 같다.

- 정시(평가일 11): 매입 −1,300,000, 운임·관세 −25,000센트@1300 = −325,000, 수금 140,000@1282 = 1,794,800이다. realized는 169,800이다. fx = −25,200으로, 판매에서 −25,200, 원가 쪽 차이 0이다.
- 늦은 편(평가일 15): D009편이 14일에 도착해 6일 늦었고 감액은 30,000센트다. 운임 −260,000@1300, 관세 −64,100@1282, 수금 1,410,200@1282로 realized는 −213,900이다. fx는 판매 −25,200과 관세 +900을 더한 −24,300이다. late는 −30,000@1282 = −384,600이다.
- 취소(평가일 8): realized는 원장 CASH 줄뿐이다. 매입 −1,300,000, 선급 운임 −260,000@1300, FREIGHT-RELEASE의 CASH +15,000@1282 = +192,300을 더해 −1,367,700이다. CANCELLATION_EXPENSE 줄은 넣지 않았는데, 이는 규칙대로다. 첫 선지급이 수락일과 같은 1300 주에 있었으므로 fx = 0이다. cancel = 192,300 − (1,820,000 − 65,000) = −1,562,700이다. 기대와의 큰 차이는 원화 매입이 현금 기준으로 고스란히 매몰되기 때문이고, 화물은 HELD_UNALLOCATED 재고로 남는다. 규칙("현금 기준", "매입 원화는 돌려받지 못한다")대로라 결함이 아니다.
- 열린 운송 중(평가일 10): 실제로 열려 있다. SH001은 9일에 출항했고 arrivalDay는 null, 계약은 IN_PROGRESS다. 남은 판매 110,000센트(예정 반출 14일 기준으로 6일 감액)와 도착 전 관세 5,000센트를 평가일 환율 1282로 평가한다. 현금 줄(−1,300,000, −260,000)과 합한 realized는 −213,900이다. openFixedRateKrw = −1,560,000 + 1,430,000 − 65,000 = −195,000이다.
- 늦은 편과 열린 경우가 같은 이유: 두 경우 모두 같은 D009편이다. 도착 예정 14일이 평가일 10일과 같은 환율 주(8~14일, 1282)에 들고, 감액 일수도 같다(6일). 그래서 평가일 환율로 매긴 남은 흐름이 실제 14일 현금과 정확히 같아진다. 우연의 일치일 뿐 오류가 아니다.

추가 검사로 R1·R0, 시드 1·4·7·21, 수락일 1·8·15일, 편 0·1, 예약 여부, 준비 여부, 직접 무역·주선, 취소 시점을 조합해 날마다 보고서를 34,128회 불렀다. 다음은 모두 성립했다.
- 수락일 8·15일처럼 반올림이 실제로 생기는 사례에서도 expected가 수락일 미리보기의 referenceEstimate.pnlKrw와 같다.
- R0의 fx는 늘 0이다.
- 열리지 않은 계약의 realized는 원장 현금을 따로 계산한 값과 같다.
- 편 놓침 뒤 재예약한 경우 residual은 0이다.

예외는 아래 finding 1의 상태 하나뿐이다. 2,400건이 모두 편을 놓친 뒤 재예약 전인 상태였다. 상태를 바꾸지 않는 읽기 함수라 저장·rules-2 골든에는 영향이 없다.

-- numbers#1 major / confirmed→major/confirmed→major
@ src/engine/reports.ts:460 (남은 운임 push), :486-494 (cancelFlows 구성), :497 (residual); 시험 공백 src/engine/m2a5-risk-fx.test.ts:554-571
P: 편을 놓쳐 첫 예약이 해제되고(계약 bookingId=null, 예약 CANCELLED) 아직 재예약하지 않은 열린 계약에서 residual이 0이 아니다. realized에는 '아직 내지 않은 운임'이 남은 흐름(−p.freight, 평가일 환율)으로 들어간다. 그런데 순차 대체의 어느 단계(1·2단계는 첫 FREIGHT-PREPAY, 7단계는 CASH 줄만)에도 대응 줄이 없어, 그 금액이 통째로 residual로 빠진다. 지시서 4절과 설계 3.4 10단계는 'residual 늘 0', R0에서도 'residual = 0'을 요구한다. 재예약하지 않고 끝까지 가면 끝난 상태(평가일 campaignDays)에서도 남는다. 판정표 진단 C(손실 주원인 = components 가운데 가장 큰 음수, residual 제외)는 이 운임 손실을 어느 원인에도 돌리지 못한다. 재예약 전후로 realized가 같은데 cancel 칸의 부호가 바뀐다.
E: 복제본에서 재현했다(시드 1 R1, 첫 편 D002를 준비 없이 예약해 놓친 뒤 재예약 전, 원장 PURCHASE −1,300,000원, FREIGHT-PREPAY-BK001 −20,000센트(1일), FREIGHT-RELEASE-BK001 CASH +15,000센트(2일)).
- 평가일 3: expected 195000, realized −260000, late −390000, cancel +195000, residual −260000(= −usdToKrwMinor(20000,1300)).
- 평가일 8: realized −275300, fx −24300, late −384600, cancel +195000, residual −256400(= −20000×1282/100).
- 평가일 10: residual −256400.
- R0도 같은 상태에서 residual −260000.
- 같은 날 BOOK_SAILING으로 재예약하면 realized는 −260000 그대로인데 cancel이 −65000으로 바뀌고 residual은 0이 된다.
- 혼합 탐색 34,128회 가운데 residual≠0인 2,400건이 전부 (예약 있음·준비 없음·계약 ACTIVE·예약 CANCELLED) 상태였다. R1·R0 각 1,200건이다.
- 기존 시험 '편 놓침 뒤 재예약'(test.ts:554)은 인도 완료 뒤에만 평가해서 이 상태를 보지 않는다.
FIX: 7단계(cancel)의 편 놓침 처리에 남은 재예약 운임을 넣는다. 조건은 `!cancelled && !shipment && !booking && firstPrepayment`일 때이고, `remaining`과 같은 줄 `flow(-p.freight, evaluationDay)`를 cancelFlows에 더한다. 의미상 '재예약 선지급'의 아직 내지 않은 몫을 평가일 환율로 넣는 것이다. 설계 3.4 표 7단계와 지시서 4절 '편 놓침' 문장에 '열린 계약의 미지급 재예약 운임은 평가일 환율로 7단계에 넣는다'를 허브가 덧붙인다. 시험을 더한다: 편을 놓친 다음 날과 다른 환율 주의 날에 R0·R1 모두 residual === 0, cancel === usdToKrwMinor(환급, 환급일 환율) − usdToKrwMinor(p.freight, 평가일 환율)을 단언한다.
V1: 반박하지 못했다. 주장이 그대로 맞다.

[코드 확인, 7410957 src/engine/reports.ts]
- 460행: `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay));`
  편을 놓치면 엔진이 예약을 해제하고(engine.ts:946-947, `releaseBooking` 뒤 `contract.bookingId = null`) 계약은 ACTIVE로 남는다. 그러면 `booking`은 undefined이고, 아직 내지 않은 재예약 운임이 남은 흐름으로 realized에 들어간다.
- 476행: `fxFlows[1].day = firstPrepayment?.day ...`. 1·2단계는 첫 FREIGHT-PREPAY를 운임 줄로 쓴다.
- 486-492행: cancelFlows는 `[...lateFlows]`에 FREIGHT-RELEASE·CANCEL-COMP·두 번째 이후 FREIGHT-PREPAY의 CASH 줄만 더한다. 아직 일어나지 않은 재예약 운임에 대응하는 줄이 없다.
- 497행: residual은 항등식으로 계산하므로 그 금액이 통째로 residual로 빠진다.

[독립 복제본 재현(7410957)]
시험의 '편 놓침 뒤 재예약' 구성을 그대로 쓰고, 재예약 전에 평가했다. 원장은 PURCHASE-CT001 1일 KRW −1,300,000, FREIGHT-PREPAY-BK001 1일 USD −20,000, FREIGHT-RELEASE-BK001 2일 USD +15,000이다.
- R1, 3일: expected 195000 · realized −260000 · late −390000 · cancel +195000 · residual −260000.
- R1, 8일(환율 1282): fx −24300 · cancel +195000 · residual −256400.
- R1, 10일: residual −256400.
- R0, 3·8·10일: residual 모두 −260000. 설계 3.4 R0 조항 'residual = 0'에도 어긋난다.
- 같은 날 BOOK_SAILING으로 재예약하면 realized는 −260000 그대로인데 cancel은 −65000이 되고 residual은 0이다. 같은 경제 상태에서 cancel 칸의 부호가 뒤집힌다.
- 끝난 상태도 확인했다. 재예약 없이 진행하면 실패로 끝나고 평가일은 failure.day다. R1 평가일 64에서 cancel +195000, residual −235400(= −20000×1177/100). R0 평가일 71에서 residual −260000.
  - 주장은 평가일을 campaignDays로 적었지만, 내 실행은 실패 종료라 평가일이 failure.day였다. 끝난 상태에서도 잔차가 남는다는 요지는 같다.
- 이 상태는 정상 플레이에서 나온다. 준비를 배정하지 않고 예약만 하면 되고, progress.ts:104가 TASK_WILL_MISS_SAILING로 경고하는 바로 
VFIX1: 1) 코드 수정. src/engine/reports.ts 486행 cancelFlows 생성 바로 다음에 한 줄을 넣는다.
```ts
if (!cancelled && !shipment && !booking && firstPrepayment) cancelFlows.push(flow(-p.freight, evaluationDay));
```
- 의미: 열린 계약에서 놓친 편의 미지급 재예약 운임을 평가일 환율로 7단계에 넣는다.
- 460행 remaining 줄과 같은 금액·날짜·cost 표지를 쓰므로, value()의 같은 환율 비용 합산 꼴이 realized와 똑같다.
- 조건에 `firstPrepayment`가 꼭 있어야 한다. 처음부터 예약하지 않은 계약은 2단계 운임 줄이 이미 평가일에 있으므로 넣으면 안 된다.
- 재예약한 뒤 또 놓친 경우(두 번째 PREPAY·RELEASE가 있고 현재 예약이 없는 경우)도 같은 줄로 덮인다.

2) 문서 수정(허브). 지시서 4절 '편 놓침' 문장과 설계 3.4 표 7단계에 다음 문장을 더한다. "예약이 해제되고 아직 재예약하지 않은 열린 계약은 미지급 재예약 운임(−p.freight)을 평가일 참고 환율로 7단계에 넣는다(남은 흐름의 '아직 내지 않은 운임'과 같은 줄)." 지금 '7단계에 새로 넣는 줄은 CASH 줄뿐' 문장이 이 경우를 막고 있으므로, 이 예외를 명시한다.

3) 시험 추가. test.ts:554 시험 옆에 넣는다.
- 구성: 준비 없이 첫 편을 예약해 놓친 직후(departureDay+1), 그리고 수락일과 환율 주가 다른 날을 평가일로 잡는다. 재예약하지 않은 상태에서 R0·R1 각각 확인한다.
- 단언:
  - `residual === 0`
  - `realized === cashValue(s,cfg,c) + 남은 흐름 환산`
  - `cancel`이 '환급 CASH 줄(환급일 환율) − p.freight(평가일 환율)'과 같다. 이 식은 value()와 같은 꼴로 시험 안에서 다시 계산한다. 같은 환율의 비용 줄은 합친 뒤 한 번 usdToKrwMinor로 바꾼다.
  - 같은 날 BOOK_SAILING으로 재예약한 상태와 cancel 값이 같다.
- 끝난 상태(실패 종료 또는 campaignDays)에서 재예약하지 않은 계약의 residual === 0도 하나 단언한다.
V2: 반박하려 했지만 결함이 주장 그대로 맞다. 코드로도, 직접 돌려서도 확인했다.

코드 읽기(src/engine/reports.ts, 7410957)
- :460 `if (!shipment && !booking) remaining.push(flow(-p.freight, evaluationDay));` 편을 놓치면 첫 예약이 CANCELLED가 되고 계약 bookingId는 null이 된다. 그러면 `booking`(BOOKED만 고름)과 `shipment`가 모두 없으므로 realized에 남은 운임 −p.freight가 평가일 환율로 들어간다.
- :486 비취소 계약은 `cancelFlows = [...lateFlows]`이다. 여기서 lateFlows[1]은 이미 첫 FREIGHT-PREPAY 날로 옮겨져 있다(:478). :487-491은 FREIGHT-RELEASE와 첫 예약 뒤의 FREIGHT-PREPAY CASH 줄만 더한다. 재예약 전에는 두 번째 PREPAY가 없으므로 남은 운임에 맞서는 줄이 1~9단계 어디에도 없다.
- 단계 값이 차례로 이어지므로 residual = realized − value(cancelFlows) = −usdToKrwMinor(p.freight, r_eval)이다.

직접 실행(독립 복제본, vitest 임시 시험. 끝나고 복제본은 지움)
조건: 준비 없이 ACCEPT_TRADE, 첫 편 ROUTE01-D002를 놓침, 아직 재예약하지 않음. 상태는 계약 ACTIVE, bookingId=null, BK001 CANCELLED. 원장은 PURCHASE KRW −1,300,000, FREIGHT-PREPAY-BK001 USD −20000(1일), FREIGHT-RELEASE-BK001 CASH +15000(2일).
- 시드 1, R1
  - 3일: expected 195000, realized −260000, late −390000, cancel +195000, residual −260000
  - 8일(환율 1282): realized −275300, fx −24300, late −384600, cancel +195000, residual −256400
  - 끝난 상태(80일, 계약 ACTIVE): residual −235600
- 시드 7, R1: 8일 residual −264400, 끝난 상태 −280600
- R0(시드 1·7): 3일·8일·끝난 상태 모두 residual −260000
- 같은 날 BOOK_SAILING으로 재예약하면: realized는 −260000 그대로, cancel은 −65000, residual은 0

수치가 검토자 증거와 정확히 같다.

요구사항과 비교
- 설계 3.4 표 10단계는 "늘 0이어야 한다"이다. 지시서 4절(:101)은 "시험이 residual === 0을 단언"이고, R0 항목(:92)은 "residual = 0"이다.
- 지시서 :98의 편 놓침 문장은 '이미 낸 재예약 선지급'만 다루고 '아직 내지 않은 재예약 운임'은 빠뜨렸다. 지시서의 빈틈
VFIX2: 고칠 곳은 src/engine/reports.ts :486 바로 아래다. 한 줄을 더한다.
```ts
const cancelFlows = cancelled ? lateFlows.filter((_, i) => i === 0 || (i === 1 && !!firstPrepayment)) : [...lateFlows];
// 편 놓침 뒤 아직 재예약하지 않은 열린 계약: realized의 남은 운임(:460)과 같은 줄을 7단계에 넣는다.
if (!cancelled && firstPrepayment && !shipment && !booking) cancelFlows.push(flow(-p.freight, evaluationDay));
```
조건이 :460의 남은 운임 조건(`!cancelled && !shipment && !booking`)에 `firstPrepayment`만 더한 것이라 두 쪽이 정확히 짝이 된다.
- 예약을 한 번도 하지 않은 계약은 이미 fxFlows[1]이 평가일 운임 줄이므로 이 조건에서 빠진다.
- 재예약했다가 또 놓친 경우도 같은 줄이 들어가 0이 된다.

복제본에 이 한 줄을 넣고 다시 돌린 결과는 다음과 같다.
- 시드 1·7, R0·R1에서 3일·8일·끝난 상태 모두 residual 0이다.
- 시드 1 R1의 cancel은 3일 −65000(재예약 뒤 값과 같다), 8일 −61400(= 195000 − 20000×1282/100), 끝난 상태 −40600이다.
- 전체 시험 1,389개가 그대로 통과한다. rules-2 경로와 골든에는 닿지 않는다.

문서
- 허브가 설계 3.4 표 7단계와 지시서 4절 '편 놓침' 문장에 다음을 덧붙인다. "아직 재예약하지 않은 열린 계약의 남은 운임(−기대 운임)은 평가일 환율로 7단계에 넣는다(realized의 남은 운임과 짝)."

시험 추가(m2a5-risk-fx.test.ts, '편 놓침 뒤 재예약' 옆)
- 같은 구동으로 첫 편을 놓치게 한 직후, 재예약 전에 평가한다. 평가일은 두 날이다.
  - 놓친 다음 날
  - 환율 주가 다른 날. changedSeed를 쓰고 `referenceRate(평가일) ≠ referenceRate(환급일)`을 먼저 단언한다.
- R1과 R0 모두에서 다음을 단언한다.
  - `report.realized === cashValue(s,cfg,c) − usdToKrwMinor(p.freight, r_eval) + (남은 판매·관세 항)`. 또는 남은 흐름까지 독립적으로 다시 계산한다.
  - `components.residual === 0`
  - `components.cancel === value([환급 CASH@환급일, −p.freight@평가일])`. 같은 환율이면 합친 뒤 한 번 반올림하는 환산 꼴을 따른다. 지금 자료처럼 반올림이 없을 때는 `usdToKrwMinor(환급, r_환급일) − usdToKrwMinor(p.freight, r_eval)`과 같다.
- 같은 날 BOOK_SAILING으로 재예약한 상태와 비교해 `realized`와 `cancel`이 같음을 단언한다. 이 단언이 수정 전에는 실패하는 변형 검출이 된다.

-- numbers#2 minor / not-verified
@ docs/ai/tasks/results/TASK-0062.md 'R1 계약 손익 실측' 표, src/engine/m2a5-risk-fx.test.ts:572-581
P: 보고 표의 '열린 운송 중' 사례가 '늦은 편' 사례와 모든 칸이 같다. 계산은 맞지만, 이 사례로는 남은 흐름을 평가일 환율로 매기는지 실제 지급일 환율로 매기는지 구별할 수 없다. 표가 열린 계약 평가의 근거 구실을 못 한다. 해당 시험도 residual 0만 단언하는 기록용 시험이다.
E: 두 사례 모두 D009편이다(9일 출항, 14일 도착, 납기 8일, 6일 늦음, 감액 30,000센트). 환율은 8~14일 1282이고, 열린 사례의 평가일 10과 늦은 편의 관세·수금일 14가 같은 주다. 그래서 열린 사례의 남은 판매 110,000@1282 = 1,410,200과 관세 −5,000@1282 = −64,100이 늦은 편의 실제 14일 현금과 같다. 두 사례 모두 realized −213900, fx −24300, late −384600이다.
FIX: 표의 열린 사례를 평가일과 예정 수금·관세일이 다른 환율 주에 걸리게 고른다. 예를 들어 later=2(D016편, 21일 도착, 1284 주)를 평가일 10(1282)에 평가하면 열린 사례의 realized가 그 계약이 나중에 완료됐을 때의 realized와 달라져 평가일 환율 사용이 표에 드러난다. 기록 시험에 '열린 realized ≠ 같은 계약 완료 뒤 realized'를 함께 단언한다.


```
