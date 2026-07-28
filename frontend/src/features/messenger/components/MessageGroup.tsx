"use client";

import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { MessageBubble, type GroupPosition } from "./MessageBubble";
import type { Message, MessengerUser } from "../types";

interface MessageGroupProps {
  message: Message;
  isOwn: boolean;
  position: GroupPosition;
  /** Only the last bubble of a peer group carries the avatar. */
  showAvatar: boolean;
  peer: MessengerUser | undefined;
  /** Group chats label each incoming group with the sender's name. */
  showSenderName?: boolean;
  searchQuery?: string;
  highlighted?: boolean;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onReply?: (message: Message) => void;
  onJumpTo?: (messageId: number) => void;
  /** Peer user id for E2E decryption in DIRECT chats. */
  e2ePeerUserId?: number | null;
}

/**
 * One row of a message group: keeps a fixed avatar gutter on the peer side so
 * bubbles stay aligned whether or not the avatar is drawn.
 */
export function MessageGroup({
  message,
  isOwn,
  position,
  showAvatar,
  peer,
  showSenderName = false,
  searchQuery,
  highlighted,
  editing,
  onEditingChange,
  onReply,
  onJumpTo,
  e2ePeerUserId = null,
}: MessageGroupProps) {
  const continues = position === "first" || position === "middle";

  return (
    <div className={cn("sv-msg-row flex items-end gap-2", continues && "sv-msg-row-continues")}>
      {!isOwn && (
        <div className="w-[26px] shrink-0">
          {showAvatar && (
            <Avatar
              username={peer?.username ?? message.senderUsername}
              imageUrl={peer?.imageUrl ?? message.senderImageUrl}
              size={26}
            />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {showSenderName && !isOwn && (position === "single" || position === "first") && (
          <p className="mb-0.5 pl-2 text-[11px] font-semibold text-[color:var(--color-text-muted)]">
            {message.senderUsername}
          </p>
        )}
        <MessageBubble
          message={message}
          isOwn={isOwn}
          groupPosition={position}
          searchQuery={searchQuery}
          highlighted={highlighted}
          editing={editing}
          onEditingChange={onEditingChange}
          onReply={onReply}
          onJumpTo={onJumpTo}
          e2ePeerUserId={e2ePeerUserId}
        />
      </div>
    </div>
  );
}
