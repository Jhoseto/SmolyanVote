"use client";

import Link from "next/link";
import { Avatar, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { usePublicationsFilters } from "../hooks/usePublicationsFilters";
import type { PublicationsFeedMode } from "../hooks/usePublicationsFilters";
import { useOnlineUsers } from "../hooks/usePublicationsSidebar";
import { PublicationsUnifiedSearch } from "./PublicationsUnifiedSearch";
import { PublicationsFilters } from "./PublicationsFilters";
import type { ReactNode } from "react";

interface PublicationsLeftRailProps {
  onOpenPublication: (id: number) => void;
  onCompose: () => void;
  onSwitchFeed?: (feed: PublicationsFeedMode) => void;
  renderFollowSlot?: (userId: number) => ReactNode;
}

export function PublicationsLeftRail({
  onOpenPublication,
  onCompose,
  onSwitchFeed,
  renderFollowSlot,
}: PublicationsLeftRailProps) {
  const { isAuthenticated, user } = useAuth();
  const openAuth = useLoginGateStore((s) => s.open);
  const [filters, setFilters] = usePublicationsFilters();

  return (
    <div className="flex flex-col gap-4">
      <PublicationsUnifiedSearch
        onSearchFeed={(query) => setFilters({ search: query, feed: "all", author: null })}
        onSelectPublication={onOpenPublication}
        onFilterAuthor={(userId) =>
          setFilters({
            userIds: filters.userIds.includes(userId) ? filters.userIds : [...filters.userIds, userId],
            feed: "all",
            author: null,
          })
        }
      />

      <MiniProfileCard
        isAuthenticated={isAuthenticated}
        username={user?.username}
        imageUrl={user?.imageUrl}
        onCompose={() => {
          if (!isAuthenticated) {
            openAuth("login");
            return;
          }
          onCompose();
        }}
        onLogin={() => openAuth("login")}
      />

      <QuickLinks
        isAuthenticated={isAuthenticated}
        mineActive={filters.author === "me"}
        followingActive={filters.feed === "following"}
        onMine={() => {
          if (!isAuthenticated) {
            openAuth("login");
            return;
          }
          setFilters({ author: "me", feed: "all", userIds: [] });
        }}
        onFollowing={() => {
          if (!isAuthenticated) {
            openAuth("login");
            return;
          }
          if (onSwitchFeed) {
            onSwitchFeed("following");
            return;
          }
          setFilters({
            feed: "following",
            author: null,
            search: null,
            category: null,
            time: null,
            userIds: [],
          });
        }}
        onClearMine={() => setFilters({ author: null })}
      />

      <PublicationsFilters variant="rail" />

      <OnlineNowWidget renderFollowSlot={renderFollowSlot} />
    </div>
  );
}

function MiniProfileCard({
  isAuthenticated,
  username,
  imageUrl,
  onCompose,
  onLogin,
}: {
  isAuthenticated: boolean;
  username?: string;
  imageUrl?: string | null;
  onCompose: () => void;
  onLogin: () => void;
}) {
  if (!isAuthenticated) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border-default/50 bg-white/90 p-4 shadow-[var(--shadow-sm)]">
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Влезте, за да публикувате и да следите лентата.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="btn-brand mt-3 w-full rounded-[var(--radius-pill)] px-3 py-2 text-sm font-semibold text-white"
        >
          Вход
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/50 bg-white/90 p-4 shadow-[var(--shadow-sm)]">
      <Link href="/profile" className="flex items-center gap-3">
        <Avatar username={username ?? "?"} imageUrl={imageUrl} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--color-text-heading)]">{username}</p>
          <p className="text-xs text-[color:var(--color-text-muted)]">Моят профил</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onCompose}
        className="btn-brand mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] px-3 py-2 text-sm font-semibold text-white"
      >
        <i className="bi bi-plus-lg" />
        Нова публикация
      </button>
    </div>
  );
}

function QuickLinks({
  isAuthenticated,
  mineActive,
  followingActive,
  onMine,
  onFollowing,
  onClearMine,
}: {
  isAuthenticated: boolean;
  mineActive: boolean;
  followingActive: boolean;
  onMine: () => void;
  onFollowing: () => void;
  onClearMine: () => void;
}) {
  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary-50 text-primary"
        : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)] hover:text-primary",
    );

  return (
    <nav className="rounded-[var(--radius-lg)] border border-border-default/50 bg-white/90 p-2 shadow-[var(--shadow-sm)]">
      <Link href="/publications/saved" className={linkClass(false)}>
        <i className="bi bi-bookmark" />
        Запазени
      </Link>
      <button
        type="button"
        onClick={() => (mineActive ? onClearMine() : onMine())}
        className={cn(linkClass(mineActive), "w-full text-left")}
      >
        <i className="bi bi-person-lines-fill" />
        Моите публикации
      </button>
      <button
        type="button"
        onClick={onFollowing}
        className={cn(linkClass(followingActive), "w-full text-left")}
        disabled={!isAuthenticated && false}
      >
        <i className="bi bi-people" />
        Следвани
      </button>
    </nav>
  );
}

function OnlineNowWidget({ renderFollowSlot }: { renderFollowSlot?: (userId: number) => ReactNode }) {
  const { data, isPending } = useOnlineUsers(5);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/50 bg-white/90 p-4 shadow-[var(--shadow-sm)]">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-[color:var(--color-text-heading)]">
        <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)]" />
        Активни сега
      </h2>
      {isPending && <Skeleton className="h-24 w-full" />}
      {!isPending && (data?.length ?? 0) === 0 && (
        <p className="text-xs text-[color:var(--color-text-muted)]">Няма онлайн потребители в момента.</p>
      )}
      <ul className="flex flex-col gap-2">
        {data?.map((u) => (
          <li key={u.id} className="flex items-center gap-2">
            <Link href={`/user/${encodeURIComponent(u.username)}`} className="relative shrink-0">
              <Avatar username={u.username} imageUrl={u.imageUrl} size={32} />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[color:var(--color-success)]" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/user/${encodeURIComponent(u.username)}`}
                className="block truncate text-sm font-medium text-[color:var(--color-text-primary)] hover:text-primary"
              >
                {u.isSelf ? "Ти" : u.username}
              </Link>
              {u.isSelf && (
                <p className="truncate text-[11px] text-[color:var(--color-text-muted)]">{u.username}</p>
              )}
            </div>
            {!u.isSelf && renderFollowSlot?.(u.id)}
          </li>
        ))}
      </ul>
    </div>
  );
}
