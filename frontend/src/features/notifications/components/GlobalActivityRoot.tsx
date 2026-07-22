"use client";

import { useGlobalActivityRealtime } from "../hooks/useGlobalActivityRealtime";

/** Mounts global activity toasts app-wide (independent of NotificationBell). */
export function GlobalActivityRoot() {
  useGlobalActivityRealtime();
  return null;
}
