# 경로 3 설계 명세: 직접 무역 가격·원가 위험 (승인, 개정 3e)

- 지위: **승인(허브, 2026-10-16).** 6절은 판정표와 함께 동결이다(H14-8, 승인 `9ce98fe`). 개정 3d·3e는 허브 사전 확인과 그 재검토로 동결 밖(머리, 2절 2, 3.2, 3.3, 3.4, 9절)만 고쳤다. 세션 A, 2026-10-14 작성, 2026-10-16 개정 1. 지시서 초안은 `docs/ai/tasks/TASK-0062`~`0064`, 판정 기준은 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`다.
- 개정 1: 허브 검토 `REVIEW-HUB-2026-10-16.md`(46건)와 허브 결정 `HUB-DECISIONS-2026-10-16.md`(H0~H5)를 반영했다. 처리표는 끝(13절)에 있다.
- 개정 2(2026-10-16): 허브 재검토 `REREVIEW-HUB-2026-10-16.md`(R1~R31, m1~m33)와 허브 결정 H6~H13을 반영했다. 처리표는 13절 끝(‘허브 재검토 64건 처리표’)에 있다.
- 개정 3(2026-10-16): 허브 2차 재검토 `REREVIEW2-HUB-2026-10-16.md`(S1~S19, n1~n47)와 허브 결정 H14를 반영했다. 처리표는 13절 맨 끝(‘허브 2차 재검토 66건 처리표’)에 있다. **6절(시작 프로필)은 판정표와 함께 동결 범위다(H14-8).**
- 개정 3c(2026-10-16): 허브 승인 전 확인 `REREVIEW3-HUB-2026-10-16.md`(T1~T7, t1~t24)와 허브 결정 H15를 반영했다. 처리표는 13절 맨 끝(‘허브 승인 전 확인 31건 처리표’)에 있다.
- 범위: PLAN 경로 3의 ① 원화 매입·달러 판매, ② 계약 뒤 관세 변경과 출항 부대비, ③ 화물 손상 클레임과 미수(지연·부분 지급).
- 범위 밖과 담당 경로:
  - 판매가 연동, 대손(떼임): 뒤 단계
  - 보험(ICC 약관 대조): 경로 7·9
  - 인코텀즈 선택, CIF 과세: 경로 6
  - 결제 방식 선택(송금·추심·신용장): 경로 7. 경로 9의 ‘외상 0일’ 정책과도 이어진다
  - 형태 선택(마른김·조미김): 경로 7
- 줄 번호는 개발 브랜치 `16e090c` 기준이다.

## 1. 왜 손실이 0%인가(코드 확인)

| 원인 | 위치 | 내용 |
|---|---|---|
| 가격이 수락 때 고정 | `engine.ts` `acceptTrade` | 매입액과 판매액을 계약에 적고 다시 바꾸지 않는다 |
| 단일 통화 강제 | `scenario.ts:268-270`, `engine.ts:308` | 견적·노선 통화가 거래 통화와 다르면 시나리오를 거부하고, 매입·판매 통화가 다르면 수락을 거절한다 |
| 생성기도 USD 고정 | `market.ts:65` | 직접 무역 견적을 늘 USD로 만든다 |
| 환율 고정 | `operations.ts:150-156` `exchangeAmounts` | 게임용 고정 환율 하나와 차감률뿐이다 |
| 관세 고정 | `catalog.ts:75` `dutyEstimate` | 고정 세율 × 매입액. 도착일에 같은 식으로 낸다(`engine.ts:1019`) |
| 운임 고정 | 노선 `booking_fee` | 예약할 때 낸 값이 끝이다 |
| 수금 확정 | `engine.ts:1108` `processCollections` | ‘고객은 결제일에 전액 지급한다’ |
| 정책 거름 | `sim/operations-policy.ts:118`(기여 계산), `:129`(양수만 수락) | 기여이익이 양수인 견적만 받는다. 수락 뒤 값이 바뀌는 길은 늦은 인도 감액·출항 전 취소뿐이고, 기준 정책(정시 편만, `:90·100·136`)은 그 길을 피한다. 그래서 기준 회사의 손실이 0이다(TASK-0032: 227건 모두 완료, 손실 0). `policies.ts:95`는 operations가 없는 설정(규칙 1)의 분기다 |

결론: 손실이 생기려면 **수락 뒤에 바뀌는 값**이 있어야 한다. 아래 세 층이 그것이다.

## 2. 공통 원칙

1. **새 규칙 판본으로만 켠다.** `rules_version: "M2a-rules-3"`. rules-1·rules-2 경로의 동작·출력·저장은 바이트로 같다. 위험 층은 설정의 `risk` 묶음이 켠다.
2. **옛 값 불변(허브 결정 H4·H9).**
   - rules-2: **TASK-0062a의 골든**(개발 브랜치 `7cf3e5e` 확정본)이 지킨다. rules-2 묶음은 4정책 × 20시드와 대표 변형 5개(react, 투자+고용 둘, 두 번 고용, 조사 선행) × 5시드, 105회다. 골든은 두 묶음이다. rules-2 105회는 실행마다 `runHash`·`stateHash`(마지막 상태, `meta` 뺀 나머지, 로그 포함)·`probeHash`를 지킨다. `probeHash`는 7일마다 취소 `planState`, 원화→달러 `planState`, 읽기 함수(`paymentDefaultStatus`, `fundsPosition`, `cashReservations`, `upcomingPayments`, `campaignSummary`, `marketTable`, `contractReport`, `exchangePreview`)의 값을 해시한다. 규칙 1 400회는 `runHash`·`stateHash`를 지킨다(`tests/golden/rules1-run.tsv`). 두 묶음 모두 저장 왕복(serialize → deserialize → serialize가 바이트로 같음)을 검사한다. 기존 P0-M2A5 골든값 시험이 함께 지킨다.
   - **선택 인수 원칙이 시험으로 지켜진다.** ‘새 인수는 모두 선택 인수, 없으면 rules-2 동작 그대로’(H13)를 어기면, 미리보기·자금 예약 등 읽기 함수의 rules-2 값이 바뀌어 `probeHash`가 잡는다.
   - TASK-0062~0064는 골든 파일과 검사기를 고치지 않고 `--write`를 쓰지 않는다.
   - **어떤 d03 정책도 지나가지 않는 경로**는 탐침과 단위 시험이 지킨다. 아래 표는 TASK-0062a 결과 보고 ‘범위 보고 ③’(`docs/ai/tasks/results/TASK-0062a.md`)과 대조를 마친 판이다(개정 3b, H14-10). 이 표는 동결 밖이다. **대조 완료(개정 3b 커밋)**: 골든 기준은 TASK-0062a 병합 커밋 `c4d6286`이다(그 뒤 엔진·자료 변화 없음, 문서만). TASK-0062의 비교 기준(BASE)은 지시서의 정의(작업 트리를 만든 커밋)를 따른다. ‘없음’은 rules-2 실행 경로를 직접 검증하는 기존 시험이 없다는 뜻이고, 규칙 1 시험은 rules-2 보장으로 세지 않는다.

     | 0062a 골든에서 0인 경로 | 지키는 것 | 0062~0064와 겹치는가 |
     |---|---|---|
     | 출항 전 취소(`CANCEL_CONTRACT`, 취소 계약 수) | 탐침(7일마다 취소 `planState`) + `sim/m2a5-sim.test.ts` ‘handlingJobs는 취소를 빼고 …’(주선 취소 적용) | 겹침(0062가 취소 금액을 통화별로 나눔). 탐침이 rules-2 취소 결과를 지킨다 |
     | 원화→달러 환전(`KRW_TO_USD`) | 탐침(원화→달러 `planState`) + `m2a5-money.test.ts` ‘왕복 환전의 두 통화 장부와 분개 전체가 맞고 …’ | 겹침(0062가 환전 환율을 바꿈). 탐침과 이 시험이 지킨다 |
     | USD 미지급(USD 의무 수, 끝 미지급 USD 합) | 읽기만: `m2a5-money.test.ts` ‘USD 원인 의무에는 합산한 다음 수금과 원화 환전 필요액을 제시한다’(주입한 의무의 회복 읽기) | 겹침(0062가 `paymentDefaultStatus`의 묶음 계산을 바꿈). 읽기는 탐침의 `paymentDefaultStatus`와 이 시험이 지킨다 |
     | USD가 원인인 실패 실행 | **없음** | 겹침(0062가 `processPaymentDefault`의 USD 약정·원화 선택 지출을 고침). 그래서 TASK-0062 시험 표에 ‘USD 원인 실패(rules-2)’를 더했다 |
     | 지연 대응(`RESPOND_TO_DELAY`, delayDecisions) | 없음. rules-2 자료(`SCENARIO_M2_OPERATIONS`와 그 base)에 `port_restriction`이 없어 닿지 않는 경로다(`src/content/scenario.ts:309-321`, `engine.ts:134-151`) | 겹치지 않음(0062~0064는 지연 공지·대응을 고치지 않음) |
     | 훈련(`START_TRAINING`) | 없음(`m2a-growth.test.ts` CHAR-ACC-08은 규칙 1) | 겹치지 않음(0062~0064는 훈련 명령·훈련비를 고치지 않음. 원화 급여 묶음 계산은 탐침의 `paymentDefaultStatus`·`fundsPosition`이 지킨다). 시험을 더하지 않는다 |
     | 실패 기록의 원화 선택 지출 행(`optionalKrwSpendBeforeFirstUnpaid`) | `m2a5-money.test.ts` ‘첫 미지급 전 14일 선택 지출만 포함하고 경계 밖·당일 지출은 뺀다’ | 겹침(0062가 `PURCHASE-` 창을 넓힘). rules-2에는 원화 `PURCHASE-`가 없어 이 시험이 그대로 통과해야 한다 |
     | 실패 기록의 선복 약정 행(`SPACE_CONTRACT`) | `m2a5-money.test.ts` ‘실패 전 선복 서명 약정을 남기고 …’, ‘같은 날 계약과 선복 서명은 입력 순서대로 …’ | 겹침(0062가 USD 약정 계산을 고침). 이 두 시험이 지킨다 |
     | 하역 대기 문장 | `m2a5-money.test.ts` S20·S24(주입 설정) | 겹치지 않음 |

     - 0062a 골든에서 0이 아닌 경로(직접 무역 수락, 주선, 원화 환전 `USD_TO_KRW`, 실패 40회, 계약 USD 약정 225행 등)는 골든의 실행·상태·탐침 해시가 지킨다.
     - 개정 3의 TASK-0062 시험 ‘취소(rules-2)’는 그대로 둔다. 탐침은 계획 결과를, 이 시험은 `FREIGHT-RELEASE` 분개 금액을 설정에서 계산해 본다.

   - rules-1: TASK-0062a 골든의 규칙 1 묶음(400회, `tests/golden/rules1-run.tsv`). 400회 `run`의 `cmp`는 허브가 검수 때 따로 돌린다.
3. **위험 값은 순수 함수로 만든다.** 환율 경로·관세 일정·부대비·클레임·수금 계획은 모두 `(seed, 흐름 이름, 번호)`만으로 정해진다.
   - `rng.ts`의 `drawUniform`은 상태를 바꾸지 않는다. 그래서 `{ seed, cursors: { [흐름]: 번호 } }`를 만들어 부르면 된다(`risk.ts`의 `drawAt` 도우미).
   - 한 사건에서 여러 값을 뽑을 때는 값마다 흐름 이름을 나눈다(예: `TARIFF:CN:2:notice`, `…:lag`, `…:step`).
   - (흐름, 번호) 쌍이 겹치지 않음을 시험한다. 상태에 새 칸을 두지 않는다(8절).
   - **미래 누설 금지.** 이 순수 함수들은 엔진 내부용이다. 화면은 읽기 함수(미리보기, 시세표, 공지된 관세, 공개 위험 등급, 그리고 3.4 조건 아래의 `contractRiskReport`)만 쓴다. 실행기 정책은 판정표 6.2 목록(미리보기, 시세표, 공지된 관세, 공개 위험 등급)만 쓴다(검토 n39).
4. **알려진 것과 모르는 것을 나눈다.**
   - 학생이 수락할 때 볼 수 있는 값: 오늘 참고 환율, 이미 공지된 관세 변경, 이번 주 운임, 공개 위험 등급(5절).
   - 볼 수 없는 값: 앞으로의 환율, 공지 전 관세 변경, 출항 주 부대비, 실제 클레임, 실제 수금일.
   - 앞의 것만 견적 미리보기에 쓴다.
5. **두 통화를 더한 값(허브 결정 H0).**
   - 상태·장부·저장·결산·지급 불이행 실패 기록은 **통화별 그대로**다.
   - 미리보기의 기존 칸도 통화별 그대로다. ‘USD 환산값’으로 바꾸지 않는다.
   - rules-3 미리보기에만 저장하지 않는 새 칸 `referenceEstimate`(참고 환율 환산 손익, 추정)를 둔다.
   - 분석값(판정표 2절 식, USD 센트 + `krwToUsdMinor(KRW, baseKrwPerUsd)`)은 rules-3 실행기 출력에서만 쓴다(H15 F9).
   - **허용 자리는 목록으로 닫는다(허브 결정 H6).** ① rules-3 미리보기의 새 칸, ② rules-3 실행기의 분석값, ③ `contractRiskReport`(3.4의 조건), ④ 실행기 결정용 환산(판정표 6.1의 결정 기여). 이 밖에서는 두 통화를 더하지 않는다.
   - 화면에 보일 때는 ‘추정, 환율이 바뀌면 달라짐’ 표지를 늘 붙인다.
   - SPEC 10.4 첫째·셋째 항에 이 닫힌 목록의 예외 문장을 넣는 것은 허브 몫이다(승인 때, 검토 n5).
6. **회복 경로.** 한 계약의 손실이 회사를 끝내지 않게 한다(딥리서치 GP7-N08). 손실은 판매액을 넘지 않고, 대손은 이번에 없다. 판정표 J1이 이를 지킨다.
7. **화면은 이번 범위가 아니다.** 엔진·자료·읽기 함수·검사만 한다. 새 규칙 시나리오는 아직 플레이어에게 보이지 않는다(7절). 화면은 경로 11(원인 추적)과 함께 Sol 지시서로 한다.

## 3. ① 원화 매입·달러 판매와 환율 경로 (TASK-0062)

### 3.1 현실 근거와 학습목표

- 평택의 국내 공급자는 원화로 판다. 해외 고객은 달러로 낸다. 회사는 원화로 사서 달러로 받는 동안 환율에 노출된다.
- O1(환율 판단): ‘외화 거래에서 환율이 변하면 원화 원가·대금·이익이 어느 방향으로 바뀌는지 판단한다’(PLAN ‘교육과정 정렬’). 공통 연결은 일반계 [12경제04-03]이다. 특성화고 [수입 07-03-03](결제 방식별 위험)은 결제 방식이 없는 경로 3의 근거에서 뺀다(경로 7).

### 3.2 참고 환율 경로와 환전

- 주 단위 무작위 걸음이다. 시세 공개 주기(`publish.interval_days`, 지금 7일)와 같은 날 바뀐다.
  - 1주차 값 = `start_krw_per_usd`. 기본은 `fx_krw_per_usd` 1,300이고, 둘이 다르면 검사기가 막는다.
  - k주차 값 = (k−1)주차 값 × (10000 + 걸음bp) / 10000. 걸음은 `[-step_bp, +step_bp]`의 정수 균등. 결과는 `[min, max]`로 자른다. 원 단위 정수, half-up(`divHalfAway`). 반올림 때문에 이웃 주 변화가 `step_bp`보다 최대 0.5원 클 수 있다(시험 경계: `|Δ| × 10000 ≤ 전주 × step_bp + 5000`).
  - 흐름 `FX-REF`, 번호 = 주차. 순수 함수 `referenceRate(config, seed, day)`. 마지막 공개일 뒤는 마지막 값.
- 시작값: `step_bp` 250(±2.5%), 범위 1,170~1,430(±10%, 고정). 균등 걸음 s의 표준편차는 √(s(s+1)/3)bp라 250 → 1.45%/주다.
  - **실측 비교(허브 결정 H11).** ECB 기준환율로 계산한 원·달러 주간 로그수익률 표준편차는 2016~2025 1.13%, 2022 1.60%, 2023 1.39%, 2026년(10월 15일까지) 1.37%다(허브 재계산, 2026-10-16). 시작값은 ‘평년보다 거친 해’, 허용 상한 275(1.59%)는 2022년 수준이다. **게임 가정**이다.
  - 1,300은 2023년 수준의 설계값이다. 실측 수준과 비교한 화면·교사 자료의 기준일 스냅숏은 경로 10에서 한다.
  - 균등 걸음은 드문 큰 주(3% 이상)를 만들지 못한다. 교사용 자료에 적는다.
  - **경계 자르기의 한계.** 경계에서는 다음 값이 한쪽으로만 간다. 학생이 ‘환율이 상한에 닿으면 내려온다’고 잘못 배울 수 있다. 측정에서 경계에 닿은 판 수를 센다(판정표 진단 B). 교사용 자료에는 ‘실제 환율에는 상·하한이 없다’고 밝힌다. 반사 방식은 v2 후보로만 남긴다.
- **환전.** rules-3이면 거래 환율 = 그날 참고 환율 ∓ 차감(`spread_basis_points`, 지금 100bp)이다. 지금의 고정 환율 자리를 대신한다.
  - `exchangeAmounts(config, direction, usd, seed?, day?)`처럼 시드·날짜를 **선택 인수**로 받게 한다. 호출처는 `operations.ts:168`(`s.rng.seed`, `s.day`)과 `readers.ts:97`(`exchangePreview`, 오늘)이다. 인수가 없으면 지금 식이다. rules-3에서 인수 없이 부르면 예외를 낸다.
  - 고정 환율로 묶음 금액을 세는 함수들도 rules-3에서는 그날 환전 환율을 쓴다: `usdLotKrw`(`operations.ts:225-226`), `paymentDefaultStatus`의 `lotsToSurvive`·`lotsToClearAll`·`krwToUsdRequiredMinor`(`:238-253`), 읽기 함수의 `wageUsdLotsPerWeek`(`readers.ts:202`). 새 선택 인수는 `usdLotKrw(config, s?: GameState)`의 `s` 하나다. `paymentDefaultStatus`·`weeklyBottleneck`은 서명을 바꾸지 않고 안에서 `usdLotKrw(config, s)`를 부른다(환율일 `s.day`, 개정 3e). 인수가 없으면 지금 고정 환율 식(rules-2 바이트 그대로)이고, rules-3에서 인수 없이 부르면 예외다. 실행기 호출(`operations-policy.ts:73`)에 상태를 넘기는 일은 경로 5 실행기 지시서에서 한다.
  - 환전 불변식(`operations-invariants.ts:64`): rules-3이면 각 환전 기록 날짜(`exchanges[].day`)의 참고 환율로 기준 원화액을 다시 계산해 검사한다. 검사를 지우거나 느슨하게 하지 않는다. 이 검사는 불러오기(`save.ts:135`)와 매일 마감(`engine.ts:872`) 모두에서 돈다.

### 3.3 혼합 통화 계약

- **환산 도우미 둘과 반올림 하나(허브 결정 H14-2).** `src/engine/risk.ts`에 둔다. 모든 원↔달러 환산(판정표 6.1 결정 기여, `dutyFor` 과세가격, `referenceEstimate`, `contractRiskReport`, 분석값)이 이 둘만 쓴다. `rate`는 원/달러 정수다.
  - `krwToUsdMinor(krw, rate) = divHalfAway(krw × 100, rate)`
  - `usdToKrwMinor(cents, rate) = divHalfAway(cents × rate, 100)`
  - `divHalfAway(n, d) = sign(n) × ⌊(2|n| + d) ÷ (2d)⌋`(d > 0 정수). `money.ts`의 `applyBasisPoints`와 같은 규칙으로, 0.5는 0에서 먼 쪽으로 올린다. `market.ts:6`의 내보내지 않는 `halfUp`(+∞ 쪽)은 쓰지 않는다.
  - 산술 상수 시험: 2,600,000원 @1,300 → 200,000센트. 음수와 0.5 경계 사례를 하나씩 단언한다(TASK-0062).
- **매입 통화의 유도.** 매입(`supplier`) 견적은 원화, 판매 견적·노선·관세·부대비는 달러다.
  - 시세 행의 통화는 설정 행(`types.ts:535`)이나 상태의 `MarketBatch.rows`(`types.ts:560`)에 **칸으로 두지 않는다.** rules-3 위험 설정과 `side`로 한 함수 `rowCurrency(config, side)`(`risk.ts`)에서 유도한다. 그래서 rules-2 상태의 키가 바뀌지 않는다.
  - 생성기는 rules-3 원화 매입이면 매입 견적의 통화만 KRW로 정한다(값 크기는 바꾸지 않는다). 원 단위 값은 측정 변환(7절, `withRiskLevel`) 한 곳에서 `usdToKrwMinor(USD 기준가(센트), start_krw_per_usd)`로 만든다(개정 3e).
  - 시세표(`marketTable`, `market.ts:100`)는 같은 유도 함수로 매입 행 통화를 KRW로 낸다. rules-2는 USD 그대로다.
  - **정적 매입 견적**(운영 시나리오가 이어받는 1~3일 견적 `OFFER_BUY_01/02`)도 `withRiskLevel` R1이 원화로 바꾼다(검토 35번 권장안 가). 그래서 rules-3에 ‘단일 USD 직접 무역 계약’이 생기지 않는다. 그래도 분기 조건은 ‘rules-3’이 아니라 **‘매입 통화 ≠ 판매 통화’**로 둔다(방어).
- **계약.** `currency`는 **판매 통화**(USD)다. 매입 통화는 매입 견적에서 읽는다(`offerDef(buyOfferId).currency`). **계약에 새 칸을 두지 않는다.** `purchaseAmountMinor`는 매입 통화의 금액이다.
- **화물 장부가.** 혼합 통화 계약의 화물(`cargoLot`) `carryingAmountMinor`·`currency`는 **매입분(원화)만** 담는다. 달러 운임·관세·부대비는 같은 계약 ID의 USD 재고(`INVENTORY`, USD) 분개로만 쌓는다. 단일 통화 계약은 지금처럼 화물 칸에 더한다.
  - 재고 불변식(`invariants.ts:62-67`): 통화별 재고 장부 = 화물 장부가 합 + 혼합 통화 계약의 USD 재고 분개 잔액. rules-2에서는 지금 식과 같은 값이다.
- **인도 때 매출원가.** 혼합 통화 계약이면 통화별 두 분개를 낸다: `COGS-{계약}-KRW`(화물 장부가), `COGS-{계약}-USD`(그 계약의 USD 재고 잔액). rules-2는 지금 분개 ID 그대로다.
- **관세 과세가격(검토 7번).**
  - `과세가격(USD 센트) = krwToUsdMinor(원화 매입액, valueFxDay 참고 환율)`(= 원화 × 100 ÷ 환율, 개정 3에서 ×100 누락을 고침, 검토 S6). `valueFxDay`는 수락일이라 계약 내내 고정한다. 수락 뒤에는 `referenceRate(config, seed, c.acceptedDay)`로 다시 계산하고 상태 칸은 두지 않는다. 미리보기·수락 자금 검사에서는 ‘오늘’이 곧 수락 후보일이다.
  - `관세(USD) = 과세가격 × 세율`(정수 반올림은 `dutyEstimate`와 같은 `applyBasisPoints`, 개정 3e). 세율은 ‘세율 적용일’의 세율 가운데 ‘공지 기준일’까지 공지된 변경만 반영한 값이다. TARIFF 층이 없으면 시나리오 고정 세율이다.
  - 그래서 관세의 USD 금액은 세율 변경으로만 바뀌고, 원화 비용의 변화는 지급일 환율로 `fx` 칸에 들어간다.
  - **가정임을 밝힌다(교사용 자료 목록에 넣는다).** 실제 과세가격은 수입국으로 수출 판매된 거래가격(WTO 관세평가협정 제1조)에 운임·보험을 더한 값(제8조 2항. 한국·중국·베트남은 CIF)이다. 외화는 수입국이 정한 환율로, 신고일 기준으로 환산한다(제9조, 한국 관세법 제18조, 중국 해관 규정). 게임에는 도착국 통화가 없고 관세를 USD로 매기므로 이 환산을 두지 않는다. 원화 송장을 수락일 환율로 바꾼 값을 USD 수출 송장가 대용으로 쓴다. 정시 계약에서는 수락일과 신고일의 환율이 대개 같은 주다. CIF 과세는 경로 6이다.
  - 분기 조건은 ‘매입 통화가 KRW일 때’다. 매입이 USD이면 지금 `dutyEstimate` 그대로다.
  - **한 함수 `dutyFor`(허브 결정 H13·H14-6, 검토 R15·R24·S2·S15).** 관세를 계산하는 **여섯 곳(읽기 함수 포함)**이 이 함수 하나를 부른다. 서명은 TASK-0062에서 고정하고 0063은 몸통만 바꾼다.

    `dutyFor(config, seed, goodId, destinationCityId, tariffDay /*세율 적용일*/, knownThroughDay /*공지 기준일*/, purchaseMinor, purchaseCurrency, valueFxDay /*과세가격 환율일*/)`

    | 호출처 | `tariffDay` | `knownThroughDay` | `valueFxDay` |
    |---|---|---|---|
    | 미리보기 `reports.ts:99` | 다음 첫 편의 도착 예정일 | 오늘(`bookingDay`) | 오늘 |
    | 수락 자금 검사 `engine.ts:319` | 다음 첫 편의 도착 예정일(`acceptTrade`는 `withPlan`에서 예약보다 먼저 돈다. plan 편은 쓰지 않는다) | 오늘 | 오늘 |
    | 자금 예약 `reservations.ts:33` | 아래 ‘자금 예약의 tariffDay’ | 오늘 | **수락일**(`c.acceptedDay`) |
    | 도착 처리 `engine.ts:1019` | 도착일 | 도착일 | 수락일 |
    | 실패 기록 `operations.ts:273` | `listSailings(config, route, 수락일 + 1)[0]`의 도착 예정일(수락일 미리보기와 같은 편) | 수락일 | 수락일 |
    | `contractRiskReport`(`reports.ts`) | 0단계 = 미리보기(수락일). 도착한 계약 = `DUTY-` 분개를 읽고 부르지 않음. 도착 전 = 자금 예약 규칙의 날(‘오늘’ 자리에 평가일) | 0단계 = 수락일. 도착 전 = 평가일 | 수락일 |

    - **자금 예약의 tariffDay.** 운송 중이면 `max(예정 도착일, 오늘)`. `BOOKED` 예약이 있으면 그 편의 도착 예정일. 예약이 없거나 취소됐으면 다음 첫 편(`listSailings(…, 오늘 + 1)[0]`)의 도착 예정일. `upcomingPayments`(`reports.ts:281-284`)와 같은 꼴이다.
    - **편이 없을 때.** ‘다음 첫 편’을 쓰는 모든 행에서 편이 없으면 `tariffDay = knownThroughDay`다(H14-6의 자금 예약 규칙을 미리보기·자금 검사·실패 기록에도 같게 쓴다. 미리보기의 `arrival`이 null인 경우, 검토 S15).
    - **`goodId` 누락.** rules-3 직접 무역에서 `preview`에 `goodId`가 없으면 예외를 낸다(H14-6, 검토 n24). 조용히 고정 세율로 바꾸지 않는다.

    - 자금 예약은 이미 체결한 계약이라 과세가격 환율일이 수락일이다(검토 m16·m26·m27). 그래서 세율이 그대로면 ‘수락일 미리보기 관세 = 수락 뒤 매일의 예약 관세 = 도착 관세’다.
    - 0062의 몸통은 `goodId`·도착지·`tariffDay`·`knownThroughDay`로 세율을 고르지 않는다(세율은 시나리오 고정). 0062는 인수 계산과 `goodId` 누락 예외만 넣고, 0063이 몸통에서 쓴다.
    - 매입이 USD이면 지금 `dutyEstimate` 그대로다.
- **자금 검사(`fundsShortfall`).** 매입은 KRW 가용, 운임·관세 예상은 USD 가용으로 **나눠** 본다. 거절 문장도 통화마다 따로 쓴다.
- **지급 불이행 실패 기록(검토 31번).**
  - `processPaymentDefault`의 USD 약정액(`operations.ts:272-274`)은 혼합 통화 계약이면 **USD 몫만** 넣는다(노선 운임 `routeBetween(…).bookingFeeMinor` + 위 표 ‘실패 기록’ 행의 `dutyFor` 관세. 수락일 미리보기의 운임 + 관세와 같다. H15 O9). 단일 통화 계약은 지금 식 그대로다(직접 무역 = 매입 + 노선 운임 + 관세, 주선 = 노선 운임, 개정 3e). 원화 매입액을 더하지 않는다.
  - 원화 선택 지출 접두어 목록(`operations.ts:284-285`)에 `PURCHASE-`를 더하고, **`PURCHASE-` 분개만** 창을 `oldest.incurredDay − failureAgeDays ≤ e.day ≤ 실패일`로 넓힌다(허브 결정 H13, 검토 R18 가). 그래서 미지급 발생일 뒤에 받은 원화 매입 계약도 원인 기록에 남는다. 옛 시나리오에는 원화 `PURCHASE-`가 없어 rules-2 출력은 그대로다. 새 상태 칸은 없다. SPEC 423의 접두어 목록과 창 정의(`PURCHASE-`는 실패일까지) 수정은 허브 몫이다(검토 n28). 칸 이름 `optionalKrwSpendBeforeFirstUnpaid`와 화면 제목(`money-alerts.ts:30` ‘첫 미지급 전 … 원화 선택 지출’)의 뜻 어긋남은 0062 결과 보고 ‘범위 밖 발견’과 경로 11 지시서 목록에 넣는다.
- **계약 보고서(허브 결정 H13, 검토 R17).** 서명을 `contractReport(s, contract, currency = contract.currency)`로 고정한다. 장부는 넘긴 통화로 읽고, 기존 칸(`contribution` 등)은 그 통화 몫이라고 주석에 적는다. `campaignSummary`의 통화별 계약 기여는 그 통화에 분개가 있는 계약을 모두 센다. rules-2에서는 계약이 단일 통화라 바이트가 같다. 실행기 지표(`sim/**`)는 고치지 않으므로, rules-3의 d03 ⑤ J7(옛 정의)·⑦은 USD 몫만이라는 진단 표지를 붙인다(판정표 3.1). 두 통화를 더한 값을 만들지 않는다.
- **출항 전 취소·편 놓침.** 매입(원화)은 돌려받지 못한다(공급자 반품 없음). 운임 환급·취소비는 달러다. 지금 규칙의 금액을 통화별로 나눠 적용한다.

### 3.4 견적 미리보기와 계약 손익 읽기 함수

**미리보기(허브 결정 H0)**
- `preview`(`reports.ts:85`)에 맨 끝 선택 인수 `opts?: { goodId?: string; purchaseCurrency?: Currency }`를 더한다. 인수가 없으면 rules-2 결과가 바이트로 같다. `tradePreview`·`quotePreview`는 품목과 매입 통화를 넘긴다.
  - rules-3에서 `opts.purchaseCurrency`가 없으면 `rowCurrency(config, 'BUY')`로 정한다(검토 m23). rules-3 직접 무역에서 `opts` 없이(또는 `goodId` 없이) 부르면 예외다(3.3). 실행기 호출은 경로 5에서 고친다(H15 O11).
- 참고 환율의 시드: `preview`는 `config.seed`, 상태를 받는 읽기 함수(`quotePreview`, `contractRiskReport`)는 `s.rng.seed`를 쓴다. 두 값이 같다는 전제를 주석에 적고, rules-3 시험에서 같음을 단언한다.
- 기존 칸은 **통화별 그대로**다.
  - `purchase`는 매입 통화(원) 금액, `freight`·`duty`·`sale`은 USD 금액이다.
  - `cashNeed`는 rules-3에서 **USD 부분만**(운임 + 관세 예상, 센트) 담고 그 뜻을 주석에 적는다. 화면(`main.ts:508`)의 타입을 깨지 않게 `number`로 둔다.
  - `contributionBeforePayroll`은 rules-3에서 **USD 줄만의 합**(판매 − 운임 − 관세)이다. 원화 매입을 빼지 않는다. 주석에 ‘원화 매입 제외, 판단 값 아님’이라고 적는다.
  - 이 값에서 나오는 `contributionPerPrepPtMinor`(`readers.ts:89`, 화면 `market.ts:42`의 ‘준비 1pt당 기여이익’)도 rules-3에서는 같은 뜻이다. 같은 주석을 달고, 경로 11 지시서에서 rules-3 화면에 쓰지 않게 적는다(검토 m24).
- rules-3에서만 내는 새 칸(저장하지 않음).
  - `cashNeedByCurrency: { currency, amountMinor }[]`: 통화별 필요 자금. 자금 검사의 통화별 기준과 같은 값이다(시험).
  - `referenceEstimate: { rateKrwPerUsd, saleKrw, pnlKrw }`: 그날 참고 환율로 바꾼 추정 원화 손익. 이름과 주석에 ‘추정, 환율이 바뀌면 달라짐’을 밝힌다. 식은 다음으로 고정한다(허브 결정 H14-3).
    - `rateKrwPerUsd = referenceRate(config, config.seed, bookingDay)`
    - `saleKrw = usdToKrwMinor(p.sale, rate)`. `p.sale`은 미리보기의 sale, 곧 다음 첫 편 늦은 감액 뒤의 값이다.
    - 매입 KRW: `pnlKrw = saleKrw − p.purchase(원) − usdToKrwMinor(p.freight + p.duty, rate)`. 매입 USD(방어 분기): `pnlKrw = saleKrw − usdToKrwMinor(p.purchase + p.freight + p.duty, rate)`.
    - `contractRiskReport`의 0단계 기대(직접 무역)는 수락일의 이 `pnlKrw`다.
  - `schedule`의 **모든 줄**에 `currency`를 넣는다(검토 m25). 원화 ‘매입 대금 지급’ 줄은 원 단위 금액에 `currency: 'KRW'`, 나머지는 `'USD'`. 일정에는 환산값을 넣지 않는다(실제로 오가는 현금이기 때문이다). rules-2에서는 이 칸을 넣지 않는다.

**계약 손익 읽기 함수 `contractRiskReport(state, config, contractId)`(허브 결정 H6)**
- 대상: 직접 무역과 **주선** 계약 모두. 주선에서는 `schedule`·`fx`·`late`·`cancel`·`open_valuation`만 채우고 나머지는 0이다.
- **위치(H14-5, 검토 S3·n43).** `contractRiskReport`는 `reports.ts`에 둔다. 환율은 `risk.ts`에서 import한 `referenceRate`로만 부른다. 그래서 누설 시험이 모듈 경계(`vi.mock('./risk')`)에서 환율을 바꿀 수 있다.
- 허용 조건(H6): 상태·장부·저장·결산·실패 기록에 들어가지 않는다. 화면에 보일 때는 ‘추정, 환율이 바뀌면 달라짐’ 표지를 늘 붙인다.
- **출력의 `evaluationDay`(H15 O1).** 아래 평가일을 출력 칸 `evaluationDay`로 함께 낸다(저장하지 않음). 시험이 실패 종료에서 `evaluationDay === failure.day`이고 `!== s.day`임을 단언한다.
- **평가일(H6-2·H14-5, 검토 m4·R20·n1).** 끝난 상태(`phase === 'ENDED'`)에서는 실패로 끝났으면 `operations.failure.day`, 그 밖이면 `config.campaignDays`다. 끝나지 않은 상태에서는 `s.day`다. 실패 뒤의 `s.day`(실패일 + 1)는 쓰지 않는다. 엔진은 실패한 날 다음 묶음을 공개하지 않으므로, 실패일 + 1의 환율은 공개된 적이 없는 값일 수 있다. 평가일보다 뒤의 날짜(앞으로 올 결제일·도착일)의 환율과 아직 공지되지 않은 사건은 쓰지 않는다.
- **R0(rules-2 상태, H6-4·검토 R4·R21).** rules-2 상태도 받는다. 위험 설정이 없으면 환율은 `config.operations.fx.baseKrwPerUsd`(1,300) 고정이고 `components.fx = 0`, `residual = 0`이다. 실행기에서는 `--risk R0` 출력에서만 부르고, rules-2 골든 명령(`--risk` 없음)의 출력에는 이 값이 들어가지 않는다. 시험(H14-2): 미지급이 없는 끝난(`COMPLETED`) 직접 무역 계약마다 `realized(원) = contractReport(s, c).contribution(센트) × (baseKrwPerUsd ÷ 100)`. 13 같은 상수를 시험에 쓰지 않고 `baseKrwPerUsd`에서 계산한다.
- 용어(검토 17번): ‘약정 결제일’ = `contract.paymentDueDay`, ‘청구 결제일’ = `invoice.dueDay` = max(약정 결제일, 실제 인도일).
- `expected`(기대 원화 마진): 수락일에 미리보기를 다시 계산한 값이다. 수락일 참고 환율, 수락일 다음 첫 출항편, 수락일까지 공지된 관세, 부대비 0, 클레임 0, 약정 결제일 정시 전액. 직접 무역은 수락일 미리보기의 `referenceEstimate.pnlKrw`와 같다(시험). 저장하지 않고 다시 계산한다(입력은 견적·수량·수락일·시드뿐).
- `realized`(실현 원화 마진): 현금 기준. 그 계약에 붙은 현금 줄(매입 지급, 운임 지급, 관세·부대비 지급 또는 그 미지급이 갚아진 날, 취소 환급(`FREIGHT-RELEASE-`의 `CASH` 줄)·고객 취소 보상(`CANCEL-COMP-`의 `CASH` 줄), 수금. 선급 운임에서 뺀 취소비는 현금 줄이 아니라 따로 세지 않는다)마다 달러는 그 현금이 오간 날의 참고 환율로 바꾼다. 손익 분개(인도일 매출, 재고 대체)는 세지 않는다.
  - **열린 계약(검토 m5·m6·m22·n4·n46).** 평가일에 받을 채권 잔액, 운송 중·출항 전 판매, 아직 내지 않은 운임, 도착 전 계약의 관세 예상, 미지급 잔액 가운데 하나라도 0이 아니면 열린 계약이다(상태와 무관). 열린 계약의 `realized = 현금 줄 + 남은 흐름 × 평가일 참고 환율`이다. 손실 판정은 이 값을 쓴다. 판정표 2절의 분류는 겹치지 않는다: 열린, 완료(`COMPLETED`이고 열리지 않음), 취소(`CANCELLED`이고 열리지 않음).
    - 받을 채권 = 청구액 − 원장의 받은 금액.
    - 운송 중 판매 = 계약 판매액 − 예정 반출일 기준 늦은 감액(클레임·지연 제외). 출항 전 계약은 예약 출항편 기준 기대 흐름으로 평가한다.
    - 관세 예상은 `DUTY-` 분개가 아직 없는(도착 전) 계약에만 쓴다: 3.3 표 `contractRiskReport` 행의 도착 전 값(자금 예약 규칙의 날 / 평가일 / 수락일). 도착 뒤 미지급 관세는 미지급 잔액으로만 센다(이중 차감 방지).
    - `openFixedRateKrw` = 같은 계약의 `realized`에서 남은 흐름만 고정 `baseKrwPerUsd`(1,300)로 평가한 값(계약 전체 마진). 민감도로만 낸다.
- `components`: **순차 대체.** 기대에서 출발해 아래 순서로 실제 값을 하나씩 바꿔 넣고, 바뀐 만큼을 그 칸에 적는다.

| 순서 | 칸 | 바꾸는 것 | 이 단계의 평가 환율 |
|---|---|---|---|
| 0 | (기대) | — | 모든 줄 수락일 |
| 1 | `schedule` | 실제 출항편으로 날짜만 옮김. 관세 금액은 0단계 값 그대로다(세율 차이는 모두 3단계가 맡는다, 검토 S2·n22). **구성상 0**이다(2단계가 쓸 날짜를 정하는 단계, 개정 3d) | 수락일 그대로 |
| 2 | `fx` | 각 줄의 평가 환율을 그 줄의 날짜 환율로: 운임은 예약일, 관세·부대비는 지급일(미지급이면 갚은 날), 수금은 청구 결제일. **평가일 뒤의 날짜는 평가일 환율** | 줄마다 그날(평가일까지) |
| 3 | `tariff` | 도착한 계약: `DUTY-` 분개의 관세. 도착 전: 3.3 표 `contractRiskReport` 행의 도착 전 값(공지 기준일 = 평가일) | 2와 같음 |
| 4 | `surcharge` | 출항한 계약: `SURCHARGE-` 분개. 출항 전: 0 | 2와 같음 |
| 5 | `late` | 늦은 인도 감액 | 2와 같음 |
| 6 | `claim` | 인도한 계약: `CLAIM-` 분개. 인도 전: 0 | 2와 같음 |
| 7 | `cancel` | 출항 전 취소·편 놓침의 환급·취소비·재예약. **취소 계약**: 1·2·5단계는 일어난 줄(매입, 첫 운임 선지급)만 옮기고 바꾸며, 일어나지 않은 줄(판매, 관세, 내지 않은 운임)은 0단계 원화값 그대로 두었다가 이 단계에서 뺀다. 이 단계에 새로 넣는 줄은 원장 `CASH` 줄뿐이다: 환급(`FREIGHT-RELEASE-`의 `CASH` 줄)과 고객 취소 보상(`CANCEL-COMP-`의 `CASH` 줄)을 그 분개 날의 환율로 넣는다. 취소비(`CANCELLATION_EXPENSE` 줄)는 현금 줄이 아니라 넣지 않는다(선급 운임 − 환급에 이미 들어 있다). **편 놓침**: 첫 예약의 `FREIGHT-PREPAY-`를 기대 운임 줄로 보고, 모든 환급(`CASH` 줄)과 첫 예약 뒤의 재예약 선지급(`CASH` 줄)을 넣는다(개정 3d·3e) | 2와 같음(새 줄은 그 분개 날) |
| 8 | `collection` | 수금 줄의 환율을 청구 결제일 → 실제 수금일로(지연·부분). 수금은 **원장 `RECEIPT-` 분개로만** 읽는다. 평가일까지 들어오지 않은 줄은 평가일 환율 | 수금 줄만 |
| 9 | `open_valuation` | **구성상 0**(2·8단계의 평가일 상한 때문에 남은 흐름은 8단계까지 이미 평가일 환율이다). `open: true` 표지만 남긴다(H14-5) | — |
| 10 | `residual` | 남은 차이. **늘 0이어야 한다**(시험) | — |

- **평가일까지 일어난 사건만(H14-5, 검토 S1).** 3·4·6·8단계에는 발생일 ≤ 평가일인 사건만 넣는다. `contractRiskReport`는 `tariffEvents`(공지 전 사건), `surchargeBp`, `claimFor`, `collectionPlan`의 미래 값을 쓰지 않는다. 특히 `collectionPlan`은 부르지 않는다.
- 채울 칸: TASK-0062는 0·1·2·5·7·9(0)·10, 0063은 3·4, 0064는 6·8.
- 모든 금액은 원 단위 정수다. 환산은 `usdToKrwMinor` 하나로 한다(3.3).
- **환산 꼴(H15 O3).** 각 단계의 합계는 줄마다 `usdToKrwMinor`로 바꿔 더한다. 다만 같은 평가 환율을 쓰는 USD 비용 줄(운임·관세·부대비)은 합친 뒤 한 번만 바꾼다. 그래야 0단계가 `referenceEstimate.pnlKrw`(`usdToKrwMinor(freight + duty, rate)`)와 정확히 같다. 시험 식도 같은 꼴로 쓴다. 예: 연체 미수의 `collection = usdToKrwMinor(남은 금액, 평가일 환율) − usdToKrwMinor(남은 금액, 청구 결제일 환율)`.
- 실행기 판정(L0~L3, J7 새 정의)과 경로 11 화면이 이 함수 하나를 쓴다. 화면에서 다시 계산하지 않는다. 화면은 rules-3 상태에서만 부른다(H6-4. R0은 `--risk R0` 실행기 출력에서만). 경로 11 화면은 통화별 현금 줄과 `components`를 ‘추정, 환율이 바뀌면 달라짐’ 표지(H6-3)와 함께 보이고 원화 틀을 기본으로 한다. 문구는 경로 11 지시서에서 정한다(검토 n6).

### 3.5 학생이 할 수 있는 판단

- **언제 달러를 원화로 바꿀까.** 지금 환전 명령 그대로이고 환율만 움직인다. 평균 0인 독립 걸음이라 **예측으로 이길 수 없다.** 원화가 필요한 만큼 제때 바꿔 노출을 줄이는 판단이다.
- **얇은 마진 견적을 받을까.** 원화가 강세로 가면 손실이 난다. 판정표 `MARGIN_BUFFER`가 이 판단을 잰다.
- **시장(결제 9일·11일)을 골라 노출 기간을 줄이는 판단은 R1에 없다.** 두 시장 모두 수락 주의 다음 주에 수금하므로 환율 걸음은 1번이다. 결제 조건을 늘리면 `market.ts:60`의 ‘결제일 > 캠페인 일수면 견적 생략’ 때문에 71·78일 묶음 견적이 사라져 비교가 흔들린다. 그래서 이 지렛대를 설계에서 뺀다. 노출 기간 차이는 R3의 거래처 신용등급(5.2)으로만 생긴다.
- 선물환 같은 헤지는 넣지 않는다(경로 9 정책 그물의 ‘헤지 0/100%’).

## 4. ② 관세 변경과 출항 부대비 (TASK-0063)

### 4.1 계약 뒤 관세 변경

- **전제.** 지금 직접 무역은 회사가 도착국 관세를 내는 DDP 유사 구조다(PLAN, 딥리서치 [7][13]). 그래서 도착국(중국·베트남) 관세 변경이 회사 원가에 닿는다. 인코텀즈 선택은 경로 6이다.
- **적용 세율 = 신고일(도착일) 세율(허브 결정 H5-5 (a)).** 중국은 신고를 마친 날의 세율을 적용한다(딥리서치 보고서). 한국 관세법 제17조도 같은 원칙이다. 베트남은 확인하지 않았다(세션 C). 게임은 ‘도착일 세율’을 가정으로 두고 교사용 자료에 가정임을 밝힌다. 세율은 가상값이다.
- **공지와 시행 사이를 짧게 둔다.** 정시 계약은 P일 수락, P+1 출항, P+5(상해)·P+6(하이퐁) 도착이다. 그래서 시행일 = 공지일 + `[0, 3]`일 정수 균등(흐름 `…:lag`)으로 둔다. 수락 뒤 공지된 변경이 정시 계약의 도착 전에 시행될 수 있다. 실제로도 공지 뒤 며칠 만에 시행되는 관세 조치가 있다(예: 2025년 4월 중국의 대미 추가관세는 공지 1~6일 뒤 시행).
  - **가정(교사용 자료 목록에 넣는다, 검토 m19).** 실제 급한 관세 조치는 시행 전 선적 화물을 빼 주는 경과 규정을 자주 둔다(위 예도 그렇다). 게임은 계약 뒤 원가 위험 장면을 만들려고 이를 생략한다. 경과 규정(출항일 < 시행일이면 옛 세율)은 v2 후보다. 넣으면 진단 T가 다시 0에 가까워지므로 이번 판본에는 넣지 않는다.
  - **‘정시 계약’의 정의(검토 m20).** 납기 안에 도착하는 편으로 간 계약이다: 도착 + 통관 ≤ 납기, 수락 때 미리보기 `lateOnNextSailing === false`. ‘수락 다음 첫 편’은 늦은 계약을 포함할 수 있어 쓰지 않는다.
- **사건 하나의 범위.** 사건 하나는 도착국 하나에 걸린다.
  - 같은 걸음을 그 나라 `tariff.base`의 모든 품목에 더하고, 품목마다 따로 `[min_bp, max_bp]`로 자른다.
  - 그래서 같은 나라 두 품목의 세율 차이는 자르기가 없으면 그대로이고, 순서(a ≤ b)는 자르기가 있어도 뒤집히지 않는다(시험). 시작 프로필은 두 품목의 세율이 같아서(a = b) 이 시험은 프로필 사본에서 두 품목의 기준 세율을 서로 다르게 바꾼 설정으로 한다(검토 n19). 이 차이가 HS가 바뀌면 세율이 바뀐다는 학습 장면(경로 7)의 바탕이다.
  - 흐름 이름에는 품목을 넣지 않는다. 품목마다 따로 뽑지 않는다.
  - 걸음을 적용해도 어느 품목의 세율도 바뀌지 않으면(모두 경계에 있음) 사건을 내지 않는다.
  - 기준 세율 예시는 0보다 크게 둔다. 0에서 음수 걸음이 잘려 인상 쪽으로만 쏠리지 않게 하기 위해서다.
- **일정.** 순수 함수 `tariffEvents(config, seed)`다. 도착국마다 횟수 0~`max_changes`(흐름 `TARIFF:{국가}:count`), 회차마다 공지일(`…:{회차}:notice`)·지연(`…:lag`)·걸음(`…:step`). 시행일은 캠페인 끝을 넘지 않는다.
  - **적용 순서(검토 m21).** 세율은 시행일 순(동점은 공지일, 그다음 회차 번호)으로 누적 적용한다. 무의미 사건 판정과 로그의 옛 세율 a는 그 사건 직전에 시행 중인 세율 기준이다.
- **반영.** 미리보기 관세 예상은 오늘까지 공지된 변경만 반영한다(도착 예정일 기준 세율). 공지일 아침에 로그를 남긴다: ‘{도착국} 관세 일괄 변경(가상 세율): {품목} a% → b%, …’(검토 n19). 읽기 함수 `tariffSchedule(state, config)`는 오늘까지 공지된 사건만 돌려준다.
- **진단 T.** R2에서 정시 계약이 수락일 기대와 다른 세율을 만나는 비율을 판정표에 진단값으로 적는다.
- 학습: 일반계 [12경제04-02] 관세의 효과, 특성화고 [수입 05-05-02] 세율 확정, O2.

### 4.2 출항 주 부대비

- **현실 근거.** 해상 운임에는 예약 뒤 붙거나 바뀌는 할증(유류·혼잡·성수기)이 있다. 게임에서는 이름을 하나(‘출항 부대비’)로 묶는다. 실제 할증 이름과 요율을 흉내 내지 않는다.
- **규칙.**
  - 노선·주차마다 부대비율 `surchargeBp(route, week)`. 확률 `p_zero_bp`로 0, 아니면 `[min_bp, max_bp]` 정수 균등. 흐름 `SURCHARGE:{노선}:{주차}:zero`, `…:value`.
  - **직접 무역 예약의 출항일에** 예약 운임 × 그 주 부대비율을 USD로 낸다(`payOrAccrue`, 미지급 규칙 그대로). 0이면 분개를 내지 않는다. 분개 ID `SURCHARGE-{예약}`.
  - 혼합 통화 계약은 계약 ID의 USD 재고 분개로만 쌓는다. 단일 통화 계약은 rules-2처럼 화물 장부가에도 더한다(분기: 매입 통화 ≠ 판매 통화).
  - **주선 화물에는 붙이지 않는다.** 실무처럼 화주에게 넘긴다(회사 장부에 생기지 않는다). 회사가 떠안게 하면 비현실적이고, 기여의 약 73%인 주선 경제(TASK-0032)를 흔들어 J2·J6·J7이 위험 규칙과 상관없는 이유로 바뀐다.
  - 수락·예약 때는 그 주 값을 알 수 없다. 미리보기에는 상한(`surchargeMaxBp`)만 준다. 기대 마진에는 넣지 않는다.
- `contractRiskReport.components`의 `tariff`, `surcharge`를 채운다.

## 5. ③ 클레임과 미수 (TASK-0064)

### 5.1 화물 손상 클레임

- **분포(검토 10번).** 작은 클레임이 흔하고 큰 손상은 드물다.
  - 손상 여부: 계약마다 확률 `p_claim_bp`. 품목의 **공개 파손 위험 등급**(가상값, 예: 화장품은 병·누액 때문에 ‘중’, 조미김은 ‘하’)이 확률을 정한다. 시작값은 등급 MID 900(화장품), LOW 500(조미김·의류·마른김)이다(허브 결정 H11, 6절). 개정 3에서 의류를 400에서 500으로 고쳐 ‘등급이 확률을 정한다’와 맞췄다(검토 n17).
  - **게임 가정(검토 R28).** 해상 컨테이너 선적당 클레임 빈도의 1차 출처는 찾지 못했다(미확인). 참고값은 미국 LTL 화물 손상률 0.5~1.5%다. 게임은 현실보다 잦게 둔 압축(한 판에 한 번쯤 겪게)이다. 실제로는 적하보험·운송인 청구(헤이그-비스비 책임 한도)로 일부를 회수한다. 이 게임은 회수가 없다는 가정이다.
  - 손상이면 층을 뽑는다: 작은 손상(가중치 `claims.minor.weight_bp`, 판매액의 1~5%) 또는 큰 손상(`claims.major.weight_bp`, 15~30%).
  - 손상률 하한(1%)은 `MARGIN_BUFFER` 문턱(10%)보다 확실히 낮다. 그래서 작은 클레임은 마진 여유로 흡수되고, 큰 클레임만 손실이 된다.
- **추첨 키(검토 43번).** 계약 순번(`CT{n}`)이 아니라 **판매 견적 ID**(`contract.sellOfferId`)다. 흐름 `CLAIM:{판매 견적}:hit`, `…:tier`, `…:rate`. 같은 견적은 정책이 달라도 같은 추첨을 받는다(공통 난수). 주선을 하나 더 받아 순번을 밀어 손상을 피하는 공략도 막는다.
- **함수의 자리와 서명(H15 O4·O13).** `claimFor(config, seed, sellOfferId, goodId)`와 `collectionPlan(config, seed, sellOfferId, counterpartyId)`는 `risk.ts`에 둔다. 추첨 키는 `sellOfferId` 그대로다. 프로필 누락 예외는 직접 무역의 품목·판매 거래처로 한정한다. `contractRiskReport`·`receivableSchedule`은 두 함수를 부르지 않는다(시험이 `vi.mock('./risk')` 감시로 호출 0회를 단언).
- **분개.** 새 계정 `SALES_ALLOWANCE`(매출 에누리), 분개 `CLAIM-{계약}`(매출 에누리 / 매출채권). 늦은 인도 감액(`priceReductionMinor`)과 따로 둔다. `ACCOUNT_KIND`는 `income`(매출 차감 계정, 차변 잔액)이고, rules-3 `contractReport`의 순매출(`netRevenue`)에 더해 클레임만큼 순매출이 준다(H14-10, 검토 n26). `ledger.ts` `summarize`의 profit 식에 `SALES_ALLOWANCE` 잔액(음수)을 더한다. `BookSummary`에 새 필수 칸은 두지 않는다(H15 O2. 빠뜨리면 마감의 순자산 항등식이 깨진다). rules-2에는 이 분개가 없어 바이트가 같다. 둘 다 있으면 늦은 감액 뒤 남은 판매액에 손상률을 곱한다(USD 센트, half-up).
- 보험은 없다(경로 7·9). 주선 화물은 제외한다(운송인 책임 한도 문제라 경로 7).

### 5.2 지연·부분 수금

- **확률은 거래처의 공개 신용등급에 묶는다(검토 11번 B안).** 판매 거래처마다 가상 신용등급(A·B·C)을 두고, 등급마다 정시·지연·부분 확률을 둔다. 등급은 견적 미리보기 읽기 함수로 수락 전에 볼 수 있다(화면은 경로 11). `riskGrades`는 rules-3 직접 무역 견적에만 내고 주선은 null이다(H15 O13).
  - 시작값(허브 결정 H11): 지연 확률 A 1000, B 2000, C 3000. 부분 수금 확률(`p_partial_bp`) A 500, B 1000, C 1500(고정). 부분 수금의 첫 수금 비율(`partial_bp`)은 5000(고정, 검토 n47). 정시가 아닌 비율은 A 15%, B 30%, C 45%다. 참고: Atradius 2025 아시아 조사의 지연 지급 비율 44%(지역 평균, 국가별 수치 아님, 한국은 조사 대상 밖, 세션 C 원문 확인 전).
  - 국가·도시 단위로 묶지 않는다. 보이는 원인 없이 도시에 위험을 붙이면 ‘중국·베트남 고객은 늦게 낸다’는 고정관념으로 읽힐 수 있기 때문이다.
  - 등급은 가상값이다. 실재 기업 신용평가를 흉내 내지 않는다. 교사용 자료에 성격을 밝힌다.
- **추첨 키.** 판매 견적 ID. 흐름 `COLLECT:{판매 견적}:mode`, `…:days`. 주선 청구서는 제외한다(지금처럼 정시 전액).
- **방식.** 정시(지금과 같음), 지연(청구 결제일 + `[late_min, late_max]`일에 전액), 부분(청구 결제일에 `partial_bp` 몫, 나머지는 + `[late_min, late_max]`일).
- **상태 표현.** 청구서의 `dueDay`(청구 결제일)는 그대로 둔다. 실제 수금은 `processCollections`가 순수 함수 `collectionPlan`을 읽어 처리한다.
  - 부분 수금은 `receiptIds`에 두 번째 수금 ID를 더한다. 수금 ID는 지금 꼴(`RCPT-{청구서}`, 분개 `RECEIPT-RCPT-{청구서}`, `engine.ts:1117`)에 `-1`, `-2`를 붙인다. 금액은 원장에서 읽는다. **청구서에 새 칸을 두지 않는다.**
  - 상태 전이(H14-10, 검토 n29·n37): 날 d의 마감에서 **수금 처리 뒤에**, d ≥ `dueDay`이고 남은 금액 > 0이면 `OVERDUE`, 다 받으면 `PAID`. 그래서 결제일 D 다음 상태(`s.day` = D+1)에서는 `OVERDUE`와 `overdueDays = 1`이 함께 보인다. 지금 엔진은 `OVERDUE`로 바꾼 적이 없다. rules-2에서는 이 상태에 들어가지 않는다.
- **읽기 함수(검토 42·44·45번).**
  - 새 함수 `receivableSchedule(s, config)`(`reports.ts`): 미수 청구서마다 `{ invoiceId, contractId, currency, dueDay, outstandingMinor, overdueDays }`. `outstandingMinor` = 청구액 − 원장의 받은 금액, `overdueDays` = max(0, s.day − dueDay). 정렬은 `dueDay`, 그다음 `invoiceId`. `collectionPlan`을 부르지 않는다(미래 누설 금지).
  - `upcomingPayments`·`UpcomingPaymentKind`는 손대지 않는다(지급 일정이다. 수금 종류를 더하면 `src/ui/schedule.ts:94`의 never 분기가 깨진다).
  - `campaignSummary.openInvoices.amountMinor`는 남은 금액으로 낸다. rules-2에서는 지금 값과 같다.
  - `paymentDefaultStatus.recovery.nextReceipt`(`operations.ts:241·252`)는 **지금 규칙을 유지한다**(허브 결정 H13, 검토 R25 b). 연체 청구서의 연체 여부와 남은 금액은 `receivableSchedule`이 보인다. 연체(지연·부분) 청구서가 있으면 `nextReceipt`는 지난 결제일을 내고, 부분 수금 뒤에는 금액도 청구 전액이다(`operations.ts:241`은 `dueDay`로 거르지 않는다). 이 한계와 화면 문구(`money-alerts.ts:19`)를 결과 보고 ‘범위 밖 발견’에 적는다(검토 n30).
  - `progress.ts`의 `contractProgress`, `src/ui/schedule.ts:73-74`, `main.ts:400`은 고칠 수 없는 파일이다. rules-3이 화면에 없으므로 결과 보고의 ‘범위 밖 발견’에 적는다.
- **비용의 한계.** 캠페인 끝에 남은 채권은 채권으로 남는다(분석값 반영은 경로 5 실행기 지시서에서 확인한다). 대손은 이번에 없다. 미수의 비용은 ① 환율 노출이 길어지는 것과 ② 원화 급여 압박(환전 시점)뿐이다. **이자 비용이 없다는 한계**를 교사용 자료와 결과 보고에 적는다.
- 지급 불이행 규칙은 회사의 지급 의무만 본다. 고객 미수가 회사 미지급으로 이어지면 기존 규칙대로 경고·실패가 된다. J1이 지켜볼 곳이다.
- `components`의 `claim`, `collection`을 채운다.

## 6. 자료 형태

- `data/market_rules.json`에 `risk_profiles` 배열을 더한다. **모든 변형·위험 단계가 같은 프로필 하나를 쓴다**(판정표 5절).

**시작 프로필 전체(허브 결정 H10-8·H11, 검토 R10).** 모든 값이 판정표 5.2의 허용 범위 안이다.

```json
{
  "id": "RISK_PROFILE_DEFAULT",
  "data_basis": "DESIGN",
  "status": "PRE_TUNING_2026-10-16",
  "basis": "fictional_game_values_not_calibrated",
  "fx": { "start_krw_per_usd": 1300, "step_bp": 250, "min_krw_per_usd": 1170, "max_krw_per_usd": 1430 },
  "tariff": {
    "base": [
      { "country_code": "CN", "good_id": "APPAREL", "rate_bp": 500 },
      { "country_code": "CN", "good_id": "COSMETICS", "rate_bp": 500 },
      { "country_code": "VN", "good_id": "APPAREL", "rate_bp": 500 },
      { "country_code": "VN", "good_id": "COSMETICS", "rate_bp": 500 }
    ],
    "max_changes": 2, "lag_days": [0, 3], "step_bp": [-200, 800], "min_bp": 0, "max_bp": 3000,
    "basis": "fictional_uniform_equal_to_rules2_5pct",
    "status": "DESIGN_not_actual_destination_tariff"
  },
  "surcharge": { "p_zero_bp": 7000, "min_bp": 500, "max_bp": 3000 },
  "claims": {
    "by_good": [
      { "good_id": "COSMETICS", "grade": "MID", "p_claim_bp": 900 },
      { "good_id": "APPAREL", "grade": "LOW", "p_claim_bp": 500 }
    ],
    "basis": "fictional_damage_grade",
    "minor": { "weight_bp": 8000, "min_bp": 100, "max_bp": 500 },
    "major": { "weight_bp": 2000, "min_bp": 1500, "max_bp": 3000 }
  },
  "collections": {
    "by_counterparty": [
      { "counterparty_id": "CUSTOMER_DEMO", "grade": "A" },
      { "counterparty_id": "CUSTOMER_SHA_APPAREL", "grade": "B" },
      { "counterparty_id": "CUSTOMER_HAI_COSMETICS", "grade": "C" },
      { "counterparty_id": "CUSTOMER_DEMO_SHANGHAI", "grade": "B" }
    ],
    "basis": "fictional_grade",
    "grades": [
      { "grade": "A", "p_on_time_bp": 8500, "p_late_bp": 1000, "p_partial_bp": 500 },
      { "grade": "B", "p_on_time_bp": 7000, "p_late_bp": 2000, "p_partial_bp": 1000 },
      { "grade": "C", "p_on_time_bp": 5500, "p_late_bp": 3000, "p_partial_bp": 1500 }
    ],
    "partial_bp": 5000, "late_min_days": 5, "late_max_days": 15
  }
}
```

- **기준 세율을 모두 500(5%)으로 둔 이유.** 지금 운영 시나리오의 고정 세율이 5%다(`scenarios.json:35·303`). 기준 세율이 다르면 R1→R2 변화에 ‘변경 사건’과 무관한 수준 차이가 섞인다. 품목·국가별 세율 차이(조미김의 한-중 FTA 0% 등)는 경로 7에서 넣는다.
- **TASK-0065가 더할 값(이 문서로 미리 고정, 동결 범위).**
  - 조미김 품목 행: 기준 세율 CN·VN 500, `p_claim_bp` 500(등급 LOW). 마른김 행(LOW 500, 세율 500)은 `goods`에 마른김이 있을 때만 넣는다(이 판본의 (다)는 조미김 한 형태다).
  - (나)·(다)는 **새 판매 거래처 ID**를 쓴다(허브 결정 H14-9). 시장 자료 `counterparties`와 프로필 `by_counterparty`에 함께 더한다.

    | 새 거래처 ID | 쓰는 변형 | 판매 도시 | 품목 | 등급 |
    |---|---|---|---|---|
    | `CUSTOMER_HAI_COSMETICS_NEW` | (나)·(다) | 하이퐁 | 화장품 | B |
    | `CUSTOMER_SHA_COSMETICS_NEW` | (나)·(다) | 상해 | 화장품 | B |
    | `CUSTOMER_HAI_LAVER` | (다) | 하이퐁 | 조미김 | C |
    | `CUSTOMER_SHA_LAVER` | (다) | 상해 | 조미김 | C |

  - TASK-0065는 (나)·(다) rule_set에 `COSMETICS`를 반드시 둔다(판정표 6.2 `FOCUS`).
- **거래처 등급 배정(H14-9, 검토 S13).**
  - (가)는 측정용 다리 변형이고 학생에게 보이지 않으므로 위 프로필의 배정(하이퐁 의류 A·하이퐁 화장품 C, 상해 의류 B·상해 화장품 B)을 그대로 둔다. 개정 2의 ‘두 도시 모두에 A·B·C가 섞임’은 사실과 달랐다(상해는 B뿐이다).
  - 학생이 보는 (나)·(다)에서는 등급이 나라가 아니라 **품목군**을 따라 갈린다: 화장품 판매처는 두 도시 모두 B, 김 판매처는 두 도시 모두 C다. 게임 설정은 ‘새 품목군의 거래처는 거래 이력이 짧다(가상)’이다. 이 설정은 ‘좁게 시작해 넓히기’에서 넓히는 쪽의 위험을 보여 준다.
  - 화면은 등급을 거래처의 속성으로 보인다.

- 확률·비율은 모두 정수 bp, 날은 정수 일이다(PLAN 경로 9 원칙). 수치는 **조정 전 설계값**이다. 판정표 5절의 손잡이로만, 정한 범위 안에서 바꾼다.
- `tariff.base`는 모든 변형의 품목을 담는다. 김 품목 ID는 TASK-0065가 `goods.json`에 더하므로, 0062는 의류·화장품 행만 넣고 TASK-0065가 김 행을 같은 값으로 더한다. **프로필에 없는 (도착국, 품목)·품목·거래처가 실행 중에 나오면 예외를 낸다(H14-10, 검토 n41).** 조용히 대체하지 않는다. 실제 HS·세율은 세션 C 확인 뒤 경로 7에서 바꾼다. 그 전에는 가상값이고 `basis`·`status` 표지로 밝힌다(검토 n19).
- 시나리오의 `operations.risk`: `{ "profile_id": "...", "layers": ["FX", "TARIFF", "SURCHARGE", "CLAIM", "COLLECTION"] }`. rules-3 시나리오 레코드의 로더 분기·스키마는 TASK-0065(또는 그 뒤)에서 넣는다(검토 38번). 0062는 타입과 프로필 검사만 넣는다.
- 검사기(`tools/validate_data.py`):
  - 프로필 참조, bp 범위(0~10000), 최소 ≤ 최대.
  - 등급마다 확률 합(`p_on_time + p_late + p_partial = 10000`), 손상 두 층 가중치 합 = 10000.
  - 세율 표·파손 등급의 품목이 품목 자료(`goods`)에 있는지(시나리오가 아니라 품목 자료 기준이다. 공유 프로필을 가리키는 (나) 시나리오가 의류 행 때문에 FAIL하지 않게).
  - 신용등급 표의 거래처가 시장 자료에 있는지.
  - **반대 방향(H14-10, 검토 n21·n41).** 운영 rule_set(`engine_rules.rules_version`이 M2a-rules-2 이상인 시나리오의 `operations.market_rules_ref`에서 # 뒤의 rule_set id. `base_scenario_id` 상속 포함, H15 F7)마다: 모든 직접 무역 판매 거래처(`trade.goods[].sell_counterparties[].counterparty_id`)가 `by_counterparty`에 있다, 모든 `trade.goods`가 `claims.by_good`에 있다, 모든 (판매 도시의 나라(`world.json`의 `country_code`), `trade.goods`) 쌍이 `tariff.base`에 있다.
  - `start_krw_per_usd` = `fx_krw_per_usd`.

## 7. 측정과 개발용 설정

- **실험 시나리오를 경로 3에서 따로 만들지 않는다.** `withRiskLevel(config, level, profile)`을 새 `src/engine/risk.ts`에 둔다(위치 고정, 검토 33번).
  - R0: 그대로. R1: rules-3 + 원화 매입(시세 행·정적 매입 견적) + `FX`. R2: + `TARIFF`·`SURCHARGE`. R3: + `CLAIM`·`COLLECTION`.
  - 시험은 이 변환을 옛 운영 시나리오에 걸어 만든다. 그래서 시험에 자료 ID가 필요 없다(TASK-0027 R1).
  - 실행기는 경로 5 변형 지시서에서 `--risk`로 이 변환을 부른다.
- 실험 ID는 `EXPERIMENT_SCENARIO_IDS` 같은 별도 목록에 둔다(H2). `ALL_SCENARIO_IDS`·`OPERATIONS_SCENARIO_IDS`에 넣지 않는다. 그래야 학생의 시나리오 고르기(`main.ts:409`)와 D03 기본 목록에 나타나지 않는다. TASK-0065에 적용한다.

## 8. 저장 형식 7이 필요한가: 필요 없다(조건부)

- 새 상태 칸이 없으면 형식 6 그대로 간다.
  - 위험 값은 모두 `(seed, 흐름, 번호)`의 순수 함수다.
  - 매입 통화는 매입 견적과 `rowCurrency`에서 유도한다. 계약·화물·청구서·시세 행에 칸을 더하지 않는다.
  - 새 계정(`SALES_ALLOWANCE`)은 계정 열거(`ACCOUNT_KIND`)에 값을 더하는 것이다. 옛 저장은 그대로 읽힌다.
  - 부분 수금은 `receiptIds`에 ID를 더하고 금액은 원장에서 읽는다.
- **한계(개발용에서만 맞음).** `withRiskLevel`은 시나리오 ID를 바꾸지 않는다. 불러오기는 `loadScenario(file.scenarioId)`로 설정을 다시 만든다(`save.ts:123-133`). 그래서 변환으로 만든 R1~R3 상태의 저장은 그대로는 다시 열리지 않는다. 시험은 설정을 직접 넘겨 왕복을 확인한다. 플레이어에게 내기 전에 rules-3 시나리오 레코드(자료)를 따로 두어야 한다.
- **조건.** 지시서 실행 중 상태 칸을 꼭 더해야 하면, Codex는 더하지 않고 멈춰 보고한다. 그때는 경로 6·8·9·11·12와 묶어 형식 7로 한 번에 올리는 허브 계획을 따른다.
- **저장 불변식**(`invariants.ts`, `operations-invariants.ts`):
  - 혼합 통화 계약의 통화 짝.
  - 통화별 재고 = 화물 장부가 + 혼합 계약 USD 재고.
  - 매출채권 = 미수 청구서 남은 금액 합.
  - 환전 기준 원화액(rules-3은 그날 참고 환율).
  - 부분 수금 합 ≤ 청구액, `PAID`이면 합 = 청구액.
  - 클레임 ≤ 늦은 감액 뒤 판매액.

## 9. 크기·결정성·옛 값

- 엔진 코드는 첫 화면 묶음에 들어간다. 지시서마다 첫 화면 gzip 전후를 적고, **지시서당 코드 증가 +2,500 B**를 넘으면 멈추고 보고한다. 자료 청크 증가는 따로 적는다(개정 3d). 지금 첫 화면 125,035 B, 여유 14,965 B(허브 실측 2026-10-16), 경보선 5 KB.
- 옛 값: 2절 2항의 장치. 지시서마다 작업 뒤 TASK-0062a 골든 검사기의 종료 코드 0을 확인한다(규칙 1 400회 포함).
  - **골든이 깨졌을 때의 진단 절차(H14-10, 허브 통일 문장).** 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고, 0이 아니면 고치지 말고 멈춘다. `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다. stateHash·probeHash만 다른 경우(실패 기록 등)도 이 diff로 보인다. 덤프는 실행마다 `<scenarioId>__<policyId>__<seed>.run.json`·`.state.json` 두 파일이다(H15 O12).
  - 손대지 않을 골든 파일: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`.
- 새 규칙의 결정성: 같은 시드·같은 명령이면 같은 결과(시험). (흐름, 번호) 쌍 유일성 시험.

## 10. 지시서 나누기

| 지시서 | 범위 | 주 의존 |
|---|---|---|
| TASK-0062 | rules-3 판본·`risk_profiles` 자료·검사·읽기 함수, 원화 매입·혼합 통화 계약, 참고 환율 경로·환전과 묶음 계산, `dutyFor`(과세가격 수락일 고정), 실패 기록 통화 분리, 미리보기(H0), `contractRiskReport`(0·1·2·5·7·9·10단계, 주선 포함), `withRiskLevel` R0·R1 | **TASK-0062a 반영**(허브가 검수·병합한 커밋) |
| TASK-0063 | 관세 표·신고일 세율·짧은 공지, 출항 부대비(직접 무역만), `tariffSchedule`, 3·4단계, `withRiskLevel` R2 | 0062 |
| TASK-0064 | 두 층 클레임·파손 등급, 신용등급별 지연·부분 수금, `SALES_ALLOWANCE`, `receivableSchedule`, `OVERDUE` 전이, 불변식, 6·8단계, `withRiskLevel` R3 | 0063 |

- rules-2 골든(검사기·해시·`review_checks` 두 줄(검사기·실패 경로 시험), 검사 16종, `--dump`)은 허브의 TASK-0062a다(허브 결정 H9·H14-10, 검토 n15).
- 실행기(분석값, 손실 비율, 결정 기여와 원화 환전 규칙, `MARGIN_BUFFER`·`FOCUS`·`EXPAND`, `usdLotKrw`에 상태 넘기기, `preview`에 `goodId` 넘기기, `--risk`, `--scenarios`, rules-3 d03 ⑤ J7(옛 정의)·⑦의 진단 표지, 진단 T·C·F·B)는 경로 5 변형 지시서로 따로 한다(판정표 6절, H8·H14-10, 검토 n27·n38).
- rules-3 시나리오 레코드·스키마·로더 분기, `EXPERIMENT_SCENARIO_IDS`는 TASK-0065다.

## 11. 허브 질문(닫힘)

- Q-A는 허브 결정 H6(조건부 예외), Q-B는 H11(범위 확정)로 닫혔다. 이 설계는 두 결정을 반영했다.
- Q-C(환율 폭·수금 확률의 실측 비교)는 H11이 ECB 재계산과 Atradius 참고값으로 답했다. Atradius 원문 확인은 세션 C 몫으로 남는다.

## 12. 바꾼 결정 요약

개정 3(H14):
- `FOCUS` = 직접 무역 `COSMETICS`만, `EXPAND` = `MAX_CONTRIBUTION`의 실행 키(H14-1).
- 환산 도우미 `krwToUsdMinor`·`usdToKrwMinor`와 반올림 `divHalfAway` 하나. 과세가격의 ×100 누락을 고쳤다(H14-2).
- 결정 기여의 판매 = 늦은 감액 전 값, 매입 통화 분기, `referenceEstimate` 식 고정, `MARGIN_BUFFER` = `10 × D ≥ 판매`(H14-3·4).
- 평가일 = 실패일 / campaignDays / s.day, 3·4·6·8단계는 평가일까지의 사건만, 9단계는 구성상 0, 누설 시험은 모듈 경계에서(H14-5).
- `dutyFor` 호출처 여섯 곳과 자금 예약 tariffDay 규칙, `goodId` 누락 예외(H14-6).
- 손잡이 회차 규칙(건너뛰기, 닿지 않는 조건, 같은 폭 끝, 표본 밖 1 뒤 조정 없음, 엔진 결함 정의)(H14-7).
- 잠금 범위(새 rule_set·rules-3의 d03 실행 금지)와 동결 범위(판정표 + 6절)(H14-8).
- (나)·(다)의 새 거래처 ID, 등급은 품목군을 따라(화장품 B, 김 C)(H14-9).
- 의류 클레임 확률 400 → 500, 프로필 가상값 표지, 프로필 누락 예외와 양방향 검사, `SALES_ALLOWANCE`를 순매출에, OVERDUE 시점, 골든 진단 `--dump`(H14-10, 작은 결함).

개정 2(H6~H13):
- `contractRiskReport`는 조건부 예외다. 평가일은 상태가 마지막으로 마감한 날(도중이면 오늘)이고, 열린 계약의 남은 흐름(관세 예상 포함)을 평가일 환율 하나로 평가한다. R0은 1,300 고정이다(H6·H7).
- `dutyFor`에 공지 기준일 인수를 더하고 호출처 표를 고정했다. 자금 예약의 과세가격 환율일은 수락일이다(H13).
- `contractReport(s, contract, currency = contract.currency)`, 실패 기록은 `PURCHASE-`만 창을 넓힌다, `nextReceipt`는 지금 규칙(H13).
- 새 인수(`usdLotKrw`·`exchangeAmounts`·`preview`·`contractReport`)는 모두 선택 인수다(H13).
- 시작 프로필 전체를 숫자로 적었다(H10-8·H11).
- rules-2 골든은 TASK-0062a로 떼었다(H9).

개정 1:

- 미리보기 기존 칸은 통화별 그대로이고, 새 칸은 `referenceEstimate`뿐이다(H0).
- 과세가격은 수락일 환율로 고정하고, 관세는 도착일 세율로 낸다(7번).
- 관세는 신고일(도착일) 세율과 공지 0~3일로 정시 계약에 닿게 한다(H5-5).
- 손상은 두 층 분포로 하고, 클레임은 품목 파손 등급, 수금은 거래처 신용등급에 묶어 공개한다(10·11번).
- 노출 기간 시장 지렛대와 [수입 07-03-03] 근거를 뺐다(9·14번).
- 열린 계약은 캠페인 마지막 날 참고 환율로 평가한다(26번).
- 추첨 키는 판매 견적 ID다(43번).

## 13. 허브 검토 46건 처리표

번호는 `REVIEW-HUB-2026-10-16.md`의 번호다. 다섯 문서에 같은 표를 붙였다.

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
