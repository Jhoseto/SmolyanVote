"use client";

import Link from "next/link";
import { MonitorDetailLink } from "./MonitorDetailLink";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatEur } from "../lib/format";
import type { MonitorFlows } from "../types";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";

interface MonitorFlowsChartProps {
  flows: MonitorFlows | null;
  loading?: boolean;
  /** When true, table starts collapsed under a disclosure control. */
  collapsedByDefault?: boolean;
}

function nodeLabel(flows: MonitorFlows, id: string) {
  return flows.nodes.find((n) => n.id === id)?.label ?? id;
}

function shortenMunicipality(name: string) {
  return name
    .replace(/^ОБЩИНА\s+/i, "Община ")
    .replace(/^Кмет на община\s+/i, "Община ")
    .trim();
}

function concernBadgeClass(label: string | null | undefined, flaggedCount: number) {
  if (!label || flaggedCount === 0) {
    if (label === "Концентрация") return "bg-amber-100 text-amber-900";
    return "bg-emerald-50 text-emerald-800";
  }
  if (label === "Стандартна поръчка") return "bg-emerald-50 text-emerald-800";
  return "bg-amber-100 text-amber-950";
}

export function MonitorFlowsChart({ flows, loading, collapsedByDefault }: MonitorFlowsChartProps) {
  const { withAuthority } = useMonitorAuthority();
  const [open, setOpen] = useState(!collapsedByDefault);

  const { topLinks, totalEur, topContractor } = useMemo(() => {
    if (!flows?.links.length) {
      return { topLinks: [], totalEur: 0, topContractor: null as string | null };
    }
    const sorted = [...flows.links]
      .filter((l) => l.valueEur > 0)
      .sort((a, b) => b.valueEur - a.valueEur)
      .slice(0, 15);
    const total = sorted.reduce((s, l) => s + l.valueEur, 0);
    const contractorTotals = new Map<string, number>();
    for (const l of flows.links) {
      const coId = l.target.startsWith("co:") ? l.target : l.source;
      if (coId.startsWith("co:")) {
        contractorTotals.set(coId, (contractorTotals.get(coId) ?? 0) + l.valueEur);
      }
    }
    let topCo: string | null = null;
    let topCoVal = 0;
    for (const [id, val] of contractorTotals) {
      if (val > topCoVal) {
        topCoVal = val;
        topCo = nodeLabel(flows, id);
      }
    }
    return { topLinks: sorted, totalEur: total, topContractor: topCo };
  }, [flows]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }

  if (!flows || topLinks.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border-default/50 bg-white/80 p-8 text-center text-[0.9rem] text-[color:var(--color-text-muted)]">
        Няма данни за парични потоци. Стартирайте SIGMA import от админ панела.
      </p>
    );
  }

  const maxLink = topLinks[0]?.valueEur ?? 1;

  return (
    <details
      className="rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-slate-50/95 shadow-[0_8px_32px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] md:p-5"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none p-4 md:p-0 md:[&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[1rem] font-semibold text-[color:var(--color-text-heading)]">
              Детайлен списък (таблица)
            </h3>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-[color:var(--color-text-muted)]">
              Топ 15 връзки <strong>възложител → изпълнител</strong> по обща стойност — допълнение
              към 3D картата.
            </p>
          </div>
          <span className="shrink-0 text-[0.78rem] font-medium text-primary">
            {open ? "Скрий" : "Покажи"}
          </span>
        </div>
      </summary>

      <div className="px-4 pb-4 md:px-0 md:pb-0">
      {topContractor && (
        <p className="mt-3 rounded-lg bg-amber-50/80 px-3 py-2 text-[0.82rem] text-amber-950">
          Най-много общински поръчки отиват при{" "}
          <strong>{topContractor}</strong> — проверете дали конкуренцията е реална.
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b border-border-default/30 text-left text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
              <th className="pb-2 pr-3 font-semibold">#</th>
              <th className="pb-2 pr-3 font-semibold">Възложител</th>
              <th className="pb-2 pr-3 font-semibold">Изпълнител</th>
              <th className="pb-2 pr-3 font-semibold min-w-[140px]">Подизпълнител</th>
              <th className="pb-2 pr-3 text-right font-semibold">Сума</th>
              <th className="pb-2 pr-3 font-semibold w-[18%]">Дял</th>
              <th className="pb-2 font-semibold min-w-[200px]">Защо е важно</th>
            </tr>
          </thead>
          <tbody>
            {topLinks.map((link, i) => {
              const authId = link.source.startsWith("auth:") ? link.source : link.target;
              const coId = link.target.startsWith("co:") ? link.target : link.source;
              const authority = shortenMunicipality(nodeLabel(flows, authId));
              const contractor = nodeLabel(flows, coId);
              const eik = coId.replace("co:", "");
              const pct = maxLink > 0 ? (link.valueEur / maxLink) * 100 : 0;
              const hint = link.citizenHint ?? "Няма допълнителни индикатори.";
              const label = link.concernLabel ?? "Стандартна поръчка";
              const flagged = link.flaggedCount ?? 0;

              return (
                <tr
                  key={`${link.source}-${link.target}-${i}`}
                  className={cn(
                    "border-b border-border-default/15",
                    flagged > 0 && "bg-amber-50/40",
                  )}
                >
                  <td className="py-2.5 pr-3 text-[color:var(--color-text-muted)]">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium text-[color:var(--color-text-heading)]">
                    {authority}
                  </td>
                  <td className="py-2.5 pr-3">
                    {eik && eik !== "unknown" ? (
                      <MonitorDetailLink
                        href={withAuthority(`/monitor/company/${eik}`)}
                        className="font-medium text-primary hover:underline"
                      >
                        {contractor}
                      </MonitorDetailLink>
                    ) : (
                      contractor
                    )}
                    {link.count > 1 && (
                      <span className="ml-1 text-[0.72rem] text-[color:var(--color-text-muted)]">
                        ({link.count} дог.)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 align-top text-[0.78rem]">
                    {(link.contractsWithSubcontractor ?? 0) > 0 ? (
                      <>
                        {link.subcontractorEik ? (
                          <MonitorDetailLink
                            href={withAuthority(`/monitor/company/${link.subcontractorEik}`)}
                            className="font-medium text-primary hover:underline"
                          >
                            {link.subcontractorName ?? `ЕИК ${link.subcontractorEik}`}
                          </MonitorDetailLink>
                        ) : (
                          <span className="font-medium">{link.subcontractorName ?? "Деклариран"}</span>
                        )}
                        <p className="mt-0.5 text-[0.7rem] text-[color:var(--color-text-muted)]">
                          {link.contractsWithSubcontractor} дог.
                          {link.subcontractingTotalEur != null && link.subcontractingTotalEur > 0
                            ? ` · ${formatEur(link.subcontractingTotalEur)}`
                            : ""}
                        </p>
                      </>
                    ) : (
                      <span className="text-[color:var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatEur(link.valueEur)}</td>
                  <td className="py-2.5">
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 shadow-inner">
                      <div
                        className="relative h-full rounded-full bg-gradient-to-r from-emerald-700 via-primary to-emerald-400 shadow-[0_2px_8px_rgba(25,134,28,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 align-top">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                        concernBadgeClass(label, flagged),
                      )}
                    >
                      {label}
                    </span>
                    <p className="mt-1.5 text-[0.78rem] leading-snug text-[color:var(--color-text-muted)]">
                      {hint}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[0.72rem] text-[color:var(--color-text-muted)]">
        Показани са {formatEur(totalEur)} от най-големите потоци (топ 15). Подизпълнителите са само
        декларирани в EOP (един ниво). Пълният списък — в раздел{" "}
        <Link href={withAuthority("/monitor/procurement")} className="text-primary hover:underline">
          Поръчки
        </Link>
        .
      </p>
      </div>
    </details>
  );
}
