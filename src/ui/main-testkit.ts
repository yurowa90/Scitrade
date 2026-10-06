// 실제 main 모듈의 연결을 시험하는 최소 DOM. HTML 파서는 필요하지 않다.
import { vi } from 'vitest';
import type { ScenarioConfig } from '../engine/types';

export async function startUi(config?: ScenarioConfig) {
  vi.resetModules();
  const content = await import('../content/scenario');
  if (config) {
    const original = content.loadScenario;
    vi.spyOn(content, 'loadScenario').mockImplementation((id) => id === config.id ? config : original(id));
  }
  const pixel = await import('./pixel');
  vi.spyOn(pixel, 'applyPixelScale').mockImplementation(() => () => undefined);
  class Button { disabled = false; }
  class Input { dataset = { action:'import' }; files: {text:()=>Promise<string>}[] = []; }
  vi.stubGlobal('HTMLButtonElement', Button); vi.stubGlobal('HTMLInputElement', Input);
  const listeners: Record<string, (ev: any) => unknown> = {};
  let html = '';
  const focus = vi.fn();
  const focusIds: string[] = [];
  const doc = { activeElement:null as any, querySelector:()=>app, getElementById:(id:string)=> html.includes(`id="${id}"`) ? {focus:()=>{focusIds.push(id);focus();}} : null };
  const frame = { dataset:{} as Record<string,string>,innerHTML:'',scrollLeft:0,scrollWidth:2000,clientWidth:930,querySelector:()=>null };
  const app = {
    get innerHTML() { return html; }, set innerHTML(value:string) { html=value; },
    addEventListener:(name:string,callback:typeof listeners[string])=>{listeners[name]=callback;},
    querySelector:(selector:string)=>selector==='[data-map-frame]' ? frame : null,
    querySelectorAll:()=>[],
  };
  vi.stubGlobal('document',doc);
  await import('./main');
  return { app, doc, focus, focusIds,
    click:(dataset:Record<string,string>)=>listeners.click!({target:{closest:()=>({dataset})}}),
    change:(dataset:Record<string,string>,value:string)=>listeners.change!({target:{dataset,value}}),
    importText:async(text:string)=>{const input=new Input(); input.files=[{text:async()=>text}]; await listeners.change!({target:input});},
    focusTrain:(emp:string)=>{ doc.activeElement={dataset:{action:'train',emp},tagName:'BUTTON',closest:()=>({querySelector:()=>({id:`growth-h-${emp}`})})}; },
  };
}
