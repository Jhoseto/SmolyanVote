"use client";

import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "../api";

export function simpleEventDetailQueryKey(id: number) {
  return ["events", "simple-detail", id] as const;
}

export function useSimpleEventDetail(id: number) {
  return useQuery({
    queryKey: simpleEventDetailQueryKey(id),
    queryFn: () => eventsApi.simpleEventDetail(id),
  });
}
