# M2a-5 규칙 명세 — 반복 견적·창고·고정비·환전·지급 불이행

## 0. 이 문서

- 작성: Claude(설계 하위 작업), 2026-10-10. 대상: Codex Astra(엔진·자료·검사기·시험·비교 실행기). 16절은 뒤에 Sol(화면) 지시서의 재료다.
- 기준: 개발 브랜치 `bacedfa`(코드·자료). 결정 기록은 `docs/DECISIONS.md` ‘사용자 결정 일괄 채택’(1068~1103행)이다. 작성 중 같은 작업 트리에 `9a5919c`(결정 기록)·`e4f7dfa`(CI)로 커밋됐고, 코드·자료는 바뀌지 않아 행 번호는 그대로다. 저장소 파일은 하나도 고치지 않았다.
- 근거 표기: `DESIGN:n`은 `docs/DESIGN_v0.4.md` n행, `DECISIONS:n`은 `docs/DECISIONS.md`(`9a5919c`), `CL:n`은 `docs/CLASSIC_GAME_INSIGHTS.md`, `PACKET`은 `docs/ai/design/DECISION-PACKET-2026-10.md`, `DRAFT §n`은 `docs/ai/design/M2A5-market-warehouse-draft.md`의 절이다. 코드는 `파일:행`(기준 `bacedfa`)이다.
- **모든 금액·물량·한도는 DESIGN 합성값이다.** 실제 시세·임차료·운임·임금 보정이 아니다(DESIGN:424, DRAFT 머리말).
- ‘사전 조정’이라고 쓴 값은 간이 모형(부록 A)으로 미리 맞춘 값이다. 엔진 구현 뒤 비교 실행기 20시드로 다시 재어 확정한다(DECISIONS:1076).
- 이 명세는 같은 상태·명령·시드·판본이면 같은 결과가 나오게 쓴다(`docs/ai/WORKFLOW.md` ‘상태와 시간’). 모호한 곳은 20절 열린 질문에 모았다.

## 1. 결정과 범위

| 결정 | 이 명세에서 하는 것 | 절 |
|---|---|---|
| D01 가 | 플레이어 명령 `EXCHANGE_CURRENCY`. USD→KRW 1,287원, KRW→USD 1,313원, 100 USD 단위. 명령 단계에서 실행해 같은 날 급여·고정비에 쓴다. 자동 환전 없음 | 10.1 |
| D02-① | 초안 수치를 출발값으로 쓴다(견적 공개·가격식·물량·창고 40 m³·6pt·임차료 450,000원) | 4, 6~8, 10.2 |
| D02-② 가 | 창고 확장 명령 `EXPAND_WAREHOUSE`(DK-11 최소형) | 8.5 |
| D02-③ 가 | 선복 장기 계약 명령 `SIGN_SPACE_CONTRACT`(DK-21) | 9 |
| D02-④ 가 | 자동 순서. 창고 처리 순서(묶음 원문 뜻)와 지급 순서(결정 기록 문구) 둘 다 자동으로 정한다. 플레이어 지정 명령은 없다 | 8.3, 10.3, 2절 C03 |
| D02-⑤ 가 | 본사·창고 글자 표 읽기 함수와 화면 요구 | 14.3, 16절 3항 |
| D03 나 | 주선 견적 수를 늘리고 준비 업무량을 부피에 비례시킨다. 사전 조정 결과 작업 많은 주선 등급(HANDLING)을 더했다. 임금은 그대로다 | 6.6, 7, 17 |
| D04 가 | 가장 오래된 미지급 의무 기준 경고 → 7일 뒤 위험 → 14일째 마감에 경영 실패 → 결산 → 같은 시드 다시. 실패 화면에 원인과 회복 행동 | 11, 14.6, 16절 6·7항 |
| D05~D08 | 이번 단위 밖(19절) | 19 |

## 2. 초안·결정 충돌과 해소

| 번호 | 초안·묶음 | 승인·현재 코드 | 해소 |
|---|---|---|---|
| C01 | 선복 확장은 M3로 미룸(DRAFT §10, PACKET D02-3 권장 나) | D02-③ **가**(DECISIONS:1075) | 9절에 넣는다. 첫 묶음 선복 교훈(32 > 30 m³, P0-M2A-03)을 지키려고 계약은 서명 7일 뒤 편부터 적용한다(P35). 2일 편에는 걸리지 않는다 |
| C02 | D03 권장은 가(그대로 둠). 나의 예시는 ‘주선 5건, 6 m³당 1pt, 최소 2pt’(PACKET D03) | D03 **나**: ‘특정 조건에서 고용이 이득’(DECISIONS:1076) | 예시값 그대로는 목표를 못 이룬다. 모형에서 고용 이득 0/20, 고용 시 경영 실패 19~20/20이다(17.2 표 A). 임금 0원 직원을 더해도 기여이익이 +265 USD만 는다. 병목이 직원이 아니라 USD 운전자본·창고이기 때문이다. 그래서 ‘부피 비례’를 등급별 계수로 읽고, 작업 많은 주선 등급 H1~H6을 더하고, 묶음당 주선을 6건으로 했다(P14·P16·P21). **사용자 확인 필요(20절 Q1)** |
| C03 | D02-4는 ‘업무 우선순위’(창고 처리 순서) 질문이다(PACKET D02 표) | 결정 기록 문구는 ‘④ 가 지급 우선순위 자동’(DECISIONS:1075) | 두 뜻이 다르다. 둘 다 자동으로 정한다: 창고 처리 순서(8.3), 지급 순서(10.3). 플레이어가 순서를 바꾸는 명령은 없다. 결정 기록 문구는 ‘업무(창고 처리) 우선순위’로 고칠 것을 권한다(20절 Q2) |
| C04 | 직접 무역 준비 업무량은 기본 단위 수에 비례(100개 2pt, 200개 3pt, 300개 4pt, DRAFT §2.5) | D03 나 ‘부피 비례’ | 직접 무역은 초안 규칙을 쓴다(P19). 부피 규칙을 쓰면 의류·화장품은 모두 3 m³ 이하라 늘 2pt가 되어 직원 수요가 줄어든다. 부피 규칙은 주선에만 쓴다(7절) |
| C05 | 1일 묶음 주선 준비는 건당 2pt(DRAFT §2.6, `scenarios.json` `forwarding_prep_work_units`) | D03 나 부피 비례 | `M2a-rules-2`에서는 1일 묶음에도 같은 규칙을 쓴다. 가구 24 m³(OFFER_FWD_01)는 4pt가 된다. 1일에 배정하면 2일 편에 실을 수 있어 기대 경로 USD 값은 그대로다(모형 검산, 18절 P0-M2A5-12). 1일 묶음만 2pt로 남길지는 20절 Q7 |
| C06 | 지역 요인은 매입 → 판매 4개만 뽑음(DRAFT §2.2 순서 3) | 시세표는 6행(DRAFT §3) | 6행 모두 뽑는다. 뽑는 순서는 6.3에 고정한다 |
| C07 | 묶음 구성 매입 2·판매 2·주선 3 = 7건(DRAFT §0) | D03 나 | 매입 2·판매 2·주선 6 = 10건. 읽기 부담은 20절 Q8 |
| C08 | 인수 명세 번호 P0-M2A-05~12(DRAFT §9) | 작업 지시: P0-M2A5-xx | 18절에 P0-M2A5-01~17로 다시 쓴다. 대응: 05→01, 06→02, 07→03, 08→04, 09→06, 10→07, 11→12, 12→09 |
| C09 | ‘`M2a-rules-2`에서도 기대값 보존’ + ‘기존 시험 파일은 고치지 않는다’(DRAFT §8) | 시나리오가 규칙 판본을 정한다(`scenario.ts:235-239`) | 새 시나리오 `SCENARIO_M2_OPERATIONS`(규칙 2)를 만든다. 기존 `SCENARIO_M2_MULTI_TRADE`는 `M2a-rules-1` 그대로 둔다. 기존 시험은 고치지 않고 통과한다 |
| C10 | ‘밀린 지급 → 고정비 → 급여’(DRAFT §5) | 지금 코드는 못 갚는 의무를 건너뛰고 뒤의 작은 의무를 먼저 갚는다(`engine.ts:1140` `continue`) | 규칙 2에서는 통화별 발생 순서대로만 갚는다. 앞 의무를 못 갚으면 멈춘다. 같은 통화에 미지급이 남아 있으면 새 필수 지급도 줄을 선다(10.3). D04의 ‘가장 오래된 의무’ 시계와 맞추기 위해서다. 규칙 1은 바꾸지 않는다 |
| C11 | 7.3절 간이 표(B1 끝 USD 4,045 등)(DRAFT §7.3) | D03 나 사전 조정 | 규칙이 바뀌어 그 표는 더 쓰지 않는다. 사전 조정안에서 투자 없는 회사의 분석값 중앙은 18,009로, 문구 그대로 안(5,295)의 약 3.4배다(17.2). 회사가 잘 운영하면 흑자가 된다. 환전 없이 71일 실패는 그대로다. **경제 규모 변화 확인 필요(20절 Q1)** |
| C12 | 임차료 증액분은 다음 정기 임차일부터(DRAFT §10, PACKET D02-2) | D02-② 가 원문 그대로 승인 | 그대로 쓴다. 설치 직후부터 다음 임차일까지 증액분을 내지 않는 틈이 있다. 설치비 200,000원이 일부 상쇄한다. 20절 Q3 |
| C13 | `payrollRunwayDay`에 고정비를 넣는다(DRAFT §5) | 지금 함수는 급여만 센다(`previews.ts:40-53`), 시험은 62일(`previews.test.ts:220`) | 규칙 2에서만 임차료를 넣는다(→ 56일). 규칙 1은 62일 그대로 |
| C14 | 선복 확장의 값이 없다 | D02-③ 가 | 새 DESIGN 값: 편당 +10 m³·+1,500 kg, 편당 30 USD(쓰지 않아도 냄), 해지 없음(P32~P37). 사전 조정 결과 이 계약은 드물게만 이득이다(3/20, 17.2). 20절 Q4 |
| C15 | `PAR_PAYMENT_GRACE_DAYS` = null, 임의 구현 금지(`data/parameters.json:56-60`, DESIGN:358-359) | D04 가 | 14로 정하고 경고 0일·위험 7일을 함께 둔다(P42~P44) |
| C16 | 초안 정책 모형은 ‘앞 7일 원화 부족 시 자동 환전’(DRAFT §7.3) | D01 덧붙임: 게임에는 자동 환전 없음 | 엔진에는 자동 환전이 없다. 자동 환전은 비교 실행기 정책의 행동일 뿐이다(17.3) |

## 3. 판본·시나리오·자료 파일

- **규칙 판본:** `M2a-rules-2`를 더한다(`types.ts:14`). 규칙 1의 동작은 한 줄도 바꾸지 않는다.
- **시나리오:** `SCENARIO_M2_OPERATIONS`를 `data/scenarios.json`에 새 항목으로 넣는다. 기존 `SCENARIO_M2_MULTI_TRADE` 항목을 복사하고 아래만 바꾸거나 더한다. 병합 규칙(`base_scenario_id`)에 기대지 않는다.
  - `title_ko`: ‘평택 본사 90일 운영 — 반복 견적·창고·환전’.
  - `engine_rules.rules_version`: `M2a-rules-2`. 나머지(`committed_outlays`, 주선 켬)는 같다.
  - 새 블록: `market_rules_ref`, `facility`, `fixed_costs`, `fx_exchange`, `space_contract`, `payment_default`(4절 키).
  - `contract_terms`에 `prep_work_units_per_extra_lot`, `forwarding_prep`을 더한다.
  - `scope_note`의 ‘창고는 이후 단계’를 지운다.
  - `M2_SCENARIO_IDS`에 더한다(`src/content/scenario.ts:39`). 비교 실행기 기본 묶음이 시나리오 5개가 된다.
- **새 자료 파일:** `data/market_rules.json`과 스키마 `schemas/market_rules.schema.json`. 규칙 묶음 ID `M2A5_PYEONGTAEK`.
- **바뀌는 자료:** `data/parameters.json`의 `PAR_PAYMENT_GRACE_DAYS`(값 14, `json_pointer`는 새 시나리오 `payment_default`), `PACKAGE_STATUS.json` `package_version` 올림(옛 저장 거절 정책 유지, DECISIONS:964), `MANIFEST.json`.
- **저장 형식 판본:** 6(`save.ts:19`). 5절.

## 4. 매개변수 표

‘상태’ 열: 승인 = D02-① 초안 수치, 결정 = D01·D04 원문, 새 = 이 명세의 새 DESIGN 값, 조정 = D03 사전 조정값(엔진 재측정 대상).

