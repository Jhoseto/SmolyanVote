"use client";

import { useState } from "react";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useUserSearch } from "../hooks/useUserSearch";
import { loadRememberedAuthors, rememberAuthor } from "../lib/selectedAuthorsStorage";

interface AuthorSearchFilterProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Multi-author filter (MODERN_FRONTEND_PLAN.md §Filters sidebar `userIds`) —
 * debounced typeahead over `/api/svmessenger/users/search` + removable chips,
 * mirrors legacy `userSearch.js` interaction (tag chips, not checkboxes).
 */
export function AuthorSearchFilter({ selectedIds, onChange }: AuthorSearchFilterProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isFetching } = useUserSearch(debouncedQuery);

  const selectedAuthors = loadRememberedAuthors(selectedIds);
  const visibleResults = (results ?? []).filter((u) => !selectedIds.includes(u.id));

  function addAuthor(id: number, username: string, imageUrl: string | null) {
    rememberAuthor({ id, username, imageUrl });
    onChange([...selectedIds, id]);
    setQuery("");
    setOpen(false);
  }

  function removeAuthor(id: number) {
    onChange(selectedIds.filter((existing) => existing !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative min-w-[220px] flex-1">
        <i className="bi bi-person-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Търси автори…"
          className="h-10 w-full rounded-[var(--radius-md)] border border-border-default/60 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
        />

        {open && debouncedQuery.trim().length >= 2 && (
          <div className="absolute left-0 top-full z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-[var(--radius-md)] border border-border-default/60 bg-white shadow-[var(--shadow-md)]">
            {isFetching && <p className="p-3 text-xs text-[color:var(--color-text-muted)]">Търсене…</p>}
            {!isFetching && visibleResults.length === 0 && (
              <p className="p-3 text-xs text-[color:var(--color-text-muted)]">Няма намерени потребители.</p>
            )}
            {visibleResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => addAuthor(user.id, user.username, user.imageUrl)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-[color:var(--color-surface-muted)]"
              >
                <Avatar username={user.username} imageUrl={user.imageUrl} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[color:var(--color-text-primary)]">
                    {user.fullName || user.username}
                  </p>
                  <p className="truncate text-xs text-[color:var(--color-text-muted)]">@{user.username}</p>
                </div>
                {user.isOnline && <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-success)]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedAuthors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedAuthors.map((author) => (
            <span
              key={author.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary-50 py-1 pl-1 pr-2 text-xs font-medium text-primary",
              )}
            >
              <Avatar username={author.username} imageUrl={author.imageUrl} size={18} />
              {author.username}
              <button
                type="button"
                onClick={() => removeAuthor(author.id)}
                aria-label={`Премахни ${author.username}`}
                className="hover:text-[color:var(--color-error)]"
              >
                <i className="bi bi-x-lg text-[10px]" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
