const VIEW_KEY_PREFIX = "sv:signal-view:";

/** Returns true if a view should be recorded (first time this session). */
export function shouldRecordSignalView(signalId: number): boolean {
  if (typeof sessionStorage === "undefined") return true;
  const key = `${VIEW_KEY_PREFIX}${signalId}`;
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, "1");
  return true;
}
