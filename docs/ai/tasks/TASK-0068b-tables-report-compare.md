# TASK-0068b 경로 5 실행기 v2 ②: 표·보고·비교(6열 틀, J 판정, J9, 진단, `risk-compare-v2`, `v2-report`)

- 지위: **개정 1(세션 A, 2026-10-24).** 초안(`d8e3f6a`)은 허브 사전 검수 `docs/ai/tasks/results/PRECHECK-0068b-HUB-2026-10-24.md`(확인 16, major 2, 기각 1)에서 수정 E1~E16을 받았다. 허브 결정 H29(진단 C는 v2 성분 아홉, 세션 A 확인 요청 셋 승인)를 반영했다. 처리는 끝의 ‘개정 1 처리표’에 있다.
  - TASK-0068 개정 1(`15e3551`)을 허브가 나눈 뒤쪽이다(H27 끝). 앞쪽 0068a(+R1)는 병합됐다(개발 브랜치 `56c6d80`, 기록 `7d81280`).
  - 0068 개정 1과 0068a에서 넘긴 항목, 허브 결정 H28, 세션 A 검수 주의 3건의 처리는 끝의 처리표에 있다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행
  - TASK-0068a(+R1)가 병합됐다(개발 브랜치 `56c6d80`, 기록 `7d81280`).
  - **`BASE`는 작업 트리를 만든 커밋이다.** 이 지시서의 승인본을 담은 개발 브랜치 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- 모델:` 줄 아래 `- BASE:`에 적는다.
- **기준 문서와 우선 규칙**
  - 기준
    - 판정표 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md`(승인) 1~4절
    - `docs/ai/design/path3-price-risk-2026-10/DESIGN-v2.md`(승인) 2.2·2.4·2.6절
    - 허브 결정 H23~H28
  - **판정 기준값과 판정 종류는 판정표 v2를 따른다.** 함수 경계, 명령 이름, 출력 모양은 이 지시서를 따른다. 판정표와 다르게 해야 할 이유가 생기면 멈추고 보고한다.
  - 허브가 승인한 판정표와의 차이:

    | 판정표 v2 | 이 지시서 | 근거 |
    |---|---|---|
    | 문턱표 머리말(3.2) ‘J9·L2 ②가 쓴다’ | L2 ②는 3.2 L2 행의 정의대로 판본 1의 ‘늘어남 > 줄어듦’으로 판정한다. 문턱표는 J9만 쓴다 | H27-1(머리말은 오기이고 정오표로 고친다) |
    | 3.1에 없는 행 | ‘진단 M’(판본 1 L3 연속성)을 판정표 밖 기록으로 낸다 | H27-2 (a) |
    | 진단 U의 ‘v1 대비 지연·부분 수금 건수’ | 내지 않는다 | H27-2 (b) |
    | 진단 U에 없는 칸 | 끝난 때 미결 수금 두 칸(`pendingPartialReceipts`·`pendingOverdue`)을 낸다 | H28-2 |
    | 6열 틀의 R0(기록) 열 | v1 `--risk R0` 출력(같은 시드 묶음)을 선택 입력으로 받아 기록만 한다. 입력이 없으면 ‘기록 없음’ | H27-3 |
    | 진단 J8·L4·V 사전 기대 | ‘유동성 효과를 뺀 값’ 주석과 TERM_GREEDY·기준 회사의 직접 무역 수를 나란히 적는다 | H28-1 |
    | 진단 C(판본 1 3.1, v1 원인 일곱) | v2 성분 아홉(`default`·`carry` 포함) 가운데 가장 큰 음수 성분으로 센다. T·F·B는 판본 1 그대로 | H29-1(판정표 v2 3.1 정오표, 허브가 낸다) |

- **이 지시서는 0068a 출력 JSON만 읽는다.**
  - 엔진, 정책, 실행기 실행 경로(`sim.ts`·`operations-*.ts`·`policies.ts`·`variants.ts`·`risk-metrics.ts`·`run.mjs`)는 바꾸지 않는다.
  - 판본 1 출력(JSON·표)과 첫 화면 묶음은 바이트로 같아야 한다.
- 범위 밖: 엔진(`src/engine/*.ts`), 실행기 실행 경로, 자료, 화면, **측정**. 판정표 v2의 측정 시드(1061~1180)와 판본 1 시드(1001~1060)로 v2를 돌리지 않는다.
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 1절 1의 비위험 회귀 확인뿐이다(바이트 비교).

## 0. 앞선 검수에서 얻은 원칙(허브 전달)

1. **고정물 값은 서로 다르게 고른다.** 하한과 상한을 다르게, 두 정책의 값을 다르게, 두 단계의 값을 다르게 잡는다.
   - 예: R0P 중앙 ≠ R4 중앙. TERM_GREEDY와 기준 회사의 판매액도 다르게.
2. **나머지가 생기는 값을 쓴다.** 시드 수는 홀수(39)와 짝수(40)를 둘 다 쓰고, 동점을 하나 이상 넣는다.
3. **실제 R4 실행 스모크 시험을 하나 둔다**(6절 시험 11).
4. **변형마다 ‘어느 시험이 왜 실패하는가’를 한 줄씩 적는다**(7절).
5. **고칠 파일의 진입점과 그 파일을 검사하는 기존 시험을 먼저 읽는다.** 특히 `risk-runner-v2.test.ts` 시험 1(`USAGE` 전문)과 시험 9(v2 실행의 표준 출력 한 줄)를 읽는다.

## 1. 지켜야 할 것(멈춤 조건 포함)

1. **v1 측정 도구, rules-1~3, 0068a v2 실행은 바이트로 같다.** 작업 전과 작업 끝에 아래가 모두 같아야 한다. 어긋나면 고치기 전에 멈추고 보고한다.
   - 골든 두 개: `node tools/check_rules2_golden.mjs` → 0, `node tools/check_rules3_golden.mjs` → 0
   - 비위험 회귀
     - 작업 전: `node src/engine/sim/run.mjs run --out /tmp/TASK-0068b-run-before.json`
     - 작업 끝: `node src/engine/sim/run.mjs run --out /tmp/TASK-0068b-run-after.json`
     - 그 뒤 `cmp`
   - v1 위험 실행 회귀
     - 명령: `node src/engine/sim/run.mjs d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0068b-v1r3-{before|after}.json > /tmp/TASK-0068b-v1r3-{before|after}.md`
     - JSON과 표준 출력을 각각 `cmp`한다.
   - **v2 실행 회귀**
     - 명령: `node src/engine/sim/run.mjs d03 --risk-v2 R4 --policies MAX_CONTRIBUTION,TERM_GREEDY,CREDIT_AWARE,MARGIN_BUFFER --seed-base 2001 --seeds 3 --workers 3 --out /tmp/TASK-0068b-v2r4-{before|after}.json > /tmp/TASK-0068b-v2r4-{before|after}.md`
     - JSON과 표준 출력(한 줄 요약)을 각각 `cmp`한다.
   - **v1 표 회귀(새 항목)**
     - 이 지시서는 `d03.ts`의 표 코드를 함수로 떼어 낼 수 있다(8절). 그래서 판본 1 표 문자열이 바뀌지 않는지 `--tables-from`으로 확인한다. 엔진이 같으므로 JSON은 작업 전에 한 번만 만든다.
     - **작업 전**에 아래 네 JSON을 만든다(시드 2001~2003, 워커 4). 1·2는 `SCENARIO_M2_OPERATIONS`(기본 시나리오, `--scenarios`를 주지 않는다), 3·4는 (다)다. (다)는 실험 시나리오라 `--risk` 없이 주면 종료 2이기 때문이다(`cli.ts:78`, `d03.ts:70`). 표준 출력은 `-before.md`로 받는다.
       1. `node src/engine/sim/run.mjs d03 --seed-base 2001 --seeds 3 --workers 4 --out /tmp/TASK-0068b-plain.json > /tmp/TASK-0068b-plain-before.md`
       2. `node src/engine/sim/run.mjs d03 --late cap30 --seed-base 2001 --seeds 3 --workers 4 --out /tmp/TASK-0068b-cap30.json > /tmp/TASK-0068b-cap30-before.md`
       3. `node src/engine/sim/run.mjs d03 --risk R0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seeds 3 --workers 4 --out /tmp/TASK-0068b-r0.json > /tmp/TASK-0068b-r0-before.md`
       4. `node src/engine/sim/run.mjs d03 --risk R1 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seeds 3 --workers 4 --out /tmp/TASK-0068b-r1.json > /tmp/TASK-0068b-r1-before.md`
     - **작업 끝**에 같은 JSON에서 표를 다시 그려 `-after.md`로 받고, 같은 이름의 `-before.md`와 `cmp`한다.
       - `node src/engine/sim/run.mjs d03 --tables-from /tmp/TASK-0068b-plain.json > /tmp/TASK-0068b-plain-after.md`
       - `node src/engine/sim/run.mjs d03 --tables-from /tmp/TASK-0068b-cap30.json --late cap30 > /tmp/TASK-0068b-cap30-after.md`
       - `node src/engine/sim/run.mjs d03 --risk R0 --tables-from /tmp/TASK-0068b-r0.json > /tmp/TASK-0068b-r0-after.md`
       - `node src/engine/sim/run.mjs d03 --risk R1 --tables-from /tmp/TASK-0068b-r1.json > /tmp/TASK-0068b-r1-after.md`
       - v1 R3 표는 위의 v1 위험 실행 회귀가 확인한다.
     - `node src/engine/sim/run.mjs risk-compare /tmp/TASK-0068b-r0.json /tmp/TASK-0068b-r1.json > /tmp/TASK-0068b-rc-{before|after}.md`를 작업 전과 작업 끝에 돌려 `cmp`한다.
     - **3.2의 (가)를 고르면** 10시드 표 회귀를 하나 더한다. 3시드에서는 J2b 인접 검사와 J6 칸별 행이 돌지 않기 때문이다(n ≥ 10에서만 생긴다).
       - 작업 전: `node src/engine/sim/run.mjs d03 --seed-base 2001 --seeds 10 --workers 4 --out /tmp/TASK-0068b-plain10.json > /tmp/TASK-0068b-plain10-before.md`
       - 작업 끝: `node src/engine/sim/run.mjs d03 --tables-from /tmp/TASK-0068b-plain10.json > /tmp/TASK-0068b-plain10-after.md`, 그 뒤 `cmp`
   - 기존 `src/engine/sim/risk-runner.test.ts`, `seed-base.test.ts`, `risk-runner-v2.test.ts`가 통과한다(아래 2의 예외 한 곳만 고친 채).
