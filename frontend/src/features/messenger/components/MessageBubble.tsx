"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { getEmojiOnlyMeta, linkifyText, splitEmojiGraphemes } from "../lib/linkify";
import { findSharedEntity } from "../lib/resolveSharedEntity";
import { formatClock } from "../lib/presence";
import { messengerApi } from "../api";
import { messagesQueryKey } from "../hooks/useMessages";
import { upsertMessage } from "../lib/cacheUpdates";
import { bubbleVariants } from "../lib/messengerMotion";
import { useMessengerPrefsStore } from "../store/messengerPrefsStore";
import { TRANSLATE_LANGUAGES, type Message, type TranslateLanguage } from "../types";
import { useTogglePin, useToggleReaction, useToggleStar } from "../hooks/useMessageActions";
import { useDecryptedText } from "../hooks/useDecryptedText";
import { MessengerContextMenu, type MenuAction } from "./MessengerMenu";
import { AttachmentBubble } from "./AttachmentBubble";
import { ChatLinkPreview, findExternalUrl } from "./ChatLinkPreview";
import { ChatPollBubble } from "./ChatPollBubble";
import { ForwardDialog } from "./ForwardDialog";
import { SharedEntityCard } from "./SharedEntityCard";
import { ReactionChips, ReactionPicker } from "./MessageReactions";

export type GroupPosition = "single" | "first" | "middle" | "last";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  groupPosition?: GroupPosition;
  searchQuery?: string;
  highlighted?: boolean;
  /** Controlled by ChatWindow so `↑` can open the last own message for editing. */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onReply?: (message: Message) => void;
  onJumpTo?: (messageId: number) => void;
  /** Peer user id for E2E decryption in DIRECT chats. */
  e2ePeerUserId?: number | null;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5 text-inherit">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** Corner radii shrink on the side that continues a group. */
function radiusFor(isOwn: boolean, position: GroupPosition): string {
  if (position === "single") return "rounded-[18px]";
  if (isOwn) {
    if (position === "first") return "rounded-[18px] rounded-br-[6px]";
    if (position === "middle") return "rounded-[18px] rounded-r-[6px]";
    return "rounded-[18px] rounded-tr-[6px]";
  }
  if (position === "first") return "rounded-[18px] rounded-bl-[6px]";
  if (position === "middle") return "rounded-[18px] rounded-l-[6px]";
  return "rounded-[18px] rounded-tl-[6px]";
}

function StatusTick({ message, showReadReceipts }: { message: Message; showReadReceipts: boolean }) {
  if (message.sendState === "failed") {
    return (
      <i
        className="bi bi-exclamation-circle text-[11px] text-[color:var(--color-error)]"
        title="Изпращането не успя"
      />
    );
  }
  if (message.sendState === "pending") {
    return <i className="bi bi-clock text-[11px] opacity-70" title="Изпраща се…" />;
  }
  if (message.isRead && showReadReceipts) {
    return (
      <i
        className="bi bi-check2-all text-[11px] text-[color:var(--color-primary-50)]"
        title={message.readAt ? `Прочетено в ${formatClock(message.readAt)}` : "Прочетено"}
      />
    );
  }
  if (message.isDelivered) {
    return (
      <i
        className="bi bi-check2-all text-[11px] opacity-65"
        title={message.deliveredAt ? `Доставено в ${formatClock(message.deliveredAt)}` : "Доставено"}
      />
    );
  }
  return <i className="bi bi-check2 text-[11px] opacity-65" title="Изпратено" />;
}

