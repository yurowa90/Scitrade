"""자료 검사 회귀 시험: 영입 필수 키 누락을 예외 대신 검사 실패로 보고한다."""
import copy
import contextlib
import io
import tempfile
from unittest import mock
import json
import unittest
import unicodedata
from pathlib import Path
import validate_data as validator


class RecruitmentKeysTest(unittest.TestCase):
    def tables(self):
        root = Path(__file__).resolve().parents[1]
        names = ('scenarios', 'market_offers', 'goods', 'routes', 'employees', 'characters', 'venues', 'world')
        tables = {name: {item['id']: item for item in json.loads((root / 'data' / f'{name}.json').read_text())['items']}
                  for name in names}
        return tables

    def test_non_integer_signing_fee_reports_failure(self):
        for value in (None, "5", 5.0):
            with self.subTest(value=value):
                tables = self.tables()
                tables['scenarios']['SCENARIO_M2_MULTI_TRADE']['recruitment']['signing_fee_wage_days'] = value
                validator.ERRORS.clear()
                validator.check_m2a(tables)
                self.assertIn('M2a: signing_fee_wage_days는 정수여야 합니다', validator.ERRORS)

    def test_missing_recruitment_keys_report_failures(self):
        tables = self.tables()
        scenario = tables['scenarios']['SCENARIO_M2_MULTI_TRADE']
        no_block = copy.deepcopy(tables)
        del no_block['scenarios']['SCENARIO_M2_MULTI_TRADE']['recruitment']
        validator.ERRORS.clear()
        validator.check_m2a(no_block)
        self.assertTrue(validator.ERRORS)
        for key in scenario['recruitment']:
            with self.subTest(key=key):
                mutated = copy.deepcopy(tables)
                del mutated['scenarios']['SCENARIO_M2_MULTI_TRADE']['recruitment'][key]
                validator.ERRORS.clear()
                validator.check_m2a(mutated)
                self.assertTrue(validator.ERRORS)
                self.assertTrue(any(key in error for error in validator.ERRORS))


