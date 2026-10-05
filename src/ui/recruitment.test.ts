import { describe, expect, it } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay, planCommands, planState } from '../engine/engine';
import { employedDefs } from '../engine/employees';
import { runDays } from '../engine/testkit';
import type { Command, GameState } from '../engine/types';
import { batchUnlocked, candidateLabel, crewEntries, interviewBlock, interviewPreview, recruitmentPanel, taskSchedule } from './recruitment';
import { crewCard } from './card';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const initial = () => openDay(createGame(config), config).state;
const steps: Command[] = [
  { id: 'A', type: 'ACCEPT_TRADE', buyOfferId: 'OFFER_BUY_02', sellOfferId: 'OFFER_SELL_02' },
  { id: 'B', type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: 'EMP01' },
  { id: 'C', type: 'BOOK_SAILING', contractId: 'CT001', sailingId: 'ROUTE02-D002' },
];
const scout: Command = { id: 'S', type: 'SCOUT_SITE', venueId: 'VEN_PORT', employeeId: 'EMP02' };
const quest: Command = { id: 'Q', type: 'START_RECRUIT_QUEST', candidateId: 'EMP04', employeeId: 'EMP01' };
const hired = config.employees.find((e) => e.id === 'EMP04')!;
const check = (s: GameState) => (cmd: Command) => planCommands(s, config, [cmd])[0]!;
const panel = (s: GameState, interviewId: string | null = null) => recruitmentPanel(s, config, {}, interviewId, check(s));
const ready = () => openDay(runDays(createGame(config), config, 3, { 1: [scout], 2: [quest] }).state, config).state;

describe('한 번에 확정 화면 공개', () => {
  it('처음과 배정만 했을 때 숨긴다', () => {
    expect(batchUnlocked(initial())).toBe(false);
    expect(batchUnlocked(planState(initial(), config, steps.slice(0, 2)).state)).toBe(false);
  });
  it('단계별 배정·예약 반영 뒤 공개한다', () => {
    expect(batchUnlocked(runDays(createGame(config), config, 1, { 1: steps }).state)).toBe(true);
  });
  it('오늘 대기 명령만으로 공개하며 빼면 다시 숨긴다', () => {
    const state = initial();
    expect(batchUnlocked(planState(state, config, steps).state)).toBe(true);
    expect(batchUnlocked(state)).toBe(false);
    expect(batchUnlocked(planState(state, config, steps.slice(0, 2)).state)).toBe(false);
  });
  it('거절된 예약과 일괄 확정만으로는 공개하지 않는다', () => {
    const wrong: Command = { ...steps[2]!, type: 'BOOK_SAILING', contractId: 'CT001', sailingId: 'ROUTE01-D002' };
    expect(batchUnlocked(planState(initial(), config, [...steps.slice(0, 2), wrong]).state)).toBe(false);
    expect(batchUnlocked(planState(initial(), config, [{ ...steps[0]!, plan: { employeeId: 'EMP01', sailingId: 'ROUTE02-D002' } } as Command]).state)).toBe(false);
  });
});

