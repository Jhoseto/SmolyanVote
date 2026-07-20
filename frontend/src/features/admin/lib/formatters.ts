export function formatBytes(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatMs(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}

export function formatPercent(value: unknown, digits = 1): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function formatNumber(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("bg-BG").format(n);
}

export function asString(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function pick(map: Record<string, unknown> | undefined, ...keys: string[]): unknown {
  if (!map) return undefined;
  for (const key of keys) {
    if (key in map && map[key] != null) return map[key];
  }
  return undefined;
}

/** Nested actuator detail maps often nest under `details`. */
export function dig(map: Record<string, unknown> | undefined, path: string): unknown {
  if (!map) return undefined;
  const parts = path.split(".");
  let cur: unknown = map;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}
