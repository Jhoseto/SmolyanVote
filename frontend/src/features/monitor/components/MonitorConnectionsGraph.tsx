"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/shared/lib/cn";
import { formatEur } from "../lib/format";
import type { MonitorConnections } from "../types";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";

interface MonitorConnectionsGraphProps {
  connections: MonitorConnections | null;
  loading?: boolean;
  title?: string;
  compact?: boolean;
}

/** Top contractors by municipal spend — readable bar chart, not spaghetti lines. */
export function MonitorConnectionsGraph({
  connections,
  loading,
  title = "Топ изпълнители",
  compact,
}: MonitorConnectionsGraphProps) {
  const { withAuthority } = useMonitorAuthority();

  const chartData = useMemo(() => {
    if (!connections) return [];
    return connections.nodes
      .filter((n) => n.type === "contractor" && n.totalEur > 0)
      .sort((a, b) => b.totalEur - a.totalEur)
      .slice(0, compact ? 6 : 10)
      .map((n) => ({
        eik: n.id.replace("co:", ""),
        name: truncate(n.label, 22),
        fullName: n.label,
        totalEur: n.totalEur,
        contracts: n.linkCount,
        flaggedCount: n.flaggedCount ?? 0,
        citizenHint: n.citizenHint,
      }));
  }, [connections, compact]);

  const authorityCount = connections?.nodes.filter((n) => n.type === "authority").length ?? 0;

  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]",
          compact ? "h-48" : "h-72",
        )}
      />
    );
  }

  if (chartData.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-6 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма данни за изпълнители. Стартирайте SIGMA import.
      </p>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4 md:p-5">
      <h3 className="font-display text-[1rem] font-semibold text-[color:var(--color-text-heading)]">{title}</h3>
      <p className="mt-1 text-[0.85rem] text-[color:var(--color-text-muted)]">
        Фирми с най-много обобщени поръчки от {authorityCount} общини в област Смолян. Кликнете името за
        профил и рискови сигнали.
      </p>

      <ResponsiveContainer width="100%" height={compact ? 220 : 300} className="mt-4">
        <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M €`} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v) => [formatEur(Number(v)), "Общо от общини"]}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as (typeof chartData)[0] | undefined;
              return row ? `${row.fullName} · ${row.contracts} връзки с общини` : "";
            }}
          />
          <Bar dataKey="totalEur" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`co-bar-${index}-${entry.eik}`} fill={index === 0 ? "#b45309" : "#19861c"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-2">
        {chartData.map((row) => (
          <div
            key={row.eik}
            className={cn(
              "max-w-full rounded-xl border px-3 py-2 shadow-sm",
              row.flaggedCount > 0
                ? "border-amber-300/60 bg-amber-50/70"
                : "border-border-default/40 bg-white",
            )}
          >
            <Link
              href={withAuthority(`/monitor/company/${row.eik}`)}
              className="text-[0.75rem] font-semibold text-[color:var(--color-text-heading)] hover:text-primary hover:underline"
            >
              {truncate(row.fullName, 32)} · {formatEur(row.totalEur)}
            </Link>
            {row.citizenHint && (
              <p className="mt-1 text-[0.72rem] leading-snug text-[color:var(--color-text-muted)]">
                {row.citizenHint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
