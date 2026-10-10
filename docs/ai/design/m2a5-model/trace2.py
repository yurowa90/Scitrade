import sys
from sim import Game
from explore2 import H6
from market import DEFAULT_TEMPLATES
def trace(v, seed, frm=29, to=60):
    v = dict(v, mparams=dict(templates=DEFAULT_TEMPLATES + H6, forwarding_per_batch=8))
    g = Game(seed, v)
    oc = g.commands
    def cmds(d):
        before = len(g.contracts); rej = dict(g.reject)
        oc(d)
        new = g.contracts[before:]
        if frm <= d <= to and (new or d % 7 == 1):
            print(f" d{d:02d} usd {g.usd/100:7.0f} avail {g.avail_usd()/100:7.0f} krw {g.krw:8d} occ {g.occupancy()/1000:4.1f} emps {sorted(g.emps)} new " +
                  ', '.join(f"{c['kind']}{c['good'][:3]}{c['qty']}>{c['dest'][:1]}@{c['sailing']}({c['contrib']/100:.0f},{c['prep']})" for c in new) +
                  f" rej+{ {k: g.reject[k]-rej[k] for k in rej if g.reject[k]-rej[k]} }")
    g.commands = cmds
    r = g.run()
    print(' 끝', r['contrib']/100, r['usd']/100, r['krw'], r['fx_usd']/100, r['reject'])
trace({}, 1001)
print('---- H04@36')
trace(dict(hires=[('EMP04', 36)]), 1001)
