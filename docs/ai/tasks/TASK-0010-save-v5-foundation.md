# TASK-0010 M2a-4 기반: 저장 판본 5, 숨어 있던 분기를 오류로 드러내기 (동작 불변)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 사용성 시험 빌드 `f260a7c`(TASK-0005·0009 반영). 이 작업은 그 위의 개발 브랜치 커밋에서 시작한다.
- 결정 근거: `docs/DECISIONS.md` ‘M2a-4 도시 방문·문화 활동 — 2026-10-06’(작업 순서·기본값).

## 목표

M2a-4(부산 현지 활동)를 넣기 전에 기반을 정리한다. **게임 동작·문구·기대값은 바뀌지 않아야 한다.**

1. 저장 형식을 판본 5로 올린다. 새 상태 칸 `GameState.culture`(현지 활동 기록 3종)를 만들되, 이번에는 늘 비어 있다.
   - **사용성 시험 빌드의 판본 4 저장이 경험치·지급 기록·진행 중 업무를 그대로 둔 채 열려야 한다.**
2. 새 업무 종류가 들어올 때 **컴파일은 되는데 조용히 잘못 동작하는 곳**을, 컴파일 오류나 실행 오류로 드러나게 바꾼다. 다음 작업(TASK-0011)이 `CULTURE` 업무를 더할 때 빠뜨린 곳이 바로 보이게 하려는 것이다.

### 함정 (반드시 읽을 것)

`src/engine/save.ts`:
- 89행은 허용 판본을 `[1, 2, 3, SAVE_FORMAT_VERSION]`로 고정한다. 상수만 5로 올리면 판본 4 저장이 거절된다.
- 110행은 `file.formatVersion < SAVE_FORMAT_VERSION ? migrateV3toV4(v3, config) : file.state`다.
  - 89행만 넓히고 이 줄을 그대로 두면, 판본 4 저장이 판본 3 → 4 이관(69~78행)을 다시 거친다.
  - 그러면 직원 경험치가 시작값으로 돌아가고 `xpAwards`·`xpAwardAmounts`가 지워진다.
  - 그 결과는 불변 조건(`invariants.ts` 118~124행, 경험치 = 시작값 + 지급 합계)을 **통과한다.** 즉 조용히 실패한다.

## 먼저 읽을 파일

- `src/engine/save.ts`, `src/engine/save-shape.ts`, `src/engine/invariants.ts`, `src/engine/types.ts`(`ScenarioConfig`, `Task`, `GameState`).
- `src/engine/engine.ts`: `createGame`(85~110행 부근), `taskLabel`·`employeeUnavailable`·`assignTaskObject`(461~507행), `startTraining`(509~535행), 고용(595~610행), `progressTasks`(790~825행).
- `src/engine/tasks.ts`, `src/engine/growth.ts`(`awardXp`·`awardTaskCompletion`), `src/engine/reservations.ts`(`fundsPosition`·`trainingAvailableMinor`).
- `src/ui/crew-status.ts`(`taskSchedule`·`crewStatusKo`).
- 시험: `src/engine/save-shape.test.ts`, `src/engine/save-integrity.test.ts`, `src/engine/m2a-growth.test.ts`(311~345행·443행·476행), `src/engine/m2a-recruit.test.ts`(321~327행), `src/engine/m2a-multi.test.ts`(266~274행).
- 자료(읽기만): `data/culture_activities.json`(CA01~03, 키 템플릿), `data/contacts.json`.

## 범위

**포함:**
- `src/engine/save.ts`, `save-shape.ts`, `invariants.ts`, `types.ts`, `engine.ts`, `tasks.ts`, `growth.ts`, `reservations.ts`.
- 시나리오 로더(`src/content/scenario.ts`)는 `culture: null`을 넣는 것만 바꾼다.
- `src/ui/crew-status.ts`는 아래 B-2·B-3만 바꾼다.
- 위 파일의 시험과 새 시험 파일. 시험 자료 파일 하나(A-6).

