"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { usePodcastPlayer } from "../hooks/usePodcastPlayer";
import { formatDuration } from "../lib/formatDuration";

/**
 * Floating widget mounted app-wide in `AppProviders` — port of legacy
 * `podcast-window.js`, but an in-app persistent bar instead of a separate
 * `window.open` popup (MODERN_FRONTEND_PLAN §Фаза 6). Reads the same
 * module-singleton `<audio>` element as `<PodcastPlayer/>`, so it never
 * restarts playback; hidden on `/podcast` itself where the full player already shows the same controls.
 */
export function PodcastMiniPlayer() {
  const pathname = usePathname();
  const { currentEpisode, isPlaying, currentTime, duration, togglePlay, seekTo, playNext, playPrevious, close } =
    usePodcastPlayer();

  if (!currentEpisode || pathname === "/podcast") return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  function handleSeek(e: MouseEvent<HTMLDivElement>) {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * duration);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1080] border-t border-border-default/60 bg-white shadow-[var(--shadow-dropdown)]">
      <div onClick={handleSeek} className="h-1.5 w-full cursor-pointer bg-[color:var(--color-surface-muted)]">
        <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto flex max-w-[900px] items-center gap-3 px-4 py-2.5">
        <Link href="/podcast" className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[color:var(--color-surface-muted)]">
            {currentEpisode.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote/Cloudinary cover art
              <img src={currentEpisode.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <i className="bi bi-mic-fill text-[color:var(--color-text-muted)]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">{currentEpisode.title}</p>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={playPrevious}
            aria-label="Предишен епизод"
            className="text-lg text-[color:var(--color-text-secondary)] hover:text-primary"
          >
            <i className="bi bi-skip-start-fill" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Пауза" : "Пусни"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white"
          >
            <i className={cn("bi", isPlaying ? "bi-pause-fill" : "bi-play-fill")} />
          </button>
          <button
            type="button"
            onClick={playNext}
            aria-label="Следващ епизод"
            className="text-lg text-[color:var(--color-text-secondary)] hover:text-primary"
          >
            <i className="bi bi-skip-end-fill" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Затвори плейъра"
            className="text-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
