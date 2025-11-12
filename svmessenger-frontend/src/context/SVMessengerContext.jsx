/**
 * Global State Management за SVMessenger
 * Използва React Context API
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { svMessengerAPI } from '../services/svMessengerAPI';
import svWebSocketService from '../services/svWebSocketService';
import svLiveKitService from '../services/svLiveKitService';

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

    // Call state
    const [currentCall, setCurrentCall] = useState(null);
    const [callState, setCallState] = useState('idle'); // 'idle', 'outgoing', 'incoming', 'connected'

    // Store call state and debug functions for testing
    useEffect(() => {
        window.svmessenger_call_state = callState;
        window.svmessenger_active_call = currentCall !== null;
        window.svmessenger_runFullTest = svLiveKitService.runFullTest.bind(svLiveKitService);
        window.svmessenger_runCallFlowTest = svLiveKitService.runCallFlowTest.bind(svLiveKitService);
    }, [callState, currentCall]);
    const [liveKitToken, setLiveKitToken] = useState(null);
    const [liveKitRoom, setLiveKitRoom] = useState(null);

    // Audio device setup state
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [deviceSelectorMode, setDeviceSelectorMode] = useState('call'); // 'call' or 'settings'
    const [pendingCallAction, setPendingCallAction] = useState(null); // { type: 'start'|'accept', data: {...} }

    // Refs
    const typingTimeouts = useRef({});
    const messageSound = useRef(null);
    const nextZIndex = useRef(1000);

    // ✅ ДОБАВИ ТЕЗИ НОВИ REFS:
    const conversationsRef = useRef(conversations);
    const activeChatsRef = useRef(activeChats);
    const messagesByConversationRef = useRef(messagesByConversation);

    useEffect(() => {
        if (!messageSound.current) {
            // Use built asset path under /svmessenger
            const audio = new window.Audio('/svmessenger/sounds/s1.mp3');
            audio.preload = 'auto';
            messageSound.current = audio;
        }
    }, []);

    // Синхронизирай refs със state
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        activeChatsRef.current = activeChats;
    }, [activeChats]);

    useEffect(() => {
        messagesByConversationRef.current = messagesByConversation;
    }, [messagesByConversation]);

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
            onOnlineStatus: handleOnlineStatus,
            onCallSignal: handleCallSignal
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

    // ========== CALL METHODS ==========

    const startCall = useCallback(async (conversationId, otherUserId, conversationObj = null) => {
        try {
            let conversation = conversationObj;

            if (!conversation) {
                const activeChat = activeChatsRef.current.find(c => c.conversation.id === conversationId);
                if (activeChat) {
                    conversation = activeChat.conversation;
                }
            }

            if (!conversation) {
                conversation = conversationsRef.current.find(conv => conv.id === conversationId);
            }

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Check if we have saved audio settings
            const savedSettings = localStorage.getItem('svmessenger-audio-settings');
            const hasSavedSettings = savedSettings && (() => {
                try {
                    const parsed = JSON.parse(savedSettings);
                    return parsed.microphone && parsed.speaker;
                } catch {
                    return false;
                }
            })();

            if (hasSavedSettings) {
                console.log('✅ Using saved audio settings, proceeding with call...');
                // Apply saved settings to LiveKit service
                const settings = JSON.parse(savedSettings);
                if (settings.microphone) {
                    await svLiveKitService.setMicrophone(settings.microphone);
                }
                if (settings.speaker) {
                    await svLiveKitService.setSpeaker(settings.speaker);
                }
                console.log('🎯 About to call proceedWithCallStart...');
                await proceedWithCallStart(conversationId, otherUserId, conversation);
            } else {
                console.log('🎤 No saved settings, showing device selector...');
                // Show device selector and store pending action
                setPendingCallAction({
                    type: 'start',
                    data: { conversationId, otherUserId, conversation }
                });
                setShowDeviceSelector(true);
            }

        } catch (error) {
            console.error('Failed to start call:', error);
            setCallState('idle');
        }
    }, [currentUser]);

    // Helper function to proceed with call after permissions are granted
    const proceedWithCallStart = useCallback(async (conversationId, otherUserId, conversation) => {
        console.log('🚀 proceedWithCallStart called:', { conversationId, otherUserId });
        try {
            console.log('📡 Getting call token...');
            const tokenResponse = await svMessengerAPI.getCallToken(conversationId, otherUserId);
            console.log('✅ Token received:', tokenResponse);

            setLiveKitToken(tokenResponse.token);
            // Expose token on window as a fallback for race conditions between setting React state and incoming WS signals
            try { window.__sv_livekit_token = tokenResponse.token; } catch (e) { /* ignore */ }

            console.log('🔗 Connecting to LiveKit...');
            // Connect to LiveKit room BEFORE sending CALL_REQUEST
            await connectToLiveKit(tokenResponse);
            console.log('✅ LiveKit connected');

            console.log('📞 Setting current call state...');
            setCurrentCall({
                conversationId,
                otherUserId,
                roomName: tokenResponse.roomName,
                conversation: conversation
            });
            setCallState('outgoing');
            console.log('✅ Call state set to outgoing');

            console.log('📤 Sending CALL_REQUEST signal...');
            const signal = {
                eventType: 'CALL_REQUEST',
                conversationId,
                callerId: currentUser.id,
                receiverId: otherUserId,
                roomName: tokenResponse.roomName,
                timestamp: new Date().toISOString(),
                callerName: currentUser.realName || currentUser.username,
                callerAvatar: currentUser.imageUrl
            };
            svWebSocketService.sendCallSignal(signal);
            console.log('✅ CALL_REQUEST sent');

        } catch (error) {
            console.error('❌ Failed to proceed with call start:', error);
            console.error('❌ Error details:', error.stack);
            setCallState('idle');
        }
    }, [currentUser, connectToLiveKit]);

    const acceptCall = useCallback(async () => {
        try {
            // Check if we have saved audio settings
            const savedSettings = localStorage.getItem('svmessenger-audio-settings');
            const hasSavedSettings = savedSettings && (() => {
                try {
                    const parsed = JSON.parse(savedSettings);
                    return parsed.microphone && parsed.speaker;
                } catch {
                    return false;
                }
            })();

            if (hasSavedSettings) {
                console.log('✅ Using saved audio settings for call accept...');
                // Apply saved settings to LiveKit service
                const settings = JSON.parse(savedSettings);
                if (settings.microphone) {
                    await svLiveKitService.setMicrophone(settings.microphone);
                }
                if (settings.speaker) {
                    await svLiveKitService.setSpeaker(settings.speaker);
                }
                await proceedWithCallAccept();
            } else {
                console.log('🎤 No saved settings, showing device selector for call accept...');
                // Show device selector and store pending action
                setPendingCallAction({
                    type: 'accept',
                    data: {}
                });
                setShowDeviceSelector(true);
            }

        } catch (error) {
            console.error('Failed to accept call:', error);
            endCall();
        }
    }, [currentCall, currentUser]);

    // Helper function to proceed with call accept after permissions are granted
    const proceedWithCallAccept = useCallback(async () => {
        try {
            // Generate token for accepting the call
            const tokenResponse = await svMessengerAPI.getCallToken(currentCall.conversationId, currentCall.otherUserId);

            setLiveKitToken(tokenResponse.token);
            setCallState('connected');

            // Connect to LiveKit room
            await connectToLiveKit(tokenResponse);

            // Send CALL_ACCEPT signal
            const signal = {
                eventType: 'CALL_ACCEPT',
                conversationId: currentCall.conversationId,
                callerId: currentCall.otherUserId,  // Оригиналният caller (този който е звънял)
                receiverId: currentUser.id,  // Аз съм receiver-а
                roomName: currentCall.roomName,
                timestamp: new Date().toISOString()
            };
            svWebSocketService.sendCallSignal(signal);

        } catch (error) {
            console.error('Failed to proceed with call accept:', error);
            endCall();
        }
    }, [currentCall, currentUser]);

    // Open device selector for settings
    const openAudioSettings = useCallback(() => {
        console.log('🎵 Opening audio settings modal');
        setDeviceSelectorMode('settings');
        setShowDeviceSelector(true);
    }, []);

    // Audio device selector handlers
    const handleDeviceSelectorComplete = useCallback(async (devices) => {
        console.log('🎤 Device selector completed:', devices, 'mode:', deviceSelectorMode);
        setShowDeviceSelector(false);

        if (deviceSelectorMode === 'settings') {
            // Just save settings, no call action
            setDeviceSelectorMode('call');
            console.log('✅ Audio settings saved');
        } else if (pendingCallAction) {
            // Handle call actions
            const { type, data } = pendingCallAction;
            setPendingCallAction(null);

            if (type === 'start') {
                await proceedWithCallStart(data.conversationId, data.otherUserId, data.conversation);
            } else if (type === 'accept') {
                await proceedWithCallAccept();
            }
        }
    }, [deviceSelectorMode, pendingCallAction]);

    const handleDeviceSelectorCancel = useCallback(() => {
        console.log('🎤 Device selector cancelled');
        setShowDeviceSelector(false);
        setDeviceSelectorMode('call');
        setPendingCallAction(null);

        // Only reset call state if it was a call action, not settings
        if (deviceSelectorMode !== 'settings') {
            setCallState('idle');
            setCurrentCall(null);
        }
    }, [deviceSelectorMode]);

    const rejectCall = useCallback(() => {
        // Send CALL_REJECT signal
        const signal = {
            eventType: 'CALL_REJECT',
            conversationId: currentCall.conversationId,
            callerId: currentCall.otherUserId,
            receiverId: currentUser.id,
            roomName: currentCall.roomName,
            timestamp: new Date().toISOString()
        };
        svWebSocketService.sendCallSignal(signal);

        // Reset call state
        setCurrentCall(null);
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);
    }, [currentCall, currentUser]);

    const endCall = useCallback(() => {
        console.log('📞 endCall called, currentCall:', currentCall);

        // Send CALL_END signal
        if (currentCall) {
            const signal = {
                eventType: 'CALL_END',
                conversationId: currentCall.conversationId,
                callerId: currentUser.id,
                receiverId: currentCall.otherUserId,
                roomName: currentCall.roomName,
                timestamp: new Date().toISOString()
            };
            console.log('📞 Sending CALL_END signal:', signal);
            svWebSocketService.sendCallSignal(signal);
        }

        // Disconnect from LiveKit
        svLiveKitService.disconnect();

        // Reset call state
        setCurrentCall(null);
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);
    }, [currentCall, currentUser]);

    const connectToLiveKit = useCallback(async (tokenResponse) => {
        try {
            await svLiveKitService.connect(tokenResponse.token, tokenResponse.roomName);
            setLiveKitRoom(tokenResponse.roomName);
        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            throw error;
        }
    }, []);

    const handleCallSignal = useCallback(async (signal) => {
        console.log('📞 RECEIVED call signal:', signal);
        console.log('📞 Signal details - eventType:', signal.eventType, 'callerId:', signal.callerId, 'receiverId:', signal.receiverId);

        switch (signal.eventType) {
            case 'TEST_SIGNAL':
                console.log('🧪 RECEIVED TEST SIGNAL:', signal);
                console.log('🧪 Test message:', signal.message, 'Test ID:', signal.testId);
                break;

            case 'CALL_REQUEST':
                if (signal.receiverId === currentUser.id) {
                    console.log('📞 Incoming call from user:', signal.callerId);

                    // Try to find conversation in current loaded conversations
                    let conversation = conversations.find(conv => conv.id === signal.conversationId);

                    // If not found, try to load it from backend
                    if (!conversation) {
                        console.log('📞 Conversation not found locally, trying to load from backend...');
                        try {
                            // Try to start a new conversation or get existing one
                            const newConversation = await svMessengerAPI.startConversation(signal.callerId);
                            if (newConversation) {
                                conversation = newConversation;
                                // Add to conversations list
                                setConversations(prev => {
                                    const exists = prev.find(c => c.id === newConversation.id);
                                    if (!exists) {
                                        return [newConversation, ...prev];
                                    }
                                    return prev;
                                });
                                console.log('📞 Conversation loaded/created successfully');
                            }
                        } catch (error) {
                            console.error('📞 Failed to load/create conversation:', error);
                            // Try to reload all conversations as fallback
                            try {
                                console.log('📞 Reloading all conversations as fallback...');
                                await loadConversations();
                                conversation = conversations.find(conv => conv.id === signal.conversationId);
                            } catch (reloadError) {
                                console.error('📞 Failed to reload conversations:', reloadError);
                            }
                        }
                    }

                    if (conversation) {
                        console.log('📞 Showing incoming call modal');
                        setCurrentCall({
                            conversationId: signal.conversationId,
                            otherUserId: signal.callerId,
                            roomName: signal.roomName,
                            conversation: conversation
                        });
                        setCallState('incoming');

                            // Ensure chat window/modal is opened and focused so user sees incoming call UI
                            try {
                                if (window.SVMessenger && typeof window.SVMessenger.openChat === 'function') {
                                    window.SVMessenger.openChat(conversation.id);
                                }
                            } catch (e) {
                                console.warn('Failed to auto-open chat for incoming call:', e);
                            }

                        // Optional: Show browser notification if page is not focused
                        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                            new Notification('Incoming Call', {
                                body: `${conversation.otherUser.realName || conversation.otherUser.username} is calling you`,
                                icon: conversation.otherUser.imageUrl || '/images/default-avatar.png'
                            });
                        }
                    } else {
                        console.error('📞 Could not find or create conversation for call');
                        // Could show a toast notification here
                    }
                }
                break;

            case 'CALL_ACCEPT':
                console.log('📞 Processing CALL_ACCEPT signal...');
                console.log('📞 Current callState:', callState);
                console.log('📞 Signal callerId:', signal.callerId, 'currentUser.id:', currentUser.id);
                console.log('📞 Signal receiverId:', signal.receiverId);
                console.log('📞 Current call:', currentCall);
                
                // When we (caller) receive CALL_ACCEPT, the signal.callerId should be our ID
                // and we should be in 'outgoing' state
                if (callState === 'outgoing' && signal.callerId === currentUser.id) {
                    console.log('✅ CALL_ACCEPT validated - updating to connected state');
                    setCallState('connected');

                    // Ensure the chat window is open and focused so the connected UI is visible
                    try {
                        const convId = signal.conversationId;
                        if (window.SVMessenger && typeof window.SVMessenger.openChat === 'function') {
                            window.SVMessenger.openChat(convId);
                        }
                    } catch (e) {
                        console.warn('Failed to auto-open chat on CALL_ACCEPT:', e);
                    }
                } else {
                    console.warn('⚠️ CALL_ACCEPT ignored - callState:', callState, 'callerId match:', signal.callerId === currentUser.id);
                }
                break;

            case 'CALL_REJECT':
                if (callState === 'outgoing' || callState === 'incoming') {
                    setCurrentCall(null);
                    setCallState('idle');
                    setLiveKitToken(null);
                    setLiveKitRoom(null);
                }
                break;

            case 'CALL_END':
                console.log('📞 Received CALL_END signal:', signal);
                console.log('📞 Current call state:', callState);
                console.log('📞 Current call:', currentCall);

                if (callState !== 'idle') {
                    console.log('📞 Ending call due to CALL_END signal');
                    svLiveKitService.disconnect();
                    setCurrentCall(null);
                    setCallState('idle');
                    setLiveKitToken(null);
                    setLiveKitRoom(null);
                    console.log('📞 Call ended successfully');
                } else {
                    console.log('📞 Ignoring CALL_END - call already idle');
                }
                break;

            case 'CALL_BUSY':
                // Handle busy signal
                break;

            default:
                console.warn('Unknown call signal type:', signal.eventType);
        }
    }, [callState, currentUser, liveKitToken, connectToLiveKit, conversations]);

    // ========== WEBSOCKET HANDLERS ==========

    const handleWebSocketConnect = useCallback(() => {
        setIsWebSocketConnected(true);
        window.svmessenger_ws_connected = true;
    }, []);

    const handleWebSocketDisconnect = useCallback(() => {
        setIsWebSocketConnected(false);
        window.svmessenger_ws_connected = false;
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

            // Check if conversation exists in conversations list
            const conversationExists = conversations.some(c => c.id === message.conversationId);

            if (conversationExists) {
                // Update existing conversation unread count
                setConversations(prev => {
                    const updated = prev.map(c =>
                        c.id === message.conversationId
                            ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                            : c
                    );
                    // Always recalculate total unread count from conversations
                    const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                    setTotalUnreadCount(totalUnread);
                    return updated;
                });
            } else {
                // Conversation not in list (was hidden, now un-hidden by backend)
                // Fetch it and add to conversations list
                svMessengerAPI.getConversation(message.conversationId).then(conv => {
                    if (conv) {
                        setConversations(prev => {
                            const updated = prev.some(c => c.id === conv.id)
                                ? prev.map(c => c.id === conv.id
                                    ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                                    : c
                                )
                                : [{ ...conv, unreadCount: (conv.unreadCount || 0) + 1 }, ...prev];
                            // Always recalculate total unread count from conversations
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
    }, [activeChats, conversations]);

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

            // Recalculate total unread count after loading conversations
            const totalUnread = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setTotalUnreadCount(totalUnread);

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

    const loadMessages = useCallback(async (conversationId, page = 0, size = 50) => {
        setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));

        try {
            const data = await svMessengerAPI.getMessages(conversationId, page, size);
            
            // Handle pagination response - data might be an object with content array
            let messages = Array.isArray(data) ? data : (data.content || data.messages || []);

            // Ensure chronological ASC order (oldest -> newest) so newest appear at bottom
            messages = [...messages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

            setMessagesByConversation(prev => {
                const existingMessages = prev[conversationId] || [];
                if (page === 0) {
                    // For page 0, merge with existing messages to preserve real-time messages
                    const allMessages = [...messages, ...existingMessages];
                    // Remove duplicates by ID and sort chronologically
                    const uniqueMessages = allMessages.filter((msg, index, self) =>
                        index === self.findIndex(m => m.id === msg.id)
                    );
                    return {
                        ...prev,
                        [conversationId]: uniqueMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
                    };
                } else {
                    // Older pages should prepend (older first) before existing newer ones
                    return {
                        ...prev,
                        [conversationId]: [...messages, ...existingMessages]
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

            if (!conversation || !conversation.id) {
                console.error('startConversation: Invalid conversation from API', conversation);
                throw new Error('Invalid conversation returned from API');
            }

            // Add to conversations list if not exists
            setConversations(prev => {
                const exists = prev.some(c => c.id === conversation.id);
                return exists ? prev : [conversation, ...prev];
            });

            return conversation;
        } catch (error) {
            console.error('startConversation: Failed to start conversation:', error);
            alert('Грешка при стартиране на разговор.');
            throw error; // Препращаме грешката нагоре
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

    const openChat = useCallback((conversationId, conversationObj = null) => {
        // Използваме подадения conversation обект ако има, иначе търсим в state
        let conversation = conversationObj || conversationsRef.current.find(c => c.id === conversationId);
        if (!conversation) {
            conversation = activeChatsRef.current.find(c => c.conversation.id === conversationId)?.conversation;
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
        const existingChat = activeChatsRef.current.find(c => c.conversation.id === conversationId);
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
        const liveConversation = conversationsRef.current.find(c => c.id === conversationId);
        const newChat = {
            id: conversationId,
            conversation: liveConversation || conversation, // Use live reference if available
            isMinimized: false,
            position: calculateInitialPosition(),
            zIndex: nextZIndex.current++
        };

        setActiveChats(prev => [...prev, newChat]);

        // Load messages - ако има непрочетени, зареди повече съобщения (възстановен разговор)
        const shouldLoadMore = conversation.unreadCount > 0;
        loadMessages(conversationId, 0, shouldLoadMore ? 200 : 50);

        // Ако има непрочетени съобщения при отваряне - маркирай като прочетено
        // (това се случва само ако прозорецът е бил затворен при получаване)
        const messages = messagesByConversationRef.current[conversationId] || [];
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

    }, [currentUser]); // ← САМО currentUser!

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

        // Винаги нулирай unread count при restore - отварянето на чата се счита за преглед
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
        }

        // Винаги нулирай unread count при restore - независимо дали има непрочетени съобщения
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
                    // Автоматично отваряне след кратко забавяне
                    setTimeout(() => {
                        openChat(conversation.id);
                    }, 150);
                    return conversation;
                };

                // Wrapper за React context startConversation с автоматично отваряне
                const startConversationReactWithAutoOpen = async (otherUserId) => {
                    try {
                        const conversation = await startConversation(otherUserId);

                        if (!conversation || !conversation.id) {
                            console.error('startConversationReactWithAutoOpen: Invalid conversation returned', conversation);
                            return;
                        }

                        // Автоматично отваряне след кратко забавяне
                        setTimeout(() => {
                            try {
                                openChat(conversation.id);
                            } catch (error) {
                                console.error('startConversationReactWithAutoOpen: Error in openChat', error);
                            }
                        }, 150);
                        return conversation;
                    } catch (error) {
                        console.error('startConversationReactWithAutoOpen: Error', error);
                        throw error;
                    }
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
    }, []); // Празен dependency array - изпълнява се само при mount

    // ========== CONTEXT VALUE ==========

    const value = useMemo(() => ({
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

        // Call state
        currentCall,
        callState,
        showDeviceSelector,
        deviceSelectorMode,
        handleDeviceSelectorComplete,
        handleDeviceSelectorCancel,
        openAudioSettings,

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
        removeFromConversationList,

        // Call methods
        startCall,
        acceptCall,
        rejectCall,
        endCall
    }), [
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
        currentCall,
        callState,
        showDeviceSelector,
        deviceSelectorMode,
        handleDeviceSelectorComplete,
        handleDeviceSelectorCancel,
        openAudioSettings,
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
        removeFromConversationList,
        startCall,
        acceptCall,
        rejectCall,
        endCall
    ], [/* dependencies */]);

    return (
        <SVMessengerContext.Provider value={value}>
            {children}
        </SVMessengerContext.Provider>
    );
};