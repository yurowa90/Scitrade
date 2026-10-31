# TASK-0076 첫 화면 여유 되찾기: 분할 후보 A′·B·C·D 조사와 구현(동작 불변)

- **지위: 1회차 승인(허브, 2026-10-31, H38).** 1회차(2절)만 실행한다. 1회차는 저장소의 제품·시험·자료 파일을 바꾸지 않고 결과 보고와 MANIFEST만 쓴다. 3절 R1 구현은 1회차 보고를 본 허브가 조합을 고른 뒤 따로 승인한다.
  - Q1 답: 두 번 실행한다(1회차 조사 → 허브 선택 → R1).
  - Q2 답: 관문은 **여유 회복**으로 정의한다. R1 뒤 첫 화면 여유가 **8,000 B 이상**이어야 한다(현재 5,276 B이므로 절감 ≥ 2,724 B, 반올림해 3,000 B를 그대로 쓴다). 8 KB는 엔진 지시서 둘(지시서당 약 1.3 KB에 첫 사용 비용 약 0.7~1.3 KB를 더한 값, 0074·0075 실측)과 경보선 5 KB 사이의 여유다.
- 근거
  - 허브 결정 H36-3: 0075 다음의 첫 화면 기능 지시서 앞에 분할 지시서를 둔다.
  - STATUS 후속: 후보 D, rolldown 유령 의존
  - `docs/ai/tasks/results/TASK-0073.md`: 분류표, 탐침 1~3차
  - `docs/ai/tasks/TASK-0073-engine-ops-split.md`(승인, 허브 개정 1): 3.1~3.4 등록 장치. 작업자 스레드 등록을 포함하며, 구현되지 않았다.
  - `docs/ai/design/path11-engine-seam-2026-10/SCOPE.md` 2절, 3.1
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **목적**: 첫 화면 gzip 여유를 되찾는다.
  - 초안 시점(`7f8b8b0`, 깨끗한 트리 빌드)의 첫 화면 gzip은 134,724 B다. 한도는 140,000 B, 여유는 **5,276 B**, 경보선은 5,000 B다.
  - 구성: `index` 97,764 B, `data` 29,671 B, CSS
- **성격: 동작 불변 정리다.** 게임 규칙, 값, 문구, 저장 형식, 화면 HTML은 바이트로 그대로다.
- **실행은 두 번으로 나눈다(4절).**
  - 1회차: 조사와 탐침만 하고 반드시 멈춰 보고한다.
  - 2회차(R1): 허브가 1회차 보고를 보고 고른 후보만 구현한다.
- 범위 밖: 새 기능, 서비스 워커, iPad 실기기, 측정(판정표 시드)
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 둘이다.
  1. 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다.
  2. 판본 2 SHA256SUMS 재현은 판본 2 측정 시드 1061~1100의 R1·R2를 다시 돌린다. sha256만 비교한다.

## 0. 먼저 읽을 것

1. `docs/ai/tasks/results/TASK-0073.md` 전체
   - 기호 분류표
   - 탐침 방식
     - 1차 `codeSplitting` 그룹 + `includeDependenciesRecursively: false`
     - 2차 핵심 이동
     - 3차 작은 등록 표로 지연 연결
   - 0073 3차의 예상 절감은 **3,406 B**였다. 그러나 TASK-0074·0075 이전 트리에서 잰 값이다. 0074의 로더 변환(`withRiskLevelV2` 등)이 첫 화면에 들어왔으므로 다시 잰다.
2. `TASK-0073-engine-ops-split.md`의 3.1~3.4와 허브 개정 1
   - 등록 표, 진입 모듈, 작업자 스레드 등록, `loadText` 순서
   - 후보 A′·B·C는 모두 이 장치나 이에 준하는 ‘비동기 관문’이 필요하다.
3. 첫 화면 동기 경로
   - `src/ui/main.ts:43`: `SCENARIO_TITLES`가 첫 화면에서 `ALL_SCENARIO_IDS` 전부에 `loadScenario`를 부른다. 운영 시나리오도 포함이다.
   - `:169` `startScenario` → `loadScenario`
   - `:1550` 시나리오 고르기: 운영이면 `ensureOpsScreens()`를 기다린다.
   - `:1600-1615` `loadText` → `loadSaveText`(`session.ts:27-39`) → `deserializeSave` → `checkSaveShape`·`checkInvariants`·`openDay`
   - `:1622-1626` 한가할 때 미리 받기
