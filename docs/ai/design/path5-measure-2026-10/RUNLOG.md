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
| 7b-base | `sim d03 --risk R3 --round 0 --scenarios SCENARIO_M2_OPS_COSMETICS --seed-base 1001 --workers 4 --out GN-R3-base.json` | 10-23 21:23:57~21:42:48 (1131s) | 0 | json `b886dff54fe11afb293c30589745f1ccfcc9f7d560019a3115d252e57afe8729` · md `b52f8ff5cf8304ec0f6be55d831c5da03ba70dc3880e6543d7a8348855c5b5da` |
| 7b-new | `sim d03 --risk R3 --round 0 --scenarios SCENARIO_M2_OPS_COSMETICS --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GN-R3-new.json` | 10-23 21:42:48~21:43:06 (18s) | 0 | json `d0e5bbe3afe37fbb8f6a4c998a969d0eecbf79ebe95969d225df610a7df27091` · md `cbdbbaf5bc0c89b311a74ca182fb6fc7fb95c81ecba796955dcb06e926c14599` |
| 7b-full | `sim d03 --risk R3 --round 0 --tables-from GN-R3-base.json,GN-R3-new.json --out GN-R3-full.json` | 10-23 21:43:06~21:43:11 (5s) | 0 | json `bb8a208c156af16e642c965f9a3dc937ba8101b53120a266543b480bf2753683` · md `c04f2220d7423fc89f1d9e362a912cc6d60b78f336ce6ccfe0a44b39dbadd3b8` |
| 7c-base | `sim d03 --risk R3 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1001 --workers 4 --out GD-R3-base.json` | 10-23 21:43:11~22:03:43 (1232s) | 0 | json `4b795d399709ef3ff5894a04ce8497f48eb5c118203734f6b262fd7fd3364265` · md `308f16e2160aafb87d51867521881f38bf6af6807bdb0f4f11ad89e99e0d5767` |
| 7c-new | `sim d03 --risk R3 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GD-R3-new.json` | 10-23 22:03:43~22:04:03 (20s) | 0 | json `4fa07b5749e0cf49c9f3f8706faa58b68f7346832314b3213cdefd3d95edc5ae` · md `a55d9bb49053faa0b9bd26921d939db9465c617c80e7700b08f538434725ed46` |
| 7c-full | `sim d03 --risk R3 --round 0 --tables-from GD-R3-base.json,GD-R3-new.json --out GD-R3-full.json` | 10-23 22:04:03~22:04:08 (5s) | 0 | json `4211ab3152aa2b7d992c2df2f9a0263bdcc44ba802ddf58ce9af33a5c3f8bf8f` · md `d33ac4dbfb49894f93de8887d74e5fa5f1827792f4e82725e232e1adf8ed1703` |
| 8a | `sim d03 --risk R1 --round 0 --scenarios SCENARIO_M2_OPS_COSMETICS --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GN-R1-red.json` | 10-23 22:04:08~22:04:47 (39s) | 0 | json `3089fa03a473e7ce7ca2d624f1f4d399ee7d1dad66417092d21c9254fe95f1e5` · md `354ad788ce159432c36d4287a88eca170dcacd07bcbab007784ede104c9e54cc` |
| 8b | `sim d03 --risk R1 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GD-R1-red.json` | 10-23 22:04:47~22:05:32 (45s) | 0 | json `86d2d8b99bb76b18afd8f3bdfc032614c9963793acd148ff761e91fe13bd5dca` · md `609e3de21549669ee216f79726b34bc2d0d398791c2436ff43bd7feda651d491` |
| 8c | `sim d03 --risk R2 --round 0 --scenarios SCENARIO_M2_OPERATIONS --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GA-R2-red.json` | 10-23 22:05:32~22:06:19 (47s) | 0 | json `284d6628b19e77c081cd342b35f4d9517270dfa46dfcf01445ff4d0cfce97db1` · md `353f32432ad77f1c20d793d9550faf5254b8d122072aa4f79c09339506f35f8c` |
| 8d | `sim d03 --risk R2 --round 0 --scenarios SCENARIO_M2_OPS_COSMETICS --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GN-R2-red.json` | 10-23 22:06:19~22:06:58 (39s) | 0 | json `5644257c05d33fb09c90e679a763eefc1638006c6d119b05fc98a33a8046b792` · md `cd4e80cfc613a1ba269e57aab7cf19b6d6580f2d8a223402d2807c84d5764bd2` |
| 8e | `sim d03 --risk R2 --round 0 --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GD-R2-red.json` | 10-23 22:06:58~22:07:42 (44s) | 0 | json `4b4df92f85ca6e3b0164dd32e585b6557cf0db3400073e668375cad59e285c11` · md `83fc475721e642d06076031f8b3becdf80df3d9894d85d7c6033d45e019ea1bb` |
| 9 | `sim risk-compare GA-R0-new2.json GA-R1-red.json` | 10-23 22:08 | 0 | md `813efc60c9c4870239dc251c2d65f1adda3f810a7d0e5e49ee52a3a231e8ae78` |
| 9 | `sim risk-compare GA-R1-red.json GA-R2-red.json` | 10-23 22:08 | 0 | md `2183e57486fbda81c08ddf30ab0a7600c2199b4472ef1d8d2e0ef58469798fa9` |
| 9 | `sim risk-compare GA-R2-red.json GA-R3-full.json` | 10-23 22:08 | 0 | md `ff57c86294ab103eed24ebed2b0a5146d9d65d40d1399ce0ccb7a99f80d73cc9` |
| 9 | `sim risk-compare GN-R0-full.json GN-R1-red.json` | 10-23 22:08 | 0 | md `df7b5b69b8f97232528879dffadc8a7f83d8183e26b8cfe076fa44c9502faa10` |
| 9 | `sim risk-compare GN-R1-red.json GN-R2-red.json` | 10-23 22:08 | 0 | md `b66eca0b47b76955d9d874868d793bf4054d531f5fb2c13e368433c2075ef8ac` |
| 9 | `sim risk-compare GN-R2-red.json GN-R3-full.json` | 10-23 22:08 | 0 | md `e4784dda84ce012b1e6fef9adf618346cb9fe393d1910f506014801b63aae008` |
| 9 | `sim risk-compare GD-R0-full.json GD-R1-red.json` | 10-23 22:08 | 0 | md `0056b562a41185ee2cfa909a96a32e17b41842b16a3ffc20bf1392b5634d4015` |
| 9 | `sim risk-compare GD-R1-red.json GD-R2-red.json` | 10-23 22:08 | 0 | md `4b207bd81f78d69ad263b2928071bbcc54fc706ca232ba400ad900fb37177320` |
| 9 | `sim risk-compare GD-R2-red.json GD-R3-full.json` | 10-23 22:08 | 0 | md `56fdfc0cfa319dcdd41e90a8278164b137100a62d339d13b7d65849556569ad8` |

