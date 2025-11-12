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
    const [callWindowRef, setCallWindowRef] = useState(null); // Reference to popup window
    const callChannelRef = useRef(null); // BroadcastChannel for synchronization

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
    const incomingCallSoundRef = useRef(null);

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
            let savedSettings = null;
            let hasSavedSettings = false;
            
            try {
                savedSettings = localStorage.getItem('svmessenger-audio-settings');
                if (savedSettings) {
                    try {
                        const parsed = JSON.parse(savedSettings);
                        hasSavedSettings = !!(parsed.microphone && parsed.speaker);
                    } catch (parseError) {
                        hasSavedSettings = false;
                    }
                }
            } catch (storageError) {
                // Check if we have settings in service memory as fallback
                const serviceDevices = svLiveKitService.getSelectedDevices();
                if (serviceDevices.microphone && serviceDevices.speaker) {
                    hasSavedSettings = true;
                    savedSettings = JSON.stringify({
                        microphone: serviceDevices.microphone,
                        speaker: serviceDevices.speaker,
                        micVolume: 75,
                        speakerVolume: 80
                    });
                }
            }

            if (hasSavedSettings) {
                // Apply saved settings to LiveKit service
                const settings = JSON.parse(savedSettings);
                
                if (settings.microphone) {
                    await svLiveKitService.setMicrophone(settings.microphone);
                }
                if (settings.speaker) {
                    await svLiveKitService.setSpeaker(settings.speaker);
                }
                await proceedWithCallStart(conversationId, otherUserId, conversation);
            } else {
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

    // Helper function to build call window URL
    const buildCallWindowUrl = useCallback((params) => {
        const baseUrl = window.location.origin;
        const queryParams = new URLSearchParams({
            token: params.token,
            roomName: params.roomName,
            conversationId: params.conversationId.toString(),
            otherUserId: params.otherUserId.toString(),
            otherUserName: encodeURIComponent(params.otherUserName || ''),
            otherUserAvatar: encodeURIComponent(params.otherUserAvatar || ''),
            currentUserId: params.currentUserId.toString(),
            currentUserName: encodeURIComponent(params.currentUserName || ''),
            currentUserAvatar: encodeURIComponent(params.currentUserAvatar || ''),
            callType: params.callType || 'voice',
            callState: params.callState || 'outgoing'
        });
        return `${baseUrl}/svmessenger/call-window.html?${queryParams.toString()}`;
    }, []);

    const endCall = useCallback(() => {
        // Stop incoming call sound if playing
        if (incomingCallSoundRef.current) {
            incomingCallSoundRef.current.pause();
            incomingCallSoundRef.current.currentTime = 0;
            incomingCallSoundRef.current = null;
        }
        
        // Close popup window if open
        setCallWindowRef(currentRef => {
            if (currentRef && !currentRef.closed) {
                currentRef.close();
            }
            return null;
        });

        // Notify popup to end call (if still open)
        if (callChannelRef.current) {
            callChannelRef.current.postMessage({
                type: 'CALL_ENDED',
                data: {}
            });
        }

        // Use functional setState to get latest currentCall value
        setCurrentCall(currentCallValue => {
            // Send CALL_END signal
            if (currentCallValue) {
                // Determine who is the caller and receiver
                // If callState is 'outgoing', we are the caller
                // Otherwise, we are the receiver (we received CALL_REQUEST)
                setCallState(currentState => {
                    const isCaller = currentState === 'outgoing';
                    
                    const signal = {
                        eventType: 'CALL_END',
                        conversationId: currentCallValue.conversationId,
                        callerId: isCaller ? currentUser.id : currentCallValue.otherUserId,
                        receiverId: isCaller ? currentCallValue.otherUserId : currentUser.id,
                        roomName: currentCallValue.roomName,
                        timestamp: new Date().toISOString()
                    };
                    svWebSocketService.sendCallSignal(signal);
                    
                    return 'idle';
                });
            }

            return null;
        });

        // Reset call state
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);
    }, [currentUser]);

    // Helper function to proceed with call after permissions are granted
    const proceedWithCallStart = useCallback(async (conversationId, otherUserId, conversation) => {
        try {
            const tokenResponse = await svMessengerAPI.getCallToken(conversationId, otherUserId);

            setLiveKitToken(tokenResponse.token);
            // Expose token on window as a fallback for race conditions between setting React state and incoming WS signals
            try {
                window.__sv_livekit_token = tokenResponse.token;
                window.liveKitToken = tokenResponse.token; // Additional fallback
            } catch (e) {
                // Silently fail
            }

            const callData = {
                conversationId,
                otherUserId,
                roomName: tokenResponse.roomName,
                conversation: conversation
            };
            setCurrentCall(callData);
            setCallState('outgoing');

            // Open popup window for call
            const popupUrl = buildCallWindowUrl({
                token: tokenResponse.token,
                roomName: tokenResponse.roomName,
                conversationId,
                otherUserId,
                otherUserName: conversation.otherUser?.realName || conversation.otherUser?.username || 'Потребител',
                otherUserAvatar: conversation.otherUser?.imageUrl || '',
                currentUserId: currentUser.id,
                currentUserName: currentUser.realName || currentUser.username,
                currentUserAvatar: currentUser.imageUrl || '',
                callType: 'voice',
                callState: 'outgoing'
            });

            const popup = window.open(
                popupUrl,
                'svmessenger-call',
                'width=420,height=650,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no'
            );

            if (popup) {
                setCallWindowRef(popup);
                
                // Monitor if popup is closed
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        setCallWindowRef(null);
                        // If popup is closed, end the call
                        endCall();
                    }
                }, 500);
            } else {
                // Popup blocked - fallback to modal
                console.warn('Popup blocked, using modal fallback');
            }

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

        } catch (error) {
            console.error('Failed to proceed with call start:', error);
            setCallState('idle');
        }
    }, [currentUser, buildCallWindowUrl, endCall]);

    const acceptCall = useCallback(async () => {
        try {
            // Check if we have saved audio settings
            let savedSettings = null;
            let hasSavedSettings = false;
            
            try {
                savedSettings = localStorage.getItem('svmessenger-audio-settings');
                if (savedSettings) {
                    try {
                        const parsed = JSON.parse(savedSettings);
                        hasSavedSettings = !!(parsed.microphone && parsed.speaker);
                    } catch (parseError) {
                        hasSavedSettings = false;
                    }
                }
            } catch (storageError) {
                // Check if we have settings in service memory as fallback
                const serviceDevices = svLiveKitService.getSelectedDevices();
                if (serviceDevices.microphone && serviceDevices.speaker) {
                    hasSavedSettings = true;
                    savedSettings = JSON.stringify({
                        microphone: serviceDevices.microphone,
                        speaker: serviceDevices.speaker,
                        micVolume: 75,
                        speakerVolume: 80
                    });
                }
            }

            if (hasSavedSettings) {
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
            // CRITICAL: Use the SAME room name that was sent in CALL_REQUEST signal
            // DO NOT generate a new token - use the room name from currentCall
            const roomName = currentCall.roomName;
            if (!roomName) {
                throw new Error('Missing room name for call accept');
            }

            // Generate token for accepting the call (using same conversation and room name)
            const tokenResponse = await svMessengerAPI.getCallToken(currentCall.conversationId, currentCall.otherUserId);

            // Ensure the room name matches what caller expects
            if (tokenResponse.roomName !== roomName) {
                // Override with the correct room name for this call
                tokenResponse.roomName = roomName;
            }

            setLiveKitToken(tokenResponse.token);

            // Send CALL_ACCEPT signal FIRST, before changing state and connecting
            // This ensures the caller receives the signal while still in 'outgoing' state
            const signal = {
                eventType: 'CALL_ACCEPT',
                conversationId: currentCall.conversationId,
                callerId: currentCall.otherUserId,
                receiverId: currentUser.id,
                roomName: roomName, // Use the same room name as in CALL_REQUEST
                timestamp: new Date().toISOString()
            };
            svWebSocketService.sendCallSignal(signal);
            
            // Open popup window for call
            const popupUrl = buildCallWindowUrl({
                token: tokenResponse.token,
                roomName: roomName,
                conversationId: currentCall.conversationId,
                otherUserId: currentCall.otherUserId,
                otherUserName: currentCall.conversation?.otherUser?.realName || currentCall.conversation?.otherUser?.username || 'Потребител',
                otherUserAvatar: currentCall.conversation?.otherUser?.imageUrl || '',
                currentUserId: currentUser.id,
                currentUserName: currentUser.realName || currentUser.username,
                currentUserAvatar: currentUser.imageUrl || '',
                callType: 'voice',
                callState: 'connected'
            });

            const popup = window.open(
                popupUrl,
                'svmessenger-call',
                'width=420,height=650,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no'
            );

            if (popup) {
                setCallWindowRef(popup);
                
                // Monitor if popup is closed
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        setCallWindowRef(null);
                        // If popup is closed, end the call
                        endCall();
                    }
                }, 500);
            } else {
                // Popup blocked - fallback to modal
                console.warn('Popup blocked, using modal fallback');
            }

            // Stop incoming call sound when accepting
            if (incomingCallSoundRef.current) {
                incomingCallSoundRef.current.pause();
                incomingCallSoundRef.current.currentTime = 0;
                incomingCallSoundRef.current = null;
            }
            
            // Now update state
            setCallState('connected');

        } catch (error) {
            console.error('Failed to proceed with call accept:', error);
            endCall();
        }
    }, [currentCall, currentUser, buildCallWindowUrl, endCall]);

    // Open device selector for settings
    const openAudioSettings = useCallback(() => {
        setDeviceSelectorMode('settings');
        setShowDeviceSelector(true);
    }, []);

    // Audio device selector handlers
    const handleDeviceSelectorComplete = useCallback(async (devices) => {
        setShowDeviceSelector(false);

        if (deviceSelectorMode === 'settings') {
            // Just save settings, no call action
            setDeviceSelectorMode('call');
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
        // Stop incoming call sound if playing
        if (incomingCallSoundRef.current) {
            incomingCallSoundRef.current.pause();
            incomingCallSoundRef.current.currentTime = 0;
            incomingCallSoundRef.current = null;
        }

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

        // Notify popup window if open
        if (callChannelRef.current) {
            callChannelRef.current.postMessage({
                type: 'CALL_REJECTED',
                data: {
                    conversationId: currentCall.conversationId
                }
            });
        }

        // Reset call state
        setCurrentCall(null);
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);
    }, [currentCall, currentUser]);

    // Initialize BroadcastChannel for synchronization
    useEffect(() => {
        callChannelRef.current = new BroadcastChannel('svmessenger-call');
        
        callChannelRef.current.onmessage = (event) => {
            const { type, data, message } = event.data;
            
            switch (type) {
                case 'POPUP_LOG':
                    // Log message from popup window
                    console.log(message, data || '');
                    break;
                case 'CALL_ENDED_FROM_POPUP':
                    // Call ended from popup, clean up
                    setCallState('idle');
                    setCurrentCall(null);
                    setCallWindowRef(null);
                    break;
                case 'MUTE_TOGGLED':
                    // Mute state changed in popup
                    // Could sync with main app if needed
                    break;
                default:
                    break;
            }
        };

        return () => {
            if (callChannelRef.current) {
                callChannelRef.current.close();
            }
        };
    }, []);

    const connectToLiveKit = useCallback(async (tokenResponse) => {
        try {
            await svLiveKitService.connect(tokenResponse.token, tokenResponse.roomName);
            setLiveKitRoom(tokenResponse.roomName);

            // Wait a bit for room to be fully ready before applying settings
            await new Promise(resolve => setTimeout(resolve, 500));

            // Apply saved audio settings after connecting to LiveKit
            let savedSettings = null;
            try {
                savedSettings = localStorage.getItem('svmessenger-audio-settings');
            } catch (storageError) {
                // Check service memory as fallback
                const serviceDevices = svLiveKitService.getSelectedDevices();
                if (serviceDevices.microphone && serviceDevices.speaker) {
                    savedSettings = JSON.stringify({
                        microphone: serviceDevices.microphone,
                        speaker: serviceDevices.speaker,
                        micVolume: 75,
                        speakerVolume: 80
                    });
                }
            }
            
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);

                    // Apply microphone first
                    if (settings.microphone) {
                        await svLiveKitService.setMicrophone(settings.microphone);
                    }

                    // Apply speaker
                    if (settings.speaker) {
                        await svLiveKitService.setSpeaker(settings.speaker);
                    }
                } catch (settingsError) {
                    // Silently fail
                }
            } else {
                // Try to enable default microphone
                try {
                    if (svLiveKitService.room && svLiveKitService.isConnected) {
                        await svLiveKitService.room.localParticipant.setMicrophoneEnabled(true);
                    }
                } catch (error) {
                    // Silently fail
                }
            }
        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            throw error;
        }
    }, []);

    const handleCallSignal = useCallback(async (signal) => {
        switch (signal.eventType) {
            case 'TEST_SIGNAL':
                // Test signal - ignore
                break;

            case 'CALL_REQUEST':
                if (signal.receiverId === currentUser.id) {

                    // Try to find conversation in current loaded conversations
                    let conversation = conversations.find(conv => conv.id === signal.conversationId);

                    // If not found, try to load it from backend
                    if (!conversation) {
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
                            }
                        } catch (error) {
                            console.error('Failed to load/create conversation:', error);
                            // Try to reload all conversations as fallback
                            try {
                                const conversationsData = await svMessengerAPI.getConversations();
                                setConversations(conversationsData);
                                conversation = conversationsData.find(conv => conv.id === signal.conversationId);
                            } catch (reloadError) {
                                console.error('Failed to reload conversations:', reloadError);
                            }
                        }
                    }

                    if (conversation) {
                        const callData = {
                            conversationId: signal.conversationId,
                            otherUserId: signal.callerId,
                            roomName: signal.roomName,
                            conversation: conversation
                        };
                        setCurrentCall(callData);
                        setCallState('incoming');

                        // Play incoming call sound in main window
                        try {
                            // Stop any existing sound
                            if (incomingCallSoundRef.current) {
                                incomingCallSoundRef.current.pause();
                                incomingCallSoundRef.current.currentTime = 0;
                                incomingCallSoundRef.current = null;
                            }
                            
                            const audio = new Audio('/svmessenger/sounds/IncomingCall.mp3');
                            audio.loop = true;
                            audio.volume = 0.7;
                            audio.preload = 'auto';
                            
                            incomingCallSoundRef.current = audio;
                            
                            // Try to play immediately
                            const playPromise = audio.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(err => {
                                    console.warn('⚠️ Failed to play incoming call sound (autoplay blocked):', err);
                                    // Try multiple fallback strategies
                                    // Strategy 1: Try after a small delay (sometimes helps)
                                    setTimeout(() => {
                                        audio.play().catch(() => {
                                            // Strategy 2: Try on any user interaction
                                            const startSoundOnInteraction = () => {
                                                audio.play().catch(e => console.error('Failed to play sound:', e));
                                                document.removeEventListener('click', startSoundOnInteraction);
                                                document.removeEventListener('touchstart', startSoundOnInteraction);
                                                document.removeEventListener('mousedown', startSoundOnInteraction);
                                                document.removeEventListener('keydown', startSoundOnInteraction);
                                                window.removeEventListener('focus', startSoundOnInteraction);
                                            };
                                            document.addEventListener('click', startSoundOnInteraction, { once: true });
                                            document.addEventListener('touchstart', startSoundOnInteraction, { once: true });
                                            document.addEventListener('mousedown', startSoundOnInteraction, { once: true });
                                            document.addEventListener('keydown', startSoundOnInteraction, { once: true });
                                            window.addEventListener('focus', startSoundOnInteraction, { once: true });
                                        });
                                    }, 200);
                                });
                            }
                            console.log('🔔 Incoming call sound started');
                        } catch (error) {
                            console.error('❌ Failed to play incoming call sound:', error);
                        }

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

                // CALL_ACCEPT can be received by both caller and receiver
                // Use functional setState to get latest currentCall value
                setCurrentCall(currentCallValue => {
                    setCallState(currentState => {
                        console.log('📞 CALL_ACCEPT - checking state:', currentState);
                        console.log('📞 CALL_ACCEPT - currentCall from functional setState:', currentCallValue);

                        // Check if we are the intended recipient of this signal
                        // Use currentCallValue from functional setState instead of closure value
                        const isForThisConversation = currentCallValue && currentCallValue.conversationId === signal.conversationId;
                        const isCaller = signal.callerId === currentUser.id;
                        const isReceiver = signal.receiverId === currentUser.id;

                        console.log('📞 CALL_ACCEPT analysis:', {
                            isForThisConversation,
                            isCaller,
                            isReceiver,
                            currentState,
                            hasCurrentCall: !!currentCallValue,
                            currentCallConversationId: currentCallValue?.conversationId,
                            signalConversationId: signal.conversationId
                        });

                        // Case 1: We are the caller receiving CALL_ACCEPT from receiver
                        // Allow processing even if currentCallValue is null but we have signal data
                        // Also allow if currentState is 'idle' but we have a popup window open (callWindowRef)
                        const hasPopupOpen = callWindowRef !== null;
                        if (isCaller && (currentState === 'outgoing' || (currentState === 'idle' && hasPopupOpen)) && (isForThisConversation || signal.roomName)) {
                            // If currentCallValue is null but we have signal data, restore it
                            if (!currentCallValue && signal.roomName) {
                                const restoredCall = {
                                    conversationId: signal.conversationId,
                                    otherUserId: signal.receiverId,
                                    roomName: signal.roomName,
                                    conversation: null
                                };
                                // Update currentCall for future use
                                setTimeout(() => {
                                    setCurrentCall(restoredCall);
                                }, 0);
                            }

                            // Notify popup window that call is accepted (if open)
                            if (callChannelRef.current) {
                                console.log('📤 Sending CALL_ACCEPTED message to popup window');
                                callChannelRef.current.postMessage({
                                    type: 'CALL_ACCEPTED',
                                    data: {
                                        conversationId: signal.conversationId,
                                        roomName: signal.roomName
                                    }
                                });
                            } else {
                                console.warn('⚠️ callChannelRef.current is null, cannot notify popup');
                            }

                        return 'connected';
                    }

                    // Case 2: We are the receiver receiving our own CALL_ACCEPT echoed back
                    else if (isReceiver && currentState === 'connected' && isForThisConversation) {
                        console.log('✅ CALL_ACCEPT acknowledged - receiver already connected');
                        // We already connected when we sent CALL_ACCEPT, just acknowledge
                        return currentState;
                    }

                    // Case 4: We are the receiver but currentCall is null (should not happen but handle gracefully)
                    else if (isReceiver && !currentCallValue) {
                        console.log('⚠️ CALL_ACCEPT received but currentCall is null - attempting to restore from signal data');

                        // Try to restore currentCall from signal data
                        const restoredCall = {
                            conversationId: signal.conversationId,
                            otherUserId: signal.callerId,
                            roomName: signal.roomName,
                            conversation: null // We don't have conversation object
                        };

                        console.log('📞 Restoring currentCall from signal:', restoredCall);
                        // Note: We can't call setCurrentCall here because it's async state update
                        // This is an edge case that should be handled by ensuring currentCall is set properly during CALL_REQUEST

                        return currentState; // Stay in current state
                    }

                    // Case 3: We are the receiver but in 'incoming' state (edge case - should not happen but handle it)
                    else if (isReceiver && currentState === 'incoming' && isForThisConversation) {
                        console.log('✅ CALL_ACCEPT received - receiver connecting to LiveKit');

                        // Connect to LiveKit room as receiver
                        const tokenToUse = liveKitToken || window.__sv_livekit_token || window.liveKitToken || null;
                        const roomNameToUse = signal.roomName || currentCallValue?.roomName;

                        if (tokenToUse && roomNameToUse) {
                            console.log('📞 Connecting receiver to LiveKit room:', roomNameToUse);
                            connectToLiveKit({
                                token: tokenToUse,
                                roomName: roomNameToUse
                            }).catch(error => {
                                console.error('❌ Failed to connect receiver to LiveKit:', error);
                            });
                        }

                        return 'connected';
                    }

                    else {
                        console.warn('⚠️ CALL_ACCEPT ignored - analysis:', {
                            isCaller,
                            isReceiver,
                            isForThisConversation,
                            currentState,
                            hasCurrentCall: !!currentCallValue,
                            signalConversationId: signal.conversationId,
                            currentCallConversationId: currentCallValue?.conversationId
                        });
                        return currentState; // Keep current state
                    }
                    });

                    // Return currentCallValue unchanged (we only use setCurrentCall to get latest value)
                    return currentCallValue;
                });
                break;

            case 'CALL_REJECT':
                // Stop incoming call sound if playing
                if (incomingCallSoundRef.current) {
                    incomingCallSoundRef.current.pause();
                    incomingCallSoundRef.current.currentTime = 0;
                    incomingCallSoundRef.current = null;
                }
                
                // Notify popup window if open
                if (callChannelRef.current) {
                    callChannelRef.current.postMessage({
                        type: 'CALL_REJECTED',
                        data: {
                            conversationId: signal.conversationId
                        }
                    });
                }
                
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

                // Use functional setState to get latest values
                setCurrentCall(currentCallValue => {
                    setCallState(currentState => {
                        // Check if this CALL_END is for our active call
                        const isForThisCall = currentCallValue && 
                                            currentCallValue.conversationId === signal.conversationId;

                        console.log('📞 CALL_END analysis:', {
                            isForThisCall,
                            currentState,
                            hasCurrentCall: !!currentCallValue,
                            signalConversationId: signal.conversationId,
                            currentCallConversationId: currentCallValue?.conversationId
                        });

                        if (currentState !== 'idle' && isForThisCall) {
                            // Stop incoming call sound if playing
                            if (incomingCallSoundRef.current) {
                                incomingCallSoundRef.current.pause();
                                incomingCallSoundRef.current.currentTime = 0;
                                incomingCallSoundRef.current = null;
                            }
                            
                            // Notify popup window that call ended (if open)
                            if (callChannelRef.current) {
                                callChannelRef.current.postMessage({
                                    type: 'CALL_ENDED',
                                    data: {
                                        conversationId: signal.conversationId
                                    }
                                });
                            }
                            
                            // Disconnect from LiveKit and reset tokens
                            svLiveKitService.disconnect();
                            // Note: setLiveKitToken and setLiveKitRoom will be called outside setCallState
                            return 'idle';
                        } else {
                            return currentState;
                        }
                    });

                    // Clear currentCall if it matches the signal and reset tokens
                    if (currentCallValue && currentCallValue.conversationId === signal.conversationId) {
                        setLiveKitToken(null);
                        setLiveKitRoom(null);
                        return null;
                    }
                    return currentCallValue;
                });
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
        endCall,
        
        // Call window reference
        callWindowRef
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