**제외:**
- `CULTURE` 업무 종류, `START_CULTURE_ACTIVITY` 명령, `CULTURE_EXPENSE` 계정, 활동 정의 로더, 활동 미리 보기. 모두 TASK-0011에서 한다.
- `data/**`, `schemas/**`, `tools/validate_data.py`.
- 화면 문구와 동작. `crew-status.ts` 말고는 `src/ui/**`를 바꾸지 않는다.
- 판본 올리기: 데이터 판본 0.4.1(`PACKAGE_STATUS.json`)과 규칙 판본 `M2a-rules-1`은 그대로 둔다. 올리면 사용성 시험 빌드의 저장이 모두 거절된다.
- 견적 수명, 계약 자금 예약, 처리량 규칙(`LEGACY_FIXED`), 경험치 규칙.

## 구현 지시

### A. 저장 판본 5

1. **판본:**
   - `SAVE_FORMAT_VERSION = 5`로 올리고, 판본 이력 주석에 ‘5: 현지 활동 기록(culture) 추가’를 더한다.
   - 허용 판본은 명시 목록 `[1, 2, 3, 4, SAVE_FORMAT_VERSION]`로 쓴다. 범위식(`>= 1 && <= 5`)으로 바꾸지 않는다. 판본을 올리는 일이 늘 의식적인 변경이 되게 하려는 것이다.
2. **이관 순서를 명시한다.** 판본마다 자기보다 낮은 판본에서만 이관을 거친다.
   ```ts
   const fv = file.formatVersion;
   const v2 = fv === 1 ? migrateV1toV2(file.state) : file.state;
   const v3 = fv <= 2 ? migrateV2toV3(v2) : v2;
   const v4 = fv <= 3 ? migrateV3toV4(v3, config) : v3;
   const state = fv <= 4 ? migrateV4toV5(v4) : v4;
   ```
3. **`migrateV4toV5(state)`:**
   - `structuredClone` 뒤 `culture`를 빈 칸 `{ reports: [], experiences: [], relationEvents: [] }`로 둔다. 다른 칸은 건드리지 않는다.
   - 판본 4 파일에 `culture` 칸이 있더라도 빈 칸으로 덮는다. 앞선 이관 함수들과 같은 방식이다.
4. **타입 (`types.ts`):**
   - `GameState.culture: CultureState`.
   - `CultureState = { reports: CultureReport[]; experiences: CultureExperience[]; relationEvents: CultureRelationEvent[] }`.
   - 기록 3종:
     - `CultureReport { key; activityId; topicId; cityId; sourceContactIds: string[]; reporterEmployeeId; taskId; day; contentRevision; status: 'UNVERIFIED' }`
     - `CultureExperience { key; employeeId; activityId; topicId; cityId; countryCode; contentRevision; taskId; day }`
       - `data/character_rules.json`의 경험 근거 필드(`evidence_fields`)와 같은 구성인지 확인한다. 다르면 맞추고 보고서에 적는다.
     - `CultureRelationEvent { key; employeeId; contactId; activityId; cityId; contentRevision; taskId; day; kind: 'SHARED_ACTIVITY' }`
   - 친밀도 점수·거래 신뢰 칸은 만들지 않는다. 거래 신뢰는 저장하지 않고 계약에서 계산한다(DECISIONS).
   - `ScenarioConfig.culture: CultureConfig | null`:
     - `CultureConfig = { companyId: string; activities: CultureActivityDef[]; contacts: CultureContactDef[] }`.
     - `CultureActivityDef = { id; titleKo; cityId; venueId; contactIds: string[]; durationDays; currency: Currency; costMinor; topic: { id; titleKo; contentRevision }; observationsKo: string[]; reportKo: { findingKo; scopeKo; notClaimedKo; openQuestionKo } | null; keyTemplates: { companyReport; actorExperience; relationship } }`.
     - `CultureContactDef = { id; nameKo; roleKo; informationScopeKo }`.
     - 필드 이름은 `data/culture_activities.json`·`data/contacts.json`에 맞춰 고칠 수 있다. 고쳤으면 보고서에 적는다.
   - **로더는 모든 시나리오에서 `culture: null`을 넣는다.** 활동을 읽어 들이는 일은 TASK-0011이 한다.
