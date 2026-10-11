# 설정(시장·준비 업무량) × 투자 변형의 20시드 비교. 고용 이득 시드 수가 핵심 지표다.
import statistics, sys, itertools, json
from sim import Game, net_value
from market import DEFAULT_TEMPLATES, HANDLING_TEMPLATES, DEFAULT_PARAMS
SEEDS = list(range(1001, 1021))
SP = [('HAIPHONG', 1), ('SHANGHAI', 1)]
VARS = {
    'V0': {}, 'H06': dict(hires=[('EMP06', 7)]), 'H04': dict(hires=[('EMP04', 7)]),
    'E': dict(expand_day=7), 'S': dict(space=SP), 'ES': dict(expand_day=7, space=SP),
    'ES+H06': dict(expand_day=7, space=SP, hires=[('EMP06', 7)]), 'ES+H04': dict(expand_day=7, space=SP, hires=[('EMP04', 7)]),
    'E+H04': dict(expand_day=7, hires=[('EMP04', 7)]),
    'H04@21': dict(hires=[('EMP04', 21)]), 'ES+H04@21': dict(expand_day=7, space=SP, hires=[('EMP04', 21)]),
}
def run_cfg(params, mparams, names=None):
    out = {}
    for n, v in VARS.items():
        if names and n not in names: continue
        vv = dict(v, params=params, mparams=mparams)
        out[n] = [Game(s, vv).run() for s in SEEDS]
    return out
def cmp(res, a, b):
    da = {r['seed']: net_value(r) for r in res[a]}
    d = [net_value(r) - da[r['seed']] for r in res[b]]
    fails = sum(1 for r in res[b] if r['failed'])
    return statistics.median(d), sum(1 for x in d if x > 0), fails
def report(label, res):
    med = statistics.median
    print(f'## {label}')
    for n, rs in res.items():
        print(f"  {n:10s} 값 {med([net_value(r) for r in rs]):7.0f} 기여 {med([r['contrib']/100 for r in rs]):6.0f} 주선 {med([r['n_fwd'] for r in rs]):4.1f} 무역 {med([r['n_trade'] for r in rs]):4.1f} "
              f"환전 {med([r['fx_usd']/100 for r in rs]):5.0f} 미지급 {sum(1 for r in rs if r['first_unpaid'])}/20 실패 {sum(1 for r in rs if r['failed'])}/20 거절 " +
              json.dumps({k: med([r['reject'][k] for r in rs]) for k in rs[0]['reject']}))
    for a, b in [('V0', 'H06'), ('V0', 'H04'), ('V0', 'E'), ('V0', 'S'), ('V0', 'ES'), ('ES', 'ES+H06'), ('ES', 'ES+H04'), ('E', 'E+H04'), ('V0', 'H04@21'), ('ES', 'ES+H04@21')]:
        if a in res and b in res:
            m, w, f = cmp(res, a, b)
            print(f"    {a:3s}→{b:10s} 중앙 {m:+7.0f} 이득 {w:2d}/20 실패 {f:2d}/20")
if __name__ == '__main__':
    cfgs = {
        'A 초안+묶음 5(F1~F6)': (dict(), dict()),
        'B F+H 풀 9, 5건': (dict(), dict(templates=DEFAULT_TEMPLATES + HANDLING_TEMPLATES)),
        'C F+H 풀 9, 6건': (dict(), dict(templates=DEFAULT_TEMPLATES + HANDLING_TEMPLATES, forwarding_per_batch=6)),
    }
    for k, (p, m) in cfgs.items():
        report(k, run_cfg(p, m))
