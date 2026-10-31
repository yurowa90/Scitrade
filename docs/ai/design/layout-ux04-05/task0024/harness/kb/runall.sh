#!/bin/bash
# 프로필마다: 키보드(kb·kb23 2일·kbtoast)·오늘 할 일 위치(qpos)·90일 끝(k90)·읽던 자리 32사례(17 스크립트). 출력 out/<측정>-<prof>.jsonl
cd "$(dirname "$0")"
D=${DS:-head,o1,o2,o3a,o3b}
export DISTS=$D DISTS_CLOSED=$D DISTS_OPEN=$D DISTS_AD=$D DISTS_BC=$D
for p in "$@"; do
  timeout 1500 node kb.js $p $D > out/kb-$p.jsonl 2> out/kb-$p.err; echo "kb $p $?" >> out/run.done
  timeout 900 node kb23.js $p $D > out/kb23-$p.jsonl 2> out/kb23-$p.err; echo "kb23 $p $?" >> out/run.done
  timeout 900 node kbtoast.js $p $D > out/kbtoast-$p.jsonl 2> out/kbtoast-$p.err; echo "toast $p $?" >> out/run.done
  timeout 900 node k90.js $p $D > out/k90-$p.jsonl 2> out/k90-$p.err; echo "k90 $p $?" >> out/run.done
  [ -s out/qpos-$p.jsonl ] || { timeout 900 node qpos.js $p $D > out/qpos-$p.jsonl 2> out/qpos-$p.err; echo "qpos $p $?" >> out/run.done; }
  O=out/anc-$p.jsonl; E=out/anc-$p.err; : > $O; : > $E
  run() { echo "## $*" >> $E; timeout 1500 node "$@" >> $O 2>> $E; echo "  rc $?" >> $E; }
  run f2.js $p new headIn
  run f2.js $p new f3mid
  run f2.js $p new f1
  run f2.js $p new repHeadIn
  run f2.js $p repeat f1
  run f2.js $p repeat headIn
  run f2n.js $p
  run t1.js $p
  run c1.js $p -30
  run c1.js $p -300
  run f1.js $p 40
  run f1.js $p mid
  run c3.js $p CA01
  run c3.js $p CA01 contract
  run c3.js $p CA03
  run c4.js $p
  run k1.js $p -30
  echo "anc $p" >> out/run.done
done
echo "LANE $* DONE" >> out/run.done
