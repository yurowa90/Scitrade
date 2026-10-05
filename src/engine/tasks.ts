import type { ScenarioConfig, Task } from './types';

/** 플레이어가 읽는 업무 대상. 훈련은 담당 직원이 이미 문장의 주어다. */
export function taskSubjectKo(config: ScenarioConfig, task: Task): string | null {
  switch (task.kind) {
    case 'SCOUT': return config.recruitment?.scoutSites.find((s) => s.venueId === task.subjectId)?.titleKo ?? null;
    case 'RECRUIT_QUEST': return config.employees.find((e) => e.id === task.subjectId)?.nameKo ?? null;
    case 'TRAINING': return null;
    default: return task.contractId;
  }
}
