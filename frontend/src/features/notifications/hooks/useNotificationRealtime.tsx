"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/lib/authContext";
import { toast } from "@/shared/hooks/useToast";
import { hapticNotify } from "@/shared/lib/haptic";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  onNotificationMessage,
} from "../lib/notificationSocket";
import type { NotificationDto } from "../types";
import { normalizeActionUrl } from "../lib/normalizeActionUrl";

const RECENT_KEY = ["notifications", "recent"] as const;
const UNREAD_KEY = ["notifications", "unread-count"] as const;
const MAX_RECENT = 10;

/**
 * Wires the SockJS push channel into the TanStack Query cache — no reload,
 * no full refetch. Mount once (in `NotificationBell`) for authenticated
 * users. Shows a 4s toast on new notifications (click navigates client-side).
 */
export function useNotificationRealtime(): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    connectNotificationSocket();

    const unsubscribe = onNotificationMessage((notification: NotificationDto) => {
      queryClient.setQueryData<NotificationDto[]>(RECENT_KEY, (prev) => {
        const next = [notification, ...(prev ?? []).filter((n) => n.id !== notification.id)];
        return next.slice(0, MAX_RECENT);
      });
      queryClient.setQueryData<{ count: number }>(UNREAD_KEY, (prev) => ({
        count: (prev?.count ?? 0) + (notification.read ? 0 : 1),
      }));

      hapticNotify();
      toast(notification.title, {
        description: notification.message,
        duration: 4000,
        icon: <i className={`bi ${notification.icon}`} />,
        action: (() => {
          const actionUrl = normalizeActionUrl(notification.actionUrl);
          return actionUrl
            ? {
                label: "Виж",
                onClick: () => router.push(actionUrl),
              }
            : undefined;
        })(),
      });
    });

    return () => {
      unsubscribe();
      disconnectNotificationSocket();
    };
  }, [isAuthenticated, queryClient, router]);
}
