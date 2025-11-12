/**
 * LiveKit Service за SVMessenger voice calls
 * Управлява Room connection, audio tracks и event handling
 */

import { Room, RoomEvent, Track, LocalAudioTrack } from 'livekit-client';
import svWebSocketService from './svWebSocketService.js';

class SVLiveKitService {
  constructor() {
    this.room = null;
    this.isConnected = false;
    this.currentRoomName = null;
    this.selectedMicrophone = null;
    this.selectedSpeaker = null;
    this.audioStream = null;
    this.remoteAudioElements = new Map(); // Store audio elements for remote tracks

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
        if (this.onConnected) this.onConnected();
      });

      this.room.on(RoomEvent.Disconnected, () => {
        this.isConnected = false;
        if (this.onDisconnected) this.onDisconnected();
      });

      this.room.on(RoomEvent.ParticipantConnected, (participant) => {
        // Subscribe to existing audio tracks from this participant
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            this.attachRemoteAudioTrack(publication.track, participant.identity);
          }
        });
        
        if (this.onParticipantConnected) this.onParticipantConnected(participant);
      });

      this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (this.onParticipantDisconnected) this.onParticipantDisconnected(participant);
      });

      this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        // Attach audio track to HTMLAudioElement for playback
        if (track.kind === 'audio') {
          this.attachRemoteAudioTrack(track, participant.identity);
        }
        
        if (this.onTrackSubscribed) this.onTrackSubscribed(track, publication, participant);
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        // Clean up audio element when track is unsubscribed
        if (track.kind === 'audio') {
          this.detachRemoteAudioTrack(participant.identity);
        }
        
        if (this.onTrackUnsubscribed) this.onTrackUnsubscribed(track, publication, participant);
      });

      // Connect to room
      await this.room.connect('wss://smolyanvote-nq17fbx3.livekit.cloud', token);
      
      // After connection, ensure microphone is published
      // Wait a bit more for room to be fully ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (this.selectedMicrophone && this.audioStream) {
        try {
          // Unpublish any existing tracks first
          const existingTracks = Array.from(this.room.localParticipant.audioTrackPublications.values());
          for (const publication of existingTracks) {
            if (publication.track) {
              await this.room.localParticipant.unpublishTrack(publication.track);
            }
          }
          
          // Get the audio track from the stream
          const audioTracks = this.audioStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const mediaStreamTrack = audioTracks[0];
            const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
            
            // Publish the track
            await this.room.localParticipant.publishTrack(localAudioTrack, {
              source: 'microphone'
            });
          }
        } catch (publishError) {
          // Fallback to default microphone
          try {
            await this.room.localParticipant.setMicrophoneEnabled(true);
          } catch (fallbackError) {
            console.error('Failed to enable default microphone:', fallbackError);
          }
        }
      } else if (!this.selectedMicrophone) {
        // If no microphone selected, enable default
        try {
          await this.room.localParticipant.setMicrophoneEnabled(true);
        } catch (error) {
          console.error('Failed to enable default microphone:', error);
        }
      } else {
        // Try to enable default as fallback
        try {
          await this.room.localParticipant.setMicrophoneEnabled(true);
        } catch (error) {
          console.error('Failed to enable default microphone:', error);
        }
      }

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
      // Clean up all remote audio elements
      this.remoteAudioElements.forEach((audioElement, participantIdentity) => {
        this.detachRemoteAudioTrack(participantIdentity);
      });
      this.remoteAudioElements.clear();
      
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
   * Request audio permissions and get available devices
   */
  async requestAudioPermissions() {
    try {
      // Request microphone permission with echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      this.audioStream = stream;

      // Get available devices
      await this.enumerateAudioDevices();

      return true;
    } catch (error) {
      console.error('❌ Audio permissions denied:', error);
      throw error;
    }
  }

  /**
   * Enumerate available audio devices
   */
  async enumerateAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');

      // Auto-select first available devices if not already selected
      if (microphones.length > 0 && !this.selectedMicrophone) {
        this.selectedMicrophone = microphones[0].deviceId;
      }

      if (speakers.length > 0 && !this.selectedSpeaker) {
        this.selectedSpeaker = speakers[0].deviceId;
      }

      return { microphones, speakers };
    } catch (error) {
      console.error('❌ Error enumerating devices:', error);
      throw error;
    }
  }

  /**
   * Set microphone device
   */
  async setMicrophone(deviceId) {
    try {
    this.selectedMicrophone = deviceId;

      // Stop existing stream if any
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      // Try to get audio stream with selected device
      // Use 'ideal' instead of 'exact' to allow fallback if device is not available
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { ideal: deviceId } : true,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (exactError) {
        // If ideal fails, try with default device
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      this.audioStream = newStream;

      // If LiveKit room is connected, update microphone
      if (this.room && this.isConnected) {
        try {
          // First disable and unpublish existing microphone tracks
          await this.room.localParticipant.setMicrophoneEnabled(false);
          
          // Unpublish any existing microphone tracks
          const existingTracks = Array.from(this.room.localParticipant.audioTrackPublications.values());
          for (const publication of existingTracks) {
            if (publication.track) {
              await this.room.localParticipant.unpublishTrack(publication.track);
            }
          }
          
          // Get the audio track from the MediaStream we already created
          const audioTracks = newStream.getAudioTracks();
          if (audioTracks.length === 0) {
            throw new Error('No audio track found in stream');
          }
          
          // Create LocalAudioTrack from the MediaStreamTrack
          const mediaStreamTrack = audioTracks[0];
          const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
          
          // Publish the track
          await this.room.localParticipant.publishTrack(localAudioTrack, {
            source: 'microphone'
          });
        } catch (trackError) {
          // Fallback: use LiveKit's built-in microphone
          try {
            await this.room.localParticipant.setMicrophoneEnabled(true);
          } catch (fallbackError) {
            console.error('Failed to enable default microphone:', fallbackError);
          }
        }
      }
    } catch (error) {
      // Don't throw - allow fallback to default device
      try {
        // Try with default device
        const defaultStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.audioStream = defaultStream;
      } catch (fallbackError) {
        console.error('Failed to get any microphone:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Attach remote audio track to HTMLAudioElement for playback
   */
  attachRemoteAudioTrack(track, participantIdentity) {
    try {
      // Remove existing audio element for this participant if any
      this.detachRemoteAudioTrack(participantIdentity);
      
      // Create new audio element
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.playsInline = true;
      audioElement.volume = 1.0; // Full volume
      
      // Set sink ID if speaker is selected
      if (this.selectedSpeaker && 'setSinkId' in HTMLAudioElement.prototype) {
        audioElement.setSinkId(this.selectedSpeaker).catch(() => {
          // Silently fail if sink ID cannot be set
        });
      }
      
      // Attach track to audio element
      track.attach(audioElement);
      
      // Store audio element
      this.remoteAudioElements.set(participantIdentity, audioElement);
      
      // Add error listener
      audioElement.addEventListener('error', (e) => {
        console.error('Remote audio error for:', participantIdentity, e);
      });
      
      // Try to play
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Try again after user interaction
          document.addEventListener('click', () => {
            audioElement.play().catch(() => {});
          }, { once: true });
        });
      }
    } catch (error) {
      console.error('Error attaching remote audio track:', error);
    }
  }

  /**
   * Detach and cleanup remote audio track
   */
  detachRemoteAudioTrack(participantIdentity) {
    const audioElement = this.remoteAudioElements.get(participantIdentity);
    if (audioElement) {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.remove();
      this.remoteAudioElements.delete(participantIdentity);
    }
  }

  /**
   * Set speaker device
   */
  async setSpeaker(deviceId) {
    try {
      this.selectedSpeaker = deviceId;

      // Update audio output for all existing remote audio elements
      if ('setSinkId' in HTMLAudioElement.prototype) {
        this.remoteAudioElements.forEach((audioElement) => {
          audioElement.setSinkId(deviceId).catch(() => {
            // Silently fail if sink ID cannot be set
          });
        });
      }
    } catch (error) {
      console.error('Error setting speaker:', error);
      throw error;
    }
  }

  /**
   * Get selected audio devices
   */
  getSelectedDevices() {
    return {
      microphone: this.selectedMicrophone,
      speaker: this.selectedSpeaker
    };
  }

}

// Export singleton instance
const svLiveKitService = new SVLiveKitService();
// Expose LiveKit service globally for runtime diagnostics and forced connects from the browser console/tests.
// This does not change module exports but allows runtime code to call svLiveKitService.connect(token, room).
window.svLiveKitService = svLiveKitService;
window.svWebSocketService = svWebSocketService;
export default svLiveKitService;
