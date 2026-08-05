"use client";

import { cn } from "@/shared/lib/cn";
import { useMessengerUiStore } from "../store/messengerUiStore";

/**
 * Anonymous-visitor FAB — visually identical to the authenticated
 * `MessengerFab`, but with zero messenger-realtime dependencies. The real
 * `MessengerFab` imports `useUnreadCount`, which imports
 * `useStompConnectionState`, which statically imports `@stomp/stompjs` —
 * mounting it eagerly for every visitor (as this button must be, since it's
 * persistent chrome) would silently drag that ~39 KiB gzipped STOMP chunk
 * back into every anonymous page load, defeating `MessengerRootGate` in
 * `AppProviders.tsx`. This component only ever needs the UI store, so it
 * stays tiny. Always routes to the download promo — anonymous visitors
 * can't actually chat.
 */
export function MessengerFabAnon() {
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);

  return (
    <button
      type="button"
      onClick={() => setDownloadModalOpen(true)}
      aria-label="Отвори съобщенията"
      className={cn(
        "sv-msg-fab fixed bottom-[var(--sv-rail-bottom)] right-[var(--sv-rail-right)] z-[1070]",
        "flex h-[var(--sv-fab-size)] w-[var(--sv-fab-size)] items-center justify-center rounded-full",
        "text-[22px] text-white",
        "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <i className="relative bi bi-chat-dots-fill" aria-hidden />
    </button>
  );
}
