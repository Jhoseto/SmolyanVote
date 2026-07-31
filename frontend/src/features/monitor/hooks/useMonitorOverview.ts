"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../api";
import { useMonitorAuthority } from "../components/MonitorAuthorityProvider";
import type { MonitorOverview } from "../types";

export function useMonitorOverview() {
  const { authority } = useMonitorAuthority();
  const [overview, setOverview] = useState<MonitorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .overview(authority)
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
  }, [authority]);

  return { overview, loading, error };
}
