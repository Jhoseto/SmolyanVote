"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Avatar, ErrorState, Skeleton } from "@/shared/ui";
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
import { PublicationEditForm } from "./PublicationEditForm";
import { PublicationModerationMenu } from "./PublicationModerationMenu";
import { PublicationShareSheet } from "./PublicationShareSheet";
import { PublicationText } from "./PublicationText";
import { ReactionUsersModal } from "./ReactionUsersModal";
import { SocialModalShell } from "./SocialModalShell";
import { OnlineStatusDot } from "./OnlineStatusDot";
import type { Publication } from "../types";

interface PublicationDetailModalProps {
  id: number | null;
  onClose: () => void;
  focusComments?: boolean;
  onHashtagClick?: (tag: string) => void;
  followSlot?: (publication: Publication) => ReactNode;
  reportSlot?: (publication: Publication) => ReactNode;
  commentsSlot?: (id: number, totalComments: number) => ReactNode;
  reactionUserFollowSlot?: (userId: number) => ReactNode;
  reactionUserMessageSlot?: (userId: number) => ReactNode;
  wrapAuthor?: (publication: Publication, children: ReactNode) => ReactNode;
}

export function PublicationDetailModal({
  id,
  onClose,
  focusComments = false,
  onHashtagClick,
  followSlot,
  reportSlot,
  commentsSlot,
  reactionUserFollowSlot,
  reactionUserMessageSlot,
  wrapAuthor,
}: PublicationDetailModalProps) {
  const { data: publication, isPending, isError, refetch } = usePublicationDetail(id);
  const requireAuth = useRequireAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reactionModalType, setReactionModalType] = useState<"like" | "dislike" | null>(null);
  const [commentsExpanded, setCommentsExpanded] = useState(focusComments);
  const commentsRef = useRef<HTMLDivElement>(null);

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setIsEditing(false);
    setLightboxOpen(false);
    setReactionModalType(null);
    setCommentsExpanded(focusComments);
  }

  useEffect(() => {
    if (!focusComments || !publication) return;
    setCommentsExpanded(true);
    const t = window.setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [focusComments, publication?.id]);

  const { mutate: like, isPending: isLiking } = useTogglePublicationLike();
  const { mutate: dislike, isPending: isDisliking } = useTogglePublicationDislike();
  const { mutate: bookmark, isPending: isBookmarking } = useTogglePublicationBookmark();
  const { mutate: recordShare } = useSharePublication();

  const linkMetadata = publication ? parseLinkMetadata(publication.linkMetadata) : null;
  const shareUrl =
    typeof window !== "undefined" && id ? `${window.location.origin}/publications/${id}` : "";

  const authorHref = publication?.authorUsername
    ? `/user/${encodeURIComponent(publication.authorUsername)}`
    : null;

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
    <>
      <SocialModalShell
        open={id !== null}
        onClose={onClose}
        title="Публикация"
        size="xl"
        bodyScroll="hidden"
        bodyClassName="flex flex-col p-0"
      >
        {isPending && (
          <div className="flex flex-col gap-3 p-6">
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

        {isError && (
          <div className="p-6">
            <ErrorState description="Публикацията не можа да се зареди." onRetry={() => refetch()} />
          </div>
        )}

        {publication && isEditing && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <PublicationEditForm
              publication={publication}
              onSaved={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}

        {publication && !isEditing && (
          <div
            className={cn(
              // Desktop (lg+): unchanged side-by-side split.
              "relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:h-full lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:grid-rows-[minmax(0,1fr)]",
            )}
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden border-b border-border-default/50 lg:border-b-0 lg:border-r">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const authorBlock = (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative shrink-0">
                        {authorHref ? (
                          <Link href={authorHref} onClick={onClose}>
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
                            <Link
                              href={authorHref}
                              onClick={onClose}
                              className="hover:text-primary hover:underline"
                            >
                              {publication.authorUsername}
                            </Link>
                          ) : (
                            (publication.authorUsername ?? "Анонимен")
                          )}
                          {publication.emotion && (
                            <span className="ml-1.5 font-normal text-[color:var(--color-text-muted)]">
                              се чувства {publication.emotion}{" "}
                              <strong>{publication.emotionText}</strong>
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-[color:var(--color-text-muted)]">
                          {formatRelativeDate(publication.createdAt)}
                          {publication.readingTime
                            ? ` · ${publication.readingTime} мин. четене`
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                  return wrapAuthor ? wrapAuthor(publication, authorBlock) : authorBlock;
                })()}
                {followSlot?.(publication)}
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)]">
                  <i className={cn("bi", categoryIcon(publication.category))} />
                  {categoryLabel(publication.category)}
                </span>
                <PublicationModerationMenu
                  publicationId={publication.id}
                  authorId={publication.authorId}
                  authorUsername={publication.authorUsername}
                  isOwner={publication.isOwner}
                  onEdit={() => setIsEditing(true)}
                  onDeleted={onClose}
                />
              </div>

              {publication.imageUrl && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block w-full overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
                  <img
                    src={publication.imageUrl}
                    alt={publication.title}
                    className="max-h-[min(420px,50vh)] w-full object-contain"
                  />
                </button>
              )}

              <p className="whitespace-pre-line text-[color:var(--color-text-secondary)]">
                <PublicationText text={publication.content} onHashtagClick={onHashtagClick} />
              </p>

              {linkMetadata && (
                <LinkPreviewCard
                  metadata={linkMetadata}
                  inlinePlay={linkMetadata.type === "youtube" ? "always" : undefined}
                />
              )}

              <div className="flex flex-col gap-2 border-t border-border-default/60 pt-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-text-muted)]">
                  <button
                    type="button"
                    disabled={publication.likesCount === 0}
                    onClick={() => publication.likesCount > 0 && setReactionModalType("like")}
                    className="hover:underline disabled:no-underline"
                  >
                    {publication.likesCount} харесвания
                  </button>
                  <button
                    type="button"
                    disabled={publication.dislikesCount === 0}
                    onClick={() => publication.dislikesCount > 0 && setReactionModalType("dislike")}
                    className="hover:underline disabled:no-underline"
                  >
                    {publication.dislikesCount} нехаресвания
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsExpanded(true)}
                    className="hover:underline lg:pointer-events-none"
                  >
                    {publication.commentsCount} коментара
                  </button>
                  <span className="inline-flex items-center gap-1">
                    <i className="bi bi-eye" aria-hidden />
                    {publication.viewsCount}
                  </span>
                </div>

                <div className="flex w-full items-center justify-evenly gap-0.5">
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={isLiking}
                    aria-label="Харесвам"
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium transition-colors hover:bg-primary-50 disabled:opacity-50",
                      publication.isLiked ? "text-primary" : "text-[color:var(--color-text-secondary)]",
                    )}
                  >
                    <i
                      className={cn(
                        "bi shrink-0 text-base",
                        publication.isLiked ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up",
                      )}
                      aria-hidden
                    />
                    <span className="hidden sm:inline">Харесвам</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDislike}
                    disabled={isDisliking}
                    aria-label="Не харесвам"
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50",
                      publication.isDisliked
                        ? "text-[color:var(--color-error)]"
                        : "text-[color:var(--color-text-secondary)]",
                    )}
                  >
                    <i
                      className={cn(
                        "bi shrink-0 text-base",
                        publication.isDisliked ? "bi-hand-thumbs-down-fill" : "bi-hand-thumbs-down",
                      )}
                      aria-hidden
                    />
                    <span className="hidden sm:inline">Не харесвам</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsExpanded(true)}
                    aria-label="Коментирай"
                    className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary lg:pointer-events-none"
                  >
                    <i className="bi bi-chat-fill shrink-0 text-base" aria-hidden />
                    <span className="hidden sm:inline">Коментирай</span>
                  </button>
                  <PublicationShareSheet
                    title={publication.title}
                    url={shareUrl}
                    onShared={() => recordShare(publication.id)}
                    className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    <i className="bi bi-share shrink-0 text-base" aria-hidden />
                    <span className="hidden sm:inline">Сподели</span>
                  </PublicationShareSheet>
                  <button
                    type="button"
                    onClick={handleBookmark}
                    disabled={isBookmarking}
                    aria-label={publication.isBookmarked ? "Премахни от запазени" : "Запази"}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium transition-colors hover:bg-primary-50 disabled:opacity-50",
                      publication.isBookmarked ? "text-primary" : "text-[color:var(--color-text-secondary)]",
                    )}
                  >
                    <i
                      className={cn(
                        "bi shrink-0 text-base",
                        publication.isBookmarked ? "bi-bookmark-fill" : "bi-bookmark",
                      )}
                      aria-hidden
                    />
                    <span className="hidden sm:inline">Запази</span>
                  </button>
                  <div className="flex shrink-0 items-center justify-center">{reportSlot?.(publication)}</div>
                </div>
              </div>
                </div>
              </div>
            </div>

            <div
              ref={commentsRef}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden border-t border-border-default/50 bg-white lg:static lg:h-full lg:border-t-0 lg:bg-[color:var(--color-surface-light)]/50",
                // Mobile: expanded comments cover the whole modal body (under the shell title).
                commentsExpanded && "max-lg:absolute max-lg:inset-0 max-lg:z-20 max-lg:border-t-0",
                focusComments && commentsExpanded && "ring-2 ring-inset ring-primary/25",
              )}
            >
              {/* Mobile: single collapsible title. Desktop: static title (CommentsSection heading is hidden). */}
              <button
                type="button"
                aria-expanded={commentsExpanded}
                onClick={() => setCommentsExpanded((open) => !open)}
                className="flex shrink-0 items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--color-surface-muted)]/40 lg:hidden"
              >
                <span className="flex min-w-0 items-center gap-2 font-display text-base font-semibold text-[color:var(--color-text-heading)]">
                  <i className="bi bi-chat-fill text-primary" aria-hidden />
                  Коментари
                  {publication.commentsCount > 0 ? (
                    <span className="text-sm font-medium text-[color:var(--color-text-muted)]">
                      ({publication.commentsCount})
                    </span>
                  ) : null}
                </span>
                <i
                  className={cn(
                    "bi shrink-0 text-[color:var(--color-text-muted)] transition-transform duration-200",
                    commentsExpanded ? "bi-chevron-down" : "bi-chevron-up",
                  )}
                  aria-hidden
                />
              </button>
              <div className="hidden shrink-0 items-center gap-2 px-4 pt-4 font-display text-base font-semibold text-[color:var(--color-text-heading)] lg:flex sm:px-5 sm:pt-5">
                <i className="bi bi-chat-fill text-primary" aria-hidden />
                Коментари
                {publication.commentsCount > 0 ? (
                  <span className="text-sm font-medium text-[color:var(--color-text-muted)]">
                    ({publication.commentsCount})
                  </span>
                ) : null}
              </div>

              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-5 sm:pb-5 lg:pt-3",
                  !commentsExpanded && "hidden lg:flex",
                )}
              >
                {commentsSlot?.(publication.id, publication.commentsCount)}
              </div>
            </div>
          </div>
        )}
      </SocialModalShell>

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
        likesCount={publication?.likesCount}
        dislikesCount={publication?.dislikesCount}
        onClose={() => setReactionModalType(null)}
        renderFollowSlot={reactionUserFollowSlot}
        renderMessageSlot={reactionUserMessageSlot}
      />
    </>
  );
}
