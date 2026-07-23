"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePodcastPlayer } from "../hooks/usePodcastPlayer";
import { PodcastDockPlayer } from "./PodcastDockPlayer";

/** App-wide dock player — same UI as `/podcast`; hidden until an episode is active (except on `/podcast`). */
export function PodcastMiniPlayer() {
  const pathname = usePathname();
  const onPodcastPage = pathname === "/podcast";

  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    cyclePlaybackRate,
  } = usePodcastPlayer();

  const dockVisible = onPodcastPage || Boolean(currentEpisode);

  useEffect(() => {
    if (!dockVisible || onPodcastPage) {
      document.documentElement.classList.remove("podcast-dock-active");
      return;
    }
    document.documentElement.classList.add("podcast-dock-active");
    return () => document.documentElement.classList.remove("podcast-dock-active");
  }, [dockVisible, onPodcastPage]);

  if (!dockVisible) return null;

  return (
    <PodcastDockPlayer
      episode={currentEpisode}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      volume={volume}
      isMuted={isMuted}
      playbackRate={playbackRate}
      onTogglePlay={togglePlay}
      onPrevious={playPrevious}
      onNext={playNext}
      onSeek={seekTo}
      onVolumeChange={setVolume}
      onToggleMute={toggleMute}
      onCyclePlaybackRate={cyclePlaybackRate}
    />
  );
}
