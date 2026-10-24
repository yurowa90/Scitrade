# TASK-0069 판정표 v2 판매 마진 손잡이 k를 `RISK_PROFILE_V2`로

- **지위: 승인(허브, 2026-10-24, 개정 1).**
  - 초안(`1b0b6fa`)은 허브 사전 검수에서 major 4·minor 2를 받았다(`docs/ai/tasks/results/PRECHECK-0069-HUB-2026-10-24.md`).
  - 세션 A 검토에서 major 2·minor 4를 받았다.
  - 둘을 이 개정에 반영했다. 끝의 ‘개정 1 처리표’에 정리했다.
- 근거
  - 허브 결정 H31(`docs/ai/design/path3-price-risk-2026-10/HUB-DECISIONS-2026-10-16.md`)
  - 0회차 결과 `docs/ai/design/path5-measure-2026-10/V2-ROUND-0.md`
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.

## 목적

- 판정표 v2의 판매 마진 손잡이 k를 `rule_sets`가 아니라 `RISK_PROFILE_V2`의 칸에 둔다. 그래야 rules-3 골든이 읽는 (다) rule_set을 바꾸지 않고 k를 돌릴 수 있다.
- **k = 0에서는 설정과 실행 결과가 지금과 같아야 한다.** 예외는 자료 파일 sha 칸 하나뿐이다.

## 원칙

- 고칠 수 있는 파일
  - `data/market_rules.json`: `RISK_PROFILE_V2`에 `sale_margin_k: 0` 한 칸만 더한다.
  - `schemas/market_rules.schema.json`: 선택 칸 `sale_margin_k`. 정수이고 −2~+3이다.
  - `tools/validate_data.py`, `tools/test_validate_data.py`: 아래 3번만 고친다.
  - `src/content/scenario.ts`: `loadCreditProfile`만 고친다.
  - `src/engine/types.ts`: `CreditProfile`만 고친다.
  - `src/engine/risk.ts`: `withRiskLevelV2`와 그 도우미만 고친다.
  - 새 시험 `src/engine/m2a5-risk-margin-k-v2.test.ts`
  - `docs/ai/tasks/results/TASK-0069.md`
  - `MANIFEST.json`: `python3 tools/build_package.py --manifest-only`로만 만든다.
- 고치지 않는 파일과 값
  - `rule_sets`, `RISK_PROFILE_DEFAULT`, `scenarios.json`
  - 정적 오퍼 `config.offers`. BUY 정적 오퍼의 원화 변환은 지금대로 둔다.
  - 골든 파일과 골든 검사기
  - 실행기(`src/engine/sim/**`)
  - 기존 시험 파일, `docs/ai/design/**`, `RiskProfile`과 그 로더(`loadRiskProfile`)
- 저장 형식은 바꾸지 않는다. rules-1~3 경로도 바꾸지 않는다.
- 시험 시드는 2001 이상만 쓴다. 측정 시드(1061~1180)로는 돌리지 않는다. 측정은 하지 않는다.
- 생산 코드나 자료에서 이 지시서와 어긋나는 결함을 찾으면 고치지 말고 멈춰 보고한다.

## 할 일

### 1. 자료와 로더 (설계 확정, C4·M2)
- `RISK_PROFILE_V2`에 `"sale_margin_k": 0`을 더한다. `RISK_PROFILE_DEFAULT`에는 더하지 않는다.
- k는 `CreditProfile`의 선택 칸 `saleMarginK?: number`에 싣는다.
  - `loadCreditProfile`은 자료 값이 없거나 0이면 **이 키를 두지 않는다.** 그래야 기존 시험(`m2a5-risk-credit-v2.test.ts`)의 `toEqual`과 k = 0 항등이 그대로 유지된다.
  - 값이 −2~+3 정수가 아니면 예외를 낸다. 문자열, 2.5, 4가 여기에 든다. 예외 문장은 결과 보고에 적는다.
