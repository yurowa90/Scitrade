# TASK-0068a 결과
- 모델: gpt-6-astra (high)
- BASE: 946f5f3cd6c0b84963cfca1d29f4a7ddbcfa687b

## 바꾼 파일

| 파일·주요 줄 | 변경 |
|---|---|
| `src/engine/sim/cli.ts:18`, `:47`, `:84`, `:98` | 도움말 전문, v2/프로필/40시드 검증, JSON·한 줄 요약, v1 도구 거절 |
| `src/engine/sim/d03.ts:39`, `:41`, `:62`, `:103` | 구별되는 v2 메타, 설정·묶음 선택, v1 표 입구 형 좁히기 |
| `src/engine/sim/risk-metrics.ts:8`, `:13`, `:16`, `:48`, `:83` | v2 단계·메타 형, 감싼 함수, 직접 무역 일곱 칸, 진단 U 재료 |
| `src/engine/sim/risk-tables.ts:113`, `:147` | 허용된 두 입구의 rules 거절·v1 형 좁히기만 |
| `src/engine/sim/operations-policy.ts:41`, `:62`, `:169`, `:182` | 조건 선택·재선택, 가산 반영, 후보·짝·견적 거절 계측 |
| `src/engine/sim/operations-metrics.ts:16`, `:27`, `:69` | rules-4 전용 계측 합산·출력 |
| `src/engine/sim/policies.ts:15` | PolicyDecision의 선택 칸 rejectionUnits만 추가 |
| `src/engine/sim/sim.ts:26`, `:44`, `:57` | 단계 형 확대·거절 계측 전달 |
| `src/engine/sim/variants.ts:5`, `:42` | 두 정책 등록·full/reduced 묶음 |
| `src/engine/sim/risk-runner-v2.test.ts:1` | 새 시험 13개, 지시서 시험 1~12(같은 날 한도는 별도 시험) |
| `MANIFEST.json` | 생성 도구로 갱신 |
| `docs/ai/tasks/results/TASK-0068a.md` | 이 결과 보고 |

## 설계 판단 (지시서에 없던 결정과 이유)

- `RiskMeta`를 v1(`rules?: never`)과 v2(`rules: 'M2a-rules-4'`)의 유니온으로 둔다. v1 객체에는 `rules` 키를 만들지 않는다. 승인 개정 2대로 v1 표 입구에서 좁히며 기존 표 계산은 바꾸지 않는다.
- 거절 자료형·0 초기값은 계측 소유자인 `operations-policy.ts`에 두고, `PolicyDecision`은 타입 참조만 한다. 정책은 보고서 모듈을 가져오지 않는다.
- 시도한 짝은 `[buyOfferId, sellOfferId]`의 JSON 키로 식별한다. 하루의 시도 집합에서 수락 집합을 빼서 짝·견적 수를 낸다. 후보 단위에는 기존 사유와 credit만 있고 OPEN 건너뜀은 별도다.
- 기존 코드의 `d03PolicyIds('base')`는 117개이고 원래 FOCUS·MARGIN_BUFFER가 없다. v2 전체는 120개, 축소는 7개다. v1 묶음 함수는 그대로 보존했다.
- 시험 10은 손 상태에서 실제 정책 결정을 검산한 뒤 그 결정의 계측을 `simulate`에 전달하는 시험 정책으로 수집 경로도 확인한다. 실제 캠페인 상태를 손 상태로 덮어 불변식을 우회하지 않는다.
- 변형 15가 필수 시드 검사를 없애더라도, 새 시험은 옵션 파서의 예외를 먼저 단언하고 멈춘다. v2 기본 시드(1001~)를 실행하지 않는다.

## 실행한 검증과 결과 (명령별 통과/실패, 테스트 개수)

### 작업 전 기준