0회차 단계 1~9 끝. 판단은 `ROUND-0.md`.

## 1회차 자료 고침(허브 승인 2026-10-23, ROUND-0 3절)

- 손잡이: 위험 프로필 `RISK_PROFILE_DEFAULT`의 `fx.step_bp`를 250에서 275로 올렸다(판정표 5.2, 한 단위 25, 범위 150~275의 끝). 바꾼 곳은 `data/market_rules.json` 한 줄뿐이다.
- 같은 커밋에서 확인한 것
  - `validate_data.py` 통과(MANIFEST 재생성 뒤)
  - 골든 검사기 종료 0(rules-2 105회, rules-1 400회 일치)
  - `npx vitest run` 55파일, 1,510개 통과
- 새 `data/market_rules.json` sha256: `075dda9c2d43c7e2a5d96b901814053a9b28214c0de81fe3ac43abbed0549395`
- 프로필 대조 스크립트는 이제 `DIFF 0`이 아니다. 0회차 고정 기록과 비교하는 도구이고, 조정된 프로필에서는 차이가 나는 것이 맞다. 1회차의 G0는 sha256만 이 값과 대조한다.
- 측정 커밋은 허브가 이 커밋을 dev에 병합한 병합 커밋이다(허브 답 7-2).

## 1회차(측정 커밋 `4143322`)

### G0

측정 커밋 `4143322ca73e72c82cc5355e4f6775245084fecd`(별도 작업 트리), `data/market_rules.json` sha256 `075dda9c…9395` = 허브 통보값, 골든 종료 0, validate 통과. 통과.

### 단계

