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
      console.log('🔑 [LiveKit] Requesting call token from backend:', {
        endpoint: API_CONFIG.ENDPOINTS.MESSENGER.CALL_TOKEN,
        conversationId,
        otherUserId,
      });
      
      const response = await apiClient.post<CallTokenResponse>(
        API_CONFIG.ENDPOINTS.MESSENGER.CALL_TOKEN,
        { conversationId, otherUserId }
      );
      
      console.log('🔑 [LiveKit] Call token response received:', {
        hasToken: !!response.data?.token,
        hasRoomName: !!response.data?.roomName,
        hasServerUrl: !!response.data?.serverUrl,
        tokenLength: response.data?.token?.length || 0,
        roomName: response.data?.roomName,
        serverUrl: response.data?.serverUrl,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [LiveKit] Error generating call token:', {
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
        console.log('LiveKit room connected');
        this.isConnected = true;
        this.onConnectedCallback?.();
        this.publishAudio();
      });

      this.room.on(RoomEvent.Disconnected, () => {
        console.log('LiveKit room disconnected');
        this.isConnected = false;
        this.onDisconnectedCallback?.();
      });


      this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('Participant disconnected:', participant.identity);
        this.onParticipantDisconnectedCallback?.(participant);
      });

      this.room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant: RemoteParticipant) => {
        console.log('📹 [LiveKit] Track subscribed:', {
          kind: track.kind,
          sid: track.sid,
          participantId: participant.identity,
          hasMediaStreamTrack: !!track.mediaStreamTrack,
          enabled: track.enabled,
          isMuted: track.isMuted,
          mediaStreamTrackActive: track.mediaStreamTrack?.active,
          mediaStreamTrackEnabled: track.mediaStreamTrack?.enabled,
          mediaStreamTrackReadyState: track.mediaStreamTrack?.readyState,
        });
        
        if (track.kind === 'audio') {
          this.onTrackSubscribedCallback?.(track, participant);
        } else if (track.kind === 'video') {
          // CRITICAL: Ensure track is fully enabled and active
          if (track.mediaStreamTrack) {
            track.mediaStreamTrack.enabled = true;
            // Force play if possible
            if (track.mediaStreamTrack.readyState === 'live') {
              console.log('✅ [LiveKit] Video track is live and ready');
            }
          }
          
          // Enable track at LiveKit level too
          if (!track.enabled && track.setEnabled) {
            try {
              track.setEnabled(true);
              console.log('✅ [LiveKit] Enabled video track at LiveKit level');
            } catch (e) {
              console.warn('⚠️ [LiveKit] Could not enable track:', e);
            }
          }
          
          // Small delay to ensure track is fully ready before callback
          setTimeout(() => {
            this.onVideoTrackSubscribedCallback?.(track, participant);
          }, 100);
        }
      });

      // Handle TrackPublished event - subscribe immediately when track is published
      this.room.on(RoomEvent.TrackPublished, (publication, participant: RemoteParticipant) => {
        console.log('📹 [LiveKit] Track published:', {
          kind: publication.kind,
          sid: publication.trackSid,
          participantId: participant.identity,
          source: publication.source,
          isLocal: participant === this.room?.localParticipant,
        });
        
        // Subscribe to video tracks immediately when published (for remote participants)
        if (publication.kind === 'video' && participant !== this.room?.localParticipant) {
          console.log('📹 [LiveKit] Auto-subscribing to remote video track');
          publication.setSubscribed(true);
          
          // Also trigger callback immediately if track is already available
          if (publication.track && publication.track.mediaStreamTrack) {
            console.log('📹 [LiveKit] Remote video track available immediately, triggering callback');
            this.onVideoTrackSubscribedCallback?.(publication.track, participant);
          }
        }
      });

      // Handle existing participants' tracks when connecting
      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('📹 [LiveKit] Participant connected:', participant.identity);
        
        // Subscribe to existing audio tracks
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            this.onTrackSubscribedCallback?.(publication.track, participant);
          }
        });
        
        // CRITICAL: Subscribe to ALL video tracks immediately, even if not subscribed yet
        participant.videoTrackPublications.forEach((publication) => {
          console.log('📹 [LiveKit] Found existing video publication:', {
            sid: publication.trackSid,
            isSubscribed: publication.isSubscribed,
            hasTrack: !!publication.track,
            kind: publication.kind,
            source: publication.source,
          });
          
          // ALWAYS force subscribe to video tracks (critical for web->mobile calls)
          if (!publication.isSubscribed) {
            console.log('📹 [LiveKit] Force subscribing to existing video track');
            try {
              publication.setSubscribed(true);
            } catch (e) {
              console.warn('⚠️ [LiveKit] Error subscribing to video track:', e);
            }
          }
          
          // If track is already available, trigger callback immediately
          if (publication.track && publication.track.mediaStreamTrack) {
            // Ensure track is enabled
            publication.track.mediaStreamTrack.enabled = true;
            
            // Enable at LiveKit level too
            if (!publication.track.enabled && publication.track.setEnabled) {
              try {
                publication.track.setEnabled(true);
              } catch (e) {
                console.warn('⚠️ [LiveKit] Could not enable track:', e);
              }
            }
            
            console.log('📹 [LiveKit] Triggering callback for existing video track immediately');
            // Use setTimeout to ensure track is fully ready
            setTimeout(() => {
              this.onVideoTrackSubscribedCallback?.(publication.track!, participant);
            }, 150);
          } else {
            // Track not available yet, wait for TrackSubscribed event
            console.log('📹 [LiveKit] Video track not available yet, will be notified via TrackSubscribed');
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
      
      console.log('🔌 [LiveKit] Connecting to:', wsUrl, 'Room:', roomName);
      
      await this.room.connect(wsUrl, token);
      console.log('✅ [LiveKit] Successfully connected to LiveKit room');
      
      // CRITICAL: After connection, check for already connected participants and subscribe to their video tracks
      // This is especially important when web calls mobile - web is already connected with video
      // Check immediately and also after a short delay to catch tracks that might be loading
      const checkExistingParticipants = () => {
        try {
          const remoteParticipants = Array.from(this.room!.remoteParticipants.values());
          console.log('📹 [LiveKit] Checking for existing participants after connection:', remoteParticipants.length);
          
          remoteParticipants.forEach((participant) => {
            console.log('📹 [LiveKit] Processing existing participant:', participant.identity);
            
            participant.videoTrackPublications.forEach((publication) => {
              console.log('📹 [LiveKit] Found video publication on existing participant:', {
                sid: publication.trackSid,
                isSubscribed: publication.isSubscribed,
                hasTrack: !!publication.track,
                kind: publication.kind,
              });
              
              // Force subscribe if not already subscribed
              if (!publication.isSubscribed) {
                console.log('📹 [LiveKit] Force subscribing to video track from existing participant');
                try {
                  publication.setSubscribed(true);
                } catch (e) {
                  console.warn('⚠️ [LiveKit] Error subscribing to video track:', e);
                }
              }
              
              // If track is available, trigger callback
              if (publication.track && publication.track.mediaStreamTrack) {
                publication.track.mediaStreamTrack.enabled = true;
                
                if (!publication.track.enabled && publication.track.setEnabled) {
                  try {
                    publication.track.setEnabled(true);
                  } catch (e) {
                    console.warn('⚠️ [LiveKit] Could not enable track:', e);
                  }
                }
                
                console.log('📹 [LiveKit] Triggering callback for existing participant video track');
                this.onVideoTrackSubscribedCallback?.(publication.track!, participant);
              }
            });
          });
        } catch (error) {
          console.error('❌ [LiveKit] Error checking existing participants:', error);
        }
      };
      
      // Check immediately
      checkExistingParticipants();
      // Also check after short delay for tracks that might still be loading
      setTimeout(checkExistingParticipants, 300);
      setTimeout(checkExistingParticipants, 800);
      
    } catch (error: any) {
      console.error('❌ [LiveKit] Connection error:', error);
      this.isConnected = false;
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 [LiveKit] Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
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
      console.log('Audio track published');
    } catch (error) {
      console.error('Error publishing audio:', error);
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
      console.log('Disconnected from LiveKit room');
    } catch (error) {
      console.error('Error disconnecting from LiveKit room:', error);
    }
  }

  /**
   * Toggle microphone mute/unmute
   */
  async toggleMute(): Promise<boolean> {
    if (!this.localAudioTrack) return false;

    const isMuted = this.localAudioTrack.isMuted;
    await this.localAudioTrack.setMuted(!isMuted);
    return !isMuted;
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    return this.localAudioTrack?.isMuted ?? false;
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
    return this.isConnected && (this.room?.isConnected ?? false);
  }

  /**
   * Event listeners
   */
  onConnected(callback: CallEventCallback): void {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback: CallEventCallback): void {
    this.onDisconnectedCallback = callback;
  }

  onParticipantConnected(callback: ParticipantEventCallback): void {
    this.onParticipantConnectedCallback = callback;
  }

  onParticipantDisconnected(callback: ParticipantEventCallback): void {
    this.onParticipantDisconnectedCallback = callback;
  }

  onTrackSubscribed(callback: TrackEventCallback): void {
    this.onTrackSubscribedCallback = callback;
  }

  onVideoTrackSubscribed(callback: TrackEventCallback): void {
    this.onVideoTrackSubscribedCallback = callback;
  }

  /**
   * Toggle camera on/off during active call
   * COST OPTIMIZATION: Unpublishes video track when disabled to save money
   */
  async toggleCamera(enabled: boolean): Promise<boolean> {
    console.log('🎥 [toggleCamera] START', { enabled, hasRoom: !!this.room, isConnected: this.isConnected });
    
    if (!this.room || !this.isConnected) {
      console.warn('⚠️ [toggleCamera] Cannot toggle camera - not in a call');
      return false;
    }

    try {
      if (enabled) {
        console.log('🎥 [toggleCamera] ENABLING camera...');
        
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
        
        console.log('🎥 [toggleCamera] Creating video track:', {
          facingMode: this.isFrontCamera ? 'front' : 'back',
          resolution,
          isEmulator,
        });

        try {
          this.localVideoTrack = await createLocalVideoTrack({
            facingMode: this.isFrontCamera ? 'user' : 'environment',
            resolution,
          });
        } catch (error: any) {
          console.error('❌ [toggleCamera] Failed to create video track:', error);
          
          // Fallback: Try with even lower resolution for emulator
          if (isEmulator) {
            console.log('🔄 [toggleCamera] Retrying with minimal resolution for emulator...');
            try {
              this.localVideoTrack = await createLocalVideoTrack({
                facingMode: this.isFrontCamera ? 'user' : 'environment',
                resolution: { width: 320, height: 240 }, // Minimal resolution
              });
              console.log('✅ [toggleCamera] Video track created with minimal resolution');
            } catch (retryError: any) {
              console.error('❌ [toggleCamera] Failed even with minimal resolution:', retryError);
              throw new Error(`Camera not available: ${retryError?.message || 'Unknown error'}. На emulator камерите често не работят. Тествай на реален телефон.`);
            }
          } else {
            throw error;
          }
        }

        console.log('🎥 [toggleCamera] Video track created:', {
          kind: this.localVideoTrack.kind,
          enabled: this.localVideoTrack.enabled,
          muted: this.localVideoTrack.isMuted,
          facingMode: this.isFrontCamera ? 'front' : 'back',
        });

        // Publish video track (this starts billing as video call)
        const publication = await this.room.localParticipant.publishTrack(this.localVideoTrack, {
          source: 'camera',
          videoCodec: 'vp8', // Better compatibility
        });

        console.log('🎥 [toggleCamera] Video track published:', {
          sid: publication.trackSid,
          source: publication.source,
        });

        this.isVideoEnabled = true;
        console.log('✅ [toggleCamera] Camera enabled - VIDEO TRACK PUBLISHED');
      } else {
        console.log('🎥 [toggleCamera] DISABLING camera...');
        
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
              console.warn('⚠️ [toggleCamera] Error unpublishing track:', error);
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
            console.warn('⚠️ [toggleCamera] Error stopping local video track:', error);
          }
          this.localVideoTrack = null;
        }

        this.isVideoEnabled = false;
        console.log('✅ [toggleCamera] Camera disabled - now billing as audio-only call');
      }
      return true;
    } catch (error) {
      console.error('❌ [toggleCamera] Failed to toggle camera:', error);
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
      console.warn('⚠️ Cannot flip camera - camera is not enabled');
      return false;
    }

    try {
      console.log('🔄 [flipCamera] Flipping camera...');
      
      // Toggle camera facing mode
      this.isFrontCamera = !this.isFrontCamera;
      
      // Re-enable camera with new facing mode
      await this.toggleCamera(false); // Disable first
      await this.toggleCamera(true);  // Re-enable with new facing mode
      
      console.log(`✅ [flipCamera] Switched to ${this.isFrontCamera ? 'front' : 'back'} camera`);
      return true;
    } catch (error) {
      console.error('❌ [flipCamera] Failed to flip camera:', error);
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
}

export const liveKitService = new LiveKitService();

