# TASK-0068a-R1 실행기 v2 ①: 정책·계측 시험 판별력 보강과 끝난 때 미결 수금 칸

- **지위: 승인(허브, 2026-10-24).** 근거는 허브 심층 검수 `docs/ai/tasks/results/REVIEW-0068a-HUB-2026-10-24.md`(major 2, minor 11, 기각 0)와 세션 A 검수(큰 결함 없음, 주의 3), 허브 결정 H28이다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- **BASE는 `codex/TASK-0068a`의 `7d38298`이다.** 작업 트리는 그 브랜치 머리에서 시작한다. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.
- 기준 문서는 TASK-0068a 개정 1 + 허브 개정 2(승인)다. 이 지시서는 그 지시서를 바꾸지 않고 아래 항목만 고친다. 정책 동작은 바꾸지 않는다. 생산 코드 변경은 아래 2번의 칸 둘뿐이다.

## 원칙

- 고칠 수 있는 파일: `src/engine/sim/risk-runner-v2.test.ts`, `src/engine/sim/risk-metrics.ts`(아래 2번만), `docs/ai/tasks/results/TASK-0068a.md`(끝에 ‘R1’ 절), `MANIFEST.json`(`python3 tools/build_package.py --manifest-only`로만).
- 그 밖의 파일(엔진, 정책, 기존 시험, 골든, `data/**`, `docs/ai/design/**`)은 고치지 않는다. 시험을 쓰다가 생산 코드 결함을 찾으면 고치지 말고 멈춰 보고한다.
- 시드는 2001 이상만 쓴다. 측정은 하지 않는다.
- 작업 전·후에 골든 둘(`check_rules2_golden.mjs`, `check_rules3_golden.mjs`) 종료 0, `run.mjs run` 400회 `cmp` 0, v1 d03 R3(지시서 1절 1과 같은 명령) JSON·표 `cmp` 0. 첫 화면 gzip은 허브 개정 2의 방법으로 전·후 같다.
- 고정물 원칙: 값은 서로 다르게, 나머지가 생기게 고른다. 변형마다 실패하는 시험과 이유를 한 줄씩 적는다.

## 고칠 것

### 1. 정책 시험 (검수 policy-1·2·4·5, compat-1)
- **조건 기여 정렬(policy-1):** 자원(자금 또는 창고)이 하나만 받게 되는 두 후보 X·Y 손 고정물. X는 BASE 기여가 더 크고, Y는 D30 가능이며 가산 때문에 조건 기여가 더 크다. `TERM_GREEDY`는 Y, `MAX_CONTRIBUTION`은 X를 받는다. 또 BASE 기여 ≤ 0이고 D30 기여 > 0인 후보를 `TERM_GREEDY`가 받는 사례. 변형: 후보 push의 `sale`·`contribution`을 BASE 값으로 되돌림 → 실패.
- **credit 거절(policy-2):** 같은 B 거래처 두 후보. 첫 수락이 한도를 채우고, 둘째는 생성 때 D30 기여 > 0이지만 BASE로 재평가하면 기여 ≤ 0. 둘째에서 `rejectionUnits.candidate.credit === 1`, v1 `rejections`에 `credit` 키 없음, `funds` 그대로, 짝·견적에 셈. 변형 셋: 검사 삭제, 사유를 `funds`로, `credit`을 v1 기록에도 셈 → 각각 실패.
- **BASE 명시(policy-4):** `TERM_GREEDY`·`CREDIT_AWARE`의 BASE 명령에 `Object.hasOwn(cmd, 'creditTermId') && cmd.creditTermId === 'BASE'`. 변형: BASE일 때 키를 뺌 → 실패.
- **재평가 두 자리(policy-5):** 선택. 지연 모드 변형이 이 두 정책에 없으면 그 사실을 결과 보고에 적는 것으로 갈음한다.
- **기본 묶음(compat-1):** `--policies` 없이 `--risk-v2` R0P·R1·R4를 돌린 `meta.policyIds`가 `d03PolicyIdsV2(level)`과 같다. 변형: 기본 묶음을 v1 묶음으로 → 실패.

### 2. 끝난 때 미결 수금 칸 (검수 metrics-5, H28-2)
- `risk-metrics.ts`의 v2 credit 진단 재료에 두 칸을 더한다. 기존 `lateReceipts`·`partialReceipts` 정의는 바꾸지 않는다.
  - `pendingPartialReceipts`: 캠페인 끝에 `-1`은 있고 `-2`는 없는 청구서 수(끊긴 분할 수금).
  - `pendingOverdue`: 캠페인 끝에 OVERDUE이고 WRITTEN_OFF가 아니며 수금이 하나도 없는 청구서 수.
- 네 칸(`lateReceipts`, `partialReceipts`, `pendingPartialReceipts`, `pendingOverdue`)은 서로 겹치지 않는다. 시험: 엔진 분개 ID 형식(`RCPT-{inv}`, `-1`, `-2`)대로 만든 고정물에서 네 칸이 각각 1이고 합이 고정물 청구서 수와 같다(metrics-6도 이 고정물로 해결). 변형: `pendingPartialReceipts`가 `-2` 있는 것도 셈 → 실패.

### 3. 계측 시험 (검수 compat-2, metrics-1·3·4)
- **v1/v2 혼합 거절(compat-2):** v1 `risk-compare`에 (v1, v2)와 (v2, v1) 두 순서, `--tables-from`에 v2 출력. 모두 종료 2와 거절 문장.
- **환율 독립 대조(metrics-1):** `rateAtV2`를 거치지 않고 R0P에서 모든 날 같은 값, R4에서 1일 값이 시작 환율이고 걸음이 있는 날 값이 다름을 단언한다.
- **여러 날 합산(metrics-3):** 두 날에 서로 다른 `rejectionUnits`를 넣어 실행 합이 둘의 합임을 단언. 변형: `+=`를 `=`로 → 실패.
- **날짜+한도 가능(metrics-4):** 결제일 ≤ 45이고 `limitBlocked`가 `['D30']`인 계약 고정물에서 `dateEligible`과 `dateLimitEligible`이 다르게 나온다.

### 4. 결과 보고
- `results/TASK-0068a.md` 끝에 ‘R1’ 절. 변형 결과 표, 작업 전·후 회귀 결과, review_checks 결과.

## 완료 조건
1. 1~4 반영, 새 시험과 기존 시험 모두 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check 7d38298`(18종 실패 0).
3. 이 지시서의 변형이 모두 잡힌다.
4. `git diff --name-status 7d38298`에 허용 파일만 나온다.
