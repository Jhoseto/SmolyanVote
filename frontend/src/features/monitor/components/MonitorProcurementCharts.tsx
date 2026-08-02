"use client";

import { useId } from "react";
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
import type { MonitorProcurementStats } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  createPremiumBarShape,
  PremiumBarShape,
  gradientId,
  formatChartAxisThousands,
  eurTooltipItem,
} from "./charts";

interface MonitorProcurementChartsProps {
  stats: MonitorProcurementStats | null;
  loading?: boolean;
}

export function MonitorProcurementCharts({ stats, loading }: MonitorProcurementChartsProps) {
  const prefix = useId().replace(/:/g, "");

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner" />
    );
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
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <MonitorChartDefs prefix={prefix} withArea />
            <CartesianGrid {...MONITOR_CHART.grid} />
            <XAxis dataKey="label" tick={MONITOR_CHART.axisTickSmall} axisLine={MONITOR_CHART.axisLine} tickLine={false} />
            <YAxis
              tick={MONITOR_CHART.axisTickSmall}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatChartAxisThousands}
            />
            <Tooltip {...MONITOR_CHART.tooltip} formatter={(v) => eurTooltipItem(v)} />
            <Line
              type="monotone"
              dataKey="amount"
              name="Сума"
              fill={`url(#${gradientId(prefix, "area-green")})`}
              stroke={`url(#${gradientId(prefix, "line-green")})`}
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#19861c",
                stroke: "#fff",
                strokeWidth: 2,
                filter: `url(#${gradientId(prefix, "glow-green")})`,
              }}
              activeDot={{ r: 6, fill: "#5fd068", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {yearly.length > 0 && (
        <ChartCard title="5-годишен тренд">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <MonitorChartDefs prefix={prefix} />
              <CartesianGrid {...MONITOR_CHART.grid} />
              <XAxis dataKey="year" tick={MONITOR_CHART.axisTick} axisLine={MONITOR_CHART.axisLine} tickLine={false} />
              <YAxis
                tick={MONITOR_CHART.axisTickSmall}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatChartAxisThousands}
              />
              <Tooltip {...MONITOR_CHART.tooltip} formatter={(v) => eurTooltipItem(v)} />
              <Bar
                dataKey="amount"
                name="Сума"
                shape={createPremiumBarShape(prefix, { orientation: "vertical", fillKey: "bar-green" })}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="Разходи по CPV сектор">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <MonitorChartDefs prefix={prefix} sliceCount={sectors.length || 8} />
            <Pie
              data={sectors}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={88}
              paddingAngle={3}
              stroke="#fff"
              strokeWidth={2}
              filter={`url(#${gradientId(prefix, "shadow")})`}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {sectors.map((_, i) => (
                <Cell key={i} fill={`url(#${gradientId(prefix, `pie-${i}`)})`} />
              ))}
            </Pie>
            <Tooltip
              {...MONITOR_CHART.tooltip}
              formatter={(v, name) => eurTooltipItem(v, String(name ?? "Сума"))}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Топ 20 фирми по стойност" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={Math.max(300, topCompanies.length * 30)}>
          <BarChart data={topCompanies} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
            <MonitorChartDefs prefix={prefix} withAmber />
            <CartesianGrid {...MONITOR_CHART.gridVertical} />
            <XAxis
              type="number"
              tick={MONITOR_CHART.axisTickSmall}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatChartAxisThousands}
            />
            <YAxis type="category" dataKey="name" width={120} tick={MONITOR_CHART.axisTickSmall} axisLine={false} tickLine={false} />
            <Tooltip
              {...MONITOR_CHART.tooltip}
              formatter={(v, name) => eurTooltipItem(v, String(name ?? "Сума"))}
            />
            <Bar
              dataKey="amount"
              name="Сума"
              shape={(props) => {
                const idx = topCompanies.findIndex((r) => r.name === (props as { payload?: { name?: string } }).payload?.name);
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
    <MonitorChartCard title={title} className={className}>
      {children}
    </MonitorChartCard>
  );
}
