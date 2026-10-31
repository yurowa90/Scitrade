# TASK-0074 rules-4 시나리오 하나, 저장 형식 7, 놓친 견적 칸(경로 11 ②-a)

- **지위: 초안(세션 A, 2026-10-31).** 허브 검토 전이다. Codex에 넘기지 않는다. 끝의 ‘허브에 묻는 것’ Q1~Q4가 정해져야 승인할 수 있다.
- 근거
  - `docs/DECISIONS.md` 2026-10-31 사용자 결정 1·7
  - 허브 결정 H34-1~H34-4(`docs/ai/design/path3-price-risk-2026-10/HUB-DECISIONS-2026-10-16.md:1040-1049`)
  - 범위 문서 `docs/ai/design/path11-engine-seam-2026-10/SCOPE.md` 1.6 (나), 1.9, 3.1
  - 2026-10-14 허브 기본값(`DECISIONS.md:1598`)
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- 범위 밖
  - 읽기 함수(SCOPE 1.1~1.4·1.7·1.8, TASK-0075)
  - rules-4 화면(외상 고르기, 견적 카드 접기 등, 뒤의 Sol 지시서)
  - 형식 6 → 7 이관(H34-2)
  - `package_version`·`data_version` 올리기
  - 측정(판정표 시드 1061~1300으로 새로 돌리는 것)
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 둘이다.
  1. 기본 `node src/engine/sim/run.mjs run` 400회 회귀는 고정 시드 1001~1020을 그대로 쓴다.
  2. 10절 3의 판본 2 SHA256SUMS 재현은 판본 2 측정 시드 1061~1100의 R1·R2를 다시 돌린다. sha256만 비교하고 표 내용은 읽지 않는다.

## 0. 먼저 읽을 것

줄 번호는 초안 시점(`24038f7`)의 값이다. 다르면 이름으로 찾는다.

1. 저장
   - `src/engine/save.ts:11-40`(`SAVE_FORMAT_VERSION = 6`, `serializeSave`)
   - `save.ts:95-140`(`deserializeSave`)
     - 판본 문 `:103`: 지금은 1~6을 받는다.
     - 부산 판 거절 `:113-115`
     - 이관 사슬 `:125-130`(`migrateV1toV2` … `migrateV5toV6`)
   - `src/engine/save-shape.ts`: `creditTermId`·`creditEligible` 선택 칸은 `:102-103`
2. 시나리오
   - `src/content/scenario.ts:37-47`(ID 목록)
   - `:136-141` `resolveScenarioRecord`: `base_scenario_id` 상속
   - `:257-` `loadScenario`. 특히 `:265`의 `operations ⇔ M2a-rules-2` 검사
   - `:566-` `loadCreditProfile`
3. rules-4 설정 변환
   - `src/engine/risk.ts:197-251`(`withRiskLevel`, `withRiskLevelV2`)
   - sim 진입 `src/engine/sim/risk-metrics.ts:13-15`(`simConfigV2`)
   - 판본 2 최종 프로필은 `RISK_PROFILE_V2`(k = +1, H32)다.
4. 자료
   - `data/scenarios.json:736-`(`SCENARIO_M2_OPS_COS_LAVER`, `scope_note`: 학생 선택 목록에 넣지 않음)
   - `tools/validate_data.py:22-23, 109-`
5. 인수 자금 판정: `engine.ts:271-288` `fundsShortfall`, `:355-395`(즉시 현금과 `COMMITTED_OUTLAYS`, 통화가 다를 때 통화별 부족)
6. 화면 진입: `src/ui/main.ts:43`(`SCENARIO_TITLES`), `:411`(시나리오 select), `:1504-1512`(브라우저 저장 불러오기), `:1600-1615`(`loadText`), `src/ui/session.ts:27-39`(`loadSaveText`)
7. 옛 형식 저장을 쓰는 기존 시험(초안 시점 grep 결과)
   - `m2a-multi.test.ts:267`
   - `m2a-recruit.test.ts:321`
   - `m2a-growth.test.ts:344, 420`
   - `save-v5.test.ts`(전체)
   - `m2a5-save.test.ts:10, 71`(`migrateV5toV6` import, `SAVE_FORMAT_VERSION`)
   - 부산 판 문구: `ui/main.test.ts:50`, `m2a-culture.test.ts:143`, `save-v5.test.ts:39-46`
   - 자료: `tests/acceptance_cases.json:4136`(`save_version: 6`)

