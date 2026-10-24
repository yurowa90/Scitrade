# TASK-0068a 결과
- 모델: gpt-6-astra
- BASE: 83ff26a47442ca3ebadf6b2c09f9243bfd130e04
- 상태: **중단 — 허용 수정 범위와 v2 메타 형의 충돌. 구현 미완료.**

## 바꾼 파일

- `docs/ai/tasks/results/TASK-0068a.md`: 중단 근거와 실행한 검증 기록.
- `MANIFEST.json`: 보고서 작성 뒤 생성 도구로 갱신.
- 구현 파일·기존 시험·자료는 변경하지 않았다. 아래 타입 재현을 위해 임시 변경한 `risk-metrics.ts`는 원문 바이트로 복원했다.

## 설계 판단 (지시서에 없던 결정과 이유)

지시서 9절은 `risk-tables.ts`에서 **“compareRisk 첫머리의 rules 거절만”** 허용하고, 그 밖의 수정이 필요하면 멈추라고 한다. 다음 충돌을 확인해 그 조건에 따라 중단했다.

1. 2.1절의 v2 메타는 `level: RiskLevelV2`를 담아야 한다. 현재 `SimOutput.meta.risk`의 형은 `RiskMeta`이며, 그 `level`은 v1 `RiskLevel`이다. v1 `RiskLevel` 자체는 지시서대로 유지해야 한다.
2. `RiskMeta.level`이 `RiskLevel | RiskLevelV2`를 받을 수 있게 되면, 기존 `risk-tables.ts:114`의 `comparisonValue(level)`과 `:121`의 `judgmentRow(id, level, ...)`는 타입 오류다. 두 함수는 v1 `RiskLevel`만 받는다.
3. `compareRisk` 첫머리의 거절은 별도 함수인 `riskTables()`의 타입을 좁히지 않는다. CLI가 v2에서 이 함수를 부르지 않는다는 실행 분기도 함수 본문의 정적 오류를 해소하지 못한다.
4. 따라서 v1/v2 메타를 정확하게 표현하려면 `riskTables()` 입구의 v2 거절·v1 타입 좁히기도 허용해야 한다. v2 값을 v1 형이라고 강제 단언하거나 `any`로 숨기는 방식은 사용하지 않았다.

### 재현

`risk-metrics.ts`에만 아래 임시 변경을 한 뒤 `npm run typecheck`를 실행하고 원문을 복원했다.

```ts
export type RiskLevelV2 = 'R0P' | 'R1' | 'R2' | 'R3' | 'R4';
export interface RiskMeta { level: RiskLevel | RiskLevelV2; /* 기존 나머지 칸 */ }
```

발생한 TS2345 6건 가운데 허용 범위를 벗어나는 오류 2건:

```text
src/engine/sim/risk-tables.ts(114,66): error TS2345: Argument of type '"R0" | "R0P" | "R1" | "R2" | "R3" | "R4"' is not assignable to parameter of type 'RiskLevel | undefined'.
  Type '"R0P"' is not assignable to type 'RiskLevel | undefined'.
src/engine/sim/risk-tables.ts(121,132): error TS2345: Argument of type '"R0" | "R0P" | "R1" | "R2" | "R3" | "R4"' is not assignable to parameter of type 'RiskLevel'.
  Type '"R0P"' is not assignable to type 'RiskLevel'.
```

나머지 4건은 `d03.ts:67,72,97,175`에서 발생했다. 이 파일은 허용 범위이며, v2 설정 분기·simulate 인수 확대·v1 표 입구의 메타 좁히기로 처리할 수 있다. 중단 사유는 `risk-tables.ts`의 두 호출부다. 전체 재현 출력은 `/tmp/TASK-0068a-meta-typecheck.log`에 남겼다.

제안하는 최소 변경 범위: `risk-tables.ts`의 `compareRisk` 첫머리 외에 **`riskTables` 입구에서 v2를 거절하고 v1 메타 형으로 좁히는 처리**도 허용한다. 표 계산·판정 기준·문구는 그대로 둔다. `RiskMeta`는 `rules` 유무로 구별되는 v1/v2 유니온으로 표현할 수 있다.

## 실행한 검증과 결과 (명령별 통과/실패, 테스트 개수)

