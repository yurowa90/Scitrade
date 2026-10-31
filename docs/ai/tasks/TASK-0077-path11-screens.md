# TASK-0077 경로 11 화면(②-c): 외상 비교·묶이는 돈·중간 재무상태·원화 결산·놓친 견적·시나리오 선택

- **지위: 초안(세션 B, 2026-10-31). 허브 사전 검수 전이다. 승인 전에는 Codex에 넘기지 않는다.**
- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- BASE: TASK-0075 반영 기록 뒤의 개발 브랜치에서 이 지시서를 승인한 커밋이다.
  - 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
  - 초안 작성 시점 머리는 `b2c97bd`다. 그때 첫 화면 gzip은 134,724 B(index 97,764 B), `ops-screens` 청크는 9,114 B(나중에 받음)였다. 빌드 표시는 `dev`다.
- 근거
  - `docs/DECISIONS.md` ‘2026-10-31 사용자 결정: 경로 11 판단거리 1~7’
  - 허브 결정 H35-2(시나리오 select는 이 지시서에서 넣는다)
  - 세션 B 모형 `docs/ai/design/path11-ui-2026-10/README.md`(2·3·4절, 화면 5장, `mock/`)
  - 엔진 읽기 함수 `src/engine/path11-readers.ts`(TASK-0075), 줄 이름 `src/ui/path11-labels.ts`
  - 놓친 견적 기록 `state.operations.unaffordable`(TASK-0074, `src/engine/unaffordable.ts`)
- **성격: 화면만 바꾼다.** 엔진·자료·저장 형식은 바꾸지 않는다. 엔진 읽기 함수도 새로 만들지 않는다. 필요하면 멈추고 보고한다(10절).
- **범위 밖**
  - 대손 기대·확률(결정 7)
  - 학생 화면의 모의 실험 결과 문장과 교사 화면 해설(결정 6, 11절 권고)
  - 회계 분류 확정(결정 4, 교사 검토 대기)
  - 엔진 분리 TASK-0073·후보 D
  - 실기기 확인(병합 뒤 알파 점검표)
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다.

## 0. 먼저 읽을 것

줄 번호는 초안 시점(`b2c97bd`)의 값이다. 다르면 이름으로 찾는다.

**경로 11 읽기 함수: `src/engine/path11-readers.ts`**
- `creditLockPreview(s, config, buyOfferId, sellOfferId, quantity?)`
  - 조건마다 `{ termId, allowed, reasonKo, cashOut[], cashOutKrwMinor, paymentDueDay, lockDays, publishesInWindow, exposureAfterMinor, limitMinor }`를 낸다.
  - rules-4가 아니면 `[]`를 낸다.
- `receivablesByTerm(s, config)`: `{ rows[{termId, grade, currency, outstandingMinor, count, overdueCount}], totalKrwMinor }`
- `cashLockSummary(s, config)`: `{ available[], receivable[], availableKrwMinor, receivableKrwMinor, lockedShareBp }`. 운영 시나리오가 아니면 `null`이다.
- `balanceSheetAt(s, config, asOfDay)`: 통화별 장부다.
- `settlementKrw(s, config, asOfDay)`: `{ asOfDay, rateAsOf, income[], equity[], assets[], liabilities[], fxTranslationKrwMinor }`. 줄은 `{ account, krwMinor }`이고, 수익·비용·자산·부채 모두 **정상 잔액 방향이 양수**다.
- 공통: `asOfDay > s.day`이면 예외를 낸다.

**줄 이름: `src/ui/path11-labels.ts`**
- `SETTLEMENT_LINE_KO`를 **그대로** 쓴다. 문구를 고치지 않는다(결정 4, 교사 검토 대기).

**지연 청크: `src/ui/ops-screens.ts`**
- 경로 11 읽기 함수와 `SETTLEMENT_LINE_KO`를 이미 재수출한다.
- `main.ts:45-68` `ensureOpsScreens`, `:52` `opsScreen.ensure()`

