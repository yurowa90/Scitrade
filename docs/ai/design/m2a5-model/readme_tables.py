# README 요약표를 out/runs_*.csv에서 만든다(손으로 옮겨 적지 않으려고). 사용: python3 readme_tables.py > out/readme_tables.md
# 먼저 `python3 m2a5_model.py report --candidates CAND_A,CAND_B,CAND_C,SPEC_P,PACKET`을 돌린다.
import csv
import os
import statistics as st

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
ROWS = [
    ('N|fx7|nohire|noinv', '보통·환전·고용 없음·투자 없음 (기준)'),
    ('N|none|nohire|noinv', '보통·환전 안 함'),
    ('N|react|nohire|noinv', '보통·경고 뒤에만 환전'),
    ('C|fx7|nohire|noinv', '신중·환전'),
    ('A|fx7|nohire|noinv', '적극(늦은 인도도 받음)·환전'),
    ('N|fx7|nohire|SE', '선복 계약 2노선(1일) + 창고 확장(7일)'),
    ('N|fx7|90k@8|noinv', '90,000원 2pt 직원 8일 고용'),
    ('N|fx7|90k@30|noinv', '90,000원 2pt 직원 30일 고용'),
    ('N|fx7|90k@50|noinv', '90,000원 2pt 직원 50일 고용'),
    ('N|fx7|110k@8|noinv', '110,000원 3pt 직원 8일 고용'),
    ('N|fx7|110k@30|noinv', '110,000원 3pt 직원 30일 고용'),
    ('N|fx7|90k@8|SE', 'SE + 90,000원 8일'),
    ('N|fx7|90k@30|SE', 'SE + 90,000원 30일'),
    ('N|fx7|110k@30|SE', 'SE + 110,000원 30일'),
    ('N|fx7|90k@30|SE22', '22일 SE + 90,000원 30일'),
    ('N|fx7|90k@22+110k@36|SE', 'SE + 두 명(22일 2pt, 36일 3pt)'),
    ('N|none|90k@30|SE', 'SE + 90,000원 30일, 환전 안 함'),
    ('N|fx7|FREE2@8|noinv', '진단: 임금 0 직원 8일(직원 그림자 가치)'),
]
CAP = ('dec_storage', 'dec_sailing', 'dec_handling')


def ref_of(lab):
    acc, fx, hire, inv = lab.split('|')
    if hire != 'nohire':
        return f'{acc}|{fx}|nohire|{inv}'
    if inv != 'noinv':
        return f'{acc}|{fx}|nohire|noinv'
    if acc != 'N' or fx != 'fx7':
        return 'N|fx7|nohire|noinv'
    return None


def rng(xs, fmt='{:,.0f}', pct=False):
    m, lo, hi = st.median(xs), min(xs), max(xs)
    f = (lambda v: f'{v * 100:.0f}%') if pct else (lambda v: fmt.format(v))
    return f(m) if lo == hi else f'{f(m)} ({f(lo)}~{f(hi)})'


def table(name):
    rows = list(csv.DictReader(open(os.path.join(OUT, f'runs_{name}.csv'), encoding='utf-8')))
    by = {}
    for r in rows:
        by.setdefault(r['policy'], []).append(r)
    L = ['| 정책 | 뜻 | 끝 USD | 끝 KRW | 원화 미지급 일수 | 경영 실패(일) | 기여이익 USD | 직원 유휴 | 직원 부족 거절 | 용량 부족 거절 | 분석값 | 기준 대비 중앙 · 이득 시드 |',
         '|---|---|---|---|---|---|---|---|---|---|---|---|']
    for lab, ko in ROWS:
        rs = by.get(lab)
        if not rs:
            continue
        fl = [int(r['fail_day']) for r in rs if r['fail_day'] != 'None']
        fail = f'{len(fl)}/20' + (f' ({min(fl)}~{max(fl)})' if fl and min(fl) != max(fl) else (f' ({fl[0]})' if fl else ''))
        ref = ref_of(lab)
        if ref and ref in by and not fl:
            base = {r['seed']: float(r['value']) for r in by[ref]}
            d = [float(r['value']) - base[r['seed']] for r in rs]
            cmp_ = f'{st.median(d):+,.0f} · {sum(1 for x in d if x > 0)}/20'
        elif fl:
            cmp_ = '실패해 비교 안 함'
        else:
            cmp_ = '—'
        L.append(f"| `{lab}` | {ko} | {rng([int(r['end_usd']) / 100 for r in rs])} | {rng([int(r['end_krw']) for r in rs])} | "
                 f"{rng([int(r['krw_unpaid_days']) for r in rs])} | {fail} | {rng([int(r['contrib']) / 100 for r in rs])} | "
                 f"{rng([float(r['idle_share']) for r in rs], pct=True)} | {rng([int(r['dec_staff']) for r in rs])} | "
                 f"{rng([sum(int(r[k]) for k in CAP) for r in rs])} | {rng([float(r['value']) for r in rs])} | {cmp_} |")
    return '\n'.join(L)


def hire_matrix(name):
    rows = list(csv.DictReader(open(os.path.join(OUT, f'runs_{name}.csv'), encoding='utf-8')))
    by = {}
    for r in rows:
        by.setdefault(r['policy'], {})[r['seed']] = r
    L = ['| 고용 \\ 투자 | 없음 | 선복 계약 S1 | 창고 확장 E7 | 둘 다 SE |', '|---|---|---|---|---|']
    for h in ['90k@8', '90k@30', '90k@50', '110k@8', '110k@30', '110k@50']:
        cells = []
        for inv in ['noinv', 'S1', 'E7', 'SE']:
            a, b = by[f'N|fx7|{h}|{inv}'], by[f'N|fx7|nohire|{inv}']
            d = [float(a[s]['value']) - float(b[s]['value']) for s in a]
            md, pos = st.median(d), sum(1 for x in d if x > 0)
            mark = ' ↑' if md >= 300 and pos >= 15 else (' ↓' if md <= -300 and pos <= 5 else '')
            cells.append(f'{md:+,.0f} ({pos}/20){mark}')
        L.append(f'| {h} | ' + ' | '.join(cells) + ' |')
    inv = []
    for x in ['S1', 'E7', 'SE']:
        a, b = by[f'N|fx7|nohire|{x}'], by['N|fx7|nohire|noinv']
        d = [float(a[s]['value']) - float(b[s]['value']) for s in a]
        inv.append(f'{x} {st.median(d):+,.0f} ({sum(1 for v in d if v > 0)}/20)')
    L.append('')
    L.append('투자만(고용 없음, 투자 없음 대비): ' + ', '.join(inv))
    return '\n'.join(L)


if __name__ == '__main__':
    for name in ['CAND_A', 'CAND_B', 'CAND_C', 'SPEC_P', 'PACKET']:
        print(f'### {name} 고용 표 (보통·환전, 같은 투자의 고용 없음 대비 분석값 차이 중앙 (이득 시드))')
        print()
        print(hire_matrix(name))
        print()
        print(f'### {name} 지표 표 (20시드 중앙값 (최소~최대))')
        print()
        print(table(name))
        print()