2. **기존 시험 파일은 고치지 않는다.**
   - 새 시험은 새 파일 `src/engine/sim/risk-tables-v2.test.ts`에 둔다.
   - **예외 하나**: `risk-runner-v2.test.ts` 시험 1의 `expect(USAGE).toBe(…)` 리터럴만 2.1의 새 `USAGE` 전문으로 바꾼다.
   - 이 파일의 `git diff`는 그 리터럴 안의 줄 추가뿐이어야 한다. 결과 보고에 diff를 그대로 붙인다.
3. **v1 출력에 키를 더하지 않고, v2 실행 출력도 바꾸지 않는다.**
   - `writeD03`의 v2 한 줄 요약은 그대로 둔다(시험 9가 지킨다).
   - v2 표는 새 명령 `sim v2-tables`가 JSON을 읽어 낸다(2.2).
4. **실행기 코드는 첫 화면 묶음에 들어가지 않는다.**
   - 작업 전과 작업 끝에 `npm run --silent build && node tools/check_bundle_size.mjs dist`의 첫 화면 gzip 바이트를 적는다.
   - 0068a 병합본은 132,576 B다. 빌드 표시 조건은 0068a 1절 4(허브 개정 2)와 같게 맞춘다.
   - 값이 바뀌면 멈추고 보고한다.
5. **위험 모듈 import 규칙**(`risk-runner.test.ts:486-532`가 지킨다)
   - 새 파일 `risk-tables-v2.ts`는 보고서 파일 목록(`risk-metrics`·`risk-tables`)에 없다.
   - 그래서 `../risk`에서는 허용 목록(`krwToUsdMinor`, `usdToKrwMinor`, `rowCurrency`, `divHalfAway`, `withRiskLevel`)만 가져올 수 있다. 이 지시서는 JSON만 읽으므로 `../risk`가 필요 없다.
   - `risk-tables-v2.ts`는 `d03.ts`·`risk-tables.ts`·`variants.ts`·`sim.ts`(형만)·`risk-metrics.ts`(형만: `RiskLevelV2`·`RiskContract` 등)·`../../content/scenario`(`loadScenario`)에서 가져온다. `d03.ts`와 `risk-tables.ts`는 `risk-tables-v2.ts`를 가져오지 않는다(순환 금지).
6. **측정하지 않는다.** 측정 명령은 결과 보고에 목록으로만 적고 실행하지 않는다(9절).
7. 커밋, 푸시, 브랜치 전환은 하지 않는다.

## 2. 명령

### 2.1 도움말(`cli.ts`의 `USAGE`)

- 바뀌는 것은 하나다. `sim risk-compare A B` 줄 바로 다음에 세 줄을 넣는다. 다른 줄은 그대로 둔다.
- 시험 1(기존)과 새 시험 1이 `USAGE`가 아래 전문과 정확히 같은지 검사한다.

  ```text
  사용법:
    sim run [--scenarios A,B] [--policies X,Y] [--seeds N] [--out PATH]
    sim d03 [--risk R0|R1|R2|R3] [--scenarios A,B] [--round 0~3] [--seed-base N] [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
    sim d03 --risk-v2 R0P|R1|R2|R3|R4 --seed-base N [--profile ID] [--round 0~3] [--scenarios A] [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
    sim d03 --tables-from a.json,b.json [--late base|cap30|flat200]
    sim risk-compare A B
    sim v2-tables FILE
    sim risk-compare-v2 A B
    sim v2-report R0P R1 R2 R3 R4 [--r0 FILE]
    sim compare BEFORE AFTER [--limit N]
    sim summary FILE
    sim help | --help
  run의 시드 수 N은 기본 목록의 앞 1~20개입니다. 비교 표시 한도는 0 이상의 정수입니다.
  D03의 --seed-base N은 시드 목록을 N~N+(시드 수−1)로 바꿉니다(시드 수 기본 20, 최대 40). --seed-base 없이 시드 수는 20 이하입니다. 분할 번호는 이 목록에 적용됩니다.
  ```

  코드 블록 앞의 두 칸 들여쓰기는 문서 표기다. 실제 `USAGE`의 들여쓰기는 지금 파일과 같다. 명령 줄은 두 칸, 마지막 두 줄은 들여쓰기가 없다.

### 2.2 새 명령 셋

종료 코드는 지금 규칙과 같다. 성공은 0, 사용법·입력 오류는 2다. 오류 문구는 `비교 실행기 오류: …` 다음에 `USAGE`가 붙는다.

| 명령 | 입력 검사(어기면 종료 2) | 출력 |
|---|---|---|
| `sim v2-tables FILE` | 인수가 정확히 하나다. `meta.risk.rules === 'M2a-rules-4'`이다. `meta.lateMode === 'base'`이다. `meta.scenarioIds`가 `['SCENARIO_M2_OPS_COS_LAVER']`이다 | `d03TablesV2(output)`(3절) |
| `sim risk-compare-v2 A B` | 인수가 정확히 둘이다. 둘 다 v2 출력이다. 둘 다 `meta.lateMode === 'base'`이다. B가 A의 바로 다음 단계다(R0P→R1→R2→R3→R4). 메타가 같다(5절) | `riskCompareTablesV2(a, b)`(5절) |
| `sim v2-report F1 … F5 [--r0 FILE]` | 위치 인수가 정확히 다섯이다. 다섯 모두 v2 출력이고 `meta.lateMode === 'base'`이며, 단계가 R0P·R1·R2·R3·R4를 하나씩 덮는다(인수 순서는 상관없다). 다섯의 메타가 같다(5절과 같은 키). `--r0`은 많아야 한 번 오고 값이 있어야 한다. `--r0` 입력은 4.3을 지킨다 | `v2Report(outputs, r0?)`(4절) |

- v2 명령은 v1 출력(`meta.risk.rules` 없음)을 받지 않는다. `--r0`만 예외다. 거절 문구는 `v2 명령은 rules-4 출력만 받습니다.`로 정한다(세 명령 공통).
- lateMode 거절 문구는 `v2 표는 lateMode base만 받습니다.`로 정한다(세 명령과 `--r0` 공통). 이유: 판정표 v2가 base만 잰다. v2 실행 자체는 `--late`를 계속 받는다.

