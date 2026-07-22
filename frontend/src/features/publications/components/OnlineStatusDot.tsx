import { cn } from "@/shared/lib/cn";

/**
 * Maps backend `authorOnlineStatus` (legacy int) to a presence dot.
 * Common convention: 1 = online, 2 = away, else offline/unknown.
 */
export function OnlineStatusDot({
  status,
  className,
}: {
  status: number | null | undefined;
  className?: string;
}) {
  const tone =
    status === 1 ? "bg-[color:var(--color-success)]" : status === 2 ? "bg-[color:var(--color-warning)]" : "bg-[color:var(--color-text-muted)]/45";

  const label = status === 1 ? "На линия" : status === 2 ? "Отсъства" : "Офлайн";

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
        tone,
        className,
      )}
    />
  );
}
