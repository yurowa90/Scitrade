# 수락 규칙(C/N/A)별 고용 표: runs_*.csv에서 같은 수락·환전·투자의 고용 없음 대비 분석값 차이 중앙(이득 시드)
import csv, sys, statistics as st, os
OUT = sys.argv[1]
names = sys.argv[2].split(',')
HIRES = ['90k@8', '90k@30', '90k@50', '110k@8', '110k@30', '110k@50']
INVS = ['noinv', 'S1', 'E7', 'SE']
for name in names:
    rows = list(csv.DictReader(open(os.path.join(OUT, f'runs_{name}.csv'), encoding='utf-8')))
    by = {}
    for r in rows:
        by.setdefault(r['policy'], {})[r['seed']] = r
    for acc in ['C', 'N', 'A']:
        print(f'## {name} 수락 {acc} (fx7)')
        print('| 고용 | ' + ' | '.join(INVS) + ' |')
        print('|---|' + '---|' * len(INVS))
        good = bad = 0
        for h in HIRES:
            cells = []
            for inv in INVS:
                a, b = by[f'{acc}|fx7|{h}|{inv}'], by[f'{acc}|fx7|nohire|{inv}']
                d = [float(a[s]['value']) - float(b[s]['value']) for s in a]
                fails = sum(1 for s in a if a[s]['fail_day'] != 'None')
                md, pos = st.median(d), sum(1 for x in d if x > 0)
                mark = ' ↑' if md >= 300 and pos >= 15 and fails <= 1 else (' ↓' if md <= -300 and pos <= 5 else '')
                good += mark == ' ↑'; bad += mark == ' ↓'
                cells.append(f'{md:+,.0f} ({pos}){mark}')
            print(f'| {h} | ' + ' | '.join(cells) + ' |')
        # 그 수락 규칙의 고용 없음 직원 부족 거절
        dec = st.median([int(r['dec_staff']) for r in by[f'{acc}|fx7|nohire|noinv'].values()])
        late = st.median([int(r['late']) for r in by[f'{acc}|fx7|nohire|noinv'].values()])
        idle = st.median([float(r['idle_share']) for r in by[f'{acc}|fx7|nohire|noinv'].values()])
        print(f'\n뚜렷한 이득 {good}칸 · 손해 {bad}칸 · 고용 없음 기준: 직원 부족 거절 중앙 {dec}, 늦은 인도 중앙 {late}, 유휴 {idle:.0%}\n')
