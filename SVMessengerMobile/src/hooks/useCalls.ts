/**
 * Calls Hook - Business Logic Orchestration
 * REFACTORED: Clean orchestration between Store, LiveKit, WebSocket
 * Senior-level: Proper error handling, cleanup sequences, defensive programming
 */

import { useCallback, useEffect } from 'react';
import { useCallsStore } from '../store/callsStore';
import { liveKitService } from '../services/calls/liveKitService';
import { soundService } from '../services/sounds/soundService';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { callPermissionsService } from '../services/permissions/callPermissionsService';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';
import InCallManager from 'react-native-incall-manager';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';

/**
 * Main calls hook - coordinates all call functionality
 */
export const useCalls = () => {
  const {
    currentCall,
    isRinging,
    isDialing,
    isConnected,
    isEnding,
    isMuted,
    isSpeakerOn,
    isVideoEnabled,
    setOutgoingCall,
    setConnected,
    setEnding,
    clearCall,
    setCallStartTime,
    setCallEndTime,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    setVideoEnabled,
  } = useCallsStore();

  const { user } = useAuthStore();

  /**
   * LiveKit event handlers
   * Clean separation: Events → Actions
   */
  // useEffect moved to bottom to fix "use before declaration" errors

  /**
   * Auto-enable camera for video calls
   */
  useEffect(() => {
    if (isConnected && currentCall?.isVideoCall && !isVideoEnabled) {
      handleToggleCamera();
    }
  }, [isConnected, currentCall?.isVideoCall]);

  /**
   * Mute/unmute audio
   */
  useEffect(() => {
    if (isConnected) {
      liveKitService.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, isConnected]);

  /**
   * Speaker on/off
   */
  useEffect(() => {
    if (isConnected) {
      InCallManager.setSpeakerphoneOn(isSpeakerOn);
    }
  }, [isSpeakerOn, isConnected]);

  /**
   * Start outgoing call
   */
  const handleStartCall = useCallback(
    async (
      participantId: number,
      participantName: string,
      participantImageUrl?: string,
      isVideo: boolean = false,
      existingConversationId?: number // OPTIONAL: Skip backend lookup if we already know the ID
    ) => {
      try {
        // Validation
        if (!user) {
          logger.error('❌ Cannot start call - no user');
          return;
        }

        if (currentCall || isRinging || isDialing || isConnected) {
          logger.warn('⚠️ Already in a call');
          return;
        }

        // Request permissions
        const hasAudioPermission = await callPermissionsService.requestMicrophonePermission();
        if (!hasAudioPermission) {
          logger.error('❌ Microphone permission denied');
          return;
        }

        if (isVideo) {
          const hasCameraPermission = await callPermissionsService.requestCameraPermission();
          if (!hasCameraPermission) {
            logger.error('❌ Camera permission denied');
            // Continue as audio-only
            isVideo = false;
          }
        }

        // Get conversation ID
        // CRITICAL OPTIMIZATION: Use existing ID if provided to bypass backend call
        let conversationId = existingConversationId;

        if (!conversationId) {
          logger.debug('🔍 [useCalls] No existing ID provided, fetching from backend...');
          const fetchedId = await getOrCreateConversation(participantId);
          if (fetchedId) {
            conversationId = fetchedId;
          }
        }

        if (!conversationId) {
          logger.error('❌ Failed to get conversation ID');
          // Show error to user?
          return;
        }

        logger.debug(`✅ [useCalls] Starting call with Conversation ID: ${conversationId}`);

        // Generate LiveKit token
        const tokenResponse = await liveKitService.generateCallToken(conversationId, participantId);

        // Set outgoing call state
        setOutgoingCall({
          conversationId,
          participant: {
            id: participantId,
            name: participantName,
            imageUrl: participantImageUrl,
          },
          roomName: tokenResponse.roomName,
          token: tokenResponse.token,
          serverUrl: tokenResponse.serverUrl,
          isVideoCall: isVideo,
          isOutgoing: true,
        });

        // Start dialing sound
        soundService.playOutgoingCallSound();

        // Send CALL_REQUEST via WebSocket
        svMobileWebSocketService.sendCallSignal({
          eventType: 'CALL_REQUEST',
          conversationId,
          callerId: user.id,
          receiverId: participantId,
          roomName: tokenResponse.roomName,
          callerName: user.fullName || user.username,
          callerAvatar: user.imageUrl,
          isVideoCall: isVideo,
        });

        // Connect to LiveKit
        await liveKitService.connect(tokenResponse.token, tokenResponse.roomName, tokenResponse.serverUrl);

        logger.debug('✅ [useCalls] Outgoing call started');
      } catch (error) {
        logger.error('❌ Error starting call:', error);
        performCleanup('Error starting call');
      }
    },
    [user, currentCall, isRinging, isDialing, isConnected, setOutgoingCall]
  );

  /**
   * Answer incoming call
   */
  const handleAnswerCall = useCallback(async () => {
    try {
      if (!currentCall || !isRinging) {
        logger.warn('⚠️ Cannot answer - no incoming call');
        return;
      }

      // Request permissions
      const hasAudioPermission = await callPermissionsService.requestMicrophonePermission();
      if (!hasAudioPermission) {
        logger.error('❌ Microphone permission denied');
        handleRejectCall();
        return;
      }

      if (currentCall.isVideoCall) {
        const hasCameraPermission = await callPermissionsService.requestCameraPermission();
        if (!hasCameraPermission) {
          logger.warn('⚠️ Camera permission denied - continuing as audio');
        }
      }

      // Stop ringing sound
      soundService.stopIncomingCallSound();

      // Generate token
      const tokenResponse = await liveKitService.generateCallToken(
        currentCall.conversationId,
        currentCall.participant.id
      );

      // Send CALL_ACCEPT signal
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_ACCEPT',
        conversationId: currentCall.conversationId,
        callerId: currentCall.participant.id,
        receiverId: user!.id,
        roomName: tokenResponse.roomName,
      });

      // Connect to LiveKit
      await liveKitService.connect(tokenResponse.token, tokenResponse.roomName, tokenResponse.serverUrl);

      logger.debug('✅ [useCalls] Call answered');
    } catch (error) {
      logger.error('❌ Error answering call:', error);
      performCleanup('Error answering call');
    }
  }, [currentCall, isRinging, user]);

  /**
   * Reject incoming call
   */
  const handleRejectCall = useCallback(() => {
    if (!currentCall || !isRinging) {
      logger.warn('⚠️ Cannot reject - no incoming call');
      return;
    }

    logger.debug('📞 [useCalls] Rejecting call');

    // Stop ringing
    soundService.stopIncomingCallSound();

    // Send CALL_REJECT signal
    const rejectTime = new Date().toISOString();
    svMobileWebSocketService.sendCallSignal({
      eventType: 'CALL_REJECT',
      conversationId: currentCall.conversationId,
      callerId: currentCall.participant.id,
      receiverId: user!.id,
      startTime: currentCall.startTime ? currentCall.startTime.toISOString() : rejectTime,
      endTime: rejectTime,
    });

    // Clear call
    clearCall();
  }, [currentCall, isRinging, user, clearCall]);

  /**
   * End active call or cancel outgoing call
   */
  const handleEndCall = useCallback(() => {
    if (!currentCall) {
      logger.warn('⚠️ Cannot end - no active call');
      return;
    }

    logger.debug('📞 [useCalls] Ending call');

    // Set end time
    setCallEndTime();

    // Determine signal type based on state
    let eventType: 'CALL_CANCEL' | 'CALL_END' = 'CALL_END';

    logger.debug('🛑 [useCalls] handleEndCall - Determining signal type', {
      isDialing,
      isConnected,
      isRinging,
      hasEverConnected: liveKitService.hasParticipantEverConnected()
    });

    // CRITICAL: Aggressive check for cancellation
    // If outgoing and no remote participant connected, OR duration is near zero, treat as CANCEL
    const hasRemoteParticipant = liveKitService.hasParticipantEverConnected();
    const durationIsMinimal = !currentCall.startTime || (new Date().getTime() - currentCall.startTime.getTime() < 2000);

    /* REVERTED based on user feedback to mimic Web behavior (which sends CALL_END)
    if (currentCall.isOutgoing && (!hasRemoteParticipant || durationIsMinimal)) {
      // Outgoing call not yet answered (or connected but no remote participant) - send CANCEL
      eventType = 'CALL_CANCEL';
      logger.debug('🛑 [useCalls] Force CALL_CANCEL (No participant or minimal duration)');
    }
    */

    // Calculate duration
    const durationSeconds =
      currentCall.startTime && currentCall.endTime
        ? Math.floor((currentCall.endTime.getTime() - currentCall.startTime.getTime()) / 1000)
        : null;

    const wasConnected = liveKitService.hasParticipantEverConnected() || (durationSeconds !== null && durationSeconds > 0);

    // Send signal
    svMobileWebSocketService.sendCallSignal({
      eventType,
      conversationId: currentCall.conversationId,
      callerId: currentCall.isOutgoing ? user!.id : currentCall.participant.id,
      receiverId: currentCall.isOutgoing ? currentCall.participant.id : user!.id,
      startTime: currentCall.startTime?.toISOString() || new Date().toISOString(),
      endTime: currentCall.endTime?.toISOString() || new Date().toISOString(),
      isVideoCall: currentCall.isVideoCall,
      wasConnected,
    });

    logger.debug(`📞 [useCalls] Sent ${eventType} signal`, {
      wasConnected,
      durationSeconds,
      startTime: currentCall.startTime?.toISOString(),
      endTime: currentCall.endTime?.toISOString()
    });

    // Perform cleanup
    performCleanup('User ended call');
  }, [currentCall, isDialing, isConnected, user, setCallEndTime]);

  /**
   * Handle remote party hanging up
   */
  const handleRemoteHangup = useCallback(() => {
    logger.debug('📞 [useCalls] Remote party hung up');

    // Mark as ending
    setEnding();

    // Stop sounds
    soundService.stopOutgoingCallSound();
    soundService.stopIncomingCallSound();

    // Perform cleanup
    setTimeout(() => {
      performCleanup('Remote hangup');
    }, 500);
  }, [setEnding]);

  /**
   * Cleanup sequence - stops everything
   */
  const performCleanup = useCallback((reason: string = 'Unknown') => {
    logger.debug(`🧹 [useCalls] Performing cleanup. Reason: ${reason}`);

    // Stop all sounds
    soundService.stopOutgoingCallSound();
    soundService.stopIncomingCallSound();

    // Disconnect LiveKit
    liveKitService.disconnect();
    liveKitService.resetConnectionTracking();

    // Clear call state
    clearCall();
  }, [clearCall]);

  /**
   * Toggle microphone mute
   */
  const handleToggleMute = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  /**
   * Toggle speaker
   */
  const handleToggleSpeaker = useCallback(() => {
    toggleSpeaker();
  }, [toggleSpeaker]);

  /**
   * Toggle camera
   */
  const handleToggleCamera = useCallback(async () => {
    if (!isConnected) return false;

    try {
      if (!isVideoEnabled) {
        // Enabling camera
        const hasPermission = await callPermissionsService.requestCameraPermission();
        if (!hasPermission) {
          logger.error('❌ Camera permission denied');
          return false;
        }

        const success = await liveKitService.toggleCamera(true);
        if (success) {
          setVideoEnabled(true);
        }
        return success;
      } else {
        // Disabling camera
        await liveKitService.toggleCamera(false);
        setVideoEnabled(false);
        return true;
      }
    } catch (error) {
      logger.error('❌ Error toggling camera:', error);
      return false;
    }
  }, [isConnected, isVideoEnabled, setVideoEnabled]);

  /**
   * Flip camera (front/back)
   */
  const handleFlipCamera = useCallback(async () => {
    if (!isConnected || !isVideoEnabled) return false;

    try {
      const success = await liveKitService.flipCamera();
      return success;
    } catch (error) {
      logger.error('❌ Error flipping camera:', error);
      return false;
    }
  }, [isConnected, isVideoEnabled]);

  /**
   * LiveKit event handlers
   * Moved here to avoid "use before declaration" errors with handlers
   */
  useEffect(() => {
    const cleanupParticipantConnected = liveKitService.onParticipantConnected(() => {
      logger.debug('✅ [useCalls] Participant connected');

      // Stop call sounds
      soundService.stopOutgoingCallSound();
      soundService.stopIncomingCallSound();

      // Mark as connected
      setConnected();

      // Set start time
      setCallStartTime();
    });

    // CRITICAL FIX: Handle local connection success
    const cleanupConnected = liveKitService.onConnected(() => {
      logger.debug('✅ [useCalls] Local user connected to room');

      // Determine if we should transition to "Connected" state
      // 1. If we are dialing (outgoing), we ONLY connect if there are ALREADY participants (re-joining)
      //    Otherwise, we wait for 'onParticipantConnected'
      // 2. If we are NOT dialing (answering/incoming), we connect immediately

      // Check for existing participants
      const hasParticipants = liveKitService.getParticipants().length > 0;

      if (isDialing && !hasParticipants) {
        logger.debug('⏳ [useCalls] Connected to room but waiting for remote participant (Outgoing Call)');
        // DO NOT set connected yet - stay in OutgoingCallScreen
      } else {
        logger.debug('✅ [useCalls] Marking as connected immediately (Incoming Call or Participants exist)');
        // Mark as connected
        setConnected();
        // CRITICAL: Set start time when we connect, to ensure duration is calculated
        setCallStartTime();
      }
    });

    const cleanupParticipantDisconnected = liveKitService.onParticipantDisconnected(() => {
      // Check if any participants remain
      const participants = liveKitService.getParticipants();
      logger.debug(`⚠️ [useCalls] Participant disconnected. Remaining: ${participants.length}. IsEnding: ${isEnding}`);

      if (participants.length === 0 && !isEnding) {
        // Other party hung up
        handleRemoteHangup();
      }
    });

    const cleanupDisconnected = liveKitService.onDisconnected(() => {
      logger.debug('📞 [useCalls] LiveKit disconnected');

      // If not already ending, trigger cleanup
      if (!isEnding) {
        performCleanup('LiveKit Disconnected event');
      }
    });

    return () => {
      cleanupParticipantConnected?.();
      cleanupConnected?.(); // Added cleanup
      cleanupParticipantDisconnected?.();
      cleanupDisconnected?.();
    };
  }, [isEnding, setConnected, setCallStartTime, isDialing, handleRemoteHangup, performCleanup]);

  /**
   * Helper: Get or create conversation via backend API
   */
  const getOrCreateConversation = useCallback(async (participantId: number): Promise<number | null> => {
    try {
      logger.debug(`🔍 [useCalls] Getting/creating conversation for user ${participantId}`);

      try {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSENGER.START_CONVERSATION, {
          otherUserId: participantId,
        });

        if (response.data && response.data.id) {
          logger.debug(`✅ [useCalls] Conversation found/created: ${response.data.id}`);
          return response.data.id;
        }
      } catch (error: any) {
        // Fallback strategy for 500 errors (if backend is unstable but conversation might exist)
        if (error.response?.status === 500 || error.message.includes('500')) {
          logger.warn('⚠️ [useCalls] Backend 500 error on start. Trying fallback: Linear search in conversations.');

          try {
            // Fetch all conversations
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.MESSENGER.CONVERSATIONS);
            const conversations = response.data || [];

            logger.debug(`⚠️ [useCalls] Fallback: Searching in ${conversations.length} conversations for ID ${participantId}`);

            // Find conversation with this participant
            const found = conversations.find((c: any) =>
              (c.participantId === participantId) ||
              (c.participant && c.participant.id === participantId) ||
              (c.user1Id === participantId) ||
              (c.user2Id === participantId && c.user1Id === user?.id) ||
              (c.user1Id === user?.id && c.user2Id === participantId)
            );

            if (found && found.id) {
              logger.debug(`✅ [useCalls] Fallback successful! Found conversation ID: ${found.id}`);
              return found.id;
            } else {
              logger.warn(`❌ [useCalls] Fallback failed: User ${participantId} not found in local conversations list.`);
            }
          } catch (fallbackError) {
            logger.error('❌ [useCalls] Fallback search failed (API error):', fallbackError);
          }
        }

        throw error; // Re-throw if not 500 or fallback failed
      }

      logger.error('❌ [useCalls] Invalid response from start conversation API');
      return null;
    } catch (error) {
      logger.error('❌ [useCalls] Error getting/creating conversation:', error);
      return null;
    }
  }, [user]);

  // Return clean API
  return {
    // State
    currentCall,
    isRinging,
    isDialing,
    isConnected,
    isEnding,
    isMuted,
    isSpeakerOn,
    isVideoEnabled,

    // Actions
    startCall: handleStartCall,
    answerCall: handleAnswerCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    toggleMute: handleToggleMute,
    toggleSpeaker: handleToggleSpeaker,
    toggleCamera: handleToggleCamera,
    flipCamera: handleFlipCamera,
  };
};
