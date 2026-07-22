"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { cn } from "@/shared/lib/cn";
import { SMOLYAN_CENTER, smolyanPolygonGeoJsonRing } from "../data/smolyanBoundary";
import { createSignalsMapStyle, SIGNALS_MAP_MAX_ZOOM } from "../lib/mapRasterStyle";
import { isWithinSmolyanRegion } from "../lib/geo";
import type { SelectedLocation } from "../hooks/useCreateSignalForm";

interface LocationPickerMapProps {
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
  className?: string;
}

/**
 * Click-to-place picker (MODERN_FRONTEND_PLAN §Create signal). Съзнателно
 * опростяване спрямо legacy: един унифициран click/tap picker за desktop
 * *и* mobile (легacy имаше отделна "pan-to-center crosshair" mobile карта) —
 * click == tap в браузъра, така че не се нуждаем от два отделни UX-а. Без
 * reverse geocode (виж решението в чата) — само координати, без адрес текст.
 */
export function LocationPickerMap({ value, onChange, className }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createSignalsMapStyle(),
      center: SMOLYAN_CENTER,
      zoom: 13,
      minZoom: 9,
      maxZoom: SIGNALS_MAP_MAX_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");

    map.on("load", () => {
      const ring = smolyanPolygonGeoJsonRing();
      map.addSource("smolyan-boundary", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } },
      });
      map.addLayer({
        id: "smolyan-boundary-line",
        type: "line",
        source: "smolyan-boundary",
        paint: { "line-color": "#0d6efd", "line-width": 1.5, "line-dasharray": [2, 2] },
      });
    });

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      onChangeRef.current({ latitude: lat, longitude: lng });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;

    const isValid = isWithinSmolyanRegion(value.latitude, value.longitude);
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-[var(--shadow-md)]",
        isValid ? "bg-primary" : "bg-[color:var(--color-error)]",
      );
      el.innerHTML = '<i class="bi bi-geo-alt-fill" style="font-size:16px"></i>';
      markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([value.longitude, value.latitude])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([value.longitude, value.latitude]);
      const el = markerRef.current.getElement();
      el.className = cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-[var(--shadow-md)]",
        isValid ? "bg-primary" : "bg-[color:var(--color-error)]",
      );
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="h-full w-full" />
      <p className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-[var(--radius-pill)] bg-black/60 px-3 py-1 text-xs text-white">
        Докоснете картата, за да изберете местоположение
      </p>
    </div>
  );
}
