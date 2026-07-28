"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { stompClient } from "@/lib/realtime/stompClient";
import { useAuth } from "@/shared/lib/authContext";
import { messengerApi } from "../api";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { dispatchCallSignal } from "./useCallController";
import { messengerSounds, notifyBrowser } from "../lib/sounds";
import {
  applyDeliveryReceipt,
  applyReadReceipt,
  bumpUnreadTotal,
  patchConversationPreview,
  patchMessage,
  upsertMessage,
} from "../lib/cacheUpdates";
import { isE2ECiphertext } from "../lib/e2eCrypto";
import type {
  CallSignal,
  Conversation,
  DeliveryReceipt,
  Message,
  OnlineStatusEvent,
  Poll,
  ReactionSummary,
  ReadReceipt,
  TypingStatus,
} from "../types";

function parseJson<T>(frame: IMessage): T | null {
  try {
    return JSON.parse(frame.body) as T;
  } catch {
    return null;
  }
}

function isChatFocused(conversationId: number): boolean {
  const state = useMessengerUiStore.getState();
  const chat = state.activeChats.find((c) => c.conversationId === conversationId);
  return !!chat && !chat.isMinimized;
}

/**
 * Connects STOMP when authenticated, subscribes to messenger queues/topics
 * (messages, receipts, online, typing, call-signals), patches TanStack Query.
 */
