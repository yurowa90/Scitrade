# TASK-0075 경로 11 읽기 함수(②-b): 묶이는 돈, 외상 잔액, 가용 대비, 중간 재무상태, 원화 환산 결산

- **지위: 승인(허브, 2026-10-31, 개정 1).** 허브 재확인: 4.0 표 밖에서 grep에 걸린 다섯 파일도 영향이 없다. `m2a5-risk-default-v2.test.ts:109`(상태 해시, 읽기 함수는 상태를 바꾸지 않음), `m2a5-money-ui.test.ts:30`·`m2a5-ops-ui.test.ts:33`(화면 HTML 해시, 이번에는 화면을 그리지 않음), `check_rules2/3_golden.test.mjs`(덤프 폴더 개수)다. 이 다섯 가운데 하나라도 실패하면 멈추고 보고한다.
  - 초안(`d321d58`, `91c8552`)은 허브 사전 검수 `docs/ai/tasks/PRECHECK-0075-HUB-2026-10-31.md`(중대 12)를 받았다.
  - 처리는 끝의 ‘개정 1 처리표’에 있다.
- 근거
  - `docs/DECISIONS.md` 2026-10-31 결정 2·3·4·7
  - 허브 결정 H34-1·H34-3·H34-4, H36(통화 순서 사전순), 허브 답(반올림 줄마다, `CURRENCY_TRANSFER`는 자본 줄)
  - `docs/ai/design/path11-engine-seam-2026-10/SCOPE.md` 1.1~1.4·1.7·1.8, 3.1
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: TASK-0074가 병합된 개발 브랜치에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **성격: 읽기만 한다.** 상태, 저장, 결정, sim 출력, 기존 화면 HTML은 바뀌지 않는다.
- 범위 밖
  - 화면 그리기(Sol 지시서)
  - 대손 기대(결정 7)
  - 회계 분류 확정(결정 4, 교사 검토 대기)
  - 놓친 견적(`operations.unaffordable`) 읽기
  - 측정
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 기본 `node src/engine/sim/run.mjs run` 400회 회귀 하나다. 이 회귀는 고정 시드 1001~1020을 그대로 쓴다.

## 0. 먼저 읽을 것

줄 번호는 개정 시점(TASK-0074 병합 뒤 HEAD)의 값이다. 다르면 이름으로 찾는다.

- `src/engine/readers.ts`: `quotePreview`(:33), `creditTermOptions`(:262)
- `src/engine/engine.ts`: `creditTermCheck`(:300-346, 노출은 BASE를 빼고 센다 :324-328, 한도는 D15·D30만 :335-342), 직접 무역 계약의 `creditTermId ?? 'BASE'`(:433-435), `createGame` 시작 자금 분개(day 0, :57-69), `commitDay` 끝의 `s.day = day + 1`(:957)
- `src/engine/reports.ts:410` `receivableSchedule`(`overdueDays = max(0, s.day − dueDay)`)
- `src/engine/reservations.ts:62` `fundsPosition`
- `src/engine/ledger.ts`
  - `ACCOUNT_KIND`(:35-61)
  - 줄 부호는 차변 양수다(:63).
  - `balance()`는 정상 잔액 방향을 양수로 낸다(:116-124).
  - `summarize`(:170)와 그 `profit`(:213)
- `src/engine/risk.ts`
  - `divHalfAway`(:12), `usdToKrwMinor`(:17)
  - `referenceRate`(:19-30): FX 층에서 주차(`firstDay`, `intervalDays`)마다 `drawAt(seed,'FX-REF',k)`로 걸음을 뽑는다.
  - 결과 추첨: `claimFor`(:130), `collectionPlan`(:143), `defaultFor`(:158)
