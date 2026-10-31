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
- 화면(읽기만): `src/ui/reports.ts:7·67`(지급 종류 이름 표), `src/ui/schedule.ts:85`, `src/ui/main.ts:743`.

## 구현 지시

### 1. `quotePreview(state, config, offerIds, quantity?)` (명세 14.3)

- 새 함수다. 기존 `tradePreview`·`forwardingPreview`는 바꾸지 않는다.
- 반환: 기존 `QuotePreview` 칸 전부 + `quantity`, `maxQuantity`, `quantityStep`, `prepWorkUnits`, `volumeLiters`, `massGrams`, `storageAfterLiters`, `storageCapacityLiters`, `counterpartySpreadPct`, `serviceClass`, `titleKo`, `contributionPerPrepPtMinor`(기여이익 ÷ 준비 pt, 내림), `lateDeliveryReductionMinor`(다음 출항편으로 보낼 때의 감액, `lateDeliveryReduction` 사용, 정시면 0), `affectedContracts: { contractId; readyBefore; readyAfter; missesSailing }[]`.
- `affectedContracts`: 계획 상태 = 상태 사본에 이 견적의 수락 명령을 넣는다. 그 명령은 `projectPrepCompletion`의 배정 규칙과 같은 직원(쉬는 본사 직원 가운데 `config.employees` 순서 첫 사람, 없으면 직원 없이)과, 정시 인도가 되는 첫 출항편 예약(없으면 예약 없이)을 `plan`으로 단다. 그 계획 상태와 지금 상태에서 `projectPrepCompletion({ assignQueued: true })`를 돌려, 준비 완료일이 늦어지는 기존 계약만 담는다. `missesSailing`은 예약한 출항일 < `readyAfter`이거나 `readyAfter`가 null일 때 true다.
- 반환에는 언제나 `allowed: boolean`과 `reasonKo: string | null`을 넣는다(허용이면 true·null). 거절 판정과 문장은 명령 경로와 같아야 한다. 수량 검사·`fundsShortfall`은 `engine.ts`의 내보내지 않은 함수라 직접 부를 수 없으므로, `previews.ts:5`처럼 상태 사본에 `planState(state, config, [해당 수락 명령])`을 돌려 `results[0]`의 상태와 `reasonKo`를 쓴다(검사 순서도 명령 경로와 같아진다). 거절이면 수치 칸은 계산할 수 있는 만큼 채우고 `affectedContracts`는 빈 배열이다.
- `counterpartySpreadPct`: `{ buy: number | null; sell: number | null }`로 매입·판매 견적의 거래처 차이(%)를 따로 둔다(주선은 둘 다 null). 기존 `sale`은 이미 감액을 뺀 값이므로(`reports.ts:103`) `lateDeliveryReductionMinor`를 기여이익에서 다시 빼지 않는다.

### 2. `exchangePreview(state, config, direction, usdAmountMinor)` (명세 14.4)

- 반환 `{ allowed; reasonKo; krwMinor; spreadKrwMinor; usdAvailableBefore; usdAvailableAfter; krwAvailableBefore; krwAvailableAfter; runwayBefore; runwayAfter; warningKo }`.
- `allowed`·`reasonKo`는 `EXCHANGE_CURRENCY` 검사와 같은 함수·같은 문장이다.
- `runwayAfter`는 환전 뒤 원화로 `payrollRunwayDay`를 계산한다(통화를 합치지 않는다).
- `warningKo`(S15): KRW→USD 뒤 원화가 오늘 낼 임차료·급여보다 적으면 ‘환전 뒤 원화 {가용}으로는 오늘 급여·임차료 {금액}을 다 낼 수 없습니다.’, 아니면 null.

### 3. `warehouseSummary(state, config)` (명세 14.5)

- 명세 14.5의 칸 그대로: `storage`, `handling`(오늘 배분 미리 계산: `allocateHandling` 사용), `prepDaysToClear`(`projectPrepCompletion` 기준), `demand`(오늘 열린 견적 합, 최근 4묶음 이력), `staff`, `sailings[]`, `rent`, `expansion`, `spaceContracts[]`.
- `demand.recent[]`: 최근 4개 공개 묶음(묶음 0 제외, 지시 4와 같은 묶음). `acceptedPrepPt`·`handlingAccepted`는 그 묶음의 견적으로 체결한 계약(`operations.offers`의 `publishDay`로 묶음을 찾는다)의 준비 업무 `requiredWorkUnits`에서 센다.
- 여기에 `bottleneck: WeeklyBottleneck`(지시 4, 고용 후보 없이)을 더한다.

### 4. 주간 병목 표 `weeklyBottleneck(state, config, candidateId?)` (Q12 가)

학생이 “직원을 더 두면 일주일에 작업 포함 주선을 몇 건 더 처리할 수 있나”를 화면 한 표로 판단하게 하는 값이다. 주(7일) 단위의 정상 상태 용량 추정이다. 모의 실행이 아니다. 같은 입력이면 같은 출력이다.

