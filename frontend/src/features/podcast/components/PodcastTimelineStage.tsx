"use client";

import { PodcastWaveform } from "./PodcastWaveform";

/** Compact timeline — waveform graph only. */
export function PodcastTimelineStage() {
  return (
    <div className="flex min-w-0 flex-1 items-center py-0.5">
      <PodcastWaveform
        variant="premium"
        height={44}
        className="podcast-wave-premium min-h-[44px] w-full [&_wave]:cursor-pointer"
      />
    </div>
  );
}
