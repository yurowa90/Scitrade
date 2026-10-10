# TASK-0028 M2a-5 읽기 함수·비교 실행기·D03 재측정 (규칙 2) — 초안

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- **상태: 초안이다. 실행하지 않는다.** TASK-0027(엔진 핵심)이 개발 브랜치에 병합된 뒤, 세션 A가 그 위의 행 번호와 Q12 결정(`docs/ai/design/m2a5-review/QUESTIONS.md`)을 반영해 고쳐 쓴다.
- 나눈 이유: `docs/ai/design/m2a5-review/REVIEW3.md` 3절. 아래 절은 TASK-0027 초안(`e3b9f30`)의 지시 14·18·20과 비교 실행기 시험을 옮긴 것이다. 지시 번호는 원래 번호를 그대로 둔다.
- 명세: `docs/ai/design/M2A5-SPEC.md` 14·17절, 인수 명세 P0-M2A5-17.

## 이 작업이 하는 것

1. 화면 재료 읽기 함수: `quotePreview`(명세 14.3), `exchangePreview`(14.4), `warehouseSummary`(14.5), `hiringOutlook`(14.6, Q12 결정 반영), `upcomingPayments`(14.8). `marketTable`·`payrollRunwayDay`·`paymentDefaultStatus`·장부 보고는 TASK-0027이 한다.
2. 비교 실행기 규칙 2 정책·지표·`d03` 명령(지시 18).
3. D03 20시드 재측정과 보고(지시 20). Q1이 ‘나’로 정해지면 확정 기준에 직접 무역 비중 하한, Q12가 ‘가’로 정해지면 J6(병목 표 부호와 실제 판정의 일치 비율)을 더한다.
4. 인수 명세 P0-M2A5-17, `review_summary` 35건.
5. Q10이 ‘나’(하루 비례·상한)로 정해지면 `d03`은 정액 200 USD 변형도 함께 잰다. 상한이 계약 금액 30%·100% 가운데 미정이면 둘 다 잰다.

## TASK-0027 초안에서 옮긴 절 (행 번호는 병합 뒤 다시 씀)

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


### 20. D03 재측정 실행과 보고

- 모든 검증이 끝난 뒤 실행한다: `node src/engine/sim/run.mjs d03 --out /tmp/TASK-0027-d03.json > docs/ai/tasks/results/TASK-0027-d03.md`.
- 걸린 시간을 결과 보고에 적는다. 1시간을 넘을 것 같으면 먼저 `--seeds 5`로 돌려 시간을 재고, 20시드 전체를 돌린다. 20시드를 끝내지 못하면 몇 시드까지 했는지 적는다(통과로 쓰지 않는다).
- 결과 보고 ‘D03 재측정’ 절에 표 ①~⑧을 옮기고, J1~J5마다 통과·실패와 근거 수를 적는다. 명세 17.2의 모형 값과 다른 칸(부호가 다르거나 ↑·↓가 바뀐 칸)을 목록으로 적고, 원인 추정(정책 차이 등)을 한 줄씩 적는다.
- **값을 고치지 않는다.** 기준을 벗어나도 그대로 보고한다. 조정은 Claude가 한다.


## 옮긴 시험

**`src/engine/sim/m2a5-sim.test.ts`**
- `P0-M2A5-17 비교 실행기`: 기본 `runSuite()`의 시나리오 목록이 `SCENARIO_IDS`와 같다. 새 시나리오 시드 1개로 `IDLE` 71일 실패, `NO_FX` 실패, `MAX_CONTRIBUTION` 완료·끝 원화 미지급 0·통화별 항등식(이체 포함), 규칙 2 `appliedByType` 키 목록 전체. `MAX_CONTRIBUTION`은 늦은 편을 예약하지 않고 `LATE_OK`는 한다(같은 시드에서 늦은 인도 1건 이상이 있는 시드를 찾아 확인). 같은 입력 두 번이면 같은 출력. `d03`을 `--seeds 1`로 돌리면 표 ①~⑧ 제목이 있다. 변형 이름의 고용 후보가 처리량으로 정해진다(이름 바꾸기 설정에서도 같은 지표).
- 읽기 함수 시험(새 파일 `src/engine/m2a5-readers.test.ts`): `quotePreview`·`exchangePreview`(문장 반례 S15)·`warehouseSummary`·`hiringOutlook`·`upcomingPayments`의 기대값 전체를 `toEqual`로.

## 옮긴 완료 조건·변형 시험

- `docs/ai/tasks/results/TASK-0028-d03.md`가 있고 20시드 표다.
- 변형: 규칙 2 `MAX_CONTRIBUTION`의 정시 거르기 제거, 기본 `runSuite` 시나리오에 새 시나리오를 넣음, 환전 정책 제거, 규칙 2 판단을 `config.id`로 → `P0-M2A5-17 비교 실행기` 또는 `sim.test.ts` ‘8 소스 검사’가 실패.
- 기본 `run` 회귀: 작업 전후 `compare` ‘같음’, `cmp` 바이트 같음.
