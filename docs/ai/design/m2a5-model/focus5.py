from focus import evaluate, VARS
from search import htemplates
from market import DEFAULT_TEMPLATES
for k in ['ES', 'S@1', 'ES+H04@22']: VARS.pop(k, None)
for vol, pt, mpp, n in [(3, 12, 75, 5), (3, 12, 80, 5), (3, 14, 70, 5), (3, 14, 75, 5), (3, 16, 70, 5)]:
    m = dict(templates=DEFAULT_TEMPLATES + htemplates(vol, pt, mpp), forwarding_per_batch=n)
    evaluate(f'vol{vol} pt{pt} mpp{mpp} n{n}', m, dict(handling_l_per_pt=int(vol * 1000 / pt) + 1, space_fee=3000))
