import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay, planState } from '../engine/engine';
import { serializeSave } from '../engine/save';
import { runDays, standardDayOneCommands } from '../engine/testkit';
import { esc } from './html';
import { startUi } from './main-testkit';

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const readySave = (cfg=config) => serializeSave(openDay(runDays(createGame(cfg),cfg,3,{
  1:[{id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02'}],
  2:[{id:'Q',type:'START_RECRUIT_QUEST',candidateId:'EMP04',employeeId:'EMP01'}],
}).state,cfg).state);
const selectOptions = (html:string,key:string) => html.split(`<select data-action="plan-emp" data-key="${key}">`)[1]!.split('</select>')[0]!;
const growthNotice = (html:string) => html.match(/<div class="growth-notices"([^>]*)>([\s\S]*?)<\/div>/);
const crewNote = (html:string) => html.match(/<p class="muted small">(레벨·능력은[\s\S]*?)<\/p>/)?.[1] ?? '';
const employeeSection = (html:string) => html.split('<section class="employee-detail"')[1]!.split('</section>')[0]!;

describe('A 실제 화면 연결',()=>{
  it('빈 동료 목록 안내는 격자의 모든 열을 차지한다',async()=>{
    const ui=await startUi();ui.click({action:'crew-filter',filter:'busy'});
    expect(ui.app.innerHTML).toContain('<div class="crew-cards"><p class="muted small">이 조건의 동료가 없습니다.</p></div>');
    const { readFileSync }=await vi.importActual<{readFileSync:(path:URL,encoding:string)=>string}>('node:fs');
    const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
    expect(css).toMatch(/\.crew-cards > p\s*\{\s*grid-column:\s*1\s*\/\s*-1;\s*\}/);
  });
  it.each([['ROUTE01','OFFER_BUY_01','OFFER_SELL_01','150.00'],['ROUTE02','OFFER_BUY_02','OFFER_SELL_02','130.00']])('%s 예약 계약의 실제 취소 안내는 엔진 환급액이다',async(route,buy,sell,refund)=>{
    const ui=await startUi();
    ui.click({action:'accept',buy,sell});ui.click({action:'assign',emp:'EMP01'});
    expect(ui.app.innerHTML).toContain('<dt>담당</dt><dd>귀솔</dd>');
    expect(ui.app.innerHTML).not.toContain('EMP01)');
    ui.click({action:'book',contract:'CT001',sailing:`${route}-D002`});
    const line=ui.app.innerHTML.match(/<p[^>]*>취소하면: ([\s\S]*?)<\/p>/)![1];
    expect(line).toContain(`운임 ${refund} USD 환급·취소비 50.00 USD`);
  });
  it('운영 장부의 일곱 행은 실제 화면에서 지정 순서로 나온다',async()=>{
    const ui=await startUi();
    const table=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...table.matchAll(/<th>(.*?)<\/th>/g)].map((m)=>m[1])).toEqual(['시작 운영 자금','급여','영입 계약금','훈련비','운영 손익','미지급 급여','현금']);
    expect(table).toContain('<td colspan="2" class="muted small">급여는 원화로 매일 지급하며 계약금·훈련비는 한 번 내는 원화 비용입니다. USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.</td>');
  });
  it.each(['restart','scenario'])('%s 뒤 지난 게임의 flash 알림을 비운다',async(mode)=>{
    const ui=await startUi();ui.click({action:'scout',venue:'VEN_PORT'});
    expect(ui.app.innerHTML).toContain('<p class="flash info" role="status">오늘 할 일에 넣었습니다.');
    if(mode==='restart')ui.click({action:'restart'});
    else await ui.change({action:'scenario'},'SCENARIO_M1_ONE_TRADE');
    expect(ui.app.innerHTML).not.toContain('class="flash');
    expect(ui.app.innerHTML).not.toContain('오늘 할 일에 넣었습니다.');
  });
  it('조사·의뢰가 진행 중일 때 일정·계획·배정의 표시와 접근 이름에는 내부 ID가 없다',async()=>{
    const discovered=openDay(runDays(createGame(config),config,1,{1:[
      {id:'A',type:'ACCEPT_FORWARDING',offerId:'OFFER_FWD_01'},
      {id:'B',type:'ASSIGN_TASK',taskId:'TASK001',employeeId:'EMP01'},
      {id:'C',type:'BOOK_SAILING',contractId:'CT001',sailingId:'ROUTE01-D002'},
      {id:'D',type:'CANCEL_CONTRACT',contractId:'CT001'},
      {id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02'},
    ]}).state,config).state;
    const ui=await startUi();await ui.importText(serializeSave(discovered));
    ui.click({action:'recruit-quest',candidate:'EMP04',emp:'EMP01'});
    ui.click({action:'scout',emp:'EMP02'});
    ui.click({action:'accept',buy:'OFFER_BUY_01',sell:'OFFER_SELL_01'});
    ui.click({action:'book',contract:'CT002',sailing:'ROUTE01-D009'});
    const html=ui.app.innerHTML;
    expect(html).toContain('영입 의뢰 중 — 현돌');expect(html).toContain('현장 조사 중');
    const parts=[html.match(/<ul class="crew-time">([\s\S]*?)<\/ul>/)![1]!,selectOptions(html,'OFFER_FWD_02'),
      ...[...html.matchAll(/<button[^>]*data-action="assign"[^>]*>[\s\S]*?<\/button>/g)].map((m)=>m[0])];
    expect(parts).toHaveLength(4);
    for(const part of parts) {
      const visible=part.replace(/<[^>]*>/g,'');
      expect(visible).not.toMatch(/EMP\d+|VEN_|RECRUIT-|SCOUT-/);
      for(const attribute of part.matchAll(/(?:aria-label|title)="([^"]*)"/g)) expect(attribute[1]).not.toMatch(/EMP\d+|VEN_|RECRUIT-|SCOUT-/);
    }
  });

  it.each(['load','import','restart','scenario'])('%s 성공은 대기·선택·필터·수동 계획을 초기화한다',async(mode)=>{
    const cfg=structuredClone(config);for(const offer of cfg.offers)offer.validUntilDay=90;
    const ready=()=>readySave(cfg);
    const ui=await startUi(cfg);await ui.importText(ready());
    ui.click({action:'interview',candidate:'EMP04'});
    await ui.change({action:'recruit-emp',key:'VEN_PORT'},'EMP02');
    ui.click({action:'select-card',emp:'EMP02'});ui.click({action:'detail',emp:'EMP02'});
    expect(ui.app.innerHTML).toContain('aria-expanded="true" aria-controls="growth-EMP02"');
    expect(ui.app.innerHTML).toContain('aria-expanded="true" aria-controls="interview-EMP04"');
    ui.click({action:'accept-fwd',offer:'OFFER_FWD_01'});
    ui.click({action:'assign',emp:'EMP01'});
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE01-D009'});
    ui.click({action:'cancel',contract:'CT001'});
    const key='OFFER_BUY_01+OFFER_SELL_01';
    await ui.change({action:'plan-emp',key},'EMP02');
    ui.click({action:'crew-filter',filter:'busy'});
    if(mode==='import') await ui.importText(ready());
    else if(mode==='scenario') await ui.change({action:'scenario'},config.id);
    else if(mode==='restart') ui.click({action:'restart'});
    else {vi.stubGlobal('localStorage',{getItem:ready});ui.click({action:'load'});}
    expect(ui.app.innerHTML).not.toContain('is-selected');
    expect(ui.app.innerHTML).toContain('data-filter="all" aria-pressed="true"');
    expect(ui.app.innerHTML).toContain('대기 중인 명령이 없습니다');
    expect(ui.app.innerHTML).not.toContain('aria-expanded="true" aria-controls="interview-EMP04"');
    expect(ui.app.innerHTML.split('<select data-action="recruit-emp" data-key="VEN_PORT"')[1]!.split('</select>')[0]).toContain('value="EMP01" selected');
    ui.click({action:'select-card',emp:'EMP02'});
    expect(ui.app.innerHTML).toContain('aria-expanded="false" aria-controls="growth-EMP02"');
    if(mode==='restart' || mode==='scenario') {
      ui.click({action:'scout',venue:'VEN_PORT'});ui.click({action:'end-day'});
      ui.click({action:'recruit-quest',candidate:'EMP04'});ui.click({action:'end-day'});ui.click({action:'end-day'});
    }
    expect(ui.app.innerHTML).not.toContain('aria-expanded="true" aria-controls="interview-EMP04"');
    expect(ui.app.innerHTML).toMatch(/id="interview-EMP04"[^>]* hidden/);
    // 기본값이 EMP01이 되는 상황을 다시 만들어 지난 EMP02 수동 선택이 남는지도 검증한다.
    ui.click({action:'accept-fwd',offer:'OFFER_FWD_01'});
    ui.click({action:'assign',emp:'EMP02'});
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE01-D009'});
    expect(selectOptions(ui.app.innerHTML,key)).toContain('value="EMP01" selected');
  });
  it('불러오기 실패는 현재 게임·대기 명령·선택을 유지한다',async()=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});
    ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});
    ui.click({action:'end-day'});
    ui.click({action:'accept-fwd',offer:'OFFER_FWD_01'});
    const contract=ui.app.innerHTML.match(/<div class="contract [\s\S]*?<\/dl>/)![0];
    await ui.importText('{');
    expect(ui.app.innerHTML).toContain('<b>2일</b>');
    expect(ui.app.innerHTML).toContain(contract);
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
    const ui=await startUi(cfg);
    ui.click({action:'accept-fwd',offer:'OFFER_FWD_01'});
    expect(ui.app.innerHTML).not.toContain(unsafe);expect(ui.app.innerHTML).toContain(`${esc(unsafe)}에게`);
    expect(ui.app.innerHTML).toContain('오늘 실행 예정');
    ui.click({action:'assign',emp:'EMP01'});
    expect(ui.app.innerHTML).not.toContain(unsafe);expect(ui.app.innerHTML).toContain(`<dd>${esc(unsafe)}</dd>`);
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE01-D002'});
    expect(selectOptions(ui.app.innerHTML,'OFFER_BUY_01+OFFER_SELL_01')).toContain(esc(unsafe));
    expect(ui.app.innerHTML).not.toContain(unsafe);
    await ui.importText(serializeSave(s));
    expect(ui.app.innerHTML).toContain('상태를 불러왔습니다');
    expect(ui.app.innerHTML).not.toContain(unsafe);expect(ui.app.innerHTML).toContain(esc(unsafe));
    expect(ui.app.innerHTML).toContain(`<b>${esc(unsafe)}의 보고</b>`);
    expect(ui.app.innerHTML).toContain(`<h3>⚠ ${esc(unsafe)}`);
    expect(ui.app.innerHTML).toContain(`<p>${esc(unsafe)}</p>`);
    expect(ui.app.innerHTML).toContain(`data-contract="${esc(unsafe)}"`);
    const escaped = () => {
      expect(ui.app.innerHTML).not.toContain(unsafe);
      expect(ui.app.innerHTML).toContain(esc(unsafe));
    };
    ui.click({action:'select-card',emp:'EMP02'});escaped();
    ui.click({action:'detail',emp:'EMP02'});escaped();
    expect(ui.app.innerHTML).toContain(`aria-label="${esc(unsafe)} 일반 훈련"`);
    ui.click({action:'train',emp:'EMP02'});escaped();
    expect(ui.app.innerHTML).toContain(`${esc(unsafe)} 일반 훈련<button`);
    expect(ui.app.innerHTML).toContain(`${esc(unsafe)}에게`);
    ui.click({action:'assign',task:'TASK001',emp:'EMP01'});escaped();
    ui.click({action:'book',contract:unsafe,sailing:'ROUTE01-D002'});escaped();
    expect(selectOptions(ui.app.innerHTML,'OFFER_FWD_01')).toContain(esc(unsafe));
    ui.click({action:'cancel',contract:unsafe});escaped();
    ui.click({action:'end-day'});escaped();
    expect(ui.app.innerHTML).toContain(`<p>${esc(unsafe)} +60 경험치</p>`);
    const storage:Record<string,string>={};
    vi.stubGlobal('localStorage',{setItem:(key:string,value:string)=>{storage[key]=value;},getItem:(key:string)=>storage[key]});
    ui.click({action:'save'});ui.click({action:'load'});escaped();
    expect(ui.app.innerHTML).toContain('종결된 계약 1건');
  });
});

