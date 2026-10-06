import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay, planState } from '../engine/engine';
import { serializeSave } from '../engine/save';
import { standardDayOneCommands } from '../engine/testkit';
import { esc } from './html';
import { startUi } from './main-testkit';

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const saved = () => serializeSave(openDay(createGame(config),config).state);
const selectOptions = (html:string,key:string) => html.split(`<select data-action="plan-emp" data-key="${key}">`)[1]!.split('</select>')[0]!;

describe('A 실제 화면 연결',()=>{
  it.each(['load','import','restart','scenario'])('%s 성공은 대기·선택·필터·수동 계획을 초기화한다',async(mode)=>{
    const ui=await startUi();
    ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});
    ui.click({action:'assign',task:'TASK001',emp:'EMP01'});
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE02-D002'});
    const key='OFFER_BUY_01+OFFER_SELL_01';
    await ui.change({action:'plan-emp',key},'EMP02');
    ui.click({action:'select-card',emp:'EMP02'}); ui.click({action:'crew-filter',filter:'busy'});
    if(mode==='import') await ui.importText(saved());
    else if(mode==='scenario') await ui.change({action:'scenario'},config.id);
    else if(mode==='restart') ui.click({action:'restart'});
    else {vi.stubGlobal('localStorage',{getItem:saved});ui.click({action:'load'});}
    expect(ui.app.innerHTML).not.toContain('is-selected');
    expect(ui.app.innerHTML).toContain('data-filter="all" aria-pressed="true"');
    expect(ui.app.innerHTML).toContain('대기 중인 명령이 없습니다');
    // 기본값이 EMP01이 되는 상황을 다시 만들어 지난 EMP02 수동 선택이 남는지도 검증한다.
    ui.click({action:'accept-fwd',offer:'OFFER_FWD_01'});
    ui.click({action:'assign',task:'TASK001',emp:'EMP02'});
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE01-D002'});
    expect(selectOptions(ui.app.innerHTML,key)).toContain('value="EMP01" selected');
  });
  it('불러오기 실패는 현재 게임·대기 명령·선택을 유지한다',async()=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});
    ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});
    await ui.importText('{');
    expect(ui.app.innerHTML).toContain('is-selected'); expect(ui.app.innerHTML).toContain('오늘 실행 예정');
    expect(ui.app.innerHTML).toContain('JSON 형식 오류');
  });
  it('하루 진행 예외는 실제 화면에서 게임·대기 명령을 보존하고 한국어 알림을 보여 준다',async()=>{
    const ui=await startUi();
    const engine=await import('../engine/engine');
    const spy=vi.spyOn(engine,'commitDay').mockImplementation(()=>{throw new Error('결산 검증 실패');});
    ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});
    ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toContain('하루 진행에 실패했습니다: 결산 검증 실패');
    expect(ui.app.innerHTML).toContain('<b>1일</b>');
    expect(ui.app.innerHTML).toContain('오늘 실행 예정');
    spy.mockRestore();ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toContain('<b>2일</b>');
  });
  it.each([`공통<&"'문자>`, '<img src=x onerror=alert(1)>'])('저장 렌더링은 이름·계약 번호·공지 %s를 이스케이프한다',async(unsafe)=>{
    const cfg=structuredClone(config);
    for(const emp of cfg.employees) emp.nameKo=unsafe;
    for(const city of cfg.cities) city.nameKo=unsafe;
    for(const good of cfg.goods) good.nameKo=unsafe;
    const s=planState(openDay(createGame(cfg),cfg).state,cfg,standardDayOneCommands(cfg).slice(0,1)).state;
    const old=s.contracts[0]!.id; s.contracts[0]!.id=unsafe;
    for(const t of s.tasks) if(t.contractId===old)t.contractId=unsafe;
    for(const l of s.cargoLots)if(l.contractId===old)l.contractId=unsafe;
    for(const e of s.ledger.entries)if(e.contractId===old)e.contractId=unsafe;
    s.notices.push({id:'SAFE-NOTICE',day:1,titleKo:unsafe,bodyKo:unsafe,evidenceKo:unsafe,kind:'PORT_RESTRICTION',eventInstanceId:'TEST',affectedShipmentIds:[]});
    const ui=await startUi(cfg);await ui.importText(serializeSave(s));
    expect(ui.app.innerHTML).toContain('상태를 불러왔습니다');
    expect(ui.app.innerHTML).not.toContain(unsafe);expect(ui.app.innerHTML).toContain(esc(unsafe));
    expect(ui.app.innerHTML).toContain(`<b>${esc(unsafe)}의 보고</b>`);
    expect(ui.app.innerHTML).toContain(`<h3>⚠ ${esc(unsafe)}`);
    expect(ui.app.innerHTML).toContain(`<p>${esc(unsafe)}</p>`);
    expect(ui.app.innerHTML).toContain(`data-contract="${esc(unsafe)}"`);
  });
});

