"use client";

import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { isMobileViewport } from "../lib/isMobileViewport";

export function MessengerFab() {
  const { isAuthenticated } = useAuth();
  const { data: unread = 0 } = useUnreadCount();
  const panelOpen = useMessengerUiStore((s) => s.panelOpen);
  const togglePanel = useMessengerUiStore((s) => s.togglePanel);
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);

  function handleClick() {
    if (!isAuthenticated || isMobileViewport()) {
      setDownloadModalOpen(true);
      return;
    }
    togglePanel();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={panelOpen ? "Затвори съобщенията" : "Отвори съобщенията"}
      className={cn(
        "fixed bottom-6 right-6 z-[1070] flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[image:var(--gradient-primary)] text-2xl text-white shadow-[var(--shadow-lg)]",
        "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <i className={cn("bi", panelOpen ? "bi-x-lg" : "bi-chat-dots-fill")} />
      {isAuthenticated && unread > 0 && !panelOpen && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[11px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
