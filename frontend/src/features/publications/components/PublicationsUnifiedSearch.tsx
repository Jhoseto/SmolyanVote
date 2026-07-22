"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { Avatar, LogoLoader } from "@/shared/ui";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/lib/cn";
import { useUserSearch } from "../hooks/useUserSearch";
import { usePublicationsFeed } from "../hooks/usePublicationsFeed";
import { rememberAuthor } from "../lib/selectedAuthorsStorage";

interface PublicationsUnifiedSearchProps {
  /** Apply text/# search to the feed (FB “See all results”). */
  onSearchFeed: (query: string) => void;
  onSelectPublication: (id: number) => void;
  /** Optional: filter feed to this author (secondary action). */
  onFilterAuthor?: (userId: number, username: string, imageUrl: string | null) => void;
  className?: string;
}

/**
 * Facebook-style search: one pill field + live dropdown (people / posts / query).
 * No separate modals or duplicate search boxes.
 */
export function PublicationsUnifiedSearch({
  onSearchFeed,
  onSelectPublication,
  onFilterAuthor,
  className,
}: PublicationsUnifiedSearchProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 280);
  const trimmed = debounced.trim();
  const active = open && trimmed.length >= 2;

  const users = useUserSearch(trimmed);
  const posts = usePublicationsFeed(
    { search: trimmed || undefined, sort: "date-desc" },
    { enabled: active },
  );

  const postHits = posts.data?.pages[0]?.content.slice(0, 4) ?? [];
  const tagQuery = trimmed.replace(/^#/, "");
  const showTag = tagQuery.length >= 2 && (trimmed.startsWith("#") || !/\s/.test(trimmed));

  useEffect(() => {
    function onDocPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, []);

  function applyFeedSearch(value: string) {
    const next = value.replace(/^#/, "").trim();
    if (!next) return;
    onSearchFeed(next);
    setQ("");
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      applyFeedSearch(q);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3.5 transition-shadow",
          open && "bg-white shadow-[var(--shadow-md)] ring-1 ring-border-default/50",
        )}
      >
        <i className="bi bi-search shrink-0 text-[color:var(--color-text-muted)]" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Търсене"
          className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)]"
        />
        {q && (
          <button
            type="button"
            aria-label="Изчисти"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)]"
          >
            <i className="bi bi-x-lg text-[11px]" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[var(--radius-lg)] border border-border-default/50 bg-white shadow-[var(--shadow-dropdown)]"
        >
          {trimmed.length < 2 ? (
            <p className="px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
              Започнете да пишете, за да търсите хора и публикации.
            </p>
          ) : (
            <div className="max-h-[min(70vh,420px)] overflow-y-auto py-1">
              <button
                type="button"
                role="option"
                onClick={() => applyFeedSearch(q)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[color:var(--color-surface-muted)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <i className="bi bi-search" />
                </span>
                <span className="min-w-0 text-sm">
                  Търси публикации за{" "}
                  <span className="font-semibold text-primary">„{trimmed}“</span>
                </span>
              </button>

              {showTag && (
                <button
                  type="button"
                  role="option"
                  onClick={() => applyFeedSearch(tagQuery)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[color:var(--color-surface-muted)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                    <i className="bi bi-hash" />
                  </span>
                  <span className="text-sm font-semibold text-primary">#{tagQuery}</span>
                </button>
              )}

              <SectionLabel>Хора</SectionLabel>
              {users.isFetching && (
                <div className="px-3 py-2">
                  <LogoLoader size="sm" label="Търсене…" />
                </div>
              )}
              {!users.isFetching && (users.data?.length ?? 0) === 0 && (
                <p className="px-4 py-2 text-xs text-[color:var(--color-text-muted)]">Няма намерени хора.</p>
              )}
              {users.data?.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[color:var(--color-surface-muted)]"
                >
                  <Link
                    href={`/user/${encodeURIComponent(u.username)}`}
                    role="option"
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-md)] px-1 py-1.5"
                  >
                    <Avatar username={u.username} imageUrl={u.imageUrl} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {u.fullName || u.username}
                      </span>
                      <span className="block truncate text-xs text-[color:var(--color-text-muted)]">
                        @{u.username}
                      </span>
                    </span>
                  </Link>
                  {onFilterAuthor && (
                    <button
                      type="button"
                      title="Филтрирай лентата"
                      onClick={() => {
                        rememberAuthor({ id: u.id, username: u.username, imageUrl: u.imageUrl });
                        onFilterAuthor(u.id, u.username, u.imageUrl);
                        setQ("");
                        setOpen(false);
                      }}
                      className="shrink-0 rounded-[var(--radius-md)] px-2 py-1 text-xs font-medium text-primary hover:bg-primary-50"
                    >
                      Във фийда
                    </button>
                  )}
                </div>
              ))}

              <SectionLabel>Публикации</SectionLabel>
              {posts.isPending && (
                <div className="px-3 py-2">
                  <LogoLoader size="sm" label="Търсене…" />
                </div>
              )}
              {!posts.isPending && postHits.length === 0 && (
                <p className="px-4 py-2 text-xs text-[color:var(--color-text-muted)]">Няма публикации.</p>
              )}
              {postHits.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  onClick={() => {
                    onSelectPublication(p.id);
                    setQ("");
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-[color:var(--color-surface-muted)]"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]">
                      <i className="bi bi-file-text" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-sm font-medium text-[color:var(--color-text-primary)]">
                      {p.title}
                    </span>
                    <span className="block text-xs text-[color:var(--color-text-muted)]">
                      {p.authorUsername}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-3 text-xs font-semibold text-[color:var(--color-text-muted)]">{children}</p>
  );
}
