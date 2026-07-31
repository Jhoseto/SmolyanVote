"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEur } from "../lib/format";
import type { MonitorBudget } from "../types";

interface MonitorBudgetChartProps {
  budget: MonitorBudget | null;
  loading?: boolean;
}

export function MonitorBudgetChart({ budget, loading }: MonitorBudgetChartProps) {
  if (loading) {
    return <div className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }
  if (!budget) return null;

  const chartRows = budget.rows.map((r) => ({
    name: r.label.replace(" и ", " & "),
    planned: Number(r.plannedEur),
    executed: Number(r.executedEur),
  }));

  const hasAnyBar = chartRows.some((r) => r.planned > 0 || r.executed > 0);
  const execPct =
    budget.totalPlannedEur > 0
      ? Math.round((budget.totalExecutedEur / budget.totalPlannedEur) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {budget.note && (
        <p className="rounded-[var(--radius-md)] border border-blue-200/50 bg-blue-50/50 px-4 py-3 text-[0.85rem] leading-relaxed text-[color:var(--color-text-secondary)]">
          {budget.note}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={budget.plannedAvailable ? "Планирано (Смолян)" : "Планирано"}
          value={budget.plannedAvailable ? formatEur(budget.totalPlannedEur) : "—"}
        />
        <Stat label="Изпълнено (SIGMA)" value={formatEur(budget.totalExecutedEur)} />
        <Stat
          label="Изпълнение"
          value={budget.plannedAvailable && budget.totalPlannedEur > 0 ? `${execPct}%` : "—"}
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
        <h3 className="mb-3 font-display text-[0.95rem] font-semibold">
          Бюджет {budget.year} — {budget.municipality}
        </h3>

        {!hasAnyBar ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
            Няма данни за графиката — проверете SIGMA import или изберете друга община.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartRows} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={70} />
              <YAxis tickFormatter={(v) => formatEur(Number(v))} width={80} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatEur(Number(v))} />
              <Legend />
              {budget.plannedAvailable && (
                <Bar dataKey="planned" name="План" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              )}
              <Bar dataKey="executed" name="Изпълнено" fill="#19861c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <p className="mt-3 text-[0.78rem] text-[color:var(--color-text-muted)]">
          Изпълнението се изчислява от подписани договори в SIGMA/EOP за {budget.year} г., групирани по CPV
          сектор. Плановите стойности са индикативни за Община Смолян.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
      <p className="text-[0.72rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-[1.2rem] font-bold text-primary">{value}</p>
    </div>
  );
}
