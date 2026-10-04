// 세계지도(UI_WORLD): 위성 합성 영상 위에 항구 휘장·이름 리본·항로·선박·항만 사건·나침반을 겹친다.
// 지도 위치는 표시용이며 운송시간·거리 계산에 쓰지 않는다.

import { loadMapCities, loadRouteWaypoints, type GeoPoint } from '../content/map';
import type { GameState, ScenarioConfig } from '../engine/types';
import { mapAsset } from './assets';

export type MapMode = 'route' | 'region';

const map = mapAsset('MAP_EAST_ASIA');

function project(p: GeoPoint): { x: number; y: number } {
  const m = map!;
  const b = m.bounds;
  return {
    x: ((p.lon - b.lon_min) / (b.lon_max - b.lon_min)) * m.width,
    y: ((b.lat_max - p.lat) / (b.lat_max - b.lat_min)) * m.height,
  };
}

/** Catmull-Rom 스플라인을 3차 베지어로 바꿔 부드러운 항로선을 만든다. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** 꺾은선 위 비율 t(0~1) 지점과 진행 방향(도). */
function pointAlong(points: { x: number; y: number }[], t: number) {
  const segs = points.slice(1).map((p, i) => Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y));
  const total = segs.reduce((a, b) => a + b, 0);
  let remain = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (remain <= segs[i]! || i === segs.length - 1) {
      const f = segs[i]! === 0 ? 0 : Math.min(1, remain / segs[i]!);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
    }
    remain -= segs[i]!;
  }
  const last = points[points.length - 1]!;
  return { x: last.x, y: last.y, angle: 0 };
}

const SHIP = `
  <g class="ship-wake"><path d="M-30 -5 Q-48 0 -30 5" /><path d="M-40 -8 Q-62 0 -40 8" /></g>
  <path class="ship-hull" d="M-22 -7 H14 Q24 -7 28 0 Q24 7 14 7 H-22 Q-25 0 -22 -7 Z" />
  <rect class="ct ct-a" x="-17" y="-5" width="7" height="4.5" rx=".6" /><rect class="ct ct-b" x="-17" y=".5" width="7" height="4.5" rx=".6" />
  <rect class="ct ct-c" x="-9" y="-5" width="7" height="4.5" rx=".6" /><rect class="ct ct-a" x="-9" y=".5" width="7" height="4.5" rx=".6" />
  <rect class="ct ct-b" x="-1" y="-5" width="7" height="4.5" rx=".6" /><rect class="ct ct-c" x="-1" y=".5" width="7" height="4.5" rx=".6" />
  <rect class="ship-bridge" x="8" y="-4" width="5" height="8" rx="1" />`;

const ANCHOR = '<path d="M0 -6 V5 M-4 -3 H4 M-6 1 Q-5 6 0 6 Q5 6 6 1" fill="none" stroke-width="1.6" stroke-linecap="round"/><circle cx="0" cy="-7" r="1.6" fill="none" stroke-width="1.3"/>';

function compass(x: number, y: number, r: number): string {
  return `
  <g class="compass" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" aria-hidden="true">
    <circle r="${r}" class="compass-ring"/><circle r="${r * 0.78}" class="compass-ring inner"/>
    <path class="compass-ns" d="M0 ${-r * 0.95} L${r * 0.16} 0 L0 ${r * 0.95} L${-r * 0.16} 0 Z"/>
    <path class="compass-ew" d="M${-r * 0.7} 0 L0 ${r * 0.12} L${r * 0.7} 0 L0 ${-r * 0.12} Z"/>
    <path class="compass-north" d="M0 ${-r * 0.95} L${r * 0.16} 0 L${-r * 0.16} 0 Z"/>
    <text y="${-r * 1.12}" text-anchor="middle">N</text>
  </g>`;
}