- 공개 일정: `config.operations.market.publish`. 자료값은 `first_day 1`, `interval_days 7`, `last_day 78`, `valid_days 3`이다(`data/market_rules.json`).
- sim: `simulate(config, policy, seed, observe?)`(`src/engine/sim/sim.ts:26`)
  - 외상을 고르는 정책은 `TERM_GREEDY`·`CREDIT_AWARE`다(`operations-policy.ts:43-56`, D30 → D15 → BASE).
  - 기존 도우미: `risk-runner-v2.test.ts:23-28`(`simulation`), `:37-60`(`hand`)
- 지연 청크: `src/ui/ops-screens.ts`(재수출 세 줄), `src/ui/main.ts:45-68`(`ensureOpsScreens`)
- 빌드 청크 시험 예: `src/ui/situation.test.ts:361-379`, `tools/bundle-size.mjs:107`(`collectDist(dir).lazy`)
- 기존 ‘미래 누설 없음’ 감시: `m2a5-risk-credit.test.ts:17-24`, `:191-192`

## 1. 지켜야 할 것

1. **상태를 바꾸지 않는다.** 모든 새 함수는 얼린(deep-frozen) 상태 사본으로 불러도 예외가 없어야 한다.
2. **미래 누설 금지(C1·C5·C19)**
   - 결과 추첨 함수 `claimFor`·`collectionPlan`·`defaultFor`는 직접이든 간접이든 부르지 않는다.
   - 시드로 정해진 경로 함수 `referenceRate`·`dutyFor`가 안에서 `drawAt`·`drawUniform`을 쓰는 것은 허용한다. 새 모듈이 `drawAt`·`drawUniform`을 직접 부르는 것은 금지한다.
   - 대신 **`referenceRate`의 `day` 인수는 늘 `≤ s.day`**다. 환율 경로가 시드로 정해져 있어서, 앞날 환율을 부르면 미래가 샌다.
   - `asOfDay > s.day`이면 예외를 낸다.
3. **원천 검사 제약**(이미 있는 시험이 새 모듈에도 걸린다. 3절 0 참조)
   - 새 엔진 모듈은 `surchargeBp(`·`tariffEvents(`·`dutyEstimate(`·`claimFor(`·`collectionPlan(`을 부르지 않는다.
   - 글자 `unaffordable`도 쓰지 않는다.
4. **기대값은 손 계산 사례**(H34-4). 세션 B 하네스 값(₩585,035 등)은 결과 보고의 대조 줄에만 둔다.
5. 기존 시험은 고치지 않는다.

## 2. 바꾸는 파일(이 목록뿐)

| 파일 | 허용하는 변경 |
|---|---|
| 새 `src/engine/path11-readers.ts` | 2.1~2.5의 함수 다섯 |
| 새 `src/ui/path11-labels.ts` | 줄 이름 표(엔진 밖). 결정 4 임시 문구 |
| `src/ui/ops-screens.ts` | 위 두 모듈의 재수출 줄 추가만 |
| 새 `src/engine/path11-readers.test.ts` | 4절의 시험 |
| `docs/ai/tasks/results/TASK-0075.md` | 결과 보고 |
| `MANIFEST.json` | `python3 tools/build_package.py --manifest-only`로 다시 만듦 |

- 새 `lazyScreen`은 더하지 않는다. 운영 묶음(`ops-screens`) 하나로 받는다. 따라서 `code-split.test.ts:167`의 모의(로더 문자열에 `ops-screens`)도 그대로 맞는다.
- 그 밖의 파일(`STATUS.md`, `tasks/README.md` 포함)은 고치지 않는다. 기록은 허브가 한다.

## 3. 함수(출력 모양과 부호는 이것을 따른다)

### 3.0 공통 규칙

