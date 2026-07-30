"use client";

import Link from "next/link";
import { formatDate, formatEur } from "../lib/format";
import type { MonitorEuFunds } from "../types";

interface MonitorEuFundsPanelProps {
  data: MonitorEuFunds | null;
  loading?: boolean;
}

export function MonitorEuFundsPanel({ data, loading }: MonitorEuFundsPanelProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-blue-200/80 bg-blue-50/60 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-blue-800">ЕС финансиране</p>
          <p className="mt-1 font-display text-[1.4rem] font-bold text-blue-900">{formatEur(data.totalEur)}</p>
          <p className="text-[0.82rem] text-blue-800/80">{data.projectCount} договора в региона</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4 text-[0.82rem] text-[color:var(--color-text-secondary)]">
          {data.dataNote}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.projects.map((p) => (
          <article
            key={p.contractId}
            className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4"
          >
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-blue-700">
              {p.municipality} · {formatDate(p.signedAt)}
            </p>
            <h3 className="mt-1 font-display text-[0.9rem] font-semibold leading-snug">{p.title}</h3>
            {p.contractorName && (
              <p className="mt-1 text-[0.78rem] text-[color:var(--color-text-muted)]">{p.contractorName}</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-display text-[1rem] font-bold text-primary">{formatEur(p.amountEur)}</span>
              <Link
                href={`/monitor/contract/${p.contractId}`}
                className="text-[0.78rem] font-medium text-primary hover:underline"
              >
                Детайли →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
