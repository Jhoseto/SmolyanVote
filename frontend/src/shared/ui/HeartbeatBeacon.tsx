"use client";

import { useHeartbeat } from "@/shared/hooks/useHeartbeat";

/** Invisible mount point for `useHeartbeat()` — needs `<AuthProvider>` context. */
export function HeartbeatBeacon() {
  useHeartbeat();
  return null;
}