**`src/ui/main.ts`의 손댈 자리**
- 견적 카드: 직접 무역 `:583-608`. 수량 칸은 `opsScreens!.quantityControl`(:606)이고, 견적 몸통은 `quoteBlock`(:500)이다.
- 수락 명령: `:1432`(`ACCEPT_TRADE`에 `quantity`만 넣는다. `creditTermId`는 아직 없다).
- 대기열 문구: `commandLabel`(:988-1000)
- 하루 단위 화면 상태 정리: `:1169-1172`(`offerQuantities`)
- `change` 처리: `:1539-1575`
  - 수량 바꾸기(`offer-quantity`)가 참고 양식이다. 다시 그린 뒤 수락 가능 여부가 바뀌면 `liveRegionText`로 한 번 알린다.
- 결산: `settlementBlock`(:882-894)
- 경영 보고 칸: `reportPanel`(:896-940), 운영 지표 `:879`
- 시나리오 select: `:411`, 제목 표 `SCENARIO_TITLES`(:43)
  - :43은 시작할 때 모든 시나리오 설정을 `loadScenario`로 만든다.

**시나리오 목록: `src/content/scenario.ts:36-49`**
- `ALL_SCENARIO_IDS`에는 `SCENARIO_M2_OPS_CREDIT`이 없다.
- `LOADABLE_SCENARIO_IDS = [...ALL_SCENARIO_IDS, 'SCENARIO_M2_OPS_CREDIT']`이다.
- 제목은 `data/scenarios.json:841` ‘외상 거래: 화장품 + 조미김 — 평택 본사 90일 운영’이다.

**고정 해시를 쓰는 시험**
- `src/ui/code-split.test.ts:11` `BASE_HTML`(first·panel·ops), 단언 :215·233·252·274·312·334·341
- `src/ui/m2a5-money-ui.test.ts:103·273·274`
- `src/ui/m2a5-ops-ui.test.ts`(`sha256`, :33)

**시나리오 목록을 단언하는 시험**
- `src/engine/save-v7.test.ts:48-49`: `ALL_SCENARIO_IDS`에 새 ID가 **없음**과 `LOADABLE` 모양
- `src/engine/m2a5-experiments.test.ts:50`
- `src/engine/sim/m2a5-sim.test.ts:233`: `ALL_SCENARIO_IDS`로 금지어 집합을 만든다.

**세션 B 모형:** `docs/ai/design/path11-ui-2026-10/mock/credit.html`·`settlement.html`·`p11.css`, 사진 다섯 장
- 숫자는 이전 프로필 값이라 지금 엔진 값과 다르다. 배치만 참고한다.

## 1. 지켜야 할 것

1. **새 화면 코드는 모두 `ops-screens` 지연 청크에 둔다.**
   - 새 화면 파일(예: `src/ui/path11-screens.ts`)은 `ops-screens.ts`에서만 재수출한다.
   - `main.ts`는 지금처럼 `opsScreens!.…`로만 부른다. `main.ts`와 첫 화면 모듈이 새 파일을 정적으로 가져오지 않는다.
2. **첫 화면 예산**(5절)
   - 화면 몫은 gzip **≤ 300 B**다.
   - 시나리오 select 추가분은 따로 재서 따로 적는다.
3. **새로 부를 첫 화면 함수는 허용 목록뿐이다(5.2).**
   - 지연 모듈이 첫 화면 모듈의 함수를 처음 부르면, 그 함수의 몸이 첫 화면에 실린다(TASK-0074·0075 실측: ‘유령 의존’).
   - 목록 밖 함수를 불러야 하면 멈추고 보고한다.
4. **rules-4가 아닌 시나리오의 화면은 바이트로 같다.** 단, 시나리오 select의 새 `<option>` 한 줄은 예외다(6절 시험 9).
   - 새 블록은 `config.rules.rulesVersion !== 'M2a-rules-4'`이면 빈 문자열을 낸다.
   - 운영 결산(rules-2)도 지금 문자열 그대로다.
5. **미래 누설 금지(결정 7)**
   - 대손·지연 확률, 기대 손실, ‘대손 기대’ 문구를 보이지 않는다.
   - 선택하는 순간에는 거래처 등급과 ‘늦게 낼 수 있음’만 보인다.
   - 일어난 뒤에는 확정 대손(`BAD_DEBT`)과 연체 상태(`overdueCount`)를 보인다.
   - 읽기 함수가 주는 값만 쓴다. 화면에서 `referenceRate`를 직접 부르지 않는다.
