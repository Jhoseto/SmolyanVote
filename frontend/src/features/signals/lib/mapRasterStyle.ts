import type { StyleSpecification } from "maplibre-gl";

/**
 * Raster basemap for MapLibre — Carto Voyager (CORS-enabled).
 * Direct `tile.openstreetmap.org` requests fail in the browser because MapLibre
 * uses fetch() and OSM does not send Access-Control-Allow-Origin.
 */
export const SIGNALS_MAP_MAX_ZOOM = 18;

export const SIGNALS_MAP_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

export function createSignalsMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: SIGNALS_MAP_ATTRIBUTION,
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}
