// 저장 파일: 게임 상태(일자 단계·처리한 명령 ID·적용한 사건 ID·난수 커서 포함)와 판본 정보.
// 다른 규칙·데이터 판본의 저장은 조용히 이어 쓰지 않고 거절한다.

import { ENGINE_VERSION, RULES_VERSION, type GameState } from './types';

export const SAVE_FORMAT = 'scitrade-save';
export const SAVE_FORMAT_VERSION = 1;

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

export function deserializeSave(text: string, expected: { dataVersion: string }): GameState {
  let file: SaveFile;
  try {
    file = JSON.parse(text) as SaveFile;
  } catch {
    throw new SaveError('저장 파일을 읽을 수 없습니다 (JSON 형식 오류).');
  }
  if (file?.format !== SAVE_FORMAT) throw new SaveError('Scitrade 저장 파일이 아닙니다.');
  if (file.formatVersion !== SAVE_FORMAT_VERSION) {
    throw new SaveError(`지원하지 않는 저장 형식 판본입니다 (${file.formatVersion}).`);
  }
  if (file.rulesVersion !== RULES_VERSION) {
    throw new SaveError(`다른 경제 규칙 판본(${file.rulesVersion})의 저장입니다. 현재 규칙은 ${RULES_VERSION}이며 자동 이관은 아직 없습니다.`);
  }
  if (file.dataVersion !== expected.dataVersion) {
    throw new SaveError(`다른 데이터 판본(${file.dataVersion})의 저장입니다. 현재 데이터는 ${expected.dataVersion}입니다.`);
  }
  if (!file.state || typeof file.state.day !== 'number') throw new SaveError('저장 파일에 게임 상태가 없습니다.');
  return file.state;
}
