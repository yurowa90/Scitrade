#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""M2a-5 경제 사전 조정 모형 (Scitrade). 엔진이 아니다. 표준 라이브러리만 쓴다.

같은 입력(자료 파일·매개변수·시드·정책)이면 같은 출력이 나온다. 난수는 엔진 rng.ts의 이식이다.
금액은 정수 최소 단위다: USD는 cents, KRW는 원.

사용(모두 이 파일이 있는 폴더 기준, 자세한 것은 README.md 2절):
  python3 m2a5_model.py selfcheck                  # 난수(node 대조)·견적 생성·손계산 인수 사례 검산 → out/selfcheck.txt
  python3 m2a5_model.py grid --params CAND_B       # 한 매개변수 묶음의 정책 격자 표(--policies search|full)
  python3 m2a5_model.py search --stage 1           # D03 나 매개변수 공간 1단계(수요 쪽) → out/search_stage1.jsonl
  python3 m2a5_model.py search --stage 2 --top 8   # 2단계(선복 계약·창고 확장) → out/search_stage2.jsonl
  python3 m2a5_model.py rank --stage 1|2           # 탐색 순위표 → out/ranking_stage{1,2}.md
  python3 m2a5_model.py report --candidates CAND_A,CAND_B,CAND_C,SPEC_P,PACKET   # → out/candidates.md, out/runs_*.csv
  python3 m2a5_model.py validate --candidates CAND_A,CAND_B,CAND_C              # 표본 밖 시드 1021~1040
