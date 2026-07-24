"use client";

import { useMemo } from "react";
import type { PodcastEpisode } from "../types";
import type { PodcastSortOption } from "./usePodcastFilters";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function sortEpisodes(episodes: PodcastEpisode[], sort: PodcastSortOption) {
  const copy = [...episodes];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => dateValue(a) - dateValue(b));
    case "popular":
      return copy.sort((a, b) => (b.listenCount ?? 0) - (a.listenCount ?? 0));
    case "longest":
      return copy.sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0));
    case "shortest":
      return copy.sort((a, b) => (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0));
    case "newest":
    default:
      return copy.sort((a, b) => dateValue(b) - dateValue(a));
  }
}

function dateValue(episode: PodcastEpisode) {
  if (!episode.publishDate) return 0;
  return new Date(episode.publishDate).getTime();
}

export function useFilteredEpisodes(
  episodes: PodcastEpisode[],
  search: string,
  sort: PodcastSortOption,
) {
  return useMemo(() => {
    const query = normalize(search);
    const filtered = query
      ? episodes.filter((episode) => {
          const haystack = normalize(
            [episode.title, episode.description ?? "", String(episode.episodeNumber ?? "")]
              .join(" "),
          );
          return haystack.includes(query);
        })
      : episodes;

    return sortEpisodes(filtered, sort);
  }, [episodes, search, sort]);
}

export function usePodcastInsights(episodes: PodcastEpisode[]) {
  return useMemo(() => {
    const totalListens = episodes.reduce((sum, e) => sum + (e.listenCount ?? 0), 0);
    const totalDuration = episodes.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);
    const featured = [...episodes]
      .sort((a, b) => (b.listenCount ?? 0) - (a.listenCount ?? 0))
      .slice(0, 8);
    const latest = [...episodes].sort((a, b) => dateValue(b) - dateValue(a)).slice(0, 8);

    return { totalListens, totalDuration, featured, latest };
  }, [episodes]);
}
