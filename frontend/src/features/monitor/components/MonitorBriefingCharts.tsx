"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonitorBriefingChartPoint } from "../types";
import {
  MONITOR_CHART,
  MonitorChartCard,
  MonitorChartDefs,
  createPremiumBarShape,
  gradientId,
} from "./charts";

interface MonitorBriefingChartsProps {
  riskChart: MonitorBriefingChartPoint[];
  councilChart: MonitorBriefingChartPoint[];
}

function aggregateByDisplayLabel(points: MonitorBriefingChartPoint[]) {
  const merged = new Map<string, { name: string; count: number; fill: string; index: number }>();
  let idx = 0;
  for (const p of points) {
    const name = p.label.length > 18 ? `${p.label.slice(0, 16)}…` : p.label;
    const existing = merged.get(name);
    if (existing) {
      existing.count += p.count;
    } else {
      merged.set(name, { name, count: p.count, fill: p.color, index: idx++ });
    }
  }
  return [...merged.values()];
}

export function MonitorBriefingCharts({ riskChart, councilChart }: MonitorBriefingChartsProps) {
  const prefix = useId().replace(/:/g, "");

  if (riskChart.length === 0 && councilChart.length === 0) return null;

  const riskData = aggregateByDisplayLabel(riskChart);

  const councilMerged = new Map<string, { name: string; value: number; fill: string }>();
  for (const p of councilChart) {
    const existing = councilMerged.get(p.label);
    if (existing) {
      existing.value += p.count;
    } else {
      councilMerged.set(p.label, { name: p.label, value: p.count, fill: p.color });
    }
  }
  const councilData = [...councilMerged.values()];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {riskData.length > 0 && (
        <MonitorChartCard title="Рискови теми — къде да обърнете внимание">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
              <MonitorChartDefs prefix={prefix} sliceCount={riskData.length} />
              <XAxis type="number" tick={MONITOR_CHART.axisTickSmall} allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={MONITOR_CHART.axisTickSmall} axisLine={false} tickLine={false} />
              <Tooltip {...MONITOR_CHART.tooltip} formatter={(v) => [`${v ?? 0} случая`, "Брой"]} />
              <Bar
                dataKey="count"
                shape={createPremiumBarShape(prefix, { orientation: "horizontal", fillKey: "bar-green" })}
              />
            </BarChart>
          </ResponsiveContainer>
        </MonitorChartCard>
      )}

      {councilData.length > 0 && (
        <MonitorChartCard title="Документи от smolyan.bg — какво следим">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <MonitorChartDefs prefix={prefix} sliceCount={councilData.length} />
              <Pie
                data={councilData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={82}
                paddingAngle={3}
                stroke="#fff"
                strokeWidth={2}
                filter={`url(#${gradientId(prefix, "shadow")})`}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {councilData.map((_, index) => (
                  <Cell key={`council-${index}`} fill={`url(#${gradientId(prefix, `pie-${index}`)})`} />
                ))}
              </Pie>
              <Tooltip {...MONITOR_CHART.tooltip} formatter={(v) => [`${v ?? 0} документа`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </MonitorChartCard>
      )}
    </div>
  );
}
