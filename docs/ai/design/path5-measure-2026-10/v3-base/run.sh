#!/bin/bash
# 판정표 v3 측정 한 묶음 (TASK-0071 10절). 인자: 트리 출력폴더 시드시작 접미
MW=$1; O=$2; B=$3; X=$4
cd "$MW" || exit 9
S="node src/engine/sim/run.mjs"
log(){ echo "$@" >> "$O/RUNLOG.tsv"; }
step(){ local name=$1; shift; local t0=$(date -u +%FT%TZ); "$@" > "$O/$name.stdout" 2> "$O/$name.stderr"; local rc=$?; log "$name	$t0	$(date -u +%FT%TZ)	$rc	$*"; return $rc; }
for L in R0P R1 R2 R3 R4; do
  step "d03-$L" $S d03 --risk-v2 $L --round 1 --seed-base $B --seeds 40 --workers 4 --out "$O/V2-$L$X.json" || { echo FAIL > "$O/DONE"; exit 1; }
done
step d03-V1R0 $S d03 --risk R0 --round 1 --scenarios SCENARIO_M2_OPS_COS_LAVER --policies MAX_CONTRIBUTION,NO_FX --seed-base $B --seeds 40 --workers 4 --out "$O/V1-R0$X.json"
for L in R0P R1 R2 R3 R4; do
  step "v3tables-$L" bash -c "$S v3-tables $O/V2-$L$X.json > $O/V3-TABLES-$L$X.md"
  step "v2tables-$L" bash -c "$S v2-tables $O/V2-$L$X.json > $O/V2-TABLES-$L$X.md"
done
step cmp-R0P-R1 bash -c "$S risk-compare-v2 $O/V2-R0P$X.json $O/V2-R1$X.json > $O/CMP-R0P-R1$X.md"
step cmp-R1-R2 bash -c "$S risk-compare-v2 $O/V2-R1$X.json $O/V2-R2$X.json > $O/CMP-R1-R2$X.md"
step cmp-R2-R3 bash -c "$S risk-compare-v2 $O/V2-R2$X.json $O/V2-R3$X.json > $O/CMP-R2-R3$X.md"
step cmp-R3-R4 bash -c "$S risk-compare-v2 $O/V2-R3$X.json $O/V2-R4$X.json > $O/CMP-R3-R4$X.md"
(cd "$O" && sha256sum *.json *.md > SHA256SUMS)
echo OK > "$O/DONE"
