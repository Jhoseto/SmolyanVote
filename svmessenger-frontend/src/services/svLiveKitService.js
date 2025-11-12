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
      console.log('👥 Participants Count:', this.room.participants.size);
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
   * Get local participant
   */
  getLocalParticipant() {
    if (!this.room) return null;
    return this.room.localParticipant;
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
   * Set speaker device
   */
  async setSpeaker(deviceId) {
    try {
      this.selectedSpeaker = deviceId;
      console.log('🔊 Speaker changed to:', deviceId);

      // Update audio output if supported
      if ('setSinkId' in HTMLAudioElement.prototype) {
        // This would apply to all audio elements in the room
        // LiveKit handles this internally, but we can store preference
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

  /**
   * Cleanup audio resources
   */
  cleanupAudio() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
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

// Export WebSocket service globally for console debugging
window.svWebSocketService = svWebSocketService;

// Export LiveKit service globally for console debugging and runtime forcing
// This allows runtime code (tests/console) to access the singleton and trigger connect/disconnect.
// NOTE: This does not change exported default - it only exposes the instance on window for runtime use.
// We add this to help diagnostics and to support a safe runtime fallback without changing React state.
// ... existing code ...

// Debug/Test functions for voice calling
window.SVMessengerVoiceTest = {
  // Full diagnostic function
  runFullDiagnostic: () => {
    console.log('🚀 Starting Full Voice Calling Diagnostic...');

    // Check WebSocket connection
    console.log('📡 WebSocket Status:', window.svmessenger_ws_connected ? 'CONNECTED' : 'DISCONNECTED');

    // Check call state
    const callState = window.svmessenger_call_state || 'unknown';
    console.log('📞 Call State:', callState);

    // Check active call
    const activeCall = window.svmessenger_active_call;
    console.log('📞 Active Call:', activeCall);

    // Check tokens
    const tokens = {
      reactToken: window.SVMessengerContext?.liveKitToken,
      windowToken1: window.__sv_livekit_token,
      windowToken2: window.liveKitToken
    };
    console.log('🔑 Available Tokens:', tokens);

    // Check LiveKit connection
    if (window.SVMessengerVoiceTest.checkLiveKitStatus) {
      window.SVMessengerVoiceTest.checkLiveKitStatus();
    }

    // Check WebSocket messages
    if (window.svmessenger_ws_messages) {
      console.log('📨 Recent WS Messages:', window.svmessenger_ws_messages.slice(-5));
    }

    return {
      wsConnected: window.svmessenger_ws_connected,
      callState,
      activeCall,
      tokens,
      wsMessages: window.svmessenger_ws_messages?.slice(-5) || []
    };
  },
    // Test 1: Check current LiveKit status
    checkLiveKitStatus: () => {
        console.log('🔍 LiveKit Status Check:');
        console.log('- Is Connected:', svLiveKitService.isConnected);
        console.log('- Current Room:', svLiveKitService.currentRoomName);
        console.log('- Local Participant:', svLiveKitService.getLocalParticipant());
        console.log('- Participants:', svLiveKitService.getParticipants());
        console.log('- Selected Microphone:', svLiveKitService.selectedMicrophone);
        console.log('- Selected Speaker:', svLiveKitService.selectedSpeaker);
        console.log('- Audio Stream:', svLiveKitService.audioStream ? 'Active' : 'None');
        return {
            connected: svLiveKitService.isConnected,
            room: svLiveKitService.currentRoomName,
            participants: svLiveKitService.getParticipants().length,
            localParticipant: svLiveKitService.getLocalParticipant(),
            selectedMic: svLiveKitService.selectedMicrophone,
            selectedSpeaker: svLiveKitService.selectedSpeaker,
            hasAudioStream: !!svLiveKitService.audioStream
        };
    },

    // Test 2: Check saved audio settings
    checkSavedSettings: () => {
        console.log('🔍 Saved Audio Settings Check:');
        const saved = localStorage.getItem('svmessenger-audio-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                console.log('- Microphone:', settings.microphone);
                console.log('- Speaker:', settings.speaker);
                console.log('- Mic Volume:', settings.micVolume || 'Not set');
                console.log('- Speaker Volume:', settings.speakerVolume || 'Not set');
                return settings;
            } catch (e) {
                console.error('- Error parsing settings:', e);
                return null;
            }
        } else {
            console.log('- No saved settings found');
            return null;
        }
    },

    // Test 3: Enumerate available devices
    enumerateDevices: async () => {
        console.log('🔍 Device Enumeration Test:');
        try {
            await svLiveKitService.requestAudioPermissions();
            const devices = await svLiveKitService.enumerateAudioDevices();
            console.log('Available microphones:', devices.microphones.length);
            console.log('Available speakers:', devices.speakers.length);
            console.table(devices.microphones.map(m => ({ label: m.label, id: m.deviceId })));
            console.table(devices.speakers.map(s => ({ label: s.label, id: s.deviceId })));
            return devices;
        } catch (error) {
            console.error('Device enumeration failed:', error);
            return null;
        }
    },

    // Test 4: Test audio playback (play test tone)
    testAudioPlayback: async () => {
        console.log('🔍 Audio Playback Test:');
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Higher pitch test tone
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
                console.log('✅ Audio playback test completed');
            }, 1000);

            console.log('🔊 Playing test tone for 1 second...');
            return true;
        } catch (error) {
            console.error('❌ Audio playback test failed:', error);
            return false;
        }
    },

    // Test 5: Test microphone input
    testMicrophoneInput: async () => {
        console.log('🔍 Microphone Input Test:');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone access granted');

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            let maxLevel = 0;
            const checkLevels = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                maxLevel = Math.max(maxLevel, average);

                console.log('🎤 Current audio level:', Math.round(average));
            };

            // Check for 3 seconds
            const interval = setInterval(checkLevels, 500);
            setTimeout(() => {
                clearInterval(interval);
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
                console.log('✅ Microphone test completed. Max level detected:', Math.round(maxLevel));
                console.log(maxLevel > 10 ? '🎤 Microphone is working!' : '⚠️ Low microphone input detected');
            }, 3000);

            return true;
        } catch (error) {
            console.error('❌ Microphone test failed:', error);
            return false;
        }
    },

    // Test 6: Clear all saved settings
    clearSavedSettings: () => {
        console.log('🗑️ Clearing saved audio settings...');
        localStorage.removeItem('svmessenger-audio-settings');
        console.log('✅ Saved settings cleared');
    },

    // Test 7: Full voice calling diagnostic
    runFullDiagnostic: async () => {
        console.log('🚀 Starting Full Voice Calling Diagnostic...');
        console.log('=====================================');

        // 1. Check saved settings
        console.log('\n1️⃣ SAVED SETTINGS:');
        const savedSettings = window.SVMessengerVoiceTest.checkSavedSettings();

        // 2. Check LiveKit status
        console.log('\n2️⃣ LIVEKIT STATUS:');
        const liveKitStatus = window.SVMessengerVoiceTest.checkLiveKitStatus();

        // 3. Check WebSocket status
        console.log('\n3️⃣ WEBSOCKET STATUS:');
        const wsStatus = window.SVMessengerVoiceTest.checkWebSocketStatus();

        // 4. Enumerate devices
        console.log('\n4️⃣ AVAILABLE DEVICES:');
        const devices = await window.SVMessengerVoiceTest.enumerateDevices();

        // 5. Test microphone
        console.log('\n5️⃣ MICROPHONE TEST:');
        await window.SVMessengerVoiceTest.testMicrophoneInput();

        // 6. Test speaker
        console.log('\n6️⃣ SPEAKER TEST:');
        await window.SVMessengerVoiceTest.testAudioPlayback();

        console.log('\n=====================================');
        console.log('🎯 DIAGNOSTIC SUMMARY:');
        console.log('- Saved Settings:', savedSettings ? '✅ Available' : '❌ None');
        console.log('- LiveKit Connected:', liveKitStatus.connected ? '✅ Yes' : '❌ No');
        console.log('- WebSocket Connected:', wsStatus ? '✅ Yes' : '❌ No');
        console.log('- Microphone Available:', (devices?.microphones.length || 0) > 0 ? '✅ Yes' : '❌ No');
        console.log('- Speaker Available:', (devices?.speakers.length || 0) > 0 ? '✅ Yes' : '❌ No');
        console.log('- Participants:', liveKitStatus.participants);

        return {
            savedSettings: !!savedSettings,
            liveKitConnected: liveKitStatus.connected,
            webSocketConnected: wsStatus,
            hasMicrophone: (devices?.microphones.length || 0) > 0,
            hasSpeaker: (devices?.speakers.length || 0) > 0,
            participants: liveKitStatus.participants
        };
    },

    // Test 8: Check WebSocket connection status
    checkWebSocketStatus: () => {
        console.log('🔍 WebSocket Status Check:');

        // Check if WebSocket service exists and is connected
        if (typeof window.svWebSocketService !== 'undefined') {
            const isConnected = window.svWebSocketService.isConnected ? window.svWebSocketService.isConnected() : false;
            console.log('- WebSocket Service:', isConnected ? '✅ Connected' : '❌ Disconnected');

            // Check if STOMP client exists
            if (window.svWebSocketService.client) {
                const stompConnected = window.svWebSocketService.client.connected;
                console.log('- STOMP Client:', stompConnected ? '✅ Connected' : '❌ Disconnected');
                return stompConnected;
            } else {
                console.log('- STOMP Client:', '❌ Not found');
                return false;
            }
        } else {
            console.log('- WebSocket Service:', '❌ Not found');
            return false;
        }
    },

    // Test 9: Send test WebSocket signal
    sendTestSignal: () => {
        console.log('🔍 Sending Test WebSocket Signal:');

        const testSignal = {
            eventType: 'TEST_SIGNAL',
            message: 'This is a test signal from console',
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substr(2, 9)
        };

        console.log('Sending signal:', testSignal);

        if (window.svWebSocketService && window.svWebSocketService.sendCallSignal) {
            window.svWebSocketService.sendCallSignal(testSignal);
            console.log('✅ Test signal sent');
        } else {
            console.log('❌ WebSocket service not available');
        }
    },

    // Test 10: Simple WebSocket ping
    pingWebSocket: () => {
        console.log('🏓 Testing WebSocket connection...');

        if (window.svWebSocketService) {
            const isConnected = window.svWebSocketService.isConnected();
            console.log('🏓 WebSocket ping result:', isConnected ? '✅ PONG - Connected' : '❌ PONG - Disconnected');
            return isConnected;
        } else {
            console.log('🏓 WebSocket ping result: ❌ No service');
            return false;
        }
    },

    // Test 11: Check current call state
    checkCallState: () => {
        console.log('📞 Checking current call state...');

        if (window.SVMessengerContext) {
            console.log('📞 Call state available');
        } else {
            console.log('📞 Call state not available');
        }
    }
};

// Export singleton instance
const svLiveKitService = new SVLiveKitService();
// Expose LiveKit service globally for runtime diagnostics and forced connects from the browser console/tests.
// This does not change module exports but allows runtime code to call svLiveKitService.connect(token, room).
window.svLiveKitService = svLiveKitService;
window.svWebSocketService = svWebSocketService;
export default svLiveKitService;
