/** Legacy SVMessenger breakpoint — FAB on ≤768 opens APK download instead of chat. */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}
