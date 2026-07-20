import Link from "next/link";
import { Card, Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { EventListItem } from "../types";
import { locationLabel } from "../data/locations";
import { eventDetailUrl, EVENT_TYPE_LABEL, EVENT_TYPE_ICON } from "../lib/eventLinks";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";

const TYPE_BADGE_CLASSES: Record<EventListItem["eventType"], string> = {
  SIMPLEEVENT:
    "border-white/25 bg-primary/55 !text-white shadow-[0_4px_14px_rgba(25,134,28,0.3)]",
  REFERENDUM:
    "border-white/25 bg-[color:var(--color-warning)]/55 !text-white shadow-[0_4px_14px_rgba(245,158,11,0.3)]",
  MULTI_POLL:
    "border-white/25 bg-sky-400/55 !text-white shadow-[0_4px_14px_rgba(56,189,248,0.3)]",
};

export function EventCard({ event }: { event: EventListItem }) {
  const image = event.images?.[0];
  const location = locationLabel(event.location);

  return (
    <Link
      href={eventDetailUrl(event.eventType, event.id)}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-[var(--radius-lg)]"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lg)]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--color-surface-muted)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs
            <img
              src={image}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <i className={cn("bi text-[2.5rem] text-[color:var(--color-text-muted)]/50", EVENT_TYPE_ICON[event.eventType])} />
            </div>
          )}
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold backdrop-blur-md",
              TYPE_BADGE_CLASSES[event.eventType],
            )}
          >
            <i className={cn("bi", EVENT_TYPE_ICON[event.eventType])} />
            {EVENT_TYPE_LABEL[event.eventType]}
          </span>
          {event.eventStatus === "INACTIVE" && (
            <span className="absolute right-3 top-3 rounded-[var(--radius-pill)] bg-black/60 px-3 py-1 text-xs font-semibold text-white">
              Приключило
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="line-clamp-2 text-[1.05rem] font-semibold leading-snug text-[color:var(--color-text-heading)]">
            {event.title}
          </h3>
          <p className="line-clamp-2 flex-1 text-sm text-[color:var(--color-text-secondary)]">
            {event.description}
          </p>

          <div className="flex items-center gap-3 border-t border-border-default/60 pt-3">
            <Avatar username={event.creatorName} imageUrl={event.creatorImage} size={28} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[color:var(--color-text-primary)]">
                {event.creatorName}
              </p>
              <p className="truncate text-[0.7rem] text-[color:var(--color-text-muted)]">
                      {formatRelativeDate(event.createdAt)}
                {location && ` · ${location}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-[0.7rem] text-[color:var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <i className="bi bi-bar-chart-fill" />
                {event.totalVotes}
              </span>
              <span className="flex items-center gap-1">
                <i className="bi bi-eye-fill" />
                {event.viewCounter}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
