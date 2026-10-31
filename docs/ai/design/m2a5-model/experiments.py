# 변형별 20시드 결과 표. 사용: python3 experiments.py [변형 묶음 이름]
import sys, statistics, json
from sim import Game, net_value
SEEDS = list(range(1001, 1021))  # src/engine/sim/sim.ts SIM_SEEDS와 같다

def variants(extra_params=None, extra_m=None):
    P = extra_params or {}
    M = extra_m or {}
    base = dict(params=P, mparams=M)
    V = {
        'V0 기본': {},
        'H06@7 바름 고용': dict(hires=[('EMP06', 7)]),
        'H04@7 현돌 고용': dict(hires=[('EMP04', 7)]),
        'E@7 창고 확장': dict(expand_day=7),
        'S@1 선복 계약(양 노선)': dict(space=[('HAIPHONG', 1), ('SHANGHAI', 1)]),
        'ES 확장+선복': dict(expand_day=7, space=[('HAIPHONG', 1), ('SHANGHAI', 1)]),
        'ES+H06@7': dict(expand_day=7, space=[('HAIPHONG', 1), ('SHANGHAI', 1)], hires=[('EMP06', 7)]),
        'ES+H04@7': dict(expand_day=7, space=[('HAIPHONG', 1), ('SHANGHAI', 1)], hires=[('EMP04', 7)]),
        'ES+H06@7+H05@14': dict(expand_day=7, space=[('HAIPHONG', 1), ('SHANGHAI', 1)], hires=[('EMP06', 7), ('EMP05', 14)]),
        'NOFX 환전 없음': dict(fx=False),
    }
    out = {}
    for k, v in V.items():
        vv = dict(v); vv.update(base); out[k] = vv
    return out

def run_all(vs, seeds=SEEDS):
    res = {}
    for name, v in vs.items():
        res[name] = [Game(s, v).run() for s in seeds]
    return res

def table(res, ref='V0 기본'):
    refv = {r['seed']: net_value(r) for r in res[ref]}
    lines = []
    for name, rs in res.items():
        nv = [net_value(r) for r in rs]
        fails = [r['failed']['day'] for r in rs if r['failed']]
        fu = [r['first_unpaid'] for r in rs if r['first_unpaid']]
        delta = [net_value(r) - refv[r['seed']] for r in rs]
        wins = sum(1 for x in delta if x > 0)
        med = statistics.median
        lines.append(f"{name:24s} 값중앙 {med(nv):8.0f} ({min(nv):7.0f}~{max(nv):7.0f}) | 기준대비 중앙 {med(delta):+7.0f} 이득시드 {wins:2d}/20 | "
                     f"USD끝 {med([r['usd']/100 for r in rs]):7.0f} KRW끝 {med([r['krw'] for r in rs]):9.0f} | 기여 {med([r['contrib']/100 for r in rs]):6.0f} "
                     f"환전 {med([r['fx_usd']/100 for r in rs]):6.0f} | 계약 {med([r['n'] for r in rs]):4.1f} 주선 {med([r['n_fwd'] for r in rs]):4.1f} 지연 {med([r['late'] for r in rs]):3.1f} "
                     f"| 미지급 {len(fu):2d}/20 실패 {len(fails):2d}/20 {('('+str(min(fails))+'~'+str(max(fails))+')') if fails else ''} | 거절 {json.dumps({k: med([r['reject'][k] for r in rs]) for k in rs[0]['reject']})}")
    return '\n'.join(lines)

if __name__ == '__main__':
    res = run_all(variants())
    print(table(res))
    print('---- ES 기준')
    print(table({k: v for k, v in res.items() if k.startswith('ES')}, ref='ES 확장+선복'))
