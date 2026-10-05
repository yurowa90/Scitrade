import { describe, expect, it } from 'vitest';
import venues from '../../data/venues.json';
import { loadScenario } from '../content/scenario';
import { commitDay, createGame, openDay, planState } from './engine';
import { levelProgress, statsFor } from './growth';
import { post } from './ledger';
import { payrollRunwayDay, trainingPreview } from './previews';
import { taskSubjectKo } from './tasks';
import type { Command, GameState, ScenarioConfig, Task } from './types';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const training: Command = { id: 'TRAIN', type: 'START_TRAINING', employeeId: 'EMP01' };
const scout: Command = { id: 'SCOUT', type: 'SCOUT_SITE', employeeId: 'EMP01', venueId: 'VEN_PORT' };
const open = (cfg = config) => openDay(createGame(cfg), cfg).state;
const emp = (s: GameState) => s.employees.find((e) => e.id === 'EMP01')!;
function debt(s: GameState, minor: number) {
  post(s.ledger, { id: 'DEBT', day: s.day, currency: 'KRW', reason: '미지급 의무 검증',
    lines: [{ account: 'CANCELLATION_EXPENSE', amount: minor }, { account: 'ACCOUNTS_PAYABLE', amount: -minor }] });
  s.obligations.push({ id: 'DEBT', currency: 'KRW', amountMinor: minor, reasonKo: '미지급 의무', incurredDay: s.day, paidDay: null });
}
function pure<T>(s: GameState, cfg: ScenarioConfig, read: () => T): T {
  const before = structuredClone(s), beforeConfig = structuredClone(cfg);
  const result = read();
  expect(s).toEqual(before);
  expect(cfg).toEqual(beforeConfig);
  return result;
}