| 명령 | 결과 |
|---|---|
| `python3 tools/validate_data.py` | 통과, 자료 25개·검사 34,049개 |
| `node tools/check_rules2_golden.mjs` | 통과, rules-2 105회·rules-1 400회, 로더 지문 포함 |
| `node tools/check_rules3_golden.mjs` | 통과, rules-3 108회, 로더 지문 포함 |
| `node src/engine/sim/run.mjs run --out /tmp/TASK-0068a-run-before.json` | 통과, 400회·27.27초 |
| `node src/engine/sim/run.mjs d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0068a-v1r3-before.json > /tmp/TASK-0068a-v1r3-before.md` | 통과, 351회·317.56초, 실제 워커 3개 |
| BASE의 `git archive` 폴더에서 `npm run --silent build && node tools/check_bundle_size.mjs dist` | 통과, 빌드 표시 dev, 첫 화면 gzip **132,576 B** |

### 구현 검증

- `npm run typecheck`: 통과.
- `npx vitest run src/engine/sim/risk-runner-v2.test.ts --reporter verbose`: **13개 통과**, 37.40초. R4 CLI 스모크 7.427초(60초 이내), 워커 바이트 시험 18.338초.
- 기제 시험 시드 2001·2002·2003: CREDIT_AWARE의 C 비BASE 0건. TERM_GREEDY의 C 비BASE도 이 세 시드에서 없었으므로 **손 고정물로만 확인**. 손 고정물의 A·B는 두 정책 모두 D30, C는 TERM_GREEDY D30 / CREDIT_AWARE BASE.
- 고정물 작성 중 타입 검사 4건(OfferState·GameState 필드)과 손 고정물 시험이 실패했다. 초기 고정 견적 위치, 중복 시험 견적 ID, 캠페인 상태 주입을 수정했다. 기존 시험 기대값·자료는 고치지 않았다. 위 13개 통과는 수정 후 출력이다.
- 변형은 `/tmp/TASK-0068a-mutations.py`로 하나씩 적용하고 매회 `finally`에서 원문을 복원했다. 로그는 `/tmp/TASK-0068a-mutation-01.log`~`17.log`, 요약은 `/tmp/TASK-0068a-mutations.json`이다. 17개 모두 실패 종료 1로 탐지됐다. 변형 4는 시험 5로 탐지했으며, 변형 상태의 351회 cmp는 추가 실행하지 않았다.

