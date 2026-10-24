# TASK-0027-R1 M2a-5 엔진 마무리: 실패 3건·약한 시험·거짓 문장·변형 31종

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: `rv/TASK-0027` 머리(이 지시서를 올린 커밋, 이하 `<RV>`). 1차 결과 `da76e96`, 1차 기준 `a9b4afa`.
  - `<RV>` 자리표시가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0027-R1-m2a5-engine.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 기준 비교(`git diff`, `review_checks.sh`)는 1차 기준 **`a9b4afa`**로 한다. 1차와 R1을 합친 변경이 TASK-0027 전체다.
- 원래 지시서 `docs/ai/tasks/TASK-0027-m2a5-engine.md`의 범위·고칠 수 있는 파일·손대지 않을 파일·지켜야 할 것이 그대로 적용된다. **이 지시서와 다르면 이 지시서가 우선이다.**
- 1차 결과 보고 `docs/ai/tasks/results/TASK-0027.md`와 그 끝의 ‘검수’ 절(Claude)을 먼저 읽는다.

## 목표

1차 결과를 완료 상태로 만든다. 새 기능은 더하지 않는다.

## 바뀐 조건(1차와 다른 점)

- **크기 한도는 중단 조건이 아니다.** 첫 화면 크기가 한도를 넘어도 멈추지 않는다. `node tools/check_bundle_size.mjs dist` 출력 원문과 `a9b4afa` 대비 증감만 보고한다. 한도·빌드 설정·자료를 줄이지 않는다. 허브가 캐릭터 자료를 줄이는 TASK-0055를 따로 진행한다.
  - 그래서 `review_checks.sh`는 크기 검사 한 항목만 실패할 수 있다. 그 밖의 항목은 모두 통과해야 한다.
- **보고 칸 충돌의 판정(Claude):** 1차 ‘설계 판단’대로 `BookSummary`·`CurrencyStanding` 다섯 칸과 `fundsPosition.reservedCommitments`를 규칙 1에서도 0으로 두는 것을 받는다. 대신 아래 지시 2의 골든 비교로 ‘규칙 1의 상태·기록·보고는 이 새 칸 말고 모두 같다’를 증명한다.
- **S12 해석:** 정상 완료(`COMPLETED`)한 판에서 금지하는 것은 실패 기록 문장(‘경영 실패: …’)과 종료 뒤 거절 문장(‘캠페인이 끝났습니다(경영 실패).’)이다. 경고·위험 기록 문장에는 ‘경영 실패’라는 말이 들어갈 수 있다(명세 11.3). 단 지시 3-②의 고침을 따른다.

## 구현 지시

### 1. 실패한 시험 3건

- `src/engine/m2a5-save.test.ts`의 `M2a-5 규칙 1 불변`: 급여 행 `labelKo`를 고정 문자열로 두지 않는다. 지시 2의 골든 비교로 바꾸거나, 지금 엔진의 문장 규칙(`reports.ts`의 급여 행 이름)을 그 시나리오의 실제 직원 수로 계산한 값과 비교한다.

### 2. 규칙 1 골든 비교(완료 조건)

1차 시험은 기대값을 지금 코드·설정에서 계산해 작업 전과 비교하지 않는다. 다음 스크립트로 작업 전후를 직접 비교한다.

- 기준 사본: `git worktree add /tmp/TASK-0027-R1-base a9b4afa`. 그 안에 `node_modules`를 심볼릭 링크로 둔다. 비교가 끝나면 `git worktree remove /tmp/TASK-0027-R1-base`로 지운다(브랜치는 만들지 않는다).
- 스크립트 `/tmp/TASK-0027-R1-golden.mjs`(저장소 밖, 커밋하지 않음): `vite`의 `runnerImport`로(`src/engine/sim/run.mjs`와 같은 방식) 주어진 저장소 경로의 `src/content/scenario.ts`와 `src/engine/testkit.ts`·`engine.ts`·`reports.ts`·`save.ts`를 불러온다. `SCENARIO_IDS`의 시나리오마다 아래 세 실행을 90일(또는 `ENDED`)까지 돌려 JSON 한 파일로 쓴다.
  - (a) 명령 없이 대기.
  - (b) `tests/acceptance_cases.json`의 그 시나리오 기대 경로(있으면) 명령.
  - (c) 1일 원화 0원 설정(`startingCash.KRW = 0`)으로 대기. 미지급·지급 불가 문장을 본다.
  - 실행마다 담는 것: 마감한 날마다 `state` 전체 JSON, 마지막 `log` 전체, `campaignSummary`, 1일·30일 `upcomingPayments`, `contractProgress`(있는 계약마다), 그리고 `serializeSave` 결과의 `state` 부분.
