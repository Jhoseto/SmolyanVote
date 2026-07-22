const DRAFT_KEY = "smolyanvote:signal-create-draft";

export interface SignalCreateDraft {
  title: string;
  description: string;
  category?: string;
  expirationDays: number;
  latitude?: number;
  longitude?: number;
  savedAt: string;
}

export function loadSignalCreateDraft(): SignalCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SignalCreateDraft;
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
