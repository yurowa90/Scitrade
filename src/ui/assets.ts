// 그림 자산 조회. src/assets/manifest.json에서 승인된 항목만 돌려준다.

import manifest from '../assets/manifest.json';

export interface MapAsset {
  path: string;
  width: number;
  height: number;
  bounds: { lon_min: number; lon_max: number; lat_min: number; lat_max: number };
  attribution: string;
}

type AssetRaw = {
  id: string;
  kind: string;
  path: string;
  status: string;
  width?: number;
  height?: number;
  employee_id?: string;
  slot?: string;
  bounds?: MapAsset['bounds'];
  provenance?: { attribution?: string };
};

const assets = (manifest as { assets: AssetRaw[] }).assets.filter((a) => a.status === 'approved');

export function mapAsset(id: string): MapAsset | null {
  const a = assets.find((x) => x.id === id && x.kind === 'map');
  if (!a || !a.bounds || !a.width || !a.height) return null;
  return { path: a.path, width: a.width, height: a.height, bounds: a.bounds, attribution: a.provenance?.attribution ?? '' };
}

/** 동료 그림 경로. 승인된 그림이 없으면 null을 돌려주고 화면은 자리표시자를 쓴다. */
export function characterImage(employeeId: string, slot: 'card' | 'portrait' | 'work'): string | null {
  const a = assets.find((x) => x.kind === 'character' && x.employee_id === employeeId && x.slot === slot);
  return a ? a.path : null;
}
