import { describe, expect, it, vi } from 'vitest';
import { loadScenario } from '../content/scenario';
import * as engine from '../engine/engine';
import { serializeSave } from '../engine/save';
import { advanceDay, initialUiState, loadSaveText } from './session';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const initial = () => engine.openDay(engine.createGame(config), config).state;

describe('화면 초기화와 저장 읽기', () => {
  it('계획·대기 명령·선택·열린 영역을 새 객체로 비운다', () => {
    const old = initialUiState();
    old.plans.x = { employeeId: 'EMP02' }; old.touchedPlans.add('x'); old.selectedCard = 'EMP02';
    old.recruitSelections.x = 'EMP01'; old.detailId = 'EMP01'; old.interviewId = 'EMP04';
    old.pending.push({ id: 'T', type: 'START_TRAINING', employeeId: 'EMP01' }); old.growthNotices.push('알림');
    const next = initialUiState();
    expect(next.plans).toEqual({}); expect(next.touchedPlans.size).toBe(0);
    expect(next.pending).toEqual([]); expect(next.recruitSelections).toEqual({});
    expect([next.selectedCard, next.detailId, next.interviewId, next.flash]).toEqual([null, null, null, null]);
    expect(next.crewFilter).toBe('all'); expect(next.growthNotices).toEqual([]);
    expect(next.plans).not.toBe(old.plans);
  });
  it('설정과 규칙을 확인하고 저장을 열며 손상을 한국어로 거절한다', () => {
    const state = initial();
    expect(loadSaveText(serializeSave(state))).toEqual({ config, state });
    for (const text of ['{', 'null', '{}', JSON.stringify({ scenarioId: 'UNKNOWN' })]) {
      const result = loadSaveText(text);
      expect(result).toHaveProperty('errorKo');
      expect('errorKo' in result && result.errorKo).toMatch(/[가-힣]/);
    }
    const file = JSON.parse(serializeSave(state)); file.state.employees[0].xp = -1;
    expect(loadSaveText(JSON.stringify(file))).toHaveProperty('errorKo');
    file.rulesVersion = 'wrong';
    expect(loadSaveText(JSON.stringify(file))).toHaveProperty('errorKo');
  });
  it('하루 확정 예외는 상태와 명령을 유지하며 알림으로 돌려준다', () => {
    const state = initial(), before = structuredClone(state);
    const commands = [{ id: 'T', type: 'START_TRAINING' as const, employeeId: 'EMP01' }];
    const spy = vi.spyOn(engine, 'commitDay').mockImplementation(() => { throw new Error('검증 실패'); });
    try { expect(advanceDay(state, config, commands)).toEqual({ errorKo: '하루 진행에 실패했습니다: 검증 실패' }); }
    finally { spy.mockRestore(); }
    expect(state).toEqual(before); expect(commands).toHaveLength(1);
  });
});