6. **모의 실험 결과 문장과 실제 통계는 학생 화면에 쓰지 않는다**(결정 6). 예: ‘43%’, ‘시드’, ‘모의 실험’, ‘K-Sight’, ‘연체율’.
7. **숫자는 읽기 함수에서 그대로 가져온다.**
   - 화면에서 금액을 다시 계산하지 않는다.
   - 허용되는 계산은 손익계산서의 소계·합계 덧셈뿐이다(3.4).
8. 실명 기업·공공기관 업무 흉내는 쓰지 않는다. 거래처 이름은 `counterpartyNameKo`를 그대로 쓴다.
9. 기존 시험은 고치지 않는다. 예외는 6절 시험 9의 해시 처리 방식 하나뿐이다.
10. 커밋·푸시·브랜치 전환은 하지 않는다(공통 규칙).

## 2. 바꾸는 파일(이 목록뿐)

| 파일 | 바꾸는 것 |
|---|---|
| `src/ui/path11-screens.ts`(새) | 3.1~3.5의 화면 함수 |
| `src/ui/ops-screens.ts` | 새 함수 재수출 한 줄 |
| `src/ui/style.css` | 새 클래스. 지연 청크용 CSS가 따로 없으므로 여기에 둔다. **CSS gzip 증가는 5절 예산에 포함한다** |
| `src/ui/main.ts` | 호출 자리(견적 카드·경영 보고·결산), `ACCEPT_TRADE`의 `creditTermId`, `change`·`toggle` 처리, 대기열 문구, select 목록 |
| `src/ui/session.ts` | `initialUiState`에 `creditTerms: Record<string, CreditTermId>`, `creditTermsDay`, `path11Open: string[]`(펼친 `details` 키) |
| `src/ui/path11-screens.test.ts`(새), `src/ui/code-split.test.ts` | 6절 시험. `code-split.test.ts`는 시험 9의 방식 변경과 새 단언 추가만 한다 |

- CSS를 지연 청크로 옮기는 일은 이번에 하지 않는다. 예산을 넘으면 멈추고 보고한다.
- 결과 보고에 `grep -rn "path11-screens\|creditTerms\|path11Open\|SCENARIO_M2_OPS_CREDIT" src` 전후를 붙인다.

## 3. 화면

공통

- 모든 블록은 rules-4에서만 그린다.
- 금액은 `formatMoney(통화, 값)`로 보인다.
- 원화 환산 값은 KRW다.

### 3.1 견적 카드의 외상 조건(결정 5: 기본 접기)

**자리:** 직접 무역 카드의 수량 칸 다음, `quoteBlock` 앞이다.

**보이는 것(접힘 상태)**
1. `fieldset` + `legend` ‘대금 받는 조건’과 라디오 셋이다.
   - 라벨은 ‘대금일에 받기 / 15일 외상 / 30일 외상’이다.
   - 각 라디오 아래 작은 글에 ‘N일 · 판매가 그대로/+3%/+6%’를 적는다.
   - 받는 날은 `creditTermOptions().paymentDueDay`다.
   - 판매가 비율은 설정 자료 `config.operations.risk.credit.terms[].premiumBp`를 읽는다. 함수 호출이 아니라 자료 읽기이고, 판매대금으로 거꾸로 계산하지 않는다.
   - 등급은 `creditTermOptions().grade`다.
   - 기본 선택은 **BASE**다.
   - `allowed === false`인 조건은 `disabled`로 두고, 옆에 `reasonKo`를 보인다(예: ‘외상 한도 초과’).
   - 터치 프로필에서 라벨 높이는 44px 이상이다.
2. 고른 조건의 한 줄 요약
   - 예: ‘49일에 받음 · 41일 묶임 · 그동안 견적 공개 5번’
   - 값은 `paymentDueDay`·`lockDays`·`publishesInWindow`에서 가져온다.
3. 거래처 등급 한 줄: ‘거래처 B등급 · 늦게 낼 수 있음’. 확률은 쓰지 않는다.

**`<details>` ‘조건 비교’(기본 닫힘)**
- 표: 열은 BASE·D15·D30이다. 행은 다음과 같다.

  | 행 | 값 |
  |---|---|
  | 판매대금 | `creditTermOptions`의 판매대금 |
  | 대금 받는 날 | |
  | 묶이는 돈 | 원화 한 줄 `cashOutKrwMinor`와 통화별 `cashOut` |
  | 묶이는 기간 | |
  | 그 사이 견적 공개 | |
  | 외상 한도 사용 | `exposureAfterMinor` / `limitMinor`. BASE는 ‘—’ |

  - `caption`이 있다. 고른 열은 `aria-selected`가 아니라 열 머리의 ‘(고름)’ 글로 표시한다.
