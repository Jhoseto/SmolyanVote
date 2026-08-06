import { formatDistance, formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const bulgarianDateTimeFormatter = new Intl.DateTimeFormat("bg-BG", {
  timeZone: "Europe/Sofia",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Relative time ("преди 3 часа") — matches v1's `formatTimeAgo` intent, single implementation. */
export function formatRelativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: bg });
  } catch {
    return "";
  }
}

/** Under 24h → relative; older → calendar date + clock time in Europe/Sofia. */
export function formatActivityTimestamp(iso: string, nowMs: number = Date.now()): string {
  try {
    const date = new Date(iso);
    const ageMs = nowMs - date.getTime();
    if (ageMs >= 0 && ageMs < TWENTY_FOUR_HOURS_MS) {
      return formatDistance(date, new Date(nowMs), { addSuffix: true, locale: bg });
    }
    return bulgarianDateTimeFormatter.format(date);
  } catch {
    return "";
  }
}

/** Full Sofia datetime for tooltips / export. */
export function formatBulgarianDateTime(iso: string): string {
  try {
    return bulgarianDateTimeFormatter.format(new Date(iso));
  } catch {
    return "";
  }
}
