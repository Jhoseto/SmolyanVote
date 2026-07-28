import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";

/** Single source of truth for the "онлайн / пише… / преди 5 мин" status line. */
export function presenceLabel(options: {
  online: boolean;
  typing: boolean;
  lastSeen?: string | null;
}): string {
  if (options.typing) return "пише…";
  if (options.online) return "онлайн";
  if (options.lastSeen) {
    const relative = formatRelativeDate(options.lastSeen);
    return relative ? `активен ${relative}` : "офлайн";
  }
  return "офлайн";
}

/** Compact clock used inside bubbles and conversation rows. */
export function formatClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Днес";
  if (sameDay(date, yesterday)) return "Вчера";

  return date.toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}
