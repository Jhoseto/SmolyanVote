"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../api";
import type { MonitorFeedItem } from "../types";

export function useMonitorWeeklyFeed() {
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    monitorApi
      .weeklyHighlights()
      .then((data) => {
        if (!cancelled) setItems(data);
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

  return { items, loading, error };
}
