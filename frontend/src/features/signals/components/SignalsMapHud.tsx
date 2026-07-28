"use client";

import { cn } from "@/shared/lib/cn";
interface SignalsMapHudProps {
  visibleCount: number;
  totalCount: number;
  isFlying: boolean;
  adminQuickMode?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onFitSignals: () => void;
  onLocate: () => void;
  className?: string;
}

export function SignalsMapHud({
  visibleCount,
  totalCount,
  isFlying,
  adminQuickMode,
  onZoomIn,
  onZoomOut,
  onRecenter,
  onFitSignals,
  onLocate,
  className,
}: SignalsMapHudProps) {
  return (
    <>
      {/* Top-left: stats pill */}
      <div
        className={cn(
          "pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2 sm:left-4 sm:top-4",
          className,
        )}
      >
        <div className="sv-map-hud-pill pointer-events-auto flex items-center gap-2 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold tabular-nums text-[color:var(--color-text-heading)]">
            {visibleCount}
            <span className="font-normal text-[color:var(--color-text-muted)]"> / {totalCount}</span>
          </span>
          <span className="hidden text-[10px] text-[color:var(--color-text-muted)] sm:inline">в изгледа</span>
        </div>

        {adminQuickMode ? (
          <div className="sv-map-hud-pill sv-map-hud-pill--admin pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
            <i className="bi bi-shield-check" />
            Бърза модерация
          </div>
        ) : null}

        {isFlying ? (
          <div className="sv-map-hud-pill pointer-events-none flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-primary">
            <i className="bi bi-airplane animate-pulse" />
            Навигация…
          </div>
        ) : null}
      </div>

      {/* Top-right: controls stack */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 sm:right-4 sm:top-4">
        <div className="sv-map-controls flex flex-col overflow-hidden rounded-[var(--radius-lg)]">
          <HudButton icon="bi-plus-lg" label="Приближи" onClick={onZoomIn} />
          <HudButton icon="bi-dash-lg" label="Отдалечи" onClick={onZoomOut} />
          <div className="sv-map-controls__divider" />
          <HudButton icon="bi-bullseye" label="Всички сигнали" onClick={onFitSignals} />
          <HudButton icon="bi-geo-alt" label="Моето местоположение" onClick={onLocate} />
          <HudButton icon="bi-house-door" label="Центрирай Смолян" onClick={onRecenter} />
        </div>
      </div>

      {/* Bottom-left: legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:bottom-4 sm:left-4 sm:block">
        <div className="sv-map-hud-pill pointer-events-none flex flex-wrap gap-x-3 gap-y-1 px-3 py-2">
          <LegendDot color="high" label="Висок" />
          <LegendDot color="medium" label="Среден" />
          <LegendDot color="low" label="Нисък" />
          <LegendDot color="inactive" label="Неактивен" />
        </div>
      </div>

      {/* Bottom-right: hint */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
        <p className="sv-map-hud-pill max-w-[min(280px,70vw)] px-3 py-1.5 text-[10px] text-[color:var(--color-text-muted)]">
          <i className="bi bi-cursor mr-1" />
          Кликни маркер · за преглед на сигнал
        </p>
      </div>
    </>
  );
}

function HudButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="sv-map-control-btn">
      <i className={cn("bi text-base", icon)} />
    </button>
  );
}

function LegendDot({ color, label }: { color: "high" | "medium" | "low" | "inactive"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[color:var(--color-text-secondary)]">
      <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white", `sv-legend-dot--${color}`)} />
      {label}
    </span>
  );
}