- 막대 타임라인은 장식이다(`aria-hidden`). 같은 내용이 표에 있어야 한다.
- 사실 상자 ‘지금 회사 돈’
  - `cashLockSummary`의 가용 원화 환산
  - 이 거래 뒤 가용
  - 이미 받을 돈
- 질문 상자 ‘생각해 볼 질문’(결론 없음)
  - 문구는 세션 B 모형 `credit.html`의 두 줄을 숫자만 바꿔 쓴다.
  - 결정 6의 모의 결과 문장은 넣지 않는다.

**동작**
- 라디오를 바꾸면 `ui.creditTerms[key]`에 넣고 다시 그린다.
  - 다시 그린 뒤 초점은 같은 라디오에 남는다(수량 select와 같은 방식).
  - 수락 가능 여부가 바뀌면 `liveRegionText`로 한 번 알린다.
- `ui.creditTerms`는 날이 바뀌면 비운다(`offerQuantities`와 같은 규칙, :1169).
- 견적이 닫히면 그 키를 지운다.
- `details`의 열림 상태는 `ui.path11Open`에 키로 남긴다. 다시 그려도 유지되고, 날이 바뀌면 비운다.
- 수락: `ACCEPT_TRADE`에 `creditTermId: ui.creditTerms[key] ?? 'BASE'`를 넣는다(rules-4에서만).
  - rules-1~3 명령 모양은 지금과 같아야 한다(키 없음).
- 대기열 문구: rules-4이고 BASE가 아니면 `commandLabel`의 직접 무역 줄 끝에 ‘ · 30일 외상’을 붙인다.

### 3.2 묶이는 돈 상자(결정 2)

**자리:** 경영 보고 칸(`reportPanel`)의 운영 지표 위.

**보이는 것**
- 한 줄: ‘받을 돈으로 묶인 돈 ₩X · 쓸 수 있는 돈 ₩Y (묶인 비율 Z%)’
  - X = `receivableKrwMinor`, Y = `availableKrwMinor`
  - Z = `lockedShareBp / 100`, 소수 한 자리. `null`이면 ‘—’다.
- `<details>` ‘통화별·조건별’
  - 통화별 `available`·`receivable` 표
  - `receivablesByTerm.rows` 표: 열은 조건·등급(없으면 ‘주선’)·통화·남은 금액·건수·연체 건수다.
- 297px 칸에서 가로 넘침이 없어야 한다.

### 3.3 중간 재무상태(결정 3)

**자리:** 경영 보고 칸, 3.2 아래.

**고를 수 있는 날**
- 30일, 60일, ‘어제 마감’(`s.day − 1`) 가운데 `≤ s.day − 1`인 날만 보인다.
- `s.day − 1 < 1`이면 블록을 그리지 않는다.
- 고르는 칸은 `select`나 두세 개의 단추다. 고른 날은 `ui`에 두고, 날이 바뀌어도 유지한다. 단, 고를 수 없게 된 값은 ‘어제 마감’으로 돌린다.

**칸 안(좁은 칸)**
- 자산 구성 막대(`role="img"`, `aria-label`에 비율)
- 네 숫자: 현금, 받을 돈, 재고, 미지급금
  - 이름은 `SETTLEMENT_LINE_KO`를 쓴다(‘받을 돈’ 등).
  - 값은 `settlementKrw(s, config, 고른 날).assets/liabilities`에서 가져온다.

**‘재무제표 보기’ 단추**
- 3.4의 전체 표를 가운데 칸의 대화상자(기존 지도 상세·상황실과 같은 초점·Escape 규칙)로 연다.
- 297px 칸에 전체 표를 넣지 않는다(세션 B 실측 1,808px).

### 3.4 원화 환산 결산(결정 2·4)

**자리**
- 3.3의 대화상자 본문
- 캠페인이 끝난 뒤의 결산(`settlementBlock`)
  - rules-4이면 맨 위에 이 표를 두고, 기존 통화별 결산은 `<details>` ‘통화별 장부’로 접는다.
  - rules-4가 아니면 지금 그대로다.

