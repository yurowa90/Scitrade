import sys
from sim import Game
from experiments import variants
name = sys.argv[1] if len(sys.argv) > 1 else 'V0 기본'
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1001
g = Game(seed, variants()[name])
orig_commands = g.commands
def cmds(d):
    before = len(g.contracts)
    rej = dict(g.reject)
    orig_commands(d)
    new = g.contracts[before:]
    if new or d in (1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78):
        print(f"d{d:02d} usd {g.usd/100:8.2f} avail {g.avail_usd()/100:8.2f} krw {g.krw:9d} occ {g.occupancy()/1000:4.1f}/{g.store_cap(d)/1000:.0f} fx {g.fx_usd/100:6.0f} new " +
              ', '.join(f"{c['kind']}{c['good'][:3]}{c['qty']}->{c['dest'][:3]}@{c['sailing']}{'L' if c['late_planned'] else ''}({c['contrib']/100:.0f},{c['prep']}pt)" for c in new) +
              f" rej+{ {k: g.reject[k]-rej[k] for k in rej if g.reject[k]-rej[k]} }")
g.commands = cmds
r = g.run()
print({k: v for k, v in r.items() if k not in ('reject',)})
