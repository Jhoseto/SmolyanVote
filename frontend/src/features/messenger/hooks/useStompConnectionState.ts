"use client";

import { useEffect, useState } from "react";
import { stompClient, type ConnectionState } from "@/lib/realtime/stompClient";

export function useStompConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(() => stompClient.state);

  useEffect(() => stompClient.onStateChange(setState), []);

  return state;
}
