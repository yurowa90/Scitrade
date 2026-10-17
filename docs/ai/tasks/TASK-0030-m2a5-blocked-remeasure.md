# TASK-0030 M2a-5 준비 예측의 차단 기간 정의 고침과 D03 재측정

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `<BASE>`(TASK-0029 병합 뒤, 이 지시서를 올린 커밋). 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0030-m2a5-blocked-remeasure.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
- 배경: `docs/ai/tasks/results/TASK-0029.md`의 ‘범위 밖 발견’과 ‘검수’ 절. 재현은 시드 1001, `MAX_CONTRIBUTION~inv:SE~hire:2pt@30`, 23일 수락한 `TASK011`이다.
  - 예측 `projectPrepCompletion({ assignQueued: true, blocked })`은 차단 직전에 영입 담당자에게 12pt 업무를 맡기고, 그 업무가 차단 기간에도 진행돼 30일에 끝난다고 본다.
  - 실행기는 ‘차단 시작 전에 끝나지 않는 업무는 영입 담당자에게 맡기지 않는다’는 규칙으로 그 배정을 하지 않는다. 그래서 업무가 31일까지 대기하고, 출항을 놓치고, 미인도로 남는다.
  - 보통 고용 실행 1,080회 가운데 235회에 미인도 249건이 있었다. 고용 없는 실행에는 0건이었다.
- 행 번호는 TASK-0029 병합 머리 기준이다: `src/engine/operations.ts` 54~86행(`PrepProjection`, `projectPrepCompletion`), `src/engine/sim/operations-policy.ts` 27~46행(`blocks`, `available`, `projectionSafe`). 다르면 코드가 사실이다.

## 목표

1. 예측의 `blocked`를 실행기의 실제 행동과 같게 정의한다. 그 결과 ‘예측으로는 정시인데 실제로는 출항을 놓치는’ 계약이 영입 변형에서 0건이 되게 한다.
2. D03을 TASK-0029와 같은 조건(기준·cap30·flat200, 20시드)으로 다시 재고, J1~J7을 다시 판정한다. **값은 고치지 않는다.**

## 구현 지시

### 1. 엔진: `projectPrepCompletion`의 `blocked` (`src/engine/operations.ts`)

- 새 정의: `blocked: { employeeId; fromDay; toDay }[]` 동안 그 직원은 본사 준비 업무를 **진행하지도, 새로 맡지도 않는다**(조사·의뢰를 하느라 준비 업무를 못 하는 상태다).
- 배정 규칙(`assignQueued`): 대기 업무를 차단될 직원에게 맡기려면, 그 직원의 처리량으로 남은 업무량을 차단 시작 전날까지 끝낼 수 있어야 한다(`ceil(남은 pt ÷ 처리량) ≤ fromDay − 배정일`). 창고 배분으로 늦어지는 몫은 이 판정에서 보지 않는다. 대신 진행 중 업무가 차단 기간에 걸리면 그 기간에는 진행하지 않는다. 그래서 예측 완료일이 늦게 나와 수락 시험에서 걸러진다.
- `PrepProjection`에 `employeeId: string | null`을 더한다. 예측이 그 업무를 맡겼다고 본 직원이고, 끝내 못 맡기면 null이다.
- `blocked`가 없으면 결과가 지금과 바이트로 같아야 한다. 규칙 1, `contractProgress`, `quotePreview`, `warehouseSummary`는 `blocked`를 쓰지 않는다. 인수 01~19의 기대값은 바뀌지 않는다(`employeeId` 칸이 더해지는 기대 객체만 그 칸을 더한다. 그 밖의 값은 고치지 않는다).

### 2. 실행기 (`src/engine/sim/**`)

- `projectionSafe`의 둘째 조건(영입 담당자 업무가 차단 시작을 넘는지)은 엔진 예측이 이제 직접 반영하므로 지운다. 실제 배정(`available`)은 예측과 같은 규칙을 쓴다. 차단될 직원에게는 차단 시작 전에 끝날 업무만 맡긴다.
- **불일치 지표:** 규칙 2 실행의 `metrics.operations`에 `projectionMisses`를 더한다. 수락하거나 예약할 때 예측 준비 완료일이 예약 출항일 이하였는데, 실제로 그 출항을 준비 미완료로 놓친 계약의 수다. d03 표 ⑧에 변형별 합계를 낸다.

