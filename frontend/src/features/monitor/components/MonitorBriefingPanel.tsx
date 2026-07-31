"use client";

import Link from "next/link";
import { formatEur } from "../lib/format";
import type { MonitorBriefing } from "../types";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";
import { MonitorAiReportPanel } from "./MonitorAiReportPanel";
import { MonitorBriefingCharts } from "./MonitorBriefingCharts";
import { MonitorInsightCard } from "./MonitorInsightCard";

interface MonitorBriefingPanelProps {
  briefing: MonitorBriefing | null;
  loading?: boolean;
}

export function MonitorBriefingPanel({ briefing, loading }: MonitorBriefingPanelProps) {
  const { withAuthority } = useMonitorAuthority();

  if (loading || !briefing) {
    return (
      <div className="animate-pulse rounded-[var(--radius-lg)] border border-border-default/30 bg-white/90 p-6">
        <div className="h-6 w-2/3 rounded bg-[color:var(--color-surface-muted)]" />
        <div className="mt-3 h-16 rounded bg-[color:var(--color-surface-muted)]" />
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-amber-800">
          Анализ за данъкоплатеца
        </p>
        <h2 className="mt-1 font-display text-[1.15rem] font-bold text-[color:var(--color-text-heading)]">
          {briefing.headline}
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed whitespace-pre-line text-[color:var(--color-text-secondary)]">
          {briefing.narrative}
        </p>
      </div>

      {briefing.aiReport?.aiGenerated && <MonitorAiReportPanel report={briefing.aiReport} />}

      {(briefing.riskChart?.length > 0 || briefing.councilChart?.length > 0) && (
        <MonitorBriefingCharts
          riskChart={briefing.riskChart ?? []}
          councilChart={briefing.councilChart ?? []}
        />
      )}

      {briefing.themes.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {briefing.themes.map((t) => (
            <div
              key={t.code}
              className="rounded-[var(--radius-md)] border border-border-default/25 bg-white/90 px-3 py-2.5"
            >
              <p className="text-[0.8rem] font-semibold text-[color:var(--color-text-heading)]">
                {t.label}{" "}
                <span className="font-normal text-[color:var(--color-text-muted)]">({t.count})</span>
              </p>
              <p className="mt-0.5 text-[0.72rem] text-primary">{formatEur(t.amountEur)}</p>
              <p className="mt-1 text-[0.72rem] leading-snug text-[color:var(--color-text-muted)]">
                {t.explanation}
              </p>
            </div>
          ))}
        </div>
      )}

      {briefing.recentDocuments?.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-[0.95rem] font-semibold">Анализирани решения и обсъждания</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.recentDocuments.slice(0, 4).map((item) => (
              <MonitorInsightCard key={`${item.itemType}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {briefing.topConcerns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-[0.95rem] font-semibold">Най-важните случаи</h3>
            <Link
              href={withAuthority("/monitor/anomalies")}
              className="text-[0.78rem] font-medium text-primary hover:underline"
            >
              Всички аномалии →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.topConcerns.slice(0, 4).map((item) => (
              <MonitorInsightCard key={`${item.itemType}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
