"use client";

import { useEffect, useState } from "react";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { MonitorInsightCard } from "../MonitorInsightCard";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";

export function MonitorDeadlinesPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorApi.deadlines().then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Срокове">
      {loading ? (
        <LogoLoader label="Зареждане…" />
      ) : items.length === 0 ? (
        <EmptyState icon="bi-calendar-event" title="Няма предстоящи срокове" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <MonitorInsightCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </MonitorMobileShell>
  );
}
