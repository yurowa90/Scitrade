// P0-CITY-01~04: 열람·직접 경험·개인 관계·계약 실적을 분리하고 저장 근거를 검증한다.
import { describe, expect, it } from 'vitest';
import taskText from '../../docs/ai/tasks/TASK-0011-culture-engine.md?raw';
import activities from '../../data/culture_activities.json';
import contacts from '../../data/contacts.json';
import gameConfig from '../../data/game_config.json';
import fixtureV4 from './fixtures/save-v4-m2.json';
import { expectedM2, loadScenario, M1_SCENARIO_IDS } from '../content/scenario';
import { crewStatusKo, taskSchedule } from '../ui/crew-status';
import { taskName } from '../ui/card';
import { commitDay, createGame, openDay, planState } from './engine';
import { cultureBook, cultureKey, cultureKeys, counterpartyRecord } from './culture';
import { culturePreview, payrollRunwayDay } from './previews';
import { awardXp, completionReward } from './growth';
import { checkInvariants } from './invariants';
import { balance, post, summarize } from './ledger';
import { cashLessUnpaidMinor, runningTaskOf } from './reservations';
import { deserializeSave, serializeSave, SaveError, SAVE_FORMAT_VERSION } from './save';
import { runDays, type DayScript } from './testkit';
import { isDayBasedTask, taskSubjectKo } from './tasks';
import type { Command, GameState, ScenarioConfig } from './types';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const start = (activityId = 'CA01', employeeId = 'EMP01', id = `${activityId}-${employeeId}`): Command =>
  ({ id, type: 'START_CULTURE_ACTIVITY', activityId, employeeId });
const fresh = (cfg = config) => openDay(createGame(cfg), cfg).state;
const plan = (s: GameState, commands: Command[], cfg = config) => planState(openDay(s, cfg).state, cfg, commands);
const done = (cfg = config, commands = [start()]) => commitDay(fresh(cfg), cfg, commands).state;
const reload = (s: GameState, cfg = config) => deserializeSave(serializeSave(s), { dataVersion: cfg.dataVersion, config: cfg });
const xpKey = (activity = 'CA01', employee = 'EMP01') => `${employee}|CULTURE-FIRST-${activity}|CULTURE_FIRST_XP`;
const krw = (s: GameState) => summarize(s.ledger, 'KRW');
const unchangedExceptCommand = (before: GameState, after: GameState) =>
  expect({ ...after, processedCommands: before.processedCommands }).toEqual(before);
function hireThird(cfg = config) {
  const script: DayScript = {
    1: [{ id: 'SCOUT', type: 'SCOUT_SITE', venueId: 'VEN_LOUNGE', employeeId: 'EMP01' }],
    2: [{ id: 'QUEST', type: 'START_RECRUIT_QUEST', candidateId: 'EMP03', employeeId: 'EMP01' }],
    4: [{ id: 'HIRE', type: 'HIRE_CANDIDATE', candidateId: 'EMP03' }],
  };
  const result = runDays(createGame(cfg), cfg, 4, script);
  expect(Object.values(result.results).flat().every((r) => r.status === 'APPLIED')).toBe(true);
  return result.state;
}

