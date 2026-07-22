"use client";

import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { hapticTap } from "@/shared/lib/haptic";
import type { PublicationsFeedMode } from "../hooks/usePublicationsFilters";

export function PublicationsFeedTabs({
  feed,
  onChange,
}: {
  feed: PublicationsFeedMode;
  onChange: (feed: PublicationsFeedMode) => void;
}) {
  const { isAuthenticated } = useAuth();
  const openAuth = useLoginGateStore((s) => s.open);

  function select(next: PublicationsFeedMode) {
    hapticTap();
    if (next === "following" && !isAuthenticated) {
      openAuth("login");
      return;
    }
    onChange(next);
  }

  return (
    <div className="flex gap-1 rounded-[var(--radius-md)] border border-border-default/50 bg-[color:var(--color-surface-muted)]/60 p-1">
      <button
        type="button"
        onClick={() => select("all")}
        className={cn(
          "flex-1 rounded-[8px] px-3 py-2 text-sm font-semibold transition-colors",
          feed === "all"
            ? "bg-white text-primary shadow-[var(--shadow-sm)]"
            : "text-[color:var(--color-text-secondary)] hover:text-primary",
        )}
      >
        За теб
      </button>
      <button
        type="button"
        onClick={() => select("following")}
        className={cn(
          "flex-1 rounded-[8px] px-3 py-2 text-sm font-semibold transition-colors",
          feed === "following"
            ? "bg-white text-primary shadow-[var(--shadow-sm)]"
            : "text-[color:var(--color-text-secondary)] hover:text-primary",
        )}
      >
        Следвани
      </button>
    </div>
  );
}