| 단계 | 명령 | 시각(소요) | 종료 | 출력 sha256 |
|---|---|---|---|---|
| 1 | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPERATIONS --round 1 --seed-base 1001 --workers 4 --out GA-R0-base.json` | 10-23 22:19:51~22:40:35 (1244s) | 0 | json `f5fc01612e616deaec340796ca6f4275f22efb137d0c697e43ef54d325294d00` · md `1e55a5272c82fafb4404edef422d878e0cc9ddfb40415fc6b10e30fac5cdd8f7` |
| 2 | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPERATIONS --round 1 --seed-base 1001 --workers 4 --policies MAX_CONTRIBUTION,MARGIN_BUFFER,FOCUS --out GA-R0-new2.json` | 10-23 22:40:35~22:40:57 (22s) | 0 | json `f3340079afca71be6371e628c8f7f4d0ed0c31a363ad1c2fbb2254628135be56` · md `0f9a258cdbe952afec693899230fdcfee8fedbcf5acb6bdf494239db9d24ea14` |
| 4 | `sim d03 --risk R1 --scenarios SCENARIO_M2_OPERATIONS --round 1 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GA-R1-red.json` | 10-23 22:40:57~22:41:43 (46s) | 0 | json `c98474f081877a7328b1622ab2d3913d1382c54ac684069cda4a48371ad1a8fa` · md `62e7aa1b80cb2e857e971d3dae0ec33a8cae332dbbfe5646b22c51ea16a1712c` |
| 9 | `sim risk-compare GA-R0-new2.json GA-R1-red.json` | 10-23 22:41:43~22:41:44 (1s) | 0 | json `-` · md `ab7bc8afaac78433909c7994d5fb6dd7def1f1d1d63e4e96765fec9045b2c6db` |

