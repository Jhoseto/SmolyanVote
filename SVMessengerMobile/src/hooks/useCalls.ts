/**
 * useCalls Hook
 * Hook за управление на voice calls
 */

import { useCallback, useEffect } from 'react';
import { useCallsStore } from '../store/callsStore';
import { useAuthStore } from '../store/authStore';
import { liveKitService } from '../services/calls/liveKitService';
import { soundService } from '../services/sounds/soundService';
import { callPermissionsService } from '../services/permissions/callPermissionsService';
import { CallState } from '../types/call';
import { svMobileWebSocketService } from '../services/websocket/stompClient';

export const useCalls = () => {
  const {
    currentCall,
    callState,
    isMuted,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    setCallState,
    toggleMute,
    clearCall,
  } = useCallsStore();

  // Initialize LiveKit event listeners
  useEffect(() => {
    liveKitService.onConnected(() => {
      setCallState(CallState.CONNECTED);
      // Stop outgoing call sound when connected
      soundService.stopOutgoingCallSound().catch(err => console.error('Error stopping outgoing call sound:', err));
    });

    liveKitService.onDisconnected(() => {
      endCall();
    });

    liveKitService.onParticipantConnected(() => {
      console.log('Participant joined the call');
    });

    liveKitService.onParticipantDisconnected(() => {
      console.log('Participant left the call');
      // If no participants left, end call
      const participants = liveKitService.getParticipants();
      if (participants.length === 0) {
        endCall();
      }
    });
  }, [setCallState, endCall]);

  // Start outgoing call
  const handleStartCall = useCallback(
    async (conversationId: number, participantId: number, participantName: string) => {
      try {
        const { user } = useAuthStore.getState();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Request microphone permission before starting call
        const hasAudioPermission = await callPermissionsService.requestMicrophonePermission();
        if (!hasAudioPermission) {
          console.error('❌ Microphone permission denied, cannot start call');
          clearCall();
          return;
        }

        // Generate call token
        const { token, roomName, serverUrl } = await liveKitService.generateCallToken(conversationId, participantId);

        // Start call in store (will be updated with imageUrl if available)
        startCall(conversationId, participantId, participantName);

        // Play outgoing call sound
        soundService.playOutgoingCallSound().catch(err => console.error('Error playing outgoing call sound:', err));

        // Send call signal via WebSocket
        if (svMobileWebSocketService.isConnected()) {
          svMobileWebSocketService.sendCallSignal({
            eventType: 'CALL_REQUEST',
            conversationId,
            callerId: user.id,
            receiverId: participantId,
            roomName,
          });
        }

        // Connect to LiveKit room
        await liveKitService.connect(token, roomName, serverUrl);
        // Note: outgoing call sound will be stopped in onConnected callback
      } catch (error) {
        console.error('Error starting call:', error);
        clearCall();
      }
    },
    [startCall, clearCall]
  );

  // Answer incoming call
  const handleAnswerCall = useCallback(async () => {
    if (!currentCall) return;

    try {
      // Request microphone permission before answering call
      const hasAudioPermission = await callPermissionsService.requestMicrophonePermission();
      if (!hasAudioPermission) {
        console.error('❌ Microphone permission denied, cannot answer call');
        clearCall();
        return;
      }

      // Stop incoming call sound when answering
      soundService.stopIncomingCallSound();
      answerCall();

      // Generate call token
      console.log('📞 [useCalls] Generating call token for answer:', {
        conversationId: currentCall.conversationId,
        participantId: currentCall.participantId,
      });
      
      let token: string;
      let roomName: string;
      let serverUrl: string;
      
      try {
        const tokenResponse = await liveKitService.generateCallToken(
          currentCall.conversationId,
          currentCall.participantId
        );
        token = tokenResponse.token;
        roomName = tokenResponse.roomName;
        serverUrl = tokenResponse.serverUrl;
        
        console.log('📞 [useCalls] Call token received:', {
          roomName,
          serverUrl,
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });
      } catch (tokenError: any) {
        console.error('❌ [useCalls] Error generating call token:', {
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
          conversationId: currentCall.conversationId,
          callerId: currentCall.participantId,
          receiverId: user.id,
          roomName,
        });
      }

      // Connect to LiveKit room
      console.log('📞 [useCalls] Connecting to LiveKit room...');
      await liveKitService.connect(token, roomName, serverUrl);
      console.log('✅ [useCalls] Successfully connected to LiveKit room');
    } catch (error: any) {
      console.error('❌ [useCalls] Error answering call:', {
        error,
        message: error?.message,
        stack: error?.stack,
        currentCall,
      });
      clearCall();
    }
  }, [currentCall, answerCall, clearCall]);

  // Reject call
  const handleRejectCall = useCallback(() => {
    const { user } = useAuthStore.getState();
    if (currentCall && svMobileWebSocketService.isConnected() && user) {
      // Send reject signal via WebSocket
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_REJECT', // ✅ Съответства на backend enum SVCallEventType.CALL_REJECT
        conversationId: currentCall.conversationId,
        callerId: currentCall.participantId,
        receiverId: user.id,
      });
    }

    // Stop incoming call sound when rejecting
    soundService.stopIncomingCallSound();
    rejectCall();
    liveKitService.disconnect();
  }, [currentCall, rejectCall]);

  // End call
  const handleEndCall = useCallback(() => {
    const { user } = useAuthStore.getState();
    if (currentCall && svMobileWebSocketService.isConnected() && user) {
      // Send end signal via WebSocket
      svMobileWebSocketService.sendCallSignal({
        eventType: 'CALL_END', // ✅ Съответства на backend enum SVCallEventType.CALL_END
        conversationId: currentCall.conversationId,
        callerId: currentCall.participantId,
        receiverId: user.id,
      });
    }

    // Stop all call sounds when ending call
    soundService.stopIncomingCallSound();
    soundService.stopOutgoingCallSound();
    liveKitService.disconnect();
    endCall();
  }, [currentCall, endCall]);

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
        console.error('❌ Camera permission denied, cannot enable camera');
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

  return {
    currentCall,
    callState,
    isMuted,
    isVideoEnabled: getIsVideoEnabled(),
    startCall: handleStartCall,
    answerCall: handleAnswerCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    toggleMute: handleToggleMute,
    toggleCamera: handleToggleCamera,
  };
};

