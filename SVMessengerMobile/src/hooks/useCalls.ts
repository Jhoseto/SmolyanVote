/**
 * useCalls Hook
 * Hook за управление на voice calls
 */

import { useCallback, useEffect, useState } from 'react';
import { useCallsStore } from '../store/callsStore';
import { useAuthStore } from '../store/authStore';
import { liveKitService } from '../services/calls/liveKitService';
import { soundService } from '../services/sounds/soundService';
import { callPermissionsService } from '../services/permissions/callPermissionsService';
import { CallState } from '../types/call';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import InCallManager from 'react-native-incall-manager';
import { logger } from '../utils/logger';

export const useCalls = () => {
  const {
    currentCall,
    callState,
    isMuted,
    isVideoCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    setCallState,
    toggleMute,
    clearCall,
  } = useCallsStore();

  // Speaker state (local to this hook)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  // Initialize LiveKit event listeners with proper cleanup
  useEffect(() => {
    // ✅ FIX: Register callbacks and store cleanup functions
    const cleanupConnected = liveKitService.onConnected(() => {
      setCallState(CallState.CONNECTED);
      // Stop outgoing call sound when connected
      soundService.stopOutgoingCallSound();
    });

    const cleanupDisconnected = liveKitService.onDisconnected(() => {
      endCall();
    });

    const cleanupParticipantConnected = liveKitService.onParticipantConnected(() => {
      // Participant joined
    });

    const cleanupParticipantDisconnected = liveKitService.onParticipantDisconnected(() => {
      // If no participants left, end call locally (don't send CALL_END signal)
      const participants = liveKitService.getParticipants();
      if (participants.length === 0) {
        // CRITICAL: Use endCall() from store, not handleEndCall()
        // handleEndCall() sends CALL_END signal, but this is already triggered by the other participant
        // We just need to update local state
        endCall();
      }
    });

    // ✅ FIX: Cleanup callbacks on unmount
    return () => {
      cleanupConnected?.();
      cleanupDisconnected?.();
      cleanupParticipantConnected?.();
      cleanupParticipantDisconnected?.();
    };
  }, [setCallState, endCall]);

  // Auto-enable camera for video calls
  useEffect(() => {
    const enableCameraForVideoCall = async () => {
      if (callState === CallState.CONNECTED && isVideoCall && !liveKitService.isCameraEnabled()) {
        try {
          const hasCameraPermission = await callPermissionsService.requestCameraPermission();
          if (hasCameraPermission) {
            // Add small delay to ensure room is fully ready
            await new Promise(resolve => setTimeout(resolve, 300));
            await liveKitService.toggleCamera(true);
          }
        } catch (error) {
          logger.error('❌ [useCalls] Error enabling camera:', error);
        }
      }
    };

    // Add delay to ensure connection is fully established
    if (callState === CallState.CONNECTED) {
      const timeoutId = setTimeout(enableCameraForVideoCall, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [callState, isVideoCall]);

  // Start outgoing call
  const handleStartCall = useCallback(
    async (conversationId: number, participantId: number, participantName: string, participantImageUrl?: string, initialState?: CallState, isVideo?: boolean) => {
      try {
        const { user } = useAuthStore.getState();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Request microphone permission before starting call
        const hasAudioPermission = await callPermissionsService.requestMicrophonePermission();
        if (!hasAudioPermission) {
          logger.error('❌ Microphone permission denied, cannot start call');
          clearCall();
          return;
        }

        // Request camera permission for video calls
        if (isVideo) {
          const hasCameraPermission = await callPermissionsService.requestCameraPermission();
          if (!hasCameraPermission) {
            logger.error('❌ Camera permission denied, cannot start video call');
            clearCall();
            return;
          }
        }

        // Generate call token
        const { token, roomName, serverUrl } = await liveKitService.generateCallToken(conversationId, participantId);

        // Start call in store with video flag
        startCall(conversationId, participantId, participantName, participantImageUrl, initialState, isVideo);

        // Play outgoing call sound
        soundService.playOutgoingCallSound();

        // Send call signal via WebSocket
        if (svMobileWebSocketService.isConnected()) {
          svMobileWebSocketService.sendCallSignal({
            eventType: 'CALL_REQUEST',
            conversationId,
            callerId: user.id,
            receiverId: participantId,
            roomName,
            isVideo: isVideo || false,
          });
        }

        // Connect to LiveKit room
        await liveKitService.connect(token, roomName, serverUrl);
        // Note: outgoing call sound will be stopped in onConnected callback
        // Camera will be enabled automatically in useEffect when callState becomes CONNECTED
      } catch (error) {
        logger.error('Error starting call:', error);
        clearCall();
      }
    },
    [startCall, clearCall]
  );

  // Answer incoming call
  // CRITICAL FIX: Read currentCall from store inside the function to avoid stale closure issues
  // This ensures that even if currentCall is initialized after the callback is created,
  // the function will still access the latest value from the store
  const handleAnswerCall = useCallback(async () => {
    // Read currentCall from store to get latest value (not from closure)
    const latestCurrentCall = useCallsStore.getState().currentCall;
    if (!latestCurrentCall) {
      return;
    }

    try {
      // Request microphone permission before answering call
      const hasAudioPermission = await callPermissionsService.requestMicrophonePermission();
      if (!hasAudioPermission) {
        logger.error('❌ Microphone permission denied, cannot answer call');
        clearCall();
        return;
      }

      // Stop incoming call sound when answering
      soundService.stopIncomingCallSound();
      answerCall();

      // Generate call token
      let token: string;
      let roomName: string;
      let serverUrl: string;

      try {
        const tokenResponse = await liveKitService.generateCallToken(
          latestCurrentCall.conversationId,
          latestCurrentCall.participantId
        );
        token = tokenResponse.token;
        roomName = tokenResponse.roomName;
        serverUrl = tokenResponse.serverUrl;
      } catch (tokenError: any) {
        logger.error('❌ [useCalls] Error generating call token:', {
          error: tokenError,
          message: tokenError?.message,
          response: tokenError?.response?.data,
          status: tokenError?.response?.status,
        });
        throw tokenError;
      }

      // Send answer signal via WebSocket
      const { user } = useAuthStore.getState();
      if (svMobileWebSocketService.isConnected() && user) {
        svMobileWebSocketService.sendCallSignal({
          eventType: 'CALL_ACCEPT', // ✅ Съответства на backend enum SVCallEventType.CALL_ACCEPT
          conversationId: latestCurrentCall.conversationId,
          callerId: latestCurrentCall.participantId,
          receiverId: user.id,
          roomName,
        });
      }

      // Connect to LiveKit room
      await liveKitService.connect(token, roomName, serverUrl);
    } catch (error: any) {
      logger.error('❌ [useCalls] Error answering call:', {
        error,
        message: error?.message,
        stack: error?.stack,
        currentCall: latestCurrentCall,
      });
      clearCall();
    }
  }, [answerCall, clearCall]); // Removed currentCall from dependencies since we read it from store

  // Reject call
  // CRITICAL FIX: Read currentCall from store inside the function to avoid stale closure issues
  // This ensures that even if currentCall is initialized after the callback is created,
  // the function will still access the latest value from the store
  const handleRejectCall = useCallback(() => {
    // Read currentCall from store to get latest value (not from closure)
    const latestCurrentCall = useCallsStore.getState().currentCall;
    const { user } = useAuthStore.getState();
    if (latestCurrentCall && svMobileWebSocketService.isConnected() && user) {
      // CRITICAL FIX: For incoming calls, current user is the receiver
      // participantId is the caller (the one who initiated the call)
      const callerId = latestCurrentCall.participantId; // The one who called
      const receiverId = user.id; // Current user is rejecting

      // CRITICAL: Get startTime from currentCall (when call was received)
      // For rejected calls, endTime is same as startTime (no conversation happened)
      const startTime = latestCurrentCall.startTime
        ? latestCurrentCall.startTime.toISOString()
        : new Date().toISOString(); // Fallback to now if startTime not set
      const endTime = startTime; // Same as startTime for rejected calls

      // Send reject signal via WebSocket with call history data
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_REJECT', // ✅ Съответства на backend enum SVCallEventType.CALL_REJECT
        conversationId: latestCurrentCall.conversationId,
        callerId: callerId,
        receiverId: receiverId,
        startTime: startTime,
        endTime: endTime,
        isVideoCall: false, // Default to false for now
      });
    }

    // Stop incoming call sound when rejecting
    soundService.stopIncomingCallSound();
    rejectCall();
    liveKitService.disconnect();
  }, [rejectCall]); // Removed currentCall from dependencies since we read it from store

  // End call
  // CRITICAL FIX: Read currentCall from store inside the function to avoid stale closure issues
  // This ensures that even if currentCall is initialized after the callback is created,
  // the function will still access the latest value from the store
  const handleEndCall = useCallback(() => {
    // Read currentCall and callState from store to get latest value (not from closure)
    const { currentCall: latestCurrentCall, isVideoCall } = useCallsStore.getState();
    const { user } = useAuthStore.getState();
    if (latestCurrentCall && svMobileWebSocketService.isConnected() && user) {
      // CRITICAL FIX: Determine caller and receiver based on isOutgoing flag
      // If isOutgoing is true, current user is the caller
      // If isOutgoing is false/undefined, current user is the receiver (incoming call)
      const isOutgoingCall = latestCurrentCall.isOutgoing === true;

      const callerId = isOutgoingCall ? user.id : latestCurrentCall.participantId;
      const receiverId = isOutgoingCall ? latestCurrentCall.participantId : user.id;

      // CRITICAL: Get startTime and endTime from currentCall
      // startTime should be set when call becomes CONNECTED
      // endTime should be set when call ends (in endCall() method)
      // CRITICAL FIX: If startTime is not set, the call was never connected, so duration should be 0
      // But we still need valid timestamps for database
      const now = new Date();
      const startTime = latestCurrentCall.startTime
        ? latestCurrentCall.startTime.toISOString()
        : now.toISOString(); // Fallback to now if startTime not set (call was never connected)
      // CRITICAL: endTime should be set in endCall() method, but if not, use now()
      // This ensures accurate duration calculation
      const endTime = latestCurrentCall.endTime
        ? latestCurrentCall.endTime.toISOString()
        : now.toISOString(); // Use now() as fallback to ensure we have an endTime

      // CRITICAL: Log warning if startTime is not set (call was never connected)
      if (!latestCurrentCall.startTime) {
      }

      // CRITICAL: Log call history data before sending
      const durationSeconds = latestCurrentCall.startTime && latestCurrentCall.endTime
        ? Math.floor((latestCurrentCall.endTime.getTime() - latestCurrentCall.startTime.getTime()) / 1000)
        : null;
      logger.debug('📞 [handleEndCall] Sending CALL_END signal:', {
        conversationId: latestCurrentCall.conversationId,
        callerId,
        receiverId,
        startTime,
        endTime,
        durationSeconds,
        isVideoCall,
      });

      // Send end signal via WebSocket with call history data
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_END', // ✅ Съответства на backend enum SVCallEventType.CALL_END
        conversationId: latestCurrentCall.conversationId,
        callerId: callerId,
        receiverId: receiverId,
        startTime: startTime,
        endTime: endTime,
        isVideoCall: isVideoCall,
        wasConnected: callState === CallState.CONNECTED // CRITICAL: Send explicit connection status
      });
    }

    // Stop all call sounds when ending call
    soundService.stopIncomingCallSound();
    soundService.stopOutgoingCallSound();
    liveKitService.disconnect();
    endCall();
  }, [endCall]); // Removed currentCall from dependencies since we read it from store

  // Toggle mute
  const handleToggleMute = useCallback(async () => {
    const newMuteState = await liveKitService.toggleMute();
    toggleMute();
    return newMuteState;
  }, [toggleMute]);

  // Toggle camera
  const handleToggleCamera = useCallback(async () => {
    if (callState !== CallState.CONNECTED) return false;

    const currentVideoState = liveKitService.isCameraEnabled();
    const wantsToEnable = !currentVideoState;

    // If trying to enable camera, request permission first
    if (wantsToEnable) {
      const hasCameraPermission = await callPermissionsService.requestCameraPermission();
      if (!hasCameraPermission) {
        logger.error('❌ Camera permission denied, cannot enable camera');
        return false;
      }
    }

    const newVideoState = await liveKitService.toggleCamera(wantsToEnable);
    return newVideoState;
  }, [callState]);

  // Get video enabled state
  const getIsVideoEnabled = useCallback(() => {
    return liveKitService.isCameraEnabled();
  }, []);

  // Flip camera (front/back)
  const handleFlipCamera = useCallback(async () => {
    if (callState !== CallState.CONNECTED || !liveKitService.isCameraEnabled()) {
      return false;
    }

    const success = await liveKitService.flipCamera();
    return success;
  }, [callState]);

  // Toggle speaker
  const handleToggleSpeaker = useCallback(() => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    InCallManager.setSpeakerphoneOn(newSpeakerState);
  }, [isSpeakerOn]);

  return {
    currentCall,
    callState,
    isMuted,
    isSpeakerOn,
    isVideoEnabled: getIsVideoEnabled(),
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