- R0 결정성 확인: `GA-R0-base`(2,340회)와 `GA-R0-new2`(60회)의 `runs`가 0회차와 바이트까지 같다. 다른 것은 `meta.risk`(회차·sha256)뿐이다. 환율 손잡이는 R0에 닿지 않으므로 예상한 결과다.
- G2((iii)) 통과: 227 → 337.
| 6a-base | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COSMETICS --round 1 --seed-base 1001 --workers 4 --out GN-R0-base.json` | 10-23 22:41:44~22:58:16 (992s) | 0 | json `aa3f168125c4ea36081896f2d894e4e71bc1c0e6a0c6fd56de22c61468491135` · md `dee337762e26dc3f90292dca174ca2e310829431e9f98b3eedb728787db7a01d` |
| 6a-new | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COSMETICS --round 1 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GN-R0-new.json` | 10-23 22:58:17~22:58:31 (14s) | 0 | json `b8c05c50c31f47a425ec1e6126e432f19afd7674af74f120a7d26a0dcd8afab1` · md `abdfb58aa42e7d9fdda341e196a6e9c2dc2dfd7614d5bc638f2ca0023b1d8e08` |
| 6a-full | `sim d03 --risk R0 --round 1 --tables-from GN-R0-base.json,GN-R0-new.json --out GN-R0-full.json` | 10-23 22:58:31~22:58:35 (4s) | 0 | json `63c7309e973da67a68e9aa4561e90e437e53b591d7472d89070acaa121361d9d` · md `b914575b139dc4ff056476a759413288e0b507c9ccd9645736616d047346dac6` |
| 6b-base | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 1 --seed-base 1001 --workers 4 --out GD-R0-base.json` | 10-23 22:58:35~23:21:26 (1371s) | 0 | json `e0755827248c895dfd7b250ac5cec9577f9c4731260d131bd25542e3eea6b5b5` · md `578a71aae8c8bbfa8ac98741a173c0c86c5fa2576d9384d1eb04b262b2816e56` |
| 6b-new | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 1 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GD-R0-new.json` | 10-23 23:21:26~23:21:42 (16s) | 0 | json `d099ca7bcd7869c751ebc66ce948d758c57081fb1657bc770d326435d18869b1` · md `a2239d650ce89e21a4b1841c237644a168e6ce2cd47d002c9d0e2b06473142cc` |
| 6b-full | `sim d03 --risk R0 --round 1 --tables-from GD-R0-base.json,GD-R0-new.json --out GD-R0-full.json` | 10-23 23:21:42~23:21:47 (5s) | 0 | json `a2ce37fa70b33f26d1394df6d81149fc3a52877e6b7ab9d2f9679aa5bf03b21f` · md `7a3a59ef918c719229fadf22f4b3bca15db459a68932f6e0c744045c9325aed2` |
| 7a-base | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPERATIONS --round 1 --seed-base 1001 --workers 4 --out GA-R3-base.json` | 10-23 23:21:47~23:43:10 (1283s) | 0 | json `6a4e1a11c636fdeef0efec1ae17dad648f3ccd9a316978ea4511f6828ed8188c` · md `83c46719643e513c92e70d9fd86960cb1344a8db69320ebefa4378952823bc5d` |
| 7a-new | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPERATIONS --round 1 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GA-R3-new.json` | 10-23 23:43:10~23:43:31 (21s) | 0 | json `6856d01150d3ccadd0da1753c44f208014624f2f66290f9a1def44ad7d6b4933` · md `913265192355b3604a3c70d01615d48c181e3f440d677a3a88f814c62fb210ba` |
| 7a-full | `sim d03 --risk R3 --round 1 --tables-from GA-R3-base.json,GA-R3-new.json --out GA-R3-full.json` | 10-23 23:43:31~23:43:36 (5s) | 0 | json `2290031a65927293dc142a16efe40e5c23b4a5c9a3964f89f69b40f1cfda5f54` · md `386763adc5ca4d6b04d22462a7adac69f8006be54f11704855d04f6c3cfe3e39` |
| 7b-base | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COSMETICS --round 1 --seed-base 1001 --workers 4 --out GN-R3-base.json` | 10-23 23:43:37~00:02:15 (1118s) | 0 | json `97845a5269c296e34598597ef5d8c984155d97a0cd0e4446192bd89acdc57e83` · md `3945cd5d03f9562dcd383d3781148f4329086f9411ed6533d124ad9b6a920eab` |
| 7b-new | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COSMETICS --round 1 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GN-R3-new.json` | 10-24 00:02:15~00:02:34 (19s) | 0 | json `1f6544a877fdcfc7e95ac8a86876e06273668ba84b02de1a0d3e6746498fc9aa` · md `473e8393e71954bf0fd743fba09da1c12a7af5549ab3f37f1a46c0ce32a0582e` |
| 7b-full | `sim d03 --risk R3 --round 1 --tables-from GN-R3-base.json,GN-R3-new.json --out GN-R3-full.json` | 10-24 00:02:34~00:02:39 (5s) | 0 | json `5e7de01d17adac14446eb76749b5859b44f5731e0df4bbd32fbc51f032c772f2` · md `91dfefd7a69861b9eaceaccdaa44913fddf7e68a476146519f96d7d6a40d1990` |
| 7c-base | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 1 --seed-base 1001 --workers 4 --out GD-R3-base.json` | 10-24 00:02:39~00:22:33 (1194s) | 0 | json `648740f573cf5bc96ce5b25a9f01f656ea075504f0853ee88f148e86e3ead09f` · md `2f624154d240feaeb6755f01597eee80e3fec59a02344f79a169d686d05d0601` |
| 7c-new | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 1 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GD-R3-new.json` | 10-24 00:22:33~00:22:51 (18s) | 0 | json `9d357639763233e74e67a63137e0a1877636afc2d8c7a2c6e681abb3321656fd` · md `7233e80d91ff467dded444457acd3b5dc891b627e053d5243d560072cad924c1` |
| 7c-full | `sim d03 --risk R3 --round 1 --tables-from GD-R3-base.json,GD-R3-new.json --out GD-R3-full.json` | 10-24 00:22:51~00:22:56 (5s) | 0 | json `19705086fa7365373b44fc4dd1d803ec410e452193270bb077da5722513cb08d` · md `6ca65176a7b66aaaaae42a0afc308ec8b5e6ecd2ced7e6081247d3b23b627c4c` |
| 8a | `sim d03 --risk R1 --scenarios SCENARIO_M2_OPS_COSMETICS --round 1 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GN-R1-red.json` | 10-24 00:22:56~00:23:32 (36s) | 0 | json `5312e983f56bf78fb03448a2a1aceaea8417a859f96f4d0749a56bb08a4fbf75` · md `19b7b7b755f2ed20ae6b808fd3c91558626399e7df469195d3784e49cece6a13` |
| 8b | `sim d03 --risk R1 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 1 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GD-R1-red.json` | 10-24 00:23:32~00:24:16 (44s) | 0 | json `723c5ca61295e70c36345f60f3d9e0a93cd2feaa612a1ab760afeb3ced7203fa` · md `e6a50ee7ac6e2c886136900271d0ded47a37f096fcb288f420c7fd768c114b1c` |
| 8c | `sim d03 --risk R2 --scenarios SCENARIO_M2_OPERATIONS --round 1 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GA-R2-red.json` | 10-24 00:24:16~00:25:03 (47s) | 0 | json `fba639a2bec8e84dcd34a130c963e0cc7929da8b42ef256886478a915281fdc9` · md `ef7cd1572c371c72914dcce326faadf34bd7d0f29acfc9aecba63802686b7061` |
| 8d | `sim d03 --risk R2 --scenarios SCENARIO_M2_OPS_COSMETICS --round 1 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GN-R2-red.json` | 10-24 00:25:03~00:25:41 (38s) | 0 | json `d37a3c332be572a8f76045b315b10fbd736860abf183b1bf91ae100f0314c836` · md `d90a9db3149ee2b4b22bcaebdbb50662574485fb891ca586a42be3f60917a851` |
| 8e | `sim d03 --risk R2 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 1 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GD-R2-red.json` | 10-24 00:25:41~00:26:24 (43s) | 0 | json `6b33e57b1c62f135dfa84dbe52580530b60c4539b45c742dfc53e6f12ba3c4db` · md `bb4f6fb6f11ce3129d9bbf85696be50ceb79449056bc560cdaf4d003627a451d` |
| 9 | `sim risk-compare GA-R1-red.json GA-R2-red.json` | 10-24 00:26:24~00:26:25 (1s) | 0 | json `-` · md `4f8cce94f1ec70dd6ccc06fe652388fa9117a9d38fd0e6ce1d7b6f08a17d23e5` |
| 9 | `sim risk-compare GA-R2-red.json GA-R3-full.json` | 10-24 00:26:25~00:26:27 (2s) | 0 | json `-` · md `1a45f1a720b27cb403ec2018e997b6e1b2ffb44de53fb8e9992b341795189e92` |
| 9 | `sim risk-compare GN-R0-full.json GN-R1-red.json` | 10-24 00:26:27~00:26:29 (2s) | 0 | json `-` · md `df7b5b69b8f97232528879dffadc8a7f83d8183e26b8cfe076fa44c9502faa10` |
| 9 | `sim risk-compare GN-R1-red.json GN-R2-red.json` | 10-24 00:26:29~00:26:30 (1s) | 0 | json `-` · md `b66eca0b47b76955d9d874868d793bf4054d531f5fb2c13e368433c2075ef8ac` |
| 9 | `sim risk-compare GN-R2-red.json GN-R3-full.json` | 10-24 00:26:30~00:26:32 (2s) | 0 | json `-` · md `e4784dda84ce012b1e6fef9adf618346cb9fe393d1910f506014801b63aae008` |
| 9 | `sim risk-compare GD-R0-full.json GD-R1-red.json` | 10-24 00:26:32~00:26:35 (3s) | 0 | json `-` · md `0056b562a41185ee2cfa909a96a32e17b41842b16a3ffc20bf1392b5634d4015` |
| 9 | `sim risk-compare GD-R1-red.json GD-R2-red.json` | 10-24 00:26:35~00:26:35 (0s) | 0 | json `-` · md `0a18e2b67a5642ac6b9247d59f03a4cd7374daf7cddee976cb3817ee1cdeaa3f` |
| 9 | `sim risk-compare GD-R2-red.json GD-R3-full.json` | 10-24 00:26:35~00:26:37 (2s) | 0 | json `-` · md `fbc739b495ed850a02b629531d4f5f52da425df00e3bf21f55c53d01d2bb2fe6` |