5. **모양 검사·생성·불변 조건:**
   - `createGame`은 빈 `culture`를 넣는다.
   - `save-shape.ts`에 `culture` 모양을 넣는다. 기록마다 모든 필드를 검사한다.
   - `SAVE_ENUMS`에 `cultureReportStatus: { UNVERIFIED }`와 `cultureRelationKind: { SHARED_ACTIVITY }`를 더한다. 기존처럼 `satisfies Record<…, true>`로 타입과 묶는다.
   - 불변 조건: `config.culture`가 `null`이면 `culture`의 세 배열이 모두 비어 있다. 지금은 모든 시나리오가 이 경우다.
6. **실제 판본 4 저장을 시험 자료로 남긴다.** 이것이 이 작업의 핵심 회귀 증거다. **코드를 바꾸기 전에** 먼저 한다.
   - 지금 엔진(`f260a7c`와 같은 판본 4 엔진)으로 M2(`SCENARIO_M2_MULTI_TRADE`)를 진행한다. 다음이 모두 들어간 상태를 만든다:
     - 시작값보다 큰 경험치. 일반 업무 완료와 일반 훈련 완료 보상을 둘 다 포함한다.
     - 진행 중(`RUNNING`) 업무.
     - 영입 후보 상태 변화.
     - 미지급 의무나 청구서 중 하나 이상.
   - 그 상태를 `serializeSave`로 저장한 파일을 `src/engine/fixtures/save-v4-m2.json`에 둔다.
   - 만든 과정(명령 목록·일수)을 보고서에 적는다. 같은 과정을 시험 안에서 다시 실행하는 생성 함수(`fixtures/make-save-v4.ts` 등)는 두지 않는다. 판본 5 엔진으로는 판본 4 파일을 다시 만들 수 없기 때문이다.
   - 파일 크기가 200KB를 넘으면 진행 일수를 줄인다.

### B. 숨어 있던 분기를 드러내기 (동작·문구 불변)

지금은 `Task['kind']`에 새 값을 더해도 아래 지점이 컴파일되고 조용히 잘못 동작한다. 모두 빠짐없는 분기(`switch` + `never` 검사)로 바꾼다. 그러면 새 종류를 더할 때 컴파일 오류가 나고, 형 변환으로 들어온 모르는 값은 실행 중에 오류를 던진다.

1. **`tasks.ts` `taskSubjectKo`** (9행 `default: return task.contractId`):
   - `EXPORT_PREP`·`FORWARDING_PREP`을 명시해 `task.contractId`를 돌려준다.
   - `default`에서는 `never` 검사를 한 뒤 예외를 던진다.
2. **진행 단위 `isDayBasedTask(kind)`를 `tasks.ts`에 둔다.** 지금은 `TRAINING`만 `true`다. 빠짐없는 분기로 쓴다.
   - `engine.ts` 795행 진행량(`task.kind === 'TRAINING' ? 1 : def.workUnitsPerDay`)이 이 함수를 쓴다.
   - `crew-status.ts` 9행 단위(`'일' : 'pt'`)도 이 함수를 쓴다.
   - 함수가 없으면 일 단위인 새 업무를 3pt 직원이 맡을 때 기간이 1/3로 줄어든다.
3. **`crew-status.ts` `crewStatusKo`** (33행): `TRAINING`이 아니면 모두 ‘● 업무 중’이다. 빠짐없는 분기로 바꾸되, 지금 종류의 결과 글자는 그대로 둔다.
4. **`engine.ts` `progressTasks`의 완료 분기** (799~820행):
   - 마지막 `else`(‘○○ 완료 → 출발 대기’)를 `EXPORT_PREP | FORWARDING_PREP` 분기로 명시한다.
   - 그 밖의 종류에는 `EngineError`를 던진다.
   - 지금은 모르는 종류가 화물 상태를 건드리고 ‘null … 완료 → 출발 대기’로 기록된다.
