// 영입 화면의 읽기 전용 정보. 경제 상태와 명령 허용 여부는 엔진에서 가져온다.
import characters from '../../data/characters.json';
import venues from '../../data/venues.json';
import { cityName } from '../engine/catalog';
import { employedDefs } from '../engine/employees';
import { formatMoney } from '../engine/money';
import { contractProgress } from '../engine/progress';
import { fundsPosition, runningTaskOf } from '../engine/reservations';
import type { CandidateState, Command, CommandResult, EmployeeDef, GameState, ScenarioConfig, Task } from '../engine/types';
import { crewCard, roleBadge } from './card';

import { levelProgress } from '../engine/growth';
import { crewStatusKo, taskSchedule } from './crew-status';
export { taskSchedule } from './crew-status';
import { esc } from './html';
export const venueTitle = (id: string) => venues.items.find((v) => v.id === id)?.title_ko ?? id;
export const species = (id: string) => characters.items.find((c) => c.id === id)?.species_ko ?? '';

/** 대기 명령을 반영한 planState도 같은 기록 구조를 사용한다. */
export function batchUnlocked(state: GameState): boolean {
  const applied = Object.values(state.processedCommands).filter((r) => r.status === 'APPLIED' && r.day <= state.day);
  return applied.some((r) => r.type === 'ASSIGN_TASK') && applied.some((r) => r.type === 'BOOK_SAILING');
}

export function candidateLabel(s: GameState, c: CandidateState, config?: ScenarioConfig): string {
  const t = s.tasks.find((t) => t.id === c.questTaskId);
  switch (c.stage) {
    case 'UNDISCOVERED': return '미발견';
    case 'DISCOVERED': return '발견';
    case 'QUEST_RUNNING': return `의뢰 진행 중 ${t?.progressWorkUnits ?? 0}/${t?.requiredWorkUnits ?? config?.recruitment?.questWorkUnits ?? 0}pt`;
    case 'INTERVIEW_READY': return '면담 가능';
    case 'HIRED': {
      const e = s.employees.find((e) => e.id === c.employeeId);
      return `고용됨${e && e.availableFromDay > s.day ? ` — ${e.availableFromDay}일부터 근무` : ''}`;
    }
  }
}

const beforeInterview = (c: CandidateState) => c.stage === 'DISCOVERED' || c.stage === 'QUEST_RUNNING';
const signingFeeRule = (c: CandidateState, config: ScenarioConfig) => beforeInterview(c)
  ? `<p>고용하려면 계약금(일급 ${config.recruitment?.signingFeeWageDays ?? 0}일분)이 듭니다. 금액은 면담에서 확인합니다.</p>` : '';

export type CrewFilter = 'all' | 'free' | 'busy' | 'candidate';

/** 카드와 운영표가 동일한 목록을 사용한다. 미발견 후보는 모든 필터에서 제외한다. */
export function crewEntries(s: GameState, config: ScenarioConfig, filter: CrewFilter) {
  const workingIds = new Set(employedDefs(s, config).map((e) => e.id));
  return config.employees.flatMap((def) => {
    const hired = workingIds.has(def.id);
    const candidate = hired ? undefined : s.recruitment.candidates.find((c) => c.employeeId === def.id && c.stage !== 'UNDISCOVERED');
    const task = runningTaskOf(s, def.id);
    const visible = filter === 'candidate' ? Boolean(candidate)
      : filter === 'all' ? hired || Boolean(candidate)
      : hired && ((filter === 'busy') === Boolean(task));
    return visible ? [{ def, candidate, task }] : [];
  });
}

/** 표시용 산술만 수행하며 비용 지출·허용 판정·상태 저장은 하지 않는다. */
export function interviewPreview(s: GameState, config: ScenarioConfig, e: EmployeeDef) {
  const blockers = s.contracts.flatMap((c) => contractProgress(s, config, c).blockers);
  return {
    signingFee: e.salaryPerDayMinor * (config.recruitment?.signingFeeWageDays ?? 0),
    dailyWage: e.salaryPerDayMinor,
    remainingWages: e.salaryPerDayMinor * Math.max(0, config.campaignDays - s.day),
    throughput: e.workUnitsPerDay,
    availableKrw: fundsPosition(s, config, 'KRW').available,
    unassigned: blockers.filter((b) => b.code === 'TASK_UNASSIGNED').length,
    willMiss: blockers.filter((b) => b.code === 'TASK_WILL_MISS_SAILING').length,
  };
}