- 기각한 대안
  - 별도 인자: 실행기 `simConfigV2`(`risk-metrics.ts`)가 인자 넷만 넘기는데, 실행기는 고칠 수 없다. 그러면 자료의 k가 측정에 닿지 않는다.
  - `RiskProfile`: rules-3 골든의 로더 지문에 영향이 갈 수 있다.

### 2. 적용(`withRiskLevelV2`) (M1·C5)
- rules-4 설정을 만들 때 다섯 단계(R0P·R1·R2·R3·R4)에 같은 k를 적용한다. k는 `credit.saleMarginK ?? 0`이다.
- 대상은 설정의 rule_set SELL 기준가 행 전부다. 식은 판본 1 5.2 그대로다.
  - 새 SELL(USD 센트) = halfUp(SELL₀ + BUY × 5k ÷ 100)
  - **BUY는 같은 품목의 BUY 행 값이다. 단위는 USD 센트이고, `withRiskLevel`이 원화로 바꾸기 전 값이다.** 입력 config의 행을 쓰거나, 변환 전에 k를 적용한다.
  - 지금 `withRiskLevel`(`risk.ts:209-211`)은 BUY 행을 원화로 바꾼다. 변환된 값(예: 화장품 52,000)을 쓰면 안 된다. 화장품의 변환 전 값은 4,000이다.
  - halfUp은 0.01 USD 단위다. 정확히 반이면 0에서 먼 쪽으로 올린다. 음수 k에도 같다.
- 바꾸지 않는 것: BUY 행, 주선 화물, `config.offers`, 다른 rule_set 칸.
- 예외를 내는 경우
  - 같은 품목의 BUY 행이 없거나 둘 이상이다. (다)는 품목마다 하나다(평택 화장품 4000, 조미김 2000).
  - 새 SELL이 1센트 미만이다.
- **설정에 넣는 `credit` 사본에서는 `saleMarginK`를 뺀다.** k가 0이 아닐 때도 뺀다. k의 효과는 SELL 기준가로만 남는다.
- **k = 0이면 결과 설정이 지금과 `toStrictEqual`이다.**

### 3. 검증기
- `RISK_PROFILE_V2`의 `sale_margin_k`가 −2~+3 정수인지 검사한다. 문장을 고정하고, 지금 자료는 통과해야 한다.
- 한도 단위 검사(`credit_limit_sales`)의 `margin_k = 3`(손잡이 상한)은 그대로 둔다.
- 시험
  - `sale_margin_k`가 4인 사본과 2.5인 사본에서 이 문장의 FAIL이 나온다.
  - 칸이 없는 사본은 통과한다.

### 4. 시험(`m2a5-risk-margin-k-v2.test.ts`)
1. **항등.** k = 0에서 `withRiskLevelV2`의 결과가 다섯 단계 모두 `toStrictEqual`로 기대값과 같다.
   - 기대값은 시험 안에서 rule_set 원본 행으로 손 계산해 만든다.
   - `credit` 사본에 `saleMarginK` 키가 없음도 단언한다.
2. **식.** 아래 둘을 함께 단언한다. **지금 자료에는 나머지가 생기는 행이 없다**(BUY가 20센트의 배수다). 그래서 나머지 사례는 반드시 손 고정물로 만든다.
   - (가) 지금 자료 (다)의 k = +1·+3·−2. 각 SELL 행을 손 계산 정수 리터럴로 단언한다. 예: k = +1에서 화장품 하이퐁 SELL = 5370, BUY 4000 기준. BUY 행과 `config.offers`(예: `OFFER_SELL_02_NEW` 5000)는 그대로다.
   - (나) 손 고정물. BUY와 k를 골라 나머지가 반, 반 초과, 반 미만인 경우를 각각 하나 이상 만든다. 음수 k의 반 사례를 하나 포함한다. 엔진 경로(`withRiskLevelV2`)를 거쳐 리터럴로 단언하고, 손 계산 과정을 주석에 적는다.
