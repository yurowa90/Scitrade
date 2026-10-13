# TASK-0057 M2a-5 화면 3: 고용 면담·지급 경고·경영 실패·결산과 원화 보고

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: 개발 브랜치 `0990273`(TASK-0034 병합 기록과 화면 검수 문서 뒤, 이하 `<BASE>`). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
  - `<BASE>`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0057-m2a5-ops-screens-money.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 줄 번호는 개발 브랜치 `957e877` 기준이다. TASK-0034가 `main.ts`를 고쳐 `<BASE>`에서는 조금 달라진다. **이름으로 찾고**, 달라진 줄을 결과 보고에 적는다.
- 결정 근거: `docs/ai/design/M2A5-SPEC.md` 16절 6·7·8·10, 11절(지급 불이행·실패). `docs/DECISIONS.md` D04 가(경영 실패).
- 먼저 읽을 것:
  - `docs/ai/tasks/TASK-0034-m2a5-ops-screens.md`의 ‘읽는 상태: `state`와 `view`’ 절과 끝의 ‘다음 지시서로 넘긴 범위’.
  - `docs/ai/tasks/results/TASK-0034.md`. 0034가 만든 `warehouse.ts`와 `UiCommand` 변경 위에서 일한다.

## 목표

규칙 2에서 학생이 **돈이 언제, 왜 모자라는지, 망하면 무엇이 원인이었는지**를 화면에서 읽게 한다. 규칙 1 화면은 바뀌지 않는다(바이트 비교).

## 읽는 상태

- **보고 화면**(지급 알림, 실패 화면, 결산, 원화 보고)은 **확정 상태 `state`** 로 읽는다. 기존 `reportPanel`·`settlementBlock`이 `state`를 읽는 것과 같다(`main.ts:47-49` 주석).
- **면담 칸**은 지금 `recruitmentPanel(view, …)`(`main.ts:898`)로 그린다. `view`에서는 대기열에 있는 고용이 이미 고용된 상태다. 그러면 `hiringOutlook`의 `candidate()`(`src/engine/readers.ts:119-121`)가 undefined가 되어 일급·처리량이 0이 된다. 그래서 지시 1의 줄은 **`state`로 읽는다.** 고용이 대기열에 있으면(`queuedHire`) 그 줄을 쓰지 않는다.

## 엔진이 주는 값(고치지 않는다, 읽기만)

| 함수·칸 | 위치 |
|---|---|
| `hiringOutlook(s, config, candidateId)` → `workUnitsPerDay`·`wageKrwPerDay`·`wageUsdLotsPerWeek`·`recentHandlingOfferedPt`·`recentHandlingAcceptedPt`·`bottleneck{usableBefore, usableAfter, extraJobsPerWeek, binding, contributionPerJobMinor}` | `src/engine/readers.ts:205` |
| `paymentDefaultStatus(s, config)` → `level`·`oldest`·`ageDays`·`dangerFromDay`·`failAtCloseOfDay`·`recovery{dueToSurviveMinor, lotsToSurvive, lotsToClearAll, usdAvailableLots, nextReceipt, krwToUsdRequiredMinor, heldSpendingKo}` | `src/engine/operations.ts:228` |
| `state.operations.failure`(`FailureRecord`) | `src/engine/types.ts:570-577` |
| `DefaultEvent`(`warningEvent`·`dangerEvent`): `lotsToSurvive`·`lotsToClearAll`·`usdAvailableMinor`·`dueToSurviveMinor` | `types.ts:565-569` |
| `campaignSummary(...).operations` → `outcome`·`failure`·`arrearsAtEnd`·`exchanges`·`fixedCostsByCurrency`, `byCurrency[]`의 `rentExpense`·`facilitySetupExpense`·`spaceContractExpense`·`fxSpreadExpense`·`currencyTransferNet` | `src/engine/reports.ts:342-372` |
| `companyReport(...).payroll`(`BookSummary`): 같은 다섯 칸 | `src/engine/ledger.ts:155-159` |
| 설정 `config.operations.paymentDefault.{warningFromAgeDays, dangerFromAgeDays, failureAgeDays}`, `config.operations.fx.lotUsdMinor` | `types.ts:551-553` |

위 표에 없는 값이 문장에 필요하면 만들지 말고 ‘질문’에 적는다.

