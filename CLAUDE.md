# Scitrade — Claude 작업 안내

이 저장소는 현대 무역·물류 경영과 동물·신수 직원 수집을 결합한 게임의 개발 자료다. 현재 게임 구현 여부와 진행 단계는 [docs/STATUS.md](docs/STATUS.md)를 기준으로 확인한다.

작업 전에 다음을 읽는다.

1. [docs/ai/WORKFLOW.md](docs/ai/WORKFLOW.md) — Claude와 Codex의 공통 작업 규칙.
2. [docs/STATUS.md](docs/STATUS.md) — 실제 구현·검증·미완료 상태.
3. [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — 이번 단계의 범위와 완료 조건.
4. [docs/ai/CONTEXT_MAP.md](docs/ai/CONTEXT_MAP.md) — 업무별 문서·데이터 위치.

이 파일과 AGENTS.md는 같은 문서를 안내한다. 독립적인 게임 규칙이나 별도 진행 상태를 만들지 않는다. 새 작업에서는 기존 코드가 생겼는지 먼저 확인하고, 자료나 이전 대화만으로 구현 완료를 추정하지 않는다. 사용자 지시와 적용되는 상위 지침이 우선한다.

2026-10-05 추가된 레퍼런스는 [연구 인계 안내](references/playthrough_research_2026-10-05/HANDOFF.md)에서 읽는다. 세 관점의 보고서·개발 및 그래픽 사양·소스 데이터를 현재 구현과 대조하는 자료다.

Claude는 총괄·검수를 맡고 구현은 Codex(Astra·Sol)에 지시서로 맡긴다. 역할과 흐름은 WORKFLOW.md의 ‘역할 분담’, 지시서 목록은 [docs/ai/tasks/README.md](docs/ai/tasks/README.md)에 있다.

검증 시작 명령: `python3 tools/validate_data.py`.
