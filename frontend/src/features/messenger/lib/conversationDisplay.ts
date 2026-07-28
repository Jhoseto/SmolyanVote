import type { Conversation, MessengerUser } from "../types";

export interface ConversationDisplay {
  isGroup: boolean;
  /** Title for a group, peer name for a direct chat. */
  name: string;
  /** Group photo or peer avatar; null falls back to initials. */
  imageUrl: string | null;
  /** Seed for generated initials/colour — group titles have no username. */
  avatarSeed: string;
  /** Only present for direct chats. */
  peer: MessengerUser | null;
  /** Active members, empty for direct chats. */
  members: MessengerUser[];
}

/**
 * Single source of truth for "what do we show in the header / list row",
 * so components never have to null-check `otherUser` themselves.
 */
export function describeConversation(
  conversation: Conversation | undefined | null,
): ConversationDisplay {
  if (!conversation) {
    return { isGroup: false, name: "Разговор", imageUrl: null, avatarSeed: "?", peer: null, members: [] };
  }

  if (conversation.type === "GROUP") {
    const members = (conversation.participants ?? []).map((p) => p.user);
    const name = conversation.title?.trim() || "Група";
    return {
      isGroup: true,
      name,
      imageUrl: conversation.imageUrl ?? null,
      avatarSeed: name,
      peer: null,
      members,
    };
  }

  const peer = conversation.otherUser ?? null;
  return {
    isGroup: false,
    name: peer?.fullName || peer?.username || "Потребител",
    imageUrl: peer?.imageUrl ?? null,
    avatarSeed: peer?.username ?? "?",
    peer,
    members: [],
  };
}

/** "Ти, Мария и още 3" — subtitle under a group title. */
export function summariseMembers(members: MessengerUser[], currentUserId?: number): string {
  const others = members.filter((m) => m.id !== currentUserId);
  if (others.length === 0) return "Само ти";

  const names = others.slice(0, 2).map((m) => m.fullName?.split(" ")[0] || m.username);
  const rest = others.length - names.length;
  const listed = names.join(", ");
  return rest > 0 ? `${listed} и още ${rest}` : listed;
}
