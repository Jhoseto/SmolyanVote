"use client";

import { cn } from "@/shared/lib/cn";
import { formatEur, formatFreshness, riskTone } from "../lib/format";
import type { MonitorOverview } from "../types";

interface MonitorKpiStripProps {
  overview: MonitorOverview | null;
  loading?: boolean;
  className?: string;
}

export function MonitorKpiStrip({ overview, loading, className }: MonitorKpiStripProps) {
  const items = [
    {
      icon: "bi-cash-stack",
      label: "Похарчено YTD",
      value: loading ? "…" : formatEur(overview?.spentYtdEur ?? 0),
      tone: "text-primary",
    },
    {
      icon: "bi-file-earmark-text",
      label: "Договори",
      value: loading ? "…" : String(overview?.contractCount ?? 0),
      tone: "text-emerald-600",
    },
    {
      icon: "bi-exclamation-triangle",
      label: "С рискови сигнали",
      value: loading ? "…" : String(overview?.flaggedCount ?? 0),
      tone: "text-amber-600",
    },
    {
      icon: "bi-journal-text",
      label: "Документи",
      value: loading ? "…" : String(overview?.documentCount ?? 0),
      tone: "text-blue-600",
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-default/30 bg-white/90 px-3 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]",
                item.tone,
              )}
            >
              <i className={cn("bi text-xl", item.icon)} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tabular-nums leading-none text-[color:var(--color-text-heading)]">
                {item.value}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-[color:var(--color-text-muted)]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
      {!loading && overview?.dataFreshness && (
        <p className="text-[0.75rem] text-[color:var(--color-text-muted)]">
          Данни актуални до {formatFreshness(overview.dataFreshness)}
        </p>
      )}
    </div>
  );
}

export function RiskBadgeChip({ score }: { score: number | null | undefined }) {
  const tone = riskTone(score);
  if (tone === "none") return null;
  const colors = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold",
        colors[tone],
      )}
      title="Рисков индекс 0–100 — по-висок = повече сигнали за внимание"
    >
      <i className="bi bi-shield-exclamation" />
      {score}
    </span>
  );
}
