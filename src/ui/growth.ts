// 성장 수치와 훈련 판정은 엔진 읽기 함수에서 받고, 화면은 문구와 HTML만 만든다.
import { levelProgress } from '../engine/growth';
import { formatMoney } from '../engine/money';
import { payrollRunwayDay, trainingPreview } from '../engine/previews';
import { runningTaskOf } from '../engine/reservations';
import { crewStatusKo } from './crew-status';
import type { EmployeeDef, GameState, ScenarioConfig } from '../engine/types';
import { esc } from './html';

export const STAT_NAMES_KO: Record<string,string> = {
  negotiation:'교섭', operations:'운영', analysis:'분석', technology:'기술', exploration:'탐사', coordination:'협업',
};
const statKo = (id:string) => STAT_NAMES_KO[id] ?? id;

export function xpProgressKo(progress: NonNullable<ReturnType<typeof levelProgress>>): string {
  return progress.nextLevelXp === null ? `경험치 ${progress.xp} · 최대 레벨`
    : `경험치 ${progress.xp} / ${progress.nextLevelXp} · 다음 레벨까지 ${progress.xpToNext}`;
}

export function coreStatsKo(def:EmployeeDef, stats:Record<string,number> | null): string {
  if (!def.growth || !stats) return '';
  const g=def.growth;
  return `주능력 ${statKo(g.primaryStat)} ${stats[g.primaryStat]} · 부능력 ${statKo(g.secondaryStat)} ${stats[g.secondaryStat]}`;
}

function gainsKo(before:Record<string,number>|null, after:Record<string,number>|null): string {
  if (!before || !after) return '';
  return Object.keys(after).filter((id)=>after[id]! > (before[id] ?? 0))
    .map((id)=>`${statKo(id)} +${after[id]!-(before[id] ?? 0)}`).join(', ');
}

export function trainingBlock(state:GameState, config:ScenarioConfig, def:EmployeeDef): string {
  if (!config.growth) return '';
  const preview=trainingPreview(state,config,def.id);
  const task=runningTaskOf(state,def.id);
  const training=task?.kind === 'TRAINING' ? task : undefined;
  const current=levelProgress(state,config,def.id);
  const gains=gainsKo(current?.stats ?? null,preview.statsAfter);
  // 경험치 문구도 같은 엔진 함수에서 받는다. 완료 예상 사본은 저장하지 않는다.
  const projected=structuredClone(state);
  const employee=projected.employees.find((e)=>e.id===def.id);
  if(employee) employee.xp += preview.xpGain;
  const progress=levelProgress(projected,config,def.id);
  const change = current && preview.levelAfter !== current.level
    ? `완료하면 레벨 ${preview.levelAfter}${gains ? ` (${gains})` : ''}`
    : progress?.xpToNext === null ? '레벨 변화 없음 — 최대 레벨' : `레벨 변화 없음 — 다음 레벨까지 ${progress?.xpToNext ?? '확인 불가'}`;
  const runway=(day:number|null)=>day===null ? `${config.campaignDays}일(캠페인 끝)까지` : `${day}일까지`;
  const money=(amount:number)=>esc(formatMoney(preview.fee.currency,amount));
  return `<div class="training"><h4>일반 훈련</h4>
    <p>훈련비 ${money(preview.fee.minor)} · 기간 ${preview.durationDays}일 · 완료 시 +${preview.xpGain} 경험치</p>
    <p>급여는 훈련비와 별도로 평소대로 지급합니다.</p>
    ${training ? `<p>${esc(crewStatusKo(training))} — 훈련비 ${money(preview.fee.minor)} 반영됨. 완료하면 +${preview.xpGain} 경험치</p>` : `<p>훈련에 쓸 수 있는 원화: 지금 ${money(preview.availableBeforeMinor)} → 훈련 뒤 ${money(preview.availableAfterMinor)}</p>`}
    <p>${esc(change)}. 성장 변화는 완료할 때 반영됩니다.</p>
    ${training ? '' : `<p>원화 급여 지급 가능일: 지금 ${runway(payrollRunwayDay(state,config))} → 훈련하면 ${runway(payrollRunwayDay(state,config,preview.fee.minor))}</p>`}
    <button data-action="train" data-emp="${esc(def.id)}" aria-label="${esc(def.nameKo)} 일반 훈련" ${preview.allowed ? '' : 'disabled'}>일반 훈련</button>
    ${preview.reasonKo ? `<p class="reason">${esc(preview.reasonKo)}</p>` : ''}
  </div>`;
}

export function employeeDetail(state:GameState,config:ScenarioConfig,def:EmployeeDef,expanded:boolean):string {
  if (!config.growth) return '';
  const p=levelProgress(state,config,def.id);
  if(!p) return '';
  return `<div class="growth-detail">
    <button data-action="detail" data-emp="${esc(def.id)}" aria-expanded="${expanded}" aria-controls="growth-${esc(def.id)}">${esc(def.nameKo)} 성장 상세</button>
    <section class="employee-detail" id="growth-${esc(def.id)}" role="region" aria-labelledby="growth-h-${esc(def.id)}" ${expanded ? '' : 'hidden'}>
      <h3 id="growth-h-${esc(def.id)}" tabindex="-1">${esc(def.nameKo)} 성장 기록</h3>
      <p>레벨 ${p.level} · ${esc(xpProgressKo(p))}</p>
      <dl class="growth-stats">${Object.entries(STAT_NAMES_KO).map(([id,name])=>`<div><dt>${name}${def.growth?.primaryStat===id ? ' (주능력)' : def.growth?.secondaryStat===id ? ' (부능력)' : ''}</dt><dd>${p.stats?.[id] ?? '미정'}</dd></div>`).join('')}</dl>
      ${trainingBlock(state,config,def)}
    </section>
  </div>`;
}

/** 새 보상 키만 읽어 재그리기·저장 재개가 같은 경험치를 다시 알리지 않게 한다. */
export function growthMessages(before:GameState,after:GameState,config:ScenarioConfig):string[] {
  if(!config.growth) return [];
  return config.employees.flatMap((def)=>{
    const old=levelProgress(before,config,def.id), now=levelProgress(after,config,def.id);
    if(!old || !now) return [];
    const messages:string[]=[];
    const snapshot=structuredClone(before);
    let step=old;
    while(step.nextLevelXp !== null && step.nextLevelXp<=now.xp) {
      snapshot.employees.find((e)=>e.id===def.id)!.xp=step.nextLevelXp;
      const previous=step;
      step=levelProgress(snapshot,config,def.id)!;
      const gains=gainsKo(previous.stats,step.stats);
      messages.push(`${def.nameKo} 레벨 ${step.level} 달성${gains ? ` (${gains})` : ''}`);
    }
    const amount=Object.entries(after.xpAwardAmounts)
      .filter(([key])=>key.startsWith(`${def.id}|`) && !before.xpAwards[key])
      .reduce((sum,[,xp])=>sum+xp,0);
    if(amount>0)messages.push(`${def.nameKo} +${amount} 경험치`);
    return messages;
  });
}

export function growthStatus(messages:string[]):string {
  return messages.length ? `<div class="growth-notices" role="status">${messages.map((message)=>`<p>${esc(message)}</p>`).join('')}</div>` : '';
}
