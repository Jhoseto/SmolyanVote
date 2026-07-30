"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { applyPriorityTiers } from "../lib/computePriorityLevel";
import type { Signal } from "../types";

interface SignalsMobileStatsBarProps {
  signals: Signal[];
  className?: string;
}

/** Compact horizontal stats for mobile — same data as desktop strip. */
export function SignalsMobileStatsBar({ signals, className }: SignalsMobileStatsBarProps) {
  const stats = useMemo(() => {
    const withTiers = applyPriorityTiers(signals);
    const active = withTiers.filter((s) => s.isActive && !s.isResolved);
    const resolved = withTiers.filter((s) => s.isResolved);
    const high = active.filter((s) => s.priorityTier === "high");
    return {
      total: withTiers.length,
      active: active.length,
      resolved: resolved.length,
      high: high.length,
    };
  }, [signals]);

  const items = [
    { icon: "bi-collection", label: "Общо", value: stats.total, tone: "text-primary" },
    { icon: "bi-lightning-charge", label: "Активни", value: stats.active, tone: "text-emerald-600" },
    { icon: "bi-check-circle", label: "Решени", value: stats.resolved, tone: "text-sky-600" },
    { icon: "bi-exclamation-triangle", label: "Висок", value: stats.high, tone: "text-red-600" },
  ];

  if (stats.total === 0) return null;

  return (
    <div className={cn("signals-mobile-stats shrink-0", className)}>
      <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none">
        {items.map((item) => (
          <div
            key={item.label}
            className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-lg)] border border-border-default/25 bg-white/95 px-2.5 py-1.5 shadow-sm"
          >
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]", item.tone)}>
              <i className={cn("bi text-sm", item.icon)} />
            </span>
            <div>
              <p className="text-sm font-bold tabular-nums leading-none text-[color:var(--color-text-heading)]">{item.value}</p>
              <p className="mt-0.5 text-[0.62rem] font-medium text-[color:var(--color-text-muted)]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
