"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/shared/lib/cn";

const PLACEHOLDER_COVER = /\/images\/eventImages\/default/i;

function galleryImagesFrom(images: string[]): string[] {
  const uploaded = images.map((src) => src?.trim()).filter((src): src is string => Boolean(src && !PLACEHOLDER_COVER.test(src)));
  return uploaded.length > 0 ? uploaded : images.filter(Boolean);
}

/** Hero image + thumbnail strip, click opens the full lightbox (plan §Simple event detail). */
export function EventGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(-1);
  const galleryImages = galleryImagesFrom(images);

  if (galleryImages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIndex(0)}
        className="block aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
        <img src={galleryImages[0]} alt={title} className="h-full w-full object-cover" />
      </button>

      {galleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {galleryImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-colors",
                i === 0 ? "border-primary" : "border-transparent hover:border-primary/40",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={galleryImages.map((src) => ({ src }))}
      />
    </div>
  );
}
