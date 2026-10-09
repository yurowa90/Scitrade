import { describe, expect, it } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay, planState } from '../engine/engine';
import { companyReport } from '../engine/reports';
import { runDays, standardDayOneCommands } from '../engine/testkit';
import { krwReportRows, KRW_REPORT_NOTE_CULTURE_KO } from './reports';
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
    expect(crewNoteKo(m1)).toBe('처리량은 고정값(LEGACY_FIXED, 하루 2pt)만 씁니다. 능력·속성·레벨·시너지는 이후 M2a 단계(성장)와 M2b에서 켭니다. 일급 80,000원.');
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
    expect(crewNoteKo(config)).toBe('레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 2pt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다. 일급 80,000원.');
  });
});
