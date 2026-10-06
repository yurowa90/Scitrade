import { describe, expect, it } from 'vitest';
import { loadScenario, SCENARIO_IDS } from '../content/scenario';
import rules from '../../data/character_rules.json';
import fixture from './fixtures/save-v4-m2.json';
import { createGame } from './engine';
import { awardTaskCompletion } from './growth';
import { deserializeSave, SaveError, serializeSave } from './save';
import { checkSaveShape } from './save-shape';
import { runDays } from './testkit';
import type { CultureState } from './types';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const emptyCulture: CultureState = { reports: [], experiences: [], relationEvents: [] };
const records: CultureState = {
  reports: [{ key: 'REPORT', activityId: 'CA01', topicId: 'KT_BUSAN_PACKAGING', cityId: 'BUSAN',
    sourceContactIds: ['NPC_MARKET'], reporterEmployeeId: 'EMP01', taskId: 'CULTURE-TEST', day: 1,
    contentRevision: '1', status: 'UNVERIFIED' }],
  experiences: [{ key: 'EXPERIENCE', employeeId: 'EMP01', activityId: 'CA01', topicId: 'KT_BUSAN_PACKAGING',
    cityId: 'BUSAN', countryCode: 'KR', contentRevision: '1', completedTaskId: 'CULTURE-TEST', verifiedDay: 1 }],
  relationEvents: [{ key: 'RELATION', employeeId: 'EMP01', contactId: 'NPC_MARKET', activityId: 'CA01',
    cityId: 'BUSAN', contentRevision: '1', taskId: 'CULTURE-TEST', day: 1, kind: 'SHARED_ACTIVITY' }],
};
const load = (file: unknown) => deserializeSave(JSON.stringify(file), { dataVersion: config.dataVersion });
const freshFile = () => JSON.parse(serializeSave(createGame(config)));
function reject(file: unknown, path: string) {
  expect(() => load(file)).toThrow(SaveError);
  expect(() => load(file)).toThrow(path);
}

describe('실제 판본 4 저장 보존', () => {
  it('경험치·지급 기록·진행 업무와 culture 이외의 전체 상태를 그대로 복원한다', () => {
    expect(fixture.formatVersion).toBe(4);
    expect(fixture.state).not.toHaveProperty('culture');
    expect(fixture.state.employees.map(e => e.xp)).toEqual([10, 70, 0, 0, 0, 0]);
    expect(Object.keys(fixture.state.xpAwards).some(k => k.endsWith('|TRAINING_XP'))).toBe(true);
    expect(Object.keys(fixture.state.xpAwards).some(k => k.endsWith('|TASK_COMPLETION_XP'))).toBe(true);
    expect(fixture.state.tasks.some(t => t.status === 'RUNNING')).toBe(true);
    expect(fixture.state.recruitment.candidates.some(c => c.stage === 'QUEST_RUNNING')).toBe(true);
    expect(fixture.state.invoices.some(i => i.status === 'OUTSTANDING')).toBe(true);
    const restored = load(fixture);
    expect(restored.employees.map(e => e.xp)).toEqual(fixture.state.employees.map(e => e.xp));
    for (const key of ['xpAwards', 'xpAwardAmounts', 'tasks', 'ledger', 'recruitment', 'processedCommands'] as const) {
      expect(restored[key], key).toEqual(fixture.state[key]);
    }
    const { culture, ...originalFields } = restored;
    expect(originalFields).toEqual(fixture.state);
    expect(culture).toEqual(emptyCulture);
  });

  it('3일 더 진행해 영입 의뢰를 끝내고 경험치를 정확히 한 번 지급한다', () => {
    const restored = load(fixture);
    const before = structuredClone(restored);
    const key = 'EMP02|TASK-DONE-RECRUIT-EMP04|TASK_COMPLETION_XP';
    expect(restored.xpAwards[key]).toBeUndefined();
    const next = runDays(restored, config, restored.day + 2).state;
    expect(restored).toEqual(before);
    expect(next.day).toBe(11);
    expect(next.tasks.find(t => t.id === 'RECRUIT-EMP04')).toMatchObject({ status: 'DONE', completedDay: 9 });
    expect(next.employees.map(e => e.xp)).toEqual([10, 80, 0, 0, 0, 0]);
    expect(next.xpAwards).toEqual({ ...restored.xpAwards, [key]: true });
    expect(next.xpAwardAmounts).toEqual({ ...restored.xpAwardAmounts, [key]: 10 });
    const again = load(JSON.parse(serializeSave(next)));
    const snapshot = structuredClone(again);
    expect(awardTaskCompletion(again, config, again.tasks.find(t => t.id === 'RECRUIT-EMP04')!)).toBe(false);
    expect(again).toEqual(snapshot);
    expect(runDays(again, config, 13).state.xpAwardAmounts).toEqual(next.xpAwardAmounts);
  });

  it('같은 저장의 판본 숫자만 3으로 바꾸면 시작 경험치로 돌아가는 대조군이다', () => {
    const restored = load({ ...fixture, formatVersion: 3 });
    expect(restored.employees.map(e => e.xp)).toEqual(config.employees.map(e => e.growth?.startXp ?? 0));
    expect(restored.xpAwards).toEqual({});
    expect(restored.xpAwardAmounts).toEqual({});
    expect(restored.tasks).toEqual(fixture.state.tasks);
    expect(restored.culture).toEqual(emptyCulture);
  });

  it('판본 4에 미리 적힌 culture도 빈 기록으로 덮고 입력 객체를 바꾸지 않는다', () => {
    const file = { ...fixture, state: { ...fixture.state, culture: records } };
    const before = structuredClone(file);
    expect(load(file)).toEqual(load(fixture));
    expect(file).toEqual(before);
  });
});

