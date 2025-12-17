/**
 * Message Types
 */

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: string;
  isRead: boolean;
  isDelivered: boolean;
  readAt?: string;
  deliveredAt?: string;
  type: MessageType;
  isEdited?: boolean;
  editedAt?: string;
  parentMessageId?: number;
  parentMessageText?: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export interface SendMessageRequest {
  conversationId: number;
  text: string;
  parentMessageId?: number;
}

export interface SendMessageResponse {
  message: Message;
}

export interface MessagesState {
  messages: Record<number, Message[]>; // conversationId -> messages[]
  isLoading: boolean;
  error: string | null;
  typingUsers: Record<number, number[]>; // conversationId -> userIds[]
}

export interface TypingStatus {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

