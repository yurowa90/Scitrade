# TASK-0031 M2a-5 주간 병목 표의 보관 칸·다른 일 몫 정의 고침과 J6 재측정

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `<BASE>`(TASK-0030 병합 뒤, 이 지시서를 올린 커밋). 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0031-m2a5-bottleneck-storage.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
- 배경: `docs/ai/tasks/results/TASK-0030.md`의 ‘검수’ 3·4절.
  - J6는 76.0%다. 불일치 18칸 가운데 16칸이 S 투자(선복만 늘림)다.
  - S 29일 고용 칸에서 표는 주당 +1건을 예측하지만, 실제 처리 증가는 남은 8.7주 동안 +2건이다. 순자산은 18~20/20 시드에서 줄었다.
  - S 기준 실행의 수락 거절 사유는 보관이 가장 많았다(중앙 56회). 그런데 평균 보관 이용률은 51%였다.
- 원인(세션 A 판단): `weeklyBottleneck`(`src/engine/readers.ts`)의 두 정의가 엔진의 실제 수락 규칙과 다르다.
  1. 보관 칸이 창고를 작업 포함 주선 화물만 쓴다고 본다. 실제 `storageShortfall`은 본사 창고의 모든 화물(준비 중·출항 대기·미배정)을 센다. 직접 무역과 일반 주선 화물도 포함한다. 또 체류일을 `출항 간격 + 1`로 고정한다.
  2. 다른 일 몫 `otherPtPerWeek`이 묶음 견적의 계약만 센다. 그래서 묶음에 매이지 않는 직접 무역의 준비 pt가 빠진다.
- 이 지시서는 TASK-0028 지시 4의 해당 정의를 대체한다. 다른 정의는 그대로다. **명세·TASK-0028과 다르면 이 지시서가 우선이다.**

## 목표

1. 병목 표의 보관 칸과 다른 일 몫을, 최근 28일 동안 실제로 일어난 점유·체류·준비로 계산한다(리틀의 법칙 L = λW를 실측 L·W로 쓴다).
2. D03을 TASK-0030과 같은 조건(기준·cap30·flat200, 20시드)으로 다시 재고, J6를 다시 판정한다. **경제 자료·J 판정식·정책은 고치지 않는다.**

## 구현 지시

### 1. 관측 창

- 오늘이 `d`일 때 관측 창은 `[max(1, d − 28), d − 1]`일이다. 창 길이 `Lw = d − max(1, d − 28)`(0~28)이다.
- 창 길이가 0이면(1일) 아래 두 값은 지금 정의의 기본값을 쓴다. 다른 일 몫은 0, 다른 화물 점유는 0, 체류일은 `출항 간격 + 1`이다. 그래서 TASK-0028 반례(1일, 투자 없음 +0 / S+E 2pt +1·3pt +2)의 기대값은 바뀌지 않아야 한다.

### 2. 다른 일 몫 `otherPtPerWeek`

- 정의: 관측 창 안에 `acceptedDay`가 있는 계약 가운데, 작업 포함 주선(HANDLING)이 아닌 계약의 본사 준비 업무(`isHomePrep`) `requiredWorkUnits` 합을 `S`라 한다. 직접 무역·일반 주선·시작 계약 모두 포함하고, 취소 계약도 그 업무가 만들어졌으면 넣는다.
- `otherPtPerWeek = floor(S × 7 ÷ Lw)`. `Lw = 0`이면 0.
- 이 값을 `staff`·`warehouseHandling` 두 칸에 지금처럼 쓴다.

### 3. 보관 칸 `storage`

