# 작업 지시서

Claude가 쓰고 Codex가 구현하는 작업 단위다. 흐름과 역할은 [../WORKFLOW.md](../WORKFLOW.md)의 ‘역할 분담: Claude 총괄·검수, Codex 구현’을 따른다.

## 목록

| ID | 내용 | 담당 모델 | 선행 | 상태 |
|---|---|---|---|---|
| [TASK-0001](TASK-0001-recruitment-engine.md) | 동료 발견·의뢰·고용 엔진 (M2a-2) | Astra (`gpt-6-astra`) | — | 완료 (반려 1회 → [R1](TASK-0001-R1-recruitment-engine-fixes.md), 개발 브랜치 반영) |
| [TASK-0002](TASK-0002-recruitment-ui.md) | 영입 화면·운영표 후보 행·한 번에 확정 공개 조건 | Sol (`gpt-6.1-sol`) | TASK-0001 | 완료 (반려 1회 → [R1](TASK-0002-R1-recruitment-ui-fixes.md), 개발 브랜치 반영) |
| [TASK-0003](TASK-0003-world-source-check.md) | 세계 거점 근거 18건 원문 대조 (조사) | Sol (`gpt-6.1-sol`) | — | 완료 (Claude 교차 검증 후 데이터 반영) |
| [TASK-0004](TASK-0004-xp-level-training-engine.md) | 업무 경험치·레벨·일반 훈련 엔진 (M2a-3) + 화면 준비용 읽기 함수 | Astra (`gpt-6-astra`) | TASK-0001·0002 | 완료 (반려 2회 → [R1](TASK-0004-R1-growth-engine-fixes.md)·[R2](TASK-0004-R2-growth-engine-hardening.md), 개발 브랜치 반영) |
| [TASK-0005](TASK-0005-growth-ui-and-cleanup.md) | 경험치·레벨·훈련 화면 + 영입 검수 잔여 정리(옛 TASK-0006 포함) + 취소 안내 금액 | Sol (`gpt-6.1-sol`) | TASK-0004·0008·0007 반영 | 완료 (반려 1회 → [R1](TASK-0005-R1-growth-ui-fixes.md), 사용성 시험 준비 [R2](TASK-0005-R2-growth-ui-test-readiness.md)·[R3](TASK-0005-R3-notice-context.md), 개발 브랜치 반영, 사용성 시험 빌드) |
| ~~TASK-0006~~ | TASK-0005에 합침 | — | — | — |
| [TASK-0007](TASK-0007-pixel-rendering.md) | 픽셀아트 렌더링(정수 배율)·픽셀 지도 생성·팔레트·그림 검사 도구 | Sol (`gpt-6.1-sol`) | 픽셀아트 결정(2026-10-05) | 완료 (반려 3회 → [R1](TASK-0007-R1-pixel-map-fixes.md)·[R2](TASK-0007-R2-pixel-map-polish.md)·[R3](TASK-0007-R3-map-water-and-colour.md), 남은 minor는 Claude가 반영 때 수정, 개발 브랜치 반영) |
| [TASK-0008](TASK-0008-engine-robustness.md) | 엔진 견고성: ROUTE02 취소 정산 오류(기존 결함) + 저장 무결성·테스트 강도 잔여 | Astra (`gpt-6-astra`) | TASK-0004 반영 | 완료 (반려 없음, 개발 브랜치 반영) |
| [TASK-0009](TASK-0009-port-wait-and-freeze-polish.md) | 거짓 ‘하역 중단 대기’ 경고(기존 결함) 수정 + 사용성 시험 빌드 마무리 | Astra (`gpt-6-astra`) | TASK-0005-R3 | 완료 (반려 없음, TASK-0005와 한 병합 커밋으로 개발 브랜치 반영, 사용성 시험 빌드) |
| [TASK-0010](TASK-0010-save-v5-foundation.md) | M2a-4 기반: 저장 판본 5(현지 활동 기록 칸), 숨어 있던 업무 종류 분기를 오류로 드러내기, 자금 판단 함수 통합 — 동작 불변 | Astra (`gpt-6-astra`) | 사용성 시험 빌드 `f260a7c` | 완료 (반려 없음, 개발 브랜치 반영) |
| [TASK-0011](TASK-0011-culture-engine.md) | M2a-4 문화 활동 엔진·자료·검사기 (부산 CA01~03, 직원·활동별 첫 완료 경험치, 4줄 기록) | Astra (`gpt-6-astra`) | TASK-0010 반영, 4줄 기록 문장 사용자 검토 | 완료 (반려 1회 → [R1](TASK-0011-R1-culture-hardening.md), Claude 검수 수정 4건, 개발 브랜치 반영) |
| [TASK-0012](TASK-0012-culture-ui.md) | M2a-4 화면: 부산 현지 탭·패널, 활동·직원 고르기와 미리 보기, 결과 카드(4칸)·부산 기록장, 원화 ‘현지 활동비’ 행 (C+A 혼합안) | Sol (`gpt-6.1-sol`) | TASK-0011·0014 반영, 3판 가로 배치(`a8ffa35`), 시안 비교와 사용자 선택 | 대기 |
| [TASK-0013](TASK-0013-deferred-display-fixes.md) | 사용성 시험 빌드에서 미룬 표시 수정 8건(수금일 당일 문구, 선복 반영 예약 안내, 확정 미리 보기 문구, 위쪽 막대 기준, 면담 전 계약금 규칙 등) | Sol (`gpt-6.1-sol`) | TASK-0010 반영 | 완료 (반려 없음, Claude 검수 수정 2건, 개발 브랜치 반영) |
| [TASK-0014](TASK-0014-touch-device-readiness.md) | 사용성 시험용 휴대폰·태블릿 대응: 화면 튐(초점)·두 번 누름 막기, 고정 막대 줄이기, 거래 먼저 배치, 진행 보호·터치 대상 등 + 미배정 문구 1건 | Sol (`gpt-6.1-sol`) | TASK-0011 반영(`b45e7e2`) | 완료 (반려 없음, Claude 검수 수정 4건, 개발 브랜치 반영, 사용성 시험 빌드 2판) |

상태 값: `대기`, `Codex 실행 중`, `검수 중`, `반려(n회)`, `완료(커밋 해시)`.

## 지시서 형식

```
# TASK-xxxx 제목
- codex_model: `gpt-6-astra` 또는 `gpt-6.1-sol`
- reasoning_effort: `low` | `medium` | `high` | `xhigh`
- 선행 작업:
- 결정 근거: (DECISIONS·계획 문서의 절)

## 목표
## 먼저 읽을 파일
## 범위 (포함 / 제외)
## 구현 지시
## 테스트
## 완료 조건
```

공통 규칙(커밋 금지, 고치지 않는 파일, 검증 명령, 보고 형식)은 [CODEX_PREAMBLE.md](CODEX_PREAMBLE.md)에 있다. 지시서마다 다시 쓰지 않는다.

결과 보고는 `results/<작업 ID>.md`에 쌓인다. Claude의 검수 기록은 같은 파일 끝의 ‘검수’ 절에 덧붙인다.
