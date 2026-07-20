"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stompClient } from "@/lib/realtime/stompClient";
import { useAuth } from "@/shared/lib/authContext";
import { messengerApi } from "../api";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import { useCallStore, type CurrentCall } from "../store/callStore";
import { hasDeviceSettings } from "../lib/deviceSettings";
import { messengerSounds, notifyBrowser } from "../lib/sounds";
import type { CallSignal, Conversation } from "../types";

const CALL_CHANNEL = "svmessenger-call";

function buildCallWindowUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params);
  return `${window.location.origin}/call-window?${qs.toString()}`;
}

/**
 * Call FSM + popup + BroadcastChannel + STOMP signaling
 * (port of legacy `CallContext.jsx`, MODERN_FRONTEND_PLAN §Фаза 8d).
 */
export function useCallController() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const endCallRef = useRef<(fromPopupClose?: boolean) => void>(() => {});

  const callState = useCallStore((s) => s.callState);
  const currentCall = useCallStore((s) => s.currentCall);
  const showDeviceSelector = useCallStore((s) => s.showDeviceSelector);
  const deviceSelectorMode = useCallStore((s) => s.deviceSelectorMode);

  const clearPopupPoll = useCallback(() => {
    if (popupPollRef.current) {
      clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }, []);

  const resetCall = useCallback(() => {
    messengerSounds.stopAll();
    clearPopupPoll();
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    popupRef.current = null;
    useCallStore.getState().reset();
  }, [clearPopupPoll]);

  const publishSignal = useCallback((signal: Partial<CallSignal> & { eventType: CallSignal["eventType"] }) => {
    stompClient.publish("/app/svmessenger/call-signal", {
      ...signal,
      timestamp: signal.timestamp ?? new Date().toISOString(),
    });
  }, []);

  const openPopup = useCallback(
    (args: {
      token: string;
      roomName: string;
      conversationId: number;
      otherUserId: number;
      otherUserName: string;
      otherUserAvatar: string;
      callState: "outgoing" | "connected";
      isVideoCall: boolean;
      serverUrl: string;
    }) => {
      if (!user) return;
      const url = buildCallWindowUrl({
        token: args.token,
        roomName: args.roomName,
        serverUrl: args.serverUrl,
        conversationId: String(args.conversationId),
        otherUserId: String(args.otherUserId),
        otherUserName: args.otherUserName,
        otherUserAvatar: args.otherUserAvatar,
        currentUserId: String(user.id),
        currentUserName: user.username,
        currentUserAvatar: user.imageUrl ?? "",
        callType: args.isVideoCall ? "video" : "voice",
        callState: args.callState,
      });
      const popup = window.open(
        url,
        "svmessenger-call",
        "width=420,height=650,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no",
      );
      popupRef.current = popup;
      clearPopupPoll();
      if (popup) {
        popupPollRef.current = setInterval(() => {
          if (popup.closed) {
            clearPopupPoll();
            popupRef.current = null;
            const store = useCallStore.getState();
            if (store.callState !== "idle" && !store.endSignalSent) {
              endCallRef.current(true);
            }
          }
        }, 500);
      }
    },
    [user, clearPopupPoll],
  );

  const endCallInternal = useCallback(
    (fromPopupClose = false) => {
      const store = useCallStore.getState();
      const call = store.currentCall;
      if (!call || !user) {
        resetCall();
        return;
      }

      if (!store.endSignalSent) {
        useCallStore.getState().setEndSignalSent(true);
        const wasConnected = store.hasEverConnected || store.callState === "connected";
        const isRingingIncoming = call.isIncoming && store.callState === "incoming";
        publishSignal({
          eventType: isRingingIncoming
            ? "CALL_REJECT"
            : fromPopupClose && !wasConnected
              ? "CALL_CANCEL"
              : wasConnected
                ? "CALL_END"
                : "CALL_CANCEL",
          conversationId: call.conversationId,
          callerId: call.isIncoming ? call.otherUserId : user.id,
          receiverId: call.isIncoming ? user.id : call.otherUserId,
          roomName: call.roomName,
          startTime: call.startTime,
          endTime: new Date().toISOString(),
          isVideoCall: call.isVideoCall,
          wasConnected,
        });
      }

      channelRef.current?.postMessage({ type: "CLOSE_POPUP" });
      resetCall();
      void queryClient.invalidateQueries({
        queryKey: ["messenger", "call-history", call.conversationId],
      });
    },
    [user, publishSignal, resetCall, queryClient],
  );

  useEffect(() => {
    endCallRef.current = endCallInternal;
  }, [endCallInternal]);

  const proceedStart = useCallback(
    async (conversationId: number, otherUserId: number, conversation: Conversation, isVideoCall: boolean) => {
      if (!user) return;
      const tokenRes = await messengerApi.getCallToken(conversationId, otherUserId);
      const call: CurrentCall = {
        conversationId,
        otherUserId,
        roomName: tokenRes.roomName,
        conversation,
        startTime: new Date().toISOString(),
        isIncoming: false,
        isVideoCall,
        token: tokenRes.token,
        serverUrl: tokenRes.serverUrl,
        callerName: user.username,
        callerAvatar: user.imageUrl,
      };
      useCallStore.getState().setCurrentCall(call);
      useCallStore.getState().setCallState("outgoing");
      useCallStore.getState().setEndSignalSent(false);
      useCallStore.getState().setHasEverConnected(false);
      messengerSounds.startOutgoingLoop();

      openPopup({
        token: tokenRes.token,
        roomName: tokenRes.roomName,
        serverUrl: tokenRes.serverUrl,
        conversationId,
        otherUserId,
        otherUserName: conversation.otherUser.fullName || conversation.otherUser.username,
        otherUserAvatar: conversation.otherUser.imageUrl ?? "",
        callState: "outgoing",
        isVideoCall,
      });

      publishSignal({
        eventType: "CALL_REQUEST",
        conversationId,
        callerId: user.id,
        receiverId: otherUserId,
        roomName: tokenRes.roomName,
        callerName: user.username,
        callerAvatar: user.imageUrl,
        isVideoCall,
      });
    },
    [user, openPopup, publishSignal],
  );

  const startCall = useCallback(
    async (conversationId: number, isVideoCall = false) => {
      const list = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
      const conversation = list?.find((c) => c.id === conversationId);
      if (!conversation || !user) return;

      if (useCallStore.getState().callState !== "idle") return;

      if (!hasDeviceSettings()) {
        useCallStore.getState().setPendingAction(() => {
          void proceedStart(conversationId, conversation.otherUser.id, conversation, isVideoCall);
        });
        useCallStore.getState().setShowDeviceSelector(true, "call");
        return;
      }
      await proceedStart(conversationId, conversation.otherUser.id, conversation, isVideoCall);
    },
    [queryClient, user, proceedStart],
  );

  const proceedAccept = useCallback(async () => {
    const store = useCallStore.getState();
    const call = store.currentCall;
    if (!call || !user) return;

    messengerSounds.stopIncomingLoop();
    const tokenRes = await messengerApi.getCallToken(call.conversationId, call.otherUserId);
    const roomName = call.roomName || tokenRes.roomName;

    publishSignal({
      eventType: "CALL_ACCEPT",
      conversationId: call.conversationId,
      callerId: call.otherUserId,
      receiverId: user.id,
      roomName,
    });

    useCallStore.getState().patchCurrentCall({
      token: tokenRes.token,
      serverUrl: tokenRes.serverUrl,
      roomName,
    });
    useCallStore.getState().setCallState("connected");
    useCallStore.getState().setHasEverConnected(true);
    useCallStore.getState().setEndSignalSent(false);

    openPopup({
      token: tokenRes.token,
      roomName,
      serverUrl: tokenRes.serverUrl,
      conversationId: call.conversationId,
      otherUserId: call.otherUserId,
      otherUserName:
        call.conversation?.otherUser.fullName ||
        call.conversation?.otherUser.username ||
        call.callerName ||
        "Потребител",
      otherUserAvatar: call.conversation?.otherUser.imageUrl ?? call.callerAvatar ?? "",
      callState: "connected",
      isVideoCall: call.isVideoCall,
    });
  }, [user, openPopup, publishSignal]);

  const acceptCall = useCallback(async () => {
    if (!hasDeviceSettings()) {
      useCallStore.getState().setPendingAction(() => {
        void proceedAccept();
      });
      useCallStore.getState().setShowDeviceSelector(true, "call");
      return;
    }
    await proceedAccept();
  }, [proceedAccept]);

  const rejectCall = useCallback(() => {
    const call = useCallStore.getState().currentCall;
    if (!call || !user) {
      resetCall();
      return;
    }
    publishSignal({
      eventType: "CALL_REJECT",
      conversationId: call.conversationId,
      callerId: call.otherUserId,
      receiverId: user.id,
      roomName: call.roomName,
    });
    useCallStore.getState().setEndSignalSent(true);
    resetCall();
  }, [user, publishSignal, resetCall]);

  const endCall = useCallback(() => endCallInternal(false), [endCallInternal]);

  const onDeviceSelectorComplete = useCallback(() => {
    useCallStore.getState().setShowDeviceSelector(false);
    const action = useCallStore.getState().pendingAction;
    useCallStore.getState().setPendingAction(null);
    action?.();
  }, []);

  const onDeviceSelectorCancel = useCallback(() => {
    useCallStore.getState().setShowDeviceSelector(false);
    useCallStore.getState().setPendingAction(null);
  }, []);

  // BroadcastChannel parent↔popup
  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CALL_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (ev: MessageEvent<{ type: string }>) => {
      const type = ev.data?.type;
      if (type === "CALL_ENDED_FROM_POPUP" || type === "CALL_ENDED") {
        useCallStore.getState().setEndSignalSent(true);
        useCallStore.getState().setHasEverConnected(true);
        resetCall();
      } else if (type === "CALL_ACCEPTED" || type === "CALL_START_TIME") {
        useCallStore.getState().setCallState("connected");
        useCallStore.getState().setHasEverConnected(true);
        messengerSounds.stopOutgoingLoop();
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [resetCall]);

  // Handle incoming STOMP call signals (subscribed from useMessengerRealtime via callback store)
  const handleIncomingSignal = useCallback(
    (signal: CallSignal) => {
      if (!user) return;
      const store = useCallStore.getState();

      switch (signal.eventType) {
        case "CALL_REQUEST": {
          if (signal.receiverId !== user.id) return;
          if (store.callState !== "idle") {
            publishSignal({
              eventType: "CALL_BUSY",
              conversationId: signal.conversationId,
              callerId: signal.callerId,
              receiverId: user.id,
              roomName: signal.roomName,
            });
            return;
          }
          const list = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
          const conversation = list?.find((c) => c.id === signal.conversationId) ?? null;
          useCallStore.getState().setCurrentCall({
            conversationId: signal.conversationId,
            otherUserId: signal.callerId,
            roomName: signal.roomName ?? "",
            conversation,
            startTime: new Date().toISOString(),
            isIncoming: true,
            isVideoCall: !!signal.isVideoCall,
            token: null,
            serverUrl: null,
            callerName: signal.callerName,
            callerAvatar: signal.callerAvatar,
          });
          useCallStore.getState().setCallState("incoming");
          useCallStore.getState().setEndSignalSent(false);
          useCallStore.getState().setHasEverConnected(false);
          messengerSounds.startIncomingLoop();
          notifyBrowser(
            "Входящо обаждане",
            signal.callerName || "Потребител",
            `call-${signal.conversationId}`,
          );
          break;
        }
        case "CALL_ACCEPT": {
          if (store.callState === "outgoing") {
            useCallStore.getState().setCallState("connected");
            useCallStore.getState().setHasEverConnected(true);
            messengerSounds.stopOutgoingLoop();
            channelRef.current?.postMessage({ type: "CALL_ACCEPTED" });
          }
          break;
        }
        case "CALL_REJECT":
        case "CALL_REJECTED":
        case "CALL_BUSY":
        case "CALL_CANCEL":
        case "CALL_MISSED":
        case "CALL_END":
        case "CALL_ENDED": {
          useCallStore.getState().setEndSignalSent(true);
          channelRef.current?.postMessage({ type: "CALL_ENDED" });
          resetCall();
          if (signal.conversationId) {
            void queryClient.invalidateQueries({
              queryKey: ["messenger", "call-history", signal.conversationId],
            });
          }
          break;
        }
        default:
          break;
      }
    },
    [user, publishSignal, queryClient, resetCall],
  );

  return {
    callState,
    currentCall,
    showDeviceSelector,
    deviceSelectorMode,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    onDeviceSelectorComplete,
    onDeviceSelectorCancel,
    handleIncomingSignal,
    openDeviceSettings: () => useCallStore.getState().setShowDeviceSelector(true, "settings"),
  };
}

/** Module singleton so realtime hook can forward signals without React tree coupling. */
let signalHandler: ((signal: CallSignal) => void) | null = null;

export function setCallSignalHandler(fn: ((signal: CallSignal) => void) | null): void {
  signalHandler = fn;
}

export function dispatchCallSignal(signal: CallSignal): void {
  signalHandler?.(signal);
}
