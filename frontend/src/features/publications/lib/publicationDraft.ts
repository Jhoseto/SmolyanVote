import type { PublicationCategory } from "../types";

const DRAFT_KEY = "sv.publication.composer.draft";

export interface PublicationComposerDraft {
  content: string;
  category?: PublicationCategory;
  emotion?: { emoji: string; text: string } | null;
  linkUrl?: string;
  savedAt: number;
}

export function loadPublicationDraft(): PublicationComposerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicationComposerDraft;
    if (!parsed || typeof parsed.content !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePublicationDraft(draft: Omit<PublicationComposerDraft, "savedAt">): void {
  if (typeof window === "undefined") return;
  const payload: PublicationComposerDraft = { ...draft, savedAt: Date.now() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function clearPublicationDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
