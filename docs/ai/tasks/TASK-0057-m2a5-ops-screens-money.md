# TASK-0057 M2a-5 화면 3: 고용 면담·지급 경고·경영 실패·결산과 원화 보고

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: TASK-0034 병합 기록 뒤 개발 브랜치 머리(이하 `<BASE>`). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
  - `<BASE>`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0057-m2a5-ops-screens-money.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 줄 번호는 개발 브랜치 `957e877` 기준이다. TASK-0034가 `main.ts`를 고치므로 `<BASE>`에서는 달라진다. **이름으로 찾고**, 달라진 줄을 결과 보고에 적는다.
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
  - ‘작업 포함 주선 1건 기여이익 {contributionPerJobMinor}’.
  - ‘다음 주 받을 수 있는 작업 포함 주선: 지금 {usableBefore}건 → 고용 뒤 {usableAfter}건(가장 좁은 곳: {binding.after 이름})’. 이름은 0034 병목 표의 행 이름과 같은 말을 쓴다(공통 함수로 둔다).
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
- ‘환전 칸으로’ 단추를 둔다. 기존 `skip-to` 동작(`main.ts:1231`)으로 환전 칸 제목에 초점을 옮긴다.
- 화면 낭독기 알림은 기존 `liveRegionText`(`src/ui/session.ts:73`) 흐름을 쓴다. 단계가 바뀐 날에만 한 번 알린다(같은 단계를 매일 되풀이하지 않는다).

### 3. 경영 실패 화면(명세 16-7, D04 가)

- `state.operations.outcome === 'FAILED'`일 때만 보인다. 경영 보고에서 결산 위에 둔다. 제목은 ‘{failure.day}일 경영 실패’, `tabindex="-1"`이다. 실패한 날 하루 진행 뒤 초점은 이 제목으로 간다.
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
  - 결과 한 줄: ‘완료’ / ‘경영 실패({failure.day}일)’ / ‘진행 중’.
  - 통화별 고정비 표(`fixedCostsByCurrency`): 임차료·확장 설치비·선복 요금·환전 차감. 0인 행은 쓰지 않는다. 통화 합계는 없다.
  - 결산 표(`settlementRows`)에 ‘통화 간 이체(환전)’ 행(`currencyTransferNet`): **규칙 2이고 값이 0이 아닐 때만**. 그래야 규칙 1 결산이 바이트로 같다.
  - 환전 기록(`exchanges`): 일·방향·USD·KRW·차감. 많으면 `details`로 접는다.
- 끝 미지급은 기존 줄을 그대로 쓴다.

### 5. 원화 보고 표(`krwReportRows`, `src/ui/reports.ts:11`)

