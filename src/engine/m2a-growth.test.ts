// CHAR-ACC-01·02·08: 경험치·훈련을 실제 업무, 예약, 장부, 저장 경로에서 검증한다.
import { describe, expect, it } from 'vitest';
import acceptance from '../../tests/character_acceptance_cases.json';
import rules from '../../data/character_rules.json';
import { expectedTradeResult, loadScenario } from '../content/scenario';
import { crewCard } from '../ui/card';
import { taskSchedule } from '../ui/recruitment';
import { commitDay, createGame, openDay, planState } from './engine';
import { awardTaskCompletion, awardXp, levelFor, statsFor } from './growth';
import { checkInvariants } from './invariants';
import { post, summarize } from './ledger';
import { companyReport } from './reports';
import { runningTaskOf } from './reservations';
import { deserializeSave, SAVE_FORMAT_VERSION, serializeSave } from './save';
import { runDays, standardDayOneCommands, type DayScript } from './testkit';
import type { Command, GameState, ScenarioConfig } from './types';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const employee = (s: GameState, id = 'EMP01') => s.employees.find((e) => e.id === id)!;
const training = (id = 'TRAIN', employeeId = 'EMP01'): Command => ({ id, type: 'START_TRAINING', employeeId });
const trade = (assigned = true): Command => ({ id: 'TRADE', type: 'ACCEPT_TRADE', buyOfferId: 'OFFER_BUY_01', sellOfferId: 'OFFER_SELL_01', ...(assigned ? { plan: { employeeId: 'EMP01' } } : {}) });
const assign = (id = 'ASSIGN'): Command => ({ id, type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: 'EMP01' });
const until = (day: number, cfg = config, script: DayScript = {}) => runDays(createGame(cfg), cfg, day, script).state;
const reload = (s: GameState, cfg = config) => deserializeSave(serializeSave(s), { dataVersion: cfg.dataVersion, config: cfg });

function fixtureConfig(): ScenarioConfig {
  const setup = acceptance.items.find((c) => c.id === 'CHAR-ACC-08')!.setup;
  const cfg = structuredClone(config);
  cfg.recruitment = null;
  cfg.employees = [cfg.employees[0]!];
  cfg.employees[0]!.salaryPerDayMinor = setup.regular_salary_due_krw!;
  cfg.startingCash.KRW = setup.starting_cash_krw!;
  cfg.growth!.ordinaryTraining = {
    currency: 'KRW', feeMinor: setup.general_training_fee_krw!,
    durationDays: setup.general_training_duration_days!, xpOnCompletion: setup.general_training_xp_on_completion!,
  };
  return cfg;
}