| ID | 뜻 | 값 | 위치(파일 · 키) | 상태 |
|---|---|---|---|---|
| P01 | 첫 공개일 | 1 | `market_rules.json` `publish.first_day` | 승인 |
| P02 | 공개 간격 | 7일 | `publish.interval_days` | 승인 |
| P03 | 마지막 공개일 | 78 | `publish.last_day` | 승인 |
| P04 | 유효기간 | 공개일 포함 3일(b ~ b+2) | `publish.valid_days` | 승인 |
| P05 | 세계 지수 시작 | 10,000 bp(= 100) | `index.start_bp` | 승인 |
| P06 | 세계 지수 범위 | 8,500 ~ 11,500 bp | `index.min_bp`·`index.max_bp` | 승인 |
| P07 | 지수 걸음 | 정수 −3 ~ +3 % | `index.step_pct` | 승인 |
| P08 | 지역 요인 | 정수 −4 ~ +4 % | `regional_pct` | 승인 |
| P09 | 거래처 차이 | 정수 −3 ~ +3 % | `counterparty_pct` | 승인 |
| P10 | 기준가 P0 (USD/단위) | 평택 의류 10.00 · 평택 화장품 40.00 · 하이퐁 의류 14.00 · 하이퐁 화장품 49.00 · 상하이 의류 13.50 · 상하이 화장품 50.00 | `rows[].base_price` | 승인 |
| P11 | 기본 단위 | 의류 100개, 화장품 50상자 | `trade.base_lot` | 승인 |
| P12 | 최대 물량 배수 | {1, 2, 3} | `trade.max_lots_choices` | 승인 |
| P13 | 판매 납기·결제 | 납기 b+7, 결제 하이퐁 b+9·상하이 b+11 | `trade.sell_deadline_offset_days`, `trade.payment_offset_days` | 승인 |
| P14 | 묶음당 주선 견적 | 6건(12개 틀에서 비복원) | `forwarding.per_batch` | 조정(묶음 예시 5) |
| P15 | 주선 틀 F1~F6 | 표 6.6-1 | `forwarding.templates[]` | 승인 |
| P16 | 주선 틀 H1~H6 | 표 6.6-2 | `forwarding.templates[]` | 조정(새) |
| P17 | 난수 흐름 이름 | `MARKET-B` + 두 자리 k | `rng.stream_prefix` | 승인(자리 수는 새) |
| P18 | 수출 준비 기본 | 2pt | `scenarios.json` 새 항목 `contract_terms.prep_work_units` | 기존 |
| P19 | 직접 무역 단위 추가분 | 기본 단위 하나 늘 때 +1pt | `contract_terms.prep_work_units_per_extra_lot` | 승인 |
| P20 | 일반 주선 계수 | 6 m³당 1pt(6,000 L) | `contract_terms.forwarding_prep.STANDARD.m3_per_work_unit` | 결정(D03 나) |
| P21 | 작업 포함 주선 계수 | 0.25 m³당 1pt(250 L) | `contract_terms.forwarding_prep.HANDLING.m3_per_work_unit` | 조정(새) |
| P22 | 주선 최소 업무량 | 2pt | `contract_terms.forwarding_prep.min_work_units` | 결정(D03 나) |
| P23 | 보관 한도 | 40 m³ | `facility.warehouse.storage_m3` | 승인 |
| P24 | 하루 처리 한도 | 6pt | `facility.warehouse.handling_work_units_per_day` | 승인 |
| P25 | 확장 보관 추가 | +20 m³ | `facility.warehouse.expansion.storage_m3` | 승인 |
| P26 | 확장 처리 추가 | +3pt/일 | `facility.warehouse.expansion.handling_work_units_per_day` | 승인 |
| P27 | 확장 설치비 | 200,000원(1회, 명령한 날) | `facility.warehouse.expansion.setup_fee` | 승인 |
| P28 | 확장 임차료 증액 | +250,000원/30일 | `facility.warehouse.expansion.rent_increase` | 승인 |
| P29 | 확장 효력 | 명령 다음 날부터 | `facility.warehouse.expansion.effective_after_days` = 1 | 승인 |
| P30 | 확장 횟수 | 1번, 되돌리기 없음 | `facility.warehouse.expansion.max_count` | 승인 |
| P31 | 임차료 | 450,000원, 30일마다 선불, 1·31·61일 | `fixed_costs.rent.amount`·`period_days`·`first_due_day` | 승인 |
| P32 | 선복 계약 추가 부피 | 편당 +10 m³ | `space_contract.extra_m3` | 새 |
| P33 | 선복 계약 추가 무게 | 편당 +1,500 kg | `space_contract.extra_kg` | 새 |
| P34 | 선복 계약 요금 | 적용 편마다 30 USD(쓰지 않아도 냄) | `space_contract.fee_per_sailing` | 새·조정 |
| P35 | 선복 계약 효력 | 서명일 + 7일 이후 첫 출항편부터 | `space_contract.lead_days` | 새 |
| P36 | 선복 계약 해지 | 불가(캠페인 끝까지) | `space_contract.cancellable` = false | 새 |
| P37 | 노선당 계약 수 | 1 | `space_contract.max_per_route` | 새 |
| P38 | 기준 환율 | 1,300원/USD | `game_config.json` `config.fx_krw_per_usd`(20행) | 기존 |
| P39 | 환전 차감 | 100 bp(1%) → 1,287원 / 1,313원 | `fx_exchange.spread_basis_points` | 결정(D01) |
| P40 | 환전 단위 | 100 USD | `fx_exchange.lot` | 결정(D01) |
| P41 | 자동 환전 | 없음 | `fx_exchange.auto_exchange` = false | 결정(D01) |
| P42 | 경고 시작 | 발생 나이 0일 | `payment_default.warning_from_age_days` | 결정(D04) |
| P43 | 위험 시작 | 발생 나이 7일 | `payment_default.danger_from_age_days` | 결정(D04) |
| P44 | 경영 실패 | 발생 나이 14일인 날 마감에 남아 있으면 | `payment_default.failure_age_days`, `parameters.json` `PAR_PAYMENT_GRACE_DAYS` = 14 | 결정(D04) |

그대로 쓰는 기존 값: 일급 80,000·90,000·110,000원(`employees.json` EMP01~06, 바꾸지 않음), 계약금 일급 5일분, 시작 자금 3,000 USD·10,000,000원, 관세 5%, 늦은 인도 감액 50 USD, 출항 불참·취소비 50 USD, 노선 ROUTE01(5일·200 USD)·ROUTE02(4일·180 USD)·편당 30 m³·5,000 kg·2일 첫 출항·7일 간격.

## 5. 상태·자료형·저장 판본 6

### 5.1 정적 설정(`ScenarioConfig`, 상태에 저장하지 않음)

- `market: MarketRules | null` — `market_rules.json`을 로더가 정수 최소 단위로 바꾼 것. 규칙 1은 null.
- `facility: { warehouse: { cityId; storageLiters; handlingPtPerDay; expansion: { storageLiters; handlingPtPerDay; setupFeeMinor; rentIncreaseMinor; currency: 'KRW'; effectiveAfterDays; maxCount } } } | null`.
- `fixedCosts: { rent: { amountMinor; currency: 'KRW'; periodDays; firstDueDay } } | null`.
- `fx: { baseKrwPerUsd: 1300; spreadBasisPoints: 100; lotUsdMinor: 10000 } | null`. 환율은 로더가 `buy = base − applyBasisPoints(base, spread)` = 1,287, `sell = base + applyBasisPoints(base, spread)` = 1,313으로 미리 계산한다(`money.ts` `applyBasisPoints`).
- `spaceContract: { routeIds; extraVolumeLiters; extraMassGrams; feeMinor; currency: 'USD'; leadDays; maxPerRoute } | null`.
- `paymentDefault: { warningAge: 0; dangerAge: 7; failureAge: 14 } | null`.
- `terms.prepExtraPerLot: number`, `terms.forwardingPrep: { STANDARD: { litersPerPt }; HANDLING: { litersPerPt }; minPt }`.
- `OfferDef`(`types.ts:50-73`)에 더하는 필드: `maxQuantity`, `quantityStep`, `serviceClass: 'STANDARD' | 'HANDLING' | null`(상품 견적 null), `publishDay`, `batchK`, `templateId: string | null`. 1일 묶음 정적 견적은 로더가 `maxQuantity = quantityStep = quantity`, `publishDay = 1`, `batchK = 0`, 주선은 `serviceClass = 'STANDARD'`로 채운다. `quantity`는 ‘기본 수량(가장 작은 묶음)’ 뜻으로 남긴다.

### 5.2 동적 상태(`GameState`, `types.ts:450-481`)에 더하는 필드

| 필드 | 자료형 | 처음 값 | 뜻 |
|---|---|---|---|
| `market.batches` | `MarketBatch[]` | 규칙 2: 묶음 0 한 건. 규칙 1: `[]` | 공개한 묶음의 관측값 |
| `market.offers` | `OfferDef[]` | `[]` | 생성 견적의 정의. 공개 뒤에만 들어간다 |
| `warehouse.expansions` | `{ id; orderedDay; effectiveDay }[]` | `[]` | 최대 1건 |
| `warehouse.handlingLog` | `{ day; capacityPt; usedPt; waits: { taskId; wantPt; gotPt }[] }[]` | `[]` | 마감한 날마다 1건(규칙 2) |
| `spaceContracts` | `{ id; routeId; signedDay; firstSailingDay; extraVolumeLiters; extraMassGrams; feeMinor; currency }[]` | `[]` | 노선당 1건 |
| `exchanges` | `{ id; day; direction; usdMinor; krwMinor; rateKrwPerUsd; spreadKrwMinor }[]` | `[]` | 환전 기록. `krwMinor`는 원화 현금 증감 크기 |
| `campaign` | `{ outcome: 'IN_PROGRESS' \| 'COMPLETED' \| 'FAILED'; failure: FailureRecord \| null }` | `IN_PROGRESS`, null | 캠페인 결과 |

- `MarketBatch` = `{ k; publishDay; observedDay; indexBp: Record<goodId, number>; indexStepPct: Record<goodId, number> | null; destinationByGood: Record<goodId, cityId> | null; rows: { cityId; goodId; side: 'BUY' | 'SELL'; basePriceMinor; regionalPct }[]; offerIds: string[]; templateIds: string[]; drawCount }`. 묶음 0은 `indexBp` 10,000, `rows`는 P0 그대로, `regionalPct` 0, `indexStepPct`·`destinationByGood` null, `drawCount` 0이다.
- `FailureRecord` = `{ day; obligationId; currency; amountMinor; reasonKo; incurredDay; unpaidByCurrency: { currency; amountMinor; count }[]; cashByCurrency: { currency; amountMinor }[] }`.
- `Obligation`(`types.ts:410-417`)은 바꾸지 않는다. 발생 순서는 배열 순서다(생성 순서 = 발생일 오름차순).
- 규칙 1 시나리오도 `createGame`에서 새 필드를 빈 값으로 만든다. 규칙 1 엔진은 읽지도 바꾸지도 않는다(`campaign`도 늘 `IN_PROGRESS`). 규칙 1의 완료 여부는 지금처럼 `phase`로 읽는다.

### 5.3 새 장부 계정(`ledger.ts:7-23`)

| 계정 | 종류 | 통화 | 쓰임 |
|---|---|---|---|
| `RENT_EXPENSE` | expense | KRW | 임차료(기본 + 확장 증액) |
| `FACILITY_SETUP_EXPENSE` | expense | KRW | 창고 확장 설치비 |
| `SPACE_CONTRACT_EXPENSE` | expense | USD | 선복 계약 편당 요금 |
| `FX_SPREAD_EXPENSE` | expense | KRW | 환전 차감(1 USD당 13원) |
| `CURRENCY_TRANSFER` | equity | USD·KRW 각자 | 통화 간 이체. 두 장부에 따로 남고 합치지 않는다 |

- `summarize`(`ledger.ts:149-186`)와 `BookSummary`에 네 비용을 더한다. `profit`에서 뺀다. `CURRENCY_TRANSFER`는 손익이 아니다.
- 계약 기여이익(`reports.ts:19`)에는 들어가지 않는다. 이 분개에는 `contractId`를 붙이지 않는다(DESIGN:194-195).

### 5.4 저장 판본 6

- `SAVE_FORMAT_VERSION = 6`. 받는 판본에 6을 더한다(`save.ts:97`).
- `migrateV5toV6`: 5.2의 새 필드를 빈 값으로 채운다. `campaign`은 `{ outcome: 'IN_PROGRESS', failure: null }`. 경제 값은 바꾸지 않는다. 규칙 2 시나리오의 판본 5 이하 저장은 있을 수 없으므로 규칙 판본 검사로 거절된다.
- `save-shape.ts`(`:8` `SAVE_ENUMS`, `:56` `stateShape`)에 새 필드 모양과 열거형(`exchangeDirection`, `campaignOutcome`, `serviceClass`, `tradeSide`)을 더한다. 생성 견적은 `OfferDef` 전체 모양을 검사한다.
- 공개된 견적 정의는 저장에 남는다. 생성 코드가 바뀌어도 열린 견적·계약이 조용히 바뀌지 않는다(DESIGN:413).

## 6. 견적 생성(시장)

### 6.1 공개 일정

- 묶음 k(0 ~ 11)의 공개일 b = 1 + 7k: 1·8·15·22·29·36·43·50·57·64·71·78일. 79일부터 새 묶음은 없다.
- 묶음 0은 `market_offers.json` 6건 그대로다(`createGame`의 `config.offers`, `engine.ts:79`).
- 묶음 k ≥ 1은 **b−1일 마감 7단계**에서 만든다(13절). 그래서 b일이 열릴 때 보인다. b−1일 마감 전에는 상태·읽기 함수 어디에도 없다.
- 유효: b ~ b+2. 만료는 기존 7단계 규칙(`validUntilDay < day + 1`이면 EXPIRED, `engine.ts:825-831`)을 그대로 쓴다.
- 납기 또는 결제일이 90일을 넘는 견적은 만들지 않는다. 대신할 견적도 만들지 않는다. 난수는 그대로 소비한다. 예: 78일 묶음에서는 F2·F4(납기 b+14 = 92)와 H1~H6(납기 92)이 빠진다.

### 6.2 결정성과 난수

- 묶음 k의 견적은 (시드, k, 직전 묶음 지수, 규칙 자료)만의 함수다. 플레이어 행동은 입력이 아니다(가격 수용자, 6.7).
- 시드: `state.rng.seed`. 흐름: `MARKET-B` + `String(k).padStart(2, '0')`. 커서 0부터 차례로 쓴다. 지역 난수 상태 `{ seed, cursors: {} }`를 새로 만들어 `drawUniform`(`rng.ts:33`)을 부른다. **`state.rng.cursors`는 읽지도 쓰지도 않는다.**
- 정수 뽑기: `intBetween(lo, hi) = lo + Math.floor(value × (hi − lo + 1))`. 목록 뽑기: `index(n) = Math.floor(value × n)`.
- 직전 지수는 `state.market.batches[k−1].indexBp`를 쓴다. 처음부터 다시 계산해도 같아야 한다(인수 P0-M2A5-01).
- 묶음 기록의 `drawCount`는 이 묶음이 쓴 난수 개수다. 정상은 22다.

