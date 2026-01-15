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

    // CRITICAL: Track call start time for call history
    const callStartTimeRef = useRef(null);

    // CRITICAL: Track if CALL_END signal was already sent to prevent duplicates
    const callEndSignalSentRef = useRef(false);

    // CRITICAL FIX: Track if the call was EVER connected directly via Ref
    // This avoids race conditions where state changes to 'idle' before we calculate call status
    const hasEverConnectedRef = useRef(false);

    // Audio device setup state
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [deviceSelectorMode, setDeviceSelectorMode] = useState('call'); // 'call' or 'settings'
    const [pendingCallAction, setPendingCallAction] = useState(null);

    // Refs
    const callChannelRef = useRef(null);
    const incomingCallSoundRef = useRef(null);
    const popupCheckIntervalRef = useRef(null); // CRITICAL FIX: Ref to store interval ID

    // CRITICAL: Track call state in ref to avoid stale closures in setInterval/endCall
    const callStateRef = useRef('idle');

    // Keep callStateRef in sync
    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    // ========== CALL METHODS ==========

    const buildCallWindowUrl = useCallback((params) => {
        const baseUrl = window.location.origin;
        // ... (rest of function)
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
            } catch (e) { }

            const callData = {
                conversationId,
                otherUserId,
                roomName: tokenResponse.roomName,
                conversation: conversation,
                // CRITICAL: Set startTime when outgoing call is initiated
                startTime: new Date(),
                // CRITICAL: Track if this is an incoming call (false for outgoing)
                isIncoming: false
            };
            // CRITICAL: Reset call end signal flag for new call
            callEndSignalSentRef.current = false;
            // CRITICAL: Reset connection tracker
            hasEverConnectedRef.current = false;
            setCurrentCall(callData);
            setCallState('outgoing');

            // Open popup window
            const popupUrl = buildCallWindowUrl({
                token: tokenResponse.token,
                roomName: tokenResponse.roomName,
                conversationId,
                otherUserId,
                otherUserId: otherUserId,
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

                // Clear any existing interval
                if (popupCheckIntervalRef.current) {
                    clearInterval(popupCheckIntervalRef.current);
                }

                // Monitor if popup is closed
                // CRITICAL FIX: Store interval in ref so we can clear it in endCall
                popupCheckIntervalRef.current = setInterval(() => {
                    if (popup.closed) {
                        if (popupCheckIntervalRef.current) {
                            clearInterval(popupCheckIntervalRef.current);
                            popupCheckIntervalRef.current = null;
                        }
                        setCallWindowRef(null);
                        endCall();
                    }
                }, 500);
            } else {
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

            // Check for saved audio/video settings
            let savedSettings = null;
            let hasSavedSettings = false;

            try {
                // Първо проверявам новия ключ (svmessenger-audio-video-settings)
                savedSettings = localStorage.getItem('svmessenger-audio-video-settings');
                if (!savedSettings) {
                    // Fallback към стария ключ (svmessenger-audio-settings)
                    savedSettings = localStorage.getItem('svmessenger-audio-settings');
                }

                if (savedSettings) {
                    try {
                        const parsed = JSON.parse(savedSettings);
                        // Проверявам дали има микрофон и слушалки (задължителни)
                        hasSavedSettings = !!(parsed.microphone && parsed.speaker);
                    } catch (parseError) {
                        hasSavedSettings = false;
                    }
                }
            } catch (storageError) {
                // Fallback към service devices
                const serviceDevices = svLiveKitService.getSelectedDevices();
                if (serviceDevices.microphone && serviceDevices.speaker) {
                    hasSavedSettings = true;
                    savedSettings = JSON.stringify({
                        microphone: serviceDevices.microphone,
                        speaker: serviceDevices.speaker,
                        camera: serviceDevices.camera || null,
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
                if (settings.camera) {
                    svLiveKitService.selectedCamera = settings.camera;
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

            // CRITICAL: Reset call end signal flag for new call
            callEndSignalSentRef.current = false;
            // CRITICAL: Reset connection tracker
            hasEverConnectedRef.current = false;

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

                // Clear any existing interval
                if (popupCheckIntervalRef.current) {
                    clearInterval(popupCheckIntervalRef.current);
                }

                // Monitor if popup is closed
                // CRITICAL FIX: Store interval in ref so we can clear it in endCall
                popupCheckIntervalRef.current = setInterval(() => {
                    if (popup.closed) {
                        if (popupCheckIntervalRef.current) {
                            clearInterval(popupCheckIntervalRef.current);
                            popupCheckIntervalRef.current = null;
                        }
                        setCallWindowRef(null);
                        endCall();
                    }
                }, 500);
            } else {
            }

            // Stop incoming call sound
            if (incomingCallSoundRef.current) {
                incomingCallSoundRef.current.pause();
                incomingCallSoundRef.current.currentTime = 0;
                incomingCallSoundRef.current = null;
            }

            setCallState('connected');
            // CRITICAL: Set call start time when call becomes connected
            if (!callStartTimeRef.current) {
                callStartTimeRef.current = new Date();
            }
        } catch (error) {
            console.error('Failed to proceed with call accept:', error);
            endCall();
        }
    }, [currentCall, currentUser, buildCallWindowUrl]);

    const acceptCall = useCallback(async () => {
        try {
            // Check for saved audio/video settings
            let savedSettings = null;
            let hasSavedSettings = false;

            try {
                // Първо проверявам новия ключ (svmessenger-audio-video-settings)
                savedSettings = localStorage.getItem('svmessenger-audio-video-settings');
                if (!savedSettings) {
                    // Fallback към стария ключ (svmessenger-audio-settings)
                    savedSettings = localStorage.getItem('svmessenger-audio-settings');
                }

                if (savedSettings) {
                    try {
                        const parsed = JSON.parse(savedSettings);
                        // Проверявам дали има микрофон и слушалки (задължителни)
                        hasSavedSettings = !!(parsed.microphone && parsed.speaker);
                    } catch (parseError) {
                        hasSavedSettings = false;
                    }
                }
            } catch (storageError) {
                // Fallback към service devices
                const serviceDevices = svLiveKitService.getSelectedDevices();
                if (serviceDevices.microphone && serviceDevices.speaker) {
                    hasSavedSettings = true;
                    savedSettings = JSON.stringify({
                        microphone: serviceDevices.microphone,
                        speaker: serviceDevices.speaker,
                        camera: serviceDevices.camera || null,
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
                if (settings.camera) {
                    svLiveKitService.selectedCamera = settings.camera;
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
        // CRITICAL: Check if CALL_END signal was already sent (from popup window)
        // This prevents duplicate CALL_END signals when popup closes and main window also tries to send
        if (callEndSignalSentRef.current) {
            // Still reset state and close popup, but don't send signal again
            setCallWindowRef(currentRef => {
                if (currentRef && !currentRef.closed) {
                    currentRef.close();
                }
                return null;
            });
            setCallState('idle');
            setLiveKitToken(null);
            setLiveKitRoom(null);
            setCurrentCall(null);
            return;
        }

        // Stop incoming call sound
        if (incomingCallSoundRef.current) {
            incomingCallSoundRef.current.pause();
            incomingCallSoundRef.current.currentTime = 0;
            incomingCallSoundRef.current = null;
        }

        // Stop checking for popup closed
        if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
            popupCheckIntervalRef.current = null;
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
        if (currentCall) {
            // CRITICAL FIX: Determine who initiated the call reliably
            // callState checks are unreliable because state changes to 'connected' for both
            const isCaller = currentCall.isIncoming !== undefined
                ? !currentCall.isIncoming
                : callStateRef.current === 'outgoing'; // Use Ref

            // CRITICAL: Get startTime and endTime for call history
            // CRITICAL FIX: If startTime is not set, the call was never connected, so duration should be 0
            // But we still need valid timestamps for database
            const now = new Date();
            // CRITICAL: Use callStartTimeRef.current (set when Room connected or synced from popup)
            const startTime = callStartTimeRef.current
                ? new Date(callStartTimeRef.current).toISOString()
                : now.toISOString();
            const endTime = now.toISOString();

            // CRITICAL: Calculate duration for logging
            const durationSeconds = callStartTimeRef.current && now
                ? Math.floor((now.getTime() - new Date(callStartTimeRef.current).getTime()) / 1000)
                : null;

            // CRITICAL: Determine status
            // Use REF to get the TRUE current state, avoiding stale closures from setInterval
            // FINAL SAFEGUARD: If we have duration > 0 OR hasEverConnectedRef is true, it WAS connected
            const wasConnected = hasEverConnectedRef.current || callStateRef.current === 'connected' || (durationSeconds !== null && durationSeconds > 0);

            console.log('📞 [Web endCall] Determining connection status:', {
                hasEverConnected: hasEverConnectedRef.current,
                currentState: callStateRef.current,
                durationSeconds,
                FINAL_DECISION: wasConnected
            });

            const signal = {
                eventType: 'CALL_END',
                conversationId: currentCall.conversationId,
                callerId: isCaller ? currentUser.id : currentCall.otherUserId,
                receiverId: isCaller ? currentCall.otherUserId : currentUser.id,
                roomName: currentCall.roomName,
                timestamp: now.toISOString(),
                // CRITICAL: Add call history fields
                startTime: startTime,
                endTime: endTime,
                isVideoCall: false, // Default to false for now
                wasConnected: wasConnected // CRITICAL: Send explicit connection status from Ref OR duration
            };

            console.log('📞 [Web endCall] Sending CALL_END signal:', {
                conversationId: currentCall.conversationId,
                callerId: signal.callerId,
                receiverId: signal.receiverId,
                startTime,
                endTime,
                durationSeconds,
                wasConnected: signal.wasConnected
            });

            // CRITICAL: Mark as sent to prevent duplicates
            callEndSignalSentRef.current = true;
            svWebSocketService.sendCallSignal(signal);

            // Reset call start time
            callStartTimeRef.current = null;
        }

        // Reset state
        setCallState('idle');
        setLiveKitToken(null);
        setLiveKitRoom(null);

        // CRITICAL: Reset flag after a delay to allow for new calls
        setTimeout(() => {
            callEndSignalSentRef.current = false;
        }, 5000);
    }, [currentUser, currentCall, callState]);

    const rejectCall = useCallback(() => {
        // Stop incoming call sound
        if (incomingCallSoundRef.current) {
            incomingCallSoundRef.current.pause();
            incomingCallSoundRef.current.currentTime = 0;
            incomingCallSoundRef.current = null;
        }

        // CRITICAL: For rejected calls, startTime and endTime are the same (no conversation happened)
        const rejectTime = new Date().toISOString();

        // Send CALL_REJECT signal
        const signal = {
            eventType: 'CALL_REJECT',
            conversationId: currentCall.conversationId,
            callerId: currentCall.otherUserId,
            receiverId: currentUser.id,
            roomName: currentCall.roomName,
            timestamp: rejectTime,
            // CRITICAL: Use startTime from call data, not rejectTime
            startTime: currentCall.startTime ? new Date(currentCall.startTime).toISOString() : rejectTime,
            endTime: rejectTime,
            isVideoCall: false // Default to false for rejected calls
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

            // Apply saved audio/video settings
            let savedSettings = null;
            try {
                // Първо проверявам новия ключ (svmessenger-audio-video-settings)
                savedSettings = localStorage.getItem('svmessenger-audio-video-settings');
                if (!savedSettings) {
                    // Fallback към стария ключ (svmessenger-audio-settings)
                    savedSettings = localStorage.getItem('svmessenger-audio-settings');
                }
            } catch (storageError) {
                const serviceDevices = svLiveKitService.getSelectedDevices();
                if (serviceDevices.microphone && serviceDevices.speaker) {
                    savedSettings = JSON.stringify({
                        microphone: serviceDevices.microphone,
                        speaker: serviceDevices.speaker,
                        camera: serviceDevices.camera || null,
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

                    if (settings.camera) {
                        svLiveKitService.selectedCamera = settings.camera;
                    }
                } catch (settingsError) { }
            } else {
                try {
                    if (svLiveKitService.room && svLiveKitService.isConnected) {
                        await svLiveKitService.room.localParticipant.setMicrophoneEnabled(true);
                    }
                } catch (error) { }
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
                            conversation: conversation,
                            // CRITICAL: Set startTime when incoming call is received (not when connected)
                            // This ensures duration calculation works even if call is rejected immediately
                            startTime: new Date(),
                            // CRITICAL: Track if this is an incoming call (true for incoming)
                            isIncoming: true
                        };
                        // CRITICAL: Reset call end signal flag for new incoming call
                        callEndSignalSentRef.current = false;
                        // CRITICAL: Reset connection tracker
                        hasEverConnectedRef.current = false;
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
                // CRITICAL: Set call start time when call is accepted (becomes connected)
                // This is when the conversation actually starts
                if (!callStartTimeRef.current) {
                    callStartTimeRef.current = new Date();
                    console.log('📞 [CallContext] Call start time set on CALL_ACCEPT:', callStartTimeRef.current.toISOString());
                }

                // CRITICAL: Mark as connected when we receive CALL_ACCEPT (Caller side)
                hasEverConnectedRef.current = true;

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
        }
    }, [callState, currentUser, liveKitToken, connectToLiveKit, conversations, callWindowRef]);

    // ========== BROADCAST CHANNEL ==========

    useEffect(() => {
        callChannelRef.current = new BroadcastChannel('svmessenger-call');

        callChannelRef.current.onmessage = (event) => {
            const { type, data, message } = event.data;

            switch (type) {
                case 'POPUP_LOG':
                    break;
                case 'CALL_START_TIME':
                    // CRITICAL: Sync call start time from popup window
                    if (data && data.startTime) {
                        callStartTimeRef.current = new Date(data.startTime);
                        console.log('📞 [CallContext] Call start time synced from popup:', callStartTimeRef.current.toISOString());

                        // CRITICAL: Update state to connected so if main window handles endCall (fallback),
                        // it knows the call was connected and sends correct wasConnected=true
                        setCallState('connected');
                    }
                    break;
                case 'CALL_ENDED_FROM_POPUP':
                    // CRITICAL: CALL_END signal was already sent from popup window
                    // Just update local state, don't send another signal
                    console.log('📞 CALL_ENDED_FROM_POPUP received - call was ended from popup');

                    // CRITICAL: Set flag to prevent main window from sending duplicate signal
                    callEndSignalSentRef.current = true;

                    // CRITICAL FIX: Clear the interval to prevent main window from triggering endCall
                    if (popupCheckIntervalRef.current) {
                        clearInterval(popupCheckIntervalRef.current);
                        popupCheckIntervalRef.current = null;
                        console.log('🛑 [CallContext] Cleared popup check interval on BROADCAST');
                    }

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
