/**
 * Call Screen
 * Екран за активен voice и video call
 * Подобрена версия с video поддръжка като web версията
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/common';
import { TelephoneIcon, SpeakerWaveIcon, MicrophoneIcon, CameraVideoIcon, CameraIcon } from '../../components/common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { CallState } from '../../types/call';
import { liveKitService } from '../../services/calls/liveKitService';
import { RemoteParticipant, Track as LiveKitTrack } from 'livekit-client';
import { VideoView as LiveKitVideoView } from '@livekit/react-native';

// Video component wrapper using LiveKit's VideoView
const VideoView: React.FC<{ stream: MediaStream | null; track: LiveKitTrack | null; style: any; mirror?: boolean }> = ({ stream, track, style, mirror = false }) => {
  if (!track || !track.mediaStreamTrack) {
    // Fallback placeholder when no track
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.dark }]}>
        <Text style={{ color: Colors.text.inverse, fontSize: Typography.fontSize.sm }}>
          Waiting for video...
        </Text>
      </View>
    );
  }

  return (
    <LiveKitVideoView
      track={track}
      style={style}
      mirror={mirror}
    />
  );
};

export const CallScreen: React.FC = () => {
  const { currentCall, callState, isMuted, endCall, toggleMute, toggleCamera, isVideoEnabled } = useCalls();
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<LiveKitTrack | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Auto-end call if disconnected
    if (callState === CallState.DISCONNECTED) {
      setTimeout(() => {
        endCall();
      }, 2000);
    }
  }, [callState, endCall]);

  // Setup video track listeners and convert to stream URLs for RTCView
  useEffect(() => {
    if (callState !== CallState.CONNECTED) return;

    // Listen for video track subscriptions
    liveKitService.onVideoTrackSubscribed((track: LiveKitTrack, participant: RemoteParticipant) => {
      console.log('Video track subscribed:', track.kind, participant.identity);
      if (track.kind === 'video' && track.mediaStreamTrack) {
        setRemoteVideoTrack(track);
        setRemoteParticipant(participant);
        
        // Create MediaStream from track for RTCView
        const stream = new MediaStream([track.mediaStreamTrack]);
        setRemoteStream(stream);
      }
    });

    // Listen for participant connections
    liveKitService.onParticipantConnected((participant: RemoteParticipant) => {
      // Check for existing video tracks
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track && publication.track.kind === 'video' && publication.track.mediaStreamTrack) {
          setRemoteVideoTrack(publication.track);
          setRemoteParticipant(participant);
          
          // Create MediaStream from track
          const stream = new MediaStream([publication.track.mediaStreamTrack]);
          setRemoteStream(stream);
        }
      });
    });

    // Cleanup on disconnect
    return () => {
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      setRemoteVideoTrack(null);
      setRemoteParticipant(null);
      setRemoteStream(null);
      setLocalStream(null);
    };
  }, [callState]);

  // Update local video stream when local track changes
  useEffect(() => {
    const localTrack = liveKitService.getLocalVideoTrack();
    if (localTrack && localTrack.mediaStreamTrack) {
      const stream = new MediaStream([localTrack.mediaStreamTrack]);
      setLocalStream(stream);
      
      // Cleanup function
      return () => {
        stream.getTracks().forEach(track => track.stop());
      };
    } else {
      setLocalStream(null);
    }
  }, [isVideoEnabled]);

  if (!currentCall) {
    return null;
  }

  const formatCallDuration = (startTime?: Date): string => {
    if (!startTime) return '00:00';
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const localVideoTrack = liveKitService.getLocalVideoTrack();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Remote Video (full screen when video is enabled) */}
        {isVideoEnabled && remoteStream ? (
          <View style={styles.remoteVideoContainer}>
            <VideoView
              stream={remoteStream}
              style={styles.remoteVideo}
              mirror={false}
              zOrder={0}
            />
            {/* Local video preview (PiP style) */}
            {localStream && (
              <View style={styles.localVideoPreview}>
                <VideoView
                  stream={localStream}
                  style={styles.localVideo}
                  mirror={true}
                  zOrder={1}
                />
              </View>
            )}
          </View>
        ) : (
          /* Audio call view (avatar) */
          <View style={styles.participantSection}>
            <Avatar
              imageUrl={currentCall.participantImageUrl}
              name={currentCall.participantName}
              size={120}
              isOnline={true}
            />
            <Text style={styles.participantName}>{currentCall.participantName}</Text>
            <Text style={styles.callStatus}>
              {callState === CallState.CONNECTING && 'Свързване...'}
              {callState === CallState.CONNECTED && formatCallDuration(currentCall.startTime)}
              {callState === CallState.DISCONNECTED && 'Разговорът приключи'}
            </Text>
          </View>
        )}

        <View style={styles.controlsSection}>
          {/* Mute/Unmute button */}
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isMuted ? (
              <MicrophoneIcon size={28} color={Colors.text.inverse} />
            ) : (
              <SpeakerWaveIcon size={28} color={Colors.text.inverse} />
            )}
            <Text style={styles.controlButtonLabel}>
              {isMuted ? 'Включи' : 'Изключи'}
            </Text>
          </TouchableOpacity>

          {/* Camera toggle button */}
          {callState === CallState.CONNECTED && (
            <TouchableOpacity
              style={[styles.controlButton, isVideoEnabled && styles.controlButtonActive]}
              onPress={toggleCamera}
              activeOpacity={0.8}
            >
              {isVideoEnabled ? (
                <CameraVideoIcon size={28} color={Colors.text.inverse} />
              ) : (
                <CameraIcon size={28} color={Colors.text.inverse} />
              )}
              <Text style={styles.controlButtonLabel}>
                {isVideoEnabled ? 'Камера' : 'Камера'}
              </Text>
            </TouchableOpacity>
          )}

          {/* End call button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
            activeOpacity={0.8}
          >
            <TelephoneIcon size={28} color={Colors.text.inverse} />
            <Text style={styles.controlButtonLabel}>Затвори</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  participantSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.lg,
  },
  callStatus: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.background.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border.medium,
    gap: Spacing.xs,
  },
  controlButtonActive: {
    backgroundColor: Colors.green[500],
    borderColor: Colors.green[500],
  },
  endCallButton: {
    backgroundColor: Colors.semantic.error,
    borderColor: Colors.semantic.error,
  },
  controlButtonLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  remoteVideoContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.background.dark,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  localVideoPreview: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background.dark,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
  },
});

