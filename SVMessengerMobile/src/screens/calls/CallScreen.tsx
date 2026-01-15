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
  Platform,
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
import { liveKitService } from '../../services/calls/liveKitService';
import { RemoteParticipant, Track as LiveKitTrack } from 'livekit-client';
import { logger } from '../../utils/logger';
import { VideoView as LiveKitVideoView } from '@livekit/react-native';
import { useCallsStore } from '../../store/callsStore';

const { width, height } = Dimensions.get('window');

// Video component wrapper with improved error handling
const VideoView: React.FC<{
  track: LiveKitTrack | null;
  style: any;
  mirror?: boolean;
  objectFit?: 'cover' | 'contain';
}> = ({ track, style, mirror = false, objectFit = 'contain' }) => {
  // Use track.sid as key to force re-render when track changes
  const trackKey = track?.sid || 'no-track';
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when track or mediaStreamTrack changes
  useEffect(() => {
    if (track && track.mediaStreamTrack) {
      // Listen for track state changes
      const checkTrackState = () => {
        if (track.mediaStreamTrack) {
          const isActive = track.mediaStreamTrack?.active;
          const isEnabled = track.mediaStreamTrack?.enabled;
          const readyState = track.mediaStreamTrack?.readyState;

          // Force update if track becomes active
          if (isActive && readyState === 'live') {
            setForceUpdate(prev => prev + 1);
          }
        }
      };

      // Check immediately
      checkTrackState();

      // Poll for track state changes (important for mobile-web compatibility)
      const interval = setInterval(checkTrackState, 500);

      return () => clearInterval(interval);
    }
  }, [track?.sid, track?.mediaStreamTrack?.id, track?.mediaStreamTrack?.active]);

  if (!track) {
    return (
      <View style={[style, styles.videoPlaceholder]}>
        <Text style={styles.videoPlaceholderText}>Няма видео</Text>
      </View>
    );
  }

  // Wait for mediaStreamTrack to be available
  if (!track.mediaStreamTrack) {
    return (
      <View style={[style, styles.videoPlaceholder]}>
        <Text style={styles.videoPlaceholderText}>Зарежда се...</Text>
      </View>
    );
  }

  // CRITICAL: Force enable track at LiveKit level
  if (!(track as any).enabled) {
    try {
      if (typeof (track as any).setEnabled === 'function') {
        (track as any).setEnabled(true);
      }
      if ((track as any).enabled !== true) {
        (track as any).enabled = true;
      }
    } catch (e) {
      logger.error('⚠️ [VideoView] Could not enable track:', e);
    }
  }

  // CRITICAL: Force enable mediaStreamTrack
  if (track.mediaStreamTrack) {
    if (track.mediaStreamTrack.enabled !== true) {
      track.mediaStreamTrack.enabled = true;
    }
  }

  try {
    const viewKey = `${trackKey}-${forceUpdate}`;

    return (
      <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#000' }}>
        <LiveKitVideoView
          key={viewKey}
          videoTrack={track as any}
          style={{ flex: 1, width: '100%', height: '100%' }}
          mirror={mirror}
          zOrder={0}
          objectFit={objectFit}
        />
      </View>
    );
  } catch (error: any) {
    logger.error('❌ [VideoView] Error rendering LiveKitVideoView:', error);
    const isEmulator = __DEV__;
    const placeholderText = isEmulator
      ? 'Камерата не работи на emulator\nТествай на реален телефон'
      : 'Грешка при показване';

    return (
      <View style={[style, styles.videoPlaceholder]}>
        <Text style={styles.videoPlaceholderText}>{placeholderText}</Text>
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
        <View style={[styles.shadowRing, { backgroundColor: colors.outer }]} />
        <View style={[styles.middleRing, { backgroundColor: colors.middle }]} />
        <View style={[styles.innerButton, { backgroundColor: colors.inner }]}>
          <View style={styles.glossTop} />
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.bottomShadow} />
        </View>
      </Animated.View>
      <Text style={styles.buttonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export const CallScreen: React.FC = () => {
  const {
    currentCall,
    isRinging,
    isDialing,
    isConnected,
    isEnding,
    isMuted,
    isSpeakerOn,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    flipCamera,
    isVideoEnabled,
  } = useCalls();

  const isVideoCall = currentCall?.isVideoCall || false;

  const [remoteVideoTrack, setRemoteVideoTrack] = useState<LiveKitTrack | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LiveKitTrack | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const pipPosition = useRef({ x: width - 180, y: height - 300 });
  const pipX = useRef(new Animated.Value(width - 180)).current;
  const pipY = useRef(new Animated.Value(height - 300)).current;

  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        floatAnim.stopAnimation();
        pulseAnim.stopAnimation();
        floatAnim.setValue(0);
        pipX.flattenOffset();
        pipY.flattenOffset();
        pipX.setOffset((pipX as any)._value);
        pipY.setOffset((pipY as any)._value);
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

        const currentX = pipPosition.current.x + gestureState.dx;
        const currentY = pipPosition.current.y + gestureState.dy;

        const newX = Math.max(10, Math.min(width - 170, currentX));
        const newY = Math.max(10, Math.min(height - 130, currentY));

        pipPosition.current = { x: newX, y: newY };

        Animated.parallel([
          Animated.spring(pipX, {
            toValue: newX - (width - 180),
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }),
          Animated.spring(pipY, {
            toValue: newY - (height - 300),
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }),
        ]).start(() => {
          setIsDragging(false);
          Animated.loop(
            Animated.sequence([
              Animated.timing(floatAnim, {
                toValue: -8,
                duration: 2000,
                useNativeDriver: false,
              }),
              Animated.timing(floatAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: false,
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
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isEnding) {
      const timer = setTimeout(() => endCall(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isEnding, endCall]);

  useEffect(() => {
    if (isConnected) {
      const checkLocalVideoTrack = () => {
        const currentTrack = liveKitService.getLocalVideoTrack();
        if (currentTrack !== localVideoTrack) {
          setLocalVideoTrack(currentTrack);
        }
      };

      checkLocalVideoTrack();
      const interval = setInterval(checkLocalVideoTrack, 200);
      return () => clearInterval(interval);
    } else {
      setLocalVideoTrack(null);
    }
  }, [isConnected, isVideoEnabled]);

  useEffect(() => {
    if (!isConnected) {
      setRemoteVideoTrack(null);
      setRemoteParticipant(null);
      return;
    }

    const handleVideoTrackSubscribed = (track: LiveKitTrack | null, participant: RemoteParticipant) => {
      if (!track) {
        setRemoteVideoTrack(null);
        return;
      }

      if (track.kind === 'video') {
        if (track.mediaStreamTrack) {
          track.mediaStreamTrack.enabled = true;
          if (!(track as any).enabled && (track as any).setEnabled) {
            try {
              (track as any).setEnabled(true);
            } catch (e) {
              logger.error('⚠️ [CallScreen] Could not enable track:', e);
            }
          }
          setRemoteVideoTrack(track);
          setRemoteParticipant(participant);
        } else {
          setTimeout(() => {
            if (track.mediaStreamTrack) {
              track.mediaStreamTrack.enabled = true;
              if (!(track as any).enabled && (track as any).setEnabled) {
                try {
                  (track as any).setEnabled(true);
                } catch (e) {
                  logger.error('⚠️ [CallScreen] Could not enable track:', e);
                }
              }
              setRemoteVideoTrack(track);
              setRemoteParticipant(participant);
            }
          }, 300);
        }
      }
    };

    const cleanupVideoTrackSubscribed = liveKitService.onVideoTrackSubscribed(handleVideoTrackSubscribed);

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track && publication.track.kind === 'video' && publication.track.mediaStreamTrack) {
          if (publication.track.mediaStreamTrack) {
            publication.track.mediaStreamTrack.enabled = true;
          }
          setRemoteVideoTrack(publication.track);
          setRemoteParticipant(participant);
        }
      });
    };

    const cleanupParticipantConnected = liveKitService.onParticipantConnected(handleParticipantConnected);

    const checkExistingParticipants = () => {
      try {
        const room = (liveKitService as any)['room'];
        if (room) {
          const participants = Array.from(room.remoteParticipants.values()) as RemoteParticipant[];

          participants.forEach((participant) => {
            participant.videoTrackPublications.forEach((publication) => {
              if (publication.track && publication.track.kind === 'video') {
                if (!publication.isSubscribed) {
                  try {
                    publication.setSubscribed(true);
                  } catch (e) {
                    logger.error('⚠️ [CallScreen] Error subscribing to video track:', e);
                  }
                }

                if (publication.track.mediaStreamTrack) {
                  publication.track.mediaStreamTrack.enabled = true;
                  if (!(publication.track as any).enabled && (publication.track as any).setEnabled) {
                    try {
                      (publication.track as any).setEnabled(true);
                    } catch (e) {
                      logger.error('⚠️ [CallScreen] Could not enable track:', e);
                    }
                  }
                  setRemoteVideoTrack(publication.track);
                  setRemoteParticipant(participant);
                }
              }
            });
          });
        }
      } catch (error) {
        logger.error('❌ [CallScreen] Error checking existing participants:', error);
      }
    };

    checkExistingParticipants();
    const t1 = setTimeout(checkExistingParticipants, 500);
    const t2 = setTimeout(checkExistingParticipants, 1500);
    const t3 = setTimeout(checkExistingParticipants, 3000);
    const pollInterval = setInterval(checkExistingParticipants, 2000);

    // Initial video check
    const checkVideo = () => {
      // This `participant` variable is not defined in this scope.
      // Assuming the intent was to check for the `remoteParticipant` state variable.
      // If `remoteParticipant` is null, this function will return early.
      if (!remoteParticipant) return;

      remoteParticipant.videoTrackPublications.forEach((pub) => {
        if (pub.track && pub.track.mediaStreamTrack) {
          pub.track.mediaStreamTrack.enabled = true;
        }
        if (!pub.isSubscribed) {
          pub.setSubscribed(true);
        }
      });
    };

    checkVideo();
    // Re-check periodically
    const interval = setInterval(checkVideo, 2000);

    return () => {
      cleanupVideoTrackSubscribed?.();
      cleanupParticipantConnected?.();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(pollInterval);
      clearInterval(interval); // Added cleanup for the new interval
      setRemoteVideoTrack(null);
      setRemoteParticipant(null);
    };
  }, [isConnected, remoteParticipant]); // Added remoteParticipant to dependencies for checkVideo

  useEffect(() => {
    if (!isConnected || !currentCall?.startTime) {
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
  }, [isConnected, currentCall?.startTime]);

  if (!currentCall) return null;

  const showVideo = remoteVideoTrack || (isVideoEnabled && localVideoTrack) || (isVideoCall && isVideoEnabled);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {showVideo ? (
          <View style={styles.videoContainer}>
            <View style={styles.remoteVideo}>
              {remoteVideoTrack ? (
                <VideoView track={remoteVideoTrack} style={{ flex: 1, width: '100%', height: '100%' }} mirror={false} objectFit="contain" />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoPlaceholderText}>
                    {isVideoEnabled ? 'Очакване на видео от отсреща...' : 'Камерата е изключена'}
                  </Text>
                </View>
              )}
            </View>

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
                  <VideoView track={localVideoTrack} style={styles.pipVideo} mirror={true} objectFit="cover" />
                  <View style={styles.pipGloss} />
                </View>
              </Animated.View>
            )}

            <View style={styles.topGradient}>
              <Text style={styles.participantNameVideo}>{currentCall.participant.name}</Text>
              {isConnected && currentCall?.startTime && (
                <View style={styles.liveTimer}>
                  <View style={styles.livePulse} />
                  <Text style={styles.timerText}>{callDuration}</Text>
                </View>
              )}
              {isDialing && (
                <View style={styles.liveTimer}>
                  <View style={styles.livePulse} />
                  <Text style={styles.timerText}>Свързване...</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.audioContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarRing1} />
                <View style={styles.avatarRing2} />
                <Avatar
                  imageUrl={currentCall.participant.imageUrl}
                  name={currentCall.participant.name}
                  size={140}
                  isOnline={true}
                  style={styles.avatar}
                />
              </View>
            </Animated.View>

            <Text style={styles.participantName}>{currentCall.participant.name}</Text>

            <View style={styles.statusCard}>
              {isDialing && (
                <>
                  <View style={[styles.statusDot, styles.connectingDot]} />
                  <Text style={styles.statusText}>Свързване...</Text>
                </>
              )}
              {isConnected && currentCall?.startTime && (
                <>
                  <View style={[styles.statusDot, styles.connectedDot]} />
                  <Text style={styles.statusText}>{callDuration}</Text>
                </>
              )}
              {isEnding && (
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

            {isConnected && (
              <Premium3DButton
                onPress={toggleCamera}
                icon={
                  isVideoEnabled ? (
                    <VideoCameraSlashIcon size={22} color="#fff" />
                  ) : (
                    <VideoCameraIcon size={22} color="#fff" />
                  )
                }
                label="Camera"
                variant="camera"
                isActive={isVideoEnabled}
              />
            )}

            {isConnected && isVideoEnabled && (
              <Premium3DButton
                onPress={flipCamera}
                icon={<ArrowPathIcon size={22} color="#fff" />}
                label="Flip"
                variant="camera"
              />
            )}
          </View>

          <View style={styles.endCallRow}>
            <Premium3DButton
              onPress={endCall}
              icon={<TelephoneIcon size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />}
              label="End Call"
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
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  videoPlaceholderText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  pipContainer: {
    position: 'absolute',
    width: 160,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 100,
  },
  pipShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    transform: [{ translateY: 4 }],
  },
  pipBorder: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
    alignItems: 'center',
  },
  participantNameVideo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  liveTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  avatarWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  avatarRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  avatar: {
    borderWidth: 4,
    borderColor: Colors.green[500],
  },
  participantName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 40,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  connectingDot: {
    backgroundColor: Colors.orange[500],
  },
  connectedDot: {
    backgroundColor: Colors.green[500],
  },
  statusText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  controlsContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  endCallRow: {
    alignItems: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    width: 80,
  },
  outerGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: -1,
    left: -2,
    top: -2,
  },
  shadowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 4,
    left: 0,
  },
  middleRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 2,
    left: 0,
  },
  innerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glossTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  iconContainer: {
    zIndex: 10,
  },
  buttonLabel: {
    marginTop: 12,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
});
