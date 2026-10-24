# TASK-0068 경로 5 실행기 v2: rules-4 위험 단계 측정 도구(R0′~R4, 40시드, 판정표 v2)

- 지위: **초안(세션 A, 2026-10-24). 허브 사전 확인 전이다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0067a(+R1)·0067b(+R1)가 병합됐다(개발 브랜치 `b001681`, 기록 `1b56eb5`).
  - **`BASE`는 작업 트리를 만든 커밋이다.** `b001681` 다음, 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- **기준 문서와 우선 규칙**
  - 기준: 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md`(승인) 1~4·6절, `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인) 2.4·2.6·7·10절, 허브 결정 H23~H26.
  - **판정 기준값·판정 종류는 판정표 v2를 따른다.** 함수 경계·CLI 이름·출력 모양은 이 지시서를 따른다. 판정표와 다르게 해야 할 이유가 생기면 멈추고 보고한다.
- 범위 밖: 엔진(`src/engine/*.ts` 시험 밖 코드), 자료, 화면, **측정**. 판정표 v2의 측정 시드(1061~1180)와 판본 1 시드(1001~1060)로 v2를 돌리지 않는다.
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 1절 1의 비위험·v1 회귀 확인뿐이다(바이트 비교).

## 0. 앞선 검수에서 얻은 원칙(허브 전달)

1. **고정물 값은 서로 다르게 고른다.** 하한 ≠ 상한, 계수 ≠ 100, 두 정책·두 단계의 값이 같아지지 않게 한다. 같으면 ‘다른 값을 써야 할 자리에 같은 값을 쓴’ 결함을 못 잡는다.
2. **나머지가 생기는 값을 쓴다.** 비율·중앙·환산 시험은 나눗셈 나머지가 생기는 값으로 한다(예: 시드 수 홀수와 짝수를 둘 다, 동점 하나 이상).
3. **실제 R4 시뮬레이션 스모크 시험을 하나 둔다**(7절 시험 11).
4. **변형마다 ‘어느 시험이 왜 실패하는가’를 한 줄씩 적는다**(8절).

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **v1 측정 도구와 rules-1~3은 바이트로 같다.** 작업 전과 끝에 아래가 모두 같아야 한다. 어긋나면 고치기 전에 멈추고 보고한다.
   - `node tools/check_rules2_golden.mjs` → 0, `node tools/check_rules3_golden.mjs` → 0(로더 지문 포함)
   - 비위험 회귀: 작업 전 `node src/engine/sim/run.mjs run --out /tmp/TASK-0068-run-before.json`, 작업 끝 `node src/engine/sim/run.mjs run --out /tmp/TASK-0068-run-after.json`, 그 뒤 `cmp /tmp/TASK-0068-run-before.json /tmp/TASK-0068-run-after.json`
   - **v1 위험 실행 회귀**: 작업 전·끝에 `node src/engine/sim/run.mjs d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0068-v1r3-before.json`(끝은 `-after.json`)을 돌리고 `cmp`가 같다. 자료를 바꾸지 않으므로 `marketRulesSha256`도 같아야 한다.
   - v1 `risk-compare`(R0→R1·R1→R2·R2→R3)의 출력 문장·판정이 그대로다. 기존 `src/engine/sim/risk-runner.test.ts`가 고치지 않은 채 통과한다.
2. **기존 시험 파일은 고치지 않는다.** 새 시험은 새 파일 `src/engine/sim/risk-runner-v2.test.ts`에 둔다.
3. **v1 출력에 키를 더하지 않는다.** `RiskMeta`·`RiskContract`·`RiskMetrics`의 새 칸은 v2 실행에서만 둔다(값이 `undefined`인 키도 두지 않는다).
4. **실행기 코드는 첫 화면 묶음에 들어가지 않는다.** 작업 전·끝에 `npm run --silent build && node tools/check_bundle_size.mjs dist`의 첫 화면 gzip 바이트를 적는다. 바뀌면 멈추고 보고한다(0067b 병합본 132,576 B).
5. **측정하지 않는다.** v2 판정표를 실제 측정 시드로 내는 일은 이 지시서 범위가 아니다.
6. 커밋·푸시·브랜치 전환은 하지 않는다.

