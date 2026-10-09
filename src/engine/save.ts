// 저장 파일: 게임 상태(일자 단계·처리한 명령 ID·적용한 사건 ID·난수 커서 포함)와 판본 정보.
// 다른 규칙·데이터 판본의 저장은 조용히 이어 쓰지 않고 거절한다.
// 저장 형식이 바뀌면 판본을 올리고, 이전 판본은 명시한 이관 함수로만 읽는다.

import { loadScenario, SCENARIO_IDS, type ScenarioId } from '../content/scenario';
import { ENGINE_VERSION, SUPPORTED_RULES_VERSIONS, type GameState, type ScenarioConfig } from './types';

import { checkSaveShape } from './save-shape';
import { checkInvariants } from './invariants';

export const SAVE_FORMAT = 'scitrade-save';
/**
 * 1: M1 (계약은 직접 무역뿐, 화물은 회사 소유뿐).
 * 2: M2a (운송 주선 계약 `serviceOfferId`, 화물 소유자 `ownerPartyId` 추가).
 * 3: 영입 후보 상태·근무 시작일·업무 대상 추가.
 * 4: 직원 누적 경험치·보상 중복 방지 키·지급액 추가.
 * 5: 현지 활동 기록(culture) 추가.
 */
export const SAVE_FORMAT_VERSION = 5;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  formatVersion: number;
  engineVersion: string;
  rulesVersion: string;
  dataVersion: string;
  scenarioId: string;
  state: GameState;
}

export class SaveError extends Error {}

export function serializeSave(state: GameState): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    engineVersion: ENGINE_VERSION,
    rulesVersion: state.meta.rulesVersion,
    dataVersion: state.meta.dataVersion,
    scenarioId: state.meta.scenarioId,
    state,
  };
  return JSON.stringify(file);
}

/**
 * 판본 1 → 2 이관. M1 저장에는 운송 주선이 없으므로 새 필드를 ‘해당 없음’으로 채운다.
 * 경제 값(장부·화물 수량·일정)은 바꾸지 않는다.
 */
function migrateV1toV2(state: GameState): GameState {
  const s = structuredClone(state) as GameState & {
    contracts: (GameState['contracts'][number] & { serviceOfferId?: string | null })[];
    cargoLots: (GameState['cargoLots'][number] & { ownerPartyId?: string | null })[];
  };
  for (const c of s.contracts) if (c.serviceOfferId === undefined) c.serviceOfferId = null;
  for (const l of s.cargoLots) if (l.ownerPartyId === undefined) l.ownerPartyId = null;
  return s;
}

/** 판본 2 → 3: 기존 고용·경제 값은 유지하고 영입 후보를 소급 생성하지 않는다. */
export function migrateV2toV3(state: GameState): GameState {
  const s = structuredClone(state);
  for (const emp of s.employees) emp.availableFromDay = 1;
  for (const task of s.tasks) task.subjectId = null;
  s.recruitment = { candidates: [], scoutedVenueIds: [] };
  return s;
}

/** 판본 3 → 4: 과거 업무에 소급 보상하지 않고 직원 정의의 시작 경험치를 사용한다. */
export function migrateV3toV4(state: GameState, config: ScenarioConfig): GameState {
  const s = structuredClone(state);
  for (const emp of s.employees) {
    const def = config.employees.find((e) => e.id === emp.id);
    if (!def) throw new SaveError(`${emp.id}: 경험치 이관에 필요한 직원 정의가 없습니다.`);
    emp.xp = def.growth?.startXp ?? 0;
  }
  s.xpAwards = {};
  s.xpAwardAmounts = {};
  return s;
}

/** 판본 4 → 5: 기존 진행·보상은 그대로 두고 현지 활동 기록을 비운다. */
export function migrateV4toV5(state: GameState): GameState {
  const s = structuredClone(state);
  s.culture = { reports: [], experiences: [], relationEvents: [] };
  return s;
}

export function deserializeSave(text: string, expected: { dataVersion: string; rulesVersion?: string; config?: ScenarioConfig }): GameState {
  let file: SaveFile;
  try {
    file = JSON.parse(text) as SaveFile;
  } catch {
    throw new SaveError('저장 파일을 읽을 수 없습니다 (JSON 형식 오류).');
  }
  if (file?.format !== SAVE_FORMAT) throw new SaveError('Scitrade 저장 파일이 아닙니다.');
  if (![1, 2, 3, 4, SAVE_FORMAT_VERSION].includes(file.formatVersion)) {
    throw new SaveError(`지원하지 않는 저장 형식 판본입니다 (${file.formatVersion}).`);
  }
  const known = (SUPPORTED_RULES_VERSIONS as readonly string[]).includes(file.rulesVersion);
  if (!known || (expected.rulesVersion !== undefined && file.rulesVersion !== expected.rulesVersion)) {
    throw new SaveError(
      `다른 경제 규칙 판본(${file.rulesVersion})의 저장입니다. ${expected.rulesVersion ? `이 시나리오의 규칙은 ${expected.rulesVersion}이며 ` : ''}규칙 판본 사이의 자동 이관은 없습니다.`,
    );
  }
  if (typeof file.dataVersion === 'string' && /^0\.4\./.test(file.dataVersion)) {
    throw new SaveError('이전 판(부산 본사)의 저장입니다. 이번 판에서는 열 수 없습니다.');
  }
  if (file.dataVersion !== expected.dataVersion) {
    throw new SaveError(`다른 데이터 판본(${file.dataVersion})의 저장입니다. 현재 데이터는 ${expected.dataVersion}입니다.`);
  }
  if (!file.state || typeof file.state.day !== 'number') throw new SaveError('저장 파일에 게임 상태가 없습니다.');
  try {
    if (!expected.config && !(SCENARIO_IDS as readonly string[]).includes(file.scenarioId)) {
      throw new SaveError(`알 수 없는 저장 시나리오입니다 (${file.scenarioId}).`);
    }
    const config = expected.config ?? loadScenario(file.scenarioId as ScenarioId);
    if (config.id !== file.scenarioId) throw new SaveError('이관 설정과 저장 시나리오가 다릅니다.');
    const fv = file.formatVersion;
    const v2 = fv === 1 ? migrateV1toV2(file.state) : file.state;
    const v3 = fv <= 2 ? migrateV2toV3(v2) : v2;
    const v4 = fv <= 3 ? migrateV3toV4(v3, config) : v3;
    const state = fv <= 4 ? migrateV4toV5(v4) : v4;
    checkSaveShape(state);
    if (state.meta.scenarioId !== file.scenarioId || state.meta.rulesVersion !== file.rulesVersion
      || state.meta.dataVersion !== file.dataVersion || config.rules.rulesVersion !== file.rulesVersion
      || config.dataVersion !== file.dataVersion) throw new SaveError('저장 메타 정보와 설정이 다릅니다.');
    checkInvariants(state, config);
    return state;
  } catch (error) {
    if (error instanceof SaveError) throw error;
    throw new SaveError(`저장 상태 검증 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}
