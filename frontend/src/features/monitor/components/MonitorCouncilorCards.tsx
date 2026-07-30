"use client";

import type { MonitorCouncilorCard } from "../types";

interface MonitorCouncilorCardsProps {
  councilors: MonitorCouncilorCard[];
  loading?: boolean;
}

export function MonitorCouncilorCards({ councilors, loading }: MonitorCouncilorCardsProps) {
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

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-[1rem] font-semibold">Профили — ОбС Смолян</h2>
        <p className="text-[0.82rem] text-[color:var(--color-text-muted)]">
          Статистики и връзка към декларации по ЗПКОНПИ — без dump на документи.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {councilors.map((c) => (
          <article
            key={c.id}
            className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4"
          >
            <h3 className="font-display text-[0.95rem] font-semibold">{c.fullName}</h3>
            {c.roleLabel && (
              <p className="mt-0.5 text-[0.8rem] font-medium text-primary">{c.roleLabel}</p>
            )}
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
                  smolyan.bg ↗
                </a>
              )}
              <a
                href={c.zpokonpiPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.72rem] text-[color:var(--color-text-muted)] hover:text-primary"
              >
                ЗПКОНПИ ↗
              </a>
            </div>
            {c.zpokonpiNote && (
              <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[0.72rem] text-amber-900">{c.zpokonpiNote}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
