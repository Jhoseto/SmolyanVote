"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import {
  mountPodcastWaveform,
  syncPodcastWaveform,
  unmountPodcastWaveform,
} from "../lib/podcastWaveformController";
import { usePodcastPlayerStore } from "../store/podcastPlayerStore";

interface PodcastWaveformProps {
  className?: string;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
  height?: number;
  variant?: "default" | "premium";
}

function createVerticalGradient(height: number, stops: [number, string][]): CanvasGradient {
  const canvas = document.createElement("canvas");
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color);
  }
  return gradient;
}

/**
 * WaveSurfer waveform bound to the shared module-singleton `<audio>` element.
 * Uses a module singleton instance so navigation does not destroy/redraw peaks.
 */
export function PodcastWaveform({
  className,
  waveColor = "#5aab5e",
  progressColor = "#0f6b12",
  cursorColor = "#19861c",
  height = 44,
  variant = "default",
}: PodcastWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentEpisode = usePodcastPlayerStore((s) => s.currentEpisode);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options =
      variant === "premium"
        ? {
            height,
            waveColor: createVerticalGradient(height, [
              [0, "#c5e8c9"],
              [0.45, "#72b876"],
              [1, "#4a9150"],
            ]),
            progressColor: createVerticalGradient(height, [
              [0, "#a8f5ae"],
              [0.35, "#5cd364"],
              [0.7, "#19861c"],
              [1, "#0a4d0d"],
            ]),
            cursorColor: "#ffffff",
            barWidth: 2,
            barGap: 2,
            barRadius: 3,
          }
        : {
            height,
            waveColor,
            progressColor,
            cursorColor,
            barWidth: 3,
            barGap: 1,
            barRadius: 2,
          };

    mountPodcastWaveform(container, options);
    syncPodcastWaveform(usePodcastPlayerStore.getState().currentEpisode?.audioUrl);

    return () => {
      unmountPodcastWaveform(container);
    };
  }, [variant, height, waveColor, progressColor, cursorColor]);

  useEffect(() => {
    syncPodcastWaveform(currentEpisode?.audioUrl);
  }, [currentEpisode?.audioUrl]);

  return <div ref={containerRef} className={cn("w-full", className)} />;
}
