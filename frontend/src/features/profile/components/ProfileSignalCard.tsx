import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import type { ProfileSignalItem } from "../types";

export function ProfileSignalCard({ signal }: { signal: ProfileSignalItem }) {
  return (
    <Link href={`/signals?openSignal=${signal.id}`} className="group block h-full">
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-[20px] border bg-white transition-all duration-300",
          "border-black/[0.06] shadow-[0_8px_28px_-18px_rgba(15,23,42,0.18)]",
          "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-20px_rgba(25,134,28,0.35)]",
          !signal.isActive && "opacity-[0.92] saturate-[0.85]",
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {signal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signal.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#14532d] via-[#19861c] to-[#48a24c]">
              <i className="bi bi-megaphone text-4xl text-white/35" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[0.68rem] font-semibold text-white backdrop-blur-md">
            <i className="bi bi-tag" />
            {signal.isActive ? signal.categoryLabel : "Изтекъл"}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-3.5">
          <p className="line-clamp-2 font-display text-[0.92rem] font-bold leading-snug tracking-[-0.02em] text-[color:var(--color-text-heading)] group-hover:text-primary">
            {signal.title}
          </p>

          <div className="mt-auto flex items-center gap-2 border-t border-black/[0.06] pt-3">
            <div className="flex flex-1 gap-1.5 text-[0.72rem] text-[color:var(--color-text-muted)]">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 font-semibold text-primary">
                <i className="bi bi-arrow-up-circle" />
                {signal.priorityBoostCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="bi bi-chat-left-text" />
                {signal.commentsCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="bi bi-eye" />
                {signal.viewsCount}
              </span>
            </div>
            <span className="text-[0.68rem] text-[color:var(--color-text-muted)]">
              {formatRelativeDate(signal.createdAt)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
