# M2a-5 규칙 명세 — 반복 견적·창고·고정비·환전·지급 불이행 (개정 2)

## 0. 이 문서

- 작성: Claude(설계 하위 작업), 2026-10-10. 대상: Codex Astra(엔진·자료·로더·검사기·시험·비교 실행기, TASK-0027). 16절은 뒤에 Sol(화면) 지시서의 재료다.
- 기준: 개발 브랜치 `bacedfa`(코드·자료). 지금 작업 트리 머리는 `c896c8a`(TASK-0025 병합)다. `bacedfa..c896c8a` 사이에 `src/engine`·`src/content`·`data/`·`tests/`·`schemas/`·`tools/validate_data.py` 변경은 없다(`git diff --stat bacedfa c896c8a -- src/engine src/content data tests schemas tools/validate_data.py` 빈 결과). 그래서 엔진 행 번호는 그대로다. 화면 파일(`src/ui/map*.ts`)만 바뀌었다.
- 근거 표기: `DESIGN:n`은 `docs/DESIGN_v0.4.md` n행, `DECISIONS:n`은 `docs/DECISIONS.md`(`c284e79`), `CL:n`은 `docs/CLASSIC_GAME_INSIGHTS.md`, `PACKET`은 `docs/ai/design/DECISION-PACKET-2026-10.md`, `DRAFT §n`은 `docs/ai/design/M2A5-market-warehouse-draft.md`의 절이다. 코드는 `파일:행`(기준 `bacedfa`)이다.
- **모든 금액·물량·한도는 DESIGN 합성값이다.** 실제 시세·임차료·운임·임금 보정이 아니다(DESIGN:424, DRAFT 머리말).
- **‘사전 조정’ 값은 간이 모형으로 미리 맞춘 출발값이다. 엔진 구현 뒤 비교 실행기 20시드로 다시 재어 확정한다(DECISIONS:1076).** 자료 파일에도 이 상태를 적는다(3절).
- 같은 상태·명령·시드·판본이면 같은 결과가 나오게 쓴다(`docs/ai/WORKFLOW.md` ‘상태와 시간’). 모호한 곳은 20절에 모았다.

### 0.1 개정 2에서 바뀐 것 (CRITIC1·CRITIC2 반영)

| 지적 | 반영 | 절 |
|---|---|---|
| CRITIC1 A1 기존 시험 무수정은 거짓 | 실험으로 깨지는 시험을 정확히 찾았다. 허용 목록 5개 파일 14개 시험 + `save-shape.test.ts` 덧붙임. 화면 코드는 고치지 않도록 형을 나눴다 | 부록 B |
| A2 새 시나리오가 화면 목록에 나옴 | `SCENARIO_IDS`(화면)와 `OPERATIONS_SCENARIO_IDS`·`ALL_SCENARIO_IDS`(엔진·저장·실행기)를 나눈다 | 3 |
| A3 환전이 순자산 항등식을 깸 | 통화별 `currencyTransferNet`을 더한다. 항등식: 순자산 = 시작 자본 + 손익 + 통화 간 이체 | 5.3, 10.1, 14.1 |
| A4 선복 요금이 예약 밖 | 출항 7일 전부터 그 편 요금을 묶는다(이동 창). 전액 묶기는 모형에서 고용 이득 조건을 지워 기각 | 9 |
| A5 이관 함수가 실제 저장에 안 닿음 | 자료 판본 0.5.0을 올리지 않는다(DECISIONS:717 선례). 판본 5 실제 저장이 이관된다 | 3, 5.4 |
| B1 H가 이익의 약 80% | 사실·구조·민감도를 Q1에 적었다. 사용자 확인 필요 | 17.2, 20 Q1 |
| B2 고용 이득을 미리 알 수 없음 | 나눠 뽑기로 묶음당 H 수가 고정이다. 이득은 시드 운이 아니라 투자 상태로 갈린다. 읽기 함수에 수요 이력·임금 환전량·pt당 이익을 더한다 | 6.3, 14.6 |
| B3 H 업무량을 부피 비례로 쓰지 않음 | 작업 포함 틀은 `prep_work_units: 12`를 직접 적는다 | 6.6, 7 |
| B4 D02-③ 근거가 사라짐 | 후보 B는 선복·창고 확장이 고용 이득의 조건이다. ③ 유지 근거가 된다 | 17.2 |
| B5 엄격 지급 순서는 승인 밖 | 기존 건너뛰기 규칙을 그대로 쓴다. 08 사례를 다시 계산했다 | 10.3, 18 |
| B6 77일 이후 미지급은 실패로 안 이어짐 | `COMPLETED` + 끝 미지급 표시. 이름은 Q11 | 11.2, 20 |
| B7 분석값(÷1,313) 불필요 | 지웠다. 확정 기준은 통화별이다. 모형에서 두 기준 판정이 같았다 | 10.4, 17 |
| C1~C12 | 각 절에 넣었다(부록 D 대조표) | — |
| CRITIC2 F1 정액 50 USD 감액 구멍 | 규칙 2 시나리오만 정액 200 USD. 사용자 확인 필요(Q10). 실행기에 ‘늦어도 받기’ 정책을 더하고 두 수락 방식 모두에서 판정 | 4, 17.3, 20 |
| F2·F3·F5 | 고용일 ±1일 안정성, 실제 영입 명령, 사업별 기여이익 비중을 재측정 기준에 넣었다 | 17.3 |
| F4 3pt 직원 손해 설명 | 창고 대기 pt·업무 수를 읽기 함수와 화면 요구에 넣었다 | 8.4, 14.5, 16 |
| F6 B의 대금 띠가 아래로 좁음 | 재측정에서 어긋나면 올리는 쪽만 쓴다 | 17.3 |
| 후보 선택 | CRITIC2가 고른 후보 B를 사전 조정 출발값으로 둔다. 개정 규칙으로 모형을 다시 돌려 네 판정을 넘었다(17.2) | 6.6, 17 |

## 1. 결정과 범위

| 결정 | 이 명세에서 하는 것 | 절 |
|---|---|---|
| D01 가 | 플레이어 명령 `EXCHANGE_CURRENCY`. USD→KRW 1,287원, KRW→USD 1,313원, 100 USD 단위. 명령 단계에서 실행해 같은 날 급여·고정비에 쓴다. 자동 환전 없음 | 10.1 |
| D02-① | 초안 수치를 출발값으로 쓴다(견적 공개·가격식·물량·창고 40 m³·6pt·임차료 450,000원) | 4, 6~8, 10.2 |
| D02-② 가 | 창고 확장 명령 `EXPAND_WAREHOUSE`(DK-11 최소형) | 8.5 |
| D02-③ 가 | 선복 장기 계약 명령 `SIGN_SPACE_CONTRACT`(DK-21) | 9 |
| D02-④ 가 | 자동 순서. 창고 처리 순서(8.3)는 새로 정한다. 지급 순서는 지금 엔진 규칙을 그대로 쓴다(10.3). 플레이어 지정 명령은 없다 | 8.3, 10.3 |
| D02-⑤ 가 | 본사·창고 글자 표 읽기 함수와 화면 요구 | 14.5, 16 |
| D03 나 | 주선 견적 수를 늘리고 준비 업무량을 키운다. 일반 주선은 부피 비례, 작업 포함 주선은 틀마다 12pt. 선복·창고 확장과 맞물려 특정 조건에서만 고용이 이득. 임금은 그대로 | 6.6, 7, 17 |
| D04 가 | 가장 오래된 미지급 의무 기준 경고 → 7일 뒤 위험 → 14일째 마감에 경영 실패 → 결산 → 같은 시드 다시. 실패 기록에 원인과 회복 근거 수치 | 11, 14.7 |
| D05~D08 | 이번 단위 밖 | 19 |

## 2. 초안·결정 충돌과 해소

| 번호 | 초안·묶음 | 승인·현재 코드 | 해소 |
|---|---|---|---|
| C01 | 선복 확장은 M3로 미룸(DRAFT §10, PACKET D02-3 권장 나) | D02-③ **가**(DECISIONS:1075) | 9절에 넣는다. 서명 7일 뒤 편부터 적용해 첫 묶음 선복 교훈(32 > 30 m³, P0-M2A-03)을 지킨다. 2일 편에는 걸리지 않는다 |
| C02 | D03 나 예시 ‘주선 5건, 6 m³당 1pt, 최소 2pt’(PACKET D03) | D03 **나**(DECISIONS:1076) | 예시값 그대로는 고용이 늘 손해다(모형 24묶음 모두, 17.2). 후보 B를 출발값으로 둔다: 묶음마다 일반 2건 + 작업 포함 4건을 따로 뽑고, 작업 포함 화물은 9 m³·12pt. **Q1 사용자 확인** |
| C03 | D02-4는 업무(창고 처리) 우선순위 질문(PACKET D02 표) | 결정 기록 문구는 ‘④ 가 지급 우선순위 자동’(DECISIONS:1075) | 둘 다 자동이다. 창고 처리 순서는 8.3, 지급은 기존 규칙(10.3). 기록 문구 수정 권고(Q2) |
| C04 | 직접 무역 준비량은 기본 단위 수에 비례(DRAFT §2.5) | D03 나 ‘부피 비례’ | 직접 무역은 초안 규칙. 부피 규칙은 일반 주선에만 쓴다(7절) |
| C05 | 1일 묶음 주선 준비 건당 2pt(`scenarios.json` `forwarding_prep_work_units`) | D03 나 | 규칙 2에서는 1일 묶음 일반 주선에도 부피 규칙. 가구 24 m³ → 4pt. 기대 경로 USD 값은 그대로(18절 P0-M2A5-12). Q7 |
| C06 | 지역 요인 4행만 뽑음(DRAFT §2.2) | 시세표 6행(DRAFT §3) | 6행 모두 뽑는다(6.3) |
| C07 | 묶음 7건(DRAFT §0) | D03 나 | 매입 2·판매 2·일반 주선 2·작업 포함 주선 4 = 10건. Q8 |
| C08 | 인수 명세 P0-M2A-05~12(DRAFT §9) | 작업 지시 P0-M2A5-xx | 18절 P0-M2A5-01~17. 대응: 05→01, 06→02, 07→03, 08→04, 09→06, 10→07, 11→12, 12→09 |
| C09 | ‘기존 시험 파일은 고치지 않는다’(DRAFT §8) | 저장 판본을 올리면 판본 고정 시험이 깨진다(부록 B 실험) | 새 시나리오 `SCENARIO_M2_OPERATIONS`(규칙 2). 기존 시나리오는 규칙 1 그대로. 기존 시험은 부록 B 허용 목록만 고친다 |
| C10 | ‘밀린 지급 → 고정비 → 급여’(DRAFT §5) | 지금 코드는 못 갚는 의무를 건너뛴다(`engine.ts:1137-1157`). 새 필수 지급은 현금이 있으면 바로 낸다(`engine.ts:1108-1121`). 이 규칙은 DECISIONS:57의 승인 동작이다 | **규칙 2도 지금 규칙 그대로 쓴다.** 순서만 6b 밀린 지급 → 6c 고정비 → 6d 급여로 둔다. D04 실패일은 ‘가장 오래된 미지급’이라 두 규칙에서 같다(CRITIC1 B5). 엄격 순서(개정 1)는 버린다 |
| C11 | 7.3절 간이 표(DRAFT §7.3) | D03 나 | 그 표는 쓰지 않는다. 17.2가 대신한다 |
| C12 | 임차료 증액은 다음 정기 임차일부터 | D02-② 원문 승인 | 그대로. Q3 |
| C13 | `payrollRunwayDay`에 고정비(DRAFT §5) | 지금 함수는 급여만 센다(`previews.ts:40-53`), 시험은 62일(`previews.test.ts:220`) | 규칙 2에서만 임차료를 넣는다(→ 56일). 규칙 1은 62일 |
| C14 | 선복 확장 값 없음 | D02-③ 가 | 새 DESIGN 값: 편당 +10 m³·+1,500 kg, 편당 30 USD(쓰지 않아도 냄), 해지 없음. Q4 |
| C15 | `PAR_PAYMENT_GRACE_DAYS` = null(`data/parameters.json:56-60`, DESIGN:358-359) | D04 가 | 14로 정하고 경고 0일·위험 7일을 함께 둔다 |
| C16 | 초안 정책 모형은 자동 환전(DRAFT §7.3) | D01 덧붙임: 자동 환전 없음 | 엔진에는 자동 환전이 없다. 비교 실행기 정책만 환전 명령을 넣는다(17.3) |
| C17 | 선복 요금은 예약 밖(개정 1의 9절) | ‘체결한 계약의 운임·관세는 미리 묶어 둔다’(`engine.ts:274`). ‘예약은 확정된 지출만 묶는다’(DECISIONS:152) | 해지할 수 없는 확정 지출이므로 묶는다. 다만 남은 요금 전부가 아니라 ‘오늘부터 7일 뒤까지 출항하는 적용 편’만 묶는다(9절). 근거는 17.2 |
| C18 | 늦은 인도 감액 정액 50 USD(`scenarios.json:337-341`, `engine.ts:1000`) | 결정 없음 | 규칙 2 시나리오만 정액 200 USD 1회(사전 조정). 규칙 1은 그대로. **Q10 사용자 확인** |
| C19 | 개정 1은 `package_version`을 올렸다 | 올리면 판본 5 저장이 이관 전에 거절된다(`scenario.ts:419`, `save.ts:109-111`). M2a-4도 자료 판본을 올리지 않았다(DECISIONS:717) | 0.5.0을 그대로 둔다. 저장 형식만 6으로 올린다. 기존 시나리오 동작은 바뀌지 않는다 |

## 3. 판본·시나리오·자료 파일

- **규칙 판본:** `M2a-rules-2`를 더한다(`types.ts:14`). 규칙 1의 동작·기록 문장은 한 줄도 바꾸지 않는다.
- **시나리오:** `data/scenarios.json`에 `SCENARIO_M2_OPERATIONS`를 더한다.
  - `base_scenario_id: "SCENARIO_M2_MULTI_TRADE"`로 상속한다(`scenario.ts:129-134`, 최상위 키 덮어쓰기). 이유: 첫 화면 크기 여유가 약 44 KB다(DECISIONS ‘자료 청크 분리와 빌드 크기 한도’). 복사하면 자료 청크가 약 9 KB 커진다.
  - 덮어쓰는 최상위 키: `title_ko`(‘평택 본사 90일 운영 — 반복 견적·창고·환전’), `engine_rules`(`rules_version: "M2a-rules-2"`, 나머지 같음, `note_ko` 새로), `contract_terms`(전체 다시 적음, 부록 C), `scope_note`, `operations`(새 블록, 부록 C).
  - 상속하는 키: 도시·직원·견적(1일 묶음)·노선·시작 자금·관세·영입·문화·성장·`expected_paths_usd`·`expected_rejections`. 기대 경로는 규칙 2에서도 USD 값이 같다(P0-M2A5-12).
  - `contract_terms.notes_ko`는 규칙 2 값으로 다시 쓴다. 상속하면 ‘준비는 각각 2pt’, ‘50 USD 감액’ 문장이 남아 거짓이 된다(반례).
- **시나리오 목록**(`src/content/scenario.ts:39-42`):
  - `SCENARIO_IDS`·`ScenarioId`는 그대로 둔다. 화면 선택 상자(`src/ui/main.ts:300`)와 불러오기(`src/ui/session.ts:27`)가 쓴다. 새 시나리오는 화면 작업(Sol) 때 넣는다.
  - 새 `OPERATIONS_SCENARIO_IDS = ['SCENARIO_M2_OPERATIONS']`, `ALL_SCENARIO_IDS = [...SCENARIO_IDS, ...OPERATIONS_SCENARIO_IDS]`, `AnyScenarioId`.
  - `loadScenario(id: AnyScenarioId)`. 저장 검증(`save.ts:114`)과 비교 실행기 인수 검사(`sim.ts:66`)는 `ALL_SCENARIO_IDS`를 쓴다. 비교 실행기 기본 묶음(`sim.ts:62`)은 `SCENARIO_IDS` 그대로다.
  - 화면 기본 시나리오(`main.ts:1208`)는 바꾸지 않는다.