- 규칙 2일 때 행을 더한다: ‘창고 임차료’(`rentExpense`), ‘창고 확장 설치비’(`facilitySetupExpense`), ‘환전 차감’(`fxSpreadExpense`), ‘통화 간 이체(환전)’(`currencyTransferNet`). 0인 행은 쓰지 않는다.
- 규칙 1의 행 목록과 순서는 바이트로 같다.
- 이 표만 보고도 ‘시작 운영 자금 − 비용 + 이체 = 현금 + … ’이 맞는지 확인하는 시험을 둔다. 엔진의 항등식(`operations-invariants.ts`의 통화별 순자산 항등식)과 같은 값이어야 한다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/recruitment.ts`, `src/ui/reports.ts`, 새 `src/ui/money-alerts.ts`(쓸 때), `src/ui/warehouse.ts`(지시 1의 제약 이름 공통 함수만), `src/ui/style.css`.
- 새 시험 `src/ui/m2a5-money-ui.test.ts`. 기존 UI 시험은 규칙 2 기대 문자열 줄만 고친다.
- `docs/ai/tasks/results/TASK-0057.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`, `data/**`, `schemas/**`, `tools/**`, `src/ui/culture.ts`, `src/ui/session.ts`.

## 지켜야 할 것

- 규칙 1 불변(TASK-0033 기준 문자열 세 개 sha256, 면담 칸·결산·원화 보고 바이트 같음). 통화 분리. 결정성(기본 `run` 400회 바이트 같음). 시험 소스에 자료 ID·조정값 상수 금지(TASK-0027 R1). 색만으로 상태를 구분하지 않음. 새 단추 키보드 사용.
- **크기:** 첫 화면 gzip이 `<BASE>`보다 6,000 B 넘게 늘거나 한도 140,000 B까지 3,000 B 안으로 들어오면 멈추고 질문에 적는다.

## 시험(`src/ui/m2a5-money-ui.test.ts`)

상태는 실제 실행으로 만든다. 상태 사본의 칸을 고치지 않는다.

- **미지급·실패 상태 만드는 법:** 규칙 2 시나리오를 환전 없이 진행한다(명령 없이 `runDays`). 원화가 모자라 급여가 밀리고, 경고 → 위험 → 실패로 간다(적대 검토 확인: 57일 첫 미지급 → 71일 실패). 날짜는 고정하지 말고 `paymentDefaultStatus`·`failure`에서 읽는다. 방법을 주석으로 적는다.

| 시험 | 나와야 함 | 반례 |
|---|---|---|
| 면담 줄 | 규칙 2 후보의 네 줄이 `hiringOutlook(state)` 값과 같음 | 규칙 1 면담 칸 바이트 같음 |
| 대기 중 고용 | — | 고용을 대기열에 넣은 화면에는 네 줄 없음(0 값이 나오지 않음) |
| ‘더 받을 수 없음’ | `extraJobsPerWeek === 0`인 상태 | 0보다 큰 상태(투자 뒤 등)에는 없음 |
| 경고 알림 | 첫 미지급 날 `WARNING` 알림, 원인·마감 문장 | 미지급 없는 날 알림 없음 |
| 회복 행동 | `lotsToSurvive === 0`이면 ‘오늘 마감에는 실패하지 않습니다’, `lotsToClearAll` 금액 = 값 × `lotUsdMinor` | 실패 당일 마감 전 상태에서는 최소 금액 문장 |
| 위험 알림 | `DANGER` 단계 이름 | — |
| 실패 화면 | 실제 실패 상태: 제목의 날 = `failure.day`, 원인 문장, 통화별 줄(합계 없음), 두 목록 | 완료·진행 중·`DANGER` 상태에는 없음 |
| 결산 고정비·이체 | 규칙 2 끝 상태의 행 목록 전체 비교 | 0인 행 없음, 규칙 1 결산 바이트 같음 |
| 원화 보고 | 규칙 2 행 목록 전체 비교, 항등식 | 규칙 1 행 목록 바이트 같음 |

## 완료 조건

1. 지시 1~5 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0. 기본 `run` 400회 바이트 같음. 첫 화면 크기 보고.
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 면담 줄을 규칙 1에서도 그림 | 규칙 1 면담 칸 시험 |
| 2 | 면담 줄을 `view`로 읽음 | 대기 중 고용 반례 |
| 3 | `lotsToSurvive === 0`일 때도 ‘최소 USD 0’ 문장을 씀 | 회복 행동 시험 |
| 4 | 실패 화면 제목을 `state.day`로 씀 | 실패 화면 시험 |
| 5 | 실패 화면을 `level === 'DANGER'`에서도 그림 | 실패 화면 반례 |
| 6 | 결산 고정비에 USD+KRW 합계 행을 넣음 | 결산 행 목록 전체 비교 |
| 7 | `currencyTransferNet` 행을 규칙 1에서도 넣음 | 규칙 1 결산 바이트 시험 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0057.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 변형 표, 크기 증감, 범위 밖 발견, 질문을 적는다.
   - 세션 B가 Chromium으로 잴 항목: 실패 화면 초점 이동과 낭독, 경고 알림이 경영 보고 첫 화면 높이에 주는 영향(1024·1366px), 면담 칸 높이.

## 세션 A 확인 기록(쓸 때, 2026-10-13)

- 허브가 2026-10-13 10:17에 번호 0057을 줬다. 범위는 TASK-0034 적대 검토에서 나눈 후반부다.
- 엔진 값의 성질(`lotsToSurvive`가 대체로 0, `reasonKo`는 이유일 뿐, 실패 뒤 날이 하루 넘어감, 면담의 `view` 문제)은 0034 적대 검토 지적 4·6·7·9이며 코드로 확인했다.
- 원화 보고의 비용 행은 TASK-0033 검수(‘원화 장부 행이 임차료·환전을 표현하지 않음’)에서 넘어왔다.
- 허브의 화면 적대 검수 결과(진행 중) 가운데 이 범위 항목은 받는 대로 더한다.
