import { describe, expect, it } from 'vitest';
import { createGame, openDay, planState, commitDay } from './engine';
import { allocateHandling, coveredSailings, handlingCapacityPt, projectPrepCompletion, storageCapacityLiters, storageUsedLiters } from './operations';
import { fundsPosition, sailingLoad } from './reservations';
import { findSailing } from './catalog';
import { summarize } from './ledger';
import { payrollRunwayDay } from './previews';
import { runDays } from './testkit';
import { caseOf, config, atDay, planned, scriptOf, applied, book } from './m2a5-testkit';
import type { GameState } from './types';

const c3 = caseOf('P0-M2A5-03'), c4 = caseOf('P0-M2A5-04'), c10 = caseOf('P0-M2A5-10'), c11 = caseOf('P0-M2A5-11');
function spaceFixture() {
  const cfg = structuredClone(config);
  for (const f of c11.test_fixture.offers) {
    const t = cfg.operations!.market.forwarding.templates.find((t) => t.id === f.template_id)!;
    cfg.offers.push({ ...cfg.offers.find((o) => o.kind === 'forwarding')!, ...t, id: f.id,
      quantityStep: t.quantity, maxQuantity: t.quantity, templateId: t.id, deliveryDeadlineDay: f.delivery_deadline_day });
  }
  return cfg;
}

describe('P0-M2A5-03 보관 한도', () => {
  it('앞 명령의 보관량으로 거절하고 출항하면 공간이 생긴다', () => {
    const action = c3.actions[0]!, before = atDay(action.day);
    const accepted = planState(before, config, action.commands.slice(0, -1));
    const refused = planState(accepted.state, config, action.commands.slice(-1));
    expect(refused.results).toEqual([{ commandId: action.commands.at(-1)!.id, status: 'REJECTED', reasonKo: '보관 공간 부족 — 평택 창고 33 / 40 m³, 이 화물 9 m³. 출항하거나 확장하면 공간이 생깁니다.' }]);
    expect({ ...refused.state, processedCommands: accepted.state.processedCommands }).toEqual(accepted.state);
    expect([storageUsedLiters(accepted.state, config), storageCapacityLiters(accepted.state, config)])
      .toEqual([c3.expected_numeric.accepted_storage, c3.expected_numeric.capacity]);
    const after = runDays(accepted.state, config, c3.test_fixture.departure_day).state;
    expect([storageUsedLiters(after, config), storageCapacityLiters(after, config)])
      .toEqual([c3.expected_numeric.after_departure_storage, c3.expected_numeric.capacity]);
    expect(fundsPosition(accepted.state, config, 'USD')).toEqual({ currency: 'USD', cash: c3.expected_numeric.cash, reserved: 0, reservedCommitments: 0, unpaidObligations: 0, available: c3.expected_numeric.cash });
  });
  it('전날 확장하면 세 화물을 모두 수락하고 설치비와 운임 예약이 남는다', () => {
    const action = c3.actions[0]!, cfg = config;
    const s = atDay(action.day, cfg, scriptOf(c3, 'expanded'));
    const p = planState(s, cfg, action.commands);
    expect(p.results).toEqual(applied(action.commands));
    expect([storageUsedLiters(p.state, cfg), storageCapacityLiters(p.state, cfg)])
      .toEqual([c3.expected_numeric.requested_storage, c3.expected_numeric.expanded_capacity]);
    expect(fundsPosition(p.state, cfg, 'USD')).toEqual({ currency: 'USD', cash: c3.expected_numeric.cash, reserved: c3.expected_numeric.freight_reserved, reservedCommitments: 0, unpaidObligations: 0, available: c3.expected_numeric.cash - c3.expected_numeric.freight_reserved });
    const expenses = cfg.operations!.fixedCosts.rent.amountMinor + c3.expected_numeric.setup + (action.day - 1) * caseOf('P0-M2A5-06').expected_numeric.wage_daily;
    expect(summarize(p.state.ledger, 'KRW')).toEqual(book('KRW', { cash: cfg.startingCash.KRW! - expenses, totalAssets: cfg.startingCash.KRW! - expenses,
      facilitySetupExpense: c3.expected_numeric.setup, rentExpense: cfg.operations!.fixedCosts.rent.amountMinor,
      wageExpense: (action.day - 1) * caseOf('P0-M2A5-06').expected_numeric.wage_daily, profit: -expenses }));
  });
});

