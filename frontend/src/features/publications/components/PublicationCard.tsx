"use client";

import type { ReactNode } from "react";
import { Avatar, Card, ShareButton } from "@/shared/ui";
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
import { DeletePublicationButton } from "./DeletePublicationButton";
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
  /** Opens `PublicationDetailModal` (`?openModal={id}`) — clicking the content/image/comments. */
  onOpenDetail?: (id: number) => void;
  /** "Следвай автора" + "Докладвай" — composed at the `app/` layer (features never import features). */
  followSlot?: ReactNode;
  reportSlot?: ReactNode;
}

export function PublicationCard({ publication, onOpenDetail, followSlot, reportSlot }: PublicationCardProps) {
  const requireAuth = useRequireAuth();
  const linkMetadata = parseLinkMetadata(publication.linkMetadata);

  const { mutate: like, isPending: isLiking } = useTogglePublicationLike();
  const { mutate: dislike, isPending: isDisliking } = useTogglePublicationDislike();
  const { mutate: bookmark, isPending: isBookmarking } = useTogglePublicationBookmark();
  const { mutate: recordShare } = useSharePublication();

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/publications?openModal=${publication.id}` : "";

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

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar username={publication.authorUsername ?? "?"} imageUrl={publication.authorImageUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
            {publication.authorUsername ?? "Анонимен"}
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
            "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold",
            CATEGORY_BADGE_CLASSES[publication.category],
          )}
        >
          <i className={cn("bi", categoryIcon(publication.category))} />
          {categoryLabel(publication.category)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail?.(publication.id)}
        className="line-clamp-4 whitespace-pre-line text-left text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
      >
        {publication.excerpt || publication.content}
      </button>

      {publication.imageUrl && (
        <button
          type="button"
          onClick={() => onOpenDetail?.(publication.id)}
          className="overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]"
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

      {linkMetadata && <LinkPreviewCard metadata={linkMetadata} />}

      <div className="flex flex-wrap items-center gap-4 border-t border-border-default/60 pt-3 text-xs text-[color:var(--color-text-muted)]">
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-primary disabled:opacity-50",
            publication.isLiked && "text-primary",
          )}
        >
          <i className={cn("bi", publication.isLiked ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up")} />
          {publication.likesCount}
        </button>
        <button
          type="button"
          onClick={handleDislike}
          disabled={isDisliking}
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-[color:var(--color-error)] disabled:opacity-50",
            publication.isDisliked && "text-[color:var(--color-error)]",
          )}
        >
          <i className={cn("bi", publication.isDisliked ? "bi-hand-thumbs-down-fill" : "bi-hand-thumbs-down")} />
          {publication.dislikesCount}
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail?.(publication.id)}
          className="flex items-center gap-1 transition-colors hover:text-primary"
        >
          <i className="bi bi-chat-fill" />
          {publication.commentsCount}
        </button>
        <ShareButton
          title={publication.title}
          url={shareUrl}
          onShared={() => recordShare(publication.id)}
          className="flex items-center gap-1 transition-colors hover:text-primary"
        />
        <span className="flex items-center gap-1">
          <i className="bi bi-share-fill" />
          {publication.sharesCount}
        </span>
        <button
          type="button"
          onClick={handleBookmark}
          disabled={isBookmarking}
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-primary disabled:opacity-50",
            publication.isBookmarked && "text-primary",
          )}
        >
          <i className={cn("bi", publication.isBookmarked ? "bi-bookmark-fill" : "bi-bookmark")} />
        </button>
        <span className="flex items-center gap-1">
          <i className="bi bi-eye-fill" />
          {publication.viewsCount}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {reportSlot}
          {publication.isOwner && <DeletePublicationButton id={publication.id} />}
        </div>
      </div>
    </Card>
  );
}
