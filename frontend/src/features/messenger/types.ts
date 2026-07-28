/** Mirrors backend `SVUserMinimalDTO`. */
export interface MessengerUser {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
  isOnline: boolean | null;
  lastSeen: string | null;
  bio: string | null;
}

export type ConversationType = "DIRECT" | "GROUP";

export type ParticipantRole = "OWNER" | "ADMIN" | "MEMBER";

/** Mirrors backend `SVParticipantDTO`. */
export interface Participant {
  user: MessengerUser;
  role: ParticipantRole;
}

/**
 * Mirrors backend `SVConversationDTO`. Group conversations carry `title` and
 * `participants` instead of `otherUser`, so always branch on `type`.
 */
export interface Conversation {
  id: number;
  /** Absent for group conversations. */
  otherUser?: MessengerUser | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isTyping: boolean;
  isMuted?: boolean;
  createdAt: string;
  type?: ConversationType;
  title?: string | null;
  imageUrl?: string | null;
  participants?: Participant[] | null;
  participantCount?: number | null;
  myRole?: ParticipantRole | null;
}

/** Mirrors backend `SVMessageDTO`. */
export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderUsername: string;
  senderImageUrl: string | null;
  text: string;
  sentAt: string;
  isDelivered: boolean;
  deliveredAt: string | null;
  isRead: boolean;
  readAt: string | null;
  messageType: string;
  isEdited: boolean;
  editedAt: string | null;
  parentMessageId: number | null;
  parentMessageText: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMime?: string | null;
  reactions?: ReactionSummary[] | null;
  isPinned?: boolean | null;
  isStarred?: boolean | null;
  isForwarded?: boolean | null;
  poll?: Poll | null;
  /** Client-only: set on optimistic bubbles until the server echo arrives. */
  clientId?: string;
  sendState?: "pending" | "failed";
  /** Client-only: local object URL shown while the attachment uploads. */
  localPreviewUrl?: string;
  uploadProgress?: number;
}

/** Mirrors backend `SVReactionSummaryDTO`. */
export interface ReactionSummary {
  emoji: string;
  count: number;
  usernames: string[];
  reactedByMe: boolean;
}

/** Mirrors backend `SVPollDTO` — in-chat quick poll. */
export interface Poll {
  question: string;
  options: { id: number; text: string; votes: number }[];
  totalVotes: number;
  myOptionId: number | null;
}

/** Mirrors backend `SVAttachmentDTO`. */
export interface AttachmentUpload {
  url: string;
  name: string | null;
  size: number | null;
  mime: string | null;
}

/** Spring `Page<SVMessageDTO>` JSON shape. */
export interface MessagesPage {
  content: Message[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

/** Mirrors backend `SVTypingStatusDTO`. */
export interface TypingStatus {
  conversationId: number;
  userId: number | null;
  username: string | null;
  isTyping: boolean;
  timestamp: string | null;
}

export interface ReadReceipt {
  type?: "BULK_READ";
  messageId?: number;
  conversationId: number;
  readAt: string;
}

export interface DeliveryReceipt {
  type?: "BULK_DELIVERY";
  messageId?: number;
  conversationId?: number;
  conversationIds?: number[];
  deliveredAt: string;
}

export interface OnlineStatusEvent {
  userId: number;
  isOnline: boolean;
  timestamp: string | null;
}

export type TranslateLanguage = "bg" | "en" | "de" | "el" | "tr";

export interface TranslateResponse {
  messageId: number;
  translatedText: string;
  targetLanguage: string;
  cached: boolean;
}

export type CallEventType =
  | "CALL_REQUEST"
  | "CALL_ACCEPT"
  | "CALL_REJECT"
  | "CALL_REJECTED"
  | "CALL_END"
  | "CALL_ENDED"
  | "CALL_BUSY"
  | "CALL_CANCEL"
  | "CALL_MISSED";

/** Mirrors backend `SVCallSignalDTO`. */
export interface CallSignal {
  eventType: CallEventType;
  conversationId: number;
  callerId: number;
  receiverId: number;
  roomName: string | null;
  timestamp: string | null;
  callerName: string | null;
  callerAvatar: string | null;
  startTime: string | null;
  endTime: string | null;
  isVideoCall: boolean | null;
  wasConnected: boolean | null;
}

/** Mirrors backend `SVCallTokenResponse`. */
export interface CallTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
  conversationId: number;
}

/** Mirrors backend `CallHistoryDTO`. */
export interface CallHistoryItem {
  id: number;
  conversationId: number;
  callerId: number;
  callerName: string | null;
  callerImageUrl: string | null;
  receiverId: number;
  receiverName: string | null;
  receiverImageUrl: string | null;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  status: "ACCEPTED" | "REJECTED" | "MISSED" | "CANCELLED";
  isVideoCall: boolean;
}

export type CallUiState = "idle" | "outgoing" | "incoming" | "connected";

export interface ActiveChatWindow {
  conversationId: number;
  isMinimized: boolean;
  /** Top-left of the card. The size is fixed and derived, never stored. */
  position: { x: number; y: number };
  /** Fullscreen replaces the fixed card footprint with the whole viewport. */
  maximized: boolean;
  zIndex: number;
}

export const MESSAGE_MAX_LENGTH = 3000;

export const TRANSLATE_LANGUAGES: { code: TranslateLanguage; label: string }[] = [
  { code: "bg", label: "Български" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "el", label: "Ελληνικά" },
  { code: "tr", label: "Türkçe" },
];
