"use client";

import { useState } from "react";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { MonitorDetailSheet } from "../MonitorDetailSheet";
import { MonitorInsightCard } from "../MonitorInsightCard";
import { MonitorMobileShell } from "../MonitorMobileShell";
import { MonitorSearchBar } from "../MonitorSearchBar";
import { useMonitorWeeklyFeed } from "../../hooks/useMonitorWeeklyFeed";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import type { MonitorFeedItem } from "../../types";

export function MonitorHomePage() {
  const { overview, loading: overviewLoading } = useMonitorOverview();
  const { items, loading: feedLoading, error } = useMonitorWeeklyFeed();
  const isMobile = useIsMobile();
  const [sheetItem, setSheetItem] = useState<MonitorFeedItem | null>(null);

  return (
    <MonitorMobileShell overview={overview} overviewLoading={overviewLoading}>
      <MonitorSearchBar className="max-w-xl" />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.1rem] font-semibold text-[color:var(--color-text-heading)]">
            Тази седмица
          </h2>
          <span className="text-[0.72rem] text-[color:var(--color-text-muted)]">Top 5 по impact</span>
        </div>

        {feedLoading ? (
          <LogoLoader label="Зареждане на данни…" />
        ) : error ? (
          <EmptyState
            icon="bi-wifi-off"
            title="Неуспешно зареждане"
            description="API-то на монитора не отговори. Уверете се, че backend-ът работи и SIGMA import е пуснат."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="bi-inbox"
            title="Няма данни още"
            description="Администраторът трябва да пусне SIGMA import от админ панела → Монитор."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <MonitorInsightCard
                key={`${item.itemType}-${item.id}`}
                item={item}
                onPreview={isMobile ? () => setSheetItem(item) : undefined}
              />
            ))}
          </div>
        )}
      </section>
      <MonitorDetailSheet item={sheetItem} onClose={() => setSheetItem(null)} />
    </MonitorMobileShell>
  );
}
