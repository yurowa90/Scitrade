# TASK-0076-R2 R1 멈춤 뒤 이어 하기

- **지위: 승인(허브, 2026-10-31, H40).** 근거: `docs/ai/tasks/results/TASK-0076.md`의 ‘R1 — 구현 중 멈춤’ 절. 예산은 통과했다(첫 화면 132,087 B, 여유 7,913 B).
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: R1 부분 구현 스냅숏(이 지시서를 담은 커밋의 부모). 시작할 때 `git rev-parse HEAD`를 결과에 적는다.
- **`TASK-0076-R1-d-c.md`(승인 개정 1)를 그대로 이어 한다.** 아래 둘만 바뀐다. 관문(첫 화면 ≤ 132,100 + 64 B)과 ‘관문은 다시 옮기지 않는다’는 그대로다.
- 결과는 `docs/ai/tasks/results/TASK-0076.md`에 ‘R2’ 절을 더해 적는다. R1 절은 그대로 둔다.

## 바뀌는 것

### 1. `CULTURE_UNCHANGED_KO`도 D로 옮긴다(C8 집합은 그대로)

- `culturePreview`가 옮겨진 뒤 `src/engine/previews.ts:10`의 `CULTURE_UNCHANGED_KO`는 지연 청크(`previews-lazy.ts`, `ui/culture-panel.ts`)에서만 쓰인다. D의 정의('지연 청크에서만 쓰이는 첫 화면 모듈의 값을 지연 전용 파일로 옮김')에 그대로 든다.
- 허용 범위에 다음을 더한다.
  - `previews.ts`: 이 상수 선언 삭제
  - `previews-lazy.ts`: 같은 초기식으로 선언. 초기식 바이트는 같아야 한다.
  - `ui/culture-panel.ts`·`culture.test.ts`와 이 상수를 import하는 그 밖의 파일: import 경로 변경만
- 이 상수를 import하는 곳은 `rg -n "CULTURE_UNCHANGED_KO" src tools tests`로 전부 뽑아 결과에 적는다.
- C8 허용 집합은 계속 `{ setOpsData }` 하나다. 탐지기는 바꾸지 않는다.

### 2. 재등록 검사는 내용으로 비교한다

- R1의 `layout.test.ts` 실패 원인은 이렇다. `vi.resetModules()` 뒤 `ops-data-entry`가 다시 평가되면 JSON import는 새 객체다. 그런데 등록부에는 이전 객체가 남는다. 그래서 같은 자료인데도 '다른 값'으로 판정됐다.
- 규칙을 다음처럼 바꾼다(지연 쪽 `ops-data-entry`에서만).
  - **같은 값**은 이미 등록된 값과 `JSON.stringify` 결과가 같은 것이다. 같으면 아무것도 하지 않는다.
  - 다르면 지금처럼 예외를 낸다.
  - 객체 동일성(`===`)만으로 판정하지 않는다.
- 첫 화면 쪽 `ops-data.ts`는 바꾸지 않는다. 비교 비용은 지연 청크에 든다.
- 새 시험 셋을 더한다.
  - 내용이 같은 다른 객체로 재등록하면 조용히 무시되고, 등록된 값은 처음 값 그대로다.
  - 한 칸이라도 다른 값으로 재등록하면 같은 예외 문구가 난다.
  - `layout.test.ts`가 고치지 않고 통과한다.
- 변형 V12(재등록 검사를 첫 화면으로 옮김)는 그대로 두고, V14를 더한다: **비교를 `===`로 되돌리면 layout 시험이 실패한다.**

## 순서

1. 위 1·2를 반영하고 R1이 남긴 실패 둘(C8 탐지, layout)이 통과하는지 본다.
2. R1 지시서 5절 완료 조건 가운데 R1에서 미완료로 남은 것을 모두 돌린다: 골든 전·후 쌍, 기본 run 400회 cmp(`run`은 지금 단일 실행이므로 작업자 조건은 d03·골든에만 적용), 판본 2 SHA256SUMS, 전체 vitest, review_checks 18종, 변형 V1~V14.
3. 첫 화면 예산을 다시 잰다. 관문은 그대로다.

## 멈춤 조건(추가)

- 위 1·2 밖의 범위 확대가 필요할 때.
- 내용 비교로도 기존 시험이 재등록 예외를 낼 때. 그때는 원인을 확정해 보고한다.
