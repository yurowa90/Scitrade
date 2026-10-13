# TASK-0054 거래처 이름 검사: 빈 이름·중복 ID

- codex_model: `gpt-6-astra`
- reasoning_effort: `low`
- 선행 작업: TASK-0033이 들어간 개발 브랜치 `<BASE>` 위에 만든 `codex/TASK-0054`에서 작업한다.
  - `<BASE>`는 허브가 실행 전에 해시로 바꾼다. 자리표시가 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0054-counterparty-names.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - 줄 번호는 `cc8f202` 기준이다. `<BASE>`에서 다르면 코드가 사실이고, 차이를 결과 보고에 적는다.
- 병렬 작업: `tools/validate_data.py`·`tools/test_validate_data.py`를 여는 다른 작업과 동시에 돌리지 않는다.
- 결정 근거: TASK-0033 Codex·세션 A 검수에서 나온 후속(허브 전달 2026-10-13).
  - `src/engine/engine.ts:403`·`:484`의 로그가 `config.operations.market.counterparties.find(...)!.nameKo`를 읽는다.
  - 세션 C 확인(코드 읽기, `cc8f202`):
    - **거래처 ID가 목록에 없는 경우는 이미 막혀 있다.** `tools/validate_data.py:840` `check_market_rules`가 틀·거래 상품·초기 견적의 거래처 ID를 확인하고(시험 `MarketRulesTest.test_counterparty`), `src/content/scenario.ts:488`의 `party()`가 불러올 때 다시 확인해 예외를 낸다.
    - **이름 칸이 없는 경우도 막혀 있다.** `schemas/market_rules.schema.json`의 `counterparties` 항목이 `name_ko`를 `required`·`string`으로 둔다.
    - **남은 빈틈 둘:**
      1. `name_ko`가 빈 문자열이나 공백뿐이어도 통과한다. 예외는 나지 않지만 로그가 ‘계약 C… 체결:  → , …’처럼 이름 없이 나온다.
      2. 거래처 ID가 겹쳐도 통과한다. `find`는 처음 것을 돌려주므로, 이름이 다른 두 항목이 같은 ID를 쓰면 조용히 한쪽 이름만 보인다.
  - **이 작업 범위가 아닌 것(세션 A 몫으로 넘김):** `find(...)!`가 실제로 예외를 낼 수 있는 경로는 저장 파일 가져오기다. 생성 견적(`state.operations.offers`)의 `counterpartyId`는 저장 모양 검사(`src/engine/save-shape.ts:73`)에서 문자열인지만 보고, 운영 불변식(`src/engine/operations-invariants.ts`)도 거래처 ID를 설정과 대조하지 않는다. 그래서 손으로 고친 저장을 가져와 그 견적을 수락하면 `engine.ts:403`에서 예외가 날 수 있다(코드 읽기로 추론, 실행 확인 안 함). 고치는 자리는 로그의 `!`가 아니라, 가져올 때 불변식에서 ‘생성 견적의 거래처 ID가 설정에 있다’를 확인해 저장을 거부하는 쪽이 맞다. 엔진 파일이라 세션 A가 판단한다.

## 목표

검사기에 규칙 둘을 더하고 시험으로 지킨다. 자료·스키마·엔진·화면은 바꾸지 않는다.

## 먼저 읽을 파일

- `tools/validate_data.py`의 `check_market_rules`(840행 부근).
- `tools/test_validate_data.py`의 `MarketRulesTest`(1000행 부근).
- `data/market_rules.json`의 `counterparties`(지금 11개, ID 중복 없음, 이름 모두 있음).

## 고칠 수 있는 파일

- `tools/validate_data.py`
- `tools/test_validate_data.py`
- `docs/ai/tasks/results/TASK-0054.md` (결과 보고)
- `MANIFEST.json`(`python3 tools/build_package.py --manifest-only`로만)

## 구현 지시

`check_market_rules`의 맨 앞(`names` 집합을 만드는 줄 근처)에 다음을 더한다. 실패 문구는 아래 그대로 쓴다.

1. 각 거래처의 `name_ko`가 공백만이 아닌 문자열이다. 실패: `"{id}: 거래처 이름이 비어 있음"`.
2. 거래처 ID가 서로 겹치지 않는다. 겹치는 ID마다 한 번 실패: `"market_rules: 거래처 ID 중복 {id}"`.

기존 규칙(목록에 없는 ID)은 그대로 둔다.

## 시험

`MarketRulesTest`에 시험 둘을 더한다. 기존 방식(`self.fixtures()`로 읽고 고친 뒤 `self.errors(d, t)`)을 따른다.

1. 첫 거래처의 `name_ko`를 `""`, `"   "`으로 바꾸면 각각 `"{id}: 거래처 이름이 비어 있음"`이 있다(`subTest`).
2. 첫 거래처를 복사해 목록 끝에 더하면(이름은 다르게 바꿔도 된다) `"market_rules: 거래처 ID 중복 {id}"`가 정확히 한 번 있다.

## 확인 (결과 보고에 적는다)

- 새 시험이 지금 코드에서 통과한다.
- 변형 확인: 검사 코드를 잠시 아래처럼 바꾸면 새 시험이 실패하는지 본다. 확인한 뒤 되돌리고 `git diff tools/validate_data.py`가 새 규칙만 보이는지 적는다.
  - 이름 검사에서 `.strip()`을 빼면 시험 1의 `"   "` 경우가 실패한다.
  - 중복 검사를 지우면 시험 2가 실패한다.
  - 변형 확인은 `python3 -m unittest`로 `MarketRulesTest`의 새 시험만 돌린다(`main()`을 도는 시험은 MANIFEST 해시 때문에 코드만 바꿔도 실패한다).

## 완료 조건

- `python3 tools/test_validate_data.py` 통과. 시험 수 전후를 적는다(지금 95개면 97개).
- `python3 tools/validate_data.py` PASS. 검사 수 전후를 적는다.
- `bash tools/ai/review_checks.sh --check <BASE>` 통과.
- 바뀐 파일이 위 ‘고칠 수 있는 파일’ 넷뿐이다.
