/**
 * Sound Service
 * Управление на звуци за съобщения и обаждания
 */

import { Platform } from 'react-native';
import Sound from 'react-native-sound';

// Initialize sound system
Sound.setCategory('Playback');

class SoundService {
  private messageSound: Sound | null = null;
  private incomingCallSound: Sound | null = null;
  private outgoingCallSound: Sound | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.8;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    // Load message sound - използваме s1.mp3 като в web версията
    this.messageSound = new Sound(
      Platform.OS === 'ios' ? 's1.mp3' : 's1.mp3',
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log('Failed to load message sound:', error);
          this.messageSound = null;
        } else {
          console.log('✅ Message sound loaded: s1.mp3');
        }
      }
    );

    // Load incoming call sound - използваме IncomingCall.mp3 като в web версията
    this.incomingCallSound = new Sound(
      Platform.OS === 'ios' ? 'IncomingCall.mp3' : 'IncomingCall.mp3',
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log('Failed to load incoming call sound:', error);
          this.incomingCallSound = null;
        } else {
          console.log('✅ Incoming call sound loaded: IncomingCall.mp3');
          // Set to loop for incoming calls
          this.incomingCallSound?.setNumberOfLoops(-1);
        }
      }
    );

    // Load outgoing call sound - използваме OutCall.mp3 като в web версията
    this.outgoingCallSound = new Sound(
      Platform.OS === 'ios' ? 'OutCall.mp3' : 'OutCall.mp3',
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log('Failed to load outgoing call sound:', error);
          this.outgoingCallSound = null;
        } else {
          console.log('✅ Outgoing call sound loaded: OutCall.mp3');
          // Set to loop for outgoing calls
          this.outgoingCallSound?.setNumberOfLoops(-1);
        }
      }
    );
  }

  playMessageSound() {
    if (!this.isEnabled || !this.messageSound) return;

    this.messageSound.setVolume(this.volume);
    this.messageSound.play((success) => {
      if (!success) {
        console.log('Failed to play message sound');
      }
    });
  }

  playIncomingCallSound() {
    if (!this.isEnabled || !this.incomingCallSound) return;

    // Stop outgoing call sound if playing
    this.stopOutgoingCallSound();

    this.incomingCallSound.setVolume(this.volume);
    this.incomingCallSound.play((success) => {
      if (!success) {
        console.log('Failed to play incoming call sound');
      }
    });
  }

  stopIncomingCallSound() {
    if (this.incomingCallSound) {
      this.incomingCallSound.stop();
    }
  }

  playOutgoingCallSound() {
    if (!this.isEnabled || !this.outgoingCallSound) return;

    // Stop incoming call sound if playing
    this.stopIncomingCallSound();

    this.outgoingCallSound.setVolume(this.volume);
    this.outgoingCallSound.play((success) => {
      if (!success) {
        console.log('Failed to play outgoing call sound');
      }
    });
  }

  stopOutgoingCallSound() {
    if (this.outgoingCallSound) {
      this.outgoingCallSound.stop();
    }
  }

  // Legacy methods for backward compatibility
  playCallSound() {
    // Default to incoming call sound
    this.playIncomingCallSound();
  }

  stopCallSound() {
    // Stop both call sounds
    this.stopIncomingCallSound();
    this.stopOutgoingCallSound();
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.messageSound) {
      this.messageSound.setVolume(this.volume);
    }
    if (this.incomingCallSound) {
      this.incomingCallSound.setVolume(this.volume);
    }
    if (this.outgoingCallSound) {
      this.outgoingCallSound.setVolume(this.volume);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  cleanup() {
    if (this.messageSound) {
      this.messageSound.release();
      this.messageSound = null;
    }
    if (this.incomingCallSound) {
      this.incomingCallSound.release();
      this.incomingCallSound = null;
    }
    if (this.outgoingCallSound) {
      this.outgoingCallSound.release();
      this.outgoingCallSound = null;
    }
  }
}

// Singleton instance
export const soundService = new SoundService();
export default soundService;

