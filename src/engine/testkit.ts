// 테스트와 화면 자동 진행에서 함께 쓰는 실행 도우미.

import { commitDay, openDay } from './engine';
import type { Command, CommandResult, GameState, ScenarioConfig } from './types';

export type DayScript = Record<number, Command[]>;

/** 현재 날짜부터 lastDay 마감까지 진행한다. 각 날의 명령은 script에서 가져온다. */
export function runDays(
  state: GameState,
  config: ScenarioConfig,
  lastDay: number,
  script: DayScript = {},
): { state: GameState; results: Record<number, CommandResult[]> } {
  let s = state;
  const results: Record<number, CommandResult[]> = {};
  while (s.phase !== 'ENDED' && s.day <= lastDay) {
    s = openDay(s, config).state;
    const day = s.day;
    const committed = commitDay(s, config, script[day] ?? []);
    results[day] = committed.results;
    s = committed.state;
  }
  return { state: s, results };
}

/** M1 기본 진행: 1일차에 견적 수락·준비 업무 배정·2일 출항편 예약. */
export function standardDayOneCommands(config: ScenarioConfig): Command[] {
  const employee = config.employees[0];
  const buy = config.offers.find((o) => o.kind === 'supplier');
  const sell = config.offers.find((o) => o.kind === 'customer');
  const route = config.routes[0];
  if (!employee || !buy || !sell || !route) throw new Error('M1 기본 진행에 필요한 직원·견적·노선이 없습니다.');
  return [
    { id: 'CMD-ACCEPT', type: 'ACCEPT_TRADE', buyOfferId: buy.id, sellOfferId: sell.id },
    { id: 'CMD-ASSIGN', type: 'ASSIGN_TASK', taskId: 'TASK001', employeeId: employee.id },
    { id: 'CMD-BOOK', type: 'BOOK_SAILING', contractId: 'CT001', sailingId: `${route.id}-D002` },
  ];
}