### 6.3 뽑는 순서(바꾸면 규칙 판본을 올린다)

1. 지수 걸음 u: 의류 → 화장품. `intBetween(−3, 3)`.
2. 판매지: 의류 → 화장품. `index(2)`, 0 = HAIPHONG, 1 = SHANGHAI.
3. 지역 요인 v: 시세표 6행 순서. 평택 의류 → 평택 화장품 → 하이퐁 의류 → 하이퐁 화장품 → 상하이 의류 → 상하이 화장품. `intBetween(−4, 4)`.
4. 거래처 차이 w: 의류 매입 → 의류 판매 → 화장품 매입 → 화장품 판매. `intBetween(−3, 3)`.
5. 최대 물량 배수: 의류 → 화장품. `max_lots_choices[index(3)]`.
6. 주선 틀: 12개 틀(자료 순서 F1~F6, H1~H6)에서 6개를 부분 피셔-예이츠로 뽑는다. i = 0..5마다 `j = i + index(12 − i)`, `pool[i]`와 `pool[j]`를 바꾼다. 뽑힌 6개는 자료 순서로 정렬해 ID를 만든다.

### 6.4 가격식(정수)

`halfUp(n, d) = Math.floor((n + d / 2) / d)` (n ≥ 0, d는 짝수). 모든 값이 양수라 0에서 먼 쪽 반올림과 같다(DECISIONS:56).

- 지수: `I_k = clamp(halfUp(I_{k−1} × (100 + u), 100), 8500, 11500)`. bp 정수.
- 지역 기준가(시세표 값, cents/단위): `B = halfUp(P0 × I_k(상품) × (100 + v), 1,000,000)`.
- 견적 단가(cents/단위): `U = halfUp(B × (100 + w), 100)`. 매입 견적은 평택 행의 B, 판매 견적은 뽑힌 판매지 행의 B를 쓴다.
- 화면 지수 점수: `halfUp(I_k, 100)`(예: 10,506 bp → 105).
- 견적 대비 기준가 차이(화면용, %): 판매 견적과 매입 견적 모두 `w`를 그대로 보인다(‘이 견적은 지역 기준가보다 +1%’).

### 6.5 생성 견적의 정의

| 종류 | ID | 거래처 | 수량 | 기타 |
|---|---|---|---|---|
| 매입 | `MKT-D{b:03}-APP-BUY`, `-COS-BUY` | 의류 `SUPPLIER_DEMO`, 화장품 `SUPPLIER_DEMO_COSMETICS` | `quantity` = 기본 단위, `maxQuantity` = 배수 × 기본 단위, `quantityStep` = 기본 단위 | 도시 PYEONGTAEK, 원산지 KR, 납기·결제 null |
| 판매 | `MKT-D{b:03}-APP-SELL`, `-COS-SELL` | (의류, 하이퐁) `CUSTOMER_DEMO`, (의류, 상하이) 새 `CUSTOMER_SHA_APPAREL`, (화장품, 상하이) `CUSTOMER_DEMO_SHANGHAI`, (화장품, 하이퐁) 새 `CUSTOMER_HAI_COSMETICS` | 매입과 같음 | 납기 b+7, 결제 b+9(하이퐁)·b+11(상하이) |
| 주선 | `MKT-D{b:03}-{틀 ID}` | 틀의 `counterparty_id` | 틀의 수량(고정, `maxQuantity = quantityStep = quantity`) | 출발 PYEONGTAEK, 서비스 대금·납기·결제는 틀, `declaredCargoValueMinor` null, `serviceClass`는 틀 |

- 거래처 이름(`name_ko`)은 `market_rules.json` `counterparties[]`에 둔다. 화면의 고정 표(`src/ui/main.ts:138-145`)는 이 자료를 읽게 바꾼다.
- 엔진 기록 문장에 내부 ID와 ‘을(를)’을 쓰지 않는다(gap TE-25, `engine.ts:463`). 예: ‘계약 CT004 체결(운송 주선): 가구 화주 화물 가구 120개, 평택 → 하이퐁’.

### 6.6 주선 틀

표 6.6-1 일반 주선(STANDARD, 초안 승인 값, DRAFT §2.6). 금액 USD.

| 틀 | 화물 | m³ | kg | 목적지 | 서비스 대금 | 운임 | 기여이익 | 납기 | 결제 | 준비 pt | 거래처 |
|---|---|---:|---:|---|---:|---:|---:|---|---|---:|---|
| F1 | 가구 120점 | 24 | 2,400 | 하이퐁 | 380 | 200 | 180 | b+7 | b+9 | 4 | `SHIPPER_DEMO_FURNITURE` |
| F2 | 자동차 부품 200상자 | 8 | 2,400 | 하이퐁 | 300 | 200 | 100 | b+14 | b+16 | 2 | `SHIPPER_DEMO_AUTOPARTS` |
| F3 | 전자제품 300상자 | 9 | 2,400 | 상하이 | 300 | 180 | 120 | b+7 | b+11 | 2 | 새 `SHIPPER_DEMO_ELECTRONICS` |
| F4 | 자동차 부품 300상자 | 12 | 3,600 | 상하이 | 360 | 180 | 180 | b+14 | b+18 | 2 | `SHIPPER_DEMO_AUTOPARTS` |
| F5 | 가구 90점 | 18 | 1,800 | 상하이 | 380 | 180 | 200 | b+7 | b+11 | 3 | `SHIPPER_DEMO_FURNITURE` |
| F6 | 전자제품 200상자 | 6 | 1,600 | 하이퐁 | 280 | 200 | 80 | b+7 | b+9 | 2 | 새 `SHIPPER_DEMO_ELECTRONICS` |

표 6.6-2 작업 포함 주선(HANDLING, 사전 조정 새 값). 포장·라벨·검수 작업이 붙은 고객 화물이다. 회사 재고가 아니다. 회계는 일반 주선과 같다(서비스 매출·주선 원가). 모두 3 m³, 준비 12pt, 기여이익 840 USD(= pt당 70 USD).

| 틀 | 이름(`title_ko`) | 화물 | kg | 목적지 | 서비스 대금 | 운임 | 납기 | 결제 | 거래처 |
|---|---|---|---:|---|---:|---:|---|---|---|
| H1 | 라벨 작업 포함 전자제품 | 전자제품 100상자 | 800 | 하이퐁 | 1,040 | 200 | b+14 | b+16 | 새 `SHIPPER_DEMO_ELECTRONICS` |
| H2 | 검수·소분 포함 화장품 | 화장품 150상자 | 900 | 상하이 | 1,020 | 180 | b+14 | b+18 | 새 `SHIPPER_DEMO_COSMETICS` |
| H3 | 세트 포장 포함 의류 | 의류 1,000개 | 500 | 하이퐁 | 1,040 | 200 | b+14 | b+16 | 새 `SHIPPER_DEMO_APPAREL` |
| H4 | 라벨 작업 포함 전자제품 | 전자제품 100상자 | 800 | 상하이 | 1,020 | 180 | b+14 | b+18 | 새 `SHIPPER_DEMO_ELECTRONICS` |
| H5 | 재포장 포함 자동차 부품 | 자동차 부품 75상자 | 900 | 상하이 | 1,020 | 180 | b+14 | b+18 | `SHIPPER_DEMO_AUTOPARTS` |
| H6 | 검수·소분 포함 화장품 | 화장품 150상자 | 900 | 하이퐁 | 1,040 | 200 | b+14 | b+16 | 새 `SHIPPER_DEMO_COSMETICS` |

- 부피·무게는 `goods.json` 단위값으로 셌다(전자제품 0.03 m³·8 kg, 화장품 0.02 m³·6 kg, 의류 0.003 m³·0.5 kg, 자동차 부품 0.04 m³·12 kg).
- H 틀은 납기가 b+14라 b+8일 편으로 정시 인도된다. 준비할 시간이 8일까지 있어 직원 시간을 주 전체에 나눠 쓸 수 있다. 이것이 ‘직원이 병목이 되는 조건’이다(17절).
- 묶음당 H 개수는 시드마다 다르다. 20시드 220묶음에서 뽑힌 틀 기준 1개 12·2개 52·3개 93·4개 55·5개 7·6개 1묶음이었다(모형 집계, 78일 묶음은 납기 걸러내기 전 수).

### 6.7 가격 수용자와 체결 가격 고정

- 체결·거절·취소는 지수·지역 요인·다음 견적을 바꾸지 않는다(DESIGN:178·184, DRAFT §2.4).
- 계약의 단가·수량·금액은 체결 때 고정된다. 바뀌는 것은 기존 늦은 인도 감액(50 USD 1회)뿐이다.

### 6.8 상태 반영과 견적 찾기

- 생성 견적은 `state.market.offers`에 넣고, `state.offers`에 `{ id, status: 'OPEN' }`을 같은 순서로 더한다. 순서: 의류 매입·판매, 화장품 매입·판매, 주선(자료 순서).
- 새 도우미 `offerDef(state, config, id)`: `config.offers`(묶음 0) 다음 `state.market.offers`를 찾는다. 지금 `offerOf(config, id)`를 쓰는 곳을 모두 바꾼다: `engine.ts:283-284·390·826`, `reports.ts:132·148·164`, `sim/policies.ts:25·33`, `src/ui/main.ts:427-449·814-818`.
- `tradePairs(config)`(`reports.ts:164`)는 `tradePairs(state, config)`가 된다. 같은 묶음·같은 상품·노선이 있는 열린 매입·판매 쌍만 돌려준다.

## 7. 준비 업무량

| 업무 | 식 | 예 |
|---|---|---|
| 수출 준비(직접 무역) | `prep_work_units + (수량 ÷ quantityStep − 1) × prep_work_units_per_extra_lot` | 의류 100·200·300개 → 2·3·4pt. 화장품 50·100·150상자 → 2·3·4pt. 1일 묶음 → 2pt |
| 주선 준비 | `max(min_work_units, ceil(부피 L ÷ 등급 계수 L))`. STANDARD 6,000 L, HANDLING 250 L | F1 24,000 L → 4. F5 18,000 → 3. F3 9,000 → 2. F2 8,000 → 2. F6 6,000 → max(2, 1) = 2. H 3,000 L → 12. OFFER_FWD_01 → 4, OFFER_FWD_02 → 2 |

- 업무량은 수락 때 정해 `Task.requiredWorkUnits`에 넣는다. 이후 바뀌지 않는다.
- 같은 함수 `prepWorkUnitsFor(config, offer, quantity)`를 엔진·미리 보기·화면이 함께 쓴다.

## 8. 창고: 보관·처리·확장

### 8.1 보관 한도

- 창고는 본사 도시(`config.homeCityId` = PYEONGTAEK) 1곳이다. 무게 한도는 없다.
- 보관량(L) = 위치가 본사 도시이고 상태가 `PREPARING`·`AWAITING_DEPARTURE`·`HELD_UNALLOCATED`인 화물(회사·고객 모두)의 `cargoSpace(...).volumeLiters` 합. 상태에서 매번 계산하고 따로 저장하지 않는다(`reservations.ts` 머리말 원칙).
- 한도(L) = 40,000 + (확장 효력일 ≤ 오늘이면 20,000).
- 늘어나는 때: 수락(직접 무역·주선). 줄어드는 때: 출항(4단계), 주선 취소 뒤 화주 반환. 직접 무역 취소 재고(`HELD_UNALLOCATED`, `engine.ts:766`)는 계속 차지한다.
- 검사: 수락 명령마다 `보관량 + 이 화물 ≤ 한도`. 같은 날 앞 명령의 수락을 반영한다. 일괄 확정은 수락까지 철회한다(`withPlan`, `engine.ts:230-251`).
- 1일 묶음 4건을 모두 받아도 33,300 L ≤ 40,000 L다. 첫 묶음 거절 사례는 그대로다.

### 8.2 하루 처리 한도

- 적용 업무: 본사 도시의 `EXPORT_PREP`·`FORWARDING_PREP`. 조사·영입 의뢰·훈련·현지 활동은 쓰지 않는다.
- 처리 한도(pt) = 6 + (확장 효력일 ≤ 오늘이면 3).
- 3단계에서 업무별 진행 = `min(직원 처리량, 남은 업무량, 창고 남은 처리량)`. 8.3 순서로 나눈다.
- 남은 직원 처리량과 창고 처리량은 다음 날로 넘기지 않는다(`engine.ts:845` 원칙).
- 직원 2명(4pt)이면 걸리지 않는다. 2pt 직원 3명은 6pt로 딱 맞다. 현돌(3pt)을 더하면 7 > 6이라 1pt가 남는다. 확장하면 9pt다.

### 8.3 자동 처리 순서(D02-④)

1. 예약(BOOKED)한 출항일이 이른 업무.
2. 예약 없는 업무는 그 뒤, 계약 납기가 이른 순서.
3. 계약 ID 오름차순.

- 계산 방식: 먼저 이 순서로 업무별 배분량을 정한다. 그다음 `s.tasks` 배열 순서로 진행·완료를 적용한다(기록·경험치 순서를 규칙 1과 같게 둔다).
- 그날 기록: `warehouse.handlingLog`에 `{ day, capacityPt, usedPt, waits }`를 넣는다. `waits`는 배분량 < 원한 양인 업무다.
- 플레이어가 순서를 바꾸는 명령은 없다(D02-④ 가).

### 8.4 ‘창고 대기’ 막힌 이유

