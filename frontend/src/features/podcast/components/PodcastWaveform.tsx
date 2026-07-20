"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { cn } from "@/shared/lib/cn";
import { getPodcastAudioElement } from "../lib/podcastAudioController";
import { usePodcastPlayerStore } from "../store/podcastPlayerStore";

interface PodcastWaveformProps {
  className?: string;
}

/**
 * WaveSurfer v7 waveform bound to the shared module-singleton `<audio>`
 * element via the `media` option — this component only owns the *visual*
 * canvas. Unmounting (e.g. navigating away from `/podcast`) calls
 * `wavesurfer.destroy()`, which does not touch externally-supplied media,
 * so playback keeps going for `<PodcastMiniPlayer/>`.
 */
export function PodcastWaveform({ className }: PodcastWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const currentEpisode = usePodcastPlayerStore((s) => s.currentEpisode);
  const skipNextLoad = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ws = WaveSurfer.create({
      container,
      media: getPodcastAudioElement(),
      waveColor: "#c8e6c9",
      progressColor: "#19861c",
      cursorColor: "#19861c",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 56,
      normalize: true,
    });
    waveSurferRef.current = ws;

    return () => {
      waveSurferRef.current = null;
      ws.destroy();
    };
  }, []);

  useEffect(() => {
    // WaveSurfer doesn't watch the external media element's `src` attribute
    // for changes, so episode switches need an explicit reload of the
    // decoded waveform. Skip the very first run — `create()` above already
    // read whatever `src` was on the shared element at mount time.
    if (skipNextLoad.current) {
      skipNextLoad.current = false;
      return;
    }
    if (currentEpisode) void waveSurferRef.current?.load(currentEpisode.audioUrl);
  }, [currentEpisode]);

  return <div ref={containerRef} className={cn("w-full", className)} />;
}
