# SPEC 12절 표를 만드는 최종 평가. 사용: python3 final_eval.py > final_eval.txt
import statistics
from sim import Game, net_value
from market import DEFAULT_TEMPLATES, HANDLING_TEMPLATES
SEEDS = list(range(1001, 1021))
med = statistics.median
CFG = {
    'A 결정 묶음 문구 그대로(F1~F6, 묶음당 5건, 6 m³당 1pt)': (dict(forwarding_per_batch=5, templates=DEFAULT_TEMPLATES), dict(space_fee=3000)),
    'P 사전 조정안(F1~F6+H1~H6, 묶음당 6건, H 0.25 m³당 1pt)': (dict(forwarding_per_batch=6, templates=DEFAULT_TEMPLATES + HANDLING_TEMPLATES), dict(space_fee=3000, handling_l_per_pt=250)),
}
VARS = [
    ('V0 투자 없음·환전', {}, None), ('NOFX 환전 없음', dict(fx=False), None),
    ('E@7 창고 확장', dict(expand_day=7), 'V0 투자 없음·환전'),
    ('S@1 상하이 선복 계약', dict(space=[('SHANGHAI', 1)]), 'V0 투자 없음·환전'),
    ('S@1 하이퐁 선복 계약', dict(space=[('HAIPHONG', 1)]), 'V0 투자 없음·환전'),
    ('H06@7 바름 고용', dict(hires=[('EMP06', 7)]), 'V0 투자 없음·환전'),
    ('H06@22 바름 고용', dict(hires=[('EMP06', 22)]), 'V0 투자 없음·환전'),
    ('H06@36 바름 고용', dict(hires=[('EMP06', 36)]), 'V0 투자 없음·환전'),
    ('H04@7 현돌 고용', dict(hires=[('EMP04', 7)]), 'V0 투자 없음·환전'),
    ('H04@22 현돌 고용', dict(hires=[('EMP04', 22)]), 'V0 투자 없음·환전'),
    ('E@21+H04@22 확장+현돌', dict(expand_day=21, hires=[('EMP04', 22)]), 'V0 투자 없음·환전'),
    ('E@7+H04@7 확장+현돌', dict(expand_day=7, hires=[('EMP04', 7)]), 'E@7 창고 확장'),
    ('H06@22+H05@36 두 명 고용', dict(hires=[('EMP06', 22), ('EMP05', 36)]), 'V0 투자 없음·환전'),
]
for label, (m, p) in CFG.items():
    print(f'## {label}')
    res = {}
    for name, v, ref in VARS:
        res[name] = [Game(s, dict(v, mparams=m, params=p)).run() for s in SEEDS]
    for name, v, ref in VARS:
        rs = res[name]
        line = (f"| {name} | {med([net_value(r) for r in rs]):,.0f} | {med([r['contrib']/100 for r in rs]):,.0f} | {med([r['fx_usd']/100 for r in rs]):,.0f} | "
                f"{sum(1 for r in rs if r['first_unpaid'])}/20 | {sum(1 for r in rs if r['failed'])}/20")
        fd = [r['failed']['day'] for r in rs if r['failed']]
        line += f" ({min(fd)}~{max(fd)}일)" if fd else ''
        if ref:
            base = {r['seed']: net_value(r) for r in res[ref]}
            d = [net_value(r) - base[r['seed']] for r in rs]
            line += f" | {ref.split()[0]} 대비 {med(d):+,.0f} | {sum(1 for x in d if x > 0)}/20 |"
        else:
            line += ' | — | — |'
        print(line)
    print()
