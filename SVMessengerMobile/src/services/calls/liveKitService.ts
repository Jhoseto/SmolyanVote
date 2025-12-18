/**
 * LiveKit Service for React Native
 * Управление на voice calls чрез LiveKit
 */

import { Room, RoomEvent, Track, LocalAudioTrack, RemoteParticipant } from 'livekit-client';
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

  // Event callbacks
  private onConnectedCallback: CallEventCallback | null = null;
  private onDisconnectedCallback: CallEventCallback | null = null;
  private onParticipantConnectedCallback: ParticipantEventCallback | null = null;
  private onParticipantDisconnectedCallback: ParticipantEventCallback | null = null;
  private onTrackSubscribedCallback: TrackEventCallback | null = null;

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

      this.room = new Room();
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

      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);
        this.onParticipantConnectedCallback?.(participant);
      });

      this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('Participant disconnected:', participant.identity);
        this.onParticipantDisconnectedCallback?.(participant);
      });

      this.room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant: RemoteParticipant) => {
        console.log('Track subscribed:', track.kind, participant.identity);
        if (track.kind === 'audio') {
          this.onTrackSubscribedCallback?.(track, participant);
        }
      });

      // Connect to room (ensure URL starts with wss://)
      const wsUrl = serverUrl.startsWith('wss://') || serverUrl.startsWith('ws://')
        ? serverUrl
        : `wss://${serverUrl}`;
      await this.room.connect(wsUrl, token);
      console.log('Successfully connected to LiveKit room');
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
}

export const liveKitService = new LiveKitService();

