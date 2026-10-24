# 등급 차이 손잡이 민감도: C 대손 기본 확률과 C 한도(로트 수)를 바꿔 v2d3.py의 L3 줄만 다시 낸다.
import sys, io, contextlib, os
D = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
for pc, climn in ((1200, 1), (1200, 2), (2400, 1), (2400, 2), (1600, 3), (2400, 99)):
    src = open(os.path.join(here, 'v2d3.py')).read().replace("'C': 1200}", "'C': %d}" % pc).replace("'C': 1 * Lunit", "'C': %d * Lunit" % climn)
    src = src.split('# L1 expected')[0]
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf): exec(compile(src, 'v2d3', 'exec'), {'__name__': 'm', 'sys': type('s', (), {'argv': ['', D]})})
    out = buf.getvalue().split('== limit new')[1]
    print(f'--- p_C {pc}, C limit {climn} lot')
    print('\n'.join(l for l in out.splitlines() if ('L3' in l or 'divergent' in l or 'gain' in l or 'grade C' in l)))
