# TASK-0022 인수 명세 시험 연결과 자료 검사기 정리

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 병렬 세션 1차가 모두 개발 브랜치에 반영됐다(`a13caa4`). G0 평택 전환(TASK-0015)과 S2 읽기 함수(TASK-0016)가 들어 있다. 이 작업은 S2가 만들거나 고친 시험 이름(`acceptance-p0-time.test.ts`는 새 파일, `acceptance-p0-acc.test.ts`는 기존 파일)을 참조한다.
  - 병렬 작업: 2차의 화면 작업(TASK-0023, W2-0d)이 `src/ui/**`(특히 `main.test.ts`)를 고친다. 이 작업은 `src/**`를 고치지 않고 `a13caa4`의 시험 제목만 쓴다. 두 작업이 함께 바꾸는 파일은 생성 파일 `MANIFEST.json`뿐이다.
  - 개발 브랜치 `a13caa4` 위에 만든 `codex/TASK-0022`에서 작업한다. 시작할 때 `git rev-parse --short HEAD`를 실행해 결과 보고에 적는다.
  - 작업 브랜치는 이 지시서를 올린 커밋에서 시작한다. 그 커밋이 더한 `docs/ai/tasks/TASK-0022-*.md`·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 `git diff a13caa4` 결과에 나와도 이 작업의 변경으로 치지 않는다.
  - 모든 diff·검사 명령의 기준 커밋은 `a13caa4`다. 아래 줄 번호도 `a13caa4` 기준이다.
- 결정 근거:
  - `tests/acceptance_cases.json` 21행 `human_review_rule`: 사람 확인은 엔진 검증과 따로 기록한다. 파일 작성만으로 통과를 표시하지 않는다.
  - `docs/ai/WORKFLOW.md` 52행: 실행하지 않은 인수 기준을 통과로 표시하지 않는다.
  - `docs/ai/CONTEXT_MAP.md` 34행: 시험 파일이 있다는 것은 실행했다는 뜻이 아니다.
  - `docs/IMPLEMENTATION_PLAN.md` 81행: 인수 명세를 실행 가능한 검증에 연결한다.
  - `docs/DECISIONS.md`
    - 346~383행 ‘세계 거점 근거 원문 대조’: 출처 교체 기록. 358행 로테르담(함부르크 자료 → 로테르담 항만공사), 361행 피레우스, 362행 더반.
    - 771~774행: P0 활동이 P1 교과 성취기준까지 다룬다고 보이지 않게 한다.
    - ‘병렬 세션 1차 결과’(1033행): 이 작업은 2차의 W2-0a다.
  - `docs/CHARACTERS_AND_ORGANIZATION.md` 69·75행: 상설팀 이름은 `data/organization.json`의 `name_ko`가 기준이다(물류운영팀).
  - `docs/ai/tasks/results/TASK-0016.md` 18행(P0-TIME-01 저장 시점 (가)·(나))과 478행(검수: 이 대응을 W2-0a에서 `engine_test_ref` 옆에 적는다).
  - `docs/ai/tasks/results/TASK-0011.md` 155~160행, 339~342행: 일반화 금지어 정밀도(D4·R1V-3·R1V-4)와 R1V-2(상속된 culture 블록)를 기록만 해 두었다.
  - `docs/ai/tasks/results/TASK-0021.md` 221~237행(표 C, P0 항목의 P1 연결 7쌍), 349~351행(검사기 규칙 제안, 승인된 예외 없음).
  - 2026-10-09 남은 일 점검 계획의 W2-0a(B19·B51 SRC-02·B11 검사기 줄·PPL-03 잔여·CUR-04 검사). Claude의 작업 계획이며 저장소에 없다. 찾지 않아도 된다.

## 목표

인수 명세 두 파일이 **실제 시험 파일과 시험 이름**을 가리키게 한다. 자료 검사기는 그 파일과 이름이 정말 있는지 확인한다. 인수 명세에 대한 검사기의 고정 개수·고정 연결 목록은 자료에서 읽는다. 함께 검사기 잔여 정리 네 가지를 한다.

1. **B19 (TPD-03·04):** 인수 명세 머리말을 실제 상태에 맞춘다. 사례마다 `engine_test_ref`와 시험 이름을 둔다. 검사기가 파일·이름의 존재를 확인한다. 인수 명세 개수·연결 수의 고정값을 자료에서 읽는다.
2. **B11:** 캐릭터 인수 명세의 부서·팀 이름을 `organization.json`과 대조한다.
3. **PPL-03 잔여:** 일반화 금지어의 폭 0 문자 우회(R1V-4), 고유명사 오탐(R1V-3·D4), 상속된 culture 블록 검사(R1V-2).
4. **B51 SRC-02:** 쓰이지 않는 출처를 표시하고, 없는 로컬 경로를 고친다. 검사기가 둘 다 확인한다.
5. **CUR-04:** P0 항목이 P0 표지 없는 교과 연결을 가리키는지 검사한다. 지금 있는 7쌍은 ‘미해결 목록’으로만 둔다. 자료의 뜻은 바꾸지 않는다.

- 연결은 실행 결과가 아니다. 검사기는 시험을 돌리지 않는다. `engine_test_pass_claim`은 계속 `false`다.
- 인수 명세의 기존 값(`initial_state`·`expected_numeric`·`actions`·`expected_assertions`·`human_review_check` 등)은 하나도 바꾸지 않는다. 더하기만 한다. 예외는 아래 1절의 머리말 칸이다.
- 엔진·화면 코드와 TS 시험은 바꾸지 않는다. vitest 파일 수와 시험 수는 시작 값 그대로여야 한다.

## 먼저 읽을 파일

- `tools/validate_data.py` (줄 번호는 `a13caa4` 기준):
  - 2행 문서 문자열 ‘not an unimplemented game engine’(낡음).
  - 21행 `check`. 모든 검사는 이 함수로 실패를 모은다.
  - 69~86행 `validate_cancellation`. 71~74행의 `resolve`가 `base_scenario_id` 상속을 푼다.
  - 135행 `walk`(모든 객체를 돈다), 145행 `index`. 새 검사에서 다시 쓴다.
  - 161행 `check_culture`.
    - 168~170행: culture 블록 ⇒ `culture_enabled` 검사. 상속 전 원본 레코드만 본다(R1V-2).
    - 204~208행: 일반화 금지어. NFC 뒤 띄어쓰기 자리를 `\s*`로 맞춘다.
    - 209~221행: P0-CITY 연결. 215행이 `engine_test_ref` 문자열만 비교한다.
  - 481행 `main`.
    - 488~491행: 표 색인과 `curriculum`.
    - 499~502행: 교과 연결 개수 47과 18·6·23 고정값.
    - 518~523행: 모든 문서의 `source_refs`·`curriculum_refs`가 있는 ID인지 본다. 없는 교과 연결 ID는 여기서 이미 잡는다.
    - 654~662행: 인수 명세. 658·660행은 요약과 대조한다. 662행 `len(cases) == 18`은 고정값이다.
    - 663행 주석 ‘No simulation engine exists in this package’(낡음).
    - 752~764행: 캐릭터 인수 명세. 754행 `== 8`, 755행 연결 ID 집합, 759행 경로 문자열, 763행 `== 3`이 고정값이다.
    - 778~786행: 출력. 783·784행 문구가 고정값이다.
- `tools/test_validate_data.py`: 47~58행 `CultureReportsTest.fixtures`·`errors`, 60~65행 금지어, 67~74행 띄어쓰기·NFD, 115~122행 culture_enabled, 210~219행 본사 대응. 기존 시험은 20개다.
- `tests/acceptance_cases.json`: 8·10·15·21행 머리말, 139~200행 P0-CITY-01, 391행 P0-TIME-01, 715·741행 P0-ACC-13·14, 878~919행 P0-M2A-04, 921~946행 `review_summary`.
- `tests/character_acceptance_cases.json`: 3·5행 머리말, 166~196행 CHAR-ACC-04(부서·팀 이름).
- `data/sources.json`: 5~14행 DESIGN-V03(13행 `local_path`), 562행 PORT-HAMBURG-2025, 656행 DURBAN-PORT, 686행 PIRAEUS-2025, 846행 GPPC-ROUTE-2026-01.
- `data/organization.json`: 34~46행 TEAM_LOGISTICS(36행 `name_ko`, 37행 `department_id`), 100~113행 `departments`.
- `data/curriculum_links.json`: 30행 `counts`, 연결마다 `group`·`selection`·`priority`.
- `schemas/sources.schema.json`: 항목의 `additionalProperties`가 `true`다. 새 칸을 더해도 스키마를 고치지 않아도 된다.
- 시험 파일(읽기만): `src/engine/acceptance-p0-acc.test.ts`, `acceptance-p0-time.test.ts`, `m1-trade.test.ts`, `m2a-multi.test.ts`, `m2a-recruit.test.ts`, `m2a-culture.test.ts`, `m2a-growth.test.ts`, `src/ui/main.test.ts`, `src/ui/growth.test.ts`.
- `docs/DESIGN_v0.4.md` 124~132행과 523~545행: 설계 문서가 출처를 `[S1]`·`[S7, 확장 후보]`처럼 대괄호로 인용한다.
- 위 ‘결정 근거’의 결과 보고 줄.

## 범위

**포함**
1. `tests/acceptance_cases.json` 머리말·요약·사람 검토 기록 자리(구현 지시 1).
2. 두 인수 명세 파일의 사례별 시험 연결과 연결하지 않은 이유(구현 지시 2).
3. P0-TIME-01의 저장 시점 (가)·(나) 대응 설명과 미실행 단언(구현 지시 3).
4. 검사기: 시험 파일·이름 존재 확인(구현 지시 4).
5. 검사기: 요약·상태·통과 주장·사람 검토 기록, 고정 개수 제거(구현 지시 5).
6. 검사기: 부서·팀 이름 대조(B11, 구현 지시 6).
7. 검사기: 일반화 금지어 정밀도와 상속 culture 블록(PPL-03, 구현 지시 7).
8. 출처: 쓰이지 않는 출처 표시, DESIGN-V03 경로, 검사기(SRC-02, 구현 지시 8).
9. 검사기: 교과 연결 P0 검사와 미해결 목록(CUR-04, 구현 지시 9).
10. 교과 연결 목록과 자료의 `counts` 대조. 기존 고정값은 그대로 둔다(구현 지시 10).
11. P0-ACC-13·14 기대값과 시나리오 고정값 대조(구현 지시 11).
12. 역방향 검사: 시험 제목의 사례 ID가 연결에 있는지(구현 지시 12).
13. 출력 문구(구현 지시 13).
14. 새 검사를 모두 `main`에서 부르기와 그 연결 시험(구현 지시 14).
15. 위 모든 것의 파이썬 회귀 시험과 변형 시험.

