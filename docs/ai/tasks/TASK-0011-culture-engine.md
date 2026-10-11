# TASK-0011 M2a-4 문화 활동 엔진·자료·검사기 (부산 CA01~03)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: TASK-0010(저장 판본 5·숨어 있던 분기 정리) 반영.
- 결정 근거:
  - `docs/DECISIONS.md` ‘M2a-4 도시 방문·문화 활동 — 2026-10-06’: 사용자 결정 4개와 Claude 기본값.
  - 같은 문서 ‘시나리오 초기화와 문화 보상’(중복 1회 규칙).

## 목표

M2 시나리오(`SCENARIO_M2_MULTI_TRADE`)에서 본사 부산의 P0 현지 활동 3종을 엔진에 넣는다. 활동을 마치면 세 가지 기록이 남는다:
- 회사 기록(보고서).
- 직원의 직접 경험.
- 직원과 인물이 함께한 활동.

학습 목표는 두 가지다.
- 한 사람에게 들은 말은 한 사람의 말일 뿐, 지역 전체가 아니다(관찰 ≠ 일반화).
- 같은 사람에게 다시 들은 말은 새 출처가 아니다.

화면은 TASK-0012가 만든다. 이번에는 엔진·자료·검사기·읽기 함수와, 컴파일을 유지하는 최소 화면 수정만 한다.

## 먼저 읽을 파일

- `docs/DECISIONS.md` ‘M2a-4 도시 방문·문화 활동’ 전체.
- `docs/ai/tasks/results/TASK-0010.md`(바뀐 분기 7곳과 그 검수).
- `src/engine/engine.ts`:
  - `startTraining`(일 단위 업무·시작 때 비용 지급의 선례).
  - `scoutSite`(반복 거절의 선례).
  - `employeeUnavailable`, `assignTaskObject`, `progressTasks`.
- `src/engine/tasks.ts`(`taskSubjectKo`, `isDayBasedTask`), `src/engine/growth.ts`(`completionReward`, `awardXp`), `src/engine/invariants.ts`, `src/engine/save-shape.ts`, `src/engine/ledger.ts`, `src/engine/previews.ts`(`trainingPreview`, `payrollRunwayDay`), `src/engine/reservations.ts`(`cashLessUnpaidMinor`).
- `src/content/scenario.ts`(영입·성장 블록을 읽는 방식).
- 자료:
  - `data/culture_activities.json`(CA01~03, 키 템플릿).
  - `data/contacts.json`(NPC_MARKET 윤서, NPC_GUIDE 하람).
  - `data/venues.json`, `data/scenarios.json` 444~489행, `data/game_config.json`(`active_company_id`), `data/character_rules.json`.
- `tests/acceptance_cases.json` P0-CITY-01~04(139·188·238·284행 부근), `tools/validate_data.py` 480~505행.

## 범위

**포함:**
- 엔진: `src/engine/**`. 새 파일 `src/engine/culture.ts`와 `src/engine/m2a-culture.test.ts`.
- 로더: `src/content/scenario.ts`.
- 자료:
  - `data/scenarios.json`(M2 시나리오만).
  - `data/culture_activities.json`(CA01~03에 `report_ko` 추가만).
  - `schemas/`의 해당 스키마.
  - `tests/acceptance_cases.json`(P0-CITY-01~04 연결만).
- 검사기: `tools/validate_data.py`와 `tools/test_validate_data.py`.
- 컴파일 유지용 최소 화면 수정(아래 F).

**제외:**
- 화면 기능: 진입점, 활동 카드, 결과 카드, 기록장, 원화 보고서 행. 모두 TASK-0012.
- 출장(직원 이동), 후속 견적(M2a-4b), P1 활동 CA04~06, 대화 분기, 친밀도 점수, 저장되는 거래 신뢰, 취소·환불 명령.
- 판본 올리기: 데이터 0.4.1, 규칙 `M2a-rules-1`, 저장 판본 5는 그대로 둔다. 저장 칸은 TASK-0010이 이미 만들었다.
- 견적 수명, 계약 자금 예약, 처리량 규칙(`LEGACY_FIXED`).
- `contacts.json`·`venues.json`·`content_hooks.json`·`employees.json`·`characters.json`의 내용.

