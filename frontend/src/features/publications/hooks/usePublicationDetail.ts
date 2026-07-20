"use client";

import { useQuery } from "@tanstack/react-query";
import { publicationsApi } from "../api";

export function publicationDetailQueryKey(id: number) {
  return ["publications", "detail", id] as const;
}

/** `id === null` → disabled (modal closed, nothing fetched). */
export function usePublicationDetail(id: number | null) {
  return useQuery({
    queryKey: publicationDetailQueryKey(id ?? -1),
    queryFn: () => publicationsApi.detail(id as number),
    enabled: id != null,
  });
}
