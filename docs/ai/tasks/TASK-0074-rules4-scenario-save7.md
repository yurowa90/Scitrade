# TASK-0074 rules-4 시나리오 하나, 저장 형식 7, 놓친 견적 칸(경로 11 ②-a)

- **지위: 개정 1(세션 A, 2026-10-31). 허브 재확인 전이다.**
  - 초안(`d8cb0a9`)은 허브 사전 검수 `docs/ai/tasks/PRECHECK-0074-HUB-2026-10-31.md`(`69f5e71`, 중대 12·경미 8)를 받았다.
  - 허브 답 H35-1~H35-4를 본문 확정 문장으로 옮겼다. 처리는 끝의 ‘개정 1 처리표’에 있다.
- 근거
  - `docs/DECISIONS.md` 2026-10-31 사용자 결정 1·7
  - 허브 결정 H34-1~H34-4, H35-1~H35-4(`docs/ai/design/path3-price-risk-2026-10/HUB-DECISIONS-2026-10-16.md`)
  - 사전 검수의 허브 결정(목록 분리, 예산 탐침 셋)
  - 범위 문서 `docs/ai/design/path11-engine-seam-2026-10/SCOPE.md` 1.6 (나), 1.9, 3.1
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **확정 사항(H35)**
  1. 형식 7을 모든 시나리오에 쓴다. 형식 1~6은 모두 명시 문구로 거절한다.
  2. 새 시나리오는 시나리오 select와 첫 화면 제목 계산에 넣지 않는다.
  3. 이관 함수 `migrateV1toV2`~`migrateV5toV6`와 그 export를 지운다.
  4. 저장 메타에 위험 층 지문을 넣지 않는다.
- 범위 밖
  - 읽기 함수(TASK-0075)
  - rules-4 화면(Sol 지시서)
  - 형식 6 → 7 이관
  - `package_version`·`data_version` 올리기
  - 측정(판정표 시드 1061~1300으로 새로 돌리는 것)
  - 새 저장 픽스처 파일 만들기
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 둘이다.
  1. 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다.
  2. 10절 3의 판본 2 SHA256SUMS 재현은 판본 2 측정 시드 1061~1100의 R1·R2를 다시 돌린다. sha256만 비교하고 표 내용은 읽지 않는다.
  - 기존 시험이 이미 쓰는 시드(예: 42032026)는 그 시험 안에서 그대로 둔다.

## 0. 먼저 읽을 것

줄 번호는 개정 시점(`40d38ec`)의 값이다. 다르면 이름으로 찾는다.

1. 저장
   - `src/engine/save.ts`
     - `:1-5`: 머리 주석 ‘이전 판본은 명시한 이관 함수로만 읽는다’
     - `:20` `SAVE_FORMAT_VERSION = 6`
     - `:47-93` 이관 함수
     - `:95-140` `deserializeSave`: 판본 문 `:103`, 규칙 판본 `:106-111`, 부산 판 `:113-115`, 시나리오 목록 `:120`, 이관 사슬 `:125-130`
   - `src/engine/save-shape.ts`
2. 시나리오
   - `src/content/scenario.ts:37-47`(ID 목록), `:136-141`(`base_scenario_id` 상속), `:257-`(`loadScenario`, `:265` 검사), `:389`(`baseScenarioId`)
3. rules-4 설정 변환: `src/engine/risk.ts:197-251`(`withRiskLevel`, `withRiskLevelV2`), `src/engine/sim/risk-metrics.ts:13-15`(`simConfigV2`)
4. 자료와 검사기
   - `data/scenarios.json:736-`(`SCENARIO_M2_OPS_COS_LAVER`)
   - `tools/validate_data.py:22-23, 109-`, `:559`(acceptance `engine_test_names` 연결 검사)
   - `tools/test_validate_data.py`
   - `tests/acceptance_cases.json` `P0-M2A5-13`(제목 ‘저장 판본 6과 재현’, `save_version: 6`, `legacy_continue_days: 10`, `legacy_fixture: "save-v5-m2.json"`)