describe('자료·키·기존 판본', () => {
  it('M2의 활동 순서·회사·인물·비용·기간·문장 필드를 자료에서 읽는다', () => {
    expect(config.culture!.companyId).toBe(gameConfig.config.active_company_id);
    expect(config.culture!.activities.map((a) => [a.id, a.costMinor, a.durationDays])).toEqual([
      ['CA01', 20000, 1], ['CA02', 10000, 1], ['CA03', 30000, 1],
    ]);
    expect(config.culture!.contacts.map((c) => c.nameKo)).toEqual(contacts.items.map((c) => c.title_ko));
    for (const a of config.culture!.activities) {
      expect(Object.values(a.reportKo!).every((text) => text.length > 0)).toBe(true);
      expect(a.topic.contentRevision).toBe('1');
    }
    expect([config.dataVersion, config.rules.rulesVersion, SAVE_FORMAT_VERSION]).toEqual(['0.4.1', 'M2a-rules-1', 5]);
  });

  it('사용자 승인 문장 12개는 지시서와 글자 단위로 같다', () => {
    const matches = [...taskText.matchAll(/\| (CA0[123]) \| `(\w+_ko)` \| (.*?) \|/g)];
    expect(matches).toHaveLength(12);
    for (const [, id, key, sentence] of matches) {
      const activity = activities.items.find((a) => a.id === id)!;
      expect((activity.report_ko as Record<string, string>)[key!]).toBe(sentence);
    }
  });

  it.each(['P1', '도시', '통화', '인물'])('로더는 잘못된 %s 연결을 거절한다', (field) => {
    const a = activities.items[0]!;
    const before = structuredClone(a);
    try {
      if (field === 'P1') a.stage = 'P1';
      if (field === '도시') a.city_id = 'UNKNOWN';
      if (field === '통화') a.money_cost.currency = 'XXX';
      if (field === '인물') a.contact_ids = ['UNKNOWN'];
      expect(() => loadScenario('SCENARIO_M2_MULTI_TRADE')).toThrow();
    } finally { Object.assign(a, before); }
  });

  it('키는 여섯 자리만 채우며 모르는 자리·값 누락·깨진 괄호는 거절한다', () => {
    expect(cultureKey('{company_id}:{actor_id}:{contact_id}:{activity_id}:{city_id}:{content_revision}', {
      company_id: 'C', actor_id: 'E', contact_id: 'N', activity_id: 'A', city_id: 'B', content_revision: '1',
    })).toBe('C:E:N:A:B:1');
    for (const template of ['{unknown}', '{actor_id}', '{company_id', '{}']) {
      expect(() => cultureKey(template, { company_id: 'C' })).toThrow();
    }
  });

  it.each(M1_SCENARIO_IDS)('%s은 비활성이고 명령도 결제 없이 거절한다', (id) => {
    const cfg = loadScenario(id);
    expect(cfg.culture).toBeNull();
    const s = fresh(cfg), p = plan(s, [start()], cfg);
    expect(p.results[0]).toMatchObject({ status: 'REJECTED', reasonKo: '이 시나리오에서는 현지 활동을 할 수 없습니다.' });
    unchangedExceptCommand(s, p.state);
  });

  it('실제 판본 4 저장은 경험치를 보존하고 빈 기록장으로 열린다', () => {
    const restored = deserializeSave(JSON.stringify(fixtureV4), { dataVersion: config.dataVersion });
    const { culture, ...other } = restored;
    expect(culture).toEqual({ reports: [], experiences: [], relationEvents: [] });
    expect(other).toEqual(fixtureV4.state);
  });
});