export function interviewBlock(s: GameState, config: ScenarioConfig, e: EmployeeDef, check: CommandResult, expanded = true): string {
  const p = interviewPreview(s, config, e);
  const won = (n: number) => formatMoney('KRW', n);
  return `<div class="interview" id="interview-${esc(e.id)}" role="region" aria-labelledby="interview-h-${esc(e.id)}" ${expanded ? '' : 'hidden'}>
    <h4 id="interview-h-${esc(e.id)}">면담 — ${esc(e.nameKo)}</h4><dl class="interview-facts">
    <div><dt>계약금 (일급×${config.recruitment?.signingFeeWageDays})</dt><dd>${won(p.signingFee)}</dd></div>
    <div><dt>일급</dt><dd>${won(p.dailyWage)}</dd></div>
    <div><dt>남은 기간 급여 (${s.day < config.campaignDays ? `${s.day + 1}~${config.campaignDays}일` : '남은 기간 없음'})</dt><dd>${won(p.remainingWages)}</dd></div>
    <div><dt>하루 처리량</dt><dd>${p.throughput}pt</dd></div>
    <div><dt>지금 원화 사용 가능액</dt><dd>${won(p.availableKrw)}</dd></div></dl>
    <p>지금 인원으로 버티면: 준비 미배정 ${p.unassigned}건 · 출항 불참 위험 ${p.willMiss}건</p>
    <button data-action="hire" data-candidate="${esc(e.id)}" ${check.status !== 'APPLIED' ? 'disabled' : ''} aria-label="${esc(e.nameKo)} 고용">${esc(e.nameKo)} 고용</button>
    ${check.status !== 'APPLIED' ? `<p class="reason">${esc(check.reasonKo)}${p.signingFee === 0 && check.reasonKo.startsWith('영입 계약금 자금이 부족합니다.') && fundsPosition(s, config, 'KRW').unpaidObligations > 0 ? ' 미지급 급여가 남아 있어 계약금이 0원이어도 고용할 수 없습니다.' : ''}</p>` : '<p class="muted small">계약금은 한 번 지급하며, 업무와 급여는 고용 다음 날부터 시작합니다.</p>'}
  </div>`;
}

export function recruitmentPanel(s: GameState, config: ScenarioConfig, selections: Record<string, string>, interviewId: string | null, check: (cmd: Command) => CommandResult): string {
  if (!config.recruitment) return '';
  const employeeSelect = (key: string, label: string, cmd: (id: string) => Command) => {
    const employees = employedDefs(s, config);
    const chosen = selections[key] ?? employees.find((e) => check(cmd(e.id)).status === 'APPLIED')?.id ?? employees[0]?.id ?? '';
    const result = check(cmd(chosen));
    return { chosen, result, html: `<label>담당 직원 <select data-action="recruit-emp" data-key="${esc(key)}" aria-label="${esc(label)} 담당 직원"><option value="" ${!chosen ? 'selected' : ''}>직원 선택</option>${employees.map((e) => `<option value="${esc(e.id)}" ${chosen === e.id ? 'selected' : ''}>${esc(e.nameKo)}${runningTaskOf(s, e.id) ? ` (${esc(crewStatusKo(runningTaskOf(s, e.id)))})` : ''}</option>`).join('')}</select></label>` };
  };
  const sites = config.recruitment.scoutSites.map((site) => {
    const title = venueTitle(site.venueId);
    const scouted = s.recruitment.scoutedVenueIds.includes(site.venueId);
    const task = s.tasks.find((t) => t.kind === 'SCOUT' && t.subjectId === site.venueId && t.status === 'RUNNING');
    const choice = employeeSelect(site.venueId, `${title} 현장 조사`, (employeeId) => ({ id: `PREVIEW-SCOUT-${site.venueId}`, type: 'SCOUT_SITE', venueId: site.venueId, employeeId }));
    return `<article class="recruit-site"><h4 id="site-h-${esc(site.venueId)}" tabindex="-1">${esc(title)}</h4><p>${scouted ? '조사 완료' : task ? esc(taskSchedule(task, config)) : '미조사'}</p>${choice.html}<button data-action="scout" data-venue="${esc(site.venueId)}" aria-label="${esc(title)} 현장 조사(${config.recruitment!.scoutWorkUnits}pt)" data-emp="${esc(choice.chosen)}" ${choice.result.status !== 'APPLIED' ? 'disabled' : ''}>현장 조사(${config.recruitment!.scoutWorkUnits}pt)</button>${choice.result.status !== 'APPLIED' ? `<p class="reason">${esc(choice.result.reasonKo)}</p>` : ''}</article>`;
  });
  const candidates = s.recruitment.candidates.filter((c) => c.stage !== 'UNDISCOVERED').map((c) => {
    const e = config.employees.find((e) => e.id === c.employeeId)!;
    const clue = characters.items.find((x) => x.id === e.id)?.recruitment.story_clue ?? '';
    const choice = employeeSelect(e.id, `${e.nameKo} 영입 의뢰`, (employeeId) => ({ id: `PREVIEW-QUEST-${e.id}`, type: 'START_RECRUIT_QUEST', candidateId: e.id, employeeId }));
    return `<article class="recruit-candidate"><h4 id="candidate-h-${esc(e.id)}" tabindex="-1">${esc(e.nameKo)} · ${esc(species(e.id))} ${roleBadge(e.role)}</h4><p>${esc(clue)}</p><p class="pill">${esc(candidateLabel(s, c, config))}</p>
      ${signingFeeRule(c, config)}
      ${c.stage === 'DISCOVERED' ? `${choice.html}<button aria-label="${esc(e.nameKo)} 영입 의뢰(${config.recruitment!.questWorkUnits}pt)" data-action="recruit-quest" data-candidate="${esc(e.id)}" data-emp="${esc(choice.chosen)}" ${choice.result.status !== 'APPLIED' ? 'disabled' : ''}>영입 의뢰(${config.recruitment!.questWorkUnits}pt)</button>${choice.result.status !== 'APPLIED' ? `<p class="reason">${esc(choice.result.reasonKo)}</p>` : ''}` : ''}
      ${c.stage === 'INTERVIEW_READY' ? `<button aria-label="${esc(e.nameKo)} 면담" aria-expanded="${interviewId === e.id}" aria-controls="interview-${esc(e.id)}" data-action="interview" data-candidate="${esc(e.id)}">${esc(e.nameKo)} 면담</button>${interviewBlock(s, config, e, check({ id: `PREVIEW-HIRE-${e.id}`, type: 'HIRE_CANDIDATE', candidateId: e.id }), interviewId === e.id)}` : ''}</article>`;
  });
  return `<section class="recruitment" aria-labelledby="recruit-h"><h3 id="recruit-h">부산 동료 영입</h3>${sites.join('')}<p class="muted">미발견 후보 ${s.recruitment.candidates.filter((c) => c.stage === 'UNDISCOVERED').length}명</p>${candidates.join('')}</section>`;
}

