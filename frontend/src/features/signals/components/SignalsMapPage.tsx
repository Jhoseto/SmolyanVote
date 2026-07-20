"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button, Container, Skeleton } from "@/shared/ui";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useSignalsFilters } from "../hooks/useSignalsFilters";
import { useSignalsList } from "../hooks/useSignalsList";
import { useSignalDetailModal } from "../hooks/useSignalDetailModal";
import { SignalsFilters } from "./SignalsFilters";
import { SignalsListPanel } from "./SignalsListPanel";
import { SignalDetailModal } from "./SignalDetailModal";
import { CreateSignalModal } from "./CreateSignalModal";

const SignalsMap = dynamic(
  () => import("./SignalsMap").then((m) => m.SignalsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[560px] w-full rounded-[var(--radius-lg)]" />,
  },
);

interface SignalsMapPageProps {
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

/**
 * MODERN_FRONTEND_PLAN.md Фаза 5 top-level layout. Съзнателно опростяване:
 * карта + списък се stack-ват вертикално на мобилно (както `PublicationsFeedPage`
 * прави с feed+sidebar), а не таб-суич — планът не изисква изричен mobile taб за
 * списъка, само mobile picker при създаване (виж `LocationPickerMap`).
 */
export function SignalsMapPage({ reportSlot, commentsSlot }: SignalsMapPageProps) {
  const [filters] = useSignalsFilters();
  const listParams = {
    search: filters.search || undefined,
    category: filters.category ?? undefined,
    showExpired: filters.showExpired,
    sort: filters.sort,
  };
  const { data: signals, isPending, isError, refetch } = useSignalsList(listParams);
  const { openId, open, close } = useSignalDetailModal();
  const requireAuth = useRequireAuth();

  const [focusSignalId, setFocusSignalId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreateClick() {
    if (!(await requireAuth("да подадеш сигнал"))) return;
    setCreateOpen(true);
  }

  return (
    <Container className="flex flex-col gap-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[color:var(--color-text-heading)]">Граждански сигнали</h1>
          <p className="text-sm text-[color:var(--color-text-muted)]">Карта на активните сигнали в област Смолян.</p>
        </div>
        <Button onClick={handleCreateClick}>
          <i className="bi bi-megaphone" />
          Подай сигнал
        </Button>
      </div>

      <SignalsFilters />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SignalsMap
          signals={signals ?? []}
          onMarkerClick={open}
          focusSignalId={focusSignalId}
          className="h-[560px] overflow-hidden rounded-[var(--radius-lg)]"
        />
        <SignalsListPanel
          signals={signals ?? []}
          isPending={isPending}
          isError={isError}
          onRetry={() => refetch()}
          onSelect={open}
          selectedId={openId}
          className="h-[560px]"
        />
      </div>

      <SignalDetailModal
        id={openId}
        onClose={close}
        onCenterOnMap={(id) => setFocusSignalId(id)}
        reportSlot={reportSlot}
        commentsSlot={commentsSlot}
      />

      <CreateSignalModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Container>
  );
}