function MessageBubbleImpl({
  message,
  isOwn,
  groupPosition = "single",
  searchQuery = "",
  highlighted = false,
  editing = false,
  onEditingChange,
  onReply,
  onJumpTo,
  e2ePeerUserId = null,
}: MessageBubbleProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canInteract = useCanInteract();
  const showReadReceipts = useMessengerPrefsStore((s) => s.showReadReceipts);
  const { display: decryptedText, locked: e2eLocked } = useDecryptedText(
    message.text,
    e2ePeerUserId,
  );
  const [langOpen, setLangOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const toggleReaction = useToggleReaction(message.conversationId);
  const togglePin = useTogglePin(message.conversationId);
  const toggleStar = useToggleStar(message.conversationId);
  const [translated, setTranslated] = useState<string | null>(null);
  const [editText, setEditText] = useState(message.text);
  const setEditing = (next: boolean) => onEditingChange?.(next);

  useEffect(() => {
    if (editing) setEditText(e2eLocked ? "" : decryptedText);
  }, [editing, decryptedText, e2eLocked]);

  const hasAttachment = Boolean(message.attachmentUrl || message.localPreviewUrl);
  const sourceText = e2eLocked ? "" : decryptedText;
  const emojiMeta = getEmojiOnlyMeta(sourceText);
  const emojiOnly = !hasAttachment && !message.poll && emojiMeta.isEmojiOnly;
  const singleEmoji = emojiOnly && emojiMeta.count === 1;
  const emojiGraphemes = emojiOnly ? splitEmojiGraphemes(sourceText) : [];
  const displayText = translated ?? sourceText;
  const pending = message.sendState === "pending";
  const reactions = message.reactions ?? [];
  const sharedEntity = useMemo(
    () => (sourceText ? findSharedEntity(sourceText) : null),
    [sourceText],
  );
  const externalUrl = useMemo(
    () => (sourceText && !sharedEntity ? findExternalUrl(sourceText) : null),
    [sourceText, sharedEntity],
  );

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

  const actions: MenuAction[] = [];
  if (canInteract && !pending) {
    if (onReply) {
      actions.push({
        id: "reply",
        label: "Отговори",
        icon: "bi-reply",
        onSelect: () => onReply(message),
      });
    }
    actions.push({
      id: "copy",
      label: "Копирай текста",
      icon: "bi-clipboard",
      onSelect: () => {
        void navigator.clipboard.writeText(message.text);
        toast.success("Копирано");
      },
    });
    if (!isOwn) {
      actions.push({
        id: "translate",
        label: "Преведи",
        icon: "bi-translate",
        onSelect: () => setLangOpen(true),
      });
    }
    actions.push(
      {
        id: "pin",
        label: message.isPinned ? "Откачи" : "Закачи",
        icon: "bi-pin-angle",
        onSelect: () => togglePin.mutate(message.id),
      },
      {
        id: "star",
        label: message.isStarred ? "Премахни от запазени" : "Запази",
        icon: message.isStarred ? "bi-star-fill" : "bi-star",
        onSelect: () => toggleStar.mutate(message.id),
      },
      {
        id: "forward",
        label: "Препрати",
        icon: "bi-arrow-right-circle",
        onSelect: () => setForwardOpen(true),
      },
    );
    if (isOwn) {
      actions.push(
        {
          id: "edit",
          label: "Редактирай",
          icon: "bi-pencil",
          onSelect: () => setEditing(true),
        },
        {
          id: "delete",
          label: "Изтрий",
          icon: "bi-trash",
          danger: true,
          onSelect: () => {
            if (confirm("Изтриване на съобщението?")) deleteMut.mutate();
          },
        },
      );
    }
  }

  const bubble = (
    <div
      className={cn(
        "sv-msg-body relative px-3 py-1.5",
        radiusFor(isOwn, groupPosition),
        emojiOnly && singleEmoji && "sv-msg-emoji-single bg-transparent px-0.5 py-0 shadow-none",
        emojiOnly && !singleEmoji && "sv-msg-emoji-multi bg-transparent px-1 py-0 shadow-none",
        !emojiOnly &&
          (isOwn ? "sv-msg-bubble-own" : "sv-msg-bubble-peer"),
        pending && "sv-msg-bubble-pending",
        highlighted && "sv-msg-flash",
      )}
    >
      {message.parentMessageText && (
        <button
          type="button"
          onClick={() => message.parentMessageId && onJumpTo?.(message.parentMessageId)}
          className={cn(
            "mb-1.5 block w-full truncate border-l-2 pl-2 text-left text-xs opacity-85 transition-opacity hover:opacity-100",
            isOwn ? "border-white/70" : "border-[color:var(--color-primary)]",
          )}
        >
          {message.parentMessageText}
        </button>
      )}

      {message.isForwarded && (
        <p className={cn("mb-1 flex items-center gap-1 text-[11px] italic", isOwn ? "text-white/70" : "text-[color:var(--color-text-muted)]")}>
          <i className="bi bi-arrow-return-right" />
          Препратено
        </p>
      )}

      {hasAttachment && (
        <div className={cn(message.text ? "mb-1.5" : "")}>
          <AttachmentBubble message={message} isOwn={isOwn} />
        </div>
      )}

      {message.poll && (
        <ChatPollBubble
          poll={message.poll}
          conversationId={message.conversationId}
          messageId={message.id}
          isOwn={isOwn}
        />
      )}

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value.slice(0, 3000))}
            rows={2}
            className={cn(
              "w-full rounded-[var(--radius-sm)] p-1.5 text-sm outline-none",
              isOwn
                ? "border border-white/40 bg-white/10 text-white placeholder:text-white/60"
                : "border border-border-default/60 bg-white",
            )}
            autoFocus
          />
          <div className="flex gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => editMut.mutate(editText.trim())}
              disabled={!editText.trim() || editMut.isPending}
              className="underline disabled:opacity-50"
            >
              Запази
            </button>
            <button type="button" onClick={() => setEditing(false)} className="underline">
              Отказ
            </button>
          </div>
        </div>
      ) : (
        <>
          {!emojiOnly && (e2eLocked || sourceText) && (
            <p
              className={cn(
                "whitespace-pre-wrap break-words",
                isOwn && "[&_a]:text-white [&_a]:underline",
                e2eLocked && "italic opacity-80",
              )}
            >
              {e2eLocked
                ? decryptedText
                : searchQuery
                  ? highlight(displayText, searchQuery)
                  : translated
                    ? displayText
                    : linkifyText(displayText)}
            </p>
          )}
          {emojiOnly && singleEmoji && (
            <span className="sv-msg-emoji-content sv-msg-emoji-content--single">
              {emojiGraphemes[0] ?? sourceText.trim()}
            </span>
          )}
          {emojiOnly && !singleEmoji && (
            <span className="sv-msg-emoji-content sv-msg-emoji-content--multi">
              {emojiGraphemes.map((glyph, index) => (
                <span key={`${glyph}-${index}`} className="sv-msg-emoji-glyph">
                  {glyph}
                </span>
              ))}
            </span>
          )}
          {sharedEntity ? (
            <div className="mt-1.5">
              <SharedEntityCard entity={sharedEntity} isOwn={isOwn} />
            </div>
          ) : (
            externalUrl && <ChatLinkPreview url={externalUrl} isOwn={isOwn} />
          )}
          {translated && (
            <p
              className={cn(
                "mt-1 text-[10px]",
                isOwn ? "text-white/70" : "text-[color:var(--color-text-muted)]",
              )}
            >
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
          "sv-msg-num mt-1 flex items-center gap-1.5 text-[10px]",
          emojiOnly
            ? "justify-end text-[color:var(--color-text-muted)]"
            : isOwn
              ? "justify-end text-white/75"
              : "text-[color:var(--color-text-muted)]",
        )}
      >
        <span title={new Date(message.sentAt).toLocaleString("bg-BG")}>
          {formatClock(message.sentAt)}
        </span>
        {message.isEdited && <span>· редактирано</span>}
        {message.isPinned && <i className="bi bi-pin-angle-fill" title="Закачено" />}
        {message.isStarred && <i className="bi bi-star-fill" title="Запазено" />}
        {isOwn && <StatusTick message={message} showReadReceipts={showReadReceipts} />}
      </div>

      {pending && (
        <span
          aria-hidden
          className="sv-msg-shimmer pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
    </div>
  );

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={cn("group relative flex", isOwn ? "justify-end" : "justify-start")}
      onMouseLeave={() => {
        setLangOpen(false);
        setReactionsOpen(false);
      }}
      data-message-id={message.id}
    >
      <div className={cn("flex max-w-[85%] flex-col", isOwn ? "items-end" : "items-start")}>
        {actions.length > 0 ? (
          <MessengerContextMenu actions={actions}>{bubble}</MessengerContextMenu>
        ) : (
          bubble
        )}

        {reactions.length > 0 && (
          <ReactionChips
            reactions={reactions}
            isOwn={isOwn}
            onToggle={(emoji) => toggleReaction.mutate({ messageId: message.id, emoji })}
          />
        )}
      </div>

      {canInteract && !pending && (
        <div
          className={cn(
            "absolute top-1 flex items-center gap-1 opacity-0 transition-opacity",
            "focus-within:opacity-100 group-hover:opacity-100",
            isOwn ? "right-full mr-1.5 flex-row-reverse" : "left-full ml-1.5",
          )}
        >
          <button
            type="button"
            onClick={() => setReactionsOpen((v) => !v)}
            aria-label="Реагирай"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow-[var(--shadow-sm)] ring-1 ring-border-default/50 hover:text-[color:var(--color-primary)]"
          >
            <i className="bi bi-emoji-smile" />
          </button>
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              aria-label="Отговори"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow-[var(--shadow-sm)] ring-1 ring-border-default/50 hover:text-[color:var(--color-primary)]"
            >
              <i className="bi bi-reply" />
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {reactionsOpen && (
          <ReactionPicker
            isOwn={isOwn}
            onPick={(emoji) => {
              toggleReaction.mutate({ messageId: message.id, emoji });
              setReactionsOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {forwardOpen && (
        <ForwardDialog
          messageId={message.id}
          excludeConversationId={message.conversationId}
          onClose={() => setForwardOpen(false)}
        />
      )}

      {canInteract && langOpen && !isOwn && (
        <div className="sv-msg-surface absolute left-0 top-full z-20 mt-1 flex flex-col overflow-hidden p-1">
          {TRANSLATE_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={translate.isPending}
              onClick={() => translate.mutate(lang.code)}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-left text-xs hover:bg-[color:var(--color-primary-50)]"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);
