"use client";

import { cn } from "@/shared/lib/cn";
import { MONITOR_OBLAST_LABEL, useMonitorAuthority } from "./MonitorAuthorityProvider";

/**
 * Scopes every tab of the monitor to one municipality of oblast Smolyan. The selection is
 * kept in the URL, so it survives tab switches, reloads and sharing.
 */
export function MonitorMunicipalityFilter({ className }: { className?: string }) {
  const { authority, municipalities, setAuthority, hasScrapedDocuments } = useMonitorAuthority();
  const ready = municipalities.length > 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="monitor-municipality"
          className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-[color:var(--color-text-secondary)]"
        >
          <i className="bi bi-geo-alt text-primary" />
          Община
        </label>

        <div className="relative">
          <select
            id="monitor-municipality"
            value={authority ?? ""}
            disabled={!ready}
            onChange={(e) => setAuthority(e.target.value || null)}
            className="appearance-none rounded-full border border-border-default/40 bg-white/95 py-2 pl-3.5 pr-9 text-[0.85rem] font-medium text-[color:var(--color-text-heading)] shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          >
            <option value="">{MONITOR_OBLAST_LABEL} (всички)</option>
            {municipalities.map((m) => (
              <option key={m.eik} value={m.eik}>
                {m.name}
              </option>
            ))}
          </select>
          <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] text-[color:var(--color-text-muted)]" />
        </div>

        {authority && (
          <button
            type="button"
            onClick={() => setAuthority(null)}
            className="rounded-full px-2.5 py-1 text-[0.76rem] font-medium text-primary transition hover:bg-primary-50"
          >
            Изчисти
          </button>
        )}
      </div>

      {authority && !hasScrapedDocuments && (
        <p className="text-[0.75rem] text-[color:var(--color-text-muted)]">
          Поръчки, договори и риск се филтрират по избраната община. Решенията на ОбС,
          обсъжданията и сроковете се събират само за Община Смолян.
        </p>
      )}
    </div>
  );
}
