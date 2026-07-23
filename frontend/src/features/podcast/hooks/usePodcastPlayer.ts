"use client";

import { useEffect } from "react";
import { useEpisodesList } from "./useEpisodesList";
import { usePodcastPlayerStore } from "../store/podcastPlayerStore";
import * as audio from "../lib/podcastAudioController";
import type { PodcastEpisode } from "../types";

/**
 * Single hook driving `<PodcastPlayer/>` (full `/podcast` page) and
 * `<PodcastMiniPlayer/>` (app-wide dock, mounted in `AppProviders`) — both read the
 * same module-singleton `<audio>` element, so switching between them never
 * restarts playback (MODERN_FRONTEND_PLAN §Фаза 6).
 */
export function usePodcastPlayer() {
  const { data: episodes = [], isPending, isError, refetch } = useEpisodesList();
  const currentEpisode = usePodcastPlayerStore((s) => s.currentEpisode);
  const isPlaying = usePodcastPlayerStore((s) => s.isPlaying);
  const currentTime = usePodcastPlayerStore((s) => s.currentTime);
  const duration = usePodcastPlayerStore((s) => s.duration);
  const volume = usePodcastPlayerStore((s) => s.volume);
  const isMuted = usePodcastPlayerStore((s) => s.isMuted);
  const playbackRate = usePodcastPlayerStore((s) => s.playbackRate);

  // Registers "what plays next" for the audio element's native `ended` event —
  // keeps the controller module free of a TanStack Query dependency.
  useEffect(() => {
    audio.setAutoAdvanceProvider(() => {
      if (!episodes.length) return null;
      const idx = currentEpisode ? episodes.findIndex((e) => e.id === currentEpisode.id) : -1;
      return episodes[(idx + 1) % episodes.length] ?? null;
    });
    return () => audio.setAutoAdvanceProvider(null);
  }, [episodes, currentEpisode]);

  function playEpisode(episode: PodcastEpisode) {
    audio.loadEpisode(episode, true);
  }

  function playNext() {
    if (!episodes.length) return;
    const idx = currentEpisode ? episodes.findIndex((e) => e.id === currentEpisode.id) : -1;
    const next = episodes[(idx + 1) % episodes.length];
    if (next) audio.loadEpisode(next, true);
  }

  function playPrevious() {
    if (!episodes.length) return;
    const idx = currentEpisode ? episodes.findIndex((e) => e.id === currentEpisode.id) : -1;
    const prevIndex = idx <= 0 ? episodes.length - 1 : idx - 1;
    audio.loadEpisode(episodes[prevIndex], true);
  }

  return {
    episodes,
    isPending,
    isError,
    refetch,
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    playEpisode,
    togglePlay: audio.togglePlay,
    seekTo: audio.seekTo,
    setVolume: audio.setVolume,
    toggleMute: audio.toggleMute,
    cyclePlaybackRate: audio.cyclePlaybackRate,
    setPlaybackRate: audio.setPlaybackRate,
    playNext,
    playPrevious,
    close: audio.closePlayer,
  };
}
