"use client";

import type { ImageRef } from "../types";

interface ExistingImagesManagerProps {
  images: ImageRef[];
  deletedIds: number[];
  onToggle: (id: number) => void;
}

/**
 * Admin inline-edit: shows the event's current images with a per-image
 * mark-for-delete toggle. Nothing is removed until the form is submitted —
 * toggling again undoes the mark (no destructive action on click).
 */
export function ExistingImagesManager({ images, deletedIds, onToggle }: ExistingImagesManagerProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-[color:var(--color-text-primary)]">
        Съществуващи снимки
      </label>
      <div className="flex flex-wrap gap-3">
        {images.map((image) => {
          const marked = deletedIds.includes(image.id);
          return (
            <div
              key={image.id}
              className="group relative h-24 w-24 overflow-hidden rounded-[var(--radius-md)] border border-border-default/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL, no next/image domain config needed here */}
              <img
                src={image.url}
                alt="Снимка"
                className={`h-full w-full object-cover transition-opacity ${marked ? "opacity-30" : ""}`}
              />
              {marked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-xs font-medium text-white">Ще бъде изтрита</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onToggle(image.id)}
                aria-label={marked ? "Отмени изтриването" : "Изтрий снимката"}
                className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-white transition-opacity ${
                  marked
                    ? "bg-primary opacity-100"
                    : "bg-black/60 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                }`}
              >
                <i className={`bi ${marked ? "bi-arrow-counterclockwise" : "bi-x-lg"} text-xs`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