class CultureReportsTest(unittest.TestCase):
    def fixtures(self):
        root = Path(__file__).resolve().parents[1]
        names = ('scenarios', 'culture_activities', 'contacts', 'venues')
        tables = {name: {item['id']: item for item in json.loads((root / 'data' / f'{name}.json').read_text())['items']}
                  for name in names}
        cases = json.loads((root / 'tests/acceptance_cases.json').read_text())['cases']
        return tables, cases

    def errors(self, tables, cases):
        validator.ERRORS.clear()
        config = json.loads((validator.ROOT / 'data/game_config.json').read_text())['config']
        validator.check_culture(tables, cases, config['reporting_currency'], config['home_city_id'])
        return list(validator.ERRORS)

    def test_generalization_finding_rejected(self):
        for word in ('부산 사람', '부산 시민', '평택 사람', '평택 시민', '한국인', '한국 사람', '한국 소비자', '국민', '상인들은'):
            with self.subTest(word=word):
                tables, cases = self.fixtures()
                tables['culture_activities']['CA01']['report_ko']['finding_ko'] = word + ' 모두 그렇다.'
                self.assertTrue(any('일반화 금지어' in e for e in self.errors(tables, cases)))

    def test_generalization_spacing_and_normalization(self):
        for finding in ('부산사람들은 모두 그렇다.', '부산\t사람들은 모두 그렇다.',
                        '부산\n  시민들은 모두 그렇다.', unicodedata.normalize('NFD', '부산사람들은 모두 그렇다.')):
            with self.subTest(finding=finding):
                tables, cases = self.fixtures()
                tables['culture_activities']['CA01']['report_ko']['finding_ko'] = finding
                self.assertTrue(any('일반화 금지어' in e for e in self.errors(tables, cases)))

    def test_korean_doll_is_not_generalization(self):
        tables, cases = self.fixtures()
        tables['culture_activities']['CA01']['report_ko']['finding_ko'] = '한국 인형을 들여왔어요'
        self.assertEqual(self.errors(tables, cases), [])

    def test_key_template_slots(self):
        for field, required, forbidden in (
            ('completion_dedupe_key_template', ('company_id',), ('actor_id', 'contact_id')),
            ('actor_experience_dedupe_key_template', ('actor_id',), ('contact_id',)),
            ('relationship_dedupe_key_template', ('actor_id', 'contact_id'), ()),
        ):
            for slot in required + forbidden:
                with self.subTest(field=field, slot=slot):
                    tables, cases = self.fixtures()
                    activity = tables['culture_activities']['CA01']
                    if slot in required:
                        activity[field] = activity[field].replace('{' + slot + '}', slot)
                    else:
                        activity[field] += ':{' + slot + '}'
                    self.assertIn('CA01: ' + field + ' 필수·금지 키 자리 오류', self.errors(tables, cases))
            # 자리 밖의 글자는 필드가 아니므로 금지하지 않는다.
            tables, cases = self.fixtures()
            tables['culture_activities']['CA01'][field] += ':actor_id:contact_id'
            self.assertEqual(self.errors(tables, cases), [])

    def test_activity_fee_requires_payroll_currency(self):
        tables, cases = self.fixtures()
        tables['culture_activities']['CA01']['money_cost']['currency'] = 'USD'
        self.assertIn('CA01: 현지 활동비는 급여 통화(KRW) 필요', self.errors(tables, cases))

    def test_culture_schema_constraints(self):
        schema = json.loads((validator.ROOT / 'schemas/scenarios.schema.json').read_text())['properties']['items']['items']['properties']['culture']
        for field, value, error in (('data_basis', 'OBSERVED', 'enum'),
                                    ('activity_ids', [], 'minItems'),
                                    ('activity_ids', ['CA01', 'CA01'], 'uniqueItems')):
            with self.subTest(field=field, value=value):
                tables, _ = self.fixtures()
                block = tables['scenarios']['SCENARIO_M2_MULTI_TRADE']['culture']
                block[field] = value
                validator.ERRORS.clear()
                validator.shape(block, schema, 'culture')
                self.assertIn('culture/' + field + ': ' + error, validator.ERRORS)

    def test_any_culture_block_requires_enabled(self):
        for enabled in (False, None):
            with self.subTest(enabled=enabled):
                tables, cases = self.fixtures()
                scenario = tables['scenarios']['SCENARIO_M1_ONE_TRADE']
                scenario['culture'] = copy.deepcopy(tables['scenarios']['SCENARIO_M2_MULTI_TRADE']['culture'])
                scenario['culture_enabled'] = enabled
                self.assertIn(scenario['id'] + ': culture 블록은 culture_enabled 필요', self.errors(tables, cases))

    def test_generalization_denial_allowed(self):
        tables, cases = self.fixtures()
        tables['culture_activities']['CA01']['report_ko']['not_claimed_ko'] = '부산 사람·부산 시민·한국인·한국 사람·한국 소비자·국민·상인들은 모두 그렇다는 뜻이 아니다.'
        self.assertEqual(self.errors(tables, cases), [])

    def test_missing_report_rejected(self):
        tables, cases = self.fixtures()
        del tables['culture_activities']['CA01']['report_ko']
        self.assertEqual(sum('report_ko.' in e for e in self.errors(tables, cases)), 4)
        for key in ('finding_ko', 'scope_ko', 'not_claimed_ko', 'open_question_ko'):
            with self.subTest(key=key):
                tables, cases = self.fixtures()
                tables['culture_activities']['CA01']['report_ko'][key] = '  '
                self.assertTrue(any('report_ko.' + key in e for e in self.errors(tables, cases)))


