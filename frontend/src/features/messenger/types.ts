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

/** Mirrors backend `SVConversationDTO`. */
export interface Conversation {
  id: number;
  otherUser: MessengerUser;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isTyping: boolean;
  createdAt: string;
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
  position: { x: number; y: number };
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
