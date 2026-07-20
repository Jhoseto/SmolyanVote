import { podcastApi } from "../api";
import { usePodcastPlayerStore } from "../store/podcastPlayerStore";
import { hasListenedThisSession, markEpisodeListened } from "./listenTracking";
import type { PodcastEpisode } from "../types";

/**
 * Module-singleton `<audio>` element + imperative controls, deliberately
 * outside React lifecycle. It is created once per browser tab and never
 * destroyed — that's what makes playback survive Next.js client-side
 * navigation and the `/podcast` page unmounting (MODERN_FRONTEND_PLAN
 * §Floating/mini плейър, port of legacy `podcast-window.js` but in-app
 * instead of a separate `window.open` popup).
 *
 * `WaveSurfer.create({ media: getPodcastAudioElement() })` (see
 * `components/PodcastWaveform.tsx`) attaches a *visual* waveform to this same
 * element without taking ownership of it — `wavesurfer.destroy()` on
 * externally-supplied media does not pause/unload it.
 */

let audioEl: HTMLAudioElement | null = null;
let autoAdvanceProvider: (() => PodcastEpisode | null) | null = null;

function getAudio(): HTMLAudioElement {
  if (audioEl) return audioEl;

  const audio = new Audio();
  audio.preload = "metadata";

  audio.addEventListener("timeupdate", () => {
    usePodcastPlayerStore.getState().setProgress(audio.currentTime, audio.duration || 0);
  });
  audio.addEventListener("loadedmetadata", () => {
    usePodcastPlayerStore.getState().setProgress(audio.currentTime, audio.duration || 0);
  });
  audio.addEventListener("play", () => usePodcastPlayerStore.getState().setPlaying(true));
  audio.addEventListener("pause", () => usePodcastPlayerStore.getState().setPlaying(false));
  audio.addEventListener("ended", () => {
    const next = autoAdvanceProvider?.();
    if (next) loadEpisode(next, true);
    else usePodcastPlayerStore.getState().setPlaying(false);
  });

  audioEl = audio;
  return audio;
}

/** Lets `usePodcastPlayer` supply the "next episode" without this module depending on TanStack Query. */
export function setAutoAdvanceProvider(fn: (() => PodcastEpisode | null) | null): void {
  autoAdvanceProvider = fn;
}

/** For `<PodcastWaveform/>`'s `media` option — never call `.pause()`/`.src =` on this from outside this module. */
export function getPodcastAudioElement(): HTMLAudioElement {
  return getAudio();
}

export function loadEpisode(episode: PodcastEpisode, autoplay = true): void {
  const audio = getAudio();
  const store = usePodcastPlayerStore.getState();

  if (store.currentEpisode?.id !== episode.id) {
    audio.src = episode.audioUrl;
    store.setCurrentEpisode(episode);
    store.setProgress(0, episode.durationSeconds ?? 0);

    if (!hasListenedThisSession(episode.id)) {
      markEpisodeListened(episode.id);
      void podcastApi.incrementListen(episode.id).catch(() => {
        /* best-effort — listen count is not critical UX */
      });
    }
  }

  if (autoplay) void audio.play();
}

export function play(): void {
  void getAudio().play();
}

export function pause(): void {
  getAudio().pause();
}

export function togglePlay(): void {
  const audio = getAudio();
  if (audio.paused) void audio.play();
  else audio.pause();
}

export function seekTo(seconds: number): void {
  getAudio().currentTime = seconds;
}

export function setVolume(volume: number): void {
  const audio = getAudio();
  const clamped = Math.min(1, Math.max(0, volume));
  audio.volume = clamped;
  audio.muted = clamped === 0;
  usePodcastPlayerStore.getState().setVolume(clamped);
  usePodcastPlayerStore.getState().setMuted(audio.muted);
}

export function toggleMute(): void {
  const audio = getAudio();
  audio.muted = !audio.muted;
  usePodcastPlayerStore.getState().setMuted(audio.muted);
}

export function closePlayer(): void {
  const audio = getAudio();
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  usePodcastPlayerStore.getState().setCurrentEpisode(null);
  usePodcastPlayerStore.getState().setProgress(0, 0);
}