describe('영입 화면의 엔진 연결', () => {
  it('미발견 후보는 수만 보이고 이름·종·단서를 숨긴다', () => {
    const html = panel(initial());
    expect(html).toContain('미발견 후보 4명');
    expect(html).toContain('항만 물류단지');
    for (const e of config.employees.slice(2)) expect(html).not.toContain(e.nameKo);
    expect(html).not.toContain('현무');
    expect(html).toContain('현장 조사(1pt)');
  });
  it('조사·발견·의뢰·면담·고용과 다음 날 카드가 같은 상태를 읽는다', () => {
    const scouting = planState(initial(), config, [scout]).state;
    expect(panel(scouting)).toContain('현장 조사 중 — 항만 물류단지 0/1pt');
    const discovered = openDay(runDays(createGame(config), config, 1, { 1: [scout] }).state, config).state;
    expect(panel(discovered)).toContain('현돌');
    expect(panel(discovered)).toContain('영입 의뢰(3pt)');
    const progressing = planState(discovered, config, [quest]).state;
    expect(candidateLabel(progressing, progressing.recruitment.candidates.find((c) => c.employeeId === hired.id)!)).toBe('의뢰 진행 중 0/3pt');
    const s = ready();
    expect(panel(s, hired.id)).toContain('현돌 고용');
    const cmd: Command = { id: 'H', type: 'HIRE_CANDIDATE', candidateId: hired.id };
    const today = planState(s, config, [cmd]).state;
    expect(panel(today)).toContain('고용됨 — 5일부터 근무');
    const tomorrow = openDay(runDays(s, config, 4, { 4: [cmd] }).state, config).state;
    expect(employedDefs(tomorrow, config)).toContain(hired);
    expect(crewCard(hired, tomorrow, false)).toContain('대기 — 배정 가능');
  });
  it('카드·운영표 필터는 발견 후보만 포함하고 대기·업무 중에는 근무 직원을 보여 준다', () => {
    expect(crewEntries(initial(), config, 'all')).toHaveLength(2);
    expect(crewEntries(initial(), config, 'candidate')).toEqual([]);
    const s = ready();
    expect(crewEntries(s, config, 'candidate').map((x) => x.def.id)).toEqual(['EMP04', 'EMP06']);
    expect(crewEntries(s, config, 'all')).toHaveLength(4);
    expect(crewEntries(s, config, 'free')).toHaveLength(2);
    const busy = planState(initial(), config, [scout]).state;
    expect(crewEntries(busy, config, 'busy').map((x) => x.def.id)).toEqual(['EMP02']);
    const entry = crewEntries(busy, config, 'busy')[0]!;
    expect(crewCard(entry.def, busy, false, taskSchedule(entry.task!, config))).toContain('현장 조사 중 — 항만 물류단지 0/1pt');
  });
  it('현돌의 5일 면담 비용과 남은 급여를 표시한다', () => {
    const s = { ...ready(), day: 5 };
    const p = interviewPreview(s, config, hired);
    expect(p.signingFee).toBe(550_000);
    expect(p.dailyWage).toBe(110_000);
    expect(p.remainingWages).toBe(110_000 * (config.campaignDays - 5));
    expect(p.throughput).toBe(3);
    expect(interviewBlock(s, config, hired, check(s)({ id: 'H', type: 'HIRE_CANDIDATE', candidateId: hired.id }))).toContain('550,000');
  });
  it('원화 부족이면 엔진의 거절 이유와 비활성 고용 버튼을 표시한다', () => {
    const s = ready();
    s.ledger.entries.push({ ...s.ledger.entries[0]!, id: 'DRAIN', currency: 'KRW', lines: [{ account: 'WAGE_EXPENSE', amount: 100_000_000 }, { account: 'CASH', amount: -100_000_000 }] });
    const result = check(s)({ id: 'H', type: 'HIRE_CANDIDATE', candidateId: hired.id });
    expect(result.status).toBe('REJECTED');
    const html = interviewBlock(s, config, hired, result);
    expect(html).toContain('disabled');
    expect(html).toContain(result.reasonKo);
  });
  it('현재 계약의 준비 미배정·출항 불참 개수를 contractProgress에서 읽는다', () => {
    const s = planState(initial(), config, steps.slice(0, 1)).state;
    expect(interviewPreview(s, config, hired).unassigned).toBe(1);
    expect(interviewPreview(s, config, hired).willMiss).toBe(0);
    const busy = planState(initial(), config, steps).state;
    const task = busy.tasks[0]!;
    task.requiredWorkUnits = 100;
    expect(interviewPreview(busy, config, hired).willMiss).toBe(1);
    expect(taskSchedule(task, config)).toContain('수출 준비 중 — CT001');
  });
});
