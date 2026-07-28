"use client";

import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button, Container, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { useSignalsDataset } from "../hooks/useSignalsDataset";
import { useDerivedSignals } from "../hooks/useDerivedSignals";
import { useSignalDetailModal } from "../hooks/useSignalDetailModal";
import { useAdminQuickModerate } from "../hooks/useAdminQuickModerate";
import { useDeleteSignal } from "../hooks/useDeleteSignal";
import { hasSignalCreateDraft } from "../lib/signalCreateDraft";
import { SignalsFilters } from "./SignalsFilters";
import { SignalsLanesSection } from "./SignalsLanesSection";
import { SignalsListPanel } from "./SignalsListPanel";
import { SignalDetailModal } from "./SignalDetailModal";
import { CreateSignalModal } from "./CreateSignalModal";
import { SignalsInfoPanel } from "./SignalsInfoPanel";
import { SignalsStatsStrip } from "./SignalsStatsStrip";
import { SignalsCategoryChips } from "./SignalsCategoryChips";
import type { Signal } from "../types";

const SignalsMap = dynamic(
  () => import("./SignalsMap").then((m) => m.SignalsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[min(60dvh,620px)] w-full rounded-[var(--radius-lg)]" />,
  },
);

interface SignalsMapPageProps {
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

export function SignalsMapPage({ reportSlot, commentsSlot }: SignalsMapPageProps) {
  const [filters] = useSignalsFilters();
  const { data: dataset, isPending, isError, refetch } = useSignalsDataset();
  const derivedParams = useMemo(
    () => ({
      search: filters.search || undefined,
      category: filters.category ?? undefined,
      showInactive: filters.showInactive,
      sort: filters.sort,
      time: filters.time || undefined,
      mineOnly: filters.mineOnly,
      boostedOnly: filters.boostedOnly,
      highPriorityOnly: filters.highPriorityOnly,
      resolvedOnly: filters.resolvedOnly,
      nearMe: filters.nearMe,
    }),
    [
      filters.search,
      filters.category,
      filters.showInactive,
      filters.sort,
      filters.time,
      filters.mineOnly,
      filters.boostedOnly,
      filters.highPriorityOnly,
      filters.resolvedOnly,
      filters.nearMe,
    ],
  );
  const signals = useDerivedSignals(dataset, derivedParams);
  const signalIds = useMemo(() => signals.map((s) => s.id), [signals]);
  const { openId, open, close } = useSignalDetailModal();
  const requireAuth = useRequireAuth();
  const canInteract = useCanInteract();
  const { user } = useAuth();
  const { mutate: quickResolve } = useAdminQuickModerate();
  const { mutate: deleteSignal } = useDeleteSignal();
  const confirm = useConfirm();
  const toast = useToast();

  const [focusSignalId, setFocusSignalId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [adminQuickMode, setAdminQuickMode] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(() => hasSignalCreateDraft());

  const isAdmin = user?.role === "ADMIN";

  async function handleCreateClick() {
    if (!(await requireAuth("да подадеш сигнал"))) return;
    setShowDraftBanner(false);
    setCreateOpen(true);
  }

  function handleSelect(id: number) {
    open(id);
    setFocusSignalId(id);
  }

  function handleNavigate(id: number) {
    open(id);
    setFocusSignalId(id);
  }

  function handleCreated(signal: Signal) {
    handleSelect(signal.id);
    refetch();
  }

  async function handleAdminQuickDelete(id: number) {
    const ok = await confirm({
      title: "Изтриване на сигнал",
      description: "Сигурни ли сте, че искате да изтриете този сигнал? Действието е необратимо.",
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;
    deleteSignal(id, {
      onSuccess: () => {
        toast.success("Сигналът е изтрит.");
        if (openId === id) close();
        if (focusSignalId === id) setFocusSignalId(null);
      },
      onError: (err) => toast.error(errorMessage(err, "Изтриването не успя.")),
    });
  }

  return (
    <Container className="relative flex flex-col gap-5 py-6 pb-8">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-primary/10 bg-gradient-to-br from-primary-50/90 via-white to-white p-5 shadow-[0_8px_40px_rgba(25,134,28,0.08)] md:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-gradient-brand font-display text-xl font-bold tracking-[-0.02em] md:text-2xl">
              Граждански сигнали
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[color:var(--color-text-muted)]">
              Карта на активните сигнали в област Смолян — подай, сподели, вдигни приоритет.
            </p>
          </div>
        </div>
        {!canInteract && (
          <p className="relative mt-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
            <i className="bi bi-shield-exclamation mr-1" aria-hidden />
            Подаването на сигнали е изключено, докато профилът е ограничен.
          </p>
        )}
      </div>

      {showDraftBanner && canInteract ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-primary/20 bg-primary-50/70 px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
          <span>
            <i className="bi bi-pencil-square mr-1.5 text-primary" />
            Имате незавършен чернова на сигнал.
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowDraftBanner(false)}>
              Скрий
            </Button>
            <Button size="sm" onClick={handleCreateClick}>
              Продължи
            </Button>
          </div>
        </div>
      ) : null}

      {dataset && dataset.length > 0 ? <SignalsStatsStrip signals={dataset} /> : null}

      <SignalsInfoPanel />

      <nav className="sticky top-[var(--header-height,56px)] z-20 -mx-1 flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/25 bg-white/95 p-1 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md">
        {[
          { href: "#signals-filters", label: "Филтри", icon: "bi-funnel" },
          { href: "#signals-map", label: "Карта", icon: "bi-map" },
          { href: "#signals-lanes", label: "Ленти", icon: "bi-grid-3x3-gap" },
          { href: "#signals-list", label: "Списък", icon: "bi-list-ul" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <i className={cn("bi", item.icon)} />
            {item.label}
          </a>
        ))}
      </nav>

      <SignalsFilters
        totalCount={dataset?.length ?? 0}
        filteredCount={signals.length}
        isAdmin={isAdmin}
        adminQuickMode={adminQuickMode}
        onAdminQuickModeChange={setAdminQuickMode}
      />

      <SignalsCategoryChips dataset={dataset} />

      <div id="signals-map" className="relative scroll-mt-24">
        <SignalsMap
          signals={signals}
          onMarkerClick={handleSelect}
          focusSignalId={focusSignalId}
          adminQuickMode={isAdmin && adminQuickMode}
          onAdminQuickResolve={(id) => quickResolve(id)}
          onAdminQuickDelete={isAdmin && adminQuickMode ? handleAdminQuickDelete : undefined}
          className="h-[min(60dvh,620px)] w-full rounded-[var(--radius-xl)] shadow-[0_8px_40px_rgba(15,23,42,0.1)]"
        />
        {canInteract && (
          <Button
            onClick={handleCreateClick}
            className="absolute bottom-4 right-4 z-[15] shadow-[0_4px_16px_rgba(25,134,28,0.45)] sm:bottom-14 sm:right-5"
          >
            <i className="bi bi-megaphone-fill" />
            Подай сигнал
          </Button>
        )}
      </div>

      <div id="signals-lanes" className="scroll-mt-24">
        <SignalsLanesSection signals={signals} onSelect={handleSelect} selectedId={openId} />
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
        <span className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
          Пълен списък
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
      </div>

      <div id="signals-list" className="scroll-mt-24">
        <SignalsListPanel
          signals={signals}
          isPending={isPending}
          isError={isError}
          onRetry={() => refetch()}
          onRefresh={() => refetch()}
          onSelect={handleSelect}
          selectedId={openId}
        />
      </div>

      <SignalDetailModal
        id={openId}
        onClose={close}
        navigation={{ ids: signalIds, onNavigate: handleNavigate }}
        dataset={dataset}
        onCenterOnMap={(id) => setFocusSignalId(id)}
        reportSlot={reportSlot}
        commentsSlot={commentsSlot}
      />

      <CreateSignalModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} dataset={dataset} />
    </Container>
  );
}
