"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { Avatar, HoverCard, Skeleton } from "@/shared/ui";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { useProfile } from "../hooks/useProfile";

interface UserHoverCardProps {
  username: string;
  children: ReactNode;
  /** Composed at app/ — Follow control. */
  followSlot?: ReactNode;
  /** Composed at app/ — Message control. */
  messageSlot?: ReactNode;
}

/** Facebook-style profile preview on hover (≥1s). Desktop / fine pointer only. */
export function UserHoverCard({ username, children, followSlot, messageSlot }: UserHoverCardProps) {
  const [active, setActive] = useState(false);
  const { data: profile, isPending, isError } = useProfile(active ? username : "");

  const href = `/user/${encodeURIComponent(username)}`;

  const content = (
    <div className="flex flex-col gap-3 p-3.5">
      {!active || (isPending && !profile) ? (
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ) : isError || !profile ? (
        <p className="text-sm text-[color:var(--color-text-muted)]">Профилът не можа да се зареди.</p>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <Link href={href} className="relative shrink-0">
              <Avatar username={profile.username} imageUrl={profile.imageUrl} size={56} />
              {profile.online ? (
                <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[color:var(--color-success)]" />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={href}
                className="block truncate font-display text-base font-semibold text-[color:var(--color-text-heading)] hover:text-primary hover:underline"
              >
                {profile.realName || profile.username}
              </Link>
              <p className="truncate text-sm text-[color:var(--color-text-muted)]">@{profile.username}</p>
              {profile.reputationBadge ? (
                <span className="mt-1 inline-flex rounded-[var(--radius-pill)] bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {profile.reputationBadge}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-[color:var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-people" aria-hidden />
              {profile.followersCount} последователи · {profile.followingCount} следвани
            </span>
            {profile.locationLabel && profile.locationLabel !== "-" ? (
              <span className="inline-flex items-center gap-1.5">
                <i className="bi bi-geo-alt" aria-hidden />
                {profile.locationLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-calendar-event" aria-hidden />
              Присъединил се {formatRelativeDate(profile.created)}
            </span>
          </div>

          {!profile.isOwnProfile ? (
            <div className="flex items-center gap-2 border-t border-border-default/50 pt-3">
              {followSlot ? <div className="min-w-0 flex-1">{followSlot}</div> : null}
              {messageSlot ? <div className="min-w-0 flex-1">{messageSlot}</div> : null}
              <Link
                href={href}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-default/60 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-primary"
                aria-label="Отвори профила"
              >
                <i className="bi bi-three-dots" aria-hidden />
              </Link>
            </div>
          ) : (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-primary"
            >
              Моят профил
            </Link>
          )}
        </>
      )}
    </div>
  );

  return (
    <HoverCard
      content={content}
      openDelay={0}
      onOpenChange={setActive}
      className="min-w-0 flex-1"
    >
      {children}
    </HoverCard>
  );
}