- R0 결정성: (나)·(다) R0 전체 출력의 `runs`도 0회차와 같다.

1회차 단계 1~9 끝. 판단은 `ROUND-1.md`.

## 2회차 자료 고침(허브 승인 2026-10-23, ROUND-1 3절)

- 손잡이: 위험 프로필 `collections.grades[]`의 `p_late_bp`를 +500 올렸고, 같은 만큼 `p_on_time_bp`에서 뺐다. A 8500/1000 → 8000/1500, B 7000/2000 → 6500/2500, C 5500/3000 → 5000/3500이다. `p_partial_bp`는 그대로 두었다. 바꾼 곳은 `data/market_rules.json` 여섯 줄뿐이다.
- 같은 커밋에서 확인한 것: validate 통과(MANIFEST 재생성), 골든 종료 0, `npx vitest run` 55파일 1,510개 통과.
- 새 `data/market_rules.json` sha256: `d596f81e1dd5886636c4a1f62e1173a96d862e346885bf373dde247e7f8b8d6a`

## 2회차(측정 커밋 `479fe56`)

### G0

측정 커밋 `479fe569dd774525d77828bb4b2b00269328d74d`(별도 작업 트리)에서 확인했다.

- `data/market_rules.json` sha256 `d596f81e…8d6a`가 허브 통보값과 같다.
- 골든 종료 0, validate 통과.

통과.

### 단계

