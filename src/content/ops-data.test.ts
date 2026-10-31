import { afterEach, describe, expect, it, vi } from 'vitest';
import { OPS_DATA_MISSING, opsData, resetOpsDataForTest, setOpsData } from './ops-data';
import { EXPERIMENT_SCENARIO_IDS, LOADABLE_SCENARIO_IDS, M1_SCENARIO_IDS, isOperationsScenario, loadCreditProfile, loadRiskProfile, loadScenario, riskProfiles, scenarioTitle } from './scenario';
import { loadSaveText } from '../ui/session';

const original = opsData();
afterEach(() => { setOpsData(original); vi.doUnmock('./ops-data'); vi.resetModules(); });

describe('TASK-0076 운영 자료 계약', () => {
  it.each([...LOADABLE_SCENARIO_IDS, ...EXPERIMENT_SCENARIO_IDS])('가벼운 판별은 %s의 전체 설정과 같다', (id) => {
    const config = loadScenario(id);
    expect(scenarioTitle(id)).toBe(config.titleKo);
    expect(isOperationsScenario(id)).toBe(config.operations !== null);
  });
  it('미등록 운영 로더와 저장 읽기는 표지 오류를 던진다', () => {
    resetOpsDataForTest();
    for (const read of [() => loadScenario('SCENARIO_M2_OPERATIONS'), () => loadRiskProfile('R1'),
      () => loadCreditProfile('R1'), riskProfiles, () => loadSaveText('{"scenarioId":"SCENARIO_M2_OPERATIONS"}')]) {
      expect(read).toThrow(new Error(OPS_DATA_MISSING));
    }
  });
  it('미등록 기본·M1 설정과 가벼운 판별은 성공한다', () => {
    resetOpsDataForTest();
    for (const id of ['SCENARIO_M2_MULTI_TRADE', ...M1_SCENARIO_IDS] as const) {
      expect(loadScenario(id).operations).toBeNull();
      expect(scenarioTitle(id)).toBe(loadScenario(id).titleKo);
      expect(isOperationsScenario(id)).toBe(false);
    }
    expect(isOperationsScenario('SCENARIO_M2_OPS_CREDIT')).toBe(true);
  });
  it.each([false, true])('진입 모듈 재평가: 다른 자료=%s', async (different) => {
    // 등록부의 정적 인스턴스를 유지하고 진입 모듈만 다시 평가한다.
    vi.resetModules();
    vi.doMock('./ops-data', () => ({ OPS_DATA_MISSING, opsData, setOpsData }));
    const data = await import('../../data/market_rules.json');
    const value = different ? structuredClone(data.default) : data.default;
    setOpsData(value);
    if (different) await expect(import('./ops-data-entry')).rejects.toThrow('운영 자료가 이미 등록되어 있습니다.');
    else await expect(import('./ops-data-entry')).resolves.toBeDefined();
    expect(opsData()).toBe(value);
  });
});
