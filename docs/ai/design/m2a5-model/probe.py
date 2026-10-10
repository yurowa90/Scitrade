# 후보 고르기 전 손 점검: 묶음별 고용 이득 표·투자 표·거절 이유. 사용: python3 probe.py [이름...]
import sys
import m2a5_model as M
SETS = {
 'SPEC_P': {},
 'A_F3H3_3m3': dict(fwd_split=(3, 3), fwd_per_batch=6),
 'B_F2H4_9m3': dict(fwd_split=(2, 4), fwd_per_batch=6, h_qty_scale=3, h_l_per_pt=750),
 'B_F2H4_9m3_S20': dict(fwd_split=(2, 4), fwd_per_batch=6, h_qty_scale=3, h_l_per_pt=750, space_l=20000, space_g=3_000_000),
 'C_F3H3_6m3': dict(fwd_split=(3, 3), fwd_per_batch=6, h_qty_scale=2, h_l_per_pt=500),
}
names = sys.argv[1:] or list(SETS)
pols = M.search_policies()
for name in names:
    P = dict(M.SPEC_P, **SETS[name])
    res = M.run_many(M.REPO_DEFAULT, P, pols)
    M._PCHECK['ok'] = M.quotes_ok(M._ed(), P)
    ev = M.evaluate(res)
    print(f"== {name} v0={ev['v0']:.0f} c={ev['c1']:d}{ev['c2']:d}{ev['c3']:d}{ev['c4']:d} robust={ev['robust']} near={ev['robust_near']} regret={ev['robust_regret']:.0f} top={ev['top_win']} wins={sorted(ev['wins'].items(), key=lambda x:-x[1])[:5]}")
    for h in M.HIRES:
        print('  ', f'{h:8s}', ' | '.join(f"{x['delta']:+6.0f} {x['pos']:2d} f{x['fails']}" for x in ev['hire_rows'] if x['hire'] == h))
    print('   inv', ', '.join(f"{x['inv']} {x['delta']:+.0f} {x['pos']}" for x in ev['inv_rows']))
    for inv in M.INVS:
        s = M.summarize(res[f'N|fx7|nohire|{inv}'])
        print(f'   nohire/{inv}: dec', {k: v for k, v in s['dec_detail'].items() if v}, 'idle', round(s['idle'][0], 2), 'contrib', round(s['contrib'][0]))
