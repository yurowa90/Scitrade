# 업무별 문서와 데이터 지도

공통 순서: WORKFLOW.md → ../STATUS.md → ../IMPLEMENTATION_PLAN.md → 이번 작업의 관련 파일. 전체 설계는 맥락을 확인할 때 참고하고, 각 단계의 구현 완료 여부는 STATUS.md에서 확인한다.

| 작업 | 먼저 읽을 문서 | 관련 데이터·검증 |
|---|---|---|
| 최초 코드 세션 | ../../START_HERE.md, ../DECISIONS.md | ../../data/game_config.json, ../../data/scenarios.json |
| 거래·현금·운송 | ../DESIGN_v0.4.md의 7~11절, ../FLOWS.md | market_offers, goods, routes, scenarios; tests/acceptance_cases.json |
| 화면·조작 | ../UI_SPEC.md, ../ART_DIRECTION.md | ui_screens, venues, contacts |
| 동료 수집·직무 | ../CHARACTERS_AND_ORGANIZATION.md | characters, employees, job_templates |
| 레벨·강화·조직·시너지 | ../CHARACTERS_AND_ORGANIZATION.md | character_rules, organization, team_synergies; tests/character_acceptance_cases.json |
| 도시·문화·지역 경험 | ../DESIGN_v0.4.md의 23~24절 | culture_activities, contacts, content_hooks |
| 주식·IPO | ../DESIGN_v0.4.md의 25~27절 | securities; 해당 P1/P2 인수 명세 |
| 사회·과학·연구 근거 | ../DESIGN_v0.4.md의 5~6·16~22절 | curriculum_links, parameters, sources, observed_fx_sample |
| 원작·영상 참고 | ../../references/REFERENCE_REVIEW.md | dk4_reference, guild3_reference, user_character_clip |

표의 데이터 이름은 저장소 루트 `data/<이름>.json`, 레퍼런스 이름은 `references/<이름>.json`이다. tests 경로는 저장소 루트 기준이다.

## 문서 간 역할

- 사용자 요청과 구체적 기능 설계: DESIGN_v0.4.md 및 관련 상세 문서.
- 공통 작업 방식·정합성: WORKFLOW.md.
- 현재 실제 구현 여부: STATUS.md.
- 단계별 다음 작업: IMPLEMENTATION_PLAN.md.
- 데이터 형식·초깃값: data/ 및 schemas/.
- 구현 후 통과해야 할 기대 결과: tests/. 파일이 있다는 사실은 테스트를 실행했다는 뜻이 아니다.
- 실제 출처·판본·확인 한계: data/sources.json 및 references/.

충돌을 발견하면 영향을 받는 항목을 먼저 대조한다. 단순 경로·메타데이터 오류는 수정하고 기록한다. 경제 규칙·숫자·범위를 바꿔야 하는 경우 근거와 변경 내용을 명시한다. 기존 관측값을 편의상 설계값으로 덮어쓰지 않는다.