describe('화면용 성장·업무 읽기 함수', () => {
  it('taskSubjectKo는 장소 제목·후보 이름·계약 번호·훈련 null을 반환하며 입력을 보존한다', () => {
    const s = planState(open(), config, [scout]).state;
    const task = s.tasks[0]!;
    const title = venues.items.find((v) => v.id === 'VEN_PORT')!.title_ko;
    expect(config.recruitment!.scoutSites.find((site) => site.venueId === 'VEN_PORT')!.titleKo).toBe(title);
    const cases: [Task['kind'], string | null, string | null, string | null][] = [
      ['SCOUT', 'VEN_PORT', null, title],
      ['RECRUIT_QUEST', 'EMP04', null, config.employees.find((e) => e.id === 'EMP04')!.nameKo],
      ['TRAINING', 'EMP01', null, null],
      ['EXPORT_PREP', null, 'CT001', 'CT001'], ['FORWARDING_PREP', null, 'CT002', 'CT002'],
    ];
    for (const [kind, subjectId, contractId, expected] of cases) {
      const input = { ...task, kind, subjectId, contractId };
      const before = structuredClone(input);
      expect(pure(s, config, () => taskSubjectKo(config, input))).toBe(expected);
      expect(input).toEqual(before);
    }
  });

  it('배정·바쁨·조사 완료 로그에 읽을 수 있는 대상을 사용한다', () => {
    const s = planState(open(), config, [scout]).state;
    expect(s.log.at(-1)!.textKo).toBe('귀솔에게 항만 물류단지 현장 조사 업무 배정 (1 업무 포인트)');
    expect(trainingPreview(s, config, 'EMP01').reasonKo).toContain('항만 물류단지 현장 조사');
    const done = commitDay(s, config, []).state;
    expect(done.log.some((l) => l.textKo === '귀솔: 항만 물류단지 현장 조사 완료')).toBe(true);
    const candidate = done.recruitment.candidates.find((c) => c.employeeId === 'EMP04')!;
    expect(candidate.stage).toBe('DISCOVERED');
    const quest = planState(openDay(done, config).state, config, [
      { id: 'QUEST', type: 'START_RECRUIT_QUEST', employeeId: 'EMP01', candidateId: 'EMP04' },
    ]).state;
    const name = config.employees.find((e) => e.id === 'EMP04')!.nameKo;
    expect(quest.log.at(-1)!.textKo).toContain(`${name} 영입 의뢰 업무 배정`);
    expect(trainingPreview(quest, config, 'EMP01').reasonKo).toContain(`${name} 영입 의뢰`);
  });

  it('훈련 시작에는 비용·일수를 쓰고 바쁨 문구에는 직원 ID를 넣지 않는다', () => {
    const s = planState(open(), config, [training]).state;
    expect(s.log.at(-1)!.textKo).toBe('귀솔 일반 훈련 시작 (1일, 훈련비 50,000원)');
    const reason = trainingPreview(s, config, 'EMP01').reasonKo!;
    expect(reason).toContain('다른 업무(일반 훈련)');
    expect(reason).not.toContain('EMP01');
  });

  it.each([0, 90, 100, 320, 4500, 5000])('levelProgress(%i)는 문턱·남은 경험치·능력을 읽고 상태를 보존한다', (xp) => {
    const s = open();
    emp(s).xp = xp;
    const p = pure(s, config, () => levelProgress(s, config, 'EMP01'));
    expect(p.xp).toBe(xp);
    expect(p.stats).toEqual(statsFor(config.employees[0]!, xp));
    if (xp >= 4500) expect(p).toMatchObject({ level: 10, levelFloorXp: 4500, nextLevelXp: null, xpToNext: null });
    else if (xp >= 300) expect(p).toMatchObject({ level: 3, levelFloorXp: 300, nextLevelXp: 600, xpToNext: 600 - xp });
    else if (xp >= 100) expect(p).toMatchObject({ level: 2, levelFloorXp: 100, nextLevelXp: 300, xpToNext: 300 - xp });
    else expect(p).toMatchObject({ level: 1, levelFloorXp: 0, nextLevelXp: 100, xpToNext: 100 - xp });
  });

  it('성장 없는 직원의 stats는 null이다', () => {
    const cfg = loadScenario('SCENARIO_M1_ONE_TRADE');
    const s = open(cfg);
    expect(pure(s, cfg, () => levelProgress(s, cfg, 'EMP01')).stats).toBeNull();
  });

  it('훈련 미리보기는 실제 완료 비용·성장과 같고 명령 ID 충돌에도 입력을 보존한다', () => {
    const cfg = structuredClone(config);
    cfg.employees[0]!.growth!.startXp = 90;
    const s = open(cfg);
    s.processedCommands['TRAINING-PREVIEW'] = { day: 1, type: 'START_TRAINING', status: 'REJECTED', reasonKo: '검증' };
    const p = pure(s, cfg, () => trainingPreview(s, cfg, 'EMP01'));
    expect(p).toMatchObject({ allowed: true, reasonKo: null, fee: { currency: 'KRW', minor: 50_000 },
      durationDays: 1, xpGain: 60, levelAfter: 2, availableBeforeMinor: 10_000_000, availableAfterMinor: 9_950_000 });
    const done = commitDay(s, cfg, [training]).state;
    expect(p.levelAfter).toBe(levelProgress(done, cfg, 'EMP01').level);
    expect(p.statsAfter).toEqual(statsFor(cfg.employees[0]!, emp(done).xp));
  });

  it.each(['현금 부족', '미지급 의무', '업무 중', '근무 시작 전', '다른 도시', '후보', '없는 직원', '성장 꺼짐', '성장 정의 없음'])
  ('훈련 미리보기의 %s 판정·이유는 실제 명령과 같고 상태를 보존한다', (reason) => {
    const cfg = reason === '성장 꺼짐' ? loadScenario('SCENARIO_M1_ONE_TRADE') : structuredClone(config);
    if (reason === '현금 부족') cfg.startingCash.KRW = 49_999;
    if (reason === '성장 정의 없음') cfg.employees[0]!.growth = null;
    let s = open(cfg);
    if (reason === '미지급 의무') debt(s, 9_950_001);
    if (reason === '업무 중') s = planState(s, cfg, [scout]).state;
    if (reason === '근무 시작 전') emp(s).availableFromDay = 2;
    if (reason === '다른 도시') emp(s).locationCityId = 'YOKOHAMA';
    const id = reason === '후보' ? 'EMP04' : reason === '없는 직원' ? 'MISSING' : 'EMP01';
    const p = pure(s, cfg, () => trainingPreview(s, cfg, id));
    const actual = planState(s, cfg, [{ ...training, employeeId: id }]).results[0]!;
    expect(actual.status).toBe('REJECTED');
    expect(p.allowed).toBe(false);
    expect(p.reasonKo).toBe(actual.reasonKo);
    if (reason === '성장 꺼짐') expect(p.reasonKo).toBe('이 시나리오에서는 일반 훈련을 할 수 없습니다.');
  });

  it('훈련 위치 거절은 설정의 본거지 이름을 사용한다', () => {
    const cfg = { ...config, homeCityId: 'YOKOHAMA' };
    expect(trainingPreview(open(cfg), cfg, 'EMP01').reasonKo).toBe('일반 훈련은 요코하마에서만 할 수 있습니다.');
  });
});

