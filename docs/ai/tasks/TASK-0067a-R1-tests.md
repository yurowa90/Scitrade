# TASK-0067a-R1 경로 3 v2 엔진 ①: 반올림·검증기 시험 보강과 불변식 한 곳

- **지위: 승인(허브, 2026-10-24).** 근거는 허브 심층 검수 `docs/ai/tasks/results/REVIEW-0067a-HUB-2026-10-24.md`(major 2, minor 3, 기각 2)와 세션 A 검수(major 0, 경미 m1·m2)다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- **BASE는 `codex/TASK-0067a`의 `f36198b`다.** 작업 트리는 그 브랜치 머리에서 시작한다. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.
- 기준 문서는 TASK-0067a 개정 1(승인)이다. 이 지시서는 그 지시서를 바꾸지 않고 아래 항목만 고친다. 판정이나 동작을 바꾸는 생산 코드 결함은 `invariants.ts` 한 곳뿐이다.

## 원칙(TASK-0067a와 같음)

- 고칠 수 있는 파일: `src/engine/m2a5-risk-credit-v2.test.ts`, `tools/test_validate_data.py`, `tools/validate_data.py`(아래 3번만), `src/engine/invariants.ts`(아래 4번만), `docs/ai/tasks/results/TASK-0067a.md`(끝에 ‘R1’ 절을 덧붙임), `MANIFEST.json`(`python3 tools/build_package.py --manifest-only`로만).
- 그 밖의 파일, 특히 기존 시험 파일·골든·`data/**`·`schemas/**`·`src/engine/sim/**`·`docs/ai/design/**`는 고치지 않는다.
- 시드는 2001 이상만 쓴다. 측정은 하지 않는다.
- 작업 전·후에 `node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`가 종료 0이고, `node src/engine/sim/run.mjs run --out /tmp/TASK-0067a-R1-run-{before,after}.json` 두 파일의 `cmp`가 0이어야 한다. 어기면 멈추고 보고한다.

## 고칠 것

### 1. 가산 반올림 시험 (검수 tests-1, major)
- 지금 고정물은 판매액 × 가산이 10000으로 나누어떨어져서, `divHalfAway`를 `Math.floor`로 바꿔도 25개 시험이 모두 통과한다.
- 판매 견적의 단가나 수량을 손으로 바꾼 고정물 두 개를 더한다. 하나는 `판매액 × (10000 + premium_bp) % 10000 ≥ 5000`, 다른 하나는 `0 < … < 5000`이다.
- 두 고정물에서 `creditTermCheck`(또는 `creditTermOptions`)의 판매액과, 수락 뒤 `checkInvariants`가 문제 0인지를 함께 단언한다. 기대값은 손으로 계산한 정수 리터럴로 적는다.
- 변형 R1-1: `engine.ts`의 가산 판매액 계산을 `Math.floor`로 바꿈 → 이 시험 실패. 변형 R1-2: `Math.ceil`로 바꿈 → 이 시험 실패.

### 2. 검증기 분기 시험 (검수 tests-2, major)
`tools/test_validate_data.py`의 거부 시험에 다음 사례를 더한다. 사례마다 해당 검사 문장의 FAIL이 나오는지 단언한다.
- 한도 단위 경계: `credit_limit_unit_minor`가 393,767이면 거부, 393,768이면 이 검사는 통과(다른 검사 영향은 `limit_minor`를 함께 맞춰 없앤다). 최댓값이 (다) `M2A5_PYEONGTAEK_COS_LAVER`에서 나온다는 점을 시험 이름이나 주석에 적는다.
- 비대칭 제약: A쪽, B쪽에서 각각 비용 ≥ 가산이 되는 사례(대손 확률이나 가산을 바꿔서) 두 개, 회수율(`recovery_bp`)을 바꿔 C쪽 결과가 달라지는 사례 하나.
- 비BASE 조건 검사: `days = 0`, `factor_pct = 99`, `premium_bp` 범위 밖 사례.
- 판매 상대방 누락: `by_counterparty`에 판매 거래처 하나가 없는 사례.
- 변형 R1-3~R1-6: 검증기에서 ① A쪽 조건 삭제, ② (1−ρ) 계수 삭제, ③ L 최댓값 계산을 첫 두 rule_set으로 한정, ④ 비BASE 조건 검사를 항상 참으로 → 각각 위 시험 실패. 변형 중 MANIFEST `hash mismatch` 말고 다른 FAIL만 본다(TASK-0067a 변형 9~11과 같은 판정).

### 3. 한도 단위 검사의 가산 (검수 tests-3, minor)
- `tools/validate_data.py`의 한도 단위 최댓값 계산은 고정 가산 800bp를 쓴다. `max(800, 비BASE 조건 premium_bp의 최댓값)`으로 바꾼다.
- 시험: D30 `premium_bp`를 1000으로 바꾼 사본에서 한도 단위 문장의 FAIL이 나온다.

### 4. 불변식의 판매 견적 미해결 (검수 logic-3 (b), minor)
- `src/engine/invariants.ts`의 rules-4 `DIRECT_TRADE` 검사는 `sellOfferId`로 판매 견적을 찾지 못하면 결제일·판매액 검사를 조용히 건너뛴다.
- 찾지 못하면 problem을 기록한다(문장은 기존 불변식 문장 꼴을 따른다). rules-1~3 경로와 FORWARDING 계약에는 손대지 않는다.
- 시험: 손으로 고친 저장(판매 견적 ID를 없는 값으로)에서 문제 1건 이상.

### 5. 노출액 시험의 공허한 행 (검수 tests-4, minor)
- 시험 4의 ‘판매액 0으로 완료된 계약이 빠짐’ 행은 넣든 빼든 합계가 같다. 판매액이 0이 아닌 COMPLETED 계약(청구서 PAID)으로 바꾸어, 이 계약을 셈에 넣으면 노출액이 달라지게 한다.

### 6. 결과 보고 정정
- `results/TASK-0067a.md` 끝에 ‘R1’ 절을 더한다. 기존 본문은 고치지 않는다.
- 변형 1의 판정을 허브 결정대로 적는다: ‘결함 탐지 성공. 기대는 비정상 종료(1 또는 2)이고, 종료 2의 원인은 `operations-policy.ts:20`의 `referenceEstimate` 미정의 예외다.’
- R1 변형 6개 결과 표, 작업 전·후 골든·cmp 결과, review_checks 결과를 적는다.

## 완료 조건
1. 1~6을 반영하고 새 시험과 기존 시험이 모두 통과한다.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check f36198b`(18종 실패 0)가 통과한다.
3. 변형 R1-1~R1-6이 모두 잡힌다.
4. `git diff --name-status f36198b`에 원칙의 허용 파일만 나온다.
