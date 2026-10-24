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
  2. 다른 일 몫 `otherPtPerWeek`이 최근 4개 공개 묶음의 견적 계약만 센다(`acceptedPrep`, 묶음 공급 견적의 직접 무역은 `buyOfferId`로 이미 들어간다). 그래서 묶음 0(`config.offers`, 시작 견적) 계약의 준비 pt가 빠진다. TASK-0030 검수 3절의 ‘직접 무역이 빠진다’는 이 뜻으로 바로잡는다.
- 이 지시서는 TASK-0028 지시 4의 해당 정의를 대체한다. 다른 정의는 그대로다. **명세·TASK-0028과 다르면 이 지시서가 우선이다.**

## 목표

1. 병목 표의 보관 칸과 다른 일 몫을, 최근 28일 동안 실제로 일어난 점유·체류·준비로 계산한다(리틀의 법칙 L = λW를 실측 L·W로 쓴다).
2. D03을 TASK-0030과 같은 조건(기준·cap30·flat200, 20시드)으로 다시 재고, J6를 다시 판정한다. **경제 자료·J 판정식·정책은 고치지 않는다.**

## 구현 지시

### 1. 관측 창

- 오늘이 `d`일 때 관측 창은 `[max(1, d − 28), d − 1]`일이다. 창 길이 `Lw = d − max(1, d − 28)`(0~28)이다.
- 창 길이가 0이면(1일) 아래 두 값은 지금 정의의 기본값을 쓴다. 다른 일 몫은 0, 다른 화물 점유는 0, 체류일은 `출항 간격 + 1`이다. 그래서 TASK-0028 반례(1일, 투자 없음 +0 / S+E 2pt +1·3pt +2)의 기대값은 바뀌지 않아야 한다.

### 2. 다른 일 몫 `otherPtPerWeek`

- 정의: 관측 창 안에 `acceptedDay`가 있는 계약 가운데, 작업 포함 주선(HANDLING)이 아닌 계약의 본사 준비 업무(`isHomePrep`) `requiredWorkUnits` 합을 `S`라 한다. 직접 무역·일반 주선·묶음 0(`config.offers`) 계약 모두 포함하고, 취소 계약도 그 업무가 만들어졌으면 넣는다. 오늘 수락한 계약은 창 밖이다.
- `otherPtPerWeek = floor(S × 7 ÷ Lw)`. `Lw = 0`이면 0.
- 이 값을 `staff`·`warehouseHandling` 두 칸에 지금처럼 쓴다.

### 3. 보관 칸 `storage`

기준 시점은 **명령(수락 시험) 시점**이다. `commitDay`는 명령을 먼저 처리하고 출항을 나중에 처리한다(`engine.ts` 2~4단계). 그래서 t일 명령 시점의 창고 재고는 t−1일 마감 재고와 같다. 그날 출항할 화물은 수락 시험 때 아직 창고에 있다.

- **화물과 계약의 연결:** `contract.cargoLotId`로만 잇는다(취소된 회사 화물은 `lot.contractId`가 null이 된다).
- **들어온 날 `in`:** 그 계약의 `acceptedDay`. 직접 무역 화물은 공급 행 도시(본사)에서, 주선 화물은 견적 도시에서 수락 때 생긴다. 본사가 아닌 도시에서 생긴 화물은 넣지 않는다. 시작 상태에는 계약·화물이 없다. 이 밖의 경로를 코드에서 찾으면 ‘설계 판단’에 적는다.
- **나간 날 `out`:**
  - 출항한 화물: 그 선적(`shipments`, `contractId`로 찾음)의 `departureDay`. 출항을 놓치면 선적이 생기지 않으므로 실제 출항일만 쓰인다.
  - 취소한 고객 화물(`RETURNED_TO_OWNER`): 그 계약의 `cancelledDay`.
  - 취소한 회사 화물(`HELD_UNALLOCATED`): 나가는 경로가 없다. `out = ∞`(오늘까지 계속 점유)다.
  - 아직 창고에 있는 화물: `out = ∞`.
- **t일 명령 시점 점유:** `occ(t) = Σ 부피` (`in < t ≤ out`인 비-HANDLING 화물). HANDLING 계약 화물은 빼고, 직접 무역·일반 주선·묶음 0 계약·취소된 회사 화물은 넣는다.
- **다른 화물 평균 점유 `Lo`(L):** 관측 창의 날 t마다 `occ(t)`를 구해 평균(내림)한다.
- **작업 포함 주선 체류 `Dh`(일):** 관측 창 안에 실제 출항한 HANDLING 계약마다 `departureDay − acceptedDay + 1`(명령 시점에 공간을 막는 날 수, 출항일 포함)을 구해 평균(올림)한다. 예약은 출항 전날까지라 이 값은 2 이상이다. 그런 계약이 없으면 `출항 간격 + 1`(지금 정의)이다.
- **칸 값:** `storage = floor(max(0, storageCapacityLiters − Lo) × 7 ÷ (Dh × V))`. 고용 전후 같다. `storageCapacityLiters`는 지금처럼 오늘 기준(확장 반영)이다.
- 결과에 `storageDetail: { otherOccupancyLiters: Lo; otherPeakLiters: 창 안 occ(t)의 최댓값; handlingDwellDays: Dh; windowDays: Lw }`를 더한다. 화면(Sol)이 근거를 보이고, 평균과 최고점의 차이를 진단하는 데 쓴다. 판정식에는 쓰지 않는다. 창 길이가 0이면 `{ 0, 0, 출항 간격 + 1, 0 }`.

### 4. 지표와 d03 표

