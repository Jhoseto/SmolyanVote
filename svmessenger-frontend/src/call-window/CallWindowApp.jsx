/**
 * Главен компонент за call-window popup прозорец
 * Управлява LiveKit connection, WebSocket и UI за разговора
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import CallWindowModal from './CallWindowModal';
import svWebSocketService from '../services/svWebSocketService';
import svLiveKitService from '../services/svLiveKitService';
import '../styles/call-video.css';

const CallWindowApp = ({ callData }) => {
    // Only log once on mount, not on every render
    useEffect(() => {
        console.log('🎬 CallWindowApp component mounted with callState:', callData.callState);
    }, []); // Empty dependency array - only run once
    
    const [callState, setCallState] = useState(callData.callState); // 'outgoing', 'incoming', 'connected', 'rejected', 'ended'
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Video state
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [remoteVideoVisible, setRemoteVideoVisible] = useState(false);
    const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

    const roomRef = useRef(null);
    const audioStreamRef = useRef(null);
    const remoteAudioElementsRef = useRef(new Map());
    const selectedMicrophoneRef = useRef(null);
    const selectedSpeakerRef = useRef(null);
    const callChannelRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const callSoundRef = useRef(null);
    const isDisconnectingRef = useRef(false); // Flag to prevent multiple disconnect calls

    // Video refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteVideoElementRef = useRef(new Map()); // Store video elements and tracks

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

            room.on(RoomEvent.Disconnected, (reason) => {
                console.log('Room disconnected event:', reason);
                console.log('  - isDisconnectingRef:', isDisconnectingRef.current);
                setIsConnected(false);
                
                // Don't auto-close on disconnect unless it's a real disconnect (not an error)
                // Only close if we're not already disconnecting and it's not an error
                if (!isDisconnectingRef.current && reason !== 'CLIENT_REQUESTED') {
                    console.log('  - Unexpected disconnect, but not closing popup automatically');
                    // Don't close - let user manually close or retry
                }
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
                        console.log('  - ✅ Attaching existing audio track for participant:', participant.identity);
                        attachRemoteAudioTrack(publication.track, participant.identity);
                    } else {
                        // Track not available yet, subscribe to it
                        // LiveKit will automatically trigger TrackSubscribed when track is ready
                        console.log('  - ⏳ Audio track not available yet, subscribing...');
                        try {
                            room.localParticipant.setSubscribed(publication, true);
                            console.log('  - ✅ Successfully requested audio subscription, waiting for TrackSubscribed event');
                        } catch (error) {
                            console.error('  - ❌ Failed to subscribe to audio track:', error);
                        }
                    }
                });

                // Subscribe to all video tracks from this participant
                participant.videoTrackPublications.forEach((publication, trackSid) => {
                    console.log('  - Processing video publication:', trackSid, {
                        hasTrack: !!publication.track,
                        isSubscribed: publication.isSubscribed,
                        trackSid: publication.trackSid,
                        source: publication.source
                    });
                    
                    if (publication.track) {
                        // Track already available, attach it immediately
                        console.log('  - ✅ Attaching existing video track for participant:', participant.identity);
                        attachRemoteVideoTrack(publication.track, participant.identity);
                    } else {
                        // Track not available yet, subscribe to it
                        console.log('  - ⏳ Video track not available yet, subscribing...');
                        try {
                            room.localParticipant.setSubscribed(publication, true);
                            console.log('  - ✅ Successfully requested video subscription, waiting for TrackSubscribed event');
                        } catch (error) {
                            console.error('  - ❌ Failed to subscribe to video track:', error);
                        }
                    }
                });
            });

            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log('Participant disconnected:', participant.identity);
                console.log('  - Local participant identity:', room.localParticipant?.identity);
                console.log('  - Disconnected participant identity:', participant.identity);
                console.log('  - Are they the same?', participant.identity === room.localParticipant?.identity);
                console.log('  - isDisconnectingRef:', isDisconnectingRef.current);
                
                // Don't process disconnect if we're already disconnecting (prevents race conditions)
                if (isDisconnectingRef.current) {
                    console.log('  - Already disconnecting, ignoring ParticipantDisconnected event');
                    return;
                }
                
                // Detach all audio tracks from this participant
                detachRemoteAudioTrack(participant.identity);
                
                // Detach all video tracks from this participant
                detachRemoteVideoTrack(participant.identity);
                
                // If this was the other party (not local participant), end the call
                // Note: participant.identity is a string, need to compare properly
                const localIdentity = room.localParticipant?.identity;
                if (localIdentity && participant.identity !== localIdentity) {
                    console.log('⚠️ Other party disconnected, waiting before ending call...');
                    // Wait longer before ending to see if it's a temporary disconnect (especially during camera toggle)
                    setTimeout(() => {
                        // Check if room is still connected and participant is still gone
                        if (roomRef.current && roomRef.current.isConnected && !isDisconnectingRef.current) {
                            const stillConnected = Array.from(roomRef.current.participants.values())
                                .some(p => p.identity === participant.identity);
                            
                            if (!stillConnected) {
                                console.log('✅ Participant still disconnected after delay, ending call');
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
                            } else {
                                console.log('Participant reconnected, not ending call');
                            }
                        }
                    }, 8000); // Wait 8 seconds before ending (allows for temporary disconnects during camera toggle and track publishing)
                } else {
                    console.log('Local participant disconnected or identity mismatch - not ending call');
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
                } else if (track && track.kind === 'video') {
                    console.log('🎬 [TrackSubscribed] Video track subscribed:', {
                        participant: participant.identity,
                        trackSid: track.sid,
                        isLocal: participant === room.localParticipant
                    });
                    
                    // Check if this is our own video track (local)
                    if (participant === room.localParticipant) {
                        console.log('🎬 [TrackSubscribed] This is LOCAL video track');
                        // This is our local video track - attach to local preview
                        if (localVideoRef.current && track) {
                            try {
                                console.log('🎬 [TrackSubscribed] Attaching local track to localVideoRef...');
                                track.attach(localVideoRef.current);
                                console.log('✅ [TrackSubscribed] Local video preview attached from TrackSubscribed event');
                            } catch (attachError) {
                                console.error('❌ [TrackSubscribed] Error attaching local video:', attachError);
                            }
                        } else {
                            console.warn('⚠️ [TrackSubscribed] Missing localVideoRef or track:', {
                                hasRef: !!localVideoRef.current,
                                hasTrack: !!track
                            });
                        }
                    } else {
                        console.log('🎬 [TrackSubscribed] This is REMOTE video track');
                        // This is remote video track
                        attachRemoteVideoTrack(track, participant.identity);
                    }
                } else {
                    console.log('🎬 [TrackSubscribed] Track subscribed but unknown kind:', track?.kind);
                }
            });

            // Listen for TrackPublished event to attach local video immediately
            room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
                console.log('🎬 [LocalTrackPublished] Event fired:', {
                    hasTrack: !!publication.track,
                    trackKind: publication.track?.kind,
                    trackSid: publication.trackSid,
                    source: publication.source,
                    participantIdentity: participant?.identity
                });
                
                if (publication.track && publication.track.kind === 'video') {
                    console.log('🎬 [LocalTrackPublished] Video track detected:', {
                        trackSid: publication.trackSid,
                        source: publication.source,
                        trackId: publication.track.id,
                        trackEnabled: publication.track.isEnabled
                    });
                    
                    // Attach to local preview immediately
                    if (localVideoRef.current && publication.track) {
                        try {
                            console.log('🎬 [LocalTrackPublished] Attaching to localVideoRef...');
                            publication.track.attach(localVideoRef.current);
                            console.log('✅ [LocalTrackPublished] Local video preview attached from event');
                            console.log('🎬 [LocalTrackPublished] Video element after attach:', {
                                srcObject: !!localVideoRef.current.srcObject,
                                videoWidth: localVideoRef.current.videoWidth,
                                videoHeight: localVideoRef.current.videoHeight
                            });
                        } catch (attachError) {
                            console.error('❌ [LocalTrackPublished] Error attaching:', attachError);
                        }
                    } else {
                        console.warn('⚠️ [LocalTrackPublished] Missing localVideoRef or track:', {
                            hasRef: !!localVideoRef.current,
                            hasTrack: !!publication.track
                        });
                    }
                } else {
                    console.log('🎬 [LocalTrackPublished] Not a video track, ignoring');
                }
            });

            // Listen for TrackPublished event from remote participants (when they publish video during call)
            room.on(RoomEvent.TrackPublished, (publication, participant) => {
                // Only process remote participants (not local)
                if (participant !== room.localParticipant && publication.track?.kind === 'video') {
                    console.log('🎬 [TrackPublished] Remote participant published video track:', {
                        participant: participant.identity,
                        trackSid: publication.trackSid,
                        source: publication.source,
                        hasTrack: !!publication.track,
                        isSubscribed: publication.isSubscribed
                    });
                    
                    try {
                        // Subscribe to the track if not already subscribed
                        if (!publication.isSubscribed) {
                            try {
                                console.log('🎬 [TrackPublished] Subscribing to remote video track...');
                                room.localParticipant.setSubscribed(publication, true);
                                console.log('✅ [TrackPublished] Successfully requested subscription to remote video track');
                            } catch (error) {
                                console.error('❌ [TrackPublished] Failed to subscribe to remote video track:', error);
                                // Don't throw - this is non-critical, track might subscribe later via TrackSubscribed event
                            }
                        } else if (publication.track) {
                            // Track is already subscribed, attach it immediately
                            console.log('🎬 [TrackPublished] Track already subscribed, attaching immediately...');
                            try {
                                attachRemoteVideoTrack(publication.track, participant.identity);
                            } catch (attachError) {
                                console.error('❌ [TrackPublished] Error attaching remote video track:', attachError);
                                // Don't throw - this is non-critical, track might attach later via TrackSubscribed event
                            }
                        }
                    } catch (error) {
                        console.error('❌ [TrackPublished] Unexpected error processing remote video track:', error);
                        // Don't throw - this should not cause disconnect
                    }
                }
            });

            room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                if (track.kind === 'audio') {
                    detachRemoteAudioTrack(participant.identity);
                } else if (track.kind === 'video') {
                    detachRemoteVideoTrack(participant.identity);
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

    // ========== VIDEO TRACK HANDLERS ==========

    // Attach remote video track
    const attachRemoteVideoTrack = useCallback((track, participantIdentity) => {
        try {
            console.log('📹 Attaching remote video track:', {
                participant: participantIdentity,
                trackSid: track.sid
            });

            // Store track reference for cleanup
            if (!remoteVideoElementRef.current) {
                remoteVideoElementRef.current = new Map();
            }
            
            // Detach existing track for this participant if any
            const existingTrack = remoteVideoElementRef.current.get(participantIdentity);
            if (existingTrack && existingTrack.element) {
                try {
                    existingTrack.track?.detach(existingTrack.element);
                } catch (e) {
                    console.warn('Error detaching existing track:', e);
                }
            }

            // Create video element (but don't append to DOM yet - React will handle it)
            const videoElement = document.createElement('video');
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.muted = false;
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.backgroundColor = '#000';

            // Attach track to video element
            track.attach(videoElement);

            // Store reference
            remoteVideoElementRef.current.set(participantIdentity, { element: videoElement, track });

            // Attach to React-controlled container
            if (remoteVideoRef.current) {
                // Check if there's already a video element for this participant
                const existingElement = remoteVideoElementRef.current.get(participantIdentity)?.element;
                
                // If there's an existing element in the DOM, remove it first (safely)
                if (existingElement && existingElement.parentNode === remoteVideoRef.current) {
                    try {
                        // Only remove if it's actually a child of the container
                        if (remoteVideoRef.current.contains(existingElement)) {
                            remoteVideoRef.current.removeChild(existingElement);
                        }
                    } catch (e) {
                        console.warn('⚠️ Error removing existing video element (non-critical):', e.message);
                        // If removal fails, try to remove all children (but very carefully)
                        try {
                            // Use a more defensive approach - check each child before removing
                            const children = Array.from(remoteVideoRef.current.children);
                            for (const child of children) {
                                if (remoteVideoRef.current.contains(child)) {
                                    remoteVideoRef.current.removeChild(child);
                                }
                            }
                        } catch (e2) {
                            console.warn('⚠️ Error clearing container (non-critical):', e2.message);
                            // If all else fails, just clear innerHTML (last resort)
                            try {
                                remoteVideoRef.current.innerHTML = '';
                            } catch (e3) {
                                console.error('❌ Failed to clear container:', e3);
                            }
                        }
                    }
                } else {
                    // No existing element or it's not in the DOM, clear all children safely
                    try {
                        // Use a more defensive approach - collect children first, then remove
                        const childrenToRemove = [];
                        let child = remoteVideoRef.current.firstChild;
                        while (child) {
                            if (remoteVideoRef.current.contains(child)) {
                                childrenToRemove.push(child);
                            }
                            child = child.nextSibling;
                        }
                        // Remove collected children
                        childrenToRemove.forEach(child => {
                            try {
                                if (remoteVideoRef.current.contains(child)) {
                                    remoteVideoRef.current.removeChild(child);
                                }
                            } catch (e) {
                                console.warn('⚠️ Error removing child (non-critical):', e.message);
                            }
                        });
                    } catch (e) {
                        console.warn('⚠️ Error clearing container (non-critical):', e.message);
                        // Last resort - clear innerHTML
                        try {
                            remoteVideoRef.current.innerHTML = '';
                        } catch (e2) {
                            console.error('❌ Failed to clear container:', e2);
                        }
                    }
                }
                
                // Append new video element
                try {
                    remoteVideoRef.current.appendChild(videoElement);
                    setRemoteVideoVisible(true);
                    console.log('✅ Remote video displayed in UI');
                } catch (e) {
                    console.error('❌ Error appending video element:', e);
                    throw e; // Re-throw to be caught by outer try-catch
                }
            }
        } catch (error) {
            console.error('❌ Error attaching remote video track:', error);
        }
    }, []);

    // Detach remote video track
    const detachRemoteVideoTrack = useCallback((participantIdentity) => {
        console.log('📹 Detaching remote video track for:', participantIdentity);
        
        // Detach track from element
        if (remoteVideoElementRef.current) {
            const trackData = remoteVideoElementRef.current.get(participantIdentity);
            if (trackData) {
                try {
                    // Detach track first
                    if (trackData.track && trackData.element) {
                        trackData.track.detach(trackData.element);
                    }
                    
                    // Remove element from DOM safely - check if it's still a child
                    if (trackData.element && trackData.element.parentNode) {
                        // Check if element is actually a child before removing
                        if (trackData.element.parentNode.contains(trackData.element)) {
                            trackData.element.parentNode.removeChild(trackData.element);
                        } else {
                            console.warn('⚠️ Element is not a child of parent, skipping removeChild');
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Error detaching track (non-critical):', e.message);
                    // Don't throw - this is cleanup, errors are acceptable
                }
                remoteVideoElementRef.current.delete(participantIdentity);
            }
        }
        
        // Also call service method for cleanup
        try {
            svLiveKitService.detachRemoteVideoTrack(participantIdentity);
        } catch (e) {
            console.warn('⚠️ Error in service detach (non-critical):', e.message);
        }
        
        setRemoteVideoVisible(false);

        // Clear remote video container if no more tracks
        if (remoteVideoRef.current && (!remoteVideoElementRef.current || remoteVideoElementRef.current.size === 0)) {
            // Safely remove all children
            try {
                while (remoteVideoRef.current.firstChild) {
                    remoteVideoRef.current.removeChild(remoteVideoRef.current.firstChild);
                }
            } catch (e) {
                console.warn('⚠️ Error clearing container (non-critical):', e.message);
            }
        }
    }, []);

    // ========== CAMERA TOGGLE HANDLER ==========
    
    // Helper function to toggle camera on a room (similar to svLiveKitService.toggleCamera)
    const toggleCameraOnRoom = useCallback(async (room, enabled, selectedCameraId) => {
        if (!room || !isConnected) {
            console.warn('⚠️ [toggleCameraOnRoom] Cannot toggle camera - not connected');
            return false;
        }

        try {
            if (enabled) {
                console.log('🎥 [toggleCameraOnRoom] ENABLING camera...');
                
                // Unpublish existing video tracks first
                const existingVideoTracks = Array.from(room.localParticipant.videoTrackPublications.values());
                console.log('🎥 [toggleCameraOnRoom] Existing video tracks:', existingVideoTracks.length);
                for (const publication of existingVideoTracks) {
                    if (publication.track) {
                        console.log('🎥 [toggleCameraOnRoom] Unpublishing existing track:', publication.trackSid);
                        await room.localParticipant.unpublishTrack(publication.track);
                        publication.track.stop();
                    }
                }

                // Request video stream with selected camera
                const videoConstraints = {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                };

                if (selectedCameraId) {
                    videoConstraints.deviceId = { exact: selectedCameraId };
                    console.log('🎥 [toggleCameraOnRoom] Using selected camera:', selectedCameraId);
                } else {
                    console.log('🎥 [toggleCameraOnRoom] No camera selected, using default');
                }

                console.log('🎥 [toggleCameraOnRoom] Requesting getUserMedia with constraints:', videoConstraints);
                
                // Get video stream from getUserMedia
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints
                });

                console.log('🎥 [toggleCameraOnRoom] getUserMedia success, stream:', {
                    id: videoStream.id,
                    active: videoStream.active,
                    tracks: videoStream.getVideoTracks().length
                });

                // Get video track from stream
                const videoTracks = videoStream.getVideoTracks();
                console.log('🎥 [toggleCameraOnRoom] Video tracks in stream:', videoTracks.length);
                
                if (videoTracks.length === 0) {
                    throw new Error('No video track in stream');
                }

                const mediaStreamTrack = videoTracks[0];
                console.log('🎥 [toggleCameraOnRoom] MediaStreamTrack:', {
                    id: mediaStreamTrack.id,
                    kind: mediaStreamTrack.kind,
                    label: mediaStreamTrack.label,
                    enabled: mediaStreamTrack.enabled,
                    readyState: mediaStreamTrack.readyState
                });
                
                // Create LocalVideoTrack from MediaStreamTrack
                console.log('🎥 [toggleCameraOnRoom] Creating LocalVideoTrack...');
                const videoTrack = new LocalVideoTrack(mediaStreamTrack);
                console.log('🎥 [toggleCameraOnRoom] LocalVideoTrack created:', {
                    sid: videoTrack.sid,
                    kind: videoTrack.kind,
                    isMuted: videoTrack.isMuted,
                    isEnabled: videoTrack.isEnabled
                });

                // Publish video track
                console.log('🎥 [toggleCameraOnRoom] Publishing video track...');
                try {
                    await room.localParticipant.publishTrack(videoTrack, {
                        source: 'camera'
                    });
                    console.log('🎥 [toggleCameraOnRoom] Video track published successfully');
                } catch (publishError) {
                    console.error('❌ [toggleCameraOnRoom] Error publishing video track:', publishError);
                    // Stop the video track if publish failed
                    videoTrack.stop();
                    throw publishError;
                }

                // Log final state
                const publishedTracks = Array.from(room.localParticipant.videoTrackPublications.values());
                console.log('🎥 [toggleCameraOnRoom] Published tracks count:', publishedTracks.length);
                publishedTracks.forEach((pub, idx) => {
                    console.log(`  Track ${idx + 1}:`, {
                        trackSid: pub.trackSid,
                        source: pub.source,
                        hasTrack: !!pub.track,
                        trackId: pub.track?.id
                    });
                });
                
                return true;
            } else {
                console.log('🎥 [toggleCameraOnRoom] DISABLING camera...');
                
                // Unpublish all video tracks
                const existingVideoTracks = Array.from(room.localParticipant.videoTrackPublications.values());
                console.log('🎥 [toggleCameraOnRoom] Unpublishing', existingVideoTracks.length, 'video tracks');
                
                for (const publication of existingVideoTracks) {
                    if (publication.track) {
                        console.log('🎥 [toggleCameraOnRoom] Unpublishing track:', publication.trackSid);
                        await room.localParticipant.unpublishTrack(publication.track);
                        publication.track.stop();
                    }
                }

                console.log('✅ [toggleCameraOnRoom] Camera disabled - now billing as audio-only call');
                return true;
            }
        } catch (error) {
            const errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                location: 'toggleCameraOnRoom'
            };
            
            console.error('❌ [toggleCameraOnRoom] Failed to toggle camera:', error);
            console.error('❌ [toggleCameraOnRoom] Error details:', errorDetails);
            
            // Send error to main window via BroadcastChannel
            if (callChannelRef.current) {
                try {
                    callChannelRef.current.postMessage({
                        type: 'CAMERA_ERROR',
                        data: errorDetails
                    });
                } catch (postError) {
                    console.error('Failed to send error via BroadcastChannel:', postError);
                }
            }
            
            // Also save to localStorage for debugging
            try {
                const existingErrors = JSON.parse(localStorage.getItem('svmessenger-camera-errors') || '[]');
                existingErrors.push(errorDetails);
                // Keep only last 10 errors
                if (existingErrors.length > 10) {
                    existingErrors.shift();
                }
                localStorage.setItem('svmessenger-camera-errors', JSON.stringify(existingErrors));
            } catch (storageError) {
                console.error('Failed to save error to localStorage:', storageError);
            }
            
            return false;
        }
    }, [isConnected]);

    const handleCameraToggle = useCallback(async () => {
        console.log('🎬 [handleCameraToggle] START', {
            hasRoom: !!roomRef.current,
            isConnectedState: isConnected,
            roomIsConnected: roomRef.current?.isConnected,
            currentState: isVideoEnabled,
            cameraPermissionDenied
        });
        
        // Check both state and room property for connection status
        if (!roomRef.current || (!isConnected && !roomRef.current.isConnected)) {
            console.warn('⚠️ [handleCameraToggle] Cannot toggle camera - not connected', {
                hasRoom: !!roomRef.current,
                isConnectedState: isConnected,
                roomIsConnected: roomRef.current?.isConnected
            });
            return;
        }

        const newVideoState = !isVideoEnabled;
        console.log(`🎬 [handleCameraToggle] Toggling camera: ${isVideoEnabled} → ${newVideoState}`);

        try {
            // Request camera permission first time
            if (newVideoState && !cameraPermissionDenied) {
                console.log('🎬 [handleCameraToggle] Requesting camera permission...');
                try {
                    // Request permission with selected camera if available
                    const videoConstraints = svLiveKitService.selectedCamera 
                        ? { video: { deviceId: { exact: svLiveKitService.selectedCamera } } }
                        : { video: true };
                    console.log('🎬 [handleCameraToggle] Permission constraints:', videoConstraints);
                    
                    const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
                    console.log('🎬 [handleCameraToggle] Permission granted, stream:', {
                        id: stream.id,
                        active: stream.active,
                        tracks: stream.getTracks().length
                    });
                    
                    // Stop the test stream (LiveKit will request again)
                    stream.getTracks().forEach(track => {
                        console.log('🎬 [handleCameraToggle] Stopping test track:', track.id);
                        track.stop();
                    });
                } catch (permError) {
                    console.error('❌ [handleCameraToggle] Camera permission denied:', permError);
                    setCameraPermissionDenied(true);
                    alert('Моля разрешете достъп до камерата от настройките на браузъра.');
                    return;
                }
            }

            // Toggle camera directly on room (popup window has its own room instance)
            // We need to implement the same logic as svLiveKitService.toggleCamera but for this room
            console.log('🎬 [handleCameraToggle] Toggling camera directly on room...');
            console.log('🎬 [handleCameraToggle] Selected camera:', svLiveKitService.selectedCamera);
            console.log('🎬 [handleCameraToggle] Room state:', {
                hasRoom: !!roomRef.current,
                isConnected: isConnected,
                hasLocalParticipant: !!roomRef.current?.localParticipant
            });
            
            const success = await toggleCameraOnRoom(roomRef.current, newVideoState, svLiveKitService.selectedCamera);
            console.log('🎬 [handleCameraToggle] toggleCamera result:', success);

            if (success) {
                // Update state AFTER successful toggle
                console.log('🎬 [handleCameraToggle] toggleCamera succeeded, updating state...');
                setIsVideoEnabled(newVideoState);
                console.log('🎬 [handleCameraToggle] isVideoEnabled state updated to:', newVideoState);
                console.log('🎬 [handleCameraToggle] localVideoRef.current:', {
                    exists: !!localVideoRef.current,
                    tagName: localVideoRef.current?.tagName,
                    className: localVideoRef.current?.className,
                    id: localVideoRef.current?.id
                });

                // Attach local video preview when enabled
                if (newVideoState) {
                    console.log('🎬 [handleCameraToggle] Attempting to attach local video preview...');
                    
                    // Try to attach immediately if track is already published
                    if (roomRef.current && roomRef.current.localParticipant) {
                        const videoTracks = Array.from(roomRef.current.localParticipant.videoTrackPublications.values());
                        console.log('🎬 [handleCameraToggle] Found video track publications:', videoTracks.length);
                        
                        if (videoTracks.length > 0) {
                            const publication = videoTracks[0];
                            console.log('🎬 [handleCameraToggle] Publication details:', {
                                hasTrack: !!publication.track,
                                trackSid: publication.trackSid,
                                source: publication.source,
                                trackId: publication.track?.id,
                                trackKind: publication.track?.kind,
                                trackEnabled: publication.track?.isEnabled
                            });
                            
                            if (publication.track && localVideoRef.current) {
                                try {
                                    console.log('🎬 [handleCameraToggle] Attaching track to video element...');
                                    publication.track.attach(localVideoRef.current);
                                    console.log('✅ [handleCameraToggle] Local video preview attached immediately');
                                    console.log('🎬 [handleCameraToggle] Video element after attach:', {
                                        srcObject: !!localVideoRef.current.srcObject,
                                        videoWidth: localVideoRef.current.videoWidth,
                                        videoHeight: localVideoRef.current.videoHeight,
                                        readyState: localVideoRef.current.readyState
                                    });
                                } catch (attachError) {
                                    console.error('❌ [handleCameraToggle] Error attaching local video:', attachError);
                                    console.error('❌ [handleCameraToggle] Error details:', {
                                        name: attachError.name,
                                        message: attachError.message,
                                        stack: attachError.stack
                                    });
                                }
                            } else {
                                console.warn('⚠️ [handleCameraToggle] Missing track or localVideoRef:', {
                                    hasTrack: !!publication.track,
                                    hasRef: !!localVideoRef.current,
                                    trackId: publication.track?.id,
                                    refTagName: localVideoRef.current?.tagName
                                });
                            }
                        } else {
                            console.log('⏳ [handleCameraToggle] No video tracks yet, waiting for LocalTrackPublished event...');
                        }
                    } else {
                        console.warn('⚠️ [handleCameraToggle] Missing room or localParticipant:', {
                            hasRoom: !!roomRef.current,
                            hasLocalParticipant: !!roomRef.current?.localParticipant
                        });
                    }
                    
                    // Also try after a delay as fallback
                    setTimeout(() => {
                        console.log('🎬 [handleCameraToggle] Delayed fallback attempt (500ms)...');
                        if (roomRef.current && roomRef.current.localParticipant && localVideoRef.current) {
                            const videoTracks = Array.from(roomRef.current.localParticipant.videoTrackPublications.values());
                            console.log('🎬 [handleCameraToggle] Delayed check - video tracks:', videoTracks.length);
                            
                            if (videoTracks.length > 0) {
                                const publication = videoTracks[0];
                                if (publication.track) {
                                    try {
                                        console.log('🎬 [handleCameraToggle] Delayed attach attempt...');
                                        publication.track.attach(localVideoRef.current);
                                        console.log('✅ [handleCameraToggle] Local video preview attached (delayed fallback)');
                                    } catch (attachError) {
                                        console.error('❌ [handleCameraToggle] Error in delayed attach:', attachError);
                                    }
                                } else {
                                    console.warn('⚠️ [handleCameraToggle] Delayed check - publication has no track');
                                }
                            } else {
                                console.warn('⚠️ [handleCameraToggle] Delayed check - no video tracks found');
                            }
                        } else {
                            console.warn('⚠️ [handleCameraToggle] Delayed check - missing room/participant/ref');
                        }
                    }, 500);
                } else if (localVideoRef.current) {
                    // Clear local video preview
                    console.log('🎬 [handleCameraToggle] Clearing local video preview');
                    localVideoRef.current.srcObject = null;
                    console.log('🎬 [handleCameraToggle] Local video preview cleared');
                }

                // Notify via BroadcastChannel
                if (callChannelRef.current) {
                    callChannelRef.current.postMessage({
                        type: 'CAMERA_TOGGLED',
                        data: { enabled: newVideoState }
                    });
                }
            } else {
                console.log('🎬 [handleCameraToggle] toggleCamera failed, state NOT updated');
                // Don't update state if toggle failed - this prevents the "need to click twice" issue
                alert('Неуспешно включване/изключване на камерата. Моля опитайте отново.');
            }
        } catch (error) {
            const errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                location: 'handleCameraToggle'
            };
            
            console.error('❌ [handleCameraToggle] Failed to toggle camera:', error);
            console.error('❌ [handleCameraToggle] Error details:', errorDetails);
            
            // Don't update state on error - keep current state
            console.log('🎬 [handleCameraToggle] Error occurred, state NOT updated');
            
            // Send error to main window via BroadcastChannel
            if (callChannelRef.current) {
                try {
                    callChannelRef.current.postMessage({
                        type: 'CAMERA_ERROR',
                        data: errorDetails
                    });
                } catch (postError) {
                    console.error('Failed to send error via BroadcastChannel:', postError);
                }
            }
            
            // Also save to localStorage for debugging
            try {
                const existingErrors = JSON.parse(localStorage.getItem('svmessenger-camera-errors') || '[]');
                existingErrors.push(errorDetails);
                // Keep only last 10 errors
                if (existingErrors.length > 10) {
                    existingErrors.shift();
                }
                localStorage.setItem('svmessenger-camera-errors', JSON.stringify(existingErrors));
            } catch (storageError) {
                console.error('Failed to save error to localStorage:', storageError);
            }
            
            alert('Грешка при включване/изключване на камерата. Проверете конзолата за детайли.');
        }
    }, [isVideoEnabled, cameraPermissionDenied, isConnected, toggleCameraOnRoom]);

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
        // Prevent multiple calls to handleEndCall
        if (isDisconnectingRef.current) {
            console.log('📞 handleEndCall already in progress, ignoring');
            return;
        }
        
        isDisconnectingRef.current = true;
        console.log('📞 handleEndCall called');
        console.log('  - Current callState:', callState);
        console.log('  - Current isConnected:', isConnected);
        console.log('  - Conversation ID:', callData.conversationId);
        
        // Stop call sound
        if (callSoundRef.current) {
            callSoundRef.current.pause();
            callSoundRef.current.currentTime = 0;
            callSoundRef.current = null;
        }
        
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
    const handleMuteToggle = useCallback(async () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (roomRef.current && roomRef.current.isConnected) {
            try {
                // Get all audio track publications
                const audioPublications = Array.from(roomRef.current.localParticipant.audioTrackPublications.values());
                
                if (newMutedState) {
                    // Mute: disable all audio tracks
                    for (const publication of audioPublications) {
                        if (publication.track) {
                            publication.track.setEnabled(false);
                        }
                    }
                    // Also use LiveKit's method as fallback
                    await roomRef.current.localParticipant.setMicrophoneEnabled(false);
                    console.log('🔇 Microphone muted');
                } else {
                    // Unmute: enable all audio tracks
                    for (const publication of audioPublications) {
                        if (publication.track) {
                            publication.track.setEnabled(true);
                        }
                    }
                    // Also use LiveKit's method as fallback
                    await roomRef.current.localParticipant.setMicrophoneEnabled(true);
                    console.log('🔊 Microphone unmuted');
                }
            } catch (error) {
                console.error('❌ Error toggling microphone:', error);
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

    // Play call sound based on call state
    useEffect(() => {
        const playSound = async (soundPath) => {
            try {
                const audio = new Audio(soundPath);
                audio.loop = true;
                audio.volume = 0.7;
                
                // Preload audio
                audio.preload = 'auto';
                
                // Try to play immediately
                let playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    await playPromise;
                    callSoundRef.current = audio;
                    console.log('✅ Call sound started:', soundPath);
                }
            } catch (err) {
                console.warn('⚠️ Failed to play call sound (autoplay blocked?):', err);
                
                // For incoming calls, try to play after user interaction
                if (callState === 'incoming') {
                    // Create a one-time click handler to start the sound
                    const startSoundOnInteraction = async () => {
                        try {
                            const audio = new Audio(soundPath);
                            audio.loop = true;
                            audio.volume = 0.7;
                            await audio.play();
                            callSoundRef.current = audio;
                            console.log('✅ Call sound started after user interaction');
                            
                            // Remove listeners after first interaction
                            document.removeEventListener('click', startSoundOnInteraction);
                            document.removeEventListener('touchstart', startSoundOnInteraction);
                            window.removeEventListener('focus', startSoundOnInteraction);
                        } catch (e) {
                            console.error('❌ Failed to play sound even after interaction:', e);
                        }
                    };
                    
                    // Try multiple interaction types
                    document.addEventListener('click', startSoundOnInteraction, { once: true });
                    document.addEventListener('touchstart', startSoundOnInteraction, { once: true });
                    window.addEventListener('focus', startSoundOnInteraction, { once: true });
                    
                    // Also try when window gets focus
                    if (document.hasFocus()) {
                        setTimeout(() => startSoundOnInteraction(), 100);
                    }
                }
            }
        };

        if (callState === 'outgoing') {
            // Play outgoing call sound
            playSound('/svmessenger/sounds/OutCall.mp3');
        } else if (callState === 'incoming') {
            // Play incoming call sound
            // For incoming, also try to focus the window first
            if (window.focus) {
                window.focus();
            }
            playSound('/svmessenger/sounds/IncomingCall.mp3');
        } else if (callState === 'connected' && callSoundRef.current) {
            // Stop sound when connected
            callSoundRef.current.pause();
            callSoundRef.current.currentTime = 0;
            callSoundRef.current = null;
        } else if (callState === 'rejected' && callSoundRef.current) {
            // Stop sound when rejected
            callSoundRef.current.pause();
            callSoundRef.current.currentTime = 0;
            callSoundRef.current = null;
        }

        return () => {
            if (callSoundRef.current) {
                callSoundRef.current.pause();
                callSoundRef.current.currentTime = 0;
                callSoundRef.current = null;
            }
        };
    }, [callState]);

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

    // Attach local video track when isVideoEnabled changes and video element is available
    useEffect(() => {
        if (isVideoEnabled && localVideoRef.current && roomRef.current?.localParticipant) {
            console.log('🎬 [useEffect] isVideoEnabled changed, attempting to attach local video...');
            
            const videoTracks = Array.from(roomRef.current.localParticipant.videoTrackPublications.values());
            console.log('🎬 [useEffect] Found video track publications:', videoTracks.length);
            
            if (videoTracks.length > 0) {
                const publication = videoTracks[0];
                if (publication.track && localVideoRef.current) {
                    try {
                        console.log('🎬 [useEffect] Attaching local video track to element...');
                        publication.track.attach(localVideoRef.current);
                        console.log('✅ [useEffect] Local video preview attached');
                    } catch (attachError) {
                        console.error('❌ [useEffect] Error attaching local video:', attachError);
                    }
                } else {
                    console.warn('⚠️ [useEffect] Missing track or ref:', {
                        hasTrack: !!publication.track,
                        hasRef: !!localVideoRef.current
                    });
                }
            } else {
                console.log('⏳ [useEffect] No video tracks yet, will retry when track is published');
            }
        }
    }, [isVideoEnabled, isConnected]);

    // Initialize WebSocket connection for receiving CALL_END signals
    useEffect(() => {
        // Connect to WebSocket to receive call signals
        const handleCallSignal = (signal) => {
            if (signal.eventType === 'CALL_END') {
                console.log('📞 CALL_END received in popup:', signal);
                // Check if this CALL_END is for our call
                if (signal.conversationId === callData.conversationId) {
                    console.log('📞 CALL_END matches our call, showing rejection animation...');
                    // Show rejection animation and close after 3 seconds
                    setCallState('rejected');
                    // Stop call sound
                    if (callSoundRef.current) {
                        callSoundRef.current.pause();
                        callSoundRef.current.currentTime = 0;
                        callSoundRef.current = null;
                    }
                    // Close after 3 seconds
                    setTimeout(() => {
                        handleEndCall();
                    }, 3000);
                }
            } else if (signal.eventType === 'CALL_REJECT') {
                console.log('📞 CALL_REJECT received in popup:', signal);
                // Check if this CALL_REJECT is for our call
                if (signal.conversationId === callData.conversationId) {
                    console.log('📞 CALL_REJECT matches our call, showing rejection animation...');
                    // Show rejection animation and close after 3 seconds
                    setCallState('rejected');
                    // Stop call sound
                    if (callSoundRef.current) {
                        callSoundRef.current.pause();
                        callSoundRef.current.currentTime = 0;
                        callSoundRef.current = null;
                    }
                    // Close after 3 seconds
                    setTimeout(() => {
                        handleEndCall();
                    }, 3000);
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

    // Global error handler to catch all errors
    useEffect(() => {
        const handleError = (event) => {
            const errorDetails = {
                name: 'GlobalError',
                message: event.message || 'Unknown error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                location: 'global'
            };
            
            console.error('❌ [GlobalError] Uncaught error:', errorDetails);
            
            // Send to main window
            if (callChannelRef.current) {
                try {
                    callChannelRef.current.postMessage({
                        type: 'CAMERA_ERROR',
                        data: errorDetails
                    });
                } catch (postError) {
                    console.error('Failed to send global error:', postError);
                }
            }
            
            // Save to localStorage
            try {
                const existingErrors = JSON.parse(localStorage.getItem('svmessenger-camera-errors') || '[]');
                existingErrors.push(errorDetails);
                if (existingErrors.length > 10) {
                    existingErrors.shift();
                }
                localStorage.setItem('svmessenger-camera-errors', JSON.stringify(existingErrors));
            } catch (storageError) {
                console.error('Failed to save global error:', storageError);
            }
        };
        
        const handleUnhandledRejection = (event) => {
            const errorDetails = {
                name: 'UnhandledPromiseRejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                location: 'global'
            };
            
            console.error('❌ [GlobalError] Unhandled promise rejection:', errorDetails);
            
            // Send to main window
            if (callChannelRef.current) {
                try {
                    callChannelRef.current.postMessage({
                        type: 'CAMERA_ERROR',
                        data: errorDetails
                    });
                } catch (postError) {
                    console.error('Failed to send promise rejection error:', postError);
                }
            }
            
            // Save to localStorage
            try {
                const existingErrors = JSON.parse(localStorage.getItem('svmessenger-camera-errors') || '[]');
                existingErrors.push(errorDetails);
                if (existingErrors.length > 10) {
                    existingErrors.shift();
                }
                localStorage.setItem('svmessenger-camera-errors', JSON.stringify(existingErrors));
            } catch (storageError) {
                console.error('Failed to save promise rejection error:', storageError);
            }
        };
        
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // BroadcastChannel за синхронизация с основния сайт
    // Трябва да е след дефинирането на всички функции
    useEffect(() => {
        callChannelRef.current = new BroadcastChannel('svmessenger-call');
        
        callChannelRef.current.onmessage = (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'CALL_ENDED':
                    console.log('📞 CALL_ENDED received via BroadcastChannel');
                    // Show rejection animation and close after 3 seconds
                    setCallState('rejected');
                    // Stop call sound
                    if (callSoundRef.current) {
                        callSoundRef.current.pause();
                        callSoundRef.current.currentTime = 0;
                        callSoundRef.current = null;
                    }
                    // Close after 3 seconds
                    setTimeout(() => {
                        handleEndCall();
                    }, 3000);
                    break;
                case 'CALL_REJECTED':
                    console.log('📞 CALL_REJECTED received via BroadcastChannel');
                    // Show rejection animation and close after 3 seconds
                    setCallState('rejected');
                    // Stop call sound
                    if (callSoundRef.current) {
                        callSoundRef.current.pause();
                        callSoundRef.current.currentTime = 0;
                        callSoundRef.current = null;
                    }
                    // Close after 3 seconds
                    setTimeout(() => {
                        handleEndCall();
                    }, 3000);
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
            // Video props
            isVideoEnabled={isVideoEnabled}
            remoteVideoVisible={remoteVideoVisible}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            onCameraToggle={handleCameraToggle}
            cameraPermissionDenied={cameraPermissionDenied}
        />
    );
};

export default CallWindowApp;