## 구현 지시

### A. 자료와 로더

1. **`data/scenarios.json`, `SCENARIO_M2_MULTI_TRADE`:**
   - `culture_enabled`를 `true`로 바꾼다.
   - `recruitment` 블록 뒤에 `culture` 블록을 둔다:
     ```json
     { "data_basis": "DESIGN", "status": "USER_REVIEWED_2026-10-06",
       "decision_ref": "docs/DECISIONS.md M2a-4 도시 방문·문화 활동",
       "activity_ids": ["CA01", "CA02", "CA03"] }
     ```
   - 정책 플래그는 두지 않는다. 규칙은 DECISIONS와 엔진 시험이 고정한다.
   - `scope_note`의 ‘창고·성장·문화 활동은 이후 단계’를 ‘부산 현지 활동 3종(원화 비용, USD 기대값과 무관). 창고는 이후 단계’로 고친다.
   - `expected_paths_usd`, `starting_cash`, `offer_ids`, `engine_rules`는 바꾸지 않는다.
2. **`data/culture_activities.json`:**
   - CA01~03에만 `report_ko: { finding_ko, scope_ko, not_claimed_ko, open_question_ko }`를 더한다.
   - 문장은 아래 ‘사용자 승인 문장’을 **글자 그대로** 쓴다.
   - 비용·기간·키 템플릿·`content_revision`(‘1’)은 바꾸지 않는다.
3. **스키마:** `schemas/scenarios.schema.json`에 선택 항목 `culture`를, `schemas/culture_activities.schema.json`에 선택 항목 `report_ko`를 더한다.
4. **로더 (`scenario.ts`):**
   - M2의 `culture` 블록에서 `config.culture`를 만든다.
     - `companyId` = `game_config.json`의 `active_company_id`.
     - `activities`: 블록에 적힌 순서대로 활동 정의를 담는다.
     - `contacts`: 그 활동들이 가리키는 인물을 담는다. `nameKo` ← `title_ko`.
   - 타입은 TASK-0010이 만든 `CultureConfig`를 쓴다. 필드 이름을 바꿔야 하면 보고서에 적는다.
   - 다음 경우에는 로더가 오류를 낸다:
     - 활동이 P0이 아니다.
     - 활동의 도시가 시나리오 도시 목록에 없다.
     - 비용 통화가 `startingCash`에 없다.
     - 인물 연결이 끊겼다.
   - M1 시나리오는 계속 `culture: null`이다.

### B. 명령과 업무

5. **타입:**
   - `Task['kind']`에 `'CULTURE'`를 더한다.
   - `Command`에 `{ id; type: 'START_CULTURE_ACTIVITY'; activityId; employeeId }`를 더한다.
   - 장부 계정 `CULTURE_EXPENSE`(비용)를 더한다. 같이 바꿀 곳: `ACCOUNT_KIND`, `BookSummary.cultureExpense`, 이익 차감.
   - `TRAINING_EXPENSE`는 다시 쓸 수 없다. 불변 조건이 훈련 업무 없는 훈련비를 거절하기 때문이다.
   - TASK-0010 덕분에 이 종류를 더하면 컴파일 오류가 나는 곳이 모두 드러난다. 그곳을 하나씩 처리하고, 처리 방식을 보고서에 표로 적는다.