5. **`engine.ts` 배정 로그** (500~505행): 지금은 `TRAINING`이 아닌 모든 종류를 ‘업무 포인트’로 쓴다. 종류별 빠짐없는 분기로 바꾸되, 지금 문장은 한 글자도 바꾸지 않는다.
6. **완료 보상 종류를 한 곳에서 정한다.** `growth.ts`에 빠짐없는 분기 함수를 둔다. 예: `completionReward(kind, config) → { rewardKind, amount } | null`.
   - 이 함수를 쓰는 곳:
     - `awardTaskCompletion`(54~60행).
     - `awardXp`의 `TASK-DONE-` 검사(31~37행).
     - `invariants.ts` 151행의 보상 종류 비교.
   - 세 곳의 값은 지금과 같다: 훈련은 `TRAINING_XP`(60), 나머지 네 종류는 `TASK_COMPLETION_XP`(10).
   - 지금은 새 종류가 자동으로 10을 받는다. TASK-0011에서 현지 활동의 보상은 따로 정한다(직원·활동별 첫 완료 10, 새 보상 종류).
7. **자금 판단 함수를 하나로 모은다.** `reservations.ts`에 `cashLessUnpaidMinor(s, config, currency)`(현금 − 미지급 의무)를 둔다.
   - `trainingAvailableMinor`는 이 함수를 부른다. 이름과 `export`는 유지한다.
   - 고용(`engine.ts` 602~604행)의 직접 계산도 이 함수로 바꾼다. 거절 문구와 값은 같다.

## 테스트

새 파일 `src/engine/save-v5.test.ts`(이름은 바꿔도 된다)와 기존 파일에 더한다.

1. **판본 4 보존 (필수):**
   - A-6의 `save-v4-m2.json`을 불러오면 다음이 원래 저장의 상태와 깊은 비교(`toEqual`)로 같다:
     - `employees[].xp`, `xpAwards`, `xpAwardAmounts`, `tasks`(진행 중 업무 포함), `ledger`, `recruitment`, `processedCommands`.
     - 그리고 `culture` 칸을 뺀 상태 전체.
   - `culture`는 빈 칸이다.
   - 불러온 상태를 3일 더 진행한 결과가 오류 없이 나온다. 진행 중 업무가 끝날 때의 경험치 지급이 1회만 일어난다.
   - 같은 자료로 판본 숫자만 3으로 바꾸면 경험치가 시작값으로 돌아간다. 판본 3 이관이 실제로 하는 일을 대조군으로 확인하는 것이다.
2. **판본별 읽기:**
   - 판본 1~4를 모두 읽는다. 기존 `it.each([1, 2, 3])` 사례 옆에 판본 4 사례를 더한다(`save-integrity.test.ts` 32행, `m2a-growth.test.ts` 476행).
   - 판본 5는 저장 → 불러오기 왕복이 깊은 비교로 같다.
   - 판본 0·6·`"5"`(문자열)·`5.5`는 SaveError로 거절된다.
3. **손상된 culture:**
   - 판본 5 저장의 `culture`가 없거나, 배열이 아니거나, 기록 필드가 빠지면 SaveError로 거절된다. 오류 메시지에 경로가 담긴다(예: `state.culture.reports`).
   - 열거값이 틀려도 같다(`status: 'VERIFIED'`, `kind: 'FRIEND'`).
   - `config.culture`가 `null`인데 기록이 한 건이라도 있으면 SaveError로 거절된다(불변 조건).
