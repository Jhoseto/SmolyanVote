import { SMOLYAN_BOUNDS, SMOLYAN_POLYGON_LAT_LNG } from "../data/smolyanBoundary";

/** Ray-casting point-in-polygon — direct port of legacy `map-core.js#isPointInPolygon`. */
function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lati, lngi] = polygon[i];
    const [latj, lngj] = polygon[j];
    const intersect = lngi > lng !== lngj > lng && lat < ((latj - lati) * (lng - lngi)) / (lngj - lngi) + lati;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** bbox reject, then exact polygon check — mirrors legacy `isWithinSmolyanRegion`. */
export function isWithinSmolyanRegion(lat: number, lng: number): boolean {
  if (lat < SMOLYAN_BOUNDS.minLat || lat > SMOLYAN_BOUNDS.maxLat || lng < SMOLYAN_BOUNDS.minLng || lng > SMOLYAN_BOUNDS.maxLng) {
    return false;
  }
  return isPointInPolygon(lat, lng, SMOLYAN_POLYGON_LAT_LNG);
}

/** Haversine distance in km between two WGS84 points. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
