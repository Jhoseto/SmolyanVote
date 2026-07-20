"use client";

import { useQuery } from "@tanstack/react-query";
import { podcastApi } from "../api";

/**
 * Single cache entry shared by the full player, the mini player and the
 * deep-link autoplay hook — episodes rarely change, `staleTime` avoids a
 * refetch/loading-flicker every time a new consumer mounts.
 */
export function useEpisodesList() {
  return useQuery({
    queryKey: ["podcast", "episodes"],
    queryFn: () => podcastApi.episodes(),
    staleTime: 60_000,
  });
}
