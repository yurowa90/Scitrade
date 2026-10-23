# 경로 5 측정 실행 기록

- 계획서: `PLAN.md`(허브 승인 `e8ee6b1`). 측정 커밋 `e8ee6b1`(0회차). 세션 A 컨테이너, 작업 트리는 `e8ee6b1`을 분리 체크아웃한 별도 작업 트리(`node_modules` 심볼릭 링크 하나만 추적 밖)다.
- JSON·표는 저장소 밖(세션 A scratchpad `measure/r<회차>/`)에 두고 여기에는 sha256만 적는다. 시각은 KST다.

## 0회차

### G0 측정 전 확인(2026-10-23)

| 항목 | 결과 |
|---|---|
| 측정 커밋 | `e8ee6b19b45e4023540fe8e2f8ea8ef73cf87a5d` |
| `data/market_rules.json` sha256 | `a9a3eb45f395222613b6fca9893146863a99c6644fb00fa9cbc1bbc82c48b742` = 고정 기록 |
| 골든 검사기 | 종료 0(rules-2 105회, rules-1 400회 일치) |
| 프로필 대조(`check_profile_vs_design.py DESIGN.md data/market_rules.json data/goods.json`) | `DIFF 0`, 출력 sha256 `8fab8fe27b51bccfa4e450908fd9c1117a965779a1755b9e14acccf6242689e8` = 고정 기록 |
| `validate_data.py` | 통과 |

G0 통과.

### 단계

| 단계 | 명령 | 시각(소요) | 종료 | 출력 sha256 |
|---|---|---|---|---|
| 1 | `sim d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPERATIONS --seed-base 1001 --workers 4 --out GA-R0-base.json` | 10-23 19:59:40~20:20:00 (1220s) | 0 | json `102ec19a561eb2c5864299bd913acf2d7166b852685bce58de7094a60ea79a70` · md `1e55a5272c82fafb4404edef422d878e0cc9ddfb40415fc6b10e30fac5cdd8f7` |
| 2 | `sim d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPERATIONS --seed-base 1001 --workers 4 --policies MAX_CONTRIBUTION,MARGIN_BUFFER,FOCUS --out GA-R0-new2.json` | 10-23 20:20:17~20:20:41 (24s) | 0 | json `bc1724d8e03c5755f6887415f84d395cb4840f2b105323f764f7689253562017` · md `0f9a258cdbe952afec693899230fdcfee8fedbcf5acb6bdf494239db9d24ea14` |

### G1 (가)·R0 대조(단계 3) — 통과

`GA-R0-base.md`(출력 1)와 `docs/ai/tasks/results/TASK-0032-d03.md`를 PLAN 2절 규칙으로 대조했다.

- 표 ①: 다섯 행 전체가 글자까지 같다(`diff` 0).
- 표 ⑤ 근거 수: J1·J2·J2b·J3·J5·J6·J7의 근거 문장이 같다. J4의 숫자(최대 묶음 10견적, 준비 2~12pt, NO_FX 실패 20/20, USD 중앙 20,778)가 J4a~c·J4d 두 행에 그대로 있다.
- 결과 글자 차이(대조 대상 아님): J2b ‘통과’ → ‘진단’(판정 종류 표), J4 → J4a~c·J4d로 나뉨, J7 → ‘J7(옛 정의)’.
- 출력 2의 `MAX_CONTRIBUTION` 20회는 출력 1의 같은 20회와 바이트 단위로 같다. `meta.risk`도 같다(허브 답 7-1).
