/**
 * UI Context - Handles UI state management for chat windows, modals, and search
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useMessages } from './MessagesContext';
import svWebSocketService from '../services/svWebSocketService';
import { svMessengerAPI } from '../services/svMessengerAPI';

const UIContext = createContext(null);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
};

export const UIProvider = ({ children, currentUser }) => {

    const {
        conversations,
        conversationsRef,
        messagesByConversation,
        messagesByConversationRef,
        loadMessages,
        startConversation
    } = useMessages();

    // ========== STATE ==========

    // Active chat windows
    const [activeChats, setActiveChats] = useState([]); // { id, conversation, isMinimized, position, zIndex }

    // UI State
    const [isChatListOpen, setIsChatListOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Refs
    const nextZIndex = useRef(1000);
    const activeChatsRef = useRef(activeChats);

    // Sync refs with state
    useEffect(() => {
        activeChatsRef.current = activeChats;
    }, [activeChats]);

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

    const calculateInitialPosition = useCallback(() => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const chatWidth = 400;
        const chatHeight = 600;

        const openChatsCount = activeChats.filter(c => !c.isMinimized).length;
        const offset = openChatsCount * 30;

        return {
            x: Math.max(50, (windowWidth - chatWidth) / 2 + offset),
            y: Math.max(50, (windowHeight - chatHeight) / 2 + offset)
        };
    }, [activeChats]);

    const openChat = useCallback((conversationId, conversationObj = null) => {
        // Find conversation
        let conversation = conversationObj || conversationsRef.current.find(c => c.id === conversationId);
        if (!conversation) {
            conversation = activeChatsRef.current.find(c => c.conversation.id === conversationId)?.conversation;
        }

        if (!conversation) {
            // Try to fetch from API
            svMessengerAPI.getConversation(conversationId).then(conv => {
                if (conv) {
                    setTimeout(() => openChat(conversationId), 100);
                }
            }).catch(error => {
                console.error('Failed to fetch conversation:', error);
            });
            return;
        }

        // Check if already exists
        const existingChat = activeChatsRef.current.find(c => c.conversation.id === conversationId);
        if (existingChat) {
            if (existingChat.isMinimized) {
                restoreChat(conversationId);
            } else {
                bringToFront(conversationId);
            }
            return;
        }

        // Create new chat window
        const liveConversation = conversationsRef.current.find(c => c.id === conversationId);
        const newChat = {
            id: conversationId,
            conversation: liveConversation || conversation,
            isMinimized: false,
            position: calculateInitialPosition(),
            zIndex: nextZIndex.current++
        };

        setActiveChats(prev => [...prev, newChat]);

        // Load messages
        const shouldLoadMore = conversation.unreadCount > 0;
        loadMessages(conversationId, 0, shouldLoadMore ? 200 : 50);

        // Mark as read if has unread messages
        const messages = messagesByConversationRef.current[conversationId] || [];
        const hasUnreadMessages = messages.some(m => m.senderId !== currentUser.id && !m.isRead);

        if (hasUnreadMessages) {
            svWebSocketService.sendRead(conversationId);
        }

        // Close chat list
        closeChatList();
    }, [currentUser, conversationsRef, activeChatsRef, messagesByConversationRef, loadMessages, calculateInitialPosition, closeChatList]);

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

        // Mark as read on restore
        const messages = messagesByConversation[conversationId] || [];
        const hasUnreadMessages = messages.some(m => m.senderId !== currentUser.id && !m.isRead);

        if (hasUnreadMessages) {
            svWebSocketService.sendRead(conversationId);
        }
    }, [messagesByConversation, currentUser]);

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

    // ========== GLOBAL API EXPOSURE ==========

    useEffect(() => {
        const exposeGlobalAPI = () => {
            try {
                const startConversationWithAutoOpen = async (otherUserId) => {
                    const conversation = await startConversation(otherUserId);
                    setTimeout(() => {
                        openChat(conversation.id);
                    }, 150);
                    return conversation;
                };

                const startConversationReactWithAutoOpen = async (otherUserId) => {
                    try {
                        const conversation = await startConversation(otherUserId);

                        if (!conversation || !conversation.id) {
                            console.error('Invalid conversation returned', conversation);
                            return;
                        }

                        setTimeout(() => {
                            try {
                                openChat(conversation.id);
                            } catch (error) {
                                console.error('Error in openChat', error);
                            }
                        }, 150);
                        return conversation;
                    } catch (error) {
                        console.error('Error', error);
                        throw error;
                    }
                };

                window.SVMessenger = {
                    startConversation: startConversationWithAutoOpen,
                    startConversationReact: startConversationReactWithAutoOpen,
                    openChat: openChat,
                    openChatList: openChatList,
                    openSearch: openSearch
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
    }, [openChat, openChatList, openSearch, startConversation]);

    // ========== CONTEXT VALUE ==========

    const value = {
        // State
        activeChats,
        isChatListOpen,
        isSearchOpen,

        // Methods
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

        // Refs
        activeChatsRef
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};
