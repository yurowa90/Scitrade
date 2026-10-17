# SPEC 개정 확인 실험: 모형(model/m2a5_model.py)과 CRITIC2 감액 변형(critic2/ana/exp.py)을 고치지 않고 하위 클래스로 감싼다.
# 바꾸는 것(개정 명세와 같게):
#   1. 지급: 기존 건너뛰기 규칙(engine.ts:1137-1157). 새 필수 지급은 현금이 있으면 바로 낸다(engine.ts:1108-1121).
#   2. 선복 계약 요금: 캠페인 안에 도착하는 적용 편만 받는다. 남은 요금 합계를 USD 예약으로 묶는다. 서명은 가용 ≥ 남은 합계.
#   3. 늦은 인도 감액: 정액 200 USD 1회(Q10 기본값).
# 사용: PYTHONDONTWRITEBYTECODE=1 python3 exp_spec.py table CAND_B [flat:20000]
#       PYTHONDONTWRITEBYTECODE=1 python3 exp_spec.py judge CAND_B [flat:20000]
import os, sys, statistics as st
from concurrent.futures import ProcessPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'model'))
sys.path.insert(0, os.path.join(HERE, '..', 'critic2', 'ana'))
import m2a5_model as M
import exp as X

SEEDS = list(range(1001, 1021))


class SpecSim(X.LateRule):
    late_mode = ('flat', 20000)
    reserve_space = True
    skip_rule = True
    window = None  # None: 남은 요금 전부. 정수 w: 오늘부터 w일 뒤까지 출항하는 적용 편만


    def covered(self, dest, from_day):
        first = self.space.get(dest)
        if first is None:
            return []
        transit = self.routes[dest]['transit']
        return [s for s in self.sailings[dest] if s >= max(first, from_day) and s + transit <= self.days]

    def reserved_usd(self):
        res = super().reserved_usd()
        if self.reserve_space:
            for dest in self.space:
                cov = self.covered(dest, self.day)
                if self.window is not None:
                    cov = [s for s in cov if s <= self.day + self.window]
                res += self.P['space_fee'] * len(cov)
        return res

    def pay_or_accrue(self, cur, amt, oid, contract=None):
        if not self.skip_rule:
            return super().pay_or_accrue(cur, amt, oid, contract)
        if cur == 'USD' and self.usd >= amt:
            self.usd -= amt
            return True
        if cur == 'KRW' and self.krw >= amt:
            self.krw -= amt
            return True
        self.add_obl(cur, amt, oid, contract)
        return False

    def settle(self):
        if not self.skip_rule:
            return super().settle()
        for o in self.obl:
            if o[4] is not None:
                continue
            cash = self.usd if o[1] == 'USD' else self.krw
            if cash < o[2]:
                continue  # 건너뛴다(엔진 engine.ts:1140)
            if o[1] == 'USD':
                self.usd -= o[2]
            else:
                self.krw -= o[2]
            o[4] = self.day
            if o[5] is not None:
                o[5].duty_paid = True

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
                transit = self.routes[dest]['transit']
                later = [s for s in self.sailings[dest] if s >= d + self.P['space_lead'] and s + transit <= self.days]
                need = self.P['space_fee'] * len(later) if (self.reserve_space and self.window is None) else self.P['space_fee']
                if later and self.avail_usd() >= need:
                    self.space[dest] = later[0]

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
            transit = self.routes[dest]['transit']
            if d >= first and d in self.sailings[dest] and d + transit <= self.days:
                self.m['space_fees'] += self.P['space_fee']
                self.pay_or_accrue('USD', self.P['space_fee'], f'SPACE-{self.routes[dest]["id"]}-D{d:03d}')
        for e in self.ed['emp_order'] + ['FREE2']:
            v = self.staff.get(e)
            if v and v['from_day'] <= d and v['wage'] > 0:
                self.m['wages'] += v['wage']
                self.pay_or_accrue('KRW', v['wage'], f'WAGE-D{d:03d}-{e}')


VARIANTS = {'spec': (True, True, None), 'window7': (True, True, 7), 'skip_only': (False, True, None), 'model': (False, False, None)}


def run_one(args):
    variant, late_mode, P, seed, pol = args
    sim = SpecSim(X.patched_ed(), P, seed, pol)
    sim.late_mode = late_mode
    sim.reserve_space, sim.skip_rule, sim.window = VARIANTS[variant]
    r = sim.run()
    r['usd_value'] = r['usd_net'] / 100  # 통화별 기준(B7): USD 순자산만
    return r


def runs(variant, late_mode, P, pols, seeds=SEEDS):
    tasks = [(variant, late_mode, P, s, p) for p in pols for s in seeds]
    with ProcessPoolExecutor(max_workers=4) as ex:
        rs = list(ex.map(run_one, tasks, chunksize=8))
    out = {}
    for r in rs:
        out.setdefault(r['policy'], {})[r['seed']] = r
    return out


def cell(out, k, ref, field='usd_value'):
    d = [out[k][s][field] - out[ref][s][field] for s in out[k]]
    fails = sum(1 for s in out[k] if out[k][s]['fail_day'])
    md, pos = st.median(d), sum(1 for x in d if x > 0)
    mark = ' ↑' if md >= 300 and pos >= 15 and fails <= 1 else (' ↓' if md <= -300 and pos <= 5 else '')
    return f'{md:+,.0f} ({pos}){mark}' + (f' 실패{fails}' if fails else ''), mark


