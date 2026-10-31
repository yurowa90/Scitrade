# TASK-0074-R2 검사기 범위 충돌 뒤 이어 하기

- **지위: 승인(허브, 2026-10-31).** 근거: TASK-0074 R1 결과 보고(`codex/TASK-0074` R1 스냅숏)와 허브 결정 H37.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: R1 부분 구현 스냅숏. 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.
- **`TASK-0074-rules4-scenario-save7.md`(개정 1)와 `TASK-0074-R1-resume.md`를 그대로 이어 한다.** 아래 셋만 바뀐다. 예산(R1 1절: 엔진 ≤ 2,400 B, 화면 ≤ 16 B)과 통화 순서(R1 3절)는 그대로다.
- 결과 보고는 `docs/ai/tasks/results/TASK-0074.md` 맨 위에 ‘R2로 이어 함’과 R2 BASE를 적고, R1 내용은 ‘2차 실행(R1, 중단)’ 절로 남긴다.

## 바뀌는 것

### 1. 새 시나리오 항목은 기존 자식 시나리오의 관례를 따른다(0074 3.1 수정)

- 기존 자식 시나리오(`SCENARIO_M2_OPS_COS_LAVER` 등)는 상속을 쓰면서도 스키마 필수 칸을 원문에 다시 적는다. 그 칸은 `id`, `ipo_enabled`, `securities_enabled`, `source_refs`, `stage`다.
- 새 항목 `SCENARIO_M2_OPS_CREDIT`도 이 다섯 칸을 원문에 적는다. 값은 부모 `SCENARIO_M2_OPS_COS_LAVER`를 상속으로 푼 값과 같다. 그 밖의 칸은 상속한다.
- 스키마(`schemas/scenarios.schema.json`)는 고치지 않는다.
- 같음 시험(0074 4.2-6)은 그대로 통과해야 한다. 원문에 다시 적은 칸은 값이 같으므로 결과 설정에 영향이 없다.

### 2. R1 2절(`check_world_hubs` 상속 처리)은 되돌린다

- 위 1로 원문에 `stage`가 있으므로 그 변경은 필요 없다. R1에서 바꾼 `check_world_hubs` 반복과, 그와 함께 더한 Python 상속 시험 둘은 BASE(`f18a6b2`) 모양으로 되돌린다. 그 시험 둘은 `d['sources']['sources']` 작성 오류도 있었다.
- 되돌린 것을 결과 보고에 적는다.

### 3. 검사기에서 허용하는 변경(0074 2절 허용 파일에 더함)

- `tools/validate_data.py` `main()`의 `expected_counts['scenarios']`를 10에서 11로 바꾼다. 그 한 값만 바꾼다.
- `tools/test_validate_data.py::test_experiment_legacy_data_still_passes`는 옛 자료를 만들려고 실험 시나리오를 지운다. 이 시험의 **준비 줄에서만** 새 자식 `SCENARIO_M2_OPS_CREDIT`도 함께 지운다. 단언은 바꾸지 않는다.
- `risk_setup` 검사와 음성 사례 셋(0074 3.1)은 R1에서 쓴 대로 유지하고 통과시킨다.

## 순서

1. 위 1~3을 반영하고 `python3 tools/validate_data.py`, `python3 tools/test_validate_data.py`를 통과시킨다.
2. 0074 4.2 새 시험, 4.3 남은 전환, 변형 V1~V15, R1 1절 예산 재측정, 0074 10절 완료 조건을 마친다.

## 멈춤 조건(추가)

- 위 1~3 밖의 검사기·스키마 변경이 필요할 때.
