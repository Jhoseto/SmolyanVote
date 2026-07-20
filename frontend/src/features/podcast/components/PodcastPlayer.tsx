"use client";

import dynamic from "next/dynamic";
import { Card, Skeleton } from "@/shared/ui";
import { usePodcastPlayer } from "../hooks/usePodcastPlayer";
import { useDeepLinkAutoplay } from "../hooks/useDeepLinkAutoplay";
import { usePodcastKeyboardShortcuts } from "../hooks/usePodcastKeyboardShortcuts";
import { formatDuration } from "../lib/formatDuration";
import { EpisodeList } from "./EpisodeList";
import { PodcastSubscribeButton } from "./PodcastSubscribeButton";

const PodcastWaveform = dynamic(
  () => import("./PodcastWaveform").then((m) => m.PodcastWaveform),
  {
    ssr: false,
    loading: () => <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />,
  },
);

/** Full `/podcast` page player (MODERN_FRONTEND_PLAN §Фаза 6) — waveform, transport controls, episode list. */
export function PodcastPlayer() {
  useDeepLinkAutoplay();

  const {
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
    playEpisode,
    togglePlay,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
  } = usePodcastPlayer();

  usePodcastKeyboardShortcuts({ onTogglePlay: togglePlay, onNext: playNext, onPrevious: playPrevious });

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-text-heading)]">Подкаст</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">Разговори за живота в Смолян.</p>
        </div>
        <PodcastSubscribeButton />
      </div>

      <Card className="flex flex-col gap-4 p-5">
        {currentEpisode ? (
          <>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]">
                {currentEpisode.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote/Cloudinary cover art
                  <img src={currentEpisode.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <i className="bi bi-mic-fill text-3xl text-[color:var(--color-text-muted)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-lg font-semibold text-[color:var(--color-text-heading)]">
                  {currentEpisode.title}
                </p>
                {currentEpisode.formattedPublishDate && (
                  <p className="text-sm text-[color:var(--color-text-muted)]">{currentEpisode.formattedPublishDate}</p>
                )}
              </div>
            </div>

            <PodcastWaveform />

            <div className="flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={playPrevious}
                aria-label="Предишен епизод"
                className="text-2xl text-[color:var(--color-text-secondary)] transition-colors hover:text-primary"
              >
                <i className="bi bi-skip-start-fill" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Пауза" : "Пусни"}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-2xl text-white shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-lg)]"
              >
                <i className={isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"} />
              </button>
              <button
                type="button"
                onClick={playNext}
                aria-label="Следващ епизод"
                className="text-2xl text-[color:var(--color-text-secondary)] transition-colors hover:text-primary"
              >
                <i className="bi bi-skip-end-fill" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Включи звука" : "Заглуши"}
                className="text-lg text-[color:var(--color-text-secondary)] transition-colors hover:text-primary"
              >
                <i className={isMuted || volume === 0 ? "bi bi-volume-mute-fill" : "bi bi-volume-up-fill"} />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1.5 w-32 accent-[var(--color-primary)]"
                aria-label="Сила на звука"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-[color:var(--color-text-muted)]">
            <i className="bi bi-mic text-3xl" />
            <p>Избери епизод от списъка, за да го пуснеш.</p>
          </div>
        )}
      </Card>

      <EpisodeList
        episodes={episodes}
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
        currentEpisodeId={currentEpisode?.id ?? null}
        isPlaying={isPlaying}
        onSelect={playEpisode}
      />
    </div>
  );
}
