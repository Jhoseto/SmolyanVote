"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { SignalListRow } from "./SignalListRow";
import type { Signal } from "../types";

export type PeekSnap = "minimized" | "peek" | "half" | "full";

const MINIMIZED_H = 52;
const PEEK_H = 168;
const HALF_RATIO = 0.4;
const FULL_RATIO = 0.72;

function snapHeight(level: PeekSnap): number {
  if (typeof window === "undefined") {
    return level === "minimized" ? MINIMIZED_H : PEEK_H;
  }
  const vh = window.innerHeight;
  switch (level) {
    case "minimized":
      return MINIMIZED_H;
    case "peek":
      return PEEK_H;
    case "half":
      return Math.round(vh * HALF_RATIO);
    case "full":
      return Math.round(vh * FULL_RATIO);
  }
}

function nearestSnap(heightPx: number): PeekSnap {
  const levels: PeekSnap[] = ["minimized", "peek", "half", "full"];
  let best: PeekSnap = "minimized";
  let bestDist = Infinity;
  for (const level of levels) {
    const d = Math.abs(snapHeight(level) - heightPx);
    if (d < bestDist) {
      bestDist = d;
      best = level;
    }
  }
  return best;
}

interface SignalsMapPeekSheetProps {
  signals: Signal[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
  onHeightChange?: (heightPx: number) => void;
}

export function SignalsMapPeekSheet({ signals, selectedId, onSelect, onHeightChange }: SignalsMapPeekSheetProps) {
  const [snap, setSnap] = useState<PeekSnap>("peek");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(PEEK_H);

  const heightPx = dragHeight ?? snapHeight(snap);

  useEffect(() => {
    onHeightChange?.(heightPx);
  }, [heightPx, onHeightChange]);

  useEffect(() => {
    function onResize() {
      setDragHeight(null);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const minimize = useCallback(() => setSnap("minimized"), []);
  const expandOne = useCallback(() => {
    setSnap((s) => {
      if (s === "minimized") return "peek";
      if (s === "peek") return "half";
      if (s === "half") return "full";
      return "minimized";
    });
  }, []);

  function onHeaderPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setIsDragging(true);
    startY.current = e.clientY;
    startHeight.current = heightPx;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHeaderPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const delta = startY.current - e.clientY;
    const maxH = snapHeight("full");
    const next = Math.max(MINIMIZED_H, Math.min(maxH, startHeight.current + delta));
    setDragHeight(next);
  }

  function onHeaderPointerUp(e: React.PointerEvent) {
    if (!isDragging) return;
    setIsDragging(false);
    const finalH = dragHeight ?? heightPx;
    setSnap(nearestSnap(finalH));
    setDragHeight(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  const showList = snap !== "minimized";
  const listSignals = snap === "peek" ? signals.slice(0, 1) : signals;

  return (
    <div
      className="signals-peek-sheet pointer-events-auto"
      style={{
        height: heightPx,
        transition: isDragging ? "none" : "height 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <div
        className="signals-peek-sheet__header"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <div className="signals-peek-sheet__grab" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={expandOne}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-sm font-semibold text-[color:var(--color-text-heading)]">
              {signals.length} сигнал{signals.length === 1 ? "" : "а"}
              {snap === "minimized" ? " · плъзни нагоре" : null}
            </p>
            {snap !== "minimized" ? (
              <p className="truncate text-[0.65rem] text-[color:var(--color-text-muted)]">
                {snap === "peek" ? "Плъзни за повече · докосни ред за детайли" : "Плъзни надолу за по-малко"}
              </p>
            ) : null}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={minimize}
            aria-label="Скрий панела"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]"
          >
            <i className="bi bi-chevron-down" />
          </button>
          {snap !== "full" ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setSnap("full")}
              aria-label="Разгъни списъка"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"
            >
              <i className="bi bi-chevron-up" />
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setSnap("peek")}
              aria-label="Свий списъка"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]"
            >
              <i className="bi bi-chevron-down" />
            </button>
          )}
        </div>
      </div>

      {showList ? (
        <div className="signals-peek-sheet__scroll min-h-0 flex-1">
          <div className="flex flex-col gap-2 px-3">
            {listSignals.length === 0 ? (
              <p className="py-6 text-center text-sm text-[color:var(--color-text-muted)]">Няма сигнали в изгледа.</p>
            ) : (
              listSignals.map((signal) => (
                <SignalListRow
                  key={signal.id}
                  signal={signal}
                  isSelected={signal.id === selectedId}
                  onSelect={() => onSelect(signal.id)}
                  compact={snap === "peek"}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
