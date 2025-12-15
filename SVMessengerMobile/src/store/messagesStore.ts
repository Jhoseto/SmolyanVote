/**
 * Messages Store (Zustand)
 * Управление на messages state
 */

import { create } from 'zustand';
import { Message, MessagesState, TypingStatus } from '../types/message';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';

interface MessagesStore extends MessagesState {
  // Actions
  fetchMessages: (conversationId: number, page?: number, size?: number) => Promise<void>;
  addMessage: (conversationId: number, message: Message) => void;
  updateMessage: (conversationId: number, messageId: number, updates: Partial<Message>) => void;
  removeMessage: (conversationId: number, messageId: number) => void;
  sendMessage: (conversationId: number, text: string) => Promise<Message | null>;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  clearMessages: (conversationId: number) => void;
  clearError: () => void;
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  // Initial state
  messages: {},
  isLoading: false,
  error: null,
  typingUsers: {},

  // Fetch messages
  fetchMessages: async (conversationId: number, page = 0, size = 50) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.MESSAGES.replace(':id', conversationId.toString());
      const response = await apiClient.get(endpoint, {
        params: { page, size },
      });

      const fetchedMessages: Message[] = response.data.content || response.data || [];
      
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: fetchedMessages,
        },
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch messages',
      });
    }
  },

  // Add message
  addMessage: (conversationId: number, message: Message) => {
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const exists = existingMessages.some((m) => m.id === message.id);
      
      if (exists) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    });
  },

  // Update message
  updateMessage: (conversationId: number, messageId: number, updates: Partial<Message>) => {
    set((state) => {
      const conversationMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: conversationMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        },
      };
    });
  },

  // Remove message
  removeMessage: (conversationId: number, messageId: number) => {
    set((state) => {
      const conversationMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: conversationMessages.filter((msg) => msg.id !== messageId),
        },
      };
    });
  },

  // Send message (via WebSocket или REST API fallback)
  sendMessage: async (conversationId: number, text: string, useWebSocket: boolean = true) => {
    try {
      // Try WebSocket first if available
      if (useWebSocket) {
        // WebSocket sending ще се направи от hook-а
        // Тук само използваме REST API като fallback
      }

      // REST API fallback
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.SEND_MESSAGE.replace(':id', conversationId.toString());
      const response = await apiClient.post(endpoint, { text });

      const message: Message = response.data;
      get().addMessage(conversationId, message);
      
      return message;
    } catch (error: any) {
      set({ error: error.message || 'Failed to send message' });
      return null;
    }
  },

  // Set typing status
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      let updatedTyping: number[];

      if (isTyping) {
        updatedTyping = currentTyping.includes(userId)
          ? currentTyping
          : [...currentTyping, userId];
      } else {
        updatedTyping = currentTyping.filter((id) => id !== userId);
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedTyping,
        },
      };
    });
  },

  // Clear messages for conversation
  clearMessages: (conversationId: number) => {
    set((state) => {
      const { [conversationId]: _, ...restMessages } = state.messages;
      return { messages: restMessages };
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

