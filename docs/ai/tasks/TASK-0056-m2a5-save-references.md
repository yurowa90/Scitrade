# TASK-0056 M2a-5 저장 가져오기: 생성 견적·공개 묶음의 참조 ID를 설정과 대조

- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- 선행: TASK-0054 병합 기록 뒤 개발 브랜치 머리(이하 `<BASE>`). 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
  - `<BASE>`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0056-m2a5-save-references.md`의 해시를 쓰고 결과 보고 첫 줄에 적는다.
- 순서: 0033-R2 → 0033 병합 → 0054 → **0056** → 0034. 0054(검사기)와 고치는 파일이 겹치지 않는다.
- 근거: 세션 C의 코드 읽기와 세션 A의 반례 실행(2026-10-13).
  - 규칙 2 시나리오를 8일까지 진행해 저장한 뒤, 생성 견적 하나의 `counterpartyId`를 설정에 없는 값으로 바꿨다. 그 저장을 `deserializeSave`로 가져왔다.
  - 가져오기는 **통과**했다.
  - `openDay` 뒤 그 견적 쌍을 `ACCEPT_TRADE`로 넣으면 `planState`와 `commitDay`가 모두 예외를 냈다: `Cannot read properties of undefined (reading 'nameKo')`. 예외 자리는 `src/engine/engine.ts:403`의 `counterparties.find(...)!`다.
  - 같은 종류의 빈틈: `src/engine/operations-invariants.ts:26-29`는 생성 견적의 공개일·묶음 소속·ID 유일성만 본다. 견적과 묶음이 가리키는 도시·품목·거래처·견본 ID는 설정과 대조하지 않는다.

## 목표

손상되었거나 손으로 고친 저장이 가져오기 단계에서 한국어 이유와 함께 거부되게 한다. 엔진 안의 `find(...)!`를 하나씩 고치지 않는다. 고칠 자리는 가져오기 불변식 한 곳이다.

## 구현 지시

### 1. 참조 대조(`src/engine/operations-invariants.ts`의 `operationsProblems`)

다음 칸을 모두 설정 목록과 대조한다. 하나라도 없는 ID를 가리키면 문제 문장 하나를 더한다.

| 상태 칸 | 대조할 설정 목록 |
|---|---|
| `operations.offers[].counterpartyId` | `config.operations.market.counterparties[].id` |
| `operations.offers[].cityId`, `destinationCityId`(null이 아닐 때) | `config.cities[].id` |
| `operations.offers[].goodId` | `config.goods[].id` |
| `operations.offers[].templateId`(null이 아닐 때) | `config.operations.market.forwarding.templates[].id` |
| `operations.batches[].rows[]`의 `cityId`, `goodId` | `config.cities`, `config.goods` |
| `operations.batches[].index[].goodId`, `counterpartyPct[].goodId`, `maxLots[].goodId` | `config.goods` |
| `operations.batches[].destinations[]`의 `cityId`, `goodId` | `config.cities`, `config.goods` |
| `operations.batches[].templateIds[]` | `forwarding.templates[].id` |

- 문제 문장은 칸 종류를 밝힌다. 예: ‘생성 견적이 설정에 없는 거래처를 가리킵니다’, ‘공개 묶음 시세 행이 설정에 없는 품목을 가리킵니다’. 문장마다 ID 값을 붙이지 않아도 된다. 붙이려면 `esc` 없이 화면에 나가지 않는지 확인한다.
- 이 함수는 매일 마감(`closing`)에서도 불린다. 대조는 정상 생성 견적에서 늘 통과해야 한다. 결정성과 출력은 바뀌지 않아야 한다.
- 설정 목록은 함수 안에서 `Set`으로 한 번 만든다. 성능을 위해 다른 파일로 옮기지 않는다.

### 2. 가져오기 거부 경로

- 이미 `deserializeSave` → `checkInvariants` → `InvariantError` → `SaveError('저장 상태 검증 실패: …')` 경로가 있다. 이 경로를 그대로 쓴다. `save.ts`·`save-shape.ts`는 고치지 않는다.
- 이 경로로 문장이 나가지 않는 칸이 있으면(예: 마이그레이션이 먼저 터짐) 고치지 말고 ‘질문’에 적고 멈춘다.

## 시험(`src/engine/m2a5-save-references.test.ts` 새 파일, 필요하면 `src/ui/m2a5-trade-ui.test.ts`에 1개)

- 저장 만들기: 규칙 2 시나리오(`OPERATIONS_SCENARIO_IDS[0]`)를 첫 생성 묶음 공개일 이후까지 진행한다. 날짜는 `config.operations.market.publish`에서 읽는다. 그 날에 생성 직접 무역 견적 쌍과 생성 운송 주선 견적이 하나씩 있어야 한다. 없으면 다음 공개일로 넘긴다. 고른 방법을 주석으로 적는다.
- **반례(정상)**: 변조하지 않은 저장은 그대로 가져와진다. 가져온 상태로 생성 견적 쌍을 수락하면 `APPLIED`다.
- **칸마다 변조 반례**: 위 표의 칸마다 시험 하나를 둔다(같은 표를 쓰는 `it.each`도 된다).
  - JSON 저장 문자열에서 그 칸 하나만 설정에 없는 값으로 바꾼다.
  - 없는 값은 설정 목록의 ID에 접미사를 붙여 만든다(예: `${id}-없음`). 자료 ID 상수는 시험 소스에 쓰지 않는다(TASK-0027 R1 규칙).
  - `deserializeSave`가 `SaveError`를 던지고, 메시지에 그 칸의 문제 문장이 있다(`toContain`).
- **엔진 예외 재현 막기**: 거래처 변조 저장은 가져오기에서 거부된다. 그래서 위 `nameKo` 예외까지 가지 않는다는 것을 메시지로 확인한다.
- **화면 표시(허브 추가 조건)**: `startUi()`의 `importText`로 거래처 변조 저장을 넣는다. 화면 알림(`ui.flash`가 그리는 `.flash.warn`)에 문제 문장이 그대로 보인다. 화면의 게임 상태(날짜·현금)는 가져오기 전과 같다.
- 규칙 1 시나리오는 `operations`가 없으므로 이 대조를 지나지 않는다. 규칙 1 저장 가져오기 기존 시험이 그대로 통과한다.

## 고칠 수 있는 파일

- `src/engine/operations-invariants.ts`(위 대조만).
- `src/engine/m2a5-save-references.test.ts`(새 파일), 필요하면 `src/ui/m2a5-trade-ui.test.ts`(화면 표시 시험 1개 추가만).
- `docs/ai/tasks/results/TASK-0056.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/save.ts`, `src/engine/save-shape.ts`, `src/engine/engine.ts`(엔진 안 `find(...)!` 포함), 다른 `src/engine/*.ts`, `src/ui/*.ts`(시험 외), `data/**`, `schemas/**`, `tools/**`, `src/content/**`.

## 지켜야 할 것

- 규칙 1 불변, 결정성, 통화 분리, 시험 소스에 자료 ID 금지, 전체 객체 비교.

## 완료 조건

1. 지시 1·2 반영.
2. `npx vitest run` 실패 0, `npm run typecheck`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 실패 0. 규칙 1 골든과 기본 `run` 400회가 바이트로 같다(`cmp`).
3. 변형 시험(사본·편집기·되돌림·`cmp`):

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 거래처 대조를 뺌 | 거래처 변조 시험, 화면 표시 시험 |
| 2 | 묶음 `rows`의 품목 대조를 뺌 | 그 칸 변조 시험 |
| 3 | `destinationCityId`가 null일 때도 대조함(null을 없는 ID로 봄) | 정상 반례(운송 주선 외 견적은 `destinationCityId`가 null일 수 있다. 실제 자료에서 null이 없으면 그렇다고 적고 이 변형은 건너뛴다) |

4. 결과 보고 `docs/ai/tasks/results/TASK-0056.md`(공통 머리말 형식). 바꾼 파일, 설계 판단, 검증, 변형 표, 범위 밖 발견, 질문을 적는다.
   - 범위 밖 발견에 적을 것: 계약(`contracts[]`)의 `supplierId`·`customerId`와 화물의 `ownerPartyId`도 거래처를 가리킨다. 이 칸을 변조했을 때 무엇이 터지는지 시험 사본에서 한 번 확인한다(고치지 않음).

## 세션 A 확인 기록(쓸 때)

- 반례 실행: 8일 저장, 견적 `batchK > 0`인 직접 무역 쌍의 매입 쪽 `counterpartyId` 변조, `deserializeSave(…, { config })` 통과, `openDay` 뒤 `planState`·`commitDay` 모두 `nameKo` 예외. 임시 시험은 저장소에 넣지 않았다.
- `cityName`은 없는 ID에 ID 문자열을 돌려주므로 터지지 않는다(`src/engine/catalog.ts:79-82`). 그래도 도시 칸을 대조하는 이유가 있다. 화면에 ID가 그대로 보이고, 운임·경로 계산(`routeBetween` 등)이 없는 도시에서 어떻게 되는지 보장이 없기 때문이다.
- `loadSaveText`(`src/ui/session.ts:27`)는 `SaveError` 메시지를 `errorKo`로 돌려주고, `main.ts`의 `loadText`가 이를 `ui.flash`(warn)로 보인다. 화면 표시 시험은 이 경로를 쓴다.