- **새 자료 파일:** `data/market_rules.json`, `schemas/market_rules.schema.json`. 규칙 묶음 ID `M2A5_PYEONGTAEK`. `numeric_values_status`에 ‘사전 조정 출발값 — 비교 실행기 20시드 재측정으로 확정(DECISIONS:1076)’을 적는다.
- **바뀌는 자료:** `data/parameters.json`의 `PAR_PAYMENT_GRACE_DAYS`(값 14, 근거 새 시나리오 `operations.payment_default`), `PACKAGE_STATUS.json`의 `data_documents`·`data_schemas` 23 → 24와 인수 명세 수, `MANIFEST.json`(생성). `package_version`은 0.5.0 그대로다(C19).
- **저장 형식 판본:** 6(`save.ts:19`). 5.4절.

## 4. 매개변수 표

‘상태’: 승인 = D02-① 초안 수치, 결정 = D01·D04 원문, 새 = 이 명세의 DESIGN 값, 조정 = D03 사전 조정값(재측정 대상).

| ID | 뜻 | 값 | 위치 | 상태 |
|---|---|---|---|---|
| P01 | 첫 공개일 | 1 | `market_rules.json` `publish.first_day` | 승인 |
| P02 | 공개 간격 | 7일 | `publish.interval_days` | 승인 |
| P03 | 마지막 공개일 | 78 | `publish.last_day` | 승인 |
| P04 | 유효기간 | 공개일 포함 3일(b ~ b+2) | `publish.valid_days` | 승인 |
| P05 | 세계 지수 시작 | 10,000 bp | `index.start_bp` | 승인 |
| P06 | 지수 범위 | 8,500 ~ 11,500 bp | `index.min_bp`·`max_bp` | 승인 |
| P07 | 지수 걸음 | 정수 −3 ~ +3 % | `index.step_pct` | 승인 |
| P08 | 지역 요인 | 정수 −4 ~ +4 % | `regional_pct` | 승인 |
| P09 | 거래처 차이 | 정수 −3 ~ +3 % | `counterparty_pct` | 승인 |
| P10 | 기준가 P0 (USD/단위) | 평택 의류 10.00·평택 화장품 40.00·하이퐁 의류 14.00·하이퐁 화장품 49.00·상하이 의류 13.50·상하이 화장품 50.00 | `rows[].base_price` | 승인 |
| P11 | 기본 단위 | 의류 100개, 화장품 50상자 | `trade.goods[].base_lot` | 승인 |
| P12 | 최대 물량 배수 | {1, 2, 3} | `trade.max_lots_choices` | 승인 |
| P13 | 판매 납기·결제 | 납기 b+7, 결제 하이퐁 b+9·상하이 b+11 | `trade.sell_deadline_offset_days`, `trade.payment_offset_days` | 승인 |
| P14 | 묶음당 주선 견적 | 일반 2건 + 작업 포함 4건(등급마다 따로 뽑음) | `forwarding.draws` | 조정(후보 B) |
| P15 | 일반 주선 틀 F1~F6 | 표 6.6-1 | `forwarding.templates[]` | 승인 |
| P16 | 작업 포함 주선 틀 H1~H6 | 표 6.6-2(9 m³, 12pt, 기여이익 840 USD) | `forwarding.templates[]` | 조정(후보 B) |
| P17 | 난수 흐름 이름 | `MARKET-B` + 두 자리 k | `rng.stream_prefix`·`stream_digits` | 승인 |
| P18 | 수출 준비 기본 | 2pt | `contract_terms.prep_work_units` | 기존 |
| P19 | 직접 무역 단위 추가분 | 기본 단위 하나 늘 때 +1pt | `operations.prep.trade_extra_per_lot` | 승인 |
| P20 | 일반 주선 계수 | 6 m³당 1pt | `operations.prep.standard_m3_per_work_unit` | 결정(D03 나) |
| P21 | 작업 포함 주선 준비 | 틀마다 12pt(부피와 무관) | `templates[].prep_work_units` | 조정(후보 B) |
| P22 | 주선 최소 업무량 | 2pt | `operations.prep.min_work_units` | 결정(D03 나) |
| P23 | 보관 한도 | 40 m³ | `operations.facility.storage_m3` | 승인 |
| P24 | 하루 처리 한도 | 6pt | `operations.facility.handling_work_units_per_day` | 승인 |
| P25~P30 | 확장 | +20 m³·+3pt/일·설치비 200,000원(명령한 날)·임차료 +250,000원(다음 임차일부터)·다음 날 효력·1번 | `operations.facility.expansion` | 승인 |
| P31 | 임차료 | 450,000원, 30일마다 선불, 1·31·61일 | `operations.fixed_costs.rent` | 승인 |
| P32 | 선복 계약 추가 부피 | 편당 +10 m³ | `operations.space_contract.extra_m3` | 새 |
| P33 | 선복 계약 추가 무게 | 편당 +1,500 kg | `extra_kg` | 새 |
| P34 | 선복 계약 요금 | 적용 편마다 30 USD(쓰지 않아도 냄) | `fee_per_sailing` | 새 |
| P35 | 선복 계약 효력 | 서명일 + 7일 이후 첫 출항편부터, 캠페인 안에 도착하는 편까지 | `lead_days`, `covers` | 새 |
| P36 | 선복 계약 해지 | 불가 | `cancellable` = false | 새 |
| P37 | 노선당 계약 수 | 1 | `max_per_route` | 새 |
| P38 | 선복 요금 예약 | 출항일이 오늘 ~ 오늘 + 7인 적용 편의 요금 | `reserve_days_ahead` = 7 | 새(C17) |
| P39 | 기준 환율 | 1,300원/USD | `game_config.json` `config.fx_krw_per_usd`(20행) | 기존 |
| P40 | 환전 차감 | 100 bp → 1,287원 / 1,313원 | `operations.fx_exchange.spread_basis_points` | 결정(D01) |
| P41 | 환전 단위 | 100 USD | `fx_exchange.lot` | 결정(D01) |
| P42 | 자동 환전 | 없음 | `fx_exchange.auto_exchange` = false | 결정(D01) |
| P43 | 경고 시작 | 발생 나이 0일 | `operations.payment_default.warning_from_age_days` | 결정(D04) |
| P44 | 위험 시작 | 발생 나이 7일 | `danger_from_age_days` | 결정(D04) |
| P45 | 경영 실패 | 발생 나이 14일인 날 마감에 남아 있으면 | `failure_age_days`, `parameters.json` `PAR_PAYMENT_GRACE_DAYS` = 14 | 결정(D04) |
| P46 | 늦은 인도 감액(규칙 2 시나리오) | 200 USD 정액 1회 | 새 시나리오 `contract_terms.late_delivery.price_reduction` | 조정(Q10) |

그대로 쓰는 기존 값: 일급 80,000·90,000·110,000원(`employees.json`, 바꾸지 않음), 계약금 일급 5일분, 시작 자금 3,000 USD·10,000,000원, 관세 5%, 출항 불참·취소비 50 USD, 노선 ROUTE01(5일·200 USD)·ROUTE02(4일·180 USD)·편당 30 m³·5,000 kg·2일 첫 출항·7일 간격.

## 5. 상태·자료형·저장 판본 6

### 5.1 정적 설정(`ScenarioConfig`, 상태에 저장하지 않음)

- 새 칸 하나: `operations: OperationsConfig | null`. 규칙 1은 null이다. 규칙 2 기능은 이 칸이 있는지로 고른다. **시나리오 ID로 고르지 않는다**(`sim.test.ts:169-182`가 실행기 소스의 ID를 막는다).
- `OperationsConfig`의 하위 칸(로더가 정수 최소 단위로 바꾼다):
  - `market`: 공개 일정, 난수 흐름 이름, 지수(상품 순서 배열), 범위, 시세표 6행 `{ cityId, goodId, side, basePriceMinor }[]`, 직접 무역 `{ goodId, idTag, baseLot, buyCounterpartyId, sellCounterparties: { cityId, counterpartyId }[] }[]`, `maxLotsChoices`, 판매 납기·결제 `{ cityId, days }[]`, 주선 `draws: { serviceClass, count }[]`(순서: STANDARD → HANDLING), `templates[]`, `counterparties: { id, nameKo }[]`.
  - `facility`, `fixedCosts`, `fx: { baseKrwPerUsd, spreadBasisPoints, buyKrwPerUsd, sellKrwPerUsd, lotUsdMinor }`, `spaceContract`, `paymentDefault`, `prep`.
  - **자료 ID를 객체 키로 쓰지 않는다.** 모두 `id` 칸이 있는 배열이다. 비교 실행기 이름 바꾸기 시험(`sim.test.ts:42-49`)은 JSON 값만 바꾸고 키는 그대로 둔다. 키에 ID가 있으면 그 시험이 깨진다.
  - 환율은 로더가 `buy = base − applyBasisPoints(base, spread)` = 1,287, `sell = base + applyBasisPoints(base, spread)` = 1,313으로 미리 계산한다(`money.ts:36-41`).
- `OfferDef`(`types.ts:50-73`)에 더하는 칸(모두 필수, 1일 묶음은 로더가 채움): `maxQuantity`, `quantityStep`, `serviceClass: 'STANDARD' | 'HANDLING' | null`, `publishDay`, `batchK`, `templateId: string | null`, `titleKo: string | null`, `prepWorkUnits: number | null`(작업 포함 틀만). 1일 묶음: `maxQuantity = quantityStep = quantity`, `publishDay = 1`, `batchK = 0`, 주선은 `serviceClass = 'STANDARD'`.
- `ScenarioTerms`·`ScenarioRules`는 그대로 둔다. 규칙 2 값은 `operations`에만 있다.

### 5.2 동적 상태(`GameState`, `types.ts:450-481`)

- 새 칸 하나: `operations: OperationsState | null`. 규칙 1은 `createGame`에서 null이다. 규칙 2는 아래 값으로 시작한다.

| 칸 | 자료형 | 처음 값(규칙 2) | 뜻 |
|---|---|---|---|
| `batches` | `MarketBatch[]` | 묶음 0 한 건 | 공개한 묶음의 관측값 |
| `offers` | `OfferDef[]` | `[]` | 생성 견적의 정의. 공개 뒤에만 들어간다 |
| `expansions` | `{ id; orderedDay; effectiveDay }[]` | `[]` | 최대 1건 |
| `handlingLog` | `{ day; capacityPt; usedPt; waits: { taskId; contractId; wantPt; gotPt }[] }[]` | `[]` | 마감한 날마다 1건 |
| `spaceContracts` | `{ id; routeId; signedDay; firstSailingDay; lastSailingDay; sailingCount; feeMinor; currency }[]` | `[]` | 노선당 1건 |
| `exchanges` | `{ id; day; direction; usdMinor; krwMinor; rateKrwPerUsd; spreadKrwMinor }[]` | `[]` | 환전 기록 |
| `defaultEvents` | `DefaultEvent[]` | `[]` | 경고·위험 단계에 들어간 날의 기록(11.3) |
| `outcome` | `'IN_PROGRESS' \| 'COMPLETED' \| 'FAILED'` | `IN_PROGRESS` | 캠페인 결과 |
| `failure` | `FailureRecord \| null` | null | 실패 기록(11.2) |

- `MarketBatch` = `{ k; publishDay; index: { goodId; bp; stepPct: number | null }[]; destinations: { goodId; cityId }[] | null; rows: { cityId; goodId; side: 'BUY' | 'SELL'; basePriceMinor; regionalPct }[]; counterpartyPct: { goodId; side; pct }[] | null; maxLots: { goodId; lots }[] | null; templateIds: string[]; offerIds: string[]; drawCount }`. 묶음 0은 지수 10,000, 시세표 P0, 지역 요인 0, 나머지 null, `drawCount` 0.
- `Obligation`(`types.ts:410-417`)은 바꾸지 않는다. 배열 순서 = 발생 순서다.
- 규칙 1의 완료 여부는 지금처럼 `phase`로 읽는다.

### 5.3 새 장부 계정(`ledger.ts:7-23`)

| 계정 | 종류 | 통화 | 쓰임 |
|---|---|---|---|
| `RENT_EXPENSE` | expense | KRW | 임차료(기본 + 확장 증액) |
| `FACILITY_SETUP_EXPENSE` | expense | KRW | 창고 확장 설치비 |
| `SPACE_CONTRACT_EXPENSE` | expense | USD | 선복 계약 편당 요금 |
| `FX_SPREAD_EXPENSE` | expense | KRW | 환전 차감 |
| `CURRENCY_TRANSFER` | equity | 각 통화 | 통화 간 이체. 두 장부에 따로 남고 합치지 않는다 |

- `BookSummary`(`ledger.ts:125-147`)에 `rentExpense`, `facilitySetupExpense`, `spaceContractExpense`, `fxSpreadExpense`, `currencyTransferNet`을 더한다. 네 비용은 `profit`에서 뺀다(`ledger.ts:183`). `currencyTransferNet`은 손익이 아니다. 자본 정상 방향(대변 양수) 잔액이다.
- **통화별 항등식:** 자산 합계 − 미지급금 = 시작 자본 + 손익 + 통화 간 이체. 규칙 1은 이체가 0이라 지금 항등식(`reports.ts:305`)과 같다.
- 계약 기여이익(`reports.ts:19-32`)에는 넣지 않는다. 이 분개에는 `contractId`를 붙이지 않는다(DESIGN:194-195).

### 5.4 저장 판본 6

- `SAVE_FORMAT_VERSION = 6`, 받는 판본 `[1, 2, 3, 4, 5, 6]`(`save.ts:97`).
- `migrateV5toV6`: `operations = null`. 경제 값은 바꾸지 않는다. 판본 5 이하 저장은 모두 규칙 1이다(규칙 2는 이번에 생긴다).
- 자료 판본이 0.5.0 그대로라, 지금 빌드의 판본 5 실제 저장(`src/engine/fixtures/save-v5-m2.json`)이 이 함수로 열린다(A5 해소).
- `save-shape.ts`: `operations: nullable(obj(...))`. 생성 견적은 `OfferDef` 전체 모양을 본다. `SAVE_ENUMS`(`save-shape.ts:8-29`)에 `offerKind`, `serviceClass`, `marketSide`, `exchangeDirection`, `campaignOutcome`, `defaultLevel`을 더한다.
- 공개된 견적 정의는 저장에 남는다. 생성 코드가 바뀌어도 열린 견적·계약이 조용히 바뀌지 않는다.
- 규칙 2 저장을 옛 빌드가 열면 시나리오·규칙 판본 검사로 거절된다(`save.ts:100-105`, `:114-116`).

### 5.5 명령 형

- 새 명령 세 가지는 `OperationsCommand`로 따로 둔다. 엔진 진입점(`planCommands`, `planState`, `commitDay`, `applyCommand`)은 `EngineCommand = Command | OperationsCommand`를 받는다.
- 이유: 화면의 `commandLabel`(`src/ui/main.ts:805-838`)은 `Command`의 모든 경우를 다루는 `switch`다. `Command`에 경우를 더하면 타입 검사가 TS2366으로 실패한다(실험 확인). 화면 작업(Sol)이 새 명령을 다룰 때 `Command`에 합친다.

## 6. 견적 생성(시장)

### 6.1 공개 일정

- 묶음 k(0 ~ 11)의 공개일 b = 1 + 7k: 1·8·…·78일.
- 묶음 0은 `market_offers.json` 6건 그대로다(`engine.ts:79`).
- 묶음 k ≥ 1은 **b−1일 마감 7단계**에서 만든다(13절). b−1일 마감 전에는 상태·읽기 함수 어디에도 없다.
- 유효 b ~ b+2. 만료는 기존 7단계 규칙(`engine.ts:825-831`)이다. 단 견적 찾기는 6.8의 `offerDef`로 한다.
- 납기 또는 결제일이 90일을 넘는 견적은 만들지 않는다. 대신할 견적도 없다. 난수는 그대로 쓴다. 예: 78일 묶음은 F2·F4(납기 92)와 H1~H6(납기 92)이 빠진다.

### 6.2 결정성과 난수

- 묶음 k의 견적은 (시드, k, 직전 묶음 지수, 규칙 자료)만의 함수다. 플레이어 행동은 입력이 아니다(6.7).
- 시드 `state.rng.seed`. 흐름 `MARKET-B` + `String(k).padStart(2, '0')`. 지역 난수 상태 `{ seed, cursors: {} }`를 새로 만들어 `drawUniform`(`rng.ts:33-40`)을 부른다. **`state.rng.cursors`는 읽지도 쓰지도 않는다.**
- 정수 뽑기 `intBetween(lo, hi) = lo + Math.floor(value × (hi − lo + 1))`. 목록 뽑기 `index(n) = Math.floor(value × n)`.
- 직전 지수는 `operations.batches[k−1].index`다. 처음부터 다시 계산해도 같아야 한다.
- 정상 묶음의 `drawCount`는 22다.

