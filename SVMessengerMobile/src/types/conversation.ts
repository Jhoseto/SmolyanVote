/**
 * Conversation Types
 */

import { User } from './auth';
import { Message } from './message';

export interface Conversation {
  id: number;
  participant: User; // Frontend използва participant
  otherUser?: User; // Backend връща otherUser
  lastMessage?: {
    id?: number;
    text: string;
    senderId?: number;
    createdAt: string;
  };
  unreadCount: number;
  missedCalls?: number; // Number of missed calls in this conversation
  isHidden?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastMessageTime?: string; // Backend връща lastMessageTime
}

export interface ConversationListItem {
  id: number;
  participant: User;
  lastMessage?: {
    id: number;
    text: string;
    senderId: number;
    createdAt: string;
  };
  unreadCount: number;
  isHidden: boolean;
  updatedAt: string;
}

export interface ConversationsState {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  selectedConversationId: number | null;
  totalUnreadCount: number;
}