## 1. 지켜야 할 것

1. **rules-1~3은 게임 결과가 바이트로 그대로다.**
   - 골든 둘, 400회 `cmp`, 판본 2 SHA256SUMS 다섯 개(10절)로 확인한다.
   - 저장 파일의 `formatVersion` 숫자는 바뀐다(2절). 골든은 meta를 뺀 상태를 해시하므로 영향을 받지 않는다(`tools/rules2_golden_lib.mjs:31`).
2. **새 칸 `operations.unaffordable`은 `meta.rulesVersion === 'M2a-rules-4'`인 상태에만 키가 있다.** 다른 판본 상태에는 키 자체가 없어야 한다(`undefined` 값도 안 된다).
3. **놓친 견적 기록은 다른 상태를 바꾸지 않는다.**
   - 추첨 커서, 원장, 로그, 견적, 계약, 다른 칸이 모두 그대로여야 한다.
   - 결정에 쓰이지 않는다. 엔진의 어떤 분기도 이 칸을 읽지 않는다.
4. **판정 일치**: 놓친 견적 기록은 인수 경로와 **같은 자금 계산**을 쓴다. 따로 구현한 두 번째 계산을 두지 않는다(3.3).
5. **화면 바이트**: `code-split.test.ts`의 `BASE_HTML` 세 sha256은 그대로다. 그래서 새 시나리오는 이번에 시나리오 select에 나타나지 않는다(Q2).
6. **기존 시험 단언을 고치는 곳은 2.4의 목록뿐이다.** 그 밖의 기존 시험은 고치지 않고 통과해야 한다.

## 2. 저장 형식 7(H34-2: 이관 없음, 옛 형식 명시 거절)

### 2.1 첫 일: 형식 6 왕복 확인(고치기 전)

- BASE에서 rules-4 상태가 지금 형식 6으로 저장·복원되는지 일회 확인을 한다. 시험 파일로 남기지 않는다.
  - 상태는 `simConfigV2(loadScenario('SCENARIO_M2_OPS_COS_LAVER'), 'R4', 'RISK_PROFILE_V2')`로 시드 2001~2003을 끝까지 돌려 만든다. 날마다의 상태를 쓴다.
  - 각 날 상태에 `serializeSave` → `deserializeSave(…, { config })` → `serializeSave`를 하고 바이트가 같은지 본다.
- 결과를 결과 보고 ‘왕복 확인’에 적는다.
- **실패하면 멈춘다.** 지금 저장 모양이 rules-4 상태(`creditTermId`, 대손 상태, carry 분개 등)를 담지 못한다는 뜻이다. 그러면 형식 7의 범위가 달라진다.

### 2.2 쓰기·읽기

1. `SAVE_FORMAT_VERSION = 7`로 바꾼다. `serializeSave`는 모든 시나리오에서 7을 쓴다.
2. `deserializeSave`의 판본 문은 다음 순서로 거른다.
   1. `format`이 다르면 기존 문구로 거절한다.
   2. **부산 판(`dataVersion` 0.4.x)이면 기존 부산 문구로 거절한다.** 이 검사를 판본 문보다 앞에 둔다. 기존 부산 문구 시험(0절 7)이 그대로 통과해야 한다.
   3. `formatVersion`이 1~6의 정수면 새 고정 문구로 거절한다.
      - 문구: **`이전 저장 형식(판본 ${n})의 저장입니다. 이번 판(판본 7)에서는 열 수 없습니다. 새로 시작해 주세요.`**
      - 문구 다듬기는 뒤의 문구 작업에서 한다. 바꿀 때 이 지시서의 시험 리터럴만 바꾸면 되게, 문구는 한 곳(상수)에 둔다.
   4. 7이 아니고 위에도 해당하지 않으면 기존 문구 `지원하지 않는 저장 형식 판본입니다 (${n}).`로 거절한다.
