"use client";

import { useId } from "react";
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
import { MonitorOfficialBudgetAssessment } from "./MonitorOfficialBudgetAssessment";
import { MonitorOfficialBudgetTrend } from "./MonitorOfficialBudgetTrend";
import type { MonitorOfficialBudget } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  createPremiumBarShape,
} from "./charts";

function fmtBgn(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return (
    new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 0 }).format(value) + " лв."
  );
}

function num(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

interface MonitorOfficialBudgetPanelProps {
  data: MonitorOfficialBudget | null;
  year: number;
}

export function MonitorOfficialBudgetPanel({ data, year }: MonitorOfficialBudgetPanelProps) {
  const prefix = useId().replace(/:/g, "");

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма въведен официален бюджет за {year} г.
      </div>
    );
  }

  const adopted = data.adoptedTotalBgn != null ? num(data.adoptedTotalBgn) : null;
  const executed = data.executedTotalBgn != null ? num(data.executedTotalBgn) : null;
  const execPct =
    data.executionPercent != null
      ? Math.round(data.executionPercent)
      : executed != null && adopted != null && adopted > 0
        ? Math.round((executed / adopted) * 100)
        : null;

  const chartRows = data.rows.map((r) => ({
    name: r.label.length > 28 ? r.label.slice(0, 26) + "…" : r.label,
    adopted: num(r.adoptedBgn),
    executed: r.executedBgn != null ? num(r.executedBgn) : 0,
    hasExecuted: r.executedBgn != null,
  }));

  const hasExecutedData = executed != null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 px-4 py-3.5 shadow-sm">
        <p className="flex items-start gap-2 text-[0.85rem] font-semibold text-emerald-950">
          <i className="bi bi-bank mt-0.5 shrink-0" aria-hidden />
          Официален бюджет — решение на Общински съвет
        </p>
        <p className="mt-2 text-[0.82rem] leading-relaxed text-[color:var(--color-text-secondary)]">
          Приетият бюджет е в <strong>лева</strong> (както е гласуван). Усвоението е отчетеното изпълнение
          към дата на годишен или междинен финансов отчет — различно от SIGMA договорите по CPV.
        </p>
        {data.note && (
          <p className="mt-2 text-[0.78rem] text-[color:var(--color-text-muted)]">{data.note}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Приет бюджет" value={fmtBgn(adopted)} sub={data.adoptedTotalEur != null ? `≈ ${formatEur(num(data.adoptedTotalEur))}` : undefined} />
        <Stat
          label="Усвоено (отчет)"
          value={hasExecutedData ? fmtBgn(executed) : "—"}
          sub={hasExecutedData && data.executedTotalEur != null ? `≈ ${formatEur(num(data.executedTotalEur))}` : "Очаква се отчет"}
          accent
        />
        <Stat label="Усвоение" value={execPct != null ? `${execPct}%` : "—"} />
        <Stat
          label="Източник"
          value={data.sourceTitle ? "ОбС / smolyan.bg" : "—"}
          sub={data.executionAsOf ? `Отчет към ${data.executionAsOf}` : `${year} г.`}
        />
      </div>

      <MonitorOfficialBudgetAssessment assessment={data.citizenAssessment} year={year} />

      <MonitorOfficialBudgetTrend />

      <MonitorChartCard title={`Официален бюджет ${year} — ${data.municipality}`}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartRows} margin={{ left: 8, right: 8, top: 12, bottom: 4 }} barGap={6} barCategoryGap="18%">
            <MonitorChartDefs prefix={prefix} withPlanned />
            <CartesianGrid {...MONITOR_CHART.grid} />
            <XAxis
              dataKey="name"
              tick={MONITOR_CHART.axisTickSmall}
              interval={0}
              angle={-14}
              textAnchor="end"
              height={80}
              axisLine={MONITOR_CHART.axisLine}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)} млн.`}
              width={48}
              tick={MONITOR_CHART.axisTickSmall}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              {...MONITOR_CHART.tooltip}
              formatter={(v, name) => [fmtBgn(Number(v)), name === "adopted" ? "Приет" : "Усвоено"]}
            />
            <Legend {...MONITOR_CHART.legend} />
            <Bar
              dataKey="adopted"
              name="Приет (лв.)"
              shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-slate" })}
            />
            {hasExecutedData && (
              <Bar
                dataKey="executed"
                name="Усвоено (лв.)"
                shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-green" })}
              />
            )}
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border-default/25 bg-white/60">
          <table className="w-full min-w-[520px] text-left text-[0.82rem]">
            <thead>
              <tr className="border-b border-border-default/40 bg-slate-50/80 text-[color:var(--color-text-muted)]">
                <th className="px-3 py-2.5 font-medium">Раздел</th>
                <th className="px-3 py-2.5 font-medium">Приет (лв.)</th>
                <th className="px-3 py-2.5 font-medium">Усвоено (лв.)</th>
                <th className="px-3 py-2.5 font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-b border-border-default/15">
                  <td className="px-3 py-2.5">{row.label}</td>
                  <td className="px-3 py-2.5 tabular-nums">{fmtBgn(num(row.adoptedBgn))}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-primary">
                    {row.executedBgn != null ? fmtBgn(num(row.executedBgn)) : "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.executionPercent != null ? `${Math.round(row.executionPercent)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.sourceUrl && (
          <p className="mt-3 text-[0.78rem]">
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {data.sourceTitle ?? "Документ на общината"}
            </a>
          </p>
        )}
      </MonitorChartCard>
    </div>
  );
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 via-white to-white p-4 shadow-[0_6px_24px_rgba(25,134,28,0.08)]"
          : "rounded-2xl border border-border-default/35 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
      }
    >
      <p className="text-[0.72rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-[1.1rem] font-bold text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-[0.72rem] text-[color:var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}
