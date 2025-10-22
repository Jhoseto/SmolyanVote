/**
 * Global State Management за SVMessenger
 * Използва React Context API
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { svMessengerAPI } from '../services/svMessengerAPI';
import svWebSocketService from '../services/svWebSocketService';

const SVMessengerContext = createContext(null);

export const useSVMessenger = () => {
  const context = useContext(SVMessengerContext);
  if (!context) {
    throw new Error('useSVMessenger must be used within SVMessengerProvider');
  }
  return context;
};

export const SVMessengerProvider = ({ children, userData }) => {
  
  // ========== STATE ==========
  
  // User data
  const [currentUser] = useState(userData);
  
  // Conversations
  const [conversations, setConversations] = useState([]);
  const [activeChats, setActiveChats] = useState([]); // Max 3 open chats
  
  // Messages by conversation ID
  const [messagesByConversation, setMessagesByConversation] = useState({});
  
  // Loading states
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState({});
  
  // UI State
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState({});
  
  // Unread count
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  // WebSocket connection status
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  
  // Refs
  const typingTimeouts = useRef({});
  const messageSound = useRef(null);
  
  // ========== EFFECTS ==========
  
  // Initialize WebSocket connection
  useEffect(() => {
    console.log('SVMessenger: Initializing WebSocket connection');
    
    svWebSocketService.connect({
      onConnect: handleWebSocketConnect,
      onDisconnect: handleWebSocketDisconnect,
      onError: handleWebSocketError,
      onNewMessage: handleNewMessage,
      onTypingStatus: handleTypingStatus,
      onReadReceipt: handleReadReceipt,
      onOnlineStatus: handleOnlineStatus
    });
    
    // Load initial data
    loadConversations();
    loadUnreadCount();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Cleanup на unmount
    return () => {
      svWebSocketService.disconnect();
    };
  }, []);
  
  // Subscribe to typing status за active chats
  useEffect(() => {
    activeChats.forEach(chat => {
      svWebSocketService.subscribeToTyping(chat.id, handleTypingStatus);
    });
    
    // Cleanup subscriptions когато chats се променят
    return () => {
      activeChats.forEach(chat => {
        svWebSocketService.unsubscribeFromTyping(chat.id);
      });
    };
  }, [activeChats.map(c => c.id).join(',')]);
  
  // ========== WEBSOCKET HANDLERS ==========
  
  const handleWebSocketConnect = useCallback(() => {
    console.log('SVMessenger: WebSocket connected');
    setIsWebSocketConnected(true);
  }, []);
  
  const handleWebSocketDisconnect = useCallback(() => {
    console.log('SVMessenger: WebSocket disconnected');
    setIsWebSocketConnected(false);
  }, []);
  
  const handleWebSocketError = useCallback((error) => {
    console.error('SVMessenger: WebSocket error', error);
  }, []);
  
  const handleNewMessage = useCallback((message) => {
    console.log('SVMessenger: New message received', message);
    
    // Add message to conversation
    setMessagesByConversation(prev => ({
      ...prev,
      [message.conversationId]: [
        message,
        ...(prev[message.conversationId] || [])
      ]
    }));
    
    // Update conversation list
    loadConversations();
    
    // Check ако chat window е отворен
    const chatIsOpen = activeChats.some(c => c.id === message.conversationId);
    
    if (chatIsOpen) {
      // Auto mark as read ако chat-а е отворен
      markAsRead(message.conversationId);
    } else {
      // Increase unread count
      setTotalUnreadCount(prev => prev + 1);
      
      // Play notification sound
      playNotificationSound();
      
      // Show browser notification
      showBrowserNotification(message);
    }
  }, [activeChats]);
  
  const handleTypingStatus = useCallback((status) => {
    console.log('SVMessenger: Typing status', status);
    
    const { conversationId, userId, isTyping } = status;
    
    if (isTyping) {
      // Add user to typing list
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: userId
      }));
      
      // Clear previous timeout
      if (typingTimeouts.current[conversationId]) {
        clearTimeout(typingTimeouts.current[conversationId]);
      }
      
      // Auto-clear след 3 секунди
      typingTimeouts.current[conversationId] = setTimeout(() => {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }, 3000);
    } else {
      // Remove user от typing list
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
      
      // Clear timeout
      if (typingTimeouts.current[conversationId]) {
        clearTimeout(typingTimeouts.current[conversationId]);
        delete typingTimeouts.current[conversationId];
      }
    }
  }, []);
  
  const handleReadReceipt = useCallback((receipt) => {
    console.log('SVMessenger: Read receipt', receipt);
    
    const { messageId, conversationId, readAt } = receipt;
    
    if (receipt.type === 'BULK_READ') {
      // All messages marked as read
      setMessagesByConversation(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m => ({
          ...m,
          isRead: true,
          readAt: readAt
        }))
      }));
    } else {
      // Single message marked as read
      setMessagesByConversation(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m =>
          m.id === messageId ? { ...m, isRead: true, readAt } : m
        )
      }));
    }
  }, []);
  
  const handleOnlineStatus = useCallback((status) => {
    console.log('SVMessenger: Online status', status);
    
    const { userId, isOnline } = status;
    
    // Update user online status в conversations
    setConversations(prev => prev.map(conv => {
      if (conv.otherUser.id === userId) {
        return {
          ...conv,
          otherUser: {
            ...conv.otherUser,
            isOnline
          }
        };
      }
      return conv;
    }));
    
    // Update в active chats
    setActiveChats(prev => prev.map(chat => {
      if (chat.otherUser.id === userId) {
        return {
          ...chat,
          otherUser: {
            ...chat.otherUser,
            isOnline
          }
        };
      }
      return chat;
    }));
  }, []);
  
  // ========== API METHODS ==========
  
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const data = await svMessengerAPI.getConversations();
      setConversations(data);
      console.log('SVMessenger: Loaded conversations', data.length);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);
  
  const loadMessages = useCallback(async (conversationId, page = 0) => {
    // Set loading state
    setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      const data = await svMessengerAPI.getMessages(conversationId, page);
      
      setMessagesByConversation(prev => ({
        ...prev,
        [conversationId]: page === 0 
          ? data.content 
          : [...(prev[conversationId] || []), ...data.content]
      }));
      
      console.log(`SVMessenger: Loaded messages for conversation ${conversationId}, page ${page}`);
      return data;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return { content: [], totalPages: 0, last: true };
    } finally {
      setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);
  
  const sendMessage = useCallback(async (conversationId, text) => {
    if (!text || text.trim().length === 0) {
      return;
    }
    
    // Optimistic UI update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      senderImageUrl: currentUser.imageUrl,
      text: text.trim(),
      sentAt: new Date().toISOString(),
      isRead: false,
      isTemp: true
    };
    
    // Add to local state immediately
    setMessagesByConversation(prev => ({
      ...prev,
      [conversationId]: [tempMessage, ...(prev[conversationId] || [])]
    }));
    
    try {
      // Send via WebSocket (preferred)
      if (isWebSocketConnected) {
        const sent = svWebSocketService.sendMessage(conversationId, text.trim());
        if (sent) {
          console.log('SVMessenger: Message sent via WebSocket');
          // Remove temp message (real one ще дойде от WebSocket)
          setTimeout(() => {
            setMessagesByConversation(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).filter(m => m.id !== tempMessage.id)
            }));
          }, 500);
        } else {
          throw new Error('WebSocket send failed');
        }
      } else {
        // Fallback to HTTP
        console.log('SVMessenger: Sending message via HTTP fallback');
        const message = await svMessengerAPI.sendMessage(conversationId, text.trim());
        
        // Replace temp message with real one
        setMessagesByConversation(prev => ({
          ...prev,
          [conversationId]: [
            message,
            ...(prev[conversationId] || []).filter(m => m.id !== tempMessage.id)
          ]
        }));
      }
      
      // Update conversation list
      await loadConversations();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove temp message on error
      setMessagesByConversation(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(m => m.id !== tempMessage.id)
      }));
      
      // Show error to user
      alert('Грешка при изпращане на съобщение. Моля опитайте отново.');
    }
  }, [currentUser, isWebSocketConnected]);
  
  const startConversation = useCallback(async (otherUserId) => {
    try {
      const conversation = await svMessengerAPI.startConversation(otherUserId);
      
      // Add to conversations list if not exists
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation.id);
        return exists ? prev : [conversation, ...prev];
      });
      
      // Open chat window
      openChat(conversation.id);
      
      console.log('SVMessenger: Started conversation', conversation.id);
      return conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Грешка при стартиране на разговор.');
    }
  }, []);
  
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await svMessengerAPI.markAsRead(conversationId);
      
      // Update local state
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
      
      // Update messages
      setMessagesByConversation(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m => ({
          ...m,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      }));
      
      // Reload unread count
      loadUnreadCount();
      
      console.log('SVMessenger: Marked conversation as read', conversationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);
  
  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await svMessengerAPI.getUnreadCount();
      setTotalUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);
  
  const sendTypingStatus = useCallback((conversationId, isTyping) => {
    if (isWebSocketConnected) {
      svWebSocketService.sendTypingStatus(conversationId, isTyping);
    }
  }, [isWebSocketConnected]);
  
  // ========== UI METHODS ==========
  
  const openChatList = useCallback(() => {
    setIsChatListOpen(true);
    setIsSearchOpen(false);
  }, []);
  
  const closeChatList = useCallback(() => {
    setIsChatListOpen(false);
    setIsSearchOpen(false);
  }, []);
  
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);
  
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);
  
  const openChat = useCallback((conversationId) => {
    // Find conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
      console.warn('Conversation not found:', conversationId);
      return;
    }
    
    // Check if already open
    if (activeChats.some(c => c.id === conversationId)) {
      console.log('Chat already open:', conversationId);
      return;
    }
    
    // If 3 chats are open, close the oldest (first in array)
    if (activeChats.length >= 3) {
      setActiveChats(prev => [...prev.slice(1), { ...conversation, isMinimized: false }]);
    } else {
      setActiveChats(prev => [...prev, { ...conversation, isMinimized: false }]);
    }
    
    // Load messages
    loadMessages(conversationId);
    
    // Mark as read
    markAsRead(conversationId);
    
    // Close chat list
    closeChatList();
    
    console.log('SVMessenger: Opened chat', conversationId);
  }, [conversations, activeChats, loadMessages, markAsRead, closeChatList]);
  
  const closeChat = useCallback((conversationId) => {
    setActiveChats(prev => prev.filter(c => c.id !== conversationId));
    console.log('SVMessenger: Closed chat', conversationId);
  }, []);
  
  const minimizeChat = useCallback((conversationId) => {
    setActiveChats(prev => prev.map(c =>
      c.id === conversationId ? { ...c, isMinimized: !c.isMinimized } : c
    ));
  }, []);
  
  // ========== HELPER METHODS ==========
  
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  };
  
  const playNotificationSound = () => {
    // TODO: Add notification sound file
    // try {
    //   if (!messageSound.current) {
    //     messageSound.current = new Audio('/svmessenger/svmessenger-assets/notification.mp3');
    //   }
    //   messageSound.current.play().catch(err => {
    //     console.log('Could not play sound:', err);
    //   });
    // } catch (error) {
    //   console.error('Error playing sound:', error);
    // }
  };
  
  const showBrowserNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Ново съобщение от ${message.senderUsername}`, {
          body: message.text.substring(0, 100),
          icon: message.senderImageUrl || '/images/default-avatar.png',
          badge: '/images/svmessenger-icon.png',
          tag: `svmessenger-${message.conversationId}`,
          requireInteraction: false
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };
  
  // ========== CONTEXT VALUE ==========
  
  const value = {
    // State
    currentUser,
    conversations,
    activeChats,
    messagesByConversation,
    isChatListOpen,
    isSearchOpen,
    isLoadingConversations,
    loadingMessages,
    typingUsers,
    totalUnreadCount,
    isWebSocketConnected,
    
    // Methods
    loadConversations,
    loadMessages,
    sendMessage,
    startConversation,
    markAsRead,
    sendTypingStatus,
    openChatList,
    closeChatList,
    openSearch,
    closeSearch,
    openChat,
    closeChat,
    minimizeChat
  };
  
  return (
    <SVMessengerContext.Provider value={value}>
      {children}
    </SVMessengerContext.Provider>
  );
};
