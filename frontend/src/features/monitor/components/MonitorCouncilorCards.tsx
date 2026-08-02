"use client";

import { useMemo, useState } from "react";
import type { MonitorCouncilorCard } from "../types";
import { compareCouncilorsByHierarchy } from "../utils/councilorRoleRank";
import { zpokonpiStatusClass, zpokonpiStatusLabel } from "../utils/zpokonpiStatus";
import { MONITOR_OBLAST_LABEL, useMonitorAuthority } from "./MonitorAuthorityProvider";

interface MonitorCouncilorCardsProps {
  councilors: MonitorCouncilorCard[];
  municipalityLabel: string;
  loading?: boolean;
}

type CouncilorSort = "hierarchy" | "name-asc" | "name-desc" | "party-asc";

export function MonitorCouncilorCards({ councilors, municipalityLabel, loading }: MonitorCouncilorCardsProps) {
  const { authority, municipalities, setAuthority } = useMonitorAuthority();
  const [search, setSearch] = useState("");
  const [party, setParty] = useState("");
  const [sort, setSort] = useState<CouncilorSort>("hierarchy");
  const municipalitiesReady = municipalities.length > 0;

  const parties = useMemo(() => {
    return [...new Set(councilors.map((c) => c.party).filter(Boolean))].sort((a, b) =>
      (a ?? "").localeCompare(b ?? "", "bg"),
    ) as string[];
  }, [councilors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = councilors.filter((c) => {
      if (party && c.party !== party) return false;
      if (q) {
        const hay = `${c.fullName} ${c.roleLabel ?? ""} ${c.party ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "hierarchy":
          return compareCouncilorsByHierarchy(a, b);
        case "name-desc":
          return b.fullName.localeCompare(a.fullName, "bg");
        case "party-asc":
          return (a.party ?? "").localeCompare(b.party ?? "", "bg") || a.fullName.localeCompare(b.fullName, "bg");
        case "name-asc":
        default:
          return a.fullName.localeCompare(b.fullName, "bg");
      }
    });
    return list;
  }, [councilors, search, party, sort]);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]" />
        ))}
      </div>
    );
  }

  if (councilors.length === 0) return null;

  const active = search || party || sort !== "hierarchy";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-[1rem] font-semibold">Профили — {municipalityLabel}</h2>
        <p className="text-[0.82rem] text-[color:var(--color-text-muted)]">
          Кмет, председател и състав на общинския съвет (мандат 2023–2027) с връзка към декларации по ЗПКОНПИ.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-border-default/30 bg-white/90 p-3">
        <select
          value={authority ?? ""}
          disabled={!municipalitiesReady}
          onChange={(e) => setAuthority(e.target.value || null)}
          aria-label="Община"
          className="h-9 min-w-[11rem] rounded-full border border-border-default/40 bg-white px-3 text-[0.78rem] font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
        >
          <option value="">{MONITOR_OBLAST_LABEL} (всички)</option>
          {municipalities.map((m) => (
            <option key={m.eik} value={m.eik}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търси по име…"
          className="h-9 min-w-[10rem] flex-1 rounded-full border border-border-default/40 px-3 text-[0.82rem] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as CouncilorSort)}
          className="h-9 rounded-full border border-border-default/40 px-3 text-[0.78rem] font-medium"
        >
          <option value="hierarchy">По йерархия</option>
          <option value="name-asc">Име (А–Я)</option>
          <option value="name-desc">Име (Я–А)</option>
          <option value="party-asc">По партия</option>
        </select>
        {parties.length > 0 && (
          <select
            value={party}
            onChange={(e) => setParty(e.target.value)}
            className="h-9 rounded-full border border-border-default/40 px-3 text-[0.78rem] font-medium"
          >
            <option value="">Всички партии</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
        {active && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setParty("");
              setSort("hierarchy");
            }}
            className="text-[0.76rem] font-medium text-primary"
          >
            Изчисти
          </button>
        )}
        <span className="w-full text-[0.72rem] text-[color:var(--color-text-muted)]">
          {filtered.length === councilors.length
            ? `${councilors.length} профила`
            : `${filtered.length} от ${councilors.length} профила`}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <article
            key={c.id}
            className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4"
          >
            <h3 className="font-display text-[0.95rem] font-semibold">{c.fullName}</h3>
            {c.roleLabel && (
              <p className="mt-0.5 text-[0.8rem] font-medium text-primary">{c.roleLabel}</p>
            )}
            <span
              className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[0.68rem] font-medium ${zpokonpiStatusClass(c.zpokonpiStatus)}`}
            >
              {zpokonpiStatusLabel(c.zpokonpiStatus)}
            </span>
            <dl className="mt-3 space-y-1 text-[0.78rem]">
              {c.party && (
                <div>
                  <dt className="text-[color:var(--color-text-muted)]">Партия / група</dt>
                  <dd>{c.party}</dd>
                </div>
              )}
              {c.mandatePeriod && (
                <div>
                  <dt className="text-[color:var(--color-text-muted)]">Мандат</dt>
                  <dd>{c.mandatePeriod}</dd>
                </div>
              )}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.sourceUrl && (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.72rem] text-primary hover:underline"
                >
                  Източник ↗
                </a>
              )}
              {(c.zpokonpiRegisterUrl || c.zpokonpiPortalUrl) && (
                <a
                  href={c.zpokonpiRegisterUrl ?? c.zpokonpiPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.72rem] text-[color:var(--color-text-muted)] hover:text-primary"
                >
                  Регистър ЗПКОНПИ ↗
                </a>
              )}
            </div>
            {c.zpokonpiNote && c.zpokonpiStatus !== "OK" && (
              <p className={`mt-2 rounded border px-2 py-1 text-[0.72rem] ${zpokonpiStatusClass(c.zpokonpiStatus)}`}>
                {c.zpokonpiNote}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