| 단계 | 명령 | 시각(소요) | 종료 | 출력 sha256 |
|---|---|---|---|---|
| 1 | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPERATIONS --round 2 --seed-base 1001 --workers 4 --out GA-R0-base.json` | 10-24 00:36:16~00:56:07 (1191s) | 0 | json `42944defc4b50065a34aa55501dfcef0b37cb34b2335e18ab1eb5fc1fe93e37f` · md `1e55a5272c82fafb4404edef422d878e0cc9ddfb40415fc6b10e30fac5cdd8f7` |
| 2 | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPERATIONS --round 2 --seed-base 1001 --workers 4 --policies MAX_CONTRIBUTION,MARGIN_BUFFER,FOCUS --out GA-R0-new2.json` | 10-24 00:56:07~00:56:28 (21s) | 0 | json `5b4324eb008146d2c0e72160f85e9dc8797d776f46b6bd1e6c23a9fb268604a1` · md `0f9a258cdbe952afec693899230fdcfee8fedbcf5acb6bdf494239db9d24ea14` |
| 4 | `sim d03 --risk R1 --scenarios SCENARIO_M2_OPERATIONS --round 2 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GA-R1-red.json` | 10-24 00:56:28~00:57:12 (44s) | 0 | json `5b599d1683283854becbf9f4d2c51867870b3f399cf50992d00e7eb2a1000231` · md `62e7aa1b80cb2e857e971d3dae0ec33a8cae332dbbfe5646b22c51ea16a1712c` |
| 9 | `sim risk-compare GA-R0-new2.json GA-R1-red.json` | 10-24 00:57:12~00:57:13 (1s) | 0 | json `-` · md `ab7bc8afaac78433909c7994d5fb6dd7def1f1d1d63e4e96765fec9045b2c6db` |
| 6a-base | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COSMETICS --round 2 --seed-base 1001 --workers 4 --out GN-R0-base.json` | 10-24 00:57:13~01:13:23 (970s) | 0 | json `42f45ca1edf034aa99c4bb09c78e2bced68239d771a58b909a42f3c73e5f143d` · md `dee337762e26dc3f90292dca174ca2e310829431e9f98b3eedb728787db7a01d` |
| 6a-new | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COSMETICS --round 2 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GN-R0-new.json` | 10-24 01:13:23~01:13:37 (14s) | 0 | json `0ff126d00c8bd81b7f34b52a930a70ae8ef78502db11eaa18c61abafcb37c815` · md `abdfb58aa42e7d9fdda341e196a6e9c2dc2dfd7614d5bc638f2ca0023b1d8e08` |
| 6a-full | `sim d03 --risk R0 --round 2 --tables-from GN-R0-base.json,GN-R0-new.json --out GN-R0-full.json` | 10-24 01:13:37~01:13:41 (4s) | 0 | json `c1f0a737fb6886859ac1510d57cb21080b4f1a45af22c09422830bad37220277` · md `b914575b139dc4ff056476a759413288e0b507c9ccd9645736616d047346dac6` |
| 6b-base | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 2 --seed-base 1001 --workers 4 --out GD-R0-base.json` | 10-24 01:13:42~01:35:37 (1315s) | 0 | json `d9311659a8f0489156eb8d5aa6cd3a9ef8b0aa108290547b962c03c718d245bd` · md `578a71aae8c8bbfa8ac98741a173c0c86c5fa2576d9384d1eb04b262b2816e56` |
| 6b-new | `sim d03 --risk R0 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 2 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GD-R0-new.json` | 10-24 01:35:37~01:35:52 (15s) | 0 | json `002c25732a84ac25c06b2df9b16759b1b6c57842e6f95d3b0e3b1759a1f81807` · md `a2239d650ce89e21a4b1841c237644a168e6ce2cd47d002c9d0e2b06473142cc` |
| 6b-full | `sim d03 --risk R0 --round 2 --tables-from GD-R0-base.json,GD-R0-new.json --out GD-R0-full.json` | 10-24 01:35:52~01:35:57 (5s) | 0 | json `176e5afc1bc061778c43b6e351d36389ce6831aaecbf6b8b717b0f11144e2ea9` · md `7a3a59ef918c719229fadf22f4b3bca15db459a68932f6e0c744045c9325aed2` |
| 7a-base | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPERATIONS --round 2 --seed-base 1001 --workers 4 --out GA-R3-base.json` | 10-24 01:35:57~01:56:49 (1252s) | 0 | json `f3ce96071165dbc82d229a2d1a399dcd84bd57271c84b622b033fb84a1adc7b1` · md `5ddfed5abbb831c6e834e7f5b19f111bf147bec6bb700a88e80bda23eafce4bd` |
| 7a-new | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPERATIONS --round 2 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GA-R3-new.json` | 10-24 01:56:49~01:57:08 (19s) | 0 | json `e4a652b3c8a5ff44ade3e025b7870c6bcb06275ec8d180092d4230979ae7f01c` · md `0f6cb190e43c0b723f0d748e35afa7b4ef582d4e18c3fb46f71b4d67f98171b8` |
| 7a-full | `sim d03 --risk R3 --round 2 --tables-from GA-R3-base.json,GA-R3-new.json --out GA-R3-full.json` | 10-24 01:57:08~01:57:12 (4s) | 0 | json `3856b7013f791628576461d53611a05d7f3145691b02081ecc54db49caf98cda` · md `62ddfdcf127f0c0e01d0ae1bc789b10ac57c0d35e675d7464b1b426cfaa0980e` |
| 7b-base | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COSMETICS --round 2 --seed-base 1001 --workers 4 --out GN-R3-base.json` | 10-24 01:57:12~02:15:06 (1074s) | 0 | json `1ada5247276f7977fc30b95ecc0210f3af00c17a239f18d2b9917c40456e8432` · md `a6feab6090b18dcaca875beb4bb5699e8c9be6b76a6b276adf0be1dfa9ad790f` |
| 7b-new | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COSMETICS --round 2 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GN-R3-new.json` | 10-24 02:15:07~02:15:23 (16s) | 0 | json `342f28b6789b69b4451a71e4190dc1e62b806e9034f78252494a91b41f248f85` · md `be5e32bbdcee01fdee9e21c0adb2b3a6d1f553b81e4c132babc7d908ffd0eedf` |
| 7b-full | `sim d03 --risk R3 --round 2 --tables-from GN-R3-base.json,GN-R3-new.json --out GN-R3-full.json` | 10-24 02:15:23~02:15:28 (5s) | 0 | json `0bc8668247dcc0da25bc464df3ece1a43fcab59430767e3c07e6570015ccb658` · md `a51e45fa4a5a6c2136f423984034010807193d47ff643f390db33b01432c0663` |
| 7c-base | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 2 --seed-base 1001 --workers 4 --out GD-R3-base.json` | 10-24 02:15:28~02:34:39 (1151s) | 0 | json `7696865e3442c42bbf25bfaba46e5bc9206612b282792b816a3542c19ce263a5` · md `c82eadd4d1670f1fffb71efeedda0f4ce61f86bb895c1a0cc31a9d9c74c7ca06` |
| 7c-new | `sim d03 --risk R3 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 2 --seed-base 1001 --workers 4 --policies MARGIN_BUFFER,FOCUS --out GD-R3-new.json` | 10-24 02:34:39~02:34:57 (18s) | 0 | json `d9f529f0b66b2c9572e0df6842d48e64864118552bf21d96c57031d81c5b6123` · md `fc8419689d710eef4d082fe1e841a456214f874cac565dad3da1d7db30e5505f` |
| 7c-full | `sim d03 --risk R3 --round 2 --tables-from GD-R3-base.json,GD-R3-new.json --out GD-R3-full.json` | 10-24 02:34:57~02:35:02 (5s) | 0 | json `67a8aaa4fb089bca741b949f5ae9f0332996ae75e881cadb2b4ab431e1dda8c0` · md `24d20fc3b38d105a0a74e5e719152ddbaec108b9029cb7ef07f1408ad18313c9` |
| 8a | `sim d03 --risk R1 --scenarios SCENARIO_M2_OPS_COSMETICS --round 2 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GN-R1-red.json` | 10-24 02:35:02~02:35:37 (35s) | 0 | json `ff865cfc7b2f000025b78cb24c4bd47a4ca8cc96bdeccd6d45033058dc081e65` · md `19b7b7b755f2ed20ae6b808fd3c91558626399e7df469195d3784e49cece6a13` |
| 8b | `sim d03 --risk R1 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 2 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GD-R1-red.json` | 10-24 02:35:37~02:36:18 (41s) | 0 | json `5fd8c890aa5ed502fca6de22f413c47a966019cfb6c663f40384178061e85979` · md `e6a50ee7ac6e2c886136900271d0ded47a37f096fcb288f420c7fd768c114b1c` |
| 8c | `sim d03 --risk R2 --scenarios SCENARIO_M2_OPERATIONS --round 2 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GA-R2-red.json` | 10-24 02:36:18~02:37:02 (44s) | 0 | json `caf470e663f29fec87c7f34d816413ac7bc53e4927c986af2111cc68b5d46dc1` · md `ef7cd1572c371c72914dcce326faadf34bd7d0f29acfc9aecba63802686b7061` |
| 8d | `sim d03 --risk R2 --scenarios SCENARIO_M2_OPS_COSMETICS --round 2 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GN-R2-red.json` | 10-24 02:37:02~02:37:37 (35s) | 0 | json `f6a47bca5ee33dc5731192f8a38f00e0ca522db1954d370fbc6072c7cbc0f7d2` · md `d90a9db3149ee2b4b22bcaebdbb50662574485fb891ca586a42be3f60917a851` |
| 8e | `sim d03 --risk R2 --scenarios SCENARIO_M2_OPS_COS_LAVER --round 2 --seed-base 1001 --workers 4 --policies IDLE,NO_FX,MAX_CONTRIBUTION,LATE_OK,MARGIN_BUFFER,FOCUS --out GD-R2-red.json` | 10-24 02:37:37~02:38:19 (42s) | 0 | json `b04a048fb96ec97789d86896c6af3aa3c5d6f2a06152fcd3a9200a7fa2c83032` · md `bb4f6fb6f11ce3129d9bbf85696be50ceb79449056bc560cdaf4d003627a451d` |
| 9 | `sim risk-compare GA-R1-red.json GA-R2-red.json` | 10-24 02:38:19~02:38:19 (0s) | 0 | json `-` · md `4f8cce94f1ec70dd6ccc06fe652388fa9117a9d38fd0e6ce1d7b6f08a17d23e5` |
| 9 | `sim risk-compare GA-R2-red.json GA-R3-full.json` | 10-24 02:38:19~02:38:21 (2s) | 0 | json `-` · md `a4c183e064d3356789202a5181831bdcd640e41f6137d55be4af211b24646720` |
| 9 | `sim risk-compare GN-R0-full.json GN-R1-red.json` | 10-24 02:38:21~02:38:23 (2s) | 0 | json `-` · md `df7b5b69b8f97232528879dffadc8a7f83d8183e26b8cfe076fa44c9502faa10` |
| 9 | `sim risk-compare GN-R1-red.json GN-R2-red.json` | 10-24 02:38:23~02:38:24 (1s) | 0 | json `-` · md `b66eca0b47b76955d9d874868d793bf4054d531f5fb2c13e368433c2075ef8ac` |
| 9 | `sim risk-compare GN-R2-red.json GN-R3-full.json` | 10-24 02:38:24~02:38:26 (2s) | 0 | json `-` · md `041a459cbb1198816a1b34f18566ed43a5a40aaf5430b1e718eaebf020b43821` |
| 9 | `sim risk-compare GD-R0-full.json GD-R1-red.json` | 10-24 02:38:26~02:38:28 (2s) | 0 | json `-` · md `0056b562a41185ee2cfa909a96a32e17b41842b16a3ffc20bf1392b5634d4015` |
| 9 | `sim risk-compare GD-R1-red.json GD-R2-red.json` | 10-24 02:38:28~02:38:29 (1s) | 0 | json `-` · md `0a18e2b67a5642ac6b9247d59f03a4cd7374daf7cddee976cb3817ee1cdeaa3f` |
| 9 | `sim risk-compare GD-R2-red.json GD-R3-full.json` | 10-24 02:38:29~02:38:31 (2s) | 0 | json `-` · md `6833044e5abbbb72e59273b48c3bdddc5e9f425b6b3b6c85ac83775c6cd1c7cb` |

- 결정성: R0·R1·R2의 10개 출력은 `runs`가 1회차와 같다. 0·1회차 JSON은 gzip으로 압축해 두었고, sha256은 압축 전 값이다.
- 감시 작업 하나가 도구의 2시간 한도에 걸려 멈췄다. 측정 스크립트는 따로 떼어 실행했으므로 영향이 없었다. 32단계 모두 종료 0이다.

2회차 단계 1~9 끝. 판단은 `ROUND-2.md`.

## 3회차 자료 고침(허브 승인 2026-10-24, ROUND-2 3절, 마지막 회)

- 손잡이: 위험 프로필 `claims.by_good[].p_claim_bp`를 모든 품목에 +200 올렸다. 화장품 900 → 1100, 의류 500 → 700, 조미김 500 → 700이다. 바꾼 곳은 `data/market_rules.json` 세 줄뿐이다.
- 같은 커밋에서 확인한 것: validate 통과(MANIFEST 재생성), 골든 종료 0, `npx vitest run` 55파일 1,510개 통과.
- 새 `data/market_rules.json` sha256: `fb3ee07c6cc7d1ffd1b0a9078a59b9bbc06b16a9d135c90e7cced959360122bd`
