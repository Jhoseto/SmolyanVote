"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/shared/ui";
import { useAuth } from "@/shared/lib/authContext";
import { useMessages } from "../hooks/useMessages";
import { useLeaveGroup, useRemoveGroupMember } from "../hooks/useGroups";
import { describeConversation } from "../lib/conversationDisplay";
import { isE2ECiphertext } from "../lib/e2eCrypto";
import { extractUrls, urlHost } from "../lib/linkify";
import { easeOutExpo } from "../lib/messengerMotion";
import { presenceLabel } from "../lib/presence";
import { formatBytes } from "./AttachmentBubble";
import { GroupAvatar } from "./GroupAvatar";
import type { Conversation, MessengerUser } from "../types";

export const SIDEBAR_WIDTH = 232;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <span className="sv-msg-label">{children}</span>;
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-[10.5px] text-[color:var(--color-text-muted)]">{children}</p>
  );
}

/** Everything with an attachment that is already in the loaded pages. */
function SharedMediaSection({ conversationId }: { conversationId: number }) {
  const { data } = useMessages(conversationId);

  const { images, files } = useMemo(() => {
    const attachments = (data?.pages ?? [])
      .flatMap((page) => page.content)
      .filter((message) => Boolean(message.attachmentUrl));
    return {
      images: attachments.filter((m) => m.attachmentMime?.startsWith("image/")),
      files: attachments.filter((m) => !m.attachmentMime?.startsWith("image/")),
    };
  }, [data]);

  return (
    <section className="sv-msg-info-section">
      <SectionTitle>Файлове</SectionTitle>
      {images.length === 0 && files.length === 0 ? (
        <EmptyHint>Още няма споделени файлове.</EmptyHint>
      ) : (
        <>
          {images.length > 0 && (
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {images.slice(0, 9).map((message) => (
                <a
                  key={message.id}
                  href={message.attachmentUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sv-msg-tile relative aspect-square overflow-hidden rounded-[6px]"
                >
                  <Image
                    src={message.attachmentUrl ?? ""}
                    alt={message.attachmentName ?? "Споделена снимка"}
                    fill
                    unoptimized
                    sizes="72px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {files.slice(0, 6).map((message) => (
                <li key={message.id}>
                  <a
                    href={message.attachmentUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sv-msg-tile flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[10.5px] hover:text-[color:var(--color-primary)]"
                  >
                    <i className="bi bi-paperclip shrink-0 opacity-60" />
                    <span className="min-w-0 flex-1 truncate">
                      {message.attachmentName ?? "Файл"}
                    </span>
                    <span className="sv-msg-num shrink-0 text-[color:var(--color-text-muted)]">
                      {formatBytes(message.attachmentSize)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Links exchanged inside this conversation only — the pages already in cache
 * are scanned client-side, so no extra request is made. Encrypted bodies are
 * skipped: their plaintext never leaves the bubble that decrypts it.
 */
function SharedLinksSection({ conversationId }: { conversationId: number }) {
  const { data } = useMessages(conversationId);

  const links = useMemo(() => {
    const seen = new Set<string>();
    const result: { url: string; host: string; at: string }[] = [];
    for (const page of data?.pages ?? []) {
      for (const message of page.content) {
        if (!message.text || isE2ECiphertext(message.text)) continue;
        for (const url of extractUrls(message.text)) {
          if (seen.has(url)) continue;
          seen.add(url);
          result.push({ url, host: urlHost(url), at: message.sentAt });
        }
      }
    }
    return result
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);
  }, [data]);

  return (
    <section className="sv-msg-info-section">
      <SectionTitle>Връзки</SectionTitle>
      {links.length === 0 ? (
        <EmptyHint>Още няма споделени връзки.</EmptyHint>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.url}
                className="sv-msg-tile flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 hover:text-[color:var(--color-primary)]"
              >
                <i className="bi bi-link-45deg shrink-0 text-[11px] opacity-60" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10.5px] font-medium">{link.host}</span>
                  <span className="block truncate text-[9.5px] text-[color:var(--color-text-muted)]">
                    {link.url}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface ContactSidebarProps {
  open: boolean;
  conversationId: number;
  conversation?: Conversation;
  user: MessengerUser | undefined;
  online: boolean;
  onClose: () => void;
}

/** Slide-over with identity (or group roster), shared media and shared links. */
export function ContactSidebar({
  open,
  conversationId,
  conversation,
  user,
  online,
  onClose,
}: ContactSidebarProps) {
  const { user: me } = useAuth();
  const display = describeConversation(conversation);
  const leaveGroup = useLeaveGroup();
  const removeMember = useRemoveGroupMember();
  const myRole = conversation?.participants?.find((p) => p.user.id === me?.id)?.role;
  const canModerate = myRole === "OWNER" || myRole === "ADMIN";

  const show = open && (display.isGroup || Boolean(user));

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: easeOutExpo }}
          className="sv-msg-info sv-scrollbar shrink-0 overflow-y-auto overflow-x-hidden"
          aria-label="Информация за разговора"
        >
          <div style={{ width: SIDEBAR_WIDTH }} className="p-3">
            <div className="flex items-start justify-between">
              <SectionTitle>Информация</SectionTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label="Затвори панела"
                className="flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-white hover:text-[color:var(--color-error)]"
              >
                <i className="bi bi-x text-xs" />
              </button>
            </div>

            {display.isGroup ? (
              <div className="mt-2 flex flex-col items-center text-center">
                <GroupAvatar
                  title={display.name}
                  imageUrl={display.imageUrl}
                  members={display.members}
                  size={56}
                />
                <p className="mt-1.5 font-[family-name:var(--font-display)] text-[12.5px] font-semibold text-[color:var(--color-text-heading)]">
                  {display.name}
                </p>
                <p className="text-[10.5px] text-[color:var(--color-text-muted)]">
                  {display.members.length} участника
                </p>

                <ul className="mt-2.5 w-full space-y-0.5 text-left">
                  {(conversation?.participants ?? []).map((participant) => (
                    <li
                      key={participant.user.id}
                      className="flex items-center gap-1.5 rounded-[6px] px-1 py-0.5"
                    >
                      <Avatar
                        username={participant.user.username}
                        imageUrl={participant.user.imageUrl}
                        size={22}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium">
                          {participant.user.fullName || participant.user.username}
                        </span>
                        <span className="sv-msg-label text-[9px]">{participant.role}</span>
                      </span>
                      {canModerate &&
                        participant.user.id !== me?.id &&
                        participant.role !== "OWNER" && (
                          <button
                            type="button"
                            aria-label="Премахни"
                            onClick={() =>
                              removeMember.mutate({
                                conversationId,
                                userId: participant.user.id,
                              })
                            }
                            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
                          >
                            <i className="bi bi-x-circle text-[11px]" />
                          </button>
                        )}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Напускане на групата?")) leaveGroup.mutate(conversationId);
                  }}
                  className="sv-msg-chip mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-medium text-[color:var(--color-error)]"
                >
                  <i className="bi bi-box-arrow-right" />
                  Напусни групата
                </button>
              </div>
            ) : (
              user && (
                <div className="mt-2 flex flex-col items-center text-center">
                  <Avatar username={user.username} imageUrl={user.imageUrl} size={56} />
                  <p className="mt-1.5 font-[family-name:var(--font-display)] text-[12.5px] font-semibold text-[color:var(--color-text-heading)]">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-[10.5px] text-[color:var(--color-text-muted)]">
                    {presenceLabel({ online, typing: false, lastSeen: user.lastSeen })}
                  </p>
                  {user.bio && (
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-[color:var(--color-text-secondary)]">
                      {user.bio}
                    </p>
                  )}
                  <Link
                    href={`/user/${user.username}`}
                    className="sv-msg-chip mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-medium text-[color:var(--color-text-heading)]"
                  >
                    <i className="bi bi-person" />
                    Отвори профила
                  </Link>
                </div>
              )
            )}

            <SharedMediaSection conversationId={conversationId} />
            <SharedLinksSection conversationId={conversationId} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
