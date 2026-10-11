# TASK-0016 결산·보고 읽기 함수와 시간 인수 명세 (엔진, 화면 없음)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 평택 본사 전환(TASK-0015, 개발 브랜치 `548c53c`) 반영. 개발 브랜치 `c6f0d2d` 위에 만든 `codex/TASK-0016`에서 작업한다.
  - `src/engine/`·`src/content/`·`tests/acceptance_cases.json`은 평택 구현 스냅숏 `4de152a`와 `c6f0d2d`가 같다(diff 0). 아래 줄 번호는 `4de152a` 기준이지만 그대로 맞다. 모든 diff·검사 명령의 기준 커밋은 `c6f0d2d`다(`tools/ai/review_checks.sh c6f0d2d`).
  - 작업 브랜치는 이 지시서를 올린 커밋에서 시작한다. 그 커밋이 더한 `docs/ai/tasks/TASK-0016-campaign-read-functions.md`·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 `git diff c6f0d2d` 결과에 나와도 이 작업의 변경으로 치지 않는다.
- 결정 근거:
  - `docs/DESIGN_v0.4.md`
    - 61행: 90일 결산.
    - 111행: 경영 보고 항목(현금·이익·재고·외상 대금·미지급금·정시 인도율).
    - 476행: 기록 지표(기말 순자산·정시 인도율·직원 대기 작업).
    - 497행: 납기 경계. 마감일 도착은 정시다.
    - 694행: 주요 고객이 없어도 90일에 정상 결산한다.
  - `docs/UI_SPEC.md` 11행(위쪽 막대의 임박 지급), 28행(경영 보고의 납기·업무 부하).
  - `docs/CLASSIC_GAME_INSIGHTS.md` 38~40행(CL-01~03).
  - `docs/IMPLEMENTATION_PLAN.md` 81행: 인수 명세를 실행 검증에 연결한다.
  - `docs/STATUS.md` 79행: P0-TIME-01의 고정 수치는 아직 실행하지 않았다.
  - `docs/DECISIONS.md`
    - 57행: 지급 불이행 유예기간이 정해지지 않았다. 그래서 경영 실패 판정은 없다.
    - 152행: 자금 예약은 확정된 지출만 묶는다.
  - 2026-10-09 남은 일 점검 계획의 1차 세션 S2(B17·B18, B36의 9a, B37의 엔진 부분). Claude의 작업 계획이며 저장소에 없다. 찾지 않아도 된다.
    - 화면은 이 작업이 병합된 뒤 Sol이 따로 한다.

## 목표

화면 작업이 쓸 **읽기 함수**를 엔진에 먼저 만든다. 인수 명세 P0-TIME-01과 P0-ACC-01을 엔진 실행 경로에 연결한다.

- 새 함수는 상태를 읽기만 한다. 상태·장부·저장 형식·경제 규칙은 바꾸지 않는다.
- 돈은 통화별로만 다룬다. USD와 KRW를 합하거나 환산하지 않는다.
- 기존 시험의 기대값과 기존 시험 파일은 바꾸지 않는다. 예외는 `acceptance-p0-acc.test.ts`이며, 이 파일에는 더하기만 한다.

## 먼저 읽을 파일

- 엔진 (줄 번호는 `4de152a` 기준이다):
  - `src/engine/reports.ts`: `contractReport` 17행, `companyReport` 43행, `tradePreview` 130행, `tradePairs` 162행.
  - `src/engine/ledger.ts`: `BookSummary` 125행, `summarize` 149행.
  - `src/engine/reservations.ts`: `cashReservations` 21행, `fundsPosition` 54행, `spaceShortfall` 110행, `runningTaskOf` 135행.
  - `src/engine/previews.ts`: `payrollRunwayDay` 40행.
  - `src/engine/progress.ts`: `contractProgress` 44행. 출항 전 ‘실을 수 있는 첫 출항편’ 찾기는 112~127행에 있다.
  - `src/engine/culture.ts`: `counterpartyRecord` 79행. 정시·지연 판정이 이미 여기 있다.
  - `src/engine/employees.ts`: `isAvailableFromToday` 8행. `src/engine/tasks.ts`: `isDayBasedTask` 20행.
  - `src/engine/catalog.ts`: `routeOf` 18행, `routeBetween` 25행, `listSailings` 36행.
  - `src/engine/engine.ts`
    - `openDay` 127행. 사건 1회 적용 검사는 133·151행이다.
    - `planCommands` 162행, `planState` 170행. 같은 날 명령을 사본에 반영한다(시험 도우미와 합성 상태에 쓴다).
    - `employeeUnavailable` 472행. 다른 도시 직원·근무 전 직원·업무 중 직원은 배정을 거절한다.
    - `commitDay` 796행. 마감 재전송 검사는 802행, `closedDays`는 834행, `ENDED` 전환은 836행이다.
    - `progressTasks` 840행. 처리량은 LEGACY_FIXED `workUnitsPerDay`다.
    - `processDeliveries` 993행. 지연 일수 계산은 999행이다.
    - `payOrAccrue` 1099행, `processPayroll` 1159행.
  - `src/engine/invariants.ts` 82~92행: 매출채권 = 미수 청구서(`status !== 'PAID'`) 합계, 미지급금 = 미지급 의무(`paidDay === null`) 합계.
  - `src/engine/rng.ts` `drawUniform` 33행.
  - `src/engine/save.ts`: `serializeSave` 33행, `deserializeSave` 89행. 합성 설정은 `config` 선택 인수로 넘긴다.
  - `src/engine/testkit.ts`: `runDays` 9행.
- 시험 (방식 참고):
  - `src/engine/acceptance-p0-acc.test.ts` 전체. 인수 명세 JSON을 `import acceptance from '../../tests/acceptance_cases.json'`로 읽는 방식을 새 시험에서도 쓴다.
  - `src/engine/save-integrity.test.ts` 172행: 매일 저장 왕복 비교.
  - `src/engine/m2a-culture.test.ts` 312행: 계약을 복사해 합성 상태를 만든다.
  - `src/engine/previews.test.ts` 214~271행: 급여 지급 가능일, 미래 근무자, 미지급 의무 합성.
- 인수 명세: `tests/acceptance_cases.json`의 P0-ACC-01(30행)과 P0-TIME-01(391행).
- 위 ‘결정 근거’의 문서 줄.

## 범위

