"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";
import { MonitorInsightCard } from "../MonitorInsightCard";
import { MonitorMobileShell } from "../MonitorMobileShell";

function MonitorSearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
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
      .search(q.trim())
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title={`Търсене: ${q || "…"}`}>
      {!q.trim() ? (
        <EmptyState icon="bi-search" title="Въведете дума за търсене" />
      ) : loading ? (
        <LogoLoader label="Търсене…" />
      ) : items.length === 0 ? (
        <EmptyState icon="bi-inbox" title="Няма резултати" description={`Нищо не съвпада с „${q}"`} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <MonitorInsightCard key={`${item.itemType}-${item.id}`} item={item} />
          ))}
        </div>
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
