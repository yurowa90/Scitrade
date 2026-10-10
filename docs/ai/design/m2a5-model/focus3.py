import statistics, sys
from focus import evaluate, VARS
from search import htemplates
from market import DEFAULT_TEMPLATES
SP = [('SHANGHAI', 1)]
VARS.update({'S@1(상하이)': dict(space=SP), 'S@1(하이퐁)': dict(space=[('HAIPHONG', 1)])})
for k in ['ES', 'S@1']: VARS.pop(k, None)
for vol, pt, mpp, ns, nh in [(3, 12, 70, 4, 2), (3, 12, 70, 4, 3), (3, 12, 60, 4, 3), (3, 10, 70, 4, 3), (3, 12, 70, 5, 2), (3, 12, 65, 4, 3)]:
    m = dict(templates=DEFAULT_TEMPLATES + htemplates(vol, pt, mpp), forwarding_per_class={'STANDARD': ns, 'HANDLING': nh})
    evaluate(f'vol{vol} pt{pt} mpp{mpp} S{ns}H{nh}', m, dict(handling_l_per_pt=int(vol * 1000 / pt) + 1, space_fee=3000))
