/**
 * Vector basemap for MapLibre — OpenFreeMap "Liberty" style (CORS-enabled, free,
 * no API key, no rate limits). Built on the full OpenMapTiles/OSM planet extract,
 * so it renders every mapped building footprint (with 3D extrusion from z14),
 * parks, water, land use, POIs and a dense road/label hierarchy — noticeably more
 * complete than CARTO's vector set for smaller towns like Smolyan.
 */
export const SIGNALS_MAP_MAX_ZOOM = 20;

export const SIGNALS_MAP_ATTRIBUTION = "© OpenStreetMap contributors © OpenFreeMap";

export const SIGNALS_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
