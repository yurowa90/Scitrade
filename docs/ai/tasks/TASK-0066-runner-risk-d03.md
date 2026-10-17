# TASK-0066 경로 5 실행기 변형: 위험 경로 측정 도구 (초안 1)

- **지위: 초안 1(세션 A, 2026-10-17. 초안 0은 2026-10-16). 허브 사전 확인·승인 전에는 실행하지 않는다.** 초안 1에서 바꾼 것은 끝의 ‘초안 1 변경’이다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0062~0065가 모두 병합됐다(개발 브랜치 `97e7227`까지).
  - 판정표의 **측정 전 고정 기록**이 모두 찼다. 비어 있으면 이 지시서는 실행하지 않는다(판정표 0절 1, H14-8).
  - **`BASE`는 작업 트리를 만든 커밋(이 지시서의 승인본과 위 둘을 담은 개발 브랜치 커밋)이다.** 작업 시작 때 `git rev-parse HEAD`를 결과 보고에 적고 그 값을 BASE로 쓴다(TASK-0064·0065와 같은 규칙).
- 기준 문서: **판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`(승인 `9ce98fe`)의 1·2·3·6절**이 기준이다. 이 지시서와 판정표가 다르면 판정표가 우선이다. 판정표는 동결돼 있으므로 고치지 않는다. 다르게 해야 할 이유가 생기면 멈추고 보고한다.
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 2·3.4·7절.
- 목적: 판정표의 측정 격자(변형 (가)(나)(다) × 위험 경로 R0~R3)를 돌릴 실행기를 만든다. 이 작업은 **측정하지 않는다.** 측정은 허브가 승인한 뒤 따로 한다.
- 코드 자리는 함수 이름으로 가리키고, 괄호 안 줄 번호는 개발 브랜치 `97e7227` 기준의 참고값이다. 달라진 줄을 결과 보고에 적는다.
- 허브 결정 H18-6(`HUB-DECISIONS-2026-10-16.md`)을 따른다. 다만 그 적용 범위는 4절 ‘D와 공통 난수’대로 읽는다(초안 1 변경 참조).

## 원칙

- **고치는 곳은 `src/engine/sim/**`뿐이다.** 엔진(`src/engine/*.ts`)·자료·화면은 고치지 않는다. 판정표·설계와 다르게 동작하는 엔진 코드를 찾으면 고치지 말고 멈춰 보고한다(판정표 5.1 ‘엔진 결함’).
- **rules-2 실행은 바이트 그대로다.** `--risk`를 주지 않은 `run`·`d03`의 실행 결과·상태·표 문장은 지금과 같아야 한다. 6.1의 결정 기여는 USD 매입 갈래에서 지금 식과 같은 값이므로 구성상 그대로다. TASK-0062a 골든이 이를 지킨다.
- **측정 금지.** Codex는 기준 시드(1001~1020), 표본 밖 시드(1021~1060), v2 시드(1061~1080)로 rules-3 또는 새 rule_set 실행을 하지 않는다. 시험과 확인 실행은 **2001 이상의 시드**만 쓴다. 판정표의 측정 결과를 미리 보는 일을 막기 위해서다.
- 시험에 자료 ID·조정 상수를 쓰지 않는다(TASK-0027 R1). 위험 설정은 `withRiskLevel(loadScenario(운영 시나리오), level, riskProfiles()[0])`로 만든다. 실험 시나리오 ID는 `EXPERIMENT_SCENARIO_IDS`에서 읽는다.
- **공유 계산은 lazy로 둔다(TASK-0064 후속, 0065 P5와 같은 규칙).** 여러 시드를 도는 공유 실행은 모듈 최상위에서 즉시 만들지 않는다. 기억해 두는 함수로 두고 `it` 안에서 부르며, 예외도 `it` 안에서 받는다. 시드를 도는 `it`에는 명시 timeout(60000ms 이상)을 준다.
- `any`를 새로 쓰지 않는다. 돈은 정수 최소 단위다. 원↔달러 환산은 엔진의 `krwToUsdMinor`·`usdToKrwMinor`만 쓴다(H14-2).

## 구현 지시

### 1. 위험 경로와 시나리오 선택(판정표 1.2·1.3·6.2)

- `run.mjs d03`에 `--risk R0|R1|R2|R3`와 `--scenarios A,B`를 더한다.
  - `--scenarios`는 `OPERATIONS_SCENARIO_IDS`와 `EXPERIMENT_SCENARIO_IDS`만 받는다. 없으면 지금처럼 `OPERATIONS_SCENARIO_IDS`다.
  - `--risk`가 있으면 각 시나리오 설정에 `withRiskLevel(config, level, profile)`을 건다. `profile`은 공유 프로필 하나(`riskProfiles()`가 하나만 돌려줌을 단언, 판정표 1.2)다.
  - `--risk`가 없으면 지금 동작 그대로다. `meta`에 새 칸을 넣지 않는다.
  - `--risk`가 있으면 `meta.risk = { level, profileId, tuningRound }`를 넣는다. `tuningRound`는 `--round N`(0~3, 기본 0)으로 받는다(판정표 5.1 ‘최대 3회’).
- 워커 분할(`run.mjs`)과 `--tables-from` 합치기에서도 `meta.risk`가 같아야 합친다. 다르면 오류다.
- `--seed-base`로 1021·1041·1061 묶음을 고르는 지금 방식은 그대로 쓴다.

### 2. 정책(판정표 6.1·6.2)

- `ACCEPTANCE_IDS`(`variants.ts`)에 `MARGIN_BUFFER`·`FOCUS`를 더한다. **`EXPAND`는 새 ID를 만들지 않는다.** `MAX_CONTRIBUTION`의 실행 키를 그대로 쓴다(H14-1). 표·결과에서 ‘`EXPAND`’ 이름이 필요하면 `MAX_CONTRIBUTION` 실행을 가리키는 별칭으로만 쓴다.
- **결정 기여**(판정표 6.1의 식 그대로, `IDLE`을 뺀 모든 수락 정책).
  - `decideOperations`의 직접 무역 후보 `preview` 호출(`operations-policy.ts` 116행)에 `{ goodId: buy.goodId, purchaseCurrency: buy.currency }`를 넘긴다. **rules-3에서는 필수다**: `goodId` 없이 부르면 `preview`가 예외를 낸다(TASK-0062 3.3, 설계 3.4). rules-2에서 이 인수를 넘겨도 결과가 같은지는 TASK-0062a 골든의 탐침으로 확인한다.
  - 판매 = `sell.unitPriceMinor × q`(늦은 감액 전).
  - 매입 견적 통화가 USD이면 `D = 판매 − p.purchase − p.freight − p.duty`(지금 식, 118행). KRW이면 `D = 판매 − p.freight − p.duty − krwToUsdMinor(p.purchase, p.referenceEstimate.rateKrwPerUsd)`.
  - 이 값을 후보 정렬(127행), 양수 거름(129행), 늦은 편 감액 뒤 검사(137행 근처)에 쓴다. 주선 후보는 지금 식 그대로다.
  - 이 값은 저장하거나 출력하지 않는다(H6 허용 목록 ④).
- **원화 환전 규칙**(판정표 6.1의 의사코드 그대로).
  - 아침 환전은 `decideOperations`의 지금 블록(64~75행) 그대로다. 묶음 계산 `usdLotKrw(config)`(73행)에 상태를 넘겨 `usdLotKrw(config, current)`로 바꾼다(TASK-0062의 선택 인수. rules-3에서는 그날 환율의 묶음 원화가 된다).
  - 수락 후보마다: 직접 무역이고 매입 통화 KRW ≠ 판매 통화이면 `krwShort`를 계산한다. `krwShort > 0`이면 (편, 직원) 시도마다 `EXCHANGE`+`ACCEPT` 짝을 `planState(current, config, [ex, acc])`로 시험한다. 성공 조건·ID·거절 원인 분류는 6.1 그대로다.
  - `krwShort ≤ 0`이면 짝 없이 지금처럼 ACCEPT만 시험한다. 주선과 USD 매입 직접 무역도 그렇다.
  - `fx:react` 변형은 창을 ‘오늘’로 줄인다. `NO_FX`는 두 환전을 모두 하지 않는다.
- **`MARGIN_BUFFER`**: `MAX_CONTRIBUTION`과 같되, 직접 무역 후보는 `10 × D ≥ 판매`일 때만 받는다(H14-4). 주선은 그대로다.
- **`FOCUS`**: `MAX_CONTRIBUTION`과 같되, 직접 무역은 매입 견적의 `goodId`가 `COSMETICS`인 후보만 받는다(H14-1). 이 품목 ID는 판정표가 정한 비교 대상이라 코드에 상수로 둔다. 시험에서는 이 상수를 export해 쓰고 문자열을 다시 적지 않는다.
- **미래 누설 금지**(판정표 6.2): 정책 코드는 읽기 함수(미리보기, 시세표, 공지된 관세, 공개 위험 등급)만 쓴다. `sim/**`의 정책 파일은 `risk.ts`에서 `referenceRate`·`tariffEvents`·`surchargeBp`·`claimFor`·`collectionPlan`을 import하지 않는다.

### 3. 측정 값(판정표 2절)

- 새 파일 `src/engine/sim/risk-metrics.ts`. `simulate`가 끝 상태에서 `--risk` 실행일 때만 부른다. `--risk`가 없으면 부르지 않는다(rules-2 출력 불변).
- `run.metrics.risk`에 다음을 담는다(저장 형식이 아니라 실행기 출력이다).
  - `analysisValueMinor` = USD `netAssets` + `krwToUsdMinor(KRW netAssets, config.operations.fx.baseKrwPerUsd)`(판정표 2절). R1~R3에서만 낸다.
  - 계약마다 `{ contractId, kind, sellOfferId, goodId, status, class, onTime, realized, openFixedRateKrw, components, evaluationDay }`. `realized`·`components`·`evaluationDay`는 엔진 `contractRiskReport`의 값을 그대로 옮긴다. **실행기에서 다시 계산하지 않는다.**
    - `class`는 열린 / 완료 / 취소다. 판정표 2절대로 겹치지 않게 나눈다. 열린 = `contractRiskReport.open`, 완료 = 열리지 않은 `COMPLETED`, 취소 = 열리지 않은 `CANCELLED`.
    - `onTime`은 수락 때 미리보기의 `lateOnNextSailing === false`이고, 실제 도착 + 통관 ≤ 납기인 계약이다(판정표 3.2 진단 T).
  - `referenceRateBounds`: 그 시드의 참고 환율이 범위 끝(`min_krw_per_usd`·`max_krw_per_usd`)에 한 번이라도 닿았는지 표시한다(진단 B). 엔진의 `referenceRate`를 공개일마다 불러 정한다. 정책 판단에는 쓰지 않는 실행 뒤 진단이다.
- R0(`--risk R0`)에서도 `contractRiskReport`를 부른다. 환율은 1,300으로 고정되고 `fx = 0`이다(H6-4). `analysisValueMinor`는 내지 않는다.

### 4. 판정·진단 표(판정표 3절)

- 새 파일 `src/engine/sim/risk-tables.ts`. `d03Tables`의 지금 표 ①~⑧ 문장은 **`meta.risk`가 없으면 한 글자도 바꾸지 않는다.**
- `meta.risk`가 있으면 다음을 바꾸거나 더한다.
  - **비교 값**: R0은 USD 순자산(`usdAssets`), R1~R3은 `analysisValueMinor`다. `cell()`을 쓰는 J2·J5·J6, J3의 1위·300 USD 비교, J4d, D가 이 값을 쓴다(판정표 2절).
  - **J3 후보**: `MARGIN_BUFFER`·`FOCUS`를 뺀다. `MAX_CONTRIBUTION`은 남는다(판정표 3.2, H15 F4).
  - **J4d 띠**: R0은 USD 10,600~21,200(지금 상수), R1~R3은 분석값 10,692~21,385다(판정표 3.2). 두 띠는 실행기 상수다.
  - **⑤ J7(옛 정의)·⑦**: R1~R3이면 ‘USD 몫만·진단’ 표지를 달고 판정 칸을 비운다(판정표 3.1).
  - 새 절 **⑨ 위험 판정**: 아래 표를 낸다. 정의는 모두 판정표 2·3절 그대로다.

| 칸 | 계산 |
|---|---|
| J7(새 정의) | 기준 회사의 시드별 (직접 무역 `realized` 합 ÷ 직접 무역 + 주선 `realized` 합)의 중앙값 ≥ 25% |
| L0 | R0 기준 회사의 손실 계약(`realized < 0`) 수. `LATE_OK`의 수는 기록만 |
| L1 | 기준 회사의 모은 손실 비율 = 20시드 손실 계약 합 ÷ 20시드 대상 계약 합. 대상 = 수락한 직접 무역 전부(열린·완료·취소) |
| L2 재료 | 층마다 기준 회사의 모은 손실 비율과 시드별 손실 계약 수. 층 사이의 비교(①·②)는 두 출력을 받아 계산하는 `sim risk-compare A B` 명령으로 낸다 |
| L3 | `MARGIN_BUFFER`의 ① 모은 비율 ≤ 기준 회사 × 0.75 ② 시드 짝 부호 검정(판정표 3.2 문턱표) ③ 대상 계약 ≥ 30이고 ≥ 기준 회사의 50% |
| D | (다)에서 같은 시드의 `FOCUS`와 `MAX_CONTRIBUTION`(= `EXPAND`) 비교 값을 견줘, 엄격히 큰 쪽이 그 시드를 이긴다. 각각 3/20 이상(판정표 3.2 131행 그대로). (나)는 ‘해당 없음’ |
| 변형 사이 차이(진단) | (가)·(나)·(다) 사이의 같은 시드 차이(예: (다) − (나)의 기준 회사 비교 값)는 **진단으로만** 내고 판정 칸을 두지 않는다. 표지 ‘시드 짝 아님: 변형마다 생성기 묶음이 다름(H18-6)’을 단다. 변형 사이 비교는 변형별 분포(평균·사분위)로 적는다 |
| 따로 적을 수 | 완료 계약만의 비율, 열린·완료·취소 수와 각각의 손실 수, 열린 계약을 `openFixedRateKrw`로 평가한 민감도 비율, 시드별 비율의 중앙·사분위 |
| 진단 T | R2·R3 기준 회사의 도착한 `onTime` 계약 가운데 `components.tariff ≠ 0`인 비율 |
| 진단 C | 손실 계약마다 `components`의 fx·tariff·surcharge·claim·collection·late·cancel 가운데 가장 큰 음수 칸의 분포 |
| 진단 F | R1·R3 기준 회사의 대상 계약 가운데 `components.fx < 0`인 비율과 `components.fx`의 중앙값 |
| 진단 B | `referenceRateBounds`가 참인 시드의 비율 |

- **D와 공통 난수(H18-6의 적용 범위, 세션 A).** D는 판정표가 정한 대로 **같은 변형 (다) 안에서** 두 정책을 같은 시드로 견준다. 같은 시나리오·같은 시드이면 공개 묶음이 정책과 무관하게 같고(`generateBatch(seed, k, …)`), 클레임·수금 추첨 키가 판매 견적 ID라서 두 정책이 함께 받은 견적의 위험 결과도 같다(판정표 83행). 그래서 시드 짝 비교가 성립한다. H18-6이 말하는 ‘생성기 난수가 품목 수 G에 따라 밀림’은 **변형 사이**((나)와 (다) 등) 비교에만 해당하므로, 그쪽만 진단으로 낸다(위 표 ‘변형 사이 차이’). 이 전제는 시험 ‘공통 난수 전제’가 확인한다.
- L3 ②의 문턱표는 판정표 3.2의 표를 코드 상수로 옮긴다. 시험이 이항 분포로 다시 계산해 같음을 확인한다.
- 판정 결과는 ‘통과·실패·진단·해당 없음’ 넷 가운데 하나다(판정표 0절 4). 어느 조건에 어느 판정을 쓰는지는 판정표 3.1 표 그대로 고정한다. (나)의 D는 ‘해당 없음’이다.

### 5. 실행기 시험의 대상(판정표 6.2 결정 기여 행)

- (i)(ii)는 이 지시서의 완료 조건이다. 아래 시험 ‘결정 기여 부호·크기’로 확인한다.
- (iii)((가)·R1 기준 시드에서 받은 직접 무역 수 ≥ (가)·R0의 50%)은 이 지시서에서 돌리지 않는다. 고정 기록이 찬 뒤 허브의 측정에서 첫 확인으로 돈다(H15 F3). 대신 (iii)을 계산하는 함수와 표 칸을 만든다.

## 시험(새 파일 `src/engine/sim/risk-runner.test.ts`)

- 시드는 2001 이상만 쓴다. 필요한 사건은 그 범위에서 찾고(200개 안), 찾았는지 먼저 단언한다.

| 시험 | 확인할 것 |
|---|---|
| rules-2 불변 | `--risk` 없는 `d03`와 `run`의 출력에 `meta.risk`와 `run.metrics.risk`가 없다. 실행 결과·상태의 바이트는 골든 검사기가, 표 문장은 ‘지켜야 할 것’의 `cmp`가 지킨다 |
| 결정 기여 부호·크기 | R1 설정, `lateOnNextSailing === false`인 직접 무역 후보마다 (i) D ≠ 0이면 sign(D) = sign(`pnlKrw`) (ii) `|100·pnlKrw − D·rate| ≤ 100 + rate/2`(판정표 6.2, H14-3) |
| 결정 기여 분기 | USD 매입 후보의 D가 지금 식과 같다. KRW 매입 후보의 D가 `krwToUsdMinor`로 계산한 값과 같다. 판매는 늦은 감액 전 값이다 |
| 미리보기 관세 | R2 설정에서 정책이 본 `preview` 관세 = 같은 견적의 `quotePreview` 관세(판정표 6.2) |
| 환전 짝 | 원화가 모자란 KRW 매입 후보에서 `EXCHANGE`+`ACCEPT`가 함께 들어가고, ID가 +1·+2이며, 두 결과가 모두 APPLIED다. `krwShort ≤ 0`이면 환전 없이 ACCEPT만. `NO_FX`는 R1에서 환전 명령이 0개 |
| `MARGIN_BUFFER` | `10 × D ≥ 판매` 경계의 두 후보(같음·1센트 모자람)에서 받음·거름이 갈린다(시험 안에서 만든 설정) |
| `FOCUS` | 직접 무역 수락의 매입 품목이 모두 `FOCUS` 상수 품목이다. 주선 수락은 `MAX_CONTRIBUTION`과 같은 규칙이다 |
| `EXPAND` 별칭 | `EXPAND`라는 실행 키가 만들어지지 않는다. D 계산이 `MAX_CONTRIBUTION` 실행을 쓴다 |
| 미래 누설 | 정책 파일(`operations-policy.ts`·`policies.ts`·`variants.ts`)이 `risk.ts`의 `referenceRate`·`tariffEvents`·`surchargeBp`·`claimFor`·`collectionPlan`을 import하지 않는다(소스 읽기 시험). 실행 뒤 진단을 내는 `risk-metrics.ts`만 `referenceRate`를 쓴다 |
| 분석값 | R1 실행의 `analysisValueMinor` = USD 순자산 + `krwToUsdMinor(KRW 순자산, baseKrwPerUsd)` |
| 계약 분류 | 열린·완료·취소가 겹치지 않고, 합이 수락한 직접 무역 계약 수와 같다 |
| 손실 비율 | 손으로 만든 계약 목록(실현 마진 몇 개)으로 모은 비율·시드별 비율·민감도 비율이 손계산과 같다 |
| L3 문턱표 | 이항 분포 B(m, 0.5)의 한쪽 p ≤ 0.05 최소 문턱을 시험 안에서 계산해, 코드 상수와 m = 10~20 모두 같다 |
| D | 같은 비교 값이면 아무도 이기지 않는다. 시드 짝의 엄격한 대소로만 센다. (다)의 두 정책 실행만 쓰고 다른 변형의 실행을 섞지 않는다 |
| 공통 난수 전제 | (다) R3, 시드 2001~2003에서 `FOCUS`와 `MAX_CONTRIBUTION` 실행이 모두 연 공개일마다 시장 견적 ID 집합이 같다(묶음은 `generateBatch(s.rng.seed, k, 앞 묶음 index, config)`라 정책과 무관하다. 한쪽이 먼저 실패로 끝나면 그 뒤 공개일은 견주지 않는다). 두 실행이 함께 받은 판매 견적마다 `CLAIM-` 유무·금액과 수금 분개 꼴(ID·날 − 청구 결제일)이 같다. **양성 대조**: 같은 시드의 (나)와 (다) 실행은 어느 공개일에 주선 견적 ID 집합이 다르다(H18-6의 근거. 찾았는지 단언하고, 못 찾으면 그 사실을 결과 보고에 적는다) |
| 변형 사이 진단 표지 | ⑨의 ‘변형 사이 차이’ 행에 판정 칸이 없고 H18-6 표지가 있다 |
| 진단 표지 | R1 출력의 표 ⑤ J7(옛 정의)·⑦에 ‘USD 몫만·진단’ 표지가 있고 판정 칸이 비어 있다. R0·rules-2 출력에는 없다 |
| 합치기 | `meta.risk`가 다른 두 출력을 `--tables-from`으로 합치면 오류다 |
| 결정성 | 같은 시드·같은 `--risk`면 같은 출력 JSON |

## 변형 시험

결과 보고에 각 변형과 잡은 시험을 표로 적는다. 결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 적는다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 결정 기여에서 ×100을 뺌(원 ÷ 환율) | 결정 기여 부호·크기 (ii) |
| 2 | 결정 기여의 판매에 늦은 감액 뒤 값을 씀 | 결정 기여 분기 |
| 3 | `MARGIN_BUFFER`를 `pnlKrw ≥ saleKrw의 10%`로 거름 | `MARGIN_BUFFER` |
| 4 | `FOCUS`가 `trade.goods[0]`을 씀 | `FOCUS` |
| 5 | `EXPAND`를 따로 실행 | `EXPAND` 별칭 |
| 6 | 환전 짝의 거절 원인을 `results[0]`로 가름 | 환전 짝 |
| 7 | `NO_FX`도 추가 환전을 함 | 환전 짝 |
| 8 | 정책이 `tariffEvents`를 직접 부름 | 미래 누설 |
| 9 | 분석값에 고정 1,313을 씀 | 분석값 |
| 10 | 열린 계약을 완료로도 셈 | 계약 분류 |
| 11 | L3 문턱표 한 칸을 바꿈 | L3 문턱표 |
| 12 | `meta.risk`가 없을 때도 표 ⑤에 표지를 닮 | 진단 표지, rules-2 불변 |
| 13 | D를 (나)·(다)의 같은 시드 기준 회사 비교 값으로 계산 | D |
| 14 | ‘변형 사이 차이’에 통과·실패 판정을 냄 | 변형 사이 진단 표지 |

## 고칠 수 있는 파일

- `src/engine/sim/**`(기존 시험의 단언은 고치지 않는다). 새 파일 `risk-metrics.ts`, `risk-tables.ts`, `risk-runner.test.ts`
- `docs/ai/tasks/results/TASK-0066.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/engine/*.ts`(sim 밖의 엔진), `src/content/**`, `src/ui/**`, `data/**`, `schemas/**`, `vite.config.ts`, `package*.json`, `index.html`
- 골든 파일·검사기: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`. `--write`를 쓰지 않는다.
- 판정표, 설계 6절

## 지켜야 할 것

- **골든 진단 절차(허브 통일 문장).** 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고, 0이 아니면 고치지 말고 멈춘다. `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다.
- **rules-2 표 문장 불변.** 골든은 실행·상태를 지키지만 `d03Tables`의 표 문장은 지키지 않는다. 그래서 작업 전 `<BASE>`에서 `node src/engine/sim/run.mjs d03 --seeds 2 --out <밖>/d03-before.json`로 만든 출력을 `--tables-from`으로 다시 표로 만들어 저장한다. 작업 뒤 같은 입력 JSON으로 만든 표가 `cmp` 0이다(기준 시드 앞 2개의 rules-2 실행이다. rules-2 실행은 잠금 대상이 아니다).
- 측정 금지(원칙). rules-3·실험 시나리오 실행은 시험 안에서 2001 이상 시드로만 한다.
- `review_checks` 통과.

## 완료 조건

1. 지시 1~5 반영, 시험 표의 시험 모두 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과(골든 검사 포함).
3. 변형 표의 모든 행이 잡힌다(또는 원래 코드와 같은 이유를 적었다).
4. `git diff --stat <BASE> -- src/engine/*.ts src/content data schemas tests/golden tools docs/ai/design`이 빈 값이다(`<BASE>`는 머리의 BASE).

## 결과 보고에 넣을 것

- 바꾼 파일·함수, 새 CLI 인수, `meta.risk`와 `run.metrics.risk`의 꼴
- 2001 이상 시드로 돌린 확인 실행 몇 개의 ⑨ 표(값을 고치지 않고 적기만). 측정이 아니다
- rules-2 표 문장 `cmp`, 골든 검사기 종료 코드, 시험 수, 변형 표
- 판정표 6.1과 실제 엔진 동작이 다른 곳을 찾았으면 그 문장과 재현 방법(고치지 않음)
- 범위 밖 발견과 질문

## 허브 확인(초안 0)

- **번호.** 경로 5 실행기를 TASK-0066으로 두었다. 0065(rules-3 시나리오 레코드)가 앞선다.
- **새 표의 자리.** 지금 표 ①~⑧은 `meta.risk`가 없으면 그대로 두고, 위험 판정은 새 절 ⑨와 `sim risk-compare`(층 사이 L2)로 냈다. L2는 두 출력(R0과 R1 등)을 견줘야 해서 한 출력 안에서 낼 수 없기 때문이다.
- **시험 시드 2001 이상.** 판정표는 시험 시드를 정하지 않는다. 측정 결과를 미리 보는 일을 막으려고 이 지시서가 정했다. 판정표 4절의 시드 묶음과 겹치지 않는다.
- **(iii)의 자리.** H15 F3대로 측정의 첫 확인으로 두고, 이 지시서는 계산 함수만 만든다.
- **rules-2 표 문장 확인에 기준 시드 앞 2개를 쓴다.** rules-2는 잠금 대상이 아니고 TASK-0032에서 이미 관측됐다. 꺼리면 2001 시드로 바꿀 수 있다.

## 초안 1 변경(2026-10-17, 세션 A)

- **H18-6의 적용 범위를 바로잡았다(세션 A 메모의 오기 정정).** 세션 A가 0065 초안 3 끝 메모에 ‘D((나)·(다) 비교)’라고 썼는데, 판정표 3.2(131행)의 D는 **(다) 안에서** `FOCUS`와 `EXPAND`(= `MAX_CONTRIBUTION`)를 같은 시드로 견주는 것이다. 같은 시나리오·같은 시드이므로 생성기 묶음이 같고(난수 순서가 G에 따라 밀리는 문제는 생기지 않는다), 판정표 83행이 이 같은 시드 비교를 공통 난수의 전제로 명시한다. 그래서 H18-6을 문자 그대로(‘D를 시드 짝 차이로 읽지 않는다’) 적용하면 동결된 판정표와 어긋난다. 초안 1은 D를 판정표대로 두고, H18-6이 겨냥한 ‘변형 사이 같은 시드 차이’만 진단으로 내도록 적었다. 시험 ‘공통 난수 전제’(같은 변형 안 두 정책의 묶음·위험 결과 같음, 변형 사이 주선 묶음 다름의 양성 대조)와 변형 13·14를 더했다. H18-6 문구의 정정은 허브가 정한다.
- **선행과 BASE.** 0062~0065 병합(`97e7227`) 뒤의 규칙으로 맞췄다. `<BASE>` 자리표시 대신 ‘작업 트리를 만든 커밋’을 쓴다. 줄 번호는 `97e7227` 기준 참고값으로 바꾸고 함수 이름을 앞에 둔다.
- **rules-3 `preview`의 `goodId` 필수**를 2절에 적었다(없으면 예외).
- **공유 계산 lazy**(0064 후속)를 원칙에 넣었다.
- 완료 조건 3을 ‘모든 행’으로 바꿨다.
