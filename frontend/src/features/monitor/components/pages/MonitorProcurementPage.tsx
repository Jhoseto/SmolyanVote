"use client";

import { useEffect, useState } from "react";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { MonitorCompetitionPanel } from "../MonitorCompetitionPanel";
import { MonitorInsightCard } from "../MonitorInsightCard";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { MonitorProcurementCharts } from "../MonitorProcurementCharts";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorCompetition, MonitorFeedItem, MonitorProcurementStats } from "../../types";

export function MonitorProcurementPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [stats, setStats] = useState<MonitorProcurementStats | null>(null);
  const [competition, setCompetition] = useState<MonitorCompetition | null>(null);
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      monitorApi.procurementStats(),
      monitorApi.competition(),
      monitorApi.feed({ type: "contract", size: 24 }),
    ])
      .then(([s, c, feed]) => {
        if (cancelled) return;
        setStats(s);
        setCompetition(c);
        setItems(feed.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Поръчки и договори">
      <MonitorProcurementCharts stats={stats} loading={loading} />
      <section className="mt-6">
        <MonitorCompetitionPanel data={competition} loading={loading} />
      </section>
      <section className="mt-6 space-y-3">
        <h2 className="font-display text-[1rem] font-semibold">Последни договори</h2>
        {loading ? (
          <LogoLoader label="Зареждане…" />
        ) : items.length === 0 ? (
          <EmptyState icon="bi-basket" title="Няма договори" description="Пуснете SIGMA import." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <MonitorInsightCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </MonitorMobileShell>
  );
}
