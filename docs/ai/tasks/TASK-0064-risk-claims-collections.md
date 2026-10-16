# TASK-0064 직접 무역 위험 ③: 화물 손상 클레임과 지연·부분 수금 (초안, 개정 1)

- **지위: 초안(세션 A, 2026-10-14, 개정 1 2026-10-16). 허브 승인과 `<BASE>` 치환 전에는 실행하지 않는다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0063 병합 기록 커밋(이하 `<BASE>`).
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 5·6·8·9절. TASK-0062의 원칙은 그대로다.
- 목적: 인도 뒤에도 손실과 자금 압박이 생길 수 있게 한다. 대금이 늦게 들어오면 환율 노출이 길어지고 원화 급여 압박이 커진다.
- 교육과정 연결의 범위: 특성화고 [수입 07-03-03](결제 방식별 위험)의 **일부만** 준비한다. 사후송금 한 가지 조건에서 지연·부분 수금이 환율 노출과 자금 압박을 키우는 것이다. 결제 방식 선택·비교(송금 → 추심 → 신용장)는 경로 7이고, 경로 3만으로는 이 성취기준을 충족하지 않는다.

## 구현 지시

### 1. 화물 손상 클레임

- 위험 설정에 `CLAIM` 층이 있으면, 직접 무역 화물이 인도될 때(`processDeliveries`) 순수 함수 `claimFor(config, seed, sellOfferId)`로 손상 여부·층·손상률을 정한다.
  - **추첨 키는 계약 순번이 아니라 판매 견적 ID(`contract.sellOfferId`)다**(검토 43번). 흐름 `CLAIM:{판매 견적}:hit`, `…:tier`, `…:rate`.
  - 손상 확률은 품목의 파손 위험 등급에 따라 프로필 `claims.by_good`에서 읽는다.
  - 층: 작은 손상(`minor.weight_bp`, `[minor.min_bp, minor.max_bp]`) 또는 큰 손상(`major.weight_bp`, `[major.min_bp, major.max_bp]`). 손상률은 그 층 범위의 정수 균등.
- 손상이면: 늦은 인도 감액 뒤 판매액 × 손상률(USD 센트, half-up)을 매출 에누리로 낸다.
  - 새 계정 `SALES_ALLOWANCE`. 분개 `CLAIM-{계약}`: 매출 에누리 / 매출채권. 청구 금액이 그만큼 준다.
  - `priceReductionMinor`(늦은 감액)에는 더하지 않는다.
  - 로그 한 줄(‘{계약} 화물 일부 손상: 고객이 대금 {금액} 감액 청구’).
- 주선 화물은 제외한다.
- **공개 위험 등급 읽기 함수.** 견적 미리보기(`quotePreview`)에 rules-3에서만 `riskGrades: { damage: 품목 파손 등급, credit: 판매 거래처 신용등급 }`을 더한다. 확률 숫자가 아니라 등급만 낸다. 화면은 경로 11이다.

### 2. 지연·부분 수금

- 위험 설정에 `COLLECTION` 층이 있으면, 직접 무역 청구서를 낼 때 순수 함수 `collectionPlan(config, seed, sellOfferId)`로 방식을 정한다. 흐름 `COLLECT:{판매 견적}:mode`, `…:days`. 확률은 판매 거래처의 신용등급(`collections.by_counterparty` → `grades`)에서 읽는다. **주선 청구서는 제외**한다(지금처럼 정시 전액).
- 용어: ‘약정 결제일’ = `contract.paymentDueDay`, ‘청구 결제일’ = `invoice.dueDay`.
- 청구서의 `dueDay`는 그대로 둔다. 실제 수금은 `processCollections`가 계획을 읽어 처리한다.
  - 지연: 청구 결제일 + 지연일에 전액. 수금 ID·분개 ID는 지금 꼴(`RCPT-{청구서}`, 분개 `RECEIPT-RCPT-{청구서}`, `engine.ts:1117`) 그대로다.
  - 부분: 청구 결제일에 `partial_bp` 몫(수금 ID `RCPT-{청구서}-1`), 청구 결제일 + 지연일에 나머지(`RCPT-{청구서}-2`). 둘 다 `receiptIds`에 넣는다.
  - 상태 전이: `s.day > dueDay`이고 남은 금액 > 0이면 `OVERDUE`, 다 받으면 `PAID`. rules-2에서는 `OVERDUE`에 들어가지 않는다.
  - 계획일이 캠페인 끝을 넘으면 받지 못한 채 채권으로 남는다.