4. 지연 장치: `ui/lazy.ts`(첫 시도와 재시도 한 번), `ui/ops-screens.ts`
5. 크기 도구: `tools/check_bundle_size.mjs`, `tools/bundle-size.mjs:107`(`collectDist(dir).lazy`)

## 1. 후보

| 후보 | 내용 | 알려진 수치 | 필요한 장치 |
|---|---|---|---|
| A′ | 운영 없는 경로에서도 불리는 핵심 함수의 몸을 ‘비운영 머리(첫 화면)’와 ‘운영 몸(지연)’으로 쪼갠다. 대상은 0073 분류표의 핵심 루트(`tariffSchedule`·`fixedCostsDue`·`processPaymentDefault`·`operationsProblems`·`paymentDefaultStatus`·`applyOperationsCommand`·`storageShortfall` 등)다. 0073의 A(잔여 호출 지연)를 포함한다 | 0073: A만 3,406 B. A′의 추가 상한은 2차 상한 감소분 7,902 B 안 | 0073 3.1~3.4 등록 장치 |
| B | `save-shape.ts`를 저장 불러오기 때만 받는다 | 세션 B 상한 2,389 B | 불러오기 전 비동기 관문(`loadText`). `deserializeSave`의 동기 호출자(시험·sim·골든)에 등록 |
| C | 운영 전용 자료(`market_rules.json` 등)를 운영 시나리오 진입 때만 받는다 | 세션 B 상한 2,626 B | 운영 진입·불러오기 전 관문. `main.ts:43`의 제목 계산은 자료 없이 해야 한다(`scenarios.json`의 `title_ko`만 읽기 등) |
| D | 지연 청크만 쓰는 첫 화면 모듈의 함수를 지연 전용 파일로 옮긴다 | 초안 시점에 찾은 것은 넷이다(아래) | 없음(순수 이동). 시험·도구·sim의 import 경로만 바뀐다 |

- **후보 D의 현재 대상**
  - 찾은 방법: 깨끗한 빌드의 `index` 청크에서, `export{…}`의 지역 이름 가운데 청크 본문에서 정의 말고는 나오지 않는 것을 셌다. 세션 A가 일회 확인했다.
  - 대상 넷:
    - `creditTermOptions`(readers.ts)
    - `receivableSchedule`(reports.ts)
    - `marketTable`류로 보이는 운영 견적 표 함수(`$t`, `if(!e.operations||!t.operations)return[]…`로 시작)
    - 문화 미리보기(`Ti`, `t.culture?.activities.find…`로 시작)
  - 1회차에서 이 방법을 스크립트로 되풀이할 수 있게 만들어 정확한 원본 이름과 파일을 적는다.
- **후보끼리의 상호작용**: 압축 사전 공유와 청크 경계 때문에 절감은 더해지지 않을 수 있다. 그래서 고른 조합도 따로 잰다(2.3).

## 2. 1회차: 조사와 탐침(저장소 파일을 바꾸지 않는다)

### 2.1 영향 범위(grep으로 정의)

BASE에서 다음을 돌려 결과 **전문**을 결과 보고에 붙이고, 줄마다 후보별 영향(없음/고칠 import/고칠 단언)을 적는다. 손으로 요약하지 않는다(0075 교훈).

```
grep -rn "import.meta.glob" src --include=*.test.ts
grep -rn "subtle.digest\|createHash" src tools --include=*.test.ts --include=*.test.mjs
grep -rn "readdirSync\|toHaveLength(" src tools --include=*.test.ts --include=*.test.mjs | grep -i "file\|chunk\|dump\|readdir"
grep -rn "ops-screens\|lazyScreen\|ensureOpsScreens" src --include=*.ts
grep -rn "from './save-shape'\|from './readers'\|from './reports'\|market_rules.json" src tools --include=*.ts --include=*.mjs
```

### 2.2 후보별 탐침(사본 트리, 각 후보 셋 이상)

모든 탐침은 `git archive`로 깨끗한 사본(`/tmp/T76-*`)에서 하고, `node tools/check_bundle_size.mjs dist`의 첫 화면 gzip을 적는다.