3. 이관 사슬(`migrateV1toV2` … `migrateV5toV6`)은 Q3의 답을 따른다.
4. `LEGACY_SAVE_KEY`(`scitrade-m1-save`)로 읽은 저장도 같은 판본 문을 지난다. 별도 처리를 하지 않는다.

### 2.3 거절 경로 시험(H34-2 완료 조건)

1. 엔진: 형식 1~6의 같은 내용 사본 여섯 개를 `deserializeSave`가 위 문구로 거절한다(`SaveError`).
   - 판본 8과 `"7"`(문자열)은 ‘지원하지 않는’ 문구로 거절한다.
   - 부산 판 사본은 부산 문구가 우선한다.
2. 화면 두 경로를 각각 확인한다. 둘 다 문구가 알림 띠에 그대로 나오고, 현재 상태·오늘 할 일·시나리오 select가 보존되어야 한다.
   - (가) 파일 불러오기: `loadText(text)` 경로
   - (나) 브라우저 저장 불러오기: `case 'load'`. `SAVE_KEY`와 `LEGACY_SAVE_KEY` 둘 다 본다.
3. 운영 시나리오의 형식 6 저장이 불러오기 전에 운영 지연 청크(`ensureOpsScreens`)를 받지 않는지 확인한다. 거절은 내용 검증 전에 일어나야 한다.
   - 지금 `loadSaveText`는 `scenarioId`를 엿본 뒤 `deserializeSave`를 부른다. 그 안에서 판본 문이 먼저 걸리면 된다. 이 순서를 시험으로 고정한다.

### 2.4 고쳐야 하는 기존 시험(이 목록만)

- 0절 7의 옛 형식 불러오기 시험은 ‘이관 결과 확인’에서 ‘새 문구 거절 확인’으로 바꾼다.
  - 바꾸는 줄마다 원래 단언과 새 단언을 결과 보고 표에 적는다.
  - 이관 함수를 직접 부르는 단언은 Q3의 답을 따른다.
- `tests/acceptance_cases.json` C13의 `save_version`을 6 → 7로 바꾼다. 이 파일의 다른 값은 바꾸지 않는다. `MANIFEST.json`은 생성 명령으로 갱신한다.
- 그 밖의 기존 시험이 실패하면 고치지 말고 멈추고 보고한다.

## 3. rules-4 시나리오와 놓친 견적 칸

### 3.1 시나리오 등록(자료 + 로더)

- **새 ID: `SCENARIO_M2_OPS_CREDIT`.** 허브가 바꿀 수 있다.
- 자료 `data/scenarios.json`에 새 항목을 더한다.
  - `base_scenario_id: "SCENARIO_M2_OPS_COS_LAVER"`
  - 새 칸 `risk_setup: { "level": "R4", "profile_id": "RISK_PROFILE_V2" }`
  - `title_ko`는 임시 문구 `외상 거래: 화장품 + 조미김 — 평택 본사 90일 운영`이다. 문구 작업에서 바꾼다.
  - `scope_note`
  - 다른 칸은 상속한다. `data_version`은 올리지 않는다.
- 로더(`loadScenario`)
  - 상속 결과에 `risk_setup`이 있으면, 기존 `operations ⇔ M2a-rules-2` 검사를 지난 뒤 `withRiskLevelV2(config, level, loadRiskProfile(id), loadCreditProfile(id))`를 적용한다.
  - `risk_setup`이 없는 시나리오의 로더 출력은 바이트로 그대로다.