5. 인수 판정: `engine.ts:271-288` `fundsShortfall`, `:355-395` `ACCEPT_TRADE` 검사(규칙 갈래 셋: `IMMEDIATE_CASH`, 같은 통화, 다른 통화)
6. 짝 목록: `market.ts:87` `openTradePairs`, `reports.ts:192` `tradePairs`
7. 화면 진입
   - `src/ui/main.ts:41-43`(`LEGACY_SAVE_KEY` 주석, `SCENARIO_TITLES`), `:411`(select), `:1504-1512`(`case 'load'`, `getItem(SAVE_KEY) ?? getItem(LEGACY_SAVE_KEY)`), `:1600-1615`(`loadText`)
   - `src/ui/session.ts:27-39`(`loadSaveText`)
8. sim 금지어 시험: `src/engine/sim/m2a5-sim.test.ts:233`(`ALL_SCENARIO_IDS`의 자료 ID를 금지어로 쓴다)

## 1. 지켜야 할 것

1. **rules-1~3은 게임 결과가 바이트로 그대로다.** 골든 둘, 400회 `cmp`, 판본 2 SHA256SUMS 다섯 개(10절)로 확인한다. 골든은 meta를 뺀 상태를 해시하므로 판본 숫자의 영향을 받지 않는다.
2. **`operations.unaffordable`은 `meta.rulesVersion === 'M2a-rules-4'`인 상태에만 키가 있다.** 다른 판본에서는 키 자체가 없다.
3. **놓친 견적 기록은 다른 상태를 바꾸지 않고, 결정에 쓰이지 않는다**(4절 3·8).
4. **판정 공유**: 놓친 견적 기록과 인수 경로는 같은 자금 계산 함수 하나를 쓴다(3.3).
5. **화면 바이트**: `code-split.test.ts`의 `BASE_HTML` 세 sha256은 그대로다. `ALL_SCENARIO_IDS`는 바꾸지 않는다(3.1).
6. **고칠 수 있는 파일은 2절의 목록뿐이다.** 기존 시험은 2.5의 규칙으로만 고친다.

## 2. 고칠 수 있는 파일과 범위

| 파일 | 허용하는 변경 |
|---|---|
| `src/engine/save.ts` | 판본 상수 7, 판본 문(3.4), 이관 함수와 export 삭제, 머리 주석(`:1-5`)을 ‘형식 7만 읽고 옛 형식은 명시 문구로 거절’로 고침, `:120`이 `LOADABLE_SCENARIO_IDS`를 씀 |
| `src/engine/save-shape.ts` | `unaffordable` 모양·키 유무 검사 |
| `src/engine/operations-invariants.ts` | `unaffordable` 불변식 |
| `src/engine/types.ts` | `UnaffordableRecord` 형, `operations` 형에 선택 칸 |
| `src/engine/engine.ts` | `createGame` 초기화(rules-4만), `openDay` 끝의 기록 호출, 자금 판정 함수 추출(3.3). 그 밖의 함수 몸은 바꾸지 않는다 |
| 새 파일 `src/engine/unaffordable.ts`(이름은 바꿀 수 있음) | 기록 함수 |
| `src/content/scenario.ts` | `LOADABLE_SCENARIO_IDS`, `risk_setup` 적용, 로더 형 |
| `src/ui/session.ts` | `:31`이 `LOADABLE_SCENARIO_IDS`를 씀 |
| `src/ui/main.ts` | `:41` 주석 고침만 |
| `data/scenarios.json` | 새 항목 하나 |
| `tools/validate_data.py`, `tools/test_validate_data.py` | `risk_setup` 검사와 음성 시험 셋 |
| `tests/acceptance_cases.json` | `P0-M2A5-13`만(2.5 표) |
| 기존 시험 파일 | 2.5 표의 줄만 |
| 새 시험 파일 | 4절 |
| `docs/ai/tasks/results/TASK-0074.md`, `MANIFEST.json` | 결과 보고, 생성 명령 갱신 |

그 밖의 파일은 고치지 않는다. 필요하면 멈추고 보고한다.

## 3. 구현

### 3.1 시나리오 등록과 목록 분리(사전 검수 허브 결정)

- 새 ID는 `SCENARIO_M2_OPS_CREDIT`이다.
- `data/scenarios.json`에 새 항목을 더한다.
  - `base_scenario_id: "SCENARIO_M2_OPS_COS_LAVER"`
  - `risk_setup: { "level": "R4", "profile_id": "RISK_PROFILE_V2" }`
  - `title_ko`는 임시 문구 `외상 거래: 화장품 + 조미김 — 평택 본사 90일 운영`이다.
  - `scope_note`: ‘경로 11 rules-4 놀이 시나리오. 화면 지시서 전까지 학생 선택 목록에 넣지 않는다.’
  - 다른 칸은 상속한다. `data_version`은 그대로다.
