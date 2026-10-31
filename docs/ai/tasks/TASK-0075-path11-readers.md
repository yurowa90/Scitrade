# TASK-0075 경로 11 읽기 함수(②-b): 묶이는 돈, 외상 잔액, 가용 대비, 중간 재무상태, 원화 환산 결산

- **지위: 초안(세션 A, 2026-10-31).** 허브 검토 전이다. Codex에 넘기지 않는다. TASK-0074 병합 뒤에 실행한다.
- 근거
  - `docs/DECISIONS.md` 2026-10-31 결정 2·3·4·7
  - 허브 결정 H34-1·H34-3·H34-4
  - 범위 문서 `docs/ai/design/path11-engine-seam-2026-10/SCOPE.md` 1.1~1.4·1.7·1.8, 3.1
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: TASK-0074가 병합된 개발 브랜치에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **성격: 읽기만 한다.** 상태, 저장, 결정, sim 출력은 바뀌지 않는다. 엔진 핵심 파일도 바꾸지 않는다(4절).
- 범위 밖
  - 화면(Sol 지시서)
  - 대손 기대(결정 7)
  - 회계 분류 확정(결정 4는 교사 검토 대기다)
  - 측정
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 기본 `node src/engine/sim/run.mjs run` 400회 회귀 하나다. 이 회귀는 고정 시드 1001~1020을 그대로 쓴다.

## 0. 먼저 읽을 것

줄 번호는 초안 시점(`24038f7`, TASK-0074 전)의 값이다. 다르면 이름으로 찾는다.

- `src/engine/readers.ts`: `quotePreview`(:33), `creditTermOptions`(:262)
- `src/engine/reports.ts:410` `receivableSchedule`
- `src/engine/reservations.ts:62` `fundsPosition`
- `src/engine/ledger.ts`
  - `ACCOUNT_KIND`(:35-61): 자산 5, 부채 1, 자본 2(`OPENING_EQUITY`·`CURRENCY_TRANSFER`), 수익·비용
  - 부호(:63): 양수 차변
  - 분개는 한 통화이고 차대 합 0(:99-111)이다. `summarize`(:170)
- `src/engine/risk.ts`
  - `usdToKrwMinor`(:17, `divHalfAway(cents × rate, 100)`)
  - `referenceRate(config, seed, day)`(:19). 운영 없으면 예외, 위험 층 없으면 `baseKrwPerUsd`.
  - 등급 찾기 `:147`, `:162`
- `config.operations.market.publish`(`types.ts:560`: `firstDay`·`intervalDays`·`lastDay`·`validDays`)
- 지연 청크: `src/ui/ops-screens.ts`(규칙 2 진입 전에 받는 화면 묶음). TASK-0073 결과 보고의 청크 구성.
- 임시 문구: `docs/DECISIONS.md` 2026-10-31 4번. 근거 메모는 `docs/ai/design/research/ACCOUNTING-CLASSIFICATION-MEMO.md`.

## 1. 지켜야 할 것

1. **상태를 바꾸지 않는다.** 모든 새 함수는 얼린(deep-frozen) 상태 사본으로 불러도 예외가 없어야 한다.
2. **미래 누설 금지**
   - 추첨 함수(`claimFor`·`collectionPlan`·`defaultFor`·`drawAt`·`drawUniform`)를 직접이든 간접이든 부르지 않는다.
   - `referenceRate`는 `day ≤ s.day`에만 부른다. 환율 경로는 시드로 정해져 있어서, 앞날 환율을 부르면 미래가 샌다.
   - `asOfDay > s.day`이면 예외를 낸다.
3. **엔진 핵심 파일(`engine.ts`·`reports.ts`·`reservations.ts`·`invariants.ts`·`save*.ts`)과 첫 화면 화면 파일은 바꾸지 않는다.**
   - 새 함수는 새 모듈 하나(이름 예: `src/engine/path11-readers.ts`)에 둔다.
   - 그 모듈은 지연 청크(`ops-screens`가 다시 내보내거나, 같은 약속으로 받는 모듈)로만 불러온다.
