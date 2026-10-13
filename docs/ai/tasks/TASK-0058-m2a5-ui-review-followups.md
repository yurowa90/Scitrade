# TASK-0058 M2a-5 화면 검수 후속: 환전·수량 칸 접근성, 인도일 경고, 환전 단위, 보고 문장, 시험 빈칸

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: TASK-0057 병합 기록 뒤 개발 브랜치 머리(이하 `<BASE>`). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
  - `<BASE>`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0058-m2a5-ui-review-followups.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
  - 아래 줄 번호는 검수 문서가 본 트리(`379a862`) 기준이다. TASK-0034·0057이 같은 파일을 고쳤으므로 **함수·문장 이름으로 찾고**, 실제 줄을 결과 보고에 적는다.
- 근거: `docs/ai/design/ui-review-0033/README.md`(허브 화면 적대 검수, 2026-10-13). 항목마다 재현 절차·위치·고칠 방향이 있다. 먼저 그 문서의 해당 절을 읽는다.
  - 이 지시서에 넣은 것: A11Y-1~5, F4·GAP-4, F5·GAP-5, GAP-2·3·6·7(시험 범위)·8.
  - 다른 작업에서 이미 다룬 것: F1(0034 지시 7), F2·SF-2(0034 지시 8), SF-1·SF-3·F3(0057 지시 7). 기각된 A11Y-6은 다루지 않는다.
- 원칙: 화면은 엔진 읽기 함수가 준 값을 보인다. 규칙 1 화면은 바이트로 같아야 한다. 새로 고치는 문구는 **규칙 2에서만** 바뀐다(예외는 지시 8의 시험 추가뿐).

## 구현 지시

### 1. 환전 칸의 경고·알림(A11Y-1, A11Y-4)

- 경고 문단에 `id="exchange-warning"`, 거절 문단에 `id="exchange-reason"`을 단다. 환전 단추의 `aria-describedby`는 있는 쪽 id 목록이다. 둘 다 없으면 속성을 넣지 않는다.
- `queue`의 성공 알림을 환전일 때 바꾼다.
  - 문장에 방향과 금액을 넣는다. 예: ‘환전 USD→KRW 800.00 USD를 오늘 할 일에 넣었습니다. …’ 같은 단추를 반복해 눌러도 매번 실제 금액이 읽힌다.
  - 넣기 전 `exchangePreview(view, …).warningKo`가 있으면 알림 종류를 `warn`으로 하고, 경고 문장을 알림 앞에 붙인다.
- 대기 반영으로 다음 환전 금액이 줄면 알린다. ‘남은 USD에 맞춰 다음 환전 금액을 {금액}({n}묶음)으로 줄였습니다.’
  - 보정 사실은 `render` 안에서 알림을 바꾸지 말고, 보정 전후 묶음 수를 별도 값으로 계산한다. 그 값을 `queue`와 환전 칸 `change` 처리의 문장에 붙인다. `announcedFlash` 비교 순서(`render`의 알림 결정)를 흔들지 않기 위해서다.

### 2. 환전 단추 초점이 ‘하루 진행’으로 옮겨 가는 문제(A11Y-3)

- 칸 자리가 없는 단추(환전, 창고 확장, 선복 계약)도 `queue`에서 누른 단추 자체의 위치를 기준점(anchor)으로 적는다.
- `render` 뒤 같은 단추의 아래 끝이 알림 띠 윗변 − 8px보다 아래면, 그 차이만큼 `window.scrollBy`로 올리고 초점은 그 단추에 둔다. 기존 `revealBelow`의 72px 예약과 같은 방식이다.
- 대안 제목·표시로 넘어가는 기존 경로의 ‘하루 진행’ 규칙(`main.test.ts`의 해당 시험)은 그대로 둔다.

### 3. 수량 칸으로 수락이 막힐 때(A11Y-2)

- **규칙 2에서만** 고친다. 규칙 1 견적 카드의 마크업(기준 문자열)은 바뀌지 않는다.
- 견적 카드의 이유 문단에 `id="quote-reason-{카드 키}"`를 단다. 수량 `select`와 수락 단추에 `aria-describedby`로 그 id를 건다. 이유가 없으면 속성을 넣지 않는다. `disabled`는 그대로 둔다.
- 수량 `change` 처리에서, 다시 그린 뒤 수락 가능 여부가 바뀌었으면 낭독 칸에 알린다. ‘수량 {수량}: 수락할 수 없습니다 — {이유}’ 또는 ‘수량 {수량}: 수락할 수 있습니다’. `liveRegionText`를 쓰고 알림 띠는 바꾸지 않는다.

### 4. 시세표 스크롤 칸의 초점 유지(A11Y-5)

- `div.table-scroll`(시세표)에 고정 id `market-scroll`을 준다. 열 전환 때 기존 id 경로로 초점이 돌아온다.
- 다시 그리기 전후로 이 칸의 `scrollLeft`를 보존한다. 지도 틀의 스크롤 보존과 같은 방식이다.
- `tabindex="0"` 명시 여부는 결과 보고 ‘설계 판단’에 적는다(Safari는 스크롤 칸을 자동으로 초점 대상에 넣지 않는다. 넘침이 없는 폭에서도 Tab에 들어가는 차이가 생긴다).

