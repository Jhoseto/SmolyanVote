"use client";

import { useEffect, useState } from "react";

interface ReverseGeocodeResult {
  label: string | null;
  isLoading: boolean;
}

/** Client-side Nominatim reverse geocode — debounced, no backend traffic. */
export function useReverseGeocode(lat: number | null, lng: number | null): ReverseGeocodeResult {
  const [label, setLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setLabel(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse");
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lon", String(lng));
        url.searchParams.set("format", "json");
        url.searchParams.set("accept-language", "bg");
        url.searchParams.set("zoom", "18");

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("geocode failed");
        const data = (await res.json()) as { display_name?: string };
        if (!cancelled) {
          setLabel(data.display_name?.split(",").slice(0, 3).join(",") ?? null);
        }
      } catch {
        if (!cancelled) setLabel(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lat, lng]);

  return { label, isLoading };
}