- 비교 규칙: 두 파일이 바이트로 같아야 한다. 단 아래 차이만 허용하고, 비교 전에 **두 쪽에서** 지운다.
  - `BookSummary`·`CurrencyStanding`의 새 다섯 칸(`rentExpense`, `facilitySetupExpense`, `spaceContractExpense`, `fxSpreadExpense`, `currencyTransferNet`)과 `fundsPosition`의 `reservedCommitments`.
  - 저장 판본 숫자(5 → 6)와 `state.operations`(새 쪽 null).
  - `OfferDef`의 새 칸(`maxQuantity`, `quantityStep`, `serviceClass`, `publishDay`, `batchK`, `templateId`, `titleKo`, `prepWorkUnits`).
  - 그 밖의 차이가 하나라도 있으면 실패다. 결과 보고에 스크립트 전문, 두 출력의 sha256, 지운 키 목록, 비교 결과를 적는다.

### 3. 거짓 문장(검수 3~6)

- ① **0원 순매출(감액 100%):** `engine.ts:1048`·`:1096`·`:1115` 근처. 감액 뒤 순매출이 0이면 ‘매출 … 채권으로 남고 … 수금 예정’, ‘대금 … 수금’ 문장을 쓰지 않는다. 대신 인도 문장 끝을 ‘납기 {n}일 경과로 계약 금액 {금액} 전액이 감액되어 받을 대금이 없습니다.’로 쓴다. 0원 청구서·수금 기록(`invoice.receiptIds`의 `RCPT-…`)을 만들지 않는다. 계약은 인도일에 종결로 둔다. 반례: 감액 뒤 순매출이 1 cent 이상이면 지금 문장 그대로.
- ② **캠페인 뒤 실패일을 약속하는 경고:** `operations.ts:250`·`engine.ts:1173`. `failAtCloseOfDay > config.campaignDays`이면 실패일 문장 대신 ‘{campaignDays}일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝납니다.’로 쓴다(경고·위험 모두). 반례: 실패일이 캠페인 안이면 지금 문장 그대로.
- ③ **USD 현금 0일 때 부족 설명:** `engine.ts:282`, `operations.ts:134-141`. 현금 항목은 0이어도 남긴다: ‘사용 가능 {가용} = 현금 0.00 USD − 미지급 50.00 USD’. 모든 항목이 0이면 ‘= 현금 0.00 USD’. 원화 쪽(명세 12.1 3b)도 같은 규칙인지 확인하고 같게 한다.
- ④ **하역 대기 문장의 분기:** `progress.ts:73`. `config.operations` 유무가 아니라 `config.terms.lateDeliveryBasis`로 고른다. `PER_LATE_DAY_CAPPED`면 하루 비례 문장(명세 13.1), `FLAT_ONCE`면 지금 정액 문장. `lateDeliveryCapBasisPoints`가 null인데 하루 비례를 쓰는 경로가 없게 한다.
- 각 고침마다 문장 반례 시험을 `M2a-5 문장 반례`에 `it` 하나씩 더한다(S21~S24). 문장은 `toBe` 전체, 반례는 `not.toContain`.

### 4. 약한 시험 보강(검수 1·2)