| 변형 | 실제 실패한 시험 이름 (`TASK-0068a 실행기 v2` 아래) | 실패 이유 | 종료 |
|---|---|---|---|
| 1 | 3 정책 조건 선택: 날짜·한도·C 등급·기준 명령 | D30 허용 후보가 D15가 됨. | 1(탐지) |
| 2 | 3 정책 조건 선택: 날짜·한도·C 등급·기준 명령 / 7 손 기제: C만 BASE로 갈리고 A·B는 두 정책에서 같다 | C 계약이 BASE 대신 D30이 됨. | 1(탐지) |
| 3 | 4 가산 판매액은 기여에 그대로 더하고 v1 후보 값은 보존한다 | 판매 가산 5,186센트에 비해 기여 증분이 0. | 1(탐지) |
| 4 | 5 RiskContract 일곱 칸은 v2 직접 무역에만 있고 상태·환율·성분과 같다 | v1 계약에 새 키가 생김. | 1(탐지) |
| 5 | 1 CLI 도움말 전문과 옵션·시드 경계 | 40개 안전 정수 경계 목록의 끝이 9007199254740971로 줄어듦. | 1(탐지) |
| 6 | 6 진단 U: 확정 1·미확정 2, 배타 수금, 날짜·한도 경계 | 미확정 대손이 2 대신 1. | 1(탐지) |
| 7 | 6 진단 U: 확정 1·미확정 2, 배타 수금, 날짜·한도 경계 | 경계 +1 오퍼까지 가능으로 세어 날짜 분모가 커짐. | 1(탐지) |
| 8 | 1 CLI 도움말 전문과 옵션·시드 경계 / 9 R4 CLI 스모크: 메타·요약·정책별 조건 합계 | 외상 칸 없는 DEFAULT 선택으로 옵션·스모크 실패. | 1(탐지) |
| 9 | 3 같은 날 한도: 생성 때 D30인 둘째 후보를 수락 직전 BASE로 다시 고른다 | 둘째 계약이 외상 한도 초과로 사라짐. | 1(탐지) |
| 10 | 10 거절 단위: onTime 1·짝 1·견적 1·OPEN 건너뜀 2와 simulate 전달 | OPEN 건너뜀까지 후보 onTime에 더해 손 계산과 불일치. | 1(탐지) |
| 11 | 12 v1 비교·표는 같은 시드·프로필·sha의 v2 R1/R2도 rules로 거절한다 | v2 R1/R2 비교가 종료 2 대신 0. | 1(탐지) |
| 12 | 6 진단 U: 확정 1·미확정 2, 배타 수금, 날짜·한도 경계 | 부분 수금을 지연 전액에도 세어 1 대신 2. | 1(탐지) |
| 13 | 9 R4 CLI 스모크: 메타·요약·정책별 조건 합계 / 11 워커 1·2 JSON 바이트와 v2 메타 일치 | v1 설정으로 실행하여 외상 정책의 선택지가 없어 스모크·워커 실패. | 1(탐지) |
| 14 | 11 워커 1·2 JSON 바이트와 v2 메타 일치 | 위험 단계가 비어 sha 전달 전에 요청 검증에서 거절됨(시험 11 탐지). | 1(탐지) |
| 15 | 1 CLI 도움말 전문과 옵션·시드 경계 | 기준값 없는 v2 옵션이 예외를 내지 않음. 옵션 단언에서 멈춰 기본 시드는 실행하지 않음. | 1(탐지) |
| 16 | 10 거절 단위: onTime 1·짝 1·견적 1·OPEN 건너뜀 2와 simulate 전달 | 실행 출력의 rejectionsV2가 0으로 남음. | 1(탐지) |
| 17 | 5 RiskContract 일곱 칸은 v2 직접 무역에만 있고 상태·환율·성분과 같다 | 주선 계약에 새 키가 생김. | 1(탐지) |

### 최종 검증

| 명령 | 결과 |
|---|---|
| `python3 tools/build_package.py --manifest-only` | 통과, 804개 파일. 보고서 확정 뒤 다시 생성 |
| `python3 tools/validate_data.py` | 통과, 자료 25개·검사 34,051개 |
| `npm run typecheck` / 검수의 `npm run --silent typecheck` | 통과 |
| `npx vitest run` | 통과, **58개 파일·1,583개 시험 통과, 기존 todo 1개**, 103.24초 |
| `npm run build` / 검수의 `npm run --silent build` | 통과 |
| `node tools/check_rules2_golden.mjs` | 통과, 작업 전과 같은 rules-2 105회·rules-1 400회, 로더 지문 포함 |
| `node tools/check_rules3_golden.mjs` | 통과, 작업 전과 같은 rules-3 108회, 로더 지문 포함 |
| `node src/engine/sim/run.mjs run --out /tmp/TASK-0068a-run-after.json` | 통과, 400회·24.27초 |
| `cmp /tmp/TASK-0068a-run-before.json /tmp/TASK-0068a-run-after.json` | **종료 0, 바이트 일치** |
| 작업 전과 같은 v1 R3 d03 명령(`-after.json`, `-after.md`) | 통과, 351회·274.79초·실제 워커 3개 |
| `cmp /tmp/TASK-0068a-v1r3-before.json /tmp/TASK-0068a-v1r3-after.json` | **종료 0, 바이트 일치** |
| `cmp /tmp/TASK-0068a-v1r3-before.md /tmp/TASK-0068a-v1r3-after.md` | **종료 0, 바이트 일치** |
| 작업 트리를 `.git`·`node_modules` 없이 복사한 폴더에서 `npm run --silent build && node tools/check_bundle_size.mjs dist` | 통과, 표시 dev. **132,576 B → 132,576 B** |
| `cmp /tmp/TASK-0068a-bundle-before.log /tmp/TASK-0068a-bundle-after.log` | 종료 0, 청크 해시·개별 크기까지 일치 |
| `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check 946f5f3cd6c0b84963cfca1d29f4a7ddbcfa687b` | **검사 18종, 실패 0종 (모드: 확인)** |
| `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden` | 빈 출력, 기존 시험·골든 무수정 |
| `git diff --check` | 통과 |

