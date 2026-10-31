# TASK-0001 동료 발견·영입 의뢰·고용 엔진 (M2a-2)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 없음
- 결정 근거:
  - `docs/DECISIONS.md` ‘앞으로의 계획과 사용자 결정 — 2026-10-05’ (결정 1~3)
  - `docs/RESEARCH_APPLICATION.md` ‘다음 단계 설계안: 동료 발견·면담·영입·고용’

## 목표

M2 시나리오(`SCENARIO_M2_MULTI_TRADE`)에서 후보 동료 4명(EMP03 솔솔밤, EMP04 현돌, EMP05 화랑콩, EMP06 바름)을 단계별로 영입한다. 단계는 현장 조사로 발견 → 영입 의뢰 → 면담 → 고용이다. 각 단계는 기존과 같은 예약 체계(직원 1명은 업무 1건)와 장부를 쓴다.

이 작업은 **엔진·데이터·검사기**만 다룬다. 영입 화면은 TASK-0002다. 다만 엔진이 바뀐 뒤에도 기존 화면이 후보를 고용 직원처럼 보여 주면 안 되므로, 기존 화면의 직원 목록 필터만 최소로 고친다.

## 먼저 읽을 파일

- `src/engine/types.ts`, `src/engine/engine.ts`: `assignTask`, `progressTasks`, `processPayroll`, `withPlan`, `planState`.
- `src/engine/reservations.ts`: `runningTaskOf`. `src/engine/progress.ts`, `src/engine/invariants.ts`, `src/engine/ledger.ts`, `src/engine/save.ts`.
- `src/content/scenario.ts`: 시나리오 로더, `employee_ids`, `engine_rules`.
- `data/scenarios.json`(`SCENARIO_M2_MULTI_TRADE`), `data/employees.json`(EMP03~06의 처리량·일급), `data/characters.json`(EMP03~06의 `recruitment.story_clue`, `encounter`), `data/venues.json`.
- `tools/validate_data.py`의 `check_m2a`, `tests/acceptance_cases.json`의 P0-M2A-01~03.
- 테스트 작성 방식: `src/engine/m2a-multi.test.ts`, `src/engine/research-ref.test.ts`, `src/engine/testkit.ts`.

## 범위

**포함:** 데이터·스키마·검사기, 엔진 상태·명령·하루 처리, 장부 계정 1개, 저장 형식 3과 판본 2→3 이관, 불변 조건, 엔진 테스트, 인수 명세 P0-M2A-04, 기존 화면의 직원 목록 필터.

**제외:**
- 영입 화면·도감 카드·면담 미리 보기(TASK-0002).
- 경험치·레벨·교육(M2a-3). 능력치·속성·고유 특성 계산.
- 출장·다른 도시 만남. 영입 거절·보류 명령(고용하지 않으면 그대로 남는다).
- 엔진 규칙 판본 변경. `M2a-rules-1`을 유지하고, 영입은 시나리오 데이터의 `recruitment` 블록이 있을 때만 켠다.

## 구현 지시

### 1. 데이터 (`data/scenarios.json`, 스키마, 검사기)

`SCENARIO_M2_MULTI_TRADE`에 아래 블록을 더한다. 값은 사용자가 확정한 DESIGN 값이다.

```json
"recruitment": {
  "data_basis": "DESIGN",
  "status": "USER_REVIEWED_2026-10-05",
  "decision_ref": "docs/DECISIONS.md 앞으로의 계획과 사용자 결정 — 2026-10-05",
  "candidate_employee_ids": ["EMP03", "EMP04", "EMP05", "EMP06"],
  "scout_work_units": 1,
  "quest_work_units": 3,
  "signing_fee_wage_days": 5,
  "scout_sites": [
    { "venue_id": "VEN_LOUNGE", "city_id": "BUSAN", "candidate_employee_ids": ["EMP03"] },
    { "venue_id": "VEN_PORT", "city_id": "BUSAN", "candidate_employee_ids": ["EMP04", "EMP06"] },
    { "venue_id": "VEN_TRADE", "city_id": "BUSAN", "candidate_employee_ids": ["EMP05"] }
  ]
}
```