### 6.3 뽑는 순서(바꾸면 규칙 판본을 올린다)

1. 지수 걸음: 의류 → 화장품. `intBetween(−3, 3)`.
2. 판매지: 의류 → 화장품. `index(2)`, 0 = HAIPHONG, 1 = SHANGHAI(자료 `sell_city_ids` 순서).
3. 지역 요인: 시세표 6행 순서(평택 의류 → 평택 화장품 → 하이퐁 의류 → 하이퐁 화장품 → 상하이 의류 → 상하이 화장품). `intBetween(−4, 4)`.
4. 거래처 차이: 의류 매입 → 의류 판매 → 화장품 매입 → 화장품 판매. `intBetween(−3, 3)`.
5. 최대 물량 배수: 의류 → 화장품. `max_lots_choices[index(3)]`.
6. 주선 틀(**나눠 뽑기**): `draws` 순서대로 등급마다 따로 부분 피셔-예이츠를 한다.
   - 등급의 틀 목록 `pool`(자료 순서)에서 i = 0..count−1마다 `j = i + index(pool.length − i)`, `pool[i]`와 `pool[j]`를 바꾼다. 앞 count개를 고른다.
   - STANDARD 2개(난수 2개) → HANDLING 4개(난수 4개). 고른 6개를 자료 순서(F1~F6, H1~H6)로 정렬한다.
- 합계 2 + 2 + 6 + 4 + 2 + 6 = 22개.
- 결과: 묶음 1~10에는 작업 포함 견적이 늘 4건이다. 78일 묶음은 납기 때문에 0건이다. 그래서 고용의 이득은 시드 운보다 회사 상태(투자·직원 종류·시점)로 갈린다(CRITIC1 B2, 17.2).

### 6.4 가격식(정수)

`halfUp(n, d) = Math.floor((n + d / 2) / d)`(n ≥ 0, d 짝수). 모든 값이 양수라 0에서 먼 쪽 반올림과 같다(DECISIONS:56).

- 지수: `I_k = clamp(halfUp(I_{k−1} × (100 + u), 100), 8500, 11500)`.
- 지역 기준가(cents/단위): `B = halfUp(P0 × I_k × (100 + v), 1,000,000)`.
- 견적 단가: `U = halfUp(B × (100 + w), 100)`. 매입은 평택 행, 판매는 뽑힌 판매지 행.
- 화면 지수 점수 `halfUp(I_k, 100)`. 견적 대비 기준가 차이는 `w`.

### 6.5 생성 견적의 정의

| 종류 | ID | 거래처 | 수량 | 기타 |
|---|---|---|---|---|
| 매입 | `MKT-D{b:03}-APP-BUY`, `-COS-BUY` | 자료 `buy_counterparty_id` | `quantity` = 기본 단위, `maxQuantity` = 배수 × 기본 단위, `quantityStep` = 기본 단위 | 도시 PYEONGTAEK, 원산지 KR, 납기·결제 null |
| 판매 | `MKT-D{b:03}-APP-SELL`, `-COS-SELL` | 자료 `sell_counterparties`의 그 도시 | 매입과 같음 | 납기 b+7, 결제 b+9(하이퐁)·b+11(상하이) |
| 주선 | `MKT-D{b:03}-{틀 ID}` | 틀의 `counterparty_id` | 틀 수량(고정) | 출발 PYEONGTAEK, 대금·납기·결제·등급·`titleKo`·`prepWorkUnits`는 틀, `declaredCargoValueMinor` null |

- `operations.offers`와 `state.offers`(`{ id, status: 'OPEN' }`)에 같은 순서로 넣는다: 의류 매입·판매, 화장품 매입·판매, 주선(자료 순서).
- 거래처 이름은 `market_rules.json` `counterparties[]`에 둔다. 화면 고정 표(`src/ui/main.ts:138-145`)의 6개 이름도 옮긴다(화면이 그 자료를 읽게 하는 것은 Sol).
- 규칙 2 엔진 기록 문장에는 내부 ID와 ‘을(를)’을 쓰지 않는다(gap TE-25, `engine.ts:463`). 예: ‘계약 CT004 체결(운송 주선): 전자제품 화주 화물 전자제품 300상자, 평택 → 하이퐁’. 규칙 1 문장은 그대로 둔다.

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

표 6.6-2 작업 포함 주선(HANDLING, 후보 B 사전 조정값). 포장·라벨·검수 작업이 붙은 고객 화물이다. 회사 재고가 아니다. 회계는 일반 주선과 같다. 모두 9 m³, 준비 12pt(틀 값), 기여이익 840 USD(= pt당 70 USD).

| 틀 | `title_ko` | 화물 | kg | 목적지 | 서비스 대금 | 운임 | 납기 | 결제 | 거래처 |
|---|---|---|---:|---|---:|---:|---|---|---|
| H1 | 라벨 작업 포함 전자제품 | 전자제품 300상자 | 2,400 | 하이퐁 | 1,040 | 200 | b+14 | b+16 | 새 `SHIPPER_DEMO_ELECTRONICS` |
| H2 | 검수·소분 포함 화장품 | 화장품 450상자 | 2,700 | 상하이 | 1,020 | 180 | b+14 | b+18 | 새 `SHIPPER_DEMO_COSMETICS` |
| H3 | 세트 포장 포함 의류 | 의류 3,000개 | 1,500 | 하이퐁 | 1,040 | 200 | b+14 | b+16 | 새 `SHIPPER_DEMO_APPAREL` |
| H4 | 라벨 작업 포함 전자제품 | 전자제품 300상자 | 2,400 | 상하이 | 1,020 | 180 | b+14 | b+18 | 새 `SHIPPER_DEMO_ELECTRONICS` |
| H5 | 재포장 포함 자동차 부품 | 자동차 부품 225상자 | 2,700 | 상하이 | 1,020 | 180 | b+14 | b+18 | `SHIPPER_DEMO_AUTOPARTS` |
| H6 | 검수·소분 포함 화장품 | 화장품 450상자 | 2,700 | 하이퐁 | 1,040 | 200 | b+14 | b+16 | 새 `SHIPPER_DEMO_COSMETICS` |

- 부피·무게는 `goods.json` 단위값으로 셌다(전자제품 0.03 m³·8 kg, 화장품 0.02 m³·6 kg, 의류 0.003 m³·0.5 kg, 자동차 부품 0.04 m³·12 kg).
- 같은 편에 H 두 건을 실으면 무게 4,800~5,400 kg이다. 5,400 kg은 기본 편 한도 5,000 kg을 넘는다. 선복 계약(+1,500 kg)이 의미를 갖는 지점이다.
- H는 납기 b+14라 b+8일 편으로 정시 인도된다. 준비 시간이 8일까지 있어 직원 시간을 주 전체에 나눠 쓸 수 있다. 이것이 ‘직원이 병목이 되는 조건’이다. 9 m³라 보관·선복도 함께 찬다. 그래서 직원만 늘리면 보관·선복에 막힌다(CL-03, CL:40).

### 6.7 가격 수용자와 체결 가격 고정

- 체결·거절·취소는 지수·지역 요인·다음 견적을 바꾸지 않는다(DESIGN:178·184, DRAFT §2.4).
- 계약의 단가·수량·금액은 체결 때 고정된다. 바뀌는 것은 늦은 인도 감액(정액 1회)뿐이다.

### 6.8 견적 찾기

- 새 도우미 `offerDef(state, config, id)`: `config.offers`(묶음 0) 다음 `state.operations?.offers`를 찾는다.
- 엔진 안의 `offerOf(config, id)` 호출을 모두 바꾼다: `engine.ts:283-284·390·826`, `testkit.ts:54`, `sim/policies.ts`. `offerOf`는 지우지 않는다(화면 `main.ts:427-449·814-818`이 쓴다. 규칙 1에서 결과가 같다).
- `tradePairs(config)`(`reports.ts:164-174`)는 그대로 둔다(화면이 쓴다). 새 `openTradePairs(state, config)`: 같은 묶음·같은 상품·노선이 있는 열린 매입·판매 쌍.

## 7. 준비 업무량

| 업무 | 식 | 예 |
|---|---|---|
| 수출 준비(직접 무역) | `prep_work_units + (수량 ÷ quantityStep − 1) × trade_extra_per_lot` | 의류 100·200·300개 → 2·3·4pt. 화장품 50·100·150상자 → 2·3·4pt. 1일 묶음 → 2pt |
| 일반 주선(STANDARD) | `max(min_work_units, ceil(부피 L ÷ 6,000))` | F1 24,000 L → 4. F5 18,000 → 3. F4 12,000 → 2. F3 9,000 → 2. F2 8,000 → 2. F6 6,000 → max(2, 1) = 2. OFFER_FWD_01 → 4, OFFER_FWD_02 → 2 |
| 작업 포함 주선(HANDLING) | 틀의 `prep_work_units` | H1~H6 → 12 |

- 업무량은 수락 때 `Task.requiredWorkUnits`에 넣는다. 이후 바뀌지 않는다.
- `prepWorkUnitsFor(config, offer, quantity)` 하나를 엔진·미리 보기·비교 실행기가 함께 쓴다.
- 경험치는 지금처럼 업무 1건 완료당 10이다(`growth.ts:8-23`, `character_rules.json`). 12pt 업무도 10이다. 레벨은 아직 처리량에 쓰지 않는다. M2b(D10)에서 다시 본다(CRITIC1 C6).

## 8. 창고: 보관·처리·확장

### 8.1 보관 한도

- 창고는 본사 도시(`config.homeCityId`) 1곳이다. 무게 한도는 없다.
- 보관량(L) = 위치가 본사 도시이고 상태가 `PREPARING`·`AWAITING_DEPARTURE`·`HELD_UNALLOCATED`인 화물(회사·고객 모두)의 `cargoSpace(...).volumeLiters` 합. 매번 계산하고 저장하지 않는다(`reservations.ts:1-2`).
- 한도 = 40,000 L + (확장 효력일 ≤ 오늘이면 20,000 L).
- 수락 명령마다 `보관량 + 이 화물 ≤ 한도`. 같은 날 앞 명령을 반영한다. 일괄 확정은 수락까지 철회한다(`engine.ts:230-251`).

### 8.2 하루 처리 한도

- 적용 업무: 본사 도시의 RUNNING `EXPORT_PREP`·`FORWARDING_PREP`. 조사·의뢰·훈련·현지 활동은 쓰지 않는다.
- 한도(pt) = 6 + (확장 효력일 ≤ 오늘이면 3).
- 3단계에서 업무별 진행 = `min(직원 처리량, 남은 업무량, 창고 남은 처리량)`. 8.3 순서로 나눈다. 남은 처리량은 다음 날로 넘기지 않는다.
- 2pt 직원 3명은 6pt로 딱 맞다. 3pt 직원을 더하면 7 > 6이다. 한도에 걸린 날 뒤 순서 업무는 1pt만 받는다. 그 직원은 ‘한 사람 한 업무’(`engine.ts:480-481`)라 다른 일을 못 한다. 그래서 3pt 직원은 확장 없이 같은 일급의 2pt 직원보다 못할 수 있다(CRITIC2 F4).

### 8.3 자동 처리 순서(D02-④)

1. 예약(BOOKED)한 출항일이 이른 업무.
2. 예약 없는 업무는 그 뒤, 계약 납기가 이른 순서.
3. 계약 ID 오름차순.

- 먼저 이 순서로 배분량을 정하고, 그다음 `s.tasks` 배열 순서로 진행·완료를 적용한다(기록·경험치 순서를 규칙 1과 같게).
- 그날 `handlingLog`에 `{ day, capacityPt, usedPt, waits }`를 넣는다. `waits`는 배분량 < 원한 양(직원 처리량과 남은 양 중 작은 값)인 업무다.
- 새 계약의 출항일이 더 이르면 기존 계약보다 앞선다. 그 영향은 수락 미리 보기 `affectedContracts`로 보인다(14.3, CRITIC1 C4).

### 8.4 준비 예측과 ‘창고 대기’

- 새 `projectPrepCompletion(state, config, options?)`: 오늘부터 8.2·8.3 규칙으로 날마다 모의 진행해 업무마다 `{ taskId, contractId, readyDay | null, todayPt, todayWantPt, waitDays }`를 돌려준다. 실제 진행과 같은 배분 함수를 쓴다(DECISIONS:223, 표시와 결과 일치).
  - 기본은 지금 RUNNING 업무만 본다.
  - `options.assignQueued`: 대기(QUEUED) 업무를 빈 직원에게 8.3 순서로 맡긴다고 보고 계산한다(비교 실행기용). 직원 순서는 `config.employees` 순서다.
  - `options.blocked`: `{ employeeId, fromDay, toDay }[]` 동안 그 직원은 새 업무를 맡지 않는다(비교 실행기의 영입 예약).
- **새 막힘 코드(`BlockerCode`, `progress.ts:21-30`)는 더하지 않는다.** 더하면 화면의 `BOTTLENECK_OF`(`src/ui/reports.ts:102-106`)와 화면 시험(`src/ui/trade-reports.test.ts:114-117`)이 타입 검사에서 깨진다(실험 확인). ‘창고 대기’ 표시는 14.5의 읽기 함수가 주고, 막힘 분류는 Sol이 정한다.
- 규칙 2에서 `contractProgress`(`progress.ts:44-136`)의 준비 완료 예상일(`:99`)은 `projectPrepCompletion`의 `readyDay`다.
- 규칙 2의 `TASK_WILL_MISS_SAILING` 문장(`progress.ts:101`): 창고 배분이 원인일 때 ‘지금 속도(하루 n pt)’라고 쓰면 거짓이다(반례: 직원 2pt, 배분 1pt). 그래서 규칙 2 문장은 ‘창고 처리 순서를 반영하면 준비가 {readyDay}일에 끝나 {출항}일 출항을 놓칩니다. 놓치면 운임 중 {취소비}를 잃고 다시 예약해야 합니다.’로 쓴다. 규칙 1 문장은 그대로다.

### 8.5 창고 확장(DK-11, `EXPAND_WAREHOUSE`)

- 다음 날부터 보관 +20 m³, 처리 +3pt/일. 1번만. 되돌리기 없음.
- 명령한 날 설치비 200,000원(`FACILITY-SETUP-WH01`, 차변 `FACILITY_SETUP_EXPENSE`). 임차일 R에 `확장 효력일 ≤ R`이면 700,000원.

## 9. 선복 장기 계약(DK-21, `SIGN_SPACE_CONTRACT`)

- 자체 선박이 아니다. 외부 선사와 맺는 노선별 주간 추가 선복 계약이다(DESIGN:67).
- 노선당 1건. 해지 없음.
- **적용 편:** 그 노선의 출항편 가운데 `출항일 ≥ 서명일 + 7`이고 `출항일 + 운송일 ≤ 캠페인 마지막 날`인 편. 1일 서명 → ROUTE02 9·16·…·86일 12편(86 + 4 = 90), ROUTE01 9·16·…·79일 11편(86 + 5 = 91은 빠짐).
- 적용 편 한도: 40 m³·6,500 kg. `sailingLoad`·`spaceShortfall`(`reservations.ts:91-127`)과 불변 조건(`invariants.ts:107-117`)이 이 한도를 쓴다.
- **요금:** 적용 편 출항일 6c단계에 30 USD. 예약이 없어도 낸다. 분개·의무 ID `SPACE-{routeId}-D{ddd}`, 차변 `SPACE_CONTRACT_EXPENSE`. 현금이 모자라면 미지급 의무다(지금 `payOrAccrue` 규칙).
- **예약(C17):** 새 `commitmentReservations(state, config)` = 출항일이 `오늘 ≤ d ≤ 오늘 + 7`인 적용 편의 요금. `fundsPosition`(`reservations.ts:54-68`)의 `reserved`에 더하고, 새 칸 `reservedCommitments`로 따로 보인다. 같은 편은 요금을 낸 뒤 예약에서 빠진다.
  - 이유: 요금이 예약 밖이면 계약 관세 몫을 갉아먹는다(CRITIC1 A4). 남은 요금 전부를 묶으면 1일 두 노선 서명에 690 USD(시작 USD의 23%)가 묶인다. 모형에서 그러면 1일 선복 계약의 손해가 −723 → −2,718 USD(0/20)로 커지고, 고용 이득 칸이 4 → 0이 된다(17.2). 매주 한 편이라 8일 창이면 노선마다 다음 요금 1~2건이 늘 묶인다.
  - 기존 `cashReservations`(`reservations.ts:21-37`)는 계약 예약만 그대로 돌려준다. 화면이 그 목록을 계약 ID로 그린다(`src/ui/main.ts:651`).