- 로더: 상속 결과에 `risk_setup`이 있으면 `:265` 검사를 지난 뒤 `withRiskLevelV2(config, level, loadRiskProfile(id), loadCreditProfile(id))`를 적용한다. `risk_setup`이 없는 시나리오의 로더 출력은 바이트로 그대로다.
- **목록**
  - `ALL_SCENARIO_IDS`, `OPERATIONS_SCENARIO_IDS`, `EXPERIMENT_SCENARIO_IDS`는 **바꾸지 않는다.**
  - `scenario.ts`에 `LOADABLE_SCENARIO_IDS = [...ALL_SCENARIO_IDS, 'SCENARIO_M2_OPS_CREDIT'] as const`를 둔다.
  - 이 목록을 쓰는 곳은 `save.ts:120`과 `session.ts:31` 둘뿐이다.
  - `loadScenario`의 인자 형은 새 ID를 받도록 넓힌다.
  - 그래서 `main.ts:43`·`:411`, BASE_HTML 세 sha, `m2a5-sim.test.ts:233`은 그대로다.
- **같음 시험**: `loadScenario('SCENARIO_M2_OPS_CREDIT')`과 `simConfigV2(loadScenario('SCENARIO_M2_OPS_COS_LAVER'), 'R4', 'RISK_PROFILE_V2')`를 비교한다.
  - 다를 수 있는 칸은 `id`, `titleKo`, `baseScenarioId` **셋뿐이다**(닫힌 목록).
  - 이 셋을 지운 사본끼리 `toStrictEqual`로 비교한다.
- 검사기 `validate_data.py`: `risk_setup`이 있으면 다음 셋을 검사한다.
  - `level`은 `R4`만
  - `profile_id`는 `risk_profiles`에 있고 외상 칸이 모두 있다
  - `base_scenario_id`는 `EXPERIMENT_SCENARIO_IDS` 안에 있다
- `test_validate_data.py`에 음성 사례 셋을 더한다: `level: "R3"`, 없는 `profile_id`, 실험이 아닌 base(`SCENARIO_M2_OPERATIONS`).

### 3.2 새 칸 `operations.unaffordable`

- 형: `UnaffordableRecord[]`
  - 행 하나: `{ day, buyOfferId, sellOfferId, quantity, shortfalls: { currency, needMinor, availableMinor }[] }`
  - `shortfalls`는 부족이 있는 통화만, `Currency` 정렬 순서로 담는다.
- **기록 시점**: `openDay`의 끝, `s.phase = 'AWAITING_INPUT'` 바로 앞(`engine.ts:159`)이다.
  - `openDay`는 `PENDING_OPEN`일 때만 몸을 돈다(`:132`). 그래서 기록은 하루 한 번이다.
- **대상 짝(닫힌 정의)**: `openTradePairs(s, config)` 가운데 매입 견적의 `publishDay === s.day`인 짝이다.
  - 기존 함수를 재사용하므로 품목이 다르거나 노선이 없는 짝은 섞이지 않는다.
  - 유효기간 안이라도 공개일이 지난 짝은 대상이 아니다.
- **기록 조건**: 수량을 매입 견적의 `quantityStep`(최소 수량)으로 두고 3.3의 판정 함수를 부른다. 자금이 모자란 통화가 하나라도 있으면 기록한다.
  - 수량·창고·외상 한도·노선 사유는 기록하지 않는다.
- 행 순서는 `(buyOfferId, sellOfferId)` 사전순이다.
- `createGame`: `meta.rulesVersion === 'M2a-rules-4'`이면 `operations.unaffordable = []`, 아니면 키를 두지 않는다.
- 저장 모양
  - rules-4 상태: 키 필수, 모양 검사
  - 다른 판본: 키가 있으면 거절
- 불변식: 날짜 오름차순, `day ≤ s.day`, 같은 날 같은 짝 중복 없음.

### 3.3 자금 판정 함수(사전 검수 C9 반영)