### 3. D03 재측정

- TASK-0029와 같은 명령으로 세 조건을 20시드씩 다시 잰다(워커는 nproc을 보고 정한다).
- 결과 파일: `docs/ai/tasks/results/TASK-0030-d03.md`, `-cap30.md`, `-flat200.md`. TASK-0029 결과 파일은 지우지 않는다.
- 결과 보고에 TASK-0029 값과의 차이를 적는다. 차이는 J1~J7 판정, 고용 표 ③·④의 ↑·↓가 바뀐 칸, 미인도 계약 수(고용 실행·고용 없는 실행)다.
- J6가 여전히 80%에 못 미치면 틀린 칸마다 원인 추정을 적는다. 이용률 높은 시드 수, 투자 변형별 분포(특히 S)를 함께 적는다.

## 고칠 수 있는 파일

- `src/engine/operations.ts`(`projectPrepCompletion`과 `PrepProjection`만), `src/engine/m2a5-warehouse.test.ts`(새 `describe` 추가와 `employeeId` 칸 반영만), `src/engine/m2a5-readers.test.ts`·`m2a5-money.test.ts`(`employeeId` 칸이 기대 객체에 들어가야 하는 줄만).
- `src/engine/sim/**`.
- `tests/acceptance_cases.json`(기대 객체에 `employeeId` 칸을 더하는 것만. 새 사례·개수 변경 없음).
- `docs/ai/tasks/results/TASK-0030.md`, `TASK-0030-d03*.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/*.ts` 가운데 위 밖, `src/content/**`, `src/ui/**`, `data/**`, `schemas/**`, `tools/**`, `PACKAGE_STATUS.json`, 위 목록 밖 `docs/**`.

## 지켜야 할 것

- TASK-0027·0029의 규칙이 그대로 적용된다(규칙 1 불변, 결정성, 통화 분리, 전체 객체 비교, 자료 ID 금지, 설정에 ID 키 금지).
- 규칙 1 골든: TASK-0028 결과 보고의 골든 스크립트(키 제거 없음)로 `<BASE>` 사본과 비교해 바이트가 같아야 한다. 기본 `run` 400회도 `compare` ‘같음’, `cmp` 0이어야 한다.

## 테스트

- `src/engine/m2a5-warehouse.test.ts`에 `describe('M2a-5 차단 기간 예측')`을 더한다.
  - TASK-0029 재현 상태(인수 명세 17에 행동을 더하지 말고, 시험 안에서 설정과 명령으로 만든다. 자료 ID는 설정에서 찾는다)에서 예측이 그 업무를 차단될 직원에게 맡기지 않는다.
  - 예측 완료일이 실제 완료일과 같다.
  - 차단 기간에 걸친 진행 중 업무는 그 기간에 진행하지 않는다.
  - `blocked`가 없으면 예측이 고치기 전과 같다(고치기 전 결과는 인수 04의 기대값이다).
- `src/engine/sim/m2a5-sim.test.ts`: 재현 변형·시드에서 `projectionMisses` 0, 미인도 0.

## 완료 조건

1. 지시 1~3 반영. 영입 변형 전체(기준 조건)의 `projectionMisses` 합이 0이다. 0이 아니면 남은 사례 하나를 재현과 함께 ‘질문’에 적는다.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0, 규칙 1 골든·기본 `run` 바이트 같음.
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 차단 기간에도 진행 중 업무를 진행 | `M2a-5 차단 기간 예측` |
| 2 | 차단될 직원에게 시작 전에 못 끝낼 업무도 배정 | `M2a-5 차단 기간 예측` |
| 3 | 실행기 `available`이 예측과 다른 규칙(차단 직원 제외 안 함) | `P0-M2A5-17 비교 실행기` 또는 새 sim 시험 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0030.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 골든, 걸린 시간, J1~J7 판정과 TASK-0029 대비 변화, 변형 표, 범위 밖 발견, 질문을 적는다.
