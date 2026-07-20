"use client";

import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "../api";

export function referendumDetailQueryKey(id: number) {
  return ["events", "referendum-detail", id] as const;
}

export function useReferendumDetail(id: number) {
  return useQuery({
    queryKey: referendumDetailQueryKey(id),
    queryFn: () => eventsApi.referendumDetail(id),
  });
}
