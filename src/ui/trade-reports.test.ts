import { cityName, unitKo } from '../engine/catalog';
import { workloadSummary } from '../engine/capacity';
import { isAvailableFromToday } from '../engine/employees';
import { formatMoney } from '../engine/money';
import { contractProgress } from '../engine/progress';
import { fundsPosition } from '../engine/reservations';
import type { Command } from '../engine/types';
import { BOTTLENECK_OF, bottlenecks, cargoListKo, heldCargoByGood, rateKo, settlementRows, upcomingSummary, workloadLinesKo } from './reports';
import { describe, expect, it } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay, planState } from '../engine/engine';
import { campaignSummary, tradePairs, upcomingPayments, companyReport } from '../engine/reports';
import { acceptAllFeasible, runToCampaignEnd, runDays, standardDayOneCommands } from '../engine/testkit';
import { krwReportRows, KRW_REPORT_NOTE_CULTURE_KO, KRW_REPORT_NOTE_KO } from './reports';
import { cancellationPreviewKo } from './trade';
import { crewNoteKo } from './crew-status';

const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
describe('취소 안내와 원화 보고', () => {
  it.each([['ROUTE01',150],['ROUTE02',130]] as const)('%s 예약의 엔진 환급·취소비를 표시한다', (route, refund) => {
    const commands = standardDayOneCommands(config);
    const second = route === 'ROUTE02';
    commands[0] = { id: 'A', type: 'ACCEPT_TRADE', buyOfferId: second ? 'OFFER_BUY_02' : 'OFFER_BUY_01', sellOfferId: second ? 'OFFER_SELL_02' : 'OFFER_SELL_01' };
    commands[2] = { id: 'B', type: 'BOOK_SAILING', contractId: 'CT001', sailingId: `${route}-D002` };
    const state = planState(openDay(createGame(config), config).state, config, commands).state;
    const before = structuredClone(state);
    expect(cancellationPreviewKo(state, config, 'CT001')).toBe(`운임 ${refund}.00 USD 환급·취소비 50.00 USD, `);
    expect(state).toEqual(before);
  });
  it('성장과 M1 각주는 실제 직원 처리량과 범위를 표시한다', () => {
    const m1=loadScenario('SCENARIO_M1_ONE_TRADE');
    expect(crewNoteKo(m1)).toBe('처리량은 고정값(하루 2pt)만 씁니다. 능력·속성·레벨·시너지는 이 시나리오에서 쓰지 않습니다. 일급 80,000원.');
    for(const cfg of [config,m1]) {
      expect(crewNoteKo(cfg)).not.toContain('하루 Npt');
      expect(crewNoteKo(cfg)).toContain('하루 2pt');
    }
    const cfg=structuredClone(config);cfg.employees[1]!.workUnitsPerDay=3;
    expect(crewNoteKo(cfg)).toContain('하루 2~3pt');
  });
  it('고용 1회와 훈련 1회 뒤 모든 원화 행의 순서·금액·현금식을 맞춘다', () => {
    const state = runDays(createGame(config), config, 4, {
      1: [{ id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02' }],
      2: [{ id:'Q',type:'START_RECRUIT_QUEST',candidateId:'EMP04',employeeId:'EMP01' }],
      4: [{ id:'H',type:'HIRE_CANDIDATE',candidateId:'EMP04' }, {id:'T',type:'START_TRAINING',employeeId:'EMP02'}],
    }).state;
    const report = companyReport(state, config), p = report.payroll;
    expect(p).toMatchObject({ openingEquity:10_000_000, wageExpense:640_000, recruitmentExpense:550_000, trainingExpense:50_000, profit:-1_240_000,cash:8_760_000 });
    const html = krwReportRows(report, config);
    expect([...html.matchAll(/<th>(.*?)<\/th>/g)].map((m)=>m[1])).toEqual(['시작 운영 자금','급여','영입 계약금','훈련비','현지 활동비','운영 손익','미지급 급여','현금']);
    expect([...html.matchAll(/<td>(.*?)<\/td>/g)].map((m)=>m[1])).toEqual(['10,000,000원','−640,000원','−550,000원','−50,000원','0원','−1,240,000원','0원','8,760,000원']);
    expect(p.cash).toBe(p.openingEquity+p.profit+p.accountsPayable);
    expect(KRW_REPORT_NOTE_CULTURE_KO).toContain('계약금·훈련비·현지 활동비는 한 번 내는 원화 비용');
    expect(KRW_REPORT_NOTE_KO).toContain('계약금·훈련비는 한 번 내는 원화 비용');
    expect(crewNoteKo(config)).toBe('레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 2pt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다. 일급 80,000원.');
  });
});

describe('경영 보고 읽기 도우미', () => {
  const start = (cfg = config) => openDay(createGame(cfg), cfg).state;
  const accepted = () => openDay(runDays(start(), config, start().day, {
    [start().day]: [{ id: 'REPORT', type: 'ACCEPT_TRADE', ...tradePairs(config)[0]! }],
  }).state, config).state;
  const shortCash = () => {
    const cfg = structuredClone(config);
    cfg.startingCash[cfg.payrollCurrency] = cfg.employees.filter((e) => isAvailableFromToday(start(cfg), e.id)).reduce((a, e) => a + e.salaryPerDayMinor, 0) - 1;
    return { cfg, state: openDay(runDays(start(cfg), cfg, start(cfg).day + 1).state, cfg).state };
  };
  it('품목별 화물은 고객과 회사의 보유 합계와 단위를 보존한다', () => {
    const commands: Command[] = config.offers.filter((o) => o.kind === 'forwarding').map((o, i) => ({ id: `FWD-${i}`, type: 'ACCEPT_FORWARDING', offerId: o.id }));
    const customer = runDays(start(), config, start().day, { [start().day]: commands }).state;
    const planned = planState(start(), config, [{ id: 'TRADE', type: 'ACCEPT_TRADE', ...tradePairs(config)[0]! }]).state;
    const company = planState(planned, config, [{ id: 'CANCEL', type: 'CANCEL_CONTRACT', contractId: planned.contracts[0]!.id }]).state;
    for (const [s, owner] of [[customer, 'CUSTOMER'], [company, 'COMPANY']] as const) {
      const held = heldCargoByGood(s, config, owner), report = companyReport(s, config);
      const total = owner === 'CUSTOMER' ? report.customerCargoUnits : report.inventoryUnits;
      expect(held.reduce((a, i) => a + i.quantity, 0)).toBe(total);
      const expected = config.goods.flatMap((g) => {
        const q = s.cargoLots.filter((l) => l.owner === owner && l.goodId === g.id && l.status !== 'DELIVERED' && l.status !== 'RETURNED_TO_OWNER').reduce((a, l) => a + l.quantity, 0);
        return q ? [`${g.nameKo} ${q.toLocaleString('ko-KR')}${unitKo(g)}`] : [];
      }).join(' · ');
      expect(cargoListKo(config, held)).toBe(expected);
      if (owner === 'CUSTOMER') expect(cargoListKo(config, held)).not.toContain(`${total}개`);
    }
    expect(cargoListKo(config, heldCargoByGood(start(), config, 'COMPANY'))).toBe('없음');
  });
  it.each([[10000, '100%'], [6666, '66.66%'], [5050, '50.50%'], [1, '0.01%'], [0, '0%']] as const)('rateKo 표 %s → %s', (input, expected) => {
    expect(rateKo(input)).toBe(expected);
  });
  it('upcomingSummary는 종류·통화별로 합하고 네 줄 순서와 미정 건수를 보존한다', () => {
    const poor = shortCash(), normal = openDay(runDays(start(), config, start().day, { [start().day]: acceptAllFeasible(start(), config) }).state, config).state;
    for (const [s, cfg] of [[normal, config], [poor.state, poor.cfg]] as const) {
      const rows = upcomingPayments(s, cfg), summary = upcomingSummary(rows, cfg);
      expect(summary.currencies).toEqual([cfg.tradeCurrency, cfg.payrollCurrency]);
      expect(summary.lines.map((l) => [l.kind, l.labelKo])).toEqual([
        ['OVERDUE', '밀린 지급 (현금이 들어오면 먼저 갚음)'], ['WAGE', '급여 (하루 진행 때 자동)'],
        ['FREIGHT', '운임 (운송편을 예약할 때)'], ['DUTY', '관세 (도착할 때 자동)'],
      ]);
      for (const line of summary.lines) for (const [i, currency] of summary.currencies.entries()) {
        const matching = rows.filter((r) => r.kind === line.kind && r.currency === currency);
        expect(line.amounts[i]).toBe(matching.length ? matching.reduce((a, r) => a + r.amountMinor, 0) : null);
      }
      expect(summary.undated).toBe(rows.filter((r) => r.day === null).length);
    }
    const rows = upcomingPayments(normal, config);
    expect(upcomingSummary([...rows, { ...rows[0]!, currency: 'XXX' }], config).currencies)
      .toEqual([config.tradeCurrency, config.payrollCurrency, 'XXX']);
    expect(upcomingSummary(rows, { ...config, payrollCurrency: config.tradeCurrency }).currencies)
      .toEqual([config.tradeCurrency, config.payrollCurrency]);
  });
  it('bottlenecks는 원인 문장·분류와 미지급을 보존하고 info 수금 대기는 제외한다', () => {
    const s = accepted(), groups = bottlenecks(s, config);
    expect(groups.map((g) => g.kind)).toEqual(['돈', '시간', '사람', '선복']);
    const c = s.contracts[0]!, blockers = contractProgress(s, config, c).blockers;
    const expected = { TASK_UNASSIGNED: '사람', TASK_WILL_MISS_SAILING: '사람', NO_BOOKING: '선복', NO_SAILING_LEFT: '선복',
      NEXT_SAILING_LATE: '시간', BOOKED_SAILING_LATE: '시간', WAITING_PORT_RESTRICTION: '시간', DUTY_UNPAID: '돈', AWAITING_PAYMENT: null };
    expect(BOTTLENECK_OF).toEqual(expected);
    for (const b of blockers) expect(groups.find((g) => g.kind === expected[b.code])!.items).toContainEqual({ contractId: c.id, textKo: b.messageKo });
    const cfg = structuredClone(config); cfg.terms.paymentDueDay = cfg.campaignDays;
    const commands = acceptAllFeasible(start(cfg), cfg), end = runToCampaignEnd(start(cfg), cfg, { 1: commands }).state;
    const delivered = end.contracts[0]!.deliveredDay!;
    const waiting = openDay(runDays(start(cfg), cfg, delivered, { 1: commands }).state, cfg).state;
    expect(contractProgress(waiting, cfg, waiting.contracts[0]!).blockers.map((b) => b.code)).toEqual(['AWAITING_PAYMENT']);
    expect(bottlenecks(waiting, cfg).every((g) => g.items.length === 0)).toBe(true);
    const poor = shortCash(), unpaid = fundsPosition(poor.state, poor.cfg, poor.cfg.payrollCurrency).unpaidObligations;
    expect(bottlenecks(poor.state, poor.cfg)[0]!.items[0]).toEqual({ contractId: null,
      textKo: `미지급 ${formatMoney(poor.cfg.payrollCurrency, unpaid)}이 있습니다. 현금이 들어오면 먼저 갚습니다.` });
  });
  it('workloadLinesKo는 도시 업무·가용 처리량과 미래 근무자를 문장으로 보인다', () => {
    const s = accepted(), summary = workloadSummary(s, config);
    const expected = summary.byCity.map((r) => `${cityName(config, r.cityId)}: 남은 업무 ${r.unassignedWorkUnits + r.runningWorkUnits}pt(배정 전 ${r.unassignedWorkUnits}pt · 진행 중 ${r.runningWorkUnits}pt), 하루 처리 ${r.staffWorkUnitsPerDay - r.dayTaskWorkUnitsPerDay}pt → 약 ${r.daysToClear}일. 지금 바로 맡길 수 있는 처리량 하루 ${r.idleWorkUnitsPerDay}pt.`);
    expect(workloadLinesKo(summary, config)).toEqual(expected);
    const future = s.employees.find((e) => e.id === config.recruitment!.candidateEmployeeIds[0])!;
    future.employmentStatus = 'employed'; future.availableFromDay = s.day + 2;
    const def = config.employees.find((e) => e.id === future.id)!;
    expect(workloadLinesKo(workloadSummary(s, config), config)).toContain(`${def.nameKo}: ${future.availableFromDay}일부터 근무(하루 ${def.workUnitsPerDay}pt).`);
    const trained = planState(start(), config, [{ id: 'TRAIN', type: 'START_TRAINING', employeeId: config.employees[0]!.id }]).state;
    const row = workloadSummary(trained, config).byCity[0]!;
    expect(workloadLinesKo(workloadSummary(trained, config), config)[0]).toBe(`${cityName(config, row.cityId)}: 남은 업무 ${row.unassignedWorkUnits + row.runningWorkUnits}pt(배정 전 ${row.unassignedWorkUnits}pt · 진행 중 ${row.runningWorkUnits}pt), 하루 처리 ${row.staffWorkUnitsPerDay - row.dayTaskWorkUnitsPerDay}pt(훈련·현지 활동 중 ${row.dayTaskWorkUnitsPerDay}pt 빼고) → 남은 업무 없음. 지금 바로 맡길 수 있는 처리량 하루 ${row.idleWorkUnitsPerDay}pt.`);
  });
  it('settlementRows는 통화별 순자산 항등식과 급여 표의 행 생략을 지킨다', () => {
    const s = runToCampaignEnd(start(), config, { 1: acceptAllFeasible(start(), config) }).state;
    for (const standing of campaignSummary(s, config).byCurrency) {
      const rows = settlementRows(standing, config), value = (label: string) => rows.find((r) => r[0] === label)![1];
      expect(value('순자산 (자산 − 미지급금)')).toBe(value('시작 자본') + value('손익'));
      expect(value('순자산 (자산 − 미지급금)')).toBe(value('자산 합계') - value('미지급금'));
      if (standing.currency === config.payrollCurrency) for (const label of ['재고', '선급운임', '주선 진행원가', '매출채권', '계약 기여이익 합계']) expect(rows.some((r) => r[0] === label)).toBe(false);
    }
  });
});