**손익계산서 순서**
- 표 하나로 만든다. 줄 이름은 `SETTLEMENT_LINE_KO[account]`다. 값이 0인 줄은 접힌 ‘0원 항목’으로 모은다.

| 묶음 | 계정 |
|---|---|
| 영업수익 | `REVENUE`, `SALES_ALLOWANCE`(차감으로 −), `FORWARDING_REVENUE` |
| 매출원가 | `COST_OF_GOODS_SOLD`, `FORWARDING_COST` |
| 소계 | **매출총이익** |
| 판매비와관리비 | `WAGE_EXPENSE`, `RECRUITMENT_EXPENSE`, `TRAINING_EXPENSE`, `CULTURE_EXPENSE`, `RENT_EXPENSE`, `FACILITY_SETUP_EXPENSE`, `SPACE_CONTRACT_EXPENSE`, `BAD_DEBT`, `CANCELLATION_EXPENSE` |
| 소계 | **영업이익** |
| 영업외 | `FX_SPREAD_EXPENSE`, `RECEIVABLE_CARRY`, 환율 변동 손익(`fxTranslationKrwMinor`) |
| 합계 | **당기순이익** |

- 묶음 머리 글(‘영업수익’ 등)과 소계 이름은 임시 문구다. 교사 검토 대기 표시(작은 글 ‘분류 검토 중’)를 표 아래에 한 번 둔다.
- `CANCELLATION_EXPENSE`의 위치는 교사 검토 항목으로 결과 보고에 적는다.

**재무상태표**
- 자산(`assets`), 부채(`liabilities`), 자본(`equity` + ‘쌓인 이익’ = 당기순이익)
- 670px 가운데 칸에서는 손익계산서 옆, 좁으면 아래에 둔다. 금액은 줄바꿈하지 않는다.

**머리 한 줄:** ‘원화로 환산했습니다. 손익은 거래한 날의 참고 환율, 재무상태는 N일 참고 환율 ₩R/$로 바꿨습니다.’ R = `rateAsOf`다.

**검산(시험 4로 고정)**
- Σ자산 − Σ부채 = Σ자본 줄 + 당기순이익
- 당기순이익 = Σ수익 − Σ비용 + `fxTranslationKrwMinor`(부호 그대로)
- 대조값(손 계산 기대값이 아니다): 시드 2001, `SCENARIO_M2_OPS_COS_LAVER` R4 `TERM_GREEDY`, 31일 아침, `asOfDay = 30`

  | 항목 | 값 |
  |---|---|
  | 상품 매출 | ₩10,481,621 |
  | 매출원가 | ₩8,387,368 |
  | 주선 매출 | ₩6,134,300 |
  | 주선 원가 | ₩1,487,200 |
  | 급여 | ₩4,800,000 |
  | 임차료 | ₩450,000 |
  | 환전 비용 | ₩43,900 |
  | 환율 변동 | −₩615,709 |
  | **당기순이익** | **₩831,744** |
  | 자산: 현금 | ₩1,657,820 |
  | 자산: 선급운임 | ₩495,200 |
  | 자산: 받을 돈 | ₩12,578,724 |
  | 시작 자본 | ₩13,900,000 |

  - 세션 B가 `b2c97bd`에서 읽기 함수로 얻은 값이다.
  - 화면 시험의 기대값은 같은 상태에서 읽기 함수를 불러 얻는다. 이 숫자를 시험에 박지 않는다.

### 3.5 놓친 견적 사실 상자

**근거:** `state.operations.unaffordable`
- 공개일에 최소 수량조차 살 돈이 없던 짝이다(`unaffordable.ts`). 기록은 `day`·`buyOfferId`·`sellOfferId`·`quantity`·`shortfalls[{currency, needMinor, availableMinor}]`를 가진다.

**자리:** 3.3 블록 아래(‘자금 부족으로 못 받은 견적’)와 3.4 대화상자의 사실 상자.

**보이는 것**
- 날짜별 한 줄: ‘15일 2건 — 원화 부족(필요 ₩2,649,600, 가용 ₩1,044,200)…’
  - 품목·도시는 `offerDef`·`goodOf`·`cityName`으로 적는다.
  - 3건이 넘는 날은 `<details>`로 접는다.
