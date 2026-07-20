"use client";

import { useToast } from "@/shared/hooks/useToast";

interface ShareButtonProps {
  title: string;
  className?: string;
  /** Defaults to the current page URL — pass explicitly for list items (a card isn't its own page/URL). */
  url?: string;
  /** Called after a successful share/copy (not on cancel) — e.g. to record a share count server-side. */
  onShared?: () => void;
}

/** Native share sheet on mobile, clipboard-copy fallback on desktop — domain-agnostic. */
export function ShareButton({ title, className, url: urlProp, onShared }: ShareButtonProps) {
  const toast = useToast();

  async function handleShare() {
    const url = urlProp ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        onShared?.();
      } catch {
        /* user cancelled the native share sheet */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Линкът е копиран.");
    onShared?.();
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className ?? "inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-muted)] hover:text-primary"}
    >
      <i className="bi bi-share-fill" />
      Сподели
    </button>
  );
}
