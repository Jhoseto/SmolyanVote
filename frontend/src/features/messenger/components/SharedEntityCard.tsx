"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { KIND_ICON, KIND_LABEL, useSharedEntity } from "../hooks/useSharedEntity";
import type { SharedEntityRef } from "../lib/resolveSharedEntity";

/**
 * Native preview for links that point back into SmolyanVote — turns a bare URL
 * into a card with the entity's cover, author and live counters.
 */
export function SharedEntityCard({ entity, isOwn }: { entity: SharedEntityRef; isOwn: boolean }) {
  const { data, isPending, isError } = useSharedEntity(entity);

  if (isError) return null;

  if (isPending || !data) {
    return (
      <div
        className={cn(
          "w-[260px] animate-pulse rounded-[var(--radius-md)] p-2.5",
          isOwn ? "bg-white/15" : "bg-[color:var(--color-surface-light)]",
        )}
      >
        <div className="h-3 w-20 rounded bg-current/15" />
        <div className="mt-2 h-3.5 w-full rounded bg-current/15" />
        <div className="mt-1.5 h-3.5 w-2/3 rounded bg-current/15" />
      </div>
    );
  }

  const isSignalWithPin = data.kind === "signal" && data.coordinates;

  return (
    <Link
      href={entity.href}
      className={cn(
        "block w-[260px] overflow-hidden rounded-[var(--radius-md)] transition-shadow hover:shadow-[var(--shadow-md)]",
        isOwn ? "bg-white/15 ring-1 ring-white/25" : "bg-white ring-1 ring-border-default/60",
      )}
    >
      {data.imageUrl && (
        <span className="relative block h-[110px] w-full">
          <Image src={data.imageUrl} alt="" fill unoptimized className="object-cover" />
        </span>
      )}

      <span className="block p-2.5">
        <span
          className={cn(
            "sv-msg-label flex items-center gap-1 text-[10px]",
            isOwn ? "text-white/80" : "text-[color:var(--color-primary)]",
          )}
        >
          <i className={cn("bi", KIND_ICON[data.kind])} />
          {KIND_LABEL[data.kind]}
        </span>

        <span className="mt-1 block text-[13px] font-semibold leading-snug line-clamp-2">
          {data.title}
        </span>

        {data.authorUsername && (
          <span className="mt-1.5 flex items-center gap-1.5">
            <Avatar username={data.authorUsername} imageUrl={data.authorImageUrl} size={18} />
            <span className={cn("truncate text-[11px]", isOwn ? "text-white/80" : "text-[color:var(--color-text-muted)]")}>
              {data.authorUsername}
            </span>
          </span>
        )}

        {data.stats.length > 0 && (
          <span
            className={cn(
              "sv-msg-num mt-1.5 flex items-center gap-3 text-[11px]",
              isOwn ? "text-white/75" : "text-[color:var(--color-text-muted)]",
            )}
          >
            {data.stats.map((stat) => (
              <span key={stat.icon} className="flex items-center gap-1">
                <i className={cn("bi", stat.icon)} />
                {stat.value}
              </span>
            ))}
          </span>
        )}

        <span
          className={cn(
            "mt-2 flex items-center gap-1 text-[11px] font-semibold",
            isOwn ? "text-white" : "text-[color:var(--color-primary)]",
          )}
        >
          <i className={cn("bi", isSignalWithPin ? "bi-geo-alt" : "bi-box-arrow-up-right")} />
          {isSignalWithPin
            ? "Отвори на картата"
            : data.kind === "publication"
              ? "Прочети"
              : "Гласувай"}
        </span>
      </span>
    </Link>
  );
}
