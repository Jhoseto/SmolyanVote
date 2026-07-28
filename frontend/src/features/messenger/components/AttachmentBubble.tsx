"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/shared/lib/cn";
import type { Message } from "../types";
import { VoiceMessageBubble } from "./VoiceMessageBubble";

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconForMime(mime: string | null | undefined): string {
  if (!mime) return "bi-file-earmark";
  if (mime.includes("pdf")) return "bi-file-earmark-pdf";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z")) return "bi-file-earmark-zip";
  if (mime.includes("word") || mime.includes("document")) return "bi-file-earmark-word";
  if (mime.includes("sheet") || mime.includes("excel")) return "bi-file-earmark-spreadsheet";
  if (mime.startsWith("video/")) return "bi-file-earmark-play";
  if (mime.startsWith("text/")) return "bi-file-earmark-text";
  return "bi-file-earmark";
}

/** Renders the media part of a message: image, voice note or generic file. */
export function AttachmentBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const src = message.attachmentUrl ?? message.localPreviewUrl;
  if (!src) return null;

  const uploading = message.sendState === "pending" && !message.attachmentUrl;
  const mime = message.attachmentMime ?? "";

  if (mime.startsWith("audio/")) {
    return <VoiceMessageBubble src={src} isOwn={isOwn} durationHint={message.attachmentSize} />;
  }

  if (mime.startsWith("image/")) {
    return (
      <>
        <button
          type="button"
          onClick={() => !uploading && setLightboxOpen(true)}
          className="relative block overflow-hidden rounded-[var(--radius-md)]"
          aria-label={message.attachmentName ?? "Отвори снимката"}
        >
          <Image
            src={src}
            alt={message.attachmentName ?? "Прикачена снимка"}
            width={320}
            height={320}
            unoptimized
            className={cn(
              "h-auto max-h-[320px] w-auto max-w-full object-contain transition-[filter]",
              uploading && "blur-[6px]",
            )}
          />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/15">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            </span>
          )}
        </button>

        {lightboxOpen && (
          <Lightbox
            open
            close={() => setLightboxOpen(false)}
            plugins={[Zoom]}
            slides={[{ src, alt: message.attachmentName ?? "" }]}
            controller={{ closeOnBackdropClick: true }}
          />
        )}
      </>
    );
  }

  return (
    <a
      href={uploading ? undefined : src}
      target="_blank"
      rel="noopener noreferrer"
      download={message.attachmentName ?? undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 transition-colors",
        isOwn ? "bg-white/15 hover:bg-white/25" : "bg-[color:var(--color-surface-light)] hover:bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
          isOwn ? "bg-white/20 text-white" : "bg-white text-[color:var(--color-primary)]",
        )}
      >
        {uploading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
        ) : (
          <i className={cn("bi", iconForMime(mime))} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">
          {message.attachmentName ?? "Файл"}
        </span>
        <span className="sv-msg-num block text-[11px] opacity-70">
          {formatBytes(message.attachmentSize)}
        </span>
      </span>
    </a>
  );
}
