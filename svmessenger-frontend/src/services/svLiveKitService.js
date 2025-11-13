/**
 * LiveKit Service за SVMessenger voice & video calls
 * Управлява Room connection, audio/video tracks и event handling
 */

import { Room, RoomEvent, Track, LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
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

    // Video state
    this.selectedCamera = null;
    this.videoStream = null;
    this.localVideoTrack = null;
    this.remoteVideoElements = new Map(); // Store video elements for remote tracks
    this.isVideoEnabled = false;

    // Adaptive video quality
    this.connectionQuality = 'excellent'; // excellent, good, poor, unknown
    this.currentVideoQuality = 'high'; // high, medium, low
    this.videoQualityPresets = {
      high: {
        width: 1280,
        height: 720,
        frameRate: 30,
        bitrate: 2000000, // 2 Mbps
        label: 'Високо (720p)'
      },
      medium: {
        width: 640,
        height: 480,
        frameRate: 24,
        bitrate: 800000, // 800 Kbps
        label: 'Средно (480p)'
      },
      low: {
        width: 320,
        height: 240,
        frameRate: 15,
        bitrate: 300000, // 300 Kbps
        label: 'Ниско (240p)'
      }
    };

    // Event callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onParticipantConnected = null;
    this.onParticipantDisconnected = null;
    this.onTrackSubscribed = null;
    this.onTrackUnsubscribed = null;
    this.onConnectionQualityChanged = null; // Callback for quality changes
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

      // Monitor connection quality for adaptive video
      this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        // Only handle our own connection quality
        if (!participant || participant === this.room.localParticipant) {
          this.handleConnectionQualityChanged(quality);
        }
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

      // Clean up all remote video elements
      this.remoteVideoElements.forEach((video, participantIdentity) => {
        this.detachRemoteVideoTrack(participantIdentity);
      });
      this.remoteVideoElements.clear();

      // Stop video stream
      this.stopVideoStream();

      // Reset video state
      this.isVideoEnabled = false;
      this.localVideoTrack = null;

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
      speaker: this.selectedSpeaker,
      camera: this.selectedCamera
    };
  }

  // ========== VIDEO METHODS ==========

  /**
   * Toggle camera on/off during active call
   * COST OPTIMIZATION: Unpublishes video track when disabled to save money
   * @param {boolean} enabled - true to enable, false to disable
   * @returns {Promise<boolean>} success
   */
  async toggleCamera(enabled) {
    if (!this.room || !this.isConnected) {
      console.warn('⚠️ Cannot toggle camera - not in a call');
      return false;
    }

    try {
      if (enabled) {
        // Enable camera - publishes video track (starts billing as video call)
        // Determine appropriate quality based on current connection
        const initialQuality = this.connectionQuality === 'excellent' || this.connectionQuality === 'good'
          ? 'high'
          : this.connectionQuality === 'poor'
          ? 'medium'
          : 'low';

        const preset = this.videoQualityPresets[initialQuality];

        await this.room.localParticipant.setCameraEnabled(true, {
          resolution: {
            width: preset.width,
            height: preset.height,
            frameRate: preset.frameRate
          }
        });

        this.isVideoEnabled = true;
        this.currentVideoQuality = initialQuality;
        console.log(`✅ Camera enabled with ${preset.label} - now billing as video call`);
      } else {
        // Disable camera - UNPUBLISHES video track (saves costs)
        await this.room.localParticipant.setCameraEnabled(false);
        this.isVideoEnabled = false;
        console.log('✅ Camera disabled - now billing as audio-only call');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to toggle camera:', error);
      return false;
    }
  }

  /**
   * Check if camera is currently enabled
   */
  isCameraEnabled() {
    if (!this.room || !this.isConnected) return false;
    return this.room.localParticipant.isCameraEnabled || false;
  }

  /**
   * Enumerate available cameras
   */
  async getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');

      // Auto-select first camera if none selected
      if (cameras.length > 0 && !this.selectedCamera) {
        this.selectedCamera = cameras[0].deviceId;
      }

      return cameras;
    } catch (error) {
      console.error('❌ Failed to enumerate cameras:', error);
      return [];
    }
  }

  /**
   * Switch camera device (mid-call)
   * @param {string} deviceId - Camera device ID
   */
  async switchCamera(deviceId) {
    if (!this.room || !this.isConnected) {
      // Just store the selection for later
      this.selectedCamera = deviceId;
      return false;
    }

    try {
      // LiveKit's built-in method handles track switching
      await this.room.localParticipant.switchActiveDevice('videoinput', deviceId);
      this.selectedCamera = deviceId;
      console.log('✅ Switched to camera:', deviceId);
      return true;
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
      return false;
    }
  }

  /**
   * Attach remote video track to HTML element
   * @param {Track} track - Remote video track
   * @param {string} participantIdentity - Participant identity
   * @returns {HTMLVideoElement} Video element
   */
  attachRemoteVideoTrack(track, participantIdentity) {
    try {
      // Remove existing video element for this participant if any
      this.detachRemoteVideoTrack(participantIdentity);

      // Create new video element
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = false;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.style.backgroundColor = '#000';

      // Attach track
      track.attach(videoElement);

      // Store reference
      this.remoteVideoElements.set(participantIdentity, { element: videoElement, track });

      console.log('✅ Remote video attached for:', participantIdentity);
      return videoElement;
    } catch (error) {
      console.error('❌ Error attaching remote video track:', error);
      return null;
    }
  }

  /**
   * Detach remote video track
   * @param {string} participantIdentity - Participant identity
   */
  detachRemoteVideoTrack(participantIdentity) {
    const video = this.remoteVideoElements.get(participantIdentity);
    if (video) {
      video.track.detach(video.element);
      video.element.remove();
      this.remoteVideoElements.delete(participantIdentity);
      console.log('✅ Remote video detached for:', participantIdentity);
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      this.videoStream = stream;

      // Get available cameras
      await this.getCameras();

      return true;
    } catch (error) {
      console.error('❌ Camera permissions denied:', error);
      throw error;
    }
  }

  /**
   * Stop video stream
   */
  stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  // ========== ADAPTIVE VIDEO QUALITY METHODS ==========

  /**
   * Handle connection quality changes from LiveKit
   * Automatically adjusts video quality based on network conditions
   * @param {string} quality - LiveKit quality: 'excellent', 'good', 'poor'
   */
  async handleConnectionQualityChanged(quality) {
    const oldQuality = this.connectionQuality;
    this.connectionQuality = quality;

    console.log(`📡 Connection quality changed: ${oldQuality} → ${quality}`);

    // Map LiveKit quality to our video quality presets
    let targetVideoQuality;

    if (quality === 'excellent' || quality === 'good') {
      targetVideoQuality = 'high';
    } else if (quality === 'poor') {
      targetVideoQuality = 'medium';
    } else {
      // 'unknown' or any degraded state
      targetVideoQuality = 'low';
    }

    // Only adjust if video is enabled and quality changed
    if (this.isVideoEnabled && targetVideoQuality !== this.currentVideoQuality) {
      console.log(`🎥 Adjusting video quality: ${this.currentVideoQuality} → ${targetVideoQuality}`);
      await this.adjustVideoQuality(targetVideoQuality);
    }

    // Notify callback if set
    if (this.onConnectionQualityChanged) {
      this.onConnectionQualityChanged(quality, targetVideoQuality);
    }
  }

  /**
   * Adjust video quality to a specific preset
   * @param {string} quality - Quality preset: 'high', 'medium', 'low'
   */
  async adjustVideoQuality(quality) {
    if (!this.room || !this.isConnected || !this.isVideoEnabled) {
      console.warn('⚠️ Cannot adjust video quality - not in video call');
      return false;
    }

    if (!this.videoQualityPresets[quality]) {
      console.error('❌ Invalid video quality preset:', quality);
      return false;
    }

    try {
      const preset = this.videoQualityPresets[quality];
      const localParticipant = this.room.localParticipant;

      // Get the current video track publication
      const videoTrackPublications = Array.from(localParticipant.videoTrackPublications.values());
      if (videoTrackPublications.length === 0) {
        console.warn('⚠️ No video track to adjust');
        return false;
      }

      const videoPublication = videoTrackPublications[0];
      if (!videoPublication.track) {
        console.warn('⚠️ Video track not available');
        return false;
      }

      // Update video encoding parameters
      await videoPublication.track.setVideoQuality({
        width: preset.width,
        height: preset.height,
        frameRate: preset.frameRate,
        maxBitrate: preset.bitrate
      });

      this.currentVideoQuality = quality;
      console.log(`✅ Video quality adjusted to ${preset.label}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to adjust video quality:', error);
      return false;
    }
  }

  /**
   * Get current video quality info
   * @returns {object} Quality info
   */
  getVideoQualityInfo() {
    const preset = this.videoQualityPresets[this.currentVideoQuality];
    return {
      connectionQuality: this.connectionQuality,
      videoQuality: this.currentVideoQuality,
      preset: preset,
      isVideoEnabled: this.isVideoEnabled
    };
  }

  /**
   * Manually set video quality (override automatic adjustment)
   * @param {string} quality - Quality preset: 'high', 'medium', 'low'
   */
  async setVideoQuality(quality) {
    if (!this.videoQualityPresets[quality]) {
      console.error('❌ Invalid video quality:', quality);
      return false;
    }

    console.log(`🎬 Manually setting video quality to ${quality}`);
    return await this.adjustVideoQuality(quality);
  }

}

// Export singleton instance
const svLiveKitService = new SVLiveKitService();
// Expose LiveKit service globally for runtime diagnostics and forced connects from the browser console/tests.
// This does not change module exports but allows runtime code to call svLiveKitService.connect(token, room).
window.svLiveKitService = svLiveKitService;
window.svWebSocketService = svWebSocketService;
export default svLiveKitService;
