import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay, planState } from '../engine/engine';
import { serializeSave } from '../engine/save';
import { runDays, standardDayOneCommands } from '../engine/testkit';
import { esc } from './html';
import { startUi } from './main-testkit';

afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const readySave = (cfg=config) => serializeSave(openDay(runDays(createGame(cfg),cfg,3,{
  1:[{id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02'}],
  2:[{id:'Q',type:'START_RECRUIT_QUEST',candidateId:'EMP04',employeeId:'EMP01'}],
}).state,cfg).state);
const selectOptions = (html:string,key:string) => html.split(`<select data-action="plan-emp" data-key="${key}">`)[1]!.split('</select>')[0]!;
const growthNotice = (html:string) => html.match(/<div class="growth-notices"([^>]*)>([\s\S]*?)<\/div>/);
const crewNote = (html:string) => html.match(/<p class="muted small">((?:레벨·능력은|처리량은 고정값)[\s\S]*?)<\/p>/)?.[1] ?? '';
const employeeSection = (html:string) => html.split('<section class="employee-detail"')[1]!.split('</section>')[0]!;

describe('TASK-0013 실제 화면 표시', () => {
  it('수금일 전날·당일과 도착 전후를 표시한다', async () => {
    const ui = await startUi();
    ui.click({ action: 'accept', buy: 'OFFER_BUY_02', sell: 'OFFER_SELL_02' });
    ui.click({ action: 'assign', emp: 'EMP01' });
    ui.click({ action: 'book', contract: 'CT001', sailing: 'ROUTE02-D002' });
    for (let day = 1; day < 6; day++) ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toContain('<dt>운송</dt><dd>SH001 · 2일 출항 · 도착 6일 예정</dd>');
    ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toContain('<dt>운송</dt><dd>SH001 · 2일 출항 · 도착 6일</dd>');
    for (let day = 7; day < 11; day++) ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toContain('<b>11일</b>');
    expect(ui.app.innerHTML).toContain('12일 수금 대기');
    expect(ui.app.innerHTML).toContain('인도는 끝났고 12일에 2,500.00 USD를 받습니다. 그때까지 현금은 들어오지 않습니다.');
    ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toContain('<b>12일</b>');
    expect(ui.app.innerHTML).toContain('오늘 수금 예정 — 하루 진행 때 받습니다');
    expect(ui.app.innerHTML).toContain('인도는 끝났고 오늘 하루 진행 때 2,500.00 USD를 받습니다.');
    expect(ui.app.innerHTML).not.toContain('12일 수금 대기');
    ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toContain('CT001 대금 2,500.00 USD 수금. 계약 종결');
  });

  it('금액 기준 안내는 위쪽 막대에 한 번 나오고 오늘 대기 명령을 금액에 반영하지 않는다', async () => {
    const ui = await startUi();
    const header = () => ui.app.innerHTML.match(/<header class="topbar">([\s\S]*?)<\/header>/)![1]!;
    const original = header();
    const queue = () => ui.app.innerHTML.split('<section class="panel queue"')[1]!.split('</section>')[0]!;
    const note = '위쪽 막대의 금액은 확정 기준입니다. 여기 넣은 일은 하루 진행 뒤에 반영됩니다.';
    expect(original).toContain('<small class="amount-basis">금액은 확정 기준</small>');
    expect(queue()).not.toContain(note);
    ui.click({ action: 'accept', buy: 'OFFER_BUY_02', sell: 'OFFER_SELL_02' });
    expect(header()).toBe(original);
    expect(queue()).toContain(note);
    expect(ui.app.innerHTML.match(/금액은 확정 기준/g)).toHaveLength(2);
    const resources = ui.app.innerHTML.split('<section class="panel resources"')[1]!.split('</section>')[0]!;
    expect(header()).toContain('<b>3,000.00 USD</b>');
    // 위쪽 막대(확정)와 이름으로도 구분한다.
    expect(resources).toContain('<th>현금 (오늘 할 일 실행 뒤)</th><td>1,000.00 USD</td>');
    expect(resources).toContain('<th>사용 가능 (오늘 할 일 실행 뒤)</th>');
    ui.click({ action: 'end-day' });
    expect(header()).toContain('<b>1,000.00 USD</b>');
    expect(header()).not.toContain('<b>3,000.00 USD</b>');
  });

  it('첫 편의 선복 부족은 계약 안내와 한 번에 확정 미리 보기에 나온다', async () => {
    const ui = await startUi();
    ui.click({ action: 'accept-fwd', offer: 'OFFER_FWD_01' });
    ui.click({ action: 'assign', emp: 'EMP01' });
    ui.click({ action: 'book', contract: 'CT001', sailing: 'ROUTE01-D002' });
    const preview = ui.app.innerHTML.match(/<p class="reason">(한 번에 확정할 수 없습니다 — 운송편 예약 불가:[\s\S]*?)<\/p>/)![1]!;
    expect(preview).toContain('견적도 수락하지 않습니다.');
    expect(preview).not.toContain('철회했습니다');
    expect(ui.rendered({ action: 'accept-plan', key: 'OFFER_FWD_02' }).disabled).toBe(true);
    ui.click({ action: 'accept-fwd', offer: 'OFFER_FWD_02' });
    expect(ui.app.innerHTML).toContain('운송편을 예약하지 않았습니다. 2일 편은 선복이 부족합니다. 실을 수 있는 첫 출항은 9일이고 예약 마감은 8일입니다.');
  });

  it('발견·의뢰 중 후보는 일급과 설정 일수의 계약금 금액을 보이고 면담에서도 같은 금액이다', async () => {
    const cfg = structuredClone(config); cfg.recruitment!.signingFeeWageDays = 7;
    const ui = await startUi(cfg);
    ui.change({ action: 'recruit-emp', key: 'VEN_PORT' }, 'EMP02');
    ui.click({ action: 'scout', venue: 'VEN_PORT', emp: 'EMP02' });
    ui.click({ action: 'end-day' });
    const candidateParts = () => [
      ui.app.innerHTML.match(/<article class="card [^"]*"[^>]*data-emp="EMP04"[\s\S]*?<\/article>/)![0]!,
      ui.app.innerHTML.match(/<article class="recruit-candidate"><h4 id="candidate-h-EMP04"[\s\S]*?<\/article>/)![0]!,
      ui.app.innerHTML.match(/<tr[^>]*data-emp="EMP04"[\s\S]*?<\/tr>/)![0]!,
    ];
    for (const stage of ['발견', '의뢰 진행 중']) {
      const parts = candidateParts();
      expect(parts[0]).toContain(stage);
      for (const part of parts) expect(part).toContain('110,000원');
      for (const card of parts.slice(0, 2)) {
        expect(card).toContain('고용하면 계약금 770,000원(일급 110,000원 × 7일)을 한 번 냅니다. 고용 여부는 면담 뒤에 정합니다.');
      }
      if (stage === '발견') ui.click({ action: 'recruit-quest', candidate: 'EMP04', emp: 'EMP01' });
    }
    ui.click({ action: 'end-day' }); ui.click({ action: 'end-day' });
    ui.click({ action: 'interview', candidate: 'EMP04' });
    const interview = candidateParts()[1]!;
    expect(interview).toContain('<dt>계약금 (일급×7)</dt><dd>770,000원</dd>');
    expect(interview).toContain('<dt>일급</dt><dd>110,000원</dd>');
    expect(interview).not.toContain('고용 여부는 면담 뒤에 정합니다.');
  });
});

describe('항만 대기 실제 화면 연결',()=>{
  const mapSummary=(html:string)=>html.match(/<h2 id="world-h">세계지도 <small>(.*?)<\/small>/)![1]!;
  const ship=(html:string)=>html.match(/<g class="ship [^"]*"[^>]*><title>(.*?)<\/title>/)![0]!;

  it('M2 6일 화면·지도 요약·선박은 하역 중단 대기를 표시하지 않는다',async()=>{
    const ui=await startUi();
    ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});
    ui.click({action:'assign',emp:'EMP01'});
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE02-D002'});
    for(let day=1;day<6;day++)ui.click({action:'end-day'});
    const html=ui.app.innerHTML;
    expect(html).toContain('<b>6일</b>');
    expect(mapSummary(html)).toBe('운항 중 화물 1건');
    expect(mapSummary(html)).not.toContain('대기');
    expect(ship(html)).toContain('ROUTE02-D002: SH001');
    expect(ship(html)).not.toMatch(/waiting|하역 중단/);
    expect(html).not.toContain('하역 중단');
    expect(html).toContain('오늘 도착 예정 — 하루 진행 때 하역합니다');
  });

  it('M1 7·8일에는 화면·지도 요약·선박에 대기를 표시하고 9일에는 해제한다',async()=>{
    const cfg=loadScenario('SCENARIO_M1_DELAY_ACCEPTED');
    const ui=await startUi();
    await ui.importText(serializeSave(openDay(runDays(createGame(cfg),cfg,6,{1:standardDayOneCommands(cfg)}).state,cfg).state));
    for(const day of [7,8]) {
      const html=ui.app.innerHTML;
      expect(html).toContain('<b>'+day+'일</b>');
      expect(mapSummary(html)).toBe('운항 중 화물 1건 · 대기 1건 (하역 재개를 기다림)');
      expect(ship(html)).toContain('class="ship waiting"');
      expect(ship(html)).toContain('하역 중단으로 대기 중');
      expect(html).toContain(`바다에서 대기 중입니다 (${day-7}일째)`);
      ui.click({action:'end-day'});
    }
    expect(mapSummary(ui.app.innerHTML)).toBe('운항 중 화물 1건');
    expect(ship(ui.app.innerHTML)).not.toMatch(/waiting|하역 중단/);
    expect(ui.app.innerHTML).toContain('하역 재개 — 오늘 도착 예정 (대기 2일)');
    expect(ui.app.innerHTML).not.toContain('바다에서 대기 중입니다');
  });
});

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
  it('운영 장부의 여덟 행은 실제 화면에서 지정 순서로 나온다',async()=>{
    const ui=await startUi();
    const table=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...table.matchAll(/<th>(.*?)<\/th>/g)].map((m)=>m[1])).toEqual(['시작 운영 자금','급여','영입 계약금','훈련비','현지 활동비','운영 손익','미지급 급여','현금']);
    expect(table).toContain('<td colspan="2" class="muted small">급여는 원화로 매일 지급하며 계약금·훈련비·현지 활동비는 한 번 내는 원화 비용입니다. USD 거래 장부와 합산하지 않습니다. 가상 환율 1,300원/달러는 보고에 쓰지 않습니다.</td>');
  });
  it.each(['restart','scenario'])('%s 뒤 지난 게임의 flash 알림을 비운다',async(mode)=>{
    const ui=await startUi();ui.click({action:'scout',venue:'VEN_PORT'});
    expect(ui.app.innerHTML).toContain('<div class="flash-toast flash info" role="status">오늘 할 일에 넣었습니다.');
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
    ui.click({action:'culture-tab'});ui.click({action:'culture-book'});
    ui.click({action:'culture-act',activity:'CA01'});ui.click({action:'culture-emp',emp:'EMP02'});
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
    expect(ui.app.innerHTML).not.toContain('id="local"');
    expect(ui.app.innerHTML).not.toContain('id="culture-preview"');
    expect(ui.app.innerHTML).not.toContain('id="culture-book-body"');
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
  it('쉬는 직원과 조사 중인 직원은 훈련 빼기·진행 안내를 표시하지 않는다',async()=>{
    const ui=await startUi();
    ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    const noTrainingNotice=()=>{
      const detail=employeeSection(ui.app.innerHTML);
      expect(detail).not.toContain('빼려면');
      expect(detail).not.toContain('일반 훈련 중');
    };
    noTrainingNotice();
    ui.click({action:'scout',venue:'VEN_PORT',emp:'EMP01'});
    noTrainingNotice();
    expect(employeeSection(ui.app.innerHTML)).toContain('class="reason"');
  });

  it('같은 성장 알림도 진행 전 날짜로 구분하고 대기 목록 뒤에 표시한다',async()=>{
    const cfg=structuredClone(config);cfg.employees[0]!.growth!.startXp=300;
    const ui=await startUi(cfg);ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'});ui.click({action:'end-day'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe('<h3 class="small">1일 하루 진행 — 경험치·레벨 변화</h3><p>귀솔 +60 경험치</p>');
    expect(growthNotice(ui.app.innerHTML)![1]).toContain('role="status"');
    const queue=()=>ui.app.innerHTML.split('<section class="panel queue"')[1]!.split('</section>')[0]!;
    expect(queue().indexOf('대기 중인 명령이 없습니다.')).toBeLessThan(queue().indexOf('class="growth-notices"'));
    ui.click({action:'train',emp:'EMP01'});
    expect(queue()).toContain('<ol class="pending">');
    expect(queue().indexOf('</ol>')).toBeLessThan(queue().indexOf('1일 하루 진행 — 경험치·레벨 변화'));
    expect(queue().indexOf('</ol>')).toBeLessThan(queue().indexOf('class="growth-notices"'));
    expect(queue().indexOf('class="flash')).toBeLessThan(queue().indexOf('<ol class="pending">'));
    ui.click({action:'end-day'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe('<h3 class="small">2일 하루 진행 — 경험치·레벨 변화</h3><p>귀솔 +60 경험치</p>');
    expect(growthNotice(ui.app.innerHTML)![1]).toContain('role="status"');
  });
  it('하루 진행 예외 뒤 이전 성장 알림은 날짜와 함께 남고 다시 읽지 않는다',async()=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'});ui.click({action:'end-day'});
    const notice=growthNotice(ui.app.innerHTML)![2];
    expect(notice).toContain('1일 하루 진행 — 경험치·레벨 변화');expect(notice).toContain('귀솔 +60 경험치');
    expect(growthNotice(ui.app.innerHTML)![1]).toContain('role="status"');
    const engine=await import('../engine/engine');
    vi.spyOn(engine,'commitDay').mockImplementation(()=>{throw new Error('결산 검증 실패');});
    ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toContain('하루 진행에 실패했습니다: 결산 검증 실패');
    expect(ui.app.innerHTML).toContain('<b>2일</b>');
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toMatch(/role="status"|aria-live/);
  });
  it('경험치·레벨 변화 없는 다음 하루를 성공적으로 진행하면 이전 성장 알림을 비운다',async()=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'});ui.click({action:'end-day'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toContain('귀솔 +60 경험치');
    ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toContain('<b>3일</b>');
    expect(ui.app.innerHTML).toContain('경험치 60 / 100');
    expect(ui.app.innerHTML).not.toContain('하루 진행에 실패했습니다');
    expect(growthNotice(ui.app.innerHTML)).toBeNull();
    expect(ui.app.innerHTML).not.toContain('하루 진행 — 경험치·레벨 변화');
  });
  it('오늘 대기 훈련만 빼기를 안내하고 진행 중 3일 훈련의 진행 정도는 한 번만 표시한다',async()=>{
    const cfg=structuredClone(config);cfg.growth!.ordinaryTraining.durationDays=3;
    const ui=await startUi(cfg);ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'});
    for(const progress of [0,1]) {
      const detail=employeeSection(ui.app.innerHTML);
      expect(detail).toContain(`◆ 교육 중 ${progress}/3일`);
      expect(detail.match(new RegExp(`${progress}/3일`, 'g'))).toHaveLength(1);
      expect(detail).not.toContain('class="reason"');
      if(progress===0) {
        expect(detail).toContain('<p>이미 일반 훈련을 넣었습니다. 빼려면 오늘 할 일에서 ‘빼기’를 누르세요.</p>');
        expect(ui.app.innerHTML).toContain('aria-label="귀솔 일반 훈련 빼기"');
      } else {
        expect(detail).not.toContain('<p>일반 훈련 중 1/3일</p>');
        expect(detail).not.toContain('빼려면');
        expect(ui.app.innerHTML).not.toContain('aria-label="귀솔 일반 훈련 빼기"');
      }
      expect(detail).toContain('<p>레벨·능력이 올라도 하루 처리량은 2pt 그대로입니다. 훈련하는 3일 동안 다른 업무를 맡을 수 없습니다.</p>');
      if(progress===0)ui.click({action:'end-day'});
    }
  });
  it('훈련 대기의 급여 날짜는 이미 반영한 훈련비를 두 번 빼지 않는다',async()=>{
    // 370,000원에서 훈련비를 한 번 빼면 이틀 급여 320,000원, 두 번 빼면 하루분만 남는다.
    const cfg=structuredClone(config);cfg.startingCash.KRW=370_000;
    const ui=await startUi(cfg);ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'});
    const detail=employeeSection(ui.app.innerHTML);
    expect(detail).toContain('훈련비 50,000원 반영됨');
    expect(detail).toContain('<p>원화 급여 지급 가능일: 지금 2일까지</p>');
    expect(detail).not.toContain('훈련하면');
  });
  it('1일과 3pt 동료 고용 후 5일의 상세·직원 각주는 실제 처리량을 표시한다',async()=>{
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    expect(employeeSection(ui.app.innerHTML)).toContain('<p>레벨·능력이 올라도 하루 처리량은 2pt 그대로입니다. 훈련하는 날은 다른 업무를 맡을 수 없습니다.</p>');
    expect(crewNote(ui.app.innerHTML)).toBe('레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 2pt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다. 일급 80,000원.');
    const day5=openDay(runDays(createGame(config),config,4,{
      1:[{id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02'}],
      2:[{id:'Q',type:'START_RECRUIT_QUEST',candidateId:'EMP04',employeeId:'EMP01'}],
      4:[{id:'H',type:'HIRE_CANDIDATE',candidateId:'EMP04'}],
    }).state,config).state;
    await ui.importText(serializeSave(day5));
    expect(ui.app.innerHTML).toContain('<b>5일</b>');
    ui.click({action:'select-card',emp:'EMP04'});ui.click({action:'detail',emp:'EMP04'});
    expect(employeeSection(ui.app.innerHTML)).toContain('<p>레벨·능력이 올라도 하루 처리량은 3pt 그대로입니다. 훈련하는 날은 다른 업무를 맡을 수 없습니다.</p>');
    expect(crewNote(ui.app.innerHTML)).toBe('레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 2~3pt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다. 일급 80,000원~110,000원.');
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
    const cfg=structuredClone(config);cfg.growth!.ordinaryTraining.durationDays=3;
    const ui=await startUi(cfg);ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    ui.click({action:'train',emp:'EMP01'},fromChild);ui.click({action:'end-day'});
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
      const button=html.match(/<button[^>]*data-action="train"[^>]*>/)?.[0];
      if (!allowed) {
        expect(button).toBeUndefined();
        expect(html).toContain('id="status-train-EMP01" tabindex="-1">일반 훈련 예정');
      } else {
      expect(button).toContain('data-action="train"');expect(button).toContain('data-emp="EMP01"');
      expect(button).toContain('aria-label="귀솔 일반 훈련"');expect(button!.includes('disabled')).toBe(false);
      }
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
    ui.focus.mockClear();ui.focusIds.length=0;
    ui.focusTrain('EMP01');ui.click({action:'train',emp:'EMP01'});
    expect(ui.focus).toHaveBeenCalledOnce();expect(ui.focusIds).toEqual(['growth-h-EMP01']);
    expect(ui.app.innerHTML).toContain('◆ 교육 중 0/1일');
    expect(ui.app.innerHTML).not.toContain('data-action="train"');
    expect(ui.app.innerHTML).toContain('id="status-train-EMP01" tabindex="-1">일반 훈련 예정');
    expect(ui.closestSelectors).toContain('.employee-detail, .recruit-site, .recruit-candidate');
    const detail=ui.app.innerHTML.split('<section class="employee-detail"')[1]!.split('</section>')[0]!;
    expect(detail).not.toContain('훈련 뒤');expect(detail).not.toContain('훈련하면');
    expect(detail).toContain('◆ 교육 중 0/1일 — 훈련비 50,000원 반영됨. 완료하면 +60 경험치');
    ui.doc.activeElement=null;ui.click({action:'end-day'});
    const status=()=>ui.app.innerHTML.match(/<div class="growth-notices" role="status">([\s\S]*?)<\/div>/)?.[1];
    expect(status()).toBe('<h3 class="small">1일 하루 진행 — 경험치·레벨 변화</h3><p>귀솔 +60 경험치</p><p>귀솔 레벨 2 달성 (교섭 +2, 협업 +1)</p>');
    expect(status()!.match(/\+60 경험치/g)).toHaveLength(1);
    expect(status()!.match(/레벨 2 달성/g)).toHaveLength(1);
    const notice=growthNotice(ui.app.innerHTML)![2];
    ui.click({action:'select-card',emp:'EMP02'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('role="status"');
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('aria-live');
    ui.click({action:'detail',emp:'EMP02'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('role="status"');
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('aria-live');
    ui.click({action:'train',emp:'EMP02'});
    ui.click({action:'unqueue',index:'0'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toMatch(/role="status"|aria-live/);
    ui.click({action:'crew-filter',filter:'busy'});
    expect(growthNotice(ui.app.innerHTML)?.[2]).toBe(notice);
    expect(growthNotice(ui.app.innerHTML)![1]).not.toMatch(/role="status"|aria-live/);
    ui.click({action:'train',emp:'EMP02'});ui.click({action:'end-day'});
    expect(growthNotice(ui.app.innerHTML)![2]).toBe('<h3 class="small">2일 하루 진행 — 경험치·레벨 변화</h3><p>물보리 +60 경험치</p>');
    expect(growthNotice(ui.app.innerHTML)![1]).toContain('role="status"');
    const storage:Record<string,string>={};
    vi.stubGlobal('localStorage',{setItem:(key:string,value:string)=>{storage[key]=value;},getItem:(key:string)=>storage[key]});
    ui.click({action:'save'});expect(status()).toBeUndefined();
    expect(growthNotice(ui.app.innerHTML)![2]).toBe('<h3 class="small">2일 하루 진행 — 경험치·레벨 변화</h3><p>물보리 +60 경험치</p>');
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
    expect(crewNote(ui.app.innerHTML)).toBe('처리량은 고정값(LEGACY_FIXED, 하루 2pt)만 씁니다. 능력·속성·레벨·시너지는 이후 M2a 단계(성장)와 M2b에서 켭니다. 일급 80,000원.');
    const table=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...table.matchAll(/<th>(.*?)<\/th>/g)].map((m)=>m[1])).toEqual(['시작 운영 자금','급여','운영 손익','미지급 급여','현금']);
    expect(table).not.toContain('계약금');expect(table).not.toContain('훈련비');
    expect(ui.app.innerHTML).not.toContain('class="employee-detail"');
    ui.click({action:'end-day'});
    const updated=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...updated.matchAll(/<td>(.*?)<\/td>/g)].map((m)=>m[1])).toEqual(['10,000,000원','−80,000원','−80,000원','0원','9,920,000원']);
  });
});

describe('TASK-0014 휴대폰·태블릿 조작', () => {
  const cosmetics = { action:'accept', buy:'OFFER_BUY_02', sell:'OFFER_SELL_02' };
  const pendingCount = (html:string) => (html.match(/<ol class="pending">([\s\S]*?)<\/ol>/)?.[1]?.match(/<li\b/g) ?? []).length;
  it.each(['accept','accept-fwd','accept-plan'])('포인터 %s 뒤 새 계약 제목을 스크롤·초점 대상으로 쓴다', async(action) => {
    const ui = await startUi();
    if (action === 'accept-plan') {
      const initial = openDay(createGame(config),config).state;
      const unlocked = planState(initial,config,[
        {id:'A',type:'ACCEPT_FORWARDING',offerId:'OFFER_FWD_01'},
        {id:'S',type:'ASSIGN_TASK',taskId:'TASK001',employeeId:'EMP02'},
        {id:'B',type:'BOOK_SAILING',contractId:'CT001',sailingId:'ROUTE01-D002'},
        {id:'C',type:'CANCEL_CONTRACT',contractId:'CT001'},
      ]).state;
      await ui.importText(serializeSave(unlocked));
    }
    ui.focus.mockClear();ui.focusIds.length=0;ui.scroll.mockClear();
    ui.clickNow(action === 'accept' ? cosmetics : action === 'accept-fwd'
      ? {action,offer:'OFFER_FWD_01'} : {action,key:'OFFER_BUY_02+OFFER_SELL_02'},1);
    const id = action === 'accept-plan' ? 'contract-h-CT002' : 'contract-h-CT001';
    expect(ui.scrollIds).toEqual([id]);
    expect(ui.focusIds).toEqual([id]);
    expect(ui.focus).toHaveBeenCalledExactlyOnceWith({preventScroll:true});
    expect(ui.scroll).toHaveBeenCalledExactlyOnceWith({block:'start'});
    expect(ui.app.innerHTML).toContain(`id="${id}" tabindex="-1"`);
    expect(ui.app.innerHTML).toContain('<div class="flash-toast flash info" role="status">오늘 할 일에 넣었습니다. ‘하루 진행’을 누르면 실행됩니다. 그 전에는 시간이 흐르지 않습니다.</div>');
    expect(ui.app.innerHTML).toContain('<p class="flash info">오늘 할 일에 넣었습니다.');
  });
  it('배정·예약은 스크롤을 요청하지 않고 같은 칸에 예정 표시와 키보드 초점을 남긴다', async() => {
    const ui = await startUi();ui.click(cosmetics);
    ui.scroll.mockClear();ui.focus.mockClear();ui.focusIds.length=0;
    ui.click({action:'assign',emp:'EMP01'});
    expect(ui.focusIds).toEqual(['status-assign-TASK001']);
    expect(ui.doc.activeElement.id).toBe('status-assign-TASK001');
    expect(ui.app.innerHTML).toContain('min-height:88px;width:260px;max-width:100%');
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE02-D002'});
    expect(ui.focusIds.at(-1)).toBe('status-book-CT001');
    expect(ui.doc.activeElement.id).toBe('status-book-CT001');
    expect(ui.scroll).not.toHaveBeenCalled();
    for (const [options] of ui.focus.mock.calls) expect(options).toEqual({preventScroll:true});
    expect(ui.app.innerHTML).toContain('준비 업무 배정 예정');
    expect(ui.app.innerHTML).toContain('운송편 예약 예정');
  });
  it.each(['scout','recruit-quest','hire','train'])('%s 뒤에도 스크롤 없이 누른 칸에 예정 표시가 남는다', async(action) => {
    const ui=await startUi();
    if(action==='recruit-quest') {
      const discovered=openDay(runDays(createGame(config),config,1,{
        1:[{id:'S',type:'SCOUT_SITE',venueId:'VEN_PORT',employeeId:'EMP02'}],
      }).state,config).state;
      await ui.importText(serializeSave(discovered));
    } else if(action==='hire') {
      await ui.importText(readySave());ui.click({action:'interview',candidate:'EMP04'});
    } else if(action==='train') {
      ui.click({action:'select-card',emp:'EMP01'});ui.click({action:'detail',emp:'EMP01'});
    }
    ui.scroll.mockClear();
    ui.click(action==='scout' ? {action,venue:'VEN_PORT',emp:'EMP01'}
      : action==='train' ? {action,emp:'EMP01'} : {action,candidate:'EMP04'});
    expect(ui.scroll).not.toHaveBeenCalled();
    expect(ui.app.innerHTML).toContain({scout:'현장 조사 예정','recruit-quest':'영입 의뢰 예정',hire:'고용 예정',train:'일반 훈련 예정'}[action]!);
    expect(ui.doc.activeElement).not.toBeNull();
  });
  it('포인터로 사라지는 버튼을 눌러도 오늘 할 일 제목으로 대체하지 않는다', async() => {
    const ui=await startUi();ui.click(cosmetics);vi.advanceTimersByTime(500);
    ui.focus.mockClear();ui.focusIds.length=0;
    ui.clickNow({action:'unqueue',index:'0'},1);
    expect(ui.focusIds).not.toContain('queue-h');
    expect(ui.focus).not.toHaveBeenCalled();
  });
  it('키보드로 사라진 버튼을 누르면 body 대신 가까운 제목으로 초점을 옮긴다', async() => {
    const ui=await startUi();ui.click(cosmetics);
    ui.click({action:'unqueue',index:'0'});
    expect(ui.doc.activeElement.id).toBe('queue-h');
    expect(ui.focus).toHaveBeenLastCalledWith({preventScroll:true});
  });
  it('대안 제목 가운데가 고정 막대에 가려지면 보이는 하루 진행에 초점을 둔다', async() => {
    const ui=await startUi();ui.click(cosmetics);
    ui.bounds['status-assign-TASK001']={top:20,bottom:60,height:40};
    ui.click({action:'assign',emp:'EMP01'});
    expect(ui.doc.activeElement.dataset.action).toBe('end-day');
    expect(ui.scrollIds).toEqual(['contract-h-CT001']);
  });
  it('대안 제목 가운데가 아래쪽 알림에 가려져도 보이는 하루 진행에 초점을 둔다', async() => {
    const ui=await startUi();ui.click(cosmetics);ui.setToastTop(700);
    ui.bounds['status-assign-TASK001']={top:720,bottom:760,height:40};
    ui.click({action:'assign',emp:'EMP01'});
    expect(ui.doc.activeElement.dataset.action).toBe('end-day');
  });
  it('배정 뒤 위쪽 내용이 늘면 늘어난 만큼 스크롤해 예정 표시를 누른 높이에 둔다', async() => {
    const ui=await startUi();ui.click(cosmetics);ui.scrollBy.mockClear();
    ui.afterRender(()=>{ui.slotTops['assign-TASK001']=230;});
    ui.click({action:'assign',emp:'EMP01'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,50);
    // 버튼(위 200)이 칸(위 180)에서 20px 아래에 있었다.
    expect(ui.app.innerHTML).toContain('justify-content:flex-start;padding-top:20px"><span class="pill" id="status-assign-TASK001"');
  });
  it('배정 뒤 위쪽 내용이 줄면 스크롤하지 않는다', async() => {
    const ui=await startUi();ui.click(cosmetics);ui.scrollBy.mockClear();
    ui.afterRender(()=>{ui.slotTops['assign-TASK001']=150;});
    ui.click({action:'assign',emp:'EMP01'});
    expect(ui.scrollBy).not.toHaveBeenCalled();
    expect(ui.doc.activeElement.id).toBe('status-assign-TASK001');
  });
  it.each([[340,40],[275,-25]])('하루 진행 뒤 읽던 계약 제목이 %ipx로 가면 %ipx 스크롤해 같은 높이에 둔다', async(after,dy) => {
    const ui=await startUi();ui.click(cosmetics);ui.click({action:'end-day'});
    ui.bounds['contract-h-CT001']={top:300,bottom:330,height:30};ui.scrollBy.mockClear();
    ui.afterRender(()=>{ui.bounds['contract-h-CT001']={top:after,bottom:after+30,height:30};});
    ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toContain('<b>3일</b>');
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,dy);
  });
  it('하루 진행 뒤 계약 제목이 그대로면 스크롤하지 않는다', async() => {
    const ui=await startUi();ui.click(cosmetics);ui.click({action:'end-day'});ui.scrollBy.mockClear();
    ui.click({action:'end-day'});
    expect(ui.scrollBy).not.toHaveBeenCalled();
  });
  it('알림이 있으면 가리는 높이를 --toast-h로 알리고 없어지면 0px로 되돌린다', async() => {
    const ui=await startUi();const set=vi.mocked(ui.doc.documentElement.style.setProperty);
    ui.setToastTop(690);ui.click(cosmetics);
    expect(set).toHaveBeenCalledWith('--toast-h','118px');
    set.mockClear();ui.click({action:'end-day'});
    expect(set).toHaveBeenCalledWith('--toast-h','0px');
    expect(set).not.toHaveBeenCalledWith('--toast-h','118px');
  });
  it('500ms 안의 다른 명령 클릭도 막고 500ms 뒤에는 받는다', async() => {
    const ui=await startUi();ui.clickNow(cosmetics,1);
    ui.clickNow({action:'assign',emp:'EMP01'},1);
    expect(pendingCount(ui.app.innerHTML)).toBe(1);
    vi.advanceTimersByTime(499);ui.clickNow({action:'assign',emp:'EMP01'},1);
    expect(pendingCount(ui.app.innerHTML)).toBe(1);
    vi.advanceTimersByTime(1);ui.clickNow({action:'assign',emp:'EMP01'},1);
    expect(pendingCount(ui.app.innerHTML)).toBe(2);
  });
  it('하루 진행을 두 번 눌러도 하루만 진행하고 차단 시간 뒤에는 다음 날로 간다', async() => {
    const ui=await startUi();ui.clickNow({action:'end-day'},1);ui.clickNow({action:'end-day'},1);
    expect(ui.app.innerHTML).toContain('<b>2일</b>');expect(ui.app.innerHTML).not.toContain('<b>3일</b>');
    vi.advanceTimersByTime(500);ui.clickNow({action:'end-day'},1);
    expect(ui.app.innerHTML).toContain('<b>3일</b>');
  });
  it.each(['restart','scenario','load','import'])('%s 확인을 거절하면 진행과 대기 명령이 유지된다', async(action) => {
    const ui=await startUi();ui.click({action:'end-day'});
    ui.click({action:'scout',venue:'VEN_PORT'});
    const before=ui.app.innerHTML;
    vi.mocked(confirm).mockReturnValue(false);
    vi.stubGlobal('localStorage',{getItem:()=>serializeSave(openDay(createGame(config),config).state)});
    if(action==='scenario')await ui.change({action},'SCENARIO_M1_ONE_TRADE');
    else if(action==='import')await ui.importText(serializeSave(openDay(createGame(config),config).state));
    else ui.click({action});
    expect(confirm).toHaveBeenCalled();
    expect(ui.app.innerHTML).toBe(before);expect(pendingCount(ui.app.innerHTML)).toBe(1);
    expect(ui.doc.title).toBe(`Scitrade — ${config.titleKo}`);
  });
  it('적용 가능한 배정·예약 버튼에는 title이 없고 거절 이유는 버튼 밖에도 있다', async() => {
    const ui=await startUi();ui.click({action:'accept-fwd',offer:'OFFER_FWD_01'});
    const buttons=ui.app.innerHTML.match(/<button[^>]*data-action="(?:assign|book)"[^>]*>/g)!;
    expect(buttons.length).toBeGreaterThan(0);
    for(const button of buttons)if(!button.includes('disabled'))expect(button).not.toContain('title=');
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE01-D002'});
    ui.click({action:'accept-fwd',offer:'OFFER_FWD_02'});
    const blocked=ui.app.innerHTML.match(/<button[^>]*data-action="book"[^>]*data-sailing="ROUTE01-D002"[^>]*disabled[^>]*>([\s\S]*?)<\/button><p class="reason">([^<]+)<\/p>/);
    expect(blocked).not.toBeNull();
    expect(blocked![1]).toContain(blocked![2]!);
    expect(blocked![2]).toContain('이 출항편의 남은 화물 공간이 부족합니다');
  });
  it('카드를 두 번 눌러도 선택이 유지되고 성장 상세 버튼을 화면 안으로 가져온다', async() => {
    const ui=await startUi();ui.click({action:'select-card',emp:'EMP01'});
    ui.click({action:'select-card',emp:'EMP01'});
    expect(ui.app.innerHTML).toMatch(/<article class="[^"]*is-selected"[^>]*data-action="select-card"[^>]*data-emp="EMP01"/);
    expect(ui.app.innerHTML).toContain('귀솔 성장·훈련 상세');
    expect(ui.scroll).toHaveBeenCalledTimes(2);
    expect(ui.doc.activeElement.dataset.action).toBe('detail');
  });
  it('문서 제목은 새 시나리오와 불러온 시나리오를 따른다', async() => {
    const ui=await startUi();expect(ui.doc.title).toBe(`Scitrade — ${config.titleKo}`);
    const m1=loadScenario('SCENARIO_M1_ONE_TRADE');
    await ui.change({action:'scenario'},m1.id);expect(ui.doc.title).toBe(`Scitrade — ${m1.titleKo}`);
    await ui.importText(serializeSave(openDay(createGame(config),config).state));
    expect(ui.doc.title).toBe(`Scitrade — ${config.titleKo}`);
  });
  it('M1도 견적 수락·배정·예약에서 수금·종결까지 진행한다', async() => {
    const ui=await startUi();await ui.change({action:'scenario'},'SCENARIO_M1_ONE_TRADE');
    ui.click({action:'accept',buy:'OFFER_BUY_01',sell:'OFFER_SELL_01'});
    ui.click({action:'assign',emp:'EMP01'});
    ui.click({action:'book',contract:'CT001',sailing:'ROUTE01-D002'});
    for(let day=1;day<=12;day++)ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toContain('CT001 대금 1,400.00 USD 수금. 계약 종결');
    expect(ui.app.innerHTML).toContain('종결된 계약');
    expect(ui.app.innerHTML).not.toContain('data-action="train"');
    expect(ui.app.innerHTML).not.toContain('부산 동료 영입');
  });
  it('고정되는 상태 막대의 실제 높이를 ResizeObserver로 CSS에 갱신한다', async() => {
    const ui=await startUi();
    expect(ui.doc.documentElement.style.setProperty).toHaveBeenLastCalledWith('--topbar-h','100px');
    ui.resizeStatusbar(140);
    expect(ui.doc.documentElement.style.setProperty).toHaveBeenLastCalledWith('--topbar-h','140px');
  });
  it('가로 세 열(거래 먼저)·한 열 배치 순서·고정 막대 분리·터치 크기·글자 대비 규칙을 유지한다', async() => {
    const {readFileSync}=await vi.importActual<{readFileSync:(path:URL,encoding:string)=>string}>('node:fs');
    const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
    expect(css).toContain('grid-template-areas: "trade" "queue" "crew" "resources" "report" "world" "log";');
    // 1001px 이상 가로 기기는 모두 거래가 맨 위인 세 열 배치다.
    expect(css).toMatch(/\.layout \{[^}]*grid-template-areas:\s*"trade trade crew"\s*"trade trade resources"\s*"trade trade queue"\s*"world report log";/);
    expect(css).toContain('@media (max-width: 1000px) {\n  .layout, .layout.map-wide');
    expect(css).not.toContain('max-width: 1100px');
    expect(css).toMatch(/\.layout\.map-wide\s*\{[^}]*"trade trade crew"\s*"trade trade resources"\s*"trade trade queue"\s*"world world world"\s*"report report log";/);
    expect(css).toMatch(/@media \(any-pointer: coarse\)\s*\{\s*\.training > \.pill\s*\{\s*min-height:\s*44px/);
    expect(css).toMatch(/\.books\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*12rem\),\s*1fr\)\)/);
    expect(css).toMatch(/\.resources table\.money td\s*\{[^}]*white-space:\s*nowrap/);
    expect(css).not.toMatch(/(^|\n)table\.money td\s*\{[^}]*nowrap/);
    expect(css).toMatch(/\.masthead\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.statusbar\s*\{[^}]*position:\s*sticky/);
    expect(css).toContain('scroll-padding-top: var(--topbar-h)');
    expect(css).toContain('overscroll-behavior-y: none');
    expect(css).toContain('color-scheme: only light');
    expect(css).toContain('touch-action: manipulation');
    expect(css).toMatch(/@media \(any-pointer: coarse\)\s*\{[^}]*min-height:\s*44px/);
    expect(css).not.toMatch(/@media \(pointer: coarse\)/);
    expect(css).toContain('select { font-size: 16px; }');
    expect(css.match(/button:disabled\s*\{([^}]+)\}/)![1]).not.toContain('opacity');
    const color=(name:string)=>css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))![1]!;
    const luminance=(hex:string)=>[1,3,5].map((i)=>parseInt(hex.slice(i,i+2),16)/255)
      .map((v)=>v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
      .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i]!,0);
    for(const background of ['paper','warn-bg']) {
      const [dark,light]=[luminance(color('warn')),luminance(color(background))].sort((a,b)=>a-b);
      expect((light!+.05)/(dark!+.05)).toBeGreaterThanOrEqual(4.5);
    }
    const ui=await startUi();
    const masthead=ui.app.innerHTML.split('<div class="masthead">')[1]!.split('<div class="statusbar"')[0]!;
    expect(masthead).toContain('data-action="restart"');expect(masthead).not.toContain('data-action="end-day"');
    const bar=ui.app.innerHTML.split('<div class="statusbar"')[1]!.split('</header>')[0]!;
    for(const label of ['거래 현금','사용 가능','운영 현금','다음 수금','금액은 확정 기준','하루 진행 ▶'])expect(bar).toContain(label);
  });
});

