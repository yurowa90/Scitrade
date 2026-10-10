# 직원의 그림자 가치: 임금 0인 직원을 7일에 더했을 때 기여이익이 얼마나 느는가.
import statistics, sim
from sim import Game, net_value, STAFF
from market import DEFAULT_TEMPLATES
from explore2 import H6
SEEDS = list(range(1001, 1021))
SP = [('HAIPHONG', 1), ('SHANGHAI', 1)]
def go(label, m, extra=None):
    STAFF['FREE2'] = (2, 0); STAFF['FREE3'] = (3, 0)
    base = {}
    for name, v in [('V0', {}), ('E', dict(expand_day=7)), ('ES', dict(expand_day=7, space=SP)),
                    ('V0+free2', dict(hires=[('FREE2', 7)])), ('E+free3', dict(expand_day=7, hires=[('FREE3', 7)])),
                    ('ES+free3', dict(expand_day=7, space=SP, hires=[('FREE3', 7)])), ('ES+free3x2', dict(expand_day=7, space=SP, hires=[('FREE3', 7), ('EMP03', 0)]))]:
        if name == 'ES+free3x2': continue
        v = dict(v, mparams=m, params=(extra or {}))
        rs = [Game(s, v).run() for s in SEEDS]
        base[name] = rs
        print(f"{label:28s} {name:10s} 기여 {statistics.median([r['contrib']/100 for r in rs]):7.0f} 값 {statistics.median([net_value(r) for r in rs]):7.0f} 거절 {[statistics.median([r['reject'][k] for r in rs]) for k in ('storage','sailing','staff','funds')]}")
go('A 초안', {})
go('F 6F+6H 8건', dict(templates=DEFAULT_TEMPLATES + H6, forwarding_per_batch=8))
