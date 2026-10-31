# CRITIC2 실험: 모형(m2a5_model.py)을 고치지 않고 하위 클래스·자료 덧붙임으로 변형을 잰다.
# 사용: python3 exp.py <실험 이름> [후보,...]
#   e1  : 직원 종류 분리(처리량 2·3pt × 일급 90k·110k) — 3pt 직원이 2pt보다 못한 이유가 일정 짜기 탓인지
#   e2  : 영입 절차 비용 없음(계획일에 바로 고용) — 조사·의뢰 동안 물보리를 묶는 비용 크기
#   e5  : 늦은 인도 감액 규칙 변형(정액 50·200 USD, 하루 50 USD) — 수락 N·A 고용 표
import os, sys, statistics as st
from concurrent.futures import ProcessPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'model'))
import m2a5_model as M

SEEDS = list(range(1001, 1021))
EXTRA_EMP = {
    'X2_90': dict(rate=2, wage=90000), 'X3_90': dict(rate=3, wage=90000),
    'X2_110': dict(rate=2, wage=110000), 'X3_110': dict(rate=3, wage=110000),
}


def patched_ed():
    ed = M._ed()
    if 'X2_90' not in ed['employees']:
        for k, v in EXTRA_EMP.items():
            ed['employees'][k] = dict(id=k, name=k, rate=v['rate'], wage=v['wage'])
            ed['emp_order'].append(k)
            ed['venue_of'][k] = 'VEN_PORT'
    return ed


class NoOverhead(M.Sim):
    """영입 조사·의뢰 없이 계획일에 계약금을 내고 다음 날부터 근무(물보리를 묶지 않음)."""

    def block_window(self, d):
        return None

    def recruit_busy(self, d):
        return False

    def recruit_progress(self, d):
        return False

    def recruit_step(self, d):
        for r in self.recruits:
            if r['stage'] == 'HIRED':
                continue
            if d >= r['plan']:
                e = self.ed['employees'][r['emp']]
                fee = e['wage'] * self.ed['signing_days']
                if self.avail_krw() >= fee:
                    self.krw -= fee
                    self.m['signing'] += fee
                    self.staff[r['emp']] = dict(rate=e['rate'], wage=e['wage'], from_day=d + 1)
                    r['stage'], r['hired'] = 'HIRED', d
            return


class LateRule(M.Sim):
    """늦은 인도 감액: mode=('flat', cents) 또는 ('perday', cents/일)."""
    late_mode = ('flat', 5000)

    def _cut(self, late_days):
        kind, v = self.late_mode
        if late_days <= 0:
            return 0
        return v if kind == 'flat' else v * late_days

    def try_accept(self, d, o):
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
            if late and o['contrib'] - self._cut(arr - o['dl']) < rule['min_contrib']:
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

    def deliveries(self, d):
        for c in self.contracts:
            if c.state == 'ARR' and c.arrival + self.ed['customs_days'] <= d and c.duty_paid:
                c.state = 'DELIVERED'
                c.delivered = d
                if d > c.dl:
                    c.cut = self._cut(d - c.dl)
                    self.m['late'] += 1
                c.due = max(c.pay, d)


def run_job(args):
    cls_name, late_mode, P, seed, accept, fx, hires, inv = args
    ed = patched_ed()
    cls = {'base': M.Sim, 'noover': NoOverhead, 'late': LateRule}[cls_name]
    pol = M.Policy(accept, fx, hires, M.INVEST[inv])
    sim = cls(ed, P, seed, pol)
    if cls_name == 'late':
        sim.late_mode = late_mode
    r = sim.run()
    r['key'] = (accept, fx, '+'.join(f'{e}@{d}' for e, d in hires) or 'nohire', inv)
    return r


def run_set(cls_name, P, combos, late_mode=None, seeds=SEEDS, jobs=4):
    tasks = [(cls_name, late_mode, P, s, a, fx, h, inv) for (a, fx, h, inv) in combos for s in seeds]
    with ProcessPoolExecutor(max_workers=jobs) as ex:
        res = list(ex.map(run_job, tasks, chunksize=8))
    out = {}
    for r in res:
        out.setdefault(r['key'], {})[r['seed']] = r
    return out