**포함**
1. 정시 인도율 `onTimeDeliveryRate` (B37, DESIGN 111·476·497행).
2. 임박 지급 `upcomingPayments`: 급여·운임·관세·미지급, 통화별 (B37, UI_SPEC 11행).
3. 결산 `campaignSummary`: 통화별 순자산·미수·미지급·정시 인도율 (B36의 9a).
4. 새 `src/engine/capacity.ts`의 `workloadSummary`: 업무량과 가용 처리량 (B37, CL-03).
5. 시험 도우미 2개를 `testkit.ts`에 더한다.
6. P0-TIME-01을 실행 시험으로 연결한다 (B17). 분기 동일성, 마감 재전송 무시, 사건 1회 적용, 난수 커서 보존을 본다.
7. P0-ACC-01을 엔진 명령 경로로 다시 확인한다 (B18).
8. M2를 90일까지 마감해 `ENDED`에 이르는 결산 시험.

**제외**
- P0-TIME-01의 검사비 3 단언. 비용 사건이 생기는 M3에서 한다. 이번에는 `it.todo`로만 남긴다.
- `tests/acceptance_cases.json`의 `engine_test_ref` 갱신. W2-0a에서 Claude·Astra가 한다.
- 화면(`src/ui/**`), 저장 판본, 자료(`data/**`).
- 경영 실패 판정, 통화 환산·합산, 송금. 사용자 결정 대기다(B34·B35).
- 막힌 이유를 돈·시간·사람·선복으로 묶는 분류. 화면 작업(W2-0d)이 `contractProgress`의 코드로 한다.
- `src/engine/sim/`. TASK-0017(S3)이 동시에 만든다.

**시간이 모자라면 뺄 수 있음** (1번부터 뺀다)
1. 결산 시험 7(`ENDED` 상태 저장·복원 뒤 결산이 같은지).
2. `upcomingPayments`의 `payrollRunwayDay` 대조 시험.
3. `workloadSummary`의 다른 도시 합성 시험.
- 뺀 항목은 결과 보고 ‘완료 조건 대조’에 ‘미충족(시간)’으로 적는다.
- 그 밖의 것은 빼지 않는다: 구현 지시 1~7, 아래 나머지 시험, 변형 시험.

## 고칠 수 있는 파일

- `src/engine/reports.ts`: **더하기만** 한다. 기존 export의 이름·인수·필드·동작을 바꾸지 않는다. import 줄은 고쳐도 된다.
- `src/engine/testkit.ts`: 도우미 **더하기만** 한다. `runDays`·`standardDayOneCommands`는 그대로 둔다.
- `src/engine/acceptance-p0-acc.test.ts`: 새 `it`를 **더하기만** 한다. 기존 두 `describe`의 단언은 그대로 둔다.
- 새 파일:
  - `src/engine/capacity.ts`
  - `src/engine/campaign-end.test.ts`
  - `src/engine/reports-read.test.ts` (`capacity.ts` 시험도 여기에 둔다)
  - `src/engine/acceptance-p0-time.test.ts`
- `docs/ai/tasks/results/TASK-0016.md` (결과 보고)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/engine/engine.ts`, `types.ts`, `ledger.ts`, `save.ts`, `save-shape.ts`, `previews.ts`, `progress.ts`, `reservations.ts`, `culture.ts`, `catalog.ts`, `employees.ts`, `tasks.ts`, `invariants.ts`. 읽고 import만 한다.
  - 기존 시험 파일 전부(`acceptance-p0-acc.test.ts` 제외).
  - `src/ui/**`, `src/content/**`, `package.json`, `package-lock.json`. 새 npm 의존성을 넣지 않는다.
  - 다른 1차 세션이 동시에 고치는 파일: `src/engine/sim/**`·`package.json`(TASK-0017), `src/ui/**`·`vite.config.ts`(TASK-0018), `tools/**`·`.gitignore`(TASK-0019). 읽기만 한다.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `data/**`, `tests/acceptance_cases.json`
  - `tools/validate_data.py`, `tools/test_validate_data.py`
  - `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`
- 변형 시험(완료 조건 4) 때만 `engine.ts`를 잠시 바꿀 수 있다. 확인한 뒤 되돌린다.

## 지켜야 할 것

- 새 시험에 도시 이름·도시 ID·견적 ID·노선 ID·사건 ID·직원 ID를 직접 쓰지 않는다.
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `HAIPHONG`, `SHANGHAI`, `OFFER_*`, `ROUTE01`, `EVI_*`, `EMP01`, ‘평택’, ‘부산’, ‘하이퐁’.
  - 값은 `config`와 상태에서 찾는다. 예: `config.offers`, `tradePairs`, `routeBetween`, `listSailings`, `config.employees`.
  - 이 지시서가 정한 합성 ID는 쓴다: 사건 `EVENT_A`, 직원 `ACC-WAGE`, 명령 ID.
  - 시나리오 ID 상수(`SCENARIO_M1_ONE_TRADE`, `SCENARIO_M2_MULTI_TRADE`)는 써도 된다.
- 금액은 고정값으로 단언하지 않는다. 장부 합계·불변 조건·설정값에서 계산한 값과 비교한다.
  - 예외는 인수 명세의 숫자다. 명세 숫자는 `tests/acceptance_cases.json`에서 읽는다.
- 새 함수는 순수 함수다.
  - 입력 상태·설정을 바꾸지 않는다. 반환값은 새 객체다. 상태 안의 배열·객체를 그대로 넘기지 않는다.
  - `Math.random`, `Date`, 네트워크를 쓰지 않는다.
  - `reports.ts`와 `capacity.ts`는 `engine.ts`를 import하지 않는다. 지금 `reports.ts`도 import하지 않는다. 엔진 실행 없이 상태만 읽는다.
- 비율은 basis point 정수(0~10000)로 낸다. 소수 비율을 만들지 않는다.
- 플레이어가 읽을 수 있는 `labelKo` 문장에 실제 회사 이름을 넣지 않는다. 도시 이름도 직접 쓰지 않는다. 도시가 필요하면 `cityName(config, id)`로 만든다.
- 네트워크 조사는 하지 않는다. `chainportal.co.kr`에는 접속하지 않는다. robots.txt를 지킨다.
- 커밋·푸시·브랜치 전환을 하지 않는다.

## 구현 지시

### 1. 정시 인도율 (`reports.ts`)

```ts
export interface DeliveryFilter {
  currency?: Currency;
  kind?: ContractKind;
  /** 고객 또는 공급자. counterpartyRecord와 같은 기준(customerId 또는 supplierId 일치). */
  partyId?: string;
}

export interface OnTimeDelivery {
  /** 인도한 계약 수(취소 제외). 분모. */
  delivered: number;
  /** 인도일 ≤ 납기일. 납기 당일 인도는 정시다(DESIGN 497행). */
  onTime: number;
  late: number;
  /** onTime × 10000 ÷ delivered를 내림한 정수. 인도한 계약이 없으면 null. */
  rateBasisPoints: number | null;
  /** 아직 인도하지 않았고 취소되지 않았는데 납기일이 오늘(s.day)보다 앞선 계약 수. 분모에는 넣지 않는다. */
  pastDeadlineUndelivered: number;
}