## 엔진 값의 성질(문장을 정하기 전에 알 것)

- `recovery.lotsToSurvive`는 **실패 나이에 이른 미지급만** 센다(`operations.ts:239`의 `dueToSurviveMinor`). 그래서 경고·위험 기간에는 거의 늘 0이고, 실패 당일 마감 전에만 양수다. 엔진 시험의 사건값도 0이다(`src/engine/m2a5-money.test.ts:116-117`).
- `lotsToSurvive`·`lotsToClearAll`이 null이면 가장 오래된 미지급이 USD라는 뜻이다. 그때는 `nextReceipt`·`krwToUsdRequiredMinor`가 의미 있다.
- `FailureRecord.reasonKo`는 미지급 항목의 이유(예: ‘○○ 57일 급여’)일 뿐이고, 원인 문장이 아니다(`operations.ts:281`).
- 실패한 날 마감 뒤 `state.day`는 실패일 + 1이다(`src/engine/engine.ts:866`). 실패일은 `failure.day`로 쓴다.
- 금액 묶음은 `× config.operations.fx.lotUsdMinor`로 바꾼다. 100을 박지 않는다.

## 구현 지시

### 1. 고용 면담 칸(명세 16-8, `src/ui/recruitment.ts`의 `interviewBlock`)

- **규칙 2에서만**, 고용이 대기열에 없을 때 기존 `dl` 아래에 `ul` 하나를 더한다. 규칙 1 면담 칸은 바이트로 같아야 한다.
- 값은 `hiringOutlook(state, config, 후보 ID)`다. `interviewBlock`에 `state`를 넘기는 인자를 더하거나, `main.ts`에서 미리 계산해 넘긴다. 방법을 ‘설계 판단’에 적는다.
- 줄:
  - ‘이 직원 하루 일급 {wageKrwPerDay} — 일주일이면 USD 약 {wageUsdLotsPerWeek × lotUsdMinor} 환전’.
  - ‘최근 4묶음 작업 견적 {recentHandlingOfferedPt}pt / 받은 {recentHandlingAcceptedPt}pt’.
  - ‘작업 포함 주선 1건 기여이익 {contributionPerJobMinor}’. 일급은 KRW, 기여이익과 환전액은 USD다. 금액마다 통화를 붙인다(`formatMoney`).
  - ‘다음 주 받을 수 있는 작업 포함 주선: 지금 {usableBefore}건 → 고용 뒤 {usableAfter}건(가장 좁은 곳: {binding.after 이름})’. 이름은 0034 병목 표의 행 이름과 같은 말을 쓴다(공통 함수로 둔다). `binding.after`는 배열이다(예: 1일에는 직원·선복 둘). 여럿이면 ‘·’로 잇는다.
- `extraJobsPerWeek === 0`이면 한 줄을 더 쓴다: ‘이 직원을 뽑아도 {binding.after 이름}에 막혀 더 받을 수 없습니다’.
- 명세 16-8의 ‘직원 부족으로 못 받은 {pt}’는 쓰지 않는다(TASK-0028 지시 5).

### 2. 지급 경고·위험 알림(명세 16-6, `src/ui/money-alerts.ts` 새 파일 또는 `reports.ts`)

- 규칙 2에서 `paymentDefaultStatus(state, config).level`이 `WARNING`·`DANGER`이면 경영 보고(`reportPanel`) 제목 바로 아래에 알림 칸을 둔다. 단계 이름(‘경고’·‘위험’)을 글로 쓴다.
- 보일 것:
  - 원인: ‘{incurredDay}일 {reasonKo} {금액}이 밀렸습니다’(`oldest`).
  - 나이·마감: ‘밀린 지 {ageDays}일. {dangerFromDay}일부터 위험, {failAtCloseOfDay}일 마감까지 못 갚으면 경영 실패입니다’. `failAtCloseOfDay > campaignDays`이면 뒤 구절 대신 ‘캠페인이 끝날 때까지 못 갚으면 미지급을 남기고 끝납니다’.
  - 회복 행동(원화 미지급이 가장 오래됐을 때, 즉 값이 null이 아닐 때):
    - `lotsToClearAll > 0`이면 먼저 ‘밀린 원화를 모두 갚으려면 USD {lotsToClearAll × lotUsdMinor}를 환전하세요(지금 쓸 수 있는 USD {usdAvailableLots × lotUsdMinor})’.
    - `lotsToSurvive > 0`이면 ‘오늘 마감에 실패하지 않으려면 최소 USD {lotsToSurvive × lotUsdMinor}’. 0이면 ‘오늘 마감에는 실패하지 않습니다’.
  - USD 미지급이 가장 오래됐을 때(값이 null): 다음 수금 ‘{nextReceipt.day}일 {금액}’ 또는 ‘없음’, 원화로 USD를 사려면 ‘{krwToUsdRequiredMinor}’.
  - 보류할 지출: `heldSpendingKo`(있을 때).
