"use client";

import { ProfilePage } from "@/features/profile";
import { FollowButton } from "@/features/follow";
import { ReportButton } from "@/features/reports";
import { MessageUserButton } from "@/features/messenger";

/** Composes cross-feature per-user actions (features never import features — MODERN_FRONTEND_PLAN §Frontend architecture rules). */
export function UserProfileClient({ username }: { username: string }) {
  return (
    <ProfilePage
      username={username}
      renderFollowButton={(userId) => <FollowButton userId={userId} />}
      renderReportUserButton={(userId) => <ReportButton entityType="USER" entityId={userId} />}
      renderMessageButton={(userId) => <MessageUserButton userId={userId} />}
    />
  );
}