- `engine.ts`의 인수 자금 판정(`:366-394`)을 순수 함수 하나로 뽑는다. 이름 예: `tradeFundsCheck(s, config, buy, sell, quantity)`.
- 반환값

  ```
  { rule: 'IMMEDIATE_CASH' | 'SAME_CURRENCY' | 'SPLIT_CURRENCY',
    needs: { currency, needMinor, availableMinor, position: FundsPosition | null,
             parts: { purchaseMinor?, feeMinor?, dutyMinor? } }[] }
  ```

  - `IMMEDIATE_CASH`에서 `availableMinor`는 지금처럼 현금이다. `position`은 `null`이다.
- 인수 경로는 이 값만으로 **지금과 바이트 같은 문구**를 만든다.
  - `fundsShortfall`의 성분: 현금, 다른 계약 예약, 선복 계약 요금 예약, 미지급
  - `매입 … + 운임 … + 관세 …` 내역
  - `IMMEDIATE_CASH` 문구
  - 인수 경로가 `fundsPosition`이나 `dutyFor`를 다시 부르지 않는다.
- 놓친 견적 기록은 같은 반환값에서 `{ currency, needMinor, availableMinor }` 세 값만 `shortfalls`로 옮긴다.
- 관세는 지금처럼 `dutyFor(…)`를 부른다. 추첨 커서를 움직이지 않는지는 4절 3이 확인한다.

### 3.4 판본 문

`deserializeSave`는 다음 순서로 거른다.

1. JSON 오류, `format` 불일치: 기존 문구
2. **부산 판(`dataVersion` 0.4.x)**: 기존 부산 문구. 판본 문보다 앞에 둔다.
3. **`formatVersion`이 정수 1~6**: 새 고정 문구로 거절한다.
   - 문구는 `이전 저장 형식(판본 ${n})의 저장입니다. 이번 판(판본 7)에서는 열 수 없습니다. 새로 시작해 주세요.`이다.
   - 상수 하나에 둔다.
   - **규칙 판본·데이터 판본·시나리오·상태 모양 검사보다 앞이다.**
4. `formatVersion !== 7`: 기존 문구 `지원하지 않는 저장 형식 판본입니다 (${n}).`
5. 그 뒤는 지금 순서 그대로다(규칙 판본, 데이터 판본, 상태, 시나리오, 모양, 메타, 불변식). 이관 사슬 자리는 지운다.

## 4. 시험

### 4.1 첫 일: 형식 6 왕복 확인(고치기 전, 일회)

- BASE에서 `simConfigV2(loadScenario('SCENARIO_M2_OPS_COS_LAVER'), 'R4', 'RISK_PROFILE_V2')`로 시드 2001~2003을 끝까지 돌린다.
- 날마다 상태에 `serializeSave` → `deserializeSave(…, { config })` → `serializeSave`를 하고 바이트가 같은지 본다.
- 실패하면 멈춘다. 결과는 결과 보고 ‘왕복 확인’에 적는다.

### 4.2 새 시험(2001 이상 시드)

1. **왕복과 다시 열기**
   - 새 시나리오 시드 2001~2003의 날마다 상태에서 직렬화 왕복이 바이트 동일하고 `formatVersion`이 7인지 본다.
   - 같은 저장을 `loadSaveText`로 연다(안에서 `openDay`가 다시 불린다). 연 상태의 `unaffordable`이 원래 상태와 같아야 한다(C16).
2. **손 계산 사례**(H34-4)
   - 새 시나리오 시드 2001의 첫 공개일 상태에서 `maxQuantity ≥ 2 × quantityStep`인 짝을 고르고, 그 조건을 단언한다.
   - 원화 현금을 장부 분개로 줄인 사본을 만들어, 그 짝의 `quantityStep` 매입액보다 원화 가용액이 작게 한다.
   - 기대 `needMinor`·`availableMinor`는 자료 값으로 손 계산한 리터럴이다: BUY 단가 × `quantityStep`, 시작 자금 − 줄인 액수 − 예약.
   - 계산 한 줄을 주석에 적는다. 엔진 출력에서 베끼지 않는다.
3. **순수성**
   - 기록 함수 전후로 `unaffordable` 밖의 모든 칸(추첨 커서 포함)이 `structuredClone` 비교로 같아야 한다.
   - 얼린 상태 사본으로 불러도 예외가 없어야 한다.
