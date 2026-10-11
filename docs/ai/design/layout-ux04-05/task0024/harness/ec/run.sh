#!/bin/bash
cd "$(dirname "$0")"
for p in "$@"; do timeout 1500 node ec.js $p head,o3b RQ,RQB,RR,MQ,K1 > out/ec-$p.jsonl 2> out/ec-$p.err; echo "ec $p $?" >> out/run.done; done
echo "LANE $* DONE" >> out/run.done