**제외**
- 엔진·화면 코드, TS 시험 파일. 시험 이름을 바꾸거나 시험을 더하지 않는다.
- 교과 연결 자료의 뜻 변경(7쌍의 연결 제거·단계 변경). W2-0b에서 Claude가 원문 확인 뒤 정한다.
- 성취기준 코드 칸(CUR-01·02), `references/source_register.csv` 정리(SRC-03).
- 저장 이력 일반 강화(TASK-0011의 P4·SAVE-3·4·5). 이번 PPL-03 잔여는 검사기 부분만이다.
- 로더(`src/content/scenario.ts`)가 `culture_enabled`를 무시하는 문제(R1V-2의 엔진 쪽 절반). ‘범위 밖 발견’에 적기만 한다.
- 표 개수 고정값(`expected_counts` 492~498행, 바다 관문 6, 1장 거점 7, P0 문화 활동 3, 속성 6·부서 3, P0 캐릭터 6, 강화 합계, 관찰 12)과 M1·M2 검산의 고정 ID(`ROUTE01`·`OFFER_FWD_01`·`EMP04`·`EMP01`). 아래 ‘예상 질문’ 참조.
- P0-CITY 대응표 검사(210~219행)의 고정 대응값과 설명 문구 검사. 215행만 바꾼다.
- 문서(`docs/**`) 수정. 낡게 되는 문장은 ‘범위 밖 발견’에 줄 번호로 적는다.

**시간이 모자라면 뺄 수 있음** (1번부터 뺀다)
1. 역방향 검사(구현 지시 12)와 그 시험.
2. 교과 연결 개수(구현 지시 10)와 그 시험.
3. CHAR-ACC-02·08의 화면 시험 연결(`ui_test_ref`·`ui_test_names`). 빼면 캐릭터 `summary.ui_linked_case_count`는 0이다.
4. P0-ACC-13·14 대조(구현 지시 11)와 그 시험. 빼면 두 사례 설명의 둘째 문장(‘자료 검사기가 … 확인한다’)도 뺀다.
- 뺀 항목은 결과 보고 ‘완료 조건 대조’에 ‘미충족(시간)’으로 적는다.
- 그 밖의 것은 빼지 않는다. 변형 시험 표도 남은 항목에 대해서는 모두 한다.

## 고칠 수 있는 파일