4. **판정 일치**
   - 새 시나리오 시드 2001~2010을 기존 sim 정책 하나로 끝까지 돌린다.
   - 날마다 **3.2의 대상 짝**에 대해, 그날 시작 상태 사본에서 `quantityStep`으로 `ACCEPT_TRADE`를 보낸다.
     - 기록된 짝: 자금 사유로 `REJECTED`
     - 기록되지 않은 짝: 자금 사유가 아님
   - 기록 행 수 ≥ 1을 단언한다.
   - **창고 사유 사례**: 창고를 채운 사본을 손으로 만들어, 자금은 되고 창고만 모자란 짝을 둔다. 그 짝이 기록되지 않음을 단언한다(V9 판별).
5. **키 유무**: rules-1·2·3 상태에는 키가 없다. rules-4 상태에는 키가 있다. 저장 모양이 키를 더하거나 뺀 사본을 거절한다.
6. **같음**: 3.1의 설정 같음 시험(예외 칸 셋).
7. **거절 경로**(H34-2)
   - (가) 엔진: 같은 내용의 형식 1~6 사본 여섯이 새 문구로 거절된다. 8, `"7"`, 6.5는 ‘지원하지 않는’ 문구다. 부산 판 사본은 부산 문구가 우선이다.
   - (나) **순서 고정(C5)**: 형식 6이면서 다음처럼 깨진 사본도 새 문구로 거절된다.
     - `state.offers = [null]`
     - `state.day` 없음
     - 다른 `dataVersion`
     - 다른 `rulesVersion`
     - 엔진(`deserializeSave`)과 `loadSaveText` 둘 다 본다.
   - (다) 화면 파일 불러오기(`loadText`): 문구가 알림 띠에 나오고 상태·오늘 할 일·select가 보존된다.
   - (라) 화면 브라우저 저장(C6), 두 사례로 나눈다.
     - `SAVE_KEY`만 채움
     - `SAVE_KEY`는 비우고 `LEGACY_SAVE_KEY`만 채움
     - 둘 다 (다)와 같은 결과다.
8. **원천 검사(C20)**
   - 대상: `src/engine/**/*.ts`(시험 제외)
   - 문자열 `unaffordable`이 나와도 되는 곳은 닫힌 목록이다.
     - `types.ts` 선언
     - `engine.ts`의 `createGame`·`openDay` 몸
     - 기록 함수 파일
     - `save-shape.ts`
     - `operations-invariants.ts`
   - `engine.ts`의 다른 함수 몸에 나오면 실패한다.
   - 함수 몸 경계는 `function 이름(`부터 다음 최상위 `function`까지로 자른다(기존 원천 검사 방식).
9. **검사기**: `test_validate_data.py`의 음성 사례 셋(3.1).

### 4.3 기존 시험 고치기(C2·C7·C11)

- **범위 정의**: BASE에서 다음 명령이 내는 시험 줄 전부와, 그 줄이 속한 `it` 안의 단언이다.

  ```
  grep -rn "formatVersion\|migrateV\|SAVE_FORMAT_VERSION\|fixtures/save-v[45]" src --include=*.test.ts
  ```

  개정 시점의 결과는 아래 표와 같다. 표에 없는 줄이 나오면 같은 규칙을 적용하고 결과 보고에 더한다.
- **규칙**
  - (ㄱ) **숫자 6 → 7**: 현재 판본을 숫자로 단언하는 줄
  - (ㄴ) **거절 시험 전환**: 형식 1~6을 성공적으로 읽는 단언. `it` 이름은 ‘판본 n은 새 문구로 거절한다’ 꼴로 바꾸고 단언은 새 문구 하나로 한다.
  - (ㄷ) **형식 7로 옮김**: 이관이 아니라 모양·불변식·메타 경로를 시험하던 `it`. 같은 손상을 형식 7 저장에 적용해 원래 경로 문구를 그대로 기대한다. 그리고 옛 판본 번호의 같은 사본은 새 문구로 거절됨을 하나 더한다.
  - (ㄹ) **삭제**: 이관 함수 직접 단언
  - (ㅁ) **그대로**: 부산 판 거절 시험(3.4-2가 앞서므로 바뀌지 않는다)

