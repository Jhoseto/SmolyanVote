/**
 * Sound Service for React Native
 * Управление на звуци за съобщения и обаждания
 * Използва native модул (RNSoundPlayer) за възпроизвеждане на звуци от raw директорията
 * 
 * Native модулът използва Android MediaPlayer за възпроизвеждане на звуците
 */

import { NativeModules, Platform } from 'react-native';

// Native module interface (will be implemented in Android)
interface SoundModule {
  playSound(soundName: string, loop: boolean): Promise<void>;
  stopSound(soundName: string): Promise<void>;
  setVolume(volume: number): Promise<void>;
}

const { RNSoundPlayer } = NativeModules;

class SoundService {
  private isEnabled: boolean = true;
  private volume: number = 0.8;
  private currentIncomingSound: string | null = null;
  private currentOutgoingSound: string | null = null;

  private async callNativeMethod(method: keyof SoundModule, ...args: any[]): Promise<void> {
    if (!this.isEnabled) {
      console.log(`🔇 [SoundService] Sound disabled: ${method}`);
      return;
    }

    if (Platform.OS === 'android' && RNSoundPlayer) {
      try {
        await RNSoundPlayer[method](...args);
      } catch (error) {
        console.error(`❌ [SoundService] Error calling ${method}:`, error);
      }
    } else {
      console.log(`🔇 [SoundService] Native module not available (${Platform.OS})`);
    }
  }

  async playMessageSound(): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔇 [SoundService] Message sound disabled');
      return;
    }

    try {
      await this.callNativeMethod('playSound', 's1.mp3', false);
    } catch (error) {
      // Silently ignore sound errors - not critical
    }
  }

  async playIncomingCallSound() {
    if (!this.isEnabled) {
      console.log('🔇 [SoundService] Incoming call sound disabled');
      return;
    }

    this.currentIncomingSound = 'incoming_call.mp3';
    try {
      await this.callNativeMethod('playSound', 'incoming_call.mp3', true);
    } catch (error) {
      console.error('❌ [SoundService] Failed to play incoming call sound:', error);
    }
  }

  async stopIncomingCallSound() {
    if (this.currentIncomingSound) {
      try {
        await this.callNativeMethod('stopSound', this.currentIncomingSound);
      } catch (error) {
        console.error('❌ [SoundService] Failed to stop incoming call sound:', error);
      }
      this.currentIncomingSound = null;
    }
  }

  async playOutgoingCallSound(): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔇 [SoundService] Outgoing call sound disabled');
      return;
    }

    this.currentOutgoingSound = 'out_call.mp3';
    try {
      await this.callNativeMethod('playSound', 'out_call.mp3', true);
    } catch (error) {
      // Silently ignore sound errors - not critical
    }
  }

  async stopOutgoingCallSound() {
    if (this.currentOutgoingSound) {
      try {
        await this.callNativeMethod('stopSound', this.currentOutgoingSound);
      } catch (error) {
        console.error('❌ [SoundService] Failed to stop outgoing call sound:', error);
      }
      this.currentOutgoingSound = null;
    }
  }

  // Legacy methods for backward compatibility
  async playCallSound(): Promise<void> {
    await this.playIncomingCallSound();
  }

  stopCallSound() {
    this.stopIncomingCallSound();
    this.stopOutgoingCallSound();
  }

  async playSound(soundType: string): Promise<void> {
    switch (soundType) {
      case 'incoming':
        await this.playIncomingCallSound();
        break;
      case 'outgoing':
        await this.playOutgoingCallSound();
        break;
      case 'message':
      case 'notification':
        await this.playMessageSound();
        break;
      default:
        console.warn(`⚠️ [SoundService] Unknown sound type: ${soundType}`);
    }
  }

  stopSound(soundType: string) {
    switch (soundType) {
      case 'incoming':
        this.stopIncomingCallSound();
        break;
      case 'outgoing':
        this.stopOutgoingCallSound();
        break;
      default:
        console.warn(`⚠️ [SoundService] Unknown sound type: ${soundType}`);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopCallSound();
    }
  }

  async setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    await this.callNativeMethod('setVolume', this.volume);
  }

  getVolume(): number {
    return this.volume;
  }

  isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  cleanup() {
    this.stopCallSound();
  }
}

// Singleton instance
export const soundService = new SoundService();
export default soundService;