- **청구서에 새 칸을 두지 않는다.** 받은 금액은 원장에서 읽는다. rules-2의 `applyReceipt`는 그대로다(부분 수금은 새 함수).

### 3. 읽기 함수(검토 42·44·45번)

- 새 함수 `receivableSchedule(s, config)`(`reports.ts`): 미수 청구서마다 `{ invoiceId, contractId, currency, dueDay, outstandingMinor, overdueDays }`.
  - `outstandingMinor` = 청구액 − 원장의 `RECEIPT-` 분개 합. `overdueDays` = max(0, s.day − dueDay).
  - 정렬은 `dueDay`, 그다음 `invoiceId`.
  - `collectionPlan`을 부르지 않는다(미래 누설 금지). 그래서 결제일 전에는 정시·지연·부분 청구서가 같은 꼴이다.
- `upcomingPayments`·`UpcomingPaymentKind`는 **손대지 않는다**(지급 일정이다. rules-2 골든 `m2a5-readers.test.ts:53-75`, `m2a5-save.test.ts:205-206`이 그대로여야 한다).
- `campaignSummary.openInvoices.amountMinor`(`reports.ts:374`)는 남은 금액으로 낸다. rules-2에서는 지금 값과 같다.
- `paymentDefaultStatus.recovery.nextReceipt`(`operations.ts:241·252`): 금액은 남은 금액, 결제일이 지난 미수 청구서는 ‘다음 수금’으로 내지 않는다. 연체는 `receivableSchedule`이 낸다. rules-2·R2 상태에서는 결과가 바이트로 같다(`m2a5-money.test.ts:184` 포함). **`operations.ts`에서 고치는 곳은 이 계산뿐이다.**
- `progress.ts`의 `contractProgress`(`:59-63`), `src/ui/schedule.ts:73-74`, `main.ts:400`은 고칠 수 없는 파일이다. rules-3이 화면에 없으므로 결과 보고 ‘범위 밖 발견’에 적는다.

### 4. 불변식

- `operations-invariants.ts`: 부분 수금 합 ≤ 청구액, `PAID`이면 합 = 청구액, 클레임 ≤ 늦은 감액 뒤 판매액, `CLAIM-` 분개는 직접 무역 계약에만.
- `invariants.ts`: 매출채권 = 미수 청구서 합(`:84-87`)을 ‘청구액 − 원장의 받은 금액’의 합으로 맞춘다. rules-2 상태에서는 지금과 같은 값이다.

### 5. 손익 읽기

- `components`의 6단계 `claim`과 8단계 `collection`을 설계 3.4 표의 순서대로 채운다. `collection`은 수금 줄의 환율을 청구 결제일 → 실제 수금일로 바꾼 차이만 센다. 캠페인 끝에 남은 수금 줄은 9단계 `open_valuation`이 맡는다. `residual`은 늘 0이다.

### 6. 측정용 변환

- `withRiskLevel`(`src/engine/risk.ts`)에 `R3`(R2 + `CLAIM` + `COLLECTION`)를 더한다.

## 시험(새 파일 `src/engine/m2a5-risk-credit.test.ts`)

- 시험에 자료 ID·조정 상수를 쓰지 않는다. 사건은 시드를 찾아서 만든다(시드 200개 안, 찾았는지 먼저 단언).