3. **검증기와 같은 식.** 지금 자료 (다)의 SELL 행에서 k ∈ {+1, +3, −2}마다 다음을 단언한다.
   - 검증기 `credit_limit_sales`의 반올림 전 `base`가 정수다.
   - halfUp(base) = 엔진 새 SELL이다.
   - Python 식을 TS 리터럴로 옮겨 비교한다. 나머지가 있는 손 고정물은 이 시험에 쓰지 않는다.
4. **R0P에도 적용.** k = +1에서 R0P와 R4의 SELL 기준가가 같다. 근거는 판정표 3.3(‘k가 바뀌면 M′도 따라간다’)이다.
5. **실행기 경로.** 시험 안에서 import한 자료 객체의 `RISK_PROFILE_V2.sale_margin_k`를 1로 바꾸고 `simConfigV2`(`risk-metrics.ts`)를 부른다. 시험이 끝나면 되돌린다. 확인할 것은 셋이다.
   - SELL 기준가가 k = +1 값이다.
   - 설정의 `credit`에 `saleMarginK`가 없다.
   - 이 방법이 막히면 그 이유와 대체 방법을 결과 보고에 적는다.
6. **실제 실행 스모크.** `{ ...loadCreditProfile('RISK_PROFILE_V2'), saleMarginK: 1 }`로 R4·`MAX_CONTRIBUTION`·시드 2001을 `simulate`로 끝까지 돌린다.
   - 예외가 없고 실패 결과가 아니다.
   - k = 0 실행과 직접 무역 판매액 합이 다르다.
   - timeout은 60000ms 이상이다.
7. **로더 거절.** 자료의 k가 4, 2.5, 문자열이면 예외가 난다. 0이거나 없으면 키가 없다.

### 5. 회귀(작업 전·후) (C1·C2·C3·m1)
- 골든 둘이 종료 0이다: `node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`.
- `node src/engine/sim/run.mjs run --out …` 400회 결과는 전·후 `cmp` 0이다. 이 출력에는 위험 메타가 없다.
- **sha를 뺀 비교.** 아래 세 출력은 자료 파일 sha가 바뀌므로 그대로는 다르다. sha 칸의 경로는 **`meta.risk.marketRulesSha256`**이다. `jq -S 'del(.meta.risk.marketRulesSha256)' before.json > a; jq -S 'del(.meta.risk.marketRulesSha256)' after.json > b; cmp a b`로 비교해 0이어야 한다.
  1. v1 d03 R3. 명령은 TASK-0068a 1절 1을 쓰되, 그 절의 ‘자료가 같으므로 sha도 같다’는 전제는 적용하지 않는다. 표(.md)는 그대로 `cmp` 0이고, 표에 sha가 찍히지 않음도 확인한다.
  2. `node src/engine/sim/run.mjs d03 --risk-v2 R4 --seed-base 2001 --seeds 3 --workers 4 --out …`
  3. 같은 명령의 `--risk-v2 R0P`
  - 지운 sha는 따로 확인해 보고한다. 전 값은 `e4fa3308…f4ca`(BASE 자료와 같음), 후 값은 새 `data/market_rules.json` sha256이다.
  - `v2-tables`로 표를 비교하면 머리말의 sha 줄만 빼고 비교한다. 바뀐 값이 새 sha 앞자리와 같은지도 단언한다.
- **첫 화면 gzip.** 자료 파일이 첫 화면 data 청크에 들어 있어서 ‘같다’는 성립하지 않는다. 자료 칸만 더해도 +12 B다. 그래서 다음을 지킨다.
  - 측정 방법은 허브 개정 2(git 없는 두 폴더)다.
  - 첫 화면 gzip 증가는 **300 B 이하**이고, 한도 140,000 B 안이다.
  - 청크 목록과 각 청크의 ‘첫 화면/나중에 받음’ 구분은 전·후 같다. 실행기 코드가 첫 화면에 들어가지 않아야 한다.
  - 청크별 전·후 원문 크기, gzip 크기, 증가분을 표로 보고한다.

