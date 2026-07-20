"use client";

import { cn } from "@/shared/lib/cn";
import type { PodcastEpisode } from "../types";

interface EpisodeCardProps {
  episode: PodcastEpisode;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}

export function EpisodeCard({ episode, isActive, isPlaying, onSelect }: EpisodeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border-default/60 bg-white p-3 text-left transition-colors hover:border-primary/50",
        isActive && "border-primary bg-primary-50",
      )}
    >
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[color:var(--color-surface-muted)]">
        {episode.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote/Cloudinary cover art
          <img src={episode.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <i className="bi bi-mic-fill text-xl text-[color:var(--color-text-muted)]" />
        )}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity",
            isActive && "opacity-100",
          )}
        >
          <i className={cn("bi text-lg", isActive && isPlaying ? "bi-pause-fill" : "bi-play-fill")} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "line-clamp-2 text-sm font-semibold text-[color:var(--color-text-primary)]",
            isActive && "text-primary",
          )}
        >
          {episode.episodeNumber != null && (
            <span className="mr-1.5 text-[color:var(--color-text-muted)]">#{episode.episodeNumber}</span>
          )}
          {episode.title}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
          {episode.formattedPublishDate && <span>{episode.formattedPublishDate}</span>}
          {episode.formattedDuration && (
            <span className="flex items-center gap-1">
              <i className="bi bi-clock" />
              {episode.formattedDuration}
            </span>
          )}
          {episode.listenCount != null && (
            <span className="flex items-center gap-1">
              <i className="bi bi-headphones" />
              {episode.listenCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
