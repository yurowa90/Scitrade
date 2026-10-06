import { describe, expect, it } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay } from './engine';
import { summarize } from './ledger';
import { contractProgress, portWaitStatus } from './progress';
import { runDays, standardDayOneCommands } from './testkit';
import type { Command } from './types';

const cosmetics: Command[] = [
  { id: 'A', type: 'ACCEPT_TRADE', buyOfferId: 'OFFER_BUY_02', sellOfferId: 'OFFER_SELL_02' },
  { id: 'B', type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: 'EMP01' },
  { id: 'C', type: 'BOOK_SAILING', contractId: 'CT001', sailingId: 'ROUTE02-D002' },
];

describe('항만 대기와 오늘 도착 구분', () => {
  it('M2 화장품 6일 판단 단계는 경고 없이 오늘 도착을 안내하고 그대로 도착·인도한다', () => {
    const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
    const state = openDay(runDays(createGame(config), config, 5, { 1: cosmetics }).state, config).state;
    expect(state.day).toBe(6);
    expect(state.shipments[0]).toMatchObject({ scheduledArrivalDay: 6, arrivalDay: null, observedWaitDays: 0 });
    const before = structuredClone(state);
    expect(contractProgress(state, config, state.contracts[0]!)).toEqual({
      nextKo: '오늘 도착 예정 — 하루 진행 때 하역합니다', blockers: [],
    });
    expect(state).toEqual(before);
    const after = runDays(state, config, 6).state;
    expect(after.shipments[0]).toMatchObject({ arrivalDay: 6, releaseDay: 6, observedWaitDays: 0, delayEventIds: [] });
    expect(after.contracts[0]).toMatchObject({ deliveredDay: 6, lateDays: 0, priceReductionMinor: 0 });
    expect(after.invoices[0]).toMatchObject({ dueDay: 12, amountMinor: 250_000 });
    expect(after.log).toContainEqual({ day: 6, textKo: 'SH001 도착: 상하이. 관세 100.00 USD 지급' });
    expect(after.ledger.entries.find((e) => e.id === 'SALE-CT001')).toMatchObject({ day: 6 });
    expect(summarize(after.ledger, 'USD')).toMatchObject({ cash: 72_000, accountsReceivable: 250_000 });
    const collected = runDays(after, config, 12).state;
    expect(collected.contracts[0]).toMatchObject({ status: 'COMPLETED', completedDay: 12 });
    expect(summarize(collected.ledger, 'USD')).toMatchObject({ cash: 322_000, accountsReceivable: 0 });
  });

  it.each([
    [5, 'SHANGHAI', 5, 8, 'AT_SEA'],
    [6, 'YOKOHAMA', 6, 8, 'ARRIVING_TODAY'],
    [6, 'SHANGHAI', 7, 8, 'ARRIVING_TODAY'],
    [6, 'SHANGHAI', 4, 5, 'ARRIVING_TODAY'],
    [6, 'SHANGHAI', 6, 6, 'WAITING_RESTRICTION'],
  ] as const)('%i일·%s항 제한 %i~%i일은 %s이고 상태를 바꾸지 않는다', (day, cityId, startDay, endDay, status) => {
    const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
    config.portRestrictions = [{ eventInstanceId: 'TEST', templateId: 'EV02', cityId, startDay, endDay,
      announceDay: 1, forecastKo: '시험용 하역 제한' }];
    const state = openDay(runDays(createGame(config), config, day - 1, { 1: cosmetics }).state, config).state;
    const before = structuredClone(state), beforeConfig = structuredClone(config);
    expect(portWaitStatus(state, config, state.shipments[0]!)).toBe(status);
    expect(state).toEqual(before);
    expect(config).toEqual(beforeConfig);
  });

  it('이미 도착한 화물은 뒤에 항만 제한이 생겨도 대기로 표시하지 않는다', () => {
    const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
    const state = runDays(createGame(config), config, 6, { 1: cosmetics }).state;
    config.portRestrictions = [{ eventInstanceId: 'TEST', templateId: 'EV02', cityId: 'SHANGHAI',
      startDay: 7, endDay: 8, announceDay: 7, forecastKo: '시험용 하역 제한' }];
    expect(portWaitStatus(state, config, state.shipments[0]!)).toBe('ARRIVED');
  });

  it('M1 제한 양 끝날에는 실제 대기 일수로 경고하고 9일에는 하역 재개를 알린다', () => {
    const config = loadScenario('SCENARIO_M1_DELAY_ACCEPTED');
    let state = runDays(createGame(config), config, 6, { 1: standardDayOneCommands(config) }).state;
    for (const day of [7, 8]) {
      state = openDay(state, config).state;
      expect(state.day).toBe(day);
      expect(contractProgress(state, config, state.contracts[0]!).blockers).toEqual([{
        code: 'WAITING_PORT_RESTRICTION', severity: 'warn',
        messageKo: `요코하마항 하역 중단으로 바다에서 대기 중입니다 (${day - 7}일째). 납기 8일을 넘기면 50.00 USD 감액됩니다.`,
      }]);
      state = runDays(state, config, day).state;
    }
    state = openDay(state, config).state;
    expect(state.shipments[0]!.observedWaitDays).toBe(2);
    expect(contractProgress(state, config, state.contracts[0]!)).toEqual({
      nextKo: '하역 재개 — 오늘 도착 예정 (대기 2일)', blockers: [],
    });
    const arrived = runDays(state, config, 9).state;
    expect(arrived.shipments[0]).toMatchObject({ arrivalDay: 9, observedWaitDays: 2 });
    expect(arrived.contracts[0]).toMatchObject({ deliveredDay: 9, priceReductionMinor: 5_000 });
    expect(summarize(runDays(arrived, config, 11).state.ledger, 'USD').cash).toBe(1_010_000);
  });
});
