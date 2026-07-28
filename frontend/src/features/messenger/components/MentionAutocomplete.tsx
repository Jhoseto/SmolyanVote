"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { messengerApi } from "../api";

/** The `@word` currently under the caret, if any. */
export function mentionQueryAt(text: string, caret: number): { query: string; start: number } | null {
  const before = text.slice(0, caret);
  const match = before.match(/(?:^|\s)@([\p{L}\p{N}_.-]{0,20})$/u);
  if (!match) return null;
  return { query: match[1], start: caret - match[1].length - 1 };
}

export function MentionAutocomplete({
  query,
  onPick,
  onDismiss,
}: {
  query: string;
  onPick: (username: string) => void;
  onDismiss: () => void;
}) {
  const [cursor, setCursor] = useState(0);
  const [lastQuery, setLastQuery] = useState(query);
  const { data: users = [] } = useQuery({
    queryKey: ["messenger", "mentions", query],
    queryFn: () => (query ? messengerApi.searchUsers(query) : messengerApi.followingUsers()),
    staleTime: 30_000,
  });

  const options = users.slice(0, 6);

  // Reset the highlight while rendering rather than in an effect (React docs:
  // "adjusting state when a prop changes").
  if (query !== lastQuery) {
    setLastQuery(query);
    setCursor(0);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (options.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(c + 1, options.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        onPick(options[cursor].username);
      } else if (event.key === "Escape") {
        onDismiss();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [options, cursor, onPick, onDismiss]);

  if (options.length === 0) return null;

  return (
    <ul className="sv-msg-surface absolute bottom-full left-3 z-30 mb-1 w-56 overflow-hidden p-1" data-glass="on">
      {options.map((user, index) => (
        <li key={user.id}>
          <button
            type="button"
            onMouseEnter={() => setCursor(index)}
            onClick={() => onPick(user.username)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[12px]",
              index === cursor
                ? "bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
                : "hover:bg-[color:var(--color-surface-light)]",
            )}
          >
            <Avatar username={user.username} imageUrl={user.imageUrl} size={22} />
            <span className="min-w-0 flex-1 truncate">{user.username}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