- `tests/acceptance_cases.json`
- `tests/character_acceptance_cases.json`
- `tools/validate_data.py`
- `tools/test_validate_data.py`
- `data/sources.json`: **다섯 레코드만** 고친다. DESIGN-V03, PORT-HAMBURG-2025, DURBAN-PORT, PIRAEUS-2025, GPPC-ROUTE-2026-01. 새 칸을 더하고 DESIGN-V03의 `local_path`만 바꾼다. 다른 값은 그대로 둔다.
- `docs/ai/tasks/results/TASK-0022.md` (결과 보고)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/**`, `package.json`, `package-lock.json`, `vite.config.ts`. 새 npm·파이썬 의존성을 넣지 않는다(파이썬 표준 라이브러리만).
  - `data/**` 가운데 `sources.json` 밖의 모든 자료, `schemas/**`, `references/**`.
  - `tools/**` 가운데 위 두 파일 밖의 모든 도구(`check_fact_mixing.py`, `build_package.py`, `ai/**`, `browser/**`, `deploy/**`, `art/**`).
  - `docs/DESIGN_v0.4.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/VALIDATION.md`, `docs/CHARACTERS_AND_ORGANIZATION.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `AGENTS.md`, `CLAUDE.md`

## 지켜야 할 것

- **JSON 형식:** 세 JSON 파일은 지금 `json.dumps(obj, ensure_ascii=False, indent=2) + '\n'`과 바이트까지 같다(Claude 확인). 같은 방식으로 쓴다. 새 칸은 그 객체의 **끝에** 더한다. 그러면 diff는 더한 줄과 앞 줄의 쉼표 하나만 보인다. 손으로 고치지 말고 `json.load` → 고침 → 위 방식으로 다시 쓰기를 권한다.
- **기존 값 불변:** 인수 명세 사례의 기존 칸 값, 출처 레코드의 기존 칸 값을 바꾸지 않는다. 예외는 1절의 머리말 칸과 DESIGN-V03 `local_path`뿐이다. 완료 조건 3의 대조 스크립트가 확인한다.
- **기존 시험:** `tools/test_validate_data.py`의 기존 20개 시험과 기대값을 바꾸지 않는다. 기존 오류 문구(`… culture 블록은 culture_enabled 필요`, `… finding_ko 일반화 금지어 …`, `… 현지 활동비는 급여 통화(KRW) 필요` 등)도 그대로 둔다.
- **`check_culture` 서명:** `check_culture(tables, cases, payroll_currency, home_city_id)`를 바꾸지 않는다. 기존 시험이 이 서명으로 부른다. 새 검사는 새 함수로 만든다.
- **새 시험의 ID:** 새 파이썬 시험에 도시·견적·사건·노선·직원·활동·인물·장소·교과 연결 ID를 직접 쓰지 않는다. 값은 자료에서 찾는다(예: `game_config`의 `home_city_id`, `base_scenario_id`가 있는 첫 시나리오, `stage`가 P0인 첫 객체, `unreferenced_reason_ko`가 있는 첫 출처).
  - 금지 예: `PYEONGTAEK`, `SHANGHAI`, `ROUTE01`, `OFFER_*`, `EV06`, `EVI_*`, `EMP01`, `CA01`, `NPC_*`, `VEN_*`, `SOC10`, `SCI05`.
  - 예외: 금지어 시험의 한국어 낱말(‘부산 사람’, ‘부산시민공원’ 등)은 검사 대상 문장이라 쓴다. 인수 명세 사례 ID(`P0-…`, `CHAR-ACC-…`)도 쓸 수 있지만, 되도록 자료에서 고른다.
- **오류 문구:** 새 검사의 실패 문구는 아래 구현 지시에 적은 그대로 쓴다. 새 시험은 그 문구를 `assertIn`으로 정확히 확인한다. ‘오류가 하나 이상’만 보는 단언(`assertTrue(validator.ERRORS)`)은 새 시험에 쓰지 않는다. 정상 경우(현재 자료에서 오류 0건)도 함께 확인한다.
- **실제 회사 이름:** 새로 쓰는 설명 문장(`unreferenced_reason_ko`, `engine_mapping_note_ko`, `unlinked_reason_ko` 등)에 실제 회사·선사 이름을 넣지 않는다. 출처는 출처 ID로 가리킨다. 고유명사 허용 목록에도 회사 이름을 넣지 않는다.
- **네트워크:** 쓰지 않는다. `chainportal.co.kr`에는 접속하지 않는다.
- **Git:** 커밋·푸시·브랜치 전환·stash를 하지 않는다. 변형 시험 뒤에도 git으로 파일을 되돌리지 않는다.

## 구현 지시

### 0. 시작 기록

다음을 실행해 결과 보고 ‘실행한 검증’에 적는다.
- `git rev-parse --short HEAD`, `git status --short`
- `python3 tools/validate_data.py` 첫 줄. Claude 확인값: `PASS: 23 data documents; 24767 structural/reference/arithmetic checks`.
- `python3 tools/test_validate_data.py`. Claude 확인값: 20개 통과.
- `npx vitest run`. `docs/STATUS.md` ‘병렬 세션 1차 반영 기록’의 값은 31개 파일·891개 통과(할 일 1)다. 실제 값을 적는다.
- `git log --oneline --all -- docs/DESIGN_v0.3.md`. Claude 확인값: 출력 없음(파일이 git 기록에 없다).

### 1. 인수 명세 머리말 (`tests/acceptance_cases.json`)

아래 칸만 바꾸거나 더한다. 문장은 그대로 쓴다.

- `status`(8행): `"PARTIALLY_LINKED_TO_ENGINE_TESTS"`. 캐릭터 파일과 같은 값이다.
- `purpose`(10행): `"코딩 세션에서 쓰는 독립적인 인수 기준과 수동 검산 사례다. 일부 사례는 engine_test_ref·engine_test_names(화면은 ui_test_ref·ui_test_names)로 실행 시험에 연결한다. 연결은 실행 결과가 아니다. 통과 여부는 그때 돌린 npx vitest run 결과로만 말한다."`
- `execution_contract.assertion_paths`(15행): `"개념적 상태 경로다. 연결한 사례는 시험이 실제 상태·설정에 대응시킨다. 대응은 engine_fixture_mapping·engine_mapping_note_ko에 적는다."`
- `execution_contract` 끝에 새 칸 두 개:
  - `test_link_rule`: `"engine_test_ref·ui_test_ref는 저장소 기준 시험 파일 경로이고, engine_test_names·ui_test_names는 그 파일의 describe·it·test 제목(고정 문자열)이다. 자료 검사기는 파일과 제목이 있는지만 확인하고 시험을 돌리지 않는다. 연결하지 않은 사례는 engine_test_ref를 null로 두고 unlinked_reason_ko를 적는다."`
  - `human_review_record_rule`: `"human_review_records에는 사람이 human_review_check를 직접 확인한 사례만 적는다. 항목은 case_id, reviewed_on(YYYY-MM-DD), reviewer_ko(사람의 역할), result(일치 또는 불일치), note_ko다. 자동 검사나 AI 검토는 적지 않는다."`
- `review_summary.unimplemented_items`(929행) 목록을 다음으로 바꾼다:
  1. `"연결하지 않은 사례(engine_test_ref가 null)의 엔진 시험"`
  2. `"미실행 단언(사례별 unexecuted_assertions)"`
  3. `"사람의 실제 화면 검수"`
  4. `"경제 밸런스와 실증 계수 검증"`
  5. `"실제 국가의 회계·상장 규정 대조"`
- `review_summary` 끝에 새 칸: `engine_linked_case_count`(13), `ui_linked_case_count`(1). 값은 2절을 반영한 실제 수다.
- `review_summary.engine_test_pass_claim`(944행)은 `false` 그대로 둔다.
- 파일 끝(최상위 마지막 칸)에 `"human_review_records": []`를 더한다. **빈 목록으로 둔다.** Codex는 사람이 아니므로 기록을 넣지 않는다.
- `schema_version`, `specification_version`, `prepared_on`, `phase_scope`, 나머지 `execution_contract` 칸, `case_count`, `phase_case_counts`, `arithmetic_review`, `required_human_checks`, `added_cases_note`는 그대로 둔다.

`tests/character_acceptance_cases.json` 머리말:
- `purpose`(5행): `"캐릭터·조직·성장 기능의 추가 인수 기준. 일부 사례는 engine_test_ref·engine_test_names(화면은 ui_test_ref·ui_test_names)로 시험에 연결하고, 나머지는 미실행 명세다(status). 연결은 실행 결과가 아니다. 실행 결과는 작업 보고서에 기록한다."`
- 파일 끝에 새 칸 `"summary": {"case_count": 8, "engine_linked_case_count": 3, "ui_linked_case_count": 2}`. 값은 실제 수다(뺄 수 있음 3번을 빼면 `ui_linked_case_count`는 0).
- `status`(3행)는 `PARTIALLY_LINKED_TO_ENGINE_TESTS` 그대로다.

### 2. 사례별 시험 연결 (두 파일)

모든 사례에 `engine_test_ref` 칸을 둔다(문자열 또는 `null`). 이미 있는 값(P0-CITY-01~04, P0-M2A-04, CHAR-ACC-01·02·08)은 그대로 두고, `engine_test_names`를 그 사례 객체의 끝에 더한다(칸 순서는 검사하지 않는다). 이름은 아래 표와 **한 글자도 다르지 않게** 쓴다. 표의 제목은 Claude가 `a13caa4`에서 4절의 규칙(정규식)으로 모두 찾았다.

| 사례 | `engine_test_ref` | `engine_test_names` | 화면 연결 (`ui_test_ref` / `ui_test_names`) |
|---|---|---|---|
| P0-ACC-01 | `src/engine/acceptance-p0-acc.test.ts` | `P0-ACC-01 외상 판매의 현금·채권·이익 분리` | — |
| P0-ACC-02 | `src/engine/acceptance-p0-acc.test.ts` | `P0-ACC-02 외상대금 수금과 중복 수금 방지` | — |
| P0-CITY-01 | (기존) `src/engine/m2a-culture.test.ts` | `P0-CITY-01 읽기 함수·미리 보기` | (기존 `ui_test_ref`) `src/ui/main.test.ts` / `P0-CITY-01 열람·선택·미리 보기·결과 보기 전후 저장 문자열과 위쪽 막대는 같다`, `P0-CITY-01 금융센터는 미구현 표시가 있고 주식·상장 단추가 없다` |
| P0-CITY-02 | (기존) | `P0-CITY-02 비용·완료·중복` | — |
| P0-CITY-03 | (기존) | `P0-CITY-03 출처·경험·쌍별 기록·거래 분리` | — |
| P0-CITY-04 | (기존) | `P0-CITY-04 현지 인력·업무 예약` | — |
| P0-TIME-01 | `src/engine/acceptance-p0-time.test.ts` | `P0-TIME-01 저장·불러오기 후 하루 마감과 사건 적용 재현` | — |
| P1-SEC-01~04 | `null` | (없음) | — |
| P2-IPO-01 | `null` | (없음) | — |
| P0-ACC-13 | `src/engine/m1-trade.test.ts` | `M1 출항 전 취소 — SCENARIO_M1_CANCEL_PREDEPARTURE (P0-ACC-13)` | — |
| P0-ACC-14 | `src/engine/m1-trade.test.ts` | `M1 지연 수락 — SCENARIO_M1_DELAY_ACCEPTED (P0-ACC-14)` | — |
| P0-M2A-01 | `src/engine/m2a-multi.test.ts` | `P0-M2A-01 복수 계약의 자금 예약` | — |
| P0-M2A-02 | `src/engine/m2a-multi.test.ts` | `P0-M2A-02 운송 주선: 고객 화물과 회사 재고 분리` | — |
| P0-M2A-03 | `src/engine/m2a-multi.test.ts` | `P0-M2A-03 선복·직원 중복 예약 방지` | — |
| P0-M2A-04 | (기존) `src/engine/m2a-recruit.test.ts` | `P0-M2A-04 발견·의뢰: 직원 시간을 쓰지만 고용을 만들지 않는다`, `P0-M2A-04 고용: 계약금 한 번, 다음 날부터 배정·급여` | — |
| CHAR-ACC-01 | (기존) `src/engine/m2a-growth.test.ts` | `CHAR-ACC-01 직원별 완료 경험치 중복 방지` | — |
| CHAR-ACC-02 | (기존) | `CHAR-ACC-02 누적 경험치로 레벨·능력 재계산` | `src/ui/growth.test.ts` / `CHAR-ACC-02 90→320은 레벨 3·능력 54/42와 두 문턱 알림을 만든다` (뺄 수 있음 3) |
| CHAR-ACC-03~07 | `null` | (없음) | — |
| CHAR-ACC-08 | (기존) | `CHAR-ACC-08 일반 훈련 비용·급여·예약` | `src/ui/growth.test.ts` / `CHAR-ACC-08은 훈련비·급여 행을 분리하고 완료 +60을 한 번 알린다` (뺄 수 있음 3) |

- 제목의 `—`는 U+2014(줄표)다. 파일에서 복사한다.
- 이름은 사례 ID가 든 `describe` 제목을 우선한다. 화면 시험처럼 `describe` 제목에 ID가 없으면 ID가 든 `it` 제목을 쓴다. `it.each`·`describe.each` 제목과 템플릿 문자열 제목(`${…}`)은 쓰지 않는다.
- `engine_test_ref`가 `null`인 사례에는 `unlinked_reason_ko`를 더한다(`engine_test_names`는 두지 않는다):
  - P1-SEC-01~04: `"P1 주식 기능은 아직 엔진에 없다(game_config의 securities_enabled가 false). P0 완료 조건이 아니다."`
  - P2-IPO-01: `"P2 상장 기능은 아직 엔진에 없다(game_config의 ipo_enabled가 false). P0 완료 조건이 아니다."`
  - CHAR-ACC-03~07: `"이 사례 전체를 실행하는 엔진 시험이 아직 없다. 단계는 docs/IMPLEMENTATION_PLAN.md를 따른다."` (일부 규칙은 다른 시험이 덮을 수 있다. ‘기능 미구현’이라고 단정하지 않는다.)
- 캐릭터 사례의 `status`는 바꾸지 않는다. 연결 3건은 `EXECUTABLE_ENGINE_TEST_LINKED`, 나머지 5건은 `SPECIFICATION_NOT_EXECUTED`다.
- P0-ACC-13·14에는 `engine_mapping_note_ko`를 더한다: `"시험은 같은 기대값을 data/scenarios.json의 이 시나리오 expected_trade_only_usd에서 읽어 USD 최소 단위로 비교한다. 자료 검사기가 두 값이 같은지 확인한다."` (뺄 수 있음 4를 빼면 둘째 문장을 뺀다.)
  - 근거: `m1-trade.test.ts`가 `expectedTradeResult(...)`(`src/content/scenario.ts` 436행)로 시나리오 값을 읽는다. 지금 두 사례의 `expected_numeric`과 시나리오 값은 같다(Claude 확인).

### 3. P0-TIME-01 저장 시점 대응과 미실행 단언

P0-TIME-01 끝에 두 칸을 더한다. 기존 칸(`initial_state`의 `day_phase: AWAITING_INPUT`, `event_applied_count: 0` 포함)은 고치지 않는다.

- `engine_mapping_note_ko`:
  `"명세의 시작 상태(입력 대기 단계이면서 사건 적용 0건)는 엔진에서 함께 성립하지 않는다. 엔진은 날을 열 때(openDay) 사건을 적용한다. 그래서 시험은 저장 시점 두 가지를 모두 본다. (가) 날을 열기 전(PENDING_OPEN)에 저장한다. 분기마다 사건이 0건에서 1건이 된다. (나) 날을 연 뒤(AWAITING_INPUT)에 저장한다. 사건 1건이 이미 적용되어 있고, 복원 뒤 다시 열어도 상태가 같으며 새 공지는 0건이다. 시험 설정은 합성이다. M2 설정을 복사해 급여 통화를 XXX로, 직원을 한 명(하루 급여 wage_expense_each_branch)으로, 사건을 시험용 EVENT_A 하나로 바꾸고, 사건 흐름에서 random_cursor번 추첨해 커서를 만든다. 시작 현금은 simulation_day 전날까지 급여를 낸 뒤 company_cash가 되게 정한다."`
  - 근거: `acceptance-p0-time.test.ts` 17~37행(합성 설정과 준비), 39~59행(두 저장 시점), TASK-0016 결과 18행. 이 문장에는 숫자를 직접 쓰지 않고 명세 칸 이름으로 가리킨다(명세 값이 바뀌어도 맞게).
- `unexecuted_assertions`: 항목 하나.
  ```json
  {
    "assertion": "분기마다 현금이 company_cash_each_branch다(검사비 inspection_expense_each_branch 포함). 마감 재전송 뒤에도 검사비를 다시 빼지 않는다.",
    "status": "미실행 단언",
    "reason_ko": "검사비를 내는 비용 사건은 M3에서 생긴다. 지금 시험은 급여만 뺀 현금을 확인한다.",
    "todo_test_name": "검사비 3(EVENT_A 비용 사건, M3) 반영 뒤 분기마다 현금 company_cash_each_branch 확인"
  }
  ```
  - `todo_test_name`은 `acceptance-p0-time.test.ts` 101행 `it.todo`의 제목과 같다. 4절의 검사기가 이 할 일 시험이 있는지 본다.
  - P0-CITY-03의 기존 `unexecuted_assertions`(퇴사)는 고치지 않는다.

### 4. 검사기: 시험 파일·이름 존재 (`check_test_refs`)

새 함수 `check_test_refs(cases, root=ROOT)`를 만든다. 두 파일의 사례 목록(`cases`, `items`)에 각각 부른다. 종류(`kind`)는 `engine`과 `ui`다.

**제목 찾기 규칙** (모듈 상수와 도우미로 둔다):
```python
TEST_CALL = r'(?<![\w.$])(?:describe|it|test)\(\s*'
TODO_CALL = r'(?<![\w.$])(?:it|test)\.todo\(\s*'

def strip_comments(text):
    """/* … */ 묶음과, 앞 공백 뒤 // 로 시작하는 줄을 지운다. 문자열 안의 // 는 건드리지 않는다."""

