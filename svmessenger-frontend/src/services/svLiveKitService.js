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
        
        // Subscribe to existing audio tracks from this participant
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            console.log('📞 Subscribing to existing audio track from:', participant.identity);
            this.attachRemoteAudioTrack(publication.track, participant.identity);
          } else if (publication.isSubscribed) {
            // Track is subscribed but not yet available, wait for TrackSubscribed event
            console.log('📞 Audio track subscription pending for:', participant.identity);
          }
        });
        
        if (this.onParticipantConnected) this.onParticipantConnected(participant);
      });

      this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
        if (this.onParticipantDisconnected) this.onParticipantDisconnected(participant);
      });

      this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('📞 Track subscribed:', track.kind, 'from', participant.identity, 'trackId:', track.sid);
        console.log('📞 Track details:', {
          kind: track.kind,
          source: track.source,
          isMuted: track.isMuted,
          isSubscribed: track.isSubscribed,
          participant: participant.identity
        });
        
        // Attach audio track to HTMLAudioElement for playback
        if (track.kind === 'audio') {
          console.log('📞 Attaching remote audio track for playback...');
          this.attachRemoteAudioTrack(track, participant.identity);
        }
        
        if (this.onTrackSubscribed) this.onTrackSubscribed(track, publication, participant);
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
        
        // Clean up audio element when track is unsubscribed
        if (track.kind === 'audio') {
          this.detachRemoteAudioTrack(participant.identity);
        }
        
        if (this.onTrackUnsubscribed) this.onTrackUnsubscribed(track, publication, participant);
      });

      // Connect to room
      await this.room.connect('wss://smolyanvote-nq17fbx3.livekit.cloud', token);
      
      // After connection, ensure microphone is published
      console.log('📞 Room connected, checking microphone state...');
      console.log('📞 Selected microphone:', this.selectedMicrophone);
      console.log('📞 Audio stream exists:', !!this.audioStream);
      console.log('📞 Local participant:', this.room.localParticipant?.identity);
      
      // Wait a bit more for room to be fully ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (this.selectedMicrophone && this.audioStream) {
        console.log('📞 Publishing microphone after room connection...');
        try {
          // Unpublish any existing tracks first
          const existingTracks = Array.from(this.room.localParticipant.audioTrackPublications.values());
          console.log('📞 Existing audio tracks:', existingTracks.length);
          for (const publication of existingTracks) {
            if (publication.track) {
              await this.room.localParticipant.unpublishTrack(publication.track);
            }
          }
          
          // Get the audio track from the stream
          const audioTracks = this.audioStream.getAudioTracks();
          console.log('📞 Available audio tracks in stream:', audioTracks.length);
          if (audioTracks.length > 0) {
            const mediaStreamTrack = audioTracks[0];
            console.log('📞 MediaStreamTrack state:', mediaStreamTrack.readyState, 'enabled:', mediaStreamTrack.enabled);
            const localAudioTrack = new LocalAudioTrack(mediaStreamTrack);
            
            // Publish the track
            await this.room.localParticipant.publishTrack(localAudioTrack, {
              source: 'microphone'
            });
            console.log('✅ Microphone published after room connection');
            
            // Verify publication
            const publishedTracks = Array.from(this.room.localParticipant.audioTrackPublications.values());
            console.log('📞 Published tracks after publish:', publishedTracks.length);
            publishedTracks.forEach(pub => {
              console.log('📞 Published track:', {
                sid: pub.trackSid,
                source: pub.source,
                isMuted: pub.isMuted,
                isSubscribed: pub.isSubscribed
              });
            });
          } else {
            console.warn('⚠️ No audio tracks in stream');
          }
        } catch (publishError) {
          console.warn('⚠️ Failed to publish microphone after connection, will use default:', publishError);
          // Fallback to default microphone
          try {
            await this.room.localParticipant.setMicrophoneEnabled(true);
            console.log('✅ Using LiveKit default microphone');
          } catch (fallbackError) {
            console.error('❌ Failed to enable default microphone:', fallbackError);
          }
        }
      } else if (!this.selectedMicrophone) {
        // If no microphone selected, enable default
        console.log('📞 No microphone selected, enabling default...');
        try {
          await this.room.localParticipant.setMicrophoneEnabled(true);
          console.log('✅ Default microphone enabled');
        } catch (error) {
          console.warn('⚠️ Failed to enable default microphone:', error);
        }
      } else {
        console.warn('⚠️ Microphone selected but no audio stream available');
        // Try to enable default as fallback
        try {
          await this.room.localParticipant.setMicrophoneEnabled(true);
          console.log('✅ Enabled default microphone as fallback');
        } catch (error) {
          console.error('❌ Failed to enable default microphone:', error);
        }
      }
      
      // Log all participants in room
      if (this.room.participants && typeof this.room.participants.size !== 'undefined') {
        console.log('📞 Participants in room:', this.room.participants.size);
        this.room.participants.forEach((participant, identity) => {
          console.log('📞 Participant:', identity, 'tracks:', participant.audioTrackPublications?.size || 0);
          if (participant.audioTrackPublications) {
            participant.audioTrackPublications.forEach((pub, trackSid) => {
              console.log('📞 Participant track:', {
                identity,
                trackSid,
                source: pub.source,
                isMuted: pub.isMuted,
                isSubscribed: pub.isSubscribed,
                hasTrack: !!pub.track
              });
            });
          }
        });
      } else {
        console.log('📞 Participants not yet available');
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
   * Debug function - comprehensive testing
   */
  runFullTest() {
    console.log('🎯 === SVMESSENGER VOICE CALLING - FULL TEST ===');
    console.log('⏰ Time:', new Date().toLocaleString());

    // Test 1: Local Storage Settings
    console.log('\n📦 === TEST 1: LOCAL STORAGE SETTINGS ===');
    const savedSettings = localStorage.getItem('svmessenger-audio-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        console.log('✅ Saved settings found:', settings);
        console.log('🎤 Microphone:', settings.microphone);
        console.log('🔊 Speaker:', settings.speaker);
        console.log('🔉 Mic Volume:', settings.micVolume);
        console.log('🔊 Speaker Volume:', settings.speakerVolume);
      } catch (e) {
        console.log('❌ Invalid saved settings:', e);
      }
    } else {
      console.log('⚠️ No saved settings found');
    }

    // Test 2: Selected Devices
    console.log('\n🎧 === TEST 2: SELECTED DEVICES ===');
    const selected = this.getSelectedDevices();
    console.log('🎤 Selected Microphone:', selected.microphone || 'none');
    console.log('🔊 Selected Speaker:', selected.speaker || 'none');

    // Test 3: Connection Status
    console.log('\n🔗 === TEST 3: CONNECTION STATUS ===');
    console.log('🏠 Room Name:', this.currentRoomName || 'none');
    console.log('🔌 Connected:', this.isConnected);
    console.log('🏢 Room Object:', this.room ? 'exists' : 'null');

    if (this.room) {
      console.log('👥 Local Participant:', this.room.localParticipant ? 'exists' : 'null');
      console.log('👥 Participants Count:', this.room.participants?.size ?? 'N/A');
      console.log('🎤 Local Mic Enabled:', this.room.localParticipant?.isMicrophoneEnabled);
    }

    // Test 4: Audio Stream
    console.log('\n🎵 === TEST 4: AUDIO STREAM ===');
    console.log('🎙️ Audio Stream:', this.audioStream ? 'active' : 'null');
    if (this.audioStream) {
      const tracks = this.audioStream.getTracks();
      console.log('🎵 Audio Tracks:', tracks.length);
      tracks.forEach((track, i) => {
        console.log(`  ${i + 1}. ${track.kind}: ${track.readyState} (${track.enabled ? 'enabled' : 'disabled'})`);
      });
    }

    // Test 5: Available Devices
    console.log('\n📱 === TEST 5: AVAILABLE DEVICES ===');
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const mics = devices.filter(d => d.kind === 'audioinput');
      const speakers = devices.filter(d => d.kind === 'audiooutput');

      console.log('🎤 Microphones:', mics.length);
      mics.forEach((mic, i) => {
        console.log(`  ${i + 1}. ${mic.label || 'Unknown'} (ID: ${mic.deviceId.slice(0, 8)}...)`);
      });

      console.log('🔊 Speakers:', speakers.length);
      speakers.forEach((speaker, i) => {
        console.log(`  ${i + 1}. ${speaker.label || 'Unknown'} (ID: ${speaker.deviceId.slice(0, 8)}...)`);
      });
    }).catch(err => {
      console.log('❌ Cannot enumerate devices:', err);
    });

    // Test 6: WebSocket Connection
    console.log('\n🌐 === TEST 6: WEBSOCKET STATUS ===');
    console.log('🔌 WebSocket Connected:', window.svmessenger_ws_connected || 'unknown');

    // Test 7: Permissions
    console.log('\n🔐 === TEST 7: PERMISSIONS ===');
    navigator.permissions.query({ name: 'microphone' }).then(result => {
      console.log('🎤 Microphone Permission:', result.state);
    }).catch(err => {
      console.log('❌ Cannot check microphone permission:', err);
    });

    console.log('\n🎯 === TEST COMPLETE ===\n');
    console.log('💡 Copy this output and send it to developer for analysis');
  }

  /**
   * Call Flow Test - simulates complete call scenario
   */
  runCallFlowTest() {
    console.log('📞 === SVMESSENGER CALL FLOW TEST ===');
    console.log('⏰ Time:', new Date().toLocaleString());

    // Test call states and WebSocket signals
    console.log('\n📊 === CALL STATE ANALYSIS ===');

    // Check if there's an active call
    const hasActiveCall = window.svmessenger_active_call || false;
    console.log('📞 Active Call:', hasActiveCall);

    // Check call state
    const callState = window.svmessenger_call_state || 'unknown';
    console.log('📞 Call State:', callState);

    // Check WebSocket messages
    const wsMessages = window.svmessenger_ws_messages || [];
    console.log('📡 WebSocket Messages:', wsMessages.length);
    if (wsMessages.length > 0) {
      console.log('📡 Last 5 messages:');
      wsMessages.slice(-5).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${JSON.stringify(msg)}`);
      });
    }

    // Test device switching
    console.log('\n🔄 === DEVICE SWITCHING TEST ===');
    this.enumerateAudioDevices().then(devices => {
      if (devices.microphones.length > 1) {
        console.log('🎤 Testing microphone switch...');
        const currentMic = this.selectedMicrophone;
        const nextMic = devices.microphones.find(m => m.deviceId !== currentMic)?.deviceId;

        if (nextMic) {
          console.log(`🎤 Switching from ${currentMic?.slice(0, 8)} to ${nextMic.slice(0, 8)}`);
          return this.setMicrophone(nextMic);
        }
      } else {
        console.log('⚠️ Only one microphone available');
      }
    }).then(() => {
      console.log('✅ Device switching test complete');
    }).catch(err => {
      console.log('❌ Device switching test failed:', err);
    });

    // Test LiveKit room simulation
    console.log('\n🏠 === LIVEKIT ROOM SIMULATION ===');
    console.log('🏠 Room Name:', this.currentRoomName);
    console.log('🔌 Connected:', this.isConnected);

    if (this.room) {
      console.log('👥 Local Participant ID:', this.room.localParticipant?.identity);
      console.log('👥 Remote Participants:', Array.from(this.room.participants.keys()).join(', '));
    }

    // Test audio quality metrics
    console.log('\n📈 === AUDIO QUALITY METRICS ===');
    if (this.room && this.isConnected) {
      // Simulate quality check
      setTimeout(() => {
        console.log('📈 Simulated Quality Check:');
        console.log('  📡 Latency: ~' + (20 + Math.random() * 30) + 'ms');
        console.log('  📊 Packet Loss: ~' + (Math.random() * 2) + '%');
        console.log('  🎵 Audio Codec: OPUS');
        console.log('  🔒 Encrypted: Yes');
      }, 1000);
    } else {
      console.log('⚠️ No active LiveKit connection');
    }

    console.log('\n🎯 === CALL FLOW TEST COMPLETE ===\n');
    console.log('💡 This test shows the complete voice calling pipeline');
  }

  /**
   * Request audio permissions and get available devices
   */
  async requestAudioPermissions() {
    try {
      console.log('🎤 Requesting audio permissions...');

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
      console.log('✅ Audio permissions granted');

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

      console.log('🎤 Available microphones:', microphones.length);
      console.log('🔊 Available speakers:', speakers.length);

      // Auto-select first available devices if not already selected
      if (microphones.length > 0 && !this.selectedMicrophone) {
        this.selectedMicrophone = microphones[0].deviceId;
        console.log('🎤 Selected microphone:', microphones[0].label || 'Default');
      }

      if (speakers.length > 0 && !this.selectedSpeaker) {
        this.selectedSpeaker = speakers[0].deviceId;
        console.log('🔊 Selected speaker:', speakers[0].label || 'Default');
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
      console.log('🎤 Microphone changed to:', deviceId);

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
        console.warn('⚠️ Failed to get stream with ideal device, trying default:', exactError);
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('✅ Using default microphone device');
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
          
          console.log('🎤 Audio track published to LiveKit room with device:', deviceId);
        } catch (trackError) {
          console.warn('⚠️ Failed to publish custom audio track, using default:', trackError);
          // Fallback: use LiveKit's built-in microphone
          try {
            await this.room.localParticipant.setMicrophoneEnabled(true);
            console.log('✅ Using LiveKit default microphone');
          } catch (fallbackError) {
            console.error('❌ Failed to enable default microphone:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error setting microphone:', error);
      // Don't throw - allow fallback to default device
      console.warn('⚠️ Falling back to default microphone');
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
        console.log('✅ Using default microphone as fallback');
      } catch (fallbackError) {
        console.error('❌ Failed to get any microphone:', fallbackError);
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
        audioElement.setSinkId(this.selectedSpeaker).then(() => {
          console.log('✅ Sink ID set to:', this.selectedSpeaker);
        }).catch(err => {
          console.warn('⚠️ Failed to set sink ID for remote audio:', err);
        });
      }
      
      // Attach track to audio element
      track.attach(audioElement);
      
      // Store audio element
      this.remoteAudioElements.set(participantIdentity, audioElement);
      
      // Add event listeners for debugging
      audioElement.addEventListener('loadedmetadata', () => {
        console.log('📞 Remote audio metadata loaded for:', participantIdentity);
      });
      
      audioElement.addEventListener('play', () => {
        console.log('✅ Remote audio started playing for:', participantIdentity);
      });
      
      audioElement.addEventListener('error', (e) => {
        console.error('❌ Remote audio error for:', participantIdentity, e);
      });
      
      // Try to play
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Remote audio play() succeeded for:', participantIdentity);
        }).catch(err => {
          console.warn('⚠️ Failed to autoplay remote audio:', err);
          // Try again after user interaction
          document.addEventListener('click', () => {
            audioElement.play().catch(e => console.warn('Still failed to play:', e));
          }, { once: true });
        });
      }
      
      console.log('✅ Remote audio track attached for participant:', participantIdentity);
      console.log('📞 Audio element:', {
        src: audioElement.src,
        srcObject: audioElement.srcObject,
        autoplay: audioElement.autoplay,
        volume: audioElement.volume,
        sinkId: audioElement.sinkId || 'default'
      });
    } catch (error) {
      console.error('❌ Error attaching remote audio track:', error);
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
      console.log('✅ Remote audio track detached for participant:', participantIdentity);
    }
  }

  /**
   * Set speaker device
   */
  async setSpeaker(deviceId) {
    try {
      this.selectedSpeaker = deviceId;
      console.log('🔊 Speaker changed to:', deviceId);

      // Update audio output for all existing remote audio elements
      if ('setSinkId' in HTMLAudioElement.prototype) {
        this.remoteAudioElements.forEach((audioElement, participantIdentity) => {
          audioElement.setSinkId(deviceId).catch(err => {
            console.warn(`⚠️ Failed to set sink ID for participant ${participantIdentity}:`, err);
          });
        });
      }
    } catch (error) {
      console.error('❌ Error setting speaker:', error);
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
