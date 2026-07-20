"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stompClient } from "@/lib/realtime/stompClient";
import { messengerApi } from "../api";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { setUnreadTotal } from "../lib/cacheUpdates";
import type { Conversation } from "../types";

/** Marks the open conversation read (WS preferred, REST fallback) and clears local unread. */
export function useMarkConversationRead(conversationId: number | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (conversationId == null) return;

    const list = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
    const conv = list?.find((c) => c.id === conversationId);
    const unread = conv?.unreadCount ?? 0;

    if (stompClient.connected) {
      stompClient.publish("/app/svmessenger/mark-read", { conversationId });
    } else {
      void messengerApi.markConversationRead(conversationId).catch(() => {
        /* best-effort */
      });
    }

    if (unread > 0) {
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old) =>
        old ? old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)) : old,
      );
      const total = list?.reduce((sum, c) => sum + (c.id === conversationId ? 0 : c.unreadCount ?? 0), 0) ?? 0;
      setUnreadTotal(queryClient, total);
    }
  }, [conversationId, queryClient]);
}
