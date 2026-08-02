"use client";

import Link from "next/link";
import { MonitorDetailLink } from "./MonitorDetailLink";
import { useId, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/shared/lib/cn";
import { formatEur } from "../lib/format";
import type { MonitorConnections } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  PremiumBarShape,
} from "./charts";
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
  const prefix = useId().replace(/:/g, "");
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
          "animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner",
          compact ? "h-48" : "h-72",
        )}
      />
    );
  }

  if (chartData.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border-default/50 bg-white/80 p-6 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма данни за изпълнители. Стартирайте SIGMA import.
      </p>
    );
  }

  return (
    <MonitorChartCard
      title={title}
      subtitle={`Фирми с най-много обобщени поръчки от ${authorityCount} общини в област Смолян. Кликнете името за профил и рискови сигнали.`}
    >
      <ResponsiveContainer width="100%" height={compact ? 240 : 320}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
          <MonitorChartDefs prefix={prefix} withAmber />
          <XAxis
            type="number"
            tick={MONITOR_CHART.axisTickSmall}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M €`}
          />
          <YAxis type="category" dataKey="name" width={120} tick={MONITOR_CHART.axisTickSmall} axisLine={false} tickLine={false} />
          <Tooltip
            {...MONITOR_CHART.tooltip}
            formatter={(v) => [formatEur(Number(v)), "Общо от общини"]}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as (typeof chartData)[0] | undefined;
              return row ? `${row.fullName} · ${row.contracts} връзки с общини` : "";
            }}
          />
          <Bar
            dataKey="totalEur"
            shape={(props) => {
              const idx = chartData.findIndex((r) => r.name === (props as { payload?: { name?: string } }).payload?.name);
              const { x, y, width, height } = (props ?? {}) as { x?: number; y?: number; width?: number; height?: number };
              return (
                <PremiumBarShape
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  prefix={prefix}
                  orientation="horizontal"
                  fillKey={idx === 0 ? "bar-amber" : "bar-green"}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-2">
        {chartData.map((row) => (
          <div
            key={row.eik}
            className={cn(
              "max-w-full rounded-xl border px-3 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]",
              row.flaggedCount > 0
                ? "border-amber-300/60 bg-gradient-to-br from-amber-50/90 to-white"
                : "border-border-default/40 bg-gradient-to-br from-white to-slate-50/80",
            )}
          >
            <MonitorDetailLink
              href={withAuthority(`/monitor/company/${row.eik}`)}
              className="text-[0.75rem] font-semibold text-[color:var(--color-text-heading)] hover:text-primary hover:underline"
            >
              {truncate(row.fullName, 32)} · {formatEur(row.totalEur)}
            </MonitorDetailLink>
            {row.citizenHint && (
              <p className="mt-1 text-[0.72rem] leading-snug text-[color:var(--color-text-muted)]">{row.citizenHint}</p>
            )}
          </div>
        ))}
      </div>
    </MonitorChartCard>
  );
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