- **서명 검사:** 쓸 수 있는 USD ≥ 30 USD(편당 요금 1건).
- 서명 기록: ‘선복 장기 계약: {노선 이름} {첫 편}일 편부터 {마지막 편}일 편까지 {n}편, 편마다 +10 m³·+1,500 kg, 편당 30.00 USD(쓰지 않아도 냄, 해지 없음), 합계 {n × 30}.00 USD. 출항 7일 전부터 그 편 요금을 묶어 둡니다.’ 총액은 CL-02(먼저 약속하고 나중에 쓴다)의 근거다.

## 10. 돈

### 10.1 환전(D01, `EXCHANGE_CURRENCY`)

- `USD_TO_KRW`: 1 USD당 1,287원 받음. `KRW_TO_USD`: 1 USD당 1,313원 냄. 금액은 USD 기준 100 USD 배수.
- 명령 단계(2단계)에서 실행한다. 같은 날 뒤 명령과 6단계 지급이 그 돈을 쓴다.
- 쓸 수 있는 USD = 현금 − 예약(계약 + 선복 요금) − USD 미지급. 쓸 수 있는 KRW = 현금 − KRW 미지급(`reservations.ts:76-79`).
- 분개(n = USD 금액 ÷ 100 USD, 기록 번호 `FX{nnn}` = `exchanges.length + 1`을 3자리로):
  - USD→KRW. `FX{nnn}-USD`(USD): 차변 `CURRENCY_TRANSFER` 10,000n / 대변 `CASH` 10,000n. `FX{nnn}-KRW`(KRW): 차변 `CASH` 128,700n, 차변 `FX_SPREAD_EXPENSE` 1,300n / 대변 `CURRENCY_TRANSFER` 130,000n.
  - KRW→USD. `FX{nnn}-KRW`(KRW): 차변 `CURRENCY_TRANSFER` 130,000n, 차변 `FX_SPREAD_EXPENSE` 1,300n / 대변 `CASH` 131,300n. `FX{nnn}-USD`(USD): 차변 `CASH` 10,000n / 대변 `CURRENCY_TRANSFER` 10,000n.
  - 1,300n·130,000n의 13은 설정에서 읽는다(`baseKrwPerUsd ÷ 100`). 코드에 13을 쓰지 않는다.
- 두 분개는 각자 대차가 맞다. 두 통화를 합친 값을 만들지 않는다(DECISIONS:54).
- 고정 환율이라 환산 손익은 없다. 변동 환율은 M3(DESIGN:423).
- 엔진은 스스로 통화를 바꾸지 않는다. 원화 미지급을 USD로 갚지 않는다.
- 환전 뒤 USD 순자산은 ‘시작 + 손익’보다 작고 원화는 크다. 그 차이가 `currencyTransferNet`이다. 이 행이 CL-01(거래 흑자 ≠ 회사 자금)의 근거다(CRITIC1 A3).

### 10.2 임차료

- 450,000원, 1·31·61일 6c단계 선불. ID `RENT-D001`·`RENT-D031`·`RENT-D061`. 차변 `RENT_EXPENSE`. 현금이 모자라면 미지급 의무다. 같은 날 재마감에 한 번만 남는다(`engine.ts:1170-1177`).
- 계약 기여이익에 나누지 않는다.

### 10.3 지급 순서(D02-④, 규칙 2)

- 지금 규칙을 그대로 쓴다(C10). 통화마다 따로다.
- 6단계: 6a 수금 → 6b 밀린 지급(배열 순서, **현금이 모자란 의무는 건너뛰고 뒤의 것을 본다**, `engine.ts:1137-1157`) → 6c 고정비(임차료, 그날 출항하는 적용 편 선복 요금) → 6d 급여(직원 정의 순서).
- 새 필수 지급(관세·임차료·선복 요금·급여·고객 취소 보상)은 현금이 있으면 바로 낸다. 없으면 미지급 의무다(`engine.ts:1099-1135`).
- 관세 미지급이면 반출하지 않는다. 밀린 관세를 갚은 날 `dutyPaid = true`(`engine.ts:1151-1154`).
- 선택 지출(수락·계약금·훈련·현지 활동·확장·환전·선복 계약 서명)은 기존처럼 자금 기준으로 거절한다. 미지급을 만들지 않는다(DECISIONS:316).
- 규칙 2의 미지급 기록 문장은 ‘… 미지급 의무로 기록 (14일 안에 갚지 못하면 경영 실패)’다. 지금 문장 ‘지급 불이행 유예기간은 아직 확정되지 않음’(`engine.ts:1133`)은 규칙 2에서 거짓이다(반례). 규칙 1은 그대로 둔다.

### 10.4 통화 분리

- 저장·보고·결산·실패 기록 어디에도 USD와 KRW를 더한 값이 없다. 1,300원 참고 환산도 없다(PACKET D01 덧붙임).
- 급여 가능일은 원화만으로 센다. ‘환전하면’ 미리 보기는 원화 유입을 더한 원화 계산이다.
- 개발 도구(비교 실행기)도 통화를 합치지 않는다. 개정 1의 분석값(USD + KRW ÷ 1,313)은 지웠다(CRITIC1 B7). 모형에서 분석값 비교와 USD 순자산 비교의 판정이 같았다(17.2).

## 11. 지급 불이행 단계·경영 실패(D04)

### 11.1 단계

- 기준 의무: 모든 통화의 미지급 의무 가운데 발생일이 가장 이른 것. 같으면 `USD` < `KRW`, 그다음 배열 순서.
- 나이 = 기준 날 − 발생일. 열린 날은 `state.day`, 마감 결과는 마감한 날.

| 나이 | 단계 | 뜻 |
|---|---|---|
| 미지급 없음 | `NONE` | — |
| 0 ~ 6 | `WARNING` | 발생한 날 마감 결과부터 |
| 7 ~ 13 | `DANGER` | 발생일 + 7일부터 |
| 14 | `DANGER` + `failsAtCloseToday` | 오늘 마감까지 갚지 못하면 실패 |
| 14인 날 마감에 남음 | `FAILED` | 경영 실패 |

- 예: 57일 발생 → 57~63일 경고 → 64일 위험 → 71일 마감에도 남으면 실패.
- 기준 의무를 갚으면 다음으로 오래된 의무가 기준이다.

### 11.2 실패 처리(6e)

1. 6단계 지급 뒤 검사한다. 미지급 의무 가운데 `발생일 + 14 ≤ 오늘`인 것이 하나라도 있으면 실패. 그 가운데 11.1 순서로 첫 의무가 원인이다.
2. `outcome = 'FAILED'`, `failure` 기록(아래).
3. 7단계(만료·다음 견적)를 건너뛴다. 8단계 불변 조건 검사·마감은 한다. `closedDays`에 실패일, `day = 실패일 + 1`(정상 마감과 같음, `engine.ts:835`), `phase = 'ENDED'`.
4. 기록 문장: ‘경영 실패: {발생일}일에 생긴 {이유} {금액}을 14일 동안 갚지 못했습니다’.
- `FailureRecord` = `{ day; obligationId; currency; amountMinor; reasonKo; incurredDay; unpaidByCurrency: { currency; amountMinor; count }[]; cashByCurrency: { currency; amountMinor }[]; warningEvent: DefaultEvent | null; dangerEvent: DefaultEvent | null; optionalKrwSpendBeforeFirstUnpaid: { entryId; day; amountMinor; reasonKo }[] }`.
  - `warningEvent`·`dangerEvent`: 원인 의무가 경고·위험에 들어간 날의 `defaultEvents` 기록(11.3).
  - `optionalKrwSpendBeforeFirstUnpaid`: 원인 의무 발생일 전 14일(발생일 −14 ~ −1) 동안 원화 선택 지출 분개. ID 접두어 `SIGNING-`·`TRAINING-FEE-`·`CULTURE-FEE-`·`FACILITY-SETUP-`. 없으면 빈 배열(CRITIC1 C2).
- 실패 뒤 `commitDay`는 지금처럼 오류다(`engine.ts:805-807`). 규칙 2의 `applyCommand`는 `phase === 'ENDED'`면 모든 명령을 ‘캠페인이 끝났습니다(경영 실패).’로 거절한다. 정상 종료면 ‘캠페인이 끝났습니다.’다(반례: 정상 종료에 ‘경영 실패’를 쓰지 않는다).
- **90일 마감:** 실패 검사를 먼저 한다. 실패가 아니면 `outcome = 'COMPLETED'`. 나이 14 미만 미지급이 남아도 완료다. 결산은 `arrearsAtEnd`(통화별 금액·건수)를 보이고, 비교 실행기는 `unpaidAtEnd`를 센다(CRITIC1 B6, 이름은 Q11).

### 11.3 단계 기록

- 마감 6e에서 기준 의무가 새로 경고·위험에 들어가면 `defaultEvents`에 하나 넣고 기록 문장을 남긴다.
- `DefaultEvent` = `{ day; level: 'WARNING' | 'DANGER'; obligationId; currency; amountMinor; incurredDay; dueToSurviveMinor; lotsToSurvive | null; lotsToClearAll | null; usdAvailableMinor }`. 계산은 14.7 `recovery`와 같다(그날 마감 뒤 상태 기준).
- 문장: ‘지급 불이행 경고: {발생일}일 {이유} {금액}이 밀렸습니다. {실패일}일 마감까지 갚지 못하면 경영 실패입니다.’ / ‘지급 불이행 위험: … {실패일}일 마감까지’.

### 11.4 결산과 같은 시드 다시

- `campaignSummary`(`reports.ts:324-356`)는 규칙 2에서만 최상위 칸 `operations: { outcome; failure; arrearsAtEnd; defaultEvents; fixedCostsByCurrency; exchanges }`를 더한다. 규칙 1의 칸 목록은 그대로다(`campaign-end.test.ts:76`이 칸 이름을 고정한다).
- 같은 시드 다시: `restartWithSameSeed(state, config)` = `createGame({ ...config, seed: state.rng.seed })`. 묶음 1~11이 같다.
- 다른 시드 선택은 이번 범위 밖이다.

## 12. 명령

`OperationsCommand`(5.5). 모든 명령은 ID로 한 번만 처리한다(`engine.ts:181-183`). 규칙 1 시나리오에서는 ‘이 시나리오에서는 할 수 없습니다(M2a-5 기능).’로 거절한다.

### 12.1 `EXCHANGE_CURRENCY { id, direction, usdAmountMinor }`

| 순서 | 검사 | 거절 문장 |
|---|---|---|
| 1 | `phase`가 `AWAITING_INPUT` | ‘캠페인이 끝났습니다(경영 실패).’ / ‘캠페인이 끝났습니다.’ / 기존 단계 오류 |
| 2 | 안전한 정수, > 0, 10,000의 배수 | ‘환전은 100 USD 단위입니다. 요청 {금액}.’ |
| 3a | USD→KRW: 쓸 수 있는 USD ≥ 금액 | ‘환전할 수 있는 USD가 부족합니다. 요청 {금액}, 사용 가능 {가용} = {항목들}.’ 항목은 0이 아닌 것만: ‘현금 {현금}’, ‘다른 계약 예약 {계약}’, ‘선복 계약 요금 예약 {선복}’, ‘미지급 {미지급}’ |
| 3b | KRW→USD: 쓸 수 있는 KRW ≥ 금액 ÷ 100 × 1,313 | ‘환전할 수 있는 원화가 부족합니다. 필요 {원화}, 사용 가능 {가용} = 현금 {현금} − 미지급 {미지급}.’(미지급 0이면 ‘= 현금 {현금}’) |

- 실행: 10.1 분개 두 개, `exchanges`에 기록, 문장 ‘환전: 1,000.00 USD → 1,287,000원(게임용 고정 환율 1,287원, 차감 13,000원)’. KRW→USD는 ‘환전: 1,313,000원 → 1,000.00 USD(게임용 고정 환율 1,313원, 차감 13,000원)’.

### 12.2 `EXPAND_WAREHOUSE { id }`

| 순서 | 검사 | 거절 문장 |
|---|---|---|
| 1 | 단계 | 12.1과 같음 |
| 2 | 확장 수 < 1 | ‘창고 확장은 한 번만 할 수 있습니다(이미 {효력일}일부터 확장).’ |
| 3 | 쓸 수 있는 KRW ≥ 200,000원 | ‘창고 설치비 자금이 부족합니다. 필요 200,000원, 사용 가능 {가용}.’ |

- 실행: 설치비 분개, `expansions.push({ id: 'WH-EXP-1', orderedDay: d, effectiveDay: d + 1 })`, 문장 ‘창고 확장 계약: {d+1}일부터 보관 60 m³·처리 9pt. 임차료는 다음 임차일({R}일)부터 700,000원’. 남은 임차일이 없으면 뒤 문장 대신 ‘남은 임차일이 없어 증액분은 내지 않습니다’(반례: 62일 이후 확장).

### 12.3 `SIGN_SPACE_CONTRACT { id, routeId }`

| 순서 | 검사 | 거절 문장 |
|---|---|---|
| 1 | 단계 | 12.1과 같음 |
| 2 | 노선이 `space_contract.route_ids`에 있음 | ‘이 노선은 선복 계약을 맺을 수 없습니다.’ |
| 3 | 그 노선 계약 없음 | ‘이 노선에는 이미 선복 계약이 있습니다({첫 편}일 편부터).’ |
| 4 | 적용 편(9절)이 1편 이상 | ‘남은 기간에 계약을 적용할 출항편이 없습니다.’ |
| 5 | 쓸 수 있는 USD ≥ 30 USD | ‘선복 계약 요금 자금이 부족합니다. 필요 30.00 USD, 사용 가능 {가용}.’ |

- 실행: `spaceContracts.push({ id: 'SPC-{routeId}', … })`, 9절 서명 기록. 서명일에 돈은 나가지 않는다.

### 12.4 `ACCEPT_TRADE { id, buyOfferId, sellOfferId, quantity?, plan? }` (바뀜)

- `Command`의 이 경우에 선택 칸 `quantity?: number`를 더한다(선택 칸이라 화면 타입 검사는 그대로다).
- `quantity`가 없으면 `buy.quantity`(기본 단위).
- 규칙 2 검사 순서: ① 견적 존재·종류 ② 유효(`engine.ts:253-258`) ③ 같은 묶음·같은 상품 ④ 수량: `quantityStep`의 배수, `quantityStep ≤ quantity ≤ min(buy.maxQuantity, sell.maxQuantity)` ⑤ 통화 ⑥ 노선 ⑦ 자금(매입 + 운임 + 관세) ⑧ 보관(8.1).
- 거절 문장: ③ ‘같은 묶음·같은 상품의 매입·판매만 묶을 수 있습니다.’ ④ ‘수량은 {step}{단위} 단위로 {step} ~ {max}{단위}까지 고를 수 있습니다.’ ⑧ ‘보관 공간 부족 — 평택 창고 {보관} / {한도} m³, 이 화물 {부피} m³. 출항하거나 확장하면 공간이 생깁니다.’ 확장을 이미 했으면 ‘출항하면 공간이 생깁니다.’(반례).
- 규칙 1은 지금 규칙 그대로(`engine.ts:290`). `quantity`를 주면 견적 수량과 같아야 한다.

### 12.5 `ACCEPT_FORWARDING` (바뀜)

- 규칙 2: 자금 검사 뒤 보관 검사(8.1). 준비량은 7절.

### 12.6 그대로인 명령

- `ASSIGN_TASK`·`BOOK_SAILING`·`CANCEL_CONTRACT`·`SCOUT_SITE`·`START_RECRUIT_QUEST`·`HIRE_CANDIDATE`·`START_TRAINING`·`START_CULTURE_ACTIVITY`·`RESPOND_TO_DELAY`는 그대로다. `BOOK_SAILING`의 선복 검사는 계약 한도(9절)를 쓴다.
- 규칙 2의 자금 부족 문장(`engine.ts:261-275`)은 선복 요금 예약을 따로 적는다. 지금 문장의 ‘다른 계약 예약’에 선복 요금을 섞으면 거짓이다(반례).

## 13. 하루 처리 순서(규칙 2)

DESIGN:336-342의 8단계. 굵은 글씨가 새로 하거나 바뀌는 곳이다.

