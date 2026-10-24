# TASK-0066-R1 경로 5 실행기: 진단 T·B 고침과 시험 판별력 보강

- **지위: 승인(허브, 2026-10-23).** 근거는 허브 심층 검수 `REVIEW-0066-HUB-2026-10-23.md`(major 0, 확인 5, 다툼 6)와 세션 A 검수(M1~M3, minor), 허브 결정 H20(`HUB-DECISIONS-2026-10-16.md`)이다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- **BASE는 `codex/TASK-0066`의 `effc928`이다.** 작업 트리는 그 브랜치 머리에서 시작한다. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.
- 기준 문서: TASK-0066 개정 3a(승인)와 판정표다. 이 지시서는 그 둘을 바꾸지 않고, 아래 항목만 고친다.
- 판정 값을 바꾸는 생산 코드 결함은 없었다. 이번 일은 진단 두 칸, 근거 문장 한 곳, 시험 판별력, 보고서 출처를 고치는 것이다.

## 원칙(TASK-0066과 같음)

- 고치는 곳은 `src/engine/sim/**`, `docs/ai/tasks/results/TASK-0066.md`(끝에 ‘R1’ 절을 덧붙임), `MANIFEST.json`뿐이다.
- `src/engine/*.ts`, `src/content/**`, `data/**`, `tools/**`, 골든 파일, `docs/ai/design/**`는 고치지 않는다.
- **측정 금지.** `--risk` 실행(R0 포함), `MARGIN_BUFFER`·`FOCUS` 실행, 실험 시나리오 실행은 시험과 확인 실행 모두 시드 2001 이상으로만 한다.
- rules-2(`--risk` 없음) 출력은 바이트가 같아야 한다.
- 새 시험이 공허하게 통과하지 않도록, 찾는 사건이 있는지 먼저 단언한다. 시드를 도는 `it`에는 60000ms 이상의 timeout을 준다.

## 고칠 것

### 1. 진단 T의 분모 (H20-1, 세션 A M2, 검수 spec-1)
- `risk-tables.ts`의 진단 T는 **직접 무역(`kind === 'DIRECT_TRADE'`) 가운데 도착한 `onTime` 계약**만 분모로 센다. 주선 계약은 관세를 고객이 내므로 `tariff` 칸이 늘 0이어서 뺀다.
- 시험: 주선 `onTime` 계약을 섞은 손 고정물에서 T의 `total`이 직접 무역 수와 같다.
- 변형 36: ‘T의 분모에 주선 계약을 넣음’ → 이 시험이 잡는다.

### 2. 진단 B의 범위와 비율 (H20-2, 검수 judge-2)
- `risk-metrics.ts`의 `referenceRateBounds`는 실행의 실패일과 관계없이 `publish.firstDay`부터 `publish.lastDay`까지 공개일마다 훑는다. 환율 경로는 설정과 시드만으로 정해지므로, 같은 시드이면 정책과 관계없이 값이 같아야 한다.
- `risk-tables.ts`의 진단 B 비율은 **서로 다른 시드** 단위로 낸다: 시드마다 한 번만 세고, 분모는 그 출력의 시드 수다.
- 시험 ① 시드 2001~2020, (가) R3에서 `MAX_CONTRIBUTION`과 `NO_FX`의 `referenceRateBounds`가 시드마다 같다. 참인 시드가 하나 이상 있음을 먼저 단언한다.
- 시험 ② 정책 둘을 담은 손 출력에서 B 비율이 (참인 시드 수 ÷ 시드 수)다.
- 변형 37: ‘실패일에서 훑기를 멈춤’ → 시험 ①. 변형 38: ‘비율을 실행 단위로 냄’ → 시험 ②.

### 3. J4a~c 근거 문장 (세션 A M3, 검수 spec-2)
- `d03.ts`의 risk 분기 J4a~c 근거에 rules-2 분기와 같은 꼴로 `준비 {min}~{max}pt`를 넣는다. 판정 식은 바꾸지 않는다.
- 시험: R1 손 출력의 J4a~c 근거에 `준비 `와 `pt`가 있고, 값이 고정물의 최소·최대와 같다.

