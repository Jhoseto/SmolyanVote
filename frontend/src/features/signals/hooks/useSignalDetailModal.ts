"use client";

import { parseAsInteger, useQueryState } from "nuqs";

/** `?openSignal={id}` deep-link (MODERN_FRONTEND_PLAN.md §Auto-open) — mirrors `usePublicationDetailModal`. */
export function useSignalDetailModal() {
  const [openId, setOpenId] = useQueryState("openSignal", parseAsInteger);
  return {
    openId,
    open: (id: number) => void setOpenId(id),
    close: () => void setOpenId(null),
  };
}
