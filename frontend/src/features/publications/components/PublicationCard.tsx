"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Avatar, Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon, categoryLabel } from "../data/categories";
import { parseLinkMetadata } from "../lib/linkMetadata";
import { useTogglePublicationLike } from "../hooks/useTogglePublicationLike";
import { useTogglePublicationDislike } from "../hooks/useTogglePublicationDislike";
import { useTogglePublicationBookmark } from "../hooks/useTogglePublicationBookmark";
import { useSharePublication } from "../hooks/useSharePublication";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { PublicationModerationMenu } from "./PublicationModerationMenu";
import { PublicationShareSheet } from "./PublicationShareSheet";
import { PublicationText } from "./PublicationText";
import { ReactionUsersModal } from "./ReactionUsersModal";
import { OnlineStatusDot } from "./OnlineStatusDot";
import type { Publication } from "../types";

const CATEGORY_BADGE_CLASSES: Record<Publication["category"], string> = {
  NEWS: "bg-primary-50 text-primary",
  INFRASTRUCTURE: "bg-[color:var(--color-info)]/10 text-[color:var(--color-info)]",
  MUNICIPAL: "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]",
  INITIATIVES: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
  CULTURE: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  OTHER: "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]",
};

interface PublicationCardProps {
  publication: Publication;
  onOpenDetail?: (id: number, opts?: { focusComments?: boolean }) => void;
  onHashtagClick?: (tag: string) => void;
  followSlot?: ReactNode;
  reportSlot?: ReactNode;
  reactionUserFollowSlot?: (userId: number) => ReactNode;
  reactionUserMessageSlot?: (userId: number) => ReactNode;
}

