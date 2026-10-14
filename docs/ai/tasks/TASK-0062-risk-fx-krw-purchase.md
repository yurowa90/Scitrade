# TASK-0062 직접 무역 위험 ①: 원화 매입·달러 판매와 참고 환율 경로 (초안)

- **지위: 초안(세션 A, 2026-10-14). 허브 승인과 `<BASE>` 치환 전에는 실행하지 않는다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0060(검사기 자료 기반화) 병합 기록 커밋(허브가 알려 준다, 이하 `<BASE>`). 기준 비교(`review_checks.sh`)와 400회 `cmp`는 `<BASE>`로 한다.
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 2·3·6·7·8·9절. **먼저 읽는다.** 이 지시서와 설계가 다르면 이 지시서가 우선이다.
- 판정 기준: `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.md`. 이 작업은 측정하지 않는다. 측정은 경로 5다.
- 목적: 직접 무역 계약이 수락 뒤 환율 때문에 원화 기준으로 손실이 날 수 있게 한다. 학습목표 O1(환율 판단)의 엔진 바탕이다.

## 원칙

- 새 규칙 판본 `M2a-rules-3`에서만 켠다. rules-1·rules-2의 동작·출력·저장은 바이트로 같다.
- 상태에 새 칸을 두지 않는다. 환율은 `(seed, 흐름 이름, 주차)`의 순수 함수다. **상태 칸을 꼭 더해야 하면 더하지 말고 멈춰 보고한다**(설계 8절).
- 화면(`src/ui/**`)은 고치지 않는다. 새 규칙 시나리오는 이번에 화면에 나오지 않는다.

## 구현 지시

### 1. 규칙 판본과 자료

- `SUPPORTED_RULES_VERSIONS`에 `M2a-rules-3`을 더한다. `scenario.ts:264`의 ‘operations ⇔ rules-2’ 조건을 ‘operations ⇔ rules-2 또는 rules-3’으로 넓힌다.
- `data/market_rules.json`에 `risk_profiles` 배열과 프로필 하나를 더한다(설계 6절의 꼴). 이번에는 `fx` 묶음만 엔진이 읽는다. 나머지 묶음(`tariff`·`surcharge`·`claims`·`collections`)은 자료 꼴과 검사만 넣고 엔진은 읽지 않는다.
- 스키마(`schemas/` 해당 파일)와 `tools/validate_data.py`에 설계 6절의 검사를 넣는다. 반례(확률 합 ≠ 10000, 최소 > 최대, 없는 프로필 참조)가 FAIL하는 검사기 시험을 더한다.
- 시나리오 `operations.risk`(`profile_id`, `layers`)를 읽는 타입과 로더를 더한다. 지금 자료에는 이 칸을 쓰는 시나리오가 없다.

### 2. 참고 환율 경로

- 새 파일 `src/engine/risk.ts`에 `referenceRate(config, seed, day): number`(원/달러, 정수)를 둔다. 설계 3.2의 식 그대로다.
  - 주차는 시세 공개일 기준이다(`publish.first_day`, `interval_days`). 공개일 사이에는 값이 같다. 마지막 공개일 뒤는 마지막 값.
  - `drawUniform`을 커서 상태 없이 부르는 순수 함수로 만든다(흐름 이름 `FX-REF`, 번호 = 주차). **`state.rng`의 커서를 바꾸지 않는다.**
  - `layers`에 `FX`가 없으면 `start_krw_per_usd`를 늘 돌려준다.
- 환전(`exchangeAmounts`, `operations.ts:150`): rules-3이면 기준 환율 자리에 그날 `referenceRate`를 쓰고 차감은 지금 규칙(`spread_basis_points`) 그대로다. 로그 문장의 ‘게임용 고정 환율’을 rules-3에서는 ‘오늘 참고 환율’로 쓴다. rules-2 문장은 그대로다.

### 3. 원화 매입과 혼합 통화 계약

설계 3.3 그대로다. 요점만 적는다.

