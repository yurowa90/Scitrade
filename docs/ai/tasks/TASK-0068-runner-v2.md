# TASK-0068 경로 5 실행기 v2: rules-4 위험 단계 측정 도구(R0′~R4, 40시드, 판정표 v2)

- 지위: **개정 1(세션 A, 2026-10-24). 허브 사전 확인 전이다.** 초안(`52392d2`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0068-HUB-2026-10-24.md`(확인 21, 주요 9)에서 승인되지 않았다. 허브 결정 H27(개발 브랜치 `7e4ecee`)과 검수 5절 E1~E16을 반영했다. 처리는 끝의 처리표에 있다. **나누기 안은 부록에 있다(권고: 나눈다).**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0067a(+R1)·0067b(+R1)가 병합됐다(개발 브랜치 `b001681`, 기록 `1b56eb5`).
  - **`BASE`는 작업 트리를 만든 커밋이다.** 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- **기준 문서와 우선 규칙**
  - 기준: 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md`(승인) 1~4·6절, `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인) 2.4·2.6·7·10절, 허브 결정 H23~H27.
  - **판정 기준값·판정 종류는 판정표 v2를 따른다.** 함수 경계·CLI 이름·출력 모양은 이 지시서를 따른다. 판정표와 다르게 해야 할 이유가 생기면 멈추고 보고한다.
  - 허브가 승인한 판정표와의 차이(H27):

    | 판정표 v2 | 이 지시서 | 근거 |
    |---|---|---|
    | 문턱표 머리말(89행) ‘J9·L2 ②가 쓴다’ | L2 ②는 86행 정의대로 판본 1의 ‘늘어남 > 줄어듦’. 문턱표는 J9만 쓴다 | H27-1(머리말은 오기, 정오표) |
    | 3.1에 없는 행 | ‘진단 M’(판본 1 L3 연속성)을 판정표 밖 기록으로 낸다 | H27-2 (a) |
    | 진단 U의 ‘v1 대비 지연·부분 수금 건수’ | 내지 않는다 | H27-2 (b) |
    | 6열 틀의 R0(기록) 열 | v1 `--risk R0` 출력(같은 시드 묶음)을 선택 입력으로 받아 기록만. 없으면 ‘기록 없음’ | H27-3 |

- 범위 밖: 엔진(`src/engine/*.ts`), 자료, 화면, **측정**. 판정표 v2의 측정 시드(1061~1180)와 판본 1 시드(1001~1060)로 v2를 돌리지 않는다.
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 1절 1의 비위험 회귀 확인뿐이다(바이트 비교).

## 0. 앞선 검수에서 얻은 원칙(허브 전달)

1. **고정물 값은 서로 다르게 고른다.** 하한 ≠ 상한, 계수 ≠ 100, 두 정책·두 단계의 값이 같아지지 않게 한다.
2. **나머지가 생기는 값을 쓴다.** 시드 수는 홀수(39)와 짝수(40)를 둘 다, 동점 하나 이상.
3. **실제 R4 시뮬레이션 스모크 시험을 하나 둔다**(7절 시험 11).
4. **변형마다 ‘어느 시험이 왜 실패하는가’를 한 줄씩 적는다**(8절).

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **v1 측정 도구와 rules-1~3은 바이트로 같다.** 작업 전과 끝에 아래가 모두 같아야 한다. 어긋나면 고치기 전에 멈추고 보고한다.
   - `node tools/check_rules2_golden.mjs` → 0, `node tools/check_rules3_golden.mjs` → 0(로더 지문 포함)
   - 비위험 회귀: 작업 전 `node src/engine/sim/run.mjs run --out /tmp/TASK-0068-run-before.json`, 작업 끝 `node src/engine/sim/run.mjs run --out /tmp/TASK-0068-run-after.json`, 그 뒤 `cmp /tmp/TASK-0068-run-before.json /tmp/TASK-0068-run-after.json`
   - **v1 위험 실행 회귀**: 작업 전 `node src/engine/sim/run.mjs d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0068-v1r3-before.json`, 작업 끝 같은 명령으로 `/tmp/TASK-0068-v1r3-after.json`, 그 뒤 `cmp`. 자료를 바꾸지 않으므로 `marketRulesSha256`도 같다. 표 출력(표준 출력)도 각각 파일로 받아 `cmp`한다.
   - 기존 `src/engine/sim/risk-runner.test.ts`·`seed-base.test.ts`가 고치지 않은 채 통과한다.
2. **기존 시험 파일은 고치지 않는다.** 새 시험은 새 파일 `src/engine/sim/risk-runner-v2.test.ts`에 둔다.
3. **v1 출력에 키를 더하지 않는다.** `RiskMeta`·`RiskContract`·`RiskMetrics`·`metrics.operations`의 새 칸은 v2 실행(rules-4)에서만 둔다(값이 `undefined`인 키도 두지 않는다).
4. **실행기 코드는 첫 화면 묶음에 들어가지 않는다.** 작업 전·끝에 `npm run --silent build && node tools/check_bundle_size.mjs dist`의 첫 화면 gzip 바이트를 적는다. 바뀌면 멈추고 보고한다(0067b 병합본 132,576 B).
5. **위험 모듈 import 규칙**(E9, `risk-runner.test.ts:486-532`가 지킨다)
   - `../risk`의 함수는 보고서 파일 `risk-metrics.ts`·`risk-tables.ts`에서만 자유롭게 가져온다. 그 밖의 `src/engine/sim/**` 파일(새 시험·새 파일 포함)은 허용 목록(`krwToUsdMinor`, `usdToKrwMinor`, `rowCurrency`, `divHalfAway`, `withRiskLevel`)만 가져온다.
   - 그래서 `withRiskLevelV2`·`referenceRate`·`defaultFor`가 필요한 곳은 `risk-metrics.ts`에 둔 감싼 함수를 쓴다(2.1·3.2).
   - 정책 파일(`operations-policy.ts`·`policies.ts`·`variants.ts`)은 보고서 파일(`risk-metrics`·`risk-tables`)을 가져오지 않는다.
6. **측정하지 않는다.**
7. 커밋·푸시·브랜치 전환은 하지 않는다.

## 2. v2 실행 단계와 CLI

### 2.1 단계·설정·메타

- 형 `RiskLevelV2 = 'R0P' | 'R1' | 'R2' | 'R3' | 'R4'`. v1 `RiskLevel`(`R0`~`R3`)은 그대로다.
- 감싼 함수 `simConfigV2(config, level: RiskLevelV2, profileId: string)`를 **`risk-metrics.ts`**에 둔다. 안에서 `withRiskLevelV2(config, level, loadRiskProfile(profileId), loadCreditProfile(profileId))`를 부른다. `d03.ts`와 새 시험은 이 함수만 쓴다(1절 5).
- v2 설정 = `simConfigV2(withLateMode(loadScenario(id), late), level, profileId)`.
- **v2 단계도 `options.risk`에 담는다**(E6). `d03Options`는 `--risk-v2 X`를 받으면 `options.risk = X`, `options.riskV2 = true`로 둔다. 그래서 `run.mjs`는 고치지 않아도 `marketRulesSha256`을 넣고 워커를 나눈다.
- `requestedRisk(options)`는 `riskV2`일 때 v2 메타를 낸다: `{ rules: 'M2a-rules-4', level, profileId, tuningRound, marketRulesSha256 }`(키 순서 그대로). v1 메타 모양은 그대로다. `mergeD03`의 메타 일치 검사는 이 모양으로도 동작해야 한다.
- **프로필 선택**: `--profile ID`(기본 `RISK_PROFILE_V2`). 외상 칸이 없는 프로필(`loadCreditProfile`이 예외)은 사용법 오류(종료 2). 출력 직전 `meta.risk.profileId`가 고른 ID와 같은지 검사한다. v1의 DEFAULT 선택은 그대로다.
- `--round`는 `--risk-v2`와 함께 쓸 수 있다(E6). 값은 `tuningRound`로 메타에 들어간다.

### 2.2 CLI(`src/engine/sim/cli.ts`)

- `sim d03`에 `--risk-v2 R0P|R1|R2|R3|R4`와 `--profile ID`를 더한다.
  - `--risk`와 `--risk-v2`는 함께 쓸 수 없다(종료 2). `--profile`은 `--risk-v2`와만 쓴다.
  - **`--risk-v2`이고 `--scenarios`가 없으면 시나리오는 (다)(`SCENARIO_M2_OPS_COS_LAVER`)다**(E7). (다)가 아닌 시나리오를 주면 종료 2.
- **시드 수**(E12)
  - `--seeds N`의 상한을 40으로 넓힌다. 기본은 20.
  - `--seed-base B`가 있으면 시드 목록은 `B .. B+N−1`이다. `B + N − 1 ≤ Number.MAX_SAFE_INTEGER`가 아니면 종료 2.
  - **`--seed-base` 없이 `N > 20`이면 종료 2**(지금은 20개로 말없이 잘린다).
  - `--seed-from`·`--seed-to`는 이 목록의 번호다. 인수 없는 v1 실행의 시드 목록은 지금과 같다.
- 도움말(cli.ts:19-27): 26-27행을 고친다. 새 문장: `D03의 --seed-base N은 시드 목록을 N~N+(시드 수−1)로 바꿉니다(시드 수 기본 20, 최대 40). --seed-base 없이 시드 수는 20 이하입니다. 분할 번호는 이 목록에 적용됩니다.` 그리고 세 줄을 더한다: `sim d03 --risk-v2 R0P|R1|R2|R3|R4 [--profile ID] …`, `sim risk-compare-v2 A B`, `sim v2-report R0P R1 R2 R3 R4 [--r0 PATH]`. 다른 줄은 그대로다.
- 새 명령
  - `sim risk-compare-v2 A B`: v2 두 출력의 층 비교(4.4).
  - `sim v2-report R0P R1 R2 R3 R4 [--r0 PATH]`: 다섯 v2 출력(필수)과 v1 `--risk R0` 출력(선택, H27-3)으로 6열 틀(4.1)을 낸다. 다섯 출력의 `rules`·`profileId`·`tuningRound`·`marketRulesSha256`·`engineVersion`·`dataVersion`·`format`·`lateMode`·`scenarioIds`·시드 집합이 같고, 층이 R0P~R4 하나씩이어야 한다. `--r0` 출력은 v1 메타(`rules` 없음, 층 R0)이고 같은 시나리오·시드 집합이어야 한다. 어긋나면 종료 2.
- **v1 도구는 v2 출력을 거절한다**(E15): v1 `risk-compare`와 `--tables-from`은 `meta.risk.rules`가 있는 출력을 종료 2로 거절한다.

### 2.3 묶음(판정표 v2 1절)

- 정책 `TERM_GREEDY`, `CREDIT_AWARE`를 `ACCEPTANCE_IDS`에 더한다(v1 `d03PolicyIds`에는 넣지 않는다).
- v2 묶음 함수 `d03PolicyIdsV2(level)`와 묶음 종류 `bundleKindV2(level): 'full' | 'reduced'`
  - `full`(R0P·R4): `d03PolicyIds('base')`에서 `FOCUS`를 뺀 것 + `MARGIN_BUFFER`·`TERM_GREEDY`·`CREDIT_AWARE`
  - `reduced`(R1·R2·R3): `IDLE`·`NO_FX`·`MAX_CONTRIBUTION`·`LATE_OK`·`MARGIN_BUFFER`·`TERM_GREEDY`·`CREDIT_AWARE`
- `--risk-v2`이고 `--policies`가 없으면 이 묶음을 쓴다.

## 3. 정책과 지표

### 3.1 외상 조건 선택(`operations-policy.ts`, E4·E8)

- **함수 하나**(E8): `termCandidate(state, config, c: DirectCandidate, acceptance: string, day: number): { creditTermId: CreditTermId | undefined; sale: number; contribution: number; preview: QuotePreview }`를 내보낸다.
  - `acceptance`가 `TERM_GREEDY`·`CREDIT_AWARE`가 아니면 `creditTermId: undefined`, `sale`·`contribution`·`preview`는 `c`의 지금 값 그대로다(v1 동작 불변).
  - 두 정책이면 `creditTermOptions(state, config, c.buyOfferId, c.sellOfferId, c.quantity)`(`../readers`)를 부르고 고른다.
    - `TERM_GREEDY`: `D30` → `D15` → `BASE` 순으로 처음 `allowed`인 것.
    - `CREDIT_AWARE`: `grade === 'C'`이면 `BASE`, 아니면 `TERM_GREEDY`와 같다.
  - 고른 조건의 `saleAmountMinor`를 `sale`로, `paymentDueDay`를 결제일로 `preview`를 다시 부르고, `contribution = decisionContribution(preview, sale, c.purchaseCurrency)`다. 대손·이자는 넣지 않는다.
- **선택 시점과 쓰는 판매액**(하나로 못박음, E4)
  1. 후보를 만들 때(`operations-policy.ts:141-150`) 직접 무역 후보마다 그때의 `current`로 `termCandidate`를 부른다. 그 결과의 `sale`·`contribution`이 **정렬 키**(`:154`의 정렬)와 **0 이하 거르기**(`:156`)에 쓰인다.
  2. 수락 루프 안에서 그 후보를 시도하기 직전, **최신 `current`로 `termCandidate`를 다시 부른다.** 같은 날 앞선 수락이 노출액을 늘려 조건이 바뀌었을 수 있기 때문이다. 다시 낸 `contribution`이 0 이하이면 건너뛴다(거절 사유 `credit`, 3.3). 정렬은 다시 하지 않는다.
  3. 다시 낸 `sale`을 지연 감액 계산(`:177`, `:185`의 `c.sale` 자리)과 명령에 쓴다. 명령 `ACCEPT_TRADE`에는 `creditTermId`를 넣는다(BASE도 명시).
- 기준 회사 `MAX_CONTRIBUTION`과 다른 v1 정책은 `creditTermId` 키를 넣지 않는다.
- 정책 파일은 보고서 파일을 가져오지 않는다(1절 5). `creditTermOptions`는 `../readers`에서 온다.

### 3.2 `RiskContract`의 v2 칸과 성분(`risk-metrics.ts`)

- v2 실행에서만 `RiskContract`에 **일곱 칸**을 둔다: `creditTermId`, `creditEligible`, `grade`(판매 거래처 등급, `config.operations.risk.profile.collections.byCounterparty`), `saleAmountMinor`, `acceptedDay`, `paymentDueDay`, `saleKrwAtAcceptMinor`(= `usdToKrwMinor(saleAmountMinor, referenceRate(cfg, seed, acceptedDay))`, J9 분모, E13).
- `components`는 `contractRiskReport`의 것을 그대로 옮긴다(rules-4에서는 `default`·`carry`가 들어 있다).
- `riskMetrics`의 `level` 인수를 `RiskLevel | RiskLevelV2`로 넓힌다. 분석값은 `R0`이 아닌 모든 단계(R0P 포함)에서 낸다.
- v2 `RiskMetrics`에 `credit` 칸(진단 U 재료):

  | 칸 | 정의 |
  |---|---|
  | `defaultsConfirmed` | `WRITTEN_OFF` 청구서 수 |
  | `badDebtMinor` | `BAD_DEBT` 분개 합 |
  | `defaultsUnconfirmed` | 끝에 `OVERDUE`이고 `defaultFor(...)`가 참인 직접 무역 청구서 수(정책이 끝난 뒤의 읽기라 미래 누설이 아니다) |
  | `unconfirmedMinor` | 그 청구서들의 남은 금액 합(E13) |
  | `carryMinor` | `RECEIVABLE_CARRY` 분개 합 |
  | `limitBlocked` | `creditEligible.limitBlocked`가 비지 않은 계약 수 |
  | `termCounts` | 직접 무역 계약의 `creditTermId`별 수 `{ BASE, D15, D30 }` |
  | `partialReceipts` | `RECEIPT-RCPT-{inv}-2` 분개가 있는 청구서 수(부분 수금) |
  | `lateReceipts` | `PAID`이고, `RECEIPT-RCPT-{inv}` 분개 **하나만** 있으며(부분·회수 제외) 그 날짜 > `dueDay`인 청구서 수(지연 전액 수금). 그래서 둘은 겹치지 않는다(H27-2 (b)) |

- `defaultFor`·`referenceRate`는 이 보고서 파일에서만 부른다(1절 5).

### 3.3 거절 계측(판정표 v2 3.4, E2)

- 파일 경계: `operations-policy.ts`가 세고, `policies.ts`의 `PolicyDecision`에 선택 칸 `rejectionUnits`로 넘기고, `operations-metrics.ts`가 모은다. 출력은 **rules-4 실행의 `metrics.operations`에만** `rejectionsV2` 칸으로 둔다(v1 출력 불변).
- 정의(하루 결정 단위)
  - **후보 단위**: 지금 `rejections`와 같은 사유별 수(`funds`·`storage`·`handling`·`sailing`·`staff`·`onTime`) + 새 사유 `credit`(3.1의 2에서 다시 낸 기여가 0 이하).
  - **짝 단위**: 그날 시도한 (매입, 판매) 짝 가운데 어느 수량도 수락되지 않은 짝 수.
  - **견적 단위**: 그날 시도한 매입 견적 가운데 어느 짝·수량도 수락되지 않은 견적 수.
  - **OPEN 아님 건너뜀**: 같은 날 앞선 수락으로 견적이 이미 `OPEN`이 아니어서 건너뛴 후보 수(`:156`의 두 번째 조건). 거절에 넣지 않고 따로 센다.
- `rejectionsV2 = { candidate: { …사유: 수 }, pair: 수, quote: 수, skippedNotOpen: 수 }`(실행 전체 합).
- v1 `rejections`의 값과 모양은 그대로다(`credit` 사유는 v1 칸에 넣지 않는다).

## 4. 판정 틀(판정표 v2 3절)

### 4.1 6열 틀과 키(E3·E14·H27-3)

- 새 표 `RISK_JUDGMENT_KINDS_V2`의 **키 목록**(리터럴, 출력 행 이름도 이와 같다):
  `J1`, `J2`, `J3`, `J4a~c`, `J4d`, `J5`, `J6`, `J7(새 정의)`, `L1`, `J9`, `진단 J8`, `진단 L4`, `진단 V`, `진단 T`, `진단 C`, `진단 F`, `진단 B`, `진단 U`, `진단 M`, `진단 거절`
- 열은 `R0`·`R0P`·`R1`·`R2`·`R3`·`R4` **여섯**이고 이름으로 찾는다(위치 계산 금지). R0 열의 종류는 모두 `기록`이다(새 종류 `'기록'`을 `JudgmentKind`에 더하지 않고 v2 전용 형으로 둔다).

  | 키 | R0P | R1 | R2 | R3 | R4 |
  |---|---|---|---|---|---|
  | J1 | 판정 | 판정 | 판정 | 판정 | 판정 |
  | J2 | 진단 | 해당 없음 | 해당 없음 | 해당 없음 | 진단 |
  | J3, J5, J6 | 판정 | 해당 없음 | 해당 없음 | 해당 없음 | 판정 |
  | J4a~c | 판정 | 판정 | 판정 | 판정 | 판정 |
  | J4d | 진단 | 진단 | 진단 | 진단 | 판정 |
  | J7(새 정의) | 진단 | 진단 | 진단 | 진단 | 판정 |
  | L1 | 진단 | 진단 | 진단 | 진단 | 판정 |
  | J9 | 해당 없음 | 판정 | 진단 | 진단 | 진단 |
  | 진단 J8, 진단 L4, 진단 V | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
  | 진단 T | 해당 없음 | 해당 없음 | 진단 | 진단 | 진단 |
  | 진단 C, 진단 B | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
  | 진단 F | 해당 없음 | 진단 | 해당 없음 | 진단 | 진단 |
  | 진단 U, 진단 거절 | 진단 | 진단 | 진단 | 진단 | 진단 |
  | 진단 M | 해당 없음 | 진단 | 진단 | 진단 | 진단 |

- **R0 열**(H27-3): `v2-report --r0 PATH`가 있으면 그 v1 출력의 기준 회사 값으로 J1(실패 수·끝 미지급 수), J4a~c 재료, J7(새 정의) 중앙, L1 손실 수/계약 수만 ‘기록: …’으로 적는다. 다른 키와 `--r0`이 없을 때는 `기록 없음`.
- L2는 `risk-compare-v2`에서만 낸다(4.4).

### 4.2 v2 표 구성 `d03TablesV2`(별도 함수, E3)

v1 `d03Tables`·`riskTables`는 고치지 않는다(바이트 불변). v2는 새 함수 `d03TablesV2(output)`(새 파일 `risk-tables-v2.ts` 가능)가 낸다.

| 절 | v2에서 | 비고 |
|---|---|---|
| ① 기준 표 | 남김 | 정책 목록: `IDLE`, `NO_FX`, `MAX_CONTRIBUTION`, `LATE_OK`, `MAX_CONTRIBUTION~fx:react`(full만), `MARGIN_BUFFER`, `TERM_GREEDY`, `CREDIT_AWARE`. 비교 값은 분석값 |
| ② 투자만 | full만 | reduced는 절 이름과 ‘해당 없음(축소 묶음)’ |
| ③·④ 고용 표 | full만 | **reduced 판단은 `bundleKindV2(level)`로 한다**(R3도 축소). v1의 `['R1','R2']` 검사를 쓰지 않는다 |
| ⑤ J 판정 | 남김 | 행: J1, J2(진단), J3, J4a~c, J4d, J5, J6, J7(새 정의). **J2b·J7(옛 정의)은 내지 않는다.** J3 후보에서 `TERM_GREEDY`·`CREDIT_AWARE`·`MARGIN_BUFFER`도 뺀다(지금 제외 목록에 더함) |
| J6 칸별 표, ⑥ 1위 분포, ⑧ 고용일 | full만 | reduced는 ‘해당 없음(축소 묶음)’ |
| ⑦ 사업별 비중 | full만, ‘USD 몫만·진단’ | v1과 같은 표시 |
| ⑨ 위험 판정 | 남김 | 행: L1, J9, 진단 J8·L4·V·T·C·F·B·U·M·거절. **L0·L3·D는 내지 않는다** |
| 변형 사이 차이 | 내지 않음 | v2는 (다) 하나 |

- J4d(단계 표): R4에서 ‘M′ 없음 — v2-report에서 판정’, 다른 단계는 분석값 중앙과 ‘진단’.

### 4.3 기준값(판정표 v2 3.2)

- v2 전용 상수(v1 상수 그대로)
  - **문턱표 m = 10..40**: 판정표 v2 3.2 표 그대로(10→9 … 40→26). m < 10이면 실패. **J9만 쓴다**(H27-1).
  - J1: 기준 회사 실패 0, 끝 원화 미지급 0.
  - J3: `20 × strongest < 17 × n`. J5: `20 × gains ≤ 3 × n`. J4a·J4b: v1 그대로. **J4c**: `4 × NO_FX 실패 ≥ 3 × n`.
  - **J4d**(R4, `v2-report`에서만): R4 기준 회사 분석값 중앙이 `1,069,200` 이상, **M′** 이하. M′ = 같은 보고의 R0P 기준 회사 분석값 중앙. 같으면 통과.
  - **J7(새 정의)**: v1 식, 남은 시드 **20 미만이면 실패**.
  - L1: v1 식(5% 이상 25% 이하).
  - **J9**(R1): 시드마다 `Σ|components.fx| ÷ Σ saleKrwAtAcceptMinor`(직접 무역)를 `TERM_GREEDY`·기준 회사가 각각 낸다. 비율 비교는 정수 교차곱, 동점은 m에서 뺀다. `TERM_GREEDY`가 큰 시드 수 ≥ 문턱이면 통과.
- **진단 사전 기대를 같은 줄에 적는다**(E13 출처 포함)

  | 진단 | 값 | 사전 기대(출처) |
  |---|---|---|
  | 진단 J8 | `TERM_GREEDY` > 기준 회사 시드 수 | 중앙 35/40, 띠 8~32 안 확률 0.14(DESIGN-v2 2.4) |
  | 진단 L4 | `CREDIT_AWARE` > 기준 회사 시드 수 | 중앙 36/40(DESIGN-v2 2.4) |
  | 진단 V | 시드마다 `CREDIT_AWARE` − `TERM_GREEDY` 분석값: 중앙·사분위·동점·양수·음수 | 평균 +21 USD/시드, 동점 27, TG 우세 11.8, CA 우세 1.2(DESIGN-v2 2.4) |
  | J9 | 위 지표의 시드 수 | 33 대 7(DESIGN-v2 2.6) |
  | 진단 U 관문 | 날짜+한도 비BASE 가능 비율(`TERM_GREEDY`, 보고만) | 31.5%(DESIGN-v2 2.2, R3 대리값) |
  | 진단 U 대손 | 기준 회사 확정 대손 수/시드, 확정+미확정 수/시드 | **확정 0.44, 합 0.59.** 출처: 세션 A 계산, `DESIGN-v2` 2.0의 `diag/m4.json`(R3, 시드 1001~1040, 기준 회사 425계약)에 V2 등급 확률을 넣어 `Σ p_등급 × 1[실효 결제일 + 15 ≤ 90] ÷ 40`(확정), 같은 식에서 절단을 뺀 값(합). **J1 일회 점검(시드 2001~2010)에서 확정 8건(기대 약 4.4)** |

### 4.4 층 비교 `risk-compare-v2`(L2, H27-1)

- 순서는 R0P → R1 → R2 → R3 → R4, 바로 다음 층만. 메타 일치 검사는 v1 `compareRisk`와 같고 `rules`·`profileId`도 본다.
- **L2 ①·②는 판본 1 식 그대로다**: ① 손실 비율 +1.0%p 이상(교차곱), ② 손실 수가 늘어난 시드 > 줄어든 시드(기준 회사). 문턱표는 쓰지 않는다(H27-1).
- 판정 종류: **R2→R3, R3→R4는 판정**, R0P→R1·R1→R2는 진단.
- R0P→R1에서는 판본 1식 J9 진단(`TERM_GREEDY`의 손실 비율 차이 %p와 시드 증감)을 함께 낸다. 사전 기대: `TERM_GREEDY` − 기준 회사 = 0.00%p.
- v1의 `(iii)`은 내지 않는다.

### 4.5 진단 U·거절·M

- **진단 U**: 단계마다 정책별로 `credit` 칸 전체, 날짜 규칙상 비BASE 가능 비율, 날짜+한도 비BASE 가능 비율(`TERM_GREEDY`, 25% 관문, 보고만). 날짜 가능 조건은 계약에서 다시 계산한다: 오퍼 결제일 = `paymentDueDay − days(creditTermId)`, 조건 t 가능 ⇔ `오퍼 결제일 + days_t + lateMaxDays ≤ campaignDays`. 날짜+한도 가능 ⇔ 날짜 가능 조건 가운데 `limitBlocked`에 없는 것이 하나라도 있음. v1 대비 건수는 내지 않는다(H27-2 (b)). 판정표 2절대로 판본 1 R3 값과 직접 견주지 않는다고 표 아래에 적는다.
- **진단 거절**: 정책별 `rejectionsV2` 합.
- **진단 M**(H27-2 (a)): ‘판정표 v2 3.1 밖의 기록(판본 1 L3 연속성)’이라고 표시한다. 원시 값만 낸다: `MARGIN_BUFFER`와 기준 회사의 손실 수/계약 수, 시드 짝의 MARGIN_BUFFER 우세 수/동점 뺀 짝 수, `MARGIN_BUFFER` 대상 계약 수. **‘통과’·‘실패’·‘충족’이라는 말과 문턱을 쓰지 않는다.** v1 `marginComparison`은 고치지 않고, v2용 새 함수가 원시 값을 계산한다.

## 5. 기제 시험(H24-1)

판정이 아니라 시험이다(7절 시험 9·10).

## 6. 실행 비용 기록

결과 보고에 적는다(측정이 아니다): 시드 2001~2003, (다), `--risk-v2 R4` 전체 묶음 1회의 걸린 시간·워커 수·실행 수. 40시드·다섯 단계로 늘렸을 때의 추정 시간(판정표 v2 1절의 ‘한 회차 약 1시간 40분’과 대조).

## 7. 시험(새 파일 `src/engine/sim/risk-runner-v2.test.ts`)

시드 2001 이상. 0절 원칙. 위험 모듈은 1절 5대로 감싼 함수로만 쓴다.

1. **CLI·옵션**(E7·E12·E18): `--risk`·`--risk-v2` 동시 거절, `--profile` 단독 거절, `--profile RISK_PROFILE_DEFAULT` 거절, **`--profile`이 없으면 `profileId = RISK_PROFILE_V2`**, **`--scenarios`가 없으면 (다)**, (다) 밖 거절, `--seeds 41` 거절, **`--seed-base` 없이 `--seeds 21` 거절**, `--seeds 40 --seed-base 2001`의 목록 길이 40·끝 **2040**, `B+N−1`이 안전 정수를 넘으면 거절, `--round 2 --risk-v2 R1`의 `tuningRound` 2, 인수 없는 v1 시드 목록이 지금과 같은 20개, 도움말 26-27행의 새 문장.
2. **묶음**: `d03PolicyIdsV2('R0P')`·`('R4')`에 `FOCUS` 없음·세 정책 있음, `('R1')`·`('R3')`이 일곱 정책, `bundleKindV2('R3') === 'reduced'`. v1 `d03PolicyIds`에 두 정책 없음.
3. **정책 조건 선택**(손 고정물, E4)
   - `TERM_GREEDY`: D30 허용 오퍼 → D30, D30이 날짜로 막히고 D15 허용 → D15, 둘 다 한도에 막힘 → BASE. 세 경우를 서로 다른 오퍼로.
   - `CREDIT_AWARE`: C 거래처 → BASE, A·B → `TERM_GREEDY`와 같은 조건.
   - **같은 날 한도 채움**: 같은 B 거래처의 두 후보(서로 다른 수량·단가)가 있고, 첫 수락이 D30으로 한도를 거의 채운다. 하루 결정 뒤 둘째 계약은 BASE(또는 D15)다. 생성 시점 조건으로 수락하면 엔진이 ‘외상 한도 초과’로 거절해 둘째 계약이 없다.
   - 기준 회사 명령에 `creditTermId` 키 없음(`Object.hasOwn`).
4. **`termCandidate` 직접 호출**(E8): 가산이 있는 조건의 `contribution`이 같은 후보의 BASE `contribution`보다 `sale` 차이만큼 크다(나머지가 생기는 수량·단가). v1 정책 이름이면 `creditTermId`가 `undefined`이고 값이 후보 그대로.
5. **`RiskContract`**: v2 실행 계약에 일곱 칸이 있고 값이 상태·`simConfigV2` 환율과 같다. v1 실행 계약에는 키가 없다.
6. **6열 틀**: 4.1 표 전체를 리터럴로 대조. 키 목록이 4.1 리터럴과 같고, **v1에만 있는 키(J2b, J7(옛 정의), L0, L3, D)가 없다**(E21). 열을 이름으로 찾음(`R0P`가 R0 열로 읽히지 않음).
7. **문턱표**: m = 10..40 전체가 판정표 v2 표와 같고, m = 9는 실패. 각 m에서 `B(m, 0.5)` 한쪽 p ≤ 0.05인 최소 문턱인지 정확한 유리수로 다시 계산해 대조.
8. **판정 식**(손으로 만든 실행 목록, 시드 수 39와 40): J3(34/40 경계), J5(6/40), J4c(30/40), J7 남은 시드 19·20 경계, L1 경계, J4d M′ 경계(같으면 통과), J9(동점 포함 m, 교차곱), 진단 J8·L4·V 집계(동점·양수·음수). 진단 M 행에 ‘통과’·‘실패’·‘충족’ 문자열이 없다(H27-2 (a)).
9. **기제 시험 — 손 고정물**(H24-1): 날짜상 비BASE가 가능한 C 거래처 판매 오퍼와 A·B 오퍼가 있는 고정 상태에서 하루 결정을 내리면, `CREDIT_AWARE`의 C 계약은 BASE, `TERM_GREEDY`의 C 계약은 비BASE, A·B 계약의 조건은 두 정책이 같다.
10. **기제 시험 — 시드**: 시드 2001 이상 몇 개(최대 10)의 R4 실행에서 `CREDIT_AWARE`의 C 비BASE 계약 0건. `TERM_GREEDY`의 C 비BASE가 1건 이상인 시드를 찾으면 그 시드를 적는다. 못 찾으면 ‘손 고정물로만 확인’이라고 결과 보고에 적고 통과로 둔다.
11. **R4 스모크**(E18): `simMain(['d03', '--risk-v2', 'R4', '--policies', 'MAX_CONTRIBUTION,TERM_GREEDY,CREDIT_AWARE', '--seed-base', '2001', '--seeds', '2'], io)`(워커 1, CLI 문자열 인수)가 예외 없이 끝나고, 표에 4.2 ⑨의 행 이름이 모두 나오고, `meta.risk`가 2.1 모양이며, 진단 U의 `termCounts` 합이 직접 무역 수와 같다. 60초 이내.
12. **비교와 보고**: `risk-compare-v2`가 R0P→R1, R3→R4를 받고 R1→R3·R4→R3를 거절. 메타가 다르면 거절. R2→R3·R3→R4는 ‘판정’, R0P→R1·R1→R2는 ‘진단’. **L2 ② 경계(m = 40): 늘어남 21·줄어듦 19는 통과, 20·20은 실패**(H27-1). `v2-report`가 다섯 단계를 하나씩 요구하고 J4d에 R0P 중앙을 M′로 쓴다(R0P·R4 중앙이 다른 손 고정물). `--r0`이 있으면 R0 열에 ‘기록:’, 없으면 ‘기록 없음’. **v1 `risk-compare`와 `--tables-from`이 v2 출력을 종료 2로 거절**(E15).
13. **v1 보존**: v1 `riskTables`·`compareRisk` 출력 문자열이 BASE 리터럴과 같은 작은 손 고정물 하나.
14. **진단 U 집계**(E5): `riskMetrics`를 직접 부르는 손 상태로 확정 대손 1·미확정 대손 2(서로 다른 수), `unconfirmedMinor`, `lateReceipts`·`partialReceipts`가 겹치지 않음(같은 상태에 지연 전액 1·부분 1·회수 1), `limitBlocked` 계약 1, **`lateMaxDays` 경계 오퍼**(오퍼 결제일 + days + 15가 campaignDays와 같음·1 큼)의 날짜 가능 판정.
15. **거절 계측**(E2): 손 고정물에서 하루 결정을 내려 후보·짝·견적 단위 수와 `skippedNotOpen`이 손 계산과 같다(같은 매입 견적의 두 판매 짝 가운데 하나가 수락되어 다른 짝이 OPEN 아님으로 건너뛰는 경우 포함). v1 실행의 `metrics.operations`에 `rejectionsV2` 키가 없다.
16. **워커 바이트**(E6): 같은 v2 실행(`--risk-v2 R1`, 시드 2001~2002, 정책 둘)을 워커 1과 2로 돌린 출력이 바이트로 같다(`run.mjs`를 자식 과정으로, 출력은 `os.tmpdir()`).

## 8. 변형 시험(임시로 고치고 되돌림)

각 줄의 ‘이유’는 그 시험이 왜 실패하는지다.

| 번호 | 변형 | 실패하는 시험 | 이유 |
|---|---|---|---|
| 1 | `TERM_GREEDY`의 순서를 `D15 → D30 → BASE`로 | 시험 3 | D30 허용 오퍼에서 D15를 고른다 |
| 2 | `CREDIT_AWARE`의 C 판정을 지움 | 시험 3·9 | C 계약이 비BASE가 된다 |
| 3 | `termCandidate`가 기여에 BASE 판매액을 씀 | 시험 4 | 기여 차이가 0이 된다 |
| 4 | v2 `RiskContract` 칸을 v1에도 넣음 | 시험 5, 1절 1의 v1 R3 cmp | v1 출력에 키가 생긴다(E17) |
| 5 | 6열 틀을 위치 계산(`Number(level[1])`)으로 | 시험 6 | `R0P`가 R0 열(기록)로 읽힌다 |
| 6 | 문턱표 m = 39를 25로 | 시험 7 | 유리수 재계산과 다르다 |
| 7 | J7 남은 시드 문턱을 10으로 | 시험 8 | 19개 남은 경우가 통과한다 |
| 8 | J4d의 M′를 R4 중앙으로 | 시험 12 | 손 고정물에서 R0P 중앙과 R4 중앙이 다르다 |
| 9 | J9의 분모를 판매액 대신 1로 | 시험 8 | 정책마다 판매액이 달라 비교 결과가 바뀐다 |
| 10 | `risk-compare-v2`가 R1→R3를 허용 | 시험 12 | 바로 다음 층 검사가 빠진다 |
| 11 | `--seed-base` 목록 길이를 20 고정으로 되돌림 | 시험 1 | 40개 목록의 끝이 2040이 아니라 2020이 된다(E12) |
| 12 | `defaultsUnconfirmed`를 `WRITTEN_OFF` 수로 | 시험 14 | 확정 1·미확정 2가 같은 값이 된다(E5) |
| 13 | 진단 U의 날짜 가능 계산에서 `lateMaxDays`를 뺌 | 시험 14 | 경계 +1 오퍼가 가능으로 바뀐다(E5) |
| 14 | `--profile` 기본을 DEFAULT로 | 시험 1·11 | 외상 칸 없는 프로필로 거절된다 |
| 15 | 수락 루프에서 `termCandidate`를 다시 부르지 않음 | 시험 3(같은 날 한도) | 둘째 계약이 엔진에서 거절되어 사라진다(E4) |
| 16 | L2 ②에 문턱표(m = 40 → 26)를 씀 | 시험 12 | 21·19가 실패로 바뀐다(H27-1) |
| 17 | 거절 계측에서 `skippedNotOpen`을 후보 단위 거절로 셈 | 시험 15 | 후보 단위 수가 손 계산보다 크다 |
| 18 | v1 `risk-compare`의 `rules` 거절을 지움 | 시험 12 | v2 출력이 v1 L2 판정을 낸다(E15) |
| 19 | `lateReceipts`에 부분 수금 청구서를 넣음 | 시험 14 | 지연·부분이 겹친다(H27-2 (b)) |
| 20 | 진단 M에 ‘충족’ 문자열을 냄 | 시험 8 | H27-2 (a) 단언 |

- 모두 되돌린 뒤 1절 1의 검사가 같고 `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 9. 완료 조건

1. 1절 1의 검사가 작업 전·후 같다(골든 둘, 비위험 400회 cmp, v1 R3 d03 출력·표 cmp, `risk-runner.test.ts`·`seed-base.test.ts`).
2. 기존 시험 파일 변경 없음
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력이다.
   - `git status --porcelain --untracked-files=all`의 `??` 줄은 새 시험 파일, `src/engine/sim/risk-tables-v2.ts`(만들었다면), 결과 보고뿐이다(E19).
3. 새 시험과 변형 20개가 기대대로다.
4. 첫 화면 gzip이 작업 전·후 같다(1절 4).
5. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
6. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `검사 18종, 실패 0종 (모드: 확인)`이다.
7. 결과 보고 `docs/ai/tasks/results/TASK-0068.md`.

## 10. 고칠 수 있는 파일

- `src/engine/sim/cli.ts`, `d03.ts`, `risk-metrics.ts`, `risk-tables.ts`(v1 `risk-compare`·`--tables-from`의 `rules` 거절만), `operations-policy.ts`, `operations-metrics.ts`, `policies.ts`(`PolicyDecision`의 선택 칸만), `variants.ts`, `sim.ts`(단계 형 넓히기만)
- 새 파일 `src/engine/sim/risk-tables-v2.ts`(선택), `src/engine/sim/risk-runner-v2.test.ts`
- `MANIFEST.json`(생성만), `docs/ai/tasks/results/TASK-0068.md`
- 그 밖(`run.mjs`, 엔진 `src/engine/*.ts`, `src/content/**`, `data/**`, `schemas/**`, `src/ui/**`, 골든 파일·도구, 기존 시험 파일)은 고치지 않는다. 필요하면 멈추고 보고한다.

## 11. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 1절 1 검사와 첫 화면 gzip의 전·후
- CLI 도움말 전후, v2 `meta.risk` 예시
- 4.1 표와 실제 `RISK_JUDGMENT_KINDS_V2`, 문턱표 재계산 출력, `d03TablesV2` 표본(시드 2001~2002)
- 시험 출력, 변형 표(실제로 실패한 시험 이름), 기제 시험 시드 결과, 6절 실행 비용
- 측정 전에 허브가 할 일: 판정표 v2 0절 고정 기록, 정오표(문턱표 머리말, H27-1), 측정 명령 목록(R0P~R4 × 기준·표본 밖 1, v1 `--risk R0` 같은 시드 묶음, `v2-report`, `risk-compare-v2` 네 쌍)
- 범위 밖에서 발견한 것, 질문

## 처리표(`PRECHECK-0068-HUB-2026-10-24.md` 5절, H27)

| 수정 | 반영 자리 |
|---|---|
| E1·H27-1 | 머리 이탈 표, 4.3 문턱표는 J9만, 4.4 L2 ②, 시험 12 경계, 변형 16 |
| E2 | 3.3 거절 계측, 4.1 ‘진단 거절’, 시험 15, 변형 17, 10절 허용 파일 |
| E3 | 4.2 표 구성, `d03TablesV2`, `bundleKindV2`, 시험 6 |
| E4 | 3.1 선택 시점·판매액, `:154`, 시험 3 같은 날 한도, 변형 15 |
| E5 | 시험 14, 변형 12·13 |
| E6 | 2.1 `options.risk`에 v2 단계, `--round`, 시험 16 |
| E7 | 2.2 기본 시나리오 (다), 시험 1 |
| E8 | 3.1 `termCandidate`, 시험 4 |
| E9 | 1절 5, 2.1 `simConfigV2`, 3.2 |
| E10·H27-2 | 4.5 진단 M, 3.2 지연·부분 배타 정의, 머리 이탈 표 |
| E11·H27-3 | 2.2 `--r0`, 4.1 R0 열 |
| E12 | 2.2 시드 상한·N>20 거절·도움말, 변형 11 이유 |
| E13 | 4.3 사전 기대 출처, `unconfirmedMinor`, `saleKrwAtAcceptMinor` |
| E14 | 4.1 키 리터럴 |
| E15 | 2.2 v1 도구의 v2 거절, 시험 12, 변형 18 |
| E16 | 변형 4 시험 이름, 시험 1 프로필 기본값, 9.2 허용 목록, 시험 11 `simMain` |

## 부록. 나누기 안(권고: 나눈다)

| 지시서 | 절 | 내용 | 시험·변형 |
|---|---|---|---|
| **0068a** 실행기 골격·정책·칸 | 1, 2(단 `risk-compare-v2`·`v2-report` 명령 제외), 3, 4.5의 U·거절 재료 계산 | `--risk-v2`·`--profile`·시드 40·기본 시나리오, `simConfigV2`, v2 메타, 묶음, `termCandidate`와 두 정책, `RiskContract` 일곱 칸, `credit` 칸, 거절 계측, v1 도구의 v2 거절 | 시험 1~5, 9~11(11은 표 대신 출력 JSON 단언), 14~16 / 변형 1~4, 11~15, 17~19 |
| **0068b** 표·보고·비교 | 4(4.1~4.4, 4.5의 표 출력), 2.2의 두 명령 | 6열 틀·키, `d03TablesV2`, 문턱표, J 판정 식, J9, 진단 J8·L4·V·M, `risk-compare-v2`, `v2-report`(R0 열 포함) | 시험 6~8, 12·13, 11의 표 단언 / 변형 5~10, 16, 20 |

- 이유
  - 0068a는 v1 바이트 보존과 정책 동작처럼 **실행 결과**를 바꾸는 부분이다. 0068b는 출력 JSON을 읽기만 하는 **보고 계층**이다. 둘을 나누면 0068a 검수에서 v1 회귀와 정책 결정을, 0068b 검수에서 판정 식을 따로 볼 수 있다.
  - 0068b는 0068a 출력 JSON만 있으면 된다. 0068a 병합 커밋을 BASE로 쓴다.
- 비용: Codex 2회, 검수 2회.
