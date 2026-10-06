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


if __name__ == '__main__':
    unittest.main()
