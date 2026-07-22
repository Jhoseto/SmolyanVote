import { categoryIcon } from "../data/categories";
import type { Signal } from "../types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

function tierAccent(tier: Signal["priorityTier"]): string {
  if (tier === "high") return "#ef4444";
  if (tier === "medium") return "#f59e0b";
  return "#0d6efd";
}

/** Inline-styled HTML for MapLibre hover popup (outside React/Tailwind tree). */
export function signalMapPopupHtml(signal: Signal, options?: { adminQuickMode?: boolean }): string {
  const accent = tierAccent(signal.priorityTier);
  const statusColor = signal.isActive ? "#16a34a" : "#94a3b8";
  const statusLabel = signal.isResolved ? "Решен" : signal.isActive ? "Активен" : "Изтекъл";
  const initial = (signal.authorUsername ?? "?").charAt(0).toUpperCase();
  const avatar = signal.authorImageUrl
    ? `<img src="${escapeHtml(signal.authorImageUrl)}" alt="" style="width:28px;height:28px;border-radius:9999px;object-fit:cover;" />`
    : `<span style="width:28px;height:28px;border-radius:9999px;background:#eff6ff;color:#0d6efd;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${initial}</span>`;

  return `
    <div style="min-width:200px;max-width:240px;font-family:system-ui,sans-serif;">
      <div style="height:3px;background:linear-gradient(90deg,${accent},transparent);"></div>
      <div style="padding:12px 14px 14px;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;line-height:1.35;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${escapeHtml(signal.title)}
        </p>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:11px;color:#64748b;">
          <i class="bi ${categoryIcon(signal.category)}" style="color:${accent};"></i>
          <span>${escapeHtml(signal.categoryLabel)}</span>
          <span style="margin-left:auto;padding:2px 8px;border-radius:9999px;background:${statusColor}18;color:${statusColor};font-weight:600;">${statusLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          ${avatar}
          <div style="min-width:0;flex:1;">
            <p style="margin:0;font-size:12px;font-weight:600;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(signal.authorUsername ?? "")}</p>
            <p style="margin:0;font-size:10px;color:#94a3b8;">${formatDate(signal.createdAt)}</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;font-size:11px;color:#64748b;border-top:1px solid #f1f5f9;padding-top:8px;">
          <span><i class="bi bi-arrow-up-circle" style="color:${accent};"></i> ${signal.priorityBoostCount}</span>
          <span><i class="bi bi-eye"></i> ${signal.viewsCount}</span>
          <span><i class="bi bi-chat"></i> ${signal.commentsCount}</span>
        </div>
        ${
          options?.adminQuickMode
            ? `<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">
                ${
                  !signal.isResolved
                    ? `<button type="button" class="sv-admin-resolve-btn" data-signal-id="${signal.id}" style="width:100%;padding:8px 10px;border:none;border-radius:9999px;background:#16a34a;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">
                        <i class="bi bi-check-circle"></i> Маркирай решен
                      </button>`
                    : ""
                }
                <button type="button" class="sv-admin-delete-btn" data-signal-id="${signal.id}" style="width:100%;padding:8px 10px;border:none;border-radius:9999px;background:#dc2626;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">
                  <i class="bi bi-trash3"></i> Изтрий сигнала
                </button>
              </div>`
            : ""
        }
        <p style="margin:8px 0 0;font-size:10px;color:#94a3b8;text-align:center;">Кликни за детайли</p>
      </div>
    </div>`;
}