6. **`startCultureActivity`** — `applyCommand`의 `START_TRAINING` 옆에 둔다. 검사 순서는 다음과 같다:
   1. `config.culture`가 `null`이면: ‘이 시나리오에서는 현지 활동을 할 수 없습니다.’
   2. 활동 정의가 없으면 거절한다.
   3. `employeeUnavailable(s, config, employeeId, def.cityId)`로 고용·근무 시작일·현지 인력·다른 업무를 한 번에 확인한다.
   4. **같은 직원의 반복:** 그 직원의 직접 경험 키가 이미 있으면 결제 전에 거절한다.
      - 문구: ‘○○은(는) 이미 이 활동에 참여했습니다. 다시 해도 새로 생기는 기록이 없습니다.’
   5. **같은 날 같은 활동의 두 번째 직원:** 같은 활동의 `CULTURE` 업무가 다른 직원으로 `RUNNING`이면 거절한다.
      - 문구: ‘같은 활동에 오늘 이미 ○○이(가) 갑니다. 끝난 뒤에 보낼 수 있습니다.’
   6. 업무 ID `CULTURE-${activityId}-${employeeId}-D${day}`가 이미 있으면 거절한다.
   7. **자금:** `cashLessUnpaidMinor`(그 통화)가 비용보다 작으면 거절한다.
      - 문구: ‘현지 활동비 자금이 부족합니다. 필요 …, 사용 가능 ….’
   8. 통과하면 다음 순서로 처리한다:
      - 업무를 만든다. `requiredWorkUnits` = `durationDays`, `subjectId` = 활동 ID, `cityId` = 활동 도시, `contractId` = `null`.
      - `assignTaskObject`로 배정한다.
      - `s.tasks`에 넣는다.
      - `CULTURE-FEE-${taskId}`를 기록한다(차변 `CULTURE_EXPENSE` / 대변 `CASH`, 그 통화).
   - 거절도 `processedCommands`에 남는다(공통 규칙).
7. **라벨과 로그:**
   - `taskLabel`은 ‘현지 활동’, `taskSubjectKo`는 활동 제목이다.
   - 배정 로그: ‘귀솔 시장과 포장 요구 탐방 시작 (1일, 현지 활동비 20,000원)’.
8. **진행과 완료:**
   - `isDayBasedTask('CULTURE')`는 `true`다. 3pt 직원도 1일 활동은 1일, 2일 활동은 2일 걸린다.
   - `progressTasks`의 `CULTURE` 분기에서 `culture.ts`의 `recordCultureCompletion`을 부른다.
   - 완료 로그: ‘귀솔: 시장과 포장 요구 탐방 완료 — 회사 기록 새로 1건 · 직접 경험 · 윤서와 함께한 활동’. 회사 기록이 이미 있으면 ‘회사 기록 이미 있음’.

### C. 기록 (`src/engine/culture.ts`)

9. **`cultureKey(template, fields)`:**
   - 자료의 키 템플릿을 채운다.
   - 허용하는 자리는 `company_id`, `actor_id`, `contact_id`, `activity_id`, `city_id`, `content_revision` 여섯 개다. 그 밖의 자리가 있으면 예외를 던진다.
10. **`recordCultureCompletion`:**
    - 회사 보고서: 키가 없을 때만 1건 추가한다.
      - `sourceContactIds` = 활동의 인물, `reporterEmployeeId` = 담당자, `day` = 완료일, `status` = `UNVERIFIED`.
    - 직접 경험: 1건 추가한다.
      - `countryCode`는 도시 정의에서 읽는다(부산 → KR).
      - `completedTaskId`, `verifiedDay` = 완료일. 필드 이름은 TASK-0010이 `character_rules.json`의 근거 필드에 맞춘 것이다.
    - 함께한 활동: 활동의 인물마다 키가 없을 때만 1건 추가한다(`kind: 'SHARED_ACTIVITY'`). CA03은 두 인물 모두 기록한다.
    - 기록 단위는 ‘활동마다 직원×인물 1회’다(DECISIONS). 그래서 CA01 뒤 CA03을 하면 윤서와의 기록이 하나 더 생긴다.
    - 기록 순서는 `s.tasks` 순서를 따른다(결정론적).