- **다른 화물 평균 점유 `Lo`(L):** 관측 창의 날마다, 그날 마감 시점에 본사 창고에 있던 화물 가운데 HANDLING 계약 화물이 아닌 것의 부피 합을 구한다. 그 평균(내림)이 `Lo`다.
  - 날마다의 창고 재고는 상태에 기록이 없으므로 계약 기록으로 재구성한다.
  - 화물이 창고에 들어온 날: 그 계약의 `acceptedDay`. 단 본사에서 화물이 생기는 경우만이다. 들어오는 날이 다른 경로가 있으면 코드에서 찾아 정의를 ‘설계 판단’에 적는다.
  - 나간 날: 그 화물 선적(`shipments`)의 실제 `departureDay`. 아직 출항하지 않았으면 오늘. 취소 계약은 `cancelledDay`.
  - 계약에 묶이지 않은 화물(예: 계약 없이 창고에 남은 회사 재고, `HELD_UNALLOCATED`)이 있을 수 있다. 그런 화물이 생기는 경로를 코드에서 찾아 같은 방식(들어온 날·나간 날)으로 넣고, ‘설계 판단’에 적는다. 상태만으로 날짜를 알 수 없으면 멈추지 말고 오늘 있는 것만 오늘 점유로 넣은 뒤 ‘질문’에 적는다.
  - 재구성 결과는 시험에서 실제 날마다 `storageUsedLiters`와 같아야 한다(아래 시험 2).
- **작업 포함 주선 체류 `Dh`(일):** 관측 창 안에 실제 출항한 HANDLING 계약마다 `departureDay − acceptedDay`를 구해 평균(올림)한다. 그런 계약이 없으면 `출항 간격 + 1`(지금 정의)이다.
- **칸 값:** `storage = floor(max(0, storageCapacityLiters − Lo) × 7 ÷ (Dh × V))`. 고용 전후 같다. `storageCapacityLiters`는 지금처럼 오늘 기준(확장 반영)이다.
- 결과에 `storageDetail: { otherOccupancyLiters: Lo; handlingDwellDays: Dh; windowDays: Lw }`를 더한다. `otherPtPerWeek`은 지금 칸을 그대로 쓴다. 화면(Sol)이 근거를 보여 줄 수 있게 하려는 것이다.

### 4. 지표와 d03 표

- `metrics.operations`에 `handlingJobs`를 더한다. 캠페인 동안 수락한 HANDLING 계약 수다(취소 제외).
- d03 ‘J6 칸별 병목 예측’ 표에 두 열을 더한다.
  - `처리 증가 실측`: 같은 시드의 고용 없는 기준 실행 대비 `handlingJobs` 차이의 중앙값.
  - `실현률`: `처리 증가 실측 ÷ (추가 업무/주 중앙 × 고용일부터 캠페인 끝까지 주 수)`. 예측이 0이면 —.
- J6 판정식(순자산 방향과 예측 방향의 일치율 ≥ 80%)은 바꾸지 않는다. 새 열은 진단용이다.

### 5. D03 재측정

- TASK-0030과 같은 세 명령으로 20시드씩 다시 잰다. 결과 파일: `docs/ai/tasks/results/TASK-0031-d03.md`, `-cap30.md`, `-flat200.md`. 이전 결과 파일은 지우지 않는다.
- 결과 보고에 다음을 적는다.
  - TASK-0030 대비 J1~J7 판정 변화.
  - J6 일치율: 조건별·수락 정책별·투자별.
  - 표 예측이 바뀐 칸 목록(이전 예측 → 새 예측, 새 `storageDetail` 중앙값).
  - 남은 불일치 칸마다 원인 추정.
- **편향 주의:** 이 고침의 원인은 TASK-0030의 같은 20시드에서 찾았다. 그래서 기준 조건 J6는 낙관 편향이 있을 수 있다. cap30·flat200의 일치율은 따로 보고한다. 감액 규칙만 달라 같은 시드라도 수락 경로가 달라지기 때문이다. 판정 결과를 해석하지 말고 수치만 적는다.

## 고칠 수 있는 파일

