"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/lib/authContext";
import { toast } from "@/shared/hooks/useToast";
import { hapticNotify } from "@/shared/lib/haptic";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  onGlobalActivityMessage,
} from "@/features/notifications/lib/notificationSocket";

export interface GlobalActivityToast {
  kind: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  icon?: string | null;
}

/** Site-wide ephemeral toasts for connected users on any page. */
export function useGlobalActivityRealtime(): void {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    connectNotificationSocket();

    const unsubscribe = onGlobalActivityMessage((payload: GlobalActivityToast) => {
      hapticNotify();
      toast(payload.title, {
        description: payload.message,
        duration: 5000,
        icon: payload.icon ? <i className={`bi ${payload.icon}`} /> : undefined,
        action: payload.actionUrl
          ? {
              label: "Виж",
              onClick: () => router.push(payload.actionUrl!),
            }
          : undefined,
      });
    });

    return () => {
      unsubscribe();
      // Do not disconnect — NotificationBell may still need the socket.
    };
  }, [isAuthenticated, router]);
}
