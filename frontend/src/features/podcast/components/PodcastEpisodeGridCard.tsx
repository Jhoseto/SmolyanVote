"use client";

import { cn } from "@/shared/lib/cn";
import type { PodcastEpisode } from "../types";

interface PodcastEpisodeGridCardProps {
  episode: PodcastEpisode;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}

export function PodcastEpisodeGridCard({
  episode,
  isActive,
  isPlaying,
  onSelect,
}: PodcastEpisodeGridCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[22px] border bg-white text-left transition-all duration-300",
        isActive
          ? "border-primary/35 shadow-[0_20px_50px_-28px_rgba(25,134,28,0.55)]"
          : "border-black/[0.06] hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_45px_-32px_rgba(25,134,28,0.4)]",
      )}
    >
      <div className="relative h-44 overflow-hidden">
        {episode.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#12341c] to-[#48a24c]">
            <i className="bi bi-mic-fill text-4xl text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div>
            {episode.episodeNumber != null && (
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/70">
                Епизод {episode.episodeNumber}
              </p>
            )}
            <h3 className="line-clamp-2 font-display text-[1rem] font-semibold leading-snug text-white">
              {episode.title}
            </h3>
          </div>
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all",
              isActive && "bg-primary shadow-[0_10px_24px_-12px_rgba(25,134,28,0.9)]",
            )}
          >
            <i className={cn("bi", isActive && isPlaying ? "bi-pause-fill" : "bi-play-fill")} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {episode.description ? (
          <p className="line-clamp-3 flex-1 text-[0.82rem] leading-relaxed text-[color:var(--color-text-secondary)]">
            {episode.description}
          </p>
        ) : (
          <p className="flex-1 text-[0.82rem] italic text-[color:var(--color-text-muted)]">
            Няма добавено описание за този епизод.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-black/[0.06] pt-3 text-[0.74rem] text-[color:var(--color-text-muted)]">
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
              {episode.listenCount.toLocaleString("bg-BG")} прослушвания
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