## 2. v2 실행 단계와 CLI

### 2.1 단계와 설정

- 새 형 `RiskLevelV2 = 'R0P' | 'R1' | 'R2' | 'R3' | 'R4'`. v1 `RiskLevel`(`R0`~`R3`)은 그대로 둔다.
- v2 설정 = `withRiskLevelV2(withLateMode(loadScenario(id), late), level, loadRiskProfile(profileId), loadCreditProfile(profileId))`.
- v2 `meta.risk`(v2 실행에만): `{ rules: 'M2a-rules-4', level: RiskLevelV2, profileId, tuningRound, marketRulesSha256 }`. v1 `meta.risk` 모양은 그대로다.
- **프로필 ID 선택**(engine-5): v2는 `--profile` 인수로 프로필을 고른다(기본 `RISK_PROFILE_V2`). 그 프로필에 외상 칸이 없으면(`loadCreditProfile`이 예외) 사용법 오류(종료 2). `meta.risk.profileId`가 고른 ID와 같은지 출력 직전에 검사한다. v1의 DEFAULT 선택(0067a 4.4)은 그대로다.

### 2.2 CLI(`src/engine/sim/cli.ts`)

- `sim d03`에 `--risk-v2 R0P|R1|R2|R3|R4`와 `--profile ID`를 더한다. `--risk`와 `--risk-v2`는 함께 쓸 수 없다(종료 2). `--profile`은 `--risk-v2`와만 쓴다.
- **시드 수**: `--seeds N`의 상한을 40으로 넓힌다. 기본은 20 그대로다. `--seed-base B`가 있으면 시드 목록은 `B .. B+N−1`(지금은 길이 20 고정)이다. `--seed-from`·`--seed-to`는 이 목록의 번호다. v1 기본 실행(인수 없음, 20개)의 출력은 같아야 한다.
- 새 명령 `sim risk-compare-v2 A B`: v2 두 출력의 층 비교(4.3).
- 새 명령 `sim v2-report R0P R1 R2 R3 R4`: 다섯 출력을 받아 6열 판정 틀(4.1)을 낸다. 다섯 출력의 `profileId`·`tuningRound`·`marketRulesSha256`·`engineVersion`·`dataVersion`·`format`·`lateMode`·`scenarioIds`·시드 집합이 같아야 하고, 층이 R0P~R4 하나씩이어야 한다. 아니면 종료 2.
- 도움말 문장(cli.ts:19-27)에 세 줄을 더한다. 기존 줄은 그대로다.

### 2.3 묶음(판정표 v2 1절)

- 정책 `TERM_GREEDY`, `CREDIT_AWARE`를 `ACCEPTANCE_IDS`에 더한다(v1 묶음 `d03PolicyIds`에는 넣지 않는다).
- v2 묶음 함수 `d03PolicyIdsV2(level)`
  - R0P·R4(전체): `d03PolicyIds('base')`에서 `FOCUS`를 뺀 것 + `MARGIN_BUFFER`·`TERM_GREEDY`·`CREDIT_AWARE`
  - R1·R2·R3(줄인): `IDLE`·`NO_FX`·`MAX_CONTRIBUTION`·`LATE_OK`·`MARGIN_BUFFER`·`TERM_GREEDY`·`CREDIT_AWARE`
- `--risk-v2`이고 `--policies`가 없으면 이 묶음을 쓴다. 변형은 (다)(`SCENARIO_M2_OPS_COS_LAVER`)만 받는다. 다른 시나리오면 종료 2(판정표 v2 1절, U4).

## 3. 정책과 지표

### 3.1 `TERM_GREEDY`·`CREDIT_AWARE`(`operations-policy.ts`, 판정표 v2 6절)

