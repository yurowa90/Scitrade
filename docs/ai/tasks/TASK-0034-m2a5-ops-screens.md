# TASK-0034 M2a-5 화면 2: 본사·창고 표·주간 병목 표·투자 명령·고용 면담·지급 경고·경영 실패·결산

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: TASK-0056 병합 기록 뒤 개발 브랜치 머리(이하 `<BASE>`). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
  - `<BASE>`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0034-m2a5-ops-screens.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 아래 줄 번호는 개발 브랜치 `b4a851b`(TASK-0033 병합 기록) 기준이다. 0054·0056은 `src/ui/**`를 고치지 않으므로 `<BASE>`에서도 같아야 한다. 다르면 이름으로 찾고 결과 보고에 적는다.
- 결정 근거:
  - `docs/ai/design/M2A5-SPEC.md` 16절 3·5·6·7·8·10·11. 엔진 쪽 근거는 8절(창고), 9절(선복 계약), 11절(지급 불이행·실패), 14.5·14.6(읽기 함수)이다.
  - `docs/DECISIONS.md`의 Q12 가(주간 병목 표), D04 가(경영 실패), ‘M2a-5 준비 예측 차단 정의와 J6 비교 대상 유지’(1464행: ‘확장 예정’ 근거 문장 후보).
  - TASK-0031(+R1)의 병목 표 정의(묶음 0 제외, 보관 칸 최고 점유).
  - `docs/CLASSIC_GAME_INSIGHTS.md` CL-03(업무량 대 처리량).
- 먼저 읽을 것: `docs/ai/tasks/results/TASK-0033.md`의 ‘범위 밖 발견’과 각 검수 절. 이번에 다루는 남은 항목이 거기에 있다.

## 목표

규칙 2 시나리오에서 학생이 **왜 막혔는지, 무엇에 투자하면 풀리는지, 언제 망하는지**를 화면에서 읽게 한다.

- 화면은 엔진 읽기 함수의 값을 그대로 보인다. 화면에서 다시 계산하지 않는다.
- 규칙 1 화면은 바뀌지 않는다(바이트 비교).

## 엔진이 주는 값(고치지 않는다, 읽기만)

| 함수·칸 | 위치 | 쓰는 곳 |
|---|---|---|
| `warehouseSummary(s, config)` → `demand`·`staff`·`handling`·`storage`·`sailings`·`prepDaysToClear` | `src/engine/readers.ts:213` | 지시 1 |
| `weeklyBottleneck(s, config, candidateId?)` → `rows`·`binding`·`storageDetail`·`usableBefore/After`·`extraJobsPerWeek`·`otherPtPerWeek`·`demand` | `readers.ts:122-203` | 지시 2·4 |
| `hiringOutlook(s, config, candidateId)` → `wageKrwPerDay`·`wageUsdLotsPerWeek`·`recentHandlingOfferedPt`·`recentHandlingAcceptedPt`·`bottleneck` | `readers.ts:205` | 지시 4 |
| `paymentDefaultStatus(s, config)` → `level`·`oldest`·`ageDays`·`dangerFromDay`·`failAtCloseOfDay`·`recovery{lotsToSurvive, lotsToClearAll, nextReceipt, krwToUsdRequiredMinor, heldSpendingKo}` | `src/engine/operations.ts:228` | 지시 5 |
| `state.operations.failure`(`FailureRecord`): `reasonKo`·`unpaidByCurrency`·`cashByCurrency`·`warningEvent`·`dangerEvent`·`optionalKrwSpendBeforeFirstUnpaid`·`usdCommitmentsSinceIncurred` | `src/engine/types.ts` | 지시 6 |
| `campaignSummary(...).operations` → `outcome`·`failure`·`arrearsAtEnd`·`exchanges`·`fixedCostsByCurrency` / `byCurrency[].rentExpense`·`facilitySetupExpense`·`spaceContractExpense`·`fxSpreadExpense`·`currencyTransferNet` | `src/engine/reports.ts:342-372` | 지시 7 |
| 명령 `EXPAND_WAREHOUSE`, `SIGN_SPACE_CONTRACT { routeId }`와 거절 문장 | `src/engine/types.ts:592-593`, `src/engine/operations.ts:185-210` | 지시 3 |

