const KEY_PREFIX = "sv_podcast_listened_";

/**
 * Backend `POST /episodes/{id}/increment-listen` has no server-side dedupe
 * (always +1) — legacy double-counts on load+play. We dedupe client-side,
 * once per episode per browser session, per MODERN_FRONTEND_PLAN §Фаза 6.
 */
export function hasListenedThisSession(episodeId: number): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(KEY_PREFIX + episodeId) === "1";
}

export function markEpisodeListened(episodeId: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY_PREFIX + episodeId, "1");
}
