"use client";

import { useEffect, useRef } from "react";
import { stompClient } from "@/lib/realtime/stompClient";
import { messengerApi } from "../api";

const STOP_MS = 2000;

/** Publishes typing=true while the user types; auto-stops after idle. */
export function useTypingIndicator(conversationId: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef = useRef(false);

  function publish(isTyping: boolean) {
    if (stompClient.connected) {
      stompClient.publish("/app/svmessenger/typing", { conversationId, isTyping });
    } else {
      void messengerApi.typing(conversationId, isTyping).catch(() => {
        /* best-effort */
      });
    }
  }

  function onInputActivity() {
    if (!typingRef.current) {
      typingRef.current = true;
      publish(true);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      typingRef.current = false;
      publish(false);
    }, STOP_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typingRef.current) publish(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount / conversation change
  }, [conversationId]);

  return { onInputActivity };
}
