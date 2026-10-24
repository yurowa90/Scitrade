# KRW-only idle play under rule 2 with the EXISTING skip settlement (engine.ts:1137-1157).
# Steps per day: 2 exchange -> 6b settle (skip) -> 6c rent -> 6d wages (EMP01, EMP02) -> 6e D04.
def run(ex=None, expand_day=None, until=90, verbose_days=()):
    ex = ex or {}
    cash = 10_000_000; obls = []  # [id, amt, day, paid]
    out = {}
    for d in range(1, until + 1):
        cash += ex.get(d, 0) * 128_700
        if expand_day == d: cash -= 200_000  # setup fee (optional spend, assumed affordable)
        for o in obls:
            if o[3] is None and cash >= o[1]:
                cash -= o[1]; o[3] = d
        def pay(oid, amt):
            nonlocal cash
            if cash >= amt: cash -= amt
            else: obls.append([oid, amt, d, None])
        if d in (1, 31, 61):
            rent = 450_000 + (250_000 if expand_day is not None and expand_day + 1 <= d else 0)
            pay(f'RENT-D{d:03d}', rent)
        pay(f'WAGE-D{d:03d}-EMP01', 80_000); pay(f'WAGE-D{d:03d}-EMP02', 80_000)
        unpaid = [o for o in obls if o[3] is None]
        oldest = min(unpaid, key=lambda o: (o[2], obls.index(o))) if unpaid else None
        out[d] = dict(cash=cash, unpaid=sum(o[1] for o in unpaid), n=len(unpaid), oldest=oldest and (oldest[0], oldest[2]))
        if d in verbose_days: print(d, out[d])
        if oldest and d - oldest[2] >= 14:
            print('FAIL day', d, out[d]); return out
    print('END', until, out[until]); return out

print('--08 (1일 700 USD)'); run({1: 7}, verbose_days=(60, 61, 62, 63, 64, 68, 75))
print('--09A'); run(verbose_days=(56, 57, 63, 64, 71))
print('--09B'); run({70: 20}, verbose_days=(69, 70, 71, 85))
print('--09C'); run({70: 1}, verbose_days=(70, 71, 72))
print('--10 expand 22'); run(expand_day=22, verbose_days=(22, 31, 54, 55, 61))
print('--07 day57 100 USD'); run({57: 1}, verbose_days=(56, 57, 58))
