# TASK-0033 화면 적대 검수 결과 (허브, 2026-10-13)

대상: 개발 브랜치 `379a862`(TASK-0033(+R1·R2) 병합 트리), 검수 작업 트리 rv-ui. 방법: 관점 4개(경제 값·상태·접근성·시험 빈칸)로 결함 후보를 찾고, 후보마다 다른 에이전트가 재현하거나 반박했다. 후보 22건 가운데 21건 확정, 1건 기각(A11Y-6).

F1·F2는 TASK-0034 지시 7·8로 이미 고쳤다(`4ccfa0c`). 나머지는 아래 ‘보낼 곳’ 제안대로 세션 A가 0057 또는 후속 지시서에 나눈다. ‘보낼 곳’은 허브 제안이고, 결정은 세션 A가 한다.

| ID | 관점 | 심각도 | 판정 | 결함 | 위치 | 보낼 곳(제안) |
|---|---|---|---|---|---|---|
| F1 | econ | medium | confirmed | 일정의 예상 수금액이 규칙 2의 하루당 감액 대신 정액 1회 감액을 뺌 | `src/ui/schedule.ts:67` | 0034 반영(지시 7) |
| F2 | econ | medium | confirmed | 위쪽 막대의 '지급 상태'는 '대기 중인 명령 반영'이라고 적혀 있지만, 대기 중인 환전으로는 바뀔 수 없음 | `src/ui/market.ts:98 (paymentStatusKo 88-95, 안내문 main.ts:953)` | 0034 반영(지시 8) |
| F3 | econ | low | confirmed | 캠페인이 끝난 뒤에도 막대가 미지급을 무시하고 급여 가능일을 '90일(캠페인 끝)까지'로, 지급 상태를 앞으로의 일처럼 보임 | `src/ui/market.ts:98 (main.ts:379, previews.ts:44)` | 0057(경영 실패·종료 화면) |
| F4 | econ | low | confirmed | '캠페인 안에 인도되지 않습니다' 경고가 통관 일수를 빼고 도착일만 비교함(감액 n과 기준이 다름) | `src/ui/market.ts:56` | 0057 또는 R1(시장 경고) |
| F5 | econ | low | confirmed | 환전 단위 문구가 '100 USD'로 박혀 있어 config.operations.fx.lotUsdMinor와 따로 놂 | `src/ui/market.ts:84, src/ui/main.ts:848-849` | 0057(환전·지급 경고) |
| SF-1 | state | medium | confirmed | 정상 종료(ENDED) 뒤에도 규칙 2 위쪽 막대와 보고가 실패 카운트다운·'캠페인 끝까지' 급여 가능일·환전 권유를 계속 보인다 | `src/ui/main.ts:379 (operationsTopbar를 단계와 무관하게 그림), src/ui/market.ts:88-94·97-98, src/engine/previews.ts:41-53, src/ui/g` | 0057(경영 실패·종료 화면) |
| SF-2 | state | low | confirmed | '지급 상태'는 '대기 중인 명령 반영'이라고 안내하지만 회복 환전을 대기열에 넣어도 바뀌지 않는다. 실패 마감일에도 '위험 · 실패까지 0일'이 남는다 | `src/ui/market.ts:88-94·98(title·숨김 설명 '대기 중인 명령 반영'), src/ui/main.ts:953(대기열 안내문), src/engine/operations.ts:228-236(미지급 ` | 0034 반영(지시 8, F2와 같은 결함) |
| SF-3 | state | low | confirmed | 경영 실패(FAILED)로 끝난 화면에 견적판·수량 고르기·시세표 '다음 관측'이 살아 있고, 주선 견적은 유효기간이 지난 것까지 나온다 | `src/engine/engine.ts:848-861(실패 날에는 만료·공개 단계를 건너뜀)·868(day+1, ENDED), src/engine/market.ts:86-92(openTradePairs는 state.d` | 0057(경영 실패·종료 화면) |
| A11Y-1 | a11y | medium | confirmed | 환전의 원화 부족 경고가 단추와 알림 문장 어디에도 연결되지 않는다 | `src/ui/market.ts:85 (warningKo <p class="reason">·환전 단추), src/ui/main.ts:203 (대기 성공 알림 문장), src/ui/main.ts:1424-1427 (금액` | 0057(환전·지급 경고) |
| A11Y-2 | a11y | medium | confirmed | 수량 select를 바꿔 수락이 막혀도(disabled) 알림이 없고 이유 문장도 연결되지 않는다 | `src/ui/main.ts:470-472 (disabled 수락 단추·<p class="reason">·planner 생략), src/ui/main.ts:1418-1422 (offer-quantity change →` | 0057 또는 R1(견적 카드) |
| A11Y-3 | a11y | medium | confirmed | 환전 단추를 누르면 새로 생긴 알림 띠가 단추를 가려 초점이 '하루 진행 ▶'으로 옮겨진다 | `src/ui/main.ts:101-112 (focusWithoutScroll의 띠 밖 판정→end-day), src/ui/main.ts:1146-1154 (초점 복원), src/ui/main.ts:192-206 (환` | 0057(환전·지급 경고) |
| A11Y-4 | a11y | low | confirmed | 환전 금액이 대기 반영으로 자동 축소되는 것이 알려지지 않고, 다시 누르면 다른 금액이 들어간다 | `src/ui/main.ts:1081 (render마다 ui.exchangeLots 보정), src/ui/main.ts:1312-1313 (명령 금액 = ui.exchangeLots), src/ui/main.ts:20` | 0057(환전·지급 경고) |
| A11Y-5 | a11y | low | confirmed | 시세표 스크롤 칸에 초점이 있을 때 한 열 전환이 일어나면 초점이 사라진다 | `src/ui/main.ts:975-982 (onColumnChange: id·data-action이 없으면 복원 안 함), src/ui/market.ts:19 (div.table-scroll에 id·data-acti` | 0057 또는 R1(시세표) |
| A11Y-6 | a11y | low | refuted | 여러 견적 카드의 수량 select 이름이 모두 '수량 고르기'라 어느 견적인지 구분할 수 없다 | `src/ui/market.ts:33, src/ui/main.ts:543` | 기각 |
| GAP-1 | tests | medium | confirmed | 규칙 2 일정의 늦은 인도 '수금' 예상이 하루 비례 감액 대신 정액 50 USD를 한 번만 뺀다. 이 줄을 지키는 시험은 FLAT_ONCE 시나리오에만 있다 | `src/ui/schedule.ts:67 (시험: src/ui/schedule.test.ts:131-137, src/ui/m2a5-trade-ui.test.ts:260-285·500-524)` | 0034 반영 여부 확인(F1 시험) |
| GAP-2 | tests | medium | confirmed | 규칙 2 경영 보고가 선복 계약 요금 예약을 '체결한 계약이 낼 운임·관세'로 설명한다. 바로 그 상태를 만드는 시험은 자금 표만 본다 | `src/ui/main.ts:845 (값 출처 src/engine/reservations.ts:63-64, 표 분리 src/ui/main.ts:745, 시험 src/ui/m2a5-trade-ui.test.ts:500-` | 0057(원화 보고·결산) |
| GAP-3 | tests | low | confirmed | 수량 선택지·변경 검사가 '최소 수량 = quantityStep'이고 '매수·매도 maxQuantity가 같은' 자료에서만 엔진 규칙과 일치한다 | `src/ui/market.ts:29, src/ui/main.ts:1422 (엔진 src/engine/engine.ts:304, 자료 생성 src/engine/market.ts:63-64, 시험 src/ui/m2a5-` | 0057 또는 R1(견적 카드) |
| GAP-4 | tests | low | confirmed | 캠페인 뒤 도착 경고가 통관 일수를 빼먹는다. 경계 반례 시험은 규칙 2의 customsDays가 0이라서만 맞는다 | `src/ui/market.ts:56 (같은 함수 46행은 customsDays를 더함, 시험 src/ui/m2a5-trade-ui.test.ts:305-317)` | F4와 함께 |
| GAP-5 | tests | low | confirmed | 환전 단위 '100 USD'가 화면 문구에 상수로 박혀 있고, 시험도 같은 문자열을 단언해 lotUsdMinor가 바뀌면 잡지 못한다 | `src/ui/market.ts:84, src/ui/main.ts:848-849 (시험 src/ui/m2a5-trade-ui.test.ts:545·548)` | F5와 함께 |
| GAP-6 | tests | low | confirmed | 규칙 1 일정의 FREIGHT·DUTY 문구(이번에 switch로 다시 씀)를 지키는 시험이 없다. 골든 세 상태는 일정이 닫혀 있다 | `src/ui/schedule.ts:88-89 (일정 기본 닫힘 src/ui/session.ts:14, 골든 src/ui/m2a5-trade-ui.test.ts:56-69, 정규화 40행)` | 0057 또는 R1(일정) |
| GAP-7 | tests | low | confirmed | 위쪽 막대가 view를 쓰는지 시험이 확인하지 못한다. 기대 문자열이 환전 칸에도 그대로 나오고, 환전 칸은 자기 함수 출력과 비교한다 | `src/ui/main.ts:379 (시험 src/ui/m2a5-trade-ui.test.ts:236·241·394, 같은 문자열의 다른 출처 src/ui/market.ts:81·85, src/engine/reader` | 0034로 일부 해소 여부 확인(막대가 state 기준으로 바뀜) |
| GAP-8 | tests | low | confirmed | 지급 상태의 '캠페인 뒤 실패일' 문구가 경계(failAtCloseOfDay == campaignDays)를 시험하지 않아 `>`와 `>=`를 구분하지 못한다 | `src/ui/market.ts:94 (시험 src/ui/m2a5-trade-ui.test.ts:526-540, 특히 535)` | 0057(지급 경고) |

## 항목별 재현과 고칠 방향

### F1 일정의 예상 수금액이 규칙 2의 하루당 감액 대신 정액 1회 감액을 뺌

- 실패 상황: 규칙 2(SCENARIO_M2_OPERATIONS) 1일에 OFFER_BUY_02+OFFER_SELL_02(화장품 50상자, 판매 2,500 USD, 납기 8일, 대금일 12일)를 '수락·배정·예약 한 번에'로 넣는다. 운송편은 ROUTE02-D009(9일 출항, 13일 도착)를 고른다. 오늘 할 일의 일정을 펼치면 13일 '수금' 줄이 +$2,450.00(2,500−50)이다. 엔진은 13일 인도 때 lateDays 5로 lateDeliveryReduction=min(50×5, 2,500)=250을 빼서 청구서 2,250 USD를 만든다(engine.ts:1038-1039, 1089-1096). 화면 예상이 200 USD 많다. 늦은 날이 많아 감액이 판매대금 전액이 되면 엔진은 청구서를 만들지 않는데(engine.ts:1081-1086), 일정에는 여전히 +(판매−50)이 보인다.
- 왜 틀렸나: scheduleItems는 아직 인도하지 않은 계약의 RECEIPT 금액을 `c.saleAmountMinor - (delivery > deadline ? config.terms.lateDeliveryPriceReductionMinor : 0)`로 직접 계산한다. 이 식은 규칙 1의 FLAT_ONCE에만 맞는다. 규칙 2 계약 조건은 per_late_day_capped(하루 50 USD, 상한 100%)다. 엔진·견적(readers.ts:90, reports.ts:103)·진행 상자(progress.ts:52)는 모두 lateDeliveryReduction(config, sale, lateDays)를 쓰지만, 일정만 쓰지 않는다. TASK-0033에서 규칙 2를 화면에서 고를 수 있게 되면서 이 길로 들어갈 수 있게 됐다.
- 재현: 임시 파일 src/ui/zz-verify-econ-F1.test.ts를 만들어 `npx vitest run src/ui/zz-verify-econ-F1.test.ts --disableConsoleIntercept --silent=false`로 실행했고, 끝난 뒤 지웠다(git status 깨끗함).
1) cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0]), day1 = openDay(createGame(cfg), cfg).state.
2) cmd = {id:'C1', type:'ACCEPT_TRADE', buyOfferId:'OFFER_BUY_02', sellOfferId:'OFFER_SELL_02', plan:{employeeId:'EMP01', sailingId:'ROUTE02-D009'}}. planState 결과는 APPLIED, CT001의 판매 250000·납기 8·대금일 12·BK001.
3) scheduleItems(planState(day1,cfg,[cmd]).state, cfg, cfg.campaignDays)에서 'RCV:CT001'은 day 13, amountMinor 245000(estimate true).
4) runDays(day1, cfg, 6, {1:[cmd]}) 뒤 openDay로 7일을 열고 scheduleBlock(open:true)을 그리면 '+2,450.00 USD' 줄이 나온다.
5) runDays(day1, cfg, cfg.campaignDays, {1:[cmd]})를 끝까지 돌리면 CT001은 deliveredDay 13, lateDays 5, priceReductionMinor 25000, INV-CT001.amountMinor 225000이다. expect(245000 - 225000).toBe(20000)가 통과한다.
6) 같은 절차를 ROUTE02-D058로 하면 엔진은 감액 250000에 청구서가 없는데, 일정은 여전히 +245000이다.
- 고칠 방향(제안): src/ui/schedule.ts에 `import { lateDeliveryReduction } from '../engine/operations'`를 넣는다. 66-67행을 다음처럼 바꾼다.
`const net = c.saleAmountMinor - lateDeliveryReduction(config, c.saleAmountMinor, delivery - c.deliveryDeadlineDay);`
`if (delivery !== null && net > 0) add(`RCV:${c.id}`, 'RECEIPT', Math.max(c.paymentDueDay, delivery), c.id, '수금', true, { currency: c.currency, amountMinor: net });`
lateDeliveryReduction은 lateDays가 0 이하이면 0을 내므로 기존 비교식은 필요 없다. net이 0이면 엔진처럼 수금 줄을 빼거나, '감액으로 받을 대금 없음' 같은 0원 안내 줄로 바꾼다. 어느 쪽인지는 Sol이 정하되 엔진(engine.ts:1081-1086)과 맞춘다.
시험은 schedule.test.ts:132-138과 같은 비교를 규칙 2(SCENARIO_M2_OPERATIONS, ROUTE02-D009, 그리고 전액 감액되는 ROUTE02-D058)로 하나 더 둔다. 기존 규칙 1 시험의 `priceReductionMinor === lateDeliveryPriceReductionMinor` 단언은 그대로 둬도 된다.
화면 문구를 같이 정리한다면 main.ts:696 선택지 문구도 progress.ts:74처럼 규칙 2용 '늦은 하루마다 …씩, 최대 …까지'로 나누는 것이 맞다(이 부분은 확인하지 않았다).