| 시험 | 확인할 것 |
|---|---|
| 새 층이 꺼진 R2 | R2 설정에서 `CLAIM-` 분개가 없고 모든 직접 무역 청구서가 청구 결제일에 전액 수금된다 |
| 클레임 | 손상 계약을 찾아: 분개 금액, 청구 금액 감소, 늦은 감액과 따로 기록, 주선 화물엔 없음. 작은 층과 큰 층이 각각 나오는 시드를 찾아 손상률이 층 범위 안 |
| 공통 난수 | 같은 시드에서 주선을 하나 먼저 더 받아 계약 번호를 민 실행과 밀지 않은 실행을 견준다. 같은 판매 견적의 클레임 여부·층·손상률·수금 방식·지연일이 같다 |
| 공개 등급 | rules-3 미리보기에 품목 파손 등급과 거래처 신용등급이 있고, 프로필의 배정과 같다. 확률 숫자는 내지 않는다 |
| 지연 | 지연 청구서를 찾아: 청구 결제일엔 수금 없음, 그 사이 `receivableSchedule`의 `overdueDays = s.day − dueDay`와 `outstandingMinor` = 청구액, 상태 `OVERDUE`, 계획일에 전액과 `PAID` |
| 부분 | 부분 청구서를 찾아: 두 수금 ID, 합 = 청구액, 첫 수금 뒤 `OVERDUE`(아직 `PAID` 아님), `outstandingMinor` = 청구액 − 첫 수금, `nextReceipt.amountMinor` = 남은 금액 |
| 미래 누설 없음 | 결제일 전에는 정시·지연·부분 청구서의 `receivableSchedule` 행이 `invoiceId`·`contractId`를 빼면 같은 꼴 |
| 다음 수금 | 지연 청구서가 결제일을 지난 뒤 지난 날짜가 `nextReceipt`로 나오지 않는다 |
| 캠페인 끝 | 계획일이 캠페인 끝을 넘는 청구서(지연, 부분의 나머지)는 `PAID`가 아니다. 남은 금액은 끝 상태의 `campaignSummary.openInvoices`에 남고, 같은 통화 매출채권 잔액에 들어가며, 이 잔액은 미수 청구서 남은 금액의 합과 같다. 그 계약의 `contractRiskReport`가 `open: true`다 |
| 불변식 | 부분 수금 합을 늘린 저장 사본, `PAID`인데 합이 모자란 사본, 주선 계약에 `CLAIM-`이 있는 사본을 거부 |
| 항등식 | 끝난 계약과 열린 계약 모두 `residual = 0` |
| 등급별 확률 | 프로필의 등급 확률을 서로 다르게 바꾼 설정에서, 시드 200개의 지연 빈도 순서가 등급 확률 순서와 같다 |
| 결정성·저장 | 같은 입력 같은 결과, 부분 수금 중간 상태 저장 왕복 같음(설정을 직접 넘김) |

## 변형 시험

결과가 원래 코드와 같은 변형이 나오면 ‘잡힘’으로 적지 말고 이유를 적는다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 클레임을 늦은 감액(`priceReductionMinor`)에 더함 | 클레임 |
| 2 | 부분 수금 첫 수금에서 `PAID`로 바꿈 | 부분 |
| 3 | `receivableSchedule`이 결제일 전에 지연 계획을 드러냄 | 미래 누설 없음 |
| 4 | 불변식에서 부분 수금 합 검사를 뺌 | 불변식 |
| 5 | `collection`과 `fx`가 같은 기간을 두 번 셈 | 항등식 |
| 6 | 추첨 키를 계약 ID로 되돌림 | 공통 난수 |
| 7 | 손상률을 한 층 균등으로 뽑음 | 클레임(층 범위) |
| 8 | `nextReceipt`가 청구 전액을 냄 | 부분 |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `ledger.ts`(계정 추가), `readers.ts`, `reports.ts`, `risk.ts`, `types.ts`, `invariants.ts`, `operations-invariants.ts`, `save-shape.ts`(열거 값 추가만)
- `src/engine/operations.ts`(`paymentDefaultStatus.recovery.nextReceipt` 계산만)
- `data/market_rules.json`(프로필의 `claims`·`collections` 꼴 맞춤만), 스키마, `tools/validate_data.py`
- 새 `src/engine/m2a5-risk-credit.test.ts`
- `docs/ai/tasks/results/TASK-0064.md`, `MANIFEST.json`

