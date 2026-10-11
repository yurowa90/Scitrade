# M2a-5 규칙 참조 모형(엔진 아님). SPEC.md의 하루 순서·창고·환전·고정비·지급 순서·D04를 따른다.
# 정책은 '보통 수준의 플레이어'를 흉내 낸 탐욕 정책이다. 결과는 사전 조정용 추정이며, 엔진 구현 뒤
# 비교 실행기(src/engine/sim, 20시드)로 다시 잰다. 금액: USD는 cents, KRW는 원 정수.
import math
from market import GOODS, generate_batches, DEFAULT_PARAMS, half_up_div

ROUTES = {'HAIPHONG': dict(id='ROUTE01', transit=5, fee=20000, cap_l=30000, cap_g=5_000_000),
          'SHANGHAI': dict(id='ROUTE02', transit=4, fee=18000, cap_l=30000, cap_g=5_000_000)}
SAILING_DAYS = list(range(2, 91, 7))  # 2, 9, ..., 86
STAFF = {'EMP01': (2, 80000), 'EMP02': (2, 80000), 'EMP03': (3, 110000), 'EMP04': (3, 110000),
         'EMP05': (2, 90000), 'EMP06': (2, 90000)}

BASE = dict(
    days=90, start_usd=300000, start_krw=10_000_000,
    duty_bp=500, late_cut=5000, cancel_fee=5000, customs_days=0,
    rent=450000, rent_days=(1, 31, 61),
    store_l=40000, handle_pt=6,
    exp_store_l=20000, exp_handle_pt=3, exp_setup=200000, exp_rent=250000,
    space_l=10000, space_g=1_500_000, space_fee=6000, space_lead=7,
    fx_base=1300, fx_spread_bp=100, fx_lot_cents=10000,
    grace_warn=0, grace_danger=7, grace_fail=14,
    prep_trade_base=2, prep_trade_per_lot=1,
    fwd_l_per_pt=6000, handling_l_per_pt=1000, fwd_min_pt=2, legacy_fwd_pt=None,
    signing_days=5,
)


def fx_rates(p):
    spread = half_up_div(p['fx_base'] * p['fx_spread_bp'], 10000)
    return p['fx_base'] - spread, p['fx_base'] + spread  # 1287, 1313


def trade_prep(p, good, qty):
    lots = qty // GOODS[good]['base_lot']
    return p['prep_trade_base'] + (lots - 1) * p['prep_trade_per_lot']


