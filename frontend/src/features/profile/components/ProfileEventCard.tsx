import Link from "next/link";
import { Card } from "@/shared/ui";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import type { ProfileEventItem } from "../types";

const DETAIL_PATH: Record<ProfileEventItem["eventType"], string> = {
  SIMPLEEVENT: "event",
  REFERENDUM: "referendum",
  MULTI_POLL: "multipoll",
};

const TYPE_LABEL: Record<ProfileEventItem["eventType"], string> = {
  SIMPLEEVENT: "Събитие",
  REFERENDUM: "Референдум",
  MULTI_POLL: "Анкета",
};

/** Lean read-only summary card — legacy profile tabs link out to the full detail page, no inline voting here. */
export function ProfileEventCard({ event }: { event: ProfileEventItem }) {
  const image = event.images?.[0];

  return (
    <Link href={`/${DETAIL_PATH[event.eventType]}/${event.id}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--color-surface-muted)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <i className="bi bi-calendar-event text-2xl text-[color:var(--color-text-muted)]" />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-[var(--radius-pill)] bg-white/90 px-2 py-0.5 text-xs font-medium text-primary">
            {TYPE_LABEL[event.eventType]}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-[color:var(--color-text-heading)]">{event.title}</p>
          <div className="mt-auto flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <i className="bi bi-bar-chart" />
              {event.totalVotes}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-eye" />
              {event.viewCounter}
            </span>
            <span>{formatRelativeDate(event.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
