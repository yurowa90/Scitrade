# TASK-0011 재작업 1 — 변조 저장 시험 바로잡기, 진행 중 업무 검사, 조사, 검사기

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: TASK-0011 스냅숏 `fc70406`(작업 브랜치 `codex/TASK-0011`).
- 결정 근거:
  - `docs/ai/tasks/results/TASK-0011.md` ‘검수 1차’.
  - `docs/DECISIONS.md` ‘M2a-4 도시 방문·문화 활동’.

## 목표

TASK-0011의 엔진 동작(돈·장부·경험치·기록)은 맞다. 이번에는 시험과 검사가 지시서가 요구한 것을 실제로 막도록 고친다.
- 게임 규칙·기대값·판본은 바꾸지 않는다.
- **`docs/ai/tasks/TASK-0011-culture-engine.md`는 수정하지 않는다.** 역사 기록이다.

## 구현 지시

1. **[major] 변조 저장 시험 (SAVE-2)** — `src/engine/m2a-culture.test.ts`의 `mutations` 목록.
   - **문제:** 지금 변조는 유효한 기록 하나를 고쳐 쓰는 방식이다. 그래서 여러 검사가 함께 실패하고, 이름이 가리키는 검사를 지워도 시험이 통과한다. 검수에서 검사 10개를 지워도 시험 전체가 통과했다.
   - **고칠 것:**
     - 각 변조는 유효한 기록 **옆에** 하나를 더하거나 한 필드만 바꾸어, 목표 검사 하나만 걸리게 한다.
     - 그 검사의 메시지를 정규식으로 단언한다(`toThrow(/…/)`).
   - 꼭 넣을 변조:
     - X1: 활동에 없는 인물(NPC_GUIDE)의 관계 기록을 하나 더한다. 키는 바르게 만든다.
     - X2: 그 활동을 하지 않은 직원의 경험 기록(`FORGED`)을 더한다.
     - X3: `EMP02|CULTURE-FIRST-CA01|CULTURE_FIRST_XP`와 경험치 +10(지급액 기록 포함)을 더한다.
     - X4: 업무 없는 `CULTURE_EXPENSE` 분개를 더한다(원화 현금도 맞게 줄인다).
     - X5: 같은 직원·같은 활동의 두 번째 진행 중 업무와 그 활동비를 더한다.
     - X6: 보고서 `topicId`를 바꾼다.
     - X7: 활동비 분개의 날짜를 바꾼다.
     - X8: DONE 업무의 `completedDay` 계산을 어긋나게 한다.
   - 기존 변조(키 중복·키 불일치·날짜 등)도 같은 원칙으로 다시 쓴다.
   - **보고서에 표로 남긴다:** 각 시험의 목표 검사(`culture-invariants.ts` 줄)를 지우면 그 시험이 실패하는지.
2. **[minor] 진행 중 문화 업무 검사 (ENG-1·SAVE-1)** — `src/engine/culture-invariants.ts`.
   - 문화 업무의 상태는 `RUNNING` 또는 `DONE`만 허용한다.
   - `RUNNING`이면 다음을 모두 요구한다:
     - `completedDay === null`, `startedDay <= s.day`, `progressWorkUnits < requiredWorkUnits`.
     - `s.day − startedDay ≤ progressWorkUnits ≤ s.day − startedDay + 1`.
     - 하한은 불러오기 시점(PENDING_OPEN·AWAITING_INPUT·ENDED), 상한은 하루 마감 중 검사 시점을 위한 것이다. 두 시점이 모두 통과하는지 시험한다.
   - 시험: 검수에서 재현한 두 변조가 불러오기에서 SaveError로 거절된다.
     - 실제 자료로 다섯 필드를 고친 경우.
     - 합성 2일 활동의 진행량만 고친 경우.
3. **[minor] 완료 기록 조사 (ENG-2)** — `src/engine/culture.ts` 55행 부근.
   - ‘와/과’를 마지막 인물 이름의 받침으로 고른다(한글 음절 `(code − 0xAC00) % 28 !== 0`이면 ‘과’).
   - CA02 완료 기록 ‘하람과 함께한 활동’, CA03 ‘윤서·하람과 함께한 활동’, CA01 ‘윤서와’를 단언한다.
4. **[minor] 거절 이유 우선순위 (G1):**
   - 같은 직원의 반복을 자금이 부족한 상태에서 시도하면 ‘이미 이 활동에 참여했습니다’가 나온다.
   - 같은 날 두 번째 직원을 자금이 부족한 상태에서 보내면 ‘같은 활동에 오늘 이미 …’가 나온다.
   - 확인용 변형: 자금 검사를 반복 검사·두 번째 직원 검사 앞으로 옮기면 각 시험이 실패해야 한다.