class HomeAndScheduleTest(unittest.TestCase):
    def fixtures(self):
        names = ('world', 'routes', 'sources')
        return {name: {item['id']: item for item in validator.read('data/' + name + '.json')['items']}
                for name in names}

    def test_home_and_weekday_schedules_pass(self):
        tables = self.fixtures()
        validator.ERRORS.clear()
        validator.check_home_city(validator.read('data/game_config.json')['config'], tables['world'])
        validator.check_route_schedules(tables['routes'], set(tables['sources']))
        self.assertEqual(validator.ERRORS, [])

    def test_home_allows_shared_rank_words(self):
        # 상하이에도 '4위'가 있지만 평택 자기 순위(4위·5위)는 막지 않는다.
        tables = self.fixtures()
        validator.ERRORS.clear()
        validator.check_home_city({'home_city_id': 'PYEONGTAEK'}, tables['world'])
        self.assertEqual(validator.ERRORS, [])
        self.assertIn('4위', tables['world']['PYEONGTAEK']['hub_note_ko'])

    def test_home_id_must_exist(self):
        validator.ERRORS.clear()
        validator.check_home_city({'home_city_id': 'UNKNOWN'}, self.fixtures()['world'])
        self.assertIn('본사: home_city_id가 world에 있어야 합니다', validator.ERRORS)

    def test_home_rejects_other_hub_facts(self):
        for word in ('7위', '환적 화물', 'TRANSSHIPMENT', '57%'):
            with self.subTest(word=word):
                tables = self.fixtures()
                tables['world']['PYEONGTAEK']['hub_note_ko'] += word
                validator.ERRORS.clear()
                validator.check_home_city({'home_city_id': 'PYEONGTAEK'}, tables['world'])
                self.assertIn('본사: 다른 거점 고유 문구 ' + word, validator.ERRORS)

    def test_home_role_exempts_world_indicator(self):
        tables = self.fixtures()
        tables['scenarios'] = {}
        # 다른 지표 역할을 함께 가지더라도 본사는 교육·지역 기준으로 고를 수 있다.
        tables['world']['PYEONGTAEK']['hub_roles'].append('REGIONAL_GATEWAY')
        validator.ERRORS.clear()
        validator.check_world_hubs({'world': validator.read('data/world.json')}, tables, set(tables['sources']))
        self.assertEqual(validator.ERRORS, [])

    def test_schedule_day_mismatch_rejected(self):
        for rid, days in (('ROUTE01', 6), ('ROUTE02', 5)):
            with self.subTest(route=rid):
                tables = self.fixtures()
                tables['routes'][rid]['transit_days'] = days
                validator.ERRORS.clear()
                validator.check_route_schedules(tables['routes'], set(tables['sources']))
                self.assertIn(rid + ': 운송일수와 요일 차이 불일치', validator.ERRORS)

    def test_schedule_unknown_source_rejected(self):
        tables = self.fixtures()
        tables['routes']['ROUTE01']['schedule_basis']['source_refs'] = ['UNKNOWN']
        validator.ERRORS.clear()
        validator.check_route_schedules(tables['routes'], set(tables['sources']))
        self.assertIn('ROUTE01: 요일표 출처 없음 UNKNOWN', validator.ERRORS)

    def test_schedule_invalid_weekday_rejected(self):
        tables = self.fixtures()
        tables['routes']['ROUTE01']['schedule_basis']['departure_weekday'] = 'UNKNOWN'
        validator.ERRORS.clear()
        validator.check_route_schedules(tables['routes'], set(tables['sources']))
        self.assertIn('ROUTE01: 출항·접안 요일 필요', validator.ERRORS)

    def test_city_home_mapping_reads_config(self):
        helper = CultureReportsTest()
        tables, cases = helper.fixtures()
        # 본사 대응 검사는 특정 도시 ID를 하드코딩하지 않는다.
        for case in cases:
            if case['id'] in ('P0-CITY-01', 'P0-CITY-02', 'P0-CITY-03', 'P0-CITY-04'):
                case['engine_fixture_mapping']['CITY_HOME'] = 'SHANGHAI'
        validator.ERRORS.clear()
        validator.check_culture(tables, cases, 'KRW', 'SHANGHAI')
        self.assertEqual(validator.ERRORS, [])


def data_documents():
    return copy.deepcopy({f.stem: json.loads(f.read_text(encoding='utf-8'))
                          for f in (validator.ROOT / 'data').glob('*.json')})


