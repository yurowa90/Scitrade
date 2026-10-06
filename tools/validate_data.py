#!/usr/bin/env python3
"""Validate bundled data and arithmetic references, not an unimplemented game engine.

Standard-library validator for the JSON Schema keywords used by this bundle:
type, required, properties, items, enum, minimum, maximum, additionalProperties.
The schema files can also be used with a complete Draft 2020-12 validator.
"""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_EVEN
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
CHECKS = 0


def check(condition, message):
    global CHECKS
    CHECKS += 1
    if not condition:
        ERRORS.append(message)


def validate_growth(rules, characters):
    """성장 자료와 엔진이 고정한 의미를 대조한다. 누락도 검사 실패로 보고한다."""
    level_min, level_max = rules.get('level_min'), rules.get('level_max')
    bounds_ok = (type(level_min) is int and type(level_max) is int
                 and 1 <= level_min <= level_max)
    check(bounds_ok, 'positive ordered level_min and level_max')
    thresholds = rules.get('xp_thresholds')
    thresholds_ok = isinstance(thresholds, list) and all(
        isinstance(t, dict) and type(t.get('level')) is int
        and type(t.get('cumulative_xp')) is int for t in thresholds)
    check(thresholds_ok, 'XP thresholds contain integer level and cumulative_xp')
    if thresholds_ok and bounds_ok:
        check(level_max == len(thresholds), 'level_max equals XP threshold count')
        check([t['level'] for t in thresholds] == list(range(level_min, level_max + 1)),
              'complete level_min-level_max thresholds')
        for t in thresholds:
            check(t['cumulative_xp'] == 50*(t['level']-1)*t['level'], 'XP threshold arithmetic')
        for cid, character in characters.items():
            xp = character.get('xp_total')
            check(type(xp) is int and xp >= 0, cid + ': nonnegative integer XP')
            if type(xp) is int:
                level = max([level_min] + [min(level_max, t['level']) for t in thresholds
                                           if xp >= t['cumulative_xp']])
                check(character.get('level') == level, cid + ': level matches XP')
    training = rules.get('ordinary_training')
    check(isinstance(training, dict), 'ordinary training definition exists')
    training = training if isinstance(training, dict) else {}
    fee = training.get('fee')
    fee = fee if isinstance(fee, dict) else {}
    for name, value in [('task_completion_xp', rules.get('task_completion_xp')),
                        ('duration_days', training.get('duration_days')),
                        ('fee.amount', fee.get('amount')),
                        ('xp_on_completion', training.get('xp_on_completion'))]:
        check(type(value) is int and value > 0, name + ': positive integer')
    check(fee.get('currency') == 'KRW', 'ordinary training fee uses KRW')
    check(training.get('occupies_employee_reservation') is True,
          'ordinary training occupies employee reservation')
    check(training.get('salary_included_in_fee') is False,
          'ordinary training fee excludes salary')


def validate_cancellation(scenarios, routes):
    """상속한 계약 조건을 포함해 모든 시나리오 노선의 고정 취소비를 검사한다."""
    def resolve(sid):
        scenario = scenarios[sid]
        base = resolve(scenario['base_scenario_id']) if scenario.get('base_scenario_id') else {}
        return {**base, **scenario}

    for sid in scenarios:
        scenario = resolve(sid)
        cancel = scenario.get('contract_terms', {}).get('pre_departure_cancellation')
        if cancel is None:
            continue
        fee = cancel['cancellation_fee']
        route_ids = scenario.get('route_ids', [scenario['route_id']] if 'route_id' in scenario else [])
        for rid in route_ids:
            freight = routes[rid]['booking_fee']
            check(fee['currency'] == freight['currency'], f'{sid}/{rid}: cancellation fee currency matches booking fee')
            check(fee['amount'] <= freight['amount'], f'{sid}/{rid}: cancellation fee <= booking fee')


def read(relative):
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))


def shape(value, schema, path):
    types = schema.get('type', [])
    if isinstance(types, str):
        types = [types]
    predicates = {
        'object': lambda x: isinstance(x, dict),
        'array': lambda x: isinstance(x, list),
        'string': lambda x: isinstance(x, str),
        'boolean': lambda x: isinstance(x, bool),
        'integer': lambda x: isinstance(x, int) and not isinstance(x, bool),
        'number': lambda x: isinstance(x, (int, float)) and not isinstance(x, bool),
        'null': lambda x: x is None,
    }
    correct = not types or any(predicates[t](value) for t in types)
    check(correct, f'{path}: type {types}')
    if not correct:
        return
    if 'enum' in schema:
        check(value in schema['enum'], f'{path}: enum')
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if 'minimum' in schema:
            check(value >= schema['minimum'], f'{path}: minimum')
        if 'maximum' in schema:
            check(value <= schema['maximum'], f'{path}: maximum')
    if isinstance(value, dict):
        for key in schema.get('required', []):
            check(key in value, f'{path}: missing {key}')
        for key, item in value.items():
            if key in schema.get('properties', {}):
                shape(item, schema['properties'][key], f'{path}/{key}')
            elif schema.get('additionalProperties') is False:
                check(False, f'{path}: unexpected {key}')
    if isinstance(value, list) and 'items' in schema:
        for index, item in enumerate(value):
            shape(item, schema['items'], f'{path}/{index}')