11. **경험치 — 사용자 결정 2: 직원·활동별 첫 완료에만 10:**
    - `XpRewardKind`에 `'CULTURE_FIRST_XP'`를 더한다.
    - 완료 사건 ID는 `CULTURE-FIRST-${activityId}`다. 그래서 지급 키는 `${employeeId}|CULTURE-FIRST-${activityId}|CULTURE_FIRST_XP`이다.
    - 양은 일반 업무 완료 보상과 같은 `config.growth.taskCompletionXp`(10)이다. 성장이 꺼진 설정이면 지급하지 않는다.
    - `completionReward('CULTURE')`는 `null`이다. 그래서 `TASK-DONE-…`(일반 완료 10)은 문화 업무에 주지 않는다. 두 보상이 겹치면 20이 되기 때문이다.
    - `awardXp`는 `CULTURE-FIRST-` 사건을 검증한다: 그 직원이 그 활동의 `CULTURE` 업무를 `DONE`으로 마쳤고, 종류·양이 맞아야 한다.
    - 같은 직원의 반복은 결제 전에 거절되므로, 지금은 ‘완료할 때마다 10’과 결과가 같다. 키를 직원×활동으로 두는 것은 나중에 반복을 허용해도 다시 나가지 않게 하려는 것이다.
12. **읽기 함수** (화면은 이 값을 다시 계산하지 않는다):
    - `culturePreview(state, config, activityId, employeeId)`:
      - `trainingPreview`처럼 `planState`로 사본에서 미리 실행한다. 실제 명령과 겹치지 않는 PREVIEW ID와 단계 확인도 같다.
      - 돌려줄 값:
        - `allowed`, `reasonKo`, `cost`, `durationDays`, `busyFromDay`, `busyUntilDay`.
        - `availableBeforeMinor`·`availableAfterMinor`: 현금 − 미지급.
        - `payrollRunwayBefore`·`payrollRunwayAfter`: `payrollRunwayDay`에 비용을 더해 계산한다.
        - `waitingTasks`: 같은 도시의 배정 안 된 `QUEUED` 업무와 그 계약의 예약 출항일.
        - `otherFreeLocalEmployeeIds`.
        - `newRecords: { companyReport: 'NEW' | 'EXISTS'; actorExperience: boolean; relationContactIds: string[]; firstCompletionXp: number }`.
        - `unchangedKo`: ‘가격·하루 처리량·운임·관세·거래 신뢰’. 결정 2의 위험 대응으로 화면이 ‘바뀌지 않는 것’ 줄에 쓴다.
    - `cultureBook(state, config)`: 보고서, 직원별 경험, 고용 직원×인물 쌍 전부. 기록이 없는 쌍도 넣는다.
    - `counterpartyRecord(state, partyId)`: `s.contracts`에서 진행·납기 안·지연·취소 건수를 계산한다. 저장하지 않는다.
    - 모두 입력 상태를 바꾸지 않는다.

### D. 불변 조건 (`commitDay`와 불러오기에서 실행)

13. **`CULTURE` 업무:**
    - `subjectId`가 `config.culture`의 활동이고, `cityId`·`requiredWorkUnits`가 정의와 같으며, `contractId`는 `null`이다.
    - `CULTURE-FEE-<업무>` 기록이 정확히 1건이고, 통화·금액이 정의와 같다.
    - 직원×활동마다 `ABORTED`가 아닌 `CULTURE` 업무는 최대 1건이다.
    - `TASK-DONE-<업무>` 경험치 키가 없다.
    - 성장이 켜져 있고 직원에게 성장 정의가 있으면, `DONE` 업무마다 `CULTURE-FIRST` 키가 정확히 1건이다.
    - `DONE` 업무마다 경험 1건, 인물별 관계 1건이 있고, 그 활동의 보고서가 있다.
14. 업무 없는 `CULTURE_EXPENSE` 기록은 없다.
15. **기록:**
    - 키가 배열 안에서 유일하고, 저장된 필드로 다시 만든 키와 같다.
    - `taskId`·`completedTaskId`가 같은 활동·같은 담당자의 `DONE` `CULTURE` 업무를 가리킨다.
    - 날짜가 그 업무의 완료일과 같다.
    - `contactId`가 그 활동의 인물 목록 안에 있다.
