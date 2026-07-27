import type maplibregl from "maplibre-gl";

/** Keep MapLibre projection in sync when the container size changes (modal open, flex layout, mobile chrome). */
export function observeMaplibreContainer(
  map: maplibregl.Map,
  container: HTMLElement,
  onResize?: () => void,
): () => void {
  const sync = () => {
    map.resize();
    onResize?.();
  };

  const observer = new ResizeObserver(() => sync());
  observer.observe(container);

  // Initial paint can happen before the container has its final size (dynamic import, dialog animation).
  sync();
  requestAnimationFrame(sync);
  const t1 = window.setTimeout(sync, 120);
  const t2 = window.setTimeout(sync, 400);

  const onWindowResize = () => sync();
  window.addEventListener("resize", onWindowResize);

  return () => {
    observer.disconnect();
    window.removeEventListener("resize", onWindowResize);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
}