- 검사기 `tools/validate_data.py`
  - `risk_setup` 칸을 검사한다.
    - `level`은 `R4`만 허용한다.
    - `profile_id`는 `market_rules.json` `risk_profiles`에 있고 외상 칸이 모두 있어야 한다.
    - `base_scenario_id`는 실험 시나리오여야 한다.
  - 그 밖의 검사를 느슨하게 하지 않는다.
- ID 목록
  - `ALL_SCENARIO_IDS`(저장·불러오기·`loadSaveText` 엿보기)에는 넣는다.
  - `OPERATIONS_SCENARIO_IDS`(D03 기본 목록)와 `EXPERIMENT_SCENARIO_IDS`에는 넣지 않는다.
  - 시나리오 select와 `SCENARIO_TITLES`는 Q2의 답을 따른다. 초안 기본은 **select에 넣지 않음**이다.
- **같음 시험**: `loadScenario('SCENARIO_M2_OPS_CREDIT')`가 `simConfigV2(loadScenario('SCENARIO_M2_OPS_COS_LAVER'), 'R4', 'RISK_PROFILE_V2')`와 같아야 한다. `id`·`titleKo`(그리고 결과 보고에 적은 표시용 칸)만 다를 수 있다.
  - 이것으로 학생이 놀 설정이 판본 2·3 측정 설정과 같음을 고정한다.

### 3.2 새 칸 `operations.unaffordable`(SCOPE 1.6 (나))

- 형: `UnaffordableRecord[]`
- 행 하나는 `{ day, buyOfferId, sellOfferId, quantity, shortfalls: { currency, needMinor, availableMinor }[] }`다.
  - `shortfalls`는 통화별이다. rules-4는 매입이 원화, 운임·관세가 달러라서 부족이 통화마다 따로 생길 수 있다.
  - 부족이 있는 통화만 넣는다. 통화 순서는 `Currency` 정렬 순서를 따른다.
- **기록 시점**: `openDay`의 끝, `s.phase = 'AWAITING_INPUT'` 바로 앞이다(`engine.ts:159`). 플레이어가 그날 결정할 상태가 바로 이것이다.
  - 견적 묶음은 앞날 `commitDay` 끝(`:924-930`)에서 만들어진다. 첫 묶음은 `createGame`에서 만들어진다.
  - 기록 대상은 `publishDay === s.day`이고 상태가 `OPEN`인 공개 짝이다.
  - `openDay`는 `PENDING_OPEN`일 때만 몸을 돈다(`:132`). 그래서 기록은 하루 한 번이다. `loadSaveText`가 불러온 상태에 `openDay`를 다시 불러도 겹쳐 기록되지 않는다. 이를 4절 1의 왕복 시험이 함께 확인한다.
- **기록 조건**: 짝 하나에 대해 수량을 **최소 수량 `quantityStep`**으로 두고 인수 자금 판정(3.3)을 한다. 자금이 모자라면 기록한다.
  - 최소 수량인 까닭: ‘가장 작게 사려 해도 못 산다’여야 플레이어의 선택과 무관한 사실이 된다.
  - 기록하지 않는 것: 수량·창고·외상 한도·노선 사유 거절, 자금이 남는 짝.
- 행 순서는 `(buyOfferId, sellOfferId)` 사전순이다. 같은 날 같은 짝은 한 번만 기록한다.
- 칸은 `meta.rulesVersion === 'M2a-rules-4'`인 상태에서 `createGame` 때 `[]`로 만든다. 그 밖의 판본에서는 키가 없다.
- 저장 모양(`save-shape.ts`)
  - rules-4 상태에는 이 키가 있어야 하고 모양이 맞아야 한다.
  - 다른 판본 상태에 이 키가 있으면 거절한다.
  - 불변식(`operations-invariants.ts`)에 같은 조건을 더한다: 날짜 오름차순, `day ≤ s.day`, 같은 날 같은 짝 중복 없음.

