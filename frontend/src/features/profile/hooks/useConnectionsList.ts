"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api";
import type { ConnectionsKind } from "../types";

const PAGE_SIZE = 20;

/** Followers/following tab — offset pagination + debounced-by-caller search, mirrors legacy `followSystem.js`. */
export function useConnectionsList(username: string, kind: ConnectionsKind, search: string) {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", username, kind, page, search],
    queryFn: () => profileApi.connections(username, kind, page, PAGE_SIZE, search || undefined),
    staleTime: 15_000,
  });

  function goToPage(next: number) {
    setPage(Math.max(0, next));
  }

  function resetPage() {
    setPage(0);
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", username, kind] });
  }

  return { ...query, page, goToPage, resetPage, invalidate };
}
