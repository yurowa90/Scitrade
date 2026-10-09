import { isAvailableFromToday } from './employees';
import { runningTaskOf } from './reservations';
import { isDayBasedTask } from './tasks';
import type { GameState, ScenarioConfig, Task } from './types';

export type TaskUnit = 'WORK_UNITS' | 'DAYS';

export interface EmployeeCapacity {
  employeeId: string;
  cityId: string;
  workUnitsPerDay: number;
  running: { taskId: string; kind: Task['kind']; unit: TaskUnit; remaining: number } | null;
}

export interface CityWorkload {
  cityId: string;
  unassignedWorkUnits: number;
  unassignedTaskIds: string[];
  runningWorkUnits: number;
  staffWorkUnitsPerDay: number;
  dayTaskWorkUnitsPerDay: number;
  idleWorkUnitsPerDay: number;
  daysToClear: number | null;
}

export interface WorkloadSummary {
  day: number;
  byCity: CityWorkload[];
  employees: EmployeeCapacity[];
  startingLater: { employeeId: string; availableFromDay: number; workUnitsPerDay: number }[];
}

/**
 * LEGACY_FIXED 처리량으로 비교한다. 한 사람은 한 번에 업무 하나만 맡으므로
 * daysToClear보다 실제 완료가 늦을 수 있다. 일수 업무는 포인트 업무량과 섞지 않는다.
 */
export function workloadSummary(s: GameState, config: ScenarioConfig): WorkloadSummary {
  const cities = new Map<string, CityWorkload>();
  const city = (cityId: string): CityWorkload => {
    let row = cities.get(cityId);
    if (!row) {
      row = { cityId, unassignedWorkUnits: 0, unassignedTaskIds: [], runningWorkUnits: 0,
        staffWorkUnitsPerDay: 0, dayTaskWorkUnitsPerDay: 0, idleWorkUnitsPerDay: 0, daysToClear: 0 };
      cities.set(cityId, row);
    }
    return row;
  };
  const employees: EmployeeCapacity[] = [];
  const startingLater: WorkloadSummary['startingLater'] = [];
  for (const def of config.employees) {
    const emp = s.employees.find((e) => e.id === def.id);
    if (!emp || emp.employmentStatus !== 'employed') continue;
    const row = city(emp.locationCityId);
    if (!isAvailableFromToday(s, emp.id)) {
      startingLater.push({ employeeId: emp.id, availableFromDay: emp.availableFromDay, workUnitsPerDay: def.workUnitsPerDay });
      continue;
    }
    const task = runningTaskOf(s, emp.id);
    employees.push({ employeeId: emp.id, cityId: emp.locationCityId, workUnitsPerDay: def.workUnitsPerDay,
      running: task ? { taskId: task.id, kind: task.kind, unit: isDayBasedTask(task.kind) ? 'DAYS' : 'WORK_UNITS',
        remaining: task.requiredWorkUnits - task.progressWorkUnits } : null });
    row.staffWorkUnitsPerDay += def.workUnitsPerDay;
    if (task && isDayBasedTask(task.kind)) row.dayTaskWorkUnitsPerDay += def.workUnitsPerDay;
    if (!task) row.idleWorkUnitsPerDay += def.workUnitsPerDay;
  }
  for (const task of s.tasks) {
    const row = city(task.cityId);
    if (isDayBasedTask(task.kind)) continue;
    const remaining = task.requiredWorkUnits - task.progressWorkUnits;
    if (task.status === 'QUEUED' && task.assignedEmployeeId === null) {
      row.unassignedWorkUnits += remaining;
      row.unassignedTaskIds.push(task.id);
    } else if (task.status === 'RUNNING' && task.assignedEmployeeId !== null) row.runningWorkUnits += remaining;
  }
  for (const row of cities.values()) {
    const work = row.unassignedWorkUnits + row.runningWorkUnits;
    const capacity = row.staffWorkUnitsPerDay - row.dayTaskWorkUnitsPerDay;
    row.daysToClear = work === 0 ? 0 : capacity === 0 ? null : Math.ceil(work / capacity);
  }
  return { day: s.day, byCity: [...cities.values()].sort((a, b) => a.cityId < b.cityId ? -1 : a.cityId > b.cityId ? 1 : 0), employees, startingLater };
}
