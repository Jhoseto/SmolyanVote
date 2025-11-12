/**
 * Главен компонент за call-window popup прозорец
 * Управлява LiveKit connection, WebSocket и UI за разговора
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, LocalAudioTrack } from 'livekit-client';
import CallWindowModal from './CallWindowModal';
import svWebSocketService from '../services/svWebSocketService';

const CallWindowApp = ({ callData }) => {
    // Only log once on mount, not on every render
    useEffect(() => {
        console.log('🎬 CallWindowApp component mounted with callState:', callData.callState);
    }, []); // Empty dependency array - only run once
    
    const [callState, setCallState] = useState(callData.callState); // 'outgoing', 'incoming', 'connected'
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    const roomRef = useRef(null);
    const audioStreamRef = useRef(null);
    const remoteAudioElementsRef = useRef(new Map());
    const selectedMicrophoneRef = useRef(null);
    const selectedSpeakerRef = useRef(null);
    const callChannelRef = useRef(null);
    const durationIntervalRef = useRef(null);

    // Зареди настройките на аудиото от localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('svmessenger-audio-settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.microphone) {
                    selectedMicrophoneRef.current = settings.microphone;
                }
                if (settings.speaker) {
                    selectedSpeakerRef.current = settings.speaker;
                }
            }
        } catch (error) {
            // Silently fail
        }
    }, []);

    // Connect to LiveKit room
    const connectToLiveKit = useCallback(async () => {
        try {
            if (roomRef.current && roomRef.current.isConnected) {
                await disconnectFromLiveKit();
            }

            const room = new Room();
            roomRef.current = room;

            // Setup event listeners
            room.on(RoomEvent.Connected, () => {
                console.log('✅ Room connected event fired');
                setIsConnected(true);
                setCallState('connected');
                
                console.log('Room connected, participants:', room.participants?.size || 0);
                console.log('Local participant identity:', room.localParticipant.identity);
                
                // Subscribe to existing participants' audio tracks
                // Follow the same logic as svLiveKitService
                if (room.participants && room.participants.size > 0) {
                    console.log('Found existing participants:', room.participants.size);
                    room.participants.forEach((participant, identity) => {
                        participant.audioTrackPublications.forEach((publication) => {
                            if (publication.track) {
                                console.log('  - ✅ Attaching existing track for:', identity);
                                attachRemoteAudioTrack(publication.track, identity);
                            }
                        });
                    });
                } else {
                    console.log('No existing participants in room - we are the first');
                }
            });

            room.on(RoomEvent.Disconnected, () => {
                setIsConnected(false);
            });

            room.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log('👤 Participant connected:', participant.identity);
                console.log('  - Audio track publications:', participant.audioTrackPublications.size);
                console.log('  - Video track publications:', participant.videoTrackPublications.size);
                
                // Subscribe to all audio tracks from this participant
                // Follow the same logic as svLiveKitService - only attach if track already exists
                // Subscription will happen automatically via TrackSubscribed event
                participant.audioTrackPublications.forEach((publication, trackSid) => {
                    console.log('  - Processing audio publication:', trackSid, {
                        hasTrack: !!publication.track,
                        isSubscribed: publication.isSubscribed,
                        trackSid: publication.trackSid,
                        source: publication.source
                    });
                    
                    if (publication.track) {
                        // Track already available, attach it immediately
                        console.log('  - ✅ Attaching existing track for participant:', participant.identity);
                        attachRemoteAudioTrack(publication.track, participant.identity);
                    } else {
                        // Track not available yet, subscribe to it
                        // LiveKit will automatically trigger TrackSubscribed when track is ready
                        console.log('  - ⏳ Track not available yet, subscribing...');
                        try {
                            room.localParticipant.setSubscribed(publication, true);
                            console.log('  - ✅ Successfully requested subscription, waiting for TrackSubscribed event');
                        } catch (error) {
                            console.error('  - ❌ Failed to subscribe to track:', error);
                        }
                    }
                });
            });

            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log('Participant disconnected:', participant.identity);
                // Detach all audio tracks from this participant
                detachRemoteAudioTrack(participant.identity);
                // If this was the other party (not local participant), end the call
                // Note: participant.identity is a string, need to compare properly
                const localIdentity = room.localParticipant.identity;
                if (participant.identity !== localIdentity) {
                    console.log('Other party disconnected, ending call');
                    // Send CALL_END signal before ending
                    try {
                        const signal = {
                            eventType: 'CALL_END',
                            conversationId: callData.conversationId,
                            callerId: callData.currentUserId,
                            receiverId: callData.otherUserId,
                            roomName: callData.roomName,
                            timestamp: new Date().toISOString()
                        };
                        svWebSocketService.sendCallSignal(signal);
                    } catch (error) {
                        console.error('Failed to send CALL_END on participant disconnect:', error);
                    }
                    handleEndCall();
                }
            });

            room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track && track.kind === 'audio') {
                    console.log('🎵 Track subscribed event:', {
                        kind: track.kind,
                        participant: participant.identity,
                        trackSid: track.sid,
                        publicationSid: publication.trackSid,
                        isMuted: track.isMuted
                    });
                    attachRemoteAudioTrack(track, participant.identity);
                } else {
                    console.log('Track subscribed but not audio:', track?.kind);
                }
            });

            room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                if (track.kind === 'audio') {
                    detachRemoteAudioTrack(participant.identity);
                }
            });

            // Connect to room
            console.log('🔌 Connecting to LiveKit room:', callData.roomName, 'with token length:', callData.token?.length || 0);
            console.log('🔌 Token preview:', callData.token?.substring(0, 50) + '...');
            
            await room.connect('wss://smolyanvote-nq17fbx3.livekit.cloud', callData.token);
            console.log('✅ Successfully connected to LiveKit room');
            console.log('✅ Room state:', {
                isConnected: room.isConnected,
                name: room.name,
                localParticipant: room.localParticipant?.identity,
                participants: room.participants?.size || 0
            });
            
            // After connection, ensure microphone is published
            // Wait a bit more for room to be fully ready (same as svLiveKitService)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Publish microphone directly here, NOT in RoomEvent.Connected handler
            // This follows the exact same pattern as svLiveKitService.connect()
            if (selectedMicrophoneRef.current && audioStreamRef.current) {
                try {
                    // Unpublish any existing tracks first
                    const existingTracks = Array.from(room.localParticipant.audioTrackPublications.values());
                    for (const publication of existingTracks) {
                        if (publication.track) {
                            await room.localParticipant.unpublishTrack(publication.track);
                        }
                    }
                    
                    // Get the audio track from the stream
                    const audioTracks = audioStreamRef.current.getAudioTracks();
                    if (audioTracks.length > 0) {
                        const mediaStreamTrack = audioTracks[0];
                        const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
                        
                        // Publish the track
                        await room.localParticipant.publishTrack(localAudioTrack, {
                            source: 'microphone'
                        });
                        console.log('✅ Microphone published successfully from existing stream');
                    }
                } catch (publishError) {
                    console.error('Failed to publish microphone from stream:', publishError);
                    // Fallback to default microphone
                    try {
                        await room.localParticipant.setMicrophoneEnabled(true);
                        console.log('✅ Enabled default microphone as fallback');
                    } catch (fallbackError) {
                        console.error('Failed to enable default microphone:', fallbackError);
                    }
                }
            } else if (!selectedMicrophoneRef.current) {
                // If no microphone selected, enable default (same as svLiveKitService)
                try {
                    await room.localParticipant.setMicrophoneEnabled(true);
                    console.log('✅ Enabled default microphone (no selection)');
                } catch (error) {
                    console.error('Failed to enable default microphone:', error);
                }
            } else {
                // If we have selectedMicrophone but no audioStream, get new stream and publish
                try {
                    const deviceId = selectedMicrophoneRef.current;
                    const constraints = {
                        audio: deviceId ? { deviceId: { ideal: deviceId } } : true,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    };
                    
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    audioStreamRef.current = stream;
                    const audioTracks = stream.getAudioTracks();
                    
                    if (audioTracks.length > 0) {
                        const mediaStreamTrack = audioTracks[0];
                        const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
                        
                        await room.localParticipant.publishTrack(localAudioTrack, {
                            source: 'microphone'
                        });
                        console.log('✅ Microphone published successfully from new stream');
                    }
                } catch (error) {
                    console.error('Failed to get and publish microphone:', error);
                    // Fallback to default microphone
                    try {
                        await room.localParticipant.setMicrophoneEnabled(true);
                        console.log('✅ Enabled default microphone as fallback');
                    } catch (fallbackError) {
                        console.error('Failed to enable default microphone:', fallbackError);
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            // Don't call handleEndCall() immediately - let user see the error
            // Only disconnect and show error state
            setIsConnected(false);
            setCallState('connected'); // Keep state as connected to show error UI
            if (roomRef.current) {
                try {
                    await roomRef.current.disconnect();
                } catch (disconnectError) {
                    console.error('Failed to disconnect on error:', disconnectError);
                }
                roomRef.current = null;
            }
            // Don't close window or send CALL_END - let user retry or manually close
        }
    }, [callData.token]);

    // Publish microphone
    const publishMicrophone = useCallback(async () => {
        console.log('🎤 publishMicrophone called');
        console.log('  - roomRef.current:', !!roomRef.current);
        console.log('  - isConnected:', roomRef.current?.isConnected);
        console.log('  - room name:', roomRef.current?.name);
        
        if (!roomRef.current) {
            console.error('❌ Cannot publish microphone: roomRef.current is null');
            return;
        }
        
        if (!roomRef.current.isConnected) {
            console.error('❌ Cannot publish microphone: room not connected', {
                isConnected: roomRef.current.isConnected,
                roomName: roomRef.current.name
            });
            return;
        }

        try {
            // Unpublish existing tracks first
            const existingTracks = Array.from(roomRef.current.localParticipant.audioTrackPublications.values());
            for (const publication of existingTracks) {
                if (publication.track) {
                    await roomRef.current.localParticipant.unpublishTrack(publication.track);
                }
            }

            // Get audio stream with selected microphone
            const deviceId = selectedMicrophoneRef.current;
            const constraints = {
                audio: deviceId ? { deviceId: { ideal: deviceId } } : true,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            };

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('Got user media stream with', stream.getAudioTracks().length, 'audio tracks');
            } catch (error) {
                console.warn('Failed to get user media with device:', error);
                // Fallback to default
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                    console.log('Got fallback user media stream');
                } catch (fallbackError) {
                    console.error('Failed to get fallback user media:', fallbackError);
                    // Last resort - try to enable default microphone
                    try {
                        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
                        console.log('Enabled default microphone via setMicrophoneEnabled');
                    } catch (enableError) {
                        console.error('Failed to enable default microphone:', enableError);
                    }
                    return;
                }
            }

            audioStreamRef.current = stream;
            const audioTracks = stream.getAudioTracks();
            
            if (audioTracks.length > 0) {
                const mediaStreamTrack = audioTracks[0];
                console.log('Creating LocalAudioTrack from MediaStreamTrack:', mediaStreamTrack.id);
                const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
                
                await roomRef.current.localParticipant.publishTrack(localAudioTrack, {
                    source: 'microphone'
                });
                console.log('✅ Microphone published successfully!');
                console.log('  - Track SID:', localAudioTrack.sid);
                console.log('  - Track kind:', localAudioTrack.kind);
                console.log('  - Track enabled:', localAudioTrack.isEnabled);
                console.log('  - Track muted:', localAudioTrack.isMuted);
                console.log('  - Local participant publications:', roomRef.current.localParticipant.audioTrackPublications.size);
            } else {
                console.error('No audio tracks in stream');
                // Try default microphone as fallback
                try {
                    await roomRef.current.localParticipant.setMicrophoneEnabled(true);
                    console.log('Enabled default microphone as fallback');
                } catch (fallbackError) {
                    console.error('Failed to enable default microphone:', fallbackError);
                }
            }
        } catch (error) {
            console.error('Failed to publish microphone:', error);
            // Try default microphone as fallback
            try {
                await roomRef.current.localParticipant.setMicrophoneEnabled(true);
                console.log('Enabled default microphone after error');
            } catch (fallbackError) {
                console.error('Failed to enable default microphone:', fallbackError);
            }
        }
    }, []);

    // Attach remote audio track
    const attachRemoteAudioTrack = useCallback((track, participantIdentity) => {
        try {
            console.log('🔊 Attaching remote audio track:', {
                participant: participantIdentity,
                trackSid: track.sid,
                trackKind: track.kind,
                isMuted: track.isMuted,
                isEnabled: track.isEnabled
            });
            
            // Check if we already have an audio element for this participant
            const existingElement = remoteAudioElementsRef.current.get(participantIdentity);
            if (existingElement) {
                console.log('Removing existing audio element for:', participantIdentity);
                // Detach old track and remove element
                try {
                    track.detach(existingElement);
                } catch (e) {
                    console.warn('Error detaching old track:', e);
                }
                existingElement.pause();
                existingElement.srcObject = null;
                existingElement.remove();
            }

            const audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            audioElement.playsInline = true;
            audioElement.volume = 1.0;

            if (selectedSpeakerRef.current && 'setSinkId' in HTMLAudioElement.prototype) {
                audioElement.setSinkId(selectedSpeakerRef.current).then(() => {
                    console.log('Speaker set to:', selectedSpeakerRef.current);
                }).catch((err) => {
                    console.warn('Failed to set speaker:', err);
                });
            } else {
                console.log('Using default speaker (setSinkId not available or no speaker selected)');
            }

            track.attach(audioElement);
            remoteAudioElementsRef.current.set(participantIdentity, audioElement);
            
            console.log('✅ Remote audio track attached for participant:', participantIdentity);
            console.log('Audio element properties:', {
                autoplay: audioElement.autoplay,
                volume: audioElement.volume,
                paused: audioElement.paused,
                readyState: audioElement.readyState,
                src: audioElement.src
            });

            audioElement.addEventListener('error', (e) => {
                console.error('❌ Remote audio error:', e, {
                    error: audioElement.error,
                    networkState: audioElement.networkState,
                    readyState: audioElement.readyState
                });
            });

            audioElement.addEventListener('loadedmetadata', () => {
                console.log('📊 Remote audio metadata loaded for:', participantIdentity, {
                    duration: audioElement.duration,
                    readyState: audioElement.readyState
                });
            });

            audioElement.addEventListener('canplay', () => {
                console.log('▶️ Remote audio can play for:', participantIdentity);
            });

            audioElement.addEventListener('playing', () => {
                console.log('🎵 Remote audio is playing for:', participantIdentity);
            });

            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('✅ Remote audio playing for:', participantIdentity);
                }).catch((error) => {
                    console.warn('⚠️ Autoplay prevented for remote audio:', error);
                    // Add click listener to try playing again
                    const tryPlay = () => {
                        audioElement.play().then(() => {
                            console.log('✅ Remote audio started after user interaction');
                        }).catch((err) => {
                            console.error('❌ Failed to play after user interaction:', err);
                        });
                    };
                    document.addEventListener('click', tryPlay, { once: true });
                    document.addEventListener('touchstart', tryPlay, { once: true });
                });
            }
        } catch (error) {
            console.error('❌ Error attaching remote audio track:', error);
        }
    }, []);

    // Detach remote audio track
    const detachRemoteAudioTrack = useCallback((participantIdentity) => {
        const audioElement = remoteAudioElementsRef.current.get(participantIdentity);
        if (audioElement) {
            audioElement.pause();
            audioElement.srcObject = null;
            audioElement.remove();
            remoteAudioElementsRef.current.delete(participantIdentity);
        }
    }, []);

    // Set microphone
    const setMicrophone = useCallback(async (deviceId) => {
        selectedMicrophoneRef.current = deviceId;
        
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { ideal: deviceId } } : true,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            });

            audioStreamRef.current = stream;

            if (roomRef.current && roomRef.current.isConnected) {
                // Unpublish existing tracks
                const existingTracks = Array.from(roomRef.current.localParticipant.audioTrackPublications.values());
                for (const publication of existingTracks) {
                    if (publication.track) {
                        await roomRef.current.localParticipant.unpublishTrack(publication.track);
                    }
                }

                // Publish new track
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const mediaStreamTrack = audioTracks[0];
                    const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
                    await roomRef.current.localParticipant.publishTrack(localAudioTrack, {
                        source: 'microphone'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to set microphone:', error);
        }
    }, []);

    // Set speaker
    const setSpeaker = useCallback(async (deviceId) => {
        selectedSpeakerRef.current = deviceId;

        if ('setSinkId' in HTMLAudioElement.prototype) {
            remoteAudioElementsRef.current.forEach((audioElement) => {
                audioElement.setSinkId(deviceId).catch(() => {});
            });
        }
    }, []);

    // Disconnect from LiveKit
    const disconnectFromLiveKit = useCallback(async () => {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }

        remoteAudioElementsRef.current.forEach((audioElement) => {
            audioElement.pause();
            audioElement.srcObject = null;
            audioElement.remove();
        });
        remoteAudioElementsRef.current.clear();

        if (roomRef.current) {
            await roomRef.current.disconnect();
            roomRef.current = null;
        }

        setIsConnected(false);
    }, []);

    // Handle end call
    const handleEndCall = useCallback(async () => {
        console.log('📞 handleEndCall called');
        console.log('  - Current callState:', callState);
        console.log('  - Current isConnected:', isConnected);
        console.log('  - Conversation ID:', callData.conversationId);
        
        // Send CALL_END signal via WebSocket (if we have connection info)
        // We need to send this before closing to notify the other party
        try {
            const signal = {
                eventType: 'CALL_END',
                conversationId: callData.conversationId,
                callerId: callData.currentUserId,
                receiverId: callData.otherUserId,
                roomName: callData.roomName,
                timestamp: new Date().toISOString()
            };
            console.log('📤 Sending CALL_END signal:', signal);
            svWebSocketService.sendCallSignal(signal);
            console.log('✅ CALL_END signal sent from popup');
        } catch (error) {
            console.error('❌ Failed to send CALL_END signal:', error);
        }
        
        await disconnectFromLiveKit();
        
        // Notify main window
        if (callChannelRef.current) {
            callChannelRef.current.postMessage({
                type: 'CALL_ENDED_FROM_POPUP',
                data: { conversationId: callData.conversationId }
            });
        }

        console.log('🚪 Closing popup window');
        // Close popup
        window.close();
    }, [callData, disconnectFromLiveKit, callState, isConnected]);

    // Handle mute toggle
    const handleMuteToggle = useCallback(() => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (roomRef.current && roomRef.current.isConnected) {
            if (newMutedState) {
                roomRef.current.localParticipant.setMicrophoneEnabled(false);
            } else {
                roomRef.current.localParticipant.setMicrophoneEnabled(true);
            }
        }

        // Notify main window
        if (callChannelRef.current) {
            callChannelRef.current.postMessage({
                type: 'MUTE_TOGGLED',
                data: { isMuted: newMutedState }
            });
        }
    }, [isMuted]);

    // Connect when component mounts (only for connected calls, not outgoing)
    useEffect(() => {
        console.log('🔄 useEffect for callState changed:', callState);
        // Only connect if callState is 'connected' - don't connect automatically for 'outgoing'
        // Wait for CALL_ACCEPT signal to change state to 'connected'
        if (callState === 'connected') {
            console.log('✅ callState is "connected", connecting to LiveKit...');
            connectToLiveKit().catch((error) => {
                console.error('❌ Failed to connect to LiveKit in useEffect:', error);
            });
        } else {
            console.log('⏳ callState is not "connected", waiting... (current:', callState, ')');
        }

        return () => {
            console.log('🧹 Cleaning up LiveKit connection');
            disconnectFromLiveKit();
        };
    }, [callState, connectToLiveKit, disconnectFromLiveKit]);

    // Timer for call duration
    useEffect(() => {
        if (callState === 'connected' && isConnected) {
            durationIntervalRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
            setCallDuration(0);
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [callState, isConnected]);

    // Initialize WebSocket connection for receiving CALL_END signals
    useEffect(() => {
        // Connect to WebSocket to receive call signals
        const handleCallSignal = (signal) => {
            if (signal.eventType === 'CALL_END') {
                console.log('📞 CALL_END received in popup:', signal);
                // Check if this CALL_END is for our call
                if (signal.conversationId === callData.conversationId) {
                    console.log('📞 CALL_END matches our call, ending...');
                    handleEndCall();
                }
            }
        };

        // Connect to WebSocket with call signal handler
        svWebSocketService.connect({
            onCallSignal: handleCallSignal,
            onConnect: () => {
                console.log('WebSocket connected in popup');
            },
            onDisconnect: () => {
                console.log('WebSocket disconnected in popup');
            },
            onError: (error) => {
                console.error('WebSocket error in popup:', error);
            }
        });

        return () => {
            // Disconnect when component unmounts
            svWebSocketService.disconnect();
        };
    }, [callData.conversationId, handleEndCall]);

    // BroadcastChannel за синхронизация с основния сайт
    // Трябва да е след дефинирането на всички функции
    useEffect(() => {
        callChannelRef.current = new BroadcastChannel('svmessenger-call');
        
        callChannelRef.current.onmessage = (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'CALL_ENDED':
                    console.log('📞 CALL_ENDED received via BroadcastChannel');
                    handleEndCall();
                    break;
                case 'CALL_ACCEPTED':
                    // Call was accepted, update state to connected and connect to LiveKit
                    console.log('✅ CALL_ACCEPTED received via BroadcastChannel, changing callState to connected');
                    setCallState('connected');
                    // connectToLiveKit will be called by the useEffect when state changes to 'connected'
                    break;
                case 'MUTE_TOGGLED':
                    setIsMuted(data.isMuted);
                    break;
                case 'DEVICE_CHANGED':
                    if (data.microphone) {
                        selectedMicrophoneRef.current = data.microphone;
                        setMicrophone(data.microphone);
                    }
                    if (data.speaker) {
                        selectedSpeakerRef.current = data.speaker;
                        setSpeaker(data.speaker);
                    }
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
    }, [handleEndCall, setMicrophone, setSpeaker]);

    // Handle window close
    useEffect(() => {
        const handleBeforeUnload = () => {
            disconnectFromLiveKit();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [disconnectFromLiveKit]);

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <CallWindowModal
            callState={callState}
            callDuration={callDuration}
            formatDuration={formatDuration}
            isMuted={isMuted}
            isConnected={isConnected}
            otherUserName={callData.otherUserName}
            otherUserAvatar={callData.otherUserAvatar}
            onMuteToggle={handleMuteToggle}
            onEndCall={handleEndCall}
        />
    );
};

export default CallWindowApp;

