"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { isEmojiOnly, linkifyText } from "../lib/linkify";
import { messengerApi } from "../api";
import { messagesQueryKey } from "../hooks/useMessages";
import { upsertMessage } from "../lib/cacheUpdates";
import { TRANSLATE_LANGUAGES, type Message, type TranslateLanguage } from "../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  searchQuery?: string;
  onReply?: (message: Message) => void;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5 text-inherit">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function MessageBubble({ message, isOwn, searchQuery = "", onReply }: MessageBubbleProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canInteract = useCanInteract();
  const [langOpen, setLangOpen] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const emojiOnly = isEmojiOnly(message.text);
  const displayText = translated ?? message.text;

  const translate = useMutation({
    mutationFn: (lang: TranslateLanguage) => messengerApi.translateAndSave(message.id, lang),
    onSuccess: (res) => {
      setTranslated(res.translatedText);
      setLangOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err, "Преводът не успя.")),
  });

  const editMut = useMutation({
    mutationFn: (newText: string) => messengerApi.editMessage(message.id, newText),
    onSuccess: (updated) => {
      upsertMessage(queryClient, updated);
      setEditing(false);
      toast.success("Съобщението е редактирано");
    },
    onError: (err) => toast.error(errorMessage(err, "Редакцията не успя.")),
  });

  const deleteMut = useMutation({
    mutationFn: () => messengerApi.deleteMessage(message.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messagesQueryKey(message.conversationId) });
      toast.success("Съобщението е изтрито");
    },
    onError: (err) => toast.error(errorMessage(err, "Изтриването не успя.")),
  });

  return (
    <div
      className={cn("group relative flex", isOwn ? "justify-end" : "justify-start")}
      onMouseLeave={() => setLangOpen(false)}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-[var(--radius-md)] px-3 py-2",
          emojiOnly
            ? "bg-transparent px-1 py-0 text-3xl"
            : isOwn
              ? "bg-[image:var(--gradient-primary)] text-white"
              : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-primary)]",
        )}
        onClick={() => {
          if (!isOwn && !emojiOnly) setLangOpen((v) => !v);
        }}
      >
        {message.parentMessageText && (
          <p
            className={cn(
              "mb-1 border-l-2 pl-2 text-xs opacity-80",
              isOwn ? "border-white/60" : "border-primary/50",
            )}
          >
            {message.parentMessageText}
          </p>
        )}

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, 3000))}
              rows={2}
              className="w-full rounded border border-white/40 bg-white/10 p-1 text-sm text-white outline-none"
            />
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => editMut.mutate(editText.trim())} disabled={!editText.trim()}>
                Запази
              </button>
              <button type="button" onClick={() => setEditing(false)}>
                Отказ
              </button>
            </div>
          </div>
        ) : (
          <>
            {!emojiOnly && (
              <p
                className={cn(
                  "whitespace-pre-wrap break-words text-sm leading-relaxed",
                  isOwn && "[&_a]:text-white [&_a]:underline",
                )}
              >
                {searchQuery
                  ? highlight(displayText, searchQuery)
                  : translated
                    ? displayText
                    : linkifyText(displayText)}
              </p>
            )}
            {emojiOnly && <p>{message.text}</p>}
            {translated && (
              <p className={cn("mt-1 text-[10px]", isOwn ? "text-white/70" : "text-[color:var(--color-text-muted)]")}>
                превод ·{" "}
                <button type="button" className="underline" onClick={() => setTranslated(null)}>
                  оригинален текст
                </button>
              </p>
            )}
          </>
        )}

        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 text-[10px]",
            emojiOnly
              ? "justify-end text-[color:var(--color-text-muted)]"
              : isOwn
                ? "justify-end text-white/80"
                : "text-[color:var(--color-text-muted)]",
          )}
        >
          <span>{formatRelativeDate(message.sentAt)}</span>
          {message.isEdited && <span>· редактирано</span>}
          {isOwn && (
            <i
              className={cn(
                "bi text-[11px]",
                message.isRead ? "bi-check2-all" : message.isDelivered ? "bi-check2-all opacity-70" : "bi-check2",
              )}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      {canInteract && (
      <div
        className={cn(
          "absolute top-0 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
          isOwn ? "right-full mr-1" : "left-full ml-1",
        )}
      >
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow hover:text-primary"
            aria-label="Отговори"
          >
            <i className="bi bi-reply" />
          </button>
        )}
        {isOwn && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setEditText(message.text);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow hover:text-primary"
              aria-label="Редактирай"
            >
              <i className="bi bi-pencil" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Изтриване на съобщението?")) deleteMut.mutate();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow hover:text-[color:var(--color-error)]"
              aria-label="Изтрий"
            >
              <i className="bi bi-trash" />
            </button>
          </>
        )}
        {!isOwn && (
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow hover:text-primary"
            aria-label="Преведи"
          >
            <i className="bi bi-translate" />
          </button>
        )}
      </div>
      )}

      {canInteract && langOpen && !isOwn && (
        <div className="absolute left-0 top-full z-10 mt-1 flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white shadow-[var(--shadow-md)]">
          {TRANSLATE_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={translate.isPending}
              onClick={() => translate.mutate(lang.code)}
              className="px-3 py-1.5 text-left text-xs hover:bg-primary-50"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