def delta(out, k, ref):
    d = [out[k][s]['value'] - out[ref][s]['value'] for s in out[k]]
    fails = sum(1 for s in out[k] if out[k][s]['fail_day'])
    return st.median(d), sum(1 for x in d if x > 0), fails


def cell(t):
    md, pos, f = t
    mark = ' ↑' if md >= 300 and pos >= 15 and f <= 1 else (' ↓' if md <= -300 and pos <= 5 else '')
    return f'{md:+,.0f} ({pos}){mark}' + (f' 실패{f}' if f else '')


def e1(names):
    print('# E1 직원 종류 분리 (수락 N·환전 fx7, 30일 고용, 같은 투자의 고용 없음 대비)')
    emps = [('EMP06', '2pt·90k(바름)'), ('X3_90', '3pt·90k(가상)'), ('X2_110', '2pt·110k(가상)'), ('EMP04', '3pt·110k(현돌)')]
    for name in names:
        P = M.resolve_params(name)
        combos = []
        for inv in ['noinv', 'E7', 'SE']:
            combos.append(('N', 'fx7', (), inv))
            for e, _ in emps:
                combos.append(('N', 'fx7', ((e, 30),), inv))
        out = run_set('base', P, combos)
        print(f'\n## {name}\n')
        print('| 직원 | 투자 없음 | E7 | SE | 기여이익 중앙 증가(noinv/E7) |')
        print('|---|---|---|---|---|')
        for e, lab in emps:
            cells = []
            for inv in ['noinv', 'E7', 'SE']:
                cells.append(cell(delta(out, ('N', 'fx7', f'{e}@30', inv), ('N', 'fx7', 'nohire', inv))))
            cg = []
            for inv in ['noinv', 'E7']:
                k, ref = ('N', 'fx7', f'{e}@30', inv), ('N', 'fx7', 'nohire', inv)
                cg.append(st.median([(out[k][s]['contrib'] - out[ref][s]['contrib']) / 100 for s in SEEDS]))
            print(f'| {lab} | ' + ' | '.join(cells) + f' | {cg[0]:+,.0f} / {cg[1]:+,.0f} |')


def e2(names):
    print('# E2 영입 절차 비용 (수락 N·fx7, 같은 투자의 고용 없음 대비). 왼쪽 = 모형 그대로, 오른쪽 = 조사·의뢰 없이 계획일 고용')
    for name in names:
        P = M.resolve_params(name)
        combos = [('N', 'fx7', (), inv) for inv in ['noinv', 'SE']]
        for inv in ['noinv', 'SE']:
            for e in ['EMP06', 'EMP04']:
                for d in [8, 30, 50]:
                    combos.append(('N', 'fx7', ((e, d),), inv))
        a = run_set('base', P, combos)
        b = run_set('noover', P, combos)
        print(f'\n## {name}\n')
        print('| 고용 | 투자 없음: 모형 → 절차 없음 | SE: 모형 → 절차 없음 |')
        print('|---|---|---|')
        for e in ['EMP06', 'EMP04']:
            for d in [8, 30, 50]:
                cells = []
                for inv in ['noinv', 'SE']:
                    k, ref = ('N', 'fx7', f'{e}@{d}', inv), ('N', 'fx7', 'nohire', inv)
                    cells.append(f'{cell(delta(a, k, ref))} → {cell(delta(b, k, ref))}')
                print(f'| {e}@{d} | ' + ' | '.join(cells) + ' |')