- `BlockerCode`(`progress.ts:21-30`)에 `WAREHOUSE_WAIT`를 더한다(10번째).
- 조건: 그 계약의 준비 업무가 RUNNING이고 직원이 오늘 일할 수 있는데, 오늘 배분량 < 직원 처리량(남은 양이 더 작으면 남은 양)이다.
- 단계: `warn`. 예측 완료일이 예약 출항일보다 늦으면 기존 `TASK_WILL_MISS_SAILING`(`risk`)도 함께 보인다.
- 예측 완료일: `projectPrepCompletion(state, config)`. 오늘부터 지금 RUNNING 업무만, 새 배정 없이, 8.2·8.3 규칙으로 날마다 모의 진행한다. 지금 식(`progress.ts:99`, 직원 속도만)은 규칙 2에서 이 함수로 바꾼다. 화면 예측과 실제 진행이 같아야 한다(DECISIONS:223).
- 문장 예: ‘창고 대기 — 오늘 창고 처리 6pt 가운데 앞 순서(출항일 → 납기 → 계약 번호) 화물이 5pt를 먼저 씁니다. 이 업무는 2pt 중 1pt만 진행합니다. 이대로면 14일에 끝나 16일 편에 실을 수 있습니다.’

### 8.5 창고 확장(DK-11, `EXPAND_WAREHOUSE`)

- 효과: 다음 날부터 보관 +20 m³, 처리 +3pt/일. 1번만, 되돌리기 없음.
- 비용: 명령한 날 설치비 200,000원(`FACILITY-SETUP-WH01`, KRW, 차변 `FACILITY_SETUP_EXPENSE`). 임차일 R에는 `확장 효력일 ≤ R`이면 기본 450,000원에 250,000원을 더해 700,000원을 낸다.
- 견적 수는 바꾸지 않는다.

## 9. 선복 장기 계약(DK-21, `SIGN_SPACE_CONTRACT`)

- 자체 선박이 아니다. 외부 선사와 맺는 노선별 주간 추가 선복 계약이다(DESIGN:67).
- 서명: 노선 하나. 노선당 1건. 해지 없음.
- 첫 적용 편: 그 노선에서 출항일 ≥ 서명일 + 7인 첫 편. 1일 서명 → 9일 편부터. 2일 편 교훈(32 > 30 m³)은 그대로다.
- 적용 편의 한도: 30 m³ + 10 m³ = 40 m³, 5,000 kg + 1,500 kg = 6,500 kg. `sailingLoad`·`spaceShortfall`(`reservations.ts:91-127`)과 불변 조건(`invariants.ts:107`)이 이 한도를 쓴다.
- 요금: 적용 편의 출항일마다 30 USD. 예약이 없어도 낸다. 6단계 고정비로 처리한다(13절). 분개·의무 ID `SPACE-{routeId}-D{ddd}`. 차변 `SPACE_CONTRACT_EXPENSE`.
- 1일에 ROUTE02를 서명하면 9·16·…·86일 12편, 합계 360 USD다.
- 미리 묶어 두는 예약(`cashReservations`)에는 넣지 않는다. 급여·임차료처럼 일정표(14.5)와 미지급 규칙으로 다룬다(DECISIONS:152).

## 10. 돈

### 10.1 환전(D01, `EXCHANGE_CURRENCY`)

- 방향 `USD_TO_KRW`: 1 USD당 1,287원을 받는다. `KRW_TO_USD`: 1 USD당 1,313원을 낸다. 금액은 USD 기준, 100 USD 배수.
- 명령 단계(2단계)에서 바로 실행한다. 같은 날 뒤의 명령과 6단계 급여·고정비가 그 돈을 쓴다.
- 쓸 수 있는 USD = 현금 − 예약 − USD 미지급(`fundsPosition`, `reservations.ts:54-68`). 쓸 수 있는 KRW = 현금 − KRW 미지급(`cashLessUnpaidMinor`, `:76-79`).
- 분개(n = USD 금액 ÷ 100 USD, 기록 번호 `FX{nnn}` = `exchanges.length + 1`을 3자리로):
  - USD→KRW. `FX{nnn}-USD`(USD): 차변 `CURRENCY_TRANSFER` 10,000n / 대변 `CASH` 10,000n(cents). `FX{nnn}-KRW`(KRW): 차변 `CASH` 128,700n, 차변 `FX_SPREAD_EXPENSE` 1,300n / 대변 `CURRENCY_TRANSFER` 130,000n.
  - KRW→USD. `FX{nnn}-KRW`(KRW): 차변 `CURRENCY_TRANSFER` 130,000n, 차변 `FX_SPREAD_EXPENSE` 1,300n / 대변 `CASH` 131,300n. `FX{nnn}-USD`(USD): 차변 `CASH` 10,000n / 대변 `CURRENCY_TRANSFER` 10,000n.
- 두 분개는 각자 대차가 맞다. 두 통화를 한 숫자로 합친 필드를 만들지 않는다(DECISIONS:54).
- 고정 환율이라 기말 환산 손익은 0이다. 변동 환율은 M3(DESIGN:423).
- 자동 환전은 없다. 엔진은 어떤 경우에도 스스로 통화를 바꾸지 않는다. 미지급 원화를 USD로 갚지 않는다.

### 10.2 임차료

- 450,000원, 1·31·61일 6단계에 선불. 분개·의무 ID `RENT-D001`·`RENT-D031`·`RENT-D061`. 차변 `RENT_EXPENSE`. 같은 날을 다시 마감해도 한 번만 남는다(분개 ID 중복 금지, `engine.ts:1170-1177`).
- 계약 기여이익에 나누지 않는다. 원화 보고서에 ‘임차료’, ‘창고 설치비’, ‘환전 차감’ 행을 더하고 행 합 = 운영 손익을 지킨다(`src/ui/reports.ts:11-19`).
- USD 장부 보고서에는 ‘선복 계약 요금’ 행을 더한다.

### 10.3 자동 지급 순서(D02-④, 규칙 2)

- 통화마다 따로 처리한다. 통화 사이 순서는 없다.
- 6단계 순서: 수금 → 밀린 지급 → 고정비(임차료, 선복 계약 요금) → 급여(직원 정의 순서).
- 밀린 지급: 그 통화의 미지급 의무를 발생 순서(배열 순서)대로 갚는다. 현금이 그 의무 전액보다 적으면 **멈춘다**. 부분 지급은 없다. 뒤의 작은 의무를 먼저 갚지 않는다(지금 코드 `engine.ts:1140`의 건너뛰기를 규칙 2에서 바꾼다).
- 새 필수 지급(관세·임차료·선복 요금·급여·고객 취소 보상): 그 통화에 미지급 의무가 하나라도 남아 있으면 현금이 있어도 지급하지 않고 미지급 의무로 줄을 세운다. 남은 의무가 없고 현금 ≥ 금액이면 지급한다. 아니면 미지급 의무가 된다(`payOrAccrue`, `engine.ts:1099-1135`를 규칙 2에서 확장).
- 관세가 미지급이면 반출하지 않는 규칙은 그대로다. 밀린 관세를 갚은 날 `dutyPaid = true`(`engine.ts:1151-1154`).
- 선택 지출(수락·고용 계약금·훈련·현지 활동·확장 설치비·환전)은 기존처럼 ‘현금 − 예약 − 미지급’ 또는 ‘현금 − 미지급’ 기준으로 거절한다. 미지급 의무를 만들지 않는다(DECISIONS:316).

### 10.4 통화 분리 규칙

- 저장·보고·결산·실패 화면 어디에도 USD와 KRW를 더한 값이 없다. 1,300원 참고 환산 합계도 보이지 않는다(PACKET D01 덧붙임).
- 급여 가능일은 원화만으로 센다. ‘환전하면’ 미리 보기는 원화 유입을 더한 원화 계산이지 합산이 아니다.
- 비교 실행기의 분석값(17절)은 화면·결산에 나오지 않는 설계 분석 전용이다.

## 11. 지급 불이행 단계·경영 실패(D04)

### 11.1 단계

- 기준 의무: 모든 통화의 미지급 의무 가운데 발생일이 가장 이른 것. 같으면 통화 `USD` < `KRW`, 그다음 배열 순서.
- 나이 = 기준 날 − 발생일. 열린 날에는 `state.day`, 마감 결과에는 마감한 날을 쓴다.

| 나이 | 단계 | 뜻 |
|---|---|---|
| 미지급 없음 | `NONE` | — |
| 0 ~ 6 | `WARNING`(경고) | 발생한 날 마감 결과부터 |
| 7 ~ 13 | `DANGER`(위험) | 발생일 + 7일부터 |
| 14 | `DANGER` + `failsAtCloseToday` | ‘오늘 마감까지 갚지 못하면 경영 실패’ |
| 14인 날 마감에 남음 | `FAILED` | 경영 실패 |

- 예: 57일 발생 → 57~63일 경고 → 64일부터 위험 → 71일 마감에도 남으면 실패.
- 기준 의무를 갚으면 다음으로 오래된 의무가 기준이 된다. 그 의무의 발생일로 다시 센다.

### 11.2 실패 처리(6단계 끝, 13절 6e)

1. 6단계 지급을 모두 마친 뒤 검사한다. 기준 의무의 `발생일 + 14 ≤ 오늘`이면 실패.
2. `campaign = { outcome: 'FAILED', failure: { day, obligationId, currency, amountMinor, reasonKo, incurredDay, unpaidByCurrency, cashByCurrency } }`.
3. 7단계(다음 견적·만료)를 건너뛴다. 8단계 불변 조건 검사·마감은 한다. `phase = 'ENDED'`.
4. 기록: ‘경영 실패: {발생일}일에 생긴 {이유} {금액}을 14일 동안 갚지 못했습니다’.
- 실패 뒤 `commitDay`는 지금처럼 오류다(`engine.ts:805`). 규칙 2의 `applyCommand`는 `phase === 'ENDED'`면 모든 명령을 ‘캠페인이 끝났습니다(경영 실패).’로 거절한다(계획·미리 보기용).
- 90일 마감: 실패 검사를 먼저 한다. 실패가 아니면 `outcome = 'COMPLETED'`. 미지급이 남아도 나이가 14 미만이면 완료이고, 결산에 미지급을 보인다.
- 단계 변화 기록: 마감에서 기준 의무의 단계가 새로 경고·위험이 되면 기록을 하나 남긴다(‘지급 불이행 경고: …’, ‘지급 불이행 위험: … {실패일}일 마감까지’).

### 11.3 결산과 같은 시드 다시

- `campaignSummary`(`reports.ts:325`)에 `outcome`, `failure`, `defaultStatus`, 통화별 고정비·환전 기록 목록을 더한다. 통화별 값만 있고 합계는 없다.
- 같은 시드 다시: 새 함수 `restartWithSameSeed(state, config)` = `createGame({ ...config, seed: state.rng.seed })`. 같은 시드라 묶음 1~11이 실패한 판과 같다.
- 다른 시드 선택은 이번 범위 밖이다.

## 12. 명령

`Command`(`types.ts:494-505`)에 더하고 바꾼다. 모든 명령은 기존처럼 ID로 한 번만 처리한다(`engine.ts:181-183`). 규칙 1 시나리오에서 새 명령은 ‘이 시나리오에서는 할 수 없습니다(M2a-5 기능).’로 거절한다.

### 12.1 `EXCHANGE_CURRENCY { id, direction, usdAmountMinor }`

| 순서 | 검사 | 거절 문장 |
|---|---|---|
| 1 | `phase`가 `AWAITING_INPUT` | ‘캠페인이 끝났습니다(경영 실패).’ 또는 기존 단계 오류 |
| 2 | `usdAmountMinor`가 안전한 정수이고 > 0, 10,000(100 USD)의 배수 | ‘환전은 100 USD 단위입니다. 요청 {금액}.’ |
| 3a | USD→KRW: 쓸 수 있는 USD ≥ 금액 | ‘환전할 수 있는 USD가 부족합니다. 요청 {금액}, 사용 가능 {가용} = 현금 {현금} − 다른 계약 예약 {예약} − 미지급 {미지급}.’ |
| 3b | KRW→USD: 쓸 수 있는 KRW ≥ 금액 ÷ 100 × 1,313 | ‘환전할 수 있는 원화가 부족합니다. 필요 {원화}, 사용 가능 {가용} = 현금 − 미지급.’ |

- 실행: 10.1 분개 두 개, `exchanges`에 기록, 기록 문장 ‘환전: 1,000.00 USD → 1,287,000원(게임용 고정 환율 1,287원, 차감 13,000원)’.

### 12.2 `EXPAND_WAREHOUSE { id }`

| 순서 | 검사 | 거절 문장 |
|---|---|---|
| 1 | 단계 | 12.1과 같음 |
| 2 | 확장 수 < 1 | ‘창고 확장은 한 번만 할 수 있습니다(이미 {효력일}일부터 확장).’ |
| 3 | 쓸 수 있는 KRW ≥ 200,000원 | ‘창고 설치비 자금이 부족합니다. 필요 200,000원, 사용 가능 {가용}.’ |

- 실행: 설치비 분개, `expansions.push({ id: 'WH-EXP-1', orderedDay: d, effectiveDay: d + 1 })`, 기록 ‘창고 확장 계약: {d+1}일부터 보관 60 m³·처리 9pt. 임차료는 다음 임차일({R}일)부터 700,000원’.

### 12.3 `SIGN_SPACE_CONTRACT { id, routeId }`

| 순서 | 검사 | 거절 문장 |
|---|---|---|
| 1 | 단계 | 12.1과 같음 |
| 2 | 노선이 `space_contract.route_ids`에 있음 | ‘이 노선은 선복 계약을 맺을 수 없습니다.’ |
| 3 | 그 노선 계약 없음 | ‘이 노선에는 이미 선복 계약이 있습니다({첫 편}일 편부터).’ |
| 4 | 서명일 + 7 이후 캠페인 안에 출항편이 있음 | ‘남은 기간에 계약을 적용할 출항편이 없습니다.’ |
| 5 | 쓸 수 있는 USD ≥ 30 USD(첫 요금) | ‘선복 계약 첫 요금 자금이 부족합니다. 필요 30.00 USD, 사용 가능 {가용}.’ |

- 실행: `spaceContracts.push({ id: 'SPC-{routeId}', … })`, 기록 ‘선복 장기 계약: {노선} {첫 편}일 편부터 편마다 +10 m³·+1,500 kg, 편당 30.00 USD(쓰지 않아도 냄, 해지 없음)’. 서명일에 돈은 나가지 않는다.

