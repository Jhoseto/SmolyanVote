import { categoryIcon } from "../data/categories";
import {
  SIGNAL_BRAND,
  formatDistanceKm,
  priorityShortLabel,
  tierAccentColor,
  tierHeroGradient,
} from "./signalCardTheme";
import type { Signal } from "../types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function formatRelativeShort(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "току-що";
  if (diffMin < 60) return `преди ${diffMin} мин`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `преди ${diffH} ч`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `преди ${diffD} д`;
  return date.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

function statChip(icon: string, label: string, value: number | string, accent?: boolean): string {
  const border = accent ? `${SIGNAL_BRAND.primary}26` : "rgba(15,23,42,0.06)";
  const bg = accent ? SIGNAL_BRAND.primaryMuted : "#f8fafc";
  const color = accent ? SIGNAL_BRAND.primary : "#0f172a";
  return `
    <div style="flex:1;min-width:0;border:1px solid ${border};background:${bg};border-radius:12px;padding:8px 6px;text-align:center;">
      <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:2px;">
        <i class="bi ${icon}" style="color:${accent ? SIGNAL_BRAND.primary : "#94a3b8"};margin-right:2px;"></i>${label}
      </div>
      <div style="font-size:13px;font-weight:700;color:${color};font-variant-numeric:tabular-nums;">${value}</div>
    </div>`;
}

function statusBadge(signal: Signal): string {
  if (signal.isResolved) {
    return `<span style="padding:3px 8px;border-radius:9999px;background:rgba(14,165,233,0.15);color:#0369a1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Решен</span>`;
  }
  if (!signal.isActive) {
    return `<span style="padding:3px 8px;border-radius:9999px;background:rgba(100,116,139,0.15);color:#475569;font-size:10px;font-weight:600;">Изтекъл</span>`;
  }
  return `<span style="padding:3px 8px;border-radius:9999px;background:rgba(25,134,28,0.12);color:${SIGNAL_BRAND.primary};font-size:10px;font-weight:700;">Активен</span>`;
}

function priorityBadge(tier: Signal["priorityTier"]): string {
  if (!tier) return "";
  const accent = tierAccentColor(tier);
  return `<span style="padding:3px 8px;border-radius:9999px;background:${accent}18;color:${accent};font-size:10px;font-weight:700;border:1px solid ${accent}33;">
    <i class="bi bi-lightning-charge-fill"></i> ${priorityShortLabel(tier)}
  </span>`;
}

