"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { cn } from "@/shared/lib/cn";
import { categoryIcon } from "../data/categories";
import { SMOLYAN_CENTER, smolyanPolygonGeoJsonRing } from "../data/smolyanBoundary";
import type { Signal } from "../types";

interface SignalsMapProps {
  signals: Signal[];
  onMarkerClick: (id: number) => void;
  /** Center + open the popup for this signal once (e.g. from the list panel) — mirrors legacy "center on map". */
  focusSignalId?: number | null;
  className?: string;
}

interface SignalPointProperties {
  signalId: number;
  signal: Signal;
}

function isClusterFeature(
  feature: Supercluster.ClusterFeature<Supercluster.AnyProps> | Supercluster.PointFeature<SignalPointProperties>,
): feature is Supercluster.ClusterFeature<Supercluster.AnyProps> {
  return "cluster" in feature.properties && feature.properties.cluster === true;
}

const HOVER_POPUP_AUTO_HIDE_MS = 3000;
const DESKTOP_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

function formatExpiration(signal: Signal): string {
  if (!signal.isActive) return "изтекъл";
  if (!signal.activeUntil) return "";
  const days = Math.max(0, Math.ceil((new Date(signal.activeUntil).getTime() - Date.now()) / 86_400_000));
  return days === 0 ? "изтича днес" : `остават ${days} ${days === 1 ? "ден" : "дни"}`;
}