- `metrics.operations`에 `handlingJobs`를 더한다. 캠페인 동안 수락한 HANDLING 계약 수다(취소 제외, 납기 안에 끝내지 못한 건도 포함).
- `operations-metrics.ts`의 `bottlenecks` 기록에 `otherPtPerWeek`과 `storageDetail`을 더한다(d03 표의 중앙값용).
- d03 ‘J6 칸별 병목 예측’ 표에 두 열을 더한다.
  - `처리 증가 실측`: 시드마다 고용 실행과 같은 시드의 고용 없는 기준 실행의 `handlingJobs` 차이를 구하고, 그 중앙값을 낸다.
  - `실현률`: 시드마다 `차이 ÷ (그 칸 예측 추가 업무/주 × (campaignDays − actualDay + 1) ÷ 7)`(소수)를 구해 중앙값을 낸다. `actualDay`는 `actualHires`의 실제 고용일이다. 고용하지 못한 시드(`actualDay` null)는 빼고, 뺀 수를 같은 줄에 적는다. 예측이 0이면 —.
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
- `src/engine/m2a5-readers.test.ts`: 새 `describe` 추가, 결과 객체에 `storageDetail` 칸 반영. 정의가 바뀌어 값이 달라지는 기존 기대값(인수 18의 `storage`·`with_trade`·`history_36`·`history_43` 등 병목 표 칸)은 다시 계산해 고친다. 시험 ‘최근 네 묶음은 … 오래된 묶음을 제외한다’는 새 정의(28일 창이 오래된 계약을 뺀다)를 검사하는 시험으로 바꾼다. 바뀐 값마다 이전→새 값과 이유를 결과 보고에 적는다.
- 그 밖에 `weeklyBottleneck` 결과 객체 전체를 비교하는 시험 파일이 있으면, 그 비교에 `storageDetail` 칸을 더하는 줄만.
- `src/engine/sim/**`.
- `tests/acceptance_cases.json`: 새 사례 하나(아래 시험 1), 기존 병목 기대 객체에 `storageDetail`을 더하는 것, 바로 위 줄의 재계산 값. 그 밖의 값·사례 수는 고치지 않는다. 3일 투자 반례(`invested_day: 3`)의 `storageDetail`은 `{ 0, 0, 출항 간격 + 1, 2 }`다(창 1~2일에 화물 없음).
- `docs/ai/tasks/results/TASK-0031.md`, `TASK-0031-d03*.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/*.ts` 가운데 위 밖(엔진 규칙·수락 시험·`storageShortfall`은 그대로), `src/content/**`, `src/ui/**`, `data/**`, `schemas/**`, `tools/**`, `PACKAGE_STATUS.json`, 위 목록 밖 `docs/**`.
- `src/ui/**`가 `WeeklyBottleneck`을 쓰다가 타입이 깨지면 고치지 말고 ‘질문’에 적는다. 새 칸은 더하기만 하므로 깨지지 않아야 한다.

## 지켜야 할 것

- TASK-0027~0030의 규칙이 그대로 적용된다. 규칙 1 불변, 결정성, 통화 분리, 전체 객체 비교, 시험 소스에 자료 ID 금지, 설정에 ID 키 금지.
- 규칙 1 골든: TASK-0028 결과 보고의 골든 스크립트로 `<BASE>` 사본과 비교해 바이트가 같아야 한다. 기본 `run` 400회도 `compare` ‘같음’, `cmp` 0이어야 한다. 병목 표는 규칙 1 상태를 바꾸지 않는다.
- 캐릭터 자료의 새 칸을 읽지 않는다(`src/content/character-fields.ts` 규칙 해당 없음).

## 시험

1. **인수 새 사례(독립 기대값):** 규칙 2 시나리오에서 정해진 명령으로 30일까지 진행한 상태를 만든다.
   - 명령은 새 사례의 `test_fixture`에 둔다(기존 `atDay`·`scriptOf` 방식). 시험 소스에 자료 ID를 쓰지 않는다.
   - 진행에 반드시 넣을 것: 2~3일에 묶음 0 견적 수락 1건 이상, 직접 무역 1건 이상과 HANDLING 1건 이상의 실제 출항, 일반 주선 취소 1건, 직접 무역 취소 1건(창 안에서). 그래야 변형 3·4가 잡힌다.
   - 그 상태의 `otherPtPerWeek`, `Lo`, `otherPeakLiters`, `Dh`, `storage`, 2pt 후보 `extraJobsPerWeek`를 손으로 계산해 `expected_numeric`에 리터럴로 넣는다.
   - 손계산은 계약·선적 원기록 표(계약별 `acceptedDay`·출항일·취소일·부피·준비 pt)에서 한다. 시험 대상 함수나 같은 식을 쓴 스크립트로 기대값을 만들지 않는다. 그 표와 계산 과정을 결과 보고에 적는다.
2. **재구성 점유 = 실제 점유:** 같은 진행에서 날마다(t = 1~29) t일 마감 상태의 본사 창고 비-HANDLING 화물 부피를 실제로 센다. HANDLING이 아닌 계약의 화물과 계약 없는 회사 화물이다. 이 값이 재구성 `occ(t + 1)`과 모든 날 같아야 한다.
3. **1일 반례 불변:** TASK-0028 반례 네 값(+0, +1, +2, 그리고 1일 `binding.before`)과 `storageDetail = { 0, 0, 출항 간격 + 1, 0 }`.
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
| 4 | 재구성에서 취소한 고객 화물의 나간 날을 무시 | 시험 2 |
| 5 | 취소한 회사 화물을 `cancelledDay`에 나간 것으로 셈 | 시험 2 |
| 6 | `Dh`에서 `+ 1`을 뺌 | 시험 1 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0031.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 골든, 걸린 시간, 인수 새 사례 손계산, J1~J7과 TASK-0030 대비 변화, 변형 표, 범위 밖 발견, 질문을 적는다.
