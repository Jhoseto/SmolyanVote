"use client";

import { useMemo, useState } from "react";
import { formatDate, formatEur } from "../lib/format";
import type { MonitorEuFunds } from "../types";
import { MonitorDetailLink } from "./MonitorDetailLink";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";

type EuSort = "amount-desc" | "amount-asc" | "newest" | "oldest" | "title-asc";

interface MonitorEuFundsPanelProps {
  data: MonitorEuFunds | null;
  loading?: boolean;
}

export function MonitorEuFundsPanel({ data, loading }: MonitorEuFundsPanelProps) {
  const { withAuthority } = useMonitorAuthority();
  const [search, setSearch] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [minAmount, setMinAmount] = useState(0);
  const [sort, setSort] = useState<EuSort>("amount-desc");

  const municipalities = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.projects.map((p) => p.municipality).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "bg"),
    );
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    let list = data.projects.filter((p) => {
      if (municipality && p.municipality !== municipality) return false;
      if (minAmount > 0 && (p.amountEur ?? 0) < minAmount) return false;
      if (q) {
        const hay = `${p.title} ${p.contractorName ?? ""} ${p.municipality}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "amount-asc":
          return (a.amountEur ?? 0) - (b.amountEur ?? 0);
        case "newest":
          return Date.parse(b.signedAt ?? "") - Date.parse(a.signedAt ?? "");
        case "oldest":
          return Date.parse(a.signedAt ?? "") - Date.parse(b.signedAt ?? "");
        case "title-asc":
          return a.title.localeCompare(b.title, "bg");
        case "amount-desc":
        default:
          return (b.amountEur ?? 0) - (a.amountEur ?? 0);
      }
    });
    return list;
  }, [data, search, municipality, minAmount, sort]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />;
  }
  if (!data) return null;

  const active = search || municipality || minAmount > 0 || sort !== "amount-desc";

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

      <div className="space-y-3 rounded-[var(--radius-lg)] border border-border-default/30 bg-white/90 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Търси проект или изпълнител…"
            className="h-9 min-w-[12rem] flex-1 rounded-full border border-border-default/40 px-3 text-[0.82rem] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as EuSort)}
            className="h-9 rounded-full border border-border-default/40 px-3 text-[0.78rem] font-medium"
          >
            <option value="amount-desc">Най-голяма сума</option>
            <option value="amount-asc">Най-малка сума</option>
            <option value="newest">Най-нови</option>
            <option value="oldest">Най-стари</option>
            <option value="title-asc">По заглавие (А–Я)</option>
          </select>
          {municipalities.length > 1 && (
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="h-9 rounded-full border border-border-default/40 px-3 text-[0.78rem] font-medium"
            >
              <option value="">Всички общини</option>
              {municipalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <select
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="h-9 rounded-full border border-border-default/40 px-3 text-[0.78rem] font-medium"
          >
            <option value={0}>Всяка сума</option>
            <option value={50000}>≥ 50 000 €</option>
            <option value={100000}>≥ 100 000 €</option>
            <option value={500000}>≥ 500 000 €</option>
          </select>
          {active && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setMunicipality("");
                setMinAmount(0);
                setSort("amount-desc");
              }}
              className="text-[0.76rem] font-medium text-primary"
            >
              Изчисти
            </button>
          )}
        </div>
        <p className="text-[0.72rem] text-[color:var(--color-text-muted)]">
          {filtered.length === data.projects.length
            ? `${data.projects.length} проекта`
            : `${filtered.length} от ${data.projects.length} проекта`}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((p) => (
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
              <MonitorDetailLink
                href={withAuthority(`/monitor/contract/${p.contractId}`)}
                className="text-[0.78rem] font-medium text-primary hover:underline"
              >
                Детайли →
              </MonitorDetailLink>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
