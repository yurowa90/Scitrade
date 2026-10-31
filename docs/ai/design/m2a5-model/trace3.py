import sys
from sim import Game, net_value
from search import htemplates
from market import DEFAULT_TEMPLATES
m = dict(templates=DEFAULT_TEMPLATES + htemplates(3, 10, 70), forwarding_per_batch=6)
p = dict(handling_l_per_pt=301)
def trace(v, seed, show=True):
    g = Game(seed, dict(v, mparams=m, params=p))
    oc = g.commands
    weekly = {}
    def cmds(d):
        before = len(g.contracts); rej = dict(g.reject)
        oc(d)
        new = g.contracts[before:]
        if show and (new):
            print(f" d{d:02d} usd {g.usd/100:6.0f} av {g.avail_usd()/100:6.0f} krw {g.krw:8d} occ {g.occupancy()/1000:4.1f} " +
                  ', '.join(f"{c['kind']}{c['good'][:2]}{c['qty']}>{c['dest'][:1]}@{c['sailing']}({c['contrib']/100:.0f},{c['prep']})" for c in new) +
                  f" rej+{ {k: g.reject[k]-rej[k] for k in rej if g.reject[k]-rej[k]} }")
    g.commands = cmds
    r = g.run()
    print(' 끝 기여', r['contrib']/100, 'usd', r['usd']/100, 'krw', r['krw'], 'fx', r['fx_usd']/100, r['reject'], 'val', round(net_value(r)), 'util', r['handle_util'], 'wait', r['wait'])
    return g
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 1003
g0 = trace({}, seed)
print('---- H04@7')
g1 = trace(dict(hires=[('EMP04', 7)]), seed)