describe('B 실제 성장 화면 연결',()=>{
  it('1일과 3pt 동료 고용 후 5일의 상세·직원 각주는 실제 처리량을 표시한다',async()=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(employeeSection(ui.app.innerHTML)).toContain('<p>레벨·능력이 올라도 하루 처리량은 2pt 그대로입니다. 훈련하는 날은 다른 업무를 맡을 수 없습니다.</p>');
    expect(crewNote(ui.app.innerHTML)).toBe('레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 2pt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다.');
    const day5=openDay(runDays(createGame(config),config,4,{
      1:[{id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02'}],
      2:[{id:'Q',type:'START_RECRUIT_QUEST',candidateId:'EMP04',employeeId:'EMP01'}],
      4:[{id:'H',type:'HIRE_CANDIDATE',candidateId:'EMP04'}],
    }).state,config).state;
    await ui.importText(serializeSave(day5));
    expect(ui.app.innerHTML).toContain('<b>5일</b>');
    ui.click({action:'select-card',emp:'EMP04'});ui.click({action:'detail',emp:'EMP04'});
    expect(employeeSection(ui.app.innerHTML)).toContain('<p>레벨·능력이 올라도 하루 처리량은 3pt 그대로입니다. 훈련하는 날은 다른 업무를 맡을 수 없습니다.</p>');
    expect(crewNote(ui.app.innerHTML)).toBe('레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 2~3pt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다.');
    expect(crewNote(ui.app.innerHTML)).not.toContain('일급');
  });

  it('조사 중인 직원은 훈련 반영 상태 대신 가정 금액과 엔진 거절 이유를 표시한다',async()=>{
    const ui=await startUi();ui.click({action:'scout',venue:'VEN_PORT',emp:'EMP01'});
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    const detail=employeeSection(ui.app.innerHTML);
    expect(detail).not.toContain('반영됨');
    expect(detail).toContain('훈련에 쓸 수 있는 원화: 지금 10,000,000원 → 훈련 뒤 9,950,000원');
    expect(detail).toContain('지금 62일까지 → 훈련하면 62일까지');
    expect(detail).toContain('<p class="reason">귀솔은(는) 다른 업무(항만 물류단지 현장 조사)를 진행 중입니다. 한 사람은 한 번에 업무 하나만 맡습니다.</p>');
    expect(detail.match(/<button[^>]*data-action="train"[^>]*>/)![0]).toContain('disabled');
  });

  it.each([false,true])('꺼진 훈련 버튼 클릭은 아무 일도 하지 않는다 (안쪽 자식: %s)',async(fromChild)=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'},fromChild);
    expect(ui.rendered({action:'train',emp:'EMP01'}).disabled).toBe(true);
    const before=ui.app.innerHTML;
    ui.click({action:'train',emp:'EMP01'},fromChild);
    expect(ui.app.innerHTML).toBe(before);
  });

  it.each(['load','import','restart','scenario'])('%s 성공은 이전 성장 알림을 비운다',async(mode)=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'});ui.click({action:'end-day'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toContain('귀솔 +60 경험치');
    if(mode==='import')await ui.importText(readySave());
    else if(mode==='restart')ui.click({action:'restart'});
    else if(mode==='scenario')await ui.change({action:'scenario'},'SCENARIO_M1_ONE_TRADE');
    else {
      const storage:Record<string,string>={};
      vi.stubGlobal('localStorage',{setItem:(key:string,value:string)=>{storage[key]=value;},getItem:(key:string)=>storage[key]});
      ui.click({action:'save'});ui.click({action:'load'});
    }
    expect(growthNotice(ui.app.innerHTML)).toBeNull();
  });


  it('훈련 버튼 속성·상세 접근 참조는 허용 상태와 거절 상태 모두 유지된다',async()=>{
    const cfg=structuredClone(config);cfg.startingCash.KRW=500_000;
    const ui=await startUi(cfg);ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(ui.app.innerHTML).toContain('지금 3일까지 → 훈련하면 2일까지');
    expect(ui.app.innerHTML).toContain('성장 변화는 완료할 때 반영됩니다');
    for(const allowed of [true,false]) {
      const html=ui.app.innerHTML.match(/<div class="growth-detail">[\s\S]*?<\/section>\s*<\/div>/)![0];
      const button=html.match(/<button[^>]*data-action="train"[^>]*>/)![0];
      expect(button).toContain('data-action="train"');expect(button).toContain('data-emp="EMP01"');
      expect(button).toContain('aria-label="귀솔 일반 훈련"');expect(button.includes('disabled')).toBe(!allowed);
      for(const b of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
        const visible=b[2]!.replace(/<[^>]*>/g,'').trim();const label=b[1]!.match(/aria-label="([^"]*)"/)?.[1];
        if(label)expect(label).toContain(visible);
      }
      const ids=new Set([...html.matchAll(/\bid="([^"]*)"/g)].map((m)=>m[1]));
      for(const ref of html.matchAll(/aria-(?:labelledby|controls)="([^"]*)"/g)) for(const id of ref[1]!.split(' '))expect(ids.has(id),id).toBe(true);
      if(allowed)ui.click({action:'train',emp:'EMP01'});
    }
    expect(employeeSection(ui.app.innerHTML)).toContain('<p>원화 급여 지급 가능일: 지금 2일까지</p>');
    expect(employeeSection(ui.app.innerHTML)).not.toContain('훈련하면');
  });
  it('영입 버튼의 초점 대안도 실제 선택자 결합과 대상 영역을 따른다',async()=>{
    const ui=await startUi();ui.doc.activeElement=ui.rendered({action:'scout',venue:'VEN_PORT'});
    ui.click({action:'scout',venue:'VEN_PORT'});
    expect(ui.focusIds).toEqual(['site-h-VEN_PORT']);
    expect(ui.closestSelectors).toContain('.employee-detail, .recruit-site, .recruit-candidate');
  });
  it('훈련 대기→완료→레벨 알림→저장 재개를 연결하고 버튼이 꺼지면 상세 제목으로 초점을 옮긴다',async()=>{
    const cfg=structuredClone(config);cfg.employees[0]!.growth!.startXp=90;
    const ui=await startUi(cfg);
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(ui.app.innerHTML).toContain('aria-expanded="true" aria-controls="growth-EMP01"');
    ui.focusTrain('EMP01');ui.click({action:'train',emp:'EMP01'});
    expect(ui.focus).toHaveBeenCalledOnce();expect(ui.focusIds).toEqual(['growth-h-EMP01']);
    expect(ui.app.innerHTML).toContain('◆ 교육 중 0/1일');
    expect(ui.app.innerHTML.match(/<button[^>]*data-action="train"[^>]*>/)![0]).toContain('disabled');
    expect(ui.app.innerHTML.match(/<button[^>]*data-action="train"[^>]*>/)![0]).toContain('aria-label="귀솔 일반 훈련"');
    expect(ui.closestSelectors).toContain('.employee-detail, .recruit-site, .recruit-candidate');
    const detail=ui.app.innerHTML.split('<section class="employee-detail"')[1]!.split('</section>')[0]!;
    expect(detail).not.toContain('훈련 뒤');expect(detail).not.toContain('훈련하면');
    expect(detail).toContain('◆ 교육 중 0/1일 — 훈련비 50,000원 반영됨. 완료하면 +60 경험치');
    ui.doc.activeElement=null;ui.click({action:'end-day'});
    const status=()=>ui.app.innerHTML.match(/<div class="growth-notices" role="status">([\s\S]*?)<\/div>/)?.[1];
    expect(status()).toContain('귀솔 레벨 2 달성 (교섭 +2, 협업 +1)');
    expect(status()!.match(/\+60 경험치/g)).toHaveLength(1);
    expect(status()!.match(/레벨 2 달성/g)).toHaveLength(1);
    const notice=growthNotice(ui.app.innerHTML)![2];
    ui.click({action:'select-card',emp:'EMP02'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('role="status"');
    ui.click({action:'detail',emp:'EMP02'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('role="status"');
    ui.click({action:'train',emp:'EMP02'});ui.click({action:'end-day'});
    expect(growthNotice(ui.app.innerHTML)![2]).toBe('<p>물보리 +60 경험치</p>');
    expect(growthNotice(ui.app.innerHTML)![1]).toContain('role="status"');
    const storage:Record<string,string>={};
    vi.stubGlobal('localStorage',{setItem:(key:string,value:string)=>{storage[key]=value;},getItem:(key:string)=>storage[key]});
    ui.click({action:'save'});expect(status()).toBeUndefined();
    expect(growthNotice(ui.app.innerHTML)![2]).toBe('<p>물보리 +60 경험치</p>');
    ui.click({action:'load'});expect(status()).toBeUndefined();
    expect(growthNotice(ui.app.innerHTML)).toBeNull();
    expect(ui.app.innerHTML).not.toContain('aria-expanded="true" aria-controls="growth-EMP01"');
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(ui.app.innerHTML).toContain('경험치 150 / 300');
    ui.click({action:'end-day'});expect(status()).toBeUndefined();
    expect(growthNotice(ui.app.innerHTML)).toBeNull();
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
    expect(ui.app.innerHTML).toContain('레벨 1 · 강화 +0');
    expect(ui.app.innerHTML).toContain('aria-label="귀솔 직원 카드, 영업, 레벨 1, 대기 — 배정 가능"');
    expect(ui.app.innerHTML).not.toContain('주능력');
    expect(ui.app.innerHTML).toContain('업무·교육 중');
    const table=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...table.matchAll(/<th>(.*?)<\/th>/g)].map((m)=>m[1])).toEqual(['시작 운영 자금','급여','운영 손익','미지급 급여','현금']);
    expect(table).not.toContain('계약금');expect(table).not.toContain('훈련비');
    expect(ui.app.innerHTML).not.toContain('class="employee-detail"');
    ui.click({action:'end-day'});
    const updated=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...updated.matchAll(/<td>(.*?)<\/td>/g)].map((m)=>m[1])).toEqual(['10,000,000원','−80,000원','−80,000원','0원','9,920,000원']);

  });
});
