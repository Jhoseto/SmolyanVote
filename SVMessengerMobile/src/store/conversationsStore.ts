/**
 * Conversations Store (Zustand)
 * Управление на conversations state
 */

import { create } from 'zustand';
import { Conversation, ConversationsState } from '../types/conversation';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';

interface ConversationsStore extends ConversationsState {
  // Actions
  fetchConversations: () => Promise<void>;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: number, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: number) => void;
  selectConversation: (conversationId: number | null) => void;
  markAsRead: (conversationId: number) => void;
  incrementUnreadCount: (conversationId: number) => void;
  clearError: () => void;
}

export const useConversationsStore = create<ConversationsStore>((set, get) => ({
  // Initial state
  conversations: [],
  isLoading: false,
  error: null,
  selectedConversationId: null,

  // Fetch conversations
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.MESSENGER.CONVERSATIONS);
      const rawData = response.data;
      
      // Map backend response да съответства на frontend типовете
      // Backend връща: { id, otherUser, lastMessage, lastMessageTime, unreadCount, createdAt }
      // Frontend очаква: { id, participant, lastMessage, unreadCount, createdAt, updatedAt }
      const mappedConversations = Array.isArray(rawData) ? rawData.map((conv: any) => ({
        id: conv.id,
        participant: conv.otherUser || {}, // Map otherUser -> participant
        lastMessage: conv.lastMessage ? {
          text: conv.lastMessage,
          createdAt: conv.lastMessageTime,
        } : null,
        unreadCount: conv.unreadCount || 0,
        isHidden: false,
        createdAt: conv.createdAt,
        updatedAt: conv.lastMessageTime || conv.createdAt,
      })) : [];
      
      set({
        conversations: mappedConversations,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({
        conversations: [], // Винаги връща масив, дори при грешка
        isLoading: false,
        error: error.message || 'Failed to fetch conversations',
      });
    }
  },

  // Add conversation
  addConversation: (conversation: Conversation) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (exists) {
        return state;
      }
      return {
        conversations: [conversation, ...state.conversations],
      };
    });
  },

  // Update conversation
  updateConversation: (conversationId: number, updates: Partial<Conversation>) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    }));
  },

  // Remove conversation
  removeConversation: (conversationId: number) => {
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== conversationId),
      selectedConversationId:
        state.selectedConversationId === conversationId ? null : state.selectedConversationId,
    }));
  },

  // Select conversation
  selectConversation: (conversationId: number | null) => {
    set({ selectedConversationId: conversationId });
  },

  // Mark conversation as read
  markAsRead: (conversationId: number) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    }));
  },

  // Increment unread count
  incrementUnreadCount: (conversationId: number) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
          : conv
      ),
    }));
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