- 조사 장소 배정 근거는 각 후보의 `story_clue`다.
  - 솔솔밤: 상인 휴게실 → 라운지.
  - 현돌: 창고 통로 → 항만 물류단지.
  - 바름: 항만 서류 보관실 → 항만 물류단지.
  - 화랑콩: 박람회 → 무역회관.
- `schemas/scenarios.schema.json`에 이 블록의 구조를 더한다(선택 항목).
- `tools/validate_data.py`에 검사를 더한다.
  - 후보 ID가 `employees.json`에 있다.
  - 후보는 `employment_status`가 `candidate`이고, 캐릭터의 `recruitment.start_employed`가 `false`다.
  - 후보는 시나리오의 `employee_ids`에 없다.
  - 후보마다 조사 장소가 정확히 하나다.
  - `venue_id`가 `venues.json`에 있다.
  - `city_id`가 후보의 `encounter.city_id`와 같다.
  - 작업량과 계약금 일수는 양의 정수다.

### 2. 설정과 상태 (`types.ts`, `scenario.ts`)

- `ScenarioConfig.employees`는 시나리오에 등장하는 모든 직원 정의(처음 직원 + 후보)를 담는다. 그래서 기존의 `config.employees.find(id)` 조회는 그대로 쓴다.
- **고용 여부의 원본은 상태 하나다.**
  - `EmployeeState.employmentStatus`는 `'employed' | 'candidate'`다.
  - `EmployeeState.availableFromDay: number`를 더한다. 처음 직원은 1이다.
- `ScenarioConfig.recruitment: RecruitmentDef | null`. 데이터에 블록이 없는 시나리오(M1 등)는 `null`이다.
- 상태에 `recruitment: { candidates: CandidateState[]; scoutedVenueIds: string[] }`를 더한다.
  - `CandidateState`의 필드: `employeeId`, `stage`, `discoveredDay`, `questTaskId`, `interviewReadyDay`, `hiredDay`.
  - `stage` 값: `'UNDISCOVERED' | 'DISCOVERED' | 'QUEST_RUNNING' | 'INTERVIEW_READY' | 'HIRED'`.
- `Task`를 넓힌다.
  - `kind`에 `'SCOUT' | 'RECRUIT_QUEST'`를 더한다.
  - `contractId`는 `string | null`이 된다.
  - `subjectId: string | null`을 더한다. 조사면 `venue_id`, 의뢰면 후보 직원 ID, 계약 업무면 `null`이다.
  - `task.contractId`를 쓰는 모든 곳에서 `null`을 처리한다.
- **고용 직원 판정은 한 함수로 모은다.** 예: `isEmployed(s, id)`, `employedDefs(s, config)`. 엔진·`progress.ts`·`reservations.ts`·화면이 모두 이 함수를 쓴다.

### 3. 명령 (`Command`에 추가)

```ts
| { id: string; type: 'SCOUT_SITE'; venueId: string; employeeId: string }
| { id: string; type: 'START_RECRUIT_QUEST'; candidateId: string; employeeId: string }
| { id: string; type: 'HIRE_CANDIDATE'; candidateId: string }
```

**`SCOUT_SITE`**
- 조사 업무(`scout_work_units`pt)를 만들고, 지정한 직원에게 바로 배정한다(RUNNING).
- 직원 가용성 검사는 `assignTask`와 같은 규칙을 쓴다.
  - 고용 중이어야 한다.
  - `availableFromDay ≤ 오늘`이어야 한다.
  - 같은 도시에 있어야 한다.
  - 진행 중인 업무가 없어야 한다.
