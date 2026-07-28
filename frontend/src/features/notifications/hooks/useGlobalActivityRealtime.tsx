"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/lib/authContext";
import { toast } from "@/shared/hooks/useToast";
import { ToastIcon } from "@/shared/lib/toastPresentation";
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
        icon: payload.icon ? (
          <span className="sv-toast-icon sv-toast-icon--info" aria-hidden>
            <i className={`bi sv-toast-icon__glyph ${payload.icon}`} />
          </span>
        ) : (
          ToastIcon({ variant: "info" })
        ),
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