### 3.3 판정 공유

- `engine.ts`의 인수 자금 판정을 순수 함수 하나로 뽑는다. 이름 예: `tradeFundsNeeds(s, config, buy, sell, quantity)`.
  - 돌려주는 값은 통화별 `{ currency, needMinor, availableMinor }`다.
  - 인수 경로(`:366-394`)는 이 함수의 값으로 지금과 **같은 문구**를 만든다.
  - 놓친 견적 기록도 이 함수를 쓴다.
  - 관세는 지금처럼 `dutyFor(…)`를 그대로 부른다. 추첨 커서를 움직이지 않는지는 4절 3의 시험이 확인한다.
- `IMMEDIATE_CASH` 규칙 갈래도 같은 함수 안에 둔다. 인수 경로의 문구는 그대로다.
- 이 변경은 rules-1~3의 인수 결과를 바꾸면 안 된다. 1절 1의 회귀로 확인한다.

## 4. 새 시험(2001 이상 시드)

1. **왕복**: 새 시나리오 시드 2001~2003의 날마다 상태에 대해 `serializeSave` → `deserializeSave` → `serializeSave`가 바이트 동일하다. 이때 `formatVersion`은 7이다.
2. **손 계산 사례**(H34-4)
   - 새 시나리오 시드 2001의 첫 공개일 상태에서 원화 현금만 줄인 사본을 만든다. 장부 분개로 줄인다. 상태를 직접 고치지 않는다.
   - 어느 짝의 `quantityStep` 매입액보다 원화 가용액이 작게 만든다.
   - 기대 `needMinor`·`availableMinor`는 자료 값(BUY 단가 × `quantityStep`, 시작 자금, 줄인 액수)으로 손 계산해 리터럴로 적는다.
   - 엔진 출력에서 기대값을 베끼지 않는다. 계산 과정은 시험 주석에 한 줄로 적는다.
3. **순수성**
   - 기록 함수를 부르기 전과 후에 상태의 다른 모든 칸이 같아야 한다. `unaffordable` 칸을 빼고 `structuredClone`으로 비교한다. 추첨 커서도 포함한다.
   - 기록 함수에 얼린(deep-frozen) 상태 사본을 넘겨도 예외가 없어야 한다.
4. **판정 일치**(3.3)
   - 새 시나리오 시드 2001~2010을 끝까지 돌린다(기존 sim 정책 하나).
   - 매일 기록된 짝마다, 그날 시작 상태 사본에서 `quantityStep`으로 `ACCEPT_TRADE`를 하면 자금 사유로 `REJECTED`되어야 한다.
   - 기록되지 않은 공개 짝은 같은 명령이 자금 사유로 거절되지 않아야 한다. 다른 사유의 거절은 된다.
   - 기록이 0건인 시드만 있으면 이 시험은 쓸모가 없다. 그래서 기록 행 수 ≥ 1을 따로 단언한다. 실제 수를 결과 보고에 적는다.
5. **키 유무**
   - rules-1·2·3 시나리오의 날마다 상태에 `operations.unaffordable` 키가 없다. rules-3은 기존 위험 시험의 설정을 쓴다.
   - rules-4 상태에는 키가 있다.
   - 저장 모양이 바꾼 사본(키 추가·삭제)을 거절한다.
6. **같음**: 3.1의 설정 같음 시험.
7. **거절 경로**: 2.3의 시험 전부.
8. **원천 검사**
   - 엔진에서 `unaffordable`을 읽는 곳은 기록 함수, 저장 모양, 불변식뿐이다.
   - 첫 화면 화면 파일(`main.ts` 등)은 새 시나리오 ID를 select 목록에 넣지 않는다(Q2 기본안일 때).

## 5. 변형 시험