4. **열거 목록:** `save-shape.test.ts`의 `EnumTypes`와 `targets`에 새 열거 2개를 더한다. `targets`는 기록 한 건을 넣은 상태로 경로를 가리켜야 한다.
5. **모르는 업무 종류:**
   - 형 변환으로 `kind: 'UNKNOWN'`인 진행 중 업무를 넣고 `commitDay`를 부르면 `EngineError`가 난다.
   - 넘긴 상태는 그대로다(엔진은 사본에서 작업한다).
   - ‘출발 대기’ 로그가 생기지 않는다.
   - `taskSubjectKo`·`isDayBasedTask`도 모르는 종류에 예외를 던진다.
6. **값 보존:**
   - `isDayBasedTask`는 다섯 종류 표로 확인한다.
   - `taskSubjectKo`는 다섯 종류의 결과가 바꾸기 전과 같다(표).
   - 배정 로그 다섯 종류의 문장이 바꾸기 전과 같다(문자열 단언).
   - `crewStatusKo`의 결과가 바꾸기 전과 같다.
   - `completionReward`는 다섯 종류의 종류·양이 바꾸기 전과 같다.
   - `cashLessUnpaidMinor`, `trainingAvailableMinor`, 고용 판정의 사용 가능 금액이 여러 상태에서 같다. 상태: M1 시작, M2 시작, M2 계약 수락 뒤(예약 있음), 미지급 의무가 있는 상태.
   - 고용 판정은 거절 문구의 금액으로 확인한다.
7. **기존 경로:** M1 세 경로와 M2 두 경로의 기대값이 그대로다. 기존 시험을 고치지 않고 통과한다.

### 기대값 변경 허용 목록

이 밖의 기존 기대값이 바뀌면 반려 사유다.
- `m2a-growth.test.ts` 330~331행, `m2a-recruit.test.ts` 326~327행, `m2a-multi.test.ts` 274행: 판본 4 → 5.
- `save-shape.test.ts`의 `EnumTypes`·`targets`: 새 열거 2개를 더하는 것.
- 상태 전체를 글자 그대로 비교하는 시험이 있어 `culture` 칸 때문에 실패하면, 그 칸을 더하는 것만 허용한다. 해당 시험을 보고서에 모두 적는다.

## 완료 조건

1. A·B가 반영되었고, 위 시험이 통과한다.
2. **변형 시험.** 다음을 하나씩 넣어 시험이 실패하는 것을 확인하고 보고서에 표로 적는다. 확인한 뒤에는 원래 코드로 되돌린다.
   1. 이관 줄을 옛 형태(`fv < SAVE_FORMAT_VERSION ? migrateV3toV4(…) : file.state`)로 되돌리고 허용 목록만 넓힘 → 판본 4 보존 시험이 실패해야 한다.
   2. `migrateV4toV5` 호출 제거 → 판본 4 읽기가 실패해야 한다.
   3. 허용 목록에서 4 제거 → 실패해야 한다.
   4. `progressTasks`의 완료 분기를 옛 `else`로 되돌림 → 모르는 종류 시험이 실패해야 한다.
   5. `isDayBasedTask`가 `EXPORT_PREP`에 `true` → 실패해야 한다.
   6. `completionReward`가 훈련에 `TASK_COMPLETION_XP` → 실패해야 한다.
   7. `cashLessUnpaidMinor`에서 계약 자금 예약까지 뺌 → 값 보존 시험이 실패해야 한다.
   8. `config.culture === null`일 때 기록을 허용 → 불변 조건 시험이 실패해야 한다.
3. 기대값 변경이 허용 목록 안에만 있다. `map-integration.test.ts`·`pixel.test.ts`의 단언을 약화하지 않았다.
4. 플레이어가 보는 문구와 로그가 바뀌지 않았다. 바뀐 곳이 있으면 이유와 함께 보고한다.
5. 머리말의 검증 다섯 개, `python3 tools/test_validate_data.py`, `python3 tools/art/test_pixel_tools.py`가 통과한다.

## 결과 보고

`docs/ai/tasks/results/TASK-0010.md`에 머리말 형식으로 쓴다. 다음을 반드시 넣는다.
- B-1~B-7 각 지점을 어떻게 바꿨는지(파일:줄).
- A-6 시험 자료를 만든 과정.
