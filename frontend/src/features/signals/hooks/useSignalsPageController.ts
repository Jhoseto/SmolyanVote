"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/shared/lib/authContext";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { useSignalsFilters } from "./useSignalsFilters";
import { useSignalsDataset } from "./useSignalsDataset";
import { useDerivedSignals } from "./useDerivedSignals";
import { useSignalDetailModal } from "./useSignalDetailModal";
import { useAdminQuickModerate } from "./useAdminQuickModerate";
import { useDeleteSignal } from "./useDeleteSignal";
import { hasSignalCreateDraft } from "../lib/signalCreateDraft";
import type { Signal } from "../types";

export function useSignalsPageController() {
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

  const activeCount = useMemo(
    () => (dataset ?? []).filter((s) => s.isActive && !s.isResolved).length,
    [dataset],
  );

  return {
    filters,
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
  };
}

export type SignalsPageController = ReturnType<typeof useSignalsPageController>;
