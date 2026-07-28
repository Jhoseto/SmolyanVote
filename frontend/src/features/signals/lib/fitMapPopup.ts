import type maplibregl from "maplibre-gl";

export const MAP_POPUP_GAP_PX = 26;
const VIEWPORT_PAD_PX = 12;

export function addMapPopupFitViewport(
  popup: maplibregl.Popup,
  map: maplibregl.Map,
  lng: number,
  lat: number,
  gap = MAP_POPUP_GAP_PX,
): void {
  popup.setOffset([0, gap]).setLngLat([lng, lat]).addTo(map);
  requestAnimationFrame(() => fitPopupElementInMapViewport(popup, map, [0, gap]));
}

/** Place a popup beside a screen point (e.g. cluster list row) and keep it in view. */
export function addMapPopupNearScreenPoint(
  popup: maplibregl.Popup,
  map: maplibregl.Map,
  screenX: number,
  screenY: number,
  offsetX = 10,
): void {
  const lngLat = map.unproject([screenX, screenY]);
  popup.setLngLat(lngLat).setOffset([offsetX, 0]).addTo(map);
  requestAnimationFrame(() => fitPopupElementInMapViewport(popup, map, [offsetX, 0]));
}

function fitPopupElementInMapViewport(
  popup: maplibregl.Popup,
  map: maplibregl.Map,
  baseOffset: [number, number],
): void {
  const el = popup.getElement();
  if (!el) return;

  const container = map.getContainer();
  const cRect = container.getBoundingClientRect();
  const pRect = el.getBoundingClientRect();

  let dx = 0;
  let dy = 0;

  if (pRect.top - cRect.top < VIEWPORT_PAD_PX) {
    dy += VIEWPORT_PAD_PX - (pRect.top - cRect.top);
  }
  if (pRect.left - cRect.left < VIEWPORT_PAD_PX) {
    dx += VIEWPORT_PAD_PX - (pRect.left - cRect.left);
  }
  if (cRect.right - pRect.right < VIEWPORT_PAD_PX) {
    dx -= VIEWPORT_PAD_PX - (cRect.right - pRect.right);
  }
  if (cRect.bottom - pRect.bottom < VIEWPORT_PAD_PX) {
    dy -= VIEWPORT_PAD_PX - (cRect.bottom - pRect.bottom);
  }

  if (dx !== 0 || dy !== 0) {
    popup.setOffset([baseOffset[0] + dx, baseOffset[1] + dy]);
  }
}
