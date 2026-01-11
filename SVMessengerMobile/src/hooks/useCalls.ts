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
      // If no participants left, end call
      const participants = liveKitService.getParticipants();
      if (participants.length === 0) {
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
      // Send reject signal via WebSocket
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_REJECT', // ✅ Съответства на backend enum SVCallEventType.CALL_REJECT
        conversationId: latestCurrentCall.conversationId,
        callerId: latestCurrentCall.participantId,
        receiverId: user.id,
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
    // Read currentCall from store to get latest value (not from closure)
    const latestCurrentCall = useCallsStore.getState().currentCall;
    const { user } = useAuthStore.getState();
    if (latestCurrentCall && svMobileWebSocketService.isConnected() && user) {
      // Send end signal via WebSocket
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_END', // ✅ Съответства на backend enum SVCallEventType.CALL_END
        conversationId: latestCurrentCall.conversationId,
        callerId: latestCurrentCall.participantId,
        receiverId: user.id,
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

