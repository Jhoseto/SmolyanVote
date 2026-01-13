/**
 * Messages Context - Handles messaging logic, conversations, and WebSocket communication
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { svMessengerAPI } from '../services/svMessengerAPI';
import svWebSocketService from '../services/svWebSocketService';

const MessagesContext = createContext(null);

export const useMessages = () => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within MessagesProvider');
    }
    return context;
};

export const MessagesProvider = ({ children, currentUser }) => {

    // ========== STATE ==========

    // Conversations
    const [conversations, setConversations] = useState([]);

    // Messages by conversation ID
    const [messagesByConversation, setMessagesByConversation] = useState({});

    // Call history by conversation ID
    const [callHistoryByConversation, setCallHistoryByConversation] = useState({});

    // Loading states
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState({});
    const [loadingCallHistory, setLoadingCallHistory] = useState({});

    // Typing indicators
    const [typingUsers, setTypingUsers] = useState({});

    // Unread count
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    // WebSocket connection status
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

    // Refs
    const typingTimeouts = useRef({});
    const messageSound = useRef(null);
    const conversationsRef = useRef(conversations);
    const messagesByConversationRef = useRef(messagesByConversation);
    const processedMessageIds = useRef(new Set()); // ✅ Защита срещу дублиране - track обработени съобщения

    // Preload message sound
    useEffect(() => {
        if (!messageSound.current) {
            const audio = new window.Audio('/svmessenger/sounds/s1.mp3');
            audio.preload = 'auto';
            messageSound.current = audio;
        }
    }, []);

    // Sync refs with state
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        messagesByConversationRef.current = messagesByConversation;
    }, [messagesByConversation]);

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

    const handleNewMessage = useCallback((message, activeChats = []) => {
        // Валидация на съобщението
        if (!message || !message.id || !message.text || !message.conversationId || !message.sentAt) {
            console.warn('handleNewMessage: Invalid message received', message);
            return;
        }

        // ✅ КРИТИЧНО: Проверка дали това съобщение вече е обработено в този render cycle
        // Това предотвратява дублиране ако handleNewMessage се извика два пъти за едно и също съобщение
        const messageKey = `${message.id}-${message.conversationId}`;
        if (processedMessageIds.current.has(messageKey)) {
            return;
        }
        
        // Маркирай като обработено (ще се изчисти след малко)
        processedMessageIds.current.add(messageKey);
        setTimeout(() => {
            processedMessageIds.current.delete(messageKey);
        }, 5000); // Изчисти след 5 секунди (увеличено за предотвратяване на дублиране от мобилно приложение)

        // Add message to conversation (с проверка за дубликати и обновяване)
        setMessagesByConversation(prev => {
            const existingMessages = prev[message.conversationId] || [];
            // Филтрирай невалидни съобщения
            const validExisting = existingMessages.filter(m => m && m.id && m.text && m.sentAt);
            
            // ✅ Проверка за дубликати - ако съобщението вече съществува, обнови го вместо да го добавиш отново
            const existingIndex = validExisting.findIndex(m => m.id === message.id);
            if (existingIndex !== -1) {
                // Съобщението вече съществува - обнови го (може да има нови данни като isDelivered, isRead)
                // НЕ добавяме дубликат!
                const updated = [...validExisting];
                updated[existingIndex] = { ...updated[existingIndex], ...message };
                return {
                    ...prev,
                    [message.conversationId]: updated
                };
            }
            
            // Ново съобщение - добави го
            return {
                ...prev,
                [message.conversationId]: [
                    ...validExisting,
                    message
                ]
            };
        });

        // Update conversation list
        setConversations(prev => prev.map(c =>
            c.id === message.conversationId
                ? {
                    ...c,
                    lastMessage: message.text,
                    lastMessageTime: message.sentAt
                }
                : c
        ));

        // Check chat states (passed from UIContext)
        const chat = activeChats.find(c => c.conversation.id === message.conversationId);
        const chatIsVisible = chat && !chat.isMinimized;
        const chatIsMinimized = chat && chat.isMinimized;

        if (chatIsVisible) {
            // Chat is visible - don't auto-mark as read
        } else if (chatIsMinimized) {
            // Chat is minimized - increase badge
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === message.conversationId
                        ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                        : c
                );
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });
        } else {
            // Chat is fully closed - show notifications
            const conversationExists = conversations.some(c => c.id === message.conversationId);

            if (conversationExists) {
                // Update existing conversation
                setConversations(prev => {
                    const updated = prev.map(c =>
                        c.id === message.conversationId
                            ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                            : c
                    );
                    const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                    setTotalUnreadCount(totalUnread);
                    return updated;
                });
            } else {
                // Fetch and add conversation to list
                svMessengerAPI.getConversation(message.conversationId).then(conv => {
                    if (conv) {
                        setConversations(prev => {
                            const updated = prev.some(c => c.id === conv.id)
                                ? prev.map(c => c.id === conv.id
                                    ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                                    : c
                                )
                                : [{ ...conv, unreadCount: (conv.unreadCount || 0) + 1 }, ...prev];
                            const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                            setTotalUnreadCount(totalUnread);
                            return updated;
                        });
                    }
                }).catch(error => {
                    console.error('Failed to fetch conversation:', error);
                });
            }

            // Play notification sound
            playNotificationSound();

            // Show browser notification
            showBrowserNotification(message);
        }
    }, [conversations]);

    const handleTypingStatus = useCallback((status) => {
        const { conversationId, userId, isTyping } = status;

        if (isTyping) {
            // Add user to typing list
            setTypingUsers(prev => ({
                ...prev,
                [conversationId]: userId
            }));

            // Clear existing timeout
            if (typingTimeouts.current[conversationId]) {
                clearTimeout(typingTimeouts.current[conversationId]);
            }

            // Auto-remove after 3 seconds
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
            // Mark all our sent messages as read
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || [])
                    .filter(m => m && m.id && m.text && m.sentAt)
                    .map(m =>
                        m.senderId === currentUser.id ? { ...m, isRead: true, readAt: m.readAt || readAt } : m
                    )
            }));

            // Reset unread count
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });
        } else if (messageId) {
            // Mark specific message as read
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || [])
                    .filter(m => m && m.id && m.text && m.sentAt)
                    .map(m =>
                        m.id === messageId && m.senderId === currentUser.id ? { ...m, isRead: true, readAt } : m
                    )
            }));

            // Decrease unread count
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId
                        ? { ...c, unreadCount: Math.max(0, (c.unreadCount || 0) - 1) }
                        : c
                );
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });
        }
    }, [currentUser]);

    const handleDeliveryReceipt = useCallback((data) => {
        if (data.type === 'BULK_DELIVERY') {
            // Bulk delivery receipt
            const { conversationIds, deliveredAt } = data;
            setMessagesByConversation(prev => {
                const updated = { ...prev };
                conversationIds.forEach(conversationId => {
                    if (updated[conversationId]) {
                        updated[conversationId] = updated[conversationId]
                            .filter(m => m && m.id && m.text && m.sentAt)
                            .map(m => ({
                                ...m,
                                isDelivered: true,
                                deliveredAt: m.senderId !== currentUser.id ? deliveredAt : m.deliveredAt
                            }));
                    }
                });
                return updated;
            });
        } else {
            // Single delivery receipt
            const { conversationId, messageId, deliveredAt } = data;
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || [])
                    .filter(m => m && m.id && m.text && m.sentAt)
                    .map(m =>
                        m.id === messageId ? { ...m, isDelivered: true, deliveredAt } : m
                    )
            }));
        }
    }, [currentUser]);

    const handleOnlineStatus = useCallback((status) => {
        const { userId, isOnline } = status;

        // Update user online status in conversations
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
    }, []);

    // ========== API METHODS ==========

    const loadConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const data = await svMessengerAPI.getConversations();
            setConversations(data);

            // Recalculate total unread count
            const totalUnread = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setTotalUnreadCount(totalUnread);

            // Mark all undelivered messages as delivered
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

    const loadMessages = useCallback(async (conversationId, page = 0, size = 50) => {
        setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));

        try {
            const data = await svMessengerAPI.getMessages(conversationId, page, size);

            // Backend връща Page<SVMessageDTO> - Spring Data Page обект
            // Структура: { content: Array<SVMessageDTO>, totalElements: number, ... }
            const messagesArray = (data && data.content && Array.isArray(data.content)) 
                ? data.content 
                : (Array.isArray(data) ? data : []);

            // Backend сортира по DESC (най-новите първо), ние искаме ASC (старите първо)
            // Обърни масива за да получим ASC ред
            const reversedMessages = [...messagesArray].reverse();

            // Сортирай по sentAt ASC за да сме сигурни
            const sortedMessages = reversedMessages.sort((a, b) => {
                if (!a || !b) return 0;
                const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                return timeA - timeB;
            });

            setMessagesByConversation(prev => {
                const existingMessages = prev[conversationId] || [];
                
                if (page === 0) {
                    // При page=0 заменяме всички съобщения от API
                    // Запазваме само новите съобщения от WebSocket които все още не са в API отговора
                    const apiMessageIds = new Set();
                    sortedMessages.forEach(m => {
                        if (m && m.id) {
                            apiMessageIds.add(m.id);
                        }
                    });
                    
                    const wsMessages = existingMessages.filter(m => 
                        m && m.id && !apiMessageIds.has(m.id)
                    );
                    
                    // Комбинирай API съобщенията + новите от WebSocket
                    const combined = [...sortedMessages, ...wsMessages];
                    
                    // Премахни дубликати и сортирай по sentAt ASC
                    const uniqueMap = new Map();
                    combined.forEach(msg => {
                        if (msg && msg.id && msg.text && msg.sentAt) {
                            uniqueMap.set(msg.id, msg);
                        }
                    });
                    
                    const uniqueMessages = Array.from(uniqueMap.values()).sort((a, b) => {
                        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                        return timeA - timeB;
                    });
                    
                    return {
                        ...prev,
                        [conversationId]: uniqueMessages
                    };
                } else {
                    // При page > 0 добавяме по-стари съобщения отпред (pagination)
                    const existingIds = new Set();
                    existingMessages.forEach(m => {
                        if (m && m.id) {
                            existingIds.add(m.id);
                        }
                    });
                    
                    const olderMessages = sortedMessages.filter(m => 
                        m && m.id && !existingIds.has(m.id)
                    );
                    
                    const combined = [...olderMessages, ...existingMessages];
                    
                    // Премахни дубликати и сортирай по sentAt ASC
                    const uniqueMap = new Map();
                    combined.forEach(msg => {
                        if (msg && msg.id && msg.text && msg.sentAt) {
                            uniqueMap.set(msg.id, msg);
                        }
                    });
                    
                    const uniqueMessages = Array.from(uniqueMap.values()).sort((a, b) => {
                        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                        return timeA - timeB;
                    });
                    
                    return {
                        ...prev,
                        [conversationId]: uniqueMessages
                    };
                }
            });
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
            // Изпрати съобщението през HTTP API
            // Backend ще изпрати съобщението до sender-а и recipient-а през WebSocket
            // НЕ добавяме съобщението тук - ще го получим от WebSocket
            await svMessengerAPI.sendMessage(conversationId, text.trim());

            // ✅ НЕ refresh-ваме conversations тук - WebSocket ще обнови conversation list-а автоматично
            // Това предотвратява дублиране на съобщенията и излишни API calls
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Грешка при изпращане на съобщение. Моля опитайте отново.');
        }
    }, [isWebSocketConnected]);

    const startConversation = useCallback(async (otherUserId) => {
        try {
            const conversation = await svMessengerAPI.startConversation(otherUserId);

            if (!conversation || !conversation.id) {
                console.error('Invalid conversation from API', conversation);
                throw new Error('Invalid conversation returned from API');
            }

            // Add to conversations list if not exists
            setConversations(prev => {
                const exists = prev.some(c => c.id === conversation.id);
                return exists ? prev : [conversation, ...prev];
            });

            return conversation;
        } catch (error) {
            console.error('Failed to start conversation:', error);
            alert('Грешка при стартиране на разговор.');
            throw error;
        }
    }, []);

    const markAsRead = useCallback(async (conversationId) => {
        try {
            await svMessengerAPI.markAsRead(conversationId);

            // Update local state
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
                const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setTotalUnreadCount(totalUnread);
                return updated;
            });

            // Update messages - only mark non-current-user messages as read
            setMessagesByConversation(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || [])
                    .filter(m => m && m.id && m.text && m.sentAt)
                    .map(m => ({
                        ...m,
                        isRead: m.senderId !== currentUser.id ? true : m.isRead,
                        readAt: m.senderId !== currentUser.id && !m.isRead ? new Date().toISOString() : m.readAt
                    }))
            }));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, [currentUser]);

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

    const removeFromConversationList = useCallback(async (conversationId) => {
        try {
            const response = await svMessengerAPI.hideConversation(conversationId);

            if (response.success) {
                // Remove from conversations list
                setConversations(prev => prev.filter(c => c.id !== conversationId));
            }
        } catch (error) {
            console.error('Failed to hide conversation:', error);
            alert('Грешка при скриване на разговора. Моля опитайте отново.');
        }
    }, []);

    // ========== CALL HISTORY ==========

    /**
     * Зареди call history за конкретен разговор
     */
    const loadCallHistory = useCallback(async (conversationId) => {
        // CRITICAL FIX Bug 1: Use == null to check for null/undefined, not !conversationId
        // This ensures conversationId 0 (a valid ID) is not treated as falsy
        // CRITICAL FIX Bug 2: Skip state update entirely when conversationId is invalid
        // This prevents creating state entries with "null" or "undefined" as string keys
        if (conversationId == null) {
            return;
        }

        setLoadingCallHistory(prev => ({ ...prev, [conversationId]: true }));

        try {
            console.log(`📞 [MessagesContext] Loading call history for conversation ${conversationId}`);
            const callHistory = await svMessengerAPI.getCallHistory(conversationId);
            console.log(`✅ [MessagesContext] Loaded ${Array.isArray(callHistory) ? callHistory.length : 0} call history entries for conversation ${conversationId}`);
            
            // CRITICAL: Log first few entries for debugging
            if (Array.isArray(callHistory) && callHistory.length > 0) {
                console.log(`📞 [MessagesContext] First entry: id=${callHistory[0]?.id}, startTime=${callHistory[0]?.startTime}, status=${callHistory[0]?.status}`);
            }
            
            setCallHistoryByConversation(prev => ({
                ...prev,
                [conversationId]: Array.isArray(callHistory) ? callHistory : []
            }));
        } catch (error) {
            console.error('❌ [MessagesContext] Failed to load call history:', error);
            console.error('❌ [MessagesContext] Error details:', error.response?.data || error.message);
            setCallHistoryByConversation(prev => ({ ...prev, [conversationId]: [] }));
        } finally {
            setLoadingCallHistory(prev => ({ ...prev, [conversationId]: false }));
        }
    }, []);

    // ========== HELPER METHODS ==========

    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {});
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

    // ========== INITIALIZE ==========

    useEffect(() => {
        // Load initial data
        loadConversations();
        loadUnreadCount();

        // Request notification permission
        requestNotificationPermission();
    }, []);

    // ========== CONTEXT VALUE ==========

    const value = {
        // State
        currentUser,
        conversations,
        messagesByConversation,
        callHistoryByConversation,
        isLoadingConversations,
        loadingMessages,
        loadingCallHistory,
        typingUsers,
        totalUnreadCount,
        isWebSocketConnected,

        // Methods
        loadConversations,
        loadMessages,
        loadCallHistory,
        sendMessage,
        startConversation,
        markAsRead,
        sendTypingStatus,
        removeFromConversationList,

        // WebSocket handlers (exposed for WebSocketManager)
        handleWebSocketConnect,
        handleWebSocketDisconnect,
        handleWebSocketError,
        handleNewMessage,
        handleTypingStatus,
        handleReadReceipt,
        handleDeliveryReceipt,
        handleOnlineStatus,

        // Refs (exposed for other contexts)
        conversationsRef,
        messagesByConversationRef
    };

    return (
        <MessagesContext.Provider value={value}>
            {children}
        </MessagesContext.Provider>
    );
};
