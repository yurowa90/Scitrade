# TASK-0027 M2a-5 엔진: 반복 견적·창고·고정비·환전·지급 불이행 (규칙 2)

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `<BASE>`(TASK-0025 병합 `c896c8a` 이후, 이 지시서와 명세를 올린 커밋).
  - `<BASE>` 자리표시가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0027-m2a5-engine.md`의 해시를 기준으로 쓰고, 결과 보고 ‘실행한 검증’ 첫 줄에 적는다(`docs/ai/tasks/README.md` ‘지시서 형식’).
  - `codex/TASK-0027`에서 작업한다. 시작할 때 `git rev-parse --short HEAD`를 결과 보고에 적는다.
  - 지시서 커밋이 더한 `docs/ai/tasks/TASK-0027-*.md`, `docs/ai/tasks/README.md`, `docs/ai/design/M2A5-SPEC.md`, `docs/ai/design/m2a5-model/**`, `MANIFEST.json`은 `git diff <BASE>`에 나와도 이 작업의 변경으로 치지 않는다.
  - 아래 행 번호는 `bacedfa` 기준이다. `bacedfa..<BASE>` 사이에 `src/engine`·`src/content`·`data`·`tests`·`schemas`·`tools/validate_data.py` 변경은 없다(Claude 확인, `c896c8a`까지). 다르면 코드가 사실이다.
  - 병렬 작업: 세션 B가 `src/ui/**`를 고친다(TASK-0024 등). **이 작업은 `src/ui/**`를 한 줄도 고치지 않는다.** 화면 타입 검사가 깨지지 않게 형을 나눴다(명세 5.5·8.4·11.4, Claude 실험 확인).
- 결정 근거:
  - `docs/DECISIONS.md` 1068~1103행 ‘사용자 결정 일괄 채택’: D01 가(1074), D02 ①~⑤(1075, ③ 가), D03 나(1076), D04 가(1077).
  - `docs/DECISIONS.md` 717행: 기능을 더할 때 자료 판본을 올리지 않고 저장 형식만 올린 선례(M2a-4). 57행: 필수 지급 미지급 규칙. 152행: 예약은 확정 지출만. 316행: 선택 지출은 미지급을 만들지 않음. 54행: 통화 합산 금지. 223행: 표시와 결과 일치.
  - `docs/ai/design/M2A5-SPEC.md`(이하 ‘명세’). 이 작업의 규칙·숫자·문장은 모두 명세가 기준이다. 명세 0.1절은 비판 반영 대조다.
  - `docs/CLASSIC_GAME_INSIGHTS.md` 38~40행(CL-01~03), 54·79행(채용이 불필요한 상황도 유효한 판단).
  - `docs/ai/design/DECISION-PACKET-2026-10.md` 41~51행(일관성 점검), 54~178행(D01~D04).
  - 사전 조정 모형 `docs/ai/design/m2a5-model/`(명세 부록 A). 참고 자료다. 이 작업에서 돌리지 않아도 된다.

## 목표

1. 규칙 판본 `M2a-rules-2`와 새 시나리오 `SCENARIO_M2_OPERATIONS`를 만든다. 매주 결정적으로 공개되는 견적, 수량 고르기, 창고 보관·처리 한도와 확장, 선복 장기 계약, 원화 임차료, 환전 명령, 지급 불이행 단계와 경영 실패를 엔진에 넣는다.
2. 규칙 1 시나리오 4개의 동작·문장·보고 칸·비교 실행기 출력은 바이트 단위로 그대로 둔다.
3. 저장 형식을 6으로 올린다. 자료 판본 0.5.0의 판본 5 실제 저장이 이관으로 열린다.
4. 비교 실행기에 규칙 2 정책(환전·수량·정시 거르기·영입·투자 변형)과 `d03` 명령을 더한다. **20시드로 D03 표를 재어 결과 보고에 싣는다.** 값은 고치지 않는다.
5. 인수 명세 P0-M2A5-01~17을 자료와 시험으로 연결한다.

- 화면은 하지 않는다(후속 Sol 지시서). 새 시나리오는 화면 선택 상자에 나오지 않는다.

## 먼저 읽을 파일

- **명세 전체**: `docs/ai/design/M2A5-SPEC.md`. 특히 3·5절(자료형), 6~13절(규칙), 14절(읽기 함수), 15절(불변 조건), 17.3절(비교 실행기), 18절(인수 명세), 부록 B(허용 시험 수정)·C(자료 뼈대).
- 엔진(행 번호 `bacedfa`):
  - `src/engine/types.ts`: 14행 규칙 판본, 50~73행 `OfferDef`, 110~129행 `ScenarioTerms`, 142~176행 `ScenarioConfig`, 450~481행 `GameState`, 494~505행 `Command`.
  - `src/engine/engine.ts`: 53~111행 `createGame`, 162~178행 `planCommands`·`planState`, 180~224행 `applyCommand`, 230~251행 `withPlan`, 261~275행 `fundsShortfall`(274행 문장), 282~386행 `acceptTrade`(290행 같은 수량 규칙), 388~465행 `acceptForwarding`(455행 준비량, 463행 기록 문장), 472~483행 직원 검사, 667~722행 `bookSailing`, 796~838행 `commitDay`, 840~890행 `progressTasks`, 892~950행 출항, 952~991행 도착, 993~1058행 인도(1000행 감액), 1060~1066행 수금, 1099~1135행 `payOrAccrue`(1133행 문장), 1137~1157행 `settleObligations`(건너뛰기), 1159~1166행 급여, 1170~1177행 `postOrThrow`.
  - `src/engine/reservations.ts`: 21~37행 `cashReservations`, 54~68행 `fundsPosition`, 76~79행, 91~127행 선복.
  - `src/engine/ledger.ts`: 7~45행 계정, 125~186행 `BookSummary`·`summarize`(183행 손익).
  - `src/engine/catalog.ts`: 14~16행 `offerOf`, 36~54행 `listSailings`, 66~72행 `cargoSpace`.
  - `src/engine/progress.ts`: 21~30행 `BlockerCode`, 44~136행 `contractProgress`(99·101행).
  - `src/engine/capacity.ts`: 49~94행(88~92행 `daysToClear`).
  - `src/engine/previews.ts`: 40~53행 `payrollRunwayDay`.
  - `src/engine/reports.ts`: 19~32행, 132~174행, 211~289행(285행 정렬), 296~356행.
  - `src/engine/save.ts`: 19·97·109~111·114·119~123행. `src/engine/save-shape.ts`: 8~29행, 56~105행. `src/engine/invariants.ts`: 107~117행.
  - `src/engine/rng.ts` 33~40행, `src/engine/money.ts` 36~41행, `src/engine/growth.ts` 8~23행, `src/engine/testkit.ts` 50~70행.
- 로더: `src/content/scenario.ts` 34~42행(목록), 129~134행(상속), 136~161행(`toOffer`), 247~422행(`loadScenario`, 258·284·288·387·419행).
- 비교 실행기: `src/engine/sim/sim.ts`(10·31~33·61~83행), `policies.ts`(23~40행 후보, 42~119행 결정, 79~82행 배정, 91~96행 정렬, 100~101행 정시 거르기, 104~106행 준비량, 121~129행 정책 목록), `metrics.ts`(41~48·77~142행), `cli.ts`(11~17·40~61행), `compare.ts`, `sim.test.ts`(22·42~55·57~182행).
- 자료: `data/scenarios.json` 269~517행(`SCENARIO_M2_MULTI_TRADE`), `data/market_offers.json`, `data/parameters.json` 56~61행, `data/goods.json`, `data/routes.json`, `data/employees.json`, `schemas/scenarios.schema.json`(항목 `required`: `id`·`securities_enabled`·`source_refs`·`stage`. `contract_terms`는 `additionalProperties: false`), `PACKAGE_STATUS.json`.
- 검사기: `tools/validate_data.py` 77~89행, 805~860행(816행 `expected_counts`), 960~995행. `tools/test_validate_data.py`.
- 인수 명세: `tests/acceptance_cases.json`(`P0-M2A-04` 항목 형식, `review_summary`).
- 시험(읽기, 부록 B 허용 줄만 고침): `save-v5.test.ts`, `m2a-growth.test.ts`, `m2a-recruit.test.ts`, `m2a-multi.test.ts`, `m2a-culture.test.ts`, `save-shape.test.ts`, `campaign-end.test.ts`(76행), `progress.test.ts`, `sim/sim.test.ts`.
- 화면(읽기만): `src/ui/main.ts` 300·805~838·1208행, `src/ui/session.ts` 27행, `src/ui/reports.ts` 102~106행, `src/ui/trade-reports.test.ts` 114~117행.

## 범위

**포함**
1. 자료: `market_rules.json`·스키마, 새 시나리오(상속), `parameters.json`, `PACKAGE_STATUS.json`(구현 지시 1).
2. 형과 로더(지시 2·3).
3. 장부 계정·보고 칸(지시 4).
4. 시장: 묶음 생성·공개·견적 찾기·쌍·시세표(지시 5).
5. 준비량·창고 보관·처리 배분·준비 예측(지시 6·7).
6. 선복 장기 계약·예약(지시 8). 임차료·확장(지시 9). 환전(지시 10).
7. 지급 순서·지급 불이행 단계·경영 실패·결산(지시 11).
8. 새 명령과 규칙 2 문장(지시 12), 하루 순서(지시 13).
9. 읽기 함수(지시 14).
10. 저장 판본 6·모양·불변 조건(지시 15).
11. 자료 검사기(지시 16). 인수 명세(지시 17).
12. 비교 실행기 정책·지표·`d03`(지시 18).
13. 기존 시험 허용 수정(지시 19).
14. D03 재측정 실행과 보고(지시 20).

**제외**
- `src/ui/**` 전부. 화면 문구·막힘 분류·결산 표·환전 칸(명세 16절)은 Sol.
- `BlockerCode`에 새 코드 더하기(명세 8.4).
- `SCENARIO_IDS`(화면 목록)에 새 시나리오 넣기, 화면 기본 시나리오 바꾸기.
- 자료 판본(`package_version`) 올리기.
- D03 값 조정. 재측정이 기준을 벗어나도 값을 고치지 않는다(지시 20).
- 사건·재협상·위임·연체(명세 19절).
- 규칙 1의 동작·문장·보고 칸 변경.

**시간이 모자라면 뺄 수 있음** (1번부터 뺀다)
1. `hiringOutlook`(지시 14.6)과 그 시험.
2. `quotePreview.affectedContracts`(지시 14.3의 그 칸)와 그 시험.
3. `warehouseSummary.demand.recent`(지시 14.5의 그 칸)와 그 시험.
4. `d03`의 `scout:early` 변형(지시 18.6).
- 뺀 항목은 결과 보고 ‘완료 조건 대조’에 ‘미충족(시간)’으로 적는다. **D03 재측정(지시 20)은 빼지 않는다.**

## 고칠 수 있는 파일

- `src/engine/**`(새 파일 `market.ts`·`operations.ts`·새 시험 포함). 기존 시험 파일은 부록 B의 줄만.
- `src/content/scenario.ts`
- `data/market_rules.json`(새), `schemas/market_rules.schema.json`(새), `data/scenarios.json`, `schemas/scenarios.schema.json`, `data/parameters.json`
- `PACKAGE_STATUS.json`: `data_documents`, `data_schemas`, `core_acceptance_specifications` 세 칸만.
- `tools/validate_data.py`, `tools/test_validate_data.py`
- `tests/acceptance_cases.json`
- `docs/ai/tasks/results/TASK-0027.md`(결과 보고), `docs/ai/tasks/results/TASK-0027-d03.md`(D03 표)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 만든다.

## 손대지 않을 파일

- `src/ui/**`, `src/assets/**`, `index.html`, `vite.config.ts`, `package.json`, `package-lock.json`. 새 의존성 없음.
- `data/**` 가운데 위 목록 밖, `schemas/**` 가운데 위 목록 밖, `references/**`, `public/**`.
- `tools/**` 가운데 위 두 파일 밖(`build_package.py`, `check_bundle_size.mjs`, `bundle-size.mjs`, `check_fact_mixing.py`, `ai/**`, `browser/**`, `art/**`, `fonts/**`).
- `docs/**` 가운데 결과 보고 두 파일 밖. 특히 `docs/ai/design/M2A5-SPEC.md`(명세와 코드가 다르면 보고만 한다).
- `README.md`, `START_HERE.md`, `AGENTS.md`, `CLAUDE.md`.

## 지켜야 할 것

- **규칙 1 불변:** 규칙 1 시나리오의 상태·장부·기록 문장·보고 칸·읽기 함수 결과·비교 실행기 출력이 작업 전과 같아야 한다. 규칙 2 기능은 `config.operations !== null`(능력)로 고른다. **시나리오 ID로 고르지 않는다**(`sim.test.ts:169-182`).
- **화면 0줄:** `git diff --stat <BASE> -- src/ui`의 출력이 없어야 한다. 화면이 쓰는 형·함수의 서명을 바꾸지 않는다: `Command`(선택 칸 `quantity?`만 더함), `BlockerCode`, `CashReservation`, `tradePairs(config)`, `tradePreview`, `forwardingPreview`, `offerOf`, `UpcomingPaymentKind`(값만 더함), `CampaignSummary`(규칙 1 칸 목록), `SCENARIO_IDS`·`ScenarioId`.
- **설정에 ID 키 금지:** `ScenarioConfig.operations`의 모든 목록은 `id`·`cityId`·`goodId` 칸이 있는 배열이다. 자료 ID를 객체 키로 쓰지 않는다(`sim.test.ts:42-49` 이름 바꾸기 시험은 값만 바꾼다).
- **결정적 난수:** 시장 생성은 묶음마다 새 지역 상태 `{ seed: state.rng.seed, cursors: {} }`로 `drawUniform`(흐름 `MARKET-B{kk}`)을 부른다. `state.rng.cursors`를 읽거나 쓰지 않는다. 비교 실행기 정책 난수는 지금처럼 정책 흐름만 쓴다. `Math.random`·`Date.now`·`new Date`·현재 시각 금지.
- **돈:** 통화별 정수 최소 단위. 환율 13·128,700·131,300을 코드에 쓰지 않고 설정(`fx`)에서 계산한다. 두 통화를 더한 값을 어떤 반환값·지표·기록에도 만들지 않는다.
- **새 문장마다 반례:** 지시 12의 문장 표에 있는 새 문장마다 그 문장이 거짓이 되는 상태를 시험에 넣고, 그 상태에서 그 문장(또는 그 부분)이 나오지 않음을 확인한다.
- **숫자 일부만 단언 금지:** 새 시험의 기대값은 객체·배열 전체를 `toEqual`로 비교한다. `toMatchObject`, `expect.objectContaining`, `expect.arrayContaining`, `toContain`(숫자 목록), 필드 몇 개만 고른 비교로 숫자를 확인하지 않는다. 문장 확인은 `toBe`(전체 문장) 또는 반례의 `not.toContain`만 쓴다.
- **새 시험에 자료 ID 금지:** 새 시험 소스(`src/engine/m2a5-*.test.ts`, `src/engine/sim/m2a5-sim.test.ts`, `tools/test_validate_data.py`의 새 줄)에 도시·상품·견적·틀·직원·노선·장소·거래처·시나리오 ID 문자열을 쓰지 않는다. 행동·기대값은 `tests/acceptance_cases.json`의 그 사례에서 읽고(예: `m2a-multi.test.ts:5`처럼 가져온다), 나머지는 설정에서 찾는다(`config.homeCityId`, `OPERATIONS_SCENARIO_IDS[0]`, 처리량이 3인 첫 후보 등). 인수 명세 사례 ID(`P0-M2A5-…`)와 계약·업무 번호 형식(`CT001`)은 써도 된다. 완료 조건 3의 스크립트가 확인한다.
- **JSON 형식:** 고치는 JSON은 `json.dumps(obj, ensure_ascii=False, indent=2) + '\n'`로 쓴다(지금 파일과 같은 형식). 새 칸은 객체 끝에 더한다. 기존 값은 바꾸지 않는다(허용: `parameters.json`의 `PAR_PAYMENT_GRACE_DAYS`, `PACKAGE_STATUS.json` 세 칸, 인수 명세 `review_summary` 개수·`added_cases_note`).
- **기존 시험:** 부록 B 표의 줄만 고친다. 시험 이름은 바꾸지 않는다. 다른 기존 시험이 실패하면 기대값을 고치지 말고 원인을 찾는다.
- **Git:** 커밋·푸시·브랜치 전환·stash 금지. 변형 시험 뒤에도 git으로 되돌리지 않는다.
- **크기 한도:** 첫 화면 합계 여유는 약 43,900 B·gzip 11,900 B다(`c896c8a`: 556,087 B·gzip 128,091 B). 넘으면 한도·빌드 설정을 바꾸지 말고 수치와 원인(새 자료·엔진 코드 크기)을 ‘질문’에 적는다.

## 구현 지시

### 0. 시작 기록

다음을 실행해 결과 보고 ‘실행한 검증’에 적는다.
- `git rev-parse --short HEAD`, `git status --short`.
- `python3 tools/validate_data.py` 첫 줄. Claude 확인값(`c896c8a`): `PASS: 23 data documents; 25821 structural/reference/arithmetic checks`.
- `python3 tools/test_validate_data.py`: 74개 통과.
- `npx vitest run`: 33개 파일, 1000개 통과, 할 일 1.
- `node src/engine/sim/run.mjs run --out /tmp/TASK-0027-sim-before.json`: ‘실행 400회’. **이 파일을 끝까지 지우지 않는다**(완료 조건 2의 회귀 비교).
- `cp tools/validate_data.py /tmp/TASK-0027-validate_data.py.orig`와 지시 18의 변형 시험용 사본(완료 조건 4).

### 1. 자료

**`data/market_rules.json`(새)**: 명세 부록 C 뼈대대로. `templates`는 표 6.6-1·6.6-2의 12개를 F1~F6, H1~H6 순서로 모두 적는다. `counterparties`는 6개 새 이름 + `src/ui/main.ts:138-145`의 기존 6개 이름(같은 `id`·같은 이름). `numeric_values_status`는 부록 C 문장 그대로.

**`schemas/market_rules.schema.json`(새)**: 다른 스키마와 같은 형식. 최상위 `required`(`$schema`, `schema_version`, `data_basis`, `source_refs`, `numeric_values_status`, `rule_sets`, `counterparties`). 템플릿 `required`(`id`, `service_class`, `title_ko`, `good_id`, `quantity`, `destination_city_id`, `service_fee`, `deadline_offset_days`, `payment_offset_days`, `counterparty_id`, `prep_work_units`). `service_class`는 `enum` `["STANDARD", "HANDLING"]`.

**`data/scenarios.json`**: `items` 끝에 `SCENARIO_M2_OPERATIONS`를 더한다(명세 3절, 부록 C).
- `base_scenario_id: "SCENARIO_M2_MULTI_TRADE"`. 스키마가 요구하는 `id`, `stage: "M2"`, `securities_enabled: false`, `ipo_enabled: false`, `source_refs: ["DESIGN-V04"]`를 원본 레코드에 둔다.
- 덮어쓰는 키: `title_ko`, `engine_rules`(`rules_version: "M2a-rules-2"`, `funds_check`·`forwarding_enabled` 같음, `note_ko` 부록 C), `contract_terms`(기존 M2 값 전체 복사 + `late_delivery.price_reduction.amount` 200 + `status: "PRE_TUNING_2026-10-10"` + `decision_ref: "docs/DECISIONS.md 사용자 결정 일괄 채택 D03·D04, docs/ai/design/M2A5-SPEC.md"` + `notes_ko` 새로), `operations`(부록 C), `scope_note`.
- `contract_terms.notes_ko`(규칙 2용, 이 문장 그대로):
  1. `"직접 무역 수출 준비는 기본 단위 2pt에 단위가 하나 늘 때마다 1pt를 더한다. 일반 운송 주선 준비는 6m³당 1pt(최소 2pt), 작업 포함 운송 주선은 견적마다 12pt다. 직원 1명은 한 번에 업무 1건만 맡는다."`
  2. `"출항 전 취소와 준비 미완료로 출항편을 놓친 경우 모두 해당 예약의 선급 운임에서 취소비 50을 뺀 금액을 환급한다. 직접 무역은 공급자 반품 없음, 운송 주선 화물은 화주에게 돌려준다."`
  3. `"납기를 넘긴 인도는 지연 일수와 무관하게 계약 금액을 200 USD 한 번 감액한다. 상품 판매대금과 운송 주선 서비스 대금에 같은 조건을 쓴다. 이 값은 사전 조정값이며 비교 실행기 재측정으로 확정한다."`
  4. `"결제일은 고객 견적의 payment_due_day이며 인도일보다 이를 수 없다."`
  5. `"운송 주선 화물의 수입 관세는 수입자(고객)가 부담하는 것으로 단순화한다."`
  6. `"임차료·창고 확장비·환전 차감은 원화, 선복 계약 요금은 USD다. 원화는 환전 명령으로만 마련하고 자동 환전은 없다. 가장 오래된 미지급이 14일 남은 날 마감에 경영 실패다."`
  7. `"모든 값은 현실 계약 관행이나 운임 시세가 아닌 개발용 가정이다."`
- `schemas/scenarios.schema.json`: 항목 `properties`에 `operations`(객체, 하위 `required`는 부록 C의 키)를 더한다. `contract_terms`의 허용 키는 그대로다(새 칸을 넣지 않는다).

**`data/parameters.json`**: `PAR_PAYMENT_GRACE_DAYS`의 `value` 14, 객체 끝에 `"json_pointer": "scenarios.json#/items/7/operations/payment_default/failure_age_days"`, `notes_ko`를 `"D04 가(2026-10-10). 규칙 2 시나리오(operations.payment_default)에만 적용한다. 가장 오래된 미지급 의무의 발생일 + 14일 마감에 남아 있으면 경영 실패. 규칙 1 시나리오는 실패 판정을 하지 않는다."`로 바꾼다. (7은 새 시나리오의 `items` 위치다. 다르면 실제 위치를 쓴다.)

**`PACKAGE_STATUS.json`**: `data_documents` 24, `data_schemas` 24, `core_acceptance_specifications` 35. `package_version`은 0.5.0 그대로.

### 2. 형(`src/engine/types.ts`)

- `SUPPORTED_RULES_VERSIONS`에 `'M2a-rules-2'`.
- `OfferDef`에 필수 칸: `maxQuantity`, `quantityStep`, `serviceClass: 'STANDARD' | 'HANDLING' | null`, `publishDay`, `batchK`, `templateId: string | null`, `titleKo: string | null`, `prepWorkUnits: number | null`.
- `ScenarioConfig.operations: OperationsConfig | null`(명세 5.1). `GameState.operations: OperationsState | null`(명세 5.2). `MarketBatch`, `DefaultEvent`, `FailureRecord`(명세 5.2·11.2·11.3).
- `OperationsCommand` = `EXCHANGE_CURRENCY { id; direction: 'USD_TO_KRW' | 'KRW_TO_USD'; usdAmountMinor }` | `EXPAND_WAREHOUSE { id }` | `SIGN_SPACE_CONTRACT { id; routeId }`. `EngineCommand = Command | OperationsCommand`. `Command`의 `ACCEPT_TRADE`에 `quantity?: number`만 더한다.
- `planCommands`, `planState`, `commitDay`, `applyCommand`, `testkit.runDays`(`DayScript`)는 `EngineCommand`를 받는다. 결과 형 `CommandResult`는 그대로다.

### 3. 로더(`src/content/scenario.ts`)

- 목록(명세 3절): `OPERATIONS_SCENARIO_IDS = ['SCENARIO_M2_OPERATIONS'] as const`, `ALL_SCENARIO_IDS = [...SCENARIO_IDS, ...OPERATIONS_SCENARIO_IDS] as const`, `AnyScenarioId`. `SCENARIO_IDS`·`ScenarioId`·`M2_SCENARIO_IDS`는 그대로. `loadScenario(id: AnyScenarioId)`, `assumptionNotes(id: AnyScenarioId)`.
- `toOffer`(136~161행): 새 `OfferDef` 칸을 1일 묶음 값으로 채운다(명세 5.1).
- `operations`: 레코드에 `operations`가 있으면 `market_rules.json`의 `market_rules_ref` 규칙 묶음을 읽어 `OperationsConfig`로 바꾼다. 금액은 `toMinor`로 한 번만. 부피는 L 정수(`Math.round(m3 × 1000)`), 무게 g 정수.
- 검사(실패하면 오류): `operations`가 있으면 `rules_version`이 `M2a-rules-2`이고, 없으면 `M2a-rules-2`가 아니다. `fx_exchange.base_rate_ref`가 `game_config.json` `config.fx_krw_per_usd`와 맞다. 템플릿의 `good_id`·`destination_city_id`·거래처 ID가 있다. `draws`의 등급 순서는 STANDARD → HANDLING이고 각 수 ≤ 그 등급 틀 수.
- 규칙 1 레코드는 `operations: null`. 반환 객체의 다른 칸은 지금과 같다.

### 4. 장부(`src/engine/ledger.ts`, `src/engine/reports.ts`)

- 명세 5.3 계정 5개를 `Account`와 `ACCOUNT_KIND`에 더한다.
- `BookSummary`에 `rentExpense`, `facilitySetupExpense`, `spaceContractExpense`, `fxSpreadExpense`, `currencyTransferNet`(자본 정상 방향). `profit`에서 네 비용을 뺀다.
- `CurrencyStanding`(296~311행)에 같은 다섯 칸. 305행 주석을 ‘자산 합계 − 미지급금 = 시작 자본 + 누적 손익 + 통화 간 이체’로.

### 5. 시장(새 `src/engine/market.ts`)

- `generateBatch(seed, k, prevIndex, config)`: 순수 함수. 명세 6.2~6.5. 반환 `{ batch: MarketBatch; offers: OfferDef[] }`. `drawCount` 22.
- `batchZero(config)`: 묶음 0 기록.
- `offerDef(state, config, id)`(`catalog.ts` 또는 `market.ts`): `config.offers` → `state.operations?.offers`. 엔진·`testkit.ts:54`·비교 실행기의 `offerOf` 호출을 바꾼다. `offerOf`는 남긴다.
- `openTradePairs(state, config)`: 같은 `publishDay`·같은 상품·노선이 있는 열린 쌍(명세 6.8). `tradePairs(config)`는 그대로.
- `marketTable(state, config)`(명세 14.2).
- 78일 묶음처럼 납기·결제가 90일을 넘는 견적은 만들지 않지만 난수는 쓴다(명세 6.1).

### 6. 준비량

- `prepWorkUnitsFor(config, offer, quantity)`(명세 7절). 규칙 1은 지금 값(`terms.prepWorkUnits`, `terms.forwardingPrepWorkUnits`)을 그대로 돌려준다. `acceptTrade`·`acceptForwarding`(366·455행)이 이 함수를 쓴다.

### 7. 창고(새 `src/engine/operations.ts`)

- `storageUsedLiters(state, config)`, `storageCapacityLiters(state, config, day)`(명세 8.1).
- `allocateHandling(state, config, day)`: 명세 8.2·8.3. 반환 `{ capacityPt; allocations: { taskId; contractId; wantPt; gotPt }[] }`. `progressTasks`와 `projectPrepCompletion`이 **같은 함수**를 쓴다.
- `progressTasks`(840~890행): 규칙 2에서 본사 준비 업무의 진행량은 배분량이다. 진행·완료 적용은 `s.tasks` 순서 그대로. `handlingLog`에 그날 기록.
- `projectPrepCompletion(state, config, options?)`(명세 8.4). `options.assignQueued`·`options.blocked`. 날마다 대기 업무 배정(8.3 순서, 직원은 `config.employees` 순서, 쉬는 직원만, `blocked` 제외) → 배분 → 진행을 모의한다. 캠페인 끝까지 끝나지 않으면 `readyDay: null`.
- 규칙 2 `contractProgress`: 준비 완료 예상일(99행)은 `projectPrepCompletion(...).readyDay`. 101행 대신 명세 8.4의 규칙 2 문장. 규칙 1은 그대로.

### 8. 선복 장기 계약

- `coveredSailings(config, routeId, signedDay)`: 명세 9절(출항일 ≥ 서명일 + 7, 출항일 + 운송일 ≤ 캠페인 마지막 날).
- `sailingLoad`·`spaceShortfall`(91~127행)이 계약 한도를 쓰게 한다. 계약이 없으면 지금과 같다.
- `commitmentReservations(state, config)`: 출항일이 `오늘 ≤ d ≤ 오늘 + reserveDaysAhead`이고 그 `SPACE-…` 분개가 아직 없는 적용 편 요금. `fundsPosition`의 `reserved`에 더하고, 새 칸 `reservedCommitments`를 돌려준다(규칙 1은 0). `cashReservations`는 바꾸지 않는다.
- 6c 요금 지급(지시 13), 서명 명령(지시 12).

### 9. 임차료·확장

- 명세 8.5·10.2. 6c에서 임차일이면 `RENT-D{ddd}`(확장 효력 반영). 확장 명령은 지시 12.

### 10. 환전

- 명세 10.1·12.1. `FX{nnn}-USD`·`FX{nnn}-KRW` 두 분개. `exchanges` 기록.

### 11. 지급·지급 불이행·결산

- 지급 순서는 지금 규칙(명세 10.3, `engine.ts:1099-1157`). 6c 고정비를 6b와 6d 사이에 넣는다.
- 규칙 2의 미지급 기록 문장(1133행 대신): `지급 불가: ${reasonKo} ${금액} → 미지급 의무로 기록 (14일 안에 갚지 못하면 경영 실패)`. 규칙 1은 그대로.
- 6e: 명세 11.1~11.3. 단계 기록(`defaultEvents`), 실패 검사, `FailureRecord`(경고·위험 기록, 실패 전 14일 원화 선택 지출).
- 실패 마감: 7단계를 건너뛰고 8단계 마감. `day = 실패일 + 1`, `phase = 'ENDED'`, `outcome = 'FAILED'`. 90일 정상 마감은 `outcome = 'COMPLETED'`.
- `campaignSummary`: 규칙 2에서만 최상위 `operations` 칸(명세 11.4). `arrearsAtEnd`는 통화별 `{ currency; amountMinor; count }[]`.
- `restartWithSameSeed(state, config)`.
- `paymentDefaultStatus(state, config)`(명세 14.7).

### 12. 명령과 규칙 2 문장

`applyCommand`에 세 명령을 더한다(명세 12.1~12.3). 규칙 1 시나리오는 `'이 시나리오에서는 할 수 없습니다(M2a-5 기능).'`. 규칙 2에서 `phase === 'ENDED'`면 모든 명령을 `outcome`에 따라 `'캠페인이 끝났습니다(경영 실패).'` 또는 `'캠페인이 끝났습니다.'`로 거절한다(`planState`·미리 보기용. `commitDay`는 지금처럼 오류).

`ACCEPT_TRADE`·`ACCEPT_FORWARDING`의 규칙 2 검사 순서와 문장은 명세 12.4·12.5. 규칙 2 계약 기록 문장은 거래처 이름(`counterparties`)을 쓰고 내부 ID·‘을(를)’을 쓰지 않는다(명세 6.5). 규칙 2 `fundsShortfall`(261~275행) 문장의 항목은 0이 아닌 것만, 선복 요금은 `선복 계약 요금 예약 {금액}`으로 따로 적는다.

**새 문장과 반례 표** (문장은 명세 그대로. 시험은 문장 전체를 `toBe`로 확인하고, 반례 상태에서 그 문장·부분이 없음을 확인한다)

| # | 문장(요약) | 반례 상태 → 나오면 안 되는 것 |
|---|---|---|
| S1 | ‘보관 공간 부족 — 평택 창고 {보관} / {한도} m³, 이 화물 {부피} m³. 출항하거나 확장하면 공간이 생깁니다.’ | (a) 보관은 남고 선복이 모자라 거절 → ‘보관 공간 부족’ 없음. (b) 확장 뒤 보관 부족 → ‘확장하면’ 없음(‘출항하면 공간이 생깁니다.’) |
| S2 | ‘수량은 {step}{단위} 단위로 {step} ~ {max}{단위}까지 고를 수 있습니다.’ | 최대 수량 그대로 수락 → 거절 없음 |
| S3 | ‘같은 묶음·같은 상품의 매입·판매만 묶을 수 있습니다.’ | 같은 묶음 쌍 → 거절 없음 |
| S4 | 환전 USD 부족(명세 12.1 3a) | 선복 계약 없음 → ‘선복 계약 요금 예약’ 없음. 미지급 0 → ‘미지급’ 없음 |
| S5 | 환전 원화 부족(3b) | 원화 미지급 0 → ‘− 미지급’ 없음 |
| S6 | 환전 기록 ‘환전: … (게임용 고정 환율 …, 차감 …)’ | KRW→USD 기록에 1,287 없음, USD→KRW 기록에 1,313 없음 |
| S7 | 창고 확장 기록(명세 12.2) | 62일 이후 확장 → ‘다음 임차일’ 없음, ‘남은 임차일이 없어 증액분은 내지 않습니다’ |
| S8 | ‘창고 확장은 한 번만 …’ | 첫 확장 → 거절 없음 |
| S9 | 선복 계약 서명 기록(명세 9절, 편 수·합계) | ROUTE01 1일 서명 기록에 ‘12편’·‘360.00 USD’ 없음(11편·330.00 USD). 시험은 노선을 설정에서 고른다 |
| S10 | 규칙 2 미지급 기록 ‘… (14일 안에 갚지 못하면 경영 실패)’ | 규칙 1 시나리오 미지급 → 이 문장 없음(지금 문장 그대로). 규칙 2 → ‘유예기간은 아직 확정되지 않음’ 없음 |
| S11 | 지급 불이행 경고·위험 기록(명세 11.3) | 미지급 없는 날 → 없음. 나이 6 이하 → ‘위험’ 없음 |
| S12 | ‘경영 실패: …’, 거절 ‘캠페인이 끝났습니다(경영 실패).’ | 정상 완료(P0-M2A5-14 변형) → ‘경영 실패’ 없음, 거절은 ‘캠페인이 끝났습니다.’ |
| S13 | 규칙 2 `TASK_WILL_MISS_SAILING` ‘창고 처리 순서를 반영하면 …’ | 규칙 1 → 지금 문장 ‘지금 속도(하루 …pt)면 …’ 그대로. 규칙 2에서 놓치지 않는 업무 → 이 막힘 없음 |
| S14 | 규칙 2 자금 부족 문장의 ‘선복 계약 요금 예약’ | 선복 계약 없음 → 없음 |
| S15 | `exchangePreview.warningKo` | 환전 뒤 원화 ≥ 오늘 낼 돈 → null |
| S16 | `paymentDefaultStatus.recovery.heldSpendingKo` | 원화 미지급 0 → null |
| S17 | 규칙 2 계약 체결 기록 | 기록에 거래처 ID와 ‘을(를)’ 없음 |
| S18 | 새 시나리오 `contract_terms.notes_ko` | ‘각각 2pt’·‘50 USD 한 번’ 없음(로더가 읽은 `assumptionNotes`로 확인) |

### 13. 하루 순서(`commitDay`, 796~838행)

명세 13절 표대로. 규칙 2에서만 바뀐다.
- 3단계 배분, 4a 출항 화물은 창고에서 빠짐(상태로 계산되므로 따로 할 일 없음), 6c 고정비, 6e 단계·실패, 7단계 `offerDef`로 만료 → 다음 날이 공개일이면 `generateBatch` 결과를 `operations.batches`·`operations.offers`·`state.offers`에 넣음, 8단계 마감과 `outcome`.
- 같은 날 재마감은 아무것도 바꾸지 않는다(802~804행).

### 14. 읽기 함수

모두 상태를 바꾸지 않는다. 규칙 1은 지금 결과·칸 그대로다.
1. 장부 보고: 지시 4.
2. `marketTable`: 지시 5.
3. `quotePreview(state, config, offerIds, quantity?)`(명세 14.3). `affectedContracts`는 뺄 수 있음 2.
4. `payrollRunwayDay`(규칙 2 임차료 포함, 1일 56)와 `exchangePreview`(명세 14.4).
5. `warehouseSummary`(명세 14.5). `demand.recent`는 뺄 수 있음 3.
6. `hiringOutlook`(명세 14.6, 뺄 수 있음 1).
7. `paymentDefaultStatus`(명세 14.7).
8. `upcomingPayments`(명세 14.8). 정렬 번호 OVERDUE 0, RENT 1, SPACE_FEE 2, WAGE 3, FREIGHT 4, DUTY 5. 선복 요금 행은 `cashReservations` 고리 밖에서 만든다.

### 15. 저장 판본 6·모양·불변 조건

- `save.ts`: `SAVE_FORMAT_VERSION = 6`, 받는 판본 `[1, 2, 3, 4, 5, SAVE_FORMAT_VERSION]`, `migrateV5toV6`(`operations = null`, 입력을 바꾸지 않음), 이관 사슬(119~123행)에 이어 붙임. 시나리오 확인(114행)은 `ALL_SCENARIO_IDS`, `loadScenario`는 `AnyScenarioId`.
- `save-shape.ts`: `operations: nullable(obj({...}))` 전체 모양(생성 견적의 `OfferDef` 모든 칸 포함). `SAVE_ENUMS`에 `offerKind`(supplier·customer·forwarding), `serviceClass`(STANDARD·HANDLING), `marketSide`(BUY·SELL), `exchangeDirection`, `campaignOutcome`, `defaultLevel`(WARNING·DANGER). `satisfies Record<…, true>`로 형과 묶는다.
- `invariants.ts`: 명세 15절 1~10. 규칙 2에서만 본다. 10번(설정과 상태의 `operations` 유무)은 모든 시나리오에서 본다.

### 16. 자료 검사기(`tools/validate_data.py`)

- `expected_counts['scenarios']` 7 → 8(816행 근처). 다른 고정값은 그대로.
- 새 함수 `check_market_rules(documents, tables)`를 만들고 `main`에서 부른다. 실패 문구는 아래 그대로:
  - 시세표가 6행이 아니거나 (도시, 상품, 매입/판매) 중복 → `market_rules: 시세표는 6행이어야 함`
  - 템플릿 납기 < 노선 운송일 + 1 → `{id}: 납기가 운송일보다 짧음`
  - 템플릿 결제일 < 납기 → `{id}: 결제일이 납기보다 이름`
  - `draws` 등급 수 > 그 등급 틀 수 → `market_rules: {등급} 뽑기 수가 틀 수보다 많음`
  - 템플릿·거래 거래처 ID가 `counterparties`에 없음 → `{id}: 거래처 이름 없음 {counterparty_id}`
  - HANDLING 틀의 `prep_work_units`가 2 미만 정수가 아니거나 STANDARD 틀에 값이 있음 → `{id}: 준비량 칸 오류`
  - `PAR_PAYMENT_GRACE_DAYS`의 값과 `json_pointer`가 가리키는 값이 다름 → `PAR_PAYMENT_GRACE_DAYS: 시나리오 값과 다름`
  - `operations`가 있는 시나리오의 `engine_rules.rules_version`이 `M2a-rules-2`가 아님(상속 풀어서) → `{sid}: operations는 M2a-rules-2 필요`
- `tools/test_validate_data.py`: 새 클래스 `MarketRulesTest`. 현재 자료 오류 0건, 위 문구마다 사본을 고쳐 `assertIn`으로 정확한 문구 확인. 기존 74개 시험은 그대로 통과. 새 시험에 자료 ID 금지(템플릿·시나리오는 자료에서 고른다).

### 17. 인수 명세(`tests/acceptance_cases.json`)

- 명세 18절 P0-M2A5-01~17을 `P0-M2A-04` 형식으로 더한다: `id`, `phase: "P0"`, `milestone: "M2"`, `title`, `currency`, `evidence_class: "DESIGN"`, `scenario_id: "SCENARIO_M2_OPERATIONS"`, `actions`(명령을 기계가 읽을 수 있게 `day`·`commands` 칸을 함께 둔다), `expected_numeric`(명세의 숫자 전부), `expected_assertions`, `human_review_check`, `engine_test_ref`, `engine_test_names`.
  - 시험이 쓰는 값(견적 ID·직원 ID·노선·수량·날짜·금액)은 모두 이 항목에 둔다. 시험 소스에는 쓰지 않는다.
  - P0-M2A5-11의 시험용 설정(1일 묶음에 F5와 같은 견적 2건)은 항목의 `test_fixture` 칸에 적는다.
- `review_summary`: `case_count` 35, `phase_case_counts` `{"P0": 30, "P1": 4, "P2": 1}`, `engine_linked_case_count` 30, `added_cases_note` 끝에 `"; M2a-5 added P0-M2A5-01..17, total 35."`. `engine_test_pass_claim`은 `false` 그대로.
- 시험 연결 표(이름은 한 글자도 다르지 않게, 아래 ‘테스트’의 `describe` 제목):

| 사례 | `engine_test_ref` |
|---|---|
| 01·02·05·16 | `src/engine/m2a5-market.test.ts` |
| 03·04·10·11 | `src/engine/m2a5-warehouse.test.ts` |
| 06·07·08·09·14·15 | `src/engine/m2a5-money.test.ts` |
| 12·13 | `src/engine/m2a5-save.test.ts` |
| 17 | `src/engine/sim/m2a5-sim.test.ts` |

### 18. 비교 실행기(`src/engine/sim/**`)

1. **기본은 그대로:** `SIM_POLICIES`(5개)와 기본 `run`(`SCENARIO_IDS`)은 바꾸지 않는다. 규칙 1 시나리오에서 정책 동작·`appliedByType` 키(`sim.ts:31-33`)·지표 모양이 같아야 한다. 완료 조건 2의 바이트 비교가 확인한다.
2. **새 정책:** `NO_FX`, `LATE_OK`를 `EXTRA_POLICIES`로 두고 `policyById`는 두 목록을 함께 찾는다. 규칙 1 시나리오에서 둘은 `MAX_CONTRIBUTION`과 같게 움직인다.
3. **규칙 2 행동(`config.operations`가 있을 때만, 명세 17.3):** 하루 명령 순서 = 환전 → 투자 → 영입 → 다시 예약 → 대기 업무 배정(8.3 순서) → 견적 수락.
   - 환전: 명세 17.3 식. `IDLE`·`NO_FX`는 하지 않는다. 진단 `react`는 원화 미지급이 있을 때만 그날 필요한 만큼.
   - 수락: 직접 무역은 `openTradePairs`, 수량은 큰 것부터. `MAX_CONTRIBUTION`·`ON_TIME_FIRST`·`ASSET_LIGHT`·`NO_FX`는 정시 편만, `LATE_OK`는 감액 뒤 기여이익이 양수면 늦은 편도. 각 후보는 계획 상태에서 `projectPrepCompletion({ assignQueued: true, blocked })`으로 이 견적과 기존 예약 계약이 모두 예약 출항편 전에 끝날 때만 받는다. 빈 직원이 있으면 계획에 넣고, 없으면 출항편만 예약한다.
   - 다시 예약: 출항 불참한 계약은 예측 완료일 뒤 첫 편(정시 우선).
4. **명령 집계:** 규칙 2 실행의 `appliedByType` 키는 기존 6개 뒤에 `EXCHANGE_CURRENCY`, `EXPAND_WAREHOUSE`, `SIGN_SPACE_CONTRACT`, `SCOUT_SITE`, `START_RECRUIT_QUEST`, `HIRE_CANDIDATE` 순서로 고정한다. 규칙 1은 지금 6개.
5. **지표:** 규칙 2 실행에만 `metrics.operations`(명세 17.3 목록). 규칙 1 실행의 JSON에는 이 키가 없다(`undefined`로 두어 직렬화에서 빠짐).
6. **`d03` 명령:** `node src/engine/sim/run.mjs d03 [--seeds N] [--out PATH]`.
   - 시나리오: `OPERATIONS_SCENARIO_IDS` 전부. 정책 묶음: 기준(`IDLE`, `NO_FX`, `MAX_CONTRIBUTION`, `LATE_OK`, `MAX_CONTRIBUTION~fx:react`), 투자만(보통·적극 × S·E·SE·SE22), 고용(보통·적극 × 2pt·3pt × 8·29·30·31·50일 × none·S·E·SE·SE22), 진단(두 명 고용 2pt 22일 + 3pt 36일·SE), `scout:early`(2pt 30일·SE, 3pt 30일·SE, 2pt 30일·none; 뺄 수 있음 4).
   - 변형 이름 형식: `{정책}~inv:{none|S|E|SE|SE22}~hire:{2pt|3pt}@{일}[+…]~scout:early`. 후보는 처리량이 맞는 첫 후보(설정 순서)다. 소스에 직원 ID를 쓰지 않는다.
   - 영입: 시작 직원 가운데 설정 순서 마지막 사람이 H−3 조사(후보의 조사 장소), H−2 의뢰, 면담 가능해진 다음 날(보통 H) 고용. `blocked`로 그 사람을 H−3부터 비운다. 명령이 거절되면 다음 날 다시 한다. 실제 고용일을 지표에 남긴다.
   - 출력: `--out`에는 실행 전체(JSON, 기존 `SimOutput` 형식, `policyId`는 변형 이름). 표준 출력에는 명세 17.2와 같은 꼴의 마크다운 표: ① 기준 표 ② 투자만 ③ 고용 표(보통) ④ 고용 표(적극) ⑤ J1~J5 판정과 근거 수 ⑥ 시드별 1위 정책 분포와 가장 강한 정책 ⑦ 사업별 기여이익 비중 ⑧ 계획 고용일과 실제 고용일이 다른 실행 수. 칸 형식 `+1,234 (16) ↑`(USD 정수, 같은 수락·투자의 고용 없음 대비 중앙값, 이득 시드 수, ↑·↓ 표시는 명세 17.2 정의).
   - 비교 값은 USD 순자산이다. 통화를 합친 값은 어디에도 없다.
7. **소스 검사:** `sim.test.ts:169-182`(자료 ID·도시 이름·비결정 호출 금지)가 새 소스에도 통과해야 한다.

### 19. 기존 시험 허용 수정

명세 부록 B 표의 줄만 고친다. Claude 실험(판본 6 + `operations: null`)에서 정확히 이 14개 시험(5개 파일)이 실패했다.
- `save-v5.test.ts`: 52~53행 → `expect(load(currentFixture)).toEqual({ ...currentFixture.state, operations: null });`와 `expect(JSON.parse(serializeSave(load(currentFixture)))).toEqual({ ...currentFixture, formatVersion: SAVE_FORMAT_VERSION, state: { ...currentFixture.state, operations: null } });`. 69~71행 → `const { culture, operations, ...originalFields } = restored;` 뒤에 `expect(operations).toBeNull();`를 더한다. 122행 → `.toBe(SAVE_FORMAT_VERSION)`. 150행 → `it.each([0, 7, '5', 5.5])`. 12행 가져오기에 `SAVE_FORMAT_VERSION`.
- `m2a-growth.test.ts:333-334`, `m2a-recruit.test.ts:326-327` → `expect(SAVE_FORMAT_VERSION).toBe(6);`, `.toBe(SAVE_FORMAT_VERSION)`.
- `m2a-multi.test.ts:275` → `.toBe(SAVE_FORMAT_VERSION)`(13행 가져오기에 더함).
- `m2a-culture.test.ts:56` → `['0.5.0', 'M2a-rules-1', 6]`.
- `save-shape.test.ts`: 11~19행 `EnumTypes`와 26~37행 `targets`에 새 열거형 6개를 더한다. `base.operations`에 새 시나리오의 `createGame` 값을 넣고 각 목록에 원소 하나씩 넣어 경로를 만든다. 기존 줄은 지우거나 바꾸지 않는다.
- 이 밖의 기존 시험이 실패하면 고치지 말고 원인을 찾는다. 그래도 남으면 ‘질문’에 적는다.

### 20. D03 재측정 실행과 보고

- 모든 검증이 끝난 뒤 실행한다: `node src/engine/sim/run.mjs d03 --out /tmp/TASK-0027-d03.json > docs/ai/tasks/results/TASK-0027-d03.md`.
- 걸린 시간을 결과 보고에 적는다. 1시간을 넘을 것 같으면 먼저 `--seeds 5`로 돌려 시간을 재고, 20시드 전체를 돌린다. 20시드를 끝내지 못하면 몇 시드까지 했는지 적는다(통과로 쓰지 않는다).
- 결과 보고 ‘D03 재측정’ 절에 표 ①~⑧을 옮기고, J1~J5마다 통과·실패와 근거 수를 적는다. 명세 17.2의 모형 값과 다른 칸(부호가 다르거나 ↑·↓가 바뀐 칸)을 목록으로 적고, 원인 추정(정책 차이 등)을 한 줄씩 적는다.
- **값을 고치지 않는다.** 기준을 벗어나도 그대로 보고한다. 조정은 Claude가 한다.

## 테스트

새 시험 파일 다섯 개. `describe` 제목은 아래와 한 글자도 다르지 않게 쓴다(인수 명세 연결과 검사기의 역방향 검사가 이 제목을 본다). 각 `describe` 안의 `it` 제목은 자유지만 사례 ID를 넣지 않는다.

**`src/engine/m2a5-market.test.ts`**
- `P0-M2A5-01 결정적 견적 공개`: 명세 18-01 전부. 22개 난수 값(소수 6자리 반올림 비교), 지수·판매지·지역 요인·시세표·거래처 차이·단가·최대 물량·주선 틀 10건의 정의 전체(`toEqual`). 7일 마감 전 없음·뒤 있음. `state.rng.cursors` `{}`. 두 실행·저장 재개 실행의 묶음 1~11 같음. 처음부터 다시 계산한 값과 같음. 시드 1001과 다름. 78일 묶음 견적 ID 목록 전체(의류·화장품 매입·판매 4건 + 일반 주선 1건, 작업 포함 0건).
- `P0-M2A5-02 시세표·체결 가격 고정`
- `P0-M2A5-05 준비 업무량`(작업 포함 틀 수량을 절반으로 바꾼 시험용 설정도 12pt)
- `P0-M2A5-16 가격 수용자`
- `M2a-5 시장 생성 성질`: 모든 묶음 `drawCount` 22, 작업 포함 견적은 묶음 1~10에 각 4건, 생성 견적 ID 유일, 같은 입력의 `generateBatch`가 같은 결과, 입력 상태를 바꾸지 않음.

**`src/engine/m2a5-warehouse.test.ts`**
- `P0-M2A5-03 보관 한도`, `P0-M2A5-04 하루 처리 한도`, `P0-M2A5-10 창고 확장`, `P0-M2A5-11 선복 장기 계약`
- `M2a-5 처리 순서`: 계약 번호가 뒤인데 출항일이 이른 업무가 먼저 배분받는 시험용 상태. 예약 없는 업무는 납기 순.
- `M2a-5 준비 예측과 실제 진행`: 예측 완료일 = 실제 완료일(04 경로, 확장 변형, 3pt 직원 경로).

**`src/engine/m2a5-money.test.ts`**
- `P0-M2A5-06 임차료·고정비`, `P0-M2A5-07 환전·통화 간 이체`, `P0-M2A5-08 지급 순서`, `P0-M2A5-09 지급 불이행 단계·경영 실패`, `P0-M2A5-14 결산과 같은 시드 다시`, `P0-M2A5-15 통화 분리`
- `M2a-5 문장 반례`: 지시 12 표 S1~S18. 문장마다 `it` 하나.
- `M2a-5 통화별 항등식`: 환전·고정비가 있는 90일 실행의 마감마다 통화별 `자산 − 미지급 = 시작 + 손익 + 이체`.

**`src/engine/m2a5-save.test.ts`**
- `P0-M2A5-12 기존 기대값 보존`, `P0-M2A5-13 저장 판본 6과 재현`
- `M2a-5 불변 조건`: 명세 15절 항목마다 손상한 상태가 그 문구로 거절된다(보관 초과, 처리 초과, 미래 공개 견적, 환전 분개 짝 없음, 임차료 분개 중복, 실패 표시 불일치, 확장 2건, 규칙 1 상태에 `operations`).
- `M2a-5 규칙 1 불변`: 규칙 1 네 시나리오에서 `campaignSummary`의 칸 목록, `upcomingPayments` 결과, 미지급 기록 문장, 새 명령 거절 문장.

**`src/engine/sim/m2a5-sim.test.ts`**
- `P0-M2A5-17 비교 실행기`: 기본 `runSuite()`의 시나리오 목록이 `SCENARIO_IDS`와 같다. 새 시나리오 시드 1개로 `IDLE` 71일 실패, `NO_FX` 실패, `MAX_CONTRIBUTION` 완료·끝 원화 미지급 0·통화별 항등식(이체 포함), 규칙 2 `appliedByType` 키 목록 전체. `MAX_CONTRIBUTION`은 늦은 편을 예약하지 않고 `LATE_OK`는 한다(같은 시드에서 늦은 인도 1건 이상이 있는 시드를 찾아 확인). 같은 입력 두 번이면 같은 출력. `d03`을 `--seeds 1`로 돌리면 표 ①~⑧ 제목이 있다. 변형 이름의 고용 후보가 처리량으로 정해진다(이름 바꾸기 설정에서도 같은 지표).

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 할 이유가 있으면 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 명세와 지금 코드가 다르면 | 코드가 사실이다. 명세의 뜻을 지키는 가장 작은 변경을 하고 ‘설계 판단’에 적는다. 명세 파일은 고치지 않는다 |
| 지급 순서를 엄격하게(앞 의무를 못 갚으면 멈춤) | 하지 않는다. 지금 건너뛰기 규칙이다(명세 C10). 08 사례 숫자가 이 규칙의 결과다 |
| 선복 요금을 남은 전액 예약 | 하지 않는다. 8일 창(명세 9절). 전액 예약은 모형에서 고용 이득 조건을 지웠다 |
| 자료 판본 0.5.0을 올릴까 | 올리지 않는다(명세 C19). |
| 새 시나리오를 화면 목록에 넣을까 | 넣지 않는다. `SCENARIO_IDS` 그대로 |
| 화면 타입 검사가 깨지면 | 화면을 고치지 않는다. 엔진 쪽 형을 나눠(명세 5.5) 해결한다. 끝내 안 되면 실패 출력과 함께 ‘질문’ |
| `BlockerCode`에 `WAREHOUSE_WAIT` | 더하지 않는다. `warehouseSummary.handling.waits`와 `projectPrepCompletion`이 정보를 준다 |
| `Command`에 새 명령을 넣을까 | 넣지 않는다. `OperationsCommand`·`EngineCommand`로 둔다 |
| 기존 `tradePreview`·`tradePairs` 서명을 상태 받게 바꿀까 | 바꾸지 않는다. 새 함수(`quotePreview`, `openTradePairs`) |
| `cashReservations`에 선복 요금 넣기 | 넣지 않는다. `commitmentReservations` + `fundsPosition.reservedCommitments` |
| 늦은 인도 감액 200 USD | 새 시나리오 자료값이다(사용자 확인 대기, 명세 Q10). 엔진은 자료값을 읽기만 한다(1000행). 바꿀 코드 없음 |
| D03 표가 기준(J1~J5)을 벗어나면 | 값을 고치지 않고 그대로 보고한다 |
| 재측정 시간이 너무 길면 | 정책 묶음을 줄이지 말고 시드 수를 적어 보고한다. 성능 개선(계획 상태 복제 줄이기 등)은 결과가 같을 때만 한다 |
| 직원 후보를 ID로 고르고 싶을 때 | 고르지 않는다. 처리량이 맞는 첫 후보(설정 순서) |
| 규칙 2에서 1일 묶음 주선 준비량 | 일반 주선 부피 규칙(가구 4pt, 명세 C05). 규칙 1은 2pt 그대로 |
| 작업 포함 견적 경험치 | 지금처럼 업무 1건당 10(명세 7절) |
| `operations`를 `undefined`로 둘까 null로 둘까 | 상태·설정 모두 null. 비교 실행기 지표만 `undefined`(직렬화에서 빠짐) |
| 실패 마감 뒤 `state.day` | 실패일 + 1(정상 마감과 같음) |
| 90일 마감에 나이 14 미만 미지급 | `COMPLETED` + `arrearsAtEnd`(이름은 명세 Q11) |
| 계약 기록에 거래처 이름이 자료에 없을 때 | 로더가 오류를 낸다(지시 3 검사) |
| 첫 화면 크기 한도를 넘으면 | 한도·빌드 설정·자료를 줄이지 않는다. 수치를 ‘질문’에 적고 멈춘다 |
| 부록 B 밖 기존 시험이 깨지면 | 고치지 않고 원인을 찾는다. 남으면 ‘질문’ |
| 시험 이름에 ‘판본 5’가 남아 낡을 때 | 이름은 바꾸지 않는다. ‘범위 밖 발견’에 적는다 |
| 인수 명세의 `actions`를 문장만 둘까 | 문장 + 기계가 읽는 `day`·`commands`. 시험은 `commands`를 그대로 실행한다 |
| 새 시험이 느릴 때(90일 실행 반복) | 실행 결과를 파일 안에서 한 번만 만들어 재사용한다. 비교 실행기 시험은 시드 1개만 |
| 모형(`docs/ai/design/m2a5-model/`)을 돌려야 하나 | 돌리지 않아도 된다. 결과 비교는 명세 17.2 표와 한다 |

## 완료 조건

1. 구현 지시 0~20이 반영되었다(뺀 항목은 ‘미충족(시간)’).
2. **검증**
   - 순서: 결과 보고 두 파일을 먼저 끝까지 쓴다. 그다음 `python3 tools/build_package.py --manifest-only`. 그 뒤에 보고를 고치면 생성 명령과 아래 검사를 다시 돌린다.
   - `bash tools/ai/review_checks.sh <BASE>` → `검사 13종, 실패 0종 (모드: 수정)`.
   - `bash tools/ai/review_checks.sh --check <BASE>` → `검사 14종, 실패 0종 (모드: 확인)`(Claude 확인: `c896c8a`에서 14종 통과).
   - vitest: 시작 33개 파일·1000개 통과·할 일 1에서 새 파일 5개와 새 시험만 늘었다. 시작 시험은 모두 통과(부록 B의 14개는 고친 뒤 통과).
   - `python3 tools/test_validate_data.py`: 기존 74개 + 새 시험 통과.
   - `python3 tools/validate_data.py` 첫 줄이 `PASS: 24 data documents; …`.
   - **회귀:** `node src/engine/sim/run.mjs run --out /tmp/TASK-0027-sim-after.json` 뒤 `node src/engine/sim/run.mjs compare /tmp/TASK-0027-sim-before.json /tmp/TASK-0027-sim-after.json` → 종료 0, 첫 줄 `비교 결과: 같음 (실행 400회, 지표 차이 0건)`. 이어서 `cmp /tmp/TASK-0027-sim-before.json /tmp/TASK-0027-sim-after.json`이 종료 0(바이트 같음).
   - `docs/ai/tasks/results/TASK-0027-d03.md`가 있고 20시드 표다(지시 20).
3. **바꾼 범위**
   - `git diff --stat <BASE> -- src/ui src/assets index.html vite.config.ts package.json package-lock.json references public`의 출력이 없다.
   - `git diff --name-only <BASE>`와 새 파일이 ‘고칠 수 있는 파일’ 안에 있다(지시서 커밋 파일 제외).
   - 기존 시험 파일 변경이 부록 B뿐이다. 다음이 `OK`를 찍는다:
     ```
     python3 - <<'EOF'
     import subprocess
     allowed = {'src/engine/save-v5.test.ts', 'src/engine/m2a-growth.test.ts', 'src/engine/m2a-recruit.test.ts',
                'src/engine/m2a-multi.test.ts', 'src/engine/m2a-culture.test.ts', 'src/engine/save-shape.test.ts'}
     changed = subprocess.check_output(['git', 'diff', '--name-only', '--diff-filter=M', '<BASE>', '--', 'src', 'tools/test_validate_data.py'], text=True).split()
     tests = {p for p in changed if p.endswith('.test.ts')}
     assert tests <= allowed, sorted(tests - allowed)
     for p in ('src/engine/m2a-growth.test.ts', 'src/engine/m2a-recruit.test.ts', 'src/engine/m2a-multi.test.ts', 'src/engine/m2a-culture.test.ts'):
         diff = subprocess.check_output(['git', 'diff', '-U0', '<BASE>', '--', p], text=True)
         removed = [l for l in diff.splitlines() if l.startswith('-') and not l.startswith('---')]
         assert len(removed) <= 3, (p, removed)
     print('OK')
     EOF
     ```
   - 새 시험 줄에 자료 ID가 없다. 다음이 `0`을 찍는다:
     ```
     python3 - <<'EOF'
     import json, re, subprocess
     from pathlib import Path
     ids = set()
     def walk(o):
         if isinstance(o, dict):
             for k in ('id', 'city_id', 'good_id', 'counterparty_id', 'route_id'):
                 if isinstance(o.get(k), str): ids.add(o[k])
             for v in o.values(): walk(v)
         elif isinstance(o, list):
             for v in o: walk(v)
     for f in Path('data').glob('*.json'):
         if f.stem != 'sources': walk(json.loads(f.read_text(encoding='utf-8')))
     ids = {i for i in ids if i != i.lower() and len(i) > 2}
     new = ['src/engine/m2a5-market.test.ts', 'src/engine/m2a5-warehouse.test.ts', 'src/engine/m2a5-money.test.ts',
            'src/engine/m2a5-save.test.ts', 'src/engine/sim/m2a5-sim.test.ts']
     lines = [l for p in new for l in Path(p).read_text(encoding='utf-8').splitlines()]
     diff = subprocess.check_output(['git', 'diff', '<BASE>', '--', 'tools/test_validate_data.py'], text=True)
     lines += [l[1:] for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++')]
     hits = sorted({(i, l.strip()) for l in lines for i in ids
                    if re.search(r'(?<![A-Za-z0-9_])' + re.escape(i) + r'(?![A-Za-z0-9_])', l)})
     generated = sorted({('생성 견적 ID', l.strip()) for l in lines if re.search(r'MKT-D\d{3}', l)})
     print(len(hits) + len(generated)); [print(h) for h in hits + generated]
     EOF
     ```
     (`<BASE>`는 실제 해시로 바꿔 실행한다. 템플릿 ID `F1`·`H1` 같은 두 글자 ID는 길이 조건으로 빠지지만 규칙은 같다: 틀·생성 견적 ID는 설정이나 인수 명세 항목에서 읽는다.)
   - 새 시험에 일부 단언이 없다: `grep -nE "toMatchObject|objectContaining|arrayContaining" src/engine/m2a5-*.test.ts src/engine/sim/m2a5-sim.test.ts`의 출력이 없다.
4. **변형 시험.** 시작 전에 바꿀 파일마다 `/tmp/TASK-0027-<파일 이름>.orig` 사본을 둔다. 아래를 하나씩 편집기로 넣고 해당 시험을 `npx vitest run <파일> -t '<describe 제목>'`으로 돌려 실패를 확인한 뒤 편집기로 되돌린다. 끝나면 사본과 `cmp`가 종료 0인지 보고에 적는다. git으로 되돌리지 않는다.

   | 변형 | 실패해야 하는 시험(`describe`) |
   |---|---|
   | 시장 생성이 `state.rng`의 커서를 쓴다 | `P0-M2A5-01 결정적 견적 공개` |
   | 나눠 뽑기 대신 12개 틀 한 풀에서 6개 | `P0-M2A5-01 결정적 견적 공개` |
   | 지역 요인을 판매지보다 먼저 뽑음 | `P0-M2A5-01 결정적 견적 공개` |
   | 묶음을 b−1일 마감 대신 b일 열기에서 공개 | `P0-M2A5-01 결정적 견적 공개` |
   | 90일을 넘는 견적도 만듦 | `P0-M2A5-01 결정적 견적 공개` |
   | 수량 상한 검사 제거 | `M2a-5 문장 반례`(S2) |
   | 작업 포함 준비량을 부피로 계산 | `P0-M2A5-05 준비 업무량` |
   | 보관 검사 제거 | `P0-M2A5-03 보관 한도` |
   | 확장 효력을 명령한 날부터 | `P0-M2A5-10 창고 확장` |
   | 확장 뒤 임차료를 450,000원 그대로 | `P0-M2A5-10 창고 확장` |
   | 처리 배분을 계약 번호 순서만으로 | `M2a-5 처리 순서` |
   | `projectPrepCompletion`이 창고 한도를 무시 | `M2a-5 준비 예측과 실제 진행` |
   | 선복 요금 예약 제거 | `P0-M2A5-11 선복 장기 계약` |
   | 예약 창을 남은 요금 전부로 | `P0-M2A5-11 선복 장기 계약` |
   | 캠페인 뒤 도착하는 편에도 요금 | `P0-M2A5-11 선복 장기 계약` |
   | 환전 차감을 USD 분개에 | `P0-M2A5-07 환전·통화 간 이체` |
   | `currencyTransferNet`을 `BookSummary`에서 뺌 | `M2a-5 통화별 항등식` |
   | 밀린 지급을 앞에서 멈추는 엄격 규칙으로 | `P0-M2A5-08 지급 순서` |
   | 실패 나이 `≥ 14`를 `> 14`로 | `P0-M2A5-09 지급 불이행 단계·경영 실패` |
   | 실패한 날에도 7단계(다음 묶음 공개) 실행 | `P0-M2A5-09 지급 불이행 단계·경영 실패` |
   | `restartWithSameSeed`가 시드 + 1 | `P0-M2A5-14 결산과 같은 시드 다시` |
   | 정상 완료에도 ‘경영 실패’ 거절 문장 | `M2a-5 문장 반례`(S12) |
   | 규칙 1 미지급 문장을 규칙 2 문장으로 통일 | `M2a-5 규칙 1 불변` |
   | `migrateV5toV6` 호출 제거 | `P0-M2A5-13 저장 판본 6과 재현` |
   | 불변 조건 1(보관 한도) 제거 | `M2a-5 불변 조건` |
   | 규칙 2 판단을 `config.id`로(능력 대신) | `sim.test.ts`의 ‘8 소스 검사’ 또는 `P0-M2A5-17 비교 실행기`(이름 바꾸기) |
   | 규칙 2 `MAX_CONTRIBUTION`의 정시 거르기 제거 | `P0-M2A5-17 비교 실행기` |
   | 기본 `runSuite` 시나리오에 새 시나리오를 넣음 | `P0-M2A5-17 비교 실행기` |
   | 환전 정책 제거(규칙 2 `MAX_CONTRIBUTION`) | `P0-M2A5-17 비교 실행기` |
   | 검사기: 시세표 6행 검사 제거 | `MarketRulesTest`의 해당 시험 |
   | 검사기: 거래처 이름 검사 제거 | `MarketRulesTest`의 해당 시험 |
   | 검사기: `PAR_PAYMENT_GRACE_DAYS` 대조 제거 | `MarketRulesTest`의 해당 시험 |

   - 뺀 항목(시간)의 변형은 ‘뺌’으로 적는다.
5. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0027.md`에 공통 머리말 형식(`docs/ai/tasks/CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서·명세에 없던 결정과 이유. 명세와 코드가 달랐던 곳.
- **실행한 검증과 결과:** 명령별 통과·실패와 개수. 0절 시작 값과 끝 값(자료 문서·검사 수, 파이썬 시험 수, vitest 파일·시험 수, 첫 화면 크기·gzip).
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **허용 시험 수정 목록:** 파일·행·바꾼 내용(부록 B 표와 대조).
- **문장 반례 표:** S1~S18마다 시험 이름과 반례 상태.
- **변형 시험 표**
- **D03 재측정:** 표 ①~⑧(또는 `TASK-0027-d03.md` 연결), J1~J5 판정, 명세 17.2와 다른 칸 목록과 원인 추정, 걸린 시간, 시드 수.
- **범위 밖 발견:** 고치지 않은 문제. 최소한:
  - 화면이 새 지급 종류(`RENT`·`SPACE_FEE`)를 관세로 적는 곳(`src/ui/main.ts:693-694`, `src/ui/schedule.ts:85`).
  - 원화 보고 주석 ‘가상 환율 1,300원/달러는 보고에 쓰지 않습니다’(`src/ui/reports.ts:22-23`)와 결산 행(`src/ui/reports.ts:133-142`)에 통화 간 이체 행이 없음.
  - 이름에 ‘판본 5’가 남은 시험.
  - 그 밖에 새로 찾은 것.
- **질문:** 기본값으로 처리했지만 Claude 확인이 필요한 것. 없으면 ‘없음’. 최소한 첫 화면 크기 변화(넘지 않았어도 수치)와 재측정 시간.

브라우저 확인은 필요 없다(화면 변경 없음).
