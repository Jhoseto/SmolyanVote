/**
 * Client-side JWT store. Reuses the mobile auth flow tokens.
 * Kept intentionally tiny — no business logic, only storage access.
 *
 * Backs the login "remember me" toggle: `persist=true` (default) survives
 * browser restarts (localStorage); `persist=false` clears when the tab/
 * browser session ends (sessionStorage). `refreshAccessToken()` in
 * `client.ts` re-reads `isPersistent()` so the choice sticks across silent
 * token refreshes too.
 */
const ACCESS_KEY = "sv_access_token";
const REFRESH_KEY = "sv_refresh_token";

const isBrowser = typeof window !== "undefined";

function read(key: string): string | null {
  if (!isBrowser) return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export const tokenStore = {
  getAccess(): string | null {
    return read(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return read(REFRESH_KEY);
  },
  /** Was the current session stored persistently (remember me = on)? */
  isPersistent(): boolean {
    return isBrowser && window.localStorage.getItem(REFRESH_KEY) !== null;
  },
  set(access: string, refresh?: string, persist = true): void {
    if (!isBrowser) return;
    const target = persist ? window.localStorage : window.sessionStorage;
    const other = persist ? window.sessionStorage : window.localStorage;

    target.setItem(ACCESS_KEY, access);
    other.removeItem(ACCESS_KEY);
    if (refresh) {
      target.setItem(REFRESH_KEY, refresh);
      other.removeItem(REFRESH_KEY);
    }
  },
  clear(): void {
    if (!isBrowser) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  },
};
