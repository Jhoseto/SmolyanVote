"use client";

import { MONITOR_CHART_PALETTE, gradientId } from "./monitorChartTheme";

interface MonitorChartDefsProps {
  /** Unique prefix per chart instance (use React useId). */
  prefix: string;
  /** Include slate gradient for planned / neutral bars. */
  withPlanned?: boolean;
  /** Include amber accent (top contractor). */
  withAmber?: boolean;
  /** Include line/area gradient. */
  withArea?: boolean;
  sliceCount?: number;
}

export function MonitorChartDefs({
  prefix,
  withPlanned = false,
  withAmber = false,
  withArea = false,
  sliceCount = MONITOR_CHART_PALETTE.length,
}: MonitorChartDefsProps) {
  return (
    <defs>
      <filter id={gradientId(prefix, "shadow")} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.14" />
      </filter>
      <filter id={gradientId(prefix, "glow-green")} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#19861c" floodOpacity="0.35" />
      </filter>

      <linearGradient id={gradientId(prefix, "bar-green")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#72d878" />
        <stop offset="38%" stopColor="#19861c" />
        <stop offset="100%" stopColor="#0a4a0d" />
      </linearGradient>
      <linearGradient id={gradientId(prefix, "bar-green-side")} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#157118" />
        <stop offset="100%" stopColor="#063a08" />
      </linearGradient>
      <linearGradient id={gradientId(prefix, "bar-green-top")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a8efb0" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#3dba44" stopOpacity="0.85" />
      </linearGradient>

      {withPlanned && (
        <linearGradient id={gradientId(prefix, "bar-slate")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      )}

      {withAmber && (
        <linearGradient id={gradientId(prefix, "bar-amber")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      )}

      {withArea && (
        <>
          <linearGradient id={gradientId(prefix, "area-green")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#19861c" stopOpacity={0.38} />
            <stop offset="100%" stopColor="#19861c" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={gradientId(prefix, "line-green")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a4a0d" />
            <stop offset="50%" stopColor="#19861c" />
            <stop offset="100%" stopColor="#5fd068" />
          </linearGradient>
        </>
      )}

      {Array.from({ length: sliceCount }).map((_, i) => {
        const c = MONITOR_CHART_PALETTE[i % MONITOR_CHART_PALETTE.length];
        const id = gradientId(prefix, `pie-${i}`);
        return (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.light} />
            <stop offset="55%" stopColor={c.main} />
            <stop offset="100%" stopColor={c.dark} />
          </linearGradient>
        );
      })}
    </defs>
  );
}
