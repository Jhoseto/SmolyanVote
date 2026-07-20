"use client";

import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useConversations } from "../hooks/useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";

/** Windows-style bar for minimized chat windows (legacy SVTaskbar port). */
export function Taskbar() {
  const activeChats = useMessengerUiStore((s) => s.activeChats);
  const restoreChat = useMessengerUiStore((s) => s.restoreChat);
  const closeChat = useMessengerUiStore((s) => s.closeChat);
  const onlineByUserId = useMessengerUiStore((s) => s.onlineByUserId);
  const { data: conversations } = useConversations();

  const minimized = [...activeChats].filter((c) => c.isMinimized).reverse();
  if (minimized.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[1065] flex -translate-x-1/2 items-end gap-2">
      {minimized.map((chat) => {
        const conv = conversations?.find((c) => c.id === chat.conversationId);
        const other = conv?.otherUser;
        if (!other) return null;
        const online = onlineByUserId[other.id] ?? other.isOnline ?? false;

        return (
          <div key={chat.conversationId} className="group relative">
            <button
              type="button"
              onClick={() => restoreChat(chat.conversationId)}
              className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border-default/60 bg-white px-3 py-1.5 shadow-[var(--shadow-md)] hover:border-primary/40"
            >
              <div className="relative">
                <Avatar username={other.username} imageUrl={other.imageUrl} size={28} />
                <span
                  className={cn(
                    "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white",
                    online ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-text-muted)]",
                  )}
                />
              </div>
              <span className="max-w-[100px] truncate text-xs font-medium text-[color:var(--color-text-heading)]">
                {other.fullName || other.username}
              </span>
              {(conv?.unreadCount ?? 0) > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {conv!.unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => closeChat(chat.conversationId)}
              aria-label="Затвори"
              className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-error)] text-[10px] text-white group-hover:flex"
            >
              <i className="bi bi-x" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