변형마다 어느 시험이 왜 실패하는지 한 줄씩 적는다. 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 잡아야 할 시험 |
|---|---|---|
| V1 | `serializeSave`가 6을 쓴다 | 4-1, 2.3-1 |
| V2 | 판본 문이 6을 받는다(이관 없이 그대로 읽음) | 2.3-1 |
| V3 | 부산 검사를 판본 문 뒤로 옮긴다 | 부산 문구 기존 시험 |
| V4 | 놓친 견적 칸을 rules-3 상태에도 만든다 | 4-5, rules-3 골든 |
| V5 | 기록이 최소 수량 대신 최대 수량으로 판정한다 | 4-2 또는 4-4 |
| V6 | 기록 함수가 추첨 커서를 하나 움직인다(예: 관세 추첨을 커서 있는 경로로) | 4-3 |
| V7 | 로더가 `risk_setup.level`을 무시하고 R3으로 변환한다 | 4-6 |
| V8 | 저장 모양이 rules-3 상태의 `unaffordable` 키를 받는다 | 4-5 |
| V9 | 기록이 자금 대신 창고 부족도 기록한다 | 4-4 |
| V10 | 화면 파일 거절 경로에서 상태를 비우고 알림만 띄운다 | 2.3-2 |

## 6. 첫 화면 예산(H34-3)

- 엔진 핵심 몫은 **≤ 1,500 B**다. 화면 몫은 0을 목표로 한다. select를 바꾸지 않으므로 0이어야 한다.
- 측정
  - BASE와 작업 뒤를 각각 `git archive`로 깨끗한 트리(`/tmp/T74-build-before`·`-after`)에 풀어 빌드한다.
  - `node tools/check_bundle_size.mjs dist`의 첫 화면 gzip 전·후와 차이를 적는다.
- 차이가 1,500 B보다 크면 마무리하지 말고 멈추고 보고한다.
- Q3에서 이관 사슬을 지우면 그 감소도 같은 차이에 들어간다. 지운 몫을 따로 알 수 있게 결과 보고에 지운 함수의 원본 크기를 적는다.

## 7. 큰 출력과 디스크

- 모든 회귀 출력과 빌드 폴더는 `/tmp/T74-*` 아래에 둔다.
- sha256과 `cmp` 결과를 적은 즉시 지운다.
- 회귀 전에 `df -h /tmp`를 적는다. 여유가 2 GB보다 작으면 이 작업이 만든 `/tmp/T74-*`만 지운다. 그래도 모자라면 다른 것을 지우지 말고 멈춘다.
- 작업 끝에 `ls -d /tmp/T74-* 2>/dev/null`이 빈 출력이어야 한다.

## 8. 결과 보고

`docs/ai/tasks/results/TASK-0074.md`에 다음을 적는다.

- BASE
- 왕복 확인(2.1)
- 판본 문 순서와 문구
- 바꾼 기존 시험 표(2.4)
- 시나리오 같음 시험에서 다른 칸 목록
- 손 계산 사례의 계산 한 줄
- 판정 일치 시험의 기록 행 수
- 5절 변형 결과
- 10절 각 줄의 명령과 결과
- 첫 화면 gzip 전·후

## 9. 멈춤 조건

- 2.1 왕복 확인이 실패할 때.
- 2.4 목록 밖의 기존 시험이 실패할 때.
- 1절 1의 회귀가 어긋날 때.
- 3.3의 공유 함수로 인수 문구를 지금과 같게 만들 수 없을 때.
- 6절 예산을 넘을 때.
- 놓친 견적 기록이 결정이나 다른 칸에 닿는 경로가 보일 때.

## 10. 완료 조건

1. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다. 작업 전에 0이 아니면 고치지 말고 멈춘다.
2. `node src/engine/sim/run.mjs run`(시드 1001~1020, 400회)의 표준 출력이 BASE와 `cmp` 동일해야 한다.
3. 판본 2 SHA256SUMS 다섯 개 재현
   - TASK-0071 9절 1과 같은 명령을 쓰고 출력 이름만 `/tmp/T74-*`로 바꾼다. 작업자 여러 명으로 돌린다.
   - 판본 2 실행은 rules-4 설정이다. 그래서 이 재현이 ‘놓친 견적 칸이 측정 출력에 새지 않음’도 함께 확인한다.
