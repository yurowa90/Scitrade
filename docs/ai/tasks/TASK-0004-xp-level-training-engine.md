# TASK-0004 업무 경험치·레벨·일반 훈련 엔진 (M2a-3)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: TASK-0001·TASK-0002(영입). 작업 브랜치는 두 작업과 재작업이 합쳐진 상태에서 시작한다.
- 결정 근거:
  - `docs/IMPLEMENTATION_PLAN.md` M2a 진행 순서 3번.
  - `data/character_rules.json`(DESIGN).
  - `tests/character_acceptance_cases.json`의 CHAR-ACC-01·02·08.
  - `docs/ai/WORKFLOW.md`(v0.4 캐릭터 규칙: 경험치는 직원별 사건 ID로 한 번만, 최종 능력은 원값·레벨로 재계산).

## 목표

직원이 업무를 마치면 경험치를 받고, 레벨이 오르면 능력치가 오른다. 회사는 원화를 내고 직원에게 하루짜리 일반 훈련을 시킬 수 있다. 훈련은 그 직원의 업무 시간 한 칸을 차지한다.

**이번 단계에서 능력치·레벨은 업무 처리 속도·가격·운송에 영향을 주지 않는다.** 처리량은 기존처럼 직원의 `workUnitsPerDay`다. 처리량 반영(`performance`의 `CHARACTER_WEIGHTED`)은 M2b에서 새 규칙 판본으로 다룬다(Claude 결정, 기존 검산 값 보존).

## 먼저 읽을 파일

- `data/character_rules.json`:
  - `xp_thresholds`, `level_gain`, `final_stat_cap`, `task_completion_xp`.
  - `ordinary_training`, `reward_idempotency_key`.
  - `performance.mode_switch`(이번에는 구현하지 않음).
- `data/characters.json`: 직원별 `stats`, `growth_focus.primary_stat/secondary_stat`, `level`, `xp_total`.
- `tests/character_acceptance_cases.json`: CHAR-ACC-01, 02, 08.
- `src/engine/engine.ts`: `progressTasks`, `assignTask`·`assignTaskObject`, `employeeUnavailable`, `hireCandidate`, `processPayroll`, `cancelContract`.
- `src/engine/employees.ts`, `src/engine/types.ts`, `src/engine/save.ts`, `src/engine/invariants.ts`, `src/engine/ledger.ts`, `src/engine/reports.ts`, `src/content/scenario.ts`.
- 테스트 작성 방식: `src/engine/m2a-recruit.test.ts`.

## 범위

**포함:**
- 직원 정의에 성장 정보 추가.
- 상태에 누적 경험치와 보상 기록 추가.
- 업무 완료 경험치, 레벨·능력치 재계산 함수.
- 일반 훈련 명령과 훈련 업무, 훈련비 장부 계정.
- 저장 형식 4와 판본 3→4 이관, 불변 조건, 엔진 테스트.
- CHAR-ACC-01·02·08의 실행 연결.
- 기존 화면이 깨지지 않게 하는 최소 수정.

**제외:**
- 강화(+1~+3), 시너지, 조직(M2b).
- 능력치의 처리량 반영.
- 훈련 화면·경험치 표시(TASK-0005).
- 다른 도시 훈련.
- 엔진 규칙 판본 변경(`M2a-rules-1` 유지). 경험치·훈련은 시나리오 데이터로 켠다.

## 구현 지시

### 1. 데이터
- `SCENARIO_M2_MULTI_TRADE`에 `"growth": { "enabled": true }`를 둔다. 수치는 `character_rules.json`에서 읽는다(시나리오에 복사하지 않음).
- M1 시나리오에는 이 블록이 없다. M1에서는 경험치·훈련이 꺼진다.
- 검사기에 아래 항목을 더한다.
  - 문턱표가 `50*(level-1)*level`과 맞는다.
  - 직원마다 `growth_focus`의 두 능력이 `stats`에 있다.
  - 훈련 기간·비용·경험치가 양의 정수다.

### 2. 설정과 상태
- `EmployeeDef`에 `growth`를 더한다.
  - 필드: `baseStats`(캐릭터 `stats`), `primaryStat`, `secondaryStat`, `startXp`(캐릭터 `xp_total`).
  - 성장이 꺼진 시나리오에서는 `null`이다.
- `EmployeeState`에 `xp: number`(누적)를 더한다.
- **레벨과 능력치는 저장하지 않고 매번 계산한다.** 이렇게 해야 재계산이나 저장·불러오기로 보너스가 두 번 더해지지 않는다(CHAR-ACC-02).
  - `levelFor(xp)`: 문턱표에서 구하고, 최대 10이다.
  - `statsFor(def, xp)`: 원값에 (레벨−1)×증가량을 더하고, 능력마다 상한 100이다.
- 상태에 `xpAwards: Record<string, true>`를 더한다.
  - 키 형식: `employeeId|completionEventId|rewardKind`.
  - 같은 키는 다시 지급하지 않는다(CHAR-ACC-01).

### 3. 경험치 지급
- 업무가 `DONE`이 되는 순간 그 업무를 맡은 직원에게 `task_completion_xp`(10)를 준다.
  - 대상 업무: `EXPORT_PREP`, `FORWARDING_PREP`, `SCOUT`, `RECRUIT_QUEST`, 그리고 아래 훈련.
  - 완료 사건 ID: `TASK-DONE-<업무 ID>`.
  - 보상 종류: `TASK_COMPLETION_XP`.
- 훈련 완료는 `ordinary_training.xp_on_completion`(60)만 준다. 보상 종류는 `TRAINING_XP`이고, 일반 완료 경험치 10은 더하지 않는다.
- 취소·중단(`ABORTED`)·미완료 업무에는 주지 않는다.
- 레벨이 오르면 로그에 남긴다(예: ‘귀솔 레벨 2 달성’).