16. `config.culture`가 `null`이면 `CULTURE` 업무·기록·`CULTURE_EXPENSE`가 모두 없다. TASK-0010의 조건을 넓히는 것이다.

### E. 검사기 (`tools/validate_data.py`)

17. 기존 488~490행 검사(CITY_CULTURE 플래그, P0 3개)는 유지한다.
18. 추가할 검사:
    - M2 `culture` 블록의 활동이 존재하고 P0이며 시나리오 도시 안에 있다.
    - 활동의 도시가 그 장소(venue)의 도시와 같다.
    - 역방향 연결: 인물의 `activity_ids`와 장소의 `activity_ids`에 그 활동이 있다.
    - 비용 통화가 `starting_cash`에 있고 금액이 0보다 크다.
    - 키 템플릿은 알려진 자리 여섯 개만 쓴다.
    - 시나리오가 쓰는 활동은 `report_ko` 네 줄이 모두 비어 있지 않다.
    - **일반화 금지어:** `finding_ko`(알게 된 점)에 ‘부산 사람’, ‘부산 시민’, ‘한국인’, ‘한국 사람’, ‘한국 소비자’, ‘국민’, ‘상인들은’이 있으면 실패한다. `not_claimed_ko`는 그 집단을 부정하려고 이름을 쓸 수 있으므로 검사하지 않는다.
    - P0-CITY-01~04가 아래 G처럼 연결되어 있다.
19. `tools/test_validate_data.py`: 금지어가 든 `finding_ko`가 실패하고 같은 말이 `not_claimed_ko`에 있으면 통과하는 회귀 사례, `report_ko` 누락 사례를 더한다.

### F. 컴파일 유지용 최소 화면 수정 (TASK-0004 선례)

20. 다음 다섯 곳만 바꾼다. 활동을 시작하는 버튼이나 패널은 만들지 않는다.
    - `src/ui/card.ts` `taskName`: ‘현지 활동’.
    - `src/ui/crew-status.ts`:
      - `taskSchedule` 이름: ‘현지 활동’.
      - `crewStatusKo`: ‘◇ 현지 활동 중 n/m일’.
    - `src/ui/main.ts` `commandLabel`: ‘시장과 포장 요구 탐방 → 귀솔 (20,000원·1일)’.
    - 그 밖에 컴파일 오류가 나는 화면 곳은 같은 수준으로만 고치고 보고한다.

### G. 인수 명세 연결 (`tests/acceptance_cases.json`)

21. P0-CITY-01~04에 다음을 단다.
    - `scenario_id: "SCENARIO_M2_MULTI_TRADE"`, `engine_test_ref: "src/engine/m2a-culture.test.ts"`.
    - 구체 대응:
      - `ACT_A` = CA01(20,000원·1일).
      - `CONTACT_A` = NPC_MARKET, `CONTACT_B` = NPC_GUIDE.
      - `EMPLOYEE_A`/`B` = EMP01/EMP02.
      - `CITY_HOME` = BUSAN.
      - `CITY_REMOTE` = SHANGHAI. 시험 전용 합성 활동으로 다룬다.
    - ‘현금 100 → 98’은 ‘활동 유무만 다른 두 실행의 원화 현금 차이 20,000원’에 대응한다고 적는다.
22. 추상 기대값과 사례 수(18)는 바꾸지 않는다. P0-CITY-03의 ‘퇴사 뒤’ 단언은 퇴사 기능이 없으므로 ‘미실행 단언’으로 표시한다.

## 사용자 승인 문장 (그대로 싣는다)

사용자가 2026-10-06 Claude 초안을 고치지 않고 ‘진행’을 지시했다. 그래서 초안을 그대로 쓴다. 아래 문장을 `report_ko`에 **한 글자도 바꾸지 않고** 넣는다(따옴표 “ ” ‘ ’ 포함).

