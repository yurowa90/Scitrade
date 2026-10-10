# TASK-0028 M2a-5 읽기 함수: 견적·환전 미리 보기, 본사·창고 표, 주간 병목 표, 지급 일정 (규칙 2)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 아래 행 번호는 개발 브랜치 `afdf728`(TASK-0027 병합) 기준이다. 다르면 코드가 사실이다.
- 선행 작업: 개발 브랜치 `<BASE>`(TASK-0027 병합 뒤, 이 지시서를 올린 커밋). 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0028-m2a5-sim-readers.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
- 분할: 원래 TASK-0028 초안의 비교 실행기·D03 재측정은 **TASK-0029**로 옮겼다(`docs/ai/tasks/TASK-0029-m2a5-d03.md`). 한 번에 맡기는 크기를 줄이려는 것이다(TASK-0027이 1차에 끝나지 못한 교훈). 이 작업은 `src/engine/sim/**`를 고치지 않는다.
- 결정 근거: `docs/DECISIONS.md` ‘M2a-5 사용자 결정 Q1·Q10·Q12 (2026-10-10)’의 Q12 가(주간 병목 표), 223행(표시와 결과 일치). 설계 근거 `docs/ai/design/m2a5-review/REVIEW3.md` b1.
- 명세: `docs/ai/design/M2A5-SPEC.md` 14.3~14.6·14.8, 16절. **명세와 이 지시서가 다르면 이 지시서가 우선이다**(특히 14.6은 이 지시서의 병목 표로 바뀌었다).

## 목표

규칙 2 화면(후속 Sol 작업)이 쓸 읽기 함수를 엔진에 만든다. 모두 상태를 바꾸지 않는다. 규칙 1의 기존 함수 결과는 바이트 단위로 그대로다.

## 먼저 읽을 파일

- `src/engine/operations.ts`: 14~52행(보관·처리 한도, `allocateHandling`), 54~86행(`projectPrepCompletion`), 94~124행(선복·임차료), 126~141행(감액·USD 설명), 210~237행(`paymentDefaultStatus`).
- `src/engine/reports.ts`: 62~176행(`QuotePreview`, `tradePreview`, `forwardingPreview`, `tradePairs`), 213~296행(`UpcomingPaymentKind`, `upcomingPayments`).
- `src/engine/previews.ts`: 41~55행(`payrollRunwayDay`).
- `src/engine/market.ts`: 82~114행(`offerDef`, `openTradePairs`, `marketTable`, `prepWorkUnitsFor`).
- `src/engine/capacity.ts`: 49~94행(`workloadSummary`).
- `src/engine/reservations.ts`(`fundsPosition`, `commitmentReservations`, 선복 한도).
- 자료: `data/market_rules.json`(틀 `prep_work_units`, 부피·무게), `data/routes.json`.
- 화면(읽기만): `src/ui/main.ts`가 `upcomingPayments`·`UpcomingPaymentKind`를 쓰는 곳.

## 구현 지시

### 1. `quotePreview(state, config, offerIds, quantity?)` (명세 14.3)

- 새 함수다. 기존 `tradePreview`·`forwardingPreview`는 바꾸지 않는다.
- 반환: 기존 `QuotePreview` 칸 전부 + `quantity`, `maxQuantity`, `quantityStep`, `prepWorkUnits`, `volumeLiters`, `massGrams`, `storageAfterLiters`, `storageCapacityLiters`, `counterpartySpreadPct`, `serviceClass`, `titleKo`, `contributionPerPrepPtMinor`(기여이익 ÷ 준비 pt, 내림), `lateDeliveryReductionMinor`(다음 출항편으로 보낼 때의 감액, `lateDeliveryReduction` 사용, 정시면 0), `affectedContracts: { contractId; readyBefore; readyAfter; missesSailing }[]`.
- `affectedContracts`: 이 견적을 오늘 쉬는 직원에게 맡긴 계획 상태에서 `projectPrepCompletion`을 다시 돌려, 준비 완료일이 늦어지는 기존 계약만 담는다. `missesSailing`은 예약한 출항일 < `readyAfter`이거나 `readyAfter`가 null일 때 true다.
- 거절될 견적(수량·보관·자금)이면 `null`이 아니라 `{ allowed: false, reasonKo }`를 더해 돌려준다. 문장은 명령 거절 문장과 같아야 한다(같은 검사 함수를 쓴다).

### 2. `exchangePreview(state, config, direction, usdAmountMinor)` (명세 14.4)

