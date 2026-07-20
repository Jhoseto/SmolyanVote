"use client";

import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "../api";

export function multiPollDetailQueryKey(id: number) {
  return ["events", "multipoll-detail", id] as const;
}

export function useMultiPollDetail(id: number) {
  return useQuery({
    queryKey: multiPollDetailQueryKey(id),
    queryFn: () => eventsApi.multiPollDetail(id),
  });
}