## 3. 단계 표 `d03TablesV2`(새 파일 `src/engine/sim/risk-tables-v2.ts`)

### 3.1 6열 틀과 키(E14·E3·H27-3)

- 새 상수 `RISK_JUDGMENT_KINDS_V2`
  - 키 목록은 아래 리터럴이고 이 순서다. 출력 행 이름도 키와 같다.
  - 키: `J1`, `J2`, `J3`, `J4a~c`, `J4d`, `J5`, `J6`, `J7(새 정의)`, `L1`, `J9`, `진단 J8`, `진단 L4`, `진단 V`, `진단 T`, `진단 C`, `진단 F`, `진단 B`, `진단 U`, `진단 M`, `진단 거절`(스무 개)
- 열은 `R0`·`R0P`·`R1`·`R2`·`R3`·`R4` 여섯이다.
  - 값은 `{ R0: …, R0P: …, … }` 모양의 객체다. 열은 **이름으로 찾는다**. `Number(level[1])` 같은 위치 계산은 쓰지 않는다.
  - 종류 형 `JudgmentKindV2 = '판정' | '진단' | '해당 없음' | '기록'`은 v2 전용이다. v1 `JudgmentKind`는 고치지 않는다.

  | 키 | R0 | R0P | R1 | R2 | R3 | R4 |
  |---|---|---|---|---|---|---|
  | J1 | 기록 | 판정 | 판정 | 판정 | 판정 | 판정 |
  | J2 | 기록 | 진단 | 해당 없음 | 해당 없음 | 해당 없음 | 진단 |
  | J3, J5, J6 | 기록 | 판정 | 해당 없음 | 해당 없음 | 해당 없음 | 판정 |
  | J4a~c | 기록 | 판정 | 판정 | 판정 | 판정 | 판정 |
  | J4d | 기록 | 진단 | 진단 | 진단 | 진단 | 판정 |
  | J7(새 정의) | 기록 | 진단 | 진단 | 진단 | 진단 | 판정 |
  | L1 | 기록 | 진단 | 진단 | 진단 | 진단 | 판정 |
  | J9 | 기록 | 해당 없음 | 판정 | 진단 | 진단 | 진단 |
  | 진단 J8, 진단 L4, 진단 V | 기록 | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
  | 진단 T | 기록 | 해당 없음 | 해당 없음 | 진단 | 진단 | 진단 |
  | 진단 C, 진단 B | 기록 | 해당 없음 | 진단 | 진단 | 진단 | 진단 |
  | 진단 F | 기록 | 해당 없음 | 진단 | 해당 없음 | 진단 | 진단 |
  | 진단 U, 진단 거절 | 기록 | 진단 | 진단 | 진단 | 진단 | 진단 |
  | 진단 M | 기록 | 해당 없음 | 진단 | 진단 | 진단 | 진단 |

- R0 열의 내용은 4.3이 정한다. L2는 `risk-compare-v2`에서만 낸다(5절).
- 조회 함수 `judgmentKindV2(key, level): JudgmentKindV2`를 내보낸다. 상수를 열 이름으로 읽는다. `judgmentRowV2`와 `v2Report`는 종류를 이 함수로만 얻는다.
- 행 하나를 그리는 함수 `judgmentRowV2(key, level, pass, evidence, missing)`
  - 판정: v1 `judgmentRow`처럼 `통과`나 `실패`를 쓴다. 실행이 없으면 `실행 없음: …`, `pass === null`이면 `근거 부족: `을 근거 앞에 붙인다.
  - 진단: 결과 칸에 `진단`을 쓰고 근거를 쓴다.
  - 해당 없음: 결과 칸에 `해당 없음`, 근거 칸에 `—`를 쓴다. 해당 없음 행의 값은 계산하지 않는다.
  - 예외(J4d의 R4): `d03TablesV2`에서는 M′가 없다. 결과 칸에 `보류(v2-report에서 판정)`를 쓰고 근거로 분석값 중앙을 쓴다.

### 3.2 표 구성

- **직접 무역 수**는 이 지시서 전체에서 실행마다 `metrics.risk.directAccepted`다(H28-1의 나란히 적기, 진단 U, 진단 J8·L4, ① 열 모두).
- 비교 값: 모든 v2 단계에서 분석값이다.
  - `valueV2 = (r) => r.metrics.risk?.analysisValueMinor ?? NaN`
  - 0068a가 R0P에도 분석값을 낸다.
- 묶음 종류: `bundleKindV2(meta.risk.level)`로 정한다. R3도 축소다. v1의 `['R1','R2']` 검사를 쓰지 않는다.
- 머리말
  - 첫 줄: `# D03 v2 단계 표 ({level})`
  - 다음 줄: 시드 범위와 실행 수, 프로필 ID, 조정 회차, `marketRulesSha256` 앞 12자
  - 비교 값 설명: v1 위험 표의 분석값 문장을 그대로 쓴다.

| 절 | v2에서 | 비고 |
|---|---|---|
| ① 기준 표 | 남김 | 정책 목록: `IDLE`, `NO_FX`, `MAX_CONTRIBUTION`, `LATE_OK`, `MAX_CONTRIBUTION~fx:react`(full만), `MARGIN_BUFFER`, `TERM_GREEDY`, `CREDIT_AWARE`. v1 열 뒤에 **`직접 무역 수 중앙`**(시드마다 직접 무역 수의 중앙) 열을 더한다(H28-1) |
| ② 투자만 | full만 | reduced는 절 이름 아래 ‘해당 없음(축소 묶음)’ |
| ③·④ 고용 표 | full만 | 같다 |
| ⑤ J 판정 | 남김 | 행: J1, J2, J3, J4a~c, J4d, J5, J6, J7(새 정의), 이 순서. **J2b와 J7(옛 정의)은 내지 않는다.** 식은 3.3 |
| J6 칸별 표, ⑥ 1위 분포, ⑧ 고용일 | full만 | reduced는 ‘해당 없음(축소 묶음)’ |
| ⑦ 사업별 비중 | full만 | 제목 ‘⑦ 사업별 기여이익 비중 (USD 몫만·진단)’. v1과 같은 표시 |
| 진단·조사 선행 비교 | full만 | reduced는 ‘해당 없음(축소 묶음)’ |
| J6 설명 두 문단, ⑤의 J4 문장 | v1 문구 그대로 | |
| ⑨ 위험 판정 | 남김 | 행: L1, J9, 진단 J8, 진단 L4, 진단 V, 진단 T, 진단 C, 진단 F, 진단 B, 진단 U, 진단 M, 진단 거절, 이 순서. **L0, L3, D, (iii), ‘변형 사이 차이’는 내지 않는다** |

- ⑨ 아래에 v1 `riskTables`의 재료 줄(L2 재료, 완료·분류별 손실, 시드별 손실 비율 중앙·사분위)을 같은 문구로 둔다. `(iii) 재료` 줄은 빼고 둔다.
- **코드 재사용**
  - `d03.ts`의 v1 `d03Tables` 안에 인라인으로 있는 계산(J2 칸 묶음, J2b 인접 검사, J3 후보·1위 집계, J6 칸별 예측, 사업 비중, 고용일 표)은 두 가지 중 하나로 쓴다.
    - (가) 같은 파일 안에서 내보내는 함수로 떼어 내고 v1과 v2가 함께 부른다.
    - (나) `risk-tables-v2.ts`에 복사한다.
  - (가)를 고르면 v1 표 문자열이 바뀌면 안 된다. 1절 1의 v1 표 회귀가 이를 확인한다.
  - `unpaid`·`healthy`처럼 지금 내보내지 않는 함수는 `export`만 더할 수 있다.
  - `risk-tables.ts`에서는 `median`·`num`에 `export`를 더하는 것만 허용한다. 식은 바꾸지 않는다.

### 3.3 판정 식(판정표 v2 3.2)

- 기준 회사는 `MAX_CONTRIBUTION`이다. n은 기준 회사 실행 수(시드 수)다.
- 모든 비율과 경계는 정수 교차곱(BigInt)으로 비교한다. 부동소수 비교는 표시용으로만 쓴다.

