#!/usr/bin/env python3
"""판정표 '측정 전 고정 기록'용 대조: 기대 프로필(DESIGN 6절 JSON + TASK-0065가 더할 값)과
data/market_rules.json의 risk_profiles를 키로 맞춰 비교한다(배열 순서 무시, 허브 결정 H15 F8).

쓰는 법: python3 check_profile_vs_design.py <DESIGN.md> <market_rules.json> <goods.json>
차이가 없으면 'DIFF 0'과 정규화한 두 JSON의 sha256을 내고 0으로 끝난다. 차이가 있으면 1.
"""
import hashlib, json, re, sys

def canon(x):
    if isinstance(x, dict):
        return {k: canon(x[k]) for k in sorted(x)}
    if isinstance(x, list):
        items = [canon(v) for v in x]
        return sorted(items, key=lambda v: json.dumps(v, ensure_ascii=False, sort_keys=True))
    return x

def main(design_path, rules_path, goods_path):
    text = open(design_path, encoding='utf-8').read()
    sec = text[text.index('## 6. 자료 형태'):text.index('## 7.')]
    blocks = re.findall(r'```json\n(.*?)```', sec, re.S)
    assert len(blocks) == 1, f'6절 JSON 블록 수 {len(blocks)}'
    exp = json.loads(blocks[0])
    goods = json.load(open(goods_path, encoding='utf-8'))
    glist = goods['items']
    laver = [g['id'] for g in glist if str(g.get('hs_code') or g.get('hs_candidate') or '').startswith('2008.99')
             or 'LAVER' in g['id']]
    assert len(laver) == 1, f'조미김 품목 후보 {laver}'
    lid = laver[0]
    # TASK-0065가 더할 값(DESIGN 6절, 동결)
    for cc in ('CN', 'VN'):
        exp['tariff']['base'].append({'country_code': cc, 'good_id': lid, 'rate_bp': 500})
    exp['claims']['by_good'].append({'good_id': lid, 'grade': 'LOW', 'p_claim_bp': 500})
    for cid, g in (('CUSTOMER_HAI_COSMETICS_NEW', 'B'), ('CUSTOMER_SHA_COSMETICS_NEW', 'B'),
                   ('CUSTOMER_HAI_LAVER', 'C'), ('CUSTOMER_SHA_LAVER', 'C')):
        exp['collections']['by_counterparty'].append({'counterparty_id': cid, 'grade': g})
    rules = json.load(open(rules_path, encoding='utf-8'))
    profs = rules['risk_profiles']
    assert len(profs) == 1, f'risk_profiles 수 {len(profs)}'
    a, b = canon(exp), canon(profs[0])
    sa = json.dumps(a, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    sb = json.dumps(b, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    print('laver_good_id', lid)
    print('expected_sha256', hashlib.sha256(sa.encode()).hexdigest())
    print('actual_sha256', hashlib.sha256(sb.encode()).hexdigest())
    if a == b:
        print('DIFF 0')
        return 0
    def walk(p, x, y):
        if type(x) != type(y) or (not isinstance(x, (dict, list)) and x != y):
            print('DIFF', p, json.dumps(x, ensure_ascii=False), '!=', json.dumps(y, ensure_ascii=False)); return
        if isinstance(x, dict):
            for k in sorted(set(x) | set(y)): walk(f'{p}.{k}', x.get(k), y.get(k))
        elif x != y:
            print('DIFF', p, json.dumps(x, ensure_ascii=False), '!=', json.dumps(y, ensure_ascii=False))
    walk('$', a, b)
    return 1

if __name__ == '__main__':
    sys.exit(main(*sys.argv[1:4]))
