"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import type { NotificationDto } from "../types";
import { useMarkAsRead, useDeleteNotification } from "../hooks/useNotificationActions";
import { normalizeActionUrl } from "../lib/normalizeActionUrl";

export function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: NotificationDto;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const markAsRead = useMarkAsRead();
  const remove = useDeleteNotification();

  function handleClick() {
    if (!notification.read) markAsRead.mutate(notification.id);
    onNavigate();
    const actionUrl = normalizeActionUrl(notification.actionUrl);
    if (actionUrl) router.push(actionUrl);
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 border-b border-border-default/50 px-4 py-3 transition-colors last:border-b-0 hover:bg-primary-50",
        !notification.read && "bg-primary-50/50",
      )}
    >
      <button type="button" onClick={handleClick} className="flex flex-1 gap-3 text-left">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            notification.read
              ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]"
              : "bg-[image:var(--gradient-primary)] text-white",
          )}
        >
          <i className={cn("bi text-[1rem]", notification.icon)} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-[color:var(--color-text-heading)]">
            {notification.title}
          </span>
          <span className="mt-0.5 block text-[0.82rem] text-[color:var(--color-text-secondary)]">
            {notification.message}
          </span>
          <span className="mt-1 block text-xs text-[color:var(--color-text-muted)]">
            {notification.timeAgo}
          </span>
        </span>
        {!notification.read && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
        )}
      </button>
      <button
        type="button"
        aria-label="Изтрий известието"
        onClick={() => remove.mutate(notification.id)}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--color-text-muted)] opacity-0 transition-opacity hover:bg-white hover:text-[color:var(--color-error)] group-hover:opacity-100"
      >
        <i className="bi bi-x text-sm" />
      </button>
    </div>
  );
}