describe('판본 5와 이전 판본 읽기', () => {
  it.each(SCENARIO_IDS)('%s의 culture 설정·초깃값은 비어 있고 판본 5로 왕복한다', id => {
    const cfg = loadScenario(id);
    expect(cfg.culture).toBeNull();
    const s = createGame(cfg);
    expect(s.culture).toEqual(emptyCulture);
    const text = serializeSave(s);
    expect(JSON.parse(text).formatVersion).toBe(5);
    expect(deserializeSave(text, { dataVersion: cfg.dataVersion })).toEqual(s);
  });

  it('진행한 상태의 판본 5 왕복도 전체 깊은 비교로 같다', () => {
    const s = runDays(load(fixture), config, 10).state;
    expect(load(JSON.parse(serializeSave(s)))).toEqual(s);
  });

  it.each([1, 2, 3, 4])('판본 %i를 읽을 때 해당 판본 이후의 필드만 복원한다', version => {
    const cfg = loadScenario('SCENARIO_M1_ONE_TRADE');
    const s = createGame(cfg);
    const file = JSON.parse(serializeSave(s));
    file.formatVersion = version;
    delete file.state.culture;
    if (version <= 3) {
      delete file.state.xpAwards;
      delete file.state.xpAwardAmounts;
      for (const e of file.state.employees) delete e.xp;
    }
    if (version <= 2) {
      delete file.state.recruitment;
      for (const e of file.state.employees) delete e.availableFromDay;
    }
    expect(deserializeSave(JSON.stringify(file), { dataVersion: cfg.dataVersion })).toEqual(s);
  });

  it.each([0, 6, '5', 5.5])('허용 목록 밖 판본 %s는 거절한다', version => {
    const file = freshFile();
    file.formatVersion = version;
    reject(file, '지원하지 않는 저장 형식 판본');
  });
});

describe('culture 모양·불변 조건', () => {
  it('경험 근거는 character_rules의 여섯 필드를 모두 보존한다', () => {
    const names = rules.country_policy.evidence_fields;
    const camel = names.map(name => name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()));
    expect(Object.keys(records.experiences[0]!)).toEqual(expect.arrayContaining(camel));
  });

  it('세 기록의 완전한 모양은 허용한다', () => {
    const s = createGame(config);
    s.culture = structuredClone(records);
    expect(() => checkSaveShape(s)).not.toThrow();
  });

  it.each([undefined, null, []])('culture 객체 손상 %s의 경로를 보인다', value => {
    const file = freshFile();
    file.state.culture = value;
    reject(file, 'state.culture');
  });

  for (const group of ['reports', 'experiences', 'relationEvents'] as const) {
    it.each([undefined, null, {}])(`${group} 배열 손상 %s의 경로를 보인다`, value => {
      const file = freshFile();
      file.state.culture[group] = value;
      reject(file, `state.culture.${group}`);
    });
    for (const field of Object.keys(records[group][0]!)) {
      it.each(['누락', '잘못된 타입'])(`${group}.${field} %s을 거절한다`, damage => {
        const file = freshFile();
        file.state.culture = structuredClone(records);
        if (damage === '누락') delete file.state.culture[group][0][field];
        else file.state.culture[group][0][field] = typeof file.state.culture[group][0][field] === 'number' ? '1' : 1;
        reject(file, `state.culture.${group}[0].${field}`);
      });
    }
    it(`${group} 한 건도 culture가 꺼져 있으면 거절한다`, () => {
      const file = freshFile();
      file.state.culture[group] = structuredClone(records[group]);
      expect(() => checkSaveShape(file.state)).not.toThrow();
      reject(file, 'state.culture: 현지 활동이 꺼진 시나리오에는 기록이 없어야 합니다');
    });
  }

  it.each([['reports', 'status', 'VERIFIED'], ['relationEvents', 'kind', 'FRIEND']] as const)
  ('%s.%s 열거값 %s를 거절한다', (group, field, value) => {
    const file = freshFile();
    file.state.culture = structuredClone(records);
    file.state.culture[group][0][field] = value;
    reject(file, `state.culture.${group}[0].${field}`);
  });

  it('출처 인물 배열의 잘못된 원소도 경로로 거절한다', () => {
    const file = freshFile();
    file.state.culture = structuredClone(records);
    file.state.culture.reports[0].sourceContactIds = [1];
    reject(file, 'state.culture.reports[0].sourceContactIds[0]');
  });
});
