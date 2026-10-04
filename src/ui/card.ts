// 동료 카드 자리표시자. 실제 일러스트가 생기면 .card-art 안의 내용만 교체한다.
// 구도(상단 이름·속성, 중앙 그림, 하단 레벨·일정)는 docs/ART_DIRECTION.md를 따르며 레퍼런스의 프레임·배지·이름은 쓰지 않는다.

import type { EmployeeDef, GameState } from '../engine/types';

const ATTRIBUTE: Record<string, { ko: string; icon: string }> = {
  water: { ko: '물', icon: '<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/>' },
  fire: { ko: '불', icon: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 2 3 1 0-2-1-4 0-6z"/>' },
  wind: { ko: '바람', icon: '<path d="M4 9h11a3 3 0 1 0-3-3M4 14h14a3 3 0 1 1-3 3M4 19h7" fill="none" stroke-width="2.2" stroke-linecap="round"/>' },
  earth: { ko: '대지', icon: '<path d="M4 18l5-9 3 5 2-3 6 7z"/>' },
  light: { ko: '빛', icon: '<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>' },
  shadow: { ko: '그림자', icon: '<path d="M15 3a9 9 0 1 0 6 15A8 8 0 0 1 15 3z"/>' },
};

const ROLE_KO: Record<string, string> = { sales: '영업', operations: '운영' };

export function attributeChip(attribute: string | null): string {
  const a = attribute ? ATTRIBUTE[attribute] : undefined;
  if (!a) return '<span class="chip">속성 미정</span>';
  return `<span class="chip attr attr-${attribute}"><svg viewBox="0 0 24 24" aria-hidden="true">${a.icon}</svg>${a.ko}</span>`;
}

export function crewCard(def: EmployeeDef, state: GameState, selected: boolean): string {
  const running = state.tasks.find((t) => t.status === 'RUNNING' && t.assignedEmployeeId === def.id);
  const schedule = running
    ? `수출 준비 중 ${running.progressWorkUnits}/${running.requiredWorkUnits}`
    : '대기 — 배정 가능';
  const initial = def.nameKo.slice(0, 1);
  const roleKo = ROLE_KO[def.role] ?? def.role;
  return `
  <article class="card attr-bg-${def.character.attribute ?? 'none'} ${selected ? 'is-selected' : ''}" data-action="select-card" tabindex="0"
    aria-label="${def.nameKo} 직원 카드, ${roleKo}, 레벨 1, ${schedule}">
    <header class="card-top">
      <span class="card-name">${def.nameKo}</span>
      ${attributeChip(def.character.attribute)}
    </header>
    <div class="card-art">
      <span class="card-tag ${running ? 'busy' : ''}">${running ? '업무 중' : '대기'}</span>
      <div class="card-face" aria-hidden="true">${initial}</div>
      <p class="card-motif">${def.character.visualMotif ?? ''}</p>
      <span class="card-placeholder">그림 미제작 · 교체 가능한 자리표시자</span>
    </div>
    <footer class="card-bottom">
      <div class="card-meta"><span class="chip">${roleKo}</span><span class="muted">${def.id}</span><span class="card-level">레벨 1 · 강화 +0</span></div>
      <span class="card-schedule">${schedule}</span>
    </footer>
  </article>`;
}
