import Link from "next/link";
import { Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import type { ProfileSignalItem } from "../types";

export function ProfileSignalCard({ signal }: { signal: ProfileSignalItem }) {
  return (
    <Link href={`/signals?openSignal=${signal.id}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--color-surface-muted)]">
          {signal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs
            <img src={signal.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <i className="bi bi-geo-alt text-2xl text-[color:var(--color-text-muted)]" />
            </div>
          )}
          <span
            className={cn(
              "absolute left-2 top-2 rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium",
              signal.isActive ? "bg-white/90 text-primary" : "bg-black/60 text-white",
            )}
          >
            {signal.isActive ? signal.categoryLabel : "Изтекъл"}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-[color:var(--color-text-heading)]">{signal.title}</p>
          <div className="mt-auto flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <i className="bi bi-arrow-up-circle" />
              {signal.priorityBoostCount}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-chat" />
              {signal.commentsCount}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-eye" />
              {signal.viewsCount}
            </span>
            <span>{formatRelativeDate(signal.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