- 고른 날(3.3)까지의 기록만 보인다(`day ≤ asOfDay`).
- 기록이 없으면 ‘없음’이다.
- 문장은 사실만 쓴다. 해석(‘외상 때문에’)은 쓰지 않는다.
- 대조값: 위 판에서 15·22·29일 각 2건, 모두 원화 부족이다. 22일은 USD도 부족하다.

### 3.6 시나리오 select(H35-2)

- select에 `SCENARIO_M2_OPS_CREDIT`을 넣는다. 제목은 자료의 `title_ko`다.
- **권고 구현:** `ALL_SCENARIO_IDS`는 바꾸지 않는다.
  - 근거: `save-v7.test.ts:48`이 ‘없음’을 단언하고, `m2a5-sim.test.ts:233`·`m2a5-experiments.test.ts:50`이 이 목록을 쓴다.
  - `main.ts`의 select와 `SCENARIO_TITLES`가 `LOADABLE_SCENARIO_IDS`를 쓴다.
- 고른 뒤 시작 경로는 지금 그대로다. `loadScenario(id).operations`이면 `ensureOpsScreens()`를 기다린다.
- 저장 → 불러오기 → 같은 시나리오 select 표시까지 이어져야 한다.
- **첫 화면 비용 주의:** `SCENARIO_TITLES`(:43)는 시작할 때 모든 시나리오를 `loadScenario`로 만든다.
  - 새 ID를 더하면 시작 때 rules-4 변환(`withRiskLevelV2`)이 돈다. 코드는 이미 첫 화면에 있다.
  - 시간(Chromium CPU 4배 늦춤, 첫 화면 렌더까지 ms)을 BASE와 비교해 적는다.
  - 늘면 제목만 자료에서 읽는 작은 표로 바꾸는 안을 결과 보고에 제안한다(이번에 바꾸지는 않는다).

## 4. 접근성

- 라디오 묶음: `fieldset`·`legend`. `disabled` 조건은 이유가 `aria-describedby`로 이어진다.
- `details`/`summary`: 터치 프로필 44px 이상
- 표: `caption`과 `th scope`가 있다.
- 막대: 장식이면 `aria-hidden`, 정보면 `role="img"`와 `aria-label`
- 대화상자: 기존 규칙과 같다.
  - 열면 제목에 초점
  - Escape로 닫고 연 단추로 초점 복귀
  - 바깥 `inert`
- 400% 확대(256px 폭)에서 가로 넘침 0이다. Tab 순서는 화면 순서와 같다.
- 색만으로 뜻을 전하지 않는다. 음수는 ‘−’ 기호를 쓴다.

## 5. 첫 화면 예산

### 5.1 재는 법

- BASE와 작업 뒤를 각각 `git archive`로 풀어 빌드한다. 빌드 표시는 둘 다 `dev`다.
- 둘 다 `node tools/check_bundle_size.mjs dist`를 실행해, 첫 화면 gzip·index gzip·CSS gzip·`ops-screens` gzip 차이를 표로 적는다.
- **화면 몫**: 3.6을 뺀 변경으로 한 번 빌드한다. 첫 화면 gzip 차이 ≤ **300 B**다.
- **select 몫**: 3.6만 더한 빌드와의 차이를 따로 적는다. 한도는 두지 않는다. 300 B를 넘으면 원인 줄을 적는다.
- `ops-screens` 청크는 ‘나중에 받음’으로 남아야 한다.
- 새 고유 문자열 둘(‘조건 비교’, ‘자금 부족으로 못 받은 견적’)은 `index-*.js`에 없고 `ops-screens-*.js`에 있어야 한다(TASK-0075 시험 10과 같은 방식).

### 5.2 새 화면 코드가 부를 첫 화면 함수(허용 목록)

아래는 지금 `main.ts` 정적 닫힘 안에서 이미 쓰는 함수다. 새로 불러도 첫 화면 몸이 늘지 않을 것으로 본다. 확인은 5.1의 차이로 한다.

| 함수 | 모듈 | `main.ts`가 이미 씀 |
|---|---|---|
| `formatMoney` | `engine/money` | :12 |
| `esc` | `ui/html` | :6 |
| `cityName` | `engine/engine` | :11 |
| `goodOf`·`unitKo` | `engine/catalog` | :10 |
| `offerDef` | `engine/market` | :21 |
| `counterpartyNameKo` | `ui/ops-labels` | :23 |
| `qtyKo as reportQtyKo` | `ui/reports` | :27 |
| `liveRegionText` | `ui/session` | :20 |
| `creditTermOptions` | `engine/readers` | 아니다. TASK-0075의 `creditLockPreview`가 이미 불러 첫 화면에 실렸다(+208 B에 포함). 새로 늘지 않아야 한다 |

