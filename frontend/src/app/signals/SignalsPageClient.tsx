"use client";

import { useQueryClient } from "@tanstack/react-query";
import { SignalsMapPage } from "@/features/signals";
import { SIGNALS_DATASET_QUERY_KEY } from "@/features/signals/api";
import { patchSignalCaches } from "@/features/signals/lib/signalsCache";
import type { Signal } from "@/features/signals/types";
import { ReportButton } from "@/features/reports";
import { CommentsSection } from "@/features/comments";

/** Composes cross-feature per-signal actions (features never import features — MODERN_FRONTEND_PLAN §Frontend architecture rules). */
export function SignalsPageClient() {
  const queryClient = useQueryClient();

  function handleCommentAdded(signalId: number) {
    const current = queryClient.getQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY)?.find((s) => s.id === signalId);
    if (current) {
      patchSignalCaches(queryClient, signalId, { commentsCount: current.commentsCount + 1 });
    }
  }

  return (
    <SignalsMapPage
      reportSlot={(signalId) => <ReportButton entityType="SIGNAL" entityId={signalId} />}
      commentsSlot={(id) => (
        <CommentsSection entityType="signal" entityId={id} onCommentAdded={() => handleCommentAdded(id)} />
      )}
    />
  );
}
