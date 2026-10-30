# TASK-0071 판정표 v3 도구: `RISK_JUDGMENT_KINDS_V3`, `v3-tables`, `v3-report`(J10, 진단 J10②, 진단 X, J1 관문)

- 지위: **초안(세션 A, 2026-10-30).** 허브 사전 검수 전이다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0070(최종 프로필 k = +1)이 병합됐다.
- **`BASE`**: TASK-0070 병합 뒤, 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **기준 문서**
  - 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v3.md`(승인, 초안 2 `026a337`, 지위 `6a28985`)의 3절·6절
  - 판본 2 `JUDGMENT_TABLE.v2.md` 3.2(문턱표, J1·J7 식)
  - 판정 식과 판정 종류는 판정표 v3를 따른다. 함수 경계, 명령 이름, 출력 모양은 이 지시서를 따른다. 판정표와 다르게 해야 할 이유가 생기면 멈추고 보고한다.
- 범위 밖: 엔진(`src/engine/*.ts`), 실행 경로, 자료, 화면, **측정**. v3 시드 1181~1300으로 아무것도 돌리지 않는다.
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 둘이다.
  1. 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다(비위험 바이트 비교).
  2. 9절 2의 판본 2 바이트 재현은 판본 2 측정 시드 1061~1100의 R1·R2를 다시 돌린다. sha256만 비교하고 표 내용은 읽지 않는다.

## 0. 앞선 검수에서 얻은 원칙(허브 전달)

1. 고정물 값은 서로 다르게 고른다(하한 ≠ 상한, 두 정책·두 단계·두 묶음의 값이 같아지지 않게).
2. 나머지가 생기는 값을 쓴다. 시드 수는 홀수와 짝수를 둘 다 쓰고, 동점을 하나 이상 넣는다.
3. 변형마다 ‘어느 시험이 왜 실패하는가’를 한 줄씩 적는다(8절).
4. 고칠 파일의 진입점과 그 파일을 검사하는 기존 시험을 먼저 읽는다. 특히 다음을 읽는다.
   - `risk-runner-v2.test.ts` 시험 1(`USAGE` 전문)
   - `risk-tables-v2.test.ts` 시험 1·2(USAGE·6열 상수)
   - `risk-runner.test.ts:486-532`(import 규칙)
5. 명령 줄은 사본에서 한 번 돌려 보고 적는다(앞선 지시서 결함의 교훈).

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **판본 2는 바이트로 그대로다.** 바뀌면 고치기 전에 멈추고 보고한다. 확인은 9절에서 한다.
   - v2 실행 출력: `d03 --risk-v2`의 JSON·요약
   - v2 명령 출력: `v2-tables`·`v2-report`·`risk-compare-v2`
   - v2 상수: `RISK_JUDGMENT_KINDS_V2`, `SIGN_THRESHOLDS_V2`, `judgmentKindV2`
2. **기존 시험 파일은 고치지 않는다.** 예외는 하나다.
   - `risk-runner-v2.test.ts` 시험 1과 `risk-tables-v2.test.ts` 시험 1의 `USAGE` 전문 리터럴만, 2.1의 새 `USAGE`로 바꾼다.
   - 두 파일의 diff는 그 리터럴 안의 줄 추가뿐이어야 한다. 결과 보고에 diff를 붙인다.
3. **`risk-tables-v2.ts`는 `export` 키워드를 더하는 것만 허용한다.**
   - 대상은 이 지시서가 쓰는 함수다: `stageEvidence`, `validateR0`, `healthy`, `unpaid`, `num`, 형 `Evidence`·`Stage`.
   - 식과 문자열은 바꾸지 않는다.
4. **실행기 코드는 첫 화면 묶음에 들어가지 않는다.**
   - 작업 전과 작업 끝에 첫 화면 gzip 바이트를 적는다. 방법은 TASK-0068a 허브 개정 2와 같다.
   - **증가는 0 B**여야 한다. 바뀌면 멈추고 보고한다.
5. **위험 모듈 import 규칙**
   - 새 파일 `risk-tables-v3.ts`는 보고서 파일 목록에 없다. 그래서 `../risk`에서는 허용 목록만 가져온다(`usdToKrwMinor` 등).
   - `rateAtV2`·`simConfigV2`는 `./risk-metrics`에서 가져온다.
   - `withLateMode`는 `./variants`, `loadScenario`는 `../../content/scenario`에서 가져온다.
   - `risk-tables-v2.ts`와 `d03.ts`는 `risk-tables-v3.ts`를 가져오지 않는다(순환 금지).
6. 측정하지 않는다. 커밋, 푸시, 브랜치 전환을 하지 않는다.

## 2. 명령

### 2.1 도움말(`cli.ts`의 `USAGE`)

- `sim v2-report …` 줄 바로 다음에 두 줄을 넣는다. 다른 줄은 그대로 둔다.

  ```text
    sim v3-tables FILE
    sim v3-report --base R0P,R1,R2,R3,R4 [--base-r0 FILE] [--oos R0P,R1,R2,R3,R4] [--oos-r0 FILE]
  ```

  들여쓰기는 지금 명령 줄과 같은 두 칸이다. 두 시험 파일의 리터럴(1절 2)과 새 시험 1이 전문을 검사한다.

### 2.2 새 명령 둘

종료 코드는 다음과 같다.

| 코드 | 뜻 |
|---|---|
| 0 | 성공, J1 관문 통과 |
| 2 | 사용법·입력 오류. 오류 문구 뒤에 `USAGE`가 붙는다 |
| **3(새)** | 출력은 다 냈지만 **J1 관문이 실패**했다(판정표 v3 3.5 멈춤) |

`simMain` 머리 주석의 종료 코드 설명에 3을 더한다.

| 명령 | 입력 검사(어기면 종료 2) | 출력 |
|---|---|---|
| `sim v3-tables FILE` | v2 `validateV2`와 같다(rules-4, lateMode base, (다)만) | `d03TablesV3(output)`(3·4절) |
| `sim v3-report --base L1,…,L5 [--base-r0 F] [--oos L1,…,L5] [--oos-r0 F]` | `--base`는 필수다. `--base`·`--oos`는 각각 v2 출력 다섯 개다. 단계가 R0P~R4를 하나씩 덮어야 하고 순서는 상관없다. 한 묶음 안의 메타는 v2 `matchingMeta`와 같다. 두 묶음 사이에서는 `seeds`만 달라야 하고 나머지 메타(profileId·tuningRound·sha·engine·data·format·lateMode·scenarioIds)는 같아야 한다. 두 묶음의 시드 집합은 겹치지 않아야 한다. `--*-r0`은 v2 `validateR0`을 그 묶음에 대해 적용한다. 같은 옵션이 두 번 오면 오류다 | `v3Report(base, oos?, r0s)`(5절) |

- **자료 sha 검사**: 두 명령 모두 `io.marketRulesSha256?.()`가 있어야 한다. 없으면 종료 2다.
  - 모든 입력의 `meta.risk.marketRulesSha256`이 그 값과 같아야 한다. `--*-r0` 입력도 포함한다.
  - 다르면 종료 2이고 문구는 `v3 표는 현재 자료와 같은 sha의 출력만 받습니다.`다.
  - 이유: 진단 X가 현재 자료로 환율을 다시 계산하기 때문이다(판정표 v3 6절).
- v1 출력은 받지 않는다(`--*-r0`만 예외). 문구는 v2와 같은 `v2 명령은 rules-4 출력만 받습니다.`를 쓴다(`validateV2` 재사용).

## 3. 종류표 `RISK_JUDGMENT_KINDS_V3`(새 파일 `src/engine/sim/risk-tables-v3.ts`)

- **종류 형** `JudgmentKindV3 = '판정' | '진단' | '해당 없음' | '기록' | '관문' | '재현 기록'`. v2 형은 그대로 둔다.
- **키**: v2 키 스무 개를 같은 순서로 쓰고, 그 뒤에 `J10`, `진단 J10②`, `진단 X`를 더한다(스물세 개).
- **열**: `R0`·`R0P`·`R1`·`R2`·`R3`·`R4`. 이름으로 찾고, 조회 함수 `judgmentKindV3(key, level)`를 내보낸다.
- **값의 정의**: v2 상수에서 아래 규칙으로 만든 값을 **리터럴로** 적는다. 코드에서 v2 상수를 변환해 만들지 않는다. 시험 2가 리터럴을 대조한다.

  | 키 | R0 | R0P~R4 |
  |---|---|---|
  | J1 | 기록 | **관문**(모두) |
  | J3, J4a~c, J4d, J5, J6, J7(새 정의), L1 | 기록 | v2 칸이 `판정`·`진단`이면 **`재현 기록`**, `해당 없음`이면 그대로 `해당 없음` |
  | J9 | 기록 | R0P `해당 없음`, R1~R4 `진단` |
  | J10 | 기록 | R0P `판정`, R1~R3 `진단`, R4 `판정` |
  | 진단 J10② | 기록 | 모두 `진단` |
  | 진단 X | 기록 | 모두 `진단` |
  | 그 밖(J2, 진단 J8·L4·V·T·C·F·B·U·M·거절) | v2와 같다 | v2와 같다 |

  - 판정표 v3 3.1은 J3·J4·J5·J6·J7·L1을 ‘재현 기록’ 한 줄로 적었다.
  - v2에서 `해당 없음`인 칸(예: J3의 R1)은 줄인 묶음이라 계산 재료가 없다. 그래서 `해당 없음`으로 남긴다. 이 해석을 결과 보고에 적는다.
- **행 그리기** `judgmentRowV3(key, level, pass, evidence, missing, gateFailed)`. 결과 칸은 아래와 같다.
  - `판정`: `통과`·`실패`. 실행 없음과 근거 부족은 v2 규칙 그대로다. **`gateFailed`이면 `판정 보류`**다.
  - `관문`: `통과`·`실패`
  - `재현 기록`: `기록`. 근거 칸은 v2 근거 문자열을 그대로 쓴다(`stageEvidence(output).rows[key]`).
  - `진단`: `진단`
  - `해당 없음`: `해당 없음`, 근거 `—`
  - `기록`(R0 열): v2 `r0Record`와 같다. J10·진단 J10②·진단 X의 R0은 `기록 없음`이다.

## 4. 계산(`risk-tables-v3.ts`)

### 4.1 J10(① 거래 감소, 판정)

- 짝: 같은 시드의 `TERM_GREEDY`와 `MAX_CONTRIBUTION` 실행. 둘 중 하나가 없는 시드는 짝에서 빼고 `missingRuns`로 ‘실행 없음’을 낸다.
- 감소 = `tg.metrics.risk.directAccepted < base.metrics.risk.directAccepted`, 증가 = 반대, 같으면 동점.
- `m = 감소 + 증가`. 통과는 `m ≥ 10`이고 감소 ≥ `SIGN_THRESHOLDS_V2[m]`이다. 문턱표는 v2 상수를 import하고 복사하지 않는다.
- 근거 문구: `감소 {d}/{m} (문턱 {t}, 동점 {ties}); 직접 무역 합 TG {a} 대 기준 {b}(비 {a/b 소수 셋째 자리}), 시드 중앙 {ma} 대 {mb}`
- 함수 `j10V3(base: SimRun[], tg: SimRun[])` → `{ decrease, increase, ties, m, threshold, pass, sumTg, sumBase, medTg, medBase }`.

### 4.2 진단 J10②(자금 거절)

- 같은 짝에서 증가 = `tg.funds > base.funds`(`rejectionsV2.candidate.funds`). 동점·m·문턱 계산은 4.1과 같다.
- 근거 문구에는 **통과·실패 말을 쓰지 않는다**: `증가 {u}/{m} (문턱 {t}, 동점 {ties}); funds 합 TG {a} 대 기준 {b}(비 …); funds ÷ 후보 합 TG {p}% · 기준 {q}%`
  - 후보 합은 일곱 사유의 합이다(v2 `rejectionTotalsV2().total`).
- 표 아래 주석(고정 문구): `자금 거절은 기본 분류이고 후보마다 마지막 사유만 남으며, 거래 감소와 기계적으로 연동된다. J10과 독립된 증거가 아니다(판정표 v3 3.2).`

### 4.3 진단 X(늦춘 구간의 환율 변화 크기)

- 설정: `cfg = simConfigV2(withLateMode(loadScenario('SCENARIO_M2_OPS_COS_LAVER'), 'base'), level, meta.risk.profileId)`
- 잘림 날: `T = min(c.evaluationDay, cfg.operations.market.publish.lastDay)`
- 대상: 기준 회사 실행의 `DIRECT_TRADE` 계약
- 계약 c와 d ∈ {15, 30}마다
  - `day0 = min(c.paymentDueDay, T)`
  - `dayD = min(c.paymentDueDay + d, T)`
  - `eff = dayD − day0`
  - `X = |usdToKrwMinor(c.saleAmountMinor, rateAtV2(cfg, seed, dayD)) − usdToKrwMinor(c.saleAmountMinor, rateAtV2(cfg, seed, day0))|`
- 시드마다 `{ num: Σ X, den: Σ c.saleKrwAtAcceptMinor }`(BigInt)
  - `den = 0`인 시드는 빼고 그 수를 센다.
  - 남은 분수를 교차곱으로 정렬한다.
- 중앙·사분위는 v2 `lossStats`의 사분위 규칙(아래 절반·위 절반의 중앙)을 분수로 따른다. 짝수 개의 중앙은 두 분수의 평균 분수다.
- 표시: % 소수 셋째 자리(`num × 100 ÷ den`을 표시 직전에만 소수로)
- 세는 것: `eff < d`인 계약 수, 그 가운데 `eff = 0` 계약 수, 제외 시드 수
- 근거 문구: `d=15 중앙 {p}% (사분위 {q1}% / {q3}%), 잘림 {k}건(그중 0일 {z}건); d=30 …; 제외 시드 {e}`
- 함수 `fxDelayV3(output: SimOutput)`. R0P에서는 환율이 고정이라 모든 X가 0이다(정의상 성질, 시험 5).

### 4.4 J1 관문과 판정 보류

- J1 계산은 v2 `stageEvidence(output).rows.J1`을 그대로 쓴다(재계산하지 않는다). `pass === true`이면 관문 통과다.
- **묶음 단위 보류**: 한 묶음(기준 또는 표본 밖)의 다섯 단계 가운데 하나라도 J1이 실패하면, 그 묶음의 J10은 R0P·R4 모두 `판정 보류`다.
- `v3-tables`(단계 하나)에서는 그 단계 J1이 실패하면 J10이 `판정 보류`다.
- 출력 맨 앞에 멈춤 표지 줄을 낸다: `**멈춤: J1 관문 실패({묶음} {단계}). 판정표 v3 3.5에 따라 측정을 멈추고 원인을 보고한다.**`
- 종료 코드는 3이다.

### 4.5 재현 기록

- v2 `stageEvidence(output)`의 `rows`에서 근거 문자열과 `missing`을 그대로 가져온다. 결과 칸만 3절 규칙으로 바꾼다.
- J4d의 R4 칸은 v2에서 `보류(v2-report에서 판정)`였다. v3에서는 `재현 기록`이고, 근거는 `j4dV2`의 근거 문자열이다(5절의 v3-report에서만, 같은 묶음 R0P 기준).

## 5. 출력 모양

### 5.1 `d03TablesV3(output)`(`v3-tables`)

1. `# D03 v3 단계 표 ({level})`와 v2와 같은 머리말 줄(시드·실행 수·프로필·회차·sha 앞 12자)
2. 멈춤 표지(해당할 때만)
3. `## 판정·관문·진단(판정표 v3)`: `| 판정 | 결과 | 근거 |` 표. 스물세 키 가운데 그 단계에서 `해당 없음`이 아닌 행을 키 순서대로 그린다.
4. `### J10 시드별 부호`: `| 시드 | TG 직접 무역 | 기준 직접 무역 | 부호 | TG funds | 기준 funds | 부호 |`
5. `### 진단 X 계약 잘림`: `| d | 대상 계약 | eff < d | eff = 0 | 제외 시드 |`
6. 끝줄 고정 문구: `판본 2 표(진단 U·거절 정책별, ①~⑧)는 같은 파일로 sim v2-tables를 돌려 본다. 판본 2 판정 칸의 통과·실패는 v3에서 재현 기록이다.`

### 5.2 `v3Report`(`v3-report`)

1. `# 판정표 v3 보고`. 묶음마다 시드 범위와 개수, 프로필, 회차, sha, 각 단계 실행 수, R0 입력 경로나 `R0 입력 없음`
2. 멈춤 표지(해당할 때만)
3. `## J1 관문`: `| 단계 | 기준 | 표본 밖 1 |`(R0P~R4)
4. `## J10 최종(판정표 v3 4절: 네 검정 모두 통과)`: `| 검정 | 기준 | 표본 밖 1 |`
   - 행은 `R0P`, `R4`, `최종`이다.
   - `--oos`가 없으면 표본 밖 칸은 `측정 전`, 최종은 `미정`이다.
   - 최종은 네 칸이 모두 `통과`일 때만 `통과`다. 하나라도 `실패`이면 `실패`, `판정 보류`가 섞이면 `판정 보류`다(실패가 우선).
5. `## 6열 표(기준)`과 `## 6열 표(표본 밖 1)`: v2-report의 6열 표와 같은 모양이고, 스물세 키와 v3 종류를 쓴다.
6. `### {묶음} {단계}` 근거 절: 단계마다 3번 표(판정·관문·진단)
7. 끝: J8·L4·V 사전 기대 줄(v2와 같은 문구), 그리고 판정표 v3 3.3 한계 1·2의 고정 문구 두 줄
   - `J10은 재현 판정이다. 가설과 판정 단계의 선택, 사전 기대의 근거가 모두 이미 본 자료에서 나왔다(판정표 v3 3.3).`
   - `시드별 감소 시드 수는 이 보고에서 처음 센다.`

## 6. 고칠 수 있는 파일

- 새 파일: `src/engine/sim/risk-tables-v3.ts`, `src/engine/sim/risk-tables-v3.test.ts`
- 기존 파일
  - `src/engine/sim/cli.ts`: `USAGE`, 두 명령 분기, 종료 코드 주석만
  - `src/engine/sim/risk-tables-v2.ts`: 1절 3의 `export` 추가만
  - `src/engine/sim/risk-runner-v2.test.ts`·`risk-tables-v2.test.ts`: 1절 2의 리터럴만
  - `MANIFEST.json`: `python3 tools/build_package.py --manifest-only`로만 만든다
  - `docs/ai/tasks/results/TASK-0071.md`
- 그 밖의 파일은 고치지 않는다. 필요하면 멈추고 보고한다.
  - `run.mjs`, `d03.ts`, `risk-metrics.ts`, `operations-*.ts`, `policies.ts`, `variants.ts`, `sim.ts`
  - 엔진 `src/engine/*.ts`, `src/content/**`, `data/**`, `schemas/**`, `src/ui/**`
  - 골든, 다른 시험

## 7. 시험(새 파일 `src/engine/sim/risk-tables-v3.test.ts`)

- 시드는 2001 이상이다(머리말의 예외 둘은 시험이 아니다).
- 대부분 **손 v2 SimOutput 고정물**로 한다. 만드는 법은 TASK-0068b 6절과 같다. 실제 R4 실행 하나(시드 2001)를 clone하고 `directAccepted`·`rejectionsV2`·`contracts`·`outcome` 등을 덮어쓴다.

1. **CLI**
   - `USAGE` 전문
   - 입력 검사(2.2 표)를 하나씩 확인한다. 각각 종료 2와 정확한 문구 조각을 본다.
     - `--base` 없음
     - 다섯 개가 아님
     - 단계 중복
     - 묶음 사이 profileId 다름
     - 두 묶음의 시드 겹침
     - 같은 옵션 두 번
     - v1 출력
     - `io.marketRulesSha256` 없음
     - sha 불일치(`--base-r0`만 다른 경우 포함)
   - 정상은 종료 0, J1 실패는 종료 3이다.
2. **종류표**
   - `RISK_JUDGMENT_KINDS_V3`가 3절 규칙으로 만든 리터럴 전체와 같다. 시험 안에서도 리터럴로 적는다.
   - 키 스물셋의 순서를 확인한다.
   - `judgmentKindV3`가 이름으로 찾는지 본다: `('J1','R0P')` = 관문, `('J10','R0P')` = 판정, `('J10','R2')` = 진단, `('J3','R1')` = 해당 없음, `('J3','R4')` = 재현 기록, `('J9','R1')` = 진단.
   - `RISK_JUDGMENT_KINDS_V2`가 v2 리터럴과 여전히 같다(형 불변 단언).
3. **J10 부호 검정**
   - 시드 40, 동점 0: 감소 26은 통과, 25는 실패
   - 동점 둘(m = 38): 감소 25는 통과, 24는 실패. 동점을 m에 넣으면 m = 40, 문턱 26이 되어 25가 실패한다.
   - m = 9: 감소 9여도 실패
   - 시드 39(홀수)에서 한 경우
   - 한 시드의 TG 실행이 빠지면 ‘실행 없음’으로 실패
4. **진단 J10②**
   - 증가·동점·m·문턱이 손 계산과 같다.
   - funds 비중의 분모는 일곱 사유 합이다. 고정물에서 `skippedNotOpen`을 크게 두어, 그것을 넣으면 값이 달라지게 한다.
   - 행의 결과 칸이 `진단`이고 근거에 `통과`·`실패`가 없다.
5. **진단 X**
   - R0P 고정물에서 모든 ratio 분자가 0이다.
   - R4 고정물의 손 계산 사례
     - 늦춤이 잘리지 않는 계약(due ≤ 48, d = 30)
     - **48 < due ≤ 60인 계약(d = 30): lastDay 78에서만 잘린다(eff < 30, eff > 0)**
     - due ≥ 78인 계약: eff = 0, X = 0
     - 실패 실행처럼 E가 이른 계약(E < due + d < 78): E에서 잘린다
   - 분모 0 시드: 기준 회사 직접 무역 0인 시드는 빠지고 제외 수 1이다.
   - 유리수 정렬: 소수로 정렬하면 순서가 뒤바뀌는 두 분수, 또는 같은 값의 다른 분수 쌍. 중앙이 손 계산 분수와 같다.
   - 환율 기대값은 시험 안에서 `rateAtV2`로 만들지 말고, 고정물 시드의 손 계산 리터럴이나 `referenceRate`를 거치지 않는 독립 오라클로 둔다(0068a-R1 metrics-1의 교훈).
     - 독립 오라클이 어려우면 R1 고정물에서 rate를 시험 안 리터럴로 고정한 손 설정을 쓴다.
6. **J1 관문과 판정 보류**
   - 기준 회사 실패 실행이 R2에 하나 있는 기준 묶음: 기준 열 J10 R0P·R4가 `판정 보류`, 최종 `판정 보류`, 멈춤 표지 줄, 종료 3
   - 같은 상황에서 표본 밖 J10이 `실패`이면 최종은 `실패`
7. **재현 기록**
   - J3·J4a~c·J5·J6·J7·L1의 **결과 칸**이 `기록`이고 `통과`·`실패`가 없다. 근거 칸은 v2 문자열과 같다(J1 근거의 ‘실패 0’이 남아 있어도 된다).
   - J1 행은 이 시험에서 뺀다.
8. **J9 표기**: R1에서 결과 칸이 `진단`이고 근거가 v2 J9 문자열과 같다.
9. **v3-report 최종 표**
   - `--oos` 없음: 표본 밖 칸 `측정 전`, 최종 `미정`
   - 네 칸 모두 통과: 최종 `통과`
   - 한 칸 실패: 최종 `실패`
10. **실제 실행 스모크**(60초 이내)
    - `simMain(['d03','--risk-v2','R4','--policies','MAX_CONTRIBUTION,TERM_GREEDY','--seed-base','2001','--seeds','2','--out',p], io)` 뒤에 `simMain(['v3-tables', p], io)`가 종료 0이다.
    - 출력에 J10·진단 J10②·진단 X 행이 있다.

## 8. 변형 시험(임시로 고치고 되돌림)

| 번호 | 변형 | 실패하는 시험 | 이유 |
|---|---|---|---|
| 1 | `judgmentKindV3`가 위치 계산으로 찾음 | 2 | R0P가 R0(기록)으로 읽힌다 |
| 2 | J10 동점을 m에 넣음 | 3 | 동점 둘 고정물에서 25가 실패로 바뀐다 |
| 3 | J10 `m < 10` 규칙을 지우고 문턱표에 m = 9 → 8을 더함(v3 쪽 사본) | 3 | m = 9, 감소 9가 통과한다 |
| 4 | J10 비교를 `<=`로 | 3 | 동점이 감소로 세진다 |
| 5 | 진단 X 잘림을 `T = E`로(lastDay 무시) | 5 | 48 < due ≤ 60 계약의 eff가 30이 된다 |
| 6 | 진단 X 분모 0 시드를 0으로 넣음 | 5 | 제외 수와 중앙이 달라진다 |
| 7 | 진단 X 정렬을 소수(Number)로 | 5 | 유리수 정렬 고정물의 순서가 바뀐다 |
| 8 | funds 비중 분모에 `skippedNotOpen`을 더함 | 4 | 비중이 손 계산과 다르다 |
| 9 | 판정 보류를 묶음이 아니라 단계 단위로 | 6 | R2 실패인데 R0P·R4 J10이 판정된다 |
| 10 | 재현 기록 결과 칸에 v2 `통과`를 그대로 씀 | 7 | 결과 칸에 `통과`가 나온다 |
| 11 | J1 실패에도 종료 0 | 1·6 | 종료 3 단언 |
| 12 | sha 검사를 지움 | 1 | sha 불일치가 종료 0이 된다 |
| 13 | 묶음 사이 시드 겹침 검사를 지움 | 1 | 겹치는 두 묶음을 받는다 |
| 14 | `RISK_JUDGMENT_KINDS_V2`의 J9 R1을 `진단`으로 바꿈(v2 상수를 고친 경우) | 2, 기존 `risk-tables-v2.test.ts` | v2 상수가 바뀐다 |

- 모두 되돌린 뒤 9절의 검사가 같고, `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 9. 완료 조건

1. **판본 2 바이트 불변**
   - 작은 시드 회귀(작업 전과 작업 끝)
     - `node src/engine/sim/run.mjs d03 --risk-v2 R4 --policies MAX_CONTRIBUTION,TERM_GREEDY,CREDIT_AWARE,MARGIN_BUFFER --seed-base 2001 --seeds 3 --workers 3 --out /tmp/T71-r4-{before|after}.json > /tmp/T71-r4-{before|after}.md`
     - 같은 명령에 `--risk-v2 R0P`, 출력 `T71-r0p-*`
     - JSON과 표준 출력을 `cmp`한다.
     - 그 JSON으로 만든 `v2-tables` 두 출력을 각각 `cmp`한다. `risk-compare-v2`는 아래 SHA256SUMS 재현이 맡는다.
   - **판본 2 SHA256SUMS 재현**(작업 끝에 한 번)
     - `docs/ai/design/path5-measure-2026-10/v2-round1/run.sh`와 같은 명령으로 `V2-R1.json`·`V2-R2.json`을 다시 만든다.
       - `node src/engine/sim/run.mjs d03 --risk-v2 R1 --round 1 --seed-base 1061 --seeds 40 --workers 4 --out …`. R2도 같다.
     - 그 두 JSON으로 `v2-tables` 두 개와 `risk-compare-v2 V2-R1.json V2-R2.json`을 만든다.
     - 다섯 파일의 sha256이 `v2-round1/SHA256SUMS`의 `V2-R1.json`·`V2-R2.json`·`V2-TABLES-R1.md`·`V2-TABLES-R2.md`·`CMP-R1-R2.md` 값과 같아야 한다.
     - 다섯 파일은 경로가 출력에 들어가지 않는 것들이다. 줄인 묶음이라 각 약 1.5분이다. 다른 단계와 보고(경로 포함)는 재현 대상이 아니다.
     - sha만 비교하고 표 내용은 결과 보고에 옮기지 않는다.
     - 세션 A가 측정 트리 `4ca3595`(자료·코드가 TASK-0070 병합 뒤와 같음)에서 이 다섯 파일을 다시 만들어 다섯 sha가 모두 같음을 확인했다(2026-10-30).
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 1절 2의 두 파일(`M`)만 보인다.
   - `git diff <BASE> -- src/engine/sim/risk-tables-v2.ts`는 `export` 추가뿐이다.
2. 골든 둘(`check_rules2_golden.mjs`, `check_rules3_golden.mjs`) 종료 0
3. 기본 `run` 400회(시드 1001~1020)가 작업 전·후 `cmp` 0
4. v1 d03 R3 회귀: TASK-0068a 1절 1 명령으로 JSON·표 `cmp` 0
5. 첫 화면 gzip 증가 0 B(1절 4)
6. 새 시험과 변형 14개가 기대대로다.
7. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py`가 통과한다.
8. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`
9. 결과 보고 `docs/ai/tasks/results/TASK-0071.md`

## 10. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄
- 9절 1~5의 전·후 표. SHA256SUMS 다섯 값의 일치 여부를 포함한다.
- 두 시험 파일의 `USAGE` diff 전문, `risk-tables-v2.ts`의 `export` diff 전문
- `RISK_JUDGMENT_KINDS_V3` 실제 값과 3절 규칙 대조. `해당 없음`을 유지한 칸의 목록을 함께 적는다.
- 표본: 시드 2001~2003 R4와 R0P의 `v3-tables` 출력 전문. 같은 두 단계를 각각 기준·표본 밖인 것처럼 넣은 `v3-report` 출력은 넣지 않는다. 묶음 사이 시드 겹침으로 거절되는 것이 정상이기 때문이다. 대신 손 고정물 보고 하나를 넣는다.
- 시험 출력, 변형 표(실제로 실패한 시험 이름)
- **측정 전에 허브가 할 일**(그대로 적고 실행하지 않는다)
  1. 판정표 v3 0절 고정 기록 다섯 줄. 관문 5는 1181~1300 미사용 확인이다.
  2. 측정 명령 목록(기준 1181~1220, 표본 밖 1221~1260, 각각)
     - `d03 --risk-v2 {R0P..R4} --round 1 --seed-base {1181|1221} --seeds 40 --workers 4 --out …` 다섯
     - R0 기록 `d03 --risk R0 --round 1 --scenarios SCENARIO_M2_OPS_COS_LAVER --policies MAX_CONTRIBUTION,NO_FX --seed-base … --seeds 40 --workers 4 --out …` 하나
     - `v3-tables` 다섯, `v2-tables` 다섯(진단 U·거절 정책별 표용)
     - 마지막에 `v3-report --base … --base-r0 … --oos … --oos-r0 …` 하나
     - `--round 1`은 판본 2 최종 프로필의 회차 표시다. 허브가 다른 표기를 정하면 그에 따른다.
  3. 기준 측정 결과를 기록(커밋)한 뒤 표본 밖을 돈다(판정표 v3 4절).
- 범위 밖에서 발견한 것, 질문

## 처리표(허브 요청 2026-10-30)

| 요청 | 반영 자리 |
|---|---|
| `RISK_JUDGMENT_KINDS_V3`, `v3-tables`·`v3-report` | 2·3·5절 |
| J10 ① 판정 | 4.1, 시험 3, 변형 2~4 |
| 진단 J10②(funds 비 포함) | 4.2, 시험 4, 변형 8 |
| 진단 X(T = min(E, lastDay), eff, 분모 0) | 4.3, 시험 5, 변형 5~7 |
| J9 진단 표기 | 3절, 시험 8 |
| J1 관문과 판정 보류 | 4.4, 시험 6, 변형 9·11 |
| v2 실행 출력·명령 출력·상수·시험 바이트 불변, SHA256SUMS 재현 방법 | 1절 1~3, 9절 1, 변형 14 |
| 400회 cmp, 골든 둘 | 9절 2·3 |
| 첫 화면 gzip 증가 0 | 1절 4, 9절 5 |
| 시험 시드 2001 이상과 400회 예외를 같은 문장에 | 머리말 ‘시드’, 7절 머리 |
| BASE는 0070 병합 뒤 | 머리말 |