| 키 | 식 | 필요한 실행(없으면 ‘실행 없음’) |
|---|---|---|
| J1 | 기준 회사 모든 시드가 `healthy`(실패 아님, 끝 원화 미지급 0) | 기준 회사 |
| J2(진단) | v1 J2 식 그대로(핵심 고용 칸 ↑·↓ 둘 다). 근거 문구도 v1과 같다 | v1과 같다 |
| J3 | `20 × strongest < 17 × n`. 후보는 v1 J3 후보에서 `TERM_GREEDY`·`CREDIT_AWARE`·`MARGIN_BUFFER`를 더 뺀다. v1 1위 집계 후보 제외 목록 `['IDLE','NO_FX','MARGIN_BUFFER','FOCUS']`에 `'TERM_GREEDY','CREDIT_AWARE'`를 더한다 | v1 J3 목록에서 같은 셋을 뺀 것 |
| J4a~c | v1 위험 식 그대로: `shape && 4 × NO_FX 실패 ≥ 3 × NO_FX 실행 수` | 기준 회사, `NO_FX` |
| J4d | 단계 표: 분석값 중앙을 근거로 쓴다(R4는 3.1의 ‘보류’). `v2-report`: 4.2 | 기준 회사 |
| J5 | v1 식 그대로: `20 × gains ≤ 3 × n`(두 명 고용 칸) | v1과 같다 |
| J6 | v1 식 그대로: `5 × matches ≥ 4 × 칸 수` | v1과 같다 |
| J7(새 정의) | 새 함수 `newJ7V2(runs)`. v1 `newJ7`과 같은 계산을 하되, **남은 시드 < 20이면 `pass = null`**(실패로 그린다). 아니면 `4 × numerator ≥ denominator`. v1 `newJ7`은 고치지 않는다 | 기준 회사 |
| L1 | v1 `lossBandPasses(loss, total)`(5% 이상 25% 이하, 교차곱). 손실 계약은 v1 정의(직접 무역 `realized < 0`) | 기준 회사 |
| J9 | 아래 J9 | 기준 회사, `TERM_GREEDY` |

- **J9**
  - 시드마다, 정책 p(`TERM_GREEDY`, 기준 회사)마다 분자와 분모를 낸다.
    - 분자 `a_p = Σ |components.fx|`, 분모 `b_p = Σ saleKrwAtAcceptMinor`. 둘 다 그 실행의 직접 무역 계약에 대해 더한다.
  - 비교는 `a_TG × b_base`와 `a_base × b_TG`를 교차곱으로 한다.
    - 앞이 크면 TERM_GREEDY 우세, 뒤가 크면 기준 회사 우세, 같으면 동점이다.
    - 분모가 0인 실행은 분자도 0이다. 그래서 교차곱이 0 = 0이 되어 **동점**이다. 따로 예외를 두지 않는다.
  - 동점 시드를 뺀 수가 m이다. 통과 조건은 `m ≥ 10`이면서 `TG 우세 수 ≥ SIGN_THRESHOLDS_V2[m]`이다. `m < 10`이면 실패다.
  - 근거 문구: `TG 우세 {w}/{m} (문턱 {t}, 동점 {ties}); 사전 기대 33 대 7(DESIGN-v2 2.6)`
- **문턱표 `SIGN_THRESHOLDS_V2`**
  - m = 10..40이고 판정표 v2 3.2 표 그대로다(10→9 … 39→26, 40→26).
  - 세션 A가 `20 × Σ_{i≥k} C(m,i) ≤ 2^m`를 만족하는 최소 k로 31개 모두 다시 계산해 일치를 확인했다.
  - **J9만 쓴다**(H27-1). v1 `L3_THRESHOLDS`는 고치지 않는다.

### 3.4 진단 행(⑨)

| 행 | 값 | 사전 기대(출처) |
|---|---|---|
| 진단 J8 | 시드마다 분석값 `TERM_GREEDY` > 기준 회사인 시드 수. 같음 수와 작음 수도 적는다. **그리고 두 정책의 직접 무역 수 합과 시드별 중앙을 나란히 적는다**(H28-1) | 중앙 35/40, 띠 8~32 안 확률 0.14(DESIGN-v2 2.4). **유동성 효과를 뺀 값(H28-1)** |
| 진단 L4 | `CREDIT_AWARE` > 기준 회사 시드 수, 같음·작음 수, 두 정책의 직접 무역 수 | 중앙 36/40(DESIGN-v2 2.4). **유동성 효과를 뺀 값(H28-1)** |
| 진단 V | 시드마다 `CREDIT_AWARE` − `TERM_GREEDY` 분석값. 중앙, 사분위(v1 `lossStats`와 같은 사분위 규칙), 동점·양수·음수 시드 수 | 평균 +21 USD/시드(표준편차 54), 동점 약 27, TG 우세 약 11.8, CA 우세 약 1.2(판정표 v2 3.5, DESIGN-v2 2.4). **유동성 효과를 뺀 값(H28-1)** |
| 진단 T·F·B | v1 `diagnostics(runs, base, seeds)`의 같은 칸, 같은 문구 | 없음 |
| 진단 C | 새 함수 `causesV2(base)`. 기준 회사 직접 무역 손실 계약(`realized < 0`)마다 v2 성분 아홉 `fx`·`tariff`·`surcharge`·`claim`·`collection`·`default`·`carry`·`late`·`cancel` 가운데 가장 큰 음수 성분(값이 가장 작은 것, 같으면 이 목록 순서의 앞)을 원인으로 센다. 음수 성분이 없으면 `음수 칸 없음`. 출력은 v1처럼 `JSON.stringify(원인별 수)`. v1 `diagnostics`는 고치지 않는다(H29-1) | 없음 |
| 진단 U | 3.5 | 3.5 |
| 진단 M | 3.6 | 없음(문턱을 쓰지 않는다) |
| 진단 거절 | 3.7 | 없음 |

- 유동성 주석은 진단 J8·L4·V 세 행 각각의 사전 기대 칸 끝에 아래 문장을 그대로 붙인다.
  - ‘사전 기대는 유동성 효과(외상 정책이 첫날 D30으로 현금이 묶여 뒤 거래를 놓침)를 뺀 값이다(H28-1).’

### 3.5 진단 U(판정표 v2 3.1, H27-2 (b), H28-2, E13)

- **정책별 표**: 각 정책(묶음 안의 정책 전체)의 `metrics.risk.credit`를 시드에 걸쳐 더한다.
  - 열은 `defaultsConfirmed`, `badDebtMinor`, `defaultsUnconfirmed`, `unconfirmedMinor`, `carryMinor`, `limitBlocked`, `termCounts`(BASE/D15/D30), `lateReceipts`, `partialReceipts`, `pendingPartialReceipts`, `pendingOverdue`, `dateEligible`, `dateLimitEligible`, 직접 무역 수다.
  - 금액은 청구서 통화(USD) 센트 정수이고 환산하지 않는다. 열 머리에 `USD 센트`로 적는다.
- **끝난 때 미결 지연(대손 아님)**: 열 `pendingOverdue − defaultsUnconfirmed`를 더한다.
  - 미확정 대손 청구서는 엔진에서 수금이 하나도 없이 OVERDUE로 남는다(`engine.ts`의 `processCollections`, 대손 분기는 수금 전에 `continue`한다). 그래서 `pendingOverdue`에 들어 있다.
  - 표 아래에 이 관계를 한 줄로 적는다.
  - 값이 음수이면 표에 그대로 내고 `⚠ 정의 확인` 표지를 붙인다. 고치지 않는다.
  - 네 수금 칸(`lateReceipts`·`partialReceipts`·`pendingPartialReceipts`·`pendingOverdue`)은 서로 겹치지 않는다(0068a-R1). 대손 두 칸과는 위처럼 겹친다.
- **비율**: 정책마다 `dateEligible ÷ 직접 무역 수`, `dateLimitEligible ÷ 직접 무역 수`(%, 소수 둘째 자리).
  - **25% 관문 값**은 `TERM_GREEDY`의 날짜+한도 비율이다. 보고만 하고 판정하지 않는다(판정표 v2 3.6).
  - 사전 대리값 31.5%(DESIGN-v2 2.2, R3 대리값)를 같은 줄에 적는다.
- **대손 수**: 기준 회사의 확정 대손 수 ÷ 시드 수, (확정 + 미확정) ÷ 시드 수(소수 둘째 자리).
- 사전 기대(E13)는 같은 줄에 이 문구 그대로 적는다.
  - ‘확정 0.44, 합 0.59. 출처: 세션 A 계산, DESIGN-v2 2.0의 `diag/m4.json`(R3, 시드 1001~1040, 기준 회사 425계약)에 V2 등급 확률을 넣어 Σ p_등급 × 1[실효 결제일 + 15 ≤ 90] ÷ 40(확정), 같은 식에서 절단을 뺀 값(합). J1 일회 점검(시드 2001~2010)에서 확정 8건(기대 약 4.4).’