| 파일:줄 | 내용 | 규칙 |
|---|---|---|
| `m2a5-risk-credit-v2.test.ts:212` | `formatVersion).toBe(6)` | ㄱ |
| `m2a5-risk-default-v2.test.ts:345` | `toBe(6)` | ㄱ |
| `m2a-culture.test.ts:56` | `[…, SAVE_FORMAT_VERSION]` 기대 `6` | ㄱ |
| `m2a-recruit.test.ts:326` | `SAVE_FORMAT_VERSION).toBe(6)` | ㄱ |
| `m2a-growth.test.ts:333` | `SAVE_FORMAT_VERSION).toBe(6)` | ㄱ |
| `m2a-multi.test.ts:262-283` | 판본 1(M1) 이관 | ㄴ |
| `m2a-recruit.test.ts:317-330` | 판본 2 → 연쇄 이관 | ㄴ(`:326` ㄱ의 단언은 다른 `it`로 옮겨 남긴다) |
| `m2a-growth.test.ts:311-341` | 판본 1~4 복원 it.each | ㄴ(`:333` ㄱ은 같은 방식으로 남긴다) |
| `m2a-growth.test.ts:342-350` | 판본 3 이관 직원 정의 | ㄴ |
| `m2a-growth.test.ts:416-440` | 판본 3 시작 경험치, 판본 3 다른 시나리오 거절 | 앞은 ㄴ. 뒤(‘이관 설정과 저장 시나리오가 다릅니다’)는 ㄷ으로 형식 7의 시나리오 불일치 경로를 시험한다 |
| `m2a-growth.test.ts:446-452` | 판본 1~4 알 수 없는 시나리오 | ㄷ |
| `m2a-growth.test.ts:467-478` | ‘판본 4 … SaveError’ it.each | ㄷ |
| `m2a-growth.test.ts:479-488` | 판본 1~4 이관 결과 모양·불변 검사 | ㄷ |
| `m2a-growth.test.ts:519-` | ‘판본 4는 설정 없는 화면 경로에서도 정상 복원’ | ㄷ |
| `save-integrity.test.ts:32-50` | 판본 1~4 이관 뒤 `offers[0]` 경로 | ㄷ(4.2-7 (나)와 함께 순서 고정에 쓴다) |
| `save-v5.test.ts:9, 31-60, 88-128` | v4·v5 픽스처 성공 읽기, 판본 3 대조군, culture 덮기 | ㄴ. 픽스처 성공 읽기는 거절로, 내용 단언은 지운다 |
| `save-v5.test.ts:132-148` | 판본 1~4 필드 복원 it.each | ㄴ |
| `save-v5.test.ts:150-154` | 허용 밖 판본 `[0, 7, '5', 5.5]` | 목록을 `[0, 8, '7', 6.5]`로 |
| `save-v5.test.ts:37-47` | 부산 판 거절 | ㅁ |
| `m2a5-save.test.ts:10` | `migrateV5toV6` import | ㄹ |
| `m2a5-save.test.ts:73-81` | 판본 5 픽스처 이관과 `legacy_continue_days` 이어 진행 | ㄹ + ㄴ(픽스처는 새 문구로 거절) |
| `m2a5-save.test.ts:71` | `save_version` 대조 | ㄱ(acceptance와 함께) |
| `m2a-culture.test.ts:142-143`, `ui/main.test.ts:15, 50` | 부산 판 v4 픽스처 | ㅁ |
| `ui/code-split.test.ts:130, 132` | `legacySave`·`opsSave` 리터럴(형식 6) | 아래 |

- **`code-split.test.ts`**
  - `legacySave`·`opsSave`의 `"formatVersion":6`을 7로 바꾼다. 리터럴 안의 다른 글자는 바꾸지 않는다.
  - 두 상태는 rules-1·2라 형식 6과 7의 내용이 같다. 바꾼 문자열이 작업 뒤 `serializeSave(deserializeSave(…))`와 바이트 같은지 일회 확인하고 결과 보고에 적는다.
  - `:257-279`, `:407-414`의 성공 단언, `readState(...)).toBe(opsSave)`, BASE_HTML 세 sha는 그대로 통과해야 한다.
  - 거절 경로용으로 형식 6 사본 상수 하나(`opsSaveV6`)를 더해 4.2-7 (라)에 쓴다.
