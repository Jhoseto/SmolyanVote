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
      set({
        conversations: response.data || [],
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
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