- 표 아래에 두 줄을 적는다.
  - ‘v1 대비 지연·부분 수금 건수는 내지 않는다(H27-2 (b)).’
  - ‘v2 R3는 판본 1 R3와 같은 층이 아니다. 값을 직접 견주지 않는다(판정표 v2 2절).’

### 3.6 진단 M(H27-2 (a), E10(a))

- 행 근거의 첫머리에 ‘판정표 v2 3.1 밖의 기록(판본 1 L3 연속성)’을 쓴다.
- 원시 값만 낸다.
  - `MARGIN_BUFFER`와 기준 회사의 손실 수/계약 수
  - 시드 짝에서 `MARGIN_BUFFER` 손실 비율이 더 낮은 시드 수/동점 뺀 짝 수(교차곱, v1 `marginComparison`의 m·wins와 같은 정의)
  - `MARGIN_BUFFER` 직접 무역 계약 수
- **행 전체에 ‘통과’·‘실패’·‘충족’·‘미충족’과 문턱 숫자를 쓰지 않는다.**
- v1 `marginComparison`은 고치지 않는다. 새 함수 `marginRawV2(base, mb)`가 계산한다.
  - `lossStats`는 다시 써도 된다.
  - `L3_THRESHOLDS`는 쓰지 않는다. m > 20에서 v1 식이 늘 거짓이기 때문이다(PRECHECK-0068 D10).

### 3.7 진단 거절(판정표 v2 3.4, 세션 A 주의 (b))

- 정책별로 `metrics.operations.rejectionsV2`를 시드에 걸쳐 더한다.
  - 열은 후보 단위 사유 일곱(`funds`·`storage`·`handling`·`sailing`·`staff`·`onTime`·`credit`), **`후보 합`**(일곱 사유의 합, `skippedNotOpen` 제외), 짝, 견적, OPEN 아님 건너뜀이다.
- **분모 범위가 다르므로 한 비율로 묶지 않는다.**
  - 후보 단위와 OPEN 아님 건너뜀은 운송 주선 후보도 센다.
  - 짝과 견적은 직접 무역만 센다(0068a 3.3).
  - 그래서 세 단위를 서로 더하거나 나누지 않는다.
  - 표 아래에 ‘후보 단위·OPEN 아님 건너뜀은 운송 주선 후보를 포함하고, 짝·견적은 직접 무역만 센다. 단위끼리 더하거나 나누지 않는다.’를 적는다.
- 행 근거는 `TERM_GREEDY`와 기준 회사의 `credit` 수와 짝·견적 수를 요약한다. 정책별 전체 표는 행 아래에 둔다.

## 4. 다섯 단계 보고 `v2Report`(`v2-report`)

### 4.1 입력과 머리말

- 입력은 다섯 단계 출력과 선택 `--r0` 하나다.
- 머리말
  - 제목: `# 판정표 v2 보고`
  - 시드 범위와 개수, 프로필 ID, 조정 회차, `marketRulesSha256`, `engineVersion`, `dataVersion`
  - 각 입력의 실행 수
  - `--r0` 경로나 ‘R0 입력 없음’
- 본문 순서는 4.2 → 4.3의 6열 표 → 단계별 근거다.
- 단계별 근거
  - 각 단계의 ⑤ J 판정 표와 ⑨ 위험 판정 표를 `d03TablesV2`와 같은 행 문자열로 다시 낸다.
  - 단계마다 `### {level}`을 붙이고, R0P → R4 순서로 둔다.
  - 단, R4의 J4d 행은 4.2의 판정으로 바꾼다.

### 4.2 J4d와 M′(판정표 v2 3.2·3.3)

- M′ = **같은 보고 안의 R0P 출력**에서 낸 기준 회사 분석값 중앙(`median`, 시드 수가 짝수면 가운데 두 값의 평균)이다.
- R4 판정: R4 기준 회사 분석값 중앙이 `1,069,200` 이상이고 M′ 이하이면 통과다. 같으면 통과다.
  - `1,069,200`은 `J4_BANDS.risk[0]`이고 시작 분석값 10,692 USD다.
- 비교는 정수로 한다. 40시드에서 중앙이 x.5일 수 있으므로 `2 × R4 중앙 ≥ 2 × 1,069,200`, `2 × R4 중앙 ≤ 2 × M′`을 BigInt로 비교한다(`BigInt(x.5)`는 예외가 난다).
- 근거 문구: `R4 중앙 {x}, M′(R0P 중앙) {y}, 하한 10,692`
- R0P·R1·R2·R3의 J4d는 진단이고 중앙만 적는다.

### 4.3 6열 표와 R0 열(H27-3, E11)

- 표 머리: `| 키 | R0 | R0P | R1 | R2 | R3 | R4 |`
- 행은 3.1의 스무 키다. R0P~R4 칸에는 종류에 따라 아래를 쓴다.
  - 판정: `통과` 또는 `실패`
  - 진단: `진단`
  - 해당 없음: `해당 없음`
- **R0 열**
  - `--r0`이 있으면 그 v1 출력의 기준 회사 값으로 아래 네 키만 `기록: …`으로 채운다. 나머지 키와 `--r0`이 없을 때는 `기록 없음`이다.

    | 키 | 기록 내용 |
    |---|---|
    | J1 | `실패 {a}/{n}, 끝 원화 미지급 {b}/{n}` |
    | J4a~c | `NO_FX 실패 {x}/{y}, 최대 묶음 {z}견적`. `NO_FX` 실행이 없으면 `NO_FX 실행 없음` |
    | J7(새 정의) | `중앙 {p}%, 남은 시드 {k}`(v1 `newJ7`) |
    | L1 | `손실 {loss}/{total}` |

  - `--r0` 입력 검사(어기면 종료 2)
    - `meta.risk`가 있고 `rules` 키가 없으며 `level === 'R0'`이다.
    - `meta.scenarioIds`에 (다)가 있다.
    - `meta.lateMode === 'base'`이다.
    - `meta.seeds`가 다섯 v2 출력의 시드 집합과 같다.
    - `meta.risk.marketRulesSha256`이 v2 출력과 같다.
  - R0 기록은 `scenarioId === 'SCENARIO_M2_OPS_COS_LAVER'`인 실행만 걸러 쓴다. 다른 시나리오 실행이 섞여 있어도 기록 값에 들어가지 않는다.
  - R0 열은 판정에 쓰지 않는다. 표 아래에 ‘R0 열은 기록이며 위험 효과의 기준 경로는 R0P다(판정표 v2 2절).’를 적는다.
- J8·L4·V 행의 사전 기대 각주(3.4)를 이 표 아래에도 한 번 적는다.

## 5. 층 비교 `riskCompareTablesV2`(`risk-compare-v2`, L2, H27-1)

- **메타 검사**
  - 두 출력 모두 `meta.risk.rules === 'M2a-rules-4'`이다.
  - 단계는 R0P → R1 → R2 → R3 → R4에서 바로 다음 층만 받는다.
  - 아래 키가 같아야 한다. `v2-report`도 다섯 입력에 같은 검사를 한다.
    - `meta.risk`의 `profileId`·`tuningRound`·`marketRulesSha256`
    - `meta`의 `engineVersion`·`dataVersion`·`format`·`lateMode`·`scenarioIds`
    - 정렬한 `seeds`
  - 기준 회사 실행이 빠지면 v1처럼 `실행 없음: …`으로 종료 2다.
- **L2 ①·②는 판본 1 식 그대로다**(v1 `compareRisk`와 같은 식)
  - ①: `100 × (b.loss × a.total − a.loss × b.total) ≥ a.total × b.total`
  - ②: 손실 수가 늘어난 시드 수 > 줄어든 시드 수(기준 회사)
  - **문턱표는 쓰지 않는다**(H27-1).
- **판정 종류**: R2→R3, R3→R4는 `판정`이다. R0P→R1, R1→R2는 `진단`이다.
  - 진단일 때 L2 행 결과 칸에는 `진단`을 쓰고, 근거에 ①·②의 값과 ‘(판정이었다면 통과/실패)’를 적는다.
