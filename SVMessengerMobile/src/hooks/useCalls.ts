/**
 * useCalls Hook
 * Hook за управление на voice calls
 */

import { useCallback, useEffect } from 'react';
import { useCallsStore } from '../store/callsStore';
import { useAuthStore } from '../store/authStore';
import { liveKitService } from '../services/calls/liveKitService';
import { CallState } from '../types/call';
import { stompClient } from '../services/websocket/stompClient';

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

        // Generate call token
        const { token, roomName, serverUrl } = await liveKitService.generateCallToken(conversationId);

        // Start call in store (will be updated with imageUrl if available)
        startCall(conversationId, participantId, participantName);

        // Send call signal via WebSocket
        if (stompClient.getConnected()) {
          stompClient.send('/app/svmessenger/call-signal', {
            eventType: 'CALL_REQUEST',
            conversationId,
            callerId: user.id,
            receiverId: participantId,
            roomName,
          });
        }

        // Connect to LiveKit room
        await liveKitService.connect(token, roomName, serverUrl);
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
      answerCall();

      // Generate call token
      const { token, roomName, serverUrl } = await liveKitService.generateCallToken(
        currentCall.conversationId
      );

      // Send answer signal via WebSocket
      const { user } = useAuthStore.getState();
      if (stompClient.getConnected() && user) {
        stompClient.send('/app/svmessenger/call-signal', {
          eventType: 'CALL_ANSWERED',
          conversationId: currentCall.conversationId,
          callerId: currentCall.participantId,
          receiverId: user.id,
          roomName,
        });
      }

      // Connect to LiveKit room
      await liveKitService.connect(token, roomName, serverUrl);
    } catch (error) {
      console.error('Error answering call:', error);
      clearCall();
    }
  }, [currentCall, answerCall, clearCall]);

  // Reject call
  const handleRejectCall = useCallback(() => {
    const { user } = useAuthStore.getState();
    if (currentCall && stompClient.getConnected() && user) {
      // Send reject signal via WebSocket
      stompClient.send('/app/svmessenger/call-signal', {
        eventType: 'CALL_REJECTED',
        conversationId: currentCall.conversationId,
        callerId: currentCall.participantId,
        receiverId: user.id,
      });
    }

    rejectCall();
    liveKitService.disconnect();
  }, [currentCall, rejectCall]);

  // End call
  const handleEndCall = useCallback(() => {
    const { user } = useAuthStore.getState();
    if (currentCall && stompClient.getConnected() && user) {
      // Send end signal via WebSocket
      stompClient.send('/app/svmessenger/call-signal', {
        eventType: 'CALL_ENDED',
        conversationId: currentCall.conversationId,
        callerId: currentCall.participantId,
        receiverId: user.id,
      });
    }

    liveKitService.disconnect();
    endCall();
  }, [currentCall, endCall]);

  // Toggle mute
  const handleToggleMute = useCallback(async () => {
    const newMuteState = await liveKitService.toggleMute();
    toggleMute();
    return newMuteState;
  }, [toggleMute]);

  return {
    currentCall,
    callState,
    isMuted,
    startCall: handleStartCall,
    answerCall: handleAnswerCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    toggleMute: handleToggleMute,
  };
};