- 위 표에 없는 값이 문장에 필요하면 만들지 말고 ‘질문’에 적는다. 단, 설정값(`config.operations.*`)과 기존 공개 함수(`storageCapacityLiters`, `handlingCapacityPt`, `fundsPosition` 등)를 **상태에서 읽는 것**은 된다.

## 구현 지시

### 1. 본사·창고 글자 표(명세 16-3, 새 `src/ui/warehouse.ts`)

- 규칙 2에서만, 운영 지표(`operationsBlock`, `main.ts:807`) 안 ‘업무 부하’ 앞에 둔다. 제목은 ‘본사·창고’다.
- 다섯 줄을 **수요 → 직원 → 창고 처리 → 보관 → 선복** 순서로 쓴다(CL-03). 칸마다 `warehouseSummary`의 값을 쓴다.
  - 수요: 최근 묶음 공개일, 열린 견적의 준비 pt·부피, 최근 4묶음 견적 pt / 받은 pt.
  - 직원: 본사 하루 처리 pt, 오늘 남는 pt.
  - 창고 처리: 오늘 한도 pt, 계획 사용 pt, 대기 업무 수·대기 pt.
  - 보관: 사용 m³ / 한도 m³, 미배정 회사 화물 m³.
  - 선복: 다음 출항편마다 남은 자리(`sailings`의 값 그대로).
- 확장 효력일 당일(`expansions[0].effectiveDay === s.day`)에만 ‘한도가 {전} → {후} m³로 늘어 사용률이 내려갔습니다’를 쓴다. ‘전’은 `storageCapacityLiters(s, config, s.day - 1)`, ‘후’는 오늘 값이다.
- 확장을 주문했고 효력일이 아직 오지 않았으면 ‘{효력일}일부터 창고 한도가 {후} m³·처리 {후}pt로 늘어납니다(확장 예정)’를 쓴다. 값은 `storageCapacityLiters(s, config, effectiveDay)`, `handlingCapacityPt(s, config, effectiveDay)`에서 읽는다.

### 2. 주간 병목 표(Q12 가, `warehouse.ts`)

- 본사·창고 표 아래에 표 하나를 둔다. 캡션은 ‘다음 주에 받을 수 있는 작업 포함 주선(건/주) — 추정’이다.
- 행은 `rows` 순서 그대로 다섯 개(수요·직원·창고 처리·보관·선복)이고, 열은 ‘지금’(`before`)이다. 값이 null이면 ‘아직 묶음 없음’으로 쓴다.
- 묶이는 제약(`binding.before`)의 행에는 글로 ‘← 가장 좁음’을 붙인다. 색만으로 구분하지 않는다.
- 행 이름 아래 근거 문장:
  - 직원: ‘본사 직원 하루 {pt}pt, 다른 일에 주당 {otherPtPerWeek}pt’.
  - 보관(TASK-0031 R1): `storageDetail.windowDays > 0`이면 ‘지난 {windowDays}일 다른 화물이 창고를 가장 많이 쓴 날 {otherPeakLiters/1000} m³(평균 {otherOccupancyLiters/1000} m³), 작업 화물은 평균 {handlingDwellDays}일 머묾. 가장 많이 쓴 날 기준으로 계산합니다’.
  - `windowDays === 0`이면(1일) 그 문장 대신 ‘아직 쌓인 기록이 없어 기본값(머묾 {handlingDwellDays}일)으로 계산했습니다’.
  - 확장 예정이면 보관·창고 처리 행 근거에 ‘{효력일}일 확장 뒤 값은 아직 넣지 않았습니다’를 덧붙인다(DECISIONS 1464행).
- 표 아래에 한 문장을 둔다: ‘이 표는 지난 기록의 평균·최고를 다음 주에 그대로 놓은 추정입니다. 도착이 몰리면 실제로는 더 적게 처리합니다.’ 측정 정확도 수치는 화면에 쓰지 않는다.

### 3. 투자 명령(명세 12.2·12.3, `warehouse.ts`와 `main.ts`의 클릭 처리)

