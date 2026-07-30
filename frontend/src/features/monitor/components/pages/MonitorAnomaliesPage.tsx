"use client";

import { useEffect, useState } from "react";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { MonitorInsightCard } from "../MonitorInsightCard";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";

export function MonitorAnomaliesPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorApi.anomalies(0, 30).then((p) => setItems(p.items)).finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Аномалии и риск">
      <p className="text-[0.9rem] text-[color:var(--color-text-secondary)]">
        Договори с risk score ≥ 40 — единствена оферта, необичайно висока стойност, повтарящ се победител.
      </p>
      {loading ? (
        <LogoLoader label="Зареждане…" />
      ) : items.length === 0 ? (
        <EmptyState icon="bi-shield-check" title="Няма flagged договори" description="Добър знак — или липсват данни." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <MonitorInsightCard key={item.id} item={item} showFlags />
          ))}
        </div>
      )}
    </MonitorMobileShell>
  );
}
