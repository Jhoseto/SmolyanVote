/**
 * LiveKit Service for React Native
 * Управление на voice и video calls чрез LiveKit
 * Базирано на web версията (svLiveKitService.js) за съвместимост
 */

import { Room, RoomEvent, Track, LocalAudioTrack, LocalVideoTrack, RemoteParticipant } from 'livekit-client';
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
    } catch (error) {
      console.error('Error generating call token:', error);
      throw error;
    }
  }

  /**
   * Connect to LiveKit room
   */
  async connect(token: string, roomName: string, serverUrl: string): Promise<void> {
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
        console.log('Track subscribed:', track.kind, participant.identity);
        if (track.kind === 'audio') {
          this.onTrackSubscribedCallback?.(track, participant);
        } else if (track.kind === 'video') {
          this.onVideoTrackSubscribedCallback?.(track, participant);
        }
      });

      // Handle existing participants' tracks when connecting
      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);
        
        // Subscribe to existing audio tracks
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            this.onTrackSubscribedCallback?.(publication.track, participant);
          }
        });
        
        // Subscribe to existing video tracks
        participant.videoTrackPublications.forEach((publication) => {
          if (publication.track) {
            this.onVideoTrackSubscribedCallback?.(publication.track, participant);
          }
        });
        
        this.onParticipantConnectedCallback?.(participant);
      });

      // Connect to room
      // For Android emulator, convert wss:// to ws:// and localhost to 10.0.2.2
      let wsUrl = serverUrl;
      
      // If running on Android emulator and URL contains localhost, replace with emulator IP
      if (__DEV__ && (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1'))) {
        wsUrl = wsUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
      }
      
      // Ensure URL has proper protocol
      if (!wsUrl.startsWith('wss://') && !wsUrl.startsWith('ws://')) {
        // Default to wss:// for production, ws:// for development
        wsUrl = __DEV__ ? `ws://${wsUrl}` : `wss://${wsUrl}`;
      }
      
      // For Android emulator in development, use ws:// instead of wss://
      if (__DEV__ && wsUrl.startsWith('wss://')) {
        wsUrl = wsUrl.replace('wss://', 'ws://');
      }
      
      console.log('🔌 [LiveKit] Connecting to:', wsUrl, 'Room:', roomName, 'Token length:', token?.length || 0);
      
      try {
        // Connect to LiveKit room
        // Note: Room.connect(url, token) - third parameter is not standard, using just url and token
        await this.room.connect(wsUrl, token);
        console.log('✅ [LiveKit] Successfully connected to LiveKit room');
      } catch (connectError: any) {
        console.error('❌ [LiveKit] Connection error details:', {
          error: connectError,
          message: connectError?.message,
          code: connectError?.code,
          name: connectError?.name,
          wsUrl,
          roomName,
          tokenLength: token?.length || 0,
          hasWebRTC: typeof global.RTCPeerConnection !== 'undefined',
        });
        
        // More detailed error logging
        if (connectError?.message?.includes('WebRTC')) {
          console.error('❌ [LiveKit] WebRTC not properly initialized. Check WebRTC globals registration.');
        }
        if (connectError?.message?.includes('websocket')) {
          console.error('❌ [LiveKit] WebSocket connection failed. Check server URL and network connectivity.');
        }
        
        throw connectError;
      }
    } catch (error) {
      console.error('Error connecting to LiveKit room:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Publish local audio track
   */
  private async publishAudio(): Promise<void> {
    if (!this.room || !this.isConnected) return;

    try {
      // Create local audio track
      this.localAudioTrack = await LocalAudioTrack.createLocalAudioTrack({
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

        // Create new video track
        this.localVideoTrack = await LocalVideoTrack.createLocalVideoTrack({
          facingMode: 'user', // Front camera by default
          resolution: {
            width: 1280,
            height: 720,
          },
        });

        // Publish video track (this starts billing as video call)
        await this.room.localParticipant.publishTrack(this.localVideoTrack, {
          source: 'camera'
        });

        this.isVideoEnabled = true;
        console.log('✅ [toggleCamera] Camera enabled - VIDEO TRACK PUBLISHED');
      } else {
        console.log('🎥 [toggleCamera] DISABLING camera...');
        
        // Unpublish all video tracks
        const existingVideoTracks = Array.from(this.room.localParticipant.videoTrackPublications.values());
        for (const publication of existingVideoTracks) {
          if (publication.track) {
            await this.room.localParticipant.unpublishTrack(publication.track);
            publication.track.stop();
          }
        }

        // Stop and cleanup local video track
        if (this.localVideoTrack) {
          this.localVideoTrack.stop();
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
}

export const liveKitService = new LiveKitService();

