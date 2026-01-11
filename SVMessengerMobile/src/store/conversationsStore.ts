/**
 * Conversations Store (Zustand)
 * Управление на conversations state
 */

import { create } from 'zustand';
import { Conversation, ConversationsState } from '../types/conversation';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';

// Helper function to map backend conversation to frontend format (exactly like web version)
const mapBackendConversation = (conv: any): Conversation => ({
  id: conv.id,
  participant: conv.otherUser || {}, // Map otherUser -> participant
  lastMessage: conv.lastMessage ? {
    text: conv.lastMessage,
    createdAt: conv.lastMessageTime,
  } : undefined,
  unreadCount: conv.unreadCount || 0,
  missedCalls: conv.missedCalls || 0,
  isHidden: false,
  createdAt: conv.createdAt,
  updatedAt: conv.lastMessageTime || conv.createdAt,
});

interface ConversationsStore extends ConversationsState {
  // Total unread count across all conversations
  totalUnreadCount: number;

  // Actions
  fetchConversations: () => Promise<void>;
  getConversation: (conversationId: number) => Promise<Conversation | null>;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: number, updates: Partial<Conversation>) => void;
  updateConversationWithNewMessage: (conversationId: number, messageText: string, messageCreatedAt: string, incrementUnread: boolean) => void;
  removeConversation: (conversationId: number) => void;
  deleteConversation: (conversationId: number) => Promise<boolean>;
  hideConversation: (conversationId: number) => Promise<boolean>;
  selectConversation: (conversationId: number | null) => void;
  markAsRead: (conversationId: number) => Promise<void>;
  incrementUnreadCount: (conversationId: number) => void;
  incrementMissedCalls: (conversationId: number) => void;
  clearMissedCalls: (conversationId: number) => void;
  clearError: () => void;
  recalculateTotalUnreadCount: () => void;
  clearConversations: () => void;
}

export const useConversationsStore = create<ConversationsStore>((set, get) => ({
  // Initial state
  conversations: [],
  isLoading: false,
  error: null,
  selectedConversationId: null,
  totalUnreadCount: 0,

  // Fetch conversations
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.MESSENGER.CONVERSATIONS);
      const rawData = response.data;
      
      // Map backend response да съответства на frontend типовете (exactly like web version)
      // Backend връща: { id, otherUser, lastMessage, lastMessageTime, unreadCount, createdAt }
      // Frontend очаква: { id, participant, lastMessage, unreadCount, createdAt, updatedAt }
      const mappedConversations = Array.isArray(rawData) 
        ? rawData.map((conv: any) => mapBackendConversation(conv))
        : [];
      
      // Recalculate total unread count immediately (exactly like web version)
      const totalUnread = mappedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      
      set({
        conversations: mappedConversations,
        isLoading: false,
        error: null,
        totalUnreadCount: totalUnread,
      });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({
        conversations: [], // Винаги връща масив, дори при грешка
        isLoading: false,
        error: error.message || 'Failed to fetch conversations',
        totalUnreadCount: 0,
      });
    }
  },

  // Get single conversation by ID (exactly like web version)
  getConversation: async (conversationId: number): Promise<Conversation | null> => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.GET_CONVERSATION.replace(':id', conversationId.toString());
      const response = await apiClient.get(endpoint);
      const rawData = response.data;
      
      if (!rawData) {
        return null;
      }
      
      // Map backend response to frontend format (exactly like web version)
      return mapBackendConversation(rawData);
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  },

  // Add conversation
  addConversation: (conversation: Conversation) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (exists) {
        return state;
      }
      const updated = [conversation, ...state.conversations];
      const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updated,
        totalUnreadCount: totalUnread,
      };
    });
  },

  // Update conversation (exactly like web version - recalculates totalUnreadCount)
  updateConversation: (conversationId: number, updates: Partial<Conversation>) => {
    set((state) => {
      const updated = state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      );
      const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updated,
        totalUnreadCount: totalUnread,
      };
    });
  },

  // Update conversation with new message and increment unread count (exactly like web version)
  updateConversationWithNewMessage: (conversationId: number, messageText: string, messageCreatedAt: string, incrementUnread: boolean = false) => {
    set((state) => {
      const updated = state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: {
                text: messageText,
                createdAt: messageCreatedAt,
              },
              updatedAt: messageCreatedAt,
              unreadCount: incrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
            }
          : conv
      );
      const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updated,
        totalUnreadCount: totalUnread,
      };
    });
  },

  // Remove conversation (local only)
  removeConversation: (conversationId: number) => {
    set((state) => {
      const updated = state.conversations.filter((conv) => conv.id !== conversationId);
      const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updated,
        selectedConversationId:
          state.selectedConversationId === conversationId ? null : state.selectedConversationId,
        totalUnreadCount: totalUnread,
      };
    });
  },

  // Delete conversation (API call)
  deleteConversation: async (conversationId: number) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.DELETE_CONVERSATION.replace(':id', conversationId.toString());
      await apiClient.delete(endpoint);
      get().removeConversation(conversationId);
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete conversation' });
      return false;
    }
  },

  // Hide conversation (API call)
  hideConversation: async (conversationId: number) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.HIDE_CONVERSATION.replace(':id', conversationId.toString());
      await apiClient.put(endpoint);
      get().removeConversation(conversationId);
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to hide conversation' });
      return false;
    }
  },

  // Select conversation
  selectConversation: (conversationId: number | null) => {
    set({ selectedConversationId: conversationId });
  },

  // Mark conversation as read (exactly like web version)
  // Извиква REST API endpoint за да се запише в базата данни + обновява локалния state
  markAsRead: async (conversationId: number) => {
    // Update local state immediately - zero unread count and recalculate total (like web version)
    set((state) => {
      const updated = state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      );
      const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updated,
        totalUnreadCount: totalUnread,
      };
    });

    // Call REST API endpoint to mark as read in database (exactly like web version)
    try {
      const endpoint = API_CONFIG.ENDPOINTS.MESSENGER.MARK_AS_READ.replace(':id', conversationId.toString());
      await apiClient.put(endpoint);
    } catch (error: any) {
      console.error('❌ Failed to mark conversation as read via REST API:', error);
      // Don't revert local state - UI should still show as read even if API call fails
      // WebSocket read receipt will also update the state
    }

    // Note: sendReadReceipt should be called separately from useMessages.ts
    // Backend will send read receipt via WebSocket which will also update the state
  },

  // Increment unread count (exactly like web version)
  incrementUnreadCount: (conversationId: number) => {
    set((state) => {
      const updated = state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
          : conv
      );
      const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return {
        conversations: updated,
        totalUnreadCount: totalUnread,
      };
    });
  },

  // Increment missed calls
  incrementMissedCalls: (conversationId: number) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, missedCalls: (conv.missedCalls || 0) + 1 }
          : conv
      ),
    }));
  },

  // Clear missed calls
  clearMissedCalls: (conversationId: number) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, missedCalls: 0 } : conv
      ),
    }));
  },

  // Recalculate total unread count
  recalculateTotalUnreadCount: () => {
    set((state) => ({
      totalUnreadCount: state.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0),
    }));
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear all conversations
  clearConversations: () => {
    set({
      conversations: [],
      totalUnreadCount: 0,
      selectedConversationId: null,
    });
  },
}));

