import type { MonitorFlows } from "../../types";

export const FLOW_COLORS = {
  authority: "#17CBEA",
  contractor: "#19861c",
  subcontractor: "#FB7E14",
} as const;

export type FlowNodeType = "authority" | "contractor" | "subcontractor";

export interface SankeyNodeInput {
  id: string;
  name: string;
  type: FlowNodeType;
  totalEur: number;
}

export interface SankeyLinkInput {
  id: string;
  source: string;
  target: string;
  value: number;
  kind: "authority" | "subcontract";
  sourceId: string;
  targetId: string;
  count: number;
  flaggedCount?: number;
  concernLabel?: string | null;
}

export function shortenMunicipality(name: string): string {
  return name
    .replace(/^ОБЩИНА\s+/i, "Община ")
    .replace(/^Кмет на община\s+/i, "Община ")
    .replace(/^Кмет на Община\s+/i, "Община ")
    .trim();
}

export function shortenCompany(name: string, max = 32): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

type FlowLink = MonitorFlows["links"][number];

function resolveSubcontractorForLink(
  link: FlowLink,
  flows: MonitorFlows,
): { target: string; value: number; count: number; name: string } | null {
  const top = link.topSubcontractors?.[0];
  if (top?.eik && top.valueEur > 0) {
    return {
      target: `sub:${top.eik}`,
      value: top.valueEur,
      count: top.count,
      name: top.name,
    };
  }
  if (link.subcontractorEik && link.subcontractingTotalEur && link.subcontractingTotalEur > 0) {
    return {
      target: `sub:${link.subcontractorEik}`,
      value: link.subcontractingTotalEur,
      count: link.contractsWithSubcontractor ?? 1,
      name: link.subcontractorName ?? link.subcontractorEik,
    };
  }
  const coId = link.target.startsWith("co:") ? link.target : link.source;
  const sub = (flows.subLinks ?? [])
    .filter((s) => s.source === coId && s.valueEur > 0)
    .sort((a, b) => b.valueEur - a.valueEur)[0];
  if (sub) {
    return {
      target: sub.target,
      value: sub.valueEur,
      count: sub.count,
      name: sub.subcontractorName ?? sub.target.replace("sub:", ""),
    };
  }
  return null;
}

export function buildSankeyGraph(flows: MonitorFlows, topN = 14) {
  const nodeLabel = (id: string) => flows.nodes.find((n) => n.id === id)?.label ?? id;
  const nodeType = (id: string): FlowNodeType => {
    const n = flows.nodes.find((x) => x.id === id);
    return (n?.type as FlowNodeType) ?? "contractor";
  };
  const nodeTotal = (id: string) => flows.nodes.find((n) => n.id === id)?.totalEur ?? 0;

  const nodeMap = new Map<string, SankeyNodeInput>();
  const links: SankeyLinkInput[] = [];

  const addNode = (id: string, fallbackName?: string) => {
    if (nodeMap.has(id)) return;
    const raw = fallbackName ?? nodeLabel(id);
    const name =
      id.startsWith("auth:") ? shortenMunicipality(raw) : shortenCompany(raw, 28);
    nodeMap.set(id, {
      id,
      name,
      type: nodeType(id),
      totalEur: nodeTotal(id),
    });
  };

  const topLinks = [...flows.links]
    .filter((l) => l.valueEur > 0)
    .sort((a, b) => b.valueEur - a.valueEur)
    .slice(0, topN);

  for (const l of topLinks) {
    addNode(l.source);
    addNode(l.target);
    links.push({
      id: `auth:${l.source}->${l.target}`,
      source: l.source,
      target: l.target,
      value: l.valueEur,
      kind: "authority",
      sourceId: l.source,
      targetId: l.target,
      count: l.count,
      flaggedCount: l.flaggedCount,
      concernLabel: l.concernLabel,
    });

    const sub = resolveSubcontractorForLink(l, flows);
    if (sub) {
      addNode(sub.target, sub.name);
      links.push({
        id: `sub:${l.target}->${sub.target}`,
        source: l.target,
        target: sub.target,
        value: sub.value,
        kind: "subcontract",
        sourceId: l.target,
        targetId: sub.target,
        count: sub.count,
      });
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
    topLinkCount: topLinks.length,
    subLinkCount: links.filter((l) => l.kind === "subcontract").length,
  };
}

export function nodeColor(type: FlowNodeType): string {
  return FLOW_COLORS[type] ?? "#64748b";
}
