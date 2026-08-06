/** Shared reputation / achievement definitions — mirrors backend `ReputationCalculator`. */

export type AchievementCategory = "reputation" | "signals" | "events" | "publications" | "social" | "community";

export interface AchievementStats {
  reputationScore: number;
  reputationBadge: string;
  signalsCount: number;
  eventsCount: number;
  publicationsCount: number;
  votesCount: number;
  followersCount: number;
  followingCount: number;
  memberSince: string;
}

export interface ReputationTier {
  threshold: number;
  badge: string;
  description: string;
}

export interface ThresholdAchievement {
  id: string;
  category: AchievementCategory;
  label: string;
  description: string;
  icon: string;
  threshold: number;
  current: (stats: AchievementStats) => number;
}

export interface EvaluatedAchievement extends ThresholdAchievement {
  earned: boolean;
  progress: number;
  currentValue: number;
  remaining: number;
}

/** Must match {@code ReputationCalculator} point weights — highest value first for display. */
export const REPUTATION_POINT_RULES = [
  { action: "Създадено събитие / анкета", points: 15 },
  { action: "Публикация", points: 5 },
  { action: "Граждански сигнал", points: 5 },
  { action: "Подаден глас", points: 1 },
  { action: "Коментар", points: 1 },
] as const;

export const OBSERVER_BADGE = "Наблюдаващ";
export const PARTICIPANT_BADGE = "Участник";

/** Steps required before the user can become {@link PARTICIPANT_BADGE}. */
export const PARTICIPANT_STEPS = [
  { id: "event", label: "Създай събитие или анкета", met: (s: AchievementStats) => s.eventsCount >= 1 },
  { id: "vote", label: "Подай глас", met: (s: AchievementStats) => s.votesCount >= 1 },
  { id: "publication", label: "Публикувай статия", met: (s: AchievementStats) => s.publicationsCount >= 1 },
  { id: "signal", label: "Подай граждански сигнал", met: (s: AchievementStats) => s.signalsCount >= 1 },
] as const;

/** Point-based tiers — only after {@link PARTICIPANT_BADGE}. Mirrors {@code ReputationCalculator.badge}. */
export const REPUTATION_POINT_TIERS: ReputationTier[] = [
  { threshold: 100, badge: "Активен", description: "100+ точки репутация" },
  { threshold: 400, badge: "Ангажиран", description: "400+ точки след като станеш Участник" },
  { threshold: 2_000, badge: "Експерт", description: "2 000+ точки репутация" },
  { threshold: 4_000, badge: "Легенда", description: "4 000+ точки репутация" },
  { threshold: 10_000, badge: "VIP Потребител", description: "10 000+ точки репутация" },
];

/** @deprecated Use {@link REPUTATION_POINT_TIERS} — kept for display helpers. */
export const REPUTATION_TIERS: ReputationTier[] = [
  { threshold: 0, badge: OBSERVER_BADGE, description: "Наблюдаваш общността — още не си Участник" },
  { threshold: 0, badge: PARTICIPANT_BADGE, description: "По едно действие от всяка категория" },
  ...REPUTATION_POINT_TIERS,
];

export const SIGNAL_ACHIEVEMENTS: ThresholdAchievement[] = [
  {
    id: "signal-citizen",
    category: "signals",
    label: "Гражданин",
    description: "Подай 3 граждански сигнала",
    icon: "bi-megaphone",
    threshold: 3,
    current: (s) => s.signalsCount,
  },
  {
    id: "signal-active",
    category: "signals",
    label: "Активен сигнализатор",
    description: "Подай 12 граждански сигнала",
    icon: "bi-broadcast",
    threshold: 12,
    current: (s) => s.signalsCount,
  },
  {
    id: "signal-voice",
    category: "signals",
    label: "Глас на общността",
    description: "Подай 40 граждански сигнала",
    icon: "bi-award",
    threshold: 40,
    current: (s) => s.signalsCount,
  },
  {
    id: "signal-champion",
    category: "signals",
    label: "Защитник на града",
    description: "Подай 100 граждански сигнала",
    icon: "bi-shield-fill-check",
    threshold: 100,
    current: (s) => s.signalsCount,
  },
];

