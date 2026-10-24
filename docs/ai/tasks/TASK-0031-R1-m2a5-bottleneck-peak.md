# TASK-0031-R1 M2a-5 병목 표: 묶음 0 제외와 보관 칸 최고 점유

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: `rv/TASK-0031` 머리. 이 지시서를 올린 커밋이며, `claude/m2a5-engine`에 병합된 상태다(이하 `<RV>`).
  - 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0031-R1-m2a5-bottleneck-peak.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 1차 결과는 `5ea3b15`, 1차 기준은 `fe67c0e`다. 기준 비교(`review_checks.sh`)는 1차 기준 `fe67c0e`로 한다.
- 원래 지시서 `docs/ai/tasks/TASK-0031-m2a5-bottleneck-storage.md`의 범위·고칠 수 있는 파일·지켜야 할 것이 그대로 적용된다. **이 지시서와 다르면 이 지시서가 우선이다.**
- 먼저 읽을 것: `docs/ai/tasks/results/TASK-0031.md` 끝의 ‘검수’ 절. 특히 3절 실험 표를 읽는다.

## 목표

TASK-0031의 정의 두 곳을 고친다. 새 기능은 더하지 않는다.

1. **묶음 0 제외:** 다른 일 몫 `otherPtPerWeek`과 비-HANDLING 점유 `occ(t)`(따라서 `otherOccupancyLiters`·`otherPeakLiters`)에서 묶음 0 계약을 뺀다. 묶음 0 계약은 견적이 `config.offers`에 있는 계약이다. 판별은 `serviceOfferId ?? buyOfferId`로 한다.
   - 이유: 시작 견적은 한 번만 나온다. 이것을 주당 값으로 외삽하면 8일 고용 칸 예측이 틀린다(검수 2절). TASK-0028의 ‘묶음 0 제외’가 원래 맞았다.
   - HANDLING 체류 `Dh`의 표본에는 묶음 0 계약이 원래 없다. 묶음 0에 HANDLING 견적이 있으면 그것도 뺀다.
2. **보관 칸은 최고 점유로 계산한다:** `storage = floor(max(0, storageCapacityLiters − otherPeakLiters) × 7 ÷ (Dh × V))`.
   - `otherOccupancyLiters`(평균)는 결과 칸으로 그대로 두되 칸 계산에는 쓰지 않는다. 화면에서 평균과 최고를 함께 보여 주기 위해서다.
   - 이유: 수락 시험은 그 순간의 점유로 판정한다. 그래서 공간이 막히는지는 평균이 아니라 최고점이 결정한다(검수 3절).

`storageDetail` 모양, 관측 창(`[max(1, d − 28), d − 1]`), 점유 재구성 규칙, `Dh` 정의, 창 길이 0일 때의 기본값은 그대로다.

## 구현 지시

### 1. 엔진 (`src/engine/readers.ts`의 `weeklyBottleneck`만)

- 위 두 가지만 고친다. `acceptedPrep`·수요·`hiringOutlook`은 손대지 않는다.

### 2. 시험·인수 기대값

- `P0-M2A5-20`(1차에서 추가한 새 사례): 묶음 0 계약(CT001·CT002)이 빠지므로 다시 손계산해 `expected_numeric`을 고친다. 계산 표와 이전→새 값을 보고한다.
  - 세션 A 검산값(다르면 원기록 표가 사실이다): 다른 일 몫 `floor(2 × 7 ÷ 28) = 0`(CT004 2pt만 남음). 점유는 CT004 300L가 16~29일 14일 동안이다. 그래서 `Lo = floor(4,200 ÷ 28) = 150`, 최고 300이다. `Dh = 9`. `storage = floor((40,000 − 300) × 7 ÷ 81,000) = 3`. 직원 2 → 3, 창고 처리 3, 선복 2이므로 `extraJobsPerWeek = 0`.
  - 이 사례로 변형 1·2가 잡히는지 확인한다. 안 잡히면 사례의 명령을 바꾸지 말고, 묶음 0과 묶음 1 이후 화물이 함께 있는 날짜를 하나 더 읽는 `expected_numeric` 항목을 더한다.
- 인수 18의 병목 기대값과 `storageDetail`도 새 정의로 다시 계산하고 이전→새 값을 보고한다. 1차 ‘기존 인수 18 기대값 변경’ 표를 고쳐 쓴다.
- 일별 재구성 시험(시험 2)은 묶음 0 계약을 빼고 센 실제 점유와 비교한다.

### 3. D03 재측정

- 1차와 같은 세 명령으로 20시드씩 다시 잰다. 결과 파일 `TASK-0031-d03*.md`를 새 측정으로 덮어쓴다(1차 값은 결과 보고에 남긴다).
- 결과 보고에 다음을 적는다.
  - 조건별 J6를 세 판(TASK-0030 / 1차 / R1) 나란히. 세션 A 오프라인 추정은 기준 89.3%, cap30 86.8%, flat200 87.5%다. 다르면 차이가 나는 칸을 적는다.
  - J6 일치율의 투자별·수락 정책별 변화, 남은 불일치 칸마다 원인 후보.

## 완료 조건

1. 지시 1~3 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check fe67c0e` 실패 0, 규칙 1 골든·기본 `run` 바이트 같음.
3. 변형 시험(사본·편집기·되돌림·`cmp`). 1차 변형 1~6도 다시 실행한다.

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 7 | 묶음 0 계약을 다른 일 몫·점유에 다시 넣음 | 시험 1(P0-M2A5-20) |
| 8 | 보관 칸에 최고 대신 평균 점유를 씀 | 시험 1 또는 인수 18 병목 시험 |

4. 결과 보고: `docs/ai/tasks/results/TASK-0031.md` 끝에 `## R1` 절을 더한다. 1차 내용과 검수 절은 지우지 않는다. 바꾼 파일, 설계 판단, 검증(시작·끝 값), 손계산, 변형 8종 표, J6 세 판 비교, 범위 밖 발견, 질문을 적는다.
