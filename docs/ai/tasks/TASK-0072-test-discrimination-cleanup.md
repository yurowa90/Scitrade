# TASK-0072 위험·신용 시험 판별력 정리(STATUS 후속 787·788)

- **지위: 승인(허브, 2026-10-30, 개정 1).** 세션 A 초안(5433a9c)에 허브 검토 세 가지를 반영했다. 골든 검사기 이름을 명시했고, review_checks를 회귀에 넣었고, 결과 보고 파일 이름을 기존 관례(`results/TASK-0072.md`)에 맞췄다.
- 근거: `docs/STATUS.md` TASK-0064 후속의 ‘시험 판별력’·‘공유 실행 꼴’ 두 항목. 세션 A 설계자 검수 메모를 따른다.
- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- BASE: 개발 브랜치 `ccr-21863e28-zmusty`에서 이 지시서를 승인한 커밋이다. 시작할 때 `git rev-parse HEAD`를 결과 보고 `- BASE:`에 적는다.
- **고칠 파일은 `src/engine/m2a5-risk-credit.test.ts` 하나다.** 제품 코드(`src/**` 중 `.test.ts`가 아닌 파일), 자료, 화면, 도구는 고치지 않는다. 다른 시험 파일도 고치지 않는다.
- 범위 밖: 측정, 판정표, 자료 경계(`partial_bp` 범위)·`contractOf` 순서(같은 STATUS 후속의 다른 항목).
- **시드**: 새 시험과 일회 확인은 2001 이상만 쓴다. 예외는 기본 `node src/engine/sim/run.mjs run` 400회 회귀 하나다. 이 회귀는 고정 시드 1001~1020을 그대로 쓴다.

## 0. 먼저 읽을 것

1. `src/engine/m2a5-risk-credit.test.ts` 전체. 특히 다음을 읽는다.
   - `findCase`(:202-215): 캐시, 2001~2200 탐색, 못 찾으면 `expect(found, name).toBeDefined()`.
   - `claimCase`(:222-233)와 `assertClaim`.
   - `buildTradeRuns`(:234-284)와 모듈 최상위 `const shared = buildTradeRuns();`(:285).
   - ‘원천 검사’(:392-415).
   - ‘새 층이 꺼진 R2’(:486-502).
   - ‘주선(R3)’(:738~).
2. `src/engine/engine.ts`의 `processDeliveries`(:1110~)와 `processCollections`(:1201~).
   - 직접 무역 가드는 :1174 `if (contract.kind === 'DIRECT_TRADE') {`와 :1214 `if (contract.kind !== 'DIRECT_TRADE' || …`다.
   - 같은 함수 앞부분에도 종류 비교가 있다. :1122 `const forwarding = contract.kind === 'FORWARDING';`와 :1205 `defaultFor` 조건이다.
3. 줄 번호는 이 초안을 쓴 시점(`b24a65a` 병합 뒤)의 값이다. 다르면 이름으로 찾는다.

## 1. 고칠 것(4항목)

### 1.1 ‘클레임 (가)’의 늘 참인 단언

- 지금 상태: `claimCase`의 `accept`가 `later = 0`일 때 `c.priceReductionMinor === 0`을 찾기 조건에 넣는다. 그래서 `assertClaim`의 같은 단언은 늘 참이다.
- 놓치는 경우: 감액이 일부 시드에서만 잘못 붙는 결함이다. 탐색이 감액 0인 다른 시드를 골라 시험이 통과한다. 모든 시드에서 잘못 붙으면 실패하지만 메시지가 ‘클레임 사례 없음’이라 원인을 가린다.
- 고칠 것
  - 찾기 조건은 엔진 출력이 아닌 값으로만 고른다: 납기 안 인도(`deliveredDay ≤ 납기`)와 `rate(인도일) ≠ rate(결제일)`.
  - `priceReductionMinor === 0`은 고른 사례에 대한 단언으로만 남긴다.
  - `later = 1`(‘클레임 (나)’) 경로는 바꾸지 않는다.
- 고른 사례가 지금과 같은 시드·쌍이면 결과 보고에 그렇다고 적는다. 다르면 새 시드·쌍과 이유를 적는다.

### 1.2 ‘새 층이 꺼진 R2’의 빈 반복

- 지금 상태: `if (s.invoices.length && s.day < inv.dueDay)` 안의 `receivableSchedule`·`campaignSummary` 단언에 ‘그런 상태가 하나 이상’이라는 전제가 없다. 조건을 만족하는 상태가 0개여도 통과한다.
- 고칠 것: 조건을 만족한 상태 수를 세고 `≥ 1`을 단언한다. 실제 수를 결과 보고에 적는다.

### 1.3 ‘원천 검사’의 종류 가드 정규식

- 지금 상태: 호출 앞 함수 본문 전체(`body.slice(0, body.indexOf(call))`)에 ``kind\s*(?:===|!==)\s*'(?:DIRECT_TRADE|FORWARDING)'``가 있는지만 본다.
  - `processDeliveries`는 :1122의 `forwarding` 대입에 걸린다.
  - `processCollections`는 :1205의 `defaultFor` 조건에 걸린다.
  - 그래서 진짜 가드(:1174, :1214)를 지워도 이 검사는 통과한다. 지금 행동 가드는 ‘주선(R3)’ 하나다.
- 고칠 것: 검사가 **호출을 직접 막는 가드**만 인정하게 한다. 두 꼴만 허용한다.
  1. 호출을 감싸는 가장 가까운 열린 블록이 `if (contract.kind === 'DIRECT_TRADE') {`다.
  2. 같은 함수 안에서 호출보다 앞에 `if (contract.kind !== 'DIRECT_TRADE' || …) { … continue; }` 꼴의 조기 탈출이 있다. 이때 그 `if`와 호출 사이에 다른 반복문 머리(`for (`·`while (`)가 없어야 한다.
  - 구현 방법(괄호 짝 세기, 줄 단위 탐색 등)은 Codex가 고른다. 정규식 하나로 본문 전체를 훑는 꼴은 쓰지 않는다.