- **단위:** ‘작업 포함 주선 건수/주’. 기준 화물은 자료의 HANDLING 틀이다. 부피 `V`(L)는 틀 부피의 최댓값, 준비량 `P`(pt)는 틀 `prep_work_units`의 최댓값이다(자료에서 계산, 지금 값 9,000 L·12pt).
- **수요 `demand`:** 최근 4개 공개 묶음(공개일이 오늘 이하, 묶음 0 제외)의 HANDLING 견적 수. `{ handlingOffered: 합, handlingPt: 합 × P, batches: 묶음 수 }`로 두고(나누지 않는다), 표의 DEMAND 값은 `floor(handlingOffered ÷ batches)`다. 묶음이 없으면 `demand`는 null이고 DEMAND 행 값도 null이다.
- **다른 일 몫 `otherPtPerWeek`:** 최근 4개 공개 묶음(지시 4의 수요와 같은 묶음, 묶음 0 제외)의 견적으로 체결한 STANDARD 주선과 직접 무역 계약의 준비 업무 `requiredWorkUnits` 합 ÷ 묶음 수(내림). 묶음이 없으면 0.
- **제약별 용량(고용 전 `before`, 후 `after`):**
  - `staff`: `floor(max(0, 본사 직원 처리량 합 × 7 − otherPtPerWeek) ÷ P)`. 본사 직원 = 고용 상태(`employmentStatus === 'employed'`)이고 위치가 본사 도시인 직원. 오늘 훈련·현지 활동 중이거나 `availableFromDay`가 오늘보다 뒤인 직원도 포함한다(주 단위 용량이다). `after`는 후보의 `workUnitsPerDay`를 더한다. 후보가 이미 고용됐거나 후보 목록에 없으면 `after`는 `before`와 같고 `extraJobsPerWeek` 0이다.
  - `warehouseHandling`: `floor(max(0, handlingCapacityPt(오늘 기준, 확장 반영) × 7 − otherPtPerWeek) ÷ P)`. 고용 전후 같다.
  - `storage`: `floor(storageCapacityLiters × 7 ÷ (D × V))`. `D` = 체류 일수 = 출항 간격 + 예약 마감 일수(자료에서 계산, 지금 7 + 1 = 8). 고용 전후 같다.
  - `sailing`: 노선마다 `min(floor(부피 한도 ÷ V), floor(무게 한도 ÷ 그 노선 목적지 HANDLING 틀 무게의 최댓값))`의 합. 그 노선의 다음 출항편(출항일이 오늘보다 뒤인 첫 편) 기준이며 선복 계약 한도를 반영한다. 고용 전후 같다. 한도는 `sailingLoad(...)`의 `capacityLiters`·`capacityGrams`(`reservations.ts:94` 근처)이고, 이미 예약된 양은 빼지 않는다(정상 상태 용량이다).
- **결과:** `{ unit: 'HANDLING_JOBS_PER_WEEK'; demand; otherPtPerWeek; rows: { constraint: 'DEMAND' | 'STAFF' | 'WAREHOUSE_HANDLING' | 'STORAGE' | 'SAILING'; before: number | null; after: number | null }[]; binding: { before: 제약[]; after: 제약[] }; usableBefore; usableAfter; extraJobsPerWeek; remainingHandlingBatches; contributionPerJobMinor; wageKrwPerWeek | null; wageUsdLotsPerWeek | null }`.
  - `usable` = 각 열의 최솟값(수요 포함, 수요가 null이면 수요 빼고). `binding`은 최솟값과 같은 제약 전부(동률 포함).
  - `extraJobsPerWeek = usableAfter − usableBefore`(후보가 없으면 0).
  - `remainingHandlingBatches`: 공개일이 오늘보다 뒤인 묶음 가운데, HANDLING 틀의 납기·결제 오프셋(`공개일 + 오프셋 ≤ campaignDays`)으로 HANDLING 견적이 나올 수 있는 묶음 수. 묶음은 아직 생성 전이므로 틀 오프셋으로 계산한다. 지금 자료로 1일에 10.
  - `contributionPerJobMinor`: HANDLING 틀 기여이익(서비스 대금 − 운임)의 최솟값(USD).
  - 임금은 원화 그대로(`wageKrwPerWeek` = 일급 × 7), 환전 필요량은 `wageUsdLotsPerWeek = ceil(일급 × 7 ÷ (fx.lotUsdMinor × fx.buyKrwPerUsd ÷ 100))`(100 USD 묶음이 주는 원화, `operations.ts:217`의 `lotKrw`와 같은 값을 재사용). 지금 자료로 2pt 후보 5, 3pt 후보 6. 통화를 더하지 않는다. 후보가 없으면 둘 다 null.