describe('B 실제 성장 화면 연결',()=>{
  it('훈련 대기→완료→레벨 알림→저장 재개를 연결하고 버튼이 꺼지면 상세 제목으로 초점을 옮긴다',async()=>{
    const cfg=structuredClone(config);cfg.employees[0]!.growth!.startXp=90;
    const ui=await startUi(cfg);
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(ui.app.innerHTML).toContain('aria-expanded="true" aria-controls="growth-EMP01"');
    ui.focusTrain('EMP01');ui.click({action:'train',emp:'EMP01'});
    expect(ui.focus).toHaveBeenCalledOnce();expect(ui.focusIds).toEqual(['growth-h-EMP01']);
    expect(ui.app.innerHTML).toContain('◆ 교육 중 0/1일');
    expect(ui.app.innerHTML.match(/<button[^>]*data-action="train"[^>]*>/)![0]).toContain('disabled');
    expect(ui.app.innerHTML).toContain('귀솔 일반 훈련');
    ui.doc.activeElement=null;ui.click({action:'end-day'});
    const status=()=>ui.app.innerHTML.match(/<div class="growth-notices" role="status">([\s\S]*?)<\/div>/)?.[1];
    expect(status()).toContain('귀솔 레벨 2 달성 (교섭 +2, 협업 +1)');
    expect(status()!.match(/\+60 경험치/g)).toHaveLength(1);
    expect(status()!.match(/레벨 2 달성/g)).toHaveLength(1);
    const storage:Record<string,string>={};
    vi.stubGlobal('localStorage',{setItem:(key:string,value:string)=>{storage[key]=value;},getItem:(key:string)=>storage[key]});
    ui.click({action:'save'});expect(status()).toBeUndefined();
    ui.click({action:'load'});expect(status()).toBeUndefined();
    expect(ui.app.innerHTML).not.toContain('aria-expanded="true" aria-controls="growth-EMP01"');
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(ui.app.innerHTML).toContain('경험치 150 / 300');
    ui.click({action:'end-day'});expect(status()).toBeUndefined();
  });
  it('교육 상태는 자원·계약 배정·계획 선택에도 표시하고 제거하면 훈련 선택도 돌아온다',async()=>{
    const s=openDay(createGame(config),config).state;
    // 단계별 배정·예약 기록만 준비하고 해당 계약은 취소해 현재 직원 시간을 비운다.
    const p=planState(s,config,[{id:'A',type:'ACCEPT_FORWARDING',offerId:'OFFER_FWD_01'},{id:'ASSIGN',type:'ASSIGN_TASK',taskId:'TASK001',employeeId:'EMP02'},{id:'BOOK',type:'BOOK_SAILING',contractId:'CT001',sailingId:'ROUTE01-D002'},{id:'CANCEL',type:'CANCEL_CONTRACT',contractId:'CT001'}]).state;
    const ui=await startUi();await ui.importText(serializeSave(p));
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});ui.click({action:'train',emp:'EMP01'});
    const html=ui.app.innerHTML;
    expect(html.match(/<ul class="crew-time">([\s\S]*?)<\/ul>/)![1]).toContain('◆ 교육 중 0/1일');
    expect(selectOptions(html,'OFFER_BUY_02+OFFER_SELL_02')).toContain('◆ 교육 중 0/1일');
    ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});
    expect(ui.app.innerHTML.match(/<button[^>]*data-action="assign"[^>]*data-emp="EMP01"[\s\S]*?<\/button>/)![0]).toContain('◆ 교육 중 0/1일');
    ui.click({action:'unqueue',index:'0'});
    expect(ui.app.innerHTML.match(/<button[^>]*data-action="train"[^>]*>/)![0]).not.toContain('disabled');
  });
  it('M1 전체 화면에는 훈련·경험치가 없다',async()=>{
    const ui=await startUi();await ui.change({action:'scenario'},'SCENARIO_M1_ONE_TRADE');ui.click({action:'select-card',emp:'EMP01'});
    expect(ui.app.innerHTML).not.toContain('data-action="train"');expect(ui.app.innerHTML).not.toContain('경험치');
  });
});
