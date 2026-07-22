"use client";

import { useEffect, useState } from "react";

export interface GeoCoords {
  lat: number;
  lng: number;
}

/** Browser geolocation for "near me" filter — no persistence. */
export function useGeolocation(enabled: boolean) {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCoords(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Геолокацията не е налична.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
        setIsLoading(false);
      },
      () => {
        setError("Не успяхме да определим местоположението ви.");
        setCoords(null);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, [enabled]);

  return { coords, error, isLoading };
}