### F2 위쪽 막대의 '지급 상태'는 '대기 중인 명령 반영'이라고 적혀 있지만, 대기 중인 환전으로는 바뀔 수 없음

- 실패 상황: KRW 미지급이 있어 '경고 · 실패까지 N일'(마지막 날에는 '위험 · 실패까지 0일')인 상태에서, 환전 칸에 paymentDefaultStatus(...).recovery.lotsToClearAll 묶음의 USD→KRW를 넣는다. 같은 막대의 '원화 급여 가능일'(view 기준)은 '없음'에서 'NN일까지'로 바뀐다. 그런데 '지급 상태'는 '경고/위험 · 실패까지 N일'로 그대로다. 오늘 할 일 안내에는 '위쪽 막대의 급여 가능일·지급 상태는 대기 중인 명령을 반영합니다'라고 적혀 있다. 하루 진행을 하면 엔진은 6단계 settleObligations(engine.ts:843, 1183-1201)로 그 미지급을 갚고, 상태는 '지급 정상'이 된다.
- 왜 틀렸나: paymentDefaultStatus의 level은 '가장 오래된 미지급 의무(paidDay===null)'와 outcome만으로 정한다(operations.ts:232-244). planState는 명령만 사본에 적용하고 마감 단계(수금→밀린 지급 상환)를 실행하지 않는다(engine.ts:172-180). 그리고 어떤 명령도 paidDay를 바꾸지 않는다(paidDay를 쓰는 곳은 engine.ts:1196 하나). 그래서 paymentDefaultStatus(view)는 항상 확정 state와 같다. 'view 기준·대기 명령 반영'이라는 표시와 실제 값이 다르다. 같은 막대의 급여 가능일과도 모순된다.
- 재현: 1) rv-ui에 src/ui/zz-verify-econ-F2.test.ts를 만든다. m2a5-trade-ui.test.ts의 unpaidState·dayState와 같은 식으로 state를 만든다. 58일, KRW 미지급, WARNING 상태다.
2) lots = paymentDefaultStatus(state,cfg).recovery.lotsToClearAll이다(2).
3) startUi(cfg) → change({action:'scenario'}, cfg.id) → importText(serializeSave(state))로 상태를 불러온다. 막대에서 '<span>지급 상태</span><b>…</b>'와 '<span>원화 급여 가능일</span><b>…</b>'를 뽑는다.
4) change({action:'exchange-amount'}, '2') 뒤 click({action:'exchange'})를 한다. 급여 가능일은 '없음'에서 '58일까지'로 바뀐다. 지급 상태는 '경고 · 실패까지 13일' 그대로다.
5) commitDay(state,cfg,[{id:'FXV',type:'EXCHANGE_CURRENCY',direction:'USD_TO_KRW',usdAmountMinor:2*lot}]).state의 paymentDefaultStatus.level은 'NONE'이다.
6) 71일(failAtCloseOfDay)까지 빈 명령으로 진행한 뒤 22묶음으로 같은 절차를 한다. 지급 상태는 '위험 · 실패까지 0일'로 남고, commitDay 뒤에는 '지급 정상'이다.
7) npx vitest run src/ui/zz-verify-econ-F2.test.ts --silent=false로 실행한 뒤 rm -f로 지운다.
- 고칠 방향(제안): 아래 셋 중 하나를 고른다.
(가) 권장. 지급 상태 칸을 확정 state 기준으로 바꾼다.
- operationsTopbar가 state와 view를 함께 받게 한다. 급여 가능일은 view, 지급 상태는 state로 계산한다.
- 지급 상태 칸의 '대기 중인 명령 반영' 설명(title·aria-describedby 'payment-description', market.ts:98)을 '확정 기준'으로 바꾼다.
- 대기열 안내(main.ts:953)를 '위쪽 막대의 급여 가능일은 대기 중인 명령을 반영합니다. 지급 상태와 다른 금액은 확정 기준입니다.'로 고친다.
- 엔진은 바꾸지 않는다.
(나) 덧붙임. 대기 명령 뒤 예상을 보여 준다.
- view에서 settleObligations와 같은 규칙으로 미지급을 갚았다고 가정한 예상값을 계산하는 읽기 함수를 엔진에 둔다. 이름은 예: projectedPaymentStatus(view, config)다. 규칙은 오래된 순서로, 통화별 현금이 의무 금액 이상이면 갚는다.
- 지급 상태 칸에 '경고 · 실패까지 13일 → 하루 진행 뒤 정상 예상'처럼 덧붙인다. 마감 단계의 수금·고정비·급여 순서까지 흉내 내야 하므로 엔진 쪽 읽기 함수가 필요하다.
(다) 시험을 더한다. unpaidState에서 lotsToClearAll 환전을 대기에 넣은 뒤 막대 문자열을 고정하는 회귀 시험이다. (가)를 고르면 지급 상태 칸 설명에 '대기 중인 명령 반영'이 없어야 한다.
TASK-0034의 지급 알림(지시 5)도 같은 기준을 써야 한다. 확정 state로 원인·회복량을 보이고, 대기 환전이 있으면 '대기 중인 환전으로 하루 진행 때 갚을 예정'을 따로 적는다. 그래야 lotsToClearAll이 view에서 0으로 보이는 모순을 피한다.

### F3 캠페인이 끝난 뒤에도 막대가 미지급을 무시하고 급여 가능일을 '90일(캠페인 끝)까지'로, 지급 상태를 앞으로의 일처럼 보임

- 실패 상황: 마지막 날 마감에 최근 13일 안에 생긴 KRW 미지급이 남은 채 끝나면 outcome은 COMPLETED, state.day는 campaignDays+1(91)이다. operationsTopbar(view)는 ENDED에서도 그려진다. payrollRunwayDay(view)는 91..90 반복이 비어 null을 돌려주므로 '원화 급여 가능일'이 '90일(캠페인 끝)까지'로 보인다. 같은 화면 결산은 '남은 미지급 KRW …'를 보인다. '지급 상태'는 '경고 · 실패까지 (failAt−91)일 · 90일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다'처럼 이미 끝난 캠페인을 앞으로의 일처럼 적는다. 환전 칸도 같은 이유로 '90일(캠페인 끝)까지 → 90일(캠페인 끝)까지'를 보인다.
- 왜 틀렸나: 경영 보고는 ENDED에서 급여 가능일 문장을 빼지만(main.ts:847), 규칙 2 막대와 환전 칸은 phase를 보지 않고 view.day=campaignDays+1로 읽기 함수를 부른다. payrollRunwayDay의 null은 '캠페인 끝까지 지급 가능'이라는 뜻이다. 그런데 남은 날이 없어서 생긴 null도 같은 문구로 바뀐다. 남은 미지급이 있다는 엔진 상태와 반대로 표시된다.
- 재현: 1. rv-ui 안에 src/ui/zz-verify-econ-F3.test.ts를 만든다. 내용은 m2a5-trade-ui.test.ts의 unpaidState·dayState와 같다.
2. 상태를 만든다: unpaid=unpaidState() → short={...cfg, campaignDays: unpaid.day} → ended=commitDay(unpaid, short, []).state. ended는 ENDED·COMPLETED이고, campaignSummary(ended, short).unpaidObligations의 KRW 합은 240,000이다.
3. 화면을 연다: startUi(short) → ui.change({action:'scenario'}, short.id) → ui.importText(serializeSave(ended)).
4. ui.app.innerHTML에서 확인한다.
   - `<span>원화 급여 가능일</span><b>58일(캠페인 끝)까지</b>`
   - `<span>지급 상태</span><b>경고 · 실패까지 12일 · 58일 캠페인이 끝날 때까지 …</b>`
   - 환전 dd: '58일(캠페인 끝)까지 → 58일(캠페인 끝)까지'
   - '남은 미지급 KRW: 240,000원'
5. 90일 그대로 재현할 수도 있다. openDay(createGame(cfg))부터 매일 commitDay를 한다. 76일까지는 EXCHANGE_CURRENCY USD_TO_KRW (lotsToClearAll+1)×lot를 넣고, 그 뒤에는 빈 명령으로 끝까지 간다. 막대는 '90일(캠페인 끝)까지', 지급 상태는 '위험 · 실패까지 2일 · 90일 캠페인이…', 결산은 '남은 미지급 KRW: 1,920,000원'이다.
6. 실행 명령은 `npx vitest run src/ui/zz-verify-econ-F3.test.ts --silent=false`이고, 끝나면 rm -f로 지운다.
- 고칠 방향(제안): UI 쪽에서 phase === 'ENDED'를 먼저 거른다. 엔진의 payrollRunwayDay가 null을 내는 의미('끝까지 가능')는 진행 중 상태에서는 맞으므로 바꾸지 않는다.

1) market.ts:97-98 operationsTopbar
   - view.phase === 'ENDED'이면 급여 가능일 칸 값을 '캠페인 종료'로 둔다. 칸을 빼면 막대 폭이 바뀌므로 R2 레이아웃 시험을 다시 돌려야 한다.
2) market.ts:88-95 paymentStatusKo
   - ENDED이고 outcome이 COMPLETED이며 미지급이 있으면 '미지급을 남기고 종료'(통화별 금액은 결산 참조)를 반환한다. '실패까지 N일'과 '…갚지 못하면…'은 붙이지 않는다.
   - 미지급이 없으면 '지급 정상'을 그대로 둔다.
3) market.ts:81·85 exchangeBlock과 main.ts:569-570
   - ENDED에서는 환전 칸을 그리지 않는 쪽을 권한다. 엔진도 ENDED 명령을 받지 않는다.
   - 최소한 급여 가능일 행은 '캠페인 종료'로 바꾼다.
4) 대안은 공통 변환에서 한 번에 막는 것이다. growth.ts:33-35 payrollRunwayKo에서 today > campaignDays이면 '캠페인 종료'를 반환하면, 막대·환전·recruitment.ts:85·growth.ts:53 호출이 함께 고쳐진다.
   - culture.ts:63의 runwayEnd는 따로 확인해야 한다.
   - paymentStatusKo는 이 변환을 거치지 않으므로 2)를 따로 고쳐야 한다.
5) 시험: 위 재현 2의 90일 경로(또는 short 설정)로 ENDED·COMPLETED·KRW 미지급 상태를 만든다. 막대 두 칸과 환전 칸에 '(캠페인 끝)까지'와 '실패까지'가 없음을 toBe로 고정한다. 결산 '남은 미지급 KRW'와 모순되지 않는지도 함께 본다.

### F4 '캠페인 안에 인도되지 않습니다' 경고가 통관 일수를 빼고 도착일만 비교함(감액 n과 기준이 다름)

- 실패 상황: customsDays=1인 설정 사본에서 다음 출항편이 정확히 campaignDays에 도착하는 견적을 본다. 예: 1일 상태, OFFER_BUY_02+SELL_02, ROUTE02-D002가 6일에 도착하고 사본의 campaignDays=6이다. q.arrivalDay(6) > campaignDays(6)가 거짓이라 경고가 없다. 엔진은 6일에 도착 처리 뒤 releaseDay=7로 둔다(engine.ts:1006). 인도는 releaseDay ≤ s.day일 때만 하므로(engine.ts:1034) 캠페인 안에 인도되지 않고 미인도로 남는다.
- 왜 틀렸나: 같은 함수의 감액 n은 arrivalDay + customsDays − deadline으로 반출(인도)일을 기준으로 삼는다(market.ts:46). 캠페인 뒤 경고만 arrivalDay를 쓴다. 엔진의 인도일은 arrival + customsDays다. 지금 규칙 2 자료는 customsDays=0이라 드러나지 않는다. 그러나 결과 보고·시험은 customsDays>0 사본을 정식 반례로 쓰고, 그 사본에서는 종료일 경계가 하루 어긋난다.
- 재현: 재현 파일: src/ui/zz-verify-econ-F4.test.ts. `npx vitest run`으로 실행해 통과했고, 실행 뒤 지웠다.

```ts
const cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0]);
const dayState = (d, c) => openDay(runDays(createGame(c), c, d-1).state, c).state;
const pair = { buyOfferId:'OFFER_BUY_02', sellOfferId:'OFFER_SELL_02' };
const q0 = quotePreview(dayState(1,cfg), cfg, pair);            // arrivalDay 6
const limited = structuredClone(cfg); limited.terms.customsDays = 1; limited.campaignDays = q0.arrivalDay!;
const s1 = dayState(1, limited), q = quotePreview(s1, limited, pair);
expect(q.arrivalDay! + 1).toBeGreaterThan(limited.campaignDays);
expect(operationsQuoteFacts(q, s1, limited).join('')).not.toContain('캠페인 안에 인도되지 않습니다'); // 통과 = 결함
const sailing = listSailings(limited, 'ROUTE02', 2)[0];          // ROUTE02-D002, 6일 도착
const emp = s1.employees.find(e => e.employmentStatus==='employed' && e.locationCityId===limited.homeCityId)!;
const cmd = { id:'F4', type:'ACCEPT_TRADE', ...pair, plan:{ employeeId: emp.id, sailingId: sailing.id } };
const end = runDays(s1, limited, limited.campaignDays, { 1:[cmd] }).state;
// end.phase==='ENDED', shipment.arrivalDay 6, releaseDay 7, contract.deliveredDay === null
```

UI 확인: startUi(limited) → change scenario → importText(serializeSave(s1)) 순서로 그렸다. data-buy="OFFER_BUY_02" 카드에는 경고가 없고, OFFER_BUY_01 카드에는 있다.
- 고칠 방향(제안): 1) 최소 수정: src/ui/market.ts:56의 조건을 `q.arrivalDay !== null && q.arrivalDay + config.terms.customsDays > config.campaignDays`로 바꾼다. 감액 문장(market.ts:46)과 같은 반출일 기준이 된다.

2) 권장 수정: QuotePreview에 인도(반출)일 필드를 둔다. reports.ts:101의 `release`를 그대로 내보내면 된다(예: `releaseDay`). market.ts:46과 :56이 모두 이 값을 읽게 하면 UI가 통관 규칙을 따로 다시 계산하지 않는다. 다만 reports.ts의 반환 타입이 바뀌므로 엔진 쪽 손질이 함께 필요하다. 이번에 UI만 고친다면 1)로 충분하다.