- 둘 다 `MAX_CONTRIBUTION`의 후보·순서·자금·편 규칙을 그대로 쓴다. 다른 점은 직접 무역 후보의 외상 조건뿐이다.
- 후보마다 그 시점 상태(`current`)로 `creditTermOptions(current, config, buy, sell, quantity)`(0067a)를 부르고, `allowed`인 조건 가운데 고른다.
  - `TERM_GREEDY`: `D30` → `D15` → `BASE` 순으로 처음 허용되는 것.
  - `CREDIT_AWARE`: 거래처 등급(`option.grade`)이 `C`이면 `BASE`, 아니면 `TERM_GREEDY`와 같다.
- 결정 기여는 고른 조건의 `saleAmountMinor`(가산 포함)와 `paymentDueDay`로 `preview`를 다시 불러 `decisionContribution`으로 센다. 대손·이자는 넣지 않는다(미래 누설 금지).
- 명령 `ACCEPT_TRADE`에 `creditTermId`를 넣는다(BASE도 명시한다).
- 기준 회사 `MAX_CONTRIBUTION`은 `creditTermId`를 넣지 않는다(엔진이 BASE로 둔다). 다른 v1 정책도 그대로다.
- 순서 동점은 지금 규칙(`operations-policy.ts:146` 정렬) 그대로다.

### 3.2 `RiskContract` 네 칸과 성분(engine-5, `risk-metrics.ts`)

- v2 실행에서만 `RiskContract`에 `creditTermId`, `creditEligible`, `grade`(그 계약 판매 거래처의 등급), `saleAmountMinor`, `acceptedDay`를 둔다. 출처는 계약(`state.contracts`)과 `config.operations.risk.profile.collections.byCounterparty`다.
- `components`는 `contractRiskReport`의 것을 그대로 옮긴다(rules-4에서는 `default`·`carry`가 들어 있다).
- `riskMetrics`의 `level` 인수를 `RiskLevel | RiskLevelV2`로 넓힌다. 분석값은 `R0`이 아닌 모든 단계(R0P 포함)에서 낸다(지금 식 그대로).
- v2 `RiskMetrics`에 진단 U 재료(4.4)를 둔다: `credit: { defaultsConfirmed, defaultsUnconfirmed, badDebtMinor, carryMinor, limitBlocked, termCounts: { BASE, D15, D30 }, partialReceipts, lateReceipts }`.
  - `defaultsConfirmed` = `WRITTEN_OFF` 청구서 수, `badDebtMinor` = `BAD_DEBT` 합, `carryMinor` = `RECEIVABLE_CARRY` 합.
  - `defaultsUnconfirmed` = 끝에 `OVERDUE`이고 `defaultFor(...)`가 참인 직접 무역 청구서 수(정책이 끝난 뒤의 읽기이므로 미래 누설이 아니다).
  - `limitBlocked` = `creditEligible.limitBlocked`가 비지 않은 계약 수.
  - `partialReceipts` = `RECEIPT-RCPT-{inv}-2` 분개 수, `lateReceipts` = 결제일 뒤에 전액 수금된 청구서 수.

## 4. 판정 틀(판정표 v2 3절)

### 4.1 6열 틀(engine-08)

- 새 표 `RISK_JUDGMENT_KINDS_V2`의 열은 `R0`(기록)·`R0P`·`R1`·`R2`·`R3`·`R4` **여섯**이다. 열은 이름으로 찾는다(지금 `Number(level[1])` 같은 위치 계산을 v2에 쓰지 않는다).
- 판정 종류는 판정표 v2 3.1 표 그대로다. R0 열은 모두 ‘기록’이다.

  | 판정 | R0P | R1 | R2 | R3 | R4 |
  |---|---|---|---|---|---|
  | J1 | 판정 | 판정 | 판정 | 판정 | 판정 |
  | J2 | 진단 | 해당 없음 | 해당 없음 | 해당 없음 | 진단 |
  | J3·J5·J6 | 판정 | 해당 없음 | 해당 없음 | 해당 없음 | 판정 |
  | J4a~c | 판정 | 판정 | 판정 | 판정 | 판정 |
  | J4d | 진단 | 진단 | 진단 | 진단 | 판정 |
  | J7(새 정의) | 진단 | 진단 | 진단 | 진단 | 판정 |
  | L1 | 진단 | 진단 | 진단 | 진단 | 판정 |
  | J9 | 해당 없음 | 판정 | 진단 | 진단 | 진단 |
  | 진단 J8·L4·V | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
  | 진단 T | 해당 없음 | 해당 없음 | 진단 | 진단 | 진단 |
  | 진단 C·B | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
  | 진단 F | 해당 없음 | 진단 | 해당 없음 | 진단 | 진단 |
  | 진단 U | 진단 | 진단 | 진단 | 진단 | 진단 |
  | 진단 M(판본 1 L3, `MARGIN_BUFFER`) | 해당 없음 | 진단 | 진단 | 진단 | 진단 |

