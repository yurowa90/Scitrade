// 새 게임과 저장 읽기는 같은 화면 초기값을 사용한다. 게임 상태는 엔진만 소유한다.
import { loadScenario, SCENARIO_IDS, type ScenarioId } from '../content/scenario';
import { commitDay, openDay } from '../engine/engine';
import { deserializeSave, SaveError } from '../engine/save';
import type { Command, CommitPlan, GameState, ScenarioConfig } from '../engine/types';
import type { CrewFilter } from './recruitment';

export function initialUiState() {
  return {
    pending: [] as Command[], flash: null as { kind: 'info' | 'warn'; text: string; action?: 'culture-result' } | null,
    selectedCard: null as string | null, crewFilter: 'all' as CrewFilter,
    interviewId: null as string | null, recruitSelections: {} as Record<string, string>,
    plans: {} as Record<string, CommitPlan>, touchedPlans: new Set<string>(),
    detailId: null as string | null, growthNotices: [] as string[], growthNoticesDay: null as number | null, growthNoticesFresh: false,
    cultureOpen: false, cultureActivityId: null as string | null, cultureEmployeeId: null as string | null, cultureBookOpen: false,
    cultureSeenDay: null as number | null, cultureShowFromDay: null as number | null,
    cultureTabTop: null as number | null, cultureResultFresh: false,
  };
}

export function loadSaveText(text: string): { config: ScenarioConfig; state: GameState } | { errorKo: string } {
  try {
    let peek: { scenarioId?: string } | null;
    try { peek = JSON.parse(text); } catch { throw new SaveError('저장 파일을 읽을 수 없습니다 (JSON 형식 오류).'); }
    if (!peek?.scenarioId || !(SCENARIO_IDS as readonly string[]).includes(peek.scenarioId)) {
      throw new SaveError('이 시제품의 시나리오 저장이 아닙니다.');
    }
    const config = loadScenario(peek.scenarioId as ScenarioId);
    const loaded = deserializeSave(text, { config, dataVersion: config.dataVersion, rulesVersion: config.rules.rulesVersion });
    return { config, state: openDay(loaded, config).state };
  } catch (error) {
    return { errorKo: error instanceof Error ? error.message : '불러오기에 실패했습니다.' };
  }
}

/** 확정과 다음 날 열기가 모두 성공한 뒤에만 호출자가 현재 상태를 교체한다. */
export function advanceDay(state: GameState, config: ScenarioConfig, pending: Command[]) {
  try {
    const committed = commitDay(state, config, pending);
    return { state: committed.state.phase === 'ENDED' ? committed.state : openDay(committed.state, config).state,
      results: committed.results };
  } catch (error) {
    return { errorKo: `하루 진행에 실패했습니다: ${error instanceof Error ? error.message : String(error)}` };
  }
}

type Flash = NonNullable<ReturnType<typeof initialUiState>['flash']>;
/** 대기 명령이 있거나 마지막 시작·불러오기·저장·내보내기 뒤 상태가 바뀌었는지 확인한다. */
export function hasUnsavedWork(pending: Command[], state: GameState, savedState: GameState | null): boolean {
  return pending.length > 0 || state !== savedState;
}

/** 이번 그리기에서 알릴 글. 없으면 null. */
export function nextAnnouncement(input: {
  flash: Flash | null; announcedFlash: Flash | null;
  growthFresh: boolean; growthNotices: string[]; growthDay: number | null;
}): string | null {
  const messages: string[] = [];
  if (input.flash && input.flash !== input.announcedFlash) messages.push(input.flash.text);
  if (input.growthFresh && input.growthNotices.length && input.growthDay !== null && input.flash?.action !== 'culture-result') {
    messages.push(`${input.growthDay}일 하루 진행 — 경험치·레벨 변화: ${input.growthNotices.join(', ')}`);
  }
  return messages.length ? messages.join(' ') : null;
}

/** 같은 글을 다시 알릴 때도 내용이 바뀌게 끝에 줄바꿈 없는 공백을 붙였다 뗀다. */
export function liveRegionText(current: string, next: string): string {
  return current === next ? next + '\u00a0' : next;
}
