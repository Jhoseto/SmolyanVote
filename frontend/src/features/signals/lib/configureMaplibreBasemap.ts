import type maplibregl from "maplibre-gl";

const TRANSPARENT_1PX = {
  width: 1,
  height: 1,
  data: new Uint8Array([0, 0, 0, 0]),
};

/** Stabilize third-party vector styles (disable terrain, stub missing POI sprites). */
export function configureMaplibreBasemap(map: maplibregl.Map): () => void {
  function disableTerrain() {
    try {
      if (map.getTerrain()) map.setTerrain(null);
    } catch {
      /* style not ready yet */
    }
  }

  function onStyleImageMissing(event: { id: string }) {
    if (map.hasImage(event.id)) return;
    try {
      map.addImage(event.id, TRANSPARENT_1PX, { pixelRatio: 1 });
    } catch {
      /* duplicate race while style reloads */
    }
  }

  disableTerrain();
  map.on("styledata", disableTerrain);
  map.on("styleimagemissing", onStyleImageMissing);

  return () => {
    map.off("styledata", disableTerrain);
    map.off("styleimagemissing", onStyleImageMissing);
  };
}