- 현실 문구 ‘실제로는 임금을 정한 날 지급해야 하며 하루 늦어도 체불입니다’를 넣는다. 조문 번호는 넣지 않는다.
- ‘환전 칸으로’ 단추를 둔다. 기존 `skip-to` 동작(`main.ts:1231`)을 쓴다.
  - `skip-to`는 지금 `trade-h`·`queue-h`·`settlement-h`만 받는다(`main.ts:1232`). 허용 목록에 `exchange-h`를 더한다.
  - 환전 칸 제목 `exchange-h`(`src/ui/market.ts:85` 근처)에는 `tabindex`가 없어 `focus()`가 듣지 않는다. `tabindex="-1"`을 더한다. 환전 칸은 규칙 2에만 있으므로 규칙 1 화면은 바뀌지 않는다.
- 화면 낭독기 알림은 단계가 바뀐 날에만 한 번 한다(같은 단계를 매일 되풀이하지 않는다).
  - 알림 결정 함수 `nextAnnouncement`는 `session.ts`에 있고 이 작업에서는 고치지 않는다. 낭독 칸(`liveStatus`)에 따로 쓰면 하루 진행 알림을 덮어쓴다(쓰는 곳 `main.ts:1053`·`1116`).
  - 그래서 `main.ts`에 직전 단계를 담는 모듈 변수를 두고, `render`의 1114-1116행에서 만든 `announcement` 뒤에 ‘지급 {경고/위험} 단계가 되었습니다’를 이어 붙인다. 다시 시작·불러오기·시나리오 바꿈 때 이 변수를 초기화한다.

### 3. 경영 실패 화면(명세 16-7, D04 가)

- `state.operations.outcome === 'FAILED'`일 때만 보인다. 경영 보고에서 결산 위에 둔다. 제목은 ‘{failure.day}일 경영 실패’, `id="failure-h"`, `tabindex="-1"`이다.
- **끝 화면 흐름:** 캠페인이 끝나면 지금은 `endDay`(`main.ts:274-283`)가 ‘{campaignDays}일 캠페인이 끝났습니다 … {campaignDays}일 결산’ 알림을 띄우고 `settlement-h`로 초점을 옮긴다. 결산 제목도 ‘{campaignDays}일 결산’이다(`main.ts:825`). 71일에 실패해도 ‘90일 캠페인이 끝났습니다’가 되므로 규칙 2 실패에서는 바꾼다.
  - 알림: ‘{failure.day}일 경영 실패로 캠페인이 끝났습니다. 경영 보고에서 원인과 결산을 확인하세요.’
  - 초점: `failure-h`.
  - 결산 제목: ‘{failure.day}일 마감 결산’.
  - 규칙 1과 규칙 2 완료는 지금 문장 그대로다.
- 원인 문장: ‘{incurredDay}일 {reasonKo} {amountMinor}를 {failureAgeDays}일 동안 갚지 못했습니다’. 값은 `failure`와 설정에서 읽는다.
- 통화별 미지급(`unpaidByCurrency`: 금액·건수)과 현금(`cashByCurrency`)을 통화마다 따로 쓴다. 합계는 쓰지 않는다.
- 경고·위험 당시: 사건마다 ‘{day}일 {경고/위험}: 밀린 원화를 모두 갚는 데 USD {lotsToClearAll × lot} 필요, 그때 쓸 수 있던 USD {usdAvailableMinor}’. 사건이 null이면 그 줄을 쓰지 않는다. 값이 null이면 ‘USD 미지급’으로 쓴다.
- ‘첫 미지급 전 {failureAgeDays}일 동안의 원화 선택 지출’ 목록(`optionalKrwSpendBeforeFirstUnpaid`: 일·이유·금액). 없으면 ‘없음’.
- ‘미지급 뒤 새로 묶은 USD 약정’ 목록(`usdCommitmentsSinceIncurred`: 일·종류(계약/선복 계약)·ID·금액). 없으면 ‘없음’.
- 단추:
  - ‘같은 시드로 다시 하기’: 기존 `restart`(`main.ts:1361`), 확인 창 포함.
  - ‘결산 보기’: `skip-to` → `settlement-h`.