describe('3판 표시 수정 (Codex 사용성 점검 2026-10-07)', () => {
  it('견적의 대금일은 계약 조건으로 적고, 인도가 늦으면 실제로 받는 날을 따로 알린다', async () => {
    const ui = await startUi();
    // 1일 화장품: 계약상 대금일 12일이 인도보다 늦으므로 그대로 받는다.
    expect(ui.app.innerHTML).toContain('계약상 대금일은 12일입니다.');
    expect(ui.app.innerHTML).toContain('<li>대금은 12일에 받을 예정</li>');
    ui.click({ action: 'end-day' }); ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toContain('<b>3일</b>');
    // 3일 가구 주선: 다음 편이 14일에 도착하므로 계약상 대금일 10일에는 받을 수 없다.
    const fwd = ui.app.innerHTML.split('가구 화주가')[1]!.split('</article>')[0]!;
    expect(fwd).toContain('계약상 대금일은 10일입니다.');
    expect(fwd).toContain('대금은 14일에 받을 예정 (인도가 계약상 대금일 10일보다 늦기 때문)');
    expect(ui.app.innerHTML).not.toContain('대금은 10일.');
  });
});

describe('TASK-0012 문화 활동 실제 화면 연결',()=>{
  const taskId='CULTURE-CA01-EMP01-D2';
  const pendingCount=(html:string)=>(html.match(/<ol class="pending">([\s\S]*?)<\/ol>/)?.[1]?.match(/<li\b/g) ?? []).length;
  const local=(html:string)=>html.split('<div id="local-body">')[1]!.split('</section>')[0]!;
  const tab=(html:string)=>html.match(/<button id="local-tab"[^>]*>([\s\S]*?)<\/button>/)![1]!;
  const toast=(html:string)=>html.match(/<div class="flash-toast[^>]*>([\s\S]*?)<\/div>/)?.[0] ?? '';
  const header=(html:string)=>html.match(/<header class="topbar">[\s\S]*?<\/header>/)![0];
  async function select(ui:Awaited<ReturnType<typeof startUi>>) {
    ui.click({action:'end-day'});ui.click({action:'culture-tab'});
    ui.click({action:'culture-act',activity:'CA01'});ui.click({action:'culture-emp',emp:'EMP01'});
  }
  async function exportReader(ui:Awaited<ReturnType<typeof startUi>>) {
    let blob:Blob|null=null;
    vi.spyOn(URL,'createObjectURL').mockImplementation((value)=>{blob=value as Blob;return 'blob:task0012';});
    vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>undefined);
    return async()=>{
      const calls=ui.doc.createElement.mock.calls.length;
      ui.click({action:'export'});
      expect(ui.doc.createElement).toHaveBeenCalledWith('a');expect(ui.doc.createElement.mock.calls.length).toBe(calls+1);
      expect(ui.doc.createElement.mock.results.at(-1)!.value.click).toHaveBeenCalledOnce();
      return blob!.text();
    };
  }
  it('한 바퀴(a): 연 채 진행·선택 500ms·F1 예정 초점·결과 단일 알림',async()=>{
    const ui=await startUi();await select(ui);
    expect(ui.scrollIds).toContain('local-h');expect(ui.focusIds).toContain('local-h');
    expect(ui.doc.activeElement.id).toBe('culture-emp-EMP01');expect(ui.app.innerHTML).toContain('id="culture-preview"');
    vi.advanceTimersByTime(499);ui.clickNow({action:'culture-queue',activity:'CA01',emp:'EMP01'});
    expect(pendingCount(ui.app.innerHTML)).toBe(0);
    ui.scrollBy.mockClear();ui.afterRender(()=>{ui.slotTops['culture-CA01-EMP01']=230;});
    ui.click({action:'culture-queue',activity:'CA01',emp:'EMP01'});
    expect(pendingCount(ui.app.innerHTML)).toBe(1);
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,50);
    expect(ui.doc.activeElement.id).toBe('status-culture-CA01-EMP01');
    expect(ui.app.innerHTML).toContain('id="status-culture-CA01-EMP01"');
    ui.click({action:'culture-emp',emp:'EMP02'});
    expect(ui.app.innerHTML).toContain('같은 활동에 오늘 이미 귀솔이(가) 갑니다.');
    expect(ui.rendered({action:'culture-queue'}).disabled).toBe(true);
    ui.click({action:'culture-emp',emp:'EMP01'});
    expect(local(ui.app.innerHTML)).not.toContain('를 진행 중입니다.');
    expect(ui.app.innerHTML).toContain('id="status-culture-CA01-EMP01"');
    ui.scrollIds.length=0;ui.scrollBy.mockClear();ui.click({action:'end-day'});
    expect(ui.doc.activeElement.dataset.action).toBe('end-day');expect(ui.scrollIds).toEqual([]);expect(ui.scrollBy).not.toHaveBeenCalled();
    expect(toast(ui.app.innerHTML)).toContain('data-action="culture-result"');expect(toast(ui.app.innerHTML)).toContain('role="status"');
    expect(growthNotice(ui.app.innerHTML)![1]).not.toContain('role');
    const copy=ui.app.innerHTML.split('<section class="panel queue"')[1]!.split('</section>')[0]!;
    expect(copy).toContain('<p class="flash info">2일 현지 활동 기록: 한 상인의 포장·보관 요구 — 귀솔</p>');
    expect(copy).not.toContain('data-action="culture-result"');expect(copy).not.toContain('role="status"');
    expect(tab(ui.app.innerHTML)).toContain('<small>닫기</small>');
    expect(ui.app.innerHTML).toMatch(/<div id="local-body">\s*<article class="cul-result"/);
    expect(ui.app.innerHTML).not.toContain('id="culture-preview"');
    ui.click({action:'culture-book'});
    expect(toast(ui.app.innerHTML)).toContain('결과 보기');expect(toast(ui.app.innerHTML)).not.toContain('role="status"');
  });
  it('한 바퀴(b): 닫고 진행은 스크롤 없이 새 기록 표시, 결과 보기만 제목으로 이동한다',async()=>{
    const ui=await startUi();await select(ui);ui.click({action:'culture-queue'});ui.click({action:'culture-tab'});
    ui.scrollBy.mockClear();ui.scrollIds.length=0;ui.click({action:'end-day'});
    expect(ui.scrollBy).not.toHaveBeenCalled();expect(ui.scrollIds).toEqual([]);expect(tab(ui.app.innerHTML)).toContain('새 기록 있음');
    expect(ui.doc.activeElement.dataset.action).toBe('end-day');
    ui.click({action:'culture-result'});
    expect(ui.app.innerHTML).toContain('id="local"');
    expect(ui.scrollIds).toEqual([`culture-result-h-${taskId}`]);expect(ui.focusIds.at(-1)).toBe(`culture-result-h-${taskId}`);
    expect(ui.scroll).toHaveBeenLastCalledWith({block:'start'});expect(ui.focus).toHaveBeenLastCalledWith({preventScroll:true});
    expect(toast(ui.app.innerHTML)).toBe('');
    ui.clickNow({action:'culture-close',where:'head'});expect(ui.app.innerHTML).toContain('id="local"');
    // 결과 보기로 본 결과는 본 것으로 남는다.
    ui.click({action:'culture-close',where:'head'});expect(tab(ui.app.innerHTML)).toContain('장소 5곳');
  });
  it('안 본 결과는 이틀 진행 뒤에도 남고 열어 본 다음 다시 열 때 사라진다',async()=>{
    const ui=await startUi();await select(ui);ui.click({action:'culture-queue'});ui.click({action:'culture-close',where:'head'});
    ui.click({action:'end-day'});ui.click({action:'end-day'});expect(ui.app.innerHTML).toContain('<b>4일</b>');
    expect(tab(ui.app.innerHTML)).toContain('새 기록 있음');expect(toast(ui.app.innerHTML)).toBe('');
    ui.click({action:'culture-tab'});
    expect(ui.app.innerHTML).toMatch(/<div id="local-body">\s*<article class="cul-result"/);
    expect(ui.app.innerHTML).toContain(`id="culture-result-h-${taskId}"`);
    ui.click({action:'culture-tab'});expect(tab(ui.app.innerHTML)).toContain('장소 5곳');
    ui.click({action:'culture-tab'});expect(ui.app.innerHTML).not.toContain('class="cul-result"');
  });
  it.each(['tab','head','end'])('닫기 %s는 열기 전 탭 위치로 한 번 복원하고 초점·500ms를 지킨다',async(where)=>{
    const ui=await startUi();ui.bounds['local-tab']={top:240,bottom:284,height:44};
    ui.click({action:'culture-tab'});expect(ui.doc.activeElement.id).toBe('local-h');
    ui.clickNow({action:'culture-tab'});expect(ui.app.innerHTML).toContain('id="local"');
    ui.scrollBy.mockClear();ui.afterRender(()=>{ui.bounds['local-tab']={top:310,bottom:354,height:44};});
    ui.click(where==='tab' ? {action:'culture-tab'} : {action:'culture-close',where});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,70);expect(ui.doc.activeElement.id).toBe('local-tab');
    expect(ui.app.innerHTML).not.toContain('id="local"');
    vi.advanceTimersByTime(499);ui.clickNow({action:'culture-tab'});expect(ui.app.innerHTML).not.toContain('id="local"');
    vi.advanceTimersByTime(1);ui.clickNow({action:'culture-tab'});expect(ui.app.innerHTML).toContain('id="local"');
  });
  it('결과 보기로 연 뒤 닫을 때는 탭을 막대 아래·알림 위로 최소 이동한다',async()=>{
    const ui=await startUi();await select(ui);ui.click({action:'culture-queue'});ui.click({action:'culture-tab'});ui.click({action:'end-day'});ui.click({action:'culture-result'});
    ui.scrollBy.mockClear();ui.afterRender(()=>{ui.bounds['local-tab']={top:50,bottom:94,height:44};});
    ui.click({action:'culture-close',where:'end'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,-58);expect(ui.doc.activeElement.id).toBe('local-tab');
  });
  it('읽던 직원 제목은 결과 높이만큼 한 번 보정하고 사라지는 미리 보기는 기준이 아니다',async()=>{
    const ui=await startUi();await select(ui);ui.click({action:'culture-queue'});
    ui.bounds['culture-h']={top:50,bottom:80,height:30};
    ui.bounds['culture-emp-h']={top:180,bottom:210,height:30};
    ui.bounds['culture-pv-h']={top:280,bottom:310,height:30};
    ui.bounds['culture-book-h']={top:780,bottom:810,height:30};
    ui.afterRender(()=>{ui.bounds['culture-emp-h']={top:530,bottom:560,height:30};});
    ui.scrollBy.mockClear();ui.scrollIds.length=0;ui.click({action:'end-day'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,350);expect(ui.scrollIds).toEqual([]);
    expect(ui.app.innerHTML).not.toContain('id="culture-pv-h"');expect(ui.doc.activeElement.dataset.action).toBe('end-day');
  });
  it('읽던 첫 결과가 남고 여러 후보 중 가장 위의 제목을 쓴다',async()=>{
    const ui=await startUi();await select(ui);ui.click({action:'culture-queue'});ui.click({action:'end-day'});
    const heading=`culture-result-h-${taskId}`;ui.bounds[heading]={top:170,bottom:200,height:30};
    ui.bounds['culture-h']={top:400,bottom:430,height:30};ui.bounds['culture-emp-h']={top:550,bottom:580,height:30};
    ui.afterRender(()=>{ui.bounds[heading]={top:150,bottom:180,height:30};});ui.scrollBy.mockClear();ui.click({action:'end-day'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,-20);
  });
  it('직원 고르기는 한 번의 최소 스크롤 뒤 누른 직원에 초점을 둔다',async()=>{
    const ui=await startUi();ui.click({action:'culture-tab'});ui.click({action:'culture-act',activity:'CA01'});
    ui.bounds['culture-emp-h']={top:600,bottom:630,height:30};ui.bounds['culture-slot']={top:960,bottom:1050,height:90};
    ui.bounds['culture-emp-EMP01']={top:700,bottom:744,height:44};
    ui.setToastTop(620);ui.click({action:'save'});ui.scrollBy.mockClear();
    ui.click({action:'culture-emp',emp:'EMP01'});
    // 띠 아래 끝은 알림 위 끝(620px)이다. CSS 변수와 무관하다.
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,430);expect(ui.doc.activeElement.id).toBe('culture-emp-EMP01');
    expect(ui.focus).toHaveBeenLastCalledWith({preventScroll:true});
  });
  it('미리 보기 넘침은 누른 직원의 막대 아래 8px 상한을 우선한다',async()=>{
    const ui=await startUi();ui.click({action:'culture-tab'});ui.click({action:'culture-act',activity:'CA01'});
    ui.bounds['culture-emp-h']={top:160,bottom:190,height:30};ui.bounds['culture-emp-EMP01']={top:180,bottom:224,height:44};
    ui.bounds['culture-slot']={top:910,bottom:1000,height:90};ui.scrollBy.mockClear();
    ui.click({action:'culture-emp',emp:'EMP01'});expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,72);
    expect(ui.doc.activeElement.id).toBe('culture-emp-EMP01');
  });
  it('활동·직원의 같은 선택은 유지하고 다른 활동을 고르면 직원·미리 보기만 지운다',async()=>{
    const ui=await startUi();await select(ui);ui.click({action:'culture-emp',emp:'EMP01'});ui.click({action:'culture-act',activity:'CA01'});
    expect(ui.app.innerHTML).toContain('id="culture-preview"');
    ui.click({action:'culture-act',activity:'CA02'});expect(ui.app.innerHTML).not.toContain('id="culture-preview"');
    ui.clickNow({action:'culture-emp',emp:'EMP01'});expect(ui.app.innerHTML).not.toContain('id="culture-preview"');
    vi.advanceTimersByTime(500);ui.clickNow({action:'culture-emp',emp:'EMP01'});expect(ui.app.innerHTML).toContain('id="culture-preview"');
  });
  it('P0-CITY-01 열람·선택·미리 보기·결과 보기 전후 저장 문자열과 위쪽 막대는 같다',async()=>{
    const ui=await startUi();const read=await exportReader(ui);const saved=await read(),bar=header(ui.app.innerHTML);
    for(const action of [{action:'culture-tab'},{action:'culture-book'},{action:'culture-book'},
      {action:'culture-act',activity:'CA01'},{action:'culture-emp',emp:'EMP01'},
      {action:'culture-close',where:'head'},{action:'culture-tab'},{action:'culture-close',where:'end'}] as Record<string,string>[]) {
      ui.click(action);expect(await read()).toBe(saved);expect(header(ui.app.innerHTML)).toBe(bar);
    }
    expect(ui.focusIds).toContain('local-h');expect(ui.focusIds).toContain('culture-emp-EMP01');expect(ui.focusIds).toContain('local-tab');
    ui.click({action:'culture-tab'});ui.click({action:'culture-queue'});ui.click({action:'culture-tab'});ui.click({action:'end-day'});
    const before=await read(),beforeBar=header(ui.app.innerHTML);expect(toast(ui.app.innerHTML)).toContain('결과 보기');
    ui.click({action:'culture-result'});expect(await read()).toBe(before);expect(header(ui.app.innerHTML)).toBe(beforeBar);
    expect(ui.scrollIds.some((id)=>id.startsWith('culture-result-h-'))).toBe(true);expect(toast(ui.app.innerHTML)).toBe('');
    expect(ui.doc.createElement.mock.calls.length).toBe(11);
  });
  it('P0-CITY-01 금융센터는 미구현 표시가 있고 주식·상장 단추가 없다',async()=>{
    const ui=await startUi();ui.click({action:'culture-tab'});
    expect(ui.app.innerHTML).toContain('금융센터</dt><dd>주식 거래와 상장(회사 주식을 시장에 내놓기)은 이번 판에 없습니다.');
    const list=ui.app.innerHTML.match(/<dl class="local-venues">([\s\S]*?)<\/dl>/)![1]!;
    expect([...list.matchAll(/<dt>/g)]).toHaveLength(5);expect(list).not.toContain('<button');
    for(const button of ui.app.innerHTML.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g))expect(button[1]).not.toMatch(/주식|상장|IPO/);
  });
  it.each(['restart','load','import','scenario'])('%s 뒤 펼침·기록장·활동·직원 선택은 초기화된다',async(mode)=>{
    const s=openDay(runDays(createGame(config),config,2,{2:[{id:'C',type:'START_CULTURE_ACTIVITY',activityId:'CA01',employeeId:'EMP01'}]}).state,config).state;
    const ui=await startUi();await ui.importText(serializeSave(s));ui.click({action:'end-day'});ui.click({action:'culture-tab'});ui.click({action:'culture-book'});
    ui.click({action:'culture-act',activity:'CA02'});ui.click({action:'culture-emp',emp:'EMP01'});
    if(mode==='load'){vi.stubGlobal('localStorage',{getItem:()=>serializeSave(s)});ui.click({action:'load'});}
    else if(mode==='import')await ui.importText(serializeSave(s));
    else if(mode==='restart')ui.click({action:'restart'});
    else await ui.change({action:'scenario'},config.id);
    expect(ui.app.innerHTML).not.toContain('id="local"');expect(toast(ui.app.innerHTML)).not.toContain('culture-result');
    ui.click({action:'culture-tab'});expect(ui.app.innerHTML).not.toContain('id="culture-preview"');expect(ui.app.innerHTML).not.toContain('id="culture-book-body"');
    expect(local(ui.app.innerHTML)).not.toContain('aria-pressed="true"');expect(ui.app.innerHTML).not.toContain('id="culture-emp-h"');
    if(mode==='load'||mode==='import')expect(ui.app.innerHTML).toContain(`id="culture-result-h-${taskId}"`);
    // 닫기는 초기화 뒤 새로 연 순간의 탭 위치로 돌아간다. 초기화 전 값이 남는지는 이 하네스로 관찰할 수 없다(initialUiState 시험이 맡는다).
    ui.scrollBy.mockClear();ui.afterRender(()=>{ui.bounds['local-tab']={top:250,bottom:294,height:44};});ui.click({action:'culture-close',where:'end'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,50);
  });
  it('M1 전체 화면에는 문화 탭·패널·비용·감싸는 칸이 없다',async()=>{
    const ui=await startUi();await ui.change({action:'scenario'},'SCENARIO_M1_ONE_TRADE');
    for(const text of ['부산 현지','현지 활동비','data-action="culture-','class="maincol"'])expect(ui.app.innerHTML).not.toContain(text);
    ui.click({action:'end-day'});for(const text of ['부산 현지','현지 활동비','data-action="culture-','class="maincol"'])expect(ui.app.innerHTML).not.toContain(text);
  });
  it('CA01 하루 뒤 원화 비용 행의 합과 운영 손익·현금식은 일치한다',async()=>{
    const ui=await startUi();ui.click({action:'culture-tab'});ui.click({action:'culture-act',activity:'CA01'});ui.click({action:'culture-emp',emp:'EMP01'});ui.click({action:'culture-queue'});ui.click({action:'end-day'});
    const table=ui.app.innerHTML.split('<caption>운영 장부 · KRW</caption>')[1]!.split('</table>')[0]!;
    expect([...table.matchAll(/<th>(.*?)<\/th>/g)].map((m)=>m[1])).toEqual(['시작 운영 자금','급여','영입 계약금','훈련비','현지 활동비','운영 손익','미지급 급여','현금']);
    expect([...table.matchAll(/<td>(.*?)<\/td>/g)].map((m)=>m[1])).toEqual(['10,000,000원','−160,000원','0원','0원','−20,000원','−180,000원','0원','9,820,000원']);
    const read=await exportReader(ui),save=JSON.parse(await read());
    const {companyReport}=await import('../engine/reports');const p=companyReport(save.state,config).payroll;
    expect(-p.wageExpense-p.recruitmentExpense-p.trainingExpense-p.cultureExpense).toBe(p.profit);
    expect(p.cash).toBe(p.openingEquity+p.profit+p.accountsPayable);
  });
  it('문화 CSS의 줄 높이·알림 단추·탭 위치는 고정한 규칙이다',async()=>{
    const {readFileSync}=await vi.importActual<{readFileSync:(path:URL,encoding:string)=>string}>('node:fs');
    const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
    expect(css).toMatch(/\.layout\s*\{[^}]*grid-template-rows:\s*auto auto 1fr/);
    expect(css).toMatch(/@media \(max-width: 1000px\)\s*\{\s*\.layout, \.layout\.map-wide\s*\{[^}]*grid-template-rows:\s*none/);
    expect(css).toMatch(/\.flash-toast button\s*\{[^}]*pointer-events:\s*auto/);
    expect(css).toMatch(/\.flash-toast button\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.trade\s*\{[^}]*position:\s*relative/);expect(css).toMatch(/\.local-tab\s*\{[^}]*position:\s*absolute/);
    const ui=await startUi();expect(ui.app.innerHTML).toMatch(/<h2 id="trade-h"[^>]*>[\s\S]*?<\/h2>\s*<button id="local-tab"/);
    expect(ui.app.innerHTML).not.toMatch(/id="local-tab"[^>]*aria-controls/);
    ui.click({action:'culture-tab'});expect(ui.app.innerHTML).toMatch(/id="local-tab"[^>]*aria-controls="local-body"/);
  });
});

