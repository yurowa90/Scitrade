# 판정표 v2 측정 계획(허브, 2026-10-24)

- 지위: **허브 초안, 세션 A 확인 전.** 판정 기준이 아니다. 기준은 `docs/ai/design/precommit-d03-2026-10/JUDGMENT_TABLE.v2.md`(승인 `b51ee20`)와 그 0절 고정 기록이다.
- 이 문서는 명령과 순서만 정한다. 판정표와 어긋나면 판정표를 따른다.

## 1. 시작 조건

- 측정은 별도 작업 트리에서 한다. 개발 브랜치의 고정 기록 커밋을 `git worktree add --detach`로 꺼낸다.
- 시작 전에 다음을 확인하고 RUNLOG에 적는다.
  - `data/market_rules.json` sha256이 0절 기록값 `e4fa3308…f4ca`와 같다.
  - `check_profile_v2.py`가 `DIFF 0`이다.
  - 골든 둘(`check_rules2_golden.mjs`, `check_rules3_golden.mjs`)이 종료 0이다.
  - `python3 tools/validate_data.py`가 통과한다.
- 시드는 판정표 v2 4절을 따른다.
  - 기준 시드: 1061~1100(`--seed-base 1061 --seeds 40`). 손잡이 조정도 이 시드로만 한다.
  - 표본 밖 1: 1101~1140. 조정이 끝난 뒤 한 번만 돌린다.
  - 2001 이상은 시험용 시드다. 측정에는 쓰지 않는다.
- 묶음은 `--policies` 없이 둔다. 그러면 실행기가 `d03PolicyIdsV2(level)`을 쓴다. R0P·R4는 전체 묶음, R1~R3은 줄인 묶음이다(판정표 1절, TASK-0068a-R1 compat-1 시험).
- 프로필은 기본값 `RISK_PROFILE_V2`, 지연 모드는 `base`, 회차는 `--round 0`부터 시작한다.

## 2. 0회차 명령(기준 시드)

| 순서 | 명령 | 예상 |
|---|---|---|
| 1 | `node src/engine/sim/run.mjs d03 --risk-v2 R0P --round 0 --seed-base 1061 --seeds 40 --workers 4 --out V2-R0P.json` | 전체 묶음, 가장 오래 걸린다 |
| 2 | `… d03 --risk-v2 R1 --round 0 --seed-base 1061 --seeds 40 --workers 4 --out V2-R1.json` | 줄인 묶음 |
| 3 | `… d03 --risk-v2 R2 … --out V2-R2.json` | 줄인 묶음 |
| 4 | `… d03 --risk-v2 R3 … --out V2-R3.json` | 줄인 묶음 |
| 5 | `… d03 --risk-v2 R4 … --out V2-R4.json` | 전체 묶음 |
| 6 | `… d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1061 --seeds 40 --workers 4 --out V1-R0.json` | R0 열 기록용(선택, 판정에 쓰지 않음) |
| 7 | `… v2-report V2-R0P.json V2-R1.json V2-R2.json V2-R3.json V2-R4.json --r0 V1-R0.json > V2-REPORT-r0.md` | 6열 표와 단계별 근거 |
| 8 | `… risk-compare-v2 V2-R2.json V2-R3.json`, `… risk-compare-v2 V2-R3.json V2-R4.json` | L2(판정), 나머지 비교는 진단 |

- 회차마다 각 명령의 시작·끝 시각, 종료 코드, 출력 JSON·표의 sha256을 RUNLOG 표에 적는다(판본 1과 같은 양식).
- 예상 시간은 작업자 4명 기준 약 1시간이다. 판정표 1절의 1시간 40분은 작업자 1명당 2.1초로 잡은 값이다. 실측이 크게 다르면 RUNLOG에 적는다.

## 3. 판정과 조정

- 판정은 `v2-report`의 6열 표와 L2 비교 결과로만 한다. 판정표 3절이 기준이다.
- 어긋나면 판정표 5.1 우선순위(J1 > L1 > L2 > J9 > J7 > J4d)와 5.3 순서대로 손잡이 하나를 정한다. 그 회차 프로필을 커밋한 뒤 전체를 다시 잰다. 최대 3회다.
- 조정 프로필은 `RISK_PROFILE_V2`의 값만 바꾼다. 바뀐 값, 새 sha256, 대조 결과를 회차 문서(`V2-ROUND-n.md`)에 적는다.
- 모든 판정이 통과하면 표본 밖 1(1101~1140)을 한 번 돌린다. 최종 판정은 기준 시드와 표본 밖 1이 둘 다 통과해야 한다.

## 4. 보고에 함께 적을 해석(측정 전 고정)

- J9 행: H30-2 문구를 그대로 적는다. TERM_GREEDY와 기준 회사의 직접 무역 수도 적는다.
- 진단 J8·L4·V: 사전 기대는 유동성 효과를 뺀 값이다(H28-1). 사전 기대와 실측의 차이가 이 기제로 설명되는지만 적는다.
- 진단 거절: 짝 수와 견적 수가 모든 정책에서 같으면, ‘(다)에서 짝 단위는 H24 거절 해석에 정보를 더하지 않는다’고 적는다(세션 A 관찰, R1 재검수).
- 진단 C: 성분 아홉으로 센다(H29-1).
- L2 ②는 판본 1 행 정의를 따른다(H27-1).

## 5. 하지 않는 것

- 판정 기준과 사전 기대를 측정 결과를 보고 옮기지 않는다.
- 표본 밖 시드로 조정하지 않는다.
- 측정 중에는 개발 브랜치 코드를 바꾸지 않는다. 엔진 결함(J1)이 나오면 멈추고 보고한다.
