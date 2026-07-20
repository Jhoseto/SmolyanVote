import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

/** Relative time ("преди 3 часа") — matches v1's `formatTimeAgo` intent, single implementation. */
export function formatRelativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: bg });
  } catch {
    return "";
  }
}
