"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Avatar, EmptyState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useReactionUsers } from "../hooks/useReactionUsers";
import { SocialModalShell } from "./SocialModalShell";
import { OnlineStatusDot } from "./OnlineStatusDot";

interface ReactionUsersModalProps {
  publicationId: number | null;
  type: "like" | "dislike" | null;
  likesCount?: number;
  dislikesCount?: number;
  onClose: () => void;
  renderFollowSlot?: (userId: number) => ReactNode;
  renderMessageSlot?: (userId: number) => ReactNode;
}

/** "Кой реагира" — tabs + glass shell; open from feed or detail. */
export function ReactionUsersModal({
  publicationId,
  type,
  likesCount,
  dislikesCount,
  onClose,
  renderFollowSlot,
  renderMessageSlot,
}: ReactionUsersModalProps) {
  const open = publicationId !== null && type !== null;
  const [tab, setTab] = useState<"like" | "dislike">(type ?? "like");

  const [prevType, setPrevType] = useState(type);
  if (type !== prevType) {
    setPrevType(type);
    if (type) setTab(type);
  }

  const active = open ? tab : "like";
  const { data, isPending } = useReactionUsers(publicationId, active);

  return (
    <SocialModalShell
      open={open}
      onClose={onClose}
      title="Реакции"
      size="md"
      elevated
      bodyClassName="p-0"
    >
      <div className="flex border-b border-border-default/50">
        <button
          type="button"
          onClick={() => setTab("like")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-colors",
            tab === "like"
              ? "border-b-2 border-primary text-primary"
              : "text-[color:var(--color-text-muted)] hover:text-primary",
          )}
        >
          <i className="bi bi-hand-thumbs-up-fill" />
          Харесвания
          {likesCount != null ? <span className="text-xs font-normal opacity-70">({likesCount})</span> : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("dislike")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-colors",
            tab === "dislike"
              ? "border-b-2 border-[color:var(--color-error)] text-[color:var(--color-error)]"
              : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]",
          )}
        >
          <i className="bi bi-hand-thumbs-down-fill" />
          Не харесвания
          {dislikesCount != null ? (
            <span className="text-xs font-normal opacity-70">({dislikesCount})</span>
          ) : null}
        </button>
      </div>

      <div className="flex max-h-[420px] flex-col gap-0.5 overflow-y-auto p-3">
        {isPending &&
          Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[var(--radius-md)]" />
          ))}

        {data && data.length === 0 && (
          <EmptyState icon="bi-emoji-neutral" title="Все още никой" description="Бъдете първи с реакция." />
        )}

        {data?.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-primary-50/60"
          >
            <div className="relative shrink-0">
              <Avatar username={user.username} imageUrl={user.imageUrl} size={40} />
              <OnlineStatusDot status={user.isOnline ? 1 : 0} />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/user/${encodeURIComponent(user.username)}`}
                onClick={onClose}
                className="truncate text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-primary hover:underline"
              >
                {user.fullName || user.username}
              </Link>
              <p className="truncate text-xs text-[color:var(--color-text-muted)]">@{user.username}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {renderMessageSlot?.(user.id)}
              {renderFollowSlot?.(user.id)}
            </div>
          </div>
        ))}
      </div>
    </SocialModalShell>
  );
}