export const EVENT_ACHIEVEMENTS: ThresholdAchievement[] = [
  {
    id: "event-first",
    category: "events",
    label: "Инициатор",
    description: "Създай 2 събития или анкети",
    icon: "bi-calendar-plus",
    threshold: 2,
    current: (s) => s.eventsCount,
  },
  {
    id: "event-organizer",
    category: "events",
    label: "Организатор",
    description: "Създай 8 събития или анкети",
    icon: "bi-calendar-event",
    threshold: 8,
    current: (s) => s.eventsCount,
  },
  {
    id: "event-leader",
    category: "events",
    label: "Лидер на мнения",
    description: "Създай 25 събития или анкети",
    icon: "bi-bar-chart-steps",
    threshold: 25,
    current: (s) => s.eventsCount,
  },
  {
    id: "event-architect",
    category: "events",
    label: "Архитект на дебати",
    description: "Създай 60 събития или анкети",
    icon: "bi-diagram-3",
    threshold: 60,
    current: (s) => s.eventsCount,
  },
];

export const PUBLICATION_ACHIEVEMENTS: ThresholdAchievement[] = [
  {
    id: "pub-first",
    category: "publications",
    label: "Автор",
    description: "Публикувай 2 статии",
    icon: "bi-pencil-square",
    threshold: 2,
    current: (s) => s.publicationsCount,
  },
  {
    id: "pub-contributor",
    category: "publications",
    label: "Съавтор на новини",
    description: "Публикувай 10 статии",
    icon: "bi-journal-text",
    threshold: 10,
    current: (s) => s.publicationsCount,
  },
  {
    id: "pub-voice",
    category: "publications",
    label: "Глас на Смолян",
    description: "Публикувай 35 статии",
    icon: "bi-newspaper",
    threshold: 35,
    current: (s) => s.publicationsCount,
  },
  {
    id: "pub-chronicle",
    category: "publications",
    label: "Хроникьор",
    description: "Публикувай 80 статии",
    icon: "bi-journal-bookmark-fill",
    threshold: 80,
    current: (s) => s.publicationsCount,
  },
];

export const SOCIAL_ACHIEVEMENTS: ThresholdAchievement[] = [
  {
    id: "social-followers-15",
    category: "social",
    label: "Познат в квартала",
    description: "15 последователи",
    icon: "bi-people",
    threshold: 15,
    current: (s) => s.followersCount,
  },
  {
    id: "social-followers-75",
    category: "social",
    label: "Локален лидер",
    description: "75 последователи",
    icon: "bi-person-hearts",
    threshold: 75,
    current: (s) => s.followersCount,
  },
  {
    id: "social-followers-300",
    category: "social",
    label: "Обществен фигурант",
    description: "300 последователи",
    icon: "bi-star",
    threshold: 300,
    current: (s) => s.followersCount,
  },
  {
    id: "social-followers-1000",
    category: "social",
    label: "Глас на града",
    description: "1 000 последователи",
    icon: "bi-trophy",
    threshold: 1_000,
    current: (s) => s.followersCount,
  },
  {
    id: "social-following-25",
    category: "social",
    label: "Любопитен гражданин",
    description: "Следвай 25 души",
    icon: "bi-person-check",
    threshold: 25,
    current: (s) => s.followingCount,
  },
  {
    id: "social-following-100",
    category: "social",
    label: "Събирач на перспективи",
    description: "Следвай 100 души",
    icon: "bi-binoculars",
    threshold: 100,
    current: (s) => s.followingCount,
  },
];

/** Sort key for achievements within a category (progression order). */
export function achievementSortKey(item: Pick<ThresholdAchievement, "id" | "category" | "threshold">): number {
  if (item.id === "reputation-participant") return 0;
  if (item.category === "social") {
    if (item.id.startsWith("social-followers")) return item.threshold;
    if (item.id.startsWith("social-following")) return 10_000 + item.threshold;
  }
  return item.threshold;
}