export function onTimeDeliveryRate(s: GameState, filter: DeliveryFilter = {}): OnTimeDelivery;
```

- 정시 기준은 `deliveredDay <= deliveryDeadlineDay`다. 엔진의 지연 계산(`engine.ts` 999행)과 `counterpartyRecord`(`culture.ts` 79행)가 같은 기준을 쓴다.
- `culture.ts`는 고치지 않는다. 같은 기준을 이 함수에 새로 쓰고, 시험으로 두 결과가 같은지 확인한다.

### 2. 임박 지급 (`reports.ts`)

```ts
export type UpcomingPaymentKind = 'OVERDUE' | 'WAGE' | 'FREIGHT' | 'DUTY';

export interface UpcomingPayment {
  kind: UpcomingPaymentKind;
  currency: Currency;
  amountMinor: number;
  /** OVERDUE: 발생일. WAGE: 지급일. FREIGHT: 예약 마감일. DUTY: 도착 예정일. 정할 수 없으면 null. */
  day: number | null;
  /** AUTO: 그날 하루 진행 때 엔진이 낸다. ON_BOOKING: 플레이어가 운송편을 예약할 때 낸다. OVERDUE: 이미 못 낸 돈이며 현금이 들어오면 먼저 갚는다. */
  trigger: 'AUTO' | 'ON_BOOKING' | 'OVERDUE';
  contractId: string | null;
  /** WAGE만: 그날 급여를 받는 직원. 나머지는 빈 배열. */
  employeeIds: string[];
  /** OVERDUE: 의무 ID. WAGE: `WAGE-D010-KRW` 형식(날짜 세 자리·통화). FREIGHT·DUTY: 계약 ID. (kind, sourceId)는 행마다 다르다. */
  sourceId: string;
  labelKo: string;
}

export function upcomingPayments(
  s: GameState,
  config: ScenarioConfig,
  throughDay: number = Math.min(config.campaignDays, s.day + 6),
): UpcomingPayment[];
```

각 종류의 규칙:
- **공통:** `trigger`는 WAGE·DUTY가 `AUTO`, FREIGHT가 `ON_BOOKING`, OVERDUE가 `OVERDUE`다. `contractId`는 FREIGHT·DUTY만 계약 ID이고, OVERDUE·WAGE는 null이다.
- **OVERDUE**
  - `s.obligations` 가운데 `paidDay === null`인 것마다 한 행을 만든다.
  - `amountMinor`·`currency`는 의무의 값이다. `day`는 `incurredDay`다.
  - `labelKo`는 `미지급: ${reasonKo}`다.
  - `throughDay`와 관계없이 늘 넣는다.
- **WAGE**
  - `s.day`부터 `throughDay`까지 날마다, 통화마다 한 행으로 합친다.
  - 대상 직원은 `processPayroll`과 같다. `employmentStatus === 'employed'`이고, 그날 `availableFromDay <= d`이며, 정의의 `salaryPerDayMinor > 0`인 직원이다. 각 직원의 `salaryCurrency`로 묶는다.
  - 오늘 급여도 아직 나가지 않았으므로 넣는다. 급여는 하루 마감 때 나간다.
  - `labelKo`는 `${명수}명 급여`다.
- **FREIGHT**
  - `cashReservations`의 `FREIGHT` 예약마다 한 행을 만든다. 예약 계산을 다시 짜지 않는다.
  - `day`는 실을 수 있는 첫 출항편의 전날이다. `progress.ts` 112~127행과 같은 방법으로 찾는다. `listSailings(config, route.id, s.day + 1)`에서 `spaceShortfall`이 null인 첫 편을 고른다.
  - 실을 편이 없으면 `day`는 null이다.
  - `labelKo`는 `${contractId} 운임 (예약 때 선지급)`이다.
- **DUTY**
  - `cashReservations`의 `DUTY` 예약마다 한 행을 만든다.
  - `day`는 다음 순서로 정한다.
    - 출항한 화물(shipment가 있음): `Math.max(shipment.scheduledArrivalDay, s.day)`.
    - 예약했지만 아직 출항 전: `booking.departureDay + routeOf(config, booking.routeId).transitDays`.
    - 예약이 없음: null. `status === 'CANCELLED'`인 예약은 없는 것으로 본다.
  - `labelKo`는 `${contractId} 수입 관세 (도착 때)`다.
- **기간과 끝난 캠페인**
  - `day`가 있는 FREIGHT·DUTY 행은 `throughDay` 이하만 넣는다. `day`가 null인 행은 늘 넣는다.
  - `s.phase === 'ENDED'`이면 OVERDUE 행만 돌려준다.
- **정렬** (결정적으로):
  1. OVERDUE를 `incurredDay`, `sourceId` 순으로 맨 앞에 둔다.
  2. 날짜가 있는 행을 `day` 오름차순으로 둔다. 같은 날은 WAGE → FREIGHT → DUTY, 그다음 `currency`, `sourceId` 순이다.
  3. `day`가 null인 행을 맨 끝에 같은 순서로 둔다.
- 이 함수는 표시용이다. `fundsPosition`·자금 예약 규칙을 바꾸지 않는다(DECISIONS 152행). 급여를 예약에 넣지 않는다.

### 3. 결산 (`reports.ts`)

```ts
export interface CurrencyStanding {
  currency: Currency;
  cash: number;
  inventory: number;
  prepaidFreight: number;
  forwardingWip: number;
  accountsReceivable: number;
  accountsPayable: number;
  totalAssets: number;
  /** 순자산 = 자산 합계 − 미지급금. 시작 자본 + 누적 손익과 같아야 한다. */
  netAssets: number;
  openingEquity: number;
  profit: number;
  /** 이 통화 계약들의 contractReport(...).contribution 합계(취소 계약 포함). */
  contractContribution: number;
}

export interface CampaignSummary {
  /** s.phase === 'ENDED'. 결산은 진행 중에도 계산할 수 있다(중간 점검). */
  ended: boolean;
  campaignDays: number;
  /** 마지막으로 마감한 날. 없으면 0. */
  lastClosedDay: number;
  byCurrency: CurrencyStanding[];
  /** 모든 통화·종류의 계약. 건수만 세므로 통화를 섞지 않는다. */
  onTime: OnTimeDelivery;
  contracts: { total: number; completed: number; awaitingPayment: number; inProgress: number; cancelled: number };
  openInvoices: { invoiceId: string; contractId: string; currency: Currency; amountMinor: number; dueDay: number }[];
  unpaidObligations: { obligationId: string; currency: Currency; amountMinor: number; incurredDay: number; reasonKo: string }[];
}

