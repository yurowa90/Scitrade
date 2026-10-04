// 지도 표시용 지리 자료 (data/world.json의 geo_position, data/routes.json의 map_waypoints).
// 거리·운송시간 계산에는 쓰지 않는다. 운송시간은 routes.json의 transit_days만 따른다.

import routes from '../../data/routes.json';
import world from '../../data/world.json';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface MapCity extends GeoPoint {
  id: string;
  nameKo: string;
}

type CityRaw = { id: string; name_ko: string; geo_position?: GeoPoint };
type RouteRaw = { id: string; map_waypoints?: { points: GeoPoint[] } };

export function loadMapCities(): MapCity[] {
  return (world as { items: CityRaw[] }).items
    .filter((c) => c.geo_position)
    .map((c) => ({ id: c.id, nameKo: c.name_ko, lat: c.geo_position!.lat, lon: c.geo_position!.lon }));
}

export function loadRouteWaypoints(routeId: string): GeoPoint[] {
  const route = (routes as { items: RouteRaw[] }).items.find((r) => r.id === routeId);
  return route?.map_waypoints?.points ?? [];
}