def e5(names, modes):
    print('# E5 늦은 인도 감액 규칙과 고용 판정 (환전 fx7). 칸 = 같은 수락·투자의 고용 없음 대비 중앙 (이득 시드)')
    hires = [('EMP06', 8), ('EMP06', 30), ('EMP06', 50), ('EMP04', 8), ('EMP04', 30), ('EMP04', 50)]
    invs = ['noinv', 'S1', 'E7', 'SE']
    for name in names:
        P = M.resolve_params(name)
        for mode in modes:
            combos = []
            for acc in ['N', 'A']:
                for inv in invs:
                    combos.append((acc, 'fx7', (), inv))
                    for h in hires:
                        combos.append((acc, 'fx7', (h,), inv))
            out = run_set('late', P, combos, late_mode=mode)
            base_n = ('N', 'fx7', 'nohire', 'noinv')
            print(f'\n## {name} · 감액 {mode[0]} {mode[1] / 100:.0f} USD\n')
            an = delta(out, ('A', 'fx7', 'nohire', 'noinv'), base_n)
            v0 = st.median([out[base_n][s]['value'] for s in SEEDS])
            lateA = st.median([out[('A', 'fx7', 'nohire', 'noinv')][s]['late'] for s in SEEDS])
            print(f'N 기준 분석값 중앙 {v0:,.0f}. A(늦은 인도 받음) − N: {cell(an)}, A 늦은 인도 중앙 {lateA}건\n')
            for acc in ['N', 'A']:
                print(f'수락 {acc}\n')
                print('| 고용 | ' + ' | '.join(invs) + ' |')
                print('|---|' + '---|' * len(invs))
                g = b = 0
                for e, d in hires:
                    cells = []
                    for inv in invs:
                        c = cell(delta(out, (acc, 'fx7', f'{e}@{d}', inv), (acc, 'fx7', 'nohire', inv)))
                        g += '↑' in c
                        b += '↓' in c
                        cells.append(c)
                    print(f'| {e}@{d} | ' + ' | '.join(cells) + ' |')
                # 시드별 1위(이 수락 규칙 안에서)
                keys = [k for k in out if k[0] == acc]
                hire_best = sum(1 for s in SEEDS if max(keys, key=lambda k: out[k][s]['value'])[2] != 'nohire')
                print(f'\n뚜렷한 이득 {g}칸 · 뚜렷한 손해 {b}칸 · 시드별 1위가 고용인 시드 {hire_best}/20\n')
            # 두 수락 규칙을 합친 시드별 1위
            keys = list(out)
            win_acc = {'N': 0, 'A': 0}
            win_hire = 0
            for s in SEEDS:
                k = max(keys, key=lambda k: out[k][s]['value'])
                win_acc[k[0]] += 1
                win_hire += k[2] != 'nohire'
            print(f'N·A 합친 시드별 1위: 수락 {win_acc}, 고용 {win_hire}/20\n')


if __name__ == '__main__':
    which = sys.argv[1]
    names = (sys.argv[2] if len(sys.argv) > 2 else 'CAND_A,CAND_B,CAND_C').split(',')
    patched_ed()
    if which == 'e1':
        e1(names)
    elif which == 'e2':
        e2(names)
    elif which == 'e5':
        modes = [('flat', 5000), ('flat', 20000), ('perday', 5000)]
        if len(sys.argv) > 3:
            modes = [tuple((x.split(':')[0], int(x.split(':')[1]))) for x in sys.argv[3].split(',')]
        e5(names, modes)


class PreScouted(M.Sim):
    """평택 항구 조사를 3일(일감이 없는 날)에 미리 했다고 본다: 의뢰 3pt(2일)만 고용일 직전에 물보리를 묶는다."""

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.scouted = {'VEN_PORT'}


def run_job2(args):
    cls_name, P, seed, accept, fx, hires, inv = args
    ed = patched_ed()
    cls = {'base': M.Sim, 'noover': NoOverhead, 'prescout': PreScouted}[cls_name]
    sim = cls(ed, P, seed, M.Policy(accept, fx, hires, M.INVEST[inv]))
    r = sim.run()
    r['key'] = (accept, fx, '+'.join(f'{e}@{d}' for e, d in hires) or 'nohire', inv)
    return r


def run_set2(cls_name, P, combos, seeds=SEEDS, jobs=4):
    tasks = [(cls_name, P, s, a, fx, h, inv) for (a, fx, h, inv) in combos for s in seeds]
    with ProcessPoolExecutor(max_workers=jobs) as ex:
        res = list(ex.map(run_job2, tasks, chunksize=8))
    out = {}
    for r in res:
        out.setdefault(r['key'], {})[r['seed']] = r
    return out