3) 시험: m2a5-trade-ui.test.ts:303 '캠페인 뒤 도착 경고는 도착 당일 캠페인 종료에서는 나오지 않는다'는 customsDays=0에서만 맞는 이름이다. customsDays=1 사본에 다음 반례를 더한다.
- campaignDays = arrivalDay이면 경고가 나온다.
- campaignDays = arrivalDay + customsDays이면 경고가 없다.
- 엔진을 끝까지 돌려 deliveredDay와 대조한다.
기존 customsDays=0 단언(:312-315)은 수정 뒤에도 그대로 통과한다.

### F5 환전 단위 문구가 '100 USD'로 박혀 있어 config.operations.fx.lotUsdMinor와 따로 놂

- 실패 상황: 조정으로 fx_exchange.lot이 50 USD(lotUsdMinor=5000)가 된 설정에서 환전 선택지는 $50.00(1묶음), $100.00(2묶음)…로 나온다. 그런데 이름표는 '금액 (100 USD 단계)', 경영 보고는 '환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다'로 남는다. 엔진 거절 문장은 `${o.fx.lotUsdMinor / MINOR_PER_MAJOR.USD} USD 단위`로 실제 값을 쓴다(operations.ts:166).
- 왜 틀렸나: 선택지 금액·명령 금액(main.ts:1312)·엔진 검사는 모두 lotUsdMinor를 읽는다. 안내 문구 두 곳만 상수다. 자료 상태가 PRE_TUNING/DESIGN이라 조정값이 바뀔 수 있다. R1 지시도 조정값에 따라 바뀌는 상수를 엔진 값에서 읽게 했는데, 그 원칙에 어긋난다. 지금 자료(100 USD)에서는 드러나지 않는 잠재 불일치다.
- 재현: 위치는 /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/rv-ui이다.

1. 임시 파일 src/ui/zz-verify-econ-F5.test.ts를 만든다. 내용은 다음과 같다.
   - `const c = structuredClone(loadScenario(OPERATIONS_SCENARIO_IDS[0])); c.operations!.fx.lotUsdMinor = 5000;`
   - `const s1 = openDay(runDays(createGame(c), c, 0, {}).state, c).state;`
   - `const html = exchangeBlock(s1, c, 'USD_TO_KRW', 1);`
   - `expect(html).toContain('금액 (100 USD 단계)'); expect(html).toContain('50.00 USD (1묶음)');`
   - 엔진 확인: `applyOperationsCommand(structuredClone(s1), c, {id:'X2', type:'EXCHANGE_CURRENCY', direction:'USD_TO_KRW', usdAmountMinor:7500})`가 '50 USD 단위'를 포함한다.
   - 보고 확인
     - s1에서 시작해 paymentDefaultStatus(state,c).level === 'NONE'인 동안 `openDay(commitDay(state,c,[]).state,c).state`로 하루씩 진행한다. 58일에 멈춘다.
     - `ui = await startUi(c); await ui.change({action:'scenario'}, c.id); await ui.importText(serializeSave(state));`
     - `ui.app.innerHTML`에 '환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다.'와 '50.00 USD (1묶음)'이 함께 있다.
2. `npx vitest run src/ui/zz-verify-econ-F5.test.ts`를 실행하면 통과한다. 결함이 성립한다는 뜻이다.
3. `rm -f src/ui/zz-verify-econ-F5.test.ts`로 지운다. git status에 남은 zz-verify-econ-F4.test.ts는 다른 검증자의 파일이라 건드리지 않았다.
- 고칠 방향(제안): 1. 이름표(src/ui/market.ts:84): '100 USD'를 설정값에서 만든다. 예: `금액 (${fx.lotUsdMinor / MINOR_PER_MAJOR.USD} USD 단계)`. fx는 같은 함수 79행에 이미 있다. MINOR_PER_MAJOR는 engine/money에서 가져온다. 엔진 거절 문장(operations.ts:166)과 같은 표기를 쓰려면 위 식이 맞다. formatMoney('USD', lot)를 쓰면 '50.00 USD 단계'로 표기가 갈린다.
2. 경영 보고(src/ui/main.ts:848, 849): 같은 문장이 두 번 있다. market.ts에 문장을 만드는 도우미 하나(예: `exchangeHintKo(config)`)를 두고 두 줄이 함께 부르게 한다. 도우미가 위와 같은 식으로 lot 값을 넣어 '환전 칸에서 {lot} USD 단위로 원화로 바꿀 수 있습니다. 자동 환전은 없습니다.'를 돌려준다.
3. 시험(src/ui/m2a5-trade-ui.test.ts:545, 548): 고정 문자열 대신 29행의 `lot` 상수로 기대 문장을 만든다. 여기에 lotUsdMinor를 5000으로 바꾼 설정 하나로 이름표·보고·선택지가 같은 단위를 보이는지 확인하는 시험을 더한다.
4. 같은 위험이 있는 곳: TASK-0034 초안 34행 '일주일이면 USD 약 {wageUsdLotsPerWeek × 100} 환전'도 100을 고정한다. 확정본에서는 `wageUsdLotsPerWeek × lotUsdMinor`를 formatMoney로 쓰도록 고쳐 둔다.

### SF-1 정상 종료(ENDED) 뒤에도 규칙 2 위쪽 막대와 보고가 실패 카운트다운·'캠페인 끝까지' 급여 가능일·환전 권유를 계속 보인다

- 실패 상황: 규칙 2에서 77일 이후 생긴 원화 미지급(임차료·급여)을 갚지 못한 채 90일 마감 → phase ENDED, outcome COMPLETED, day 91. 위쪽 막대 '지급 상태'는 paymentStatusKo(view)가 level WARNING/DANGER를 그대로 받아 예: '위험 · 실패까지 3일 · 90일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다'를 보인다. 이미 끝난 캠페인에 남은 실패일과 미래형 조건문이 나온다. 같은 막대의 '원화 급여 가능일'은 payrollRunwayDay가 day 91 > campaignDays라 반복을 한 번도 돌지 않고 null을 돌려준다. 그래서 '90일(캠페인 끝)까지'로 표시된다. 바로 아래 결산에는 '남은 미지급 KRW …'가 있다. 경영 보고 '현금과 이익이 다른 이유'(main.ts:848·849)도 종료 뒤 '환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다'를 권한다. 하지만 환전 명령은 queue()의 ENDED 검사(main.ts:196)에서 거절된다. 환전 칸의 '원화 급여 가능일 (전 → 후)'도 '90일(캠페인 끝)까지 → 90일(캠페인 끝)까지'가 된다.
- 왜 틀렸나: reportPanel은 종료 상태에서 급여 가능일을 일부러 숨긴다(main.ts:847 `state.phase === 'ENDED' ? ''`). 그런데 TASK-0033이 새로 넣은 막대 두 칸·환전 칸·보고 문장에는 같은 종료 분기가 없다. payrollRunwayDay의 null은 '캠페인 끝까지 낼 수 있음'을 뜻한다(previews.ts:37-39 주석). day > campaignDays에서는 반복이 비어서 미지급이 있어도 null이 되므로, 종료 상태에서는 이 값의 뜻이 성립하지 않는다. 시험은 진행 중 상태와 FAILED만 확인한다(m2a5-trade-ui.test.ts:526-539). 정상 종료와 미지급이 함께 있는 막대는 덮지 않는다. 코드 경로를 추적해 확인했고 실행하지는 않았다.
- 재현: 작업 트리: /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/rv-ui

1. 임시 파일 src/ui/zz-verify-state-SF-1b.test.ts에서 다음을 실행했다.
   - cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0])
   - s = openDay(createGame(cfg), cfg).state
   - 1일 commitDay에 [{ id:'FX1', type:'EXCHANGE_CURRENCY', direction:'USD_TO_KRW', usdAmountMinor: 28*lot }]을 넣고, 이후에는 commitDay(s, cfg, [])와 openDay를 phase === 'ENDED'까지 반복했다.
   - 결과는 day 91, COMPLETED, paymentDefaultStatus.level DANGER였다.
2. operationsTopbar(e, cfg)와 paymentStatusKo(e, cfg)를 출력했다.
3. startUi(cfg) → change scenario → importText(serializeSave(e)) 뒤 app.innerHTML에서 다음을 확인했다.
   - '90일(캠페인 끝)까지'
   - '위험 · 실패까지 0일 · 90일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다'
   - '환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다'
   - '90일(캠페인 끝)까지 → 90일(캠페인 끝)까지'
   - '남은 미지급 KRW: 2,160,000원'
   다섯 문장이 모두 함께 나왔다.
4. 보조로 zz-verify-state-SF-1.test.ts에서 unpaidState를 만들고 short = {...cfg, campaignDays: failAt-1}(=70)로 ENDED까지 진행했다. 같은 문구가 70일 기준으로 나왔다.

실행 명령은 `npx vitest run <파일> --silent=false --reporter=verbose`였고 둘 다 통과했다(기대식 포함). 끝난 뒤 두 임시 파일을 rm -f로 지웠다. 작업 트리에 남은 ?? src/ui/zz-verify-state-SF-2.test.ts는 다른 검증자의 파일이라 건드리지 않았다.

실제 화면 재현 경로: 규칙 2 시나리오 1일에 2,800 USD(28묶음)를 원화로 바꾸고, 이후 아무것도 하지 않은 채 하루 진행을 90일까지 누른다.
- 고칠 방향(제안): UI만 고치고 엔진의 payrollRunwayDay 의미는 바꾸지 않는다. exchangePreview와 시험들이 null을 '끝까지 가능'으로 쓰므로, 종료 분기는 화면 쪽에서 처리한다.

1. src/ui/market.ts:97-98 operationsTopbar(view.phase === 'ENDED'일 때):
   - '원화 급여 가능일' 칸을 빼거나 '캠페인 종료'로 바꾼다. 보고의 main.ts:847이 같은 칸을 숨기는 방식과 맞춘다.
   - '지급 상태'는 outcome에 따라 쓴다. COMPLETED+미지급이면 '종료 · 남은 미지급 {통화별 금액}(결산 참고)', 미지급이 없으면 '종료 · 지급 정상', FAILED이면 '경영 실패'다.
2. src/ui/market.ts:88-94 paymentStatusKo: ENDED·COMPLETED에서는 '실패까지 n일'과 '…끝날 때까지 갚지 못하면' 문구를 만들지 않는다. 1번을 이 함수 안에서 처리해도 된다.
3. src/ui/main.ts:569-570 offerBoard: 종료 상태에서는 exchangeBlock을 붙이지 않는다. 붙인다면 급여 가능일 '전 → 후' 줄과 단추를 빼고 '캠페인이 끝났습니다.'만 남긴다.
4. src/ui/main.ts:848-849: 환전 권유 문장('환전 칸에서 100 USD 단위로…')을 state.phase !== 'ENDED'일 때만 붙인다. 종료 상태에서는 '캠페인이 끝나 더 갚을 수 없습니다. 남은 미지급은 결산에 있습니다.'처럼 결산을 가리킨다.
5. src/ui/m2a5-trade-ui.test.ts '지급·보고·저장' 묶음에 COMPLETED+미지급 반례를 더한다. 1일 28묶음 환전 뒤 빈 진행, 또는 short 설정으로 ENDED까지 진행한 상태를 쓴다. 확인할 것은 다음과 같다.
   - 위쪽 막대·보고·환전 칸에 '실패까지', '캠페인이 끝날 때까지 갚지 못하면', '(캠페인 끝)까지', '환전 칸에서 100 USD'가 없다.
   - 결산의 '남은 미지급'은 그대로 있다.
   - 변형 시험으로 ENDED 분기 제거를 잡는다.

### SF-2 '지급 상태'는 '대기 중인 명령 반영'이라고 안내하지만 회복 환전을 대기열에 넣어도 바뀌지 않는다. 실패 마감일에도 '위험 · 실패까지 0일'이 남는다

- 실패 상황: 규칙 2에서 원화 미지급이 14일째 되는 날(failsAtCloseToday)에 recovery.lotsToSurvive만큼 USD→KRW 환전을 대기열에 넣는다. 막대의 급여 가능일은 view 기준으로 늘어난다. 하지만 '지급 상태'는 계속 '위험 · 실패까지 0일'이다. 대기열 안내도 '위쪽 막대의 급여 가능일·지급 상태는 대기 중인 명령을 반영합니다'라고 적는다. 그래서 학생은 넣은 환전이 모자란다고 읽고 묶음을 더 넣는다(차감 손실). 실제로 하루 진행을 하면 6단계 settleObligations가 늘어난 원화로 밀린 지급을 갚는다. 그 뒤 processPaymentDefault가 돌기 때문에 실패하지 않는다. 반대 방향도 있다. KRW→USD를 넣어 오늘 급여·임차료를 못 내게 되어도 '지급 정상'으로 남는다(급여 가능일 칸만 '없음'이 된다).
- 왜 틀렸나: paymentDefaultStatus의 level·failAtCloseOfDay는 s.obligations(paidDay === null)에서만 나온다. 대기 명령(환전·수락·고용 등)은 계획 사본에서 의무를 갚거나 만들지 않는다. 그래서 view와 state의 값이 늘 같다. R1에서 '두 칸 모두 대기 반영'으로 문구를 정했지만, 이 칸에는 사실이 아닌 안내다. 학생이 이 칸을 가장 많이 볼 순간은 실패 당일 회복 환전을 넣을 때다. 바로 그때 결과가 반영되지 않는다. 코드를 읽어 확인했다. 과다 환전을 하리라는 것은 사용 행동에 대한 추정이다.
- 재현: 1. 시험 파일을 만들고 `npx vitest run src/ui/zz-verify-state-SF-2.test.ts --silent=false`로 실행했다(통과 2/2). 시나리오는 cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0])다.
2. 출발 상태는 s = openDay(runDays(createGame(cfg), cfg, 0, {}).state, cfg).state다.
3. 하루 진행은 next(s) = openDay(commitDay(s,cfg,[]).state,cfg).state로 정의했다. paymentDefaultStatus(s,cfg).level이 'NONE'이 아닐 때까지 반복했다. 이어서 failsAtCloseToday가 true가 될 때까지 다시 반복했다. 결과는 71일, DANGER, lotsToSurvive=1이었다.
4. ui = startUi(cfg)로 띄웠다. 이어서 change({action:'scenario'}, cfg.id)와 importText(serializeSave(s))를 했다. 그다음 change({action:'exchange-amount'}, '1')와 click({action:'exchange'})를 했다.
5. ui.app.innerHTML에 '위험 · 실패까지 0일'이 그대로 있고, '위쪽 막대의 급여 가능일·지급 상태는 대기 중인 명령을 반영합니다'도 있었다(expect 통과).
6. cmd를 {type:'EXCHANGE_CURRENCY', direction:'USD_TO_KRW', usdAmountMinor:1*lot}로 두었다. commitDay(s,cfg,[cmd]).state.operations.outcome은 'IN_PROGRESS'였다. commitDay(s,cfg,[])는 'FAILED'였다(expect 통과).
7. 반대 방향은 1일 상태에서 KRW_TO_USD 76묶음을 planState에 넣었다. paymentStatusKo(view)는 '지급 정상'이었고 payrollRunwayDay(view)는 0이었다. UI에서는 50묶음과 26묶음을 차례로 넣었다. 막대는 '없음'과 '지급 정상'이었다. commitDay 뒤에는 WARNING과 미지급 3건이 생겼다.
8. 끝난 뒤 `rm -f`로 임시 파일을 지웠다.
- 고칠 방향(제안): 아래 둘 중 하나로 고치되, 최소한 (가)는 한다.

