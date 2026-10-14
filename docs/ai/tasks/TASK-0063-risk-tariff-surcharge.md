# TASK-0063 직접 무역 위험 ②: 계약 뒤 관세 변경과 출항 부대비 (초안)

- **지위: 초안(세션 A, 2026-10-14). 허브 승인과 `<BASE>` 치환 전에는 실행하지 않는다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0062 병합 기록 커밋(이하 `<BASE>`).
- 설계: `docs/ai/design/path3-price-risk-2026-10/DESIGN.md` 4·6·8·9절. TASK-0062의 원칙(새 규칙 판본에서만, 상태 칸 없음, 화면 없음)은 그대로다.
- 목적: 수락 뒤 도착 전에 관세가 바뀌거나 출항 주 부대비가 붙어 원가가 바뀌게 한다. O2(비용 분담 판단)와 일반계 [12경제04-02] 관세의 효과, 특성화고 [수입 05-05-02]의 바탕이다.

## 구현 지시

### 1. 관세 표와 변경 일정

- rules-3이고 `layers`에 `TARIFF`가 있으면 `dutyEstimate`(`catalog.ts:75`)가 프로필의 `tariff.base`(도착국·품목별 기준 세율)를 읽는다. 없으면 지금 시나리오 고정 세율 그대로다. rules-2는 바뀌지 않는다.
- 변경 일정은 순수 함수 `tariffEvents(config, seed)`다. 값마다 흐름 이름을 나눈다(예: `TARIFF:{국가}:count`, `TARIFF:{국가}:{회차}:notice`, `…:step`). 사건마다 공지일·시행일(공지 + `notice_days`)·새 세율. 횟수는 0~`max_changes`, 걸음은 `step_bp` 범위, 결과는 `[min_bp, max_bp]` 안. 공지일은 캠페인 안에서 고르게 뽑되 시행일이 캠페인 끝을 넘지 않게 한다.
- 관세를 매기는 곳(`engine.ts:1019` 근처, 도착 처리)은 **도착일의 세율**을 쓴다.
- 미리보기 관세 예상은 **오늘까지 공지된** 변경만 반영한다(도착 예정일 기준 세율). 공지 전 변경은 반영하지 않는다.
- 공지일 아침 처리에서 로그 한 줄(‘{도착국} {품목} 관세 {옛 세율}% → {새 세율}%, {시행일}일부터’). 국가 이름은 시나리오 도시 자료에서 읽는다.
- 읽기 함수 `tariffSchedule(state, config)`: 오늘까지 공지된 사건만 돌려준다.

### 2. 출항 부대비

- rules-3이고 `layers`에 `SURCHARGE`가 있으면, **직접 무역** 예약의 **출항일**에 `예약 운임 × surchargeBp(노선, 출항 주) / 10000`을 USD로 낸다(`payOrAccrue`, 미지급 규칙 그대로). 0이면 분개를 내지 않는다.
  - `surchargeBp`는 순수 함수. 흐름 이름은 `SURCHARGE:{노선}:{주차}:zero`, `…:value`처럼 값마다 나눈다. 확률 `p_zero_bp`로 0, 아니면 `[min_bp, max_bp]` 정수 균등.
  - 계약 ID의 USD 재고로 쌓는다(TASK-0062 규칙).
  - **주선 화물에는 붙이지 않는다**(설계 4.2: 실무처럼 화주에게 넘긴다. 회사 장부에 생기지 않는다).
  - 분개 ID `SURCHARGE-{예약}`. 로그 한 줄.
- 미리보기: `surchargeMaxBp`(프로필의 최대)만 읽을 수 있게 한다. 기대 마진 계산에는 넣지 않는다(학생이 모르는 값).

### 3. 손익 읽기

- `contractRiskReport.components`의 `tariff`(3번)와 `surcharge`(4번)를 설계 3.4의 순차 대체 순서대로 채운다. `residual`은 늘 0이다.

### 4. 측정용 변환

- `withRiskLevel`에 `R2`(R1 + `TARIFF` + `SURCHARGE`)를 더한다.

## 시험(새 파일 `src/engine/m2a5-risk-cost.test.ts`)

| 시험 | 확인할 것 |
|---|---|
| 옛 값 불변 | rules-2와 R1의 관세·운임 분개가 `<BASE>`와 같다 |
| 관세 일정 순수성 | 같은 시드 같은 일정. 횟수·세율 범위·시행일 ≤ 캠페인 끝. 시드를 찾아 변경이 있는 일정과 없는 일정을 각각 확인 |
| 도착일 세율 | 수락 뒤 공지된 변경이 도착 전에 시행되는 계약을 찾아, 관세가 새 세율이고 `components.tariff`가 예상과의 차이와 같다 |
| 공지 반영 | 공지 뒤 받은 견적의 미리보기 관세가 새 세율(도착 예정일이 시행일 뒤일 때) |
| 비공지 미반영 | 공지 전 미리보기는 옛 세율 |
| 부대비 | 직접 무역 출항일에만 분개. 0인 주는 분개 없음. 주선 화물엔 없음. `components.surcharge` 일치 |
| 항등식 | 끝난 계약마다 `residual = 0` |
| 흐름 유일성 | 새 흐름까지 (흐름, 번호) 쌍이 겹치지 않는다 |
| 결정성·저장 | 같은 입력 같은 결과, 저장 왕복 같음, `state.rng.cursors`에 새 흐름 키 없음 |

- 시험에 자료 ID·조정 상수를 쓰지 않는다. 필요한 사건은 시드를 찾아서 만든다(시드 200개 안, 찾았는지 먼저 단언).

## 변형 시험

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 관세를 수락일 세율로 매김 | 도착일 세율 |
| 2 | 미리보기가 공지 전 변경까지 반영(미래 누설) | 비공지 미반영 |
| 3 | 부대비를 예약일에 냄 | 부대비 |
| 4 | 부대비를 주선 화물에도 붙임 | 부대비 |
| 5 | `components.tariff`를 0으로 둠 | 도착일 세율 또는 항등식 |

## 고칠 수 있는 파일

- `src/engine/engine.ts`, `catalog.ts`, `operations.ts`, `readers.ts`, `reports.ts`, `reservations.ts`, `risk.ts`, `types.ts`, `invariants.ts`, `operations-invariants.ts`
- `data/market_rules.json`(프로필의 `tariff`·`surcharge` 값 꼴 맞춤만), 스키마, `tools/validate_data.py`(관세 표의 도착국·품목 검사만)
- 새 `src/engine/m2a5-risk-cost.test.ts`
- `docs/ai/tasks/results/TASK-0063.md`, `MANIFEST.json`

## 손대지 않을 파일

TASK-0062와 같다(`src/ui/**`, `src/engine/sim/**`, 시나리오·품목 자료 등).

## 지켜야 할 것과 완료 조건

- TASK-0062와 같다: 400회 `cmp`, 골든값, 옛 저장, 첫 화면 gzip +2,500 B 상한, `review_checks` 14종, 변형 5개 검출.

## 결과 보고에 넣을 것

- 시드 몇 개의 관세 변경 일정과 부대비 표(순수 함수 출력), 시험 구동기로 만든 계약의 `components` 표(값을 고치지 않고 적기만). 90일 정책 실행은 경로 5에서 한다.
- 첫 화면 gzip 전후, 시험 수, `cmp`, 변형 표, 범위 밖 발견, 질문.