### 4. 결산(명세 16-10, `settlementBlock`)

- 규칙 2에서 더할 것:
  - 결과 한 줄: ‘완료’ / ‘경영 실패({failure.day}일)’. 결산은 끝난 화면에만 있으므로(`engine.ts:869`) 진행 중은 없다.
  - 통화별 고정비 표(`fixedCostsByCurrency`): 임차료·확장 설치비·선복 요금·환전 차감. 0인 행은 쓰지 않는다. 모든 행이 0인 통화는 표 대신 ‘{통화} 고정비 없음’ 한 줄로 쓴다. 통화 합계는 없다.
  - 결산 표(`settlementRows`)에 ‘통화 간 이체(환전)’ 행(`currencyTransferNet`): **규칙 2이고 값이 0이 아닐 때만**. 그래야 규칙 1 결산이 바이트로 같다.
  - 환전 기록(`exchanges`): 일·방향·USD·KRW·차감. 많으면 `details`로 접는다.
- 끝 미지급은 기존 줄을 그대로 쓴다.

### 5. 원화 보고 표(`krwReportRows`, `src/ui/reports.ts:11`)

- 규칙 2일 때 행을 더한다: ‘창고 임차료’(`rentExpense`), ‘창고 확장 설치비’(`facilitySetupExpense`), ‘환전 차감’(`fxSpreadExpense`), ‘통화 간 이체(환전)’(`currencyTransferNet`). 0인 행은 쓰지 않는다. 자리는 ‘운영 손익’ 바로 앞이다.
- 규칙 2에서는 ‘미지급 급여’(`reports.ts:17`) 행 이름을 ‘미지급(급여·임차료)’으로 바꾼다. 밀린 임차료도 미지급금에 들어가기 때문이다(`engine.ts:1175` `payOrAccrue`, 실측: 미지급 2,770,000원 가운데 임차료 450,000원). 규칙 1 이름은 그대로다.
- 규칙 2에는 영입·성장·현지 활동 설정이 모두 있어 계약금·훈련비·활동비 행이 이미 나온다.
- 규칙 1의 행 목록과 순서는 바이트로 같다.
- 표의 값만으로 항등식 ‘시작 운영 자금 − (급여 + 계약금 + 훈련비 + 활동비 + 임차료 + 설치비 + 환전 차감) + 통화 간 이체 = 현금 − 미지급’이 맞는지 확인하는 시험을 둔다(적대 검토가 환전 없는 실패 상태에서 실측으로 맞음을 확인했다).

### 6. 본사·창고 표의 선복 줄 문구(TASK-0034 검수에서 넘어옴)

- `src/ui/warehouse.ts`의 선복 줄은 출항편 ID(`노선-D일` 꼴)를 그대로 보인다. 학생용 문구로 ‘{노선 이름} {출항일}일 편’으로 바꾼다.
- 노선 이름은 `routeLabel`(같은 파일), 출항일은 `findSailing` 등 기존 공개 함수로 읽는다. 사용량/한도 값과 순서는 그대로다.

### 7. 끝난 캠페인의 화면(허브 화면 검수 SF-1·SF-3·F3)

근거: `docs/ai/design/ui-review-0033/README.md`의 SF-1·SF-3·F3. 재현 절차는 그 문서에 있다. 엔진은 고치지 않는다. 실패 뒤 견적 만료·공개를 멈추는 것(`engine.ts:848`)과 `payrollRunwayDay`가 null을 ‘끝까지 가능’으로 쓰는 것은 의도된 동작이다. 종료 분기는 화면에서 처리한다.

