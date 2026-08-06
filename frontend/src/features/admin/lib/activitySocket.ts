import { resolveNativeWsUrl } from "@/config/env";
import { tokenStore } from "@/lib/api/tokenStore";
import type { ActivityItem, ActivityStats } from "../types";

export type ActivitySocketStatus = "idle" | "connecting" | "open" | "reconnecting" | "closed";

type Listener = (msg: { type: string; data?: unknown; activities?: ActivityItem[]; stats?: ActivityStats }) => void;
type StatusListener = (s: ActivitySocketStatus) => void;

const ADMIN_ACTIVITY_WS_PATH = "/ws/admin/activity/ws";

let socket: WebSocket | null = null;
let status: ActivitySocketStatus = "idle";
let attempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyDisconnected = true;
let enabled = false;

const listeners = new Set<Listener>();
const statusListeners = new Set<StatusListener>();

function normalizeActivityItem(item: unknown): ActivityItem {
  const rec = (item && typeof item === "object" ? item : {}) as ActivityItem & {
    ip_address?: string | null;
  };
  const ipAddress = rec.ipAddress ?? rec.ip_address ?? null;
  return { ...rec, ipAddress };
}

export function normalizeActivityItems(items: unknown[]): ActivityItem[] {
  return items.map(normalizeActivityItem);
}

function setStatus(next: ActivitySocketStatus) {
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

function buildUrl() {
  const base = resolveNativeWsUrl(ADMIN_ACTIVITY_WS_PATH);
  const token = tokenStore.getAccess();
  return token ? `${base}?access_token=${encodeURIComponent(token)}` : base;
}

function scheduleReconnect() {
  if (manuallyDisconnected || !enabled) return;
  attempt += 1;
  const delay = Math.min(1000 * 2 ** (attempt - 1), 30_000);
  setStatus("reconnecting");
  reconnectTimer = setTimeout(connect, delay);
}

function connect() {
  if (socket || manuallyDisconnected || !enabled || typeof window === "undefined") return;
  setStatus(attempt > 0 ? "reconnecting" : "connecting");
  const instance = new WebSocket(buildUrl());
  socket = instance;

  instance.onopen = () => {
    attempt = 0;
    setStatus("open");
    instance.send(JSON.stringify({ type: "get_recent", data: { limit: 50 } }));
    instance.send(JSON.stringify({ type: "get_stats" }));
  };

  instance.onmessage = (event: MessageEvent<string>) => {
    try {
      const raw = JSON.parse(event.data) as {
        type: string;
        data?: unknown;
      };
      const msg: {
        type: string;
        data?: unknown;
        activities?: ActivityItem[];
        stats?: ActivityStats;
      } = { type: raw.type, data: raw.data };

      const payload = raw.data;
      if (Array.isArray(payload)) {
        msg.activities = payload.map(normalizeActivityItem);
      } else if (payload && typeof payload === "object") {
        const p = payload as Record<string, unknown>;
        if (Array.isArray(p.activities)) {
          msg.activities = normalizeActivityItems(p.activities);
        }
        if (raw.type === "new_activity") {
          msg.data = normalizeActivityItem(p);
        }
        if (
          raw.type === "statistics" ||
          raw.type === "stats_update" ||
          (typeof p.lastHour === "number" || typeof p.today === "number")
        ) {
          msg.stats = p as unknown as ActivityStats;
        }
      }
      listeners.forEach((fn) => fn(msg));
    } catch {
      /* drop */
    }
  };

  instance.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
  instance.onerror = () => instance.close();
}

export function setActivityLiveEnabled(on: boolean) {
  enabled = on;
  if (on) {
    manuallyDisconnected = false;
    connect();
  } else {
    manuallyDisconnected = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
    setStatus("closed");
  }
}

export function subscribeActivitySocket(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function subscribeActivityStatus(fn: StatusListener): () => void {
  statusListeners.add(fn);
  fn(status);
  return () => statusListeners.delete(fn);
}

export function getActivitySocketStatus() {
  return status;
}

export function sendActivitySocket(msg: Record<string, unknown>) {
  if (socket && status === "open") {
    socket.send(JSON.stringify(msg));
  }
}