- 경로 11 읽기 함수 다섯과 `SETTLEMENT_LINE_KO`는 이미 `ops-screens`에 있다.
  - 이 함수들이 안에서 부르는 `creditTermOptions`·`receivableSchedule`은 TASK-0075에서 이미 +208 B로 첫 화면에 실렸다. 이번 예산과 따로 센다.
- **목록 밖 첫 화면 함수**(예: `campaignSummary`, `quotePreview`, `referenceRate`, `tradeFundsCheck`)를 새 파일에서 부르려면 멈추고 보고한다.
- `main.ts`에서 이미 계산한 값을 인수로 넘기는 것은 허용한다.

## 6. 시험(새 파일 `src/ui/path11-screens.test.ts`, 시드 2001 이상)

상태 만들기는 `SCENARIO_M2_OPS_CREDIT` 시작과, 기존 sim 도우미(`simulate` + `TERM_GREEDY`)의 관찰 상태 둘을 쓴다.

1. **외상 조건 기본값과 접힘**
   - rules-4 카드에 라디오 셋, 기본 BASE, `details` 닫힘이다.
   - D30을 고르면 대기열 명령의 `creditTermId`가 `'D30'`이고, 대기열 문구에 ‘30일 외상’이 있다.
   - 한도 초과 상태를 만들면 그 라디오가 `disabled`이고 이유가 보인다.
2. **비교표 값 = 읽기 함수 값**
   - 표의 판매대금·받는 날·기간·공개 수·한도 사용이 `creditLockPreview`·`creditTermOptions`와 같다.
   - 화면 재계산이 아니라는 것을 문자열 일치로 확인한다.
3. **묶이는 돈 상자**
   - 한 줄의 세 값이 `cashLockSummary`와 같다.
   - `lockedShareBp = null`이면 ‘—’다.
   - 조건별 표의 행 수가 `receivablesByTerm.rows`와 같다.
4. **중간 재무상태·원화 결산**
   - 고를 수 있는 날이 `≤ s.day − 1`뿐이다(31일 아침에 30일 있음·60일 없음).
   - 3.4의 검산 두 식이 화면 숫자로 성립한다.
   - 줄 이름이 `SETTLEMENT_LINE_KO`와 같다.
   - 손익계산서 줄 순서가 3.4 표와 같다.
5. **놓친 견적:** 31일 아침 상태에서 15·22·29일 줄이 각 2건이다. 고른 날이 14면 ‘없음’이다.
6. **누설 없음:** rules-4 화면 전체 HTML에 ‘확률’, ‘기대’, ‘%’와 ‘대손’이 함께 든 문장, ‘시드’, ‘모의’, ‘K-Sight’, ‘연체율’이 없다.
7. **rules-1~3 불변:** 기본 시나리오와 `SCENARIO_M2_OPERATIONS`의 견적 카드·경영 보고·결산 HTML이 BASE와 같다(시험 9 방식으로 select 한 줄만 뺀다).
8. **시나리오 select**
   - 새 option이 있다.
   - 고르면 `ensureOpsScreens` 뒤 `SCENARIO_M2_OPS_CREDIT`으로 시작한다.
   - 저장 → 불러오기 뒤 select 값이 같다.
9. **고정 해시 처리**
   - `BASE_HTML` 세 값은 **바꾸지 않는다**.
   - 대신 비교 전에 새 `<option value="SCENARIO_M2_OPS_CREDIT"…>…</option>` 한 조각만 지운 HTML로 해시를 잰다. 지운 조각이 정확히 한 번 있었음도 단언한다.
   - `m2a5-money-ui`·`m2a5-ops-ui`의 해시는 select를 포함하지 않으면 그대로 통과해야 한다. 포함한다면 같은 방식으로 처리하고 결과 보고에 적는다.
10. **청크:** `main.ts` 정적 닫힘에 `path11-screens.ts`가 없다. 5.1의 고유 문자열 두 개가 index에 없고 `ops-screens`에 있다.
11. **열림 상태 유지:** ‘조건 비교’를 연 뒤 수량을 바꿔 다시 그려도 열려 있다. 다음 날에는 닫혀 있다.

