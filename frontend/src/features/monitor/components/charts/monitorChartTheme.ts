/** Shared Recharts styling for citizen monitor — gradients, axes, tooltips. */

import { formatEur } from "../../lib/format";

/** Y-axis tick — thousands in EUR (e.g. 2500 хил.). */
export function formatChartAxisThousands(v: number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1_000_000) {
    return `${Math.round(n / 1_000_000)} млн.`;
  }
  return `${Math.round(n / 1000)} хил.`;
}

/** Tooltip row for monetary values. */
export function eurTooltipItem(value: unknown, label = "Сума"): [string, string] {
  return [formatEur(Number(value)), label];
}

export const MONITOR_CHART = {
  grid: {
    stroke: "rgba(148, 163, 184, 0.22)",
    strokeDasharray: "4 10",
    vertical: false,
  },
  gridVertical: {
    stroke: "rgba(148, 163, 184, 0.18)",
    strokeDasharray: "4 10",
    horizontal: false,
  },
  axisTick: {
    fill: "#64748b",
    fontSize: 11,
    fontWeight: 500,
  },
  axisTickSmall: {
    fill: "#64748b",
    fontSize: 10,
    fontWeight: 500,
  },
  axisLine: { stroke: "rgba(148, 163, 184, 0.35)" },
  tooltip: {
    contentStyle: {
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.85)",
      background: "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
      boxShadow:
        "0 14px 36px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,1)",
      padding: "10px 14px",
      fontSize: 12,
      fontWeight: 500,
    },
    labelStyle: {
      color: "#334155",
      fontWeight: 600,
      marginBottom: 4,
    },
    itemStyle: {
      color: "#19861c",
      fontWeight: 600,
    },
    cursor: { fill: "rgba(25, 134, 28, 0.06)", radius: 6 },
  },
  legend: {
    wrapperStyle: { fontSize: 12, fontWeight: 600, paddingTop: 8 },
  },
} as const;

/** Premium green palette for pies / multi-series. */
export const MONITOR_CHART_PALETTE = [
  { main: "#19861c", light: "#5fd068", dark: "#0d5c12" },
  { main: "#48a24c", light: "#8fd892", dark: "#2e6b32" },
  { main: "#0ea5e9", light: "#7dd3fc", dark: "#0369a1" },
  { main: "#8b5cf6", light: "#c4b5fd", dark: "#6d28d9" },
  { main: "#f59e0b", light: "#fcd34d", dark: "#b45309" },
  { main: "#14b8a6", light: "#5eead4", dark: "#0f766e" },
  { main: "#ec4899", light: "#f9a8d4", dark: "#be185d" },
  { main: "#64748b", light: "#cbd5e1", dark: "#334155" },
] as const;

export function gradientId(prefix: string, key: string) {
  return `${prefix}-${key}`;
}