4. **기대값은 손 계산 사례**(H34-4). 세션 B 하네스 값(₩585,035 등)은 결과 보고의 대조 줄에만 적는다. 시험 리터럴로 쓰지 않는다.
5. 기존 시험은 고치지 않는다.

## 2. 함수(출력 모양은 이것을 따른다)

통화 배열의 순서는 통화 코드 사전순(`KRW`, `USD`)이다. `Currency` 형의 선언 순서(`USD`, `KRW`, …)가 아니다. 원화 환산은 USD 줄마다 `usdToKrwMinor`로 바꾼 뒤 더한다. 즉 줄마다 반올림한다. KRW 줄은 그대로 쓴다.

### 2.1 `creditLockPreview(s, config, buyOfferId, sellOfferId, quantity?)`(SCOPE 1.2)

- rules-4가 아니면 `[]`.
- 외상 조건(`creditTermOptions`의 행)마다 다음을 낸다.

  ```
  { termId, allowed, reasonKo,
    cashOut: { currency, amountMinor }[],
    cashOutKrwMinor,
    paymentDueDay, lockDays,
    publishesInWindow,
    exposureAfterMinor, limitMinor }
  ```

  - `cashOut`: 지금 인수하면 나가는 통화별 현금. `quotePreview`의 같은 값을 쓴다.
  - `cashOutKrwMinor`: 오늘 `referenceRate`로 바꾼 합(결정 2).
  - `lockDays`: `paymentDueDay − s.day`
  - `publishesInWindow`: `(s.day, paymentDueDay]` 사이의 공개일 수다. 공개일은 `firstDay + k·intervalDays ≤ lastDay`다.
  - `exposureAfterMinor`: 이 계약을 더한 뒤의 거래처 노출액. `creditTermOptions`의 `exposureMinor`에 판매대금을 더한 값이다.

### 2.2 `receivablesByTerm(s, config)`(SCOPE 1.3)

- rules-4가 아니면 `[]`.
- 열린 청구서(`receivableSchedule` 행)를 `(termId, grade, currency)`로 묶는다.
  - 행 하나: `{ termId, grade, currency, outstandingMinor, count, overdueCount }`
  - `termId`는 계약의 `creditTermId ?? 'BASE'`다. `grade`는 거래처 등급이다.
  - 순서: `termId`(BASE, D15, D30 순) → `grade` 사전순 → 통화
- 따로 원화 합계 한 줄 `{ totalKrwMinor }`를 낸다. 오늘 환율이다. 모양은 `{ rows, totalKrwMinor }`다.

### 2.3 `cashLockSummary(s, config)`(SCOPE 1.4)

- 운영이 없으면 `null`.
- 출력

  ```
  { available: { currency, amountMinor }[],
    receivable: { currency, amountMinor }[],
    availableKrwMinor, receivableKrwMinor,
    lockedShareBp }
  ```

  - `available`은 `fundsPosition(…).available`이다. `receivable`은 열린 청구서 잔액 합이다.
  - `lockedShareBp = divHalfAway(receivableKrw × 10000, availableKrw + receivableKrw)`. 분모가 0 이하면 `null`이다.

### 2.4 `balanceSheetAt(s, config, asOfDay)`(SCOPE 1.7, 결정 3)

- `asOfDay > s.day`면 예외.
- 통화마다 분개 가운데 `day ≤ asOfDay`인 것만 더해 계정 잔액을 낸다. 그날 분개까지 포함한 마감 기준이다.
- 출력

  ```
  { asOfDay,
    byCurrency: { currency,
      assets: { account, amountMinor }[],
      liabilities: [...],
      equity: [...],
      retainedMinor }[] }
  ```

  - 계정은 `ACCOUNT_KIND`의 자산·부채·자본 순서다. 잔액이 0인 계정도 넣는다. 그래야 화면 줄이 고정된다.
  - `retainedMinor`는 수익·비용 계정 잔액 합이다(부호는 `summarize`와 같다).
