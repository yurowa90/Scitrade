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
    expected_counts = {'world': 6, 'goods': 8, 'routes': 6, 'employees': 6,
                       'market_offers': 2, 'scenarios': 6, 'securities': 4,
                       'events': 6, 'culture_activities': 6, 'venues': 5, 'contacts': 2,
                       'observed_fx_sample': 10, 'characters': 12, 'organization': 7,
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
    # Map display geometry (not used for distance or transit time).
    for city in tables['world'].values():
        geo = city.get('geo_position')
        check(geo is not None and geo['use'] == 'map_display_only', city['id'] + ': map geo position')
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

    cases = read('tests/acceptance_cases.json')['cases']
    index(cases, 'acceptance cases')
    check(len(cases) == 14, 'expected 14 acceptance specifications')
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
    for threshold in rules['xp_thresholds']:
        level = threshold['level']
        check(threshold['cumulative_xp'] == 50*(level-1)*level, 'XP threshold arithmetic')
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
    check(all(c['status'] == 'SPECIFICATION_NOT_EXECUTED' for c in character_cases),
          'character cases are not claimed to be engine test results')

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
    print('22 acceptance specifications included (14 core + 8 character); engine tests were NOT run.')
    print('Game fixtures are DESIGN; ECB sample is OBSERVED_AND_DERIVED and import-only.')
    print('Economic calibration and playtesting are pending.')
    return 0


if __name__=='__main__':
    sys.exit(main())
