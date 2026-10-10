# D04·지급 순서 인수 사례 손계산 검산(투자·수락 없음, 환전 수동)
from sim import Game
def run(exchanges, upto=90, show=()):
    g = Game(42032026, dict(accept=False, fx=False))
    for d in range(1, upto + 1):
        g.day = d
        if d in exchanges:
            usd = exchanges[d]
            g.usd -= usd * 100; g.krw += usd * g.rate_buy
        g.commands(d); g.progress(d); g.departures_arrivals(d); g.deliveries(d); g.finance(d); g.d04(d)
        if d in show:
            un = [(o['id'], o['amt']) for o in g.obl if o['paid'] is None]
            print(f'  d{d} 마감: KRW {g.krw:,} 미지급 {sum(a for _, a in un):,} ({len(un)}건) 가장 오래된 {un[0] if un else None} 실패 {g.failed}')
        if g.failed: break
    return g
print('A 환전 없음'); run({}, show=(56, 57, 58, 61, 63, 64, 70, 71))
print('B 70일 2,000 USD'); run({70: 2000}, upto=72, show=(69, 70, 71, 72))
print('C 70일 100 USD'); run({70: 100}, upto=72, show=(70, 71, 72))
print('D 1일 700 USD'); run({1: 700}, upto=76, show=(60, 61, 62, 75))
print('E 57일 100 USD'); run({57: 100}, upto=58, show=(57, 58))