class AcceptanceLinkTest(unittest.TestCase):
    def setUp(self):
        self.core = copy.deepcopy(validator.read('tests/acceptance_cases.json'))
        self.character = copy.deepcopy(validator.read('tests/character_acceptance_cases.json'))
        self.cases = self.core['cases'] + self.character['items']
        self.linked = next(c for c in self.cases if isinstance(c.get('engine_test_ref'), str))
        validator.ERRORS.clear()

    def summary(self):
        validator.ERRORS.clear()
        validator.check_acceptance_summary(self.core, self.character)
        return validator.ERRORS

    def fake_titles(self, text, names):
        case = copy.deepcopy(self.linked)
        for key in ('ui_test_ref', 'ui_test_names', 'unexecuted_assertions'):
            case.pop(key, None)
        case.update(engine_test_ref='src/engine/fake.test.ts', engine_test_names=names)
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            file = root / case['engine_test_ref']
            file.parent.mkdir(parents=True)
            file.write_text(text, encoding='utf-8')
            validator.ERRORS.clear()
            validator.check_test_refs([case], root)
        return list(validator.ERRORS)

    def test_current_links_pass(self):
        validator.check_test_refs(self.core['cases'])
        validator.check_test_refs(self.character['items'])
        validator.check_acceptance_summary(self.core, self.character)
        self.assertEqual(validator.ERRORS, [])

    def test_missing_test_file_rejected(self):
        self.linked['engine_test_ref'] = 'src/engine/no-such.test.ts'
        validator.check_test_refs(self.cases)
        self.assertIn(self.linked['id'] + ': engine_test_ref 파일 없음 src/engine/no-such.test.ts', validator.ERRORS)

    def test_missing_test_name_rejected(self):
        self.linked['engine_test_names'][0] += ' 없음'
        validator.check_test_refs(self.cases)
        self.assertIn(self.linked['id'] + ': engine 시험 이름 없음 ' + self.linked['engine_test_names'][0], validator.ERRORS)

    def test_todo_skip_comment_and_prefixed_calls_are_not_titles(self):
        cid = self.linked['id']
        names = [cid + ' ' + name for name in ('할 일', '건너뜀', '엑스', '주석', '묶음 주석', '반복', '정상')]
        text = '\n'.join((f"it.todo('{names[0]}')", f"describe.skip('{names[1]}', () => {{}})",
                          f"xit('{names[2]}', () => {{}})", f"// it('{names[3]}', () => {{}})",
                          f"/* describe('{names[4]}', () => {{}}) */", f"it.each([1])('{names[5]}', () => {{}})",
                          f"describe('{names[6]}', () => {{}})"))
        errors = self.fake_titles(text, names)
        for name in names[:-1]:
            with self.subTest(name=name):
                self.assertIn(f'{cid}: engine 시험 이름 없음 {name}', errors)
        self.assertNotIn(f'{cid}: engine 시험 이름 없음 {names[-1]}', errors)

    def test_title_without_case_id_rejected(self):
        errors = self.fake_titles("describe('정상 제목', () => {})", ['정상 제목'])
        self.assertIn(self.linked['id'] + ': engine_test_names에 사례 ID가 든 이름 필요', errors)

    def test_template_title_rejected(self):
        name = self.linked['id'] + ' ${timing}'
        errors = self.fake_titles('it(`' + name + '`, () => {})', [name])
        self.assertIn(self.linked['id'] + ': engine 시험 이름은 고정 문자열이어야 함 ' + name, errors)

    def test_unlinked_case_requires_reason(self):
        case = next(c for c in self.cases if c['engine_test_ref'] is None)
        del case['unlinked_reason_ko']
        validator.check_test_refs(self.cases)
        self.assertIn(case['id'] + ': 연결 없는 사례는 unlinked_reason_ko 필요', validator.ERRORS)
        case['engine_test_names'] = [case['id'] + ' 남은 이름']
        validator.ERRORS.clear()
        validator.check_test_refs(self.cases)
        self.assertIn(case['id'] + ': 연결 없는 사례에 engine_test_names가 남음', validator.ERRORS)
        del case['engine_test_ref']
        validator.ERRORS.clear()
        validator.check_test_refs(self.cases)
        self.assertIn(case['id'] + ': engine_test_ref 키 필요', validator.ERRORS)

    def test_todo_link_checked(self):
        case = next(c for c in self.cases if any('todo_test_name' in a for a in c.get('unexecuted_assertions', [])))
        assertion = next(a for a in case['unexecuted_assertions'] if 'todo_test_name' in a)
        assertion['todo_test_name'] += ' 없음'
        validator.check_test_refs(self.cases)
        self.assertIn(case['id'] + ': 미실행 단언의 할 일 시험 없음 ' + assertion['todo_test_name'], validator.ERRORS)

    def test_summary_and_status_must_match(self):
        for kind in ('engine', 'ui'):
            self.core['review_summary'][kind + '_linked_case_count'] += 1
            self.character['summary'][kind + '_linked_case_count'] += 1
        self.character['summary']['case_count'] += 1
        self.core['status'] = 'SPECIFICATION_NOT_EXECUTED'
        self.character['status'] = 'SPECIFICATION_NOT_EXECUTED'
        case = next(c for c in self.character['items'] if c['engine_test_ref'])
        case['status'] = 'SPECIFICATION_NOT_EXECUTED'
        errors = self.summary()
        for message in (
            'review_summary engine_linked_case_count matches cases', 'review_summary ui_linked_case_count matches cases',
            'character summary case_count matches items', 'character summary engine_linked_case_count matches items',
            'character summary ui_linked_case_count matches items', 'acceptance status matches linked cases',
            'character status matches linked items', case['id'] + ': status와 engine_test_ref 연결 불일치',
        ):
            with self.subTest(message=message):
                self.assertIn(message, errors)

    def test_pass_claim_rejected(self):
        self.core['review_summary']['engine_test_pass_claim'] = True
        self.assertIn('acceptance file makes no engine pass claim', self.summary())

    def test_human_review_records(self):
        record = dict(case_id=self.cases[0]['id'], reviewed_on='2026-10-10', reviewer_ko='교사', result='일치', note_ko='')
        self.core['human_review_records'] = [record]
        self.assertEqual(self.summary(), [])
        for key, value, message in (
            ('case_id', 'NO-SUCH-CASE', '없는 사례 NO-SUCH-CASE'), ('result', '통과', 'result 오류'),
            ('reviewed_on', '10/10', 'reviewed_on 오류'), ('extra', True, '알 수 없는 키 extra'),
            ('reviewer_ko', '', 'reviewer_ko 오류'), ('note_ko', None, 'note_ko 오류'),
        ):
            with self.subTest(key=key):
                self.core['human_review_records'] = [{**record, key: value}]
                self.assertIn('사람 검토 기록 0: ' + message, self.summary())
        del self.core['human_review_records']
        self.assertIn('human_review_records 목록 필요', self.summary())

    def test_reverse_title_link(self):
        validator.check_test_title_links(self.cases)
        self.assertEqual(validator.ERRORS, [])
        unknown = next(f'P0-UNKNOWN-{i:02d}' for i in range(100) if f'P0-UNKNOWN-{i:02d}' not in {c['id'] for c in self.cases})
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            path = 'src/engine/fake.test.ts'
            file = root / path
            file.parent.mkdir(parents=True)
            file.write_text(f"describe('{unknown} 없음', () => {{}})\nit('{self.linked['id']}은 연결 없음', () => {{}})", encoding='utf-8')
            validator.ERRORS.clear()
            validator.check_test_title_links(self.cases, root)
            self.assertIn(f'{path}: 시험 제목의 사례 ID가 인수 명세에 없음 {unknown}', validator.ERRORS)
            self.assertIn(f"{path}: 시험 제목의 {self.linked['id']}가 그 사례의 시험 연결에 없음", validator.ERRORS)

    def test_path_names_and_ui_pair_validation(self):
        for path in ('/src/engine/fake.test.ts', 'src/../fake.test.ts', 'other/fake.test.ts', 'src/fake.ts', 1):
            with self.subTest(path=path):
                case = copy.deepcopy(self.linked)
                case['engine_test_ref'] = path
                validator.ERRORS.clear()
                validator.check_test_refs([case])
                self.assertIn(f"{case['id']}: engine_test_ref 경로 형식 오류 {path}", validator.ERRORS)
        for names in (None, [], '제목', [1]):
            with self.subTest(names=names):
                case = copy.deepcopy(self.linked)
                case['engine_test_names'] = names
                validator.ERRORS.clear()
                validator.check_test_refs([case])
                self.assertIn(case['id'] + ': engine_test_names 필요', validator.ERRORS)
        case = copy.deepcopy(next(c for c in self.cases if 'ui_test_ref' in c))
        for key in ('ui_test_ref', 'ui_test_names'):
            incomplete = copy.deepcopy(case)
            del incomplete[key]
            validator.ERRORS.clear()
            validator.check_test_refs([incomplete])
            self.assertIn(case['id'] + ': ui_test_ref와 ui_test_names는 함께 필요', validator.ERRORS)


