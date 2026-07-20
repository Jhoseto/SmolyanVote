"use client";

import { useEffect, useRef } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEpisodesList } from "./useEpisodesList";
import { loadEpisode } from "../lib/podcastAudioController";

/**
 * `?episode={id}` deep-link autoplay (MODERN_FRONTEND_PLAN §Фаза 6, ports
 * legacy `checkAutoPlayFromUrl`). Consumes the param once episodes are
 * loaded, then clears it — reloading `/podcast` afterwards won't restart
 * playback from the top.
 */
export function useDeepLinkAutoplay(): void {
  const [episodeId, setEpisodeId] = useQueryState("episode", parseAsInteger);
  const { data: episodes } = useEpisodesList();
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current || episodeId == null || !episodes?.length) return;

    const episode = episodes.find((e) => e.id === episodeId);
    if (!episode) return;

    consumed.current = true;
    loadEpisode(episode, true);
    void setEpisodeId(null);
  }, [episodeId, episodes, setEpisodeId]);
}
