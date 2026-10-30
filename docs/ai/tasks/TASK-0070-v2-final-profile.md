# TASK-0070 판정표 v2 최종 프로필(k = +1)을 개발 브랜치에

- **지위: 초안(허브, 2026-10-30). 세션 A 확인 전.**
- 근거
  - 허브 결정 H32(최종 프로필 = 1회차, k = +1)와 H33-4
  - 측정 보고 `docs/ai/design/path5-measure-2026-10/V2-REPORT.md`
  - `V2-RUN-PLAN.md` 3절: 회차 프로필은 측정 브랜치에만 둔다. 최종 프로필은 시험 기대값과 함께 들인다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`에서 이 지시서를 승인한 커밋. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.

## 목적

- 개발 브랜치 자료 `RISK_PROFILE_V2.sale_margin_k`를 0에서 1로 바꾼다. 이 값은 측정 브랜치 `claude/measure-v2-r1`(`4ca3595`)의 최종 프로필과 같다.
- 그러면 자료의 k = 0을 가정한 시험 17개가 실패한다(4ca3595 CI). 각 시험의 **원래 의도를 지키는 방향으로** 고친다.

## 원칙

- 고칠 수 있는 파일
  - `data/market_rules.json`: `sale_margin_k` 한 값만 바꾼다.
  - `src/engine/m2a5-risk-credit-v2.test.ts`
  - `src/engine/m2a5-risk-default-v2.test.ts`
  - `src/engine/m2a5-risk-margin-k-v2.test.ts`
  - 그 밖에 이 변경으로 실패하는 v2 시험 파일. 고친 파일과 이유를 보고에 적는다.
  - `docs/ai/tasks/results/TASK-0070.md`
  - `MANIFEST.json`: `python3 tools/build_package.py --manifest-only`로만 만든다.
- 고치지 않는 것
  - 생산 코드(`src/**`의 시험이 아닌 파일)
  - 검증기, 스키마, 골든 파일, 골든 검사기, `docs/ai/design/**`
  - `rule_sets`와 `RISK_PROFILE_DEFAULT`
- 시드 규칙
  - 시험 시드는 2001 이상만 쓴다.
  - 예외: 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다. 비위험 회귀 확인용이다.
  - 측정은 하지 않는다.
- 생산 코드나 자료에서 어긋나는 결함을 찾으면, 고치지 말고 멈춰 보고한다.

## 할 일

### 1. 자료
- `RISK_PROFILE_V2.sale_margin_k`를 `1`로 바꾼다.
- 새 `data/market_rules.json`의 sha256은 측정 브랜치 `4ca3595`의 값과 같아야 한다: `e01c589cfcb755d0150ce0c70167dbd87ea3bda414e8b2bdbb58c402b2a1bfaa`. 다르면 멈춘다.

### 2. 시험 고치기
- 실패하는 시험마다 어떤 의도를 지키는지 먼저 정하고, 결과 보고 표에 시험 이름 → 의도 → 고친 방법을 적는다. 의도는 셋 가운데 하나다.
  - **(ㄱ) k와 무관한 성질을 보는 시험.** 변환, 원본 보존, 로더 모양, BASE와 같은 결과가 여기에 든다. 시험 안에서 k = 0 외상 프로필을 명시적으로 만들어 쓴다. 예: `const { saleMarginK: _, ...cr0 } = loadCreditProfile('RISK_PROFILE_V2')`. 기대값은 바꾸지 않는다.
  - **(ㄴ) 자료의 실제 값을 보는 시험.** 로더가 자료를 읽는 결과가 여기에 든다. k = 1에 맞춰 기대값을 바꾸고, `saleMarginK === 1`을 단언한다.
  - **(ㄷ) 판매 마진 식을 보는 시험(`m2a5-risk-margin-k-v2.test.ts`).** 식 자체는 그대로 둔다. ‘자료의 k = 0이면 항등’을 보던 시험은 (ㄱ)처럼 k = 0 프로필을 명시한다. ‘자료 k가 실행기 경로에 닿는다’ 시험(시험 5)은 자료가 이미 1이므로, 자료를 바꾸고 되돌리는 대신 지금 자료로 SELL이 k = +1 값인지 단언한다.
- **기대값을 출력에서 다시 베껴 오지 않는다.** k = 1 기대값이 필요하면 손 계산 리터럴로 쓴다. 예: 화장품 하이퐁 5370.
- 새 시험 하나를 더한다: `loadCreditProfile('RISK_PROFILE_V2').saleMarginK === 1`이고, `RISK_PROFILE_DEFAULT`에는 외상 칸이 없다는 기존 동작이 그대로라는 것.

### 3. 회귀(작업 전·후)
- 골든 둘이 종료 0이다.
- 기본 `run.mjs run` 400회가 전·후 `cmp` 0이다.
- v1 d03 R3: TASK-0068a 1절 1 명령으로 돌린다. JSON은 `meta.risk.marketRulesSha256`만 빼고 `cmp` 0, 표는 `cmp` 0이다.
- v2 출력은 k가 바뀌므로 달라진다. 대신 다음을 확인한다.
  - (가) `node src/engine/sim/run.mjs d03 --risk-v2 R4 --round 1 --seed-base 2001 --seeds 3 --workers 4 --out …`를 이 작업 트리와 측정 브랜치 `4ca3595` 트리에서 각각 돌린다. 두 JSON이 바이트로 같아야 한다. 두 트리는 자료와 엔진이 같기 때문이다. 트리 사이에 엔진 차이가 있으면 차이 목록을 적고 멈춘다.
  - (나) 같은 비교를 `--risk-v2 R0P`로 한다.
- 첫 화면 gzip 증가는 0 B다. 자료의 한 글자가 바뀌어 압축 결과가 몇 바이트 달라지면 그 값을 적는다. 증가 100 B 이하는 허용한다. 측정 방법은 허브 개정 2다.

### 4. 변형(사본에서 넣고 되돌린다)

| 번호 | 변형 | 기대 |
|---|---|---|
| 1 | 자료 k를 0으로 되돌린다 | 2절의 새 시험과 (ㄴ)·(ㄷ) 시험이 실패 |
| 2 | (ㄱ) 시험의 k = 0 명시를 지운다 | (ㄱ) 시험이 실패한다. 그 시험이 자료에 기대지 않고 의도를 지키는지 확인하는 변형이다 |
| 3 | `withRiskLevelV2`의 k 적용을 지운다 | (ㄷ) 시험이 실패 |

### 5. 결과 보고(`results/TASK-0070.md`)
- 시작 HEAD
- 새 sha256과 측정 브랜치 sha256의 일치 여부
- 2절의 시험별 의도 표
- 3절 회귀 표: 측정 브랜치와의 바이트 비교 포함
- 4절 변형 표
- review_checks 결과

## 완료 조건
1. 1~5를 반영했고 모든 시험이 통과한다.
2. 다음이 모두 통과한다.
   - `npx vitest run`
   - `npm run typecheck`
   - `npm run build`
   - `python3 tools/validate_data.py`
   - `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: 18종 실패 0
3. 변형 1~3이 잡힌다.
4. `git diff --name-status <BASE>`에 허용 파일만 나온다.

## 병합 뒤 허브 할 일
- 판정표 v2 0절 기록에 ‘개발 브랜치 자료 = 최종 프로필(sha `e01c589c…`)’을 적는다.
- `V2-RUN-PLAN`의 측정 브랜치 문장에 ‘최종 프로필 반영 완료’를 덧붙인다.
- `check_profile_v2.py … 1` 결과 DIFF 0을 기록한다.
