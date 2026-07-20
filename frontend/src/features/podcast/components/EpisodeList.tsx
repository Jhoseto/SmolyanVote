"use client";

import { EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { EpisodeCard } from "./EpisodeCard";
import type { PodcastEpisode } from "../types";

interface EpisodeListProps {
  episodes: PodcastEpisode[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  currentEpisodeId: number | null;
  isPlaying: boolean;
  onSelect: (episode: PodcastEpisode) => void;
  className?: string;
}

export function EpisodeList({
  episodes,
  isPending,
  isError,
  onRetry,
  currentEpisodeId,
  isPlaying,
  onSelect,
  className,
}: EpisodeListProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {isPending && (
        <div className="flex justify-center py-10">
          <LogoLoader size="md" label="Зареждане на епизоди…" />
        </div>
      )}

      {isError && <ErrorState description="Епизодите не можаха да се заредят." onRetry={onRetry} />}

      {!isPending && !isError && episodes.length === 0 && (
        <EmptyState icon="bi-mic" title="Няма епизоди" description="Все още няма публикувани епизоди на подкаста." />
      )}

      {episodes.map((episode) => (
        <EpisodeCard
          key={episode.id}
          episode={episode}
          isActive={episode.id === currentEpisodeId}
          isPlaying={isPlaying}
          onSelect={() => onSelect(episode)}
        />
      ))}
    </div>
  );
}
