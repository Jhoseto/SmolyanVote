"use client";

import { cn } from "@/shared/lib/cn";
import { concernLabel } from "../lib/concernLabels";
import { formatDate, formatEur } from "../lib/format";
import type { MonitorFeedItem } from "../types";
import { MonitorDetailLink } from "./MonitorDetailLink";
import { RiskBadgeChip } from "./MonitorKpiStrip";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";
import "./monitor-ui.css";

interface MonitorInsightCardProps {
  item: MonitorFeedItem;
  className?: string;
  onPreview?: () => void;
  showFlags?: boolean;
}

export function MonitorInsightCard({
  item,
  className,
  onPreview,
  showFlags = item.itemType === "contract",
}: MonitorInsightCardProps) {
  const { withAuthority } = useMonitorAuthority();
  const href = withAuthority(
    item.itemType === "contract"
      ? `/monitor/contract/${item.id}`
      : `/monitor/document/${item.id}`,
  );
  const concern = item.concernType ? concernLabel(item.concernType) : null;

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4 shadow-[0_2px_16px_rgba(15,23,42,0.05)] transition hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(25,134,28,0.08)]",
        onPreview && "cursor-pointer",
        className,
      )}
      onClick={onPreview ? () => onPreview() : undefined}
      onKeyDown={
        onPreview
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPreview();
              }
            }
          : undefined
      }
      role={onPreview ? "button" : undefined}
      tabIndex={onPreview ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {concern && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-900">
                {concern}
              </span>
            )}
            {item.category && !concern && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
                {item.category}
              </span>
            )}
            <RiskBadgeChip score={item.riskScore} />
          </div>
          <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-[color:var(--color-text-heading)]">
            {item.title}
          </h3>
          {item.shortSummary && (
            <div className="mt-1.5">
              {item.shortSummary !== item.title && (
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-amber-800/90">
                  Защо е важно
                </p>
              )}
              <p className="line-clamp-3 text-[0.82rem] leading-relaxed text-[color:var(--color-text-secondary)]">
                {item.shortSummary}
              </p>
            </div>
          )}
          {item.registryTitle && item.registryTitle !== item.title && (
            <p className="mt-1 line-clamp-1 text-[0.68rem] text-[color:var(--color-text-muted)]" title={item.registryTitle}>
              Регистър: {item.registryTitle}
            </p>
          )}
          {showFlags && item.riskFlags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.riskFlags.map((f) => (
                <span
                  key={f.code}
                  className="rounded-full bg-red-50 px-2 py-0.5 text-[0.65rem] font-medium text-red-900"
                  title={f.tooltip ?? f.label}
                >
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {item.amountEur != null && item.amountEur > 0 && (
          <p className="shrink-0 text-right font-display text-[1rem] font-bold tabular-nums text-primary">
            {formatEur(item.amountEur)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border-default/30 pt-3">
        <span className="text-[0.72rem] text-[color:var(--color-text-muted)]">
          {formatDate(item.date ?? item.publishedAt)}
        </span>
        <div className="flex items-center gap-2">
          {item.itemType !== "contract" && item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.72rem] text-[color:var(--color-text-muted)] hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              Оригинал ↗
            </a>
          )}
          <MonitorDetailLink
            href={href}
            className="monitor-card-cta rounded-full px-3 py-1 text-[0.72rem] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Виж анализа
          </MonitorDetailLink>
        </div>
      </div>
    </article>
  );
}
