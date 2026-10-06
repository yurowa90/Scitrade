// 새 게임과 저장 읽기는 같은 화면 초기값을 사용한다. 게임 상태는 엔진만 소유한다.
import { loadScenario, SCENARIO_IDS, type ScenarioId } from '../content/scenario';
import { commitDay, openDay } from '../engine/engine';
import { deserializeSave, SaveError } from '../engine/save';
import type { Command, CommitPlan, GameState, ScenarioConfig } from '../engine/types';
import type { CrewFilter } from './recruitment';

export function initialUiState() {
  return {
    pending: [] as Command[], flash: null as { kind: 'info' | 'warn'; text: string } | null,
    selectedCard: null as string | null, crewFilter: 'all' as CrewFilter,
    interviewId: null as string | null, recruitSelections: {} as Record<string, string>,
    plans: {} as Record<string, CommitPlan>, touchedPlans: new Set<string>(),
    detailId: null as string | null, growthNotices: [] as string[], growthNoticesDay: null as number | null, growthNoticesFresh: false,
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
