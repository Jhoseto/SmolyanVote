const STORAGE_KEY = "sv_publications_selected_authors";
const MAX_REMEMBERED = 50;

export interface RememberedAuthor {
  id: number;
  username: string;
  imageUrl: string | null;
}

/**
 * The `userIds` filter (nuqs, URL) only stores ids — display info (username/
 * avatar) for the author chips is cached in localStorage so a shared/reloaded
 * link doesn't just show "#42" chips. Not a source of truth for the filter
 * itself (URL still is) — purely a display cache, per author.
 */
export function loadRememberedAuthors(ids: number[]): RememberedAuthor[] {
  const cache = readCache();
  return ids.map((id) => cache.find((a) => a.id === id) ?? { id, username: `#${id}`, imageUrl: null });
}

export function rememberAuthor(author: RememberedAuthor) {
  if (typeof window === "undefined") return;
  try {
    const next = [author, ...readCache().filter((a) => a.id !== author.id)].slice(0, MAX_REMEMBERED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode/SSR) — chips fall back to "#id" */
  }
}

function readCache(): RememberedAuthor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RememberedAuthor[]) : [];
  } catch {
    return [];
  }
}
