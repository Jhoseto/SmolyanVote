"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { ReputationLadder } from "./ReputationLadder";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ALL_ACHIEVEMENTS,
  OBSERVER_BADGE,
  PARTICIPANT_BADGE,
  countEarnedAchievements,
  evaluateAllAchievements,
  getReputationProgress,
  hasParticipantQualification,
  sortAchievementsForDisplay,
  REPUTATION_POINT_RULES,
  type AchievementCategory,
  type AchievementStats,
  type EvaluatedAchievement,
} from "@/shared/lib/gamification";

const CATEGORY_ORDER: AchievementCategory[] = [
  "reputation",
  "signals",
  "events",
  "publications",
  "social",
  "community",
];

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  reputation: "bi-award",
  signals: "bi-megaphone",
  events: "bi-calendar-event",
  publications: "bi-journal-text",
  social: "bi-people",
  community: "bi-house-heart",
};

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

function AchievementCard({ item }: { item: EvaluatedAchievement }) {
  return (
    <article
      className={cn(
        "rounded-[var(--radius-md)] border px-2.5 py-2",
        item.earned
          ? "border-primary/20 bg-primary-50/30"
          : "border-border-default/60 bg-white",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
            item.earned ? "bg-primary text-white" : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]",
          )}
        >
          <i className={cn("bi", item.icon)} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className={cn(
                "min-w-0 flex-1 truncate text-xs font-semibold",
                item.earned ? "text-[color:var(--color-text-heading)]" : "text-[color:var(--color-text-secondary)]",
              )}
            >
              {item.label}
            </h3>
            {item.earned ? (
              <i className="bi bi-check-circle-fill shrink-0 text-[0.6875rem] text-primary" aria-label="Отключена" />
            ) : (
              <span className="shrink-0 tabular-nums text-[0.625rem] text-[color:var(--color-text-muted)]">
                {item.currentValue}/{item.threshold}
              </span>
            )}
          </div>
          <p className="mt-px truncate text-[0.6875rem] leading-tight text-[color:var(--color-text-muted)]">
            {item.description}
          </p>
        </div>
      </div>

      {!item.earned ? (
        <div className="mt-1.5 flex items-center gap-2 pl-9">
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)]">
            <div className="h-full bg-primary/60" style={{ width: `${item.progress}%` }} />
          </div>
          <span className="shrink-0 text-[0.625rem] tabular-nums text-[color:var(--color-text-muted)]">−{item.remaining}</span>
        </div>
      ) : null}
    </article>
  );
}

function CategoryFilterPills({
  active,
  onChange,
  counts,
}: {
  active: AchievementCategory | "all";
  onChange: (value: AchievementCategory | "all") => void;
  counts: Record<AchievementCategory | "all", { earned: number; total: number }>;
}) {
  const pills: { id: AchievementCategory | "all"; label: string }[] = [
    { id: "all", label: "Всички" },
    ...CATEGORY_ORDER.map((id) => ({ id, label: ACHIEVEMENT_CATEGORY_LABELS[id] })),
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill) => {
        const isActive = active === pill.id;
        const count = counts[pill.id];
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onChange(pill.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-white"
                : "bg-white text-[color:var(--color-text-secondary)] ring-1 ring-black/[0.08] hover:text-primary",
            )}
          >
            {pill.label}
            <span className={cn("tabular-nums text-[0.625rem]", isActive ? "text-white/80" : "text-[color:var(--color-text-muted)]")}>
              {count.earned}/{count.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Full achievements gallery — reputation tiers, signal/event/pub/social milestones. */
export function AchievementsPage({ stats }: { stats: AchievementStats }) {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");

  const evaluated = evaluateAllAchievements(stats);
  const { earned, total } = countEarnedAchievements(stats);
  const progressInfo = getReputationProgress(stats);
  const isObserver = !hasParticipantQualification(stats);
  const badge = stats.reputationBadge;

  const byCategory = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: sortAchievementsForDisplay(evaluated.filter((item) => item.category === category)),
      })).filter((section) => section.items.length > 0),
    [evaluated],
  );

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<AchievementCategory | "all", { earned: number; total: number }>;
    counts.all = { earned, total };
    for (const category of CATEGORY_ORDER) {
      const items = evaluated.filter((i) => i.category === category);
      counts[category] = {
        earned: items.filter((i) => i.earned).length,
        total: items.length,
      };
    }
    return counts;
  }, [evaluated, earned, total]);

  const visibleSections =
    activeCategory === "all" ? byCategory : byCategory.filter((section) => section.category === activeCategory);

  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold text-[color:var(--color-text-heading)]">Значки и постижения</h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {earned} от {total} отключени · {stats.reputationScore} точки · {badge}
        </p>
      </header>

      {/* Summary */}
      <section className="rounded-[var(--radius-lg)] border border-border-default/60 bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-[color:var(--color-text-heading)]">
                {stats.reputationScore}
              </span>
              <span className="text-xs text-[color:var(--color-text-muted)]">точки</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium",
                  isObserver
                    ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]"
                    : "bg-primary/10 text-primary",
                )}
              >
                <i className={cn("bi text-[0.625rem]", tierIcon(badge))} aria-hidden />
                {badge}
              </span>
            </div>

            {progressInfo.kind === "participant" ? (
              <div>
                <div className="mb-1 flex justify-between text-xs text-[color:var(--color-text-muted)]">
                  <span>Към „Участник“</span>
                  <span className="tabular-nums">{progressInfo.completedSteps}/4</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)]">
                  <div className="h-full bg-primary/70" style={{ width: `${progressInfo.progress}%` }} />
                </div>
              </div>
            ) : progressInfo.next ? (
              <div>
                <div className="mb-1 flex justify-between text-xs text-[color:var(--color-text-muted)]">
                  <span>→ {progressInfo.next.badge}</span>
                  <span className="tabular-nums text-primary">+{progressInfo.remaining}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)]">
                  <div className="h-full bg-primary/70" style={{ width: `${progressInfo.progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-primary">Максимално ниво</p>
            )}

            <ReputationLadder stats={stats} />
          </div>

          <div className="shrink-0 sm:w-44 sm:border-l sm:border-black/[0.06] sm:pl-4">
            <p className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
              Точки
            </p>
            <ul className="space-y-1 text-xs text-[color:var(--color-text-secondary)]">
              {REPUTATION_POINT_RULES.map((rule) => (
                <li key={rule.action} className="flex justify-between gap-2">
                  <span className="truncate">{rule.action}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-primary">+{rule.points}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CategoryFilterPills active={activeCategory} onChange={setActiveCategory} counts={categoryCounts} />

      {visibleSections.map(({ category, items }) => {
        const sectionEarned = items.filter((i) => i.earned).length;
        return (
          <section key={category} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
              <i className={cn("bi text-sm text-primary", CATEGORY_ICONS[category])} aria-hidden />
              <h2 className="text-sm font-semibold text-[color:var(--color-text-heading)]">
                {ACHIEVEMENT_CATEGORY_LABELS[category]}
              </h2>
              <span className="text-xs tabular-nums text-[color:var(--color-text-muted)]">
                {sectionEarned}/{items.length}
              </span>
            </div>
            <div className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <AchievementCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-center text-xs text-[color:var(--color-text-muted)]">
        {ALL_ACHIEVEMENTS.length} значки общо
      </p>
    </div>
  );
}
