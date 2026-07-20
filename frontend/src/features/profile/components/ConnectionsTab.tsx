"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Avatar, Button, EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { useConnectionsList } from "../hooks/useConnectionsList";
import type { ConnectionsKind } from "../types";

interface ConnectionsTabProps {
  username: string;
  kind: ConnectionsKind;
  onKindChange: (kind: ConnectionsKind) => void;
  followersCount: number;
  followingCount: number;
  /** "Следвай" — composed at the `app/` layer (features never import features). */
  followSlot: (userId: number) => ReactNode;
  reportUserSlot: (userId: number) => ReactNode;
}

/** Followers/following sub-tabs — port of legacy `followSystem.js` (offset pagination + debounced search). */
export function ConnectionsTab({
  username,
  kind,
  onKindChange,
  followersCount,
  followingCount,
  followSlot,
  reportUserSlot,
}: ConnectionsTabProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, isPending, isError, refetch, page, goToPage, resetPage } = useConnectionsList(
    username,
    kind,
    search,
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetPage();
    setSearch(searchInput.trim());
  }

  function switchKind(next: ConnectionsKind) {
    if (next === kind) return;
    setSearchInput("");
    setSearch("");
    onKindChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchKind("followers")}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors",
              kind === "followers"
                ? "bg-primary text-white"
                : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] hover:bg-primary-50",
            )}
          >
            Последователи ({followersCount})
          </button>
          <button
            type="button"
            onClick={() => switchKind("following")}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors",
              kind === "following"
                ? "bg-primary text-white"
                : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] hover:bg-primary-50",
            )}
          >
            Следвани ({followingCount})
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Търси по потребителско име…"
            className="w-56 rounded-[var(--radius-pill)] border border-border-default/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <Button type="submit" size="sm" variant="outline">
            <i className="bi bi-search" />
          </Button>
        </form>
      </div>

      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      )}

      {isError && <ErrorState description="Списъкът не можа да се зареди." onRetry={() => refetch()} />}

      {!isPending && !isError && data?.items.length === 0 && (
        <EmptyState
          icon="bi-people"
          title={kind === "followers" ? "Няма последователи" : "Не следва никого"}
          description={search ? "Няма резултати за търсенето." : undefined}
        />
      )}

      {!isPending && !isError && data && data.items.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.items.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border-default/60 bg-white p-3"
            >
              <Link href={`/user/${user.username}`} className="flex flex-1 items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Avatar username={user.username} imageUrl={user.imageUrl} size={44} />
                  {user.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[color:var(--color-success)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--color-text-heading)]">
                    @{user.username}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {user.followersCount} последователи · присъединил се {formatRelativeDate(user.joined)}
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                {followSlot(user.id)}
                {reportUserSlot(user.id)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPending && !isError && (page > 0 || data?.hasNext) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => goToPage(page - 1)}>
            Предишна
          </Button>
          <span className="text-sm text-[color:var(--color-text-muted)]">Страница {page + 1}</span>
          <Button variant="outline" size="sm" disabled={!data?.hasNext} onClick={() => goToPage(page + 1)}>
            Следваща
          </Button>
        </div>
      )}
    </div>
  );
}