- 반환 `{ allowed; reasonKo; krwMinor; spreadKrwMinor; usdAvailableBefore; usdAvailableAfter; krwAvailableBefore; krwAvailableAfter; runwayBefore; runwayAfter; warningKo }`.
- `allowed`·`reasonKo`는 `EXCHANGE_CURRENCY` 검사와 같은 함수·같은 문장이다.
- `runwayAfter`는 환전 뒤 원화로 `payrollRunwayDay`를 계산한다(통화를 합치지 않는다).
- `warningKo`(S15): KRW→USD 뒤 원화가 오늘 낼 임차료·급여보다 적으면 ‘환전 뒤 원화 {가용}으로는 오늘 급여·임차료 {금액}을 다 낼 수 없습니다.’, 아니면 null.

### 3. `warehouseSummary(state, config)` (명세 14.5)

- 명세 14.5의 칸 그대로: `storage`, `handling`(오늘 배분 미리 계산: `allocateHandling` 사용), `prepDaysToClear`(`projectPrepCompletion` 기준), `demand`(오늘 열린 견적 합, 최근 4묶음 이력), `staff`, `sailings[]`, `rent`, `expansion`, `spaceContracts[]`.
- `demand.recent[]`의 `acceptedPrepPt`·`handlingAccepted`는 그 묶음의 견적으로 체결한 계약(`operations.offers`의 `publishDay`로 묶음을 찾는다)에서 센다.
- 여기에 `bottleneck: WeeklyBottleneck`(지시 4, 고용 후보 없이)을 더한다.

### 4. 주간 병목 표 `weeklyBottleneck(state, config, candidateId?)` (Q12 가)

학생이 “직원을 더 두면 일주일에 작업 포함 주선을 몇 건 더 처리할 수 있나”를 화면 한 표로 판단하게 하는 값이다. 주(7일) 단위의 정상 상태 용량 추정이다. 모의 실행이 아니다. 같은 입력이면 같은 출력이다.

- **단위:** ‘작업 포함 주선 건수/주’. 기준 화물은 자료의 HANDLING 틀이다. 부피 `V`(L)는 틀 부피의 최댓값, 준비량 `P`(pt)는 틀 `prep_work_units`의 최댓값이다(자료에서 계산, 지금 값 9,000 L·12pt).
- **수요 `demand`:** 최근 4개 공개 묶음(오늘 이하 공개일, 묶음 0 제외)의 HANDLING 견적 수 평균(소수 버림 없이 `{ offeredPerWeek: 분자, weeks: 분모 }`로 둔다). 묶음이 없으면 null.
- **다른 일 몫 `otherPtPerWeek`:** 최근 4묶음에서 체결한 STANDARD 주선과 직접 무역의 준비 pt 합 ÷ 묶음 수(내림). 없으면 0.
- **제약별 용량(고용 전 `before`, 후 `after`):**
  - `staff`: `floor(max(0, 본사 직원 처리량 합 × 7 − otherPtPerWeek) ÷ P)`. 본사 직원 = 고용 상태이고 위치가 본사 도시인 직원. `after`는 후보의 `workUnitsPerDay`를 더한다.
  - `warehouseHandling`: `floor(max(0, handlingCapacityPt(오늘 기준, 확장 반영) × 7 − otherPtPerWeek) ÷ P)`. 고용 전후 같다.
  - `storage`: `floor(storageCapacityLiters × 7 ÷ (D × V))`. `D` = 체류 일수 = 출항 간격 + 예약 마감 일수(자료에서 계산, 지금 7 + 1 = 8). 고용 전후 같다.
  - `sailing`: 노선마다 `min(floor(부피 한도 ÷ V), floor(무게 한도 ÷ 그 노선 목적지 HANDLING 틀 무게의 최댓값))`의 합. 그 노선의 다음 출항편(출항일이 오늘보다 뒤인 첫 편) 기준이며 선복 계약 한도를 반영한다. 고용 전후 같다.
