# 업무별 문서와 데이터 지도

공통 순서: WORKFLOW.md → ../STATUS.md → ../IMPLEMENTATION_PLAN.md → 이번 작업의 관련 파일. 전체 설계는 맥락을 확인할 때 참고하고, 각 단계의 구현 완료 여부는 STATUS.md에서 확인한다.

| 작업 | 먼저 읽을 문서 | 관련 데이터·검증 |
|---|---|---|
| 최초 코드 세션 | ../../START_HERE.md, ../DECISIONS.md | ../../data/game_config.json, ../../data/scenarios.json |
| 거래·현금·운송 | ../DESIGN_v0.4.md의 7~11절, ../FLOWS.md | market_offers, goods, routes, scenarios; tests/acceptance_cases.json |
| 화면·조작 | ../UI_SPEC.md, ../ART_DIRECTION.md | ui_screens, venues, contacts |
| 동료 수집·직무 | ../CHARACTERS_AND_ORGANIZATION.md | characters, employees, job_templates |
| 레벨·강화·조직·시너지 | ../CHARACTERS_AND_ORGANIZATION.md | character_rules, organization, team_synergies; tests/character_acceptance_cases.json |
| 도시·문화·지역 경험 | ../DESIGN_v0.4.md의 23~24절, ../DECISIONS.md ‘M2a-4 도시 방문·문화 활동’, [문화 화면 장면 기준](design/TASK-0012-scene-brief.md) | culture_activities, contacts, venues, content_hooks. 코드: `src/engine/culture.ts`, `src/ui/culture.ts` |
| 주식·IPO | ../DESIGN_v0.4.md의 25~27절 | securities; 해당 P1/P2 인수 명세 |
| 사회·과학·연구 근거 | ../DESIGN_v0.4.md의 5~6·16~22절 | curriculum_links, parameters, sources, observed_fx_sample |
| 2026-10-05 플레이·개발·그래픽 연구 | [연구 인계](../../references/playthrough_research_2026-10-05/HANDOFF.md), [전체 자료](../../references/playthrough_research_2026-10-05/README.md), [제안별 적용표](../RESEARCH_APPLICATION.md) | 통합 JSON의 영상26개·관찰134개·제안14개, 공식 화면17개. 적용 코드: `src/engine/progress.ts`, `src/engine/research-ref.test.ts` |
| 원작·영상 참고 | ../../references/REFERENCE_REVIEW.md | dk4_reference, guild3_reference, user_character_clip |
| 고전게임 인사이트 기획 반영(2026-10-08) | [Claude 인계](CLASSIC_GAME_HANDOFF.md), [CL-01~08 적용표](../CLASSIC_GAME_INSIGHTS.md), ../IMPLEMENTATION_PLAN.md | 기존 플레이 기록과 공식 매뉴얼의 근거 구분, 기존 M2a~M5 연결, 동료·문화·경영 판단의 검증 기준. 구현 완료 보고 아님 |
| M2a 사용성 시험 | [시험 계획 초안](../USABILITY_TEST_M2A.md) | 과제 T1~T5(진행 순서 T1→T3→T2→T4→T5, 시험 계획 4절), 관찰지, 판정 기준, 윤리·개인정보 |
| 시험 빌드 배포(Netlify) | WORKFLOW.md ‘시험 빌드 정적 배포’, [시험 계획](../USABILITY_TEST_M2A.md) 8절 | 배포한 3판 `a8ffa35`, 주소의 `/version.txt`. 배포 폴더는 `dist`만 올린다 |
| 평택 본사 전환(2026-10-09) | ../DECISIONS.md ‘평택 본사 전환’·‘평택 노선 재설계 승인’, [TASK-0015 지시서](tasks/TASK-0015-pyeongtaek-hq.md), [노선 근거표](design/PYEONGTAEK-route-basis.md), [부산판 승인 문장 보관](design/BUSAN-approved-texts.md) | world, routes, scenarios, market_offers, culture_activities, contacts, characters, venues, game_config. 구현은 TASK-0015(`548c53c` 반영), 검수는 결과 보고 ‘검수’ 절 |
| 대항해시대 근거 추적 | [DK 적용표](../RESEARCH_APPLICATION.md) ‘대항해시대 IV 적용표’, ../../references/REFERENCE_REVIEW.md | `references/dk4_reference.json`(매뉴얼 관찰 DK4-O), `references/playthrough_research_2026-10-05/Scitrade_playthrough_research.json`(영상 관찰 DK4-V··-O·교차 결론 DK4-F), 같은 폴더 `dk4.json`(영상 목록·개발 제안) |
| 그림·지도(픽셀아트) | [픽셀 규격](../art/PIXEL_SPEC.md), [제작 절차](../art/PROMPTS.md), [제작 목록](../art/ASSET_BACKLOG.md), ../ART_DIRECTION.md 맨 위 절 | `src/assets/palette.json`, `src/assets/manifest.json`, `scripts/build_map.py`(+`test_build_map.py`), `tools/art/*`, `src/ui/pixel.ts`·`map.ts` |
| 웹 글꼴(D16) | [글꼴 출처·라이선스](../art/FONT_LICENSES.md) | `public/fonts/`(fonts.css·WOFF2·OFL 사본), `index.html`, `tools/fonts/subset_gowun_dodum.py`(Gowun Dodum 조각 재생성·확인), `tools/browser/lib.mjs`(글꼴 판정 `fonts.local`) |
| Codex 작업 지시·검수 | [작업 지시서 목록](tasks/README.md), [공통 머리말](tasks/CODEX_PREAMBLE.md), WORKFLOW.md ‘역할 분담’ | `tools/ai/codex_task.sh`(실행), `tools/ai/review_checks.sh`(검수 자동 검사), `docs/ai/tasks/results/`(결과 보고) |

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
