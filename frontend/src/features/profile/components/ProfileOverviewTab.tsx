import type { PublicProfile } from "../types";

const TIERS = [
  { threshold: 0, badge: "Нов потребител" },
  { threshold: 50, badge: "Участник" },
  { threshold: 200, badge: "Активен" },
  { threshold: 500, badge: "Експерт" },
  { threshold: 1000, badge: "VIP Потребител" },
];

function nextTier(score: number) {
  return TIERS.find((t) => t.threshold > score) ?? null;
}

/** Reputation breakdown — the one piece of "overview" content not already covered by the header/other tabs. */
export function ProfileOverviewTab({ profile }: { profile: PublicProfile }) {
  const next = nextTier(profile.reputationScore);
  const prevThreshold = TIERS.filter((t) => t.threshold <= profile.reputationScore).at(-1)?.threshold ?? 0;
  const progress = next
    ? Math.min(100, ((profile.reputationScore - prevThreshold) / (next.threshold - prevThreshold)) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[color:var(--color-text-muted)]">Репутация</p>
          <p className="text-2xl font-bold text-[color:var(--color-text-heading)]">{profile.reputationScore}</p>
        </div>
        <span className="rounded-[var(--radius-pill)] bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary">
          {profile.reputationBadge}
        </span>
      </div>

      {next && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)]">
            <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-[color:var(--color-text-muted)]">
            Още {next.threshold - profile.reputationScore} точки до „{next.badge}“
          </p>
        </div>
      )}

      <p className="text-xs text-[color:var(--color-text-muted)]">
        Точките се получават за създадени събития, публикации и подадени гласове.
      </p>
    </div>
  );
}
