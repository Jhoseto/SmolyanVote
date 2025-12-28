/**
 * Sound Service
 * Управление на звуци за съобщения и обаждания
 * Използва Android SoundPool за възпроизвеждане на звуци от res/raw
 */

import { Platform } from 'react-native';
import { NativeModules } from 'react-native';

// Native module за Android звуци
const { SoundModule } = NativeModules;

class SoundService {
  private isEnabled: boolean = true;
  private volume: number = 0.8;
  private currentCallSoundId: number | null = null;

  private async playAndroidSound(soundName: string, loop: boolean = false): Promise<number | null> {
    if (!this.isEnabled || Platform.OS !== 'android') {
      return null;
    }

    try {
      if (SoundModule) {
        const soundId = await SoundModule.playSound(soundName, this.volume, loop);
        return soundId;
      } else {
        console.warn('⚠️ SoundModule not available');
        return null;
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      return null;
    }
  }

  private async stopAndroidSound(soundId: number | null) {
    if (Platform.OS !== 'android' || !soundId) {
      return;
    }

    try {
      if (SoundModule) {
        await SoundModule.stopSound(soundId);
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }

  async playMessageSound() {
    if (!this.isEnabled) return;
    
    if (Platform.OS === 'android') {
      // Използва s1.mp3 за съобщения
      await this.playAndroidSound('s1', false);
    } else {
      console.log('🔇 Message sound (iOS not implemented)');
    }
  }

  async playIncomingCallSound() {
    if (!this.isEnabled) return;
    
    if (Platform.OS === 'android') {
      // Използва incoming_call.mp3 и го пуска в loop
      const soundId = await this.playAndroidSound('incoming_call', true);
      this.currentCallSoundId = soundId;
    } else {
      console.log('🔇 Incoming call sound (iOS not implemented)');
    }
  }

  async stopIncomingCallSound() {
    if (this.currentCallSoundId !== null) {
      await this.stopAndroidSound(this.currentCallSoundId);
      this.currentCallSoundId = null;
    }
  }

  async playOutgoingCallSound() {
    if (!this.isEnabled) return;
    
    if (Platform.OS === 'android') {
      // Използва out_call.mp3 и го пуска в loop
      const soundId = await this.playAndroidSound('out_call', true);
      this.currentCallSoundId = soundId;
    } else {
      console.log('🔇 Outgoing call sound (iOS not implemented)');
    }
  }

  async stopOutgoingCallSound() {
    if (this.currentCallSoundId !== null) {
      await this.stopAndroidSound(this.currentCallSoundId);
      this.currentCallSoundId = null;
    }
  }

  // Legacy methods for backward compatibility
  async playCallSound() {
    await this.playIncomingCallSound();
  }

  async stopCallSound() {
    await this.stopIncomingCallSound();
    await this.stopOutgoingCallSound();
  }

  async playSound(soundType: string) {
    if (soundType === 'notification' || soundType === 'message') {
      await this.playMessageSound();
    } else if (soundType === 'incoming_call') {
      await this.playIncomingCallSound();
    } else if (soundType === 'outgoing_call') {
      await this.playOutgoingCallSound();
    } else {
      console.log(`🔇 Unknown sound type: ${soundType}`);
    }
  }

  async stopSound(soundType: string) {
    if (soundType === 'incoming_call') {
      await this.stopIncomingCallSound();
    } else if (soundType === 'outgoing_call') {
      await this.stopOutgoingCallSound();
    } else if (soundType === 'call') {
      await this.stopCallSound();
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      // Stop sounds asynchronously without blocking
      this.stopCallSound().catch(err => console.error('Error stopping sounds:', err));
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  async cleanup() {
    await this.stopCallSound();
  }
}

// Singleton instance
export const soundService = new SoundService();
export default soundService;

