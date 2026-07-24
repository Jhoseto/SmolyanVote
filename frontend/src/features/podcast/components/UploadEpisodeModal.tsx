"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button, ImageDropzone } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useCreatePodcastEpisode } from "../hooks/useCreatePodcastEpisode";
import { formatDuration } from "../lib/formatDuration";
import { parseDurationInput } from "../lib/parseDurationInput";

const ARCHIVE_AUDIO_EXAMPLE =
  "https://ia902807.us.archive.org/11/items/pamporovoSvlachishte1/pamporovoSvlachishte1.mp3";

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;

const fieldLabelClass = "text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--color-text-muted)]";
const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-border-default/50 bg-white px-3.5 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15";

interface UploadEpisodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Admin-only "нов епизод" — external audio URL (Internet Archive) + optional cover. */
export function UploadEpisodeModal({ open, onOpenChange }: UploadEpisodeModalProps) {
  const { mutate, isPending } = useCreatePodcastEpisode();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [coverImage, setCoverImage] = useState<File[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setAudioUrl("");
    setDurationInput("");
    setCoverImage([]);
    setIsPublished(true);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) resetForm();
    onOpenChange(next);
  }

  function resolvedDurationSeconds(): number | null {
    return parseDurationInput(durationInput);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError("Заглавието трябва да е поне 3 символа.");
      return;
    }
    if (!audioUrl.trim()) {
      setError("Въведете директен линк към MP3 файла (Internet Archive).");
      return;
    }
    if (!/^https?:\/\/.+/i.test(audioUrl.trim())) {
      setError("Линкът трябва да започва с http:// или https://");
      return;
    }

    const durationSeconds = resolvedDurationSeconds();
    if (durationInput.trim() && durationSeconds == null) {
      setError("Времетраенето е невалидно. Използвайте формат mm:ss или h:mm:ss.");
      return;
    }

    mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        audioUrl: audioUrl.trim(),
        imageFile: coverImage[0] ?? null,
        durationSeconds,
        isPublished,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  }

  const canSubmit =
    title.trim().length >= 3 &&
    !!audioUrl.trim() &&
    !isPending &&
    (!durationInput.trim() || resolvedDurationSeconds() != null);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-slate-900/55 backdrop-blur-md transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-start justify-center overflow-y-auto p-3 outline-none sm:items-center sm:p-4">
          <form
            onSubmit={handleSubmit}
            className="my-4 flex w-full max-w-[560px] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-white/60 bg-white/98 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-all data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 sm:my-8"
          >
            <div className="relative shrink-0 overflow-hidden border-b border-border-default/50">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-50/90 via-white to-emerald-50/40" />
              <div className="relative flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_14px_rgba(25,134,28,0.35)]">
                    <i className="bi bi-mic-fill text-base" />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="truncate font-display text-base font-semibold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
                      Нов епизод
                    </Dialog.Title>
                    <p className="truncate text-xs text-[color:var(--color-text-muted)]">
                      Линк от Internet Archive + корица (по избор)
                    </p>
                  </div>
                </div>
                <Dialog.Close
                  aria-label="Затвори"
                  disabled={isPending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-text-primary)]"
                >
                  <i className="bi bi-x-lg" />
                </Dialog.Close>
              </div>
            </div>

            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Заглавие</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={TITLE_MAX_LENGTH}
                  placeholder="Напр. Пампорово — слягане на сняг"
                  className={fieldClass}
                  autoFocus
                />
                <span className="self-end text-xs text-[color:var(--color-text-muted)]">
                  {title.length}/{TITLE_MAX_LENGTH}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  placeholder="За какво разказва епизодът…"
                  className={cn(fieldClass, "resize-none")}
                />
                <span className="self-end text-xs text-[color:var(--color-text-muted)]">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Линк към аудио (MP3)</label>
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => {
                    setAudioUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder={ARCHIVE_AUDIO_EXAMPLE}
                  className={fieldClass}
                  required
                />
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Директен линк към MP3 от{" "}
                  <a
                    href="https://archive.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Internet Archive
                  </a>
                  . Пример:{" "}
                  <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => setAudioUrl(ARCHIVE_AUDIO_EXAMPLE)}
                  >
                    archive.org/…/file.mp3
                  </button>
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Времетраене</label>
                <input
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="45:30 или 1:05:20"
                  className={fieldClass}
                />
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Формат mm:ss или h:mm:ss.
                  {durationInput.trim() && resolvedDurationSeconds() != null
                    ? ` · ${formatDuration(resolvedDurationSeconds()!)}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Корица (по избор)</label>
                <ImageDropzone
                  files={coverImage}
                  onChange={setCoverImage}
                  maxFiles={1}
                  onError={setError}
                  acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                  maxSizeBytes={8 * 1024 * 1024}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-border-default/40 bg-[color:var(--color-surface-light)]/60 px-3.5 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[color:var(--color-text-primary)]">Публикувай веднага</span>
              </label>

              {error && (
                <p className="flex items-start gap-1.5 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-xs text-red-700">
                  <i className="bi bi-exclamation-circle mt-0.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-default/40 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-5">
              <Dialog.Close
                render={
                  <Button type="button" variant="outline" disabled={isPending}>
                    Отказ
                  </Button>
                }
              />
              <Button type="submit" disabled={!canSubmit} className="shadow-[0_4px_14px_rgba(25,134,28,0.3)]">
                {isPending ? "Запис…" : "Публикувай епизод"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
