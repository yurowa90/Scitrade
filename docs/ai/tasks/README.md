# 작업 지시서

Claude가 쓰고 Codex가 구현하는 작업 단위다. 흐름과 역할은 [../WORKFLOW.md](../WORKFLOW.md)의 ‘역할 분담: Claude 총괄·검수, Codex 구현’을 따른다.

## 목록

| ID | 내용 | 담당 모델 | 선행 | 상태 |
|---|---|---|---|---|
| [TASK-0001](TASK-0001-recruitment-engine.md) | 동료 발견·의뢰·고용 엔진 (M2a-2) | Astra (`gpt-6-astra`) | — | 실행 준비됨 |
| [TASK-0002](TASK-0002-recruitment-ui.md) | 영입 화면·운영표 후보 행·한 번에 확정 공개 조건 | Sol (`gpt-6.1-sol`) | TASK-0001 검수 통과 | 대기 |
| [TASK-0003](TASK-0003-world-source-check.md) | 세계 거점 근거 18건 원문 대조 (조사) | Sol (`gpt-6.1-sol`) | — | 실행 준비됨 |

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