- **R0P→R1에서만** J9 판본 1식 진단 행을 더한다.
  - `TERM_GREEDY`와 기준 회사의 손실 비율 변화(%p)를 각각 낸다.
  - 그 차이(TG 변화 − 기준 변화, %p)와 `TERM_GREEDY`의 시드별 손실 수 증감 수(늘어남·줄어듦·같음)를 낸다.
  - 사전 기대: `TERM_GREEDY` − 기준 회사 = 0.00%p(판정표 v2 3.2).
  - `TERM_GREEDY` 실행이 없으면 이 행은 `실행 없음`이다(종료 2가 아니다).
- v1의 `(iii)`은 내지 않는다.
- 제목: `# 위험 층 비교 v2 {a} → {b}`
- v1 `compareRisk`·`riskCompareTables`는 고치지 않는다.

## 6. 시험(새 파일 `src/engine/sim/risk-tables-v2.test.ts`)

- 시드는 2001 이상만 쓴다. 0절 원칙을 따른다.
- 대부분의 시험은 **손으로 만든 v2 `SimOutput`**으로 한다. 실행이 필요 없다.
  - 고정물 만드는 법: 실제 R4 실행 하나(시드 2001, `MAX_CONTRIBUTION`)를 `simulate`로 얻는다. 그것을 `structuredClone`해 `seed`, `policyId`, `analysisValueMinor`, `contracts`, `directAccepted`, `credit`, `rejectionsV2`, `outcome`, `unpaidAtEnd`를 시험마다 덮어쓴다. `directAccepted`는 `contracts`의 DIRECT_TRADE 수와 같게 둔다.
  - 메타는 0068a 모양(`rules`·`level`·`profileId`·`tuningRound`·`marketRulesSha256`)을 그대로 쓴다.

1. **CLI**
   - `USAGE`가 2.1 전문과 같다.
   - 2.2 표의 입력 검사를 하나씩 확인한다(각각 종료 2와 오류 문구 일부).
     - 인수 개수
     - v1 출력을 v2 명령에 넣음
     - `lateMode: 'cap30'` v2 출력을 `v2-tables`·`risk-compare-v2`·`v2-report`에 각각 넣음(`v2 표는 lateMode base만 받습니다.`)
     - (다) 아닌 시나리오
     - `v2-report`의 단계 중복·누락
     - `--r0` 값 없음·두 번
   - v1 출력을 `v2-tables`에 넣으면 종료 2이고, 표준 오류에 거절 문구 `v2 명령은 rules-4 출력만 받습니다.`가 정확히 들어 있다.
   - 정상 입력은 종료 0이다.
2. **6열 틀**
   - `RISK_JUDGMENT_KINDS_V2`가 3.1 표 전체와 리터럴로 같다.
   - 키 목록이 3.1 리터럴과 같은 순서다.
   - v1에만 있는 키(`J2b`, `J7(옛 정의)`, `L0`, `L3`, `D`)가 없다.
   - 조회 함수로 열을 이름으로 찾는다: `judgmentKindV2('J1','R0')`은 `기록`, `('J1','R0P')`는 `판정`. `('J4d','R0P')`는 `진단`, `('J4d','R4')`는 `판정`. `('J9','R0P')`는 `해당 없음`, `('J9','R1')`은 `판정`.
   - `judgmentRowV2('J1','R0P', true, …)`의 결과 칸은 `통과`, `false`이면 `실패`다(`기록`이 아니다).
3. **문턱표**
   - m = 10..40 전체가 3.3 표와 같다.
   - 각 m에서 `20 × Σ_{i≥k} C(m,i) ≤ 2^m`인 최소 k를 BigInt로 다시 계산해 대조한다.
   - J9 함수에서 m = 9, TG 우세 9는 실패다. m = 10, TG 우세 9는 통과다.
4. **판정 식**(손 고정물, 시드 수 39와 40 둘 다)

   | 대상 | 통과 | 실패 |
   |---|---|---|
   | J3 | 1위 근처 33/40 | 34/40 |
   | J5 | 6/40 | 7/40 |
   | J4c | 30/40, 30/39 | 29/40, 29/39 |
   | J7(새 정의) 남은 시드 | 20(값 계산) | 19(근거 부족·실패) |
   | L1 | 1/20, 1/4 | 1/21, 2/7 |

   - **J9**
     - TERM_GREEDY의 판매액이 기준 회사와 다르게 둔다. 분모를 1로 바꾸면 결과가 뒤집히는 고정물이어야 한다.
     - 분모 0 실행은 동점이다.
     - m = 40: TG 우세 26은 통과, 25는 실패다.
     - 시드 40에 동점 둘을 넣어 m = 38: TG 우세 25는 통과(문턱 25), 24는 실패다. 동점을 m에 넣으면 m = 40, 문턱 26이 되어 25가 실패한다(변형 7).
   - **진단 J8·L4·V**
     - 동점·양수·음수 시드 수, V의 중앙·사분위가 손 계산과 같다.
     - J8 행에 두 정책의 직접 무역 수 합이 나온다.
     - 세 행에 ‘유동성 효과를 뺀 값(H28-1)’ 문자열이 있다.
   - **진단 C**(H29-1): 확정 대손 계약(`default` 성분이 가장 큰 음수, `fx`도 음수로 더 작은 크기) 하나가 있는 고정물에서 원인 집계에 `"default":1`이 나오고 `fx`로 세지 않는다.
   - **진단 M**
     - 원시 값이 손 계산과 같다.
     - 행 문자열에 `통과`·`실패`·`충족`이 없다.
5. **J4d와 M′**(손 고정물 다섯 단계. 변형 5를 가르는 사례에서는 R0P 중앙 ≠ R4 중앙)
   - R4 중앙 = M′ → 통과
   - R4 중앙 = M′ + 1 → 실패. M′ ≥ 1,069,200으로 둔다.
   - R4 중앙 = 1,069,199 → 실패. 이때 M′ ≥ 1,069,199로 둔다.
   - 40시드에서 R4 중앙이 x.5가 되는 고정물: R4 중앙 = M′ + 0.5 → 실패(예외 없이 끝난다).
   - `d03TablesV2` 단독 R4 표의 J4d는 `보류(v2-report에서 판정)`이다.
6. **`risk-compare-v2`**
   - R0P→R1과 R3→R4를 받는다. R1→R3, R4→R3, R1→R0P는 거절한다.
   - `profileId`·`tuningRound`·`marketRulesSha256`·`seeds` 하나만 다른 쌍은 각각 거절한다.
   - v1 출력은 거절한다.
   - R2→R3·R3→R4는 `판정`, R0P→R1·R1→R2는 `진단`이다.
   - **L2 ② 경계(m = 40)**: 늘어남 21·줄어듦 19는 통과, 20·20은 실패다(H27-1).
   - L2 ① 경계: 정확히 +1.0%p는 통과, 그보다 작으면 실패다.
   - R0P→R1에만 J9 판본 1식 진단 행이 있다. `(iii)` 문자열은 없다.
7. **`v2-report`**
   - 다섯 단계를 하나씩 요구한다. 인수 순서를 섞어도 같은 출력이다.
   - 메타가 다른 입력은 거절한다.
   - `--r0`
     - 있으면 R0 열의 J1·J4a~c·J7(새 정의)·L1이 `기록:`으로 시작하고, 다른 키는 `기록 없음`이다.
     - 없으면 R0 열 전체가 `기록 없음`이다.
     - 시드가 다른 `--r0`, v2 출력인 `--r0`, `level: 'R1'`인 v1 `--r0`, `lateMode: 'cap30'`인 `--r0`은 각각 종료 2다.
     - (다)와 다른 시나리오 실행이 섞인 `--r0`: 다른 시나리오 실행의 값(예: 실패 실행)이 R0 기록에 들어가지 않는다.
8. **진단 U**
   - 정책별 합이 손 계산과 같다.
   - 끝난 때 미결 지연(대손 아님)이 `pendingOverdue − defaultsUnconfirmed`다. 고정물: `pendingOverdue` 3, `defaultsUnconfirmed` 2 → 1.
   - 25% 관문 값이 `TERM_GREEDY`의 `dateLimitEligible ÷ 직접 무역 수`다. `dateEligible`과 다른 값으로 둔다.
   - 31.5%·0.44·0.59 사전 기대 문구가 있다.
   - ‘v1 대비 … 내지 않는다’와 ‘직접 견주지 않는다’ 두 줄이 있다.
9. **진단 거절**
   - 정책별 합이 손 계산과 같다.
   - OPEN 아님 건너뜀은 후보 단위 합에 들어가지 않는다. 고정물: 후보 사유 합 5, skippedNotOpen 3 → 표의 후보 합 5.
   - 분모 범위 주석 문장이 있다.
