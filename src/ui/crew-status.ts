import { taskSubjectKo } from '../engine/tasks';
import type { ScenarioConfig, Task } from '../engine/types';

export function taskSchedule(t: Task, config: ScenarioConfig): string {
  const name = { TRAINING: '일반 훈련', SCOUT: '현장 조사', RECRUIT_QUEST: '영입 의뢰', EXPORT_PREP: '수출 준비', FORWARDING_PREP: '주선 준비' }[t.kind];
  const subject = taskSubjectKo(config, t);
  return `${name} 중 — ${subject ? `${subject} ` : ''}${t.progressWorkUnits}/${t.requiredWorkUnits}${t.kind === 'TRAINING' ? '일' : 'pt'}`;
}

export function crewNoteKo(config: ScenarioConfig): string {
  return config.growth
    ? '레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 Npt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다.'
    : '처리량은 고정값(LEGACY_FIXED)을 씁니다. 능력·속성·시너지는 이후 단계에서 켭니다.';
}

/** 모든 직원 표시가 같은 글자와 기호로 근무·교육을 구분한다. */
export function crewStatusKo(task?: Task): string {
  if (!task) return '○ 대기';
  return task.kind === 'TRAINING' ? `◆ 교육 중 ${task.progressWorkUnits}/${task.requiredWorkUnits}일` : '● 업무 중';
}