def e2b(names):
    """영입 절차 처리 방식별 판정 2(24칸)."""
    print('# E2b 영입 절차 처리 방식별 고용 표(수락 N·fx7) — 판정 2가 절차 모형에 얼마나 민감한가')
    hires = [('EMP06', 8), ('EMP06', 30), ('EMP06', 50), ('EMP04', 8), ('EMP04', 30), ('EMP04', 50)]
    invs = ['noinv', 'S1', 'E7', 'SE']
    for name in names:
        P = M.resolve_params(name)
        combos = [('N', 'fx7', (), inv) for inv in invs] + [('N', 'fx7', (h,), inv) for h in hires for inv in invs]
        for cls_name, lab in [('base', '모형 그대로(물보리 조사 1일 + 의뢰 2일)'), ('prescout', '조사는 3일에 미리(의뢰 2일만)'),
                              ('noover', '절차 비용 없음')]:
            out = run_set2(cls_name, P, combos)
            print(f'\n## {name} · {lab}\n')
            print('| 고용 | ' + ' | '.join(invs) + ' |')
            print('|---|' + '---|' * len(invs))
            g = b = 0
            for e, d in hires:
                cells = []
                for inv in invs:
                    c = cell(delta(out, ('N', 'fx7', f'{e}@{d}', inv), ('N', 'fx7', 'nohire', inv)))
                    g += '↑' in c
                    b += '↓' in c
                    cells.append(c)
                print(f'| {e}@{d} | ' + ' | '.join(cells) + ' |')
            print(f'\n뚜렷한 이득 {g}칸 · 뚜렷한 손해 {b}칸 → 판정 2 {"통과" if g and b else "실패"}\n')


def e6(names):
    """고용일을 하루씩 옮겨도 결론이 같은가(28~32일)."""
    print('# E6 고용일 민감도 (수락 N·fx7, 같은 투자의 고용 없음 대비 중앙 (이득 시드))')
    days = [28, 29, 30, 31, 32]
    for name in names:
        P = M.resolve_params(name)
        combos = [('N', 'fx7', (), inv) for inv in ['noinv', 'SE']]
        for e in ['EMP06', 'EMP04']:
            for d in days:
                for inv in ['noinv', 'SE']:
                    combos.append(('N', 'fx7', ((e, d),), inv))
        out = run_set2('base', P, combos)
        print(f'\n## {name}\n')
        print('| 고용·투자 | ' + ' | '.join(f'{d}일' for d in days) + ' |')
        print('|---|' + '---|' * len(days))
        for e in ['EMP06', 'EMP04']:
            for inv in ['noinv', 'SE']:
                cells = [cell(delta(out, ('N', 'fx7', f'{e}@{d}', inv), ('N', 'fx7', 'nohire', inv))) for d in days]
                print(f'| {e}·{inv} | ' + ' | '.join(cells) + ' |')


if __name__ == '__main__' and sys.argv[1] in ('e2b', 'e6'):
    names = (sys.argv[2] if len(sys.argv) > 2 else 'CAND_A,CAND_B,CAND_C').split(',')
    {'e2b': e2b, 'e6': e6}[sys.argv[1]](names)


def run_job3(args):
    late_mode, P, seed, pol = args
    ed = patched_ed()
    sim = LateRule(ed, P, seed, pol)
    sim.late_mode = late_mode
    return sim.run()


def e7(names, modes, seeds):
    """늦은 인도 감액 변형에서 정책 185개 전체로 판정 1~4를 다시 잰다(M.evaluate 그대로)."""
    M.SEEDS = seeds
    print(f'# E7 감액 규칙별 네 판정(정책 185개, 시드 {seeds[0]}~{seeds[-1]})\n')
    print('| 후보 | 감액 | 판정 1234 | 투자 없는 회사 | 뚜렷한 이득 / 손해 칸(N) | 가장 강한 정책(1위와 300 안 시드) | 1위: 수락 A·N·C / 고용·비고용 | A−N 중앙(이득 시드) |')
    print('|---|---|---|---:|---|---|---|---|')
    for name in names:
        P = M.resolve_params(name)
        for mode in modes:
            pols = M.full_policies()
            tasks = [(mode, P, s, p) for p in pols for s in seeds]
            with ProcessPoolExecutor(max_workers=4) as ex:
                rs = list(ex.map(run_job3, tasks, chunksize=16))
            res = {}
            for r in rs:
                res.setdefault(r['policy'], []).append(r)
            M._PCHECK['ok'] = M.quotes_ok(M._ed(), P)
            ev = M.evaluate(res)
            # 시드별 1위의 수락 규칙과 고용 여부
            labels = [k for k in res if '|fx7|' in k and 'FREE2' not in k]
            vals = {k: {r['seed']: r['value'] for r in res[k]} for k in labels}
            acc = {'A': 0, 'N': 0, 'C': 0}
            hire = 0
            for s in seeds:
                b = max(labels, key=lambda k: vals[k][s])
                acc[b.split('|')[0]] += 1
                hire += b.split('|')[2] != 'nohire'
            md, pos, _ = M.paired(res['N|fx7|nohire|noinv'], res['A|fx7|nohire|noinv'])
            print(f"| {name} | {mode[0]} {mode[1] // 100} | {ev['c1']:d}{ev['c2']:d}{ev['c3']:d}{ev['c4']:d} | {ev['v0']:,.0f} | "
                  f"{len(ev['good'])} / {len(ev['bad'])} | `{ev['robust']}` ({ev['robust_near']}) | "
                  f"{acc['A']}·{acc['N']}·{acc['C']} / {hire}·{len(seeds) - hire} | {md:+,.0f} ({pos}) |", flush=True)


