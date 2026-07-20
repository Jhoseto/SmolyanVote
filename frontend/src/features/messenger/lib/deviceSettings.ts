const KEY = "svmessenger-audio-video-settings";
const LEGACY_KEY = "svmessenger-audio-settings";

/** Legacy shape: `{ microphone, speaker, camera }` deviceIds. */
export interface DeviceSettings {
  microphone: string;
  speaker: string;
  camera: string;
}

export function loadDeviceSettings(): DeviceSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceSettings>;
    if (!parsed.microphone || !parsed.speaker) return null;
    return {
      microphone: parsed.microphone,
      speaker: parsed.speaker,
      camera: parsed.camera ?? "",
    };
  } catch {
    return null;
  }
}

export function saveDeviceSettings(settings: DeviceSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function hasDeviceSettings(): boolean {
  return loadDeviceSettings() != null;
}
