"use client";

import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatEur } from "../../lib/format";
import type { MonitorFlows } from "../../types";
import {
  FLOW_COLORS,
  buildSankeyGraph,
  nodeColor,
  type SankeyLinkInput,
  type SankeyNodeInput,
} from "./flowSankeyLayout";

interface SankeyNodeLayout extends SankeyNodeInput {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface SankeyLinkLayout {
  id: string;
  source: SankeyNodeLayout;
  target: SankeyNodeLayout;
  value: number;
  kind: "authority" | "subcontract";
  sourceId: string;
  targetId: string;
  count: number;
  flaggedCount?: number;
  concernLabel?: string | null;
  width?: number;
  y0?: number;
  y1?: number;
}

interface MonitorMoneyFlowSankeyChartProps {
  flows: MonitorFlows;
  onAuthorityLinkClick: (source: string, target: string) => void;
}

type HoverTarget =
  | { kind: "link"; id: string }
  | { kind: "node"; id: string }
  | null;

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} млн. €`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} хил. €`;
  return formatEur(value);
}

export function MonitorMoneyFlowSankeyChart({
  flows,
  onAuthorityLinkClick,
}: MonitorMoneyFlowSankeyChartProps) {
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(920);
  const [hover, setHover] = useState<HoverTarget>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    source: string;
    target: string;
    value: number;
    count: number;
    kind: "authority" | "subcontract";
  } | null>(null);

  const raw = useMemo(() => buildSankeyGraph(flows, 14), [flows]);

  const height = useMemo(
    () => Math.max(440, raw.nodes.length * 22 + raw.links.length * 4),
    [raw.links.length, raw.nodes.length],
  );

  const layout = useMemo(() => {
    if (!raw.nodes.length || !raw.links.length) return null;

    const nodes: SankeyNodeLayout[] = raw.nodes.map((n) => ({ ...n }));
    const linksIn = raw.links.map((l) => ({ ...l }));

    const generator = sankey<SankeyNodeLayout, SankeyLinkInput>()
      .nodeId((d) => d.id)
      .nodeWidth(18)
      .nodePadding(14)
      .nodeAlign((node) => {
        if (node.type === "authority") return 0;
        if (node.type === "contractor") return 1;
        return 2;
      })
      .extent([
        [12, 28],
        [width - 200, height - 12],
      ]);

    const graph = generator({
      nodes,
      links: linksIn,
    });

    return {
      nodes: graph.nodes as SankeyNodeLayout[],
      links: graph.links as unknown as SankeyLinkLayout[],
    };
  }, [raw, width, height]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 320) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isHighlighted = useCallback(
    (link: SankeyLinkLayout, node?: SankeyNodeLayout) => {
      if (!hover && !selectedLinkId) return true;
      if (selectedLinkId && link.id === selectedLinkId) return true;
      if (!hover) return selectedLinkId ? link.id === selectedLinkId : true;

      if (hover.kind === "link") {
        return link.id === hover.id;
      }
      if (node) {
        return node.id === hover.id;
      }
      return link.source.id === hover.id || link.target.id === hover.id;
    },
    [hover, selectedLinkId],
  );

  const nodeLit = useCallback(
    (node: SankeyNodeLayout) => {
      if (!hover && !selectedLinkId) return true;
      if (hover?.kind === "node") return node.id === hover.id;
      if (hover?.kind === "link") {
        const link = layout?.links.find((l) => l.id === hover.id);
        return link ? link.source.id === node.id || link.target.id === node.id : false;
      }
      if (selectedLinkId) {
        const link = layout?.links.find((l) => l.id === selectedLinkId);
        return link ? link.source.id === node.id || link.target.id === node.id : false;
      }
      return true;
    },
    [hover, selectedLinkId, layout?.links],
  );

  const handleLinkClick = (link: SankeyLinkLayout) => {
    if (link.kind !== "authority") return;
    setSelectedLinkId(link.id);
    onAuthorityLinkClick(link.sourceId, link.targetId);
  };

  if (!layout) {
    return (
      <p className="py-8 text-center text-[0.88rem] text-[color:var(--color-text-muted)]">
        Няма достатъчно данни за диаграмата.
      </p>
    );
  }

  const linkPath = sankeyLinkHorizontal<SankeyNodeLayout, SankeyLinkLayout>();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default/20 bg-slate-50/80 px-3 py-2 text-[0.72rem] text-[color:var(--color-text-muted)]">
        <span>
          Sankey · топ {raw.topLinkCount} потока · {layout.nodes.length} участника
        </span>
        <span className="flex flex-wrap gap-3">
          {(["authority", "contractor", "subcontractor"] as const).map((t) => (
            <span key={t} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: FLOW_COLORS[t] }} />
              {t === "authority" && "Община"}
              {t === "contractor" && "Изпълнител"}
              {t === "subcontractor" && "Подизпълнител"}
            </span>
          ))}
        </span>
      </div>

      <div
        ref={wrapRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-border-default/15 bg-gradient-to-br from-slate-50/50 via-white to-emerald-50/20"
        onMouseLeave={() => {
          setHover(null);
          setTooltip(null);
        }}
      >
        <svg width={width} height={height} className="min-w-full select-none">
          <defs>
            {layout.links.map((link, i) => (
              <linearGradient
                key={`${uid}-g-${i}`}
                id={`${uid}-g-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={link.source.x1 ?? 0}
                x2={link.target.x0 ?? 0}
                y1={((link.y0 ?? 0) + (link.y1 ?? 0)) / 2}
                y2={((link.y0 ?? 0) + (link.y1 ?? 0)) / 2}
              >
                <stop offset="0%" stopColor={nodeColor(link.source.type)} stopOpacity={0.55} />
                <stop offset="100%" stopColor={nodeColor(link.target.type)} stopOpacity={0.65} />
              </linearGradient>
            ))}
            <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Column guides */}
          {[0.08, 0.46, 0.84].map((pct) => (
            <line
              key={pct}
              x1={width * pct}
              x2={width * pct}
              y1={20}
              y2={height - 12}
              stroke="rgba(148,163,184,0.15)"
              strokeDasharray="4 6"
            />
          ))}
          {["Общини", "Изпълнители", "Подизпълнители"].map((label, colIdx) => (
            <text
              key={label}
              x={width * [0.08, 0.46, 0.84][colIdx]}
              y={14}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider"
            >
              {label}
            </text>
          ))}

          <g>
            {layout.links.map((link, i) => {
              const lit = isHighlighted(link);
              const active = selectedLinkId === link.id;
              const path = linkPath(link);
              if (!path) return null;
              return (
                <path
                  key={link.id}
                  d={path}
                  fill={`url(#${uid}-g-${i})`}
                  stroke={active ? nodeColor(link.source.type) : "transparent"}
                  strokeWidth={active ? 1.5 : 0}
                  opacity={lit ? (active ? 0.92 : 0.72) : 0.1}
                  className={cn(
                    link.kind === "authority" && "cursor-pointer transition-opacity duration-200",
                  )}
                  filter={active ? `url(#${uid}-glow)` : undefined}
                  onMouseEnter={(e) => {
                    setHover({ kind: "link", id: link.id });
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      source: link.source.name,
                      target: link.target.name,
                      value: link.value,
                      count: link.count,
                      kind: link.kind,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
                  }}
                  onMouseLeave={() => {
                    setHover(null);
                    setTooltip(null);
                  }}
                  onClick={() => handleLinkClick(link)}
                />
              );
            })}
          </g>

          <g>
            {layout.nodes.map((node) => {
              const x0 = node.x0 ?? 0;
              const x1 = node.x1 ?? 0;
              const y0 = node.y0 ?? 0;
              const y1 = node.y1 ?? 0;
              const lit = nodeLit(node);
              const color = nodeColor(node.type);
              const labelOnRight = node.type !== "authority";

              return (
                <g
                  key={node.id}
                  opacity={lit ? 1 : 0.25}
                  className="transition-opacity duration-200"
                  onMouseEnter={() => setHover({ kind: "node", id: node.id })}
                  onMouseLeave={() => setHover(null)}
                >
                  <rect
                    x={x0}
                    y={y0}
                    width={Math.max(x1 - x0, 4)}
                    height={Math.max(y1 - y0, 2)}
                    rx={3}
                    fill={color}
                    className="drop-shadow-sm"
                  />
                  <text
                    x={labelOnRight ? x1 + 8 : x0 - 8}
                    y={(y0 + y1) / 2}
                    dy="0.35em"
                    textAnchor={labelOnRight ? "start" : "end"}
                    className="fill-slate-700 text-[11px] font-medium"
                  >
                    {node.name}
                  </text>
                  <text
                    x={labelOnRight ? x1 + 8 : x0 - 8}
                    y={(y0 + y1) / 2 + 13}
                    textAnchor={labelOnRight ? "start" : "end"}
                    className="fill-slate-400 text-[9px] tabular-nums"
                  >
                    {formatCompact(node.totalEur)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-[1200] max-w-[260px] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-[0.75rem] leading-snug text-[color:var(--color-text-heading)] shadow-lg backdrop-blur-sm"
            style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
          >
            <p className="font-semibold">
              {tooltip.source} → {tooltip.target}
            </p>
            <p className="mt-0.5 tabular-nums text-primary">
              {formatCompact(tooltip.value)} · {tooltip.count} дог.
            </p>
            {tooltip.kind === "authority" && (
              <p className="mt-1 text-[0.68rem] text-[color:var(--color-text-muted)]">
                Кликнете за договори и дати
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-[0.72rem] text-[color:var(--color-text-muted)]">
        Задръжте върху лентa или участник за подсветка · кликнете <strong>зелена</strong> лента
        (община→изпълнител) за договори · <strong>оранжевите</strong> ленти показват подизпълнители
      </p>
    </div>
  );
}
