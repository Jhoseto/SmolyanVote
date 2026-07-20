import type { Page } from "@/types/api";

/**
 * Mirrors backend `NotificationDTO` (viewsAndDTO/NotificationDTO.java).
 * Server-authoritative: `icon`, `displayName`, `timeAgo` are computed
 * backend-side — never re-derived on the client (single source of truth).
 */
export interface NotificationDto {
  id: number;
  type: string;
  title: string;
  message: string;
  actorUsername: string | null;
  actorImageUrl: string | null;
  entityType: string | null;
  entityId: number | null;
  actionUrl: string | null;
  /** Jackson strips the `is` prefix from `isRead()` → JSON key `read`. */
  read: boolean;
  createdAt: string;
  priority: string;
  icon: string;
  timeAgo: string;
  displayName: string;
}

export type NotificationPage = Page<NotificationDto>;