- 생성기(`market.ts`): rules-3이고 시나리오 위험 설정이 원화 매입이면 매입(`supplier`) 견적의 통화를 KRW, 단가를 원 단위로 만든다. 판매 견적은 USD 그대로다.
- `scenario.ts:268-270`의 단일 통화 거부를 rules-3에서는 ‘매입 견적 KRW, 판매 견적·노선 USD’ 짝만 허용하도록 바꾼다. 다른 짝은 지금처럼 거부한다.
- `acceptTrade`(`engine.ts:308`): rules-3이면 매입·판매 통화가 달라도 받는다. 계약 `currency`는 판매 통화다. 매입 통화는 견적에서 읽는다. 계약·화물·청구서에 칸을 더하지 않는다.
- 자금 검사: 매입은 KRW 가용 자금, 운임·관세 예상은 USD 가용 자금으로 따로 본다. 부족한 통화마다 거절 문장을 따로 낸다.
- 운임·관세: 혼합 통화 계약이면 화물 장부가에 더하지 않고, 같은 계약 ID의 USD 재고 분개로만 쌓는다.
- 인도 때 매출원가: 혼합 통화 계약이면 `COGS-{계약}-KRW`와 `COGS-{계약}-USD` 두 분개를 낸다. rules-2 분개 ID·금액은 그대로다.
- 출항 전 취소·편 놓침: 지금 규칙의 금액을 통화별로 나눠 적용한다(매입 원화는 돌려받지 못함, 운임 환급·취소비는 USD).
- 계약 보고서·결산 읽기 함수(`reports.ts`)가 통화를 섞어 더하는 곳이 있으면 혼합 통화 계약에서 통화별로 나눠 낸다. 두 통화를 더한 값을 만들지 않는다(SPEC 10.4).

### 4. 견적 미리보기와 계약 손익 읽기 함수

- `preview`(`reports.ts:85`)와 `quotePreview`(`readers.ts:31`): rules-3이면 `krw` 묶음 `{ rateKrwPerUsd, purchaseKrw, usdLinesKrw, contributionKrw }`를 더한다. 오늘 참고 환율로 바꾼다. 기존 칸은 rules-2에서 바이트로 같다.
- 새 읽기 함수 `contractRiskReport(state, config, contractId)`(설계 3.4). 이번에는 `components.fx`만 채우고 `tariff`·`surcharge`·`claim`·`collection`은 0이다.
  - 항등식: 끝난 계약에서 `realized − expected = fx + tariff + surcharge + claim + collection`. 원 단위 정수.
  - 달러 줄의 환산일은 그 분개의 날이다. 반올림은 한 함수에서만 한다.
- 실행기 정책은 이번에 고치지 않는다(경로 5 변형 지시서).

### 5. 측정용 설정 변환

- `withRiskLevel(config, level, profile)`을 `src/content` 또는 `src/engine/risk.ts`에 둔다(설계 7절). 이번에는 `R0`(그대로)과 `R1`(rules-3 + 원화 매입 + `FX`)만 만든다. 매입 기준가는 USD 기준가 × `start_krw_per_usd`를 원 단위 half-up으로 바꾼다.
- 실험 시나리오 ID를 자료에 더하지 않는다.

### 6. 저장·불변식

- 저장 형식은 6 그대로다. `save-shape.ts`는 열거 값 추가만 한다(필요할 때).
- `operations-invariants.ts`: 혼합 통화 계약은 매입 견적 KRW·판매 견적 USD·계약 통화 USD여야 한다. 다른 짝이면 불러오기를 거부한다(기존 `SaveError` 경로).

## 시험(새 파일 `src/engine/m2a5-risk-fx.test.ts`)

- 시험은 옛 운영 시나리오에 `withRiskLevel(…, 'R1', 자료의 첫 프로필)`을 걸어 만든다. **시험에 자료 ID·조정 상수를 쓰지 않는다**(TASK-0027 R1). 값이 필요하면 프로필에서 읽는다.

