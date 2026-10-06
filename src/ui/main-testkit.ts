// 실제 main 모듈의 연결을 시험하는 최소 DOM. 버튼 속성과 초점 선택자를 렌더 결과에서 읽는다.
import { vi } from 'vitest';
import type { ScenarioConfig } from '../engine/types';

const unescape = (text: string) => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export async function startUi(config?: ScenarioConfig) {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('window', { innerHeight: 800 });
  let statusbarHeight = 100;
  let resizeStatus: (() => void) | undefined;
  const bounds: Record<string,{top:number;bottom:number;height:number}> = {};
  vi.stubGlobal('ResizeObserver', class { constructor(callback:()=>void) { resizeStatus=callback; } observe() {} disconnect() {} });
  const content = await import('../content/scenario');
  if (config) {
    const original = content.loadScenario;
    vi.spyOn(content, 'loadScenario').mockImplementation((id) => id === config.id ? config : original(id));
  }
  let measureCallback: ((frame: HTMLElement, width: number, dpr: number) => void) | undefined;
  const pixel = await import('./pixel');
  vi.spyOn(pixel, 'applyPixelScale').mockImplementation((_root, callback) => { measureCallback = callback; return () => undefined; });
  class Button { disabled = false; }
  class Input { dataset = { action:'import' }; files: {text:()=>Promise<string>}[] = []; }
  vi.stubGlobal('HTMLButtonElement', Button); vi.stubGlobal('HTMLInputElement', Input);
  const listeners: Record<string, (ev: any) => unknown> = {};
  let html = '';
  const focus = vi.fn();
  const scroll = vi.fn();
  const scrollIds: string[] = [];
  const rect = () => ({top:200,bottom:240,height:40});
  const focusIds: string[] = [];
  const closestSelectors: string[] = [];
  const doc = { title:'', documentElement:{style:{setProperty:vi.fn()}}, activeElement:null as any, querySelector:()=>app,
    getElementById:(id:string)=> html.includes(`id="${id}"`) ? {
      id, dataset:{}, getBoundingClientRect:()=>bounds[id] ?? rect(), closest:()=>null,
      focus:(options?:FocusOptions)=>{focusIds.push(id);focus(options);doc.activeElement={id,dataset:{},closest:()=>null};},
      scrollIntoView:(options?:ScrollIntoViewOptions)=>{scrollIds.push(id);scroll(options);},
    } : null };
  const newFrame = () => ({ dataset:{} as Record<string,string>,innerHTML:'',scrollLeft:0,scrollWidth:2000,clientWidth:930,querySelector:()=>null });
  let frame = newFrame();
  const elements = () => [...html.matchAll(/<(button|article|tr|select)\b([^>]*\bdata-action="[^"]*"[^>]*)>/g)].map((match) => {
    const attrs = Object.fromEntries([...match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1]!, unescape(m[2]!)]));
    const dataset = Object.fromEntries(Object.entries(attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[key.slice(5).replace(/-([a-z])/g,(_m,c:string)=>c.toUpperCase()),value]));
    const element = Object.assign(match[1] === 'button' ? new Button() : {}, {
      dataset, tagName:match[1]!.toUpperCase(), disabled:/\sdisabled(?:\s|$)/.test(match[2]!), getBoundingClientRect:rect,
      focus:(options?:FocusOptions)=>{focus(options);doc.activeElement=element;},
      closest:(selector:string)=>{
        closestSelectors.push(selector);
        const selectors=selector.split(',').map((s)=>s.trim());
        if(selectors.includes('[data-action]')) return element;
        if (selectors.includes('.contract') && ['assign','book','cancel'].includes(dataset.action!)) return {querySelector:()=>({id:`contract-h-${dataset.contract ?? 'CT001'}`})};
        const section=dataset.action === 'train' || dataset.action === 'detail' ? '.employee-detail'
          : dataset.action === 'scout' ? '.recruit-site' : '.recruit-candidate';
        const id=section === '.employee-detail' ? `growth-h-${dataset.emp}` : section === '.recruit-site' ? `site-h-${dataset.venue}` : `candidate-h-${dataset.candidate}`;
        return selectors.includes(section) && html.includes(`id="${id}"`) ? {querySelector:()=>({id})} : null;
      },
    });
    return element;
  });
  const rendered = (dataset:Record<string,string>) => {
    const element=elements().find((e)=>Object.entries(dataset).every(([key,value])=>e.dataset[key]===value));
    if(!element) throw new Error(`렌더된 요소 없음: ${JSON.stringify(dataset)}`);
    return element;
  };
  const app = {
    get innerHTML() { return html; }, set innerHTML(value:string) { html=value; frame=newFrame(); },
    addEventListener:(name:string,callback:typeof listeners[string])=>{listeners[name]=callback;},
    querySelector:(selector:string)=>selector==='.statusbar' ? {getBoundingClientRect:()=>({top:0,bottom:statusbarHeight,height:statusbarHeight})} : selector === '[data-action="detail"]' && html.includes('data-action="detail"') ? Object.assign(rendered({action:'detail'}),{scrollIntoView:scroll}) : selector === '[data-action="end-day"]' ? rendered({action:'end-day'}) : selector==='[data-map-frame]' || (selector === '.map-frame.is-world' && html.includes('class="map-frame is-world"')) ? frame : null,
    querySelectorAll:(selector:string)=>selector==='[data-action-slot]' ? [...html.matchAll(/data-action-slot="([^"]+)"/g)].map((m)=>({dataset:{actionSlot:m[1]},getBoundingClientRect:()=>({height:88,width:260})})) : elements(),
  };
  vi.stubGlobal('document',doc);
  await import('./main');
  const clickNow = (dataset:Record<string,string>,detail=0,fromChild=false) => {
    const element=rendered(dataset);
    return listeners.click!({detail,target:fromChild ? {closest:(selector:string)=>element.closest(selector)} : element});
  };
  return { app, doc, focus, focusIds, scroll, scrollIds, closestSelectors, rendered, frame:()=>frame,
    // 기존 흐름 시험은 사람이 화면을 읽고 다음 버튼을 누르는 간격을 둔다.
    // 두 번 누름 시험은 clickNow와 가짜 타이머를 직접 쓴다.
    click:(dataset:Record<string,string>,fromChild=false)=>{vi.advanceTimersByTime(501);return clickNow(dataset,0,fromChild);},
    clickNow, bounds,
    resizeStatusbar:(height:number)=>{statusbarHeight=height;resizeStatus!();},
    change:(dataset:Record<string,string>,value:string)=>listeners.change!({target:{...rendered(dataset),value}}),
    importText:async(text:string)=>{const input=new Input(); input.files=[{text:async()=>text}]; await listeners.change!({target:input});},
    focusTrain:(emp:string)=>{ doc.activeElement=rendered({action:'train',emp}); },
    measure:(width:number,dpr:number)=>measureCallback!(frame as unknown as HTMLElement,width,dpr),
  };
}