export function sortAchievementsForDisplay<T extends Pick<ThresholdAchievement, "id" | "category" | "threshold">>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => achievementSortKey(a) - achievementSortKey(b));
}

export const COMMUNITY_ACHIEVEMENTS: ThresholdAchievement[] = [
  {
    id: "community-quarter",
    category: "community",
    label: "Тримесечие в общността",
    description: "Регистриран поне 90 дни",
    icon: "bi-calendar-check",
    threshold: 90,
    current: (s) => daysSince(s.memberSince),
  },
  {
    id: "community-year",
    category: "community",
    label: "Година в общността",
    description: "Регистриран поне 365 дни",
    icon: "bi-calendar-heart",
    threshold: 365,
    current: (s) => daysSince(s.memberSince),
  },
  {
    id: "community-veteran",
    category: "community",
    label: "Ветеран на платформата",
    description: "Регистриран поне 730 дни (2 години)",
    icon: "bi-hourglass-split",
    threshold: 730,
    current: (s) => daysSince(s.memberSince),
  },
];

function reputationTierIcon(threshold: number): string {
  if (threshold >= 10_000) return "bi-gem";
  if (threshold >= 4_000) return "bi-stars";
  if (threshold >= 2_000) return "bi-trophy-fill";
  if (threshold >= 400) return "bi-shield-check";
  if (threshold >= 100) return "bi-lightning-charge-fill";
  return "bi-patch-check";
}

export const PARTICIPANT_ACHIEVEMENT: ThresholdAchievement = {
  id: "reputation-participant",
  category: "reputation",
  label: PARTICIPANT_BADGE,
  description: "По едно действие от всяка категория: събитие, глас, публикация, сигнал",
  icon: "bi-patch-check",
  threshold: PARTICIPANT_STEPS.length,
  current: (s) => countParticipantSteps(s),
};

export const REPUTATION_ACHIEVEMENTS: ThresholdAchievement[] = [
  PARTICIPANT_ACHIEVEMENT,
  ...REPUTATION_POINT_TIERS.map((tier) => ({
    id: `reputation-${tier.threshold}`,
    category: "reputation" as const,
    label: tier.badge,
    description: tier.description,
    icon: reputationTierIcon(tier.threshold),
    threshold: tier.threshold,
    current: (s: AchievementStats) => s.reputationScore,
  })),
];

export const ALL_ACHIEVEMENTS: ThresholdAchievement[] = [
  ...REPUTATION_ACHIEVEMENTS,
  ...SIGNAL_ACHIEVEMENTS,
  ...EVENT_ACHIEVEMENTS,
  ...PUBLICATION_ACHIEVEMENTS,
  ...SOCIAL_ACHIEVEMENTS,
  ...COMMUNITY_ACHIEVEMENTS,
];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  reputation: "Репутация",
  signals: "Сигнали",
  events: "Събития",
  publications: "Публикации",
  social: "Общност",
  community: "Принадлежност",
};

function daysSince(iso: string): number {
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
}

export function countParticipantSteps(stats: AchievementStats): number {
  return PARTICIPANT_STEPS.filter((step) => step.met(stats)).length;
}

export function hasParticipantQualification(stats: AchievementStats): boolean {
  return countParticipantSteps(stats) === PARTICIPANT_STEPS.length;
}

export function resolveReputationBadge(stats: AchievementStats): string {
  if (!hasParticipantQualification(stats)) return OBSERVER_BADGE;
  const score = stats.reputationScore;
  if (score >= 10_000) return "VIP Потребител";
  if (score >= 4_000) return "Легенда";
  if (score >= 2_000) return "Експерт";
  if (score >= 400) return "Ангажиран";
  if (score >= 100) return "Активен";
  return PARTICIPANT_BADGE;
}

