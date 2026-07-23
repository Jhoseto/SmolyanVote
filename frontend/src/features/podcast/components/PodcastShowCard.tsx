"use client";

import { cn } from "@/shared/lib/cn";
import type { PodcastEpisode } from "../types";

interface PodcastShowCardProps {
  episode: PodcastEpisode;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  variant?: "carousel" | "compact";
}

export function PodcastShowCard({
  episode,
  isActive,
  isPlaying,
  onSelect,
  variant = "carousel",
}: PodcastShowCardProps) {
  const isCarousel = variant === "carousel";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative shrink-0 snap-start overflow-hidden rounded-[24px] border text-left transition-all duration-300",
        isCarousel
          ? "w-[min(88vw,300px)] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]"
          : "w-full",
        isActive
          ? "border-primary/40 shadow-[0_24px_60px_-28px_rgba(25,134,28,0.65)]"
          : "border-black/[0.06] hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_50px_-30px_rgba(25,134,28,0.45)]",
      )}
    >
      <div className={cn("relative overflow-hidden", isCarousel ? "h-[200px] xl:h-[180px]" : "h-[180px]")}>
        {episode.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#12341c] to-[#1f5d2d]">
            <i className="bi bi-mic-fill text-5xl text-white/35" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07140a]/92 via-[#07140a]/25 to-transparent" />

        {episode.episodeNumber != null && (
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
            Еп. {episode.episodeNumber}
          </span>
        )}

        <span
          className={cn(
            "absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all",
            "opacity-0 group-hover:opacity-100",
            isActive && "opacity-100 bg-primary text-white shadow-[0_12px_30px_-12px_rgba(25,134,28,0.9)]",
          )}
        >
          <i className={cn("bi text-xl", isActive && isPlaying ? "bi-pause-fill" : "bi-play-fill")} />
        </span>
      </div>

      <div className="space-y-2.5 bg-white p-3.5 xl:p-4">
        <h3
          className={cn(
            "line-clamp-2 font-display text-[0.95rem] font-semibold leading-snug tracking-[-0.02em] xl:text-[1rem]",
            isActive ? "text-primary" : "text-[color:var(--color-text-heading)]",
          )}
        >
          {episode.title}
        </h3>

        {episode.description && (
          <p className="line-clamp-2 text-[0.78rem] leading-relaxed text-[color:var(--color-text-secondary)] xl:line-clamp-3 xl:text-[0.82rem]">
            {episode.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-[0.74rem] text-[color:var(--color-text-muted)]">
          {episode.formattedPublishDate && (
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-calendar3" />
              {episode.formattedPublishDate}
            </span>
          )}
          {episode.formattedDuration && (
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-clock" />
              {episode.formattedDuration}
            </span>
          )}
          {episode.listenCount != null && (
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-headphones" />
              {episode.listenCount.toLocaleString("bg-BG")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