### 5. 캠페인 뒤 인도 경고의 기준(F4, GAP-4)

- `operationsQuoteFacts`의 ‘캠페인 안에 인도되지 않습니다’ 조건을 `q.arrivalDay + config.terms.customsDays > config.campaignDays`로 바꾼다. 같은 함수의 감액 일수와 같은 인도일 기준이다.
- 엔진의 `QuotePreview`에 인도일 칸을 더하는 방법은 이번에 쓰지 않는다(엔진 변경).
- 시험(`customsDays = 1` 사본):
  - `campaignDays = arrivalDay`면 경고가 있고, `runToCampaignEnd`의 `deliveredDay`가 null이다.
  - `campaignDays = arrivalDay + customsDays`면 경고가 없고, `deliveredDay`가 그날이다.
  - 기존 `customsDays = 0` 경계 시험에는 ‘통관 일수 0일 때만 뜻이 있다’는 주석을 단다.

### 6. 환전 단위 문구(F5, GAP-5)

- `market.ts`에 `fxLotKo(config)`를 둔다. 값은 `${lotUsdMinor / MINOR_PER_MAJOR.USD} USD`이고, 엔진 거절 문장(`operations.ts`의 환전 단위 문장)과 같은 표기다.
- 환전 칸 이름표 ‘금액 (… 단계)’와 경영 보고의 ‘환전 칸에서 … 단위로 원화로 바꿀 수 있습니다’ 두 문장이 이 도우미를 쓴다. 보고의 같은 문장 두 곳은 한 변수로 묶는다.
- 시험: 기존 리터럴 ‘100 USD’ 단언을 설정값에서 만든 문자열로 바꾼다. `lotUsdMinor = 5000` 사본에서 이름표·보고·선택지·명령 금액이 함께 바뀌는지 본다.

### 7. 경영 보고의 예약 설명(GAP-2)

- ‘사용 가능 자금은 현금보다 … 적습니다’ 문장(`reportPanel`)을 자금 표와 같은 기준으로 나눈다.
  - 계약 몫 = `f.reserved − f.reservedCommitments`, 선복 몫 = `f.reservedCommitments`, 미지급 = `f.unpaidObligations`.
  - 0보다 큰 몫만 이어 붙인다: ‘체결한 계약이 낼 운임·관세 {X}’, ‘선복 장기 계약의 다가오는 출항 요금 {Y}’, ‘미지급 {Z}’.
- 규칙 1은 `reservedCommitments`가 0이다. 그래도 규칙 1 문장이 바이트로 같도록 규칙 1 분기는 지금 문장을 그대로 쓴다.
- 시험: 선복 요금만 예약된 상태(검수 문서 재현)에서 ‘운임·관세를 미리 묶어’가 없고 선복 요금 문장이 있다. 계약 예약과 선복 예약이 함께 있는 상태에서는 두 몫이 모두 나온다.

### 8. 시험 빈칸(GAP-3·6·7·8)

- **GAP-3(수량 규칙):** 주 수정은 가져오기 불변식이다. `src/engine/operations-invariants.ts`에 견적 수량 검사를 더한다. 대상은 생성 견적(`o.offers`)과 시작 견적(`config.offers`) 가운데 운송 주선이 아닌 것이다.
  - 조건: `quantityStep > 0`, `quantity >= quantityStep`, `quantity % quantityStep === 0`, `maxQuantity >= quantity`, `maxQuantity % quantityStep === 0`.
  - 어기면 ‘견적의 수량·단위·최대 수량이 맞지 않습니다’를 더해 가져오기를 거부한다. 정상 생성 견적은 늘 통과해야 한다(기본 `run` 400회 바이트 같음).
  - 시험: 저장 변조 반례(수량이 단위의 배수가 아님, 단위 0)가 거부된다. 정상 저장은 그대로다.
  - 화면 쪽 기준(선택지 시작값)은 이번에 바꾸지 않는다. 불변식이 어긋난 견적을 막기 때문이다.
- **GAP-6(규칙 1 일정 문구):** `scheduleItems`에서 규칙 1 첫 수락 뒤 `PAY:FREIGHT:`·`PAY:DUTY:` 줄의 `{kind, day, textKo, money}`를 전체 비교로 고정한다. 기대값은 검수 문서 GAP-6 절의 값이다. 시나리오 select의 `selected` 단언도 하나 더한다.
- **GAP-7(막대 범위):** 막대를 단언하는 시험은 페이지 전체가 아니라 `id="status-h"`부터 `</header>`까지 범위에서 찾는다. 급여 가능일이 view 값이고 state 값과 다르다는 것도 같이 단언한다. 환전 칸도 `<section class="exchange"` 범위에서 고정 환율 두 값, 급여 가능일 전 → 후, 방향별 금액을 직접 단언한다.
- **GAP-8(지급 상태 경계):** `campaignDays = failAtCloseOfDay`인 설정에서 지급 상태 문구가 ‘경고 · 실패까지 n일’ 전체 문자열이다(‘캠페인이 끝날 때까지…’ 없음). 같은 설정으로 엔진을 진행하면 경영 실패이고 마지막 마감일이 그날이다. 남은 날 기대값은 `failureAgeDays − ageDays`로 만든다.

