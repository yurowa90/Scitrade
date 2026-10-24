import json, sys, random, math
D = sys.argv[1]
C = json.load(open(f'{D}/m4.json')); R = json.load(open(f'{D}/m5.json'))['out']
halfUp = lambda n, d: (n + d // 2) // d
GRADE = {'CUSTOMER_HAI_COSMETICS_NEW': 'A', 'CUSTOMER_SHA_COSMETICS_NEW': 'B', 'CUSTOMER_HAI_LAVER': 'C', 'CUSTOMER_SHA_LAVER': 'B'}
P = {'A': 200, 'B': 500, 'C': 1200}; F = {'BASE': 100, 'D15': 150, 'D30': 200}; PREM = {'BASE': 0, 'D15': 300, 'D30': 600}; TERM = {'BASE': 0, 'D15': 15, 'D30': 30}
RHO = 0.30
# 1. 1로트 최대 판매액(센트), H24-2: 손잡이 범위의 최댓값
#    판매 마진 k 최대(+3: SELL = SELL0 + BUY × 0.15), 지수 상한 11500bp, 지역 +4, 거래처 +3, 가산 D30 최대 800bp
BUY = {'COSMETICS': 4000, 'SEASONED_LAVER': 2000}
rows = {('COSMETICS', 'HAI'): (5170, 50), ('COSMETICS', 'SHA'): (5300, 50), ('SEASONED_LAVER', 'HAI'): (2560, 100), ('SEASONED_LAVER', 'SHA'): (2660, 100)}
K_MAX, PREM_MAX = 3, 800
lotmax = {}
for (g, city), (base, lot) in rows.items():
    out = []
    for k, prem in ((0, 600), (K_MAX, PREM_MAX)):
        sell = base + BUY[g] * 5 * k // 100
        row = halfUp(sell * 11500 * 104, 1000000); unit = halfUp(row * 103, 100); s0 = unit * lot
        out += [s0, halfUp(s0 * (10000 + prem), 10000)]
    lotmax[(g, city)] = tuple(out)
print('lotmax (k0 lot, k0+600, kmax lot, kmax+800)', lotmax)
Lstar = max(v[3] for v in lotmax.values()); Lunit = -(-Lstar // 10000) * 10000
print('L*', Lstar, 'unit', Lunit)
LIM_OLD = {'A': 800000, 'B': 500000, 'C': 250000}
LIM_NEW = {'A': 3 * Lunit, 'B': 2 * Lunit, 'C': 1 * Lunit}
print('new limits', LIM_NEW)
def rate(seed, day): return R[str(seed)][min(day, 90)]
for c in C:
    c['g'] = GRADE[c['cust']]; c['eff'] = c['invDue'] if c['invDue'] is not None else max(c['due'], c['del'] or c['due'])
    c['exp'] = c['realized'] - sum(c['comp'].values()); c['lossR3'] = c['realized'] < 0
    c['dates'] = [t for t in ('D30', 'D15') if c['due'] + TERM[t] + 15 <= 90]
def choose(cs, lim, policy):
    """정책별 조건 선택. 노출액은 같은 거래처의 비BASE 계약 가운데 수락~(완료+기간) 사이."""
    out = {}
    by = {}
    for c in cs: by.setdefault(c['seed'], []).append(c)
    for seed, lst in by.items():
        open_ = []
        for i, c in enumerate(sorted(lst, key=lambda c: c['acc'])):
            expo = sum(a for (cu, s, e, a) in open_ if cu == c['cust'] and s <= c['acc'] < e)
            t = 'BASE'
            if not (policy == 'CA' and c['g'] == 'C'):
                for cand in c['dates']:
                    amt = halfUp(c['sale'] * (10000 + PREM[cand]), 10000)
                    if lim is None or expo + amt <= lim[c['g']]:
                        t = cand; break
            if t != 'BASE':
                end = (c['done'] + TERM[t]) if c['done'] is not None else 999
                open_.append((c['cust'], c['acc'], end, halfUp(c['sale'] * (10000 + PREM[t]), 10000)))
            out[id(c)] = t
    return out
n = len(C); seeds = sorted({c['seed'] for c in C})
tgt = [c for c in C if c['dates']]
print(f'contracts {n}, seeds {len(seeds)}, target(date-only nonBASE) {len(tgt)} = {len(tgt)/n:.3f}, D30 date {sum("D30" in c["dates"] for c in C)/n:.3f}')
for g in 'ABC': 
    gs = [c for c in C if c['g'] == g]; print(' grade', g, len(gs), f'{len(gs)/n:.3f}', 'date-eligible', sum(1 for c in gs if c['dates']))
trunc = sum(1 for c in C if c['eff'] + 15 <= 90) / n
print(f'BASE truncation factor (eff due+15<=90) {trunc:.3f}')
lots = {}
for c in C: lots[(c['g'], c['qty'] // (50 if c['good']=='COSMETICS' else 100))] = lots.get((c['g'], c['qty'] // (50 if c['good']=='COSMETICS' else 100)), 0) + 1
print('lots by grade', sorted(lots.items()))
def fx_extra(c, t):
    if t == 'BASE': return 0, 0
    r0, r1 = rate(c['seed'], c['eff']), rate(c['seed'], c['eff'] + TERM[t])
    prem_cents = halfUp(c['sale'] * PREM[t], 10000)
    return halfUp(c['sale'] * (r1 - r0), 100), halfUp(prem_cents * r1, 100)
def other_loss(c, t, fx=True, risk3=True):
    dfx, prem = fx_extra(c, t)
    base = c['realized'] if risk3 else c['exp'] + (c['comp']['fx'] if fx else 0)
    return (base + prem + (dfx if fx else 0)) < 0
for label, lim in (('none', None), ('old', LIM_OLD), ('new', LIM_NEW)):
    tg = choose(C, lim, 'TG'); ca = choose(C, lim, 'CA')
    sel = [c for c in C if tg[id(c)] != 'BASE']
    blocked = [c for c in tgt if tg[id(c)] == 'BASE']
    print(f'\n== limit {label}: TG nonBASE {len(sel)}/{n} = {len(sel)/n:.3f} (D30 {sum(tg[id(c)]=="D30" for c in C)/n:.3f}); target blocked by limit {len(blocked)}')
    for g in 'ABC':
        tg_g = [c for c in tgt if c['g'] == g]
        if tg_g: print(f'   grade {g}: target {len(tg_g)}, TG nonBASE {sum(tg[id(c)]!="BASE" for c in tg_g)}  D15 {sum(tg[id(c)]=="D15" for c in tg_g)} D30 {sum(tg[id(c)]=="D30" for c in tg_g)}')
    # L3 ① expected ratio over target (policy independent)
    def lossp(c, t):
        p = P[c['g']] * F[t] / 1e6 * (1 if c['eff'] + TERM[t] + 15 <= 90 else 0)
        return p + (1 - p) * other_loss(c, t)
    eTG = sum(lossp(c, tg[id(c)]) for c in tgt); eCA = sum(lossp(c, ca[id(c)]) for c in tgt)
    print(f'   L3 ① expected: TG {eTG/len(tgt):.4f} CA {eCA/len(tgt):.4f} ratio {eCA/eTG:.3f}')
    # divergent events per seed
    div = {s: [] for s in seeds}; gain = {s: 0.0 for s in seeds}
    for c in C:
        a, b = tg[id(c)], ca[id(c)]
        if a == b: continue
        # 확정 규칙(H24-3): 실효 결제일 + 기간 + 15 ≤ 90일 때만 대손이 확정된다(74·118행과 같다)
        pa = P[c['g']] * F[a] / 1e6 * (c['eff'] + TERM[a] + 15 <= 90); pb = P[c['g']] * F[b] / 1e6 * (c['eff'] + TERM[b] + 15 <= 90)
        div[c['seed']].append((pa - pb, other_loss(c, a), other_loss(c, b)))
        dfx, prem = fx_extra(c, a)
        sk = c['sale'] * rate(c['seed'], c['eff']) / 100
        vTG = (sk + prem + dfx) * (1 - pa * (1 - RHO)); vCA = sk * (1 - pb * (1 - RHO))
        gain[c['seed']] += (vCA - vTG) / 1300
    ev = sum(sum(x[0] for x in v) for v in div.values()) / len(seeds)
    det = sum(sum(1 for x in v if x[1] != x[2]) for v in div.values())
    print(f'   divergent default events per seed {ev:.3f}; deterministic other-loss differences {det}; C contracts differing {sum(len(v) for v in div.values())}')
    gs = list(gain.values()); mu = sum(gs)/len(gs); sd = (sum((x-mu)**2 for x in gs)/(len(gs)-1))**.5
    print(f'   CA-TG expected analysis gain per seed USD mean {mu:.0f} sd {sd:.0f}')
    TH = {10:9,11:9,12:10,13:10,14:11,15:12,16:12,17:13,18:13,19:14,20:15,21:15,22:16,23:16,24:17,25:18,26:18,27:19,28:19,29:20,30:20,31:21,32:22,33:22,34:23,35:23,36:24,37:24,38:25,39:26,40:26}
    random.seed(7); passes = 0; ms = []
    for it in range(4000):
        pos = neg = 0
        for s in seeds:
            d = 0
            for (pd, ola, olb) in div[s]:
                u = random.random()
                d += 1 if u < pd else 0
                d += (ola - olb) if u >= pd else 0
            pos += d > 0; neg += d < 0
        m = pos + neg; ms.append(m)
        passes += (m >= 10 and pos >= TH[min(m, 40)])
    print(f'   L3 ② sign test power {passes/4000:.3f}; mean nonzero seeds {sum(ms)/len(ms):.1f}')
    # J9: TG R0'->R1 loss ratio (contracts = all); base company too
    r0 = sum(other_loss(c, tg[id(c)], fx=False, risk3=False) for c in C) / n
    r1 = sum(other_loss(c, tg[id(c)], fx=True, risk3=False) for c in C) / n
    b0 = sum(c['exp'] < 0 for c in C) / n; b1 = sum(c['exp'] + c['comp']['fx'] < 0 for c in C) / n
    print(f'   J9: TG R0p {r0:.4f} R1 {r1:.4f} rise {100*(r1-r0):.2f}pp ; base R0p {b0:.4f} R1 {b1:.4f}')
    # fx component size: mean |fx| as share of sale, base vs TG
    fb = sum(abs(c['comp']['fx']) for c in C) / sum(c['sale']*13 for c in C)
    ft = sum(abs(c['comp']['fx'] + fx_extra(c, tg[id(c)])[0]) for c in C) / sum(c['sale']*13 for c in C)
    print(f'   fx |component| / sale: base {fb:.4f} TG {ft:.4f}')
# L1 expected (base company, BASE, R4)
l1 = sum((lambda p: p + (1 - p) * c['lossR3'])(P[c['g']] / 1e4 * (1 if c['eff'] + 15 <= 90 else 0)) for c in C) / n
print(f'\nL1 expected {l1:.4f}; R3 loss share {sum(c["lossR3"] for c in C)/n:.4f}; claim-neg share {sum(c["comp"]["claim"]<0 for c in C)/n:.4f}')
# L1 sampling: binomial-ish sd for 40 seeds pooled
print(f'L1 sd approx {math.sqrt(l1*(1-l1)/n):.4f}; P(L1<5%) normal approx {0.5*math.erfc((l1-0.05)/math.sqrt(l1*(1-l1)/n)/math.sqrt(2)):.3f}')
# J9 대안: 시드별 환율 성분 크기(Σ|fx| ÷ Σ판매액) TG vs 기준 회사, R1
tg = choose(C, LIM_NEW, 'TG')
pos = neg = 0; diffs = []
for s in seeds:
    cs = [c for c in C if c['seed'] == s]
    den = sum(c['sale'] * 13 for c in cs)
    a = sum(abs(c['comp']['fx'] + fx_extra(c, tg[id(c)])[0]) for c in cs) / den
    b = sum(abs(c['comp']['fx']) for c in cs) / den
    diffs.append(a - b); pos += a > b; neg += a < b
print(f'J9 alt per-seed |fx| share TG>base {pos}, < {neg}, mean diff {100*sum(diffs)/len(diffs):.3f}pp')
# C 대상이 있는 시드 수(구조적 상한)
for label, lim in (('date', None), ('new', LIM_NEW)):
    t = choose(C, lim, 'TG')
    print(label, 'seeds with >=1 C nonBASE under TG', len({c['seed'] for c in C if c['g']=='C' and t[id(c)]!='BASE'}))
# J8·L4·진단 V 사전 분포(H24-1): 같은 계약 집합, 공통 난수, 분석값 차이 = 가산 + 환율 차이 − 대손 차이
def pol_delta(t, c, u):
    """BASE 대비 그 정책 계약의 분석값 차이(원). u는 그 계약의 공통 대손 난수."""
    sk = c['sale'] * rate(c['seed'], c['eff']) / 100
    pb = P[c['g']] / 1e4 * (c['eff'] + 15 <= 90)
    dbase = -0.7 * sk if u < pb else 0
    if t == 'BASE': return dbase
    dfx, prem = fx_extra(c, t)
    pt = P[c['g']] * F[t] / 1e6 * (c['eff'] + TERM[t] + 15 <= 90)
    return prem + dfx - (0.7 * (sk + prem + dfx) if u < pt else 0)
tg = choose(C, LIM_NEW, 'TG'); ca = choose(C, LIM_NEW, 'CA')
random.seed(11); j8 = []; l4 = []; vpos = []; vneg = []; vtie = []
for it in range(4000):
    w8 = w4 = vp = vn = vt = 0
    for s in seeds:
        cs = [c for c in C if c['seed'] == s]
        us = [random.random() for _ in cs]
        b = sum(pol_delta('BASE', c, u) for c, u in zip(cs, us))
        t = sum(pol_delta(tg[id(c)], c, u) for c, u in zip(cs, us))
        a = sum(pol_delta(ca[id(c)], c, u) for c, u in zip(cs, us))
        w8 += t > b; w4 += a > b
        vp += a > t; vn += a < t; vt += a == t
    j8.append(w8); l4.append(w4); vpos.append(vp); vneg.append(vn); vtie.append(vt)
med = lambda xs: sorted(xs)[len(xs) // 2]
print(f'J8 TG>base seeds median {med(j8)}, P(8..32) {sum(8 <= x <= 32 for x in j8)/len(j8):.3f}')
print(f'L4 CA>base seeds median {med(l4)}, P(>=26) {sum(x >= 26 for x in l4)/len(l4):.3f}')
print(f'V CA>TG seeds mean {sum(vpos)/len(vpos):.1f}, CA<TG {sum(vneg)/len(vneg):.1f}, tie {sum(vtie)/len(vtie):.1f}')
