"use client";

import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { useIsDesktopMessenger } from "../lib/isDesktopMessenger";

export function MessengerFab() {
  const { isAuthenticated } = useAuth();
  const { data: unread = 0 } = useUnreadCount();
  const panelOpen = useMessengerUiStore((s) => s.panelOpen);
  const togglePanel = useMessengerUiStore((s) => s.togglePanel);
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);
  const isDesktop = useIsDesktopMessenger();

  function handleClick() {
    // Same gate as MessengerPanel — never toggle a panel that won't render.
    if (!isAuthenticated || !isDesktop) {
      setDownloadModalOpen(true);
      return;
    }
    togglePanel();
  }

  const hasUnread = isAuthenticated && unread > 0 && !panelOpen;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={panelOpen ? "Затвори съобщенията" : "Отвори съобщенията"}
      className={cn(
        "sv-msg-fab fixed bottom-[var(--sv-rail-bottom)] right-[var(--sv-rail-right)] z-[1070]",
        "flex h-[var(--sv-fab-size)] w-[var(--sv-fab-size)] items-center justify-center rounded-full",
        "text-[22px] text-white",
        "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      {hasUnread && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[color:var(--color-primary)]/40 [animation-iteration-count:2]"
        />
      )}
      <i className={cn("relative bi", panelOpen ? "bi-x-lg" : "bi-chat-dots-fill")} />
      {hasUnread && (
        <span className="sv-msg-num absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[11px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
