# TASK-0003 세계 거점 근거 18건 원문 대조 (조사)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `medium`
- web_search: `on` (`codex exec --search`)
- 선행 작업: 없음
- 결정 근거: `docs/DECISIONS.md` ‘세계 거점: 실제 물류·무역 금융 중심 — 2026-10-05’의 ‘확인 수준’

## 목표

`data/world.json`의 `selection_basis`에는 출처 18건의 수치·순위가 들어 있다. 이 값들은 Claude 세션에서 원문 접속이 막혀 검색 결과 요약으로만 확인했다(`data/sources.json`의 `verification_status = WEB_SEARCH_SUMMARY_ONLY`). 이 작업은 원문을 직접 열어 각 값을 대조한다.

**이 작업은 조사 보고만 한다.** 데이터 파일은 고치지 않는다. 보고를 검수한 뒤 고치는 일은 Claude가 한다.

## 먼저 읽을 파일

- `data/world.json`: 각 거점의 `selection_basis[]`. 필드는 `source_id`, `indicator_ko`, `value_ko`, `period`다.
- `data/sources.json`: 아래 18건의 `title`, `url`.
- `docs/DECISIONS.md`의 위 절.

대상 출처 ID:

- 항만 순위·물동량: LL-100P-2026, PORT-HAMBURG-2025, TANGERMED-2025, DATAMAR-SANTOS, JNPA-2025, POM-2025, MOMBASA-2025, DURBAN-PORT, US-PORTS-2025, PIRAEUS-2025.
- 도시 지수·해운 통계: ZYEN-GFCI39, MENON-DNV-LMC2024, UNCTAD-RMT2024, HFW-ARB2026.
- 항로·운하: PEMP-ROUTING, PEMP-REDSEA, GCAPTAIN-PANAMA-2023, PANCANAL-2023.

## 구현 지시

1. `data/sources.json`의 URL을 연다. 열리지 않으면 같은 기관의 공식 원문을 찾는다.
   - 공식 원문은 항만 당국·발행 기관의 보도자료와 보고서를 말한다.
   - 이 경우 찾은 URL을 따로 적는다.
2. 해당 출처를 쓰는 `selection_basis` 항목마다 원문의 값과 우리 값을 대조한다. 판정은 셋 중 하나다.
   - **일치**
   - **불일치**: 원문 값과 수정안을 적는다.
   - **확인 불가**: 이유를 적는다(유료벽, 삭제, 원문에 해당 수치 없음).
3. 2차 매체 출처는 1차 출처가 있는지도 찾는다. 해당하는 출처: Container News, Port Technology, Indian Infrastructure, India Seatrade News, To Vima, Wikipedia. 1차 출처는 항만 당국 발표나 발행 기관 보고서다.
4. 원문 인용은 한 항목당 25단어 이내로만 한다. 긴 본문을 옮기지 않는다.
5. 같은 지표인데 매체마다 값이 다르면(예: 피레우스 물동량), 값을 모두 적고 어느 쪽이 1차 출처인지 밝힌다.

## 보고 형식

`docs/ai/tasks/results/TASK-0003.md`에 공통 머리말의 형식을 따른다. 다만 ‘바꾼 파일’은 ‘없음’이어야 한다. 본문에는 아래 표를 넣는다.

| source_id | 확인한 URL | 접속일 | 대조 항목(거점·지표) | 우리 값 | 원문 값(짧은 인용) | 판정 | 1차 출처 | 수정안 |
|---|---|---|---|---|---|---|---|---|

표 아래에 판정별 개수(일치/불일치/확인 불가)를 적는다.

## 완료 조건

1. 18건 모두 판정이 있다.
2. 불일치에는 원문 근거와 수정안이 있다.
3. 확인 불가에는 이유가 있다.
4. 데이터·코드 파일을 바꾸지 않았다(`git status`에 결과 보고서만 있음).
5. 머리말의 검증 명령은 데이터를 바꾸지 않았으므로 `python3 tools/validate_data.py`만 실행해 통과를 확인한다.
