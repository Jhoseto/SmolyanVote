"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDuration } from "../lib/formatDuration";
import type { PodcastEpisode } from "../types";
import { PodcastTimelineStage } from "./PodcastTimelineStage";

interface PodcastDockPlayerProps {
  episode: PodcastEpisode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onCyclePlaybackRate: () => void;
}

function Equalizer({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-gradient-to-t from-[#19861c] to-[#7dff8a]",
            active ? "animate-[podcast-bar_0.85s_ease-in-out_infinite]" : "h-1 opacity-35",
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

function DockIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full text-lg text-[color:var(--color-text-secondary)] transition-all duration-300 hover:text-primary"
    >
      <span className="absolute inset-0 rounded-full border border-black/[0.08] bg-[color:var(--color-surface-light)] transition-all duration-300 group-hover:border-primary/25 group-hover:bg-primary-50 group-hover:shadow-[0_0_20px_-8px_rgba(25,134,28,0.35)]" />
      <span className="relative">{children}</span>
    </button>
  );
}

function EpisodeDetailsPanel({
  episode,
  open,
  onClose,
  progressPct,
  currentTime,
  duration,
}: {
  episode: PodcastEpisode;
  open: boolean;
  onClose: () => void;
  progressPct: number;
  currentTime: number;
  duration: number;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-full left-0 z-30 w-full origin-bottom transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-[0.98] opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden rounded-t-[22px] border border-b-0 border-black/[0.08] bg-white shadow-[0_-24px_64px_-20px_rgba(25,134,28,0.22)]">
        <div className="h-[3px] bg-[linear-gradient(90deg,var(--color-primary-300),var(--color-primary),var(--color-primary-300))]" />

        <div className="sv-scrollbar relative max-h-[min(68vh,440px)] overflow-y-auto p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Затвори детайлите"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[color:var(--color-text-muted)] shadow-sm transition-colors hover:border-primary/25 hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-chevron-down" />
          </button>

          <div className="relative mb-4 overflow-hidden rounded-[18px] border border-black/[0.06] shadow-[0_12px_40px_-24px_rgba(25,134,28,0.25)]">
            {episode.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={episode.imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-primary-800 to-primary">
                <i className="bi bi-mic-fill text-5xl text-white/35" />
              </div>
            )}
            {episode.episodeNumber != null && (
              <span className="absolute left-3 top-3 inline-flex rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                Епизод {episode.episodeNumber}
              </span>
            )}
          </div>

          <p className="mb-3 font-display text-[1.05rem] font-bold leading-snug tracking-[-0.02em] text-[color:var(--color-text-heading)] sm:text-[1.12rem]">
            {episode.title}
          </p>

          <div className="space-y-2 text-[0.82rem] leading-relaxed text-[color:var(--color-text-muted)]">
            {episode.formattedPublishDate && (
              <p className="flex items-center gap-2">
                <i className="bi bi-calendar3 shrink-0 text-primary" />
                <span>{episode.formattedPublishDate}</span>
              </p>
            )}
            {episode.formattedDuration && (
              <p className="flex items-center gap-2">
                <i className="bi bi-clock shrink-0 text-primary" />
                <span>{episode.formattedDuration}</span>
              </p>
            )}
            {episode.listenCount != null && (
              <p className="flex items-center gap-2">
                <i className="bi bi-headphones shrink-0 text-primary" />
                <span>{episode.listenCount.toLocaleString("bg-BG")} прослушвания</span>
              </p>
            )}
            <p className="flex items-center gap-2 tabular-nums font-medium text-primary">
              <i className="bi bi-activity shrink-0" />
              <span>
                {progressPct}% · {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </p>
          </div>

          <div className="mt-4 border-t border-black/[0.06] pt-4">
            {episode.description ? (
              <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-[color:var(--color-text-secondary)]">
                {episode.description}
              </p>
            ) : (
              <p className="text-[0.84rem] italic text-[color:var(--color-text-muted)]">
                Няма добавено описание за този епизод.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Ultra-premium full-width dock — waveform center stage + expandable episode panel. */
export function PodcastDockPlayer({
  episode,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  onTogglePlay,
  onPrevious,
  onNext,
  onVolumeChange,
  onToggleMute,
  onCyclePlaybackRate,
}: PodcastDockPlayerProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const progressPct = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  useEffect(() => {
    setDetailsOpen(false);
  }, [episode?.id]);

  useEffect(() => {
    if (!detailsOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDetailsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1090]">
      <div className="pointer-events-auto relative overflow-visible border-t border-black/[0.08] bg-white/98 shadow-[0_-20px_60px_-24px_rgba(25,134,28,0.28)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(72,162,76,0.12),transparent_70%)]" />
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,rgba(25,134,28,0.35),rgba(72,162,76,0.55),rgba(25,134,28,0.35),transparent)]" />
        </div>

        {episode ? (
          <div className="relative flex h-[6.5rem] w-full items-stretch gap-2 px-2 sm:gap-4 sm:px-5 md:gap-6 md:px-7">
            {/* Left — now playing (click to expand) */}
            <div className="relative w-[min(30%,280px)] shrink-0 sm:w-[min(32%,300px)]">
              <EpisodeDetailsPanel
                episode={episode}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                progressPct={progressPct}
                currentTime={currentTime}
                duration={duration}
              />

              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                aria-expanded={detailsOpen}
                aria-label={detailsOpen ? "Скрий информацията за епизода" : "Покажи информацията за епизода"}
                className={cn(
                  "flex h-full w-full items-center gap-3 border-r border-black/[0.06] pr-3 text-left transition-colors sm:pr-4",
                  "rounded-lg hover:bg-[color:var(--color-surface-light)]",
                  detailsOpen && "bg-primary-50/80",
                )}
              >
                <div className="relative shrink-0">
                  {isPlaying && (
                    <>
                      <span className="absolute inset-0 rounded-[18px] bg-[#7dff8a]/20 animate-[podcast-halo_2.8s_ease-in-out_infinite]" />
                      <span
                        className="absolute inset-0 rounded-[18px] bg-[#7dff8a]/10 animate-[podcast-halo_2.8s_ease-in-out_infinite]"
                        style={{ animationDelay: "0.6s" }}
                      />
                    </>
                  )}
                  <div
                    className={cn(
                      "relative flex h-[3.6rem] w-[3.6rem] items-center justify-center overflow-hidden rounded-[18px] border border-black/[0.08] bg-[color:var(--color-surface-light)] shadow-[0_8px_24px_-12px_rgba(25,134,28,0.35)] sm:h-[3.85rem] sm:w-[3.85rem]",
                      isPlaying && "border-primary/40 ring-2 ring-primary/15",
                    )}
                  >
                    {episode.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={episode.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <i className="bi bi-mic-fill text-2xl text-primary/40" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Equalizer active={isPlaying} />
                    {episode.episodeNumber != null && (
                      <span className="rounded-full border border-primary/20 bg-primary-50 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-primary">
                        EP {episode.episodeNumber}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-display text-[0.9rem] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--color-text-heading)] sm:text-[0.98rem]">
                    {episode.title}
                  </p>
                  <p className="mt-1 hidden truncate text-[0.68rem] text-[color:var(--color-text-muted)] sm:block">
                    {episode.formattedPublishDate ?? "SmolyanVote Studio"} · Докосни за детайли
                  </p>
                </div>

                <i
                  className={cn(
                    "bi shrink-0 text-sm text-[color:var(--color-text-muted)] transition-transform duration-300",
                    detailsOpen ? "bi-chevron-down rotate-180 text-primary" : "bi-chevron-up",
                  )}
                />
              </button>
            </div>

            {/* Center — waveform only */}
            <PodcastTimelineStage />

            {/* Right — control capsule */}
            <div className="flex shrink-0 items-center">
              <div className="flex items-center gap-1.5 rounded-[999px] border border-black/[0.08] bg-[color:var(--color-surface-light)] p-1.5 pl-2 shadow-[0_8px_28px_-16px_rgba(25,134,28,0.3)] sm:gap-2 sm:p-2 sm:pl-2.5">
                <DockIconButton label="Предишен епизод" onClick={onPrevious}>
                  <i className="bi bi-skip-start-fill" />
                </DockIconButton>

                <div className="relative mx-0.5">
                  {isPlaying && (
                    <span className="pointer-events-none absolute -inset-1.5 rounded-full bg-[#7dff8a]/25 blur-md animate-[podcast-halo_2.4s_ease-in-out_infinite]" />
                  )}
                  <button
                    type="button"
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? "Пауза" : "Пусни"}
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(145deg,#5ae06f_0%,#19861c_48%,#0d4d12_100%)] text-[1.35rem] text-white shadow-[0_14px_36px_-14px_rgba(72,162,76,1),inset_0_2px_0_rgba(255,255,255,0.28),inset_0_-3px_8px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.05] sm:h-[3.25rem] sm:w-[3.25rem] sm:text-[1.45rem]",
                      isPlaying && "animate-[podcast-pulse_2.4s_ease-in-out_infinite]",
                    )}
                  >
                    <span className="absolute inset-[3px] rounded-full border border-white/25" />
                    <i className={cn("relative", isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill pl-0.5")} />
                  </button>
                </div>

                <DockIconButton label="Следващ епизод" onClick={onNext}>
                  <i className="bi bi-skip-end-fill" />
                </DockIconButton>

                <div className="mx-0.5 hidden h-8 w-px bg-black/[0.08] sm:block" />

                <button
                  type="button"
                  onClick={onCyclePlaybackRate}
                  aria-label="Скорост на възпроизвеждане"
                  className="hidden min-w-[3rem] rounded-full border border-primary/20 bg-primary-50 px-2.5 py-2 text-[0.72rem] font-bold tabular-nums text-primary transition-all hover:border-primary/35 hover:bg-primary-100 sm:inline-block"
                >
                  {playbackRate}x
                </button>

                <div className="hidden items-center gap-2 rounded-full border border-black/[0.08] bg-white px-2.5 py-1.5 lg:flex">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    aria-label={isMuted ? "Включи звука" : "Заглуши"}
                    className="text-base text-[color:var(--color-text-secondary)] transition-colors hover:text-primary"
                  >
                    <i
                      className={
                        isMuted || volume === 0 ? "bi bi-volume-mute-fill" : "bi bi-volume-up-fill"
                      }
                    />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="podcast-dock-volume w-[5rem] xl:w-24"
                    aria-label="Сила на звука"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex h-[5rem] w-full flex-col items-center justify-center gap-1 px-4">
            <div className="flex items-center gap-2 text-[0.88rem] text-[color:var(--color-text-secondary)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-primary-50">
                <i className="bi bi-mic text-primary" />
              </span>
              SmolyanVote Studio Player
            </div>
            <p className="text-[0.76rem] text-[color:var(--color-text-muted)]">Избери епизод от карусела или списъка</p>
          </div>
        )}
      </div>
    </div>
  );
}
