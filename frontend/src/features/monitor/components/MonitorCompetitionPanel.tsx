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
import type { MonitorCompetition } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  createPremiumBarShape,
} from "./charts";

interface MonitorCompetitionPanelProps {
  data: MonitorCompetition | null;
  loading?: boolean;
}

export function MonitorCompetitionPanel({ data, loading }: MonitorCompetitionPanelProps) {
  const prefix = useId().replace(/:/g, "");

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner" />;
  }
  if (!data) return null;

  const chartData = data.bySector.slice(0, 8).map((s) => ({
    name: `CPV ${s.sectorCode}`,
    hhi: s.hhiIndex,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-emerald-50/30 p-4 shadow-[0_8px_32px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] lg:col-span-1">
        <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Регионална конкуренция
        </p>
        <p className="mt-2 font-display text-[1.5rem] font-bold text-[color:var(--color-text-heading)]">
          {data.competitionLabel}
        </p>
        <dl className="mt-4 space-y-2 text-[0.85rem]">
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-text-muted)]">HHI индекс</dt>
            <dd className="font-semibold tabular-nums">{data.hhiIndex}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-text-muted)]">Единствена оферта</dt>
            <dd className="font-semibold tabular-nums">{data.singleBidderSharePercent}%</dd>
          </div>
        </dl>
        <p className="mt-3 text-[0.72rem] text-[color:var(--color-text-muted)]">
          HHI &gt; 2500 = висока концентрация. Данни само за област Смолян.
        </p>
      </div>
      <MonitorChartCard title="HHI по CPV сектор" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <MonitorChartDefs prefix={prefix} />
            <CartesianGrid {...MONITOR_CHART.grid} />
            <XAxis dataKey="name" tick={MONITOR_CHART.axisTickSmall} axisLine={MONITOR_CHART.axisLine} tickLine={false} />
            <YAxis tick={MONITOR_CHART.axisTickSmall} axisLine={false} tickLine={false} />
            <Tooltip {...MONITOR_CHART.tooltip} formatter={(v) => [`${Math.round(Number(v))}`, "HHI индекс"]} />
            <Bar
              dataKey="hhi"
              name="HHI индекс"
              shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-green" })}
            />
          </BarChart>
        </ResponsiveContainer>
      </MonitorChartCard>
    </div>
  );
}