- 상태 복원(재고 수량, 청구서 상태)은 하지 않는다. 금액은 원장만으로 정해진다.

### 2.5 `settlementKrw(s, config, asOfDay)`(SCOPE 1.8, 결정 2)

- 운영이 없으면 `null`. `asOfDay > s.day`면 예외.
- 환산 규칙(결정 2)
  - 수익·비용 계정 줄은 **분개일**의 `referenceRate`로 환산한다.
  - 자본 계정 줄(`OPENING_EQUITY`·`CURRENCY_TRANSFER`)도 분개일 환율로 환산한다.
  - 자산·부채 잔액은 **`asOfDay`** 환율로 환산한다.
- 출력

  ```
  { asOfDay, rateAsOf,
    income: { account, krwMinor }[],
    equity: { account, krwMinor }[],
    assets: { account, krwMinor }[],
    liabilities: { account, krwMinor }[],
    fxTranslationKrwMinor }
  ```

- **`fxTranslationKrwMinor`(‘환율 변동 손익’ 한 줄)의 정의**
  - 원래 통화 장부에서는 모든 분개의 합이 0이다. 원화로 환산하면 자산·부채(마감 환율)와 수익·비용·자본(분개일 환율)의 환산 합이 0이 되지 않는다. 그 나머지가 이 줄이다.
  - 식: `fxTranslationKrwMinor = −(Σ 자산·부채 KRW + Σ 수익·비용·자본 KRW)`
    - 부호는 원장 규칙(차변 양수)을 따른다.
    - 그래서 ‘자산 − 부채 = 자본 + 이익 + 환율 변동 손익’이 원 단위로 항등이다.
  - 이 항등은 정의상 늘 맞는다. 그래서 시험은 항등이 아니라 손 계산 사례(3절 4)로 값을 고정한다.
- **화면 줄 이름은 엔진 밖이다.** 엔진은 `account` 키만 낸다.
  - 줄 이름 표는 새 모듈 옆 지연 청크에 둔다(예: `SETTLEMENT_LINE_KO`).
  - 결정 4의 임시 문구를 쓴다.
    - `FX_SPREAD_EXPENSE`와 환전 차액: ‘환전 손익은 영업이익 밖(K-IFRS 1001 한138.2), 국내 기준 이름은 영업외손익’
    - 관세 주석: ‘관세는 매입원가에 넣음(K-IFRS 1002.11)’
    - `fxTranslationKrwMinor`: ‘환율 변동 손익’
  - 교사 검토 뒤에는 이 표만 바꾸면 되게 한다.

## 3. 새 시험(2001 이상 시드)

1. **두 길 대조(베끼지 않는 기대값)**
   - (가) `balanceSheetAt(s, cfg, s.day)`의 통화별 잔액이 기존 `summarize(s.ledger, currency)`의 같은 칸과 같아야 한다.
   - (나) 새 시나리오(TASK-0074) 시드 2001을 끝까지 돌리며 날마다 상태를 둔다. 날 d를 마친 상태의 `balanceSheetAt(·, d)`가, 끝 상태에서 계산한 `balanceSheetAt(끝, cfg, d)`와 같아야 한다. 날 d는 1, 30, 60과 끝이다.
   - 두 길은 서로 독립인 계산이다. (가)는 기존 함수와 대조하고, (나)는 과거로 거슬러 계산한 값과 그날 실제로 쌓인 값을 대조한다.
2. **손 계산: 묶이는 기간과 공개 횟수**
   - 공개 일정 `firstDay`·`intervalDays`·`lastDay`는 자료 값에서 읽는다.
   - 특정 날짜와 `paymentDueDay` 하나에 대해 `publishesInWindow`를 손으로 센다. 리터럴과 계산 한 줄을 주석에 적는다.
   - 경계 두 개를 넣는다. 공개일이 바로 `paymentDueDay`인 경우(포함)와 `s.day`인 경우(제외)다.