전체 시험 통과에는 기존 `risk-runner.test.ts`·`seed-base.test.ts`가 포함된다. 검수 로그는 `/tmp/TASK-0068a-review.log`다. 별도 도구 시험은 rules-2·3 Node 래퍼 각 1개, 그림 21개, 지도 21개, 자료 검사기 143개, 사실 섞임 검사기 26개, 브라우저 라이브러리·묶음 크기 Node 래퍼 각 1개가 통과했다.

기존 첫 화면 표시에 `946f5f3+수정`이 들어가는 작업 트리 직접 빌드는 132,588 B이고 크기 한도에 통과했다. 전후 동일성 판정에는 승인 개정 2의 **dev 표시 두 빌드만** 썼다. 첫 화면 JS·CSS 원문도 양쪽 463,556 B다.

변형 9는 생성 때 조건을 후보에 저장하고 수락 루프의 재호출을 실제로 제거한 형태도 분리 빌드 사본에서 재확인했다. 같은 시험이 둘째 계약 누락으로 실패했고 원문으로 복원했다(`/tmp/TASK-0068a-mutation-09-no-recheck.log`). 복원 후 실행기 9개·새 시험 파일의 SHA-256을 고정해 최종까지 동일함을 확인했다. 모든 변형은 제거됐고 `git status --porcelain --untracked-files=all`의 `??`는 새 시험·이 보고서뿐이다.

검수 후에는 실행 근거를 이 보고서에 확정하고 MANIFEST를 재생성·검사했다. 실행기·시험 코드는 검수 이후 바뀌지 않았다.

전후 공통 SHA-256:

| 출력 | 바이트 | SHA-256 |
|---|---:|---|
| 비위험 JSON | 875,446 | `5de56f27fc1df47e73681fdc1d54a299132331772322d07f90475233d1ab4428` |
| v1 R3 JSON | 19,687,118 | `7b6e8f6f3a9bb8515ce10abdd0359440d939d81051001125a24a0612ec6241a1` |
| v1 R3 표 | 13,657 | `780ec405ee677cd19a897417c02e599bc06f3e8cb97edff5cd1ec6f3253a0cf9` |


## 완료 조건 대조 (지시서의 조건마다 충족/미충족과 근거)

| 조건 | 대조 | 근거 |
|---|---|---|
| 1. 전후 골든·회귀·기존 시험 | 충족 | 골든 둘 모두 종료 0, 비위험 JSON·v1 R3 JSON·표 cmp 모두 0, 기존 시험 무수정 통과 |
| 2. 기존 시험 변경 없음 | 충족 | 지정 diff 빈 출력. 미추적 파일은 새 시험과 결과 보고만 |
| 3. 새 시험과 변형 17개 | 충족 | 새 시험 13개 통과, 변형 17개 모두 지정 시험에서 실패·복원 |
| 4. 첫 화면 gzip 동일 | 충족 | 승인된 dev 표시 조건에서 132,576 B → 132,576 B |
| 5. manifest·자료 검사 | 충족 | 804개 파일·자료 25개·검사 34,051개 |
| 6. review_checks | 충족 | 검사 18종, 실패 0종 (모드: 확인) |
| 7. 결과 보고 | 충족 | 이 파일 |


