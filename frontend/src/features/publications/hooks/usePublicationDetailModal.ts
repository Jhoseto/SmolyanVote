"use client";

import { parseAsInteger, useQueryState } from "nuqs";

/**
 * `?openModal={id}` deep-link (mirrors legacy `redirect:/publications?openModal=` +
 * `filtersManager.js`). Independent nuqs key from `usePublicationsFilters` — filter
 * changes never touch/clear it (MODERN_FRONTEND_PLAN §Filters sidebar "пази `openModal`").
 */
export function usePublicationDetailModal() {
  const [openId, setOpenId] = useQueryState("openModal", parseAsInteger);
  return {
    openId,
    open: (id: number) => void setOpenId(id),
    close: () => void setOpenId(null),
  };
}
