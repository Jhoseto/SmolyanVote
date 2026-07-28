import type maplibregl from "maplibre-gl";

/** Matches `.sv-signal-marker` width in signals-map.css */
export const SIGNAL_MARKER_DIAMETER_PX = 40;

/** Pin centers closer than this on screen are treated as overlapping circles. */
export const SIGNAL_OVERLAP_CENTER_PX = SIGNAL_MARKER_DIAMETER_PX * 0.92;

export interface MapPoint<T> {
  lng: number;
  lat: number;
  data: T;
}

export type ScreenOverlapCluster<T> =
  | { kind: "point"; lng: number; lat: number; data: T }
  | { kind: "cluster"; lng: number; lat: number; items: T[]; count: number };

function clusterIndices(projected: Array<{ x: number; y: number }>, thresholdSq: number): number[] {
  const n = projected.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]!]!;
      root = parent[root]!;
    }
    return root;
  };

  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const cellSize = Math.sqrt(thresholdSq);
  const grid = new Map<string, number[]>();

  for (let i = 0; i < n; i++) {
    const { x, y } = projected[i]!;
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${cx + dx},${cy + dy}`);
        if (!bucket) continue;
        for (const j of bucket) {
          const dxp = projected[i]!.x - projected[j]!.x;
          const dyp = projected[i]!.y - projected[j]!.y;
          if (dxp * dxp + dyp * dyp <= thresholdSq) union(i, j);
        }
      }
    }

    const selfKey = `${cx},${cy}`;
    const list = grid.get(selfKey) ?? [];
    list.push(i);
    grid.set(selfKey, list);
  }

  return parent;
}

/** Group map points only when their on-screen circles overlap at the current zoom. */
export function clusterByScreenOverlap<T>(map: maplibregl.Map, points: MapPoint<T>[]): ScreenOverlapCluster<T>[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    const only = points[0]!;
    return [{ kind: "point", lng: only.lng, lat: only.lat, data: only.data }];
  }

  const projected = points.map((p) => {
    const pt = map.project([p.lng, p.lat]);
    return { x: pt.x, y: pt.y };
  });

  const thresholdSq = SIGNAL_OVERLAP_CENTER_PX * SIGNAL_OVERLAP_CENTER_PX;
  const parent = clusterIndices(projected, thresholdSq);

  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]!]!;
      root = parent[root]!;
    }
    return root;
  };

  const groups = new Map<number, number[]>();
  for (let i = 0; i < points.length; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(i);
    groups.set(root, group);
  }

  const result: ScreenOverlapCluster<T>[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const p = points[group[0]!]!;
      result.push({ kind: "point", lng: p.lng, lat: p.lat, data: p.data });
      continue;
    }

    let sumLng = 0;
    let sumLat = 0;
    const items: T[] = [];
    for (const i of group) {
      const p = points[i]!;
      sumLng += p.lng;
      sumLat += p.lat;
      items.push(p.data);
    }
    const count = group.length;
    result.push({
      kind: "cluster",
      lng: sumLng / count,
      lat: sumLat / count,
      items,
      count,
    });
  }

  return result;
}

/** True when zooming to max would still leave these points overlapping on screen. */
export function willStayOverlappedAtMaxZoom(
  map: maplibregl.Map,
  points: Array<{ lng: number; lat: number }>,
  maxZoom: number,
): boolean {
  if (points.length < 2) return false;

  const projected = points.map((p) => map.project([p.lng, p.lat]));
  let maxDistSq = 0;
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const dx = projected[i]!.x - projected[j]!.x;
      const dy = projected[i]!.y - projected[j]!.y;
      maxDistSq = Math.max(maxDistSq, dx * dx + dy * dy);
    }
  }

  const zoomHeadroom = Math.max(0, maxZoom - map.getZoom());
  const scale = 2 ** zoomHeadroom;
  const maxDistAtMaxZoom = Math.sqrt(maxDistSq) * scale;
  return maxDistAtMaxZoom < SIGNAL_OVERLAP_CENTER_PX;
}

export function clusterStableKey(signals: Array<{ id: number }>): string {
  return signals
    .map((s) => s.id)
    .sort((a, b) => a - b)
    .join("-");
}
