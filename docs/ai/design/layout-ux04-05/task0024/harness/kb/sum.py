"""한 열 Tab 순서 시안 비교 요약. head(e4f7dfa) 대 o1·o2·o3a·o3b. 사용: python3 sum.py [-v]"""
import json, os, sys
H = os.path.dirname(os.path.abspath(__file__))
O = os.path.join(H, 'out')
P = ['l1366', 'cb1366t', 'ipadAirL', 'ipadminiL', 'ipadmini6L', 'l1920', 't1000']
D = ['head', 'o3b']
V = '-v' in sys.argv

def jl(name):
    f = os.path.join(O, name)
    if not os.path.exists(f): return []
    return [json.loads(l) for l in open(f) if l.strip().startswith('{')]
def by(rows): return {r['dist']: r for r in rows}

# ---------- 읽던 자리(accept24/remeas2/table2.py와 같은 판정) ----------
def akey(d):
    if 'case' not in d: return f"K1 {d['mode']}"
    c = d['case']
    if c == 'F2': return f"F2 {d['kind']} {d['pos']}"
    if c == 'F2n': return 'F2n'
    if c == 'T1': return 'T1'
    if c == 1: return f"C1 {d['variant']} {d['off']}"
    if c == 'F1': return f"F1 {d['mode']} {d['off']}"
    if c == 3: return f"C3 {d['act']}{' contract' if d['withContract'] else ''}"
    if c == 4: return f"C4 {d['variant']}"
    return str(c)
def ametrics(d):
    if 'case' not in d: return {'dHead': d['dHead']}
    c = d['case']
    if c == 'F2': return {'dF': d['dF'], 'dRepH': d['dRepH'], 'dBookH': d['dBookH']}
    if c == 'F2n': return {'dF': d['dF'], 'dBookH': d['dBookH'], 'toggle': d['scrollOnToggle']}
    if c == 'T1':
        f = lambda t: None if not t else (t['text'][:60], t['lines'], t['btnH'], t['toastH'])
        return {'day2': f(d['day2']), 'day3': f(d['day3']), 'trust': d['trust'] and (d['trust']['gapFromPrev'], d['trust']['marginTop']), 'reports': d['reports']}
    if c == 1: return {'d': d['d'], 'dMid': d['dMid'], 'dHead': d['dHead']}
    if c == 'F1': return {'d': d['d'], 'dTradeH': d['dTradeH'], 'dCrewH': d['dCrewH'], 'dEmpH': d['dEmpH']}
    if c == 3: return {'d': d['d'], 'dEmp1': d['dEmp1']}
    if c == 4: return {'dY': [s['dY'] for s in d['steps']], 'dTab': [s['dTab'] for s in d['steps']]}
    return {}
SKIP = {'dCrewH', 'dEmpH', 'dBookH', 'toggle'}
def flat(m):
    out = []
    for k, v in m.items():
        if isinstance(v, list): out += [(f'{k}{i}', x) for i, x in enumerate(v)]
        else: out.append((k, v))
    return out
def anchors(rows, da, db):
    """da(시안)가 db(head)보다 나쁜 곳. 같은 값이면 same."""
    A = {akey(d): d for d in rows if d.get('dist') == da}
    B = {akey(d): d for d in rows if d.get('dist') == db}
    worse, diff, maxa, maxb, errs = [], [], 0, 0, []
    for k in sorted(set(A) | set(B)):
        a, b = A.get(k), B.get(k)
        if not a or not b: worse.append((k, 'missing', bool(a), bool(b))); continue
        if a.get('errors'): errs.append((k, da, a['errors'][:1]))
        ma, mb = ametrics(a), ametrics(b)
        if k == 'T1':
            if ma != mb: worse.append((k, 'T1 differs', ma, mb))
            continue
        fa, fb = dict(flat(ma)), dict(flat(mb))
        for kk, x in fa.items():
            if any(kk.startswith(s) for s in SKIP): continue
            y = fb.get(kk)
            if isinstance(x, (int, float)): maxa = max(maxa, abs(x))
            if isinstance(y, (int, float)): maxb = max(maxb, abs(y))
            if isinstance(x, (int, float)) and isinstance(y, (int, float)):
                if abs(x) > abs(y) + 1: worse.append((k, kk, x, y))
                if abs(x - y) > 1: diff.append((k, kk, x, y))
            if (x is None) != (y is None): worse.append((k, kk, x, y))
    return {'n': len(set(A) & set(B)), 'maxa': maxa, 'maxb': maxb, 'worse': worse, 'diff': diff, 'errs': errs}