- **위쪽 막대(규칙 2, `state.phase === 'ENDED'`):**
  - 원화 급여 가능일 칸 값은 ‘캠페인 종료’다. 칸은 빼지 않는다. 빼면 막대 폭이 바뀐다.
  - 지급 상태는 끝난 결과로 쓴다. ‘경영 실패’, ‘종료 · 남은 미지급 있음(결산 참고)’, ‘종료 · 지급 정상’ 가운데 하나다. ‘실패까지 n일’과 ‘…끝날 때까지 갚지 못하면…’은 쓰지 않는다. 하루 진행 뒤 예상 줄도 없다.
- **환전 칸:** 끝난 상태에서는 그리지 않는다(엔진도 명령을 받지 않는다).
- **경영 보고 ‘현금과 이익이 다른 이유’(`main.ts` 848-849행 근처):** 환전 권유 문장은 진행 중일 때만 붙인다. 끝난 상태에서는 ‘캠페인이 끝나 더 갚을 수 없습니다. 남은 미지급은 결산에 있습니다.’를 쓴다(미지급이 있을 때).
- **견적판(`offerBoard`):** 끝난 상태에서는 견적 카드·수량 고르기를 그리지 않고 ‘캠페인이 끝나 견적을 받을 수 없습니다’ 한 줄을 둔다.
  - 시세표는 남긴다. 다만 ‘다음 관측’ 칸은 ‘없음(캠페인 종료)’으로 쓴다. 엔진 읽기 함수 값은 바꾸지 않고 화면에서만 덮는다.
