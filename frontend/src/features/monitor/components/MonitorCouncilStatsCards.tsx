"use client";

import Link from "next/link";
import { formatDate } from "../lib/format";
import type { MonitorCouncilStats } from "../types";

interface MonitorCouncilStatsCardsProps {
  stats: MonitorCouncilStats | null;
  loading?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  COUNCIL_DECISION: "bi-journal-text",
  COUNCIL_PROTOCOL: "bi-journal-check",
  COUNCIL_AGENDA: "bi-list-task",
  PUBLIC_CONSULTATION: "bi-people",
};

export function MonitorCouncilStatsCards({ stats, loading }: MonitorCouncilStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <section className="space-y-4">
      <p className="text-[0.85rem] text-[color:var(--color-text-secondary)]">
        Активност на ОбС и обсъждания — <strong>{stats.totalDocuments}</strong> документа в базата.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.byType.map((card) => (
          <article
            key={card.type}
            className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                <i className={`bi ${TYPE_ICONS[card.type] ?? "bi-file-earmark"}`} />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-[0.9rem] font-semibold">{card.label}</h3>
                <p className="font-display text-[1.35rem] font-bold text-primary">{card.count}</p>
              </div>
            </div>
            {card.latestTitle && (
              <div className="mt-3 border-t border-border-default/25 pt-3">
                <p className="text-[0.68rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
                  Последно · {formatDate(card.latestDate)}
                </p>
                <p className="mt-1 line-clamp-2 text-[0.78rem] text-[color:var(--color-text-secondary)]">
                  {card.latestTitle}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
      <Link
        href="/monitor/consultations"
        className="inline-flex text-[0.82rem] font-medium text-primary hover:underline"
      >
        Виж всички обсъждания →
      </Link>
    </section>
  );
}
