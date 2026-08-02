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
import { formatEur } from "../lib/format";
import type { MonitorBudget } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  createPremiumBarShape,
  eurTooltipItem,
} from "./charts";
import { formatBudgetPeriod } from "./MonitorBudgetYearFilter";

interface MonitorBudgetChartProps {
  budget: MonitorBudget | null;
  loading?: boolean;
}

function num(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function MonitorBudgetChart({ budget, loading }: MonitorBudgetChartProps) {
  const prefix = useId().replace(/:/g, "");

  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner" />;
  }
  if (!budget) {
    return (
      <p className="rounded-2xl border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма данни за бюджета.
      </p>
    );
  }

  const totalPlanned = num(budget.totalPlannedEur);
  const totalExecuted = num(budget.totalExecutedEur);

  const chartRows = budget.rows.map((r) => ({
    name: r.label.replace(" и ", " & "),
    planned: num(r.plannedEur),
    executed: num(r.executedEur),
  }));

  const hasAnyBar = chartRows.some((r) => r.planned > 0 || r.executed > 0);
  const execPct = totalPlanned > 0 ? Math.round((totalExecuted / totalPlanned) * 100) : 0;

  const periodLabel = formatBudgetPeriod(budget.year, budget.yearTo ?? budget.year);
  const isRange = budget.year !== (budget.yearTo ?? budget.year);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 to-orange-50/40 px-4 py-3.5 shadow-sm">
        <p className="flex items-start gap-2 text-[0.85rem] font-semibold text-amber-950">
          <i className="bi bi-info-circle mt-0.5 shrink-0" aria-hidden />
          Аналитичен модул — не е официалният общински бюджет
        </p>
        <p className="mt-2 text-[0.82rem] leading-relaxed text-[color:var(--color-text-secondary)]">
          Планираните ~18 млн. € са <strong>индикативна рамка</strong> за 5 CPV сектора (инфраструктура,
          околна среда, образование, социални услуги, администрация), не целият бюджет на общината — той е
          многократно по-голям и се гласува в лева. Изпълнението е <strong>реална сума</strong> от сключени
          договори в SIGMA/ЦАИС ЕОП за същия CPV обхват; процентите са математически коректни в рамките на
          този модул.
        </p>
      </div>

      {budget.note && (
        <p className="rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-sky-50/40 px-4 py-3 text-[0.85rem] leading-relaxed text-[color:var(--color-text-secondary)] shadow-sm">
          {budget.note}
          {budget.dataBasis && (
            <span className="mt-2 block text-[0.78rem] text-[color:var(--color-text-muted)]">
              {budget.dataBasis}
            </span>
          )}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={isRange ? "Индикативен план" : budget.plannedAvailable ? "Индикативен план (CPV)" : "План"}
          value={budget.plannedAvailable ? formatEur(totalPlanned) : "—"}
        />
        <Stat
          label={isRange ? "Изпълнено (SIGMA)" : "Изпълнено (SIGMA/EOP)"}
          value={formatEur(totalExecuted)}
          accent
        />
        <Stat
          label={isRange ? "Договори за периода" : "Договори"}
          value={String(budget.contractCount ?? 0)}
        />
        <Stat
          label="Изпълнение спрямо план"
          value={budget.plannedAvailable && totalPlanned > 0 ? `${execPct}%` : "—"}
        />
      </div>

      <MonitorChartCard title={`CPV анализ ${periodLabel} — ${budget.municipality}`}>
        {!hasAnyBar ? (
          <p className="rounded-xl border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
            {totalExecuted > 0
              ? "Има изпълнение, но липсват категории за графиката — redeploy на backend или Admin → Monitor → Budget."
              : `Няма договори със стойност за ${periodLabel} — пуснете SIGMA import или сменете периода/общината.`}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={chartRows} margin={{ left: 8, right: 8, top: 12, bottom: 4 }} barGap={6} barCategoryGap="18%">
              <MonitorChartDefs prefix={prefix} withPlanned />
              <CartesianGrid {...MONITOR_CHART.grid} />
              <XAxis
                dataKey="name"
                tick={MONITOR_CHART.axisTickSmall}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={72}
                axisLine={MONITOR_CHART.axisLine}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatEur(Number(v))}
                width={84}
                tick={MONITOR_CHART.axisTickSmall}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...MONITOR_CHART.tooltip}
                formatter={(v, name) => {
                  const label =
                    name === "planned" || name === "Индикативен план"
                      ? "Индикативен план"
                      : name === "executed" || name === "Изпълнено"
                        ? "Изпълнено"
                        : String(name ?? "Сума");
                  return eurTooltipItem(v, label);
                }}
              />
              <Legend {...MONITOR_CHART.legend} />
              {budget.plannedAvailable && (
                <Bar
                  dataKey="planned"
                  name="Индикативен план"
                  shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-slate" })}
                />
              )}
              <Bar
                dataKey="executed"
                name="Изпълнено"
                shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-green" })}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {budget.rows.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border-default/25 bg-white/60">
            <table className="w-full min-w-[480px] text-left text-[0.82rem]">
              <thead>
                <tr className="border-b border-border-default/40 bg-slate-50/80 text-[color:var(--color-text-muted)]">
                  <th className="px-3 py-2.5 font-medium">Категория</th>
                  {budget.plannedAvailable && <th className="px-3 py-2.5 font-medium">Индик. план</th>}
                  <th className="px-3 py-2.5 font-medium">Изпълнено</th>
                  {budget.plannedAvailable && <th className="px-3 py-2.5 font-medium">%</th>}
                </tr>
              </thead>
              <tbody>
                {budget.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border-default/15 hover:bg-emerald-50/30">
                    <td className="px-3 py-2.5">{row.label}</td>
                    {budget.plannedAvailable && (
                      <td className="px-3 py-2.5 tabular-nums">{formatEur(num(row.plannedEur))}</td>
                    )}
                    <td className="px-3 py-2.5 tabular-nums font-semibold text-primary">
                      {formatEur(num(row.executedEur))}
                    </td>
                    {budget.plannedAvailable && (
                      <td className="px-3 py-2.5 tabular-nums">
                        {num(row.plannedEur) > 0 ? `${Math.round(row.executionPercent)}%` : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-[0.78rem] text-[color:var(--color-text-muted)]">
          {budget.plannedAvailable
            ? "Индикативният CPV план за Община Смолян е мащабиран по приетия ObS бюджет за избраната година (база 2025). За официални цифри вижте таб „Официален бюджет“."
            : "За избраната община показваме само изпълнение от SIGMA/EOP — индикативният план е само за Община Смолян."}
        </p>
      </MonitorChartCard>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 via-white to-white p-4 shadow-[0_6px_24px_rgba(25,134,28,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]"
          : "rounded-2xl border border-border-default/35 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]"
      }
    >
      <p className="text-[0.72rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-[1.2rem] font-bold text-primary">{value}</p>
    </div>
  );
}