## 손대지 않을 파일

- TASK-0062와 같다. 화면이 `SALES_ALLOWANCE` 같은 새 계정이나 `OVERDUE`를 모르면 결산 표가 깨질 수 있다. 새 규칙 시나리오는 화면에 없으므로 이번에는 그대로 두고, 깨질 곳을 결과 보고 ‘범위 밖 발견’에 적는다.

## 지켜야 할 것

- 옛 값 불변 절차는 TASK-0063과 같다(저장소 밖 덤프, 작업 뒤 `cmp` 0). 덤프는 400회 `run`, rules-2 골든, 그리고 R2 설정을 시드 3개·고정 명령열로 돌린 수금·인도 분개 JSON이다.
- P0-M2A5 골든값 불변, 옛 저장, 첫 화면 gzip +2,500 B 상한, `review_checks` 통과, 변형 8개.
- 엔진·시험에 두 통화를 더한 값을 만들지 않는다. 분석값에 채권이 들어가는지는 경로 5 실행기 지시서의 시험이다.

## 결과 보고에 넣을 것

- 시드 몇 개의 클레임·수금 계획 표(순수 함수 출력), 시험 구동기로 만든 계약의 `components` 표(값을 고치지 않고 적기만). 미수의 비용이 환율과 원화 압박뿐이고 이자가 없다는 한계를 적는다. 90일 정책 실행은 경로 5에서 한다.
- 첫 화면 gzip 전후, 시험 수, 세 덤프의 `cmp`, 변형 표, 범위 밖 발견, 질문.

## 허브 검토 46건 처리표

번호는 `docs/ai/design/path3-price-risk-2026-10/REVIEW-HUB-2026-10-16.md`의 번호다. 다섯 문서(판정표·설계·TASK-0062~0064)에 같은 표를 붙였다.

