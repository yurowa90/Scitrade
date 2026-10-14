# TASK-0060 자료 검사기를 자료 기반으로: 시세표 행·HS 확인 상태·교과 연결 형식

- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- 선행: TASK-0059 반영 기록 뒤 개발 브랜치 머리(이하 `17c731c`). 기준 비교(`review_checks.sh`)는 `17c731c`로 한다.
  - `17c731c`가 치환되지 않았으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0060-validator-data-driven.md`의 부모 해시를 쓰고, 결과 보고 첫 줄에 적는다.
- 순서: 제작 계획(2026-10-14 사용자 승인, `docs/ai/design/production-plan-2026-10-14/PLAN.md`) 단계 1의 첫 Codex 지시서다. 그다음은 TASK-0061(상황실 지도 1판, Sol), TASK-0062~0064(직접 무역 위험, Astra), TASK-0065(품목안, Astra) 순서다.
- 근거: 허브 읽기 조사(2026-10-14).
  - `tools/validate_data.py` 854~856행은 rule set마다 시세표가 **정확히 6행**이라고 검사한다. 2품목 × (매입 1 + 판매지 2)인 지금 자료에만 맞는 숫자다. 그래서 화장품 1품목안(3행)을 넣으면 자료 검사부터 실패한다.
  - 972~973행은 모든 품목의 `hs_code`가 `None`이고 `hs_mapping_status`가 `NOT_VERIFIED`라고 강제한다. 세션 C가 HS를 원문으로 확인해도 넣을 수 없다.
  - 529행의 성취기준 코드 정규식 `^\[(10|12)[가-힣]+…\]$`는 특성화고 전문교과 코드(`[무일 02-03-02]`, 과목 약칭 두 글자 + 공백 + 세 단위 번호)를 거부한다. 사용자가 대상에 특성화고 무역·회계 계열을 넣었다(DECISIONS ‘2026-10-14 제작 계획’ 답 3).
  - 921~923행은 교과 연결 47개와 사회 18·윤리 6·과학 23을 고정한다. 같은 내용을 자료의 `counts` 칸과 대조하는 `check_curriculum_counts`(792행~)가 이미 있다. 803행의 머리글자 표도 세 묶음만 안다.

## 목표

검사기가 **자료가 스스로 밝힌 구조**를 기준으로 검사하게 한다. 지금 자료의 검사 결과는 바뀌지 않아야 한다. 대신 다음 세 가지를 더할 수 있게 한다.
- 품목 수가 다른 rule set.
- 원문으로 확인한 HS.
- 특성화고 교과 연결.

검사를 느슨하게 만드는 것이 아니다. 고정 숫자를 **자료 사이의 일관성 검사**로 바꾸는 것이다. 지금 엔진이 실행 중에 `!` 단언으로 가정하는 것을 자료 검사 단계에서 먼저 잡는다.

## 구현 지시

### 1. 시세표 행 수를 자료 기반으로 (`market_rules`)

854~856행의 `len(rows) == 6` 검사를 아래 검사들로 바꾼다. 각 검사는 실패하면 한국어 문장 하나를 낸다. 문장 머리는 지금처럼 `market_rules: <rule id>:`로 한다.

| 검사 | 내용 |
|---|---|
| 시세표 행 집합 | `rows`의 `(city_id, good_id, side)` 집합이 아래 기대 집합과 **정확히 같다**. 기대 집합은 `trade.goods`의 품목마다 `(trade.buy_city_id, good, 'BUY')` 1행과, `trade.sell_city_ids`의 도시마다 `(city, good, 'SELL')` 1행이다. 중복 행도 실패다. 행 수는 품목 수 × (1 + 판매지 수)가 된다 |
| 지수 품목 | `index.goods`의 집합이 `trade.goods`의 `good_id` 집합과 같다. 생성기 `market.ts`의 `!` 단언(33행 근처)을 자료 단계에서 잡는 것이다 |
| 품목별 판매 거래처 | 각 품목의 `sell_counterparties`가 `trade.sell_city_ids`의 도시마다 정확히 1개씩 있다(56·62행 근처 단언) |
| 판매지 결제일 | `trade.payment_offset_days`가 `trade.sell_city_ids`의 도시마다 정확히 1개씩 있다(59행 근처 단언) |
| 품목 ID | `trade.goods`의 `good_id`는 모두 `goods.json`에 있고, 한 rule set 안에서 중복되지 않는다 |
| 기준가 통화 | `rows[].base_price.currency`는 지금 규칙대로 둔다. 통화 검사를 새로 만들지 않는다. 통화 다변화는 TASK-0062~0064 몫이다 |

- 엔진 코드를 실제로 읽고 위 행 번호와 단언 위치를 결과 보고에 적는다. 행 번호는 허브 조사 값이라 어긋날 수 있다.
- 엔진이 요구하는데 위 표에 빠진 자료 조건을 찾으면 같은 방식으로 더한다. 더한 것은 결과 보고 ‘설계 판단’에 적는다.

### 2. HS 확인 상태 (`goods`)

972~973행을 아래 두 상태 규칙으로 바꾼다.

| `hs_mapping_status` | 요구 |
|---|---|
| `NOT_VERIFIED` | `hs_code`와 `hs_edition`이 모두 `null`이다. 지금 8개 품목이 모두 이 상태이고, 그대로 통과해야 한다 |
| `VERIFIED` | `hs_code`는 6단위 국제 공통 형식 `^[0-9]{4}\.[0-9]{2}$`(예: `3304.99`)다. `hs_edition`은 `^HS20[0-9]{2}$`(예: `HS2022`)다. `source_refs`는 비어 있지 않고, 모든 항목이 `sources.json`에 있는 출처를 가리킨다(지금 출처 참조 검사와 같은 방식) |
| 그 밖의 값 | 실패 |

- 국가별 10단위 세번(한국 HSK, 중국·베트남 세번)과 세율 칸은 **이번에 만들지 않는다.** 경로 7(품목 지식 카드) 몫이다.
- `schemas/goods.schema.json`은 `hs_code`·`hs_edition`이 이미 문자열 또는 null을 받는다. `hs_mapping_status`에 `enum`을 두는 것만 허용한다. 그 밖의 스키마는 바꾸지 않는다.

### 3. 교과 연결: 특성화고 전문교과 형식 받기 (`curriculum_links`)

- **3a. 코드 형식.** 529행 정규식을 두 형식으로 나눈다. 연결의 `group`에 따라 맞는 형식만 받는다.
  - 공통·일반·진로 형식(지금 것): `social`·`ethics`·`science` 묶음.
  - 전문교과 형식 `^\[[가-힣]{2} [0-9]{2}-[0-9]{2}-[0-9]{2}\]$`(예: `[무일 02-03-02]`, `[회원 06-02-03]`): 새 묶음 `vocational`. 머리글자는 `VOC`다.
- **3b. 개수 고정 지우기.** 921~923행의 고정 숫자(47, 18·6·23)를 지운다. 같은 일을 `check_curriculum_counts`가 자료의 `counts` 칸과 대조해서 한다.
  - 그 대신 `counts.total`이 0보다 크다는 검사와, 지금 자료의 세 묶음(social·ethics·science)이 사라지지 않았다는 검사(각 묶음 1개 이상)를 둔다.
  - 지금 자료는 `counts`가 47·18·6·23이므로 결과는 같다.
- **3c. 머리글자 표.** 803행 머리글자 표에 `'vocational': 'VOC'`를 더한다.
- **3d. 선택 범주.** `selection` 값은 지금 `common`·`general`·`career`다. 전문교과는 `major_general`(전공 일반)과 `major_practice`(전공 실무)를 쓴다. 이 두 값을 `vocational` 묶음에서만 받는다.
- **3e. 자료는 바꾸지 않는다.** 실제 특성화고 연결 자료(별책23 원문 문장)는 이번에 넣지 않는다. 세션 C가 원문을 대조한 뒤 따로 넣는다.
  - 이번에는 `tools/test_validate_data.py`의 **시험용 사본**으로만 `vocational` 연결 1개를 넣어 통과·실패를 확인한다.
  - `PENDING_P0_CURRICULUM_LINKS`와 단계 검사(`check_curriculum_stages`)가 새 묶음에서 어떻게 동작하는지 읽고, 결과 보고에 적는다. 고칠 필요가 있으면 최소로 고친다.

## 시험 (`tools/test_validate_data.py`)

자료 사본을 고쳐 검사기를 돌리는 기존 시험 방식을 따른다. 아래 시험을 더한다.
- **시세표**
  1. 1품목 rule set(3행)이 통과한다.
  2. 3품목 rule set(9행)이 통과한다.
  3. 행 하나를 지우면 실패한다.
  4. 행 하나를 중복하면 실패한다.
  5. 판매지가 아닌 도시의 SELL 행이 있으면 실패한다.
  6. `index.goods`에 품목이 빠지면 실패한다.
  7. 품목의 판매 거래처가 판매지 하나를 빠뜨리면 실패한다.
  8. 결제일이 판매지 하나를 빠뜨리면 실패한다.
  - 기존 `test_rows`(1014~1021행, 기대 문구 `market_rules: 시세표는 6행이어야 함`)는 새 문구로 고친다. 그 시험이 잡던 경우(행 수 오류)는 새 시험 3·4가 계속 잡아야 한다.
- **HS**
  1. `VERIFIED` + `3304.99` + `HS2022` + 출처가 통과한다.
  2. `VERIFIED`인데 `hs_code`가 `null`이면 실패한다.
  3. `VERIFIED`인데 `hs_code`가 `330499`(점 없음)이면 실패한다.
  4. `NOT_VERIFIED`인데 `hs_code`가 있으면 실패한다.
  5. 상태가 `MAYBE`면 실패한다.
  6. `VERIFIED`인데 없는 출처를 가리키면 실패한다.
- **교과**
  1. `vocational` 연결 1개(`[무일 02-03-02]`, `selection: major_general`, `counts` 갱신)가 통과한다.
  2. 같은 코드를 `social` 연결에 쓰면 실패한다.
  3. `vocational` 연결에 `[12경제04-03]` 형식을 쓰면 실패한다.
  4. `counts.by_group.vocational`을 틀리게 적으면 실패한다.
  5. `VOC` 머리가 아닌 ID면 실패한다.
  6. `vocational`에 `selection: career`를 쓰면 실패한다.

## 고칠 수 있는 파일

- `tools/validate_data.py`(위 세 영역과, 그에 딸린 최소 정리만).
- `tools/test_validate_data.py`.
- `schemas/goods.schema.json`(`hs_mapping_status` enum만). `schemas/curriculum_links.schema.json`은 `group`·`selection` enum을 두는 경우에만 고친다. 지금 enum이 없으면 그대로 둔다.
- `docs/ai/tasks/results/TASK-0060.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `data/**` 전체: 자료 값은 이번에 바꾸지 않는다.
- `src/**` 전체: 엔진·화면·시험.
- `tests/**`, 다른 `schemas/**`, 다른 `tools/**`.

