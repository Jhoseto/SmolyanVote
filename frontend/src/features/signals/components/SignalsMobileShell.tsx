"use client";

import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button, Skeleton } from "@/shared/ui";
import type { SignalsPageController } from "../hooks/useSignalsPageController";
import { SignalsMobileTopBar, SignalsMobileTabBar, type SignalsMobileTab } from "./SignalsMobileTopBar";
import { SignalsMobileFiltersSheet, SignalsMobileInfoSheet } from "./SignalsMobileFiltersSheet";
import { SignalsMobileMapChips } from "./SignalsMobileMapChips";
import { SignalsMapPeekSheet } from "./SignalsMapPeekSheet";
import { SignalsMobileListTab } from "./SignalsMobileListTab";
import { SignalsMobileFab } from "./SignalsMobileFab";
import { SignalsMobileStatsBar } from "./SignalsMobileStatsBar";
import { SignalsMobileQuickFilters } from "./SignalsMobileQuickFilters";
import { SignalsMobileActionBar } from "./SignalsMobileActionBar";
import { SignalDetailModal } from "./SignalDetailModal";
import { CreateSignalModal } from "./CreateSignalModal";
import "./signals-mobile.css";

const SignalsMap = dynamic(
  () => import("./SignalsMap").then((m) => m.SignalsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

interface SignalsMobileShellProps {
  controller: SignalsPageController;
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

export function SignalsMobileShell({ controller, reportSlot, commentsSlot }: SignalsMobileShellProps) {
  const {
    dataset,
    signals,
    signalIds,
    openId,
    close,
    canInteract,
    isAdmin,
    isPending,
    isError,
    refetch,
    focusSignalId,
    setFocusSignalId,
    createOpen,
    setCreateOpen,
    adminQuickMode,
    setAdminQuickMode,
    showDraftBanner,
    setShowDraftBanner,
    activeCount,
    handleCreateClick,
    handleSelect,
    handleNavigate,
    handleCreated,
    handleAdminQuickDelete,
    quickResolve,
  } = controller;

  const [tab, setTab] = useState<SignalsMobileTab>("map");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [peekHeight, setPeekHeight] = useState(168);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handlePeekHeightChange = useCallback((h: number) => {
    setPeekHeight(h);
  }, []);

  return (
    <div
      className="signals-mobile signals-mobile-root"
      style={{ "--signals-peek-height": tab === "map" ? `${peekHeight}px` : "0px" } as CSSProperties}
    >
      <SignalsMobileTopBar
        activeCount={activeCount}
        filteredCount={signals.length}
        onOpenFilters={() => setFiltersOpen(true)}
        onOpenInfo={() => setInfoOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isPending}
      />

      {showDraftBanner && canInteract ? (
        <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-primary/20 bg-primary-50/80 px-3 py-2 text-xs text-[color:var(--color-text-secondary)]">
          <span className="min-w-0 truncate">
            <i className="bi bi-pencil-square mr-1 text-primary" />
            Незавършена чернова
          </span>
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setShowDraftBanner(false)}>
              Скрий
            </Button>
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleCreateClick}>
              Продължи
            </Button>
          </div>
        </div>
      ) : null}

      {dataset && dataset.length > 0 ? <SignalsMobileStatsBar signals={dataset} /> : null}

      <SignalsMobileQuickFilters
        isAdmin={isAdmin}
        adminQuickMode={adminQuickMode}
        onAdminQuickModeChange={setAdminQuickMode}
        onOpenAdvanced={() => setFiltersOpen(true)}
      />

      <SignalsMobileActionBar
        onOpenFilters={() => setFiltersOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isPending}
      />

      <SignalsMobileTabBar tab={tab} onTabChange={setTab} />

      <div className="signals-mobile-body">
        {tab === "map" ? (
          <div className="signals-mobile-map-pane">
            <SignalsMap
              signals={signals}
              onMarkerClick={handleSelect}
              focusSignalId={focusSignalId}
              adminQuickMode={isAdmin && adminQuickMode}
              onAdminQuickResolve={(id) => quickResolve(id)}
              onAdminQuickDelete={isAdmin && adminQuickMode ? handleAdminQuickDelete : undefined}
              className="h-full w-full rounded-none"
            />
            <SignalsMobileMapChips dataset={dataset} />
            <SignalsMapPeekSheet
              signals={signals}
              selectedId={openId}
              onSelect={handleSelect}
              onHeightChange={handlePeekHeightChange}
            />
          </div>
        ) : (
          <SignalsMobileListTab
            signals={signals}
            isPending={isPending}
            isError={isError}
            selectedId={openId}
            onSelect={handleSelect}
            onRetry={handleRefresh}
          />
        )}
      </div>

      <SignalsMobileFab visible={canInteract} onClick={handleCreateClick} listTab={tab === "list"} />

      <SignalsMobileFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        totalCount={dataset?.length ?? 0}
        filteredCount={signals.length}
        isAdmin={isAdmin}
        adminQuickMode={adminQuickMode}
        onAdminQuickModeChange={setAdminQuickMode}
        dataset={dataset}
      />

      <SignalsMobileInfoSheet open={infoOpen} onOpenChange={setInfoOpen} />

      <SignalDetailModal
        id={openId}
        onClose={close}
        navigation={{ ids: signalIds, onNavigate: handleNavigate }}
        dataset={dataset}
        onCenterOnMap={(id) => {
          setFocusSignalId(id);
          setTab("map");
        }}
        reportSlot={reportSlot}
        commentsSlot={commentsSlot}
      />

      <CreateSignalModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} dataset={dataset} />
    </div>
  );
}