| # | 처리 | 반영한 곳과 이유 |
|---|---|---|
| 1 | 반영(H5-5 a) | 신고일(도착일) 세율 + 시행 지연 [0,3]일(흐름 `…:lag`). 정시 계약 시험·‘정시 노출’ 시험, 진단 T. DESIGN 4.1, 0063 1절, 판정표 3.2 |
| 2 | 반영(H5-1) | 기준 회사 원화 환전 규칙을 의사코드로 고정하고 ‘비교 대상’에 넣음. 판정표 0절 2·6.1 |
| 3 | 반영(H5-2) | 대상 계약 집합(완료+열린+취소), 5% ≤ 비율 ≤ 25%, 따로 적을 수. 판정표 2절 |
| 4 | 반영(H5-3) | 손잡이 정의표(자료 경로·1단위·허용 범위), 1회 = 손잡이 하나 최대 2단위, 순서 화살표 규칙, ‘근처’ = L1 ≥ 20%, J1 실패 시 측정 멈춤. 판정표 5절 |
| 5 | 반영(H4) | 0062 0단계 rules-2 골든(`check_rules2_golden.mjs`, `review_checks` 한 줄). 400회 `run`은 rules-1 전용으로 명시. DESIGN 2절 2, 0062 0단계 |
| 6 | 반영(H0) | 합산 범위를 H0대로 좁힘. 미리보기 기존 칸 통화별, 새 칸 `referenceEstimate`만, 분석값은 rules-3 실행기만. `contractRiskReport` 원화 환산은 허브 확인 Q-A로 남김 |
| 7 | 반영 | 과세가격 = 원화 매입액 ÷ 수락일 참고 환율(계약 내내 고정), 관세 = × 도착일 세율. 가정 문장(WTO 관세평가협정 제1조, CIF는 경로 6). DESIGN 3.3, 0062 3절 |
| 8 | 반영(H0로 대체) | USD 환산 칸을 두지 않음. `schedule[].currency`, `cashNeedByCurrency`를 rules-3에만. 경로 11 화면은 원화 틀 기본·‘참고 환율 환산’ 표지. DESIGN 3.4 |
| 9 | 반영(지렛대 삭제) | 시장 노출 기간 지렛대를 설계에서 뺌(주 단위 걸음 유지). 환전 시점은 ‘예측으로 이길 수 없다’ 명시. 경계 자르기 한계 기록. DESIGN 3.2·3.5 |
| 10 | 반영 | 두 층 손상 분포(작은 1~5% 80%, 큰 15~30% 20%), 하한 < `MARGIN_BUFFER` 10%. 손잡이(큰 손상 가중치), 진단 C, 판매 견적 ID 추첨 키. DESIGN 5.1, 판정표 5절 |
| 11 | 반영(B안) | 클레임은 품목 파손 등급, 수금은 거래처 가상 신용등급에 묶고 미리보기 `riskGrades`로 공개(화면은 경로 11). 국가·도시 단위 등급은 쓰지 않음. DESIGN 5절, 0064 1절 |
| 12 | 반영 | 손잡이별 현실 상한(환율 걸음 ≤ 300 등), 노출 구조 경고, 1,300은 2023년 수준 설계값 명시. 숫자는 허브 확정(Q-B). 판정표 5.2·5.3, DESIGN 3.2 |
| 13 | 반영 | 사건 = 도착국 단위, 같은 걸음을 모든 품목에, 품목별 자르기, 순서 보존 시험, 무의미 사건 생략, 기준 세율 예시 > 0. DESIGN 4.1, 0063 1절 |
| 14 | 반영 | [수입 07-03-03] 근거를 경로 3에서 빼고 0064는 ‘일부만 준비’로 한정. 결제 방식은 범위 밖(경로 7). DESIGN 머리·3.1, 0064 머리 |
| 15 | 반영 | 매입 통화는 `rowCurrency`로 유도, 행에 칸 없음. `marketTable` 통화. 행 키 집합 시험. DESIGN 3.3, 0062 3절 |
| 16 | 반영(H0) | `cashNeed`는 USD 부분(number 유지), `cashNeedByCurrency`, `schedule` 통화 칸, 환산은 새 칸만. DESIGN 3.4 |
| 17 | 반영 | 단계별 평가일 표, 약정·청구 결제일 용어, `open_valuation` 단계, 미지급은 갚은 날 환율로 `fx` 단계. DESIGN 3.4 |
| 18 | 반영(=3) | 판정표 2절 대상 계약 집합 |
| 19 | 반영 | 분석값 식(센트 = USD + halfUp(KRW ÷ 13)), `cell()`을 쓰는 판정 목록, J3 후보에서 `MARGIN_BUFFER`·`FOCUS`·`EXPAND` 제외. 판정표 2절·3.2 |
| 20 | 반영 | (가)·R0을 새 실행기로 재실행해 표 ①·⑤ 대조, 전체 묶음 정의, 6조건, 비용 재추정. 판정표 1.3 |
| 21 | 반영 | 공유 프로필 하나, 조정 때 (가)·R1~R3도 재실행, `tariff.base`는 모든 품목, 검사기는 품목 자료 기준. 판정표 5.1, DESIGN 6절 |
| 22 | 반영 | L3에 시드 짝 부호 검정(문턱표 미리 계산), L2에 시드 짝 조건, `MARGIN_BUFFER`는 직접 무역만. 0.75배는 ‘설계 판단’으로 근거 문장 고침. 판정표 3.2·6.2 |
| 23 | 반영 | 표본 밖 대상 5조건·묶음, 최종 판정(두 묶음 모두 통과), v2 시드 1061~1080, (가)·R1~R3 표본 밖 J4d 기록만. 판정표 4절 |
| 24 | 반영(H1) | (다) = 화장품+조미김 G=2. 방법 2를 ‘엔진 변경’으로 표시. 판정표 3.3 |
| 25 | 반영(=20) | 새 정책을 전체·줄인 묶음 모든 조건에. L0는 새 정의로 20시드 집계. 판정표 1.3·3.2 |
| 26 | 반영 | 열린 계약은 캠페인 마지막 날 참고 환율로 평가, 고정 환율 평가는 민감도. 고정 환율 출처 하나(`fx_krw_per_usd`)와 검사기. 판정표 2절, DESIGN 3.4·6절 |
| 27 | 반영(H1) | 세 선택지를 기록하고 이 판본은 ③. 판정표 3.3 |
| 28 | 반영 | `contractRiskReport`가 주선도 받음, J7 옛 정의·새 정의 분리 보고. DESIGN 3.4, 판정표 3.1 |
| 29 | 반영 | 환전 불변식 rules-3 참고 환율, `exchangeAmounts(seed, day)`. 0062 2·6절 |
| 30 | 반영(7과 합침) | 과세가격 수락일 고정이라 시험 문구를 ‘도착 관세 = 수락일 기준값’으로. 미래 누설 변형 추가. 실패 기록은 수락일 환율. 0062 시험·변형 |
| 31 | 반영 | 실패 기록 USD 몫만, `PURCHASE-` 접두어, 시험·변형. 0062 3절 |
| 32 | 반영 | `usdLotKrw`·`lotsToSurvive` 등 그날 환율. 판정표 6.1도 같은 함수. 0062 2절 |
| 33 | 반영 | `withRiskLevel`을 `src/engine/risk.ts`에 고정. DESIGN 7절, 0062 5절 |
| 34 | 반영(=5) | 명령을 지시서 ‘지켜야 할 것’에 명시. 판정표 0절 5 |
| 35 | 반영(가안) | 정적 매입 견적도 KRW로 변환, 분기 조건은 ‘매입 통화 ≠ 판매 통화’, 부대비의 단일 통화 분기. DESIGN 3.3·4.2 |
| 36 | 반영 | `preview(…, opts)`, 시드 출처 명시·시험, `dutyFor` 서명 고정, 실행기 호출 정정(`operations-policy.ts:118·129`). DESIGN 1·3.3·3.4, 판정표 6.2 |
| 37 | 반영(=29·31) | 0062 3·6절 |
| 38 | 반영 | rules-3 로더 분기·스키마는 TASK-0065로. 0062는 타입과 검사기 반례(문장 단언)만. 0062 1절 |
| 39 | 반영 | 변형 1을 ‘rules-3이 고정 환율을 씀’으로 교체, rules-2 로그 변형 추가, 원래와 같은 변형은 이유 보고. 0062 변형 표 |
| 40 | 반영 | 0063·0064 옛 값 불변은 저장소 밖 덤프 `cmp` 절차, 시험은 ‘새 층이 꺼진 설정’으로. 0063·0064 지켜야 할 것 |
| 41 | 반영(=46) | 0064 ‘캠페인 끝’ 시험 |
| 42 | 반영 | `receivableSchedule`, `openInvoices` 남은 금액, `OVERDUE` 전이, `nextReceipt`(operations.ts 범위 한정), `progress.ts`·UI는 범위 밖 발견. 0064 2·3절 |
| 43 | 반영 | 추첨 키 = 판매 견적 ID, 공통 난수 시험·변형, 판정표 2절에 공통 난수 명시 |
| 44 | 반영(=42) | `upcomingPayments`는 손대지 않음 |
| 45 | 반영 | `operations.ts`를 `nextReceipt` 계산으로 한정해 허용 |
| 46 | 반영 | ‘캠페인 끝’ 시험을 엔진 수준 단언으로, 분석값은 경로 5 실행기 시험으로 |

- 기각은 없다. 선택지가 있던 항목은 이렇게 골랐다: 9번은 지렛대 삭제, 11번은 B안(보이는 등급), 24·27번은 H1(G=2), 35번은 가안.
- 허브 확인이 남은 것: Q-A(`contractRiskReport` 원화 환산이 H0 예외에 드는가), Q-B(손잡이 허용 범위 숫자).