- **결과:** `{ unit: 'HANDLING_JOBS_PER_WEEK'; demand; otherPtPerWeek; rows: { constraint: 'DEMAND' | 'STAFF' | 'WAREHOUSE_HANDLING' | 'STORAGE' | 'SAILING'; before: number | null; after: number | null }[]; binding: { before: 제약[]; after: 제약[] }; usableBefore; usableAfter; extraJobsPerWeek; remainingHandlingBatches; contributionPerJobMinor; wageKrwPerWeek | null; wageUsdLotsPerWeek | null }`.
  - `usable` = 각 열의 최솟값(수요 포함, 수요가 null이면 수요 빼고). `binding`은 최솟값과 같은 제약 전부(동률 포함).
  - `extraJobsPerWeek = usableAfter − usableBefore`(후보가 없으면 0).
  - `remainingHandlingBatches`: 오늘 이후 공개될 묶음 가운데 HANDLING 견적이 나올 수 있는 묶음 수(납기·결제가 캠페인 안). 지금 자료로 1일에 10.
  - `contributionPerJobMinor`: HANDLING 틀 기여이익(서비스 대금 − 운임)의 최솟값(USD).
  - 임금은 원화 그대로(`wageKrwPerWeek` = 일급 × 7), 환전 필요량은 `wageUsdLotsPerWeek = ceil(일급 × 7 ÷ USD→KRW 환율 × 100 USD)`. 통화를 더하지 않는다. 후보가 없으면 둘 다 null.
- **반례:** 투자 없는 회사(1일, 기본 직원 2명)에 2pt 후보 → `STAFF` before 2 → after 3, `SAILING` 2라 `extraJobsPerWeek` 0이다. 선복 계약 두 노선과 창고 확장이 적용된 상태 → 2pt 후보 +1, 3pt 후보 +2. 이 네 값을 인수 명세 새 사례(아래 지시 7)로 고정하고 시험한다. 계산이 이 값과 다르면 값을 고치지 말고 ‘질문’에 적는다.

### 5. `hiringOutlook(state, config, candidateId)` (명세 14.6 대체)

- `{ workUnitsPerDay; wageKrwPerDay; wageUsdLotsPerWeek; bottleneck: weeklyBottleneck(state, config, candidateId); recentHandlingOfferedPt; recentHandlingAcceptedPt }`.
- 명세의 `recentDeclinedForStaffPt`·`effectiveHomePtAfter`는 만들지 않는다(엔진은 플레이어가 받지 않은 이유를 알 수 없다).

### 6. `upcomingPayments` (명세 14.8)

- `UpcomingPaymentKind`에 `'RENT' | 'SPACE_FEE'`를 **값만** 더한다. 규칙 1 결과는 그대로다.
- 정렬 번호: OVERDUE 0, RENT 1, SPACE_FEE 2, WAGE 3, FREIGHT 4, DUTY 5. 기존 네 종류의 상대 순서는 그대로다.
- 임차료 행은 창 안의 임차일(확장 효력 반영 금액), 선복 요금 행은 창 안의 적용 편 출항일(아직 내지 않은 것)에 넣는다. 선복 요금 행은 `cashReservations` 고리 밖에서 만든다.
- 화면(`src/ui/main.ts`, `src/ui/schedule.ts`)이 이 종류를 관세로 적는 문제는 고치지 않는다. 화면 타입 검사가 깨지면(예: 망라 `switch`) 고치지 말고 ‘질문’에 적는다.

### 7. 인수 명세

- `tests/acceptance_cases.json`에 `P0-M2A5-18 본사·창고 표와 병목 표`, `P0-M2A5-19 견적·환전 미리 보기`를 더한다(형식은 01~16과 같다). 행동·기대 수치 전체를 이 항목에 두고 시험은 여기서 읽는다.
  - 18: 지시 4 반례의 네 값과 그 상태를 만드는 명령(1일 `SIGN_SPACE_CONTRACT` 두 노선, 1일 `EXPAND_WAREHOUSE`, 2일 마감 뒤 3일에 확인. 다음 출항편 9일은 계약 적용 편이다)과 각 `rows` 전체.
  - 19: 명세 18-02의 8일 쌍 수량 200 미리 보기 전체, 15일 묶음의 보관 초과 미리 보기(`allowed: false`와 문장), 1일 `exchangePreview` 두 방향(S15 반례 포함).
- `review_summary`: `case_count` 36, `P0` 31, `engine_linked_case_count` 31, `added_cases_note` 끝에 `"; TASK-0028 added P0-M2A5-18..19, total 36."`. 17번은 TASK-0029가 더한다(번호를 비워 둔다).
- `PACKAGE_STATUS.json` `core_acceptance_specifications` 36(허브 허락 필요, 이 칸만).

### 8. 작은 문장 고침

- 규칙 2 미지급 기록 문장의 캠페인 종료 분기가 괄호 안에 마침표를 남긴다(‘(… 끝납니다.)’, `engine.ts:1179` 근처). 괄호 안 문장은 마침표 없이 쓴다: ‘(90일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝남)’. 시험 S22의 기대 문장을 함께 고친다.

## 고칠 수 있는 파일