| 시험 | 확인할 것 |
|---|---|
| 옛 값 불변 | rules-2 운영 시나리오에서 첫 묶음 견적·미리보기·한 계약의 원장이 `<BASE>`와 같다. 시드 하나로 90일을 돌린 `state.rng.cursors` 키 목록이 `<BASE>`와 같다(새 흐름을 뽑지 않음) |
| 환율 순수성 | 같은 (seed, day)는 같은 값. 공개일 사이 같은 값. 값이 늘 [min, max] 안. 이웃 주의 변화율이 `step_bp` 안. 시드 두 개가 어느 주에서 다르다(찾아서 확인) |
| 환율 상태 무관 | `referenceRate`를 여러 번 불러도 `state`가 같다. 저장·불러오기 뒤 같은 날 값이 같다 |
| 환전 | rules-3 환전의 원화 금액 = USD × (그날 참고 환율 ∓ 차감). 환율이 바뀐 날을 찾아 두 날의 금액이 다른 것을 본다 |
| 원화 매입 계약 | R1에서 직접 무역을 받으면 매입 분개는 KRW, 운임 분개는 USD, 인도 때 COGS가 통화별 두 분개. 통화별 원장 합이 0(항등식) |
| 자금 검사 | KRW가 모자라면 KRW 문장으로, USD가 모자라면 USD 문장으로 거절 |
| 취소 | 혼합 통화 계약 출항 전 취소의 통화별 금액 |
| 손익 읽기 | 끝난 계약에서 분해 항등식. 환율이 수락일과 수금일 사이에 바뀐 계약을 찾아 `components.fx ≠ 0`이고 부호가 환율 방향과 맞다(원화 강세면 음수) |
| 결정성 | 같은 시드·같은 명령 두 번이면 같은 상태 JSON |
| 저장 | R1 진행 상태 저장·불러오기 왕복이 같다. 옛 저장 시험은 그대로 통과 |
| 불변식 | 혼합 통화 짝을 바꾼 저장 사본을 거부 |

## 변형 시험

결과 보고에 각 변형과 잡은 시험을 표로 적는다.

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | rules-2 환전에도 참고 환율을 씀 | 옛 값 불변(또는 기존 환전 시험), 400회 `cmp` |
| 2 | `referenceRate`가 `state.rng` 커서를 씀 | 환율 상태 무관, 옛 값 불변의 커서 키 |
| 3 | 손익 읽기가 수금일 달러 줄도 수락일 환율로 바꿈 | 손익 읽기(fx ≠ 0) |
| 4 | 매출원가를 한 통화 분개 하나로 냄 | 원화 매입 계약(통화별 항등식) |
| 5 | 자금 검사를 한 통화로 합침 | 자금 검사 |
| 6 | 공개일이 아닌 날에도 환율이 바뀜 | 환율 순수성 |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `market.ts`, `operations.ts`, `readers.ts`, `reports.ts`, `catalog.ts`, `types.ts`, `operations-invariants.ts`, `save-shape.ts`(열거 값 추가만), 새 `src/engine/risk.ts`
- `src/content/scenario.ts`
- `data/market_rules.json`(`risk_profiles` 추가만), 해당 스키마, `tools/validate_data.py`(위험 프로필 검사만)와 그 시험
- 새 `src/engine/m2a5-risk-fx.test.ts`
- `docs/ai/tasks/results/TASK-0062.md`, `MANIFEST.json`

## 손대지 않을 파일

- `src/ui/**`, `src/engine/sim/**`, `data/scenarios.json`, `data/goods.json`, 다른 `data/**`, `vite.config.ts`, `package*.json`, `index.html`
- 기존 시험의 단언

## 지켜야 할 것

- 400회 `cmp`가 `<BASE>`와 같다. P0-M2A5 골든값 불변. 옛 저장 시험 통과.
- 첫 화면 gzip 전후를 적는다. **+2,500 B를 넘으면 멈추고 보고한다.**
- `any`를 새로 쓰지 않는다. 돈은 정수 최소 단위다.

## 완료 조건

1. 지시 1~6 반영, 시험 표의 시험 모두 통과.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과.
3. 변형 6개가 모두 잡힌다.
4. 바꾼 파일이 ‘고칠 수 있는 파일’ 안이다.

## 결과 보고에 넣을 것

- 바꾼 곳(파일·함수)과 이유, rules-2와 rules-3 분기 목록
- 상태 칸을 더하지 않았다는 확인(또는 멈춘 이유)
- R1로 시드 하나를 90일 돌린 요약: 직접 무역 계약 수, `contractRiskReport`의 기대·실현·fx 분포(최소·중앙·최대), 원화 기준 손실 계약 수. **값을 고치지 않고 적기만 한다**
- 첫 화면 gzip 전후, 시험 수, 400회 `cmp` 결과, 변형 표
- 범위 밖 발견과 질문