- 본사·창고 표 아래에 ‘투자’ 소제목과 두 칸을 둔다. 대기열에 넣는 방식은 기존 `queue`(`main.ts:186`)를 쓴다.
- **창고 확장 칸:**
  - 미리보기 값: 설치비(KRW, `facility.expansion.setupFeeMinor`), 효력일(오늘 + `effectiveAfterDays`), 보관·처리 한도 전 → 후, 임차료 증액(`rentIncreaseMinor`, 기간마다).
  - 단추: ‘창고 확장을 오늘 할 일에 넣기’.
  - 이미 확장했거나 대기열에 확장이 있으면 단추 대신 상태 글을 쓴다.
- **선복 장기 계약 칸:** `spaceContract.routeIds`마다 한 줄을 둔다.
  - 미리보기 값: 노선 이름, 편당 요금(USD), 편마다 늘어나는 자리(m³·kg), ‘쓰지 않아도 냄, 해지 없음’.
  - 단추: ‘선복 계약을 오늘 할 일에 넣기’.
  - 이미 맺은 노선은 ‘{첫 편}일 편부터 {끝 편}일 편까지 {편수}편 계약됨’으로 쓴다.
- 미리보기의 ‘후’ 값과 합계 요금은 **계획 상태**(`planState(view, config, [...대기열, 명령])`)에서 읽는다. 계획이 거절되면 단추는 남기고, 엔진 거절 문장(`results[].reasonKo`)을 그대로 보인다.
- 대기열 표시(`commandLabel`, `main.ts:909`)에 두 명령의 이름을 더한다: ‘창고 확장’, ‘선복 계약 {노선}’.

### 4. 고용 면담 칸(명세 16-8, `src/ui/recruitment.ts`의 `interviewBlock`)

- 규칙 2(`config.operations`)에서만 기존 면담 칸 `dl` 끝에 줄을 더한다. 규칙 1 면담 칸은 바이트로 같아야 한다.
- 더할 줄:
  - ‘이 직원 하루 일급 {wageKrwPerDay} — 일주일이면 USD 약 {wageUsdLotsPerWeek × 100} 환전’.
  - ‘최근 4묶음 작업 견적 {recentHandlingOfferedPt}pt / 받은 {recentHandlingAcceptedPt}pt’.
  - ‘작업 포함 주선 1건 기여이익 {bottleneck.contributionPerJobMinor}’.
  - ‘다음 주 받을 수 있는 작업 포함 주선: 지금 {usableBefore}건 → 고용 뒤 {usableAfter}건(가장 좁은 곳: {binding.after 이름})’.
- `extraJobsPerWeek === 0`이면 한 줄을 더 쓴다: ‘이 직원을 뽑아도 {binding.after 이름}에 막혀 더 받을 수 없습니다’.
- 명세 16-8의 ‘직원 부족으로 못 받은 {pt}’는 쓰지 않는다. TASK-0028 지시 5에서 엔진이 이 값을 알 수 없다고 정했다.
- 면담 칸 호출은 지금 `recruitmentPanel(view, …)`(`main.ts:898`)다. 계획 상태 `view`로 읽는 것을 유지한다.

### 5. 지급 경고·위험 알림(명세 16-6)

- 규칙 2에서 `paymentDefaultStatus(view, config).level`이 `WARNING`·`DANGER`이면 보고 화면 맨 위(`reportPanel`, `main.ts:828`)에 알림 칸을 둔다. 위험은 `role="alert"`가 아니라 기존 알림 방식을 따른다(`liveRegionText`).
- 알림 칸에 보일 것:
  - 원인: 통화·이유·금액·발생일(`oldest`).
  - 나이 {ageDays}일, 위험 시작일 {dangerFromDay}일, 실패 마감 {failAtCloseOfDay}일 마감. 마감이 캠페인 끝보다 뒤면 ‘캠페인 끝까지 못 갚으면 미지급을 남기고 끝납니다’를 쓴다.
  - 회복 행동: ‘오늘 실패를 피하려면 USD {lotsToSurvive×100}’, ‘밀린 원화를 모두 갚으려면 USD {lotsToClearAll×100}’. 값이 null이면(USD 미지급이 가장 오래됨) 다음 수금일·금액과 `krwToUsdRequiredMinor`를 쓴다.
  - 보류할 지출: `heldSpendingKo`.