export function campaignSummary(s: GameState, config: ScenarioConfig): CampaignSummary;
```

- **통화 목록과 순서:** `config.tradeCurrency`, `config.payrollCurrency`, 그다음 장부에 나오는 다른 통화를 알파벳 순으로 둔다. 같은 통화는 한 번만 넣는다.
- **각 값의 근거:**
  - 금액은 `summarize(s.ledger, currency)`에서 가져온다.
  - `netAssets`는 `totalAssets − accountsPayable`이다.
- **계약 건수:**
  - `completed`: `status === 'COMPLETED'`.
  - `cancelled`: `status === 'CANCELLED'`.
  - `awaitingPayment`: 진행 중(`ACTIVE`·`IN_PROGRESS`)이고 `deliveredDay !== null`.
  - `inProgress`: 진행 중이고 `deliveredDay === null`.
  - 네 값의 합은 `total`과 같다.
- **미수·미지급의 기준 시점:** 호출한 순간의 상태(마지막 마감 직후)다.
  - 예측하지 않는다.
  - 수금일이 캠페인 뒤인 청구서도 미수에 넣는다.
- **목록의 기준과 순서:** 불변 조건(`invariants.ts` 82~92행)과 같은 기준을 쓴다.
  - `openInvoices`: `status !== 'PAID'`인 청구서. `dueDay`, `invoiceId` 순.
  - `unpaidObligations`: `paidDay === null`인 의무. `incurredDay`, `obligationId` 순.
- **넣지 않는 것:** 통화 합산·환산 값, 경영 실패 판정, 점수·등급.

### 4. 업무량과 가용 처리량 (새 `src/engine/capacity.ts`)

```ts
export type TaskUnit = 'WORK_UNITS' | 'DAYS';

export interface EmployeeCapacity {
  employeeId: string;
  cityId: string;            // 상태의 locationCityId
  workUnitsPerDay: number;   // 정의의 값(LEGACY_FIXED)
  /** 진행 중 업무. 없으면 null이며, 지금 새 업무를 맡을 수 있다. */
  running: { taskId: string; kind: Task['kind']; unit: TaskUnit; remaining: number } | null;
}

export interface CityWorkload {
  cityId: string;
  /** 담당 없이 QUEUED인 업무 포인트 업무의 남은 양. */
  unassignedWorkUnits: number;
  unassignedTaskIds: string[];
  /** 배정되어 RUNNING인 업무 포인트 업무의 남은 양. */
  runningWorkUnits: number;
  /** 오늘 근무하는 고용 직원의 하루 처리량 합계. */
  staffWorkUnitsPerDay: number;
  /** 그 가운데 일수 업무(훈련·현지 활동) 중이라 업무 포인트를 처리하지 못하는 처리량. */
  dayTaskWorkUnitsPerDay: number;
  /** 진행 중 업무가 없는 직원의 처리량. 미배정 업무를 지금 맡길 수 있는 몫. */
  idleWorkUnitsPerDay: number;
  /** ceil((unassigned + running) ÷ (staff − dayTask)). 업무가 없으면 0. 업무가 있는데 처리량이 0이면 null. */
  daysToClear: number | null;
}

export interface WorkloadSummary {
  day: number;
  /** 직원이나 업무가 있는 도시만 넣는다. cityId 오름차순. */
  byCity: CityWorkload[];
  /** 오늘 근무하는 고용 직원. config.employees 순서. */
  employees: EmployeeCapacity[];
  /** 고용은 확정했지만 근무 시작일이 오지 않은 직원. */
  startingLater: { employeeId: string; availableFromDay: number; workUnitsPerDay: number }[];
}

export function workloadSummary(s: GameState, config: ScenarioConfig): WorkloadSummary;
```

- **업무 포인트 업무와 일수 업무를 나눈다.** 기준은 `isDayBasedTask`다.
  - 업무 포인트: `EXPORT_PREP`, `FORWARDING_PREP`, `SCOUT`, `RECRUIT_QUEST`.
  - 일수: `TRAINING`, `CULTURE`. 일수 업무의 남은 양은 업무량에 더하지 않는다. 그 직원의 처리량을 `dayTaskWorkUnitsPerDay`에 넣는다.
- **‘오늘 근무’의 기준:** `isAvailableFromToday`. 진행 중 업무는 `runningTaskOf`로 찾는다.
- **처리량:** 레벨·능력·시너지를 쓰지 않는다. `progressTasks`(`engine.ts` 840행)와 같은 LEGACY_FIXED 값이다.
- **도시 구분:** 업무는 `task.cityId`로, 직원은 `locationCityId`로 묶는다. 다른 도시의 직원은 그 도시 업무를 처리하지 못한다(`employeeUnavailable` 규칙).
- **`daysToClear`의 한계:** 한 사람은 한 번에 업무 하나만 맡으므로 실제 완료는 더 늦을 수 있다. 이 값은 비교용이다. 이 한계를 함수 주석에 적는다.
- **import 제한:** `capacity.ts`는 `engine.ts`를 import하지 않는다. 쓰는 것은 `employees`, `reservations`, `tasks`, `types`다.

### 5. 시험 도우미 (`testkit.ts`, 더하기만)

```ts
/**
 * 견적·도시 ID를 모르는 첫날 정책.
 * 직접 무역 쌍(tradePairs 순서) → 운송 주선 견적(config 순서)으로 시도한다.
 * 후보마다 출발 도시에 있고 아직 업무가 없는 근무 직원 한 명과 그 구간의 첫 출항편을 함께 확정한다(REF-02 plan).
 * planCommands로 앞 명령까지 반영해 APPLIED가 나오는 것만 고른다. 거절된 후보는 건너뛴다(다른 직원으로 다시 시도하지 않는다).
 * 입력 상태는 바꾸지 않는다.
 * 명령 ID는 `${idPrefix}-D${state.day}-${순번}`. 순번은 돌려주는 명령 안에서 1부터 센다.
 */
export function acceptAllFeasible(state: GameState, config: ScenarioConfig, idPrefix = 'AUTO'): Command[];

