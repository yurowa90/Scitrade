// 저장 복원과 마감이 함께 쓰는 운영 규칙 검사. 경제 값은 수정하지 않는다.
import { storageUsedLiters, storageCapacityLiters, handlingCapacityPt, fixedCostsDue } from './operations';
import { summarize } from './ledger';
import { MINOR_PER_MAJOR } from './money';
import type { GameState, ScenarioConfig } from './types';

export function operationsProblems(s: GameState, config: ScenarioConfig, closing: boolean): string[] {
  const problems: string[] = [];
  if ((s.operations !== null) !== (config.operations !== null)) problems.push('설정과 상태의 operations 유무가 다릅니다');
  const o = s.operations, c = config.operations;
  if (!o || !c) return problems;
  if (storageUsedLiters(s, config) > storageCapacityLiters(s, config)) problems.push('보관량이 창고 보관 한도를 넘었습니다');
  const lastClosed = closing ? s.day : Math.max(0, ...s.closedDays);
  for (const row of o.handlingLog) {
    if (row.day > lastClosed || row.usedPt < 0 || row.usedPt > row.capacityPt || row.capacityPt !== handlingCapacityPt(s, config, row.day)) problems.push('창고 처리량이 하루 처리 한도를 넘었습니다');
    for (const a of row.waits) {
      const t = s.tasks.find((t) => t.id === a.taskId);
      const e = config.employees.find((e) => e.id === t?.assignedEmployeeId);
      if (!t || !e || a.wantPt > e.workUnitsPerDay || a.gotPt > a.wantPt || a.gotPt < 0) problems.push('업무별 창고 배분량이 직원 처리량을 넘었습니다');
    }
  }
  const visibleDay = o.outcome === 'FAILED' ? o.failure?.day ?? lastClosed : closing ? s.day + 1 : s.day;
  const publish = c.market.publish;
  const expectedCount = Math.max(0, Math.floor((Math.min(visibleDay, publish.lastDay) - publish.firstDay) / publish.intervalDays) + 1);
  if (o.batches.length !== expectedCount || o.batches.some((b, i) => b.k !== i || b.publishDay !== publish.firstDay + i * publish.intervalDays || b.publishDay > visibleDay)
    || o.offers.some((v) => v.publishDay > visibleDay || !o.batches.some((b) => b.k === v.batchK && b.publishDay === v.publishDay && b.offerIds.includes(v.id)))) problems.push('공개 묶음·견적에 미래 공개 또는 누락이 있습니다');
  const allIds = [...config.offers, ...o.offers].map((v) => v.id);
  if (new Set(allIds).size !== allIds.length || new Set(s.offers.map((v) => v.id)).size !== s.offers.length) problems.push('생성 견적 ID는 유일해야 합니다');
  if (s.offers.length !== allIds.length || allIds.some((id) => !s.offers.some((v) => v.id === id))
    || o.batches.flatMap((b) => b.offerIds).some((id) => !allIds.includes(id))) problems.push('공개 묶음과 견적 정의·상태가 다릅니다');
  for (const fx of o.exchanges) {
    const usd = s.ledger.entries.filter((e) => e.id === `${fx.id}-USD` && e.currency === 'USD');
    const krw = s.ledger.entries.filter((e) => e.id === `${fx.id}-KRW` && e.currency === 'KRW');
    const transfer = (entries: typeof usd) => entries.flatMap((e) => e.lines).filter((l) => l.account === 'CURRENCY_TRANSFER').reduce((sum, l) => sum + l.amount, 0);
    if (usd.length !== 1 || krw.length !== 1 || transfer(usd) * c.fx.baseKrwPerUsd / MINOR_PER_MAJOR.USD !== -transfer(krw)) problems.push('환전 분개 짝 또는 통화 간 이체가 다릅니다');
  }
  for (const currency of new Set(s.ledger.entries.map((e) => e.currency))) {
    const b = summarize(s.ledger, currency);
    if (b.totalAssets - b.accountsPayable !== b.openingEquity + b.profit + b.currencyTransferNet) problems.push(`${currency} 통화별 순자산 항등식이 다릅니다`);
  }
  for (let day = 1; day <= lastClosed; day++) {
    for (const cost of fixedCostsDue(s, config, day)) {
      if (s.ledger.entries.filter((e) => e.id === cost.id && e.currency === cost.currency && e.day === day).length !== 1) problems.push(`${cost.id}: 고정비 분개 중복 또는 누락`);
    }
  }
  const failure = o.failure;
  const cause = failure && s.obligations.find((ob) => ob.id === failure.obligationId);
  const failed = s.phase === 'ENDED' && failure !== null && cause?.paidDay === null && cause.incurredDay + c.paymentDefault.failureAgeDays <= failure.day
    && failure.incurredDay === cause.incurredDay && failure.amountMinor === cause.amountMinor && failure.currency === cause.currency
    && failure.day === lastClosed;
  if ((o.outcome === 'FAILED') !== !!failed || (o.outcome !== 'FAILED' && failure !== null)
    || (o.outcome === 'IN_PROGRESS' && s.phase === 'ENDED')
    || (o.outcome === 'COMPLETED' && (s.phase !== 'ENDED' || !s.closedDays.includes(config.campaignDays)))) problems.push('캠페인 실패·완료 표시가 상태와 다릅니다');
  if (o.expansions.length > c.facility.expansion.maxCount || o.expansions.some((e) => e.effectiveDay !== e.orderedDay + c.facility.expansion.effectiveAfterDays)) problems.push('창고 확장 횟수 또는 효력일 오류');
  if (new Set(o.spaceContracts.map((v) => v.routeId)).size !== o.spaceContracts.length) problems.push('선복 계약은 노선당 한 건이어야 합니다');
  return problems;
}
