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

      // Backend връща Page<SVMessageDTO> - Spring Data Page обект
      const messagesArray = (response.data && response.data.content && Array.isArray(response.data.content)) 
        ? response.data.content 
        : (Array.isArray(response.data) ? response.data : []);
      
      // Parse messages from backend DTO format
      const fetchedMessages: Message[] = messagesArray
        .filter((msg: any) => msg && msg.id != null)
        .map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversationId || conversationId,
          senderId: msg.senderId,
          text: msg.text || '',
          createdAt: msg.sentAt || msg.createdAt || new Date().toISOString(),
          isRead: msg.isRead || false,
          isDelivered: msg.isDelivered || false,
          readAt: msg.readAt,
          deliveredAt: msg.deliveredAt,
          type: (msg.messageType || msg.type || 'TEXT') as MessageType,
        }))
        // Backend връща DESC (новите първо), но ние искаме ASC (старите първо)
        .reverse()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
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

  // Add message with deduplication and sorting
  addMessage: (conversationId: number, message: Message) => {
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const exists = existingMessages.some((m) => m.id === message.id);
      
      if (exists) {
        // Update existing message instead of adding duplicate
        return {
          messages: {
            ...state.messages,
            [conversationId]: existingMessages.map((m) =>
              m.id === message.id ? message : m
            ),
          },
        };
      }

      // Add new message and sort by date ascending (oldest first, newest last)
      const updatedMessages = [...existingMessages, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
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

  // Send message via REST API (fallback when WebSocket is not available)
  sendMessage: async (conversationId: number, text: string) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSENGER.SEND_MESSAGE, {
        conversationId,
        text,
      });

      // Parse message from backend DTO format
      const msg = response.data;
      const message: Message = {
        id: msg.id,
        conversationId: msg.conversationId || conversationId,
        senderId: msg.senderId,
        text: msg.text || '',
        createdAt: msg.sentAt || msg.createdAt || new Date().toISOString(),
        isRead: msg.isRead || false,
        isDelivered: msg.isDelivered || false,
        readAt: msg.readAt,
        deliveredAt: msg.deliveredAt,
        type: (msg.messageType || msg.type || 'TEXT') as MessageType,
      };
      
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