export function PublicationCard({
  publication,
  onOpenDetail,
  onHashtagClick,
  followSlot,
  reportSlot,
  reactionUserFollowSlot,
  reactionUserMessageSlot,
}: PublicationCardProps) {
  const requireAuth = useRequireAuth();
  const linkMetadata = parseLinkMetadata(publication.linkMetadata);
  const [reactionType, setReactionType] = useState<"like" | "dislike" | null>(null);

  const { mutate: like, isPending: isLiking } = useTogglePublicationLike();
  const { mutate: dislike, isPending: isDisliking } = useTogglePublicationDislike();
  const { mutate: bookmark, isPending: isBookmarking } = useTogglePublicationBookmark();
  const { mutate: recordShare } = useSharePublication();

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/publications/${publication.id}`
      : "";

  async function handleLike() {
    if (!(await requireAuth("да харесаш публикация"))) return;
    like(publication.id);
  }

  async function handleDislike() {
    if (!(await requireAuth("да реагираш на публикация"))) return;
    dislike(publication.id);
  }

  async function handleBookmark() {
    if (!(await requireAuth("да следиш публикация"))) return;
    bookmark(publication.id);
  }

  const authorHref = publication.authorUsername
    ? `/user/${encodeURIComponent(publication.authorUsername)}`
    : null;

  return (
    <>
      <Card className="flex flex-col gap-0 overflow-hidden p-0 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="relative shrink-0">
            {authorHref ? (
              <Link href={authorHref}>
                <Avatar
                  username={publication.authorUsername ?? "?"}
                  imageUrl={publication.authorImageUrl}
                  size={44}
                />
              </Link>
            ) : (
              <Avatar
                username={publication.authorUsername ?? "?"}
                imageUrl={publication.authorImageUrl}
                size={44}
              />
            )}
            <OnlineStatusDot status={publication.authorOnlineStatus} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
              {authorHref ? (
                <Link href={authorHref} className="hover:text-primary hover:underline">
                  {publication.authorUsername}
                </Link>
              ) : (
                (publication.authorUsername ?? "Анонимен")
              )}
              {publication.emotion && (
                <span className="ml-1.5 font-normal text-[color:var(--color-text-muted)]">
                  се чувства {publication.emotion} <strong>{publication.emotionText}</strong>
                </span>
              )}
            </p>
            <p className="truncate text-xs text-[color:var(--color-text-muted)]">
              {formatRelativeDate(publication.createdAt)}
              {publication.readingTime ? ` · ${publication.readingTime} мин. четене` : ""}
            </p>
          </div>
          {followSlot}
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.7rem] font-semibold",
              CATEGORY_BADGE_CLASSES[publication.category],
            )}
          >
            <i className={cn("bi", categoryIcon(publication.category))} />
            <span className="hidden sm:inline">{categoryLabel(publication.category)}</span>
          </span>
          <PublicationModerationMenu
            publicationId={publication.id}
            authorId={publication.authorId}
            authorUsername={publication.authorUsername}
            isOwner={publication.isOwner}
            onEdit={() => onOpenDetail?.(publication.id)}
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenDetail?.(publication.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenDetail?.(publication.id);
            }
          }}
          className="mt-3 line-clamp-4 cursor-pointer whitespace-pre-line px-4 text-left text-sm leading-relaxed text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
        >
          <PublicationText
            text={publication.excerpt || publication.content}
            onHashtagClick={onHashtagClick}
          />
        </div>

        {publication.imageUrl && (
          <button
            type="button"
            onClick={() => onOpenDetail?.(publication.id)}
            className="mt-3 overflow-hidden bg-[color:var(--color-surface-muted)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
            <img
              src={publication.imageUrl}
              alt={publication.title}
              loading="lazy"
              className="max-h-[420px] w-full object-cover"
            />
          </button>
        )}

        {linkMetadata && (
          <div className="mt-3 px-4">
            <LinkPreviewCard metadata={linkMetadata} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-xs text-[color:var(--color-text-muted)]">
          <button
            type="button"
            disabled={publication.likesCount === 0}
            onClick={() => publication.likesCount > 0 && setReactionType("like")}
            className="hover:underline disabled:no-underline"
          >
            {publication.likesCount} харесвания
          </button>
          <button
            type="button"
            disabled={publication.dislikesCount === 0}
            onClick={() => publication.dislikesCount > 0 && setReactionType("dislike")}
            className="hover:underline disabled:no-underline"
          >
            {publication.dislikesCount} не харесвания
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail?.(publication.id, { focusComments: true })}
            className="hover:underline"
          >
            {publication.commentsCount} коментара
          </button>
          <span>{publication.sharesCount} споделяния</span>
          <span className="ml-auto flex items-center gap-1">
            <i className="bi bi-eye" />
            {publication.viewsCount}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-0.5 border-t border-border-default/50 px-1 py-1 sm:grid-cols-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2.5 text-sm font-medium transition-colors hover:bg-primary-50 disabled:opacity-50",
              publication.isLiked ? "text-primary" : "text-[color:var(--color-text-secondary)]",
            )}
          >
            <i className={cn("bi", publication.isLiked ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up")} />
            <span className="hidden sm:inline">Харесвам</span>
          </button>
          <button
            type="button"
            onClick={handleDislike}
            disabled={isDisliking}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2.5 text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50",
              publication.isDisliked
                ? "text-[color:var(--color-error)]"
                : "text-[color:var(--color-text-secondary)]",
            )}
          >
            <i
              className={cn("bi", publication.isDisliked ? "bi-hand-thumbs-down-fill" : "bi-hand-thumbs-down")}
            />
            <span className="hidden sm:inline">Не харесвам</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail?.(publication.id, { focusComments: true })}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2.5 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-chat" />
            <span className="hidden sm:inline">Коментирай</span>
          </button>
          <PublicationShareSheet
            title={publication.title}
            url={shareUrl}
            onShared={() => recordShare(publication.id)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2.5 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-share" />
            <span className="hidden sm:inline">Сподели</span>
          </PublicationShareSheet>
        </div>

        <div className="flex items-center justify-between border-t border-border-default/40 px-3 py-2">
          <button
            type="button"
            onClick={handleBookmark}
            disabled={isBookmarking}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs transition-colors hover:bg-primary-50 disabled:opacity-50",
              publication.isBookmarked ? "text-primary" : "text-[color:var(--color-text-muted)]",
            )}
          >
            <i className={cn("bi", publication.isBookmarked ? "bi-bookmark-fill" : "bi-bookmark")} />
            Запази
          </button>
          <div className="flex items-center gap-2">{reportSlot}</div>
        </div>
      </Card>

      <ReactionUsersModal
        publicationId={reactionType ? publication.id : null}
        type={reactionType}
        likesCount={publication.likesCount}
        dislikesCount={publication.dislikesCount}
        onClose={() => setReactionType(null)}
        renderFollowSlot={reactionUserFollowSlot}
        renderMessageSlot={reactionUserMessageSlot}
      />
    </>
  );
}
