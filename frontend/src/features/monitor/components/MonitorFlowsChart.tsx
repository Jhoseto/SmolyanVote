"use client";

import { useMemo } from "react";
import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from "recharts";
import { formatEur } from "../lib/format";
import type { MonitorFlows } from "../types";

interface MonitorFlowsChartProps {
  flows: MonitorFlows | null;
  loading?: boolean;
}

/** Simplified Sankey via Recharts — authority → contractor money flows. */
export function MonitorFlowsChart({ flows, loading }: MonitorFlowsChartProps) {
  const data = useMemo(() => {
    if (!flows) return null;
    const nodes = flows.nodes.map((n) => ({ name: n.label }));
    const links = flows.links
      .filter((l) => l.valueEur > 0)
      .slice(0, 30)
      .map((l) => {
        const sourceIdx = flows.nodes.findIndex((n) => n.id === l.source);
        const targetIdx = flows.nodes.findIndex((n) => n.id === l.target);
        return { source: sourceIdx, target: targetIdx, value: Number(l.valueEur) };
      })
      .filter((l) => l.source >= 0 && l.target >= 0);
    return { nodes, links };
  }, [flows]);

  if (loading) {
    return <div className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }
  if (!data || data.links.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма достатъчно данни за диаграма на потоците. Стартирайте SIGMA import от админ панела.
      </p>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
      <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Парични потоци: възложител → изпълнител</h3>
      <ResponsiveContainer width="100%" height={360}>
        <Sankey
          data={data}
          node={<SankeyNode />}
          link={{ stroke: "#19861c55" }}
          nodePadding={24}
          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
        >
          <Tooltip formatter={(v) => formatEur(Number(v))} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}

function SankeyNode(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name?: string };
  containerWidth?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, payload, containerWidth = 0 } = props;
  const isOut = x + width + 6 > containerWidth / 2;
  return (
    <Layer key={`node-${index}`}>
      <Rectangle x={x} y={y} width={width} height={height} fill="#19861c" fillOpacity={0.85} radius={2} />
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isOut ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={10}
        fill="#334155"
      >
        {payload?.name}
      </text>
    </Layer>
  );
}
