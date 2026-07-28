"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EmojiPicker } from "frimousse";
import { LogoLoader } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { ReadOnlyInteractionNotice } from "@/features/moderation/components/ReadOnlyInteractionNotice";
import { useSendMessage } from "../hooks/useSendMessage";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { useDraftsStore } from "../store/draftsStore";
import { useMessengerPrefsStore } from "../store/messengerPrefsStore";
import { springReaction } from "../lib/messengerMotion";
import { MESSAGE_MAX_LENGTH, type Message } from "../types";
import { MentionAutocomplete, mentionQueryAt } from "./MentionAutocomplete";
import { PollComposer } from "./PollComposer";
import { VoiceRecorder } from "./VoiceRecorder";

/** Roughly five lines at the composer's font size. */
const INPUT_MAX_H = 108;

interface MessageInputProps {
  conversationId: number;
  /** In-chat polls are group-only — hide the composer affordance in 1:1 chats. */
  allowPolls?: boolean;
  replyTo?: Message | null;
  onClearReply?: () => void;
  /** `↑` on an empty composer opens the last own message for editing. */
  onEditLast?: () => void;
  onAttach?: (files: FileList | File[]) => void;
}

export function MessageInput({
  conversationId,
  allowPolls = false,
  replyTo,
  onClearReply,
  onEditLast,
  onAttach,
}: MessageInputProps) {
  const draft = useDraftsStore((s) => s.drafts[conversationId] ?? "");
  const setDraft = useDraftsStore((s) => s.setDraft);
  const clearDraft = useDraftsStore((s) => s.clearDraft);
  const enterToSend = useMessengerPrefsStore((s) => s.enterToSend);

  const [text, setText] = useState(draft);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [caret, setCaret] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const canInteract = useCanInteract();
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { onInputActivity } = useTypingIndicator(conversationId);

  /* Persist the draft, but debounced so every keystroke doesn't hit storage. */
  useEffect(() => {
    const timer = window.setTimeout(() => setDraft(conversationId, text), 400);
    return () => window.clearTimeout(timer);
  }, [text, conversationId, setDraft]);

  /*
   * Grow with the content and only ever show a scrollbar once the text is
   * genuinely taller than the box — the browser default keeps `overflow: auto`
   * on, which makes a phantom scrollbar flicker on every keystroke.
   */
  const autosize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    const content = el.scrollHeight;
    el.style.height = `${Math.min(content, INPUT_MAX_H)}px`;
    el.style.overflowY = content > INPUT_MAX_H ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    autosize(textareaRef.current);
  }, [text, recording, autosize]);

  useEffect(() => {
    if (!allowPolls) setPollOpen(false);
  }, [allowPolls]);

  if (!canInteract) {
    return (
      <div className="sv-msg-composer p-2.5">
        <ReadOnlyInteractionNotice context="изпращане на съобщения" />
      </div>
    );
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    setText("");
    clearDraft(conversationId);
    setEmojiOpen(false);
    onClearReply?.();
    send(
      { text: trimmed.slice(0, MESSAGE_MAX_LENGTH), parentMessageId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setSent(true);
          window.setTimeout(() => setSent(false), 700);
        },
        onError: (error) => toast.error(errorMessage(error, "Съобщението не бе изпратено.")),
      },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const shouldSend = enterToSend ? e.key === "Enter" && !e.shiftKey : e.key === "Enter" && e.ctrlKey;
    if (shouldSend) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "ArrowUp" && text.length === 0 && onEditLast) {
      e.preventDefault();
      onEditLast();
    }
  }

  function applyMention(username: string) {
    if (!mention) return;
    const next = `${text.slice(0, mention.start)}@${username} ${text.slice(caret)}`;
    setText(next.slice(0, MESSAGE_MAX_LENGTH));
    setMention(null);
    window.requestAnimationFrame(() => {
      const position = mention.start + username.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(position, position);
    });
  }

  return (
    <div className="sv-msg-composer relative shrink-0 px-2 py-2">
      <AnimatePresence>
        {allowPolls && pollOpen && (
          <PollComposer conversationId={conversationId} onClose={() => setPollOpen(false)} />
        )}
      </AnimatePresence>

      {mention && (
        <MentionAutocomplete
          query={mention.query}
          onPick={applyMention}
          onDismiss={() => setMention(null)}
        />
      )}

      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-1.5 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 rounded-[6px] border-l-2 border-[color:var(--color-primary)] bg-[color:var(--color-primary-50)] px-2 py-1 text-[11px]">
              <span className="min-w-0 truncate text-[color:var(--color-text-secondary)]">
                <span className="font-semibold text-[color:var(--color-primary)]">Отговор: </span>
                {replyTo.text.slice(0, 90)}
              </span>
              <button
                type="button"
                onClick={onClearReply}
                aria-label="Откажи отговора"
                className="shrink-0 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
              >
                <i className="bi bi-x" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {emojiOpen && (
        <div className="sv-msg-tile mb-1.5 h-48 overflow-hidden rounded-[8px] bg-white">
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

      <div className="flex items-end gap-1.5">
        {recording ? (
          <VoiceRecorder
            onFinish={(file) => {
              setRecording(false);
              onAttach?.([file]);
            }}
            onCancel={() => setRecording(false)}
          />
        ) : (
          <div className="sv-msg-composer-field">
            {onAttach && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) onAttach(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Прикачи файл"
                  title="Прикачи файл"
                  className="sv-msg-composer-btn"
                >
                  <i className="bi bi-paperclip" />
                </button>
              </>
            )}

            {allowPolls && (
              <button
                type="button"
                onClick={() => setPollOpen((v) => !v)}
                aria-label="Създай анкета"
                title="Създай анкета"
                className="sv-msg-composer-btn"
                data-active={pollOpen}
              >
                <i className="bi bi-bar-chart" />
              </button>
            )}

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                const value = e.target.value.slice(0, MESSAGE_MAX_LENGTH);
                const position = e.target.selectionStart ?? value.length;
                setText(value);
                setCaret(position);
                setMention(mentionQueryAt(value, position));
                onInputActivity();
              }}
              onKeyDown={onKeyDown}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files);
                if (files.length === 0 || !onAttach) return;
                e.preventDefault();
                onAttach(files);
              }}
              rows={1}
              placeholder="Напиши съобщение…"
              aria-label="Съобщение"
              className="sv-msg-composer-input"
            />

            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              aria-label="Емоджи"
              title="Емоджи"
              className="sv-msg-composer-btn"
              data-active={emojiOpen}
            >
              <i className="bi bi-emoji-smile" />
            </button>

            {onAttach && !text.trim() && (
              <button
                type="button"
                onClick={() => setRecording(true)}
                aria-label="Запиши гласово съобщение"
                title="Гласово съобщение"
                className="sv-msg-composer-btn"
              >
                <i className="bi bi-mic" />
              </button>
            )}
          </div>
        )}

        {!recording && (
          <motion.button
            type="button"
            onClick={submit}
            disabled={!text.trim() || isPending}
            aria-label="Изпрати"
            whileTap={{ scale: 0.9 }}
            className="sv-msg-send"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.i
                key={sent ? "done" : "send"}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={springReaction}
                className={cn("bi", sent ? "bi-check2" : "bi-send-fill")}
              />
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {text.length > MESSAGE_MAX_LENGTH * 0.8 && (
        <p className="sv-msg-num mt-1 pr-1 text-right text-[9.5px] text-[color:var(--color-text-muted)]">
          {text.length}/{MESSAGE_MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