- 현실 문구 ‘실제로는 임금을 정한 날 지급해야 하며 하루 늦어도 체불입니다’를 넣는다. 조문 번호는 넣지 않는다.
- 환전 칸으로 가는 링크 단추(‘환전 칸으로’)를 둔다. 기존 `skip-to` 동작을 쓴다.

### 6. 경영 실패 화면(명세 16-7, D04 가)

- `state.operations.outcome === 'FAILED'`일 때만 보인다. 끝난 화면에서 결산 위에 둔다. 제목은 ‘{day}일 경영 실패’, `tabindex="-1"`이다.
- 보일 것:
  - 원인 문장: `failure.reasonKo`.
  - 통화별 미지급과 현금: 통화마다 따로 쓰고 합계를 쓰지 않는다.
  - 경고·위험 당시 상태: 필요한 환전 묶음(`lotsToSurvive`·`lotsToClearAll`)과 그때 쓸 수 있던 USD(`usdAvailableMinor`).
  - 첫 미지급 전 14일 원화 선택 지출 목록. 없으면 ‘없음’.
  - 미지급 뒤 새로 묶은 USD 약정 목록(계약·선복 계약). 없으면 ‘없음’.
- 단추 두 개:
  - ‘같은 시드로 다시 하기’: 기존 `restart` 동작(`main.ts:1361`), 확인 창 포함.
  - ‘결산 보기’: `skip-to` → `settlement-h`.

### 7. 결산과 원화 보고(명세 16-10)

- 결산(`settlementBlock`, `main.ts:814`)에서 규칙 2일 때 더할 것:
  - 결과: ‘완료’ / ‘경영 실패({day}일, {reasonKo})’ / ‘진행 중’(`outcome`).
  - 통화별 고정비 표: 임차료·확장 설치비·선복 요금·환전 차감(0인 행은 쓰지 않음).
  - ‘통화 간 이체(환전)’ 행(`currencyTransferNet`): 통화마다 결산 표 안에 둔다.
  - 환전 기록 목록(`exchanges`): 일·방향·USD·KRW·차감.
- 원화 보고 표(`krwReportRows`, `src/ui/reports.ts:11`)에서 규칙 2일 때 더할 행: 임차료·확장 설치비·환전 차감·통화 간 이체(환전). 값은 `summarize`가 주는 `BookSummary` 칸에서 읽는다. 규칙 1의 행 목록은 그대로 둔다.
- `settlementRows`(`reports.ts:136`)는 규칙 1 결산 표가 바이트로 같도록, 새 행을 **규칙 2이고 값이 0이 아닐 때만** 넣는다.

### 8. 막힘 분류에 ‘창고’(명세 16-11)

- 엔진에는 창고 막힘 코드가 없다(`src/engine/progress.ts:23` `BlockerCode`). 엔진은 고치지 않는다.
- `BottleneckKind`에 ‘창고’를 더한다. `bottlenecks()`(`reports.ts:111`)는 규칙 2일 때 `warehouseSummary`에서 두 종류 항목을 만든다.
  - `handling.waits`의 업무마다 한 줄: ‘{계약} 준비 업무가 창고 처리 한도에 걸려 오늘 {gotPt}/{wantPt}pt만 진행합니다’.
  - 보관 사용량이 한도의 90% 이상이면 한 줄: ‘창고 보관 {사용}/{한도} m³ — 새 화물을 받기 어렵습니다’.
- 규칙 1에서는 ‘창고’ 행이 나오지 않는다. `BOTTLENECK_OF`의 기존 값과 규칙 1 막힘 목록은 그대로다.
- ‘사람을 더 뽑아도 … 풀리지 않습니다’ 문장(`main.ts:811`)의 개수에 ‘창고’를 넣는다.

### 9. 빈 계약 상태의 안내와 TASK-0033 정리

