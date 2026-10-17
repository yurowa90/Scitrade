# TASK-0064 직접 무역 위험 ③: 화물 손상 클레임과 지연·부분 수금 (승인, 개정 3f)

- **지위: 승인(허브, 2026-10-17, 개정 3f). 이 지시서를 담은 개발 브랜치 커밋이 BASE다.**
  - 세션 A 초안(2026-10-14, 개정 1·2·3·3c 2026-10-16) 위에 허브 시제품 사전 확인(골든 무해·시험 실현성·모호성 세 관점, 중대 결함마다 반박 검증)과 세션 A 사전 점검 D1~D6의 고침, 그 뒤 독립 재확인(처리표 끝 ‘재확인 반영’)의 고침을 넣었다. 바탕은 허브 결정 H17이다.
  - 개정 3e: 개정 3d 커밋(`5bee326`)을 독립 재확인(원본과 `.git`을 나눈 복제본 6개, 다섯 관점 38건 → 같은 뿌리 23건, 발견마다 텍스트·코드 두 렌즈 반박 검증)하고 세션 A 설계자 검토(승인 가능, 문구 m1·메모 2건)를 받아 반영했다. 중대 2건(공유 무역 구동기 실행의 시드 범위, ⑤a 전제 식)과 경미·문구를 고쳤다. 처리표는 끝의 ‘허브 사전 확인 처리표(개정 3d)’·‘허브 재확인 처리표(개정 3e)’·맨 끝 ‘허브 좁힌 검증 처리표(개정 3f)’다.
  - 개정 3f: 개정 3e(`e73aa5d`)의 고친 문장만 세 렌즈(실현성·정합·산술)로 좁혀 검증하고 major는 반박 검증을 거쳤다. 중대 1건(‘지연’·‘부분’의 로그 숫자 검사가 1일 체결 로그 ‘(납기 8일)’에 걸려 맞는 구현도 실패)과 경미 7건을 고쳤다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0063(+R1·R2) 반영 커밋 `c4a94a8`(병합 `6fee946`, 기록 `c4a94a8`).
