"use client";

import { SignalsMapPage } from "@/features/signals";
import { ReportButton } from "@/features/reports";
import { CommentsSection } from "@/features/comments";

/** Composes cross-feature per-signal actions (features never import features — MODERN_FRONTEND_PLAN §Frontend architecture rules). */
export function SignalsPageClient() {
  return (
    <SignalsMapPage
      reportSlot={(signalId) => <ReportButton entityType="SIGNAL" entityId={signalId} />}
      commentsSlot={(id) => <CommentsSection entityType="signal" entityId={id} />}
    />
  );
}