### 4. 일반 훈련
- 명령: `{ id; type: 'START_TRAINING'; employeeId }`.
- 고용 중이고 오늘 근무 가능한 직원이어야 한다. 기존 `employeeUnavailable` 검사를 그대로 쓴다.
- 장소는 직원이 있는 도시(부산)다.
- 업무 종류는 `TRAINING`이다.
  - 업무 포인트가 아니라 **일수**로 진행한다. 하루 마감마다 1씩 진행하고, `duration_days`(1)에 이르면 끝난다.
  - 업무 ID: `TRAINING-<직원>-D<시작일>`.
- 훈련비(`ordinary_training.fee`, 원화 50,000):
  - 시작할 때 낸다.
  - 장부는 새 비용 계정 `TRAINING_EXPENSE` 차변, 현금 대변이다.
  - 자금 기준은 영입 계약금과 같다(현금 − 미지급 의무). 모자라면 거절하고 상태를 바꾸지 않는다.
- 훈련 중에는 그 직원에게 다른 업무를 줄 수 없다(기존 업무 1건 규칙).
- **급여는 평소대로 한 번만 나간다. 훈련 급여를 따로 만들지 않는다**(CHAR-ACC-08).
- 거절된 명령은 상태를 전혀 바꾸지 않는다. TASK-0001-R1의 `assignTaskObject` 방식을 따른다.

### 5. 보고·저장·불변 조건
- 원화 보고에 `trainingExpense`를 따로 둔다. 기존 요약 필드의 값은 바꾸지 않는다.
- `SAVE_FORMAT_VERSION = 4`로 올리고, 판본 3→4 이관 함수를 둔다.
  - 이관 내용: 직원 `xp = 정의의 startXp`, `xpAwards = {}`.
  - 판본 1·2는 연쇄 이관한다.
- 불변 조건에 다음을 더한다.
  - 직원의 `xp`가 시작 경험치와 `xpAwards` 지급 합계에서 나온 값과 같다(지급 기록에 금액을 함께 저장하거나 로그로 대조).
  - 훈련비 기록은 훈련 업무마다 0개 또는 1개다.
  - `ABORTED` 업무에는 경험치 기록이 없다.

### 6. 기존 화면
- 카드의 ‘레벨’ 표시가 상태에서 계산한 레벨을 쓰게 한다. 지금은 캐릭터 데이터의 고정값이다.
- 그 밖의 새 화면 요소는 TASK-0005에서 만든다.

## 테스트 (`src/engine/m2a-growth.test.ts` 새 파일)

1. **CHAR-ACC-01 대응:**
   - 두 직원이 각각 업무를 마치면 각자 10씩 받는다.
   - 같은 완료 사건의 지급을 다시 시도하거나 저장·불러오기를 해도 늘지 않는다.
   - 취소한 계약의 준비 업무는 경험치가 0이다.
2. **CHAR-ACC-02 대응:**
   - 설정 사본을 쓴다: 원값 50/40, 시작 경험치 90.
   - 한 번에 230을 주면 누적 320, 레벨 3, 능력 54/42가 되고, 문턱 두 개를 넘는다.
   - 재계산이나 저장·불러오기로 값이 바뀌지 않는다.
3. **CHAR-ACC-08 대응:**
   - 설정 사본을 쓴다: 훈련비 20,000, 일급 10,000, 시작 원화 500,000.
   - 하루 훈련 결과: 훈련비 20,000, 급여 10,000, 총 30,000 지출, 끝 현금 470,000, 경험치 60, 레벨 1.
   - 같은 명령을 다시 보내도 중복되지 않는다.
4. **훈련과 다른 업무의 관계:**
   - 훈련 중인 직원에게 준비 업무를 배정하면 거절된다.
   - 다음 날에는 배정된다.
5. **자금 부족:** 훈련을 거절하고 상태가 그대로다.
6. **M1:** 훈련 명령을 거절하고 경험치를 주지 않는다. 기존 M1 검산 값이 그대로다.
7. **기준 경로 유지:**
   - M2 기존 경로(영입·훈련 없음)의 USD 결과(17일 현금 3,500)와 원화 급여가 같다.
   - 경험치만 늘어난다(예: 귀솔·물보리가 각자 준비 업무 완료분만큼).
8. **이관:** 판본 3 저장이 판본 4로 이관된다. 판본 3에 없던 필드를 실제로 지운 형태로 시험한다.
9. **불변 조건:** 모든 경로가 통과한다. 일부러 깨뜨린 상태(경험치 불일치)는 감지된다.

인수 명세 CHAR-ACC-01·02·08의 `status`를 실행 연결 상태로 바꾸고 테스트 이름에 ID를 적는다. 상태 값은 기존 핵심 명세의 연결 방식을 따른다. 검사기의 관련 개수도 맞춘다.

## 완료 조건

1. 경험치는 직원·완료 사건·보상 종류마다 한 번만 지급된다. 재전송·저장·불러오기·재계산으로 늘지 않는다.
2. 레벨과 능력치는 누적 경험치에서 매번 같은 값으로 계산된다. 상한 100을 넘지 않는다.
3. 훈련은 직원의 업무 한 칸을 차지하고, 훈련비는 한 번 나가고, 급여는 이중으로 나가지 않는다.
4. 기존 테스트의 기대값을 바꾸지 않았다. M1·M2 검산 값이 그대로다.
5. 머리말의 검증 다섯 개가 통과한다. 결과 보고서가 `docs/ai/tasks/results/TASK-0004.md`에 있다.
