"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/shared/lib/cn";
import { SignalCard } from "./SignalCard";
import type { SignalLane } from "../lib/signalLanes";

interface SignalsCarouselLaneProps {
  lane: SignalLane;
  onSelect: (id: number) => void;
  selectedId?: number | null;
}

export function SignalsCarouselLane({ lane, onSelect, selectedId }: SignalsCarouselLaneProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 8);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, lane.signals.length]);

  function scrollByCards(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-lane-card]");
    const gap = 14;
    const visibleCards = window.matchMedia("(min-width: 1280px)").matches
      ? 5
      : window.matchMedia("(min-width: 1024px)").matches
        ? 4
        : window.matchMedia("(min-width: 768px)").matches
          ? 3
          : window.matchMedia("(min-width: 640px)").matches
            ? 2
            : 1;
    const amount = ((card?.offsetWidth ?? 220) + gap) * visibleCards;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  if (lane.signals.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)]"
            style={{ backgroundImage: `linear-gradient(135deg, ${lane.accent}, ${lane.accent}cc)` }}
          >
            <i className={cn("bi", lane.icon)} />
          </span>
          <div>
            <h2 className="font-display text-[0.95rem] font-bold leading-tight text-[color:var(--color-text-heading)] sm:text-base">
              {lane.title}
            </h2>
            <p className="hidden text-[0.76rem] text-[color:var(--color-text-muted)] sm:block">{lane.subtitle}</p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <button
            type="button"
            aria-label="Предишни"
            disabled={!canScrollLeft}
            onClick={() => scrollByCards(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[color:var(--color-text-secondary)] transition-all hover:border-primary/30 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <i className="bi bi-chevron-left text-sm" />
          </button>
          <button
            type="button"
            aria-label="Следващи"
            disabled={!canScrollRight}
            onClick={() => scrollByCards(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[color:var(--color-text-secondary)] transition-all hover:border-primary/30 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <i className="bi bi-chevron-right text-sm" />
          </button>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />
        )}
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {lane.signals.map((signal) => (
            <div
              key={signal.id}
              data-lane-card
              className="w-[74vw] shrink-0 snap-start sm:w-[calc((100%-0.875rem)/2)] md:w-[calc((100%-1.75rem)/3)] lg:w-[calc((100%-2.625rem)/4)] xl:w-[calc((100%-3.5rem)/5)]"
            >
              <SignalCard signal={signal} isSelected={signal.id === selectedId} onSelect={() => onSelect(signal.id)} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
