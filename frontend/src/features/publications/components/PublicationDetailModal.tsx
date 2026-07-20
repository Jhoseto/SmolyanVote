"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Avatar, ErrorState, Skeleton, ShareButton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon, categoryLabel } from "../data/categories";
import { parseLinkMetadata } from "../lib/linkMetadata";
import { usePublicationDetail } from "../hooks/usePublicationDetail";
import { useTogglePublicationLike } from "../hooks/useTogglePublicationLike";
import { useTogglePublicationDislike } from "../hooks/useTogglePublicationDislike";
import { useTogglePublicationBookmark } from "../hooks/useTogglePublicationBookmark";
import { useSharePublication } from "../hooks/useSharePublication";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { DeletePublicationButton } from "./DeletePublicationButton";
import { PublicationEditForm } from "./PublicationEditForm";
import { ReactionUsersModal } from "./ReactionUsersModal";
import type { Publication } from "../types";

interface PublicationDetailModalProps {
  id: number | null;
  onClose: () => void;
  /** "Следвай автора" + "Докладвай" — composed at the `app/` layer (features never import features), same render props as `PublicationCard`. */
  followSlot?: (publication: Publication) => ReactNode;
  reportSlot?: (publication: Publication) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
  /** "Следвай" в "кой реагирал" модала — по потребител, а не по публикация. */
  reactionUserFollowSlot?: (userId: number) => ReactNode;
}

/**
 * Fullscreen `?openModal={id}` deep-link modal (MODERN_FRONTEND_PLAN §Detail modal).
 * Deliberately simplified vs the literal plan text: no Vidstack floating/
 * minimizable player (plain YouTube iframe embed) and no @dnd-kit draggable
 * header — same "no new heavyweight primitive for a nice-to-have" call as
 * Interactions' "no three-dots menu".
 */
export function PublicationDetailModal({
  id,
  onClose,
  followSlot,
  reportSlot,
  commentsSlot,
  reactionUserFollowSlot,
}: PublicationDetailModalProps) {
  const { data: publication, isPending, isError, refetch } = usePublicationDetail(id);
  const requireAuth = useRequireAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reactionModalType, setReactionModalType] = useState<"like" | "dislike" | null>(null);

  // Reset local UI state when a different post is opened — "adjusting state when a
  // prop changes" (https://react.dev/learn/you-might-not-need-an-effect), not an effect.
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setIsEditing(false);
    setLightboxOpen(false);
    setReactionModalType(null);
  }

  const { mutate: like, isPending: isLiking } = useTogglePublicationLike();
  const { mutate: dislike, isPending: isDisliking } = useTogglePublicationDislike();
  const { mutate: bookmark, isPending: isBookmarking } = useTogglePublicationBookmark();
  const { mutate: recordShare } = useSharePublication();

  const linkMetadata = publication ? parseLinkMetadata(publication.linkMetadata) : null;
  const shareUrl = typeof window !== "undefined" && id ? `${window.location.origin}/publications?openModal=${id}` : "";

  async function handleLike() {
    if (!publication || !(await requireAuth("да харесаш публикация"))) return;
    like(publication.id);
  }

  async function handleDislike() {
    if (!publication || !(await requireAuth("да реагираш на публикация"))) return;
    dislike(publication.id);
  }

  async function handleBookmark() {
    if (!publication || !(await requireAuth("да следиш публикация"))) return;
    bookmark(publication.id);
  }

  return (
    <Dialog.Root open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-start justify-center overflow-y-auto p-4 outline-none sm:items-center">
          <div className="my-8 w-full max-w-[720px] rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <div className="flex items-center justify-between border-b border-border-default/60 p-4">
              <Dialog.Title className="text-base font-semibold text-[color:var(--color-text-heading)]">
                Публикация
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
            </div>

            <div className="p-4 sm:p-6">
              {isPending && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/6" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {isError && <ErrorState description="Публикацията не можа да се зареди." onRetry={() => refetch()} />}

              {publication && isEditing && (
                <PublicationEditForm
                  publication={publication}
                  onSaved={() => setIsEditing(false)}
                  onCancel={() => setIsEditing(false)}
                />
              )}

              {publication && !isEditing && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar username={publication.authorUsername ?? "?"} imageUrl={publication.authorImageUrl} size={44} />
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
                    {followSlot?.(publication)}
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold",
                        "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]",
                      )}
                    >
                      <i className={cn("bi", categoryIcon(publication.category))} />
                      {categoryLabel(publication.category)}
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-[color:var(--color-text-secondary)]">{publication.content}</p>

                  {publication.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
                      <img src={publication.imageUrl} alt={publication.title} className="max-h-[520px] w-full object-cover" />
                    </button>
                  )}

                  {linkMetadata?.type === "youtube" && linkMetadata.embedUrl ? (
                    <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-md)] bg-black">
                      <iframe
                        src={linkMetadata.embedUrl}
                        title={linkMetadata.title ?? "YouTube видео"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    linkMetadata && <LinkPreviewCard metadata={linkMetadata} />
                  )}

                  <div className="flex flex-wrap items-center gap-4 border-t border-border-default/60 pt-3 text-xs text-[color:var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleLike}
                        disabled={isLiking}
                        className={cn(
                          "transition-colors hover:text-primary disabled:opacity-50",
                          publication.isLiked && "text-primary",
                        )}
                      >
                        <i className={cn("bi", publication.isLiked ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up")} />
                      </button>
                      <button
                        type="button"
                        onClick={() => publication.likesCount > 0 && setReactionModalType("like")}
                        disabled={publication.likesCount === 0}
                        className="hover:underline disabled:no-underline"
                      >
                        {publication.likesCount}
                      </button>
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleDislike}
                        disabled={isDisliking}
                        className={cn(
                          "transition-colors hover:text-[color:var(--color-error)] disabled:opacity-50",
                          publication.isDisliked && "text-[color:var(--color-error)]",
                        )}
                      >
                        <i className={cn("bi", publication.isDisliked ? "bi-hand-thumbs-down-fill" : "bi-hand-thumbs-down")} />
                      </button>
                      <button
                        type="button"
                        onClick={() => publication.dislikesCount > 0 && setReactionModalType("dislike")}
                        disabled={publication.dislikesCount === 0}
                        className="hover:underline disabled:no-underline"
                      >
                        {publication.dislikesCount}
                      </button>
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="bi bi-chat-fill" />
                      {publication.commentsCount}
                    </span>
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
                      {reportSlot?.(publication)}
                      {publication.isOwner && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 hover:text-primary"
                        >
                          <i className="bi bi-pencil" />
                          Редактирай
                        </button>
                      )}
                      {publication.isOwner && <DeletePublicationButton id={publication.id} onDeleted={onClose} />}
                    </div>
                  </div>

                  <div className="border-t border-border-default/60 pt-4">{commentsSlot?.(publication.id)}</div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>

      {publication?.imageUrl && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: publication.imageUrl }]}
        />
      )}

      <ReactionUsersModal
        publicationId={publication?.id ?? null}
        type={reactionModalType}
        onClose={() => setReactionModalType(null)}
        renderFollowSlot={reactionUserFollowSlot}
      />
    </Dialog.Root>
  );
}