export function renderWorldMap(state: GameState, config: ScenarioConfig, mode: MapMode): string {
  if (!map) return '<p class="muted">지도 자산이 없습니다.</p>';
  const cities = loadMapCities();
  const routeCities = new Set([config.route.fromCityId, config.route.toCityId]);
  const routePts = loadRouteWaypoints(config.route.id).map(project);

  // 보기 영역: 이번 항로 주변 또는 전체 해역.
  let vb = { x: 0, y: 0, w: map.width, h: map.height };
  if (mode === 'route' && routePts.length) {
    const pad = 70;
    const xs = routePts.map((p) => p.x);
    const ys = routePts.map((p) => p.y);
    let x0 = Math.min(...xs) - pad;
    let x1 = Math.max(...xs) + pad;
    let y0 = Math.min(...ys) - pad;
    let y1 = Math.max(...ys) + pad;
    const aspect = 16 / 10;
    if ((x1 - x0) / (y1 - y0) < aspect) {
      const need = (y1 - y0) * aspect - (x1 - x0);
      x0 -= need / 2;
      x1 += need / 2;
    } else {
      const need = (x1 - x0) / aspect - (y1 - y0);
      y0 -= need / 2;
      y1 += need / 2;
    }
    vb = { x: Math.max(0, x0), y: Math.max(0, y0), w: Math.min(map.width, x1) - Math.max(0, x0), h: Math.min(map.height, y1) - Math.max(0, y0) };
  }
  const k = vb.w / 620; // 보기 영역이 넓어져도 화면상 글자·휘장 크기가 비슷하게 유지되도록 맞춘다.

  // 경위선 5° 간격.
  const b = map.bounds;
  const grid: string[] = [];
  for (let lon = Math.ceil(b.lon_min / 5) * 5; lon <= b.lon_max; lon += 5) {
    const x = project({ lat: 0, lon }).x;
    if (x < vb.x || x > vb.x + vb.w) continue;
    grid.push(`<line x1="${x}" y1="${vb.y}" x2="${x}" y2="${vb.y + vb.h}"/><text class="grid-label" x="${x + 4 * k}" y="${vb.y + 16 * k}" font-size="${12 * k}">${lon}°E</text>`);
  }
  for (let lat = Math.ceil(b.lat_min / 5) * 5; lat <= b.lat_max; lat += 5) {
    const y = project({ lat, lon: b.lon_min }).y;
    if (y < vb.y || y > vb.y + vb.h) continue;
    grid.push(`<line x1="${vb.x}" y1="${y}" x2="${vb.x + vb.w}" y2="${y}"/><text class="grid-label" x="${vb.x + 6 * k}" y="${y - 4 * k}" font-size="${12 * k}">${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}</text>`);
  }

  // 항구 휘장과 이름 리본.
  const ports = cities.map((c) => {
    const p = project(c);
    const active = routeCities.has(c.id);
    const label = c.nameKo;
    const w = (label.length * 15 + 22) * k;
    const h = 24 * k;
    const left = c.id === 'BUSAN' || c.id === 'SHANGHAI' || c.id === 'HAIPHONG';
    let lx = left ? p.x - w - 14 * k : p.x + 14 * k;
    if (lx + w > vb.x + vb.w - 4 * k) lx = p.x - w - 14 * k; // 보기 영역 밖으로 나가면 반대쪽에 붙인다.
    if (lx < vb.x + 4 * k) lx = p.x + 14 * k;
    const ly = p.y - h - 6 * k;
    return `
    <g class="port ${active ? 'active' : 'idle'}">
      <circle cx="${p.x}" cy="${p.y}" r="${15 * k}" class="port-glow"/>
      <g transform="translate(${p.x} ${p.y}) scale(${k})"><circle r="10" class="port-badge"/><g class="port-anchor">${ANCHOR}</g></g>
      <g class="ribbon"><rect x="${lx}" y="${ly}" width="${w}" height="${h}" rx="${5 * k}"/>
      <text x="${lx + w / 2}" y="${ly + h * 0.7}" text-anchor="middle" font-size="${15 * k}">${label}</text></g>
      ${active ? '' : `<title>${label}: M3에서 열리는 거점</title>`}
    </g>`;
  });

  // 선박: 출항 후 인도 전까지 항로 위에 표시.
  let ship = '';
  const sh = state.shipments.find((x) => x.arrivalDay === null || (x.releaseDay !== null && state.day <= x.releaseDay));
  if (sh && routePts.length > 1) {
    const waiting = sh.arrivalDay === null && state.day >= sh.scheduledArrivalDay;
    const t = sh.arrivalDay !== null ? 1 : waiting ? 0.93 : (state.day - sh.departureDay) / config.route.transitDays;
    const pos = pointAlong(routePts, t);
    ship = `<g class="ship ${waiting ? 'waiting' : ''}" transform="translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${pos.angle.toFixed(1)}) scale(${k * 0.9})"><title>${sh.id}${waiting ? ' — 하역 중단으로 대기 중' : ''}</title>${SHIP}</g>`;
  }

  // 항만 사건: 공지된 하역 중단.
  const storms = config.portRestrictions
    .filter((r) => state.appliedEventIds[r.eventInstanceId])
    .map((r) => {
      const c = cities.find((x) => x.id === r.cityId);
      if (!c) return '';
      const p = project(c);
      const active = r.startDay <= state.day && state.day <= r.endDay;
      const done = state.day > r.endDay;
      return `
      <g class="storm ${active ? 'active' : done ? 'done' : 'upcoming'}" transform="translate(${(p.x + 30 * k).toFixed(1)} ${(p.y + 40 * k).toFixed(1)}) scale(${k * 0.8})">
        <circle r="34" class="storm-zone"/>
        <path class="storm-cloud" d="M-16 4 Q-22 4 -22 -2 Q-22 -9 -14 -9 Q-12 -17 -3 -17 Q6 -17 8 -9 Q17 -10 18 -2 Q18 4 12 4 Z"/>
        <path class="storm-bolt" d="M-1 4 L-6 14 L0 13 L-3 22 L7 9 L1 10 L4 4 Z"/>
        <title>${r.forecastKo}${done ? ' (종료)' : ''}</title>
      </g>`;
    })
    .join('');

  const routeD = smoothPath(routePts);
  const cx = vb.x + vb.w - 52 * k;
  const cy = vb.y + vb.h - 60 * k;
  return `
  <svg class="sea-map" viewBox="${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}" role="img"
    aria-label="동아시아 해역 지도. ${config.route.id} ${cities.find((c) => c.id === config.route.fromCityId)?.nameKo}–${cities.find((c) => c.id === config.route.toCityId)?.nameKo} 항로${sh ? `, 화물선 ${sh.id} 운항 중` : ''}">
    <defs>
      <radialGradient id="port-glow" r="0.5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
    </defs>
    <image href="${map.path}" x="0" y="0" width="${map.width}" height="${map.height}" preserveAspectRatio="none"/>
    <g class="graticule" stroke-width="${0.8 * k}">${grid.join('')}</g>
    ${routeD ? `<path class="route-under" d="${routeD}" stroke-width="${7 * k}"/><path class="route-line" d="${routeD}" stroke-width="${2.6 * k}" stroke-dasharray="${10 * k} ${8 * k}"/>` : ''}
    ${ports.join('')}
    ${storms}
    ${ship}
    ${compass(cx, cy, 34 * k)}
  </svg>`;
}

export const MAP_ATTRIBUTION = map?.attribution ?? '';