- **acceptance `P0-M2A5-13`**
  - `title`·`engine_test_names`의 ‘판본 6’ → ‘판본 7’. `m2a5-save.test.ts`의 `it` 이름을 같은 글자로 바꾼다(검사기 `:559` 연결).
  - `expected_numeric.save_version` 6 → 7
  - `legacy_continue_days`를 지운다.
  - `test_fixture.legacy_fixture`는 남긴다. 쓰임은 ‘옛 형식 거절 확인용’이다. `expected_assertions`에 ‘형식 5 저장은 옛 형식 문구로 거절한다’ 한 줄을 더한다.
- 결과 보고에 바꾼 줄마다 ‘원래 단언 → 새 단언’ 표를 적는다. 지운 `it` 수와 더한 `it` 수도 적는다.

## 5. 변형 시험

변형마다 어느 시험이 왜 실패하는지 한 줄씩 적는다. 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | `serializeSave`가 6을 쓴다 | 4.2-1, ㄱ 줄 |
| V2 | 판본 문이 6을 받는다 | 4.2-7 (가) |
| V3 | 부산 검사를 판본 문 뒤로 옮긴다 | 부산 문구 시험(ㅁ) |
| V4 | 놓친 견적 칸을 rules-3 상태에도 만든다 | 4.2-5, rules-3 골든 |
| V5 | 기록이 최소 수량 대신 최대 수량으로 판정한다 | 4.2-2 |
| V6 | 기록 함수가 추첨 커서를 하나 움직인다 | 4.2-3 |
| V7 | 로더가 `risk_setup.level`을 무시하고 R3으로 변환한다 | 4.2-6 |
| V8 | 저장 모양이 rules-3 상태의 `unaffordable` 키를 받는다 | 4.2-5 |
| V9 | 기록이 창고 부족도 기록한다 | 4.2-4 창고 사례 |
| V10 | 화면 거절 경로에서 상태를 비우고 알림만 띄운다 | 4.2-7 (다)·(라) |
| V11 | 판본 문(1~6 거절)을 `checkSaveShape` 뒤로 옮긴다 | 4.2-7 (나) |
| V12 | 기록을 `openDay`의 `PENDING_OPEN` 가드 앞으로 옮긴다 | 4.2-1 다시 열기 |
| V13 | `engine.ts`의 다른 함수(예: `acceptTrade`)가 `unaffordable`을 읽는다 | 4.2-8 |
| V14 | 검사기가 `risk_setup.level`을 검사하지 않는다 | 4.2-9 |
| V15 | 기록 대상 짝을 `publishDay ≤ s.day`로 넓힌다 | 4.2-4 |

## 6. 첫 화면 예산(사전 검수 허브 결정, H34-3·H35-3)

- 사본 탐침 셋을 각각 `git archive`로 깨끗한 트리에 풀어 빌드한다(`/tmp/T74-probe-{a,b,c}`, 기준은 `/tmp/T74-build-before`).
  - (가) BASE + 이관 함수 삭제만(판본 문은 BASE 그대로 두고 함수와 호출만 지운 사본)
  - (나) (가) + 엔진·콘텐츠 변경(`save.ts`·`save-shape.ts`·`operations-invariants.ts`·`types.ts`·`engine.ts`·새 기록 파일·`scenario.ts`·자료)
  - (다) 작업 뒤 전체(`session.ts`·`main.ts` 주석 포함)
- 판정(모두 `node tools/check_bundle_size.mjs dist`의 첫 화면 gzip)
  - 엔진 몫 = (나) − (가) ≤ **1,500 B**
  - 화면 몫 = (다) − (나) = **0 B**
  - 삭제분 = BASE − (가). 따로 적고 판정에 쓰지 않는다.
- 엔진 몫이 1,500 B를 넘거나 화면 몫이 0이 아니면 마무리하지 말고 멈추고 보고한다. 화면 몫이 0이 아니면 그 원인 줄을 함께 적는다.
- 탐침 사본은 크기 측정용이다. 시험을 돌리지 않아도 된다. 측정 뒤 지운다.

## 7. 큰 출력과 디스크

- 모든 회귀 출력, 탐침, 빌드 폴더는 `/tmp/T74-*` 아래에 둔다.
- sha256과 `cmp` 결과를 적은 즉시 지운다.
- 회귀 전에 `df -h /tmp`를 적는다. 여유가 2 GB보다 작으면 `/tmp/T74-*`만 지운다. 그래도 모자라면 다른 것을 지우지 말고 멈춘다.
- 작업 끝에 `ls -d /tmp/T74-* 2>/dev/null`이 빈 출력이어야 한다.

