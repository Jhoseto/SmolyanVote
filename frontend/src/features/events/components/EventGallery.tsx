"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/shared/lib/cn";

/** Hero image + thumbnail strip, click opens the full lightbox (plan §Simple event detail). */
export function EventGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(-1);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIndex(0)}
        className="block aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--color-surface-muted)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs */}
        <img src={images[0]} alt={title} className="h-full w-full object-cover" />
      </button>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
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
        slides={images.map((src) => ({ src }))}
      />
    </div>
  );
}
