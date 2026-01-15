/**
 * LiveKit Service for React Native
 * Управление на voice и video calls чрез LiveKit
 * 
 * ВАЖНО: @livekit/react-native предоставя само registerGlobals() и React компоненти.
 * Room, Track, и други класове идват от livekit-client пакета.
 */

import {
  Room,
  RoomEvent,
  Track,
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteParticipant,
  createLocalAudioTrack,
  createLocalVideoTrack
} from 'livekit-client';
import { Platform } from 'react-native';
import { CallTokenResponse } from '../../types/call';
import apiClient from '../api/client';
import { API_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';

export type CallEventCallback = () => void;
export type ParticipantEventCallback = (participant: RemoteParticipant) => void;
export type TrackEventCallback = (track: Track, participant: RemoteParticipant) => void;

class LiveKitService {
  private room: Room | null = null;
  private isConnected: boolean = false;
  private currentRoomName: string | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private localVideoTrack: LocalVideoTrack | null = null;
  private isVideoEnabled: boolean = false;
  private isFrontCamera: boolean = true; // Front camera by default

  // CRITICAL: Track if any participant has ever connected (sticky flag)
  private hasConnectedParticipant: boolean = false;

  // Event callbacks
  private onConnectedCallback: CallEventCallback | null = null;
  private onDisconnectedCallback: CallEventCallback | null = null;
  private onParticipantConnectedCallback: ParticipantEventCallback | null = null;
  private onParticipantDisconnectedCallback: ParticipantEventCallback | null = null;
  private onTrackSubscribedCallback: TrackEventCallback | null = null;
  private onVideoTrackSubscribedCallback: TrackEventCallback | null = null;

  /**
   * Generate call token from backend
   */
  async generateCallToken(conversationId: number, otherUserId: number): Promise<CallTokenResponse> {
    try {
      const response = await apiClient.post<CallTokenResponse>(
        API_CONFIG.ENDPOINTS.MESSENGER.CALL_TOKEN,
        { conversationId, otherUserId }
      );

      return response.data;
    } catch (error: any) {
      logger.error('❌ [LiveKit] Error generating call token:', {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        conversationId,
        otherUserId,
      });
      throw error;
    }
  }

  /**
   * Connect to LiveKit room with improved error handling and retry mechanism
   */
  async connect(token: string, roomName: string, serverUrl: string, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 2;

    try {
      if (this.room && this.isConnected) {
        await this.disconnect();
      }

      // Create Room with React Native compatible options
      this.room = new Room({
        // Use default WebSocket implementation for React Native
        // livekit-client will use the registered WebRTC globals
        adaptiveStream: true,
        dynacast: true,
      });
      this.currentRoomName = roomName;

      // Setup event listeners
      this.room.on(RoomEvent.Connected, () => {
        this.isConnected = true;
        this.onConnectedCallback?.();
        this.publishAudio();

        // CRITICAL: Check if there are already participants in the room
        // If yes, mark as connected immediately
        if (!this.room) return;

        const participants = Array.from(this.room.remoteParticipants.values());
        if (participants.length > 0) {
          this.hasConnectedParticipant = true;
          logger.debug('✅ [LiveKit] Found existing participants on connect, marking as connected');
        }
      });

      this.room.on(RoomEvent.Disconnected, () => {
        this.isConnected = false;
        this.onDisconnectedCallback?.();
      });


      this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        this.onParticipantDisconnectedCallback?.(participant);
      });

      this.room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant: RemoteParticipant) => {
        // CRITICAL: Mark that a participant track was subscribed (conversation started)
        this.hasConnectedParticipant = true;
        logger.debug('✅ [LiveKit] Track subscribed, marking hasConnectedParticipant = true');

        if (track.kind === 'audio') {
          this.onTrackSubscribedCallback?.(track, participant);
        } else if (track.kind === 'video') {
          // CRITICAL: Force enable track at all levels for mobile-web compatibility

          // Enable mediaStreamTrack first
          if (track.mediaStreamTrack) {
            track.mediaStreamTrack.enabled = true;
          }

          // CRITICAL: Force enable track at LiveKit level
          // track.enabled can be undefined, so we need to check and set it
          if (!(track as any).enabled) {
            try {
              // Try setEnabled first (preferred method)
              if (typeof (track as any).setEnabled === 'function') {
                (track as any).setEnabled(true);
              }
              // Also try direct assignment as fallback
              if ((track as any).enabled !== true) {
                (track as any).enabled = true;
              }
            } catch (e) {
              logger.error('⚠️ [LiveKit] Could not enable track:', e);
            }
          }

          // Small delay to ensure track is fully ready before callback
          setTimeout(() => {
            this.onVideoTrackSubscribedCallback?.(track, participant);
          }, 150);
        }
      });

      // Handle TrackPublished event - subscribe immediately when track is published
      this.room.on(RoomEvent.TrackPublished, (publication, participant: RemoteParticipant) => {
        // Subscribe to video tracks immediately when published (for remote participants)
        if (publication.kind === 'video' && participant.identity !== this.room?.localParticipant?.identity) {
          try {
            publication.setSubscribed(true);
          } catch (e) {
            logger.error('⚠️ [LiveKit] Error subscribing to published track:', e);
          }

          // Also trigger callback immediately if track is already available
          if (publication.track && publication.track.mediaStreamTrack) {
            // Small delay to ensure track is fully ready
            setTimeout(() => {
              this.onVideoTrackSubscribedCallback?.(publication.track!, participant);
            }, 150);
          }
        }
      });

      // Handle TrackUnpublished event - clear remote video when track is unpublished
      this.room.on(RoomEvent.TrackUnpublished, (publication, participant: RemoteParticipant) => {
        // If video track is unpublished, notify callback (will be handled by CallScreen)
        if (publication.kind === 'video' && participant.identity !== this.room?.localParticipant?.identity) {
          // Don't immediately clear - wait a bit in case it's republished
          // Some mobile-web connections have temporary unpublish/republish cycles
          setTimeout(() => {
            // Check if track is still unpublished
            const stillUnpublished = !Array.from(participant.videoTrackPublications.values())
              .some(pub => pub.trackSid === publication.trackSid && pub.track);
            if (stillUnpublished) {
              this.onVideoTrackSubscribedCallback?.(null as any, participant);
            }
          }, 1000);
        }
      });

      // Handle existing participants' tracks when connecting
      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        // CRITICAL: Mark that a participant has connected
        this.hasConnectedParticipant = true;
        logger.debug('✅ [LiveKit] Participant connected, marking hasConnectedParticipant = true');

        // Subscribe to existing audio tracks
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            this.onTrackSubscribedCallback?.(publication.track, participant);
          }
        });

        // CRITICAL: Subscribe to ALL video tracks immediately, even if not subscribed yet
        participant.videoTrackPublications.forEach((publication) => {
          // ALWAYS force subscribe to video tracks (critical for web->mobile calls)
          if (!publication.isSubscribed) {
            try {
              publication.setSubscribed(true);
            } catch (e) {
              logger.error('⚠️ [LiveKit] Error subscribing to video track:', e);
            }
          }

          // If track is already available, trigger callback immediately
          if (publication.track && publication.track.mediaStreamTrack) {
            // Ensure track is enabled
            publication.track.mediaStreamTrack.enabled = true;

            // Enable at LiveKit level too
            if (!(publication.track as any).enabled && (publication.track as any).setEnabled) {
              try {
                (publication.track as any).setEnabled(true);
              } catch (e) {
                logger.error('⚠️ [LiveKit] Could not enable track:', e);
              }
            }

            // Use setTimeout to ensure track is fully ready
            setTimeout(() => {
              this.onVideoTrackSubscribedCallback?.(publication.track!, participant);
            }, 150);
          }
        });

        this.onParticipantConnectedCallback?.(participant);
      });

      // Connect to room - simplified URL handling for LiveKit Cloud
      let wsUrl = serverUrl;

      // Check if this is a LiveKit Cloud URL
      const isLiveKitCloud = wsUrl.includes('.livekit.cloud') || wsUrl.includes('livekit.cloud');

      // Ensure URL has proper protocol (wss:// for LiveKit Cloud, ws:// for local dev)
      if (!wsUrl.startsWith('wss://') && !wsUrl.startsWith('ws://') && !wsUrl.startsWith('https://') && !wsUrl.startsWith('http://')) {
        wsUrl = isLiveKitCloud ? `wss://${wsUrl}` : (__DEV__ ? `ws://${wsUrl}` : `wss://${wsUrl}`);
      }

      // For local development, replace localhost with Android emulator IP
      if (__DEV__ && !isLiveKitCloud && (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1'))) {
        wsUrl = wsUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
      }

      await this.room.connect(wsUrl, token);

      // CRITICAL: After connection, check for already connected participants and subscribe to their video tracks
      // This is especially important when web calls mobile - web is already connected with video
      // Check immediately and also after a short delay to catch tracks that might be loading
      const checkExistingParticipants = () => {
        try {
          // DEFENSIVE: Ensure room still exists and is connected
          if (!this.room || !this.isConnected) {
            logger.debug('⚠️ [LiveKit] Skipping checkExistingParticipants - room disconnected');
            return;
          }

          if (!this.room.remoteParticipants) {
            logger.debug('⚠️ [LiveKit] Skipping checkExistingParticipants - remoteParticipants undefined');
            return;
          }

          const remoteParticipants = Array.from(this.room.remoteParticipants.values());

          remoteParticipants.forEach((participant) => {
            participant.videoTrackPublications.forEach((publication) => {
              // Force subscribe if not already subscribed
              if (!publication.isSubscribed) {
                try {
                  publication.setSubscribed(true);
                } catch (e) {
                  logger.error('⚠️ [LiveKit] Error subscribing to video track:', e);
                }
              }

              // If track is available, trigger callback
              if (publication.track && publication.track.mediaStreamTrack) {
                publication.track.mediaStreamTrack.enabled = true;

                if (!(publication.track as any).enabled && (publication.track as any).setEnabled) {
                  try {
                    (publication.track as any).setEnabled(true);
                  } catch (e) {
                    logger.error('⚠️ [LiveKit] Could not enable track:', e);
                  }
                }

                this.onVideoTrackSubscribedCallback?.(publication.track!, participant);
              }
            });
          });
        } catch (error) {
          logger.error('❌ [LiveKit] Error checking existing participants:', error);
        }
      };

      // Check immediately
      checkExistingParticipants();

      // Also check after short delays for tracks that might still be loading
      // BUT only if we are still connected
      const delayedCheck = (delay: number) => {
        setTimeout(() => {
          if (this.isConnected && this.room) {
            checkExistingParticipants();
          }
        }, delay);
      };

      delayedCheck(300);
      delayedCheck(800);
      delayedCheck(1500);

    } catch (error: any) {
      logger.error('❌ [LiveKit] Connection error:', error);
      this.isConnected = false;

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 2000 * (retryCount + 1))); // Exponential backoff
        return this.connect(token, roomName, serverUrl, retryCount + 1);
      }

      // Generate user-friendly error message
      let userMessage = 'Неуспешно свързване с LiveKit server';

      if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
        userMessage = 'Връзката изтече. Провери интернет свързаността си.';
      } else if (error?.message?.includes('404')) {
        userMessage = 'Стаята не е намерена. Моля, опитай отново.';
      } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
        userMessage = 'Невалиден токен за достъп. Моля, опитай отново.';
      } else if (error?.message?.includes('network') || error?.message?.includes('Network')) {
        userMessage = 'Проблем с мрежата. Провери интернет свързаността си.';
      } else if (error?.message?.includes('WebRTC')) {
        userMessage = 'Проблем с WebRTC инициализацията. Рестартирай приложението.';
      }

      // Add user message to error
      error.userMessage = userMessage;
      throw error;
    }
  }

  /**
   * Publish local audio track
   */
  private async publishAudio(): Promise<void> {
    if (!this.room || !this.isConnected) return;

    try {
      // Create local audio track using React Native API
      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      // Publish to room
      await this.room.localParticipant.publishTrack(this.localAudioTrack);
    } catch (error) {
      logger.error('Error publishing audio:', error);
    }
  }

  /**
   * Disconnect from room
   */
  async disconnect(): Promise<void> {
    try {
      // Stop video track
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack = null;
      }
      this.isVideoEnabled = false;

      // Stop audio track
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }

      if (this.room) {
        await this.room.disconnect();
        this.room = null;
      }

      this.isConnected = false;
      this.currentRoomName = null;
      // CRITICAL: Reset hasConnectedParticipant flag for next call
      this.hasConnectedParticipant = false;
    } catch (error) {
      logger.error('Error disconnecting from LiveKit room:', error);
    }
  }

  /**
   * Toggle microphone mute/unmute
   */
  async toggleMute(): Promise<boolean> {
    if (!this.localAudioTrack) return false;

    const isMuted = this.localAudioTrack.isMuted;
    await (this.localAudioTrack as any).setMuted(!isMuted);
    return !isMuted;
  }

  /**
   * Set microphone enabled/disabled
   */
  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    const isMuted = (this.localAudioTrack as any).isMuted;
    await (this.localAudioTrack as any).setEnabled(enabled);
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    return (this.localAudioTrack as any)?.isMuted ?? false;
  }

  /**
   * Get room participants
   */
  getParticipants(): RemoteParticipant[] {
    if (!this.room) return [];
    return Array.from(this.room.remoteParticipants.values());
  }

  /**
   * Get connection state
   */
  getConnectionState(): boolean {
    return this.isConnected && this.room !== null;
  }

  /**
   * Event listeners
   */
  /**
   * Register callback за connected event
   * @returns Cleanup function за премахване на callback
   */
  onConnected(callback: CallEventCallback): () => void {
    this.onConnectedCallback = callback;
    return () => {
      if (this.onConnectedCallback === callback) {
        this.onConnectedCallback = null;
      }
    };
  }

  /**
   * Register callback за disconnected event
   * @returns Cleanup function за премахване на callback
   */
  onDisconnected(callback: CallEventCallback): () => void {
    this.onDisconnectedCallback = callback;
    return () => {
      if (this.onDisconnectedCallback === callback) {
        this.onDisconnectedCallback = null;
      }
    };
  }

  /**
   * Register callback за participant connected event
   * @returns Cleanup function за премахване на callback
   */
  onParticipantConnected(callback: ParticipantEventCallback): () => void {
    this.onParticipantConnectedCallback = callback;
    return () => {
      if (this.onParticipantConnectedCallback === callback) {
        this.onParticipantConnectedCallback = null;
      }
    };
  }

  /**
   * Register callback за participant disconnected event
   * @returns Cleanup function за премахване на callback
   */
  onParticipantDisconnected(callback: ParticipantEventCallback): () => void {
    this.onParticipantDisconnectedCallback = callback;
    return () => {
      if (this.onParticipantDisconnectedCallback === callback) {
        this.onParticipantDisconnectedCallback = null;
      }
    };
  }

  /**
   * Register callback за track subscribed event
   * @returns Cleanup function за премахване на callback
   */
  onTrackSubscribed(callback: TrackEventCallback): () => void {
    this.onTrackSubscribedCallback = callback;
    return () => {
      if (this.onTrackSubscribedCallback === callback) {
        this.onTrackSubscribedCallback = null;
      }
    };
  }

  /**
   * Register callback за video track subscribed event
   * @returns Cleanup function за премахване на callback
   */
  onVideoTrackSubscribed(callback: TrackEventCallback): () => void {
    this.onVideoTrackSubscribedCallback = callback;
    return () => {
      if (this.onVideoTrackSubscribedCallback === callback) {
        this.onVideoTrackSubscribedCallback = null;
      }
    };
  }

  /**
   * Toggle camera on/off during active call
   * COST OPTIMIZATION: Unpublishes video track when disabled to save money
   */
  async toggleCamera(enabled: boolean): Promise<boolean> {
    if (!this.room || !this.isConnected) {
      return false;
    }

    try {
      if (enabled) {
        // Unpublish existing video tracks first
        const existingVideoTracks = Array.from(this.room.localParticipant.videoTrackPublications.values());
        for (const publication of existingVideoTracks) {
          if (publication.track) {
            await this.room.localParticipant.unpublishTrack(publication.track);
            publication.track.stop();
          }
        }

        // Stop existing local video track if any
        if (this.localVideoTrack) {
          this.localVideoTrack.stop();
          this.localVideoTrack = null;
        }

        // Create new video track using React Native API
        // Use lower resolution for emulator (better compatibility)
        // Emulators often have issues with high resolution video
        const isEmulator = __DEV__ && Platform.OS === 'android';
        const resolution = isEmulator
          ? { width: 640, height: 480 } // Lower resolution for emulator
          : { width: 1280, height: 720 }; // Higher resolution for real device

        try {
          this.localVideoTrack = await createLocalVideoTrack({
            facingMode: this.isFrontCamera ? 'user' : 'environment',
            resolution,
          });
        } catch (error: any) {
          logger.error('❌ [toggleCamera] Failed to create video track:', error);

          // Fallback: Try with even lower resolution for emulator
          if (isEmulator) {
            try {
              this.localVideoTrack = await createLocalVideoTrack({
                facingMode: this.isFrontCamera ? 'user' : 'environment',
                resolution: { width: 320, height: 240 }, // Minimal resolution
              });
            } catch (retryError: any) {
              logger.error('❌ [toggleCamera] Failed even with minimal resolution:', retryError);
              throw new Error(`Camera not available: ${retryError?.message || 'Unknown error'}. На emulator камерите често не работят. Тествай на реален телефон.`);
            }
          } else {
            throw error;
          }
        }

        // Publish video track (this starts billing as video call)
        await this.room.localParticipant.publishTrack(this.localVideoTrack, {
          source: Track.Source.Camera,
          videoCodec: 'vp8', // Better compatibility
        });

        this.isVideoEnabled = true;

        // CRITICAL: Ensure track is fully ready before returning
        // Wait a bit for track to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // Unpublish all video tracks
        const existingVideoTracks = Array.from(this.room.localParticipant.videoTrackPublications.values());
        for (const publication of existingVideoTracks) {
          if (publication.track) {
            try {
              await this.room.localParticipant.unpublishTrack(publication.track);
              if (publication.track.stop) {
                publication.track.stop();
              }
            } catch (error) {
              logger.error('⚠️ [toggleCamera] Error unpublishing track:', error);
            }
          }
        }

        // Stop and cleanup local video track
        if (this.localVideoTrack) {
          try {
            if (this.localVideoTrack.stop) {
              this.localVideoTrack.stop();
            }
          } catch (error) {
            logger.error('⚠️ [toggleCamera] Error stopping local video track:', error);
          }
          this.localVideoTrack = null;
        }

        this.isVideoEnabled = false;
      }
      return true;
    } catch (error) {
      logger.error('❌ [toggleCamera] Failed to toggle camera:', error);
      return false;
    }
  }

  /**
   * Check if camera is currently enabled
   */
  isCameraEnabled(): boolean {
    if (!this.room || !this.isConnected) return false;
    return this.isVideoEnabled || this.room.localParticipant.isCameraEnabled;
  }

  /**
   * Get local video track for preview
   */
  getLocalVideoTrack(): LocalVideoTrack | null {
    return this.localVideoTrack;
  }

  /**
   * Switch between front and back camera
   */
  async flipCamera(): Promise<boolean> {
    if (!this.room || !this.isConnected || !this.isVideoEnabled) {
      return false;
    }

    try {
      // Toggle camera facing mode
      this.isFrontCamera = !this.isFrontCamera;

      // Re-enable camera with new facing mode
      await this.toggleCamera(false); // Disable first
      await this.toggleCamera(true);  // Re-enable with new facing mode

      return true;
    } catch (error) {
      logger.error('❌ [flipCamera] Failed to flip camera:', error);
      // Restore previous facing mode on error
      this.isFrontCamera = !this.isFrontCamera;
      return false;
    }
  }

  /**
   * Get current camera facing mode
   */
  isFrontCameraActive(): boolean {
    return this.isFrontCamera;
  }

  /**
   * Check if any participant has ever connected (for call history)
   */
  hasParticipantEverConnected(): boolean {
    return this.hasConnectedParticipant;
  }

  /**
   * Reset hasConnectedParticipant flag (for new call)
   */
  resetConnectionTracking(): void {
    this.hasConnectedParticipant = false;
  }
}

export const liveKitService = new LiveKitService();