- L2는 `risk-compare-v2`에서만 판정한다(4.3).
- `d03 --risk-v2 X`의 표는 그 단계 열만 낸다. `v2-report`는 여섯 열과 층 비교, J4d를 함께 낸다.

### 4.2 기준값(판정표 v2 3.2)

- 공통 상수는 v2 전용으로 둔다(v1 상수는 그대로).
  - **문턱표 m = 10..40**: 판정표 v2 3.2 표 그대로(10→9 … 40→26). m < 10이면 실패.
  - J1: 기준 회사 실패 0, 끝 원화 미지급 0(시드 수 전부).
  - J3: 가장 강한 정책의 근접 시드가 `34/40` 미만(`20 × strongest < 17 × n`, 40시드 기준). J3 후보에서 `TERM_GREEDY`·`CREDIT_AWARE`·`MARGIN_BUFFER`를 뺀다.
  - J5: 두 명 고용 이득 시드 ≤ `6/40`(`20 × gains ≤ 3 × n`).
  - J4a·J4b: v1 그대로. **J4c**: `NO_FX` 실패 ≥ `30/40`(`4 × failed ≥ 3 × n`).
  - **J4d**(R4, `v2-report`에서만): R4 기준 회사 분석값 중앙이 `1,069,200` 이상, **M′** 이하. M′ = 같은 보고에 들어온 R0P 출력의 기준 회사 분석값 중앙(판정표 v2 3.3). 같으면 통과. 단계 출력 하나만 볼 때(`d03 --risk-v2 R4`)는 ‘M′ 없음 — v2-report에서 판정’으로 적는다.
  - **J7(새 정의)**: v1 식 그대로이되, 남은 시드가 **20 미만이면 실패**(v1은 10).
  - L1: v1 식 그대로(5% 이상 25% 이하).
  - **J9**(R1): 시드마다 `Σ|contract.components.fx| ÷ Σ usdToKrwMinor(saleAmountMinor, referenceRate(acceptedDay))`(직접 무역, 분자·분모 원)를 `TERM_GREEDY`와 기준 회사가 각각 낸다. `TERM_GREEDY`가 큰 시드 수 ≥ 문턱(m = 동점 뺀 시드 수). 비율 비교는 정수 교차곱으로 한다. 판본 1식(`TERM_GREEDY` R0P→R1 손실 비율 +1.0%p)은 진단으로 `risk-compare-v2`에서 낸다.
- **진단 사전 기대를 나란히 적는다**(DESIGN-v2 2.4·2.6, 판정표 v2 3.5)

  | 진단 | 값 | 사전 기대 |
  |---|---|---|
  | J8 | `TERM_GREEDY` > 기준 회사 시드 수 | 중앙 35/40, 띠 8~32 안 확률 0.14 |
  | L4 | `CREDIT_AWARE` > 기준 회사 시드 수 | 중앙 36/40 |
  | V | 시드마다 `CREDIT_AWARE` − `TERM_GREEDY` 분석값: 중앙·사분위·동점·양수·음수 시드 수 | 평균 +21 USD/시드, 동점 27, TG 우세 11.8, CA 우세 1.2 |
  | J9 | 위 지표의 시드 수 | 33 대 7 |
  | U 관문 | 날짜+한도 비BASE 가능 비율(`TERM_GREEDY`) | 31.5%(R3 대리값) |
  | U 대손 | 기준 회사 확정 대손 수·시드당, 확정+미확정 | 확정 시드당 0.44, 합 시드당 0.59. **J1 일회 점검(시드 2001~2010)에서 확정 8건(기대 약 4.4)** |

