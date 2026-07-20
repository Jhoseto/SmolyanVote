"use client";

import { cn } from "@/shared/lib/cn";
import type { ProfileTab } from "../types";

const TABS: { value: ProfileTab; label: string; icon: string }[] = [
  { value: "overview", label: "Преглед", icon: "bi-person-lines-fill" },
  { value: "events", label: "Събития", icon: "bi-calendar-event" },
  { value: "publications", label: "Публикации", icon: "bi-newspaper" },
  { value: "signals", label: "Сигнали", icon: "bi-geo-alt" },
  { value: "connections", label: "Връзки", icon: "bi-people" },
];

/** Tab nav — legacy uses fade + touch swipe between panels; kept as a simple pill nav (see MODERN_FRONTEND_PLAN §Фаза 7 notes). */
export function ProfileTabsNav({ active, onChange }: { active: ProfileTab; onChange: (tab: ProfileTab) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] bg-white p-1.5 shadow-[var(--shadow-sm)]">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition-colors",
            active === tab.value
              ? "bg-primary text-white"
              : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)]",
          )}
        >
          <i className={`bi ${tab.icon}`} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