function popupHtml(signal: Signal): string {
  const avatar = signal.authorImageUrl
    ? `<img src="${signal.authorImageUrl}" alt="" class="h-6 w-6 rounded-full object-cover" />`
    : `<span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary">${(signal.authorUsername ?? "?").charAt(0).toUpperCase()}</span>`;

  return `
    <div class="flex flex-col gap-1.5 p-1 text-sm">
      <p class="font-semibold text-[color:var(--color-text-heading)] line-clamp-2">${escapeHtml(signal.title)}</p>
      <div class="flex items-center gap-1.5 text-xs text-[color:var(--color-text-muted)]">
        <i class="bi ${categoryIcon(signal.category)}"></i>
        <span>${escapeHtml(signal.categoryLabel)}</span>
      </div>
      <div class="flex items-center gap-1.5">
        ${avatar}
        <span class="text-xs text-[color:var(--color-text-secondary)]">${escapeHtml(signal.authorUsername ?? "")}</span>
        <span class="text-xs text-[color:var(--color-text-muted)]">· ${formatDate(signal.createdAt)}</span>
      </div>
      <p class="text-xs ${signal.isActive ? "text-[color:var(--color-success)]" : "text-[color:var(--color-error)]"}">${formatExpiration(signal)}</p>
    </div>`;
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

/**
 * MapLibre GL + OSM raster tiles (same tile source as legacy Leaflet — no new
 * external map-tile dependency) + `supercluster` (MODERN_FRONTEND_PLAN.md
 * §Map view). Clustering/markers are plain DOM nodes (`maplibregl.Marker`),
 * recomputed on `moveend`/data change — simpler than GL circle layers when
 * markers need rich per-category HTML + native hover events for the desktop
 * popup.
 */
export function SignalsMap({ signals, onMarkerClick, focusSignalId, className }: SignalsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const index = useMemo(() => {
    const points: Array<GeoJSON.Feature<GeoJSON.Point, SignalPointProperties>> = signals
      .filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
      .map((signal) => ({
        type: "Feature",
        properties: { signalId: signal.id, signal },
        geometry: { type: "Point", coordinates: [signal.longitude, signal.latitude] },
      }));

    const cluster = new Supercluster<SignalPointProperties>({ radius: 50, maxZoom: 17 });
    cluster.load(points);
    return cluster;
  }, [signals]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: SMOLYAN_CENTER,
      zoom: 12.5,
      minZoom: 9,
      maxZoom: 19,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");

    const recenterControl: maplibregl.IControl = {
      onAdd: () => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "maplibregl-ctrl-icon";
        button.title = "Центрирай към Смолян";
        button.innerHTML = '<i class="bi bi-geo" style="font-size:16px;line-height:29px;"></i>';
        button.onclick = () => map.easeTo({ center: SMOLYAN_CENTER, zoom: 12.5 });
        const wrapper = document.createElement("div");
        wrapper.className = "maplibregl-ctrl maplibregl-ctrl-group";
        wrapper.appendChild(button);
        return wrapper;
      },
      onRemove: () => {},
    };
    map.addControl(recenterControl, "top-right");

    map.on("load", () => {
      const ring = smolyanPolygonGeoJsonRing();
      map.addSource("smolyan-boundary", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } },
      });
      map.addLayer({
        id: "smolyan-boundary-fill",
        type: "fill",
        source: "smolyan-boundary",
        paint: { "fill-color": "#0d6efd", "fill-opacity": 0.03 },
      });
      map.addLayer({
        id: "smolyan-boundary-line",
        type: "line",
        source: "smolyan-boundary",
        paint: { "line-color": "#0d6efd", "line-width": 1.5, "line-dasharray": [2, 2] },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    // Reassigned to a fresh `const` so TS's null-narrowing survives into the
    // nested closures below (`mapRef.current`'s union type wouldn't).
    const map = mapRef.current;

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
        if (!marker) {
          const el = document.createElement("div");
          marker = new maplibregl.Marker({ element: el, anchor: isCluster ? "center" : "bottom" }).setLngLat([lng, lat]);
          markersRef.current.set(key, marker);
          marker.addTo(map);

          if (isCluster) {
            const count = feature.properties.point_count;
            el.className =
              "flex items-center justify-center rounded-full bg-primary text-white font-semibold shadow-[var(--shadow-md)] cursor-pointer border-2 border-white";
            const size = Math.min(52, 32 + Math.log2(count) * 6);
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.fontSize = count > 99 ? "11px" : "13px";
            el.textContent = String(count);
            el.onclick = () => {
              const expansionZoom = Math.min(17, index.getClusterExpansionZoom(feature.properties.cluster_id));
              map.easeTo({ center: [lng, lat], zoom: expansionZoom });
            };
          } else {
            const signal = feature.properties.signal;
            el.className = cn(
              "group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white text-white shadow-[var(--shadow-md)] transition-transform hover:scale-110",
              signal.isActive ? "bg-primary" : "bg-[color:var(--color-text-muted)]",
            );
            el.innerHTML = `<i class="bi ${categoryIcon(signal.category)}" style="font-size:15px"></i>`;
            el.onclick = () => onMarkerClickRef.current(signal.id);

            if (window.matchMedia(DESKTOP_HOVER_QUERY).matches) {
              let popup: maplibregl.Popup | null = null;
              let hideTimer: ReturnType<typeof setTimeout> | null = null;
              el.addEventListener("mouseenter", () => {
                popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 20, maxWidth: "220px" })
                  .setLngLat([lng, lat])
                  .setHTML(popupHtml(signal))
                  .addTo(map);
                hideTimer = setTimeout(() => popup?.remove(), HOVER_POPUP_AUTO_HIDE_MS);
              });
              el.addEventListener("mouseleave", () => {
                if (hideTimer) clearTimeout(hideTimer);
                popup?.remove();
                popup = null;
              });
            }
          }
        } else {
          marker.setLngLat([lng, lat]);
        }
      }

      for (const [key, marker] of markersRef.current) {
        if (!nextKeys.has(key)) {
          marker.remove();
          markersRef.current.delete(key);
        }
      }
    }

    render();
    map.on("moveend", render);
    map.on("zoomend", render);
    return () => {
      map.off("moveend", render);
      map.off("zoomend", render);
    };
  }, [index]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusSignalId == null) return;
    const signal = signals.find((s) => s.id === focusSignalId);
    if (signal) map.easeTo({ center: [signal.longitude, signal.latitude], zoom: 17 });
  }, [focusSignalId, signals]);

  return <div ref={containerRef} className={cn("h-full w-full", className)} />;
}
