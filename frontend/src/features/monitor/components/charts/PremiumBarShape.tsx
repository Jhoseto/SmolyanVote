"use client";

import { gradientId } from "./monitorChartTheme";

type RectGeom = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type PremiumBarShapeOptions = RectGeom & {
  orientation?: "vertical" | "horizontal";
  fillKey?: "bar-green" | "bar-slate" | "bar-amber" | string;
  prefix: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 3D extruded bar with gradient faces and soft shadow. */
export function PremiumBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  orientation = "vertical",
  fillKey = "bar-green",
  prefix,
}: PremiumBarShapeOptions) {
  if (width <= 0 || height <= 0) return null;

  const mainFill = fillKey.startsWith("bar-")
    ? `url(#${gradientId(prefix, fillKey)})`
    : fillKey;

  if (orientation === "horizontal") {
    const depth = clamp(height * 0.22, 3, 7);
    const r = clamp(height / 3, 3, 6);
    const mainH = height - depth * 0.55;

    return (
      <g filter={`url(#${gradientId(prefix, "shadow")})`}>
        <path
          d={`M ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} V ${y + mainH - r} Q ${x + width} ${y + mainH} ${x + width - r} ${y + mainH} H ${x + depth + r} Q ${x + depth} ${y + mainH} ${x + depth} ${y + mainH - r} V ${y + depth + r} Q ${x + depth} ${y + depth} ${x + depth + r} ${y + depth} H ${x + width - r} L ${x + width + depth * 0.85} ${y + depth * 0.45} L ${x + width + depth * 0.85} ${y + mainH + depth * 0.35} L ${x + width - r} ${y + mainH} Z`}
          fill={`url(#${gradientId(prefix, "bar-green-side")})`}
          opacity={0.85}
        />
        <rect
          x={x}
          y={y + depth * 0.45}
          width={width}
          height={mainH}
          rx={r}
          fill={mainFill}
        />
        <rect
          x={x + 2}
          y={y + depth * 0.45 + 2}
          width={Math.max(width * 0.28, 4)}
          height={Math.max(mainH - 4, 0)}
          rx={r / 2}
          fill="rgba(255,255,255,0.2)"
        />
      </g>
    );
  }

  const depth = clamp(width * 0.18, 4, 9);
  const r = clamp(width / 3.5, 4, 8);
  const mainW = width - depth * 0.55;

  return (
    <g filter={`url(#${gradientId(prefix, "shadow")})`}>
      <path
        d={`M ${x + mainW} ${y + r} L ${x + mainW + depth} ${y + r - depth * 0.35} L ${x + mainW + depth} ${y + height - r + depth * 0.2} L ${x + mainW} ${y + height - r} Z`}
        fill={`url(#${gradientId(prefix, "bar-green-side")})`}
        opacity={0.9}
      />
      <path
        d={`M ${x + r} ${y} H ${x + mainW - r} Q ${x + mainW} ${y} ${x + mainW} ${y + r} L ${x + mainW + depth} ${y + r - depth * 0.35} L ${x + mainW + depth - r * 0.4} ${y - depth * 0.15} Q ${x + mainW - r * 0.5} ${y - depth * 0.55} ${x + r} ${y - depth * 0.55} Q ${x} ${y - depth * 0.55} ${x} ${y + r - depth * 0.55} Z`}
        fill={`url(#${gradientId(prefix, "bar-green-top")})`}
        opacity={0.95}
      />
      <rect x={x} y={y} width={mainW} height={height} rx={r} fill={mainFill} />
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(mainW * 0.32, 4)}
        height={Math.max(height - 4, 0)}
        rx={r / 2}
        fill="rgba(255,255,255,0.22)"
      />
    </g>
  );
}

/** Recharts `Bar` shape factory — keeps TS happy with Recharts prop bags. */
export function createPremiumBarShape(
  prefix: string,
  options: Omit<PremiumBarShapeOptions, "prefix" | keyof RectGeom> = {},
) {
  return function renderPremiumBar(props: unknown) {
    const { x, y, width, height } = (props ?? {}) as RectGeom;
    return (
      <PremiumBarShape
        x={x}
        y={y}
        width={width}
        height={height}
        prefix={prefix}
        {...options}
      />
    );
  };
}
