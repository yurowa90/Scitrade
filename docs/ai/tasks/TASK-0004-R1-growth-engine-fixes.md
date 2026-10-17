# TASK-0004 재작업 1 — 검수 반려 사항 + 화면 작업 준비용 엔진 읽기 함수

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: TASK-0004 (현재 브랜치 `codex/TASK-0004`의 커밋)
- 결정 근거:
  - Claude 검수: 6개 관점 리뷰와 비판 검토에서 나온 지적 중, 검증자 3명 가운데 2명 이상이 유지한 16건.
  - 다음 화면 작업(TASK-0005)의 범위 조사.

## 목표

TASK-0004 구현은 완료 조건을 충족했다. blocker·major는 없다.
1. 검수에서 유지된 minor·nit을 고친다(A절).
2. 다음 화면 작업이 엔진 파일을 고치지 않아도 되도록, 화면이 쓸 **읽기 전용** 엔진 함수를 만든다(B절).

**경제 규칙과 기존 기대값은 바꾸지 않는다.** 예외는 A-8과 B-1이 명시한 로그·거절 문구 하나뿐이다.

## 먼저 읽을 파일

- `docs/ai/tasks/TASK-0004-xp-level-training-engine.md`(원래 지시서), `docs/ai/tasks/results/TASK-0004.md`(지난 보고서).
- `src/engine/engine.ts`(`employeeUnavailable`, `assignTaskObject`, `startTraining`, `progressTasks`), `src/engine/growth.ts`, `src/engine/save.ts`, `src/engine/invariants.ts`, `src/engine/m2a-growth.test.ts`, `src/engine/m2a-recruit.test.ts`(`unchangedExceptCommand`), `src/content/scenario.ts`, `tools/validate_data.py`의 성장 검사.

## A. 검수 반려 사항

1. **[minor] 거절된 `START_TRAINING`만 `processedCommands`에 기록되지 않는다** (`engine.ts` 215행 부근).
   - 문제: 다른 모든 명령은 거절도 기록되어, 같은 ID를 다시 보내면 DUPLICATE다. 훈련만 거절이 기록되지 않아 나중에 같은 ID가 적용되고 훈련비가 빠진다.
   - TASK-0001-R1이 정한 규칙은 다음과 같다(`results/TASK-0001.md` 117행): 거절은 `processedCommands`에만 남기고, 상태 보존 비교에서는 그 기록을 뺀다.
   - 고칠 것:
     - 특례를 지운다.
     - 거절 테스트(`m2a-growth.test.ts` 204·218·227·236·250행 부근)는 `unchangedExceptCommand` 방식으로 비교한다.
     - 거절된 훈련 ID를 다음 날 다시 보내면 DUPLICATE이고 훈련비가 빠지지 않는다는 테스트를 더한다.
2. **[minor] 검사기가 `task_completion_xp > 0`을 확인하지 않는다** (`tools/validate_data.py` 558~560행 부근).
   - 0이면 엔진이 첫 업무 완료 때 예외를 낸다.
   - 고칠 것:
     - 양의 정수 검사에 넣는다.
     - `level_max == len(xp_thresholds)`도 검사한다.
     - 하드코딩된 `range(1, 11)`을 `range(level_min, level_max + 1)`로 바꾼다.
     - 키가 없으면 예외 대신 `check(...)` 실패로 보고한다.
     - 자료 사본으로 변형 시험을 한다(0, 음수, 키 없음).
3. **[minor] 판본 3→4 기본 경로 테스트가 `startXp` 출처 오류를 잡지 못하고, 이관 방어 두 곳에 테스트가 없다** (`m2a-growth.test.ts` 313행 부근).
   - 시작 경험치가 0이 아닌 직원 정의(설정 사본)로 이관한다. 그 값이 그대로 들어가는지 확인한다. 출처를 바꾸는 변형을 넣으면 실패해야 한다.
   - 시나리오가 다른 설정으로 이관하면 SaveError다(`/이관 설정과 저장 시나리오가 다릅니다/`).
   - 정의가 없는 직원 ID가 든 판본 3 저장이면 SaveError다.
4. **[minor] 새 불변 조건 두 개를 시험하지 않는다** (`invariants.ts` 119·129행).
   - 훈련 업무 없는 `TRAINING_EXPENSE` 항목을 넣으면 `/훈련 업무 없는 훈련비/`가 나야 한다.
   - 업무 종류와 다른 보상 종류 키를 넣으면 `/보상 종류가 다릅니다/`가 나야 한다.
