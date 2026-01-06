/**
 * Call Screen - WORLD-CLASS PREMIUM VERSION
 * Световен стандарт с 3D ефекти, glossy buttons, градиенти
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/common';
import {
  TelephoneIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ArrowPathIcon,
} from '../../components/common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { CallState } from '../../types/call';
import { liveKitService } from '../../services/calls/liveKitService';
import { RemoteParticipant, Track as LiveKitTrack } from 'livekit-client';
import { VideoView as LiveKitVideoView } from '@livekit/react-native';

const { width, height } = Dimensions.get('window');

// Video component wrapper with improved error handling
const VideoView: React.FC<{
  track: LiveKitTrack | null;
  style: any;
  mirror?: boolean;
}> = ({ track, style, mirror = false }) => {
  if (!track) {
    console.log('❌ [VideoView] No track provided');
    return (
      <View style={[style, styles.videoPlaceholder]}>
        <Text style={styles.videoPlaceholderText}>Няма видео</Text>
      </View>
    );
  }

  // Wait for mediaStreamTrack to be available
  if (!track.mediaStreamTrack) {
    console.log('⏳ [VideoView] Track has no mediaStreamTrack yet, waiting...', {
      kind: track.kind,
      sid: track.sid,
      enabled: track.enabled,
      isMuted: track.isMuted,
    });
    return (
      <View style={[style, styles.videoPlaceholder]}>
        <Text style={styles.videoPlaceholderText}>Зарежда се...</Text>
      </View>
    );
  }

  // Ensure track is enabled
  if (!track.enabled || track.isMuted) {
    console.log('⚠️ [VideoView] Track is disabled or muted', {
      kind: track.kind,
      sid: track.sid,
      enabled: track.enabled,
      isMuted: track.isMuted,
    });
    // Try to enable it
    if (track.mediaStreamTrack) {
      track.mediaStreamTrack.enabled = true;
    }
  }

  console.log('✅ [VideoView] Rendering video track', {
    kind: track.kind,
    sid: track.sid,
    enabled: track.enabled,
    muted: track.isMuted,
    hasMediaStreamTrack: !!track.mediaStreamTrack,
    mediaStreamTrackId: track.mediaStreamTrack?.id,
    mediaStreamTrackReadyState: track.mediaStreamTrack?.readyState,
    mediaStreamTrackActive: track.mediaStreamTrack?.active,
    mediaStreamTrackMuted: track.mediaStreamTrack?.muted,
  });

  // Additional check: Ensure mediaStreamTrack is active
  if (track.mediaStreamTrack && !track.mediaStreamTrack.active) {
    console.warn('⚠️ [VideoView] MediaStreamTrack is not active, waiting...');
    // Try to enable it
    if (track.mediaStreamTrack.enabled !== undefined) {
      track.mediaStreamTrack.enabled = true;
    }
  }

  // Force enable track if it's disabled
  if (!track.enabled) {
    console.log('🔧 [VideoView] Track is disabled, attempting to enable...');
    try {
      if (track.setEnabled) {
        track.setEnabled(true);
      }
    } catch (e) {
      console.warn('⚠️ [VideoView] Could not enable track:', e);
    }
  }

  // Ensure mediaStreamTrack is enabled
  if (track.mediaStreamTrack && track.mediaStreamTrack.enabled === false) {
    console.log('🔧 [VideoView] MediaStreamTrack is disabled, enabling...');
    track.mediaStreamTrack.enabled = true;
  }

  try {
    return (
      <LiveKitVideoView 
        track={track} 
        style={style} 
        mirror={mirror}
        zOrder={0}
        objectFit="cover"
      />
    );
  } catch (error: any) {
    console.error('❌ [VideoView] Error rendering LiveKitVideoView:', error);
    const errorMessage = error?.message || 'Unknown error';
    
    // Show helpful message for emulator
    const isEmulator = __DEV__;
    const placeholderText = isEmulator 
      ? 'Камерата не работи на emulator\nТествай на реален телефон'
      : 'Грешка при показване';
    
    return (
      <View style={[style, styles.videoPlaceholder]}>
        <Text style={styles.videoPlaceholderText}>{placeholderText}</Text>
        {isEmulator && (
          <Text style={[styles.videoPlaceholderText, { fontSize: 12, marginTop: 8, opacity: 0.7 }]}>
            Emulator-ите често имат проблеми с камерите.{'\n'}
            На production телефон всичко ще работи правилно.
          </Text>
        )}
      </View>
    );
  }
};

// PREMIUM 3D BUTTON Component
const Premium3DButton: React.FC<{
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  variant: 'mute' | 'speaker' | 'camera' | 'end';
  isActive?: boolean;
}> = ({ onPress, icon, label, variant, isActive = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(onPress);
  };

  const getColors = () => {
    if (variant === 'end') {
      return {
        outer: '#7f1d1d',
        middle: '#b91c1c',
        inner: '#ef4444',
        glow: '#ef4444',
      };
    }
    if (isActive) {
      if (variant === 'mute') {
        return {
          outer: '#7f1d1d',
          middle: '#b91c1c',
          inner: '#ef4444',
          glow: '#ef4444',
        };
      }
      return {
        outer: '#064e3b',
        middle: '#047857',
        inner: '#10b981',
        glow: '#10b981',
      };
    }
    return {
      outer: 'rgba(100, 116, 139, 0.4)',
      middle: 'rgba(148, 163, 184, 0.35)',
      inner: 'rgba(203, 213, 225, 0.25)',
      glow: 'rgba(255, 255, 255, 0.3)',
    };
  };

  const colors = getColors();
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.buttonWrapper}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {/* Outer glow (animated for active) */}
        {isActive && (
          <Animated.View
            style={[
              styles.outerGlow,
              {
                backgroundColor: colors.glow,
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
        )}

        {/* Outer shadow ring */}
        <View style={[styles.shadowRing, { backgroundColor: colors.outer }]} />

        {/* Middle gradient ring */}
        <View style={[styles.middleRing, { backgroundColor: colors.middle }]} />

        {/* Inner button with glossy effect */}
        <View style={[styles.innerButton, { backgroundColor: colors.inner }]}>
          {/* Top glossy highlight */}
          <View style={styles.glossTop} />
          
          {/* Icon */}
          <View style={styles.iconContainer}>{icon}</View>

          {/* Bottom shadow for depth */}
          <View style={styles.bottomShadow} />
        </View>
      </Animated.View>

      {/* Label */}
      <Text style={styles.buttonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export const CallScreen: React.FC = () => {
  const {
    currentCall,
    callState,
    isMuted,
    isSpeakerOn,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    flipCamera,
    isVideoEnabled,
  } = useCalls();

  const [remoteVideoTrack, setRemoteVideoTrack] = useState<LiveKitTrack | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LiveKitTrack | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // PiP position state
  const pipPosition = useRef({ x: width - 140, y: 60 }); // Default top-right
  const pipX = useRef(new Animated.Value(width - 140)).current;
  const pipY = useRef(new Animated.Value(60)).current;
  
  // PanResponder for draggable PiP
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Stop floating animation while dragging
        floatAnim.stopAnimation();
        pulseAnim.stopAnimation();
        // Get current position
        pipX.flattenOffset();
        pipY.flattenOffset();
        pipX.setOffset(pipX._value);
        pipY.setOffset(pipY._value);
        pipX.setValue(0);
        pipY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pipX, dy: pipY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        pipX.flattenOffset();
        pipY.flattenOffset();
        
        // Calculate new position
        const currentX = pipPosition.current.x + gestureState.dx;
        const currentY = pipPosition.current.y + gestureState.dy;
        
        // Constrain to screen bounds (accounting for PiP size: 100x140)
        const newX = Math.max(10, Math.min(width - 110, currentX));
        const newY = Math.max(10, Math.min(height - 150, currentY));
        
        pipPosition.current = { x: newX, y: newY };
        
        // Animate to final position
        Animated.parallel([
          Animated.spring(pipX, {
            toValue: newX - (width - 116), // Offset from default right position
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }),
          Animated.spring(pipY, {
            toValue: newY - 60, // Offset from default top position
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }),
        ]).start(() => {
          // Resume floating animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(floatAnim, {
                toValue: -8,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(floatAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ).start();
        });
      },
    })
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation for PiP
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (callState === CallState.DISCONNECTED) {
      setTimeout(() => endCall(), 2000);
    }
  }, [callState, endCall]);

  // Update local video track when camera state changes
  useEffect(() => {
    if (callState === CallState.CONNECTED) {
      // Poll for local video track changes (since getLocalVideoTrack() is not reactive)
      const checkLocalVideoTrack = () => {
        const currentTrack = liveKitService.getLocalVideoTrack();
        if (currentTrack !== localVideoTrack) {
          console.log('📹 [CallScreen] Local video track changed:', {
            hadTrack: !!localVideoTrack,
            hasTrack: !!currentTrack,
            trackEnabled: currentTrack?.enabled,
            trackMuted: currentTrack?.isMuted,
            hasMediaStream: !!currentTrack?.mediaStreamTrack,
          });
          setLocalVideoTrack(currentTrack);
        }
      };

      // Check immediately
      checkLocalVideoTrack();

      // Poll every 500ms to catch track creation
      const interval = setInterval(checkLocalVideoTrack, 500);

      return () => clearInterval(interval);
    } else {
      setLocalVideoTrack(null);
    }
  }, [callState, isVideoEnabled, localVideoTrack]);

  useEffect(() => {
    if (callState !== CallState.CONNECTED) {
      setRemoteVideoTrack(null);
      setRemoteParticipant(null);
      return;
    }

    console.log('📹 [CallScreen] Setting up video track listeners');

    // Listen for NEW video tracks being subscribed
    const handleVideoTrackSubscribed = (track: LiveKitTrack, participant: RemoteParticipant) => {
      console.log('📹 [CallScreen] Video track subscribed callback:', {
        kind: track.kind,
        sid: track.sid,
        participantId: participant.identity,
        hasMediaStreamTrack: !!track.mediaStreamTrack,
        enabled: track.enabled,
        isMuted: track.isMuted,
      });
      
      if (track.kind === 'video' && track.mediaStreamTrack) {
        // Ensure track is enabled
        if (track.mediaStreamTrack) {
          track.mediaStreamTrack.enabled = true;
        }
        console.log('✅ [CallScreen] Setting remote video track');
        setRemoteVideoTrack(track);
        setRemoteParticipant(participant);
      } else {
        console.warn('⚠️ [CallScreen] Video track subscribed but not ready:', {
          kind: track.kind,
          hasMediaStreamTrack: !!track.mediaStreamTrack,
        });
      }
    };

    liveKitService.onVideoTrackSubscribed(handleVideoTrackSubscribed);

    // Listen for participants joining
    const handleParticipantConnected = (participant: RemoteParticipant) => {
      console.log('📹 [CallScreen] Participant connected, checking for video tracks:', participant.identity);
      
      // Check for existing video tracks
      participant.videoTrackPublications.forEach((publication) => {
        console.log('📹 [CallScreen] Found video publication:', {
          sid: publication.trackSid,
          hasTrack: !!publication.track,
          isSubscribed: publication.isSubscribed,
        });
        
        if (publication.track && publication.track.kind === 'video' && publication.track.mediaStreamTrack) {
          // Ensure track is enabled
          if (publication.track.mediaStreamTrack) {
            publication.track.mediaStreamTrack.enabled = true;
          }
          console.log('✅ [CallScreen] Setting remote video track from existing publication');
          setRemoteVideoTrack(publication.track);
          setRemoteParticipant(participant);
        }
      });
    };

    liveKitService.onParticipantConnected(handleParticipantConnected);

    // Check for ALREADY CONNECTED participants (important!)
    const checkExistingParticipants = () => {
      try {
        const room = (liveKitService as any)['room']; // Access private property
        if (room) {
          const participants = Array.from(room.remoteParticipants.values());
          console.log('📹 [CallScreen] Checking existing participants:', participants.length);
          
          participants.forEach((participant) => {
            participant.videoTrackPublications.forEach((publication) => {
              if (publication.track && publication.track.kind === 'video' && publication.track.mediaStreamTrack) {
                // Ensure track is enabled
                if (publication.track.mediaStreamTrack) {
                  publication.track.mediaStreamTrack.enabled = true;
                }
                console.log('✅ [CallScreen] Found existing video track:', {
                  sid: publication.trackSid,
                  participantId: participant.identity,
                  hasMediaStreamTrack: !!publication.track.mediaStreamTrack,
                });
                setRemoteVideoTrack(publication.track);
                setRemoteParticipant(participant);
              }
            });
          });
        }
      } catch (error) {
        console.error('❌ [CallScreen] Error checking existing participants:', error);
      }
    };

    // Check immediately and also after a short delay (for tracks that might be loading)
    checkExistingParticipants();
    const timeoutId = setTimeout(checkExistingParticipants, 1000);

    return () => {
      console.log('📹 [CallScreen] Cleaning up video track listeners');
      clearTimeout(timeoutId);
      setRemoteVideoTrack(null);
      setRemoteParticipant(null);
    };
  }, [callState]);

  useEffect(() => {
    if (callState !== CallState.CONNECTED || !currentCall?.startTime) {
      setCallDuration('00:00');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - currentCall.startTime!.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, currentCall?.startTime]);

  if (!currentCall) return null;
  
  // Debug logging for video tracks
  useEffect(() => {
    if (callState === CallState.CONNECTED) {
      const isEmulator = __DEV__;
      console.log('📹 [CallScreen] Video state check:', {
        isVideoEnabled,
        hasLocalVideoTrack: !!localVideoTrack,
        hasRemoteVideoTrack: !!remoteVideoTrack,
        localTrackEnabled: localVideoTrack?.enabled,
        localTrackMuted: localVideoTrack?.isMuted,
        localTrackHasMediaStream: !!localVideoTrack?.mediaStreamTrack,
        localTrackActive: localVideoTrack?.mediaStreamTrack?.active,
        remoteTrackEnabled: remoteVideoTrack?.enabled,
        remoteTrackMuted: remoteVideoTrack?.isMuted,
        remoteTrackHasMediaStream: !!remoteVideoTrack?.mediaStreamTrack,
        remoteTrackActive: remoteVideoTrack?.mediaStreamTrack?.active,
        isEmulator,
        note: isEmulator ? '⚠️ На emulator камерите често не работят. Тествай на реален телефон.' : '✅ На реален телефон всичко ще работи правилно.',
      });
      
      // Warn if on emulator and no video tracks
      if (isEmulator && isVideoEnabled && !localVideoTrack && !remoteVideoTrack) {
        console.warn('⚠️ [CallScreen] Video call on emulator - камерите може да не работят. Тествай на реален телефон.');
      }
    }
  }, [callState, isVideoEnabled, localVideoTrack, remoteVideoTrack]);
  
  // Show video mode if we have remote video OR if we have local video enabled
  const showVideo = remoteVideoTrack || (isVideoEnabled && localVideoTrack);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {showVideo ? (
          <View style={styles.videoContainer}>
            {/* Show remote video if available, otherwise show local video full screen */}
            {remoteVideoTrack ? (
              <>
                <VideoView track={remoteVideoTrack} style={styles.remoteVideo} mirror={false} />
                
                {/* Floating local video PiP with 3D effect - DRAGGABLE */}
                {localVideoTrack && (
                  <Animated.View
                    style={[
                      styles.pipContainer,
                      {
                        transform: [
                          { translateX: pipX },
                          { translateY: Animated.add(pipY, floatAnim) },
                          { scale: pulseAnim },
                        ],
                      },
                    ]}
                    {...panResponder.panHandlers}
                  >
                    <View style={styles.pipShadow} />
                    <View style={styles.pipBorder}>
                      <VideoView track={localVideoTrack} style={styles.pipVideo} mirror={true} />
                      <View style={styles.pipGloss} />
                    </View>
                  </Animated.View>
                )}
              </>
            ) : localVideoTrack ? (
              // Show local video full screen if no remote video yet
              <VideoView track={localVideoTrack} style={styles.remoteVideo} mirror={true} />
            ) : null}

            {/* Premium gradient overlay at top */}
            <View style={styles.topGradient}>
              <Text style={styles.participantNameVideo}>{currentCall.participantName}</Text>
              <View style={styles.liveTimer}>
                <View style={styles.livePulse} />
                <Text style={styles.timerText}>{callDuration}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.audioContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              {/* Avatar with premium ring */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarRing1} />
                <View style={styles.avatarRing2} />
                <Avatar
                  imageUrl={currentCall.participantImageUrl}
                  name={currentCall.participantName}
                  size={140}
                  isOnline={true}
                  style={styles.avatar}
                />
              </View>
            </Animated.View>

            <Text style={styles.participantName}>{currentCall.participantName}</Text>

            <View style={styles.statusCard}>
              {callState === CallState.CONNECTING && (
                <>
                  <View style={[styles.statusDot, styles.connectingDot]} />
                  <Text style={styles.statusText}>Свързване...</Text>
                </>
              )}
              {callState === CallState.CONNECTED && (
                <>
                  <View style={[styles.statusDot, styles.connectedDot]} />
                  <Text style={styles.statusText}>{callDuration}</Text>
                </>
              )}
              {callState === CallState.DISCONNECTED && (
                <Text style={styles.statusText}>Разговорът приключи</Text>
              )}
            </View>
          </View>
        )}

        {/* Premium Controls */}
        <View style={[styles.controlsContainer, showVideo && styles.controlsOverlay]}>
          <View style={styles.controlsRow}>
            <Premium3DButton
              onPress={toggleMute}
              icon={<MicrophoneIcon size={22} color="#fff" />}
              label={isMuted ? 'Unmute' : 'Mute'}
              variant="mute"
              isActive={isMuted}
            />

            <Premium3DButton
              onPress={toggleSpeaker}
              icon={<SpeakerWaveIcon size={22} color="#fff" />}
              label="Speaker"
              variant="speaker"
              isActive={isSpeakerOn}
            />

            {callState === CallState.CONNECTED && (
              <Premium3DButton
                onPress={toggleCamera}
                icon={
                  isVideoEnabled ? (
                    <VideoCameraIcon size={22} color="#fff" />
                  ) : (
                    <VideoCameraSlashIcon size={22} color="#fff" />
                  )
                }
                label="Camera"
                variant="camera"
                isActive={isVideoEnabled}
              />
            )}

            {callState === CallState.CONNECTED && isVideoEnabled && (
              <Premium3DButton
                onPress={flipCamera}
                icon={<ArrowPathIcon size={22} color="#fff" />}
                label="Flip"
                variant="camera"
                isActive={false}
              />
            )}

            <Premium3DButton
              onPress={endCall}
              icon={<TelephoneIcon size={22} color="#fff" />}
              label="End"
              variant="end"
            />
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1c',
  },
  content: {
    flex: 1,
  },
  // Video mode
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  participantNameVideo: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  liveTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b91c1c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // PiP with 3D effect
  pipContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    zIndex: 1000,
  },
  pipShadow: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#000',
    opacity: 0.5,
  },
  pipBorder: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: '#000',
  },
  pipVideo: {
    flex: 1,
  },
  pipGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f1c',
  },
  videoPlaceholderText: {
    color: '#64748b',
    fontSize: 14,
  },
  // Audio mode
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing1: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  avatarRing2: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 16,
  },
  participantName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectingDot: {
    backgroundColor: '#fbbf24',
  },
  connectedDot: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Premium 3D Controls
  controlsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  controlsOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    top: -4,
    left: -4,
  },
  shadowRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    position: 'absolute',
    top: 1,
    left: 1,
  },
  middleRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  innerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'absolute',
    top: 2,
    left: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  glossTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  buttonLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