### 12.4 `ACCEPT_TRADE { id, buyOfferId, sellOfferId, quantity?, plan? }` (바뀜)

- `quantity`가 없으면 `buy.quantity`(기본 단위)다.
- 규칙 2 검사 순서: ① 견적 존재·종류 ② 유효(`engine.ts:253-258`) ③ 같은 상품 ④ 수량: `quantityStep`의 배수이고 `quantityStep ≤ quantity ≤ min(buy.maxQuantity, sell.maxQuantity)` ⑤ 통화 ⑥ 노선 ⑦ 자금(매입 + 운임 + 관세, 기존) ⑧ 보관(8.1).
- 거절 문장: ④ ‘수량은 {step}{단위} 단위로 {step} ~ {max}{단위}까지 고를 수 있습니다.’ ⑧ ‘보관 공간 부족 — 평택 창고 {보관} / {한도} m³, 이 화물 {부피} m³. 출항하거나 확장하면 공간이 생깁니다.’
- 규칙 1은 지금의 ‘같은 수량만’ 규칙(`engine.ts:290`)을 그대로 쓴다. `quantity`를 주면 견적 수량과 같아야 한다.
- 매입·판매 금액은 단가 × `quantity`다. 준비 업무량은 7절.

### 12.5 `ACCEPT_FORWARDING` (바뀜)

- 규칙 2: 자금 검사 뒤 보관 검사(8.1). 준비 업무량은 7절 주선 식. 기록 문장은 6.5.

### 12.6 그대로인 명령과 규칙 2의 차이

- `ASSIGN_TASK`·`BOOK_SAILING`·`CANCEL_CONTRACT`·`SCOUT_SITE`·`START_RECRUIT_QUEST`·`HIRE_CANDIDATE`·`START_TRAINING`·`START_CULTURE_ACTIVITY`·`RESPOND_TO_DELAY`는 그대로다.
- `BOOK_SAILING`의 선복 검사는 선복 계약 한도(9절)를 쓴다.
- 우선순위·위임·재협상·단기 인력 명령은 없다(19절).

## 13. 하루 처리 순서(규칙 2)

DESIGN:336-342의 8단계에 맞춘다. 굵은 글씨가 새로 하거나 바뀌는 곳이다.

| 단계 | 처리 | 위치 |
|---|---|---|
| 1 | 하루 열기: 항만 공지(기존). **견적은 전날 마감에 이미 공개됨** | `openDay`, `engine.ts:127-157` |
| 2 | 명령 검증·실행(입력 순서, 앞 명령 반영). **환전·확장·선복 계약·수량 선택·보관 검사** | `applyCommand`, `engine.ts:180-224` |
| 3 | 직원 업무 진행. **준비 업무는 창고 처리 한도를 8.3 순서로 나눔. `handlingLog` 기록** | `progressTasks`, `engine.ts:840-890` |
| 4a | 출항(기존). 준비 미완료면 출항 불참·운임 환급(기존). **출항한 화물은 창고에서 빠짐** | `engine.ts:892-950` |
| 4b | 도착·통관. 관세는 **10.3 지급 규칙** | `engine.ts:952-991` |
| 5 | 인도·납기 판정(기존) | `engine.ts:993-1058` |
| 6a | 수금(기존, 연체·대손 없음) | `engine.ts:1060-1066` |
| 6b | **밀린 지급: 통화별 발생 순서, 못 갚으면 멈춤** | `settleObligations` 확장 |
| 6c | **고정비: 임차일이면 임차료(확장 증액 포함), 오늘이 출항일인 적용 편마다 선복 요금(예약이 없어도)** | 새 |
| 6d | 급여(기존 순서). **10.3 지급 규칙** | `processPayroll`, `engine.ts:1159-1166` |
| 6e | **지급 불이행 단계 기록과 경영 실패 검사(11.2)** | 새 |
| 7 | 실패가 아니면: 만료(기존) → **다음 날이 공개일이면 묶음 생성·공개(6절)** | `engine.ts:824-831` 확장 |
| 8 | 불변 조건 검사(15절) → `closedDays` → 다음 날. **실패면 `ENDED`, 90일 넘으면 `ENDED`·`COMPLETED`** | `engine.ts:832-837` |

- 같은 날을 다시 마감하면 지금처럼 아무것도 바꾸지 않는다(`engine.ts:802-804`).
- 화면 열기·미리 보기·저장 불러오기는 시간을 진행하지 않는다.

## 14. 읽기 함수·보고

모두 상태를 바꾸지 않는다. 규칙 1에서는 기존 결과를 그대로 낸다.

### 14.1 `marketTable(state, config)`

- 행 6개: `{ cityId, goodId, side, basePriceMinor, currency: 'USD', indexPoints, indexBp, observedDay, ageDays, nextObservationDay, hasQuoteInBatch }`.
- `basePriceMinor`(돈)와 `indexPoints`(지수, 단위 없음)는 다른 필드다(DK-06).
- 값은 오늘 이하 공개일의 마지막 묶음이다. `ageDays = state.day − observedDay`. `nextObservationDay`는 다음 공개일, 78일 뒤에는 null.

### 14.2 `quotePreview(state, config, …)`

- 기존 `tradePreview`·`forwardingPreview`(`reports.ts:132·148`)에 상태와 수량을 더한다.
- 더하는 값: `quantity`, `maxQuantity`, `quantityStep`, `prepWorkUnits`, `volumeLiters`, `massGrams`, `storageAfterLiters`·`storageCapacityLiters`, `counterpartySpreadPct`(w), `serviceClass`, `contractVsBase`.

### 14.3 `warehouseSummary(state, config)`

- `storage { usedLiters; capacityLiters; heldUnallocatedLiters }`.
- `handling { capacityPtToday; plannedUsePtToday; waits[] }`(오늘 배분 미리 계산).
- `demand { batchPublishDay; openVolumeLiters; openPrepPt }`: 오늘 열린 견적을 기본 수량으로 받았을 때의 합.
- `staff { workUnitsPerDay; idleWorkUnitsToday }`(`workloadSummary`, `capacity.ts:49` 재사용).
- `sailings[]`: 노선별 다음 출항편 `{ sailingId; usedLiters; capacityLiters; usedGrams; capacityGrams; spaceContract: boolean }`.
- `rent { amountMinor; nextDueDay }`, `expansion { status: 'NONE' | 'ORDERED' | 'ACTIVE'; effectiveDay }`, `spaceContracts[]`.

### 14.4 `payrollRunwayDay`(`previews.ts:40`)

- 규칙 2: 날마다 급여에 그날 임차료(확장 효력 반영)를 더해 뺀다. 선복 요금은 USD라 넣지 않는다.
- 새 시작(1일, 임차료·급여 전): 56. 계산은 18절 P0-M2A5-06.
- 새 `exchangePreview(state, config, direction, usdAmountMinor)` = `{ allowed; reasonKo; krwMinor; spreadKrwMinor; usdAvailableBefore/After; krwAvailableBefore/After; runwayBefore; runwayAfter }`.

### 14.5 `upcomingPayments`(`reports.ts:231`)

- `UpcomingPaymentKind`(`reports.ts:211`)에 `RENT`·`SPACE_FEE`를 더한다. 정렬 순서: OVERDUE → WAGE → RENT → SPACE_FEE → FREIGHT → DUTY.
- 임차료 행은 7일 창 안의 임차일에, 선복 요금 행은 7일 창 안의 적용 편 출항일에 넣는다.

### 14.6 `paymentDefaultStatus(state, config)`

- `{ level; oldest: { obligationId; currency; amountMinor; reasonKo; incurredDay } | null; ageDays; dangerFromDay; failAtCloseOfDay; failsAtCloseToday; unpaidByCurrency[]; cashByCurrency[]; recovery }`.
- `recovery`:
  - 원화 기준 의무: `krwNeededToday = KRW 미지급 + 오늘 낼 원화(급여·임차료) − KRW 현금`. `usdLotsNeeded = ceil(krwNeededToday ÷ 128,700)`. `usdAvailableLots = floor(쓸 수 있는 USD ÷ 10,000)`.
  - USD 기준 의무: 다음 수금일·금액(미수 청구서), `KRW_TO_USD` 필요 원화.
  - `heldSpendingKo`: ‘미지급이 있는 동안 고용·훈련·현지 활동·확장은 자금 기준에서 막힙니다’.

### 14.7 `contractProgress`(`progress.ts:44`)

- 규칙 2: `WAREHOUSE_WAIT` 추가, 예측 완료일은 `projectPrepCompletion`(8.4).

## 15. 불변 조건(마감마다, `invariants.ts`)

1. 보관량 ≤ 보관 한도.
2. `handlingLog`의 오늘 `usedPt ≤ capacityPt`.
3. 출항편 예약 합 ≤ 그 편 한도(선복 계약 포함).
4. 공개 묶음과 생성 견적의 `publishDay`는 마감 검사에서 ≤ 마감일 + 1, 저장 불러오기 검사에서 ≤ `state.day`. 생성 견적 ID 유일. 묶음 수 = 그 범위 안의 공개일 수(실패 판은 실패일까지).
5. 환전 기록마다 `FX{nnn}-USD`·`FX{nnn}-KRW` 분개가 정확히 하나씩. USD 장부 `CURRENCY_TRANSFER` 순차변(cents) × 13 = KRW 장부 `CURRENCY_TRANSFER` 순대변(원). 1 cent = 13원(1,300원 ÷ 100)이다.
6. 임차일(≤ 오늘)마다 `RENT-Dddd` 분개가 하나. 적용 편 출항일마다 `SPACE-…` 분개가 하나.
7. 통화별 발생 순서: 미지급 의무 o가 있으면 o보다 뒤에 생긴 같은 통화 의무 가운데 갚은 것이 없다(10.3).
8. `campaign.outcome === 'FAILED'` ⇔ `phase === 'ENDED'`이고 `failure`가 있고 그 의무가 실패일 마감에 미지급이었다.
9. 확장은 최대 1건, `effectiveDay = orderedDay + 1`. 선복 계약은 노선당 1건.

## 16. 화면 요구(후속 Sol 지시서용)

모든 금액은 통화 표시를 붙이고 통화끼리 더하지 않는다. 색만으로 상태를 구분하지 않는다(UI_SPEC:50).

1. **시세표:** 6행. 열: 지역·상품·매입/판매, 기준가(USD/단위), 지수(시작 = 100, ‘돈이 아님’), 관측일·‘N일 전 관측’, 다음 관측일, 이번 묶음 견적 있음. 79일 뒤에는 ‘새 관측 없음’. 정보는 잠그지 않는다.
2. **견적 카드:** 수량 고르기(기본 단위 단계). 수량마다 매입·판매·운임·관세·기여이익·필요 자금·준비 pt·부피·보관 후 사용량/한도. ‘지역 기준가보다 +n%’. H 견적은 이름(예: ‘라벨 작업 포함 전자제품’)과 ‘준비 12pt — 직원 시간이 많이 듭니다’.
3. **본사·창고 글자 표(D02-⑤):** 읽는 순서 수요 → 직원 처리량 → 창고 처리량 → 선복(CL:40·96). 행: 이번 묶음 수요(m³·pt), 직원 처리량(pt/일, 오늘 남은 양), 창고 처리(오늘 사용/한도 pt, 대기 pt), 보관(사용/한도 m³, 남은 재고 몫), 다음 출항편(노선별 m³·kg, 계약 표시), 임차료(금액·다음 지급일), 확장(상태·비용·효과·‘다음 임차일부터 +250,000원’), 선복 계약(노선별 상태·편당 요금·첫 적용 편·해지 불가). 넷을 같은 단위로 합치지 않는다. 한도가 바뀌면 ‘한도가 40 → 60 m³로 늘어 사용률이 내려갔습니다’처럼 분모 변화를 적는다.
4. **환전 칸:** 방향, 금액(100 USD 단계), ‘게임용 고정 환율 1,287원(받을 때)·1,313원(살 때)’, 받는/내는 금액, 차감, 쓸 수 있는 USD = 현금 − 예약 − 미지급, 급여 가능일 전/후, ‘자동 환전은 없습니다’.
5. **위쪽 막대:** 원화 급여 가능일(임차료 포함), 지급 불이행 단계 이름표(‘경고’·‘위험’)와 실패까지 남은 날.
6. **경고·위험 알림:** 원인(통화·의무 이유·금액·발생일), 나이, 실패 마감일, 회복 행동(‘USD {n}을 환전하면 오늘까지 밀린 원화를 모두 갚습니다’, 다음 수금일·금액, 보류할 지출), 현실 문구 ‘실제로는 임금을 정한 날 지급해야 하며 하루 늦어도 체불입니다’(법 조문 원문 대조 전에는 조문 번호를 쓰지 않음, PACKET D04).
7. **경영 실패 화면(D04 조건):**
   - 원인: ‘{발생일}일에 생긴 {통화} {이유} {금액}을 14일 동안 갚지 못해 {실패일}일 마감에 경영 실패’.
   - 통화별 미지급 목록과 통화별 현금(합계 없음).
   - 회복 행동 돌아보기: ‘원화가 부족했습니다. 그동안 USD {가용}가 있었습니다. 환전 명령으로 원화를 마련할 수 있었습니다.’ 실패일 직전 필요 환전액(`recovery.usdLotsNeeded × 100 USD`)과 지출 보류.
   - 단추: ‘같은 시드로 다시 하기’(11.3), ‘결산 보기’.
8. **고용 면담 칸:** 고용 뒤 급여 가능일, ‘이 직원이 늘리는 것: 준비 처리량 +n pt/일’, ‘지금 막힌 곳: 직원·창고 처리·보관·선복·자금’(PACKET D03 가의 표시 제안을 나에서도 쓴다).
9. **일정:** 임차료·선복 요금·밀린 지급 행.
10. **결산(B36):** `outcome`, 실패 사유, 통화별 고정비·환전 기록.

## 17. D03 사전 조정(간이 모형)과 엔진 재측정 계획

### 17.1 모형