5. **[nit] 테스트 7이 ‘경험치만 바뀐다’를 다 확인하지 않는다** (270행 부근).
   - 성장 필드(`employees[].xp`, `xpAwards`, `xpAwardAmounts`)를 비운다.
   - 레벨 달성 로그 줄은 뺀다.
   - 그다음 **상태 전체**를 성장 끈 실행과 비교한다.
6. **[nit] 레벨 달성 로그가 원인인 완료 로그보다 먼저 나온다** (`progressTasks`).
   - 완료 로그를 먼저 쓰고, 그 뒤에 보상을 준다.
   - 순서를 확인하는 테스트를 더한다.
7. **[nit] CHAR-ACC-08 연결 테스트가 `commitDay`에서 훈련을 실제로 적용하지 않는다** (149행 부근).
   - `commitDay(openDay(createGame(cfg), cfg).state, cfg, [training()])` 경로를 더한다.
   - 이 경로에서 훈련비 20,000 / 급여 10,000 / 현금 470,000 / 경험치 60을 확인한다.
   - 기존 `planState` → 다시 불러오기 → 재전송 부분은 중복·저장 확인용으로 남긴다.
8. **[nit] 훈련 시작 로그·바쁜 직원 거절 문구에 직원 ID가 보이고 훈련비가 없다** (`engine.ts` 477·501행 부근).
   - B-1의 `taskSubjectKo`로 고친다.
   - 훈련 배정 로그 예: ‘귀솔 일반 훈련 시작 (1일, 훈련비 ₩50,000)’.
   - ‘1 일’처럼 띄우지 않는다.
9. **[nit] 알 수 없는 `scenarioId`의 옛 저장이 SaveError가 아닌 일반 Error를 낸다** (`save.ts` 102행).
   - `SCENARIO_IDS`로 확인하거나 감싸서 SaveError로 바꾼다.
   - 테스트를 더한다.
10. **[nit] `awardXp`의 방어 세 가지(담당자 불일치, 미고용, 지급량 불일치)에 단위 테스트가 없다** (`growth.ts` 33행 부근).
    - 각각 `false`이고 상태가 그대로인지 확인한다.
11. **[nit] CHAR-ACC-02 능력치 확인이 명세 값을 하드코딩하고 순수 함수를 세 번 부른다** (116행 부근).
    - `tests/character_acceptance_cases.json`의 `expected.primary_ability`·`secondary_ability`와 한 번 비교한다.
12. **[nit] 다음 날 배정 확인이 열지 않은 날에 `planState`를 부른다** (178행 부근).
    - `planState(openDay(tomorrow, config).state, ...)`로 바꾼다.
13. **[nit] 소급 보상 없음 확인이 판본 1에서는 의미가 없다** (309행 부근). 성장이 꺼진 M1로 복원하기 때문이다.
    - 판본 1은 필드 복원만 확인한다. 또는 성장이 켜진 시나리오로 이어서 의미 있게 만든다. 어느 쪽인지 보고서에 적는다.
14. **[nit] 엔진이 쓰지 않는 자료 필드가 권위 있어 보인다.**
    - 검사기에서 다음을 확인한다:
      - `characters.json`의 각 `level`이 `xp_total`에서 계산한 레벨과 같은지.
      - `ordinary_training.occupies_employee_reservation`이 `true`인지.
      - `salary_included_in_fee`가 `false`인지.
    - 엔진이 하드코딩한 의미와 자료가 어긋나면 검사가 실패해야 한다.
15. **[nit] 훈련 위치 거절이 ‘부산’을 하드코딩한다** (`engine.ts` 511행). `cityName(config, config.homeCityId)`를 쓴다.

## B. 화면 작업 준비: 엔진 읽기 함수

다음 화면 작업(TASK-0005)은 엔진 파일을 고치지 않는다. 그래서 화면이 쓸 함수를 지금 만든다.
- 모두 **상태를 바꾸지 않는 순수 함수**다. 입력 상태를 바꾸지 않는다는 테스트를 함께 둔다.
- 화면이 자금·바쁨을 다시 계산하지 않도록 엔진 판정을 그대로 돌려준다.