3. **손 계산: 잠김 비율**
   - 가용·미수가 정해진 작은 사본에서 `lockedShareBp`를 손 계산한다. 나머지가 생기는 값으로 고르고 half-away 반올림을 확인한다.
   - 분모 0 사본은 `null`이어야 한다.
4. **손 계산: 환율 변동 손익**
   - 새 시나리오 시드 2001의 시작 상태를 명령 없이 날 d₁까지 진행한 사본을 쓴다.
   - 그 기간에 USD 분개가 시작 자금 분개(분개일 d₀, USD 현금 X센트) 하나뿐임을 먼저 단언한다. 아니면 d₁을 줄인다.
   - 기대 `fxTranslationKrwMinor = usdToKrwMinor(X, r(d₁)) − usdToKrwMinor(X, r(d₀))`다. `r`은 `referenceRate`다. 환율은 입력이므로 엔진 출력에서 베끼는 것이 아니다. KRW 분개(고정비 등)는 환산이 없어 이 값에 들어가지 않는다.
   - 시작 자금 X가 센트 반올림 나머지를 만들지 못하면, X를 바꾼 설정 사본을 쓴다. 계산 과정은 주석에 적는다.
   - FX 층이 꺼진 사본(환율 고정)에서는 0이어야 한다.
5. **원화 줄 반올림**: USD 줄 두 개 이상을 가진 사본에서 ‘줄마다 환산 후 합’이 ‘합 후 환산’과 다른 경우를 하나 넣는다. 함수가 앞의 것을 내는지 확인한다.
6. **외상 묶음**
   - `receivablesByTerm`의 행 합(통화별)이 `receivableSchedule` 합과 같아야 한다.
   - D15·D30 계약이 하나 이상 있는 상태(시드 2001~2010 가운데 찾음, 없으면 멈춤)에서 `termId` 묶음이 맞는지 본다.
7. **미래 누설·순수성**
   - 새 함수 다섯을 얼린 상태로 부른다.
   - 추첨 함수를 `vi.mock`으로 감시해 호출이 0인지 본다(기존 ‘미래 누설 없음’ 시험의 방식).
   - `referenceRate`를 감시해 `day ≤ s.day`만 받는지 본다.
   - `asOfDay = s.day + 1`이면 예외가 나야 한다.
8. **rules 경계**
   - rules-1 시나리오: `cashLockSummary`·`settlementKrw`는 `null`, 나머지는 `[]`(또는 정의대로)여야 한다.
   - rules-2: `creditLockPreview`·`receivablesByTerm`은 `[]`, 나머지 셋은 값을 낸다.
9. **원천 검사**(SCOPE 3.1)
   - 첫 화면 파일(`src/ui/main.ts`·`recruitment.ts`·`reports.ts`·`schedule.ts`·`map.ts`·`card.ts`·`growth.ts`·`session.ts`와 엔진 핵심 파일)은 새 모듈을 **값으로** import하지 않는다.
   - 메모리 사본에 값 import 한 줄을 더한 음성 대조로 검사가 거부하는지 본다.
   - 토큰화는 TASK-0072 원천 검사 후속(STATUS: 중첩 템플릿 스캐너)과 같은 한계를 피하도록 import 문만 다룬다.

## 4. 첫 화면 예산(H34-3)

- 화면·읽기 몫은 첫 화면 gzip 증가 **≤ 300 B**다. 엔진 핵심 변경은 이 작업에 없으므로 그 몫은 0이어야 한다.
- 측정
  - BASE와 작업 뒤를 각각 `git archive`로 깨끗한 트리(`/tmp/T75-build-before`·`-after`)에 풀어 빌드한다.
  - `node tools/check_bundle_size.mjs dist`로 첫 화면 gzip 전·후, `ops-screens` 지연 청크 전·후를 적는다.