- **통화 순서**: 통화 코드 사전순(`KRW`, `USD`)이다.
- **부호**: 모든 계정 금액은 `balance()`와 같은 **정상 잔액 방향**이다. 자산·비용은 차변, 부채·자본·수익은 대변 잔액을 양수로 쓴다.
- **원화 환산 단위**(C17)
  - (ㄱ) 수익·비용·자본 계정: **원장 줄마다** 분개일 `referenceRate`로 `usdToKrwMinor` 한 뒤 계정별로 더한다.
  - (ㄴ) 자산·부채 계정: **계정 잔액마다** `asOfDay`의 환율로 한 번 환산한다.
  - (ㄷ) 통화별 합계(가용, 미수, 현금 유출)의 원화 값: **통화별 합을 한 번** 환산한다. 그래서 2.2의 `totalKrwMinor`와 2.3의 `receivableKrwMinor`는 같은 값이다(C10).
  - KRW 금액은 그대로 쓴다.
- **환율 조회일**: 3.1·3.2·3.3은 `s.day`, 3.5는 분개일과 `asOfDay`다. 모두 `≤ s.day`다.

### 3.1 `creditLockPreview(s, config, buyOfferId, sellOfferId, quantity?)`(SCOPE 1.2)

- rules-4가 아니면 `[]`.
- `creditTermOptions`의 행마다 다음을 낸다.

  ```
  { termId, allowed, reasonKo,
    cashOut: { currency, amountMinor }[],
    cashOutKrwMinor,
    paymentDueDay, lockDays,
    publishesInWindow,
    exposureAfterMinor, limitMinor }
  ```

  - `cashOut`: 지금 인수하면 나가는 통화별 현금. `quotePreview`의 값이다.
  - `cashOutKrwMinor`: (ㄷ) 규칙, `s.day` 환율.
  - `lockDays = paymentDueDay − s.day`
  - `publishesInWindow`: `(s.day, paymentDueDay]`(왼쪽 제외, 오른쪽 포함) 사이의 공개일 수. 공개일은 `firstDay + k·intervalDays ≤ lastDay`(k ≥ 0)다.
  - **`exposureAfterMinor`(C6)**
    - BASE 행: `exposureMinor` 그대로. 엔진은 BASE를 노출에 넣지 않는다(`engine.ts:324-328`).
    - D15·D30 행: `exposureMinor + saleAmountMinor`. `saleAmountMinor`는 할증을 반영한 그 행의 값이다.

### 3.2 `receivablesByTerm(s, config)`(SCOPE 1.3)

- 반환은 늘 `{ rows, totalKrwMinor }` 하나의 모양이다(C10). rules-4가 아니면 `{ rows: [], totalKrwMinor: 0 }`이다.
- 열린 청구서(`receivableSchedule` 행)를 `(termId, grade, currency)`로 묶는다.
  - 행 하나: `{ termId, grade, currency, outstandingMinor, count, overdueCount }`
  - `termId`: 계약의 `creditTermId ?? 'BASE'`
  - **`grade`(C7·C16)**
    - 직접 무역은 거래처 등급(`risk.profile.collections.byCounterparty`)이다.
    - 운송 주선(FORWARDING) 청구서는 등급이 없으므로 `null`이다. `termId`는 `'BASE'`이고, 직접 무역 BASE와 **다른 행**이 된다.
  - `overdueCount`: 그 묶음에서 `status === 'OVERDUE'`인 청구서 수다. 엔진은 결제일 당일 미수를 바로 OVERDUE로 바꾼다(`engine.ts:1231, 1250`).
  - 순서: `termId`(BASE, D15, D30) → `grade` 사전순, `null`은 맨 뒤 → 통화
- `totalKrwMinor`: (ㄷ) 규칙, `s.day` 환율.

### 3.3 `cashLockSummary(s, config)`(SCOPE 1.4)

- 운영이 없으면 `null`.
- 출력

  ```
  { available: { currency, amountMinor }[],
    receivable: { currency, amountMinor }[],
    availableKrwMinor, receivableKrwMinor,
    lockedShareBp }
  ```

  - `available`은 `fundsPosition(…).available`, `receivable`은 열린 청구서 잔액 합이다.
  - `lockedShareBp = divHalfAway(receivableKrw × 10000, availableKrw + receivableKrw)`. 분모가 0 이하면 `null`이다.

