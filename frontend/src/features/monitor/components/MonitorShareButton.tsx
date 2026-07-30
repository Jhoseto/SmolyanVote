"use client";

import { useCallback, useState } from "react";
import { cn } from "@/shared/lib/cn";

interface MonitorShareButtonProps {
  title: string;
  className?: string;
}

export function MonitorShareButton({ title, className }: MonitorShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [title]);

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border-default/40 bg-white px-4 py-2 text-[0.85rem] font-medium text-[color:var(--color-text-secondary)] transition hover:border-primary/30 hover:text-primary",
        className,
      )}
    >
      <i className={cn("bi", copied ? "bi-check2" : "bi-share")} />
      {copied ? "Копирано" : "Сподели"}
    </button>
  );
}
