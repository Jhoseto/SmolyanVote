"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { cn } from "@/shared/lib/cn";

const SPEEDS = [1, 1.5, 2] as const;

function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface VoiceMessageBubbleProps {
  src: string;
  isOwn: boolean;
  durationHint?: number | null;
}

/** Waveform playback for voice notes, with 1x / 1.5x / 2x speed. */
export function VoiceMessageBubble({ src, isOwn }: VoiceMessageBubbleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const wave = WaveSurfer.create({
      container: containerRef.current,
      height: 28,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
      waveColor: isOwn ? "rgba(255,255,255,.45)" : "rgba(25,134,28,.28)",
      progressColor: isOwn ? "#ffffff" : "#19861c",
      url: src,
    });
    waveRef.current = wave;

    wave.on("ready", () => setDuration(wave.getDuration()));
    wave.on("audioprocess", () => setElapsed(wave.getCurrentTime()));
    wave.on("interaction", () => setElapsed(wave.getCurrentTime()));
    wave.on("play", () => setPlaying(true));
    wave.on("pause", () => setPlaying(false));
    wave.on("finish", () => {
      setPlaying(false);
      setElapsed(0);
    });

    return () => {
      wave.destroy();
      waveRef.current = null;
    };
  }, [src, isOwn]);

  function toggle() {
    void waveRef.current?.playPause();
  }

  function cycleSpeed() {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    waveRef.current?.setPlaybackRate(SPEEDS[next], true);
  }

  return (
    <div className="flex min-w-[220px] items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Пауза" : "Възпроизведи"}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isOwn ? "bg-white/20 text-white hover:bg-white/30" : "bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]",
        )}
      >
        <i className={cn("bi", playing ? "bi-pause-fill" : "bi-play-fill")} />
      </button>

      <div className="min-w-0 flex-1">
        <div ref={containerRef} className="w-full" />
        <span className="sv-msg-num text-[10px] opacity-75">
          {clock(elapsed)} / {clock(duration)}
        </span>
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        aria-label="Смени скоростта на възпроизвеждане"
        className={cn(
          "sv-msg-num shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold",
          isOwn ? "bg-white/20 text-white" : "bg-[color:var(--color-surface-light)] text-[color:var(--color-text-secondary)]",
        )}
      >
        {SPEEDS[speedIndex]}x
      </button>
    </div>
  );
}