export function getCurrentPointTier(score: number): ReputationTier {
  return (
    [...REPUTATION_POINT_TIERS].reverse().find((t) => score >= t.threshold) ?? {
      threshold: 0,
      badge: PARTICIPANT_BADGE,
      description: "Пълно участие във всички категории",
    }
  );
}

export function getNextPointTier(score: number): ReputationTier | null {
  return REPUTATION_POINT_TIERS.find((t) => score < t.threshold) ?? null;
}

export type ReputationProgress =
  | { kind: "participant"; progress: number; next: ReputationTier; remaining: number; completedSteps: number }
  | { kind: "points"; progress: number; next: ReputationTier | null; remaining: number };

export function getReputationProgress(stats: AchievementStats): ReputationProgress {
  if (!hasParticipantQualification(stats)) {
    const completedSteps = countParticipantSteps(stats);
    return {
      kind: "participant",
      progress: (completedSteps / PARTICIPANT_STEPS.length) * 100,
      next: { threshold: PARTICIPANT_STEPS.length, badge: PARTICIPANT_BADGE, description: PARTICIPANT_ACHIEVEMENT.description },
      remaining: PARTICIPANT_STEPS.length - completedSteps,
      completedSteps,
    };
  }

  const score = stats.reputationScore;
  const next = getNextPointTier(score);
  if (!next) return { kind: "points", progress: 100, next: null, remaining: 0 };

  const current = getCurrentPointTier(score);
  const span = next.threshold - current.threshold;
  const progress = span > 0 ? Math.min(100, ((score - current.threshold) / span) * 100) : 100;
  return { kind: "points", progress, next, remaining: next.threshold - score };
}

/** @deprecated Prefer {@link getReputationProgress} with full stats. */
export function getCurrentReputationTier(score: number): ReputationTier {
  return getCurrentPointTier(score);
}

/** @deprecated Prefer {@link getReputationProgress} with full stats. */
export function getNextReputationTier(score: number): ReputationTier | null {
  return getNextPointTier(score);
}

export function getEarnedSignalAchievement(stats: AchievementStats) {
  return [...SIGNAL_ACHIEVEMENTS].reverse().find((a) => stats.signalsCount >= a.threshold) ?? null;
}

export function getNextSignalAchievement(stats: AchievementStats) {
  return SIGNAL_ACHIEVEMENTS.find((a) => stats.signalsCount < a.threshold) ?? null;
}

export function evaluateAchievement(def: ThresholdAchievement, stats: AchievementStats): EvaluatedAchievement {
  const currentValue = def.current(stats);
  let earned = currentValue >= def.threshold;
  if (def.category === "reputation" && def.id !== "reputation-participant" && def.threshold >= 100) {
    earned = earned && hasParticipantQualification(stats);
  }
  const progress = earned ? 100 : Math.min(100, (currentValue / def.threshold) * 100);
  return {
    ...def,
    earned,
    progress,
    currentValue,
    remaining: earned ? 0 : def.threshold - currentValue,
  };
}

export function evaluateAllAchievements(stats: AchievementStats): EvaluatedAchievement[] {
  return ALL_ACHIEVEMENTS.map((def) => evaluateAchievement(def, stats));
}

export function countEarnedAchievements(stats: AchievementStats): { earned: number; total: number } {
  const all = evaluateAllAchievements(stats);
  return { earned: all.filter((a) => a.earned).length, total: all.length };
}

export function toAchievementStats(profile: {
  reputationScore: number;
  reputationBadge: string;
  signalsCount: number;
  eventsCount: number;
  publicationsCount: number;
  votesCount?: number;
  followersCount: number;
  followingCount: number;
  created: string;
}): AchievementStats {
  return {
    reputationScore: profile.reputationScore,
    reputationBadge: profile.reputationBadge,
    signalsCount: profile.signalsCount,
    eventsCount: profile.eventsCount,
    publicationsCount: profile.publicationsCount,
    votesCount: profile.votesCount ?? 0,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    memberSince: profile.created,
  };
}
