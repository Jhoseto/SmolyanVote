"use client";

import { EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { useRecentNotifications } from "../hooks/useRecentNotifications";
import { useMarkAllAsRead } from "../hooks/useNotificationActions";
import { NotificationItem } from "./NotificationItem";

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useRecentNotifications();
  const markAllAsRead = useMarkAllAsRead();

  const hasUnread = data?.some((n) => !n.read) ?? false;

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-50 max-h-[480px] w-[360px] overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white shadow-[var(--shadow-dropdown)]">
      <div className="flex items-center justify-between border-b border-border-default/60 px-4 py-3">
        <h3 className="text-sm font-bold text-[color:var(--color-text-heading)]">Известия</h3>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllAsRead.mutate()}
            className="text-xs font-medium text-primary transition-colors hover:text-primary-700"
          >
            Маркирай всички
          </button>
        )}
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <LogoLoader size="sm" label="Зареждане…" />
          </div>
        )}

        {isError && <ErrorState className="py-8" onRetry={() => refetch()} />}

        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState
            icon="bi-bell-slash"
            title="Няма известия"
            description="Тук ще виждаш известия за коментари, гласувания и последователи."
            className="py-8"
          />
        )}

        {!isLoading &&
          !isError &&
          data?.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onNavigate={onClose} />
          ))}
      </div>
    </div>
  );
}