- 위치: `m2a5/model/`(부록 A). 엔진이 아니다. 이 명세의 규칙을 Python으로 옮겼다.
- 엔진과 같은 것: 난수(`rng.ts` `drawUniform` 이식, node 실행 값과 일치 확인), 견적 생성(6절), 준비 업무량(7절), 직원 한 명 한 업무, 창고 보관·처리 한도와 순서(8절), 선복, 출항·도착·인도·수금, 임차료, 환전, 지급 순서(10.3), D04.
- 단순화: 직원 영입 조사·의뢰는 ‘물보리가 고용일 H−3 ~ H−1에 다른 일을 못 함’으로, 정책은 탐욕(기여이익 큰 순서, 정시 출항만, 앞 7일 원화 부족 시 100 USD 단위 환전)으로 대신했다.
- 검산: 1일 묶음 기대 경로 2개가 17일 USD 3,500·3,430으로 맞았다(`check_paths.py`). D04 사례 수치가 손계산과 맞았다(`check_d04.py`).
- 분석값 = USD 순자산 + KRW 순자산 ÷ 1,313. 설계 비교 전용이다. 시작값은 3,000 + 10,000,000 ÷ 1,313 ≈ 10,616이다.

### 17.2 결과(20시드 1001~1020, `final_eval.txt`)

‘이득’은 기준 변형보다 분석값이 큰 시드 수다. 모든 수는 간이 모형 추정(엔진 비교 실행기로 다시 잰다)이다.

**A. 결정 묶음 문구 그대로(F1~F6, 묶음당 5건, 6 m³당 1pt, 선복 30 USD)**

| 변형 | 분석값 중앙 | 기여이익 중앙 USD | 환전 중앙 USD | 미지급 발생 | 경영 실패 | 기준 대비 중앙 | 이득 |
|---|---:|---:|---:|---|---|---:|---|
| V0 투자 없음 | 5,295 | 6,763 | 4,500 | 1/20 | 0/20 | — | — |
| 환전 없음 | 2,658 | 5,852 | 0 | 20/20 | 20/20 (71일) | — | — |
| 7일 창고 확장 | 4,624 | 6,637 | 5,100 | 1/20 | 0/20 | −531 | 2/20 |
| 1일 상하이 선복 계약 | 5,200 | 7,028 | 4,500 | 5/20 | 0/20 | +193 | 15/20 |
| 7일 바름(2pt) 고용 | −2,669 | 3,970 | 6,900 | 20/20 | 19/20 (83~88일) | −7,979 | 0/20 |
| 36일 바름 고용 | −420 | 5,164 | 8,100 | 20/20 | 0/20 | −5,537 | 0/20 |
| 7일 현돌(3pt) 고용 | −2,896 | 3,450 | 6,400 | 20/20 | 20/20 (75~81일) | −8,224 | 0/20 |
| 21일 확장 + 22일 현돌 | −2,904 | 4,175 | 7,100 | 20/20 | 20/20 (80~89일) | −8,250 | 0/20 |

- 임금 0원 직원을 7일에 더해도 기여이익 중앙이 +265 USD다(`shadow.py`). 병목이 직원이 아니다. 거절 원인 중앙은 자금 134·보관 37·선복 6·직원 2건이다.

**P. 사전 조정안(F1~F6 + H1~H6, 묶음당 6건, H 0.25 m³당 1pt, 선복 30 USD) — 이 명세의 기본값**

| 변형 | 분석값 중앙 | 기여이익 중앙 USD | 환전 중앙 USD | 미지급 발생 | 경영 실패 | 기준 대비 중앙 | 이득 |
|---|---:|---:|---:|---|---|---:|---|
| V0 투자 없음 | 18,009 | 19,477 | 4,500 | 0/20 | 0/20 | — | — |
| 환전 없음 | 13,998 | 15,043 | 0 | 20/20 | 20/20 (71일) | — | — |
| 7일 창고 확장 | 17,411 | 19,425 | 5,100 | 0/20 | 0/20 | −545 | 0/20 |
| 1일 상하이 선복 계약 | 17,939 | 19,767 | 4,500 | 0/20 | 0/20 | −343 | 3/20 |
| 1일 하이퐁 선복 계약 | 17,949 | 19,778 | 4,500 | 0/20 | 0/20 | −360 | 3/20 |
| 7일 바름 고용 | 17,454 | 25,078 | 10,700 | 0/20 | 0/20 | −178 | 7/20 |
| 22일 바름 고용 | 18,131 | 24,704 | 9,600 | 0/20 | 0/20 | +260 | 11/20 |
| 36일 바름 고용 | 18,617 | 24,211 | 8,600 | 0/20 | 0/20 | +322 | 12/20 |
| 7일 현돌 고용 | 16,904 | 25,894 | 12,000 | 0/20 | 0/20 | −1,009 | 5/20 |
| 22일 현돌 고용 | 16,937 | 24,646 | 10,800 | 0/20 | 0/20 | −920 | 4/20 |
| 21일 확장 + 22일 현돌 | 18,558 | 26,810 | 11,300 | 0/20 | 0/20 | +517 | 13/20 |
| 7일 확장 + 7일 현돌(7일 확장 대비) | 16,547 | 26,081 | 12,600 | 0/20 | 0/20 | −544 | 8/20 |
| 22일 바름 + 36일 화랑콩(두 명) | 13,378 | 24,076 | 13,700 | 1/20 | 0/20 | −5,082 | 0/20 |

읽는 법:
- **고용이 이득인 조건이 생긴다.** 바름(2pt)은 시드에 따라 7~12/20에서 이득이다. 작업 많은 견적이 많이 나온 판이다.
- **누구를, 무엇과 함께 고용하는지가 갈린다.** 현돌(3pt)만 고용하면 4~5/20이다. 처리 한도 6pt에서 1pt가 남기 때문이다. 확장과 함께하면 13/20이다(CL-03 ‘분모’).
- **늘 이득은 아니다.** 두 명째 고용은 0/20이다. 7일 고용은 아직 운전자본이 적어 손해인 판이 많다(‘먼저 지출하고 나중에 얻는다’, CL-02).
- **환전 판단은 남는다.** 환전 없이는 20/20이 71일에 실패한다(D01·D04 교훈 유지). 고용하면 환전액이 4,500 → 8,600~12,600 USD로 늘어 자본과 원화 급여가 서로 당긴다.
- **약점:** 창고 확장만으로는 0/20, 선복 계약만으로는 3/20이다. 확장은 현돌 고용과 함께일 때만 뜻이 있다. 투자 없는 회사가 흑자가 되어 경제 규모가 A의 약 3.4배다(20절 Q1·Q4).

### 17.3 엔진 재측정 계획(비교 실행기 `src/engine/sim/`)

- 정책 공통 규칙(새 시나리오에서만): 하루 명령 맨 앞에 ‘앞 7일 원화 지출(급여·임차료·예정 계약금·설치비) + 원화 미지급 − 원화 현금’이 양수면 100 USD 단위로 올림해 `EXCHANGE_CURRENCY`(쓸 수 있는 USD 한도 안). `IDLE`은 하지 않는다. 새 정책 `NO_FX`는 환전만 빼고 `MAX_CONTRIBUTION`과 같다.
- 정책 수정: 견적은 `offerDef(state, config)`로 읽는다(`policies.ts:25·33`). 새 시나리오에서만 직접 무역은 받을 수 있는 가장 큰 수량부터 시험하고, 정시 출항만 받는다. 기존 4개 시나리오의 정책 동작은 그대로 둔다.
- 새 실행 인수 `--variants`: `hire:EMP06@22`, `hire:EMP04@22`, `expand@21`, `space:ROUTE02@1` 등. 고용 변형은 조사(H−3)·의뢰(H−2~H−1)·고용(H) 명령을 실제로 넣는다.
- 새 지표: `outcome`, 실패일·사유, 첫 미지급일, 통화별 환전 합(방향별), 통화별 고정비, 창고 대기 업무-일, 보관·처리 사용률, 직원 사용률, 거절 원인별 수. 통화별로 따로 둔다. 분석값은 `compare` 출력에만 ‘분석 전용’으로 붙인다.
- 확정 기준(제안): 투자 없는 `MAX_CONTRIBUTION` 실패 0/20, `NO_FX` 실패 20/20, 바름 고용 변형 가운데 하나 이상이 3~15/20에서 이득, 두 명 고용 ≤ 3/20, 현돌 + 확장이 현돌만보다 이득 시드가 많음. 벗어나면 H 서비스 대금·준비 pt·묶음당 건수만 고치고 DECISIONS에 적는다.
- 기존 4개 시나리오의 회귀 확인은 `--scenarios`로 기존 목록만 돌려 지표 차이 0을 본다.

## 18. 인수 명세 (P0-M2A5-01 ~ 17)

공통: 시나리오 `SCENARIO_M2_OPERATIONS`, 시드 42032026(`game_config.json` `config.seed`), 시작 USD 3,000.00 · KRW 10,000,000원, 직원 귀솔(EMP01)·물보리(EMP02) 2pt·80,000원. ‘대기’는 명령 없이 하루를 닫는 것이다. `tests/acceptance_cases.json` 형식(`P0-M2A-04` 항목 참고)으로 넣는다. 03·11은 시험용 설정을 쓴다.

**P0-M2A5-01 결정적 견적 공개**
- 초기: 새 게임. 행동: 7일까지 대기. 7일 마감 전과 뒤의 상태를 본다. 같은 시드로 두 번 실행하고, 한쪽은 4일에 저장·불러오기, 7일 마감 재전송을 한다.
- 기대(8일 묶음, 난수 22개 `MARKET-B01` 커서 0~21):
  - 지수: 0.805097 × 7 = 5.64 → 5 − 3 = +2. 0.736039 × 7 = 5.15 → +2. 의류·화장품 모두 halfUp(10,000 × 102, 100) = 10,200 bp(102).
  - 판매지: 0.966764 × 2 → 1 = 상하이(의류). 0.413184 × 2 → 0 = 하이퐁(화장품).
  - 지역 요인(× 9 − 4): 0.252801 → −2, 0.315194 → −2, 0.559397 → +1, 0.715990 → +2, 0.676596 → +2, 0.425626 → −1.
  - 시세표(cents): 평택 의류 halfUp(1,000 × 10,200 × 98, 10⁶) = halfUp(999,600,000) = 1,000. 평택 화장품 4,000 × 10,200 × 98 = 3,998,400,000 → 3,998. 하이퐁 의류 1,400 × 10,200 × 101 → 1,442. 하이퐁 화장품 4,900 × 10,200 × 102 → 5,098. 상하이 의류 1,350 × 10,200 × 102 → 1,405. 상하이 화장품 5,000 × 10,200 × 99 → 5,049.
  - 거래처 차이(× 7 − 3): 0.358910 → −1, 0.449631 → 0, 0.617509 → +1, 0.438899 → 0.
  - 단가: 의류 매입 1,000 × 99 / 100 = 990(9.90). 의류 판매(상하이) 1,405(14.05). 화장품 매입 halfUp(3,998 × 101, 100) = 4,038(40.38). 화장품 판매(하이퐁) 5,098(50.98).
  - 최대 물량: 0.362755 × 3 → 1 → 배수 2 → 의류 200개. 0.564103 × 3 → 1 → 화장품 100상자.
  - 주선: i = 0: 0.253370 × 12 → 3, j = 3. i = 1: 0.261790 × 11 → 2, j = 3. i = 2: 0.520673 × 10 → 5, j = 7. i = 3: 0.418362 × 9 → 3, j = 6. i = 4: 0.594932 × 8 → 4, j = 8. i = 5: 0.850594 × 7 → 5, j = 10. 뽑힌 칸 {3, 0, 7, 6, 8, 10} → F1·F4·H1·H2·H3·H5.
  - 견적 10건: `MKT-D008-APP-BUY`(9.90, 최대 200), `-APP-SELL`(상하이 14.05, 납기 15, 결제 19), `-COS-BUY`(40.38, 최대 100), `-COS-SELL`(하이퐁 50.98, 납기 15, 결제 17), `-F1`(납기 15, 결제 17), `-F4`(22, 26), `-H1`(22, 24), `-H2`(22, 26), `-H3`(22, 24), `-H5`(22, 26). 모두 유효 8~10일.
  - 7일 마감 전에는 `state.market.offers`와 모든 읽기 함수에 `MKT-D008-*`가 없다. 마감 뒤(8일 `PENDING_OPEN`)에 있다. `state.rng.cursors`는 비어 있다.
  - 두 실행과 저장 재개 실행의 묶음 1~11 정의가 모두 같다. 저장된 묶음을 처음부터 다시 계산한 값과 같다. 다른 시드(1001)와는 한 묶음 이상 다르다.

**P0-M2A5-02 시세표·체결 가격 고정**
- 행동: 7일까지 대기. 8일 `ACCEPT_TRADE(MKT-D008-APP-BUY, MKT-D008-APP-SELL, quantity 200, plan EMP01·ROUTE02-D009)`.
- 기대: 매입 990 × 200 = 198,000(1,980.00), 판매 1,405 × 200 = 281,000(2,810.00), 운임 180.00, 관세 applyBasisPoints(198,000, 500) = 9,900(99.00). 필요 자금 2,259.00 ≤ 3,000.00. 준비 2 + (2 − 1) = 3pt → 8·9일 진행 → 9일 출항 → 13일 도착·인도. 기여이익 2,810 − 1,980 − 180 − 99 = 551.00.
- 15일 묶음 지수: 의류 u = 0 → 10,200(102), 화장품 u = +3 → halfUp(10,200 × 103, 100) = 10,506(105). 계약 매출·청구는 2,810.00 그대로다. 수금일 max(19, 13) = 19일.
- `marketTable` 8일: 평택 의류 기준가 1,000·지수 102·관측 8·다음 15. 14일: 같은 값, `ageDays` 6. 80일: 78일 묶음 값, `nextObservationDay` null. 85일: `ageDays` 7.

