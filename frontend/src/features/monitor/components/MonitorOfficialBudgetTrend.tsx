"use client";

import { useEffect, useId, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monitorApi } from "../api";
import { MONITOR_CHART, MonitorChartCard, MonitorChartDefs, createPremiumBarShape } from "./charts";
import type { MonitorOfficialBudgetTrendPoint } from "../types";

function fmtM(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function num(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function MonitorOfficialBudgetTrend() {
  const prefix = useId().replace(/:/g, "");
  const [points, setPoints] = useState<MonitorOfficialBudgetTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    monitorApi
      .officialBudgetTrend()
      .then((data) => {
        if (!cancelled) setPoints(data);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-xl border border-border-default/30 bg-slate-50/80" />
    );
  }

  if (points.length === 0) {
    return null;
  }

  const chartRows = points.map((p) => ({
    year: String(p.year),
    adopted: num(p.adoptedTotalBgn),
    executed: p.executedTotalBgn != null ? num(p.executedTotalBgn) : null,
    execPct: p.executionPercent,
    yoy: p.yoyAdoptedPercent,
  }));

  return (
    <MonitorChartCard title="План vs изпълнение 2021–2025 (лв.)">
      <p className="mb-3 text-[0.78rem] text-[color:var(--color-text-muted)]">
        Официален бюджет от решения на ОбС — не включва само поръчки по CPV (SIGMA).
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartRows} margin={{ left: 8, right: 8, top: 12, bottom: 4 }}>
          <MonitorChartDefs prefix={prefix} withPlanned />
          <CartesianGrid {...MONITOR_CHART.grid} />
          <XAxis
            dataKey="year"
            tick={MONITOR_CHART.axisTickSmall}
            axisLine={MONITOR_CHART.axisLine}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)} млн.`}
            width={48}
            tick={MONITOR_CHART.axisTickSmall}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${Math.round(Number(v))}%`}
            width={40}
            tick={MONITOR_CHART.axisTickSmall}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...MONITOR_CHART.tooltip}
            formatter={(v, name) => {
              const n = Number(v);
              if (name === "execPct" || name === "yoy") {
                return [Number.isFinite(n) ? `${Math.round(n)}%` : "—", name === "yoy" ? "YoY план" : "Усвоение"];
              }
              return [`${fmtM(n)} лв.`, name === "adopted" ? "Приет" : "Усвоено"];
            }}
          />
          <Legend {...MONITOR_CHART.legend} />
          <Bar
            yAxisId="left"
            dataKey="adopted"
            name="Приет (лв.)"
            shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-slate" })}
          />
          <Bar
            yAxisId="left"
            dataKey="executed"
            name="Усвоено (лв.)"
            shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-green" })}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="execPct"
            name="Усвоение %"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </MonitorChartCard>
  );
}
