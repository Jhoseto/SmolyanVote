"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";
import { MonitorFilteredFeedGrid } from "../MonitorFilteredFeedGrid";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";

function MonitorSearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const { authority } = useMonitorAuthority();
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    monitorApi
      .search(q.trim(), 0, authority)
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, authority]);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title={`Търсене: ${q || "…"}`}>
      {!q.trim() ? (
        <EmptyState icon="bi-search" title="Въведете дума за търсене" />
      ) : loading ? (
        <LogoLoader label="Търсене…" />
      ) : (
        <MonitorFilteredFeedGrid
          items={items}
          emptyIcon="bi-inbox"
          emptyTitle="Няма резултати"
          emptyDescription={`Нищо не съвпада с „${q}"`}
        />
      )}
    </MonitorMobileShell>
  );
}

export function MonitorSearchPage() {
  return (
    <Suspense fallback={<LogoLoader label="Зареждане…" />}>
      <MonitorSearchContent />
    </Suspense>
  );
}
