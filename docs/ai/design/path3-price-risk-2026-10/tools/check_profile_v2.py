#!/usr/bin/env python3
"""판정표 v2 '측정 전 고정 기록'용 대조.

기대 프로필 = 판본 1 최종 프로필(측정 커밋 3d36846의 RISK_PROFILE_DEFAULT, H21)
            + 판정표 v2 5.2 시작값·고정값 + DESIGN-v2 5.3 등급 배치.
이것을 data/market_rules.json의 RISK_PROFILE_V2와 키로 맞춰 비교한다(배열 순서 무시).
판본 1 프로필(RISK_PROFILE_DEFAULT)이 판본 1 최종과 같은지도 확인한다.
risk_profiles 밖의 최상위 키(rule_sets 등)가 판본 1과 같은지도 본다. 판매 마진 k = 0(TASK-0065 값)의 근거다.

쓰는 법: python3 check_profile_v2.py <판본 1 market_rules.json> <지금 market_rules.json> [k]
k는 그 회차의 판매 마진 손잡이(H31, 기본 0)다. TASK-0069 뒤 RISK_PROFILE_V2에 sale_margin_k 칸이 있다.
차이가 없으면 'DIFF 0'과 정규화한 JSON의 sha256을 내고 0으로 끝난다. 차이가 있으면 1.
"""
import copy, hashlib, json, sys

def canon(x):
    if isinstance(x, dict):
        return {k: canon(x[k]) for k in sorted(x)}
    if isinstance(x, list):
        items = [canon(v) for v in x]
        return sorted(items, key=lambda v: json.dumps(v, ensure_ascii=False, sort_keys=True))
    return x

def dump(x):
    return json.dumps(canon(x), ensure_ascii=False, sort_keys=True, separators=(',', ':'))

def main(v1_path, now_path, k_arg='0'):
    margin_k = int(k_arg)
    v1_all = json.load(open(v1_path, encoding='utf-8'))
    now_all = json.load(open(now_path, encoding='utf-8'))
    v1 = {p['id']: p for p in v1_all['risk_profiles']}
    now = {p['id']: p for p in now_all['risk_profiles']}
    assert set(v1) == {'RISK_PROFILE_DEFAULT'}, f'판본 1 프로필 {sorted(v1)}'
    assert set(now) == {'RISK_PROFILE_DEFAULT', 'RISK_PROFILE_V2'}, f'지금 프로필 {sorted(now)}'
    ok = True
    others = sorted((set(v1_all) | set(now_all)) - {'risk_profiles'})
    for k in others:
        if dump(v1_all.get(k)) != dump(now_all.get(k)):
            print(f'DIFF 최상위 키 {k}가 판본 1과 다르다'); ok = False
    if dump(v1['RISK_PROFILE_DEFAULT']) != dump(now['RISK_PROFILE_DEFAULT']):
        print('DIFF 판본 1 프로필이 바뀌었다'); ok = False

    exp = copy.deepcopy(v1['RISK_PROFILE_DEFAULT'])
    exp['id'] = 'RISK_PROFILE_V2'
    exp['status'] = 'V2_START_2026-10-24'
    exp['sale_margin_k'] = margin_k           # H31 손잡이 칸(TASK-0069)
    col = exp['collections']
    # 판정표 v2 5.2 시작값: 대손 기본 확률
    for g, bp in (('A', 200), ('B', 500), ('C', 1200)):
        next(x for x in col['grades'] if x['grade'] == g)['p_default_bp'] = bp
    col['carry_bp_per_day'] = 3          # 5.2 지연 이자 시작
    col['recovery_bp'] = 3000            # 5.2 고정 회수율
    # DESIGN-v2 5.3 등급 배치
    for cid, g in (('CUSTOMER_HAI_COSMETICS_NEW', 'A'), ('CUSTOMER_SHA_COSMETICS_NEW', 'B'),
                   ('CUSTOMER_HAI_LAVER', 'C'), ('CUSTOMER_SHA_LAVER', 'B')):
        next(x for x in col['by_counterparty'] if x['counterparty_id'] == cid)['grade'] = g
    # 5.2 외상 조건(가산 시작, 조건 계수 고정)
    exp['credit_terms'] = [
        {'id': 'BASE', 'days': 0, 'factor_pct': 100, 'premium_bp': 0},
        {'id': 'D15', 'days': 15, 'factor_pct': 150, 'premium_bp': 300},
        {'id': 'D30', 'days': 30, 'factor_pct': 200, 'premium_bp': 600},
    ]
    # 5.2 고정 인수 한도: L = 400,000센트, 배수 A 3·B 2·C 1
    exp['credit_limit_unit_minor'] = 400000
    exp['credit_limits'] = [{'grade': g, 'lots': n, 'limit_minor': 400000 * n}
                            for g, n in (('A', 3), ('B', 2), ('C', 1))]

    # 5.2 고정값이 판본 1에서 그대로 왔는지 따로 확인한다
    got = now['RISK_PROFILE_V2']
    fixed = [
        (got['fx']['step_bp'], 275, 'fx.step_bp'),
        (got['tariff']['step_bp'], [-200, 800], 'tariff.step_bp'),
        (got['tariff']['max_changes'], 2, 'tariff.max_changes'),
        (got['tariff']['max_bp'], 3000, 'tariff.max_bp'),
        ((got['surcharge']['p_zero_bp'], got['surcharge']['min_bp'], got['surcharge']['max_bp']), (7000, 500, 3000), 'surcharge'),
        (got['claims']['major']['weight_bp'], 2000, 'claims.major.weight_bp'),
    ]
    for a, b, name in fixed:
        if a != b:
            print(f'DIFF 고정값 {name}: {a} != {b}'); ok = False

    if dump(exp) != dump(got):
        ok = False
        print('DIFF RISK_PROFILE_V2')
        print(' 기대', dump(exp))
        print(' 실제', dump(got))
    if not ok:
        return 1
    print('DIFF 0')
    print('risk_profiles 밖 최상위 키 같음:', ','.join(others))
    print('v1 프로필 sha256', hashlib.sha256(dump(now['RISK_PROFILE_DEFAULT']).encode()).hexdigest())
    print('v2 프로필 sha256', hashlib.sha256(dump(got).encode()).hexdigest())
    return 0

if __name__ == '__main__':
    sys.exit(main(*sys.argv[1:]))