- `src/engine/reports.ts`, `src/engine/operations.ts`, `src/engine/previews.ts`, `src/engine/market.ts`, `src/engine/engine.ts`(지시 8의 한 줄만), 새 `src/engine/readers.ts`(원하면), 새 시험 `src/engine/m2a5-readers.test.ts`, `src/engine/m2a5-money.test.ts`(S22 기대 문장만), `src/engine/m2a5-testkit.ts`.
- `tests/acceptance_cases.json`, `PACKAGE_STATUS.json`(한 칸), `docs/ai/tasks/results/TASK-0028.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/ui/**`, `src/engine/sim/**`, `src/content/**`, `data/**`, `schemas/**`, `tools/**`, 위 목록 밖 `docs/**`, 기존 시험 파일(위 하나 밖).

## 지켜야 할 것

- **캐릭터 자료 칸 규칙(TASK-0055, SESSION_TREE):** 캐릭터 자료의 새 칸을 읽는 코드는 같은 커밋에서 `src/content/character-fields.ts`의 `CHARACTER_FIELDS`에 그 칸을 더한다. 이 작업은 직원 처리량·일급을 `ScenarioConfig.employees`에서만 읽으므로 새 칸을 읽지 않을 것이다. 읽게 되면 이 규칙을 따르고 결과 보고에 적는다(`src/content/character-fields.ts`는 그 경우에만 고칠 수 있다).
- TASK-0027의 ‘지켜야 할 것’이 모두 적용된다(규칙 1 불변, 화면 0줄, 설정에 ID 키 금지, 결정적, 통화 분리, 새 문장마다 반례, 전체 객체 `toEqual`, 새 시험에 자료 ID 금지, JSON 형식).
- 읽기 함수는 상태를 바꾸지 않는다. 시험마다 호출 전후 `structuredClone` 비교를 넣는다.
- 미리 보기·병목 표의 거절 문장과 수치는 명령 경로와 같은 함수에서 나온다(DECISIONS:223).

## 테스트

새 파일 `src/engine/m2a5-readers.test.ts`. `describe` 제목은 그대로 쓴다.
- `P0-M2A5-18 본사·창고 표와 병목 표`, `P0-M2A5-19 견적·환전 미리 보기`.
- `M2a-5 읽기 함수 성질`: 상태 불변, 규칙 1에서 `upcomingPayments` 결과가 작업 전과 같음(TASK-0027 R1 골든 스크립트를 이 작업의 기준으로 다시 돌린다, 완료 조건), 미리 보기 거절 문장 = 명령 거절 문장(보관·수량·자금·환전 각 1).
- `M2a-5 병목 표 경계`: 수요 null(묶음 없음), 직원 0명 본사, 상한 0인 노선, 동률 제약 `binding` 전체.

## 완료 조건

1. 지시 1~8 반영.
2. `npx vitest run` 실패 0, `npm run typecheck` 통과, `python3 tools/validate_data.py` 통과, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0(크기 검사는 TASK-0055가 들어간 기준이므로 통과해야 한다. 넘으면 수치를 ‘질문’에 적고 계속한다).
3. 규칙 1 골든: TASK-0027 R1 보고의 `/tmp/TASK-0027-R1-golden.mjs`를 같은 방식으로 다시 써서 `<BASE>` 사본과 이 작업 결과를 비교해 ‘같음’. 지울 키는 없다(이 작업은 규칙 1 보고 칸을 더하지 않는다). `upcomingPayments` 결과도 같다.
4. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 병목 표 `sailing`이 무게 한도를 무시 | `P0-M2A5-18 …` |
| 2 | 병목 표 `storage`의 체류 일수를 7로 | `P0-M2A5-18 …` |
| 3 | `after`에 후보 처리량을 더하지 않음 | `P0-M2A5-18 …` |
| 4 | `affectedContracts`가 늦어지지 않는 계약도 담음 | `P0-M2A5-19 …` |
| 5 | `exchangePreview`가 명령과 다른 거절 문장 | `M2a-5 읽기 함수 성질` |
| 6 | `upcomingPayments` 정렬에서 RENT를 WAGE 뒤로 | `P0-M2A5-18 …` 또는 새 일정 시험 |
| 7 | 읽기 함수가 상태를 바꿈(`allocateHandling` 결과를 상태에 씀) | `M2a-5 읽기 함수 성질` |

5. 결과 보고 `docs/ai/tasks/results/TASK-0028.md`(공통 머리말 형식): 바꾼 파일, 설계 판단, 검증(시작·끝 값), 골든 비교, 변형 표, 범위 밖 발견(화면이 새 지급 종류를 관세로 적는 곳 포함), 질문.
