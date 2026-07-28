"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { messengerApi } from "../api";
import { patchMessage } from "../lib/cacheUpdates";
import type { Message, ReactionSummary } from "../types";

export const PINNED_QUERY_KEY = (conversationId: number) =>
  ["messenger", "pinned", conversationId] as const;
export const STARRED_QUERY_KEY = ["messenger", "starred"] as const;

/** Toggling is idempotent server-side, so the optimistic flip is safe to keep on error retry. */
export function useToggleReaction(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      messengerApi.toggleReaction(messageId, emoji),

    onMutate: ({ messageId, emoji }) => {
      const current =
        queryClient
          .getQueryData<{ pages: { content: Message[] }[] }>(["messenger", "messages", conversationId])
          ?.pages.flatMap((p) => p.content)
          .find((m) => m.id === messageId)?.reactions ?? [];

      const existing = current.find((r) => r.emoji === emoji);
      let next: ReactionSummary[];
      if (!existing) {
        next = [...current, { emoji, count: 1, usernames: [], reactedByMe: true }];
      } else if (existing.reactedByMe) {
        next = current
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r))
          .filter((r) => r.count > 0);
      } else {
        next = current.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r,
        );
      }

      patchMessage(queryClient, conversationId, messageId, { reactions: next });
      return { previous: current };
    },

    onSuccess: (reactions, { messageId }) => {
      patchMessage(queryClient, conversationId, messageId, { reactions });
    },

    onError: (_error, { messageId }, context) => {
      if (context) patchMessage(queryClient, conversationId, messageId, { reactions: context.previous });
    },
  });
}

export function useTogglePin(conversationId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (messageId: number) => messengerApi.togglePin(messageId),
    onSuccess: ({ active }, messageId) => {
      patchMessage(queryClient, conversationId, messageId, { isPinned: active });
      void queryClient.invalidateQueries({ queryKey: PINNED_QUERY_KEY(conversationId) });
      toast.success(active ? "Съобщението е закачено." : "Съобщението е откачено.");
    },
    onError: () => toast.error("Действието не успя."),
  });
}

export function useToggleStar(conversationId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (messageId: number) => messengerApi.toggleStar(messageId),
    onSuccess: ({ active }, messageId) => {
      patchMessage(queryClient, conversationId, messageId, { isStarred: active });
      void queryClient.invalidateQueries({ queryKey: STARRED_QUERY_KEY });
      toast.success(active ? "Запазено." : "Премахнато от запазените.");
    },
    onError: () => toast.error("Действието не успя."),
  });
}

export function useForwardMessage() {
  const toast = useToast();

  return useMutation({
    mutationFn: ({ messageId, conversationId }: { messageId: number; conversationId: number }) =>
      messengerApi.forwardMessage(messageId, conversationId),
    onSuccess: () => toast.success("Съобщението е препратено."),
    onError: () => toast.error("Препращането не успя."),
  });
}

export function usePinnedMessages(conversationId: number, enabled = true) {
  return useQuery({
    queryKey: PINNED_QUERY_KEY(conversationId),
    queryFn: () => messengerApi.pinnedMessages(conversationId),
    enabled,
    staleTime: 60_000,
  });
}
