"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEur } from "../lib/format";
import type { MonitorRegionalComparison } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  createPremiumBarShape,
  eurTooltipItem,
} from "./charts";

interface MonitorRegionalComparisonChartProps {
  data: MonitorRegionalComparison | null;
  loading?: boolean;
}

export function MonitorRegionalComparisonChart({
  data,
  loading,
}: MonitorRegionalComparisonChartProps) {
  const prefix = useId().replace(/:/g, "");

  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner" />;
  }

  const rows = data?.municipalities ?? [];
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма данни за сравнение. Разширете SIGMA import с повече общини от област Смолян.
      </p>
    );
  }

  const chartRows = rows.map((r) => ({
    name: r.name.replace("Община ", ""),
    spent: Number(r.totalSpentEur),
    contracts: r.contractCount,
    singleBid: Math.round(r.singleBidderSharePercent),
  }));

  return (
    <div className="space-y-6">
      <MonitorChartCard title="Разходи по община">
        <ResponsiveContainer width="100%" height={Math.max(240, chartRows.length * 52)}>
          <BarChart data={chartRows} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
            <MonitorChartDefs prefix={prefix} />
            <CartesianGrid {...MONITOR_CHART.gridVertical} />
            <XAxis
              type="number"
              tick={MONITOR_CHART.axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatEur(Number(v))}
            />
            <YAxis type="category" dataKey="name" width={96} tick={MONITOR_CHART.axisTick} axisLine={false} tickLine={false} />
            <Tooltip {...MONITOR_CHART.tooltip} formatter={(v) => eurTooltipItem(v, "Разходи")} />
            <Bar
              dataKey="spent"
              name="Разходи"
              shape={createPremiumBarShape(prefix, { orientation: "horizontal", fillKey: "bar-green" })}
            />
          </BarChart>
        </ResponsiveContainer>
      </MonitorChartCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <article
            key={row.eik}
            className="rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] transition-shadow hover:shadow-[0_10px_32px_rgba(25,134,28,0.08)]"
          >
            <h4 className="font-display text-[0.9rem] font-semibold">{row.name}</h4>
            <p className="mt-1 font-display text-[1.15rem] font-bold text-primary">{formatEur(row.totalSpentEur)}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.78rem]">
              <div>
                <dt className="text-[color:var(--color-text-muted)]">Договори</dt>
                <dd className="font-semibold">{row.contractCount}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--color-text-muted)]">Една оферта</dt>
                <dd className="font-semibold">{Math.round(row.singleBidderSharePercent)}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