| 단계 | 처리 | 위치 |
|---|---|---|
| 1 | 하루 열기(항만 공지). **견적은 전날 마감에 이미 공개** | `openDay`, `engine.ts:127-157` |
| 2 | 명령 검증·실행. **환전·확장·선복 계약·수량 선택·보관 검사** | `applyCommand`, `engine.ts:180-224` |
| 3 | 업무 진행. **본사 준비 업무는 창고 한도를 8.3 순서로 배분, `handlingLog`** | `progressTasks`, `engine.ts:840-890` |
| 4a | 출항. 준비 미완료면 출항 불참·운임 환급. **출항한 화물은 창고에서 빠짐** | `engine.ts:892-950` |
| 4b | 도착·통관(관세 `payOrAccrue`) | `engine.ts:952-991` |
| 5 | 인도·납기 판정. **감액은 시나리오 값(규칙 2: 200 USD)** | `engine.ts:993-1058` |
| 6a | 수금 | `engine.ts:1060-1066` |
| 6b | 밀린 지급(지금 규칙) | `engine.ts:1137-1157` |
| 6c | **고정비: 임차일이면 임차료, 오늘 출항하는 적용 편마다 선복 요금** | 새 |
| 6d | 급여 | `engine.ts:1159-1166` |
| 6e | **지급 불이행 단계 기록과 실패 검사(11.2·11.3)** | 새 |
| 7 | 실패가 아니면: 만료(`offerDef`로 찾음) → **다음 날이 공개일이면 묶음 생성·공개** | `engine.ts:824-831` 확장 |
| 8 | 불변 조건 → `closedDays` → 다음 날. **실패면 `ENDED`. 90일 마감이면 `ENDED`·`COMPLETED`** | `engine.ts:832-837` |

- 같은 날 재마감은 아무것도 바꾸지 않는다(`engine.ts:802-804`).
- 화면 열기·미리 보기·저장 불러오기는 시간을 진행하지 않는다.

## 14. 읽기 함수·보고

모두 상태를 바꾸지 않는다. 규칙 1에서는 기존 결과·칸을 그대로 낸다.

### 14.1 장부 보고

- `BookSummary`·`CurrencyStanding`(`reports.ts:296-311`)에 `currencyTransferNet`과 네 고정비 칸을 더한다. 규칙 1은 0이다.
- `CurrencyStanding.netAssets` 주석(`reports.ts:305`)을 ‘시작 자본 + 누적 손익 + 통화 간 이체’로 고친다.

### 14.2 `marketTable(state, config)`

- 행 6개: `{ cityId, goodId, side, basePriceMinor, currency: 'USD', indexPoints, indexBp, observedDay, ageDays, nextObservationDay, hasQuoteInBatch }`.
- 값은 오늘 이하 공개일의 마지막 묶음이다. `ageDays = state.day − observedDay`. 78일 뒤 `nextObservationDay`는 null.

### 14.3 `quotePreview(state, config, offerIds, quantity?)`

- 기존 `tradePreview`·`forwardingPreview`(`reports.ts:132-161`)는 그대로 둔다(화면이 쓴다). 새 함수는 상태·수량을 받는다.
- 기존 칸 + `quantity`, `maxQuantity`, `quantityStep`, `prepWorkUnits`, `volumeLiters`, `massGrams`, `storageAfterLiters`, `storageCapacityLiters`, `counterpartySpreadPct`, `serviceClass`, `titleKo`, `contributionPerPrepPtMinor`(기여이익 ÷ 준비 pt, 내림), `lateDeliveryReductionMinor`, `affectedContracts: { contractId; readyBefore; readyAfter; missesSailing }[]`(이 견적을 오늘 빈 직원에게 맡긴 계획 상태에서 `projectPrepCompletion`).

### 14.4 `payrollRunwayDay`(`previews.ts:40-53`)와 `exchangePreview`

- 규칙 2: 날마다 급여에 그날 임차료(확장 효력 반영)를 더해 뺀다. 선복 요금은 USD라 넣지 않는다. 1일(임차료 전): 56.
- `exchangePreview(state, config, direction, usdAmountMinor)` = `{ allowed; reasonKo; krwMinor; spreadKrwMinor; usdAvailableBefore; usdAvailableAfter; krwAvailableBefore; krwAvailableAfter; runwayBefore; runwayAfter; warningKo }`.
  - `warningKo`: KRW→USD 뒤 원화가 오늘 낼 임차료·급여보다 적으면 ‘환전 뒤 원화 {가용}으로는 오늘 급여·임차료 {금액}을 다 낼 수 없습니다.’ 아니면 null(CRITIC1 C9, DECISIONS:394).

### 14.5 `warehouseSummary(state, config)` (본사 글자 표, D02-⑤)

- `storage { usedLiters; capacityLiters; heldUnallocatedLiters }`.
- `handling { capacityPtToday; plannedUsePtToday; waits: { taskId; contractId; wantPt; gotPt }[]; waitTaskCount; waitPt }`(오늘 배분 미리 계산). 3pt 직원 손해의 원인을 보이는 칸이다(CRITIC2 F4).
- `prepDaysToClear`: `projectPrepCompletion`의 마지막 `readyDay` − 오늘 + 1. `workloadSummary.daysToClear`(`capacity.ts:88-92`)는 창고 한도를 모르므로 쓰지 않는다(CRITIC1 C7).
- `demand { batchPublishDay; openVolumeLiters; openPrepPt; recent: { publishDay; offeredPrepPt; acceptedPrepPt; handlingOffered; handlingAccepted }[] }`: 오늘 열린 견적의 기본 수량 합과 최근 4묶음 이력. 묶음은 독립 추첨이지만 등급별 건수가 고정이라 과거 이력이 다음 묶음 수요의 정당한 추정이다(CRITIC1 B2).
- `staff { workUnitsPerDay; idleWorkUnitsToday }`(`capacity.ts:49` 재사용).
- `sailings[]`: 노선별 다음 출항편 `{ sailingId; usedLiters; capacityLiters; usedGrams; capacityGrams; spaceContract: boolean }`.
- `rent { amountMinor; nextDueDay }`, `expansion { status: 'NONE' | 'ORDERED' | 'ACTIVE'; effectiveDay }`, `spaceContracts[]`.

### 14.6 `hiringOutlook(state, config, candidateId)` (면담 칸 재료)

- `{ workUnitsPerDay; wageKrwPerDay; wageUsdLotsPerWeek; recentHandlingOfferedPt; recentHandlingAcceptedPt; recentDeclinedForStaffPt; contributionPerPrepPtMinor; effectiveHomePtAfter: { staffPt; warehousePt; usablePt } }`.
  - `wageUsdLotsPerWeek` = ceil(일급 × 7 ÷ 128,700). 환전 명령의 실제 필요량이라 통화 합산이 아니다(`exchangePreview`와 같은 성격).
  - `usablePt = min(staffPt, warehousePt)`. 3pt 직원 고용 뒤 7 > 6이면 6이다.
- 손익분기 설명(17.4)은 화면 문구 재료다. 엔진은 수치만 준다.

### 14.7 `paymentDefaultStatus(state, config)`

- `{ level; oldest: { obligationId; currency; amountMinor; reasonKo; incurredDay } | null; ageDays; dangerFromDay; failAtCloseOfDay; failsAtCloseToday; unpaidByCurrency[]; cashByCurrency[]; recovery }`.
- `recovery`(지금 상태 기준, 오늘 명령 전):
  - `dueToSurviveMinor`: 오늘 마감에 나이 14가 되는 원화 미지급 합. `lotsToSurvive = ceil(max(0, dueToSurvive − KRW 현금) ÷ 128,700)`.
  - `lotsToClearAll = ceil(max(0, KRW 미지급 + 오늘 낼 원화(급여·임차료) − KRW 현금) ÷ 128,700)`.
  - `usdAvailableLots = floor(쓸 수 있는 USD ÷ 10,000)`.
  - USD 기준 의무면 원화 칸 대신 다음 수금일·금액과 `KRW_TO_USD` 필요 원화.
  - `heldSpendingKo`: ‘미지급이 있는 동안 고용 계약금·훈련·현지 활동·창고 확장은 자금 기준에서 막힙니다’. 원화 미지급이 없으면 null(반례).
  - 100 USD만 바꾸면 실패가 하루 미뤄질 뿐일 수 있다(18절 09 C). 그래서 두 값을 나눈다(CRITIC1 C2).

### 14.8 `upcomingPayments`(`reports.ts:231-289`)

- `UpcomingPaymentKind`(`reports.ts:211`)에 `RENT`·`SPACE_FEE`를 더한다.
- 정렬 번호(`reports.ts:285`)는 OVERDUE 0, RENT 1, SPACE_FEE 2, WAGE 3, FREIGHT 4, DUTY 5. 기존 네 종류의 상대 순서는 그대로라 규칙 1 결과가 같다. 같은 날 임차료·선복 요금이 급여보다 앞이다(실제 6c → 6d, CRITIC1 C3).
- 임차료 행은 창 안의 임차일, 선복 요금 행은 창 안의 적용 편 출항일에 넣는다.
- 지금 `cashReservations` 고리(`reports.ts:265-284`)는 계약 예약만 돈다. 선복 요금 행은 따로 만든다.

## 15. 불변 조건(마감마다, `invariants.ts`)

규칙 2(`operations !== null`)에서만 본다.

1. 보관량 ≤ 보관 한도.
2. `handlingLog`의 오늘 `usedPt ≤ capacityPt`, 업무별 배분 ≤ 직원 처리량.
3. 출항편 예약 합 ≤ 그 편 한도(선복 계약 포함).
4. 공개 묶음과 생성 견적의 `publishDay` ≤ 마감일 + 1(불러오기에서는 ≤ `state.day`). 생성 견적 ID 유일. 묶음 수 = 그 범위의 공개일 수(실패 판은 실패일까지).
5. 환전 기록마다 `FX{nnn}-USD`·`FX{nnn}-KRW` 분개가 하나씩. USD `CURRENCY_TRANSFER` 순차변(cents) × (기준 환율 ÷ 100) = KRW `CURRENCY_TRANSFER` 순대변(원).
6. 통화별: 자산 합계 − 미지급금 = 시작 자본 + 손익 + 통화 간 이체.
7. 임차일(≤ 오늘)마다 `RENT-Dddd` 분개 하나. 적용 편 출항일(≤ 오늘)마다 `SPACE-…` 분개 하나.
8. `outcome === 'FAILED'` ⇔ `phase === 'ENDED'`이고 `failure`가 있고 그 의무가 실패일 마감에 미지급이었다. `outcome === 'COMPLETED'` ⇒ `closedDays`에 90이 있다.
9. 확장 최대 1건, `effectiveDay = orderedDay + 1`. 선복 계약 노선당 1건.
10. `operations !== null` ⇔ `config.operations !== null`.

## 16. 화면 요구(후속 Sol 지시서용)

모든 금액은 통화 표시를 붙이고 통화끼리 더하지 않는다. 색만으로 상태를 구분하지 않는다(UI_SPEC:50). 새 문장마다 반례 상태를 적고 시험한다.

1. **시세표:** 6행. 기준가(USD/단위), 지수(‘돈이 아님’), 관측일·‘N일 전 관측’, 다음 관측일, 이번 묶음 견적 있음. 79일 뒤 ‘새 관측 없음’.
2. **견적 카드:** 수량 고르기. 수량마다 매입·판매·운임·관세·기여이익·필요 자금·준비 pt·부피·보관 후 사용량/한도. H 견적은 이름과 ‘준비 12pt — 직원 시간이 많이 듭니다’, ‘준비 1pt당 기여이익 70 USD’. 늦은 인도 감액 200 USD. 기존 계약 출항을 밀어내면 그 계약 이름(`affectedContracts`).
3. **본사·창고 글자 표:** 읽는 순서 수요 → 직원 → 창고 처리 → 보관 → 선복(CL:40). 창고 대기 pt·업무 수. 한도가 바뀌면 ‘한도가 40 → 60 m³로 늘어 사용률이 내려갔습니다’.
4. **환전 칸:** 방향, 금액(100 USD 단계), ‘게임용 고정 환율 1,287원(받을 때)·1,313원(살 때)’, 받는/내는 금액, 차감, 쓸 수 있는 USD = 현금 − 예약(계약·선복 요금) − 미지급, 급여 가능일 전/후, ‘자동 환전은 없습니다’, `warningKo`.
5. **위쪽 막대:** 원화 급여 가능일(임차료 포함), 지급 불이행 단계와 실패까지 남은 날.
6. **경고·위험 알림:** 원인(통화·이유·금액·발생일), 나이, 실패 마감일, 회복 행동(‘오늘 실패를 피하려면 USD {lotsToSurvive×100}’, ‘밀린 원화를 모두 갚으려면 USD {lotsToClearAll×100}’, 다음 수금일·금액, 보류할 지출). 현실 문구 ‘실제로는 임금을 정한 날 지급해야 하며 하루 늦어도 체불입니다’(조문 번호는 원문 대조 뒤, PACKET D04).
7. **경영 실패 화면(D04 조건):** 원인 문장, 통화별 미지급·현금(합계 없음), 경고·위험 당시 필요 환전량과 그때 쓸 수 있던 USD, 실패 전 14일 원화 선택 지출, ‘같은 시드로 다시 하기’·‘결산 보기’.
8. **고용 면담 칸:** `hiringOutlook` 값. ‘이 직원 하루 일급 90,000원 — 일주일이면 USD 약 {n×100} 환전’, ‘최근 4묶음 작업 견적 {pt} / 처리 {pt} / 직원 부족으로 못 받은 {pt}’, ‘준비 1pt당 기여이익 {x} USD’, ‘고용 뒤 본사 처리 {직원}pt, 창고 한도 {창고}pt → 실제 {usable}pt’.
9. **일정:** 임차료·선복 요금·밀린 지급 행. 지금 화면은 `FREIGHT` 아닌 행을 관세로 적는다(`src/ui/main.ts:693-694`, `src/ui/schedule.ts:85`). 새 종류를 넣을 때 고친다.
10. **결산:** `outcome`, 실패 사유, 통화별 고정비·환전 기록, ‘통화 간 이체(환전)’ 행, 끝 미지급. 원화 보고 주석 ‘가상 환율 1,300원/달러는 보고에 쓰지 않습니다’(`src/ui/reports.ts:22-23`)를 ‘환전 명령으로 실제 바꾼 금액만 기록합니다. 통화는 합치지 않습니다.’로 바꾼다.
11. **막힘 분류:** ‘창고’ 분류를 더하고 `BOTTLENECK_OF`에 반영한다(8.4).

## 17. D03 사전 조정과 엔진 재측정

### 17.1 모형

- 위치: `m2a5/model/`(부록 A). 엔진이 아니다. 이 명세 규칙의 Python 이식이다. 재현은 CRITIC2가 바이트 단위로 확인했다(자료 15개 값, 엔진 규칙 6개 일치).
- 개정 규칙 확인: `m2a5/spec_check/exp_spec.py`가 모형을 고치지 않고 하위 클래스로 (1) 지급 건너뛰기 규칙 (2) 캠페인 안에 도착하는 편만 요금 (3) 선복 요금 이동 창 예약 (4) 감액 정액 200 USD를 넣는다.
- 단순화(모형 README 9절): 정책은 탐욕, 영입은 물보리가 H−3~H−1에 맡음, 현지 활동·훈련·사건 없음.

### 17.2 결과(시드 1001~1020, 간이 모형 추정 — 엔진으로 다시 잰다)

값은 USD 순자산(현금 + 채권 + 재고 + 선급운임 + 진행원가 − USD 미지급) 차이다. ‘이득’은 같은 수락·투자의 고용 없음보다 큰 시드 수. ↑ = 중앙 ≥ +300·이득 ≥ 15/20·실패 ≤ 1, ↓ = 중앙 ≤ −300·이득 ≤ 5/20.

**기준 회사(보통 수락·앞 7일 환전·고용·투자 없음):** USD 순자산 중앙 17,939, 끝 원화 41,500원, 실패 0/20. 기여이익 중앙 19,439 = 작업 포함 주선 15,960(82%) + 직접 무역 2,988(15%) + 일반 주선 약 491(3%). ‘늦어도 받기’(적극) − 보통 = −1,515(0/20). 투자만: 선복 1일 −723(2), 확장 7일 −638(2), 둘 다 −1,015(1), 둘 다 22일 −849(0).

**보통 수락(정시만) 고용 표** — 열: 투자 없음 / 선복 1일 / 확장 7일 / 둘 다(1·7일) / 둘 다 22일