class OrganizationNamesTest(unittest.TestCase):
    def setUp(self):
        self.cases = copy.deepcopy(validator.read('tests/character_acceptance_cases.json')['items'])
        self.organization = copy.deepcopy(validator.read('data/organization.json'))
        self.case = next(c for c in self.cases if 'permanent_team' in c.get('setup', {}))
        validator.ERRORS.clear()

    def test_current_names_pass(self):
        validator.check_organization_names(self.cases, self.organization)
        self.assertEqual(validator.ERRORS, [])

    def test_unknown_team_rejected(self):
        self.case['setup']['permanent_team'] = '물류팀'
        validator.check_organization_names(self.cases, self.organization)
        self.assertIn(self.case['id'] + ': organization.json에 없는 팀 이름 물류팀', validator.ERRORS)

    def test_unknown_department_rejected(self):
        self.case['setup']['department'] = '없는 부서'
        validator.check_organization_names(self.cases, self.organization)
        self.assertIn(self.case['id'] + ': organization.json에 없는 부서 이름 없는 부서', validator.ERRORS)

    def test_team_department_mismatch_rejected(self):
        setup = self.case['setup']
        setup['department'] = next(d['name_ko'] for d in self.organization['departments'] if d['name_ko'] != setup['department'])
        validator.check_organization_names(self.cases, self.organization)
        self.assertIn(f"{self.case['id']}: 팀과 부서 불일치 {setup['permanent_team']}/{setup['department']}", validator.ERRORS)