/** 카드와 운영표 모두 공개된 동료 목록만 전달받는다. */
export function candidateCard(e: EmployeeDef, s: GameState, c: CandidateState, selected: boolean, config: ScenarioConfig): string {
  const status = esc(candidateLabel(s, c, config));
  return `<article class="card ${selected ? 'is-selected' : ''}" data-action="select-card" data-emp="${esc(e.id)}" tabindex="0" aria-label="${esc(e.nameKo)} 후보 카드, ${status}"><h3>${esc(e.nameKo)} · ${esc(species(e.id))}</h3>${roleBadge(e.role)}<p>${status}</p><p>하루 ${e.workUnitsPerDay}pt${beforeInterview(c) ? '' : ` · 일급 ${formatMoney('KRW', e.salaryPerDayMinor)}`}</p>${signingFeeRule(c, config)}<p class="muted small">그림 미제작</p></article>`;
}
export function crewRow(e: EmployeeDef, s: GameState, config: ScenarioConfig, selected: boolean, candidate?: CandidateState, task?: Task): string {
  const loc = s.employees.find((x) => x.id === e.id)?.locationCityId;
  const location = cityName(config, loc ?? null);
  return `<tr class="${selected ? 'is-selected' : ''}" data-action="select-card" data-emp="${esc(e.id)}" tabindex="0" aria-selected="${selected}"><th scope="row"><span class="nm">${esc(e.nameKo)}</span>${roleBadge(e.role)}${config.growth && !candidate ? `<small>레벨 ${levelProgress(s,config,e.id)?.level ?? 1}</small>` : ''}</th><td>${candidate ? esc(candidateLabel(s, candidate, config)) : task ? `${esc(crewStatusKo(task))}<small>${esc(taskSchedule(task, config))}</small>` : '○ 대기<small>배정 가능</small>'}<small>${esc(location)}</small></td><td class="num">${e.workUnitsPerDay}pt/일<small>${candidate && beforeInterview(candidate) ? '일급은 면담에서 확인' : formatMoney('KRW', e.salaryPerDayMinor)}</small></td></tr>`;
}

/** 실제 화면과 시험이 같은 카드 선택 경로를 쓴다. */
export function crewEntryCard(entry: ReturnType<typeof crewEntries>[number], s: GameState, config: ScenarioConfig, selected: boolean): string {
  const { def, candidate, task } = entry;
  return candidate ? candidateCard(def, s, candidate, selected, config)
    : crewCard(def, s, selected, config, task ? taskSchedule(task, config) : undefined);
}