/** Inline-styled HTML for MapLibre hover popup (outside React/Tailwind tree). */
export function signalMapPopupHtml(signal: Signal, options?: { adminQuickMode?: boolean }): string {
  const accent = tierAccentColor(signal.priorityTier);
  const heroBg = tierHeroGradient(signal.priorityTier, signal.isActive);
  const initial = (signal.authorUsername ?? "?").charAt(0).toUpperCase();
  const distance = formatDistanceKm(signal.distanceKm);
  const description = signal.description
    ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#475569;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
        ${escapeHtml(truncateText(signal.description, 140))}
      </p>`
    : `<p style="margin:0 0 10px;font-size:12px;font-style:italic;color:#94a3b8;">Няма добавено описание.</p>`;

  const heroImage = signal.imageUrl
    ? `<img src="${escapeHtml(signal.imageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
    : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:${heroBg};">
        <i class="bi ${categoryIcon(signal.category)}" style="font-size:36px;color:rgba(255,255,255,0.35);"></i>
      </div>`;

  const avatar = signal.authorImageUrl
    ? `<img src="${escapeHtml(signal.authorImageUrl)}" alt="" style="width:32px;height:32px;border-radius:9999px;object-fit:cover;border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,0.12);" />`
    : `<span style="width:32px;height:32px;border-radius:9999px;background:${SIGNAL_BRAND.primaryMuted};color:${SIGNAL_BRAND.primary};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,0.12);">${initial}</span>`;

  const metaChips = [
    distance
      ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:9999px;background:${SIGNAL_BRAND.primaryMuted};color:${SIGNAL_BRAND.primary};font-size:10px;font-weight:600;"><i class="bi bi-geo-alt"></i>${distance}</span>`
      : "",
    signal.isActive && signal.activeUntil
      ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:9999px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:500;"><i class="bi bi-hourglass-split"></i>${formatRelativeShort(signal.activeUntil)}</span>`
      : "",
    signal.resolvedReportCount > 0 && !signal.isResolved
      ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:9999px;background:#fffbeb;color:#b45309;font-size:10px;font-weight:600;"><i class="bi bi-flag"></i>${signal.resolvedReportCount}</span>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="sv-signal-popup-card" style="width:300px;font-family:system-ui,-apple-system,sans-serif;overflow:hidden;border-radius:18px;background:#fff;">
      <div style="position:relative;height:108px;overflow:hidden;">
        ${heroImage}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(15,23,42,0.82) 0%,rgba(15,23,42,0.35) 45%,rgba(15,23,42,0.15) 100%);"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(15,23,42,0.35),transparent 55%);"></div>
        <div style="position:absolute;top:0;left:0;right:0;display:flex;align-items:flex-start;justify-content:space-between;gap:6px;padding:10px 10px 0;">
          <span style="display:inline-flex;align-items:center;gap:4px;max-width:58%;padding:4px 10px;border-radius:9999px;background:rgba(15,23,42,0.45);border:1px solid rgba(255,255,255,0.18);backdrop-filter:blur(8px);font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <i class="bi ${categoryIcon(signal.category)}"></i>
            ${escapeHtml(signal.categoryLabel)}
          </span>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            ${statusBadge(signal)}
            ${signal.isActive && signal.priorityTier ? priorityBadge(signal.priorityTier) : ""}
          </div>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:10px 12px 12px;">
          <p style="margin:0;font-size:14px;font-weight:700;line-height:1.35;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 4px rgba(0,0,0,0.35);">
            ${escapeHtml(signal.title)}
          </p>
        </div>
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${accent},${SIGNAL_BRAND.primaryLight},transparent);"></div>
      </div>

      <div style="padding:12px 14px 14px;">
        ${description}

        <div style="display:flex;gap:6px;margin-bottom:10px;">
          ${statChip("bi-arrow-up-circle", "Приоритет", signal.priorityBoostCount, true)}
          ${statChip("bi-eye", "Прегледи", signal.viewsCount)}
          ${statChip("bi-chat-left-text", "Комент.", signal.commentsCount)}
        </div>

        <div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid rgba(15,23,42,0.06);">
          ${avatar}
          <div style="min-width:0;flex:1;">
            <p style="margin:0;font-size:12px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(signal.authorUsername ?? "Анонимен")}
            </p>
            <p style="margin:0;font-size:10px;color:#94a3b8;">${formatRelativeShort(signal.createdAt)}</p>
          </div>
          <span style="font-size:10px;font-weight:600;color:#94a3b8;">#${signal.id}</span>
        </div>

        ${metaChips ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">${metaChips}</div>` : ""}

        ${
          options?.adminQuickMode
            ? `<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(15,23,42,0.06);">
                ${
                  !signal.isResolved
                    ? `<button type="button" class="sv-admin-resolve-btn" data-signal-id="${signal.id}" style="width:100%;padding:9px 12px;border:none;border-radius:9999px;background:${SIGNAL_BRAND.primary};color:#fff;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(25,134,28,0.25);">
                        <i class="bi bi-check-circle"></i> Маркирай решен
                      </button>`
                    : ""
                }
                <button type="button" class="sv-admin-delete-btn" data-signal-id="${signal.id}" style="width:100%;padding:9px 12px;border:none;border-radius:9999px;background:#dc2626;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">
                  <i class="bi bi-trash3"></i> Изтрий сигнала
                </button>
              </div>`
            : ""
        }

        <p style="margin:10px 0 0;padding:8px;border-radius:10px;background:${SIGNAL_BRAND.primaryMuted};font-size:10px;font-weight:600;color:${SIGNAL_BRAND.primary};text-align:center;">
          <i class="bi bi-cursor-fill"></i> Кликни за пълен детайл
        </p>
      </div>
    </article>`;
}

/**
 * Inline-styled HTML for a "stuck" cluster whose points are too close together
 * (often identical coordinates) to ever separate by zooming in further — lists
 * every grouped signal as a pickable row instead of endlessly re-zooming.
 */
export function signalClusterListPopupHtml(signals: Signal[]): string {
  const rows = signals
    .map((signal) => {
      const accent = tierAccentColor(signal.priorityTier);
      const heroBg = tierHeroGradient(signal.priorityTier, signal.isActive);
      const thumb = signal.imageUrl
        ? `<img src="${escapeHtml(signal.imageUrl)}" alt="" style="width:40px;height:40px;border-radius:10px;object-fit:cover;flex-shrink:0;" />`
        : `<div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${heroBg};">
             <i class="bi ${categoryIcon(signal.category)}" style="color:rgba(255,255,255,0.85);font-size:16px;"></i>
           </div>`;

      return `
        <button type="button" class="sv-cluster-pick-row" data-signal-id="${signal.id}" style="display:flex;align-items:center;gap:10px;width:100%;padding:8px;border:none;background:transparent;border-radius:12px;cursor:pointer;text-align:left;">
          ${thumb}
          <div style="min-width:0;flex:1;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#0f172a;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(signal.title)}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4px;">
              <span style="width:6px;height:6px;border-radius:9999px;background:${accent};display:inline-block;"></span>
              ${escapeHtml(signal.categoryLabel)}
            </p>
          </div>
          <i class="bi bi-chevron-right" style="color:#cbd5e1;font-size:12px;"></i>
        </button>`;
    })
    .join("");

  return `
    <div class="sv-cluster-popup-card" style="width:280px;max-height:320px;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;">
      <div style="flex-shrink:0;padding:10px 12px;background:${SIGNAL_BRAND.primaryMuted};">
        <p style="margin:0;font-size:11px;font-weight:700;color:${SIGNAL_BRAND.primary};text-transform:uppercase;letter-spacing:0.04em;">
          <i class="bi bi-pin-map-fill"></i> ${signals.length} сигнала на едно място
        </p>
      </div>
      <div style="overflow-y:auto;padding:6px;">
        ${rows}
      </div>
    </div>`;
}
