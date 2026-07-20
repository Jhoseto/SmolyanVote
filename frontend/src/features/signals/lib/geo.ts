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