**P0-M2A5-03 보관 한도 (시드 42032026 15일 묶음 사용)**
- 15일 묶음은 F1·F5·F6·H2·H3·H4다(모형 생성, 난수 `MARKET-B02`).
- 행동: 14일까지 대기. 15일: ① `ACCEPT_FORWARDING(MKT-D015-F1, plan EMP01·ROUTE01-D016)` ② `ACCEPT_FORWARDING(MKT-D015-F5, plan EMP02·ROUTE02-D016)` ③ `ACCEPT_FORWARDING(MKT-D015-F6, plan EMP02·ROUTE01-D016)`.
- 기대: ① 보관 0 + 24,000 = 24,000 L ≤ 40,000 → 수락. ② 24,000 + 18,000 = 42,000 > 40,000 → 거절 ‘보관 공간 부족 — 평택 창고 24 / 40 m³, 이 화물 18 m³…’. 상태 변화 없음(계약·예약·운임 없음). ③ 24,000 + 6,000 = 30,000 → 수락. USD 현금 3,000 − 200 − 200 = 2,600.00.
- 16일 출항 뒤 보관량 0. 마감마다 보관량 ≤ 한도.
- 변형: 14일 `EXPAND_WAREHOUSE` → 15일 한도 60,000 L → ②가 수락된다(42,000 ≤ 60,000).
- 1일 묶음 화장품 + 가구 + 자동차 부품 = 1,000 + 24,000 + 8,000 = 33,000 L는 보관으로 거절되지 않는다.

**P0-M2A5-04 하루 처리 한도·창고 대기**
- 행동: 1일 `SCOUT_SITE(VEN_PORT, EMP02)`. 2일 `START_RECRUIT_QUEST(EMP04, EMP02)`(3pt → 2·3일). 4일 `HIRE_CANDIDATE(EMP04)`(계약금 110,000 × 5 = 550,000원, 5일부터 근무). 8일: ① `ACCEPT_TRADE(MKT-D008-APP-BUY, -APP-SELL, quantity 100, plan EMP01·ROUTE02-D009)` ② `ACCEPT_FORWARDING(MKT-D008-H1, plan EMP04·ROUTE01-D016)` ③ `ACCEPT_FORWARDING(MKT-D008-H3, plan EMP02·ROUTE01-D016)`.
- 계약: CT001 의류(준비 2pt), CT002 H1(12pt), CT003 H3(12pt). USD: 3,000 − 990 − 180 − 200 − 200 = 1,430.00, 관세 예약 49.50.
- 8일 배분(한도 6): CT001(출항 9) 귀솔 2 → 남은 4. CT002(출항 16, 납기 22, ID 앞) 현돌 3 → 남은 1. CT003 물보리 원함 2, 받음 1. `handlingLog[8] = { capacityPt 6, usedPt 6, waits [{TASK003, 2, 1}] }`.
- 8일(마감 전) `contractProgress(CT003)`: `WAREHOUSE_WAIT`(warn). 예측: CT003 8일 1 + 9~13일 2 × 5 = 11 → 14일 12 → 완료 14 ≤ 16, 위험 아님. CT002: 3 × 4일 = 12 → 11일 완료.
- 실제 진행이 예측과 같다(14일 완료, 16일 출항).
- 변형: 7일에 확장 → 8일 한도 9 → 대기 없음.
- 직원 2명만이면 하루 4pt ≤ 6pt라 장부·일정이 규칙 2의 한도 없는 계산과 같다.

**P0-M2A5-05 준비 업무량**
- 기대: 의류 100·200·300개 → 2·3·4pt. 화장품 50·100·150상자 → 2·3·4pt. 1일 묶음 직접 무역 2pt. OFFER_FWD_01 ceil(24,000 ÷ 6,000) = 4pt. OFFER_FWD_02 ceil(8,000 ÷ 6,000) = 2pt. F5 3pt, F3 ceil(9,000 ÷ 6,000) = 2pt, F6 max(2, 1) = 2pt, H1~H6 ceil(3,000 ÷ 250) = 12pt.
- 견적 미리 보기·수락 뒤 `Task.requiredWorkUnits`·화면 값이 같다.

**P0-M2A5-06 임차료·고정비**
- 행동: 90일까지 대기(환전 없음은 09와 같다. 여기서는 56일까지만 본다).
- 기대: 1일 마감 KRW 10,000,000 − 450,000 − 160,000 = 9,390,000원. `RENT-D001`·`RENT-D031`이 한 번씩, 차변 `RENT_EXPENSE`.
- 1일(열린 뒤, 임차료 전) `payrollRunwayDay` = 56: 56일 마감 잔액 10,000,000 − 160,000 × 56 − 450,000 × 2 = 140,000 ≥ 0. 57일 −20,000 < 0.
- 규칙 1 시나리오는 62 그대로(`previews.test.ts:220`).
- 계약 기여이익에 임차료가 없다. 원화 보고 행 합 = 운영 손익. 마감 재전송·저장 재개에도 임차료 분개가 늘지 않는다.

**P0-M2A5-07 환전**
- 행동: 1일 `EXCHANGE_CURRENCY(USD_TO_KRW, 100,000)`(1,000 USD), 이어서 `EXCHANGE_CURRENCY(KRW_TO_USD, 100,000)`.
- 기대: 첫 명령 USD 현금 3,000 → 2,000.00. KRW +1,287,000원(10 × 128,700). 차감 10 × 1,300 = 13,000원(`FX_SPREAD_EXPENSE`). `FX001-USD`·`FX001-KRW` 각각 대차 일치. 둘째 명령 KRW −1,313,000원, 차감 13,000원, USD 3,000.00으로 복귀. 왕복 손실 26,000원.
- 거절: 금액 5,000(50 USD) → ‘100 USD 단위’. 1일 기대 경로(화장품 + 주선 2건, 현금 420·예약 100·가용 320) 뒤 40,000(400 USD) → ‘환전할 수 있는 USD가 부족…’, 30,000(300 USD)은 수락. 같은 명령 ID 재전송 → DUPLICATE, 상태 그대로.
- 같은 날 급여: 대기로 57일까지 간 뒤 57일 `EXCHANGE_CURRENCY(USD_TO_KRW, 10,000)` → 2단계 뒤 KRW 140,000 + 128,700 = 268,700 → 급여 160,000 → 108,700원, 미지급 없음.
- 엔진이 스스로 환전한 분개가 어느 실행에도 없다.

**P0-M2A5-08 자동 지급 순서**
- 행동: 1일 `EXCHANGE_CURRENCY(USD_TO_KRW, 70,000)`(700 USD = 900,900원). 그 뒤 대기.
- 기대: 60일 마감 KRW = 10,000,000 + 900,900 − 160,000 × 60 − 450,000 × 2 = 400,900원, 미지급 0.
- 61일 6단계: 밀린 지급 없음 → 임차료 450,000 > 400,900 → `RENT-D061` 미지급. 급여 귀솔 80,000 ≤ 400,900이지만 같은 통화 미지급이 있어 미지급(규칙 1이면 지급). 물보리도 미지급. 마감: 현금 400,900, 미지급 610,000원(3건), 기준 의무 `RENT-D061`.
- 62일: 밀린 지급 첫 의무 450,000 > 400,900 → 멈춤(뒤의 80,000짜리를 먼저 갚지 않음). 마감 미지급 770,000원.
- 75일 마감: 61 + 14 = 75 → 경영 실패, 기준 의무 `RENT-D061` 450,000원.

**P0-M2A5-09 지급 불이행 단계·경영 실패(D04)**
- 행동 A: 대기만(환전 없음).
- 기대 A: 56일 마감 KRW 140,000. 57일: 귀솔 80,000 지급 → 60,000, 물보리 80,000 미지급(`WAGE-D057-EMP02`). 단계: 57일 마감 경고(나이 0), 63일 경고(6), 64일 위험(7), 71일 `failsAtCloseToday`. 64일 회복 안내: (1,490,000 + 160,000 − 60,000) ÷ 128,700 = 12.35 → 13 → ‘USD 1,300을 환전하면…’, 쓸 수 있는 USD 3,000.00.
- 71일 마감 미지급: 80,000 + 160,000 × 3(58~60) + 450,000 + 160,000(61) + 160,000 × 10(62~71) = 2,770,000원. `outcome` FAILED, `failure = { day 71, obligationId WAGE-D057-EMP02, currency KRW, amountMinor 80,000, incurredDay 57 }`, `unpaidByCurrency` KRW 2,770,000원(30건), `cashByCurrency` USD 300,000 cents(3,000.00 USD)·KRW 60,000원. 공개 묶음은 1·8·…·71일 11개다(71일 마감은 7단계를 건너뛰고, 그 뒤 마감은 없다). `phase` ENDED. 이후 명령 거절.
- 행동 B: 70일 `EXCHANGE_CURRENCY(USD_TO_KRW, 200,000)`.
- 기대 B: 60,000 + 2,574,000 = 2,634,000 → 밀린 지급 2,450,000(69일까지) → 184,000 → 70일 급여 160,000 → 24,000원, 미지급 0, 실패 없음. 71일에 다시 미지급(`WAGE-D071-EMP01` 기준, 85일 실패 예정).
- 행동 C: 70일 `EXCHANGE_CURRENCY(USD_TO_KRW, 10,000)`.
- 기대 C: 188,700 → `WAGE-D057-EMP02` 80,000 → 108,700 → `WAGE-D058-EMP01` 80,000 → 28,700 → `WAGE-D058-EMP02` 80,000에서 멈춤. 70일 마감 기준 의무는 58일 발생(나이 12, 위험). 71일은 실패가 아니다. 72일 마감 실패(58 + 14).

**P0-M2A5-10 창고 확장(DK-11)**
- 행동: 22일 `EXPAND_WAREHOUSE`.
- 기대: 22일 `FACILITY-SETUP-WH01` 200,000원. 22일 한도 40 m³·6pt, 23일부터 60 m³·9pt. `RENT-D031` 700,000원, `RENT-D061` 700,000원.
- 22일(명령 뒤) `payrollRunwayDay` = 54: 54일 마감 10,000,000 − 160,000 × 54 − 450,000 − 200,000 − 700,000 = 10,000 ≥ 0, 55일 −150,000.
- 거절: 두 번째 명령 → ‘한 번만’. 쓸 수 있는 KRW < 200,000이면 → ‘설치비 자금이 부족’, 미지급 없음.

**P0-M2A5-11 선복 장기 계약(DK-21, 시험용 설정)**
- 설정: 1일 정적 묶음에 F5와 같은 상하이행 가구 90점(18 m³·1,800 kg, 준비 3pt, 납기 15) 주선 견적 2건(S-A, S-B)을 더한 시험용 시나리오.
- 행동 A(계약 없음): 1일 S-A를 `plan { EMP01, ROUTE02-D009 }`, S-B를 `plan { EMP02, ROUTE02-D009 }`로 받는다 → S-B는 일괄 확정 전체가 거절된다(‘…운송편 예약 불가: 이 출항편의 남은 화물 공간이 부족합니다 (부피 18m³ 필요, 남은 12m³)…’).
- 행동 B: 1일 `SIGN_SPACE_CONTRACT(ROUTE02)` 먼저 → 첫 적용 편 = 출항일 ≥ 8인 첫 편 = 9일. `ROUTE02-D009` 한도 40,000 L·6,500,000 g → 둘 다 예약(36,000 L, 3,600 kg). 보관 36,000 ≤ 40,000.
- 요금: 9·16·…·86일 12편 × 3,000 = 36,000 cents(360.00 USD), `SPACE-ROUTE02-D009` 등. 예약이 없는 편에도 낸다.
- 2일 편(`ROUTE02-D002`) 한도는 30 m³ 그대로다. 같은 노선 두 번째 계약은 거절.

**P0-M2A5-12 기존 기대값 보존**
- 행동: 1일 `ACCEPT_TRADE(OFFER_BUY_02, OFFER_SELL_02, plan EMP01·ROUTE02-D002)`, `ACCEPT_FORWARDING(OFFER_FWD_01, plan EMP02·ROUTE01-D002)`, `ACCEPT_FORWARDING(OFFER_FWD_02)` + `BOOK_SAILING(ROUTE01-D009)`. 2일 `ASSIGN_TASK(FWD_02 업무, EMP01)`. 17일까지.
- 기대: 가구 준비 4pt → 1·2일 물보리 → 2일 출항. 1일 현금 420.00·예약 100.00·가용 320.00, 7일 현금 320.00·채권 2,880.00, 17일 현금 3,500.00(`scenarios.json` `PATH_COSMETICS_AND_FORWARDING`). 의류 경로는 3,430.00. 17일 KRW 10,000,000 − 450,000 − 160,000 × 17 = 6,830,000원.
- 거절 2건(`REJECT_SECOND_DIRECT_TRADE`·`REJECT_FORWARDING_SAME_SAILING`)의 USD 값이 자료와 같다. 1일 선복 계약을 맺어도 2일 편 거절은 그대로다.
- 규칙 1 시험·M1 세 경로는 고치지 않고 통과한다.

**P0-M2A5-13 저장 판본 6과 재현**
- 7일 `PENDING_OPEN`, 8일 `AWAITING_INPUT`(환전 명령 계획만), 22일(확장 직후)에 저장·불러오기를 하고 끝까지 같은 명령을 주면, 저장 없는 실행과 상태가 같다(`market`·`warehouse`·`exchanges`·`campaign` 포함).
- 판본 5 규칙 1 저장은 `migrateV5toV6`으로 열리고 이후 결과가 판본 5 실행과 같다.
- 생성 견적의 `publishDay`를 오늘보다 크게 고친 저장, 보관량이 한도를 넘는 저장은 불변 조건으로 거절된다.

**P0-M2A5-14 실패 결산과 같은 시드 다시**
- 09 행동 A 뒤 `campaignSummary`: `outcome` FAILED, 통화별 값만, 합계 필드 없음.
- `restartWithSameSeed` → 1일 새 게임, 시드 42032026, 7일 마감 뒤 8일 묶음이 01의 값과 같다.

