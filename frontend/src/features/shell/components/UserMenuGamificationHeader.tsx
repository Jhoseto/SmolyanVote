"use client";

import Link from "next/link";
import type { AchievementStats } from "@/shared/lib/gamification";
import {
  countEarnedAchievements,
  getReputationProgress,
  hasParticipantQualification,
  OBSERVER_BADGE,
} from "@/shared/lib/gamification";
import { cn } from "@/shared/lib/cn";

interface UserMenuGamificationHeaderProps {
  stats: AchievementStats;
  onNavigate?: () => void;
}

function tierIcon(badge: string): string {
  if (badge.includes("VIP")) return "bi-gem";
  if (badge === "Легенда") return "bi-stars";
  if (badge === "Експерт") return "bi-trophy-fill";
  if (badge === "Активен") return "bi-lightning-charge-fill";
  if (badge === "Ангажиран") return "bi-shield-check";
  if (badge === "Участник") return "bi-patch-check";
  if (badge === OBSERVER_BADGE) return "bi-eye";
  return "bi-person";
}

/** Compact premium reputation card for the profile dropdown — links to /achievements. */
export function UserMenuGamificationHeader({ stats, onNavigate }: UserMenuGamificationHeaderProps) {
  const progressInfo = getReputationProgress(stats);
  const { earned, total } = countEarnedAchievements(stats);
  const badge = stats.reputationBadge;
  const isObserver = !hasParticipantQualification(stats);

  return (
    <Link
      href="/achievements"
      onClick={() => onNavigate?.()}
      className={cn(
        "group mx-2 mb-1.5 block overflow-hidden rounded-[var(--radius-md)]",
        "ring-1 ring-primary/10 transition-all duration-200",
        "hover:ring-primary/18 hover:shadow-[0_6px_18px_rgba(25,134,28,0.1)]",
      )}
      style={{
        background:
          "radial-gradient(circle at 100% 0%, rgba(72,162,76,0.1), transparent 50%), linear-gradient(160deg, #f8fbf8 0%, #ffffff 100%)",
      }}
    >
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            Репутация
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] bg-white/90 px-1.5 py-px text-[0.625rem] font-medium tabular-nums text-[color:var(--color-text-muted)] ring-1 ring-black/[0.04]">
            <i className="bi bi-award text-[0.625rem] text-primary" aria-hidden />
            {earned}/{total}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold tabular-nums leading-none text-[color:var(--color-text-heading)]">
            {stats.reputationScore}
            <span className="ml-1 text-[0.625rem] font-normal text-[color:var(--color-text-muted)]">точки</span>
          </p>

          <span
            className={cn(
              "inline-flex max-w-[8.5rem] items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5",
              isObserver
                ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] ring-1 ring-black/[0.06]"
                : "bg-[image:var(--gradient-primary)] text-white shadow-[0_2px_8px_rgba(25,134,28,0.22)]",
            )}
          >
            <i className={cn("bi shrink-0 text-[0.625rem]", tierIcon(badge))} aria-hidden />
            <span className="truncate text-[0.625rem] font-semibold leading-tight">{badge}</span>
          </span>
        </div>

        {progressInfo.kind === "participant" ? (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-[0.625rem] leading-tight">
              <span className="truncate text-[color:var(--color-text-muted)]">→ Участник</span>
              <span className="shrink-0 tabular-nums font-medium text-primary">
                {progressInfo.completedSteps}/4
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-[var(--radius-pill)] bg-black/[0.06]">
              <div
                className="h-full rounded-[var(--radius-pill)] bg-primary/70"
                style={{ width: `${progressInfo.progress}%` }}
              />
            </div>
          </div>
        ) : progressInfo.next ? (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-[0.625rem] leading-tight">
              <span className="truncate text-[color:var(--color-text-muted)]">→ {progressInfo.next.badge}</span>
              <span className="shrink-0 tabular-nums font-medium text-primary">+{progressInfo.remaining}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-[var(--radius-pill)] bg-black/[0.06]">
              <div
                className="h-full rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)]"
                style={{ width: `${progressInfo.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-[0.625rem] font-medium text-primary">Макс. ниво</p>
        )}

        <p className="mt-1.5 flex items-center justify-center gap-0.5 text-[0.625rem] font-medium text-primary/85 group-hover:text-primary">
          Значки
          <i className="bi bi-chevron-right text-[0.5rem]" aria-hidden />
        </p>
      </div>
    </Link>
  );
}

/** Skeleton matching the compact reputation card. */
export function UserMenuGamificationSkeleton() {
  return (
    <div
      className="mx-2 mb-1.5 overflow-hidden rounded-[var(--radius-md)] ring-1 ring-black/[0.05]"
      style={{ background: "linear-gradient(160deg, #f8fbf8 0%, #ffffff 100%)" }}
    >
      <div className="space-y-2 px-2.5 py-2">
        <div className="flex justify-between">
          <div className="h-2 w-12 animate-pulse rounded bg-black/[0.05]" />
          <div className="h-4 w-10 animate-pulse rounded-[var(--radius-pill)] bg-black/[0.05]" />
        </div>
        <div className="flex justify-between">
          <div className="h-3.5 w-16 animate-pulse rounded bg-black/[0.05]" />
          <div className="h-5 w-20 animate-pulse rounded-[var(--radius-pill)] bg-black/[0.05]" />
        </div>
        <div className="h-1 w-full animate-pulse rounded-[var(--radius-pill)] bg-black/[0.05]" />
      </div>
    </div>
  );
}
