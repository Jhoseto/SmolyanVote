/**
 * Messages Store (Zustand)
 * Управление на messages state
 */

import { create } from 'zustand';
import { Message, MessagesState, TypingStatus } from '../types/message';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';

interface MessagesStore extends MessagesState {
  // Pagination state
  pagination: Record<number, { currentPage: number; hasMore: boolean; isLoadingMore: boolean }>;
  
  // Actions
  fetchMessages: (conversationId: number, page?: number, size?: number, append?: boolean) => Promise<void>;
  addMessage: (conversationId: number, message: Message) => void;
  updateMessage: (conversationId: number, messageId: number, updates: Partial<Message>) => void;
  removeMessage: (conversationId: number, messageId: number) => void;
  sendMessage: (conversationId: number, text: string, parentMessageId?: number) => Promise<Message | null>;
  editMessage: (messageId: number, newText: string) => Promise<Message | null>;
  deleteMessage: (messageId: number, conversationId: number) => Promise<boolean>;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  clearMessages: (conversationId: number) => void;
  clearError: () => void;
  loadMoreMessages: (conversationId: number) => Promise<void>;
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  // Initial state
  messages: {},
  isLoading: false,
  error: null,
  typingUsers: {},
  pagination: {},

  // Fetch messages
  fetchMessages: async (conversationId: number, page = 0, size = 50, append = false) => {
    // Ако append е true, значи зареждаме още съобщения (infinite scroll)
    // Ако append е false, значи зареждаме първоначално или refresh-ваме
    if (append) {
      // Set loading more state
      set((state) => ({
        pagination: {
          ...state.pagination,
          [conversationId]: {
            ...state.pagination[conversationId],
            isLoadingMore: true,
          },
        },
      }));
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.MESSAGES.replace(':id', conversationId.toString());
      const response = await apiClient.get(endpoint, {
        params: { page, size },
      });

      // Backend връща Page<SVMessageDTO> - Spring Data Page обект
      const pageData = response.data;
      const messagesArray = (pageData && pageData.content && Array.isArray(pageData.content)) 
        ? pageData.content 
        : (Array.isArray(pageData) ? pageData : []);
      
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
          isEdited: msg.isEdited || false,
          editedAt: msg.editedAt,
          parentMessageId: msg.parentMessageId,
          parentMessageText: msg.parentMessageText,
        }))
        // Backend връща DESC (новите първо), но ние искаме ASC (старите първо)
        .reverse()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Determine if there are more pages
      const totalElements = pageData?.totalElements || messagesArray.length;
      const totalPages = pageData?.totalPages || Math.ceil(totalElements / size);
      const hasMore = page < totalPages - 1;

      set((state) => {
        const existingMessages = state.messages[conversationId] || [];
        
        if (append) {
          // Append new messages to the beginning (older messages)
          // Deduplicate by message ID
          const existingIds = new Set(existingMessages.map(m => m.id));
          const newMessages = fetchedMessages.filter(m => !existingIds.has(m.id));
          
          // Combine: new messages (older) + existing messages (newer)
          const combinedMessages = [...newMessages, ...existingMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          return {
            messages: {
              ...state.messages,
              [conversationId]: combinedMessages,
            },
            pagination: {
              ...state.pagination,
              [conversationId]: {
                currentPage: page,
                hasMore,
                isLoadingMore: false,
              },
            },
          };
        } else {
          // Replace all messages (initial load or refresh)
          return {
            messages: {
              ...state.messages,
              [conversationId]: fetchedMessages,
            },
            isLoading: false,
            error: null,
            pagination: {
              ...state.pagination,
              [conversationId]: {
                currentPage: page,
                hasMore,
                isLoadingMore: false,
              },
            },
          };
        }
      });
    } catch (error: any) {
      set((state) => ({
        isLoading: false,
        error: error.message || 'Failed to fetch messages',
        pagination: {
          ...state.pagination,
          [conversationId]: {
            ...state.pagination[conversationId],
            isLoadingMore: false,
          },
        },
      }));
    }
  },

  // Load more messages (infinite scroll)
  loadMoreMessages: async (conversationId: number) => {
    const state = get();
    const pagination = state.pagination[conversationId];
    
    if (!pagination || pagination.isLoadingMore || !pagination.hasMore) {
      return;
    }

    const nextPage = pagination.currentPage + 1;
    await get().fetchMessages(conversationId, nextPage, 50, true);
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

  // Edit message
  editMessage: async (messageId: number, newText: string) => {
    try {
      const response = await apiClient.put(`/api/svmessenger/messages/${messageId}/edit`, {
        newText,
      });

      const msg = response.data;
      const updatedMessage: Message = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        text: msg.text || '',
        createdAt: msg.sentAt || msg.createdAt || new Date().toISOString(),
        isRead: msg.isRead || false,
        isDelivered: msg.isDelivered || false,
        readAt: msg.readAt,
        deliveredAt: msg.deliveredAt,
        type: (msg.messageType || msg.type || 'TEXT') as MessageType,
        isEdited: msg.isEdited || true,
        editedAt: msg.editedAt || new Date().toISOString(),
      };

      // Update message in store
      get().updateMessage(msg.conversationId, messageId, updatedMessage);
      return updatedMessage;
    } catch (error: any) {
      set({ error: error.message || 'Failed to edit message' });
      return null;
    }
  },

  // Delete message
  deleteMessage: async (messageId: number, conversationId: number) => {
    try {
      await apiClient.delete(`/api/svmessenger/messages/${messageId}`);
      
      // Remove message from store
      get().removeMessage(conversationId, messageId);
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete message' });
      return false;
    }
  },

  // Send message via REST API (fallback when WebSocket is not available)
  sendMessage: async (conversationId: number, text: string, parentMessageId?: number) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSENGER.SEND_MESSAGE, {
        conversationId,
        text,
        parentMessageId,
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
        parentMessageId: msg.parentMessageId,
        parentMessageText: msg.parentMessageText,
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

