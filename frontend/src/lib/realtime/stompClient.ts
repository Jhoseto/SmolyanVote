import {
  Client,
  type IMessage,
  type IStompSocket,
  type StompSubscription,
} from "@stomp/stompjs";
import { resolveNativeWsUrl } from "@/config/env";
import { tokenStore } from "@/lib/api/tokenStore";

/**
 * STOMP-over-native-WebSocket client for `/ws-svmessenger/ws/**` (chat, typing, receipts).
 * Vote writes NEVER go through here — always REST (MODERN_FRONTEND_PLAN Tier 3).
 *
 * Resilience ladder (Фаза 10): native WebSocket → STOMP reconnect with
 * exponential backoff → consumers poll REST while disconnected.
 */

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

const STOMP_WS_PATH = "/ws-svmessenger/ws";
const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30_000;

let client: Client | null = null;
let reconnectAttempt = 0;
const stateListeners = new Set<(s: ConnectionState) => void>();
const connectListeners = new Set<() => void>();
let currentState: ConnectionState = "disconnected";

function emitState(state: ConnectionState): void {
  currentState = state;
  stateListeners.forEach((fn) => fn(state));
}

function nextReconnectDelay(): number {
  const delay = Math.min(BASE_RECONNECT_MS * 2 ** reconnectAttempt, MAX_RECONNECT_MS);
  reconnectAttempt += 1;
  return delay;
}

function createClient(): Client {
  const instance = new Client({
    webSocketFactory: () => new WebSocket(resolveNativeWsUrl(STOMP_WS_PATH)) as IStompSocket,
    beforeConnect: (c) => {
      const headers: Record<string, string> = {};
      const access = tokenStore.getAccess();
      if (access) headers.Authorization = `Bearer ${access}`;
      c.connectHeaders = headers;
    },
    reconnectDelay: BASE_RECONNECT_MS,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      reconnectAttempt = 0;
      if (client) client.reconnectDelay = BASE_RECONNECT_MS;
      emitState("connected");
      connectListeners.forEach((fn) => fn());
    },
    onWebSocketClose: () => {
      if (client) client.reconnectDelay = nextReconnectDelay();
      emitState("reconnecting");
    },
    onStompError: () => emitState("disconnected"),
  });
  return instance;
}

export const stompClient = {
  connect(): void {
    if (client?.active) return;
    client = createClient();
    emitState("connecting");
    client.activate();
  },

  disconnect(): void {
    void client?.deactivate();
    client = null;
    reconnectAttempt = 0;
    emitState("disconnected");
  },

  get connected(): boolean {
    return !!client?.connected;
  },

  get state(): ConnectionState {
    return currentState;
  },

  subscribe(destination: string, onMessage: (msg: IMessage) => void): StompSubscription | null {
    if (!client?.connected) return null;
    return client.subscribe(destination, onMessage);
  },

  publish(destination: string, body: unknown): void {
    if (!client?.connected) return;
    client.publish({ destination, body: JSON.stringify(body) });
  },

  onStateChange(listener: (s: ConnectionState) => void): () => void {
    stateListeners.add(listener);
    listener(currentState);
    return () => stateListeners.delete(listener);
  },

  onConnect(listener: () => void): () => void {
    connectListeners.add(listener);
    return () => connectListeners.delete(listener);
  },
};
