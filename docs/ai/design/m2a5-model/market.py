# M2a-5 견적 묶음 생성 참조 구현 (SPEC.md 5절). 엔진이 아니다. 정수 최소 단위만 쓴다.
from rng import Stream

GOODS = {  # 상품: 단위 부피 m³(×1000 = L), 단위 무게 kg, 기본 단위(묶음 수량 단위)
    'APPAREL': dict(vol_l=3, kg=0.5, base_lot=100),
    'COSMETICS': dict(vol_l=20, kg=6, base_lot=50),
    'FURNITURE': dict(vol_l=200, kg=20),
    'AUTO_PARTS': dict(vol_l=40, kg=12),
    'ELECTRONICS': dict(vol_l=30, kg=8),
}
HANDLING_TEMPLATES = [  # D03 나 사전 조정안(SPEC 6.4): 포장·라벨·검수가 붙은 주선. 3 m³, 12pt, 이익 840 USD. DESIGN
    dict(id='H1', good='ELECTRONICS', qty=100, dest='HAIPHONG', fee=104000, dl=14, pay=16, cls='HANDLING'),
    dict(id='H2', good='COSMETICS', qty=150, dest='SHANGHAI', fee=102000, dl=14, pay=18, cls='HANDLING'),
    dict(id='H3', good='APPAREL', qty=1000, dest='HAIPHONG', fee=104000, dl=14, pay=16, cls='HANDLING'),
    dict(id='H4', good='ELECTRONICS', qty=100, dest='SHANGHAI', fee=102000, dl=14, pay=18, cls='HANDLING'),
    dict(id='H5', good='AUTO_PARTS', qty=75, dest='SHANGHAI', fee=102000, dl=14, pay=18, cls='HANDLING'),
    dict(id='H6', good='COSMETICS', qty=150, dest='HAIPHONG', fee=104000, dl=14, pay=16, cls='HANDLING'),
]
TRADE_GOODS = ['APPAREL', 'COSMETICS']
BUY_CITY = 'PYEONGTAEK'
SELL_CITIES = ['HAIPHONG', 'SHANGHAI']
# 시세표 행 순서(지역 요인을 뽑는 순서): 매입 2행 → 하이퐁 2행 → 상하이 2행
ROWS = [('PYEONGTAEK', 'APPAREL'), ('PYEONGTAEK', 'COSMETICS'),
        ('HAIPHONG', 'APPAREL'), ('HAIPHONG', 'COSMETICS'),
        ('SHANGHAI', 'APPAREL'), ('SHANGHAI', 'COSMETICS')]
P0 = {  # 기준가 USD cents/단위 (DESIGN, 초안 2.3절)
    ('PYEONGTAEK', 'APPAREL'): 1000, ('PYEONGTAEK', 'COSMETICS'): 4000,
    ('HAIPHONG', 'APPAREL'): 1400, ('HAIPHONG', 'COSMETICS'): 4900,
    ('SHANGHAI', 'APPAREL'): 1350, ('SHANGHAI', 'COSMETICS'): 5000,
}
SELL_DEADLINE_OFFSET = 7
SELL_PAY_OFFSET = {'HAIPHONG': 9, 'SHANGHAI': 11}
VALID_DAYS = 3

DEFAULT_TEMPLATES = [  # 초안 2.6절 F1~F6 (DESIGN). fee는 cents
    dict(id='F1', good='FURNITURE', qty=120, dest='HAIPHONG', fee=38000, dl=7, pay=9),
    dict(id='F2', good='AUTO_PARTS', qty=200, dest='HAIPHONG', fee=30000, dl=14, pay=16),
    dict(id='F3', good='ELECTRONICS', qty=300, dest='SHANGHAI', fee=30000, dl=7, pay=11),
    dict(id='F4', good='AUTO_PARTS', qty=300, dest='SHANGHAI', fee=36000, dl=14, pay=18),
    dict(id='F5', good='FURNITURE', qty=90, dest='SHANGHAI', fee=38000, dl=7, pay=11),
    dict(id='F6', good='ELECTRONICS', qty=200, dest='HAIPHONG', fee=28000, dl=7, pay=9),
]

DEFAULT_PARAMS = dict(
    first_publish_day=1, interval=7, last_publish_day=78, campaign_days=90,
    index_start_bp=10000, index_min_bp=8500, index_max_bp=11500, index_step_pct=(-3, 3),
    regional_pct=(-4, 4), counterparty_pct=(-3, 3), max_lots=(1, 2, 3),
    forwarding_per_batch=5, templates=DEFAULT_TEMPLATES,
)
# SPEC 기본값(사전 조정): F1~F6 + H1~H6 풀에서 묶음당 6건
TUNED_PARAMS = dict(DEFAULT_PARAMS, forwarding_per_batch=6, templates=None)


