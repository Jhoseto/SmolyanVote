import type { Signal } from "../types";

export interface SignalLane {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  signals: Signal[];
}

const LANE_SIZE = 14;

function ageDays(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

/** Recency-weighted engagement score — recent activity outranks old, all-time-popular signals. */
function hotScore(signal: Signal): number {
  const engagement = signal.viewsCount * 1 + signal.commentsCount * 4 + signal.priorityBoostCount * 3;
  const recencyWeight = Math.max(0.3, 1 - ageDays(signal.createdAt) / 30);
  return engagement * recencyWeight;
}

function takeTop(signals: Signal[], compare: (a: Signal, b: Signal) => number, limit = LANE_SIZE): Signal[] {
  return [...signals].sort(compare).slice(0, limit);
}

/**
 * Builds curated horizontal "lanes" from an already-filtered signal set, similar to
 * streaming-service rows (newest / trending / most discussed / most viewed / urgent).
 * Lanes with fewer than 3 signals are dropped by the caller for a cleaner UI.
 */
export function buildSignalLanes(signals: Signal[]): SignalLane[] {
  const active = signals.filter((s) => s.isActive);

  const urgent = takeTop(
    active.filter((s) => s.priorityTier === "high"),
    (a, b) => hotScore(b) - hotScore(a),
  );

  const hottest = takeTop(active, (a, b) => hotScore(b) - hotScore(a));

  const newest = takeTop(signals, (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const mostCommented = takeTop(
    signals.filter((s) => s.commentsCount > 0),
    (a, b) => b.commentsCount - a.commentsCount,
  );

  const mostViewed = takeTop(
    signals.filter((s) => s.viewsCount > 0),
    (a, b) => b.viewsCount - a.viewsCount,
  );

  return [
    {
      id: "urgent",
      title: "Спешни сигнали",
      subtitle: "Активни с най-висок приоритет точно сега",
      icon: "bi-exclamation-triangle-fill",
      accent: "#dc2626",
      signals: urgent,
    },
    {
      id: "hottest",
      title: "Най-горещи",
      subtitle: "Най-активно обсъждани и подкрепяни в момента",
      icon: "bi-fire",
      accent: "#d97706",
      signals: hottest,
    },
    {
      id: "newest",
      title: "Най-нови",
      subtitle: "Току-що подадени от общността",
      icon: "bi-stars",
      accent: "#19861c",
      signals: newest,
    },
    {
      id: "commented",
      title: "Най-коментирани",
      subtitle: "Сигнали, предизвикали най-много разговори",
      icon: "bi-chat-dots-fill",
      accent: "#0369a1",
      signals: mostCommented,
    },
    {
      id: "viewed",
      title: "Най-гледани",
      subtitle: "Привлекли най-много внимание",
      icon: "bi-eye-fill",
      accent: "#7c3aed",
      signals: mostViewed,
    },
  ];
}
