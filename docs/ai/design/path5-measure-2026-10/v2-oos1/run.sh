#!/bin/bash
# 판정표 v2 표본 밖 1(최종 프로필 k = +1) 측정 (V2-RUN-PLAN 2절)
MW=$1; O=$2; B=1101; n=1
cd "$MW" || exit 9
S="node src/engine/sim/run.mjs"
log(){ echo "$@" >> "$O/RUNLOG.tsv"; }
step(){ local name=$1; shift; local t0=$(date -u +%FT%TZ); "$@" > "$O/$name.stdout" 2> "$O/$name.stderr"; local rc=$?; log "$name	$t0	$(date -u +%FT%TZ)	$rc	$*"; return $rc; }
for L in R0P R1 R2 R3 R4; do
  step "d03-$L" $S d03 --risk-v2 $L --round $n --seed-base $B --seeds 40 --workers 4 --out "$O/V2-$L.json" || { echo FAIL > "$O/DONE"; exit 1; }
done
step d03-V1R0 $S d03 --risk R0 --round $n --scenarios SCENARIO_M2_OPS_COS_LAVER --seed-base $B --seeds 40 --workers 4 --policies MAX_CONTRIBUTION,NO_FX --out "$O/V1-R0.json"
for L in R0P R1 R2 R3 R4; do step "tables-$L" bash -c "$S v2-tables $O/V2-$L.json > $O/V2-TABLES-$L.md"; done
step report bash -c "$S v2-report $O/V2-R0P.json $O/V2-R1.json $O/V2-R2.json $O/V2-R3.json $O/V2-R4.json --r0 $O/V1-R0.json > $O/V2-REPORT.md"
step cmp-R0P-R1 bash -c "$S risk-compare-v2 $O/V2-R0P.json $O/V2-R1.json > $O/CMP-R0P-R1.md"
step cmp-R1-R2 bash -c "$S risk-compare-v2 $O/V2-R1.json $O/V2-R2.json > $O/CMP-R1-R2.md"
step cmp-R2-R3 bash -c "$S risk-compare-v2 $O/V2-R2.json $O/V2-R3.json > $O/CMP-R2-R3.md"
step cmp-R3-R4 bash -c "$S risk-compare-v2 $O/V2-R3.json $O/V2-R4.json > $O/CMP-R3-R4.md"
(cd "$O" && sha256sum *.json *.md > SHA256SUMS)
echo OK > "$O/DONE"