describe('P0-M2A5-04 하루 처리 한도', () => {
  it('영입한 3pt 직원과 2pt 직원들의 수요를 출항·계약 순서로 나눈다', () => {
    const p = planned(c4), n = c4.expected_numeric;
    expect(p.results).toEqual(applied(c4.actions.filter((a) => a.variant === 'A').at(-1)!.commands));
    expect(allocateHandling(p.state, config)).toEqual({ capacityPt: n.capacity, allocations: [
      { taskId: 'TASK001', contractId: 'CT001', wantPt: 2, gotPt: 2 },
      { taskId: 'TASK002', contractId: 'CT002', wantPt: 3, gotPt: 3 },
      { taskId: 'TASK003', contractId: 'CT003', wantPt: 2, gotPt: 1 },
    ] });
    expect(commitDay(p.state, config, []).state.operations!.handlingLog.at(-1)).toEqual(n.log);
    expect(fundsPosition(p.state, config, 'USD')).toEqual({ currency: 'USD', cash: n.cash, reserved: n.duty, reservedCommitments: 0, unpaidObligations: 0, available: n.cash - n.duty });
  });
});

describe('P0-M2A5-10 창고 확장', () => {
  it('다음 날 한도와 다음 임차일 요금에만 효력이 있다', () => {
    const p = planned(c10), n = c10.expected_numeric;
    expect(p.results).toEqual(applied(c10.actions[0]!.commands));
    expect([storageCapacityLiters(p.state, config), handlingCapacityPt(p.state, config)]).toEqual(n.capacity_before);
    const next = commitDay(p.state, config, []).state;
    expect([storageCapacityLiters(next, config), handlingCapacityPt(next, config)]).toEqual(n.capacity_after);
    expect([payrollRunwayDay(p.state, config)]).toEqual([n.runway]);
    const supported = { [c10.test_fixture.keep_alive_day]: [c10.test_fixture.keep_alive_command] };
    const end = runDays(p.state, config, n.rent_days.at(-1), supported).state;
    const entries = end.ledger.entries.filter((e) => e.lines.some((l) => l.account === 'RENT_EXPENSE') && n.rent_days.includes(e.day));
    expect(entries).toEqual(n.rent_days.map((day: number) => ({ id: `RENT-D${String(day).padStart(3, '0')}`, day, currency: 'KRW', reason: `평택 창고 ${day}일 임차료`,
      lines: [{ account: 'RENT_EXPENSE', amount: n.rent }, { account: 'CASH', amount: -n.rent }] })));
    expect(planState(p.state, config, [{ type: 'EXPAND_WAREHOUSE', id: 'AGAIN' }]).results)
      .toEqual([{ commandId: 'AGAIN', status: 'REJECTED', reasonKo: `창고 확장은 한 번만 할 수 있습니다(이미 ${n.effective_day}일부터 확장).` }]);
  });
});

describe('P0-M2A5-11 선복 장기 계약', () => {
  it('서명 전에는 두 번째 예약을 철회하고 서명 후에는 함께 실을 수 있다', () => {
    const cfg = spaceFixture(), action = c11.actions[0]!, signed = c11.actions[1]!, n = c11.expected_numeric;
    const a = planState(atDay(action.day, cfg), cfg, action.commands);
    expect(a.results).toEqual([applied(action.commands)[0], { commandId: action.commands[1]!.id, status: 'REJECTED', reasonKo: '한 번에 확정할 수 없습니다 — 운송편 예약 불가: 이 출항편의 남은 화물 공간이 부족합니다 (부피 18m³ 필요, 남은 12m³). 견적도 수락하지 않습니다.' }]);
    const b = planState(atDay(action.day, cfg), cfg, [...signed.commands, ...action.commands]);
    expect(b.results).toEqual(applied([...signed.commands, ...action.commands]));
    expect(sailingLoad(b.state, cfg, findSailing(cfg, c11.test_fixture.covered_sailing)!)).toEqual({ sailingId: c11.test_fixture.covered_sailing,
      massGrams: 3600000, volumeLiters: n.storage, capacityGrams: n.capacity[1], capacityLiters: n.capacity[0] });
    expect(sailingLoad(b.state, cfg, findSailing(cfg, c11.test_fixture.early_sailing)!)).toEqual({ sailingId: c11.test_fixture.early_sailing,
      massGrams: 0, volumeLiters: 0, capacityGrams: n.base_capacity[1], capacityLiters: n.base_capacity[0] });
  });
  it('적용 편·예약 이동 창·쓰지 않은 편 요금도 정확하다', () => {
    const n = c11.expected_numeric;
    expect(coveredSailings(config, c11.test_fixture.route, c11.actions[1]!.day).map((s) => s.departureDay)).toEqual(n.sailing_days);
    expect(coveredSailings(config, c11.test_fixture.other_route, c11.actions[1]!.day).map((s) => s.departureDay)).toEqual(n.other_sailing_days);
    let s = planState(atDay(c11.actions[1]!.day), config, c11.actions[1]!.commands).state;
    for (const [day, reserved] of n.reserved_days as [number, number][]) {
      s = openDay(runDays(s, config, day - 1).state, config).state;
      const fees = n.sailing_days.filter((d: number) => d < day).length * config.operations!.spaceContract.feeMinor;
      expect(fundsPosition(s, config, 'USD')).toEqual({ currency: 'USD', cash: config.startingCash.USD! - fees, reserved, reservedCommitments: reserved, unpaidObligations: 0, available: config.startingCash.USD! - fees - reserved });
    }
    const cfg = { ...config, startingCash: { ...config.startingCash, KRW: config.startingCash.KRW! * 10 } };
    const end = runDays(createGame(cfg), cfg, cfg.campaignDays, scriptOf(c11, 'signed')).state;
    expect(summarize(end.ledger, 'USD')).toEqual(book('USD', { cash: cfg.startingCash.USD! - n.fee_total,
      totalAssets: cfg.startingCash.USD! - n.fee_total, spaceContractExpense: n.fee_total, profit: -n.fee_total }));
  });
});

