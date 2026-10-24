# TASK-0067b-R1 경로 3 v2 엔진 ②: 대손·이자 시험 판별력 보강과 회수·이자 검사

- **지위: 승인(허브, 2026-10-24).** 근거는 허브 심층 검수 `docs/ai/tasks/results/REVIEW-0067b-HUB-2026-10-24.md`(major 1, minor 9, 기각 2)와 세션 A 검수(major 0)다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- **BASE는 `codex/TASK-0067b`의 `e92d188`이다.** 작업 트리는 그 브랜치 머리에서 시작한다. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.
- 기준 문서는 TASK-0067b 개정 1(승인)이다. 이 지시서는 그 지시서를 바꾸지 않고 아래 항목만 고친다. 엔진 동작은 바꾸지 않는다(검증기 검사 하나만 더한다).

## 원칙

- 고칠 수 있는 파일: `src/engine/m2a5-risk-default-v2.test.ts`, `tools/validate_data.py`(아래 2번만), `tools/test_validate_data.py`, `docs/ai/tasks/results/TASK-0067b.md`(끝에 ‘R1’ 절을 덧붙임), `MANIFEST.json`(`python3 tools/build_package.py --manifest-only`로만).
- 엔진 코드(`src/engine/*.ts` 시험 밖), 기존 시험 파일, 골든, `data/**`, `schemas/**`, `src/engine/sim/**`, `docs/ai/design/**`는 고치지 않는다. 시험을 쓰다가 엔진 결함을 찾으면 고치지 말고 멈춰 보고한다.
- 시드는 2001 이상만 쓴다. 측정은 하지 않는다.
- 작업 전·후에 `node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`가 종료 0이고, `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-R1-run-before.json`(작업 전)과 `... --out /tmp/TASK-0067b-R1-run-after.json`(작업 끝) 두 파일의 `cmp`가 0이어야 한다.
- 시험마다, 아래에 적힌 변형을 넣으면 그 시험이 실패해야 한다. 변형은 사본에서 넣고 되돌린다.

## 고칠 것

### 1. 외상 조건이 대손 판정에 쓰이는지 (검수 tests-1, major)
- 엔진 수준 고정물을 만든다. 같은 계약·같은 시드에서 외상 조건만 `D30`과 `BASE`로 다르게 두고, 조건 계수(`factor_pct`)가 실제로 다르게 쓰여 `D30`은 대손 처리되고 `BASE`는 처리되지 않는 경우를 `through()`로 단언한다. 그런 시드는 2001 이상에서 찾고, 고른 시드와 추첨값을 주석에 적는다.
- 변형 R1-1: `engine.ts:1205` 근처 `defaultFor` 호출에서 계약의 조건 대신 `'BASE'`를 넘김 → 이 시험 실패.

### 2. 확정일 이자와 현금 (검수 logic-1, minor)
- 엔진은 바꾸지 않는다. 대신 `tools/validate_data.py`의 신용 자료 검사에 `recovery_bp ≥ carry_bp_per_day × late_max_days`를 더한다(회수액이 확정일까지 쌓인 이자보다 늘 크거나 같게). 메시지를 고정하고 지금 자료는 통과해야 한다.
- 시험: 이 조건을 깨는 사본(예: `recovery_bp` 0)에서 이 문장의 FAIL이 나온다.
- 변형 R1-2: 이 검사를 지움 → 위 시험 실패(`hash mismatch` 말고 다른 FAIL만 본다).

### 3. 확정일 오프셋·주선 계약·실제 R4 실행 (검수 logic-2·3, minor)
- DEFAULT 고정물(시험 3·11 가운데 하나 이상)에서 `lateMinDays < lateMaxDays`(예: 5와 15)로 두고, 확정일이 `dueDay + lateMaxDays`임을 단언한다.
- R4 주선 청구서 고정물: `pDefaultBp = 10000`이어도 주선 청구서는 제때 지급되고 BADDEBT·CARRY 분개가 없다.
- R4 실행 스모크 시험: `withRiskLevelV2(..., 'R4', ...)` 설정으로 (다)·`MAX_CONTRIBUTION`·시드 2001을 `simulate`로 끝까지 돌려 예외가 없고 실패 결과가 아님을 단언한다(timeout 60000ms 이상).
- 변형 R1-3: `engine.ts:1206`의 `lateMaxDays`를 `lateMinDays`로 → 실패. 변형 R1-4: `engine.ts:1205`의 `contract.kind === 'DIRECT_TRADE' &&` 삭제 → 실패.

### 4. 불변식 위반 세 경우 (검수 logic-4·tests-4, minor)
- 시험 11에 손으로 만든 위반 상태 셋을 더하고 각 위반 문장을 단언한다: BADDEBT 분개 날짜를 하루 옮김, 대손 계약의 상태나 `completedDay`를 바꿈, rules-3 상태에 WRITTEN_OFF 청구서(또는 RECEIVABLE_CARRY 줄)를 넣음.
- 변형 R1-5~R1-7: `invariants.ts:127-132`, `:155-157`, `:161-164`의 검사를 각각 지움 → 해당 사례 실패.

### 5. 이자 분개 두 번 (검수 logic-5, minor)
- 결제일 뒤에 부분 회수가 들어오는 고정물을 만든다. `CARRY-{inv}-1`과 `CARRY-{inv}-2`가 증분 금액이고, 합이 `divHalfAway(carryAccrued(마지막 날), 10000)`과 같음을 손 계산 리터럴로 단언한다. 나머지가 생기는 값을 쓴다.
- 변형 R1-8: `postCarry`의 `- posted` 삭제 → 실패.

### 6. 미기재 이자의 cost 표지 (검수 decomp-1·tests-5, minor)
- 시험 8의 미기재 이자 사례에, 같은 평가일 환율의 원가 흐름을 하나 더 둔다. carry 성분이 ‘합친 뒤 한 번 환산’ 값과 같고 ‘따로 환산’ 값과 다름을 단언한다(두 값이 갈리는 금액을 고른다).
- 변형 R1-9: `reports.ts`의 미기재 이자 흐름 cost를 false로 → 실패.

### 7. 대손 판정 경계와 미래 누설 (검수 tests-2·3, minor)
- 추첨값이 반올림한 확률과 정확히 같아지는 경우를 만든다(시드 탐색이 어려우면 `risk.ts`의 추첨을 시험 안에서 주입하는 방식은 쓰지 않고, 확률 값을 고정물로 맞춘다). 그때 `defaultFor`가 거짓임을 단언한다. 변형 R1-10: `<`를 `<=`로 → 실패.
- 시험 12는 확정 전날만이 아니라 `dueDay`부터 확정 전날까지 매일 비교한다(청구서, 계약, `contractProgress`, `paymentDefaultStatus`). 변형 R1-11: 대손 청구서를 결제일에 OVERDUE로 바꾸지 않음 → 실패.

### 8. 결과 보고
- `results/TASK-0067b.md` 끝에 ‘R1’ 절을 더한다. 기존 본문은 고치지 않는다. 변형 R1-1~R1-11 결과 표, 작업 전·후 골든·cmp, review_checks 결과, 1번에서 고른 시드를 적는다.

## 완료 조건
1. 1~8을 반영하고 새 시험과 기존 시험이 모두 통과한다.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check e92d188`(18종 실패 0)가 통과한다.
3. 변형 R1-1~R1-11이 모두 잡힌다.
4. `git diff --name-status e92d188`에 원칙의 허용 파일만 나온다.
