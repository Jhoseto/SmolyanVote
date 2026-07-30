"use client";

import { useEffect, useState } from "react";
import { monitorApi } from "../../api";
import { MonitorCouncilStatsCards } from "../MonitorCouncilStatsCards";
import { MonitorCouncilTimeline } from "../MonitorCouncilTimeline";
import { MonitorCouncilorCards } from "../MonitorCouncilorCards";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorCouncilStats, MonitorCouncilorCard, MonitorFeedItem } from "../../types";

export function MonitorCouncilPage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const [items, setItems] = useState<MonitorFeedItem[]>([]);
  const [stats, setStats] = useState<MonitorCouncilStats | null>(null);
  const [councilors, setCouncilors] = useState<MonitorCouncilorCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([monitorApi.councilTimeline(), monitorApi.councilStats(), monitorApi.councilors()])
      .then(([timeline, councilStats, councilorCards]) => {
        setItems(timeline);
        setStats(councilStats);
        setCouncilors(councilorCards);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading} title="Общински съвет">
      <MonitorCouncilStatsCards stats={stats} loading={loading} />
      <section className="mt-8">
        <MonitorCouncilorCards councilors={councilors} loading={loading} />
      </section>
      <section className="mt-8">
        <h2 className="mb-4 font-display text-[1rem] font-semibold">Хронология</h2>
        <MonitorCouncilTimeline items={items} loading={loading} />
      </section>
    </MonitorMobileShell>
  );
}