| 후보 | (1) 상한 | (2) 현실 | (3) 첫 사용 비용 |
|---|---|---|---|
| A′ | 0073 1차·2차와 같은 그룹 탐침을 현재 트리에서 다시 | 0073 3차처럼 작은 등록 표로 지연 연결. 그리고 핵심 루트의 운영 몸을 머리/몸으로 쪼갠 사본 | 지연 쪽이 처음 쓰는 첫 화면 내보내기의 몸이 첫 화면에 들어오는지(0075 분석 방식) |
| B | `save-shape.ts` 단독 그룹 | `loadText`에서 동적 import 뒤 검사기를 넘기는 최소 연결 사본 | 같음 |
| C | 운영 자료 JSON 그룹 | 운영 진입에서 동적 import로 자료를 받는 최소 연결 사본. 제목은 자료 없이 | 같음 |
| D | 해당 없음 | 대상 함수를 지연 전용 파일로 옮긴 사본 | 해당 없음 |

- 후보마다 결과 보고에 다음 넷을 적는다.
  1. **예상 절감**(gzip): (2) 현실 탐침 기준
  2. **동작 위험**: 바뀌는 함수 몸, 비동기 관문이 생기는 화면 경로, 오프라인 실패 때의 결과
  3. **진행 중에 청크가 처음 필요해지는 경로**
     - 첫 화면 동기 경로(0절 3)에서 후보 모듈에 닿는 호출을 모두 적는다.
     - 각각 관문 뒤인지 앞인지 적는다.
     - 앞에 있는 것이 하나라도 있으면 그 후보는 ‘관문 고침 필요’로 표시한다.
  4. **첫 사용 비용**: (3)의 값

### 2.3 조합 탐침과 관문

- 절감/위험이 좋은 순서로 후보를 늘어놓는다. 위험 등급은 D < B ≈ C < A′다. 고른 조합(예: D, D+B, D+B+C, …)을 각각 한 빌드로 잰다.
- **관문**: 위험이 가장 작은 조합 가운데 3,000 B 이상 줄이는 것이 없으면 1회차 보고에 ‘멈춤’을 적는다.
- 1회차는 관문을 넘어도 **구현하지 않고 멈춰 보고한다.** 허브가 조합을 고른다.

## 3. 2회차(R1): 허브가 고른 조합 구현

R1 지시서 머리에 허브가 고른 조합과 그 근거를 적는다. 아래는 후보별 공통 규칙이다.

1. **D**: 함수를 옮기기만 한다(몸 diff 0, AST 대조).
   - 원래 파일에서 재수출하지 않는다. 재수출하면 다시 첫 화면에 들어온다.
   - 시험·`tools/rules3_golden_entry.ts`·sim(`operations-policy.ts`)의 import 경로를 새 파일로 바꾼다.
2. **A′·B·C**: TASK-0073 3.1~3.4(허브 개정 1)의 장치를 쓴다.
   - 등록 표, 미등록 예외, 작업자 스레드 포함 진입 모듈 평가 시 등록
   - `loadText`에서 `scenarioId`를 엿보고 관문을 기다린 뒤 `loadSaveText`를 부르는 순서
   - `OperationsNotRegisteredError`를 `errorKo`로 바꾸지 않음
3. **A′**의 함수 쪼개기
   - 비운영 머리는 지금 함수 앞부분의 비운영 반환을 그대로 옮긴다. 예: `operationsProblems`의 ‘설정·상태 operations 유무 불일치’ 검사(`operations-invariants.ts:11`)는 머리에 남는다.
   - 운영 몸은 등록 표로 부른다.
   - 머리와 몸을 합친 결과가 원래 함수와 같음을 날마다 상태 대조 시험으로 보인다. 대상은 rules-1~4 시나리오, 시드 2001~2003이다.
4. **C**: `SCENARIO_TITLES`는 `scenarios.json`의 `title_ko`만 읽는 가벼운 함수로 바꾼다. BASE_HTML 세 sha가 그대로여야 한다.

## 4. 완료 조건(R1)

1. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다.
2. `node src/engine/sim/run.mjs run`(시드 1001~1020)의 출력이 BASE와 `cmp` 동일해야 한다.
3. 판본 2 SHA256SUMS 다섯 개 재현(TASK-0071 9절 1 명령, 출력 `/tmp/T76-*`, 작업자 여러 명).
4. `npx vitest run` 전체 통과. `code-split.test.ts`의 `BASE_HTML` 세 sha는 그대로다.
5. 첫 화면 gzip이 1회차에서 고른 조합의 현실 탐침 값 ±64 B 안이고, BASE보다 3,000 B 이상 작다.
6. 청크 그래프 검사: 고른 후보의 모듈이 `main.ts` 정적 닫힘(TASK-0075 4.1-10 (가) 방식)과 첫 화면 청크에 없다.
7. A′·B·C를 골랐으면 미등록 예외 시험, 지연 실패·재시도 시험(TASK-0073 3.5), 화면 진입 순서 시험이 통과한다.
8. `npm run typecheck`, `npm run build`, `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py`, `python3 tools/test_validate_data.py` 통과
9. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`(18종)
10. 디스크: 모든 출력은 `/tmp/T76-*`. 여유가 2 GB보다 작으면 그것만 지우고, 그래도 모자라면 멈춘다. 끝에 `ls -d /tmp/T76-*`가 비어야 한다.

## 5. 변형 시험(R1, 고른 후보에 맞춰)

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | D 대상 함수를 원래 파일에서 재수출한다 | 4-6 청크 그래프 |
| V2 | `main.ts`가 지연 모듈을 값으로 import한다 | 4-6 |
| V3 | `loadText`가 관문 전에 `loadSaveText`를 부른다(B·A′) | 화면 진입 순서 시험 |
| V4 | 진입 모듈이 등록을 빠뜨린다 | 미등록 예외·운영 시나리오 시험 |
| V5 | 작업자 스레드 진입에서 등록이 빠진다 | 4-3(작업자 여러 명) |
| V6 | A′ 머리가 비운영 반환 하나를 빠뜨린다 | 3-3 상태 대조 |
| V7 | C에서 제목 계산이 운영 자료를 동기로 읽는다 | 4-6, 첫 화면 gzip |

## 6. 결과 보고

- 1회차: `docs/ai/tasks/results/TASK-0076.md`
  - BASE
  - 2.1 grep 전문과 판단
  - 후보별 탐침 표(상한·현실·첫 사용 비용, 위험, 진행 중 경로)
  - 조합 탐침
  - 관문 판정
- R1: 같은 파일에 ‘R1’ 절을 더한다. 고른 조합, 옮김 표, 등록 진입점, 변형 결과, 4절 각 줄을 적는다.

## 7. 멈춤 조건

- 1회차 끝(항상).
- 2.3 관문에 걸릴 때.
- R1에서 함수 몸, 문구, 화면 HTML, 저장 바이트를 바꿔야만 분리가 될 때. 단 A′의 머리/몸 쪼개기는 허용하되, 3-3 대조가 증명해야 한다.
- 4절 1~5가 어긋날 때.

## 허브에 묻는 것

- **Q1. 두 번 실행(1회차 조사 → 허브 선택 → R1 구현)으로 할지.**
  - 허브 요청은 ‘구현은 절감 대비 위험이 가장 좋은 것부터, 합계 3,000 B 미만이면 멈춤’이었다.
  - 초안은 이를 두 번으로 나눴다. 까닭은 셋이다.
    1. 후보마다 필요한 장치가 크게 다르다. D는 순수 이동, A′·B·C는 0073 등록 장치다. 한 지시서에 넷의 구현 규칙을 다 쓰면 0074·0075처럼 범위 충돌로 멈출 여지가 크다.
    2. 0073에서 보았듯이 현실 탐침 값은 상한과 크게 다르다(6,679 → 3,406 B). 조합을 수치를 보고 고르는 편이 낫다.
    3. 등록 장치는 한 번 넣으면 A′·B·C가 함께 쓰므로, 고르는 순간 비용 구조가 바뀐다.
  - 한 번에 하길 원하시면 ‘D는 늘 구현, A′·B·C는 관문을 넘는 것 가운데 위험이 가장 작은 하나만’으로 좁히기를 권한다.
- **Q2. 3,000 B 관문의 기준이 ‘여유 회복’인지 ‘다음 기능 예산 확보’인지.**
  - 여유 5,276 B + 3,000 B ≈ 8.3 KB가 된다. 이것이 경로 6·7 기능 지시서 몇 개분인지(엔진 지시서당 약 1.3 KB + 첫 사용 비용) 허브가 정해 주면, 관문을 그 기준으로 적겠다.