| 활동 | 필드 | 문장 |
|---|---|---|
| CA01 | `finding_ko` | 윤서: “지금 들여오는 상자는 우리 가게 선반에 다 들어가지 않아요. 더 작은 묶음이면 좋겠어요.” |
| CA01 | `scope_ko` | 판매점 1곳, 1명(윤서), 활동한 날 하루의 대화. 다른 가게나 손님에게는 확인하지 않았습니다. |
| CA01 | `not_claimed_ko` | 부산의 다른 상인이나 손님도 작은 포장을 원한다는 뜻이 아닙니다. |
| CA01 | `open_question_ko` | 윤서가 원하는 묶음 크기와 수량, 그런 규격을 이미 공급하는 거래처가 있는지. |
| CA02 | `finding_ko` | 하람: “같은 배를 두고 전시 안내문과 옛 장부의 날짜가 달라요. 어느 쪽이 맞는지 정하기 전에, 각각 누가 언제 무엇을 보고 썼는지부터 확인해야 해요.” |
| CA02 | `scope_ko` | 가상 전시 1곳의 기록 2건을 안내자 1명(하람)과 비교했습니다. 어느 기록이 맞는지는 확인하지 않았습니다. |
| CA02 | `not_claimed_ko` | 두 기록 가운데 어느 쪽이 옳은지, 그리고 실제 부산항의 역사(이 전시는 가상입니다). |
| CA02 | `open_question_ko` | 두 기록을 쓴 사람·시점·근거, 그리고 둘 다 틀렸을 가능성. |
| CA03 | `finding_ko` | 윤서: “‘다음 주 초에 조금 더’라고 하면 저는 월요일에 열 상자 정도를 뜻해요.” / 하람: “같은 말도 사람마다 뜻이 다를 수 있으니, 날짜와 숫자로 다시 말해 달라고 하세요.” |
| CA03 | `scope_ko` | 2명(윤서·하람)과 하루의 대화. ‘월요일·열 상자 정도’는 윤서 본인에게 확인한 뜻입니다. 다른 거래처의 표현은 확인하지 않았습니다. |
| CA03 | `not_claimed_ko` | 부산의 다른 상인도 같은 말을 같은 뜻으로 쓴다는 뜻이 아닙니다. |
| CA03 | `open_question_ko` | ‘정도’가 몇 상자까지인지, 매주 같은 양인지. |

- 이 문장들은 가상 인물에 대한 DESIGN 내용이다.
- 나중에 사용자가 문장을 고치면 Claude가 자료만 바꾼다. 엔진은 문장 내용에 의존하지 않게 만든다(시험도 문장 전체가 아니라 필드 존재·출처를 단언한다). 단, 위 문장이 자료에 글자 그대로 들어갔는지는 시험 하나로 확인한다.

## 테스트 (`src/engine/m2a-culture.test.ts`)

- **P0-CITY-01 (엔진 쪽):** `culturePreview`·`cultureBook`·`counterpartyRecord`를 모든 활동×직원 조합으로 불러도 상태가 깊은 비교로 그대로다.
- **P0-CITY-02 (CA01·EMP01):**
  - 활동 유무만 다른 두 실행의 원화 현금 차이가 정확히 20,000원이다.
  - `CULTURE_EXPENSE` 20,000원, 보고서 1건, 완료 1회. 다음 날 EMP01은 대기 상태다.
  - 같은 명령 ID 재전송은 중복으로 처리된다.
  - 새 ID로 같은 직원이 반복하면 결제 없이 거절된다.
  - 마감한 날을 다시 마감하면 `alreadyClosed`다.
  - 위 세 경우 모두 장부가 그대로다.
- **P0-CITY-03:**
  - 쌍별 기록: (EMP01, NPC_MARKET) = 1, (EMP01, NPC_GUIDE) = 0, (EMP02, NPC_MARKET) = 0.
  - 모든 상대의 `counterpartyRecord`가 0이다.
  - 계약·청구서·견적이 그대로다.
  - 보고서에 BUSAN·KT_BUSAN_PACKAGING·[NPC_MARKET]·기록일·UNVERIFIED가 있다.