**P0-M2A5-15 통화 분리**
- 09 행동 A 동안 USD 3,000.00이 있어도 원화 미지급이 USD로 갚아지지 않는다. 어떤 보고 필드도 USD와 KRW를 더하지 않는다. 결산·실패 화면 읽기 값에 1,300원 환산 합계가 없다.

**P0-M2A5-16 가격 수용자**
- 같은 시드로 ‘받을 수 있는 견적을 모두 받는 정책’과 대기만 하는 실행을 78일까지 돌리면 묶음 1~11의 지수·시세표·견적 정의가 모두 같다.

**P0-M2A5-17 비교 실행기**
- 기본 묶음에 새 시나리오가 들어간다. 17.3의 변형·지표가 출력에 있다. 같은 입력 두 번이면 출력이 같다. 기존 4개 시나리오만 돌리면 이 작업 전 출력과 지표 차이 0이다.
- D03 확정은 17.3 기준으로 판단하고 결과를 DECISIONS에 적는다.

## 19. 범위 밖

- D05 고객 연체·대손: M3. 고객은 결제일에 전액 낸다(`engine.ts:1063`).
- D06 사건 공통 틀·EV05 업무량 급증·단기 인력·외주: M2a-6a.
- D07 재협상(납기 연장): M2a-6b. ‘고객과 납기 협상’ 버튼은 비활성 그대로.
- D08 위임·‘다음 견적일까지 진행’: M2a-6c. 환전·고용·수락은 그때도 위임하지 않는다.
- 변동 환율·기말 환산 손익: M3.
- 시장 반응·수요 소진·경쟁사: M3.
- 플레이어가 정하는 처리 순서(D02-④ 나), 창고 여러 곳, 창고 무게 한도, 확장 되돌리기, 선복 계약 해지.
- 남은 재고 재판매(B42의 재판매 부분). 이번에는 수량 고르기만 한다.
- M2b 능력 처리량(`CHARACTER_WEIGHTED`)과 강화.
- 본사 그림 장면(M5, DECISIONS:92).
- 다른 시드로 다시 하기.

## 20. 열린 질문

| 번호 | 질문 | 이 명세의 기본값 | 막는 것 |
|---|---|---|---|
| Q1 | D03 사전 조정안을 받는가. 작업 포함 주선 등급 H1~H6(3 m³·12pt·기여이익 840 USD), 묶음당 6건, 등급별 부피 계수. 결과로 투자 없는 회사도 흑자가 된다(분석값 18,009, 문구 그대로 안 5,295) | 받는다고 가정. 거절하면 자료만 A 안으로 바꾼다(엔진 동작은 같음). 그때 고용은 늘 손해다 | 자료값. 엔진 작업은 막지 않는다 |
| Q2 | DECISIONS 1075행 ‘④ 가 지급 우선순위 자동’을 ‘업무(창고 처리) 우선순위 자동’으로 고칠지 | 둘 다 자동으로 구현 | 기록 문구 |
| Q3 | 확장 임차료 증액분을 다음 정기 임차일부터 받는 틈(예: 2일 확장 → 31일까지 무료)을 그대로 둘지 | 승인 원문대로 둠 | 없음 |
| Q4 | 선복 계약 30 USD/편·해지 불가·take-or-pay와, 확장·선복이 단독으로는 거의 이득이 아닌 결과를 받는지 | 받음. 엔진 재측정 뒤 다시 봄 | 없음 |
| Q5 | 실패·경고 화면의 현실 문구(임금 정기 지급, 지연이자) 원문 대조 | 조문 번호 없이 일반 문장만 | Sol 지시서 |
| Q6 | 비교 실행기 `compare`의 ‘분석 전용’ 환산값(÷ 1,313)을 허용하는지 | 허용(게임 화면·결산에는 없음) | 17.3 |
| Q7 | 1일 묶음 가구 준비를 4pt(규칙 2 통일)로 둘지, 2pt로 남길지 | 4pt. 1일 배정을 놓치면 2일 편을 못 탄다 | 첫 거래 안내 문구 |
| Q8 | 묶음당 10건(초안 7건)의 읽기 부담 | 10건. 사용성 관찰 항목 | Sol 화면 |
| Q9 | 17.3 확정 기준 범위(3~15/20 등) | 제안값 | 재측정 판정 |

## 부록 A. 모형 파일과 재현 명령

위치: `m2a5/model/`(이 작업 공간). 저장소에는 넣지 않았다.

| 파일 | 내용 |
|---|---|
| `rng.py` | `rng.ts` `drawUniform` 이식. `python3 rng.py`가 node 실행값 `[0.80509671731852, 0.7360393980052322, …]`과 같다 |
| `rng_engine_copy.ts` | 대조용 엔진 `rng.ts` 사본. `node --experimental-strip-types`로 실행 |
| `market.py` | 6절 견적 생성. F1~F6·H1~H6 |
| `sim.py` | 13절 하루 순서의 참조 모형과 탐욕 정책 |
| `check_paths.py` | 1일 기대 경로 3,500·3,430 USD 검산 |
| `check_d04.py` | 18절 08·09 수치 검산 |
| `final_eval.py` → `final_eval.txt` | 17.2 표 |
| `explore.py`·`explore2.py`·`search.py`·`shadow*.py`·`focus*.py`·`trace*.py` | 탐색 기록(그림자 가치, 격자 탐색, 변형 비교) |

재현: `cd m2a5/model && python3 check_paths.py && python3 check_d04.py && python3 final_eval.py`. 표준 라이브러리만 쓴다. 같은 입력이면 같은 출력이다.

## 부록 B. 바꿀 파일(엔진 지시서용)

- 엔진: `types.ts`(5절), `engine.ts`(12·13절), `ledger.ts`(5.3), `reservations.ts`(보관·선복 한도), `capacity.ts`(창고 요약 재사용), `progress.ts`(8.4), `previews.ts`(14.4), `reports.ts`(14절), `invariants.ts`(15절), `save.ts`·`save-shape.ts`(5.4), `catalog.ts`(`offerDef`), 새 `market.ts`(6절)·`facility.ts`(8·9절)·`payments.ts`(10·11절, 선택).
- 자료: 새 `data/market_rules.json`·`schemas/market_rules.schema.json`, `data/scenarios.json`(새 항목), `data/parameters.json`, `PACKAGE_STATUS.json`, `MANIFEST.json`.
- 로더·검사기: `src/content/scenario.ts`, `tools/validate_data.py`(틀 납기 ≥ 운송일, 결제 ≥ 납기, 묶음당 건수 ≤ 틀 수, 거래처 이름 존재, 시세표 6행, 매개변수 범위).
- 비교 실행기: `src/engine/sim/policies.ts`·`sim.ts`·`metrics.ts`·`cli.ts`(17.3).
- 시험: 새 `src/engine/m2a5-*.test.ts`. 기존 시험 파일은 고치지 않는다. `tests/acceptance_cases.json`에 18절.
- 화면(후속 Sol): `src/ui/main.ts`(거래처 이름 자료화, `offerDef`), `src/ui/reports.ts`, 16절.

## 부록 C. 자료 뼈대(값은 4절과 같다)

`data/market_rules.json`(금액은 기존 자료처럼 달러 표시값. 로더가 cents로 한 번만 바꾼다):

```json
{
  "schema_version": "0.1.0", "data_basis": "DESIGN", "source_refs": ["DESIGN-V04"],
  "numeric_values_status": "합성 개발용 값. 실제 시세·운임·작업 단가가 아님.",
  "rule_sets": [{
    "id": "M2A5_PYEONGTAEK",
    "publish": { "first_day": 1, "interval_days": 7, "last_day": 78, "valid_days": 3, "batch0": "market_offers.json" },
    "rng": { "stream_prefix": "MARKET-B", "stream_digits": 2 },
    "index": { "goods": ["APPAREL", "COSMETICS"], "start_bp": 10000, "min_bp": 8500, "max_bp": 11500, "step_pct": [-3, 3] },
    "regional_pct": [-4, 4],
    "counterparty_pct": [-3, 3],
    "rows": [
      { "city_id": "PYEONGTAEK", "good_id": "APPAREL", "side": "BUY", "base_price": { "currency": "USD", "amount": 10.00 } },
      { "city_id": "PYEONGTAEK", "good_id": "COSMETICS", "side": "BUY", "base_price": { "currency": "USD", "amount": 40.00 } },
      { "city_id": "HAIPHONG", "good_id": "APPAREL", "side": "SELL", "base_price": { "currency": "USD", "amount": 14.00 } },
      { "city_id": "HAIPHONG", "good_id": "COSMETICS", "side": "SELL", "base_price": { "currency": "USD", "amount": 49.00 } },
      { "city_id": "SHANGHAI", "good_id": "APPAREL", "side": "SELL", "base_price": { "currency": "USD", "amount": 13.50 } },
      { "city_id": "SHANGHAI", "good_id": "COSMETICS", "side": "SELL", "base_price": { "currency": "USD", "amount": 50.00 } }
    ],
    "trade": {
      "buy_city_id": "PYEONGTAEK", "sell_city_ids": ["HAIPHONG", "SHANGHAI"],
      "id_tags": { "APPAREL": "APP", "COSMETICS": "COS" },
      "base_lot": { "APPAREL": 100, "COSMETICS": 50 }, "max_lots_choices": [1, 2, 3],
      "sell_deadline_offset_days": 7, "payment_offset_days": { "HAIPHONG": 9, "SHANGHAI": 11 },
      "counterparties": {
        "APPAREL": { "BUY": "SUPPLIER_DEMO", "HAIPHONG": "CUSTOMER_DEMO", "SHANGHAI": "CUSTOMER_SHA_APPAREL" },
        "COSMETICS": { "BUY": "SUPPLIER_DEMO_COSMETICS", "HAIPHONG": "CUSTOMER_HAI_COSMETICS", "SHANGHAI": "CUSTOMER_DEMO_SHANGHAI" }
      }
    },
    "forwarding": {
      "per_batch": 6,
      "templates": [
        { "id": "F1", "service_class": "STANDARD", "good_id": "FURNITURE", "quantity": 120, "destination_city_id": "HAIPHONG", "service_fee": { "currency": "USD", "amount": 380 }, "deadline_offset_days": 7, "payment_offset_days": 9, "counterparty_id": "SHIPPER_DEMO_FURNITURE" },
        { "id": "H1", "service_class": "HANDLING", "title_ko": "라벨 작업 포함 전자제품", "good_id": "ELECTRONICS", "quantity": 100, "destination_city_id": "HAIPHONG", "service_fee": { "currency": "USD", "amount": 1040 }, "deadline_offset_days": 14, "payment_offset_days": 16, "counterparty_id": "SHIPPER_DEMO_ELECTRONICS" }
      ]
    },
    "drop_if_beyond_campaign": true
  }],
  "counterparties": [
    { "id": "SUPPLIER_DEMO", "name_ko": "의류 공급자" },
    { "id": "CUSTOMER_SHA_APPAREL", "name_ko": "상하이 의류 고객" },
    { "id": "CUSTOMER_HAI_COSMETICS", "name_ko": "하이퐁 화장품 고객" },
    { "id": "SHIPPER_DEMO_ELECTRONICS", "name_ko": "전자제품 화주" },
    { "id": "SHIPPER_DEMO_COSMETICS", "name_ko": "화장품 화주" },
    { "id": "SHIPPER_DEMO_APPAREL", "name_ko": "의류 화주" }
  ],
  "$schema": "../schemas/market_rules.schema.json"
}
```

- `templates`는 표 6.6-1·6.6-2의 12개를 자료 순서 F1~F6, H1~H6으로 모두 적는다(위는 두 줄만 보였다). `counterparties`에는 기존 `src/ui/main.ts:138-145`의 6개 이름도 옮긴다.

`data/scenarios.json` 새 항목 `SCENARIO_M2_OPERATIONS`의 새 블록:

```json
{
  "market_rules_ref": "market_rules.json#M2A5_PYEONGTAEK",
  "facility": { "warehouse": {
    "city_id": "PYEONGTAEK", "storage_m3": 40, "handling_work_units_per_day": 6,
    "applies_to_task_kinds": ["EXPORT_PREP", "FORWARDING_PREP"],
    "expansion": { "max_count": 1, "storage_m3": 20, "handling_work_units_per_day": 3,
      "setup_fee": { "currency": "KRW", "amount": 200000 }, "rent_increase": { "currency": "KRW", "amount": 250000 },
      "effective_after_days": 1, "rent_increase_from": "next_rent_day_on_or_after_effective_day" } } },
  "fixed_costs": { "rent": { "currency": "KRW", "amount": 450000, "period_days": 30, "first_due_day": 1, "timing": "prepaid_step6" } },
  "fx_exchange": { "base_rate_ref": "game_config.json#/config/fx_krw_per_usd", "spread_basis_points": 100,
    "lot": { "currency": "USD", "amount": 100 }, "auto_exchange": false, "status": "DESIGN_game_fixed_rate" },
  "space_contract": { "route_ids": ["ROUTE01", "ROUTE02"], "extra_m3": 10, "extra_kg": 1500,
    "fee_per_sailing": { "currency": "USD", "amount": 30 }, "lead_days": 7, "cancellable": false, "max_per_route": 1,
    "charge": "every_covered_departure_take_or_pay" },
  "payment_default": { "basis": "oldest_unpaid_obligation_any_currency", "warning_from_age_days": 0,
    "danger_from_age_days": 7, "failure_age_days": 14, "failure_check": "end_of_step6" },
  "contract_terms": { "prep_work_units": 2, "prep_work_units_per_extra_lot": 1,
    "forwarding_prep": { "STANDARD": { "m3_per_work_unit": 6 }, "HANDLING": { "m3_per_work_unit": 0.25 }, "min_work_units": 2 } }
}
```

- `contract_terms`의 나머지 키(취소·지연·결제 규칙)는 기존 항목 그대로 복사한다. `forwarding_prep_work_units`는 규칙 2에서 쓰지 않는다(검사기가 경고만 한다).
