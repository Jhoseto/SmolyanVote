"use client";

import { cn } from "@/shared/lib/cn";
import { useStompConnectionState } from "../hooks/useStompConnectionState";

/** Visible while STOMP is down — REST poll keeps data fresh (Фаза 10). */
export function ConnectionBanner() {
  const state = useStompConnectionState();
  if (state === "connected" || state === "disconnected") return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-[5.5rem] right-6 z-[1068] max-w-[280px] rounded-[var(--radius-md)] px-3 py-2 text-xs shadow-[var(--shadow-md)]",
        state === "connecting" && "bg-white text-[color:var(--color-text-secondary)]",
        state === "reconnecting" && "bg-amber-50 text-amber-800",
      )}
    >
      <i className="bi bi-wifi-off mr-1.5" />
      {state === "connecting" ? "Свързване с чата…" : "Няма връзка — опит за reconnect…"}
    </div>
  );
}