## 고칠 수 있는 파일

- `src/ui/main.ts`, `src/ui/market.ts`, `src/ui/style.css`(필요할 때만).
- `src/engine/operations-invariants.ts`(지시 8 GAP-3의 견적 수량 검사만).
- 시험: `src/ui/m2a5-trade-ui.test.ts`, `src/ui/m2a5-ops-ui.test.ts`, `src/ui/m2a5-money-ui.test.ts`(0057이 만든 것), `src/ui/schedule.test.ts`, `src/ui/layout.test.ts`, `src/engine/m2a5-save-references.test.ts`(GAP-3 반례 추가만), 새 시험 파일(필요하면 `src/ui/m2a5-review-followups.test.ts`).
- `docs/ai/tasks/results/TASK-0058.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- 위 목록 밖 `src/engine/**`, `src/content/**`, `data/**`, `schemas/**`, `tools/**`, `src/ui/culture.ts`, `src/ui/session.ts`, `src/ui/recruitment.ts`, `src/ui/warehouse.ts`, `src/ui/reports.ts`.

## 지켜야 할 것

- 규칙 1 불변(TASK-0033 기준 문자열 세 개 sha256). 통화 분리. 결정성(기본 `run` 400회 바이트 같음). 시험 소스에 자료 ID·조정값 상수 금지(TASK-0027 R1). 색만으로 상태를 구분하지 않음.
- **크기:** 첫 화면 gzip이 `<BASE>`보다 3,000 B 넘게 늘거나 한도 140,000 B까지 2,000 B 안으로 들어오면 멈추고 질문에 적는다.

## 완료 조건

1. 지시 1~8 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0. 기본 `run` 400회 바이트 같음. 첫 화면 크기 보고.
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 환전 단추의 `aria-describedby`를 뺌 | 환전 경고 연결 시험 |
| 2 | 환전 성공 알림에서 금액을 뺌(고정 문장) | 환전 반복 알림 시험(두 알림이 서로 다른 금액) |
| 3 | A11Y-3 기준점 보정을 뺌 | 환전 단추 초점 유지 시험(검수 문서 재현) |
| 4 | 수량 변경 알림을 뺌 | 수량 변경 알림 시험 |
| 5 | 시세표 칸 id를 뺌 | 열 전환 초점 시험 |
| 6 | 인도 경고 조건에서 통관 일수를 뺌 | `customsDays = 1` 경계 시험 |
| 7 | 환전 이름표를 ‘100 USD’로 되돌림 | `lotUsdMinor = 5000` 시험 |
| 8 | 보고 문장을 예전 한 문장으로 되돌림 | 선복 요금만 예약된 상태 시험 |
| 9 | 견적 수량 불변식에서 배수 검사를 뺌 | 수량 변조 반례 시험 |
| 10 | 일정의 FREIGHT·DUTY 문구를 맞바꿈 | 규칙 1 일정 문구 시험 |
| 11 | 막대를 다시 `state`로 그림(급여 가능일) | 막대 범위 시험 |
| 12 | 지급 상태 경계 조건 `>`를 `>=`로 바꿈 | 지급 상태 경계 시험 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0058.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 변형 표, 크기 증감, 범위 밖 발견, 질문을 적는다.
   - 세션 B가 Chromium으로 잴 항목: 환전 단추 초점 유지(아래 끝에 붙은 상태), 수량 변경 알림 낭독, 시세표 칸 열 전환 뒤 초점·가로 위치.

## 세션 A 확인 기록(쓸 때, 2026-10-13)

- 허브가 2026-10-13 15:23에 번호 0058을 줬다. 범위는 화면 검수 21건 가운데 0034·0057이 다루지 않은 항목이다.
- GAP-3의 주 수정은 엔진 불변식(0056과 같은 파일·같은 패턴)이다. 화면 쪽 선택지 계산을 바꾸기보다 어긋난 견적을 가져오기에서 막는 쪽이 안전하다고 판단해 이 작업에 넣었다. 엔진 파일은 그 한 곳만 허용한다.
- A11Y-2는 검수 문서의 두 방식(연결·알림) 가운데 둘 다 쓴다. `aria-disabled`로 바꾸는 방식은 초점 복원과 시험 판정을 함께 바꿔야 해서 이번에 쓰지 않는다.
- 0057 실행 결과에 따라 줄 번호와 일부 문장 위치가 바뀐다. 0057 병합 뒤 세션 A가 이 지시서를 다시 확인하고 확정 해시를 보낸다.
