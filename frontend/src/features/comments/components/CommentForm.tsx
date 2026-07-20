"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";

const MAX_LENGTH = 2000;

interface CommentFormProps {
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  isPending?: boolean;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
}

/** Shared textarea for new comments, replies and inline edits — char counter (max 2000, matches backend). */
export function CommentForm({
  initialValue = "",
  placeholder = "Напишете коментар…",
  submitLabel = "Публикувай",
  autoFocus,
  isPending,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [text, setText] = useState(initialValue);
  const trimmed = text.trim();
  const remaining = MAX_LENGTH - text.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || isPending) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        placeholder={placeholder}
        rows={3}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(e);
          if (e.key === "Escape") onCancel?.();
        }}
        className="w-full resize-none rounded-[var(--radius-md)] border border-border-default/60 bg-white p-3 text-sm outline-none transition-colors focus:border-primary"
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs ${remaining < 100 ? "text-[color:var(--color-error)]" : "text-[color:var(--color-text-muted)]"}`}
        >
          {remaining} символа остават
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-[color:var(--color-text-muted)] hover:text-primary"
            >
              Отказ
            </button>
          )}
          <Button type="submit" size="sm" disabled={!trimmed || isPending}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