## 8. 결과 보고

`docs/ai/tasks/results/TASK-0074.md`에 다음을 적는다.

- BASE
- 왕복 확인(4.1)
- 판본 문 순서와 문구
- 지운 함수와 export 목록
- 4.3 표(원래 단언 → 새 단언), 지운·더한 `it` 수
- `code-split` 리터럴 바이트 확인
- 손 계산 사례의 계산 한 줄
- 판정 일치 시험의 기록 행 수
- 5절 변형 결과
- 10절 각 줄의 명령과 결과
- 6절의 네 빌드 gzip과 세 몫

## 9. 멈춤 조건

- 4.1 왕복 확인이 실패할 때.
- 4.3 범위 밖의 기존 시험이 실패할 때.
- 1절 1의 회귀가 어긋날 때.
- 3.3의 함수로 인수 문구를 바이트 같게 만들 수 없을 때.
- 6절 예산을 넘을 때.
- 놓친 견적 기록이 결정이나 다른 칸에 닿는 경로가 보일 때.
- 2절 목록 밖의 파일을 고쳐야 할 때.

## 10. 완료 조건

1. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다. 작업 전에 0이 아니면 고치지 말고 멈춘다.
2. `node src/engine/sim/run.mjs run`(시드 1001~1020, 400회)의 표준 출력이 BASE와 `cmp` 동일해야 한다.
3. 판본 2 SHA256SUMS 다섯 개 재현
   - TASK-0071 9절 1과 같은 명령을 쓰고 출력 이름만 `/tmp/T74-*`로 바꾼다. 작업자 여러 명으로 돌린다.
   - 판본 2 실행은 rules-4 설정이라, 새 칸이 측정 출력에 새지 않는지도 함께 확인된다.
4. `npx vitest run` 전체 통과. 시험 수 변화는 4.3 표와 4.2로 모두 설명되어야 한다.
5. `python3 tools/test_validate_data.py` 통과(`review_checks.sh:56`과 같은 명령).
6. 6절 예산 이내.
7. `npm run typecheck`, `npm run build` 통과.
8. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
9. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`(18종).
10. 7절 디스크 정리 확인.

## 개정 1 처리표

| 지적 | 처리 |
|---|---|
| C1·C12·C13 목록과 select | 3.1: `LOADABLE_SCENARIO_IDS`(허브 결정). `ALL_SCENARIO_IDS`·`main.ts:43, 411`·sim 금지어 시험 불변 |
| C2·C7·C11 고칠 시험 목록 | 4.3: grep 명령으로 범위를 정의하고, 개정 시점 결과를 줄마다 규칙 ㄱ~ㅁ으로 지정. `code-split` 리터럴 처리와 형식 6 사본 하나 |
| C3·C15 H35 미반영, 고칠 파일 절 | 머리 ‘확정 사항’, 2절 허용 파일 표, Q 절 삭제 |
| C4·C14 예산 상계 | 6절: 탐침 셋, 엔진 몫 (나)−(가), 화면 몫 (다)−(나) = 0, 삭제분 따로 |
| C5 순서 고정 | 3.4-3 위치 명시, 4.2-7 (나), V11 |
| C6 LEGACY 두 사례, 주석 | 4.2-7 (라) 두 사례, 2절 `save.ts:1-5`·`main.ts:41` 주석 고침 |
| C8·C17 짝 정의, 시드 우연 | 3.2 대상 짝 닫힌 정의(`openTradePairs` + `publishDay === s.day`), 4.2-2 `maxQuantity ≥ 2×step` 단언, 4.2-4 창고 사례 손 구성, V15 |
| C9 반환형 | 3.3: `rule`·`position`·`parts`까지 반환, 저장은 세 값만 |
| C10·C18 같음 예외 | 3.1: `id`·`titleKo`·`baseScenarioId` 닫힌 목록, `toStrictEqual` |
| C16 다시 열기 | 4.2-1에 `loadSaveText` 다시 열기, V12 |
| C19 C13 처리, 검사기 음성 | 4.3 acceptance 처리(`legacy_continue_days` 삭제, 이름 판본 7), `test_validate_data.py` 음성 셋, V14 |
| C20 원천 검사 기준 | 4.2-8 닫힌 목록과 함수 몸 경계, V13 |
