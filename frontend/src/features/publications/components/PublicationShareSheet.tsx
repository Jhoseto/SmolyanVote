"use client";

import { useState, type ReactNode } from "react";
import { useToast } from "@/shared/hooks/useToast";
import { cn } from "@/shared/lib/cn";
import { shareToChat } from "@/shared/lib/shareToChat";
import { SocialModalShell } from "./SocialModalShell";

interface PublicationShareSheetProps {
  title: string;
  url: string;
  onShared?: () => void;
  className?: string;
  children?: ReactNode;
}

export function PublicationShareSheet({
  title,
  url,
  onShared,
  className,
  children,
}: PublicationShareSheetProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    toast.success("Линкът е копиран.");
    onShared?.();
    setOpen(false);
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, url });
      onShared?.();
      setOpen(false);
    } catch {
      /* cancelled */
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Сподели"
        className={
          className ??
          "inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-muted)] hover:text-primary"
        }
      >
        {children ?? (
          <>
            <i className="bi bi-share text-sm" aria-hidden />
            <span>Сподели</span>
          </>
        )}
      </button>

      <SocialModalShell open={open} onClose={() => setOpen(false)} title="Сподели" size="sm">
        <div className="flex flex-col gap-2 p-1">
          <button
            type="button"
            onClick={() => void nativeShare()}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm hover:bg-primary-50"
          >
            <i className="bi bi-share-fill text-primary" />
            Системен share / копирай
          </button>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm hover:bg-primary-50"
          >
            <i className="bi bi-link-45deg text-primary" />
            Копирай линк
          </button>
          <button
            type="button"
            onClick={() => {
              shareToChat({ url, title });
              onShared?.();
              setOpen(false);
            }}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm hover:bg-primary-50"
          >
            <i className="bi bi-chat-dots-fill text-primary" />
            Изпрати в чат
          </button>
          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onShared?.();
              setOpen(false);
            }}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm hover:bg-primary-50"
          >
            <i className={cn("bi bi-whatsapp text-[color:var(--color-success)]")} />
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onShared?.();
              setOpen(false);
            }}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm hover:bg-primary-50"
          >
            <i className="bi bi-facebook text-[#1877F2]" />
            Facebook
          </a>
        </div>
      </SocialModalShell>
    </>
  );
}
