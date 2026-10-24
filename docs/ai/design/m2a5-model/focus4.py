from focus import evaluate, VARS
from search import htemplates
from market import DEFAULT_TEMPLATES
VARS.update({'S@1(상하이)': dict(space=[('SHANGHAI', 1)]), 'S@1(하이퐁)': dict(space=[('HAIPHONG', 1)]),
             'S@22(상하이)': dict(space=[('SHANGHAI', 22)]), 'E@21': dict(expand_day=21)})
for k in ['ES', 'S@1']: VARS.pop(k, None)
for mpp, n, fee in [(70, 6, 3000), (65, 6, 3000), (70, 6, 2000), (70, 7, 3000)]:
    m = dict(templates=DEFAULT_TEMPLATES + htemplates(3, 12, mpp), forwarding_per_batch=n)
    evaluate(f'P mpp{mpp} n{n} space{fee//100}', m, dict(handling_l_per_pt=251, space_fee=fee))