(가) 문구 바로잡기(가장 작은 수정)
- market.ts:98에서 '지급 상태' 칸의 title·숨김 설명 '대기 중인 명령 반영'을 '확정 기준(미지급 의무)'으로 바꾼다.
- main.ts:953 대기열 안내문은 '위쪽 막대의 급여 가능일은 대기 중인 명령을 반영합니다. 지급 상태와 다른 금액은 확정 기준입니다.'로 바꾼다.
- 이렇게 하면 사실과 어긋나는 안내는 사라진다. 다만 실패 당일 회복 환전의 효과는 여전히 보이지 않는다.

(나) 대기 반영 예측 덧붙이기
- 실패 당일(paymentDefaultStatus(state).failsAtCloseToday)에는 view에서 다시 계산한 paymentDefaultStatus(view).recovery.lotsToSurvive를 쓴다.
- view는 대기 환전으로 늘어난 KRW 현금을 반영한다. 재현에서 lotsToSurvive는 1에서 0이 될 조건이었다(188,700 ≥ 80,000).
- 0이면 '실패까지 0일 · 대기 중인 환전으로 오늘 마감 지급 가능'을 덧붙이고, 0이 아니면 '오늘 실패를 피하려면 USD {n×100} 더'를 덧붙인다.
- 이 판정이 맞는 근거는 다음과 같다. settleObligations는 obligations를 발생 순서대로 갚는다. 마감 대상 의무가 가장 앞에 있다. KRW 현금은 settle 전에 바뀌지 않는다(processCollections는 USD 수금).
- 반대 방향은 view의 KRW 가용액이 dailyKrwDue(view, day)보다 작을 때 '지급 정상 · 오늘 마감에 원화 ○원 미지급 예상'을 덧붙인다. readers.ts:103-104 경고와 같은 식이다.
- 판정 식은 엔진 읽기 함수(예: readers.ts의 오늘 마감 예상 도우미)로 두는 편이 안전하다. UI가 엔진 순서를 따로 흉내 내지 않게 된다.
- 시험에는 71일 실패 당일에 1묶음을 넣으면 막대 문구가 바뀌는 경우와, 1일 KRW→USD 과다 환전 경우를 넣는다.

### SF-3 경영 실패(FAILED)로 끝난 화면에 견적판·수량 고르기·시세표 '다음 관측'이 살아 있고, 주선 견적은 유효기간이 지난 것까지 나온다

- 실패 상황: 규칙 2에서 아무것도 하지 않으면 71일 마감에 실패한다(명세 M2A5-SPEC 783행: day 72, phase ENDED, 묶음 11개). 71일 묶음 견적은 validUntil 73이고 상태가 OPEN으로 남는다. 그래서 72일 종료 화면에도 '견적판 N건 · 무엇을 맡을지 고르세요'와 직접 무역 카드 2장(수량 select 작동), 주선 카드가 그려진다. 수락 단추는 엔진 거절('캠페인이 끝났습니다(경영 실패).')로 막혀 있다. 시세표는 '다음 관측 78일'을 보이지만, 실패 뒤라 78일 공개는 일어나지 않는다. 실패일 D에 validUntil = D였던 주선 견적은 만료 단계를 건너뛰어 OPEN으로 남는다. 직접 무역 쌍은 openTradePairs가 거르지만, 주선 루프는 거르지 않는다. 그래서 '견적 유효: 71일까지' 카드가 72일 화면에 나온다. 같은 화면에서 환전 단추를 누르면 queue()가 '90일 캠페인이 끝나 새 명령을 넣을 수 없습니다'를 띄운다. 71일 하루 진행 직후 알림도 '90일 캠페인이 끝났습니다. 경영 보고의 90일 결산에서…'다. 실패 원인 대신 기간 만료로 읽힌다.
- 왜 틀렸나: 엔진은 실패하면 견적 만료·공개를 멈추고 남은 견적을 그대로 둔다. 화면은 phase/outcome을 보지 않고 OPEN 견적과 마지막 묶음 기준 관측일을 그대로 그린다. 직접 무역과 주선의 유효기간 처리도 서로 다르다(main.ts:520은 openTradePairs, 546은 OPEN 전체). 잘못된 명령이 실제로 들어가지는 않는다(수락은 막히고 queue는 거절한다). 하지만 기본 실패 경로에서 바로 보이는 화면이 '계속 진행 중'처럼 읽힌다. 실패 전용 화면은 TASK-0034 6절 범위다. 다만 이 발견은 TASK-0033이 만든 칸(견적판·수량·시세표·환전)이 FAILED를 거르지 않는다는 점이다. 코드 경로를 추적해 확인했고 실행하지는 않았다.
- 재현: 1) cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0]).

2) s = openDay(runDays(createGame(cfg), cfg, 0, {}).state, cfg).state에서 시작한다. phase가 'ENDED'가 될 때까지 s = commitDay(s, cfg, []).state를 하고, 끝나지 않았으면 openDay를 한다. 그러면 day 72, outcome FAILED, batches 11이 된다.

3) startUi(cfg) 뒤 change({action:'scenario'}, cfg.id)를 하고 importText(serializeSave(s))로 불러온다. app.innerHTML에서 다음을 확인한다.
- '견적판 <small>8건'
- 'data-action="offer-quantity"'
- '<td>78일</td>'
- '환전을 오늘 할 일에 넣기'
- '<article class="offer forwarding"' 6개
- accept·accept-fwd 단추가 모두 disabled

4) 유효기간 지난 카드: cfg 사본의 startingCash.KRW를 9,200,000으로 바꿔 같은 방식으로 끝까지 돌린다(day 67, FAILED). innerHTML에서 '견적 유효: 66일까지'가 6번 나오고, `<article class="offer">`(직접 무역)는 0개다.

5) 문구: 실패 직전 상태(day 71, AWAITING_INPUT)를 불러와 click({action:'end-day'})를 누른다. 알림이 '90일 캠페인이 끝났습니다…'다. 이어 click({action:'exchange'})를 누르면 알림이 '90일 캠페인이 끝나 새 명령을 넣을 수 없습니다…'다. 오늘 할 일 머리는 '90일 · 캠페인 종료', 결산 제목은 '90일 결산'이다.
- 고칠 방향(제안): UI 쪽에서 고친다. 엔진의 실패 뒤 정지(engine.ts:848)는 의도된 동작으로 보고 그대로 둔다. 바꾸면 P0-M2A5-09의 묶음 수와 상태 기대가 흔들린다.

(1) main.ts:517 offerBoard
- state.phase === 'ENDED'(특히 outcome FAILED)이면 견적판 카드, 수량 select, 환전 칸(exchangeBlock)을 그리지 않는다. 대신 '캠페인이 끝나 견적을 받을 수 없습니다' 한 줄을 둔다.
- 시세표는 남기되 '다음 관측' 칸을 '없음(캠페인 종료)'으로 바꾼다. 다른 방법으로 marketTable 결과의 nextObservationDay를 화면에서 null로 덮어써도 된다. 엔진 읽기 함수는 그대로 둔다.

(2) main.ts:546 주선 루프
- 직접 무역과 같게 `o.publishDay <= view.day && o.validUntilDay >= view.day` 거름을 더한다. 공통 도우미로 묶어도 된다. 그래야 두 경로의 유효기간 처리가 같아진다.

(3) campaignDays 고정 문구 네 곳(196-197, 274-277, 951, 825)
- outcome === 'FAILED'이면 다음처럼 바꾼다.
  - 알림: '{failure.day}일 경영 실패로 캠페인이 끝났습니다. 경영 보고에서 실패 원인과 결산을 확인하세요.'
  - 거절 문구: '경영 실패로 캠페인이 끝나 새 명령을 넣을 수 없습니다'
  - 오늘 할 일 머리: '{failure.day}일 · 경영 실패'
  - 결산 제목: '{failure.day}일 결산(경영 실패)'

(4) 시험
- FAILED 종료 상태에서 '견적판'·'offer-quantity'·'환전을 오늘 할 일에 넣기'·'90일 캠페인이 끝났습니다'가 없음을 확인한다.
- 유효기간 지난 주선 카드가 없음을 확인한다(위 재현의 KRW 9,200,000 사본).
- 정상 종료(COMPLETED)에서는 기존 90일 문구가 유지되는지 반례로 확인한다.

### A11Y-1 환전의 원화 부족 경고가 단추와 알림 문장 어디에도 연결되지 않는다

- 실패 상황: 규칙 2, 시험 '원화 부족 경고…'와 같은 설정이다. KRW 가용액 = 2묶음 환전에 드는 원화 + 오늘 급여·임차료 − 1. 방향을 KRW→USD로, 금액을 2묶음으로 바꾸면 화면에 '환전 뒤 원화 …으로는 오늘 급여·임차료 …을 다 낼 수 없습니다' 경고(<p class="reason">)가 생긴다. 이때 초점은 다시 그린 금액 select에 남고 live region은 그대로다(change 처리는 flash를 바꾸지 않는다). Tab으로 '환전을 오늘 할 일에 넣기'에 가도 단추 이름만 읽힌다(aria-describedby 없음). Enter를 누르면 명령은 APPLIED라 알림이 일반 문장 '오늘 할 일에 넣었습니다…'뿐이다. 막대의 '지급 상태'가 경고나 위험으로 바뀌어도 알리지 않는다. 화면 낭독 사용자는 급여 미지급 위험을 듣지 못한 채 명령을 넣는다.
- 왜 틀렸나: 거절 이유(reasonKo)는 누를 때 warn flash로 알리지만(시험이 announcements로 확인), '허용되지만 위험한' 경고는 시각 전용 문단으로만 남는다. 경고 문단에는 id가 없고 단추와 연결도 없다. 성공 알림 문장은 모든 명령에 같은 고정 문장이라 경고를 덮는다. 같은 화면에서 눈으로 보는 사용자만 위험을 안다.
- 재현: rv-ui 트리에 src/ui/zz-verify-a11y-A11Y-1.test.ts를 만들었다. 실행 명령은 `npx vitest run src/ui/zz-verify-a11y-A11Y-1.test.ts --silent=false --reporter=verbose`이다.

절차:
1. config = structuredClone(cfg)로 설정 사본을 만든다.
2. twoLots = exchangePreview(dayState(1), config, 'KRW_TO_USD', 2*lot).krwMinor를 구한다.
3. config.startingCash.KRW = twoLots + dailyKrwDue(initial, config, 1) − 1로 둔다.
4. state = dayState(1, config)를 만들고 q.allowed가 true, q.warningKo가 null이 아님을 확인한다.
5. startUi(config) → change scenario → importText(serializeSave(state))로 화면을 연다.
6. change exchange-direction 'KRW_TO_USD', exchange-amount '2'를 보낸다.

관찰:
- `<option value="2" selected>`이고 경고 문장이 보인다.
- announcements 길이는 1 → 1이다.
- 환전 단추 마크업 `<button data-action="exchange">`에 aria-describedby가 없다. 경고 `<p class="reason">`에 id가 없다.
- ui.click({action:'exchange'}) 뒤 '환전 KRW→USD'가 대기열에 들어가고, announcements.at(-1)은 '오늘 할 일에 넣었습니다. ‘하루 진행’을 누르면 실행됩니다. 그 전에는 시간이 흐르지 않습니다.'이다. announcements.some(a ⇒ a.includes(warningKo))는 false다.
- 막대: 지급 상태는 '지급 정상' 그대로이고, 급여 가능일은 '없음'이 된다.
- ui.click({action:'end-day'}) 뒤 지급 상태는 '경고 · 실패까지 13일'이 되지만 새 알림이 없다(at(-1)이 그대로다).
- 고칠 방향(제안): 1. 경고를 단추에 연결한다(market.ts:85).
   - 경고 문단에 `id="exchange-warning"`, 거절 문단에 `id="exchange-reason"`을 단다.
   - 환전 단추에 `aria-describedby`를 단다. 값은 있는 쪽 id 목록이다. 둘 다 없으면 속성을 넣지 않는다.
   - 막대 칸(market.ts:98)이 이미 같은 방식을 쓴다.

2. 대기 성공 알림에 경고를 담는다(main.ts:198-204).
   - queue()에서 cmd.type === 'EXCHANGE_CURRENCY'이면 tryCommand 전에 exchangePreview(view, config, cmd.direction, cmd.usdAmountMinor).warningKo를 읽는다.
   - 값이 있으면 APPLIED여도 flash를 `{ kind: 'warn', text: `${warningKo} 오늘 할 일에 넣었습니다. …` }`로 한다.
   - 이렇게 하면 화면의 토스트와 live region이 함께 경고를 전한다.

3. change에서도 경고를 알린다(main.ts:1424-1427, 선택).
   - render() 뒤 경고 문장이 이전과 달라졌을 때만 알린다. 지도 상세 알림(main.ts:1053)처럼 `liveStatus.textContent = liveRegionText(…, warningKo)`로 짧게 알린다.
   - flash는 바꾸지 않는다. 바꾸면 토스트가 생기고 초점 보존이 흔들린다.

