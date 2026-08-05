import { getCurrentLanguage } from "./googleTranslate";

type EnableFn = () => void;

declare global {
  interface Window {
    __svEnableGoogleTranslate?: EnableFn;
  }
}

/** True when a non-Bulgarian translation is active — widget must load on boot. */
export function shouldLoadGoogleTranslateOnBoot(): boolean {
  if (typeof document === "undefined") return false;
  return getCurrentLanguage() !== "bg";
}

/** Request the hidden Google Translate script (no-op until provider mounts). */
export function ensureGoogleTranslateLoaded(): void {
  window.__svEnableGoogleTranslate?.();
}