def fwd_prep(p, vol_l, cls='STANDARD'):
    if p.get('legacy_fwd_pt'):
        return p['legacy_fwd_pt']
    per = p['fwd_l_per_pt'] if cls == 'STANDARD' else p['handling_l_per_pt']
    return max(p['fwd_min_pt'], -(-vol_l // per))


class Game:
    def __init__(self, seed, variant, p=BASE, mparams=DEFAULT_PARAMS):
        self.p = dict(p)
        self.p.update(variant.get('params', {}))
        self.mp = dict(mparams)
        self.mp.update(variant.get('mparams', {}))
        self.v = variant
        self.seed = seed
        self.batches = generate_batches(seed, self.mp)
        self.offers = {}
        for bt in self.batches:
            for o in bt['offers']:
                o = dict(o)
                o['batch_day'] = bt['day']
                o['valid'] = o['valid'] if bt['k'] > 0 else 3
                o['status'] = 'OPEN'
                self.offers[o['id']] = o
        self.day = 1
        self.usd = p['start_usd']
        self.krw = p['start_krw']
        self.obl = []  # dict(id, cur, amt, day, paid)
        self.contracts = []
        self.emps = {'EMP01': dict(rate=2, wage=80000, from_day=1), 'EMP02': dict(rate=2, wage=80000, from_day=1)}
        self.blocked = {}  # emp -> set(days)
        self.expanded_from = None
        self.space = {}  # dest -> first covered sailing day
        self.booked = {}  # (dest, sailing) -> [l, g]
        self.fx_usd = 0
        self.fx_spread_krw = 0
        self.failed = None
        self.first_unpaid = None
        self.log = []
        self.reject = {'storage': 0, 'sailing': 0, 'staff': 0, 'funds': 0}
        self.handle_used = {}
        self.wait_days = 0
        self.krw_spent = dict(wage=0, rent=0, signing=0, expansion=0)
        self.usd_fixed = 0
        self.rate_buy, self.rate_sell = fx_rates(self.p)
        # 계획된 투자
        for emp, hday in variant.get('hires', []):
            ed = self.blocked.setdefault('EMP02', set())
            for t in (hday - 3, hday - 2, hday - 1):
                ed.add(t)

    # ── 공통 계산 ──
    def store_cap(self, d):
        return self.p['store_l'] + (self.p['exp_store_l'] if self.expanded_from is not None and self.expanded_from <= d else 0)

    def handle_cap(self, d):
        return self.p['handle_pt'] + (self.p['exp_handle_pt'] if self.expanded_from is not None and self.expanded_from <= d else 0)

    def occupancy(self):
        return sum(c['vol'] for c in self.contracts if c['state'] in ('PREP', 'READY'))

    def sail_cap(self, dest, s):
        r = ROUTES[dest]
        extra = self.space.get(dest)
        if extra is not None and s >= extra:
            return r['cap_l'] + self.p['space_l'], r['cap_g'] + self.p['space_g']
        return r['cap_l'], r['cap_g']

    def reserved_usd(self):
        res = 0
        for c in self.contracts:
            if c['kind'] == 'T' and c['state'] in ('PREP', 'READY', 'TRANSIT'):
                res += c['duty']
            if c['state'] in ('PREP', 'READY') and c['sailing'] is None:
                res += ROUTES[c['dest']]['fee']
        return res

    def unpaid(self, cur):
        return sum(o['amt'] for o in self.obl if o['cur'] == cur and o['paid'] is None)

    def avail_usd(self):
        return self.usd - self.reserved_usd() - self.unpaid('USD')

    def avail_krw(self):
        return self.krw - self.unpaid('KRW')

    def emp_rate(self, e):
        return self.emps[e]['rate']

    def working(self, e, d):
        return self.emps[e]['from_day'] <= d and d not in self.blocked.get(e, set())

    # ── 준비 업무 예측(SPEC 7.4: 지금 배정 그대로 + 미배정은 빈 직원에게 우선순위대로) ──
    def project(self, extra=None, start=None):
        d0 = self.day if start is None else start
        tasks = []
        for c in self.contracts:
            if c['state'] == 'PREP':
                tasks.append(dict(cid=c['id'], rem=c['prep'] - c['done'], emp=c['emp'], dep=c['sailing'], dl=c['dl']))
        if extra:
            tasks.append(dict(cid=extra['id'], rem=extra['prep'], emp=None, dep=extra['sailing'], dl=extra['dl']))
        if not tasks:
            return {}
        key = lambda t: (t['dep'] if t['dep'] is not None else 10**6, t['dl'], t['cid'])
        busy = {t['emp'] for t in tasks if t['emp']}
        horizon = max([t['dep'] or t['dl'] for t in tasks] + [d0]) + 1
        done = {}
        for t in range(d0, min(horizon, self.p['days']) + 1):
            free = sorted([e for e in self.emps if self.working(e, t) and e not in busy],
                          key=lambda e: (-self.emp_rate(e), e))
            for task in sorted([x for x in tasks if x['emp'] is None and x['cid'] not in done], key=key):
                if not free:
                    break
                e = free.pop(0)
                task['emp'] = e
                busy.add(e)
            cap = self.handle_cap(t)
            for task in sorted([x for x in tasks if x['emp'] and x['cid'] not in done], key=key):
                if not self.working(task['emp'], t):
                    continue
                g = min(self.emp_rate(task['emp']), task['rem'], cap)
                task['rem'] -= g
                cap -= g
                if task['rem'] == 0:
                    done[task['cid']] = t
                    busy.discard(task['emp'])
        return done

    def feasible_staff(self, extra):
        done = self.project(extra)
        for c in self.contracts:
            if c['state'] == 'PREP' and c['sailing'] is not None:
                if done.get(c['id'], 10**6) > c['sailing']:
                    return False
        return done.get(extra['id'], 10**6) <= extra['sailing']

    # ── 지급 ──
    def add_obl(self, cur, amt, oid):
        self.obl.append(dict(id=oid, cur=cur, amt=amt, day=self.day, paid=None))
        if self.first_unpaid is None:
            self.first_unpaid = self.day

    def pay_or_accrue(self, cur, amt, oid):
        """SPEC 9.2: 같은 통화의 앞선 미지급이 남아 있으면 새 필수 지급은 줄을 선다."""
        if cur == 'USD':
            if self.unpaid('USD') == 0 and self.usd >= amt:
                self.usd -= amt
                return True
        else:
            if self.unpaid('KRW') == 0 and self.krw >= amt:
                self.krw -= amt
                return True
        self.add_obl(cur, amt, oid)
        return False

    def settle(self):
        for cur in ('USD', 'KRW'):
            for o in sorted([o for o in self.obl if o['cur'] == cur and o['paid'] is None], key=lambda o: (o['day'], o['id'])):
                cash = self.usd if cur == 'USD' else self.krw
                if cash < o['amt']:
                    break
                if cur == 'USD':
                    self.usd -= o['amt']
                else:
                    self.krw -= o['amt']
                o['paid'] = self.day
                if o['id'].startswith('DUTY-'):
                    for c in self.contracts:
                        if c['id'] == o['id'][5:]:
                            c['duty_paid'] = True

    # ── 정책 ──
    def krw_need(self, d, look):
        need = self.unpaid('KRW')
        for t in range(d, min(self.p['days'], d + look - 1) + 1):
            for e, info in self.emps.items():
                if info['from_day'] <= t:
                    need += info['wage']
            for emp, hday in self.v.get('hires', []):
                if hday < t and emp not in self.emps:
                    need += STAFF[emp][1]
                if hday == t and emp not in self.emps:
                    need += STAFF[emp][1] * self.p['signing_days']
            if t in self.p['rent_days']:
                need += self.p['rent'] + (self.p['exp_rent'] if self.expanded_from is not None and self.expanded_from <= t else 0)
            ex = self.v.get('expand_day')
            if ex == t and self.expanded_from is None:
                need += self.p['exp_setup']
        return need

    def do_exchange(self, d):
        if not self.v.get('fx', True):
            return
        look = self.v.get('fx_look', 7)
        short = self.krw_need(d, look) - self.krw
        if short <= 0:
            return
        lots = -(-short // (self.rate_buy * 100))
        lots = min(lots, max(0, self.avail_usd()) // self.p['fx_lot_cents'])
        if lots <= 0:
            return
        usd = lots * self.p['fx_lot_cents']
        krw = lots * 100 * self.rate_buy
        self.usd -= usd
        self.krw += krw
        self.fx_usd += usd
        self.fx_spread_krw += lots * 100 * (self.p['fx_base'] - self.rate_buy)

    def candidates(self, d):
        out = []
        open_ = [o for o in self.offers.values() if o['status'] == 'OPEN' and o['batch_day'] <= d <= o['valid']]
        buys = [o for o in open_ if o['kind'] == 'supplier']
        sells = [o for o in open_ if o['kind'] == 'customer']
        for b in buys:
            for s in sells:
                if s['good'] != b['good'] or s['batch_day'] != b['batch_day']:
                    continue
                g = b['good']
                base = GOODS[g]['base_lot']
                mx = min(b['max_qty'], s['max_qty'])
                for qty in range(mx, 0, -base):
                    purchase = b['unit'] * qty
                    sale = s['unit'] * qty
                    duty = half_up_div(purchase * self.p['duty_bp'], 10000)
                    fee = ROUTES[s['city']]['fee']
                    out.append(dict(kind='T', offers=[b['id'], s['id']], good=g, qty=qty, dest=s['city'],
                                    purchase=purchase, sale=sale, duty=duty, fee=fee, dl=s['dl'], pay=s['pay'],
                                    vol=qty * GOODS[g]['vol_l'], mass=int(qty * GOODS[g]['kg'] * 1000),
                                    prep=trade_prep(self.p, g, qty), contrib=sale - purchase - duty - fee))
        for o in open_:
            if o['kind'] != 'forwarding':
                continue
            fee = ROUTES[o['dest']]['fee']
            vol = o['qty'] * GOODS[o['good']]['vol_l']
            out.append(dict(kind='F', offers=[o['id']], good=o['good'], qty=o['qty'], dest=o['dest'], purchase=0,
                            sale=o['fee'], duty=0, fee=fee, dl=o['dl'], pay=o['pay'], vol=vol,
                            mass=int(o['qty'] * GOODS[o['good']]['kg'] * 1000), prep=fwd_prep(self.p, vol, o.get('cls', 'STANDARD')),
                            contrib=o['fee'] - fee))
        out.sort(key=lambda c: (-c['contrib'], c['offers'][0], -c['qty']))
        return out

    def try_accept(self, d, c):
        if any(self.offers[i]['status'] != 'OPEN' for i in c['offers']):
            return False
        need = c['purchase'] + c['fee'] + c['duty']
        if self.avail_usd() < need:
            self.reject['funds'] += 1
            return False
        if self.occupancy() + c['vol'] > self.store_cap(d):
            self.reject['storage'] += 1
            return False
        reasons = set()
        for s in [x for x in SAILING_DAYS if x > d][:3]:
            arr = s + ROUTES[c['dest']]['transit']
            if arr > self.p['days']:
                break
            late = arr + self.p['customs_days'] > c['dl']
            if late and not self.v.get('allow_late', False):
                continue
            val = c['contrib'] - (self.p['late_cut'] if late else 0)
            if val <= 0:
                continue
            l, g = self.booked.get((c['dest'], s), [0, 0])
            cl, cg = self.sail_cap(c['dest'], s)
            if l + c['vol'] > cl or g + c['mass'] > cg:
                reasons.add('sailing')
                continue
            cid = f'CT{len(self.contracts) + 1:03d}'
            extra = dict(id=cid, prep=c['prep'], sailing=s, dl=c['dl'])
            if not self.feasible_staff(extra):
                reasons.add('staff')
                continue
            # 수락: 매입·운임 지급, 관세 예약, 예약
            self.usd -= c['purchase'] + c['fee']
            self.booked.setdefault((c['dest'], s), [0, 0])
            self.booked[(c['dest'], s)][0] += c['vol']
            self.booked[(c['dest'], s)][1] += c['mass']
            for i in c['offers']:
                self.offers[i]['status'] = 'ACCEPTED'
            con = dict(c)
            con.update(id=cid, state='PREP', done=0, emp=None, sailing=s, accepted=d, late_planned=late,
                       duty_paid=(c['duty'] == 0), arrival=None, delivered=None, cut=0)
            self.contracts.append(con)
            self.assign(d)
            return True
        for r in reasons:
            self.reject[r] += 1
        return False

    def assign(self, d):
        busy = {c['emp'] for c in self.contracts if c['state'] == 'PREP' and c['emp']}
        free = sorted([e for e in self.emps if self.working(e, d) and e not in busy], key=lambda e: (-self.emp_rate(e), e))
        key = lambda c: (c['sailing'] if c['sailing'] is not None else 10**6, c['dl'], c['id'])
        for c in sorted([c for c in self.contracts if c['state'] == 'PREP' and c['emp'] is None], key=key):
            if not free:
                break
            c['emp'] = free.pop(0)

    def commands(self, d):
        # 고용(조사·의뢰는 EMP02의 H-3~H-1일을 막는 것으로 단순화)
        for emp, hday in self.v.get('hires', []):
            if hday == d and emp not in self.emps:
                rate, wage = STAFF[emp]
                fee = wage * self.p['signing_days']
                self.do_exchange(d)
                if self.avail_krw() >= fee:
                    self.krw -= fee
                    self.krw_spent['signing'] += fee
                    self.emps[emp] = dict(rate=rate, wage=wage, from_day=d + 1)
        ex = self.v.get('expand_day')
        if ex == d and self.expanded_from is None:
            self.do_exchange(d)
            if self.avail_krw() >= self.p['exp_setup']:
                self.krw -= self.p['exp_setup']
                self.krw_spent['expansion'] += self.p['exp_setup']
                self.expanded_from = d + 1
        for dest, sday in self.v.get('space', []):
            if sday == d and dest not in self.space:
                first = min(s for s in SAILING_DAYS if s >= d + self.p['space_lead'])
                self.space[dest] = first
        self.do_exchange(d)
        self.assign(d)
        # 놓친 편 다시 예약
        for c in self.contracts:
            if c['state'] in ('PREP', 'READY') and c['sailing'] is None:
                for s in [x for x in SAILING_DAYS if x > d][:3]:
                    l, g = self.booked.get((c['dest'], s), [0, 0])
                    cl, cg = self.sail_cap(c['dest'], s)
                    if l + c['vol'] <= cl and g + c['mass'] <= cg and self.avail_usd() + c['fee'] >= c['fee']:
                        c['sailing'] = s
                        self.usd -= c['fee']
                        self.booked.setdefault((c['dest'], s), [0, 0])
                        self.booked[(c['dest'], s)][0] += c['vol']
                        self.booked[(c['dest'], s)][1] += c['mass']
                        break
        if self.v.get('accept', True):
            for c in self.candidates(d):
                self.try_accept(d, c)

    # ── 하루 처리 ──
    def progress(self, d):
        cap = self.handle_cap(d)
        used = 0
        key = lambda c: (c['sailing'] if c['sailing'] is not None else 10**6, c['dl'], c['id'])
        for c in sorted([c for c in self.contracts if c['state'] == 'PREP' and c['emp']], key=key):
            if not self.working(c['emp'], d):
                continue
            want = min(self.emp_rate(c['emp']), c['prep'] - c['done'])
            g = min(want, cap - used)
            if g < want:
                self.wait_days += 1
            c['done'] += g
            used += g
            if c['done'] >= c['prep']:
                c['state'] = 'READY'
                c['emp'] = None
        self.handle_used[d] = used

    def departures_arrivals(self, d):
        for c in self.contracts:
            if c['sailing'] == d and c['state'] in ('PREP', 'READY'):
                if c['state'] == 'READY':
                    c['state'] = 'TRANSIT'
                    c['arrival'] = d + ROUTES[c['dest']]['transit']
                else:
                    # 출항 불참: 운임 − 취소비 환급, 다시 예약
                    self.usd += c['fee'] - self.p['cancel_fee']
                    self.booked[(c['dest'], d)][0] -= c['vol']
                    self.booked[(c['dest'], d)][1] -= c['mass']
                    c['sailing'] = None
                    c['missed'] = c.get('missed', 0) + 1
                    c['contrib'] -= self.p['cancel_fee']
        for c in self.contracts:
            if c['state'] == 'TRANSIT' and c['arrival'] == d:
                c['state'] = 'ARRIVED'
                if c['kind'] == 'T' and c['duty'] > 0:
                    c['duty_paid'] = self.pay_or_accrue('USD', c['duty'], 'DUTY-' + c['id'])

    def deliveries(self, d):
        for c in self.contracts:
            if c['state'] == 'ARRIVED' and c['arrival'] + self.p['customs_days'] <= d and c['duty_paid']:
                c['state'] = 'DELIVERED'
                c['delivered'] = d
                if d > c['dl']:
                    c['cut'] = self.p['late_cut']
                c['due'] = max(c['pay'], d)

    def finance(self, d):
        for c in self.contracts:
            if c['state'] == 'DELIVERED' and c['due'] <= d:
                self.usd += c['sale'] - c['cut']
                c['state'] = 'PAID'
        self.settle()
        if d in self.p['rent_days']:
            amt = self.p['rent'] + (self.p['exp_rent'] if self.expanded_from is not None and self.expanded_from <= d else 0)
            self.krw_spent['rent'] += amt
            self.pay_or_accrue('KRW', amt, f'RENT-D{d:03d}')
        for dest, first in self.space.items():
            if d in SAILING_DAYS and d >= first:
                self.usd_fixed += self.p['space_fee']
                self.pay_or_accrue('USD', self.p['space_fee'], f'SPACE-{dest}-D{d:03d}')
        for e, info in sorted(self.emps.items()):
            if info['from_day'] <= d:
                self.krw_spent['wage'] += info['wage']
                self.pay_or_accrue('KRW', info['wage'], f'WAGE-D{d:03d}-{e}')

    def d04(self, d):
        old = [o for o in self.obl if o['paid'] is None]
        if not old:
            return
        o = min(old, key=lambda o: (o['day'], o['cur'], o['id']))
        if o['day'] + self.p['grace_fail'] <= d:
            self.failed = dict(day=d, obligation=o['id'], cur=o['cur'], amt=o['amt'], incurred=o['day'])

    def run(self):
        for d in range(1, self.p['days'] + 1):
            self.day = d
            self.commands(d)
            self.progress(d)
            self.departures_arrivals(d)
            self.deliveries(d)
            self.finance(d)
            self.d04(d)
            if self.failed:
                break
            for o in self.offers.values():
                if o['status'] == 'OPEN' and o['valid'] < d + 1:
                    o['status'] = 'EXPIRED'
        return self.result()

    def result(self):
        done = [c for c in self.contracts if c['state'] in ('DELIVERED', 'PAID')]
        contrib = sum(c['contrib'] - c['cut'] for c in done)
        ar = sum(c['sale'] - c['cut'] for c in self.contracts if c['state'] == 'DELIVERED')
        return dict(
            seed=self.seed, failed=self.failed, first_unpaid=self.first_unpaid,
            usd=self.usd, usd_ar=ar, usd_unpaid=self.unpaid('USD'), krw=self.krw, krw_unpaid=self.unpaid('KRW'),
            contrib=contrib, n=len(self.contracts), n_fwd=sum(1 for c in self.contracts if c['kind'] == 'F'),
            n_trade=sum(1 for c in self.contracts if c['kind'] == 'T'), late=sum(1 for c in done if c['cut']),
            fx_usd=self.fx_usd, reject=dict(self.reject), wait=self.wait_days,
            undelivered=sum(1 for c in self.contracts if c['state'] not in ('DELIVERED', 'PAID')),
            krw_spent=dict(self.krw_spent), usd_fixed=self.usd_fixed,
            handle_util=sum(self.handle_used.values()),
        )


def net_value(r, rate_sell=1313):
    """분석 전용 값(게임에 보이지 않는다): USD 순자산 + KRW 순자산 ÷ 1,313. 통화 합산은 화면·결산에 쓰지 않는다."""
    usd = r['usd'] + r['usd_ar'] - r['usd_unpaid']
    krw = r['krw'] - r['krw_unpaid']
    return usd / 100 + krw / rate_sell
