"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { messengerApi } from "../api";
import { useStartConversation } from "../hooks/useStartConversation";
import { useMessengerUiStore } from "../store/messengerUiStore";

type SearchTab = "all" | "following";

/** Debounced user search (all users + following) — mirrors legacy SVUserSearch. */
export function UserSearch() {
  const showList = useMessengerUiStore((s) => s.showList);
  const [tab, setTab] = useState<SearchTab>("all");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const requireAuth = useRequireAuth();
  const canInteract = useCanInteract();
  const { mutate: start, isPending: isStarting } = useStartConversation();

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const allQuery = useQuery({
    queryKey: ["messenger", "user-search", query],
    queryFn: () => messengerApi.searchUsers(query),
    enabled: tab === "all" && query.length >= 2,
    staleTime: 30_000,
  });

  const followingQuery = useQuery({
    queryKey: ["messenger", "following-search", query],
    queryFn: () => messengerApi.followingUsers(query || undefined),
    enabled: tab === "following",
    staleTime: 30_000,
  });

  const active = tab === "all" ? allQuery : followingQuery;
  const users = active.data ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border-default/60 p-3">
        <button
          type="button"
          onClick={showList}
          aria-label="Назад"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)]"
        >
          <i className="bi bi-arrow-left" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tab === "all" ? "Търси потребители…" : "Търси сред следвани…"}
          autoFocus
          className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-border-default/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-2 border-b border-border-default/60 px-3 py-2">
        {(
          [
            { value: "all" as const, label: "Всички" },
            { value: "following" as const, label: "Следвани" },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors",
              tab === t.value
                ? "bg-primary text-white"
                : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!canInteract && (
          <p className="mx-3 my-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <i className="bi bi-shield-exclamation mr-1" aria-hidden />
            Нови разговори са изключени, докато профилът е ограничен.
          </p>
        )}

        {tab === "all" && query.length < 2 && (
          <p className="px-4 py-8 text-center text-sm text-[color:var(--color-text-muted)]">
            Въведи поне 2 символа за търсене.
          </p>
        )}

        {active.isPending &&
          Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="mx-3 my-2 h-12 rounded-[var(--radius-md)]" />
          ))}

        {active.isError && (
          <ErrorState description="Търсенето не успя." onRetry={() => active.refetch()} />
        )}

        {!active.isPending && !active.isError && users.length === 0 && (tab === "following" || query.length >= 2) && (
          <EmptyState icon="bi-person" title="Няма резултати" />
        )}

        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            disabled={isStarting || !canInteract}
            onClick={async () => {
              if (!(await requireAuth("да започнеш разговор"))) return;
              start(u.id);
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[color:var(--color-surface-muted)] disabled:opacity-50"
          >
            <div className="relative shrink-0">
              <Avatar username={u.username} imageUrl={u.imageUrl} size={40} />
              {u.isOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[color:var(--color-success)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--color-text-heading)]">
                {u.fullName || u.username}
              </p>
              <p className="truncate text-xs text-[color:var(--color-text-muted)]">@{u.username}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