10. **`d03TablesV2` 구성**
    - R3(축소)의 ②·③·④·J6 칸별·⑥·⑦·⑧이 `해당 없음(축소 묶음)`이다. R4(전체)에는 표가 있다.
    - 출력에 `J2b`, `J7(옛 정의)`, `| L0 `, `| L3 `, `| D `, `(iii)`, `변형 사이`가 없다.
    - ⑨에 3.2의 행 이름이 모두 이 순서로 있다.
    - **J3 후보 제외**: `TERM_GREEDY`가 1위 근처 시드 수가 가장 많은 고정물에서, J3 근거의 ‘가장 강한’ 정책이 `TERM_GREEDY`가 아니다. `CREDIT_AWARE`가 가장 많은 고정물에서도 ‘가장 강한’ 정책이 `CREDIT_AWARE`가 아니다.
11. **R4 스모크**(실제 실행, 60초 이내)
    - `simMain(['d03', '--risk-v2', 'R4', '--policies', 'MAX_CONTRIBUTION,TERM_GREEDY,CREDIT_AWARE,MARGIN_BUFFER', '--seed-base', '2001', '--seeds', '2', '--out', path], io)` 뒤에 `simMain(['v2-tables', path], io)`가 종료 0이다.
    - 표에 ⑨의 열두 행 이름이 모두 있다.
    - 진단 U 표의 `termCounts` 합이 같은 표의 직접 무역 수 합과 같다.
12. **v1 보존**
    - 1절 1의 표 회귀가 맡는다.
    - 이 파일에서는 v1 `d03Tables`·`riskTables`·`riskCompareTables`가 v2 출력을 여전히 거절하는지만 확인한다(0068a 동작 유지).

## 7. 변형 시험(임시로 고치고 되돌림)

각 줄의 ‘이유’는 그 시험이 왜 실패하는지다.

| 번호 | 변형 | 실패하는 시험 | 이유 |
|---|---|---|---|
| 1 | 6열 종류를 위치 계산(`Number(level[1])`)으로 찾음 | 시험 2 | `R0P`가 R0 열(기록)로 읽힌다 |
| 2 | 문턱표 m = 39를 25로 | 시험 3 | 이항 재계산과 다르다 |
| 3 | J9의 `m < 10` 실패 규칙을 지우고 문턱표에 m = 9 → 8을 더함 | 시험 3 | m = 9, TG 우세 9가 통과한다 |
| 4 | J7(새 정의) 남은 시드 문턱을 10으로 | 시험 4 | 19개 남은 경우가 값으로 판정된다 |
| 5 | J4d의 M′를 R4 중앙으로 | 시험 5 | R4 중앙 = M′ + 1 고정물이 통과한다 |
| 6 | J9 분모를 1로 | 시험 4 | 판매액이 다른 고정물에서 우세 수가 바뀐다 |
| 7 | J9 동점을 m에 넣음 | 시험 4 | 동점 둘 고정물에서 m = 40, 문턱 26이 되어 우세 25가 실패한다 |
| 8 | `risk-compare-v2`가 R1→R3를 허용 | 시험 6 | 바로 다음 층 검사가 빠진다 |
| 9 | L2 ②에 문턱표(m = 40 → 26)를 씀 | 시험 6 | 21·19가 실패로 바뀐다(H27-1) |
| 10 | `risk-compare-v2`의 `profileId` 검사를 지움 | 시험 6 | 프로필만 다른 쌍을 받는다 |
| 11 | J3 후보에서 `TERM_GREEDY`를 빼지 않음 | 시험 10 | 가장 강한 정책이 `TERM_GREEDY`가 된다 |
| 12 | 축소 판단을 v1 `['R1','R2']` 검사로 | 시험 10 | R3에 빈 고용 격자가 나온다 |
| 13 | 진단 M 근거에 `충족`을 씀 | 시험 4 | H27-2 (a) 단언 |
| 14 | `v2-report`가 같은 단계 둘을 받음 | 시험 7 | 단계 중복이 종료 0이 된다 |
| 15 | `--r0`의 시드 검사를 지움 | 시험 7 | 시드가 다른 R0 입력을 받는다 |
| 16 | 25% 관문 값을 `dateEligible`로 | 시험 8 | 고정물에서 두 비율이 다르다 |
| 17 | 미결 지연에서 `defaultsUnconfirmed`를 빼지 않음 | 시험 8 | 3이 나와 기대 1과 다르다 |
| 18 | 진단 거절의 후보 합에 `skippedNotOpen`을 더함 | 시험 9 | 후보 합이 8이 된다 |
| 19 | `v2-tables`가 v1 출력을 받음 | 시험 1 | 거절 문구가 나오지 않는다(다른 예외 문구 또는 종료 0) |
| 20 | J8·L4·V의 유동성 주석을 지움 | 시험 4 | H28-1 문자열이 없다 |
| 21 | J3 후보에서 `CREDIT_AWARE`를 빼지 않음 | 시험 10 | 가장 강한 정책이 `CREDIT_AWARE`가 된다 |
| 22 | 진단 C 성분 목록에서 `default`를 뺌 | 시험 4 | 확정 대손 계약이 `fx`로 세어진다 |

- 모두 되돌린 뒤 1절 1의 검사가 같고, `git status --porcelain`에 변형 흔적이 없음을 보인다.

## 8. 고칠 수 있는 파일

- 새 파일
  - `src/engine/sim/risk-tables-v2.ts`
  - `src/engine/sim/risk-tables-v2.test.ts`
- 기존 파일
  - `src/engine/sim/cli.ts`: `USAGE`와 2.2의 세 명령 분기만
  - `src/engine/sim/d03.ts`: 3.2 ‘코드 재사용’의 (가)만. v1 표 문자열은 같아야 한다
  - `src/engine/sim/risk-tables.ts`: `median`·`num`에 `export`를 더하는 것만
  - `src/engine/sim/risk-runner-v2.test.ts`: 1절 2의 `USAGE` 리터럴만
  - `MANIFEST.json`: 생성만
  - `docs/ai/tasks/results/TASK-0068b.md`
- 그 밖의 파일은 고치지 않는다. 필요하면 멈추고 보고한다.
  - `risk-metrics.ts`, `operations-*.ts`, `policies.ts`, `variants.ts`, `sim.ts`, `run.mjs`
  - 엔진 `src/engine/*.ts`, `src/content/**`, `data/**`, `schemas/**`, `src/ui/**`
  - 골든 파일과 도구, 다른 기존 시험 파일

## 9. 완료 조건

1. 1절 1의 검사가 작업 전과 작업 끝에 같다.
   - 골든 둘
   - 비위험 400회 cmp
   - v1 R3 d03 JSON·표 cmp
   - v2 R4 JSON·요약 cmp
   - v1 표 회귀 네 개와 `risk-compare` cmp
   - 기존 시험 세 파일 통과
2. 기존 시험 파일 변경
   - `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 `M src/engine/sim/risk-runner-v2.test.ts` 한 줄뿐이다.
   - 그 diff는 1절 2의 리터럴뿐이다.
   - `git status --porcelain --untracked-files=all`의 `??` 줄은 새 파일 둘과 결과 보고뿐이다.
3. 새 시험과 변형 22개가 기대대로다.
4. 첫 화면 gzip이 작업 전과 작업 끝에 같다(1절 4).
5. `python3 tools/build_package.py --manifest-only`와 `python3 tools/validate_data.py`가 통과한다.
6. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`가 `실패 0종`이다.
7. 결과 보고 `docs/ai/tasks/results/TASK-0068b.md`가 있다.

## 10. 결과 보고에 적을 것

- `BASE`, 바꾼 파일과 줄. `d03.ts`에서 함수를 떼어 냈다면 그 목록.
- 1절 1 검사와 첫 화면 gzip의 전·후
- 도움말 전후, `risk-runner-v2.test.ts`의 diff 전문
- `RISK_JUDGMENT_KINDS_V2` 실제 값과 3.1 표 대조, 문턱표 재계산 출력
- 표본: 실제 실행을 그린 출력. 측정 시드가 아니다.
  - 시드 2001~2003의 `v2-tables` R4 출력 전문
  - 같은 시드의 R3(축소) 출력에서 ⑤와 ⑨