def walk(value):
    if isinstance(value, dict):
        yield value
        for item in value.values():
            yield from walk(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk(item)


def index(items, label):
    ids = [item['id'] for item in items]
    check(len(ids) == len(set(ids)), f'{label}: duplicate IDs')
    return {item['id']: item for item in items}


def sailing_day(route, sailing_id):
    prefix = route['id'] + '-D'
    check(sailing_id.startswith(prefix), sailing_id + ': sailing belongs to route ' + route['id'])
    day = int(sailing_id[len(prefix):])
    check(day >= route['first_departure_day']
          and (day - route['first_departure_day']) % route['departure_interval_days'] == 0,
          sailing_id + ': sailing exists in the schedule')
    return day


def check_m2a(tables):
    """Reference arithmetic for SCENARIO_M2_MULTI_TRADE (DESIGN). The engine tests replay the same paths."""
    scenario = tables['scenarios']['SCENARIO_M2_MULTI_TRADE']
    offers, goods, routes = tables['market_offers'], tables['goods'], tables['routes']
    terms = scenario['contract_terms']
    rate = scenario['tax_rule']['rate']
    late_cut = terms['late_delivery']['price_reduction']['amount']
    opening = scenario['starting_cash']['USD']
    check(scenario['engine_rules']['funds_check'] == 'committed_outlays'
          and scenario['engine_rules']['forwarding_enabled'] is True, 'M2a rule set explicit')
    check(set(scenario['offer_ids']) <= set(offers), 'M2a offers exist')
    check_recruitment(tables)

    def route_between(origin, destination):
        found = [r for r in routes.values() if r['id'] in scenario['route_ids']
                 and r['from_city_id'] == origin and r['to_city_id'] == destination]
        check(len(found) == 1, f'M2a: one scenario route {origin}->{destination}')
        return found[0]

    def space(offer):
        good = goods[offer['good_id']]
        return offer['quantity'] * good['mass_kg_per_unit'], round(offer['quantity'] * good['volume_m3_per_unit'], 6)

    def trade_numbers(buy_id, sell_id):
        buy, sell = offers[buy_id], offers[sell_id]
        check(buy['kind'] == 'supplier' and sell['kind'] == 'customer' and buy['good_id'] == sell['good_id']
              and buy['quantity'] == sell['quantity'], f'M2a trade pair {buy_id}+{sell_id}')
        route = route_between(buy['city_id'], sell['city_id'])
        purchase = buy['quantity'] * buy['unit_price']['amount']
        sale = sell['quantity'] * sell['unit_price']['amount']
        duty = round(purchase * rate)
        return route, purchase, sale, route['booking_fee']['amount'], duty

    for path in scenario['expected_paths_usd']:
        pid = path['id']
        cash, reserved = opening, 0
        goods_revenue = cogs = fwd_revenue = fwd_cost = 0
        load = {}
        for buy_id, sell_id in path['trades']:
            route, purchase, sale, freight, duty = trade_numbers(buy_id, sell_id)
            sailing = path['sailing_by_offer'][buy_id]
            day = sailing_day(route, sailing)
            arrival = day + route['transit_days'] + scenario['customs_days']
            net = sale - (late_cut if arrival > offers[sell_id]['delivery_deadline_day'] else 0)
            cash -= purchase + freight
            reserved += duty
            goods_revenue += net
            cogs += purchase + freight + duty
            kg, m3 = space(offers[buy_id])
            load.setdefault(sailing, [route, 0, 0])
            load[sailing][1] += kg
            load[sailing][2] += m3
        for oid in path['forwarding_offer_ids']:
            offer = offers[oid]
            route = route_between(offer['city_id'], offer['destination_city_id'])
            sailing = path['sailing_by_offer'][oid]
            day = sailing_day(route, sailing)
            arrival = day + route['transit_days'] + scenario['customs_days']
            fee = offer['service_fee']['amount']
            net = fee - (late_cut if arrival > offer['delivery_deadline_day'] else 0)
            cash -= route['booking_fee']['amount']
            fwd_revenue += net
            fwd_cost += route['booking_fee']['amount']
            kg, m3 = space(offer)
            load.setdefault(sailing, [route, 0, 0])
            load[sailing][1] += kg
            load[sailing][2] += m3
        check(cash == path['cash_after_day1'], pid + ': cash after day-1 purchases and bookings')
        check(reserved == path['reserved_after_day1'], pid + ': duty still reserved after day 1')
        check(cash - reserved == path['available_after_day1'], pid + ': available cash after day 1')
        check(cash - reserved >= 0, pid + ': path is affordable')
        for sailing, (route, kg, m3) in load.items():
            check(kg <= route['capacity_kg'] and m3 <= route['capacity_m3'], pid + ': ' + sailing + ' within capacity')
        contribution = goods_revenue - cogs + fwd_revenue - fwd_cost
        check([goods_revenue, cogs, fwd_revenue, fwd_cost] ==
              [path['goods_revenue'], path['cost_of_goods_sold'], path['forwarding_revenue'], path['forwarding_cost']],
              pid + ': revenue and cost lines')
        check(contribution == path['contribution'] and opening + contribution == path['cash_final'],
              pid + ': contribution and final cash')
        last_due = max(offers[s]['payment_due_day'] for _, s in path['trades'])
        last_due = max([last_due] + [offers[o]['payment_due_day'] for o in path['forwarding_offer_ids']])
        check(path['final_day'] == last_due, pid + ': final day is the last payment day')

    rejections = {r['id']: r for r in scenario['expected_rejections']}
    r = rejections['REJECT_SECOND_DIRECT_TRADE']
    _, p1, _, f1, d1 = trade_numbers(*r['first_trade'])
    _, p2, _, f2, d2 = trade_numbers(*r['second_trade'])
    check(opening - p1 == r['cash_after_first'] and f1 + d1 == r['reserved_after_first']
          and opening - p1 - f1 - d1 == r['available_after_first'] and p2 + f2 + d2 == r['needed_for_second'],
          'M2a funds reservation arithmetic')
    check(r['cash_after_first'] >= p2 > r['available_after_first'],
          'M2a: second purchase is payable from cash but not from available funds')
    r = rejections['REJECT_FORWARDING_SAME_SAILING']
    route = next(x for x in routes.values() if r['sailing_id'].startswith(x['id'] + '-D'))
    sailing_day(route, r['sailing_id'])
    v1, v2 = (space(offers[o])[1] for o in ('OFFER_FWD_01', 'OFFER_FWD_02'))
    k1, k2 = (space(offers[o])[0] for o in ('OFFER_FWD_01', 'OFFER_FWD_02'))
    check([v1, v2, route['capacity_m3']] == [r['volume_m3_first'], r['volume_m3_second'], r['capacity_m3']],
          'M2a space fixture volumes')
    check(v1 <= route['capacity_m3'] and v2 <= route['capacity_m3'] < v1 + v2 and k1 + k2 <= route['capacity_kg'],
          'M2a: each cargo fits alone, both together exceed volume only')

    cases = {c['id']: c for c in read('tests/acceptance_cases.json')['cases']}
    rej = rejections['REJECT_SECOND_DIRECT_TRADE']
    e1 = cases['P0-M2A-01']['expected_numeric']
    check([e1['opening_cash'], e1['cash_after_first'], e1['reserved_after_first'], e1['available_after_first'], e1['needed_for_second']]
          == [opening, rej['cash_after_first'], rej['reserved_after_first'], rej['available_after_first'], rej['needed_for_second']],
          'P0-M2A-01 matches scenario fixture')
    path = next(p for p in scenario['expected_paths_usd'] if p['id'] == 'PATH_COSMETICS_AND_FORWARDING')
    e2 = cases['P0-M2A-02']['expected_numeric']
    check([e2['cash_after_day1'], e2['reserved_after_day1'], e2['goods_revenue'], e2['cost_of_goods_sold'],
           e2['forwarding_revenue'], e2['forwarding_cost'], e2['contribution'], e2['cash_final_day17']]
          == [path['cash_after_day1'], path['reserved_after_day1'], path['goods_revenue'], path['cost_of_goods_sold'],
              path['forwarding_revenue'], path['forwarding_cost'], path['contribution'], path['cash_final']],
          'P0-M2A-02 matches scenario fixture')
    e3 = cases['P0-M2A-03']['expected_numeric']
    space_rej = rejections['REJECT_FORWARDING_SAME_SAILING']
    check([e3['capacity_m3'], e3['volume_m3_first'], e3['volume_m3_second']]
          == [space_rej['capacity_m3'], space_rej['volume_m3_first'], space_rej['volume_m3_second']]
          and e3['cash_after_day1'] == opening - routes['ROUTE01']['booking_fee']['amount']
          and e3['reserved_after_day1'] == routes['ROUTE01']['booking_fee']['amount'],
          'P0-M2A-03 matches scenario fixture')
    e4 = cases['P0-M2A-04']['expected_numeric']
    wage = tables['employees']['EMP04']['salary_per_day']['amount']
    check(e4['signing_fee'] == wage * (scenario.get('recruitment') or {}).get('signing_fee_wage_days', -1)
          and e4['daily_wage'] == wage
          and e4['employed_after_discovery'] == len(scenario['employee_ids'])
          and e4['available_from_day'] == e4['hired_day'] + 1,
          'P0-M2A-04: 계약금·기존 인원·근무 시작일 검산')
    for rid in scenario['route_ids']:
        points = routes[rid]['map_waypoints']['points']
        for end, city_id in ((points[0], routes[rid]['from_city_id']), (points[-1], routes[rid]['to_city_id'])):
            geo = tables['world'][city_id]['geo_position']
            check(abs(end['lat'] - geo['lat']) <= 0.2 and abs(end['lon'] - geo['lon']) <= 0.2,
                  rid + ' map waypoints start and end at their ports')


def check_recruitment(tables):
    """영입 블록이 있는 시나리오의 후보·조사 장소·작업량을 검증한다."""
    for scenario in tables['scenarios'].values():
        recruitment = scenario.get('recruitment')
        if recruitment is None:
            continue
        label = scenario['id'] + ': 영입 '
        for key in ('data_basis', 'status', 'decision_ref', 'candidate_employee_ids',
                    'scout_sites', 'scout_work_units', 'quest_work_units', 'signing_fee_wage_days'):
            check(key in recruitment, label + key + ' 필수 키')
        candidates = recruitment.get('candidate_employee_ids', [])
        sites = recruitment.get('scout_sites', [])
        for site in sites:
            for key in ('venue_id', 'city_id', 'candidate_employee_ids'):
                check(key in site, label + '장소 ' + key + ' 필수 키')
        check(bool(candidates) and len(candidates) == len(set(candidates)), label + '후보 목록 중복 없음')
        check(len({s.get('venue_id') for s in sites}) == len(sites), label + '장소 중복 없음')
        for key in ('scout_work_units', 'quest_work_units', 'signing_fee_wage_days'):
            value = recruitment.get(key)
            check(type(value) is int and value > 0, label + key + ' 양의 정수')
        for cid in candidates:
            employee = tables['employees'].get(cid)
            check(employee is not None, label + cid + ' 직원 정의 존재')
            if employee is None:
                continue
            character = tables['characters'].get(employee['character_id'])
            check(employee['employment_status'] == 'candidate', label + cid + ' 후보 상태')
            check(character is not None and character['recruitment']['start_employed'] is False,
                  label + cid + ' 처음에는 미고용')
            check(cid not in scenario.get('employee_ids', []), label + cid + ' 시작 직원과 분리')
            check(sum(s.get('candidate_employee_ids', []).count(cid) for s in sites) == 1,
                  label + cid + ' 조사 장소 정확히 하나')
        for site in sites:
            venue = tables['venues'].get(site.get('venue_id'))
            check(venue is not None, label + str(site.get('venue_id')) + ' 장소 존재')
            check(venue is not None and venue['city_id'] == site.get('city_id'), label + '장소 도시 일치')
            check(bool(site.get('candidate_employee_ids', [])), label + '장소에 후보 존재')
            for cid in site.get('candidate_employee_ids', []):
                check(cid in candidates, label + cid + ' 시나리오 후보에 포함')
                employee = tables['employees'].get(cid)
                character = tables['characters'].get(employee['character_id']) if employee else None
                check(character is not None and site.get('city_id') == character['encounter']['city_id'],
                      label + cid + ' 만남 도시 일치')


def check_world_hubs(documents, tables, source_ids):
    """World hubs (user decision 2026-10-05): real logistics and trade-finance centres, opened by chapter."""
    world = tables['world']
    stage_order = {'M1': 1, 'M2': 2, 'M3': 3, 'P1': 4}
    selection_roles = {'CONTAINER_GATEWAY', 'TRANSSHIPMENT_HUB', 'FINANCE_CENTER', 'MARITIME_SERVICES',
                       'SHIPOWNING_CLUSTER', 'REGIONAL_GATEWAY'}
    for city in world.values():
        cid = city['id']
        check(bool(city.get('hub_roles')), cid + ': hub roles')
        check('availability' in city and 'geo_position' in city, cid + ': availability and map position')
        for item in city.get('selection_basis', []):
            check(item['source_id'] in source_ids, cid + ': selection basis source ' + item['source_id'])
        if set(city.get('hub_roles', [])) & selection_roles and 'PRODUCTION_ORIGIN' not in city.get('hub_roles', []):
            check(len(city.get('selection_basis', [])) >= 1, cid + ': hub chosen by a cited indicator')
        if city.get('availability', {}).get('status') == 'MAP_PREVIEW':
            check(city['venue_ids'] == [] and city['availability']['stage'] == 'P1',
                  cid + ': preview hubs have no playable content yet')
    for scenario in tables['scenarios'].values():
        stage = stage_order.get(scenario['stage'])
        for city_id in scenario.get('city_ids', []):
            avail = world[city_id]['availability']
            check(stage is None or stage_order[avail['stage']] <= stage,
                  f"{scenario['id']}: {city_id} opens no later than the scenario stage")
            check(avail['status'] != 'MAP_PREVIEW', f"{scenario['id']}: {city_id} is playable or planned")
    gates = documents['world'].get('sea_gates', [])
    index(gates, 'sea gates')
    check(len(gates) == 6, 'sea gates: expected 6')
    for gate in gates:
        check(gate['geo_position']['use'] == 'map_display_only', gate['id'] + ': display-only gate position')
    check(sum(c['availability']['chapter'] == 1 for c in world.values()) == 6, 'chapter 1 keeps the 6 East Asian hubs')


def main():
    documents = {}
    for file in sorted((ROOT / 'data').glob('*.json')):
        data = json.loads(file.read_text(encoding='utf-8'))
        documents[file.stem] = data
        schema = read('schemas/' + file.stem + '.schema.json')
        shape(data, schema, file.name)
    tables = {name: index(doc['items'], name)
              for name, doc in documents.items() if 'items' in doc}
    curriculum = index(documents['curriculum_links']['links'], 'curriculum')
    source_ids = set(tables['sources'])
    expected_counts = {'world': 20, 'goods': 8, 'routes': 6, 'employees': 6,
                       'market_offers': 6, 'scenarios': 7, 'securities': 4,
                       'events': 6, 'culture_activities': 6, 'venues': 5, 'contacts': 2,
                       'observed_fx_sample': 10, 'characters': 60, 'organization': 7,
                       'job_templates': 6, 'team_synergies': 3, 'ui_screens': 15}
    for name, count in expected_counts.items():
        check(len(tables[name]) == count, f'{name}: expected {count}')
    check(len(curriculum) == 47, 'curriculum: expected 47')
    for group, prefix, count in [('social','SOC',18), ('ethics','ETH',6), ('science','SCI',23)]:
        check(sum(key.startswith(prefix) for key in curriculum) == count,
              f'curriculum {group}: count')
    for item in curriculum.values():
        check(item['pdf_page'] == item['printed_page'] + 6, item['id'] + ': page offset')
        check(item['source_id'] in source_ids, item['id'] + ': unknown source')
    curriculum_doc = documents['curriculum_links']
    check(hashlib.sha256((ROOT/curriculum_doc['source_document']).read_bytes()).hexdigest()
          == curriculum_doc['source_document_sha256'], 'curriculum: source document hash')

    single_refs = {'city_id':'world', 'home_city_id':'world', 'location_city_id':'world',
                   'from_city_id':'world', 'to_city_id':'world', 'venue_id':'venues',
                   'destination_city_id':'world',
                   'good_id':'goods', 'route_id':'routes'}
    plural_refs = {'city_ids':'world', 'venue_ids':'venues', 'venue_template_ids':'venues',
                   'contact_ids':'contacts', 'activity_ids':'culture_activities',
                   'event_ids':'events', 'employee_ids':'employees',
                   'offer_ids':'market_offers', 'security_ids':'securities'}
    for name, doc in documents.items():
        for obj in walk(doc):
            for ref in obj.get('source_refs', []):
                check(ref in source_ids, f'{name}: source {ref}')
            for ref in obj.get('curriculum_refs', []):
                check(ref in curriculum, f'{name}: curriculum {ref}')
            for key, table in single_refs.items():
                if key in obj and isinstance(obj[key], str) and '{' not in obj[key]:
                    check(obj[key] in tables[table], f'{name}: {key}={obj[key]}')
            for key, table in plural_refs.items():
                refs = obj.get(key, [])
                # Explanatory merge rules may use the same field name as prose.
                if not isinstance(refs, list):
                    continue
                for ref in refs:
                    if isinstance(ref, str) and '{' not in ref:
                        check(ref in tables[table], f'{name}: {key}={ref}')

    for city in tables['world'].values():
        for venue_id in city['venue_ids']:
            check(tables['venues'][venue_id]['city_id'] == city['id'],
                  city['id'] + ': venue location mismatch')
        if 'map_position' in city:
            for coordinate in city['map_position']['x'], city['map_position']['y']:
                check(0 <= coordinate <= 1, city['id'] + ': concept map coordinate')
    for good in tables['goods'].values():
        check(good['mass_kg_per_unit'] > 0 and good['volume_m3_per_unit'] > 0,
              good['id'] + ': physical fixture dimensions')
        check(good['hs_code'] is None and good['hs_mapping_status'] == 'NOT_VERIFIED',
              good['id'] + ': unresolved HS must remain explicit')
    for route in tables['routes'].values():
        check(route['transit_days'] > 0 and route['departure_interval_days'] > 0,
              route['id'] + ': time')
        check(route['capacity_kg'] > 0 and route['capacity_m3'] > 0,
              route['id'] + ': capacity')
    # Characters: real animals or mythic beasts only; mythic ones carry an interpretation note.
    for character in tables['characters'].values():
        check(character['creature_kind'] in {'animal', 'myth_inspired'},
              character['id'] + ': no invented composite creatures')
        if character['creature_kind'] == 'myth_inspired':
            check(bool(character.get('myth_interpretation_note')), character['id'] + ': myth interpretation note')
    # Country collection: encounter region is where you first meet a companion, not a nationality.
    countries = {city['country_code'] for city in tables['world'].values()}
    names_seen, tags_seen = set(), set()
    for character in tables['characters'].values():
        cid = character['id']
        enc = character['encounter']
        if enc['country_code'] is not None:
            check(enc['country_code'] in countries, cid + ': encounter country is a port country')
            check(tables['world'][enc['city_id']]['country_code'] == enc['country_code'], cid + ': encounter city in country')
        else:
            check(enc['category'] == 'global_myth', cid + ': only global myth motifs have no encounter country')
        check(character['regional_background']['nationality'] is None, cid + ': no nationality')
        if enc['category'] in {'representative_animal', 'rare_animal'} or (character['creature_kind'] == 'animal' and enc['category'] != 'starter'):
            check('conservation' in character, cid + ': real animal conservation record')
        if enc['category'] == 'rare_animal':
            check(character['recruitment']['mode'] == 'QUEST_GUARANTEED' and not character['recruitment']['random_draw_required'],
                  cid + ': rare animals join through partnership stories, not draws')
        check(character['name_ko'] not in names_seen, cid + ': unique display name')
        names_seen.add(character['name_ko'])
        tag = character['signature_trait']['candidate_effect']['trigger_tag']
        check(tag not in tags_seen, cid + ': unique trait trigger tag')
        tags_seen.add(tag)
    for employee in tables['employees'].values():
        check(employee['name_ko'] == tables['characters'][employee['id']]['name_ko'],
              employee['id'] + ': employee and character names match')
    # Map display geometry (not used for distance or transit time).
    for city in tables['world'].values():
        geo = city.get('geo_position')
        check(geo is not None and geo['use'] == 'map_display_only', city['id'] + ': map geo position')
    check_world_hubs(documents, tables, source_ids)
    route01 = tables['routes']['ROUTE01']
    points = route01['map_waypoints']['points']
    for end, city_id in ((points[0], route01['from_city_id']), (points[-1], route01['to_city_id'])):
        geo = tables['world'][city_id]['geo_position']
        check(abs(end['lat'] - geo['lat']) <= 0.2 and abs(end['lon'] - geo['lon']) <= 0.2,
              'ROUTE01 map waypoints start and end at their ports')
    config = documents['game_config']['config']
    check(config['securities_enabled'] is False and config['ipo_enabled'] is False,
          'P0 must not enable future finance automatically')
    check(tables['scenarios']['SCENARIO_CITY_CULTURE']['culture_enabled'] is True,
          'M2 culture scenario must explicitly enable activities')
    check(len([a for a in tables['culture_activities'].values() if a['stage']=='P0']) == 3,
          'expected 3 P0 cultural activities')
    hooks = {item['id'] for item in documents['content_hooks']['unlocks']}
    commands = {item['id'] for item in documents['content_hooks']['commands']}
    for event in tables['events'].values():
        for choice in event['choices']:
            check(choice['command_template']['type'] in commands, event['id'] + ': command hook')
            check(choice['command_template']['execution_status'] == 'DECLARATIVE_ONLY',
                  event['id'] + ': unimplemented command status')
    for activity in tables['culture_activities'].values():
        check(activity['duration_days'] >= 1, activity['id'] + ': real activity consumes time')
        check(activity['money_cost']['amount'] >= 0, activity['id'] + ': cost')
        check(activity['eligibility']['actor_must_be_in_city'], activity['id'] + ': location required')
        check('company_id' in activity['completion_dedupe_key_template'], activity['id'] + ': company duplicate guard')
        check('actor_id' in activity['actor_experience_dedupe_key_template'], activity['id'] + ': actor duplicate guard')
        check('contact_id' in activity['relationship_dedupe_key_template'], activity['id'] + ': relation duplicate guard')
        for effect in activity['effects']:
            check(effect['type'] in {'UNLOCK_KNOWLEDGE','UNLOCK_CONTACT_FOLLOWUP'},
                  activity['id'] + ': unexpected blanket buff')
            for unlock in effect.get('unlocks', []):
                check(unlock in hooks, activity['id'] + ': undeclared unlock')

    scenario = tables['scenarios']['SCENARIO_M1_ONE_TRADE']
    purchase = 100 * 10
    cost = purchase + 200 + purchase * .05
    expected = scenario['expected_direct_trade_result']
    check(expected['contribution_before_payroll_usd'] == 100*14-cost == 150, 'M1 arithmetic')
    check(scenario['arrival_day'] == scenario['departure_day'] + tables['routes']['ROUTE01']['transit_days'],
          'M1 time arithmetic')
    check(scenario['arrival_day'] <= scenario['delivery_deadline_day'] < scenario['cash_payment_due_day'],
          'M1 delivery and payment are separate')
    check(100*.5 <= tables['routes']['ROUTE01']['capacity_kg'] and
          100*.003 <= tables['routes']['ROUTE01']['capacity_m3'], 'M1 freight capacity')

    # Offers: goods trades carry a unit price; forwarding carries a service fee for customer-owned cargo.
    for offer in tables['market_offers'].values():
        oid = offer['id']
        check(offer['quantity_unit'] == tables['goods'][offer['good_id']]['quantity_unit'], oid + ': quantity unit matches good')
        if offer['kind'] in {'supplier', 'customer'}:
            check('unit_price' in offer and 'service_fee' not in offer, oid + ': goods offer has unit price only')
        else:
            check(offer['kind'] == 'forwarding' and 'unit_price' not in offer and 'service_fee' in offer
                  and offer.get('cargo_owner') == 'customer', oid + ': forwarding offer prices a service for customer cargo')
            check(offer['destination_city_id'] != offer['city_id'], oid + ': forwarding moves cargo between ports')
        if offer['kind'] in {'customer', 'forwarding'}:
            check(offer['valid_until_day'] < offer['delivery_deadline_day'] < offer['payment_due_day'],
                  oid + ': acceptance, delivery and payment are separate days')
    # M1 scenarios keep the M1 rule set; the M2a scenario opts into committed-outlay funds checks.
    for sid in ('SCENARIO_M1_ONE_TRADE',):
        check(tables['scenarios'][sid]['engine_rules'] == {**tables['scenarios'][sid]['engine_rules'],
              'rules_version': 'M1-rules-1', 'funds_check': 'immediate_cash', 'forwarding_enabled': False},
              sid + ': M1 rule set unchanged')
    check_m2a(tables)
    validate_cancellation(tables['scenarios'], tables['routes'])

    acceptance = read('tests/acceptance_cases.json')
    cases = acceptance['cases']
    summary = acceptance['review_summary']
    check(summary['case_count'] == len(cases), 'review_summary case_count matches cases')
    counts = {phase: sum(c['phase'] == phase for c in cases) for phase in ('P0', 'P1', 'P2')}
    check(summary['phase_case_counts'] == counts, 'review_summary phase counts match cases')
    index(cases, 'acceptance cases')
    check(len(cases) == 18, 'expected 18 acceptance specifications')
    # Reference arithmetic only. No simulation engine exists in this package.
    check(10000-1000-200+150 == tables['scenarios']['SCENARIO_M1_CANCEL_PREDEPARTURE']['expected_trade_only_usd']['cash_after'], 'cancel reference arithmetic')
    check(10000-1250+1350 == tables['scenarios']['SCENARIO_M1_DELAY_ACCEPTED']['expected_trade_only_usd']['cash_after_collection'], 'late delivery arithmetic')
    # M1 contract terms used by the engine (DESIGN, reviewed 2026-10-04).
    terms = scenario['contract_terms']
    cancel_terms = terms['pre_departure_cancellation']
    check(cancel_terms['freight_refund']['amount'] + cancel_terms['cancellation_fee']['amount']
          == tables['routes']['ROUTE01']['booking_fee']['amount'], 'M1 cancellation splits prepaid freight exactly')
    check(cancel_terms['cancellation_fee']['amount']
          == tables['scenarios']['SCENARIO_M1_CANCEL_PREDEPARTURE']['expected_trade_only_usd']['cancellation_expense'],
          'M1 cancellation fee matches cancel fixture')
    delay = tables['scenarios']['SCENARIO_M1_DELAY_ACCEPTED']
    check(100*14 - terms['late_delivery']['price_reduction']['amount'] == delay['expected_trade_only_usd']['net_revenue'],
          'M1 late reduction matches delay fixture')
    check(terms['prep_work_units'] <= tables['employees']['EMP01']['work_units_per_day']
          * (scenario['departure_day'] - scenario['booking_day']), 'M1 prep finishes before departure')
    restriction = delay['port_restriction']
    check(restriction['event_template_id'] in tables['events'], 'M1 delay restriction template')
    check(restriction['city_id'] == tables['routes']['ROUTE01']['to_city_id'], 'M1 delay restriction at destination')
    check(restriction['announce_day'] < restriction['restriction_start_day'] == scenario['arrival_day'],
          'M1 delay restriction announced before scheduled arrival')
    check(restriction['restriction_end_day'] - restriction['restriction_start_day'] + 1
          == delay['arrival_day'] - scenario['arrival_day'], 'M1 delay restriction adds the fixture delay once')
    check(100-60-5-3-4 == 28 and 90-60-5-3-4 == 18 and 28+90 == 118, 'trade reference arithmetic')
    check(100-10*3-1 == 69 and 10*4-10*3 == 10, 'stock reference arithmetic')
    check(250000*2000 == 500000000 and 1000000/1250000 == .8, 'IPO reference arithmetic')

    fx = documents['observed_fx_sample']
    check(fx['auto_load_as_operating_data'] is False, 'observed FX sample must not replace fixture')
    dates = [r['date'] for r in fx['items']]
    check(dates == sorted(set(dates)), 'observed FX: sorted unique dates')
    for row in fx['items']:
        cross = (Decimal(row['krw_per_eur']) / Decimal(row['usd_per_eur'])).quantize(
            Decimal('0.000000000001'), rounding=ROUND_HALF_EVEN)
        check(cross == Decimal(row['krw_per_usd_derived']), row['id'] + ': cross-rate arithmetic')

    rules = documents['character_rules']
    characters = tables['characters']
    attributes = {item['id'] for item in rules['attributes']}
    departments = {item['id'] for item in documents['organization']['departments']}
    check(len(attributes) == 6 and len(departments) == 3, 'attributes and departments')
    check(sum(c['release_phase'] == 'P0' for c in characters.values()) == 6, 'P0 character count')
    check(sum(c['attribute'] == 'water' and c['release_phase'] == 'P0'
              for c in characters.values()) >= 2, 'P0 attribute synergy must be attainable')
    for character in characters.values():
        cid = character['id']
        check(set(character['stats']) == set(rules['stats']), cid + ': six named stats')
        check(all(character['growth_focus'][key] in character['stats']
                  for key in ('primary_stat', 'secondary_stat')), cid + ': growth focus names existing stats')
        check(sum(character['stats'].values()) == 300, cid + ': base stat budget')
        check(all(0 <= value <= 100 for value in character['stats'].values()), cid + ': stat range')
        check(character['attribute'] in attributes, cid + ': known attribute')
        check(character['rarity_power_multiplier'] == 1, cid + ': no rarity power multiplier')
        check(character['regional_background']['country_locked'] is False, cid + ': learned region')
        check(character['assignment_policy']['deck_slot_reserves_employee'] is False,
              cid + ': draft lineup is not a reservation')
        check(character['signature_trait']['candidate_effect']['active_in_P0'] is False,
              cid + ': deferred signature trait')
    for employee in tables['employees'].values():
        check(employee['character_id'] in characters, employee['id'] + ': character link')
        check(employee['home_team_id'] in tables['organization'], employee['id'] + ': home team')
        check(employee['name_ko'] == characters[employee['character_id']]['name_ko'],
              employee['id'] + ': display identity')
    for team in tables['organization'].values():
        check(team['department_id'] in departments, team['id'] + ': department')
    for job in tables['job_templates'].values():
        check(job['home_team_id'] in tables['organization'], job['id'] + ': home team')
        check(job['affinity_attribute'] in attributes, job['id'] + ': affinity')
        check(sum(Decimal(str(v)) for v in job['stat_weights'].values()) == 1,
              job['id'] + ': stat weights sum to one')
    validate_growth(rules, characters)
    check(tables['scenarios']['SCENARIO_M2_MULTI_TRADE'].get('growth') == {'enabled': True},
          'M2 multi trade enables growth without copying numeric rules')
    check(all('growth' not in s for sid, s in tables['scenarios'].items() if sid.startswith('SCENARIO_M1_')),
          'M1 growth remains disabled')
    steps = rules['enhancement_steps']
    check(sum(s['fee_krw'] for s in steps) == 700000, 'enhancement total fee')
    check(sum(s['duration_days'] for s in steps) == 10, 'enhancement total duration')
    check(sum(s['primary_stat_gain'] for s in steps) == 15, 'enhancement total gain')
    check(all(s['xp_awarded'] == 0 for s in steps), 'no ordinary XP during enhancement')
    check(min(100, 90+15) == 100, 'final stat cap reference arithmetic')
    check(min(250, 3*100*(.9+.002*50)*1.1) == 250, 'team throughput and facility cap')
    check((Decimal('.9')+Decimal('.002')*100)*Decimal('1.1') == Decimal('1.21'),
          'max individual multiplier reference arithmetic')
    check(config['character_system_enabled'] is False and config['productivity_mode'] == 'LEGACY_FIXED',
          'M1 legacy fixture remains isolated')
    crew_scenario = tables['scenarios']['SCENARIO_CREW_M2']
    check(crew_scenario['character_system_enabled'] is True and
          crew_scenario['productivity_mode'] == 'CHARACTER_WEIGHTED', 'M2 character mode explicit')
    character_cases = read('tests/character_acceptance_cases.json')['items']
    index(character_cases, 'character acceptance cases')
    check(len(character_cases) == 8, '8 additional character acceptance specifications')
    linked_character_ids = {'CHAR-ACC-01', 'CHAR-ACC-02', 'CHAR-ACC-08'}
    for case in character_cases:
        if case['id'] in linked_character_ids:
            check(case['status'] == 'EXECUTABLE_ENGINE_TEST_LINKED' and
                  case.get('engine_test_ref') == 'src/engine/m2a-growth.test.ts',
                  case['id'] + ': linked growth engine test')
        else:
            check(case['status'] == 'SPECIFICATION_NOT_EXECUTED', case['id'] + ': unimplemented specification')
    check(sum(c['status'] == 'EXECUTABLE_ENGINE_TEST_LINKED' for c in character_cases) == 3,
          '3 character specifications linked; 5 remain unexecuted')

    for file in sorted((ROOT/'references').glob('*.json')):
        obj=json.loads(file.read_text(encoding='utf-8'))
        if 'observations' in obj:
            check(len(obj['observations']) == 12, file.name + ': expected 12 observations')
            index(obj['observations'],file.name)
    manifest=read('MANIFEST.json')
    for item in manifest['files']:
        file=ROOT/item['path']
        check(file.is_file(), 'missing manifest file '+item['path'])
        if file.is_file():
            check(hashlib.sha256(file.read_bytes()).hexdigest()==item['sha256'],
                  'hash mismatch '+item['path'])
    if ERRORS:
        print('\n'.join('FAIL '+message for message in ERRORS))
        print(f'{len(ERRORS)} errors; {CHECKS} checks')
        return 1
    print(f'PASS: {len(documents)} data documents; {CHECKS} structural/reference/arithmetic checks')
    print('26 acceptance specifications included (18 core + 8 character); this validator does not run engine tests (npm test).')
    print('Character specifications: 3 linked to engine tests; 5 remain unexecuted specifications.')
    print('Game fixtures are DESIGN; ECB sample is OBSERVED_AND_DERIVED and import-only.')
    print('Economic calibration and playtesting are pending.')
    return 0


if __name__=='__main__':
    sys.exit(main())