class GeneralizationPrecisionTest(unittest.TestCase):
    def fixtures(self):
        tables, cases = copy.deepcopy(CultureReportsTest().fixtures())
        block = next(s['culture'] for s in tables['scenarios'].values() if 'culture' in s)
        aid = block['activity_ids'][0]
        return tables, cases, aid

    def finding_errors(self, finding):
        tables, cases, aid = self.fixtures()
        tables['culture_activities'][aid]['report_ko']['finding_ko'] = finding
        return aid, CultureReportsTest().errors(tables, cases)

    def test_zero_width_inside_banned_word_rejected(self):
        for finding, word in (('부산\u200b사람들은 모두 그렇다.', '부산 사람'),
                              ('한\u200d국인은 모두 그렇다.', '한국인'), ('국\u2060민은 모두 그렇다.', '국민'),
                              ('상인\ufeff들은 모두 그렇다.', '상인들은'), ('부산\u00ad시민들은 모두 그렇다.', '부산 시민')):
            with self.subTest(finding=finding):
                aid, errors = self.finding_errors(finding)
                self.assertIn(aid + ': finding_ko 일반화 금지어 ' + word, errors)

    def test_public_proper_nouns_allowed(self):
        for finding in ('부산시민공원에서 상자를 봤어요.', '한국소비자원 자료를 읽었어요.', '국민연금 안내문을 봤어요.'):
            with self.subTest(finding=finding):
                _, errors = self.finding_errors(finding)
                self.assertEqual(errors, [])

    def test_proper_noun_does_not_hide_banned_word(self):
        aid, errors = self.finding_errors('부산시민공원에서 만난 부산 사람은 모두 그렇다.')
        self.assertIn(aid + ': finding_ko 일반화 금지어 부산 사람', errors)

    def test_inherited_culture_block_requires_enabled(self):
        tables, cases, _ = self.fixtures()
        child = next(s for s in tables['scenarios'].values() if s.get('base_scenario_id'))
        parent = tables['scenarios'][child['base_scenario_id']]
        parent['culture'] = copy.deepcopy(next(s['culture'] for s in tables['scenarios'].values() if 'culture' in s))
        parent['culture_enabled'] = True
        child['culture_enabled'] = False
        errors = CultureReportsTest().errors(tables, cases)
        self.assertIn(child['id'] + ': culture 블록은 culture_enabled 필요', errors)
        self.assertNotIn(parent['id'] + ': culture 블록은 culture_enabled 필요', errors)
        child['culture_enabled'] = True
        self.assertNotIn(child['id'] + ': culture 블록은 culture_enabled 필요', CultureReportsTest().errors(tables, cases))


