# 1일 묶음 기대 경로(scenarios.json expected_paths_usd)를 모형으로 재현해 17일 USD 현금을 본다.
from sim import Game, ROUTES, GOODS, trade_prep, fwd_prep, half_up_div
def path(trade_ids, fwd, sail):
    g = Game(42032026, dict(accept=False, fx=False))
    orig = g.commands
    def cmds(d):
        orig(d)
        if d != 1: return
        cands = {tuple(c['offers']): c for c in g.candidates(1)}
        for key, s in [(trade_ids, sail[trade_ids[0]])] + [((f,), sail[f]) for f in fwd]:
            c = [c for k, c in cands.items() if k == tuple(key)][0]
            # 특정 편으로 강제
            import sim
            saved = sim.SAILING_DAYS
            sim.SAILING_DAYS = [s]
            ok = g.try_accept(1, c)
            sim.SAILING_DAYS = saved
            print(key, s, ok, 'prep', c['prep'])
    g.commands = cmds
    for d in range(1, 18):
        g.day = d; g.commands(d); g.progress(d); g.departures_arrivals(d); g.deliveries(d); g.finance(d)
        for o in g.offers.values():
            if o['status'] == 'OPEN' and o['valid'] < d + 1: o['status'] = 'EXPIRED'
        if d in (1, 7, 17): print('day', d, 'usd', g.usd/100, 'krw', g.krw, 'unpaid', g.unpaid('KRW'), [ (c['id'], c['state']) for c in g.contracts])
path(('OFFER_BUY_02','OFFER_SELL_02'), ['OFFER_FWD_01','OFFER_FWD_02'], {'OFFER_BUY_02':2,'OFFER_FWD_01':2,'OFFER_FWD_02':9})
path(('OFFER_BUY_01','OFFER_SELL_01'), ['OFFER_FWD_01','OFFER_FWD_02'], {'OFFER_BUY_01':2,'OFFER_FWD_01':2,'OFFER_FWD_02':9})