### 6. 변형(사본에서 넣고 되돌린다)

| 번호 | 변형 | 기대 |
|---|---|---|
| 1 | k를 R4·R1에만 적용하고 R0P는 뺀다 | 시험 4 실패 |
| 2 | halfUp 대신 버림 | 시험 2(나) 실패 |
| 3 | BUY 대신 SELL₀에 5k%를 곱한다 | 시험 2·3 실패 |
| 4 | k = 0일 때 SELL 값 하나를 1센트 바꾼다 | 시험 1 실패 |
| 5 | 검증기 범위 검사를 지운다 | 3번 시험 실패. MANIFEST `hash mismatch` 말고 다른 FAIL만 본다 |
| 6 | 원화로 바꾼 뒤의 BUY를 식에 쓴다 | 시험 2(가) 실패 |
| 7 | 설정의 `credit` 사본에서 `saleMarginK`를 빼지 않는다 | 시험 5 실패(k = +1에서 `credit`에 키가 남음) |

- 변형마다 실패한 시험 이름과 이유를 한 줄씩 적는다.

### 7. 결과 보고(`results/TASK-0069.md`)
- 시작 HEAD와 바꾼 파일
- 로더 예외 문장, 검증기 FAIL 문장
- 5번 회귀 결과 표: 지운 sha 전·후 값과 청크별 gzip 표를 포함한다
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
3. 변형 1~7이 모두 잡힌다.
4. `git diff --name-status <BASE>`에 허용 파일만 나온다.

## 병합 뒤 허브 할 일(지시서 밖)
- `check_profile_v2.py`의 기대 V2에 `sale_margin_k`(1회차는 그 회차 값)를 반영하고, 출력 sha를 다시 적는다.
- 판정표 v2 0절 고정 기록의 자료 sha를 정오로 바꾼다. 0회차 결과가 그대로 유효함은 5번 sha를 뺀 비교로 증명된다.

## 개정 1 처리표

| 지적 | 처리 |
|---|---|
| 허브 C1(첫 화면 gzip ‘같다’ 불가) | 5번: 300 B 이하, 청크 구분 불변, 청크별 표 |
| 허브 C2·세션 A m1(v1 R3 JSON sha) | 5번: sha를 뺀 비교 1, 표 `cmp` 0과 sha 미표시 확인 |
| 허브 C3(jq 경로 오기) | 5번: `meta.risk.marketRulesSha256`, 지운 sha 전·후 확인 |
| 허브 C4·세션 A M2(k를 실을 자리) | 1번: CreditProfile 선택 칸, 0이면 키 없음, 설정 사본에서 제거. 시험 1 `toStrictEqual`, 시험 5 실행기 경로, 변형 7 |
| 허브 C5·세션 A M1(원화 변환 전 BUY) | 2번 BUY 정의, 시험 2(가) 5370, 변형 6 |
| 허브 C6(검증기 base 반올림 전) | 시험 3을 지금 자료와 base 정수 단언으로 한정 |
| 세션 A m2(나머지 행 없음) | 시험 2(나) 손 고정물 필수 |
| 세션 A m3(정적 오퍼) | 원칙과 2번에 `config.offers` 불변, 시험 2(가) 단언 |
| 세션 A m4·허브 몫 1 | ‘병합 뒤 허브 할 일’ |
| 허브 몫 4(검증기 1회, 엔진 2회 반올림) | 지금 자료에서는 차이가 없다(BUY가 20센트의 배수). H31 정오에 기록하고 지시서는 바꾸지 않는다 |
| 기각 R1~R4 | 사전 검수 보고서 3절 |
