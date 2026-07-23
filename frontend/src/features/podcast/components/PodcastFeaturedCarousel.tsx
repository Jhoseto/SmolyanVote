"use client";

import { useRef } from "react";
import { cn } from "@/shared/lib/cn";
import type { PodcastEpisode } from "../types";
import { PodcastShowCard } from "./PodcastShowCard";

interface PodcastFeaturedCarouselProps {
  title: string;
  subtitle: string;
  icon: string;
  episodes: PodcastEpisode[];
  currentEpisodeId: number | null;
  isPlaying: boolean;
  onSelect: (episode: PodcastEpisode) => void;
}

export function PodcastFeaturedCarousel({
  title,
  subtitle,
  icon,
  episodes,
  currentEpisodeId,
  isPlaying,
  onSelect,
}: PodcastFeaturedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (episodes.length === 0) return null;

  function scrollByCards(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("button");
    const gap = 16;
    const visibleCards = window.matchMedia("(min-width: 1280px)").matches
      ? 4
      : window.matchMedia("(min-width: 1024px)").matches
        ? 3
        : window.matchMedia("(min-width: 640px)").matches
          ? 2
          : 1;
    const amount = ((card?.offsetWidth ?? 280) + gap) * visibleCards;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary">
            <i className={cn("bi", icon)} />
            {title}
          </div>
          <p className="text-[0.88rem] text-[color:var(--color-text-secondary)]">{subtitle}</p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Предишни епизоди"
            onClick={() => scrollByCards(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[color:var(--color-text-secondary)] transition-all hover:border-primary/30 hover:text-primary"
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            type="button"
            aria-label="Следващи епизоди"
            onClick={() => scrollByCards(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[color:var(--color-text-secondary)] transition-all hover:border-primary/30 hover:text-primary"
          >
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
      >
        {episodes.map((episode) => (
          <PodcastShowCard
            key={episode.id}
            episode={episode}
            isActive={currentEpisodeId === episode.id}
            isPlaying={isPlaying}
            onSelect={() => onSelect(episode)}
          />
        ))}
      </div>
    </section>
  );
}