def table(name, late_mode, variant):
    P = M.resolve_params(name)
    hires = [('EMP06', 8), ('EMP06', 29), ('EMP06', 30), ('EMP06', 31), ('EMP06', 50),
             ('EMP04', 8), ('EMP04', 29), ('EMP04', 30), ('EMP04', 31), ('EMP04', 50)]
    invs = ['noinv', 'S1', 'E7', 'SE', 'SE22']
    lab = lambda acc, h, inv: f"{acc}|fx7|{'+'.join(f'{e}@{d}' for e, d in h) or 'nohire'}|{inv}"
    pols = []
    for acc in ('N', 'A'):
        for inv in invs:
            pols.append(M.Policy(acc, 'fx7', (), M.INVEST[inv], label=lab(acc, (), inv)))
            for h in hires:
                pols.append(M.Policy(acc, 'fx7', (h,), M.INVEST[inv], label=lab(acc, (h,), inv)))
    out = runs(variant, late_mode, P, pols)
    print(f'## {name} · 변형 {variant} · 감액 {late_mode[0]} {late_mode[1] // 100} USD (USD 순자산 차이 중앙 (이득 시드))\n')
    base = lab('N', (), 'noinv')
    b = out[base]
    print(f"기준 N·noinv: 끝 USD 순자산 중앙 {st.median(r['usd_value'] for r in b.values()):,.0f}, 끝 KRW 중앙 {st.median(r['krw_net'] for r in b.values()):,.0f}원, 실패 {sum(1 for r in b.values() if r['fail_day'])}/20, "
          f"USD 미지급 일수 중앙 {st.median(r['usd_unpaid_days'] for r in b.values())}, 기여이익 중앙 {st.median(r['contrib'] for r in b.values()) / 100:,.0f} "
          f"(H {st.median(r['contrib_fwd_h'] for r in b.values()) / 100:,.0f}, 직접 무역 {st.median(r['contrib_trade'] for r in b.values()) / 100:,.0f})")
    a = cell(out, lab('A', (), 'noinv'), base)[0]
    print(f'A − N(고용·투자 없음): {a}\n')
    for inv in invs[1:]:
        print(f"투자만 {inv}: {cell(out, lab('N', (), inv), base)[0]}")
    for acc in ('N', 'A'):
        print(f'\n수락 {acc}\n')
        print('| 고용 | ' + ' | '.join(invs) + ' |')
        print('|---|' + '---|' * len(invs))
        g = bad = 0
        for h in hires:
            cs = []
            for inv in invs:
                c, mark = cell(out, lab(acc, (h,), inv), lab(acc, (), inv))
                if h[1] in (8, 30, 50) and inv in ('noinv', 'S1', 'E7', 'SE'):
                    g += mark == ' ↑'
                    bad += mark == ' ↓'
                cs.append(c)
            print(f'| {h[0]}@{h[1]} | ' + ' | '.join(cs) + ' |')
        print(f'\n24칸(8·30·50일 × noinv·S1·E7·SE) 뚜렷한 이득 {g} · 뚜렷한 손해 {bad}')
    # 시드별 1위(전 정책)
    keys = list(out)
    hire_best = sum(1 for s in SEEDS if max(keys, key=lambda k: out[k][s]['usd_value']).split('|')[2] != 'nohire')
    near = {k: sum(1 for s in SEEDS if max(out[j][s]['usd_value'] for j in keys) - out[k][s]['usd_value'] <= 300) for k in keys}
    top = max(near, key=near.get)
    print(f'\n시드별 1위가 고용 {hire_best}/20. 1위와 300 USD 안 시드가 가장 많은 정책 `{top}` ({near[top]}/20)\n')


if __name__ == '__main__':
    what, name = sys.argv[1], sys.argv[2]
    mode = ('flat', 20000)
    if len(sys.argv) > 3:
        k, v = sys.argv[3].split(':')
        mode = (k, int(v))
    variant = sys.argv[4] if len(sys.argv) > 4 else 'spec'
    X.patched_ed()
    if what == 'table':
        table(name, mode, variant)


def judge(name, late_mode, variant, first=1001):
    """정책 185개(M.full_policies) 전체로 판정 1~4(M.evaluate 그대로). 값은 분석값과 USD 순자산 두 가지로 잰다."""
    seeds = list(range(first, first + 20))
    M.SEEDS = seeds
    P = M.resolve_params(name)
    pols = M.full_policies()
    out = runs(variant, late_mode, P, pols, seeds)
    res = {k: list(v.values()) for k, v in out.items()}
    M._PCHECK['ok'] = M.quotes_ok(M._ed(), P)
    for label, field in (('분석값', 'value'), ('USD 순자산', 'usd_value')):
        rs = {k: [dict(r, value=r[field]) for r in v] for k, v in res.items()}
        ev = M.evaluate(rs)
        krw_bad = sum(1 for r in res['N|fx7|nohire|noinv'] if r['krw_net'] < 0)
        print(f"{name} · {variant} · 감액 {late_mode[1] // 100} · 시드 {first}~ · 값={label}: 판정 {ev['c1']:d}{ev['c2']:d}{ev['c3']:d}{ev['c4']:d}, "
              f"기준 회사 {ev['v0']:,.0f}, 이득 {len(ev['good'])}칸 {ev['good']}, 손해 {len(ev['bad'])}칸, 가장 강한 정책 `{ev['robust']}` ({ev['robust_near']}/20), "
              f"시드별 1위 고용 {ev['hire_win']}·비고용 {ev['nohire_win']}, 환전 없음 실패 {ev['nofx_fail']}/20, 기준 회사 KRW 순자산 음수 {krw_bad}/20")


if __name__ == '__main__' and sys.argv[1] == 'judge':
    mode = ('flat', 20000)
    if len(sys.argv) > 3:
        k, v = sys.argv[3].split(':')
        mode = (k, int(v))
    variant = sys.argv[4] if len(sys.argv) > 4 else 'window7'
    first = int(sys.argv[5]) if len(sys.argv) > 5 else 1001
    judge(sys.argv[2], mode, variant, first)