### 4.3 층 비교 `risk-compare-v2`(L2, 판정표 v2 3.2)

- 순서는 R0P → R1 → R2 → R3 → R4이고 바로 다음 층만 비교한다(engine-5). 메타 일치 검사는 v1 `compareRisk`와 같고 `rules`·`profileId`도 본다.
- L2 ①·②(기준 회사)는 v1 식 그대로다. 판정 종류: **R2→R3, R3→R4는 판정**, R0P→R1·R1→R2는 진단.
- R0P→R1에서는 판본 1식 J9 진단(`TERM_GREEDY`의 손실 비율 차이 %p와 시드 증감)을 함께 낸다. 사전 기대: `TERM_GREEDY` − 기준 회사의 차이 0.00%p.
- `(iii)`(v1의 R0→R1 직접 무역 수)는 v2에서 내지 않는다.

### 4.4 진단 U(판정표 v2 3.1·3.6)

- 단계마다 정책별로: 외상 조건 분포(`termCounts`), 날짜 규칙상 비BASE 가능 비율, 날짜+한도 비BASE 가능 비율(`TERM_GREEDY`, **25% 관문 값, 보고만**), 한도로 막힌 수, 확정 대손·미확정 대손 수와 금액, 이자 합, 부분·지연 수금 수.
- 날짜상 가능한 조건은 계약에서 다시 계산한다: 오퍼 결제일 = `paymentDueDay − days(creditTermId)`, 조건 t가 가능하려면 `오퍼 결제일 + days_t + lateMaxDays ≤ campaignDays`. 날짜+한도 가능 = 날짜상 가능한 조건 가운데 `limitBlocked`에 없는 것이 하나라도 있음.
- 4.2 표의 사전 기대를 같은 줄에 둔다.

### 4.5 진단 M

- v1 `marginComparison(base, MARGIN_BUFFER)`의 출력을 문턱 없이 기록한다(판본 1 L3를 진단으로 남김). `L3_THRESHOLDS` 대신 v2 문턱표를 쓰되 판정하지 않는다.

## 5. 기제 시험(H24-1, 판정표 v2 3.5)

- 판정이 아니라 시험이다(7절 시험 9·10).

## 6. 실행 비용 기록

- 결과 보고에 아래를 적는다(측정이 아니다): 시드 2001~2003, (다), `--risk-v2 R4` 전체 묶음 1회의 걸린 시간과 워커 수, 실행 수. 40시드·다섯 단계로 늘렸을 때의 추정 시간(판정표 v2 1절의 ‘한 회차 약 1시간 40분’과 대조).

## 7. 시험(새 파일 `src/engine/sim/risk-runner-v2.test.ts`)

시드 2001 이상. 0절 원칙을 따른다.

1. **CLI**: `--risk`와 `--risk-v2` 동시 사용 거절, `--profile` 단독 거절, 외상 칸 없는 프로필(`RISK_PROFILE_DEFAULT`) 거절, (다) 밖 시나리오 거절, `--seeds 41` 거절, `--seeds 40 --seed-base 2001`의 목록 길이 40·끝 2040, 인수 없는 v1 시드 목록이 BASE와 같은 20개.
2. **묶음**: `d03PolicyIdsV2('R0P')`·`('R4')`에 `FOCUS` 없음·세 정책 있음, `('R1')`이 일곱 정책. v1 `d03PolicyIds`에 `TERM_GREEDY`·`CREDIT_AWARE` 없음.
3. **정책 조건 선택**(손 고정물): 등급 A·B·C 거래처 오퍼가 함께 있는 상태에서
   - `TERM_GREEDY`는 D30 허용이면 D30, D30이 날짜로 막히고 D15 허용이면 D15, 둘 다 한도에 막히면 BASE. 세 경우를 서로 다른 오퍼로 만든다(0절 1).
   - `CREDIT_AWARE`는 C 거래처에서 BASE, A·B에서 `TERM_GREEDY`와 같은 조건.
   - 기준 회사 명령에는 `creditTermId` 키가 없음(`Object.hasOwn`).
