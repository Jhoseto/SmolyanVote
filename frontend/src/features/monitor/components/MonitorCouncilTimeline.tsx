"use client";

import Link from "next/link";
import { formatDate } from "../lib/format";
import type { MonitorFeedItem } from "../types";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";

interface MonitorCouncilTimelineProps {
  items: MonitorFeedItem[];
  loading?: boolean;
}

export function MonitorCouncilTimeline({ items, loading }: MonitorCouncilTimelineProps) {
  const { withAuthority } = useMonitorAuthority();
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-6 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма решения в базата. Пуснете smolyan.bg scrape от админ панела.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l-2 border-primary/20 pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative pb-8 last:pb-0">
          <span
            className="absolute -left-[1.65rem] flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/25 bg-white text-primary shadow-sm"
            aria-hidden
          >
            <i className={cnIcon(item.category)} />
          </span>
          <time className="text-[0.72rem] font-medium text-[color:var(--color-text-muted)]">
            {formatDate(item.date ?? item.publishedAt)}
          </time>
          <h3 className="mt-1 font-display text-[0.95rem] font-semibold leading-snug text-[color:var(--color-text-heading)]">
            {item.title}
          </h3>
          {item.shortSummary && (
            <p className="mt-1 line-clamp-2 text-[0.82rem] text-[color:var(--color-text-secondary)]">
              {item.shortSummary}
            </p>
          )}
          <Link
            href={withAuthority(`/monitor/document/${item.id}`)}
            className="mt-2 inline-flex text-[0.78rem] font-medium text-primary hover:underline"
          >
            Виж детайли →
          </Link>
        </li>
      ))}
    </ol>
  );
}

function cnIcon(category: string | null): string {
  const c = (category || "").toLowerCase();
  if (c.includes("protocol")) return "bi bi-journal-check";
  if (c.includes("agenda")) return "bi bi-list-task";
  if (c.includes("consult")) return "bi bi-people";
  return "bi bi-building";
}