- 거절하는 경우:
  - 영입이 없는 시나리오.
  - 없는 장소.
  - 이미 조사했거나 조사 중인 장소.
  - 조사 장소에 아직 발견하지 않은 후보가 없는 경우.

**`START_RECRUIT_QUEST`**
- 후보가 `DISCOVERED`일 때만 의뢰 업무(`quest_work_units`pt)를 만들어 배정한다. 후보 상태는 `QUEST_RUNNING`이 된다.

**`HIRE_CANDIDATE`**
- 후보가 `INTERVIEW_READY`일 때만 된다.
- 계약금은 `signing_fee_wage_days × 일급`이고, 일급의 통화(KRW)로 낸다.
- 지출 가능 금액은 그 통화의 현금에서 미지급 의무를 뺀 값이다. 모자라면 거절하고 미지급 의무를 만들지 않는다. 고용은 선택이기 때문이다.
- 장부: 새 비용 계정 `RECRUITMENT_EXPENSE`를 차변, 현금을 대변으로 한다. 기록 ID는 후보마다 한 번만 생기게 정한다(예: `SIGNING-EMP04`).
- 고용 확정: `employmentStatus = 'employed'`, `availableFromDay = 오늘 + 1`, `stage = 'HIRED'`, `hiredDay = 오늘`.

**공통**
- 세 명령 모두 기존처럼 명령 ID로 중복을 막는다.
- `planCommands`·`planState`의 같은 날 누적 검증에 그대로 들어간다.
- `withPlan`(일괄 확정)의 직원 계획도 새 가용성 규칙을 따른다.

### 4. 하루 처리 (`commitDay`)

- `progressTasks`에서 업무가 끝나면 종류별로 처리한다.
  - `EXPORT_PREP`, `FORWARDING_PREP`: 기존과 같다.
  - `SCOUT`: 그 장소의 `UNDISCOVERED` 후보를 `DISCOVERED`로 바꾸고 `discoveredDay`를 기록한다. 장소를 `scoutedVenueIds`에 넣는다.
  - `RECRUIT_QUEST`: 후보를 `INTERVIEW_READY`로 바꾼다.
  - 로그 문구를 남긴다(한국어).
- **발견과 의뢰 완료는 고용·급여·처리량을 만들지 않는다.**
- `processPayroll`은 `employed`이고 `오늘 ≥ availableFromDay`인 직원에게만 급여를 준다. 고용한 날에는 급여가 없고, 다음 날부터 준다.
- `assignTask`도 `availableFromDay`를 지킨다. 고용한 날에는 배정할 수 없다.

### 5. 장부·보고 (`ledger.ts`, `reports.ts`)

- `RECRUITMENT_EXPENSE`를 비용 계정으로 더한다.
- 원화 보고에서 급여와 영입 계약금을 구분해 보여 줄 수 있도록 요약 값에 따로 둔다. 기존 요약 필드의 값은 바꾸지 않는다.

### 6. 저장 (`save.ts`)

- `SAVE_FORMAT_VERSION = 3`으로 올린다.
- 판본 2 → 3 이관을 명시적인 함수로 둔다.
  - 직원 `availableFromDay = 1`.
  - 업무 `subjectId = null`.
  - `recruitment = { candidates: [], scoutedVenueIds: [] }`.
- 판본 1은 1 → 2 → 3으로 이관한다.
- 경제 값은 바꾸지 않는다.
- 이관된 저장(후보 상태 없음)에서 영입 명령을 보내면, 이유를 적어 거절한다(예: ‘이 저장에는 영입 후보 정보가 없습니다’).

### 7. 불변 조건 (`invariants.ts`)

- 후보(`candidate`)에게 진행 중인 업무가 없다.
- `HIRED`인 후보는 `employed`다. `employed`가 아닌 직원에게는 급여 기록이 없다.
- `availableFromDay` 이전 날짜의 급여 기록이 없다.
- 후보 한 명당 계약금 기록은 0개 또는 1개다.

