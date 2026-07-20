"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

const DEFAULT_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const DEFAULT_MAX_SIZE_BYTES = 8 * 1024 * 1024;

interface ImageDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
  /** Surfaced inline instead of being thrown — a rejected file must not silently disappear. */
  onError?: (message: string) => void;
  /** Overrides for callers with stricter backend limits (e.g. signals: 5MB, no GIF). */
  acceptedTypes?: string[];
  maxSizeBytes?: number;
}

/**
 * Generic multi-image picker (drag & drop + click-to-browse) with previews
 * and per-file removal. No feature-specific knowledge — validation limits
 * (type/size) mirror the backend's own checks (`EventsController`), so
 * users get instant feedback instead of a round-trip 400.
 */
export function ImageDropzone({
  files,
  onChange,
  maxFiles = 3,
  className,
  onError,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
}: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const maxSizeMb = Math.round(maxSizeBytes / (1024 * 1024));

  function addFiles(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;

    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!acceptedTypes.includes(file.type)) {
        onError?.(`„${file.name}" не е поддържан формат.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        onError?.(`„${file.name}" е по-голям от ${maxSizeMb}MB.`);
        continue;
      }
      accepted.push(file);
    }

    const combined = [...files, ...accepted];
    if (combined.length > maxFiles) {
      onError?.(`Може да качите най-много ${maxFiles} снимки.`);
    }
    onChange(combined.slice(0, maxFiles));
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const canAddMore = files.length < maxFiles;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {canAddMore && (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-border-default/60 bg-[color:var(--color-surface-muted)] px-4 py-6 text-center transition-colors",
            dragActive && "border-primary bg-primary-50",
          )}
        >
          <i className="bi bi-cloud-arrow-up text-2xl text-[color:var(--color-text-muted)]" />
          <span className="text-sm text-[color:var(--color-text-secondary)]">
            Пуснете снимки тук или <span className="font-medium text-primary">изберете файлове</span>
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            До {maxFiles} снимки · до {maxSizeMb}MB всяка
          </span>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((file, index) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={`${file.name}-${index}`}
                className="group relative h-24 w-24 overflow-hidden rounded-[var(--radius-md)] border border-border-default/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  src={url}
                  alt={file.name}
                  className="h-full w-full object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Премахни ${file.name}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <i className="bi bi-x-lg text-xs" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
