# 작업 포함(H) 서비스 대금 민감도: 후보마다 대금 가감(USD)별 판정과 고용 이득. 사용: python3 fee_band.py > out/fee_band.md
import m2a5_model as M
print('# 작업 포함 주선 서비스 대금 민감도 (시드 1001~1020, 정책 29개)')
print()
print('| 후보 | 대금 가감 USD | pt당 기여이익 USD | 판정 1234 | 투자 없는 회사 분석값 | 90k@30 투자 없음 | 90k@30 SE | 110k@30 투자 없음 | 110k@30 SE | 투자 SE만 |')
print('|---|---:|---:|---|---:|---|---|---|---|---|')
for name in ['CAND_A', 'CAND_B', 'CAND_C']:
    for add in (-150, -100, -50, 0, 100, 200):
        P = dict(M.resolve_params(name), h_fee_add=add)
        res = M.run_many(M.REPO_DEFAULT, P, M.search_policies())
        M._PCHECK['ok'] = M.quotes_ok(M._ed(), P)
        ev = M.evaluate(res)
        h = {(x['hire'], x['inv']): x for x in ev['hire_rows']}
        f = lambda k: f"{h[k]['delta']:+,.0f} ({h[k]['pos']})"
        se = next(x for x in ev['inv_rows'] if x['inv'] == 'SE')
        print(f"| {name} | {add:+d} | {(840 + add) / 12:.0f} | {ev['c1']:d}{ev['c2']:d}{ev['c3']:d}{ev['c4']:d} | {ev['v0']:,.0f} | "
              f"{f(('90k@30', 'noinv'))} | {f(('90k@30', 'SE'))} | {f(('110k@30', 'noinv'))} | {f(('110k@30', 'SE'))} | {se['delta']:+,.0f} ({se['pos']}) |", flush=True)