- 첫 화면 증가가 300 B보다 크면 멈추고 보고한다.

## 5. 변형 시험

변형마다 어느 시험이 왜 실패하는지 한 줄씩 적는다. 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | `balanceSheetAt`이 `day < asOfDay`로 거른다(당일 제외) | 3-1 (가)·(나) |
| V2 | 수익·비용을 `asOfDay` 환율로 환산한다 | 3-4 |
| V3 | 원화 합을 ‘합 후 환산’으로 한다 | 3-5 |
| V4 | `publishesInWindow`가 `s.day`를 포함한다 | 3-2 경계 |
| V5 | `lockedShareBp`가 버림을 쓴다 | 3-3 |
| V6 | `creditLockPreview`가 원화 합에 `paymentDueDay` 환율을 쓴다(미래 누설) | 3-7 |
| V7 | `receivablesByTerm`이 `creditTermId` 없는 계약을 뺀다 | 3-6 |
| V8 | `main.ts`가 새 모듈을 값으로 import한다 | 3-9, 4절 |
| V9 | `asOfDay > s.day` 검사를 지운다 | 3-7 |

## 6. 큰 출력과 디스크

- 모든 회귀 출력과 빌드 폴더는 `/tmp/T75-*` 아래에 둔다.
- sha256과 `cmp` 결과를 적은 즉시 지운다.
- 여유가 2 GB보다 작으면 `/tmp/T75-*`만 지운다. 그래도 모자라면 멈춘다.
- 작업 끝에 `ls -d /tmp/T75-* 2>/dev/null`이 빈 출력이어야 한다.

## 7. 결과 보고

`docs/ai/tasks/results/TASK-0075.md`에 다음을 적는다.

- BASE
- 새 모듈 위치와 지연 청크 경로
- 손 계산 사례 넷의 계산 한 줄
- 세션 B 대조 줄: 같은 조건에서 `settlementKrw` 순이익 대 ₩585,035. 대조만 하고 판정에 쓰지 않는다.
- 5절 변형 결과
- 8절 각 줄의 명령과 결과
- 첫 화면·`ops-screens` gzip 전·후

## 8. 완료 조건

1. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다.
2. `node src/engine/sim/run.mjs run`(시드 1001~1020) 표준 출력이 BASE와 `cmp` 동일해야 한다.
3. `npx vitest run` 전체 통과. 기존 시험 수는 그대로이고 늘어난 것은 3절뿐이다.
4. 4절 예산 이내.
5. `npm run typecheck`, `npm run build` 통과.
6. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
7. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`.
8. 6절 디스크 정리 확인.

## 9. 멈춤 조건

- 새 함수에 엔진 핵심 파일 변경이 필요할 때.
- 3-6의 D15·D30 사례를 시드 2001~2010에서 찾지 못할 때. 그러면 sim 정책이 외상을 고르지 않는다는 뜻이다. 사례를 만드는 방법(명령 사본)을 허브가 정한다.
- 4절 예산을 넘을 때.
- 결정 2의 환산 규칙으로 항등이 원 단위로 맞지 않는 경우가 보일 때. 예: 한 분개 안에 두 통화가 섞인 경우.

## 허브에 묻는 것

- **Q1. 원화 환산 반올림을 줄마다 할지(초안) 계정 합에서 할지.**
  - 줄마다 하면 화면 합계가 원장 줄의 합과 원 단위로 맞는다.
  - 합에서 하면 줄 수에 따라 나머지가 달라지지 않는다. 대신 화면의 줄 합과 합계가 어긋날 수 있다.
  - 권고는 줄마다다. 기존 `usdToKrwMinor` 쓰임과 같다.
- **Q2. `CURRENCY_TRANSFER`(환전 대체)를 자본 줄로 둘지.** 원장 분류가 자본이라 초안은 분개일 환율로 환산한다. 화면에서는 ‘환전 손익’ 줄과 함께 영업외로 묶을지를 교사 검토(결정 4)와 같이 정한다.
