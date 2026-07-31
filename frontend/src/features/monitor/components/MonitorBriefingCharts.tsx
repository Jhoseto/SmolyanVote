"use client";

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

interface MonitorBriefingChartsProps {
  riskChart: MonitorBriefingChartPoint[];
  councilChart: MonitorBriefingChartPoint[];
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/25 bg-white/95 p-4">
      <h3 className="mb-3 font-display text-[0.88rem] font-semibold text-[color:var(--color-text-heading)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function aggregateByDisplayLabel(points: MonitorBriefingChartPoint[]) {
  const merged = new Map<string, { name: string; count: number; fill: string }>();
  for (const p of points) {
    const name = p.label.length > 18 ? `${p.label.slice(0, 16)}…` : p.label;
    const existing = merged.get(name);
    if (existing) {
      existing.count += p.count;
    } else {
      merged.set(name, { name, count: p.count, fill: p.color });
    }
  }
  return [...merged.values()];
}

export function MonitorBriefingCharts({ riskChart, councilChart }: MonitorBriefingChartsProps) {
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
        <ChartCard title="Рискови теми — къде да обърнете внимание">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v ?? 0} случая`, "Брой"]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {riskData.map((entry, index) => (
                  <Cell key={`risk-${index}-${entry.name}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {councilData.length > 0 && (
        <ChartCard title="Документи от smolyan.bg — какво следим">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={councilData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={78}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {councilData.map((entry, index) => (
                  <Cell key={`council-${index}-${entry.name}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v ?? 0} документа`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