## CLI·출력 예시와 0068b 인계

### 도움말 전후

변경 전에는 v2 명령 줄이 없었다. 바뀐 마지막 두 줄은 아래와 같고, 나머지 기존 줄은 보존했다:

```text
시드 수 N은 선택한 시드 목록의 앞 1~20개입니다. 비교 표시 한도는 0 이상의 정수입니다.
D03의 --seed-base N은 시드 목록을 N~N+19로 바꿉니다. 분할 번호는 이 목록에 적용됩니다.
```

변경 후는 아래 전문이며 시험 1이 바이트 단위 문자열 동등성을 검사한다. 명령 줄은 두 칸, 마지막 두 줄은 들여쓰기 없다.

```text
사용법:
  sim run [--scenarios A,B] [--policies X,Y] [--seeds N] [--out PATH]
  sim d03 [--risk R0|R1|R2|R3] [--scenarios A,B] [--round 0~3] [--seed-base N] [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
  sim d03 --risk-v2 R0P|R1|R2|R3|R4 --seed-base N [--profile ID] [--round 0~3] [--scenarios A] [--seeds N] [--seed-from N] [--seed-to N] [--late base|cap30|flat200] [--workers N] [--out PATH]
  sim d03 --tables-from a.json,b.json [--late base|cap30|flat200]
  sim risk-compare A B
  sim compare BEFORE AFTER [--limit N]
  sim summary FILE
  sim help | --help
run의 시드 수 N은 기본 목록의 앞 1~20개입니다. 비교 표시 한도는 0 이상의 정수입니다.
D03의 --seed-base N은 시드 목록을 N~N+(시드 수−1)로 바꿉니다(시드 수 기본 20, 최대 40). --seed-base 없이 시드 수는 20 이하입니다. 분할 번호는 이 목록에 적용됩니다.
```

### JSON 인계

실제 비용 확인 출력 `/tmp/TASK-0068a-r4-cost.json`의 시드 2001, TERM_GREEDY에서 발췌했다. credit·rejectionsV2는 그 실행 전체의 값이다.

```json
{
  "meta.risk": {
    "rules": "M2a-rules-4",
    "level": "R4",
    "profileId": "RISK_PROFILE_V2",
    "tuningRound": 0,
    "marketRulesSha256": "e4fa3308878696c08d169e289d3df588e925a77b77d7cfc9c7c17e97906cf4ca"
  },
  "policyId": "TERM_GREEDY",
  "seed": 2001,
  "metrics.risk.contracts[직접 무역 하나]": {
    "contractId": "CT001",
    "kind": "DIRECT_TRADE",
    "sellOfferId": "OFFER_SELL_02_NEW",
    "goodId": "COSMETICS",
    "status": "COMPLETED",
    "class": "완료",
    "onTime": true,
    "realized": -2046872,
    "openFixedRateKrw": -2046872,
    "components": {
      "schedule": 0,
      "fx": -180200,
      "tariff": 0,
      "surcharge": 0,
      "late": 0,
      "claim": 0,
      "cancel": 0,
      "collection": -164300,
      "default": -2170350,
      "carry": -13022,
      "open_valuation": 0,
      "residual": 0
    },
    "evaluationDay": 90,
    "creditTermId": "D30",
    "creditEligible": {
      "dateRule": true,
      "limitBlocked": []
    },
    "grade": "B",
    "saleAmountMinor": 265000,
    "acceptedDay": 1,
    "paymentDueDay": 42,
    "saleKrwAtAcceptMinor": 3445000
  },
  "metrics.risk.credit": {
    "defaultsConfirmed": 1,
    "badDebtMinor": 185500,
    "defaultsUnconfirmed": 0,
    "unconfirmedMinor": 0,
    "carryMinor": 2846,
    "limitBlocked": 0,
    "termCounts": {
      "BASE": 1,
      "D15": 0,
      "D30": 2
    },
    "partialReceipts": 0,
    "lateReceipts": 1,
    "dateEligible": 2,
    "dateLimitEligible": 2
  },
  "metrics.operations.rejectionsV2": {
    "candidate": {
      "funds": 212,
      "storage": 10,
      "handling": 12,
      "sailing": 44,
      "staff": 0,
      "onTime": 36,
      "credit": 0
    },
    "pair": 60,
    "quote": 60,
    "skippedNotOpen": 3
  }
}
```