- **`BASE`는 작업 트리를 만든 커밋(이 지시서의 승인본을 담은 개발 브랜치 커밋)이다.** 작업 시작 때 `git rev-parse HEAD`를 결과 보고에 적고 그 값을 BASE로 쓴다. 기준 비교(`review_checks.sh --check`)와 골든 경로 확인은 이 BASE로 한다.
- **먼저 읽는다.** TASK-0063 지시서(`TASK-0063-risk-tariff-surcharge.md`, 승인 개정 3f)와 TASK-0063-R1·R2 지시서, 그 결과 보고(`results/TASK-0063.md`). 설계 `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 3.4·5·6·8·9절(개정 3j). 허브 결정 H17(`HUB-DECISIONS-2026-10-16.md`. **H17과 설계 개정 3j는 이 개정 3d 커밋에서 함께 기록했다.** 승인 커밋에서 다시 고치면 그 커밋의 것을 쓴다): 추첨 식과 키, `claimFor`·`collectionPlan`의 꼴, 부르는 자리, 수금 처리·상태·로그 문장, 6·8단계, 읽기 함수, 범위·자료.
- **TASK-0062 지시서(개정 3e)·TASK-0062-R1·TASK-0063(개정 3f)·R1·R2의 원칙과 시험 방식을 그대로 따른다.** 특히 다음이다.
  - 4절 항등식(`residual`은 남은 차이로 계산)과 ‘환산 꼴’(설계 3.4, H15 O3)
  - 7단계 취소 규칙(`CASH` 줄만, 재예약 전 운임)
  - 도착 판정은 `shipment.dutyMinor !== null`(H16-5, R1-1), `tariffSchedule`의 `seq`(R2-1). BASE에 이미 들어 있는 코드이고 이 지시서는 그 위에서 한다.
  - 시험 머리의 통과형 `vi.mock`·`mockClear`, 시드 출처(`s.rng.seed`)
- 설계: DESIGN.md 3.4·5·6·8·9절(개정 3j. 개정 3d 커밋에서 H17과 함께 올렸다). TASK-0062의 원칙(새 규칙 판본에서만, 상태 칸 없음, 두 통화 합산 없음, 화면 없음)은 그대로다. 이 지시서와 설계가 다르면 이 지시서가 우선이다.
- 코드 자리는 줄 번호가 아니라 함수 이름으로 가리킨다(세션 A D3). BASE가 0063+R1·R2 병합 뒤라 줄 번호가 밀린다. 예: `engine.ts`의 `processDeliveries`·`processCollections`·`applyReceipt`, `reports.ts` `campaignSummary`의 `openInvoices`, `operations.ts` `paymentDefaultStatus`의 `nextReceipt`, `invariants.ts`의 매출채권 대 미수 청구서 합 검사. Codex는 기호로 찾는다.
- 목적: 인도 뒤에도 손실과 자금 압박이 생길 수 있게 한다. 대금이 늦게 들어오면 환율 노출이 길어지고 원화 급여 압박이 커진다.
- 교육과정 연결의 범위: 특성화고 [수입 07-03-03](결제 방식별 위험)의 **일부만** 준비한다. 사후송금 한 가지 조건에서 지연·부분 수금이 환율 노출과 자금 압박을 키우는 것이다. 결제 방식 선택·비교(송금 → 추심 → 신용장)는 경로 7이고, 경로 3만으로는 이 성취기준을 충족하지 않는다.

## 구현 지시

### 0. 추첨 식(허브 결정 H17, 고정)

측정값을 바꾸는 선택을 Codex에 남기지 않도록 허브가 정했다(H16-1과 같은 꼴). 아래 식과 다르게 만들지 않는다.

- **`u`·`U`(H17-1).** `u(흐름) = drawAt(seed, 흐름, 0)`(흐름마다 한 번, 커서 0). 정수 균등 `U[a, b] = a + ⌊u × (b − a + 1)⌋`. TASK-0063의 식과 같다.
  - 엔진은 `seed = s.rng.seed`로 부른다(`dutyFor`·`surchargeBp` 호출처와 같다).
  - `s.rng.cursors`는 읽거나 바꾸지 않는다. 상태 커서를 쓰는 `drawUniform(s.rng, …)` 꼴을 쓰지 않는다. 그래서 `state.rng.cursors`에 `CLAIM:`·`COLLECT:` 키가 생기지 않는다.
- **흐름 키.** {o}는 `contract.sellOfferId` 문자열 그대로다. 흐름은 다섯 개뿐이다: `CLAIM:{o}:hit`, `CLAIM:{o}:tier`, `CLAIM:{o}:rate`, `COLLECT:{o}:mode`, `COLLECT:{o}:days`. 커서는 모두 0이다. 부분 수금 비율은 추첨하지 않는다(`partialBp` 고정, 설계 5.2 n47).
- **이름.** 엔진 타입(`types.ts` `RiskProfile`)은 camelCase다: `claims.byGood[].pClaimBp`, `claims.minor.weightBp`·`minBp`·`maxBp`, `claims.major.…`, `collections.byCounterparty[].grade`, `collections.grades[].pOnTimeBp`·`pLateBp`·`pPartialBp`, `collections.partialBp`·`lateMinDays`·`lateMaxDays`. 자료(`by_good`, `p_claim_bp`, …)와 1:1이고 로더가 이미 변환한다. 아래는 엔진 이름으로 적는다.
- **`claimFor(config, seed, sellOfferId, goodId)` → `null | { tier: 'MINOR' | 'MAJOR', rateBp }`(H17-2).** 다음 순서로 정한다.
  - 위험 설정에 `CLAIM` 층이 없으면 `null`이다. 표를 읽지 않는다.
  - 층이 있으면 `claims.byGood`에서 `goodId` 행을 **먼저** 찾는다. 없으면 예외다(추첨 전).
  - 손상 = `U[0, 9999] < pClaimBp`(`CLAIM:{o}:hit`). 손상이 아니면 `null`이고 `…:tier`·`…:rate`는 뽑지 않는다(순수 함수라 뽑아도 결과는 같지만, 흐름 유일성 시험의 기대 꼴을 하나로 두기 위해 뽑지 않는다).
  - 층 = `U[0, 9999] < minor.weightBp`이면 `MINOR`, 아니면 `MAJOR`(`…:tier`). 작은 층이 앞 구간이다. 그래서 판정표 5.2 ‘큰 손상 가중치’를 내리면 `MAJOR`에서 `MINOR`로 옮겨 가는 계약만 생기고 손상 집합(`…:hit`)은 그대로다.
  - `rateBp = U[층.minBp, 층.maxBp]`(`…:rate`). 두 층이 같은 흐름을 쓴다.
  - 클레임 금액 = `applyBasisPoints(늦은 감액 뒤 판매액, rateBp)`(`money.ts`, half-up). 0이면 분개·로그를 내지 않는다(`post`는 0원 줄에서 예외를 낸다).
- **`collectionPlan(config, seed, sellOfferId, counterpartyId)` → `{ mode: 'ON_TIME' | 'LATE' | 'PARTIAL', days }`(H17-3).** `counterpartyId`는 `contract.customerId`다. 다음 순서로 정한다.
  - 위험 설정에 `COLLECTION` 층이 없으면 `{ mode: 'ON_TIME', days: 0 }`이다. 표를 읽지 않는다.
  - 층이 있으면 `collections.byCounterparty`에서 거래처 행을 **먼저** 찾고(없으면 예외), 그 등급의 `grades` 행을 쓴다(없으면 예외).
  - `v = U[0, 9999]`(`COLLECT:{o}:mode`). 구간 순서는 **정시 → 지연 → 부분**이다: `v < pOnTimeBp`이면 `ON_TIME`, `v < pOnTimeBp + pLateBp`이면 `LATE`, 그 밖은 `PARTIAL`. 검사기가 세 확률의 합 = 10000을 이미 본다. 정시와 지연 구간이 맞닿아 있으므로, 판정표 5.2의 지연 손잡이(늘린 만큼 `p_on_time_bp`에서 뺀다)를 돌리면 `ON_TIME`에서 `LATE`로 옮겨 가는 청구서만 생기고 `PARTIAL` 집합은 그대로다.
  - `days = U[lateMinDays, lateMaxDays]`(`…:days`). `ON_TIME`이면 `days = 0`이고 `…:days`는 뽑지 않는다. 지연의 전액과 부분의 나머지가 같은 `days`를 쓴다.
  - 부분: 첫 수금 = `applyBasisPoints(청구액, partialBp)`를 청구 결제일에, 나머지 = 청구액 − 첫 수금을 청구 결제일 + `days`에 받는다. 뺄셈이라 두 수금의 합이 늘 청구액이다. 청구액은 클레임을 뺀 `invoice.amountMinor`다.
- 두 함수는 `risk.ts`에 둔다(H15 O4·O13). 서명과 반환 꼴을 바꾸지 않는다. 호출 자리는 1·2절이 정한다.

### 1. 화물 손상 클레임

- 위험 설정에 `CLAIM` 층이 있으면, 직접 무역 화물이 인도될 때(`engine.ts` `processDeliveries`) 0절의 `claimFor`로 손상 여부·층·손상률을 정한다. 추첨 키는 `sellOfferId` 그대로다.
  - **추첨 키는 계약 순번이 아니라 판매 견적 ID(`contract.sellOfferId`)다**(검토 43번). 같은 견적은 정책이 달라도 같은 추첨을 받는다(공통 난수). 주선을 하나 더 받아 순번을 밀어 손상을 피하는 공략도 막는다.
  - 손상 확률은 품목의 파손 위험 등급에 따라 프로필 `claims.byGood`에서 읽는다. **프로필에 없는 품목이 나오면 예외**를 낸다(허브 결정 H14-10). 조용히 대체하지 않는다.
  - 층: 작은 손상(`minor.weightBp`, `[minor.minBp, minor.maxBp]`) 또는 큰 손상(`major.weightBp`, `[major.minBp, major.maxBp]`). 손상률은 그 층 범위의 정수 균등(0절 식).
- **부르는 자리와 순서(H17-4).**
  - `claimFor(` 호출은 `engine.ts` `processDeliveries` 안, `contract.kind === 'DIRECT_TRADE'` 가드 **뒤**에서만 한다(가드는 아래 ‘주선 화물은 제외한다’). 인수는 `config`, `s.rng.seed`, 그 계약의 `sellOfferId`, `goodId`다.
  - 순서: `SALE-{계약}` 분개(늦은 감액 뒤 `netSale`) → `CLAIM-{계약}` 분개 → 청구서 생성. 청구서 `amountMinor = netSale − 클레임`. 손상률 상한이 3000bp라 `netSale > 0`이면 청구액 > 0이다.
  - `netSale`이 0이면(전액 감액) 지금 코드대로 청구서 없이 종결하고 클레임 추첨도 하지 않는다. 청구서가 없으므로 클레임도 없다.
  - 읽기 함수·미리보기·`processCollections`에서는 부르지 않는다. `contractRiskReport`는 인도한 계약의 `CLAIM-` 분개만 읽고 `claimFor`를 미리 부르지 않는다(5절).
- 손상이면: 늦은 감액 뒤 판매액 × 손상률(USD 센트, half-up, 0절 식)을 매출 에누리로 낸다.
  - 새 계정 `SALES_ALLOWANCE`. `ACCOUNT_KIND`는 `income`(매출 차감 계정, 차변 잔액)이다. 분개 `CLAIM-{계약}`: `SALES_ALLOWANCE` 차변 / `ACCOUNTS_RECEIVABLE` 대변, 계약 통화, 인도일, `contractId`를 붙인다. 청구 금액이 그만큼 준다. 그래서 매출채권 잔액 = 청구액이 그대로 성립한다. 저장 열거는 4절 ‘저장 왕복’이다.
  - **`contractReport`의 순매출(`netRevenue`)에 `SALES_ALLOWANCE`를 더한다**(H14-10, 검토 n26). `contractAmount`는 `income` 계정을 대변 양수로 돌려주므로 차변 잔액인 `SALES_ALLOWANCE`는 음수로 나온다. ‘더한다’가 부호까지 맞다(세션 A D6). 그래서 클레임 계약의 `contribution` = (늦은 감액 뒤 판매액) − 클레임 − 매출원가 USD 몫이고, rules-3의 계약 기여에서 클레임이 빠지지 않는다. rules-2에는 이 분개가 없어 바이트가 같다.
  - **`ledger.ts` `summarize`의 profit 식에 `SALES_ALLOWANCE` 잔액을 더한다.** `balance`도 `income` 계정을 대변 양수로 돌려주므로 이 잔액은 음수다. rules-2에는 분개가 없으므로 값이 같다(H15 O2. 빠뜨리면 마감의 순자산 항등식이 깨진다).
  - **`BookSummary`와 `campaignSummary`(`byCurrency` 행·`openInvoices` 행 포함)에는 새 칸을 두지 않는다.** rules-2 탐침 해시(`check_rules2_golden.mjs`)가 `campaignSummary`를 해시해 행 키를 지키고, 기존 시험 `m2a5-save.test.ts`는 최상위 키만 단언한다.
  - `priceReductionMinor`(늦은 감액)에는 더하지 않는다. 늦은 인도 감액과 클레임은 따로 기록한다.
  - 로그 한 줄(고정): ‘{계약} 화물 일부 손상: 고객이 대금 {금액} 감액 청구’. 인도 로그 바로 뒤에 쓴다. 인도 로그(‘…{매출}는 채권으로 남고 현금은 {청구 결제일}일 수금 예정’)는 문장·금액(늦은 감액 뒤 판매액)·날(`invoice.dueDay`) 모두 지금 그대로다. 클레임 금액을 그 문장에 넣지 않는다.
- **주선 화물은 제외한다.** `claimFor`·`collectionPlan`은 `contract.kind === 'DIRECT_TRADE'`인 계약에만 부르고, 종류 가드는 두 호출 모두 부르기 **전에** 둔다. 주선의 품목·화주는 프로필에 없을 수 있어서, 부르면 예외가 난다.
- **공개 위험 등급 읽기 함수(H17-7).** rules-3 위험 설정(`config.operations.risk`)이 있는 설정의 `quotePreview`(`readers.ts`)에만 저장하지 않는 칸 `riskGrades`를 둔다. 층과 무관하다(공개 정보라 R1·R2에도 낸다).
  - 직접 무역 견적은 `{ damage: 매입 견적 품목의 claims.byGood 행 grade, credit: 판매 견적 counterpartyId의 collections.byCounterparty 행 grade }`, 주선 견적은 `null`이다. 위험 설정이 없는 rules-2 결과에는 키가 없다(`m2a5-readers.test.ts`의 `quotePreview` `toEqual` 골든이 그대로여야 한다).
  - 프로필 누락 예외는 직접 무역의 품목·판매 거래처로 한정한다(H15 O13). 확률 숫자가 아니라 등급만 낸다.
  - `riskGrades`는 프로필 표를 직접 읽는다. `claimFor`·`collectionPlan`을 부르지 않는다. 매입·판매 견적 정의를 찾지 못해 `quote` 기본값 경로(거절 문장, 수치 0)로 가는 직접 무역 결과는 `riskGrades: null`이다(예외를 내지 않는다. 지금 주석 ‘계산할 수 없는 수치는 0·일정은 null’과 같은 규칙. 시험은 더하지 않는다). 프로필 누락 예외는 두 견적을 찾았는데 표에 품목·거래처 행이 없을 때만이다. `preview`·`tradePreview`에는 넣지 않는다. 화면은 경로 11이다.

### 2. 지연·부분 수금

- 위험 설정에 `COLLECTION` 층이 있으면, `processCollections(s, config)`가 청구 결제일이 된 날부터(`inv.dueDay ≤ s.day`, `PAID` 제외) 직접 무역 청구서마다 0절의 `collectionPlan`을 불러 그날 받을 금액을 정한다(H17-4).
  - **서명을 `processCollections(s, config)`로 바꾼다**(세션 A D5). 호출처는 `commitDay`의 ‘수금 → 밀린 지급 → 급여’ 자리 하나이고 순서는 그대로다. 인수는 `config`, `s.rng.seed`, 그 계약의 `sellOfferId`, `customerId`다.
  - 계획은 저장하지 않으므로(설계 2절 3) 결제일이 된 미수 청구서마다 그날 **다시** 부른다. 순수 함수라 같은 결과가 나온다.
  - 추첨 키는 `sellOfferId` 그대로다. 흐름 `COLLECT:{판매 견적}:mode`, `…:days`. 확률은 판매 거래처의 신용등급(`collections.byCounterparty` → `grades`)에서 읽는다. **프로필에 없는 거래처가 나오면 예외**를 낸다(H14-10).
  - **`collectionPlan(` 호출은 `engine.ts` `processCollections` 안에만 둔다.** 청구서를 낼 때(`processDeliveries`)는 부르지 않는다(계획이 그날 로그나 상태에 드러나면 미래 누설이다). 읽기 함수·미리보기·`contractRiskReport`에서도 부르지 않는다.
  - **주선 청구서는 제외**한다(지금처럼 정시 전액). 종류 가드는 1절과 같이 부르기 전에 둔다(주선 화주 `SHIPPER_*`는 프로필에 없다).
  - rules-2 경로(층 없음)와 주선 청구서는 지금의 `applyReceipt` 경로를 그대로 지난다(같은 순서·같은 로그). 골든 `stateHash`에 로그가 들어간다.
- 용어: ‘약정 결제일’ = `contract.paymentDueDay`, ‘청구 결제일’ = `invoice.dueDay`(= max(약정 결제일, 실제 인도일)).
- 청구서의 `dueDay`는 그대로 둔다. **청구서에 새 칸을 두지 않는다.** 받은 금액은 원장에서 읽는다(4절 ‘용어’의 정의 하나뿐이다. 정상 상태에서는 그 청구서의 `receiptIds`가 가리키는 `RECEIPT-{수금 ID}` 분개와 같다). 실제 수금은 위 `processCollections`만 처리한다.
- **수금 처리(H17-3·H17-5).**
  - 정시(`ON_TIME`): 지금 `applyReceipt` 그대로다(수금 ID `RCPT-{청구서}`, 분개 `RECEIPT-RCPT-{청구서}`, 문장 그대로).
  - 지연(`LATE`): 청구 결제일 + `days`에 전액. `applyReceipt`의 수금 ID·분개 ID·문장 그대로다. 결제일부터 계획일 전날까지는 수금이 없다.
  - 부분(`PARTIAL`): 청구 결제일에 첫 수금 `applyBasisPoints(청구액, partialBp)`(수금 ID `RCPT-{청구서}-1`, 분개 `RECEIPT-RCPT-{청구서}-1`), 청구 결제일 + `days`에 나머지 = 청구액 − 첫 수금(`RCPT-{청구서}-2`, 분개 `RECEIPT-RCPT-{청구서}-2`). 둘 다 `receiptIds`에 넣고 분개에 `contractId`를 단다.
    - 부분의 두 수금은 **새 함수(금액 인수)**로 낸다. `applyReceipt`는 늘 `inv.amountMinor` 전액을 분개하므로 쓸 수 없다. 같은 수금 ID는 한 번만 반영한다(`applyReceipt`와 같은 규칙).
    - 새 함수는 받은 금액 합이 청구액이 될 때만 청구서를 `PAID`로, 계약을 `COMPLETED`·`completedDay`로 바꾼다. 첫 수금 뒤에는 계약 상태를 바꾸지 않는다. 계약은 **마지막 수금에서만** `COMPLETED`다(세션 A D5).
  - **상태 전이(H14-10, 검토 n29·n37).** 날 d의 마감에서 **수금 처리 뒤에**, `d ≥ dueDay`이고 남은 금액 > 0이면 `OVERDUE`, 다 받으면 `PAID`. 그래서 결제일 D 다음 상태(`s.day` = D+1)에서는 `OVERDUE`와 `overdueDays = 1`이 함께 보인다. 전이는 로그를 내지 않는다. `OVERDUE`는 `InvoiceStatus`와 `save-shape.ts` 열거에 이미 있고 엔진 사용처만 없었다(세션 A D6). rules-2에서는 결제일에 전액이 들어오므로 `OVERDUE`에 들어가지 않는다.
  - 계획일이 캠페인 끝을 넘으면 받지 못한 채 채권으로 남는다(`OVERDUE` 그대로, 계약은 `COMPLETED`가 아니다). 대손은 이번에 없다.
- **로그 문장(고정, H17-5. 새 문장은 이 셋뿐이다).**
  - 결제일에 받은 것이 없음(방식이 아니라 그날 수금 0이 조건이다, H17-5 원문): ‘{계약} 결제일에 대금이 들어오지 않음(남은 {금액})’
  - 부분 첫 수금: ‘{계약} 대금 일부 {금액} 수금(남은 {금액})’
  - 나머지 수금: ‘{계약} 대금 나머지 {금액} 수금. 계약 종결’
  - 지연의 전액 수금은 `applyReceipt`의 지금 문장(‘{계약} 대금 {금액} 수금. 계약 종결’) 그대로다. 인도 로그(‘현금은 {청구 결제일}일 수금 예정’)는 지금 문장 그대로다. 클레임 로그는 1절 문장이다.
  - 결제일과 수금일 밖의 날에는 그 계약의 수금 로그를 쓰지 않는다. 어느 문장에도 날짜·방식·계획(계획 수금일·지연일·나머지 수금일)을 넣지 않는다. rules-2 문장(청구서 발행·`applyReceipt`)은 바꾸지 않는다.
- **미래 누설 금지(로그·알림·상태·읽기, 설계 2절 4의 ‘실제 수금일’, H17-5).** 날 K의 마감 뒤에 보이는 모든 것(로그, `notices`, 상태 칸, 읽기 함수 값)은 K까지 일어난 수금만 반영한다. 수금 방식(정시·지연·부분)은 청구 결제일 마감 전에, 계획 수금일·지연일은 그 계획일 마감 전에 어디에도 드러나지 않는다. 결제일 마감 뒤에 보이는 것은 실제 수금(원장 `RECEIPT-`)과 그에 따른 `OVERDUE`·`PAID`뿐이다. 수금 계획을 담은 로그·알림·상태 칸을 더하지 않는다.

### 3. 읽기 함수(검토 42·44·45번, H17-7)

- 새 함수 `receivableSchedule(s, config)`(`reports.ts`): 미수 청구서(`status !== 'PAID'`)마다 `{ invoiceId, contractId, currency, dueDay, outstandingMinor, overdueDays }`.
  - `dueDay` = 청구 결제일(`invoice.dueDay`). `outstandingMinor` = 청구액 − 원장의 받은 금액(2절의 계산). `overdueDays` = max(0, `s.day` − `dueDay`).
  - 정렬은 `dueDay`, 그다음 `invoiceId`.
  - `collectionPlan`을 부르지 않는다(미래 누설 금지). 계획을 다른 경로(`drawAt` 등)로 다시 계산하지도 않는다. 그래서 결제일 전(`s.day < dueDay`) 행은 계획과 무관하게 청구서 칸만으로 정해진다: `dueDay` = 청구 결제일, `outstandingMinor` = 청구액, `overdueDays` = 0. 정시·지연·부분 청구서가 같은 꼴이다.
  - 다른 칸을 더하지 않는다.
- `campaignSummary.openInvoices.amountMinor`(`reports.ts` `campaignSummary`)는 남은 금액(청구액 − 받은 금액, `receivableSchedule`과 같은 계산)으로 낸다. 키는 그대로다. rules-2에서는 지금 값과 같다.
- `upcomingPayments`·`UpcomingPaymentKind`는 **손대지 않는다**(지급 일정이다. 수금 종류를 더하면 `src/ui/schedule.ts`의 never 분기가 깨진다. rules-2 골든 `m2a5-readers.test.ts`·`m2a5-save.test.ts`가 그대로여야 한다).
- `paymentDefaultStatus.recovery.nextReceipt`(`operations.ts` `paymentDefaultStatus`)는 **지금 규칙을 유지한다**(허브 결정 H13, 검토 R25 b). `operations.ts`는 고치지 않는다. 연체 청구서의 연체 여부와 남은 금액은 `receivableSchedule`이 보인다. 한계: 연체(지연·부분) 청구서가 있으면 `nextReceipt`는 지난 결제일을 내고, 부분 수금 뒤에는 금액도 청구 전액이다(`dueDay`로 거르지 않는다). 이 한계와 화면 문구(`src/ui/money-alerts.ts`의 ‘다음 수금’)를 결과 보고 ‘범위 밖 발견’에 적는다(검토 n30).
- `progress.ts` `contractProgress`의 미수 분기, `src/ui/schedule.ts`의 `RCV:` 행, `src/ui/main.ts`의 `nextReceipt`와 계약 카드의 ‘미수’ 문구는 고칠 수 없는 파일이다. rules-3이 화면에 없으므로 결과 보고 ‘범위 밖 발견’에 적는다.

### 4. 불변식

- **자리와 문장 규칙.** 새 검사 넷은 `operations-invariants.ts`의 `operationsProblems`에 둔다(마감·비마감 모두. **함수 첫머리의 운영 설정 조기 반환 `if (!o || !c) return problems;` 뒤, 기존 검사들과 같은 자리**다. 운영 설정이 없는 규칙 1 상태는 검사하지 않는다. 기존 시험 고정물 `acceptance-p0-acc.test.ts` P0-ACC-02는 수금 ID `RECEIPT_A`를 써서 아래 ‘용어’의 분개 ID 꼴을 따르지 않으므로, 검사를 조기 반환 앞에 두면 그 시험이 깨진다(허브 실측). 그렇다고 ‘받은 금액’ 정의를 `receiptIds` 기준으로 바꾸거나 규칙 판본 가드를 덧붙이지 않는다). `invariants.ts`는 ‘매출채권과 미수 청구서 합계’ 검사의 식만 고친다. `checkInvariants`는 문제를 모두 모아 `InvariantError` 한 문장으로 던지고, `deserializeSave`가 그것을 `SaveError`로 감싸 그대로 낸다. 시험 ‘불변식’은 그 문장에 해당 검사의 문장이 들어 있음을 `toThrow(문장)`으로 단언하고, 그 문장에 청구서 ID 또는 분개 ID가 있음과 사본 ①~③의 오류에 다른 새 검사 셋의 문장이 없음도 단언한다(시험 ‘불변식’). 그래서 다음을 지킨다.
  - 네 검사는 **서로 다른 고정 문장**을 낸다. 문장에 **청구서 ID 또는 분개 ID**를 넣는다. 기존 검사(매출채권, 통화별 순자산 항등식, `ledger.postedIds`, 분개 균형)의 문장과도 겹치지 않는다. 금액·ID 말고 날짜 같은 가변값은 넣지 않는다.
  - 문장은 구현이 정한다. 결과 보고에 네 문장을 그대로 적는다.
- **용어.** ‘받은 금액’은 그 청구서의 수금 분개(ID가 `RECEIPT-RCPT-{청구서}`이거나 `RECEIPT-RCPT-{청구서}-`로 시작)의 `CASH` 줄 합이다. 4절의 두 파일, 3절의 `receivableSchedule`·`campaignSummary.openInvoices`, 5절이 모두 이 정의를 쓴다(`contractRiskReport`는 지금처럼 그 계약 `contractId`가 붙은 `RECEIPT-` 분개로 읽는다. 계약당 청구서가 하나라 같은 값이다). 그래서 부분 수금 분개 둘(`-1`·`-2`)에도 `contractId`를 단다(2절, H17-5). 이 식은 도우미 하나로 두어도 되고(‘고칠 수 있는 파일’ 가운데 괄호 없는 파일, 예: `risk.ts`·`operations-invariants.ts`) 자리마다 같은 식을 써도 된다. 어느 쪽이든 값은 같다.
- **① 부분 수금 합 ≤ 청구액.** 모든 청구서에서 받은 금액 ≤ `amountMinor`다. 예: ‘`{청구서}`: 받은 금액(`{받은}`)이 청구액(`{청구액}`)을 넘습니다’. 변형 4는 **이 검사 하나만** 뺀 것이다. ‘`PAID`가 아니면 받은 금액 < 청구액’ 같은 검사를 덧붙이지 않는다. 덧붙이면 시험 ‘불변식’ ①의 사본(`OVERDUE`인데 합 > 청구액)이 그 검사로도 거부되어 변형 4가 살아남는다.
- **② `PAID`이면 합 = 청구액.** `status === 'PAID'`인 청구서에서 받은 금액 = `amountMinor`다. 예: ‘`{청구서}`: 수금 완료인데 받은 금액(`{받은}`)이 청구액(`{청구액}`)과 다릅니다’. 정시·지연 전액 수금(`applyReceipt`)과 부분 수금의 마지막 수금 뒤에만 `PAID`가 되므로(2절), 맞는 상태에서는 늘 성립한다.
- **③ `CLAIM-` 분개는 직접 무역 계약에만.** `CLAIM-`로 시작하는 분개마다 `contractId`가 있고 그 계약의 `kind === 'DIRECT_TRADE'`다. 예: ‘`{분개}`: 클레임 분개는 직접 무역 계약에만 있어야 합니다’. 주선 계약에 `CLAIM-{주선 계약}`(`SALES_ALLOWANCE` +1 / `CASH` −1)을 넣은 사본은 매출채권을 건드리지 않아 이 검사만 걸린다(시험 ‘불변식’ 사본 ③, 변형 49).
- **④ 클레임 ≤ 늦은 감액 뒤 판매액.** `CLAIM-`로 시작하는 분개마다 `SALES_ALLOWANCE` 줄 금액(양수) ≤ 그 계약의 `saleAmountMinor − priceReductionMinor`다. 예: ‘`{분개}`: 클레임(`{금액}`)이 늦은 감액 뒤 판매액(`{금액}`)을 넘습니다’. 1절대로 금액이 0이면 분개가 없으므로 0은 검사하지 않는다(시험 ‘불변식’ 사본 ④, 변형 50). 검사 번호 ①~④는 시험 ‘불변식’의 사본 번호·변형 47~50과 같은 순서다.
- **`invariants.ts` 매출채권.** 통화마다 `ACCOUNTS_RECEIVABLE` 잔액 = Σ(청구액 − 받은 금액)이다. 대상은 지금처럼 그 통화의 `status !== 'PAID'` 청구서다(거름은 그대로. `PAID` 청구서는 ②로 받은 금액 = 청구액이라 더해도 0이지만 바꾸지 않는다). 문장은 지금 문장 그대로다. rules-2에서는 미수 청구서의 받은 금액이 늘 0이라 값·문장이 같다.
- **통화별 순자산 항등식.** `operations-invariants.ts`의 `totalAssets − accountsPayable = openingEquity + profit + currencyTransferNet`는 그대로 두되, `ledger.ts` `summarize`의 profit에 `SALES_ALLOWANCE` 잔액을 더해야(1절, H15 O2. 부호는 1절) 클레임이 난 날 마감에서 통과한다. 변형 12(profit에서 `SALES_ALLOWANCE` 빠뜨림)는 이 항등식이 잡는다.
- **저장 왕복.** `save-shape.ts`는 `SAVE_ENUMS.account = ACCOUNT_KIND`라 새 계정이 저절로 따라가고, `invoiceStatus`에는 `OVERDUE`가 이미 있다(H17-8). 자동 반영되는지 확인하고, 저장 열거를 따로 고칠 일이 생기면 열거 값 추가만 한다. 부분 수금 중간 상태(`OVERDUE`, `receiptIds` = [`RCPT-{청구서}-1`])의 저장은 설정을 직접 넘긴 `deserializeSave`가 그대로 받아들인다.

### 5. 손익 읽기

- `components`의 6단계 `claim`과 8단계 `collection`을 설계 3.4 표의 순서대로, **앞 단계 줄 위에서** 채운다(순차 대체). 단계 사이 계산은 지금 `late`·`cancel`처럼 줄 목록의 `value` 차이로 한다. 6단계와 8단계도 줄 목록으로 만들고, 칸 값은 앞 단계 줄 목록과의 `value` 차이다.
- **항등식은 TASK-0062 4절 그대로다(허브 결정 H17-6).** `residual = realized − expected − (1~9단계 합)`으로 계산해 그대로 낸다(지금 `reports.ts`의 꼴). 시험이 `residual === 0`을 단언한다. `residual`을 상수 0으로 두지 않는다. 어떤 단계 칸(특히 `claim`·`collection`)도 ‘realized − expected − 앞 단계 합’으로 메우지 않는다(세션 A C1). `realized`는 지금처럼 원장 현금 줄과 남은 흐름으로 따로 계산한다. 현금 줄 가운데 `RECEIPT-` 줄은 이미 비용 줄이 아니라 줄마다 환산되므로(`cost = false`), 8단계를 같은 꼴로 만들면 항등식이 선다.
- **6단계 `claim`(직접 무역, 취소 아님, 평가일까지 `CLAIM-{계약}` 분개가 있는 계약만).** 5단계 줄(`lateFlows`)을 복사해 판매 줄(색인 3)의 **금액만** ‘늦은 감액 뒤 판매액 − `CLAIM-` 분개의 `SALES_ALLOWANCE` 줄 금액’으로 바꾼다. 그 값은 `invoice.amountMinor`와 같다. 날짜(환율일)는 2단계가 정한 청구 결제일 그대로다. 새 줄을 만들지 않는다. `claim` = 6단계 값 − 5단계 값(음수). 분개는 지금 `entries`(그 계약 `contractId`, 날 ≤ 평가일)에서 찾는다. 평가일까지 `CLAIM-`이 없거나 취소 계약이면 줄을 바꾸지 않고 `claim = 0`이다. 인도 전 계약의 `claim`은 0이다. `claimFor`를 미리 부르지 않는다(H14-5).
- **7단계 `cancel`.** 지금 `cancelFlows`를 5단계 줄(`lateFlows`)이 아니라 **6단계 줄**에서 만든다(취소 계약의 줄 거르기와 환급·보상·재예약 줄 추가는 그대로). `cancel` = 7단계 값 − **6단계 값**이다. 둘 다 고친다. `lateFlows`에서 만들고 6단계 값과 비교하면 `residual`은 0인 채 클레임이 `cancel`·`collection`으로 옮겨 간다. 5단계 값(`afterLate`)과 비교하면 `residual = −claim`이다. 둘 다 시험 ‘항등식’의 단계 연결 단언(정시 클레임 계약의 `cancel === 0`·`collection === 0`·`claim` 정확식)이 잡는다.
- **8단계 `collection`(취소되지 않았고 청구서가 있는 계약만).** 7단계 줄에서 판매 줄(색인 3)을 뺀다. 그 자리에 다음 줄을 넣는다. 둘 다 판매 줄처럼 비용 줄이 아니다(`cost = false`). 같은 환율이어도 USD 비용 줄과 합치지 않고 **줄마다** `usdToKrwMinor`로 바꾼다(TASK-0062 4절 ‘환산 꼴’, 설계 3.4, 지금 `value()`의 비용 아닌 줄).
  - 그 계약의 원장 `RECEIPT-` 분개(날 ≤ 평가일)의 `CASH` 줄 하나하나. 날짜는 **그 분개 날**이다(비용 줄이 아니므로 줄마다 환산한다).
  - 평가일까지 받지 못한 몫(청구액 − 받은 금액. 지금 `remaining`의 `outstanding`과 같은 값)이 0이 아니면 **평가일**의 한 줄. 0이면 넣지 않는다.
  - `collection` = 8단계 값 − 7단계 값. 정시 전액 수금이면 수금 줄 날 = 청구 결제일이라 정확히 0이다(클레임이 있어도 같다). 결제일 전 상태에서는 2단계의 평가일 상한 때문에 판매 줄과 미수 줄이 같은 환율이라 0이다. 그래서 결제일 전·정시 계약의 `collection = 0`이 시험 ‘미래 누설 없음’의 단언이 된다.
  - 수금은 **원장 `RECEIPT-` 분개로만** 읽는다. `contractRiskReport`는 `collectionPlan`·`claimFor`를 부르지 않는다(H15 O4). 6·8단계를 위해 `preview`·`dutyFor`를 새로 부르지도 않는다. TASK-0062 ‘관세 호출 인수’(운송 중 계약 `dutyFor` 호출 정확히 두 번)는 그대로 통과해야 하고, 깨지면 시험이 아니라 `reports.ts`를 고친다.
- **8단계에서 줄을 바꾸지 않는 계약.** 청구서가 없는 계약(인도 전)과 취소 계약은 7단계 줄을 그대로 두고 `collection = 0`이다. 인도 전 계약의 판매 줄은 2단계 상한 때문에 이미 평가일 환율이라 남은 흐름과 같다. **취소(`CANCELLED`) 계약은 6·8단계가 0이다**(세션 A C5). 취소 계약의 7단계 줄에는 판매 줄이 없어 색인 3이 환급·보상 줄일 수 있으므로, 8단계의 거름(취소 아님·청구서 있음)을 빼지 않는다. 주선 계약은 `CLAIM-`이 없어 6단계가 0이고, 정시 전액 수금이라 8단계도 구성상 0이다(설계 3.4 ‘주선은 schedule·fx·late·cancel·open_valuation만’). 운송 중·출항 전 직접 무역 계약(청구서 없음)에서 8단계가 줄을 바꾸지 않는 것은 TASK-0062 ‘열린 계약’ (가)(나)(R1 설정, `residual === 0`)가 지킨다. 6·8단계는 층을 보지 않고 원장만 읽으므로 R1 설정의 그 시험이 그대로 잡는다(인도 전 계약에서 판매 줄을 빼고 아무것도 넣지 않는 해석은 그 시험에서 `residual ≠ 0`이다). 깨지면 시험이 아니라 `reports.ts`를 고친다. R3 설정의 운송 중 계약은 시험 ‘항등식’ ⑨가 본다.
- **9단계 `open_valuation`은 구성상 0이다**(설계 3.4, 허브 결정 H14-5). 2·8단계의 평가일 상한 때문에 남은 흐름은 8단계까지 이미 평가일 환율이다. `open: true` 표지와 `evaluationDay`는 지금 그대로다.
- **평가일까지 일어난 사건만**(H14-5). 6·8단계에는 발생일 ≤ 평가일인 분개만 넣는다(지금 `entries`의 거름 그대로). 평가일 뒤의 수금 계획·손상 여부는 어디에도 들어가지 않는다.
- **부분 청구서의 1원.** 첫 수금 뒤의 부분 청구서는 첫 수금 줄(청구 결제일 환율)과 남은 줄(평가일 환율)을 따로 바꾸고 청구액 한 줄(청구 결제일 환율)을 빼므로, `collection`이 ‘남은 금액만 옮긴 식’ `usdToKrwMinor(남은, 평가일 환율) − usdToKrwMinor(남은, 청구 결제일 환율)`과 1원(±1) 다를 수 있다(허브 시제품: 시드 1~200의 부분 연체 상태 1,895개 중 588개). 이것은 결함이 아니라 환산 꼴의 결과이고, 맞추려고 8단계를 남은 금액만의 차이로 바꾸면 `residual`이 1원이 되어 항등식이 깨진다. 설계 3.4 ‘환산 꼴’과 H15 O3의 ‘연체 미수’ 예시 식은 받은 금액이 0인 지연 청구서의 식이다. 그래서 시험 ‘연체 미수 평가’는 받은 금액이 0인 지연 청구서로만 하고, 부분 청구서는 줄 꼴 식 `usdToKrwMinor(첫 수금, 첫 수금 분개 날 환율) + usdToKrwMinor(남은, 평가일 환율) − usdToKrwMinor(청구액, 청구 결제일 환율)`과 ‘항등식’(독립 `realized` 재계산, `residual === 0`)으로 따로 단언한다(H17-6).
- `openFixedRateKrw`·`expected`·0~5단계·`open`은 바꾸지 않는다. 0062·0063 시험이 그대로 통과한다.

### 6. 측정용 변환

- `withRiskLevel`(`src/engine/risk.ts`)에 `R3`를 더한다. `level` 타입에 `'R3'`를 더하고, `layers`는 `['FX', 'TARIFF', 'SURCHARGE', 'CLAIM', 'COLLECTION']`(설계 6절 순서)이다. 나머지는 R2와 같다(규칙 판본 `M2a-rules-3`, 프로필 복사, 원화 매입 변환 포함). `R0`·`R1`·`R2` 결과는 바뀌지 않는다(TASK-0063 ‘R2 변환’ 시험이 그대로 통과한다).
- 시험은 이 변환을 옛 운영 시나리오에 걸어 만든다(설계 7절). 시드마다 설정을 새로 만든다(`withRiskLevel({ ...시나리오, seed }, 'R3', 프로필)`). 실험 시나리오 레코드는 만들지 않는다(TASK-0065).

## 시험(새 파일 `src/engine/m2a5-risk-credit.test.ts`)

- 시험에 자료 ID·조정 상수를 쓰지 않는다. 필요한 사건은 시드를 찾아서 만든다. **시드 범위는 엔진 구동 사례 찾기와 순수 함수 오라클 모두 2001~2200이다**(H17-8, 세션 A C10. 측정 시드 1~200과 겹치지 않게). 찾았는지 먼저 단언한다. 찾는 시험은 첫 사례에서 멈춘다(행이 ‘모두’라고 적은 곳만 전부 본다).
  - **사건을 먼저 찾는 구성은 수락할 수 있는 사건만 고른다.** 찾기 조건에 다음을 넣고 찾았는지 단언한다: 그 공개일 묶음에 그 판매 견적이 있고, 수락(plan 포함)이 APPLIED다.
  - 전제(그 청구서가 지연·부분 계획임, 결제일 전 상태에 청구서가 있음, 두 환율이 다름 등)는 찾기 조건에 넣고, 본 단언 전에 다시 단언한다.
- **시드마다 설정을 따로 만든다**: `withRiskLevel({ ...시나리오, seed }, 'R3', 프로필)`. 순수 함수와 환율에는 `s.rng.seed`를 넘긴다(설정 시드와 같음을 한 번 단언한다). 설정 하나를 두고 시드만 바꿔 부르면 `preview`(`config.seed`)와 어긋난다. 프로필 사본은 `structuredClone`으로 만들고 값은 시험 안에서 정한다(자료 파일은 고치지 않는다. 엔진 칸 이름은 camelCase다: `claims.byGood`·`pClaimBp`·`minor.weightBp`·`collections.byCounterparty`·`pOnTimeBp`·`pLateBp`·`pPartialBp`·`partialBp`·`lateMinDays`·`lateMaxDays`).
- 용어: 청구 결제일 D = `invoice.dueDay`, 계획일 = D + `days`, 늦은 감액 뒤 판매액 S = `saleAmountMinor − priceReductionMinor`, 클레임 X = `CLAIM-{계약}` 분개의 `SALES_ALLOWANCE` 금액, 청구액 = `invoice.amountMinor` = S − X, 첫 수금 = ⌊(청구액 × `partialBp` + 5000) ÷ 10000⌋, 남은 금액 = 청구액 − 원장 `RECEIPT-` 분개 `CASH` 줄 합. 로그 문장의 {금액}은 `formatMoney`로 적힌 값이다.
- 구동기 둘을 이 파일 안에 둔다(엔진 공개 함수만). **첫 쌍 구동기**: 1일 `openTradePairs(s, cfg)[0]`(행이 다른 쌍을 고르면 그 쌍) 하나만 본사 직원과 다음 첫 편(`listSailings(cfg, 노선, 2)[0]`, 늦은 인도가 필요하면 둘째 편) plan으로 받고, 그 뒤는 매일 원화 부족분만 환전하며 진행한다(TASK-0062 `setup`·`advance` 꼴). 날마다 환전은 0063 시험의 `fund`처럼 가용 USD가 모자라면 환전하지 않고 넘어간다(허브 실측: 시드 2001~2200 전부가 76일 무렵부터 USD 150에서 환전이 거절된다. APPLIED를 단언하는 `exchange`는 1일 수락 전 환전에만 쓴다). **무역 구동기**: ‘캠페인 끝’ 행에 적는다. 환전 묶음 수는 `dailyKrwDue`·`fundsPosition`·`usdLotKrw`로 계산한다.
- **rules-3과 `withRiskLevel`(R0 포함) 시험은 엔진 공개 함수만 쓴다**(`createGame`·`openDay`·`planState`·`commitDay` 등과 읽기 함수).
  - `src/engine/sim/**`의 `simulate`·`runSuite`·d03은 부르지 않는다.
  - 판정표 고정 기록 잠금: 고정 기록이 비어 있으면 새 rule_set이나 rules-3을 쓰는 d03·`runSuite`·`run.mjs` 실행(R0 포함)을 하지 않는다(세션 A C3).
  - ‘등급별 확률’은 엔진을 돌리지 않고 순수 함수 `collectionPlan`으로 센다(세션 A C10).
- 직접 무역을 받으려면 원화가 있어야 한다. 시험 구동기가 환전 명령을 직접 넣는다. 무명령에 환전만 하는 구동은 64일 무렵 USD가 바닥나 71일 이후 공개일의 원화 매입 수락이 자금 부족으로 거절된다(허브 시제품: R3 시드 2001~2010에서 71·72·73·78일 모두 거절). 거절을 건너뛰어야 하는 구동기(‘캠페인 끝’)에서는 APPLIED를 단언하는 `apply`·`exchange` 도우미를 쓰지 않는다.
- `vi.mock('./risk')`·`vi.mock('./rng')`는 TASK-0062 시험 머리처럼 **통과형**으로 쓴다(`importOriginal`로 원본을 받고 `claimFor`·`collectionPlan`·`drawUniform`만 `vi.fn(원본)`). 인수 없는 `vi.mock('./risk')`(자동 모의)는 쓰지 않는다(`withRiskLevel`·`referenceRate`까지 `undefined`가 된다).
  - `engine.ts`도 같은 모의를 지난다. 호출 수를 세는 단언은 **상태를 다 만든 뒤, 세려는 함수를 부르기 직전에 `mockClear()`하고, 부른 뒤 기록을 읽는다.** Vitest의 `clearMocks`는 기본값이 꺼져 있고 이 저장소 설정(`vite.config.ts`)에도 없으며, 켜더라도 시험 사이에만 지운다. 같은 시험 안에서 돌린 엔진의 인도·수금 처리가 첩자를 지나므로 지우지 않으면 맞는 구현도 0회 단언에 실패하고, 기록을 읽기 직전에 지우면 0회 단언이 늘 통과한다(세션 A C9, 허브 실측: 시드 2001 40일 상태에 `claimFor` 9회·`collectionPlan` 25회가 쌓여 있다).
  - 첩자는 내보낸 바인딩만 본다. `risk.ts` 안에서 같은 모듈 도우미를 거친 호출은 보이지 않는다. ‘원천 검사’가 짝이다.
- **기대값은 시험 안에서 따로 계산한다.** H17-1~3의 식을 시험 안에 다시 쓴 오라클을 둔다: `u(흐름) = drawUniform({ seed, cursors: { [흐름]: 0 } }, 흐름).value`(원본 `rng`), `U[a, b] = a + ⌊u × (b − a + 1)⌋`, 품목 행 → 손상(`U[0, 9999] < pClaimBp`) → 층(`U[0, 9999] < minor.weightBp`면 `MINOR`) → 손상률(`U[층.minBp, 층.maxBp]`), 거래처 행 → 등급 행 → 방식(v = `U[0, 9999]`, 정시 → 지연 → 부분 순) → 지연일(`U[lateMinDays, lateMaxDays]`, 정시는 0이고 뽑지 않음). `applyBasisPoints`는 시험 안 정수식 ⌊(n × bp + 5000) ÷ 10000⌋(양수), `usdToKrwMinor`는 TASK-0062·0063 시험의 `toKrw`(half-away 정수식)다. 표의 `usdToKrwMinor(…)`는 이 정수식을 뜻한다. 환율은 `referenceRate(cfg, s.rng.seed, min(날, 평가일))`로 읽어도 된다(TASK-0062 시험이 오라클과 대조한 함수다). 금액(클레임, 첫 수금, 남은 금액)과 날짜(계획일)는 늘 시험 안 식이다.
  - `claimFor`·`collectionPlan`의 결과(손상·층·손상률·방식·지연일)는 사건 찾기·전제·구성·기대값의 입력으로 읽어도 된다(‘일정 오라클(클레임·수금)’이 두 함수를 오라클과 대조한다). 두 함수를 엔진 관측의 대신으로 쓰지 않는다(‘공통 난수’).
  - `applyBasisPoints`·`usdToKrwMinor`·`contractRiskReport`·`receivableSchedule`·`campaignSummary`는 기대값 계산에 쓰지 않는다.
  - 독립 `realized`·`expected`는 TASK-0063 시험(`m2a5-risk-cost.test.ts`)의 `independent`·`identity`와 일정 오라클 도우미(`oracleDuty` 등)를 이 파일에 복사해 쓴다(그 파일은 고치지 않는다. 복사본도 고치지 않는다: 수금 줄은 그 계약 `contractId` 집합 안에서 `RECEIPT-` 접두로 가려 이미 줄마다 환산한다).
- **TASK-0062·0063 시험(`m2a5-risk-fx.test.ts`·`m2a5-risk-cost.test.ts`)은 고치지 않는다.** 특히 ‘관세 호출 인수’는 운송 중 계약의 `dutyFor` 호출을 `toEqual`로 정확히 두 번 고정한다. 6·8단계를 위해 `contractRiskReport`에서 `preview`·`dutyFor`를 새로 부르지 않는다. 깨지면 시험이 아니라 `reports.ts`를 고친다.
- **변형 결과가 원래 코드와 같게 나오면 이유를 적고 끝내지 말고, 먼저 그 시험의 전제(시드·청구서·상태 선택)가 빠졌는지 확인해 시험을 고친다.** 예: 같은 환율 주의 지연 계약을 골라 변형 5가 같아진 경우, 계약 ID 키 값이 같은 시드를 골라 변형 6이 같아진 경우.
- **무역 구동기 실행은 모듈 최상위에서 한 번만, 즉시 만든다.** ‘캠페인 끝’ 행의 무역 구동기를 파일 최상위 `const`(예: `const shared = buildTradeRuns()`)로 시드 2001부터 **다섯 사건이 모두 나올 때까지** 이어 돌린다(상한 2200. 사건마다 처음 나온 시드에서 멈추고, 돌린 시드마다 끝 상태와 날마다 상태를 담는다): ㉠ 지연 미수 청구서와 ㉡ 부분 미수 청구서(‘캠페인 끝’), ‘연체 미수 평가’ (나)의 부분 청구서 상태, ‘항등식’ ⑤a의 부분 청구서 D + 1 상태, ‘채권 일정 정렬’의 상태. 이 다섯 행과 ‘항등식’ ⑦, ‘미래 누설 없음(호출 없음)’이 이 실행을 공유한다(행마다 다시 돌리지 않는다). 사건을 찾는 행은 실행을 돌리지 않고 찾았는지만 단언한다. 사건을 찾는 행은 각자 그 사건의 전제 전부를 찾기 조건으로 넣고, 처음 나온 시드를 찾았는지 **그 행의 `it` 안에서** 단언한다(최상위에서는 `expect`를 쓰지 않는다. 못 찾으면 `undefined`로 두고 `it`에서 단언해야 다른 시험 결과가 가려지지 않는다). 지연 생성(`??=` 캐시) 도우미 꼴로 만들지 않는다(첫 소비자 `it`이 Vitest 기본 5초에 깨진다. Vitest 5.0.3은 모듈 수집 단계에 timeout을 두지 않는다, 허브 실측). 한 실행은 약 0.6~1.2초(기계에 따라 다름)다. 허브 실측(`5bee326` 시제품)에서는 ㉠ 2003·㉡ 2006·(나)·⑤a 2005(INV-CT011)라 몇 시드 안에 끝나지만, Codex 구동기 세부(직원·편·환전 순서)에 따라 더 갈 수 있어 다섯 사건을 모두 찾을 때까지 잇는다. 쓴 시드 범위와 다섯 사건의 (시드, 청구서 ID, D, D 환율)을 결과 보고에 적는다. 시드를 찾거나 200시드를 도는 **모든** `it`(예: ‘공통 난수’, ‘미래 누설 없음’·‘클레임’·‘지연’·‘부분’의 찾기, ‘항등식’ ③④⑤b, ‘연체 미수 평가’ (가), ‘미래 누설 없음(호출 없음)’, ‘결정성·저장’의 두 번 완주)에는 TASK-0063 시험처럼 명시 `timeout`(`it(…, 60000)` 꼴, 60000ms 이상)을 준다. Vitest 기본 5초로는 깨진다(첫 쌍 구동기 한 실행 약 0.3~0.4초).

| 시험 | 확인할 것 |
|---|---|
| 새 층이 꺼진 R2 | 시드 2001. R2 설정(`withRiskLevel(…, 'R2', 프로필)`)을 첫 쌍 구동기로 `campaignDays` 마감까지 돌린다(이 실행이 90일 마감에 경영 실패로 끝나도 된다. 이 행의 단언은 청구서·분개·로그·커서·읽기 함수뿐이고 `outcome`·평가일을 쓰지 않는다. ‘캠페인 끝’의 실패 실행 제외 조건은 이 행에 적용하지 않는다. 허브 실측: 시드 2001은 R2·R3 모두 90일에 실패로 끝나지만 단언은 모두 성립한다). 원장에 `CLAIM-` 분개가 없다. 모든 직접 무역 청구서가 청구 결제일 마감에 `RCPT-{청구서}` 하나로 전액 수금되어 `PAID`다. 어느 날 상태에도 `OVERDUE`가 없다. 로그에 ‘결제일에 대금이 들어오지 않음’·‘대금 일부’·‘대금 나머지’·‘화물 일부 손상’ 줄이 없다. `state.rng.cursors`에 `CLAIM:`·`COLLECT:` 키가 없다. `receivableSchedule`의 결제일 전 행은 `{ invoiceId, contractId, currency, dueDay, outstandingMinor: 청구액, overdueDays: 0 }`이고 수금 뒤에는 행이 없다. `campaignSummary.openInvoices`의 `amountMinor`는 청구액이다. R2 분개 덤프의 `cmp` 0은 ‘지켜야 할 것’이 따로 본다 |
| 일정 오라클(클레임·수금) | H17-1~3 식을 시험 안에서 원본 `drawUniform`과 시험 안 정수식으로 다시 쓴다. 범위는 시드 2001~2200 × 시험 안 문자열 키 셋(예: `K1`·`K2`·`K3`, 자료 ID 아님) × 시작 프로필 R3 설정의 모든 `claims.byGood` 품목 × 모든 `collections.byCounterparty` 거래처다. 이 범위에서 `claimFor(cfg, seed, 키, 품목)`과 `collectionPlan(cfg, seed, 키, 거래처)`의 반환값이 오라클과 `toEqual`로 정확히 같다(손상이 아니면 `null`, 손상이면 `{ tier, rateBp }`. `{ mode, days }`, 정시는 `days = 0`). **전제를 먼저 단언한다**: `MINOR`·`MAJOR`·`ON_TIME`·`LATE`·`PARTIAL`, `days = lateMinDays`, `days = lateMaxDays`가 각각 한 번 이상 나온다(허브 시제품: MINOR 68, MAJOR 13, ON_TIME 1702, LATE 460, PARTIAL 238, days 5가 73회·15가 78회). 층이 없는 설정(R2)에서는 같은 인수로 `claimFor`가 `null`, `collectionPlan`이 `{ mode: 'ON_TIME', days: 0 }`이고, `byGood`·`byCounterparty`를 비운 프로필 사본의 R2 설정으로 불러도 예외가 없다(표를 읽지 않는다, H17-2·3) |
| 흐름 유일성(클레임·수금) | 관찰형(통과형 `vi.mock('./rng')`, TASK-0063 ‘흐름 유일성’과 같은 방식)이다. 시드 2001~2200마다 따로 한다. `mockClear()` 뒤 키 셋의 키마다 `claimFor`를 한 번(`claims.byGood`의 첫 품목), `collectionPlan`을 한 번(`byCounterparty`의 첫 거래처) 부른다. 같은 키로 여러 품목·거래처를 부르지 않는다(같은 `(CLAIM:{키}:hit, 0)`이 되풀이되어 맞는 구현도 200시드 모두 실패한다, 허브 실측). 그 시드에서 기록된 `(stream, cursor)` 쌍이 서로 겹치지 않는다. 흐름 이름은 `CLAIM:{키}:hit`·`…:tier`·`…:rate`·`COLLECT:{키}:mode`·`…:days`뿐이고 커서는 모두 0이다. 호출마다 기록된 흐름은 결과가 정하는 것만이다: 손상이 아니면 `…:hit`만, 정시면 `…:mode`만(H17-2·3). **전제**: 시드 2001~2200 전체에서 `…:rate`가 기록된 시드와 `…:days`가 기록된 시드가 각각 하나 이상 있음을 먼저 단언한다(허브 시제품 수치는 ‘일정 오라클(클레임·수금)’ 행과 같다). 기록된 흐름을 `CLAIM:{키}:`·`COLLECT:{키}:` 접두로 호출마다 나누어, 그 호출의 (stream, cursor) 집합이 반환값이 정하는 집합과 `toEqual`임을 단언한다: `null`이면 {`CLAIM:{키}:hit`}, 손상이면 {hit, tier, rate}, `ON_TIME`이면 {`COLLECT:{키}:mode`}, 그 밖은 {mode, days}, 커서 모두 0(시드마다 `mockClear()` 한 번이면 된다. 허브 실측: 이 집합 단언 없이 겹침·정규식·커서만 보면 변형 17·18이 살아남는다). 금지하는 것은 반환값과 무관하게 시험이 고정한 흐름 목록이다 |
| 클레임 | 엔진 사례 셋과 순수 함수 층 범위로 한다. **(가) 정시 인도·정시 수금 손상 계약.** 첫 쌍 구동기로 시드 2001~2200에서 다음 셋을 모두 만족하는 첫 시드를 찾는다(찾았는지 단언. 첫 쌍은 의류(손상 5%)·A 등급(정시 85%)이라 시제품 식에서 200시드에 세 조건을 다 만족하는 시드가 5건이다. 허브·세션 A 독립 실측: 2023·2052·2090·2103·2138, 다섯 모두 인도일 7·D 10의 환율이 달라 셋째 조건도 성립한다. 손상만은 7건으로 그중 지연 1(2024)·부분 1(2150). 첫 시드 2023): 1일 첫 쌍 판매 견적의 `claimFor(cfg, seed, sellOfferId, goodId)`가 손상, 그 견적의 `collectionPlan(cfg, seed, sellOfferId, customerId).mode === 'ON_TIME'`(아래 수금 단언과 ‘항등식’ ②·‘미래 누설 없음(클레임)’ ③·‘클레임 계약 보고서’가 정시 수금을 전제한다. 허브 시제품의 첫 손상 시드 2023은 우연히 정시이고 다음 손상 시드 2024는 지연 15일이라, 이 조건이 없으면 맞는 구현도 시드 순서에 따라 실패한다), 인도 뒤 상태에서 `referenceRate(cfg, s.rng.seed, deliveredDay) ≠ referenceRate(cfg, s.rng.seed, D)`(‘항등식’ ②의 전제. 첫 쌍은 인도일과 D가 다른 환율 주라 거의 늘 성립한다). 찾은 시드를 결과 보고에 적는다. 인도일 마감 뒤 다음을 단언한다. `CLAIM-{계약}` 분개가 하나이고 날은 `deliveredDay`, `contractId`가 붙고, 줄은 `SALES_ALLOWANCE` +X / `ACCOUNTS_RECEIVABLE` −X다. X = ⌊(S × r + 5000) ÷ 10000⌋(시험 안 정수식, r = 그 견적의 `claimFor(…).rateBp`). `SALE-{계약}`의 매출채권 줄은 S 그대로다. 청구액 = S − X. `priceReductionMinor === 0`(정시). 인도일 로그(`day === deliveredDay`로 거른 목록)에서 인도 로그(‘…수금 예정’) 줄의 바로 다음 줄이 ‘{계약} 화물 일부 손상: 고객이 대금 {X} 감액 청구’다(1절 ‘인도 로그 바로 뒤’). 인도일 `commitDay`가 예외 없이 끝난다(마감 순자산 항등식, H15 O2). 그 상태의 `summarize(s.ledger, 'USD')`에서 `totalAssets − accountsPayable === openingEquity + profit + currencyTransferNet`을 시험이 직접 단언한다(`profit`이 `SALES_ALLOWANCE` 잔액을 담는다. 변형 12는 불변식 검사가 함께 변형되어도 이 단언이 잡는다). D 마감 뒤 `RECEIPT-RCPT-{청구서}`의 `CASH`가 S − X다. **(나) 늦은 인도 손상 계약(감액 기준·반올림).** 둘째 편 plan으로 받아 `priceReductionMinor > 0`인 계약을 1일 공개 쌍 가운데(화장품 쌍 포함) 찾는다. 찾기 조건에 셋을 넣고 찾았는지 단언한다: ⌊(S × r + 5000) ÷ 10000⌋ ≠ ⌊((S + priceReductionMinor) × r + 5000) ÷ 10000⌋, (S × r) mod 10000 ≥ 5000(1일 정적 판매액은 10000의 배수라 정시 계약으로는 감액 기준도 반올림도 보이지 않는다. 허브 시제품: 화장품 쌍 둘째 편, 감액 25,000에서 시드 55는 57,038 대 floor 57,037. 이 수치는 측정 시드 1~200의 것이라 2001~2200에서 찾은 첫 시드를 결과 보고에 적는다), 그리고 그 판매 견적의 `collectionPlan(…).mode === 'ON_TIME'`((가)의 수금 단언을 그대로 쓰기 위해서다. 화장품 쌍 거래처는 B·C 등급이라 정시 55~70%이고, 두 쌍을 합해 200시드에 기대 10건쯤이다). 단언은 (가)의 단언 가운데 `priceReductionMinor === 0`을 뺀 나머지와 같고, `priceReductionMinor`는 시험 안 늦은 감액 식(`config.terms`가 `PER_LATE_DAY_CAPPED`이면 `min(lateDeliveryPriceReductionMinor × lateDays, ⌊(saleAmountMinor × lateDeliveryCapBasisPoints + 5000) ÷ 10000⌋)`)과 같으며 클레임을 더하지 않는다. 완료 상태(정시 수금 뒤)의 `contractRiskReport`에서 `claim === usdToKrwMinor(S − X, r) − usdToKrwMinor(S, r)`(r = D 환율. 6단계는 판매 줄 금액만 바꾸고 날짜는 2단계의 D 그대로다), `cancel === 0`, `collection === 0`(정시 전액 수금), `residual === 0`도 단언한다(이 사례는 인도일 = D일 수 있어 ‘항등식’ ②의 환율 부등식 전제는 쓰지 않는다. 6단계가 감액 전 판매액 `saleAmountMinor`에서 X를 빼는 변형 53은 `residual`이 0이라 이 `claim` 단언만 잡는다. 허브 실측: 이 사례는 시드 2019·2060·2111에 있다). **(다) 큰 층(엔진).** 시작 프로필의 1일 첫 쌍은 큰 층이 200시드에 1~2번뿐이라 쓰지 않는다. 프로필 사본(`claims.minor.weightBp = 0`, `major.weightBp = 10000`, 나머지 그대로. 사본으로 한다고 결과 보고에 적는다)으로 (가)와 같은 찾기 조건(손상, `collectionPlan` 정시)으로 시드를 찾아, `claimFor(…).tier === 'MAJOR'`, `rateBp ∈ [major.minBp, major.maxBp]`, X 식, 순자산 항등식을 단언한다. **(라) 층 범위(순수 함수).** 시드 2001~2200마다 그 시드 설정에서 `generateBatch(cfg.seed, k, 직전 index, cfg)`를 `commitDay`와 같이 k = 1 … (`publish.lastDay` − `publish.firstDay`) ÷ `publish.intervalDays`(= 11. 시험 안에서 `publish`로 계산한다)로, 직전 index는 `batchZero(cfg).index`에서 시작해 앞 결과의 `batch.index`로 이어 불러 모은(1일 정적 `cfg.offers` 판매 견적은 더하지 않는다. 더해도 전제·결과는 같다) `kind === 'customer'` 판매 견적 ID 전부로 `claimFor`를 부른다(자료 ID를 적지 않는다. 무명령 진행은 USD 바닥으로 실패해 뒤 묶음이 공개되지 않을 수 있어 상태의 `s.offers`보다 이 길이 확실하다). **먼저 전제를 단언한다**: 작은 층 추첨과 큰 층 추첨이 각각 5건 이상이다(시제품 식에서 큰 층 약 60건). 손상인 추첨 **모두**에서 `rateBp`가 반환된 층의 범위(`[minor.minBp, minor.maxBp]` 또는 `[major.minBp, major.maxBp]`) 안이다. 층은 반환값에서 읽고 손상률로 거꾸로 분류하지 않는다. 주선 화물에 클레임이 없는 것은 ‘주선(R3)’이 본다 |
| 공통 난수 | 엔진 공개 함수로 같은 시드의 두 실행을 만든다. 시드마다 R3 설정을 새로 만든다. 1일 첫 직접 무역 쌍(상태에서 찾는다)의 판매 견적을 X라 한다. 실행 A는 1일에 그 쌍만 받는다(계약 ID k1). 실행 B는 같은 날 주선 견적 하나(`config.offers`의 `forwarding`)를 먼저 받아 계약 번호를 민 뒤 같은 쌍을 받는다(계약 ID k2). X에는 A·B에서 같은 본사 직원과 같은 편(다음 첫 편)을 배정하고, 주선에는 **다른 본사 직원**을 배정한다(같은 직원이면 B의 X 수락이 ‘준비 배정 불가’로 거절된다. 다른 직원이면 허브 실측 200/200 성공). 원화는 구동기가 환전한다. 관찰값은 세 가지다: ① `CLAIM-{계약}` 분개 유무와 `SALES_ALLOWANCE` 금액, ② 그 청구서 `receiptIds`의 꼴(`RCPT-{청구서}` 하나, 또는 `RCPT-{청구서}-1`·`-2`), ③ 각 수금 분개 `RECEIPT-{수금 ID}`의 날 − D. 시험 안에서 키 x의 기대 관찰값을 순수 함수로 만든다: `claimFor(cfg, seed, x, 품목)`이 손상이면 ⌊(S × rateBp + 5000) ÷ 10000⌋, 아니면 분개 없음. `collectionPlan(cfg, seed, x, 거래처)`가 정시면 [`RCPT-{청구서}`@0], 지연이면 [`RCPT-{청구서}`@`days`], 부분이면 [`-1`@0, `-2`@`days`]. **시드 둘을 시드 2001~2200에서 따로 찾고, 찾았는지 단언한다.** Sc는 `claimFor(cfg, seed, k1, 품목)`과 `claimFor(cfg, seed, k2, 품목)`이 깊은 비교로 다른 첫 시드, Sp는 `collectionPlan(cfg, seed, k1, 거래처)`와 `collectionPlan(cfg, seed, k2, 거래처)`가 다른 첫 시드다(k1·k2는 두 실행의 상태에서 읽는다. 첫 계약 번호라 시드와 무관하지만 적지 않는다). 순서: 시드마다 두 실행의 1일 수락까지만 먼저 만들어 k1·k2를 읽고, 순수 함수 전제가 맞는 시드에서만 그 상태를 이어 끝까지 돌린다(전제가 맞지 않는 시드의 실행은 버린다). 이 전제가 변형 6의 각 갈래가 결과를 바꾸는 시드를 고른다(시작 프로필, 시드 2001~2200: 클레임 키가 다른 시드 16개, 수금 키가 다른 시드 53개, 어느 쪽도 다르지 않은 시드 136개. 전제 없이 고르면 변형 6이 3분의 2에서 살아남는다). 각 시드에서 먼저 단언한다: k1 ≠ k2, X의 `deliveredDay`·`priceReductionMinor`·D가 A·B에서 같다, 계획일 D + `days` ≤ `campaignDays`, Sc에서는 S ≥ 10000(손상률 1bp 차이가 금액에 드러난다). 두 실행을 X의 마지막 수금(또는 캠페인 끝)까지 돌린다. 그다음 단언한다: 각 실행의 관찰값 ①②③이 X 키의 기대 관찰값과 같다. 이어서 두 실행의 ①②③이 서로 같다. 시험 안에서 `claimFor`·`collectionPlan`을 부르는 것은 찾기 조건과 X 기대값뿐이다. 두 실행에서 판매 견적 키로 부른 순수 함수 값끼리 견주는 것으로 엔진 관측을 대신하지 않는다(엔진 키와 무관하게 늘 같다). 두 실행끼리만 견주는 것도 이 시험이 아니다(전제 시드 40개 중 23개에서 변형 6이 살아남는다, 허브 시제품) |
| 공개 등급 | R3 설정 1일 상태에서 직접 무역 쌍의 `quotePreview(s, cfg, { buyOfferId, sellOfferId })`에 `riskGrades`가 있고 `toEqual({ damage: 설정 프로필 `claims.byGood`에서 매입 견적 `goodId` 행의 `grade`, credit: `collections.byCounterparty`에서 판매 견적 `counterpartyId` 행의 `grade` })`다(기대값은 설정의 프로필 객체에서 계산한다. 자료 ID·등급 문자를 적지 않는다). `Object.keys(riskGrades)`가 `['damage', 'credit']`이다(확률 숫자 키 없음). 같은 상태의 주선 견적 `quotePreview(s, cfg, { offerId })`는 `riskGrades === null`이다. 두 호출 직전 `mockClear()`, 호출 뒤 `claimFor`·`collectionPlan` 0회. 첫 쌍 구동기로 다음 공개일까지 진행해 `openTradePairs`에서 1일 쌍과 신용등급이 다른 판매 거래처의 쌍 하나를 찾고(찾았는지 단언), 같은 단언을 한다 |
| 지연 | 첫 쌍 구동기로 시드 2001~2200에서 1일 첫 쌍의 `collectionPlan`이 `LATE`이고 `claimFor`가 손상이 아닌 첫 시드를 찾는다(찾았는지, 계획일 D + `days` ≤ `campaignDays` 단언). D 마감 뒤(`s.day = D + 1`): 그 청구서의 `RECEIPT-` 분개가 없고 `receiptIds`가 비었다. `status === 'OVERDUE'`이고 `receivableSchedule`의 그 행이 `{ invoiceId, contractId, currency, dueDay: D, outstandingMinor: 청구액, overdueDays: 1 }`이다. 계약은 `COMPLETED`가 아니다. D + 1 ≤ `s.day` ≤ D + `days`인 날마다 그 행의 `overdueDays === s.day − D`, `outstandingMinor === 청구액`이고 `campaignSummary.openInvoices` 그 행의 `amountMinor === 청구액`이다. 계획일 마감 뒤: `RECEIPT-RCPT-{청구서}` 하나가 날 = D + `days`, `CASH` = 청구액, `contractId` 붙음이고, `receiptIds`가 [`RCPT-{청구서}`], `status === 'PAID'`, 계약 `COMPLETED`·`completedDay === D + days`, `receivableSchedule`에 그 행이 없다. **로그(H17-5)**: 전제로 `deliveredDay < D`를 먼저 단언한다(첫 쌍 첫 편은 인도일 7·D 10). 인도일 줄은 지금 문장 그대로 ‘…현금은 {D}일 수금 예정’이다. D일부터 계획일 마감까지, 그 계약 ID(`contract.id`. 청구서 ID `INV-{계약}`도 이를 담는다)를 부분 문자열로 담은 로그 줄은 D에 정확히 하나 ‘{계약} 결제일에 대금이 들어오지 않음(남은 {청구액})’, 계획일에 정확히 하나 `applyReceipt` 문장 ‘{계약} 대금 {청구액} 수금. 계약 종결’이고, 그 사이 날에는 0줄이다(접두어로 거르지 않는다. 첫 쌍 구동기는 계약이 하나라 ID 부분 문자열 충돌이 없다, 허브 실측 시드 2021: 계획일 21·지연일 11). 로그 전체에 ‘{계획일}일’·‘{지연일}일’ 숫자가 없음을 단언하지 **않는다**(1일 체결 로그 ‘(납기 8일)’, 출항 로그 ‘도착 예정 N일’, 인도 로그 ‘N일 수금 예정’, 관세 공지 ‘(N일부터)’가 같은 숫자를 담을 수 있다. 허브 실측: 부분 첫 시드 2019는 지연일 8 = 납기 8일, 지연 시드 2049·2094는 관세 공지가 지연일·계획일과 같다). 날짜·일수 누설은 위 두 줄의 고정 문장 비교와 ‘미래 누설 없음(로그·상태)’ (나)(다)·(라)(마)가 지킨다 |
| 부분 | **(가)** 첫 쌍 구동기로 `collectionPlan`이 `PARTIAL`이고 손상이 아닌 첫 시드를 찾는다(찾았는지, 계획일 ≤ `campaignDays` 단언). D 마감 뒤: `RECEIPT-RCPT-{청구서}-1` 하나(날 D, `CASH` = 첫 수금, `contractId` 붙음). 첫 수금 = ⌊(청구액 × `partialBp` + 5000) ÷ 10000⌋(시험 안 정수식). `receiptIds`가 [`RCPT-{청구서}-1`], `status === 'OVERDUE'`, 계약 `status !== 'COMPLETED'`, `receivableSchedule` 그 행의 `overdueDays === 1`·`outstandingMinor === 청구액 − 첫 수금`, `campaignSummary.openInvoices` 그 행 `amountMinor === 청구액 − 첫 수금`(남은 금액). 계획일 마감 뒤: `RECEIPT-RCPT-{청구서}-2`(날 D + `days`, `CASH` = 청구액 − 첫 수금, `contractId` 붙음), `receiptIds`가 두 ID, 두 분개 `CASH` 합 = 청구액, `status === 'PAID'`, 계약 `COMPLETED`·`completedDay === D + days`. **로그(H17-5)**: 전제로 `deliveredDay < D`를 먼저 단언한다. D일부터 계획일 마감까지, 그 계약 ID를 부분 문자열로 담은 로그 줄은 D에 정확히 하나 ‘{계약} 대금 일부 {첫 수금} 수금(남은 {청구액 − 첫 수금})’, 계획일에 정확히 하나 ‘{계약} 대금 나머지 {청구액 − 첫 수금} 수금. 계약 종결’이고 그 사이 날에는 0줄이다(접두어로 거르지 않는다. 허브 실측 시드 2019: 계획일 18·지연일 8, D·계획일 각 1줄, 사이 0줄). 로그 전체의 숫자 검사는 ‘지연’ 행과 같이 하지 않는다. **(나) 반올림 전제(`partialBp`를 프로필에서 읽는지도 가린다).** 시작 프로필(`partialBp = 5000`)에서는 반올림이 홀수 청구액에서만 갈리는데, 첫 쌍(S = 140,000)의 클레임 X = ⌊(140000 × r + 5000) ÷ 10000⌋ = 14r은 r과 무관하게 짝수라 청구액 S − X도 늘 짝수다(클레임 없는 청구액도 짝수. 첫 쌍 구동기로는 200시드에서 홀수 청구액이 0건이다, 허브 실측). 그래서 프로필 사본으로 한다: `claims.byGood` 모든 행 `pClaimBp = 10000`, 모든 등급 `pOnTimeBp = pLateBp = 0`·`pPartialBp = 10000`, **`collections.partialBp = 2500`**, 나머지 그대로(사본 값은 시험 안에서 정하고 결과 보고에 적는다). 이 사본의 첫 쌍 구동기로 시드 2001~2200에서 ⌊(청구액 × 2500 + 5000) ÷ 10000⌋ ≠ ⌊청구액 × 2500 ÷ 10000⌋인 부분 청구서를 찾았음을 먼저 단언한다(청구액 mod 4 ∈ {2, 3}. 첫 쌍에서는 r이 홀수면 성립한다. 허브 실측 97/200). D 마감 뒤 그 첫 수금(`RECEIPT-RCPT-{청구서}-1`의 `CASH`)이 ⌊(청구액 × 2500 + 5000) ÷ 10000⌋이고, ⌊청구액 × 2500 ÷ 10000⌋과도 ⌊청구액 ÷ 2⌋과도 다름을, 나머지 수금이 청구액 − 첫 수금임을 단언한다(뺄셈이라 합이 늘 청구액이다, H17-3). floor 구현과 ½ 하드코딩 구현(변형 19)을 둘 다 가린다 |
| 미래 누설 없음 | 첫 쌍 구동기(그 쌍 하나만 수락, 그 밖의 명령은 원화 환전뿐)로 시드 2001~2200에서 1일 첫 쌍의 `collectionPlan` 방식이 정시·지연·부분이고 `claimFor`가 손상이 아닌 시드를 방식마다 처음 것으로 찾는다. 시드마다 그 시드의 설정을 쓴다. **전제를 먼저 단언한다**: 세 시드를 다 찾았고, 세 계약의 `sellOfferId`가 같으며, 세 청구서의 D가 같고, 지연·부분 계획의 `days ≥ 1`이다. 인도 뒤 `s.day < D`인 상태(시드마다 하나 이상 있음을 단언)마다 `receivableSchedule(s, cfg)`가 청구서 칸만으로 만든 `[{ invoiceId: inv.id, contractId: inv.contractId, currency: inv.currency, dueDay: inv.dueDay, outstandingMinor: inv.amountMinor, overdueDays: 0 }]`와 `toEqual`이다(칸을 더하거나 값을 바꾸면 실패한다. 키 집합 비교나 청구서끼리의 값 비교로 대신하지 않는다. 키 목록만 보면 변형 3이 살아남는다, 허브 시제품). 같은 `s.day`에서 세 행의 `invoiceId`·`contractId`를 뺀 객체가 서로 `toEqual`이다(손상 시드를 섞으면 `outstandingMinor`가 달라 맞는 구현도 실패하므로 손상 없는 시드로 한정한다). 같은 상태에서 `campaignSummary(s, cfg).openInvoices`의 그 행 `amountMinor === inv.amountMinor`다. 같은 상태에서 세 계약 모두 `contractRiskReport`의 `collection === 0`, `open_valuation === 0`이다(평가일 뒤 환율 차단은 TASK-0062 ‘미래 누설 없음’이 지킨다) |
| 미래 누설 없음(로그·상태) | 시드를 찾지 않고 프로필 사본으로 만든다(사본 값은 시험 안에서 정한다. 0063 ‘공지 순서 역전’과 같은 방식). 시드 2001, 첫 쌍 구동기, R3 설정, 같은 명령열로 수금 묶음만 다른 사본 다섯을 돌린다. L = 프로필 `lateMinDays`. (가) 모든 등급 정시 10000(지연·부분 0). (나) 모든 등급 지연 10000, 지연일 [L, L]. (다) (나)에서 지연일만 [L + 1, L + 1]. (라) 모든 등급 부분 10000, 지연일 [L, L]. (마) (라)에서 지연일만 [L + 1, L + 1]. ① **전제를 먼저 단언한다**: 그 계약이 직접 무역이고 인도일 < D이며 D + L + 1 ≤ `campaignDays`다. 그 청구서의 `RECEIPT-` 분개 날이 (가) D, (나) D + L, (다) D + L + 1, (라) D와 D + L, (마) D와 D + L + 1이다. ② 날마다 마감 뒤 `serializeSave(state)`(로그·청구서·`notices` 포함)와 읽기 함수(`receivableSchedule`, `campaignSummary`, `paymentDefaultStatus`, `fundsPosition`(KRW·USD), `cashReservations`, `upcomingPayments`, `contractReport`, `contractRiskReport`)의 JSON이 같은지 본다. (가)·(나)·(라)는 D − 1일 마감까지 같다. (나)·(다)와 (라)·(마)는 D + L − 1일 마감까지 같다. ③ 양성 대조: (가)·(나)는 D일 마감 뒤, (나)·(다)와 (라)·(마)는 D + L일 마감 뒤에 다르다(허브 실측: 결제일 로그에 계획일을 쓰는 누설은 (나)·(다)가 D + 1 상태에서, 인도 로그에 ‘지연 예정’을 쓰는 누설은 (가)·(나)가 인도 다음 날 상태에서 갈린다. 한 시드 세 실행 약 1.3초) |
| 미래 누설 없음(클레임) | 세 단계로 한다(H14-5, 검토 S1). ① 전제: ‘클레임’ (가)의 시드·계약(판매 견적의 `claimFor`가 손상)을 찾았음을 단언한다. ② 인도 전 상태(출항 전과 운송 중 각각 하나, `deliveredDay === null`)에서 `contractRiskReport`의 `claim === 0`이고 원장에 `CLAIM-`이 없다. 그 호출 직전 `mockClear()`, 호출 뒤 `claimFor` 0회. ③ 양성 대조: 인도 뒤 상태(결제일 전과 수금 뒤 각각)에서 `claim !== 0`이고 `claim === usdToKrwMinor(S − X, r) − usdToKrwMinor(S, r)`(r = `referenceRate(cfg, s.rng.seed, min(D, 평가일))`. 6단계는 판매 줄 금액만 바꾸고 날짜는 2단계 그대로라서 한 환율이다, H17-6) |
| 연체 미수 평가 | 두 청구서를 찾는다. 평가일은 그 계약 `contractRiskReport`의 `evaluationDay`, 환율은 `referenceRate(cfg, s.rng.seed, 날)`, 청구액은 `invoice.amountMinor`다. **(가) 지연 계획 연체 미수(받은 금액 0).** ‘지연’의 시드에서 D < `s.day` < 계획일인 상태 가운데 평가일 환율 ≠ D 환율인 첫 날을 고른다(없으면 다음 지연 시드). 조건은 공개 읽기 값으로 둔다: 그 청구서의 `RECEIPT-` 분개 0개(= `receivableSchedule` 행의 `outstandingMinor` = 청구액. 연체 상태에서는 `collectionPlan` 방식 `LATE`와 같다). 부분 계획 청구서는 D에 첫 수금이 있어 여기서 빠진다. **전제를 먼저 단언한다**: 받은 금액 = 0, 평가일 환율 ≠ D 환율(H15 O5), 아래 기대값 ≠ 0. 그때 `collection === usdToKrwMinor(남은 금액, 평가일 환율) − usdToKrwMinor(남은 금액, D 환율)`(설계 3.4 환산 꼴. 남은 금액은 시험 안에서 원장으로 계산한 값(용어)이고 이 청구서에서는 청구액이다), `open_valuation === 0`(H14-5, 검토 S4), `residual === 0`이다. **(나) 첫 수금만 들어온 부분 청구서(줄 꼴).** 시험 머리의 공유 실행(시드 2001부터, 날마다 상태)에서 D < 평가일이고 `RECEIPT-RCPT-{청구서}-1`만 있고 `-2`는 없는 청구서를 찾는다(아래 전제 전부를 찾기 조건에 넣는다. 시험 머리의 최상위 생성이 이 사건이 나올 때까지 시드를 잇는다. 이 행은 실행을 돌리지 않고 찾았는지만 단언한다). **전제를 먼저 단언한다**: 평가일 환율 ≠ D 환율, 0 < 첫 수금 < 청구액, `usdToKrwMinor(첫 수금, D 환율) + usdToKrwMinor(남은 금액, D 환율) ≠ usdToKrwMinor(청구액, D 환율)`(합친 꼴과 줄마다 꼴이 갈리는 경우. 허브 실측: 시드 1~200의 부분 연체 상태 1,895개 중 588개, 예: 청구액 142,300·D 환율 1,185). 그때 `collection === usdToKrwMinor(첫 수금, 첫 수금 분개 날 환율) + usdToKrwMinor(남은 금액, 평가일 환율) − usdToKrwMinor(청구액, D 환율)`, `open_valuation === 0`, `residual === 0`이다. (가)의 식을 부분 청구서에 쓰지 않는다. 첫 수금과 남은 금액을 따로 반올림하면 1원 어긋난다(H17-6. 설계 3.4·H15 O3의 ‘연체 미수’ 예시 식은 지연 청구서의 식이다) |
| 미래 누설 없음(호출 없음) | 위 통과형 첩자로 한다. 전제: 상태들에 지연·부분 계획인 직접 무역 청구서가 있다(‘지연’·‘부분’의 시드). 결제일 전(청구서 있음)·연체 중(지연 D + 1, 부분 첫 수금 뒤)·캠페인 끝(‘캠페인 끝’ ㉠의 끝 상태) 상태마다 **부르기 직전에 `mockClear()`**하고, 모든 계약의 `contractRiskReport`와 `receivableSchedule`·`campaignSummary`를 부른 뒤 `claimFor`·`collectionPlan` 호출 0회를 단언한다(H15 O4). 직접 무역 견적 쌍이 열린 상태에서도 `mockClear()` 뒤 `quotePreview`(그 `riskGrades`가 `null`이 아님을 먼저 단언)와 같은 견적의 `preview(…, { goodId, purchaseCurrency })`가 두 함수를 0회 부른다. 지연 계약(‘지연’ 행과 같은 시드·계약이라 `deliveredDay < D`다. 전제로 단언한다)의 결제일 전 날들(수락 다음 날부터 D − 1일까지, **인도일 마감 포함**)의 `commitDay`마다 부르기 직전 `mockClear()`하고, 그 계약 `sellOfferId`로 부른 `collectionPlan` 호출이 0회임을 단언한다(H17-4의 `dueDay ≤ s.day` 거름. `processDeliveries`에서 부르는 변형 22는 인도일 마감에서 여기 걸린다). **양성 대조**(첩자가 엔진 호출에 닿는지): 직접 무역 청구서의 D 당일 상태(`s.day === D`, 마감 전)에서 `mockClear()` 뒤 `commitDay`를 부르면 `collectionPlan` 호출이 1회 이상이고 그 인수가 `(cfg, s.rng.seed, 계약.sellOfferId, 계약.customerId)`다. 직접 무역 화물이 인도되는 날의 `commitDay` 동안 `claimFor` 호출도 1회 이상이고 인수가 `(cfg, s.rng.seed, 계약.sellOfferId, 계약.goodId)`다. 결제일 전 날의 `commitDay`는 양성 대조로 쓰지 않는다(맞는 구현도 0회다) |
| 원천 검사 | 작업 뒤 `src/engine/*.ts`(시험 제외)를 `import.meta.glob`의 raw로 읽는다(TASK-0063 ‘원천 검사’와 같은 꼴, 세션 A C9). 주석과 정의 줄(`export function claimFor(`·`export function collectionPlan(`)은 세지 않는다. `claimFor(` 호출은 `engine.ts`의 `processDeliveries` 몸통(`function processDeliveries(`부터 다음 함수 머리까지) 안에만 있고, `collectionPlan(` 호출은 `processCollections` 몸통 안에만 있다. 두 호출의 첫 두 인수는 `config`, `s.rng.seed`다(셋째·넷째 변수 이름은 고정하지 않는다). 두 몸통 모두 호출보다 앞에 종류 가드(`'DIRECT_TRADE'` 또는 `'FORWARDING'` 리터럴 비교)가 있다(가드의 행동은 ‘주선(R3)’이 지킨다). 두 정의는 `risk.ts`에만 있고, `risk.ts`의 다른 함수도 두 함수를 부르지 않는다(첩자는 내보낸 바인딩만 보므로 같은 모듈 도우미를 거친 누설은 이 검사로만 잡힌다). 흐름 이름 `CLAIM:`·`COLLECT:`는 `risk.ts`에만 있다. `reports.ts`·`readers.ts`는 `claimFor`·`collectionPlan`·`drawAt`·`drawUniform`을 import하지 않고 `./rng`를 import하지 않는다(`drawAt`으로 계획을 다시 계산하는 누설은 첩자가 못 본다) |
| 클레임 계약 보고서 | ‘클레임’ (가)의 완료 상태에서 `contractReport(s, c).contribution === S − X − COGS`(COGS = 그 계약 `COGS-` 분개의 `COST_OF_GOODS_SOLD` USD 줄 합, 시험 안에서 원장으로 계산)이고 `netRevenue === S − X`다. 같은 식이 R2의 완료 계약에서는 X = 0으로 성립한다(지금 값과 같다, 검토 n26). `campaignSummary(s, cfg).byCurrency`의 USD `contractContribution`이 그 합과 맞고, `byCurrency` 행과 `openInvoices` 행의 키 집합이 rules-2와 같다(새 칸 없음. 행 키는 rules-2 탐침 해시가 지키고 `m2a5-save.test.ts`는 최상위 키만 단언한다) |
| 프로필 누락 | 1일 첫 쌍의 품목을 `claims.byGood`에서 뺀 프로필 사본 P1과 그 판매 거래처를 `collections.byCounterparty`에서 뺀 사본 P2를 만든다(값은 설정에서 찾는다). R3 설정에서 `claimFor(cfg, seed, 키, 그 품목)`은 P1로 예외, `collectionPlan(cfg, seed, 키, 그 거래처)`는 P2로 예외다(추첨 전, H17-2·3). 같은 사본의 R2 설정(층 없음)에서는 예외 없이 `null`·`{ mode: 'ON_TIME', days: 0 }`이다. 엔진: P1의 R3 설정에서 첫 쌍 구동기로 진행하면 그 화물의 인도일 `commitDay`가 예외를 내고, P2에서는 D의 `commitDay`가 예외를 낸다(H14-10, 조용히 대체하지 않는다). 읽기: P1·P2에서 직접 무역 `quotePreview`가 예외를 내고, 같은 상태의 주선 `quotePreview`는 예외 없이 `riskGrades === null`이다(H17-7). 주선은 어느 사본에서도 `claimFor`·`collectionPlan`을 부르지 않는다(‘주선(R3)’) |
| 주선(R3) | R3 설정에서 직접 무역 없이 주선 계약 하나만 받아 `COMPLETED`까지 하루씩 진행한다(원화는 구동기가 환전한다). 주선은 두 가지를 각각 돌린다: 품목이 `claims.byGood`에 없는 주선은 `config.offers`에서, 있는 주선은 시장 견본 `s.operations.offers`에서 찾는다(자료 ID는 쓰지 않는다. 시장 주선은 준비가 길어 첫 편이면 출항하지 못하므로, 수락이 APPLIED이고 출항하는 편을 고른다). 둘 다 찾았고 완료했음을 먼저 단언한다. 두 주선의 화주가 `byCounterparty`에 없음도 단언한다(종류 가드가 없으면 예외로 드러나는 자료다). 수락 직후 `mockClear()`한다. 그 뒤 진행 내내 `claimFor`·`collectionPlan` 호출이 0회이고 원장에 `CLAIM-` 분개가 없다. 수금은 `RECEIPT-RCPT-{청구서}` 한 건으로 D에 전액이고 `OVERDUE`에 들어가지 않는다. 출항 전·운송 중·인도 뒤 미수·완료 상태에서 `contractRiskReport`는 예외 없이 `tariff === 0`, `surcharge === 0`, `claim === 0`, `collection === 0`, `residual === 0`이다 |
| 캠페인 끝 | **구성법(세션 A C6, 허브 사전 확인).** 늦은 공개일(71·78일)에만 수락하는 무명령 구동은 쓰지 않는다(허브 시제품: 시드 1~200에서 시도 2,400건이 모두 환전 거절). 1일 계약에 지연일을 늘린 프로필 사본도 쓰지 않는다(받지 못한 채권 때문에 82~88일에 경영 실패로 끝나고 평가일이 실패일이 된다). TASK-0062 ‘열린 계약’ (가)(나)는 청구서가 없으므로 쓰지 않는다. 이 파일 안의 **무역 구동기**로 만든다. 시드마다 설정을 따로 만든다. 1일부터 끝날 때까지 매일 다음 순서로 돈다. ① `openDay` 뒤, 그날 원화 부족분 `dailyKrwDue(s, cfg, s.day) − fundsPosition(s, cfg, 'KRW').available`이 0보다 크면 그 값을 `usdLotKrw(cfg, s)`로 나눠 올림한 묶음만큼 USD→KRW 환전한다. ② `openTradePairs(s, cfg)`의 짝마다 차례로 수락을 시도한다. 직원은 `employmentStatus === 'employed'`이고 `locationCityId === cfg.homeCityId`이며 `RUNNING` 업무가 없는 첫 직원, 편은 그 노선의 `listSailings(cfg, 노선, s.day + 1)[0]`이다. 직원이나 편이 없으면 건너뛴다. 수락 전에 원화 부족분(원화 매입액 + 그날 원화 지급분 − 원화 가용)이 있으면 같은 식으로 환전한다. 환전이나 수락이 거절되면 그 짝을 건너뛴다(`planState` 결과로 판단하고 거절을 단언하지 않는다). ③ `commitDay(s, cfg, [])`. 시드 2001부터 차례로 돌려 ㉠ 지연 청구서와 ㉡ 부분 청구서를 **따로** 찾는다. 각각 2200까지 안에서 찾고 찾았는지 단언한다(‘연체 미수 평가’ (나)·‘항등식’ ⑤a·‘채권 일정 정렬’의 사건이 아직 없으면 ㉠㉡을 찾은 뒤에도 최상위 생성이 실행을 이어 간다, 시험 머리). 한 시드에 둘이 함께 나오기는 요구하지 않는다(시제품에서 200개 중 3개). 찾는 조건: `operations.outcome === 'COMPLETED'`(실패한 실행은 평가일이 실패일이라 고르지 않는다. 시제품 시드 2066은 88일에 실패했고 ㉠ 청구서가 있다), 끝 상태에 `PAID`가 아닌 직접 무역 청구서가 있고, 그 청구서의 수금 분개(ID가 `RECEIPT-RCPT-{청구서}`이거나 `RECEIPT-RCPT-{청구서}-`로 시작)가 ㉠은 0개, ㉡은 1개다. 찾은 청구서마다 **전제를 먼저 단언한다**: `collectionPlan(cfg, seed, 계약.sellOfferId, 계약.customerId)`의 방식이 ㉠ `LATE`, ㉡ `PARTIAL`이고 D + `days` > `campaignDays`다(D는 늘 `campaignDays` 이하다). 그다음 단언한다. (a) `status === 'OVERDUE'`다. ㉠은 `receiptIds`가 비어 있고 ㉡은 [`RCPT-{청구서}-1`]이다. (b) 시험 안에서 원장으로 계산한 남은 금액(청구액 − 위 수금 분개들의 `CASH` 줄 합)이 `campaignSummary(s, cfg).openInvoices`의 그 청구서 `amountMinor`와 같고 `receivableSchedule(s, cfg)`의 그 청구서 `outstandingMinor`와도 같다. ㉡에서는 이 값이 0보다 크고 청구액보다 작음을 먼저 단언한다(남은 금액 대신 청구액을 내는 구현은 ㉡만 가린다). (c) `campaignSummary(s, cfg).byCurrency`의 USD `accountsReceivable`과 `summarize(s.ledger, 'USD').accountsReceivable`이 시험이 원장으로 계산한 USD 미수 청구서 남은 금액의 합과 같다. (d) 그 계약의 `contractRiskReport`가 `open === true`, `evaluationDay === cfg.campaignDays`, `components.residual === 0`이다. 시제품(R3 시작 프로필, 짝마다 받는 구동기): COMPLETED이면서 미수 직접 무역 청구서가 남은 시드 49개(지연 36, 부분 16), 경영 실패 6개. 첫 짝만 받는 구동기로도 ㉠ 18개·㉡ 9개가 나온다. ‘미래 누설 없음(호출 없음)’의 캠페인 끝 상태와 ‘연체 미수 평가’ (나)·‘항등식’ ⑤a·⑦도 이 실행(끝 상태와 날마다 상태)을 쓴다. 시험 머리대로 모듈 최상위에서 즉시 한 번 만들어 공유한다. 구성과 전제 단언에서 부른 `collectionPlan` 기록은 호출 수 단언 전에 `mockClear`로 지운다. 탐색은 최상위에서 미리 돌므로 `it` timeout 대상이 아니다(시험 머리) |
| 불변식 | 같은 상태의 고치지 않은 저장을 `deserializeSave(serializeSave(s), { config, dataVersion, rulesVersion })`가 받아들임을 먼저 단언한다. 그다음 사본마다 거부하고(`SaveError`), **오류 문장에 그 불변식의 문장이 들어 있음을 `toThrow(문장)`으로 단언한다**(`checkInvariants`는 문제를 모두 모아 한 메시지로 던지고 `deserializeSave`가 그대로 감싼다. 다른 검사의 문장이 함께 나와도 통과하는 빈 시험을 이 단언이 막는다). 4절 네 검사의 문장은 서로 다르고 청구서 ID 또는 분개 ID를 담는다(구현이 정하고 결과 보고에 적는다). **시험이 이것도 단언한다**: 사본 ①~④마다 `toThrow`에 쓴 그 검사의 문장에 그 청구서 ID(①·②) 또는 분개 ID(③·④)가 들어 있고, 사본 ①~③의 오류 문장에는 다른 새 검사 셋의 문장이 들어 있지 않다(②는 `PAID`라 ①을 지나고, ③은 주선 수수료 > 1이라 ④를 지나며, ①·② 사본의 계약은 손상이 없어 `CLAIM-`이 없다. 그래서 ①~③의 ‘없음’은 구현과 무관하게 만들 수 있다. 기존 검사의 문장이 함께 나오는 것은 허용한다). ④는 4절 ①의 문장이 반드시 함께 나오므로 이 ‘없음’ 단언에서 ①을 빼고, ④ 자신의 문장이 있음과 ②·③의 문장이 없음만 단언한다. 사본 번호는 4절 검사 번호와 같다(① 합 초과, ② `PAID` 모자람, ③ 주선 `CLAIM-`, ④ 클레임 > 판매액). ①~③은 목표 검사 하나만 깨지게 만든다. 원장 균형, 매출채권 = 미수 청구서 남은 금액 합, 통화별 순자산 항등식, 현금 ≥ 0, `ledger.postedIds` 일치는 그대로 둔다. ① **부분 수금 합 초과**: ‘부분’ (가)의 첫 수금만 받은 상태(`OVERDUE`, `receiptIds` = [`RCPT-{청구서}-1`])에서 분개 `RECEIPT-RCPT-{청구서}-1`의 `CASH` 줄을 청구액 + 1로, `ACCOUNTS_RECEIVABLE` 줄을 −(청구액 + 1)로 바꾼다(합 > 청구액). 합이 청구액 이하(같음 포함)이면 맞는 구현도 받아들인다. `PAID` 청구서의 수금을 늘린 사본은 ‘`PAID`면 합 = 청구액’과 매출채권 검사가 함께 걸려 변형 4를 가리지 못하고, 청구액을 줄인 사본은 매출채권 검사가 함께 걸리므로 둘 다 쓰지 않는다(허브 시제품). ② **`PAID`인데 합이 모자람**: ‘부분’ (가)의 계획일 마감 뒤 상태에서 다 받은 부분 청구서의 `amountMinor`를 1 늘린 사본(매출채권 검사는 `PAID`를 거르므로 걸리지 않는다, 허브 실측). ③ **주선 계약에 `CLAIM-`**: ‘주선(R3)’의 완료 상태에서 그 주선 계약 c에 분개 `CLAIM-{c}`(날 = 상태의 날, 통화 = c의 통화, `contractId` = c, 줄 `SALES_ALLOWANCE` +1 / `CASH` −1)를 넣고 `ledger.postedIds`에도 넣은 사본. 매출채권을 건드리지 않아 매출채권 검사가 걸리지 않는다(매출 에누리 / 매출채권 꼴은 ‘직접 무역만’ 검사가 없어도 매출채권 검사로 거부된다). ④ **클레임 > 늦은 감액 뒤 판매액**: ‘클레임’ (가)의 결제일 전(수금 없음) 상태에서 `CLAIM-` 두 줄을 S + 1로, 그 청구서 `amountMinor`를 −1로 바꾼 사본(매출채권 −1 = 청구액 −1 − 받은 금액 0이라 매출채권 검사와 순자산 항등식은 그대로 맞는다). 이 사본은 받은 금액 0 > 청구액 −1이라 4절 ①의 문장도 반드시 함께 낸다(허브 실측 ‘받은 금액(0)이 청구액(-1)을 넘습니다’). 그래서 ④는 자신의 문장이 있음과 ②·③의 문장이 없음을 단언하고, ①의 문장이 함께 있는 것은 허용한다(‘없음’ 단언에서 ①을 뺀다). 변형 4는 ①, ‘`CLAIM-`은 직접 무역만 검사를 뺌’은 ③, ‘클레임 ≤ 판매액 검사를 뺌’은 ④로 잡고, 변형 12(`summarize`의 profit 누락)는 ‘클레임’ (가)의 순자산 항등식 단언과 인도일 마감이 잡는다 |
| 항등식 | **다음 계약 상태마다** 시험 안에서 `realized`와 `expected`를 따로 계산한다(TASK-0063 ‘항등식’의 `independent`·`identity`와 같은 꼴, 세션 A C1·C5·C6): ① 정시로 끝난 계약(클레임 없음. ‘미래 누설 없음’의 정시 시드 첫 쌍 완료 상태), ② 정시 수금으로 끝난 클레임 계약(‘클레임’ (가)), ③ 지연 수금으로 끝난 계약, ④ 부분 수금으로 끝난 계약, ⑤ 열린 연체 중 계약, 두 상태로 나눈다. ⑤a 부분 첫 수금 뒤 D + 1 상태(환율 같음): 시험 머리의 공유 실행(날마다 상태)에서 다음을 **모두 찾기 조건으로** 넣어 부분 청구서(`RECEIPT-RCPT-{청구서}-1`만 있음)의 D + 1 상태를 찾는다(찾았는지 단언. 시험 머리의 최상위 생성이 이 사건이 나올 때까지 시드를 잇는다. 이 행은 찾았는지만 단언한다): ρ = `referenceRate(D)` = `referenceRate(D + 1)`, 그리고 `usdToKrwMinor(첫 수금, ρ) + usdToKrwMinor(남은 금액, ρ) ≠ usdToKrwMinor(청구액, ρ)`(줄마다 환산과 합친 환산이 갈리는 상태. 짝수 청구액(첫 수금 = 남은 금액)에서는 m = `(첫 수금 × ρ) mod 100`이 [25, 50)이면 −1원, [50, 75)이면 +1원, 그 밖은 0이라 식의 전제는 m ∈ [25, 75)와 같다. `mod 100 = 50`은 +1원의 한 경우일 뿐이다. 홀수 청구액은 두 줄이 달라 따로 따져야 하므로 찾기 조건은 mod가 아니라 식이다. 허브 실측(`5bee326` 시제품, 시드 2001~2200): 이 전제 상태 84개, 차이 +1원 68·−1원 16, 첫 적중 시드 2005 49일 INV-CT011. 옛 예: 69,850 + 69,850 @ 1,285는 줄마다 1,795,146, 합치면 1,795,145). ⑤b 지연·부분 각각, D < `s.day` < 계획일인 상태 가운데 평가일 환율 ≠ D 환율인 첫 날(‘연체 미수 평가’ (가)와 같은 선택. 지연은 ‘지연’의 시드, 부분은 ‘부분’ (가)의 시드에서 고르고 없으면 다음 시드. 첫 편 인도의 D는 이 시나리오에서 주 경계가 아니라 D + 1이 같은 환율 주이고(둘째 편 인도는 D = 14처럼 경계일 수 있다) ⑤a·⑤b의 환율 조건은 모두 찾기 조건이다. 허브 실측: 2021(지연 11일) 15~20일 1292 ≠ 1307, 2019(부분 8일) 15~17일 1346 ≠ 1318), ⑥ 출항 전 취소 계약 둘: ⑥a TASK-0063 ‘항등식’의 취소 구성을 R3로(7단계 줄이 매입·운임 선지급·환급 셋뿐), ⑥b 편 놓침 → 재예약 → 출항 전 취소(준비 배정 없이 plan 수락 → 첫 편 출항 뒤 예약 해제 → `BOOK_SAILING` 다음 편 → 그 편 출항 전 `CANCEL_CONTRACT`. TASK-0062-R1 시험 ‘편 놓침 뒤 재예약…’의 구성을 취소로 끝낸 꼴. 전제: 그 계약의 `FREIGHT-PREPAY-` 분개 둘과 `FREIGHT-RELEASE-` 분개 둘이 있다. 7단계 줄이 넷 이상이라 색인 3이 환급·재예약 줄이다), ⑦ 캠페인 끝 열린 계약(‘캠페인 끝’ ㉠·㉡), ⑧ 주선 계약(완료와 인도 뒤 미수), ⑨ 운송 중 직접 무역 계약(‘미래 누설 없음(클레임)’ ②의 운송 중 상태, R3, 청구서 없음). 시험 `realized`: 그 계약 `contractId`가 붙은 모든 분개의 `CASH` 줄과 그 계약 의무를 갚은 `SETTLE-` 분개의 `CASH` 줄(`PURCHASE-`·`FREIGHT-PREPAY-`·`FREIGHT-RELEASE-`·`CANCEL-COMP-`·`DUTY-`·`SURCHARGE-`·`RECEIPT-RCPT-{청구서}`·`RECEIPT-RCPT-{청구서}-1`·`-2`). 수금 분개는 ID 접두 `RECEIPT-`로 가려(0063 `independent` 그대로, 그 계약 `contractId` 집합 안에서. 분개 ID 집합을 따로 더하지 않는다 — 두 집합을 겹쳐 세면 맞는 구현과 어긋난다, 허브 실측) 줄마다 그 분개 날 환율로 바꾼다. `CLAIM-`은 `CASH` 줄이 없어 세지 않는다. USD 비용 줄은 같은 환율끼리 합친 뒤 한 번 바꾼다(0063 환산 꼴). 열린 계약은 남은 흐름을 더한다: 받을 채권(청구액 − 받은 금액)은 평가일 환율로 **따로** 바꾸고(수금·채권 줄을 합치면 맞는 구현과 1원 어긋난다. 허브 시제품: 같은 환율 묶음 84개 중 32개), 운송 중·출항 전 판매, 내지 않은 운임, 도착 전 관세 예상(0063 일정 오라클 `duty(T = max(예정 도착일, 평가일), K = 평가일)`), 미지급 의무는 평가일 환율의 비용 줄로 같은 환율의 현금 비용 줄과 합친다. 단언: 이 값 = 보고서 `realized`, 시험 `expected` = 보고서 `expected`, `시험의 realized − 시험의 expected === 1~9단계 합`, `residual === 0`. **전제를 찾기 조건으로 넣고 먼저 단언한다**(변형 5): ③④에서 마지막 수금 분개(③ `RECEIPT-RCPT-{청구서}`, ④ `-2`) 날의 참고 환율 ≠ D의 참고 환율이고 `referenceRate(acceptedDay)` ≠ D의 참고 환율이다. ⑤b에서 평가일 참고 환율 ≠ D의 참고 환율이다. ③④⑤b에서 `components.collection !== 0`이다. ⑤a는 같은 환율이 전제라, ⑦은 변형 5의 전제에 넣지 않는다. ㉠㉡의 D가 78일 이상이면 `referenceRate`가 `publish.lastDay`(78일) 뒤 환율을 고정하므로 평가일 90일과 같은 환율이다(허브 실측, 무역 구동기 시드 2001~2200: ㉠㉡의 D는 80·82·83·87·89·90뿐. 시드 2003은 80~90일 모두 1370, 2018은 1297). 64일 공개 견적을 65·66일에 받아 72일 편으로 늦게 인도한 D = 76·77 청구서(10주차라 환율이 다를 수 있다)도 10건 있었으나 ㉠㉡은 아니었다. 어느 경우든 ⑦은 줄 꼴 식으로 단언하므로 환율 같음·다름 어느 쪽도 전제 단언으로 두지 않는다. 정시 계약과 두 환율이 같은 지연·부분 계약은 변형 5를 가리지 못한다(허브 시제품 R3 시드 1~200: 정시 2,079건과 같은 환율 지연·부분 27건 통과, 다른 환율 656건 실패. 5~6일 지연은 같은 환율 주에 머물 수 있고 78일 뒤는 환율이 고정이다). ③④에서는 `collection === Σ(수금 분개마다 usdToKrwMinor(금액, 그 분개 날 환율)) − usdToKrwMinor(청구액, D 환율)`도 단언한다(`fx`와 `collection` 사이로 기간을 옮기는 꼴은 `residual`로 잡히지 않는다). ③④(완료 계약)는 `open === false`다(남은 흐름이 없다. 부분 수금 분개에 `contractId`가 없는 변형 34는 보고서가 받은 금액을 0으로 읽어 남은 몫이 평가일 줄로 생기므로 `open`이 참이 된다. 독립 `realized`도 `contractId`로 거르므로 보고서와 같게 나오고, 잡는 것은 `open === false`와 ‘부분’의 `contractId` 단언이다. 평가일 환율 전제는 필요 없다). ⑤a는 `residual === 0`, 독립 `realized` = 보고서 `realized`, `collection === usdToKrwMinor(첫 수금, D 환율) + usdToKrwMinor(남은 금액, D 환율) − usdToKrwMinor(청구액, D 환율)`이다(전제대로 ±1원이고 0이 아니다. 5절 ‘부분 청구서의 1원’. 합쳐서 한 번 바꾸는 변형 40과 남은 금액만 옮긴 변형 41은 여기서 0을 내어 `residual ≠ 0`이다). ⑤b는 `residual === 0`과 `collection !== 0`이다(변형 5·42의 짝). ⑦은 환율 부등식·`collection !== 0` 전제 없이 독립 `realized` = 보고서 `realized`, `시험의 realized − 시험의 expected === 1~9단계 합`, `residual === 0`, `open === true`를 단언하고, `collection`은 줄 꼴 식으로 단언한다: ㉠ `usdToKrwMinor(청구액, 평가일 환율) − usdToKrwMinor(청구액, D 환율)`, ㉡ `usdToKrwMinor(첫 수금, D 환율) + usdToKrwMinor(남은 금액, 평가일 환율) − usdToKrwMinor(청구액, D 환율)`(두 환율이 같으면 ㉠은 0, ㉡은 0 또는 1원이다). **단계 연결(클레임, ②)**: 먼저 X > 0과 `referenceRate(deliveredDay)` ≠ D 환율을 단언한다(‘클레임’ (가)의 찾기 조건에 정시 수금과 함께 들어 있다). 그 계약에서 `claim === usdToKrwMinor(S − X, r) − usdToKrwMinor(S, r)`(r = D 환율), `cancel === 0`, `collection === 0`(정시 전액 수금은 클레임이 있어도 정확히 0)이다. 7단계를 5단계 줄에서 만들고 6단계 값과 비교하는 결함과 클레임을 인도일 환율의 새 줄로 넣는 결함은 `residual`이 0이라 이 단언으로만 잡힌다. **취소(⑥a·⑥b)**: `claim === 0`, `collection === 0`, `residual === 0`(세션 A C5. ⑥b는 7단계 줄이 넷 이상이라 8단계 거름을 뺀 변형 44가 색인 3의 환급·재예약 줄을 바꿔 `collection ≠ 0`이 된다. ⑥a는 줄이 셋뿐이라 그 변형이 원래 코드와 같다). ⑧은 `claim === 0`, `collection === 0`, `residual === 0`이다. ⑨는 `claim === 0`, `collection === 0`, `residual === 0`이고 독립 `realized`(남은 흐름: 운송 중 판매, 도착 전 관세 예상, 미지급)가 보고서와 같다 |
| 등급별 확률 | 엔진을 돌리지 않고 순수 함수 `collectionPlan`으로 센다(세션 A C10. `src/engine/sim/**`·d03 금지). 시드 2001~2200 × 키 셋(`K1`·`K2`·`K3`) = 등급마다 600회를, 등급마다 그 등급 거래처 하나(프로필 배정에서 찾는다)로 부른다. (가) 시작 프로필: `LATE` 횟수가 A < B < C이고 `PARTIAL` 횟수도 A < B < C다. 순서만이 아니라 여유도 단언한다: 이웃 등급의 차이가 `LATE`·`PARTIAL` 두 방식 모두 각각 10 이상이다(600회 기준 기대값은 `LATE` A 60·B 120·C 180으로 차이 60, `PARTIAL` A 30·B 60·C 90으로 차이 30. 허브 시제품 키 하나(200회) 기준 LATE A 31·B 46·C 62. 문턱 10은 두 방식 모두에 둔다). (나) 극단 사본(사본 값은 시험 안에서 정한다): 세 등급의 `pLateBp`를 0·5000·10000(`pPartialBp` = 0, 나머지 `pOnTimeBp`)으로 두면 `LATE` 횟수가 정확히 0·그 사이·600이다. (다) 순서를 바꾼 사본(예: `pLateBp` A 3000·B 1000·C 2000, 등급마다 합 10000 유지): `LATE` 횟수 순서가 사본의 `pLateBp` 순서와 같다(거래처 등급을 무시하고 한 등급 확률을 쓰는 변형을 가린다). 통계 단언이 아니라 결정적 값이다: 식이 H17로 고정되어 같은 시드·키에서 늘 같은 수가 나온다 |
| R3 변환·riskGrades 키 존재 | `withRiskLevel(…, 'R3', p).operations.risk.layers`가 `['FX', 'TARIFF', 'SURCHARGE', 'CLAIM', 'COLLECTION']`이고, `layers`를 뺀 나머지 설정이 R2와 `toEqual`이다(H17-8). `riskGrades` 키: rules-3 위험 설정이 있는 직접 무역 `quotePreview`에는 R1·R2·R3 모두 키가 있다(공개 정보, 층과 무관, H17-7). 주선은 세 단계 모두 `null`이다. rules-2 설정(변환 없는 시나리오)의 직접 무역·주선 `quotePreview`에는 `riskGrades` 키가 없다(`'riskGrades' in result === false`. `m2a5-readers.test.ts`의 `toEqual` 골든이 함께 지킨다). R3 직접 무역 미리보기의 `surchargeMaxBp`·`referenceEstimate`는 R2와 같은 식이다 |
| 결정성·저장 | 같은 입력 같은 결과: ‘부분’ (가)의 시드로 첫 쌍 구동기를 두 번 끝까지 돌려 `serializeSave`가 바이트로 같다. 부분 수금 중간 상태(첫 수금 뒤 `OVERDUE`, `receiptIds` 하나)의 저장 왕복: `deserializeSave(serializeSave(s), { config, dataVersion, rulesVersion })` 뒤 다시 직렬화한 값이 같고, 복원한 상태와 원래 상태를 각각 캠페인 끝까지 진행한 결과가 같다(설정을 직접 넘긴다). 클레임 계약의 인도 뒤 상태(`SALES_ALLOWANCE` 분개 있음)도 왕복이 같다(`SAVE_ENUMS.account`가 `ACCOUNT_KIND`를 따른다). 캠페인 끝 ㉠의 끝 상태(`OVERDUE` 청구서 있음)도 왕복이 같다. 어느 상태에서도 `state.rng.cursors`에 `CLAIM:`·`COLLECT:` 키가 없다(설계 2절 3) |
| 채권 일정 정렬 | 시험 머리의 공유 실행(날마다 상태)에서 `status !== 'PAID'`인 직접 무역 청구서가 둘 이상이고 **(`dueDay`, `invoiceId`) 오름차순 목록이 `invoiceId`만의 오름차순 목록과 다른** 첫 상태를 찾는다(찾았는지 단언. 둘째 조건이 없으면 `invoiceId`만으로 정렬한 변형 52의 둘째 꼴이 살아남는다. 허브 실측: 시드 2001 22일 INV-CT006 D 24·INV-CT005 D 26. 공유 실행의 다섯째 사건이다, 시험 머리). 그 상태의 사본에서 `s.invoices` 배열 순서를 뒤집는다(내용은 그대로. 정렬을 뺀 첫째 꼴용). 원래 상태와 사본 모두에서 `receivableSchedule(s, cfg).map((r) => [r.invoiceId, r.dueDay])`가 시험 안 정렬식((`dueDay`, `invoiceId`) 오름차순, `invoiceId`는 문자열 비교)으로 만든 목록과 `toEqual`이고, `campaignSummary(s, cfg).openInvoices`의 (`invoiceId`, `amountMinor`) 열이 `receivableSchedule`의 (`invoiceId`, `outstandingMinor`) 열과 같은 순서·같은 값이다(두 함수를 서로만 견주면 둘 다 정렬을 뺀 변형이 살아남으므로 시험 안 정렬식이 기준이다) |

## 변형 시험

결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 적는다. 다만 그 전에 시험의 전제(시드·청구서·상태 선택)가 빠진 것인지 확인하고, 빠졌으면 시험을 고친다(위 시험 머리). 두 갈래로 돌리는 변형(6a·6b, 종류 가드)은 갈래마다 따로 적고, 둘 다 잡혀야 ‘잡힘’이다. 첩자 시험으로는 잡히지 않고 원천 검사로만 잡히는 변형은 그렇게 적는다. 추첨 식 변형(13~18)은 `drawAt`이 상태가 없어 엔진 출력의 분포는 같으므로, 일정 오라클과 흐름 유일성 말고는 가리지 못한다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 클레임을 늦은 감액(`priceReductionMinor`)에 더함 | 클레임(`priceReductionMinor`는 늦은 감액만, 청구 금액 식) |
| 2 | 부분 첫 수금에서 청구서를 `PAID`로 바꿈 | 부분(D+1 상태 `OVERDUE`, `outstandingMinor` = 청구액 − 첫 수금) |
| 3 | `receivableSchedule`이 결제일 전에 지연 계획을 드러냄: 결제일 전 상태(`s.day < dueDay`)에서 지연·부분 청구서 행의 `dueDay`를 마지막 계획 수금일로 내거나, 부분 청구서의 `outstandingMinor`를 첫 수금 뒤 금액으로 냄. 계획은 `collectionPlan`을 부르지 않고 `drawAt`으로 다시 계산한다(첩자 시험은 지나간다) | 미래 누설 없음(행 `toEqual`. 키 집합 비교로는 잡히지 않는다) |
| 4 | 불변식에서 ‘받은 금액 ≤ 청구액’ 검사만 뺌(‘`PAID`이면 합 = 청구액’ 검사는 둔다) | 불변식 ① |
| 5 | `collection`과 `fx`가 청구 결제일 → 실제 수금일 구간을 두 번 셈: 2단계가 수금 줄을 실제 수금일(미수는 평가일) 환율로 평가하고, 8단계 `collection`은 앞 단계 줄 목록과의 차이 대신 ‘청구 결제일 → 수금일 차이’를 따로 더함. 2단계만 옮긴 꼴(8단계가 0이 됨)도 같이 돌린다 | 항등식(전제: 두 환율 부등식이 선 ③④⑤b의 지연·부분 계약. 두 번 센 꼴은 `residual ≠ 0`, 2단계만 옮긴 꼴은 `collection` 정확식으로 잡힌다. 정시 계약, 같은 환율 주의 지연·부분 계약, ⑤a, 78일 뒤 환율이 고정된 ⑦로는 드러나지 않는다) |
| 6 | 추첨 키를 계약 ID(`contract.id`)로 되돌림. 6a는 `processDeliveries`의 `claimFor` 호출만, 6b는 `processCollections`의 `collectionPlan` 호출만 바꾼다. 두 갈래를 따로 돌린다 | 공통 난수(6a는 시드 Sc, 6b는 시드 Sp. 각 실행의 관찰값 = X 키 기대값 단언에서 잡힌다. 두 실행끼리만 견주면 전제 시드의 절반 넘게 살아남는다) |
| 7 | 손상률을 층과 무관하게 한 범위(`[minor.minBp, major.maxBp]`) 균등으로 뽑음 | 일정 오라클(클레임·수금), 클레임(층 범위: 모든 손상 추첨, 층별 5건 이상 전제) |
| 8 | `contractRiskReport`가 인도 전 계약에 `claimFor` 결과를 넣음 | 미래 누설 없음(클레임)(② `claim = 0`) |
| 9 | `contractRiskReport`가 `collectionPlan`을 불러 수금일을 정함 | 미래 누설 없음(호출 없음)(H15 O4), 원천 검사 |
| 10 | 평가일까지 들어오지 않은 수금 줄을 9단계 `open_valuation`에 넣음(8단계는 청구 결제일 환율 그대로) | 연체 미수 평가(받은 금액 0인 지연 청구서. `collection` 식 ≠ 0, `open_valuation = 0`) |
| 11 | `contractReport`의 `netRevenue`가 `SALES_ALLOWANCE`를 빠뜨림 | 클레임 계약 보고서 |
| 12 | `summarize`의 profit에서 `SALES_ALLOWANCE`를 빠뜨림 | 클레임(클레임이 난 날 마감의 통화별 순자산 항등식, H15 O2) |
| 13 | 수금 구간 순서를 [지연, 부분, 정시]로 바꿈(또는 [정시, 부분, 지연]. 문턱도 맞춰 바꿈) | 일정 오라클(클레임·수금)(전제: 세 방식이 모두 나옴. 등급별 확률은 횟수 분포만 보므로 가리지 못한다) |
| 14 | 층 선택을 뒤집음(`U < minor.weightBp`이면 `MAJOR`), 또는 손상 판정을 위쪽 꼬리(`U ≥ 10000 − pClaimBp`)로 바꿈 | 일정 오라클(클레임·수금)(전제: `MINOR`·`MAJOR`가 모두 나옴. 클레임(층 범위)은 돌려준 층에 맞춰 보므로 가리지 못한다) |
| 15 | 정수 균등식을 `a + ⌊u × (b − a)⌋`로 바꿈(상한이 나오지 않음) | 일정 오라클(클레임·수금)(전제: `days = lateMaxDays`가 나온 호출이 있음. 시작 프로필 지연일 [5, 15]에서 이 변형은 15를 내지 못한다. `rateBp = 층.maxBp`는 층 범위가 401·1501값이라 전제로 두지 않는다. 층 범위 시험은 통과한다) |
| 16 | `CLAIM:`·`COLLECT:` 흐름의 커서를 1로 바꿈(`drawAt(seed, 흐름, 1)`), 또는 상태 커서 `drawUniform(s.rng, …)`로 뽑아 돌려받은 `rng`를 `s.rng`에 되씀(커서만 진행. 되쓰지 않는 꼴은 `drawAt(seed, 흐름, 0)`과 같아 변형이 아니다. TASK-0062 변형 3과 같은 꼴) | 일정 오라클(클레임·수금), 흐름 유일성(클레임·수금)(커서 0), 결정성·저장(`state.rng.cursors`에 `CLAIM:`·`COLLECT:` 키 없음) |
| 17 | 손상이 아닐 때도 `…:tier`·`…:rate`를 뽑음 | 흐름 유일성(클레임·수금)(기록된 흐름이 결과가 정하는 집합과 다름. 값은 같으므로 일정 오라클로는 잡히지 않는다) |
| 18 | `ON_TIME`일 때도 `…:days`를 뽑거나 `days ≠ 0`을 돌려줌 | 흐름 유일성(클레임·수금)(뽑는 꼴), 일정 오라클(클레임·수금)(`days ≠ 0` 꼴) |
| 19 | 부분 첫 수금을 floor(`⌊청구액 × partialBp ÷ 10000⌋`)로 냄, 또는 `partialBp`를 읽지 않고 ½로 냄 | 부분 (나)(전제: `partialBp = 2500` 사본에서 half-up과 floor가 갈리는 청구액(mod 4 ∈ {2, 3})의 부분 청구서를 찾았음을 단언. 시작 프로필 `partialBp = 5000`에서는 첫 쌍 청구액이 늘 짝수라 두 꼴 다 가리지 못한다) |
| 20 | 거래처 등급을 무시하고 한 등급(예: A)의 확률로 뽑음 | 일정 오라클(클레임·수금)(`byCounterparty`의 모든 거래처), 등급별 확률 |
| 21 | `claimFor`·`collectionPlan` 안의 층 검사를 빼 `CLAIM`·`COLLECTION` 층이 없는 설정(R2)에서도 표를 읽고 추첨함(엔진 호출 자리의 층 가드만 뺀 꼴은 순수 함수가 막아 원래 코드와 같으므로 이 변형이 아니다) | 일정 오라클(클레임·수금)(R2 분기: R2 설정에서 같은 인수로 `claimFor`가 `null`, `collectionPlan`이 `{ mode: 'ON_TIME', days: 0 }`, `byGood`·`byCounterparty`를 비운 사본의 R2 설정에서 예외 없음. 200시드 × 키 × 품목·거래처라 확실한 짝이다). 보조: 새 층이 꺼진 R2(`CLAIM-` 없음, 정시 전액. 시드 하나의 첫 쌍이라 손상·비정시가 안 나오면 약 80%에서 살아남는다). 엔진 쪽에 층 가드를 따로 두지 않았다면 위험 설정이 없는 rules-2에서는 예외가 나므로 골든 검사기와 R2 분개 덤프 `cmp`도 깨진다(지켜야 할 것) |
| 22 | `processDeliveries`에서 `collectionPlan`을 부름(계획을 로그·상태에 쓰지 않더라도) | 원천 검사(`collectionPlan(` 호출은 `processCollections` 몸통에만), 미래 누설 없음(호출 없음)(결제일 전 날들의 `commitDay`에서 0회. 인도일 마감이 그 날들에 들어가므로 첩자로도 잡힌다) |
| 23 | 인도 로그에 수금 방식(‘지연 예정’ 등)이나 계획 수금일을 씀(‘현금은 {계획 수금일}일 수금 예정’) | 미래 누설 없음(로그·상태) (가)·(나), 지연(인도일 로그 줄 = 청구 결제일) |
| 24 | 결제일 로그나 부분 첫 수금 로그에 계획 수금일·지연일·나머지 수금일을 씀, 또는 결제일과 계획일 사이 날에 예고 줄을 씀 | 미래 누설 없음(로그·상태) (나)·(다), (라)·(마)(날짜·일수를 담은 꼴); 지연·부분(로그 문장 고정, D와 계획일 사이 날에 계약 ID를 담은 줄 0. 접두어와 무관한 예고 줄 꼴(예: ‘{계약}: 고객 송금 지연 중’)을 돌려야 한다 — (나)·(다) 비교로는 두 사본이 같은 날 같은 줄을 써서 잡히지 않는다) |
| 25 | `campaignSummary`·`quotePreview`(또는 `preview`)가 `collectionPlan`·`claimFor`를 불러 수금 계획일이나 손상을 냄 | 미래 누설 없음(호출 없음)(`campaignSummary`·`quotePreview` 포함, `riskGrades ≠ null` 전제), 원천 검사 |
| 26 | `risk.ts`에 `collectionPlan`(또는 `claimFor`)을 안에서 부르는 내보낸 도우미를 두고 `receivableSchedule`·`contractRiskReport`가 그 도우미로 계획을 읽음 | 원천 검사(같은 모듈 호출은 `vi.mock`에 잡히지 않는다. 첩자 시험은 못 잡는다고 결과 보고에 적는다) |
| 27 | `processDeliveries`·`processCollections`의 종류 가드를 뺌(주선에도 `claimFor`·`collectionPlan`을 부름). 둘 다 뺀 꼴과 하나씩만 뺀 꼴을 각각 돌린다 | 주선(R3)(프로필에 없는 주선 품목·화주는 예외로, 있는 주선은 호출 0회·`CLAIM-` 없음·정시 전액으로 잡힌다) |
| 28 | `CLAIM-` 분개를 청구서 생성 뒤에 내고 청구서 `amountMinor`를 `netSale` 그대로 둠(청구액이 줄지 않음) | 클레임(청구 금액 = 늦은 감액 뒤 판매액 − 클레임. 클레임이 난 날 마감에서 매출채권 불변식도 걸린다) |
| 29 | 클레임 금액을 늦은 감액 전 판매액(`saleAmountMinor`)에 곱하거나 floor로 냄 | 클레임(전제: `priceReductionMinor > 0`인 클레임 계약, 또는 (늦은 감액 뒤 판매액 × `rateBp`) mod 10000 ≥ 5000인 계약을 찾았음을 단언. 1일 정적 판매액은 10000의 배수라 정시 계약만으로는 가리지 못한다) |
| 30 | 부분 첫 수금에서 계약을 `COMPLETED`·`completedDay`로 바꿈 | 부분(D+1 상태의 계약 `status !== 'COMPLETED'`, 마지막 수금에서만 종결) |
| 31 | 부분 둘째 수금을 `applyReceipt`로 냄(청구 전액을 다시 분개) | 부분(합 = 청구액. 받은 금액 > 청구액이라 그날 마감의 불변식 ①도 걸린다) |
| 32 | `OVERDUE` 전이를 `d > dueDay`로 하거나 D+1 마감에서 함(D+1 상태가 `OVERDUE`가 아님), 또는 전이를 수금 처리 앞에서 하면서 `PAID`를 전이에서만 정함(마지막 수금 날 마감 뒤에도 `OVERDUE`) | 지연·부분(D+1 상태 `status = OVERDUE`·`overdueDays = 1`, 계획일 마감 뒤 `PAID`) |
| 33 | `overdueDays`를 `s.day − dueDay + 1`로 냄 | 지연·부분(D+1 상태 `overdueDays = 1`) |
| 34 | 부분 수금 분개 `-1`·`-2`에 `contractId`를 달지 않음 | 항등식(④ 완료 부분 계약의 `open === false`: 보고서가 받은 금액을 0으로 읽어 남은 몫이 평가일 줄로 생겨 `open`이 참이 된다. 독립 `realized`는 `contractId`로 거르므로 보고서와 같고 `residual`은 0인 채 남는다), 부분(`-1`·`-2` 분개의 `contractId` 붙음 단언) |
| 35 | 캠페인 끝 마감에서 계획일이 남은 미수를 강제로 받거나 `PAID`로 바꿈 | 캠페인 끝(지연·부분 청구서 모두 `PAID`가 아님, 매출채권 = 남은 금액 합) |
| 36 | `campaignSummary.openInvoices.amountMinor`를 청구액 그대로 냄 | 캠페인 끝(부분 청구서: 남은 금액 ≠ 청구액 전제) |
| 37 | `invariants.ts` 매출채권 검사를 옛 식(미수 청구서 청구액 합)으로 둠 | 부분(첫 수금 날 마감에서 `checkInvariants` 예외: 매출채권 = 청구액 − 첫 수금 ≠ 청구액), 캠페인 끝(매출채권 = 남은 금액 합) |
| 38 | 7단계 줄을 5단계 줄(`lateFlows`)에서 만들고 6단계 값과 비교함(클레임이 `cancel`·`collection`으로 옮겨 가고 `residual`은 0), 또는 6단계 줄에서 만들되 5단계 값(`afterLate`)과 비교함(`residual = −claim`) | 항등식(단계 연결: 정시 수금으로 끝난 클레임 계약의 `cancel === 0`·`collection === 0`·`claim` 정확식. 둘째 꼴은 `residual`로도 잡힌다) |
| 39 | 클레임을 `CLAIM-` 분개 날 환율의 새 줄로 넣고 8단계에서 그 줄도 수금 줄로 바꿈 | 항등식(단계 연결: 정시 클레임 계약의 `collection === 0`·`claim` 정확식. 전제 `referenceRate(인도일) ≠ referenceRate(청구 결제일)`) |
| 40 | 8단계가 수금 줄·남은 채권 줄을 비용 줄(`cost = true`)로 넣어 같은 환율끼리 합친 뒤 한 번 바꿈 | 항등식(⑤a: 같은 환율 D + 1의 부분 상태, 전제는 ⑤a의 식 `usdToKrwMinor(첫 수금, ρ) + usdToKrwMinor(남은, ρ) ≠ usdToKrwMinor(청구액, ρ)`. 합치면 ±1원 어긋나 `residual ≠ 0`이고 줄 꼴 `collection` 정확식도 어긋난다. 전제가 없는 상태에서는 값이 같으므로 전제를 먼저 본다. 같은 환율 ρ의 USD 비용 줄과 합쳐져 반올림이 메워지는 상태도 있다(허브 실측 시드 2006 INV-CT019. 변형 40은 그런 상태에서 {−1, 0, +1} 가운데 하나를 내어 맞는 값과 같을 수 있다). 첫 적중에서 변형 40이 살아남으면 공유 실행의 다음 ⑤a 전제 상태로 넘어가 다시 돌리고(그 계약 비용 분개 날의 환율이 ρ가 아닌 상태를 고른다) 결과 보고에 적는다. 허브 실측 첫 적중 2005에서는 잡힌다) |
| 41 | 8단계를 남은 금액만 옮긴 식(`usdToKrwMinor(남은, 평가일 환율) − usdToKrwMinor(남은, 청구 결제일 환율)`)으로 셈(받은 줄과 나뉜 줄의 반올림 차를 빠뜨림) | 연체 미수 평가 (나)(줄 꼴 식, 합친 꼴 ≠ 줄마다 꼴 전제), 항등식(⑤a의 `residual === 0`·줄 꼴 `collection`(이 변형은 같은 환율에서 0을 낸다). ④ 완료 부분 계약의 `collection` 정확식은 두 수금 줄의 반올림이 갈릴 때만 잡으므로 확실한 짝이 아니다) |
| 42 | 평가일까지 받지 못한 몫을 청구 결제일 환율로 둠(9단계에도 넣지 않음) | 연체 미수 평가 (가)(`collection` 식 ≠ 0인데 0이 나온다), 항등식(⑤b 연체 미수 열린 계약의 `residual ≠ 0`. ⑤a·⑦은 환율이 같아 가리지 못한다) |
| 43 | `residual`을 상수 0으로 고정하고 8단계 수금 줄 날짜를 청구 결제일로 되돌림, 또는 `collection`을 ‘realized − expected − 앞 단계 합’으로 메우고 6단계 `claim`을 0으로 둠 | 항등식(첫 꼴은 독립 `realized`: `시험의 realized − 시험의 expected === 1~9단계 합`. 둘째 꼴은 단계 연결: 정시 클레임 계약의 `claim` 정확식. 둘 다 `residual === 0`만으로는 잡히지 않는다) |
| 44 | 취소 계약에서도 8단계가 색인 3의 줄(환급·보상 줄)을 수금 줄로 바꿈(취소 아님·청구서 있음 거름 없음) | 항등식(⑥b 편 놓침 → 재예약 → 출항 전 취소 계약의 `collection === 0`·`residual === 0`. ⑥a 0063 꼴 취소 계약은 7단계 줄이 매입·운임 선지급·환급 셋뿐이라(`customerCancellationCompensationMinor`가 0이라 보상 줄도 없다) 색인 3이 없어 원래 코드와 같다. 결과 보고에 ⑥a·⑥b를 따로 적는다) |
| 45 | `quotePreview`가 주선 견적에도 `riskGrades`를 냄, 또는 rules-2 결과에 `riskGrades: null` 키를 넣음 | 공개 등급(주선 `null`), R3 변환·riskGrades 키 존재(rules-2 `'riskGrades' in result === false`), `m2a5-readers.test.ts`의 `quotePreview` `toEqual`(뒤 꼴) |
| 46 | 프로필에 없는 품목·거래처를 예외 대신 기본값(예: 등급 A, 확률 0)으로 대체함 | 프로필 누락 |
| 47 | 불변식 ①~④가 같은 문장을 내거나 문장에 청구서·분개 ID가 없음 | 불변식(사본마다 그 검사의 고정 문장을 `toThrow`로 단언하고, 그 문장에 청구서 ID 또는 분개 ID가 들어 있음과, 사본 ①~③의 오류에 다른 새 검사 셋의 문장이 없음을 함께 단언한다. ④는 4절 ①의 문장이 반드시 함께 나오므로 ‘없음’ 단언에서 ①을 빼고 ②·③ 없음만 본다. 문장이 겹치거나 ID가 없으면 사본이 어느 검사에 걸렸는지 가려지지 않는다) |
| 48 | 불변식에서 ‘`PAID`이면 합 = 청구액’ 검사를 뺌 | 불변식 ② |
| 49 | 불변식에서 ‘`CLAIM-` 분개는 직접 무역 계약에만’ 검사를 뺌 | 불변식 ③ |
| 50 | 불변식에서 ‘클레임 ≤ 늦은 감액 뒤 판매액’ 검사를 뺌 | 불변식 ④ |
| 51 | `OVERDUE` 전이(또는 연체 중인 날 마감)에 계약·청구서 ID를 담은 줄을 씀(2절 ‘전이는 로그를 내지 않는다’ 위반. 접두어와 무관한 문장으로 돌린다) | 지연·부분(D와 계획일 사이 날에 계약 ID를 담은 줄 0, D일 줄은 그 한 문장뿐) |
| 52 | `receivableSchedule`의 정렬을 빼거나(`s.invoices` 순서 그대로) `invoiceId`만으로 정렬함 | 채권 일정 정렬(뒤집은 사본에서 시험 안 정렬식과 `toEqual`) |
| 53 | 6단계가 늦은 감액 뒤 판매액 S가 아니라 감액 전 `saleAmountMinor`에서 X를 뺌(8단계가 판매 줄을 통째로 바꾸므로 `residual`은 0) | 클레임 (나)(완료 상태 `claim` 정확식. (가)·‘항등식’ ②는 `priceReductionMinor = 0`이라 가리지 못한다) |
| 54 | 클레임 로그를 `CLAIM-` 분개 자리에서 써 인도 로그보다 앞에 찍음(1절 ‘인도 로그 바로 뒤’ 위반) | 클레임 (가)(인도 로그 다음 줄 단언) |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `ledger.ts`(계정 추가와 `summarize`의 profit 항), `readers.ts`, `reports.ts`, `risk.ts`, `types.ts`, `invariants.ts`, `operations-invariants.ts`
- `src/engine/save-shape.ts`(열거 값 추가만, 필요할 때. 4절 ‘저장 왕복’대로 보통은 고칠 것이 없다. 고치게 되면 결과 보고에 이유를 적는다)
- `tools/validate_data.py`(클레임·수금 검사 보강만, 필요할 때), `tools/test_validate_data.py`(새 반례 시험 추가만, 검토 n40·허브 결정 H14-10)
- 새 `src/engine/m2a5-risk-credit.test.ts`
- `docs/ai/tasks/results/TASK-0064.md`, `MANIFEST.json`

## 손대지 않을 파일

- TASK-0062와 같다(`src/ui/**`, `src/engine/sim/**`, 시나리오·품목 자료, 기존 시험의 단언 등).
- **`data/market_rules.json`, `schemas/market_rules.schema.json`, `src/content/scenario.ts`.** 시작 프로필은 TASK-0062가 넣었고, 설계 6절(동결 범위, 허브 결정 H14-8)과 값·키 순서까지 같다(허브 확인). 스키마·`loadRiskProfile`·`RiskProfile` 타입은 `claims`·`collections` 칸을 이미 모두 담고, `RiskLayer`에도 `CLAIM`·`COLLECTION`이 이미 있다. 이 지시서의 어느 항목도 이것들을 바꿀 필요가 없다. 시험에 다른 값이 필요하면 프로필 사본(설정 객체)으로 만든다. 값을 바꾸면 기존 시험(‘프로필 다섯 묶음’은 원자료에서 기대값을 만든다)과 검사기(`MANIFEST.json` 해시를 갱신하면 통과)가 잡지 못해 동결이 조용히 깨진다. 자료·스키마·로더를 고쳐야 할 것 같으면 고치지 말고 멈추고 보고한다(예: `claims`·`collections`에 `status` 표지를 더하는 것도 하지 않는다). TASK-0063 개정 3f와 같다.
- 골든 파일·검사기: `tests/golden/rules2-d03.tsv`, `tests/golden/rules1-run.tsv`, `tools/check_rules2_golden.mjs`, `tools/check_rules2_golden.test.mjs`, `tools/rules2_golden_lib.mjs`, `tools/rules2_golden_entry.ts`, `tools/ai/review_checks.sh`.
- `src/engine/m2a5-risk-fx.test.ts`, `src/engine/m2a5-risk-cost.test.ts`. 특히 ‘관세 호출 인수’는 그대로 통과해야 한다. 깨지면 시험이 아니라 `reports.ts`를 고친다.
- `src/engine/operations.ts`(`paymentDefaultStatus`의 `nextReceipt`는 지금 규칙 유지, 허브 결정 H13·H17-7), `progress.ts`(`contractProgress`), `reservations.ts`, `catalog.ts`. 그 밖에 ‘고칠 수 있는 파일’에 없는 파일은 모두 손대지 않는다.
- 화면이 `SALES_ALLOWANCE` 같은 새 계정이나 `OVERDUE`를 모르면 결산 표가 깨질 수 있다. 새 규칙 시나리오는 화면에 없으므로 이번에는 그대로 두고, 깨질 곳을 결과 보고 ‘범위 밖 발견’에 적는다.

## 지켜야 할 것

- **골든 진단 절차(허브 통일 문장, TASK-0062a).**
  - 작업 전에 `node tools/check_rules2_golden.mjs`가 0인지 확인하고, 0이 아니면 고치지 말고 멈춘다.
  - `--dump <밖>/before`를 만든다. 깨지면 `--dump <밖>/after`를 만들어 파일별로 diff한다.
  - 이 검사기는 rules-2 105회(실행·상태·탐침 해시)와 규칙 1 400회(실행·상태 해시), 두 묶음의 저장 왕복을 지킨다. 400회 `run`의 `cmp`는 허브가 검수 때 따로 돌린다.
- **R2 분개 덤프(검토 40번, TASK-0063과 같은 절차).** 작업을 시작하기 전, 손대지 않은 작업 트리(BASE)에서 다음을 **저장소 밖** 고정 경로(`<밖>/r2-collect-before.json`)에 저장한다. 작업 뒤 같은 명령으로 다시 만들어 `cmp` 0을 확인하고, 결과 보고에 sha256을 적는다.
  - 저장소 밖의 일회용 스크립트로 R2 설정을 시드 3개(2001 이상, 지시서 수준 시드 규칙)·고정 명령열로 돌린 캠페인 끝 상태의 `JSON.parse(serializeSave(state)).state`에서 `meta`를 뺀 것(분개·청구서·로그·`notices`·`rng` 포함. `tools/rules2_golden_lib.mjs`의 `withoutMeta(state)`와 같다. 저장 포장(`format`·`engineVersion` 등)은 넣지 않는다)이다. 새 상태 칸이 없으므로(아래) R2 설정에서는 전문이 바이트로 같아야 하고, 로그 문장·순서와 `rng.cursors`의 변화까지 한 번에 드러난다. `CLAIM-` 분개가 없음도 함께 적는다. 스크립트는 엔진 공개 함수만 쓴다(세션 A C4). `src/engine/sim/**`은 부르지 않는다.
  - 덤프는 R2 설정에서 새 층이 꺼진 경로(`applyReceipt` 정시 전액, 클레임 없음)가 바이트 단위로 같음을 보인다. rules-2 경로는 위 골든 검사기가 지킨다.
- **TASK-0062a 골든 검사기 종료 코드 0**(따로 확인할 항목). 골든 파일·검사기·`review_checks.sh`(위 ‘손대지 않을 파일’ 목록)는 손대지 않고 `--write`를 쓰지 않는다. 완료 때 다음이 모두 빈 값이다.
  - `git diff --stat <BASE> -- tests/golden tools/check_rules2_golden.mjs tools/check_rules2_golden.test.mjs tools/rules2_golden_lib.mjs tools/rules2_golden_entry.ts tools/ai/review_checks.sh`
  - 같은 경로의 `git status --porcelain --untracked-files=all -- …`
  - `git diff --stat <BASE> -- data/market_rules.json schemas/market_rules.schema.json src/content/scenario.ts`(시작 프로필 동결, H14-8). TASK-0062 시험 ‘프로필 다섯 묶음’은 로더를 원자료와 견주므로 원자료 값이 바뀌어도 통과한다. 그래서 이 확인이 동결을 지키는 유일한 검사다.
- `tools/ai/review_checks.sh --check <BASE>` 16종 실패 0. P0-M2A5 골든값 불변, 옛 저장(저장 형식 6 그대로. 새 상태 칸이 꼭 필요해지면 더하지 말고 멈추고 보고한다, 설계 8절), TASK-0062 시험 36개와 TASK-0063 시험 파일이 고치지 않은 채 통과, 변형 표 전부(행 수는 변형 표의 최종 행 수를 따른다).
- **첫 화면 gzip 전후(세션 A C2).** BASE와 작업 뒤 각각 **깨끗한 트리**에서 잰다. 측정할 커밋을 `git archive`로 저장소 밖 빈 디렉터리에 풀고, 거기서 `npm run build` 다음 `node tools/check_bundle_size.mjs dist`의 첫 화면 줄을 읽는다(작업 트리의 미추적 파일·덤프가 섞이지 않게. 작업 뒤 값은 결과 커밋을 같은 방법으로 잰다). 자료 청크 증가는 따로 적는다(이번에는 0이어야 한다).
  - **코드 증가분(첫 화면 증가 − 자료 몫)이 +2,500 B를 넘으면 멈추고 보고한다.**
  - 지금 첫 화면은 127,968 B, 여유 약 12.0 KB다(허브 실측, TASK-0063+R1+R2 병합 개발 트리). 허브 0064 시제품은 +1,255 B였다.
- H6 닫힌 목록 밖에서는 두 통화를 더하지 않는다(이 지시서가 채우는 `contractRiskReport`의 원화 칸은 목록 ③이다, 검토 n6). 분석값에 채권이 들어가는지는 경로 5 실행기 지시서의 시험이다.
- 새 추첨은 0절의 순수 함수 식뿐이다(H17-1). `state.rng.cursors`에 `CLAIM:`·`COLLECT:` 키가 생기지 않는다(시험 ‘결정성·저장’).
- `BookSummary`·`campaignSummary`에 새 칸을 두지 않는다(1절). `openInvoices.amountMinor`는 값만 남은 금액으로 바꾼다(3절).

## 결과 보고에 넣을 것

- BASE(`git rev-parse HEAD`)와 작업 시작·끝 커밋.
- 시드 몇 개(2001 이상)의 클레임·수금 계획 표(순수 함수 출력): 판매 견적 ID, 품목·파손 등급, `claimFor`(손상 여부·층·`rateBp`), 판매 거래처·신용등급, `collectionPlan`(`mode`·`days`).
- 시험 구동기로 만든 계약의 `components` 표(값을 고치지 않고 적기만): 정시 완료 계약, 클레임 계약, 지연 완료 계약, 부분 계약(첫 수금 뒤 미수 상태와 다 받은 뒤), 연체 미수 열린 계약(⑤a 같은 환율 D + 1 상태와 ⑤b 다른 환율 상태), 출항 전 취소 계약(⑥a 셋 줄 꼴과 ⑥b 재예약 꼴), 주선 계약, 운송 중 계약(⑨), 캠페인 끝 미수 계약마다 `evaluationDay`·`expected`·`realized`·`open`과 열 칸 전부(`residual` 포함).
- 찾기 시험이 고른 첫 시드와 사본 값: ‘클레임’ (가)(나)(다), ‘지연’, ‘부분’ (가)(나. `partialBp = 2500` 사본), ‘공통 난수’ Sc·Sp, ‘미래 누설 없음’ 세 시드, ‘캠페인 끝’ ㉠·㉡, ‘항등식’ ⑤a·⑤b, ‘연체 미수 평가’ (가)(나), ‘채권 일정 정렬’.
- 공유 무역 구동기 실행이 쓴 시드 범위와 다섯 사건(㉠·㉡·‘연체 미수 평가’ (나)·‘항등식’ ⑤a·‘채권 일정 정렬’)의 (시드, 청구서 ID, D, D 환율), 한 실행의 시간.
- 노출 수: 시험 구동기 실행(시드 2001부터 찾는 데 쓴 시드까지)에서 직접 무역 계약 가운데 클레임(작은 층·큰 층 따로)·지연·부분이 난 계약 수와 비율, 계획일이 캠페인 끝을 넘긴 청구서 수. 첫 적중 시드의 값은 진단 C·L1의 추정값이 아님을 밝힌다. 90일 정책 실행은 경로 5에서 한다.
- 미수의 비용이 환율 노출과 원화 압박뿐이고 이자가 없다는 한계(설계 5.2).
- 4절 불변식 네 검사의 고정 문장(구현이 정한 그대로)과 2절 로그 고정 문장이 들어간 자리.
- 첫 화면 gzip 전후(깨끗한 트리, 자료 청크 따로, 코드 증가분), 시험 수(새 파일과 전체), R2 분개 덤프의 `cmp`와 sha256, 골든 `--dump` 파일별 diff(깨졌을 때), `review_checks.sh --check` 결과.
- 변형 표: 변형마다 실패한 시험과 단언. 두 갈래로 돌리는 변형(예: 추첨 키 6a·6b, 종류 가드)은 갈래마다 따로 적는다. 첩자 시험으로는 잡히지 않고 원천 검사로만 잡힌 변형은 그렇게 적는다. 결과가 원래 코드와 같은 변형은 전제를 먼저 확인해 시험을 고친 기록과, 그래도 같을 때의 이유를 적는다.
- 범위 밖 발견: `paymentDefaultStatus.recovery.nextReceipt`의 한계(연체 청구서가 있으면 지난 결제일을 내고, 부분 수금 뒤에는 금액도 청구 전액이다. `operations.ts`는 고치지 않는다, H13)와 `src/ui/money-alerts.ts`의 다음 수금 문구, `progress.ts` `contractProgress`의 미수 분기, `src/ui/schedule.ts`의 `RCV:` 행, `src/ui/main.ts`의 `nextReceipt`, 결산 화면이 `SALES_ALLOWANCE`·`OVERDUE`를 모르는 곳. 그 밖에 작업 중 본 것.
- 질문.

> **아래 처리표들은 다섯 문서 공용 기록이다.** 0064에서 할 일은 위 본문(구현 지시·시험·변형·파일 목록·지켜야 할 것)뿐이다. 다른 문서 몫 항목(예: 0062 3절의 `dutyFor`, 0063의 관세 일정·부대비, 판정표의 손잡이)과 본문과 다른 옛 문구(예: 64건 표 m14의 ‘진단용 d03 출력 저장과 compare’는 개정 3에서 n14의 골든 `--dump` 전후 diff로 대체됨. 본문과 처리표가 다르면 본문과 허브 결정 H17이 우선이다)는 따르지 않는다.

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

개정 3c를 허브가 독립 복제본(ef7374f + 0063 시제품 proto3e)에 시제품으로 만들어 세 관점(골든 무해·시험 실현성·모호성)으로 확인했다. 발견마다 반박 검증을 한 번 더 거쳤다. 발견 46건(골든 15, 시험 12, 모호성 19)과 세션 A 사전 점검 D1~D6(코드 기준 270de2c)을 같은 뿌리끼리 묶어 F1~F22로 처리했다. 판정 칸은 ‘처음 심각도 / 검증 결과 → 최종 심각도’다. 바탕은 허브 결정 H17(`HUB-DECISIONS-2026-10-16.md`)이고, 제안된 고침(VFIX)과 H17이 다르면 H17을 따랐다.

- 시제품 실측: 골든 검사기 종료 0(rules-2 105회, rules-1 400회, 속도 기준과 같음), 시험 51개 파일 1,400개 통과(0062 ‘관세 호출 인수’·원천 검사, `withRiskLevel` R1·R2 변환 시험 포함. 바탕이 TASK-0063-R1·R2 병합 전(ef7374f + 0063 시제품)이라 R1·R2 지시서의 시험은 들어 있지 않다. BASE(0063+R1+R2 병합 커밋)에서의 통과는 Codex 결과 보고로 본다), 첫 화면 gzip +1,255 B(자료 청크 변화 없음), R3 시드 2001~2030의 431계약에서 예외 0·`residual` 0. 종류 가드가 있으면 rules-1·rules-2·UI·주선 경로에 예외가 없다.
- 기각은 없다. 제안된 고침과 다르게 정한 곳은 각 행 ‘고친 것’에 적었다.

| # | 발견(판정) | 고친 것 | 반영한 곳 |
|---|---|---|---|
| F1 | golden#1(blocker / 부분 → major), tests#7(major / 확인 → major), ambiguity#1(major / 확인 → major), ambiguity#10 (가), 세션 A D1·D2: 추첨 식·커서·비교 방향·층 구간·수금 구간 순서·지연일 범위·반환 꼴·부분 첫 수금 반올림이 없어 측정값이 구현에 묶이고(구간 순서에 따라 수금 방식 3,130/16,000회가 다름) 오라클·흐름 유일성 시험을 둘 수 없다 | 허브 결정 H17-1~3으로 고정해 0절을 새로 둠: `u = drawAt(seed, 흐름, 0)`, `U[a, b] = a + ⌊u × (b − a + 1)⌋`, 흐름 다섯 개, 층 검사 → 행 찾기 → 손상 → 층(작은 층이 앞 구간) → 손상률, 수금은 정시 → 지연 → 부분, 정시는 `days = 0`이고 `…:days`를, 손상이 아니면 `…:tier`·`…:rate`를 뽑지 않음, 반환 `null \| { tier, rateBp }`·`{ mode, days }`, 첫 수금 `applyBasisPoints(청구액, partialBp)`·나머지는 뺄셈. 시험 ‘일정 오라클(클레임·수금)’(다섯 결과와 `days` 양끝 전제, 층 없는 설정은 표를 읽지 않음)·‘흐름 유일성(클레임·수금)’(키마다 한 번, 결과가 정하는 흐름만)·‘부분’ (나)(`partialBp = 2500` 사본, 재확인 반영). 제안과 다른 곳: golden#1 VFIX의 ‘`s.rng`를 읽거나 바꾸지 않는다’는 시드를 `s.rng.seed`에서 가져오므로 ‘`s.rng.cursors`’로 좁혔다. tests#7 FIX의 ‘지연일은 방식과 무관하게 늘 뽑는다’와 VFIX의 `lateDays` 이름은 H17-3의 정시 미추첨·`days`로. ambiguity#1 VFIX의 `{ hit, tier, rateBp }` 꼴은 H17-2의 `null \| { tier, rateBp }`로. ambiguity#1의 ‘반올림 변형은 넣지 않는다’는 따르지 않았다(`partialBp = 2500` 사본에서 반올림이 갈리는 청구액을 찾을 수 있어 변형 19를 둔다. 첫 쌍은 `pClaimBp = 10000` 사본에서도 청구액이 늘 짝수라 재확인에서 사본 값을 바꿨다). 엔진 이름은 camelCase로 적었다(ambiguity#1 V) | 0절, 시험 ‘일정 오라클(클레임·수금)’·‘흐름 유일성(클레임·수금)’·‘부분’ (나), 변형 13~19, H17-1~3 |
| F2 | golden#5(major / 확인 → major), tests#6(major / 확인 → major), ambiguity#3(major / 확인 → major), ambiguity#2(major / 부분 → minor): ‘`residual`은 늘 0’이 상수 0을 부르고(C1), 독립 `realized` 재계산·취소 계약 6·8단계 0(C5)·단계 연결(7단계가 `lateFlows`에서 출발하면 클레임이 되돌려짐: 클레임 계약-상태 166개 모두 `residual ≠ 0` 또는 정확식으로만 잡힘)·수금 줄 줄마다 환산(합치면 84묶음 중 32개가 1원 어긋남)·변형 5의 환율 전제(같은 환율 지연·부분 27건은 통과)가 없다. 6단계 줄의 날짜와 8단계 구성이 정해지지 않았다 | H17-6으로 고정: 6단계는 5단계 줄을 복사해 판매 줄(색인 3) 금액만, 날짜는 2단계 그대로. 7단계는 6단계 줄에서 만들고 6단계 값과 비교. 8단계는 취소 아님·청구서 있음일 때만 판매 줄을 `RECEIPT-` `CASH` 줄(그 분개 날)과 평가일 남은 줄로 바꾸고 줄마다 환산. 취소 계약 6·8단계 0. `residual`은 남은 차이. 시험 ‘항등식’을 여덟 상태(①~⑧)로 넓히고 독립 `realized`·`expected`(0063 `independent`·`identity` 복사), 변형 5 전제(늦은 수금 분개 날 환율 ≠ D 환율, `referenceRate(acceptedDay)` ≠ D 환율, `collection !== 0`), `collection` 정확식, 단계 연결(② `claim` 정확식·`cancel === 0`·`collection === 0`), 취소 ⑥·주선 ⑧. 제안과 다른 곳: golden#5 FIX의 ‘판매 줄을 색인으로 찾지 않는다’는 쓰지 않았다(지금 코드와 시제품이 색인 3을 쓴다. 대신 8단계 거름으로 취소 계약을 보호). tests#6 VFIX (1)의 ‘바꾼 차이만 센다’ 문구는 줄 목록 꼴로(1원 합침 문제). ambiguity#3 (나)의 ‘보고서 `expected`’는 ‘시험의 `expected`’로. golden#5 VFIX 항등식의 ‘열린 운송 중 계약 (가)(나)’는 청구서가 없어 캠페인 끝 ㉠·㉡으로(F10. 재확인에서 R3 운송 중 계약 ⑨와 5절의 TASK-0062 ‘열린 계약’ 근거 문장을 더했다) | 5절, 시험 ‘항등식’, 변형 5·34·38·39·40·43·44, H17-6 |
| F3 | golden#2(major / 확인 → major), tests#8(major / 확인 → major), ambiguity#4(major / 확인 → major): ‘연체 미수 평가’의 남은 금액 식은 받은 금액 0인 지연 청구서에서만 맞고, 첫 수금 뒤 부분 청구서에서는 맞는 구현과 1원 어긋난다(부분 연체 상태 1,895개 중 588개). 식에 맞추면 `residual`이 1원이 되어 ‘항등식’과 부딪친다 | (가)는 받은 금액 0인 지연 청구서로 한정(공개 읽기 값 `RECEIPT-` 0개로 고른다), 전제(두 환율 다름, 기대값 ≠ 0), `residual === 0`. (나) 첫 수금만 들어온 부분 청구서는 줄 꼴 식으로 따로 단언하고 전제로 ‘합친 꼴 ≠ 줄마다 꼴’을 찾는다(캠페인 끝 실행). 5절에 ‘부분 청구서의 1원’(결함이 아니라 환산 꼴의 결과, 설계 3.4·H15 O3 예시는 지연 청구서의 식). 제안과 다른 곳: tests#8·ambiguity#4 VFIX는 부분 식을 설명으로만 두었으나 golden#2 VFIX ①의 (나) 단언을 택했다(변형 41을 ‘항등식’과 함께 잡는다). DESIGN.md 3.4 예시 한정은 허브 몫(설계 개정 3j) | 5절 ‘부분 청구서의 1원’, 시험 ‘연체 미수 평가’ (가)(나), 변형 10·41·42, H17-6 |
| F4 | golden#3(major / 확인 → major), tests#3(major / 확인 → major), ambiguity#5(major / 확인 → major): ‘공통 난수’가 두 실행끼리만 견주고 전제가 없어 변형 6이 시드 2001~2200의 136개에서 살아남는다. 무엇을 관측할지 없고(`claimFor(sellOfferId)`로 견주면 늘 같다), 주선과 같은 직원이면 B의 수락이 거절된다 | 관찰값 세 가지(`CLAIM-` 유무·금액, `receiptIds` 꼴, 수금일 − D)를 X 키의 순수 함수 기대값과 견주고, 이어서 두 실행끼리 견준다. 시드 둘(Sc·Sp)을 계약 ID 키 값이 다른 조건으로 따로 찾는다(클레임 16·수금 53시드). 주선은 다른 직원, 시드마다 설정, 계획일 ≤ `campaignDays`, Sc에서 S ≥ 10000. 변형 6을 6a·6b 두 갈래로. 제안과 다른 곳: tests#3 VFIX의 한 시드·(i)(ii) 조건은 6a·6b 가운데 하나가 살아남으므로(golden#3 V (다)) 시드 둘로. ambiguity#5의 ‘(i) X 기대값이 클레임 0·정시가 아님’은 변형을 잡는 데 필요 없고 적중이 드물어(약 4시드) 뺐다. 시드 범위는 H17-8의 2001~2200 | 시험 ‘공통 난수’, 변형 6 |
| F5 | golden#4(major / 확인 → major), tests#4(major / 확인 → major), ambiguity#6(major / 부분 → major): ‘불변식’ 사본 꼴이 없어 `PAID` 사본·청구액 축소 사본으로는 변형 4가 살아남고(다른 검사가 함께 거부), ②·③은 문장 단언 없이 빈 시험이 될 수 있다. ④ 사본이 없다 | 4절에 네 검사의 자리(`operationsProblems`)·서로 다른 고정 문장·ID 포함 규칙·변형 4의 범위(‘받은 금액 ≤ 청구액’ 검사만, 덧붙인 검사 금지). 시험 ‘불변식’: 원본 수락 대조, 사본마다 `toThrow(문장)`, ① `OVERDUE` 중간 상태의 `-1` 분개를 청구액 + 1로, ② 다 받은 부분 청구서 `amountMinor` + 1, ③ 주선 `CLAIM-`(`SALES_ALLOWANCE` / `CASH`, `postedIds` 포함), ④ 결제일 전 클레임 계약의 `CLAIM-` S + 1. 변형 47~50. 제안과 다른 곳: ambiguity#6 VFIX ③의 매출 에누리 / 매출채권 꼴은 매출채권 검사가 함께 걸려(tests#4 V) `CASH` 꼴로. tests#4 VFIX ②의 `-2`·`SALE-` 맞춤 꼴 대신 ambiguity#6의 `amountMinor` + 1(허브 실측 ‘PAID 문장만’). ambiguity#6 FIX의 ‘그 문장만 있음을 단언’은 그 검증대로 쓰지 않았다(‘미수 = 남은 금액 > 0’ 구현에서 만들 수 없다). 재확인에서 새 검사 셋 한정의 ‘없음’ 단언(사본 ①~③, ④는 ①을 뺌)과 ID 포함 단언을 넣었다(기존 검사 문장은 허용하므로 그 구현에서도 만들 수 있다) | 4절, 시험 ‘불변식’, 변형 4·47·48·49·50 |
| F6 | golden#7(major / 확인 → major), tests#5(major / 확인 → major), ambiguity#7(major / 부분 → major): ‘미래 누설 없음’의 ‘같은 꼴’이 키 집합 비교로 읽혀 변형 3(`dueDay`에 계획일, `drawAt` 재계산)이 살아남고(M3a·b·c·e 모두 통과), 손상 시드를 섞으면 맞는 구현이 실패한다 | 청구서 칸만으로 만든 행과 `toEqual`(키 집합 포함), 손상 없는 세 시드(같은 `sellOfferId`·같은 D·`days ≥ 1`), 그 쌍 하나만 받는 구동기, `s.day < D` 상태가 있음을 단언, `openInvoices` 금액, `collection === 0`·`open_valuation === 0`. 3절에 ‘`drawAt` 등으로 다시 계산하지 않는다’. 제안과 다른 곳: ambiguity#7 (나)의 `[5, 5]`/`[15, 15]` 사본 대조는 tests#10 VFIX의 다섯 사본(F7)으로 대체했고, (가)의 ‘받을 채권이 같은 규칙으로 평가된다’는 시험으로 확인할 수 없어 `collection = 0`·`open_valuation = 0`으로(golden#7 V). ambiguity#7의 :79(클레임) 덧붙임은 그 검증 ⑦대로 넣지 않았다(② `claim === 0` 정확값이 변형 8을 잡는다) | 3절, 시험 ‘미래 누설 없음’, 변형 3 |
| F7 | golden#6(major / 확인 → major), tests#10(major / 확인 → major), ambiguity#8(major / 확인 → major): `collectionPlan`을 부르는 자리가 두 문장에서 다르고(‘청구서를 낼 때’ 대 `processCollections`), 수금 로그 문장이 없어 계획 수금일·지연일이 로그·`notices`로 새어도 잡는 시험·변형이 없다 | H17-4·H17-5로 고정: `collectionPlan(`은 `processCollections(s, config)` 안에서 `dueDay ≤ s.day`인 미수 직접 무역 청구서마다 그날 다시 부르고, `processDeliveries`·읽기 함수에서는 부르지 않는다. 새 로그 문장 셋(‘{계약} 결제일에 대금이 들어오지 않음(남은 {금액})’, ‘{계약} 대금 일부 {금액} 수금(남은 {금액})’, ‘{계약} 대금 나머지 {금액} 수금. 계약 종결’), 인도 로그·`applyReceipt` 문장 그대로, 날 K 마감 뒤 누설 금지 규칙. 시험 ‘미래 누설 없음(로그·상태)’(프로필 사본 다섯, `serializeSave`와 읽기 함수 JSON 대조, 양성 대조), ‘지연’·‘부분’의 로그 단언. 제안과 다른 곳: golden#6 VFIX(‘{계약} 대금 미수: 고객이 결제일에 보내지 않음’, ‘나머지 {금액} 미수’)와 ambiguity#8 VFIX(‘{계약} 대금 결제일 미수: {남은 금액}’)의 문장 대신 tests#10 VFIX 문장을 H17-5로 확정했다. tests#10 FIX의 두 시드 비교 시험은 그 검증대로 사본 대조로(인도 로그 누설은 두 시드 비교로 잡히지 않는다) | 1절(인도 로그), 2절, 시험 ‘미래 누설 없음(로그·상태)’·‘지연’·‘부분’, 변형 22·23·24, H17-4·5 |
| F8 | golden#8(major / 부분 → major), tests#2(major / 부분 → major), ambiguity#10 4(`mockClear` 자리), ambiguity#19(minor), tests#11 ③: 세션 A C9가 빠졌다. 통과형 `vi.mock`·`mockClear` 자리가 없어 ‘0회’ 시험이 맞는 구현에서 실패하거나(시드 2001 40일 상태에 `claimFor` 9회·`collectionPlan` 25회) 공허해지고(읽기 직전에 지우면 변형 9가 살아남음), 원천 검사가 없고, 종류 가드(주선 품목·`SHIPPER_*` 화주는 프로필에 없다)를 잡는 시험·변형이 없다 | 시험 머리: 통과형 `vi.mock`(인수 없는 자동 모의 금지), ‘세려는 함수를 부르기 직전에 `mockClear()`’, 첩자는 내보낸 바인딩만 본다. ‘미래 누설 없음(호출 없음)’: 결제일 전·연체 중·캠페인 끝, `campaignSummary`·`quotePreview`·`preview` 포함(`riskGrades ≠ null` 전제), 결제일 전 `commitDay`의 `collectionPlan` 0회, 양성 대조는 D 당일·인도일 `commitDay`와 인수. ‘원천 검사’(몸통 범위, 첫 두 인수만 고정, 가드 리터럴, `risk.ts` 안 호출 없음, `reports.ts`·`readers.ts`의 `./rng`·`drawAt` import 없음). ‘주선(R3)’(프로필에 없는 주선과 있는 주선 둘 다, 화주 없음 단언, `OVERDUE` 없음). 1절 ‘주선 화물은 제외한다’에 가드 위치. 제안과 다른 곳: golden#8 FIX의 ‘`vite.config.ts`에 `clearMocks`가 없다’는 틀린 근거라(tests#2 V (a)) ‘Vitest 기본 `clearMocks`는 시험 사이에만’으로. golden#8 VFIX 원천 검사의 인수 변수 이름 고정은 첫 두 인수만으로(지시서가 변수 이름을 정하지 않는다). 양성 대조의 ‘같은 날 `commitDay`’는 결제일 당일로(결제일 전은 맞는 구현도 0회) | 1절, 시험 머리, ‘미래 누설 없음(호출 없음)’·‘원천 검사’·‘주선(R3)’, 변형 9·22·25·26·27 |
| F9 | tests#2(major / 부분 → major), ambiguity#10(major / 확인 → major), golden#14(minor): 0063 개정 3f의 시험 머리 관례(공개 함수만·sim 금지 C3, 구동기 환전, 수락 가능 사건만, 독립 오라클, 전제 우선, 변형이 같으면 전제부터)와 변형 머리 문장이 없다 | 시험 머리를 0063 꼴로 다시 적었다(C3 잠금, 구동기 둘, 환전 거절 실측, 오라클 정의, `claimFor`·`collectionPlan`의 결과는 입력으로 읽되 엔진 관측 대신은 금지, 0062·0063 시험 불변, `timeout`, 변형 머리). 제안과 다른 곳: tests#2 V (b)는 ‘시드 2001~2200’이 C10보다 넓다고 했으나 허브가 H17-8로 엔진 구동·순수 함수 모두 2001~2200으로 정했다(측정 시드 1~200과 겹치지 않게). ambiguity#10 FIX의 ‘두 함수는 사건 찾기와 전제 단언에만’은 tests#2 V (d)대로 ‘구성·기대값의 입력으로 읽어도 된다’로 | 시험 머리, 변형 머리, H17-8 |
| F10 | golden#9(major / 확인 → major), tests#1(blocker / 부분 → major), ambiguity#11(major / 부분 → minor), 세션 A C6: ‘캠페인 끝’ 구성법이 없다. 늦은 공개일 무명령 수락은 USD 바닥으로 전부 거절되고(2,400건), 지연일을 늘린 사본은 경영 실패로 끝난다(평가일 = 실패일). 0062 ‘열린 계약’ (가)(나)는 청구서가 없다 | 무역 구동기(매일 원화 부족분 환전, 짝마다 수락 시도, 거절은 건너뜀, `apply`·`exchange` 도우미 금지)를 적고, `COMPLETED` 실행에서 ㉠ 지연·㉡ 부분을 따로 찾는다(한 시드에 둘을 요구하지 않음). 남은 금액은 원장으로 독립 계산, ㉡에서 남은 금액 ≠ 청구액 전제, 매출채권 합(`campaignSummary`·`summarize`), `open`·`evaluationDay`·`residual`. 이 실행을 ‘연체 미수 평가’ (나)·‘항등식’ ⑦·‘미래 누설 없음(호출 없음)’이 함께 쓴다. 제안과 다른 곳: tests#1 FIX의 ‘한 시드에 함께’는 구동기 세부에 민감해(200개 중 3개) 따로 찾는다. ambiguity#11 VFIX의 ‘실패 종료도 된다’는 `COMPLETED`만으로(평가일이 `campaignDays` 하나로 닫힌다). golden#9 VFIX의 ‘2001~2200을 끝까지’는 둘을 찾으면 멈춘다 | 시험 ‘캠페인 끝’, 변형 35·36·37 (개정 3e G1: 공유 실행은 ㉠㉡에서 멈추지 않고 다섯 사건까지 잇는다) |
| F11 | golden#10(major / 부분 → minor), tests#11 ①②(minor): ‘클레임’ 시험이 층마다 표본 하나만 보고 변형 7을 약 7% 놓친다. 1일 정적 판매액이 10000의 배수라 반올림과 감액 기준(늦은 감액 뒤 판매액)이 보이지 않는다. 시작 프로필 첫 쌍으로는 큰 층이 200시드에 1~2번이다 | (가) 정시 손상 계약, (나) 둘째 편 늦은 인도 계약(감액 기준·반올림 전제를 찾기 조건으로, 시험 안 늦은 감액 식), (다) 큰 층은 사본(`minor.weightBp = 0`, `major.weightBp = 10000`), (라) 층 범위는 `generateBatch`로 모은 캠페인 전체 판매 견적의 모든 손상 추첨(층별 5건 이상 전제, 층은 반환값에서). 제안과 다른 곳: golden#10 FIX의 두 층 모두 사본 대신 큰 층만 사본(작은 층은 시작 프로필로 충분하고 (가)가 그 사례다). tests#11의 ‘1일 두 판매 견적’ 대신 캠페인 전체 견적(큰 층 약 60건) | 시험 ‘클레임’ (가)~(라), 변형 7·28·29 |
| F12 | golden#12(minor), tests#12(minor), ambiguity#10 (라): ‘등급별 확률’이 통계 시험이라 맞는 구현도 뒤집힐 수 있고(약 1.4%), 순수 함수인지 엔진 실행인지·‘지연’에 부분을 넣는지·시드 범위·사본 값이 없다 | 순수 함수 `collectionPlan`만, 시드 2001~2200 × 키 셋 = 등급마다 600회, (가) 시작 프로필의 `LATE`·`PARTIAL` 순서와 여유 10 이상, (나) 극단 사본 0·사이·600, (다) 순서 바꾼 사본. 결정적 값임을 명시. 제안과 다른 곳: ambiguity#10 (라)의 오라클 행과 합친 꼴 대신 ‘일정 오라클(클레임·수금)’과 따로 둔다. golden#12의 극단 사본만으로는 변형 20을 못 가리므로 tests#12의 (다)를 더했다 | 시험 ‘등급별 확률’, 변형 13·20 |
| F13 | golden#13(minor), ambiguity#13(minor), ambiguity#14(minor), tests#12(`cursors`): `riskGrades`가 생기는 조건(R1·R2, rules-2 키 없음/`null`)과 R3 변환 시험·`layers` 값·`state.rng.cursors` 단언이 없다 | H17-7: rules-3 위험 설정이 있는 직접 무역 `quotePreview`에만, 층과 무관(R1·R2에도), 주선 `null`, rules-2는 키 없음, 프로필 표를 직접 읽음, `preview`·`tradePreview`에는 없음. H17-8: `layers` `['FX', 'TARIFF', 'SURCHARGE', 'CLAIM', 'COLLECTION']`, 나머지 R2와 같음. 시험 ‘R3 변환·riskGrades 키 존재’(R1·R2·R3 키 있음, rules-2 `'riskGrades' in result === false`), ‘공개 등급’, ‘결정성·저장’의 `cursors` 단언. 제안과 다른 곳: golden#13·ambiguity#13 VFIX의 ‘`CLAIM`·`COLLECTION` 층이 있을 때만’은 따르지 않았다. 등급은 확률이 아니라 공개 정보라 층과 무관하게 내기로 허브가 H17-7로 정했다(0063 `surchargeMaxBp`와 다른 규칙) | 1절, 6절, 시험 ‘공개 등급’·‘R3 변환·riskGrades 키 존재’·‘결정성·저장’, 변형 16·45, H17-7·8 |
| F14 | golden#11(major / 부분 → minor), tests#9(major / 확인 → minor), ambiguity#9(major / 부분 → minor): 동결 프로필 자료·스키마가 고칠 수 있는 파일에 있다(0063 E15와 어긋남). 값이 바뀌어도 잡는 검사가 없다(‘프로필 다섯 묶음’은 원자료에서 기대값을 만들고, `MANIFEST.json` 해시를 갱신하면 검사기가 통과) | `data/market_rules.json`·스키마·`scenario.ts`를 손대지 않을 파일로(사본으로 시험, `status` 표지도 금지), `validate_data.py`는 검사 보강만, 완료 조건에 세 파일의 `git diff --stat` 빈 값. 제안과 다른 곳: golden#11 FIX의 `tools/test_validate_data.py`·`save-shape.ts` 금지는 H14-10(반례 시험 추가)과 H17-8(열거 값 추가만)에 어긋나 따르지 않았다. `save-shape.ts`는 고칠 수 있는 파일에 ‘열거 값 추가만, 보통은 고칠 것 없음’으로 남겼다 | 고칠 수 있는 파일, 손대지 않을 파일, 지켜야 할 것, H17-8 |
| F15 | golden#14(minor), ambiguity#15(minor), 세션 A C2·C4: BASE 정의·첫 화면 측정 절차(깨끗한 트리, 자료 몫, 코드 증가분)·덤프 시드 2001 이상·공개 함수만·`git status --porcelain`이 옛 꼴이다 | 0063 개정 3f 문장으로 맞춤. 덤프 경로 `<밖>/r2-collect-before.json`과 `CLAIM-` 없음 기록, `git archive` 깨끗한 트리 측정, 지금 첫 화면 127,968 B(병합 개발 트리)·시제품 +1,255 B, 결과 보고 항목 | 머리, 지켜야 할 것, 결과 보고 |
| F16 | golden#15(minor), ambiguity#16(minor), 세션 A D3: 줄 번호가 낡았고 0063 병합 뒤 더 밀린다. ‘클레임 계약 보고서’의 ‘판매’가 모호하다 | 줄 번호를 모두 함수 이름으로(`processDeliveries`·`processCollections`·`applyReceipt`, `campaignSummary`의 `openInvoices`, `paymentDefaultStatus`의 `nextReceipt`, 매출채권 검사, `contractProgress`, `schedule.ts`의 `RCV:` 행, `main.ts`의 `nextReceipt`). ‘클레임 계약 보고서’는 `contribution === S − X − COGS`, `netRevenue === S − X` | 머리, 3절, 시험 ‘클레임 계약 보고서’, H17-8 |
| F17 | ambiguity#12(minor), 세션 A D5: 부분 둘째 수금을 `applyReceipt`로 내면 전액이 다시 들어가고, 계약 `COMPLETED` 시점과 `processCollections(s)`의 `config`가 없다 | H17-4·5: 서명 `processCollections(s, config)`, 부분 두 수금은 새 함수(금액 인수), 같은 수금 ID 한 번만, 받은 금액 합 = 청구액일 때만 `PAID`·`COMPLETED`·`completedDay`, rules-2·주선은 `applyReceipt` 경로 그대로(같은 순서·같은 로그). 시험 ‘부분’의 `status !== 'COMPLETED'`, 변형 30·31 | 2절, 시험 ‘부분’, 변형 30·31, H17-4·5 |
| F18 | 세션 A D4: `CLAIM-` 분개의 순서와 청구액 정의가 없어 `contractRiskReport`의 열린 계약 값(청구액 − 받은 금액)이 흔들린다 | H17-4: `SALE-` → `CLAIM-` → 청구서, `amountMinor = netSale − 클레임`, 손상률 상한 3000bp라 `netSale > 0`이면 청구액 > 0, `netSale = 0`이면 지금 코드대로 청구서 없이 종결하고 추첨도 없음 | 1절, 시험 ‘클레임’, 변형 28, H17-4 |
| F19 | 세션 A D6: `OVERDUE`는 `InvoiceStatus`·`save-shape.ts` 열거에 이미 있고, `SALES_ALLOWANCE`(차변 잔액)는 `balance`·`contractAmount`가 음수로 돌려준다 | 2절(엔진 사용처만 없음), 1절·4절(‘더한다’가 부호까지 맞음, `SAVE_ENUMS.account = ACCOUNT_KIND`라 자동 반영, 열거는 추가만). 세션 A 자료 확인(프로필 거래처 4곳 = 판매 거래처 4곳, 판매 줄 색인 3은 0063 뒤에도 그대로)은 본문 전제로 썼다 | 1절, 2절, 4절, 5절 |
| F20 | ambiguity#17(minor): 처리표 앞 안내문이 없어 다른 문서 몫·옛 문구(m14의 d03 `compare`)가 지시처럼 읽힌다 | 0063 E27 꼴의 안내문(본문과 처리표가 다르면 본문과 H17 우선) | 처리표 앞 안내문 |
| F21 | ambiguity#18(minor): `campaignSummary`의 `byCurrency`·`openInvoices` 행에 키를 더하지 말라는 문장이 없다(rules-2 탐침 해시·`m2a5-save.test.ts` 키 단언이 깨진다) | 1절·지켜야 할 것에 새 칸 금지, ‘클레임 계약 보고서’에 키 집합 단언, ‘캠페인 끝’ (c)의 `summarize`·`campaignSummary` 매출채권 | 1절, 지켜야 할 것, 시험 ‘클레임 계약 보고서’ |
| F22 | 허브(이번 처리 중): 흐름 유일성에서 같은 키로 여러 품목·거래처를 부르면 맞는 구현도 200시드 모두 실패한다(golden#1 V (c)). 손상이 아닐 때 `…:tier`·`…:rate`를 뽑는지는 값을 바꾸지 않지만 흐름 관찰 시험의 기대 꼴을 하나로 두어야 한다(tests#7 V (a)). `OVERDUE` 전이·`overdueDays` 식, 층 검사 생략(rules-2 예외), 프로필 누락 기본값 대체를 잡는 변형이 없었다. ‘변형 12개’ 문구가 표와 어긋난다 | 흐름 유일성은 키마다 한 번씩, 기록 흐름은 결과가 정하는 것만(H17-2·3). 변형 17·18·21·32·33·46을 더했다. 변형 수 문구는 ‘변형 표의 최종 행 수를 따른다’로. 결과 보고에 네 불변식 문장·로그 자리·노출 수·변형 갈래 기록을 더했다 | 0절, 시험 ‘흐름 유일성(클레임·수금)’, 변형 17·18·21·32·33·46, 지켜야 할 것, 결과 보고 |

- 허브 결정과 다르게 한 것은 없다. 새 허브 결정은 H17-1~8이다(`HUB-DECISIONS-2026-10-16.md`). 제안된 고침 대신 H17을 따른 곳은 F1(반환 꼴·이름·정시 미추첨), F7(로그 문장), F9(시드 범위), F13(`riskGrades` 층 조건), F14(`test_validate_data.py`·`save-shape.ts`)이고, 제안된 고침끼리 다를 때는 검증(V)이 확인한 쪽을 골랐다(F2·F3·F4·F5·F6·F8·F10·F11·F12).
- 설계 5절 개정 3j(H17-5 로그 문장, 5.2 n47 `partial_bp` 고정, 3.4 ‘연체 미수’ 예시를 지연 청구서로 한정)는 허브 몫이다. tests#2 V가 권고한 0063:124 괄호(‘`vite.config.ts`에 `clearMocks`가 없다’) 정정도 허브가 0063 승인본에서 따로 한다(0064 본문 아님).
- 승인 전에 개정 3d 본문을 독립 재확인했다(복사본은 원본과 `.git`을 나누지 않는다). 반영은 아래 ‘재확인 반영’이다.

### 재확인 반영

독립 재확인(두 검사기, 주요 7·보통 19)을 본문에 넣었다. H17과 다른 것은 없다. 번호는 본문 자리다.

- 불변식(4절·시험 ‘불변식’·변형 47, 주요 셋 묶음): 4절 ③④의 순서를 시험 사본 순서(③ 주선 `CLAIM-`, ④ 클레임 > 판매액)로 바꿨다. 시험 행에 ‘그 문장에 청구서 ID(①·②)·분개 ID(③·④) 포함’과 ‘사본 ①~③의 오류에 다른 새 검사 셋의 문장 없음’ 단언을 넣고, ④는 4절 ①의 문장이 반드시 함께 나오므로 ①을 뺀 ②·③ 없음만 보게 했다(기존 검사 문장은 허용). 변형 47의 짝을 같은 문장으로 맞췄다.
- ‘클레임’ (가)(나)(다)(주요 둘 묶음): 찾기 조건에 `collectionPlan` 정시를 넣고 찾았는지 단언한다. (가) 머리를 ‘정시 인도·정시 수금 손상 계약’으로, (가)의 찾기 조건에 ‘항등식’ ②의 전제 `referenceRate(deliveredDay) ≠ referenceRate(D)`도 넣었다. (나)의 ‘(가)와 같다’를 ‘`priceReductionMinor === 0`을 뺀 나머지’로, 허브 수치(시드 55·87)가 1~200의 것임을 적고 첫 시드를 결과 보고에 넣게 했다.
- ‘항등식’ ⑤(주요 둘 묶음): ⑤a 같은 환율 D + 1의 부분 상태(전제 `(첫 수금 × D 환율) mod 100 = 50`, `referenceRate(D + 1) = referenceRate(D)`. 무역 구동기 실행의 날마다 상태에서 찾는다. 변형 40·41의 짝)와 ⑤b 평가일 환율 ≠ D 환율인 날(‘연체 미수 평가’ (가)와 같은 선택. 변형 5·42의 짝)로 나눴다. D + 1 상태의 `OVERDUE`·`overdueDays = 1`은 ‘지연’·‘부분’ 행이 맡는다. (개정 3e G2: ⑤a 전제는 ‘줄마다 ≠ 합친 꼴’ 식, 환율 같음은 찾기 조건, 차이 ±1원)
- ‘항등식’ ⑦(주요): `referenceRate`가 `publish.lastDay`(78일) 뒤 환율을 고정해 캠페인 끝 ㉠㉡의 D(80·82·87·89일)와 평가일 90일이 같은 주라, 환율 부등식·`collection !== 0` 전제를 뺐다. 독립 `realized`·항등식·`residual === 0`·`open === true`와 줄 꼴 `collection` 식(㉠·㉡, 두 환율이 같으면 0 또는 1원)만 단언한다. 변형 5의 전제는 ③④⑤b로 한정했다. (개정 3e G6: 76일 → 78일, D = 76·77 사례, 전제 단언 없음)
- ‘부분’ (나)(주요): 첫 쌍(S = 140,000)은 `pClaimBp = 10000` 사본에서도 X = 14r이라 청구액이 늘 짝수여서 홀수 청구액을 찾을 수 없었다. 사본에 `collections.partialBp = 2500`을 더하고 ‘half-up ≠ floor인 청구액(mod 4 ∈ {2, 3})’을 찾게 했다(허브 실측 97/200). ½ 하드코딩도 가린다. 변형 19를 같은 말로 바꿨다.
- 0절 `claimFor` 층 문장: ambiguity#1 VFIX의 ‘큰 손상 가중치 손잡이’ 문장을 넣어 수금 쪽과 대칭을 맞췄다.
- 2절 ‘받은 금액’: 정의를 4절 ‘용어’ 하나로 모았다(정상 상태에서는 `receiptIds`와 같다).
- 5절 ‘8단계에서 줄을 바꾸지 않는 계약’: 운송 중·출항 전 계약은 TASK-0062 ‘열린 계약’ (가)(나)(R1 설정)가 지킨다는 근거 문장을 넣고, ‘항등식’에 ⑨ R3 운송 중 계약(`claim`·`collection`·`residual` 0, 독립 `realized`)을 더했다.
- ‘항등식’ ⑥·변형 44: ⑥b 편 놓침 → 재예약 → 출항 전 취소(TASK-0062-R1 시험 ‘편 놓침 뒤 재예약…’의 구성, 7단계 줄 넷 이상)를 더해 변형 44의 짝으로 두고, ⑥a(셋 줄)는 원래 코드와 같음을 미리 적었다.
- ‘항등식’ ③④·변형 34: 재확인은 ‘평가일 환율 ≠ 마지막 수금 환율’ 전제를 제안했으나, `contractRiskReport`의 `open`은 남은 흐름으로 정해지므로 `contractId`가 없으면 완료 계약에서 `open`이 참이 된다. 전제 없이 확실하게 잡히도록 ③④에 `open === false`를 넣고 변형 34의 짝으로 적었다(독립 `realized` 어긋남과 ‘부분’의 `contractId` 단언도 함께). 제안한 환율 전제는 넣지 않았다(완료 직후 상태에서는 같은 주라 만들 수 없을 수 있다). (개정 3e G7: 독립 `realized`는 `contractId` 집합 안 `RECEIPT-` 접두로 0063 `independent` 그대로이고 보고서와 같게 나온다. 잡는 것은 `open === false`와 ‘부분’의 `contractId` 단언)
- 변형 15: ‘일정 오라클’에 없던 전제 `rateBp = 층.maxBp`를 변형 행에서 지웠다(층 범위 401·1501값이라 전제로 둘 수 없다. `days = lateMaxDays`만으로 잡힌다).
- 변형 21: 짝을 ‘일정 오라클(클레임·수금)’ R2 분기(200시드 × 키 × 품목·거래처)로 바꾸고 ‘새 층이 꺼진 R2’·골든은 보조로 두었다.
- 변형 22: ‘미래 누설 없음(호출 없음)’의 결제일 전 `commitDay` 0회 단언(인도일 마감 포함, 날마다 `mockClear`)을 짝으로 더하고 ‘첩자는 못 잡는다’ 문구를 지웠다.
- 변형 41·42·45: 41은 ‘연체 미수 평가’ (나)와 ⑤a·④로, 42는 (가)와 ⑤b로, 45는 ‘R3 변환·riskGrades 키 존재’(rules-2 키 없음)로 짝을 바로잡았다.
- ‘흐름 유일성’ 전제: ‘200시드 전체에서 각각 하나 이상’으로 범위를 적었다.
- ‘등급별 확률’ (가): 기대 차이를 `LATE` 60·`PARTIAL` 30으로 나누어 적고 문턱 10을 두 방식 모두에 두었다.
- 시험 머리: 무역 구동기 실행(끝 상태·날마다 상태)을 모듈 수준에서 한 번 만들어 네 행이 공유하고, 200시드 실행 `it`에 `it(…, 60000)` 꼴의 명시 `timeout`을 주게 했다. (개정 3e G1·G4, 3f: 모듈 최상위 즉시 생성, 다섯 사건까지, 시드를 찾는 모든 `it`에 timeout)
- 머리: H17·설계 3j를 개정 3d 커밋에서 함께 기록한다고 적었다(허브가 이 커밋에서 기록했다). 결과 보고에 찾은 첫 시드·사본 값과 ⑤a·⑤b·⑥a·⑥b·⑨의 `components` 표를 더했다.
- 처리표: 시제품 실측 문장의 ‘0063 R1·R2 시험 포함’을 `withRiskLevel` 변환 시험으로 바로잡고(바탕이 R1·R2 병합 전), F1·F2·F5 행에 재확인 반영을 덧붙였다.

### 허브 재확인 처리표(개정 3e)

개정 3d(`5bee326`)를 원본과 `.git`을 나눈 복제본 6개에서 다섯 관점(골든 무해·시험 실현성 시제품·시험 정적·변형 판별력·모호성 정합)으로 독립 재확인했다. 발견 38건을 같은 뿌리로 묶어 23건으로 만들고, 건마다 텍스트 렌즈와 코드 렌즈 두 검증자가 반박을 시도했다(둘 다 반박 못 함 = 확인, 하나만 반박 = 다툼, 둘 다 반박 = 기각. 검증이 실패한 4건은 허브가 직접 판정). 세션 A 설계자 검토(승인 가능, 문구 m1, 메모 2건)도 여기 합쳤다. 기각된 발견도 검증자가 권한 작은 문구 보강은 비용이 없으면 넣었다.

| # | 원래 id | 판정 | 고친 곳 |
|---|---|---|---|
| G1 | feasibility-1+test-static-5+ambiguity-1 | 확인(major) | 시험 머리: 공유 무역 구동기 실행을 ㉠·㉡·(나)·⑤a 네 사건이 모두 나올 때까지 잇는다(상한 2200, 모듈 최상위 즉시 생성, `it` 안 단언). ‘캠페인 끝’·(나)·⑤a에 같은 문장. 결과 보고에 시드 범위·네 사건 |
| G2 | test-static-1+mutation-1, ambiguity-7 | 확인(코드 렌즈 minor, 텍스트 렌즈 반박. 허브: 식으로 고정) | ⑤a 전제를 ‘연체 미수 평가’ (나)와 같은 꼴(줄마다 ≠ 합친 꼴)로 바꾸고 환율 같음을 찾기 조건에 넣음. 설명 ±1원. 변형 40·41 행, 5절 ‘1원(±1)’, ⑤b 괄호 |
| G3 | golden-1 | 확인(minor) | 4절 ‘자리와 문장 규칙’: 조기 반환 뒤, P0-ACC-02 이유 |
| G4 | feasibility-2 | 확인(minor) | 시험 머리: 최상위 즉시 생성, 지연 캐시 금지, 실행 시간 0.6~1.2초 |
| G5 | feasibility-9 = 세션 A m1 | 확인(minor) | ‘클레임’ (가) ‘5건 넘게’ → 5건(2023·2052·2090·2103·2138) |
| G6 | feasibility-10 | 확인(minor) | ‘항등식’ ⑦ 괄호: 76일 → 78일, D = 76·77 사례, 전제 단언 없음 |
| G7 | test-static-7+ambiguity-4 | 확인(minor) | ‘항등식’ 수금 줄은 0063 `independent` 그대로(`contractId` 집합 안 `RECEIPT-` 접두). 165행, 변형 34, ③④ 괄호 |
| G8 | mutation-2, feasibility-5+test-static-2 | 확인(minor)·다툼 | ‘지연’·‘부분’ 로그 단언을 계약 ID 부분 문자열 기준(D일·계획일 각 1줄, 사이 0줄)으로 세게 함. 전제 `deliveredDay < D`. 변형 24 짝, 변형 51 추가(숫자 검사는 개정 3f V1에서 뺐다) |
| G9 | mutation-6 | 확인(텍스트 렌즈, 코드 렌즈 실패) | 새 시험 행 ‘채권 일정 정렬’(뒤집은 사본, 시험 안 정렬식), 변형 52 |
| G10 | mutation-7 | 미검증(허브 판정: 맞음) | ‘클레임’ (나)에 완료 상태 `claim` 정확식·`cancel`·`collection`·`residual` 단언, 변형 53 |
| G11 | mutation-8 | 미검증(허브 판정: 맞음) | ‘공통 난수’: 1일 수락까지 먼저 만들어 k1·k2를 읽고 전제가 맞는 시드만 이어 돌린다 |
| G12 | ambiguity-9 | 미검증(허브 확인: `m2a5-save.test.ts:205`는 최상위 키만) | 1절·‘클레임 계약 보고서’ 근거 문장 |
| G13 | feasibility-4 | 다툼(결과 같음) | ‘새 층이 꺼진 R2’ 시드 2001·실패 허용. 첫 쌍 구동기 환전은 `fund` 꼴(76일 환전 거절) |
| G14 | feasibility-6+ambiguity-8 | 다툼(결과 같음) | 1절: 모르는 견적의 직접 무역 결과는 `riskGrades: null`, 시험 없음 |
| G15 | golden-2+ambiguity-3 | 기각(선택 문구) | 4절 ‘용어’: 받은 금액 식은 도우미 하나(괄호 없는 파일)나 자리마다 식 |
| G16 | golden-3 | 기각(선택 보강) | R2 덤프를 캠페인 끝 상태 전문(`meta` 제외)으로 바꿈 — 더 단순하고 세다 |
| G17 | feasibility-3+ambiguity-2 | 기각(선택 보강) | ‘클레임’ (가) 인도 로그 다음 줄 단언, 변형 54 |
| G18 | feasibility-7 | 기각(선택 문구) | 2절 로그 제목 ‘(지연)’ 꼬리표 제거(H17-5 원문) |
| G19 | feasibility-8+ambiguity-5 | 기각(선택 문구) | ‘클레임’ (라) k = 1…11, `batchZero(cfg).index`, 1일 정적 견적 제외 |
| G20 | test-static-3 | 기각(선택 보강) | ‘흐름 유일성’: 키 접두로 호출별 집합 `toEqual`(변형 17·18의 확실한 짝) |
| G21 | test-static-4 | 기각(용어 통일) | ‘연체 미수 평가’ `outstandingMinor` → 남은 금액 |
| G22 | test-static-6+ambiguity-6 | 기각(선택 문구) | 불변식 ②③·항등식 ①의 상태 출처 |
| G23 | mutation-3, mutation-4, mutation-5 | 기각(선택 문구) | 변형 21 ‘순수 함수 안의’, 변형 16 ‘되씀’, ‘호출 없음’ 전제 `deliveredDay < D` |
| A-메모 1 | 세션 A | 기록 | 0062·0063 시험 시드 1~200이 측정 범위와 겹침 → STATUS 후속 |
| A-메모 2 | 세션 A | 확인 | `progress.ts` 미수 분기는 3절·결과 보고 ‘범위 밖 발견’에 이미 있음 |

- 재확인 실측 요약(검증자): 지시서 문장대로 만든 시제품에서 골든 검사기 종료 0, 전체 시험 1,431개 통과(불변식을 조기 반환 뒤에 둘 때), R3 무역 구동기 시드 2001~2200 완주 200/200·`residual` 위반 0, 첫 쌍 구동기 한 실행 약 0.39초·무역 구동기 약 1초.
- 허브가 검증자 제안과 다르게 정한 곳: G8의 숫자 검사는 3e에서 범위를 좁히지 않고 `{N}일` 꼴로 한정했으나, 좁힌 검증(3f V1)에서 1일 체결 로그 ‘(납기 8일)’에 걸리는 것이 실측되어 뺐다(날짜 누설은 고정 문장 비교와 ‘미래 누설 없음(로그·상태)’가 지킨다). G16은 낱말로 거른 로그 대신 상태 전문을 택했다.

### 허브 좁힌 검증 처리표(개정 3f)

개정 3e(`e73aa5d`)의 고친 문장만 세 렌즈(실현성·정합·산술)로 검증했다(복제본 3개, 시제품 diff 적용 실측). major 3건(같은 뿌리)은 각각 독립 반박 검증을 거쳐 모두 확인됐다.

| # | 발견 | 판정 | 고친 곳 |
|---|---|---|---|
| V1 | feasibility-1 = consistency-1 = arith-1 | 확인(major, 반박 3/3 실패) | ‘지연’·‘부분’의 ‘로그 전체에 {N}일 숫자 없음’ 단언을 뺐다. 부분 첫 시드 2019는 지연일 8 = 1일 체결 로그 ‘(납기 8일)’, 지연 시드 2049·2094는 관세 공지 ‘(N일부터)’가 겹친다(실측). 날짜 누설은 고정 문장 비교와 ‘미래 누설 없음(로그·상태)’가 지킨다 |
| V2 | feasibility-2 = consistency-6 = arith-3 | 확인(minor) | ‘채권 일정 정렬’ 찾기 조건에 ‘(dueDay, invoiceId) 순서 ≠ invoiceId 순서’를 더함(시드 2001 22일). 공유 실행의 다섯째 사건 |
| V3 | feasibility-3 | 확인(minor) | 시험 머리 공유 목록에 ‘채권 일정 정렬’, 네 사건 → 다섯 사건 |
| V4 | feasibility-4 = consistency-4 | 확인(minor) | (나)·⑤a·‘캠페인 끝’: 잇는 주체는 최상위 생성, 행은 찾았는지만 단언 |
| V5 | feasibility-5 | 확인(minor) | R2 덤프: `JSON.parse(serializeSave(state)).state`에서 `meta` 제외(`withoutMeta(state)`), 포장 제외 |
| V6 | consistency-2 = arith-2 | 확인(minor) | ⑤a 괄호: 짝수 청구액에서 m ∈ [25, 50) −1원·[50, 75) +1원, mod 100 = 50은 한 경우 |
| V7 | consistency-3 | 확인(minor) | timeout 규칙을 ‘시드를 찾거나 200시드를 도는 모든 `it`’로 |
| V8 | arith-4 | 확인(minor) | 변형 40이 첫 적중에서 살아남으면 다음 ⑤a 전제 상태로 넘어가 돌린다 |
| V9 | consistency-5 | 확인(minor) | 개정 3d 처리표 F10·‘재확인 반영’ ⑤a·⑦·변형 34·시험 머리 줄에 3e 변경 꼬리 |

- 검증자 실측: Vitest 5.0.3 최상위 동기 실행 6초 이상 통과·`??=` 지연 생성의 첫 `it` 5초 실패(머리 문장과 일치), 뒤집은 사본의 `receivableSchedule`·`openInvoices`가 시험 안 정렬식과 `toEqual`, ⑤a 식 전제에서 `collection`이 정확히 ±1원임을 half-away 정수식으로 증명(홀수·짝수 모두), R2 첫 쌍 구동기 시드 2001~2003 `withoutMeta(state)` 시제품 전후 `cmp` 0(상태에 계정 열거 없음, `rng.cursors` 빈 객체).
