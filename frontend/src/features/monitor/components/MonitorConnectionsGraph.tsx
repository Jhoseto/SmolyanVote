"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { formatEur } from "../lib/format";
import type { MonitorConnections } from "../types";

interface MonitorConnectionsGraphProps {
  connections: MonitorConnections | null;
  loading?: boolean;
  title?: string;
  compact?: boolean;
}

/** Simplified public network — authorities (left) ↔ top contractors (right). */
export function MonitorConnectionsGraph({
  connections,
  loading,
  title = "Мрежа от връзки",
  compact,
}: MonitorConnectionsGraphProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]",
          compact ? "h-48" : "h-80",
        )}
      />
    );
  }

  if (!connections || connections.links.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-6 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма достатъчно данни за мрежата. Стартирайте SIGMA import.
      </p>
    );
  }

  const authorities = connections.nodes.filter((n) => n.type === "authority");
  const contractors = connections.nodes.filter((n) => n.type === "contractor");
  const maxValue = Math.max(...connections.links.map((l) => l.valueEur), 1);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
      <h3 className="mb-1 font-display text-[0.95rem] font-semibold">{title}</h3>
      <p className="mb-4 text-[0.78rem] text-[color:var(--color-text-muted)]">
        Топ изпълнители и възложители в област Смолян — дебелината на линиите е пропорционална на сумата.
      </p>

      <div className="relative overflow-x-auto">
        <svg
          viewBox="0 0 720 360"
          className={cn("mx-auto w-full min-w-[320px]", compact ? "max-h-[220px]" : "max-h-[360px]")}
          role="img"
          aria-label="Граф на връзки между възложители и изпълнители"
        >
          {connections.links.map((link) => {
            const source = connections.nodes.find((n) => n.id === link.source);
            const target = connections.nodes.find((n) => n.id === link.target);
            if (!source || !target) return null;
            const sIdx = authorities.some((a) => a.id === source.id)
              ? authorities.findIndex((a) => a.id === source.id)
              : contractors.findIndex((c) => c.id === source.id);
            const tIdx = contractors.some((c) => c.id === target.id)
              ? contractors.findIndex((c) => c.id === target.id)
              : authorities.findIndex((a) => a.id === target.id);
            const x1 = source.type === "authority" ? 140 : 580;
            const x2 = target.type === "authority" ? 140 : 580;
            const y1 = 40 + (sIdx >= 0 ? sIdx : 0) * (280 / Math.max(authorities.length, contractors.length, 1));
            const y2 = 40 + (tIdx >= 0 ? tIdx : 0) * (280 / Math.max(contractors.length, authorities.length, 1));
            const stroke = 1 + (link.valueEur / maxValue) * 8;
            return (
              <line
                key={`${link.source}-${link.target}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#19861c"
                strokeOpacity={0.25 + (link.valueEur / maxValue) * 0.45}
                strokeWidth={stroke}
              />
            );
          })}

          {authorities.map((node, i) => (
            <NodeBubble
              key={node.id}
              x={140}
              y={40 + i * (280 / Math.max(authorities.length - 1, 1))}
              node={node}
              tone="authority"
            />
          ))}
          {contractors.map((node, i) => (
            <NodeBubble
              key={node.id}
              x={580}
              y={40 + i * (280 / Math.max(contractors.length - 1, 1))}
              node={node}
              tone="contractor"
            />
          ))}

          <text x={140} y={20} textAnchor="middle" className="fill-[#64748b] text-[11px] font-semibold">
            Възложители
          </text>
          <text x={580} y={20} textAnchor="middle" className="fill-[#64748b] text-[11px] font-semibold">
            Изпълнители
          </text>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {contractors.slice(0, compact ? 4 : 6).map((node) => (
          <Link
            key={node.id}
            href={`/monitor/company/${node.id.replace("co:", "")}`}
            className="rounded-full border border-border-default/40 bg-primary-50/60 px-2.5 py-1 text-[0.72rem] font-medium text-primary hover:bg-primary-50"
          >
            {truncate(node.label, 28)} · {formatEur(node.totalEur)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NodeBubble({
  x,
  y,
  node,
  tone,
}: {
  x: number;
  y: number;
  node: MonitorConnections["nodes"][0];
  tone: "authority" | "contractor";
}) {
  const r = Math.min(28, 10 + Math.sqrt(node.totalEur / 50000));
  const fill = tone === "authority" ? "#19861c" : "#0ea5e9";
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} fillOpacity={0.85} />
      <title>
        {node.label} — {formatEur(node.totalEur)} ({node.linkCount} връзки)
      </title>
      <text
        x={x}
        y={y + r + 14}
        textAnchor="middle"
        className="fill-[#334155] text-[10px] font-medium"
      >
        {truncate(node.label, 18)}
      </text>
    </g>
  );
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