class SourceUsageTest(unittest.TestCase):
    def setUp(self):
        self.documents = data_documents()
        self.sources = self.documents['sources']['items']
        validator.ERRORS.clear()

    def test_current_sources_pass(self):
        validator.check_sources(self.documents)
        self.assertEqual(validator.ERRORS, [])

    def test_usage_kinds(self):
        usage = validator.source_usage(self.documents)
        self.assertEqual({sid for sid, kinds in usage.items() if not kinds},
                         {s['id'] for s in self.sources if 'unreferenced_reason_ko' in s})
        self.assertIn({'design'}, usage.values())
        values = {v for file in (validator.ROOT / 'references').glob('*.json')
                  for v in validator.string_values(json.loads(file.read_text(encoding='utf-8')))}
        self.assertGreater(sum(kinds == {'references'} and sid not in values for sid, kinds in usage.items()), 0)
        self.assertGreater(sum('data' in kinds for kinds in usage.values()), 0)

    def test_unused_source_needs_reason(self):
        source = next(s for s in self.sources if 'unreferenced_reason_ko' in s)
        del source['unreferenced_reason_ko']
        validator.check_sources(self.documents)
        self.assertIn(source['id'] + ': 쓰이지 않는 출처는 unreferenced_reason_ko 필요', validator.ERRORS)

    def test_used_source_with_stale_reason_rejected(self):
        usage = validator.source_usage(self.documents)
        source = next(s for s in self.sources if 'data' in usage[s['id']])
        source['unreferenced_reason_ko'] = '낡은 표시'
        validator.check_sources(self.documents)
        self.assertIn(source['id'] + ': 쓰이는 출처에 unreferenced_reason_ko가 남음', validator.ERRORS)

    def test_unknown_superseded_by_rejected(self):
        source = next(s for s in self.sources if 'superseded_by' in s)
        source['superseded_by'] = ['NO-SUCH-SOURCE']
        validator.check_sources(self.documents)
        self.assertIn(source['id'] + ': superseded_by에 없는 출처 NO-SUCH-SOURCE', validator.ERRORS)

    def test_unused_superseded_target_rejected(self):
        source = next(s for s in self.sources if 'superseded_by' in s)
        target = next(s['id'] for s in self.sources if s['id'] != source['id'] and 'unreferenced_reason_ko' in s)
        source['superseded_by'] = [target]
        validator.check_sources(self.documents)
        self.assertIn(source['id'] + ': superseded_by의 출처도 쓰이지 않음 ' + target, validator.ERRORS)

    def test_missing_local_path_rejected(self):
        source = next(s for s in self.sources if isinstance(s.get('local_path'), str))
        source['local_path'] = 'docs/NO_SUCH_FILE.md'
        validator.check_sources(self.documents)
        self.assertIn(source['id'] + ': local_path 파일 없음 docs/NO_SUCH_FILE.md', validator.ERRORS)


