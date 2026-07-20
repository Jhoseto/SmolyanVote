"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api";

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", "catalog"] });
    },
  });
}
