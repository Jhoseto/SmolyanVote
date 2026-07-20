"use client";

import { useSyncExternalStore } from "react";
import {
  getNotificationSocketStatus,
  subscribeNotificationSocketStatus,
  type SocketStatus,
} from "../lib/notificationSocket";

export function useNotificationSocketStatus(): SocketStatus {
  return useSyncExternalStore(
    subscribeNotificationSocketStatus,
    getNotificationSocketStatus,
    () => "idle" as const,
  );
}