4. **결정 기여**: 가산이 있는 조건의 기여가 BASE 기여보다 `saleAmountMinor` 차이만큼 크다(나머지가 생기는 수량·단가로).
5. **`RiskContract`**: v2 실행의 계약에 다섯 칸이 있고 값이 상태와 같다. v1 실행의 계약에는 키가 없음.
6. **6열 틀**: 4.1 표의 칸마다 `judgmentKindV2`가 맞음(표 전체를 리터럴로 대조). 열을 이름으로 찾음(`R0P`가 R0 열로 읽히지 않음).
7. **문턱표**: m = 10..40 전체가 판정표 v2 표와 같고, m = 9는 실패. 각 m에서 `B(m, 0.5)`의 한쪽 p ≤ 0.05인 최소 문턱인지 정확한 유리수로 다시 계산해 대조.
8. **판정 식**(손으로 만든 실행 목록, 시드 수는 홀수 39와 짝수 40을 둘 다)
   - J3(34/40 경계), J5(6/40), J4c(30/40), J7 남은 시드 19·20 경계, L1 경계, J4d M′ 경계(같으면 통과), J9(동점 포함 m 계산, 교차곱 비교), J8·L4·V 집계(동점·양수·음수).
   - 값은 정책마다 다르게 둔다(0절 1).
9. **기제 시험 — 손 고정물**(H24-1): 날짜상 비BASE가 가능한 C 거래처 판매 오퍼와 A·B 오퍼가 있는 고정 상태에서 하루 결정을 내리면, `CREDIT_AWARE`의 C 계약은 BASE, `TERM_GREEDY`의 C 계약은 비BASE, A·B 계약의 조건은 두 정책이 같다.
10. **기제 시험 — 시드**: 시드 2001 이상 몇 개(최대 10)의 R4 실행에서 `CREDIT_AWARE`의 C 비BASE 계약 0건. `TERM_GREEDY`의 C 비BASE가 1건 이상인 시드를 찾으면 그 시드를 적는다. 못 찾으면 시험은 ‘손 고정물로만 확인’이라고 결과 보고에 적고 통과로 둔다.
11. **R4 스모크**: `d03 --risk-v2 R4 --policies MAX_CONTRIBUTION,TERM_GREEDY,CREDIT_AWARE --seed-base 2001 --seeds 2`를 함수로 돌려(워커 1) 예외 없이 끝나고, 표에 4.1의 R4 열 판정 이름이 모두 나오고, `meta.risk`가 4.2 모양이며, 진단 U의 `termCounts` 합이 직접 무역 수와 같다. 시험 하나 60초 이내.
12. **비교**: `risk-compare-v2`가 R0P→R1, R3→R4를 받고 R1→R3·R4→R3를 거절. 메타가 다르면 거절. R2→R3·R3→R4는 ‘판정’, R0P→R1·R1→R2는 ‘진단’. `v2-report`가 다섯 단계를 하나씩 요구하고 J4d에 R0P 중앙을 M′로 쓴다(서로 다른 값의 손 고정물).
13. **v1 보존**: v1 `riskTables`·`compareRisk` 출력 문자열이 BASE 리터럴과 같은 고정 입력 하나(작은 손 고정물).

## 8. 변형 시험(임시로 고치고 되돌림)

각 줄의 ‘이유’는 그 시험이 왜 실패하는지다.