describe('M2a-5 처리 순서', () => {
  it('뒤 계약의 이른 출항이 앞서고 예약 없는 업무는 납기 순이다', () => {
    const s = planned(c4).state;
    s.bookings[2]!.departureDay = s.bookings[0]!.departureDay - 1;
    expect(allocateHandling(s, config)).toEqual({ capacityPt: c4.expected_numeric.capacity, allocations: [
      { taskId: 'TASK003', contractId: 'CT003', wantPt: 2, gotPt: 2 },
      { taskId: 'TASK001', contractId: 'CT001', wantPt: 2, gotPt: 2 },
      { taskId: 'TASK002', contractId: 'CT002', wantPt: 3, gotPt: 2 },
    ] });
    s.bookings.forEach((b) => { b.status = 'CANCELLED'; });
    s.contracts[2]!.deliveryDeadlineDay = s.contracts[0]!.deliveryDeadlineDay - 1;
    expect(allocateHandling(s, config)).toEqual({ capacityPt: c4.expected_numeric.capacity, allocations: [
      { taskId: 'TASK003', contractId: 'CT003', wantPt: 2, gotPt: 2 },
      { taskId: 'TASK001', contractId: 'CT001', wantPt: 2, gotPt: 2 },
      { taskId: 'TASK002', contractId: 'CT002', wantPt: 3, gotPt: 2 },
    ] });
  });
});

describe('M2a-5 준비 예측과 실제 진행', () => {
  it.each([false, true])('확장 %s에서 전체 예측과 실제 완료일이 같다', (expanded) => {
    const script = { ...scriptOf(c4), ...(expanded ? scriptOf(c4, 'expanded') : {}) };
    const action = c4.actions.find((a) => a.day === c4.test_fixture.assignment_day)!;
    const s = planState(atDay(action.day, config, script), config, action.commands).state;
    const before = structuredClone(s), days = expanded ? c4.expected_numeric.expanded_ready_days : c4.expected_numeric.ready_days;
    const expected = s.contracts.map((c, i) => ({ taskId: c.prepTaskId, contractId: c.id, readyDay: days[i],
      todayPt: i === 0 ? 2 : i === 1 ? 3 : expanded ? 2 : 1, todayWantPt: i === 1 ? 3 : 2, waitDays: !expanded && i === 2 ? 1 : 0 }));
    expect(projectPrepCompletion(s, config)).toEqual(expected); expect(s).toEqual(before);
    const after = runDays(s, config, c4.test_fixture.through_day).state;
    expect(after.tasks.filter((t) => t.contractId !== null).map((t) => ({ taskId: t.id, contractId: t.contractId, readyDay: t.completedDay })))
      .toEqual(expected.map(({ taskId, contractId, readyDay }) => ({ taskId, contractId, readyDay })));
  });
  it('대기 배정은 설정 직원 순서를 쓰며 예약된 부재 동안에는 새 배정을 하지 않는다', () => {
    const s: GameState = planned(c4).state;
    for (const t of s.tasks.filter((t) => t.contractId !== null)) { t.status = 'QUEUED'; t.assignedEmployeeId = null; }
    const first = projectPrepCompletion(s, config, { assignQueued: true });
    const blocked = projectPrepCompletion(s, config, { assignQueued: true, blocked: s.employees.filter((e) => e.employmentStatus === 'employed')
      .map((e) => ({ employeeId: e.id, fromDay: s.day, toDay: config.campaignDays })) });
    expect(blocked).toEqual(first.map((p) => ({ ...p, readyDay: null, todayPt: 0, todayWantPt: 0, waitDays: 0 })));
  });
});