## 7. 변형 시험

독립 사본에서 하나씩 적용하고 지정 시험이 실패하는지 적는다(TASK-0075 6절 방식).

| 변형 | 잡아야 할 시험 |
|---|---|
| V1 기본 조건을 D30으로 | 1 |
| V2 비교표 판매대금을 `quotePreview().sale`로 다시 계산 | 2 |
| V3 고를 수 있는 날에 `s.day` 포함 | 4(또는 예외) |
| V4 환율 변동 손익 부호 뒤집기 | 4 |
| V5 놓친 견적에서 `day ≤ asOfDay` 거르기 삭제 | 5 |
| V6 등급 줄에 확률 문구 추가 | 6 |
| V7 `main.ts`가 `path11-screens`를 정적 import | 10과 5.1 예산 |
| V8 rules-2에서도 새 블록 그림 | 7 |
| V9 `path11Open`을 다시 그릴 때 비움 | 11 |

## 8. 화면 실측(세션 B가 병합 전에 잰다)

Sol은 아래 조건을 스스로 확인할 수 있는 만큼만 적는다. 세션 B가 Chromium으로 다시 잰다. 실기기 확인은 병합 뒤 알파 점검표로 둔다.

**프로필**
- 1024×768 터치(iPad mini 가로)
- 1180×820 터치(iPad Air 가로)
- 1366×768 마우스(크롬북)
- 400% 확대(256px)

**조건**

| 항목 | 기준 |
|---|---|
| 가로 넘침 | 0(문서·카드·표·297px 경영 보고 칸) |
| 견적 카드 높이 증가(접힘, 1024) | BASE 대비 ≤ 160px. 펼침은 기록만 한다 |
| 터치 대상 | 라디오 라벨·`summary`·단추 ≥ 44px(터치 프로필) |
| 초점 | 라디오를 바꿔 다시 그린 뒤 같은 라디오. 대화상자 Escape 뒤 연 단추 |
| 낭독 | 조건을 바꿔 수락 가능 여부가 바뀔 때 한 번 |
| reduced-motion | 새 애니메이션 0 |

- 측정 상태: `SCENARIO_M2_OPS_CREDIT`, 시드 2001. 8일 아침(견적 공개일)과 31일 아침이다.

## 9. 결과 보고

`docs/ai/tasks/results/TASK-0077.md`에 다음을 적는다.
- BASE
- 바꾼 파일과 2절 grep 전후
- 5.1 예산 표(화면 몫·select 몫 따로)와 5.2 목록 밖 호출 여부
- 시험 결과
- 7절 변형 표
- 3.6 시작 시간 비교
- 교사 검토 항목(`CANCELLATION_EXPENSE` 위치, 묶음 머리 글)
- 남은 일

## 10. 멈춤 조건

- 화면 몫 > 300 B
- 목록 밖 첫 화면 함수가 필요함
- 읽기 함수와 설정 자료에 없는 값이 필요함
- rules-1~3 HTML이 option 한 줄 밖에서 달라짐
- 기존 시험이 깨짐
- 미래 누설 시험(6)을 지킬 수 없음

## 11. 교사 화면 해설: 이번 범위 밖 권고(세션 B)

**권고: 나눈다.** 이유는 셋이다.
1. 지금 게임에는 교사 화면(교사 모드·교사 전용 칸)이 없다. 이번에 넣으면 ‘누가 언제 보는가’를 새로 설계해야 해서 범위가 커진다.
2. 결정 6은 학생 화면과 다른 상자를 요구한다. 그 상자가 학생 화면 안에 접혀 있으면, 학생이 열어 볼 수 있어 결정의 취지가 약해진다.
3. 문구가 아직 확정되지 않았다. 실제 통계(K-Sight)와 게임 설정을 나누는 문장, ‘게임은 기간을 줄여 단순화했다’는 교사·세션 C 검토를 거쳐야 한다. 그러면 화면 코드보다 문서가 먼저다.

**대안**
- 첫 단계: 교사용 안내 문서(저장소 문서, 화면 밖)로 만든다. 맡는 곳은 세션 C·허브다.
- 둘째 단계: 알파 관찰 뒤 교사 화면 자체가 필요하면 별도 지시서로 연다.