describe('TASK-0012 Claude 검수 보강',()=>{
  const taskId='CULTURE-CA01-EMP01-D2';
  const tab=(html:string)=>html.match(/<button id="local-tab"[^>]*>([\s\S]*?)<\/button>/)![1]!;
  const toast=(html:string)=>html.match(/<div class="flash-toast[^>]*>([\s\S]*?)<\/div>/)?.[0] ?? '';
  async function queued(ui:Awaited<ReturnType<typeof startUi>>) {
    ui.click({action:'end-day'});ui.click({action:'culture-tab'});
    ui.click({action:'culture-act',activity:'CA01'});ui.click({action:'culture-emp',emp:'EMP01'});ui.click({action:'culture-queue'});
  }
  it.each([false,true])('M2에서도 제목이 막대 위인 읽던 계약 본문의 위치를 복원한다 (패널 열림 %s)',async(open)=>{
    const ui=await startUi();ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});ui.click({action:'end-day'});
    if(open)ui.click({action:'culture-tab'});
    ui.bounds['contract-h-CT001']={top:20,bottom:50,height:30};
    ui.afterRender(()=>{ui.bounds['contract-h-CT001']={top:70,bottom:100,height:30};});
    ui.scrollBy.mockClear();ui.scrollIds.length=0;ui.click({action:'end-day'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,50);expect(ui.scrollIds).toEqual([]);
    expect(ui.doc.activeElement.dataset.action).toBe('end-day');
  });
  it('결과 카드는 제목이 막대 위여도 블록이 보이면 읽던 자리 기준이다',async()=>{
    const ui=await startUi();await queued(ui);ui.click({action:'end-day'});
    ui.bounds[`culture-result-h-${taskId}`]={top:40,bottom:70,height:30};ui.bounds[`culture-result-${taskId}`]={top:30,bottom:520,height:490};
    ui.afterRender(()=>{ui.bounds[`culture-result-h-${taskId}`]={top:300,bottom:330,height:30};});
    ui.scrollBy.mockClear();ui.click({action:'end-day'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,260);
  });
  it('읽던 자리 후보는 DOM 순서가 아니라 화면 위에서부터 고른다',async()=>{
    const ui=await startUi();ui.click({action:'accept',buy:'OFFER_BUY_02',sell:'OFFER_SELL_02'});await queued(ui);
    ui.bounds['culture-h']={top:50,bottom:80,height:30};ui.bounds['culture-emp-h']={top:180,bottom:210,height:30};
    ui.bounds['culture-book-h']={top:780,bottom:810,height:30};ui.bounds['contract-h-CT001']={top:600,bottom:630,height:30};
    // 계약 후보는 먼저 모으지만 화면에서는 직원 제목이 위다. 두 후보의 이동량을 다르게 둔다.
    ui.afterRender(()=>{ui.bounds['culture-emp-h']={top:530,bottom:560,height:30};ui.bounds['contract-h-CT001']={top:900,bottom:930,height:30};});
    ui.scrollBy.mockClear();ui.click({action:'end-day'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,350);
  });
  it.each(['open','closed'])('탭으로 먼저 연 뒤(%s) 결과 보기를 눌러도 방금 마감한 날의 카드로 간다',async(after)=>{
    const ui=await startUi();await queued(ui);ui.click({action:'culture-close',where:'head'});ui.click({action:'end-day'});
    ui.click({action:'culture-tab'});expect(ui.app.innerHTML).toContain(`id="culture-result-h-${taskId}"`);
    if(after==='closed')ui.click({action:'culture-tab'});
    expect(toast(ui.app.innerHTML)).toContain('data-action="culture-result"');
    ui.focusIds.length=0;ui.scrollIds.length=0;ui.click({action:'culture-result'});
    expect(ui.app.innerHTML).toContain(`id="culture-result-h-${taskId}"`);
    expect(ui.scrollIds).toEqual([`culture-result-h-${taskId}`]);expect(ui.focusIds.at(-1)).toBe(`culture-result-h-${taskId}`);
    expect(toast(ui.app.innerHTML)).toBe('');
    ui.click({action:'culture-close',where:'head'});expect(tab(ui.app.innerHTML)).toContain('장소 5곳');
  });
  it('같은 날 결과가 두 건이면 결과 보기는 화면의 첫 결과 카드로 간다',async()=>{
    const ui=await startUi();await queued(ui);
    ui.click({action:'culture-act',activity:'CA02'});ui.click({action:'culture-emp',emp:'EMP02'});ui.click({action:'culture-queue'});
    ui.click({action:'end-day'});ui.scrollIds.length=0;ui.click({action:'culture-result'});
    const ids=[...ui.app.innerHTML.matchAll(/id="(culture-result-h-[^"]+)"/g)].map((m)=>m[1]);
    expect(ids).toHaveLength(2);expect(ui.scrollIds).toEqual([ids[0]]);expect(ui.focusIds.at(-1)).toBe(ids[0]);
  });
  it('탭·기록장·활동·직원의 상태 속성과 거래 위 패널 배치',async()=>{
    const ui=await startUi();ui.click({action:'end-day'});
    expect(ui.app.innerHTML).toMatch(/id="local-tab"[^>]*aria-expanded="false"/);
    ui.click({action:'culture-tab'});expect(ui.app.innerHTML).toMatch(/id="local-tab"[^>]*aria-expanded="true"/);
    expect(ui.app.innerHTML).toMatch(/<div class="maincol"><section class="panel local"[\s\S]*?<\/section>\s*<section class="panel trade"/);
    expect(ui.app.innerHTML).toMatch(/data-action="culture-book" aria-expanded="false"/);
    ui.click({action:'culture-book'});expect(ui.app.innerHTML).toMatch(/data-action="culture-book" aria-expanded="true"/);
    ui.click({action:'culture-act',activity:'CA02'});
    expect(ui.app.innerHTML).toMatch(/data-activity="CA02" aria-pressed="true"/);expect(ui.app.innerHTML).toMatch(/data-activity="CA01" aria-pressed="false"/);
    ui.click({action:'culture-emp',emp:'EMP01'});
    expect(ui.app.innerHTML).toMatch(/id="culture-emp-EMP01"[^>]*aria-pressed="true"/);expect(ui.app.innerHTML).toMatch(/id="culture-emp-EMP02"[^>]*aria-pressed="false"/);
  });
});

describe('TASK-0012 M1 동작 보존',()=>{
  it('M1에서는 제목이 막대 위라도 읽던 계약 본문의 위치를 복원한다',async()=>{
    const ui=await startUi();await ui.change({action:'scenario'},'SCENARIO_M1_ONE_TRADE');
    ui.click({action:'accept',buy:'OFFER_BUY_01',sell:'OFFER_SELL_01'});
    ui.bounds['contract-h-CT001']={top:20,bottom:50,height:30};
    ui.afterRender(()=>{ui.bounds['contract-h-CT001']={top:70,bottom:100,height:30};});
    ui.scrollBy.mockClear();ui.click({action:'end-day'});
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0,50);expect(ui.doc.activeElement.dataset.action).toBe('end-day');
  });
});
