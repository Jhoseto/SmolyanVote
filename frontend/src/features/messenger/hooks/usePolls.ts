"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { messengerApi } from "../api";
import { patchMessage, upsertMessage } from "../lib/cacheUpdates";

export function useCreatePoll(conversationId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ question, options }: { question: string; options: string[] }) =>
      messengerApi.createPoll(conversationId, question, options),
    onSuccess: (message) => upsertMessage(queryClient, message),
    onError: () => toast.error("Анкетата не беше създадена."),
  });
}

export function useVotePoll(conversationId: number, messageId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (optionId: number) => messengerApi.votePoll(optionId),
    onSuccess: (poll) => patchMessage(queryClient, conversationId, messageId, { poll }),
    onError: () => toast.error("Гласуването не успя."),
  });
}
