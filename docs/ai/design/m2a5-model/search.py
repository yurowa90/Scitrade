# D03 나 사전 조정: 작업 많은 주선(H)의 부피·업무량·pt당 이익·묶음 건수를 바꿔 목표 지표를 본다.
import statistics, itertools, json, sys
from sim import Game, net_value, ROUTES
from market import DEFAULT_TEMPLATES, GOODS
SEEDS = list(range(1001, 1021))
SP = [('HAIPHONG', 1), ('SHANGHAI', 1)]
HBASE = [('H1', 'ELECTRONICS', 'HAIPHONG', 16), ('H2', 'COSMETICS', 'SHANGHAI', 18), ('H3', 'APPAREL', 'HAIPHONG', 16),
         ('H4', 'ELECTRONICS', 'SHANGHAI', 18), ('H5', 'AUTO_PARTS', 'SHANGHAI', 18), ('H6', 'APPAREL', 'HAIPHONG', 16)]
def htemplates(vol_m3, pt, mpp, n=6):
    out = []
    for i, g, d, pay in HBASE[:n]:
        qty = int(round(vol_m3 * 1000 / GOODS[g]['vol_l']))
        fee = ROUTES[d]['fee'] + mpp * 100 * pt
        out.append(dict(id=i, good=g, qty=qty, dest=d, fee=fee, dl=14, pay=pay, cls='HANDLING'))
    return out
VARS = {
    'V0': {}, 'NOFX': dict(fx=False), 'E': dict(expand_day=7), 'S': dict(space=SP), 'ES': dict(expand_day=7, space=SP),
    'H06': dict(hires=[('EMP06', 7)]), 'H04': dict(hires=[('EMP04', 7)]),
    'E+H04': dict(expand_day=7, hires=[('EMP04', 7)]), 'ES+H04': dict(expand_day=7, space=SP, hires=[('EMP04', 7)]),
    'H04@36': dict(hires=[('EMP04', 36)]),
}
PAIRS = [('V0', 'E'), ('V0', 'S'), ('V0', 'H06'), ('V0', 'H04'), ('E', 'E+H04'), ('ES', 'ES+H04'), ('V0', 'H04@36')]
def evaluate(mparams, params):
    res = {n: [Game(s, dict(v, mparams=mparams, params=params)).run() for s in SEEDS] for n, v in VARS.items()}
    med = statistics.median
    out = dict(v0=med([net_value(r) for r in res['V0']]), v0fail=sum(1 for r in res['V0'] if r['failed']),
               v0unpaid=sum(1 for r in res['V0'] if r['first_unpaid']),
               nofx_fail=sum(1 for r in res['NOFX'] if r['failed']),
               nofx_day=med([r['failed']['day'] for r in res['NOFX'] if r['failed']] or [0]))
    for a, b in PAIRS:
        A = {r['seed']: net_value(r) for r in res[a]}
        xs = [net_value(r) - A[r['seed']] for r in res[b]]
        out[f'{a}>{b}'] = (round(med(xs)), sum(1 for x in xs if x > 0), sum(1 for r in res[b] if r['failed']))
    return out
if __name__ == '__main__':
    rows = []
    grid = list(itertools.product([3, 4.5], [6, 8, 10], [50, 60, 70], [5, 6]))
    for vol, pt, mpp, n in grid:
        m = dict(templates=DEFAULT_TEMPLATES + htemplates(vol, pt, mpp), forwarding_per_batch=n)
        p = dict(handling_l_per_pt=int(vol * 1000 / pt) + 1)
        r = evaluate(m, p)
        print(json.dumps(dict(vol=vol, pt=pt, mpp=mpp, n=n, **r), ensure_ascii=False), flush=True)