- `src/engine/readers.ts`(`weeklyBottleneck`, `WeeklyBottleneck` 형, 이 둘만 쓰는 내부 도우미).
- `src/engine/m2a5-readers.test.ts`(새 `describe` 추가, 결과 객체에 `storageDetail` 칸 반영).
- 그 밖에 `weeklyBottleneck` 결과 객체 전체를 비교하는 시험 파일이 있으면, 그 비교에 `storageDetail` 칸을 더하는 줄만.
- `src/engine/sim/**`.
- `tests/acceptance_cases.json`: 새 사례 하나(아래 시험 1)와, 기존 병목 기대 객체에 `storageDetail`을 더하는 것만. 기존 값은 고치지 않는다.
- `docs/ai/tasks/results/TASK-0031.md`, `TASK-0031-d03*.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/*.ts` 가운데 위 밖(엔진 규칙·수락 시험·`storageShortfall`은 그대로), `src/content/**`, `src/ui/**`, `data/**`, `schemas/**`, `tools/**`, `PACKAGE_STATUS.json`, 위 목록 밖 `docs/**`.
- `src/ui/**`가 `WeeklyBottleneck`을 쓰다가 타입이 깨지면 고치지 말고 ‘질문’에 적는다. 새 칸은 더하기만 하므로 깨지지 않아야 한다.

## 지켜야 할 것

- TASK-0027~0030의 규칙이 그대로 적용된다. 규칙 1 불변, 결정성, 통화 분리, 전체 객체 비교, 시험 소스에 자료 ID 금지, 설정에 ID 키 금지.
- 규칙 1 골든: TASK-0028 결과 보고의 골든 스크립트로 `<BASE>` 사본과 비교해 바이트가 같아야 한다. 기본 `run` 400회도 `compare` ‘같음’, `cmp` 0이어야 한다. 병목 표는 규칙 1 상태를 바꾸지 않는다.
- 캐릭터 자료의 새 칸을 읽지 않는다(`src/content/character-fields.ts` 규칙 해당 없음).

## 시험

1. **인수 새 사례(독립 기대값):** 규칙 2 시나리오에서 정해진 명령으로 30일까지 진행한 상태를 만든다. 직접 무역 1건 이상과 HANDLING 1건 이상이 출항한 상태여야 한다.
   - 그 상태의 `otherPtPerWeek`, `Lo`, `Dh`, `storage`, 2pt 후보 `extraJobsPerWeek`를 손으로 계산해 `expected_numeric`에 리터럴로 넣는다. 계산 과정(계약별 입·출 날짜와 부피)은 결과 보고에 적는다.
   - 시험은 함수 결과를 그 리터럴과 비교한다. 시험 대상 함수나 같은 식으로 기대값을 다시 만들지 않는다.
2. **재구성 점유 = 실제 점유:** 같은 진행에서 날마다 마감 상태의 `storageUsedLiters` 가운데 비-HANDLING 화물 몫을 실제로 센다. 재구성식(지시 3)으로 구한 그날 값과 모든 날 같아야 한다.
3. **1일 반례 불변:** TASK-0028 반례 네 값(+0, +1, +2, 그리고 1일 `binding.before`)과 `storageDetail = { 0, 출항 간격 + 1, 0 }`.
4. `M2a-5 실행기 성질`에 `handlingJobs` 계산 시험 하나.

## 완료 조건

1. 지시 1~5 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0, 규칙 1 골든·기본 `run` 바이트 같음.
3. 변형 시험(사본·편집기·되돌림·`cmp`, git으로 되돌리지 않음):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 보관 칸에서 `Lo`를 빼지 않음 | 시험 1 |
| 2 | `Dh`를 `출항 간격 + 1`로 고정 | 시험 1 |
| 3 | 다른 일 몫을 묶음 견적 계약만으로 셈(이전 정의) | 시험 1 |
| 4 | 재구성에서 취소 계약의 나간 날을 무시 | 시험 2 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0031.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 골든, 걸린 시간, 인수 새 사례 손계산, J1~J7과 TASK-0030 대비 변화, 변형 표, 범위 밖 발견, 질문을 적는다.