### 4. 표 ② 단위 이름 (검수 spec-3)
- R1~R3이면 표 ② 머리의 ‘투자 없음 대비 USD’를 ‘투자 없음 대비 분석값’으로 바꾼다. 표 ①과 같은 단위 이름 변수를 쓴다. R0과 rules-2는 그대로 둔다.
- 시험 ‘비교 값 전환’에 표 ② 머리 단언을 더한다(R1은 분석값, R0은 USD).

### 5. 시험 판별력 보강
- **다변형 D (세션 A M1·변형 13b, 검수 tests-1·변형 13a)**
  - 손 고정물: (가)는 같은 변형 안에서 `FOCUS` 3승·`MAX_CONTRIBUTION` 17승·짝 20이 되게 하고, (다)는 실패가 되게 만든다.
  - 변형을 섞어 계산하면 (가)의 D가 실패로 바뀌도록, 다른 변형의 값을 고른다.
  - 단언: (가) D ‘통과’, (다) D ‘실패’. `diversity`를 직접 불러 (가)의 짝 수가 20인지도 단언한다.
  - 변형 13a(모든 변형의 `FOCUS` 실행을 모음)와 13b(다른 변형의 `MAX_CONTRIBUTION`과 견줌)를 변형 표에 더한다.
- **J7(새) 홀수 중앙값 (검수 judge-3)**
  - n = 11 고정물: 1/10 다섯, 1/4 하나, 9/10 다섯 → 통과. 가운데를 24/100으로 바꾸면 실패.
  - `oldJ7Passes`에도 같은 꼴의 홀수 고정물을 둔다.
  - 변형 39: ‘홀수에서도 두 가운데 값의 평균을 씀’.
- **L3 ② 문턱 경계 (검수 judge-4)**
  - m = 20: wins 15 → 부호 검정 참, wins 14 → 거짓.
  - m = 13: wins 10 → 참, wins 9 → 거짓.
  - 변형 40: ‘`wins > 문턱`’.
- **항상 참인 단언 정리 (검수 report-1)**
  - `risk-runner.test.ts`에서 앞 줄의 거름 조건 때문에 늘 참인 단언 두 개를 판별력 있는 단언으로 바꾸거나 지운다. 앞 줄의 거름 뒤에 다시 적은 `accepts.length >= 2`와 KRW `some`이다.
  - 바꾼 줄과 이유를 보고서에 적는다.
- **미래 누설 시험 범위 (검수 leak-1)**
  - import 지정자를 경로로 풀어 판정한다. `'../risk'`·`'../risk.ts'`·`'../risk.js'`는 모두 같은 모듈로 본다.
  - 동적 `import(...)`도 검사한다.
  - `sim/**`에서 `../risk`를 다시 내보내는 것(`export … from`)을 금지한다.
  - 변형 41: ‘정책 파일에서 `'../risk.ts'`로 `tariffEvents`를 import함’.

### 6. 결과 보고 정정 (검수 report-1)
- `results/TASK-0066.md` 끝에 ‘R1’ 절을 더한다. 기존 본문은 고치지 않는다. 담을 것은 다음과 같다.
  - 원래 변형 표가 어느 코드 시점에 돌았는지, 그 뒤 `final-fixes`로 시험 파일을 어떻게 바꿨는지(지연 계산 전환, 단언 2개 추가)를 밝힌다.
  - R1 변형 36~41과 13a·13b를 포함해, 전체 변형 표를 R1 코드에서 다시 돌린 결과.
  - 데이터 ID 금지 검사 범위 밖 예외 하나를 적는다: `policy-constants.json`의 `focusGoodId`(H20-3).

## 지켜야 할 것
- 작업 전 `node tools/check_rules2_golden.mjs`가 0인지 확인한다.
- rules-2 표 문장 `cmp`와 `d03 --seed-base 2001 --seeds 2` JSON 바이트 `cmp`는 TASK-0066과 같은 방식으로 BASE 출력과 비교해 0이어야 한다.
- `review_checks` 통과.

## 완료 조건
1. 1~6을 반영하고, 새 시험과 기존 시험이 모두 통과한다.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check effc928`가 통과한다.
3. 변형 13a·13b·36~41이 모두 잡힌다(원래 코드와 결과가 같으면 그 이유를 적는다).
4. `git diff --stat effc928 -- ':(glob)src/engine/*.ts' src/content data schemas tests/golden tools docs/ai/design`이 빈 값이다.
