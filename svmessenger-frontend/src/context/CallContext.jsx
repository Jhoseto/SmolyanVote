/**
 * Call Context - Handles voice call logic, LiveKit integration, and call signaling
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { svMessengerAPI } from '../services/svMessengerAPI';
import svWebSocketService from '../services/svWebSocketService';
import svLiveKitService from '../services/svLiveKitService';
import { useMessages } from './MessagesContext';

const CallContext = createContext(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within CallProvider');
    }
    return context;
};

export const CallProvider = ({ children, currentUser }) => {

    const { conversations, conversationsRef } = useMessages();

    // ========== STATE ==========

    // Call state
    const [currentCall, setCurrentCall] = useState(null);
    const [callState, setCallState] = useState('idle'); // 'idle', 'outgoing', 'incoming', 'connected'
    const [callWindowRef, setCallWindowRef] = useState(null);

    const [liveKitToken, setLiveKitToken] = useState(null);
    const [liveKitRoom, setLiveKitRoom] = useState(null);

    // Audio device setup state
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [deviceSelectorMode, setDeviceSelectorMode] = useState('call'); // 'call' or 'settings'
    const [pendingCallAction, setPendingCallAction] = useState(null);

    // Refs
    const callChannelRef = useRef(null);
    const incomingCallSoundRef = useRef(null);

    // ========== CALL METHODS ==========

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

    const proceedWithCallStart = useCallback(async (conversationId, otherUserId, conversation) => {
        try {
            const tokenResponse = await svMessengerAPI.getCallToken(conversationId, otherUserId);

            setLiveKitToken(tokenResponse.token);

            // Expose token on window as fallback
            try {
                window.__sv_livekit_token = tokenResponse.token;
                window.liveKitToken = tokenResponse.token;
            } catch (e) {}

            const callData = {
                conversationId,
                otherUserId,
                roomName: tokenResponse.roomName,
                conversation: conversation
            };
            setCurrentCall(callData);
            setCallState('outgoing');

            // Open popup window
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
                        endCall();
                    }
                }, 500);
            } else {
                console.warn('Popup blocked, using modal fallback');
            }

            // Send call request signal
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
    }, [currentUser, buildCallWindowUrl]);

    const startCall = useCallback(async (conversationId, otherUserId, conversationObj = null) => {
        try {
            let conversation = conversationObj;

            if (!conversation) {
                conversation = conversationsRef.current.find(conv => conv.id === conversationId);
            }

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Check for saved audio settings
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
                // Apply saved settings
                const settings = JSON.parse(savedSettings);

                if (settings.microphone) {
                    await svLiveKitService.setMicrophone(settings.microphone);
                }
                if (settings.speaker) {
                    await svLiveKitService.setSpeaker(settings.speaker);
                }
                await proceedWithCallStart(conversationId, otherUserId, conversation);
            } else {
                // Show device selector
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
    }, [currentUser, conversationsRef, proceedWithCallStart]);

    const proceedWithCallAccept = useCallback(async () => {
        try {
            const roomName = currentCall.roomName;
            if (!roomName) {
                throw new Error('Missing room name for call accept');
            }

            // Generate token
            const tokenResponse = await svMessengerAPI.getCallToken(currentCall.conversationId, currentCall.otherUserId);

            if (tokenResponse.roomName !== roomName) {
                tokenResponse.roomName = roomName;
            }

            setLiveKitToken(tokenResponse.token);

            // Send CALL_ACCEPT signal first
            const signal = {
                eventType: 'CALL_ACCEPT',
                conversationId: currentCall.conversationId,
                callerId: currentCall.otherUserId,
                receiverId: currentUser.id,
                roomName: roomName,
                timestamp: new Date().toISOString()
            };
            svWebSocketService.sendCallSignal(signal);

            // Open popup window
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
                        endCall();
                    }
                }, 500);
            } else {
                console.warn('Popup blocked, using modal fallback');
            }

            // Stop incoming call sound
            if (incomingCallSoundRef.current) {
                incomingCallSoundRef.current.pause();
                incomingCallSoundRef.current.currentTime = 0;
                incomingCallSoundRef.current = null;
            }

            setCallState('connected');
        } catch (error) {
            console.error('Failed to proceed with call accept:', error);
            endCall();
        }
    }, [currentCall, currentUser, buildCallWindowUrl]);

    const acceptCall = useCallback(async () => {
        try {
            // Check for saved audio settings
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
                // Apply saved settings
                const settings = JSON.parse(savedSettings);

                if (settings.microphone) {
                    await svLiveKitService.setMicrophone(settings.microphone);
                }
                if (settings.speaker) {
                    await svLiveKitService.setSpeaker(settings.speaker);
                }
                await proceedWithCallAccept();
            } else {
                // Show device selector
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
    }, [currentCall, currentUser, proceedWithCallAccept]);

    const endCall = useCallback(() => {
        // Stop incoming call sound
        if (incomingCallSoundRef.current) {
            incomingCallSoundRef.current.pause();
            incomingCallSoundRef.current.currentTime = 0;
            incomingCallSoundRef.current = null;
        }

        // Close popup window
        setCallWindowRef(currentRef => {
            if (currentRef && !currentRef.closed) {
                currentRef.close();
            }
            return null;
        });

        // Notify popup
        if (callChannelRef.current) {
            callChannelRef.current.postMessage({
                type: 'CALL_ENDED',
                data: {}
            });
        }

        // Send CALL_END signal
        setCurrentCall(currentCallValue => {
            if (currentCallValue) {
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

        // Reset state
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);
    }, [currentUser]);

    const rejectCall = useCallback(() => {
        // Stop incoming call sound
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

        // Notify popup
        if (callChannelRef.current) {
            callChannelRef.current.postMessage({
                type: 'CALL_REJECTED',
                data: {
                    conversationId: currentCall.conversationId
                }
            });
        }

        // Reset state
        setCurrentCall(null);
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);
    }, [currentCall, currentUser]);

    const connectToLiveKit = useCallback(async (tokenResponse) => {
        try {
            await svLiveKitService.connect(tokenResponse.token, tokenResponse.roomName);
            setLiveKitRoom(tokenResponse.roomName);

            // Wait for room to be ready
            await new Promise(resolve => setTimeout(resolve, 500));

            // Apply saved audio settings
            let savedSettings = null;
            try {
                savedSettings = localStorage.getItem('svmessenger-audio-settings');
            } catch (storageError) {
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

                    if (settings.microphone) {
                        await svLiveKitService.setMicrophone(settings.microphone);
                    }

                    if (settings.speaker) {
                        await svLiveKitService.setSpeaker(settings.speaker);
                    }
                } catch (settingsError) {}
            } else {
                try {
                    if (svLiveKitService.room && svLiveKitService.isConnected) {
                        await svLiveKitService.room.localParticipant.setMicrophoneEnabled(true);
                    }
                } catch (error) {}
            }
        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            throw error;
        }
    }, []);

    const openAudioSettings = useCallback(() => {
        setDeviceSelectorMode('settings');
        setShowDeviceSelector(true);
    }, []);

    const handleDeviceSelectorComplete = useCallback(async (devices) => {
        setShowDeviceSelector(false);

        if (deviceSelectorMode === 'settings') {
            setDeviceSelectorMode('call');
        } else if (pendingCallAction) {
            const { type, data } = pendingCallAction;
            setPendingCallAction(null);

            if (type === 'start') {
                await proceedWithCallStart(data.conversationId, data.otherUserId, data.conversation);
            } else if (type === 'accept') {
                await proceedWithCallAccept();
            }
        }
    }, [deviceSelectorMode, pendingCallAction, proceedWithCallStart, proceedWithCallAccept]);

    const handleDeviceSelectorCancel = useCallback(() => {
        setShowDeviceSelector(false);
        setDeviceSelectorMode('call');
        setPendingCallAction(null);

        if (deviceSelectorMode !== 'settings') {
            setCallState('idle');
            setCurrentCall(null);
        }
    }, [deviceSelectorMode]);

    // ========== CALL SIGNAL HANDLER ==========

    const handleCallSignal = useCallback(async (signal) => {
        switch (signal.eventType) {
            case 'TEST_SIGNAL':
                break;

            case 'CALL_REQUEST':
                if (signal.receiverId === currentUser.id) {
                    let conversation = conversations.find(conv => conv.id === signal.conversationId);

                    if (!conversation) {
                        try {
                            const newConversation = await svMessengerAPI.startConversation(signal.callerId);
                            if (newConversation) {
                                conversation = newConversation;
                            }
                        } catch (error) {
                            console.error('Failed to load/create conversation:', error);
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

                        // Play incoming call sound
                        try {
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

                            const playPromise = audio.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(err => {
                                    console.warn('⚠️ Failed to play incoming call sound:', err);
                                });
                            }
                        } catch (error) {
                            console.error('❌ Failed to play incoming call sound:', error);
                        }

                        // Show browser notification
                        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                            new Notification('Incoming Call', {
                                body: `${conversation.otherUser.realName || conversation.otherUser.username} is calling you`,
                                icon: conversation.otherUser.imageUrl || '/images/default-avatar.png'
                            });
                        }
                    }
                }
                break;

            case 'CALL_ACCEPT':
                setCurrentCall(currentCallValue => {
                    setCallState(currentState => {
                        const isForThisConversation = currentCallValue && currentCallValue.conversationId === signal.conversationId;
                        const isCaller = signal.callerId === currentUser.id;
                        const isReceiver = signal.receiverId === currentUser.id;

                        const hasPopupOpen = callWindowRef !== null;
                        if (isCaller && (currentState === 'outgoing' || (currentState === 'idle' && hasPopupOpen)) && (isForThisConversation || signal.roomName)) {
                            if (!currentCallValue && signal.roomName) {
                                const restoredCall = {
                                    conversationId: signal.conversationId,
                                    otherUserId: signal.receiverId,
                                    roomName: signal.roomName,
                                    conversation: null
                                };
                                setTimeout(() => {
                                    setCurrentCall(restoredCall);
                                }, 0);
                            }

                            if (callChannelRef.current) {
                                callChannelRef.current.postMessage({
                                    type: 'CALL_ACCEPTED',
                                    data: {
                                        conversationId: signal.conversationId,
                                        roomName: signal.roomName
                                    }
                                });
                            }

                            return 'connected';
                        } else if (isReceiver && currentState === 'connected' && isForThisConversation) {
                            return currentState;
                        } else if (isReceiver && currentState === 'incoming' && isForThisConversation) {
                            const tokenToUse = liveKitToken || window.__sv_livekit_token || window.liveKitToken || null;
                            const roomNameToUse = signal.roomName || currentCallValue?.roomName;

                            if (tokenToUse && roomNameToUse) {
                                connectToLiveKit({
                                    token: tokenToUse,
                                    roomName: roomNameToUse
                                }).catch(error => {
                                    console.error('❌ Failed to connect receiver to LiveKit:', error);
                                });
                            }

                            return 'connected';
                        }

                        return currentState;
                    });

                    return currentCallValue;
                });
                break;

            case 'CALL_REJECT':
                if (incomingCallSoundRef.current) {
                    incomingCallSoundRef.current.pause();
                    incomingCallSoundRef.current.currentTime = 0;
                    incomingCallSoundRef.current = null;
                }

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
                setCurrentCall(currentCallValue => {
                    setCallState(currentState => {
                        const isForThisCall = currentCallValue &&
                            currentCallValue.conversationId === signal.conversationId;

                        if (currentState !== 'idle' && isForThisCall) {
                            if (incomingCallSoundRef.current) {
                                incomingCallSoundRef.current.pause();
                                incomingCallSoundRef.current.currentTime = 0;
                                incomingCallSoundRef.current = null;
                            }

                            if (callChannelRef.current) {
                                callChannelRef.current.postMessage({
                                    type: 'CALL_ENDED',
                                    data: {
                                        conversationId: signal.conversationId
                                    }
                                });
                            }

                            svLiveKitService.disconnect();
                            return 'idle';
                        } else {
                            return currentState;
                        }
                    });

                    if (currentCallValue && currentCallValue.conversationId === signal.conversationId) {
                        setLiveKitToken(null);
                        setLiveKitRoom(null);
                        return null;
                    }
                    return currentCallValue;
                });
                break;

            case 'CALL_BUSY':
                break;

            default:
                console.warn('Unknown call signal type:', signal.eventType);
        }
    }, [callState, currentUser, liveKitToken, connectToLiveKit, conversations, callWindowRef]);

    // ========== BROADCAST CHANNEL ==========

    useEffect(() => {
        callChannelRef.current = new BroadcastChannel('svmessenger-call');

        callChannelRef.current.onmessage = (event) => {
            const { type, data, message } = event.data;

            switch (type) {
                case 'POPUP_LOG':
                    console.log(message, data || '');
                    break;
                case 'CALL_ENDED_FROM_POPUP':
                    setCallState('idle');
                    setCurrentCall(null);
                    setCallWindowRef(null);
                    break;
                case 'MUTE_TOGGLED':
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

    // ========== CONTEXT VALUE ==========

    const value = {
        // State
        currentCall,
        callState,
        showDeviceSelector,
        deviceSelectorMode,
        callWindowRef,
        liveKitToken,
        liveKitRoom,

        // Methods
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        connectToLiveKit,
        openAudioSettings,
        handleDeviceSelectorComplete,
        handleDeviceSelectorCancel,

        // WebSocket handler (exposed for WebSocketManager)
        handleCallSignal
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};
