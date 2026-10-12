# TASK-0053 보전 기록 검사 시험 보강: 판정 보류의 확인일·근거, 등재 부속서 값

- codex_model: `gpt-6-astra`
- reasoning_effort: `low`
- 선행 작업: TASK-0050이 들어간 개발 브랜치 `<BASE>` 위에 만든 `codex/TASK-0053`에서 작업한다.
  - `<BASE>`는 허브가 실행 전에 해시로 바꾼다. 자리표시가 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0053-conservation-tests.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
- 병렬 작업: `tools/test_validate_data.py`를 여는 다른 작업과 동시에 돌리지 않는다.
- 결정 근거: TASK-0050 검수(`docs/ai/tasks/results/TASK-0050.md` ‘검수’ 절). 검사 코드 8곳을 일부러 바꿨을 때 시험 1~8이 두 곳을 잡지 못했다.
  1. `check_conservation`이 `unresolved`를 확인일·근거 검사에서 빼도 시험이 통과한다. TASK-0050 지시서 규칙 3은 `unresolved`에도 확인일·근거를 요구하지만, 시험 목록에 그 경우가 없었다(지시서 작성자 누락).
  2. `listed`의 부속서 조건을 `I`·`II`·`III`에서 ‘null 아님’으로 느슨하게 바꿔도 시험이 통과한다. 스키마 enum이 같은 값을 막지만, 검사 함수의 규칙 2를 직접 지키는 시험은 없다.

## 목표

시험만 더한다. 검사 코드와 자료는 바꾸지 않는다. 지금 코드는 두 규칙을 이미 지키므로, 새 시험은 지금 코드에서 통과하고 위 두 변형에서 실패해야 한다.

## 먼저 읽을 파일

- `tools/validate_data.py`의 `check_conservation`.
- `tools/test_validate_data.py`의 `ConservationTest`.
- `docs/ai/tasks/TASK-0050-conservation-fields.md` ‘검사’ 절의 규칙 1~5.

## 고칠 수 있는 파일

- `tools/test_validate_data.py`
- `docs/ai/tasks/results/TASK-0053.md` (결과 보고)
- `MANIFEST.json`(`python3 tools/build_package.py --manifest-only`로만)

## 시험

`ConservationTest`에 시험 둘을 더한다. 기존 시험의 방식(`self.record`를 고치고 `self.errors()`로 확인)을 따른다.

1. `unresolved`이고 `cites_appendix`가 null일 때:
   - `cites_checked_on`을 `None`으로 두면 `EMP01: CITES 확인일` 실패가 있다.
   - `cites_basis`를 `"  "`로 두면 `EMP01: CITES 확인 근거` 실패가 있다.
   - 두 경우를 `subTest`로 나눈다.
2. `listed`이고 `cites_appendix`가 `"IV"`이면 `EMP01: CITES 확인 상태와 부속서` 실패가 있다.

## 확인 (결과 보고에 적는다)

- 새 시험이 지금 코드에서 통과한다.
- 변형 확인: 검사 코드를 잠시 아래처럼 바꾸면 새 시험이 실패하는지 본다. 확인한 뒤 코드를 되돌리고, 되돌린 뒤 `git diff tools/validate_data.py`가 비어 있음을 적는다.
  - `if status in ('listed', 'not_listed', 'unresolved'):` → `if status in ('listed', 'not_listed'):` 이면 시험 1이 실패한다.
  - `appendix in ('I', 'II', 'III')` → `appendix is not None` 이면 시험 2가 실패한다.
  - 이 확인은 `python3 -m unittest`로 `ConservationTest`의 새 시험만 돌린다. `test_pass_output_reports_unresolved_after_second_line`은 `main()`을 돌려 MANIFEST 해시 때문에 코드만 바꿔도 실패하므로 변형 확인에 쓰지 않는다.

## 완료 조건

- `python3 tools/test_validate_data.py` 통과. 시험 수 전후(지금 93개 → 95개)를 적는다.
- `python3 tools/validate_data.py` PASS.
- `bash tools/ai/review_checks.sh --check <BASE>` 통과.
- 바뀐 파일이 위 ‘고칠 수 있는 파일’ 셋뿐이다.