1. **`taskSubjectKo(config, task): string | null`** (엔진 모듈, 예: `src/engine/tasks.ts`)
   - 반환값:
     - `SCOUT` → 장소 이름.
     - `RECRUIT_QUEST` → 후보 이름.
     - `TRAINING` → `null`. 문장 주어가 이미 그 직원이다.
     - 준비 업무 → 계약 번호(`CT001` 등). 계약 번호는 플레이어에게 보이는 값이다.
   - 장소 이름은 `data/venues.json`의 제목에서 온다. `src/content/scenario.ts`가 `recruitment.scoutSites`에 `titleKo`를 넣고, `src/engine/types.ts`의 타입을 넓힌다.
   - 쓰는 곳:
     - `employeeUnavailable`의 바쁨 문구.
     - `assignTaskObject` 로그.
     - 현장 조사 완료 로그.
       - 지금 문구: ‘물보리: VEN_PORT 현장 조사 완료’.
       - 바꿀 문구: ‘물보리: 항만 물류단지 현장 조사 완료’.
     - 훈련 문구(A-8).
   - **기대 문자열 변경 허용:** 이 문구 변경 때문에 기존 테스트의 기대 문자열이 바뀌는 경우만 허용한다. 바꾼 테스트와 줄을 보고서에 모두 적는다. 금액·날짜·상태 기대값은 바꾸지 않는다.
2. **`levelProgress(state, config, employeeId)`** → `{ level, xp, levelFloorXp, nextLevelXp | null, xpToNext | null, stats | null }`.
   - 최대 레벨이면 `nextLevelXp`·`xpToNext`가 `null`이다.
   - `stats`는 `statsFor`와 같다.
3. **`trainingPreview(state, config, employeeId)`** → `{ allowed, reasonKo | null, fee: { currency, minor }, durationDays, xpGain, levelAfter, statsAfter, availableBeforeMinor, availableAfterMinor }`.
   - 허용 여부와 이유는 `START_TRAINING` 처리와 **같은 검사 경로**로 구한다(사본 상태로 계획해 보기). 화면이 따로 판단하지 않게 하기 위해서다.
   - 성장이 꺼진 시나리오에서는 `allowed: false`이고 이유는 기존 문구다.
4. **`payrollRunwayDay(state, config, extraOutlayMinor = 0)`** → `number | null`.
   - **표시 전용**이다. 자금 규칙(DECISIONS: 급여는 예약하지 않음)은 바꾸지 않는다.
   - 계산:
     - 급여 통화의 사용 가능액에서 `extraOutlayMinor`를 뺀다. 사용 가능액은 현금 − 미지급 의무다.
     - 오늘부터 하루씩 그날 근무하는 직원(`availableFromDay` 이후)의 일급 합을 뺀다.
     - 끝까지 지급할 수 있는 마지막 날을 돌려준다.
   - 오늘 급여가 아직 지급되지 않은 상태(AWAITING_INPUT)면 오늘을 포함한다.
   - 캠페인 마지막 날까지 모자라지 않으면 `null`이다.
   - M2 기본 상태에서 손으로 검산한 값을 테스트에 쓴다(일급 합, 시작 원화).
5. **불러오기 검증:** `deserializeSave`가 판본 4 파일과 이관 결과에 모양 검사와 `checkInvariants`를 실행한다.
   - 실패하면 SaveError다. 예: `xpAwardAmounts`가 없는 판본 4 저장, `xp`가 보상 합과 다른 저장.
   - 지금은 이런 저장이 불러와지고, 하루 진행에서 TypeError가 난다.
   - 설정은 판본과 관계없이 `expected.config`를 쓴다. 없으면 A-9의 검사를 거쳐 저장 시나리오를 불러온다.

## 범위

**포함:** `src/engine/**`, `src/content/scenario.ts`, `tools/validate_data.py`, 엔진 테스트.

**제외:**
- `src/ui/**`. 화면 연결은 TASK-0005가 한다. 다른 작업(TASK-0007)이 `src/ui`를 고치고 있어 충돌을 피하기 위해서다.
- `data/**`의 값.
- `docs/STATUS.md`·`docs/DECISIONS.md`·`docs/ai/tasks/README.md`.
- 레벨이 처리량에 영향을 주는 규칙(M2b로 미룸).

## 결과 보고

새 파일을 만들지 말고, `docs/ai/tasks/results/TASK-0004.md` 끝에 `## 재작업 1` 절을 덧붙인다. 형식은 머리말과 같다.

## 완료 조건

1. A-1~15와 B-1~5가 모두 반영되었다.
2. 다음 변형을 직접 넣어 테스트가 실패하는 것을 확인하고, 확인 사실을 보고서에 적는다. 확인한 뒤에는 원래 코드로 되돌린다.
   - A-1: 특례를 되살린다.
   - A-3: `startXp` 출처를 0으로 바꾼다.
   - A-4: 두 불변 조건을 지운다.
   - B-3: `trainingPreview`가 자금 검사를 건너뛰게 한다.
3. 금액·날짜·상태에 관한 기존 기대값을 바꾸지 않았다. 바꾼 문구 기대값은 B-1의 허용 범위 안이다.
4. 머리말의 검증 다섯 개가 통과한다.
