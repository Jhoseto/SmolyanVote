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
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { useSignalsDataset } from "../hooks/useSignalsDataset";
import { useDerivedSignals } from "../hooks/useDerivedSignals";
import { useSignalDetailModal } from "../hooks/useSignalDetailModal";
import { useAdminQuickModerate } from "../hooks/useAdminQuickModerate";
import { useDeleteSignal } from "../hooks/useDeleteSignal";
import { SignalsFilters } from "./SignalsFilters";
import { SignalsListPanel } from "./SignalsListPanel";
import { SignalDetailModal } from "./SignalDetailModal";
import { CreateSignalModal } from "./CreateSignalModal";
import { SignalsInfoPanel } from "./SignalsInfoPanel";
import { SignalsStatsStrip } from "./SignalsStatsStrip";
import { SignalsCategoryChips } from "./SignalsCategoryChips";

const SignalsMap = dynamic(
  () => import("./SignalsMap").then((m) => m.SignalsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[min(70dvh,560px)] w-full rounded-[var(--radius-lg)]" />,
  },
);

type MobileTab = "map" | "list";

interface SignalsMapPageProps {
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

export function SignalsMapPage({ reportSlot, commentsSlot }: SignalsMapPageProps) {
  const [filters] = useSignalsFilters();
  const { data: dataset, isPending, isError, refetch } = useSignalsDataset();
  const signals = useDerivedSignals(dataset, {
    search: filters.search || undefined,
    category: filters.category ?? undefined,
    showExpired: filters.showExpired,
    sort: filters.sort,
    time: filters.time || undefined,
    mineOnly: filters.mineOnly,
    boostedOnly: filters.boostedOnly,
    highPriorityOnly: filters.highPriorityOnly,
    resolvedOnly: filters.resolvedOnly,
    nearMe: filters.nearMe,
  });
  const signalIds = useMemo(() => signals.map((s) => s.id), [signals]);
  const { openId, open, close } = useSignalDetailModal();
  const requireAuth = useRequireAuth();
  const { user } = useAuth();
  const { mutate: quickResolve } = useAdminQuickModerate();
  const { mutate: deleteSignal } = useDeleteSignal();
  const confirm = useConfirm();
  const toast = useToast();

  const [focusSignalId, setFocusSignalId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");
  const [adminQuickMode, setAdminQuickMode] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  async function handleCreateClick() {
    if (!(await requireAuth("да подадеш сигнал"))) return;
    setCreateOpen(true);
  }

  function handleSelect(id: number) {
    open(id);
    setFocusSignalId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobileTab("map");
    }
  }

  function handleNavigate(id: number) {
    open(id);
    setFocusSignalId(id);
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
    <Container className="relative flex flex-col gap-5 py-6 pb-24 lg:pb-8">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-primary/10 bg-gradient-to-br from-primary-50/90 via-white to-white p-5 shadow-[0_8px_40px_rgba(13,110,253,0.08)] md:p-6">
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
          <Button onClick={handleCreateClick} className="hidden shadow-[0_4px_16px_rgba(13,110,253,0.35)] lg:inline-flex">
            <i className="bi bi-megaphone-fill" />
            Подай сигнал
          </Button>
        </div>
      </div>

      {dataset && dataset.length > 0 ? <SignalsStatsStrip signals={dataset} /> : null}

      <SignalsInfoPanel />

      <SignalsFilters
        totalCount={dataset?.length ?? 0}
        filteredCount={signals.length}
        isAdmin={isAdmin}
        adminQuickMode={adminQuickMode}
        onAdminQuickModeChange={setAdminQuickMode}
      />

      <SignalsCategoryChips dataset={dataset} />

      <div className="flex rounded-[var(--radius-lg)] border border-border-default/40 bg-[color:var(--color-surface-muted)]/80 p-1 shadow-inner lg:hidden">
        {(["map", "list"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] py-2.5 text-sm font-semibold transition-all duration-200",
              mobileTab === tab
                ? "bg-white text-primary shadow-[0_2px_12px_rgba(13,110,253,0.15)]"
                : "text-[color:var(--color-text-muted)]",
            )}
          >
            <i className={cn("bi", tab === "map" ? "bi-map" : "bi-list-ul")} />
            {tab === "map" ? "Карта" : "Списък"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={cn(mobileTab !== "map" && "hidden lg:block")}>
          <SignalsMap
            signals={signals}
            onMarkerClick={handleSelect}
            focusSignalId={focusSignalId}
            adminQuickMode={isAdmin && adminQuickMode}
            onAdminQuickResolve={(id) => quickResolve(id)}
            onAdminQuickDelete={isAdmin && adminQuickMode ? handleAdminQuickDelete : undefined}
            className="h-[min(70dvh,560px)] overflow-hidden rounded-[var(--radius-xl)] shadow-[0_8px_40px_rgba(15,23,42,0.1)]"
          />
        </div>

        <SignalsListPanel
          signals={signals}
          isPending={isPending}
          isError={isError}
          onRetry={() => refetch()}
          onRefresh={() => refetch()}
          onSelect={handleSelect}
          selectedId={openId}
          className={cn(
            "h-[min(70dvh,560px)]",
            mobileTab !== "list" && "hidden lg:flex",
          )}
        />
      </div>

      <SignalDetailModal
        id={openId}
        onClose={close}
        navigation={{ ids: signalIds, onNavigate: handleNavigate }}
        dataset={dataset}
        onCenterOnMap={(id) => {
          setFocusSignalId(id);
          setMobileTab("map");
        }}
        reportSlot={reportSlot}
        commentsSlot={commentsSlot}
      />

      <CreateSignalModal open={createOpen} onClose={() => setCreateOpen(false)} dataset={dataset} />

      <button
        type="button"
        onClick={handleCreateClick}
        className="fixed bottom-6 right-6 z-[1080] flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_28px_rgba(13,110,253,0.45)] transition-transform hover:scale-105 active:scale-95 lg:hidden"
        aria-label="Подай сигнал"
      >
        <i className="bi bi-megaphone text-xl" />
      </button>
    </Container>
  );
}
