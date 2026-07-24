"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Avatar, Button, Card, ImageDropzone, LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { CATEGORIES } from "../data/categories";
import { EMOTIONS } from "../data/emotions";
import { MAX_CONTENT_LENGTH } from "../schema";
import { useCreatePublicationForm } from "../hooks/useCreatePublicationForm";
import { LinkPreviewCard } from "./LinkPreviewCard";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";

/**
 * Composer bar (collapsed) → expanded form (image/link/emotion pickers +
 * category + submit). Mirrors the legacy `#createPostExpanded` fields —
 * `title`/`excerpt` stay auto-derived from `content`, never user-facing.
 */
export function PublicationComposer({
  forceExpanded = false,
  onExpandedChange,
}: {
  forceExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
} = {}) {
  const { isAuthenticated, user } = useAuth();
  const canInteract = useCanInteract();
  const requireAuth = useRequireAuth();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [emotionPickerOpen, setEmotionPickerOpen] = useState(false);

  const {
    form,
    onSubmit,
    isPending,
    isUploadingImage,
    expanded,
    setExpanded,
    image,
    setImage,
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
    cancel,
    hasDraft,
  } = useCreatePublicationForm();
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = form;

  const { ref: contentRef, ...contentField } = register("content");

  useEffect(() => {
    if (forceExpanded && isAuthenticated) setExpanded(true);
  }, [forceExpanded, isAuthenticated, setExpanded]);

  useEffect(() => {
    if (!expanded) onExpandedChange?.(false);
    // Only notify parent when collapsing (clears ?compose=)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-firing on unstable callback identity
  }, [expanded]);

  function onPasteImage(e: ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    setImage(file);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isPending && isValid) void onSubmit();
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="flex flex-col items-center gap-2 p-5 text-center">
        <i className="bi bi-person-circle text-2xl text-[color:var(--color-text-muted)]" />
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Влезте в профила си, за да създавате публикации.
        </p>
        <Button size="sm" onClick={() => void requireAuth("да създадеш публикация")}>
          Вход
        </Button>
      </Card>
    );
  }

  if (!canInteract) {
    return (
      <Card className="flex flex-col items-center gap-2 border-amber-200/80 bg-amber-50/60 p-5 text-center">
        <i className="bi bi-shield-exclamation text-2xl text-amber-600" />
        <p className="text-sm text-amber-950">
          Профилът ви е временно ограничен. Можете само да разглеждате публикации.
        </p>
      </Card>
    );
  }

  async function expandWith(mode?: "photo" | "mood") {
    if (!(await requireAuth("да създадеш публикация"))) return;
    setExpanded(true);
    if (mode === "photo") {
      /* ImageDropzone appears in expanded form */
    }
    if (mode === "mood") setEmotionPickerOpen(true);
  }

  if (!expanded) {
    return (
      <Card className="flex flex-col gap-2 p-3.5">
        <div className="flex items-center gap-3">
          <Avatar username={user?.username ?? "?"} imageUrl={user?.imageUrl} size={40} />
          <button
            type="button"
            onClick={() => void expandWith()}
            className="flex-1 rounded-[var(--radius-pill)] border border-border-default/60 bg-[color:var(--color-surface-muted)] px-4 py-2.5 text-left text-sm text-[color:var(--color-text-muted)] transition-colors hover:border-primary/40"
          >
            {hasDraft
              ? "Продължи черновата…"
              : `Какво мислиш, ${user?.username ?? "потребител"}?`}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 border-t border-border-default/40 pt-2">
          <button
            type="button"
            onClick={() => void expandWith()}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-pencil-square text-primary" />
            <span className="hidden sm:inline">Публикация</span>
          </button>
          <button
            type="button"
            onClick={() => void expandWith("photo")}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-image text-[color:var(--color-info)]" />
            <span className="hidden sm:inline">Снимка</span>
          </button>
          <button
            type="button"
            onClick={() => void expandWith("mood")}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <i className="bi bi-emoji-smile text-[color:var(--color-warning)]" />
            <span className="hidden sm:inline">Настроение</span>
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="relative flex flex-col gap-4 overflow-hidden p-4"
      aria-busy={isPending}
    >
      {isPending && (
        <LogoLoader
          overlay
          size="md"
          label={
            isUploadingImage
              ? "Качване на снимка… Моля, изчакайте."
              : "Публикуване… Моля, изчакайте."
          }
        />
      )}
      <textarea
        ref={(el) => {
          contentRef(el);
          textareaRef.current = el;
        }}
        {...contentField}
        onPaste={onPasteImage}
        onKeyDown={onKeyDown}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
        rows={3}
        maxLength={MAX_CONTENT_LENGTH}
        autoFocus
        placeholder="Напиши твоя пост… (Ctrl/⌘+Enter за публикуване)"
        className={cn(inputClass, "resize-none")}
      />
      <div className="flex items-center justify-between">
        {errors.content ? (
          <p className="text-xs text-red-600">{errors.content.message}</p>
        ) : (
          <span />
        )}
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

      <ImageDropzone files={image ? [image] : []} onChange={(files) => setImage(files[0] ?? null)} maxFiles={1} />

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

      <select
        {...register("category")}
        className={cn(inputClass, errors.category && "border-[color:var(--color-error)]")}
      >
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

      <div className="flex items-center justify-between gap-2">
        {hasDraft ? (
          <span className="text-xs text-[color:var(--color-text-muted)]">
            <i className="bi bi-cloud-check" /> Черновата се пази локално
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={cancel} disabled={isPending}>
            Отказ
          </Button>
          <Button type="submit" onClick={onSubmit} disabled={isPending || !isValid}>
            {isPending ? "Публикуване…" : "Публикувай"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
