"use client";

import { useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Avatar, ErrorState, ShareButton, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { categoryIcon } from "../data/categories";
import { priorityLabel, applyPriorityTiers } from "../lib/computePriorityLevel";
import { SIGNALS_DATASET_QUERY_KEY } from "../api";
import type { Signal } from "../types";
import { useSignalDetail } from "../hooks/useSignalDetail";
import { useToggleSignalBoost } from "../hooks/useToggleSignalBoost";
import { SignalEditForm } from "./SignalEditForm";
import { DeleteSignalButton } from "./DeleteSignalButton";
import { PriorityBadge } from "./PriorityBadge";
import { SignalAdminSection } from "./SignalAdminSection";
import { SignalModalShell } from "./SignalModalShell";
import { SignalSubscribeButton } from "./SignalSubscribeButton";
import { SignalReportResolvedButton } from "./SignalReportResolvedButton";
import { SignalTimeline } from "./SignalTimeline";
import { findSimilarNearby } from "../lib/findSimilarSignals";

interface SignalNavigation {
  ids: number[];
  onNavigate: (id: number) => void;
}

interface SignalDetailModalProps {
  id: number | null;
  onClose: () => void;
  onCenterOnMap?: (id: number) => void;
  navigation?: SignalNavigation;
  dataset?: Signal[];
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

function NavButtons({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  index,
  total,
}: {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
}) {
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Предишен сигнал"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-primary disabled:opacity-30"
      >
        <i className="bi bi-chevron-left" />
      </button>
      <span className="min-w-[3rem] text-center text-[10px] font-semibold tabular-nums text-[color:var(--color-text-muted)]">
        {index + 1}/{total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Следващ сигнал"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-primary disabled:opacity-30"
      >
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

export function SignalDetailModal({
  id,
  onClose,
  onCenterOnMap,
  navigation,
  dataset,
  reportSlot,
  commentsSlot,
}: SignalDetailModalProps) {
  const queryClient = useQueryClient();
  const { data: rawSignal, isPending, isError, refetch } = useSignalDetail(id);
  const signal = useMemo(() => {
    if (!rawSignal) return null;
    if (rawSignal.priorityTier) return rawSignal;
    const cached = queryClient.getQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY);
    if (!cached) return rawSignal;
    return applyPriorityTiers(cached).find((s) => s.id === rawSignal.id) ?? rawSignal;
  }, [rawSignal, queryClient]);

  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const navIndex = id != null && navigation ? navigation.ids.indexOf(id) : -1;
  const hasPrev = navIndex > 0;
  const hasNext = navigation != null && navIndex >= 0 && navIndex < navigation.ids.length - 1;
  const similar = useMemo(() => {
    if (!signal || !dataset) return [];
    return findSimilarNearby(signal, applyPriorityTiers(dataset));
  }, [signal, dataset]);

  function goPrev() {
    if (!navigation || !hasPrev) return;
    navigation.onNavigate(navigation.ids[navIndex - 1]!);
  }

  function goNext() {
    if (!navigation || !hasNext) return;
    navigation.onNavigate(navigation.ids[navIndex + 1]!);
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null) return;
    const delta = end - start;
    if (Math.abs(delta) < 60) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setIsEditing(false);
    setLightboxOpen(false);
  }

  const { mutate: boost, isPending: isBoosting } = useToggleSignalBoost();
  const isAdmin = user?.role === "ADMIN";
  const canEdit = signal?.isOwner || isAdmin;
  const canDelete = signal?.isOwner || isAdmin;
  const authorHref = signal?.authorUsername ? `/user/${encodeURIComponent(signal.authorUsername)}` : null;
  const shareUrl =
    typeof window !== "undefined" && signal ? `${window.location.origin}/signals/${signal.id}` : "";

  async function handleBoost() {
    if (!signal || !(await requireAuth("да вдигнеш приоритета на сигнал"))) return;
    boost(signal.id, {
      onError: (error) => toast.error(errorMessage(error, "Вдигането на приоритет не успя.")),
    });
  }

  const headerExtra =
    navigation && navigation.ids.length > 1 ? (
      <NavButtons
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={goPrev}
        onNext={goNext}
        index={navIndex}
        total={navigation.ids.length}
      />
    ) : null;

  return (
    <>
      <SignalModalShell
        open={id !== null}
        onOpenChange={(open) => !open && onClose()}
        title={signal?.title ?? "Сигнал"}
        subtitle={signal ? signal.categoryLabel : undefined}
        icon={signal ? categoryIcon(signal.category) : "bi-pin-map-fill"}
        variant="social"
        size="xl"
        bodyScroll="hidden"
        bodyClassName="flex flex-col p-0"
        headerExtra={headerExtra}
      >
        {isPending && (
          <div className="flex flex-col gap-3 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState description="Сигналът не можа да се зареди." onRetry={() => refetch()} />
          </div>
        )}

        {signal && isEditing && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <SignalEditForm signal={signal} onSaved={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
          </div>
        )}

        {signal && !isEditing && (
          <div
            className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(280px,0.45fr)] lg:h-full lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:grid-rows-[minmax(0,1fr)]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* LEFT — signal content */}
            <div className="flex h-full min-h-0 flex-col overflow-hidden border-b border-border-default/50 lg:border-b-0 lg:border-r">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-5 p-4 sm:p-6">
                  {/* Author row */}
                  <div className="flex items-center gap-3">
                    {authorHref ? (
                      <Link href={authorHref} onClick={onClose}>
                        <Avatar username={signal.authorUsername ?? "?"} imageUrl={signal.authorImageUrl} size={44} />
                      </Link>
                    ) : (
                      <Avatar username={signal.authorUsername ?? "?"} imageUrl={signal.authorImageUrl} size={44} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {authorHref ? (
                          <Link href={authorHref} onClick={onClose} className="hover:text-primary hover:underline">
                            {signal.authorUsername}
                          </Link>
                        ) : (
                          (signal.authorUsername ?? "Анонимен")
                        )}
                      </p>
                      <p className="truncate text-xs text-[color:var(--color-text-muted)]">
                        {formatRelativeDate(signal.createdAt)}
                        {signal.distanceKm != null ? ` · ${signal.distanceKm.toFixed(1)} km` : ""}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)]">
                      <i className={cn("bi text-primary", categoryIcon(signal.category))} />
                      {signal.categoryLabel}
                    </span>
                  </div>

                  {/* Title + status */}
                  <div className="flex flex-col gap-3">
                    <h2 className="font-display text-xl font-bold leading-snug tracking-[-0.02em] text-[color:var(--color-text-heading)] sm:text-2xl">
                      {signal.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                          signal.isResolved
                            ? "bg-blue-50 text-blue-700 ring-blue-200/60"
                            : signal.isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                              : "bg-slate-100 text-slate-600 ring-slate-200/60",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            signal.isResolved ? "bg-blue-500" : signal.isActive ? "bg-emerald-500" : "bg-slate-400",
                          )}
                        />
                        {signal.isResolved ? "Решен" : signal.isActive ? "Активен" : "Изтекъл"}
                      </span>
                      {signal.isActive && signal.priorityTier ? <PriorityBadge tier={signal.priorityTier} size="md" /> : null}
                      {signal.resolvedReportCount > 0 && !signal.isResolved ? (
                        <span className="rounded-[var(--radius-pill)] bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200/60">
                          {signal.resolvedReportCount} доклада „решено“
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Hero image */}
                  {signal.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="group relative block w-full overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)] ring-1 ring-border-default/30"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signal.imageUrl}
                        alt={signal.title}
                        className="max-h-[min(420px,42vh)] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                      <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        <i className="bi bi-arrows-fullscreen" />
                        Увеличи
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-primary-50/80 via-white to-emerald-50/50 ring-1 ring-primary/10">
                      <i className={cn("bi text-5xl text-primary/25", categoryIcon(signal.category))} />
                    </div>
                  )}

                  {signal.isActive && signal.priorityTier ? (
                    <p className="rounded-[var(--radius-lg)] border border-primary/10 bg-primary-50/40 px-4 py-3 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                      <i className="bi bi-stars mr-1.5 text-primary" />
                      {priorityLabel(signal.priorityTier)} — спрямо активните сигнали в „{signal.categoryLabel}“.
                    </p>
                  ) : null}

                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
                    {signal.description}
                  </p>

                  {/* Stats + actions — publication-style footer row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-default/60 pt-4 text-xs text-[color:var(--color-text-muted)]">
                    <button
                      type="button"
                      onClick={handleBoost}
                      disabled={isBoosting}
                      className={cn(
                        "inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-primary disabled:opacity-50",
                        signal.hasBoosted && "text-primary",
                      )}
                    >
                      <i className={cn("bi text-sm", signal.hasBoosted ? "bi-arrow-up-circle-fill" : "bi-arrow-up-circle")} />
                      {signal.priorityBoostCount}
                    </button>
                    <span className="inline-flex items-center gap-1.5">
                      <i className="bi bi-eye-fill" />
                      {signal.viewsCount}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <i className="bi bi-chat-fill" />
                      {signal.commentsCount}
                    </span>
                    <ShareButton title={signal.title} url={shareUrl || `/signals/${signal.id}`} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onCenterOnMap ? (
                      <button
                        type="button"
                        onClick={() => {
                          onCenterOnMap(signal.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border-default/40 bg-white px-3.5 py-2 text-xs font-semibold text-[color:var(--color-text-secondary)] shadow-sm transition-colors hover:border-primary/30 hover:bg-primary-50 hover:text-primary"
                      >
                        <i className="bi bi-geo-alt" />
                        На картата
                      </button>
                    ) : null}
                    <SignalSubscribeButton signal={signal} />
                    <SignalReportResolvedButton signal={signal} />
                    {reportSlot?.(signal.id)}
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border-default/40 bg-white px-3.5 py-2 text-xs font-semibold text-[color:var(--color-text-secondary)] shadow-sm transition-colors hover:border-primary/30 hover:bg-primary-50 hover:text-primary"
                      >
                        <i className="bi bi-pencil" />
                        Редактирай
                      </button>
                    ) : null}
                    {canDelete && !isAdmin ? (
                      <DeleteSignalButton id={signal.id} onDeleted={onClose} />
                    ) : null}
                  </div>

                  <SignalTimeline signal={signal} />

                  {similar.length > 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-border-default/25 bg-[color:var(--color-surface-light)]/60 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
                        Подобни наблизо
                      </p>
                      <div className="flex flex-col gap-2">
                        {similar.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => navigation?.onNavigate(s.id)}
                            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-default/30 bg-white px-3 py-2.5 text-left transition-colors hover:border-primary/25 hover:bg-primary-50/40"
                          >
                            <i className={cn("bi text-primary", categoryIcon(s.category))} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--color-text-primary)]">
                              {s.title}
                            </span>
                            <span className="text-[10px] tabular-nums text-[color:var(--color-text-muted)]">
                              {(s.distanceKm ?? 0).toFixed(2)} km
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isAdmin ? <SignalAdminSection signal={signal} onDeleted={onClose} /> : null}
                </div>
              </div>
            </div>

            {/* RIGHT — comments (own scroll via CommentsSection) */}
            <div className="flex min-h-0 flex-col overflow-hidden bg-[color:var(--color-surface-light)]/50 p-4 sm:p-5 lg:h-full">
              {commentsSlot?.(signal.id)}
            </div>
          </div>
        )}
      </SignalModalShell>

      {signal?.imageUrl ? (
        <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={[{ src: signal.imageUrl }]} />
      ) : null}
    </>
  );
}
