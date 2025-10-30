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
    const [activeChats, setActiveChats] = useState([]); // { id, conversation, isMinimized, position, zIndex }

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
    const nextZIndex = useRef(1000);

    useEffect(() => {
        if (!messageSound.current) {
            // Use built asset path under /svmessenger
            const audio = new window.Audio('/svmessenger/sounds/s1.mp3');
            audio.preload = 'auto';
            messageSound.current = audio;
        }
    }, []);

    // ========== EFFECTS ==========

    // Initialize WebSocket connection
    useEffect(() => {

        svWebSocketService.connect({
            onConnect: handleWebSocketConnect,
            onDisconnect: handleWebSocketDisconnect,
            onError: handleWebSocketError,
            onNewMessage: handleNewMessage,
            onTypingStatus: handleTypingStatus,
            onReadReceipt: handleReadReceipt,
            onDeliveryReceipt: handleDeliveryReceipt,
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
            svWebSocketService.subscribeToTyping(chat.conversation.id, handleTypingStatus);
        });

        // Cleanup subscriptions когато chats се променят
        return () => {
            activeChats.forEach(chat => {
                svWebSocketService.unsubscribeFromTyping(chat.conversation.id);
            });
        };
    }, [activeChats.map(c => c.id).join(',')]);

    // ========== WEBSOCKET HANDLERS ==========

    const handleWebSocketConnect = useCallback(() => {
        setIsWebSocketConnected(true);
    }, []);

    const handleWebSocketDisconnect = useCallback(() => {
        setIsWebSocketConnected(false);
    }, []);

    const handleWebSocketError = useCallback((error) => {
        console.error('SVMessenger: WebSocket error', error);
    }, []);

    const handleNewMessage = useCallback((message) => {

        // Add message to conversation (at the end for newest messages to appear at bottom)
        setMessagesByConversation(prev => ({
            ...prev,
            [message.conversationId]: [
                ...(prev[message.conversationId] || []),
                message
            ]
        }));

        // Update conversation list locally (no HTTP call needed for performance)
        setConversations(prev => prev.map(c =>
            c.id === message.conversationId
                ? {
                    ...c,
                    lastMessage: message.text,
                    lastMessageTime: message.sentAt
                }
                : c
        ));

        // Check chat states
        const chat = activeChats.find(c => c.conversation.id === message.conversationId);
        const chatIsVisible = chat && !chat.isMinimized;
        const chatIsMinimized = chat && chat.isMinimized;

        if (chatIsVisible) {
            // Chat е видим (отворен и не minimized) - НЕ маркирай автоматично като прочетено
            // Маркирането става само при потребителска активност (клик в прозореца)
        } else if (chatIsMinimized) {
            // Chat е minimized - увеличи badge за tab, но не маркирай като прочетено

            // Update conversations
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === message.conversationId
                        ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                        : c
                );
                // Recalculate total unread count
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });

            // SVTaskbar will read live conversation data from conversations state
        } else {
            // Chat е напълно затворен - покажи notifications
            setTotalUnreadCount(prev => prev + 1);

            // Update conversation unread count
            setConversations(prev => prev.map(c =>
                c.id === message.conversationId
                    ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                    : c
            ));

            // Play notification sound
            playNotificationSound();

            // Show browser notification
            showBrowserNotification(message);
        }
    }, [activeChats]);

    const handleTypingStatus = useCallback((status) => {

        const { conversationId, userId, isTyping } = status;

        if (isTyping) {
            // Add user to typing list
            setTypingUsers(prev => ({
                ...prev,
                [conversationId]: userId
            }));

            // Clear timeout
            if (typingTimeouts.current[conversationId]) {
                clearTimeout(typingTimeouts.current[conversationId]);
            }

            // Auto-remove след 3 секунди
            typingTimeouts.current[conversationId] = setTimeout(() => {
                setTypingUsers(prev => {
                    const updated = { ...prev };
                    delete updated[conversationId];
                    return updated;
                });
            }, 3000);
        } else {
            // Remove from typing list
            setTypingUsers(prev => {
                const updated = { ...prev };
                delete updated[conversationId];
                return updated;
            });
        }
    }, []);

    const handleReadReceipt = useCallback((data) => {

        if (!data) return;

        const { type, conversationId, messageId, readAt } = data;

        if (type === 'BULK_READ') {
            // BULK READ: Mark ALL messages in conversation as read (only OUR sent messages)

            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(m =>
                    m.senderId === currentUser.id ? { ...m, isRead: true, readAt: m.readAt || readAt } : m
                )
            }));

            // Reset unread count for this conversation
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
                // Recalculate total unread count
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });

        } else if (messageId) {
            // SINGLE READ: Mark specific message as read (only if it's OUR message)

            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(m =>
                    m.id === messageId && m.senderId === currentUser.id ? { ...m, isRead: true, readAt } : m
                )
            }));

            // Decrease unread count by 1 (if this was the last unread message)
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId
                        ? { ...c, unreadCount: Math.max(0, (c.unreadCount || 0) - 1) }
                        : c
                );
                // Recalculate total unread count
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });
        }
    }, [conversations, currentUser]);

    const handleDeliveryReceipt = useCallback((data) => {

        if (data.type === 'BULK_DELIVERY') {
            // Bulk delivery receipt - маркирай всички съобщения в засегнатите conversations като delivered
            const { conversationIds, deliveredAt } = data;
            setMessagesByConversation(prev => {
                const updated = { ...prev };
                conversationIds.forEach(conversationId => {
                    if (updated[conversationId]) {
                        updated[conversationId] = updated[conversationId].map(m => ({
                            ...m,
                            isDelivered: true,
                            deliveredAt: m.senderId !== currentUser.id ? deliveredAt : m.deliveredAt
                        }));
                    }
                });
                return updated;
            });
        } else {
            // Single delivery receipt - маркирай конкретното съобщение като delivered
            const { conversationId, messageId, deliveredAt } = data;
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(m =>
                    m.id === messageId ? { ...m, isDelivered: true, deliveredAt } : m
                )
            }));
        }
    }, [currentUser]);



    const handleOnlineStatus = useCallback((status) => {

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
            if (chat.conversation.otherUser.id === userId) {
                return {
                    ...chat,
                    conversation: {
                        ...chat.conversation,
                        otherUser: {
                            ...chat.conversation.otherUser,
                            isOnline
                        }
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

            // Mark all undelivered messages as delivered when user loads messenger
            try {
                await svMessengerAPI.markAllUndeliveredAsDelivered();
            } catch (error) {
                console.warn('Failed to mark messages as delivered:', error);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    const loadMessages = useCallback(async (conversationId, page = 0) => {
        setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));

        try {
            const data = await svMessengerAPI.getMessages(conversationId, page);
            
            // Handle pagination response - data might be an object with content array
            let messages = Array.isArray(data) ? data : (data.content || data.messages || []);

            // Ensure chronological ASC order (oldest -> newest) so newest appear at bottom
            messages = [...messages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: page === 0
                    ? messages
                    // Older pages should prepend (older first) before existing newer ones
                    : [...messages, ...(prev[conversationId] || [])]
            }));

        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
        }
    }, []);

    const sendMessage = useCallback(async (conversationId, text) => {
        if (!text.trim() || !isWebSocketConnected) {
            console.warn('Cannot send message: empty text or not connected');
            return;
        }

        try {
            const message = await svMessengerAPI.sendMessage(conversationId, text.trim());

            // Add message optimistically (at the end for newest messages to appear at bottom)
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: [...(prev[conversationId] || []), message]
            }));

            // Update conversation list
            loadConversations();

        } catch (error) {
            console.error('Failed to send message:', error);
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

            return conversation;
        } catch (error) {
            console.error('Failed to start conversation:', error);
            alert('Грешка при стартиране на разговор.');
        }
    }, []);

    const markAsRead = useCallback(async (conversationId) => {
        try {
            await svMessengerAPI.markAsRead(conversationId);

            // Update local state and recalculate total unread
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
                // Recalculate total unread count
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });

            // Update messages - САМО тези които НЕ СА от currentUser!
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(m => ({
                    ...m,
                    // Маркирай като read САМО ако не е от текущия user
                    isRead: m.senderId !== currentUser.id ? true : m.isRead,
                    readAt: m.senderId !== currentUser.id && !m.isRead ? new Date().toISOString() : m.readAt
                }))
            }));

        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, [conversations, currentUser]);

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

    // Calculate initial position for new window
    const calculateInitialPosition = useCallback(() => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const chatWidth = 400;
        const chatHeight = 600;

        // Center with slight cascade effect
        const openChatsCount = activeChats.filter(c => !c.isMinimized).length;
        const offset = openChatsCount * 30; // Cascade offset

        return {
            x: Math.max(50, (windowWidth - chatWidth) / 2 + offset),
            y: Math.max(50, (windowHeight - chatHeight) / 2 + offset)
        };
    }, [activeChats]);

    const openChat = useCallback((conversationId) => {
        // Find conversation
        let conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) {
            conversation = activeChats.find(c => c.conversation.id === conversationId)?.conversation;
        }

        if (!conversation) {
            console.warn('Conversation not found:', conversationId);
            // Try to fetch conversation from API if not found locally
            svMessengerAPI.getConversation(conversationId).then(conv => {
                if (conv) {
                    // Add to conversations list
                    setConversations(prev => {
                        const exists = prev.some(c => c.id === conv.id);
                        return exists ? prev : [conv, ...prev];
                    });
                    // Try to open again after state update
                    setTimeout(() => openChat(conversationId), 100);
                }
            }).catch(error => {
                console.error('Failed to fetch conversation:', error);
            });
            return;
        }

        // Check if already exists (minimized or open)
        const existingChat = activeChats.find(c => c.conversation.id === conversationId);
        if (existingChat) {
            if (existingChat.isMinimized) {
                // Restore from taskbar
                restoreChat(conversationId);
            } else {
                // Already open, bring to front
                bringToFront(conversationId);
            }
            return;
        }

        // Create new chat window - use conversation from conversations state for live updates
        const liveConversation = conversations.find(c => c.id === conversationId);
        const newChat = {
            id: conversationId,
            conversation: liveConversation || conversation, // Use live reference if available
            isMinimized: false,
            position: calculateInitialPosition(),
            zIndex: nextZIndex.current++
        };

        setActiveChats(prev => [...prev, newChat]);

        // Load messages
        loadMessages(conversationId);

        // Ако има непрочетени съобщения при отваряне - маркирай като прочетено
        // (това се случва само ако прозорецът е бил затворен при получаване)
        const messages = messagesByConversation[conversationId] || [];
        const hasUnreadMessages = messages.some(m => m.senderId !== currentUser.id && !m.isRead);

        if (hasUnreadMessages) {
            svWebSocketService.sendRead(conversationId);

            // Immediately mark as read locally
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(m =>
                    m.senderId !== currentUser.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
                )
            }));

            // Update conversation unread count
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
                // Recalculate total unread count
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });
        }

        // Close chat list
        closeChatList();

    }, [conversations, messagesByConversation, currentUser, loadMessages, markAsRead, closeChatList, calculateInitialPosition]);

    const closeChat = useCallback((conversationId) => {
        setActiveChats(prev => prev.filter(c => c.conversation.id !== conversationId));
    }, []);

    const minimizeChat = useCallback((conversationId) => {
        setActiveChats(prev => prev.map(c =>
            c.conversation.id === conversationId
                ? { ...c, isMinimized: true }
                : c
        ));
    }, []);

    const restoreChat = useCallback((conversationId) => {
        setActiveChats(prev => prev.map(c =>
            c.conversation.id === conversationId
                ? { ...c, isMinimized: false, zIndex: nextZIndex.current++ }
                : c
        ));

        // Ако има непрочетени съобщения при restore - маркирай като прочетено
        // (това се случва само ако прозорецът е бил minimized при получаване)
        const messages = messagesByConversation[conversationId] || [];
        const hasUnreadMessages = messages.some(m => m.senderId !== currentUser.id && !m.isRead);

        if (hasUnreadMessages) {
            svWebSocketService.sendRead(conversationId);

            // Immediately mark as read locally
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(m =>
                    m.senderId !== currentUser.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
                )
            }));

            // Update conversation unread count
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
                // Recalculate total unread count
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });

            // SVTaskbar will read live conversation data from conversations state
        }

    }, [conversations, messagesByConversation, currentUser]);

    const bringToFront = useCallback((conversationId) => {
        setActiveChats(prev => prev.map(c =>
            c.conversation.id === conversationId
                ? { ...c, zIndex: nextZIndex.current++ }
                : c
        ));
    }, []);

    const updateChatPosition = useCallback((conversationId, position) => {
        setActiveChats(prev => prev.map(c =>
            c.conversation.id === conversationId
                ? { ...c, position }
                : c
        ));
    }, []);

    const removeFromConversationList = useCallback(async (conversationId) => {
        try {
            // Call backend API to hide conversation (not delete)
            const response = await svMessengerAPI.hideConversation(conversationId);
            
            if (response.success) {
                // Remove from conversations list (UI update)
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                
                // Also close any open chat window for this conversation
                setActiveChats(prev => prev.filter(c => c.conversation.id !== conversationId));
                
            }
        } catch (error) {
            console.error('Failed to hide conversation:', error);
            alert('Грешка при скриване на разговора. Моля опитайте отново.');
        }
    }, []);

    // ========== HELPER METHODS ==========

    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
            });
        }
    };

    const playNotificationSound = () => {
        if (messageSound.current) {
            messageSound.current.currentTime = 0;
            messageSound.current.play().catch(() => {});
        }
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

    // ========== GLOBAL API EXPOSURE ==========

    // Изнасяме глобална функция за комуникация с vanilla JavaScript
    useEffect(() => {
        
        const exposeGlobalAPI = () => {
            try {
                // Wrapper за startConversation с автоматично отваряне
                const startConversationWithAutoOpen = async (otherUserId) => {
                    const conversation = await startConversation(otherUserId);
                    if (conversation) {
                        // Автоматично отваряне на чат прозореца
                        setTimeout(() => {
                            openChat(conversation.id);
                        }, 100);
                    }
                    return conversation;
                };

                // Wrapper за React context startConversation с автоматично отваряне
                const startConversationReactWithAutoOpen = async (otherUserId) => {
                    const conversation = await startConversation(otherUserId);
                    if (conversation) {
                        // Автоматично отваряне на чат прозореца
                        setTimeout(() => {
                            // Намираме conversation от state-а
                            setConversations(prev => {
                                const foundConversation = prev.find(c => c.id === conversation.id) || conversation;
                                if (foundConversation) {
                                    // Създаваме нов chat window
                                    const newChat = {
                                        id: conversation.id,
                                        conversation: foundConversation,
                                        isMinimized: false,
                                        position: calculateInitialPosition(),
                                        zIndex: nextZIndex.current++
                                    };

                                    setActiveChats(prev => [...prev, newChat]);
                                    
                                    // Load messages
                                    loadMessages(conversation.id);
                                    
                                    // Mark as read
                                    markAsRead(conversation.id);
                                    
                                    // Close chat list
                                    closeChatList();
                                    
                                }
                                return prev;
                            });
                        }, 100);
                    }
                    return conversation;
                };

                window.SVMessenger = {
                    startConversation: startConversationWithAutoOpen,
                    startConversationReact: startConversationReactWithAutoOpen, // За React компонентите
                    openChat: openChat,
                    openChatList: openChatList,
                    openSearch: openSearch,
                    sendMessage: sendMessage,
                    isConnected: isWebSocketConnected
                };
                
            } catch (error) {
                console.error('SVMessenger: Error exposing global API:', error);
            }
        };

        exposeGlobalAPI();
        
        return () => {
            if (window.SVMessenger) {
                delete window.SVMessenger;
            }
        };
    }, [isWebSocketConnected]);

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
        minimizeChat,
        restoreChat,
        bringToFront,
        updateChatPosition,
        removeFromConversationList
    };

    return (
        <SVMessengerContext.Provider value={value}>
            {children}
        </SVMessengerContext.Provider>
    );
};