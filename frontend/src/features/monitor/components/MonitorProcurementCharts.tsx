"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cpvLabel } from "../data/cpv-sectors";
import { formatEur } from "../lib/format";
import type { MonitorProcurementStats } from "../types";

const COLORS = ["#19861c", "#48a24c", "#7bc47f", "#a8d5aa", "#c8e6c9", "#2e7d32", "#1b5e20"];

interface MonitorProcurementChartsProps {
  stats: MonitorProcurementStats | null;
  loading?: boolean;
}

export function MonitorProcurementCharts({ stats, loading }: MonitorProcurementChartsProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }
  if (!stats) return null;

  const monthly = stats.monthlySpend.map((m) => ({
    label: `${String(m.month).padStart(2, "0")}/${m.year}`,
    amount: Number(m.amountEur),
  }));

  const yearly = (stats.yearlySpend ?? []).map((y) => ({
    year: String(y.year),
    amount: Number(y.amountEur),
  }));

  const sectors = stats.sectorBreakdown.slice(0, 8).map((s) => ({
    name: cpvLabel(s.sectorCode).replace("CPV ", ""),
    value: Number(s.amountEur),
  }));

  const topCompanies = stats.topCompanies.slice(0, 20).map((c) => ({
    name: c.name.length > 24 ? `${c.name.slice(0, 21)}…` : c.name,
    amount: Number(c.amountEur),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Месечни разходи (EUR)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v) => formatEur(Number(v))} />
            <Line type="monotone" dataKey="amount" stroke="#19861c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {yearly.length > 0 && (
        <ChartCard title="5-годишен тренд">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => formatEur(Number(v))} />
              <Bar dataKey="amount" fill="#19861c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="Разходи по CPV сектор">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={sectors} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {sectors.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatEur(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Топ 20 фирми по стойност" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={Math.max(280, topCompanies.length * 28)}>
          <BarChart data={topCompanies} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => formatEur(Number(v))} />
            <Bar dataKey="amount" fill="#19861c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4 shadow-[0_2px_16px_rgba(15,23,42,0.04)] ${className ?? ""}`}
    >
      <h3 className="mb-3 font-display text-[0.9rem] font-semibold text-[color:var(--color-text-heading)]">
        {title}
      </h3>
      {children}
    </div>
  );
}
