/**
 * Sound Service Stub
 * Управление на звуци за съобщения и обаждания
 * Временно премахнат поради несъвместимост с React Native 0.83.0
 */

class SoundService {
  private isEnabled: boolean = true;
  private volume: number = 0.8;

  playMessageSound() {
    console.log('🔇 Sound disabled: message sound');
  }

  playIncomingCallSound() {
    console.log('🔇 Sound disabled: incoming call sound');
  }

  stopIncomingCallSound() {
    console.log('🔇 Sound disabled: stop incoming call sound');
  }

  playOutgoingCallSound() {
    console.log('🔇 Sound disabled: outgoing call sound');
  }

  stopOutgoingCallSound() {
    console.log('🔇 Sound disabled: stop outgoing call sound');
  }

  // Legacy methods for backward compatibility
  playCallSound() {
    this.playIncomingCallSound();
  }

  stopCallSound() {
    this.stopIncomingCallSound();
    this.stopOutgoingCallSound();
  }

  playSound(soundType: string) {
    console.log(`🔇 Sound disabled: ${soundType}`);
  }

  stopSound(soundType: string) {
    console.log(`🔇 Sound disabled: stop ${soundType}`);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
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

  cleanup() {
    // No-op
  }
}

// Singleton instance
export const soundService = new SoundService();
export default soundService;

