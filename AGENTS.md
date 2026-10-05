# Scitrade — Codex 작업 안내

이 저장소는 현대 무역·물류 경영과 동물·신수 직원 수집을 결합한 게임의 개발 자료다. 현재 게임 구현 여부와 진행 단계는 [docs/STATUS.md](docs/STATUS.md)를 기준으로 확인한다.

작업 전에 다음을 읽는다.

1. [docs/ai/WORKFLOW.md](docs/ai/WORKFLOW.md) — Claude와 Codex가 함께 따르는 작업 규칙.
2. [docs/STATUS.md](docs/STATUS.md) — 실제 구현·검증·미완료 상태.
3. [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — 이번 단계의 범위와 완료 조건.
4. [docs/ai/CONTEXT_MAP.md](docs/ai/CONTEXT_MAP.md) — 업무에 필요한 문서·데이터 위치.

이 파일과 CLAUDE.md에 게임 규칙을 중복 작성하지 않는다. 공통 규칙을 수정할 때는 WORKFLOW.md를 갱신한다. 작업 단계·완료 상태가 바뀌면 STATUS.md를 실제 실행 근거와 함께 갱신한다. 사용자 지시와 적용되는 상위 지침이 우선한다.

2026-10-05 추가된 레퍼런스는 [연구 인계 안내](references/playthrough_research_2026-10-05/HANDOFF.md)에서 읽는다. 세 관점의 보고서·개발 및 그래픽 사양·소스 데이터를 현재 구현과 대조하는 자료다.

Codex는 Claude가 쓴 작업 지시서(`docs/ai/tasks/`)를 받아 구현하고, 결과를 `docs/ai/tasks/results/`에 보고한다. 역할과 흐름은 WORKFLOW.md의 ‘역할 분담’을 따른다.

검증 시작 명령: `python3 tools/validate_data.py`.
