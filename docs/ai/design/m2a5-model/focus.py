import statistics, sys, json
from sim import Game, net_value
from search import htemplates
from market import DEFAULT_TEMPLATES
SEEDS = list(range(1001, 1021))
SP = [('HAIPHONG', 1), ('SHANGHAI', 1)]
VARS = {
  'V0': {}, 'NOFX': dict(fx=False), 'E@7': dict(expand_day=7), 'S@1': dict(space=SP), 'ES': dict(expand_day=7, space=SP),
  'H06@7': dict(hires=[('EMP06', 7)]), 'H06@22': dict(hires=[('EMP06', 22)]), 'H06@36': dict(hires=[('EMP06', 36)]),
  'H04@7': dict(hires=[('EMP04', 7)]), 'H04@22': dict(hires=[('EMP04', 22)]), 'H04@36': dict(hires=[('EMP04', 36)]),
  'E+H04@7': dict(expand_day=7, hires=[('EMP04', 7)]), 'E+H04@22': dict(expand_day=21, hires=[('EMP04', 22)]),
  'ES+H04@22': dict(expand_day=21, space=[('HAIPHONG', 21), ('SHANGHAI', 21)], hires=[('EMP04', 22)]),
  'H06@22+H05@36': dict(hires=[('EMP06', 22), ('EMP05', 36)]),
}
REF = {'E+H04@7': 'E@7', 'E+H04@22': 'V0', 'ES+H04@22': 'V0'}
def evaluate(label, m, p, show=True):
    res = {n: [Game(s, dict(v, mparams=m, params=p)).run() for s in SEEDS] for n, v in VARS.items()}
    med = statistics.median
    base = {r['seed']: r for r in res['V0']}
    if show:
        print('##', label, '| V0 값', round(med([net_value(r) for r in res['V0']])), '기여', round(med([r['contrib']/100 for r in res['V0']])),
              '| V0 실패', sum(1 for r in res['V0'] if r['failed']), '미지급', sum(1 for r in res['V0'] if r['first_unpaid']),
              '| NOFX 실패', sum(1 for r in res['NOFX'] if r['failed']), med([r['failed']['day'] for r in res['NOFX'] if r['failed']] or [0]))
    out = {}
    for n, rs in res.items():
        if n in ('V0', 'NOFX'): continue
        ref = {r['seed']: r for r in res[REF.get(n, 'V0')]}
        dv = [net_value(r) - net_value(ref[r['seed']]) for r in rs]
        out[n] = (round(med(dv)), sum(1 for x in dv if x > 0), sum(1 for r in rs if r['failed']))
        if show:
            print(f"   {n:14s} vs {REF.get(n,'V0'):5s} Δ중앙 {med(dv):+7.0f} 이득 {out[n][1]:2d}/20 실패 {out[n][2]:2d} 미지급 {sum(1 for r in rs if r['first_unpaid']):2d} | Δ기여 {med([(r['contrib']-ref[r['seed']]['contrib'])/100 for r in rs]):+6.0f}")
    return res, out
if __name__ == '__main__':
    for vol, pt, mpp, n, nh in [(3, 10, 70, 6, 6), (3, 12, 70, 6, 6), (3, 12, 60, 6, 6), (3, 12, 70, 5, 6), (3, 12, 70, 6, 4)]:
        m = dict(templates=DEFAULT_TEMPLATES + htemplates(vol, pt, mpp, nh), forwarding_per_batch=n)
        evaluate(f'vol{vol} pt{pt} mpp{mpp} n{n} H{nh}', m, dict(handling_l_per_pt=int(vol * 1000 / pt) + 1))