- 시험 출력, 변형 표(실제로 실패한 시험 이름)
- **실행 비용**(측정이 아니다)
  - 0068a 결과 보고의 추정(40시드 × 다섯 단계 = 10,440회, 워커 4 약 83분)을 그대로 옮긴다. 그 추정의 가정(3시드 실행에 실행 수 비례, 병렬 선형)도 적는다.
  - 이번에 잴 것
    - 시드 2001~2003 R4 전체 묶음 JSON의 크기와 `v2-tables` 실행 시간
    - 다섯 단계 손 고정물 `v2-report` 시간
    - 40시드 JSON 크기 추정(실행 수 비례)
- **측정 전에 허브가 할 일**(그대로 적고 실행하지 않는다)
  1. 판정표 v2 0절의 고정 기록 네 줄
     - 판정표 v2 승인 커밋
     - rules-4 엔진 병합 커밋(0068a·0068b 병합 커밋도 함께)
     - `data/market_rules.json` sha256
     - 시작 프로필 대조 결과
  2. 정오표: 판정표 v2 3.2 문턱표 머리말 ‘J9·L2 ②가 쓴다’ → ‘J9가 쓴다(L2 ②는 판본 1 식, H27-1)’
  3. 측정 명령 목록. 출력 경로는 허브가 정한다. 기준 회차(1061~1100)와 표본 밖 1(1101~1140)마다 아래를 낸다.
     - `node src/engine/sim/run.mjs d03 --risk-v2 {R0P|R1|R2|R3|R4} --seed-base {1061|1101} --seeds 40 --round {회차} --workers 4 --out …` 다섯 개
     - R0 기록: `node src/engine/sim/run.mjs d03 --risk R0 --scenarios SCENARIO_M2_OPS_COS_LAVER --policies MAX_CONTRIBUTION,NO_FX --seed-base {1061|1101} --seeds 40 --workers 4 --out …` 하나
     - `node src/engine/sim/run.mjs v2-tables …` 다섯 개
     - `node src/engine/sim/run.mjs v2-report … --r0 …` 하나
     - `node src/engine/sim/run.mjs risk-compare-v2 A B` 네 쌍(R0P→R1, R1→R2, R2→R3, R3→R4)
  4. 표본 밖 1은 조정이 끝난 뒤 한 번만 돈다(판정표 v2 4절). 최종 판정은 기준 회차와 표본 밖 1이 모두 통과해야 한다.
- 범위 밖에서 발견한 것, 질문

## 처리표

### 0068 개정 1과 0068a에서 넘긴 몫

| 출처 | 반영 자리 |
|---|---|
| E1·H27-1(L2 ②, 문턱표 머리말 정오) | 머리 이탈표, 3.3 문턱표는 J9만, 5절 L2 ②, 시험 6 경계, 변형 9, 10절 허브 할 일 2 |
| E3(v2 표 구성, 별도 함수, R3 축소) | 3.2 표, `d03TablesV2`, `bundleKindV2`, 시험 10, 변형 11·12 |
| E10(a)·H27-2 (a)(진단 M) | 3.6, 시험 4, 변형 13 |
| E11·H27-3(R0 열) | 2.2 `--r0`, 4.3, 시험 7, 변형 15 |
| E13(사전 기대 출처) | 3.4(J8·L4·V 출처), 3.5(0.44·0.59 산식과 출처, 31.5%) |
| E14(키 리터럴) | 3.1, 시험 2 |
| 6열 틀 | 3.1, 시험 2, 변형 1 |
| 문턱표 | 3.3, 시험 3, 변형 2·3 |
| J 판정 | 3.3, 시험 4, 변형 4 |
| J9 | 3.3, 시험 4, 변형 6·7, 5절 R0P→R1 진단 |
| `risk-compare-v2` | 2.2, 5절, 시험 6, 변형 8~10 |
| `v2-report` | 2.2, 4절, 시험 5·7, 변형 5·14·15 |

### 허브 요청(2026-10-24 [실행 요청] TASK-0068b)

| 요청 | 반영 자리 |
|---|---|
| 1. 0068 개정 1에서 넘긴 항목 | 위 표 |
| 2. 세션 A 주의 3건 | (a) 미완료 분할: 3.5(R1 pending 두 칸, 대손 칸과의 겹침과 차감). (b) skippedNotOpen 분모: 3.7, 시험 9, 변형 18. (c) 비용 추정: 10절 실행 비용 |
| 3. E13 사전 기대 출처 | 3.4·3.5 |
| 4. H28-1 유동성 주석, TG와 기준 회사의 직접 무역 수 | 3.2 ① 열, 3.4, 4.3, 시험 4, 변형 20 |
| 5. 0068a 출력 JSON만 읽음, 엔진·정책 불변, 판본 1 출력·첫 화면 불변 | 머리말, 1절 1·3·4, 8절 |
| 6. 측정 전 허브 할 일 | 10절 |

### 세션 A가 초안에서 새로 정한 것(H29-2로 (1) v2-tables, (2) USAGE 예외, (3) pendingOverdue 겹침 승인)

| 항목 | 정한 것 | 이유 |
|---|---|---|
| v2 표 출력 경로 | `writeD03`는 그대로 두고 새 명령 `v2-tables FILE`이 JSON에서 표를 그린다 | `risk-runner-v2.test.ts` 시험 9가 v2 표준 출력을 한 줄로 고정한다. 기존 시험을 고치지 않으려는 것이다. 이렇게 하면 측정 실행과 표 그리기가 나뉘어 표만 다시 그릴 수 있다 |
| `USAGE` 리터럴 예외 | 기존 시험 파일 하나의 리터럴만 고친다 | 새 명령을 도움말에 넣으면 시험 1이 반드시 바뀐다. 범위를 diff로 묶었다 |
| v1 표 회귀 | `--tables-from`으로 판본 1 표 네 종과 `risk-compare`를 cmp | `d03.ts`에서 표 계산을 떼어 내는 길을 열었기 때문이다 |
| `pendingOverdue`와 `defaultsUnconfirmed`의 겹침 | 차감한 열을 따로 낸다 | 0068a-R1의 ‘네 칸 배타’는 수금 칸끼리만 맞다. 미확정 대손 청구서도 수금 없는 OVERDUE라 `pendingOverdue`에 들어간다(`engine.ts` `processCollections`) |
| `v2-tables`의 lateMode | base만 받는다 | 판정표 v2가 base만 잰다 |
| J9 분모 0 | 별도 예외 없이 교차곱 동점 | PRECHECK-0068 기각 항목(table-J9-edge)과 같은 결론 |
| R0 기록의 정책 | `--policies MAX_CONTRIBUTION,NO_FX`로 돌리는 명령을 권고 | 기록 네 키에 필요한 실행만 돌리면 비용이 전체 묶음의 약 1/60이다 |

## 개정 1 처리표(`PRECHECK-0068b-HUB-2026-10-24.md` 5절, H29)

| 수정 | 반영 자리 |
|---|---|
| E1(major) | 1절 1 v1 표 회귀: JSON 1·2는 `SCENARIO_M2_OPERATIONS`, 모든 명령에 `node src/engine/sim/run.mjs` 접두와 `-before`·`-after` 리디렉션 |
| E2(major) | 3.7 `후보 합` 열 |
| E3 | 3.5 금액 단위(USD 센트, 환산 없음) |
| E4 | 4.2 2×중앙 BigInt 비교, 시험 5 x.5 고정물 |
| E5 | 2.2 세 명령 lateMode 검사, 시험 1 |
| E6 | 4.3 `--r0` lateMode·(다) 실행만, 시험 7 |
| E7 | 시험 10 CREDIT_AWARE 고정물, 변형 21 |
| E8 | 1절 5 import 목록 |
| E9 | 1절 1 10시드 표 회귀((가)일 때) |
| E10 | 3.2 진단·조사 선행 비교, J6 설명·J4 문장 |
| E11 | 3.4 유동성 주석은 세 행 각각 |
| E12 | 3.1 `judgmentKindV2`, 시험 2 |
| E13 | 2.2 거절 문구, 시험 1, 변형 19 이유 |
| E14 | 3.2 직접 무역 수 정의, 6절 고정물 덮어쓰기 |
| E15 | 시험 5 머리말과 M′ 하한 |
| E16·H29-1 | 머리 이탈표, 3.4 진단 C `causesV2`, 시험 4, 변형 22 |
| H29-2 | 처리표 ‘세션 A가 초안에서 새로 정한 것’ 제목 |
