"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../api";
import type { MonitorOverview } from "../types";

export function useMonitorOverview() {
  const [overview, setOverview] = useState<MonitorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    monitorApi
      .overview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { overview, loading, error };
}
