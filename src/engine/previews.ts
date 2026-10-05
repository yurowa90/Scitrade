// 화면용 읽기 함수. 사본에 명령을 계획하며 입력 상태·설정을 바꾸지 않는다.
import { planState } from './engine';
import { levelFor, statsFor } from './growth';
import { fundsPosition } from './reservations';
import type { GameState, ScenarioConfig } from './types';

export function trainingPreview(state: GameState, config: ScenarioConfig, employeeId: string) {
  const training = config.growth?.ordinaryTraining;
  const currency = training?.currency ?? config.payrollCurrency;
  const fee = { currency, minor: training?.feeMinor ?? 0 };
  const funds = fundsPosition(state, config, currency);
  const availableBeforeMinor = funds.cash - funds.unpaidObligations;
  // 실제 명령 ID와 충돌하지 않는 사본 전용 ID를 고른다.
  let id = 'TRAINING-PREVIEW';
  while (state.processedCommands[id]) id += '-';
  const result = planState(state, config, [{ id, type: 'START_TRAINING', employeeId }]).results[0]!;
  const allowed = result.status === 'APPLIED';
  const xpGain = training?.xpOnCompletion ?? 0;
  const xpAfter = (state.employees.find((e) => e.id === employeeId)?.xp ?? 0) + xpGain;
  const def = config.employees.find((e) => e.id === employeeId);
  // 거절 상태에서도 조건을 갖췄을 때의 비용·성장 결과를 비교할 수 있게 한다.
  return { allowed, reasonKo: allowed ? null : result.reasonKo, fee,
    durationDays: training?.durationDays ?? 0, xpGain, levelAfter: levelFor(xpAfter),
    statsAfter: def ? statsFor(def, xpAfter) : null,
    availableBeforeMinor, availableAfterMinor: availableBeforeMinor - fee.minor };
}

/** 현재 자금으로 급여를 끝까지 낼 마지막 날. 캠페인 끝까지 가능하면 null이다. */
export function payrollRunwayDay(state: GameState, config: ScenarioConfig, extraOutlayMinor = 0): number | null {
  const funds = fundsPosition(state, config, config.payrollCurrency);
  let available = funds.cash - funds.unpaidObligations - extraOutlayMinor;
  for (let day = state.day; day <= config.campaignDays; day++) {
    if (state.closedDays.includes(day)) continue;
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