| 고용 | 없음 | 선복 | 확장 | 둘 다 | 둘 다 22일 |
|---|---|---|---|---|---|
| 2pt·90,000원 8일 | −2,662 (1) ↓ | −5,290 (1) ↓ | −699 (7) | +1,616 (16) ↑ | +182 (11) |
| 2pt 29일 | −2,595 (0) ↓ | −2,783 (2) ↓ | −537 (4) ↓ | +959 (17) ↑ | +777 (17) ↑ |
| 2pt 30일 | −2,615 (1) ↓ | −2,345 (2) ↓ | −465 (7) | +917 (17) ↑ | +1,047 (16) ↑ |
| 2pt 31일 | −2,037 (3) ↓ | −2,467 (7) | −462 (8) | +1,040 (17) ↑ | +895 (18) ↑ |
| 2pt 50일 | −1,755 (1) ↓ | −1,356 (2) ↓ | −1,056 (5) ↓ | +4 (11) | −166 (9) |
| 3pt·110,000원 8일 | −4,768 (0) ↓ | −7,354 (0) ↓ | −2,155 (0) ↓ | +2,102 (16) ↑ | −11 (10) |
| 3pt 29일 | −4,328 (0) ↓ | −3,551 (0) ↓ | −1,874 (1) ↓ | +1,598 (17) ↑ | +1,545 (17) ↑ |
| 3pt 30일 | −3,715 (0) ↓ | −3,990 (0) ↓ | −1,835 (1) ↓ | +1,537 (15) ↑ | +1,503 (16) ↑ |
| 3pt 31일 | −3,790 (0) ↓ | −2,469 (0) ↓ | −1,559 (2) ↓ | +1,871 (19) ↑ | +1,461 (18) ↑ |
| 3pt 50일 | −2,679 (0) ↓ | −2,294 (0) ↓ | −1,551 (1) ↓ | +421 (14) | +44 (13) |

**적극 수락(늦은 인도도 받음) 고용 표**

| 고용 | 없음 | 선복 | 확장 | 둘 다 | 둘 다 22일 |
|---|---|---|---|---|---|
| 2pt 8일 | −3,318 (0) ↓ | −3,210 (0) ↓ | −1,928 (3) ↓ | +842 (16) ↑ | +24 (10) |
| 2pt 29일 | −3,183 (1) ↓ | −2,334 (2) ↓ | −1,465 (2) ↓ | +73 (11) | −641 (5) ↓ |
| 2pt 30일 | −1,845 (3) ↓ | −1,216 (5) ↓ | −1,206 (3) ↓ | +32 (10) | +599 (15) ↑ |
| 2pt 31일 | −3,061 (1) ↓ | −776 (3) ↓ | −923 (3) ↓ | +43 (10) | +349 (11) |
| 2pt 50일 | −1,984 (0) ↓ | −1,784 (0) ↓ | −1,452 (0) ↓ | −1,099 (3) ↓ | −767 (2) ↓ |
| 3pt 8일 | −4,804 (0) ↓ | −5,566 (0) ↓ | −2,368 (1) ↓ | +2,336 (17) ↑ | +806 (12) |
| 3pt 29일 | −4,206 (0) ↓ | −3,732 (0) ↓ | −2,079 (0) ↓ | −160 (9) | −152 (10) |
| 3pt 30일 | −3,812 (1) ↓ | −2,134 (1) ↓ | −1,809 (3) ↓ | +83 (11) | +833 (11) |
| 3pt 31일 | −3,680 (0) ↓ | −2,727 (2) ↓ | −1,549 (3) ↓ | +262 (13) | +473 (12) |
| 3pt 50일 | −2,506 (1) ↓ | −2,368 (0) ↓ | −1,654 (1) ↓ | +135 (11) | −350 (8) |

출처: `m2a5/spec_check/out_B_window7.md`(`python3 exp_spec.py table CAND_B flat:20000 window7`).

**정책 185개 판정(`exp_spec.py judge`, 판정 정의는 모형 README 7절):**

| 조건 | 판정 1234 | 뚜렷한 이득/손해 칸(보통) | 가장 강한 정책(1위와 300 USD 안 시드) | 비고 |
|---|---|---|---|---|
| 이 명세(B, 이동 창 예약, 감액 200) | 1111 | 4 / 16 | 3pt 8일 + 둘 다 (9/20) | 분석값으로 재도 같다(B7) |
| 같은 조건, 표본 밖 시드 1021~1040 | 1111 | 4 / 18 | 같은 정책 (6/20) | 시드별 1위 고용 15·비고용 5 |
| 남은 요금 전액 예약(CRITIC1 A4 권장안) | 1011 | 0 / 19 | 고용·투자 없음 (11/20) | 고용 이득 조건이 사라진다 → 기각 |
| 감액 50 USD(Q10 거절 시) | 1111 | 4 / 16 | **적극·고용 없음** (8/20) | 적극 − 보통 +2,263(18/20). 적극 수락 고용 표 이득 0칸(F1 구멍) |
| 감액 100 USD | 1111 | 4 / 16 | 3pt 8일 + 둘 다 (7/20) | 적극 − 보통 +956(15/20). 적극 수락 이득 0칸 |
| 후보 A(일반 3 + 작업 3, 3 m³), 감액 50 | 1111 | 13 / 4 | 적극·3pt 30일 + 확장 (7/20) | 2pt 고용은 거의 늘 이득(CRITIC2 F3) |

**읽는 법:**
- 고용이 이득인 조건은 **보관·선복을 먼저 늘린 회사**다. 직원만 늘리면 9 m³ 화물이 보관·선복에 막혀 크게 손해다(CL-03 ‘직원 추가가 배편 부족을 풀지 않는다’, CL:40). 그래서 D02-③(선복 계약)이 고용 판단에 쓰인다(CRITIC1 B4 해소).
- 고용하지 않는 것이 맞는 상황(CL:79)은 ‘투자 없이’ 또는 ‘50일에 늦게’ 고용할 때다. 시드 운이 아니라 회사 상태로 갈린다. 29·30·31일 판정이 같다(CRITIC2 F3 해소).
- 3pt 직원은 둘 다 늘린 뒤에는 2pt 직원보다 낫고(+1,537 대 +917), 없을 때는 더 나쁘다(−3,715 대 −2,615). 창고 처리 한도 6pt 때문이다(8.2).
- 감액 200 USD에서 적극 수락은 보통보다 −1,515로 진다. 적극 수락에서도 8일 고용 + 둘 다는 이득이다. 감액 50·100 USD에서는 적극 수락의 고용 표에 이득 칸이 없다.
- **경제 규모:** 기여이익 중앙이 결정 묶음 문구 그대로(F만)의 6,763에서 19,439로 약 2.9배다. 작업 포함 주선이 82%다. 시세표·수량 고르기(D02-①)의 무게는 15%로 작다. 이것은 조정 실수가 아니라 D03 나의 구조다. 새 직원이 이득이려면 pt당 이익이 임금보다 커야 하고, 그러면 기존 두 직원도 같은 일로 큰 이익을 낸다(CRITIC1 B1). **Q1.**
- **민감도(CRITIC2 F6):** B는 H 대금을 내릴 여유가 없다. −50 USD면 판정 2가 떨어진다(이득 0칸). +50 USD는 넘는다. 재측정에서 이득 칸이 사라지면 대금을 올리는 쪽만 쓴다.

### 17.3 엔진 재측정 계획(비교 실행기 `src/engine/sim/`)

**정책(규칙 2 시나리오, `config.operations`가 있을 때만):**
- 환전(앞 7일): 하루 명령 맨 앞에 `앞 7일 원화 지출(급여·임차료·오늘 낼 계약금·설치비) + 원화 미지급 − 원화 현금`이 양수면 100 USD 단위로 올림해 `EXCHANGE_CURRENCY`(쓸 수 있는 USD 한도 안). `IDLE`은 하지 않는다. 새 정책 `NO_FX`는 환전만 빼고 `MAX_CONTRIBUTION`과 같다.
- 수락: `MAX_CONTRIBUTION`(보통)은 직접 무역을 큰 수량부터 시험하고 **정시 출항편만** 쓴다. 새 정책 `LATE_OK`(적극)는 감액 뒤 기여이익이 양수면 늦은 편도 쓴다. 지금 `MAX_CONTRIBUTION`에는 정시 거르기가 없다(`policies.ts:100-101`은 `ON_TIME_FIRST`만). 규칙 1 시나리오의 동작은 그대로 둔다.
- 수락 시험(CRITIC1 C1): `prepWorkUnitsFor`와 계획 상태의 `projectPrepCompletion({ assignQueued: true, blocked })`로, 이 견적과 기존 예약 계약이 모두 예약 출항편 전에 끝날 때만 받는다. 빈 직원이 없어도 받을 수 있다(출항편만 예약하고 직원은 빌 때 맡긴다).
- 배정: 대기 업무를 8.3 순서로 빈 직원(설정 순서)에게 맡긴다. 예측 함수와 같은 규칙이다.
- 영입 변형 `hire:{2pt|3pt}@H`: 후보 가운데 그 처리량의 첫 후보(설정 순서)를 고른다. ID를 쓰지 않는다. 시작 직원 가운데 마지막 사람이 H−3일 조사(1pt), H−2~H−1일 의뢰(3pt), H일 고용. 그 사람은 H−3일 전에 끝나지 않을 준비 업무를 새로 맡지 않는다(`blocked`). 변형 `scout:early`는 조사를 3일(또는 그 뒤 첫 빈날)에 미리 한다(CRITIC2 F3).
- 투자 변형 `inv:{none|S|E|SE|SE22}`: S = 1일 두 노선 서명, E = 7일 확장, SE = 둘 다, SE22 = 22일 둘 다.
- 진단: 두 명 고용(2pt 22일 + 3pt 36일, SE), 경고 뒤에만 환전(`react`).

**명령줄:** `node src/engine/sim/run.mjs d03 [--seeds N] [--out PATH]`. 표준 출력에 D03 표를 낸다. 기본 `run`은 지금처럼 `SCENARIO_IDS` × 기존 5정책이다. 그래서 기존 출력이 바이트 단위로 같다.

**지표(규칙 2 실행에만 `metrics.operations`로 붙는다):** `outcome`, 실패일·의무, 첫 미지급일, 통화별 끝 미지급(`unpaidAtEnd`), 환전 합(방향별 USD·KRW·차감), 고정비(임차료·설치비·선복 요금), `currencyTransferNet`, 사업별 기여이익(작업 포함 주선·일반 주선·직접 무역), 창고 대기 업무-일·대기 pt, 보관·처리 사용률, 직원 사용률, 거절 원인별 수(자금·보관·처리·선복·직원·정시 편 없음), 실제 고용일. 통화별로 둔다. 통화 합산값은 없다.

**확정 기준(J1~J5):** 비교 값은 USD 순자산이다. 한 실행의 ‘이득 시드’는 USD 순자산이 크고, 실패가 없고, 끝 원화 미지급이 0인 경우다.
- J1: 보통·환전·고용·투자 없음 → 실패 0/20, 끝 원화 미지급 0/20.
- J2: **보통과 적극 두 수락 모두에서** 고용(2pt·3pt × 8·30·50일) × 투자(없음·S·E·SE) 24칸 가운데 ↑ 칸과 ↓ 칸이 각각 하나 이상.
- J2b: J2의 ↑·↓ 칸 가운데 30일 칸은 29·31일 칸이 반대 판정(↓·↑)이 아니고 중앙값 부호가 같다.
- J3: 환전 정책(진단 제외) 가운데 어느 것도 17/20 시드 이상에서 그 시드 1위와 300 USD 안이 아니다. 보통·적극을 합쳐 본다.
- J4: 묶음당 견적 ≤ 10, 주선 준비 2~12pt, `NO_FX` 실패 ≥ 15/20, 기준 회사 USD 순자산 중앙 10,600 ~ 19,100 USD이고 끝 원화 ≥ 0. (범위는 모형 판정 4 ‘시작의 1.0~1.8배’를 끝에 원화가 거의 남지 않는 조건에서 USD로 옮긴 설계 상수다. 도구는 통화를 합치지 않는다.)
- J5: 두 명 고용 이득 ≤ 3/20.

**벗어나면:** Astra는 값을 고치지 않고 표만 보고한다. Claude(세션 A)가 정한다. 손잡이 순서: H 서비스 대금(+50 USD 단위, 올리는 쪽만) → 묶음당 H 수(4 → 3) → 감액(Q10). 바꾼 값과 이유는 DECISIONS에 적는다.

**회귀:** 기존 4개 시나리오의 기본 `run` 출력이 작업 전과 `compare`로 ‘같음’이어야 한다(지표 차이 0, 실행 400회).

### 17.4 손익분기 규칙(설명용)

- 2pt·90,000원 직원: 90,000 ÷ 2pt ÷ 1,287 ≈ 35 USD/pt. 3pt·110,000원: ≈ 28.5 USD/pt. 창고 한도 6pt에 걸려 실제 2pt면 ≈ 42.7 USD/pt.
- 일감의 pt당 기여이익(작업 포함 70 USD)과 그 직원이 실제로 쓰는 pt(직원·창고·보관·선복 중 가장 좁은 곳)가 이를 넘을 때만 고용이 이득이다. 재측정 뒤 조정도 이 규칙으로 설명한다(CRITIC1 B1).

## 18. 인수 명세 (P0-M2A5-01 ~ 17)

공통: 시나리오 `SCENARIO_M2_OPERATIONS`, 시드 42032026(`game_config.json` `config.seed`), 시작 USD 3,000.00·KRW 10,000,000원, 직원 귀솔(EMP01)·물보리(EMP02) 2pt·80,000원. ‘대기’는 명령 없이 하루를 닫는 것이다. `tests/acceptance_cases.json` 형식(`P0-M2A-04` 항목 참고)으로 넣는다. 11은 시험용 설정을 쓴다. 시험 코드는 이 항목에서 행동·기대값을 읽는다(자료 ID를 시험 소스에 쓰지 않는다).

**P0-M2A5-01 결정적 견적 공개**
- 행동: 7일까지 대기. 7일 마감 전과 뒤를 본다. 같은 시드로 두 번 실행하고, 한쪽은 4일에 저장·불러오기와 7일 마감 재전송을 한다.
- 기대(8일 묶음, `MARKET-B01` 커서 0~21):
  - 지수: 0.805097 × 7 = 5.64 → 5 − 3 = +2. 0.736039 × 7 → +2. 둘 다 halfUp(10,000 × 102, 100) = 10,200 bp(102).
  - 판매지: 0.966764 × 2 → 1 = 상하이(의류). 0.413184 × 2 → 0 = 하이퐁(화장품).
  - 지역 요인(× 9 − 4): 0.252801 → −2, 0.315194 → −2, 0.559397 → +1, 0.715990 → +2, 0.676596 → +2, 0.425626 → −1.
  - 시세표(cents): 평택 의류 1,000, 평택 화장품 3,998, 하이퐁 의류 1,442, 하이퐁 화장품 5,098, 상하이 의류 1,405, 상하이 화장품 5,049.
  - 거래처 차이(× 7 − 3): 0.358910 → −1, 0.449631 → 0, 0.617509 → +1, 0.438899 → 0.
  - 단가: 의류 매입 990(9.90), 의류 판매(상하이) 1,405(14.05), 화장품 매입 halfUp(3,998 × 101, 100) = 4,038(40.38), 화장품 판매(하이퐁) 5,098(50.98).
  - 최대 물량: 0.362755 × 3 → 1 → 배수 2 → 의류 200개. 0.564103 × 3 → 1 → 화장품 100상자.
  - 일반 주선(커서 16·17): i = 0: 0.253370 × 6 → 1, j = 1. i = 1: 0.261790 × 5 → 1, j = 2. → F2·F3.
  - 작업 포함(커서 18~21): i = 0: 0.520673 × 6 → 3, j = 3. i = 1: 0.418362 × 5 → 2, j = 3. i = 2: 0.594932 × 4 → 2, j = 4. i = 3: 0.850594 × 3 → 2, j = 5. → H4·H1·H5·H6 → 정렬 H1·H4·H5·H6.
  - 견적 10건: `MKT-D008-APP-BUY`(9.90, 최대 200), `-APP-SELL`(상하이 14.05, 납기 15, 결제 19), `-COS-BUY`(40.38, 최대 100), `-COS-SELL`(하이퐁 50.98, 납기 15, 결제 17), `-F2`(납기 22, 결제 24), `-F3`(15, 19), `-H1`(22, 24), `-H4`(22, 26), `-H5`(22, 26), `-H6`(22, 24). 모두 유효 8~10일.
  - 7일 마감 전에는 `operations.offers`와 모든 읽기 함수에 `MKT-D008-*`가 없다. 마감 뒤(8일 `PENDING_OPEN`)에 있다. `state.rng.cursors`는 비어 있다.
  - 두 실행과 저장 재개 실행의 묶음 1~11 정의가 같다. 저장된 묶음을 처음부터 다시 계산한 값과 같다. 다른 시드(1001)와는 한 묶음 이상 다르다.

