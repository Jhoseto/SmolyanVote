/**
 * Next.js sometimes leaves dynamic path segments percent-encoded
 * (common with Cyrillic + spaces). Decode once before API calls /
 * query keys so we never double-encode via `encodeURIComponent`.
 */
export function normalizeUsername(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}
