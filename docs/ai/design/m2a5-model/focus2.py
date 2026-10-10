import statistics
from sim import Game, net_value
from search import htemplates
from market import DEFAULT_TEMPLATES
SEEDS = list(range(1001, 1021))
med = statistics.median
def cmpv(m, p, a, b):
    A = {s: net_value(Game(s, dict(a, mparams=m, params=p)).run()) for s in SEEDS}
    rs = [Game(s, dict(b, mparams=m, params=p)).run() for s in SEEDS]
    d = [net_value(r) - A[r['seed']] for r in rs]
    return round(med(d)), sum(1 for x in d if x > 0), sum(1 for r in rs if r['failed']), med([r['reject']['sailing'] for r in rs])
for label, m in [('후보 vol3 pt12 mpp70 n6', dict(templates=DEFAULT_TEMPLATES + htemplates(3, 12, 70), forwarding_per_batch=6)),
                 ('초안 A', dict())]:
    for fee in (2000, 3000, 4000, 6000):
        for routes in (['HAIPHONG'], ['SHANGHAI'], ['HAIPHONG', 'SHANGHAI']):
            p = dict(handling_l_per_pt=251, space_fee=fee) if '후보' in label else dict(space_fee=fee)
            r = cmpv(m, p, {}, dict(space=[(x, 1) for x in routes]))
            print(label, 'fee', fee/100, routes, 'Δ중앙,이득,실패,선복거절', r)
    for day in (7, 21):
        p = dict(handling_l_per_pt=251) if '후보' in label else {}
        print(label, 'E@', day, cmpv(m, p, {}, dict(expand_day=day)))