- **만료 문구**(`main.ts:715`): 규칙 2에서 계약이 없고 견적이 만료되면, ‘처음부터’ 대신 ‘다음 견적 묶음은 {다음 공개일}일에 나옵니다’를 쓴다. 공개일은 `config.operations.market.publish`에서 오늘보다 뒤인 첫 날이다. 남은 공개가 없을 때만 기존 문장을 쓴다. 규칙 1은 그대로다.
- **`tradeUiState()` 정리**(`main.ts:50-53`): `session.ts`의 `initialUiState`가 `exchangeLots: 1`을 직접 갖게 하고 `exchangeUsdMinor`를 없앤다. `main.ts`의 우회 함수를 지운다. 저장 파일에는 UI 상태가 없으므로 이관은 필요 없다. 이 점을 결과 보고에 적는다.
- **`exchangeSelection` 정리**: 한 번 그릴 때 한 번만 계산한다. `render`(`main.ts:1081`)의 결과를 `exchangeBlock`에 넘긴다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/recruitment.ts`, `src/ui/reports.ts`, `src/ui/session.ts`(지시 9의 초기 상태만), 새 `src/ui/warehouse.ts`, `src/ui/market.ts`(지시 9의 `exchangeSelection` 인자만), `src/ui/style.css`.
- 새 시험 `src/ui/m2a5-ops-ui.test.ts`. 기존 UI 시험은 규칙 2 기대 문자열 줄만 고친다. 규칙 1 기준 문자열은 고치지 않는다.
- `docs/ai/tasks/results/TASK-0034.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`, `data/**`, `schemas/**`, `tools/**`, `src/ui/culture.ts`.

## 지켜야 할 것

- **규칙 1 불변:** TASK-0033의 규칙 1 기준 문자열 세 개(sha256)가 그대로 통과한다. 면담 칸·결산·원화 보고·막힘 목록도 규칙 1에서는 바이트로 같다.
- **통화 분리:** 금액마다 통화를 붙이고 통화끼리 더하지 않는다.
- **시험 자료:** 시험 소스에 자료 ID와 조정값 상수를 쓰지 않는다(TASK-0027 R1). 날짜가 필요하면 무엇의 날인지 주석으로 적는다.
- **결정성:** 기본 `run` 400회가 바이트로 같다.
- 색만으로 상태를 구분하지 않는다(UI_SPEC:50). 새 단추는 키보드로 쓸 수 있고 두 번 누름에 대기열이 두 번 늘지 않는다(TASK-0024).
- **크기:** 첫 화면 gzip이 `<BASE>`보다 **8,000 B 넘게 늘면** 멈추고 질문에 적는다. 이때 새 `warehouse.ts`를 동적 불러오기로 나눌지는 세션 A가 정한다. 한도 140,000 B까지는 약 15 KB 남아 있다.

## 시험(`src/ui/m2a5-ops-ui.test.ts`)

문장마다 **나와야 하는 상태**와 **나오면 안 되는 반례**를 하나씩 둔다. 상태는 정책 실행이나 명령으로 실제로 만든다. 상태 사본의 칸만 고쳐 만들지 않는다.

| 시험 | 나와야 함 | 반례 |
|---|---|---|
| 본사·창고 줄 순서 | 다섯 줄이 CL-03 순서 | 규칙 1에 표 없음 |
| 확장 효력일 문장 | 효력일 당일 | 효력일 전날·다음날 |
| 확장 예정 문장 | 주문 뒤 효력일 전 | 주문 전, 효력일 뒤 |
| 병목 표 값 | 행 값·순서가 `weeklyBottleneck(view, config).rows`와 같음(전체 비교) | — |
| 보관 근거 | `windowDays > 0`이면 최고·평균·머묾 문장 | 1일에는 기본값 문장 |
| 가장 좁음 표시 | `binding.before`의 행에만 | 다른 행에는 없음 |
| 투자 미리보기 | 계획 상태에서 읽은 ‘후’ 한도 | 거절되는 상태(예: 원화 부족)에서 엔진 문장 그대로 |
| 투자 대기열 | 단추를 두 번 눌러도 명령 하나 | 이미 확장한 뒤에는 단추 없음 |
| 면담 줄 | 규칙 2 후보의 네 줄이 `hiringOutlook` 값과 같음 | 규칙 1 면담 칸이 기준과 같음 |
| 면담 ‘더 받을 수 없음’ | `extraJobsPerWeek === 0`인 상태 | 0보다 큰 상태 |
| 지급 알림 | `WARNING`·`DANGER` 상태(실제 미지급을 만들어서) | `NONE`이면 알림 없음 |
| 실패 화면 | `outcome === 'FAILED'`인 실제 실패 상태 | 완료·진행 중에는 없음 |
| 결산 고정비·이체 행 | 규칙 2 끝 상태 | 0인 행은 없음, 규칙 1 결산 바이트 같음 |
| 창고 막힘 | 처리 한도 대기가 있는 상태 | 규칙 1에 ‘창고’ 행 없음 |
| 만료 문구 | 규칙 2 빈 계약 상태에서 다음 공개일 | 남은 공개가 없으면 기존 문장 |

- 실패 상태를 만드는 방법(원화 부족이 생기도록 환전하지 않는 정책 실행 등)을 주석으로 적는다. 날짜는 `paymentDefaultStatus`·설정에서 읽는다.

## 완료 조건

1. 지시 1~9 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0. 기본 `run` 400회가 바이트로 같다. 첫 화면 크기를 보고한다.
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 본사·창고 줄 순서에서 보관과 선복을 바꿈 | 줄 순서 시험 |
| 2 | 보관 근거에 평균(`otherOccupancyLiters`)만 쓰고 최고를 뺌 | 보관 근거 시험 |
| 3 | 확장 효력일 문장을 효력일 이후에도 씀 | 효력일 반례 |
| 4 | 투자 미리보기의 ‘후’ 한도를 현재 상태에서 읽음 | 투자 미리보기 시험 |
| 5 | 면담 줄을 규칙 1에서도 그림 | 규칙 1 면담 칸 기준 시험 |
| 6 | 실패 화면을 `level === 'DANGER'`에서도 그림 | 실패 화면 반례 |
| 7 | 결산에서 USD와 KRW 고정비를 더한 합계 행을 넣음 | 결산 고정비 시험(합계 행 없음) |

4. 결과 보고 `docs/ai/tasks/results/TASK-0034.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 변형 표, 크기 증감, 범위 밖 발견, 질문을 적는다.
   - 세션 B가 Chromium으로 잴 항목도 적는다: 운영 지표의 1·8·15·30일 화면 높이, 병목 표가 390px에서 넘치는지, 투자 단추의 Tab 순서, 실패 화면의 초점 이동.

## 세션 A 확인 기록(확정 때, 2026-10-13)

- 줄 번호는 개발 브랜치 `b4a851b` 기준이다. `operationsBlock` 807, `settlementBlock` 814, `reportPanel` 828, `recruitmentPanel` 호출 898, `commandLabel` 909, 만료 문구 715, `tradeUiState` 50, `render` 안 `exchangeSelection` 1081, `restart` 1361.
- `weeklyBottleneck`의 `storageDetail`은 TASK-0031 R1의 정의다(묶음 0 제외, 28일 창, 최고 점유). 표본 밖 J6는 87.1%였다. 이 수치는 화면에 쓰지 않는다.
- 엔진에는 창고 막힘 코드와 투자 미리보기 함수가 없다. 그래서 지시 3은 계획 상태에서 읽고, 지시 8은 `warehouseSummary`에서 만든다. 엔진을 고치지 않는다.
- 초안에서 바뀐 점:
  - 일정의 임차료·선복 요금 행(명세 16-9)은 TASK-0033에서 이미 들어갔다(`main.ts:791`). 이번 범위에서 뺀다.
  - 원화 보고 주석 문구(명세 16-10 끝)도 이미 바뀌었다(`reports.ts:26`).
  - TASK-0033 검수에서 넘어온 세 항목(원화 장부 행, 빈 계약 만료 문구, `tradeUiState`·`exchangeSelection` 정리)을 지시 7·9에 넣었다.
