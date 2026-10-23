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
| 4 | `sim d03 --risk R1 --round 0 --scenarios SCENARIO_M2_OPERATIONS --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GA-R1-red.json` | 10-23 20:21:11~20:21:59 (48s) | 0 | json `6eea3cbe206e7a01cf85f65f6e4caf711e3439a464165e27eca8f11481f2fedf` · md `36b70b59ddee76b0fa05f4a2ed3df23c3909cf6cbea4da4060df51136ab0abbe` |
| 5 | `sim risk-compare GA-R0-new2.json GA-R1-red.json` | 10-23 20:22 | 0 | md `813efc60c9c4870239dc251c2d65f1adda3f810a7d0e5e49ee52a3a231e8ae78` |
| 6a-base | `sim d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPS_COSMETICS --seed-base 1001 --workers 4 --out GN-R0-base.json` | 10-23 20:22:29~20:38:35 (966s) | 0 | json `6b770e8459e1cbf9ce7e34881db33c14928f924b116c25365fb43ee11ee358b3` · md `dee337762e26dc3f90292dca174ca2e310829431e9f98b3eedb728787db7a01d` |
| 6a-new | `sim d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPS_COSMETICS --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GN-R0-new.json` | 10-23 20:38:35~20:38:48 (13s) | 0 | json `6b89341e0bf945b05e0454c9c69d7f2c823654bf95f3144d2260ece73462ca0b` · md `abdfb58aa42e7d9fdda341e196a6e9c2dc2dfd7614d5bc638f2ca0023b1d8e08` |
| 6a-full | `sim d03 --risk R0 --round 0 --tables-from GN-R0-base.json,GN-R0-new.json --out GN-R0-full.json` | 10-23 20:38:48~20:38:54 (6s) | 0 | json `fa2052a3d8092b6100f44deb5b4a53238e9a5912d22ad1403d4305dc621bb7a4` · md `b914575b139dc4ff056476a759413288e0b507c9ccd9645736616d047346dac6` |
| 6b-base | `sim d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1001 --workers 4 --out GD-R0-base.json` | 10-23 20:38:54~21:01:05 (1331s) | 0 | json `ec20b24eae5b034322144b2acb7b69cf6e0de115c94738da4f3d8bfcf575372d` · md `578a71aae8c8bbfa8ac98741a173c0c86c5fa2576d9384d1eb04b262b2816e56` |
| 6b-new | `sim d03 --risk R0 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GD-R0-new.json` | 10-23 21:01:05~21:01:19 (14s) | 0 | json `00ced2d95562ae78a952d46bef667b1824fbf479d243bd485b8ae0e80e13041e` · md `a2239d650ce89e21a4b1841c237644a168e6ce2cd47d002c9d0e2b06473142cc` |
| 6b-full | `sim d03 --risk R0 --round 0 --tables-from GD-R0-base.json,GD-R0-new.json --out GD-R0-full.json` | 10-23 21:01:19~21:01:25 (6s) | 0 | json `64a775a321bcfdffbd88ebbaf26da690ac51b98e2865659048daaadbf23a3d5b` · md `7a3a59ef918c719229fadf22f4b3bca15db459a68932f6e0c744045c9325aed2` |
| 7a-base | `sim d03 --risk R3 --round 0 --scenarios SCENARIO_M2_OPERATIONS --seed-base 1001 --workers 4 --out GA-R3-base.json` | 10-23 21:01:25~21:23:29 (1324s) | 0 | json `19920565875b2bbbd8a8927b76d4a8a852233dcfd91c13ac828144f6fa76edcb` · md `38b869b908c3699c4a0dea463a81d57ff7903cafa607feb0b21a31d6204d2398` |
| 7a-new | `sim d03 --risk R3 --round 0 --scenarios SCENARIO_M2_OPERATIONS --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GA-R3-new.json` | 10-23 21:23:29~21:23:52 (23s) | 0 | json `07cebef5aeb0af9fa167afde9aa5c71c09fdf38a310bf9ec7f14cfb806f660b3` · md `a2ac1a4b4f796764d4949f512a7578e5d3fe41a7051009d93399ec3866998bfe` |
| 7a-full | `sim d03 --risk R3 --round 0 --tables-from GA-R3-base.json,GA-R3-new.json --out GA-R3-full.json` | 10-23 21:23:52~21:23:57 (5s) | 0 | json `95784a9ff9d7dc3326770550e9438ed81312ada6adc892e90197e28bf4c0ac66` · md `8b1108c86e2529680dedeffc866b404d2e0a9843a1ca3eecd06d5c9bc3f44bf1` |
