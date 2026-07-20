import SockJS from "sockjs-client";
import { resolveWsUrl } from "@/config/env";
import { tokenStore } from "@/lib/api/tokenStore";
import type { NotificationDto } from "../types";

/**
 * Raw SockJS client for `/ws/notifications` (plain JSON frames, NOT STOMP —
 * unlike `stompClient.ts` which talks to `/ws-svmessenger`). Exponential
 * backoff reconnect; after `MAX_ATTEMPTS_BEFORE_POLL_FALLBACK` failed
 * attempts the status flips to `"failed"` so `useUnreadCount` can fall back
 * to REST polling (MODERN_FRONTEND_PLAN §Фаза 1 notifications).
 */
export type SocketStatus = "idle" | "connecting" | "open" | "reconnecting" | "failed";

type MessageListener = (notification: NotificationDto) => void;
type StatusListener = (status: SocketStatus) => void;

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
const MAX_ATTEMPTS_BEFORE_POLL_FALLBACK = 5;

let socket: WebSocket | null = null;
let status: SocketStatus = "idle";
let attempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyDisconnected = true;

const messageListeners = new Set<MessageListener>();
const statusListeners = new Set<StatusListener>();

function setStatus(next: SocketStatus): void {
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

function buildUrl(): string {
  const base = resolveWsUrl("/ws/notifications");
  const token = tokenStore.getAccess();
  return token ? `${base}?access_token=${encodeURIComponent(token)}` : base;
}

function scheduleReconnect(): void {
  if (manuallyDisconnected) return;
  attempt += 1;
  const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
  setStatus(attempt > MAX_ATTEMPTS_BEFORE_POLL_FALLBACK ? "failed" : "reconnecting");
  reconnectTimer = setTimeout(connect, delay);
}

function connect(): void {
  if (socket || manuallyDisconnected || typeof window === "undefined") return;
  setStatus(attempt > 0 ? "reconnecting" : "connecting");

  // SockJS types the constructor loosely; cast the WebSocket-shaped result.
  const instance = new SockJS(buildUrl()) as unknown as WebSocket;
  socket = instance;

  instance.onopen = () => {
    attempt = 0;
    setStatus("open");
  };
  instance.onmessage = (event: MessageEvent<string>) => {
    try {
      const data = JSON.parse(event.data) as NotificationDto;
      messageListeners.forEach((fn) => fn(data));
    } catch {
      // Malformed frame — explicit drop, not a silent success path.
    }
  };
  instance.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
  instance.onerror = () => {
    instance.close();
  };
}

export function connectNotificationSocket(): void {
  manuallyDisconnected = false;
  connect();
}

export function disconnectNotificationSocket(): void {
  manuallyDisconnected = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  socket?.close();
  socket = null;
  attempt = 0;
  setStatus("idle");
}

export function onNotificationMessage(listener: MessageListener): () => void {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

export function subscribeNotificationSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function getNotificationSocketStatus(): SocketStatus {
  return status;
}