## 지켜야 할 것

- **지금 자료의 검사 결과가 같다.** `python3 tools/validate_data.py`가 PASS다.
  - 검사 개수 줄(`N structural/reference/arithmetic checks`)은 바뀌어도 된다. 바뀐 수와 이유를 결과 보고에 적는다.
  - 지금 자료에 대해 새로 실패하는 검사가 생기면 멈추고 보고한다. 자료를 고쳐 맞추지 않는다.
- 엔진·빌드에 영향이 없다.
  - `node src/engine/sim/run.mjs run`의 400회 출력이 기준과 바이트로 같다(`cmp`).
  - 첫 화면 gzip 변화는 0이어야 한다. 검사기는 빌드 밖이므로 전후 값만 적는다.
- 오류 문장은 지금 검사기처럼 한국어로, 어느 rule set·품목·연결인지 ID를 넣는다.

## 완료 조건

1. 지시 1·2·3 반영.
2. 다음이 모두 통과한다. 규칙 1 골든과 기본 `run` 400회가 바이트로 같다.
   - `python3 tools/validate_data.py` PASS
   - `python3 tools/test_validate_data.py`(unittest, `review_checks.sh`가 부르는 방식) 실패 0
   - `npx vitest run` 실패 0, 시험 1,338개 유지
   - `bash tools/ai/review_checks.sh --check 17c731c` 실패 0