### 8. 기존 화면의 최소 수정 (`src/ui/main.ts`, `src/ui/card.ts`)

- 동료 카드, 운영표, 준비 배정 버튼, 일괄 확정의 담당 선택, 자원 패널, ‘n명 고용 중’ 표시가 고용 직원만 보여 주게 한다.
- 이를 위해 `config.employees`를 직접 돌던 곳을 2절의 고용 직원 함수로 바꾼다.
- 새 화면 요소는 만들지 않는다.

## 테스트 (`src/engine/m2a-recruit.test.ts` 새 파일)

1. **발견 ≠ 고용**
   - 1일에 물보리(EMP02)가 `VEN_PORT`를 조사하면 2일에 현돌·바름이 `DISCOVERED`가 된다.
   - 고용 직원 수는 그대로 2명이다.
   - 원화 장부는 조사하지 않은 기준 경로와 같다.
   - 후보는 업무 배정·급여·운영 목록에 나타나지 않는다.
2. **조사가 직원 시간을 쓴다**
   - 조사 중인 직원에게 같은 날 준비 업무를 배정하면 거절된다.
   - 같은 장소를 다시 조사하면 거절된다.
3. **의뢰**
   - 발견 전에는 의뢰를 거절한다.
   - 귀솔(하루 2pt)이 3pt 의뢰를 맡으면 2일 뒤 `INTERVIEW_READY`가 된다.
   - 같은 후보에게 의뢰를 두 번 시작할 수 없다.
4. **고용**
   - 현돌 계약금은 110,000 × 5 = 550,000원이고 한 번만 빠진다.
   - 고용한 날에는 배정을 거절하고, 다음 날에는 배정된다.
   - 급여 기록은 다음 날부터 생긴다.
   - 고용 뒤 현돌(하루 3pt)이 준비 업무를 실제로 끝낸다.
5. **중복·재현**
   - 같은 고용 명령 ID를 다시 보내면 `DUPLICATE`가 된다.
   - 새 ID로 다시 고용하면 거절된다.
   - 영입 도중에 저장·불러오기를 해도 같은 장부와 같은 상태가 나온다.
6. **자금 부족:** 원화 시작 자금을 줄인 설정에서는 고용을 거절한다. 상태도 그대로다.
7. **기준 경로 유지:** 영입 명령을 쓰지 않은 M2 경로의 USD 결과(17일 현금 3,500 등)와 원화 급여가 이 작업 전과 같다.
8. **M1:** M1 시나리오에서는 영입 명령 세 개를 모두 거절한다.
9. **이관:** 판본 2 저장이 판본 3으로 이관되고 경제 값이 같다.
10. **불변 조건:** 모든 경로에서 불변 조건 검사를 통과한다.

### 인수 명세

`tests/acceptance_cases.json`에 `P0-M2A-04`(동료 영입: 발견·의뢰·고용 분리와 계약금·급여 시작일)를 더한다. 형식은 기존 P0-M2A-01~03을 따른다. 이 명세를 위 테스트에 연결한다.

검사기의 인수 명세 개수(17 → 18)와 `PACKAGE_STATUS`의 해당 개수도 맞춘다.

## 완료 조건

1. 발견만으로는 급여·고용 인원·업무 처리량이 생기지 않는다.
2. 조사·의뢰는 담당 직원의 업무 시간을 쓰며, 같은 직원의 다른 업무와 겹칠 수 없다.
3. 고용 명령을 다시 보내거나 저장·불러오기를 해도 고용과 계약금은 한 번만 반영된다.
4. 고용한 직원은 다음 날부터 배정·급여 대상이다. 기존 화면의 목록에도 그때부터 나타난다.
5. 기존 63개 테스트가 기대값을 바꾸지 않고 통과한다. M1·M2 검산 값이 그대로다.
6. 머리말의 검증 명령 다섯 개가 모두 통과한다. 결과 보고서가 `docs/ai/tasks/results/TASK-0001.md`에 있다.