def has_title(text, name, call=TEST_CALL):
    text = strip_comments(text)
    return any(re.search(call + re.escape(q + name + q), text) for q in ("'", '"', '`'))
```
- 제목은 `describe(`·`it(`·`test(` 바로 뒤의 고정 문자열이어야 한다. `it.todo(`·`describe.skip(`·`xit(`·`.each(…)(` 뒤의 제목, 주석 속 제목은 시험 이름으로 세지 않는다.
- 사례 ID가 이름에 들어 있는지는 **부분 문자열**(`cid in name`)로 본다. `\b`를 쓰지 않는다. `CHAR-ACC-08은`처럼 ID 바로 뒤에 한글 조사가 붙으면 `\b`가 맞지 않는다.

**사례마다 확인할 것과 실패 문구** (`{kind}`는 `engine` 또는 `ui`):
1. `engine_test_ref` 칸이 없음 → `{cid}: engine_test_ref 키 필요`
2. `engine_test_ref`가 `null`:
   - `unlinked_reason_ko`가 비었거나 없음 → `{cid}: 연결 없는 사례는 unlinked_reason_ko 필요`
   - `engine_test_names`가 비어 있지 않음 → `{cid}: 연결 없는 사례에 engine_test_names가 남음`
3. `ui_test_ref`와 `ui_test_names` 가운데 하나만 있음 → `{cid}: ui_test_ref와 ui_test_names는 함께 필요`
4. `{kind}_test_ref`가 문자열일 때:
   - 경로가 `src/`로 시작하고 `.test.ts`로 끝나며 `..`·절대 경로가 아니어야 한다 → `{cid}: {kind}_test_ref 경로 형식 오류 {path}`
   - 파일이 없음 → `{cid}: {kind}_test_ref 파일 없음 {path}`
   - `{kind}_test_names`가 문자열 목록이 아니거나 비었음 → `{cid}: {kind}_test_names 필요`
   - 이름에 `${`가 있음 → `{cid}: {kind} 시험 이름은 고정 문자열이어야 함 {name}`
   - 이름이 파일에 제목으로 없음 → `{cid}: {kind} 시험 이름 없음 {name}`
   - 어느 이름에도 사례 ID가 없음 → `{cid}: {kind}_test_names에 사례 ID가 든 이름 필요`
5. `unexecuted_assertions`의 항목에 `todo_test_name`이 있으면, `engine_test_ref` 파일에서 `TODO_CALL`로 찾는다(주석은 지운 뒤). 없거나 `engine_test_ref`가 `null`·없는 파일이면 → `{cid}: 미실행 단언의 할 일 시험 없음 {name}`

`check_culture`의 215행은 `check(isinstance(case.get('engine_test_ref'), str), cid + ': 문화 엔진 시험 연결 필요')`로 바꾼다. 파일과 이름의 확인은 이 함수가 한다. 214·216~221행은 그대로 둔다.

### 5. 검사기: 요약·상태·통과 주장·사람 검토 기록 (`check_acceptance_summary`)

새 함수 `check_acceptance_summary(acceptance, character_doc)`. 662행 `len(cases) == 18`과 752~764행의 고정값(`== 8`, 연결 ID 집합, 경로 문자열, `== 3`)을 이 함수로 대신한다. 658·660·661행(요약 개수·단계 개수·ID 중복)과 그 문구는 그대로 둔다.

- 연결 수는 `engine_test_ref`가 문자열인 사례 수, 화면 연결 수는 `ui_test_ref`가 문자열인 사례 수다.
- 핵심 파일:
  - `review_summary.engine_linked_case_count` 불일치 → `review_summary engine_linked_case_count matches cases`
  - `review_summary.ui_linked_case_count` 불일치 → `review_summary ui_linked_case_count matches cases`
  - 연결 수가 0보다 크고 전체보다 작은데 `status`가 `PARTIALLY_LINKED_TO_ENGINE_TESTS`가 아님 → `acceptance status matches linked cases`
  - `review_summary.engine_test_pass_claim`이 `False`가 아님 → `acceptance file makes no engine pass claim`
- 캐릭터 파일:
  - `summary.case_count` 불일치 → `character summary case_count matches items`
  - `summary.engine_linked_case_count` 불일치 → `character summary engine_linked_case_count matches items`
  - `summary.ui_linked_case_count` 불일치 → `character summary ui_linked_case_count matches items`
  - 파일 `status` 규칙은 핵심 파일과 같다 → `character status matches linked items`
  - 사례 `status`가 `EXECUTABLE_ENGINE_TEST_LINKED`이면 연결, `SPECIFICATION_NOT_EXECUTED`이면 미연결이어야 한다. 다른 값이거나 어긋남 → `{cid}: status와 engine_test_ref 연결 불일치`
- 사람 검토 기록(`acceptance['human_review_records']`):
  - 칸이 없거나 목록이 아님 → `human_review_records 목록 필요`
  - 항목 `i`(0부터)의 칸은 `case_id`, `reviewed_on`, `reviewer_ko`, `result`, `note_ko`뿐이다.
    - 모르는 칸 → `사람 검토 기록 {i}: 알 수 없는 키 {key}`
    - `case_id`가 사례에 없음 → `사람 검토 기록 {i}: 없는 사례 {case_id}`
    - `reviewed_on`이 `^\d{4}-\d{2}-\d{2}$`가 아님, `reviewer_ko`가 빈 문자열, `result`가 `일치`·`불일치`가 아님, `note_ko`가 문자열이 아님 → `사람 검토 기록 {i}: {field} 오류`

### 6. 검사기: 부서·팀 이름 (B11, `check_organization_names`)

새 함수 `check_organization_names(character_cases, organization_doc)`. `organization_doc`은 `documents['organization']` 전체다(`items`의 팀, `departments`의 부서).
- 각 사례의 `setup`과 `expected`(사전일 때)를 본다.
  - `department` 값이 부서 `name_ko`에 없음 → `{cid}: organization.json에 없는 부서 이름 {name}`
  - `permanent_team` 값이 팀 `name_ko`에 없음 → `{cid}: organization.json에 없는 팀 이름 {name}`
  - 같은 객체에 둘 다 있고, 팀의 `department_id`가 가리키는 부서 이름이 `department`와 다름 → `{cid}: 팀과 부서 불일치 {team}/{dept}`
- 지금 자료(CHAR-ACC-04: 운영사업부·물류운영팀)는 통과한다. 문구 속 ‘물류운영팀’(`actions`의 문장)은 검사하지 않는다.

### 7. 검사기: 일반화 금지어 정밀도와 상속 culture 블록 (PPL-03 잔여)

**R1V-2 상속 culture 블록**
- 모듈 수준 `resolve_scenario(scenarios, sid)`를 만든다. `validate_cancellation`의 `resolve`(71~74행)와 같은 동작이다. `validate_cancellation`이 이 도우미를 쓰게 바꿔도 된다(동작 불변).
- 168~170행을 상속을 푼 레코드로 검사하게 바꾼다. 상속된 culture 블록이 있는데 풀린 `culture_enabled`가 `True`가 아니면 실패한다. 문구는 기존과 같다: `{sid}: culture 블록은 culture_enabled 필요`.
- 지금 자료는 통과한다(`base_scenario_id`가 가리키는 부모에 culture 블록이 없다).
- 기존 시험 `test_any_culture_block_requires_enabled`는 부모에 culture 블록을 넣는다. 바꾼 뒤에는 자식 시나리오의 같은 문구도 함께 나온다. 그 시험은 `assertIn`이므로 그대로 통과해야 한다.

**R1V-4 폭 0 문자**
- 금지어를 맞추기 전에 `finding_ko`에서 유니코드 범주 `Cf` 글자(U+200B·U+200C·U+200D·U+2060·U+FEFF·U+00AD 등)를 지운다. 그다음 NFC로 정규화한다.

**R1V-3·D4 고유명사 오탐**
- 모듈 상수 `GENERALIZATION_PROPER_NOUNS = ('부산시민공원', '한국소비자원', '국민연금')`를 둔다. 금지어를 맞추기 전에 이 낱말을 공백 하나로 가린다.
  - TASK-0011 기록에는 ‘고유명사 오탐’이라는 분류만 있고 낱말 목록은 없다. 세 낱말은 Claude가 고른 공공 장소·기관의 대표 예다. 지금은 `\s*` 맞춤 때문에 ‘부산 시민’·‘한국 소비자’·‘국민’에 걸린다.
  - 붙여 쓴 정확한 표기만 가린다. 가린 뒤에도 나머지 문장의 금지어는 그대로 검사한다.
  - 회사 이름(예: 은행 이름)은 목록에 넣지 않는다. 실제 회사 이름은 플레이어 문장에 쓰지 않는다. 그런 문장은 계속 걸려도 된다.
- 금지어 목록(207행)과 문구는 바꾸지 않는다. 정규화·가림 순서: Cf 제거 → NFC → 고유명사 가림 → 금지어 맞춤.
- 이 정규화는 `finding_ko`에만 쓴다. `not_claimed_ko`는 지금처럼 검사하지 않는다.

### 8. 출처 정리 (SRC-02)

**‘쓰임’의 정의** (`source_usage(documents, root=ROOT)`가 출처 ID마다 쓰임 종류 집합을 돌려준다):
- `data`: `data/*.json` 가운데 `sources.json`을 뺀 문서의 어느 문자열 값이 출처 ID와 같다.
- `references`: `references/*.json`의 어느 문자열 값이 출처 ID 또는 그 출처의 `url`과 같다. (`guild3_reference.json`은 G3-S01~S08을 URL로 인용한다.)
- `design`: `docs/DESIGN_v0.4.md`에 `[ID]` 또는 `[ID,` 꼴의 인용이 있다(`re.escape` 사용).
- `sources.json` 안의 문장(예: 다른 출처의 `scope_ko`)은 쓰임으로 세지 않는다.

**Claude 확인값** (`a13caa4`, 출처 74건): data 33건, references 23건(ID로 15건, URL로만 8건: G3-S01~S08), design 16건(그 가운데 design뿐인 것 14건), 어디에도 없음 4건이다. 종류는 겹칠 수 있다.
- 쓰이지 않는 4건: PORT-HAMBURG-2025(562행), DURBAN-PORT(656행), PIRAEUS-2025(686행), GPPC-ROUTE-2026-01(846행).
- `local_path`가 있는데 파일이 없는 것은 DESIGN-V03(13행 `docs/DESIGN_v0.3.md`) 하나다.

**자료 고침** (`data/sources.json`, 레코드 끝에 칸을 더한다. 지우는 레코드는 없다.)
- PORT-HAMBURG-2025: `"superseded_by": ["PORT-ROTTERDAM-2025"]`, `"unreferenced_reason_ko": "로테르담 근거를 원문을 읽은 PORT-ROTTERDAM-2025로 옮긴 뒤 자료에서 쓰지 않는다(이 기록의 scope_ko ‘2026-10-05 대조’). 옛 대조 기록(TASK-0003)을 위해 남긴다."`
- DURBAN-PORT: `"superseded_by": ["AFRICAPORTS-TNPA-2024"]`, `"unreferenced_reason_ko": "더반 근거를 AFRICAPORTS-TNPA-2024로 옮긴 뒤 자료에서 쓰지 않는다(이 기록의 scope_ko ‘2026-10-05 대조’). 옛 대조 기록(TASK-0003)을 위해 남긴다."`
- PIRAEUS-2025: `"superseded_by": ["PORTECON-EU-2025", "PPA-FY2025"]`, `"unreferenced_reason_ko": "피레우스 근거를 PORTECON-EU-2025·PPA-FY2025로 옮긴 뒤 자료에서 쓰지 않는다(이 기록의 scope_ko ‘2026-10-05 대조’). 옛 대조 기록(TASK-0003)을 위해 남긴다."`
- GPPC-ROUTE-2026-01: `"unreferenced_reason_ko": "평택 노선 근거표(docs/ai/design/PYEONGTAEK-route-basis.md의 S5)와 DECISIONS ‘평택 본사 전환’의 항로 수 근거다. 자료의 노선 요일표(routes.json schedule_basis)는 SINOKOR-ROT-2026만 인용한다. 자료에 연결할지는 Claude가 정한다."` (`superseded_by`는 두지 않는다.)
- DESIGN-V03: `"local_path": null`로 바꾸고, 끝에 `"local_path_note_ko": "v0.3 설계 문서 파일은 이 저장소와 git 기록에 없다. 후속 판은 docs/DESIGN_v0.4.md다."`를 더한다.
  - 0절의 `git log` 결과가 비어 있지 않으면 이 문장 대신 그 커밋 해시를 적고 ‘질문’에 남긴다.
  - 이 출처를 인용한 자료 값(`sources.json` 밖 15개 자료 문서, 예: `culture_activities`·`events`·`goods`·`scenarios`)은 바꾸지 않는다. DESIGN-V03은 계속 ‘쓰이는 출처’다.

**검사기** (`check_sources(documents, root=ROOT)`):
- `local_path`가 문자열인데 `root` 아래 파일이 없음 → `{sid}: local_path 파일 없음 {path}`
- 쓰임이 없는데 `unreferenced_reason_ko`가 비었거나 없음 → `{sid}: 쓰이지 않는 출처는 unreferenced_reason_ko 필요`
- 쓰임이 있는데 `unreferenced_reason_ko`가 있음(낡은 표시) → `{sid}: 쓰이는 출처에 unreferenced_reason_ko가 남음`
- `superseded_by`의 ID가 출처에 없음 → `{sid}: superseded_by에 없는 출처 {target}`
- `superseded_by`의 출처도 쓰임이 없음 → `{sid}: superseded_by의 출처도 쓰이지 않음 {target}`
- 출처 스키마(`schemas/sources.schema.json`)는 고치지 않는다.

### 9. 검사기: 교과 연결 P0 검사 (CUR-04, `check_curriculum_stages`)

- 규칙(TASK-0021 351행 제안): `stage`가 `P0`인 자료 객체의 `curriculum_refs`는 `priority`에 `P0`로 **시작하는** 표지가 하나 이상 있는 연결만 가리킨다. `P0 보고`·`P0 설명`도 P0다.
- `curriculum_links`를 뺀 모든 `data/*.json` 객체를 걷는다(`walk`). `stage` 칸이 없는 객체는 검사하지 않는다. 지금 `curriculum_refs`가 있으면서 `stage`가 없는 객체는 0개다(Claude 확인).
- `curriculum_refs`의 ID가 교과 연결에 없으면 예외를 내지 말고 건너뛴다. 518~523행의 기존 검사가 이미 실패로 보고한다.
- 지금 위반은 7쌍이다(TASK-0021 표 C와 같다). 승인된 예외가 아니라 **미해결 목록**으로 상수에 둔다:
  ```python
  # TASK-0021 표 C의 미해결 7쌍. 승인된 예외가 아니다. W2-0b에서 자료를 고치면 여기서 지운다.
  PENDING_P0_CURRICULUM_LINKS = frozenset({
      ('culture_activities', 'CA01', 'SOC10'), ('contacts', 'NPC_MARKET', 'SOC10'),
      ('contacts', 'NPC_GUIDE', 'SOC08'), ('contacts', 'NPC_GUIDE', 'SOC12'), ('contacts', 'NPC_GUIDE', 'SCI05'),
      ('venues', 'VEN_CULTURE', 'SOC12'), ('events', 'EV06', 'SCI09'),
  })
  ```
  튜플은 (문서 이름 `file.stem`, 객체 `id`, 연결 ID)다.
- 함수 서명: `check_curriculum_stages(documents, curriculum, pending=PENDING_P0_CURRICULUM_LINKS)`. 찾은 미해결 쌍의 집합을 돌려준다(출력 문구에 쓴다).
  - 미해결 목록에 없는 위반 → `{file}/{oid}: P0 항목이 P0 표지 없는 교과 연결을 가리킴 {ref}`
  - 미해결 목록의 쌍이 자료에서 사라짐(낡은 목록) → `교과 연결 미해결 목록이 낡음 {file}/{oid} {ref}`
- 자료(`curriculum_links.json`·`culture_activities.json` 등)는 고치지 않는다.
- 참고: 지금 P0 객체가 `P0 보고`·`P0 설명` 표지 연결을 가리키는 경우가 5곳 있다(사건 자료). 이들은 통과해야 한다.

### 10. 교과 연결 개수 (`check_curriculum_counts`, 뺄 수 있음 2)

499~502행의 47·18·6·23 고정값과 그 문구는 **그대로 둔다**. 교과 연결 47개는 설계 문서에서 옮긴 고정 목록이다. 바꿀 때는 Claude가 원문을 대조한 뒤 검사기 값도 함께 고친다(W2-0b). 자료에서 읽으면 이 보호가 사라진다(‘예상 질문’의 표 개수 행과 같은 이유).

그 옆에 새 함수 `check_curriculum_counts(curriculum_doc, curriculum)`를 더한다. 자료의 요약 칸 `counts`(30행)가 실제 연결 목록과 맞는지 본다. 고정값과 요약이 둘 다 있어야 한쪽만 고친 변경을 잡는다.
- `len(curriculum)`과 `counts.total` 불일치 → `curriculum: counts.total 불일치`
- 연결의 `group`별 수와 `counts.by_group` 불일치 → `curriculum: counts.by_group.{group} 불일치`
- 연결의 `selection`별 수와 `counts.by_selection` 불일치 → `curriculum: counts.by_selection.{selection} 불일치`
- 연결 ID 머리와 `group`의 대응(`social`→`SOC`, `ethics`→`ETH`, `science`→`SCI`)이 어긋남 → `{id}: 연결 ID 머리와 group 불일치`
- 504~508행(쪽 차이·출처·원본 해시)은 그대로 둔다.

### 11. P0-ACC-13·14 기대값 대조 (`check_acceptance_fixture_numbers`, 뺄 수 있음 4)

- 함수 서명 `check_acceptance_fixture_numbers(cases, scenarios)`. `scenario_id`의 시나리오 레코드에 `expected_trade_only_usd`가 있는 사례마다, 사례의 `expected_numeric`이 그 값과 같아야 한다.
- 불일치 → `{cid}: expected_numeric와 시나리오 expected_trade_only_usd 불일치`
- 지금 해당 사례는 P0-ACC-13·14 두 건이고 둘 다 같다(Claude 확인).

### 12. 역방향 검사 (`check_test_title_links`, 뺄 수 있음 1)

- 함수 서명 `check_test_title_links(cases, root=ROOT)`. `cases`는 두 파일의 사례를 합친 목록이다.
- `root/src` 아래 모든 `*.test.ts`(`rglob`)에서, 주석을 지운 뒤 `describe(`·`it(`·`test(` 바로 뒤 고정 문자열 제목을 모은다. 제목 찾기 예: ``TEST_CALL + r"""(?:'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`$\\]*)`)"""``(`${`가 든 템플릿 제목은 빠진다). Claude가 이 꼴로 `a13caa4`를 훑어 위반 0건을 확인했다. 제목 안의 사례 ID를 다음으로 찾는다:
  `(?<![A-Za-z0-9-])(?:P[0-2]-[A-Z0-9]+-\d{2}|CHAR-ACC-\d{2})(?!\d)` (`\b`를 쓰지 않는다. 4절 참조)
- 그 ID의 사례가 없음 → `{path}: 시험 제목의 사례 ID가 인수 명세에 없음 {cid}`
- 그 사례의 `engine_test_ref`·`ui_test_ref` 어느 쪽도 그 파일이 아님 → `{path}: 시험 제목의 {cid}가 그 사례의 시험 연결에 없음`
- `{path}`는 저장소 기준 경로(`src/…`)다.
- Claude 확인값: `a13caa4`에서 ID가 든 제목은 9개 파일에 있고, 2절 표의 연결과 모두 맞는다. `m2a-growth.test.ts`의 `it('CHAR-ACC-01 같은 완료 사건도 …')`처럼 연결 이름에 없는 `it` 제목도 같은 파일이면 통과다.

### 13. 출력 문구와 낡은 주석

- 2행 문서 문자열: `"""Validate bundled data, arithmetic references and acceptance-test links. It does not run the game engine or its tests.`
- 663행 주석: `# Reference arithmetic only. Engine behaviour is checked by the linked tests (npx vitest run).`
- 782행 `PASS:` 줄의 형식은 그대로 둔다.
- 783·784행을 자료에서 센 값으로 바꾼다:
  ```python
  print(f'{n_core + n_char} acceptance specifications included ({n_core} core + {n_char} character); '
        f'linked by file and test name: {core_engine} core and {char_engine} character to engine tests, '
        f'{core_ui + char_ui} to screen tests. This validator checks that those files and names exist; it does not run them (npx vitest run).')
  print(f'Unlinked specifications: {n_core - core_engine} core, {n_char - char_engine} character. '
        f'Curriculum: {len(pending_found)} P0 item links without a P0 label remain on the pending list (not approved exceptions).')
  ```
- 기대 출력(Claude 계산): 26 (18 core + 8 character), 13 core·3 character 엔진 연결, 화면 연결 3(뺄 수 있음 3을 빼면 1), 미연결 5·5, 교과 미해결 7. 곧 둘째·셋째 줄은 다음과 글자까지 같다(뺄 수 있음 3을 빼면 `3 to screen tests`가 `1 to screen tests`):
  ```
  26 acceptance specifications included (18 core + 8 character); linked by file and test name: 13 core and 3 character to engine tests, 3 to screen tests. This validator checks that those files and names exist; it does not run them (npx vitest run).
  Unlinked specifications: 5 core, 5 character. Curriculum: 7 P0 item links without a P0 label remain on the pending list (not approved exceptions).
  ```

### 14. `main` 연결

- 새 함수 `check_test_refs`(두 파일 각각), `check_acceptance_summary`, `check_organization_names`, `check_sources`, `check_curriculum_stages`, `check_curriculum_counts`, `check_acceptance_fixture_numbers`, `check_test_title_links`는 모두 `main`에서 실제 자료로 한 번 이상 부른다. 뺀 항목(시간)의 함수는 빼도 된다.
- 함수 시험만 통과하고 `main`에서 부르지 않으면 실제 자료를 검사하지 않는다. 그래서 아래 `MainWiringTest`로 호출을 고정한다.
- `main`은 모듈 전역 이름으로 부른다(`check_sources(...)`). 다른 이름에 묶어 두지 않는다. 그래야 `unittest.mock.patch.object(validator, '<함수>', wraps=...)`가 호출을 본다.

## 테스트

`tools/test_validate_data.py`에 클래스를 더한다. 기존 클래스·시험은 고치지 않는다. 새 시험마다 `validator.ERRORS.clear()` 뒤에 함수를 부르고, **정확한 문구**를 `assertIn`으로 확인한다. 자료는 `copy.deepcopy`한 사본만 바꾼다. 아래 메서드 이름을 그대로 쓴다(변형 시험 표가 이 이름을 쓴다).

**`AcceptanceLinkTest`** (두 인수 명세 파일을 읽어 쓴다)
- `test_current_links_pass`: 현재 두 파일에 `check_test_refs`·`check_acceptance_summary`를 부르면 오류 0건이다.
- `test_missing_test_file_rejected`: 연결된 첫 사례의 `engine_test_ref`를 없는 경로(`src/engine/no-such.test.ts`)로 → 파일 없음 문구.
- `test_missing_test_name_rejected`: 연결된 첫 사례의 첫 이름 끝에 ` 없음`을 붙임 → 이름 없음 문구.
- `test_todo_skip_comment_and_prefixed_calls_are_not_titles`: `tempfile.TemporaryDirectory()`에 `src/engine/fake.test.ts`를 만든다. 내용에 `it.todo('<cid> 할 일')`, `describe.skip('<cid> 건너뜀', () => {})`, `xit('<cid> 엑스', () => {})`, `// it('<cid> 주석', () => {})`, `/* describe('<cid> 묶음 주석', …) */`, `it.each([1])('<cid> 반복', () => {})`, `describe('<cid> 정상', () => {})`를 넣는다. 각 호출은 한 줄에 하나씩 쓴다. 사례 하나의 사본을 이 파일에 연결하고(`engine_test_ref`는 `src/engine/fake.test.ts`, `engine_test_names`는 일곱 제목) `root`를 임시 폴더로 준다. 사본에서 `ui_test_ref`·`ui_test_names`·`unexecuted_assertions`는 지운다(임시 폴더에 없는 파일 때문에 다른 문구가 섞이지 않게). 앞의 여섯 제목은 각각 이름 없음 문구가 나오고(`subTest`로 하나씩 `assertIn`), `<cid> 정상`의 이름 없음 문구는 없다(`assertNotIn`). `<cid>`는 자료에서 고른 사례 ID다.
- `test_title_without_case_id_rejected`: 같은 임시 파일 방식으로, 사례 ID가 없는 제목만 연결 → 사례 ID 문구.
- `test_template_title_rejected`: 이름을 `` `${…}` `` 꼴로 → 고정 문자열 문구.
- `test_unlinked_case_requires_reason`: 미연결 사례의 `unlinked_reason_ko`를 지움 → 문구. 같은 사례에 `engine_test_names`를 넣음 → 남음 문구. `engine_test_ref` 칸 자체를 지움 → 키 필요 문구.
- `test_todo_link_checked`: `todo_test_name`이 있는 사례(자료에서 찾음)의 그 값을 바꿈 → 할 일 시험 없음 문구.
- `test_summary_and_status_must_match`: 핵심 `engine_linked_case_count`·`ui_linked_case_count`를 1씩 바꿈, 캐릭터 `summary`의 세 값을 바꿈, 핵심 `status`를 옛 값으로, 캐릭터 사례 하나의 `status`를 반대로 → 각각의 문구.
- `test_pass_claim_rejected`: `engine_test_pass_claim`을 `True`로 → 문구.
- `test_human_review_records`: 올바른 기록 하나(자료의 첫 사례 ID, `2026-10-10`, `교사`, `일치`, 빈 `note_ko`)는 오류 0건. 없는 사례 ID, `result: '통과'`, 날짜 `10/10`, 모르는 칸 → 각각의 문구. 목록 칸을 지움 → 목록 필요 문구.
- `test_reverse_title_link` (뺄 수 있음 1): 임시 폴더의 시험 파일 제목에 (a) 없는 사례 ID, (b) 연결되지 않은 파일에 있는 실제 사례 ID → 각각의 문구. 현재 저장소 `root`로는 오류 0건.

**`OrganizationNamesTest`**
- `test_current_names_pass`
- `test_unknown_team_rejected`: `setup`에 `permanent_team`이 있는 사례(자료에서 찾음)의 값을 `'물류팀'`으로 → `{cid}: organization.json에 없는 팀 이름 물류팀`.
- `test_unknown_department_rejected`: `department`를 없는 이름으로 → 문구.
- `test_team_department_mismatch_rejected`: `department`를 그 팀의 부서가 아닌 다른 실제 부서 이름(조직 자료에서 고름)으로 → 불일치 문구.

**`GeneralizationPrecisionTest`** (`CultureReportsTest().fixtures()`·`errors()` 방식을 쓴다. 활동 ID는 M2 culture 블록의 첫 활동으로 자료에서 고른다.)
- `test_zero_width_inside_banned_word_rejected`: 시험 소스에는 보이지 않는 글자를 그대로 넣지 말고 `\u` 탈출 문자로 쓴다. 입력과 기대 금지어:
  - `'부산\u200b사람들은 모두 그렇다.'` → `부산 사람`
  - `'한\u200d국인은 모두 그렇다.'` → `한국인`
  - `'국\u2060민은 모두 그렇다.'` → `국민`
  - `'상인\ufeff들은 모두 그렇다.'` → `상인들은`
  - `'부산\u00ad시민들은 모두 그렇다.'` → `부산 시민`
  - 각각 `subTest`로 `assertIn(aid + ': finding_ko 일반화 금지어 ' + word, errors)`를 확인한다.
- `test_public_proper_nouns_allowed`: `'부산시민공원에서 상자를 봤어요.'`, `'한국소비자원 자료를 읽었어요.'`, `'국민연금 안내문을 봤어요.'` → `errors() == []`.
- `test_proper_noun_does_not_hide_banned_word`: `'부산시민공원에서 만난 부산 사람은 모두 그렇다.'` → `… 일반화 금지어 부산 사람` 문구가 있다.
- `test_inherited_culture_block_requires_enabled`: `base_scenario_id`가 있는 첫 시나리오(자식)와 그 부모를 자료에서 찾는다. 부모에 culture 블록(culture 블록이 있는 시나리오의 사본)과 `culture_enabled: True`를 준다. 자식에는 `culture_enabled: False`만 준다 → `{자식}: culture 블록은 culture_enabled 필요`가 있고 부모 문구는 없다. 자식을 `True`로 바꾸면 자식 문구가 없다.

**`SourceUsageTest`** (`data/*.json` 전체를 `{stem: 문서}`로 읽는 도우미를 둔다.)
- `test_current_sources_pass`: `check_sources` 오류 0건.
- `test_usage_kinds`: `source_usage` 결과에서 쓰임이 없는 출처 집합이 `unreferenced_reason_ko`를 가진 출처 집합과 같다. 쓰임이 `{'design'}`뿐인 출처, `{'references'}`뿐이면서 ID가 `references/*.json`에 문자열로 없는 출처(URL로만 쓰임), `data`를 포함하는 출처가 각각 하나 이상 있다.
- `test_unused_source_needs_reason`: `unreferenced_reason_ko`가 있는 첫 출처에서 그 칸을 지움 → 문구.
- `test_used_source_with_stale_reason_rejected`: 쓰임에 `data`가 있는 첫 출처에 `unreferenced_reason_ko`를 더함 → 문구.
- `test_unknown_superseded_by_rejected`: `superseded_by`가 있는 첫 출처의 값을 `['NO-SUCH-SOURCE']`로 → `{sid}: superseded_by에 없는 출처 NO-SUCH-SOURCE`.
- `test_unused_superseded_target_rejected`: `superseded_by`를 쓰임 없는 다른 출처 ID로 → 문구.
- `test_missing_local_path_rejected`: `local_path`가 문자열인 첫 출처의 값을 `docs/NO_SUCH_FILE.md`로 → 문구.

**`CurriculumStageTest`**
- `test_current_pending_pairs_match`: 현재 자료로 오류 0건이고, 돌려준 집합이 `PENDING_P0_CURRICULUM_LINKS`와 같다.
- `test_new_p0_link_without_p0_label_rejected`: `stage`가 P0이고 `curriculum_refs`가 있는 첫 객체에, P0 표지가 없고 그 객체가 아직 가리키지 않는 연결 하나를 더함 → 문구.
- `test_stale_pending_pair_rejected`: 미해결 목록의 첫 쌍(정렬 기준)에서 그 객체의 `curriculum_refs`에서 그 연결을 뺌 → 낡음 문구.
- `test_p0_report_label_counts_as_p0`: P0 객체에 `P0 `로 시작하는(공백 포함) 표지만 있는 연결을 더함 → 그 쌍의 위반 문구가 없다.
- `test_counts_read_from_data` (뺄 수 있음 2): 현재 오류 0건. `counts.total`·`by_group` 한 값·`by_selection` 한 값을 바꿈 → 각각의 문구. 연결 하나의 `group`을 다른 group 값으로 바꿈 → `{id}: 연결 ID 머리와 group 불일치`(그 group의 개수 문구도 함께 나와도 된다).

**`AcceptanceFixtureNumbersTest`** (뺄 수 있음 4)
- `test_m1_case_matches_scenario_fixture`: 현재 오류 0건. 해당 사례(자료에서 찾음)의 `expected_numeric` 값 하나를 1 바꿈 → 문구.

**`MainWiringTest`**
- `test_main_calls_new_checks`: 14절의 새 함수마다 `unittest.mock.patch.object(validator, name, wraps=getattr(validator, name))`를 건다(`contextlib.ExitStack`). `contextlib.redirect_stdout(io.StringIO())` 안에서 `validator.ERRORS.clear()` 뒤 `validator.main()`을 부른다. 각 모의 객체가 한 번 이상 불렸는지 확인한다. `check_test_refs`는 두 번 이상이다.
  - `main`의 반환값과 `ERRORS`는 단언하지 않는다. 작업 중에는 `MANIFEST.json` 해시가 맞지 않아 1을 돌려줄 수 있다.
  - 표준 라이브러리(`unittest.mock`, `contextlib`, `io`)만 쓴다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| `engine_test_ref`를 객체 목록으로 바꿀까 | 바꾸지 않는다. 문자열 경로를 유지하고 `engine_test_names`를 더한다. 기존 검사·문서·`m2a-*` 시험이 이 칸을 문자열로 안다. |
| 시험 이름에 `it` 제목까지 모두 적나 | 2절 표만 적는다. 사례 ID가 든 `describe` 제목을 우선한다. |
| P0-TIME-01의 `it` 제목(`${timing}: …`) | 쓰지 않는다. 템플릿 제목이다. `describe` 제목과 설명 문장(3절)으로 대신한다. |
| 연결했으니 통과로 표시하나 | 아니다. `engine_test_pass_claim`은 `false`다. 검사기는 존재만 본다. |
| 검사기가 vitest를 돌리거나 목록을 받아 올까 | 아니다. 표준 라이브러리 정적 검사만 한다. node를 부르지 않는다. |
| `human_review_records`를 채우나 | 비워 둔다. 사람이 확인한 기록만 들어간다. |
| 표 개수 고정값(`expected_counts` 등)도 자료에서 읽나 | 읽지 않는다. 설계 결정을 지키는 보호 장치다. 자료에서 읽으면 늘 참이 된다. 교과 연결 47·18·6·23도 그대로 둔다. 이번에 자료에서 읽는 것은 인수 명세 개수·연결뿐이다. 교과 연결은 고정값을 두고 `counts` 대조를 더한다. |
| M1·M2 검산의 고정 ID(`ROUTE01`·`OFFER_FWD_01`·`EMP04`) | 고치지 않는다. ‘범위 밖 발견’에 줄 번호만 적는다. |
| P0-CITY 대응표의 고정값(210~219행) | 고치지 않는다. 215행만 4절대로 바꾼다. |
| 쓰이지 않는 출처를 지우나 | 지우지 않는다. 표시만 한다. |
| `superseded_by`의 근거 | 각 레코드 `scope_ko`의 ‘(2026-10-05 대조: … 옮겼다)’ 문장. 8절 값 그대로. |
| GPPC-ROUTE-2026-01을 `routes.json`에 연결할까 | 하지 않는다(`routes.json`은 범위 밖). 표시만 하고 ‘질문’에 남긴다. |
| DESIGN-V03을 DESIGN-V04로 바꿀까 | 바꾸지 않는다. `local_path`만 `null`로 하고 설명을 단다. |
| 출처 스키마에 새 칸을 적을까 | 적지 않는다. `additionalProperties: true`라 통과한다. 필요하면 ‘질문’에 적는다. |
| 교과 7쌍을 자료에서 고칠까 | 고치지 않는다. 미해결 목록에만 둔다. 승인된 예외로 부르지 않는다. |
| `stage`가 없는 객체의 교과 연결 | 검사하지 않는다. 그런 객체 수를 결과 보고에 적는다(지금 0). |
| 고유명사 목록에 더 넣을 것(예: ‘국민소득’ 같은 경제 용어) | 넣지 않는다. 이번 목록은 3개다. 후보는 ‘질문’에 적는다. |
| 회사 이름 오탐(예: 은행 이름의 ‘국민’) | 목록에 넣지 않는다. 실제 회사 이름은 플레이어 문장에 쓰지 않으므로 걸려도 된다. 이 낱말을 시험 문자열에도 쓰지 않는다. |
| 도시 금지어를 `world.json` 이름에서 만들까 | 만들지 않는다. 207행 목록을 그대로 둔다. |
| 로더가 `culture_enabled`를 무시하는 문제 | 고치지 않는다(`src/**` 범위 밖). ‘범위 밖 발견’에 적는다. |
| 문서가 낡게 됨(IMPLEMENTATION_PLAN 80행 ‘P0-TIME-01 연결 시험 없음’·연결 15건, CHARACTERS 75행 ‘검사기가 대조하지 않는다’, VALIDATION 38·52·53행의 개수·줄 번호) | 고치지 않는다. ‘범위 밖 발견’에 줄 번호와 바뀐 사실을 적는다. 병합 때 Claude가 고친다. |
| 자료 검사 건수 | 바뀐다. 시작·끝 값을 적는다. 정해진 기대 수는 없다. |
| 파이썬 시험 수 | 기존 20개 그대로 통과 + 새 시험. 새 시험 수는 정하지 않는다. 위 목록을 모두 덮으면 된다. |
| `npm run typecheck`가 JSON 모양 변경으로 실패하면 | TS 파일은 고치지 않는다. JSON 칸 이름·값 형식을 다시 보고, 그래도 안 되면 실패 출력과 함께 보고한다. |
| 시작 기준 개수가 STATUS 값과 다를 때 | 실제 값을 적고 계속한다. |
| `review_checks.sh`가 이 작업과 무관한 원인으로 실패할 때 | 고치지 않는다. 실패 출력과 원인 추정을 ‘범위 밖 발견’에 적는다. 이 작업 파일 때문이면 고친다. |
| 2절 표의 제목이 파일에 없을 때 | 코드가 사실이다. 시험 파일을 고치지 말고, 실제 제목을 찾아 쓰고 ‘설계 판단’에 적는다. |
| 병렬 TASK-0023이 `src/ui` 시험 제목을 바꾸거나 사례 ID가 든 제목을 더하면 | 이 작업은 `a13caa4`의 제목만 쓴다. `src/**`는 고치지 않는다. 병합 때 Claude가 연결을 맞춘다. |
| `MANIFEST.json`이 다른 작업과 겹치면 | 손으로 맞추지 않는다. 생성 명령으로만 다시 만든다. |

## 완료 조건

1. 구현 지시 0~14가 반영되었다(뺀 항목은 ‘미충족(시간)’).
2. **검증**
   - 순서: 결과 보고(`docs/ai/tasks/results/TASK-0022.md`)를 먼저 끝까지 쓴다. 그다음 `python3 tools/build_package.py --manifest-only`를 실행한다. 결과 보고 파일도 `MANIFEST.json`에 들어가므로, 그 뒤에 보고를 고치면 생성 명령과 아래 두 검사를 다시 돌린다.
   - `bash tools/ai/review_checks.sh a13caa4` → `검사 11종, 실패 0종 (모드: 수정)`.
   - 이어서 `bash tools/ai/review_checks.sh --check a13caa4` → `검사 12종, 실패 0종 (모드: 확인)`.
   - vitest 파일 수·시험 수가 0절의 시작 값과 같다.
   - `python3 tools/test_validate_data.py`: 기존 20개 + 새 시험이 모두 통과한다. 새 시험 수를 적는다.
   - `python3 tools/validate_data.py` 출력 둘째·셋째 줄이 13절의 두 줄과 글자까지 같다. 다음이 `OK`를 찍는다:
     ```
     python3 tools/validate_data.py | sed -n '2,3p' > /tmp/TASK-0022-out.txt
     printf '%s\n' \
       '26 acceptance specifications included (18 core + 8 character); linked by file and test name: 13 core and 3 character to engine tests, 3 to screen tests. This validator checks that those files and names exist; it does not run them (npx vitest run).' \
       'Unlinked specifications: 5 core, 5 character. Curriculum: 7 P0 item links without a P0 label remain on the pending list (not approved exceptions).' \
       | cmp - /tmp/TASK-0022-out.txt && echo OK
     ```
     (뺄 수 있음 3을 뺐으면 첫 줄의 `3 to screen tests`를 `1 to screen tests`로 바꿔 비교한다.)
3. **바꾼 범위**
   - `git diff --name-only a13caa4`와 `git status --short --untracked-files=all`의 새 파일이 ‘고칠 수 있는 파일’ 안에 있다(지시서 커밋의 세 파일 제외).
   - `git diff --stat a13caa4 -- src schemas references docs/DESIGN_v0.4.md`의 출력이 없다.
   - 다음 스크립트가 통과한다. 출력을 결과 보고에 붙인다.
     ```
     python3 - <<'EOF'
     import json, subprocess
     def old(path): return json.loads(subprocess.check_output(['git', 'show', 'a13caa4:' + path]))
     add_case = {'engine_test_ref', 'engine_test_names', 'ui_test_ref', 'ui_test_names',
                 'unlinked_reason_ko', 'engine_mapping_note_ko', 'unexecuted_assertions'}
     for path, key in (('tests/acceptance_cases.json', 'cases'), ('tests/character_acceptance_cases.json', 'items')):
         o, n = old(path)[key], json.load(open(path, encoding='utf-8'))[key]
         assert [c['id'] for c in o] == [c['id'] for c in n], path
         for a, b in zip(o, n):
             for k, v in a.items():
                 assert b.get(k) == v, (path, a['id'], k)
             assert set(b) - set(a) <= add_case, (a['id'], set(b) - set(a))
     o, n = old('data/sources.json')['items'], json.load(open('data/sources.json', encoding='utf-8'))['items']
     assert [s['id'] for s in o] == [s['id'] for s in n]
     touched = []
     for a, b in zip(o, n):
         for k, v in a.items():
             if (a['id'], k) != ('DESIGN-V03', 'local_path'):
                 assert b[k] == v, (a['id'], k)
         assert set(b) - set(a) <= {'superseded_by', 'unreferenced_reason_ko', 'local_path_note_ko'}, a['id']
         if a != b: touched.append(a['id'])
     # 머리말: 지시서가 허용한 칸 밖은 그대로다.
     oa, na = old('tests/acceptance_cases.json'), json.load(open('tests/acceptance_cases.json', encoding='utf-8'))
     for k in set(oa) - {'status', 'purpose', 'execution_contract', 'review_summary', 'cases'}:
         assert na[k] == oa[k], k
     assert set(na) - set(oa) == {'human_review_records'} and na['human_review_records'] == []
     for k, v in oa['execution_contract'].items():
         assert k == 'assertion_paths' or na['execution_contract'][k] == v, k
     assert set(na['execution_contract']) - set(oa['execution_contract']) == {'test_link_rule', 'human_review_record_rule'}
     for k, v in oa['review_summary'].items():
         assert k == 'unimplemented_items' or na['review_summary'][k] == v, k
     assert na['review_summary']['engine_test_pass_claim'] is False
     oc, nc = old('tests/character_acceptance_cases.json'), json.load(open('tests/character_acceptance_cases.json', encoding='utf-8'))
     for k in set(oc) - {'purpose', 'items'}:
         assert nc[k] == oc[k], k
     assert set(nc) - set(oc) == {'summary'}
     print('사례·출처·머리말 기존 값 불변. 고친 출처:', touched)
     EOF
     ```
     고친 출처는 DESIGN-V03, PORT-HAMBURG-2025, DURBAN-PORT, PIRAEUS-2025, GPPC-ROUTE-2026-01 다섯 개여야 한다.
   - 새 시험 줄에 자료 ID가 없다. 다음이 `0`을 찍는다(`data/*.json`의 모든 `id` 가운데 `sources.json`·시나리오 ID·소문자 ID를 뺀 것을 찾는다):
     ```
     python3 - <<'EOF'
     import json, re, subprocess
     from pathlib import Path
     ids = set()
     def walk(o):
         if isinstance(o, dict):
             if isinstance(o.get('id'), str): ids.add(o['id'])
             for v in o.values(): walk(v)
         elif isinstance(o, list):
             for v in o: walk(v)
     for f in Path('data').glob('*.json'):
         if f.stem != 'sources': walk(json.loads(f.read_text(encoding='utf-8')))
     ids = {i for i in ids if not i.startswith('SCENARIO_') and i != i.lower()}
     diff = subprocess.check_output(['git', 'diff', 'a13caa4', '--', 'tools/test_validate_data.py'], text=True)
     added = [l[1:] for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++')]
     hits = sorted({(i, l.strip()) for l in added for i in ids
                    if re.search(r'(?<![A-Za-z0-9_])' + re.escape(i) + r'(?![A-Za-z0-9_])', l)})
     print(len(hits)); [print(h) for h in hits]
     EOF
     ```
   - `human_review_records`가 빈 목록인지는 위 대조 스크립트가 확인한다.
4. **변형 시험.** 시작 전에 `cp tools/validate_data.py /tmp/TASK-0022-validate_data.py.orig`로 사본을 둔다. 아래를 하나씩 편집기로 넣고, 해당 시험을 `python3 tools/test_validate_data.py <클래스>.<메서드>`로 돌려 실패를 확인한 뒤 편집기로 되돌린다. 모두 끝나면 `cmp tools/validate_data.py /tmp/TASK-0022-validate_data.py.orig`가 종료 코드 0인지 보고에 적는다. git으로 되돌리지 않는다.

   | 변형 | 실패해야 하는 시험 |
   |---|---|
   | 제목 확인을 ‘파일 안 따옴표 문자열 어디나’로 바꿈(`TEST_CALL` 없이) | `AcceptanceLinkTest.test_todo_skip_comment_and_prefixed_calls_are_not_titles` |
   | `strip_comments` 호출을 뺌 | `AcceptanceLinkTest.test_todo_skip_comment_and_prefixed_calls_are_not_titles` |
   | `TEST_CALL`의 앞쪽 `(?<![\w.$])`를 지움 | `AcceptanceLinkTest.test_todo_skip_comment_and_prefixed_calls_are_not_titles` (`xit`) |
   | 사례 ID 포함 검사를 지움 | `AcceptanceLinkTest.test_title_without_case_id_rejected` |
   | `${` 거절을 지움 | `AcceptanceLinkTest.test_template_title_rejected` |
   | 할 일 시험 확인을 지움 | `AcceptanceLinkTest.test_todo_link_checked` |
   | 요약 연결 수 대조를 지움 | `AcceptanceLinkTest.test_summary_and_status_must_match` |
   | 사람 검토 기록의 `case_id` 대조를 지움 | `AcceptanceLinkTest.test_human_review_records` |
   | 팀 이름 대조를 지움 | `OrganizationNamesTest.test_unknown_team_rejected` |
   | 팀·부서 소속 대조를 지움 | `OrganizationNamesTest.test_team_department_mismatch_rejected` |
   | `Cf` 글자 제거를 지움 | `GeneralizationPrecisionTest.test_zero_width_inside_banned_word_rejected` |
   | 고유명사 가림을 지움 | `GeneralizationPrecisionTest.test_public_proper_nouns_allowed` |
   | 고유명사가 있으면 금지어 검사를 건너뜀 | `GeneralizationPrecisionTest.test_proper_noun_does_not_hide_banned_word` |
   | culture_enabled 검사를 상속 전 레코드로 되돌림 | `GeneralizationPrecisionTest.test_inherited_culture_block_requires_enabled` |
   | `local_path` 존재 검사를 지움 | `SourceUsageTest.test_missing_local_path_rejected` |
   | 설계 문서 `[ID]` 인용을 쓰임으로 세지 않음 | `SourceUsageTest.test_current_sources_pass` |
   | 쓰이지 않는 출처 검사를 지움 | `SourceUsageTest.test_unused_source_needs_reason` |
   | 낡은 표시 검사를 지움 | `SourceUsageTest.test_used_source_with_stale_reason_rejected` |
   | 미해결 목록에 없는 위반도 통과시킴 | `CurriculumStageTest.test_new_p0_link_without_p0_label_rejected` |
   | 미해결 목록 낡음 검사를 지움 | `CurriculumStageTest.test_stale_pending_pair_rejected` |
   | P0 표지를 정확히 `'P0'`만 인정 | `CurriculumStageTest.test_p0_report_label_counts_as_p0` |
   | 시험 파일 존재 확인을 지움 | `AcceptanceLinkTest.test_missing_test_file_rejected` |
   | 시험 이름 존재 확인을 지움(문자열이면 통과) | `AcceptanceLinkTest.test_missing_test_name_rejected` |
   | 연결 없는 사례의 `unlinked_reason_ko` 확인을 지움 | `AcceptanceLinkTest.test_unlinked_case_requires_reason` |
   | 통과 주장 검사를 지움 | `AcceptanceLinkTest.test_pass_claim_rejected` |
   | 부서 이름 대조를 지움 | `OrganizationNamesTest.test_unknown_department_rejected` |
   | 금지어 맞춤 전 NFC 정규화를 지움(기존 시험 회귀 확인) | `CultureReportsTest.test_generalization_spacing_and_normalization` |
   | `references`의 URL 대조를 뺌(ID만 셈) | `SourceUsageTest.test_current_sources_pass` |
   | `superseded_by`의 ID 존재 확인을 지움 | `SourceUsageTest.test_unknown_superseded_by_rejected` |
   | `superseded_by` 대상의 쓰임 확인을 지움 | `SourceUsageTest.test_unused_superseded_target_rejected` |
   | `main`에서 `check_sources` 호출을 뺌 | `MainWiringTest.test_main_calls_new_checks` |
   | `main`에서 캐릭터 파일의 `check_test_refs` 호출을 뺌 | `MainWiringTest.test_main_calls_new_checks` |
   | (뺄 수 있음 1) 역방향 검사에서 ‘연결에 없는 파일’ 확인을 지움 | `AcceptanceLinkTest.test_reverse_title_link` |
   | (뺄 수 있음 2) `counts.by_group` 대조를 지움 | `CurriculumStageTest.test_counts_read_from_data` |
   | (뺄 수 있음 4) 시나리오 기대값 대조를 지움 | `AcceptanceFixtureNumbersTest.test_m1_case_matches_scenario_fixture` |

   - 뺀 항목(시간)의 변형은 하지 않는다. 표에 ‘뺌’으로 적는다.
5. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0022.md`에 공통 머리말 형식으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유. 주석 제거 규칙의 한계(문자열 안 `/*` 등)를 여기에 적는다.
- **실행한 검증과 결과:** 명령별 통과·실패와 개수. 0절의 시작 값과 끝 값(자료 검사 건수, 파이썬 시험 수, vitest 파일·시험 수)을 함께 적는다.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거. 뺀 항목은 ‘미충족(시간)’.
- **변형 시험 표**
- **출처 쓰임 표:** `source_usage`로 센 종류별 수(data·references·design·없음)와, 쓰임이 없는 출처 4건의 처리(`superseded_by`·이유).
- **교과 연결 P0 검사 출력:** 찾은 미해결 쌍 목록과 `stage`가 없는 객체 수.
- **범위 밖 발견:** 고치지 않은 문제. 이미 아는 항목은 확인만 하고 줄 번호를 적는다.
  - `docs/IMPLEMENTATION_PLAN.md` 80행: P0-TIME-01 연결 시험이 없다는 문장과 연결 수 15건(이 작업 뒤 16건: 핵심 13 + 캐릭터 3).
  - `docs/CHARACTERS_AND_ORGANIZATION.md` 75행: 검사기가 팀 이름을 대조하지 않는다는 문장과 낡은 줄 번호(710~722).
  - `docs/VALIDATION.md` 38행(검사 건수), 52행(`check_culture` 줄 번호), 53행(캐릭터 연결 검사 `:710-722`).
  - `src/content/scenario.ts` 로더가 `culture_enabled`를 무시한다(R1V-2의 엔진 쪽).
  - `tools/validate_data.py`의 M1·M2 검산 고정 ID와 표 개수 고정값.
  - 그 밖에 새로 찾은 것.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 최소한 다음을 적는다. 없으면 ‘없음’.
  - GPPC-ROUTE-2026-01을 `routes.json` `schedule_basis`에 더할지.
  - 고유명사 목록 후보(있다면).
  - `strip_comments`·제목 규칙 때문에 실제 시험 파일에서 놓친 제목이 있었는지(있다면 파일·줄).

브라우저 확인은 필요 없다(화면 변경 없음).
