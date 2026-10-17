# TASK-0065-R1 검사기 연결 자리 고침과 남은 검증

- **지위: 승인(허브, 2026-10-17).** 선행: TASK-0065 Codex 스냅숏(이 지시서 바로 앞 커밋). BASE는 TASK-0065와 같은 `440aefc`다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 먼저 읽는다: `TASK-0065-experiment-scenarios.md`(승인 개정 3a)와 결과 보고 `results/TASK-0065.md`.

## 배경

TASK-0065 실행은 지시서대로 멈췄다. 기존 시험 `tools/test_validate_data.py`의 `MarketRulesTest.test_goods_counts(count=1)`가 실패했다. 원인은 새 `check_experiments`를 `check_market_rules` 안에서 부른 연결 자리다. 기존 시험은 첫 rule_set을 1품목 사본으로 바꾼 뒤 일반 시장 검사만 통과하는지 보는데, 그 사본을 실험 복사 동일성 검사가 함께 대조해 실패한다. 실제 자료의 결함이 아니라 검사 범위가 겹친 것이다. 허브는 결과 보고의 제안을 받아들인다.

## R1-1. 연결 자리

- `check_experiments`를 `check_market_rules` 안에서 부르지 않는다. `main()`에서 `check_market_rules` 호출 바로 뒤에 따로 부른다.
- 새 반례 시험(TASK-0065가 더한 시험)은 실험 조건을 보려면 `check_market_rules`와 `check_experiments`를 함께 부르게 고친다. 기존 시험(`test_goods_counts` 포함)과 그 기대값은 고치지 않는다.
- 검사 내용(상속 동일·판매 거래처 분리·복사 동일성)과 문장은 바꾸지 않는다.

## R1-2. 남은 검증(TASK-0065 지시서의 완료 조건 그대로)

- `python3 tools/test_validate_data.py` 전체 통과, `python3 tools/validate_data.py` 통과(전체 자료에서 실험 검사가 실제로 돈다는 것을 반례 하나로 보인다: 실험 rule_set의 `regional_pct` 하나를 바꾼 사본이 `main()` 경로에서 실패).
- 변경 뒤 `npm run build`·`node tools/check_bundle_size.mjs dist`(깨끗한 트리 측정은 허브가 한다), 골든 검사기, `bash tools/ai/review_checks.sh --check 440aefc` 16종 실패 0.
- TASK-0065 변형 표 1~11을 갈래별로 돌려 결과를 적는다. 견적 수(J4a) 실측 최댓값도 적는다.

## 고칠 수 있는 파일

- `tools/validate_data.py`(연결 자리만), `tools/test_validate_data.py`(TASK-0065가 더한 시험만), `docs/ai/tasks/results/TASK-0065.md`(‘재작업 1’ 절 추가), `MANIFEST.json`.
- 그 밖은 TASK-0065 지시서의 파일 목록과 같고, 고칠 일이 생기면 멈추고 보고한다.

## 결과 보고

- `results/TASK-0065.md` 끝에 ‘재작업 1’ 절: 바꾼 줄, 위 명령 결과, 변형 표 결과, J4a 최댓값, 질문.