엔진 자료 위치는 --repo(기본: 개발 작업 트리 wtccr, 읽기만 한다). 병렬 수는 --jobs(기본 4). 둘 다 명령 이름 앞에 쓴다.
"""
import argparse
import itertools
import json
import math
import os
import statistics
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
REPO_DEFAULT = os.environ.get(
    'SCITRADE_REPO',
    '/tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/wtccr')
SEEDS = list(range(1001, 1021))  # src/engine/sim/sim.ts:10 SIM_SEEDS 와 같다
INF = 10 ** 9

# ──────────────────────────────────────────────────────────────────────────────
# 1. 엔진 자료 읽기 (있는 값은 모두 자료 파일에서)
# ──────────────────────────────────────────────────────────────────────────────


def _jread(repo, rel):
    with open(os.path.join(repo, rel), encoding='utf-8') as f:
        return json.load(f)


def js_round(x):
    """JS Math.round (0.5는 +∞ 쪽)."""
    return math.floor(x + 0.5)


def to_minor(cur, amount):
    return js_round(amount * (100 if cur == 'USD' else 1))


def apply_bp(minor, bp):
    """money.ts applyBasisPoints: 0.5는 0에서 먼 쪽."""
    num = minor * bp
    sign = -1 if num < 0 else 1
    return sign * ((abs(num) + 5000) // 10000)


def load_engine_data(repo):
    gc = _jread(repo, 'data/game_config.json')['config']
    scen = next(s for s in _jread(repo, 'data/scenarios.json')['items'] if s['id'] == 'SCENARIO_M2_MULTI_TRADE')
    emps = {e['id']: e for e in _jread(repo, 'data/employees.json')['items']}
    routes = {r['id']: r for r in _jread(repo, 'data/routes.json')['items']}
    goods = {g['id']: g for g in _jread(repo, 'data/goods.json')['items']}
    offers = _jread(repo, 'data/market_offers.json')['items']
    ct = scen['contract_terms']
    rec = scen['recruitment']
    emp_ids = list(scen['employee_ids']) + list(rec['candidate_employee_ids'])  # scenario.ts:387 순서 = 급여 순서
    ed = dict(
        repo=repo,
        days=gc['days'], seed=gc['seed'], fx_base=gc['fx_krw_per_usd'],
        start_usd=to_minor('USD', scen['starting_cash']['USD']), start_krw=to_minor('KRW', scen['starting_cash']['KRW']),
        customs_days=scen['customs_days'], duty_bp=js_round(scen['tax_rule']['rate'] * 10000),
        prep_trade=ct['prep_work_units'],
        cancel_fee=to_minor('USD', ct['pre_departure_cancellation']['cancellation_fee']['amount']),
        late_cut=to_minor('USD', ct['late_delivery']['price_reduction']['amount']),
        scout_pt=rec['scout_work_units'], quest_pt=rec['quest_work_units'], signing_days=rec['signing_fee_wage_days'],
        venue_of={c: site['venue_id'] for site in rec['scout_sites'] for c in site['candidate_employee_ids']},
        founders=list(scen['employee_ids']),
        employees={i: dict(id=i, name=emps[i]['name_ko'], rate=emps[i]['work_units_per_day'],
                           wage=to_minor('KRW', emps[i]['salary_per_day']['amount'])) for i in emp_ids},
        emp_order=emp_ids,
        routes={},
        goods={g: dict(m3=goods[g]['volume_m3_per_unit'], kg=goods[g]['mass_kg_per_unit'])
               for g in goods},
        batch0=offers,
    )
    for rid in scen['route_ids']:
        r = routes[rid]
        ed['routes'][r['to_city_id']] = dict(
            id=rid, frm=r['from_city_id'], to=r['to_city_id'], transit=r['transit_days'],
            fee=to_minor('USD', r['booking_fee']['amount']), cap_l=js_round(r['capacity_m3'] * 1000),
            cap_g=js_round(r['capacity_kg'] * 1000), first=r['first_departure_day'], interval=r['departure_interval_days'])
    return ed


def cargo(ed, good, qty):
    """catalog.ts cargoSpace: L, g 정수."""
    g = ed['goods'][good]
    return js_round(qty * g['m3'] * 1000), js_round(qty * g['kg'] * 1000)


# ──────────────────────────────────────────────────────────────────────────────
# 2. 명세 매개변수 (자료에 없는 값). SPEC.md 4절 P01~P44, 표 6.6-1·6.6-2
# ──────────────────────────────────────────────────────────────────────────────

F_TEMPLATES = [  # 표 6.6-1 (초안 승인 값). fee USD
    dict(id='F1', cls='STANDARD', good='FURNITURE', qty=120, dest='HAIPHONG', fee=380, dl=7, pay=9),
    dict(id='F2', cls='STANDARD', good='AUTO_PARTS', qty=200, dest='HAIPHONG', fee=300, dl=14, pay=16),
    dict(id='F3', cls='STANDARD', good='ELECTRONICS', qty=300, dest='SHANGHAI', fee=300, dl=7, pay=11),
    dict(id='F4', cls='STANDARD', good='AUTO_PARTS', qty=300, dest='SHANGHAI', fee=360, dl=14, pay=18),
    dict(id='F5', cls='STANDARD', good='FURNITURE', qty=90, dest='SHANGHAI', fee=380, dl=7, pay=11),
    dict(id='F6', cls='STANDARD', good='ELECTRONICS', qty=200, dest='HAIPHONG', fee=280, dl=7, pay=9),
]
H_TEMPLATES = [  # 표 6.6-2 (사전 조정 새 값). 모두 3 m³
    dict(id='H1', cls='HANDLING', good='ELECTRONICS', qty=100, dest='HAIPHONG', fee=1040, dl=14, pay=16),
    dict(id='H2', cls='HANDLING', good='COSMETICS', qty=150, dest='SHANGHAI', fee=1020, dl=14, pay=18),
    dict(id='H3', cls='HANDLING', good='APPAREL', qty=1000, dest='HAIPHONG', fee=1040, dl=14, pay=16),
    dict(id='H4', cls='HANDLING', good='ELECTRONICS', qty=100, dest='SHANGHAI', fee=1020, dl=14, pay=18),
    dict(id='H5', cls='HANDLING', good='AUTO_PARTS', qty=75, dest='SHANGHAI', fee=1020, dl=14, pay=18),
    dict(id='H6', cls='HANDLING', good='COSMETICS', qty=150, dest='HAIPHONG', fee=1040, dl=14, pay=16),
]
TRADE_GOODS = ['APPAREL', 'COSMETICS']
SELL_CITIES = ['HAIPHONG', 'SHANGHAI']
ROWS = [('PYEONGTAEK', 'APPAREL'), ('PYEONGTAEK', 'COSMETICS'), ('HAIPHONG', 'APPAREL'), ('HAIPHONG', 'COSMETICS'),
        ('SHANGHAI', 'APPAREL'), ('SHANGHAI', 'COSMETICS')]
TAG = {'APPAREL': 'APP', 'COSMETICS': 'COS'}

# 명세 기본값(SPEC_P). 키 이름 옆 주석은 SPEC 4절 번호다.
SPEC_P = dict(
    first_day=1, interval=7, last_day=78, valid_days=3,                      # P01~P04
    index_start=10000, index_min=8500, index_max=11500, index_step=(-3, 3),   # P05~P07
    regional=(-4, 4), counterparty=(-3, 3),                                   # P08~P09
    base_price={('PYEONGTAEK', 'APPAREL'): 1000, ('PYEONGTAEK', 'COSMETICS'): 4000,   # P10 cents
                ('HAIPHONG', 'APPAREL'): 1400, ('HAIPHONG', 'COSMETICS'): 4900,
                ('SHANGHAI', 'APPAREL'): 1350, ('SHANGHAI', 'COSMETICS'): 5000},
    base_lot={'APPAREL': 100, 'COSMETICS': 50}, max_lots=(1, 2, 3),          # P11~P12
    sell_dl=7, sell_pay={'HAIPHONG': 9, 'SHANGHAI': 11},                      # P13
    fwd_per_batch=6, pool='FH',                                               # P14~P16
    prep_per_extra_lot=1,                                                     # P19 (P18은 자료 prep_work_units)
    std_l_per_pt=6000, h_l_per_pt=250, fwd_min_pt=2,                          # P20~P22 (L)
    batch0_prep_rule='volume',                                                # C05: 1일 묶음 주선도 부피 규칙
    storage_l=40000, handling_pt=6,                                           # P23~P24
    exp_storage_l=20000, exp_handling_pt=3, exp_setup=200000, exp_rent=250000, exp_after=1,  # P25~P30
    rent=450000, rent_period=30, rent_first=1,                                # P31
    space_l=10000, space_g=1_500_000, space_fee=3000, space_lead=7,           # P32~P35 (cents)
    fx_spread_bp=100, fx_lot=10000,                                           # P39~P40 (P38은 자료)
    warn_age=0, danger_age=7, fail_age=14,                                    # P42~P44
    h_fee_add=0,                                                              # 탐색용: H 서비스 대금 가감(USD). 명세 0
    fwd_split=None,                                                           # 탐색용: (일반 수, 작업 포함 수) 나눠 뽑기. 명세 None
    h_qty_scale=1,                                                            # 탐색용: H 화물 수량 배수(1 = 3 m³). 명세 1
)

# 결정 묶음 D03 나 문구 그대로(주선 F만, 묶음당 5건, 6 m³당 1pt, 최소 2pt). SPEC 17.2 표 A와 같은 묶음
PACKET_P = dict(SPEC_P, fwd_per_batch=5, pool='F')

NAMED = {'SPEC_P': SPEC_P, 'PACKET': PACKET_P}


def templates_for(P):
    pool = list(F_TEMPLATES) if 'F' in P['pool'] else []
    if 'H' in P['pool']:
        sc = P.get('h_qty_scale', 1)
        pool += [dict(t, fee=t['fee'] + P.get('h_fee_add', 0), qty=t['qty'] * sc) for t in H_TEMPLATES]
    return pool


def fwd_prep(ed, P, good, qty, cls):
    vol, _ = cargo(ed, good, qty)
    per = P['std_l_per_pt'] if cls == 'STANDARD' else P['h_l_per_pt']
    return max(P['fwd_min_pt'], -(-vol // per))


def trade_prep(ed, P, qty, step):
    return ed['prep_trade'] + (qty // step - 1) * P['prep_per_extra_lot']


# ──────────────────────────────────────────────────────────────────────────────
# 3. 난수 (src/engine/rng.ts drawUniform 이식)
# ──────────────────────────────────────────────────────────────────────────────
M32 = 0xFFFFFFFF


def _imul(a, b):
    return (a * b) & M32


def _hash(text):
    h = 0x811C9DC5
    for ch in text:
        h ^= ord(ch)
        h = _imul(h, 0x01000193)
    return h & M32


def _mix(x):
    z = (x + 0x9E3779B9) & M32
    z = _imul(z ^ (z >> 16), 0x85EBCA6B)
    z = _imul(z ^ (z >> 13), 0xC2B2AE35)
    return (z ^ (z >> 16)) & M32


def draw_word(seed, stream, cursor):
    return _mix((seed & M32) ^ _mix(_hash(stream) ^ _mix(cursor)))


class Stream:
    """한 흐름을 커서 0부터 쓴다(SPEC 6.2). state.rng.cursors는 쓰지 않는다."""

    def __init__(self, seed, name):
        self.seed, self.name, self.cursor, self.values = seed, name, 0, []

    def word(self):
        w = draw_word(self.seed, self.name, self.cursor)
        self.cursor += 1
        self.values.append(w / 4294967296)
        return w

    def int_between(self, lo, hi):
        # lo + floor(value × n). value = w / 2^32 이므로 floor(w × n / 2^32)와 같다(정확).
        return lo + (self.word() * (hi - lo + 1)) // 4294967296

    def index(self, n):
        return self.int_between(0, n - 1)


# ──────────────────────────────────────────────────────────────────────────────
# 4. 견적 생성 (SPEC 6절)
# ──────────────────────────────────────────────────────────────────────────────


def half_up(n, d):
    return (n + d // 2) // d


def batch0_offers(ed, P):
    """1일 묶음 = market_offers.json 그대로(엔진 createGame 견적)."""
    out = []
    for o in ed['batch0']:
        base = dict(id=o['id'], batch=0, publish=1, valid=o['valid_until_day'], good=o['good_id'], qty=o['quantity'],
                    maxq=o['quantity'], step=o['quantity'], cls=None)
        if o['kind'] == 'supplier':
            out.append(dict(base, kind='BUY', city=o['city_id'], unit=to_minor('USD', o['unit_price']['amount'])))
        elif o['kind'] == 'customer':
            out.append(dict(base, kind='SELL', city=o['city_id'], unit=to_minor('USD', o['unit_price']['amount']),
                            dl=o['delivery_deadline_day'], pay=o['payment_due_day']))
        else:
            if P.get('batch0_prep_rule') == 'legacy':
                prep = 2
            else:
                prep = fwd_prep(ed, P, o['good_id'], o['quantity'], 'STANDARD')
            out.append(dict(base, kind='FWD', dest=o['destination_city_id'], fee=to_minor('USD', o['service_fee']['amount']),
                            dl=o['delivery_deadline_day'], pay=o['payment_due_day'], cls='STANDARD', tpl=None, prep=prep))
    return out


def generate_batches(ed, P, seed):
    """묶음 1..K. (시드, k, 직전 지수, 규칙 자료)만의 함수다. 플레이어 행동은 입력이 아니다."""
    pool_t = templates_for(P)
    out = []
    idx = {g: P['index_start'] for g in TRADE_GOODS}
    k = 1
    while True:
        b = P['first_day'] + P['interval'] * k
        if b > P['last_day']:
            break
        st = Stream(seed, f'MARKET-B{k:02d}')
        steps = {}
        for g in TRADE_GOODS:  # 1. 지수 걸음
            u = st.int_between(*P['index_step'])
            steps[g] = u
            idx[g] = min(P['index_max'], max(P['index_min'], half_up(idx[g] * (100 + u), 100)))
        dest = {g: SELL_CITIES[st.index(len(SELL_CITIES))] for g in TRADE_GOODS}  # 2. 판매지
        reg = {row: st.int_between(*P['regional']) for row in ROWS}  # 3. 지역 요인 6행
        table = {row: half_up(P['base_price'][row] * idx[row[1]] * (100 + reg[row]), 1_000_000) for row in ROWS}
        spread = {}
        for g in TRADE_GOODS:  # 4. 거래처 차이
            spread[(g, 'BUY')] = st.int_between(*P['counterparty'])
            spread[(g, 'SELL')] = st.int_between(*P['counterparty'])
        lots = {g: P['max_lots'][st.index(len(P['max_lots']))] for g in TRADE_GOODS}  # 5. 최대 물량
        chosen = []  # 6. 부분 피셔-예이츠. 나눠 뽑기면 일반(F) → 작업 포함(H) 순서로 따로
        groups = [list(range(len(pool_t)))] if not P.get('fwd_split') else \
            [[i for i, t in enumerate(pool_t) if t['cls'] == 'STANDARD'], [i for i, t in enumerate(pool_t) if t['cls'] == 'HANDLING']]
        counts = [P['fwd_per_batch']] if not P.get('fwd_split') else list(P['fwd_split'])
        for pool, cnt in zip(groups, counts):
            n = min(cnt, len(pool))
            for i in range(n):
                j = i + st.index(len(pool) - i)
                pool[i], pool[j] = pool[j], pool[i]
            chosen += pool[:n]
        chosen = sorted(chosen)
        offers = []
        valid = b + P['valid_days'] - 1
        for g in TRADE_GOODS:
            step = P['base_lot'][g]
            mx = lots[g] * step
            dl, pay = b + P['sell_dl'], b + P['sell_pay'][dest[g]]
            if dl > ed['days'] or pay > ed['days']:
                continue
            bu = half_up(table[('PYEONGTAEK', g)] * (100 + spread[(g, 'BUY')]), 100)
            su = half_up(table[(dest[g], g)] * (100 + spread[(g, 'SELL')]), 100)
            common = dict(batch=k, publish=b, valid=valid, good=g, qty=step, maxq=mx, step=step, cls=None)
            offers.append(dict(common, id=f'MKT-D{b:03d}-{TAG[g]}-BUY', kind='BUY', city='PYEONGTAEK', unit=bu))
            offers.append(dict(common, id=f'MKT-D{b:03d}-{TAG[g]}-SELL', kind='SELL', city=dest[g], unit=su, dl=dl, pay=pay))
        for i in chosen:
            t = pool_t[i]
            dl, pay = b + t['dl'], b + t['pay']
            if dl > ed['days'] or pay > ed['days']:
                continue
            offers.append(dict(id=f'MKT-D{b:03d}-{t["id"]}', kind='FWD', batch=k, publish=b, valid=valid, good=t['good'],
                               qty=t['qty'], maxq=t['qty'], step=t['qty'], dest=t['dest'], fee=to_minor('USD', t['fee']),
                               dl=dl, pay=pay, cls=t['cls'], tpl=t['id'], prep=fwd_prep(ed, P, t['good'], t['qty'], t['cls'])))
        out.append(dict(k=k, day=b, index_bp=dict(idx), steps=steps, dest=dest, reg=reg, table=table, spread=spread,
                        lots=lots, chosen=[pool_t[i]['id'] for i in chosen], offers=offers, draws=list(st.values)))
        k += 1
    return out


_MARKET_CACHE = {}


def market_offers(ed, P, seed):
    key = (seed, P['fwd_per_batch'], P['pool'], P['std_l_per_pt'], P['h_l_per_pt'], P['fwd_min_pt'],
           P.get('h_fee_add', 0), P.get('batch0_prep_rule'), tuple(P.get('fwd_split') or ()), P.get('h_qty_scale', 1))
    if key not in _MARKET_CACHE:
        offers = batch0_offers(ed, P)
        for bt in generate_batches(ed, P, seed):
            offers += bt['offers']
        _MARKET_CACHE[key] = offers
    return _MARKET_CACHE[key]


# ──────────────────────────────────────────────────────────────────────────────
# 5. 정책 정의
# ──────────────────────────────────────────────────────────────────────────────
ACCEPT_RULES = {
    # C 신중: 기본 단위만, 기여이익 100 USD 이상, 정시만, 앞 14일 원화 부족분만큼 USD를 남겨 둔다
    'C': dict(max_qty=False, min_contrib=10000, late=False, reserve_days=14),
    # N 보통: 가장 큰 수량부터, 기여이익 양수, 정시만(비교 실행기 MAX_CONTRIBUTION + SPEC 17.3)
    'N': dict(max_qty=True, min_contrib=1, late=False, reserve_days=0),
    # A 적극: N + 늦은 인도도 받음(감액 뒤 기여이익 양수)
    'A': dict(max_qty=True, min_contrib=1, late=True, reserve_days=0),
}
FX_MODES = {'fx7': '앞 7일 원화 부족분을 100 USD 단위로 미리 환전', 'react': '미지급이 생기면(경고) 그날 필요한 만큼만 환전',
            'none': '환전하지 않음'}
STAFF_ALIAS = {'90k': 'EMP06', '110k': 'EMP04'}  # 바름(2pt·90,000원), 현돌(3pt·110,000원). 둘 다 평택 항구(VEN_PORT)


class Policy:
    def __init__(self, accept='N', fx='fx7', hires=(), invest=(), label=None):
        self.accept, self.fx = accept, fx
        self.rule = ACCEPT_RULES[accept]
        self.hires = tuple(hires)      # ((emp_id, day), ...)
        self.invest = tuple(invest)    # (('E', day),) / (('S', 'ROUTE01', day), ...)
        self.label = label or self.make_label()

    def make_label(self):
        h = '+'.join(f'{e}@{d}' for e, d in self.hires) or 'nohire'
        inv = []
        for x in self.invest:
            inv.append(f'E{x[1]}' if x[0] == 'E' else f'S{x[1][-1]}@{x[2]}')
        return f'{self.accept}|{self.fx}|{h}|{"+".join(inv) or "noinv"}'


INVEST = {
    'noinv': (),
    'S1': (('S', 'ROUTE01', 1), ('S', 'ROUTE02', 1)),
    'E7': (('E', 7),),
    'SE': (('S', 'ROUTE01', 1), ('S', 'ROUTE02', 1), ('E', 7)),
    'SE22': (('S', 'ROUTE01', 22), ('S', 'ROUTE02', 22), ('E', 22)),
    'E22': (('E', 22),),
}


def mkpol(accept='N', fx='fx7', hire=None, inv='noinv'):
    hires = ()
    if hire:
        hires = tuple((STAFF_ALIAS.get(e, e), int(d)) for e, d in (h.split('@') for h in hire.split('+')))
    p = Policy(accept, fx, hires, INVEST[inv])
    p.hire_key = hire or 'nohire'
    p.inv_key = inv
    p.label = f'{accept}|{fx}|{p.hire_key}|{inv}'
    return p


# ──────────────────────────────────────────────────────────────────────────────
# 6. 하루 처리 모형 (SPEC 13절 순서)
# ──────────────────────────────────────────────────────────────────────────────


class Contract:
    __slots__ = ('id', 'seq', 'kind', 'qkey', 'good', 'qty', 'dest', 'purchase', 'sale', 'duty', 'freight', 'dl', 'pay',
                 'vol', 'mass', 'prep', 'rem', 'staff', 'state', 'sail', 'accepted', 'arrival', 'delivered', 'cut',
                 'fees', 'duty_set', 'duty_paid', 'due', 'cls', 'started')


class Sim:
    def __init__(self, ed, P, seed, pol, record=False):
        self.ed, self.P, self.seed, self.pol = ed, P, seed, pol
        self.days = ed['days']
        self.record = record
        self.offers = market_offers(ed, P, seed)
        self.status = {o['id']: 'OPEN' for o in self.offers}
        self.by_batch = {}
        for o in self.offers:
            self.by_batch.setdefault(o['batch'], []).append(o)
        self.routes = ed['routes']
        self.sailings = {dest: list(range(r['first'], self.days + 1, r['interval'])) for dest, r in self.routes.items()}
        self.usd = ed['start_usd']
        self.krw = ed['start_krw']
        self.obl = []  # [id, cur, amt, day, paid_day, contract]
        self.contracts = []
        self.staff = {}  # id -> dict(rate, wage, from_day)
        for e in ed['founders']:
            d = ed['employees'][e]
            self.staff[e] = dict(rate=d['rate'], wage=d['wage'], from_day=1)
        self.booked = {}  # (dest, day) -> [L, g]
        self.space = {}   # dest -> first covered sailing day
        self.exp_eff = None
        fx_base = ed['fx_base']
        self.rate_buy = fx_base - apply_bp(fx_base, P['fx_spread_bp'])
        self.rate_sell = fx_base + apply_bp(fx_base, P['fx_spread_bp'])
        # 영입: 계획 목록. 각 항목 상태 PLANNED → SCOUT → QUEST → READY → HIRED
        self.recruits = []
        for emp, day in pol.hires:
            self.recruits.append(dict(emp=emp, plan=day, stage='PLANNED', rem=0, task_day=None, hired=None))
        self.recruiter = ed['founders'][-1]  # 물보리(EMP02, 운영)
        self.scouted = set()
        self.failed = None
        self.first_unpaid = None
        self.m = dict(krw_unpaid_days=0, usd_unpaid_days=0, fx_usd=0, fx_spread=0, pt_cap=0, pt_used=0, idle_days=0,
                      avail_days=0, wait_task_days=0, storage_full_days=0, missed_sailings=0, late=0,
                      rent_paid=0, space_fees=0, signing=0, setup=0, wages=0, handling_used=0, handling_cap=0)
        self.qoutcome = {}  # quote key -> reason / 'ACCEPTED'
        self.qprep = {}     # quote key -> 기본 수량 준비 pt (수요 집계용)
        self.qfirst = {}    # quote key -> 처음 검토한 날
        self.day = 1
        self.hist = [] if record else None

    # ── 공통 계산 ──
    def storage_cap(self, d):
        return self.P['storage_l'] + (self.P['exp_storage_l'] if self.exp_eff is not None and self.exp_eff <= d else 0)

    def handling_cap(self, d):
        return self.P['handling_pt'] + (self.P['exp_handling_pt'] if self.exp_eff is not None and self.exp_eff <= d else 0)

    def storage_used(self):
        return sum(c.vol for c in self.contracts if c.state in ('PREP', 'READY'))

    def sail_cap(self, dest, s):
        r = self.routes[dest]
        f = self.space.get(dest)
        if f is not None and s >= f:
            return r['cap_l'] + self.P['space_l'], r['cap_g'] + self.P['space_g']
        return r['cap_l'], r['cap_g']

    def unpaid(self, cur):
        return sum(o[2] for o in self.obl if o[1] == cur and o[4] is None)

    def reserved_usd(self):
        res = 0
        for c in self.contracts:
            if c.state in ('PREP', 'READY') and c.sail is None:
                res += c.freight  # FREIGHT: 예약 없는 운임(reservations.ts:28-29)
            if c.kind == 'T' and not c.duty_set and c.state in ('PREP', 'READY', 'TRANSIT'):
                res += c.duty     # DUTY: 도착 전 관세(reservations.ts:31-33)
        return res

    def avail_usd(self):
        return self.usd - self.reserved_usd() - self.unpaid('USD')

    def avail_krw(self):
        return self.krw - self.unpaid('KRW')

    def rent_due(self, d):
        P = self.P
        if d < P['rent_first'] or (d - P['rent_first']) % P['rent_period']:
            return 0
        return P['rent'] + (P['exp_rent'] if self.exp_eff is not None and self.exp_eff <= d else 0)

    # ── 직원·업무 ──
    def working(self, e, t):
        return self.staff[e]['from_day'] <= t

    def block_window(self, d):
        """영입 담당(물보리)이 조사·의뢰로 묶이는 날 [시작, 끝]. 없으면 None."""
        for r in self.recruits:
            if r['stage'] in ('HIRED', 'DROPPED') or r['emp'] == 'FREE2':
                continue
            rate = self.staff[self.recruiter]['rate']
            if r['stage'] == 'PLANNED':
                need = (0 if self.ed['venue_of'].get(r['emp']) in self.scouted else -(-self.ed['scout_pt'] // rate)) \
                    + -(-self.ed['quest_pt'] // rate)
                start = max(d, r['plan'] - need)
                return start, start + need - 1
            if r['stage'] == 'SCOUT':
                return r['task_day'], r['task_day'] + -(-self.ed['quest_pt'] // rate)
            if r['stage'] == 'QUEST':
                return d, d + -(-r['rem'] // rate) - 1
            return None
        return None

    def recruit_busy(self, d):
        """오늘 영입 업무를 실제로 진행 중인가(조사·의뢰가 직원을 붙잡음)."""
        return any(r['stage'] in ('SCOUT', 'QUEST') and r['task_day'] is not None and r['task_day'] <= d
                   for r in self.recruits)

    def _assign(self, t, tasks, busy, block, staff_rates):
        """free 직원(처리량 큰 순 → ID)을 우선순위 순 대기 업무에 붙인다. 진짜 진행과 예측이 같은 함수를 쓴다."""
        free = sorted([e for e in staff_rates if e not in busy and self.working(e, t)
                       and not (block and e == self.recruiter and block[0] <= t <= block[1])],
                      key=lambda e: (-staff_rates[e], e))
        if not free:
            return
        for task in sorted((x for x in tasks if x[2] is None and x[1] > 0), key=lambda x: x[0]):
            pick = None
            for e in free:
                if block and e == self.recruiter and t < block[0]:
                    finish = t + -(-task[1] // staff_rates[e]) - 1
                    if finish >= block[0]:
                        continue
                pick = e
                break
            if pick is None:
                continue
            task[2] = pick
            busy.add(pick)
            free.remove(pick)
            if not free:
                return

    def _progress(self, t, tasks, cap, staff_rates, block, log=None):
        """창고 처리 한도(SPEC 8.2·8.3): 출항일 → 납기 → 계약 순서로 min(직원, 남은 양, 창고 남은 양)."""
        done = []
        used = 0
        for task in sorted((x for x in tasks if x[2] is not None and x[1] > 0), key=lambda x: x[0]):
            e = task[2]
            if not self.working(e, t) or (block and e == self.recruiter and block[0] <= t <= block[1]):
                continue
            want = min(staff_rates[e], task[1])
            g = min(want, cap - used)
            if log is not None and g < want:
                log.append(task[4])
            task[1] -= g
            used += g
            if task[1] == 0:
                done.append(task)
        return done, used

    def task_list(self, extra=None):
        tasks = []
        for c in self.contracts:
            if c.state == 'PREP':
                key = (c.sail if c.sail is not None else INF, c.dl, c.seq)
                tasks.append([key, c.rem, c.staff, c.sail, c.seq])
        if extra is not None:
            tasks.append([(extra['sail'], extra['dl'], extra['seq']), extra['prep'], None, extra['sail'], extra['seq']])
        return tasks

    def project_ok(self, d, extra=None, inf_cap=False):
        """오늘(명령 단계)부터 지금 업무 + extra만으로 날마다 모의 진행. 예약한 업무가 모두 출항 전에 끝나면 True."""
        tasks = self.task_list(extra)
        if not tasks:
            return True
        rates = {e: v['rate'] for e, v in self.staff.items()}
        busy = {x[2] for x in tasks if x[2] is not None}
        if self.recruit_busy(d):
            busy.add(self.recruiter)
        block = self.block_window(d)
        deadline = {x[4]: x[3] for x in tasks if x[3] is not None}
        if not deadline:
            return True
        horizon = min(max(deadline.values()), self.days)
        t = d
        while t <= horizon:
            if block and t == block[1] + 1:
                busy.discard(self.recruiter)
            self._assign(t, tasks, busy, block, rates)
            cap = INF if inf_cap else self.handling_cap(t)
            done, _ = self._progress(t, tasks, cap, rates, block)
            for task in done:
                busy.discard(task[2])
                s = deadline.get(task[4])
                if s is not None and t > s:
                    return False
                deadline.pop(task[4], None)
            for seq, s in deadline.items():
                if s <= t:
                    return False
            if not deadline:
                return True
            t += 1
        return not deadline

    # ── 지급 ──
    def add_obl(self, cur, amt, oid, contract=None):
        self.obl.append([oid, cur, amt, self.day, None, contract])
        if self.first_unpaid is None:
            self.first_unpaid = self.day

    def pay_or_accrue(self, cur, amt, oid, contract=None):
        """규칙 2(SPEC 10.3): 같은 통화 미지급이 남아 있으면 새 필수 지급도 줄을 선다."""
        if cur == 'USD':
            if self.unpaid('USD') == 0 and self.usd >= amt:
                self.usd -= amt
                return True
        else:
            if self.unpaid('KRW') == 0 and self.krw >= amt:
                self.krw -= amt
                return True
        self.add_obl(cur, amt, oid, contract)
        return False

    def settle(self):
        for cur in ('USD', 'KRW'):
            for o in self.obl:
                if o[1] != cur or o[4] is not None:
                    continue
                cash = self.usd if cur == 'USD' else self.krw
                if cash < o[2]:
                    break  # 멈춘다. 뒤의 작은 의무를 먼저 갚지 않는다
                if cur == 'USD':
                    self.usd -= o[2]
                else:
                    self.krw -= o[2]
                o[4] = self.day
                if o[5] is not None:
                    o[5].duty_paid = True

    # ── 명령 ──
    def exchange(self, lots):
        if lots <= 0:
            return 0
        usd = lots * self.P['fx_lot']
        if self.avail_usd() < usd:
            return 0
        self.usd -= usd
        self.krw += lots * (self.P['fx_lot'] // 100) * self.rate_buy
        self.m['fx_usd'] += usd
        self.m['fx_spread'] += lots * (self.P['fx_lot'] // 100) * (self.ed['fx_base'] - self.rate_buy)
        return usd

    def krw_need(self, d, look):
        """앞 look일 원화 지출(급여·임차료·예정 계약금·설치비) + 원화 미지급."""
        need = self.unpaid('KRW')
        last = min(self.days, d + look - 1)
        exp_plan = [x[1] for x in self.pol.invest if x[0] == 'E']
        for t in range(d, last + 1):
            for e, v in self.staff.items():
                if v['from_day'] <= t:
                    need += v['wage']
            for r in self.recruits:
                if r['stage'] in ('HIRED', 'DROPPED') or r['emp'] == 'FREE2':
                    continue
                h = max(r['plan'], d)
                wage = self.ed['employees'][r['emp']]['wage']
                if t == h:
                    need += wage * self.ed['signing_days']
                elif t > h:
                    need += wage
            if t >= self.P['rent_first'] and (t - self.P['rent_first']) % self.P['rent_period'] == 0:
                need += self.P['rent']
                eff = self.exp_eff
                if eff is None and exp_plan and exp_plan[0] >= d:
                    eff = exp_plan[0] + self.P['exp_after']
                if eff is not None and eff <= t:
                    need += self.P['exp_rent']
            if self.exp_eff is None and exp_plan and exp_plan[0] == t:
                need += self.P['exp_setup']
        return need

    def do_fx(self, d):
        mode = self.pol.fx
        if mode == 'none':
            return
        if mode == 'fx7':
            short = self.krw_need(d, 7) - self.krw
        else:  # react: 원화 미지급(경고)이 생긴 뒤에만, 밀린 돈 + 오늘 낼 돈만큼
            if self.unpaid('KRW') == 0:
                return
            short = self.krw_need(d, 1) - self.krw
        if short <= 0:
            return
        per_lot = (self.P['fx_lot'] // 100) * self.rate_buy
        lots = -(-short // per_lot)
        lots = min(lots, max(0, self.avail_usd()) // self.P['fx_lot'])
        self.exchange(lots)

    def reserve_cents(self, d):
        days = self.pol.rule['reserve_days']
        if not days or self.pol.fx == 'none':
            return 0
        short = self.krw_need(d, days) - self.krw
        if short <= 0:
            return 0
        return -(-short * 100 // self.rate_buy)

    def next_sailings(self, dest, d, n=3):
        out = []
        for s in self.sailings[dest]:
            if s > d:
                out.append(s)
                if len(out) == n:
                    break
        return out

    def book(self, c, s):
        self.usd -= c.freight
        b = self.booked.setdefault((c.dest, s), [0, 0])
        b[0] += c.vol
        b[1] += c.mass
        c.sail = s

    def space_ok(self, dest, s, vol, mass):
        l, g = self.booked.get((dest, s), (0, 0))
        cl, cg = self.sail_cap(dest, s)
        return l + vol <= cl and g + mass <= cg

    def options(self, d):
        """오늘 열린 견적의 수락 후보(수량별). 정렬: 기여이익 큰 순 → 견적 → 수량 큰 순(SPEC 17.3)."""
        rule = self.pol.rule
        opts = []
        open_ = [o for o in self.offers if self.status[o['id']] == 'OPEN' and o['publish'] <= d <= o['valid']]
        buys = [o for o in open_ if o['kind'] == 'BUY']
        sells = [o for o in open_ if o['kind'] == 'SELL']
        for b in buys:
            for s in sells:
                if s['good'] != b['good'] or s['batch'] != b['batch']:
                    continue
                step = b['step']
                mx = min(b['maxq'], s['maxq'])
                qtys = list(range(mx, 0, -step)) if rule['max_qty'] else [b['qty']]
                key = ('T', b['id'])
                for q in qtys:
                    purchase = b['unit'] * q
                    sale = s['unit'] * q
                    duty = apply_bp(purchase, self.ed['duty_bp'])
                    r = self.routes[s['city']]
                    vol, mass = cargo(self.ed, b['good'], q)
                    prep = self.ed['prep_trade'] if b['batch'] == 0 else trade_prep(self.ed, self.P, q, step)
                    opts.append(dict(kind='T', key=key, ids=(b['id'], s['id']), good=b['good'], qty=q, dest=s['city'],
                                     purchase=purchase, sale=sale, duty=duty, freight=r['fee'], dl=s['dl'], pay=s['pay'],
                                     vol=vol, mass=mass, prep=prep, contrib=sale - purchase - duty - r['fee'], cls=None))
                self.qprep.setdefault(key, self.ed['prep_trade'] if b['batch'] == 0 else trade_prep(self.ed, self.P, b['qty'], step))
        for o in open_:
            if o['kind'] != 'FWD':
                continue
            r = self.routes[o['dest']]
            vol, mass = cargo(self.ed, o['good'], o['qty'])
            key = ('F', o['id'])
            opts.append(dict(kind='F', key=key, ids=(o['id'],), good=o['good'], qty=o['qty'], dest=o['dest'], purchase=0,
                             sale=o['fee'], duty=0, freight=r['fee'], dl=o['dl'], pay=o['pay'], vol=vol, mass=mass,
                             prep=o['prep'], contrib=o['fee'] - r['fee'], cls=o['cls']))
            self.qprep.setdefault(key, o['prep'])
        opts.sort(key=lambda x: (-x['contrib'], x['key'][1], -x['qty']))
        return opts

    def try_accept(self, d, o):
        """수락 검사(SPEC 12.4 순서 + 정책의 정시·직원 예측). 성공하면 None, 아니면 막힌 이유."""
        rule = self.pol.rule
        if o['contrib'] < rule['min_contrib']:
            return 'margin'
        need = o['purchase'] + o['freight'] + o['duty']
        if self.avail_usd() - self.reserve_cents(d) < need:
            return 'funds'
        if self.storage_used() + o['vol'] > self.storage_cap(d):
            return 'storage'
        transit = self.routes[o['dest']]['transit']
        last_reason = 'late'
        seq = len(self.contracts) + 1
        for s in self.next_sailings(o['dest'], d):
            arr = s + transit + self.ed['customs_days']
            if arr > self.days:
                last_reason = last_reason if last_reason != 'late' else 'horizon'
                continue
            late = arr > o['dl']
            if late and not rule['late']:
                continue
            if late and o['contrib'] - self.ed['late_cut'] < rule['min_contrib']:
                continue
            if not self.space_ok(o['dest'], s, o['vol'], o['mass']):
                last_reason = 'sailing'
                continue
            extra = dict(prep=o['prep'], sail=s, dl=o['dl'], seq=seq)
            if not self.project_ok(d, extra):
                last_reason = 'handling' if self.project_ok(d, extra, inf_cap=True) else 'staff'
                continue
            self.accept(d, o, s, seq)
            return None
        return last_reason

    def accept(self, d, o, s, seq):
        c = Contract()
        c.id, c.seq, c.kind, c.qkey = f'CT{seq:03d}', seq, o['kind'], o['key']
        c.good, c.qty, c.dest = o['good'], o['qty'], o['dest']
        c.purchase, c.sale, c.duty, c.freight = o['purchase'], o['sale'], o['duty'], o['freight']
        c.dl, c.pay, c.vol, c.mass, c.prep, c.rem = o['dl'], o['pay'], o['vol'], o['mass'], o['prep'], o['prep']
        c.staff, c.state, c.sail, c.accepted = None, 'PREP', None, d
        c.arrival = c.delivered = c.due = None
        c.cut = c.fees = 0
        c.duty_set = c.kind == 'F'
        c.duty_paid = c.kind == 'F'
        c.cls, c.started = o['cls'], None
        self.usd -= o['purchase']
        self.contracts.append(c)
        self.book(c, s)
        for i in o['ids']:
            self.status[i] = 'ACCEPTED'
        self.assign_real(d)

    def assign_real(self, d):
        tasks = self.task_list()
        if not tasks:
            return
        rates = {e: v['rate'] for e, v in self.staff.items()}
        busy = {x[2] for x in tasks if x[2] is not None}
        if self.recruit_busy(d):
            busy.add(self.recruiter)
        self._assign(d, tasks, busy, self.block_window(d), rates)
        by_seq = {c.seq: c for c in self.contracts}
        for x in tasks:
            c = by_seq[x[4]]
            if c.staff is None and x[2] is not None:
                c.staff = x[2]
                c.started = d

    def recruit_step(self, d):
        """영입: 조사(1pt) → 의뢰(3pt) → 면담 가능 다음 날 고용(계약금 일급 5일분). 담당은 물보리."""
        for r in self.recruits:
            if r['stage'] in ('HIRED', 'DROPPED'):
                continue
            if r['emp'] == 'FREE2':  # 진단용: 임금 0, 영입 절차 없음
                if d == r['plan']:
                    self.staff['FREE2'] = dict(rate=2, wage=0, from_day=d + 1)
                    r['stage'], r['hired'] = 'HIRED', d
                return
            holding = any(c.staff == self.recruiter and c.state == 'PREP' for c in self.contracts)
            if r['stage'] == 'PLANNED':
                bw = self.block_window(d)
                if bw and d >= bw[0] and not holding:
                    venue = self.ed['venue_of'][r['emp']]
                    if venue in self.scouted:
                        r['stage'], r['rem'], r['task_day'] = 'QUEST', self.ed['quest_pt'], d
                    else:
                        r['stage'], r['rem'], r['task_day'] = 'SCOUT', self.ed['scout_pt'], d
            elif r['stage'] == 'SCOUT' and r['rem'] == 0:
                self.scouted.add(self.ed['venue_of'][r['emp']])
                r['stage'], r['rem'], r['task_day'] = 'QUEST', self.ed['quest_pt'], d
            elif r['stage'] == 'READY':
                wage = self.ed['employees'][r['emp']]['wage']
                fee = wage * self.ed['signing_days']
                if self.avail_krw() >= fee:
                    self.krw -= fee
                    self.m['signing'] += fee
                    e = self.ed['employees'][r['emp']]
                    self.staff[r['emp']] = dict(rate=e['rate'], wage=e['wage'], from_day=d + 1)
                    r['stage'], r['hired'] = 'HIRED', d
            return  # 한 번에 한 명씩

    def recruit_progress(self, d):
        for r in self.recruits:
            if r['stage'] in ('SCOUT', 'QUEST') and r['rem'] > 0:
                used = min(self.staff[self.recruiter]['rate'], r['rem'])
                r['rem'] -= used
                self.m['pt_used'] += used
                if r['rem'] == 0 and r['stage'] == 'QUEST':
                    r['stage'] = 'READY'
                return True
        return False

    def invest_step(self, d):
        for x in self.pol.invest:
            if x[0] == 'E' and x[1] <= d and self.exp_eff is None:
                if self.avail_krw() >= self.P['exp_setup']:
                    self.krw -= self.P['exp_setup']
                    self.m['setup'] += self.P['exp_setup']
                    self.exp_eff = d + self.P['exp_after']
            if x[0] == 'S' and x[2] <= d:
                dest = next(k for k, r in self.routes.items() if r['id'] == x[1])
                if dest in self.space:
                    continue
                later = [s for s in self.sailings[dest] if s >= d + self.P['space_lead']]
                if later and self.avail_usd() >= self.P['space_fee']:
                    self.space[dest] = later[0]

    def rebook(self, d):
        for c in self.contracts:
            if c.state in ('PREP', 'READY') and c.sail is None:
                transit = self.routes[c.dest]['transit']
                for s in self.next_sailings(c.dest, d):
                    if s + transit > self.days:
                        break
                    if not self.space_ok(c.dest, s, c.vol, c.mass):
                        continue
                    if self.avail_usd() + c.freight < c.freight:
                        break
                    if c.state == 'PREP':
                        c.sail = s
                        ok = self.project_ok(d)
                        c.sail = None
                        if not ok:
                            continue
                    self.book(c, s)
                    break

    def commands(self, d):
        self.do_fx(d)
        self.recruit_step(d)
        self.invest_step(d)
        self.rebook(d)
        self.assign_real(d)
        for o in self.options(d):
            if self.qoutcome.get(o['key']) == 'ACCEPTED':
                continue
            reason = self.try_accept(d, o)
            if reason is None:
                self.qoutcome[o['key']] = 'ACCEPTED'
            elif self.qfirst.get(o['key'], d) == d:
                # 거절 이유는 그 견적을 처음 검토한 날 값으로 둔다(뒤의 날에는 정시 편이 사라져 늘 'late'가 된다).
                self.qfirst[o['key']] = d
                self.qoutcome[o['key']] = reason
        self.assign_real(d)

    # ── 3~6단계 ──
    def progress(self, d):
        tasks = self.task_list()
        rates = {e: v['rate'] for e, v in self.staff.items()}
        cap = self.handling_cap(d)
        waits = []
        done, used = self._progress(d, tasks, cap, rates, None, waits)
        by_seq = {c.seq: c for c in self.contracts}
        for x in tasks:
            c = by_seq[x[4]]
            c.rem = x[1]
            if c.rem == 0 and c.state == 'PREP':
                c.state = 'READY'
                c.staff = None
        self.m['pt_used'] += used
        self.m['handling_used'] += used
        self.m['handling_cap'] += cap
        self.m['wait_task_days'] += len(waits)
        rec = self.recruit_progress(d)
        # 직원 지표: 근무 가능 직원의 처리량과 실제 쓴 양, 업무를 하나도 쥐지 않은 날
        holders = {x[2] for x in tasks if x[2] is not None}
        for e, v in self.staff.items():
            if v['from_day'] <= d:
                self.m['pt_cap'] += v['rate']
                self.m['avail_days'] += 1
                if e not in holders and not (rec and e == self.recruiter):
                    self.m['idle_days'] += 1

    def departures(self, d):
        for c in self.contracts:
            if c.sail == d and c.state in ('PREP', 'READY'):
                if c.state == 'READY':
                    c.state = 'TRANSIT'
                    c.arrival = d + self.routes[c.dest]['transit']
                else:  # 준비 미완료 → 출항 불참, 운임 − 취소비 환급(engine.ts:897-901)
                    self.usd += c.freight - self.ed['cancel_fee']
                    c.fees += self.ed['cancel_fee']
                    b = self.booked[(c.dest, d)]
                    b[0] -= c.vol
                    b[1] -= c.mass
                    c.sail = None
                    self.m['missed_sailings'] += 1

    def arrivals(self, d):
        for c in self.contracts:
            if c.state == 'TRANSIT' and c.arrival <= d:
                c.state = 'ARR'
                if c.kind == 'T' and c.duty > 0:
                    c.duty_set = True
                    c.duty_paid = self.pay_or_accrue('USD', c.duty, 'DUTY-' + c.id, c)

    def deliveries(self, d):
        for c in self.contracts:
            if c.state == 'ARR' and c.arrival + self.ed['customs_days'] <= d and c.duty_paid:
                c.state = 'DELIVERED'
                c.delivered = d
                if d > c.dl:
                    c.cut = self.ed['late_cut']
                    self.m['late'] += 1
                c.due = max(c.pay, d)

    def finance(self, d):
        for c in self.contracts:
            if c.state == 'DELIVERED' and c.due <= d:
                self.usd += c.sale - c.cut
                c.state = 'PAID'
        self.settle()
        rent = self.rent_due(d)
        if rent:
            self.m['rent_paid'] += rent
            self.pay_or_accrue('KRW', rent, f'RENT-D{d:03d}')
        for dest, first in self.space.items():
            if d >= first and d in self.sailings[dest]:
                self.m['space_fees'] += self.P['space_fee']
                self.pay_or_accrue('USD', self.P['space_fee'], f'SPACE-{self.routes[dest]["id"]}-D{d:03d}')
        for e in self.ed['emp_order'] + ['FREE2']:
            v = self.staff.get(e)
            if v and v['from_day'] <= d and v['wage'] > 0:
                self.m['wages'] += v['wage']
                self.pay_or_accrue('KRW', v['wage'], f'WAGE-D{d:03d}-{e}')

    def d04(self, d):
        old = [o for o in self.obl if o[4] is None]
        if not old:
            return None
        o = min(old, key=lambda o: (o[3], 0 if o[1] == 'USD' else 1, self.obl.index(o)))
        age = d - o[3]
        if age >= self.P['fail_age']:
            self.failed = dict(day=d, obligation=o[0], cur=o[1], amt=o[2], incurred=o[3])
        return age

    def run(self, until=None):
        last = self.days if until is None else until
        for d in range(1, last + 1):
            self.day = d
            self.commands(d)
            self.step_rest(d)
            if self.failed:
                break
        return self.result()

    def step_rest(self, d):
        self.progress(d)
        self.departures(d)
        self.arrivals(d)
        self.deliveries(d)
        self.finance(d)
        self.d04(d)
        if self.unpaid('KRW') > 0:
            self.m['krw_unpaid_days'] += 1
        if self.unpaid('USD') > 0:
            self.m['usd_unpaid_days'] += 1
        if self.storage_used() * 10 >= self.storage_cap(d) * 9:
            self.m['storage_full_days'] += 1
        if not self.failed:
            for o in self.offers:
                if self.status[o['id']] == 'OPEN' and o['valid'] < d + 1 and o['publish'] <= d:
                    self.status[o['id']] = 'EXPIRED'
        if self.hist is not None:
            self.hist.append(dict(day=d, usd=self.usd, krw=self.krw, unpaid_krw=self.unpaid('KRW'),
                                  unpaid_usd=self.unpaid('USD'), n_unpaid=sum(1 for o in self.obl if o[4] is None),
                                  storage=self.storage_used(), failed=bool(self.failed)))

    # ── 결과 ──
    def net_usd(self):
        other = 0
        for c in self.contracts:
            if c.state == 'DELIVERED':
                other += c.sale - c.cut                     # 매출채권
            elif c.state in ('PREP', 'READY'):
                other += c.purchase + (c.freight if c.sail is not None else 0)  # 재고 + 선급운임
            elif c.state in ('TRANSIT', 'ARR'):
                other += c.purchase + c.freight + (c.duty if c.kind == 'T' and c.duty_set else 0)  # 재고·주선 진행원가
        return self.usd + other - self.unpaid('USD')

    def result(self):
        done = [c for c in self.contracts if c.state in ('DELIVERED', 'PAID')]
        contrib = sum(c.sale - c.cut - c.purchase - c.freight - c.duty - c.fees for c in done)
        reasons = {}
        demand_pt = {}
        for k, v in self.qoutcome.items():
            reasons[v] = reasons.get(v, 0) + 1
            demand_pt[v] = demand_pt.get(v, 0) + self.qprep.get(k, 0)
        krw_net = self.krw - self.unpaid('KRW')
        usd_net = self.net_usd()
        hired = [r['hired'] for r in self.recruits]
        return dict(
            seed=self.seed, policy=self.pol.label,
            end_usd=self.usd, end_krw=self.krw, usd_net=usd_net, krw_net=krw_net,
            value=usd_net / 100 + krw_net / self.rate_sell,
            krw_unpaid_days=self.m['krw_unpaid_days'], usd_unpaid_days=self.m['usd_unpaid_days'],
            first_unpaid=self.first_unpaid, fail_day=self.failed['day'] if self.failed else None,
            fail_obl=self.failed['obligation'] if self.failed else None,
            contrib=contrib,
            contrib_fwd_h=sum(c.sale - c.cut - c.freight - c.fees for c in done if c.cls == 'HANDLING'),
            contrib_trade=sum(c.sale - c.cut - c.purchase - c.freight - c.duty - c.fees for c in done if c.kind == 'T'),
            n_contracts=len(self.contracts), n_h=sum(1 for c in self.contracts if c.cls == 'HANDLING'),
            idle_share=1 - self.m['pt_used'] / self.m['pt_cap'] if self.m['pt_cap'] else 0,
            idle_day_share=self.m['idle_days'] / self.m['avail_days'] if self.m['avail_days'] else 0,
            handling_use=self.m['handling_used'] / self.m['handling_cap'] if self.m['handling_cap'] else 0,
            wait_task_days=self.m['wait_task_days'], storage_full_days=self.m['storage_full_days'],
            declined=reasons, declined_pt=demand_pt, fx_usd=self.m['fx_usd'], fx_spread=self.m['fx_spread'],
            wages=self.m['wages'], rent=self.m['rent_paid'], space_fees=self.m['space_fees'], signing=self.m['signing'],
            setup=self.m['setup'], missed=self.m['missed_sailings'], late=self.m['late'], hired=hired,
            expanded=self.exp_eff, space=dict(self.space),
        )


# ──────────────────────────────────────────────────────────────────────────────
# 7. 실행·집계
# ──────────────────────────────────────────────────────────────────────────────
_ED = None


def _ed(repo=None):
    global _ED
    if _ED is None:
        _ED = load_engine_data(repo or REPO_DEFAULT)
    return _ED


def run_one(args):
    repo, P, seed, pol = args
    ed = _ed(repo)
    return Sim(ed, P, seed, pol).run()


def run_many(repo, P, policies, seeds=SEEDS, jobs=4):
    tasks = [(repo, P, s, p) for p in policies for s in seeds]
    if jobs <= 1:
        res = [run_one(t) for t in tasks]
    else:
        with ProcessPoolExecutor(max_workers=jobs) as ex:
            res = list(ex.map(run_one, tasks, chunksize=max(1, len(tasks) // (jobs * 8))))
    out = {}
    for r in res:
        out.setdefault(r['policy'], []).append(r)
    return out


def med(xs):
    return statistics.median(xs) if xs else None


CAPACITY = ('storage', 'sailing', 'handling')


def summarize(rs):
    """정책 하나의 20시드 요약: 중앙값과 범위."""
    def rng(key, scale=1.0):
        xs = [r[key] / scale for r in rs]
        return med(xs), min(xs), max(xs)
    fails = [r['fail_day'] for r in rs if r['fail_day']]
    dec = lambda r, ks: sum(r['declined'].get(k, 0) for k in ks)
    return dict(
        n=len(rs),
        end_usd=rng('end_usd', 100), end_krw=rng('end_krw'), value=rng('value'),
        krw_unpaid_days=rng('krw_unpaid_days'), unpaid_runs=sum(1 for r in rs if r['first_unpaid']),
        fails=len(fails), fail_range=(min(fails), max(fails)) if fails else None,
        contrib=rng('contrib', 100), idle=rng('idle_share'), idle_days=rng('idle_day_share'),
        fx=rng('fx_usd', 100),
        dec_staff=(med([dec(r, ('staff',)) for r in rs]), min(dec(r, ('staff',)) for r in rs), max(dec(r, ('staff',)) for r in rs)),
        dec_cap=(med([dec(r, CAPACITY) for r in rs]), min(dec(r, CAPACITY) for r in rs), max(dec(r, CAPACITY) for r in rs)),
        dec_funds=med([dec(r, ('funds',)) for r in rs]),
        dec_detail={k: med([r['declined'].get(k, 0) for r in rs]) for k in
                    ('staff', 'handling', 'storage', 'sailing', 'funds', 'margin', 'late', 'horizon')},
        n_h=med([r['n_h'] for r in rs]), missed=med([r['missed'] for r in rs]), late=med([r['late'] for r in rs]),
        wait=med([r['wait_task_days'] for r in rs]),
    )


def paired(base_rs, rs):
    b = {r['seed']: r['value'] for r in base_rs}
    d = [r['value'] - b[r['seed']] for r in rs]
    return med(d), sum(1 for x in d if x > 0), d


# ──────────────────────────────────────────────────────────────────────────────
# 8. 기준 판정 (D03 나 목표). 값은 README의 '판정 기준' 절과 같다
# ──────────────────────────────────────────────────────────────────────────────
CRIT = dict(
    clear_delta=300.0,     # ‘뚜렷한’ 이득·손해: 분석값 중앙 차이 ±300 USD 이상
    clear_seeds=15,        # 그리고 같은 방향 시드 15/20 이상
    max_fail_hire=1,       # 이득 상황으로 셀 때 경영 실패 1/20 이하
    winner_share=12,       # (참고) 시드별 1위 최다 수
    dominant_seeds=17,     # 정책 하나가 17/20 시드 이상에서 그 시드 1위와 300 USD 안이면 ‘늘 이기는 정책’
    v0_lo=10616 * 1.0, v0_hi=10616 * 1.8,   # 그럴듯함: 투자 없는 보통 회사의 분석값 중앙 범위(시작값의 1.0~1.8배)
    max_quotes=10, pt_lo=2, pt_hi=12,        # 그럴듯함: 묶음당 견적 10건 이하, 주선 준비 2~12pt
)

_PCHECK = {}


def P_CHECK(res):
    return _PCHECK.get('ok', True)


def quotes_ok(ed, P):
    n = sum(P['fwd_split']) if P.get('fwd_split') else P['fwd_per_batch']
    pts = [fwd_prep(ed, P, t['good'], t['qty'], t['cls']) for t in templates_for(P)]
    return 4 + n <= CRIT['max_quotes'] and min(pts) >= CRIT['pt_lo'] and max(pts) <= CRIT['pt_hi']

HIRES = ['90k@8', '90k@30', '90k@50', '110k@8', '110k@30', '110k@50']
INVS = ['noinv', 'S1', 'E7', 'SE']


def search_policies():
    pols = [mkpol('N', 'fx7'), mkpol('N', 'none')]
    for inv in INVS[1:]:
        pols.append(mkpol('N', 'fx7', None, inv))
    for inv in INVS:
        for h in HIRES:
            pols.append(mkpol('N', 'fx7', h, inv))
    return pols


def evaluate(res):
    """정책 결과 → 기준 (1)~(4) 판정 재료."""
    base = res['N|fx7|nohire|noinv']
    nofx = res['N|none|nohire|noinv']
    s_base = summarize(base)
    out = dict(quotes_ok=P_CHECK(res), v0=s_base['value'][0], v0_min=s_base['value'][1], v0_fail=s_base['fails'], v0_unpaid=s_base['unpaid_runs'],
               nofx_fail=summarize(nofx)['fails'], v0_dec_staff=s_base['dec_staff'][0], v0_dec_cap=s_base['dec_cap'][0],
               v0_idle=s_base['idle'][0])
    hire_rows = []
    for inv in INVS:
        ref = res[f'N|fx7|nohire|{inv}']
        for h in HIRES:
            rs = res[f'N|fx7|{h}|{inv}']
            md, pos, _ = paired(ref, rs)
            fails = sum(1 for r in rs if r['fail_day'])
            hire_rows.append(dict(hire=h, inv=inv, delta=md, pos=pos, fails=fails))
    inv_rows = []
    for inv in INVS[1:]:
        md, pos, _ = paired(base, res[f'N|fx7|nohire|{inv}'])
        inv_rows.append(dict(inv=inv, delta=md, pos=pos))
    good = [x for x in hire_rows if x['delta'] >= CRIT['clear_delta'] and x['pos'] >= CRIT['clear_seeds']
            and x['fails'] <= CRIT['max_fail_hire']]
    bad = [x for x in hire_rows if x['delta'] <= -CRIT['clear_delta'] and x['pos'] <= 20 - CRIT['clear_seeds']]
    # (3) 시드별 1위와 ‘후회’(그 시드의 1위 값 − 이 정책 값). fx7 정책 전부(실패 실행 제외 없이 그대로)
    labels = sorted(k for k in res if '|fx7|' in k and 'FREE2' not in k)  # 임금 0 직원(진단용)은 플레이어 선택지가 아니다
    vals = {k: {r['seed']: r['value'] for r in res[k]} for k in labels}
    wins = {}
    hire_win = nohire_win = 0
    best = {}
    for seed in SEEDS:
        b = max(labels, key=lambda k: vals[k][seed])
        best[seed] = vals[b][seed]
        wins[b] = wins.get(b, 0) + 1
        if '|nohire|' in b:
            nohire_win += 1
        else:
            hire_win += 1
    near = {k: sum(1 for s_ in SEEDS if best[s_] - vals[k][s_] <= CRIT['clear_delta']) for k in labels}
    robust = max(labels, key=lambda k: (near[k], -sum(best[s_] - vals[k][s_] for s_ in SEEDS)))
    top = max(wins.values())
    out.update(hire_rows=hire_rows, inv_rows=inv_rows, good=[f"{x['hire']}/{x['inv']}" for x in good],
               bad=[f"{x['hire']}/{x['inv']}" for x in bad], wins=wins, top_win=top,
               hire_win=hire_win, nohire_win=nohire_win, robust=robust, robust_near=near[robust],
               robust_regret=med([best[s_] - vals[robust][s_] for s_ in SEEDS]))
    c1 = s_base['fails'] == 0
    c2 = bool(good) and bool(bad)
    c3 = near[robust] < CRIT['dominant_seeds']
    c4 = CRIT['v0_lo'] <= s_base['value'][0] <= CRIT['v0_hi'] and out['nofx_fail'] >= 15 and out['quotes_ok']
    out.update(c1=c1, c2=c2, c3=c3, c4=c4, passed=c1 and c2 and c3 and c4)
    return out


# ──────────────────────────────────────────────────────────────────────────────
# 9. 탐색 공간 (D03 나)
# ──────────────────────────────────────────────────────────────────────────────


def stage1_space():
    """수요 쪽: 묶음당 주선 수(한 풀/나눠 뽑기) × 일반 주선 부피 계수 × 최소 pt × 작업 포함 등급 모양(부피·pt).
    선복 계약·창고 확장은 명세 값(+10 m³·30 USD, +20 m³·+3pt)으로 고정."""
    sets = []
    draws = [('F', None, n) for n in (3, 4, 5, 6)] + [('FH', None, n) for n in (5, 6)] + \
        [('FH', sp, sum(sp)) for sp in ((3, 3), (2, 4))]
    hshapes = [(1, 12), (1, 10), (2, 12), (2, 10), (3, 12), (3, 10)]  # (수량 배수 → 3·6·9 m³, 준비 pt)
    for pool, split, n in draws:
        for hs, hpt in (hshapes if 'H' in pool else [(1, 12)]):
            for stdl in (6000, 4000, 3000):
                for mn in (2, 3):
                    sets.append(dict(SPEC_P, pool=pool, fwd_split=split, fwd_per_batch=n, h_qty_scale=hs,
                                     h_l_per_pt=3000 * hs // hpt, std_l_per_pt=stdl, fwd_min_pt=mn))
    return sets


def stage2_space(bases):
    """선복 계약(편당 추가 m³·요금)과 창고 확장(추가 m³·pt) 변형."""
    sets = []
    for b in bases:
        for sl, sf in [(10000, 3000), (10000, 1500), (15000, 3000), (20000, 3000), (20000, 4500), (10000, 6000)]:
            for es, eh in [(20000, 3), (20000, 4), (30000, 3)]:
                sets.append(dict(b, space_l=sl, space_g=sl * 150, space_fee=sf, exp_storage_l=es, exp_handling_pt=eh))
    return sets


def pkey(P):
    keys = ['pool', 'fwd_per_batch', 'fwd_split', 'std_l_per_pt', 'h_qty_scale', 'h_l_per_pt', 'fwd_min_pt', 'space_l',
            'space_fee', 'exp_storage_l', 'exp_handling_pt', 'h_fee_add']
    return {k: P.get(k) for k in keys}


def cmd_search(a):
    os.makedirs(OUT, exist_ok=True)
    if a.stage == 1:
        sets = stage1_space()
        path = os.path.join(OUT, 'search_stage1.jsonl')
    else:
        rows = [json.loads(l) for l in open(os.path.join(OUT, 'search_stage1.jsonl'), encoding='utf-8')]
        rows = [r for r in rows if r['c1'] and r['c4']]
        rows.sort(key=lambda r: (-(r['c2'] + r['c3']), deviation(r['params']), -r['score']))
        bases = [dict(SPEC_P, **r['params']) for r in rows[:a.top]]
        sets = stage2_space(bases)
        path = os.path.join(OUT, 'search_stage2.jsonl')
    pols = search_policies()
    t0 = time.time()
    with open(path, 'w', encoding='utf-8') as f:
        for i, P in enumerate(sets):
            res = run_many(a.repo, P, pols, jobs=a.jobs)
            _PCHECK['ok'] = quotes_ok(_ed(a.repo), P)
            ev = evaluate(res)
            row = dict(params=pkey(P), **{k: v for k, v in ev.items() if k not in ('wins',)})
            row['score'] = score(ev)
            f.write(json.dumps(row, ensure_ascii=False) + '\n')
            f.flush()
            print(f'[{i + 1}/{len(sets)} {time.time() - t0:.0f}s] {pkey(P)} v0={ev["v0"]:.0f} c={ev["c1"]:d}{ev["c2"]:d}'
                  f'{ev["c3"]:d}{ev["c4"]:d} good={ev["good"][:3]} bad={len(ev["bad"])} top={ev["top_win"]}', flush=True)


def deviation(pp):
    """승인·결정 값에서 얼마나 벗어났는가(작을수록 좋다). 결정값(D03 나 문구·D02-② 확장)은 2점, 명세 새 값은 1점."""
    d = 0
    d += 2 * (pp['std_l_per_pt'] != 6000) + 2 * (pp['fwd_min_pt'] != 2)
    d += 2 * ((pp.get('exp_storage_l') or 20000) != 20000 or (pp.get('exp_handling_pt') or 3) != 3)
    if pp['pool'] == 'F':
        d += (pp['fwd_per_batch'] != 5)
    else:
        d += 1 + bool(pp.get('fwd_split')) + (pp['fwd_per_batch'] != 6)
        d += ((pp.get('h_qty_scale') or 1) != 1) + (3000 * (pp.get('h_qty_scale') or 1) // pp['h_l_per_pt'] != 12)
    d += ((pp.get('space_l') or 10000) != 10000 or (pp.get('space_fee') or 3000) != 3000)
    return d


def describe(pp):
    hs = pp.get('h_qty_scale') or 1
    draw = f"F{pp['fwd_per_batch']}" if pp['pool'] == 'F' else (
        f"F{pp['fwd_split'][0]}+H{pp['fwd_split'][1]}" if pp.get('fwd_split') else f"FH{pp['fwd_per_batch']}")
    h = '' if pp['pool'] == 'F' else f" H{3 * hs}m³·{3000 * hs // pp['h_l_per_pt']}pt"
    return (f"{draw}{h} 일반 {pp['std_l_per_pt'] // 1000}m³/pt 최소{pp['fwd_min_pt']} "
            f"선복+{(pp.get('space_l') or 10000) // 1000}m³·{(pp.get('space_fee') or 3000) // 100}USD "
            f"확장+{(pp.get('exp_storage_l') or 20000) // 1000}m³·+{pp.get('exp_handling_pt') or 3}pt")


def cmd_rank(a):
    rows = [json.loads(l) for l in open(os.path.join(OUT, f'search_stage{a.stage}.jsonl'), encoding='utf-8')]
    for r in rows:
        r['dev'] = deviation(r['params'])
        r['ok'] = r['c1'] + r['c2'] + r['c3'] + r['c4']
    rows.sort(key=lambda r: (-r['ok'], r['dev'], -r['score']))
    L = [f'# 탐색 {a.stage}단계 순위 ({len(rows)}개 묶음, 시드 1001~1020, 정책 29개)', '',
         '판정 1: 창업 2명·보통·환전 실패 0/20. 2: 뚜렷한 고용 이득 상황과 뚜렷한 손해 상황이 모두 있음(±300 USD, 같은 방향 15/20, 이득 쪽 실패 ≤1). '
         '3: 어느 정책도 17/20 시드 이상에서 그 시드 1위와 300 USD 안이 아님. 4: 묶음당 견적 ≤10, 주선 준비 2~12pt, 투자 없는 보통 회사 분석값 1.0~1.8배, 환전 없으면 15/20 이상 실패. '
         '벗어남 = 결정값 변경 2점, 명세 새 값 변경 1점.', '',
         '| 판정 1234 | 벗어남 | 묶음 | 투자 없는 회사 분석값 | 기준 직원 유휴 | 뚜렷한 이득(고용/투자) | 뚜렷한 손해 수 | 가장 강한 정책(1위와 300 안 시드) | 점수 |',
         '|---|---:|---|---:|---:|---|---:|---|---:|']
    for r in rows[:a.n]:
        L.append(f"| {r['c1']:d}{r['c2']:d}{r['c3']:d}{r['c4']:d} | {r['dev']} | {describe(r['params'])} | {r['v0']:,.0f} | "
                 f"{r['v0_idle'] * 100:.0f}% | {', '.join(r['good'][:4]) or '—'}{' …' if len(r['good']) > 4 else ''} | {len(r['bad'])} | "
                 f"`{r['robust']}` ({r['robust_near']}) | {r['score']:.0f} |")
    fam = {}
    for r in rows:
        k = 'F만(결정 묶음 구조)' if r['params']['pool'] == 'F' else (
            'F+H 나눠 뽑기' if r['params'].get('fwd_split') else 'F+H 한 풀')
        f = fam.setdefault(k, dict(n=0, c2=0, passed=0, best=None))
        f['n'] += 1
        f['c2'] += r['c2']
        f['passed'] += r['ok'] == 4
    L += ['', '| 무리 | 묶음 수 | 판정 2 통과 | 네 판정 모두 통과 |', '|---|---:|---:|---:|']
    for k, f in fam.items():
        L.append(f"| {k} | {f['n']} | {f['c2']} | {f['passed']} |")
    text = '\n'.join(L) + '\n'
    with open(os.path.join(OUT, f'ranking_stage{a.stage}.md'), 'w', encoding='utf-8') as f:
        f.write(text)
    print(text)


def score(ev):
    """같은 판정이면: 이득 상황과 손해 상황이 모두 뚜렷할수록 높다."""
    best = max((x['delta'] for x in ev['hire_rows'] if x['fails'] <= CRIT['max_fail_hire']), default=0)
    worst = min((x['delta'] for x in ev['hire_rows']), default=0)
    npos = max((x['pos'] for x in ev['hire_rows'] if x['fails'] <= CRIT['max_fail_hire']), default=0)
    return round(min(best, -worst) + 20 * npos, 1)


# ──────────────────────────────────────────────────────────────────────────────
# 10. 표 쓰기
# ──────────────────────────────────────────────────────────────────────────────


def fmt_rng(t, nd=0, pct=False):
    if t is None or t[0] is None:
        return '—'
    if pct:
        return f'{t[0] * 100:.0f}% ({t[1] * 100:.0f}~{t[2] * 100:.0f})'
    f = f'{{:,.{nd}f}}'
    return f'{f.format(t[0])} ({f.format(t[1])}~{f.format(t[2])})'


def policy_table(res, labels, ref_of):
    lines = ['| 정책 | 끝 USD | 끝 KRW | 원화 미지급 일수 | 경영 실패 | 기여이익 USD | 직원 유휴 | 직원 부족 거절 | 용량 부족 거절 | 분석값 | 기준 대비(중앙·이득 시드) |',
             '|---|---|---|---|---|---|---|---|---|---|---|']
    for lab in labels:
        s = summarize(res[lab])
        fail = f"{s['fails']}/20" + (f" ({s['fail_range'][0]}~{s['fail_range'][1]}일)" if s['fail_range'] else '')
        ref = ref_of(lab)
        if ref and ref in res and ref != lab:
            md, pos, _ = paired(res[ref], res[lab])
            cmp_ = f'{md:+,.0f} · {pos}/20'
        else:
            cmp_ = '—'
        lines.append(f"| `{lab}` | {fmt_rng(s['end_usd'])} | {fmt_rng(s['end_krw'])} | {fmt_rng(s['krw_unpaid_days'])} | {fail} | "
                     f"{fmt_rng(s['contrib'])} | {fmt_rng(s['idle'], pct=True)} | {fmt_rng(s['dec_staff'])} | "
                     f"{fmt_rng(s['dec_cap'])} | {fmt_rng(s['value'])} | {cmp_} |")
    return '\n'.join(lines)


def ref_label(lab):
    acc, fx, hire, inv = lab.split('|')
    if hire != 'nohire':
        return f'{acc}|{fx}|nohire|{inv}'
    if inv != 'noinv':
        return f'{acc}|{fx}|nohire|noinv'
    if fx != 'fx7':
        return f'{acc}|fx7|nohire|noinv'
    if acc != 'N':
        return 'N|fx7|nohire|noinv'
    return None


def full_policies():
    pols = []
    for acc in ['C', 'N', 'A']:
        for fx in ['fx7', 'none']:
            for inv in INVS:
                for h in [None] + HIRES:
                    pols.append(mkpol(acc, fx, h, inv))
    for inv in ['noinv', 'SE']:
        pols.append(mkpol('N', 'react', None, inv))
        pols.append(mkpol('N', 'react', '90k@30', inv))
    # 진단: 임금 0 직원(그림자 가치), 두 명 고용, 늦은 투자 + 30일 고용
    for inv in ['noinv', 'SE']:
        pols.append(mkpol('N', 'fx7', 'FREE2@8', inv))
        pols.append(mkpol('N', 'fx7', '90k@22+110k@36', inv))
        pols.append(mkpol('N', 'fx7', '90k@22', inv))
        pols.append(mkpol('N', 'fx7', '90k@36', inv))
    pols.append(mkpol('N', 'fx7', None, 'SE22'))
    pols.append(mkpol('N', 'fx7', '90k@30', 'SE22'))
    pols.append(mkpol('N', 'fx7', '110k@30', 'SE22'))
    pols.append(mkpol('N', 'fx7', None, 'E22'))
    pols.append(mkpol('N', 'fx7', '110k@30', 'E22'))
    return pols


def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and v[order[j + 1]] == v[order[i]]:
                j += 1
            for k in range(i, j + 1):
                r[order[k]] = (i + j) / 2
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    n = len(xs)
    mx, my = sum(rx) / n, sum(ry) / n
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    vx = math.sqrt(sum((a - mx) ** 2 for a in rx))
    vy = math.sqrt(sum((b - my) ** 2 for b in ry))
    return cov / (vx * vy) if vx and vy else 0.0


def candidate_report(name, P, res, ev):
    L = [f'## {name}', '', '매개변수: `' + json.dumps(pkey(P), ensure_ascii=False) + '`', '']
    L.append(f"판정: (1) 창업 2명·보통·환전 실패 {ev['v0_fail']}/20 → {'통과' if ev['c1'] else '실패'} · "
             f"(2) 뚜렷한 이득 {len(ev['good'])}개·뚜렷한 손해 {len(ev['bad'])}개 → {'통과' if ev['c2'] else '실패'} · "
             f"(3) 가장 강한 정책 `{ev['robust']}`이 1위와 300 USD 안인 시드 {ev['robust_near']}/20(후회 중앙 {ev['robust_regret']:,.0f}), "
             f"시드별 1위 최다 {ev['top_win']}/20, 1위 중 고용 {ev['hire_win']}·비고용 {ev['nohire_win']} → "
             f"{'통과' if ev['c3'] else '실패'} · (4) 투자 없는 보통 회사 분석값 중앙 {ev['v0']:,.0f} → {'통과' if ev['c4'] else '실패'}")
    L.append('')
    L.append('### 고용 변형(보통·환전, 같은 투자의 비고용 대비 분석값 차이 중앙 · 이득 시드 · 실패)')
    L.append('')
    L.append('| 고용 | 투자 없음 | 선복 계약 S1 | 창고 확장 E7 | 둘 다 SE |')
    L.append('|---|---|---|---|---|')
    for h in HIRES:
        cells = []
        for inv in INVS:
            x = next(r for r in ev['hire_rows'] if r['hire'] == h and r['inv'] == inv)
            mark = ' **↑**' if f'{h}/{inv}' in ev['good'] else (' **↓**' if f'{h}/{inv}' in ev['bad'] else '')
            cells.append(f"{x['delta']:+,.0f} · {x['pos']}/20 · 실패 {x['fails']}{mark}")
        L.append(f'| {h} | ' + ' | '.join(cells) + ' |')
    L.append('')
    L.append('투자만(고용 없음, 투자 없음 대비): ' + ', '.join(f"{x['inv']} {x['delta']:+,.0f} · {x['pos']}/20" for x in ev['inv_rows']))
    L.append('')
    # 식별 가능성: 기준 실행의 직원 부족 거절 pt와 고용 이득의 순위 상관
    base = {r['seed']: r for r in res['N|fx7|nohire|noinv']}
    L.append('### 이득 상황을 알아볼 수 있는가(시드별)')
    L.append('')
    L.append('같은 투자의 고용 없는 실행에서 ‘직원 부족’으로 거절한 견적의 준비 pt 합(플레이어가 본사 표에서 보는 신호)과, '
             '고용 이득(분석값 차이)의 순위 상관(스피어만).')
    L.append('')
    L.append('| 고용/투자 | 상관 | 직원 부족 거절 pt 상위 절반 시드의 이득 시드 | 하위 절반 |')
    L.append('|---|---:|---|---|')
    for h in ['90k@30', '110k@30', '90k@8']:
        for inv in ['noinv', 'SE']:
            lab = f'N|fx7|{h}|{inv}'
            ref = {r['seed']: r for r in res[f'N|fx7|nohire|{inv}']}
            xs = [ref[s]['declined_pt'].get('staff', 0) for s in SEEDS]
            ds = [next(r['value'] for r in res[lab] if r['seed'] == s) - ref[s]['value'] for s in SEEDS]
            rho = spearman(xs, ds)
            order = sorted(range(20), key=lambda i: -xs[i])
            hi = sum(1 for i in order[:10] if ds[i] > 0)
            lo = sum(1 for i in order[10:] if ds[i] > 0)
            L.append(f'| {h}/{inv} | {rho:+.2f} | {hi}/10 | {lo}/10 |')
    L.append('')
    return '\n'.join(L)


KEY_ROWS = ['N|fx7|nohire|noinv', 'N|none|nohire|noinv', 'N|react|nohire|noinv', 'C|fx7|nohire|noinv', 'A|fx7|nohire|noinv',
            'N|fx7|nohire|S1', 'N|fx7|nohire|E7', 'N|fx7|nohire|SE', 'N|fx7|90k@8|noinv', 'N|fx7|90k@30|noinv',
            'N|fx7|90k@50|noinv', 'N|fx7|110k@30|noinv', 'N|fx7|90k@8|SE', 'N|fx7|90k@30|SE', 'N|fx7|90k@50|SE',
            'N|fx7|110k@8|SE', 'N|fx7|110k@30|SE', 'N|fx7|110k@30|E7', 'N|fx7|90k@30|SE22', 'N|fx7|110k@30|SE22',
            'N|fx7|90k@22+110k@36|SE', 'N|react|90k@30|SE', 'N|none|90k@30|SE', 'C|fx7|90k@30|SE', 'A|fx7|90k@30|SE',
            'N|fx7|FREE2@8|noinv', 'N|fx7|FREE2@8|SE']


def write_key_table(name, res):
    labs = [k for k in KEY_ROWS if k in res]
    return '\n'.join([f'### {name}: 핵심 행 (20시드 중앙값과 범위)', '', policy_table(res, labs, ref_label), ''])


def write_full_tables(name, P, res):
    L = [f'### {name}: 전체 정책 표 (20시드 중앙값과 범위)', '',
         '열: 끝 USD·KRW는 90일 마감(또는 실패일) 현금. 원화 미지급 일수는 마감에 원화 미지급이 남은 날 수. '
         '직원 유휴 = 1 − 쓴 pt ÷ 근무 직원 pt. 거절 수는 견적 단위(직접 무역은 상품별 짝 1건). 용량 = 보관·선복·창고 처리. '
         '분석값 = USD 순자산 + KRW 순자산 ÷ 1,313(설계 분석 전용, 게임 화면에 없음). 기준 대비 = 같은 시드 짝 비교.', '']
    order = sorted(res.keys(), key=lambda k: (k.split('|')[0] != 'N', k.split('|')[1] != 'fx7', k))
    L.append(policy_table(res, order, ref_label))
    L.append('')
    return '\n'.join(L)


def cmd_grid(a):
    os.makedirs(OUT, exist_ok=True)
    P = resolve_params(a.params)
    pols = full_policies() if a.policies == 'full' else search_policies()
    res = run_many(a.repo, P, pols, jobs=a.jobs)
    _PCHECK['ok'] = quotes_ok(_ed(a.repo), P)
    ev = evaluate(res)
    text = candidate_report(a.params, P, res, ev) + '\n' + write_full_tables(a.params, P, res)
    path = a.out or os.path.join(OUT, f'grid_{a.params}.md')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    dump_runs(res, os.path.join(OUT, f'runs_{a.params}.csv'))
    print(text[:4000])
    print('→', path)


def dump_runs(res, path):
    cols = ['policy', 'seed', 'end_usd', 'end_krw', 'usd_net', 'krw_net', 'value', 'krw_unpaid_days', 'first_unpaid',
            'fail_day', 'fail_obl', 'contrib', 'contrib_trade', 'contrib_fwd_h', 'n_contracts', 'n_h', 'idle_share',
            'idle_day_share', 'handling_use', 'wait_task_days', 'storage_full_days', 'fx_usd', 'wages', 'rent',
            'space_fees', 'signing', 'setup', 'missed', 'late', 'hired']
    with open(path, 'w', encoding='utf-8') as f:
        f.write(','.join(cols + ['dec_staff', 'dec_handling', 'dec_storage', 'dec_sailing', 'dec_funds', 'dec_margin',
                                 'dec_late', 'dec_staff_pt']) + '\n')
        for lab in sorted(res):
            for r in res[lab]:
                row = [str(r[c]).replace(',', ';') if not isinstance(r[c], float) else f'{r[c]:.4f}' for c in cols]
                row += [str(r['declined'].get(k, 0)) for k in ('staff', 'handling', 'storage', 'sailing', 'funds', 'margin', 'late')]
                row.append(str(r['declined_pt'].get('staff', 0)))
                f.write(','.join(row) + '\n')


def resolve_params(name):
    if name in NAMED:
        return NAMED[name]
    if name in CANDIDATES:
        return dict(SPEC_P, **CANDIDATES[name]['params'])
    return dict(SPEC_P, **json.loads(name))


# 탐색 뒤 고른 후보(README·out/candidates.md). 값은 SPEC_P에서 바뀌는 것만 적는다.
CANDIDATES = {
    'CAND_A': dict(params=dict(fwd_split=(3, 3), fwd_per_batch=6),
                   note='— 작업 포함 3 m³·12pt, 묶음당 일반 3 + 작업 포함 3 (명세에서 뽑는 방식만 바꿈)'),
    'CAND_B': dict(params=dict(fwd_split=(2, 4), fwd_per_batch=6, h_qty_scale=3, h_l_per_pt=750),
                   note='— 작업 포함 9 m³·12pt, 묶음당 일반 2 + 작업 포함 4 (보관·선복과 직원이 함께 묶임)'),
    'CAND_C': dict(params=dict(fwd_split=(3, 3), fwd_per_batch=6, h_qty_scale=2, h_l_per_pt=500),
                   note='— 작업 포함 6 m³·12pt, 묶음당 일반 3 + 작업 포함 3 (A와 B의 중간)'),
}


def cmd_validate(a):
    """표본 밖 시드(기본 1021~1040)로 후보 판정을 다시 잰다. 서비스 대금 민감도도 함께."""
    global SEEDS
    SEEDS = list(range(a.first, a.first + 20))
    names = a.candidates.split(',') if a.candidates else list(CANDIDATES)
    L = [f'# 표본 밖 확인: 시드 {SEEDS[0]}~{SEEDS[-1]} (후보는 1001~1020으로 골랐다)', '',
         '| 묶음 | 판정 1234 | 투자 없는 회사 분석값 | 뚜렷한 이득 | 뚜렷한 손해 수 | 가장 강한 정책(1위와 300 안 시드) |', '|---|---|---:|---|---:|---|']
    variants = []
    for n in names:
        variants.append((n, resolve_params(n)))
        variants.append((f'{n} (H 대금 −200 USD)', dict(resolve_params(n), h_fee_add=-200)))
    for label, P in variants:
        res = run_many(a.repo, P, search_policies(), seeds=SEEDS, jobs=a.jobs)
        _PCHECK['ok'] = quotes_ok(_ed(a.repo), P)
        ev = evaluate(res)
        L.append(f"| {label} | {ev['c1']:d}{ev['c2']:d}{ev['c3']:d}{ev['c4']:d} | {ev['v0']:,.0f} | {', '.join(ev['good'][:5]) or '—'}"
                 f"{' …' if len(ev['good']) > 5 else ''} | {len(ev['bad'])} | `{ev['robust']}` ({ev['robust_near']}) |")
        L.append('| | 고용 표 | ' + ' / '.join(f"{x['hire']}·{x['inv']} {x['delta']:+,.0f}({x['pos']})" for x in ev['hire_rows']
                                                 if x['hire'] in ('90k@8', '90k@30', '110k@30') and x['inv'] in ('noinv', 'SE')) + ' | | | |')
        print(label, ev['c1'], ev['c2'], ev['c3'], ev['c4'], flush=True)
    text = '\n'.join(L) + '\n'
    with open(os.path.join(OUT, f'validate_{SEEDS[0]}.md'), 'w', encoding='utf-8') as f:
        f.write(text)
    print(text)


def cmd_report(a):
    os.makedirs(OUT, exist_ok=True)
    names = a.candidates.split(',') if a.candidates else list(CANDIDATES)
    parts = ['# M2a-5 D03 나 후보 묶음 — 전체 정책 표', '',
             f'생성: `python3 m2a5_model.py report --candidates {",".join(names)}` · 시드 1001~1020 · 엔진 자료 `{a.repo}`', '']
    for name in names:
        P = resolve_params(name)
        res = run_many(a.repo, P, full_policies(), jobs=a.jobs)
        _PCHECK['ok'] = quotes_ok(_ed(a.repo), P)
        ev = evaluate(res)
        note = CANDIDATES.get(name, {}).get('note', '')
        parts.append(candidate_report(f'{name} {note}'.strip(), P, res, ev))
        parts.append(write_key_table(name, res))
        parts.append(write_full_tables(name, P, res))
        dump_runs(res, os.path.join(OUT, f'runs_{name}.csv'))
        print(name, 'done', ev['c1'], ev['c2'], ev['c3'], ev['c4'], flush=True)
    path = os.path.join(OUT, 'candidates.md')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(parts))
    print('→', path)


# ──────────────────────────────────────────────────────────────────────────────
# 11. 자체 검산 (SPEC 18절 손계산 사례, 엔진 난수 node 대조)
# ──────────────────────────────────────────────────────────────────────────────


class Scripted(Sim):
    """정책 대신 날짜별 명령 함수를 쓴다(검산용)."""

    def __init__(self, ed, P, seed, script):
        super().__init__(ed, P, seed, Policy('N', 'none'))
        self.script = script

    def commands(self, d):
        f = self.script.get(d)
        if f:
            f(self)
        self.assign_real_fixed(d)

    def assign_real_fixed(self, d):
        pass


def _accept_fixed(sim, d, offer_ids, sail, staff=None, qty=None):
    """일괄 확정(plan)과 같은 수락: 지정 직원·지정 출항편. 검산용으로 검사 없이 넣는다."""
    o = None
    opts = []
    rule_backup = sim.pol.rule
    sim.pol.rule = dict(ACCEPT_RULES['A'], max_qty=True)
    for x in sim.options(d):
        if tuple(x['ids']) == tuple(offer_ids) and (qty is None or x['qty'] == qty):
            opts.append(x)
    sim.pol.rule = rule_backup
    o = opts[0]
    seq = len(sim.contracts) + 1
    c = Contract()
    c.id, c.seq, c.kind, c.qkey = f'CT{seq:03d}', seq, o['kind'], o['key']
    c.good, c.qty, c.dest = o['good'], o['qty'], o['dest']
    c.purchase, c.sale, c.duty, c.freight = o['purchase'], o['sale'], o['duty'], o['freight']
    c.dl, c.pay, c.vol, c.mass, c.prep, c.rem = o['dl'], o['pay'], o['vol'], o['mass'], o['prep'], o['prep']
    c.staff, c.state, c.sail, c.accepted = staff, 'PREP', None, d
    c.arrival = c.delivered = c.due = None
    c.cut = c.fees = 0
    c.duty_set = c.duty_paid = c.kind == 'F'
    c.cls, c.started = o['cls'], d if staff else None
    sim.usd -= o['purchase']
    sim.contracts.append(c)
    if sail:
        sim.book(c, sail)
    for i in o['ids']:
        sim.status[i] = 'ACCEPTED'
    return c


def cmd_selfcheck(a):
    ed = _ed(a.repo)
    lines = []
    ok_all = True

    def check(name, got, want):
        nonlocal ok_all
        ok = got == want
        ok_all &= ok
        lines.append(f"{'통과' if ok else '실패'} | {name} | 값 {got} | 기대 {want}")

    # (1) 난수: node로 엔진 rng.ts를 직접 불러 묶음 흐름 값을 비교
    rng_ts = os.path.join(a.repo, 'src/engine/rng.ts')
    js = ("import(process.argv[1]).then(m=>{const out={};for(const seed of [42032026,1001,1020]){for(let k=1;k<=11;k++){"
          "let r=m.createRng(seed);const s='MARKET-B'+String(k).padStart(2,'0');const v=[];for(let i=0;i<22;i++){const d=m.drawUniform(r,s);"
          "v.push(d.value);r=d.rng;}out[seed+':'+s]=v;}}console.log(JSON.stringify(out));})")
    try:
        p = subprocess.run(['node', '--experimental-strip-types', '--no-warnings', '-e', js, rng_ts], capture_output=True,
                           text=True, timeout=60)
        node = json.loads(p.stdout.strip().splitlines()[-1])
        mism = 0
        for key, vals in node.items():
            seed, stream = key.split(':')
            st = Stream(int(seed), stream)
            mine = [st.word() / 4294967296 for _ in vals]
            mism += sum(1 for x, y in zip(mine, vals) if x != y)
        check('난수 이식 = 엔진 rng.ts(node), 3시드 × 11흐름 × 22개', mism, 0)
    except Exception as e:  # node가 없으면 건너뛴다
        lines.append(f'건너뜀 | node 대조 불가: {e}')

    # (2) P0-M2A5-01: 시드 42032026 8일 묶음
    P = SPEC_P
    bts = generate_batches(ed, P, 42032026)
    b1 = bts[0]
    check('8일 묶음 지수 bp', b1['index_bp'], {'APPAREL': 10200, 'COSMETICS': 10200})
    check('8일 묶음 판매지', b1['dest'], {'APPAREL': 'SHANGHAI', 'COSMETICS': 'HAIPHONG'})
    check('8일 묶음 주선 틀', b1['chosen'], ['F1', 'F4', 'H1', 'H2', 'H3', 'H5'])
    units = {o['id']: o.get('unit') for o in b1['offers'] if o['kind'] in ('BUY', 'SELL')}
    check('8일 단가(cents)', units, {'MKT-D008-APP-BUY': 990, 'MKT-D008-APP-SELL': 1405, 'MKT-D008-COS-BUY': 4038,
                                    'MKT-D008-COS-SELL': 5098})
    check('8일 최대 물량', {o['id']: o['maxq'] for o in b1['offers'] if o['kind'] == 'BUY'},
          {'MKT-D008-APP-BUY': 200, 'MKT-D008-COS-BUY': 100})
    check('8일 난수 개수', len(b1['draws']), 22)
    check('15일 묶음 주선 틀(P0-M2A5-03)', bts[1]['chosen'], ['F1', 'F5', 'F6', 'H2', 'H3', 'H4'])
    check('15일 지수(P0-M2A5-02)', bts[1]['index_bp'], {'APPAREL': 10200, 'COSMETICS': 10506})
    b78 = bts[-1]
    check('78일 묶음: 납기 90 넘는 틀 제외', sorted(o['tpl'] for o in b78['offers'] if o['kind'] == 'FWD'),
          sorted(t for t in b78['chosen'] if t in ('F1', 'F3', 'F5', 'F6')))
    # (3) 준비 업무량(P0-M2A5-05)
    check('주선 준비 pt F1~F6, H', [fwd_prep(ed, P, t['good'], t['qty'], t['cls']) for t in F_TEMPLATES + H_TEMPLATES[:1]],
          [4, 2, 2, 2, 3, 2, 12])
    check('1일 묶음 주선 준비 pt', [o['prep'] for o in batch0_offers(ed, P) if o['kind'] == 'FWD'], [4, 2])

    # (4) P0-M2A5-12 기대 경로: 17일 USD 3,500 / 3,430
    for trade, want17 in [(('OFFER_BUY_02', 'OFFER_SELL_02'), 350000), (('OFFER_BUY_01', 'OFFER_SELL_01'), 343000)]:
        snaps = {}

        def day1(s, trade=trade):
            tr_sail = 2
            _accept_fixed(s, 1, trade, tr_sail, 'EMP01')
            _accept_fixed(s, 1, ('OFFER_FWD_01',), 2, 'EMP02')
            _accept_fixed(s, 1, ('OFFER_FWD_02',), 9, None)

        def day2(s):
            s.contracts[2].staff = 'EMP01'
        sim = Scripted(ed, P, 42032026, {1: day1, 2: day2})
        for d in range(1, 18):
            sim.day = d
            sim.commands(d)
            if d == 1:
                snaps['cash1'], snaps['res1'] = sim.usd, sim.reserved_usd()
            sim.step_rest(d)
            if d == 7:
                snaps['cash7'] = sim.usd
                snaps['ar7'] = sum(c.sale - c.cut for c in sim.contracts if c.state == 'DELIVERED')
        if trade[0] == 'OFFER_BUY_02':
            check('기대 경로(화장품): 1일 현금·예약, 7일 현금·채권', (snaps['cash1'], snaps['res1'], snaps['cash7'], snaps['ar7']),
                  (42000, 10000, 32000, 288000))
        check(f'기대 경로 {trade[0]} 17일 USD', sim.usd, want17)
        check(f'기대 경로 {trade[0]} 17일 KRW(임차료 1회 + 급여 17일)', sim.krw, 10_000_000 - 450_000 - 160_000 * 17)

    # (5) P0-M2A5-06·09: 대기만 → 56일까지 완납, 57일 첫 미지급, 71일 실패
    sim = Scripted(ed, P, 42032026, {})
    sim.run()
    check('대기만: 첫 미지급일', sim.first_unpaid, 57)
    check('대기만: 실패(일·의무·금액)', (sim.failed['day'], sim.failed['obligation'], sim.failed['amt']),
          (71, 'WAGE-D057-EMP02', 80000))
    check('대기만: 71일 원화 미지급 합·건수·현금', (sim.unpaid('KRW'), sum(1 for o in sim.obl if o[4] is None), sim.krw),
          (2_770_000, 30, 60_000))
    # 행동 B: 70일 2,000 USD 환전 → 실패 없음, 85일 실패
    sim = Scripted(ed, P, 42032026, {70: lambda s: s.exchange(20)})
    sim.run()
    check('70일 2,000 USD 환전: 다음 실패일·기준 의무', (sim.failed['day'], sim.failed['obligation']), (85, 'WAGE-D071-EMP01'))
    # 행동 C: 70일 100 USD → 72일 실패
    sim = Scripted(ed, P, 42032026, {70: lambda s: s.exchange(1)})
    sim.run()
    check('70일 100 USD 환전: 실패일·기준 의무', (sim.failed['day'], sim.failed['obligation']), (72, 'WAGE-D058-EMP02'))
    # P0-M2A5-08: 1일 700 USD → 60일 400,900원, 61일 임차료 미지급, 75일 실패
    sim = Scripted(ed, P, 42032026, {1: lambda s: s.exchange(7)})
    sim.run(60)
    check('1일 700 USD 환전: 60일 마감 원화', sim.krw, 400_900)
    sim = Scripted(ed, P, 42032026, {1: lambda s: s.exchange(7)})
    sim.run(61)
    check('61일 마감 미지급 합(임차료 + 급여 2건 줄 섬)', (sim.unpaid('KRW'), sim.krw), (610_000, 400_900))
    sim = Scripted(ed, P, 42032026, {1: lambda s: s.exchange(7)})
    sim.run()
    check('1일 700 USD 환전: 실패일·기준 의무', (sim.failed['day'], sim.failed['obligation']), (75, 'RENT-D061'))
    # P0-M2A5-10: 22일 확장 → 54일까지 완납(55일 첫 미지급)
    sim = Scripted(ed, P, 42032026, {22: lambda s: (setattr(s, 'exp_eff', 23), setattr(s, 'krw', s.krw - 200000))})
    sim.run()
    check('22일 창고 확장: 첫 미지급일', sim.first_unpaid, 55)

    # (6) P0-M2A5-04: 창고 처리 한도 배분
    def d4(s):
        s.krw -= 550000
        s.staff['EMP04'] = dict(rate=3, wage=110000, from_day=5)

    def d8(s):
        _accept_fixed(s, 8, ('MKT-D008-APP-BUY', 'MKT-D008-APP-SELL'), 9, 'EMP01', qty=100)
        _accept_fixed(s, 8, ('MKT-D008-H1',), 16, 'EMP04')
        _accept_fixed(s, 8, ('MKT-D008-H3',), 16, 'EMP02')
    sim = Scripted(ed, P, 42032026, {4: d4, 8: d8})
    done_day = {}
    for d in range(1, 17):
        sim.day = d
        sim.commands(d)
        before = {c.id: c.state for c in sim.contracts}
        sim.step_rest(d)
        if d == 8:
            check('8일 배분 후 남은 pt(CT001·CT002·CT003)', tuple(c.rem for c in sim.contracts), (0, 9, 11))
            check('8일 USD 현금', sim.usd, 143000)
        for c in sim.contracts:
            if before.get(c.id) == 'PREP' and c.state in ('READY', 'TRANSIT'):
                done_day[c.id] = d
    check('준비 완료일 CT001·CT002·CT003', (done_day.get('CT001'), done_day.get('CT002'), done_day.get('CT003')), (8, 11, 14))

    text = '\n'.join(lines) + f"\n\n전체: {'통과' if ok_all else '실패 있음'}\n"
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'selfcheck.txt'), 'w', encoding='utf-8') as f:
        f.write(text)
    print(text)
    return 0 if ok_all else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--repo', default=REPO_DEFAULT)
    ap.add_argument('--jobs', type=int, default=min(4, os.cpu_count() or 1))
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('selfcheck')
    g = sub.add_parser('grid')
    g.add_argument('--params', default='SPEC_P')
    g.add_argument('--policies', choices=['search', 'full'], default='full')
    g.add_argument('--out')
    s = sub.add_parser('search')
    s.add_argument('--stage', type=int, choices=[1, 2], default=1)
    s.add_argument('--top', type=int, default=8)
    k = sub.add_parser('rank')
    k.add_argument('--stage', type=int, choices=[1, 2], default=1)
    k.add_argument('--n', type=int, default=40)
    v = sub.add_parser('validate')
    v.add_argument('--candidates', default='')
    v.add_argument('--first', type=int, default=1021)
    r = sub.add_parser('report')
    r.add_argument('--candidates', default='')
    a = ap.parse_args(argv)
    _ed(a.repo)
    if a.cmd == 'selfcheck':
        return cmd_selfcheck(a)
    if a.cmd == 'grid':
        return cmd_grid(a)
    if a.cmd == 'search':
        return cmd_search(a)
    if a.cmd == 'report':
        return cmd_report(a)
    if a.cmd == 'rank':
        return cmd_rank(a)
    if a.cmd == 'validate':
        return cmd_validate(a)


if __name__ == '__main__':
    sys.exit(main() or 0)
