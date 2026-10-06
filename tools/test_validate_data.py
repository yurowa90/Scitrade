"""자료 검사 회귀 시험: 영입 필수 키 누락을 예외 대신 검사 실패로 보고한다."""
import copy
import json
import unittest
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
        validator.check_culture(tables, cases)
        return list(validator.ERRORS)

    def test_generalization_finding_rejected(self):
        for word in ('부산 사람', '부산 시민', '한국인', '한국 사람', '한국 소비자', '국민', '상인들은'):
            with self.subTest(word=word):
                tables, cases = self.fixtures()
                tables['culture_activities']['CA01']['report_ko']['finding_ko'] = word + ' 모두 그렇다.'
                self.assertTrue(any('일반화 금지어' in e for e in self.errors(tables, cases)))

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


if __name__ == '__main__':
    unittest.main()