VIS3 = ['skip', 'head', 'bar', 'toast', 'culture', 'trade', 'crew', 'resources', 'queue', 'world', 'report', 'log']
FIXED = ['skip', 'head', 'bar', 'toast']
def rejudge(stops, regions, onecol):
    """kbcore.judge와 같되, 한 열에서 현지 패널 영역 이름(‘panel local’)을 정지점 이름(‘culture’)과 맞춘다(측정기 이름 불일치 보정)."""
    order = VIS3
    if onecol:
        main = [('culture' if k == 'panel local' else k) for k, v in sorted(((k, v) for k, v in regions.items() if k != 'maincol'), key=lambda kv: kv[1][1])]
        order = FIXED + main
    rank = lambda r: order.index(r) if r in order else 99
    back = []
    for a, b in zip(stops, stops[1:]):
        lab = lambda x: f"{x['r']}:{x['act'] or x['id'] or x['label']}"
        if rank(b['r']) < rank(a['r']): back.append(lab(a) + '->' + lab(b))
        elif a['r'] == b['r'] and a['r'] not in FIXED and b['py'] < a['py'] - 20 and b['x'] <= a['x'] + 5: back.append(lab(a) + '->' + lab(b) + '(위로)')
    return back

def backs(p, d):
    kb = by(jl(f'kb-{p}.jsonl')).get(d); k23 = by(jl(f'kb23-{p}.jsonl')).get(d)
    kt = by(jl(f'kbtoast-{p}.jsonl')).get(d); k90 = by(jl(f'k90-{p}.jsonl')).get(d)
    def n(x): return '?' if x is None else len(x)
    lists = {
        '1일': kb and [b['from'] + '->' + b['to'] for b in kb['first']['back']],
        '수락': kb and [b['from'] + '->' + b['to'] for b in kb['accepted']['back']],
        '2일': k23 and [b['from'] + '->' + b['to'] for b in k23['day2']['back']],
        '알림': kt and kt['cycle']['back'],
        '90일': k90 and k90['cycle']['back'],
    }
    oc = p == 't1000'
    fixed = {
        '1일': kb and rejudge(kb['first']['stops'], kb['first']['regions'], oc),
        '수락': kb and rejudge(kb['accepted']['stops'], kb['accepted']['regions'], oc),
        '2일': k23 and rejudge(k23['day2']['stops'], k23['day2']['regions'], oc),
        '알림': kt and rejudge(kt['cycle']['stops'], kt['cycle']['regions'], oc),
        '90일': k90 and rejudge(k90['cycle']['stops'], k90['cycle']['regions'], oc),
    }
    hidden = {
        '1일': kb and len(kb['first']['hidden']), '수락': kb and len(kb['accepted']['hidden']), '2일': k23 and len(k23['day2']['hidden']),
        '알림': kt and len(kt['cycle']['hidden']), '90일': k90 and len(k90['cycle']['hidden'])}
    nstops = {'1일': kb and kb['first']['n'], '수락': kb and kb['accepted']['n'], '2일': k23 and k23['day2']['n'], '알림': kt and kt['cycle']['n'], '90일': k90 and k90['cycle']['n']}
    errs = (kb and kb['errorsFirst'] + kb['errorsAccepted'] + kb['errorsToast'] or []) + (k23 and k23.get('errors1', []) or []) + (kt and kt.get('errors', []) or []) + (k90 and k90.get('errors', []) or [])
    kbx = None
    if kb:
        kbx = {'far': [kb[k]['res'][-1]['dy'] for k in ['firstFar', 'acceptedFar', 'toastFar']], 'walk': [kb[k]['last']['dy'] for k in ['firstWalk', 'acceptedWalk', 'toastWalk']],
               'res': kb['result']['presses'], 'resVis': kb['result'].get('vis'), 'after': (kb['result'].get('afterEnter') or {}).get('focus')}
    return '/'.join(str(n(lists[k])) for k in lists) + ' [' + '/'.join(str(n(fixed[k])) for k in fixed) + ']', (lists, fixed), hidden, nstops, errs, kbx

