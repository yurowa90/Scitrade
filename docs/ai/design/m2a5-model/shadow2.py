import statistics, sys
from sim import Game, net_value, STAFF
from market import DEFAULT_TEMPLATES
SEEDS = list(range(1001, 1021))
SP = [('HAIPHONG', 1), ('SHANGHAI', 1)]
STAFF['FREE2'] = (2, 0); STAFF['FREE3'] = (3, 0)
def H(scale_qty=0.5, fee_scale=1.0, per_l=1000):
    base = [('H1','ELECTRONICS',200,'HAIPHONG',50000,16), ('H2','COSMETICS',300,'SHANGHAI',48000,18), ('H3','APPAREL',2000,'HAIPHONG',52000,16),
            ('H4','ELECTRONICS',300,'SHANGHAI',60000,18), ('H5','AUTO_PARTS',150,'SHANGHAI',48000,18), ('H6','APPAREL',3000,'HAIPHONG',64000,16)]
    return [dict(id=i, good=g, qty=int(q*scale_qty), dest=d, fee=int(f*fee_scale), dl=14, pay=p, cls='HANDLING') for i,g,q,d,f,p in base]
def go(label, m, params):
    res = {}
    for name, v in [('V0', {}), ('V0+free2', dict(hires=[('FREE2', 7)])), ('V0+H06', dict(hires=[('EMP06', 7)])),
                    ('E', dict(expand_day=7)), ('E+free3', dict(expand_day=7, hires=[('FREE3', 7)])), ('E+H04', dict(expand_day=7, hires=[('EMP04', 7)])),
                    ('ES', dict(expand_day=7, space=SP)), ('ES+H04', dict(expand_day=7, space=SP, hires=[('EMP04', 7)]))]:
        v = dict(v, mparams=m, params=params)
        res[name] = [Game(s, v).run() for s in SEEDS]
    med = statistics.median
    def d(a, b):
        A = {r['seed']: net_value(r) for r in res[a]}
        xs = [net_value(r) - A[r['seed']] for r in res[b]]
        return f"{med(xs):+6.0f} 이득{sum(1 for x in xs if x>0):2d} 실패{sum(1 for r in res[b] if r['failed']):2d}"
    print(f"{label:34s} V0값 {med([net_value(r) for r in res['V0']]):6.0f} 기여 {med([r['contrib']/100 for r in res['V0']]):6.0f} | free2 {d('V0','V0+free2')} | H06 {d('V0','V0+H06')} | E {d('V0','E')} | E free3 {d('E','E+free3')} | E+H04 {d('E','E+H04')} | ES+H04 {d('ES','ES+H04')}")
for label, m, p in [
    ('G 6F+6H(3m³,6pt) 6건', dict(templates=DEFAULT_TEMPLATES + H(0.5, 1.0, 500), forwarding_per_batch=6), dict(handling_l_per_pt=500)),
    ('H 6F+6H(3m³,6pt) 8건', dict(templates=DEFAULT_TEMPLATES + H(0.5, 1.0, 500), forwarding_per_batch=8), dict(handling_l_per_pt=500)),
    ('I 6F+6H(3m³,6pt) 8건 fee×1.5', dict(templates=DEFAULT_TEMPLATES + H(0.5, 1.5, 500), forwarding_per_batch=8), dict(handling_l_per_pt=500)),
    ('J 6F+6H(6m³,6pt) 8건 fee×1.5', dict(templates=DEFAULT_TEMPLATES + H(1.0, 1.5), forwarding_per_batch=8), dict()),
    ('K 6F+6H(3m³,6pt) 8건 fee×2', dict(templates=DEFAULT_TEMPLATES + H(0.5, 2.0, 500), forwarding_per_batch=8), dict(handling_l_per_pt=500)),
]:
    go(label, m, p)
