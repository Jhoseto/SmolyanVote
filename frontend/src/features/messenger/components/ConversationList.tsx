"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LogoLoader } from "@/shared/ui";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { useConversations } from "../hooks/useConversations";
import { useHideConversation } from "../hooks/useHideConversation";
import { useToggleMute } from "../hooks/useToggleMute";
import { useLeaveGroup } from "../hooks/useGroups";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { useDraftsStore } from "../store/draftsStore";
import { describeConversation } from "../lib/conversationDisplay";
import { MessengerContextMenu } from "./MessengerMenu";
import { GroupAvatar } from "./GroupAvatar";
import { CreateGroupDialog } from "./CreateGroupDialog";

export function ConversationList() {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useConversations();
  const openChat = useMessengerUiStore((s) => s.openChat);
  const showSearch = useMessengerUiStore((s) => s.showSearch);
  const activeChats = useMessengerUiStore((s) => s.activeChats);
  const typingByConversation = useMessengerUiStore((s) => s.typingByConversation);
  const onlineByUserId = useMessengerUiStore((s) => s.onlineByUserId);
  const drafts = useDraftsStore((s) => s.drafts);
  const { mutate: hide } = useHideConversation();
  const { mutate: toggleMute } = useToggleMute();
  const { mutate: leaveGroup } = useLeaveGroup();
  const [filter, setFilter] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q || !data) return data ?? [];
    return data.filter(
      (c) =>
        describeConversation(c).name.toLowerCase().includes(q) ||
        (c.otherUser?.username.toLowerCase().includes(q) ?? false) ||
        (c.lastMessage?.toLowerCase().includes(q) ?? false),
    );
  }, [data, filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1.5 px-2.5 py-1.5">
        <div className="relative min-w-0 flex-1">
          <i className="bi bi-search pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--color-text-muted)]" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Филтрирай…"
            aria-label="Филтрирай разговори"
            className="w-full rounded-[var(--radius-pill)] border border-border-default/60 bg-white/80 py-1 pl-7 pr-2.5 text-[12px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreatingGroup(true)}
          aria-label="Нова група"
          title="Нова група"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-default/60 text-[color:var(--color-text-secondary)] transition-colors hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
        >
          <i className="bi bi-people text-[12px]" />
        </button>
      </div>

      {creatingGroup && <CreateGroupDialog onClose={() => setCreatingGroup(false)} />}

      <div className="sv-scrollbar min-h-0 flex-1 overflow-y-auto">
        {isPending && (
          <div className="flex justify-center py-10">
            <LogoLoader size="sm" label="Зареждане…" />
          </div>
        )}

        {isError && (
          <ErrorState description="Разговорите не можаха да се заредят." onRetry={() => refetch()} />
        )}

        {!isPending && !isError && filtered.length === 0 && (
          <EmptyState
            icon="bi-chat"
            title={filter ? "Няма съвпадения" : "Няма разговори"}
            description={!filter ? "Започни нов разговор с бутона горе вдясно." : undefined}
            action={
              filter ? undefined : (
                <button
                  type="button"
                  onClick={showSearch}
                  className="rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Нов разговор
                </button>
              )
            }
          />
        )}

        {filtered.map((c) => {
          const display = describeConversation(c);
          const online = display.peer
            ? (onlineByUserId[display.peer.id] ?? display.peer.isOnline ?? false)
            : false;
          const typing = typingByConversation[c.id] ?? c.isTyping;
          const active = activeChats.some((w) => w.conversationId === c.id && !w.isMinimized);
          const draft = drafts[c.id]?.trim();

          return (
            <MessengerContextMenu
              key={c.id}
              className="block w-full"
              actions={[
                {
                  id: "open",
                  label: "Отвори разговора",
                  icon: "bi-chat-dots",
                  onSelect: () => openChat(c.id),
                },
                ...(display.peer
                  ? [
                      {
                        id: "profile",
                        label: "Отвори профила",
                        icon: "bi-person",
                        onSelect: () => router.push(`/user/${display.peer!.username}`),
                      },
                    ]
                  : []),
                {
                  id: "mute",
                  label: c.isMuted ? "Включи известията" : "Заглуши разговора",
                  icon: c.isMuted ? "bi-bell" : "bi-bell-slash",
                  onSelect: () => toggleMute(c.id),
                },
                display.isGroup
                  ? {
                      id: "leave",
                      label: "Напусни групата",
                      icon: "bi-box-arrow-right",
                      danger: true,
                      onSelect: () => leaveGroup(c.id),
                    }
                  : {
                      id: "hide",
                      label: "Скрий разговора",
                      icon: "bi-eye-slash",
                      danger: true,
                      onSelect: () => hide(c.id),
                    },
              ]}
            >
              <button
                type="button"
                onClick={() => openChat(c.id)}
                className={cn(
                  "sv-msg-conversation-row group relative flex w-full items-center gap-2.5 pl-3.5 pr-2.5 text-left transition-colors",
                  active
                    ? "bg-[color:var(--color-primary-50)]"
                    : "hover:bg-[color:var(--color-surface-light)]",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1 left-0 w-[2.5px] rounded-r-full bg-[color:var(--color-primary)]"
                  />
                )}

                <div className="relative shrink-0">
                  {display.isGroup ? (
                    <GroupAvatar
                      title={display.name}
                      imageUrl={display.imageUrl}
                      members={display.members}
                      size={36}
                    />
                  ) : (
                    <>
                      <Avatar username={display.avatarSeed} imageUrl={display.imageUrl} size={36} />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-[1.5px] border-white",
                          online
                            ? "bg-[color:var(--color-success)]"
                            : "bg-[color:var(--color-text-muted)]",
                        )}
                      />
                    </>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1.5">
                    <p className="flex min-w-0 items-baseline gap-1 truncate font-[family-name:var(--font-display)] text-[12.5px] font-semibold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
                      {display.isGroup && (
                        <i className="bi bi-people-fill shrink-0 text-[10px] text-[color:var(--color-primary)]" aria-hidden />
                      )}
                      <span className="truncate">{display.name}</span>
                    </p>
                    {c.lastMessageTime && (
                      <span className="sv-msg-num shrink-0 text-[9.5px] text-[color:var(--color-text-muted)]">
                        {formatRelativeDate(c.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="mt-px flex items-center justify-between gap-1.5">
                    <p
                      className={cn(
                        "truncate text-[11.5px]",
                        typing
                          ? "italic text-[color:var(--color-primary)]"
                          : "text-[color:var(--color-text-secondary)]",
                      )}
                    >
                      {typing ? (
                        "пише…"
                      ) : draft ? (
                        <>
                          <span className="font-medium text-[color:var(--color-error)]">Чернова: </span>
                          {draft}
                        </>
                      ) : (
                        c.lastMessage || "Няма съобщения"
                      )}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="sv-msg-num flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[9px] font-bold text-white">
                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </MessengerContextMenu>
          );
        })}
      </div>
    </div>
  );
}
