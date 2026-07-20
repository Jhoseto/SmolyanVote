"use client";

import { useMemo, useState } from "react";
import { Avatar, EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { useConversations } from "../hooks/useConversations";
import { useHideConversation } from "../hooks/useHideConversation";
import { useMessengerUiStore } from "../store/messengerUiStore";

export function ConversationList() {
  const { data, isPending, isError, refetch } = useConversations();
  const openChat = useMessengerUiStore((s) => s.openChat);
  const showSearch = useMessengerUiStore((s) => s.showSearch);
  // openChat closes the list panel and opens a floating window
  const typingByConversation = useMessengerUiStore((s) => s.typingByConversation);
  const onlineByUserId = useMessengerUiStore((s) => s.onlineByUserId);
  const { mutate: hide } = useHideConversation();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q || !data) return data ?? [];
    return data.filter(
      (c) =>
        c.otherUser.username.toLowerCase().includes(q) ||
        (c.otherUser.fullName?.toLowerCase().includes(q) ?? false) ||
        (c.lastMessage?.toLowerCase().includes(q) ?? false),
    );
  }, [data, filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border-default/60 p-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Филтрирай разговори…"
          className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-border-default/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={showSearch}
          aria-label="Нов разговор"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary/15"
        >
          <i className="bi bi-pencil-square" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending && (
          <div className="flex justify-center py-10">
            <LogoLoader size="sm" label="Зареждане…" />
          </div>
        )}

        {isError && (
          <ErrorState description="Разговорите не можаха да се заредят." onRetry={() => refetch()} />
        )}

        {!isPending && !isError && filtered.length === 0 && (
          <EmptyState
            icon="bi-chat"
            title={filter ? "Няма съвпадения" : "Няма разговори"}
            description={!filter ? "Започни нов разговор с бутона горе вдясно." : undefined}
          />
        )}

        {filtered.map((c) => {
          const online = onlineByUserId[c.otherUser.id] ?? c.otherUser.isOnline ?? false;
          const typing = typingByConversation[c.id] ?? c.isTyping;

          return (
            <div
              key={c.id}
              className="group flex items-center gap-1 border-b border-border-default/40 hover:bg-[color:var(--color-surface-muted)]"
            >
              <button
                type="button"
                onClick={() => openChat(c.id)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
              >
                <div className="relative shrink-0">
                  <Avatar username={c.otherUser.username} imageUrl={c.otherUser.imageUrl} size={44} />
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                      online ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-text-muted)]",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[color:var(--color-text-heading)]">
                      {c.otherUser.fullName || c.otherUser.username}
                    </p>
                    {c.lastMessageTime && (
                      <span className="shrink-0 text-[10px] text-[color:var(--color-text-muted)]">
                        {formatRelativeDate(c.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-xs",
                        typing
                          ? "italic text-primary"
                          : "text-[color:var(--color-text-muted)]",
                      )}
                    >
                      {typing ? "пише…" : c.lastMessage || "Няма съобщения"}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => hide(c.id)}
                aria-label="Скрий разговора"
                className="mr-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-white hover:text-[color:var(--color-error)] group-hover:flex"
              >
                <i className="bi bi-eye-slash text-sm" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