**P0-M2A5-02 시세표·체결 가격 고정**
- 행동: 7일까지 대기. 8일 `ACCEPT_TRADE(MKT-D008-APP-BUY, MKT-D008-APP-SELL, quantity 200, plan EMP01·ROUTE02-D009)`.
- 기대: 매입 198,000(1,980.00), 판매 281,000(2,810.00), 운임 180.00, 관세 9,900(99.00). 필요 자금 2,259.00 ≤ 3,000.00. 준비 2 + (2 − 1) = 3pt → 8·9일 → 9일 출항 → 13일 도착·인도. 기여이익 551.00.
- 15일 묶음 지수: 의류 u = 0 → 10,200, 화장품 u = +3 → 10,506(105). 계약 판매액 2,810.00 그대로. 수금 max(19, 13) = 19일.
- `marketTable` 8일: 평택 의류 1,000·지수 102·관측 8·다음 15. 14일: `ageDays` 6. 80일: 78일 묶음 값, 다음 null. 85일: `ageDays` 7.

**P0-M2A5-03 보관 한도(15일 묶음: F1·F3·H2·H3·H4·H5)**
- 행동: 14일까지 대기. 15일: ① `ACCEPT_FORWARDING(MKT-D015-F1, plan EMP01·ROUTE01-D016)` ② `ACCEPT_FORWARDING(MKT-D015-H2, plan EMP02·ROUTE02-D023)` ③ `ACCEPT_FORWARDING(MKT-D015-H3)`(계획 없음).
- 기대: ① 0 + 24,000 = 24,000 L → 수락. ② 24,000 + 9,000 = 33,000 → 수락. ③ 33,000 + 9,000 = 42,000 > 40,000 → 거절 ‘보관 공간 부족 — 평택 창고 33 / 40 m³, 이 화물 9 m³. 출항하거나 확장하면 공간이 생깁니다.’ 상태 변화 없음. USD 현금 3,000 − 200 − 180 = 2,620.00.
- F1은 15·16일 준비(4pt) → 16일 출항 → 보관량 9,000 L.
- 변형: 14일 `EXPAND_WAREHOUSE` → 15일 한도 60,000 → ③ 수락(42,000 ≤ 60,000). USD 현금 2,620.00, H3 운임 예약 200.00. KRW 설치비 200,000원.
- 반례: ③ 대신 같은 화물을 선복이 찬 편에 계획해 거절되면 문장에 ‘보관 공간 부족’이 없다.

**P0-M2A5-04 하루 처리 한도**
- 행동: 1일 `SCOUT_SITE(VEN_PORT, EMP02)`. 2일 `START_RECRUIT_QUEST(EMP04, EMP02)`(3pt → 2·3일). 4일 `HIRE_CANDIDATE(EMP04)`(계약금 550,000원, 5일부터 근무). 8일: ① `ACCEPT_TRADE(MKT-D008-APP-BUY, -APP-SELL, quantity 100, plan EMP01·ROUTE02-D009)` ② `ACCEPT_FORWARDING(MKT-D008-H1, plan EMP04·ROUTE01-D016)` ③ `ACCEPT_FORWARDING(MKT-D008-H4, plan EMP02·ROUTE02-D016)`.
- 계약: CT001 의류(2pt), CT002 H1(12pt), CT003 H4(12pt). USD 3,000 − 990 − 180 − 200 − 180 = 1,450.00, 관세 예약 49.50.
- 8일 배분(한도 6): CT001(출항 9) 귀솔 2. CT002(출항 16, 납기 22, ID 앞) 현돌 3. CT003 물보리 원함 2, 받음 1. `handlingLog` 8일 = `{ capacityPt 6, usedPt 6, waits [{ TASK003, CT003, 2, 1 }] }`.
- 8일(마감 전) `projectPrepCompletion`: CT003 8일 1 + 9~13일 2 × 5 = 11 → 14일 12 → 14일 완료 ≤ 16. CT002: 3 × 4일 → 11일. 실제 진행이 예측과 같다.
- 변형: 7일 확장 → 8일 한도 9 → 대기 없음, CT003 13일 완료.
- 직원 2명만이면 4pt ≤ 6pt라 장부·일정이 한도 없는 계산과 같다.

**P0-M2A5-05 준비 업무량**
- 의류 100·200·300 → 2·3·4pt. 화장품 50·100·150 → 2·3·4pt. 1일 묶음 직접 무역 2pt. OFFER_FWD_01 4pt, OFFER_FWD_02 2pt. F1 4, F2 2, F3 2, F4 2, F5 3, F6 2. H1~H6 12(틀 값).
- 반례: 작업 포함 화물의 수량을 절반으로 바꾼 시험용 틀도 12pt다(부피와 무관).

**P0-M2A5-06 임차료·고정비**
- 행동: 56일까지 대기.
- 기대: 1일 마감 KRW 10,000,000 − 450,000 − 160,000 = 9,390,000원. `RENT-D001`·`RENT-D031` 한 번씩. 1일(열린 뒤) `payrollRunwayDay` = 56(56일 마감 140,000 ≥ 0, 57일 −20,000).
- 규칙 1 시나리오는 62 그대로(`previews.test.ts:220`).
- 계약 기여이익에 임차료가 없다. 원화 장부 행 합 = 손익. 재전송·저장 재개에도 임차료 분개가 늘지 않는다.

**P0-M2A5-07 환전·통화 간 이체**
- 행동: 1일 `EXCHANGE_CURRENCY(USD_TO_KRW, 100,000)`, 이어서 `EXCHANGE_CURRENCY(KRW_TO_USD, 100,000)`.
- 기대: 첫 명령 USD 3,000 → 2,000.00, KRW +1,287,000원, 차감 13,000원. `FX001-USD`·`FX001-KRW` 각자 대차 일치. USD `currencyTransferNet` −100,000, KRW +1,300,000. 순자산 = 시작 + 손익 + 이체(통화별). 둘째 명령 KRW −1,313,000원, 차감 13,000원, USD 3,000.00 복귀. 통화마다 `currencyTransferNet` 0. 왕복 손실 26,000원(KRW 손익).
- 거절: 50 USD → ‘100 USD 단위’. 1일 기대 경로(화장품 + 주선 2건, 현금 420·예약 100·가용 320) 뒤 400 USD → ‘환전할 수 있는 USD가 부족…’(문장에 ‘선복 계약 요금 예약’ 없음), 300 USD는 수락. 같은 명령 ID 재전송 → DUPLICATE.
- 같은 날 급여: 56일까지 대기 뒤 57일 `EXCHANGE_CURRENCY(USD_TO_KRW, 10,000)` → KRW 140,000 + 128,700 = 268,700 → 급여 160,000 → 108,700원, 미지급 없음.
- 엔진이 스스로 환전한 분개가 어느 실행에도 없다.

**P0-M2A5-08 지급 순서(지금 규칙)**
- 행동: 1일 `EXCHANGE_CURRENCY(USD_TO_KRW, 70,000)`(900,900원). 그 뒤 대기.
- 기대: 60일 마감 KRW 10,000,000 + 900,900 − 160,000 × 60 − 450,000 × 2 = 400,900원, 미지급 0.
- 61일: 임차료 450,000 > 400,900 → `RENT-D061` 미지급. 급여 두 건은 현금이 있어 지급 → 240,900원.
- 62일: 밀린 임차료 450,000 > 240,900 → 건너뜀. 급여 지급 → 80,900원.
- 63일: 귀솔 지급 → 900원, 물보리 80,000 미지급.
- 75일 마감(61 + 14): 경영 실패. 원인 `RENT-D061` 450,000원. 미지급 2,450,000원(26건), 현금 900원.
- 반례: 61~62일 기록에 ‘현금이 있는데 지급하지 않음’ 류 문장이 없다. 급여는 실제로 나갔다.

**P0-M2A5-09 지급 불이행 단계·경영 실패(D04)**
- 행동 A: 대기만.
- 기대 A: 56일 마감 KRW 140,000. 57일 귀솔 지급 → 60,000, 물보리 `WAGE-D057-EMP02` 미지급. 57일 마감 경고(나이 0), 63일 경고(6), 64일 위험(7), 71일 `failsAtCloseToday`.
  - 64일 회복: `lotsToClearAll` = ceil((1,490,000 + 160,000 − 60,000) ÷ 128,700) = 13, `usdAvailableLots` 30.
  - 71일 회복: `dueToSurvive` 80,000 → `lotsToSurvive` = ceil(20,000 ÷ 128,700) = 1. `lotsToClearAll` = ceil((2,610,000 + 160,000 − 60,000) ÷ 128,700) = 22.
  - 71일 마감: 미지급 2,770,000원(30건). `outcome` FAILED, `failure = { day 71, obligationId WAGE-D057-EMP02, currency KRW, amountMinor 80,000, incurredDay 57, … }`, `cashByCurrency` USD 300,000·KRW 60,000. `warningEvent.day` 57, `dangerEvent.day` 64. `optionalKrwSpendBeforeFirstUnpaid` [](선택 지출 없음). 공개 묶음 11개(1·8·…·71일). `phase` ENDED, `day` 72. 이후 명령은 ‘캠페인이 끝났습니다(경영 실패).’
- 행동 B: 70일 `EXCHANGE_CURRENCY(USD_TO_KRW, 200,000)` → 60,000 + 2,574,000 = 2,634,000 → 밀린 지급 2,450,000 → 184,000 → 급여 → 24,000원, 미지급 0. 71일 다시 미지급(`WAGE-D071-EMP01` 기준, 85일 실패).
- 행동 C: 70일 `EXCHANGE_CURRENCY(USD_TO_KRW, 10,000)` → 188,700 → `WAGE-D057-EMP02` → 108,700 → `WAGE-D058-EMP01` → 28,700 → 나머지는 건너뜀. 70일 마감 기준 의무 58일(나이 12). 72일 마감 실패.
- 반례: 행동 B의 70일 마감에는 새 경고 기록이 없다(미지급 0). 정상 종료 판(P0-M2A5-14 변형)에는 ‘경영 실패’ 문장이 없다.

**P0-M2A5-10 창고 확장(DK-11)**
- 행동: 22일 `EXPAND_WAREHOUSE`.
- 기대: 22일 설치비 200,000원. 22일 한도 40 m³·6pt, 23일부터 60 m³·9pt. `RENT-D031`·`RENT-D061` 700,000원. 22일(명령 뒤) `payrollRunwayDay` = 54.
- 거절: 두 번째 → ‘한 번만’. 쓸 수 있는 KRW < 200,000이면 ‘설치비 자금이 부족’, 미지급 없음.
- 반례: 62일 확장의 기록에는 ‘다음 임차일부터 700,000원’이 없다(남은 임차일 없음).

**P0-M2A5-11 선복 장기 계약(DK-21, 시험용 설정)**
- 설정: 1일 묶음에 F5와 같은 상하이행 가구 90점(18 m³·1,800 kg, 준비 3pt, 납기 15) 주선 견적 2건(S-A, S-B)을 더한 시험용 설정.
- 행동 A(계약 없음): S-A `plan { EMP01, ROUTE02-D009 }`, S-B `plan { EMP02, ROUTE02-D009 }` → S-B 일괄 확정 전체 거절(‘…운송편 예약 불가: 이 출항편의 남은 화물 공간이 부족합니다 (부피 18m³ 필요, 남은 12m³)…’).
- 행동 B: 1일 `SIGN_SPACE_CONTRACT(ROUTE02)` 먼저 → 적용 9·16·…·86일 12편, 합계 360.00 USD. `ROUTE02-D009` 한도 40,000 L·6,500,000 g → 둘 다 예약. 보관 36,000 ≤ 40,000.
- 예약(출항일이 오늘 ~ 오늘 + 7이고 아직 내지 않은 적용 편): 1일 `reservedCommitments` 0(9 > 8). 2일 3,000(9일 편). 9일 명령 단계 6,000(9·16일 편). 9일 6c 지급 뒤 3,000(16일 편).
- 요금: 12편 × 3,000 cents. 예약이 없는 편에도 낸다. ROUTE01 1일 서명이면 11편(86일 편 제외).
- 2일 편 한도는 30 m³ 그대로. 같은 노선 두 번째 계약 거절.
- 반례: 계약 없는 노선의 편에는 ‘선복 계약’ 표시·예약이 없다.

**P0-M2A5-12 기존 기대값 보존**
- 행동: 1일 `ACCEPT_TRADE(OFFER_BUY_02, OFFER_SELL_02, plan EMP01·ROUTE02-D002)`, `ACCEPT_FORWARDING(OFFER_FWD_01, plan EMP02·ROUTE01-D002)`, `ACCEPT_FORWARDING(OFFER_FWD_02)` + `BOOK_SAILING(ROUTE01-D009)`. 2일 `ASSIGN_TASK(FWD_02 업무, EMP01)`. 17일까지.
- 기대: 가구 4pt → 1·2일 물보리 → 2일 출항. 1일 현금 420.00·예약 100.00·가용 320.00, 7일 현금 320.00·채권 2,880.00, 17일 3,500.00(`PATH_COSMETICS_AND_FORWARDING`). 의류 경로 3,430.00. 17일 KRW 10,000,000 − 450,000 − 160,000 × 17 = 6,830,000원.
- 거절 2건(`REJECT_SECOND_DIRECT_TRADE`·`REJECT_FORWARDING_SAME_SAILING`)의 USD 값이 같다. 1일 선복 계약을 맺어도 2일 편 거절은 그대로다.
- 규칙 1 시험·M1 세 경로는 부록 B 허용 목록 밖에서 고치지 않고 통과한다.

**P0-M2A5-13 저장 판본 6과 재현**
- 7일 `PENDING_OPEN`, 8일 `AWAITING_INPUT`(환전 명령 계획만), 22일(확장 직후)에 저장·불러오기를 하고 같은 명령을 주면, 저장 없는 실행과 상태가 같다.
- 판본 5 실제 저장(`src/engine/fixtures/save-v5-m2.json`, 자료 0.5.0)이 `migrateV5toV6`으로 열린다. `operations`만 null로 더해지고 나머지가 같다. 이후 10일 진행이 판본 5 상태에서 진행한 결과와 같다.
- 생성 견적의 `publishDay`를 오늘보다 크게 고친 저장, 보관량이 한도를 넘는 저장, 규칙 1 저장에 `operations`가 있는 저장은 거절된다.

**P0-M2A5-14 결산과 같은 시드 다시**
- 09 행동 A 뒤 `campaignSummary`: `operations.outcome` FAILED, 통화별 값만, 합계 칸 없음.
- `restartWithSameSeed` → 1일 새 게임, 시드 42032026, 7일 마감 뒤 8일 묶음이 01과 같다.
- 변형(미지급을 남기고 끝남): 1일 `EXCHANGE_CURRENCY(USD_TO_KRW, 300,000)`(3,000 USD → 3,861,000원) 뒤 대기. 78일 마감 KRW 13,861,000 − 1,350,000 − 160,000 × 78 = 31,000원. 79일 첫 미지급(두 급여). 90일 마감 `outcome` COMPLETED(79 + 14 = 93 > 90), `arrearsAtEnd` KRW 1,920,000원(24건), 현금 31,000원. 이후 명령은 ‘캠페인이 끝났습니다.’(‘경영 실패’ 없음).

**P0-M2A5-15 통화 분리**
- 09 행동 A 동안 USD 3,000.00이 있어도 원화 미지급이 USD로 갚아지지 않는다. 어떤 보고 칸도 USD와 KRW를 더하지 않는다.

**P0-M2A5-16 가격 수용자**
- 같은 시드로 ‘받을 수 있는 견적을 모두 받는 정책’과 대기만 하는 실행을 78일까지 돌리면 묶음 1~11의 지수·시세표·견적 정의가 같다.

**P0-M2A5-17 비교 실행기**
- 기본 `run`은 작업 전 출력과 `compare` ‘같음’이다. `d03` 출력에 17.3 표·지표·J1~J5가 있다. 같은 입력 두 번이면 같다. `IDLE`은 71일에 실패하고, `NO_FX`는 ≥ 15/20 실패한다.

## 19. 범위 밖

