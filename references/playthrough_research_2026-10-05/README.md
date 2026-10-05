# Scitrade 코드 세션용 참고 연구 · v2.0

게임별 5편의 플레이·공략 영상과 보충 리뷰 1편, 총26편의 시간표시 자동자막에서 134개 구간을 분석했다. 그래픽 분석은 공식 정지 이미지17장 직접 확인으로 보완했다. 영상 프레임·음성 직접 검토는 없으며, 구현 완료나 실제 연구 계수 검증 자료가 아니다.

먼저 [현재 구현과 연결하는 인계 안내](HANDOFF.md)를 읽는다. 이 자료의 단계명과 `proposed_not_implemented`는 연구의 범위를 나타내며 현재 코드의 미구현 판정이나 개발 재시작 지시가 아니다.

## 권장 읽기 순서

1. 현재 Scitrade 저장소의 AGENTS.md, README, docs/ai/WORKFLOW.md, 개발 계획과 실제 구현 상태를 먼저 읽는다.
2. `Scitrade_playthrough_research_2026-10-05.md`의 2–7절에서 세 관점의 공통 결론과 단계별 완료 조건을 읽는다.
3. `developer_implementation_notes.md`에서 상태·예약·원장·자동화·저장 조건을 확인한다.
4. `visual_implementation_notes.md`에서 직원 카드/운영표/프로젝트 배정의 공통 데이터와 자산·검수 사양을 확인한다.
5. 기능을 고르면 통합 JSON의 `design_proposals[].observation_ids`와 `visual_source_ids`로 근거를 찾아 검토한다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| Scitrade_playthrough_research_2026-10-05.md | 종합 보고서, 게임별 비교, 26편 시간 링크, 17장 화면 관찰 |
| Scitrade_playthrough_research.json | 통합 소스26개·관찰134개·교차 비교25개·설계 제안14개·시각 근거17개 |
| dk4.json / guild3.json / software_inc.json / two_point_hospital.json / game_dev_story.json | 게임별 상세 원본 분석과 검토 범위·버전·해석 한계 |
| visual_review.json / visual_review.md | 공식 정지 이미지의 URL·직접 관찰·제안·한계 |
| developer_implementation_notes.md | 데이터 분리, 계약 예약, 원장, 위임, 저장, 단계별 검증 사양 |
| visual_implementation_notes.md | 세 화면 통합 사양, 직원 자산 목록, 가독성·상태 검수 |
| video_index.csv / observations.csv | 영상 목록 및 시간 구간별 관찰을 표 도구에서 검토 |
| HANDOFF.md | 현재 구현을 보존하며 연구를 적용하는 Claude·Codex 인계 |
| MANIFEST.json | 묶음 파일별 SHA-256 |

## 데이터 규칙

- `sources[].id`는 DK4-V01 같은 영상 식별자, `video_id`는 원본 YouTube ID다. `game_id`는 DK4/G3/SW/TPH/GDS다.
- `observations[].id`는 DK4-V01-O01 형식이다. `reported_play`는 자동자막 요약, `design_proposal`은 Scitrade 신규 제안이다.
- 시간 단위는 영상 시작 기준 초다. `timestamp_url`로 근거 구간을 바로 열 수 있다.
- `sources[].coverage`는 실제 독해 방법과 범위다. `duration_seconds`는 원본 길이이며 시청 시간으로 계산하지 않는다.
- DK4의 옥냥이 영상 `7tZ7qNukwKo`는 자막이7:33:17에서 잘렸다. 이후 내용은 근거가 아니다.
- `sample_role=supplementary_review`는 게임개발 스토리 리뷰1편이다. 핵심 표본25편과 구분한다.
- `frame_reviewed=false`인 영상에서 UI 색상·배치·애니메이션을 관찰했다고 쓰지 않는다. 시각 관찰은 `visual_sources`를 사용한다.
- 금액·생산성·교육 효과·시너지 수치는 이 참고 영상을 근거로 경험적 계수에 등록하지 않는다.

## 구현 범위

이 묶음은 현재 저장소를 덮어쓰는 기획 확정본이 아니다. 기존 여섯 능력치·직원 ID·경제 엔진·단계별 계획과 대조해 필요한 제안을 적용한다. 직원 수집·문화·주식·교육과정 등 기존 방향을 유지하되, 참고 영상에 없다는 이유로 요구사항을 삭제하지 않는다.

M1이 없는 새 구현에서는 계약 한 건을 일관된 상태와 최소 UI로 연결하는 순서를 참고한다. 이미 M1·M2 구현이 있는 브랜치에서는 현재 완료 상태를 보존하고 미충족 제안만 적용한다. 수동 명령의 검증이 끝난 뒤 같은 명령으로 위임을 추가한다. 실제 연구 데이터와 교육과정 매핑은 별도 근거 검토가 필요하다.

제안된 검증은 아직 수행하지 않았다. 원작 동영상·자막 전문·공식 이미지 원본은 배포 묶음에 포함하지 않았다. 출처 URL과 독자적인 요약만 제공한다.
