"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../api";
import { useMonitorAuthority } from "../components/MonitorAuthorityProvider";
import type { MonitorFeedItem } from "../types";

export function useMonitorFeed(options?: { type?: string; category?: string }) {
  const { authority } = useMonitorAuthority();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monitorApi
      .feed({ type: options?.type, category: options?.category, size: 30 }, authority)
      .then((page) => {
        if (!cancelled) setItems(page.items);
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
  }, [options?.type, options?.category, authority]);

  return { items, loading, error };
}