4. 하루 진행 뒤 지급 단계 변화를 알린다.
   - paymentDefaultStatus가 NONE에서 WARNING·DANGER로 바뀌면 endDay(main.ts:270-272)의 flash나 알림에 단계 문장을 넣는다.
   - 이것은 TASK-0034 §5 '지급 경고·위험 알림'의 몫이다.

5. 시험을 보강한다.
   - m2a5-trade-ui.test.ts의 '원화 부족 경고' 시험을 loadedUi 경로로 넓힌다.
   - change 뒤 단추의 aria-describedby가 가리키는 id의 글이 warningKo인지 확인한다.
   - click 뒤 announcements.at(-1)에 warningKo가 들어 있는지 확인한다.
   - 반례: 1묶음(경고 없음)에서는 aria-describedby와 경고 알림이 없어야 한다.

### A11Y-2 수량 select를 바꿔 수락이 막혀도(disabled) 알림이 없고 이유 문장도 연결되지 않는다

- 실패 상황: 결과 보고 147행의 15일 묶음 2 상태에서, 화장품 카드의 수량 select를 50상자에서 100상자로 바꾼다. quotePreview가 allowed=false를 돌려주고, quoteBlock(main.ts:446)이 '견적만 수락'을 disabled로 바꾸고 planner를 빼고 자금 부족 이유를 <p class="reason">으로 붙인다. 초점은 다시 그린 select로 돌아가고 알림은 없다. 다음 Tab은 '현금 일정 미리 보기' summary로 가고, disabled 단추는 건너뛰어 다음 카드로 넘어간다. 폼·초점 모드의 화면 낭독 사용자는 수락 단추가 막힌 것도, '한 번에 확정' 묶음이 사라진 것도, 이유도 듣지 못한다. 같은 변경으로 생기는 '…이 견적을 받으면 출항을 놓칩니다' 문장도 알리지 않는다.
- 왜 틀렸나: disabled 단추는 초점 순서에서 빠진다. 이유 문단에는 id도 aria-describedby도 없어 단추와 연결되지 않는다. 기존 견적에도 같은 마크업이 있었지만, 이번 단계부터는 사용자의 select 조작이 이 상태를 켜고 끈다. 그런데 그 결과를 알려 주는 경로(flash·live region·aria-describedby)가 없다. 지시서의 검토 항목인 '비활성 수락 단추의 이유 전달'이 충족되지 않는다.
- 재현: 1. 임시 파일 `src/ui/zz-verify-a11y-A11Y-2.test.ts`를 만들었다.
   - `startUi(cfg)` → `change({action:'scenario'}, cfg.id)` → `importText(serializeSave(dayState(14)))` → `click({action:'exchange'})` → `click({action:'end-day'})` 순서로 15일, 묶음 2 상태를 만든다. `cfg`는 `OPERATIONS_SCENARIO_IDS[0]`이다.
   - 렌더된 offer-quantity select를 모두 찾는다. 결과는 화장품 50/100 하나다.
   - `ui.doc.activeElement`를 그 select로 두고, `announcements.length`를 기록한 뒤 `change({action:'offer-quantity', key}, '100')`을 한다.
2. 단언한 것은 모두 통과했다.
   - announcements 길이가 그대로(2→2)다.
   - `rendered({action:'accept',…}).disabled === true`다.
   - 카드에 `<p class="reason">`가 있다.
   - 카드에 'aria-describedby'가 없고, reason에 id가 없다.
   - activeElement.dataset.action은 'offer-quantity'다.
   - planner 안내가 사라졌다.
3. 실행 명령: `cd /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/rv-ui && npx vitest run src/ui/zz-verify-a11y-A11Y-2.test.ts --silent=false` → 1 passed.
4. 실행 뒤 `rm -f`로 지웠다. 다른 에이전트의 `zz-verify-a11y-A11Y-3*.test.ts`에는 손대지 않았다.
- 고칠 방향(제안): 규칙 1 화면 불변 시험(`m2a5-trade-ui.test.ts`의 BASELINE)을 깨지 않도록 규칙 2(`config.operations`)에서만 고친다. 둘 중 하나, 또는 둘 다 쓴다.

가. 연결 방식(권장):
- `quoteBlock`에서 `config.operations`일 때만 이유 문단에 `id="quote-reason-${key}"`를 단다(`main.ts:470`).
- `quantityControl`의 select와 수락 단추에 `aria-describedby`로 그 id를 건다(`market.ts:37`). 이유가 없을 때는 속성을 생략한다.
- 다시 그린 뒤 초점이 새 select로 가므로, 낭독기가 select 설명으로 이유를 읽게 된다. 이 부분은 추측이며 Chromium+NVDA로 확인해야 한다.
- 단추를 Tab에 남기려면 규칙 2에서만 `disabled` 대신 `aria-disabled="true"`를 쓰고, click 처리(`case 'accept'`)에서 막는다. 이렇게 하면 시험의 `.disabled` 판정과 초점 복원(`main.ts:1153`의 `target.disabled` 검사)도 함께 바꿔야 한다.

나. 알림 방식:
- `offer-quantity` 변경 처리(`main.ts:1417-1422`)에서 `render()` 뒤에 수락 가능 여부가 바뀌었으면 live-status에 알린다. 문구는 '수량 {qtyKo}: 수락할 수 없습니다 — {reasonKo}' 또는 '수량 {qtyKo}: 수락할 수 있습니다'이고, `liveRegionText`를 재사용한다. live-status는 `app.innerHTML` 밖이라 규칙 1 문자열이 바뀌지 않는다.

시험:
- 위 15일 재현 상태에서 수량을 바꾼 뒤 announcements에 reasonKo가 들어가는지 단언한다.
- select의 aria-describedby가 reason id를 가리키는지 단언한다.
- 반례: 50으로 되돌리면 reason 연결이 없다.

규칙 1 planner select(`main.ts:508-510`)의 같은 유형은 이번 범위에서 빼고 따로 기록한다. 고치려면 규칙 1 불변 기준을 갱신해야 하기 때문이다.

### A11Y-3 환전 단추를 누르면 새로 생긴 알림 띠가 단추를 가려 초점이 '하루 진행 ▶'으로 옮겨진다

- 실패 상황: 하루가 시작되면 endDay가 flash를 null로 두므로 알림 띠가 없다(main.ts:269-271). 이때 환전 단추가 화면 아래 끝(띠 높이 약 40~50px 안)에 있는 상태에서 Enter를 누른다. queue()가 info flash를 세워 .flash-toast가 생기고, render 초점 복원이 같은 환전 단추를 찾는다. 그런데 단추 중심이 띠 윗변보다 아래라 focusWithoutScroll이 대상을 '하루 진행 ▶'(AWAITING_INPUT이라 활성)으로 바꾼다. 한 묶음 더 넣으려는 키보드 사용자가 0.5초 뒤 Enter를 다시 누르면 endDay()가 실행되어 하루가 되돌릴 수 없이 확정된다.
- 왜 틀렸나: 단추는 방금까지 보이던 자리에 그대로 있고, 가린 것은 이 동작이 만든 띠다. anchor가 null이라 띠 위로 올리는 스크롤 보정도 없다. 같은 규칙이 다른 대기 단추에도 적용되는 기존 동작이지만, 환전 단추는 넣은 뒤에도 단추로 남아 반복해 누르는 조작이다. 그래서 되돌릴 수 없는 명령으로 초점이 옮겨 가는 위험이 크다. 브라우저가 Tab 초점을 화면 가장자리에 맞추면(예: Firefox) 자연스럽게 생기는 배치다. 휠로 단추를 아래 끝에 둔 뒤 누르면 Chromium에서도 생긴다.
- 재현: src/ui/main-testkit.ts의 startUi(cfg)를 쓴다. cfg는 loadScenario(OPERATIONS_SCENARIO_IDS[0])이다. 순서는 다음과 같다.
1. change scenario를 보낸다.
2. importText(serializeSave(openDay(runDays(createGame(cfg), cfg, generatedDay-1, {}).state, cfg).state))로 저장을 가져온다.
3. click end-day로 불러오기 띠를 지운다. 이때 innerHTML에 'class="flash-toast'가 없어야 한다.
4. win.innerHeight=600, bounds['exchange:']={top:560,bottom:596,height:36}, setToastTop(556)으로 둔다.
5. rendered({action:'exchange'}).focus() 뒤 click({action:'exchange'})를 보낸다.
6. 확인한다: flash-toast info가 생기고, scrollBy는 호출되지 않으며, doc.activeElement.dataset.action === 'end-day'다.
7. click({action:'end-day'})를 보낸다(501ms 경과). 날짜가 +1 된다. 대조로 setToastTop(700)이면 activeElement는 'exchange'로 남는다.
실행: `npx vitest run <임시 파일>`, 3 passed. 실제 브라우저에서는 1일 아침처럼 띠가 없을 때 휠로 환전 단추를 창 맨 아래에 붙이고 Enter를 누르면 같은 상황이 된다(미측정).
- 고칠 방향(제안): 고치는 곳: src/ui/main.ts:101-112(focusWithoutScroll), 192-206(queue anchor), 1108-1112(render 스크롤 보정).
방안 1(권장): 칸 자리가 없는 단추(환전, 이후 창고 확장·선복 계약 같은 투자 단추)도 queue()에서 누른 단추 자체의 rect를 anchor로 적는다. render 뒤 같은 단추의 bottom이 '띠 top − 8px'보다 아래면 그 차이만큼 window.scrollBy로 올리고 초점은 단추에 그대로 둔다. revealBelow의 72px 예약과 같은 방식이다.
방안 2: focusWithoutScroll에서 대상이 '방금 누른 바로 그 요소'이고 아래쪽 띠에만 가려졌다면(center ≤ innerHeight), end-day로 바꾸지 말고 띠 위로 스크롤한 뒤 그 요소에 초점을 둔다. 대안 제목·표시로 넘어가는 기존 경로의 end-day 규칙(main.test.ts:713-723)은 그대로 둔다.
보조: 되돌릴 수 없는 명령(end-day)을 자동 초점 대상으로 쓰지 말고 status-h나 queue-h를 쓰는 것도 검토한다. 띠는 가로 폭이 max-width 48rem이므로 가로 겹침도 판정에 넣는다.
회귀 시험: 위 재현을 그대로 넣고 'activeElement가 exchange로 남고 scrollBy(0, ≥40)가 호출된다'를 확인한다.

### A11Y-4 환전 금액이 대기 반영으로 자동 축소되는 것이 알려지지 않고, 다시 누르면 다른 금액이 들어간다

- 실패 상황: USD 가용액이 1,000 USD(10묶음)이다. 금액을 8묶음(800 USD)으로 고르고 환전 단추를 누르면 대기 반영 view의 가용액이 200 USD가 된다. render 1081행이 ui.exchangeLots를 2로 줄이고, 초점은 다시 그린 환전 단추로 돌아온다. 알림은 일반 문장뿐이다. 같은 금액을 한 번 더 넣으려고 Enter를 누르면 200.00 USD 환전이 대기열에 들어가고, 알림은 같은 문장에 nbsp만 붙어 다시 읽힌다. 화면 낭독 사용자는 금액이 바뀐 것을 모른다.
- 왜 틀렸나: 금액 보정은 select 값만 바꾸는 시각 변화다. 단추 이름('환전을 오늘 할 일에 넣기')과 알림 문장에는 방향·금액이 없다. 그래서 초점을 단추에 둔 채 반복하는 사용자는 실제로 넣은 금액을 확인할 수 없다. 대기열 패널로 가야만 알 수 있다.
- 재현: 1) 운영 시나리오 설정을 복제하고, startingCash.USD에 (10×lot − 현재 usdAvailableBefore)를 더해 가용 USD를 10묶음으로 맞춘다.
2) startUi(rich) 다음 change scenario, importText(serializeSave(1일 상태)) 순서로 연다.
3) vi.spyOn(engine,'planCommands')를 건다.
4) change {action:'exchange-amount'} '8'을 넣는다. select 선택값은 8이다.
5) click {action:'exchange'}를 누른다. select 선택값이 2가 되고, activeElement는 다시 그린 exchange 단추다. 알림은 일반 문장이다.
6) click {action:'exchange'}를 한 번 더 누른다. 마지막 planCommands 호출의 EXCHANGE_CURRENCY 금액이 [80000, 20000]이 되고, 대기열 HTML에 '환전 USD→KRW 200.00 USD'가 생긴다. 두 번째 알림은 첫 알림에 ' '만 붙은 글이다.
실행: `npx vitest run src/ui/zz-verify-a11y-A11Y-4.test.ts --silent=false`. 통과했고 임시 파일은 지웠다.
- 고칠 방향(제안): 다음 세 가지를 조합한다. 모두 UI 문구만 바꾸며 엔진은 바꾸지 않는다.
(1) main.ts queue()의 성공 분기(203행)에서 cmd.type==='EXCHANGE_CURRENCY'이면 방향·금액을 넣은 문장을 쓴다. 예: '환전 USD→KRW 800.00 USD를 오늘 할 일에 넣었습니다. …'. 이렇게 하면 반복해 눌러도 매번 다른 금액이 읽힌다. nbsp 재알림에 기대지 않아도 된다.
(2) render 1081행의 보정 전후 ui.exchangeLots를 비교한다. 줄었으면 같은 flash에 한 문장을 덧붙인다. 예: '남은 USD에 맞춰 다음 환전 금액을 200.00 USD(2묶음)로 줄였습니다.' 보정은 queue 뒤뿐 아니라 방향 변경이나 다른 명령(견적 수락)이 USD를 쓸 때도 일어나므로 render에서 공통으로 처리한다. 다만 flash를 render 안에서 바꾸면 announcedFlash 비교(1114-1117)와 순서를 맞춰야 한다. 보정 사실을 별도 필드로 계산해 queue와 change 처리기에서 문장에 붙이는 편이 더 안전하다.
(3) market.ts:85 단추 이름에 금액·방향을 넣는다. 예: 'USD→KRW 200.00 USD 환전을 오늘 할 일에 넣기'. 아니면 aria-describedby로 '내는 금액' dd를 연결한다.
회귀 시험: 위 재현 순서에서 두 알림이 서로 다른 금액을 담는지, 보정 문장이 나오는지 확인한다.

### A11Y-5 시세표 스크롤 칸에 초점이 있을 때 한 열 전환이 일어나면 초점이 사라진다

