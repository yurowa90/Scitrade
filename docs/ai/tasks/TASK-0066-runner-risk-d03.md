# TASK-0066 경로 5 실행기 변형: 위험 경로 측정 도구 (초안 2)

- **지위: 초안 2(세션 A, 2026-10-17). 초안 1은 허브 사전 확인(`PRECHECK-0066-HUB-2026-10-17.md`, H19)에서 돌려받았다. 허브 승인 전에는 실행하지 않는다.** 바뀐 것은 끝의 ‘초안 2 변경’에 있다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0062~0065가 모두 병합됐다(개발 브랜치 `97e7227`까지).
  - 판정표의 **측정 전 고정 기록**이 모두 찼다. 비어 있으면 이 지시서를 실행하지 않는다(판정표 0절 1, H14-8).
  - **`BASE`는 작업 트리를 만든 커밋이다.** 이 커밋은 이 지시서의 승인본과 위 둘을 담은 개발 브랜치 커밋이다. 작업을 시작할 때 `git rev-parse HEAD`를 결과 보고에 적고, 그 값을 BASE로 쓴다(TASK-0064·0065와 같은 규칙).
- 기준 문서
  - **판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`(승인 `9ce98fe`)의 1·2·3·6절**이 기준이다. 이 지시서와 판정표가 다르면 판정표를 따른다.
  - 판정표는 동결돼 있으므로 고치지 않는다. 판정표와 다르게 해야 할 이유가 생기면 멈추고 보고한다.
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 2·3.4·7절.
- 목적: 판정표의 측정 격자를 돌릴 실행기를 만든다. 격자는 변형 (가)(나)(다) × 위험 경로 R0~R3이다. 이 작업은 **측정하지 않는다.** 측정은 허브가 승인한 뒤 따로 한다.
- 코드 위치는 함수 이름으로 가리킨다. 괄호 안 줄 번호는 개발 브랜치 `97e7227` 기준의 참고값이다. 줄이 달라졌으면 결과 보고에 적는다.
- 허브 결정 H18-6(H19-1로 정정)과 H19-1~H19-10(`HUB-DECISIONS-2026-10-16.md`)을 따른다.

## 원칙

- **고치는 곳은 `src/engine/sim/**`뿐이다.**
  - 예외가 하나 있다. `src/engine/sim/run.mjs`의 Node 경계에서 파일 해시를 계산한다(1절).
  - 엔진(`src/engine/*.ts`), 자료, 화면은 고치지 않는다.
  - 판정표·설계와 다르게 동작하는 엔진 코드를 찾으면 고치지 말고 멈춰 보고한다(판정표 5.1 ‘엔진 결함’).
- **rules-2 실행은 바이트까지 그대로다.**
  - `--risk`를 주지 않은 `run`·`d03`의 실행 결과·상태·출력 JSON·표 문장은 지금과 같아야 한다.
  - 6.1의 결정 기여는 USD 매입 갈래에서 지금 식과 값이 같으므로, 구성상 그대로다.
  - TASK-0062a 골든과 ‘지켜야 할 것’의 두 `cmp`가 이를 지킨다.
- **고정 목록(H19-8).** `d03PolicyIds`, `SIM_POLICIES`, `SIM_FORMAT`은 바꾸지 않는다. `MARGIN_BUFFER`·`FOCUS`는 `--policies`로만 돈다.
- **측정 금지(H19-8, 판정표 H14-8).** Codex는 시드 2001 미만으로 다음을 실행하지 않는다.
  - 금지 대상
    - `--risk` 실행(**R0 포함**)
    - `MARGIN_BUFFER`·`FOCUS` 실행
    - 실험 시나리오(`EXPERIMENT_SCENARIO_IDS`) 실행
  - 2001 미만 시드는 기준 1001~1020, 표본 밖 1021~1060, v2 1061~1080이다.
  - **유일한 예외**는 ‘지켜야 할 것’의 rules-2 표 문장 `cmp`용 `d03 --seeds 2` 한 번이다(`--risk` 없음, `d03PolicyIds`만).
  - 그 밖의 시험과 확인 실행은 **2001 이상의 시드**만 쓴다. 판정표의 측정 결과를 미리 보지 않기 위해서다.
  - `d03`와 `cli.ts`의 시드 기본값은 `SIM_SEEDS`(1001~1020)다. 그래서 시드 인수를 빠뜨리면 측정 시드로 돈다. 시험에서는 아래 `riskSeeds` 도우미만 쓴다.
- 시험에 자료 ID·조정 상수를 쓰지 않는다(TASK-0027 R1).
  - 위험 설정은 `withRiskLevel(loadScenario(운영 시나리오), level, riskProfiles()[0])`로 만든다.
  - 실험 시나리오 ID는 `EXPERIMENT_SCENARIO_IDS`에서 읽는다.
  - 예외: `FOCUS` 품목 상수(2절)는 export한 값을 쓴다.
- **변형 판별(H19-2).** (나)는 `config.operations.market.trade.goods.length === 1`일 때다. 이때 `FOCUS` ≡ `EXPAND`다. 시나리오 ID 문자열로 변형을 가르지 않는다. 실행기와 시험이 같은 판별 함수(export)를 쓴다.
- **공유 계산은 lazy로 둔다(TASK-0064 후속, 0065 P5와 같은 규칙).**
  - 여러 시드를 도는 공유 실행을 모듈 최상위에서 바로 만들지 않는다.
  - 결과를 기억해 두는 함수로 두고 `it` 안에서 부른다. 예외도 `it` 안에서 받는다.
  - 시드를 도는 `it`에는 timeout을 명시한다(60000ms 이상).
- `any`를 새로 쓰지 않는다. 돈은 정수 최소 단위다.
  - 원↔달러 환산은 엔진의 `krwToUsdMinor`·`usdToKrwMinor`만 쓴다(H14-2).
  - 판정 문턱의 비율 비교는 **정수 교차곱**으로 한다(부동소수 금지).
  - 원화 금액끼리 곱하면 2^53을 넘을 수 있다. 그런 곱은 `BigInt`로 한다.

## 구현 지시

### 1. 위험 경로와 시나리오 선택(판정표 1.2·1.3·6.2, H19-5)

- `run.mjs d03`에 `--risk R0|R1|R2|R3`, `--scenarios A,B`, `--round N`을 더한다.
  - **`--scenarios`**
    - `OPERATIONS_SCENARIO_IDS`와 `EXPERIMENT_SCENARIO_IDS`의 ID만 받는다. 주지 않으면 지금처럼 `OPERATIONS_SCENARIO_IDS`다.
    - **실험 시나리오를 `--risk` 없이 주면 오류다.**
  - **`--risk`**
    - 주면 각 시나리오 설정에 `withRiskLevel(config, level, profile)`을 건다.
    - `profile`은 공유 프로필 하나다. `riskProfiles()`가 하나만 돌려주는지 단언한다(판정표 1.2).
  - **`--round N`**: 0~3의 정수이고 기본값은 0이다(판정표 5.1 ‘최대 3회’). 범위 밖이거나 `--risk` 없이 주면 오류다.
  - **`--risk`가 없을 때**는 지금 동작 그대로다. `meta`에 새 칸을 넣지 않는다.
  - **`--risk`가 있을 때**는 `meta.risk = { level, profileId, tuningRound, marketRulesSha256 }`를 넣는다.
    - `marketRulesSha256`은 `data/market_rules.json` 파일 바이트 전체의 sha256(소문자 16진)이다.
    - 계산은 Node 경계 `run.mjs`에서 `node:crypto`로 한다. `cli.ts`에는 `SimIo`의 새 칸(예: `marketRulesSha256(): string`)으로 넘긴다.
    - `src/engine/sim/*.ts`는 파일을 직접 읽지 않는다(`run.mjs` 머리 주석의 경계 규칙).
- **워커 자료(P2)**
  - 워커 자료는 export한 함수 `workerOptions(options, i, count)`로 만든다. 이 함수는 d03 선택지 전체(late·policyIds·seeds 조각·scenarioIds·risk·tuningRound·marketRulesSha256)를 담는다.
  - `run.mjs`는 이 함수의 반환값을 그대로 `workerData`로 넘긴다. 지금 `run.mjs` 22행처럼 칸을 골라 담지 않는다.
- **합치기(P2)**
  - `mergeD03(outputs, late, risk?)`는 각 출력의 `meta.risk`를 요청값과 깊은 비교한다. 요청값은 CLI의 `--risk`·`--round`와 현재 `marketRulesSha256`이다.
  - 다음은 모두 오류다.
    - 요청에는 risk가 있는데 출력에는 없는 경우, 또는 그 반대
    - 출력마다 다른 경우
    - level·profileId·tuningRound·marketRulesSha256 가운데 하나라도 다른 경우
  - `--tables-from`도 같은 검사를 거친다.
  - `meta.risk`가 없는 rules-2 합치기는 지금과 같다.
- `--seed-base`로 1021·1041·1061 묶음을 고르는 지금 방식은 그대로 쓴다.

### 2. 정책(판정표 6.1·6.2, H19-3)

- **`ACCEPTANCE_IDS`**(`variants.ts`)에 `MARGIN_BUFFER`·`FOCUS`를 더한다.
  - **`EXPAND`는 새 ID를 만들지 않는다.** `MAX_CONTRIBUTION`의 실행 키를 그대로 쓴다(H14-1).
  - 표·결과에서 ‘`EXPAND`’ 이름이 필요하면 `MAX_CONTRIBUTION` 실행을 가리키는 별칭으로만 쓴다.
- **관측 이음매(H19-3).** 다음 셋을 `src/engine/sim/**` 안에 export한 순수 함수로 둔다. `decideOperations`는 반드시 이 함수들로 후보·D·거름을 정한다. 반환값은 결과 JSON에 담거나 출력하지 않는다. 시험에서 이 함수를 부르는 것은 H6 ④의 ‘저장·출력’이 아니다.
  - `directTradeCandidates(state, config, day)`
    - 지금 113~120행 루프가 만드는 직접 무역 후보 목록이다.
    - 후보마다 다음을 담는다: `{ buyOfferId, sellOfferId, quantity, purchaseCurrency, sale, contribution, preview }`.
    - `sale`은 늦은 감액 전 `sell.unitPriceMinor × q`다. `preview`는 정책이 본 미리보기 객체다.
  - `decisionContribution(preview, sale, purchaseCurrency)`: 6.1의 D(USD 센트)다.
  - `marginBufferAccepts(contribution, sale)`: `10 × contribution ≥ sale`이다.
- **미리보기 호출.** 직접 무역 후보의 `preview` 호출(116행)에 `{ goodId: buy.goodId, purchaseCurrency: buy.currency }`를 넘긴다.
  - **rules-3에서는 필수다.** `goodId` 없이 부르면 `preview`가 예외를 낸다(TASK-0062 3.3, 설계 3.4).
  - rules-2에서 이 인수를 넘겨도 결과가 같은지는 TASK-0062a 골든의 탐침으로 확인한다.
- **결정 기여**(판정표 6.1의 식 그대로). `IDLE`을 뺀 모든 수락 정책이 쓴다.
  - 판매 = `sell.unitPriceMinor × q`(늦은 감액 전).
  - 매입 견적 통화가 USD이면 `D = 판매 − p.purchase − p.freight − p.duty`다(지금 식, 118행).
  - KRW이면 `D = 판매 − p.freight − p.duty − krwToUsdMinor(p.purchase, p.referenceEstimate.rateKrwPerUsd)`다.
  - 이 값을 후보 정렬(127행), 양수 거름(129행), 늦은 편 감액 뒤 검사(137행)에 쓴다. 주선 후보는 지금 식 그대로다.
- **원화 환전 규칙**(판정표 6.1의 의사코드 그대로)
  - 아침 환전은 `decideOperations`의 지금 블록(64~75행) 그대로다. 다만 묶음 계산을 `usdLotKrw(config)`(73행)에서 `usdLotKrw(config, current)`로 바꿔 상태를 넘긴다. 이것은 TASK-0062의 선택 인수다. rules-3에서는 그날 환율로 센 묶음 원화가 된다.
  - 수락 후보가 직접 무역이고 매입 통화(KRW)가 판매 통화와 다르면 `krwShort`를 계산한다.
  - `krwShort > 0`이면 (편, 직원) 시도마다 `EXCHANGE`+`ACCEPT` 짝을 `planState(current, config, [ex, acc])`로 시험한다.
    - 성공 조건과 ID는 6.1 그대로다.
    - **거절 원인은 `r.results[1]`(ACCEPT)의 사유로 분류한다.** `results[0]`은 EXCHANGE라서 보통 APPLIED이기 때문이다(P5).
  - `krwShort ≤ 0`이면 짝 없이 지금처럼 ACCEPT만 시험한다. 주선과 USD 매입 직접 무역도 그렇다.
  - `fx:react` 변형은 창을 ‘오늘’로 줄인다. `NO_FX`는 두 환전을 모두 하지 않는다.
- **`MARGIN_BUFFER`**: `MAX_CONTRIBUTION`과 같다. 다만 직접 무역 후보는 `marginBufferAccepts(D, 판매)`일 때만 받는다(H14-4). 주선은 그대로다.
- **`FOCUS`**: `MAX_CONTRIBUTION`과 같다. 다만 직접 무역은 매입 견적의 `goodId`가 `FOCUS` 품목인 후보만 받는다(H14-1).
  - 품목은 export 상수 하나로 둔다(판정표 6.2의 `COSMETICS`).
  - 이 값이 (나)의 1일 정적 매입 견적 `goodId`와 같음은 시험이 단언한다(H18-3).
  - `trade.goods[0]`에서 품목을 읽지 않는다.
- **미래 누설 금지(판정표 6.2, H19-8)**
  - 정책 코드는 읽기 함수만 쓴다: 미리보기, 시세표, 공지된 관세, 공개 위험 등급.
  - 정책 파일(`operations-policy.ts`·`policies.ts`·`variants.ts`)과, `risk-metrics.ts`·`risk-tables.ts`를 뺀 `sim/**`의 `../risk` import는 **허용 목록**으로 제한한다.
    - 허용: `krwToUsdMinor`, `usdToKrwMinor`, `rowCurrency`, `divHalfAway`, `withRiskLevel`(설정 만들기), 타입.
    - 금지: `referenceRate`, `tariffEvents`, `tariffSchedule`, `surchargeBp`, `dutyFor`, `drawAt`, `claimFor`, `collectionPlan`을 비롯해 허용 목록 밖의 모든 것.
  - `import * as`와 다시 내보내기로 우회하는 것도 금지다.
  - 정책 파일은 `risk-metrics.ts`·`risk-tables.ts`를 import하지 않는다.

### 3. 측정 값(판정표 2절)

- 새 파일 `src/engine/sim/risk-metrics.ts`를 만든다.
  - `simulate`가 끝 상태에서 부른다. `--risk` 실행일 때만 부르고, `--risk`가 없으면 부르지 않는다(rules-2 출력 불변).
- `run.metrics.risk`에 다음을 담는다. 저장 형식이 아니라 실행기 출력이다.
  - **`analysisValueMinor`** = USD `netAssets` + `krwToUsdMinor(KRW netAssets, config.operations.fx.baseKrwPerUsd)`(판정표 2절). R1~R3에서만 낸다.
  - **계약마다** `{ contractId, kind, sellOfferId, goodId, status, class, onTime, realized, openFixedRateKrw, components, evaluationDay }`를 담는다.
    - `realized`·`components`·`evaluationDay`는 엔진 `contractRiskReport`의 값을 그대로 옮긴다. **실행기에서 다시 계산하지 않는다.**
    - **`class`**는 열린·완료·취소 가운데 하나다. 판정표 2절대로 서로 겹치지 않게 나눈다.
      - 열린 = `contractRiskReport.open`
      - 완료 = 열리지 않은 `COMPLETED`
      - 취소 = 열리지 않은 `CANCELLED`
    - **`onTime`**은 두 조건을 모두 만족하는 계약이다(판정표 3.2 진단 T).
      - 수락일 미리보기의 `lateOnNextSailing === false`다.
        - 이 값은 `contractRiskReport`가 쓰는 인수와 같은 인수로 **수락일 `preview`를 다시 만들어** 얻는다.
        - 정책 실행 중의 값은 저장하지 않는다(P10).
      - 실제 도착 + 통관 ≤ 납기다.
  - **`directAccepted`**: 그 실행에서 수락한 직접 무역 계약 수다. (iii)의 재료다.
  - **`referenceRateBounds`**: 그 시드의 참고 환율이 범위 끝(`min_krw_per_usd`·`max_krw_per_usd`)에 한 번이라도 닿았는지 표시한다(진단 B).
    - 엔진의 `referenceRate`를 공개일마다 불러 정한다.
    - 실행이 끝난 뒤 내는 진단이고, 정책 판단에는 쓰지 않는다.
- R0(`--risk R0`)에서도 `contractRiskReport`를 부른다.
  - 환율은 1,300으로 고정되고 `fx = 0`이다(H6-4).
  - `analysisValueMinor`는 내지 않는다.

### 4. 판정·진단 표(판정표 3절, H19-6·H19-7)

- 새 파일 `src/engine/sim/risk-tables.ts`를 만든다.
- **`meta.risk`가 없으면** `d03Tables`의 지금 표 ①~⑧ 문장을 **한 글자도 바꾸지 않는다.** 지금 쓰는 ‘미측정’ 표시도 그대로 둔다.
- **판정 종류 표(H19-7).** 판정표 3.1을 아래 상수 표로 옮긴다.
  - 열쇠는 `meta.risk.level`과 변형 판별((나) 여부)이다.
  - 묶음 종류는 level이 정한다(판정표 1.3): R0·R3은 전체 묶음, R1·R2는 줄인 묶음이다.
  - 판정 어휘는 **통과·실패·진단·해당 없음** 넷이다. ‘—’는 ‘해당 없음’으로 낸다.
  - **`meta.risk`가 있는 출력에서는 ‘미측정’을 쓰지 않는다.**
  - 판정 칸에 필요한 실행이 출력에 없으면 그 판정은 ‘실패’로 내고, 사유 ‘실행 없음: <실행 키>’를 붙인다.

| 판정 | R0 (가) | R0 (나) | R0 (다) | R1 | R2 | R3 (가)·(다) | R3 (나) |
|---|---|---|---|---|---|---|---|
| J1 | 판정 | 판정 | 판정 | 판정 | 판정 | 판정 | 판정 |
| J2·J5·J6 | 판정 | 판정 | 판정 | 해당 없음 | 해당 없음 | 판정 | 판정 |
| J2b | 진단 | 진단 | 진단 | 해당 없음 | 해당 없음 | 진단 | 진단 |
| J3 | 판정 | 판정 | 판정 | 해당 없음 | 해당 없음 | 판정 | 판정 |
| J4a~c | 판정 | 판정 | 판정 | 판정 | 판정 | 판정 | 판정 |
| J4d | 판정 | 판정 | 판정 | 진단 | 진단 | 판정 | 판정 |
| J7(옛 정의) | 판정 | 판정 | 판정 | 진단(표지) | 진단(표지) | 진단(표지) | 진단(표지) |
| J7(새 정의) | 진단 | 진단 | 진단 | 진단 | 진단 | 판정 | 판정 |
| L0 | 판정 | 판정 | 판정 | 해당 없음 | 해당 없음 | 해당 없음 | 해당 없음 |
| L1 | 해당 없음 | 해당 없음 | 해당 없음 | 진단 | 진단 | 판정 | 판정 |
| L2 | `risk-compare`에서 | | | | | | |
| L3 | 해당 없음 | 해당 없음 | 해당 없음 | 진단 | 진단 | 판정 | 판정 |
| D | 판정 | 해당 없음 | 판정 | 진단(같은 판별로 (나)는 해당 없음) | 진단(같음) | 판정 | 해당 없음 |
| 진단 T | 해당 없음 | 해당 없음 | 해당 없음 | 해당 없음 | 진단 | 진단 | 진단 |
| 진단 C | 해당 없음 | 해당 없음 | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
| 진단 F | 해당 없음 | 해당 없음 | 해당 없음 | 진단 | 해당 없음 | 진단 | 진단 |
| 진단 B | 해당 없음 | 해당 없음 | 해당 없음 | 진단 | 진단 | 진단 | 진단 |

- 판정표 3.1의 ‘J7: 판정(옛 정의) + 진단(새 정의)’(R0)과 ‘R3: 판정(새 정의)’은 위 표에서 J7을 두 행으로 나눠 옮겼다. R1~R3의 옛 정의는 3.1 아래 문단의 ‘진단 표지’다.
- **비교 값(판정표 2절, P8).** R0은 USD 순자산(`usdAssets`), R1~R3은 `analysisValueMinor`다. 이 값을 쓰는 곳은 다음 전부다.
  - **표 ①**: 기준 대비와 순자산 중앙. 머리 ‘USD 순자산’을 ‘분석값’으로 바꾼다.
  - ②~④의 `cell()`
  - J2·J5·J6
  - J3과 ⑥의 1위·300 USD 비교
  - J4d, D
  - 함수들은 비교 값 함수를 인수로 받는다. `meta.risk`가 없거나 R0이면 `usdAssets`를 넘긴다.
- **J3 후보**에서 `MARGIN_BUFFER`·`FOCUS`를 뺀다. `MAX_CONTRIBUTION`은 남는다(판정표 3.2, H15 F4).
- **J4**: J4a~c와 J4d를 서로 다른 판정 행으로 낸다.
  - J4d 띠: R0은 USD 10,600~21,200(지금 상수), R1~R3은 분석값 10,692~21,385다(판정표 3.2).
  - 두 띠는 모두 실행기 상수이고, 경계값은 띠 안으로 친다.
- **⑤ J7(옛 정의)·⑦**: R1~R3이면 ‘USD 몫만·진단’ 표지를 달고 판정 칸을 비운다(판정표 3.1).
- 새 절 **⑨ 위험 판정**을 낸다. 정의는 모두 판정표 2·3절 그대로다. 비율 문턱은 정수 교차곱으로 비교한다.

| 칸 | 계산 |
|---|---|
| J7(새 정의) | 기준 회사의 시드별 비율 = 직접 무역 `realized` 합 ÷ (직접 무역 + 주선 `realized` 합). 그 중앙값이 25% 이상이면 통과다. **분모가 0 이하인 시드는 빼고, 뺀 수를 진단으로 적는다. 남은 시드가 10 미만이면 실패다(H19-9).** 중앙값 비교는 분수 그대로 교차곱(`BigInt`)으로 한다 |
| L0 | R0 기준 회사(`MAX_CONTRIBUTION`, 정시 편만)의 손실 계약(`realized < 0`)이 0건이면 통과다. `LATE_OK`의 손실 수는 기록만 하고 판정에 넣지 않는다 |
| L1 | 기준 회사의 모은 손실 비율 = 20시드 손실 계약 합 ÷ 20시드 대상 계약 합. 대상 = 수락한 직접 무역 전부(열린·완료·취소). **5% ≤ 비율 ≤ 25%** ⇔ `20·손실 ≥ 대상`이고 `4·손실 ≤ 대상`. 대상이 0이면 실패다 |
| L2 재료 | 층마다 기준 회사의 모은 손실 비율(분자·분모)과 시드별 손실 계약 수. 층 사이 판정은 `sim risk-compare`가 한다(아래) |
| L3 | `MARGIN_BUFFER`가 셋을 모두 만족해야 통과다. ① `4·손실MB·대상기준 ≤ 3·손실기준·대상MB`. ② 시드 짝 부호 검정: 두 정책 가운데 하나라도 대상 계약이 0인 시드는 빼고, 시드별 비율이 같은(교차곱이 같은) 시드도 뺀다. 남은 m개 가운데 `MARGIN_BUFFER`가 낮은 시드 수가 문턱표 값 이상이어야 한다. m < 10이면 실패다. ③ `MARGIN_BUFFER` 대상 계약 ≥ 30이고 `2·대상MB ≥ 대상기준` |
| D | **같은 변형 안에서**((가)·(다) 각각) 같은 시드의 `FOCUS`와 `MAX_CONTRIBUTION`(= `EXPAND`) 비교 값을 견준다. 엄격히 큰 쪽이 그 시드를 이긴다. 두 정책이 각각 3/20 이상 이기면 통과다(판정표 3.2). R0·R3은 판정, R1·R2는 진단이다. (나)는 모든 R에서 해당 없음이다(H19-1·H19-2). 짝은 시드 값으로 짓는다 |
| 변형 사이 차이(진단) | (가)·(나)·(다) 사이의 같은 시드 차이(예: (다) − (나)의 기준 회사 비교 값)는 **진단으로만** 내고 판정 칸을 두지 않는다. 표지 ‘변형 사이: 생성기 묶음이 다름(H19-1)’을 단다 |
| 따로 적을 수 | 완료 계약만의 비율, 열린·완료·취소 수와 각각의 손실 수, 열린 계약을 `openFixedRateKrw`로 평가한 민감도 비율, 시드별 비율의 중앙·사분위 |
| 진단 T | R2·R3 기준 회사의 도착한 `onTime` 계약 가운데 `components.tariff ≠ 0`인 비율 |
| 진단 C | 손실 계약마다 `components`의 fx·tariff·surcharge·claim·collection·late·cancel 가운데 가장 큰 음수 칸을 센 분포 |
| 진단 F | R1·R3 기준 회사의 대상 계약 가운데 `components.fx < 0`인 비율과 `components.fx`의 중앙값 |
| 진단 B | 실행마다 `referenceRateBounds`가 참인 시드의 비율 |
| (iii) 재료 | 기준 회사의 시드별 `directAccepted`와 그 합 |

- **D와 공통 난수(H19-1).**
  - D는 같은 변형 안에서 두 정책을 같은 시드로 견준다.
  - 같은 시나리오·같은 시드에서는 공개 묶음(`generateBatch(seed, k, …)`)이 정책과 무관하다. 클레임·수금 추첨의 키도 판매 견적 ID다. 그래서 두 정책이 함께 받은 견적은 위험 결과가 같다(판정표 2절 ‘공통 난수’).
  - 품목 수 G에 따른 생성기 난수 밀림은 **변형 사이** 비교에만 생기므로, 그쪽만 진단으로 낸다. 이 전제는 시험 ‘공통 난수 전제’가 확인한다.
- **L3 ②의 문턱표**는 판정표 3.2의 표를 코드 상수로 옮긴다. 시험이 이항 분포로 다시 계산해 같은지 확인한다.

#### `sim risk-compare A B`(L2, 6.2 (iii), H19-6)

- `simMain`에 `risk-compare`를 더하고 USAGE에 적는다.
- **입력**은 `--risk` 출력 두 개다.
- **입력 검사.** 다음 가운데 하나라도 어기면 종료 코드 2다.
  - 둘 다 `meta.risk`가 있다.
  - `B.level`은 `A.level`의 바로 다음 층이다(R0→R1, R1→R2, R2→R3). 층을 건너뛰거나, 같은 층이거나, 거꾸로면 오류다.
  - 두 출력의 다음 값이 같다.
    - `scenarioIds`, `seeds`
    - `profileId`, `tuningRound`, `marketRulesSha256`
    - `engineVersion`, `dataVersion`, `format`, `lateMode`
  - 두 출력 모두 시나리오마다 모든 시드의 `MAX_CONTRIBUTION` 실행을 담고 있다.
- **짝**은 시나리오별로 **시드 값**으로 짓는다. 실행 순서로 짓지 않는다.
- **출력**(시나리오마다)
  - **L2 ①**: 두 층의 모은 손실 비율과 차이(%p). 통과 조건은 `100·(손실B·대상A − 손실A·대상B) ≥ 대상A·대상B`(1.0%p 이상 오름)다. 어느 쪽이든 대상이 0이면 실패다.
  - **L2 ②**: 기준 회사의 손실 계약 수가 늘어난·줄어든·같은 시드 수. 통과 조건은 늘어남 > 줄어듦이다.
  - **L2 판정**: ①과 ②를 **둘 다** 만족해야 통과다.
  - **(iii)**: A가 R0, B가 R1이고 시나리오가 `OPERATIONS_SCENARIO_IDS`((가))이면 낸다. 기준 회사 `directAccepted` 합이 `2·합R1 ≥ 합R0`인지 보고, 시드별 수도 적는다.
- **종료 코드**: 출력을 냈으면 판정 결과와 상관없이 0이다. 입력·사용법 오류는 2다.

### 5. 실행기 시험의 대상(판정표 6.2 결정 기여 행)

- (i)(ii)는 이 지시서의 완료 조건이다. 아래 시험 ‘결정 기여 부호·크기’로 확인한다.
- (iii)은 (가)·R1 기준 시드에서 받은 직접 무역 수가 (가)·R0의 50% 이상인지 보는 확인이다.
  - 이 지시서에서는 돌리지 않는다. 고정 기록이 찬 뒤 허브의 측정에서 첫 확인으로 돈다(H15 F3).
  - 대신 `risk-compare`가 (iii)을 계산하게 만든다(4절).

## 시험(새 파일 `src/engine/sim/risk-runner.test.ts`)

- 시드는 2001 이상만 쓴다.
  - 시험 파일에 도우미 `riskSeeds(from, count)`를 두고, from < 2001이면 예외를 내게 한다. 시드 목록은 모두 이 도우미로 만든다.
- 필요한 사건은 2001~2200 안에서 찾는다. **찾았는지 먼저 단언한다**(공허한 통과 방지).
- 공통 난수 시험에 한해 `claimFor`·`collectionPlan` import를 허용한다(H19-4). 그 밖의 시험 파일은 2절의 허용 목록을 따른다.
- 손으로 만든 `SimRun`/출력으로 하는 단위 시험은 시드를 쓰지 않는다.

| 시험 | 확인할 것 |
|---|---|
| rules-2 불변 | `--risk` 없는 `d03`·`run`의 출력에 `meta.risk`와 `run.metrics.risk`가 없다. `d03PolicyIds('base')`의 길이와 원소가 BASE와 같고 `MARGIN_BUFFER`·`FOCUS`가 없다. 실행 결과·상태의 바이트는 골든 검사기가, 출력 JSON과 표 문장은 ‘지켜야 할 것’의 두 `cmp`가 지킨다 |
| 결정 기여 부호·크기 | R1 설정에서 `directTradeCandidates`의 후보 가운데 `lateOnNextSailing === false`인 후보마다 (i) D ≠ 0이면 sign(D) = sign(`pnlKrw`) (ii) `|100·pnlKrw − D·rate| ≤ 100 + rate/2`(판정표 6.2, H14-3). 후보가 1개 이상임을 먼저 단언한다 |
| 결정 기여 분기 | D의 기대값은 판정표 6.1 식과 `krwToUsdMinor`로 시험 안에서 따로 계산한다. R0(USD 매입)과 R1(KRW 매입) 각각에서 **`lateOnNextSailing === true`이고 `p.sale < unitPrice × q`인 후보**를 찾았는지 먼저 단언하고(T2), 그 후보의 `contribution`이 기대값과 같은지, 판매가 늦은 감액 전 값인지 확인한다 |
| 수락 순서 | R1 실행 하루에서, `decideOperations`의 직접 무역 ACCEPT 순서가 `directTradeCandidates`의 D 내림차순(같은 매입 견적이면 수량 내림차순)과 어긋나지 않는다(행동 시험) |
| 미리보기 관세 | R2 설정에서 정책이 본 `preview` 관세(`directTradeCandidates`가 돌려준 `preview.duty`)가 같은 견적의 `quotePreview` 관세와 같다(판정표 6.2) |
| 환전 짝 | 성공 경로: 원화가 모자란 KRW 매입 후보에서 `EXCHANGE`+`ACCEPT`가 함께 들어가고, ID가 +1·+2이며, 두 결과가 모두 APPLIED다. `krwShort ≤ 0`이면 환전 없이 ACCEPT만 들어간다. **거절 경로(P5)**: `krwShort > 0`, EXCHANGE는 APPLIED, ACCEPT는 보관(또는 직원) 사유로 REJECTED인 짝을 시험 안에서 만든 상태로 재현한다. 이때 `rejections.storage`(또는 `staff`)만 1 늘고, `funds`는 그대로이며, 두 명령은 `commands`에 없다. **`NO_FX`**: 같은 시드·같은 날 `MAX_CONTRIBUTION`에 `krwShort > 0` 짝이 있었음을 먼저 단언하고, `NO_FX`의 그날 환전 명령이 0개임을 확인한다 |
| `MARGIN_BUFFER` 술어 | 10으로 나뉘는 판매 s에 대해 `marginBufferAccepts(s/10, s) === true`, `marginBufferAccepts(s/10 − 1, s) === false`다. 정책 경로에서는 수락한 직접 무역마다 `10·D ≥ 판매`가 성립한다. 같은 시드의 `MAX_CONTRIBUTION`이 이 조건을 어긴 후보를 받은 적이 있음을 먼저 단언한다 |
| `FOCUS` | (가) R0과 (다) R0, 시드 2001 이상에서 다음을 먼저 단언한다: `MAX_CONTRIBUTION`이 FOCUS 품목이 아닌 직접 무역을 1건 이상 받았고, `FOCUS`가 직접 무역을 1건 이상 받았다. 그런 다음 `FOCUS`가 받은 직접 무역의 매입 품목이 모두 export한 FOCUS 상수와 같은지 본다. 또 FOCUS 상수가 (나)의 1일 정적 매입 견적 `goodId`와 같고(H18-3), (가)의 `trade.goods[0].goodId`와는 다르다는 것도 단언한다. 주선 수락 규칙은 `MAX_CONTRIBUTION`과 같다 |
| `EXPAND` 별칭 | `EXPAND`라는 실행 키가 만들어지지 않는다. D 계산은 `MAX_CONTRIBUTION` 실행을 쓴다 |
| 미래 누설 | 소스를 읽어 확인한다. 정책 파일과 `risk-metrics.ts`·`risk-tables.ts`를 뺀 `sim/**`의 `../risk` import가 허용 목록 안에 있다. `import * as`와 다시 내보내기가 없다. 정책 파일이 `risk-metrics`·`risk-tables`를 import하지 않는다 |
| 분석값 | R1 실행의 `analysisValueMinor` = USD 순자산 + `krwToUsdMinor(KRW 순자산, baseKrwPerUsd)` |
| 비교 값 전환 | 손으로 만든 출력에서, `usdAssets` 순위와 분석값 순위가 반대다. 이 출력이 R1·R3이면 표 ①·`cell()`·J3·J4d·D가 분석값을 따르고, R0이면 `usdAssets`를 따른다 |
| J3 후보 | 손으로 만든 출력에서 `MARGIN_BUFFER`가 매 시드 1위여도 J3 후보에 들지 않는다. `FOCUS`도 같다. `MAX_CONTRIBUTION`은 후보에 남는다 |
| J4d 두 띠 | R0은 USD 10,600·21,200 경계값이 통과이고 10,599·21,201이 실패다. R1~R3은 분석값 10,692·21,385가 통과이고 10,691·21,386이 실패다. J4a~c와 J4d가 서로 다른 행이다 |
| J7(새 정의) | 손으로 만든 계약 목록에서 시드별 비율과 중앙값이 손계산과 같다. 25% 경계(같음)는 통과다. 분모 ≤ 0인 시드는 빠지고, 뺀 수가 진단에 나온다. 남은 시드가 9이면 실패다 |
| L0 | 손으로 만든 출력에서, `LATE_OK`에만 손실 계약이 있으면 L0은 통과이고 `LATE_OK` 손실 수는 기록에만 나온다. 기준 회사에 손실 1건이 있으면 실패다 |
| L1 | 5%와 25% 경계(같음)는 통과다. 경계를 하나 넘는 값(예: 1/21, 6/23)은 실패다. 대상이 0이면 실패다 |
| 계약 분류 | 열린·완료·취소가 겹치지 않는다. 셋의 합이 수락한 직접 무역 계약 수(`directAccepted`)와 같다 |
| onTime | 시드 2001 이상의 R2 실행에서 `onTime === true`인 계약과 `false`인 계약을 각각 1건 이상 찾는다. 각 계약에 대해 수락일 `preview`를 다시 만든 `lateOnNextSailing`과 실제 도착 + 통관 ≤ 납기가 `onTime`과 맞는지 본다 |
| 손실 비율 | 손으로 만든 계약 목록(실현 마진 몇 개)에서 모은 비율·시드별 비율·민감도 비율이 손계산과 같다 |
| L3 | 이항 분포 B(m, 0.5)에서 한쪽 p ≤ 0.05가 되는 최소 문턱을 시험 안에서 계산한다. m = 10~20 모두 코드 상수와 같아야 한다. 손으로 만든 출력에서 확인할 것: 대상 0 시드가 m에서 빠진다. 동점 시드도 빠진다. m = 9이면 실패다. ①의 0.75 경계(같음)는 통과다. ③의 30건·50% 경계를 확인한다 |
| D | 같은 비교 값이면 아무도 이기지 않는다. 시드 짝의 엄격한 대소로만 센다. (가)와 (다)는 각각 그 변형의 두 정책 실행만 쓰고, 다른 변형의 실행을 섞지 않는다. 손으로 만든 출력에서 (가)·(다)의 D가 판정으로 나온다. (나)(`trade.goods.length === 1`)는 해당 없음으로 나온다. R1 출력의 D는 진단으로 나온다 |
| 판정 종류 | 4절 표를 상수로 옮겼는지 확인한다. 손으로 만든 R0·R1·R2·R3 출력마다 각 판정 행의 종류가 표와 같다. `meta.risk`가 있는 출력에 ‘미측정’ 글자가 없다. 실행이 빠진 판정 칸은 ‘실패’와 ‘실행 없음’ 사유로 나온다 |
| 진단 T·C·F·B | 손으로 만든 출력에서 T는 R2·R3에서만, F는 R1·R3에서만, C·B는 R1~R3에서만 진단으로 나온다. 대상은 기준 회사(B는 실행)이고, 값이 손계산과 같다. R0에서는 넷 모두 해당 없음이다 |
| 공통 난수 전제 | (가) R3과 (다) R3 각각, 시드 2001~2003에서 같은 변형의 `FOCUS`·`MAX_CONTRIBUTION` 실행을 견준다. ① 두 실행이 함께 연 공개일마다 묶음과 견적 정의(`offerDef`)가 깊은 비교로 같다. 한쪽이 먼저 실패로 끝났으면 그 뒤 공개일은 견주지 않는다. ② 두 실행이 함께 받은 직접 무역을 `sellOfferId`로 짝짓는다. `claimFor` 결과(null·층·bp)와 `collectionPlan`(방식·일수·분할 수·수금일 − 결제일)이 같다. 금액은 순매출이 같은 짝에서만 견준다. **계약 ID·분개 ID는 견주지 않는다.** 실행 전에 함께 받은 짝 ≥ 1, 클레임 ≥ 1, 정시 아닌 수금 ≥ 1을 찾았음을 단언한다(못 찾으면 시드를 2004 이상으로 넓힌다). **양성 대조**: 시드 2001의 어느 묶음에서 (나)와 (다)의 주선 견적 정의가 다르다고 단언한다 |
| 변형 사이 진단 표지 | ⑨의 ‘변형 사이 차이’ 행에 판정 칸이 없고 H19-1 표지가 있다 |
| 진단 표지 | R1 출력의 표 ⑤ J7(옛 정의)·⑦에 ‘USD 몫만·진단’ 표지가 있고 판정 칸이 비어 있다. R0·rules-2 출력에는 표지가 없다 |
| 워커·합치기 | `workerOptions`가 risk·scenarioIds·tuningRound·marketRulesSha256를 담는다. 시드 2001~2002, `--risk R1`에서 `--workers 2`와 `--workers 1`의 결과 JSON이 같다. 다음은 모두 오류다: `meta.risk` 있는 출력과 없는 출력을 섞은 경우, level만 다른 경우, profileId만 다른 경우, tuningRound만 다른 경우, `marketRulesSha256`만 다른 경우, 요청 risk와 출력 risk가 다른 경우. `--tables-from`도 같다 |
| CLI 인수 | 다음은 오류다: `--round 4`, `--round -1`, `--risk` 없는 `--round 1`, `--risk` 없는 실험 시나리오. `marketRulesSha256`이 `node:crypto`로 계산한 `data/market_rules.json` 파일 해시와 같다(Node 경계 시험) |
| `risk-compare` | 다음은 종료 코드 2다: 층 건너뜀(R0→R2), 같은 층, 거꾸로(R1→R0), 메타가 하나라도 다름, `meta.risk` 없음, `MAX_CONTRIBUTION` 실행 빠짐. 손으로 만든 출력에서 ① +1.0%p는 통과, +0.9%p는 실패다. ② 늘어남 = 줄어듦이면 실패다. ①만 만족하면 L2는 실패다. 시드 순서를 섞은 입력도 같은 결과가 나온다. (가) R0→R1에서는 (iii)이 나오고(`2·합R1 = 합R0`은 통과), 그 밖에서는 나오지 않는다 |
| 결정성 | 같은 시드·같은 `--risk`이면 출력 JSON이 같다 |

## 변형 시험

결과 보고에 각 변형과 그 변형을 잡은 시험을 표로 적는다. 변형한 코드의 결과가 원래 코드와 같으면 ‘잡힘’으로 적지 말고 이유를 적는다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 결정 기여에서 ×100을 뺌(원 ÷ 환율) | 결정 기여 부호·크기 (ii) |
| 2 | 결정 기여의 판매에 늦은 감액 뒤 값을 씀 | 결정 기여 분기 |
| 3 | `marginBufferAccepts`를 `10 × D > 판매`(엄격)로 씀 | `MARGIN_BUFFER` 술어 |
| 4 | `FOCUS`가 `trade.goods[0]`을 씀 | `FOCUS` |
| 5 | `EXPAND`를 따로 실행 | `EXPAND` 별칭 |
| 6 | 환전 짝의 거절 원인을 `results[0]`로 가름 | 환전 짝(거절 경로) |
| 7 | `NO_FX`도 추가 환전을 함 | 환전 짝(`NO_FX`) |
| 8 | 정책이 `dutyFor`를 `import * as risk`로 부름 | 미래 누설 |
| 9 | 분석값에 고정 1,313을 씀 | 분석값 |
| 10 | 열린 계약을 완료로도 셈 | 계약 분류 |
| 11 | L3 문턱표 한 칸을 바꿈 | L3 |
| 12 | `meta.risk`가 없을 때도 표 ⑤에 표지를 닮 | 진단 표지, rules-2 불변 |
| 13 | D를 (나)·(다)의 같은 시드 기준 회사 비교 값으로 계산 | D |
| 14 | ‘변형 사이 차이’에 통과·실패 판정을 냄 | 변형 사이 진단 표지 |
| 15 | (가)에서 D를 해당 없음으로 냄 | D, 판정 종류 |
| 16 | R1 출력에서 J3를 판정함 | 판정 종류 |
| 17 | R1~R3의 `cell()`·J4d가 `usdAssets`를 씀 | 비교 값 전환 |
| 18 | 표 ①의 순자산 중앙만 `usdAssets`를 씀 | 비교 값 전환 |
| 19 | J3 후보에 `MARGIN_BUFFER`를 남김 | J3 후보 |
| 20 | R1~R3에서도 J4d에 USD 띠를 씀 | J4d 두 띠 |
| 21 | J7(새) 분모 ≤ 0 시드를 0%로 넣음 | J7(새 정의) |
| 22 | L0에 `LATE_OK` 손실을 셈 | L0 |
| 23 | L1 상한을 `<`로 비교 | L1 |
| 24 | 대상 0 시드를 `MARGIN_BUFFER` 승으로 셈 | L3 |
| 25 | 진단 F를 R2에서도 냄 | 진단 T·C·F·B |
| 26 | 워커 자료에서 risk를 뺌(지금 `run.mjs` 22행 꼴) | 워커·합치기 |
| 27 | 합치기가 `meta.risk`의 level만 비교 | 워커·합치기 |
| 28 | `risk-compare`가 실행 순서로 짝지음 | `risk-compare` |
| 29 | `risk-compare` L2를 ①만으로 판정 | `risk-compare` |
| 30 | `risk-compare` ②를 늘어남 ≥ 줄어듦으로 셈 | `risk-compare` |
| 31 | `risk-compare`가 층 건너뜀을 받음 | `risk-compare` |
| 32 | `onTime`을 실제 도착만으로 정함(미리보기 조건 뺌) | onTime |
| 33 | `decideOperations`가 `directTradeCandidates`를 쓰지 않고 지역 식으로 D를 다시 계산하되, KRW 갈래만 지금 식(`p.purchase` 직접 뺌)으로 둠 | 수락 순서, 결정 기여 분기 |

## 고칠 수 있는 파일

- `src/engine/sim/**`(기존 시험의 단언은 고치지 않는다). 새 파일: `risk-metrics.ts`, `risk-tables.ts`, `risk-runner.test.ts`
- `docs/ai/tasks/results/TASK-0066.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/engine/*.ts`(sim 밖의 엔진), `src/content/**`, `src/ui/**`, `data/**`, `schemas/**`, `vite.config.ts`, `package*.json`, `index.html`
- 골든 파일과 검사기
  - 파일: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`
  - `--write`를 쓰지 않는다.
- 판정표, 설계 6절

## 지켜야 할 것

- **골든 진단 절차(허브 통일 문장)**
  1. 작업 전에 `node tools/check_rules2_golden.mjs`의 종료 코드가 0인지 확인한다. 0이 아니면 고치지 말고 멈춘다.
  2. `--dump <밖>/before`를 만든다.
  3. 작업 뒤 골든이 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다.
- **rules-2 출력 불변(두 `cmp`).** 골든은 실행·상태를 지키지만, `d03`의 출력 JSON과 `d03Tables`의 표 문장은 지키지 않는다. 그래서 다음 둘을 확인한다.
  1. **표 문장**
     - 작업 전에 `<BASE>`에서 `node src/engine/sim/run.mjs d03 --seeds 2 --out <밖>/d03-before.json`을 돌린다. 이 출력을 `--tables-from`으로 다시 표로 만들어 저장한다.
     - 작업 뒤 같은 입력 JSON으로 만든 표와 `cmp`해서 차이가 0이어야 한다.
     - 이것이 시드 2001 미만으로 하는 유일한 실행이다. 기준 시드 앞 2개의 rules-2 실행이고, rules-2 실행은 잠금 대상이 아니다.
  2. **출력 JSON**
     - 작업 전에 `<BASE>`에서 `node src/engine/sim/run.mjs d03 --seed-base 2001 --seeds 2 --out <밖>/d03-2001-before.json`을 돌린다.
     - 작업 뒤 같은 명령의 출력과 바이트 `cmp`해서 차이가 0이어야 한다.
- 측정 금지(원칙). `--risk` 실행, 새 정책 실행, 실험 시나리오 실행은 시험 안에서 2001 이상 시드로만 한다.
- `review_checks` 통과.

## 완료 조건

1. 지시 1~5를 반영했고, 시험 표의 시험이 모두 통과한다.
2. 다음이 모두 통과한다(골든 검사 포함).
   - `npx vitest run`
   - `npm run typecheck`
   - `npm run build`
   - `python3 tools/validate_data.py`
   - `bash tools/ai/review_checks.sh --check <BASE>`
3. 변형 표의 모든 행이 잡힌다. 잡히지 않은 행은 원래 코드와 결과가 같은 이유를 적었다.
4. `git diff --stat <BASE> -- ':(glob)src/engine/*.ts' src/content data schemas tests/golden tools docs/ai/design`의 출력이 비어 있다(`<BASE>`는 머리의 BASE).

## 결과 보고에 넣을 것

- 바꾼 파일과 함수, 새 CLI 인수, `meta.risk`와 `run.metrics.risk`의 꼴, 관측 이음매 함수 셋의 시그니처
- 2001 이상 시드로 돌린 확인 실행 몇 개의 ⑨ 표와 `risk-compare` 출력. 값을 고치지 않고 적기만 한다. 측정이 아니다.
- 두 `cmp` 결과, 골든 검사기 종료 코드, 시험 수, 변형 표
- 판정표 6.1과 실제 엔진 동작이 다른 곳을 찾았으면 그 문장과 재현 방법(고치지 않는다)
- 범위 밖 발견과 질문

## 허브 확인(초안 0)

- **번호.** 경로 5 실행기를 TASK-0066으로 두었다. 0065(rules-3 시나리오 레코드)가 앞선다.
- **새 표의 자리.** 지금 표 ①~⑧은 `meta.risk`가 없으면 그대로 둔다. 위험 판정은 새 절 ⑨와 `sim risk-compare`(층 사이 L2)로 낸다. L2는 두 출력(R0과 R1 등)을 견줘야 하므로 한 출력 안에서 낼 수 없다.
- **시험 시드 2001 이상.** 판정표는 시험 시드를 정하지 않는다. 측정 결과를 미리 보지 않도록 이 지시서가 정했다. 판정표 4절의 시드 묶음과 겹치지 않는다.
- **(iii)의 자리.** H15 F3대로 측정의 첫 확인으로 둔다. 이 지시서는 `risk-compare`의 계산까지만 만든다.
- **rules-2 표 문장 확인에 기준 시드 앞 2개를 쓴다.** rules-2는 잠금 대상이 아니고, TASK-0032에서 이미 관측됐다. 허브가 꺼리면 2001 시드로 바꿀 수 있다.

## 초안 1 변경(2026-10-17, 세션 A)

- **H18-6의 적용 범위를 바로잡았다.** D는 같은 시드 비교이고, H18-6이 말한 생성기 난수 밀림은 변형 사이 비교에만 해당한다는 내용이다. 허브가 H19-1로 정정했다.
- **선행과 BASE.** 0062~0065 병합(`97e7227`) 뒤의 규칙으로 맞췄다.
- **rules-3 `preview`의 `goodId` 필수**를 2절에 적었다.
- **공유 계산 lazy**를 원칙에 넣었다.
- 완료 조건 3을 ‘모든 행’으로 바꿨다.

## 초안 2 변경(2026-10-17, 세션 A, H19 반영)

사전 확인 보고서의 id와 허브 결정 번호를 함께 적는다.

- **major 7건**
  - **P1·J9(H19-2)**
    - D의 범위를 (가)·(다)로 넓혔다. 조건별로 R0·R3은 판정, R1·R2는 진단이고, (나)는 해당 없음이다.
    - (나) 판별은 `trade.goods.length === 1`로 한다(원칙).
    - 시험 D를 고쳤고, 변형 15를 더했다.
  - **P3(H19-3)**
    - 관측 이음매 함수 셋(`directTradeCandidates`·`decisionContribution`·`marginBufferAccepts`)을 두고, `decideOperations`가 반드시 이 함수들을 쓰게 했다.
    - 기대값은 시험 안에서 따로 계산한다. 행동 시험 ‘수락 순서’와 변형 33을 더했다.
  - **P4(H19-4)**
    - 공통 난수 시험이 계약·분개 ID를 견주지 않게 했다. `sellOfferId` 짝에서 `claimFor`·`collectionPlan` 결과를 견준다.
    - 이 파일에만 import를 허용한다. ‘찾았음’ 단언을 두고, (가)·(다) R3을 둘 다 돈다.
    - 양성 대조는 단언으로 바꿨다.
  - **P2·A11(H19-5)**
    - `workerOptions`를 두었다. 합치기는 `meta.risk`를 깊은 비교한다.
    - `marketRulesSha256`을 더했다. 해시는 `run.mjs` 경계에서 계산한다.
    - `--round` 범위와 `--risk` 의존을 검사한다.
    - 시험 ‘워커·합치기’·‘CLI 인수’와 변형 26·27을 더했다.
  - **P5**
    - 환전 짝의 거절 경로(`results[1]` 분류)와 `NO_FX`의 공허함 방지 단언을 시험에 넣었다.
    - 2절에 거절 원인 분류를 명시했다.
  - **J4(H19-7)**
    - 다음에 시험과 변형(17~25)을 넣었다: 비교 값 전환(표 ① 포함), J3 후보, J4d 두 띠, J7(새), L0, L1, 진단 T·C·F·B.
  - **P12(H19-6)**: `risk-compare`의 계약을 정했다. 입력 검사, 시드 값 짝, 정수 교차곱, (iii), 종료 코드, USAGE다. 시험과 변형 28~31을 더했다.
- **minor와 받아들인 다툼**
  - J3·P7(H19-7): 4절에 조건별 판정 종류 표를 두었다. ‘미측정’은 금지하고, J4는 a~c와 d로 나눴다.
  - P8: 비교 값 목록에 표 ①을 넣었다.
  - J7: L0·L1 문턱을 판정표 문장대로 적었다. J7(새) 분모 처리는 H19-9를 따른다.
  - P6: `FOCUS` 시험을 (가) R0과 (다) R0으로 돌리게 했다. 공허함 방지와 H18-3 상수 단언을 넣었다.
  - T2: 늦은 후보의 감액 전 판매를 확인하기 전에 그런 후보를 찾았는지 먼저 단언한다.
  - T10: 변형 3을 결정적으로 갈리는 꼴(`>`)로 바꿨다. 술어에 경계 단언을 넣었다.
  - T11(H19-8): `../risk` import를 허용 목록으로 바꿨다. `import * as`와 다시 내보내기를 금지했고, 변형 8을 `dutyFor`로 바꿨다.
  - A7·T12(H19-8): 고정 목록 문장, `d03PolicyIds` 단언, d03 출력 JSON 바이트 `cmp`(시드 2001)를 넣었다.
  - 다툼 P9·A5(H19-8): 측정 금지 범위를 넓혔다(R0, 새 정책, 실험 시나리오 포함). 예외가 표 문장 `cmp` 하나뿐임을 명시했다. `riskSeeds` 도우미와 ‘실험 시나리오는 `--risk` 없이 주면 오류’를 더했다.
  - 다툼 J6: L3 ②에서 대상 0 시드를 빼고, m < 10이면 실패로 한다. 이를 ⑨ 표와 시험에 넣고 변형 24를 더했다.
  - 다툼 P10: `onTime`은 수락일 `preview`를 다시 만들어 정한다. 시험 ‘onTime’과 변형 32를 더했다.
  - P11·J2·A4(H19-1): 머리 마지막 줄을 ‘H18-6(H19-1로 정정)을 따른다’로 바꾸고 ‘다만’ 문장을 지웠다.
  - 기각 A1: 그래도 완료 조건 4의 pathspec을 `':(glob)src/engine/*.ts'`로 단단하게 했다.
- **세션 A가 정한 것(허브 확인 요청)**
  1. `meta.risk`가 있는 출력에서 판정 칸에 필요한 실행이 빠졌으면 ‘실패(실행 없음)’로 낸다. 이유: 판정 어휘 넷 안에서 ‘미측정’을 대신할 값이 필요하고, 자료 없이 통과시키지 않는 쪽이 안전하다.
  2. `marketRulesSha256`은 `run.mjs`에서 계산해 `SimIo`로 넘긴다. 이유: `sim/*.ts`는 파일을 읽지 않는다는 지금 경계를 지키기 위해서다. 그래서 고칠 수 있는 파일의 범위는 그대로다(`run.mjs`는 `sim/**` 안에 있다).
  3. `risk-compare`는 출력을 냈으면 판정이 실패여도 종료 코드 0으로 끝낸다. 지금 `compare`의 ‘다름 = 1’과 달리, 판정은 표의 내용이고 실행 오류가 아니기 때문이다.
  4. 원화 곱셈은 `BigInt`로 한다. J7(새)의 중앙값 교차곱은 원화 실현 마진끼리 곱하므로 2^53을 넘을 수 있다.