class CurriculumStageTest(unittest.TestCase):
    def setUp(self):
        self.documents = data_documents()
        self.doc = self.documents['curriculum_links']
        self.curriculum = {c['id']: c for c in self.doc['links']}
        self.file, self.obj = next((f, o) for f, d in self.documents.items() if f != 'curriculum_links'
                                   for o in validator.walk(d) if o.get('stage') == 'P0' and o.get('curriculum_refs'))
        validator.ERRORS.clear()

    def test_current_pending_pairs_match(self):
        found = validator.check_curriculum_stages(self.documents, self.curriculum)
        self.assertEqual(validator.ERRORS, [])
        self.assertEqual(found, validator.PENDING_P0_CURRICULUM_LINKS)

    def test_new_p0_link_without_p0_label_rejected(self):
        ref = next(cid for cid, c in self.curriculum.items() if not any(p.startswith('P0') for p in c['priority'])
                   and cid not in self.obj['curriculum_refs'])
        self.obj['curriculum_refs'].append(ref)
        validator.check_curriculum_stages(self.documents, self.curriculum)
        self.assertIn(f"{self.file}/{self.obj['id']}: P0 항목이 P0 표지 없는 교과 연결을 가리킴 {ref}", validator.ERRORS)

    def test_stale_pending_pair_rejected(self):
        file, oid, ref = sorted(validator.PENDING_P0_CURRICULUM_LINKS)[0]
        obj = next(o for o in validator.walk(self.documents[file]) if o.get('id') == oid)
        obj['curriculum_refs'].remove(ref)
        validator.check_curriculum_stages(self.documents, self.curriculum)
        self.assertIn(f'교과 연결 미해결 목록이 낡음 {file}/{oid} {ref}', validator.ERRORS)

    def test_p0_report_label_counts_as_p0(self):
        ref = next(cid for cid, c in self.curriculum.items() if c['priority'] and all(p.startswith('P0 ') for p in c['priority'])
                   and cid not in self.obj['curriculum_refs'])
        self.obj['curriculum_refs'].append(ref)
        validator.check_curriculum_stages(self.documents, self.curriculum)
        self.assertNotIn(f"{self.file}/{self.obj['id']}: P0 항목이 P0 표지 없는 교과 연결을 가리킴 {ref}", validator.ERRORS)
        self.assertEqual(validator.ERRORS, [])

    def test_counts_read_from_data(self):
        validator.check_curriculum_counts(self.doc, self.curriculum)
        self.assertEqual(validator.ERRORS, [])
        self.doc['counts']['total'] += 1
        group = next(iter(self.doc['counts']['by_group']))
        selection = next(iter(self.doc['counts']['by_selection']))
        self.doc['counts']['by_group'][group] += 1
        self.doc['counts']['by_selection'][selection] += 1
        validator.ERRORS.clear()
        validator.check_curriculum_counts(self.doc, self.curriculum)
        for message in ('curriculum: counts.total 불일치', f'curriculum: counts.by_group.{group} 불일치',
                        f'curriculum: counts.by_selection.{selection} 불일치'):
            self.assertIn(message, validator.ERRORS)
        item = next(iter(self.curriculum.values()))
        item['group'] = next(g for g in self.doc['counts']['by_group'] if g != item['group'])
        validator.ERRORS.clear()
        validator.check_curriculum_counts(self.doc, self.curriculum)
        self.assertIn(item['id'] + ': 연결 ID 머리와 group 불일치', validator.ERRORS)

    def test_unknown_link_is_left_to_reference_check(self):
        self.obj['curriculum_refs'].append('NO-SUCH-LINK')
        validator.check_curriculum_stages(self.documents, self.curriculum)
        self.assertEqual(validator.ERRORS, [])


class AcceptanceFixtureNumbersTest(unittest.TestCase):
    def test_m1_case_matches_scenario_fixture(self):
        cases = copy.deepcopy(validator.read('tests/acceptance_cases.json')['cases'])
        scenarios = {s['id']: s for s in data_documents()['scenarios']['items']}
        validator.ERRORS.clear()
        validator.check_acceptance_fixture_numbers(cases, scenarios)
        self.assertEqual(validator.ERRORS, [])
        case = next(c for c in cases if 'expected_trade_only_usd' in scenarios.get(c.get('scenario_id'), {}))
        key = next(k for k, v in case['expected_numeric'].items() if type(v) is int)
        case['expected_numeric'][key] += 1
        validator.ERRORS.clear()
        validator.check_acceptance_fixture_numbers(cases, scenarios)
        self.assertIn(case['id'] + ': expected_numeric와 시나리오 expected_trade_only_usd 불일치', validator.ERRORS)


class MainWiringTest(unittest.TestCase):
    def test_main_calls_new_checks(self):
        names = ('check_test_refs', 'check_acceptance_summary', 'check_organization_names', 'check_sources',
                 'check_curriculum_stages', 'check_curriculum_counts', 'check_acceptance_fixture_numbers', 'check_test_title_links')
        with contextlib.ExitStack() as stack:
            mocks = {name: stack.enter_context(mock.patch.object(validator, name, wraps=getattr(validator, name))) for name in names}
            with contextlib.redirect_stdout(io.StringIO()):
                validator.ERRORS.clear()
                validator.main()
            for name, wrapped in mocks.items():
                with self.subTest(name=name):
                    self.assertGreaterEqual(wrapped.call_count, 2 if name == 'check_test_refs' else 1)


if __name__ == '__main__':
    unittest.main()