describe('급여 지급 가능일 표시', () => {
  it('M2 시작 원화 10,000,000 / 일급 80,000 + 80,000은 오늘 포함 62일까지다', () => {
    const s = open();
    expect(config.startingCash.KRW).toBe(10_000_000);
    expect(config.employees.filter((d) => s.employees.some((e) => e.id === d.id && e.employmentStatus === 'employed'))
      .reduce((sum, d) => sum + d.salaryPerDayMinor, 0)).toBe(160_000);
    expect(pure(s, config, () => payrollRunwayDay(s, config))).toBe(62);
    expect(pure(s, config, () => payrollRunwayDay(s, config, 100_000))).toBe(61);
    const tomorrow = commitDay(s, config, []).state;
    expect(payrollRunwayDay(tomorrow, config)).toBe(62);
    expect(payrollRunwayDay(openDay(tomorrow, config).state, config)).toBe(62);
  });

  it('오늘분에 1원 부족하면 어제, 정확하면 오늘까지다', () => {
    for (const cash of [159_999, 160_000]) {
      const cfg = { ...config, startingCash: { KRW: cash } };
      const s = open(cfg);
      expect(pure(s, cfg, () => payrollRunwayDay(s, cfg))).toBe(cash === 160_000 ? 1 : 0);
    }
  });

  it('미지급 의무와 추가 지출을 빼고 향후 근무 시작 직원의 급여를 합산한다', () => {
    const cfg = { ...config, startingCash: { KRW: 800_000 } };
    const s = open(cfg);
    const future = s.employees.find((e) => e.id === 'EMP04')!;
    future.employmentStatus = 'employed';
    future.availableFromDay = 3;
    debt(s, 100_000);
    // 800,000 - 100,000 - 10,000 - 160,000*2 - 270,000 = 100,000: 3일까지.
    expect(pure(s, cfg, () => payrollRunwayDay(s, cfg, 10_000))).toBe(3);
  });

  it('캠페인 마지막 날까지 충분하거나 급여가 없거나 종료했으면 null이다', () => {
    const cfg = { ...config, campaignDays: 62 };
    const s = open(cfg);
    expect(pure(s, cfg, () => payrollRunwayDay(s, cfg))).toBeNull();
    const noWages = { ...config, employees: config.employees.map((d) => ({ ...d, salaryPerDayMinor: 0 })) };
    expect(payrollRunwayDay(open(noWages), noWages)).toBeNull();
    s.day = 63;
    s.phase = 'ENDED';
    expect(payrollRunwayDay(s, cfg)).toBeNull();
  });
});
