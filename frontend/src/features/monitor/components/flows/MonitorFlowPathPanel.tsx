"use client";

import { useEffect } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatEur } from "../../lib/format";
import type { MonitorFlowPathDetail } from "../../types";
import { MonitorDetailLink } from "../MonitorDetailLink";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";

interface MonitorFlowPathPanelProps {
  detail: MonitorFlowPathDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  className?: string;
}

function concernClass(label: string | null | undefined) {
  if (!label || label === "Стандартна поръчка") return "bg-emerald-50 text-emerald-800";
  return "bg-amber-100 text-amber-950";
}

export function MonitorFlowPathPanel({
  detail,
  loading,
  error,
  onClose,
  className,
}: MonitorFlowPathPanelProps) {
  const { withAuthority } = useMonitorAuthority();
  const open = Boolean(detail || loading || error);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Затвори детайлите"
        className="fixed inset-0 z-[1090] bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed right-0 z-[1100] flex w-full max-w-md flex-col border-l border-border-default/30 bg-white shadow-[-8px_0_32px_rgba(15,23,42,0.12)]",
          "top-[var(--navbar-height)] bottom-0 max-md:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]",
          className,
        )}
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-default/25 px-4 py-4">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
              Път на парите
            </p>
            {detail && (
              <>
                <h3 className="mt-1 font-display text-[1rem] font-semibold leading-snug text-[color:var(--color-text-heading)]">
                  {detail.authority.name}
                </h3>
                <p className="mt-0.5 text-[0.85rem] text-[color:var(--color-text-muted)]">
                  →{" "}
                  {detail.contractor.eik ? (
                    <MonitorDetailLink
                      href={withAuthority(`/monitor/company/${detail.contractor.eik}`)}
                      className="font-medium text-primary hover:underline"
                    >
                      {detail.contractor.name}
                    </MonitorDetailLink>
                  ) : (
                    detail.contractor.name
                  )}
                </p>
              </>
            )}
            {loading && !detail && (
              <p className="mt-1 text-[0.85rem] text-[color:var(--color-text-muted)]">Зареждане…</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[color:var(--color-text-muted)] hover:bg-slate-100"
            aria-label="Затвори"
          >
            <i className="bi bi-x-lg" aria-hidden />
          </button>
        </div>

        {loading && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {error && !loading && <p className="p-4 text-[0.88rem] text-red-700">{error}</p>}

        {detail && !loading && (
          <>
            <div className="grid grid-cols-2 gap-2 border-b border-border-default/20 px-4 py-3 text-[0.78rem]">
              <div className="rounded-lg bg-emerald-50/80 px-3 py-2">
                <p className="text-[color:var(--color-text-muted)]">Общо договори</p>
                <p className="font-semibold tabular-nums">{formatEur(detail.totals.totalEur)}</p>
                <p className="text-[0.72rem]">{detail.totals.contractCount} бр.</p>
              </div>
              <div className="rounded-lg bg-orange-50/80 px-3 py-2">
                <p className="text-[color:var(--color-text-muted)]">Към подизпълнители</p>
                <p className="font-semibold tabular-nums">
                  {formatEur(detail.totals.subcontractingTotalEur)}
                </p>
                <p className="text-[0.72rem]">
                  {detail.totals.contractsWithSubcontractor} дог. с декларация
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <ol className="relative space-y-0 border-l-2 border-emerald-200/80 pl-4">
                {detail.contracts.map((c) => (
                  <li key={c.id} className="relative pb-5 last:pb-2">
                    <span className="absolute -left-[1.34rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary shadow-sm" />
                    <div className="rounded-xl border border-border-default/20 bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <MonitorDetailLink
                          href={withAuthority(`/monitor/contract/${c.id}`)}
                          className="text-[0.85rem] font-medium leading-snug text-primary hover:underline"
                        >
                          {c.subject.length > 90 ? `${c.subject.slice(0, 89)}…` : c.subject}
                        </MonitorDetailLink>
                        <span className="shrink-0 font-semibold tabular-nums text-[0.85rem]">
                          {formatEur(c.amountEur)}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.72rem] text-[color:var(--color-text-muted)]">
                        Подписан · {formatDate(c.signedAt)}
                      </p>
                      {(c.subcontractorName || c.subcontractorEik) && (
                        <p className="mt-2 text-[0.78rem]">
                          Подизпълнител:{" "}
                          {c.subcontractorEik ? (
                            <MonitorDetailLink
                              href={withAuthority(`/monitor/company/${c.subcontractorEik}`)}
                              className="font-medium text-primary hover:underline"
                            >
                              {c.subcontractorName ?? c.subcontractorEik}
                            </MonitorDetailLink>
                          ) : (
                            (c.subcontractorName ?? "Деклариран")
                          )}
                          {c.subcontractingAmountEur != null && c.subcontractingAmountEur > 0 && (
                            <span className="text-[color:var(--color-text-muted)]">
                              {" "}
                              · {formatEur(c.subcontractingAmountEur)}
                            </span>
                          )}
                        </p>
                      )}
                      {c.concernLabel && (
                        <div className="mt-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                              concernClass(c.concernLabel),
                            )}
                          >
                            {c.concernLabel}
                          </span>
                          {c.citizenHint && (
                            <p className="mt-1 text-[0.75rem] leading-snug text-[color:var(--color-text-muted)]">
                              {c.citizenHint}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