def qpos(p, d):
    x = by(jl(f'qpos-{p}.jsonl')).get(d)
    if not x: return None
    return x

def main():
    print('## 거꾸로 Tab (1일/수락/2일/알림/90일) — 측정기 판정 그대로 [현지 패널 이름 보정 뒤]')
    print('| 프로필 | ' + ' | '.join(D) + ' |')
    print('|---|' + '---|' * len(D))
    detail = {}
    for p in P:
        row = []
        for d in D:
            s, lists, hidden, nst, errs, kbx = backs(p, d)
            detail[(p, d)] = (lists, hidden, nst, errs, kbx)
            row.append(s + (' 오류' if errs else ''))
        print(f'| {p} | ' + ' | '.join(row) + ' |')
    print('\n## 한 열·세 열 ‘오늘 할 일’ 위치(qpos): 1일 페이지 y / T1 뒤 띠 아래 px / 하루 진행에서 오늘 할 일까지 Tab 수(1일·T1·2일)')
    print('| 프로필 | ' + ' | '.join(D) + ' |')
    print('|---|' + '---|' * len(D))
    for p in P:
        row = []
        for d in D:
            x = qpos(p, d)
            row.append('?' if not x else f"{x['day1']['queuePageY']} / {x['t1']['queueBelowBand']} / {x['day1']['tabs']['n']}·{x['t1']['tabs']['n']}·{x['day2']['tabs']['n']}")
        print(f'| {p} | ' + ' | '.join(row) + ' |')
    print('\n## 보이는 순서 / 화면 코드 순서 (1일, qpos)')
    for p in ['l1366', 't1000']:
        for d in D:
            x = qpos(p, d)
            if x: print(f"- {p} {d}: 보임 {x['day1']['vis']} / 코드 {x['day1']['dom']}")
    print('\n## Shift+Tab far·walk 마지막 dy(1일/수락/알림), 결과 보기까지 Tab, Enter 뒤 초점')
    print('| 프로필 | ' + ' | '.join(D) + ' |')
    print('|---|' + '---|' * len(D))
    for p in P:
        row = []
        for d in D:
            kbx = detail[(p, d)][4]
            row.append('?' if not kbx else f"{kbx['far']}·{kbx['walk']} / {kbx['res']} / {kbx['after']}")
        print(f'| {p} | ' + ' | '.join(row) + ' |')
    print('\n## 읽던 자리 32사례: head 대비 (사례 수 · |d| 최대 시안/head · 나빠진 곳 · 1px 넘게 다른 곳)')
    print('| 프로필 | ' + ' | '.join(D[1:]) + ' |')
    print('|---|' + '---|' * (len(D) - 1))
    anc = {}
    for p in P:
        rows = jl(f'anc-{p}.jsonl')
        row = []
        for d in D[1:]:
            a = anchors(rows, d, 'head'); anc[(p, d)] = a
            row.append(f"{a['n']} · {a['maxa']}/{a['maxb']} · {len(a['worse'])} · {len(a['diff'])}" + (f" 오류{len(a['errs'])}" if a['errs'] else ''))
        print(f'| {p} | ' + ' | '.join(row) + ' |')
    if V:
        for p in P:
            print(f'\n=== {p}')
            for d in D:
                lists, hidden, nst, errs, kbx = detail[(p, d)]
                print(f'  [{d}] stops {nst} hidden {hidden}')
                for k, v in lists[0].items():
                    if v: print(f'     {k}: {v}')
                for k, v in lists[1].items():
                    if v != lists[0][k]: print(f'     보정 {k}: {v}')
                if errs: print('     ERR', errs[:3])
                if d != 'head':
                    a = anc[(p, d)]
                    if a['worse'] or a['diff']: print('     anc worse', a['worse'][:6], 'diff', a['diff'][:6])
            for d in D:
                x = qpos(p, d)
                if x: print(f"  qpos {d}: " + ' | '.join(f"{k} y{x[k]['queuePageY']} below{x[k]['queueBelowBand']} full{x[k]['queueFull']} item{x[k]['itemFull']} sy{x[k]['sy']} tabs{(x[k].get('tabs') or {}).get('n')}" for k in ['day1', 'acc', 't1', 'day2']))
if __name__ == '__main__': main()
