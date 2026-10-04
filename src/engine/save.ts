// 저장 파일: 게임 상태(일자 단계·처리한 명령 ID·적용한 사건 ID·난수 커서 포함)와 판본 정보.
// 다른 규칙·데이터 판본의 저장은 조용히 이어 쓰지 않고 거절한다.
// 저장 형식이 바뀌면 판본을 올리고, 이전 판본은 명시한 이관 함수로만 읽는다.

import { ENGINE_VERSION, SUPPORTED_RULES_VERSIONS, type GameState } from './types';

export const SAVE_FORMAT = 'scitrade-save';
/**
 * 1: M1 (계약은 직접 무역뿐, 화물은 회사 소유뿐).
 * 2: M2a (운송 주선 계약 `serviceOfferId`, 화물 소유자 `ownerPartyId` 추가).
 */
export const SAVE_FORMAT_VERSION = 2;

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

export function deserializeSave(text: string, expected: { dataVersion: string; rulesVersion?: string }): GameState {
  let file: SaveFile;
  try {
    file = JSON.parse(text) as SaveFile;
  } catch {
    throw new SaveError('저장 파일을 읽을 수 없습니다 (JSON 형식 오류).');
  }
  if (file?.format !== SAVE_FORMAT) throw new SaveError('Scitrade 저장 파일이 아닙니다.');
  if (file.formatVersion !== 1 && file.formatVersion !== SAVE_FORMAT_VERSION) {
    throw new SaveError(`지원하지 않는 저장 형식 판본입니다 (${file.formatVersion}).`);
  }
  const known = (SUPPORTED_RULES_VERSIONS as readonly string[]).includes(file.rulesVersion);
  if (!known || (expected.rulesVersion !== undefined && file.rulesVersion !== expected.rulesVersion)) {
    throw new SaveError(
      `다른 경제 규칙 판본(${file.rulesVersion})의 저장입니다. ${expected.rulesVersion ? `이 시나리오의 규칙은 ${expected.rulesVersion}이며 ` : ''}규칙 판본 사이의 자동 이관은 없습니다.`,
    );
  }
  if (file.dataVersion !== expected.dataVersion) {
    throw new SaveError(`다른 데이터 판본(${file.dataVersion})의 저장입니다. 현재 데이터는 ${expected.dataVersion}입니다.`);
  }
  if (!file.state || typeof file.state.day !== 'number') throw new SaveError('저장 파일에 게임 상태가 없습니다.');
  return file.formatVersion === 1 ? migrateV1toV2(file.state) : file.state;
}
