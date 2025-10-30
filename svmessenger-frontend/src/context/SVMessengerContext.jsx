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

        // Add message to conversation (at the end for newest messages to appear at bottom)
        setMessagesByConversation(prev => ({
            ...prev,
            [message.conversationId]: [
                ...(prev[message.conversationId] || []),
                message
            ]
        }));

        // Update conversation list
        loadConversations();

        // Check ако chat window е отворен
        const chatIsOpen = activeChats.some(c => c.conversation.id === message.conversationId);

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

    const handleReadReceipt = useCallback(({ conversationId, messageId, readAt }) => {
        console.log('SVMessenger: Read receipt', { conversationId, messageId });

        // Update само конкретното съобщение, не всички
        setMessagesByConversation(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map(m =>
                m.id === messageId ? { ...m, isRead: true, readAt } : m
            )
        }));

        // Update conversation unread count
        setConversations(prev => prev.map(c =>
            c.id === conversationId
                ? { ...c, unreadCount: Math.max(0, (c.unreadCount || 0) - 1) }
                : c
        ));
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
            console.log('SVMessenger: Loaded conversations', data.length);
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
            const messages = Array.isArray(data) ? data : (data.content || data.messages || []);

            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: page === 0
                    ? messages
                    : [...(prev[conversationId] || []), ...messages]
            }));

            console.log('SVMessenger: Loaded messages for conversation', conversationId);
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

            console.log('SVMessenger: Message sent', message.id);
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

            // Update total unread count locally
            setTotalUnreadCount(prev => Math.max(0, prev - (conversations.find(c => c.id === conversationId)?.unreadCount || 0)));

            console.log('SVMessenger: Marked conversation as read', conversationId);
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

        // Create new chat window
        const newChat = {
            id: conversationId,
            conversation,
            isMinimized: false,
            position: calculateInitialPosition(),
            zIndex: nextZIndex.current++
        };

        setActiveChats(prev => [...prev, newChat]);

        // Load messages
        loadMessages(conversationId);

        // Mark as read
        markAsRead(conversationId);

        // Close chat list
        closeChatList();

        console.log('SVMessenger: Opened chat', conversationId);
    }, [conversations, loadMessages, markAsRead, closeChatList, calculateInitialPosition]);

    const closeChat = useCallback((conversationId) => {
        setActiveChats(prev => prev.filter(c => c.conversation.id !== conversationId));
        console.log('SVMessenger: Closed chat', conversationId);
    }, []);

    const minimizeChat = useCallback((conversationId) => {
        setActiveChats(prev => prev.map(c =>
            c.conversation.id === conversationId
                ? { ...c, isMinimized: true }
                : c
        ));
        console.log('SVMessenger: Minimized chat', conversationId);
    }, []);

    const restoreChat = useCallback((conversationId) => {
        setActiveChats(prev => prev.map(c =>
            c.conversation.id === conversationId
                ? { ...c, isMinimized: false, zIndex: nextZIndex.current++ }
                : c
        ));
        
        // Mark as read when restoring chat
        markAsRead(conversationId);
        
        console.log('SVMessenger: Restored chat', conversationId);
    }, [markAsRead]);

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
                
                console.log('SVMessenger: Hidden conversation from list', conversationId);
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
                console.log('Notification permission:', permission);
            });
        }
    };

    const playNotificationSound = () => {
        // TODO: Add notification sound file
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
        console.log('SVMessenger: useEffect triggered, exposing global API');
        
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
                                    
                                    console.log('SVMessenger: Auto-opened chat window', conversation.id);
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
                
                console.log('SVMessenger: Global API exposed successfully', window.SVMessenger);
                console.log('SVMessenger: startConversation function:', typeof window.SVMessenger.startConversation);
            } catch (error) {
                console.error('SVMessenger: Error exposing global API:', error);
            }
        };

        exposeGlobalAPI();
        
        return () => {
            if (window.SVMessenger) {
                console.log('SVMessenger: Cleaning up global API');
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