if __name__ == '__main__' and sys.argv[1] == 'e7':
    names = sys.argv[2].split(',')
    modes = [tuple((x.split(':')[0], int(x.split(':')[1]))) for x in sys.argv[3].split(',')]
    first = int(sys.argv[4]) if len(sys.argv) > 4 else 1001
    e7(names, modes, list(range(first, first + 20)))


def e8(specs, modes, firsts):
    """후보@대금가감 × 감액 규칙 × 시드 묶음. 판정 1~4(정책 185개)."""
    print('| 후보 | 대금 가감 | 감액 | 시드 | 판정 1234 | 투자 없는 회사 | 이득/손해 칸(N) | 가장 강한 정책(1위와 300 안) | 1위 수락 A·N·C / 고용·비고용 | A−N |')
    print('|---|---:|---|---|---|---:|---|---|---|---|')
    for spec in specs:
        name, add = (spec.split('@') + ['0'])[:2]
        P = dict(M.resolve_params(name), h_fee_add=int(add))
        for mode in modes:
            for first in firsts:
                seeds = list(range(first, first + 20))
                M.SEEDS = seeds
                pols = M.full_policies()
                tasks = [(mode, P, s, p) for p in pols for s in seeds]
                with ProcessPoolExecutor(max_workers=4) as ex:
                    rs = list(ex.map(run_job3, tasks, chunksize=16))
                res = {}
                for r in rs:
                    res.setdefault(r['policy'], []).append(r)
                M._PCHECK['ok'] = M.quotes_ok(M._ed(), P)
                ev = M.evaluate(res)
                labels = [k for k in res if '|fx7|' in k and 'FREE2' not in k]
                vals = {k: {r['seed']: r['value'] for r in res[k]} for k in labels}
                acc = {'A': 0, 'N': 0, 'C': 0}
                hire = 0
                for s in seeds:
                    b = max(labels, key=lambda k: vals[k][s])
                    acc[b.split('|')[0]] += 1
                    hire += b.split('|')[2] != 'nohire'
                md, pos, _ = M.paired(res['N|fx7|nohire|noinv'], res['A|fx7|nohire|noinv'])
                print(f"| {name} | {int(add):+d} | {mode[0]} {mode[1] // 100} | {first}~ | {ev['c1']:d}{ev['c2']:d}{ev['c3']:d}{ev['c4']:d} | {ev['v0']:,.0f} | "
                      f"{len(ev['good'])}/{len(ev['bad'])} {','.join(ev['good'][:6])} | `{ev['robust']}` ({ev['robust_near']}) | "
                      f"{acc['A']}·{acc['N']}·{acc['C']} / {hire}·{20 - hire} | {md:+,.0f} ({pos}) |", flush=True)


if __name__ == '__main__' and sys.argv[1] == 'e8':
    specs = sys.argv[2].split(',')
    modes = [tuple((x.split(':')[0], int(x.split(':')[1]))) for x in sys.argv[3].split(',')]
    firsts = [int(x) for x in sys.argv[4].split(',')]
    e8(specs, modes, firsts)