def half_up_div(num, den):
    """양수 정수 나눗셈의 반올림(0.5는 위로). 음수는 쓰지 않는다."""
    assert num >= 0 and den > 0
    return (num + den // 2) // den


def static_batch0():
    """1일 묶음: data/market_offers.json 6건 그대로(시세표 값은 기준가, 지수 100)."""
    offers = [
        dict(id='OFFER_BUY_01', kind='supplier', good='APPAREL', city='PYEONGTAEK', unit=1000, max_qty=100, valid=3),
        dict(id='OFFER_SELL_01', kind='customer', good='APPAREL', city='HAIPHONG', unit=1400, max_qty=100, valid=3, dl=8, pay=10),
        dict(id='OFFER_BUY_02', kind='supplier', good='COSMETICS', city='PYEONGTAEK', unit=4000, max_qty=50, valid=3),
        dict(id='OFFER_SELL_02', kind='customer', good='COSMETICS', city='SHANGHAI', unit=5000, max_qty=50, valid=3, dl=8, pay=12),
        dict(id='OFFER_FWD_01', kind='forwarding', good='FURNITURE', qty=120, city='PYEONGTAEK', dest='HAIPHONG', fee=38000, valid=3, dl=8, pay=10, tpl='F1'),
        dict(id='OFFER_FWD_02', kind='forwarding', good='AUTO_PARTS', qty=200, city='PYEONGTAEK', dest='HAIPHONG', fee=30000, valid=3, dl=15, pay=17, tpl='F2'),
    ]
    table = {row: P0[row] for row in ROWS}
    return dict(k=0, day=1, index_bp={g: 10000 for g in TRADE_GOODS}, table=table, offers=offers, draws=[])


def generate_batches(seed, params=DEFAULT_PARAMS):
    """묶음 0(정적) + 1..K(생성). 같은 시드·자료면 같은 결과. 플레이어 행동은 입력이 아니다."""
    p = params
    out = [static_batch0()]
    idx = {g: p['index_start_bp'] for g in TRADE_GOODS}
    k = 1
    while True:
        b = p['first_publish_day'] + p['interval'] * k
        if b > p['last_publish_day']:
            break
        st = Stream(seed, f'MARKET-B{k:02d}')
        # 1. 상품별 세계 지수 걸음
        steps = {}
        for g in TRADE_GOODS:
            u = st.int_between(*p['index_step_pct'])
            steps[g] = u
            idx[g] = min(p['index_max_bp'], max(p['index_min_bp'], half_up_div(idx[g] * (100 + u), 100)))
        # 2. 상품별 판매지
        dest = {g: SELL_CITIES[st.index(len(SELL_CITIES))] for g in TRADE_GOODS}
        # 3. 시세표 6행 지역 요인
        reg = {row: st.int_between(*p['regional_pct']) for row in ROWS}
        table = {row: half_up_div(P0[row] * idx[row[1]] * (100 + reg[row]), 1_000_000) for row in ROWS}
        # 4. 거래처 차이: 의류 매입 → 의류 판매 → 화장품 매입 → 화장품 판매
        spread = {}
        for g in TRADE_GOODS:
            spread[(g, 'BUY')] = st.int_between(*p['counterparty_pct'])
            spread[(g, 'SELL')] = st.int_between(*p['counterparty_pct'])
        # 5. 최대 물량
        lots = {g: p['max_lots'][st.index(len(p['max_lots']))] for g in TRADE_GOODS}
        # 6. 주선 틀 비복원 추출(부분 피셔-예이츠). 등급별로 따로(STANDARD → HANDLING), 표시는 자료 순서
        chosen = []
        per_class = p.get('forwarding_per_class') or {'ALL': p['forwarding_per_batch']}
        for cls, cnt in per_class.items():
            pool = [i for i, t in enumerate(p['templates']) if cls == 'ALL' or t.get('cls', 'STANDARD') == cls]
            n = min(cnt, len(pool))
            for i in range(n):
                j = i + st.index(len(pool) - i)
                pool[i], pool[j] = pool[j], pool[i]
            chosen += pool[:n]
        chosen = sorted(chosen)
        offers = []
        tag = {'APPAREL': 'APP', 'COSMETICS': 'COS'}
        for g in TRADE_GOODS:
            base = GOODS[g]['base_lot']
            mx = lots[g] * base
            buy_unit = half_up_div(table[(BUY_CITY, g)] * (100 + spread[(g, 'BUY')]), 100)
            sell_unit = half_up_div(table[(dest[g], g)] * (100 + spread[(g, 'SELL')]), 100)
            dl, pay = b + SELL_DEADLINE_OFFSET, b + SELL_PAY_OFFSET[dest[g]]
            if dl > p['campaign_days'] or pay > p['campaign_days']:
                continue
            offers.append(dict(id=f'MKT-D{b:03d}-{tag[g]}-BUY', kind='supplier', good=g, city=BUY_CITY, unit=buy_unit,
                               max_qty=mx, valid=b + VALID_DAYS - 1))
            offers.append(dict(id=f'MKT-D{b:03d}-{tag[g]}-SELL', kind='customer', good=g, city=dest[g], unit=sell_unit,
                               max_qty=mx, valid=b + VALID_DAYS - 1, dl=dl, pay=pay))
        for i in chosen:
            t = p['templates'][i]
            dl, pay = b + t['dl'], b + t['pay']
            if dl > p['campaign_days'] or pay > p['campaign_days']:
                continue
            offers.append(dict(id=f'MKT-D{b:03d}-{t["id"]}', kind='forwarding', good=t['good'], qty=t['qty'], city=BUY_CITY,
                               dest=t['dest'], fee=t['fee'], valid=b + VALID_DAYS - 1, dl=dl, pay=pay, tpl=t['id'],
                               cls=t.get('cls', 'STANDARD')))
        out.append(dict(k=k, day=b, index_bp=dict(idx), steps=steps, dest=dest, reg=reg, spread=spread, lots=lots,
                        table=table, chosen=[p['templates'][i]['id'] for i in chosen], offers=offers,
                        draws=list(st.log)))
        k += 1
    return out


if __name__ == '__main__':
    import json, sys
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 42032026
    for bt in generate_batches(seed)[:3]:
        print(json.dumps({k: (v if k != 'table' and k != 'reg' and k != 'spread' else {str(a): b for a, b in v.items()})
                          for k, v in bt.items()}, ensure_ascii=False))
