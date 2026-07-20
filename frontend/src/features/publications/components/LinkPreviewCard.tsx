import { cn } from "@/shared/lib/cn";
import type { LinkMetadata } from "../types";

/**
 * Renders the parsed `linkMetadata` — used both live in the composer (while
 * typing a link) and in the feed card for already-published posts.
 */
export function LinkPreviewCard({ metadata, className }: { metadata: LinkMetadata; className?: string }) {
  return (
    <a
      href={metadata.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 transition-colors hover:border-primary/40",
        className,
      )}
    >
      {metadata.type === "youtube" && metadata.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail */}
          <img src={metadata.thumbnail} alt={metadata.title ?? "YouTube"} className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <i className="bi bi-play-circle-fill text-5xl text-white/90 drop-shadow" />
          </span>
        </div>
      )}

      {metadata.type === "image" && metadata.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- remote image
        <img src={metadata.imageUrl} alt={metadata.title ?? "Изображение"} className="max-h-[420px] w-full object-cover" />
      )}

      {metadata.type === "website" && (
        <div className="flex items-center gap-3 p-3">
          {metadata.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote og:image
            <img src={metadata.image} alt="" className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-surface-muted)]">
              <i className="bi bi-link-45deg text-xl text-[color:var(--color-text-muted)]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
              {metadata.title ?? metadata.domain ?? metadata.url}
            </p>
            {metadata.description && (
              <p className="line-clamp-2 text-xs text-[color:var(--color-text-secondary)]">{metadata.description}</p>
            )}
            {metadata.domain && (
              <p className="mt-0.5 truncate text-[0.7rem] uppercase text-[color:var(--color-text-muted)]">
                {metadata.domain}
              </p>
            )}
          </div>
        </div>
      )}

      {(metadata.type === "youtube" || metadata.type === "image") && metadata.title && (
        <div className="p-2.5">
          <p className="truncate text-sm font-medium text-[color:var(--color-text-primary)]">{metadata.title}</p>
          {metadata.description && (
            <p className="truncate text-xs text-[color:var(--color-text-muted)]">{metadata.description}</p>
          )}
        </div>
      )}
    </a>
  );
}