- **주선 견적의 유효기간:** 진행 중에도 주선 루프(`main.ts` 546행 근처)에 직접 무역과 같은 거름(`publishDay <= view.day && validUntilDay >= view.day`)을 둔다. 공통 도우미로 묶어도 된다. 그래야 실패한 날 만료되지 않은 견적이 다음 화면에 남지 않는다.
- **경영 실패의 문구:** 지시 3의 끝 화면 흐름(알림·초점·결산 제목)에 더해 다음 두 곳도 바꾼다.
  - 끝난 뒤 명령을 넣으려 할 때의 거절 문구(`queue`, `main.ts:196` 근처): ‘경영 실패로 캠페인이 끝나 새 명령을 넣을 수 없습니다’.
  - 오늘 할 일 머리(`main.ts:951` 근처): ‘{failure.day}일 · 경영 실패’.
  - 규칙 2 완료와 규칙 1은 지금 문장 그대로다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/recruitment.ts`, `src/ui/reports.ts`, 새 `src/ui/money-alerts.ts`(쓸 때), `src/ui/warehouse.ts`(지시 1의 제약 이름 공통 함수와 지시 6만), `src/ui/market.ts`(`exchange-h`의 `tabindex`와 지시 7의 막대·시세표 종료 분기만), `src/ui/style.css`.
- 새 시험 `src/ui/m2a5-money-ui.test.ts`. 기존 UI 시험은 규칙 2 기대 문자열 줄만 고친다.
- `docs/ai/tasks/results/TASK-0057.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`, `data/**`, `schemas/**`, `tools/**`, `src/ui/culture.ts`, `src/ui/session.ts`.

## 지켜야 할 것

- 규칙 1 불변(TASK-0033 기준 문자열 세 개 sha256, 면담 칸·결산·원화 보고 바이트 같음). 통화 분리. 결정성(기본 `run` 400회 바이트 같음). 시험 소스에 자료 ID·조정값 상수 금지(TASK-0027 R1). 색만으로 상태를 구분하지 않음. 새 단추 키보드 사용.
- **크기:** 첫 화면 gzip이 `<BASE>`보다 6,000 B 넘게 늘거나 한도 140,000 B까지 3,000 B 안으로 들어오면 멈추고 질문에 적는다.

## 시험(`src/ui/m2a5-money-ui.test.ts`)

상태는 실제 실행으로 만든다. 상태 사본의 칸을 고치지 않는다.

- **면담 칸을 여는 법:** 시작 때 후보는 모두 발견 전(UNDISCOVERED)이다. `SCOUT_SITE`(`config.recruitment.scoutSites[i].venueId`) 뒤 `START_RECRUIT_QUEST`로 면담 가능(INTERVIEW_READY)까지 진행한다. 기존 시험이 이 단계를 만드는 방법을 찾아 같은 방식으로 쓴다.
- **완료 상태(결산·원화 보고):** 인수 사례 `P0-M2A5-14`의 대본(`src/engine/m2a5-money.test.ts:28`의 `scriptOf(caseOf(...))`)에는 환전이 있고 확장·선복 계약은 없다. 1일 명령에 `EXPAND_WAREHOUSE`와 선복 계약을 더해 완료까지 진행한다. 완료되지 않거나 실패하면 그 사실과 대신 쓴 상태를 결과 보고에 적는다.
- **미지급·실패 상태 만드는 법:** 규칙 2 시나리오를 환전 없이 진행한다(명령 없이 `runDays`). 원화가 모자라 급여가 밀리고, 경고 → 위험 → 실패로 간다(적대 검토 실측: 57일 첫 미지급, 64일 위험, 71일 실패, 실패 뒤 `state.day` 72. 71일 마감 전 상태에서는 `lotsToSurvive`가 1이다). 날짜는 고정하지 말고 `paymentDefaultStatus`·`failure`에서 읽는다. 방법을 주석으로 적는다.

| 시험 | 나와야 함 | 반례 |
|---|---|---|
| 면담 줄 | 규칙 2 후보의 네 줄이 `hiringOutlook(state)` 값과 같음 | 규칙 1 면담 칸 바이트 같음 |
| 대기 중 고용 | — | 고용을 대기열에 넣은 화면에는 네 줄 없음(0 값이 나오지 않음) |
| `state`로 읽음 | 선복 계약 두 노선을 대기열에 넣은 화면의 네 줄이 `hiringOutlook(state)`와 같고, `hiringOutlook(view)`와는 다름 | — |
| ‘더 받을 수 없음’ | 투자 없는 상태(`extraJobsPerWeek === 0`, 선복이 막음) | 1일에 선복 계약 두 노선을 맺은 뒤 상태(0보다 큼)에는 없음 |
| 경고 알림 | 첫 미지급이 생긴 날 마감 뒤 화면(`state.day = incurredDay + 1`)의 `WARNING` 알림, 원인·마감 문장 | 그 전날 화면에는 알림 없음 |
| 회복 행동 | `lotsToSurvive === 0`이면 ‘오늘 마감에는 실패하지 않습니다’, `lotsToClearAll` 금액 = 값 × `lotUsdMinor` | 실패 당일 마감 전 상태에서는 최소 금액 문장 |
| 위험 알림 | `DANGER` 단계 이름 | — |
| 실패 화면 | 실제 실패 상태: 제목의 날 = `failure.day`, 원인 문장, 통화별 줄(합계 없음), 두 목록 | 완료·진행 중·`DANGER` 상태에는 없음 |
| 결산 고정비·이체 | 환전·확장·선복 계약이 든 규칙 2 완료 상태의 행 목록 전체 비교 | 0인 행 없음, 모든 행이 0인 통화는 ‘고정비 없음’, 규칙 1 결산 바이트 같음 |
| 원화 보고 | 같은 완료 상태의 행 목록 전체 비교와 항등식, 행 이름 ‘미지급(급여·임차료)’ | 규칙 1 행 목록 바이트 같음 |
| 실패 끝 흐름 | 실패한 날 하루 진행 뒤 알림 문장의 날 = `failure.day`, 초점이 `failure-h`, 결산 제목 ‘{failure.day}일 마감 결산’ | 규칙 2 완료 끝 화면은 지금 문장 그대로 |
| 환전 칸으로 | 단추를 누르면 초점이 `exchange-h` | — |
| 정상 종료 + 미지급(SF-1·F3) | 1일 28묶음 환전 뒤 빈 진행으로 끝난 상태(COMPLETED, 원화 미지급 있음): 막대가 ‘캠페인 종료’와 ‘종료 · 남은 미지급 있음’, 환전 칸 없음, 보고에 환전 권유 없음, 결산의 남은 미지급은 그대로 | 진행 중 상태에서는 지금 문장 그대로 |
| 실패 종료 화면(SF-3) | 아무것도 하지 않아 실패한 상태: 견적 카드·수량 고르기·환전 칸 없음, 시세표 다음 관측 ‘없음(캠페인 종료)’, 오늘 할 일 머리 ‘{failure.day}일 · 경영 실패’ | 규칙 2 완료 종료에서는 오늘 할 일 머리가 지금 문장 그대로 |
| 주선 견적 유효기간 | 실패한 날 유효기간이 끝난 주선 견적이 다음 화면에 없음(검수 문서의 원화 시작 자금 사본 재현) | 유효기간 안의 견적은 그대로 |

## 완료 조건

1. 지시 1~7 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0. 기본 `run` 400회 바이트 같음. 첫 화면 크기 보고.
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 면담 줄을 규칙 1에서도 그림 | 규칙 1 면담 칸 시험 |
| 2 | 면담 줄을 `view`로 읽음 | `state`로 읽음 시험(선복 계약 대기) |
| 3 | `lotsToSurvive === 0`일 때도 ‘최소 USD 0’ 문장을 씀 | 회복 행동 시험 |
| 4 | 실패 화면 제목을 `state.day`로 씀 | 실패 화면 시험 |
| 5 | 실패 화면을 `level === 'DANGER'`에서도 그림 | 실패 화면 반례 |
| 6 | 결산 고정비에 USD+KRW 합계 행을 넣음 | 결산 행 목록 전체 비교 |
| 7 | 결산·원화 보고에서 0인 행도 넣음(값≠0 조건 제거) | 규칙 1 결산·원화 보고 바이트 시험 |
| 8 | 실패 끝 알림을 `campaignDays`로 씀 | 실패 끝 흐름 시험 |
| 9 | 막대의 종료 분기를 뺌 | 정상 종료 + 미지급 시험 |
| 10 | 견적판의 종료 분기를 뺌 | 실패 종료 화면 시험 |
| 11 | 주선 루프의 유효기간 거름을 뺌 | 주선 견적 유효기간 시험 |

- ‘규칙 2일 때만’ 조건은 방어용이다. 규칙 1에는 환전·임차료·설치비가 없어 값이 늘 0이므로, 시험으로는 ‘값≠0’ 조건과 가를 수 없다.

4. 결과 보고 `docs/ai/tasks/results/TASK-0057.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 변형 표, 크기 증감, 범위 밖 발견, 질문을 적는다.
   - 세션 B가 Chromium으로 잴 항목: 실패 화면 초점 이동과 낭독, 경고 알림이 경영 보고 첫 화면 높이에 주는 영향(1024·1366px), 면담 칸 높이.

## 세션 A 확인 기록(쓸 때, 2026-10-13)

- 허브가 2026-10-13 10:17에 번호 0057을 줬다. 범위는 TASK-0034 적대 검토에서 나눈 후반부다.
- 엔진 값의 성질(`lotsToSurvive`가 대체로 0, `reasonKo`는 이유일 뿐, 실패 뒤 날이 하루 넘어감, 면담의 `view` 문제)은 0034 적대 검토 지적 4·6·7·9이며 코드로 확인했다.
- 원화 보고의 비용 행은 TASK-0033 검수(‘원화 장부 행이 임차료·환전을 표현하지 않음’)에서 넘어왔다.
- 적대 검토(에이전트 1개, 2026-10-13)의 지적 9건을 코드로 확인하고 모두 반영했다: 변형 7·2가 잡히지 않음, `skip-to` 허용 목록과 `exchange-h` 초점, 실패 끝 흐름의 ‘90일’ 문장, 미지급 행 이름과 항등식, 시험 상태(환전·투자가 든 완료 상태), 낭독 알림 장치, 면담 상태 만드는 법·배열·통화, 경고 화면의 날.
- 허브의 화면 적대 검수(`docs/ai/design/ui-review-0033/README.md`, 22건 중 21건 확정) 가운데 끝난 캠페인 화면 세 건(SF-1·SF-3·F3)을 지시 7로 넣었다. 0057이 실패 화면과 결산을 새로 만들기 때문에 같은 작업에서 고쳐야 충돌이 적다. 환전·접근성·시험 빈칸 항목(A11Y-1~5, F4·F5, GAP-2~6·8)은 따로 지시서를 쓴다.
- 0034 시험이 GAP-1(규칙 2 일정 수령액)과 GAP-7(막대가 view를 쓰는지)을 덮는지 확인했다. 0034의 ‘일정 수령액’ 시험과 ‘지급 상태 기준’ 시험이 각각 덮는다. 다만 급여 가능일 칸은 일부러 view 기준으로 남겼다.
