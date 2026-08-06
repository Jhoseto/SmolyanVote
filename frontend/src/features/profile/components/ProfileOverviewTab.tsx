import type { PublicProfile } from "../types";
import Link from "next/link";
import {
  PARTICIPANT_STEPS,
  REPUTATION_POINT_RULES,
  SIGNAL_ACHIEVEMENTS,
  getEarnedSignalAchievement,
  getReputationProgress,
  hasParticipantQualification,
  toAchievementStats,
} from "@/shared/lib/gamification";
import { cn } from "@/shared/lib/cn";

/** Reputation breakdown — the one piece of "overview" content not already covered by the header/other tabs. */
export function ProfileOverviewTab({ profile }: { profile: PublicProfile }) {
  const stats = toAchievementStats(profile);
  const progressInfo = getReputationProgress(stats);
  const earnedSignalBadge = getEarnedSignalAchievement(stats);
  const isObserver = !hasParticipantQualification(stats);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[color:var(--color-text-muted)]">Репутация</p>
            <p className="text-2xl font-bold text-[color:var(--color-text-heading)]">{profile.reputationScore}</p>
          </div>
          <span
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-semibold",
              isObserver ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]" : "bg-primary-50 text-primary",
            )}
          >
            {profile.reputationBadge}
          </span>
        </div>

        {isObserver ? (
          <div className="rounded-[var(--radius-md)] border border-border-default/60 bg-[color:var(--color-surface-light)]/80 p-4">
            <p className="text-sm font-semibold text-[color:var(--color-text-heading)]">Как да станеш Участник</p>
            <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
              Направи по едно действие от всяка категория — тогава точките започват да трупат нива.
            </p>
            <ul className="mt-3 space-y-2">
              {PARTICIPANT_STEPS.map((step) => {
                const done = step.met(stats);
                return (
                  <li key={step.id} className="flex items-center gap-2 text-sm">
                    <i
                      className={cn(
                        "bi text-base",
                        done ? "bi-check-circle-fill text-primary" : "bi-circle text-[color:var(--color-text-muted)]",
                      )}
                      aria-hidden
                    />
                    <span className={done ? "text-[color:var(--color-text-primary)]" : "text-[color:var(--color-text-muted)]"}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            {progressInfo.kind === "participant" ? (
              <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
                Напредък: {progressInfo.completedSteps} от 4 категории
              </p>
            ) : null}
          </div>
        ) : progressInfo.kind === "points" && progressInfo.next ? (
          <div>
            <div className="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)]">
              <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${progressInfo.progress}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-[color:var(--color-text-muted)]">
              Още {progressInfo.remaining} точки до „{progressInfo.next.badge}“
            </p>
          </div>
        ) : null}

        <p className="text-xs text-[color:var(--color-text-muted)]">
          {REPUTATION_POINT_RULES.map((rule, index) => (
            <span key={rule.action}>
              {index > 0 ? " · " : ""}
              {rule.action} (+{rule.points})
            </span>
          ))}
        </p>

        <Link
          href="/achievements"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <i className="bi bi-award" />
          Всички значки и постижения
        </Link>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[color:var(--color-text-heading)]">Сигнали и значки</p>
          <span className="text-sm font-bold tabular-nums text-primary">{profile.signalsCount}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIGNAL_ACHIEVEMENTS.map((badge) => {
            const earned = profile.signalsCount >= badge.threshold;
            return (
              <span
                key={badge.id}
                className={
                  earned
                    ? "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/60"
                    : "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-muted)]"
                }
              >
                <i className={`bi ${badge.icon}`} />
                {badge.label}
                {!earned ? ` (${badge.threshold}+)` : null}
              </span>
            );
          })}
        </div>
        {earnedSignalBadge ? (
          <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
            Текуща значка: <strong>{earnedSignalBadge.label}</strong>
          </p>
        ) : (
          <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">Подай 3 сигнала, за да отключиш значка „Гражданин“.</p>
        )}
      </div>
    </div>
  );
}
