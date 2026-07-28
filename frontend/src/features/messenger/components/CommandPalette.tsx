"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { messengerApi } from "../api";
import { useConversations } from "../hooks/useConversations";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { useMessengerPrefsStore } from "../store/messengerPrefsStore";
import { fuzzyScore } from "../lib/fuzzyMatch";
import { describeConversation } from "../lib/conversationDisplay";

interface Entry {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  avatar?: { username: string; imageUrl: string | null };
  run: () => void;
}

/** Ctrl+K launcher over conversations and messenger actions. */
export function CommandPalette() {
  const open = useMessengerUiStore((s) => s.commandPaletteOpen);
  const setOpen = useMessengerUiStore((s) => s.setCommandPaletteOpen);
  const openChat = useMessengerUiStore((s) => s.openChat);
  const showSearch = useMessengerUiStore((s) => s.showSearch);
  const showCalls = useMessengerUiStore((s) => s.showCalls);
  const showList = useMessengerUiStore((s) => s.showList);
  const activeChats = useMessengerUiStore((s) => s.activeChats);
  const minimizeChat = useMessengerUiStore((s) => s.minimizeChat);
  const closeChat = useMessengerUiStore((s) => s.closeChat);
  const density = useMessengerPrefsStore((s) => s.density);
  const setDensity = useMessengerPrefsStore((s) => s.setDensity);
  const { data: conversations = [] } = useConversations();

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  const { data: messagePage } = useQuery({
    queryKey: ["messenger", "search", debouncedQuery],
    queryFn: () => messengerApi.searchMessages(debouncedQuery, 0, 8),
    enabled: open && debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });
  const messageHits = messagePage?.content ?? [];

  const entries = useMemo<Entry[]>(() => {
    const conversationEntries: Entry[] = conversations.map((c) => {
      const display = describeConversation(c);
      return {
        id: `conv-${c.id}`,
        label: display.name,
        hint: c.lastMessage ?? undefined,
        icon: display.isGroup ? "bi-people" : "bi-chat-dots",
        avatar: display.isGroup
          ? undefined
          : { username: display.avatarSeed, imageUrl: display.imageUrl },
        run: () => openChat(c.id),
      };
    });

    const actionEntries: Entry[] = [
      { id: "a-new", label: "Нов разговор", icon: "bi-pencil-square", run: showSearch },
      { id: "a-list", label: "Отвори списъка с чатове", icon: "bi-list-ul", run: showList },
      { id: "a-calls", label: "История на обажданията", icon: "bi-telephone", run: showCalls },
      {
        id: "a-minimize",
        label: "Минимизирай всички прозорци",
        icon: "bi-dash-square",
        run: () => activeChats.forEach((c) => minimizeChat(c.conversationId)),
      },
      {
        id: "a-close",
        label: "Затвори всички прозорци",
        icon: "bi-x-square",
        run: () => activeChats.forEach((c) => closeChat(c.conversationId)),
      },
      {
        id: "a-density",
        label: `Плътност: ${density === "compact" ? "компактна" : density === "spacious" ? "просторна" : "нормална"} — смени`,
        icon: "bi-arrows-expand",
        run: () =>
          setDensity(
            density === "compact" ? "comfortable" : density === "comfortable" ? "spacious" : "compact",
          ),
      },
    ];

    const all = [...conversationEntries, ...actionEntries];
    if (!query.trim()) return all;

    return all
      .map((entry) => ({ entry, score: fuzzyScore(`${entry.label} ${entry.hint ?? ""}`, query) }))
      .filter((row): row is { entry: Entry; score: number } => row.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.entry);
  }, [
    conversations,
    query,
    activeChats,
    density,
    openChat,
    showSearch,
    showList,
    showCalls,
    minimizeChat,
    closeChat,
    setDensity,
  ]);

  useEffect(() => {
    setCursor(0);
  }, [query, open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function choose(entry: Entry | undefined) {
    if (!entry) return;
    entry.run();
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1101] flex items-start justify-center p-4 pt-[14vh] outline-none">
          <div
            className={cn(
              "sv-msg sv-msg-surface relative w-full max-w-lg overflow-hidden transition-all",
              "data-[ending-style]:scale-[0.98] data-[starting-style]:scale-[0.98]",
            )}
            data-glass="on"
          >
            <Dialog.Title className="sr-only">Команди в съобщенията</Dialog.Title>

            <div className="flex items-center gap-2 px-4 py-3">
              <i className="bi bi-search text-sm text-[color:var(--color-text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCursor((c) => Math.min(c + 1, entries.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCursor((c) => Math.max(c - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    choose(entries[cursor]);
                  }
                }}
                placeholder="Търси разговор или действие…"
                aria-label="Търси разговор или действие"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-muted)]"
                autoFocus
              />
              <kbd className="sv-msg-num rounded-[var(--radius-sm)] bg-[color:var(--color-surface-light)] px-1.5 py-0.5 text-[10px] text-[color:var(--color-text-muted)]">
                Esc
              </kbd>
            </div>

            <div className="sv-msg-brandline" aria-hidden />

            <ul ref={listRef} className="sv-scrollbar max-h-[52vh] overflow-y-auto p-1.5">
              {entries.length === 0 && messageHits.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                  Няма съвпадения
                </li>
              )}
              {entries.map((entry, index) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-active={index === cursor}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => choose(entry)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left",
                      index === cursor
                        ? "bg-[color:var(--color-primary-50)] text-[color:var(--color-primary)]"
                        : "text-[color:var(--color-text-primary)]",
                    )}
                  >
                    {entry.avatar ? (
                      <Avatar
                        username={entry.avatar.username}
                        imageUrl={entry.avatar.imageUrl}
                        size={26}
                      />
                    ) : (
                      <i className={cn("bi", entry.icon, "w-[26px] text-center text-sm opacity-70")} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{entry.label}</span>
                      {entry.hint && (
                        <span className="block truncate text-[11px] text-[color:var(--color-text-muted)]">
                          {entry.hint}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}

              {messageHits.length > 0 && (
                <>
                  <li className="sv-msg-label px-3 pb-1 pt-3">В съобщенията</li>
                  {messageHits.map((hit) => (
                    <li key={`msg-${hit.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          openChat(hit.conversationId);
                          setOpen(false);
                          setQuery("");
                          window.dispatchEvent(
                            new CustomEvent("sv:messenger-jump", {
                              detail: { conversationId: hit.conversationId, messageId: hit.id },
                            }),
                          );
                        }}
                        className="flex w-full items-start gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left hover:bg-[color:var(--color-surface-light)]"
                      >
                        <i className="bi bi-chat-left-quote w-[26px] shrink-0 text-center text-sm opacity-70" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px]">{hit.text}</span>
                          <span className="block truncate text-[11px] text-[color:var(--color-text-muted)]">
                            {hit.senderUsername} · {new Date(hit.sentAt).toLocaleDateString("bg-BG")}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
