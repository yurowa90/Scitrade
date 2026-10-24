# TASK-0068a 경로 5 실행기 v2 ①: 골격·정책·칸(rules-4 위험 단계 실행, 40시드, 외상 정책, 진단 재료)

- 지위: **승인(허브, 2026-10-24, 개정 1 3a03b9d).** 초안(`6985cbe`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0068a-HUB-2026-10-24.md`(확인 16, major 2, 기각 3)에서 수정 E1~E12를 받았다. 처리는 끝의 ‘개정 1 처리표’에 있다.
  - TASK-0068 개정 1(`15e3551`)을 허브가 나누기로 정했다(H27 끝). 이 지시서는 그 앞쪽(실행 결과를 바꾸는 계층)이다. 뒤쪽 0068b(표·보고·비교)는 이 지시서 병합 뒤에 쓴다.
  - 0068 개정 1에 반영한 허브 결정 H27과 사전 검수 `PRECHECK-0068-HUB-2026-10-24.md` E1~E16 가운데 이 지시서 몫은 끝의 처리표에 있다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0067a(+R1)·0067b(+R1)가 병합됐다(개발 브랜치 `b001681`, 기록 `1b56eb5`).
  - **`BASE`는 작업 트리를 만든 커밋이다.** 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- **기준 문서와 우선 규칙**
  - 기준: 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md`(승인) 1·3.4·4·6절, `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인) 7·10절, 허브 결정 H23~H27.
  - 함수 경계·CLI 이름·출력 모양은 이 지시서를 따른다. 판정표와 다르게 해야 할 이유가 생기면 멈추고 보고한다.
  - 허브가 승인한 판정표와의 차이 가운데 이 지시서 몫: 진단 U의 ‘v1 대비 지연·부분 수금 건수’는 내지 않는다(H27-2 (b)). 지연·부분 수금은 서로 겹치지 않게 센다(3.2).
- 범위 밖: 판정 표·보고·층 비교(0068b), 엔진(`src/engine/*.ts`), 자료, 화면, **측정**. 판정표 v2의 측정 시드(1061~1180)와 판본 1 시드(1001~1060)로 v2를 돌리지 않는다.
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 1절 1의 비위험 회귀 확인뿐이다(바이트 비교).

## 0. 앞선 검수에서 얻은 원칙(허브 전달)

1. **고정물 값은 서로 다르게 고른다.** 하한 ≠ 상한, 계수 ≠ 100, 두 정책·두 단계의 값이 같아지지 않게 한다.
2. **나머지가 생기는 값을 쓴다.** 수량·단가·시드 수(홀수와 짝수)를 그렇게 고른다.
3. **실제 R4 시뮬레이션 스모크 시험을 하나 둔다**(시험 9).
4. **변형마다 ‘어느 시험이 왜 실패하는가’를 한 줄씩 적는다**(7절).

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **v1 측정 도구와 rules-1~3은 바이트로 같다.** 작업 전과 끝에 아래가 모두 같아야 한다. 어긋나면 고치기 전에 멈추고 보고한다.
   - `node tools/check_rules2_golden.mjs` → 0, `node tools/check_rules3_golden.mjs` → 0(로더 지문 포함)
   - 비위험 회귀: 작업 전 `node src/engine/sim/run.mjs run --out /tmp/TASK-0068a-run-before.json`, 작업 끝 `node src/engine/sim/run.mjs run --out /tmp/TASK-0068a-run-after.json`, 그 뒤 `cmp /tmp/TASK-0068a-run-before.json /tmp/TASK-0068a-run-after.json`
   - **v1 위험 실행 회귀**: 작업 전 `node src/engine/sim/run.mjs d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0068a-v1r3-before.json > /tmp/TASK-0068a-v1r3-before.md`, 작업 끝 같은 명령으로 `-after.json`·`-after.md`, 그 뒤 두 쌍을 각각 `cmp`. 자료를 바꾸지 않으므로 `marketRulesSha256`도 같다.
   - 기존 `src/engine/sim/risk-runner.test.ts`·`seed-base.test.ts`가 **고치지 않은 채** 통과한다.
2. **기존 시험 파일은 고치지 않는다.** 새 시험은 새 파일 `src/engine/sim/risk-runner-v2.test.ts`에 둔다.
3. **v1 출력에 키를 더하지 않는다.** `RiskMeta`·`RiskContract`·`RiskMetrics`·`metrics.operations`의 새 칸은 v2 실행(rules-4)에서만 둔다(값이 `undefined`인 키도 두지 않는다).
4. **실행기 코드는 첫 화면 묶음에 들어가지 않는다.** 작업 전·끝에 `npm run --silent build && node tools/check_bundle_size.mjs dist`의 첫 화면 gzip 바이트를 적는다. 바뀌면 멈추고 보고한다(0067b 병합본 132,576 B).
5. **위험 모듈 import 규칙**(`risk-runner.test.ts:486-532`가 지킨다)
   - `../risk`의 함수는 보고서 파일 `risk-metrics.ts`·`risk-tables.ts`에서만 자유롭게 가져온다. 그 밖의 `src/engine/sim/**` 파일(새 시험 포함)은 허용 목록(`krwToUsdMinor`, `usdToKrwMinor`, `rowCurrency`, `divHalfAway`, `withRiskLevel`)만 가져온다.
   - 그래서 `withRiskLevelV2`·`referenceRate`·`defaultFor`가 필요한 곳은 `risk-metrics.ts`의 감싼 함수를 쓴다(2.1·3.2).
   - 정책 파일(`operations-policy.ts`·`policies.ts`·`variants.ts`)은 보고서 파일(`risk-metrics`·`risk-tables`)을 가져오지 않는다.
6. **측정하지 않는다.**
7. 커밋·푸시·브랜치 전환은 하지 않는다.

## 2. v2 실행 단계와 CLI

### 2.1 단계·설정·메타

- 형 `RiskLevelV2 = 'R0P' | 'R1' | 'R2' | 'R3' | 'R4'`. v1 `RiskLevel`(`R0`~`R3`)은 그대로다.
- 감싼 함수 `simConfigV2(config, level: RiskLevelV2, profileId: string)`를 **`risk-metrics.ts`**에 둔다. 안에서 `withRiskLevelV2(config, level, loadRiskProfile(profileId), loadCreditProfile(profileId))`를 부른다. `d03.ts`와 새 시험은 이 함수만 쓴다(1절 5).
- v2 설정 = `simConfigV2(withLateMode(loadScenario(id), late), level, profileId)`.
- **v2 단계도 `options.risk`에 담는다.** `d03Options`는 `--risk-v2 X`를 받으면 `options.risk = X`, `options.riskV2 = true`로 둔다. 그래서 `run.mjs`는 고치지 않아도 `marketRulesSha256`을 넣고 워커를 나눈다.
- `requestedRisk(options)`는 `riskV2`일 때 v2 메타를 낸다: `{ rules: 'M2a-rules-4', level, profileId, tuningRound, marketRulesSha256 }`(키 순서 그대로). v1 메타 모양은 그대로다. `workerOptions`·`mergeD03`의 메타 일치 검사는 이 모양으로도 동작해야 한다.
- **프로필 선택**: `--profile ID`(기본 `RISK_PROFILE_V2`). 외상 칸이 없는 프로필(`loadCreditProfile`이 예외)은 사용법 오류(종료 2). 출력 직전 `meta.risk.profileId`가 고른 ID와 같은지 검사한다. v1의 DEFAULT 선택은 그대로다.
- `--round`는 `--risk-v2`와 함께 쓸 수 있다. 값은 `tuningRound`로 메타에 들어간다.
- `simulate`의 다섯째 인수 형을 `RiskLevel | RiskLevelV2`로 넓힌다(`sim.ts`).
- 환율 감싼 함수(E11): `rateAtV2(cfg: ScenarioConfig, seed: number, day: number): number`를 `risk-metrics.ts`에 두고 안에서 `referenceRate(cfg, seed, day)`를 부른다. `saleKrwAtAcceptMinor`(3.2)와 시험이 이 함수를 쓴다.

### 2.2 CLI(`src/engine/sim/cli.ts`)

- `sim d03`에 `--risk-v2 R0P|R1|R2|R3|R4`와 `--profile ID`를 더한다.
  - `--risk`와 `--risk-v2`는 함께 쓸 수 없다(종료 2). `--profile`은 `--risk-v2`와만 쓴다.
  - **`--risk-v2`이고 `--scenarios`가 없으면 시나리오는 (다)(`SCENARIO_M2_OPS_COS_LAVER`)다.** (다)가 아닌 시나리오를 주면 종료 2.
  - **`--risk-v2`는 `--seed-base`가 필요하다. 없으면 종료 2**(E7). 기본 시드(1001~)로 v2를 돌리지 않게 하려는 것이다.
  - **rules-4가 아닌 실행(`--risk-v2`가 없는 실행)에서 `--policies`에 `TERM_GREEDY`·`CREDIT_AWARE`가 있으면 사용법 오류(종료 2)**(E8).
- **시드 수**
  - `--seeds N`의 상한을 40으로 넓힌다. 기본은 20.
  - `--seed-base B`가 있으면 시드 목록은 `B .. B+N−1`이다. 넘침 거절은 지금처럼 `시드 기준값` 표지로 낸다. 상한을 `Number.MAX_SAFE_INTEGER − (N − 1)`로 둔 같은 `integer` 검사로 구현한다(E5). 기본 N = 20에서는 지금 상한(`MAX_SAFE_INTEGER − 19`)과 같아 `seed-base.test.ts:23-24`가 그대로 통과한다. 그래서 `--seeds`를 먼저 읽고 `--seed-base`를 검사한다.
  - **`--seed-base` 없이 `N > 20`이면 종료 2.**
  - `--seed-from`·`--seed-to`는 이 목록의 번호다. 인수 없는 v1 실행의 시드 목록은 지금과 같다.
- 도움말(E4): `cli.ts`의 `USAGE`를 아래 전문으로 바꾼다. 바뀌는 것은 셋이다. ① `sim d03 [--risk …]` 줄(지금 20행) 바로 다음에 `--risk-v2` 줄을 넣는다. ② 26행을 ‘run의 시드 수 N은 기본 목록의 앞 1~20개입니다. 비교 표시 한도는 0 이상의 정수입니다.’로 바꾼다. ③ 27행만 새 문장으로 바꾼다. 다른 줄은 그대로다. 시험 1은 `USAGE`가 이 전문과 정확히 같은지 검사한다.

  ```text
  사용법:
    sim run [--scenarios A,B] [--policies X,Y] [--seeds N] [--out PATH]
    sim d03 [--risk R0|R1|R2|R3] [--scenarios A,B] [--round 0~3] [--seed-base N] [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
    sim d03 --risk-v2 R0P|R1|R2|R3|R4 --seed-base N [--profile ID] [--round 0~3] [--scenarios A] [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
    sim d03 --tables-from a.json,b.json [--late base|cap30|flat200]
    sim risk-compare A B
    sim compare BEFORE AFTER [--limit N]
    sim summary FILE
    sim help | --help
  run의 시드 수 N은 기본 목록의 앞 1~20개입니다. 비교 표시 한도는 0 이상의 정수입니다.
  D03의 --seed-base N은 시드 목록을 N~N+(시드 수−1)로 바꿉니다(시드 수 기본 20, 최대 40). --seed-base 없이 시드 수는 20 이하입니다. 분할 번호는 이 목록에 적용됩니다.
  ```

  (코드 블록의 앞 두 칸 들여쓰기는 문서 표기다. 실제 `USAGE`의 각 줄 들여쓰기는 지금 파일과 같다: 명령 줄은 두 칸, 마지막 두 줄은 들여쓰기 없음.)
- **v2 실행의 표준 출력**: 표는 0068b가 만든다. 0068a에서 `writeD03`는 v2 출력이면 v1 `d03Tables`를 부르지 않고 한 줄 요약만 낸다: `v2 실행 {회수}회 · 단계 {level} · 프로필 {profileId} · 시드 {처음}~{끝} (표는 TASK-0068b)`. `--out` JSON은 그대로 쓴다.
- **v1 도구는 v2 출력을 거절한다**: v1 `risk-compare`와 `d03 --tables-from`은 `meta.risk.rules`가 있는 출력을 종료 2로 거절한다(`risk-tables.ts`의 `compareRisk` 첫머리, `cli.ts`의 `--tables-from` 경로).

### 2.3 묶음(판정표 v2 1절)

- 정책 `TERM_GREEDY`, `CREDIT_AWARE`를 `ACCEPTANCE_IDS`에 더한다(v1 `d03PolicyIds`에는 넣지 않는다).
- `d03PolicyIdsV2(level)`와 `bundleKindV2(level): 'full' | 'reduced'`(`variants.ts`)
  - `full`(R0P·R4): `d03PolicyIds('base')`에서 `FOCUS`를 뺀 것 + `MARGIN_BUFFER`·`TERM_GREEDY`·`CREDIT_AWARE`
  - `reduced`(R1·R2·R3): `IDLE`·`NO_FX`·`MAX_CONTRIBUTION`·`LATE_OK`·`MARGIN_BUFFER`·`TERM_GREEDY`·`CREDIT_AWARE`
- `--risk-v2`이고 `--policies`가 없으면 이 묶음을 쓴다.

## 3. 정책과 지표

### 3.1 외상 조건 선택(`operations-policy.ts`)

- **함수 하나**: `termCandidate(state, config, c: DirectCandidate, acceptance: string, day: number): { creditTermId: CreditTermId | undefined; sale: number; contribution: number; preview: QuotePreview }`를 내보낸다.
  - `acceptance`가 `TERM_GREEDY`·`CREDIT_AWARE`가 아니면 `creditTermId: undefined`, `sale`·`contribution`·`preview`는 `c`의 지금 값 그대로다(v1 동작 불변).
  - 두 정책이면 `creditTermOptions(state, config, c.buyOfferId, c.sellOfferId, c.quantity)`(`../readers`)를 부르고 고른다.
    - `TERM_GREEDY`: `D30` → `D15` → `BASE` 순으로 처음 `allowed`인 것.
    - `CREDIT_AWARE`: `grade === 'C'`이면 `BASE`, 아니면 `TERM_GREEDY`와 같다.
  - 고른 조건의 `saleAmountMinor`를 `sale`로, `paymentDueDay`를 결제일로 `preview`를 다시 부르고, `contribution = decisionContribution(preview, sale, c.purchaseCurrency)`다. 대손·이자는 넣지 않는다.
- **선택 시점과 쓰는 판매액**(하나로 못박음)
  1. 후보를 만들 때(`operations-policy.ts:141-150`) 직접 무역 후보마다 그때의 `current`로 `termCandidate`를 부른다. 그 결과의 `sale`·`contribution`이 **정렬 키**(`:154`의 정렬)와 **0 이하 거르기**(`:156`)에 쓰인다.
  2. 수락 루프 안에서 그 후보를 시도하기 직전, **최신 `current`로 `termCandidate`를 다시 부른다.** 같은 날 앞선 수락이 노출액을 늘려 조건이 바뀌었을 수 있기 때문이다. 다시 낸 `contribution`이 0 이하이면 건너뛴다(거절 사유 `credit`, 3.3). 정렬은 다시 하지 않는다.
  3. 다시 낸 `sale`·`contribution`을 `:177`의 `c.sale`·`c.contribution` 자리에 쓰고, 다시 낸 `creditTermId`를 `:182`의 명령(`ACCEPT_TRADE`)에 쓴다(BASE도 명시)(E3).
- 기준 회사 `MAX_CONTRIBUTION`과 다른 v1 정책은 `creditTermId` 키를 넣지 않는다.

### 3.2 `RiskContract`의 v2 칸과 진단 U 재료(`risk-metrics.ts`)

- v2 실행에서만, **`kind === 'DIRECT_TRADE'` 계약에만** `RiskContract`에 **일곱 칸**을 둔다(E2). 주선 계약은 v1 칸 그대로다. `saleKrwAtAcceptMinor`는 직접 무역 전용이다(0068b J9 분모). 일곱 칸: `creditTermId`, `creditEligible`, `grade`(판매 거래처 등급, `config.operations.risk.profile.collections.byCounterparty`), `saleAmountMinor`, `acceptedDay`, `paymentDueDay`, `saleKrwAtAcceptMinor`(= `usdToKrwMinor(saleAmountMinor, rateAtV2(cfg, seed, acceptedDay))`, 0068b J9의 분모).
- `components`는 `contractRiskReport`의 것을 그대로 옮긴다(rules-4에서는 `default`·`carry`가 들어 있다).
- `riskMetrics`의 `level` 인수를 `RiskLevel | RiskLevelV2`로 넓힌다. 분석값은 `R0`이 아닌 모든 단계(R0P 포함)에서 낸다.
- v2 `RiskMetrics`에 `credit` 칸:

  | 칸 | 정의 |
  |---|---|
  | `defaultsConfirmed` | `WRITTEN_OFF` 청구서 수 |
  | `badDebtMinor` | `BAD_DEBT` 분개 합 |
  | `defaultsUnconfirmed` | 끝에 `OVERDUE`이고 `defaultFor(...)`가 참인 직접 무역 청구서 수(정책이 끝난 뒤의 읽기라 미래 누설이 아니다) |
  | `unconfirmedMinor` | 그 청구서들의 남은 금액 합 |
  | `carryMinor` | `RECEIVABLE_CARRY` 분개 합 |
  | `limitBlocked` | `creditEligible.limitBlocked`가 비지 않은 계약 수 |
  | `termCounts` | 직접 무역 계약의 `creditTermId`별 수 `{ BASE, D15, D30 }` |
  | `partialReceipts` | `RECEIPT-RCPT-{inv}-2` 분개가 있는 청구서 수(부분 수금) |
  | `lateReceipts` | `PAID`이고, `RECEIPT-RCPT-{inv}` 분개 **하나만** 있으며(부분·회수 제외) 그 날짜 > `dueDay`인 청구서 수(지연 전액 수금). 그래서 둘은 겹치지 않는다(H27-2 (b)) |
  | `dateEligible` | 날짜 규칙상 비BASE 가능 직접 무역 계약 수(아래) |
  | `dateLimitEligible` | 날짜+한도 비BASE 가능 직접 무역 계약 수(아래) |

  - 날짜 가능 조건은 계약에서 다시 계산한다: 오퍼 결제일 = `paymentDueDay − days(creditTermId)`, 조건 t 가능 ⇔ `오퍼 결제일 + days_t + lateMaxDays ≤ campaignDays`. 날짜+한도 가능 ⇔ 날짜 가능 조건 가운데 `limitBlocked`에 없는 것이 하나라도 있음.
- `defaultFor`·`referenceRate`는 이 보고서 파일에서만 부른다(1절 5).

### 3.3 거절 계측(판정표 v2 3.4)

- 파일 경계(E1): `operations-policy.ts`가 세고, `policies.ts`의 `PolicyDecision`에 선택 칸 `rejectionUnits`로 넘긴다. `sim.ts`가 `decide()` 결과에서 `rejectionUnits`를 꺼내(:44) `observeClosed`의 **다섯째 선택 인수**로 넘기고(:57), `operations-metrics.ts`가 모은다. v1에서는 `rejectionUnits`가 `undefined`이고 수집기는 키를 두지 않는다. 출력은 **rules-4 실행의 `metrics.operations`에만** `rejectionsV2` 칸으로 둔다. v1 불변은 1절 1의 cmp·골든으로 확인한다.
- **시도한 짝·견적**(E6): `:156`의 두 조건(기여 > 0, 견적 OPEN)과 `SEEDED_RANDOM` 관문을 통과해 출항편 검사(또는 3.1의 credit 재평가)에 들어간 직접 무역 후보가 하나라도 있는 짝·견적이다. 운송 주선은 짝·견적 단위에 넣지 않는다.
- 정의(하루 결정 단위)
  - **후보 단위**: 지금 `rejections`와 같은 사유별 수(`funds`·`storage`·`handling`·`sailing`·`staff`·`onTime`) + 새 사유 `credit`(3.1의 2에서 다시 낸 기여가 0 이하).
  - **짝 단위**: 그날 시도한 (매입, 판매) 짝 가운데 어느 수량도 수락되지 않은 짝 수.
  - **견적 단위**: 그날 시도한 매입 견적 가운데 어느 짝·수량도 수락되지 않은 견적 수.
  - **OPEN 아님 건너뜀**: 같은 날 앞선 수락으로 견적이 이미 `OPEN`이 아니어서 건너뛴 후보 수(`:156`의 두 번째 조건). 거절에 넣지 않고 따로 센다.
- `rejectionsV2 = { candidate: { …사유: 수 }, pair: 수, quote: 수, skippedNotOpen: 수 }`(실행 전체 합).
- v1 `rejections`의 값과 모양은 그대로다(`credit` 사유는 v1 칸에 넣지 않는다).

## 4. 기제 시험(H24-1)

판정이 아니라 시험이다(시험 7·8).

## 5. 실행 비용 기록

결과 보고에 적는다(측정이 아니다): 시드 2001~2003, (다), `--risk-v2 R4` 전체 묶음 1회의 걸린 시간·워커 수·실행 수. 40시드·다섯 단계로 늘렸을 때의 추정 시간(판정표 v2 1절의 ‘한 회차 약 1시간 40분’과 대조).

## 6. 시험(새 파일 `src/engine/sim/risk-runner-v2.test.ts`)

시드 2001 이상. 0절 원칙. 위험 모듈은 1절 5대로 감싼 함수로만 쓴다. (0068b가 같은 파일에 표·보고 시험을 더할 수 있게, 이 지시서의 시험은 `describe('TASK-0068a …')` 안에 둔다.)

1. **CLI·옵션**: `USAGE`가 2.2의 전문과 정확히 같음(E4), **`--risk-v2`에 `--seed-base`가 없으면 거절**(E7), **`--risk-v2` 없이 `--policies TERM_GREEDY` 또는 `CREDIT_AWARE`면 거절**(E8), `--seed-base 9007199254740953 --seeds 40`은 `시드 기준값` 표지로 거절·`9007199254740952 --seeds 40`은 허용(E5), `--risk`·`--risk-v2` 동시 거절, `--profile` 단독 거절, `--profile RISK_PROFILE_DEFAULT` 거절, **`--profile`이 없으면 `profileId = RISK_PROFILE_V2`**, **`--scenarios`가 없으면 (다)**, (다) 밖 거절, `--seeds 41` 거절, **`--seed-base` 없이 `--seeds 21` 거절**, `--seeds 40 --seed-base 2001`의 목록 길이 40·끝 **2040**, `B+N−1`이 안전 정수를 넘으면 거절, `--round 2 --risk-v2 R1`의 `tuningRound` 2, 인수 없는 v1 시드 목록이 지금과 같은 20개, 도움말 26-27행의 새 문장.
2. **묶음**: `d03PolicyIdsV2('R0P')`·`('R4')`에 `FOCUS` 없음·세 정책 있음, `('R1')`·`('R3')`이 일곱 정책, `bundleKindV2('R3') === 'reduced'`. v1 `d03PolicyIds`에 두 정책 없음.
3. **정책 조건 선택**(손 고정물)
   - `TERM_GREEDY`: D30 허용 오퍼 → D30, D30이 날짜로 막히고 D15 허용 → D15, 둘 다 한도에 막힘 → BASE. 세 경우를 서로 다른 오퍼로.
   - `CREDIT_AWARE`: C 거래처 → BASE, A·B → `TERM_GREEDY`와 같은 조건.
   - **같은 날 한도 채움**: 같은 B 거래처의 두 후보(서로 다른 수량·단가)가 있고, 첫 수락이 D30으로 한도를 거의 채운다. 하루 결정 뒤 둘째 계약은 BASE(또는 D15)다. 생성 시점 조건으로 수락하면 엔진이 ‘외상 한도 초과’로 거절해 둘째 계약이 없다.
   - 기준 회사 명령에 `creditTermId` 키 없음(`Object.hasOwn`).
4. **`termCandidate` 직접 호출**: 가산이 있는 조건의 `contribution`이 같은 후보의 BASE `contribution`보다 `sale` 차이만큼 크다(나머지가 생기는 수량·단가). v1 정책 이름이면 `creditTermId`가 `undefined`이고 값이 후보 그대로.
5. **`RiskContract`**: v2 실행의 **직접 무역 계약마다** 일곱 칸이 있고 값이 상태·`rateAtV2` 환율과 같다. **주선 계약에는 그 키가 없다.** v1 실행 계약에는 키가 없다(E2).
6. **진단 U 재료**: `riskMetrics`를 직접 부르는 손 상태로(`defaultFor`의 참·거짓은 손 설정의 `pDefaultBp` 10000/0으로 만든다, E11) 확정 대손 1·미확정 대손 2(서로 다른 수), `unconfirmedMinor`, `lateReceipts`·`partialReceipts`가 겹치지 않음(같은 상태에 지연 전액 1·부분 1·회수 1), `limitBlocked` 계약 1, **`lateMaxDays` 경계 오퍼**(오퍼 결제일 + days + 15가 campaignDays와 같음·1 큼)의 `dateEligible`·`dateLimitEligible`.
7. **기제 시험 — 손 고정물**: 날짜상 비BASE가 가능한 C 거래처 판매 오퍼와 A·B 오퍼가 있는 고정 상태에서 하루 결정을 내리면, `CREDIT_AWARE`의 C 계약은 BASE, `TERM_GREEDY`의 C 계약은 비BASE, A·B 계약의 조건은 두 정책이 같다.
8. **기제 시험 — 시드**: 시드 2001 이상 몇 개(최대 10)의 R4 실행에서 `CREDIT_AWARE`의 C 비BASE 계약 0건. `TERM_GREEDY`의 C 비BASE가 1건 이상인 시드를 찾으면 그 시드를 적는다. 못 찾으면 ‘손 고정물로만 확인’이라고 결과 보고에 적고 통과로 둔다.
9. **R4 스모크**: `simMain(['d03', '--risk-v2', 'R4', '--policies', 'MAX_CONTRIBUTION,TERM_GREEDY,CREDIT_AWARE', '--seed-base', '2001', '--seeds', '2', '--out', <tmp>], io)`(워커 1, CLI 문자열 인수)가 예외 없이 끝나고, 표준 출력이 2.2의 한 줄 요약이며, 출력 JSON의 `meta.risk`가 2.1 모양이고, 정책마다 `credit.termCounts` 합이 직접 무역 수와 같다. 60초 이내.
10. **거절 계측**(E6): 손 고정물 하루 결정. 고정물: 매입 견적 Q1에 판매 짝 P1(수량 2로트·1로트 두 후보)과 P2(1로트 한 후보), 매입 견적 Q2에 판매 짝 P3(1로트 한 후보). P1의 2로트 후보가 기여 1위로 수락되어 Q1이 OPEN이 아니게 되고, P3는 납기 안에 닿는 편이 없어 `onTime`으로 거절되게 만든다. **기대 수: 후보 단위 `onTime` 1(다른 사유 0), 짝 1(P3), 견적 1(Q2), `skippedNotOpen` 2(P1의 1로트·P2).** v1 실행의 `metrics.operations`에 `rejectionsV2` 키가 없다.
11. **워커 바이트**(E12): 같은 v2 실행(`--risk-v2 R1`, 시드 2001~2003, 정책 둘)을 워커 1과 2로 돌린 출력 JSON이 바이트로 같다(`run.mjs`를 자식 과정으로, 출력은 `os.tmpdir()`).
12. **v1 도구의 v2 거절**(E10): `MAX_CONTRIBUTION`을 포함하고 시드·프로필·sha가 같은 v2 R1 출력과 v2 R2 출력을 v1 `risk-compare`에 주면 종료 2. 같은 v2 출력을 `d03 --tables-from`에 주면 종료 2이고 오류 문장에 새 `rules` 거절 문구가 있다.

## 7. 변형 시험(임시로 고치고 되돌림)

| 번호 | 변형 | 실패하는 시험 | 이유 |
|---|---|---|---|
| 1 | `TERM_GREEDY`의 순서를 `D15 → D30 → BASE`로 | 시험 3 | D30 허용 오퍼에서 D15를 고른다 |
| 2 | `CREDIT_AWARE`의 C 판정을 지움 | 시험 3·7 | C 계약이 비BASE가 된다 |
| 3 | `termCandidate`가 기여에 BASE 판매액을 씀 | 시험 4 | 기여 차이가 0이 된다 |
| 4 | v2 `RiskContract` 칸을 v1에도 넣음 | 시험 5, 1절 1의 v1 R3 cmp | v1 출력에 키가 생긴다 |
| 5 | `--seed-base` 목록 길이를 20 고정으로 되돌림 | 시험 1 | 40개 목록의 끝이 2040이 아니라 2020이 된다 |
| 6 | `defaultsUnconfirmed`를 `WRITTEN_OFF` 수로 | 시험 6 | 확정 1·미확정 2가 같은 값이 된다 |
| 7 | 날짜 가능 계산에서 `lateMaxDays`를 뺌 | 시험 6 | 경계 +1 오퍼가 가능으로 바뀐다 |
| 8 | `--profile` 기본을 DEFAULT로 | 시험 1·9 | 외상 칸 없는 프로필로 거절된다 |
| 9 | 수락 루프에서 `termCandidate`를 다시 부르지 않음 | 시험 3(같은 날 한도) | 둘째 계약이 엔진에서 거절되어 사라진다 |
| 10 | 거절 계측에서 `skippedNotOpen`을 후보 단위 거절로 셈 | 시험 10 | 후보 단위 수가 손 계산보다 크다 |
| 11 | v1 `risk-compare`의 `rules` 거절을 지움 | 시험 12 | v2 출력이 v1 L2 판정을 낸다 |
| 12 | `lateReceipts`에 부분 수금 청구서를 넣음 | 시험 6 | 지연·부분이 겹친다 |
| 13 | `requestedRisk`가 v2에서도 v1 메타를 냄 | 시험 9·11 | `meta.risk.rules`가 없고 워커 합치기 검사가 어긋난다 |
| 14 | `--risk-v2`일 때 `options.risk`를 비워 둠 | 시험 11 | `run.mjs`가 sha256을 넣지 않아 워커 실행이 실패한다 |
| 15 | `--risk-v2`의 `--seed-base` 필수 검사를 지움 | 시험 1 | 기준값 없는 v2 실행이 거절되지 않는다(E7) |
| 16 | `sim.ts`가 `rejectionUnits`를 `observeClosed`에 넘기지 않음 | 시험 10 | 실행 출력의 `rejectionsV2` 수가 0이 된다(E1) |
| 17 | 일곱 칸을 주선 계약에도 둠 | 시험 5 | 주선 계약에 키가 생긴다(E2) |

- 모두 되돌린 뒤 1절 1의 검사가 같고 `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 8. 완료 조건

1. 1절 1의 검사가 작업 전·후 같다(골든 둘, 비위험 400회 cmp, v1 R3 d03 출력·표 cmp, `risk-runner.test.ts`·`seed-base.test.ts` 무수정 통과).
2. 기존 시험 파일 변경 없음
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력이다.
   - `git status --porcelain --untracked-files=all`의 `??` 줄은 새 시험 파일과 결과 보고뿐이다.
3. 새 시험과 변형 17개가 기대대로다.
4. 첫 화면 gzip이 작업 전·후 같다(1절 4).
5. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
6. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `검사 18종, 실패 0종 (모드: 확인)`이다.
7. 결과 보고 `docs/ai/tasks/results/TASK-0068a.md`.

## 9. 고칠 수 있는 파일

- `src/engine/sim/cli.ts`, `d03.ts`, `risk-metrics.ts`, `risk-tables.ts`(`compareRisk` 첫머리의 `rules` 거절만), `operations-policy.ts`, `operations-metrics.ts`, `policies.ts`(`PolicyDecision`의 선택 칸만), `variants.ts`, `sim.ts`(단계 형 넓히기 + `decide()` 결과에서 `rejectionUnits`를 꺼내 `observeClosed`의 다섯째 선택 인수로 넘기기, E1)
- 새 파일 `src/engine/sim/risk-runner-v2.test.ts`
- `MANIFEST.json`(생성만), `docs/ai/tasks/results/TASK-0068a.md`
- 그 밖(`run.mjs`, 엔진 `src/engine/*.ts`, `src/content/**`, `data/**`, `schemas/**`, `src/ui/**`, 골든 파일·도구, 기존 시험 파일)은 고치지 않는다. 필요하면 멈추고 보고한다.

## 10. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 1절 1 검사와 첫 화면 gzip의 전·후
- CLI 도움말 전후, v2 `meta.risk` 예시, v2 출력 JSON의 `RiskContract`·`credit`·`rejectionsV2` 예시(시드 2001, 계약 하나)
- 시험 출력, 변형 표(실제로 실패한 시험 이름), 기제 시험 시드 결과, 5절 실행 비용
- 0068b에 넘길 것: 출력 JSON의 칸 이름·모양(위 예시), `bundleKindV2`, `saleKrwAtAcceptMinor`, `dateEligible`·`dateLimitEligible`, `rejectionsV2`
- 범위 밖에서 발견한 것, 질문

## 처리표(0068 개정 1의 이 지시서 몫)

| 출처 | 반영 자리 |
|---|---|
| H27-2 (b) | 머리말, 3.2 지연·부분 배타 정의 |
| E2 | 3.3 거절 계측, 시험 10, 변형 10 |
| E4 | 3.1 선택 시점·판매액(`:154`), 시험 3 같은 날 한도, 변형 9 |
| E5 | 시험 6, 변형 6·7 |
| E6 | 2.1 `options.risk`에 v2 단계, `--round`, 시험 11, 변형 13·14 |
| E7 | 2.2 기본 시나리오 (다), 시험 1 |
| E8 | 3.1 `termCandidate`, 시험 4 |
| E9 | 1절 5, 2.1 `simConfigV2`, 3.2 |
| E12 | 2.2 시드 규칙·도움말, 변형 5 이유 |
| E13 | 3.2 `unconfirmedMinor`, `saleKrwAtAcceptMinor` |
| E15 | 2.2 v1 도구의 v2 거절, 시험 12, 변형 11 |
| E16 | 변형 4 시험 이름, 시험 1 프로필 기본값, 시험 9 `simMain` |
| 0068b 몫 | E1·H27-1(L2 ②), E3(`d03TablesV2`), E10(a)·H27-2 (a)(진단 M), E11·H27-3(R0 열), E14(키 리터럴), **E13 사전 기대(0.44·0.59) 출처 또는 ‘없음’ 표기(진단 U)**, 6열 틀·문턱표·J 판정·J9·`risk-compare-v2`·`v2-report` |

## 개정 1 처리표(`PRECHECK-0068a-HUB-2026-10-24.md` 4절)

| 수정 | 반영 자리 |
|---|---|
| E1 | 3.3 경로(`sim.ts:44·57`), 9절 `sim.ts` 허용 범위, 변형 16 |
| E2 | 3.2 직접 무역에만 일곱 칸, 시험 5, 변형 17 |
| E3 | 3.1의 3(`:177`·`:182`) |
| E4 | 2.2 `USAGE` 전문, 시험 1 |
| E5 | 2.2 넘침 거절 표지와 상한, 시험 1 |
| E6 | 3.3 ‘시도한 짝·견적’ 정의, 시험 10 기대 수 |
| E7 | 2.2 `--seed-base` 필수, 시험 1, 변형 15 |
| E8 | 2.2 비rules-4의 두 정책 거절, 시험 1 |
| E9 | 처리표 0068b 몫 |
| E10 | 시험 12 입력 짝과 오류 문구 |
| E11 | 2.1 `rateAtV2`, 시험 6 `pDefaultBp` 10000/0 |
| E12 | 시험 11 시드 3개·워커 2 |