describe('P0-CITY-01 읽기 함수·미리 보기', () => {
  it.each(['시작 전', '완료 뒤'])('%s 모든 활동×직원 열람은 상태와 설정을 바꾸지 않는다', (when) => {
    const s = when === '시작 전' ? fresh() : openDay(done(), config).state;
    const before = structuredClone(s), cfgBefore = structuredClone(config);
    for (const a of config.culture!.activities) for (const employee of config.employees) {
      culturePreview(s, config, a.id, employee.id);
      cultureBook(s, config);
      for (const party of [...config.offers.map((o) => o.counterpartyId), ...config.culture!.contacts.map((c) => c.id)]) {
        counterpartyRecord(s, party);
      }
    }
    expect(s).toEqual(before);
    expect(config).toEqual(cfgBefore);
    const book = cultureBook(s, config);
    book.employees.length = 0;
    book.relations.length = 0;
    if (book.reports[0]) book.reports[0].sourceContactIds.push('변경');
    expect(s).toEqual(before);
  });

  it('비용·하루 업무 공백·대기 업무 출항일·다른 가용 직원·새 기록·급여 여유를 보여 준다', () => {
    const s = plan(fresh(), [{ id: 'FWD', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_01', plan: { sailingId: 'ROUTE01-D002' } }]).state;
    const p = culturePreview(s, config, 'CA01', 'EMP01');
    expect(p).toMatchObject({ allowed: true, reasonKo: null, cost: { currency: 'KRW', minor: 20000 }, durationDays: 1,
      busyFromDay: 1, busyUntilDay: 1, availableBeforeMinor: 10000000, availableAfterMinor: 9980000,
      otherFreeLocalEmployeeIds: ['EMP02'], unchangedKo: '가격·하루 처리량·운임·관세·거래 신뢰',
      newRecords: { companyReport: 'NEW', actorExperience: true, relationContactIds: ['NPC_MARKET'], firstCompletionXp: 10 } });
    expect(p.waitingTasks).toHaveLength(1);
    expect(p.waitingTasks[0]).toMatchObject({ task: { id: 'TASK001' }, reservedDepartureDay: 2 });
    expect(p.payrollRunwayBefore).toBe(payrollRunwayDay(s, config));
    expect(p.payrollRunwayAfter).toBe(payrollRunwayDay(s, config, 20000));
    const cfg = structuredClone(config);
    cfg.startingCash.KRW = cfg.employees.slice(0, 2).reduce((n, e) => n + e.salaryPerDayMinor, 0);
    const limited = culturePreview(fresh(cfg), cfg, 'CA01', 'EMP01');
    expect([limited.payrollRunwayBefore, limited.payrollRunwayAfter]).toEqual([1, 0]);
  });

  it('PREVIEW ID 충돌·날짜 단계·알 수 없는 활동·가용 여부도 실제 명령처럼 검사한다', () => {
    const s = fresh();
    s.processedCommands['CULTURE-PREVIEW'] = { day: 1, type: 'START_CULTURE_ACTIVITY', status: 'REJECTED', reasonKo: '기존' };
    expect(culturePreview(s, config, 'CA01', 'EMP01').allowed).toBe(true);
    expect(culturePreview(createGame(config), config, 'CA01', 'EMP01').reasonKo).toContain('하루를 연 뒤');
    expect(culturePreview({ ...s, phase: 'ENDED' }, config, 'CA01', 'EMP01').reasonKo).toBe('캠페인이 끝났습니다.');
    for (const [activity, employee] of [['UNKNOWN', 'EMP01'], ['CA01', 'EMP03'], ['CA01', 'UNKNOWN']]) {
      expect(culturePreview(s, config, activity!, employee!).allowed).toBe(false);
    }
  });

  it('미지급은 차감하며 계약 예약은 활동 가용 금액에서 빼지 않는다', () => {
    const cfg = structuredClone(config);
    cfg.culture!.activities[0]!.currency = 'USD';
    cfg.culture!.activities[0]!.costMinor = 180000;
    let s = plan(fresh(cfg), [{ id: 'T', type: 'ACCEPT_TRADE', buyOfferId: 'OFFER_BUY_01', sellOfferId: 'OFFER_SELL_01' }], cfg).state;
    expect(culturePreview(s, cfg, 'CA01', 'EMP01').allowed).toBe(true);
    post(s.ledger, { id: 'UNPAID', day: 1, currency: 'USD', reason: '시험 미지급',
      lines: [{ account: 'WAGE_EXPENSE', amount: 30000 }, { account: 'ACCOUNTS_PAYABLE', amount: -30000 }] });
    s.obligations.push({ id: 'UNPAID', currency: 'USD', amountMinor: 30000, reasonKo: '시험 미지급', incurredDay: 1, paidDay: null });
    const p = culturePreview(s, cfg, 'CA01', 'EMP01');
    expect(p.availableBeforeMinor).toBe(170000);
    expect(p.allowed).toBe(false);
    expect(p.payrollRunwayAfter).toBe(p.payrollRunwayBefore);
    const result = plan(s, [start()], cfg);
    expect(result.results[0]!.reasonKo).toContain('현지 활동비 자금이 부족');
    unchangedExceptCommand(s, result.state);
  });
});

describe('P0-CITY-02 비용·완료·중복', () => {
  it('CA01은 원화 20,000원·1일·보고서 1건이며 다음 날은 대기다', () => {
    const s = done(), baseline = done(config, []);
    expect(krw(baseline).cash - krw(s).cash).toBe(20000);
    expect(krw(s).cultureExpense).toBe(20000);
    expect(krw(s).profit).toBe(krw(baseline).profit - 20000);
    expect(s.tasks.filter((t) => t.kind === 'CULTURE' && t.status === 'DONE')).toHaveLength(1);
    expect(s.culture.reports).toHaveLength(1);
    expect(runningTaskOf(openDay(s, config).state, 'EMP01')).toBeUndefined();
    expect(s.log.map((l) => l.textKo)).toContain('귀솔 시장과 포장 요구 탐방 시작 (1일, 현지 활동비 20,000원)');
    expect(s.log.map((l) => l.textKo)).toContain('귀솔: 시장과 포장 요구 탐방 완료 — 회사 기록 새로 1건 · 직접 경험 · 윤서와 함께한 활동');
  });

  it('같은 명령·새 ID 반복·같은 날 재마감은 모두 장부·보상을 유지한다', () => {
    const s = openDay(done(), config).state;
    for (const [cmd, status] of [[start(), 'DUPLICATE'], [start('CA01', 'EMP01', 'RETRY'), 'REJECTED']] as const) {
      const p = plan(s, [cmd]);
      expect(p.results[0]!.status).toBe(status);
      expect(p.state.ledger).toEqual(s.ledger);
      unchangedExceptCommand(s, p.state);
      if (status === 'REJECTED') {
        expect(p.results[0]!.reasonKo).toBe('귀솔은(는) 이미 이 활동에 참여했습니다. 다시 해도 새로 생기는 기록이 없습니다.');
        expect(p.state.processedCommands.RETRY!.status).toBe('REJECTED');
      }
    }
    const closed = commitDay(s, config, [start()], 1);
    expect(closed.alreadyClosed).toBe(true);
    expect(closed.state).toEqual(s);
  });

  it('같은 날 같은 활동의 두 번째 직원은 결제 전에 거절한다', () => {
    const first = plan(fresh(), [start()]);
    const second = plan(first.state, [start('CA01', 'EMP02')]);
    expect(second.results[0]!.reasonKo).toBe('같은 활동에 오늘 이미 귀솔이(가) 갑니다. 끝난 뒤에 보낼 수 있습니다.');
    unchangedExceptCommand(first.state, second.state);
    expect(culturePreview(first.state, config, 'CA01', 'EMP02').allowed).toBe(false);
  });

  it('다음 날 두 번째 직원은 비용·경험·관계를 쓰고 회사 보고서·출처는 늘리지 않는다', () => {
    const s = openDay(done(), config).state;
    expect(culturePreview(s, config, 'CA01', 'EMP02').newRecords).toEqual({
      companyReport: 'EXISTS', actorExperience: true, relationContactIds: ['NPC_MARKET'], firstCompletionXp: 10,
    });
    expect(culturePreview(s, config, 'CA01', 'EMP01').newRecords).toEqual({
      companyReport: 'EXISTS', actorExperience: false, relationContactIds: [], firstCompletionXp: 0,
    });
    const next = commitDay(s, config, [start('CA01', 'EMP02')]).state;
    expect(next.culture.reports).toEqual(s.culture.reports);
    expect(next.culture.experiences).toHaveLength(2);
    expect(next.culture.relationEvents).toHaveLength(2);
    expect(krw(next).cultureExpense).toBe(40000);
    expect(next.log.some((l) => l.textKo.includes('회사 기록 이미 있음'))).toBe(true);
  });
});

describe('P0-CITY-03 출처·경험·쌍별 기록·거래 분리', () => {
  it('보고서는 출처 범위를 보존하고 CA01의 관계는 EMP01×윤서에만 남는다', () => {
    const before = fresh(), s = done();
    const book = cultureBook(s, config);
    expect(book.relations).toHaveLength(4);
    const count = (employeeId: string, contactId: string) => book.relations.find((r) => r.employeeId === employeeId && r.contactId === contactId)!.events.length;
    expect([count('EMP01', 'NPC_MARKET'), count('EMP01', 'NPC_GUIDE'), count('EMP02', 'NPC_MARKET')]).toEqual([1, 0, 0]);
    for (const party of [...config.offers.map((o) => o.counterpartyId), ...config.culture!.contacts.map((c) => c.id)]) {
      expect(counterpartyRecord(s, party)).toEqual({ inProgress: 0, onTime: 0, late: 0, cancelled: 0 });
    }
    for (const field of ['contracts', 'invoices', 'offers'] as const) expect(s[field]).toEqual(before[field]);
    expect(s.culture.reports[0]).toMatchObject({ cityId: 'BUSAN', topicId: 'KT_BUSAN_PACKAGING', sourceContactIds: ['NPC_MARKET'],
      day: 1, status: 'UNVERIFIED', reporterEmployeeId: 'EMP01' });
    expect(s.culture.experiences[0]).toMatchObject({ employeeId: 'EMP01', countryCode: 'KR', verifiedDay: 1, completedTaskId: s.tasks[0]!.id });
  });

  it('CA01 뒤 CA03은 윤서와의 별도 활동을 포함하여 관계 2건을 더한다', () => {
    const s = runDays(done(), config, 2, { 2: [start('CA03')] }).state;
    expect(s.culture.relationEvents.map((r) => [r.activityId, r.contactId])).toEqual([
      ['CA01', 'NPC_MARKET'], ['CA03', 'NPC_MARKET'], ['CA03', 'NPC_GUIDE'],
    ]);
    expect(s.culture.experiences).toHaveLength(2);
    expect(s.culture.reports).toHaveLength(2);
  });

  it('거래 이행은 실제 진행·인도일·취소에서만 계산한다', () => {
    const s = done(config, [{ id: 'F', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_01' }]);
    const base = s.contracts[0]!;
    s.contracts = [base, { ...base, id: 'ONTIME', deliveredDay: base.deliveryDeadlineDay },
      { ...base, id: 'LATE', status: 'COMPLETED', deliveredDay: base.deliveryDeadlineDay + 1 },
      { ...base, id: 'CANCEL', status: 'CANCELLED' }];
    const before = structuredClone(s);
    expect(counterpartyRecord(s, base.customerId)).toEqual({ inProgress: 1, onTime: 1, late: 1, cancelled: 1 });
    expect(s).toEqual(before);
  });
});

describe('P0-CITY-04 현지 인력·업무 예약', () => {
  it('상하이 합성 활동은 직원과 운송 중 화물을 움직이지 않고 거절한다', () => {
    const cfg = structuredClone(config);
    cfg.culture!.activities[0]!.cityId = 'SHANGHAI';
    const s = openDay(runDays(createGame(cfg), cfg, 2, { 1: [{ id: 'F', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_01',
      plan: { employeeId: 'EMP02', sailingId: 'ROUTE01-D002' } }] }).state, cfg).state;
    expect(s.cargoLots[0]!.status).toBe('IN_TRANSIT');
    const p = plan(s, [start()], cfg);
    expect(p.results[0]!.reasonKo).toContain('현지 인력이 필요합니다');
    unchangedExceptCommand(s, p.state);
  });

  it('활동 담당자는 준비 업무를 못 맡고 다른 직원은 맡는다', () => {
    const p = plan(fresh(), [start(), { id: 'F', type: 'ACCEPT_FORWARDING', offerId: 'OFFER_FWD_01' },
      { id: 'A', type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: 'EMP01' },
      { id: 'B', type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: 'EMP02' }]);
    expect(p.results.map((r) => r.status)).toEqual(['APPLIED', 'APPLIED', 'REJECTED', 'APPLIED']);
    expect(p.results[2]!.reasonKo).toContain('다른 업무');
  });

  it('같은 날 훈련·CA01·CA03의 원화 비용은 명령 순서대로 차감한다', () => {
    const cfg = structuredClone(config);
    const s = openDay(hireThird(cfg), cfg).state;
    const available = cfg.growth!.ordinaryTraining.feeMinor + 20000 + 29999;
    const spend = cashLessUnpaidMinor(s, cfg, 'KRW') - available;
    post(s.ledger, { id: 'SPEND', day: s.day, currency: 'KRW', reason: '시험 잔액 조정',
      lines: [{ account: 'WAGE_EXPENSE', amount: spend }, { account: 'CASH', amount: -spend }] });
    const p = plan(s, [{ id: 'TRAIN', type: 'START_TRAINING', employeeId: 'EMP01' }, start('CA01', 'EMP02'), start('CA03', 'EMP03')], cfg);
    expect(p.results.map((r) => r.status)).toEqual(['APPLIED', 'APPLIED', 'REJECTED']);
    expect(p.results[2]!.reasonKo).toBe('현지 활동비 자금이 부족합니다. 필요 30,000원, 사용 가능 29,999원.');
    expect(krw(p.state).cultureExpense).toBe(20000);
    expect(krw(p.state).trainingExpense).toBe(cfg.growth!.ordinaryTraining.feeMinor);
  });

  it.each([1, 2])('3pt 직원 EMP03도 %i일 활동은 하루에 1일씩만 진행한다', (duration) => {
    const cfg = structuredClone(config);
    cfg.culture!.activities[0]!.durationDays = duration;
    expect(cfg.employees.find((e) => e.id === 'EMP03')!.workUnitsPerDay).toBe(3);
    let s = hireThird(cfg);
    const firstDay = s.day;
    s = runDays(s, cfg, firstDay, { [firstDay]: [start('CA01', 'EMP03')] }).state;
    const task = s.tasks.find((t) => t.kind === 'CULTURE')!;
    expect(task.progressWorkUnits).toBe(1);
    expect(task.status).toBe(duration === 1 ? 'DONE' : 'RUNNING');
    s = runDays(s, cfg, firstDay + duration - 1).state;
    expect(s.tasks.find((t) => t.kind === 'CULTURE')!.completedDay).toBe(firstDay + duration - 1);
    expect(s.culture.experiences[0]!.verifiedDay).toBe(firstDay + duration - 1);
  });

  it('고용 당일 근무 시작일 전에는 활동을 거절한다', () => {
    const s = hireThird();
    s.day--;
    s.phase = 'AWAITING_INPUT';
    expect(culturePreview(s, config, 'CA01', 'EMP03').reasonKo).toContain('일부터 업무를 맡을 수 있습니다');
  });

  it('진행 중 저장을 이어 가도 전체 결과가 같다', () => {
    const cfg = structuredClone(config);
    cfg.culture!.activities[0]!.durationDays = 2;
    const p = plan(fresh(cfg), [start()], cfg).state;
    expect(p.tasks[0]!.status).toBe('RUNNING');
    const continuous = runDays(p, cfg, 3).state;
    expect(runDays(reload(p, cfg), cfg, 3).state).toEqual(continuous);
    const day1 = runDays(p, cfg, 1).state;
    expect(day1.tasks[0]!.status).toBe('RUNNING');
    expect(runDays(reload(day1, cfg), cfg, 3).state).toEqual(continuous);
  });

  it('새 업무의 라벨·단위·진행 상태를 명시한다', () => {
    const task = plan(fresh(), [start()]).state.tasks[0]!;
    expect(isDayBasedTask('CULTURE')).toBe(true);
    expect(taskSubjectKo(config, task)).toBe('시장과 포장 요구 탐방');
    expect(taskName('CULTURE')).toBe('현지 활동');
    expect(crewStatusKo(task)).toBe('◇ 현지 활동 중 0/1일');
    expect(taskSchedule(task, config)).toBe('현지 활동 중 — 시장과 포장 요구 탐방 0/1일');
  });
});

describe('직원·활동별 첫 완료 경험치', () => {
  it('첫 완료 10만 한 번 지급하고 다른 활동에서 다시 10을 받는다', () => {
    const s = done();
    expect(s.employees[0]!.xp).toBe(10);
    expect(s.xpAwards).toEqual({ [xpKey()]: true });
    expect(s.xpAwardAmounts).toEqual({ [xpKey()]: 10 });
    expect(completionReward('CULTURE', config)).toBeNull();
    expect(Object.keys(s.xpAwards).some((k) => k.includes('TASK-DONE-CULTURE-'))).toBe(false);
    const before = structuredClone(s);
    expect(awardXp(s, config, 'EMP01', 'CULTURE-FIRST-CA01', 'CULTURE_FIRST_XP', 10)).toBe(false);
    expect(s).toEqual(before);
    const next = runDays(s, config, 2, { 2: [start('CA02')] }).state;
    expect(next.employees[0]!.xp).toBe(20);
    expect(next.xpAwards).toEqual({ [xpKey()]: true, [xpKey('CA02')]: true });
  });

  it.each(['미완료', '다른 직원', '다른 종류', '다른 양', '업무 ID', '임의 사건'])('%s 보상 요청은 지급하지 않는다', (damage) => {
    const s = damage === '미완료' ? plan(fresh(), [start()]).state : done();
    const before = structuredClone(s);
    expect(awardXp(s, config, damage === '다른 직원' ? 'EMP02' : 'EMP01',
      damage === '업무 ID' ? `CULTURE-FIRST-${s.tasks[0]!.id}` : damage === '임의 사건' ? 'FAKE' : 'CULTURE-FIRST-CA01',
      damage === '다른 종류' ? 'TASK_COMPLETION_XP' : 'CULTURE_FIRST_XP', damage === '다른 양' ? 20 : 10)).toBe(false);
    expect(s).toEqual(before);
  });

  it('문턱을 넘으면 레벨 달성 로그가 남는다', () => {
    const cfg = structuredClone(config);
    cfg.employees[0]!.growth!.startXp = 90;
    const s = done(cfg);
    expect(s.employees[0]!.xp).toBe(100);
    expect(s.log.map((l) => l.textKo)).toContain('귀솔 레벨 2 달성');
  });

  it.each(['설정', '직원'])('%s의 성장이 꺼져 있으면 기록만 남긴다', (which) => {
    const cfg = structuredClone(config);
    if (which === '설정') cfg.growth = null;
    else cfg.employees[0]!.growth = null;
    const s = done(cfg);
    expect(s.employees[0]!.xp).toBe(0);
    expect(s.xpAwards).toEqual({});
    expect(s.culture.experiences).toHaveLength(1);
    expect(culturePreview(fresh(cfg), cfg, 'CA01', 'EMP01').newRecords.firstCompletionXp).toBe(0);
    expect(reload(s, cfg)).toEqual(s);
  });
});

const mutations: [string, (s: GameState) => void][] = [
  ...(['reports', 'experiences', 'relationEvents'] as const).map((group): [string, (s: GameState) => void] => [
    `${group} 키 중복`, (s) => { const records = s.culture[group]; records.push(structuredClone(records[0]!) as never); },
  ]),
  ['DONE 업무 없음', (s) => { s.tasks[0]!.status = 'RUNNING'; }],
  ['비용 누락', (s) => { s.ledger.entries = s.ledger.entries.filter((e) => !e.id.startsWith('CULTURE-FEE-')); s.ledger.postedIds = Object.fromEntries(s.ledger.entries.map((e) => [e.id, true])); }],
  ['비용 중복', (s) => { s.ledger.entries.push(structuredClone(s.ledger.entries.find((e) => e.id.startsWith('CULTURE-FEE-'))!)); }],
  ['활동에 없는 인물', (s) => { const r = s.culture.relationEvents[0]!; r.contactId = 'NPC_GUIDE'; r.key = cultureKeys(config, config.culture!.activities[0]!, 'EMP01').relationship('NPC_GUIDE'); }],
  ...(['reports', 'experiences', 'relationEvents'] as const).map((group): [string, (s: GameState) => void] => [
    `${group} 키 불일치`, (s) => { s.culture[group][0]!.key += '-변조'; },
  ]),
  ['보고 날짜', (s) => { s.culture.reports[0]!.day++; }],
  ['경험 날짜', (s) => { s.culture.experiences[0]!.verifiedDay++; }],
  ['관계 날짜', (s) => { s.culture.relationEvents[0]!.day++; }],
  ['첫 XP 누락', (s) => { delete s.xpAwards[xpKey()]; delete s.xpAwardAmounts[xpKey()]; s.employees[0]!.xp -= 10; }],
  ['첫 XP 중복 별칭', (s) => { const key = `${xpKey()}|중복`; s.xpAwards[key] = true; s.xpAwardAmounts[key] = 10; s.employees[0]!.xp += 10; }],
  ['업무 ID 첫 XP', (s) => { const key = `EMP01|CULTURE-FIRST-${s.tasks[0]!.id}|CULTURE_FIRST_XP`; delete s.xpAwards[xpKey()]; delete s.xpAwardAmounts[xpKey()]; s.xpAwards[key] = true; s.xpAwardAmounts[key] = 10; }],
  ['일반 TASK-DONE 보상', (s) => { const key = `EMP01|TASK-DONE-${s.tasks[0]!.id}|TASK_COMPLETION_XP`; s.xpAwards[key] = true; s.xpAwardAmounts[key] = 10; s.employees[0]!.xp += 10; }],
  ['금액', (s) => { s.ledger.entries.find((e) => e.id.startsWith('CULTURE-FEE-'))!.lines.forEach((l) => l.amount *= 2); }],
  ['통화', (s) => { s.ledger.entries.find((e) => e.id.startsWith('CULTURE-FEE-'))!.currency = 'USD'; }],
  ['업무 없는 비용', (s) => { const fee = s.ledger.entries.find((e) => e.id.startsWith('CULTURE-FEE-'))!; delete s.ledger.postedIds[fee.id]; fee.id = 'ORPHAN'; s.ledger.postedIds[fee.id] = true; }],
  ['훈련비 재사용', (s) => { s.ledger.entries.find((e) => e.id.startsWith('CULTURE-FEE-'))!.lines[0]!.account = 'TRAINING_EXPENSE'; }],
  ['활동 도시', (s) => { s.tasks[0]!.cityId = 'SHANGHAI'; }],
  ['기간', (s) => { s.tasks[0]!.requiredWorkUnits = 2; }],
  ['계약 연결', (s) => { s.tasks[0]!.contractId = 'CT001'; }],
  ['보고 출처', (s) => { s.culture.reports[0]!.sourceContactIds = ['NPC_GUIDE']; }],
  ['경험 국가', (s) => { s.culture.experiences[0]!.countryCode = 'CN'; }],
  ['담당자', (s) => { s.culture.experiences[0]!.employeeId = 'EMP02'; }],
  ['같은 직원·활동 업무 중복', (s) => { s.tasks.push({ ...s.tasks[0]!, id: 'DUPLICATE-TASK' }); }],
];
describe('변조 저장', () => {
  it.each(mutations)('%s은 SaveError로 거절한다', (_name, mutate) => {
    const s = done();
    mutate(s);
    expect(() => reload(s)).toThrow(SaveError);
  });

  it('문화 비활성 설정은 업무·기록·비용을 모두 거절한다', () => {
    const cfg = { ...config, culture: null };
    for (const s of [done(), plan(fresh(), [start()]).state]) expect(() => reload(s, cfg)).toThrow(SaveError);
  });
});

describe('M2 기대 경로 회귀', () => {
  it.each(expectedM2('SCENARIO_M2_MULTI_TRADE').paths)('$id는 쉬는 날 활동을 해도 USD·계약·견적·운송·난수가 같다', (path) => {
    const offers = [...path.trades.map(([buy]) => buy), ...path.forwarding_offer_ids];
    const commands: Command[] = [
      ...path.trades.map(([buyOfferId, sellOfferId], i): Command => ({ id: `T${i}`, type: 'ACCEPT_TRADE', buyOfferId, sellOfferId })),
      ...path.forwarding_offer_ids.map((offerId, i): Command => ({ id: `F${i}`, type: 'ACCEPT_FORWARDING', offerId })),
      ...offers.map((o, i): Command => ({ id: `B${i}`, type: 'BOOK_SAILING', contractId: `CT00${i + 1}`, sailingId: path.sailing_by_offer[o]! })),
      { id: 'A1', type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: 'EMP01' },
      { id: 'A2', type: 'ASSIGN_TASK', taskId: 'TASK002', employeeId: 'EMP02' },
    ];
    const script: DayScript = { 1: commands, 2: [{ id: 'A3', type: 'ASSIGN_TASK', taskId: 'TASK003', employeeId: 'EMP01' }] };
    const baseline = runDays(createGame(config), config, path.final_day, script).state;
    const result = runDays(createGame(config), config, path.final_day, { ...script, 3: [start()] });
    expect(result.results[3]![0]!.status).toBe('APPLIED');
    const s = result.state;
    expect(summarize(s.ledger, 'USD')).toEqual(summarize(baseline.ledger, 'USD'));
    for (const field of ['contracts', 'offers', 'invoices', 'cargoLots', 'shipments', 'bookings', 'rng'] as const) expect(s[field]).toEqual(baseline[field]);
    expect(s.ledger.entries.filter((e) => !e.id.startsWith('CULTURE-FEE-'))).toEqual(baseline.ledger.entries);
    expect(krw(baseline).cash - krw(s).cash).toBe(krw(s).cultureExpense);
    expect(balance(s.ledger, 'USD', 'CASH')).toBe((path.cash_final as number) * 100);
    checkInvariants(s, config);
  });
});

describe('완료 근거·배정 순서 추가 경계', () => {
  it('활동 정의 순서와 달라도 회사·경험·관계는 업무 배정 순서로 기록한다', () => {
    const s = done(config, [start('CA03', 'EMP02'), start('CA01', 'EMP01')]);
    expect(s.culture.reports.map((r) => r.activityId)).toEqual(['CA03', 'CA01']);
    expect(s.culture.experiences.map((r) => r.employeeId)).toEqual(['EMP02', 'EMP01']);
    expect(s.culture.relationEvents.map((r) => [r.employeeId, r.contactId])).toEqual([
      ['EMP02', 'NPC_MARKET'], ['EMP02', 'NPC_GUIDE'], ['EMP01', 'NPC_MARKET'],
    ]);
  });

  it('2일 활동 진행 중에는 다음 날에도 같은 활동의 다른 직원을 거절한다', () => {
    const cfg = structuredClone(config);
    cfg.culture!.activities[0]!.durationDays = 2;
    const s = openDay(done(cfg), cfg).state;
    expect(culturePreview(s, cfg, 'CA01', 'EMP02').allowed).toBe(false);
    const result = plan(s, [start('CA01', 'EMP02')], cfg);
    expect(result.results[0]!.reasonKo).toContain('끝난 뒤에');
    unchangedExceptCommand(s, result.state);
  });

  it('회사 보고서를 다시 듣는 직원도 실제 근거로 자신의 첫 완료 보상을 받는다', () => {
    const s = runDays(done(), config, 2, { 2: [start('CA01', 'EMP02')] }).state;
    expect(s.xpAwardAmounts).toEqual({ [xpKey()]: 10, [xpKey('CA01', 'EMP02')]: 10 });
    expect(s.culture.reports[0]!.sourceContactIds).toEqual(['NPC_MARKET']);
    expect(cultureBook(s, config).employees.map((e) => e.experiences.length)).toEqual([1, 1]);
  });

  it.each(['reports', 'experiences', 'relationEvents'] as const)('DONE 뒤 %s 누락은 잔액·XP가 맞아도 거절한다', (group) => {
    const s = done();
    s.culture[group] = [];
    expect(() => reload(s)).toThrow(SaveError);
  });

  it('문화가 꺼진 저장은 업무만 또는 비용만 남아도 거절한다', () => {
    const cfg = { ...config, culture: null };
    const assigned = plan(fresh(), [start()]).state;
    for (const only of ['업무', '비용']) {
      const s = structuredClone(assigned);
      if (only === '업무') s.ledger = createGame(config).ledger;
      else s.tasks = [];
      expect(() => reload(s, cfg)).toThrow(SaveError);
    }
  });
});
