import { useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/shared/lib/authContext";

const HEARTBEAT_INTERVAL_MS = 60_000;

/** Ports v1 `sendHeartbeat()` (POST /heartbeat every 60s while logged in). */
export function useHeartbeat(): void {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const send = () => {
      apiClient.post("/heartbeat").catch(() => {
        // Best-effort presence ping — a missed beat is not user-facing.
      });
    };

    send();
    const interval = setInterval(send, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
}