- **P0-CITY-04:** CA01의 도시를 SHANGHAI로 바꾼 합성 설정에서 ‘현지 인력이 필요합니다’로 거절된다. 업무·비용·직원 위치·운송 중 화물이 그대로다.
- **결합 시험:**
  - 활동한 날 같은 직원에게 준비 업무를 배정하면 바쁨으로 거절되고, 다른 직원은 된다.
  - 같은 날 훈련 + CA01 + CA03의 원화 합계가 모자라면 뒤의 명령이 거절된다.
  - EMP03을 고용한 뒤에도 1일 활동은 1일, 합성 2일 활동은 2일 걸린다.
  - CA03은 관계 기록 2건을 남긴다.
  - 두 번째 직원이 참여하면 보고서는 1건 그대로이고, 경험·관계만 늘어난다.
  - 같은 날 같은 활동의 두 번째 직원은 거절된다.
  - 진행 중 저장 → 불러오기 → 이어 간 결과가 중단 없이 진행한 결과와 같다.
- **경험치 (결정 2):**
  - 첫 완료에 10이 1회 지급되고, `CULTURE-FIRST` 키가 생긴다.
  - `TASK-DONE-CULTURE-…` 키는 없다.
  - 다른 활동을 하면 또 10을 받는다.
  - 레벨 문턱을 넘으면 레벨 달성 로그가 남는다.
  - 성장을 끈 합성 설정에서는 경험치가 없다.
- **변조 저장은 각각 SaveError로 거절된다:**
  - 키 중복.
  - `DONE` 업무 없는 기록.
  - 비용 누락·중복.
  - 활동에 없는 인물.
  - 다시 만든 키와 다름.
  - 기록일 ≠ 완료일.
  - `CULTURE-FIRST` 키 누락·중복.
  - 문화 업무의 `TASK-DONE` 키.
- **회귀:**
  - M2 기대 경로를 쉬는 날 활동이 있을 때와 없을 때로 돌린다. USD 요약·계약·견적·운송·난수 상태가 `toEqual`로 같고, 원화 차이는 `CULTURE_EXPENSE`뿐이다.
  - M1은 `culture`가 `null`이고 `START_CULTURE_ACTIVITY`는 거절된다.
  - `save-v4-m2.json`이 여전히 빈 기록장으로 열린다.

### 기대값 변경 허용 목록

이 밖의 기존 기대값이 바뀌면 반려 사유다.
- `BookSummary` 전체를 객체로 비교하는 기존 시험에 `cultureExpense: 0`을 더하는 것.
- 보고서에 모두 적는다.

## 완료 조건

1. A~G가 반영되었고, 위 시험이 통과한다.
2. **변형 시험.** 다음을 하나씩 넣어 실패를 확인하고 보고서에 표로 적는다. 확인한 뒤에는 되돌린다.
   1. 같은 직원 반복 검사를 결제 뒤로 옮김.
   2. 같은 날 두 번째 직원 검사 제거.
   3. `isDayBasedTask('CULTURE')`를 `false`로.
   4. 문화 업무에도 `TASK-DONE` 10 지급.
   5. `CULTURE-FIRST` 키를 업무 ID로 만듦.
   6. 관계 키에서 활동 ID 제거.
   7. 보고서를 직원마다 추가.
   8. 금지어 검사를 `not_claimed_ko`까지 확대. `test_validate_data.py`가 실패해야 한다.
   9. 비용을 `TRAINING_EXPENSE`로 기록.
3. 기존 기대값이 허용 목록 밖에서 바뀌지 않았다. 판본(0.4.1, `M2a-rules-1`, 저장 5)이 그대로다.
4. 머리말의 검증 다섯 개, `python3 tools/test_validate_data.py`, `python3 tools/art/test_pixel_tools.py`가 통과한다.

## 결과 보고

`docs/ai/tasks/results/TASK-0011.md`에 머리말 형식으로 쓴다. 다음을 반드시 넣는다.
- 컴파일 오류로 드러난 곳과 처리 방식(표).
- 사용자 승인 문장을 바꾸지 않았다는 확인(자료와 지시서의 글자 비교).