- 실패 상황: 키보드로 초점을 받는 스크롤 칸이 있는 Chromium에서 창 폭을 1010px로 둔다. 세 열 배치라 본문 칸이 좁아 시세표(min-width 42rem)가 넘치고, 스크롤 칸이 Tab 대상이 된다. Tab으로 칸에 초점을 두고 방향키로 가로로 넘긴 뒤 Ctrl+'+'(110%)를 누르면 (max-width:1000px)가 바뀌어 onColumnChange가 render(true)를 부른다. was=div.table-scroll이고 key.id·key.data.action이 모두 비어 979행에서 return한다. 옛 칸은 innerHTML 교체로 사라져 초점이 body로 떨어진다. 가로 스크롤 위치도 0으로 돌아간다. 태블릿 회전(1133↔744px)에서도 같다.
- 왜 틀렸나: 이번에 새로 생긴 초점 가능 칸이 render의 data-action 복원에도, onColumnChange의 id 복원에도 걸리지 않는다. 화면 낭독기와 키보드 사용자는 읽던 위치를 잃고 다음 Tab이 문서 앞쪽부터 다시 시작한다.
- 재현: 1) 검수 트리에 src/ui/zz-verify-a11y-A11Y-5.test.ts를 만든다. 내용은 다음과 같다.
- startUi(cfg) 뒤 `change({action:'scenario'}, cfg.id)`를 부르고, 생성 견적 공개일(firstDay+intervalDays) 상태를 importText로 가져온다.
- `ui.doc.activeElement = { id:'', tagName:'DIV', dataset:{}, closest:()=>null }`로 둔다. 실제 브라우저의 div.table-scroll과 같은 id·dataset이다.
- `ui.focus.mockClear()` 뒤 `ui.afterRender(()=>rerendered=true)`를 걸고 `ui.setOneColumn(true)`를 부른다.
- 기대: rerendered === true, `ui.focus` 호출 0회, focusIds []. 반대 방향 `setOneColumn(false)`에서도 0회다.
- 대조: activeElement가 `rendered({action:'exchange-direction'})`이면 focus가 1회 불린다. `{id:'market-h'}`이면 focusIds가 ['market-h']다.
2) 실행 명령은 `npx vitest run src/ui/zz-verify-a11y-A11Y-5.test.ts --silent=false`이고 2 passed다. 끝난 뒤 `rm -f`로 지웠다.
3) 브라우저에서 재현하는 방법(미실행): Chromium 130 이상에서 규칙 2 시나리오를 열고 창 폭을 1010px로 둔다. Tab으로 시세표 칸에 초점을 두고 → 키로 넘긴 뒤 Ctrl+'+'로 110%로 확대한다. document.activeElement가 body가 되고 칸의 scrollLeft가 0이 된다.
- 고칠 방향(제안): - src/ui/market.ts:19의 `div.table-scroll`에 고정 id(예: `id="market-scroll"`)를 준다. 그러면 main.ts:979~982의 `document.getElementById(key.id)` 경로가 그대로 초점을 되돌린다. 시험에서 id 경로가 동작함을 확인했다. 시세표는 한 화면에 하나뿐이라 id가 겹칠 일이 없다.
- 같이 하면 좋은 것: 1) Chromium에만 기대지 않도록 `tabindex="0"`을 명시한다. Safari는 스크롤 칸을 자동으로 초점 대상에 넣지 않는다. 다만 넘침이 없는 폭에서도 Tab에 들어가는 차이가 생기니 함께 판단한다. 2) render 앞에서 `.table-scroll`의 scrollLeft를 읽어 두었다가 다시 그린 뒤 되돌린다. 지도 틀(main.ts:1085-1087)과 같은 방식이고, 열 전환 말고 다른 다시 그리기에서 위치가 0으로 가는 것도 막는다.
- 시험: layout.test.ts의 '폭이 바뀌어 다시 그려도 초점은 같은 조작에 남고' 사례 옆에 하나를 더한다. activeElement를 `{id:'market-scroll'}`로 두고 setOneColumn을 부른 뒤 focusIds가 ['market-scroll']이고 preventScroll:true인지 확인한다.

### A11Y-6 (기각)

여러 견적 카드의 수량 select 이름이 모두 '수량 고르기'라 어느 견적인지 구분할 수 없다

- 반박 근거: [확인] 이름이 겹친다는 사실 자체는 맞다. src/ui/market.ts:33이 `<label>수량 고르기 <select data-action="offer-quantity" data-key=…>`를 그대로 내고, select에는 aria-label·aria-labelledby·id가 없다. article은 `<article class="offer">`(src/ui/main.ts:540)로 이름이 없다. 임시 시험에서 8일(generatedDay) 화면에 select가 2개였고, 둘 다 label 글자가 '수량 고르기'였다.

[확인] 그러나 주장한 피해, 곧 '어느 견적인지 구분할 수 없다'는 재현되지 않는다.
1) 화면 낭독기는 접힌 select의 이름 뒤에 현재 값도 읽는다. 그 값은 옵션 글 `qtyKo(config, goodId, n)`(market.ts:31)이다. qtyKo는 `${good.nameKo} ${quantity}${unit}`(src/ui/reports.ts:38-41)라서 상품 이름이 늘 들어간다. 실제 렌더 값은 8일 카드 둘이 '의류 100개|의류 200개'와 '화장품 50상자|화장품 100상자|화장품 150상자'였다. 따라서 

### GAP-1 규칙 2 일정의 늦은 인도 '수금' 예상이 하루 비례 감액 대신 정액 50 USD를 한 번만 뺀다. 이 줄을 지키는 시험은 FLAT_ONCE 시나리오에만 있다

- 실패 상황: 규칙 2 설정은 PER_LATE_DAY_CAPPED, 하루 50 USD, 상한 10000bp다. m2a5 시험 260행과 같은 상태(customsDays=1 사본, 첫 출항 뒤의 늦은 견적)에서 직원과 다음 편을 정해 수락하면, 엔진이 실제로 매기는 감액은 350 USD(7일)다. 그런데 일정의 `RCV:{계약}` 항목은 '수금 +(판매대금 − 50 USD)'로 보여 300 USD가 어긋난다. 감액이 상한(100%)에 닿는 늦은 주선 계약도 있다. 엔진은 netSale이 0이라 청구서를 만들지 않는데(engine.ts:1040·1047), 일정은 '서비스 대금 − 50'의 양수 수금을 '예상'으로 보인다.
- 왜 틀렸나: schedule.ts:67은 `c.saleAmountMinor - (delivery > deadline ? config.terms.lateDeliveryPriceReductionMinor : 0)`로 정액을 한 번만 뺀다. 같은 값을 엔진(engine.ts:1038-1039), 견적 현금 일정(reports.ts:103), 계약 진행(progress.ts:52)은 모두 `lateDeliveryReduction(config, sale, lateDays)`로 계산한다. 기존 schedule.test.ts:131-137은 SCENARIO_M2_MULTI_TRADE(FLAT_ONCE)에서만 receipt==invoice를 보고, `priceReductionMinor === lateDeliveryPriceReductionMinor`를 단언하므로 정액 방식에서만 성립한다. m2a5 시험은 견적 카드의 감액 문장(market.ts:46)만 엔진 실제 감액과 대조하고, 일정 수금 금액은 규칙 2에서 한 번도 확인하지 않는다. 이 줄은 이번 diff에서 바뀌지 않았지만, TASK-0033이 규칙 2를 화면에 열면서 드러났다. 코드를 읽어 확인했고 실행하지는 않았다.
- 재현: rv-ui 트리에 src/ui/zz-verify-tests-GAP-1.test.ts를 만들고 `npx vitest run <파일> --silent=false`로 실행했다.
(1) `cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0])`, `config = structuredClone(cfg); config.terms.customsDays = 1`로 둔다. `dayState(route.firstDepartureDay + 1, config)`에서 첫 교역 쌍을 다음 편·본사 직원으로 ACCEPT_TRADE한다. 그 뒤 `scheduleItems(planState(late, config, [command]).state, config, config.campaignDays).find(i => i.key === 'RCV:CT001').money.amountMinor`는 135000이고, `runDays(late, config, config.campaignDays, {[late.day]:[command]})`의 `sale - priceReductionMinor`(=청구서)는 105000이다. 같은 조작을 customsDays 기본값 0으로 해도 135000 대 110000이다.
(2) 주선 제안의 `deliveryDeadlineDay = 첫 출항 + 운송일 − (ceil(fee/5000)+1)`로 두고 첫 편으로 ACCEPT_FORWARDING한다. 엔진은 감액 38000(전액)을 매기고 청구서 0건, COMPLETED로 끝내지만, 일정 `RCV:CT001`은 +33000 ‘예상’이다.
두 경우 모두 `scheduleBlock(..., {open:true})` HTML에 해당 `+금액` 문자열이 나오는 것을 확인했다. 실행 뒤 `rm -f`로 지웠다.
- 고칠 방향(제안): src/ui/schedule.ts:66-67에서 `lateDeliveryReduction`(engine/operations.ts:133)을 import해 엔진과 같은 식으로 계산한다.
```ts
const net = delivery === null ? 0 : c.saleAmountMinor - lateDeliveryReduction(config, c.saleAmountMinor, Math.max(0, delivery - c.deliveryDeadlineDay));
if (delivery !== null && net > 0) add(`RCV:${c.id}`, 'RECEIPT', Math.max(c.paymentDueDay, delivery), c.id, '수금', true, { currency: c.currency, amountMinor: net });
```
net이 0이면 엔진이 청구서를 만들지 않으므로(engine.ts:1047·1080) 수금 항목을 내지 않는다. 필요하면 금액 없이 ‘전액 감액 — 받을 대금 없음’ 같은 예상 항목을 따로 둔다. 화면에서 계산하는 대신 reports.ts:103처럼 엔진 읽기 함수가 순수금을 돌려주게 하면 중복 계산이 사라진다.
시험은 두 개를 더한다. ① 규칙 2(PER_LATE_DAY_CAPPED)에서 늦은 계약의 일정 RCV 금액과 runDays 청구서 금액이 같은지 본다(m2a5 260행 상황을 재사용하고, customsDays 0·1 둘 다). ② 상한에 닿는 늦은 주선에서 RCV 항목이 없거나 금액 표시가 없는지 본다. schedule.test.ts:137은 FLAT_ONCE에만 맞으므로 방식 이름을 시험 제목에 드러낸다.

### GAP-2 규칙 2 경영 보고가 선복 계약 요금 예약을 '체결한 계약이 낼 운임·관세'로 설명한다. 바로 그 상태를 만드는 시험은 자금 표만 본다

- 실패 상황: 규칙 2 1일에 SIGN_SPACE_CONTRACT만 하고 다음 날로 넘긴다(500행 시험 상태). 자금 표는 '체결 계약의 남은 지출 예약 −0.00 USD'와 '선복 계약 요금 예약 −X'로 나뉘어 있다. 그런데 경영 보고는 '사용 가능 자금(…)은 현금보다 X 적습니다. 체결한 계약이 낼 운임·관세를 미리 묶어 두었기 때문입니다.'라고 한다. 계약도 운임·관세 예약도 없는데 원인을 운임·관세로 잘못 말하고, 같은 화면의 표와도 어긋난다.
- 왜 틀렸나: fundsPosition의 reserved에는 reservedCommitments(선복 요금)가 들어 있다(reservations.ts:64). TASK-0033은 자금 표에서 이 값을 따로 떼었지만(main.ts:745), 같은 값을 설명하는 보고 문장(main.ts:845)은 `f.reserved` 전체를 운임·관세로 설명한다. 500행 시험은 정확히 '선복 요금만 예약된' 상태를 만들면서도 표의 두 행과 '선복 계약 요금은 위 표에 별도로 예약했습니다' 문장만 단언하고, 보고 문장은 보지 않는다. 코드를 읽어 확인했다.
- 재현: 임시 시험(src/ui/zz-verify-tests-GAP-2.test.ts)을 만들어 `npx vitest run src/ui/zz-verify-tests-GAP-2.test.ts --silent=false --reporter=verbose`로 실행했고, 두 시험 모두 통과했다. 절차는 다음과 같다.

1) 상태를 만든다. `cfg = loadScenario(OPERATIONS_SCENARIO_IDS[0])`, `state = openDay(runDays(createGame(cfg), cfg, rent.firstDueDay-1, {}).state, cfg).state`, `signed = planState(state, cfg, [{id:'SPACE', type:'SIGN_SPACE_CONTRACT', routeId: cfg.operations.spaceContract.routeIds[0]}])`, `view = openDay(runDays(signed.state, cfg, state.day).state, cfg).state`. 500행 시험과 같은 방법이다.
2) 자금 값을 단언한다. `fundsPosition(view,cfg,'USD')`에서 `reserved - reservedCommitments === 0`이고 `reservedCommitments === 3000`이다.
3) 화면을 띄운다. `startUi(cfg)` → `change({action:'scenario'}, cfg.id)` → `importText(serializeSave(view))`.
4) `ui.app.innerHTML`에 '체결한 계약이 낼 운임·관세를 미리 묶어 두었기 때문입니다.'가 들어 있다. 같은 HTML에 '체결 계약의 남은 지출 예약 −0.00 USD'와 '선복 계약 요금 예약 −30.00 USD'도 함께 있다.

1일에 commitDay([SIGN_SPACE_CONTRACT])만 하고 2일을 여는 경로로도 같은 결과가 나왔다.
- 고칠 방향(제안): main.ts:845의 보고 문장을 표(745행)와 같은 기준으로 나눈다.

- 운임·관세 몫(`contractRes = f.reserved - f.reservedCommitments`)과 선복 몫(`f.reservedCommitments`)을 따로 계산한다.
- 이유 문장은 0보다 큰 몫만 이어 붙인다. 예: '체결한 계약이 낼 운임·관세 X'와 '선복 장기 계약의 다가오는 출항 요금 Y'를 미리 묶어 두었기 때문입니다.
- 미지급이 있으면 '미지급 Z'도 원인에 넣는다. 지금 문장은 차액에 unpaidObligations까지 더하면서 설명은 예약만 한다(이 부분은 주장 범위 밖 관찰이다).
- 규칙 1(config.operations 없음)에서는 reservedCommitments가 0이므로 기존 문장이 그대로 나와야 한다. 규칙 1 BASELINE이 바뀌지 않는지 확인한다.