| 명령 | 결과 |
|---|---|
| `node tools/check_rules2_golden.mjs` (수정 전) | 통과, rules-2 105회·rules-1 400회 일치 |
| `node tools/check_rules3_golden.mjs` (수정 전) | 통과, rules-3 108회 일치 |
| `node src/engine/sim/run.mjs run --out /tmp/TASK-0068a-run-before.json` | 통과, 400회, 23.38초 |
| `node src/engine/sim/run.mjs d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 2001 --seed-from 1 --seed-to 3 --workers 4 --out /tmp/TASK-0068a-v1r3-before.json > /tmp/TASK-0068a-v1r3-before.md` | 통과, 351회·271.44초·실제 워커 3개 |
| `npm run --silent build && node tools/check_bundle_size.mjs dist` (수정 전) | 통과, 첫 화면 gzip 132,580 B |
| 임시 메타 형 확대 후 `npm run typecheck` | 의도된 재현 실패, TS2345 6건. 임시 변경은 복원 |
| `python3 tools/build_package.py --manifest-only` | 통과, 보고서 포함 803개 파일 |
| `python3 tools/validate_data.py` | 통과, 자료 25개·검사 34,049개 (보고서 추가 뒤) |
| `npm run typecheck` (복원 뒤) | 통과 |
| `npx vitest run` (복원 뒤) | 통과, 57개 파일·1,570개 시험 통과, 기존 todo 1개. 144.81초 |
| `npm run build` (복원 뒤) | 통과 |
| `node tools/check_bundle_size.mjs dist` (복원 뒤) | 도구의 크기 한도 판정 통과, 첫 화면 gzip 132,589 B. 전후 동일 조건은 미충족(+9 B) |

기존 `risk-runner.test.ts`·`seed-base.test.ts`를 포함한 전체 기존 시험이 수정 없이 통과했다. `git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력이다. 구현 파일 diff도 없다. 전후 회귀 cmp와 review_checks는 중단으로 실행하지 않았다.

## 완료 조건 대조 (지시서의 조건마다 충족/미충족과 근거)

| 조건 | 상태 | 근거 |
|---|---|---|
| 1. 전후 골든·회귀 cmp·기존 두 시험 통과 | 미충족 | 구현 전에 중단. 전후 전체 회귀 검증을 완료하지 않음 |
| 2. 기존 시험 변경 없음 | 충족 | 기존 시험을 수정하지 않음 |
| 3. 새 시험·변형 17개 | 미충족 | 새 기능·시험·변형 시험 미실행 |
| 4. 첫 화면 gzip 전후 같음 | 미충족 | 132,580 B → 132,589 B (+9 B), 구현 코드 변경 없음 |
| 5. manifest·자료 검사 | 충족 | 생성·자료 검사 모두 통과 |
| 6. review_checks 18종 실패 0 | 미충족 | 구현 중단으로 미실행 |
| 7. 결과 보고 | 충족 | 이 파일 |

CLI 도움말·v2 메타·RiskContract·credit·rejectionsV2 예시는 미생성이다. 기제 시험·R4 스모크·워커 바이트 비교·17개 변형·실행 비용 확인은 하지 않았다. 0068b에 넘길 구현 산출물도 아직 없다. 측정 시드로 v2를 실행하지 않았다. 커밋·푸시·브랜치 전환은 하지 않았다.

## 범위 밖 발견

- 수정 전 빌드의 첫 화면 gzip은 **132,580 B**다. 지시서에 적힌 0067b 병합본 **132,576 B**와 4 B 차이다. 작업 시작 시 Git 작업 트리는 깨끗했고 구현 파일을 고치기 전에 나온 값이다. 원인을 추정해 코드를 바꾸지 않았다. 해당 환경의 전후 값으로 비교한다.
- 보고서·MANIFEST 추가 후 빌드의 첫 화면 gzip은 **132,589 B**로 수정 전보다 9 B 크다. 구현 파일 diff가 없는 상태에서 발생했다. `vite.config.ts:12-13`은 추적 파일에 변경이 있으면 빌드 ID에 `+수정`을 붙인다. 보고서 생성으로 `MANIFEST.json`이 변경되어 이 분기가 켜졌으며, 첫 화면 원문 크기의 +7 B도 이 UTF-8 문자열 길이와 같다. 전후 빌드 ID가 다른 비교라는 제한을 기록한다. 지시서 1절 4에 따라 빌드 설정을 고치거나 표시를 숨겨 전후 동일이라고 처리하지 않았다.
- 위 `riskTables()` 타입 좁히기가 현재 지시서의 허용 범위 밖이다.

## 질문

- 빌드의 `+수정` 표시 때문에 전후 gzip이 달라지는 경우, 같은 빌드 ID로 비교하는 별도 검증 절차를 허용할 것인가? 현재 설정 그대로는 깨끗한 BASE와 수정 작업 트리의 gzip 동일 조건을 보장할 수 없다.
- 지시서 9절의 `risk-tables.ts` 허용 범위에 `riskTables()` 입구의 v2 거절·v1 메타 타입 좁히기를 추가할 수 있는가? 이 범위가 열리면 v1 `RiskLevel`과 표 계산을 보존하면서 v2 메타를 구현할 수 있다.
