/**
 * Mobile haptic feedback (V1 `vibrateMobile` / notifications.js parity).
 * No-ops on desktop / unsupported browsers.
 */

const MOBILE_MAX_WIDTH = 768;

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** Short tap — menu / UI feedback (V1 navbar 50ms). */
export function hapticTap(): void {
  if (!isMobileViewport() || !canVibrate()) return;
  navigator.vibrate(50);
}

/** Notification ping (V1 notifications 30ms). */
export function hapticNotify(): void {
  if (!isMobileViewport() || !canVibrate()) return;
  navigator.vibrate(30);
}

/** Important action — vote / confirm (V1 double pulse). */
export function hapticSuccess(): void {
  if (!isMobileViewport() || !canVibrate()) return;
  navigator.vibrate([50, 30, 50]);
}