- **반례:** 투자 없는 회사(1일, 기본 직원 2명)에 2pt 후보 → `STAFF` before 2 → after 3, `SAILING` 2라 `extraJobsPerWeek` 0이다. 선복 계약 두 노선과 창고 확장이 적용된 상태 → 2pt 후보 +1, 3pt 후보 +2. (두 상태 모두 공개 묶음이 묶음 0뿐이라 `DEMAND` before/after는 null이고 `usable`에서 빠진다. 1일 `binding.before`는 STAFF·SAILING) 이 네 값을 인수 명세 새 사례(아래 지시 7)로 고정하고 시험한다. 계산이 이 값과 다르면 값을 고치지 말고 ‘질문’에 적는다.

### 5. `hiringOutlook(state, config, candidateId)` (명세 14.6 대체)

- `{ workUnitsPerDay; wageKrwPerDay; wageUsdLotsPerWeek; bottleneck: weeklyBottleneck(state, config, candidateId); recentHandlingOfferedPt; recentHandlingAcceptedPt }`.
- 명세의 `recentDeclinedForStaffPt`·`effectiveHomePtAfter`는 만들지 않는다(엔진은 플레이어가 받지 않은 이유를 알 수 없다).

### 6. `upcomingPayments` (명세 14.8)

- `UpcomingPaymentKind`에 `'RENT' | 'SPACE_FEE'`를 **값만** 더한다. 규칙 1 결과는 그대로다.
- 정렬 번호: OVERDUE 0, RENT 1, SPACE_FEE 2, WAGE 3, FREIGHT 4, DUTY 5. 기존 네 종류의 상대 순서는 그대로다.
- 임차료 행: 창 안의 임차일마다 `{ kind: 'RENT', currency: 'KRW', amountMinor: 그날 임차료(확장 효력 반영), day, trigger: 'AUTO', contractId: null, employeeIds: [], sourceId: 임차료 분개 ID(`RENT-Dddd`), labelKo: fixedCostsDue의 reasonKo 그대로 }`. 선복 요금 행: 창 안의 적용 편 출항일(아직 내지 않은 것)마다 같은 꼴, `kind: 'SPACE_FEE'`, `currency: 'USD'`, `sourceId`는 `SPACE-…` 분개 ID. 선복 요금 행은 `cashReservations` 고리 밖에서 만든다. 새 `labelKo` 문장은 `fixedCostsDue`와 같은 함수에서 나오므로 따로 반례를 만들지 않되, 규칙 1에 이 행이 없음을 시험한다.
- 화면은 고치지 않는다. 확인된 사실(검토): 타입 검사는 깨지지 않는다. `src/ui/reports.ts:7·67`의 종류 이름 표에 새 종류가 없어 그 표에서 조용히 빠지고, `src/ui/schedule.ts:85`가 FREIGHT 아닌 행을 관세로 적는다(`main.ts:743`은 FREIGHT·DUTY만 걸러 문제없다). 이 둘을 ‘범위 밖 발견’에 적는다. 엔진 쪽 정렬 객체(`reports.ts:285`)는 새 종류를 넣어 고친다.

### 7. 인수 명세

- `tests/acceptance_cases.json`에 `P0-M2A5-18 본사·창고 표와 병목 표`, `P0-M2A5-19 견적·환전 미리 보기`를 더한다(형식은 01~16과 같다). 행동·기대 수치 전체를 이 항목에 두고 시험은 여기서 읽는다.
  - 18: 지시 4 반례의 네 값과 그 상태를 만드는 명령(1일 `SIGN_SPACE_CONTRACT` 두 노선, 1일 `EXPAND_WAREHOUSE`, 2일 마감 뒤 3일에 확인. 다음 출항편 9일은 계약 적용 편이다)과 각 `rows` 전체.
  - 19: 명세 18-02의 8일 쌍 수량 200 미리 보기 전체, 15일 묶음의 보관 초과 미리 보기(`allowed: false`와 문장), 1일 `exchangePreview` 두 방향(S15 반례 포함).
- `review_summary`: `case_count` 36, `phase_case_counts.P0` 31, `engine_linked_case_count` 31. `added_cases_note`의 기존 끝 ‘(17 follows in TASK-0028)’를 ‘(17 follows in TASK-0029)’로 고치고, 끝에 `"; TASK-0028 added P0-M2A5-18..19, total 36."`을 더한다. 17번은 TASK-0029가 더한다(번호를 비워 둔다).
- `PACKAGE_STATUS.json` `core_acceptance_specifications` 36(허브 허락 필요, 이 칸만).

### 8. 작은 문장 고침

- 규칙 2 미지급 기록 문장의 캠페인 종료 분기가 괄호 안에 마침표를 남긴다(‘(… 끝납니다.)’, `engine.ts:1179` 근처). 괄호 안 문장은 마침표 없이 쓴다: ‘(90일 캠페인이 끝날 때까지 갚지 못하면 미지급을 남기고 끝남)’. 시험 S22의 기대 문장을 함께 고친다.
- 시험 S22의 기대 문장을 고칠 때 반례 `m2a5-money.test.ts:414`의 `not.toContain('미지급을 남기고 끝납니다')`도 ‘끝남’으로 함께 바꿔 반례가 무의미해지지 않게 한다. `operations.ts:249`의 경고·위험 로그 문장은 괄호 밖이라 그대로 둔다.

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
