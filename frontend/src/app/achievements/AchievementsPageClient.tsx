"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AchievementsPage } from "@/features/profile/components/AchievementsPage";
import { ErrorState, LogoLoader } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { useMyProfileStats } from "@/shared/hooks/useMyProfileStats";

export function AchievementsPageClient() {
  const { isAuthenticated, isHydrated, isLoadingUser } = useAuth();
  const router = useRouter();
  const openAuth = useLoginGateStore((s) => s.open);
  const { stats, isPending, isError, refetch } = useMyProfileStats(isAuthenticated);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoadingUser && !isAuthenticated) {
      openAuth("login");
      router.replace("/");
    }
  }, [isHydrated, isLoadingUser, isAuthenticated, openAuth, router]);

  if (!isHydrated || isLoadingUser || !isAuthenticated) {
    return <LogoLoader fullScreen size="lg" label="Зареждане…" />;
  }

  if (isPending || !stats) {
    return <LogoLoader fullScreen size="lg" label="Зареждане на постижения…" />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-8">
        <ErrorState description="Постиженията не можаха да се заредят." onRetry={() => void refetch()} />
      </div>
    );
  }

  return <AchievementsPage stats={stats} />;
}
