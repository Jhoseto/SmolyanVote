"use client";

import { cn } from "@/shared/lib/cn";

export function MetricGrid({
  items,
}: {
  items: { label: string; value: string; tone?: "ok" | "warn" | "bad" | "neutral" }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] px-3 py-2.5"
        >
          <p className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-0.5 text-base font-semibold tabular-nums",
              item.tone === "ok" && "text-[color:var(--color-success)]",
              item.tone === "warn" && "text-amber-600",
              item.tone === "bad" && "text-[color:var(--color-error)]",
              (!item.tone || item.tone === "neutral") && "text-[color:var(--color-text-heading)]",
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const ok = lower.includes("up") || lower === "ok" || lower === "healthy";
  const bad = lower.includes("down") || lower.includes("error") || lower === "out_of_service";
  return (
    <span
      className={cn(
        "rounded-[var(--radius-pill)] px-2 py-0.5 text-[11px] font-semibold uppercase",
        ok && "bg-emerald-50 text-[color:var(--color-success)]",
        bad && "bg-red-50 text-[color:var(--color-error)]",
        !ok && !bad && "bg-amber-50 text-amber-700",
      )}
    >
      {status}
    </span>
  );
}
