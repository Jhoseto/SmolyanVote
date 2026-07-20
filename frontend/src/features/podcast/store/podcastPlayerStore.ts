import { create } from "zustand";
import type { PodcastEpisode } from "../types";

interface PodcastPlayerState {
  currentEpisode: PodcastEpisode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  setCurrentEpisode: (episode: PodcastEpisode | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setProgress: (currentTime: number, duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
}

/**
 * Reactive playback state only — mounted once at the module level, so it
 * (and the `<audio>` element it mirrors, see `lib/podcastAudioController.ts`)
 * survives Next.js client-side navigation. Drives both the full `/podcast`
 * player and the floating mini player (MODERN_FRONTEND_PLAN §Фаза 6).
 */
export const usePodcastPlayerStore = create<PodcastPlayerState>((set) => ({
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (currentTime, duration) => set({ currentTime, duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (isMuted) => set({ isMuted }),
}));
