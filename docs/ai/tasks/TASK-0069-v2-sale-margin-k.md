# TASK-0069 판정표 v2 판매 마진 손잡이 k를 `RISK_PROFILE_V2`로

- **지위: 초안(허브, 2026-10-24). 사전 검수 전.**
- 근거: 허브 결정 H31(`docs/ai/design/path3-price-risk-2026-10/HUB-DECISIONS-2026-10-16.md`), 0회차 결과 `docs/ai/design/path5-measure-2026-10/V2-ROUND-0.md`.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`의 이 지시서 승인 커밋. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.

## 목적

판정표 v2의 판매 마진 손잡이 k를 `rule_sets`가 아니라 `RISK_PROFILE_V2`의 칸으로 둔다. 그래야 rules-3 골든이 읽는 (다) rule_set을 바꾸지 않고 k를 돌릴 수 있다.

**k = 0에서는 지금과 결과가 같아야 한다.**

## 원칙

- 고칠 수 있는 파일
  - `data/market_rules.json`: `RISK_PROFILE_V2`에 `sale_margin_k: 0` 한 칸만 더한다.
  - `schemas/market_rules.schema.json`: 선택 칸 `sale_margin_k`, 정수 −2~+3.
  - `tools/validate_data.py`와 `tools/test_validate_data.py`: 아래 3번만.
  - `src/content/scenario.ts`: 로더.
  - `src/engine/types.ts`
  - `src/engine/risk.ts`: `withRiskLevelV2`와 그 도우미.
  - 새 시험 `src/engine/m2a5-risk-margin-k-v2.test.ts`
  - `docs/ai/tasks/results/TASK-0069.md`
  - `MANIFEST.json`: `python3 tools/build_package.py --manifest-only`로만 만든다.
- 고치지 않는 것
  - `rule_sets`, `RISK_PROFILE_DEFAULT`, `scenarios.json`
  - 골든 파일과 골든 검사기
  - 실행기(`src/engine/sim/**`)
  - 기존 시험 파일
  - `docs/ai/design/**`
- 저장 형식과 rules-1~3 경로는 바꾸지 않는다.
- 시험 시드는 2001 이상만 쓴다. 측정 시드(1061~1180)로는 돌리지 않는다. 측정은 하지 않는다.
- 생산 코드나 자료에서 이 지시서와 어긋나는 결함을 찾으면, 고치지 말고 멈춰 보고한다.

## 할 일

### 1. 자료와 로더
- `RISK_PROFILE_V2`에 `"sale_margin_k": 0`을 더한다. `RISK_PROFILE_DEFAULT`에는 더하지 않는다.
- 로더는 이 값을 정수로 읽는다.
  - 없으면 0이다.
  - −2~+3 밖이거나 정수가 아니면 예외를 낸다. 예외 문장은 결과 보고에 적는다.
- 값을 어느 형(`CreditProfile` 또는 별도 인자)에 실을지는 아래 2번 조건을 지키는 쪽으로 고른다. 고른 이유를 결과 보고에 적는다.

### 2. 적용(`withRiskLevelV2`)
- rules-4 설정을 만들 때 다섯 단계(R0P·R1·R2·R3·R4) 모두에서 같은 k를 적용한다.
- 적용 대상은 설정의 모든 SELL 기준가 행이다. 식은 판본 1 5.2와 같다.
  - 새 SELL(센트) = halfUp(SELL₀(센트) + BUY(센트) × 5k ÷ 100)
  - BUY는 같은 품목의 BUY 행이다.
  - halfUp은 0.01 USD 단위다. 나머지가 정확히 반이면 0에서 먼 쪽으로 올린다. 음수 k도 같은 규칙이다.
  - 검증기 `credit_limit_sales`(`tools/validate_data.py`)가 쓰는 식과 같다. 이 일치를 시험으로 고정한다.
- BUY 행, 주선 화물, 다른 rule_set 칸은 바꾸지 않는다.
- 같은 품목의 BUY 행이 없거나 둘 이상이면 예외를 낸다.
- 새 SELL이 1센트 미만이 되면 예외를 낸다.
- **k = 0이면 결과 설정이 지금과 `deepEqual`이다.** 프로필 칸이 하나 늘어난 영향이 설정·저장·실행 출력에 새어 나가면 안 된다.

### 3. 검증기
- `RISK_PROFILE_V2`의 `sale_margin_k`가 −2~+3 정수인지 검사한다. 문장은 고정하고, 지금 자료는 통과해야 한다.
- 한도 단위 검사(`credit_limit_sales`)의 `margin_k = 3`(손잡이 상한)은 그대로 둔다.
- 시험
  - `sale_margin_k`가 4인 사본, 2.5인 사본에서 이 문장의 FAIL이 나온다.
  - 칸이 없는 사본은 통과한다.

### 4. 시험(`m2a5-risk-margin-k-v2.test.ts`)
1. **항등.** k = 0에서 `withRiskLevelV2`의 결과가 다섯 단계 모두 TASK-0069 전과 `deepEqual`이다.
   - 비교 기준은 시험 안에서 rule_set 원본 행으로 손 계산해 만든다.
2. **식.** k = +1·+3·−2에서 (다)의 각 SELL 행이 손 계산 정수 리터럴과 같고, BUY 행은 그대로다.
   - 나머지가 반, 반 초과, 반 미만인 경우를 각각 하나 이상 넣는다. 지금 자료에 그런 행이 없으면 손 고정물을 쓴다.
   - 손 계산 과정을 주석으로 적는다.
3. **검증기와 같은 식.** 같은 k에서 엔진의 새 SELL과 검증기 식의 중간값 `base`가 같다.
   - Python 식을 TS로 옮긴 리터럴 비교로 확인한다.
4. **R0P에도 적용.** k = +1에서 R0P와 R4의 SELL 기준가가 같다.
   - 판정표 3.3: k가 바뀌면 M′도 따라간다.
5. **실제 실행 스모크.** k = +1, R4, `MAX_CONTRIBUTION`, 시드 2001로 `simulate`를 끝까지 돌린다.
   - 예외가 없고 실패 결과가 아니어야 한다.
   - k = 0 실행과 직접 무역 판매액이 달라야 한다.
   - timeout은 60000ms 이상으로 둔다.
6. **로더 거절.** k = 4, 2.5, 문자열이면 예외가 난다.

### 5. 회귀(작업 전·후)
- 골든 둘이 종료 0이다: `node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`.
- `node src/engine/sim/run.mjs run --out …` 400회 결과가 전·후 `cmp` 0이다.
- v1 d03 R3 출력이 JSON·표 모두 전·후 `cmp` 0이다. 명령은 TASK-0068a 1절 1과 같다.
- **v2 출력 항등.**
  - 명령: `node src/engine/sim/run.mjs d03 --risk-v2 R4 --seed-base 2001 --seeds 3 --workers 4 --out …`
  - 전·후 JSON에서 `meta.marketRulesSha256`만 뺀 나머지가 바이트로 같아야 한다. 비교 방법(예: `jq 'del(.meta.marketRulesSha256)'`)과 결과를 보고에 적는다.
  - 같은 비교를 `--risk-v2 R0P`로도 한다.
- 첫 화면 gzip이 전·후 같다. 비교는 허브 개정 2의 방법으로 한다(git 없는 두 폴더).

### 6. 변형(사본에서 넣고 되돌린다)

| 번호 | 변형 | 기대 |
|---|---|---|
| 1 | k를 R4·R1에만 적용하고 R0P는 뺀다 | 시험 4 실패 |
| 2 | halfUp 대신 버림 | 시험 2 실패 |
| 3 | BUY 대신 SELL₀에 5k%를 곱한다 | 시험 2·3 실패 |
| 4 | k = 0일 때도 행을 새 배열로 만들어 칸 순서를 바꾼다 | 시험 1 실패. deepEqual이 칸 순서를 보지 않으면, 이 변형 대신 ‘k = 0일 때 값 하나를 1센트 바꿈’으로 대체하고 그 사실을 보고에 적는다 |
| 5 | 검증기 범위 검사를 지운다 | 3번 시험 실패. MANIFEST `hash mismatch` 말고 다른 FAIL만 본다 |

변형마다 실패한 시험 이름과 이유를 한 줄씩 적는다.

### 7. 결과 보고(`results/TASK-0069.md`)
- 시작 HEAD
- 바꾼 파일
- 설계 판단: 값을 실은 형과 그 이유
- 5번 회귀 결과 표
- 6번 변형 표
- review_checks 결과
- 새 `data/market_rules.json` sha256

## 완료 조건
1. 1~7을 반영했고, 새 시험과 기존 시험이 모두 통과한다.
2. 다음이 모두 통과한다.
   - `npx vitest run`
   - `npm run typecheck`
   - `npm run build`
   - `python3 tools/validate_data.py`
   - `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: 18종 실패 0
3. 변형 1~5가 모두 잡힌다.
4. `git diff --name-status <BASE>`에 허용 파일만 나온다.