### 3.4 `balanceSheetAt(s, config, asOfDay)`(SCOPE 1.7, 결정 3)

- `asOfDay > s.day`면 예외.
- 통화마다 `day ≤ asOfDay`인 분개만 넣은 장부(`L_d`)로 계산한다.
- 출력

  ```
  { asOfDay,
    byCurrency: { currency,
      assets: { account, amountMinor }[],
      liabilities: [...],
      equity: [...],
      retainedMinor }[] }
  ```

  - 계정은 `ACCOUNT_KIND`의 선언 순서이고, 잔액 0인 계정도 넣는다.
  - `amountMinor`는 `balance(L_d, currency, account)`(정상 잔액)다.
  - **`retainedMinor = summarize(L_d, currency).profit`**(C9)
- 금액은 원장만으로 정해진다. 재고 수량이나 청구서 상태는 복원하지 않는다.

### 3.5 `settlementKrw(s, config, asOfDay)`(SCOPE 1.8, 결정 2)

- 운영이 없으면 `null`. `asOfDay > s.day`면 예외.
- 환산: 3.0 (ㄱ)·(ㄴ). `CURRENCY_TRANSFER`는 자본 계정으로 (ㄱ)을 따른다(허브 답).
- 출력

  ```
  { asOfDay, rateAsOf,
    income: { account, krwMinor }[],
    equity: { account, krwMinor }[],
    assets: { account, krwMinor }[],
    liabilities: { account, krwMinor }[],
    fxTranslationKrwMinor }
  ```

  - 모든 `krwMinor`는 정상 잔액 방향이다.
  - `income`은 수익과 비용 계정을 모두 담는다. 비용도 양수(차변 잔액)로 담는다.
- **`fxTranslationKrwMinor`(‘환율 변동 손익’, C4·C14)**
  - 이익 방향을 양수로 둔다.
  - 정의: 모든 원장 줄(`day ≤ asOfDay`)을 **차변 양수** 부호로 3.0 (ㄱ)·(ㄴ)대로 환산해 더한 값이다.
  - 원래 통화에서는 이 합이 0이다. 환산 시점이 갈리면서 생기는 나머지가 이 값이다.
  - 그러면 정상 잔액 부호로 다음 항등식이 원 단위로 맞는다:
    `Σ assets − Σ liabilities = Σ equity + (Σ 수익 − Σ 비용) + fxTranslationKrwMinor`
  - 예: USD 현금 X만 있고 환율이 r₀ → r₁로 오르면, `fxTranslationKrwMinor = usdToKrwMinor(X, r₁) − usdToKrwMinor(X, r₀) > 0`(이익)이다.
- **줄 이름은 엔진 밖이다.** 엔진은 `account` 키만 낸다.
  - 이름 표는 `src/ui/path11-labels.ts`(`SETTLEMENT_LINE_KO`)에 둔다. 결정 4의 임시 문구를 쓴다.
  - 교사 검토 뒤에는 이 표만 바꾼다.

## 4. 시험(2001 이상 시드)

### 4.0 영향 범위(grep으로 정의, TASK-0074 교훈)

BASE에서 다음 명령을 돌려 결과를 결과 보고에 붙인다. 개정 시점 결과와 판단은 표와 같다. 목록 밖이 나오면 멈추고 보고한다.

```
grep -rn "import.meta.glob" src --include=*.test.ts
grep -rln "subtle.digest\|createHash" src --include=*.test.ts
grep -rn "ops-screens\|readdirSync" src --include=*.test.ts
```

