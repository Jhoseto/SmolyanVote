"use client";

import { useState, type KeyboardEvent } from "react";
import { EmojiPicker } from "frimousse";
import { LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useSendMessage } from "../hooks/useSendMessage";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { MESSAGE_MAX_LENGTH, type Message } from "../types";

interface MessageInputProps {
  conversationId: number;
  replyTo?: Message | null;
  onClearReply?: () => void;
}

export function MessageInput({ conversationId, replyTo, onClearReply }: MessageInputProps) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { onInputActivity } = useTypingIndicator(conversationId);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    send(
      { text: trimmed.slice(0, MESSAGE_MAX_LENGTH), parentMessageId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText("");
          onClearReply?.();
          setEmojiOpen(false);
        },
      },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border-default/60 p-3">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs">
          <span className="truncate text-[color:var(--color-text-secondary)]">
            Отговор към: {replyTo.text.slice(0, 80)}
          </span>
          <button type="button" onClick={onClearReply} aria-label="Отказ">
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {emojiOpen && (
        <div className="mb-2 h-56 overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white">
          <EmojiPicker.Root
            className="flex h-full flex-col"
            onEmojiSelect={({ emoji }) => {
              setText((t) => (t + emoji).slice(0, MESSAGE_MAX_LENGTH));
              onInputActivity();
            }}
          >
            <EmojiPicker.Search
              placeholder="Търси емоджи…"
              className="border-b border-border-default/60 px-3 py-2 text-sm outline-none"
            />
            <EmojiPicker.Viewport className="relative min-h-0 flex-1 overflow-y-auto">
              <EmojiPicker.Loading className="flex justify-center p-3">
                <LogoLoader size="sm" label="Зареждане…" />
              </EmojiPicker.Loading>
              <EmojiPicker.Empty className="p-3 text-center text-xs text-[color:var(--color-text-muted)]">
                Няма резултати
              </EmojiPicker.Empty>
              <EmojiPicker.List className="select-none pb-2" />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          aria-label="Емоджи"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
            emojiOpen
              ? "bg-primary-50 text-primary"
              : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]",
          )}
        >
          <i className="bi bi-emoji-smile" />
        </button>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, MESSAGE_MAX_LENGTH));
            onInputActivity();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Напиши съобщение…"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || isPending}
          aria-label="Изпрати"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white disabled:opacity-40"
        >
          <i className="bi bi-send-fill" />
        </button>
      </div>

      <p className="mt-1 text-right text-[10px] text-[color:var(--color-text-muted)]">
        {text.length}/{MESSAGE_MAX_LENGTH}
      </p>
    </div>
  );
}
