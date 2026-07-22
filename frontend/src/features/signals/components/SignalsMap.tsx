"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "./signals-map.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { cn } from "@/shared/lib/cn";
import { categoryIcon } from "../data/categories";
import { signalMapPopupHtml } from "../lib/signalMapPopupHtml";
import { SMOLYAN_CENTER, smolyanPolygonGeoJsonRing } from "../data/smolyanBoundary";
import {
  createSignalsMapStyle,
  SIGNALS_MAP_MAX_ZOOM,
} from "../lib/mapRasterStyle";
import { SignalsMapHud } from "./SignalsMapHud";
import type { Signal } from "../types";

interface SignalsMapProps {
  signals: Signal[];
  onMarkerClick: (id: number) => void;
  focusSignalId?: number | null;
  className?: string;
  adminQuickMode?: boolean;
  onAdminQuickResolve?: (id: number) => void;
  onAdminQuickDelete?: (id: number) => void;
}

interface SignalPointProperties {
  signalId: number;
  signal: Signal;
}

const DESKTOP_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const FLY_DURATION_MS = 1400;

function isClusterFeature(
  feature: Supercluster.ClusterFeature<Supercluster.AnyProps> | Supercluster.PointFeature<SignalPointProperties>,
): feature is Supercluster.ClusterFeature<Supercluster.AnyProps> {
  return "cluster" in feature.properties && feature.properties.cluster === true;
}

function markerTierClass(signal: Signal): string {
  if (!signal.isActive) return "sv-signal-marker--expired";
  if (signal.priorityTier === "high") return "sv-signal-marker--high";
  if (signal.priorityTier === "medium") return "sv-signal-marker--medium";
  if (signal.priorityTier === "low") return "sv-signal-marker--low";
  return "sv-signal-marker--default";
}

function signalFingerprint(signal: Signal): string {
  return `${signal.id}:${signal.priorityTier}:${signal.isActive}:${signal.category}:${signal.priorityBoostCount}`;
}

function addBoundaryLayers(map: maplibregl.Map) {
  const ring = smolyanPolygonGeoJsonRing();
  if (map.getSource("smolyan-boundary")) return;

  map.addSource("smolyan-boundary", {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } },
  });
  map.addLayer({
    id: "smolyan-boundary-fill",
    type: "fill",
    source: "smolyan-boundary",
    paint: { "fill-color": "#0d6efd", "fill-opacity": 0.05 },
  });
  map.addLayer({
    id: "smolyan-boundary-glow",
    type: "line",
    source: "smolyan-boundary",
    paint: {
      "line-color": "#0d6efd",
      "line-width": 6,
      "line-blur": 4,
      "line-opacity": 0.15,
    },
  });
  map.addLayer({
    id: "smolyan-boundary-line",
    type: "line",
    source: "smolyan-boundary",
    paint: {
      "line-color": "#0d6efd",
      "line-width": 2,
      "line-dasharray": [2, 2],
      "line-opacity": 0.75,
    },
  });
}

function buildMarkerElement(
  signal: Signal,
  onClick: () => void,
  opts: { focused: boolean; animateIn: boolean },
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = cn(
    "sv-signal-marker",
    markerTierClass(signal),
    opts.focused && "sv-signal-marker--focused",
    opts.animateIn && "sv-signal-marker--enter",
  );
  root.dataset.signalId = String(signal.id);

  const ring = document.createElement("div");
  ring.className = "sv-signal-marker__ring";
  root.appendChild(ring);

  const pin = document.createElement("div");
  pin.className = "sv-signal-marker__pin";
  pin.innerHTML = `<i class="bi ${categoryIcon(signal.category)}"></i>`;
  root.appendChild(pin);

  root.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };

  return root;
}

function countVisibleSignals(map: maplibregl.Map, signals: Signal[]): number {
  const bounds = map.getBounds();
  return signals.filter(
    (s) =>
      Number.isFinite(s.latitude) &&
      Number.isFinite(s.longitude) &&
      bounds.contains([s.longitude, s.latitude]),
  ).length;
}