5. **[minor] 키 템플릿 자리 (D1)** — 검사기와 로더 모두. 자리는 중괄호를 해석해서 읽는다. 글자 포함 검사로 하지 않는다.

   | 템플릿 | 필수 자리 | 허용하지 않는 자리 |
   |---|---|---|
   | 회사 보고서 | `{company_id}` | `actor_id`, `contact_id` |
   | 직접 경험 | `{actor_id}` | `contact_id` |
   | 관계 | `{actor_id}`, `{contact_id}` | — |

   - `validate_data.py` 557~559행의 글자 포함 검사를 이 방식으로 바꾼다.
   - `test_validate_data.py`에 사례를 더한다. 중괄호 없이 `actor_id`라는 글자만 있는 템플릿도 실패해야 한다.
6. **[minor] 일반화 금지어 (D3)** — `validate_data.py`.
   - `finding_ko`를 NFC로 정규화한다.
   - 금지어의 띄어쓰기 자리를 `\s*`로 매칭한다(예: `부산\s*사람`). 본문 공백을 모두 지우지는 않는다. 지우면 ‘한국 인형’이 ‘한국인’으로 걸리는 오탐이 생긴다.
   - 회귀 사례를 더한다: ‘부산사람들은’이 실패하고, ‘한국 인형을 들여왔어요’는 통과해야 한다.
7. **원화 전용 (DECISIONS: 비용은 원화로 낸다):** 로더와 검사기가 활동 비용 통화를 `payrollCurrency`(KRW)로 제한한다.
8. **작은 정리:**
   - SAVE-6: `save-v5.test.ts` 91행 부근의 항상 참인 단언을 지우고, 실제 설정의 culture 여부를 따로 단언한다(M1 null, M2 있음).
   - S1: `schemas/scenarios.schema.json`의 culture 블록에 `data_basis` enum `['DESIGN']`, `activity_ids`에 `minItems: 1`·`uniqueItems: true`를 단다.
   - D2: 검사기에서, culture 블록이 있는 시나리오는 `culture_enabled: true`여야 한다.
   - A2: `tests/acceptance_cases.json` P0-CITY-01의 화면 단언(진입점·금융센터)을 미실행 단언으로 표시한다. 이유: 화면 범위, TASK-0012. 형식은 P0-CITY-03과 같다. 사례 수 18은 그대로다.
9. **문장 비교 시험이 문서에 의존하지 않게:**
   - `m2a-culture.test.ts`가 지시서 파일을 `?raw`로 읽지 않게 한다.
   - 기대 문장 12개를 시험 파일 안의 표로 옮긴다. 글자는 지금 자료와 같아야 한다.
   - 사용자가 나중에 문장을 고치면 자료와 이 표만 함께 바꾼다.

## 범위

- **포함:**
  - `src/engine/culture-invariants.ts`, `src/engine/culture.ts`.
  - 로더 `src/content/scenario.ts`(5·7번).
  - `src/engine/m2a-culture.test.ts`, `src/engine/save-v5.test.ts`.
  - `tools/validate_data.py`, `tools/test_validate_data.py`.
  - `schemas/scenarios.schema.json`, `tests/acceptance_cases.json`(A2만).
- **제외:**
  - 엔진 규칙·장부·저장 형식·판본.
  - `data/**`의 값.
  - 화면.
  - TASK-0011 지시서 파일.
  - SAVE-3·4·5(저장 이력 일반 강화).

## 완료 조건

1. 1~9가 반영되었다.
2. **변형 시험:** 다음을 하나씩 넣어 실패를 확인하고 보고서에 표로 적는다. 확인한 뒤에는 되돌린다.
   - 1번 표의 목표 검사 각각을 지움.
   - `RUNNING` 진행량 검사를 지움.
   - 조사를 ‘와’로 고정.
   - 자금 검사를 앞으로 옮김(두 경우).
   - 회사 보고서 템플릿에 `{actor_id}` 허용.
   - 금지어 매칭을 글자 그대로로 되돌림.
   - 활동 비용 통화를 USD로 허용.
3. 기존 경제 기대값과 TASK-0011의 규칙 시험을 약화하지 않았다. 바꾼 단언은 모두 옛 값 → 새 값으로 보고한다.
4. 머리말의 검증 다섯 개, `python3 tools/test_validate_data.py`, `python3 tools/art/test_pixel_tools.py`가 통과한다.

## 결과 보고

`docs/ai/tasks/results/TASK-0011.md` 끝에 `## 재작업 1`을 더한다.
