// 화면용 읽기 함수. 사본에 명령을 계획하며 입력 상태·설정을 바꾸지 않는다.
import { cultureKeys } from './culture';
import { isAvailableFromToday } from './employees';
import { planState } from './engine';
import { levelFor, statsFor } from './growth';
import { cashLessUnpaidMinor, runningTaskOf, fundsPosition, trainingAvailableMinor } from './reservations';
import type { GameState, ScenarioConfig } from './types';

export const CULTURE_UNCHANGED_KO = '가격·하루 처리량·운임·관세·거래 신뢰';

export function trainingPreview(state: GameState, config: ScenarioConfig, employeeId: string) {
  const training = config.growth?.ordinaryTraining;
  const currency = training?.currency ?? config.payrollCurrency;
  const fee = { currency, minor: training?.feeMinor ?? 0 };
  const availableBeforeMinor = trainingAvailableMinor(state, config, currency);
  // 실제 명령 ID와 충돌하지 않는 사본 전용 ID를 고른다.
  let id = 'TRAINING-PREVIEW';
  while (state.processedCommands[id]) id += '-';
  const phaseReason = state.phase === 'PENDING_OPEN' ? '하루를 연 뒤에 훈련을 시작할 수 있습니다.'
    : state.phase === 'ENDED' ? '캠페인이 끝났습니다.' : null;
  const result = phaseReason === null
    ? planState(state, config, [{ id, type: 'START_TRAINING', employeeId }]).results[0]!
    : { status: 'REJECTED', reasonKo: phaseReason };
  const allowed = result.status === 'APPLIED';
  const employee = state.employees.find((e) => e.id === employeeId);
  const xpGain = employee ? training?.xpOnCompletion ?? 0 : 0;
  const xpAfter = employee ? employee.xp + xpGain : null;
  const def = config.employees.find((e) => e.id === employeeId);
  // 거절 상태에서도 조건을 갖췄을 때의 비용·성장 결과를 비교할 수 있게 한다.
  return { allowed, reasonKo: allowed ? null : result.reasonKo, fee,
    durationDays: training?.durationDays ?? 0, xpGain, levelAfter: xpAfter === null ? null : levelFor(xpAfter),
    statsAfter: def && xpAfter !== null ? statsFor(def, xpAfter) : null,
    availableBeforeMinor, availableAfterMinor: availableBeforeMinor - fee.minor };
}

/** 급여 통화의 현금에서 미지급 의무와 추가 지출을 한 번씩 뺀 뒤 급여를 완납할 마지막 날.
 * 계약 자금 예약은 빼지 않는다. 잔액이 정확히 0이 되는 날까지 포함하며 캠페인 끝까지 가능하면 null이다.
 * 오늘 급여도 못 내면 state.day - 1을 반환한다(1일이면 0).
 */
export function payrollRunwayDay(state: GameState, config: ScenarioConfig, extraOutlayMinor = 0): number | null {
  const funds = fundsPosition(state, config, config.payrollCurrency);
  let available = funds.cash - funds.unpaidObligations - extraOutlayMinor;
  for (let day = state.day; day <= config.campaignDays; day++) {
    const wages = state.employees.filter((e) => e.employmentStatus === 'employed' && e.availableFromDay <= day)
      .reduce((sum, e) => {
        const def = config.employees.find((d) => d.id === e.id);
        return sum + (def?.salaryCurrency === config.payrollCurrency ? def.salaryPerDayMinor : 0);
      }, 0);
    available -= wages;
    if (available < 0) return day - 1;
  }
  return null;
}

/** 실제 시작 명령과 같은 검사를 사본에서 수행한다. 거절되어도 지출 시의 비교값을 제공한다. */
export function culturePreview(state: GameState, config: ScenarioConfig, activityId: string, employeeId: string) {
  const activity = config.culture?.activities.find((a) => a.id === activityId);
  const currency = activity?.currency ?? config.payrollCurrency;
  const cost = { currency, minor: activity?.costMinor ?? 0 };
  let id = 'CULTURE-PREVIEW';
  while (state.processedCommands[id]) id += '-';
  const phaseReason = state.phase === 'PENDING_OPEN' ? '하루를 연 뒤에 현지 활동을 시작할 수 있습니다.'
    : state.phase === 'ENDED' ? '캠페인이 끝났습니다.' : null;
  const result = phaseReason === null
    ? planState(state, config, [{ id, type: 'START_CULTURE_ACTIVITY', activityId, employeeId }]).results[0]!
    : { status: 'REJECTED', reasonKo: phaseReason };
  const allowed = result.status === 'APPLIED';
  const availableBeforeMinor = cashLessUnpaidMinor(state, config, currency);
  const keys = activity ? cultureKeys(config, activity, employeeId) : null;
  const hasExperience = keys !== null && state.culture.experiences.some((e) => e.key === keys.actorExperience);
  const xpKey = `${employeeId}|CULTURE-FIRST-${activityId}|CULTURE_FIRST_XP`;
  const hasGrowth = config.growth && config.employees.find((e) => e.id === employeeId)?.growth
    && state.employees.some((e) => e.id === employeeId && e.employmentStatus === 'employed');
  return { allowed, reasonKo: allowed ? null : result.reasonKo, cost, durationDays: activity?.durationDays ?? 0,
    busyFromDay: activity ? state.day : null,
    busyUntilDay: activity ? state.day + activity.durationDays - 1 : null,
    availableBeforeMinor, availableAfterMinor: availableBeforeMinor - cost.minor,
    payrollRunwayBefore: payrollRunwayDay(state, config),
    payrollRunwayAfter: payrollRunwayDay(state, config, currency === config.payrollCurrency ? cost.minor : 0),
    waitingTasks: state.tasks.filter((t) => t.cityId === activity?.cityId && t.status === 'QUEUED' && t.assignedEmployeeId === null)
      .map((task) => ({ task: structuredClone(task), reservedDepartureDay: state.bookings.find((b) =>
        b.contractId === task.contractId && b.status === 'BOOKED')?.departureDay ?? null })),
    otherFreeLocalEmployeeIds: state.employees.filter((e) => e.id !== employeeId && e.locationCityId === activity?.cityId
      && isAvailableFromToday(state, e.id) && !runningTaskOf(state, e.id)).map((e) => e.id),
    newRecords: {
      companyReport: keys && state.culture.reports.some((r) => r.key === keys.companyReport) ? 'EXISTS' as const : 'NEW' as const,
      actorExperience: activity !== undefined && !hasExperience,
      relationContactIds: activity?.contactIds.filter((id) => !state.culture.relationEvents.some((r) => r.key === keys!.relationship(id))) ?? [],
      firstCompletionXp: activity && hasGrowth && !state.xpAwards[xpKey] ? config.growth!.taskCompletionXp : 0,
    },
    unchangedKo: CULTURE_UNCHANGED_KO,
  };
}
