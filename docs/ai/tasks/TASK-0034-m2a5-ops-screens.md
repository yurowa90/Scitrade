# TASK-0034 M2a-5 화면 2: 본사·창고 표·주간 병목 표·투자 명령·창고 막힘

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: 개발 브랜치 `cf034bb`(TASK-0056·PR #23 병합 뒤, 이하 `cf034bb`). 기준 비교(`review_checks.sh`)는 `cf034bb`로 한다.
  - `cf034bb`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0034-m2a5-ops-screens.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 줄 번호는 개발 브랜치 `b4a851b`(TASK-0033 병합 기록) 기준이다. 0054·0056은 `src/ui/**`를 고치지 않으므로 `cf034bb`에서도 같아야 한다. 다르면 이름으로 찾고 결과 보고에 적는다.
- 결정 근거:
  - `docs/ai/design/M2A5-SPEC.md` 16절 3·11, 8절(창고), 9절(선복 계약), 14.5·14.6(읽기 함수).
  - `docs/DECISIONS.md`의 Q12 가(주간 병목 표)와 1464행(‘확장 예정’ 근거 문장 후보).
  - TASK-0031(+R1)의 병목 표 정의(묶음 0 제외, 보관 칸 최고 점유).
  - `docs/CLASSIC_GAME_INSIGHTS.md` CL-03(업무량 대 처리량).
- 먼저 읽을 것: `docs/ai/tasks/results/TASK-0033.md`의 ‘범위 밖 발견’과 각 검수 절.
- **범위 나눔(적대 검토 뒤 결정):** 화면 2는 두 작업으로 나눈다.
  - 이 지시서: 창고·병목·투자·창고 막힘과 TASK-0033 정리.
  - 고용 면담·지급 경고·경영 실패·결산·원화 보고: TASK-0057로 넘긴다.

## 목표

규칙 2 시나리오에서 학생이 **어디가 가장 좁은지, 무엇에 투자하면 넓어지는지**를 화면에서 읽게 한다.

- 화면은 엔진 읽기 함수의 값을 그대로 보인다. 화면에서 다시 계산하지 않는다.
- 규칙 1 화면은 바뀌지 않는다(바이트 비교).

## 읽는 상태: `state`와 `view`

- `state`는 확정 상태, `view`는 대기열을 반영한 계획 상태다(`main.ts:47-49`, `render`의 `main.ts:1080`).
- **이 지시서의 새 화면(본사·창고 표, 병목 표, 투자 칸)은 `view`로 읽는다.** 학생이 확장이나 선복 계약을 대기열에 넣으면 그 결과가 바로 보여야 하기 때문이다.
- 운영 지표 안의 기존 내용(업무 부하·막힌 곳)은 지금처럼 `state`를 읽는다.
- 확장 효력은 주문 다음 날이다(`data/scenarios.json`의 `effective_after_days`가 1). 그리고 하루를 마감하면 `s.day`가 하루 늘어난다(`src/engine/engine.ts:866`). 그래서 확정 상태에서는 ‘확장했지만 아직 효력 전’인 날이 없다. ‘확장 예정’은 **확장이 대기열에 있을 때**(`view`)만 나오는 문장이다.

## 엔진이 주는 값(고치지 않는다, 읽기만)

| 함수·칸 | 위치 | 쓰는 곳 |
|---|---|---|
| `warehouseSummary(s, config)` → `demand`·`staff`·`handling`·`storage`·`sailings`·`prepDaysToClear` | `src/engine/readers.ts:213` | 지시 1·4 |
| `weeklyBottleneck(s, config)` → `rows`·`binding`·`storageDetail`·`otherPtPerWeek`·`demand` | `readers.ts:122-203` | 지시 2 |
| `storageCapacityLiters(s, config, day)`, `handlingCapacityPt(s, config, day)` | `src/engine/operations.ts:19`, `:23` | 지시 1·3 |
| 명령 `EXPAND_WAREHOUSE`, `SIGN_SPACE_CONTRACT { routeId }`와 거절 문장 | `src/engine/types.ts:592-593`, `operations.ts:185-210` | 지시 3 |

- 위 표에 없는 값이 문장에 필요하면 만들지 말고 ‘질문’에 적는다. 설정값(`config.operations.*`)을 읽는 것은 된다.
- 엔진에는 창고 막힘 코드(`src/engine/progress.ts:23`)도, 투자 미리보기 함수도 없다. 엔진은 고치지 않는다.

## 구현 지시

### 1. 본사·창고 글자 표(명세 16-3, 새 `src/ui/warehouse.ts`)

- 규칙 2에서만 둔다. 자리는 운영 지표(`operationsBlock`, `main.ts:807`) 안, ‘업무 부하’ 앞이다. 제목은 ‘본사·창고’, 값은 `warehouseSummary(view, config)`다.
- 다섯 줄을 **수요 → 직원 → 창고 처리 → 보관 → 선복** 순서로 쓴다(CL-03).
  - 수요: 최근 묶음 공개일, 열린 견적의 준비 pt·부피, 최근 4묶음 견적 pt / 받은 pt.
  - 직원: 본사 하루 처리 pt, 오늘 남는 pt.
  - 창고 처리: 오늘 한도 pt, 계획 사용 pt, 대기 업무 수·대기 pt.
  - 보관: 사용 m³ / 한도 m³, 미배정 회사 화물 m³.
  - 선복: 다음 출항편마다 남은 자리(`sailings`의 값 그대로).
- 확정 상태에서 오늘이 확장 효력일이면(`state.operations.expansions[0]?.effectiveDay === state.day`) ‘한도가 {전} → {후} m³로 늘어 사용률이 내려갔습니다’를 쓴다.
  - 전 = `storageCapacityLiters(state, config, state.day - 1)`, 후 = `storageCapacityLiters(state, config, state.day)`.
- 확장이 대기열에 있으면(`view`에는 확장이 있고 `state`에는 없음) ‘{효력일}일부터 창고 한도가 {후} m³·처리 {후}pt로 늘어납니다(확장 예정)’를 쓴다.
  - 후 = `storageCapacityLiters(view, config, effectiveDay)`, `handlingCapacityPt(view, config, effectiveDay)`.

### 2. 주간 병목 표(Q12 가, `warehouse.ts`)

- 본사·창고 표 아래에 표 하나를 둔다. 캡션은 ‘다음 주에 받을 수 있는 작업 포함 주선(건/주) — 추정’이고, 값은 `weeklyBottleneck(view, config)`다.
- 행은 `rows` 순서 그대로 다섯 개(수요·직원·창고 처리·보관·선복)다. 열은 ‘지금’(`before`) 하나다. 값이 null이면 ‘아직 묶음 없음’으로 쓴다.
- 묶이는 제약(`binding.before`)의 행에는 글로 ‘← 가장 좁음’을 붙인다. 색만으로 구분하지 않는다.
- 행 근거 문장:
  - 직원: ‘다른 일에 주당 {otherPtPerWeek}pt’.
  - 보관(TASK-0031 R1): `storageDetail.windowDays > 0`이면 ‘지난 {windowDays}일 다른 화물이 창고를 가장 많이 쓴 날 {otherPeakLiters/1000} m³(평균 {otherOccupancyLiters/1000} m³), 작업 화물은 평균 {handlingDwellDays}일 머묾. 가장 많이 쓴 날 기준으로 계산합니다’.
  - `windowDays === 0`이면(1일) 위 문장 대신 ‘아직 쌓인 기록이 없어 기본값(머묾 {handlingDwellDays}일)으로 계산했습니다’.
  - 확장이 대기열에 있으면 보관·창고 처리 행 근거에 ‘{효력일}일 확장 뒤 한도는 아직 넣지 않았습니다’를 덧붙인다(DECISIONS 1464행). `weeklyBottleneck`은 오늘 한도로 계산하기 때문이다.
- 표 아래 한 문장: ‘이 표는 지난 기록의 평균·최고를 다음 주에 그대로 놓은 추정입니다. 도착이 몰리면 실제로는 더 적게 처리합니다.’ 측정 정확도 수치는 화면에 쓰지 않는다.

### 3. 투자 명령(명세 12.2·12.3, `warehouse.ts`, `main.ts`, `session.ts`)

- 본사·창고 표 아래에 ‘투자’ 소제목과 두 칸을 둔다.
- **대기열 타입:**
  - `session.ts:8`의 `UiCommand`에 `EXPAND_WAREHOUSE`·`SIGN_SPACE_CONTRACT`를 더한다.
  - 엔진 `Command[]`로 넘기는 거르기(`main.ts:898`, `1101`의 `p.type !== 'EXCHANGE_CURRENCY'`)는 운영 명령 세 종류를 모두 뺀다. 공통 거르기 함수 하나로 묶어도 된다.
  - 대기열에 넣는 방식은 기존 `queue`(`main.ts:186`)를 쓴다. 엔진은 두 번째 확장·같은 노선의 두 번째 계약을 거절하므로, 두 번 눌러도 대기열에는 하나만 남아야 한다.
- **미리보기:**
  - 계획 = `planState(state, config, [...ui.pending, 명령])`. 기존 `tryCommand`(`main.ts:182`)와 같은 방식이다. `view`에 다시 대기열을 보내지 않는다(중복 거절이 된다).
  - 계획이 거절되면 단추는 남기고, 엔진 거절 문장(`results.at(-1).reasonKo`)을 그대로 보인다.
- **창고 확장 칸:**
  - 설치비: KRW, `facility.expansion.setupFeeMinor`.
  - 효력일: 오늘 + `effectiveAfterDays`.
  - 보관·처리 한도 전 → 후. 전 = `storageCapacityLiters(view, config, effectiveDay)`, 후 = `storageCapacityLiters(계획.state, config, effectiveDay)`. 처리 한도도 같은 방식이다. **효력일로 읽는다.** 오늘 날짜로 읽으면 전과 후가 같다.
  - 임차료 증액: `rentIncreaseMinor`, 기간마다.
  - 단추: ‘창고 확장을 오늘 할 일에 넣기’.
  - `view`에 이미 확장이 있으면(확정이든 대기든) 단추 대신 상태 글을 쓴다.
- **선복 장기 계약 칸:** `spaceContract.routeIds`마다 한 줄이다.
  - 노선 이름, 편당 요금(USD), 편마다 늘어나는 자리(m³·kg), ‘쓰지 않아도 냄, 해지 없음’.
  - 계약 편수·첫 편·끝 편은 계획 상태의 `operations.spaceContracts`에서 읽는다.
  - 단추: ‘선복 계약을 오늘 할 일에 넣기’.
  - 이미 계약한 노선은 ‘{첫 편}일 편부터 {끝 편}일 편까지 {편수}편 계약됨’으로 쓴다.
- 대기열 표시(`commandLabel`, `main.ts:909`)에 두 명령의 이름을 더한다: ‘창고 확장’, ‘선복 계약 {노선}’.

### 4. 막힘 분류에 ‘창고’(명세 16-11)

- **규칙 2에서만** 바꾼다. 규칙 1의 막힘 목록·순서·문구는 바이트로 같아야 한다. `bottlenecks()`(`src/ui/reports.ts:111`)는 고정 목록을 모두 그리고, 빈 종류는 ‘없음’으로 쓰기 때문이다.
- `BottleneckKind`에 ‘창고’를 더한다. `config.operations`가 있을 때만 그 묶음을 목록에 넣는다.
- 항목은 `warehouseSummary(state, config)`에서 만든다.
  - `handling.waits`의 업무마다: ‘{계약} 준비 업무가 창고 처리 한도에 걸려 오늘 {gotPt}/{wantPt}pt만 진행합니다’.
  - 보관 사용량이 한도의 90% 이상이면: ‘창고 보관 {사용}/{한도} m³ — 새 화물을 받기 어렵습니다’.
- `BOTTLENECK_OF`의 기존 값은 그대로 둔다.
- ‘사람을 더 뽑아도 돈·시간·선복 쪽 막힘 …’ 문장(`main.ts:811`)은 규칙 2일 때만 ‘돈·시간·선복·창고 쪽’으로 바꾼다.

### 5. 빈 계약 상태의 안내와 TASK-0033 정리

- **만료 문구**(`main.ts:715`): 규칙 2에서 계약이 없고 견적이 만료됐으면 ‘다음 견적 묶음은 {다음 공개일}일에 나옵니다’를 쓴다.
  - 다음 공개일은 `config.operations.market.publish`에서 오늘보다 뒤인 첫 날이다.
  - 남은 공개가 없을 때만 기존 문장을 쓴다. 규칙 1은 그대로다.
- **`tradeUiState()` 정리**(`main.ts:50-53`):
  - `session.ts`의 `initialUiState`가 `exchangeLots: 1`을 직접 갖게 하고 `exchangeUsdMinor`를 없앤다. 우회 함수는 지운다.
  - 저장 파일에는 UI 상태가 없으므로 이관이 필요 없다. 이 점을 결과 보고에 적는다.
- **`exchangeSelection` 정리:** 한 번 그릴 때 한 번만 계산한다.
  - `render`(`main.ts:1081`)의 결과를 `exchangeBlock`의 **다섯 번째 선택 인자**로 넘긴다.
  - 기존 시그니처 `exchangeBlock(view, config, direction, lots)`는 유지한다. 기존 시험(`m2a5-trade-ui.test.ts:236`·`394`·`427-430`)이 직접 부르기 때문이다.

### 6. TASK-0033 측정에서 넘어온 배치 고침(세션 B 실측 패치 적용)

- **첫 단계로** `git apply docs/ai/design/layout-followups-0033/style.patch`를 적용한다. 적용이 실패하면 멈추고 보고한다.
  - 이 패치는 세션 B가 Chromium으로 잰 `src/ui/style.css` 세 줄이다(PR #23, 개발 브랜치 `cf034bb`). PR #23은 패치 파일만 더했고 `style.css`는 바꾸지 않았다.
  - 세 줄: 시세표 최소 폭 42rem → 39rem, 규칙 2 막대 `nowrap` 시작 1024px → 1001px, `.queue-chip + .day-action { margin-left: 0 }`을 1001px 이상에만 적용.
  - 셋째 줄은 규칙 1에도 작용한다(1000px 이하에서 하루 진행 위치가 규칙 1·2 같아짐). 허브가 2026-10-13에 넣기로 정했다. 세션 B가 기존 시나리오 15개에서 측정값 차이 0을 확인했다. 규칙 1 HTML 기준 문자열에는 영향이 없다.
- 이 세 줄을 바꾸거나 되돌리지 않는다. 새 표·칸이 시세표 폭이나 막대 줄 수를 바꾸면 결과 보고에 적는다.

### 7. 일정의 예상 수령액(허브 화면 검수 F1)

- `src/ui/schedule.ts:66-67`은 예상 수령액을 `c.saleAmountMinor - (delivery > deadline ? lateDeliveryPriceReductionMinor : 0)`으로 계산한다. 규칙 2의 감액 방식(`PER_LATE_DAY_CAPPED`, 늦은 하루마다 감액)에서는 틀린다.
- 엔진 함수 `lateDeliveryReduction(config, c.saleAmountMinor, delivery - c.deliveryDeadlineDay)`(`src/engine/operations.ts:133`)로 바꾼다. 화면에서 감액 식을 다시 만들지 않는다.
- 감액 뒤 수령액이 0이면 수금 행을 뺀다.
- 규칙 1(`FLAT_ONCE`)은 같은 값이 나온다. 규칙 1 일정 출력이 바이트로 같아야 한다.

### 8. 위쪽 막대 지급 상태의 기준(허브 화면 검수 F2)

- 지금 지급 상태 칸(`operationsTopbar`, `src/ui/market.ts:97-98`)은 `view`로 계산하고 ‘대기 중인 명령 반영’이라고 적는다. 그런데 미지급이 갚아지는 것은 하루 마감(`commitDay`의 `settleObligations`, `src/engine/engine.ts:843`)에서뿐이다. 그래서 대기 중인 환전이 실패를 막아도 칸은 ‘위험 · 실패까지 0일’로 남는다. 잘못 이끄는 표시다.
- 고침:
  - 지급 상태 칸은 **확정 상태 `state`** 로 계산한다. 설명(`title`·숨김 글)을 ‘확정 기준’으로 바꾼다. 원화 급여 가능일 칸은 지금처럼 `view` 기준이다(현금이 대기 환전을 반영한다).
  - 대기열이 비어 있지 않고 확정 상태의 단계가 `WARNING`·`DANGER`이면, 칸 아래에 한 줄을 더한다: ‘하루 진행 뒤 예상: {단계}’. 값은 `commitDay(state, config, 대기열)` 결과 상태의 `paymentStatusKo`다. 엔진 함수 호출이며 엔진은 고치지 않는다. 예외가 나면 줄을 쓰지 않는다.
  - 비용을 줄이려고, 단계가 `NONE`이면 이 계산을 하지 않는다.
- 대기열 안내 문장(`queuePanel`, `main.ts:953` 근처 ‘급여 가능일·지급 상태는 대기 중인 명령을 반영합니다’)도 맞게 고친다: ‘급여 가능일은 대기 중인 명령을 반영합니다. 지급 상태는 확정 기준이고, 하루 진행 뒤 예상을 따로 보입니다.’

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/reports.ts`, `src/ui/session.ts`(지시 3의 `UiCommand`, 지시 5의 초기 상태만), `src/ui/market.ts`(지시 5의 선택 인자, 지시 8의 `operationsTopbar`만), `src/ui/schedule.ts`(지시 7만), 새 `src/ui/warehouse.ts`, `src/ui/style.css`(지시 6 패치와 새 화면 규칙).
- 새 시험 `src/ui/m2a5-ops-ui.test.ts`. 기존 UI 시험은 규칙 2 기대 문자열 줄만 고친다. 규칙 1 기준 문자열은 고치지 않는다.
- `docs/ai/tasks/results/TASK-0034.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`, `data/**`, `schemas/**`, `tools/**`, `src/ui/culture.ts`, `src/ui/recruitment.ts`(TASK-0057 범위).

## 지켜야 할 것

- **규칙 1 불변:** TASK-0033의 규칙 1 기준 문자열 세 개(sha256)가 그대로 통과한다. 막힘 목록도 규칙 1에서는 바이트로 같다.
- **통화 분리:** 금액마다 통화를 붙이고 통화끼리 더하지 않는다.
- **시험 자료:** 시험 소스에 자료 ID와 조정값 상수를 쓰지 않는다(TASK-0027 R1). 날짜가 필요하면 무엇의 날인지 주석으로 적는다.
- **결정성:** 기본 `run` 400회가 바이트로 같다.
- 색만으로 상태를 구분하지 않는다(UI_SPEC:50). 새 단추는 키보드로 쓸 수 있다.
- **크기:** 첫 화면 gzip이 `cf034bb`보다 **6,000 B 넘게 늘면** 멈추고 질문에 적는다. 동적 불러오기로 나눌지는 세션 A가 정한다. 다음 지시서도 같은 여유(약 15 KB)를 나눠 쓴다.

## 시험(`src/ui/m2a5-ops-ui.test.ts`)

문장마다 **나와야 하는 상태**와 **나오면 안 되는 반례**를 하나씩 둔다.

- 상태는 실제 실행(정책 실행·명령·대기열)으로 만든다.
- **예외 하나:** 창고 처리 대기가 있는 상태는 엔진 시험의 `impactState()`(`src/engine/m2a5-readers.test.ts:26-33`)와 같은 방법으로 만들어도 된다. 이 방법은 인수 사례 `P0-M2A5-19`의 픽스처 칸(`impact_candidate`·`impact_commands`·`impact_required_pt`)을 읽어 직원 상태와 업무 pt를 고친다. 시작 직원 4pt로는 창고 한도 6pt를 넘길 수 없어서다. 자료 ID는 JSON에서 읽고 시험 소스에 쓰지 않는다.

| 시험 | 나와야 함 | 반례 |
|---|---|---|
| 본사·창고 줄 순서 | 다섯 줄이 CL-03 순서 | 규칙 1에 표 없음 |
| 확장 효력일 문장 | 확장을 진행한 다음 날(확정 상태의 효력일) | 그 다음 날 |
| 확장 예정 문장 | 확장을 대기열에 넣은 화면 | 대기열에서 뺀 화면 |
| 병목 표 값 | 행 값·순서가 `weeklyBottleneck(view, config).rows`와 같음(전체 비교) | — |
| 보관 근거 | `windowDays > 0`이고 **`otherPeakLiters > otherOccupancyLiters`**인 상태에서 최고·평균·머묾 문장 | 1일에는 기본값 문장 |
| 가장 좁음 표시 | `binding.before`의 행에만 | 다른 행에는 없음 |
| 투자 미리보기 | 확장 ‘후’ 한도가 ‘전’과 다르고, 계획 상태의 효력일 값과 같음 | 원화가 모자라 거절되는 상태(아무 명령 없이 진행)에서 엔진 문장 그대로 |
| 투자 대기열 | 단추를 두 번 눌러도 확장 명령 하나 | 확장한 뒤에는 단추 없음 |
| 선복 계약 줄 | 계약한 노선은 편수·첫·끝 편 | 계약 안 한 노선은 단추 |
| 창고 막힘 | 처리 한도 대기가 있는 상태(위 예외)에서 ‘창고’ 항목 | 규칙 1 막힘 목록 바이트 같음, ‘창고’ 행 없음 |
| 만료 문구 | 규칙 2 빈 계약·만료 상태에서 다음 공개일 | 남은 공개가 없으면 기존 문장 |
| 정리 | 규칙 2 첫 화면이 정리 전과 같음(환전 칸 포함) | — |
| 일정 수령액 | 규칙 2에서 며칠 늦는 계약의 수금 행 금액 = 판매액 − `lateDeliveryReduction(...)` | 규칙 1 일정 출력 바이트 같음 |
| 지급 상태 기준 | 실패 마감일 화면(환전 없이 진행한 실제 상태)에서 원화를 살리는 환전을 대기열에 넣으면 칸은 확정 기준 단계 그대로, ‘하루 진행 뒤 예상’ 줄은 실패가 아님 | 환전을 빼면 예상 줄이 ‘경영 실패’ |

## 완료 조건

1. 지시 1~8 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check cf034bb` 실패 0. 기본 `run` 400회 바이트 같음. 첫 화면 크기 보고.
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 본사·창고 줄 순서에서 보관과 선복을 바꿈 | 줄 순서 시험 |
| 2 | 보관 근거에 평균만 쓰고 최고를 뺌 | 보관 근거 시험 |
| 3 | 확장 효력일 문장을 효력일 다음 날에도 씀 | 효력일 반례 |
| 4 | 투자 미리보기의 ‘후’ 한도를 오늘 날짜로 읽음 | 투자 미리보기 시험(후 ≠ 전) |
| 5 | ‘창고’ 묶음을 규칙 1에서도 넣음 | 규칙 1 막힘 목록 시험 |
| 6 | 미리보기를 `planState(view, …[...pending, cmd])`로 계산 | 투자 미리보기 또는 대기열 시험 |
| 7 | 일정 수령액을 옛 식(늦으면 한 번 정액)으로 되돌림 | 일정 수령액 시험 |
| 8 | 지급 상태 칸을 다시 `view`로 계산하고 예상 줄을 뺌 | 지급 상태 기준 시험 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0034.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 변형 표, 크기 증감, 범위 밖 발견, 질문을 적는다.
   - 세션 B가 Chromium으로 잴 항목도 적는다: 운영 지표의 1·8·15·30일 높이, 병목 표가 390px에서 넘치는지, 투자 단추의 Tab 순서, 그리고 PR #23의 세 측정(iPad mini 1024px 시세표, 1001~1023px 막대, 768px 하루 진행)이 이 작업 뒤에도 같은지.

## 세션 A 확인 기록(확정 때, 2026-10-13)

- 줄 번호는 `b4a851b` 기준이다. 적대 검토가 `main.ts` 50, 182, 186, 715, 807, 811, 898, 909, 1080-1081, 1101과 `reports.ts` 111, `progress.ts:23`, `readers.ts`·`operations.ts`의 함수 위치를 모두 확인했다.
- 적대 검토(에이전트 1개)에서 받아들인 지적:
  1. 투자 명령이 `UiCommand`에 없다 → `session.ts` 허용.
  2. ‘확장 예정’은 확정 상태에 없다(효력 1일 뒤, 마감 때 날이 넘어감) → 새 화면은 `view`로 읽는다.
  3. 미리보기 ‘후’를 오늘로 읽으면 전과 같다 → 효력일로 읽는다. `planState(view, …)`는 중복 거절이 된다 → `state`와 대기열로 계산한다.
  4. 창고 처리 대기는 실제 플레이로 만들 수 없다 → 픽스처 예외를 명시했다.
  5. ‘창고’ 묶음이 규칙 1 목록을 바꾼다 → 규칙 2에서만 넣는다.
  6. `exchangeBlock` 시그니처를 바꾸면 기존 시험이 깨진다 → 선택 인자로 넘긴다.
  7. 변형 2는 평균과 최고가 같은 상태에서는 잡히지 않는다 → 최고 > 평균인 상태를 쓴다.
  8. 범위가 크다 → 둘로 나눈다.
- TASK-0057로 넘긴 범위와 거기서 고칠 점(검토 지적 4·6·7·9):
  - 고용 면담: 고용이 대기열에 있으면 `view`에서 후보가 이미 고용돼 값이 0이 된다. 그때는 네 줄을 쓰지 않거나 `state`로 읽는다.
  - 지급 알림: `lotsToSurvive`는 실패 당일 전까지 늘 0이다. 0이면 ‘오늘 마감에는 실패하지 않습니다’로 쓰고 `lotsToClearAll`을 먼저 보인다. 금액은 `× lotUsdMinor`로 계산하고, 보고 화면은 `state`로 읽는다.
  - 경영 실패: 제목은 `failure.day`로 쓴다. `reasonKo`는 미지급 항목 이유일 뿐이라 문장을 따로 만든다. ‘14일’은 `failureAgeDays`에서 읽는다.
  - 결산 변형은 행 목록 전체를 비교한다.
- 허브 화면 적대 검수(2026-10-13, 진행 중)에서 먼저 확정된 두 건(F1 일정 수령액, F2 지급 상태 기준)을 지시 7·8로 넣었다. 코드로 확인했다: `schedule.ts:66-67`의 식, `settleObligations`는 `commitDay`(`engine.ts:843`)에서만 불림. 나머지 검수 결과는 0057 또는 0034-R1로 보낸다.
- 지시 6은 허브 결정(PR #23 병합, 셋째 줄 포함)에 따라 패치 적용으로 바꿨다. 패치는 `cf034bb`에 `git apply --check`로 적용되는 것을 확인했다.
- 초안에서 뺀 것: 일정의 임차료·선복 요금 행(명세 16-9)과 원화 보고 주석(명세 16-10 끝)은 TASK-0033에서 이미 들어갔다(`main.ts:791`, `reports.ts:26`).