- D05 고객 연체·대손(M3). D06 사건 틀·EV05·단기 인력(M2a-6a). D07 재협상(M2a-6b). D08 위임·자동 진행(M2a-6c).
- 변동 환율·환산 손익(M3). 시장 반응·수요 소진·경쟁사(M3).
- 플레이어 처리 순서 지정, 창고 여러 곳, 창고 무게 한도, 확장 되돌리기, 선복 계약 해지.
- 남은 재고 재판매(B42 재판매 부분). M2b 능력 처리량. 본사 그림 장면(M5). 다른 시드로 다시 하기.
- 화면 전부(16절, Sol).

## 20. 열린 질문

| 번호 | 질문 | 기본값 | 막는 것 | 사용자 |
|---|---|---|---|---|
| **Q1** | D03 사전 조정안 후보 B를 받는가. 작업 포함 주선(9 m³·12pt·840 USD)이 기여이익의 82%, 직접 무역 15%. 경제 규모 약 2.9배. 고용 이득은 ‘보관·선복을 늘린 뒤’에만 생긴다. 선택: 가 B 그대로 / 나 H 비중을 낮춤(대금·건수, 고용 이득은 더 드묾) / 다 D03을 가(그대로 둠)로 되돌림 | 가 | 자료값만. 엔진 작업은 막지 않는다 | **확인 필요** |
| **Q10** | 규칙 2 시나리오의 늦은 인도 감액을 정액 50 → 200 USD로 바꾸는가. 50·100 USD면 ‘늦어도 다 받기’가 가장 강하고 그 수락에서 고용 이득이 없다 | 200 | 자료값만 | **확인 필요** |
| Q2 | DECISIONS 1075행 ‘④ 가 지급 우선순위 자동’을 ‘업무(창고 처리) 순서 자동, 지급은 기존 규칙’으로 고칠지 | 고침 | 기록 문구 | 알림 |
| Q3 | 확장 임차료 증액을 다음 임차일부터 받는 틈 | 원문대로 | 없음 | 알림 |
| Q4 | 선복 계약 30 USD/편·해지 불가·쓰지 않아도 냄·8일 창 예약 | 받음 | 없음 | 알림 |
| Q5 | 실패·경고 화면 현실 문구 원문 대조 | 조문 번호 없이 | Sol | — |
| Q7 | 1일 묶음 가구 준비 4pt(규칙 2 통일) | 4pt | 첫 거래 안내 문구 | — |
| Q8 | 묶음당 10건 읽기 부담 | 10건, 사용성 관찰 | Sol | — |
| Q9 | 17.3 J1~J5 범위 | 제안값 | 재측정 판정 | — |
| Q11 | 미지급을 남기고 90일을 마친 결과 이름. `COMPLETED` + ‘미지급을 남기고 끝남’ 표시 | 그렇게 | Sol 문구 | 알림 |

(개정 1의 Q6 ‘분석값 허용’은 지웠다. 엄격 지급 순서는 기존 규칙으로 돌아가 질문이 필요 없다.)

## 부록 A. 모형 파일과 재현

| 위치 | 내용 |
|---|---|
| `m2a5/model/m2a5_model.py`·`README.md` | 사전 조정 모형(후보 A·B·C, 정책 185개, 판정 1~4). 재현 명령은 README 2절 |
| `m2a5/critic2/ana/exp.py` | CRITIC2 변형(감액·영입 절차·고용일) |
| `m2a5/spec_check/exp_spec.py` | 이 명세 규칙(건너뛰기 지급, 도착 편만 요금, 8일 창 예약, 감액 200) |
| `m2a5/spec_check/out_B_*.md`, `judge_runs.txt` | 17.2 표 원자료 |
| `m2a5/spec_check/krw_idle.py` | 18절 06·07·08·09·10 원화 사례(지금 지급 규칙) |
| `m2a5/spec_check/b_batches.py` | 후보 B의 8·15·78일 묶음(01·03·04 사례) |

재현(표준 라이브러리만, 같은 입력이면 같은 출력):
```
cd m2a5/spec_check
PYTHONDONTWRITEBYTECODE=1 python3 b_batches.py
PYTHONDONTWRITEBYTECODE=1 python3 krw_idle.py
PYTHONDONTWRITEBYTECODE=1 python3 exp_spec.py table CAND_B flat:20000 window7
PYTHONDONTWRITEBYTECODE=1 python3 exp_spec.py judge CAND_B flat:20000 window7 1001
```
- 모형 README의 작은 오류(CRITIC2 F7): H는 10묶음(8~71일)에서 나온다. 행 번호 `scenarios.json:297`(시작 USD), `:327`(취소비).
- 지시서 실행 전에 허브가 이 명세를 `docs/ai/design/M2A5-SPEC.md`로, 모형 폴더를 `docs/ai/design/m2a5-model/`로 저장소에 올린다(Codex는 작업 공간 밖을 읽지 못한다).

## 부록 B. 바꿀 파일과 허용 시험 수정

**바꿀 파일(엔진 지시서):**
- 엔진: `types.ts`, `engine.ts`, `ledger.ts`, `reservations.ts`, `catalog.ts`(`offerDef`), `progress.ts`, `previews.ts`, `reports.ts`, `invariants.ts`, `save.ts`, `save-shape.ts`, `testkit.ts`, 새 `market.ts`·`operations.ts`(창고·선복·고정비·환전·지급 불이행). 
- 로더·자료·검사기: `src/content/scenario.ts`, `data/market_rules.json`(새), `schemas/market_rules.schema.json`(새), `data/scenarios.json`, `schemas/scenarios.schema.json`, `data/parameters.json`, `PACKAGE_STATUS.json`, `tools/validate_data.py`·`tools/test_validate_data.py`, `tests/acceptance_cases.json`, `MANIFEST.json`(생성).
- 비교 실행기: `src/engine/sim/policies.ts`·`sim.ts`·`metrics.ts`·`cli.ts`·`compare.ts`(필요 시).
- 새 시험: `src/engine/m2a5-*.test.ts`, `src/engine/sim/m2a5-sim.test.ts`.
- 화면: **없음.** 5.5·8.4·14절의 형 나누기로 화면 타입 검사가 깨지지 않는다(실험 확인).

**허용 시험 수정(실험: 판본 6 + `operations: null`로 vitest를 돌려 14개 실패, 5개 파일):**

| 파일:행 | 지금 | 바꿀 것 |
|---|---|---|
| `save-v5.test.ts:52-53` | 판본 5 실제 저장 왕복이 원본과 같음 | 불러온 상태 = 원본 + `operations: null`, 다시 쓴 파일 = `formatVersion` 6 + 같은 상태 |
| `save-v5.test.ts:69-70` | `culture` 밖 전체가 같음 | `operations`도 떼어 내고 null인지 본다 |
| `save-v5.test.ts:122` | `formatVersion` 5 | `SAVE_FORMAT_VERSION` |
| `save-v5.test.ts:150` | 거절 목록 `[0, 6, '5', 5.5]` | `[0, 7, '5', 5.5]` |
| `m2a-growth.test.ts:333-334` | 5 | 6·`SAVE_FORMAT_VERSION` |
| `m2a-recruit.test.ts:326-327` | 5 | 6·`SAVE_FORMAT_VERSION` |
| `m2a-multi.test.ts:275` | 5 | `SAVE_FORMAT_VERSION` |
| `m2a-culture.test.ts:56` | `['0.5.0', 'M2a-rules-1', 5]` | `['0.5.0', 'M2a-rules-1', 6]` |
| `save-shape.test.ts:11-19, 26-37` | 열거형 목록 | 새 열거형 6개를 더하기만 한다 |

- 시험 이름은 바꾸지 않는다(인수 명세 연결 검사가 이름을 본다). ‘판본 5로 왕복한다’ 같은 이름이 낡는 것은 범위 밖 발견에 적는다.
- `sim.test.ts`는 고치지 않는다. 새 시나리오가 `SCENARIO_IDS` 밖이라 3·4번(`:80-109`)의 90일 마감·항등식·급여 가능일 검사를 받지 않는다. 대신 새 시험이 규칙 2 항등식(이체 포함)과 실패일 지표를 본다.
- `tools/validate_data.py`의 `expected_counts['scenarios']` 7 → 8은 의도한 변경이다.

## 부록 C. 자료 뼈대

`data/market_rules.json`(금액은 달러 표시값. 로더가 cents로 한 번만 바꾼다):

```json
{
  "schema_version": "0.1.0", "data_basis": "DESIGN", "source_refs": ["DESIGN-V04"],
  "numeric_values_status": "합성 개발용 값. 실제 시세·운임·작업 단가가 아님. 주선 묶음 구성·작업 포함 틀은 사전 조정 출발값이며 비교 실행기 20시드 재측정으로 확정한다(DECISIONS:1076).",
  "rule_sets": [{
    "id": "M2A5_PYEONGTAEK",
    "publish": { "first_day": 1, "interval_days": 7, "last_day": 78, "valid_days": 3 },
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
      "goods": [
        { "good_id": "APPAREL", "id_tag": "APP", "base_lot": 100, "buy_counterparty_id": "SUPPLIER_DEMO",
          "sell_counterparties": [{ "city_id": "HAIPHONG", "counterparty_id": "CUSTOMER_DEMO" }, { "city_id": "SHANGHAI", "counterparty_id": "CUSTOMER_SHA_APPAREL" }] },
        { "good_id": "COSMETICS", "id_tag": "COS", "base_lot": 50, "buy_counterparty_id": "SUPPLIER_DEMO_COSMETICS",
          "sell_counterparties": [{ "city_id": "HAIPHONG", "counterparty_id": "CUSTOMER_HAI_COSMETICS" }, { "city_id": "SHANGHAI", "counterparty_id": "CUSTOMER_DEMO_SHANGHAI" }] }
      ],
      "max_lots_choices": [1, 2, 3],
      "sell_deadline_offset_days": 7,
      "payment_offset_days": [{ "city_id": "HAIPHONG", "days": 9 }, { "city_id": "SHANGHAI", "days": 11 }]
    },
    "forwarding": {
      "draws": [{ "service_class": "STANDARD", "count": 2 }, { "service_class": "HANDLING", "count": 4 }],
      "templates": [
        { "id": "F1", "service_class": "STANDARD", "title_ko": null, "good_id": "FURNITURE", "quantity": 120, "destination_city_id": "HAIPHONG", "service_fee": { "currency": "USD", "amount": 380 }, "deadline_offset_days": 7, "payment_offset_days": 9, "counterparty_id": "SHIPPER_DEMO_FURNITURE", "prep_work_units": null },
        { "id": "H1", "service_class": "HANDLING", "title_ko": "라벨 작업 포함 전자제품", "good_id": "ELECTRONICS", "quantity": 300, "destination_city_id": "HAIPHONG", "service_fee": { "currency": "USD", "amount": 1040 }, "deadline_offset_days": 14, "payment_offset_days": 16, "counterparty_id": "SHIPPER_DEMO_ELECTRONICS", "prep_work_units": 12 }
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

- `templates`는 표 6.6-1·6.6-2의 12개를 F1~F6, H1~H6 순서로 모두 적는다. `counterparties`에는 화면 고정 표(`src/ui/main.ts:138-145`)의 6개 이름도 옮긴다(같은 이름).

`data/scenarios.json` 새 항목(상속, 덮어쓰는 키만):

```json
{
  "id": "SCENARIO_M2_OPERATIONS",
  "base_scenario_id": "SCENARIO_M2_MULTI_TRADE",
  "title_ko": "평택 본사 90일 운영 — 반복 견적·창고·환전",
  "engine_rules": { "rules_version": "M2a-rules-2", "funds_check": "committed_outlays", "forwarding_enabled": true,
    "note_ko": "매주 새 견적이 공개되고, 창고 보관·처리 한도와 원화 고정비가 있다. 원화는 환전 명령으로만 마련하며 미지급이 14일 남으면 경영 실패다." },
  "contract_terms": { "...": "SCENARIO_M2_MULTI_TRADE의 contract_terms를 모두 다시 적고 아래만 바꾼다",
    "late_delivery": { "price_reduction": { "currency": "USD", "amount": 200 }, "basis": "flat_once_regardless_of_late_days" },
    "notes_ko": ["규칙 2 값으로 다시 쓴 문장(준비량 규칙, 200 USD 감액, 고정비·환전·실패)"] },
  "operations": {
    "market_rules_ref": "market_rules.json#M2A5_PYEONGTAEK",
    "prep": { "trade_extra_per_lot": 1, "standard_m3_per_work_unit": 6, "min_work_units": 2 },
    "facility": { "city_id": "PYEONGTAEK", "storage_m3": 40, "handling_work_units_per_day": 6,
      "applies_to_task_kinds": ["EXPORT_PREP", "FORWARDING_PREP"],
      "expansion": { "max_count": 1, "storage_m3": 20, "handling_work_units_per_day": 3,
        "setup_fee": { "currency": "KRW", "amount": 200000 }, "rent_increase": { "currency": "KRW", "amount": 250000 },
        "effective_after_days": 1, "rent_increase_from": "next_rent_day_on_or_after_effective_day" } },
    "fixed_costs": { "rent": { "currency": "KRW", "amount": 450000, "period_days": 30, "first_due_day": 1, "timing": "prepaid_step6c" } },
    "fx_exchange": { "base_rate_ref": "game_config.json#/config/fx_krw_per_usd", "spread_basis_points": 100,
      "lot": { "currency": "USD", "amount": 100 }, "auto_exchange": false, "status": "DESIGN_game_fixed_rate" },
    "space_contract": { "route_ids": ["ROUTE01", "ROUTE02"], "extra_m3": 10, "extra_kg": 1500,
      "fee_per_sailing": { "currency": "USD", "amount": 30 }, "lead_days": 7, "covers": "departures_arriving_within_campaign",
      "reserve_days_ahead": 7, "cancellable": false, "max_per_route": 1, "charge": "every_covered_departure_take_or_pay" },
    "payment_default": { "basis": "oldest_unpaid_obligation_any_currency", "warning_from_age_days": 0,
      "danger_from_age_days": 7, "failure_age_days": 14, "failure_check": "end_of_step6" }
  },
  "scope_note": "M2a-5: 반복 견적·수량 고르기·창고·고정비·환전·지급 불이행. 화면은 후속 작업.",
  "source_refs": ["DESIGN-V04"]
}
```

## 부록 D. 비판 반영 대조표

| 지적 | 반영 위치 |
|---|---|
| CRITIC1 A1 | 부록 B 허용 목록, 5.5(명령 형), 8.4(막힘 코드 안 더함), 11.4(결산 칸 조건부) |
| A2 | 3절 목록 나누기 |
| A3 | 5.3, 10.1, 14.1, 15-6 |
| A4 | 9절 이동 창 예약, 17.2 근거 |
| A5 | C19, 5.4, 18-13 |
| B1 | 17.2 ‘경제 규모’, 17.4, Q1 |
| B2 | 6.3 결과, 14.5 `demand.recent`, 14.6 |
| B3 | 6.6-2, 7 |
| B4 | 17.2 ‘읽는 법’ 첫 항목 |
| B5 | C10, 10.3, 18-08 |
| B6 | 11.2, Q11, 18-14 |
| B7 | 10.4, 17.3(통화별 기준), 17.2(두 기준 판정 같음) |
| C1 | 17.3 수락 시험·배정 |
| C2 | 11.2 `FailureRecord`, 11.3, 14.7 |
| C3 | 14.8 |
| C4 | 8.3, 14.3 `affectedContracts` |
| C5 | 모형에서 이미 고침(CRITIC2 2.2) |
| C6 | 7절 |
| C7 | 14.5 `prepDaysToClear` |
| C8 | 8.4(막힘 코드 대신 읽기 함수, 분류는 Sol) |
| C9 | 14.4 `warningKo` |
| C10 | 11.2-3 |
| C11 | 18-06(56일까지), 18-03(새 묶음으로 다시 씀) |
| C12 | 17.3 회귀(바이트 동일), 3절 기본 묶음 그대로 |
| CRITIC2 F1 | C18, P46, 17.3(두 수락 방식), Q10 |
| F2 | 17.2 표(보통 수락 안에서 고용 판단이 투자 상태로 갈림) |
| F3 | 17.2 29~31일 행, 17.3 J2b·`scout:early` |
| F4 | 8.2, 14.5, 16-3 |
| F5 | 17.2 사업별 비중, 17.3 지표 |
| F6 | 17.2 민감도, 17.3 손잡이 순서 |
| F7 | 부록 A |
