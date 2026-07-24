import { format, formatDistanceToNow, isPast } from "date-fns";
import { bg } from "date-fns/locale";

export interface BanExpiryDisplay {
  primary: string;
  secondary: string;
  expired: boolean;
}

/** Relative + absolute expiry for temporary bans in admin UI. */
export function formatBanExpiry(iso: string | null | undefined): BanExpiryDisplay | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    const absolute = format(date, "d MMM yyyy, HH:mm", { locale: bg });
    const expired = isPast(date);
    return {
      primary: expired ? "Изтекъл" : formatDistanceToNow(date, { addSuffix: true, locale: bg }),
      secondary: absolute,
      expired,
    };
  } catch {
    return null;
  }
}