3. 변형 시험: 사본·편집기·되돌림·`cmp` 순서로 한다. 각 변형은 지정한 시험이 실패해야 한다.

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 기대 행 집합에서 SELL 행을 빼고 BUY만 대조 | 시세표 시험 3(행 삭제, SELL 쪽) 또는 5 |
| 2 | 중복 행 검사를 뺌(집합 비교만) | 시세표 시험 4 |
| 3 | `VERIFIED`의 `hs_code` 형식 검사를 뺌 | HS 시험 3 |
| 4 | 교과 코드 형식을 묶음과 무관하게 둘 다 받음 | 교과 시험 2·3 |
| 5 | `check_curriculum_counts` 호출을 뺌 | 교과 시험 4 |

4. 결과 보고 `docs/ai/tasks/results/TASK-0060.md`(공통 머리말 형식). 다음을 적는다.
   - 바꾼 파일과 줄
   - 엔진 단언 위치 대조표(지시 1)
   - 설계 판단
   - 검증 출력, 검사 개수 전후, 변형 표
   - 범위 밖 발견, 질문
   - 범위 밖 발견에 반드시 확인해 적을 것(고치지 않음):
     - (가) `market.ts`의 판매지 고르기는 rule set 전체 `sell_city_ids`에서 고르는가, 품목별 `sell_counterparties`에서 고르는가? 품목마다 판매지를 다르게(예: 김은 상해만) 둘 수 있는지 읽기만으로 판단한다.
     - (나) 913~919행 `expected_counts`의 `goods: 8`·`scenarios: 8`·`market_offers: 6`은 TASK-0065에서 품목·시나리오를 더할 때 바꿔야 한다. 그때 바꿀 줄을 적는다.
