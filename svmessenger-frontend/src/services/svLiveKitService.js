/**
 * LiveKit Service за SVMessenger voice calls
 * Управлява Room connection, audio tracks и event handling
 */

import { Room, RoomEvent, Track } from 'livekit-client';

class SVLiveKitService {
  constructor() {
    this.room = null;
    this.isConnected = false;
    this.currentRoomName = null;

    // Event callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onParticipantConnected = null;
    this.onParticipantDisconnected = null;
    this.onTrackSubscribed = null;
    this.onTrackUnsubscribed = null;
  }

  /**
   * Connect to LiveKit room
   */
  async connect(token, roomName) {
    try {
      if (this.room && this.isConnected) {
        await this.disconnect();
      }

      this.room = new Room();
      this.currentRoomName = roomName;

      // Setup event listeners
      this.room.on(RoomEvent.Connected, () => {
        this.isConnected = true;
        console.log('Connected to LiveKit room:', roomName);
        if (this.onConnected) this.onConnected();
      });

      this.room.on(RoomEvent.Disconnected, () => {
        this.isConnected = false;
        console.log('Disconnected from LiveKit room');
        if (this.onDisconnected) this.onDisconnected();
      });

      this.room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
        if (this.onParticipantConnected) this.onParticipantConnected(participant);
      });

      this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
        if (this.onParticipantDisconnected) this.onParticipantDisconnected(participant);
      });

      this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, 'from', participant.identity);
        if (this.onTrackSubscribed) this.onTrackSubscribed(track, publication, participant);
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
        if (this.onTrackUnsubscribed) this.onTrackUnsubscribed(track, publication, participant);
      });

      // Connect to room
      await this.room.connect('wss://smolyanvote-nq17fbx3.livekit.cloud', token);

      return true;
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from room
   */
  async disconnect() {
    try {
      if (this.room) {
        await this.room.disconnect();
        this.room = null;
        this.isConnected = false;
        this.currentRoomName = null;
      }
    } catch (error) {
      console.error('Error disconnecting from LiveKit:', error);
    }
  }

  /**
   * Toggle microphone on/off
   */
  async toggleMicrophone(enabled) {
    try {
      if (!this.room || !this.isConnected) {
        throw new Error('Not connected to room');
      }

      const localParticipant = this.room.localParticipant;

      if (enabled) {
        // Enable microphone
        await localParticipant.setMicrophoneEnabled(true);
      } else {
        // Disable microphone
        await localParticipant.setMicrophoneEnabled(false);
      }

      return enabled;
    } catch (error) {
      console.error('Error toggling microphone:', error);
      throw error;
    }
  }

  /**
   * Get microphone enabled state
   */
  isMicrophoneEnabled() {
    if (!this.room || !this.isConnected) return false;
    return this.room.localParticipant.isMicrophoneEnabled;
  }

  /**
   * Get room participants
   */
  getParticipants() {
    if (!this.room) return [];
    return Array.from(this.room.participants.values());
  }

  /**
   * Get local participant
   */
  getLocalParticipant() {
    if (!this.room) return null;
    return this.room.localParticipant;
  }

  /**
   * Setup event callbacks
   */
  setEventCallbacks(callbacks) {
    this.onConnected = callbacks.onConnected;
    this.onDisconnected = callbacks.onDisconnected;
    this.onParticipantConnected = callbacks.onParticipantConnected;
    this.onParticipantDisconnected = callbacks.onParticipantDisconnected;
    this.onTrackSubscribed = callbacks.onTrackSubscribed;
    this.onTrackUnsubscribed = callbacks.onTrackUnsubscribed;
  }
}

// Export singleton instance
const svLiveKitService = new SVLiveKitService();
export default svLiveKitService;