- `bundleKindV2('R0P' | 'R4')`는 `full`, R1~R3은 `reduced`. `d03PolicyIdsV2`가 실제 정책 목록을 낸다.
- `saleKrwAtAcceptMinor`는 직접 무역 판매액을 수락일 참고 환율로 환산한 원화 정수이며 J9 분모 재료다. 주선 계약에는 일곱 새 칸 모두 없다.
- `dateEligible`은 계약 결제일에서 선택 조건 기간을 빼 원래 결제일을 복원한 뒤, 비BASE 기간과 `lateMaxDays`를 더해 계산한다. `dateLimitEligible`은 이 가능 조건 가운데 `limitBlocked`에 없는 것이 있는 계약 수다.
- `credit` 금액은 엔진 USD 최소 단위(센트), 수는 청구서/계약 건수다. `lateReceipts`는 단일 일반 수금만 세며 부분·회수와 겹치지 않는다. v1 대비 증감 칸은 없다.
- `metrics.operations.rejectionsV2`는 `candidate` 사유별 합, `pair`, `quote`, `skippedNotOpen`의 실행 전체 합이다. 기존 `rejections`에는 credit를 더하지 않는다.
- 표·문턱·판정·층 비교·0068b의 진단은 구현하지 않았다. v2 stdout은 승인된 한 줄 요약이다.

## 실행 비용 (시험 시드, 측정 아님)

실행 명령:

```sh
node src/engine/sim/run.mjs d03 --risk-v2 R4 --seed-base 2001 --seeds 3 --workers 4 --out /tmp/TASK-0068a-r4-cost.json
```

- (다), R4, 전체 120정책 × 3시드 = **360회**. 요청 워커 4, 시드가 3개여서 **실제 워커 3**.
- 별도 검증 실행과 겹치지 않게 재었다. 자식 과정 시작부터 종료까지 **229.440초(3분 49.44초)**. 실행기 자체 시간은 **228.21초**이며 stderr 기록도 보관했다.
- stdout: `v2 실행 360회 · 단계 R4 · 프로필 RISK_PROFILE_V2 · 시드 2001~2003 (표는 TASK-0068b)`.
- 40시드·다섯 단계 실행 수 = `40 × (120 × 2 + 7 × 3)` = **10,440회**. 이번 R4 실행당 비용을 그대로 적용하면 실제 워커 3 유지 시 `229.440 × 10440 / 360` = **110.90분**.
- 40시드에서는 워커 4개를 모두 쓸 수 있다. 선형 병렬 가정으로 위 시간에 3/4를 곱하면 **83.17분(약 1시간 23분)**. 판정표의 약 1시간 40분과 같은 규모다. 단계별 비용 차이·워커 비용을 따로 재지 않은 추정이며, 40시드·다섯 단계 실행은 하지 않았다.


## 범위 밖 발견

- 현재 판정표 v2의 측정 전 고정 기록은 허브가 채우는 항목이다. 이번 실행은 승인된 지시서의 시험·비용 확인으로만 제한했다. 측정 시드 1061~1180과 판본 1 시드 1001~1060으로 v2를 돌리지 않았다.
- 수정이 필요한 범위 밖 코드 문제는 발견하지 않았다. 자료·화면·엔진·기존 시험·골든·금지 문서는 바꾸지 않았다.

## 질문

없음. 커밋·푸시·브랜치 전환·패키지 설치를 하지 않았다.
