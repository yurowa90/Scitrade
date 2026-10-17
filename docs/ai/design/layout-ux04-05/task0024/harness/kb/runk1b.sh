#!/bin/bash
cd "$(dirname "$0")"
export DISTS=head,o3b
for p in "$@"; do
  timeout 1500 node k1b.js $p -30 > out3/k1b-$p.jsonl 2> out3/k1b-$p.err; echo "k1b $p $?" >> out3/run.done
done
echo "LANE $* DONE" >> out3/run.done
