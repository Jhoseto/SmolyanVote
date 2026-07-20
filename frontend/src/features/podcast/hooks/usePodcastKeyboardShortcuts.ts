"use client";

import { useEffect } from "react";

interface Handlers {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/** Scoped to the full `/podcast` page only (mirrors legacy `podcast.js` — the mini player never captures keys). */
export function usePodcastKeyboardShortcuts({ onTogglePlay, onNext, onPrevious }: Handlers): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          onTogglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          onNext();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, onNext, onPrevious]);
}