- **P0-M2A5-16 가격 수용자:** 시험 안 정책이 생성 견적을 실제로 받게 한다. 후보는 `openTradePairs(state, config)`와 `state.operations.offers` 가운데 열린 주선 견적이다. 생성 견적 계약이 1건 이상 생겼다는 단언을 넣는다. `testkit.acceptAllFeasible`을 고치지 말고 새 도우미를 `m2a5-testkit.ts`에 둔다.
- **동어반복 제거:** 아래 기대값을 시험 대상 함수나 같은 식으로 다시 만들지 않는다. 명세 18절의 독립 수치를 `tests/acceptance_cases.json` 그 사례의 `expected_numeric`에 넣고 거기서 읽는다.
  - `m2a5-market.test.ts:45-52·56·78-86`(시세표·지수·행 값: 02 사례의 8·14·80·85일 값, 15일 묶음 지수 10,200·10,506).
- **시험 소스의 수치·ID 리터럴:** 다음을 인수 명세로 옮긴다. `m2a5-money.test.ts:77·134·152·253`, `m2a5-save.test.ts:28·31·40`, `m2a5-warehouse.test.ts:28·57-60·92·116-128`. 계약·업무 번호 형식(`CT001`, `TASK001`)은 써도 되지만 값과 함께 인수 명세에 두는 편을 따른다.
- **`assignQueued` 시험:** `m2a5-warehouse.test.ts:145-152`. 배정 순서(8.3 순서, 직원은 `config.employees` 순서, 쉬는 직원만)를 실제 날짜별 배정 결과 전체로 단언한다. 직원 순서를 뒤집는 변형이 실패해야 한다(변형 표 32).
- 1차 보고의 ‘남은 구체 검증 공백’도 처리한다: P0-M2A5-12의 두 거절 경로 전체 문장·값, 실패 기록의 선택 지출·같은 날 약정 순서, USD 원인 의무의 `recovery`, 저장 모양 하위 칸 손상.
- `save-v5.test.ts`의 새 import는 기존 12행 import에 합친다(지시서 부록 B).

### 5. 변형 시험

원래 지시서 완료 조건 4의 31종을 모두 실행한다. 아래를 더해 34종이다.

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 32 | `projectPrepCompletion`의 `assignQueued`가 직원을 역순으로 고름 | `M2a-5 준비 예측과 실제 진행` 또는 새 배정 순서 시험 |
| 33 | 0원 순매출에도 ‘수금 예정’ 문장을 씀 | `M2a-5 문장 반례`(S21) |
| 34 | 하역 대기 문장을 `config.operations`로 분기 | `M2a-5 문장 반례`(S24) |

- 방법은 원래 지시서와 같다(사본, 편집기로 넣고 되돌림, `cmp`). git으로 되돌리지 않는다.

## 완료 조건

1. 지시 1~5 반영.
2. 검증(기준 `a9b4afa`):
   - `npx vitest run`: 1차 시작 33개 파일·1,000개에 새 파일 4개만 늘었고 실패 0.
   - `python3 tools/test_validate_data.py` 통과, `python3 tools/validate_data.py` 첫 줄 `PASS: 24 data documents; …`.
   - `bash tools/ai/review_checks.sh --check a9b4afa`: 실패는 크기 검사 하나뿐이거나 0개. 크기 출력 원문을 보고에 붙인다.
   - 비교 실행기 회귀: 1차와 같은 방법으로 `compare` ‘같음’, `cmp` 종료 0.
   - 지시 2 골든 비교 ‘같음’.
3. 원래 지시서 완료 조건 3의 세 스크립트(허용 시험 파일, 새 시험 자료 ID 0, 부분 단언 없음)가 통과한다.
4. 변형 34종 표: 변형마다 실패한 시험 이름과 되돌린 뒤 `cmp` 결과.

## 결과 보고

`docs/ai/tasks/results/TASK-0027.md` 끝에 `## R1` 절을 더한다. 1차 내용과 Claude ‘검수’ 절은 지우지 않는다. 절 안에 바꾼 파일, 설계 판단, 실행한 검증(시작·끝 값), 골든 비교(스크립트 전문·sha256·지운 키), 문장 반례 S21~S24, 변형 34종 표, 크기 수치, 범위 밖 발견, 질문을 적는다.
