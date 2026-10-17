import statistics, sys
from sim import Game, net_value, STAFF
from search import htemplates
from market import DEFAULT_TEMPLATES
SEEDS = list(range(1001, 1021))
STAFF['FREE3'] = (3, 0)
def run(m, p, label):
    res = {}
    for n, v in [('V0', {}), ('free3@7', dict(hires=[('FREE3', 7)])), ('free3@36', dict(hires=[('FREE3', 36)])),
                 ('H04@7', dict(hires=[('EMP04', 7)])), ('H04@36', dict(hires=[('EMP04', 36)])), ('H04@22', dict(hires=[('EMP04', 22)])),
                 ('H06@36', dict(hires=[('EMP06', 36)]))]:
        res[n] = [Game(s, dict(v, mparams=m, params=p)).run() for s in SEEDS]
    base = {r['seed']: r for r in res['V0']}
    med = statistics.median
    print(label)
    for n, rs in res.items():
        dv = [net_value(r) - net_value(base[r['seed']]) for r in rs]
        dc = [(r['contrib'] - base[r['seed']]['contrib']) / 100 for r in rs]
        print(f"  {n:9s} Δ값 중앙 {med(dv):+7.0f} 이득 {sum(1 for x in dv if x > 0):2d}/20 | Δ기여 중앙 {med(dc):+7.0f} | 실패 {sum(1 for r in rs if r['failed'])} | 거절 funds {med([r['reject']['funds'] for r in rs])} staff {med([r['reject']['staff'] for r in rs])}")
for vol, pt, mpp, n in [(3, 10, 70, 6), (3, 12, 70, 6), (3, 10, 60, 7)]:
    m = dict(templates=DEFAULT_TEMPLATES + htemplates(vol, pt, mpp), forwarding_per_batch=n)
    run(m, dict(handling_l_per_pt=int(vol * 1000 / pt) + 1), f'vol{vol} pt{pt} mpp{mpp} n{n}')
