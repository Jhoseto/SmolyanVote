"use client";

import { useState } from "react";
import { Button, Card, ImageDropzone } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { CATEGORIES } from "../data/categories";
import { EMOTIONS } from "../data/emotions";
import { MAX_CONTENT_LENGTH } from "../schema";
import { useEditPublicationForm } from "../hooks/useEditPublicationForm";
import { LinkPreviewCard } from "./LinkPreviewCard";
import type { Publication } from "../types";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";

interface PublicationEditFormProps {
  publication: Publication;
  onSaved: () => void;
  onCancel: () => void;
}

/** Mirrors `PublicationComposer` fields, prefilled — used inline inside `PublicationDetailModal` (owner/admin only). */
export function PublicationEditForm({ publication, onSaved, onCancel }: PublicationEditFormProps) {
  const [emotionPickerOpen, setEmotionPickerOpen] = useState(false);

  const {
    form,
    onSubmit,
    isPending,
    newImage,
    setNewImage,
    emotion,
    setEmotion,
    linkUrl,
    setLinkUrl,
    linkMetadata,
    showLinkInput,
    setShowLinkInput,
    fetchLinkPreview,
    removeLink,
    isFetchingLinkPreview,
  } = useEditPublicationForm(publication, onSaved);
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card className="flex flex-col gap-4 p-4">
      <textarea
        {...register("content")}
        rows={4}
        maxLength={MAX_CONTENT_LENGTH}
        autoFocus
        placeholder="Напиши твоя пост..."
        className={cn(inputClass, "resize-none")}
      />
      <div className="flex items-center justify-between">
        {errors.content ? <p className="text-xs text-red-600">{errors.content.message}</p> : <span />}
        <span className="text-xs text-[color:var(--color-text-muted)]">
          {watch("content").length}/{MAX_CONTENT_LENGTH}
        </span>
      </div>

      {emotion && (
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-sm">
          <span>{emotion.emoji}</span>
          <span>
            се чувства <strong>{emotion.text}</strong>
          </span>
          <button
            type="button"
            onClick={() => setEmotion(null)}
            aria-label="Премахни настроението"
            className="ml-auto text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {publication.imageUrl && !newImage && (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
            <img src={publication.imageUrl} alt="" className="max-h-[280px] w-full object-cover" />
          </div>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Текуща снимка — качете нова по-долу, за да я замените (не може да се премахне без замяна).
          </p>
        </div>
      )}
      <ImageDropzone files={newImage ? [newImage] : []} onChange={(files) => setNewImage(files[0] ?? null)} maxFiles={1} />

      {showLinkInput && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void fetchLinkPreview();
                }
              }}
              onBlur={() => void fetchLinkPreview()}
              placeholder="Постави линк (YouTube, снимка, уебсайт...)"
              className={cn(inputClass, "flex-1")}
            />
            {(linkUrl || linkMetadata) && (
              <button
                type="button"
                onClick={removeLink}
                aria-label="Премахни линка"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-default/60 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
              >
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
          {isFetchingLinkPreview && (
            <p className="text-xs text-[color:var(--color-text-muted)]">Зареждане на визуализация…</p>
          )}
          {linkMetadata && <LinkPreviewCard metadata={linkMetadata} />}
        </div>
      )}

      <select {...register("category")} className={cn(inputClass, errors.category && "border-[color:var(--color-error)]")}>
        <option value="" disabled>
          Избери категория
        </option>
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5 border-t border-border-default/60 pt-3">
        <span className="text-xs font-medium text-[color:var(--color-text-muted)]">Добави към публикацията:</span>
        <button
          type="button"
          onClick={() => setShowLinkInput((v) => !v)}
          aria-label="Линк"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[color:var(--color-surface-muted)]",
            showLinkInput ? "text-primary" : "text-[color:var(--color-text-muted)]",
          )}
        >
          <i className="bi bi-link-45deg" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmotionPickerOpen((v) => !v)}
            aria-label="Настроение"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[color:var(--color-surface-muted)]",
              emotion ? "text-primary" : "text-[color:var(--color-text-muted)]",
            )}
          >
            <i className="bi bi-emoji-smile" />
          </button>
          {emotionPickerOpen && (
            <div className="absolute bottom-full left-0 z-10 mb-2 flex gap-1 rounded-[var(--radius-md)] border border-border-default/60 bg-white p-1.5 shadow-[var(--shadow-md)]">
              {EMOTIONS.map((e) => (
                <button
                  key={e.emoji}
                  type="button"
                  title={e.text}
                  onClick={() => {
                    setEmotion(e);
                    setEmotionPickerOpen(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-xl hover:bg-[color:var(--color-surface-muted)]"
                >
                  {e.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Отказ
        </Button>
        <Button type="submit" disabled={isPending || !isValid}>
          {isPending ? "Запазване…" : "Запази"}
        </Button>
      </div>
      </Card>
    </form>
  );
}
