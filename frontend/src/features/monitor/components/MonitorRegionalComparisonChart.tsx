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
import { formatEur } from "../lib/format";
import type { MonitorRegionalComparison } from "../types";

interface MonitorRegionalComparisonChartProps {
  data: MonitorRegionalComparison | null;
  loading?: boolean;
}

export function MonitorRegionalComparisonChart({
  data,
  loading,
}: MonitorRegionalComparisonChartProps) {
  if (loading) {
    return <div className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }

  const rows = data?.municipalities ?? [];
  if (rows.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
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
      <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
        <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Разходи по община</h3>
        <ResponsiveContainer width="100%" height={Math.max(220, chartRows.length * 48)}>
          <BarChart data={chartRows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatEur(Number(v))} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => formatEur(Number(v))} />
            <Bar dataKey="spent" fill="#19861c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <article
            key={row.eik}
            className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4"
          >
            <h4 className="font-display text-[0.9rem] font-semibold">{row.name}</h4>
            <p className="mt-1 font-display text-[1.1rem] font-bold text-primary">
              {formatEur(row.totalSpentEur)}
            </p>
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