export function SignalsMap({
  signals,
  onMarkerClick,
  focusSignalId,
  className,
  adminQuickMode,
  onAdminQuickResolve,
  onAdminQuickDelete,
}: SignalsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const seenMarkerKeysRef = useRef<Set<string>>(new Set());
  const onMarkerClickRef = useRef(onMarkerClick);
  const adminQuickModeRef = useRef(adminQuickMode);
  const onAdminQuickResolveRef = useRef(onAdminQuickResolve);
  const onAdminQuickDeleteRef = useRef(onAdminQuickDelete);
  const focusSignalIdRef = useRef(focusSignalId);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const hoverHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visibleCount, setVisibleCount] = useState(signals.length);
  const [isFlying, setIsFlying] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
    adminQuickModeRef.current = adminQuickMode;
    onAdminQuickResolveRef.current = onAdminQuickResolve;
    onAdminQuickDeleteRef.current = onAdminQuickDelete;
    focusSignalIdRef.current = focusSignalId;
  }, [onMarkerClick, adminQuickMode, onAdminQuickResolve, onAdminQuickDelete, focusSignalId]);

  const index = useMemo(() => {
    const points: Array<GeoJSON.Feature<GeoJSON.Point, SignalPointProperties>> = signals
      .filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
      .map((signal) => ({
        type: "Feature",
        properties: { signalId: signal.id, signal },
        geometry: { type: "Point", coordinates: [signal.longitude, signal.latitude] },
      }));

    const cluster = new Supercluster<SignalPointProperties>({ radius: 56, maxZoom: 17 });
    cluster.load(points);
    return cluster;
  }, [signals]);

  const flyTo = useCallback((options: maplibregl.FlyToOptions) => {
    const map = mapRef.current;
    if (!map) return;
    setIsFlying(true);
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    map.flyTo({ duration: FLY_DURATION_MS, essential: true, ...options });
    flyTimerRef.current = setTimeout(() => setIsFlying(false), FLY_DURATION_MS + 80);
  }, []);

  const handleRecenter = useCallback(() => {
    flyTo({ center: SMOLYAN_CENTER, zoom: 12.5, pitch: 0, bearing: 0 });
  }, [flyTo]);

  const handleFitSignals = useCallback(() => {
    const map = mapRef.current;
    if (!map || signals.length === 0) {
      handleRecenter();
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    for (const s of signals) {
      if (Number.isFinite(s.latitude) && Number.isFinite(s.longitude)) {
        bounds.extend([s.longitude, s.latitude]);
      }
    }
    if (bounds.isEmpty()) return;
    map.fitBounds(bounds, { padding: { top: 72, bottom: 72, left: 72, right: 72 }, maxZoom: 15, duration: FLY_DURATION_MS });
    setIsFlying(true);
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    flyTimerRef.current = setTimeout(() => setIsFlying(false), FLY_DURATION_MS + 80);
  }, [signals, handleRecenter]);

  const handleLocate = useCallback(() => {
    const map = mapRef.current;
    if (!map || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
          pitch: 24,
          bearing: map.getBearing(),
        });
      },
      () => {
        /* user denied — silent */
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }, [flyTo]);

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: Math.min(map.getZoom() + 1, SIGNALS_MAP_MAX_ZOOM), duration: 350 });
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: Math.max(map.getZoom() - 1, 9), duration: 350 });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createSignalsMapStyle(),
      center: SMOLYAN_CENTER,
      zoom: 12.5,
      minZoom: 9,
      maxZoom: SIGNALS_MAP_MAX_ZOOM,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      fadeDuration: 300,
    });

    map.on("load", () => {
      addBoundaryLayers(map);
      setMapReady(true);
      setVisibleCount(countVisibleSignals(map, signals));
    });

    map.on("moveend", () => setVisibleCount(countVisibleSignals(map, signals)));

    mapRef.current = map;
    return () => {
      if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
      hoverPopupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    setVisibleCount(countVisibleSignals(mapRef.current, signals));
  }, [signals, mapReady]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const desktopHover = window.matchMedia(DESKTOP_HOVER_QUERY).matches;

    function clearHoverPopup() {
      if (hoverHideTimerRef.current) {
        clearTimeout(hoverHideTimerRef.current);
        hoverHideTimerRef.current = null;
      }
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    }

    function scheduleHideHoverPopup() {
      if (hoverHideTimerRef.current) clearTimeout(hoverHideTimerRef.current);
      hoverHideTimerRef.current = setTimeout(clearHoverPopup, 160);
    }

    function showHoverPopup(signal: Signal, lng: number, lat: number) {
      if (hoverHideTimerRef.current) {
        clearTimeout(hoverHideTimerRef.current);
        hoverHideTimerRef.current = null;
      }
      hoverPopupRef.current?.remove();

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 20,
        maxWidth: "280px",
        className: "sv-signal-hover-popup",
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
        .setHTML(signalMapPopupHtml(signal, { adminQuickMode: adminQuickModeRef.current }))
        .addTo(map);

      hoverPopupRef.current = popup;

      const popupEl = popup.getElement();
      if (popupEl) {
        popupEl.addEventListener("mouseenter", () => {
          if (hoverHideTimerRef.current) {
            clearTimeout(hoverHideTimerRef.current);
            hoverHideTimerRef.current = null;
          }
        });
        popupEl.addEventListener("mouseleave", scheduleHideHoverPopup);
        popupEl.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const resolveBtn = target.closest(".sv-admin-resolve-btn") as HTMLElement | null;
          const deleteBtn = target.closest(".sv-admin-delete-btn") as HTMLElement | null;
          const btn = resolveBtn ?? deleteBtn;
          if (!btn) return;
          e.stopPropagation();
          const id = Number(btn.dataset.signalId);
          if (!Number.isFinite(id)) return;
          clearHoverPopup();
          if (deleteBtn) onAdminQuickDeleteRef.current?.(id);
          else onAdminQuickResolveRef.current?.(id);
        });
      }
    }

    function bindHover(el: HTMLElement, signal: Signal, marker: maplibregl.Marker) {
      if (!desktopHover || el.dataset.hoverBound === "1") return;
      el.dataset.hoverBound = "1";
      el.addEventListener("mouseenter", () => {
        const { lng, lat } = marker.getLngLat();
        showHoverPopup(signal, lng, lat);
      });
      el.addEventListener("mouseleave", scheduleHideHoverPopup);
    }

    function updateMarkerFocusClasses() {
      const focusedId = focusSignalIdRef.current;
      for (const marker of markersRef.current.values()) {
        const el = marker.getElement();
        const sid = el.dataset.signalId;
        if (!sid) continue;
        el.classList.toggle("sv-signal-marker--focused", focusedId != null && Number(sid) === focusedId);
      }
    }

    function render() {
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const zoom = Math.round(map.getZoom());
      const clusters = index.getClusters(bbox, zoom);
      const nextKeys = new Set<string>();

      for (const feature of clusters) {
        const [lng, lat] = feature.geometry.coordinates;
        const isCluster = isClusterFeature(feature);
        const key = isCluster ? `cluster-${feature.properties.cluster_id}` : `signal-${feature.properties.signalId}`;
        nextKeys.add(key);

        let marker = markersRef.current.get(key);
        const isNew = !seenMarkerKeysRef.current.has(key);

        if (!marker) {
          if (isCluster) {
            const count = feature.properties.point_count;
            const el = document.createElement("div");
            el.className = "sv-signal-cluster";
            const size = Math.min(56, 36 + Math.log2(count) * 7);
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.fontSize = count > 99 ? "11px" : "13px";
            el.textContent = String(count);
            el.onclick = (e) => {
              e.stopPropagation();
              clearHoverPopup();
              const expansionZoom = Math.min(17, index.getClusterExpansionZoom(feature.properties.cluster_id));
              flyTo({ center: [lng, lat], zoom: expansionZoom });
            };
            marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]);
          } else {
            const signal = feature.properties.signal;
            const focused = focusSignalIdRef.current === signal.id;
            const el = buildMarkerElement(
              signal,
              () => {
                clearHoverPopup();
                onMarkerClickRef.current(signal.id);
              },
              { focused, animateIn: isNew },
            );
            el.dataset.markerFingerprint = signalFingerprint(signal);
            marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]);
            bindHover(el, signal, marker);
          }
          seenMarkerKeysRef.current.add(key);
          markersRef.current.set(key, marker);
          marker.addTo(map);
        } else {
          marker.setLngLat([lng, lat]);
          if (!isCluster) {
            const signal = feature.properties.signal;
            const el = marker.getElement();
            const fp = signalFingerprint(signal);
            const focused = focusSignalIdRef.current === signal.id;
            if (el.dataset.markerFingerprint !== fp || el.classList.contains("sv-signal-marker--focused") !== focused) {
              const fresh = buildMarkerElement(
                signal,
                () => {
                  clearHoverPopup();
                  onMarkerClickRef.current(signal.id);
                },
                { focused, animateIn: false },
              );
              fresh.dataset.markerFingerprint = fp;
              marker.remove();
              const newMarker = new maplibregl.Marker({ element: fresh, anchor: "center" }).setLngLat([lng, lat]);
              bindHover(fresh, signal, newMarker);
              newMarker.addTo(map);
              markersRef.current.set(key, newMarker);
            } else {
              el.classList.toggle("sv-signal-marker--focused", focused);
            }
          }
        }
      }

      for (const [key, marker] of markersRef.current) {
        if (!nextKeys.has(key)) {
          marker.remove();
          markersRef.current.delete(key);
        }
      }

      updateMarkerFocusClasses();
      setVisibleCount(countVisibleSignals(map, signals));
    }

    render();
    map.on("moveend", render);
    map.on("zoomend", render);
    return () => {
      map.off("moveend", render);
      map.off("zoomend", render);
      clearHoverPopup();
    };
  }, [index, signals, flyTo, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusSignalId == null) return;
    const signal = signals.find((s) => s.id === focusSignalId);
    if (!signal) return;

    flyTo({
      center: [signal.longitude, signal.latitude],
      zoom: Math.min(16.5, SIGNALS_MAP_MAX_ZOOM),
      pitch: 28,
      bearing: map.getBearing(),
    });

    for (const marker of markersRef.current.values()) {
      const el = marker.getElement();
      const sid = el.dataset.signalId;
      if (!sid) continue;
      el.classList.toggle("sv-signal-marker--focused", Number(sid) === focusSignalId);
    }
  }, [focusSignalId, signals, flyTo]);

  return (
    <div className={cn("sv-map-shell h-full w-full", className)}>
      <div ref={containerRef} className="sv-map-canvas" />

      {mapReady ? (
        <SignalsMapHud
          visibleCount={visibleCount}
          totalCount={signals.length}
          isFlying={isFlying}
          adminQuickMode={adminQuickMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRecenter={handleRecenter}
          onFitSignals={handleFitSignals}
          onLocate={handleLocate}
        />
      ) : null}
    </div>
  );
}