| 번호 | 변형 | 실패하는 시험 | 이유 |
|---|---|---|---|
| 1 | `TERM_GREEDY`의 순서를 `D15 → D30 → BASE`로 | 시험 3 | D30 허용 오퍼에서 D15를 고른다 |
| 2 | `CREDIT_AWARE`의 C 판정을 지움 | 시험 3·9 | C 계약이 비BASE가 된다 |
| 3 | 결정 기여에 BASE 판매액을 씀 | 시험 4 | 기여 차이가 0이 된다 |
| 4 | v2 `RiskContract` 칸을 v1에도 넣음 | 시험 5·13, 1절 1의 v1 cmp | v1 출력에 키가 생긴다 |
| 5 | 6열 틀을 위치 계산(`Number(level[1])`)으로 | 시험 6 | `R0P`가 R0 열(기록)로 읽힌다 |
| 6 | 문턱표 m = 39를 25로 | 시험 7 | 유리수 재계산과 다르다 |
| 7 | J7 남은 시드 문턱을 10으로 | 시험 8 | 19개 남은 경우가 통과한다 |
| 8 | J4d의 M′를 R4 중앙으로 | 시험 12 | 손 고정물에서 R0P 중앙과 R4 중앙이 다르다 |
| 9 | J9의 분모를 판매액 대신 1로 | 시험 8 | 정책마다 판매액이 달라 비교 결과가 바뀐다 |
| 10 | `risk-compare-v2`가 R1→R3를 허용 | 시험 12 | 바로 다음 층 검사가 빠진다 |
| 11 | `--seed-base` 목록 길이를 20 고정으로 되돌림 | 시험 1 | 40개 목록의 끝이 2019가 된다 |
| 12 | `defaultsUnconfirmed`를 `WRITTEN_OFF` 수로 | 시험 11·8의 U 집계 | 미확정·확정이 같은 값이 된다(고정물에서 둘을 다르게 둔다) |
| 13 | 진단 U의 날짜 가능 계산에서 `lateMaxDays`를 뺌 | 시험 8의 U 집계 | 경계 오퍼가 가능으로 바뀐다 |
| 14 | `--profile` 기본을 DEFAULT로 | 시험 1·11 | 외상 칸 없는 프로필로 거절된다 |

- 모두 되돌린 뒤 1절 1의 검사가 같고 `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 9. 완료 조건

1. 1절 1의 검사가 작업 전·후 같다(골든 둘, 비위험 400회 cmp, v1 R3 d03 cmp, `risk-runner.test.ts`).
2. 기존 시험 파일 변경 없음
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력이다.
   - `git status --porcelain --untracked-files=all`의 `??` 줄은 새 시험 파일과 결과 보고뿐이다.
3. 새 시험과 변형 14개가 기대대로다.
4. 첫 화면 gzip이 작업 전·후 같다(1절 4).
5. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
6. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `검사 18종, 실패 0종 (모드: 확인)`이다.
7. 결과 보고 `docs/ai/tasks/results/TASK-0068.md`.

## 10. 고칠 수 있는 파일

- `src/engine/sim/cli.ts`, `d03.ts`, `risk-metrics.ts`, `risk-tables.ts`, `operations-policy.ts`, `variants.ts`, `sim.ts`(단계 형 넓히기만)
- 필요하면 새 파일 `src/engine/sim/risk-tables-v2.ts`
- 새 파일 `src/engine/sim/risk-runner-v2.test.ts`
- `MANIFEST.json`(생성만), `docs/ai/tasks/results/TASK-0068.md`
- 그 밖(엔진 `src/engine/*.ts`, `src/content/**`, `data/**`, `schemas/**`, `src/ui/**`, 골든 파일·도구, 기존 시험 파일)은 고치지 않는다. 필요하면 멈추고 보고한다.

## 11. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 1절 1 검사와 첫 화면 gzip의 전·후
- CLI 도움말 전후, v2 `meta.risk` 예시
- 4.1 표와 실제 `RISK_JUDGMENT_KINDS_V2`, 문턱표 재계산 출력
- 시험 출력, 변형 표(실제로 실패한 시험 이름), 기제 시험 시드 결과, 6절 실행 비용
- 측정 전에 허브가 할 일: 판정표 v2 0절 고정 기록(승인 커밋, rules-4 병합 커밋, `market_rules.json` sha256, 시작 프로필 대조), 측정 명령 목록(R0P~R4 × 기준·표본 밖 1, `v2-report`, `risk-compare-v2` 네 쌍)
- 범위 밖에서 발견한 것, 질문