4. `npx vitest run` 전체 통과. 기존 시험 수는 그대로이고 늘어난 것은 4절뿐이다. Q3에서 이관 시험을 지우면 지운 수를 적는다.
5. 6절 예산 이내.
6. `npm run typecheck`, `npm run build` 통과.
7. `python3 tools/build_package.py --manifest-only`, `python3 tools/validate_data.py` 통과.
8. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`.
9. 7절 디스크 정리 확인.

## 허브에 묻는 것(승인 전에 정할 것)

- **Q1. 형식 7을 모든 시나리오에 적용하는가.**
  - 사용자 결정 1은 ‘형식 7이 생기면 옛 형식 저장은 명시 문구로 거절’이다. 문자 그대로 읽으면 rules-1~3을 포함한 **모든 옛 저장**이 열리지 않는다. 학생이 브라우저에 둔 저장도 여기에 든다.
  - 그런데 rules-1~3 상태는 형식 6과 7의 내용이 같다. 달라지는 것은 판본 숫자뿐이다.
  - 초안은 결정의 문자대로 썼다. 형식 7을 전면 적용하고, 1~6을 모두 거절한다.
  - 대안은 ‘rules-4 저장만 7, 나머지는 6’이다. 그러면 옛 저장이 그대로 열리고 2.4의 시험 변경이 없다. 대신 판본 번호가 시나리오마다 달라져 ‘묶어서 한 번만 올린다’는 원칙과 어긋난다.
  - 권고: 지금이 배포 전 시제품 단계라면 초안대로 간다. 부산 → 평택 때와 같다. 이미 학생 저장이 있는 교실이 있다면 사용자에게 한 줄 확인을 받는다.
- **Q2. 새 시나리오를 이번에 시나리오 select에 넣는가.**
  - 초안 기본은 넣지 않음이다. 외상 고르기 화면이 없는 상태로 학생이 들어가면 모든 계약이 BASE 조건이 된다. 그래서 ‘외상 거래’라는 이름과 실제 놀이가 어긋난다.
  - 넣지 않으면 `BASE_HTML`이 그대로이고 화면 몫이 0이다. 화면 Sol 지시서에서 select에 넣는다.
  - `SCENARIO_TITLES`는 select와 같은 목록을 쓰게 한다. 그러면 첫 화면에서 새 시나리오 로더(설정 변환)를 돌리지 않는다.
- **Q3. 형식 1~6 이관 함수를 지우는가.**
  - 1~6을 모두 거절하면 `migrateV1toV2`~`migrateV5toV6`는 제품 경로에서 닿지 않는다. 시험만 직접 부르는 죽은 코드가 된다.
  - 권고: 지운다. 그 이관 단언 시험도 거절 시험으로 바꾼다. 첫 화면 바이트가 줄어 6절 예산에도 도움이 된다.
  - 남겨 둘 이유가 있다면(예: 교사용 변환 도구) 그 쓰임을 정해 주십시오.
- **Q4. 형식 7에 다른 묶을 것을 넣는가.**
  - ‘형식 7은 묶어서 한 번만 올린다’(DESIGN.md:389)에 따라 후보를 적어 둔다. 저장 메타에 위험 층 지문을 넣는 안(CODEX-REVIEW-0063:291, R1·R2 저장 짝 문제)이다.
  - 권고: 넣지 않는다. 이번 rules-4 시나리오는 층이 R4로 고정이라 짝 문제가 생기지 않는다. 측정 도구는 이미 짝을 지킨다.
  - 앞으로 경로 6·8·9·12가 새 칸을 원하면 선택 칸(형식 7 유지)이냐 형식 8이냐를 그때 정한다.
