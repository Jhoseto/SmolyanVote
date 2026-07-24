"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { notificationsApi } from "../api";
import type { NotificationDto, NotificationPage } from "../types";

const RECENT_KEY = ["notifications", "recent"] as const;
const UNREAD_KEY = ["notifications", "unread-count"] as const;

/** Optimistically decrements the unread badge — rollback handled by refetch on error. */
function decrementUnread(queryClient: ReturnType<typeof useQueryClient>, by: number) {
  queryClient.setQueryData<{ count: number }>(UNREAD_KEY, (prev) =>
    prev ? { count: Math.max(0, prev.count - by) } : prev,
  );
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<NotificationDto[]>(RECENT_KEY);
      const wasUnread = previous?.find((n) => n.id === id)?.read === false;

      queryClient.setQueryData<NotificationDto[]>(RECENT_KEY, (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      if (wasUnread) decrementUnread(queryClient, 1);

      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(RECENT_KEY, context.previous);
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      toast.error(errorMessage(err, "Известието не бе маркирано като прочетено."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      const previous = queryClient.getQueryData<NotificationDto[]>(RECENT_KEY);
      queryClient.setQueryData<NotificationDto[]>(RECENT_KEY, (prev) =>
        prev?.map((n) => ({ ...n, read: true })),
      );
      queryClient.setQueryData(UNREAD_KEY, { count: 0 });
      return { previous };
    },
    onSuccess: () => {
      toast.success("Всички известия са маркирани като прочетени.");
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(RECENT_KEY, context.previous);
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      toast.error(errorMessage(err, "Маркирането не бе успешно."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.remove(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<NotificationDto[]>(RECENT_KEY);
      const removed = previous?.find((n) => n.id === id);

      queryClient.setQueryData<NotificationDto[]>(RECENT_KEY, (prev) =>
        prev?.filter((n) => n.id !== id),
      );
      queryClient.setQueryData<NotificationPage>(["notifications", "list"], (prev) =>
        prev
          ? { ...prev, content: prev.content.filter((n) => n.id !== id) }
          : prev,
      );
      if (removed && !removed.read) decrementUnread(queryClient, 1);

      return { previous };
    },
    onSuccess: () => {
      toast.success("Известието е изтрито.");
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(RECENT_KEY, context.previous);
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      toast.error(errorMessage(err, "Известието не бе изтрито."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
