"use client";

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

interface MonitorCompetitionPanelProps {
  data: MonitorCompetition | null;
  loading?: boolean;
}

export function MonitorCompetitionPanel({ data, loading }: MonitorCompetitionPanelProps) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }
  if (!data) return null;

  const chartData = data.bySector.slice(0, 8).map((s) => ({
    name: `CPV ${s.sectorCode}`,
    hhi: s.hhiIndex,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4 lg:col-span-1">
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
      <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4 lg:col-span-2">
        <h3 className="mb-3 font-display text-[0.9rem] font-semibold">HHI по CPV сектор</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="hhi" fill="#19861c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