시험도 고친다.
- m2a5-trade-ui.test.ts:500 시험에 단언을 더한다. 보고에 '운임·관세를 미리 묶어'가 없어야 하고, 선복 요금 설명과 30.00 USD가 있어야 한다.
- 계약 예약과 선복 예약이 함께 있는 상태의 시험도 하나 두어 두 몫이 모두 나오는지 본다.

### GAP-3 수량 선택지·변경 검사가 '최소 수량 = quantityStep'이고 '매수·매도 maxQuantity가 같은' 자료에서만 엔진 규칙과 일치한다

- 실패 상황: 견적의 quantity가 quantityStep의 배수가 아니면 화면과 엔진이 갈린다(예: quantity 150, step 100, max 450). 화면 선택지는 150·250·350·450이고 변경 처리(main.ts:1422의 `(quantity - buy.quantity) % step`)도 이를 받는다. 그러나 엔진은 `quantity % quantityStep !== 0`으로 모두 거절해(engine.ts:304) 카드의 모든 선택지가 거절 문장만 보인다. 매수 maxQuantity와 매도 maxQuantity가 다른 경우의 min 처리도 시험에 없다.
- 왜 틀렸나: 지금 생성기는 quantity = quantityStep = baseLot이고, 매수·매도 maxQuantity를 상품별 같은 묶음 수로 만든다(market.ts:63-64). 고정 견적도 scenario.ts:157에서 max=step=quantity다. 그래서 화면의 기준(buy.quantity부터 셈)과 엔진의 기준(0부터 step 배수, 최소 step)이 우연히 같다. 시험은 `buy.quantity + buy.quantityStep` 한 단계만 써서 이 차이를 드러낼 수 없다. 현재 자료로는 결함이 없다.
- 재현: 1. rv-ui 트리에 임시 파일 src/ui/zz-verify-tests-GAP-3.test.ts를 만든다.
2. 상태를 준비한다. cfg=loadScenario(OPERATIONS_SCENARIO_IDS[0]), generatedDay=publish.firstDay+intervalDays(8일), s=openDay(runDays(createGame(cfg),cfg,generatedDay-1,{}).state,cfg).state를 structuredClone한다.
3. openTradePairs 가운데 min(max)≥3×step이고 quotePreview(step).allowed인 쌍(COSMETICS)을 고른다. 그 쌍의 매수 offer.quantity를 step+step/2(=75)로 바꾼다.
4. 화면 선택지를 확인한다. quantityControl('k', quotePreview(s,cfg,pair,75), cfg, goodId, 75)의 option 값은 [75,125]다. 각 값의 quotePreview(...).allowed는 둘 다 false이고, quotePreview(...,50).allowed는 true다.
5. 저장 가져오기와 화면을 확인한다.
   - deserializeSave(serializeSave(s), {config, dataVersion, rulesVersion})가 예외 없이 통과한다.
   - startUi(cfg) → change scenario → importText 뒤 카드에 선택지 [75,125]와 `<p class="reason">수량은 50상자 단위로 50 ~ 150상자까지…`가 보인다.
   - change offer-quantity 125는 받아진다. 100은 무시돼 선택이 125로 남는다.
6. 매도 max만 바꾼 경우를 확인한다. 같은 쌍에서 sell.maxQuantity=2×step으로 바꾸면 q.maxQuantity=100이고 선택지는 [50,100]이다. 엔진은 150을 거절하고, 화면 change(150)도 무시한다. 이 경우는 일치한다.
7. 추가로 quantityStep=0 저장을 확인한다. deserializeSave를 통과하고, quantityControl은 25초 timeout까지 끝나지 않았다.
8. 실행은 `npx vitest run src/ui/zz-verify-tests-GAP-3.test.ts --reporter=verbose`로 했다. 첫 세 시험은 통과했다. 끝난 뒤 `rm -f`로 지웠다. 다른 검수자의 untracked 파일 zz-verify-a11y-A11Y-3.test.ts는 건드리지 않았다.
- 고칠 방향(제안): 주 수정은 가져오기 불변식이다. 고칠 곳은 src/engine/operations-invariants.ts의 operationsProblems 한 곳이다.
- 대상: `o.offers`와 `config.offers` 가운데 kind가 'forwarding'이 아닌 견적. 필요하면 운송 주선 견적에도 같은 규칙을 둔다.
- 검사 조건:
  - `quantityStep > 0`
  - `quantity >= quantityStep`
  - `quantity % quantityStep === 0`
  - `maxQuantity >= quantity`
  - `maxQuantity % quantityStep === 0`
- 하나라도 어기면 ‘생성 견적의 수량·단위·최대 수량이 맞지 않습니다’ 같은 문제 문장을 하나 더한다. 그러면 deserializeSave → InvariantError → SaveError 경로로 거부된다.
- 이 수정으로 막히는 것: 화면과 엔진의 기준 불일치, 카드 기본 수량(main.ts:525·1311의 `?? buy.quantity`) 자체가 엔진에 거절되는 문제, step 0이나 음수 step에서 market.ts:29가 끝없이 도는 문제.
- 정상 생성 견적은 늘 통과하므로 결정성과 출력은 바뀌지 않는다.

부 수정(선택)은 화면 기준을 엔진에 맞추는 것이다.
- quantityControl의 시작값을 `q.quantityStep`으로 한다.
- main.ts:1422의 검사를 `quantity >= buy.quantityStep && quantity % buy.quantityStep === 0`으로 바꾼다.
- 또는 엔진 쪽에 `allowedTradeQuantities(buy, sell)` 같은 공용 읽기 함수를 두고 화면, 엔진 검사, sim/operations-policy.ts:115가 같이 쓴다.
- 시험에 다음 두 경우를 더한다.
  - 매수 max와 매도 max가 다를 때 선택지 상한이 min인지.
  - 기본 수량이 step보다 클 때 선택지가 엔진 허용 집합의 부분집합인지.

### GAP-4 캠페인 뒤 도착 경고가 통관 일수를 빼먹는다. 경계 반례 시험은 규칙 2의 customsDays가 0이라서만 맞는다

- 실패 상황: customsDays=1 설정 사본에서 다음 편 도착일이 campaignDays와 같은 견적이 있다고 하자. 엔진은 반출일을 campaignDays+1로 잡아(engine.ts:1006) 인도하지 못하고, 계약은 결산에 미인도로 남는다. 그런데 카드에는 '…캠페인 안에 인도되지 않습니다' 경고가 없다. 같은 카드의 감액 일수 문장(46행)은 통관 일수를 더하므로 한 카드 안에서 기준이 다르다.
- 왜 틀렸나: 312행의 경계 반례(`exact.campaignDays = q.arrivalDay`)는 도착일과 인도일이 같을 때만 '경고 없음'이 맞다. 규칙 2 자료의 customs_days가 0이라 통과한다. 지시서가 arrivalDay 기준으로 적었으므로 지금 자료에서는 결함이 아니다(코드 읽기로 확인). 통관 일수가 생기면 시험은 통과하고 화면은 틀린다.
- 재현: 1. src/ui/zz-verify-tests-GAP-4.test.ts에서 `config = structuredClone(loadScenario(OPERATIONS_SCENARIO_IDS[0]))`를 만들고 `config.terms.customsDays = 1`로 바꾼다.
2. `state = openDay(runDays(createGame(config), config, generatedDay-1).state, config).state`(8일)를 만든다. `pair = openTradePairs(state, config)[0]`, `q0 = quotePreview(state, config, pair)`를 구한다.
3. `exact = structuredClone(config); exact.campaignDays = q0.arrivalDay`(13)로 두고 `q = quotePreview(state, exact, pair)`를 다시 구한다.
4. 명령은 `{ id:'GAP4', type:'ACCEPT_TRADE', ...pair, plan:{ employeeId: 본사 근무 직원, sailingId: listSailings(exact, route.id, state.day+1)[0].id } }`이다. planState 결과는 APPLIED였다.
5. `runToCampaignEnd(state, exact, { [state.day]: [command] })` 결과: outcome COMPLETED, CT001 deliveredDay null, 선적 arrivalDay 13, releaseDay 14.
6. `operationsQuoteFacts(q, state, exact)`와, startUi(exact)로 저장을 가져온 카드 HTML 양쪽에 '결산에 미인도로 남습니다.'가 없다.
7. 대조로 customsDays=0에서 같은 절차를 돌리면 deliveredDay=13이다.
8. 실행 명령: `cd …/rv-ui && npx vitest run src/ui/zz-verify-tests-GAP-4.test.ts --silent=false`. 실행 뒤 `rm -f`로 지웠다. git status에는 다른 검수자의 zz-verify 파일 두 개만 남았고, 그 파일들은 건드리지 않았다.
- 고칠 방향(제안): - 최소 수정: src/ui/market.ts:56의 조건을 `q.arrivalDay !== null && q.arrivalDay + config.terms.customsDays > config.campaignDays`로 바꿔 46행과 같은 기준(도착+통관 = 인도일)으로 맞춘다.
- 더 나은 수정: 파일 첫 줄의 원칙('읽기 함수가 돌려준 예측만 표시')에 맞추려면 화면이 인도일을 다시 계산하지 않는 편이 낫다. preview(src/engine/reports.ts:101)가 이미 계산하는 `release`를 QuotePreview의 `releaseDay`(또는 `deliveryDay`) 칸으로 내보낸다. 46행과 56행은 둘 다 그 값을 읽는다. 다만 이것은 엔진 쪽 변경이라 범위가 커진다.
- 시험: m2a5-trade-ui.test.ts 305행의 시험 옆에 customsDays=1 사본의 반례 두 개를 더한다.
  - campaignDays = arrivalDay면 경고가 있어야 하고, runToCampaignEnd의 deliveredDay가 null인 것과 함께 묶는다.
  - campaignDays = arrivalDay + customsDays면 경고가 없어야 하고, deliveredDay = campaignDays인 것과 함께 묶는다.
  - 기존 312행 반례는 customsDays 0일 때만 뜻이 있다는 주석을 단다.
- 지시서: TASK-0033 63행의 조건 문장도 '도착일+통관 일수 > campaignDays'로 고쳐 기록한다.

### GAP-5 환전 단위 '100 USD'가 화면 문구에 상수로 박혀 있고, 시험도 같은 문자열을 단언해 lotUsdMinor가 바뀌면 잡지 못한다

- 실패 상황: 자료의 fx_exchange.lot을 50 USD로 바꾸면 선택지(market.ts:77)와 명령(main.ts의 'exchange' 처리, `ui.exchangeLots * lotUsdMinor`)은 50 USD 단위가 된다. 그런데 라벨은 '금액 (100 USD 단계)'이고, 경영 보고는 '환전 칸에서 100 USD 단위로 원화로 바꿀 수 있습니다'라고 쓴다. 545행은 이 문장을 리터럴로 비교하므로 통과한다.
- 왜 틀렸나: 다른 환전 금액은 모두 `config.operations.fx.lotUsdMinor`에서 읽는데 이 두 문구만 상수다. 시험도 조정값을 문자열로 박아 두어(TASK-0027 R1 취지와 어긋남) 자료와 화면 문구의 불일치를 잡지 못한다. 현재 자료 lot = 100 USD라 결함은 없다.
- 재현: 1. /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/rv-ui/src/ui/zz-verify-tests-GAP-5.test.ts를 만든다. 내용은 다음과 같다.
   - `const copy = JSON.parse(JSON.stringify(loadScenario(OPERATIONS_SCENARIO_IDS[0]))); copy.operations.fx.lotUsdMinor = 5000;`
   - m2a5-trade-ui.test.ts의 unpaidState와 같은 반복(지급 상태가 NONE이 아닐 때까지 commitDay·openDay)으로 copy 기준 상태를 만든다.
   - `const ui = await startUi(copy); await ui.change({action:'scenario'}, copy.id); await ui.importText(serializeSave(state));`
2. 단언을 다음과 같이 둔다.
   - `ui.app.innerHTML`에 '50.00 USD (1묶음)'이 있다.
   - 동시에 '금액 (100 USD 단계)'와 '환전 칸에서 100 USD 단위로'도 있다.
   - `ui.click({action:'exchange'})` 뒤 오늘 할 일 칸에 '환전 USD→KRW 50.00 USD'가 있다.
   - 545행과 같은 리터럴 단언도 통과한다.
3. 실행: `cd /tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/rv-ui && npx vitest run src/ui/zz-verify-tests-GAP-5.test.ts --silent=false`. 결과는 2건 통과다. 라벨·보고는 100 USD이고 선택지·명령은 50 USD로 어긋남이 재현된다.
4. `rm -f src/ui/zz-verify-tests-GAP-5.test.ts`로 지운다(이미 지웠다). 다른 에이전트의 src/ui/zz-verify-a11y-A11Y-3.test.ts는 건드리지 않았다.
- 고칠 방향(제안): 1. 화면 문구: lot 금액을 한 곳에서 만든다.
   - 예: market.ts에 `export const fxLotKo = (c) => `${c.operations!.fx.lotUsdMinor / MINOR_PER_MAJOR.USD} USD``를 둔다. formatMoney를 쓰면 '100.00 USD'가 되므로 정수 표기를 원하면 엔진 operations.ts:166과 같은 나눗셈을 쓴다.
   - market.ts:84 라벨을 `금액 (${fxLotKo(config)} 단계)`로 바꾼다.
   - main.ts:848·849 두 삼항의 같은 문장을 `환전 칸에서 ${fxLotKo(config)} 단위로 원화로 바꿀 수 있습니다. 자동 환전은 없습니다.`로 바꾼다. 중복된 삼항은 한 변수로 묶는다.
   - esc 순서는 그대로 둔다(숫자와 'USD'뿐이라 안전하다).
2. 시험: m2a5-trade-ui.test.ts:545의 리터럴을 29행 `lot`에서 계산한 문자열로 바꾼다.
   - lotUsdMinor를 바꾼 cfg 사본(예: 5000)으로 라벨·보고·선택지·명령 금액이 함께 바뀌는지 보는 시험을 하나 둔다. 위 재현 절차를 그대로 쓰면 된다.
   - 548행 부정 단언은 '환전 칸에서'만 보도록 줄인다.
3. 같은 원칙(환전 단위는 lotUsdMinor에서 계산)을 TASK-0034 지시서에 명시한다. 초안 34행의 `{wageUsdLotsPerWeek × 100}`도 `× lotUsdMinor/100`으로 고친다.

### GAP-6 규칙 1 일정의 FREIGHT·DUTY 문구(이번에 switch로 다시 씀)를 지키는 시험이 없다. 골든 세 상태는 일정이 닫혀 있다

