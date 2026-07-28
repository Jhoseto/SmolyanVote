/**
 * Subsequence scoring — "мар пет" still finds "Мария Петрова".
 * Returns null when the query doesn't match at all; higher score is better.
 */
export function fuzzyScore(text: string, query: string): number | null {
  const haystack = text.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;

  const exact = haystack.indexOf(needle);
  if (exact >= 0) return 1000 - exact;

  let score = 0;
  let cursor = 0;
  let streak = 0;

  for (const char of needle) {
    if (char === " ") continue;
    const found = haystack.indexOf(char, cursor);
    if (found < 0) return null;
    streak = found === cursor ? streak + 1 : 0;
    score += 10 + streak * 4 - Math.min(found - cursor, 8);
    cursor = found + 1;
  }

  return score;
}
