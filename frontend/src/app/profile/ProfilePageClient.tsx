"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfilePage } from "@/features/profile";
import { FollowButton } from "@/features/follow";
import { ReportButton } from "@/features/reports";
import { LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";

/** Composes cross-feature per-user actions (features never import features — MODERN_FRONTEND_PLAN §Frontend architecture rules). */
export function ProfilePageClient() {
  const { isAuthenticated, isHydrated, isLoadingUser, user } = useAuth();
  const router = useRouter();
  const openAuth = useLoginGateStore((s) => s.open);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoadingUser && !isAuthenticated) {
      openAuth("login");
      router.replace("/");
    }
  }, [isHydrated, isLoadingUser, isAuthenticated, openAuth, router]);

  if (!isHydrated || isLoadingUser || !isAuthenticated || !user) {
    return <LogoLoader fullScreen size="lg" label="Зареждане на профил…" />;
  }

  return (
    <ProfilePage
      username={user.username}
      renderFollowButton={(userId) => <FollowButton userId={userId} />}
      renderReportUserButton={(userId) => <ReportButton entityType="USER" entityId={userId} />}
    />
  );
}