| 시험 | 영향 |
|---|---|
| `m2a5-risk-cost.test.ts:941`(src/engine/*.ts 원천) | 새 모듈에 걸린다. 1절 3 제약을 지키면 통과 |
| `m2a5-risk-fx.test.ts:636`(`dutyEstimate`) | 같음 |
| `m2a5-risk-credit.test.ts:443`(추첨 호출 위치, reports·readers의 rng import) | 같음. 새 모듈 이름은 `readers.ts`가 아니므로 rng import 검사 대상은 아니다. 그래도 rng를 import하지 않는다 |
| `save-v7.test.ts:187`(`unaffordable` 글자) | 같음 |
| `sim/m2a5-sim.test.ts:234`, `sim/risk-runner.test.ts:526` | src/engine/sim만. 영향 없음 |
| 상태 해시: `m2a5-risk-default-v2`, `risk-runner`, `code-split`, `m2a5-money-ui`, `m2a5-ops-ui` | 상태·화면 HTML을 바꾸지 않으므로 영향 없음 |
| `code-split.test.ts:167`(로더 문자열) | 새 `lazyScreen`이 없으므로 영향 없음 |
| `situation.test.ts:362`(빌드 청크) | 영향 없음 |
| `content/character-fields.test.ts:120`(characters.json import 파일 목록) | 새 모듈이 characters.json을 import하지 않으면 영향 없음 |

### 4.1 새 시험

1. **두 길 대조(베끼지 않는 기대값, C9·C12)**
   - (가) 열린 상태 `s`에서 통화마다 `balanceSheetAt(s, cfg, s.day)`의 계정 잔액이 `balance(s.ledger, …)`와 같고, `retainedMinor === summarize(s.ledger, currency).profit`이어야 한다.
     - 이 비교는 당일 분개가 없는 열린 상태라 V1을 가르지 못한다. 그것은 (나)가 맡는다.
   - (나) 새 시나리오 시드 2001을 `simulate(cfg, policyById('TERM_GREEDY')!, 2001, observe)`로 끝까지 돌린다. `observe`는 열린 상태를 받는다(`sim.ts`). 그 가운데 `s.day = d + 1`인 상태를 날 d를 마친 상태 `closed_d`로 모은다. `openDay`는 분개를 쓰지 않으므로 이 상태의 원장은 d일 마감 원장과 같다(`engine.ts:131-163`).
     - 기대값: `summarize(closed_d.ledger, currency)`의 칸과 `balance(closed_d.ledger, …)`
     - 실제값: `balanceSheetAt(끝 상태, cfg, d)`
     - d는 1, 30, 60과 끝이다.
     - 각 d마다 `day === d`인 분개가 하나 이상 있음을 먼저 단언한다(1일은 RENT·WAGE 분개가 있다).
2. **손 계산: 공개 횟수**
   - 공개 일정은 자료 값으로 읽는다.
   - 경계 둘을 넣는다: `paymentDueDay`가 공개일인 경우(포함), `s.day`가 공개일인 경우(제외).
   - 계산 한 줄을 주석에 적는다.
3. **손 계산: 잠김 비율(C11·C18)**
   - 가용·미수를 정한 사본에서 `2 × (나머지) ≥ 분모`인 값을 고르고 `lockedShareBp`를 손 계산한다. 정확히 절반인 경우도 하나 넣는다.
   - 분모가 0인 사본은 `null`이어야 한다.
4. **손 계산: 환율 변동 손익(C8·C13·C14)**
   - (가) 시작 자금 사례
     - 새 시나리오 시드 2001을 명령 없이 `d₁ = firstDay + intervalDays`(8일) 이상까지 진행한다.
     - **`r(d₁) ≠ r(0)`을 먼저 단언한다.** 맞지 않으면 시드를 2002, 2003… 차례로 바꾼다. 2010까지 없으면 멈춘다.
     - USD 분개가 `OPENING-USD`(day 0) 하나뿐임을 단언한다.
     - 기대값: `usdToKrwMinor(X, r(d₁)) − usdToKrwMinor(X, r(0))`. X는 시작 USD 현금이다.
   - (나) 수익·비용 사례(V2 판별)
     - (가)의 사본에, 환율이 다른 두 날 dₐ < d_b ≤ s.day에 USD 비용 분개 둘을 장부에 `post`로 손으로 넣는다. 금액은 센트 반올림 나머지가 생기는 값이다.
     - 기대 비용 줄 KRW: `usdToKrwMinor(금액, r(분개일))`의 합
     - 이 값이 `usdToKrwMinor(금액, r(asOfDay))` 합과 다름을 단언한다.
     - 항등식(3.5)이 원 단위로 맞음도 단언한다.
   - (다) FX 층을 끈 사본(환율 고정)에서는 `fxTranslationKrwMinor === 0`이어야 한다.
5. **줄마다 반올림(C17)**
   - 4-4 (나) 사본에서 `settlementKrw`의 비용 줄이 ‘원장 줄마다 환산 후 합’이고, ‘합 후 환산’과 다름을 단언한다.
   - 둘이 다르게 되는 금액을 고른다.
6. **외상 묶음(C7·C10·C15·C16)**
   - `simulate(cfg, policyById('TERM_GREEDY')!, seed)`, seed 2001~2010에서 날마다 상태를 본다. 다음을 **모두** 가진 상태를 찾는다.
     - 열린 D30(또는 D15) 직접 무역 청구서 ≥ 1
     - 열린 BASE 직접 무역 청구서 ≥ 1
     - 열린 FORWARDING 청구서 ≥ 1
   - 없으면 멈추고 보고한다. 그때 `risk-runner-v2.test.ts:37-60` `hand()` 방식의 손 고정물을 쓸지는 허브가 정한다.
   - 그 상태에서 단언할 것
     - 행 합(통화별)이 `receivableSchedule` 합과 같다.
     - 주선 행은 `{ termId: 'BASE', grade: null }`이고 직접 무역 BASE 행과 따로 있다.
     - `totalKrwMinor === cashLockSummary(…).receivableKrwMinor`
     - `overdueCount`가 `status === 'OVERDUE'` 수와 같다.
7. **노출(C6)**: 같은 짝에서 BASE 행의 `exposureAfterMinor === exposureMinor`이고, D30 행은 `exposureMinor + saleAmountMinor`다.
8. **미래 누설·순수성(C1·C5·C19)**
   - 새 함수 다섯을 얼린 상태로 부른다.
   - `vi.mock('./risk')`(기존 `m2a5-risk-credit.test.ts:21-24` 방식)로 `claimFor`·`collectionPlan`·`defaultFor`를 감시해 호출 0을 본다.
   - 같은 방식으로 `referenceRate`를 감싸 받은 `day`가 모두 `≤ s.day`인지 본다.
   - 한계를 결과 보고에 적는다. `vi.mock`은 모듈 경계를 넘는 호출만 잡는다. 그래서 `risk.ts` 안의 내부 호출(`dutyFor` → `referenceRate`)은 감시되지 않는다.
   - `asOfDay = s.day + 1`이면 예외가 나야 한다.
9. **rules 경계**
   - rules-1: `cashLockSummary`·`settlementKrw`는 `null`, `creditLockPreview`는 `[]`, `receivablesByTerm`은 `{ rows: [], totalKrwMinor: 0 }`
   - rules-2: `creditLockPreview`는 `[]`, `receivablesByTerm`은 빈 모양, 나머지 셋은 값을 낸다.
10. **첫 화면 밖 확인(C2·C20)**: (가)와 (나)를 둘 다 한다.
    - (가) 정적 닫힘
      - `src/ui/main.ts`에서 출발해 **값** 정적 import와 `export … from`을 따라 파일 닫힘을 만든다.
      - 제외: `import type`, `{ type X }`만 든 import, 타입 위치의 `typeof import('…')`, 동적 `import()`
      - 닫힘 안에 `path11-readers.ts`·`path11-labels.ts`가 없음을 단언한다.
      - 음성 대조 둘: 메모리 사본에서 `main.ts`에 값 import 한 줄을 넣은 경우, `src/engine/readers.ts`에 `export { … } from './path11-readers'` 한 줄을 넣은 경우. 둘 다 거부해야 한다.
    - (나) 빌드 청크
      - `situation.test.ts:361-379` 방식으로 빌드한다(`outDir: '/tmp/T75-test-dist'`).
      - 새 모듈의 고유 문자열 하나(예: 오류 문구)가 `collectDist(dir).lazy` 청크에만 있고 첫 화면 청크에는 없음을 단언한다.
      - 시험 끝에 출력 폴더를 지운다.

## 5. 첫 화면 예산(H34-3)

- 화면·읽기 몫은 첫 화면 gzip 증가 **≤ 300 B**다. 엔진 핵심 변경이 없으므로 엔진 몫은 0이다.
- 측정
  - BASE와 작업 뒤를 각각 `git archive`로 깨끗한 트리(`/tmp/T75-build-before`·`-after`)에 풀어 빌드한다.
  - `node tools/check_bundle_size.mjs dist`로 첫 화면 gzip 전·후와 `ops-screens` 청크 전·후를 적는다.
- 300 B보다 크면 멈추고 보고한다.

## 6. 변형 시험

변형마다 어느 시험이 왜 실패하는지 한 줄씩 적는다. 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | `balanceSheetAt`이 `day < asOfDay`로 거른다 | 4.1-1 (나) |
| V2 | 수익·비용을 `asOfDay` 환율로 환산한다 | 4.1-4 (나) |
| V3 | 비용 줄을 ‘합 후 환산’으로 한다 | 4.1-5 |
| V4 | `publishesInWindow`가 `s.day`를 포함한다 | 4.1-2 경계 |
| V5 | `lockedShareBp`가 버림을 쓴다 | 4.1-3 |
| V6 | `cashOutKrwMinor`에 `paymentDueDay` 환율을 쓴다 | 4.1-8 `referenceRate` 인수 |
| V7 | `receivablesByTerm`이 `creditTermId` 없는 계약(주선)을 뺀다 | 4.1-6 행 합 |
| V8a | `main.ts`가 새 모듈을 값으로 import한다 | 4.1-10 (가)·(나), 5절 |
| V8b | `readers.ts`가 새 모듈을 재수출한다 | 4.1-10 (가)·(나) |
| V9 | `asOfDay > s.day` 검사를 지운다 | 4.1-8 |
| V10 | `fxTranslationKrwMinor`의 부호를 뒤집는다 | 4.1-4 (가)·(나) |
| V11 | BASE 행 `exposureAfterMinor`에 판매대금을 더한다 | 4.1-7 |
| V12 | `retainedMinor`를 수익 + 비용 잔액 합으로 낸다 | 4.1-1 |

## 7. 큰 출력과 디스크

- 모든 회귀 출력, 빌드 폴더, 시험 빌드 폴더는 `/tmp/T75-*` 아래에 둔다.
- sha256과 `cmp` 결과를 적은 즉시 지운다.
- 여유가 2 GB보다 작으면 `/tmp/T75-*`만 지운다. 그래도 모자라면 멈춘다.
- 작업 끝에 `ls -d /tmp/T75-* 2>/dev/null`이 빈 출력이어야 한다.

## 8. 결과 보고

`docs/ai/tasks/results/TASK-0075.md`에 다음을 적는다.

- BASE
- 4.0 grep 결과
- 새 모듈 위치와 지연 청크 경로
- 손 계산 사례(4.1-2~5)의 계산 한 줄
- 4.1-4·4.1-6에서 쓴 시드
- `vi.mock` 감시 한계
- 세션 B 대조 줄: 같은 조건에서 `settlementKrw` 순이익 대 ₩585,035. 대조만 한다.
- 6절 변형 결과
- 9절 각 줄의 명령과 결과
- 첫 화면·`ops-screens` gzip 전·후

## 9. 완료 조건

1. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다.
2. `node src/engine/sim/run.mjs run`(시드 1001~1020)의 표준 출력이 BASE와 `cmp` 동일해야 한다.
3. `npx vitest run` 전체 통과. 기존 시험 수는 그대로이고 늘어난 것은 4.1뿐이다.
4. 5절 예산 이내.
5. `npm run typecheck`, `npm run build` 통과.
6. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py`, `python3 tools/test_validate_data.py` 통과.
7. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`(18종).
8. 7절 디스크 정리 확인.

## 10. 멈춤 조건

- 새 함수에 2절 목록 밖 파일의 변경이 필요할 때.
- 4.0 grep에서 표 밖의 영향이 나올 때.
- 4.1-4 (가)의 환율이 다른 날을 시드 2001~2010에서 찾지 못할 때.
- 4.1-6의 상태를 시드 2001~2010에서 찾지 못할 때.
- 5절 예산을 넘을 때.
- 3.5 항등식이 원 단위로 맞지 않는 경우가 보일 때.

## 개정 1 처리표

| 지적 | 처리 |
|---|---|
| C1·C5·C19 추첨 감시 | 1절 2: 결과 추첨 셋만 금지, `drawAt`·`drawUniform`은 경로 함수 안에서 허용, 새 모듈 직접 호출 금지. `referenceRate` 인수 `≤ s.day` 감시(4.1-8), `vi.mock` 한계 기록 |
| C2·C20 첫 화면 검사 | 4.1-10: `main.ts`에서 시작하는 값 import·`export from` 정적 닫힘, 빌드 청크 문자열. V8a·V8b |
| C3 허용 파일 | 2절 표: 새 엔진 모듈, `src/ui/path11-labels.ts`, `ops-screens.ts` 재수출만, 새 시험, 결과, MANIFEST. 새 `lazyScreen` 없음. 원천 검사 제약은 1절 3 |
| C4·C14 부호 | 3.0 정상 잔액 부호, 3.5 fx 정의(차변 양수 전 줄 합 = 이익 방향), 항등식과 예시 부호 일치. V10 |
| C6 BASE 노출 | 3.1 BASE는 그대로, D15·D30은 더함. 4.1-7, V11 |
| C7·C16 주선 등급 | 3.2 `grade: null`, `termId: 'BASE'`, 따로 행, 정렬 맨 뒤. 4.1-6에서 주선 청구서가 있는 상태를 요구 |
| C8·C13 환산 사례 | 4.1-4 (가) `r(d₁) ≠ r(0)` 단언과 d₁ ≥ 8, 못 찾으면 시드를 바꾸고 2010까지 없으면 멈춤. (나) 손으로 넣은 USD 비용 줄로 V2 판별 |
| C9 retained | 3.4 `summarize(L_d).profit`, 4.1-1에 명시. V12 |
| C10 반환 모양·overdue·원화 합 | 3.2 한 모양, `overdueCount`는 status OVERDUE, 3.0 (ㄷ)로 두 함수의 원화 미수가 같음. 4.1-6 단언 |
| C11·C12 V1 | 4.1-1 (나)를 `closed_d`의 `summarize`와 비교하고 당일 분개 존재를 단언. (가)의 한계 명시 |
| C15 정책 | 4.1-6 `TERM_GREEDY`, ‘D30 또는 D15’ 하나 이상, 원인 설명을 지운 멈춤 조건 |
| C17 반올림 단위 | 3.0 (ㄱ)·(ㄴ)·(ㄷ), 4.1-5를 `settlementKrw` 비용 줄로 지정 |
| C18 반올림 판별 | 4.1-3 `2 × 나머지 ≥ 분모`와 정확히 절반 |
| 허브 요청: grep 영향 범위 | 4.0 |
