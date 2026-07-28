const DRAFT_KEY = "smolyanvote:signal-create-draft";

export interface SignalCreateDraft {
  title: string;
  description: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  savedAt: string;
}

export function loadSignalCreateDraft(): SignalCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SignalCreateDraft>;
    if (!parsed.title?.trim() && !parsed.description?.trim() && !parsed.category) return null;
    return {
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      category: parsed.category,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveSignalCreateDraft(draft: Omit<SignalCreateDraft, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
  } catch {
    // quota exceeded — ignore
  }
}

export function clearSignalCreateDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export function hasSignalCreateDraft(): boolean {
  return loadSignalCreateDraft() != null;
}