describe('CHAR-ACC-01 직원별 완료 경험치 중복 방지', () => {
  it('각자 준비 업무를 마친 두 직원에게 10씩 주고 완료 재처리·저장 뒤에도 한 번이다', () => {
    const s = until(2, config, { 1: [trade(), { id: 'FWD', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_01', plan: { employeeId: 'EMP02' } }] });
    expect(employee(s).xp).toBe(10);
    expect(employee(s, 'EMP02').xp).toBe(10);
    expect(Object.keys(s.xpAwards).sort()).toEqual([
      'EMP01|TASK-DONE-TASK001|TASK_COMPLETION_XP',
      'EMP02|TASK-DONE-TASK002|TASK_COMPLETION_XP',
    ]);
    for (const state of [s, reload(s)]) {
      const before = structuredClone(state);
      for (const task of state.tasks) expect(awardTaskCompletion(state, config, task)).toBe(false);
      expect(state).toEqual(before);
      checkInvariants(state, config);
    }
  });

  it('CHAR-ACC-01 같은 완료 사건도 직원별로 지급하고 재전송을 차단한다', () => {
    const spec = acceptance.items.find((c) => c.id === 'CHAR-ACC-01')!.setup;
    let s = createGame(config);
    for (let retry = 0; retry < 3; retry++) {
      for (const id of ['EMP01', 'EMP02']) {
        expect(awardXp(s, config, id, spec.completed_event_id!, 'TASK_COMPLETION_XP', spec.xp_per_employee!)).toBe(retry === 0);
      }
      s = reload(s);
    }
    expect([employee(s).xp, employee(s, 'EMP02').xp]).toEqual([10, 10]);
    expect(Object.keys(s.xpAwards)).toHaveLength(2);
    checkInvariants(s, config);
  });

  it('취소·미배정·진행 중 준비 업무에는 경험치를 주지 않는다', () => {
    const s = until(1, config, { 1: [trade(), { id: 'CANCEL', type: 'CANCEL_CONTRACT', contractId: 'CT001' }] });
    expect(s.tasks[0]!.status).toBe('ABORTED');
    expect(awardTaskCompletion(s, config, s.tasks[0]!)).toBe(false);
    expect(awardXp(s, config, 'EMP01', 'TASK-DONE-TASK001', 'TASK_COMPLETION_XP', 10)).toBe(false);
    expect(employee(s).xp).toBe(0);
    expect(s.xpAwards).toEqual({});
    const slow = { ...config, terms: { ...config.terms, prepWorkUnits: 100 } };
    for (const assigned of [false, true]) {
      const incomplete = until(1, slow, { 1: [trade(assigned)] });
      expect(awardTaskCompletion(incomplete, slow, incomplete.tasks[0]!)).toBe(false);
      expect(employee(incomplete).xp).toBe(0);
      checkInvariants(incomplete, slow);
    }
    checkInvariants(s, config);
  });

  it('조사·영입 의뢰는 완료 담당자에게만 각각 10을 주며 고용 때 경험치를 초기화하지 않는다', () => {
    const cfg = structuredClone(config);
    cfg.employees.find((e) => e.id === 'EMP04')!.growth!.startXp = 90;
    const script: DayScript = {
      1: [{ id: 'SCOUT', type: 'SCOUT_SITE', venueId: 'VEN_PORT', employeeId: 'EMP02' }],
      2: [{ id: 'QUEST', type: 'START_RECRUIT_QUEST', candidateId: 'EMP04', employeeId: 'EMP01' }],
      4: [{ id: 'HIRE', type: 'HIRE_CANDIDATE', candidateId: 'EMP04' }],
      5: [training('NEW-HIRE', 'EMP04')],
    };
    expect(employee(until(4, cfg, script), 'EMP04').xp).toBe(90);
    const s = until(5, cfg, script);
    expect([employee(s).xp, employee(s, 'EMP02').xp, employee(s, 'EMP04').xp]).toEqual([10, 10, 150]);
    checkInvariants(s, cfg);
  });
});

describe('CHAR-ACC-02 누적 경험치로 레벨·능력 재계산', () => {
  it('CHAR-ACC-02 90에서 230을 받아 320·레벨 3·54/42가 되고 다시 계산해도 같다', () => {
    const spec = acceptance.items.find((c) => c.id === 'CHAR-ACC-02')!;
    const cfg = fixtureConfig();
    const def = cfg.employees[0]!;
    def.growth = { baseStats: { primary: spec.setup.primary_ability!, secondary: spec.setup.secondary_ability! }, primaryStat: 'primary', secondaryStat: 'secondary', startXp: spec.setup.cumulative_xp! };
    const s = createGame(cfg);
    const initialDef = structuredClone(def);
    expect(awardXp(s, cfg, def.id, 'MULTI-LEVEL', 'TASK_COMPLETION_XP', spec.setup.award_xp!)).toBe(true);
    for (const state of [s, reload(s, cfg)]) {
      expect(employee(state).xp).toBe(spec.expected.cumulative_xp);
      expect(levelFor(employee(state).xp)).toBe(spec.expected.level);
      for (let i = 0; i < 3; i++) expect(statsFor(def, employee(state).xp)).toEqual({ primary: 54, secondary: 42 });
      expect(crewCard(def, state, false)).toContain('레벨 3');
      checkInvariants(state, cfg);
    }
    expect(s.log.filter((l) => l.textKo.includes('레벨')).map((l) => l.textKo)).toEqual([`${def.nameKo} 레벨 2 달성`, `${def.nameKo} 레벨 3 달성`]);
    expect(def).toEqual(initialDef);
    expect(JSON.parse(serializeSave(s)).state.employees[0]).not.toHaveProperty('level');
    expect(JSON.parse(serializeSave(s)).state.employees[0]).not.toHaveProperty('stats');
  });

  it('모든 문턱의 직전·정확한 값과 레벨 10·능력 100 상한을 지킨다', () => {
    for (const t of rules.xp_thresholds) {
      expect(levelFor(t.cumulative_xp)).toBe(t.level);
      if (t.level > 1) expect(levelFor(t.cumulative_xp - 1)).toBe(t.level - 1);
    }
    const def = structuredClone(config.employees[0]!);
    def.growth = { baseStats: { primary: 99, secondary: 99, other: 40 }, primaryStat: 'primary', secondaryStat: 'secondary', startXp: 0 };
    expect(levelFor(1_000_000)).toBe(10);
    expect(statsFor(def, 1_000_000)).toEqual({ primary: 100, secondary: 100, other: 40 });
  });
});

describe('CHAR-ACC-08 일반 훈련 비용·급여·예약', () => {
  it('CHAR-ACC-08 훈련비 20,000·급여 10,000·현금 470,000·경험치 60이며 중복하지 않는다', () => {
    const cfg = fixtureConfig();
    const spec = acceptance.items.find((c) => c.id === 'CHAR-ACC-08')!.expected;
    const opened = openDay(createGame(cfg), cfg).state;
    const started = planState(opened, cfg, [training(), training(), training('SECOND')]);
    expect(started.results.map((r) => r.status)).toEqual(['APPLIED', 'DUPLICATE', 'REJECTED']);
    expect(runningTaskOf(started.state, 'EMP01')!.id).toBe('TRAINING-EMP01-D1');
    expect(companyReport(started.state, cfg).payroll.trainingExpense).toBe(spec.training_fee_expense_krw);
    expect(companyReport(started.state, cfg).payroll.wageExpense).toBe(0);
    const restoredStart = reload(started.state, cfg);
    const done = commitDay(restoredStart, cfg, [training()]).state;
    const report = companyReport(done, cfg).payroll;
    expect(report.trainingExpense).toBe(spec.training_fee_expense_krw);
    expect(report.wageExpense).toBe(spec.regular_salary_expense_krw);
    expect(report.cash).toBe(spec.ending_cash_krw);
    expect(cfg.startingCash.KRW! - report.cash).toBe(spec.total_cash_outflow_krw);
    expect(report.profit).toBe(-30_000);
    expect(report.totalAssets).toBe(report.openingEquity + report.profit + report.accountsPayable);
    expect(employee(done).xp).toBe(spec.cumulative_xp);
    expect(levelFor(employee(done).xp)).toBe(spec.level);
    expect(Object.keys(done.xpAwards)).toEqual(['EMP01|TASK-DONE-TRAINING-EMP01-D1|TRAINING_XP']);
    expect(awardXp(done, cfg, 'EMP01', 'TASK-DONE-TRAINING-EMP01-D1', 'TASK_COMPLETION_XP', 10)).toBe(false);
    expect(done.ledger.entries.filter((e) => e.id.startsWith('WAGE-'))).toHaveLength(1);
    const restored = reload(done, cfg);
    expect(planState(restored, cfg, [training()]).state).toEqual(restored);
    expect(commitDay(restored, cfg, [training()], 1).state).toEqual(restored);
    expect(awardTaskCompletion(restored, cfg, restored.tasks[0]!)).toBe(false);
    expect(restored).toEqual(done);
    checkInvariants(restored, cfg);
  });

  it('훈련 중 준비 업무는 거절하고 다음 날에는 배정한다', () => {
    const s = openDay(createGame(config), config).state;
    const p = planState(s, config, [trade(false), training(), assign()]);
    expect(p.results.map((r) => r.status)).toEqual(['APPLIED', 'APPLIED', 'REJECTED']);
    expect(p.state.tasks.find((t) => t.id === 'TASK001')!.status).toBe('QUEUED');
    expect(crewCard(config.employees[0]!, p.state, false)).toContain('0/1일');
    expect(taskSchedule(runningTaskOf(p.state, 'EMP01')!, config)).toContain('일반 훈련');
    const tomorrow = until(1, config, { 1: [trade(false), training()] });
    expect(planState(tomorrow, config, [assign('NEXT')]).results[0]!.status).toBe('APPLIED');
    checkInvariants(p.state, config);
  });

  it.each([0, 100])('직원 처리량 %i여도 이틀 훈련은 하루에 1일 진행하고 저장 뒤 이어진다', (workUnitsPerDay) => {
    const cfg = fixtureConfig();
    cfg.employees[0]!.workUnitsPerDay = workUnitsPerDay;
    cfg.growth!.ordinaryTraining.durationDays = 2;
    const first = until(1, cfg, { 1: [training()] });
    expect(first.tasks[0]).toMatchObject({ status: 'RUNNING', progressWorkUnits: 1 });
    expect(employee(first).xp).toBe(0);
    const second = runDays(reload(first, cfg), cfg, 2).state;
    expect(second).toEqual(until(2, cfg, { 1: [training()] }));
    expect(second.tasks[0]).toMatchObject({ status: 'DONE', completedDay: 2, progressWorkUnits: 2 });
    expect(employee(second).xp).toBe(60);
    expect(summarize(second.ledger, 'KRW')).toMatchObject({ trainingExpense: 20_000, wageExpense: 20_000 });
    checkInvariants(second, cfg);
  });

  it('자금이 1원 부족하면 기록도 남기지 않고, 정확한 금액이면 시작한다', () => {
    for (const shortfall of [1, 0]) {
      const cfg = fixtureConfig();
      cfg.startingCash.KRW = cfg.growth!.ordinaryTraining.feeMinor - shortfall;
      const s = openDay(createGame(cfg), cfg).state;
      const p = planState(s, cfg, [training()]);
      expect(p.results[0]!.status).toBe(shortfall ? 'REJECTED' : 'APPLIED');
      if (shortfall) expect(p.state).toEqual(s);
      else expect(summarize(p.state.ledger, 'KRW').cash).toBe(0);
      checkInvariants(p.state, cfg);
    }
  });

  it('현금에서 미지급 의무를 빼고 훈련을 판단한다', () => {
    const cfg = fixtureConfig();
    const s = openDay(createGame(cfg), cfg).state;
    const debt = 480_001;
    post(s.ledger, { id: 'DEBT', day: 1, currency: 'KRW', reason: '미지급 비용 검증', lines: [{ account: 'CANCELLATION_EXPENSE', amount: debt }, { account: 'ACCOUNTS_PAYABLE', amount: -debt }] });
    s.obligations.push({ id: 'DEBT', currency: 'KRW', amountMinor: debt, reasonKo: '미지급 비용', incurredDay: 1, paidDay: null });
    const p = planState(s, cfg, [training()]);
    expect(p.results[0]!.reasonKo).toContain('훈련비 자금이 부족');
    expect(p.state).toEqual(s);
    checkInvariants(p.state, cfg);
  });

  it('후보·없는 직원·근무 시작 전·다른 도시·업무 중 훈련은 상태 전체를 보존한다', () => {
    for (const employeeId of ['EMP04', 'MISSING']) {
      const s = openDay(createGame(config), config).state;
      const p = planState(s, config, [training('REJECT', employeeId)]);
      expect(p.results[0]!.status).toBe('REJECTED');
      expect(p.state).toEqual(s);
    }
    for (const reason of ['future', 'city', 'busy']) {
      let s = openDay(createGame(config), config).state;
      if (reason === 'future') employee(s).availableFromDay = 2;
      if (reason === 'city') employee(s).locationCityId = 'YOKOHAMA';
      if (reason === 'busy') s = planState(s, config, [trade()]).state;
      const p = planState(s, config, [training()]);
      expect(p.results[0]!.status).toBe('REJECTED');
      expect(p.state).toEqual(s);
      checkInvariants(p.state, config);
    }
  });
});

describe('기준 경로·판본 이관·불변 조건', () => {
  it('M1에서는 훈련·경험치를 끄고 기존 거래 검산을 유지한다', () => {
    const cfg = loadScenario('SCENARIO_M1_ONE_TRADE');
    const s = openDay(createGame(cfg), cfg).state;
    expect(cfg.growth).toBeNull();
    expect(cfg.employees.every((e) => e.growth === null)).toBe(true);
    const p = planState(s, cfg, [training()]);
    expect(p.results[0]!.status).toBe('REJECTED');
    expect(p.state).toEqual(s);
    expect(awardXp(s, cfg, 'EMP01', 'DISABLED', 'TRAINING_XP', 60)).toBe(false);
    const done = until(17, cfg, { 1: standardDayOneCommands(cfg) });
    expect(employee(done).xp).toBe(0);
    expect(done.xpAwards).toEqual({});
    const contribution = expectedTradeResult('SCENARIO_M1_ONE_TRADE').contribution_before_payroll_usd!;
    expect(summarize(done.ledger, 'USD').cash).toBe(cfg.startingCash.USD! + contribution * 100);
    checkInvariants(done, cfg);
  });

  it('성장만 켠 M2 경로는 17일 현금 3,500 USD·급여 2,720,000원을 유지한다', () => {
    const script: DayScript = {
      1: [
        { id: 'T', type: 'ACCEPT_TRADE', buyOfferId: 'OFFER_BUY_02', sellOfferId: 'OFFER_SELL_02', plan: { employeeId: 'EMP01', sailingId: 'ROUTE02-D002' } },
        { id: 'F1', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_01', plan: { employeeId: 'EMP02', sailingId: 'ROUTE01-D002' } },
        { id: 'F2', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_02', plan: { sailingId: 'ROUTE01-D009' } },
      ], 2: [{ id: 'A3', type: 'ASSIGN_TASK', taskId: 'TASK003', employeeId: 'EMP01' }],
    };
    const s = until(17, config, script);
    const disabled = until(17, { ...config, growth: null }, script);
    expect(s.ledger).toEqual(disabled.ledger);
    expect(s.tasks).toEqual(disabled.tasks);
    expect(s.shipments).toEqual(disabled.shipments);
    const highLevel = structuredClone(config);
    for (const def of highLevel.employees) def.growth!.startXp = 4500;
    const high = until(17, highLevel, script);
    expect(high.ledger).toEqual(s.ledger);
    expect(high.tasks).toEqual(s.tasks);
    expect(high.shipments).toEqual(s.shipments);
    expect(summarize(s.ledger, 'USD').cash).toBe(350_000);
    expect(summarize(s.ledger, 'KRW')).toMatchObject({ wageExpense: 2_720_000, recruitmentExpense: 0, trainingExpense: 0 });
    expect([employee(s).xp, employee(s, 'EMP02').xp]).toEqual([20, 10]);
    checkInvariants(s, config);
  });

  it.each([1, 2, 3])('판본 %i의 실제 누락 필드를 채워 판본 4로 이관하고 과거 완료에는 소급 보상하지 않는다', (version) => {
    const cfg = version === 1 ? loadScenario('SCENARIO_M1_ONE_TRADE') : fixtureConfig();
    if (cfg.employees[0]!.growth) cfg.employees[0]!.growth.startXp = 90;
    const s = until(2, { ...cfg, growth: null }, { 1: [trade()] });
    const file = JSON.parse(serializeSave(s));
    file.formatVersion = version;
    delete file.state.xpAwards;
    delete file.state.xpAwardAmounts;
    for (const e of file.state.employees) delete e.xp;
    if (version <= 2) {
      delete file.state.recruitment;
      for (const e of file.state.employees) delete e.availableFromDay;
      for (const t of file.state.tasks) delete t.subjectId;
    }
    if (version === 1) {
      for (const c of file.state.contracts) delete c.serviceOfferId;
      for (const l of file.state.cargoLots) delete l.ownerPartyId;
    }
    const restored = deserializeSave(JSON.stringify(file), { dataVersion: cfg.dataVersion, config: cfg });
    expect(SAVE_FORMAT_VERSION).toBe(4);
    expect(JSON.parse(serializeSave(restored)).formatVersion).toBe(4);
    expect(restored).toEqual(s);
    expect(employee(restored).xp).toBe(cfg.employees[0]!.growth?.startXp ?? 0);
    expect(restored.xpAwards).toEqual({});
    expect(runDays(restored, cfg, 3).state.xpAwards).toEqual({});
    checkInvariants(restored, cfg);
  });

  it('판본 3 이관은 저장 시나리오의 직원 정의를 기본으로 찾는다', () => {
    const file = JSON.parse(serializeSave(createGame(config)));
    file.formatVersion = 3;
    delete file.state.xpAwards;
    delete file.state.xpAwardAmounts;
    for (const e of file.state.employees) delete e.xp;
    expect(deserializeSave(JSON.stringify(file), { dataVersion: config.dataVersion })).toEqual(createGame(config));
  });

  it('경험치 불일치·지급액 누락·중단 업무 보상·훈련비 중복을 탐지한다', () => {
    const cfg = fixtureConfig();
    const s = until(1, cfg, { 1: [training()] });
    const mismatch = structuredClone(s);
    employee(mismatch).xp++;
    expect(() => checkInvariants(mismatch, cfg)).toThrow(/경험치와 시작 경험치/);
    const missing = structuredClone(s);
    missing.xpAwardAmounts = {};
    expect(() => checkInvariants(missing, cfg)).toThrow(/경험치 지급 기록 오류/);
    const aborted = structuredClone(s);
    aborted.tasks[0]!.status = 'ABORTED';
    expect(() => checkInvariants(aborted, cfg)).toThrow(/ABORTED 업무/);
    const duplicate = structuredClone(s);
    duplicate.ledger.entries.push(structuredClone(duplicate.ledger.entries.find((e) => e.id.startsWith('TRAINING-FEE-'))!));
    expect(() => checkInvariants(duplicate, cfg)).toThrow(/훈련비 중복/);
    checkInvariants(s, cfg);
  });
});