export function useMessengerRealtime(): void {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const setTyping = useMessengerUiStore((s) => s.setTyping);
  const setOnline = useMessengerUiStore((s) => s.setOnline);
  const focusedConversationId = useMessengerUiStore((s) => s.focusedConversationId);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      stompClient.disconnect();
      return;
    }

    const currentUserId = user.id;
    const subs: StompSubscription[] = [];

    function clearSubs() {
      subs.splice(0).forEach((s) => s.unsubscribe());
    }

    function subscribeAll() {
      clearSubs();

      const msgSub = stompClient.subscribe("/user/queue/svmessenger-messages", (frame) => {
        const raw = parseJson<
          Message & {
            type?: string;
            conversationId?: number;
            messageId?: number;
            reactions?: ReactionSummary[];
            poll?: Poll;
          }
        >(frame);
        if (!raw) return;

        if (raw.type === "POLL_UPDATED" && raw.conversationId && raw.messageId) {
          patchMessage(queryClient, raw.conversationId, raw.messageId, { poll: raw.poll ?? null });
          return;
        }

        if (raw.type === "REACTION_UPDATED" && raw.conversationId && raw.messageId) {
          patchMessage(queryClient, raw.conversationId, raw.messageId, {
            reactions: raw.reactions ?? [],
          });
          return;
        }

        if (raw.type === "CALL_HISTORY_UPDATED" && raw.conversationId) {
          void queryClient.invalidateQueries({
            queryKey: ["messenger", "call-history", raw.conversationId],
          });
          return;
        }

        const message = raw as Message;
        if (!message.id || !message.conversationId) return;

        upsertMessage(queryClient, message);

        const focused = isChatFocused(message.conversationId);
        const isOwn = message.senderId === currentUserId;
        const list = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);

        if (!list?.some((c) => c.id === message.conversationId)) {
          void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
        } else if (!isOwn && !focused) {
          bumpUnreadTotal(queryClient, 1);
          const preview = isE2ECiphertext(message.text)
            ? "🔒 Криптирано съобщение"
            : message.text;
          queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old) => {
            if (!old) return old;
            return old
              .map((c) =>
                c.id === message.conversationId
                  ? {
                      ...c,
                      unreadCount: (c.unreadCount ?? 0) + 1,
                      lastMessage: preview,
                      lastMessageTime: message.sentAt,
                    }
                  : c,
              )
              .sort((a, b) => {
                const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                return tb - ta;
              });
          });
          const muted = list.find((c) => c.id === message.conversationId)?.isMuted ?? false;
          if (!muted) {
            messengerSounds.playMessage();
            notifyBrowser(message.senderUsername, preview, `msg-${message.conversationId}`);
            useMessengerUiStore.getState().setQuickReply({
              conversationId: message.conversationId,
              senderName: message.senderUsername,
              senderAvatar: message.senderImageUrl,
              text: preview,
              receivedAt: Date.now(),
            });
          }
        } else {
          const preview = isE2ECiphertext(message.text)
            ? "🔒 Криптирано съобщение"
            : message.text;
          patchConversationPreview(queryClient, message.conversationId, {
            lastMessage: preview,
            lastMessageTime: message.sentAt,
            unreadCount: 0,
          });
        }

        if (!isOwn && focused) {
          stompClient.publish("/app/svmessenger/mark-read", { conversationId: message.conversationId });
        }
      });
      if (msgSub) subs.push(msgSub);

      const readSub = stompClient.subscribe("/user/queue/svmessenger-read-receipts", (frame) => {
        const receipt = parseJson<ReadReceipt>(frame);
        if (!receipt?.conversationId) return;
        applyReadReceipt(queryClient, receipt.conversationId, receipt.messageId, receipt.readAt);
      });
      if (readSub) subs.push(readSub);

      const deliverySub = stompClient.subscribe("/user/queue/svmessenger-delivery-receipts", (frame) => {
        const receipt = parseJson<DeliveryReceipt>(frame);
        if (!receipt) return;
        if (receipt.type === "BULK_DELIVERY" && receipt.conversationIds) {
          for (const cid of receipt.conversationIds) {
            applyDeliveryReceipt(queryClient, cid, undefined, receipt.deliveredAt);
          }
          return;
        }
        if (receipt.conversationId != null) {
          applyDeliveryReceipt(queryClient, receipt.conversationId, receipt.messageId, receipt.deliveredAt);
        }
      });
      if (deliverySub) subs.push(deliverySub);

      const onlineSub = stompClient.subscribe("/topic/svmessenger-online-status", (frame) => {
        const event = parseJson<OnlineStatusEvent>(frame);
        if (!event?.userId) return;
        setOnline(event.userId, !!event.isOnline);
        queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old) => {
          if (!old) return old;
          return old.map((c) =>
            c.otherUser?.id === event.userId
              ? { ...c, otherUser: { ...c.otherUser, isOnline: !!event.isOnline } }
              : c,
          );
        });
      });
      if (onlineSub) subs.push(onlineSub);

      const callSub = stompClient.subscribe("/user/queue/svmessenger-call-signals", (frame) => {
        const signal = parseJson<CallSignal>(frame);
        if (!signal?.eventType) return;
        dispatchCallSignal(signal);
      });
      if (callSub) subs.push(callSub);

      void messengerApi.markDelivered().catch(() => {
        /* best-effort */
      });
    }

    const unsubConnect = stompClient.onConnect(subscribeAll);
    stompClient.connect();
    if (stompClient.connected) subscribeAll();

    return () => {
      unsubConnect();
      clearSubs();
      stompClient.disconnect();
    };
  }, [isAuthenticated, user, queryClient, setOnline]);

  // Typing for focused conversation + all open non-minimized chats
  useEffect(() => {
    if (!isAuthenticated || !stompClient.connected) return;

    const openIds = useMessengerUiStore
      .getState()
      .activeChats.filter((c) => !c.isMinimized)
      .map((c) => c.conversationId);
    if (focusedConversationId != null && !openIds.includes(focusedConversationId)) {
      openIds.push(focusedConversationId);
    }
    if (openIds.length === 0) return;

    const subs = openIds
      .map((id) =>
        stompClient.subscribe(`/topic/svmessenger-typing/${id}`, (frame) => {
          const status = parseJson<TypingStatus>(frame);
          if (!status || status.userId === user?.id) return;
          setTyping(status.conversationId, !!status.isTyping);
        }),
      )
      .filter(Boolean) as StompSubscription[];

    return () => subs.forEach((s) => s.unsubscribe());
  }, [isAuthenticated, focusedConversationId, user?.id, setTyping]);
}
