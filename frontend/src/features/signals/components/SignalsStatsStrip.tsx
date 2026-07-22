"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import type { Signal } from "../types";

interface SignalsStatsStripProps {
  signals: Signal[];
  className?: string;
}

export function SignalsStatsStrip({ signals, className }: SignalsStatsStripProps) {
  const stats = useMemo(() => {
    const active = signals.filter((s) => s.isActive && !s.isResolved);
    const resolved = signals.filter((s) => s.isResolved);
    const high = active.filter((s) => s.priorityTier === "high");
    const boosted = signals.filter((s) => s.hasBoosted);
    return { total: signals.length, active: active.length, resolved: resolved.length, high: high.length, boosted: boosted.length };
  }, [signals]);

  const items = [
    { icon: "bi-collection", label: "Общо", value: stats.total, tone: "text-primary" },
    { icon: "bi-lightning-charge", label: "Активни", value: stats.active, tone: "text-emerald-600" },
    { icon: "bi-check-circle", label: "Решени", value: stats.resolved, tone: "text-blue-600" },
    { icon: "bi-exclamation-triangle", label: "Висок приоритет", value: stats.high, tone: "text-red-600" },
    { icon: "bi-arrow-up-circle", label: "Вдигнати от мен", value: stats.boosted, tone: "text-amber-600" },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-default/30 bg-white/90 px-3 py-2.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        >
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]", item.tone)}>
            <i className={cn("bi text-lg", item.icon)} />
          </span>
          <div>
            <p className="text-lg font-bold tabular-nums leading-none text-[color:var(--color-text-heading)]">{item.value}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[color:var(--color-text-muted)]">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
