"use client";

import { cn } from "@/shared/lib/cn";
import {
  OBSERVER_BADGE,
  PARTICIPANT_BADGE,
  PARTICIPANT_STEPS,
  REPUTATION_POINT_TIERS,
  hasParticipantQualification,
  type AchievementStats,
} from "@/shared/lib/gamification";

function tierIcon(badge: string): string {
  if (badge.includes("VIP")) return "bi-gem";
  if (badge === "Легенда") return "bi-stars";
  if (badge === "Експерт") return "bi-trophy-fill";
  if (badge === "Активен") return "bi-lightning-charge-fill";
  if (badge === "Ангажиран") return "bi-shield-check";
  if (badge === PARTICIPANT_BADGE) return "bi-patch-check";
  if (badge === OBSERVER_BADGE) return "bi-eye";
  return "bi-person";
}

export function ReputationLadder({ stats }: { stats: AchievementStats }) {
  const isObserver = !hasParticipantQualification(stats);
  const badge = stats.reputationBadge;

  if (isObserver) {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {PARTICIPANT_STEPS.map((step) => {
          const done = step.met(stats);
          return (
            <li
              key={step.id}
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[0.6875rem] ring-1",
                done
                  ? "bg-primary/8 text-primary ring-primary/15"
                  : "bg-[color:var(--color-surface-light)] text-[color:var(--color-text-muted)] ring-black/[0.06]",
              )}
            >
              <i className={cn("bi shrink-0 text-[0.5625rem]", done ? "bi-check2" : "bi-circle")} aria-hidden />
              <span className="truncate">{step.label}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  const tiers = [{ badge: PARTICIPANT_BADGE, threshold: 0 }, ...REPUTATION_POINT_TIERS];
  const currentIndex = tiers.findIndex((t) => t.badge === badge);

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tiers.map((tier, index) => {
        const isCurrent = tier.badge === badge;
        const isPast = currentIndex >= 0 && index < currentIndex;
        return (
          <li
            key={tier.badge}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[0.6875rem] font-medium ring-1",
              isCurrent
                ? "bg-primary text-white ring-primary/30"
                : isPast
                  ? "bg-primary/8 text-primary ring-primary/12"
                  : "bg-[color:var(--color-surface-light)] text-[color:var(--color-text-muted)] ring-black/[0.06]",
            )}
          >
            <i className={cn("bi shrink-0 text-[0.5625rem]", tierIcon(tier.badge))} aria-hidden />
            <span>{tier.badge}</span>
            {tier.threshold > 0 ? (
              <span className={cn("tabular-nums opacity-70", isCurrent && "opacity-90")}>{tier.threshold}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
