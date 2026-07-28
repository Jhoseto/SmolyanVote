"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { messengerApi } from "../api";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import type { ParticipantRole } from "../types";

function useConversationsRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
}

export function useCreateGroup() {
  const refresh = useConversationsRefresh();
  const toast = useToast();
  const openChat = useMessengerUiStore((s) => s.openChat);

  return useMutation({
    mutationFn: ({
      title,
      memberIds,
      imageUrl,
    }: {
      title: string;
      memberIds: number[];
      imageUrl?: string | null;
    }) => messengerApi.createGroup(title, memberIds, imageUrl),
    onSuccess: async (conversation) => {
      await refresh();
      openChat(conversation.id);
      toast.success("Групата е създадена.");
    },
    onError: (error: Error) => toast.error(error.message || "Групата не беше създадена."),
  });
}

export function useUpdateGroup() {
  const refresh = useConversationsRefresh();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      conversationId,
      title,
      imageUrl,
    }: {
      conversationId: number;
      title?: string;
      imageUrl?: string | null;
    }) => messengerApi.updateGroup(conversationId, { title, imageUrl }),
    onSuccess: async () => {
      await refresh();
      toast.success("Групата е обновена.");
    },
    onError: (error: Error) => toast.error(error.message || "Промяната не беше запазена."),
  });
}

export function useAddGroupMembers() {
  const refresh = useConversationsRefresh();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ conversationId, memberIds }: { conversationId: number; memberIds: number[] }) =>
      messengerApi.addGroupMembers(conversationId, memberIds),
    onSuccess: async () => {
      await refresh();
      toast.success("Участниците са добавени.");
    },
    onError: (error: Error) => toast.error(error.message || "Участниците не бяха добавени."),
  });
}

export function useRemoveGroupMember() {
  const refresh = useConversationsRefresh();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: number; userId: number }) =>
      messengerApi.removeGroupMember(conversationId, userId),
    onSuccess: async () => {
      await refresh();
      toast.success("Участникът е премахнат.");
    },
    onError: (error: Error) => toast.error(error.message || "Участникът не беше премахнат."),
  });
}

export function useSetGroupRole() {
  const refresh = useConversationsRefresh();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      conversationId,
      userId,
      role,
    }: {
      conversationId: number;
      userId: number;
      role: ParticipantRole;
    }) => messengerApi.setGroupRole(conversationId, userId, role),
    onSuccess: async () => {
      await refresh();
      toast.success("Ролята е променена.");
    },
    onError: (error: Error) => toast.error(error.message || "Ролята не беше променена."),
  });
}

export function useLeaveGroup() {
  const refresh = useConversationsRefresh();
  const toast = useToast();
  const closeChat = useMessengerUiStore((s) => s.closeChat);

  return useMutation({
    mutationFn: (conversationId: number) => messengerApi.leaveGroup(conversationId),
    onSuccess: async (_data, conversationId) => {
      closeChat(conversationId);
      await refresh();
      toast.success("Напуснахте групата.");
    },
    onError: (error: Error) => toast.error(error.message || "Напускането не успя."),
  });
}