- **음성 대조를 같은 시험에 넣는다.** 실제 원문 문자열을 시험 안에서 바꾼 사본 셋에 검사 함수를 돌려 결과를 단언한다.
  - (a) :1174 가드 줄을 지운 사본은 거부한다.
  - (b) :1214의 `contract.kind !== 'DIRECT_TRADE' || `를 지운 사본은 거부한다.
  - (c) 원문은 통과한다.
  - 사본은 메모리 안에서만 만든다. 파일을 쓰지 않는다.

### 1.4 모듈 최상위 공유 실행

- 지금 상태: `const shared = buildTradeRuns();`가 모듈을 불러올 때 돈다. 불변식 위반 등으로 예외가 나면 파일 전체가 수집 단계에서 실패한다. 다른 시험은 하나도 돌지 않고, 보고에는 ‘시험 0개’로 나온다.
- 고칠 것: 처음 부를 때 한 번만 실행하는 함수 `sharedRuns()`로 바꾼다.
  - 결과와 예외를 둘 다 캐시한다. 예외는 부를 때마다 다시 던진다.
  - `shared`를 쓰는 `it`마다 그 안에서 부른다.
  - `beforeAll`은 쓰지 않는다. 실패가 그 `describe`의 모든 시험으로 번지기 때문이다.
- 시험 수, 이름, 순서는 바꾸지 않는다. 공유 실행 시드와 `evidence['공유 실행']` 내용도 바이트 그대로다.

## 2. 변형 시험(항목마다 하나 이상)

변형마다 세 가지를 적는다. 고치기 전 시험의 결과, 고친 뒤 시험의 결과, 실패 메시지 첫 줄이다. 변형은 사본 트리에서만 하고 되돌린다.

| 번호 | 변형 | 고치기 전 | 고친 뒤 |
|---|---|---|---|
| V1 | `processDeliveries`에서 시드가 홀수일 때만 클레임 계약에 감액 1(최소 단위)을 붙인다. 짝수 시드가 없으면 조건을 바꾸고 이유를 적는다. | ‘클레임 (가)’ 통과(놓침) | ‘클레임 (가)’가 `priceReductionMinor` 단언으로 실패 |
| V2 | **시험 쪽 변형.** R2 반복의 조건을 `s.day < 0`으로 바꾼다. 빈 반복을 보이는 데 엔진 변형이 필요 없으므로 시험 쪽에서 한다. | 통과(놓침) | 상태 수 `≥ 1` 단언으로 실패 |
| V3a | :1174 `if (contract.kind === 'DIRECT_TRADE')` 가드를 지우고 본문을 늘 실행한다. | ‘원천 검사’ 통과(놓침), ‘주선(R3)’ 실패 | ‘원천 검사’도 실패 |
| V3b | :1214의 `contract.kind !== 'DIRECT_TRADE' || `를 지운다. | ‘원천 검사’ 통과(놓침) | ‘원천 검사’ 실패 |
| V4 | `buildTradeRuns`에서 첫 시드를 마친 뒤 `throw new Error('V4')`. | 파일 수집 실패, 돈 시험 0 | `sharedRuns()`를 쓰는 시험만 실패, 나머지 통과(두 수를 적는다) |

- 엔진을 고친 변형(V1, V3a, V3b)은 ‘고치기 전’ 열을 실제로 돌려서 채운다.
- 예측과 다르면 멈추지 말고 실제 결과를 적는다. 그다음 1절의 고침이 그 변형을 잡는지 다시 따진다.

## 3. 회귀

1. `npx vitest run` 전체 통과. 시험 파일 수와 시험 수가 BASE와 같아야 한다. 1.2·1.3의 단언이 늘어나도 시험(`it`) 수는 그대로다.
2. 골든 둘(`node tools/check_rules2_golden.mjs`, `node tools/check_rules3_golden.mjs`)이 작업 전·후 모두 종료 0이어야 한다. 작업 전에 0이 아니면 고치지 말고 멈춘다.
3. `node src/engine/sim/run.mjs run` 400회(시드 1001~1020)를 돌린다. 출력이 BASE와 `cmp` 동일해야 한다.
4. 첫 화면 gzip이 BASE와 같아야 한다. 시험 파일만 바꾸므로 같아야 한다. 다르면 멈춘다.
5. `python3 tools/build_package.py --manifest-only`와 `python3 tools/validate_data.py`를 통과해야 한다.
6. `git diff --stat BASE`에 `src/engine/m2a5-risk-credit.test.ts`, 결과 보고 파일, `MANIFEST.json`만 있어야 한다.
7. `npm run typecheck`와 `npm run build`가 통과해야 한다.
8. `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>`: `실패 0종`.

## 4. 결과 보고

`docs/ai/tasks/results/TASK-0072.md`에 다음을 적는다.

- BASE
- 바뀐 시험 이름 목록
- 1.1의 고른 사례(시드·쌍)
- 1.2의 상태 수
- 1.3의 검사 함수 요약과 음성 대조 세 줄의 결과
- 2절 표에 실제 결과를 채운 것
- 3절 각 줄의 명령과 결과

## 5. 멈춤 조건

- 1절을 고치려면 제품 코드나 다른 시험 파일을 바꿔야 할 때.
- 공유 실행 시드나 `evidence` 내용이 바뀔 때.
- 회귀 3·4가 어긋날 때.