- 실패 상황: schedule.ts:88-89의 '운송편 예약 마감 · 운임 선지급'과 '수입 관세'를 서로 바꾸거나 고쳐도 전체 시험이 통과한다. 골든 세 문자열은 scheduleOpen=false 상태라 일정 본문 없이 '앞으로 7일 일정 (N건)' 단추만 담는다. schedule.test.ts와 main.test.ts에는 이 두 일정 문구를 단언하는 곳이 없다(main.test.ts:1912-1913은 다른 지급 목록의 '운송편 예약 때 운임 선지급'이다). m2a5 508행은 RENT·SPACE_FEE에 '수입 관세'가 없다는 반례만 본다. 또 normalized()(40행)가 시나리오 select를 통째로 지워, 규칙 1 선택지의 이름과 selected도 골든 밖이다(95행은 value 순서만 본다).
- 왜 틀렸나: TASK-0033은 규칙 1에서도 실행되는 지급 분기를 never 검사 switch로 다시 썼다. 그런데 '규칙 1 화면 불변' 골든은 이 결과 문구를 덮지 못하고, 다른 시험도 없다. 현재 코드의 문구는 기존(8fdc7ad의 85행)과 같아 결함은 없다.
- 재현: 1) 임시 시험 src/ui/zz-verify-tests-GAP-6.test.ts를 만들었다.
   - 규칙 1 startUi()에서 1일 → accept(tradePairs(legacy)[0]) → importText(결산) 순서로 세 상태의 normalized 문자열을 모았다. 세 문자열에 'id="schedule-body"'와 '운송편 예약 마감 · 운임 선지급'이 없음을 단언했다.
   - 같은 수락 상태에서 schedule-toggle을 눌러 일정 칸에 두 문구가 그려지는 것을 확인했다.
   - scheduleItems(planState(openDay(createGame(legacy)), legacy, [ACCEPT_TRADE])) 결과가 [PAY:FREIGHT:CT001 day 1 '운송편 예약 마감 · 운임 선지급' −20000, PAY:DUTY:CT001 day null '수입 관세' −5000]임을 확인했다.
   - `npx vitest run src/ui/zz-verify-tests-GAP-6.test.ts --silent=false`에서 3개 모두 통과했다.
2) 작업 트리를 tar로 스크래치 사본에 옮겼다(.git·zz-verify-* 제외, node_modules는 같은 심볼릭 링크). sed로 schedule.ts 88·89행 문구를 맞바꾸고 사본에서 `npx vitest run` 전체를 돌렸다. 결과는 44 파일 1242 통과, 실패 0(약 63초)이다.
3) 같은 사본에서 schedule.ts를 원래대로 돌리고 main.ts:363의 `'selected'`를 `''`로 바꾼 뒤 전체를 돌렸다. 역시 실패 0이다.
4) 정리: 임시 시험 파일은 rm -f, 사본은 rm -rf로 지웠다. rv-ui의 git status에는 다른 검증자의 zz-verify-a11y-A11Y-3.test.ts만 남았고 HEAD는 379a862다. rv-ui의 다른 파일은 고치지 않았다.
- 고칠 방향(제안): 1) 가장 싼 단위 단언(schedule.test.ts 또는 m2a5-trade-ui.test.ts):
   - 규칙 1에서 1일 openDay 뒤 ACCEPT_TRADE(tradePairs[0])를 planState한다.
   - scheduleItems 중 key가 PAY:FREIGHT:·PAY:DUTY:로 시작하는 줄의 {kind, day, textKo, money}를 toEqual로 고정한다. 기대값은 [{FREIGHT, 1, '운송편 예약 마감 · 운임 선지급', USD −20000}, {DUTY, null, '수입 관세', USD −5000}]이다.
   - 맞바꾸기와 다른 문구로 되돌리기를 모두 잡는다.
2) 골든 보강: m2a5-trade-ui.test.ts:65 직후 '첫 수락 뒤' 상태에서 ui.click({action:'schedule-toggle'})을 하고, queue 칸(또는 전체 normalized 문자열)을 비교하는 BASELINE[3]을 하나 더 둔다.
   - 기대 문자열은 지시서 규칙대로 8fdc7ad 사본에서 같은 도우미로 만들고 sha256을 보고한다.
   - 8fdc7ad의 문구가 같으므로 만들 수 있다.
   - 비교한 뒤에는 토글을 다시 눌러 기존 BASELINE[2] 흐름을 유지한다.
3) 부속: normalized()가 지우는 select는 따로 단언한다.
   - 규칙 1 시작 화면에서 `<option value="${SCENARIO_IDS[0]}" selected>`가 있어야 한다.
   - 규칙 1 선택지의 이름이 SCENARIO_TITLES와 같아야 한다.
4) 변형 표에 두 줄을 더한다. 'FREIGHT·DUTY 일정 문구 맞바꿈 → 일정 지급 문구 시험 실패', '시나리오 option selected 제거 → 시나리오 select 시험 실패'.

### GAP-7 위쪽 막대가 view를 쓰는지 시험이 확인하지 못한다. 기대 문자열이 환전 칸에도 그대로 나오고, 환전 칸은 자기 함수 출력과 비교한다

- 실패 상황: main.ts:379의 `operationsTopbar(view, config)`를 `operationsTopbar(state, config)`로 바꿔도 226행 시험이 통과한다. 5묶음 USD→KRW를 대기열에 넣은 뒤 막대는 확정 상태 기준의 더 이른 급여 가능일을 보인다. 그런데 241행이 찾는 `payrollRunwayKo(payrollRunwayDay(view), …)` 문자열은 환전 칸 '원화 급여 가능일 (임차료 포함, 전 → 후)'의 '전' 값(exchangePreview(view).runwayBefore)에도 같은 글자로 나온다. 236행과 394행은 화면을 `exchangeBlock()` 자체 출력과 비교해, 고정 환율 문구(받을 때/살 때 값의 짝), 급여 가능일 전→후, KRW→USD의 '받는 금액'(USD 쪽)을 독립적으로 확인하지 않는다.
- 왜 틀렸나: 기대값을 화면과 같은 함수로 만들거나 페이지 전체를 toContain으로 찾아, 값이 어느 칸에 나왔는지 묶지 않는다. 그래서 막대의 view/state 회귀나 환전 칸 내부의 짝 바뀜을 잡지 못한다. 지금 코드는 view를 쓰고 문구 짝도 맞아 결함은 없다.
- 재현: 1) 실제 변형 확인
- rv-ui를 scratchpad로 복사한다(src, data, tests, package.json, tsconfig.json, vite.config.ts, index.html, PACKAGE_STATUS.json, MANIFEST.json을 복사하고 node_modules는 심볼릭 링크로 연결).
- 사본에서 `sed -i '379s/operationsTopbar(view, config)/operationsTopbar(state, config)/' src/ui/main.ts`를 실행한다.
- `npx vitest run src/ui/m2a5-trade-ui.test.ts -t "대기 환전과 앞 계약의 예약"`은 1 passed다. `npx vitest run`(전체)도 1,242 passed다.

2) 환전 칸 변형
- 같은 사본의 market.ts:85에서 다음을 바꾼다.
  - `fx.buyKrwPerUsd`와 `fx.sellKrwPerUsd`의 자리를 맞바꾼다.
  - `runway(q.runwayBefore) → runway(q.runwayAfter)`의 앞뒤를 맞바꾼다.
  - KRW→USD 받는 금액을 `usd(usdMinor + 100)`으로 바꾼다.
- `npx vitest run src/ui`는 511 passed다.

3) 트리 안 임시 시험(src/ui/zz-verify-tests-GAP-7.test.ts)
- 226행과 같은 절차(5묶음 USD→KRW 대기 → 첫 쌍 수락)를 밟는다.
- `viewText = payrollRunwayKo(payrollRunwayDay(view,cfg),…)`는 "60일까지", `stateText`는 "56일까지"다.
- 페이지에 viewText가 2회 나온다(막대 1회, 환전 칸 '전' 1회).
- `html.replace(operationsTopbar(view,cfg), operationsTopbar(state,cfg))`로 만든 변형 페이지에서 236~241행의 원래 단언이 모두 통과한다.
- `split('id="status-h"')[1].split('</header>')[0]` 범위의 단언은 실패해 변형을 잡는다.
- 실행 명령은 `--silent=false --reporter=verbose`이고 3 passed다. 실행 뒤 rm -f로 지웠다.
- 고칠 방향(제안): 시험만 고친다(src/ui/m2a5-trade-ui.test.ts). 제품 코드는 바꾸지 않는다.

1) 241행: 페이지 전체 toContain 대신 79~93행과 같은 막대 범위 추출을 쓴다.
`const bar = html.split('id="status-h"')[1]!.split('</header>')[0]!;`
`expect(bar).toContain(`<span>원화 급여 가능일</span><b>${payrollRunwayKo(payrollRunwayDay(view,cfg), view.day, cfg.campaignDays)}</b>`)`
같은 시험에 `expect(payrollRunwayDay(view,cfg)).not.toBe(payrollRunwayDay(state,cfg))`를 두어, 결과가 같은 변형이 되지 않도록 시나리오를 고정한다.

2) 236·394행: exchangeBlock 비교는 연결 확인으로 남긴다. 그와 별도로 `<section class="exchange"`~`</section>` 범위에서 다음을 직접 단언한다.
- 고정 환율: `${fx.buyKrwPerUsd.toLocaleString('ko-KR')}원(받을 때) · ${fx.sellKrwPerUsd.toLocaleString('ko-KR')}원(살 때)`와 `expect(fx.buyKrwPerUsd).not.toBe(fx.sellKrwPerUsd)`
- 급여 가능일: `<dt>원화 급여 가능일 (임차료 포함, 전 → 후)</dt><dd>${runway(q.runwayBefore)} → ${runway(q.runwayAfter)}</dd>`와 전≠후 확인
- 방향별 USD 쪽: KRW_TO_USD는 `<dt>받는 금액</dt><dd>${usd(amount)}</dd>`, USD_TO_KRW는 `<dt>내는 금액</dt><dd>${usd(amount)}</dd>`

3) 선택: 지급 상태 칸도 view를 쓰는지 잡으려면, 대기 환전으로 지급 단계가 바뀌는 상태를 쓴다(예: unpaidState에 KRW를 늘리는 환전을 대기시킨 상태). 그 상태에서 막대 범위의 `<span>지급 상태</span><b>${esc(paymentStatusKo(view,cfg))}</b>`를 단언한다.

### GAP-8 지급 상태의 '캠페인 뒤 실패일' 문구가 경계(failAtCloseOfDay == campaignDays)를 시험하지 않아 `>`와 `>=`를 구분하지 못한다

- 실패 상황: 94행의 조건을 `>=`로 바꾸면 campaignDays == failAtCloseOfDay인 설정에서 막대가 '… 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다'라고 쓴다. 하지만 엔진은 그날 마감에 경영 실패로 끝낸다. engine.ts:846의 processPaymentDefault가 868행의 종료 판정보다 먼저 돌고, operations.ts:247은 `day >= failAtCloseOfDay`로 판정한다. 시험은 failAt−1(두 식 모두 문구 있음)과 원래 90일(두 식 모두 문구 없음)만 보므로 이 변형이 통과한다. 남은 날 수 기대값도 화면과 같은 식(failAt − day)으로 만든다.
- 왜 틀렸나: 캠페인 뒤 도착 경고(305행)에는 도착일 = 종료일 경계 반례를 두었는데, 같은 종류의 지급 상태 문구에는 경계 반례가 없다. 현재 코드는 `>`이고 엔진 로그(operations.ts:267)와 같은 조건이라 결함은 없다.
- 재현: 검수 트리에 임시 파일 src/ui/zz-verify-tests-GAP-8.test.ts를 만들었다.

1) 시험과 같은 방식으로 dayState·unpaidState를 만든다(m2a5-trade-ui.test.ts:30-39와 같음).
2) market.ts:94만 `>=`로 바꾼 mutant(view, config)를 시험 파일 안에 복제했다. 원본 파일은 고치지 않았다.
3) 원본과 mutant 각각에 527·530·532·536·537행 단언을 돌렸다. 둘 다 통과했다.
4) `edge = {...cfg, campaignDays: status.failAtCloseOfDay!}`로 두 함수의 차이를 확인했다. paymentStatusKo는 문구가 없고 mutant는 문구가 있었다.
5) edge 설정으로 commitDay/openDay를 명령 없이 끝까지 돌렸다. `outcome === 'FAILED'`이고 `closedDays.at(-1) === 71`인지 확인했다.

실행 명령은 `npx vitest run src/ui/zz-verify-tests-GAP-8.test.ts --silent=false`이고 결과는 3 passed이다. 로그 값은 unpaid.day 58, failAt 71, end day 72, outcome FAILED, closed 71이었다. 실행 뒤 `rm -f`로 지웠고, git status에는 다른 검증자의 zz-verify-a11y-A11Y-3.test.ts만 남아 있다.
- 고칠 방향(제안): 제품 코드는 고칠 필요가 없다. 시험만 보강한다.

1) src/ui/m2a5-trade-ui.test.ts:537 다음에 아래를 넣는다.
`const edge = { ...cfg, campaignDays: status.failAtCloseOfDay! }; expect(paymentStatusKo(unpaid, edge)).toBe(`경고 · 실패까지 ${remaining}일`);`
문구 미포함만 보지 말고 전체 문자열을 비교한다.

2) 경계의 근거를 엔진 동작에 묶는다. 같은 시험이나 엔진 시험에서 edge 설정으로 unpaid부터 명령 없이 진행해 `outcome === 'FAILED'`이고 마지막 마감일이 failAt인지 단언한다. 그래야 엔진 규칙(operations.ts:247의 `>=`)이 바뀌면 화면 경계도 같이 깨진다.

3) 남은 날 기대값은 화면과 다른 식으로 만든다. 예: `cfg.operations!.paymentDefault.failureAgeDays - status.ageDays`.

4) 선택 사항: market.ts:94, operations.ts:267, engine.ts:1179는 같은 '실패일이 캠페인 뒤인가' 판정을 따로 적고 있다. 엔진 읽기 도우미 하나(예: `failsAfterCampaign(failAtCloseOfDay, config)`)로 모으면 한쪽만 바뀌는 일을 막을 수 있다. 이 부분은 엔진을 건드리므로 별도로 판단한다.