/** 현재 날짜부터 캠페인 마지막 날까지 마감한다. runDays(state, config, config.campaignDays, script)와 같다. */
export function runToCampaignEnd(state: GameState, config: ScenarioConfig, script: DayScript = {}): ReturnType<typeof runDays>;
```

- `acceptAllFeasible`은 `openDay`를 마친 `AWAITING_INPUT` 상태에서 부른다.
- 후보 하나를 고르는 방법:
  - 앞서 고른 명령까지 반영한 `planState(state, config, 고른 명령).state`를 본다.
  - 직원: 그 상태에서 `isAvailableFromToday`이고, `locationCityId`가 출발 도시이며, `runningTaskOf`가 없는 직원 가운데 `config.employees` 순서로 첫 사람.
  - 출항편: `routeBetween(config, 출발 도시, 도착 도시)` 노선의 `listSailings(config, route.id, state.day + 1)[0]`.
  - 직원·노선·출항편 가운데 하나라도 없으면 그 후보를 건너뛴다.
  - 명령을 만든 뒤 `planCommands(state, config, [...고른 명령, 새 명령])`의 마지막 결과가 `APPLIED`일 때만 넣는다.
- **Claude 확인값:** `4de152a` 사본에서 이 정책을 미리 돌렸다. M2 첫날에 직접 무역 1건과 운송 주선 1건이 APPLIED였고, 둘 다 납기 안에 인도됐다. 2번째 직접 무역 쌍은 자금 부족으로 빠졌다. M2 90일 진행은 약 0.1초 걸렸다.
  - 시험은 이 건수를 단언하지 않는다. 다만 ‘한 건 이상 인도’는 단언한다(campaign-end 시험 2).

### 6. P0-TIME-01 (`acceptance-p0-time.test.ts`)

`describe('P0-TIME-01 저장·불러오기 후 하루 마감과 사건 적용 재현', …)` 안에 둔다. 명세 값은 `tests/acceptance_cases.json`에서 읽는다. 읽는 값은 `initial_state`의 `simulation_day`·`company_cash`·`random_seed`·`random_cursor`와 `expected_numeric`이다.

**합성 설정** (메모리 안. 자료 파일은 고치지 않는다):
- `loadScenario('SCENARIO_M2_MULTI_TRADE')`를 펼쳐 복사한다. 다음 값만 바꾼다.
  - `seed`: `random_seed`(12345).
  - `payrollCurrency`: `'XXX'`. ISO ‘통화 없음’ 코드이며, `acceptance-p0-acc`와 같은 방식이다.
  - `startingCash`: `{ XXX: company_cash + wage × (simulation_day − 1) }`. `wage`는 `expected_numeric.wage_expense_each_branch`(4)다. 이렇게 하면 10일을 열 때 현금이 정확히 100이다.
  - `employees`: 원래 첫 직원 정의를 복사한 한 명. `salaryCurrency: 'XXX'`, `salaryPerDayMinor: wage`로 바꾼다.
  - `recruitment: null`, `culture: null`.
  - `portRestrictions`: 합성 사건 1개.
    - `eventInstanceId: 'EVENT_A'`, `templateId: 'TEST_EVENT'`.
    - `cityId`: 원래 설정 `routes[0].toCityId`.
    - `announceDay: simulation_day`, `startDay·endDay: simulation_day + 1`.
    - `forecastKo: '시험용 가상 공지'`.

**준비:**
1. `createGame(cfg)` 뒤에 `'events'` 흐름에서 `drawUniform`을 `random_cursor`(7)번 불러 커서를 만든다.
2. `runDays(…, simulation_day − 1)`로 9일까지 마감한다.
3. 결과는 10일 `PENDING_OPEN`, XXX 현금 100이다.
- 명령은 `[{ id: 'CMD-T01', type: 'CANCEL_CONTRACT', contractId: 'NO-SUCH-CONTRACT' }]` 하나다. 거절되지만 처리 기록에 남으므로 명령 ID 보존을 확인할 수 있다.

**저장 시점 두 가지:**
- 명세의 시작 상태(`AWAITING_INPUT`이면서 사건 적용 0건)는 이 엔진에서 동시에 성립하지 않는다. 엔진은 `openDay`에서 사건을 적용하기 때문이다(`engine.ts` 127~157행, DESIGN 324행).
- 그래서 두 저장 시점을 모두 시험한다.
  - (가) `openDay` 전(`PENDING_OPEN`)에 저장. 분기마다 사건이 0건에서 1건이 된다.
  - (나) `openDay` 뒤(`AWAITING_INPUT`)에 저장. 복원 뒤 `openDay`를 다시 불러도 같은 상태가 그대로 오고 공지는 0건이다.
- 이 대응 관계를 시험 주석과 결과 보고에 적는다.

**넣을 시험:**
1. 분기 A(연속 실행)와 분기 B(저장 → `deserializeSave(text, { dataVersion: cfg.dataVersion, config: cfg })` → 같은 명령)의 최종 상태가 `toEqual`로 같다. (가)와 (나) 모두 확인한다.
2. 분기마다 다음이 성립한다.
   - XXX 현금 = `company_cash − wage_expense_each_branch`.
   - 10일 급여 분개 합계 = `wage_expense_each_branch`.
   - `closedDays`에 10이 정확히 `daily_closure_count_each_branch`번 있다.
   - 적용 사건 수와 `EVENT_A` 공지 수가 `event_applied_count_each_branch`와 같다.
   - 명세의 `company_cash_each_branch`(93)에는 검사비 3이 들어 있다. 이 값은 단언하지 않는다.
3. **마감 재전송**
   - 분기 B에 `commitDay(B, cfg, 같은 명령, simulation_day)`를 다시 보낸다. 결과는 `alreadyClosed === true`이고 상태가 그대로다. 현금과 10일 급여 분개 수도 그대로다.
   - 분기 B를 저장·복원한 뒤 다시 보내도 같다.
4. **사건 재전송**
   - 같은 `EVENT_A`를 `announceDay: simulation_day + 1`로 한 번 더 넣은 설정을 만든다. 11일 `openDay`에 이 설정을 넘긴다.
   - 공지가 새로 생기지 않는다. 적용 사건 수와 공지 수는 1로 남는다.
5. **명령 ID 보존:** 복원한 분기 B에서 11일을 열고 같은 명령 ID를 다시 보낸다. 결과 상태는 `DUPLICATE`다.
6. **난수 커서 보존**
   - 두 분기의 `rng`가 준비 때의 `rng`와 같다. `cursors.events`는 `random_cursor`다.
   - 두 분기에서 다음 `drawUniform(…, 'events')` 값이 같다. 특정 난수값은 단언하지 않는다(명세 `fixture_rules` 2).
7. `it.todo('검사비 3(EVENT_A 비용 사건, M3) 반영 뒤 분기마다 현금 company_cash_each_branch 확인')`.
- **Claude 확인값:** 같은 설정을 `4de152a` 사본에서 돌렸다.
  - 9일 마감 뒤 현금은 100, 분기 A 마감 뒤 현금은 96이었다. 분기 A와 B는 같았다.
  - 재전송은 `alreadyClosed`였다. 중복 사건은 적용되지 않았고, (나) 경로도 A와 같았다.

### 7. P0-ACC-01 엔진 명령 경로 (`acceptance-p0-acc.test.ts`에 더함)

`describe('P0-ACC-01 …')` 안에 새 `it('엔진 명령 경로(수락·예약·출항·도착·인도·급여)로도 같은 값이 나온다', …)`를 더한다. 기존 `it`는 그대로 둔다.

**합성 설정** (메모리 안):
- `loadScenario('SCENARIO_M1_ONE_TRADE')`를 복사한다.
  - `buy`·`sell`은 `config.offers`에서 `kind`로 찾는다.
  - 노선은 `routeBetween(config, buy.cityId, sell.cityId)`다.
- 명세 `actions`의 숫자를 쓴다. 이 숫자는 `expected_numeric`에 없어서 시험 안 상수로 두고, 주석에 명세 단계를 적는다.
  - 시작 현금 100: `startingCash: { XXX: 100 }`.
  - 매입 60: 매입 견적 수량 1, 단가 60.
  - 판매 90: 판매 견적 수량 1, 단가 90.
  - 두 견적의 수량은 같아야 한다. 판매 수량을 원래 값으로 두면 엔진이 ‘같은 상품·같은 수량’ 규칙으로 수락을 거절한다(Claude 확인).
  - 운임 5: 노선 `bookingFeeMinor`.
  - 관세 3: `terms.dutyRateBasisPoints: 500`. `applyBasisPoints(60, 500)`이 3이다.
  - 임금 4.
- `tradeCurrency`·`payrollCurrency`·노선·두 견적의 통화를 모두 `'XXX'`로 둔다.
- 직원은 두 명이다.
  - A: 원래 첫 직원 복사, `salaryCurrency: 'XXX'`, 급여 0. 준비 업무를 맡는다.
  - B: 같은 정의 복사, `id: 'ACC-WAGE'`, 급여 4 XXX.
- 인도일 `D = tradePreview(cfg, buy.id, sell.id, 1).arrivalDay + cfg.terms.customsDays`.
  - `terms.deliveryDeadlineDay = D`로 둔다(정시).
  - `terms.paymentDueDay = D + 1`로 둔다. 그래야 그날 수금하지 않는다(명세 3단계 ‘아직 수금하지 않음’).
- `createGame` 뒤 상태에서 B의 `availableFromDay`를 D로 둔다. 근무 시작일 규칙(`hireCandidate`와 같은 필드)이라 급여가 D일에 한 번만 나간다.
- 1일 명령은 `ACCEPT_TRADE` 하나다. `plan`은 `{ employeeId: A.id, sailingId: listSailings(cfg, route.id, 2)[0].id }`다. 그다음 `runDays(…, D)`로 진행한다.

**단언:**
- `summarize(ledger, 'XXX')`가 `expected_numeric`과 같다.
  - `company_cash` 28, `accounts_receivable` 90, `inventory_carrying_amount` 0, `revenue` 90.
  - `cost_of_goods_sold` 68, `wage_expense` 4, `profit` 18, `total_assets` 118.
- `companyReport(...).inventoryUnits`가 `inventory_units`(0)와 같다.
- 화물은 `DELIVERED` 한 번이다.
- 매입·운임 선지급·운임 원가 편입·관세·매출·매출원가·급여 분개가 각각 한 건이다.
  - 엔진 분개 ID 접두사로 센다: `PURCHASE-`, `FREIGHT-PREPAY-`, `FREIGHT-CAPITALIZE-`, `DUTY-`, `SALE-`, `COGS-`, `WAGE-D`.
  - Claude 확인 때 분개는 이 7건과 `OPENING-XXX`뿐이었다.
- 매출원가 = 매입 + 운임 + 관세이고, 운임·관세를 따로 비용으로 잡은 계정이 없다(명세 단언 2).
- 수락 명령 결과는 `APPLIED`다.
- **Claude 확인값:** `4de152a` 사본에서 D=7이었다. 위 값이 모두 그대로 나왔다(현금 28, 채권 90, 자산 118, 이익 18).

## 테스트

### `reports-read.test.ts`

**`onTimeDeliveryRate`**
- 납기 당일 인도는 정시이고, 하루 늦으면 지연이다.
  - M1 설정을 복사하고 `terms.deliveryDeadlineDay`를 인도일과 인도일 − 1로 바꿔 엔진으로 진행한다.
  - 인도일은 `tradePreview`로 계산한다.
  - `contract.lateDays`와도 맞는지 본다.
- 취소한 계약과 미인도 계약은 분모에 넣지 않는다.
  - 납기가 지난 미인도 계약은 `pastDeadlineUndelivered`로 센다.
  - 계약 복사로 합성 상태를 만든다(m2a-culture 312행 방식).
- 2/3은 `6666`(내림)이다. 인도한 계약이 0건이면 `null`이다.
- `partyId` 필터 결과는 모든 거래처에서 `counterpartyRecord`의 `onTime`·`late`와 같다. 거래처 ID는 상태의 계약에서 모은다.
- `currency`·`kind` 필터가 동작한다.

**`upcomingPayments`**
- ‘기간·종료’ 시험 밖에서는 `throughDay`로 `config.campaignDays`를 넘긴다. 기본 7일 창 때문에 행이 빠져 시험이 흔들리지 않게 한다.
- 합성 상태는 `planState(...).state`(같은 날 명령 반영) 또는 `runDays`로 만든다.
- 급여 행
  - M2 1일을 연 상태로 확인한다. 날마다 금액 = 근무 직원 급여 합계이고, 이 값은 `config.employees`에서 계산한다.
  - 미래 근무자(`config.recruitment.candidateEmployeeIds[0]`을 `employed`·`availableFromDay = day + 3`으로)는 그날부터 들어간다.
- 운임 행
  - 운송편 없이 수락하면 FREIGHT 행이 생긴다. 금액은 노선 운임, 날짜는 실을 수 있는 첫 편의 전날이다.
  - 예약하면 행이 사라진다.
- 관세 행
  - 직접 무역을 예약하면 DUTY 행의 날짜가 `출항일 + transitDays`다.
  - 출항 뒤에는 `scheduledArrivalDay`다. 도착해 관세를 내면 행이 사라진다.
  - 운송 주선에는 DUTY 행이 없다.
- 미지급 행
  - 미지급 의무를 합성하면(previews.test 방식) OVERDUE가 맨 앞에 온다.
  - `paidDay`를 채우면 사라진다.
- 기간·종료
  - `throughDay` 밖의 날짜 행은 없다. null 날짜 행은 남는다.
  - `ENDED`면 OVERDUE만 있다.
    - 이 시험의 상태는 캠페인 중간 상태의 `phase`만 `'ENDED'`로 바꾼 사본으로 만든다. 그 상태에는 근무 직원 급여, 운임·관세 예약, 미지급 의무가 모두 있어야 한다.
    - 이유: 실제 90일 종료 상태는 `s.day`가 `campaignDays + 1`이라 급여 행이 원래 생기지 않는다. M2 정책 실행은 끝에 예약이 0건이다(Claude 확인). 그래서 종료 상태만으로는 ‘`ENDED` 검사를 지운 변형’을 잡지 못한다.
    - `throughDay`를 `s.day + 6`으로 넘긴 호출도 OVERDUE만 돌려주는지 본다.
- 통화
  - WAGE는 급여 통화, FREIGHT·DUTY는 거래 통화다. 한 행에 두 통화가 섞이지 않는다.
- `payrollRunwayDay`와 대조
  - `upcomingPayments(s, config, config.campaignDays)`에서 급여 통화의 OVERDUE 합계와 WAGE 누계를 만든다.
  - 그 합이 현금을 처음 넘는 날 − 1이 `payrollRunwayDay(s, config)`와 같다.
  - 캠페인 끝까지 넘지 않으면 둘 다 null이다.
- 순수성: 호출 전후 `structuredClone` 비교가 같다.

**`campaignSummary`** (진행 중 상태)
- 진행 중에는 `ended === false`이고 `lastClosedDay === s.day − 1`이다.
- 거래 통화 상태가 급여 통화 분개와 무관하다.
  - 사본에 급여 통화 현금이 바뀌는 분개를 하나 더하고(`post`, 예: `WAGE_EXPENSE` 차변·`CASH` 대변) 다시 계산한다.
  - 거래 통화의 `CurrencyStanding`은 그대로이고, 급여 통화 쪽만 바뀐다.
  - 이 시험이 변형 시험 ‘거래 통화 `cash`에 급여 통화 현금을 더함’을 잡는다. 90일 종료 상태는 급여 통화 현금이 0일 수 있어 그 변형을 못 잡는다.
- 계약 건수 네 가지의 합이 `total`이다.
- 인도 뒤 수금 전인 상태에서 미수가 맞다.
  - M1을 `standardDayOneCommands`로 진행해, 인도일은 지났고 수금일은 오지 않은 날에서 계산한다. 두 날은 `tradePreview`와 `config.terms`에서 구한다.
  - 거래 통화 `accountsReceivable`이 0보다 크고, `openInvoices` 합계와 같다. `contracts.awaitingPayment`는 1이다.
  - 90일 종료 상태에서는 미수가 0이 되어 이 항등식이 약하게만 검사되기 때문이다.

**`workloadSummary`**
- 훈련·현지 활동이 끼는 시험은 명령을 넣은 같은 날 상태(`planState(...).state`)에서 읽는다. M2 일반 훈련은 1일이라 하루를 마감하면 끝난다.
- 수락만 하고 배정하지 않은 계약의 준비 업무는 `unassignedWorkUnits`에 들어간다. 값은 `config.terms`의 준비 업무량이다.
- 배정하면 `runningWorkUnits`로 옮겨 간다.
- 하루 진행 뒤 직원 처리량만큼 줄어든다. `terms.prepWorkUnits`를 키운 합성 설정으로 확인한다. 이때 출항편 계획 없이 수락·배정만 해서 출항 불참 정산이 끼지 않게 한다.
- 훈련 중인 직원의 처리량은 `dayTaskWorkUnitsPerDay`에 들어가고, `idleWorkUnitsPerDay`에는 들어가지 않는다.
- 내일부터 근무하는 직원은 `startingLater`에만 있다.
- `daysToClear`
  - 업무가 없으면 0이다.
  - 업무가 있는데 처리량이 0이면 null이다. 예: 근무 직원 모두에게 일반 훈련을 시작하게 한 뒤, 운송편 없이 계약을 하나 수락한다.
  - 나머지는 올림 값이다.
- 다른 도시 업무
  - 합성 업무의 `cityId`를 `config.routes[0].toCityId`로 둔다.
  - 그 도시 항목에 직원 처리량이 0이고 `daysToClear`가 null이다.
- 순수성.

### `campaign-end.test.ts` (M2, 90일)

- 시나리오는 `loadScenario('SCENARIO_M2_MULTI_TRADE')`다.
- 1일에 `acceptAllFeasible`을 쓰고 `runToCampaignEnd`로 끝까지 마감한다.

1. `phase === 'ENDED'`, `day === campaignDays + 1`이다. `closedDays`는 1..campaignDays를 한 번씩 담는다.
2. `campaignSummary.onTime.delivered >= 1`이다. 0이면 정책이 무력해진 것이므로 실패해야 한다.
   - `onTime + late === delivered`.
   - `delivered`는 `deliveredDay !== null`인 계약 수와 같다.
3. 통화마다 다음이 성립한다.
   - `netAssets === totalAssets − accountsPayable === openingEquity + profit`.
   - `accountsReceivable`은 `openInvoices`의 그 통화 합계와 같다.
   - `accountsPayable`은 `unpaidObligations`의 그 통화 합계와 같다.
   - 두 목록은 상태의 미수 청구서·미지급 의무와 같다.
4. `byCurrency`에 거래 통화와 급여 통화가 따로 있다. 통화를 섞은 필드가 없다(통화 목록이 중복 없는지 확인).
5. 주요 계약 없이(명령 없이) 90일을 마감해도 정상 결산한다(DESIGN 694행).
   - `delivered === 0`, `rateBasisPoints === null`, `contracts.total === 0`.
   - 3번의 항등식이 그대로 성립한다.
6. `campaignSummary`는 상태를 바꾸지 않는다.
7. `ENDED` 상태를 저장·복원해도 결산이 같다.
8. `upcomingPayments(ended, config)`에는 OVERDUE 행만 있다. 그 합은 통화별 `accountsPayable`과 같다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 정시 인도의 정의 | `deliveredDay <= deliveryDeadlineDay`. DESIGN 497행 ‘마감일 도착은 정시’, `engine.ts` 999행, `counterpartyRecord`와 같다. |
| 미인도 계약을 분모에 넣는가 | 넣지 않는다. 납기가 지난 미인도는 `pastDeadlineUndelivered`로 따로 센다. 화면이 함께 보인다. |
| 비율 표현 | basis point 정수, 내림. 퍼센트 문자열은 화면이 만든다. |
| 미수·미지급의 기준 시점 | 호출한 순간의 상태. 예측·할인 없음. 캠페인 뒤 수금일의 청구서도 미수다. |
| 통화 합계·환산 | 만들지 않는다(B34 사용자 결정 대기). 가상 환율 1,300원을 쓰지 않는다. |
| 경영 실패·유예기간 | 판정하지 않는다(DECISIONS 57행). |
| 임박 지급 기본 기간 | 오늘부터 7일(`s.day + 6`, 캠페인 마지막 날까지). 인수로 바꿀 수 있다. |
| 급여 행 묶음 | 날·통화마다 한 행. 직원 ID는 `employeeIds`에 둔다. `sourceId`는 `WAGE-D010-KRW`처럼 통화까지 넣어 겹치지 않게 한다. |
| 미지급 행의 계약 ID | null. 의무에는 계약 ID가 없다. 의무 ID(`DUTY-SH001` 등)에서 거꾸로 찾지 않는다. |
| 운임 지급일 | 실을 수 있는 첫 출항편의 전날(예약 마감). 없으면 null. |
| 관세 지급일 | 출항했으면 `max(scheduledArrivalDay, s.day)`, 예약만 했으면 `departureDay + transitDays`, 예약이 없으면 null. |
| 하역 중단으로 늦어질 도착 | 반영하지 않는다. 예정일 기준이다. 대기 중이면 오늘로 둔다. |
| 처리량에 레벨·능력 반영 | 하지 않는다. LEGACY_FIXED `workUnitsPerDay`만 쓴다. |
| 직원이 다른 도시에 있으면 | 그 직원의 처리량은 그 도시에만 센다. |
| P0-TIME-01 시작 단계 차이 | 저장 시점 (가)·(나)를 모두 시험하고 보고에 대응을 적는다. 명세 파일은 고치지 않는다. |
| 검사비 3 | `it.todo`로만 둔다. 93을 단언하지 않는다. |
| XXX 통화를 엔진이 거절하면 | Claude 확인으로는 거절하지 않는다. 그래도 거절하면 고치지 말고 보고한다. |
| 기존 시험이 실패하면 | 기대값을 고치지 않는다. 원인을 찾고, 못 찾으면 보고한다. |
| `reports.ts`의 기존 함수가 이미 비슷한 값을 낸다 | 기존 함수를 고치지 않는다. 새 함수 안에서 불러 쓴다(`summarize`, `contractReport`, `cashReservations`). |
| TASK-0017의 sim 지표와 겹친다 | 그대로 둔다. 병합 때 Claude가 하나로 합친다. `src/engine/sim/`을 만들지 않는다. |
| 새 시험 수 | 정하지 않는다. 위 목록을 모두 덮으면 된다. |
| `acceptAllFeasible`에서 맡을 직원이나 출항편이 없을 때 | 그 후보를 건너뛴다. 계획 없는 수락으로 바꾸지 않는다. |
| 결산·임박 지급을 어느 단계에서 부르는가 | `PENDING_OPEN`·`AWAITING_INPUT`·`ENDED` 모두 된다. 단계에 따라 상태를 고치지 않고 그대로 읽는다. |
| 시작 기준 개수가 27개 파일·803개와 다를 때 | 실제 값을 결과 보고에 적고 계속한다. 완료 조건의 ‘30개 파일’은 ‘시작 값 + 3’으로 읽는다. |
| `review_checks.sh`가 이 작업과 무관한 원인으로 실패할 때 | 고치지 않는다. 실패 출력과 원인 추정을 ‘범위 밖 발견’에 적는다. 이 작업 파일 때문이면 고친다. |

## 완료 조건

1. 구현 지시 1~7이 반영되었다.
2. 검증
   - 시작 전에 `npx vitest run`을 한 번 돌려 기준 개수를 적는다. Claude 확인값은 `4de152a`에서 27개 파일·803개 통과다.
   - 끝내기 전에 `bash tools/ai/review_checks.sh c6f0d2d`를 실행한다. 8종이 모두 통과해야 한다.
     - vitest는 새 파일 3개를 더해 30개 파일이 되어야 한다.
     - 파이썬 시험 수(21·21·19)는 그대로여야 한다.
3. 바꾼 범위 확인
   - `git diff --name-only c6f0d2d`와 `git status --short --untracked-files=all`의 새 파일이 ‘고칠 수 있는 파일’ 안에 있다(`MANIFEST.json` 포함).
   - `git diff c6f0d2d -- src/engine/reports.ts src/engine/testkit.ts src/engine/acceptance-p0-acc.test.ts`에 지운 줄이 없다. import 줄만 예외다. 그 diff 출력을 결과 보고에 붙인다.
   - 기존 시험 파일은 `acceptance-p0-acc.test.ts` 말고는 diff가 0이다.
   - 다음 명령의 결과가 0건이다.
     ```
     grep -nE "PYEONGTAEK|BUSAN|HAIPHONG|SHANGHAI|YOKOHAMA|SINGAPORE|JAKARTA|OFFER_|EVI_|ROUTE[0-9]|EMP[0-9]|평택|부산|하이퐁|상하이|요코하마|싱가포르|자카르타" src/engine/capacity.ts src/engine/campaign-end.test.ts src/engine/reports-read.test.ts src/engine/acceptance-p0-time.test.ts
     ```
     같은 grep을 `git diff c6f0d2d -- src/engine/reports.ts src/engine/testkit.ts src/engine/acceptance-p0-acc.test.ts`의 더한 줄에도 돌려 0건을 확인한다.
4. **변형 시험.** 아래를 하나씩 넣고, 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 되돌린다.

   | 변형 | 실패해야 하는 시험 |
   |---|---|
   | 정시 판정을 `<`로 바꿈 | 납기 당일 정시 시험 |
   | `netAssets`에서 미지급금을 빼지 않음 | 순자산 항등식(결산 3) |
   | 거래 통화 `cash`에 급여 통화 현금을 더함 | 통화 분리 시험 |
   | 급여 행에서 `availableFromDay` 검사를 뺌 | 미래 근무자 급여 시험 |
   | `upcomingPayments`의 `ENDED` 검사를 지움 | `reports-read`의 종료 상태 임박 지급 시험(합성 `ENDED` 상태) |
   | 훈련 중 직원의 처리량을 `idleWorkUnitsPerDay`에 넣음 | 훈련 중 처리량 시험 |
   | `engine.ts` 802행 부근의 마감 재전송 `if` 문 전체를 지움 | P0-TIME-01 마감 재전송 |
   | `engine.ts` 133행 부근에서 이미 적용한 사건을 건너뛰는 `s.appliedEventIds[r.eventInstanceId]` 조건을 지움 | P0-TIME-01 사건 재전송 |

   - `engine.ts` 변형은 편집기로 되돌린다. 그 뒤 `git diff --quiet 4de152a -- src/engine/engine.ts`가 종료 코드 0인지 확인해 보고에 적는다.
   - git으로 파일을 되돌리거나 stash하지 않는다.
5. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0016.md`에 머리말 형식으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유. P0-TIME-01 저장 시점 (가)·(나)의 대응을 여기에 적는다.
- **실행한 검증과 결과:** 명령별 통과·실패와 시험 개수. 시작 전 기준 개수도 적는다.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **변형 시험 표**
- **화면 연결 안내:** 함수마다 어느 화면 칸에 쓰일지 한 줄씩 적는다. W2-0d 지시서의 입력이 된다. 예: `upcomingPayments` → 위쪽 막대 임박 지급(UI_SPEC 11행).
- **범위 밖 발견:** 고치지 않은 문제. 예: 기존 함수의 불일치, 문서와 코드의 차이.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 확인은 필요 없다(화면 변경 없음).
